import * as dotenv from "dotenv";
dotenv.config();

import * as http from "node:http";
import { Server, Socket } from "socket.io";
import connectServer from "./config/database";
import app from "./app";
import { getGlobalStats } from "./services/admin.service";
import { registerPokemonSocket } from "./sockets/pokemon.socket";
import { registerPrivateChatSocket } from "./sockets/privateChat.socket";
import Account from "./models/Account";

const PORT = process.env.PORT || 8923;
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
    console.log('🐛 Mode DEBUG activé');
}

connectServer();

process.on('uncaughtException', err => console.error('Unhandled Exception:', err));
process.on('unhandledRejection', (reason, promise) => console.error('Unhandled Rejection at:', promise, 'reason:', reason));

const server = http.createServer(app);
const configuredSocketOrigins = process.env.SOCKET_ORIGINS
    ? process.env.SOCKET_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
    : [];
const defaultSocketOrigins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:4173"];
const socketAllowedOrigins = new Set([...(configuredSocketOrigins.length > 0 ? configuredSocketOrigins : defaultSocketOrigins)]);
const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const io = new Server(server, {
    cors: {
        origin: (origin, cb) => {
            if (!origin) return cb(null, true);
            if (socketAllowedOrigins.has(origin) || localhostPattern.test(origin)) return cb(null, true);
            return cb(null, false);
        },
        credentials: true,
    },
    allowEIO3: true,
});

io.of("/admin").on("connection", (socket: Socket) => {
    const adminId = socket.handshake.auth?.adminId;
    if (!adminId) {
        socket.disconnect(true);
        return;
    }
    let interval: NodeJS.Timeout;
    const emitStats = async () => {
        try {
            const stats = await getGlobalStats(adminId);
            socket.emit("admin:stats", stats);
        } catch (err: any) {
            socket.emit("admin:error", { message: err.message });
        }
    };
    emitStats();
    interval = setInterval(emitStats, 5000);
    socket.on("disconnect", () => {
        if (interval) clearInterval(interval);
    });
});

const onlineUsers = new Map<string, number>();
const socketPresence = new Map<string, { userId: string; hidden: boolean }>();

io.on("connection", async (socket: Socket) => {
    const userId = socket.handshake.auth?.userId;
    if (userId) {
        let hidden = false;
        try {
            const user = await Account.findById(userId, { settings: 1 }).lean();
            hidden = !!user?.settings?.messages?.hideOnlineStatus;
        } catch {
            hidden = false;
        }
        socketPresence.set(socket.id, { userId, hidden });
        if (!hidden) {
            const count = onlineUsers.get(userId) || 0;
            onlineUsers.set(userId, count + 1);
        }
        socket.join(`user:${userId}`);
        if (!hidden) {
            io.emit("presence:online", Array.from(onlineUsers.keys()));
        }
    }

    socket.on("disconnect", () => {
        const presence = socketPresence.get(socket.id);
        socketPresence.delete(socket.id);
        const resolvedUserId = presence?.userId || userId;
        if (!resolvedUserId) return;
        if (!presence?.hidden) {
            const count = (onlineUsers.get(resolvedUserId) || 1) - 1;
            if (count <= 0) onlineUsers.delete(resolvedUserId);
            else onlineUsers.set(resolvedUserId, count);
            io.emit("presence:online", Array.from(onlineUsers.keys()));
        }
    });
});

registerPokemonSocket(io);
registerPrivateChatSocket(io);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
