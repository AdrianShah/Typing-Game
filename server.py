import hashlib
import http.server
import json
import os
import secrets
import socketserver
import sqlite3
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlparse
import urllib.request
import os

HOST = '0.0.0.0'
PORT = int(os.environ.get("PORT", 8000))
DB_PATH = Path(__file__).with_name('wpmgame.db')
VALID_MODES = {15, 30, 60, 120}
VALID_DIFFICULTIES = {'easy', 'medium', 'hard'}
MAX_CPS = 22
MAX_NET_WPM = 300
SESSION_HOURS = 24
RUN_TTL_MINUTES = 10
DEV_EXPOSE_VERIFICATION_CODE = False


def send_verification_email(to_email: str, code: str) -> bool:
	resend_key = os.environ.get('RESEND_API_KEY')
	if not resend_key:
		print("Warning: RESEND_API_KEY environment variable not set.")
		return False

	url = "https://api.resend.com/emails"
	headers = {
		"Authorization": f"Bearer {resend_key}",
		"Content-Type": "application/json"
	}
	payload = json.dumps({
		"from": "Acme <onboarding@resend.dev>",
		"to": [to_email],
		"subject": "Your Typing Game Verification Code",
		"html": f"<p>Your verification code is: <strong>{code}</strong></p>"
	}).encode('utf-8')

	try:
		req = urllib.request.Request(url, data=payload, headers=headers, method='POST')
		with urllib.request.urlopen(req) as response:
			return response.getcode() == 200
	except Exception as e:
		print(f"Failed to send email via Resend: {e}")
		return False

def utc_now_iso() -> str:
	return datetime.now(timezone.utc).isoformat()


def create_db() -> None:
	conn = sqlite3.connect(DB_PATH)
	conn.execute(
		'''
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			password_salt TEXT NOT NULL,
			verified INTEGER NOT NULL DEFAULT 0,
			verification_code TEXT,
			username TEXT,
			icon TEXT DEFAULT 'captain',
			profile_complete INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL
		)
		'''
	)
	conn.execute(
		'''
		CREATE TABLE IF NOT EXISTS sessions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			token_hash TEXT UNIQUE NOT NULL,
			expires_at TEXT NOT NULL,
			created_at TEXT NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id)
		)
		'''
	)
	conn.execute(
		'''
		CREATE TABLE IF NOT EXISTS leaderboard (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			player_email TEXT NOT NULL,
			team TEXT NOT NULL,
			mode INTEGER NOT NULL,
			difficulty TEXT NOT NULL,
			typed_chars INTEGER NOT NULL,
			errors INTEGER NOT NULL,
			elapsed_seconds INTEGER NOT NULL,
			gross_wpm REAL NOT NULL,
			net_wpm REAL NOT NULL,
			accuracy REAL NOT NULL,
			created_at TEXT NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id)
		)
		'''
	)
	conn.execute(
		'''
		CREATE TABLE IF NOT EXISTS active_runs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			mode INTEGER NOT NULL,
			difficulty TEXT NOT NULL,
			started_at TEXT NOT NULL,
			expires_at TEXT NOT NULL,
			used INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id)
		)
		'''
	)
	conn.execute(
		'''
		CREATE TABLE IF NOT EXISTS club_progression (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			team_id TEXT NOT NULL,
			level INTEGER NOT NULL DEFAULT 1,
			xp INTEGER NOT NULL DEFAULT 0,
			unlocked_perks TEXT NOT NULL DEFAULT '[]',
			updated_at TEXT NOT NULL,
			UNIQUE(user_id, team_id),
			FOREIGN KEY (user_id) REFERENCES users(id)
		)
		'''
	)
	conn.commit()
	conn.close()


def hash_password(password: str, salt_hex: str) -> str:
	salt = bytes.fromhex(salt_hex)
	digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 120_000)
	return digest.hex()


def make_password_hash(password: str) -> tuple[str, str]:
	salt_hex = secrets.token_hex(16)
	return hash_password(password, salt_hex), salt_hex


def make_session_token() -> tuple[str, str]:
	token = secrets.token_urlsafe(32)
	token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
	return token, token_hash


def token_to_hash(token: str) -> str:
	return hashlib.sha256(token.encode('utf-8')).hexdigest()


def is_valid_email(email: str) -> bool:
	email = (email or '').strip()
	return '@' in email and '.' in email and len(email) <= 255


def password_error(password: str) -> str | None:
	if len(password) < 8:
		return 'Password must be at least 8 characters.'
	if not any(ch.islower() for ch in password):
		return 'Password must include a lowercase letter.'
	if not any(ch.isupper() for ch in password):
		return 'Password must include an uppercase letter.'
	if not any(ch.isdigit() for ch in password):
		return 'Password must include a number.'
	if not any(ch in '!@#$%^&*()-_=+[]{};:,.?/\\|' for ch in password):
		return 'Password must include a special character.'
	return None


class AppHandler(http.server.SimpleHTTPRequestHandler):
	def end_headers(self):
		self.send_header('Cache-Control', 'no-store')
		super().end_headers()

	def _read_json(self) -> dict:
		length = int(self.headers.get('Content-Length', '0'))
		body = self.rfile.read(length) if length > 0 else b'{}'
		try:
			return json.loads(body.decode('utf-8'))
		except json.JSONDecodeError:
			return {}

	def _send_json(self, code: int, payload: dict):
		raw = json.dumps(payload).encode('utf-8')
		self.send_response(code)
		self.send_header('Content-Type', 'application/json; charset=utf-8')
		self.send_header('Content-Length', str(len(raw)))
		self.end_headers()
		self.wfile.write(raw)

	def _db(self):
		conn = sqlite3.connect(DB_PATH)
		conn.row_factory = sqlite3.Row
		return conn

	def _auth_user(self):
		auth = self.headers.get('Authorization', '')
		if not auth.startswith('Bearer '):
			return None
		token = auth.removeprefix('Bearer ').strip()
		if not token:
			return None

		token_hash = token_to_hash(token)
		conn = self._db()
		row = conn.execute(
			'''
			SELECT u.id, u.email, u.verified, s.expires_at
			FROM sessions s
			JOIN users u ON s.user_id = u.id
			WHERE s.token_hash = ?
			''',
			(token_hash,),
		).fetchone()
		conn.close()

		if not row:
			return None

		expires = datetime.fromisoformat(row['expires_at'])
		if expires < datetime.now(timezone.utc):
			return None

		return dict(row)

	def do_POST(self):
		parsed = urlparse(self.path)
		if parsed.path == '/api/auth/register':
			return self._handle_register()
		if parsed.path == '/api/auth/verify':
			return self._handle_verify()
		if parsed.path == '/api/auth/login':
			return self._handle_login()
		if parsed.path == '/api/auth/profile':
			return self._handle_profile_setup()
		if parsed.path == '/api/runs/start':
			return self._handle_start_run()
		if parsed.path == '/api/leaderboard':
			return self._handle_submit_score()

		self._send_json(404, {'error': 'Endpoint not found'})

	def do_GET(self):
		parsed = urlparse(self.path)
		if parsed.path == '/api/auth/me':
			return self._handle_me()
		if parsed.path == '/api/leaderboard':
			return self._handle_get_leaderboard()
		if parsed.path == '/api/club/progression':
			return self._handle_get_progression()
		if parsed.path == '/api/league/modifiers':
			return self._handle_get_league_modifiers()

		return super().do_GET()

	def _handle_register(self):
		data = self._read_json()
		email = (data.get('email') or '').strip().lower()
		password = data.get('password') or ''

		if not is_valid_email(email):
			return self._send_json(400, {'error': 'Invalid email format.'})

		err = password_error(password)
		if err:
			return self._send_json(400, {'error': err})

		password_hash, salt_hex = make_password_hash(password)
		verification_code = f"{secrets.randbelow(1_000_000):06d}"

		conn = self._db()
		user = conn.execute('SELECT id, verified FROM users WHERE email = ?', (email,)).fetchone()

		if user and int(user['verified']) == 1:
			conn.close()
			return self._send_json(409, {'error': 'Account already exists. Please login.'})

		if user:
			conn.execute(
				'''
				UPDATE users
				SET password_hash = ?, password_salt = ?, verification_code = ?, verified = 0
				WHERE id = ?
				''',
				(password_hash, salt_hex, verification_code, user['id']),
			)
		else:
			conn.execute(
				'''
				INSERT INTO users (email, password_hash, password_salt, verification_code, verified, created_at)
				VALUES (?, ?, ?, ?, 0, ?)
				''',
				(email, password_hash, salt_hex, verification_code, utc_now_iso()),
			)

		conn.commit()
		conn.close()

		# Local development fallback: optionally expose code in API for quick testing.
		if DEV_EXPOSE_VERIFICATION_CODE:
			self._send_json(
				200,
				{
					'ok': True,
					'message': 'Verification code generated (dev mode).',
					'devVerificationCode': verification_code,
				},
			)
			return

		print(f'[verification] {email} -> {verification_code}')
		send_verification_email(email, verification_code)
		
		self._send_json(
			200,
			{
				'ok': True,
				'message': 'Verification code generated. Check your email.',
			},
		)

	def _handle_start_run(self):
		user = self._auth_user()
		if not user:
			return self._send_json(401, {'error': 'Unauthorized'})

		data = self._read_json()
		mode = int(data.get('mode', 0))
		difficulty = (data.get('difficulty') or '').strip().lower()
		if mode not in VALID_MODES:
			return self._send_json(400, {'error': 'Invalid mode.'})
		if difficulty not in VALID_DIFFICULTIES:
			return self._send_json(400, {'error': 'Invalid difficulty.'})

		now = datetime.now(timezone.utc)
		expires_at = (now + timedelta(minutes=RUN_TTL_MINUTES)).isoformat()
		started_at = now.isoformat()

		conn = self._db()
		conn.execute(
			'DELETE FROM active_runs WHERE user_id = ? AND (used = 1 OR expires_at < ?)',
			(user['id'], now.isoformat()),
		)
		cursor = conn.execute(
			'''
			INSERT INTO active_runs (user_id, mode, difficulty, started_at, expires_at, used, created_at)
			VALUES (?, ?, ?, ?, ?, 0, ?)
			''',
			(user['id'], mode, difficulty, started_at, expires_at, utc_now_iso()),
		)
		run_id = cursor.lastrowid
		conn.commit()
		conn.close()

		self._send_json(
			200,
			{
				'ok': True,
				'runId': run_id,
				'startedAt': started_at,
				'expiresAt': expires_at,
			},
		)

	def _handle_verify(self):
		data = self._read_json()
		email = (data.get('email') or '').strip().lower()
		code = (data.get('code') or '').strip()

		if not is_valid_email(email) or len(code) != 6 or not code.isdigit():
			return self._send_json(400, {'error': 'Invalid verification request.'})

		conn = self._db()
		user = conn.execute(
			'SELECT id, verification_code FROM users WHERE email = ?',
			(email,),
		).fetchone()

		if not user:
			conn.close()
			return self._send_json(404, {'error': 'Account not found.'})

		if user['verification_code'] != code:
			conn.close()
			return self._send_json(401, {'error': 'Verification code is incorrect.'})

		conn.execute(
			'UPDATE users SET verified = 1, verification_code = NULL WHERE id = ?',
			(user['id'],),
		)
		conn.commit()
		conn.close()
		self._send_json(200, {'ok': True, 'message': 'Email verified. You can login now.'})

	def _handle_login(self):
		data = self._read_json()
		email = (data.get('email') or '').strip().lower()
		password = data.get('password') or ''

		conn = self._db()
		user = conn.execute(
			'SELECT id, email, password_hash, password_salt, verified FROM users WHERE email = ?',
			(email,),
		).fetchone()
		if not user:
			conn.close()
			return self._send_json(401, {'error': 'Invalid credentials.'})

		if int(user['verified']) != 1:
			conn.close()
			return self._send_json(403, {'error': 'Please verify your email first.'})

		attempted = hash_password(password, user['password_salt'])
		if attempted != user['password_hash']:
			conn.close()
			return self._send_json(401, {'error': 'Invalid credentials.'})

		token, token_hash = make_session_token()
		expires_at = (datetime.now(timezone.utc) + timedelta(hours=SESSION_HOURS)).isoformat()
		conn.execute(
			'INSERT INTO sessions (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)',
			(user['id'], token_hash, expires_at, utc_now_iso()),
		)
		conn.commit()
		conn.close()

		self._send_json(
			200,
			{
				'ok': True,
				'token': token,
				'user': {
					'email': user['email'],
					'verified': True,
					'username': user['username'],
					'icon': user['icon'] or 'captain',
					'profileComplete': bool(user['profile_complete'])
				},
				'expiresAt': expires_at,
			},
		)

	def _handle_me(self):
		user = self._auth_user()
		if not user:
			return self._send_json(401, {'error': 'Unauthorized'})
		return self._send_json(
			200,
			{
				'ok': True,
				'user': {
					'email': user['email'],
					'verified': bool(user['verified']),
					'username': user['username'],
					'icon': user['icon'] or 'captain',
					'profileComplete': bool(user['profile_complete'])
				}
			},
		)

	def _handle_profile_setup(self):
		user = self._auth_user()
		if not user:
			return self._send_json(401, {'error': 'Unauthorized'})

		data = self._read_json()
		username = (data.get('username') or '').strip()[:50]
		icon = (data.get('icon') or 'captain').strip()[:30]

		if not username or len(username) < 2:
			return self._send_json(400, {'error': 'Username must be at least 2 characters.'})

		valid_icons = {'captain', 'warrior', 'sage', 'guardian', 'mentor'}
		if icon not in valid_icons:
			return self._send_json(400, {'error': 'Invalid icon selection.'})

		conn = self._db()
		conn.execute(
			'UPDATE users SET username = ?, icon = ?, profile_complete = 1 WHERE id = ?',
			(username, icon, user['id']),
		)
		conn.commit()
		conn.close()

		self._send_json(
			200,
			{
				'ok': True,
				'user': {
					'email': user['email'],
					'username': username,
					'icon': icon,
					'profileComplete': True
				}
			}
		)

	def _handle_submit_score(self):
		user = self._auth_user()
		if not user:
			return self._send_json(401, {'error': 'Unauthorized'})

		data = self._read_json()
		mode = int(data.get('mode', 0))
		difficulty = (data.get('difficulty') or '').strip().lower()
		team = (data.get('team') or 'Solo Agent').strip()[:64]
		typed_chars = int(data.get('typedChars', -1))
		errors = int(data.get('errors', -1))
		elapsed = int(data.get('elapsedSeconds', 0))
		run_id = int(data.get('runId', 0))

		if mode not in VALID_MODES:
			return self._send_json(400, {'error': 'Invalid mode.'})
		if difficulty not in VALID_DIFFICULTIES:
			return self._send_json(400, {'error': 'Invalid difficulty.'})
		if elapsed < mode - 2 or elapsed > mode + 5:
			return self._send_json(400, {'error': 'Invalid elapsed time.'})
		if typed_chars < 0 or errors < 0 or errors > typed_chars:
			return self._send_json(400, {'error': 'Invalid typing metrics.'})
		if run_id <= 0:
			return self._send_json(400, {'error': 'Missing run session.'})

		conn = self._db()
		run_row = conn.execute(
			'''
			SELECT id, mode, difficulty, started_at, expires_at, used
			FROM active_runs
			WHERE id = ? AND user_id = ?
			''',
			(run_id, user['id']),
		).fetchone()

		if not run_row:
			conn.close()
			return self._send_json(403, {'error': 'Invalid run session.'})

		if int(run_row['used']) == 1:
			conn.close()
			return self._send_json(403, {'error': 'Run session already used.'})

		now = datetime.now(timezone.utc)
		if datetime.fromisoformat(run_row['expires_at']) < now:
			conn.close()
			return self._send_json(403, {'error': 'Run session expired.'})

		if int(run_row['mode']) != mode or run_row['difficulty'] != difficulty:
			conn.close()
			return self._send_json(403, {'error': 'Run settings mismatch.'})

		server_elapsed = int((now - datetime.fromisoformat(run_row['started_at'])).total_seconds())
		if server_elapsed < mode - 2 or server_elapsed > mode + 5:
			conn.close()
			return self._send_json(403, {'error': 'Run timing mismatch.'})

		if abs(server_elapsed - elapsed) > 3:
			conn.close()
			return self._send_json(403, {'error': 'Client timing mismatch.'})

		safe_elapsed = max(1, elapsed)
		cps = typed_chars / safe_elapsed
		if cps > MAX_CPS:
			conn.close()
			return self._send_json(403, {'error': 'Score rejected due to suspicious typing speed.'})

		gross_wpm = (typed_chars / 5) / (safe_elapsed / 60)
		net_wpm = max(0.0, gross_wpm - (errors / (safe_elapsed / 60)))
		if net_wpm > MAX_NET_WPM:
			conn.close()
			return self._send_json(403, {'error': 'Score rejected due to suspicious WPM.'})

		accuracy = 100.0 if typed_chars == 0 else ((typed_chars - errors) / typed_chars) * 100.0

		conn.execute('UPDATE active_runs SET used = 1 WHERE id = ?', (run_id,))
		conn.execute(
			'''
			INSERT INTO leaderboard (
				user_id, player_email, team, mode, difficulty,
				typed_chars, errors, elapsed_seconds, gross_wpm, net_wpm, accuracy, created_at
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			''',
			(
				user['id'],
				user['email'],
				team,
				mode,
				difficulty,
				typed_chars,
				errors,
				safe_elapsed,
				gross_wpm,
				net_wpm,
				accuracy,
				utc_now_iso(),
			),
		)

		# Award club XP based on net_wpm
		xp_earned = max(10, int(net_wpm / 2))
		selected_team = (data.get('selectedTeamId') or '').strip()
		if selected_team:
			conn.execute(
				'''
				INSERT INTO club_progression (user_id, team_id, level, xp, updated_at)
				VALUES (?, ?, 1, ?, ?)
				ON CONFLICT(user_id, team_id) DO UPDATE SET xp = xp + ?, updated_at = ?
				''',
				(user['id'], selected_team, xp_earned, utc_now_iso(), xp_earned, utc_now_iso()),
			)

		conn.commit()
		conn.close()

		self._send_json(
			200,
			{
				'ok': True,
				'entry': {
					'player': user['email'],
					'team': team,
					'mode': mode,
					'difficulty': difficulty,
					'grossWPM': gross_wpm,
					'netWPM': net_wpm,
					'acc': accuracy,
					'date': utc_now_iso(),
				},
			},
		)

	def _handle_get_leaderboard(self):
		conn = self._db()
		rows = conn.execute(
			'''
			SELECT player_email, team, mode, difficulty, gross_wpm, net_wpm, accuracy, created_at
			FROM leaderboard
			ORDER BY net_wpm DESC, accuracy DESC, created_at DESC
			LIMIT 25
			'''
		).fetchall()
		conn.close()

		data = [
			{
				'player': row['player_email'],
				'team': row['team'],
				'mode': row['mode'],
				'difficulty': row['difficulty'],
				'grossWPM': row['gross_wpm'],
				'netWPM': row['net_wpm'],
				'acc': row['accuracy'],
				'date': row['created_at'],
			}
			for row in rows
		]
		self._send_json(200, {'ok': True, 'entries': data})

	def _handle_get_progression(self):
		user = self._auth_user()
		if not user:
			return self._send_json(401, {'error': 'Unauthorized'})

		conn = self._db()
		rows = conn.execute(
			'''
			SELECT team_id, level, xp, unlocked_perks
			FROM club_progression
			WHERE user_id = ?
			ORDER BY xp DESC
			''',
			(user['id'],),
		).fetchall()
		conn.close()

		progressions = []
		for row in rows:
			import json
			try:
				perks = json.loads(row['unlocked_perks'] or '[]')
			except:
				perks = []
			progressions.append({
				'teamId': row['team_id'],
				'level': row['level'],
				'xp': row['xp'],
				'unlockedPerks': perks,
			})

		self._send_json(200, {'ok': True, 'progressions': progressions})

	def _handle_get_league_modifiers(self):
		# Rotate global modifiers weekly based on week number
		now = datetime.now(timezone.utc)
		week = now.isocalendar()[1]

		all_possible_modifiers = [
			{'name': 'Speed Blitz', 'effect': 'timer reduced by 10%'},
			{'name': 'Precision Challenge', 'effect': 'penalties doubled'},
			{'name': 'Endurance Mode', 'effect': 'long modes favored'},
			{'name': 'Accuracy Focused', 'effect': 'higher min accuracy needed'},
			{'name': 'Consistency Run', 'effect': 'fewer errors = bonus XP'},
			{'name': 'Combo Scoring', 'effect': 'chain accuracy for multiplier'},
			{'name': 'Power Hour', 'effect': '+5% WPM baseline'},
			{'name': 'Hard Difficulty Only', 'effect': 'play hard to earn 1.5x XP'},
		]

		modifiers = [
			all_possible_modifiers[(week) % len(all_possible_modifiers)],
			all_possible_modifiers[(week + 1) % len(all_possible_modifiers)],
			all_possible_modifiers[(week + 2) % len(all_possible_modifiers)],
		]

		self._send_json(200, {'ok': True, 'modifiers': modifiers, 'weekNumber': week})


def run_server():
	create_db()
	handler = AppHandler
	with socketserver.ThreadingTCPServer((HOST, PORT), handler) as httpd:
		print(f'WPM Pitch server running at http://localhost:{PORT}')
		httpd.serve_forever()


if __name__ == '__main__':
	run_server()