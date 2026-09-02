import { FileText, LogOut, History, Home, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';

type Page = 'home' | 'history' | 'results';

export function Navbar({ page, onNavigate }: { page: Page; onNavigate: (p: Page) => void }) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItem = (target: Page, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => {
        onNavigate(target);
        setMenuOpen(false);
      }}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        page === target
          ? 'text-primary-600 bg-primary-50'
          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <nav className="sticky top-0 z-50 glass border-b border-neutral-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <FileText className="text-white" size={20} />
          </div>
          <span className="font-bold text-lg text-neutral-900 hidden sm:block">ResumeAI</span>
        </button>

        {user ? (
          <>
            <div className="hidden md:flex items-center gap-1">
              {navItem('home', 'Analyze', <Home size={16} />)}
              {navItem('history', 'History', <History size={16} />)}
              <div className="w-px h-6 bg-neutral-200 mx-2" />
              <span className="text-sm text-neutral-500 px-2 max-w-[160px] truncate">
                {user.email}
              </span>
              <Button variant="secondary" size="sm" onClick={signOut}>
                <LogOut size={14} />
                Sign Out
              </Button>
            </div>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </>
        ) : (
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onNavigate('home')}>
              Sign In
            </Button>
            <Button variant="primary" size="sm" onClick={() => onNavigate('home')}>
              Get Started
            </Button>
          </div>
        )}
      </div>

      {menuOpen && user && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 py-3 space-y-1">
          {navItem('home', 'Analyze', <Home size={16} />)}
          {navItem('history', 'History', <History size={16} />)}
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-sm text-neutral-500 truncate max-w-[180px]">{user.email}</span>
            <Button variant="secondary" size="sm" onClick={signOut}>
              <LogOut size={14} />
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
