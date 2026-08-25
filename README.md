# Deliveroo

A parcel delivery management platform for Nairobi. Customers book and track parcels, riders run their deliveries, and operations assign couriers and watch the network.

Moringa School Module 6 capstone — CodeMaestros.

## Team

| Name | Frontend | Backend |
| --- | --- | --- |
| Samuel Mutiso | API layer and Redux store | App factory, config, models, migrations, seed, payments and M-Pesa |
| Alexander | Auth, profile and the admin area | Authentication, rider applications, onboarding |
| James | The customer application | Orders and pricing |
| Michelle | Layout shell, public site and rider screens | Maps, geocoding and the courier API |
| David | Component library and shared hooks | Admin API and notifications |

## Status

Frontend and backend are both complete and running together. `pipenv run test` passes 82 tests. The mock API used during the first presentation has been removed; no React code changed when the real Flask API replaced it, because the mock served the same routes and the same JSON shapes.

## Stack

| | |
| --- | --- |
| Framework | React 18 |
| Build tool | Vite 5 |
| State | Redux Toolkit + React Redux |
| Routing | React Router 6 |
| HTTP | Axios |
| Styling | Tailwind CSS 3 |
| Charts | Recharts |
| Maps | Leaflet + React Leaflet, OpenStreetMap tiles |
| Geocoding | Nominatim, proxied through the API |
| Routing engine | OSRM, proxied through the API |
| Dates | date-fns |
| API | Flask 3, SQLAlchemy 2, Flask-Migrate, Flask-JWT-Extended, Marshmallow |
| Database | SQLite locally, PostgreSQL in production |
| Payments | M-Pesa Daraja, with a simulation fallback |

No map API key exists anywhere in this project. Nominatim requires a `User-Agent` that identifies the application and allows one request per second, neither of which a browser can honour, so every geocoding and routing call goes through `/api/geo/*` on the server where it can be throttled and cached.

## Setting it up

You need Node 18 or newer, Python 3.11 or newer, and pipenv.

**The database is not in this repository and never will be.** `.gitignore` blocks `*.db` and `*.sqlite`. You build your own from the migrations and fill it with `seed.py`. Everyone has their own private copy — if you delete an order on your machine, nothing changes on anyone else's.

`.env` is not in the repository either. You copy `.env.example` and fill it in.

### 1. The API

```bash
cd server
pipenv install --dev
cp .env.example .env
```

Open `server/.env` and fill in the two required keys. Any long random string works and it does not have to match anyone else's:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

```
SECRET_KEY=<paste the first one>
JWT_SECRET_KEY=<paste the second one>
```

Then build the database and start:

```bash
pipenv run upgrade
pipenv run seed
pipenv run test
pipenv run start
```

`upgrade` creates the tables from the migrations. `seed` fills them. `test` must report 82 passed. The API serves on http://localhost:5555.

`upgrade`, `seed` and `pipenv install` are only needed the first time, and again whenever someone commits a new migration.

### 2. The app

Second terminal:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The app opens on http://localhost:5173. Both terminals must be running at once.

**Vite only reads `.env` at startup.** Edit it and you must restart `npm run dev`.

## Signing in

`pipenv run seed` prints working credentials:

```
admin@deliveroo.co.ke / admin1234
peter@deliveroo.co.ke / courier1234
amina@deliveroo.co.ke / customer1234
```

Riders sign in with a company address because rider accounts are issued by operations on approval of an application, not self-registered. Customers sign up themselves. Admin accounts can never be created through `/register`.

## Environment

`server/.env` — only two keys are required:

| Key | Required | Default if unset |
| --- | --- | --- |
| `SECRET_KEY` | yes | — |
| `JWT_SECRET_KEY` | yes | — |
| `DATABASE_URL` | no | local SQLite file |
| `CLIENT_ORIGIN` | no | localhost:5173 |
| `MAIL_*` | no | mail is logged, not sent |
| `AT_*` | no | SMS is logged, not sent |
| `MPESA_*` | no | payments run in simulation |
| `NOMINATIM_URL`, `OSRM_URL` | no | the public instances |
| `BASE_RATE_KES`, `PRICE_PER_KM_KES` | no | 180 and 42 |

**Never leave a key present with nothing after the `=`.** `MAIL_PORT=` is not the same as leaving the line out. Python reads it as an empty string rather than falling back to the default, and the failure surfaces somewhere unrelated — a blank `JWT_SECRET_KEY` produces 60 test errors that all point at the login route. Comment the line out or fill it in.

`client/.env`:

```
VITE_API_BASE_URL=http://localhost:5555/api
```

Never commit `.env`. It is gitignored, and it stays that way.

## What it does

**Customers** book a parcel by choosing a route and a weight band, see the price broken down before committing, track the parcel live on a map, change the destination while the order is still pending, cancel any time before delivery, and pay with M-Pesa.

**Riders** see only their own deliveries, go on and off duty, share their position, and move a parcel through picked up, in transit and delivered.

**Operations** see every order, assign riders, override status and location, manage accounts, review rider applications, and read a dashboard of daily volume and rider performance.

Screens that show a changing status re-fetch every 8 seconds, so a customer watching an order sees it update without touching anything.

Prices are always computed on the server from the routed distance. The API never accepts a distance or a price from the request body.

## Structure

```
client/
  src/
    api/          axios instance and one module per backend area
    app/          redux store
    features/     one slice per domain
    components/   layout, ui, orders, map
    pages/        one folder per role, plus the public pages
    routes/       route table and the auth and role guards
    hooks/        useAuth, useToast, useDebounce, useLivePoll, useLiveLocation
    utils/        constants, formatters, validators, media
server/
  app/
    models/       user, order, tracking_event, payment,
                  courier_application, password_reset
    resources/    auth, orders, couriers, admin, payments,
                  applications, geo
    schemas/      Marshmallow serialisation
    services/     pricing, maps, mpesa, notifications, mailer, sms, onboarding
    utils/        clock, decorators, errors, pagination
  migrations/     Alembic
  tests/          pytest
  seed.py
  wsgi.py
```

Pages never call axios directly. A page dispatches a thunk, the slice calls a module in `api/`, and the page reads the result with a selector.

## Working on it

Start from `development` every time:

```bash
git checkout development
git pull origin development
git checkout <yourname>-backend
git merge development
```

Every morning. Not the night before the deadline.

Commit, push, then open a pull request **into `development`**. Pushing your branch is not the same as delivering your work — nothing reaches the team until the PR is merged.

`npm run lint` runs with `--max-warnings 0`, so a warning is a failure. Run it before every pull request. `pipenv run test` must pass before you open one too.

**If you change a model, you commit a migration with it.** Run `pipenv run migrate`, check the generated file, and commit it. Without it everyone else's database is missing your column and their app breaks with an error that says nothing about you.

**Every `pipenv` command runs from inside `server/`.** Run one from the repository root and pipenv creates a blank environment there instead of using ours.

## Branches

| Branch | Purpose |
| --- | --- |
| `main` | Deployment only. Nothing lands here until the final release. |
| `development` | Integration branch. All pull requests go here. |
| `testing` | Pull from here to test the combined work. |
| `<name>-frontend` | Your frontend working branch. |
| `<name>-backend` | Your backend working branch. |

## Conventions

1. Tailwind only. No component CSS files. The only stylesheet is `src/styles/tailwind.css`.
2. Colours and fonts come from `tailwind.config.js`. Never a raw hex in a component.
3. Primary buttons are dark text on yellow — `bg-brand-400 text-brand-950`.
4. Every page works at 390, 768, 1024 and 1440 pixels.
5. Every list has an empty state. Every form field has an error state.
6. Every endpoint validates with Marshmallow before it touches the database.
7. Every endpoint that returns a list is paginated.
8. Ownership is checked on the server, not hidden in the UI. A courier fetching another courier's delivery gets a 403.
9. `pipenv` and the `Pipfile`. No `requirements.txt`, no global installs.
10. Small commits.

## When something breaks

**`RuntimeError: JWT_SECRET_KEY or flask SECRET_KEY must be set`** — one of them is blank in your `.env`. Fill both.

**`ValueError: invalid literal for int()`** — a numeric key such as `MAIL_PORT` is present but empty. Comment it out or give it a value.

**`ModuleNotFoundError` after a merge** — someone's merge overwrote a shared file with an older copy. Check `app/config.py`, `app/constants.py` and `app/extensions.py` exist before blaming anything else.

**"Cannot reach the server. Is the API running?"** — terminal 1 is not running. `cd server && pipenv run start`.

**Changes to `.env` do nothing** — restart the dev server. Vite reads it once, at startup.

**Port 5555 already in use** — the API is already running in another terminal. On macOS, AirPlay Receiver holds 5000, which is why the API sits on 5555.

**A blank page after pulling** — `npm install`, then `rm -rf node_modules/.vite`, then start again.

**A local database that has gone strange** — delete `server/deliveroo.db`, then `pipenv run upgrade` and `pipenv run seed`. Ten seconds, and it fixes almost everything.

**`GET /` returns 404** — correct. This is a JSON API with no homepage. `GET /api/health` is the only route that works without a token.
