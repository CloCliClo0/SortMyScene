const express = require('express');
const {
  register,
  login,
  logout,
  me,
  getProvidersStatus,
  connectGoogle,
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

// Google OAuth2 — implémentation manuelle (pas de passport.authenticate, pas de session)
router.get('/google', connectGoogle);
router.get('/google/callback', googleCallback);

// Spotify OAuth2 (liaison de compte)
router.get('/spotify', requireAuth, connectSpotify);
router.get('/spotify/connect', requireAuth, connectSpotify);
router.get('/spotify/callback', spotifyCallback);

// YouTube OAuth2 (liaison de compte pour sources YouTube Music)
router.get('/youtube', requireAuth, connectYouTube);
router.get('/youtube/connect', requireAuth, connectYouTube);
router.get('/youtube/callback', youtubeCallback);

// Deezer OAuth2 (liaison de compte)
router.get('/deezer', requireAuth, connectDeezer);
router.get('/deezer/connect', requireAuth, connectDeezer);
router.get('/deezer/callback', deezerCallback);

module.exports = router;
