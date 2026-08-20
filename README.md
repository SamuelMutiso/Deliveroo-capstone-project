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

Frontend is complete and runs against a mock API committed in `client/`. The Flask backend starts in Week 2 — when it lands, `client/server.js` and `client/db.json` are deleted and `.env` points at Flask. No React code changes, because the mock serves the same routes and the same JSON shapes the real API will.

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

You need Node 18 or newer. **Two terminals, both inside `client/`.**

Terminal 1 — the API:

```bash
cd client
node server.js
```

Terminal 2 — the app:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The app opens on http://localhost:5173 and the API runs on http://localhost:3001.

`npm install` and `cp .env.example .env` are only needed the first time.

**Vite only reads `.env` at startup.** Edit it and you must restart `npm run dev`.

## Signing in

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@deliveroo.co.ke | admin1234 |
| Rider | samuel@deliveroo.co.ke | courier1234 |
| Customer | amina.wanjiru@gmail.com | customer1234 |

Riders sign in with a company address because rider accounts are issued by operations, not self-registered. Customers sign up themselves.

## What it does

**Customers** book a parcel by choosing a route and a weight band, see the price broken down before committing, track the parcel live, change the destination while it is still pending, cancel, and pay with M-Pesa.

**Riders** see only their own deliveries, go on and off duty, share their position, and move a parcel through picked up, in transit and delivered.

**Operations** see every order, assign riders, override status and location, manage accounts, review rider applications, and read a dashboard of daily volume and rider performance.

Screens that show a changing status re-fetch every 8 seconds, so a customer watching an order sees it update without touching anything.

## Environment

`client/.env`:

```
VITE_API_BASE_URL=http://localhost:3001
VITE_GOOGLE_MAPS_API_KEY=
```

The Maps key is optional. Without it the app falls back to a Nairobi landmark picker and a schematic map, so every screen still works.

Never commit `.env`. It is gitignored, and it stays that way.

## Structure

```
client/
  server.js       mock API — deleted when Flask lands
  db.json         mock data — deleted when Flask lands
  src/
    api/          axios instance and one module per backend area
    app/          redux store
    features/     one slice per domain
    components/   layout, ui, orders, map
    pages/        one folder per role, plus the public pages
    routes/       route table and the auth and role guards
    hooks/        useAuth, useToast, useDebounce, useLivePoll, useLiveLocation
    utils/        constants, formatters, validators, media
server/           Flask API — Week 2
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

**"Cannot reach the server. Is the API running?"** — Terminal 1 is not running. `cd client && node server.js`.

**Changes to `.env` do nothing** — restart the dev server.

**Port 3001 already in use** — the API is already running in another terminal.

**A blank page after pulling** — run `npm install`, then `rm -rf node_modules/.vite` and start again.