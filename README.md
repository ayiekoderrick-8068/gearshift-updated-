# GearShift

A peer-to-peer car rental marketplace built for Module 5's full-stack team project. Guests browse listings, clients rent and list cars, admins moderate the whole platform.

`seed.py` loads a 50-vehicle demo fleet (SUVs, sedans, trucks, vans, convertibles) with real per-model photos, plus 4 extra public content pages (`/about`, `/contact`, `/terms`, `/data-protection`) that the footer links to.

Built with **React (Vite) + Tailwind CSS** on the frontend and **Flask + SQLAlchemy** on the backend, with JWT authentication throughout.

> Looking for the click-by-click install walkthrough (Vite, Tailwind, the Flask venv, testing in Postman, running both servers)? See **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**. This README is the shorter reference version.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, React Router, Tailwind CSS, Axios |
| Backend | Flask, Flask-SQLAlchemy, Flask-Bcrypt, Flask-CORS, PyJWT |
| Backend dependency management | Pipenv (`Pipfile` / `Pipfile.lock`) |
| Database | SQLite locally, PostgreSQL in production (Render) |
| Auth | JWT (JSON Web Tokens), passwords hashed with bcrypt |
| Deployment | Backend on Render, frontend on Vercel |

## Project structure

```
gearshift/
  client/               React frontend (Vite)
    src/
      components/        Shared components (Navbar, VehicleCard, ProtectedRoute, ...)
      context/            AuthContext (JWT persisted to localStorage, restored + re-validated against GET /me on page load)
      pages/               One file per route
      api.js                Single Axios instance - everyone imports this
      constants.js           Shared dropdown data (cities, categories, ...)
      App.jsx                 Router - all <Route> definitions live here
      main.jsx
  server/               Flask backend
    models/               One file per DB model (User, Vehicle, Feature, Booking, join table)
    routes/               One file per blueprint (auth, vehicles, features, bookings, admin)
    utils/decorators.py    @jwt_required and @admin_required
    app.py                  App factory - registers blueprints, creates the app
    config.py               Reads .env into a Config object
    seed.py                  Wipes and refills the DB with demo data
    Pipfile / Pipfile.lock   Dependency management (Pipenv, not requirements.txt)
  README.md
  SETUP_GUIDE.md
  LICENSE
  .gitignore
```

## Quick start

### 1. Clone

```bash
git clone <your-repo-url>
cd gearshift
```

### 2. Backend

Needs [Pipenv](https://pipenv.pypa.io) installed once: `pip install --user pipenv` (or `brew install pipenv` on macOS).

```bash
cd server
pipenv install                  # reads Pipfile, creates a virtual env, installs deps
cp .env.example .env            # defaults work as-is for local dev (SQLite)
pipenv run python seed.py       # creates + fills the database
pipenv run python app.py        # runs on http://127.0.0.1:5000
```

`pipenv run` executes a command inside the project's virtual env without you having to activate it. If you'd rather activate it once and drop the prefix, run `pipenv shell` first, then just `python seed.py` / `python app.py`.

### 3. Frontend (new terminal tab)

```bash
cd client
npm install
cp .env.example .env            # points VITE_API_URL at your local backend
npm run dev                     # Vite prints http://localhost:5173
```

Open **`http://127.0.0.1:5173`** in your browser (not the `localhost` address Vite prints - on some Macs, Screen Time's content filter silently blocks the word "localhost" while leaving the raw IP alone; using `127.0.0.1` consistently for both the frontend and `VITE_API_URL` avoids that entirely. Details in SETUP_GUIDE.md's troubleshooting table).

Full step-by-step version (including how to test the API in Postman): **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**.

## Test accounts (from seed.py)

Run `pipenv run python seed.py` to create these. Client/owner/admin accounts log in at `/login`; drivers log in separately at `/driver-login` (see "Driver portal" below).

| Role | Email | Password |
|---|---|---|
| Admin | admin@gearshift.com | admin123 |
| Owner (lists every vehicle in the demo fleet) | owner@gearshift.com | owner123 |
| Client 1 (renter) | client1@gearshift.com | client123 |
| Client 2 (renter) | client2@gearshift.com | client123 |
| Client 3 (renter) | client3@gearshift.com | client123 |
| Driver - Grace Wanjiru (5.0★) | driver1@gearshift.com | driver123 |
| Driver - James Mwangi (4.9★) | driver2@gearshift.com | driver123 |
| Driver - Samuel Kimani (4.8★) | driver3@gearshift.com | driver123 |
| Driver - Faith Achieng (4.6★) | driver4@gearshift.com | driver123 |
| Driver - Mercy Nyambura (4.4★) | driver5@gearshift.com | driver123 |

3 more drivers exist in the seed data (`driver6`-`driver8@gearshift.com`, same `driver123` password) - see `DRIVER_DATA` in `server/seed.py` for the full list of 8. Swap any of these for your own real accounts once you're ready - just edit `seed.py` (or use the admin/`POST /drivers` and `POST /register` endpoints directly) and re-seed.

### Driver portal

Drivers are a separate login from clients/admins (see `models/driver.py`). When a renter books a vehicle "with chauffeur" and picks a driver, that booking shows up in the driver's portal (`/driver-portal`, reached via "Log in as a driver" on `/login` or `/signup`) as **pending**, and the driver can **Accept** or **Decline** it there.

## API overview

Base URL locally: `http://127.0.0.1:5000`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | - | Create an account |
| POST | `/login` | - | Log in, get a JWT |
| GET | `/me` | required | Current user's profile |
| PUT | `/me` | required | Update profile |
| POST | `/reset-password` | - | Request a reset token |
| POST | `/reset-password/confirm` | - | Confirm reset with token |
| GET | `/vehicles` | - | List approved, available vehicles (filterable) |
| GET | `/vehicles/<id>` | - | Single vehicle with features |
| POST | `/vehicles` | required | Create a listing |
| PUT | `/vehicles/<id>` | required (owner) | Edit a listing |
| DELETE | `/vehicles/<id>` | required (owner) | Delete a listing |
| GET | `/features` | - | List all features |
| POST | `/features` | required | Suggest a feature |
| PUT | `/features/<id>` | required | Edit a feature |
| DELETE | `/features/<id>` | admin | Delete a feature |
| POST | `/bookings` | required | Create a booking |
| GET | `/bookings/me` | required | My bookings (as renter) |
| GET | `/bookings/owner` | required | Bookings on cars I own |
| PUT | `/bookings/<id>` | required | Change status / leave a review (admin has full override - see `routes/bookings.py`) |
| DELETE | `/bookings/<id>` | required | Delete a pending/cancelled booking |
| GET | `/admin/stats` | admin | Platform totals |
| GET | `/admin/users` | admin | All users |
| PUT | `/admin/users/<id>` | admin | Ban / verify / change role |
| DELETE | `/admin/users/<id>` | admin | Delete a user |
| GET | `/admin/bookings` | admin | All bookings |
| GET | `/admin/vehicles` | admin | All vehicles (incl. unapproved) |
| PUT | `/admin/vehicles/<id>` | admin | Approve / reject a listing |
| GET | `/drivers` | - | List available chauffeurs |
| POST | `/drivers` | admin | Add a chauffeur |
| POST | `/driver-login` | - | Driver portal log in, get a driver JWT |
| GET | `/driver/me` | driver | Current driver's profile |
| GET | `/driver/bookings` | driver | Jobs assigned to this driver |
| PUT | `/driver/bookings/<id>` | driver | Accept / decline an assigned job |
| POST | `/bookings/convoy` | required | Book several vehicles at once (event/convoy) |
| POST | `/driver-applications` | - | Public "become a driver" application + CV upload |
| GET | `/admin/driver-applications` | admin | Review driver applications |
| PUT | `/admin/driver-applications/<id>` | admin | Approve / reject an application |
| GET | `/admin/driver-applications/<id>/cv` | admin | Download an applicant's CV |

38 endpoints total, well past the 8-minimum / 2-per-method / 5-protected requirements.

## Deployment

- **Backend (Render)**: Web Service pointed at `/server`. Build command `pip install pipenv && pipenv install --system --deploy && pip install gunicorn psycopg2-binary` (the last two are only needed in production, so they're not in the Pipfile - see the comment at the top of `server/Pipfile`). Start command `gunicorn app:app`. Add a Postgres instance, set `DATABASE_URL`, `JWT_SECRET_KEY`, `SECRET_KEY`, `CORS_ORIGINS`.
- **Frontend (Vercel)**: root directory `client`, framework preset Vite. Set `VITE_API_URL` to the Render URL.
- Live URLs: _add these here once deployed_
  - Frontend: `TODO`
  - Backend: `TODO`

## Module 5 requirements checklist

Self-assessed against the project brief. Everything below is implemented and verified in this codebase; the two unchecked items are things only you and your team can finish, since they depend on your actual GitHub repo and hosting accounts, not on the code itself.

| Requirement | Status |
|---|---|
| Built with React | ✅ |
| 8+ routes | ✅ 24 routes (see `client/src/App.jsx`) |
| 5+ protected routes | ✅ 14 protected routes |
| Password reset flow | ✅ `/reset-password` |
| Runs on a single HTML file, no full-page redirects | ✅ `client/index.html`, all navigation via React Router |
| Professional UI styling | ✅ custom Tailwind theme, custom fonts |
| 8+ endpoints, 2+ per HTTP method | ✅ 38 endpoints (13 GET, 10 POST, 7 PUT, 4 DELETE, plus 4 driver-portal endpoints) |
| 5+ auth-protected endpoints | ✅ 29+ protected endpoints |
| 4+ database models, 4+ columns each | ✅ 7 models (User, Vehicle, Feature, Booking, Driver, DriverApplication, plus the join table) |
| 2+ one-to-many relationships | ✅ User→Vehicle, User→Booking, Driver→Booking |
| 1+ many-to-many relationship | ✅ Vehicle↔Feature via `vehicle_features` |
| JWT authentication | ✅ PyJWT, `@jwt_required` / `@admin_required` / `@driver_required` |
| Detailed README | ✅ this file + `SETUP_GUIDE.md` |
| DRY code | ✅ shared `api.js`, `constants.js`, reusable components |
| License file | ✅ `LICENSE` (MIT) |
| Regular, clear git commits | ⬜ up to your team - commit as you build, don't push this as one giant commit (see "Team workflow" below) |
| Live on a public URL (frontend + backend deployed) | ⬜ not deployed yet - see "Deployment" above for the exact steps once you're ready |

## Team workflow

- Branch per feature (`feature/booking-form`), merge to `main` when working.
- Commit after every working feature, not once at the end - use `feat:` / `fix:` prefixes.
- Everyone imports `client/src/api.js` and `client/src/context/AuthContext.jsx` rather than rolling their own - see the comments in those files.

## License

MIT - see [LICENSE](./LICENSE).
