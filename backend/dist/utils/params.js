"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asString = void 0;
const asString = (value, fallback = "") => {
    if (typeof value === "string")
        return value;
    if (Array.isArray(value))
        return typeof value[0] === "string" ? value[0] : fallback;
    if (value === undefined || value === null)
        return fallback;
    return String(value);
};
exports.asString = asString;
