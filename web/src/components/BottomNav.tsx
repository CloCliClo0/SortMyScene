import { Home, Library, Settings, Sparkles, SquareStack } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageContext';

function BottomNav() {
  const { t } = useI18n();
  const navItems = [
    { to: '/', label: t('nav.dashboard'), icon: Home },
    { to: '/studio', label: t('nav.studio'), icon: Sparkles },
    { to: '/scenes', label: t('nav.scenes'), icon: SquareStack },
    { to: '/library', label: t('nav.library'), icon: Library },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/10 bg-slate-950/85 px-1 py-2 backdrop-blur-2xl md:hidden">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            [
              'flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] uppercase tracking-wider transition-all',
              isActive
                ? 'bg-cyan-400/10 text-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.2)]'
                : 'text-slate-400 hover:text-white',
            ].join(' ')
          }
        >
          <Icon size={16} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNav;
