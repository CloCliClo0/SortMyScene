const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { withDbTimeout, sendDbError } = require('../lib/dbGuard');

const TOKEN_COOKIE = 'auth_token';
const OAUTH_STATE_TTL = '10m';

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

function getAppOrigin() {
  return process.env.APP_ORIGIN || 'http://localhost:5173';
}

function buildOAuthState(userId, provider) {
  const secret = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
  return jwt.sign(
    {
      provider,
      purpose: 'oauth-link',
    },
    secret,
    {
      subject: String(userId),
      expiresIn: OAUTH_STATE_TTL,
    }
  );
}

function verifyOAuthState(stateToken, expectedProvider) {
  const secret = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
  const payload = jwt.verify(stateToken, secret);

  if (!payload || payload.provider !== expectedProvider || payload.purpose !== 'oauth-link') {
    throw new Error('Invalid OAuth state');
  }

  const userId = Number(payload.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('Invalid OAuth state subject');
  }

  return userId;
}

async function saveOAuthToken({ userId, provider, accessToken, refreshToken, expiresIn }) {
  await withDbTimeout(prisma.oAuthToken.upsert({
    where: {
      user_id_provider: {
        user_id: userId,
        provider,
      },
    },
    update: {
      access_token: accessToken,
      refresh_token: refreshToken || null,
      expires_in: Number.isFinite(Number(expiresIn)) ? Number(expiresIn) : null,
    },
    create: {
      user_id: userId,
      provider,
      access_token: accessToken,
      refresh_token: refreshToken || null,
      expires_in: Number.isFinite(Number(expiresIn)) ? Number(expiresIn) : null,
    },
  }), 'oauth token upsert');
}

async function register(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password || password.length < 6) {
      return res.status(400).json({ message: 'Email and password (min 6 chars) are required' });
    }

    const existing = await withDbTimeout(
      prisma.user.findUnique({ where: { email: normalizedEmail } }),
      'register find user'
    );
    if (existing) {
      return res.status(409).json({ message: 'Email already used' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await withDbTimeout(prisma.user.create({
      data: {
        email: normalizedEmail,
        password_hash: hashedPassword,
      },
    }), 'register create user');

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    return sendDbError(res, error, 'Failed to register');
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await withDbTimeout(
      prisma.user.findUnique({ where: { email: normalizedEmail } }),
      'login find user'
    );

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
    return sendDbError(res, error, 'Failed to login');
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
    const user = await withDbTimeout(prisma.user.findUnique({
      where: { id: Number(req.user.id) },
      select: { id: true, email: true },
    }), 'get profile');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    return sendDbError(res, error, 'Failed to get profile');
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

        let user = await withDbTimeout(
          prisma.user.findUnique({ where: { email: String(email).toLowerCase() } }),
          'google find user'
        );
        if (!user) {
          user = await withDbTimeout(
            prisma.user.create({ data: { email: String(email).toLowerCase() } }),
            'google create user'
          );
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
    const appOrigin = getAppOrigin();
    return res.redirect(`${appOrigin}/?googleAuth=success`);
  } catch (err) {
    const appOrigin = getAppOrigin();
    return res.redirect(`${appOrigin}/login?error=google_failed`);
  }
}

function getProvidersStatus(_req, res) {
  const spotifyEnabled = Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
  const deezerEnabled = Boolean(process.env.DEEZER_APP_ID && process.env.DEEZER_APP_SECRET);

  return res.json({
    spotify: { enabled: spotifyEnabled },
    deezer: { enabled: deezerEnabled },
  });
}

function connectSpotify(req, res) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const callbackUrl = process.env.SPOTIFY_CALLBACK_URL || `${getAppOrigin()}/api/auth/spotify/callback`;

  if (!clientId) {
    return res.status(500).json({ message: 'SPOTIFY_CLIENT_ID is not configured' });
  }

  const state = buildOAuthState(req.user.id, 'spotify');
  const scope = [
    'user-read-email',
    'user-read-private',
    'playlist-read-private',
    'playlist-read-collaborative',
  ].join(' ');

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('show_dialog', 'true');

  return res.redirect(authUrl.toString());
}

async function spotifyCallback(req, res) {
  const appOrigin = getAppOrigin();
  try {
    const code = req.query.code;
    const state = req.query.state;

    if (!code || !state) {
      return res.redirect(`${appOrigin}/settings?spotifyAuth=error`);
    }

    const userId = verifyOAuthState(state, 'spotify');
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const callbackUrl = process.env.SPOTIFY_CALLBACK_URL || `${getAppOrigin()}/api/auth/spotify/callback`;

    if (!clientId || !clientSecret) {
      return res.redirect(`${appOrigin}/settings?spotifyAuth=error`);
    }

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Spotify token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();

    await saveOAuthToken({
      userId,
      provider: 'spotify',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
    });

    return res.redirect(`${appOrigin}/settings?spotifyAuth=success`);
  } catch (_error) {
    return res.redirect(`${appOrigin}/settings?spotifyAuth=error`);
  }
}

function connectDeezer(req, res) {
  const appId = process.env.DEEZER_APP_ID;
  const callbackUrl = process.env.DEEZER_CALLBACK_URL || `${getAppOrigin()}/api/auth/deezer/callback`;

  if (!appId) {
    return res.status(500).json({ message: 'DEEZER_APP_ID is not configured' });
  }

  const state = buildOAuthState(req.user.id, 'deezer');
  const authUrl = new URL('https://connect.deezer.com/oauth/auth.php');
  authUrl.searchParams.set('app_id', appId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('perms', 'basic_access,email,manage_library,offline_access');
  authUrl.searchParams.set('state', state);

  return res.redirect(authUrl.toString());
}

async function deezerCallback(req, res) {
  const appOrigin = getAppOrigin();
  try {
    const code = req.query.code;
    const state = req.query.state;

    if (!code || !state) {
      return res.redirect(`${appOrigin}/settings?deezerAuth=error`);
    }

    const userId = verifyOAuthState(state, 'deezer');
    const appId = process.env.DEEZER_APP_ID;
    const appSecret = process.env.DEEZER_APP_SECRET;
    const callbackUrl = process.env.DEEZER_CALLBACK_URL || `${getAppOrigin()}/api/auth/deezer/callback`;

    if (!appId || !appSecret) {
      return res.redirect(`${appOrigin}/settings?deezerAuth=error`);
    }

    const tokenUrl = new URL('https://connect.deezer.com/oauth/access_token.php');
    tokenUrl.searchParams.set('app_id', appId);
    tokenUrl.searchParams.set('secret', appSecret);
    tokenUrl.searchParams.set('code', String(code));
    tokenUrl.searchParams.set('output', 'json');
    tokenUrl.searchParams.set('redirect_uri', callbackUrl);

    const tokenResponse = await fetch(tokenUrl.toString());
    if (!tokenResponse.ok) {
      throw new Error(`Deezer token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Missing Deezer access token');
    }

    await saveOAuthToken({
      userId,
      provider: 'deezer',
      accessToken: tokenData.access_token,
      refreshToken: null,
      expiresIn: tokenData.expires,
    });

    return res.redirect(`${appOrigin}/settings?deezerAuth=success`);
  } catch (_error) {
    return res.redirect(`${appOrigin}/settings?deezerAuth=error`);
  }
}

module.exports = {
  register,
  login,
  logout,
  me,
  getProvidersStatus,
  passport,
  googleCallback,
  connectSpotify,
  spotifyCallback,
  connectDeezer,
  deezerCallback,
};
