import { useI18n } from '../i18n/LanguageContext';

function RawLibraryPage() {
  const { t } = useI18n();
  const playlists = [
    { name: 'Midnight Cyber-Rave', tracks: 42, genre: 'Techno' },
    { name: 'Deep Bass Theory', tracks: 128, genre: 'EDM' },
    { name: 'Analog Dreams', tracks: 85, genre: 'Lo-Fi' },
    { name: 'Synthesizer Hits', tracks: 90, genre: 'Synthwave' },
  ];

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
                  <span className="text-3xl font-bold">1,248</span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{t('library.totalAssets')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Electro | Techno</span>
                  <span>70%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-900">
                  <div className="h-2 w-[70%] rounded-full bg-cyan-400" />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Future Pop</span>
                  <span>30%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-900">
                  <div className="h-2 w-[30%] rounded-full bg-purple-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-500">{t('library.avgBpm')}</p>
                  <p className="mt-1 text-xl text-white">128.4</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-500">{t('library.energy')}</p>
                  <p className="mt-1 text-xl text-white">{t('library.high')}</p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="card-panel">
          <h3 className="mb-3 text-lg font-semibold text-white">{t('library.ingests')}</h3>
          <div className="space-y-2 text-sm">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="font-medium">Neural Drift</p>
              <p className="text-slate-400">Dark / 128 BPM</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="font-medium">Hyper-Link</p>
              <p className="text-slate-400">BPM / Clean / 140</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="font-medium">System Failure</p>
              <p className="text-slate-400">Calibrating...</p>
            </div>
          </div>
        </article>
      </div>

      <article className="card-panel">
        <h3 className="mb-3 text-lg font-semibold text-white">{t('library.explorer')}</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {playlists.map((playlist) => (
            <div key={playlist.name} className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/50">
              <div className="h-32 bg-gradient-to-br from-cyan-500/35 to-purple-500/35" />
              <div className="p-3">
                <p className="font-medium text-white">{playlist.name}</p>
                <p className="text-xs text-slate-400">{playlist.tracks} {t('common.tracks')} • {playlist.genre}</p>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export default RawLibraryPage;
