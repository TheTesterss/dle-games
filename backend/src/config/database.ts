import mongoose from "mongoose";
import Account from "../models/Account";
import * as crypto from "node:crypto";

const connectServer = () => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("MONGO_URI is not defined in environment variables");
        process.exit(1);
    }

    mongoose.connect(mongoUri);

    mongoose.connection.once("open", async () => {
        try {
            const existing = await Account.findOne({ name: "admin" });
            const hash = crypto.createHash("sha256").update("admin").digest("hex");
            if (!existing) {
                await Account.create({
                    name: "admin",
                    mail: "admin@local",
                    avatar: "https://placehold.co/100x100/007bff/ffffff?text=A",
                    password: hash,
                    badges: {
                        owner: true,
                        verified: true,
                        premium: true,
                        admin: true,
                        ranking: { tier: "gold", top10: true, dailyCheck: true },
                    },
                });
                console.log("Admin account created");
            } else {
                await Account.updateOne(
                    { _id: existing._id },
                    {
                        $set: {
                            password: hash,
                            "badges.owner": true,
                            "badges.admin": true,
                        },
                    },
                );
                console.log("Admin account updated");
            }
        } catch (err) {
            console.error("Erreur seed admin:", err);
        }
    });
};

export default connectServer;
