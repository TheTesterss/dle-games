import express, { Request, Response, NextFunction } from "express";
import accountRoutes from "./routes/account.routes";
import friendrequestRoutes from "./routes/friendrequest.routes";
import forumRoutes from "./routes/forum.routes";
import friendsRoutes from "./routes/friends.routes";
import adminRoutes from "./routes/admin.routes";
import pokemonRoutes from "./routes/pokemon.routes";
import discordRoutes from "./routes/discord.routes";
import premiumRoutes from "./routes/premium.routes";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import multer from "multer";
import Account from "./models/Account";

const app = express();
const uploadDir = path.join(__dirname, "uploads");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}${ext}`;
        cb(null, name);
    },
});

app.use((req: Request, res: Response, next: NextFunction) => {
    req.setTimeout(300000);
    res.setTimeout(300000);
    next();
});

const upload = multer({
    storage,
    limits: {
        fileSize: 500 * 1024 * 1024,
        fieldSize: 50 * 1024 * 1024,
        fieldNameSize: 1000,
        fields: 20,
        files: 10
    }
});

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

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

app.use(cors({
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.has(origin) || localhostPattern.test(origin)) return cb(null, true);
        return cb(null, false);
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
    maxAge: 86400
}));

app.get("/", (req: Request, res: Response) => { res.send("test") });

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.post("/api/create_link", upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 },
    { name: 'videos', maxCount: 4 }
]), async (req: Request, res: Response) => {
    try {
        const userId = (req.body?.userId as string) || null;
        let tier: "games_one" | "games_plus" | null = null;
        if (userId) {
            const user = await Account.findById(userId).lean();
            tier = user?.premiumTier || (user?.badges?.premium ? "games_one" : null);
        }
        const maxSize = tier === "games_plus" ? 500 * 1024 * 1024 : tier ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
        const allowVideo = !!tier;

        const response: any = {};
        const urls: string[] = [];
        const videoUrls: string[] = [];
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        const allFiles = Object.values(files || {}).flat();
        const tooBig = allFiles.find((f) => f.size > maxSize);
        if (tooBig) {
            allFiles.forEach((f) => {
                try { fs.unlinkSync(f.path); } catch { }
            });
            return res.status(413).json({ message: "File too large for your tier" });
        }

        if (!allowVideo && (files.video || files.videos)) {
            allFiles.forEach((f) => {
                try { fs.unlinkSync(f.path); } catch { }
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
            if (urls.length === 1) response.url = urls[0];
        }

        if (videoUrls.length > 0) {
            response.videoUrls = videoUrls;
            if (videoUrls.length === 1) response.videoUrl = videoUrls[0];
        }

        if (!response.avatarUrl && !response.url && !response.urls && !response.videoUrl && !response.videoUrls) {
            return res.status(400).json({ message: "File is required" });
        }

        if (response.avatarUrl && !response.url && !response.urls) {
            response.url = response.avatarUrl;
        }

        res.status(200).json(response);

    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

app.use("/api/accounts", accountRoutes);
app.use("/api/requests", friendrequestRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pokemon", pokemonRoutes);
app.use("/api/discord", discordRoutes);
app.use("/api/premium", premiumRoutes);

export default app;
