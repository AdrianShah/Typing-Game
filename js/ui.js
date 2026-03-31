// UI Controller
import { initEngine, resetGame, startGame, handleKeystroke, gameState } from './engine.js';
import { calculateGrossWPM, calculateNetWPM, calculateAccuracy } from './metrics.js';
import { LEAGUES, getTeamsByLeague, TEAMS } from './teams.js';
import { loadSettings, saveSettings } from './storage.js';
import { fetchLeaderboard, submitResult, startServerRun, fetchClubProgression, fetchLeagueModifiers } from './leaderboard.js';
import {
    getCurrentUser,
    loginWithEmailPassword,
    logout,
    registerWithEmailPassword,
    subscribeAuth,
    verifyEmailCode,
    setupProfile
} from './auth.js';

let selectedTeamId = null;
const AVAILABLE_MODES = [15, 30, 60, 120];
let authUnsubscribe = null;
let activeRunId = null;
let gameStarted = false;
let registrationState = null; // null | 'registering' | 'verifying' | null

export function initUI() {
    const settings = loadSettings();
    if (AVAILABLE_MODES.includes(Number(settings.mode))) {
        gameState.mode = Number(settings.mode);
    }
    if (['easy', 'medium', 'hard'].includes(settings.difficulty)) {
        gameState.difficulty = settings.difficulty;
    }

    setupNavigation();
    setupHeaderDropdowns();
    renderScreen('play');
    document.addEventListener('keydown', onGlobalKeyDown);
}

function setupHeaderDropdowns() {
    const notifBtn = document.getElementById('notification-btn');
    const notifDrop = document.getElementById('notification-dropdown');
    const profileBtn = document.getElementById('profile-btn');
    const loginDrop = document.getElementById('login-dropdown');
    const loginContainer = document.getElementById('login-container');

    const syncProfileIndicator = () => {
        const user = getCurrentUser();
        if (user?.email) {
            profileBtn.classList.add('ring-2', 'ring-[#93D6A0]', 'ring-offset-2', 'ring-offset-[#131313]');
        } else {
            profileBtn.classList.remove('ring-2', 'ring-[#93D6A0]', 'ring-offset-2', 'ring-offset-[#131313]');
        }
    };

    const renderLoginContainer = () => {
        const user = getCurrentUser();
        syncProfileIndicator();

        // If profile setup is needed, show modal instead of dropdown
        if (user?.email && !user.profileComplete) {
            showProfileSetupModal();
            return;
        }

        if (user?.email && user.profileComplete) {
            const iconEmoji = {
                'captain': '⚫',
                'warrior': '🔴',
                'sage': '🟠',
                'guardian': '💛',
                'mentor': '🟢'
            }[user.icon] || '⚫';
            
            loginContainer.innerHTML = `
                <div class="space-y-2">
                    <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Captain</p>
                    <p class="text-sm text-[#E0E0E0]">${iconEmoji} ${user.username || user.email}</p>
                </div>
                <button id="btn-logout-submit" class="w-full bg-[#1C1B1B] border border-[#E9C176]/30 text-[#E9C176] font-headline font-bold uppercase tracking-[0.2em] text-[10px] py-3 hover:bg-[#2A2A2A] transition-all duration-300" type="button">
                    Logout
                </button>
            `;

            document.getElementById('btn-logout-submit').addEventListener('click', () => {
                logout();
                loginDrop.classList.add('hidden');
            });
            return;
        }

        // Show login/register form
        loginContainer.innerHTML = `
            <div class="space-y-2">
                <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-0.5">Captain ID</label>
                <input class="w-full bg-[#1C1B1B] border border-outline/10 py-3 px-3 text-[#E0E0E0] text-sm focus:outline-none focus:border-[#E9C176]/30 transition-all duration-300" placeholder="Email Address" type="email" id="login-email" />
            </div>
            <div class="space-y-2">
                <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-0.5">Password</label>
                <input class="w-full bg-[#1C1B1B] border border-outline/10 py-3 px-3 text-[#E0E0E0] text-sm focus:outline-none focus:border-[#E9C176]/30 transition-all duration-300" placeholder="Password" type="password" id="login-password" />
                <p class="text-[10px] text-[#8A9389]">Min 8 chars, upper/lower, number, symbol</p>
            </div>
            <div id="verification-section" class="hidden space-y-2">
                <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-0.5">Verification Code</label>
                <input class="w-full bg-[#1C1B1B] border border-outline/10 py-3 px-3 text-[#E0E0E0] text-sm focus:outline-none focus:border-[#E9C176]/30 transition-all duration-300" placeholder="6-digit code" type="text" id="login-code" maxlength="6" />
            </div>
            <div class="grid grid-cols-1 gap-2">
                <button id="btn-register-submit" class="w-full bg-[#004B23] text-white font-headline font-bold uppercase tracking-[0.2em] text-[10px] py-3 hover:bg-[#005a2b] transition-all duration-300" type="button">
                    Register
                </button>
                <button id="btn-verify-submit" class="hidden w-full bg-[#1C1B1B] border border-[#93D6A0]/40 text-[#93D6A0] font-headline font-bold uppercase tracking-[0.2em] text-[10px] py-3 hover:bg-[#2A2A2A] transition-all duration-300" type="button">
                    Verify Email
                </button>
                <button id="btn-login-submit" class="w-full bg-[#1C1B1B] border border-[#E9C176]/30 text-[#E9C176] font-headline font-bold uppercase tracking-[0.2em] text-[10px] py-3 hover:bg-[#2A2A2A] transition-all duration-300" type="button">
                    Login
                </button>
            </div>
        `;

        const regEmail = () => document.getElementById('login-email').value;
        const regPassword = () => document.getElementById('login-password').value;
        const regCode = () => document.getElementById('login-code').value;

        document.getElementById('btn-register-submit').addEventListener('click', async () => {
            const result = await registerWithEmailPassword(regEmail(), regPassword());
            if (!result.ok) {
                alert(result.error);
                return;
            }

            registrationState = 'verifying';
            const devCode = result.data?.devVerificationCode;
            if (devCode) {
                document.getElementById('login-code').value = devCode;
                alert('No proper email provider hooked up yet: verification code auto-filled.');
            } else {
                alert('Registered. Check your email for verification code.');
            }

            // Show verification code input
            document.getElementById('verification-section').classList.remove('hidden');
            document.getElementById('btn-register-submit').classList.add('hidden');
            document.getElementById('btn-verify-submit').classList.remove('hidden');
        });

        document.getElementById('btn-verify-submit').addEventListener('click', async () => {
            const result = await verifyEmailCode(regEmail(), regCode());
            if (!result.ok) {
                alert(result.error);
                return;
            }
            alert('Email verified. You can login now.');
            registrationState = null;
            renderLoginContainer(); // Recope
        });

        document.getElementById('btn-login-submit').addEventListener('click', async () => {
            const result = await loginWithEmailPassword(regEmail(), regPassword());
            if (!result.ok) {
                alert(result.error);
                return;
            }
            loginDrop.classList.add('hidden');
        });
    };

    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDrop.classList.toggle('hidden');
        loginDrop.classList.add('hidden');
        document.getElementById('notif-badge').classList.add('hidden');
    });

    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        loginDrop.classList.toggle('hidden');
        notifDrop.classList.add('hidden');
    });

    document.addEventListener('click', (e) => {
        if(!notifDrop.contains(e.target)) notifDrop.classList.add('hidden');
        if(!loginDrop.contains(e.target) && !profileBtn.contains(e.target)) loginDrop.classList.add('hidden');
    });

    if (authUnsubscribe) {
        authUnsubscribe();
    }
    authUnsubscribe = subscribeAuth(renderLoginContainer);
    renderLoginContainer();
}

function showProfileSetupModal() {
    const icons = ['captain', 'warrior', 'sage', 'guardian', 'mentor'];
    const iconEmojis = {
        'captain': '⚫',
        'warrior': '🔴',
        'sage': '🟠',
        'guardian': '💛',
        'mentor': '🟢'
    };

    const modal = document.createElement('div');
    modal.id = 'profile-setup-modal';
    modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-[#1C1B1B] border border-[#E9C176]/40 rounded-xl p-8 max-w-md w-full">
            <h2 class="text-2xl font-headline font-black text-[#E9C176] mb-6 uppercase tracking-tight">Complete Your Profile</h2>
            
            <div class="space-y-4 mb-6">
                <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Captain Name</label>
                <input id="profile-username" class="w-full bg-[#131313] border border-outline/10 py-3 px-3 text-[#E0E0E0] text-sm focus:outline-none focus:border-[#E9C176]/30 transition-all" placeholder="Choose your name" type="text" maxlength="50" />
            </div>

            <div class="space-y-3 mb-6">
                <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Choose Your Icon</label>
                <div class="grid grid-cols-5 gap-2">
                    ${icons.map(icon => `
                        <button class="profile-icon-btn p-3 rounded-lg border border-outline/20 hover:border-[#E9C176]/50 transition-all" data-icon="${icon}">
                            <span class="text-2xl">${iconEmojis[icon]}</span>
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="grid grid-cols-1 gap-2">
                <button id="profile-save-btn" class="w-full bg-[#004B23] text-white font-headline font-bold uppercase tracking-[0.2em] text-[10px] py-3 hover:bg-[#005a2b] transition-all">
                    Save Profile
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    let selectedIcon = 'captain';

    document.querySelectorAll('.profile-icon-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.profile-icon-btn').forEach(b => b.classList.remove('border-[#E9C176]', 'bg-[#004B23]/30'));
            const icon = btn.getAttribute('data-icon');
            selectedIcon = icon;
            btn.classList.add('border-[#E9C176]', 'bg-[#004B23]/30');
        });
    });

    // Set default as selected
    document.querySelector(`[data-icon="captain"]`).classList.add('border-[#E9C176]', 'bg-[#004B23]/30');

    document.getElementById('profile-save-btn').addEventListener('click', async () => {
        const username = document.getElementById('profile-username').value.trim();
        if (!username) {
            alert('Please enter a username.');
            return;
        }

        const result = await setupProfile(username, selectedIcon);
        if (!result.ok) {
            alert(result.error);
            return;
        }

        modal.remove();
        // Refresh the header dropdown
        setupHeaderDropdowns();
    });
}

function updateNavActive(screenId) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
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
    ['play', 'teams', 'leaderboard'].forEach(id => {
        const btn = document.getElementById(`nav-${id}`);
        if(btn) btn.addEventListener('click', () => renderScreen(id));
    });
    ['play', 'teams', 'leaderboard'].forEach(id => {
        const btn = document.getElementById(`nav-mob-${id}`);
        if(btn) btn.addEventListener('click', () => renderScreen(id));
    });
}

async function renderScreen(screenId) {
    updateNavActive(screenId);
    const main = document.getElementById('main-content');
    
    if (screenId === 'play') {
        const teamName = selectedTeamId ? TEAMS.find(t=>t.id===selectedTeamId)?.name : 'Solo Agent';
        const modeButtonsHtml = AVAILABLE_MODES.map((mode) => `
            <button class="mode-btn text-[10px] font-bold uppercase tracking-widest ${gameState.mode===mode?'text-[#E9C176]':'text-[#8A9389]'}" data-mode="${mode}">${mode}s</button>
        `).join('');

        main.innerHTML = `
            <!-- League Modifiers -->
            <section id="league-modifiers" class="w-full mb-12 px-2"></section>

            <!-- Live Pitch Progress -->
            <section class="w-full mb-16 space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full mb-3 px-2">
                    <div class="flex gap-4">
                        <button class="diff-btn text-[10px] font-bold uppercase tracking-widest ${gameState.difficulty==='easy'?'text-[#E9C176]':'text-[#8A9389]'}" data-diff="easy">Easy</button>
                        <button class="diff-btn text-[10px] font-bold uppercase tracking-widest ${gameState.difficulty==='medium'?'text-[#E9C176]':'text-[#8A9389]'}" data-diff="medium">Medium</button>
                        <button class="diff-btn text-[10px] font-bold uppercase tracking-widest ${gameState.difficulty==='hard'?'text-[#E9C176]':'text-[#8A9389]'}" data-diff="hard">Hard</button>
                    </div>
                    <div class="flex gap-4">
                        ${modeButtonsHtml}
                    </div>
                </div>

                <div class="relative h-20 flex flex-col gap-1 w-full bg-surface-container-low rounded-lg overflow-hidden pitch-gradient border border-outline/10 px-0 py-2">
                    <div class="absolute inset-0 flex justify-between px-8 opacity-5">
                        <div class="h-full border-l border-on-surface"></div>
                        <div class="h-full border-l border-on-surface"></div>
                        <div class="h-full border-l border-on-surface"></div>
                        <div class="h-full border-l border-on-surface"></div>
                        <div class="h-full border-l border-on-surface"></div>
                    </div>
                    
                    <div class="relative w-full h-6 flex items-center mb-1 mt-5">
                        <div class="h-px w-full bg-outline/20 absolute"></div>
                        <div id="player-progress" class="absolute left-[0%] flex items-center gap-2 transition-all duration-300 ease-out z-10">
                            <span class="text-[8px] font-bold text-secondary uppercase tracking-[0.2em] bg-primary px-1.5 py-0.5 rounded-sm">${teamName}</span>
                            <span class="material-symbols-outlined text-secondary text-base" style="font-variation-settings: 'FILL' 1;">sports_soccer</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Stats Dashboard -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-16">
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
                <div class="bg-[#1C1B1B] p-8 rounded-lg flex flex-col items-center justify-center border border-primary/40 relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                    <span class="text-[10px] font-['Manrope'] font-bold tracking-[0.3em] text-[#E9C176] uppercase mb-3">Errors</span>
                    <div class="flex items-baseline gap-2">
                        <span id="errors-display" class="text-6xl font-headline font-extrabold text-[#E9C176]">0</span>
                    </div>
                </div>
            </div>

            <!-- Typing Arena -->
            <div class="w-full max-w-4xl bg-surface-container-low/30 p-12 rounded-lg backdrop-blur-md relative border border-outline/10 overflow-hidden">
                <div id="word-display-area" class="text-2xl md:text-3xl leading-[1.8] font-body text-on-surface-variant select-none tracking-wide text-center flex flex-wrap justify-center gap-1"></div>
            </div>

            <!-- Action Area -->
            <div class="mt-16 flex gap-6">
                <button id="start-btn" class="${gameStarted ? 'hidden' : ''} bg-[#004B23] text-white font-bold px-10 py-3.5 rounded-sm hover:brightness-125 active:scale-[0.98] transition-all duration-300 uppercase tracking-[0.2em] text-[11px] font-label border border-secondary/20">
                    Start Match
                </button>
                <button id="restart-btn" class="${gameStarted ? '' : 'hidden'} bg-primary text-[#E9C176] font-bold px-10 py-3.5 rounded-sm hover:brightness-125 active:scale-[0.98] transition-all duration-300 uppercase tracking-[0.2em] text-[11px] font-label border border-secondary/20">
                    Restart Match
                </button>
            </div>
        `;
        activeRunId = null;
        gameStarted = false;
        resetGame(gameState.mode, gameState.difficulty);
        bindPlayEvents();
        updateWordDisplay();

        // Load and display league modifiers
        fetchLeagueModifiers().then((result) => {
            if (result.ok && result.modifiers) {
                const modifiersEl = document.getElementById('league-modifiers');
                if (modifiersEl) {
                    const modHTML = result.modifiers
                        .map((mod) => `
                            <div class="flex-1 bg-[#1C1B1B] border border-[#E9C176]/30 rounded-lg px-4 py-3 flex items-center min-w-[200px]">
                                <span class="text-[10px] text-[#E9C176] font-bold uppercase tracking-wider whitespace-nowrap">${mod.name}:</span>
                                <span class="text-[10px] text-[#8A9389] ml-2 truncate">${mod.effect}</span>
                            </div>
                        `).join('');
                    modifiersEl.innerHTML = `
                        <p class="text-[10px] text-[#8A9389] uppercase tracking-widest font-bold mb-3">This Week's Modifiers</p>
                        <div class="flex flex-row overflow-x-auto gap-3 w-full hide-scrollbar">
                            ${modHTML}
                        </div>
                    `;
                }
            }
        });
    } else if (screenId === 'teams') {
        const leaguesHtml = Object.values(LEAGUES).map(l => 
            `<button class="league-tab bg-surface-container-high border border-outline/5 text-on-surface-variant hover:text-on-surface font-semibold text-[11px] tracking-[0.1em] px-8 py-4 rounded-lg whitespace-nowrap uppercase transition-all" data-league="${l.id}">${l.name}</button>`
        ).join('');
        
        main.innerHTML = `
            <div class="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 w-full">
                <div>
                    <span class="text-on-surface-variant font-headline font-semibold text-xs tracking-[0.3em] uppercase">Recruitment Phase</span>
                    <h1 class="text-4xl md:text-6xl font-headline font-bold tracking-tight mt-3 text-on-surface uppercase">Select Your <span class="text-[#E9C176]">Club</span></h1>
                </div>
            </div>
            
            <div class="flex gap-3 overflow-x-auto pb-4 w-full scrollbar-hide mb-8">
                ${leaguesHtml}
            </div>

            <div id="team-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full"></div>
        `;
        
        document.querySelectorAll('.league-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const leagueId = e.target.getAttribute('data-league');
                renderTeams(leagueId);
            });
        });
        
        // Wait for next tick to adjust scrolling on the newly created flex container if needed
        setTimeout(() => renderTeams('epl'), 0);
    } else if (screenId === 'leaderboard') {
        main.innerHTML = '<div class="w-full text-center text-[#8A9389] uppercase tracking-widest text-xs py-12">Loading leaderboard...</div>';
        const board = await fetchLeaderboard();
        let rows = board.map((entry, idx) => `
            <div class="grid grid-cols-12 px-10 py-6 items-center hover:bg-[#201F1F] transition-all duration-300 border-b border-outline/5 ${idx%2===0 ? '' : 'bg-[#181818]'}">
                <div class="col-span-1 font-headline font-black text-xl text-[#E0E0E0]">${(idx + 1).toString().padStart(2, '0')}</div>
                <div class="col-span-6 flex flex-col justify-center">
                    <div class="font-bold text-base text-[#E0E0E0]">${entry.team || 'Agent'}</div>
                    <div class="text-[10px] text-[#8A9389] uppercase tracking-widest font-semibold">${entry.player} • ${entry.mode}s • ${entry.difficulty}</div>
                </div>
                <div class="col-span-3 text-center text-sm font-bold text-[#93D6A0]">${entry.acc.toFixed(1)}%</div>
                <div class="col-span-2 text-right font-headline font-black text-2xl text-[#E9C176]">${Math.round(entry.netWPM)}</div>
            </div>
        `).join('');

        main.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 w-full">
                <div>
                    <span class="text-[#004B23] font-headline text-xs font-bold tracking-[0.3em] uppercase">Global Rankings</span>
                    <h1 class="text-6xl font-headline font-black tracking-tight mt-2 text-[#E9C176]">Leaderboard</h1>
                    <p class="text-xs text-[#8A9389] uppercase tracking-widest mt-2">*Only Solo runs qualify for placement</p>
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
                    ${rows || '<div class="p-8 text-center text-[#8A9389]">No solo entries yet. Hit the Arena!</div>'}
                </div>
            </div>
        `;
    }
}

function renderTeams(leagueId) {
    const grid = document.getElementById('team-grid');
    if (!grid) return;
    
    document.querySelectorAll('.league-tab').forEach(tab => {
        if(tab.getAttribute('data-league') === leagueId) {
            tab.classList.replace('bg-surface-container-high', 'bg-[#004B23]');
            tab.classList.add('text-white');
        } else {
            tab.classList.replace('bg-[#004B23]', 'bg-surface-container-high');
            tab.classList.remove('text-white');
        }
    });
    
    const teams = getTeamsByLeague(leagueId);
    
    // Fetch club progression for the current user
    fetchClubProgression().then((progressResult) => {
        const progressMap = {};
        if (progressResult.ok && Array.isArray(progressResult.progressions)) {
            progressResult.progressions.forEach(p => {
                progressMap[p.teamId] = p;
            });
        }

        grid.innerHTML = teams.map(t => {
            const isSelected = t.id === selectedTeamId;
            const encodedName = encodeURIComponent(t.name);
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodedName}&background=2A2A2A&color=E9C176&size=80&rounded=true&bold=true&format=svg`;
            const progress = progressMap[t.id];
            const progressDisplay = progress ? `<small class="text-[#93D6A0] text-[8px] uppercase tracking-widest">Level ${progress.level} • ${progress.xp} XP</small>` : '';
            
            return `
                <div class="team-card group relative overflow-hidden rounded-xl p-8 border transition-all duration-500 cursor-pointer ${isSelected ? 'bg-[#201F1F] border-[#E9C176]/50 shadow-[0_10px_30px_rgba(0,0,0,0.3)]' : 'bg-surface-container-low border-outline/5 hover:border-[#E9C176]/20 hover:bg-[#201F1F]'}" data-team="${t.id}">
                    ${isSelected ? '<div class="absolute top-6 right-6"><span class="material-symbols-outlined text-[#E9C176] text-xl" style="font-variation-settings: \'FILL\' 1;">check_circle</span></div>' : ''}
                    <div class="flex flex-col h-full">
                        <div class="mb-10 w-20 h-20 bg-[#2A2A2A] rounded-full flex items-center justify-center border border-outline/10 overflow-hidden ${isSelected ? 'border-[#E9C176]/50 shadow-[0_0_15px_rgba(233,193,118,0.2)]' : 'group-hover:border-[#E9C176]/50'}">
                            <img src="${avatarUrl}" alt="${t.name} Logo" class="w-full h-full object-cover opacity-80 ${isSelected ? 'opacity-100' : 'group-hover:opacity-100 transition-opacity'}">
                        </div>
                        <div class="mt-auto">
                            <span class="text-[#8A9389] font-semibold text-[10px] tracking-[0.2em] uppercase">${LEAGUES[leagueId].name}</span>
                            <h3 class="text-xl font-bold mt-2 uppercase tracking-tight ${isSelected ? 'text-[#E9C176]' : 'text-[#E0E0E0] group-hover:text-[#E9C176]'}">${t.name}</h3>
                            <div class="mt-2">${progressDisplay}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        document.querySelectorAll('.team-card').forEach(card => {
            card.addEventListener('click', (e) => {
                selectedTeamId = e.currentTarget.getAttribute('data-team');
                renderTeams(leagueId); // re-render to update selected state
            });
        });
    });
}

function bindPlayEvents() {
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (gameStarted) return; // Can't change difficulty mid-game
            const diff = btn.getAttribute('data-diff');
            resetGame(gameState.mode, diff);
            saveSettings({ ...loadSettings(), mode: gameState.mode, difficulty: diff });
            renderScreen('play');
        });
    });

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (gameStarted) return; // Can't change mode mid-game
            const mode = Number(btn.getAttribute('data-mode'));
            if (!AVAILABLE_MODES.includes(mode)) return;
            resetGame(mode, gameState.difficulty);
            saveSettings({ ...loadSettings(), mode, difficulty: gameState.difficulty });
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
    
    const rBtn = document.getElementById('restart-btn');
    if(rBtn) {
        rBtn.addEventListener('click', () => {
            gameStarted = false;
            resetGame(gameState.mode, gameState.difficulty);
            updateWordDisplay();
            document.getElementById('time-display').innerText = gameState.mode;
            document.getElementById('wpm-display').innerText = '0';
            document.getElementById('errors-display').innerText = '0';
            document.getElementById('start-btn').classList.remove('hidden');
            rBtn.classList.add('hidden');
        });
    }
}

function onGlobalKeyDown(e) {
    const area = document.getElementById('word-display-area');
    if (!area) return;
    const target = e.target;
    const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
    if (isInputField) return; // Allow normal input field behavior
    
    if (e.key === 'Tab' || e.ctrlKey || e.metaKey || e.altKey) return;
    
    if (!gameStarted) return; // Don't type until start button is clicked
    
    if (e.key === ' ' || e.key === 'Backspace') {
        e.preventDefault();
    }
    
    handleKeystroke(e.key, updateWordDisplay, () => {
        const user = getCurrentUser();
        if (user?.email) {
            startServerRun(gameState.mode, gameState.difficulty)
                .then((run) => {
                    activeRunId = run.ok ? run.runId : null;
                })
                .catch(() => {
                    activeRunId = null;
                });
        } else {
            activeRunId = null;
        }

        startGame(
            updateTick,
            showResults
        );
    });
}

function updateTick(time) {
    const timeEl = document.getElementById('time-display');
    if(timeEl) timeEl.innerText = time;
    
    const gross = calculateGrossWPM(gameState.mode - time, gameState.totalTypedChars);
    const net = calculateNetWPM(gross, gameState.errors, gameState.mode - time);
    
    const wpmEl = document.getElementById('wpm-display');
    if(wpmEl && time < gameState.mode) wpmEl.innerText = Math.max(0, Math.round(net));
    
    // Update progress bars
    const totalCurrentChars = gameState.currentWordIndex * 5; // Rough estim
    const totalExpectedChars = 100 * 5; // Assumed game max ~ 100 words in 60s
    let playerPct = Math.min(100, Math.max(0, (totalCurrentChars / totalExpectedChars) * 100));
    
    const pb = document.getElementById('player-progress');
    if(pb) pb.style.left = playerPct + '%';
}

function updateWordDisplay() {
    const area = document.getElementById('word-display-area');
    if (!area) return;
    
    document.getElementById('errors-display').innerText = gameState.errors;
    
    let html = '';
    const startIdx = Math.max(0, gameState.currentWordIndex - 5);
    const endIdx = startIdx + 30;
    
    for (let i = startIdx; i < Math.min(endIdx, gameState.words.length); i++) {
        const word = gameState.words[i];
        const typed = gameState.typedEntries[i];
        const isCurrent = i === gameState.currentWordIndex;
        
        let wordHtml = `<div class="mx-1.5 ${isCurrent ? 'opacity-100 font-bold' : 'opacity-40'}">`;
        
        for (let j = 0; j < Math.max(word.length, typed.length); j++) {
            const char = word[j] || '';
            const typedChar = typed[j];
            let charClass = '';
            
            if (typedChar === undefined) {
                charClass = 'text-[#E0E0E0]';
            } else if (typedChar === char) {
                charClass = 'text-[#93D6A0]';
            } else {
                charClass = 'text-[#93000a] bg-[#ffdad6]/20 py-0.5 rounded-sm';
            }
            
            if (isCurrent && j === typed.length) {
                charClass += ' border-l border-[#E9C176] animate-[blink_1s_step-end_infinite] -ml-[1px] pl-[1px]';
            }
            
            const displayChar = char || typedChar;
            wordHtml += `<span class="${charClass}">${displayChar}</span>`;
        }
        
        // Handle cursor at the end of the word if nothing typed yet in this word
        if (isCurrent && typed.length === word.length) {
             wordHtml += `<span class="border-l border-[#E9C176] animate-[blink_1s_step-end_infinite] -ml-[1px] pl-[1px]"></span>`;
        }
        
        wordHtml += `</div>`;
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

    // Submit result to server for anti-cheat validation.
    const currentUser = getCurrentUser();
    if (currentUser?.email) {
        if (!submittedRunId) {
            const statusEl = document.getElementById('save-status');
            if (statusEl) {
                statusEl.innerHTML = '<span class="text-[#E9C176]">Verified run not started. Restart and try again.</span>';
            }
        } else {
            submitResult({
                team: selectedTeamId ? TEAMS.find(t=>t.id===selectedTeamId)?.name : 'Solo Agent',
                mode: gameState.mode,
                difficulty: gameState.difficulty,
                typedChars: gameState.totalTypedChars,
                errors: gameState.errors,
                elapsedSeconds,
                runId: submittedRunId,
                selectedTeamId: selectedTeamId || ''
            }).then((result) => {
                const statusEl = document.getElementById('save-status');
                if (!statusEl) return;
                if (result.ok) {
                    statusEl.innerHTML = '<span class="text-[#93D6A0]">Solo Run Saved to Leaderboard!</span>';
                } else {
                    statusEl.innerHTML = `<span class="text-[#E9C176]">${result.error}</span>`;
                }
            });
        }
    }
    
    const main = document.getElementById('main-content');
    const userEmail = currentUser?.email;
    
    let dbStatusMsg = '';
    if(userEmail) {
        dbStatusMsg = '<span class="text-[#8A9389]">Submitting verified run...</span>';
    } else {
        dbStatusMsg = '<span class="text-[#E9C176]">Sign up to save on Leaderboard!</span>';
    }

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
                </div>
                
                <div class="mt-8 text-center text-[10px] font-bold uppercase tracking-widest">
                    ${dbStatusMsg}
                </div>
                <div id="save-status" class="mt-2 text-center text-[10px] font-bold uppercase tracking-widest"></div>
            </div>
            <button id="restart-btn-end" class="bg-[#004B23] text-[#93D6A0] px-12 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-125 transition-all active:scale-95">Play Again</button>
        </div>
    `;
    
    document.getElementById('restart-btn-end').addEventListener('click', () => {
        renderScreen('play');
    });
}

