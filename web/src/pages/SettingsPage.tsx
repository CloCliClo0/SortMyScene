import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/LanguageContext';

type ProviderStatus = 'loading' | 'connected' | 'not_connected';

type Profile = {
  id: number;
  email: string;
  theme?: string;
  language?: string;
};

function SettingsPage() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [enhanceMetadata, setEnhanceMetadata] = useState(true);
  const [autoFillBpm, setAutoFillBpm] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [deezerStatus, setDeezerStatus] = useState<ProviderStatus>('loading');
  const [spotifyStatus, setSpotifyStatus] = useState<ProviderStatus>('loading');
  const [youtubeStatus, setYouTubeStatus] = useState<ProviderStatus>('loading');
  const [providerMessage, setProviderMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('spotifyAuth') === 'success') {
      setProviderMessage(t('settings.spotifyConnected'));
    } else if (params.get('spotifyAuth') === 'error') {
      setProviderMessage(t('settings.spotifyError'));
    } else if (params.get('youtubeAuth') === 'success') {
      setProviderMessage(t('settings.youtubeConnected'));
    } else if (params.get('youtubeAuth') === 'error') {
      setProviderMessage(t('settings.youtubeError'));
    } else if (params.get('deezerAuth') === 'success') {
      setProviderMessage(t('settings.deezerConnected'));
    } else if (params.get('deezerAuth') === 'error') {
      setProviderMessage(t('settings.deezerError'));
    }

    async function loadProfile() {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setProfile(data.user);
        setDarkMode(data.user.theme !== 'light');
      } catch {
        // ignore
      }
    }

    async function loadProviders() {
      try {
        const [deezerRes, spotifyRes, youtubeRes] = await Promise.all([
          fetch('/api/tokens/deezer', { credentials: 'include' }),
          fetch('/api/tokens/spotify', { credentials: 'include' }),
          fetch('/api/tokens/youtube', { credentials: 'include' }),
        ]);

        const deezerPayload = deezerRes.ok ? await deezerRes.json() : null;
        const spotifyPayload = spotifyRes.ok ? await spotifyRes.json() : null;
        const youtubePayload = youtubeRes.ok ? await youtubeRes.json() : null;

        setDeezerStatus(deezerPayload ? 'connected' : 'not_connected');
        setSpotifyStatus(spotifyPayload ? 'connected' : 'not_connected');
        setYouTubeStatus(youtubePayload ? 'connected' : 'not_connected');
      } catch {
        setDeezerStatus('not_connected');
        setSpotifyStatus('not_connected');
        setYouTubeStatus('not_connected');
      }
    }

    loadProfile();
    loadProviders();
  }, [t]);

  const saveSettings = async () => {
    if (!profile) return;
    setSaveMessage('');
    try {
      const response = await fetch(`/api/users/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          theme: darkMode ? 'dark' : 'light',
          language: profile.language || 'en',
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      setSaveMessage('Saved successfully');
    } catch {
      setSaveMessage('Unable to save settings');
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-display text-5xl font-semibold text-cyan-300 max-sm:text-4xl">{t('settings.title')}</h2>
        <p className="text-slate-400">{t('settings.subtitle')}</p>
      </header>

      <article className="card-panel p-6">
        <h3 className="mb-4 text-display text-3xl font-semibold text-white">{t('settings.account')}</h3>
        {profile ? (
          <p className="mb-4 text-sm text-slate-300">Email: {profile.email}</p>
        ) : (
          <p className="mb-4 text-sm text-slate-400">Loading profile…</p>
        )}
        {providerMessage && <p className="mb-4 text-sm text-cyan-300">{providerMessage}</p>}
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-semibold text-white">Spotify</p>
              <p className="text-sm text-slate-400">
                {spotifyStatus === 'connected' ? t('settings.statusConnected') : t('settings.statusNotConnected')}
              </p>
            </div>
            {spotifyStatus === 'connected' ? (
              <span className="rounded-full border border-emerald-300/50 px-4 py-1 text-xs text-emerald-200">{t('settings.connected')}</span>
            ) : (
              <a href="/api/auth/spotify" className="rounded-full border border-cyan-300/50 px-4 py-1 text-xs text-cyan-200 hover:bg-cyan-500/10">
                {t('settings.connectSpotify')}
              </a>
            )}
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-semibold text-white">Deezer</p>
              <p className="text-sm text-slate-400">{t('settings.comingSoon')}</p>
            </div>
            <span className="rounded-full border border-white/15 px-4 py-1 text-xs text-slate-300">{t('settings.comingSoon')}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-semibold text-white">YouTube Music</p>
              <p className="text-sm text-slate-400">
                {youtubeStatus === 'connected' ? t('settings.statusConnected') : t('settings.statusNotConnected')}
              </p>
            </div>
            {youtubeStatus === 'connected' ? (
              <span className="rounded-full border border-emerald-300/50 px-4 py-1 text-xs text-emerald-200">{t('settings.connected')}</span>
            ) : (
              <a href="/api/auth/youtube" className="rounded-full border border-cyan-300/50 px-4 py-1 text-xs text-cyan-200 hover:bg-cyan-500/10">
                {t('settings.connectYouTube')}
              </a>
            )}
          </div>
          <p className="text-sm text-slate-400">{t('settings.linkService')}</p>
        </div>
      </article>

      <article className="card-panel p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-display text-3xl font-semibold text-white">{t('settings.aiPrefs')}</h3>
            <p className="text-sm text-slate-400">Adjust how the app generates your scenes and metadata.</p>
          </div>
          <button
            type="button"
            onClick={saveSettings}
            className="rounded-full border border-cyan-300/50 bg-cyan-500/10 px-5 py-3 text-sm text-cyan-200 hover:bg-cyan-500/15"
          >
            Save settings
          </button>
        </div>
        {saveMessage && <p className="mb-4 text-sm text-slate-300">{saveMessage}</p>}
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-xs uppercase tracking-[0.16em] text-slate-500">
              <span>{t('settings.strict')}</span>
              <span>{t('settings.creative')}</span>
            </div>
            <input type="range" min={0} max={100} defaultValue={70} className="w-full accent-cyan-400" />
          </div>

          <label className="flex items-center justify-between rounded-lg border border-white/10 p-3">
            <span>{t('settings.enhanceMeta')}</span>
            <input
              type="checkbox"
              checked={enhanceMetadata}
              onChange={(event) => setEnhanceMetadata(event.target.checked)}
              className="h-4 w-4 accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-white/10 p-3">
            <span>{t('settings.autoBpm')}</span>
            <input
              type="checkbox"
              checked={autoFillBpm}
              onChange={(event) => setAutoFillBpm(event.target.checked)}
              className="h-4 w-4 accent-cyan-400"
            />
          </label>
        </div>
      </article>

      <article className="card-panel p-6">
        <h3 className="mb-4 text-display text-3xl font-semibold text-white">{t('settings.appearance')}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <button className="rounded-xl border border-cyan-400/50 bg-slate-950 p-4 text-left text-sm text-white">Sonic Obsidian</button>
          <button className="rounded-xl border border-white/10 bg-slate-900 p-4 text-left text-sm text-slate-300">Daylight Studio</button>
        </div>
        <label className="mt-4 flex items-center justify-between rounded-lg border border-white/10 p-3">
          <span>{t('settings.reduceMotion')}</span>
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(event) => setReduceMotion(event.target.checked)}
            className="h-4 w-4 accent-cyan-400"
          />
        </label>
        <label className="mt-4 flex items-center justify-between rounded-lg border border-white/10 p-3">
          <span>{t('settings.darkNeon')}</span>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={(event) => setDarkMode(event.target.checked)}
            className="h-4 w-4 accent-purple-400"
          />
        </label>
      </article>

      <article className="card-panel p-6">
        <h3 className="mb-4 text-display text-3xl font-semibold text-white">{t('settings.support')}</h3>
        <div className="space-y-2">
          <button className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:border-cyan-400/50">{t('settings.masteringPrompts')}</button>
          <button className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:border-cyan-400/50">{t('settings.discord')}</button>
          <button className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:border-cyan-400/50">{t('settings.patchNotes')}</button>
          <button className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:border-cyan-400/50">{t('settings.directSupport')}</button>
        </div>
      </article>

      <article className="card-panel border-red-300/30 bg-red-500/5 p-6">
        <h3 className="mb-2 text-display text-3xl font-semibold text-red-200">{t('settings.danger')}</h3>
        <p className="mb-4 text-slate-300">{t('settings.dangerText')}</p>
        <button className="rounded-full border border-red-300/50 bg-red-200/10 px-6 py-2 text-sm text-red-100">{t('settings.deleteAll')}</button>
      </article>
    </section>
  );
}

export default SettingsPage;
