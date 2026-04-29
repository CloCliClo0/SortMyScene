const prisma = require('../lib/prisma');
const { withDbTimeout, sendDbError } = require('../lib/dbGuard');

async function getScenes(req, res) {
  try {
    const userId = Number(req.user.id);

    const scenes = await withDbTimeout(prisma.scene.findMany({
      where: { user_id: userId },
      include: { tracks: true },
      orderBy: { created_at: 'desc' },
    }), 'get scenes');

    res.json(scenes);
  } catch (error) {
    return sendDbError(res, error, 'Failed to load scenes');
  }
}

async function createScene(req, res) {
  try {
    const userId = Number(req.user.id);
    const { name, description, seed_tracks = [], tracks = [] } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: 'name and description are required' });
    }

    const scene = await withDbTimeout(prisma.scene.create({
      data: {
        user_id: userId,
        name,
        description,
        seed_tracks,
        tracks: {
          create: tracks.map((track) => ({
            platform_id: String(track.platform_id || ''),
            title: track.title || 'Untitled',
            artist: track.artist || 'Unknown Artist',
            album_art: track.album_art || null,
            metadata: track.metadata || null,
          })),
        },
      },
      include: { tracks: true },
    }), 'create scene');

    return res.status(201).json(scene);
  } catch (error) {
    return sendDbError(res, error, 'Failed to create scene');
  }
}

module.exports = {
  getScenes,
  createScene,
};
