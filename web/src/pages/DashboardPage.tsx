import { useI18n } from '../i18n/LanguageContext';

function DashboardPage() {
  const { t } = useI18n();

  const stats = [
    { label: t('dashboard.tracksAnalyzed'), value: '1,240', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.2)]' },
    { label: t('dashboard.scenesCreated'), value: '12', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]' },
  ];

  const recentScenes = [
    { name: 'Midnight Drive', date: 'Oct 24, 2023', tracks: 42 },
    { name: 'Summer House', date: 'Oct 21, 2023', tracks: 128 },
    { name: 'Lo-Fi Study', date: 'Oct 15, 2023', tracks: 56 },
  ];

  return (
    <section className="space-y-8">
      <header className="card-panel relative overflow-hidden p-8">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-display text-5xl font-bold text-white max-sm:text-4xl">{t('dashboard.heroTitle')}</h2>
          <p className="mt-4 text-lg text-slate-400">{t('dashboard.heroText')}</p>
          <button className="gradient-cta mt-6 flex items-center gap-3 px-6 py-4 font-semibold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.25)] transition hover:scale-[1.02]">
            <span className="text-xl">+</span>
            {t('dashboard.createScene')}
          </button>
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-25" />
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <article key={item.label} className="card-panel flex items-center gap-4 p-6">
            <div className={`h-12 w-12 rounded-xl border border-white/10 bg-slate-900 ${item.glow}`} />
            <div>
              <p className="text-3xl font-semibold text-white">{item.value}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
            </div>
          </article>
        ))}

        <article className="card-panel flex items-center justify-center border-dashed border-cyan-400/20 p-6 text-slate-400">
          {t('dashboard.syncLibraries')}
        </article>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-display text-3xl font-semibold text-white">{t('dashboard.recentScenes')}</h3>
          <button className="text-cyan-300 hover:text-cyan-200">{t('common.viewAll')}</button>
        </div>

        <div className="space-y-3">
          {recentScenes.map((scene) => (
            <article key={scene.name} className="card-panel flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-cyan-500/35 to-purple-500/35" />
                <div>
                  <p className="font-semibold text-white">{scene.name}</p>
                  <p className="text-sm text-slate-400">{t('common.created')} {scene.date}</p>
                </div>
              </div>
              <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">{scene.tracks} {t('common.tracks')}</span>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default DashboardPage;
