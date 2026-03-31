// Local Storage for stats and preferences

function safeParse(raw, fallback) {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

export function initStorage() {
    console.log("Storage initialized.");
}

export function saveSettings(settings) {
    localStorage.setItem('swpm_settings', JSON.stringify(settings));
}

export function loadSettings() {
    const raw = localStorage.getItem('swpm_settings');
    return safeParse(raw, { defaultTeam: null, mode: 60, difficulty: 'medium' });
}

export function saveResult(result) {
    if (!result || typeof result !== 'object') return;

    const history = loadHistory();
    history.push({
        team: result.team || 'Solo Agent',
        mode: Number(result.mode) || 60,
        difficulty: result.difficulty || 'medium',
        grossWPM: Number(result.grossWPM) || 0,
        netWPM: Number(result.netWPM) || 0,
        acc: Number(result.acc) || 0,
        player: result.player || 'anonymous',
        date: result.date || new Date().toISOString()
    });
    localStorage.setItem('swpm_history', JSON.stringify(history));
}

export function loadHistory() {
    const raw = localStorage.getItem('swpm_history');
    const parsed = safeParse(raw, []);
    return Array.isArray(parsed) ? parsed : [];
}
