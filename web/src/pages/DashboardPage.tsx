import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageContext';

type Scene = {
  id: number;
  name: string;
  description: string;
  created_at: string;
  image_url?: string | null;
  tracks: Array<{ id: number }>;
};

function DashboardPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScenes() {
      try {
        const res = await fetch('/api/scenes', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setScenes(Array.isArray(data) ? data : []);
        }
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    }
    loadScenes();
  }, []);

  const totalTracks = scenes.reduce((acc, s) => acc + (s.tracks?.length ?? 0), 0);
  const recentScenes = scenes.slice(0, 3);

  const stats = [
    {
      label: t('dashboard.tracksAnalyzed'),
      value: loading ? '—' : totalTracks.toLocaleString(),
      glow: 'shadow-[0_0_20px_rgba(34,211,238,0.2)]',
    },
    {
      label: t('dashboard.scenesCreated'),
      value: loading ? '—' : scenes.length.toString(),
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    },
  ];

  return (
    <section className="space-y-8">
      <header className="card-panel relative overflow-hidden p-8">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-display text-5xl font-bold text-white max-sm:text-4xl">{t('dashboard.heroTitle')}</h2>
          <p className="mt-4 text-lg text-slate-400">{t('dashboard.heroText')}</p>
          <button
            type="button"
            onClick={() => navigate('/studio')}
            className="gradient-cta mt-6 flex items-center gap-3 px-6 py-4 font-semibold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.25)] transition hover:scale-[1.02]"
          >
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

        <article
          onClick={() => navigate('/library')}
          className="card-panel flex cursor-pointer items-center justify-center border-dashed border-cyan-400/20 p-6 text-slate-400 transition hover:border-cyan-400/40 hover:text-slate-300"
        >
          {t('dashboard.syncLibraries')}
        </article>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-display text-3xl font-semibold text-white">{t('dashboard.recentScenes')}</h3>
          <button
            type="button"
            onClick={() => navigate('/scenes')}
            className="text-cyan-300 hover:text-cyan-200"
          >
            {t('common.viewAll')}
          </button>
        </div>

        {loading ? (
          <p className="text-slate-400">{t('common.loadingScenes')}</p>
        ) : recentScenes.length === 0 ? (
          <p className="text-slate-400">{t('dashboard.noScenes')}</p>
        ) : (
          <div className="space-y-3">
            {recentScenes.map((scene) => (
              <article
                key={scene.id}
                onClick={() => navigate(`/scenes/${scene.id}`)}
                className="card-panel flex cursor-pointer items-center justify-between p-4 transition hover:border-white/20"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/35 to-purple-500/35">
                    {scene.image_url && (
                      <img src={scene.image_url} alt={scene.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{scene.name}</p>
                    <p className="text-sm text-slate-400">
                      {t('common.created')} {new Date(scene.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
                  {scene.tracks?.length ?? 0} {t('common.tracks')}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default DashboardPage;
