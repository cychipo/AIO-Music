import { NavLink } from 'react-router-dom';
import { Home, Search, Library, Music } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from 'antd';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/library', icon: Library, label: 'Library' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex flex-col h-full p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <Music className="text-white" size={20} />
        </div>
        <span className="font-bold text-xl text-text-primary">AIO Music</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-white shadow-pastel'
                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      {user && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="px-2 mb-2">
            <p className="font-semibold text-sm text-text-primary truncate">{user.displayName}</p>
            <p className="text-xs text-text-muted truncate">{user.email}</p>
          </div>
          <Button
            type="text"
            size="small"
            onClick={logout}
            className="w-full text-text-secondary"
          >
            Sign Out
          </Button>
        </div>
      )}
    </div>
  );
}
