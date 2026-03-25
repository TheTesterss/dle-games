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
const mongoose_1 = __importDefault(require("mongoose"));
const Account_1 = __importDefault(require("../models/Account"));
const crypto = __importStar(require("node:crypto"));
const connectServer = () => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("MONGO_URI is not defined in environment variables");
        process.exit(1);
    }
    mongoose_1.default.connect(mongoUri);
    mongoose_1.default.connection.once("open", async () => {
        try {
            const existing = await Account_1.default.findOne({ name: "admin" });
            const hash = crypto.createHash("sha256").update("admin").digest("hex");
            if (!existing) {
                await Account_1.default.create({
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
            }
            else {
                await Account_1.default.updateOne({ _id: existing._id }, {
                    $set: {
                        password: hash,
                        "badges.owner": true,
                        "badges.admin": true,
                    },
                });
                console.log("Admin account updated");
            }
        }
        catch (err) {
            console.error("Erreur seed admin:", err);
        }
    });
};
exports.default = connectServer;
