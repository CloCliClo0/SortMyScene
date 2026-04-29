require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

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

// Serve React build in production hosting environments (e.g. Hostinger Node.js).
const webDistPath = path.join(__dirname, 'web', 'dist');
app.use(express.static(webDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  return res.sendFile(path.join(webDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SortMyScene listening on http://localhost:${PORT}`);
});
