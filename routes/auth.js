const express = require('express');
const { register, login, logout, me, passport, googleCallback } = require('../controllers/authController');
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

module.exports = router;
