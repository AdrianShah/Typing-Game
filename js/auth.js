import { auth, db } from './firebase.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let currentUser = null;
const listeners = new Set();

function notifyListeners() {
    listeners.forEach((listener) => listener(currentUser));
}

function normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function initAuth() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                if (!firebaseUser.emailVerified) {
                    await signOut(auth);
                    currentUser = null;
                    notifyListeners();
                    resolve(null);
                    return;
                }

                try {
                    const docRef = doc(db, 'users', firebaseUser.uid);
                    let docSnap = await getDoc(docRef);

                    if (!docSnap.exists()) {
                        await setDoc(docRef, {
                            email: firebaseUser.email,
                            profileComplete: false,
                            icon: 'captain',
                            username: null,
                            createdAt: serverTimestamp()
                        });
                        docSnap = await getDoc(docRef);
                    }

                    const data = docSnap.data() || {};
                    currentUser = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        verified: true,
                        username: data.username || null,
                        icon: data.icon || 'captain',
                        profileComplete: Boolean(data.profileComplete)
                    };
                } catch (err) {
                    console.error("Failed to load user profile:", err);
                    currentUser = null;
                }
                
                notifyListeners();
                resolve(currentUser);
            } else {
                currentUser = null;
                notifyListeners();
                resolve(null);
            }
        });
    });
}

export async function registerWithEmailPassword(email, password) {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) return { ok: false, error: 'Please enter a valid email.' };
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, normalized, password);
        await sendEmailVerification(userCredential.user);
        await signOut(auth); // Sign them out until they verify
        return { ok: true };
    } catch (err) {
        let msg = err.message;
        if (err.code === 'auth/email-already-in-use') msg = 'Account already exists. Please login.';
        else if (err.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
        return { ok: false, error: msg };
    }
}

export async function loginWithEmailPassword(email, password) {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) return { ok: false, error: 'Please enter a valid email.' };

    try {
        const userCredential = await signInWithEmailAndPassword(auth, normalized, password);
        if (!userCredential.user.emailVerified) {
            await signOut(auth);
            return { ok: false, error: 'Please verify your email first. Check your inbox.' };
        }
        return { ok: true };
    } catch (err) {
        let msg = err.message;
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
            msg = 'Invalid credentials.';
        }
        return { ok: false, error: msg };
    }
}

export async function verifyEmailCode(email, code) {
    return { ok: false, error: 'Please click the verification link sent to your email.' };
}

export async function setupProfile(username, icon) {
    if (!auth.currentUser || !currentUser) return { ok: false, error: 'Not logged in.' };
    
    try {
        const docRef = doc(db, 'users', currentUser.uid);
        await updateDoc(docRef, {
            username: username,
            icon: icon,
            profileComplete: true
        });

        // Update local state
        currentUser.username = username;
        currentUser.icon = icon;
        currentUser.profileComplete = true;
        notifyListeners();
        return { ok: true, user: currentUser };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

export function logout() {
    signOut(auth).then(() => {
        currentUser = null;
        notifyListeners();
    });
}

export function getCurrentUser() { return currentUser; }
export function getAuthToken() { return currentUser ? 'firebase-token' : null; }
export function isAuthenticated() { return Boolean(currentUser?.email); }
export function subscribeAuth(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
