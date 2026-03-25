export const asString = (value: unknown, fallback = ""): string => {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : fallback;
    if (value === undefined || value === null) return fallback;
    return String(value);
};
