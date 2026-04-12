import { safeParse } from './utils.js';

export function saveSettings(settings) {
    localStorage.setItem('swpm_settings', JSON.stringify({
        defaultCountry: settings.defaultCountry || null,
        mode: Number(settings.mode) || 60,
        difficulty: settings.difficulty || 'medium'
    }));
}

export function loadSettings() {
    const raw = localStorage.getItem('swpm_settings');
    const parsed = safeParse(raw, { defaultCountry: null, mode: 60, difficulty: 'medium' });
    return {
        defaultCountry: parsed.defaultCountry || parsed.defaultTeam || null,
        mode: Number(parsed.mode) || 60,
        difficulty: parsed.difficulty || 'medium'
    };
}

export function saveResult(result) {
    if (!result || typeof result !== 'object') return;

    const history = loadHistory();
    history.push({
        country: result.country || result.team || 'Solo Agent',
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
    if (!Array.isArray(parsed)) return [];

    return parsed.map((entry) => ({
        ...entry,
        country: entry.country || entry.team || 'Solo Agent'
    }));
}
