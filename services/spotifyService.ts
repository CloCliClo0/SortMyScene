type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type JsonBody = Record<string, unknown> | undefined;

let tokenProvider: (() => Promise<string>) | null = null;

export function setSpotifyTokenProvider(provider: () => Promise<string>) {
  tokenProvider = provider;
}

async function getToken(): Promise<string> {
  if (!tokenProvider) {
    throw new Error('Spotify token provider is not configured. Call setSpotifyTokenProvider first.');
  }

  return tokenProvider();
}

// The authorization token must be managed dynamically.
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

export async function getTopTracks() {
  return fetchWebApi('v1/me/top/tracks?time_range=long_term&limit=5', 'GET');
}
