import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageContext';

type Track = {
  id: number;
  title: string;
  artist: string;
  duration_ms: number | null;
  provider: string;
};

type Scene = {
  id: number;
  name: string;
  description: string;
  created_at: string;
  image_url?: string | null;
  tracks: Track[];
};

function formatDuration(ms: number | null) {
  if (!ms) return '–';
  const m = Math.floor(ms / 60000);
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  return `${m}:${s}`;
}

function SceneDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [scene, setScene] = useState<Scene | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [sceneRes, tracksRes] = await Promise.all([
          fetch(`/api/scenes/${id}`, { credentials: 'include' }),
          fetch(`/api/tracks?sceneId=${id}`, { credentials: 'include' }),
        ]);
        if (!sceneRes.ok) {
          navigate('/scenes', { replace: true });
          return;
        }
        const sceneData = await sceneRes.json();
        setScene(sceneData);
        setEditName(sceneData.name);
        setEditDesc(sceneData.description);

        if (tracksRes.ok) {
          const tracksData = await tracksRes.json();
          setTracks(tracksData.data || []);
        }
      } catch {
        navigate('/scenes', { replace: true });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(t('scenes.deleteConfirm'))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/scenes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) navigate('/scenes', { replace: true });
    } catch {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    setSaveMsg('');
    try {
      const res = await fetch(`/api/scenes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: editName, description: editDesc, seed_tracks: scene?.tracks?.map((t) => t.id) ?? [] }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setScene(updated);
      setEditing(false);
      setSaveMsg('Sauvegardé.');
    } catch {
      setSaveMsg('Erreur lors de la sauvegarde.');
    }
  };

  if (loading) {
    return (
      <section className="flex items-center justify-center py-24">
        <p className="text-slate-400">{t('common.loadingScenes')}</p>
      </section>
    );
  }

  if (!scene) return null;

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <button
          type="button"
          onClick={() => navigate('/scenes')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          ← {t('scenes.backToScenes')}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            {t('scenes.editScene')}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-full border border-red-300/40 bg-red-500/10 px-4 py-2 text-sm text-red-200 hover:bg-red-500/20 disabled:opacity-60"
          >
            {t('scenes.delete')}
          </button>
        </div>
      </header>

      {scene.image_url && (
        <div className="overflow-hidden rounded-2xl">
          <img src={scene.image_url} alt={scene.name} className="h-48 w-full object-cover" />
        </div>
      )}

      <div className="card-panel p-6">
        {editing ? (
          <div className="space-y-3">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border-0 border-b-2 border-white/10 bg-transparent px-0 py-2 text-3xl font-semibold text-cyan-300 focus:border-cyan-400 focus:outline-none"
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 p-3 text-slate-300 focus:border-cyan-400/50 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-full bg-cyan-500/20 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/30"
              >
                Sauvegarder
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-400"
              >
                Annuler
              </button>
            </div>
            {saveMsg && <p className="text-sm text-slate-300">{saveMsg}</p>}
          </div>
        ) : (
          <>
            <h2 className="text-display text-4xl font-semibold text-white">{scene.name}</h2>
            {scene.description && (
              <p className="mt-2 text-slate-400">{scene.description}</p>
            )}
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-600">
              {new Date(scene.created_at).toLocaleDateString()} · {tracks.length} {t('scenes.tracksCount')}
            </p>
          </>
        )}
      </div>

      <article className="card-panel overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 className="text-xl font-semibold text-white">Tracklist</h3>
          <span className="text-sm text-slate-400">{tracks.length} {t('scenes.tracksCount')}</span>
        </div>

        {tracks.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p>Aucun titre dans cette scène.</p>
            <button
              type="button"
              onClick={() => navigate('/studio')}
              className="mt-4 rounded-full border border-cyan-300/50 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200"
            >
              Ajouter des titres depuis le Studio
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {tracks.map((track, index) => (
              <div key={track.id} className="flex items-center gap-4 px-5 py-3 hover:bg-cyan-400/5">
                <span className="w-6 text-center text-sm text-slate-600">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500/40 to-purple-500/40" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{track.title}</p>
                  <p className="text-sm text-slate-400">{track.artist}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-500 sm:block">
                    {track.provider}
                  </span>
                  <span className="text-sm text-slate-500">{formatDuration(track.duration_ms)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

export default SceneDetailPage;
