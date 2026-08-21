# Deliveroo

A parcel delivery management platform for Nairobi. Customers book and track parcels, riders run their deliveries, and operations assign couriers and watch the network.

Moringa School Module 6 capstone — CodeMaestros.

## Team

| Name | Area |
| --- | --- |
| Samuel Mutiso |· API layer and Redux store |
| David | Component library and shared hooks |
| Alexander | Auth, profile and the admin area |
| Michelle | Layout shell, public site and rider screens |
| James | The customer application |

## Status

Frontend is complete and was presented against a temporary mock API, which has now been removed. The Flask backend is in progress. No React code changed during the switch — the mock served the same routes and the same JSON shapes the real API does, so removing it was pure deletion.

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
| Maps | @react-google-maps/api |
| Dates | date-fns |
| Backend (Week 2) | Flask, SQLAlchemy, PostgreSQL |

## Running it

You need Node 18 or newer and Python 3.11 or newer. **Two terminals.**

Terminal 1 — the API:

```bash
cd server
pipenv install --dev
cp .env.example .env
pipenv run upgrade
pipenv run seed
pipenv run start
```

Terminal 2 — the app:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The app opens on http://localhost:5173 and the API on http://localhost:5555.

The install, migrate and seed steps are only needed the first time.

**Vite only reads `.env` at startup.** Edit it and you must restart `npm run dev`.

## Signing in

Accounts come from the database seed. Run `pipenv run seed` and use the credentials it prints.

Riders sign in with a company address because rider accounts are issued by operations, not self-registered. Customers sign up themselves.

## What it does

**Customers** book a parcel by choosing a route and a weight band, see the price broken down before committing, track the parcel live, change the destination while it is still pending, cancel, and pay with M-Pesa.

**Riders** see only their own deliveries, go on and off duty, share their position, and move a parcel through picked up, in transit and delivered.

**Operations** see every order, assign riders, override status and location, manage accounts, review rider applications, and read a dashboard of daily volume and rider performance.

Screens that show a changing status re-fetch every 8 seconds, so a customer watching an order sees it update without touching anything.

## Environment

`client/.env`:

```
VITE_API_BASE_URL=http://localhost:5555/api
VITE_GOOGLE_MAPS_API_KEY=
```

The Maps key is optional. Without it the app falls back to a Nairobi landmark picker and a schematic map, so every screen still works.

Never commit `.env`. It is gitignored, and it stays that way.

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
    models/       SQLAlchemy models
    resources/    route handlers by area
    schemas/      Marshmallow serialisation
    services/     pricing, maps, m-pesa, notifications
    utils/        decorators, pagination, errors
  migrations/     Alembic
  seed.py
```

Pages never call axios directly. A page dispatches a thunk, the slice calls a module in `api/`, and the page reads the result with a selector.

## Working on it

Start from `development` every time:

```bash
git checkout development
git pull origin development
git checkout <yourname>-frontend
git merge development
```

Commit, push, then open a pull request **into `development`**. Pushing your branch is not the same as delivering your work — nothing reaches the team until the PR is merged.

`npm run lint` runs with `--max-warnings 0`, so a warning is a failure. Run it before every pull request.

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
6. Small commits.

## When something breaks

**"Cannot reach the server. Is the API running?"** — Terminal 1 is not running. `cd server && pipenv run start`.

**Changes to `.env` do nothing** — restart the dev server.

**Port 5555 already in use** — the API is already running in another terminal. On macOS, AirPlay Receiver also uses 5000, which is why the API sits on 5555.

**A blank page after pulling** — run `npm install`, then `rm -rf node_modules/.vite` and start again.