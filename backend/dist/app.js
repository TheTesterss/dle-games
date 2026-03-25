"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const account_routes_1 = __importDefault(require("./routes/account.routes"));
const friendrequest_routes_1 = __importDefault(require("./routes/friendrequest.routes"));
const forum_routes_1 = __importDefault(require("./routes/forum.routes"));
const friends_routes_1 = __importDefault(require("./routes/friends.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const pokemon_routes_1 = __importDefault(require("./routes/pokemon.routes"));
const discord_routes_1 = __importDefault(require("./routes/discord.routes"));
const premium_routes_1 = __importDefault(require("./routes/premium.routes"));
const cors_1 = __importDefault(require("cors"));
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const multer_1 = __importDefault(require("multer"));
const Account_1 = __importDefault(require("./models/Account"));
const app = (0, express_1.default)();
const uploadDir = node_path_1.default.join(__dirname, "uploads");
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = node_path_1.default.extname(file.originalname);
        const name = `${Date.now()}${ext}`;
        cb(null, name);
    },
});
app.use((req, res, next) => {
    req.setTimeout(300000);
    res.setTimeout(300000);
    next();
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 500 * 1024 * 1024,
        fieldSize: 50 * 1024 * 1024,
        fieldNameSize: 1000,
        fields: 20,
        files: 10
    }
});
if (!node_fs_1.default.existsSync(uploadDir))
    node_fs_1.default.mkdirSync(uploadDir);
const configuredOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:4173",
];
const allowedOrigins = new Set([...(configuredOrigins.length > 0 ? configuredOrigins : defaultOrigins)]);
const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        if (!origin)
            return cb(null, true);
        if (allowedOrigins.has(origin) || localhostPattern.test(origin))
            return cb(null, true);
        return cb(null, false);
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
    maxAge: 86400
}));
app.get("/", (req, res) => { res.send("test"); });
app.use("/uploads", express_1.default.static(node_path_1.default.join(__dirname, "uploads")));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.post("/api/create_link", upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 },
    { name: 'videos', maxCount: 4 }
]), async (req, res) => {
    try {
        const userId = req.body?.userId || null;
        let tier = null;
        if (userId) {
            const user = await Account_1.default.findById(userId).lean();
            tier = user?.premiumTier || (user?.badges?.premium ? "games_one" : null);
        }
        const maxSize = tier === "games_plus" ? 500 * 1024 * 1024 : tier ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
        const allowVideo = !!tier;
        const response = {};
        const urls = [];
        const videoUrls = [];
        const files = req.files;
        const allFiles = Object.values(files || {}).flat();
        const tooBig = allFiles.find((f) => f.size > maxSize);
        if (tooBig) {
            allFiles.forEach((f) => {
                try {
                    node_fs_1.default.unlinkSync(f.path);
                }
                catch { }
            });
            return res.status(413).json({ message: "File too large for your tier" });
        }
        if (!allowVideo && (files.video || files.videos)) {
            allFiles.forEach((f) => {
                try {
                    node_fs_1.default.unlinkSync(f.path);
                }
                catch { }
            });
            return res.status(403).json({ message: "Video reserved to premium" });
        }
        if (files.avatar) {
            const file = files.avatar[0];
            response.avatarUrl = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
        }
        if (files.image) {
            const file = files.image[0];
            urls.push(`${req.protocol}://${req.get("host")}/uploads/${file.filename}`);
        }
        if (files.images) {
            files.images.forEach((file) => {
                urls.push(`${req.protocol}://${req.get("host")}/uploads/${file.filename}`);
            });
        }
        if (files.video) {
            const file = files.video[0];
            videoUrls.push(`${req.protocol}://${req.get("host")}/uploads/${file.filename}`);
        }
        if (files.videos) {
            files.videos.forEach((file) => {
                videoUrls.push(`${req.protocol}://${req.get("host")}/uploads/${file.filename}`);
            });
        }
        if (urls.length > 0) {
            response.urls = urls;
            if (urls.length === 1)
                response.url = urls[0];
        }
        if (videoUrls.length > 0) {
            response.videoUrls = videoUrls;
            if (videoUrls.length === 1)
                response.videoUrl = videoUrls[0];
        }
        if (!response.avatarUrl && !response.url && !response.urls && !response.videoUrl && !response.videoUrls) {
            return res.status(400).json({ message: "File is required" });
        }
        if (response.avatarUrl && !response.url && !response.urls) {
            response.url = response.avatarUrl;
        }
        res.status(200).json(response);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
app.use("/api/accounts", account_routes_1.default);
app.use("/api/requests", friendrequest_routes_1.default);
app.use("/api/friends", friends_routes_1.default);
app.use("/api/forum", forum_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/pokemon", pokemon_routes_1.default);
app.use("/api/discord", discord_routes_1.default);
app.use("/api/premium", premium_routes_1.default);
exports.default = app;
