"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const http = __importStar(require("node:http"));
const socket_io_1 = require("socket.io");
const database_1 = __importDefault(require("./config/database"));
const app_1 = __importDefault(require("./app"));
const admin_service_1 = require("./services/admin.service");
const pokemon_socket_1 = require("./sockets/pokemon.socket");
const privateChat_socket_1 = require("./sockets/privateChat.socket");
const Account_1 = __importDefault(require("./models/Account"));
const PORT = process.env.PORT || 8923;
const DEBUG = process.env.DEBUG === 'true';
if (DEBUG) {
    console.log('🐛 Mode DEBUG activé');
}
(0, database_1.default)();
process.on('uncaughtException', err => console.error('Unhandled Exception:', err));
process.on('unhandledRejection', (reason, promise) => console.error('Unhandled Rejection at:', promise, 'reason:', reason));
const server = http.createServer(app_1.default);
const configuredSocketOrigins = process.env.SOCKET_ORIGINS
    ? process.env.SOCKET_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
    : [];
const defaultSocketOrigins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:4173"];
const socketAllowedOrigins = new Set([...(configuredSocketOrigins.length > 0 ? configuredSocketOrigins : defaultSocketOrigins)]);
const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: (origin, cb) => {
            if (!origin)
                return cb(null, true);
            if (socketAllowedOrigins.has(origin) || localhostPattern.test(origin))
                return cb(null, true);
            return cb(null, false);
        },
        credentials: true,
    },
    allowEIO3: true,
});
io.of("/admin").on("connection", (socket) => {
    const adminId = socket.handshake.auth?.adminId;
    if (!adminId) {
        socket.disconnect(true);
        return;
    }
    let interval;
    const emitStats = async () => {
        try {
            const stats = await (0, admin_service_1.getGlobalStats)(adminId);
            socket.emit("admin:stats", stats);
        }
        catch (err) {
            socket.emit("admin:error", { message: err.message });
        }
    };
    emitStats();
    interval = setInterval(emitStats, 5000);
    socket.on("disconnect", () => {
        if (interval)
            clearInterval(interval);
    });
});
const onlineUsers = new Map();
const socketPresence = new Map();
io.on("connection", async (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (userId) {
        let hidden = false;
        try {
            const user = await Account_1.default.findById(userId, { settings: 1 }).lean();
            hidden = !!user?.settings?.messages?.hideOnlineStatus;
        }
        catch {
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
        if (!resolvedUserId)
            return;
        if (!presence?.hidden) {
            const count = (onlineUsers.get(resolvedUserId) || 1) - 1;
            if (count <= 0)
                onlineUsers.delete(resolvedUserId);
            else
                onlineUsers.set(resolvedUserId, count);
            io.emit("presence:online", Array.from(onlineUsers.keys()));
        }
    });
});
(0, pokemon_socket_1.registerPokemonSocket)(io);
(0, privateChat_socket_1.registerPrivateChatSocket)(io);
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
