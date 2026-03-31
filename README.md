# Typing Game 

A web-based typing game backend powered by Python and a vanilla JavaScript frontend. 

## Features
- Interactive typing challenges to increase WPM (Words Per Minute).
- Custom user profiles (username and emoji icons).
- Login and Authentication.
- Leaderboard tracking global top scores.
- Club Progression and League Modifiers for dynamic weekly challenges.
- Anti-cheat mechanisms preventing runs not initiated on the server.

## Technologies
- **Backend:** Python + `http.server` 
- **Database:** SQLite3
- **Frontend:** Vanilla JavaScript, HTML5, CSS3 

## Setup and Running locally
1. Ensure Python 3.x is installed.
2. Clone this repository.
3. Open a terminal in the root directory.
4. Run `python server.py` (or `python3 server.py`).
5. Access the game by navigating to `http://localhost:8000` in your web browser.

> **Important Note:** Do not run the HTML file via a static host (like VS Code Live Server) directly, as it requires a local python environment serving on port 8000 for the API endpoints to function synchronously.

## Deployment with Railway
If you plan to deploy this project on Railway or another cloud provider:
1. Ensure the container runs the command: `python server.py`.
2. Map the deployment's default port or use the `PORT` environment variable if modified.

## License
MIT License