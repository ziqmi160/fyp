import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { Menu, Bell, LogOut, User } from 'lucide-react';
import NotificationDropdown from '../common/NotificationDropdown';
import RoleSwitcher from '../common/RoleSwitcher';

export default function MainLayout({ navItems, basePath, title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-secondary text-white transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
          <span className="text-lg font-bold">FYP System</span>
          <button className="lg:hidden p-2" onClick={() => setSidebarOpen(false)}>×</button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={`${basePath}/${item.path}`}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition"
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 lg:ml-64">
        <div className="sticky top-0 z-30">
          <RoleSwitcher />
          <header className="h-16 bg-card border-b shadow-sm flex items-center justify-between px-4">
            <button className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-secondary">{title}</h1>
            <div className="flex items-center gap-4">
              <NotificationDropdown />
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:inline">{user?.name}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 py-1 bg-white rounded-lg shadow-lg border">
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
        </div>

        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
