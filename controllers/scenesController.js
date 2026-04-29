const prisma = require('../lib/prisma');

async function getScenes(req, res) {
  try {
    const userId = Number(req.user.id);

    const scenes = await prisma.scene.findMany({
      where: { user_id: userId },
      include: { tracks: true },
      orderBy: { created_at: 'desc' },
    });

    res.json(scenes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load scenes', error: error.message });
  }
}

async function createScene(req, res) {
  try {
    const userId = Number(req.user.id);
    const { name, description, seed_tracks = [], tracks = [] } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: 'name and description are required' });
    }

    const scene = await prisma.scene.create({
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
    });

    return res.status(201).json(scene);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create scene', error: error.message });
  }
}

module.exports = {
  getScenes,
  createScene,
};
