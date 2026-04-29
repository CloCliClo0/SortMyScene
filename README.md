# SortMyScene

## Deployment (Hostinger Node.js + Express)

This project is ready for Hostinger Node.js hosting with Express as API manager.

### 1) Required environment variables

- `PORT` (provided by host in many cases)
- `DATABASE_URL` (Hostinger MySQL):
	- `mysql://DB_USER:DB_PASSWORD@DB_HOST:3306/DB_NAME`
- `JWT_SECRET` (long random secret)
- `APP_ORIGIN` (example: `https://sortmyscene.fr`)
- `GOOGLE_CLIENT_ID` (if using Google auth)
- `GOOGLE_CLIENT_SECRET` (if using Google auth)
- `GOOGLE_CALLBACK_URL` (example: `https://sortmyscene.fr/api/auth/google/callback`)
- `SPOTIFY_CLIENT_ID` (if using Spotify linking)
- `SPOTIFY_CLIENT_SECRET` (if using Spotify linking)
- `SPOTIFY_CALLBACK_URL` (example: `https://sortmyscene.fr/api/auth/spotify/callback`)
- `DEEZER_APP_ID` (if using Deezer linking)
- `DEEZER_APP_SECRET` (if using Deezer linking)
- `DEEZER_CALLBACK_URL` (example: `https://sortmyscene.fr/api/auth/deezer/callback`)
- `NODE_ENV=production`

### 2) Hostinger commands

- Install command:
	- `npm install`
- Build command:
	- `npm run build`
- Start command:
	- `npm run start`

Important: keep `web/package.json` free of local file dependencies such as `"sortmyscene": "file:.."`, otherwise ZIP installs can recurse during deployment.

### 3) Prisma setup (first deploy)

Run once in terminal:

```bash
npx prisma migrate deploy
```

If this is a brand new production database, run migrations from your project root after setting `DATABASE_URL`.

### 4) Runtime behavior

- API routes remain under `/api/*`
- Frontend React app is served by Express from `web/dist`