import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/LanguageContext';

type Scene = {
  id: number;
  name: string;
  description: string;
  created_at: string;
  tracks: Array<{ id: number }>;
};

function MyScenesPage() {
  const { t } = useI18n();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScenes() {
      try {
        const response = await fetch('/api/scenes', {
          credentials: 'include',
        });

        if (!response.ok) {
          setScenes([]);
          return;
        }

        const data = await response.json();
        setScenes(Array.isArray(data) ? data : []);
      } catch {
        setScenes([]);
      } finally {
        setLoading(false);
      }
    }

    loadScenes();
  }, []);

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <h2 className="text-display text-5xl font-semibold text-white max-sm:text-4xl">{t('scenes.title')}</h2>
        <p className="text-slate-400">{t('scenes.subtitle')}</p>
        <input
          className="w-full rounded-xl border-b-2 border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none md:max-w-md"
          placeholder={t('scenes.search')}
        />
        <div className="flex flex-wrap gap-2">
          <span className="glass-chip border-cyan-400/50 text-cyan-300">{t('scenes.filterAll')}</span>
          <span className="glass-chip">{t('scenes.filterHighBpm')}</span>
          <span className="glass-chip">{t('scenes.filterMelodic')}</span>
          <span className="glass-chip">{t('scenes.filterLofi')}</span>
          <span className="glass-chip">{t('scenes.filterDark')}</span>
        </div>
      </header>

      {loading ? (
        <p className="text-slate-400">{t('common.loadingScenes')}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {scenes.map((scene) => (
            <article key={scene.id} className="card-panel overflow-hidden p-0">
              <div className="relative h-36 bg-gradient-to-br from-cyan-500/35 to-purple-500/35">
                <span className="absolute right-3 top-3 rounded-md bg-black/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                  128 BPM
                </span>
              </div>
              <div className="p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{scene.name}</h3>
                    <p className="text-sm text-slate-400">{scene.tracks?.length ?? 0} {t('common.tracks')}</p>
                  </div>
                  <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">{t('common.export')}</button>
                </div>
                <p className="line-clamp-2 text-sm text-slate-400">{scene.description}</p>
              </div>
            </article>
          ))}

          <article className="card-panel flex min-h-52 flex-col items-center justify-center border-dashed border-white/20 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/90 text-2xl">+</div>
            <p className="text-lg text-white">{t('scenes.createCardTitle')}</p>
            <p className="mt-1 text-sm text-slate-400">{t('scenes.createCardText')}</p>
          </article>

          {!scenes.length && <p className="text-slate-400">{t('common.noScenes')}</p>}
        </div>
      )}
    </section>
  );
}

export default MyScenesPage;
