import { api } from './convexApi.js';
import { getConvexClient } from './convexClient.js';
import { getCurrentUser } from './auth.js';
import { loadHistory, saveResult as saveLocalResult } from './storage.js';

const VALID_MODES = new Set([15, 30, 60]);

function isValidDifficulty(difficulty) {
    return difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard';
}

function toFiniteNumber(value, fallback = null) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function normalizeEntry(entry) {
    if (!entry || typeof entry !== 'object') return null;

    const netWPM = toFiniteNumber(entry.netWPM);
    const acc = toFiniteNumber(entry.acc);
    const mode = toFiniteNumber(entry.mode);
    const grossWPM = toFiniteNumber(entry.grossWPM, 0);
    const difficulty = isValidDifficulty(entry.difficulty) ? entry.difficulty : 'medium';
    const country = typeof entry.country === 'string' && entry.country.trim() ? entry.country.trim() : 'Solo Agent';
    const player = typeof entry.player === 'string' && entry.player.trim() ? entry.player.trim() : 'anonymous';

    if (!Number.isFinite(netWPM) || !Number.isFinite(acc) || !VALID_MODES.has(mode)) {
        return null;
    }

    return {
        country,
        player,
        difficulty,
        mode,
        netWPM,
        grossWPM,
        acc,
        date: entry.date || new Date().toISOString(),
    };
}

export async function submitResult(result) {
    const user = getCurrentUser();
    if (!user) return { ok: false, error: 'Unauthorized' };

    if (!result.runId) {
        return { ok: false, error: 'No active run found. Did you start the match?' };
    }

    const norm = normalizeEntry(result);
    if (!norm) return { ok: false, error: 'Invalid result format.' };

    try {
        const response = await getConvexClient().mutation(api.leaderboard.submitRun, {
            sessionId: String(result.runId),
            uid: user.uid,
            player: user.player || norm.player,
            icon: user.icon || '🏳️',
            country: norm.country,
            mode: norm.mode,
            difficulty: norm.difficulty,
            netWPM: norm.netWPM,
            grossWPM: norm.grossWPM,
            acc: norm.acc,
        });

        if (!response?.accepted) {
            return {
                ok: false,
                error: response?.message || 'Unable to submit run.',
                personalBest: response?.personalBest ?? null,
            };
        }

        saveLocalResult({
            ...norm,
            country: norm.country,
            player: user.player || norm.player,
            icon: user.icon || '🏳️',
        });

        return { ok: true, data: norm };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

export async function startServerRun(mode, difficulty) {
    const user = getCurrentUser();
    if (!user) return { ok: false, error: 'Unauthorized' };

    const normalizedMode = Number(mode);
    if (!VALID_MODES.has(normalizedMode) || !isValidDifficulty(difficulty)) {
        return { ok: false, error: 'Invalid run settings.' };
    }

    try {
        const runId = await getConvexClient().mutation(api.leaderboard.createRunSession, {
            uid: user.uid,
            mode: normalizedMode,
            difficulty,
        });
        return { ok: true, runId };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

export async function fetchLeaderboard(mode = 30, difficulty = 'medium', country = null) {
    try {
        const normalizedMode = Number(mode);
        const normalizedDifficulty = isValidDifficulty(difficulty) ? difficulty : 'medium';
        const list = await getConvexClient().query(api.leaderboard.getTopRuns, {
            mode: VALID_MODES.has(normalizedMode) ? normalizedMode : 30,
            difficulty: normalizedDifficulty,
            country: country || undefined
        });
        return { ok: true, list };
    } catch (err) {
        console.error('Leaderboard error', err);
        return { ok: false, error: err.message };
    }
}

export async function fetchCountryProgression(uid) {
    const user = getCurrentUser();
    const resolvedUid = uid || user?.uid;
    if (!resolvedUid) return { ok: true, progressions: [] };

    try {
        return await getConvexClient().query(api.leaderboard.fetchCountryProgression, {
            uid: resolvedUid,
        });
    } catch (err) {
        return { ok: false, error: err.message, progressions: [] };
    }
}

export async function fetchCountryModifiers() {
    return new Promise((resolve) => {
        const week = Math.floor(new Date().getTime() / (7 * 24 * 60 * 60 * 1000));

        const allPossibleModifiers = [
            { name: 'Speed Blitz', effect: 'timer reduced by 10%' },
            { name: 'Precision Challenge', effect: 'penalties doubled' },
            { name: 'Endurance Mode', effect: 'long modes favored' },
            { name: 'Accuracy Focused', effect: 'higher min accuracy needed' },
            { name: 'Consistency Run', effect: 'fewer errors = bonus XP' },
            { name: 'Combo Scoring', effect: 'chain accuracy for multiplier' },
            { name: 'Power Hour', effect: '+5% WPM baseline' },
            { name: 'Hard Difficulty Only', effect: 'play hard to earn 1.5x XP' }
        ];

        const modifiers = [
            allPossibleModifiers[(week) % allPossibleModifiers.length],
            allPossibleModifiers[(week + 1) % allPossibleModifiers.length],
            allPossibleModifiers[(week + 2) % allPossibleModifiers.length],
        ];

        resolve({ ok: true, modifiers, weekNumber: week });
    });
}

export async function fetchFactionStandings() {
    return await getConvexClient().query(api.leaderboard.getFactionStandings, {});
}

export async function fetchCampaignOverview() {
    return await getConvexClient().query(api.leaderboard.getCampaignOverview, {});
}

export async function fetchChampionsByWeek(weekKey) {
    return await getConvexClient().query(api.leaderboard.getChampionsByWeek, {
        weekKey: weekKey || undefined,
    });
}

export async function fetchUserCosmetics(uid) {
    const user = getCurrentUser();
    const resolvedUid = uid || user?.uid;
    if (!resolvedUid) return [];
    return await getConvexClient().query(api.leaderboard.getUserCosmetics, { uid: resolvedUid });
}

