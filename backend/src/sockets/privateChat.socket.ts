import { Server, Socket } from "socket.io";
import Conversation from "../models/Conversation";
import PrivateMessage from "../models/PrivateMessage";
import Account from "../models/Account";
import Friends from "../models/Friends";
import { Types } from "mongoose";

export const registerPrivateChatSocket = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        const userId = socket.handshake.auth?.userId;
        if (!userId) return;

        socket.join(`user:${userId}`);

        socket.on("pm:list", async (payload: any, cb: Function) => {
            try {
                const limit = payload?.limit || 20;
                const page = payload?.page || 0;

                const convs = await Conversation.find({ participants: userId })
                    .sort({ updatedAt: -1 })
                    .skip(page * limit)
                    .limit(limit)
                    .populate("participants", "name avatar badges")
                    .populate({
                        path: "lastMessage",
                        populate: { path: "sender", select: "name" }
                    });

                cb?.({ ok: true, conversations: convs });
            } catch (err: any) {
                cb?.({ ok: false, error: err.message });
            }
        });

        socket.on("pm:history", async (payload: any, cb: Function) => {
            try {
                let convId = payload.conversationId;
                const otherUserName = payload.otherUserName;
                const limit = payload?.limit || 50;
                const page = payload?.page || 0;

                if (!convId && otherUserName) {
                    const otherUser = await Account.findOne({ name: otherUserName });
                    if (!otherUser) return cb?.({ ok: false, error: "Utilisateur non trouvé" });
                    const otherUserId = (otherUser as { _id: Types.ObjectId })._id;

                    let conv = await Conversation.findOne({
                        participants: { $all: [userId, otherUserId] },
                        $expr: { $eq: [{ $size: "$participants" }, 2] }
                    });

                    if (!conv) {
                        const sender = await Account.findById(userId);
                        if (otherUser.badges?.verified && !sender?.badges?.verified) {
                            return cb?.({ ok: false, error: "Seuls les comptes vérifiés peuvent envoyer un message à un autre compte vérifié" });
                        }
                        conv = new Conversation({ participants: [userId, otherUserId] });
                        await conv.save();
                    }
                    convId = conv._id;
                }

                if (!convId) return cb?.({ ok: false, error: "Conversation manquante" });

                const messages = await PrivateMessage.find({ conversation: convId, isDeleted: false })
                    .sort({ createdAt: -1 })
                    .skip(page * limit)
                    .limit(limit)
                    .populate("sender", "name avatar badges")
                    .populate({
                        path: "replyTo",
                        populate: { path: "sender", select: "name" }
                    });

                cb?.({ ok: true, messages: messages.reverse(), conversationId: convId });
            } catch (err: any) {
                cb?.({ ok: false, error: err.message });
            }
        });

        socket.on("pm:send", async (payload: any, cb: Function) => {
            try {
                const { conversationId, content, image, video, replyTo } = payload;
                const [conv, sender] = await Promise.all([
                    Conversation.findById(conversationId),
                    Account.findById(userId)
                ]);

                if (!conv) return cb?.({ ok: false, error: "Conversation non trouvée" });

                const participantIds = conv.participants.map(p => p.toString());
                const otherUserId = conv.participants.find(p => p.toString() !== userId);
                const recipient = otherUserId ? await Account.findById(otherUserId) : null;

                if (conv.participants.length === 2 && recipient?.badges?.verified && !sender?.badges?.verified && userId !== otherUserId?.toString()) {
                    const hasVerifiedMsg = await PrivateMessage.exists({
                        conversation: conversationId,
                        sender: recipient._id,
                        isDeleted: false
                    });
                    if (!hasVerifiedMsg) {
                        return cb?.({ ok: false, error: "Seuls les comptes vérifiés peuvent envoyer un message à un autre compte vérifié" });
                    }
                }

                if (otherUserId) {
                    const recipientFriends: any = await Friends.findOne({ user: otherUserId });
                    if (recipientFriends?.blocked?.includes(new Types.ObjectId(userId))) {
                        return cb?.({ ok: false, error: "Vous êtes bloqué par cet utilisateur" });
                    }
                    if (recipient?.settings?.messages?.muteNonFriends) {
                        const isFriend = recipientFriends?.list?.some((id: any) => id.toString() === userId);
                        if (!isFriend) {
                            return cb?.({ ok: false, error: "Cet utilisateur n'accepte que les messages d'amis" });
                        }
                    }
                }

                const tier = sender?.premiumTier || (sender?.badges?.premium ? "games_one" : null);
                const allowVideo = !!tier;
                if (video && !allowVideo) {
                    return cb?.({ ok: false, error: "Video reservee aux comptes premium" });
                }

                const msg = new PrivateMessage({
                    conversation: conversationId,
                    sender: userId,
                    content,
                    image,
                    video,
                    replyTo
                });
                await msg.save();

                conv.lastMessage = msg._id as any;
                if (!conv.lastReadAt) conv.lastReadAt = new Map();
                if (!conv.lastReadMessage) conv.lastReadMessage = new Map();
                conv.lastReadAt.set(userId, new Date());
                conv.lastReadMessage.set(userId, msg._id as any);
                await conv.save();

                const populated = await PrivateMessage.findById(msg._id)
                    .populate("sender", "name avatar badges")
                    .populate({
                        path: "replyTo",
                        populate: { path: "sender", select: "name" }
                    });

                participantIds.forEach((pid) => {
                    io.to(`user:${pid}`).emit("pm:message", populated);
                });

                const updatedConv = await Conversation.findById(conversationId)
                    .populate("participants", "name avatar badges")
                    .populate({
                        path: "lastMessage",
                        populate: { path: "sender", select: "name" }
                    });
                participantIds.forEach((pid) => {
                    io.to(`user:${pid}`).emit("pm:updated", updatedConv);
                });

                cb?.({ ok: true, message: populated });
            } catch (err: any) {
                cb?.({ ok: false, error: err.message });
            }
        });

        socket.on("pm:pin", async (payload: any, cb: Function) => {
            try {
                const { conversationId } = payload;
                const conv = await Conversation.findById(conversationId);
                if (!conv) return cb?.({ ok: false, error: "Conversation non trouvée" });

                const isPinned = conv.pinnedBy.some(id => id.toString() === userId);
                if (isPinned) {
                    conv.pinnedBy = conv.pinnedBy.filter(id => id.toString() !== userId);
                } else {
                    conv.pinnedBy.push(new Types.ObjectId(userId));
                }
                await conv.save();

                cb?.({ ok: true, isPinned: !isPinned });
            } catch (err: any) {
                cb?.({ ok: false, error: err.message });
            }
        });

        socket.on("pm:edit", async (payload: any, cb: Function) => {
            try {
                const msg = await PrivateMessage.findById(payload.messageId);
                if (!msg) return cb?.({ ok: false, error: "Message non trouvé" });
                if (msg.sender.toString() !== userId) return cb?.({ ok: false, error: "Non autorisé" });

                msg.content = payload.content;
                msg.isEdited = true;
                await msg.save();

                const conv = await Conversation.findById(msg.conversation);
                conv?.participants.forEach(pId => {
                    io.to(`user:${pId.toString()}`).emit("pm:updated_msg", msg);
                });

                cb?.({ ok: true });
            } catch (err: any) {
                cb?.({ ok: false, error: err.message });
            }
        });

        socket.on("pm:pin_msg", async (payload: any, cb: Function) => {
            try {
                const msg = await PrivateMessage.findById(payload.messageId);
                if (!msg) return cb?.({ ok: false, error: "Message non trouvé" });

                msg.isPinned = !msg.isPinned;
                await msg.save();

                const conv = await Conversation.findById(msg.conversation);
                conv?.participants.forEach(pId => {
                    io.to(`user:${pId.toString()}`).emit("pm:updated_msg", msg);
                });

                cb?.({ ok: true, isPinned: msg.isPinned });
            } catch (err: any) {
                cb?.({ ok: false, error: err.message });
            }
        });


        socket.on("pm:react", async (payload: any, cb: Function) => {
            try {
                const { messageId, emoji } = payload;
                if (!messageId || !emoji) return cb?.({ ok: false, error: "Réaction invalide" });

                const msg = await PrivateMessage.findById(messageId);
                if (!msg || msg.isDeleted) return cb?.({ ok: false, error: "Message non trouvé" });

                const conv = await Conversation.findById(msg.conversation);
                if (!conv || !conv.participants.some(p => p.toString() === userId)) {
                    return cb?.({ ok: false, error: "Non autorisé" });
                }

                const existing = msg.reactions?.find(r => r.emoji === emoji);
                if (!msg.reactions) msg.reactions = [];

                if (!existing) {
                    msg.reactions.push({ emoji, users: [new Types.ObjectId(userId)] } as any);
                } else {
                    const idx = existing.users.findIndex(u => u.toString() === userId);
                    if (idx >= 0) {
                        existing.users.splice(idx, 1);
                    } else {
                        existing.users.push(new Types.ObjectId(userId));
                    }
                    if (existing.users.length === 0) {
                        msg.reactions = msg.reactions.filter(r => r.emoji !== emoji);
                    }
                }

                await msg.save();

                conv.participants.forEach(pId => {
                    io.to(`user:${pId.toString()}`).emit("pm:updated_msg", msg);
                });

                cb?.({ ok: true, message: msg });
            } catch (err: any) {
                cb?.({ ok: false, error: err.message });
            }
        });

        socket.on("pm:delete", async (payload: any, cb: Function) => {
            try {
                const msg = await PrivateMessage.findById(payload.messageId);
                if (!msg) return cb?.({ ok: false, error: "Message non trouvé" });
                if (msg.sender.toString() !== userId) return cb?.({ ok: false, error: "Non autorisé" });

                msg.isDeleted = true;
                await msg.save();

                const conv = await Conversation.findById(msg.conversation);
                conv?.participants.forEach(pId => {
                    io.to(`user:${pId.toString()}`).emit("pm:deleted", { messageId: payload.messageId, conversationId: msg.conversation });
                });

                cb?.({ ok: true });
            } catch (err: any) {
                cb?.({ ok: false, error: err.message });
            }
        });

        socket.on("pm:start", async (payload: any, cb: Function) => {
            try {
                const { target, targets } = payload;

                if (Array.isArray(targets) && targets.length > 0) {
                    const unique = Array.from(new Set(targets.filter((t: string) => !!t)));
                    const resolved = await Promise.all(
                        unique.map(async (t: string) =>
                            Account.findOne({ $or: [{ _id: t.length === 24 ? t : null }, { name: t }] })
                        )
                    );
                    const validUsers = resolved.filter(Boolean) as any[];

                    const participantIds = Array.from(new Set([
                        userId,
                        ...validUsers.map((u) => u._id.toString())
                    ])).filter((id) => id !== userId);

                    if (participantIds.length === 0) {
                        return cb?.({ ok: false, error: "Aucun utilisateur valide" });
                    }

                    const sender = await Account.findById(userId);
                    const hasVerified = validUsers.some((u) => u.badges?.verified);
                    if (hasVerified && !sender?.badges?.verified) {
                        return cb?.({ ok: false, error: "Seuls les comptes vérifiés peuvent envoyer un message à un autre compte vérifié" });
                    }

                    const allIds = [userId, ...participantIds];
                    const existing = await Conversation.findOne({
                        participants: { $all: allIds },
                        $expr: { $eq: [{ $size: "$participants" }, allIds.length] }
                    });

                    if (existing) {
                        const populated = await Conversation.findById(existing._id).populate("participants", "name avatar badges");
                        return cb?.({ ok: true, conversation: populated });
                    }

                    const conv = new Conversation({ participants: allIds });
                    await conv.save();

                    const populated = await Conversation.findById(conv._id).populate("participants", "name avatar badges");
                    return cb?.({ ok: true, conversation: populated });
                }

                if (!target || typeof target !== "string") {
                    return cb?.({ ok: false, error: "Utilisateur non trouvé" });
                }

                let otherUser = await Account.findOne({ $or: [{ _id: target.length === 24 ? target : null }, { name: target }] });

                if (!otherUser) return cb?.({ ok: false, error: "Utilisateur non trouvé" });
                if ((otherUser as any)._id.toString() === userId) return cb?.({ ok: false, error: "Vous ne pouvez pas démarrer une discussion avec vous-même" });

                let conv = await Conversation.findOne({
                    participants: { $all: [userId, (otherUser as any)._id] },
                    $expr: { $eq: [{ $size: "$participants" }, 2] }
                });

                if (!conv) {
                    const sender = await Account.findById(userId);
                    if (otherUser.badges?.verified && !sender?.badges?.verified) {
                        return cb?.({ ok: false, error: "Seuls les comptes vérifiés peuvent envoyer un message à un autre compte vérifié" });
                    }
                    conv = new Conversation({ participants: [userId, (otherUser as any)._id] });
                    await conv.save();
                }

                const populated = await Conversation.findById(conv._id).populate("participants", "name avatar badges");
                cb?.({ ok: true, conversation: populated });
            } catch (err: any) {
                cb?.({ ok: false, error: err.message });
            }
        });

        socket.on("pm:read", async (payload: any, cb: Function) => {
            try {
                const { conversationId } = payload;
                if (!conversationId) return cb?.({ ok: false, error: "Conversation manquante" });

                const conv = await Conversation.findById(conversationId);
                if (!conv || !conv.participants.some(p => p.toString() === userId)) {
                    return cb?.({ ok: false, error: "Non autorisé" });
                }

                if (!conv.lastReadAt) conv.lastReadAt = new Map();
                if (!conv.lastReadMessage) conv.lastReadMessage = new Map();
                conv.lastReadAt.set(userId, new Date());
                if (conv.lastMessage) {
                    conv.lastReadMessage.set(userId, conv.lastMessage as any);
                }
                await conv.save();

                const populated = await Conversation.findById(conversationId)
                    .populate("participants", "name avatar badges")
                    .populate({
                        path: "lastMessage",
                        populate: { path: "sender", select: "name" }
                    });

                if (populated) {
                    populated.participants.forEach((pId: any) => {
                        io.to(`user:${pId._id?.toString() || pId.toString()}`).emit("pm:read_update", populated);
                    });
                }

                cb?.({ ok: true, conversation: populated });
            } catch (err: any) {
                cb?.({ ok: false, error: err.message });
            }
        });
    });
};

