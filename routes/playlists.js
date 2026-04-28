const express = require('express');
const axios = require('axios');
const { filterSongsForScene } = require('../services/gemini');

const router = express.Router();

const DEEZER_API = 'https://api.deezer.com';

/**
 * Middleware: ensure the user has a Deezer access token in their session.
 */
function requireAuth(req, res, next) {
  if (!req.session.deezerToken) {
    return res.status(401).json({ error: 'Not authenticated. Please connect your Deezer account.' });
  }
  next();
}

/**
 * Validates that a Deezer resource ID consists only of digits (safe for URL embedding).
 * @param {string} id
 * @returns {boolean}
 */
function isValidId(id) {
  return /^\d+$/.test(id);
}

/**
 * GET /api/status
 * Returns whether the user is currently authenticated with Deezer.
 */
router.get('/status', (req, res) => {
  res.json({ connected: !!req.session.deezerToken });
});

/**
 * GET /api/playlists
 * Returns the authenticated user's Deezer playlists.
 */
router.get('/playlists', requireAuth, async (req, res) => {
  try {
    const response = await axios.get(`${DEEZER_API}/user/me/playlists`, {
      params: { access_token: req.session.deezerToken },
    });
    res.json(response.data);
  } catch (err) {
    console.error('Deezer playlists error:', err.message);
    res.status(502).json({ error: 'Failed to fetch playlists from Deezer.' });
  }
});

/**
 * GET /api/playlists/:id/tracks
 * Returns the tracks of a specific Deezer playlist.
 */
router.get('/playlists/:id/tracks', requireAuth, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid playlist ID.' });
  }
  try {
    const response = await axios.get(`${DEEZER_API}/playlist/${req.params.id}/tracks`, {
      params: { access_token: req.session.deezerToken },
    });
    res.json(response.data);
  } catch (err) {
    console.error('Deezer tracks error:', err.message);
    res.status(502).json({ error: 'Failed to fetch tracks from Deezer.' });
  }
});

/**
 * POST /api/scene
 * Body: { playlistId: string, sceneDescription: string }
 * Fetches the tracks from the given playlist, passes them through Gemini AI,
 * and returns the filtered list of track IDs.
 */
router.post('/scene', requireAuth, async (req, res) => {
  const { playlistId, sceneDescription } = req.body;

  if (!playlistId || !sceneDescription) {
    return res.status(400).json({ error: 'playlistId and sceneDescription are required.' });
  }

  if (!isValidId(String(playlistId))) {
    return res.status(400).json({ error: 'Invalid playlist ID.' });
  }

  try {
    // 1. Fetch tracks from Deezer
    const tracksResponse = await axios.get(`${DEEZER_API}/playlist/${playlistId}/tracks`, {
      params: { access_token: req.session.deezerToken },
    });

    const tracks = tracksResponse.data.data || [];

    if (tracks.length === 0) {
      return res.json({ trackIds: [] });
    }

    // 2. Ask Gemini to filter the tracks
    const trackIds = await filterSongsForScene(tracks, sceneDescription);

    res.json({ trackIds });
  } catch (err) {
    console.error('Scene generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate scene. Please try again.' });
  }
});

module.exports = router;
