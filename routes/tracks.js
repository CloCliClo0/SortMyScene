const express = require('express');
const trackController = require('../controllers/trackController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, trackController.getAllTracks);
router.get('/:id', requireAuth, trackController.getTrackById);
router.post('/', requireAuth, trackController.createTrack);
router.put('/:id', requireAuth, trackController.updateTrack);
router.delete('/:id', requireAuth, trackController.deleteTrack);

module.exports = router;
