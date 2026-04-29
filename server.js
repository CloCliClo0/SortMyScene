require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const scenesRoutes = require('./routes/scenes');
const tokensRoutes = require('./routes/tokens');
const { passport } = require('./controllers/authController');

const app = express();
const PORT = process.env.PORT || 3000;

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

app.use('/api/auth', authRoutes);
app.use('/api/scenes', scenesRoutes);
app.use('/api/tokens', tokensRoutes);

// Serve frontend from React production build.
const frontendRoot = path.join(__dirname, 'web', 'dist');
const frontendReady = fs.existsSync(path.join(frontendRoot, 'index.html'));

if (frontendReady) {
  app.use(express.static(frontendRoot));
}

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  if (!frontendReady) {
    return res.status(500).send('Frontend build not found. Expected index.html in web/dist. Run npm run build:web.');
  }

  return res.sendFile(path.join(frontendRoot, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SortMyScene listening on http://localhost:${PORT}`);
});
