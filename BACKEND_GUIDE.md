# WPM Pitch: Backend API Integration Guide

Currently, your WPM Pitch game runs entirely on the client side (browser). Front-end environments cannot securely store APIs and database keys (like your `.env.local` Firebase keys), as any user can inspect the source code and find them.

To securely connect your multiplayer logic and Leaderboard data to Firebase/Supabase, you need to set up a small backend.

## Approach: Creating an API using Node.js + Express

You can create an intermediary server that talks to your database. The frontend makes HTTP requests to your server, and your server handles the Firebase code. Here's how:

### 1. Initialize the project & install dependencies
Inside your terminal (make sure you are in the `d:\Projects\Wpmgame` folder):
```bash
npm init -y
npm install express cors dotenv firebase
```

### 2. Create `server.js`
This file retrieves your `.env.local` keys securely, runs the Firebase database code, and exposes clean "endpoints" to the frontend.

```javascript
// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

// 1. Load environment variables securely
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

const app = express();
app.use(cors()); // Allows your frontend to request this backend
app.use(express.json());

// 2. Endpoint: Save Solo Run Score
app.post('/api/leaderboard', async (req, res) => {
    try {
        const { team, netWPM, acc } = req.body;
        // Verify token/captain ID here if required
        const docRef = await addDoc(collection(db, "leaderboard"), {
            team, netWPM, acc, timestamp: new Date()
        });
        res.status(200).json({ success: true, id: docRef.id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save score.' });
    }
});

// 3. Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Game server active on port \${PORT}\`));
```

### 3. Update the Frontend to call the Backend
In your frontend code (e.g. inside `js/leaderboard.js` or `js/storage.js`), instead of saving to `localStorage` or loading Firebase directly, you make external requests:

```javascript
// Example in js/storage.js
export async function saveResultToCloud(resultData) {
    try {
        const response = await fetch('http://localhost:3000/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resultData)
        });
        const data = await response.json();
        console.log("Saved securely to cloud!", data);
    } catch (error) {
        console.error("Backend unreachable", error);
    }
}
```

### Alternative: Serverless (Vercel / Netlify / Firebase Functions)
If you don't want to run a Node server yourself, you can use serverless platforms. You just upload your frontend map to **Vercel** or **Firebase Hosting**. They provide a dashboard where you paste your `.env.local` keys, and they give you a folder (e.g., `/api`) where you drop little JavaScript functions just like the endpoints in the `server.js` example above.

Let me know when you want to build out the real backend architecture!