"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pokemon_service_1 = require("../services/pokemon.service");
const router = (0, express_1.Router)();
router.get("/list", (req, res) => {
    try {
        const limit = parseInt(req.query.limit);
        const offset = parseInt(req.query.offset) || 0;
        const search = req.query.search ? req.query.search.toLowerCase() : null;
        let list = (0, pokemon_service_1.listPokemonNames)();
        if (search) {
            list = list.filter(p => p.namefr?.toLowerCase().includes(search) ||
                p.name?.toLowerCase().includes(search) ||
                p.displayName?.toLowerCase().includes(search));
        }
        if (!isNaN(limit)) {
            list = list.slice(offset, offset + limit);
        }
        res.status(200).json(list);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
});
exports.default = router;
