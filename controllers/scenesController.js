const { Scene, User } = require('../models');

// Get all scenes for current user
async function getAllScenes(req, res) {
  try {
    const where = req.user.is_admin && req.query.userId ? { user_id: req.query.userId } : { user_id: req.user.id };
    const scenes = await Scene.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
      order: [['created_at', 'DESC']],
    });
    res.json(scenes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get scene by ID
async function getSceneById(req, res) {
  try {
    const scene = await Scene.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
    });
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    if (!req.user.is_admin && scene.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(scene);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Create scene
async function createScene(req, res) {
  try {
    const { name, description, seed_tracks } = req.body;
    const scene = await Scene.create({ user_id: req.user.id, name, description, seed_tracks });
    res.status(201).json(scene);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// Update scene
async function updateScene(req, res) {
  try {
    const scene = await Scene.findByPk(req.params.id);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    if (!req.user.is_admin && scene.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { name, description, seed_tracks } = req.body;
    await scene.update({ name, description, seed_tracks });
    res.json(scene);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// Delete scene
async function deleteScene(req, res) {
  try {
    const scene = await Scene.findByPk(req.params.id);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    if (!req.user.is_admin && scene.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await scene.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllScenes,
  getSceneById,
  createScene,
  updateScene,
  deleteScene,
};
