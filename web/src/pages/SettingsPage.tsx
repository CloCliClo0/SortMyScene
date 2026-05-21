import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/LanguageContext';

type ProviderStatus = 'loading' | 'connected' | 'not_connected';

function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();

  const [enhanceMetadata, setEnhanceMetadata] = useState(true);
  const [autoFillBpm, setAutoFillBpm] = useState(false);

  const [deezerStatus, setDeezerStatus] = useState<ProviderStatus>('loading');
  const [spotifyStatus, setSpotifyStatus] = useState<ProviderStatus>('loading');
  const [youtubeStatus, setYouTubeStatus] = useState<ProviderStatus>('loading');
  const [providerMessage, setProviderMessage] = useState('');
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const [saveMessage, setSaveMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

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

  }, [user, t]);

  useEffect(() => {
    async function loadProviders() {
      try {
        const [deezerRes, spotifyRes, youtubeRes] = await Promise.all([
          fetch('/api/tokens/deezer', { credentials: 'include' }),
          fetch('/api/tokens/spotify', { credentials: 'include' }),
          fetch('/api/tokens/youtube', { credentials: 'include' }),
        ]);
        setDeezerStatus(deezerRes.ok ? 'connected' : 'not_connected');
        setSpotifyStatus(spotifyRes.ok ? 'connected' : 'not_connected');
        setYouTubeStatus(youtubeRes.ok ? 'connected' : 'not_connected');
      } catch {
        setDeezerStatus('not_connected');
        setSpotifyStatus('not_connected');
        setYouTubeStatus('not_connected');
      }
    }
    loadProviders();
  }, []);

  const disconnectProvider = async (provider: string) => {
    setDisconnecting(provider);
    setProviderMessage('');
    try {
      const res = await fetch(`/api/tokens/${provider}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      setProviderMessage(t('settings.disconnected'));
      if (provider === 'spotify') setSpotifyStatus('not_connected');
      if (provider === 'youtube') setYouTubeStatus('not_connected');
      if (provider === 'deezer') setDeezerStatus('not_connected');
    } catch {
      setProviderMessage(t('settings.disconnectError'));
    } finally {
      setDisconnecting(null);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    setSaveMessage('');
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          theme: 'dark',
          language: lang,
        }),
      });
      if (!res.ok) throw new Error();
      await refresh();
      setSaveMessage('Saved successfully');
    } catch {
      setSaveMessage('Unable to save settings');
    }
  };

  const changePassword = async () => {
    if (!user || !currentPassword || !newPassword) return;
    setSavingPassword(true);
    setPasswordMessage('');
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, password: newPassword }),
      });
      if (!res.ok) throw new Error();
      setPasswordMessage(t('settings.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      setPasswordMessage(t('settings.passwordError'));
    } finally {
      setSavingPassword(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    setDeletingAccount(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      await logout();
      navigate('/login');
    } catch {
      setDeletingAccount(false);
      setConfirmDeleteOpen(false);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-display text-5xl font-semibold text-cyan-300 max-sm:text-4xl">{t('settings.title')}</h2>
        <p className="text-slate-400">{t('settings.subtitle')}</p>
      </header>

      {/* Account */}
      <article className="card-panel p-6">
        <h3 className="mb-4 text-display text-3xl font-semibold text-white">{t('settings.account')}</h3>
        {user ? (
          <div className="mb-4 flex items-center gap-3">
            <p className="text-sm text-slate-300">Email: {user.email}</p>
            {user.email_verified === false && (
              <a href="/verify-email" className="rounded-full border border-amber-300/50 px-3 py-0.5 text-xs text-amber-200 hover:bg-amber-400/10">
                {t('settings.verifyEmail')}
              </a>
            )}
          </div>
        ) : (
          <p className="mb-4 text-sm text-slate-400">{t('auth.loading')}</p>
        )}

        {providerMessage && (
          <p className={`mb-4 text-sm ${providerMessage.includes('Erreur') || providerMessage.includes('Error') || providerMessage.includes('impossible') || providerMessage.includes('failed') ? 'text-red-300' : 'text-cyan-300'}`}>
            {providerMessage}
          </p>
        )}

        <div className="space-y-3">
          {/* Spotify */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-semibold text-white">Spotify</p>
              <p className="text-sm text-slate-400">
                {spotifyStatus === 'loading' ? '…' : spotifyStatus === 'connected' ? t('settings.statusConnected') : t('settings.statusNotConnected')}
              </p>
            </div>
            {spotifyStatus === 'connected' ? (
              <button
                type="button"
                onClick={() => disconnectProvider('spotify')}
                disabled={disconnecting === 'spotify'}
                className="rounded-full border border-red-300/40 px-4 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
              >
                {disconnecting === 'spotify' ? t('settings.disconnecting') : t('settings.disconnect')}
              </button>
            ) : (
              <a href="/api/auth/spotify" className="rounded-full border border-cyan-300/50 px-4 py-1 text-xs text-cyan-200 hover:bg-cyan-500/10">
                {t('settings.connectSpotify')}
              </a>
            )}
          </div>

          {/* Deezer */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-semibold text-white">Deezer</p>
              <p className="text-sm text-slate-400">{t('settings.comingSoon')}</p>
            </div>
            <span className="rounded-full border border-white/15 px-4 py-1 text-xs text-slate-300">{t('settings.comingSoon')}</span>
          </div>

          {/* YouTube Music */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-semibold text-white">YouTube Music</p>
              <p className="text-sm text-slate-400">
                {youtubeStatus === 'loading' ? '…' : youtubeStatus === 'connected' ? t('settings.statusConnected') : t('settings.statusNotConnected')}
              </p>
            </div>
            {youtubeStatus === 'connected' ? (
              <button
                type="button"
                onClick={() => disconnectProvider('youtube')}
                disabled={disconnecting === 'youtube'}
                className="rounded-full border border-red-300/40 px-4 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
              >
                {disconnecting === 'youtube' ? t('settings.disconnecting') : t('settings.disconnect')}
              </button>
            ) : (
              <a href="/api/auth/youtube" className="rounded-full border border-cyan-300/50 px-4 py-1 text-xs text-cyan-200 hover:bg-cyan-500/10">
                {t('settings.connectYouTube')}
              </a>
            )}
          </div>

          <p className="text-sm text-slate-400">{t('settings.linkService')}</p>
        </div>
      </article>

      {/* Password change */}
      <article className="card-panel p-6">
        <h3 className="mb-4 text-display text-3xl font-semibold text-white">{t('settings.changePassword')}</h3>
        <div className="space-y-3">
          <input
            type="password"
            placeholder={t('settings.currentPassword')}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 focus:border-cyan-400/50 focus:outline-none"
          />
          <input
            type="password"
            placeholder={t('settings.newPassword')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 focus:border-cyan-400/50 focus:outline-none"
          />
          {passwordMessage && (
            <p className={`text-sm ${passwordMessage.includes('success') || passwordMessage.includes('succes') ? 'text-emerald-300' : 'text-red-300'}`}>
              {passwordMessage}
            </p>
          )}
          <button
            type="button"
            onClick={changePassword}
            disabled={savingPassword || !currentPassword || !newPassword}
            className="rounded-full border border-cyan-300/50 bg-cyan-500/10 px-5 py-2 text-sm text-cyan-200 hover:bg-cyan-500/15 disabled:opacity-50"
          >
            {savingPassword ? '…' : t('settings.savePassword')}
          </button>
        </div>
      </article>

      {/* AI preferences */}
      <article className="card-panel p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-display text-3xl font-semibold text-white">{t('settings.aiPrefs')}</h3>
            <p className="text-xs text-slate-500">{t('settings.comingSoon')}</p>
          </div>
          <button
            type="button"
            onClick={saveSettings}
            className="rounded-full border border-cyan-300/50 bg-cyan-500/10 px-5 py-3 text-sm text-cyan-200 hover:bg-cyan-500/15"
          >
            {lang === 'en' ? 'Save settings' : 'Sauvegarder'}
          </button>
        </div>
        {saveMessage && <p className="mb-4 text-sm text-slate-300">{saveMessage}</p>}
        <div className="space-y-4 opacity-50 pointer-events-none">
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
              onChange={(e) => setEnhanceMetadata(e.target.checked)}
              className="h-4 w-4 accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-white/10 p-3">
            <span>{t('settings.autoBpm')}</span>
            <input
              type="checkbox"
              checked={autoFillBpm}
              onChange={(e) => setAutoFillBpm(e.target.checked)}
              className="h-4 w-4 accent-cyan-400"
            />
          </label>
        </div>
      </article>

      {/* Appearance */}
      <article className="card-panel p-6">
        <h3 className="mb-4 text-display text-3xl font-semibold text-white">{t('settings.appearance')}</h3>

        {/* Language */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-slate-400">{t('lang.label')} :</span>
          <button
            type="button"
            onClick={() => setLang('fr')}
            className={`rounded-full px-3 py-1 text-xs ${lang === 'fr' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t('lang.fr')}
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`rounded-full px-3 py-1 text-xs ${lang === 'en' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t('lang.en')}
          </button>
        </div>

        <div className="rounded-xl border border-cyan-400/50 bg-slate-950 p-4 text-sm text-white">
          Sonic Obsidian <span className="ml-2 text-xs text-cyan-400">(actif)</span>
        </div>
      </article>

      {/* Support */}
      <article className="card-panel p-6">
        <h3 className="mb-4 text-display text-3xl font-semibold text-white">{t('settings.support')}</h3>
        <div className="space-y-2">
          <a
            href="mailto:support@sortmyscene.fr"
            className="block w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left text-slate-200 hover:border-cyan-400/50"
          >
            {t('settings.directSupport')}
          </a>
        </div>
      </article>

      {/* Danger zone */}
      <article className="card-panel border-red-300/30 bg-red-500/5 p-6">
        <h3 className="mb-2 text-display text-3xl font-semibold text-red-200">{t('settings.danger')}</h3>
        <p className="mb-4 text-slate-300">{t('settings.deleteAccountText')}</p>

        {!confirmDeleteOpen ? (
          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(true)}
            className="rounded-full border border-red-300/50 bg-red-200/10 px-6 py-2 text-sm text-red-100 hover:bg-red-200/20"
          >
            {t('settings.deleteAccount')}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={deleteAccount}
              disabled={deletingAccount}
              className="rounded-full border border-red-300/50 bg-red-500/20 px-6 py-2 text-sm text-red-100 hover:bg-red-500/30 disabled:opacity-50"
            >
              {deletingAccount ? '…' : t('settings.deleteAccountConfirm')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(false)}
              className="text-sm text-slate-400 hover:text-slate-200"
            >
              Annuler
            </button>
          </div>
        )}
      </article>
    </section>
  );
}

export default SettingsPage;
