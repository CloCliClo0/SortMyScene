import { useState } from 'react';
import { useI18n } from '../i18n/LanguageContext';

function SettingsPage() {
  const { t } = useI18n();
  const [darkMode, setDarkMode] = useState(true);
  const [enhanceMetadata, setEnhanceMetadata] = useState(true);
  const [autoFillBpm, setAutoFillBpm] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-display text-5xl font-semibold text-cyan-300 max-sm:text-4xl">{t('settings.title')}</h2>
        <p className="text-slate-400">{t('settings.subtitle')}</p>
      </header>

      <article className="card-panel p-6">
        <h3 className="mb-4 text-display text-3xl font-semibold text-white">{t('settings.account')}</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-semibold text-white">Spotify</p>
              <p className="text-sm text-slate-400">{t('settings.connectedAs')} alex_v_89</p>
            </div>
            <button className="rounded-full border border-red-300/50 px-4 py-1 text-xs text-red-200">{t('settings.disconnect')}</button>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-semibold text-white">Deezer</p>
              <p className="text-sm text-slate-400">{t('settings.connectedAs')} sonic_obsidian</p>
            </div>
            <button className="rounded-full border border-red-300/50 px-4 py-1 text-xs text-red-200">{t('settings.disconnect')}</button>
          </div>
          <button className="text-sm text-cyan-300">+ {t('settings.linkService')}</button>
        </div>
      </article>

      <article className="card-panel p-6">
        <h3 className="mb-4 text-display text-3xl font-semibold text-white">{t('settings.aiPrefs')}</h3>
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
