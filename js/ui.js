import { initEngine, resetGame, startGame, handleKeystroke, gameState } from './engine.js';
import { calculateGrossWPM, calculateNetWPM, calculateAccuracy } from './metrics.js';
import { CONTINENTS, COUNTRIES, getCountriesByContinent, getCountryById, getContinentById, getCountryFlagEmoji, getCountryFlagImg } from './countries.js';
import { loadSettings, saveSettings } from './storage.js';
import { fetchLeaderboard, submitResult, startServerRun, fetchCountryProgression, fetchCountryModifiers } from './leaderboard.js';
import { getCurrentUser, loginWithClerk, logout, setupProfile, subscribeAuth } from './auth.js';

let selectedCountryId = null;
let currentContinentId = CONTINENTS[0]?.id || 'concacaf';
let currentLeaderboardMode = null;
let currentLeaderboardDiff = null;
let authUnsubscribe = null;
let activeRunId = null;
let gameStarted = false;

const AVAILABLE_MODES = [15, 30, 60];

function escapeHtml(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function getSelectedCountryLabel() {
    const country = getCountryById(selectedCountryId);
    if (!country) return 'Solo Agent';
    return `<div class="w-3 h-2 inline-block -ml-0.5 rounded-[1px] overflow-hidden flex-shrink-0">${getCountryFlagImg(country.code)}</div> ${escapeHtml(country.name)}`;
}

function getSelectedCountryName() {
    const country = getCountryById(selectedCountryId);
    return country ? country.name : 'Solo Agent';
}

function getPlayerAvatar(user) {
    return user?.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png';
}

function updateNavActive(screenId) {
    document.querySelectorAll('.nav-btn').forEach((btn) => {
        btn.classList.remove('text-[#93D6A0]', 'border-[#004B23]');
        btn.classList.add('text-[#8A9389]', 'border-transparent');
    });

    const activeBtn = document.getElementById(`nav-${screenId}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-[#8A9389]', 'border-transparent');
        activeBtn.classList.add('text-[#93D6A0]', 'border-[#004B23]');
    }
}

function setupNavigation() {
    ['play', 'countries', 'leaderboard', 'multiplayer'].forEach((id) => {
        const btn = document.getElementById(`nav-${id}`);
        if (btn) btn.addEventListener('click', () => renderScreen(id));
    });

    ['play', 'countries', 'leaderboard', 'multiplayer'].forEach((id) => {
        const btn = document.getElementById(`nav-mob-${id}`);
        if (btn) btn.addEventListener('click', () => renderScreen(id));
    });
}

function setupHeaderDropdowns() {
    const notifBtn = document.getElementById('notification-btn');
    const notifSidebar = document.getElementById('notification-sidebar');
    const notifCloseBtn = document.getElementById('notification-close-btn');
    const profileRoot = document.getElementById('profile-action-root');

    let profileMenuEl = null;

    const setNotificationsOpen = (isOpen) => {
        if (!notifSidebar) return;
        notifSidebar.classList.toggle('translate-x-full', !isOpen);
        notifSidebar.classList.toggle('translate-x-0', isOpen);
    };

    const renderSignedOutButton = () => {
        if (!profileRoot) return;
        profileRoot.classList.remove('hidden');
        profileRoot.innerHTML = `
            <button id="btn-login-clerk" class="bg-[#004B23] text-white font-headline font-bold uppercase tracking-[0.2em] text-[10px] py-2.5 px-4 rounded-md hover:bg-[#005a2b] transition-all duration-300" type="button">
                Sign In
            </button>
        `;

        const loginButton = document.getElementById('btn-login-clerk');
        if (!loginButton) return;
        loginButton.addEventListener('click', async () => {
            const result = await loginWithClerk();
            if (!result.ok) {
                alert(result.error);
            }
        });
    };

    const renderProfileAction = async () => {
        const user = getCurrentUser();

        if (!profileRoot) return;

        if (user) {
            const displayName = user.player || user.username || user.email || 'Player';
            const progressionResult = await fetchCountryProgression(user.uid);
            let totalXp = 0;
            (progressionResult.progressions || []).forEach(p => totalXp += p.xp);
            const currentLevel = Math.floor(totalXp / 500) + 1;
            const xpProgress = (totalXp % 500) / 5;

            const avatarUrl = getPlayerAvatar(user);

            profileRoot.classList.remove('hidden');
            profileRoot.innerHTML = `
                <div class="hidden md:flex flex-col items-end mr-4 justify-center">
                    <span class="text-[10px] text-[#E9C176] tracking-widest uppercase font-bold">Level ${currentLevel}</span>
                    <div class="w-24 h-1.5 bg-[#404941] rounded-full mt-1 overflow-hidden">
                        <div class="h-full bg-[#93D6A0]" style="width: ${xpProgress}%"></div>
                    </div>
                </div>
                <div class="relative">
                    <button id="profile-menu-btn" class="w-10 h-10 rounded-full border border-[#E9C176]/40 overflow-hidden relative bg-[#2A2A2A] hover:border-[#E9C176] transition-colors" type="button" aria-label="Open profile menu" title="${escapeHtml(displayName)}">
                        <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(displayName)}" class="w-full h-full object-cover" />
                    </button>
                    <div id="profile-menu" class="hidden absolute right-0 mt-2 w-52 bg-[#1C1B1B] border border-[#404941]/40 rounded-lg shadow-2xl z-[70] p-3">
                        <p class="text-[10px] uppercase tracking-[0.2em] text-[#8A9389]">Signed in as</p>
                        <p class="text-sm text-[#E0E0E0] truncate mt-1">${escapeHtml(displayName)}</p>
                        <div class="mt-3 flex flex-col gap-2">
                            <button id="btn-edit-profile" class="w-full bg-[#131313] border border-[#404941]/50 text-[#E0E0E0] font-headline font-bold uppercase tracking-[0.18em] text-[10px] py-2.5 rounded-md hover:bg-[#1A1A1A] transition-colors" type="button">
                                Edit Profile
                            </button>
                            <button id="btn-logout-submit" class="w-full bg-[#2A2A2A] border border-[#404941]/50 text-[#E9C176] font-headline font-bold uppercase tracking-[0.18em] text-[10px] py-2.5 rounded-md hover:bg-[#333333] transition-colors" type="button">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            `;

            const profileMenuBtn = document.getElementById('profile-menu-btn');
            profileMenuEl = document.getElementById('profile-menu');
            const editProfileBtn = document.getElementById('btn-edit-profile');
            const logoutButton = document.getElementById('btn-logout-submit');

            if (profileMenuBtn && profileMenuEl) {
                profileMenuBtn.addEventListener('click', (event) => {
                    event.stopPropagation();
                    profileMenuEl.classList.toggle('hidden');
                });
            }

            if (editProfileBtn) {
                editProfileBtn.addEventListener('click', () => {
                    profileMenuEl.classList.add('hidden');
                    showProfileSetupModal(false);
                });
            }

            if (logoutButton) {
                logoutButton.addEventListener('click', async () => {
                    await logout();
                    if (profileMenuEl) {
                        profileMenuEl.classList.add('hidden');
                    }
                });
            }

            if (!user.profileComplete) {
                setTimeout(() => {
                    if (getCurrentUser()?.profileComplete === false) {
                        showProfileSetupModal(true);
                    }
                }, 0);
            }
            return;
        }

        renderSignedOutButton();
    };

    notifBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = notifSidebar?.classList.contains('translate-x-0');
        setNotificationsOpen(!isOpen);
        document.getElementById('notif-badge').classList.add('hidden');
    });

    if (notifCloseBtn) {
        notifCloseBtn.addEventListener('click', () => setNotificationsOpen(false));
    }

    document.addEventListener('click', (event) => {
        if (notifSidebar && !notifSidebar.contains(event.target) && !notifBtn.contains(event.target)) {
            setNotificationsOpen(false);
        }
        if (profileMenuEl && !profileRoot.contains(event.target)) {
            profileMenuEl.classList.add('hidden');
        }
    });

    if (authUnsubscribe) {
        authUnsubscribe();
    }
    authUnsubscribe = subscribeAuth(renderProfileAction);
    renderProfileAction();
}

function showProfileSetupModal(isMandatory = false) {
    const existingModal = document.getElementById('profile-setup-modal');
    if (existingModal) existingModal.remove();

    const user = getCurrentUser();
    if (!user) return;

    let selectedAvatarUrl = user.avatarUrl;

    const getAvatarsForCountry = (countryName) => {
        const base = countryName || 'Globe';
        return [1, 2, 3, 4, 5].map(i => `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(base + '-' + i)}&backgroundColor=131313`);
    };

    const renderSecondaryAvatarList = (selectedUrl, countryName) => {
        const avatars = getAvatarsForCountry(countryName);
        if (!selectedUrl || !avatars.includes(selectedUrl)) {
            selectedUrl = avatars[0];
        }
        selectedAvatarUrl = selectedUrl;
        return avatars.map((url) => {
            const isSelected = selectedAvatarUrl === url;
            return `
                <img 
                    src="${url}" 
                    class="avatar-option w-12 h-12 rounded-lg cursor-pointer transition-all border-2 ${isSelected ? 'border-[#E9C176] scale-110 shadow-[0_0_10px_rgba(233,193,118,0.4)]' : 'border-transparent hover:border-outline/30'}"
                    data-url="${url}"
                    alt="Avatar option"
                />
            `;
        }).join('');
    };

    const sortedCountries = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
    const optionsHtml = sortedCountries.map((country) => {
        const selected = user.country === country.name ? 'selected' : '';
        return `<option value="${escapeHtml(country.name)}" ${selected}>${getCountryFlagEmoji(country.code)} ${escapeHtml(country.name)}</option>`;
    }).join('');

    const modal = document.createElement('div');
    modal.id = 'profile-setup-modal';
    modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-[#1C1B1B] border border-[#E9C176]/40 rounded-xl p-8 max-w-md w-full space-y-6 block">
            <h2 class="text-2xl font-headline font-black text-[#E9C176] uppercase tracking-tight">${isMandatory ? 'Complete Your Profile' : 'Edit Profile'}</h2>
            <div class="space-y-2">
                <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Username (Max once per 30 Days)</label>
                <input id="profile-username" class="w-full bg-[#131313] border border-outline/10 py-3 px-3 text-[#E0E0E0] text-sm focus:outline-none focus:border-[#E9C176]/30 transition-all" placeholder="Choose your name" type="text" maxlength="40" value="${escapeHtml(user.player || '')}" />
            </div>
            <div class="space-y-2">
                <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Country</label>
                <select id="profile-country" class="w-full bg-[#131313] border border-outline/10 py-3 px-3 text-[#E0E0E0] text-sm focus:outline-none focus:border-[#E9C176]/30 transition-all">
                    <option value="">Select a country</option>
                    ${optionsHtml}
                </select>
            </div>
            <div class="space-y-2">
                <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Avatar (Max once per 1 Day)</label>
                <div id="modal-avatar-list" class="flex items-center justify-between gap-2 py-2 w-full">
                    ${renderSecondaryAvatarList(selectedAvatarUrl, user.country || '')}
                </div>
            </div>
            <div class="grid ${isMandatory ? 'grid-cols-1' : 'grid-cols-2'} gap-2">
                ${isMandatory ? '' : '<button id="profile-cancel-btn" class="w-full bg-[#1C1B1B] border border-outline/30 text-[#8A9389] font-headline font-bold uppercase tracking-[0.2em] text-[10px] py-3 hover:bg-[#2A2A2A] transition-all" type="button">Cancel</button>'}
                <button id="profile-save-btn" class="w-full bg-[#004B23] text-white font-headline font-bold uppercase tracking-[0.2em] text-[10px] py-3 hover:bg-[#005a2b] transition-all" type="button">Save Profile</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const attachAvatarEvents = () => {
        const avatarOptions = modal.querySelectorAll('.avatar-option');
        avatarOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                avatarOptions.forEach(o => {
                    o.classList.remove('border-[#E9C176]', 'scale-110', 'shadow-[0_0_10px_rgba(233,193,118,0.4)]');
                    o.classList.add('border-transparent', 'hover:border-outline/30');
                });
                opt.classList.remove('border-transparent', 'hover:border-outline/30');
                opt.classList.add('border-[#E9C176]', 'scale-110', 'shadow-[0_0_10px_rgba(233,193,118,0.4)]');
                selectedAvatarUrl = opt.dataset.url;
            });
        });
    };
    attachAvatarEvents();

    const countrySelect = document.getElementById('profile-country');
    countrySelect.addEventListener('change', () => {
        const newCountry = countrySelect.value;
        const avatarListEl = document.getElementById('modal-avatar-list');
        // Country changes regenerate the avatar suggestions, so clear the previous selection before rendering the new list.
        selectedAvatarUrl = null;
        avatarListEl.innerHTML = renderSecondaryAvatarList(selectedAvatarUrl, newCountry);
        attachAvatarEvents();
    });

    if (!isMandatory) {
        document.getElementById('profile-cancel-btn').addEventListener('click', () => {
            modal.remove();
        });
    }

    document.getElementById('profile-save-btn').addEventListener('click', async () => {
        const username = document.getElementById('profile-username').value.trim();
        const avatarUrl = selectedAvatarUrl;
        const country = document.getElementById('profile-country').value;

        if (!username) {
            alert('Please enter a username.');
            return;
        }
        if (!country) {
            alert('Please select a country.');
            return;
        }

        const result = await setupProfile(username, user.icon, country, avatarUrl);
        if (!result.ok) {
            alert(result.error || 'Unable to save profile.');
            return;
        }

        const matchedCountry = COUNTRIES.find((entry) => entry.name === country);
        if (matchedCountry) {
            selectedCountryId = matchedCountry.id;
            saveSettings({ ...loadSettings(), defaultCountry: selectedCountryId, mode: gameState.mode, difficulty: gameState.difficulty });
        }

        modal.remove();
        setupHeaderDropdowns();
    });
}

export function initUI() {
    const settings = loadSettings();
    if (AVAILABLE_MODES.includes(Number(settings.mode))) {
        gameState.mode = Number(settings.mode);
    }
    if (['easy', 'medium', 'hard'].includes(settings.difficulty)) {
        gameState.difficulty = settings.difficulty;
    }
    selectedCountryId = settings.defaultCountry || null;

    setupNavigation();
    setupHeaderDropdowns();
    renderScreen('play');
    document.addEventListener('keydown', onGlobalKeyDown);
}

export async function renderScreen(screenId) {
    updateNavActive(screenId);
    const main = document.getElementById('main-content');

    // Remove room param from URL if we navigate away from multiplayer
    if (screenId !== 'multiplayer') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('room')) {
            history.pushState(null, '', window.location.pathname);
        }
    }

    if (screenId === 'play') {
        const playerLabel = getSelectedCountryLabel();
        const modeButtonsHtml = AVAILABLE_MODES.map((mode) => `
            <button class="mode-btn text-[10px] font-bold uppercase tracking-widest ${gameState.mode === mode ? 'text-[#E9C176]' : 'text-[#8A9389]'}" data-mode="${mode}">${mode}s</button>
        `).join('');

        main.innerHTML = `
            <section id="country-modifiers" class="w-full mb-12 px-2"></section>

            <section class="w-full mb-16 space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full mb-3 px-2">
                    <div class="flex gap-4">
                        <button class="diff-btn text-[10px] font-bold uppercase tracking-widest ${gameState.difficulty === 'easy' ? 'text-[#E9C176]' : 'text-[#8A9389]'}" data-diff="easy">Easy</button>
                        <button class="diff-btn text-[10px] font-bold uppercase tracking-widest ${gameState.difficulty === 'medium' ? 'text-[#E9C176]' : 'text-[#8A9389]'}" data-diff="medium">Medium</button>
                        <button class="diff-btn text-[10px] font-bold uppercase tracking-widest ${gameState.difficulty === 'hard' ? 'text-[#E9C176]' : 'text-[#8A9389]'}" data-diff="hard">Hard</button>
                    </div>
                    <div class="flex gap-4">
                        ${modeButtonsHtml}
                    </div>
                </div>

                <div class="relative min-h-[5rem] flex flex-col gap-1 w-full bg-surface-container-low rounded-lg overflow-hidden pitch-gradient border border-outline/10 px-0 py-2">
                    <div class="absolute inset-0 flex justify-between px-8 opacity-5">
                        <div class="h-full border-l border-on-surface"></div>
                        <div class="h-full border-l border-on-surface"></div>
                        <div class="h-full border-l border-on-surface"></div>
                        <div class="h-full border-l border-on-surface"></div>
                        <div class="h-full border-l border-on-surface"></div>
                    </div>

                      ${gameState.isMultiplayer && gameState.multiplayerModeData.participants ? gameState.multiplayerModeData.participants.map((p, i) => `
                          <div class="relative w-full h-8 flex items-center mb-1 mt-5 group">
                              <div class="h-px w-full bg-outline/20 absolute z-0"></div>
                              <div id="player-progress-${p._id}" class="absolute left-[0%] flex items-center gap-2 transition-all duration-300 ease-out z-10">
                                  <span class="text-[8px] font-bold text-secondary uppercase tracking-[0.2em] ${p._id === gameState.multiplayerModeData.participantId ? 'bg-primary text-black' : 'bg-surface-container-highest text-white'} px-1.5 py-0.5 rounded-sm flex items-center gap-1 h-5">
                                      ${p.country ? `<div class="w-3 h-2 inline-block -ml-0.5 rounded-[1px] overflow-hidden flex-shrink-0">${getCountryFlagImg(COUNTRIES.find(c => c.name === p.country)?.code || '')}</div>` : ''}
                                      <span>${escapeHtml(p.player)}</span>
                                  </span>
                                  ${p.icon && p.icon.startsWith('http') ? `<img src="${escapeHtml(p.icon)}" class="w-5 h-5 rounded-full object-cover border border-outline/20 bg-[#131313]">` : `<span class="text-sm bg-surface-container-highest rounded-full w-5 h-5 flex items-center justify-center">${escapeHtml(p.icon) || '👤'}</span>`}
                                  <div id="emoji-popup-${p._id}" class="absolute -top-8 left-1/2 -translate-x-1/2 text-3xl opacity-0 transition-all duration-500 pointer-events-none scale-50 z-20"></div>
                              </div>
                          </div>
                      `).join('') : `
                          <div class="relative w-full h-6 flex items-center mb-1 mt-5">
                              <div class="h-px w-full bg-outline/20 absolute"></div>
                              <div id="player-progress" class="absolute left-[0%] flex items-center gap-2 transition-all duration-300 ease-out z-10">
                                  <span class="text-[8px] font-bold text-secondary uppercase tracking-[0.2em] bg-primary px-1.5 py-0.5 rounded-sm flex items-center gap-1 h-5">${playerLabel}</span>
                                  <span class="material-symbols-outlined text-secondary text-base" style="font-variation-settings: 'FILL' 1;">public</span>
                              </div>
                          </div>
                      `}
                      ${gameState.isMultiplayer ? `
                      <div class="absolute bottom-2 right-4 flex gap-2 z-20 opacity-40 hover:opacity-100 transition-opacity">
                          <button class="emoji-hotkey text-xs bg-surface-container-highest border border-outline/10 px-2 py-1 rounded-md cursor-pointer hover:border-[#E9C176]" data-emoji="🔥">1 🔥</button>
                          <button class="emoji-hotkey text-xs bg-surface-container-highest border border-outline/10 px-2 py-1 rounded-md cursor-pointer hover:border-[#E9C176]" data-emoji="😂">2 😂</button>
                          <button class="emoji-hotkey text-xs bg-surface-container-highest border border-outline/10 px-2 py-1 rounded-md cursor-pointer hover:border-[#E9C176]" data-emoji="😭">3 😭</button>
                          <button class="emoji-hotkey text-xs bg-surface-container-highest border border-outline/10 px-2 py-1 rounded-md cursor-pointer hover:border-[#E9C176]" data-emoji="💀">4 💀</button>
                          <button class="emoji-hotkey text-xs bg-surface-container-highest border border-outline/10 px-2 py-1 rounded-md cursor-pointer hover:border-[#E9C176]" data-emoji="❤️">5 ❤️</button>
                          <button class="emoji-hotkey text-xs bg-surface-container-highest border border-outline/10 px-2 py-1 rounded-md cursor-pointer hover:border-[#E9C176]" data-emoji="👀">6 👀</button>
                      </div>` : ''}
                    </div>
                </div>
            </section>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-16 max-w-4xl mx-auto">
                <div class="bg-surface-container-low/40 p-8 rounded-lg flex flex-col items-center justify-center border border-outline/5">
                    <span class="text-[10px] font-['Manrope'] font-bold tracking-[0.3em] text-on-surface-variant uppercase mb-3">Time</span>
                    <div class="flex items-baseline gap-2">
                        <span id="time-display" class="text-6xl font-headline font-extrabold text-[#E0E0E0]">${gameState.mode}</span>
                        <span class="text-lg font-headline font-medium text-on-surface-variant">s</span>
                    </div>
                </div>
                <div class="bg-surface-container-low/40 p-8 rounded-lg flex flex-col items-center justify-center border border-outline/5">
                    <span class="text-[10px] font-['Manrope'] font-bold tracking-[0.3em] text-on-surface-variant uppercase mb-3">Live WPM</span>
                    <div class="flex items-baseline gap-2">
                        <span id="wpm-display" class="text-6xl font-headline font-extrabold text-[#E0E0E0]">0</span>
                        <span class="text-lg font-headline font-medium text-on-surface-variant">WPM</span>
                    </div>
                </div>
            </div>

            <div class="w-full max-w-4xl bg-surface-container-low/30 p-12 rounded-lg backdrop-blur-md relative border border-outline/10 overflow-hidden">
                <div id="countdown-overlay" class="hidden absolute inset-0 z-50 flex items-center justify-center bg-[#131313]/90 backdrop-blur-md rounded-xl transition-opacity duration-300">
                    <span id="countdown-number" class="text-[150px] leading-none font-headline font-black text-[#93D6A0] drop-shadow-2xl">3</span>
                </div>
                <div id="word-display-area" class="text-2xl md:text-3xl leading-[1.8] font-body text-on-surface-variant select-none tracking-wide text-center flex flex-wrap justify-center gap-1 transition-all duration-300"></div>
            </div>

            <div class="mt-16 flex gap-6" id="action-buttons">
                ${!gameState.isMultiplayer ? `
                <button id="start-btn" class="${gameStarted ? 'hidden' : ''} bg-[#004B23] text-white font-bold px-10 py-3.5 rounded-sm hover:brightness-125 active:scale-[0.98] transition-all duration-300 uppercase tracking-[0.2em] text-[11px] font-label border border-secondary/20">
                    Start Match
                </button>
                <button id="restart-btn" class="${gameStarted ? '' : 'hidden'} bg-primary text-[#E9C176] font-bold px-10 py-3.5 rounded-sm hover:brightness-125 active:scale-[0.98] transition-all duration-300 uppercase tracking-[0.2em] text-[11px] font-label border border-secondary/20">
                    Restart Match
                </button>
                ` : `<button id="exit-multiplayer-btn" class="bg-error/20 text-error font-bold px-10 py-3.5 rounded-sm hover:bg-error hover:text-white active:scale-[0.98] transition-all duration-300 uppercase tracking-[0.2em] text-[11px] font-label border border-error/50">
                    Return to Lobby
                </button>`}
            </div>
        `;

        activeRunId = null;
        gameStarted = false;
        resetGame(gameState.mode, gameState.difficulty);
        bindPlayEvents();
        updateWordDisplay();

        if (gameState.isMultiplayer && gameState.multiplayerModeData) {
            const overlay = document.getElementById('countdown-overlay');
            const cntNum = document.getElementById('countdown-number');
            const wordArea = document.getElementById('word-display-area');
            
            gameState.status = 'countdown';
            overlay.classList.remove('hidden');
            wordArea.classList.add('blur-sm', 'opacity-30', 'pointer-events-none');

            const cdInterval = setInterval(() => {
                // If user leaves screen
                if (document.getElementById('countdown-overlay') !== overlay) {
                    clearInterval(cdInterval);
                    return;
                }
                const msLeft = gameState.multiplayerModeData.serverStartTime - Date.now();
                if (msLeft <= 0) {
                    clearInterval(cdInterval);
                    overlay.classList.add('opacity-0');
                    setTimeout(() => overlay.classList.add('hidden'), 300);
                    wordArea.classList.remove('blur-sm', 'opacity-30', 'pointer-events-none');
                    gameStarted = true;
                    // Trigger actual multiplayer start so UI ticks down and responds
                    startGame(updateTick, showResults);
                } else {
                    cntNum.innerText = Math.ceil(msLeft / 1000);
                }
            }, 100);
        }

        fetchCountryModifiers().then((result) => {
            if (!result.ok || !result.modifiers) return;
            const modifiersEl = document.getElementById('country-modifiers');
            if (!modifiersEl) return;

            const modHTML = result.modifiers
                .map((modifier) => `
                    <div class="flex-1 bg-[#1C1B1B] border border-[#E9C176]/30 rounded-lg px-4 py-3 flex items-center min-w-[200px]">
                        <span class="text-[10px] text-[#E9C176] font-bold uppercase tracking-wider whitespace-nowrap">${escapeHtml(modifier.name)}:</span>
                        <span class="text-[10px] text-[#8A9389] ml-2 truncate">${escapeHtml(modifier.effect)}</span>
                    </div>
                `)
                .join('');

            modifiersEl.innerHTML = `
                <p class="text-[10px] text-[#8A9389] uppercase tracking-widest font-bold mb-3">This Week's Route Modifiers</p>
                <div class="flex flex-row overflow-x-auto gap-3 w-full hide-scrollbar">
                    ${modHTML}
                </div>
            `;
        });
    } else if (screenId === 'countries') {
        const continentTabsHtml = CONTINENTS.map((continent) => `
            <button class="continent-tab bg-surface-container-high border border-outline/5 text-on-surface-variant hover:text-on-surface font-semibold text-[11px] tracking-[0.1em] px-8 py-4 rounded-lg whitespace-nowrap uppercase transition-all ${continent.id === currentContinentId ? 'bg-[#004B23] text-white' : ''}" data-continent="${continent.id}">${continent.name}</button>
        `).join('');

        main.innerHTML = `
            <div class="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 w-full">
                <div>
                    <span class="text-on-surface-variant font-headline font-semibold text-xs tracking-[0.3em] uppercase">Recruitment Phase</span>
                    <h1 class="text-4xl md:text-6xl font-headline font-bold tracking-tight mt-3 text-on-surface uppercase">Select Your <span class="text-[#E9C176]">Country</span></h1>
                </div>
            </div>

            <div class="flex gap-3 overflow-x-auto pb-4 w-full scrollbar-hide mb-8">
                ${continentTabsHtml}
            </div>

            <div id="country-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full"></div>
        `;

        document.querySelectorAll('.continent-tab').forEach((tab) => {
            tab.addEventListener('click', (event) => {
                const continentId = event.currentTarget.getAttribute('data-continent');
                currentContinentId = continentId;
                renderCountries(continentId);
            });
        });

        await renderCountries(currentContinentId);
    } else if (screenId === 'leaderboard') {
        if (!currentLeaderboardMode) currentLeaderboardMode = gameState.mode;
        if (!currentLeaderboardDiff) currentLeaderboardDiff = gameState.difficulty;
        await renderLeaderboardContent();
    } else if (screenId === 'multiplayer') {
        const { renderMultiplayerScreen } = await import('./multiplayerUI.js');
        await renderMultiplayerScreen(main);
    }
}

async function renderLeaderboardContent() {
    const main = document.getElementById('main-content');
    if (!main) return;
    
    main.innerHTML = '<div class="w-full text-center text-[#8A9389] uppercase tracking-widest text-xs py-12">Loading leaderboard...</div>';
    
    const board = await fetchLeaderboard(currentLeaderboardMode, currentLeaderboardDiff);
    const rows = (board.list || []).map((entry, index) => `
        <div class="grid grid-cols-12 px-10 py-6 items-center hover:bg-[#201F1F] transition-all duration-300 border-b border-outline/5 ${index % 2 === 0 ? '' : 'bg-[#181818]'}">
            <div class="col-span-1 font-headline font-black text-xl text-[#E0E0E0]">${String(index + 1).padStart(2, '0')}</div>
            <div class="col-span-6 flex flex-col justify-center">
                <div class="font-bold text-base text-[#E0E0E0]">${escapeHtml(entry.country || 'Agent')}</div>
                <div class="text-[10px] text-[#8A9389] uppercase tracking-widest font-semibold">${escapeHtml(entry.player || 'anonymous')} • ${entry.mode}s • ${escapeHtml(entry.difficulty)}</div>
            </div>
            <div class="col-span-3 text-center text-sm font-bold text-[#93D6A0]">${Number(entry.acc || 0).toFixed(1)}%</div>
            <div class="col-span-2 text-right font-headline font-black text-2xl text-[#E9C176]">${Math.round(Number(entry.netWPM || 0))}</div>
        </div>
    `).join('');

    const modeTabsHtml = AVAILABLE_MODES.map((mode) => `
        <button class="lb-mode-btn bg-surface-container-high border border-outline/5 text-on-surface-variant hover:text-on-surface font-semibold text-[11px] tracking-[0.1em] px-6 py-2 rounded-lg whitespace-nowrap uppercase transition-all ${mode === currentLeaderboardMode ? 'bg-[#004B23] text-white border-transparent' : ''}" data-mode="${mode}">${mode}s</button>
    `).join('');

    const diffTabsHtml = ['easy', 'medium', 'hard'].map((diff) => `
        <button class="lb-diff-btn bg-surface-container-high border border-outline/5 text-on-surface-variant hover:text-on-surface font-semibold text-[11px] tracking-[0.1em] px-6 py-2 rounded-lg whitespace-nowrap uppercase transition-all ${diff === currentLeaderboardDiff ? 'bg-[#1C1B1B] text-[#E9C176] border-[#E9C176]/50' : ''}" data-diff="${diff}">${diff}</button>
    `).join('');

    main.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 w-full">
            <div>
                <span class="text-[#004B23] font-headline text-xs font-bold tracking-[0.3em] uppercase">Global Rankings</span>
                <h1 class="text-6xl font-headline font-black tracking-tight mt-2 text-[#E9C176]">Leaderboard</h1>
                <p class="text-xs text-[#8A9389] uppercase tracking-widest mt-2">Top 10 runs for ${currentLeaderboardMode}s (${currentLeaderboardDiff})</p>
            </div>
            <div class="flex flex-col md:items-end gap-3">
                <div class="flex gap-2 overflow-x-auto pb-1">${modeTabsHtml}</div>
                <div class="flex gap-2 overflow-x-auto pb-1">${diffTabsHtml}</div>
            </div>
        </div>

        <div class="bg-[#1C1B1B] border border-outline/10 rounded-2xl overflow-hidden shadow-xl w-full">
            <div class="grid grid-cols-12 px-10 py-6 border-b border-outline/10 text-[10px] uppercase tracking-[0.3em] font-black text-[#8A9389]">
                <div class="col-span-1">Rank</div>
                <div class="col-span-6">Stats</div>
                <div class="col-span-3 text-center text-primary/80">Accuracy</div>
                <div class="col-span-2 text-right">Avg WPM</div>
            </div>
            <div class="flex flex-col">
                ${rows || '<div class="p-8 text-center text-[#8A9389]">No results yet. Start a match.</div>'}
            </div>
        </div>
    `;

    document.querySelectorAll('.lb-mode-btn').forEach(btn => btn.addEventListener('click', (e) => {
        currentLeaderboardMode = Number(e.currentTarget.getAttribute('data-mode'));
        renderLeaderboardContent();
    }));
    document.querySelectorAll('.lb-diff-btn').forEach(btn => btn.addEventListener('click', (e) => {
        currentLeaderboardDiff = e.currentTarget.getAttribute('data-diff');
        renderLeaderboardContent();
    }));
}

async function renderCountries(continentId) {
    const grid = document.getElementById('country-grid');
    if (!grid) return;

    document.querySelectorAll('.continent-tab').forEach((tab) => {
        const isActive = tab.getAttribute('data-continent') === continentId;
        tab.classList.toggle('bg-[#004B23]', isActive);
        tab.classList.toggle('text-white', isActive);
    });

    const countries = getCountriesByContinent(continentId);
    const currentUser = getCurrentUser();
    const progressionResult = await fetchCountryProgression(currentUser?.uid);
    const progressionMap = new Map((progressionResult.progressions || []).map((progression) => [progression.countryId, progression]));

    grid.innerHTML = countries.map((country) => {
        const isSelected = country.id === selectedCountryId;
        const flag = getCountryFlagImg(country.code);
        const progress = progressionMap.get(country.name);
        const continent = getContinentById(country.continentId);
        const progressDisplay = progress
            ? `<div class="mt-2 text-[10px] text-[#93D6A0] uppercase tracking-widest">Level ${progress.level} • ${progress.xp} XP • ${progress.runs} runs</div>`
            : '<div class="mt-2 text-[10px] text-[#8A9389] uppercase tracking-widest">No runs yet</div>';

        return `
            <div class="country-card group relative overflow-hidden rounded-xl p-8 border transition-all duration-500 cursor-pointer ${isSelected ? 'bg-[#201F1F] border-[#E9C176]/50 shadow-[0_10px_30px_rgba(0,0,0,0.3)]' : 'bg-surface-container-low border-outline/5 hover:border-[#E9C176]/20 hover:bg-[#201F1F]'}" data-country="${country.id}">
                ${isSelected ? '<div class="absolute top-6 right-6"><span class="material-symbols-outlined text-[#E9C176] text-xl" style="font-variation-settings: \'FILL\' 1;">check_circle</span></div>' : ''}
                <div class="flex flex-col h-full">
                    <div class="mb-10 w-20 h-20 bg-[#2A2A2A] rounded-full flex items-center justify-center border border-outline/10 overflow-hidden ${isSelected ? 'border-[#E9C176]/50 shadow-[0_0_15px_rgba(233,193,118,0.2)]' : 'group-hover:border-[#E9C176]/50'} text-4xl">
                        ${flag}
                    </div>
                    <div class="mt-auto">
                        <span class="text-[#8A9389] font-semibold text-[10px] tracking-[0.2em] uppercase">${escapeHtml(continent?.name || '')}</span>
                        <h3 class="text-xl font-bold mt-2 uppercase tracking-tight ${isSelected ? 'text-[#E9C176]' : 'text-[#E0E0E0] group-hover:text-[#E9C176]'}">${escapeHtml(country.name)}</h3>
                        ${progressDisplay}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.country-card').forEach((card) => {
        card.addEventListener('click', async (event) => {
            const id = event.currentTarget.getAttribute('data-country');
            const country = getCountryById(id);
            if (!country) return;
            
            const prevId = selectedCountryId;
            selectedCountryId = id;

            // If authenticated, automatically bind this new country to their player profile universally
            const user = getCurrentUser();
            if (user?.uid && user?.profileComplete) {
                const res = await setupProfile(user.player, user.icon, country.name, user.avatarUrl);
                if (!res.ok) {
                    alert(res.error || 'Unable to update country.');
                    selectedCountryId = prevId; // revert
                    renderCountries(continentId);
                    return;
                }
            }

            saveSettings({ ...loadSettings(), defaultCountry: selectedCountryId, mode: gameState.mode, difficulty: gameState.difficulty });
            renderCountries(continentId);
        });
    });
}

function bindPlayEvents() {
    document.querySelectorAll('.diff-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (gameStarted) return;
            const diff = btn.getAttribute('data-diff');
            resetGame(gameState.mode, diff);
            saveSettings({ ...loadSettings(), defaultCountry: selectedCountryId, mode: gameState.mode, difficulty: diff });
            renderScreen('play');
        });
    });

    document.querySelectorAll('.mode-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (gameStarted) return;
            const mode = Number(btn.getAttribute('data-mode'));
            if (!AVAILABLE_MODES.includes(mode)) return;
            resetGame(mode, gameState.difficulty);
            saveSettings({ ...loadSettings(), defaultCountry: selectedCountryId, mode, difficulty: gameState.difficulty });
            renderScreen('play');
        });
    });

    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            gameStarted = true;
            startBtn.classList.add('hidden');
            document.getElementById('restart-btn').classList.remove('hidden');
        });
    }

    document.querySelectorAll('.emoji-hotkey').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const emoji = btn.getAttribute('data-emoji');
            if (emoji && gameState.isMultiplayer) {
                import('./multiplayerApi.js').then(({ sendRoomMessage }) => {
                    const ctx = gameState.multiplayerModeData;
                    if (ctx && ctx.roomId && ctx.participantId) {
                        sendRoomMessage(ctx.roomId, ctx.participantId, 'emoji', emoji).catch(() => {});
                    }
                });
            }
            document.activeElement?.blur();
        });
    });

    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            gameStarted = false;
            resetGame(gameState.mode, gameState.difficulty);
            updateWordDisplay();
            document.getElementById('time-display').innerText = gameState.mode;
            document.getElementById('wpm-display').innerText = '0';
            const errorsDisplayEl = document.getElementById('errors-display');
            if (errorsDisplayEl) errorsDisplayEl.innerText = '0';
            document.getElementById('start-btn').classList.remove('hidden');
            restartBtn.classList.add('hidden');
        });
    }

    const returnLobbyBtn = document.getElementById('exit-multiplayer-btn');
    if (returnLobbyBtn) {
        returnLobbyBtn.addEventListener('click', () => {
            if (confirm("Return to the multiplayer lobby?")) {
                gameStarted = false;
                gameState.isMultiplayer = false;
                clearInterval(gameState.timerInterval);
                // Return to multiplayer screen handler cleanly
                renderScreen('multiplayer');
            }
        });
    }
}

function onGlobalKeyDown(event) {
    const area = document.getElementById('word-display-area');
    if (!area) return;
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
    if (event.key === 'Tab' || event.ctrlKey || event.metaKey || event.altKey) return;
    if (!gameStarted) return;

    if (gameState.isMultiplayer && ['1','2','3','4','5','6'].includes(event.key)) {
        const emojis = ['🔥', '😂', '😭', '💀', '❤️', '👀'];
        const emoji = emojis[parseInt(event.key) - 1];
        import('./multiplayerApi.js').then(({ sendRoomMessage }) => {
            const ctx = gameState.multiplayerModeData;
            if (ctx && ctx.roomId && ctx.participantId) {
                sendRoomMessage(ctx.roomId, ctx.participantId, 'emoji', emoji).catch(() => {});
            }
        });
        return;
    }

    if (event.key === ' ' || event.key === 'Backspace') {
        event.preventDefault();
    }

    handleKeystroke(event.key, updateWordDisplay, () => {
        const user = getCurrentUser();
        if (user?.uid) {
            startServerRun(gameState.mode, gameState.difficulty)
                .then((result) => {
                    activeRunId = result.ok ? result.runId : null;
                })
                .catch(() => {
                    activeRunId = null;
                });
        } else {
            activeRunId = null;
        }

        startGame(updateTick, showResults);
    });
}

function updateTick(time) {
    const timeEl = document.getElementById('time-display');
    if (timeEl) timeEl.innerText = time;

    const mpTimerEl = document.getElementById('multiplayer-timer');
    if (mpTimerEl) mpTimerEl.innerHTML = `<i class="fa-solid fa-clock mr-1"></i> ${time}`;

    const gross = calculateGrossWPM(gameState.mode - time, gameState.totalTypedChars);
    const net = calculateNetWPM(gross, gameState.errors, gameState.mode - time);

    const wpmEl = document.getElementById('wpm-display');
    if (wpmEl && time < gameState.mode) wpmEl.innerText = Math.max(0, Math.round(net));

    const totalCurrentChars = gameState.currentWordIndex * 5;
    const totalExpectedChars = 100 * 5;
    const playerPct = Math.min(100, Math.max(0, (totalCurrentChars / totalExpectedChars) * 100));

    const progressEl = document.getElementById('player-progress');
    if (progressEl) progressEl.style.left = `${playerPct}%`;
}

function updateWordDisplay() {
    const area = document.getElementById('word-display-area');
    if (!area) return;

    const errorsDisplayEl = document.getElementById('errors-display');
    if (errorsDisplayEl) errorsDisplayEl.innerText = gameState.errors;

    let html = '';
    const startIdx = Math.max(0, gameState.currentWordIndex - 5);
    const endIdx = startIdx + 30;

    for (let index = startIdx; index < Math.min(endIdx, gameState.words.length); index++) {
        const word = gameState.words[index];
        const typed = gameState.typedEntries[index];
        const isCurrent = index === gameState.currentWordIndex;

        let wordHtml = `<div class="mx-1.5 ${isCurrent ? 'opacity-100 font-bold' : 'opacity-40'}">`;

        for (let charIndex = 0; charIndex < Math.max(word.length, typed.length); charIndex++) {
            const char = word[charIndex] || '';
            const typedChar = typed[charIndex];
            let charClass = '';

            if (typedChar === undefined) {
                charClass = 'text-[#E0E0E0]';
            } else if (typedChar === char) {
                charClass = 'text-[#93D6A0]';
            } else {
                charClass = 'text-[#93000a] bg-[#ffdad6]/20 py-0.5 rounded-sm';
            }

            if (isCurrent && charIndex === typed.length) {
                charClass += ' border-l border-[#E9C176] animate-[blink_1s_step-end_infinite] -ml-[1px] pl-[1px]';
            }

            const displayChar = char || typedChar;
            wordHtml += `<span class="${charClass}">${displayChar}</span>`;
        }

        if (isCurrent && typed.length === word.length) {
            wordHtml += '<span class="border-l border-[#E9C176] animate-[blink_1s_step-end_infinite] -ml-[1px] pl-[1px]"></span>';
        }

        wordHtml += '</div>';
        html += wordHtml;
    }

    area.innerHTML = html;
}

function showResults() {
    const gross = calculateGrossWPM(gameState.mode, gameState.totalTypedChars);
    const net = calculateNetWPM(gross, gameState.errors, gameState.mode);
    const acc = calculateAccuracy(gameState.totalTypedChars, gameState.errors);

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - gameState.startTime) / 1000));
    const submittedRunId = activeRunId;
    activeRunId = null;

    const currentUser = getCurrentUser();
    const selectedCountryName = getSelectedCountryName();

    if (currentUser?.uid) {
        if (!submittedRunId) {
            const statusEl = document.getElementById('save-status');
            if (statusEl) {
                statusEl.innerHTML = '<span class="text-[#E9C176]">Verified run not started. Restart and try again.</span>';
            }
        } else {
            submitResult({
                country: selectedCountryName,
                mode: gameState.mode,
                difficulty: gameState.difficulty,
                netWPM: net,
                grossWPM: gross,
                acc,
                typedChars: gameState.totalTypedChars,
                errors: gameState.errors,
                elapsedSeconds,
                runId: submittedRunId,
                selectedCountryId: selectedCountryId || '',
            }).then((result) => {
                const statusEl = document.getElementById('save-status');
                if (!statusEl) return;
                if (result.ok) {
                    statusEl.innerHTML = '<span class="text-[#93D6A0]">Run saved to leaderboard!</span>';
                } else {
                    statusEl.innerHTML = `<span class="text-[#E9C176]">${escapeHtml(result.error)}</span>`;
                }
            });
        }
    }

    const main = document.getElementById('main-content');
    const userLabel = currentUser?.player || 'Guest';
    const dbStatusMsg = currentUser?.uid
        ? '<span class="text-[#8A9389]">Submitting verified run...</span>'
        : '<span class="text-[#E9C176]">Login with Discord to save runs.</span>';

    main.innerHTML = `
        <div class="flex flex-col items-center justify-center w-full min-h-[400px]">
            <h2 class="text-4xl font-headline font-black tracking-tight text-[#E9C176] mb-8 uppercase">Match Result</h2>
            <div class="bg-[#1C1B1B] border border-outline/10 rounded-2xl p-12 flex flex-col items-center shadow-xl mb-10 w-full max-w-md">
                <div class="flex items-baseline gap-2 mb-8">
                    <span class="text-[80px] font-headline font-black text-[#E0E0E0] leading-none">${Math.round(net)}</span>
                    <span class="text-xl font-bold text-[#8A9389]">WPM</span>
                </div>

                <div class="w-full space-y-4 text-sm font-bold tracking-widest uppercase text-[#8A9389]">
                    <div class="flex justify-between border-b border-outline/5 pb-2">
                        <span>Accuracy</span><span class="text-[#93D6A0]">${acc.toFixed(1)}%</span>
                    </div>
                    <div class="flex justify-between border-b border-outline/5 pb-2">
                        <span>Gross WPM</span><span class="text-[#E0E0E0]">${Math.round(gross)}</span>
                    </div>
                    <div class="flex justify-between pb-2">
                        <span>Errors</span><span class="text-[#93000a]">${gameState.errors}</span>
                    </div>
                    <div class="flex justify-between pb-2">
                        <span>Player</span><span class="text-[#E0E0E0]">${escapeHtml(userLabel)}</span>
                    </div>
                </div>

                <div class="mt-8 text-center text-[10px] font-bold uppercase tracking-widest">
                    ${dbStatusMsg}
                </div>
                <div id="save-status" class="mt-2 text-center text-[10px] font-bold uppercase tracking-widest"></div>
            </div>
            ${gameState.isMultiplayer ? `
                <button id="return-lobby-end-btn" class="bg-surface-container-high border border-outline/20 text-[#8A9389] px-12 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:text-white transition-all active:scale-95">Return to Lobby</button>
            ` : `
                <button id="restart-btn-end" class="bg-[#004B23] text-[#93D6A0] px-12 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-125 transition-all active:scale-95">Play Again</button>
            `}
        </div>
    `;

    const restartBtn = document.getElementById('restart-btn-end');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            renderScreen('play');
        });
    }

    const returnLobbyBtn = document.getElementById('return-lobby-end-btn');
    if (returnLobbyBtn) {
        returnLobbyBtn.addEventListener('click', () => {
            gameStarted = false;
            gameState.isMultiplayer = false;
            renderScreen('multiplayer');
        });
    }
}
