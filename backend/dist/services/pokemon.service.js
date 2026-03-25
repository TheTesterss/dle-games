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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomPokemon = exports.findPokemonByName = exports.listPokemonNames = exports.loadPokemonData = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const sync_1 = require("csv-parse/sync");
let cached = null;
const resolveCsvPath = () => {
    const candidates = [
        path.join(__dirname, "..", "data", "pokemons.csv"),
        path.join(__dirname, "..", "..", "src", "data", "pokemons.csv"),
        path.join(__dirname, "..", "..", "..", "src", "data", "pokemons.csv"),
        path.join(process.cwd(), "src", "data", "pokemons.csv"),
        path.join(process.cwd(), "..", "src", "data", "pokemons.csv"),
        path.join(process.cwd(), "data", "pokemons.csv"),
        path.join(process.cwd(), "dist", "data", "pokemons.csv"),
        path.join(process.cwd(), "backend", "src", "data", "pokemons.csv"),
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    throw new Error(`Impossible de trouver pokemons.csv. Chemins testés: ${candidates.join(", ")}`);
};
const loadPokemonData = () => {
    if (cached)
        return cached;
    const csvPath = resolveCsvPath();
    const raw = fs.readFileSync(csvPath, "utf8");
    const records = (0, sync_1.parse)(raw, {
        columns: true,
        skip_empty_lines: true,
    });
    const fixText = (value) => {
        if (!value)
            return "";
        // Fix mojibake when UTF-8 bytes were interpreted as Latin-1.
        if (/[ÃÂâ€™â€œâ€]/.test(value)) {
            return Buffer.from(value, "latin1").toString("utf8");
        }
        return value;
    };
    const normalize = (value) => {
        if (!value)
            return null;
        const lower = fixText(value).toLowerCase();
        if (lower === "none" || lower === "n/a")
            return null;
        return lower;
    };
    const splitColors = (value) => {
        if (!value)
            return [];
        const rawColors = String(value)
            .split(/[\\/,+;]/)
            .map((v) => normalize(v))
            .filter((v) => !!v);
        return Array.from(new Set(rawColors));
    };
    cached = records.map((row) => ({
        name: fixText(row.name)?.toLowerCase(),
        namefr: fixText(row.namefr),
        displayName: fixText(row.namefr) || fixText(row.name),
        type1: normalize(row.type1),
        type1fr: fixText(row.type1fr),
        type2: normalize(row["type2/none"]),
        type2fr: fixText(row["type2fr/none"]),
        generation: Number(row.generation),
        index: Number(row.index),
        description: fixText(row.description),
        descriptionfr: fixText(row.descriptionfr),
        image: fixText(row["image(link)"]),
        hasMegaEvolution: row.hasMegaEvolution === "True",
        weight: Number(row["weight(in kg)"]),
        legendary: row.legendary === "True",
        fabulous: row.fabulous === "True",
        size: Number(row["size(in meter)"]),
        biomes: normalize(row["biomes(where we can found it)"]),
        evolutionStage: Number(row["evolution-stade"]),
        color: normalize(row.color),
        colors: splitColors(row.color),
        isMaxEvolution: row.isMaxEvolution === "True",
        hasBeenInAshTeam: row.hasBeenInAshTeam === "True",
        hasGenderDifference: row.hasGenderDifference === "True",
        isFormSwitchable: row.isFormSwitchable === "True",
        baseHappiness: Number(row.baseHappiness),
        captureRate: Number(row.captureRate),
    }));
    return cached;
};
exports.loadPokemonData = loadPokemonData;
const listPokemonNames = () => {
    const data = (0, exports.loadPokemonData)();
    return data.map((p) => ({
        name: p.name,
        namefr: p.namefr,
        displayName: p.displayName,
        image: p.image,
        generation: p.generation,
        index: p.index,
        type1: p.type1,
        type2: p.type2,
        type1fr: p.type1fr,
        type2fr: p.type2fr,
        descriptionfr: p.descriptionfr,
        colors: p.colors,
        weight: p.weight,
        size: p.size,
    }));
};
exports.listPokemonNames = listPokemonNames;
const findPokemonByName = (name) => {
    if (!name)
        return null;
    const key = name.toLowerCase().trim();
    const data = (0, exports.loadPokemonData)();
    return data.find((p) => p.name === key || p.namefr?.toLowerCase() === key) || null;
};
exports.findPokemonByName = findPokemonByName;
const getRandomPokemon = (excludeNames = new Set(), generations = null) => {
    const data = (0, exports.loadPokemonData)();
    const candidates = data.filter((p) => {
        if (excludeNames.has(p.name))
            return false;
        if (Array.isArray(generations) && generations.length > 0) {
            return generations.includes(p.generation);
        }
        return true;
    });
    if (candidates.length === 0)
        return data[Math.floor(Math.random() * data.length)];
    return candidates[Math.floor(Math.random() * candidates.length)];
};
exports.getRandomPokemon = getRandomPokemon;
