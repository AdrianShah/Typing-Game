import { initUI } from './ui.js';
import { initEngine } from './engine.js';
import { initStorage } from './storage.js';
import { initAuth } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize core modules
    initStorage();
    await initAuth();
    initEngine();
    initUI();
    console.log("Soccer WPM Game initialized.");
});
