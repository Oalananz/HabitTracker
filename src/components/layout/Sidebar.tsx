'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Logo from '@/components/ui/Logo';

const navItems = [
  { href: '/today', label: 'Today', icon: 'terminal' },
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/planner', label: 'Planner', icon: 'event_note' },
  { href: '/prayer-planner', label: 'Prayer Planner', icon: 'mosque' },
  { href: '/recovery', label: 'Recovery', icon: 'healing' },
  { href: '/goals', label: 'Goals', icon: 'flag' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar_today' },
  { href: '/habits', label: 'Habits', icon: 'cached' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, sidebarOpen, setSidebarOpen } = useStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile top bar */}
      <nav className="md:hidden flex justify-between items-center w-full px-4 h-14 bg-surface-container-lowest border-b border-outline-variant/15 fixed top-0 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <Logo size="sm" />
        <div className="w-8" />
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest border-r border-outline-variant/15 flex flex-col py-6 z-50 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* User Section */}
        <div className="px-6 mb-6">
          <div className="font-headline text-lg font-bold text-primary tracking-tighter">
            &gt; {user?.username || 'system/user'}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span className="text-xs text-on-surface-variant font-body">
              Status: Online
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 mt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 w-full pl-5 pr-4 py-2.5 text-sm font-label uppercase tracking-wide transition-all duration-150 ${
                  isActive
                    ? 'text-primary font-bold border-l-2 border-primary bg-surface-container-low/50'
                    : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-low/30 border-l-2 border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* New Entry Button */}
        <div className="px-4 mb-4">
          <Link
            href="/today"
            onClick={() => setSidebarOpen(false)}
            className="block w-full bg-scanline-gradient text-on-primary font-headline font-bold py-2.5 px-4 rounded-sm text-center hover:opacity-90 transition-opacity text-sm uppercase tracking-wider"
          >
            + New Entry
          </Link>
        </div>

        {/* Bottom Links */}
        <div className="space-y-0.5 border-t border-outline-variant/10 pt-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-on-surface-variant/60 hover:text-error pl-5 pr-4 py-2.5 text-sm font-label uppercase tracking-wide transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
