export function safeParse(raw, fallback) {
    if (!raw) return fallback;

    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}