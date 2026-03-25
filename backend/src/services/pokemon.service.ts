import * as fs from "node:fs";
import * as path from "node:path";
import { parse } from "csv-parse/sync";

export interface IPokemon {
    name: string;
    namefr: string;
    displayName: string;
    type1: string | null;
    type1fr: string;
    type2: string | null;
    type2fr: string;
    generation: number;
    index: number;
    description: string;
    descriptionfr: string;
    image: string;
    hasMegaEvolution: boolean;
    weight: number;
    legendary: boolean;
    fabulous: boolean;
    size: number;
    biomes: string | null;
    evolutionStage: number;
    color: string | null;
    colors: string[];
    isMaxEvolution: boolean;
    hasBeenInAshTeam: boolean;
    hasGenderDifference: boolean;
    isFormSwitchable: boolean;
    baseHappiness: number;
    captureRate: number;
}

let cached: IPokemon[] | null = null;

const resolveCsvPath = (): string => {
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

    throw new Error(
        `Impossible de trouver pokemons.csv. Chemins testés: ${candidates.join(", ")}`
    );
};

export const loadPokemonData = (): IPokemon[] => {
    if (cached) return cached;
    const csvPath = resolveCsvPath();
    const raw = fs.readFileSync(csvPath, "utf8");
    const records = parse(raw, {
        columns: true,
        skip_empty_lines: true,
    });

    const fixText = (value: string | undefined): string => {
        if (!value) return "";
        // Fix mojibake when UTF-8 bytes were interpreted as Latin-1.
        if (/[ÃÂâ€™â€œâ€]/.test(value)) {
            return Buffer.from(value, "latin1").toString("utf8");
        }
        return value;
    };

    const normalize = (value: string | undefined): string | null => {
        if (!value) return null;
        const lower = fixText(value).toLowerCase();
        if (lower === "none" || lower === "n/a") return null;
        return lower;
    };

    const splitColors = (value: string | undefined): string[] => {
        if (!value) return [];
        const rawColors = String(value)
            .split(/[\\/,+;]/)
            .map((v) => normalize(v))
            .filter((v): v is string => !!v);
        return Array.from(new Set(rawColors));
    };

    cached = records.map((row: any) => ({
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

    return cached!;
};

export const listPokemonNames = () => {
    const data = loadPokemonData();
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

export const findPokemonByName = (name: string): IPokemon | null => {
    if (!name) return null;
    const key = name.toLowerCase().trim();
    const data = loadPokemonData();
    return data.find((p) => p.name === key || p.namefr?.toLowerCase() === key) || null;
};

export const getRandomPokemon = (excludeNames: Set<string> = new Set(), generations: number[] | null = null): IPokemon => {
    const data = loadPokemonData();
    const candidates = data.filter((p) => {
        if (excludeNames.has(p.name)) return false;
        if (Array.isArray(generations) && generations.length > 0) {
            return generations.includes(p.generation);
        }
        return true;
    });
    if (candidates.length === 0) return data[Math.floor(Math.random() * data.length)];
    return candidates[Math.floor(Math.random() * candidates.length)];
};

