const express = require('express');
const {
  register,
  login,
  logout,
  me,
  getProvidersStatus,
  passport,
  googleCallback,
  connectSpotify,
  spotifyCallback,
  connectYouTube,
  youtubeCallback,
  connectDeezer,
  deezerCallback,
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.get('/providers', getProvidersStatus);

// Google OAuth2
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/youtube.readonly'],
    accessType: 'offline',
    prompt: 'consent',
    session: false,
  })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=google_failed', session: false }),
  googleCallback
);

// Spotify OAuth2 (account linking)
router.get('/spotify', requireAuth, connectSpotify);
router.get('/spotify/connect', requireAuth, connectSpotify);
router.get('/spotify/callback', spotifyCallback);

// YouTube OAuth2 (account linking for YouTube Music sources)
router.get('/youtube', requireAuth, connectYouTube);
router.get('/youtube/connect', requireAuth, connectYouTube);
router.get('/youtube/callback', youtubeCallback);

// Deezer OAuth2 (account linking)
router.get('/deezer', requireAuth, connectDeezer);
router.get('/deezer/connect', requireAuth, connectDeezer);
router.get('/deezer/callback', deezerCallback);

module.exports = router;
