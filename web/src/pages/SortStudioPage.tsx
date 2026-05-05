import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/LanguageContext';

type PlaylistOption = {
  id: string;
  name: string;
  image?: string | null;
  tracks: number;
  provider: 'spotify' | 'youtube';
};

type TrackRow = {
  id: string;
  title: string;
  artist: string;
  duration: string;
};

function SortStudioPage() {
  const { t } = useI18n();
  const [provider, setProvider] = useState<'spotify' | 'youtube'>('spotify');
  const [playlists, setPlaylists] = useState<PlaylistOption[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [sceneName, setSceneName] = useState('');
  const [scenePrompt, setScenePrompt] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [youtubeConnected, setYouTubeConnected] = useState(false);

  useEffect(() => {
    async function loadProviderStatus() {
      try {
        const [spotifyRes, youtubeRes] = await Promise.all([
          fetch('/api/tokens/spotify', { credentials: 'include' }),
          fetch('/api/tokens/youtube', { credentials: 'include' }),
        ]);
        setSpotifyConnected(spotifyRes.ok);
        setYouTubeConnected(youtubeRes.ok);
      } catch {
        setSpotifyConnected(false);
        setYouTubeConnected(false);
      }
    }

    loadProviderStatus();
  }, []);

  useEffect(() => {
    async function loadPlaylists() {
      setLoadingPlaylists(true);
      setStatusMessage('');
      setPlaylists([]);
      setSelectedPlaylistId('');
      try {
        const response = await fetch(`/api/playlists/${provider}`, { credentials: 'include' });
        if (!response.ok) {
          if (response.status === 401) {
            setStatusMessage(`Connect your ${provider} account before loading playlists.`);
          } else {
            setStatusMessage('Unable to load playlists.');
          }
          return;
        }
        const data = await response.json();
        const options = (data.items || data).map((item: any) => ({
          id: item.id,
          name: item.name || item.snippet?.title || 'Untitled playlist',
          tracks: item.tracks?.total ?? item.contentDetails?.itemCount ?? 0,
          provider,
        }));
        setPlaylists(options);
      } catch {
        setStatusMessage('Unable to load playlists.');
      } finally {
        setLoadingPlaylists(false);
      }
    }

    loadPlaylists();
  }, [provider]);

  useEffect(() => {
    async function loadTracks() {
      if (!selectedPlaylistId) {
        setTracks([]);
        return;
      }
      setLoadingTracks(true);
      setTracks([]);
      try {
        const response = await fetch(`/api/playlists/${provider}/${selectedPlaylistId}/tracks`, {
          credentials: 'include',
        });
        if (!response.ok) {
          setStatusMessage('Unable to load playlist tracks.');
          return;
        }
        const data = await response.json();
        const rows = (data.items || data).map((item: any, index: number) => {
          const snippet = item.track?.name ? item.track : item.snippet || {};
          return {
            id: item.id || `${index}`,
            title: snippet.name || snippet.title || 'Unknown title',
            artist: snippet.artists?.map((artist: any) => artist.name).join(', ') || snippet.videoOwnerChannelTitle || 'Unknown artist',
            duration: snippet.duration_ms
              ? Math.floor(snippet.duration_ms / 60000) + ':' + String(Math.floor((snippet.duration_ms % 60000) / 1000)).padStart(2, '0')
              : '–',
          };
        });
        setTracks(rows.slice(0, 20));
      } catch {
        setStatusMessage('Unable to load playlist tracks.');
      } finally {
        setLoadingTracks(false);
      }
    }

    loadTracks();
  }, [provider, selectedPlaylistId]);

  const selectedPlaylist = useMemo(
    () => playlists.find((item) => item.id === selectedPlaylistId),
    [playlists, selectedPlaylistId]
  );

  const handleCreateScene = async () => {
    if (!sceneName) {
      setStatusMessage('Enter a scene name before creating it.');
      return;
    }

    try {
      const response = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: sceneName,
          description: scenePrompt || `Playlist generated from ${selectedPlaylist?.name || provider}`,
          seed_tracks: tracks.map((track) => track.id),
        }),
      });
      if (!response.ok) {
        throw new Error('Unable to create scene');
      }
      setStatusMessage('Scene created successfully.');
      setSceneName('');
      setScenePrompt('');
    } catch {
      setStatusMessage('Unable to create scene.');
    }
  };

  return (
    <section className="grid gap-6 xl:grid-cols-12">
      <article className="space-y-5 xl:col-span-5">
        <header>
          <h2 className="text-display text-5xl font-semibold text-white max-sm:text-4xl">{t('studio.title')}</h2>
          <p className="mt-2 text-slate-400">{t('studio.subtitle')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="glass-chip">Spotify: {spotifyConnected ? 'connected' : 'not connected'}</span>
            <span className="glass-chip">YouTube: {youtubeConnected ? 'connected' : 'not connected'}</span>
          </div>
        </header>

        <div className="card-panel p-5">
          <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">Source provider</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setProvider('spotify')}
              className={`rounded-full px-4 py-2 text-sm ${provider === 'spotify' ? 'bg-cyan-500/20 text-cyan-200' : 'bg-white/5 text-slate-300'}`}
            >
              Spotify
            </button>
            <button
              type="button"
              onClick={() => setProvider('youtube')}
              className={`rounded-full px-4 py-2 text-sm ${provider === 'youtube' ? 'bg-cyan-500/20 text-cyan-200' : 'bg-white/5 text-slate-300'}`}
            >
              YouTube
            </button>
          </div>
          <label className="mt-5 mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">{t('studio.sourcePlaylist')}</label>
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/80 p-3">
              <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">Select playlist</label>
              <select
                className="w-full rounded-xl border border-white/10 bg-slate-950/80 p-3 text-white focus:border-cyan-400/50 focus:outline-none"
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
              >
                <option value="">Select a playlist</option>
                {playlists.map((playlist) => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.name} ({playlist.tracks} tracks)
                  </option>
                ))}
              </select>
            </div>
            {selectedPlaylist && (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/80 p-3">
                {selectedPlaylist.image ? (
                  <img src={selectedPlaylist.image} alt={selectedPlaylist.name} className="h-16 w-16 rounded-xl object-cover" />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-xl bg-slate-800 text-slate-500">No cover</div>
                )}
                <div>
                  <p className="font-semibold text-white">{selectedPlaylist.name}</p>
                  <p className="text-sm text-slate-400">{selectedPlaylist.tracks} tracks</p>
                </div>
              </div>
            )}
          </div>
          {loadingPlaylists && <p className="mt-3 text-sm text-slate-400">Loading playlists…</p>}
          {!loadingPlaylists && !playlists.length && (
            <p className="mt-3 text-sm text-slate-400">{statusMessage || `Connect ${provider} to load playlists.`}</p>
          )}
        </div>

        <div className="card-panel p-5">
          <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">{t('studio.sceneConfig')}</label>
          <input
            className="mb-3 w-full border-0 border-b-2 border-white/10 bg-transparent px-0 py-2 text-3xl font-semibold text-cyan-300 focus:border-cyan-400 focus:outline-none"
            value={sceneName}
            onChange={(e) => setSceneName(e.target.value)}
            placeholder="Scene name"
          />
          <textarea
            className="h-24 w-full rounded-xl border border-white/10 bg-slate-900/60 p-3 text-slate-300"
            placeholder={t('studio.scenePrompt')}
            value={scenePrompt}
            onChange={(e) => setScenePrompt(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={handleCreateScene}
          className="gradient-cta w-full px-6 py-4 text-lg font-semibold shadow-[0_0_30px_rgba(34,211,238,0.3)]"
        >
          {t('studio.sortWithGemini')}
        </button>
        {statusMessage && <p className="mt-3 text-sm text-slate-300">{statusMessage}</p>}
      </article>

      <article className="card-panel flex h-full flex-col overflow-hidden xl:col-span-7 xl:min-h-[720px]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="text-2xl font-semibold text-white">{t('studio.resultTitle')}</h3>
            <p className="text-sm text-slate-400">{t('studio.resultSubtitle')}</p>
          </div>
          <div className="flex gap-2 text-slate-400">
            <button className="rounded-lg border border-white/10 px-2 py-1">↗</button>
            <button className="rounded-lg border border-white/10 px-2 py-1">↺</button>
          </div>
        </div>

        <div className="flex-1 space-y-1 overflow-auto p-4">
          {loadingTracks ? (
            <p className="text-slate-400">Loading playlist tracks…</p>
          ) : tracks.length ? (
            tracks.map((row, index) => (
              <div key={row.id} className="flex items-center gap-3 rounded-xl border border-transparent p-3 hover:border-white/10 hover:bg-cyan-400/5">
                <span className="w-6 text-sm text-slate-500">{String(index + 1).padStart(2, '0')}</span>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-500/40 to-purple-500/40" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{row.title}</p>
                  <p className="text-sm text-slate-400">{row.artist}</p>
                </div>
                <span className="text-xs text-slate-500">{row.duration}</span>
              </div>
            ))
          ) : (
            <p className="text-slate-400">Select a playlist to preview the first tracks here.</p>
          )}
        </div>

        <div className="border-t border-white/10 p-4">
          <button className="w-full rounded-xl border border-purple-400/30 bg-purple-500/10 py-3 font-medium text-purple-200">
            Export to Deezer
          </button>
        </div>
      </article>
    </section>
  );
}

export default SortStudioPage;
