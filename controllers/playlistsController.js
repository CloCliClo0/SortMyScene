const { QueryTypes } = require('sequelize');
const sequelize = require('../lib/sequelize');
const { withDbTimeout, sendDbError } = require('../lib/dbGuard');

// ─── Helpers refresh token ────────────────────────────────────────────────────

async function refreshSpotifyToken(userId) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const rows = await withDbTimeout(
    sequelize.query(
      `SELECT refresh_token FROM \`OAuthToken\`
       WHERE user_id = :userId AND provider = 'spotify' LIMIT 1`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    ),
    'get spotify refresh token'
  );

  const refreshToken = rows[0]?.refresh_token;
  if (!refreshToken) return null;

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!tokenRes.ok) {
    console.warn('[refreshSpotifyToken] Refresh failed:', tokenRes.status);
    return null;
  }

  const data = await tokenRes.json();

  await withDbTimeout(
    sequelize.query(
      `UPDATE \`OAuthToken\`
       SET access_token = :accessToken, expires_in = :expiresIn
       WHERE user_id = :userId AND provider = 'spotify'`,
      {
        replacements: {
          userId,
          accessToken: data.access_token,
          expiresIn: data.expires_in || null,
        },
      }
    ),
    'update spotify access token'
  );

  return data.access_token;
}

async function refreshYoutubeToken(userId) {
  const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const rows = await withDbTimeout(
    sequelize.query(
      `SELECT refresh_token FROM \`OAuthToken\`
       WHERE user_id = :userId AND provider = 'youtube' LIMIT 1`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    ),
    'get youtube refresh token'
  );

  const refreshToken = rows[0]?.refresh_token;
  if (!refreshToken) return null;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!tokenRes.ok) {
    console.warn('[refreshYoutubeToken] Refresh failed:', tokenRes.status);
    return null;
  }

  const data = await tokenRes.json();

  await withDbTimeout(
    sequelize.query(
      `UPDATE \`OAuthToken\`
       SET access_token = :accessToken, expires_in = :expiresIn
       WHERE user_id = :userId AND provider = 'youtube'`,
      {
        replacements: {
          userId,
          accessToken: data.access_token,
          expiresIn: data.expires_in || null,
        },
      }
    ),
    'update youtube access token'
  );

  return data.access_token;
}

// ─── Helper : récupère un token frais (avec auto-refresh si 401) ──────────────

async function getFreshToken(userId, provider) {
  const rows = await withDbTimeout(
    sequelize.query(
      `SELECT access_token FROM \`OAuthToken\`
       WHERE user_id = :userId AND provider = :provider LIMIT 1`,
      { replacements: { userId, provider }, type: QueryTypes.SELECT }
    ),
    'get provider token'
  );

  return rows[0]?.access_token || null;
}

// ─── API Spotify ──────────────────────────────────────────────────────────────

async function getSpotifyPlaylists(accessToken, userId) {
  let token = accessToken;

  const doPage = async (t, offset = 0) => {
    const res = await fetch(
      `https://api.spotify.com/v1/me/playlists?limit=50&offset=${offset}`,
      { headers: { Authorization: `Bearer ${t}` } }
    );
    if (res.status === 401 && userId && offset === 0) {
      const newToken = await refreshSpotifyToken(userId);
      if (newToken) {
        token = newToken;
        return doPage(token, offset);
      }
    }
    if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
    return res.json();
  };

  const first = await doPage(token, 0);
  let items = first.items || [];

  // Récupère jusqu'à 100 playlists (2 pages de 50)
  if (first.next && items.length < 100) {
    const second = await doPage(token, 50);
    items = items.concat(second.items || []);
  }

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    image: item.images?.[0]?.url || null,
    tracks: item.tracks?.total ?? 0,
    provider: 'spotify',
  }));
}

async function getSpotifyPlaylistTracks(accessToken, playlistId, userId) {
  let token = accessToken;

  const doPage = async (t, offset = 0) => {
    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&offset=${offset}`,
      { headers: { Authorization: `Bearer ${t}` } }
    );
    if (res.status === 401 && userId && offset === 0) {
      const newToken = await refreshSpotifyToken(userId);
      if (newToken) {
        token = newToken;
        return doPage(token, offset);
      }
    }
    if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
    return res.json();
  };

  const first = await doPage(token, 0);
  let items = first.items || [];

  // Récupère la page suivante si elle existe (max 200 titres au total)
  if (first.next && items.length < 200) {
    const second = await doPage(token, 100);
    items = items.concat(second.items || []);
  }

  // Filtre les entrées nulles (titres supprimés / fichiers locaux)
  return items.filter((item) => item?.track != null);
}

// ─── API YouTube ──────────────────────────────────────────────────────────────

async function getYoutubePlaylists(accessToken, userId) {
  let token = accessToken;

  const doPage = async (t, pageToken = null) => {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlists');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('mine', 'true');
    url.searchParams.set('maxResults', '50');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${t}` } });
    if (res.status === 401 && userId && !pageToken) {
      const newToken = await refreshYoutubeToken(userId);
      if (newToken) {
        token = newToken;
        return doPage(token, null);
      }
    }
    if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
    return res.json();
  };

  const first = await doPage(token, null);
  let items = first.items || [];

  // Récupère la page suivante si elle existe
  if (first.nextPageToken && items.length < 100) {
    const second = await doPage(token, first.nextPageToken);
    items = items.concat(second.items || []);
  }

  return items.map((item) => ({
    id: item.id,
    name: item.snippet?.title || 'YouTube playlist',
    image:
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url ||
      null,
    tracks: item.contentDetails?.itemCount ?? 0,
    provider: 'youtube',
  }));
}

async function getYoutubePlaylistTracks(accessToken, playlistId, userId) {
  let token = accessToken;

  const doRequest = (t) =>
    fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50`,
      { headers: { Authorization: `Bearer ${t}` } }
    );

  let response = await doRequest(token);

  if (response.status === 401 && userId) {
    const newToken = await refreshYoutubeToken(userId);
    if (newToken) {
      token = newToken;
      response = await doRequest(token);
    }
  }

  if (!response.ok) throw new Error(`YouTube API error: ${response.status}`);

  const data = await response.json();
  return data.items || [];
}

// ─── API Deezer ───────────────────────────────────────────────────────────────

async function getDeezerPlaylists(accessToken) {
  const response = await fetch(
    `https://api.deezer.com/user/me/playlists?access_token=${encodeURIComponent(accessToken)}&limit=50`
  );
  if (!response.ok) throw new Error(`Deezer API error: ${response.status}`);
  const data = await response.json();
  return (data.data || []).map((item) => ({
    id: item.id,
    name: item.title,
    image: item.picture_medium || item.picture_small || item.picture_big || null,
    tracks: item.nb_tracks ?? 0,
    provider: 'deezer',
    raw: item,
  }));
}

async function getDeezerPlaylistTracks(accessToken, playlistId) {
  const response = await fetch(
    `https://api.deezer.com/playlist/${playlistId}/tracks?access_token=${encodeURIComponent(accessToken)}&limit=100`
  );
  if (!response.ok) throw new Error(`Deezer API error: ${response.status}`);
  const data = await response.json();
  return data.data || [];
}

// ─── Route handlers ───────────────────────────────────────────────────────────

function handleProviderError(res, error, provider, action) {
  const msg = error?.message || '';
  // Renvoie un vrai 401 au client pour qu'il affiche un prompt de reconnexion
  if (msg.includes('401') || msg.includes('403')) {
    return res.status(401).json({
      message: `Votre connexion ${provider} a expiré. Reconnectez votre compte dans les Paramètres.`,
      reconnect: true,
      provider,
    });
  }
  return sendDbError(res, error, `Failed to retrieve ${provider} ${action}`);
}

async function getPlaylistsByProvider(req, res) {
  try {
    const { provider } = req.params;

    if (!['deezer', 'spotify', 'youtube'].includes(provider)) {
      return res.status(400).json({ message: 'provider must be deezer, spotify or youtube' });
    }

    const userId = Number(req.user.id);

    const tokenRows = await withDbTimeout(
      sequelize.query(
        `SELECT access_token FROM \`OAuthToken\`
         WHERE user_id = :userId AND provider = :provider LIMIT 1`,
        { replacements: { userId, provider }, type: QueryTypes.SELECT }
      ),
      'get provider token'
    );

    if (!tokenRows.length) {
      return res.status(401).json({
        message: `Compte ${provider} non connecté.`,
        reconnect: true,
        provider,
      });
    }

    const accessToken = tokenRows[0].access_token;
    let playlists = [];

    if (provider === 'spotify') {
      playlists = await getSpotifyPlaylists(accessToken, userId);
    } else if (provider === 'deezer') {
      playlists = await getDeezerPlaylists(accessToken);
    } else if (provider === 'youtube') {
      playlists = await getYoutubePlaylists(accessToken, userId);
    }

    return res.json(playlists);
  } catch (error) {
    return handleProviderError(res, error, req.params.provider, 'playlists');
  }
}

async function getPlaylistTracks(req, res) {
  try {
    const { provider, playlistId } = req.params;

    if (!['deezer', 'spotify', 'youtube'].includes(provider)) {
      return res.status(400).json({ message: 'provider must be deezer, spotify or youtube' });
    }

    const userId = Number(req.user.id);

    const tokenRows = await withDbTimeout(
      sequelize.query(
        `SELECT access_token FROM \`OAuthToken\`
         WHERE user_id = :userId AND provider = :provider LIMIT 1`,
        { replacements: { userId, provider }, type: QueryTypes.SELECT }
      ),
      'get provider token'
    );

    if (!tokenRows.length) {
      return res.status(401).json({
        message: `Compte ${provider} non connecté.`,
        reconnect: true,
        provider,
      });
    }

    const accessToken = tokenRows[0].access_token;
    let tracks = [];

    if (provider === 'spotify') {
      tracks = await getSpotifyPlaylistTracks(accessToken, playlistId, userId);
    } else if (provider === 'deezer') {
      tracks = await getDeezerPlaylistTracks(accessToken, playlistId);
    } else if (provider === 'youtube') {
      tracks = await getYoutubePlaylistTracks(accessToken, playlistId, userId);
    }

    return res.json(tracks);
  } catch (error) {
    return handleProviderError(res, error, req.params.provider, 'tracks');
  }
}

module.exports = {
  getPlaylistsByProvider,
  getPlaylistTracks,
};
