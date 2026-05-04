const express = require('express');
const {
  sendVerificationCodeEmail,
  verifyEmailCode,
  getVerificationStatus,
} = require('../controllers/verificationController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Envoie un email de vérification
router.post('/send-code', requireAuth, sendVerificationCodeEmail);

// Vérifie le code reçu par email
router.post('/verify-code', requireAuth, verifyEmailCode);

// Récupère le statut de vérification d'email
router.get('/status', requireAuth, getVerificationStatus);

module.exports = router;
