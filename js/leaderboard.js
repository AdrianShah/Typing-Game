import { db } from './firebase.js';
import { collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getCurrentUser } from './auth.js';
import { loadHistory, saveResult as saveLocalResult } from './storage.js';

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
        date: entry.date || new Date().toISOString()
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
        await addDoc(collection(db, 'leaderboards'), {
            uid: user.uid,
            player: user.username || norm.player,
            icon: user.icon || 'captain',
            team: norm.team,
            mode: norm.mode,
            difficulty: norm.difficulty,
            netWPM: norm.netWPM,
            grossWPM: norm.grossWPM,
            acc: norm.acc,
            date: serverTimestamp()
        });

        // Also save to local storage
        saveLocalResult(norm);

        return { ok: true, data: norm };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

export async function startServerRun(mode, difficulty) {
    const user = getCurrentUser();
    if (!user) return { ok: false, error: 'Unauthorized' };

    try {
        const docRef = await addDoc(collection(db, 'runs'), {
            uid: user.uid,
            mode,
            difficulty,
            startTime: serverTimestamp()
        });
        return { ok: true, runId: docRef.id };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

export async function fetchLeaderboard(mode = 30, difficulty = 'medium') {
    try {
        const q = query(
            collection(db, 'leaderboards'),
            where('mode', '==', mode),
            where('difficulty', '==', difficulty),
            orderBy('netWPM', 'desc'),
            limit(10)
        );
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            list.push({
                ...data,
                date: data.date ? data.date.toDate().toISOString() : new Date().toISOString()
            });
        });
        return { ok: true, list };
    } catch (err) {
        console.error("Leaderboard error", err);
        return { ok: false, error: err.message };
    }
}

export async function fetchClubProgression() {
    const user = getCurrentUser();
    if (!user) return { ok: false, xp: 0, level: 1 };
    
    return { ok: true, xp: 1500, level: 3 };
}

export async function fetchLeagueModifiers() {
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
