import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/LanguageContext';

type PlaylistItem = {
  id: string;
  name: string;
  tracks: number;
  provider: 'spotify' | 'youtube';
};

function RawLibraryPage() {
  const { t } = useI18n();
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

        const playlistResponses: PlaylistItem[] = [];

        if (spotifyTokenRes.ok) {
          const spotifyRes = await fetch('/api/playlists/spotify', { credentials: 'include' });
          if (spotifyRes.ok) {
            const data = await spotifyRes.json();
            playlistResponses.push(
              ...(data.items || data).map((item: any) => ({
                id: item.id,
                name: item.name,
                tracks: item.tracks?.total ?? item.tracks ?? 0,
                provider: 'spotify' as const,
              }))
            );
          }
        }

        if (youtubeTokenRes.ok) {
          const youtubeRes = await fetch('/api/playlists/youtube', { credentials: 'include' });
          if (youtubeRes.ok) {
            const data = await youtubeRes.json();
            playlistResponses.push(
              ...(data.items || data).map((item: any) => ({
                id: item.id,
                name: item.snippet?.title ?? item.title,
                tracks: item.contentDetails?.itemCount ?? 0,
                provider: 'youtube' as const,
              }))
            );
          }
        }

        if (!playlistResponses.length && !spotifyTokenRes.ok && !youtubeTokenRes.ok) {
          setError('Connect your Spotify or YouTube account to load playlists.');
        }

        setPlaylists(playlistResponses);
      } catch (err) {
        setError('Unable to load your library.');
      } finally {
        setLoading(false);
      }
    }

    loadLibrary();
  }, []);

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
                  <span>{spotifyConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-900">
                  <div className={`h-2 rounded-full bg-cyan-400 ${spotifyConnected ? 'w-[80%]' : 'w-[10%]'}`} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>YouTube</span>
                  <span>{youtubeConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-900">
                  <div className={`h-2 rounded-full bg-purple-500 ${youtubeConnected ? 'w-[70%]' : 'w-[10%]'}`} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-500">{t('library.totalAssets')}</p>
                  <p className="mt-1 text-xl text-white">{playlists.reduce((acc, item) => acc + item.tracks, 0)}</p>
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
              <p className="text-slate-400">{spotifyConnected ? 'Connected' : 'Not connected'}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="font-medium">YouTube Music</p>
              <p className="text-slate-400">{youtubeConnected ? 'Connected' : 'Not connected'}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="font-medium">Deezer</p>
              <p className="text-slate-400">{t('library.comingSoon')}</p>
            </div>
          </div>
        </article>
      </div>

      <article className="card-panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h3 className="text-lg font-semibold text-white">{t('library.explorer')}</h3>
            <p className="text-sm text-slate-400">Browse your connected playlists and create scenes from them.</p>
          </div>
          {!spotifyConnected && (
            <a href="/api/auth/spotify" className="rounded-full border border-cyan-300/50 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/15">
              Connect Spotify
            </a>
          )}
          {!youtubeConnected && (
            <a href="/api/auth/youtube" className="rounded-full border border-purple-300/50 bg-purple-500/10 px-4 py-2 text-sm text-purple-200 hover:bg-purple-500/15">
              Connect YouTube
            </a>
          )}
        </div>

        {loading ? (
          <p className="text-slate-400">Loading playlists…</p>
        ) : error ? (
          <p className="text-slate-400">{error}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {playlists.map((playlist) => (
              <div key={`${playlist.provider}-${playlist.id}`} className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/50">
                <div className="h-32 bg-gradient-to-br from-cyan-500/35 to-purple-500/35" />
                <div className="p-3">
                  <p className="font-medium text-white">{playlist.name}</p>
                  <p className="text-xs text-slate-400">{playlist.tracks} {t('common.tracks')} • {playlist.provider}</p>
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
