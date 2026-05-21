const { Scene, User, Track } = require('../models');

// Get all scenes for current user
async function getAllScenes(req, res) {
  try {
    const where = req.user.is_admin && req.query.userId ? { user_id: req.query.userId } : { user_id: req.user.id };
    const scenes = await Scene.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email'] },
        { model: Track, as: 'tracks', attributes: ['id'] },
      ],
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
    const { name, description, seed_tracks, image_url } = req.body;
    const scene = await Scene.create({ user_id: req.user.id, name, description, seed_tracks, image_url: image_url || null });
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

    const { name, description, seed_tracks, image_url } = req.body;
    const updateData = { name, description, seed_tracks };
    if (image_url !== undefined) updateData.image_url = image_url;
    await scene.update(updateData);
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

// Sort a scene's tracks with Gemini AI and persist the result
async function sortScene(req, res) {
  try {
    const scene = await Scene.findByPk(req.params.id);
    if (!scene) return res.status(404).json({ error: 'Scene not found' });
    if (!req.user.is_admin && scene.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { tracks, description } = req.body;
    if (!Array.isArray(tracks) || !tracks.length) {
      return res.status(400).json({ error: 'tracks must be a non-empty array' });
    }
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'description is required' });
    }

    const { filterTracksForScene } = require('../services/gemini');

    let filtered;
    try {
      filtered = await filterTracksForScene(tracks, description);
    } catch {
      // If Gemini fails (quota, no key, etc.) keep all tracks
      filtered = tracks;
    }

    // Replace existing tracks for this scene
    await Track.destroy({ where: { scene_id: scene.id } });

    const saved = await Promise.all(
      filtered.map((t) =>
        Track.create({
          scene_id: scene.id,
          provider: t.provider || 'spotify',
          platform_id: String(t.id),
          title: t.title || 'Unknown',
          artist: t.artist || 'Unknown',
          duration_ms: t.duration_ms || null,
          popularity: null,
        })
      )
    );

    await scene.update({ description });

    res.json({ tracks: saved, count: saved.length });
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
  sortScene,
};
