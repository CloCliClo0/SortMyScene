import { useI18n } from '../i18n/LanguageContext';

function SortStudioPage() {
  const { t } = useI18n();

  const mockRows = [
    { index: '01', title: 'Digital Love', artist: 'Daft Punk', duration: '3:58' },
    { index: '02', title: 'Music Sounds Better With You', artist: 'Stardust', duration: '4:21' },
    { index: '03', title: 'Lady (Hear Me Tonight)', artist: 'Modjo', duration: '5:07' },
    { index: '04', title: 'Veridis Quo', artist: 'Daft Punk', duration: '5:44' },
  ];

  return (
    <section className="grid gap-6 xl:grid-cols-12">
      <article className="space-y-5 xl:col-span-5">
        <header>
          <h2 className="text-display text-5xl font-semibold text-white max-sm:text-4xl">{t('studio.title')}</h2>
          <p className="mt-2 text-slate-400">{t('studio.subtitle')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="glass-chip">{t('studio.spotifyActive')}</span>
            <span className="glass-chip">{t('studio.deezerLinked')}</span>
          </div>
        </header>

        <div className="card-panel p-5">
          <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">{t('studio.sourcePlaylist')}</label>
          <select className="w-full rounded-xl border border-white/10 bg-slate-950/80 p-3 text-white focus:border-cyan-400/50 focus:outline-none">
            <option>Favorites - 500 tracks</option>
            <option>Night Riders</option>
            <option>Warmup Mix</option>
          </select>
        </div>

        <div className="card-panel p-5">
          <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">{t('studio.sceneConfig')}</label>
          <input
            className="mb-3 w-full border-0 border-b-2 border-white/10 bg-transparent px-0 py-2 text-3xl font-semibold text-cyan-300 focus:border-cyan-400 focus:outline-none"
            value={t('studio.sceneName')}
            readOnly
          />
          <textarea
            className="h-24 w-full rounded-xl border border-white/10 bg-slate-900/60 p-3 text-slate-300"
            placeholder={t('studio.scenePrompt')}
          />
        </div>

        <div className="card-panel p-5">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-xs uppercase tracking-[0.16em] text-slate-500">{t('studio.seedTracks')}</label>
            <button className="text-cyan-300">+</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <div>
                <p className="font-medium text-white">Get Lucky</p>
                <p className="text-sm text-slate-400">Daft Punk</p>
              </div>
              <span className="text-slate-500">x</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <div>
                <p className="font-medium text-white">Midnight City</p>
                <p className="text-sm text-slate-400">M83</p>
              </div>
              <span className="text-slate-500">x</span>
            </div>
          </div>
        </div>

        <button className="gradient-cta w-full px-6 py-4 text-lg font-semibold shadow-[0_0_30px_rgba(34,211,238,0.3)]">{t('studio.sortWithGemini')}</button>
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
          {mockRows.map((row) => (
            <div key={row.index} className="flex items-center gap-3 rounded-xl border border-transparent p-3 hover:border-white/10 hover:bg-cyan-400/5">
              <span className="w-6 text-sm text-slate-500">{row.index}</span>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-500/40 to-purple-500/40" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{row.title}</p>
                <p className="text-sm text-slate-400">{row.artist}</p>
              </div>
              <span className="text-xs text-slate-500">{row.duration}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-4">
          <button className="w-full rounded-xl border border-purple-400/30 bg-purple-500/10 py-3 font-medium text-purple-200">{t('studio.exportToDeezer')}</button>
        </div>
      </article>
    </section>
  );
}

export default SortStudioPage;
