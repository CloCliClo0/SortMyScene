const express = require('express');
const { getScenes, createScene } = require('../controllers/scenesController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, getScenes);
router.post('/', requireAuth, createScene);

module.exports = router;
