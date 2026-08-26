# Deliveroo — how to run it

Follow these steps in order. Do not skip any.

You do **not** need PostgreSQL. You do **not** need a database file from anyone. You build your own database on your own machine in step 6, and it takes about ten seconds.

---

## Before you start

Check you have these. Run each line and make sure you get a version number back.

```bash
node -v
python3 --version
git --version
```

You need Node 18 or newer and Python 3.11 or newer.

Now check for pipenv:

```bash
pipenv --version
```

If that says "command not found", install it:

```bash
pip3 install --user pipenv
```

Close the terminal, open a new one, and run `pipenv --version` again. If it still says not found, on macOS run:

```bash
python3 -m pip install --user pipenv
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## PART ONE — the backend

### Step 1. Get the latest code

```bash
git checkout development
git pull origin development
```

### Step 2. Go into the server folder

```bash
cd server
```

**Stay in this folder for steps 2 to 8.** Every `pipenv` command must be run from inside `server/`. If you run one from the project root it will silently create an empty environment and nothing will work.

### Step 3. Install the Python packages

```bash
pipenv install --dev
```

This reads `Pipfile` and installs Flask, SQLAlchemy and everything else. It takes a minute or two the first time.

### Step 4. Create your .env file

```bash
cp .env.example .env
```

### Step 5. Put two secret keys in it

Run this twice and copy each result:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Open `server/.env` and paste one long string after each `=`:

```
SECRET_KEY=paste_the_first_one_here
JWT_SECRET_KEY=paste_the_second_one_here
```

Save the file.

**Do not change anything else in `.env`.** Everything else in there is commented out on purpose and already has a working default.

**Never leave a key with nothing after the `=`.** `SECRET_KEY=` on its own is worse than deleting the line — the app will crash with an error that points somewhere completely unrelated.

### Step 6. Build your database

```bash
pipenv run upgrade
```

This creates all the tables. You should see six lines starting with `Running upgrade`, ending at `a1f6c3d94b28`.

### Step 7. Fill it with test data

```bash
pipenv run seed
```

You should see:

```
Seeded 121 orders
  users 26  couriers 15  customers 10
  events 316
```

### Step 8. Check everything works

```bash
pipenv run test
```

It must say **82 passed**. If it does not, stop and read the "If something goes wrong" section at the bottom before doing anything else.

### Step 9. Start the API

```bash
pipenv run start
```

You should see `Running on http://127.0.0.1:5555`.

**Leave this terminal open and running.** Do not close it. Do not type anything else in it.

To check it is alive, open this in your browser:

```
http://localhost:5555/api/health
```

Opening `http://localhost:5555` on its own gives a 404. That is normal and correct — this is an API, it has no homepage.

---

## PART TWO — the frontend

**Open a second terminal.** The backend must keep running in the first one.

### Step 10. Go into the client folder

```bash
cd client
```

From the project root. If you are still inside `server/`, run `cd ../client`.

### Step 11. Install

```bash
npm install
```

Warnings about vulnerabilities are normal. **Do not run `npm audit fix --force`.** It will break the build.

### Step 12. Create the client .env

```bash
cp .env.example .env
```

You do not need to edit this one.

### Step 13. Start it

```bash
npm run dev
```

You should see `Local: http://localhost:5173/`. Open that in your browser.

---

## Logging in

These accounts come from step 7:

```
Admin     admin@deliveroo.co.ke     admin1234
Courier   peter@deliveroo.co.ke     courier1234
Customer  amina@deliveroo.co.ke     customer1234
```

---

## Every day after this

You only do steps 3 to 7 once. After that, to start work:

```bash
git checkout development
git pull origin development
```

Terminal 1:

```bash
cd server
pipenv run start
```

Terminal 2:

```bash
cd client
npm run dev
```

**After any `git pull`, run these two:**

```bash
cd server && pipenv run upgrade
cd client && npm install
```

`upgrade` catches your database up if someone added a migration. `npm install` catches you up if someone added a package. Skipping them is the most common reason the app suddenly breaks after a pull.

---

## If something goes wrong

**`RuntimeError: JWT_SECRET_KEY or flask SECRET_KEY must be set`**
One of them is blank in `server/.env`. Go back to step 5.

**`ValueError: invalid literal for int() with base 10: ''`**
A key in `.env` is present but empty. Put a `#` in front of that line or give it a value.

**`pipenv: command not found`**
Go back to "Before you start".

**`ModuleNotFoundError: No module named 'flask'`**
You ran the command from the project root instead of from inside `server/`. `cd server` and try again.

**`Address already in use` on port 5555**
The API is already running in another terminal. Find it, or run `lsof -ti:5555 | xargs kill`.

**"Cannot reach the server. Is the API running?"**
Terminal 1 stopped. Start it again with `pipenv run start`.

**Login fails with correct details**
You skipped `pipenv run seed`, or your database is empty. Run step 7.

**The database is behaving strangely**
Delete it and rebuild:

```bash
cd server
rm deliveroo.db
pipenv run upgrade
pipenv run seed
```

**A blank white page in the browser**

```bash
cd client
rm -rf node_modules/.vite
npm run dev
```

**Editing `.env` changed nothing**
Restart the terminal it belongs to. Both servers read `.env` only once, at startup.

---

## Two rules that stop most problems

1. Every `pipenv` command runs from inside `server/`. Never from the project root.
2. Never commit `.env`. It is gitignored. Keep it that way.
