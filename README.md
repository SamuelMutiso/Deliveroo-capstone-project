# Deliveroo — how to run it

You do not need PostgreSQL. You build your own database in the commands below.

If `pipenv --version` fails, run `pip3 install --user pipenv` first, then open a new terminal.

## Backend — terminal 1

```bash
git checkout development
git pull origin development

cd server
pipenv install --dev
cp .env.example .env
```

Open `server/.env`. Paste a long random string after each of these two, and change nothing else:

```
SECRET_KEY=
JWT_SECRET_KEY=
```

Get the strings from `python3 -c "import secrets; print(secrets.token_hex(32))"`. Never leave a key blank.

```bash
pipenv run upgrade
pipenv run seed
pipenv run test
pipenv run start
```

`test` must say **82 passed**. The API runs on http://localhost:5555. Leave this terminal open.

## Frontend — terminal 2

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173.

## Logins

```
admin@deliveroo.co.ke     admin1234
peter@deliveroo.co.ke     courier1234
amina@deliveroo.co.ke     customer1234
```

## Every day after this

```bash
git pull origin development
cd server && pipenv run upgrade && pipenv run start
```

New terminal:

```bash
cd client && npm install && npm run dev
```

## Rules

1. Run every `pipenv` command from inside `server/`, never from the project root.
2. Never leave a key in `.env` with nothing after the `=`. Comment it out or fill it.
3. Never commit `.env`.

## If it breaks

| Error | Fix |
| --- | --- |
| `JWT_SECRET_KEY ... must be set` | A key in `.env` is blank. Fill it. |
| `invalid literal for int()` | A key in `.env` is blank. Put `#` in front of it. |
| `No module named 'flask'` | You are in the project root. `cd server`. |
| `Address already in use` | `lsof -ti:5555 \| xargs kill` |
| Login fails | You skipped `pipenv run seed`. |
| Database acting up | `rm server/deliveroo.db`, then `upgrade` and `seed` again. |
| Blank white page | `rm -rf client/node_modules/.vite`, then `npm run dev`. |
| `GET /` gives 404 | Normal. It is an API. Use `/api/health`. |
