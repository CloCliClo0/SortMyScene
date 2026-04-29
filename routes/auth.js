const express = require('express');
const {
  register,
  login,
  logout,
  me,
  passport,
  googleCallback,
  connectSpotify,
  spotifyCallback,
  connectDeezer,
  deezerCallback,
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

// Google OAuth2
router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=google_failed', session: false }),
  googleCallback
);

// Spotify OAuth2 (account linking)
router.get('/spotify', requireAuth, connectSpotify);
router.get('/spotify/callback', spotifyCallback);

// Deezer OAuth2 (account linking)
router.get('/deezer', requireAuth, connectDeezer);
router.get('/deezer/callback', deezerCallback);

module.exports = router;
