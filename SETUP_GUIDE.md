# GearShift - Full Setup Guide (macOS, VS Code, Postman)

Written for a MacBook Air M2, coding in VS Code, testing the API with the Postman extension. Follow it top to bottom the first time; after that you'll only need the "Everyday run" section.

## 0. One-time prerequisites

Open the built-in **Terminal** app (or the VS Code integrated terminal: `` Ctrl+` ``).

**Homebrew** (if you don't have it):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Node.js** (need 18+; Vite 8 wants a recent Node):
```bash
brew install node
node -v      # confirm it printed a version
```

**Python 3** (macOS ships one, but confirm it's 3.10+):
```bash
python3 --version
```
If it's missing or old: `brew install python`

**Pipenv** (manages the backend's virtual env + dependencies - this project uses a `Pipfile`, not a `requirements.txt`):
```bash
pip3 install --user pipenv
pipenv --version    # confirm it printed a version
```
If `pipenv` isn't found after installing, close and reopen your terminal (it needs to pick up the new PATH entry), or use `brew install pipenv` instead.

**Git**:
```bash
git --version
```
(macOS will prompt to install Xcode Command Line Tools the first time you run a git command - accept that, it also fixes most "compiler not found" errors you'd otherwise hit installing Python packages later.)

**Postman**: you said you already have the VS Code extension installed - open it from the Activity Bar (the Postman icon on the left sidebar) and sign in/create a workspace if you haven't.

## 1. Get the project into VS Code

```bash
cd ~/Desktop        # or wherever you keep projects
git clone <your-repo-url> gearshift
cd gearshift
code .               # opens the folder in VS Code
```

You should see the `client/` and `server/` folders in the Explorer sidebar.

## 2. Backend - Flask API

Open a terminal in VS Code and run:

```bash
cd server
pipenv install
```

This reads `server/Pipfile`, creates a dedicated virtual environment for this project (Pipenv manages where it lives - you never see a `venv/` folder in your project, unlike the old `python -m venv` approach), and installs Flask + everything else it needs. First run takes maybe 20-30 seconds.

Every command that needs to run *inside* that environment gets prefixed with `pipenv run`:

```bash
cp .env.example .env
```
The defaults in `.env` work as-is for local development (SQLite, no Postgres needed). Open `.env` in VS Code if you want to change `SECRET_KEY`/`JWT_SECRET_KEY` to your own random strings.

Seed the database with demo data (50 vehicles across SUVs/sedans/trucks/vans/convertibles, 10 features, 3 users):
```bash
pipenv run python seed.py
```
You should see `Done! Seeded 3 users, 10 features, 50 vehicles.`

Run the API:
```bash
pipenv run python app.py
```
You'll see `Running on http://127.0.0.1:5000`. Leave this terminal running - open a **new terminal tab** for the frontend (Cmd+T in the VS Code terminal panel).

**Don't want to type `pipenv run` every time?** Run `pipenv shell` once - it drops you into a sub-shell with the environment already active (your prompt changes to show it), and from then on you just type `python seed.py` / `python app.py` like normal. Type `exit` to leave that sub-shell when you're done.

### Mac-specific: port 5000 conflict

On macOS Monterey and later, **AirPlay Receiver** listens on port 5000 by default, which can clash with Flask's default port and cause a confusing `Address already in use` error or requests silently going nowhere. Two options:

- **Turn AirPlay Receiver off** (recommended if you're not using it): System Settings -> General -> AirDrop & Handoff -> turn off "AirPlay Receiver".
- **Or run Flask on a different port**, e.g. 5555: change the last line of `server/app.py` from `app.run(debug=True, port=5000)` to `app.run(debug=True, port=5555)`, then update `client/.env`'s `VITE_API_URL` to `http://127.0.0.1:5555` and `server/.env`'s `CORS_ORIGINS` stays the same (it's about the frontend's origin, not the backend's port).

Either way, whatever port you land on, that's the URL Postman and the frontend both need to point at.

### Mac-specific: "Access to localhost was denied" (HTTP ERROR 403)

If your browser shows a branded "Access to localhost was denied" page (not a Flask error - Flask never looks like this) the moment anything tries to reach `localhost:5000`, it's almost always **Screen Time's content filter** (System Settings -> Screen Time -> Content & Privacy Restrictions -> Content Restrictions -> Web Content). It runs system-wide across every browser, not just Safari, and blocks by hostname - so `localhost` gets checked and blocked, while a raw IP like `127.0.0.1` sails through untouched since there's no hostname to filter.

This project's defaults already use `127.0.0.1` instead of `localhost` everywhere (`client/.env.example`, `server/.env.example`) specifically to dodge this. Just make sure you also **open the frontend itself at `http://127.0.0.1:5173`**, not `http://localhost:5173` - if the page itself loads from the `localhost` address, you're not actually avoiding the block.

## 3. Frontend - React + Vite + Tailwind

New terminal tab:
```bash
cd client
npm install
```

This installs everything already configured in `package.json`: React, React Router, Axios, and Tailwind CSS (already set up in `tailwind.config.js` / `postcss.config.js` / `index.css` - you don't need to redo this, but see section 5 if you want to understand how it was set up).

```bash
cp .env.example .env
```
Confirm `client/.env` has `VITE_API_URL=http://127.0.0.1:5000` (or whatever port you chose above).

Run the dev server:
```bash
npm run dev
```
Vite will print `http://localhost:5173` - open `http://127.0.0.1:5173` instead (same server, different address) to avoid the Screen Time issue described below.

## 4. Testing the API in Postman

1. Open the Postman extension in VS Code, create a new **Collection** called "GearShift".
2. Create a Postman **Environment** with one variable: `base_url` = `http://127.0.0.1:5000` (or your chosen port). Select this environment from the dropdown top-right. (Use `127.0.0.1`, not `localhost` - see the Screen Time note in section 2 if `localhost` requests mysteriously get denied.)
3. Add these requests to the collection (Postman lets you save each one):

**Register**
- `POST {{base_url}}/register`
- Body -> raw -> JSON:
```json
{ "email": "test@example.com", "password": "test1234", "role": "client" }
```
- Send. You should get back `{ "token": "...", "user": {...} }`.

**Save the token automatically** - in the Register and Login requests, open the **Scripts / Post-response** tab and add:
```javascript
const data = pm.response.json();
pm.environment.set("token", data.token);
```
Now every future request can use `{{token}}` without copy-pasting it manually.

**Login**
- `POST {{base_url}}/login`
- Body: `{ "email": "test@example.com", "password": "test1234" }`

**Get my profile (protected)**
- `GET {{base_url}}/me`
- Headers -> `Authorization: Bearer {{token}}`
- If you get `{"error": "Unauthorized"}`, your token is missing/expired - log in again.

**Test admin_required blocks non-admins**
- Log in as `client1@gearshift.com` / `client123`, save that token.
- `GET {{base_url}}/admin/stats` with `Authorization: Bearer {{token}}` -> should return `403 Forbidden`.
- Log in as `admin@gearshift.com` / `admin123` instead -> same request should return `200` with stats.

This is exactly the check called out in the project brief: **test both `@jwt_required` and `@admin_required` in Postman before building anything that depends on them.** If either of those two checks above doesn't behave as described, fix `server/utils/decorators.py` first - everything else in the app depends on it.

**Browse vehicles (public, no auth needed)**
- `GET {{base_url}}/vehicles`
- Try query params: `{{base_url}}/vehicles?location=Nairobi&category=SUV`

## 5. How this project was actually set up (for your own understanding / group presentation)

If your lecturer or teammates ask how the tooling was configured, here's exactly what was run - useful to know so you're not caught out explaining your own repo:

```bash
# Scaffold Vite + React
npm create vite@latest client -- --template react
cd client
npm install

# Router + HTTP client
npm install react-router-dom axios

# Tailwind CSS v3
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

That last command created `tailwind.config.js` and `postcss.config.js`. From there:
- `tailwind.config.js` was edited to add the custom color palette (`brand`/`accent`/`surface`), font families (Space Grotesk for headings, Inter for body - loaded via Google Fonts `<link>` tags in `index.html`), and a custom spacing scale (`gutter`, `section`, etc.) instead of relying on Tailwind's bare default scale.
- `src/index.css` has the three `@tailwind` directives plus a small `@layer components` block for reusable classes like `.btn-primary` and `.card` (keeps class names DRY across pages instead of repeating long utility strings everywhere).

Backend dependencies were set up with Pipenv instead of a bare `requirements.txt`:
```bash
cd server
pip install --user pipenv
pipenv install flask flask-sqlalchemy flask-bcrypt flask-cors pyjwt python-dotenv
```
That created `server/Pipfile` (the human-readable list of dependencies, similar in spirit to `package.json`) and `server/Pipfile.lock` (the exact resolved versions, similar to `package-lock.json` - commit both to git). Deliberately left out of the Pipfile: `gunicorn` and `psycopg2-binary`, which are only needed once this is deployed on Render (see the comment at the top of the `Pipfile` for why - installing them locally can fail to compile depending on your Python version).

## 6. Everyday run (after the first-time setup above)

Two terminal tabs, every time you sit down to work:

```bash
# Tab 1
cd server && pipenv run python app.py

# Tab 2
cd client && npm run dev
```

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| `Address already in use` on port 5000 | See the AirPlay Receiver note in section 2 |
| **"Access to localhost was denied" / HTTP ERROR 403** in the browser | Screen Time content filtering - see the dedicated note in section 2. Use `127.0.0.1` instead of `localhost` everywhere (already the project default) and open the app at `http://127.0.0.1:5173` |
| `ModuleNotFoundError` in Flask | Run commands with `pipenv run` in front (e.g. `pipenv run python app.py`), or run `pipenv shell` once first - a bare `python app.py` outside of pipenv won't see the installed packages |
| `pipenv: command not found` | Close and reopen your terminal after installing it, or run it as `python3 -m pipenv install` instead |
| CORS error in the browser console | Make sure `server/.env`'s `CORS_ORIGINS` matches the URL your frontend is actually running on (check the `npm run dev` output) |
| `401 Unauthorized` on a route that should work | Token missing/expired - log in again in Postman/the app; tokens last 7 days |
| Frontend shows no vehicles, login/signup fail with a generic message | Usually not a code bug - open DevTools -> Network tab and look at the actual failed request. Did you run `pipenv run python seed.py`? Does `client/.env`'s `VITE_API_URL` match your backend's actual port and use `127.0.0.1`? |
| `pipenv install` fails compiling a package | Run `xcode-select --install` in Terminal, then retry. If it's specifically `psycopg2-binary` or `gunicorn` failing - you shouldn't be installing those locally at all, they're deploy-only (see section 5) |
