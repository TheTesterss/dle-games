import { Router, Request, Response } from "express";
import { listPokemonNames } from "../services/pokemon.service";

const router = Router();

router.get("/list", (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string);
        const offset = parseInt(req.query.offset as string) || 0;
        const search = req.query.search ? (req.query.search as string).toLowerCase() : null;

        let list = listPokemonNames();

        if (search) {
            list = list.filter(p =>
                p.namefr?.toLowerCase().includes(search) ||
                p.name?.toLowerCase().includes(search) ||
                p.displayName?.toLowerCase().includes(search)
            );
        }

        if (!isNaN(limit)) {
            list = list.slice(offset, offset + limit);
        }

        res.status(200).json(list);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
});

export default router;
