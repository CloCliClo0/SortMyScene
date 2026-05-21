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

function MyScenesPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    async function loadScenes() {
      try {
        const response = await fetch('/api/scenes', { credentials: 'include' });
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

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm(t('scenes.deleteConfirm'))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/scenes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setScenes((prev) => prev.filter((s) => s.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = search.trim()
    ? scenes.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.description?.toLowerCase().includes(search.toLowerCase())
      )
    : scenes;

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-display text-5xl font-semibold text-white max-sm:text-4xl">{t('scenes.title')}</h2>
            <p className="text-slate-400">{t('scenes.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/studio')}
            className="rounded-full border border-cyan-300/50 bg-cyan-500/10 px-5 py-3 text-sm text-cyan-200 hover:bg-cyan-500/15"
          >
            {t('scenes.createCardTitle')}
          </button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border-b-2 border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none md:max-w-md"
          placeholder={t('scenes.search')}
        />
      </header>

      {loading ? (
        <p className="text-slate-400">{t('common.loadingScenes')}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((scene) => (
            <article
              key={scene.id}
              onClick={() => navigate(`/scenes/${scene.id}`)}
              className="card-panel cursor-pointer overflow-hidden p-0 transition hover:border-white/20"
            >
              <div className="relative h-36 overflow-hidden bg-gradient-to-br from-cyan-500/35 to-purple-500/35">
                {scene.image_url && (
                  <img src={scene.image_url} alt={scene.name} className="absolute inset-0 h-full w-full object-cover opacity-80" />
                )}
                <span className="absolute right-3 top-3 rounded-md bg-black/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                  {scene.tracks?.length ?? 0} {t('scenes.tracksCount')}
                </span>
              </div>
              <div className="p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-semibold text-white">{scene.name}</h3>
                    <p className="text-sm text-slate-400">
                      {new Date(scene.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, scene.id)}
                    disabled={deletingId === scene.id}
                    className="rounded-lg border border-red-300/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {t('scenes.delete')}
                  </button>
                </div>
                <p className="line-clamp-2 text-sm text-slate-400">{scene.description}</p>
              </div>
            </article>
          ))}

          <article className="card-panel flex min-h-52 flex-col items-center justify-center border-dashed border-white/20 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/90 text-2xl">
              +
            </div>
            <p className="text-lg text-white">{t('scenes.createCardTitle')}</p>
            <p className="mt-1 text-sm text-slate-400">{t('scenes.createCardText')}</p>
            <button
              type="button"
              onClick={() => navigate('/studio')}
              className="mt-4 rounded-full border border-cyan-300/50 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/15"
            >
              Go to studio
            </button>
          </article>

          {!filtered.length && search && (
            <p className="col-span-full text-slate-400">Aucune scène ne correspond à cette recherche.</p>
          )}
          {!scenes.length && !loading && (
            <p className="col-span-full text-slate-400">{t('common.noScenes')}</p>
          )}
        </div>
      )}
    </section>
  );
}

export default MyScenesPage;
