# SortMyScene

SortMyScene is a web app that helps you design musical moods, save your scene ideas, and connect your favorite music platforms to build richer selections.

## What the app does

- Create personalized scenes with a name, a mood description, and seed tracks.
- Organize and keep your own scene library over time.
- Connect Spotify and YouTube accounts to prepare music-based workflows.
- Manage your account with secure authentication (email/password and Google sign-in).

## Core experience

1. Sign up or log in.
2. Create a scene and describe the vibe you want.
3. Add reference tracks to shape the direction.
4. Review your saved scenes and iterate on them.
5. Link music providers from settings when needed.

## Main features

- Scene management: create and browse your scenes.
- Track model: store platform id, title, artist, artwork, and metadata.
- OAuth connections: Google, Spotify, and YouTube integration.
- Protected routes and JWT cookie authentication.
- Bilingual interface (FR/EN).

## Tech stack

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express
- Database: MySQL (Sequelize)
- Auth: JWT + Passport Google OAuth

## For contributors

Quick local run:

```bash
npm install
npm run dev
```

Build production assets:

```bash
npm run build
npm run start
```