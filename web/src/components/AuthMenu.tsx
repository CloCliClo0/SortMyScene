import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/LanguageContext';

function AuthMenu() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const initials = useMemo(() => {
    if (!user?.email) {
      return 'U';
    }
    return user.email
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-400/30 bg-slate-800 text-[10px] font-semibold text-cyan-300">
          {initials}
        </div>
        <span>{user ? user.email : t('auth.account')}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-white/10 bg-slate-950/95 p-2 shadow-[0_0_20px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          {user ? (
            <>
              <div className="mb-2 rounded-lg border border-white/10 bg-white/5 p-2">
                <p className="text-sm font-medium text-white">{user.email}</p>
                <p className="text-xs text-slate-400">{t('auth.connectedAs')} {user.email}</p>
              </div>
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5">
                {t('auth.profile')}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-red-200 hover:bg-red-500/10"
              >
                {t('auth.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5" onClick={() => setIsOpen(false)}>
                {t('auth.login')}
              </Link>
              <Link
                to="/register"
                className="mt-1 block w-full rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-left text-sm text-cyan-200 hover:bg-cyan-400/20"
                onClick={() => setIsOpen(false)}
              >
                {t('auth.signup')}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AuthMenu;
