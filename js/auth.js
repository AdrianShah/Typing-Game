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
    // Prefer an explicit runtime override (useful for GitHub Pages or static hosts)
    try {
        if (typeof window !== 'undefined' && window.__CLERK_PUBLISHABLE_KEY) {
            console.log('[Clerk] Using publishable key from window.__CLERK_PUBLISHABLE_KEY');
            return window.__CLERK_PUBLISHABLE_KEY;
        }
        if (typeof document !== 'undefined') {
            const meta = document.querySelector('meta[name="clerk-publishable-key"]');
            if (meta?.content) {
                console.log('[Clerk] Using publishable key from meta tag');
                return meta.content;
            }
        }
    } catch (e) {
        // ignore DOM access errors in non-browser contexts
        console.warn('[Clerk] Error checking for publishable key overrides:', e);
    }

    const envKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
    if (envKey) {
        console.log('[Clerk] Using publishable key from environment: ' + envKey.substring(0, 15) + '...');
    } else {
        console.error('[Clerk] No publishable key found in window, meta tag, or environment. Set VITE_CLERK_PUBLISHABLE_KEY in .env.local');
    }
    return envKey;
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
        console.error('[Clerk] No publishable key provided. Authentication disabled.');
        return null;
    }

    if (!clerkInstance) {
        try {
            console.log('[Clerk] Importing @clerk/clerk-js module...');
            const { Clerk } = await import('@clerk/clerk-js');
            console.log('[Clerk] Module imported successfully');
            
            // Derive the Frontend API domain from the publishable key
            let clerkDomain = '';
            try {
                const parts = publishableKey.split('_');
                if (parts.length >= 3) {
                    clerkDomain = atob(parts[2]).slice(0, -1);
                    console.log('[Clerk] Derived Clerk domain from key:', clerkDomain);
                }
            } catch (e) {
                console.warn('[Clerk] Could not parse clerk domain from key:', e);
            }

            // We MUST load the UI script for Vanilla JS, otherwise openSignIn() fails
            if (clerkDomain) {
                console.log('[Clerk] Loading UI bundle from:', `https://${clerkDomain}/npm/@clerk/ui@1/dist/ui.browser.js`);
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = `https://${clerkDomain}/npm/@clerk/ui@1/dist/ui.browser.js`;
                    script.async = true;
                    script.crossOrigin = 'anonymous';
                    script.onload = () => {
                        console.log('[Clerk] UI bundle loaded successfully');
                        resolve();
                    };
                    script.onerror = () => {
                        const err = new Error('Failed to load @clerk/ui bundle');
                        console.error('[Clerk]', err);
                        reject(err);
                    };
                    document.head.appendChild(script);
                    // Safety timeout if script hangs
                    setTimeout(() => reject(new Error('UI bundle loading timeout')), 10000);
                });
            } else {
                console.warn('[Clerk] Could not derive domain; UI bundle loading will be skipped');
            }

            console.log('[Clerk] Creating Clerk instance...');
            clerkInstance = new Clerk(publishableKey);
            console.log('[Clerk] Clerk instance created');
        } catch (err) {
            console.error('[Clerk] Failed to initialize Clerk instance:', err);
            return null;
        }
    }

    if (!clerkReadyPromise) {
        try {
            console.log('[Clerk] Loading Clerk with appearance config...');
            clerkReadyPromise = clerkInstance.load({
                appearance: CLERK_APPEARANCE,
                ui: window.__internal_ClerkUICtor ? { ClerkUI: window.__internal_ClerkUICtor } : undefined,
            });
            await clerkReadyPromise;
            console.log('[Clerk] Clerk loaded and ready');

            if (authUnsubscribe) {
                authUnsubscribe();
            }

            authUnsubscribe = clerkInstance.addListener((resources) => {
                if (resources.user === undefined) {
                    console.log('[Clerk] User signed out');
                    return;
                }

                console.log('[Clerk] User changed, syncing profile...');
                refreshFromClerk(resources.user).catch((error) => {
                    console.error('[Clerk] Unable to sync Clerk profile:', error);
                });
            }, { skipInitialEmit: false });
        } catch (error) {
            console.error('[Clerk] Failed to load Clerk:', error);
            clerkReadyPromise = null;
            return null;
        }
    } else {
        try {
            await clerkReadyPromise;
        } catch (error) {
            console.error('[Clerk] clerkReadyPromise rejected:', error);
            return null;
        }
    }

    return clerkInstance;
}

export async function mountClerkUserButton(targetNode) {
    const clerk = await ensureClerk();
    if (!targetNode || !clerk) return null;

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
    if (!clerk) return;
    if (targetNode && typeof clerk.unmountUserButton === 'function') {
        clerk.unmountUserButton(targetNode);
    }
}

export async function initAuth() {
    console.log('[Clerk] Initializing auth system...');
    const storedProfile = getStoredProfile();
    if (storedProfile) {
        console.log('[Clerk] Restored user from localStorage:', storedProfile.player);
        currentUser = storedProfile;
        notifyListeners();
    }

    try {
        const clerk = await ensureClerk();
        if (!clerk) {
            console.warn('[Clerk] Clerk not configured; using stored profile or guest mode');
            // Clerk not configured; keep stored profile if any and bail out.
            if (!storedProfile) {
                currentUser = null;
                notifyListeners();
            }
        } else if (clerk.user) {
            console.log('[Clerk] Clerk has active user, syncing profile...');
            await refreshFromClerk(clerk.user);
        } else if (!storedProfile) {
            console.log('[Clerk] No active Clerk user and no stored profile, entering guest mode');
            currentUser = null;
            notifyListeners();
        }
    } catch (error) {
        console.error('[Clerk] Auth initialization failed:', error);
        if (!storedProfile) {
            currentUser = null;
            notifyListeners();
        }
    }

    console.log('[Clerk] Auth initialization complete. Current user:', currentUser?.player || 'guest');
    return currentUser;
}

export async function loginWithClerk() {
    console.log('[Clerk] Login initiated...');
    try {
        const clerk = await ensureClerk();
        if (!clerk) {
            const msg = 'Clerk not configured. Check console for details.';
            console.error('[Clerk]', msg);
            return { ok: false, error: msg };
        }

        console.log('[Clerk] Clerk ready, checking for openSignIn function...');
        if (typeof clerk.openSignIn === 'function') {
            console.log('[Clerk] Opening sign-in modal...');
            await clerk.openSignIn({
                appearance: CLERK_APPEARANCE,
            });
            console.log('[Clerk] Sign-in modal opened');
            return { ok: true };
        }

        console.log('[Clerk] openSignIn not available, attempting redirect...');
        await clerk.redirectToSignIn({
            signInForceRedirectUrl: window.location.href,
            signUpForceRedirectUrl: window.location.href,
            signInFallbackRedirectUrl: window.location.href,
            signUpFallbackRedirectUrl: window.location.href,
        });
        return { ok: true };
    } catch (error) {
        console.error('[Clerk] Login error:', error);
        const message = error?.message || '';
        if (message.includes('cannot_render_single_session_enabled') && clerkInstance?.user) {
            console.log('[Clerk] Single session mode detected, refreshing from existing user');
            await refreshFromClerk(clerkInstance.user);
            return { ok: true };
        }
        return { ok: false, error: error.message };
    }
}

export async function setupProfile(username, icon, country, avatarUrl) {
    if (!currentUser) {
        console.error('[Auth] setupProfile called without logged-in user');
        return { ok: false, error: 'Login first.' };
    }

    // Phase 2: Profile Validation
    console.log('[Auth] Validating profile input...');
    const trimmedUsername = username?.trim() || '';
    if (trimmedUsername && (trimmedUsername.length < 2 || trimmedUsername.length > 32)) {
        const err = 'Username must be between 2 and 32 characters';
        console.warn('[Auth]', err);
        return { ok: false, error: err };
    }

    if (!country || country.trim() === '') {
        const err = 'Country is required';
        console.warn('[Auth]', err);
        return { ok: false, error: err };
    }

    const nextUser = {
        ...currentUser,
        player: trimmedUsername || currentUser.player,
        icon: icon || currentUser.icon,
        country: country || currentUser.country || null,
        avatarUrl: avatarUrl?.trim() || currentUser.avatarUrl || null,
        profileComplete: true,
    };

    try {
        console.log('[Auth] Updating profile on server...');
        await getConvexClient().mutation(api.users.updateProfileBasics, {
            uid: nextUser.uid,
            player: nextUser.player,
            icon: nextUser.icon,
            country: nextUser.country || undefined,
            imageUrl: nextUser.avatarUrl || undefined,
            profileComplete: true,
        });

        console.log('[Auth] Profile updated, fetching updated record...');
        const updatedProfile = await getConvexClient().query(api.users.getProfileByUid, { uid: nextUser.uid });
        if (updatedProfile) {
            nextUser.lastUsernameChange = updatedProfile.lastUsernameChange || null;
            nextUser.lastCountryChange = updatedProfile.lastCountryChange || null;
            nextUser.lastAvatarChange = updatedProfile.lastAvatarChange || null;
        }

        currentUser = nextUser;
        persistCurrentUser(currentUser);
        notifyListeners();
        console.log('[Auth] Profile setup complete for:', nextUser.player);
        return { ok: true, user: currentUser };
    } catch (error) {
        console.error('[Auth] Profile setup error:', error);
        return { ok: false, error: error.message };
    }
}

export async function logout() {
    try {
        const clerk = await ensureClerk();
        if (clerk && typeof clerk.signOut === 'function') {
            await clerk.signOut({ redirectUrl: window.location.href });
        }
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
