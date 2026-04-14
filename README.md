# WPM Atlas

WPM Atlas is a real-time, browser-based multiplayer typing game built with vanilla JavaScript, Vite, Convex, and Clerk. Players can race each other live in multiplayer rooms, drop emoji reactions, track accuracy and WPM in real time, choose countries by continent, and compete on a shared global leaderboard backed by Convex.

## Features
- **Real-Time Multiplayer Racing:** Create and join live rooms via shareable codes. Sync starts with a 3-second countdown and watch your opponents' progress in real time (live WPM & position tracks).
- **Interactive Gameplay:** Press 1-6 keys during multiplayer rounds to drop live emoji reactions (🔥, 😂, 😭, 💀, ❤️, 👀).
- **Solo Modes & Progression:** Train in timed solo sessions (15s, 30s, 60s) with 3 difficulty presets (Easy, Medium, Hard).
- **In-Depth Vitals Tracks:** Precision tracking of live Net/Gross WPM, total errors, accuracy percentage, and visual character syncing.
- **Persistent Profiles:** Clerk-based authentication (Discord Auth recommended) coupled with Convex sync. Rate-limited profile updates for changing user-selected countries (once per 24 hours).
- **Global Leaderboards & Country System:** Grouped country selections with XP progression tracks and a shared cross-server leaderboard filterable by mode and difficulty.
- **Weekly Gameplay Modifiers:** Active route modifiers dynamically supplied to the UI per week.

## Prerequisites
- Node.js 18+ and npm 9+
- A Convex deployment account
- A Clerk application with a publishable key

## Local Setup
1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy the example environment into a local override file.
   ```bash
   cp .env.example .env.local
   ```
   *Fill out your Clerk and Convex keys inside your new `.env.local`.*

3. **Start the Convex backend:**
   Open a separate terminal and run:
   ```bash
   npm run convex
   ```

4. **Start the Vite frontend server:**
   ```bash
   npm run dev
   ```

5. **Play:**
   Open the localhost endpoint displayed by Vite in your browser.

## Environment Variables
The frontend requires the following keys exposed to Vite:
- `VITE_CONVEX_URL` - Convex HTTP client URL.
- `VITE_CLERK_PUBLISHABLE_KEY` - Public Clerk publishable key.

If you add server-side Clerk verification, insert the `CLERK_SECRET_KEY` into your Convex deployment dashboard, **do not** expose it to the frontend via `.env.local`.

## Scripts
- `npm run dev` - Start the Vite dev server.
- `npm run build` - Build the production bundle.
- `npm run preview` - Preview the production build locally.
- `npm run convex` - Start the local Convex development process.

## Project Structure
- `index.html` - App shell and core layout templates.
- `js/` - All vanilla JS logic modules (UI mapping, Auth execution, Multiplayer networking, Typer engine, LocalStorage persistence).
- `css/styles.css` - Global theme variables and aesthetic resets.
- `convex/` - Backend environment (schemas, auth validations, multiplayer sync queries, and user tables).
- `assets/` - Static images, fonts, and icons.

## Notes
- `.env.local` and other secret or local configuration files are ignored by git to protect configuration integrity.
- `convex/_generated/` contains auto-generated Convex API bindings.
- Multiplayers bounds, live leaderboards, and user profiles rely exclusively on Convex returning data securely over its WebSocket/HTTP endpoints.

## License
MIT License# WPM Atlas

WPM Atlas is a real-time, browser-based multiplayer typing game built with vanilla JavaScript, Vite, Convex, and Clerk. Players can race each other live in multiplayer rooms, drop emoji reactions, track accuracy and WPM in real time, choose countries by continent, and compete on a shared global leaderboard backed by Convex.

## Features
- **Real-Time Multiplayer Racing:** Create and join live rooms via shareable codes. Sync starts with a 3-second countdown and watch your opponents' progress in real time (live WPM & position tracks).
- **Interactive Gameplay:** Press 1-6 keys during multiplayer rounds to drop live emoji reactions (??, ??, ??, ??, ??, ??).
- **Solo Modes & Progression:** Train in timed solo sessions (15s, 30s, 60s) with 3 difficulty presets (Easy, Medium, Hard).
- **In-Depth Vitals Tracks:** Precision tracking of live Net/Gross WPM, total errors, accuracy percentage, and visual character syncing.
- **Persistent Profiles:** Clerk-based authentication (Discord Auth recommended) coupled with Convex sync. Rate-limited profile updates for changing user-selected countries (once per 24 hours).
- **Global Leaderboards & Country System:** Grouped country selections with XP progression tracks and a shared cross-server leaderboard filterable by mode and difficulty.
- **Weekly Gameplay Modifiers:** Active route modifiers dynamically supplied to the UI per week.

## Prerequisites
- Node.js 18+ and npm 9+
- A Convex deployment account
- A Clerk application with a publishable key

## Local Setup
1. **Install dependencies:**
   \\\ash
   npm install
   \\\

2. **Configure environment variables:**
   Copy the example environment into a local override file.
   \\\ash
   cp .env.example .env.local
   \\\
   *Fill out your Clerk and Convex keys inside your new \.env.local\.*

3. **Start the Convex backend:**
   Open a separate terminal and run:
   \\\ash
   npm run convex
   \\\

4. **Start the Vite frontend server:**
   \\\ash
   npm run dev
   \\\

5. **Play:**
   Open the localhost endpoint displayed by Vite in your browser.

## Environment Variables
The frontend requires the following keys exposed to Vite:
- \VITE_CONVEX_URL\ - Convex HTTP client URL.
- \VITE_CLERK_PUBLISHABLE_KEY\ - Public Clerk publishable key.

If you add server-side Clerk verification, insert the \CLERK_SECRET_KEY\ into your Convex deployment dashboard, **do not** expose it to the frontend via \.env.local\.

## Scripts
- \
pm run dev\ - Start the Vite dev server.
- \
pm run build\ - Build the production bundle.
- \
pm run preview\ - Preview the production build locally.
- \
pm run convex\ - Start the local Convex development process.

## Project Structure
- \index.html\ - App shell and core layout templates.
- \js/\ - All vanilla JS logic modules (UI mapping, Auth execution, Multiplayer networking, Typer engine, LocalStorage persistence).
- \css/styles.css\ - Global theme variables and aesthetic resets.
- \convex/\ - Backend environment (schemas, auth validations, multiplayer sync queries, and user tables).
- \ssets/\ - Static images, fonts, and icons.

## Notes
- \.env.local\ and other secret or local configuration files are ignored by git to protect configuration integrity.
- \convex/_generated/\ contains auto-generated Convex API bindings.
- Multiplayers bounds, live leaderboards, and user profiles rely exclusively on Convex returning data securely over its WebSocket/HTTP endpoints.

## License
MIT License
