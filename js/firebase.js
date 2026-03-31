import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCFsDcQQStpMYeqvmZ8x2WJ_tvVVOddkyU",
  authDomain: "wpm-game-1d9c7.firebaseapp.com",
  projectId: "wpm-game-1d9c7",
  storageBucket: "wpm-game-1d9c7.firebasestorage.app",
  messagingSenderId: "412254601283",
  appId: "1:412254601283:web:33497bb60e446f99b114f6",
  measurementId: "G-BYD8BGG3ZX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);