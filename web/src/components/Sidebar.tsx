import { Home, Wand2, Library, ListMusic, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageContext';

function Sidebar() {
  const { t } = useI18n();
  const navItems = [
    { to: '/', label: t('nav.dashboard'), icon: Home },
    { to: '/studio', label: t('nav.studio'), icon: Wand2 },
    { to: '/scenes', label: t('nav.scenes'), icon: ListMusic },
    { to: '/library', label: t('nav.library'), icon: Library },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[280px] border-r border-white/10 bg-slate-950/60 p-6 backdrop-blur-xl md:block">
      <div className="mb-10 flex items-center gap-3">
        <img src="/assets/img/logo_app.jpg" alt="SortMyScene logo" className="h-12 w-12 rounded-2xl object-cover" />
        <div>
          <p className="text-display bg-gradient-to-br from-cyan-400 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">{t('app.brand')}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{t('app.role')}</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all',
                isActive
                  ? 'border-r-2 border-r-cyan-400 bg-cyan-400/10 text-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.15)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white',
              ].join(' ')
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
