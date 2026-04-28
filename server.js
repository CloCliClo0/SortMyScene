require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');

const authRouter = require('./routes/auth');
const playlistsRouter = require('./routes/playlists');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'sortmyscene-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // set to true when serving over HTTPS
  })
);

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/auth', authRouter);
app.use('/api', playlistsRouter);

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`SortMyScene server running at http://localhost:${PORT}`);
});
