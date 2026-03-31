// API-backed auth helpers

const AUTH_STORAGE_KEY = 'swpm_auth_session';

let currentUser = null;
let authToken = null;
const listeners = new Set();

function safeParse(raw) {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function notifyListeners() {
    listeners.forEach((listener) => listener(currentUser));
}

function normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function storeSession(session) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
}

async function apiRequest(path, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    let data = {};
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        return { ok: false, error: data.error || 'Request failed.' };
    }

    return { ok: true, data };
}

export async function initAuth() {
    const stored = safeParse(localStorage.getItem(AUTH_STORAGE_KEY));
    if (!stored?.token || !stored?.email) {
        currentUser = null;
        authToken = null;
        clearSession();
        return null;
    }

    const me = await apiRequest('/api/auth/me', 'GET', null, stored.token);
    if (!me.ok || !me.data?.user?.email) {
        currentUser = null;
        authToken = null;
        clearSession();
        return null;
    }

    authToken = stored.token;
    currentUser = {
        email: me.data.user.email,
        verified: Boolean(me.data.user.verified),
        username: me.data.user.username || null,
        icon: me.data.user.icon || 'captain',
        profileComplete: Boolean(me.data.user.profileComplete)
    };
    storeSession({ token: authToken, email: currentUser.email });
    notifyListeners();
    return currentUser;
}

export async function registerWithEmailPassword(email, password) {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
        return { ok: false, error: 'Please enter a valid email.' };
    }

    return apiRequest('/api/auth/register', 'POST', {
        email: normalized,
        password
    });
}

export async function verifyEmailCode(email, code) {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
        return { ok: false, error: 'Please enter a valid email.' };
    }

    return apiRequest('/api/auth/verify', 'POST', {
        email: normalized,
        code: (code || '').trim()
    });
}

export async function loginWithEmailPassword(email, password) {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
        return { ok: false, error: 'Please enter a valid email.' };
    }

    const response = await apiRequest('/api/auth/login', 'POST', {
        email: normalized,
        password
    });

    if (!response.ok) {
        return response;
    }

    authToken = response.data.token;
    currentUser = {
        email: response.data.user.email,
        verified: Boolean(response.data.user.verified),
        username: response.data.user.username || null,
        icon: response.data.user.icon || 'captain',
        profileComplete: Boolean(response.data.user.profileComplete)
    };
    storeSession({ token: authToken, email: currentUser.email });
    notifyListeners();

    return { ok: true, user: currentUser };
}

export async function setupProfile(username, icon) {
    const token = getAuthToken();
    if (!token) {
        return { ok: false, error: 'Not authenticated.' };
    }

    const response = await apiRequest('/api/auth/profile', 'POST', {
        username,
        icon
    }, token);

    if (!response.ok) {
        return response;
    }

    currentUser.username = response.data.user.username;
    currentUser.icon = response.data.user.icon;
    currentUser.profileComplete = true;
    notifyListeners();

    return { ok: true, user: response.data.user };
}

export function logout() {
    currentUser = null;
    authToken = null;
    clearSession();
    notifyListeners();
}

export function getCurrentUser() {
    return currentUser;
}

export function getAuthToken() {
    return authToken;
}

export function isAuthenticated() {
    return Boolean(currentUser?.email);
}

export function subscribeAuth(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
