"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatSocket = void 0;
const ChatMessage_1 = __importDefault(require("../models/ChatMessage"));
const Account_1 = __importDefault(require("../models/Account"));
const registerChatSocket = (io) => {
    io.on("connection", (socket) => {
        const userId = socket.handshake.auth?.userId;
        socket.on("chat:history", async (payload, cb) => {
            try {
                const limit = payload?.limit || 50;
                const page = payload?.page || 0;
                const messages = await ChatMessage_1.default.find({ isDeleted: false })
                    .sort({ createdAt: -1 })
                    .skip(page * limit)
                    .limit(limit)
                    .populate("user", "name avatar badges");
                cb?.({ ok: true, messages: messages.reverse() });
            }
            catch (err) {
                cb?.({ ok: false, error: err.message });
            }
        });
        socket.on("chat:message", async (payload, cb) => {
            if (!userId)
                return cb?.({ ok: false, error: "Non connecté" });
            try {
                const msg = new ChatMessage_1.default({
                    user: userId,
                    content: payload.content,
                    image: payload.image,
                    video: payload.video,
                });
                await msg.save();
                const populated = await msg.populate("user", "name avatar badges");
                io.emit("chat:message", populated);
                cb?.({ ok: true, message: populated });
            }
            catch (err) {
                cb?.({ ok: false, error: err.message });
            }
        });
        socket.on("chat:pin", async (payload, cb) => {
            if (!userId)
                return cb?.({ ok: false, error: "Non connecté" });
            try {
                const user = await Account_1.default.findById(userId);
                if (!user || (!user.badges?.admin && !user.badges?.owner)) {
                    return cb?.({ ok: false, error: "Permissions insuffisantes" });
                }
                const msg = await ChatMessage_1.default.findById(payload.messageId);
                if (!msg)
                    return cb?.({ ok: false, error: "Message non trouvé" });
                msg.isPinned = !msg.isPinned;
                msg.pinnedBy = msg.isPinned ? userId : null;
                await msg.save();
                io.emit("chat:updated", msg);
                cb?.({ ok: true, isPinned: msg.isPinned });
            }
            catch (err) {
                cb?.({ ok: false, error: err.message });
            }
        });
        socket.on("chat:edit", async (payload, cb) => {
            if (!userId)
                return cb?.({ ok: false, error: "Non connecté" });
            try {
                const msg = await ChatMessage_1.default.findById(payload.messageId);
                if (!msg)
                    return cb?.({ ok: false, error: "Message non trouvé" });
                if (msg.user.toString() !== userId)
                    return cb?.({ ok: false, error: "Non autorisé" });
                msg.content = payload.content;
                msg.isEdited = true;
                await msg.save();
                io.emit("chat:updated", msg);
                cb?.({ ok: true });
            }
            catch (err) {
                cb?.({ ok: false, error: err.message });
            }
        });
        socket.on("chat:delete", async (payload, cb) => {
            if (!userId)
                return cb?.({ ok: false, error: "Non connecté" });
            try {
                const msg = await ChatMessage_1.default.findById(payload.messageId);
                if (!msg)
                    return cb?.({ ok: false, error: "Message non trouvé" });
                const user = await Account_1.default.findById(userId);
                const isAdmin = user?.badges?.admin || user?.badges?.owner;
                if (msg.user.toString() !== userId && !isAdmin) {
                    return cb?.({ ok: false, error: "Permissions insuffisantes" });
                }
                msg.isDeleted = true;
                await msg.save();
                io.emit("chat:deleted", { messageId: payload.messageId });
                cb?.({ ok: true });
            }
            catch (err) {
                cb?.({ ok: false, error: err.message });
            }
        });
    });
};
exports.registerChatSocket = registerChatSocket;
