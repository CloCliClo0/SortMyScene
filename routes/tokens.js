const express = require('express');
const { getTokenByProvider } = require('../controllers/tokensController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:provider', requireAuth, getTokenByProvider);

module.exports = router;
