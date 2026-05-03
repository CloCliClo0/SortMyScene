require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');

const authRoutes = require('./routes/auth');
const scenesRoutes = require('./routes/scenes');
const tokensRoutes = require('./routes/tokens');
const usersRoutes = require('./routes/users');
const tracksRoutes = require('./routes/tracks');
const { passport } = require('./controllers/authController');
const sequelize = require('./lib/sequelize');
const { withDbTimeout } = require('./lib/dbGuard');

const app = express();
const PORT = process.env.PORT || 3000;

function maskDatabaseUrl(databaseUrl) {
  if (!databaseUrl) return 'undefined';
  try {
    const url = new URL(databaseUrl);
    return `${url.protocol}//${url.username.replace(/./g, '*')}@${url.hostname}:${url.port || '<default>'}/${url.pathname.slice(1)}`;
  } catch (error) {
    return 'invalid DATABASE_URL';
  }
}

function logStartupInfo() {
  console.log('[server] Starting SortMyScene');
  console.log('[server] NODE_ENV=', process.env.NODE_ENV || 'development');
  console.log('[server] PORT=', PORT);
  console.log('[server] DATABASE_URL=', maskDatabaseUrl(process.env.DATABASE_URL));
}

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

app.all('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.all('/api/health/db', async (_req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ status: 'degraded', database: 'down', error: 'DATABASE_URL not configured', code: 'NO_DATABASE_URL' });
  }
  try {
    await withDbTimeout(sequelize.query('SELECT 1'), 'health db ping');
    return res.json({ status: 'ok', database: 'up' });
  } catch (error) {
    return res.status(503).json({ status: 'degraded', database: 'down', error: error.message, code: error.code || 'UNKNOWN' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/scenes', scenesRoutes);
app.use('/api/tracks', tracksRoutes);
app.use('/api/tokens', tokensRoutes);

// Serve frontend from React production build.
const frontendRoot = path.join(__dirname, 'web', 'dist');
const frontendReady = fs.existsSync(path.join(frontendRoot, 'index.html'));

if (frontendReady) {
  app.use(express.static(frontendRoot));
}

app.use('/api', (_req, res) => {
  return res.status(404).json({ message: 'API route not found' });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  if (!frontendReady) {
    return res.status(500).send('Frontend build not found. Expected index.html in web/dist. Run npm run build:web.');
  }

  return res.sendFile(path.join(frontendRoot, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  return res.status(500).json({ message: 'Internal server error' });
});

async function startServer() {
  logStartupInfo();

  if (process.env.DATABASE_URL) {
    try {
      await sequelize.authenticate();
      console.log('[server] Database connected successfully');
    } catch (error) {
      console.error('[server] Database connection failed:', error.message);
      console.error(error);
    }
  }

  app.listen(PORT, () => {
    console.log(`SortMyScene listening on http://localhost:${PORT}`);
  });
}

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[server] Uncaught Exception:', error);
});

startServer();
