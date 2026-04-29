import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/LanguageContext';

function LoginPage() {
  const { login, refresh } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from || '/';

  // Handle redirect back from Google OAuth
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('googleAuth') === 'success') {
      refresh().then(() => navigate(redirectTo, { replace: true }));
    } else if (params.get('error') === 'google_failed') {
      setError(t('auth.googleError'));
    }
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.login'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl">
        <h1 className="text-display text-4xl font-semibold text-white">{t('auth.login')}</h1>
        <p className="mt-1 text-sm text-slate-400">{t('auth.loginSubtitle')}</p>

        <label className="mt-5 block text-sm text-slate-300">{t('common.email')}</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white"
        />

        <label className="mt-4 block text-sm text-slate-300">{t('auth.password')}</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white"
        />

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="gradient-cta mt-5 w-full py-3 font-semibold text-slate-950 disabled:opacity-60"
        >
          {submitting ? t('auth.loading') : t('auth.login')}
        </button>

        <div className="mt-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-slate-500">{t('auth.orSeparator')}</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <a
          href="/api/auth/google"
          className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          {t('auth.continueWithGoogle')}
        </a>

        <p className="mt-4 text-sm text-slate-400">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-cyan-300 hover:text-cyan-200">
            {t('auth.signup')}
          </Link>
        </p>
      </form>
    </main>
  );
}

export default LoginPage;
