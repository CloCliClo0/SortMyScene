const { Track, Scene } = require('../models');
const { processTracks, getSortOptions, getTrackStats } = require('../services/trackSortService');

async function getAllTracks(req, res) {
  try {
    const sceneId = req.query.sceneId;
    const sortBy = req.query.sortBy || 'popularity';
    const filters = {
      minDuration: req.query.minDuration ? parseInt(req.query.minDuration) : undefined,
      maxDuration: req.query.maxDuration ? parseInt(req.query.maxDuration) : undefined,
      minPopularity: req.query.minPopularity ? parseInt(req.query.minPopularity) : undefined,
      artist: req.query.artist,
      title: req.query.title,
      provider: req.query.provider,
    };

    let where = {};

    if (sceneId) {
      const scene = await Scene.findByPk(sceneId);
      if (!scene) {
        return res.status(404).json({ error: 'Scene not found' });
      }
      if (!req.user.is_admin && scene.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      where = { scene_id: sceneId };
    } else {
      const userScenes = await Scene.findAll({
        where: req.user.is_admin ? {} : { user_id: req.user.id },
        attributes: ['id'],
      });
      const sceneIds = userScenes.map((s) => s.id);
      where = { scene_id: sceneIds };
    }

    let tracks = await Track.findAll({
      where,
      include: [{ model: Scene, as: 'scene', attributes: ['id', 'name'] }],
      order: [['id', 'ASC']],
    });

    // Applique le tri et le filtrage
    tracks = processTracks(tracks, sortBy, filters);

    // Ajoute les statistiques
    const stats = getTrackStats(tracks);

    res.json({
      data: tracks,
      stats,
      sortBy,
      filters,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getTrackById(req, res) {
  try {
    const track = await Track.findByPk(req.params.id, {
      include: [{ model: Scene, as: 'scene', attributes: ['id', 'name'] }],
    });
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const scene = await Scene.findByPk(track.scene_id);
    if (!req.user.is_admin && scene.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(track);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createTrack(req, res) {
  try {
    const { scene_id, platform_id, title, artist, album_art, metadata } = req.body;
    const scene = await Scene.findByPk(scene_id);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }
    if (!req.user.is_admin && scene.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const track = await Track.create({ scene_id, platform_id, title, artist, album_art, metadata });
    res.status(201).json(track);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function updateTrack(req, res) {
  try {
    const track = await Track.findByPk(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const scene = await Scene.findByPk(track.scene_id);
    if (!req.user.is_admin && scene.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { platform_id, title, artist, album_art, metadata } = req.body;
    await track.update({ platform_id, title, artist, album_art, metadata });
    res.json(track);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function deleteTrack(req, res) {
  try {
    const track = await Track.findByPk(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const scene = await Scene.findByPk(track.scene_id);
    if (!req.user.is_admin && scene.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await track.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllTracks,
  getTrackById,
  createTrack,
  updateTrack,
  deleteTrack,
};
