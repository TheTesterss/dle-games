import { Router, Request, Response } from "express";

const router = Router();

router.get("/summary", async (req: Request, res: Response) => {
    try {
        const token = process.env.DISCORD_BOT_TOKEN;
        const guildId = process.env.DISCORD_GUILD_ID;
        const inviteCode = process.env.DISCORD_INVITE_CODE;

        if (!token || !guildId) {
            return res.status(400).json({ message: "Discord env manquant" });
        }

        const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
            headers: {
                Authorization: `Bot ${token}`,
            },
        });

        if (!response.ok) {
            return res.status(response.status).json({ message: "Erreur Discord API" });
        }

        const data: any = await response.json();
        const iconUrl = data.icon
            ? `https://cdn.discordapp.com/icons/${data.id}/${data.icon}.png`
            : null;
        const bannerUrl = data.banner
            ? `https://cdn.discordapp.com/banners/${data.id}/${data.banner}.png`
            : null;

        res.status(200).json({
            id: data.id,
            name: data.name,
            description: data.description,
            memberCount: data.approximate_member_count,
            onlineCount: data.approximate_presence_count,
            iconUrl,
            bannerUrl,
            invite: inviteCode ? `https://discord.gg/${inviteCode}` : null,
        });
    } catch (e: any) {
        res.status(500).json({ message: e.message || e });
    }
});

export default router;
