# Deliveroo

Parcel delivery management for Nairobi. A customer books a parcel and sees the price before
confirming, a rider carries it and writes each stage from the road, and an operations team
assigns riders and watches the network. Everything a customer is told is generated from the
same record the rider updated.

**Live app** — https://deliveroo-capstone-project.vercel.app
**API** — https://deliveroo-api-l7fs.onrender.com/api/health

Moringa School · Module 6 capstone · Samuel Mutiso, Alexander, David, James, Michelle

---

## What it does

**Customers** get a quote from the real road distance and a weight band before they commit,
follow the parcel through every stage, pay with M-Pesa, and receive a signed receipt they can
verify publicly.

**Riders** see only the deliveries assigned to them, advance each stage, share live position
while carrying a parcel, record who received it, and track their own earnings.

**Operations** assign riders, correct mistakes, confirm cash payments, review rider
applications, and watch daily volume and courier performance from a dashboard.

Anyone at all can price a route and track a parcel from the home page without an account.

---

## Stack

| Layer | Built with | Hosted on |
| --- | --- | --- |
| Client | React 18, Redux Toolkit, React Router, Vite, Tailwind CSS, Leaflet, Recharts | Vercel |
| API | Flask, SQLAlchemy, Alembic, Marshmallow, Flask-JWT-Extended, gunicorn | Render |
| Database | PostgreSQL — 7 models, 9 migrations | Render |
| Integrations | M-Pesa Daraja, Gmail API, OpenStreetMap (Nominatim + OSRM), Google Sign-In | — |

62 REST endpoints, 140 automated tests.

---

## MAPS USED

**OpenStreetMap instead of Google Maps.** A Google Maps key has to ship to the browser, where
anyone can lift it and spend it, and it needs a billing account behind it. OpenStreetMap gives
the same pickup and destination pins, live rider position, road route, distance and duration
with no key at all. Geocoding and routing are proxied through our own API, so the browser never
calls a third party directly and the results are cached and rate limited on our side.

**Gmail API instead of SMTP.** Our host blocks outbound ports 25, 465 and 587, so no SMTP
library can send mail from production. The Gmail API sends over HTTPS on 443, which is not
blocked, and it uses our own mailbox rather than a third-party sending account that can be
suspended.

**Cash payments need two people.** An M-Pesa prompt does not always reach a real phone. When it
fails a rider can take cash, but the rider only *reports* it — an administrator confirms it
separately before the order is settled. Nobody can close their own payment.

**Receipts are signed.** Every delivery receipt carries a keyed digest over the order id,
tracking code and delivery time. Anyone can check one at `/verify` without an account, and a
forged receipt fails the check.

**Public tracking reveals nothing personal.** Tracking a parcel by code returns the stage and
timestamps only — no address, no name, no phone number, no price. There is a test asserting
each of those fields is absent, so the endpoint cannot be widened by accident.

---

## Running it locally

You do not need PostgreSQL installed. The commands below build a local database for you.

If `pipenv --version` fails, run `pip3 install --user pipenv` first, then open a new terminal.

### Backend — terminal 1

```bash
cd server
pipenv install --dev
cp .env.example .env
```

Open `server/.env` and paste a long random string after each of these two. Change nothing else:

```
SECRET_KEY=
JWT_SECRET_KEY=
```

Generate them with `python3 -c "import secrets; print(secrets.token_hex(32))"`.
Never leave a key blank — an empty value is not the same as an absent one, and the app will
refuse to start.

```bash
pipenv run upgrade
pipenv run seed
pipenv run test
pipenv run start
```

`test` must say **140 passed**. The API runs on http://localhost:5555. Leave this terminal open.

### Frontend — terminal 2

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173.

### Seeded logins

```
admin@deliveroo.co.ke     admin1234
peter@deliveroo.co.ke     courier1234
amina@deliveroo.co.ke     customer1234
```

---

## Project layout

```
server/
  app/
    models/        7 SQLAlchemy models
    resources/     Flask blueprints, one per area
    schemas/       Marshmallow validation
    services/      pricing, maps, mpesa, mailer, notifications, receipts
    utils/         decorators, errors, logging, pagination
  migrations/      Alembic
  tests/           140 tests
client/
  src/
    api/           axios clients
    components/    ui, layout, orders, map, landing, courier, auth
    features/      Redux Toolkit slices
    pages/         routed screens by role
```

---

## Testing

```bash
cd server && pipenv run test
```

Covers role boundaries (a rider cannot open another rider's delivery), the payment state
machine including the cash confirmation path, every pricing band, notification fan-out, receipt
signing and verification, and the privacy limits of the public API.

The test config pins integration credentials to empty values, so the suite passes the same way
on every machine regardless of what an individual developer has in their own `.env`.

---

## Environment

Both apps ship a `.env.example`. Only two variables are required to run locally —
`SECRET_KEY` and `JWT_SECRET_KEY`. Everything else is optional and falls back to a working
default: without M-Pesa credentials payments run in simulation, without mail credentials email
is logged instead of sent, and without a Google client id the sign-in button hides itself.

`.env` is gitignored and must never be committed.

---

## Team

| | |
| --- | --- |
| Samuel Mutiso | Developer |
| Alexander | Developer |
| David | Developer |
| James | Developer |
| Michelle | Developer |

Branching: work happens on `development`, which deploys the API to Render. `main` deploys the
client to Vercel. Commits are small and single-purpose.
