import { api } from './convexApi.js';
import { getConvexClient } from './convexClient.js';
import { safeParse } from './utils.js';

const CLERK_APPEARANCE = {
    variables: {
        colorBackground: '#1C1B1B',
        colorPrimary: '#004B23',
        colorText: '#E0E0E0',
        colorInputBackground: '#131313',
        colorInputText: '#E0E0E0',
        colorTextSecondary: '#8A9389',
        colorNeutral: '#404941',
        colorDanger: '#93000a',
        borderRadius: '12px',
    },
    elements: {
        card: 'bg-[#1C1B1B] border border-[#E9C176]/30 shadow-2xl',
        rootBox: 'bg-[#1C1B1B]',
        headerTitle: 'text-[#E9C176] uppercase tracking-[0.18em]',
        headerSubtitle: 'text-[#8A9389]',
        formFieldLabel: 'text-[#8A9389]',
        formFieldInput: 'bg-[#131313] border border-[#404941] text-[#E0E0E0] placeholder:text-[#8A9389]',
        formButtonPrimary: 'bg-[#004B23] text-white hover:bg-[#005a2b]',
        formButtonSecondary: 'bg-[#1C1B1B] border border-[#E9C176]/30 text-[#E9C176] hover:bg-[#2A2A2A]',
        socialButtonsBlockButton: 'bg-[#131313] border border-[#404941] text-[#E0E0E0] hover:border-[#E9C176]/30',
        socialButtonsBlockButtonText: 'text-[#E0E0E0]',
        footerActionLink: 'text-[#E9C176] hover:text-[#ffe2a8]',
        identityPreview: 'bg-[#131313] border border-[#404941]',
        identityPreviewText: 'text-[#E0E0E0]',
        identityPreviewEditButton: 'text-[#E9C176]',
        otpCodeFieldInput: 'bg-[#131313] border border-[#404941] text-[#E0E0E0]',
    },
};
export function getClerkAppearance() {
    return CLERK_APPEARANCE;
}

let currentUser = null;
let clerkInstance = null;
let clerkReadyPromise = null;
let authUnsubscribe = null;
const listeners = new Set();
const PROFILE_STORAGE_KEY = 'wpm_clerk_profile';

function notifyListeners() {
    listeners.forEach((listener) => listener(currentUser));
}

function getClerkPublishableKey() {
    return import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
}

function getStoredProfile() {
    return safeParse(localStorage.getItem(PROFILE_STORAGE_KEY), null);
}

function persistCurrentUser(user) {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(user));
}

function clearStoredAuth() {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
}

function getClerkDisplayName(clerkUser) {
    if (!clerkUser) return 'Player';

    const nameParts = [clerkUser.firstName, clerkUser.lastName].filter(Boolean);
    if (nameParts.length > 0) {
        return nameParts.join(' ');
    }

    if (clerkUser.fullName) {
        return clerkUser.fullName;
    }

    if (clerkUser.username) {
        return clerkUser.username;
    }

    return clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Player';
}

function buildCurrentUser(clerkUser, profileRecord) {
    const avatarUrl = profileRecord?.imageUrl || clerkUser.imageUrl || 'https://cdn.discordapp.com/embed/avatars/0.png';
    const displayName = profileRecord?.player || getClerkDisplayName(clerkUser);

    return {
        uid: clerkUser.id,
        player: displayName,
        username: clerkUser.username || null,
        avatarUrl,
        icon: profileRecord?.icon || avatarUrl,
        country: profileRecord?.country || null,
        email: profileRecord?.email || clerkUser.primaryEmailAddress?.emailAddress || null,
        provider: 'clerk',
        profileComplete: Boolean(profileRecord?.profileComplete),
        accessToken: null,
        lastUsernameChange: profileRecord?.lastUsernameChange || null,
        lastCountryChange: profileRecord?.lastCountryChange || null,
        lastAvatarChange: profileRecord?.lastAvatarChange || null,
    };
}

async function syncProfileWithConvex(user, options = {}) {
    const client = getConvexClient();
    const profileComplete = options.profileComplete ?? user.profileComplete ?? false;

    // Mirror the authenticated profile into Convex so refreshes keep the same
    // user identity, avatar, and country state without a separate profile step.
    await client.mutation(api.users.upsertClerkProfile, {
        uid: user.uid,
        player: user.player,
        icon: user.icon,
        country: user.country || undefined,
        email: user.email || undefined,
        username: user.username || undefined,
        imageUrl: user.avatarUrl || undefined,
        profileComplete,
    });

    return await client.query(api.users.getProfileByUid, { uid: user.uid });
}

async function refreshFromClerk(clerkUser) {
    if (!clerkUser) {
        currentUser = null;
        clearStoredAuth();
        notifyListeners();
        return null;
    }

    const existingProfile = await getConvexClient().query(api.users.getProfileByUid, {
        uid: clerkUser.id,
    });

    const baseUser = buildCurrentUser(clerkUser, existingProfile);
    const profileRecord = await syncProfileWithConvex(baseUser, {
        profileComplete: existingProfile?.profileComplete ?? false,
    });

    currentUser = buildCurrentUser(clerkUser, profileRecord);
    persistCurrentUser(currentUser);
    notifyListeners();
    return currentUser;
}

async function ensureClerk() {
    const publishableKey = getClerkPublishableKey();
    if (!publishableKey) {
        throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in the environment.');
    }

    if (!clerkInstance) {
        const { Clerk } = await import('@clerk/clerk-js');
        // Derive the Frontend API domain from the publishable key
        let clerkDomain = '';
        try {
            const parts = publishableKey.split('_');
            if (parts.length >= 3) {
                clerkDomain = atob(parts[2]).slice(0, -1);
            }
        } catch (e) {
            console.warn('Could not parse clerk domain from key', e);
        }

        // We MUST load the UI script for Vanilla JS, otherwise openSignIn() fails
        if (clerkDomain) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = `https://${clerkDomain}/npm/@clerk/ui@1/dist/ui.browser.js`;
                script.async = true;
                script.crossOrigin = 'anonymous';
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load @clerk/ui bundle'));
                document.head.appendChild(script);
            });
        }

        clerkInstance = new Clerk(publishableKey);
    }

    if (!clerkReadyPromise) {
        clerkReadyPromise = clerkInstance.load({
            appearance: CLERK_APPEARANCE,
            ui: window.__internal_ClerkUICtor ? { ClerkUI: window.__internal_ClerkUICtor } : undefined,
        });
        await clerkReadyPromise;

        if (authUnsubscribe) {
            authUnsubscribe();
        }

        authUnsubscribe = clerkInstance.addListener((resources) => {
            if (resources.user === undefined) {
                return;
            }

            refreshFromClerk(resources.user).catch((error) => {
                console.error('Unable to sync Clerk profile:', error);
            });
        }, { skipInitialEmit: false });
    } else {
        await clerkReadyPromise;
    }

    return clerkInstance;
}

export async function mountClerkUserButton(targetNode) {
    const clerk = await ensureClerk();
    if (!targetNode) return null;

    if (typeof clerk.unmountUserButton === 'function') {
        clerk.unmountUserButton(targetNode);
    }

    clerk.mountUserButton(targetNode, {
        appearance: CLERK_APPEARANCE,
        userProfileMode: 'modal',
        showName: false,
    });

    return clerk;
}

export async function unmountClerkUserButton(targetNode) {
    const clerk = await ensureClerk();
    if (targetNode && typeof clerk.unmountUserButton === 'function') {
        clerk.unmountUserButton(targetNode);
    }
}

export async function initAuth() {
    const storedProfile = getStoredProfile();
    if (storedProfile) {
        currentUser = storedProfile;
        notifyListeners();
    }

    try {
        const clerk = await ensureClerk();
        if (clerk.user) {
            await refreshFromClerk(clerk.user);
        } else if (!storedProfile) {
            currentUser = null;
            notifyListeners();
        }
    } catch (error) {
        console.error('Clerk initialization failed:', error);
        if (!storedProfile) {
            currentUser = null;
            notifyListeners();
        }
    }

    return currentUser;
}

export async function loginWithClerk() {
    try {
        const clerk = await ensureClerk();

        if (typeof clerk.openSignIn === 'function') {
            await clerk.openSignIn({
                appearance: CLERK_APPEARANCE,
            });
            return { ok: true };
        }

        await clerk.redirectToSignIn({
            signInForceRedirectUrl: window.location.href,
            signUpForceRedirectUrl: window.location.href,
            signInFallbackRedirectUrl: window.location.href,
            signUpFallbackRedirectUrl: window.location.href,
        });
        return { ok: true };
    } catch (error) {
        const message = error?.message || '';
        if (message.includes('cannot_render_single_session_enabled') && clerkInstance?.user) {
            await refreshFromClerk(clerkInstance.user);
            return { ok: true };
        }
        return { ok: false, error: error.message };
    }
}

export async function setupProfile(username, icon, country, avatarUrl) {
    if (!currentUser) return { ok: false, error: 'Login first.' };

    const nextUser = {
        ...currentUser,
        player: username?.trim() || currentUser.player,
        icon: icon || currentUser.icon,
        country: country || currentUser.country || null,
        avatarUrl: avatarUrl?.trim() || currentUser.avatarUrl || null,
        profileComplete: true,
    };

    try {
        await getConvexClient().mutation(api.users.updateProfileBasics, {
            uid: nextUser.uid,
            player: nextUser.player,
            icon: nextUser.icon,
            country: nextUser.country || undefined,
            imageUrl: nextUser.avatarUrl || undefined,
            profileComplete: true,
        });

        const updatedProfile = await getConvexClient().query(api.users.getProfileByUid, { uid: nextUser.uid });
        if (updatedProfile) {
            nextUser.lastUsernameChange = updatedProfile.lastUsernameChange || null;
            nextUser.lastCountryChange = updatedProfile.lastCountryChange || null;
            nextUser.lastAvatarChange = updatedProfile.lastAvatarChange || null;
        }

        currentUser = nextUser;
        persistCurrentUser(currentUser);
        notifyListeners();
        return { ok: true, user: currentUser };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

export async function logout() {
    try {
        const clerk = await ensureClerk();
        await clerk.signOut({ redirectUrl: window.location.href });
    } catch (error) {
        console.error('Clerk sign out failed:', error);
    } finally {
        clearStoredAuth();
        currentUser = null;
        notifyListeners();
    }
}

export async function equipCosmeticAvatar(cosmeticId) {
    if (!currentUser?.uid) return { ok: false, error: 'Login first.' };
    try {
        const result = await getConvexClient().mutation(api.users.equipCosmeticAvatar, {
            uid: currentUser.uid,
            cosmeticId,
        });
        const refreshed = await getConvexClient().query(api.users.getProfileByUid, { uid: currentUser.uid });
        if (refreshed) {
            currentUser = {
                ...currentUser,
                avatarUrl: refreshed.imageUrl || currentUser.avatarUrl,
                icon: refreshed.icon || currentUser.icon,
                lastAvatarChange: refreshed.lastAvatarChange || currentUser.lastAvatarChange,
            };
            persistCurrentUser(currentUser);
            notifyListeners();
        }
        return result;
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

export function getCurrentUser() { return currentUser; }
export function isAuthenticated() { return Boolean(currentUser?.uid); }
export function subscribeAuth(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
