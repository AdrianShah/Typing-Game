import { initUI } from './ui.js';
import { initEngine } from './engine.js';
import { initAuth } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initAuth();
    initEngine();
    initUI();
});
