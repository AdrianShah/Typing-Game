# WPM Atlas

WPM Atlas is a browser-based typing game built with vanilla JavaScript, Vite, Convex, and Clerk. Players race through timed typing rounds, track accuracy and WPM in real time, choose countries by continent, and compare scores on a shared leaderboard backed by Convex.

## Features
- Timed typing sessions with live WPM, accuracy, and error tracking.
- Difficulty and timer presets for quick-match gameplay.
- Country selection grouped by continent with persistent local preferences.
- Clerk-based authentication with profile sync to Convex.
- Profile editing for username, country, and avatar.
- Convex-backed leaderboard submission and top-run display.
- Country progression tracking based on prior runs.
- Weekly gameplay modifiers surfaced in the UI.
- Local storage for the selected country, mode, difficulty, and run history.

## Prerequisites
- Node.js 18 or newer.
- npm 9 or newer.
- A Convex deployment.
- A Clerk application with a publishable key.

## Local Setup
1. Install dependencies:

	```bash
	npm install
	```

2. Create a local environment file from the template:

	```bash
	copy .env.example .env.local
	```

3. Fill in the required values in `.env.local`.

4. Start the Convex dev server in a separate terminal:

	```bash
	npm run convex
	```

5. Start the Vite development server:

	```bash
	npm run dev
	```

6. Open the app in your browser at the local Vite URL shown in the terminal.

## Environment Variables
The frontend reads the following values from `import.meta.env`:

- `VITE_CONVEX_URL` - Convex HTTP client URL.
- `VITE_CLERK_PUBLISHABLE_KEY` - Public Clerk publishable key.

If you later add server-side Clerk verification in Convex, keep `CLERK_SECRET_KEY` in the Convex environment only. Do not expose it in the frontend build.

## Scripts
- `npm run dev` - Start the Vite dev server.
- `npm run build` - Build the production bundle.
- `npm run preview` - Preview the production build locally.
- `npm run convex` - Start the local Convex development process.

## Project Structure
- `index.html` - App shell and layout.
- `js/` - Frontend game logic, UI, auth, and persistence helpers.
- `css/styles.css` - Global styles.
- `convex/` - Convex schema and backend functions.
- `assets/` - Static assets.

## Notes
- `.env.local` is ignored by Git and should stay local.
- `convex/_generated/` contains generated Convex bindings.
- The leaderboard, profile sync, and country progression logic all rely on Convex being reachable at the configured URL.

## License
MIT License