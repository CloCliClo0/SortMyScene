type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type JsonBody = Record<string, unknown> | undefined;

let tokenProvider: (() => Promise<string>) | null = null;

export function setSpotifyTokenProvider(provider: () => Promise<string>) {
  tokenProvider = provider;
}

async function getToken(): Promise<string> {
  if (!tokenProvider) {
    throw new Error('Spotify token provider is not configured.');
  }
  return tokenProvider();
}

export async function fetchWebApi<T>(endpoint: string, method: HttpMethod, body?: JsonBody): Promise<T> {
  const token = await getToken();

  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method,
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    throw new Error(`Spotify API error ${res.status}: ${res.statusText}`);
  }

  return (await res.json()) as T;
}

export async function getUserPlaylists(limit = 50, offset = 0) {
  return fetchWebApi(
    `v1/me/playlists?limit=${limit}&offset=${offset}`,
    'GET'
  );
}

export async function getPlaylistTracks(playlistId: string, limit = 100, offset = 0) {
  return fetchWebApi(
    `v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
    'GET'
  );
}

export async function getTopTracks(limit = 20, timeRange = 'long_term') {
  return fetchWebApi(
    `v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
    'GET'
  );
}

export async function getSavedTracks(limit = 50, offset = 0) {
  return fetchWebApi(
    `v1/me/tracks?limit=${limit}&offset=${offset}`,
    'GET'
  );
}

export async function searchTracks(query: string, limit = 20) {
  return fetchWebApi(
    `v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
    'GET'
  );
}

export async function getCurrentUser() {
  return fetchWebApi('v1/me', 'GET');
}

export async function getPlaylist(playlistId: string) {
  return fetchWebApi(`v1/playlists/${playlistId}`, 'GET');
}

export async function getRecommendations(seedTracks: string[], limit = 20) {
  const seedParam = seedTracks.slice(0, 5).join(',');
  return fetchWebApi(
    `v1/recommendations?seed_tracks=${seedParam}&limit=${limit}`,
    'GET'
  );
}
