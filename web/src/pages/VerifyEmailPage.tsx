import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageContext';

function VerifyEmailPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (code.trim().length !== 6) {
      setError('Le code doit contenir 6 caractères.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/verification/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error((payload as { message?: string }).message || 'Code invalide.');
      }
      setSuccessMsg(t('verify.success'));
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de vérification.');
    } finally {
      setSubmitting(false);
    }
  };

  const resendCode = async () => {
    setResending(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/verification/send-code', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      setSuccessMsg(t('verify.resendSuccess'));
    } catch {
      setError('Impossible de renvoyer le code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/60 p-8 backdrop-blur-xl">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-3xl">
          ✉
        </div>
        <h1 className="text-display text-4xl font-semibold text-white">{t('verify.title')}</h1>
        <p className="mt-2 text-sm text-slate-400">{t('verify.subtitle')}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">{t('verify.codeLabel')}</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              required
              placeholder="AB1C2D"
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-center text-2xl font-mono font-semibold tracking-[0.4em] text-cyan-300 focus:border-cyan-400/60 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}
          {successMsg && <p className="text-sm text-emerald-300">{successMsg}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="gradient-cta w-full py-3 font-semibold text-slate-950 disabled:opacity-60"
          >
            {submitting ? t('verify.loading') : t('verify.submit')}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={resendCode}
            disabled={resending}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-slate-300 hover:bg-white/10 disabled:opacity-60"
          >
            {resending ? '...' : t('verify.resend')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="text-center text-sm text-slate-500 hover:text-slate-400"
          >
            {t('verify.skip')}
          </button>
        </div>
      </div>
    </main>
  );
}

export default VerifyEmailPage;
