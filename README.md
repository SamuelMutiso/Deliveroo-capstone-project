# Deliveroo

Full-stack parcel delivery management platform.

## Getting the project on your machine

You are a collaborator on this repository, so clone it. Do not fork it.

```bash
git clone https://github.com/<owner>/deliveroo.git
cd deliveroo
```

## Install

Frontend:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Backend:

```bash
cd server
pipenv install --dev
cp .env.example .env
```

## Working on your branch

Start from `development` every time:

```bash
git checkout development
git pull origin development
```

Switch to your own branch and bring it up to date:

```bash
git checkout <yourname>-frontend
git merge development
```

Commit and push:

```bash
git add .
git commit -m "short description of what you did"
git push -u origin <yourname>-frontend
```

The `-u` is only needed the first time you push a branch. After that, `git push`.

When your work is ready, open a pull request from your branch into `development` on GitHub.

## Branches

| Branch | Purpose |
| --- | --- |
| `main` | Deployment only. Never push to it. |
| `development` | Integration branch. All pull requests go here. |
| `testing` | Pull from here to test the combined work. |
| `<name>-frontend` | Your frontend working branch. |
| `<name>-backend` | Your backend working branch. |

Never commit a `.env` file.
