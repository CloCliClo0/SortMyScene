const express = require('express');
const { getTokenByProvider, deleteTokenByProvider } = require('../controllers/tokensController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:provider', requireAuth, getTokenByProvider);
router.delete('/:provider', requireAuth, deleteTokenByProvider);

module.exports = router;
