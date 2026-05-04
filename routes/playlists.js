const express = require('express');
const { getPlaylistsByProvider, getPlaylistTracks } = require('../controllers/playlistsController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Récupère les playlists d'un provider (spotify, deezer, youtube)
router.get('/:provider', requireAuth, getPlaylistsByProvider);

// Récupère les tracks d'une playlist pour un provider
router.get('/:provider/:playlistId/tracks', requireAuth, getPlaylistTracks);

module.exports = router;

module.exports = router;
