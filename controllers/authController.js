const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { QueryTypes } = require('sequelize');
const sequelize = require('../lib/sequelize');
const { withDbTimeout, sendDbError } = require('../lib/dbGuard');

const TOKEN_COOKIE = 'auth_token';
const OAUTH_STATE_TTL = '10m';

function signToken(user) {
  const secret = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
  return jwt.sign({ email: user.email, is_admin: Boolean(user.is_admin) }, secret, {
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

function getBackendOrigin() {
  if (process.env.SERVER_ORIGIN) {
    return process.env.SERVER_ORIGIN;
  }
  if (process.env.NODE_ENV === 'production') {
    return process.env.APP_ORIGIN || 'https://sortmyscene.fr';
  }
  return 'http://localhost:3000';
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
  await withDbTimeout(
    sequelize.query(
      `INSERT INTO \`OAuthToken\` (user_id, provider, access_token, refresh_token, expires_in)
       VALUES (:userId, :provider, :accessToken, :refreshToken, :expiresIn)
       ON DUPLICATE KEY UPDATE
         access_token = VALUES(access_token),
         refresh_token = VALUES(refresh_token),
         expires_in = VALUES(expires_in)`,
      {
        replacements: {
          userId,
          provider,
          accessToken,
          refreshToken: refreshToken || null,
          expiresIn: Number.isFinite(Number(expiresIn)) ? Number(expiresIn) : null,
        },
      }
    ),
    'oauth token upsert'
  );
}

async function register(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password || password.length < 6) {
      return res.status(400).json({ message: 'Email and password (min 6 chars) are required' });
    }

    const existing = await withDbTimeout(
      sequelize.query(
        'SELECT id FROM `User` WHERE email = :email LIMIT 1',
        {
          replacements: { email: normalizedEmail },
          type: QueryTypes.SELECT,
        }
      ),
      'register find user'
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already used' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Génère un code de vérification 6 caractères
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    const user = await withDbTimeout(
      sequelize.query(
        `INSERT INTO \`User\` (email, password_hash, email_verification_code, email_verification_expires, email_verified)
         VALUES (:email, :passwordHash, :code, :expires, FALSE)`,
        {
          replacements: {
            email: normalizedEmail,
            passwordHash: hashedPassword,
            code: verificationCode,
            expires: verificationExpires,
          },
        }
      ).then(([result]) => ({
        id: result.insertId,
        email: normalizedEmail,
        is_admin: false,
      })),
      'register create user'
    );

    // Envoie un email de vérification
    const { sendVerificationEmail } = require('../services/emailService');
    const emailResult = await sendVerificationEmail(normalizedEmail, verificationCode);

    if (!emailResult.success) {
      console.warn('[register] Failed to send verification email:', emailResult.error);
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      user: { id: user.id, email: user.email },
      message: 'Registration successful. Please check your email to verify your account.',
      emailVerificationRequired: true,
    });
  } catch (error) {
    return sendDbError(res, error, 'Failed to register');
  }
}

function generateVerificationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const rows = await withDbTimeout(
      sequelize.query(
        'SELECT id, email, password_hash, is_admin FROM `User` WHERE email = :email LIMIT 1',
        {
          replacements: { email: normalizedEmail },
          type: QueryTypes.SELECT,
        }
      ),
      'login find user'
    );

    const user = rows[0] || null;

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
    const rows = await withDbTimeout(
      sequelize.query(
        'SELECT id, email, is_admin, email_verified, theme, language FROM `User` WHERE id = :id LIMIT 1',
        {
          replacements: { id: Number(req.user.id) },
          type: QueryTypes.SELECT,
        }
      ),
      'get profile'
    );

    const user = rows[0] || null;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: { ...user, email_verified: Boolean(user.email_verified) } });
  } catch (error) {
    return sendDbError(res, error, 'Failed to get profile');
  }
}

// ─── Google OAuth2 — implémentation manuelle sans express-session ────────────
// passport-google-oauth20 nécessite express-session pour stocker le state CSRF.
// Sur Hostinger (sans session), on gère le state via un cookie httpOnly court-vivant.

const GOOGLE_STATE_COOKIE = 'google_oauth_state';

const passport = require('passport');

function connectGoogle(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL || `${getBackendOrigin()}/api/auth/google/callback`;

  if (!clientId) {
    return res.status(500).json({ message: 'GOOGLE_CLIENT_ID is not configured' });
  }

  // State CSRF : token aléatoire stocké dans un cookie httpOnly (valide 10 min)
  const state = crypto.randomBytes(20).toString('hex');
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
  });

  const scope = ['openid', 'email', 'profile'].join(' ');
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'select_account');
  authUrl.searchParams.set('state', state);

  return res.redirect(authUrl.toString());
}

async function googleCallback(req, res) {
  const appOrigin = getAppOrigin();
  try {
    const { code, state } = req.query;
    const storedState = req.cookies?.[GOOGLE_STATE_COOKIE];

    // Vérification CSRF
    if (!code || !state || !storedState || state !== storedState) {
      console.warn('[googleCallback] State mismatch or missing code/state');
      return res.redirect(`${appOrigin}/login?error=google_failed`);
    }

    // Efface le cookie state immédiatement
    res.clearCookie(GOOGLE_STATE_COOKIE, { httpOnly: true, sameSite: 'lax' });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl =
      process.env.GOOGLE_CALLBACK_URL || `${getBackendOrigin()}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return res.redirect(`${appOrigin}/login?error=google_failed`);
    }

    // Échange du code contre les tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: String(code),
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      console.error('[googleCallback] Token exchange failed:', tokenRes.status, body);
      throw new Error('Google token exchange failed');
    }

    const tokenData = await tokenRes.json();

    // Récupère les infos utilisateur
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) throw new Error('Failed to get Google user info');
    const userInfo = await userInfoRes.json();

    const email = userInfo.email;
    if (!email) throw new Error('No email returned by Google');

    const normalizedEmail = String(email).trim().toLowerCase();

    // Trouve ou crée l'utilisateur
    const rows = await withDbTimeout(
      sequelize.query(
        'SELECT id, email, is_admin FROM `User` WHERE email = :email LIMIT 1',
        { replacements: { email: normalizedEmail }, type: QueryTypes.SELECT }
      ),
      'google find user'
    );

    let user = rows[0] || null;
    if (!user) {
      user = await withDbTimeout(
        sequelize.query(
          'INSERT INTO `User` (email, email_verified) VALUES (:email, TRUE)',
          { replacements: { email: normalizedEmail } }
        ).then(([result]) => ({
          id: result.insertId,
          email: normalizedEmail,
          is_admin: false,
        })),
        'google create user'
      );
    }

    // Sauvegarde le token Google/YouTube si présent
    if (tokenData.access_token) {
      await saveOAuthToken({
        userId: user.id,
        provider: 'youtube',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        expiresIn: tokenData.expires_in || null,
      });
    }

    const jwtToken = signToken(user);
    setAuthCookie(res, jwtToken);

    return res.redirect(`${appOrigin}/login?googleAuth=success`);
  } catch (err) {
    console.error('[googleCallback] Error:', err.message);
    return res.redirect(`${appOrigin}/login?error=google_failed`);
  }
}

function getProvidersStatus(_req, res) {
  const spotifyEnabled = Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
  const deezerEnabled = Boolean(process.env.DEEZER_APP_ID && process.env.DEEZER_APP_SECRET);
  const youtubeEnabled = Boolean(
    (process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID) &&
      (process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET)
  );

  return res.json({
    spotify: { enabled: spotifyEnabled },
    deezer: { enabled: deezerEnabled },
    youtube: { enabled: youtubeEnabled },
  });
}

function getYouTubeClientConfig() {
  return {
    clientId: process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl:
      process.env.YOUTUBE_CALLBACK_URL || `${getBackendOrigin()}/api/auth/youtube/callback`,
  };
}

function connectSpotify(req, res) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const callbackUrl = process.env.SPOTIFY_CALLBACK_URL || `${getBackendOrigin()}/api/auth/spotify/callback`;

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

function connectYouTube(req, res) {
  const { clientId, callbackUrl } = getYouTubeClientConfig();

  if (!clientId) {
    return res.status(500).json({ message: 'YOUTUBE_CLIENT_ID is not configured' });
  }

  const state = buildOAuthState(req.user.id, 'youtube');
  const scope = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/youtube.readonly',
  ].join(' ');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('include_granted_scopes', 'true');
  authUrl.searchParams.set('state', state);

  return res.redirect(authUrl.toString());
}

async function youtubeCallback(req, res) {
  const appOrigin = getAppOrigin();

  try {
    const code = req.query.code;
    const state = req.query.state;

    if (!code || !state) {
      return res.redirect(`${appOrigin}/settings?youtubeAuth=error`);
    }

    const userId = verifyOAuthState(state, 'youtube');
    const { clientId, clientSecret, callbackUrl } = getYouTubeClientConfig();

    if (!clientId || !clientSecret) {
      return res.redirect(`${appOrigin}/settings?youtubeAuth=error`);
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: String(code),
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`YouTube token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();

    await saveOAuthToken({
      userId,
      provider: 'youtube',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
    });

    return res.redirect(`${appOrigin}/settings?youtubeAuth=success`);
  } catch (_error) {
    return res.redirect(`${appOrigin}/settings?youtubeAuth=error`);
  }
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
    const callbackUrl = process.env.SPOTIFY_CALLBACK_URL || `${getBackendOrigin()}/api/auth/spotify/callback`;

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
  const callbackUrl = process.env.DEEZER_CALLBACK_URL || `${getBackendOrigin()}/api/auth/deezer/callback`;

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
    const callbackUrl = process.env.DEEZER_CALLBACK_URL || `${getBackendOrigin()}/api/auth/deezer/callback`;

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
  connectGoogle,
  googleCallback,
  connectSpotify,
  spotifyCallback,
  connectYouTube,
  youtubeCallback,
  connectDeezer,
  deezerCallback,
};
