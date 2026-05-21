import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AuthMenu from '../components/AuthMenu';
import BottomNav from '../components/BottomNav';
import Sidebar from '../components/Sidebar';
import { useI18n } from '../i18n/LanguageContext';

function AppShell() {
  const { lang, setLang, t } = useI18n();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-xl md:hidden">
        <div>
          <p className="text-display bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-xl font-bold text-transparent">{t('app.brand')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/70 px-1 py-1 text-xs">
            <button
              type="button"
              onClick={() => setLang('fr')}
              className={lang === 'fr' ? 'rounded-full bg-cyan-400/20 px-2 py-0.5 text-cyan-300' : 'px-2 py-0.5 text-slate-400'}
            >
              {t('lang.fr')}
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={lang === 'en' ? 'rounded-full bg-cyan-400/20 px-2 py-0.5 text-cyan-300' : 'px-2 py-0.5 text-slate-400'}
            >
              {t('lang.en')}
            </button>
          </div>
          <AuthMenu />
        </div>
      </header>

      <Sidebar />

      {user && user.email_verified === false && (
        <div className="sticky top-[57px] z-30 flex items-center justify-between gap-3 bg-amber-500/15 px-4 py-2 text-sm text-amber-200 md:top-0 md:ml-[280px] border-b border-amber-400/20">
          <span>{t('verify.banner')}</span>
          <Link to="/verify-email" className="shrink-0 rounded-full border border-amber-300/50 px-3 py-0.5 text-xs text-amber-100 hover:bg-amber-400/10">
            {t('verify.bannerAction')}
          </Link>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:ml-[280px] md:px-8 md:pb-8 md:pt-8">
        <div className="mb-4 hidden items-center justify-end gap-2 md:flex">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-2 py-1 text-xs">
            <span className="px-2 text-slate-400">{t('lang.label')}</span>
            <button
              type="button"
              onClick={() => setLang('fr')}
              className={lang === 'fr' ? 'rounded-full bg-cyan-400/20 px-2 py-0.5 text-cyan-300' : 'px-2 py-0.5 text-slate-400'}
            >
              {t('lang.fr')}
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={lang === 'en' ? 'rounded-full bg-cyan-400/20 px-2 py-0.5 text-cyan-300' : 'px-2 py-0.5 text-slate-400'}
            >
              {t('lang.en')}
            </button>
          </div>
          <AuthMenu />
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 backdrop-blur-xl md:p-8">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export default AppShell;
