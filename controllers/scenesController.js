const { QueryTypes } = require('sequelize');
const sequelize = require('../lib/sequelize');
const { withDbTimeout, sendDbError } = require('../lib/dbGuard');

async function getScenes(req, res) {
  try {
    const userId = Number(req.user.id);

    const sceneRows = await withDbTimeout(
      sequelize.query(
        `SELECT id, user_id, name, description, seed_tracks, created_at
         FROM \`Scene\`
         WHERE user_id = :userId
         ORDER BY created_at DESC`,
        {
          replacements: { userId },
          type: QueryTypes.SELECT,
        }
      ),
      'get scenes'
    );

    if (sceneRows.length === 0) {
      return res.json([]);
    }

    const sceneIds = sceneRows.map((scene) => scene.id);
    const trackRows = await withDbTimeout(
      sequelize.query(
        `SELECT id, scene_id, platform_id, title, artist, album_art, metadata
         FROM \`Track\`
         WHERE scene_id IN (:sceneIds)
         ORDER BY id ASC`,
        {
          replacements: { sceneIds },
          type: QueryTypes.SELECT,
        }
      ),
      'get scene tracks'
    );

    const tracksByScene = new Map();
    for (const track of trackRows) {
      const list = tracksByScene.get(track.scene_id) || [];
      list.push(track);
      tracksByScene.set(track.scene_id, list);
    }

    const scenes = sceneRows.map((scene) => ({
      ...scene,
      tracks: tracksByScene.get(scene.id) || [],
    }));

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

    const scene = await withDbTimeout(
      sequelize.transaction(async (transaction) => {
        const [insertResult] = await sequelize.query(
          `INSERT INTO \`Scene\` (user_id, name, description, seed_tracks)
           VALUES (:userId, :name, :description, :seedTracks)`,
          {
            replacements: {
              userId,
              name,
              description,
              seedTracks: JSON.stringify(seed_tracks || []),
            },
            transaction,
          }
        );

        const sceneId = insertResult.insertId;

        if (Array.isArray(tracks) && tracks.length > 0) {
          for (const track of tracks) {
            await sequelize.query(
              `INSERT INTO \`Track\` (scene_id, platform_id, title, artist, album_art, metadata)
               VALUES (:sceneId, :platformId, :title, :artist, :albumArt, :metadata)`,
              {
                replacements: {
                  sceneId,
                  platformId: String(track.platform_id || ''),
                  title: track.title || 'Untitled',
                  artist: track.artist || 'Unknown Artist',
                  albumArt: track.album_art || null,
                  metadata: track.metadata ? JSON.stringify(track.metadata) : null,
                },
                transaction,
              }
            );
          }
        }

        const [sceneRows] = await sequelize.query(
          `SELECT id, user_id, name, description, seed_tracks, created_at
           FROM \`Scene\`
           WHERE id = :sceneId
           LIMIT 1`,
          {
            replacements: { sceneId },
            transaction,
          }
        );

        const [trackRows] = await sequelize.query(
          `SELECT id, scene_id, platform_id, title, artist, album_art, metadata
           FROM \`Track\`
           WHERE scene_id = :sceneId
           ORDER BY id ASC`,
          {
            replacements: { sceneId },
            transaction,
          }
        );

        return {
          ...sceneRows[0],
          tracks: trackRows,
        };
      }),
      'create scene'
    );

    return res.status(201).json(scene);
  } catch (error) {
    return sendDbError(res, error, 'Failed to create scene');
  }
}

module.exports = {
  getScenes,
  createScene,
};
