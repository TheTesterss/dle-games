"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPokemonSocket = void 0;
const pokemon_service_1 = require("../services/pokemon.service");
const Account_1 = __importDefault(require("../models/Account"));
const Log_1 = __importDefault(require("../models/Log"));
const mongoose_1 = require("mongoose");
const rooms = new Map();
const userActiveGames = new Map();
const DEBUG = process.env.DEBUG === 'true';
const logDebug = (...args) => {
    if (DEBUG)
        console.log('[POKEMON_DEBUG]', ...args);
};
const generateCode = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i += 1) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
};
const PREMIUM_ATTRS = new Set([
    "mega",
    "index",
    "genderDiff",
    "captureRate",
    "baseHappiness",
    "ashTeam",
    "formSwitch",
]);
const PREMIUM_GENERATIONS = [5, 6, 7];
const FREE_GENERATIONS = [1, 2, 3, 4];
const resolveTier = async (userId) => {
    if (!userId)
        return null;
    try {
        const user = await Account_1.default.findById(userId, { premiumTier: 1, badges: 1 }).lean();
        return user?.premiumTier || (user?.badges?.premium ? "games_one" : null);
    }
    catch {
        return null;
    }
};
const capMaxPlayers = (tier, desired) => {
    const maxAllowed = tier === "games_plus" ? 10 : tier === "games_one" ? 7 : 4;
    if (!desired || Number.isNaN(desired))
        return maxAllowed;
    return Math.max(1, Math.min(maxAllowed, Math.floor(desired)));
};
const sanitizeAttributes = (attrs = [], tier) => {
    if (!Array.isArray(attrs))
        return [];
    if (tier)
        return attrs;
    return attrs.filter((a) => !PREMIUM_ATTRS.has(a));
};
const sanitizeGenerations = (gens = [], tier) => {
    if (!Array.isArray(gens) || gens.length === 0)
        return tier ? [...FREE_GENERATIONS, ...PREMIUM_GENERATIONS] : FREE_GENERATIONS;
    const allowed = tier ? [...FREE_GENERATIONS, ...PREMIUM_GENERATIONS] : FREE_GENERATIONS;
    return gens.filter((g) => allowed.includes(Number(g))).sort((a, b) => a - b);
};
const compareNumeric = (value, target) => {
    if (value === target)
        return { state: "equal" };
    const diff = Math.abs(value - target);
    const ratio = target ? diff / target : diff;
    if (ratio <= 0.1)
        return { state: "close", direction: value > target ? "down" : "up" };
    return { state: value > target ? "down" : "up" };
};
const compareString = (value, target) => {
    if (!value || !target)
        return { state: "unknown" };
    if (value === target)
        return { state: "equal" };
    return { state: "different" };
};
const compareType1 = (guess, target) => compareString(guess?.type1, target?.type1);
const compareType2 = (guess, target) => {
    if (!target?.type2) {
        return guess?.type2 ? { state: "different" } : { state: "equal" };
    }
    if (!guess?.type2)
        return { state: "different" };
    return compareString(guess?.type2, target?.type2);
};
const compareColors = (guessColors = [], targetColors = []) => {
    if (!targetColors.length && !guessColors.length)
        return { state: "equal" };
    if (!targetColors.length && guessColors.length)
        return { state: "different" };
    if (!guessColors.length)
        return { state: "unknown" };
    const match = guessColors.filter((c) => targetColors.includes(c));
    if (match.length === 0)
        return { state: "different" };
    if (match.length === targetColors.length && guessColors.length === targetColors.length)
        return { state: "equal" };
    return { state: "partial" };
};
const comparePokemon = (guess, target, attributes) => {
    const result = {};
    if (!guess || !target)
        return result;
    attributes.forEach((attr) => {
        switch (attr) {
            case "weight":
                result.weight = compareNumeric(guess.weight, target.weight);
                break;
            case "size":
                result.size = compareNumeric(guess.size, target.size);
                break;
            case "generation":
                result.generation = compareNumeric(guess.generation, target.generation);
                break;
            case "index":
                result.index = compareNumeric(guess.index, target.index);
                break;
            case "types":
                result.type1 = compareType1(guess, target);
                result.type2 = compareType2(guess, target);
                break;
            case "colors":
                result.colors = compareColors(guess.colors || [], target.colors || []);
                break;
            case "evolution":
                result.evolution = compareNumeric(guess.evolutionStage, target.evolutionStage);
                break;
            case "legendary":
                result.legendary = compareString(String(guess.legendary), String(target.legendary));
                break;
            case "fabulous":
                result.fabulous = compareString(String(guess.fabulous), String(target.fabulous));
                break;
            case "mega":
                result.mega = compareString(String(guess.hasMegaEvolution), String(target.hasMegaEvolution));
                break;
            case "maxEvolution":
                result.maxEvolution = compareString(String(guess.isMaxEvolution), String(target.isMaxEvolution));
                break;
            case "ashTeam":
                result.ashTeam = compareString(String(guess.hasBeenInAshTeam), String(target.hasBeenInAshTeam));
                break;
            case "genderDiff":
                result.genderDiff = compareString(String(guess.hasGenderDifference), String(target.hasGenderDifference));
                break;
            case "formSwitch":
                result.formSwitch = compareString(String(guess.isFormSwitchable), String(target.isFormSwitchable));
                break;
            case "baseHappiness":
                result.baseHappiness = compareNumeric(guess.baseHappiness, target.baseHappiness);
                break;
            case "captureRate":
                result.captureRate = compareNumeric(guess.captureRate, target.captureRate);
                break;
            default: break;
        }
    });
    return result;
};
const computeMatchScore = (result) => {
    const values = Object.values(result);
    if (values.length === 0)
        return 0;
    let score = 0;
    values.forEach((item) => {
        if (item.state === "equal")
            score += 1;
        else if (item.state === "partial" || item.state === "close")
            score += 0.5;
    });
    return score / values.length;
};
const saveGameStats = async (room, winner) => {
    const mode = room.options?.mode || 'solo';
    const modeKey = mode === 'multi_individual' ? 'multi_unique' :
        mode === 'multi_same' ? 'multi_same' :
            mode === 'turns_shared' ? 'multi_turn' : 'solo';
    const promises = Array.from(room.players.values()).map(async (player) => {
        if (!player.userId)
            return;
        const isWinner = winner && winner.id === player.id;
        try {
            const update = {
                $inc: {
                    "stats.matchesPlayed": 1,
                    [`stats.pokemon.${modeKey}.matchesPlayed`]: 1
                }
            };
            if (isWinner) {
                update.$inc["stats.victories"] = 1;
                update.$inc[`stats.pokemon.${modeKey}.victories`] = 1;
                update.$inc["stats.longestStreak"] = 1;
                update.$inc[`stats.pokemon.${modeKey}.longestStreak`] = 1;
            }
            else {
                update.$inc["stats.losses"] = 1;
                update.$inc[`stats.pokemon.${modeKey}.losses`] = 1;
            }
            await Account_1.default.updateOne({ _id: player.userId }, update);
            await Log_1.default.create({
                userId: new mongoose_1.Types.ObjectId(player.userId),
                action: "GAME_END",
                details: {
                    game: "pokemon",
                    mode,
                    result: isWinner ? "win" : "loss",
                    score: player.bestScore,
                    guesses: player.guesses.length,
                    opponent: room.players.size > 1 ? "multi" : "solo"
                }
            });
        }
        catch (err) {
            console.error("Error saving stats/logs:", err);
        }
    });
    await Promise.all(promises);
};
const serializeRooms = () => {
    const list = [];
    rooms.forEach((room) => {
        if (room.started)
            return;
        const isPrivate = !!room.options?.isPrivate;
        const host = Array.from(room.players.values()).find(p => p.id === room.hostId);
        list.push({
            code: room.code,
            started: !!room.started,
            hostId: room.hostId,
            hostName: host ? host.name : 'Hôte',
            hostUserId: room.hostUserId || null,
            options: room.options,
            isPrivate,
            players: Array.from(room.players.values()).map((p) => ({
                id: p.id,
                userId: p.userId || null,
                name: p.name,
                avatar: p.avatar || null,
            })),
        });
    });
    return list;
};
const emitRooms = (io) => {
    io.emit("pokemon:rooms", serializeRooms());
};
const pushChat = (io, room, message) => {
    room.chat.push(message);
    if (room.chat.length > 200)
        room.chat = room.chat.slice(-200);
    io.to(room.code).emit("pokemon:chat_message", message);
};
const pushLog = (room, message) => {
    room.logs.push(message);
    if (room.logs.length > 200)
        room.logs = room.logs.slice(-200);
};
const endGame = (io, code, reason) => {
    const room = rooms.get(code);
    if (!room)
        return;
    logDebug(`Ending game ${code}, reason: ${reason}`);
    if (room.timeout)
        clearTimeout(room.timeout);
    if (room.globalTimeout)
        clearTimeout(room.globalTimeout);
    if (room.playerTimeouts) {
        room.playerTimeouts.forEach((timeout) => clearTimeout(timeout));
    }
    if (room.disconnectTimeouts) {
        room.disconnectTimeouts.forEach((timeout) => clearTimeout(timeout));
    }
    const players = Array.from(room.players.values());
    const finished = players.filter((p) => p.finishedAt);
    const winner = finished.sort((a, b) => (a.finishedAt || Infinity) - (b.finishedAt || Infinity))[0] || null;
    const mode = room.options?.mode || 'solo';
    const summary = {
        reason,
        mode,
        winner: winner ? { id: winner.id, name: winner.name, avatar: winner.avatar } : null,
        players: players.map((p) => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            guesses: p.guesses.length,
            bestScore: p.bestScore || 0,
            target: mode === 'multi_individual' && p.target ? {
                name: p.target.displayName,
                namefr: p.target.namefr,
                image: p.target.image,
                type1fr: p.target.type1fr,
                type2fr: p.target.type2fr,
            } : null,
        })),
        firstSameType: room.firstSameType || null,
        firstSameFamily: room.firstSameFamily || null,
        mostInfo: room.mostInfoPlayer || null,
        logs: room.logs || [],
    };
    saveGameStats(room, winner);
    io.to(code).emit("pokemon:summary", summary);
    players.forEach(p => {
        if (p.userId && userActiveGames.has(p.userId)) {
            userActiveGames.get(p.userId)?.delete(code);
            if (userActiveGames.get(p.userId)?.size === 0)
                userActiveGames.delete(p.userId);
        }
    });
    players.forEach((p) => {
        if (p.userId) {
            io.to(`user:${p.userId}`).emit("pokemon:ended", { reason });
            io.to(`user:${p.userId}`).emit("pokemon:active_games", []);
        }
    });
    rooms.delete(code);
    emitRooms(io);
};
const registerPokemonSocket = (io) => {
    io.on("connection", (socket) => {
        const userId = socket.handshake.auth?.userId;
        if (userId) {
            logDebug(`User connected: ${userId}`);
            if (userActiveGames.has(userId)) {
                const activeCodes = Array.from(userActiveGames.get(userId));
                const activeRooms = activeCodes
                    .map(c => rooms.get(c))
                    .filter((r) => !!r && r.started);
                if (activeRooms.length > 0) {
                    socket.emit("pokemon:active_games", activeRooms.map(r => ({
                        code: r.code,
                        mode: r.options.mode,
                        started: r.started,
                        startedAt: r.startedAt || null,
                        durationSec: r.options?.globalTimeSec || null
                    })));
                }
                else {
                    socket.emit("pokemon:active_games", []);
                }
            }
            else {
                socket.emit("pokemon:active_games", []);
            }
        }
        socket.emit("pokemon:rooms", serializeRooms());
        socket.on("pokemon:invite", async (payload, cb) => {
            try {
                if (!userId)
                    return cb?.({ ok: false, error: "Non autorise" });
                const toUserId = payload?.toUserId;
                if (!toUserId)
                    return cb?.({ ok: false, error: "Cible invalide" });
                const sender = await Account_1.default.findById(userId);
                const fromName = sender?.name || payload?.fromName || "Joueur";
                io.to(`user:${toUserId}`).emit("pokemon:invite", {
                    fromId: userId,
                    fromName,
                    code: payload?.code || null,
                    mode: payload?.mode || null
                });
                cb?.({ ok: true });
            }
            catch (err) {
                cb?.({ ok: false, error: err.message });
            }
        });
        socket.on("pokemon:rooms", (cb) => {
            cb?.(serializeRooms());
        });
        socket.on("pokemon:create", async (payload, cb) => {
            try {
                if (userId && userActiveGames.has(userId) && userActiveGames.get(userId).size >= 5) {
                    return cb?.({ ok: false, error: "Maximum 5 parties simultanées !" });
                }
                const tier = await resolveTier(payload.userId || userId);
                const code = generateCode();
                const options = payload.options || {};
                options.maxPlayers = capMaxPlayers(tier, options.maxPlayers);
                options.attributes = sanitizeAttributes(options.attributes || [], tier);
                options.generations = sanitizeGenerations(options.generations || [], tier);
                const playerName = payload.name || "Joueur";
                rooms.set(code, {
                    code,
                    hostId: socket.id,
                    hostUserId: payload.userId || null,
                    options,
                    players: new Map(),
                    target: null,
                    turnIndex: 0,
                    started: false,
                    sharedHints: [],
                    firstSameType: null,
                    firstSameFamily: null,
                    mostInfoPlayer: null,
                    forfeitVotes: new Set(),
                    disconnectTimeouts: new Map(),
                    chat: [],
                    chatPinnedId: null,
                    logs: [],
                });
                const room = rooms.get(code);
                room.players.set(socket.id, {
                    id: socket.id,
                    userId: payload.userId || null,
                    name: playerName,
                    avatar: payload.avatar || null,
                    guesses: [],
                    bestScore: 0,
                    infoScore: 0,
                    forfeited: false,
                    connected: true
                });
                if (payload.userId) {
                    if (!userActiveGames.has(payload.userId))
                        userActiveGames.set(payload.userId, new Set());
                    userActiveGames.get(payload.userId).add(code);
                }
                socket.join(code);
                socket.emit("pokemon:chat_history", { messages: room.chat || [], pinnedId: room.chatPinnedId || null });
                emitRooms(io);
                logDebug(`Room created: ${code} by ${playerName}`);
                cb?.({ ok: true, code, room: { code, options, hostId: socket.id } });
            }
            catch (err) {
                cb?.({ ok: false, error: err.message });
            }
        });
        socket.on("pokemon:join", (payload, cb) => {
            const code = payload.code?.toUpperCase();
            const room = rooms.get(code);
            if (!room)
                return cb?.({ ok: false, error: "Room introuvable" });
            if (payload.userId) {
                const existingPlayer = Array.from(room.players.values()).find(p => p.userId === payload.userId);
                if (existingPlayer) {
                    logDebug(`Player ${payload.name} reconnecting to ${code}`);
                    const previousId = existingPlayer.id;
                    existingPlayer.connected = true;
                    existingPlayer.id = socket.id;
                    if (room.disconnectTimeouts.has(previousId)) {
                        clearTimeout(room.disconnectTimeouts.get(previousId));
                        room.disconnectTimeouts.delete(previousId);
                    }
                    if (previousId !== socket.id) {
                        room.players.delete(previousId);
                        room.players.set(socket.id, existingPlayer);
                    }
                    socket.join(code);
                    socket.emit("pokemon:chat_history", { messages: room.chat || [], pinnedId: room.chatPinnedId || null });
                    socket.emit("pokemon:rejoined", {
                        room: { code, options: room.options, hostId: room.hostId, started: room.started },
                        player: existingPlayer,
                        target: existingPlayer.target ? { ...existingPlayer.target } : null,
                        guesses: existingPlayer.guesses
                    });
                    io.to(code).emit("pokemon:players", Array.from(room.players.values()));
                    const backMsg = `${existingPlayer.name} est de retour.`;
                    pushChat(io, room, {
                        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                        userId: existingPlayer.userId,
                        name: existingPlayer.name,
                        avatar: existingPlayer.avatar,
                        content: backMsg,
                        createdAt: Date.now(),
                        system: true
                    });
                    pushLog(room, backMsg);
                    return cb?.({ ok: true, code, reconnected: true });
                }
                if (userActiveGames.has(payload.userId) && userActiveGames.get(payload.userId).size >= 5) {
                    return cb?.({ ok: false, error: "Maximum 5 parties simultanées !" });
                }
            }
            if (room.started)
                return cb?.({ ok: false, error: "La partie a deja commence" });
            if (room.players.size >= (room.options.maxPlayers || 4)) {
                return cb?.({ ok: false, error: "Salle complete" });
            }
            room.players.set(socket.id, {
                id: socket.id,
                userId: payload.userId || null,
                name: payload.name || "Joueur",
                avatar: payload.avatar || null,
                guesses: [],
                bestScore: 0,
                infoScore: 0,
                connected: true,
                forfeited: false
            });
            if (payload.userId) {
                if (!userActiveGames.has(payload.userId))
                    userActiveGames.set(payload.userId, new Set());
                userActiveGames.get(payload.userId).add(code);
            }
            socket.join(code);
            socket.emit("pokemon:chat_history", { messages: room.chat || [], pinnedId: room.chatPinnedId || null });
            io.to(code).emit("pokemon:players", Array.from(room.players.values()));
            const joinMsg = `${payload.name || "Joueur"} a rejoint la salle.`;
            pushChat(io, room, {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                userId: payload.userId || null,
                name: payload.name || "Joueur",
                avatar: payload.avatar || null,
                content: joinMsg,
                createdAt: Date.now(),
                system: true
            });
            pushLog(room, joinMsg);
            emitRooms(io);
            cb?.({ ok: true, code, room: { code, options: room.options, hostId: room.hostId } });
        });
        socket.on("pokemon:start", (payload, cb) => {
            const code = payload.code?.toUpperCase();
            const room = rooms.get(code);
            if (!room)
                return cb?.({ ok: false, error: "Room introuvable" });
            if (room.hostId !== socket.id)
                return cb?.({ ok: false, error: "Seul l'hote peut demarrer" });
            room.started = true;
            const mode = room.options.mode || "solo";
            const attributes = room.options.attributes || ["types", "weight", "size", "colors", "generation"];
            const generations = room.options.generations || null;
            logDebug(`Starting game ${code} in mode ${mode}`);
            if (mode === "multi_same") {
                const raceMode = room.options.raceMode || "same";
                if (raceMode === "same") {
                    room.target = (0, pokemon_service_1.getRandomPokemon)(new Set(), generations);
                    room.players.forEach(p => p.target = room.target);
                }
                else {
                    const used = new Set();
                    room.players.forEach((player) => {
                        const target = (0, pokemon_service_1.getRandomPokemon)(used, generations);
                        used.add(target.name);
                        player.target = target;
                    });
                }
            }
            else if (mode === "turns_shared" || mode === "solo") {
                room.target = (0, pokemon_service_1.getRandomPokemon)(new Set(), generations);
                room.players.forEach((player) => {
                    player.target = room.target;
                });
            }
            else if (mode === "multi_individual") {
                const used = new Set();
                room.players.forEach((player) => {
                    const target = (0, pokemon_service_1.getRandomPokemon)(used, generations);
                    used.add(target.name);
                    player.target = target;
                });
            }
            if (room.options.globalTimeSec) {
                room.globalTimeout = setTimeout(() => {
                    endGame(io, code, "global_time");
                }, room.options.globalTimeSec * 1000);
            }
            room.startedAt = Date.now();
            io.to(code).emit("pokemon:started", {
                mode,
                attributes,
                players: Array.from(room.players.values()),
            });
            if (mode === "turns_shared") {
                const order = Array.from(room.players.keys());
                io.to(code).emit("pokemon:turn", { playerId: order[0] });
            }
            emitRooms(io);
            cb?.({ ok: true });
        });
        socket.on("pokemon:guess", (payload, cb) => {
            const code = payload.code?.toUpperCase();
            const room = rooms.get(code);
            if (!room)
                return cb?.({ ok: false, error: "Room introuvable" });
            const player = room.players.get(socket.id);
            if (!player)
                return cb?.({ ok: false, error: "Joueur introuvable" });
            const mode = room.options.mode || "solo";
            if (player.forfeited)
                return cb?.({ ok: false, error: "Vous avez abandonne" });
            if (room.options.maxAttempts && player.guesses.length >= room.options.maxAttempts) {
                return cb?.({ ok: false, error: "Nombre d'essais maximum atteint" });
            }
            if (mode === "multi_individual") {
                const order = Array.from(room.players.keys());
                const current = order[room.turnIndex % order.length];
                if (current !== socket.id)
                    return cb?.({ ok: false, error: "Ce n'est pas votre tour" });
            }
            const guess = (0, pokemon_service_1.findPokemonByName)(payload.guess);
            if (!guess)
                return cb?.({ ok: false, error: "Pokemon introuvable" });
            const target = player.target;
            const attributes = room.options.attributes || ["types", "weight", "size", "color", "generation", "biomes"];
            const result = comparePokemon(guess, target, attributes);
            const score = computeMatchScore(result);
            const guessData = {
                type1fr: guess.type1fr,
                type2fr: guess.type2fr,
                weight: guess.weight,
                size: guess.size,
                generation: guess.generation,
                index: guess.index,
                colors: guess.colors,
                evolutionStage: guess.evolutionStage,
                legendary: guess.legendary,
                fabulous: guess.fabulous,
                mega: guess.hasMegaEvolution,
                maxEvolution: guess.isMaxEvolution,
                ashTeam: guess.hasBeenInAshTeam,
                genderDiff: guess.hasGenderDifference,
                formSwitch: guess.isFormSwitchable,
                baseHappiness: guess.baseHappiness,
                captureRate: guess.captureRate,
            };
            player.guesses.push({
                name: guess.displayName,
                result,
                score,
            });
            player.bestScore = Math.max(player.bestScore || 0, score);
            player.infoScore += Object.values(result).filter((r) => r.state === "equal" || r.state === "partial" || r.state === "close").length;
            if (!room.mostInfoPlayer || player.infoScore > (room.mostInfoPlayer?.infoScore || 0)) {
                room.mostInfoPlayer = { id: player.id, name: player.name, avatar: player.avatar, infoScore: player.infoScore };
            }
            if (!room.firstSameType && result.type1 && (result.type1.state === "equal" || result.type1.state === "partial")) {
                room.firstSameType = { id: player.id, name: player.name, avatar: player.avatar };
            }
            if (!room.firstSameFamily && result.evolution && (result.evolution.state === "equal" || result.evolution.state === "close")) {
                room.firstSameFamily = { id: player.id, name: player.name, avatar: player.avatar };
            }
            const isCorrect = guess.name === target.name || guess.namefr === target.namefr;
            if (isCorrect) {
                player.finishedAt = Date.now();
            }
            else if (room.options.maxAttempts && player.guesses.length >= room.options.maxAttempts) {
                player.finishedAt = Date.now();
            }
            if (mode === "multi_individual") {
                io.to(code).emit("pokemon:guess_result", { playerId: player.id, guess: guess.displayName, result, isCorrect, guessData });
                room.turnIndex += 1;
                const order = Array.from(room.players.keys());
                const nextPlayerId = order[room.turnIndex % order.length];
                io.to(code).emit("pokemon:turn", { playerId: nextPlayerId });
            }
            else if (mode === "multi_same" || mode === "turns_shared") {
                io.to(code).emit("pokemon:guess_result", { playerId: player.id, guess: guess.displayName, result, isCorrect, guessData });
            }
            else {
                socket.emit("pokemon:guess_result", { playerId: player.id, guess: guess.displayName, result, isCorrect, guessData });
            }
            if (isCorrect && (mode === "solo" || mode === "multi_same" || mode === "turns_shared")) {
                endGame(io, code, "win");
            }
            const allDone = Array.from(room.players.values()).every((p) => p.finishedAt || p.forfeited);
            if (allDone) {
                if (mode === "multi_individual") {
                    endGame(io, code, "win");
                }
                else if (mode === "solo") {
                    if (!isCorrect)
                        endGame(io, code, "attempts");
                    else
                        endGame(io, code, "win");
                }
            }
            cb?.({ ok: true, result, isCorrect });
        });
        socket.on("pokemon:leave", (payload, cb) => {
            const code = payload?.code?.toUpperCase();
            const room = rooms.get(code);
            if (!room)
                return cb?.({ ok: false, error: "Room introuvable" });
            const realLeave = () => {
                const wasHost = room.hostId === socket.id;
                if (room.playerTimeouts && room.playerTimeouts.has(socket.id)) {
                    clearTimeout(room.playerTimeouts.get(socket.id));
                    room.playerTimeouts.delete(socket.id);
                }
                if (room.disconnectTimeouts.has(socket.id)) {
                    clearTimeout(room.disconnectTimeouts.get(socket.id));
                    room.disconnectTimeouts.delete(socket.id);
                }
                const p = room.players.get(socket.id);
                if (p?.userId && userActiveGames.has(p.userId)) {
                    userActiveGames.get(p.userId).delete(code);
                    if (userActiveGames.get(p.userId).size === 0)
                        userActiveGames.delete(p.userId);
                }
                if (p) {
                    const leaveMsg = `${p.name} a quitté la salle.`;
                    pushChat(io, room, {
                        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                        userId: p.userId || null,
                        name: p.name,
                        avatar: p.avatar || null,
                        content: leaveMsg,
                        createdAt: Date.now(),
                        system: true
                    });
                    pushLog(room, leaveMsg);
                }
                room.players.delete(socket.id);
                socket.leave(code);
                io.to(code).emit("pokemon:players", Array.from(room.players.values()));
                if (wasHost) {
                    if (room.players.size > 0) {
                        const playerArray = Array.from(room.players.values());
                        const connectedPlayers = playerArray.filter(p => p.connected);
                        const candidates = connectedPlayers.length > 0 ? connectedPlayers : playerArray;
                        const newHost = candidates[Math.floor(Math.random() * candidates.length)];
                        room.hostId = newHost.id;
                        room.hostUserId = newHost.userId || null;
                        io.to(code).emit("pokemon:host_changed", {
                            hostId: room.hostId,
                            hostUserId: room.hostUserId,
                            hostName: newHost.name
                        });
                        emitRooms(io);
                    }
                    else {
                        endGame(io, code, "ended");
                    }
                }
                else if (room.players.size === 0) {
                    endGame(io, code, "ended");
                }
                emitRooms(io);
            };
            realLeave();
            cb?.({ ok: true });
        });
        socket.on("pokemon:chat", (payload, cb) => {
            const code = payload?.code?.toUpperCase();
            const room = rooms.get(code);
            if (!room)
                return cb?.({ ok: false, error: "Room introuvable" });
            const player = room.players.get(socket.id);
            if (!player)
                return cb?.({ ok: false, error: "Joueur introuvable" });
            const content = String(payload?.content || "").trim();
            if (!content)
                return cb?.({ ok: false, error: "Message vide" });
            const msg = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                userId: player.userId || null,
                name: player.name,
                avatar: player.avatar || null,
                content: content.slice(0, 500),
                createdAt: Date.now()
            };
            pushChat(io, room, msg);
            cb?.({ ok: true });
        });
        socket.on("pokemon:chat_pin", (payload, cb) => {
            const code = payload?.code?.toUpperCase();
            const room = rooms.get(code);
            if (!room)
                return cb?.({ ok: false, error: "Room introuvable" });
            if (room.hostId !== socket.id)
                return cb?.({ ok: false, error: "Seul l'hôte peut épingler" });
            const messageId = String(payload?.messageId || "");
            if (!messageId)
                return cb?.({ ok: false, error: "Message invalide" });
            room.chatPinnedId = room.chatPinnedId === messageId ? null : messageId;
            io.to(code).emit("pokemon:chat_pinned", { messageId: room.chatPinnedId });
            cb?.({ ok: true, messageId: room.chatPinnedId });
        });
        socket.on("pokemon:chat_react", (payload, cb) => {
            const code = payload?.code?.toUpperCase();
            const room = rooms.get(code);
            if (!room)
                return cb?.({ ok: false, error: "Room introuvable" });
            const player = room.players.get(socket.id);
            if (!player)
                return cb?.({ ok: false, error: "Joueur introuvable" });
            const messageId = String(payload?.messageId || "");
            const emoji = String(payload?.emoji || "").trim();
            if (!messageId || !emoji)
                return cb?.({ ok: false, error: "Réaction invalide" });
            const msg = room.chat.find((m) => m.id === messageId);
            if (!msg)
                return cb?.({ ok: false, error: "Message introuvable" });
            if (!msg.reactions)
                msg.reactions = [];
            const userKey = player.userId || socket.id;
            const existing = msg.reactions.find((r) => r.emoji === emoji);
            if (!existing) {
                msg.reactions.push({ emoji, users: [userKey] });
            }
            else {
                const idx = existing.users.findIndex((u) => u === userKey);
                if (idx >= 0)
                    existing.users.splice(idx, 1);
                else
                    existing.users.push(userKey);
                if (existing.users.length === 0) {
                    msg.reactions = msg.reactions.filter((r) => r.emoji !== emoji);
                }
            }
            io.to(code).emit("pokemon:chat_updated", msg);
            cb?.({ ok: true, message: msg });
        });
        socket.on("pokemon:watch", (payload, cb) => {
            const code = payload?.code?.toUpperCase();
            const targetId = payload?.targetId;
            const room = rooms.get(code);
            if (!room)
                return cb?.({ ok: false, error: "Room introuvable" });
            const viewer = room.players.get(socket.id);
            if (!viewer || (!viewer.finishedAt && !viewer.forfeited)) {
                return cb?.({ ok: false, error: "Observation disponible apres avoir termine" });
            }
            const targetPlayer = room.players.get(targetId);
            if (!targetPlayer?.target)
                return cb?.({ ok: false, error: "Cible introuvable" });
            socket.emit("pokemon:watch_target", {
                playerId: targetPlayer.id,
                playerName: targetPlayer.name,
                target: {
                    name: targetPlayer.target.displayName,
                    image: targetPlayer.target.image,
                    type1fr: targetPlayer.target.type1fr,
                    type2fr: targetPlayer.target.type2fr,
                    weight: targetPlayer.target.weight,
                    size: targetPlayer.target.size,
                    generation: targetPlayer.target.generation,
                    index: targetPlayer.target.index,
                    colors: targetPlayer.target.colors,
                },
                guesses: targetPlayer.guesses
            });
            cb?.({ ok: true });
        });
        socket.on("pokemon:update_options", async (payload, cb) => {
            const code = payload?.code?.toUpperCase();
            const room = rooms.get(code);
            if (!room)
                return cb?.({ ok: false, error: "Room introuvable" });
            if (room.hostId !== socket.id)
                return cb?.({ ok: false, error: "Seul le chef peut modifier" });
            if (room.started)
                return cb?.({ ok: false, error: "Partie deja lancee" });
            const tier = await resolveTier(room.hostUserId || payload?.userId || userId);
            const options = payload?.options || {};
            const next = { ...room.options };
            if (typeof options.mode === "string")
                next.mode = options.mode;
            if (typeof options.timeLimitSec === "number")
                next.timeLimitSec = options.timeLimitSec;
            if (typeof options.globalTimeSec === "number")
                next.globalTimeSec = options.globalTimeSec;
            if (typeof options.maxAttempts === "number")
                next.maxAttempts = options.maxAttempts;
            if (typeof options.isPrivate === "boolean")
                next.isPrivate = options.isPrivate;
            if (Array.isArray(options.attributes))
                next.attributes = sanitizeAttributes(options.attributes, tier);
            if (Array.isArray(options.generations))
                next.generations = sanitizeGenerations(options.generations, tier);
            if (typeof options.maxPlayers === "number") {
                const desired = capMaxPlayers(tier, options.maxPlayers);
                next.maxPlayers = Math.max(desired, room.players.size);
            }
            room.options = next;
            io.to(code).emit("pokemon:room_update", {
                code: room.code,
                options: room.options,
                hostId: room.hostId,
                hostUserId: room.hostUserId || null,
            });
            emitRooms(io);
            cb?.({ ok: true, room: { code: room.code, options: room.options, hostId: room.hostId } });
        });
        socket.on("pokemon:check_active", (payload) => {
            const targetId = payload?.userId || userId;
            if (!targetId)
                return;
            if (userActiveGames.has(targetId)) {
                const activeCodes = Array.from(userActiveGames.get(targetId));
                const activeRooms = activeCodes
                    .map(c => rooms.get(c))
                    .filter((r) => !!r && r.started);
                if (activeRooms.length > 0) {
                    socket.emit("pokemon:active_games", activeRooms.map(r => ({
                        code: r.code,
                        mode: r.options.mode,
                        started: r.started,
                        startedAt: r.startedAt || null,
                        durationSec: r.options?.globalTimeSec || null
                    })));
                }
                else {
                    socket.emit("pokemon:active_games", []);
                }
            }
            else {
                socket.emit("pokemon:active_games", []);
            }
        });
        socket.on("pokemon:host_transfer", (payload, cb) => {
            const code = payload?.code?.toUpperCase();
            const targetId = payload?.targetId;
            const room = rooms.get(code);
            if (!room)
                return cb?.({ ok: false, error: "Room introuvable" });
            if (room.hostId !== socket.id)
                return cb?.({ ok: false, error: "Seul le chef peut transferer" });
            const target = room.players.get(targetId);
            if (!target)
                return cb?.({ ok: false, error: "Joueur introuvable" });
            room.hostId = target.id;
            room.hostUserId = target.userId || null;
            io.to(code).emit("pokemon:host_changed", {
                hostId: room.hostId,
                hostUserId: room.hostUserId,
            });
            emitRooms(io);
            cb?.({ ok: true });
        });
        socket.on("pokemon:disband", (payload, cb) => {
            const code = payload?.code?.toUpperCase();
            const room = rooms.get(code);
            if (!room)
                return cb?.({ ok: false, error: "Room introuvable" });
            if (room.hostId !== socket.id)
                return cb?.({ ok: false, error: "Seul le chef peut demanteler" });
            endGame(io, code, "disbanded");
            io.to(code).emit("pokemon:ended", { reason: "disbanded" });
            cb?.({ ok: true });
        });
        socket.on("pokemon:forfeit", (payload, cb) => {
            const code = payload?.code?.toUpperCase();
            const room = rooms.get(code);
            if (!room)
                return cb?.({ ok: false, error: "Room introuvable" });
            const player = room.players.get(socket.id);
            if (!player)
                return cb?.({ ok: false, error: "Joueur introuvable" });
            const mode = room.options.mode || "solo";
            player.forfeited = true;
            player.finishedAt = Date.now();
            if (mode === "solo") {
                endGame(io, code, "forfeit");
            }
            else if (mode === "multi_individual") {
                const allDone = Array.from(room.players.values()).every((p) => p.finishedAt || p.forfeited);
                if (allDone)
                    endGame(io, code, "forfeit");
            }
            cb?.({ ok: true });
        });
        socket.on("disconnect", () => {
            rooms.forEach((room, code) => {
                if (room.players.has(socket.id)) {
                    const player = room.players.get(socket.id);
                    player.connected = false;
                    logDebug(`Player ${player.name} disconnected from ${code}. Grace period started.`);
                    const timeout = setTimeout(() => {
                        logDebug(`Player ${player.name} timed out in ${code}. Forfeiting/Removing.`);
                        if (room.players.has(player.id)) {
                            if (room.started) {
                                player.forfeited = true;
                                player.finishedAt = Date.now();
                                io.to(code).emit("pokemon:players", Array.from(room.players.values()));
                                const allDone = Array.from(room.players.values()).every((p) => p.finishedAt || p.forfeited);
                                if (allDone)
                                    endGame(io, code, "dropout");
                            }
                            else {
                                room.players.delete(player.id);
                                io.to(code).emit("pokemon:players", Array.from(room.players.values()));
                                if (room.players.size === 0) {
                                    rooms.delete(code);
                                    emitRooms(io);
                                }
                            }
                        }
                    }, room.started ? 300000 : 30000);
                    room.disconnectTimeouts.set(player.id, timeout);
                }
            });
        });
    });
};
exports.registerPokemonSocket = registerPokemonSocket;
