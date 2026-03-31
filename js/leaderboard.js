// Leaderboard helpers
import { getAuthToken } from './auth.js';
import { loadHistory, saveResult } from './storage.js';

const VALID_MODES = new Set([15, 30, 60, 120]);

function isValidDifficulty(difficulty) {
    return difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard';
}

function normalizeEntry(entry) {
    if (!entry || typeof entry !== 'object') return null;

    const netWPM = Number(entry.netWPM);
    const acc = Number(entry.acc);
    const mode = Number(entry.mode);

    if (!Number.isFinite(netWPM) || !Number.isFinite(acc) || !VALID_MODES.has(mode)) {
        return null;
    }

    return {
        team: entry.team || 'Solo Agent',
        player: entry.player || 'anonymous',
        difficulty: entry.difficulty || 'medium',
        mode,
        netWPM,
        grossWPM: Number(entry.grossWPM) || 0,
        acc,
        date: entry.date || new Date(0).toISOString()
    };
}

export function submitResult(result) {
    const token = getAuthToken();
    if (!token) {
        return Promise.resolve({ ok: false, error: 'You must be logged in.' });
    }

    return fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(result)
    })
        .then(async (response) => {
            let data = {};
            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                return { ok: false, error: data.error || 'Failed to submit score.' };
            }

            if (data?.entry) {
                saveResult(data.entry);
            }

            return { ok: true, entry: data.entry };
        })
        .catch(() => ({ ok: false, error: 'Leaderboard service unavailable.' }));
}

export function startServerRun(mode, difficulty) {
    const token = getAuthToken();
    if (!token) {
        return Promise.resolve({ ok: false, error: 'You must be logged in.' });
    }

    const parsedMode = Number(mode);
    const parsedDifficulty = String(difficulty || '').toLowerCase();

    if (!VALID_MODES.has(parsedMode)) {
        return Promise.resolve({ ok: false, error: 'Invalid mode.' });
    }
    if (!isValidDifficulty(parsedDifficulty)) {
        return Promise.resolve({ ok: false, error: 'Invalid difficulty.' });
    }

    return fetch('/api/runs/start', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            mode: parsedMode,
            difficulty: parsedDifficulty
        })
    })
        .then(async (response) => {
            let data = {};
            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok || !Number.isFinite(Number(data.runId))) {
                return { ok: false, error: data.error || 'Could not start verified run.' };
            }

            return {
                ok: true,
                runId: Number(data.runId),
                startedAt: data.startedAt,
                expiresAt: data.expiresAt
            };
        })
        .catch(() => ({ ok: false, error: 'Could not start verified run.' }));
}

export function fetchLeaderboard() {
    return fetch('/api/leaderboard')
        .then(async (response) => {
            if (!response.ok) {
                throw new Error('Leaderboard unavailable');
            }
            const data = await response.json();
            const entries = Array.isArray(data.entries) ? data.entries : [];
            return entries
                .map(normalizeEntry)
                .filter(Boolean)
                .slice(0, 10);
        })
        .catch(() => {
            // Offline fallback: show local history if API is down.
            return loadHistory()
                .map(normalizeEntry)
                .filter(Boolean)
                .sort((a, b) => {
                    if (b.netWPM !== a.netWPM) return b.netWPM - a.netWPM;
                    if (b.acc !== a.acc) return b.acc - a.acc;
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                })
                .slice(0, 10);
        });
}

export function fetchClubProgression() {
    const token = getAuthToken();
    if (!token) {
        return Promise.resolve({ ok: false, progressions: [] });
    }

    return fetch('/api/club/progression', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        }
    })
        .then(async (response) => {
            let data = {};
            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                return { ok: false, progressions: [] };
            }

            return {
                ok: true,
                progressions: Array.isArray(data.progressions) ? data.progressions : []
            };
        })
        .catch(() => ({ ok: false, progressions: [] }));
}

export function fetchLeagueModifiers() {
    return fetch('/api/league/modifiers', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(async (response) => {
            let data = {};
            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                return { ok: false, modifiers: {}, weekNumber: 0 };
            }

            return {
                ok: true,
                modifiers: data.modifiers || {},
                weekNumber: data.weekNumber || 0
            };
        })
        .catch(() => ({ ok: false, modifiers: {}, weekNumber: 0 }));
}


