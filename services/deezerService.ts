const DEEZER_BASE_URL = 'https://api.deezer.com';

type QueryParams = Record<string, string | number | boolean | undefined>;

class DeezerRateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private timestamps: number[] = [];

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitTurn(): Promise<void> {
    while (true) {
      const now = Date.now();
      this.timestamps = this.timestamps.filter((ts) => now - ts < this.windowMs);

      if (this.timestamps.length < this.maxRequests) {
        this.timestamps.push(now);
        return;
      }

      const oldest = this.timestamps[0];
      const waitMs = this.windowMs - (now - oldest) + 5;
      await new Promise((resolve) => setTimeout(resolve, Math.max(waitMs, 20)));
    }
  }
}

const deezerLimiter = new DeezerRateLimiter(50, 5000);

function buildUrl(path: string, params?: QueryParams): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${DEEZER_BASE_URL}${normalizedPath}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

export async function deezerGet<T>(path: string, params?: QueryParams): Promise<T> {
  await deezerLimiter.waitTurn();

  const response = await fetch(buildUrl(path, params), {
    method: 'GET',
    headers: {
      Accept: 'application/json; charset=utf-8',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });

  if (!response.ok) {
    throw new Error(`Deezer API error ${response.status}: ${response.statusText}`);
  }

  return (await response.json()) as T;
}

/**
 * Récupère les playlists de l'utilisateur Deezer
 */
export async function getUserPlaylists(accessToken: string, limit = 50, index = 0) {
  return deezerGet(`/user/me/playlists`, {
    access_token: accessToken,
    limit,
    index,
  });
}

/**
 * Récupère les tracks d'une playlist Deezer
 */
export async function getPlaylistTracks(playlistId: string | number, accessToken: string, limit = 100, index = 0) {
  return deezerGet(`/playlist/${playlistId}/tracks`, {
    access_token: accessToken,
    limit,
    index,
  });
}

/**
 * Récupère les informations d'une playlist
 */
export async function getPlaylist(playlistId: string | number, accessToken: string) {
  return deezerGet(`/playlist/${playlistId}`, { access_token: accessToken });
}

/**
 * Récupère les informations d'un album
 */
export async function getAlbum(albumId: string | number) {
  return deezerGet(`/album/${albumId}`);
}

/**
 * Récupère les informations d'une artiste
 */
export async function getArtist(artistId: string | number) {
  return deezerGet(`/artist/${artistId}`);
}

/**
 * Récupère les top tracks d'une artiste
 */
export async function getArtistTopTracks(artistId: string | number, limit = 50) {
  return deezerGet(`/artist/${artistId}/top`, { limit });
}

/**
 * Recherche des tracks sur Deezer
 */
export async function searchTracks(query: string, limit = 50, index = 0) {
  return deezerGet(`/search`, { q: query, limit, index });
}

/**
 * Recherche des playlists sur Deezer
 */
export async function searchPlaylists(query: string, limit = 50, index = 0) {
  return deezerGet(`/search/playlist`, { q: query, limit, index });
}

/**
 * Récupère les informations de l'utilisateur
 */
export async function getCurrentUser(accessToken: string) {
  return deezerGet(`/user/me`, { access_token: accessToken });
}

/**
 * Récupère les favoris de l'utilisateur
 */
export async function getUserFavoriteTracks(accessToken: string, limit = 50, index = 0) {
  return deezerGet(`/user/me/tracks`, {
    access_token: accessToken,
    limit,
    index,
  });
}

/**
 * Récupère les albums favoris de l'utilisateur
 */
export async function getUserFavoriteAlbums(accessToken: string, limit = 50, index = 0) {
  return deezerGet(`/user/me/albums`, {
    access_token: accessToken,
    limit,
    index,
  });
}

/**
 * Récupère les artistes favoris de l'utilisateur
 */
export async function getUserFavoriteArtists(accessToken: string, limit = 50, index = 0) {
  return deezerGet(`/user/me/artists`, {
    access_token: accessToken,
    limit,
    index,
  });
}
