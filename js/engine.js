// Core game engine (timer, state, typing logic)
import { getRandomWords } from './words.js';

export const gameState = {
    mode: 60, // 15, 30, 60, 120
    difficulty: 'medium', // easy, medium, hard
    status: 'idle', // idle, playing, finished
    words: [],
    typedEntries: [], // keeps track of typed chars per word
    currentWordIndex: 0,
    startTime: 0,
    timeRemaining: 60,
    timerInterval: null,
    errors: 0,
    totalTypedChars: 0
};

export function initEngine() {
    resetGame(gameState.mode, gameState.difficulty);
}

export function resetGame(mode = 60, difficulty = 'medium') {
    gameState.mode = mode;
    gameState.difficulty = difficulty;
    gameState.status = 'idle';
    gameState.words = getRandomWords(50, difficulty); // initial load
    gameState.typedEntries = gameState.words.map(() => '');
    gameState.currentWordIndex = 0;
    gameState.timeRemaining = mode;
    gameState.errors = 0;
    gameState.totalTypedChars = 0;
    
    clearInterval(gameState.timerInterval);
}

export function startGame(onTick, onFinish) {
    if (gameState.status === 'playing') return;
    gameState.status = 'playing';
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(() => {
        gameState.timeRemaining--;
        
        if (gameState.timeRemaining <= 0) {
            endGame(onTick, onFinish);
        } else {
            onTick(gameState.timeRemaining);
        }
    }, 1000);
}

function endGame(onTick, onFinish) {
    clearInterval(gameState.timerInterval);
    gameState.status = 'finished';
    gameState.timeRemaining = 0;
    onTick(0);
    onFinish();
}

export function handleKeystroke(key, onUpdate, onGameStartCallback) {
    if (gameState.status === 'finished') return;
    if (gameState.status === 'idle' && key.length === 1) {
        onGameStartCallback(); // Used to trigger startGame from UI
    }

    const currentWord = gameState.words[gameState.currentWordIndex];
    let typed = gameState.typedEntries[gameState.currentWordIndex];

    if (key === 'Backspace') {
        if (typed.length > 0) {
            gameState.typedEntries[gameState.currentWordIndex] = typed.slice(0, -1);
        } else if (gameState.currentWordIndex > 0) {
            gameState.currentWordIndex--;
        }
    } else if (key === ' ' || key === 'Spacebar') {
        // move to next word
        if (typed.length > 0) {
            gameState.currentWordIndex++;
            if (gameState.currentWordIndex >= gameState.words.length - 10) {
                // Add more words if getting close
                const newWords = getRandomWords(20);
                gameState.words.push(...newWords);
                gameState.typedEntries.push(...newWords.map(() => ''));
            }
        }
    } else if (key.length === 1) {
        // Standard character
        gameState.typedEntries[gameState.currentWordIndex] += key;
        gameState.totalTypedChars++;
        // Simple error counting: if character just typed doesn't match word
        const charIndex = gameState.typedEntries[gameState.currentWordIndex].length - 1;
        if (currentWord[charIndex] !== key) {
            gameState.errors++;
        }
    }
    
    onUpdate();
}
