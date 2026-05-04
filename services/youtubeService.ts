/**
 * Service pour récupérer et gérer les données YouTube Music
 */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type JsonBody = Record<string, unknown> | undefined;

let tokenProvider: (() => Promise<string>) | null = null;

export function setYouTubeTokenProvider(provider: () => Promise<string>) {
  tokenProvider = provider;
}

async function getToken(): Promise<string> {
  if (!tokenProvider) {
    throw new Error('YouTube token provider is not configured.');
  }
  return tokenProvider();
}

export async function fetchWebApi<T>(endpoint: string, method: HttpMethod, body?: JsonBody): Promise<T> {
  const token = await getToken();

  const res = await fetch(`https://www.googleapis.com/youtube/v3/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method,
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    throw new Error(`YouTube API error ${res.status}: ${res.statusText}`);
  }

  return (await res.json()) as T;
}

/**
 * Récupère les playlists de l'utilisateur YouTube
 */
export async function getUserPlaylists(maxResults = 25) {
  return fetchWebApi(
    `playlists?part=snippet,contentDetails&mine=true&maxResults=${maxResults}`,
    'GET'
  );
}

/**
 * Récupère les vidéos d'une playlist YouTube
 */
export async function getPlaylistItems(playlistId: string, maxResults = 50) {
  return fetchWebApi(
    `playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${maxResults}`,
    'GET'
  );
}

/**
 * Recherche des vidéos sur YouTube
 */
export async function searchVideos(query: string, maxResults = 20) {
  return fetchWebApi(
    `search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}`,
    'GET'
  );
}

/**
 * Récupère les informations d'une vidéo
 */
export async function getVideo(videoId: string) {
  return fetchWebApi(
    `videos?part=snippet,contentDetails,statistics&id=${videoId}`,
    'GET'
  );
}

/**
 * Récupère les informations de l'utilisateur YouTube
 */
export async function getCurrentUser() {
  return fetchWebApi('channels?part=snippet,contentDetails&mine=true', 'GET');
}

/**
 * Récupère les liked playlists
 */
export async function getLikedPlaylists(maxResults = 25) {
  return fetchWebApi(
    `playlists?part=snippet,contentDetails&mine=true&maxResults=${maxResults}`,
    'GET'
  );
}
