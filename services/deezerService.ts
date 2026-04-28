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

export async function getUserPlaylists(userId: string | number) {
  return deezerGet(`/user/${userId}/playlists`);
}

export async function getAlbum(albumId: string | number) {
  return deezerGet(`/album/${albumId}`);
}
