import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageContext';

type PlaylistItem = {
  id: string;
  name: string;
  image?: string | null;
  tracks: number;
  provider: 'spotify' | 'youtube';
};

function RawLibraryPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [youtubeConnected, setYouTubeConnected] = useState(false);

  useEffect(() => {
    async function loadLibrary() {
      try {
        const [spotifyTokenRes, youtubeTokenRes] = await Promise.all([
          fetch('/api/tokens/spotify', { credentials: 'include' }),
          fetch('/api/tokens/youtube', { credentials: 'include' }),
        ]);

        setSpotifyConnected(spotifyTokenRes.ok);
        setYouTubeConnected(youtubeTokenRes.ok);

        const collected: PlaylistItem[] = [];

        if (spotifyTokenRes.ok) {
          const spotifyRes = await fetch('/api/playlists/spotify', { credentials: 'include' });
          if (spotifyRes.ok) {
            const data = await spotifyRes.json();
            collected.push(
              ...(data.items || data).map((item: any) => ({
                id: item.id,
                name: item.name,
                tracks: item.tracks?.total ?? item.tracks ?? 0,
                image: item.images?.[0]?.url || null,
                provider: 'spotify' as const,
              }))
            );
          }
        }

        if (youtubeTokenRes.ok) {
          const youtubeRes = await fetch('/api/playlists/youtube', { credentials: 'include' });
          if (youtubeRes.ok) {
            const data = await youtubeRes.json();
            collected.push(
              ...(data.items || data).map((item: any) => ({
                id: item.id,
                name: item.snippet?.title ?? item.title,
                tracks: item.contentDetails?.itemCount ?? 0,
                image: item.snippet?.thumbnails?.medium?.url || null,
                provider: 'youtube' as const,
              }))
            );
          }
        }

        if (!collected.length && !spotifyTokenRes.ok && !youtubeTokenRes.ok) {
          setError('Connect your Spotify or YouTube account to load playlists.');
        }

        setPlaylists(collected);
      } catch {
        setError('Unable to load your library.');
      } finally {
        setLoading(false);
      }
    }

    loadLibrary();
  }, []);

  const openInStudio = (playlist: PlaylistItem) => {
    navigate(`/studio?provider=${playlist.provider}&playlistId=${playlist.id}`);
  };

  const spotifyCount = playlists.filter((p) => p.provider === 'spotify').length;
  const youtubeCount = playlists.filter((p) => p.provider === 'youtube').length;
  const totalTracks = playlists.reduce((acc, p) => acc + p.tracks, 0);

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-display text-5xl font-semibold text-white max-sm:text-4xl">{t('library.title')}</h2>
        <p className="text-slate-400">{t('library.subtitle')}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <article className="card-panel lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-display text-2xl text-cyan-300">{t('library.dna')}</h3>
              <p className="text-sm text-slate-400">{t('library.distribution')}</p>
            </div>
            <span className="glass-chip">{t('library.live')}</span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex items-center justify-center">
              <div className="relative h-52 w-52 rounded-full border-[14px] border-cyan-400/70">
                <div className="absolute inset-4 rounded-full border-[14px] border-purple-500/70" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <span className="text-3xl font-bold">{playlists.length}</span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{t('library.totalPlaylists')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Spotify</span>
                  <span className={spotifyConnected ? 'text-emerald-300' : 'text-slate-400'}>
                    {spotifyConnected ? `${spotifyCount} playlists` : 'Disconnected'}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-900">
                  <div
                    className="h-2 rounded-full bg-cyan-400 transition-all"
                    style={{ width: spotifyConnected ? `${Math.min(100, (spotifyCount / Math.max(playlists.length, 1)) * 100)}%` : '5%' }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>YouTube</span>
                  <span className={youtubeConnected ? 'text-emerald-300' : 'text-slate-400'}>
                    {youtubeConnected ? `${youtubeCount} playlists` : 'Disconnected'}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-900">
                  <div
                    className="h-2 rounded-full bg-purple-500 transition-all"
                    style={{ width: youtubeConnected ? `${Math.min(100, (youtubeCount / Math.max(playlists.length, 1)) * 100)}%` : '5%' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-500">{t('library.totalAssets')}</p>
                  <p className="mt-1 text-xl text-white">{totalTracks.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-500">{t('library.energy')}</p>
                  <p className="mt-1 text-xl text-white">{playlists.length ? 'Live' : 'Idle'}</p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="card-panel">
          <h3 className="mb-3 text-lg font-semibold text-white">{t('library.ingests')}</h3>
          <div className="space-y-2 text-sm">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="font-medium">Spotify</p>
              <p className="text-slate-400">
                {spotifyConnected ? `${spotifyCount} playlists connectées` : 'Non connecté'}
              </p>
              {!spotifyConnected && (
                <a href="/api/auth/spotify" className="mt-2 inline-block text-xs text-cyan-300 hover:text-cyan-200">
                  Connecter →
                </a>
              )}
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="font-medium">YouTube Music</p>
              <p className="text-slate-400">
                {youtubeConnected ? `${youtubeCount} playlists connectées` : 'Non connecté'}
              </p>
              {!youtubeConnected && (
                <a href="/api/auth/youtube" className="mt-2 inline-block text-xs text-cyan-300 hover:text-cyan-200">
                  Connecter →
                </a>
              )}
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="font-medium">Deezer</p>
              <p className="text-slate-400">{t('library.comingSoon')}</p>
            </div>
          </div>
        </article>
      </div>

      <article className="card-panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{t('library.explorer')}</h3>
            <p className="text-sm text-slate-400">Browse your connected playlists and open them in the Studio.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!spotifyConnected && (
              <a
                href="/api/auth/spotify"
                className="rounded-full border border-cyan-300/50 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/15"
              >
                Connect Spotify
              </a>
            )}
            {!youtubeConnected && (
              <a
                href="/api/auth/youtube"
                className="rounded-full border border-purple-300/50 bg-purple-500/10 px-4 py-2 text-sm text-purple-200 hover:bg-purple-500/15"
              >
                Connect YouTube
              </a>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading playlists…</p>
        ) : error ? (
          <p className="text-slate-400">{error}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {playlists.map((playlist) => (
              <div
                key={`${playlist.provider}-${playlist.id}`}
                className="group overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 transition hover:border-cyan-400/40"
              >
                <div className="relative h-32 overflow-hidden bg-slate-900">
                  {playlist.image ? (
                    <img src={playlist.image} alt={playlist.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-slate-500">
                      No cover
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openInStudio(playlist)}
                      className="rounded-full border border-cyan-300/50 bg-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-200"
                    >
                      {t('library.openInStudio')}
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="truncate font-medium text-white">{playlist.name}</p>
                  <p className="text-xs text-slate-400">
                    {playlist.tracks} {t('common.tracks')} ·{' '}
                    <span className={playlist.provider === 'spotify' ? 'text-cyan-400' : 'text-purple-400'}>
                      {playlist.provider}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

export default RawLibraryPage;
