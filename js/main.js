import { initUI } from './ui.js';
import { initEngine } from './engine.js';
import { initAuth } from './auth.js';

/**
 * Phase 5: Global Error Handler
 * Catch unhandled promise rejections and uncaught errors
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('[ERROR] Unhandled promise rejection:', event.reason);
    event.preventDefault();
    // Optional: Show user-friendly notification
    const msg = event.reason?.message || String(event.reason);
    console.error('[ERROR] Details:', msg);
});

window.addEventListener('error', (event) => {
    console.error('[ERROR] Uncaught error:', event.error);
    // Optional: Show user-friendly notification
    if (event.error) {
        console.error('[ERROR] Stack:', event.error.stack);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('[Main] Initializing auth...');
        await initAuth();
        console.log('[Main] Initializing engine...');
        initEngine();
        console.log('[Main] Initializing UI...');
        initUI();
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('room')) {
            console.log('[Main] Room parameter detected, loading multiplayer...');
            import('./multiplayerUI.js').then((mod) => mod.initMultiplayerUI());
        }
        console.log('[Main] Application initialized successfully');
    } catch (err) {
        console.error('[Main] Initialization failed:', err);
    }
});
