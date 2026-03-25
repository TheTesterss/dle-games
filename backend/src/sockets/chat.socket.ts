import { Server, Socket } from "socket.io";
import ChatMessage from "../models/ChatMessage";
import Account from "../models/Account";

export const registerChatSocket = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        const userId = socket.handshake.auth?.userId;

        socket.on("chat:history", async (payload: any, cb: Function) => {
            try {
                const limit = payload?.limit || 50;
                const page = payload?.page || 0;
                const messages = await ChatMessage.find({ isDeleted: false })
                    .sort({ createdAt: -1 })
                    .skip(page * limit)
                    .limit(limit)
                    .populate("user", "name avatar badges");

                cb?.({ ok: true, messages: messages.reverse() });
            } catch (err: any) {
                cb?.({ ok: false, error: err.message });
            }
        });

        socket.on("chat:message", async (payload: any, cb: Function) => {
            if (!userId) return cb?.({ ok: false, error: "Non connecté" });
            try {
                const msg = new ChatMessage({
                    user: userId,
                    content: payload.content,
                    image: payload.image,
                    video: payload.video,
                });
                await msg.save();
                const populated = await msg.populate("user", "name avatar badges");
                io.emit("chat:message", populated);
                cb?.({ ok: true, message: populated });
            } catch (err: any) {
                cb?.({ ok: false, error: err.message });
            }
        });

        socket.on("chat:pin", async (payload: any, cb: Function) => {
            if (!userId) return cb?.({ ok: false, error: "Non connecté" });
            try {
                const user = await Account.findById(userId);
                if (!user || (!user.badges?.admin && !user.badges?.owner)) {
                    return cb?.({ ok: false, error: "Permissions insuffisantes" });
                }
                const msg = await ChatMessage.findById(payload.messageId);
                if (!msg) return cb?.({ ok: false, error: "Message non trouvé" });

                msg.isPinned = !msg.isPinned;
                msg.pinnedBy = msg.isPinned ? userId : null;
                await msg.save();

                io.emit("chat:updated", msg);
                cb?.({ ok: true, isPinned: msg.isPinned });
            } catch (err: any) {
                cb?.({ ok: false, error: err.message });
            }
        });

        socket.on("chat:edit", async (payload: any, cb: Function) => {
            if (!userId) return cb?.({ ok: false, error: "Non connecté" });
            try {
                const msg = await ChatMessage.findById(payload.messageId);
                if (!msg) return cb?.({ ok: false, error: "Message non trouvé" });
                if (msg.user.toString() !== userId) return cb?.({ ok: false, error: "Non autorisé" });

                msg.content = payload.content;
                msg.isEdited = true;
                await msg.save();

                io.emit("chat:updated", msg);
                cb?.({ ok: true });
            } catch (err: any) {
                cb?.({ ok: false, error: err.message });
            }
        });

        socket.on("chat:delete", async (payload: any, cb: Function) => {
            if (!userId) return cb?.({ ok: false, error: "Non connecté" });
            try {
                const msg = await ChatMessage.findById(payload.messageId);
                if (!msg) return cb?.({ ok: false, error: "Message non trouvé" });

                const user = await Account.findById(userId);
                const isAdmin = user?.badges?.admin || user?.badges?.owner;

                if (msg.user.toString() !== userId && !isAdmin) {
                    return cb?.({ ok: false, error: "Permissions insuffisantes" });
                }

                msg.isDeleted = true;
                await msg.save();

                io.emit("chat:deleted", { messageId: payload.messageId });
                cb?.({ ok: true });
            } catch (err: any) {
                cb?.({ ok: false, error: err.message });
            }
        });
    });
};
