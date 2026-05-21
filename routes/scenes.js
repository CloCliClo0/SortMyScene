const express = require('express');
const {
  getAllScenes,
  getSceneById,
  createScene,
  updateScene,
  deleteScene,
  sortScene,
} = require('../controllers/scenesController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, getAllScenes);
router.get('/:id', requireAuth, getSceneById);
router.post('/', requireAuth, createScene);
router.put('/:id', requireAuth, updateScene);
router.delete('/:id', requireAuth, deleteScene);
router.post('/:id/sort', requireAuth, sortScene);

module.exports = router;
