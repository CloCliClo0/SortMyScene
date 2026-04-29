const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const TOKEN_COOKIE = 'auth_token';

function signToken(user) {
  const secret = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
  return jwt.sign({ email: user.email }, secret, {
    subject: String(user.id),
    expiresIn: '7d',
  });
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

async function register(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password || password.length < 6) {
      return res.status(400).json({ message: 'Email and password (min 6 chars) are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already used' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
      },
    });

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to register', error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password_hash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to login', error: error.message });
  }
}

function logout(_req, res) {
  res.clearCookie(TOKEN_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  return res.json({ success: true });
}

async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
}

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from Google'));

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({ data: { email } });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

function googleCallback(req, res) {
  try {
    const user = req.user;
    const token = signToken(user);
    setAuthCookie(res, token);
    const appOrigin = process.env.APP_ORIGIN || 'http://localhost:5173';
    return res.redirect(`${appOrigin}/?googleAuth=success`);
  } catch (err) {
    const appOrigin = process.env.APP_ORIGIN || 'http://localhost:5173';
    return res.redirect(`${appOrigin}/login?error=google_failed`);
  }
}

module.exports = {
  register,
  login,
  logout,
  me,
  passport,
  googleCallback,
};
