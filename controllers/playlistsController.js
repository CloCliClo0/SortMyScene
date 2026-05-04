const { QueryTypes } = require('sequelize');
const sequelize = require('../lib/sequelize');
const { withDbTimeout, sendDbError } = require('../lib/dbGuard');

/**
 * Récupère les playlists de l'utilisateur pour un service donné
 */
async function getPlaylistsByProvider(req, res) {
  try {
    const { provider } = req.params;

    if (!['deezer', 'spotify', 'youtube'].includes(provider)) {
      return res.status(400).json({ message: 'provider must be deezer, spotify or youtube' });
    }

    const userId = Number(req.user.id);

    // Récupère le token pour ce provider
    const tokenRows = await withDbTimeout(
      sequelize.query(
        `SELECT access_token FROM \`OAuthToken\`
         WHERE user_id = :userId AND provider = :provider
         LIMIT 1`,
        {
          replacements: { userId, provider },
          type: QueryTypes.SELECT,
        }
      ),
      'get provider token'
    );

    if (!tokenRows.length) {
      return res.status(401).json({ message: `No ${provider} token found. Please connect your ${provider} account first.` });
    }

    const accessToken = tokenRows[0].access_token;
    let playlists = [];

    // Récupère les playlists selon le provider
    if (provider === 'spotify') {
      // Utiliser le service Spotify (il faut configurer le token provider)
      playlists = await getSpotifyPlaylists(accessToken);
    } else if (provider === 'deezer') {
      playlists = await getDeezerPlaylists(accessToken);
    } else if (provider === 'youtube') {
      playlists = await getYoutubePlaylists(accessToken);
    }

    return res.json(playlists);
  } catch (error) {
    return sendDbError(res, error, `Failed to retrieve ${req.params.provider} playlists`);
  }
}

/**
 * Récupère les tracks d'une playlist pour un service donné
 */
async function getPlaylistTracks(req, res) {
  try {
    const { provider, playlistId } = req.params;

    if (!['deezer', 'spotify', 'youtube'].includes(provider)) {
      return res.status(400).json({ message: 'provider must be deezer, spotify or youtube' });
    }

    const userId = Number(req.user.id);

    // Récupère le token pour ce provider
    const tokenRows = await withDbTimeout(
      sequelize.query(
        `SELECT access_token FROM \`OAuthToken\`
         WHERE user_id = :userId AND provider = :provider
         LIMIT 1`,
        {
          replacements: { userId, provider },
          type: QueryTypes.SELECT,
        }
      ),
      'get provider token'
    );

    if (!tokenRows.length) {
      return res.status(401).json({ message: `No ${provider} token found.` });
    }

    const accessToken = tokenRows[0].access_token;
    let tracks = [];

    // Récupère les tracks selon le provider
    if (provider === 'spotify') {
      tracks = await getSpotifyPlaylistTracks(accessToken, playlistId);
    } else if (provider === 'deezer') {
      tracks = await getDeezerPlaylistTracks(accessToken, playlistId);
    } else if (provider === 'youtube') {
      tracks = await getYoutubePlaylistTracks(accessToken, playlistId);
    }

    return res.json(tracks);
  } catch (error) {
    return sendDbError(res, error, `Failed to retrieve ${req.params.provider} playlist tracks`);
  }
}

// Fonctions helper pour chaque provider
async function getSpotifyPlaylists(accessToken) {
  const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

async function getSpotifyPlaylistTracks(accessToken, playlistId) {
  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

async function getDeezerPlaylists(accessToken) {
  const response = await fetch(`https://api.deezer.com/user/me/playlists?access_token=${accessToken}&limit=50`);

  if (!response.ok) {
    throw new Error(`Deezer API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

async function getDeezerPlaylistTracks(accessToken, playlistId) {
  const response = await fetch(`https://api.deezer.com/playlist/${playlistId}/tracks?access_token=${accessToken}&limit=100`);

  if (!response.ok) {
    throw new Error(`Deezer API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

async function getYoutubePlaylists(accessToken) {
  const response = await fetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=25', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

async function getYoutubePlaylistTracks(accessToken, playlistId) {
  const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

module.exports = {
  getPlaylistsByProvider,
  getPlaylistTracks,
};
