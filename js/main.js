import { initUI } from './ui.js';
import { initEngine } from './engine.js';
import { initAuth } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initAuth();
    initEngine();
    initUI();
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('room')) {
        import('./multiplayerUI.js').then((mod) => mod.initMultiplayerUI());
    }
});
