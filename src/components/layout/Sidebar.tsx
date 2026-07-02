'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Logo from '@/components/ui/Logo';
import { onSyncProgress, initAutoSync } from '@/lib/offline/syncManager';

const navGroups = [
  {
    label: 'Daily',
    items: [
      { href: '/today', label: 'Today', icon: 'terminal' },
      { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { href: '/calendar', label: 'Calendar', icon: 'calendar_today' },
    ],
  },
  {
    label: 'Plan',
    items: [
      { href: '/planner', label: 'Planner', icon: 'event_note' },
      { href: '/prayer-planner', label: 'Prayer Planner', icon: 'mosque' },
      { href: '/goals', label: 'Goals', icon: 'flag' },
      { href: '/weekly-review', label: 'Weekly Review', icon: 'fact_check' },
    ],
  },
  {
    label: 'Life',
    items: [
      { href: '/life-areas', label: 'Life Areas', icon: 'grid_view' },
      { href: '/habits', label: 'Habits', icon: 'cached' },
      { href: '/recovery', label: 'Recovery', icon: 'healing' },
      { href: '/money', label: 'Money', icon: 'account_balance_wallet' },
      { href: '/learning', label: 'Learning', icon: 'menu_book' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/ai-coach', label: 'AI Coach', icon: 'smart_toy' },
      { href: '/achievements', label: 'Achievements', icon: 'workspace_premium' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, sidebarOpen, setSidebarOpen, pendingSyncCount, refreshPendingCount, newAchievementCount } = useStore();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const updateStatus = () => setIsOnline(navigator.onLine);
    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  useEffect(() => {
    initAutoSync();
  }, []);

  useEffect(() => {
    const unsub = onSyncProgress((p) => {
      setIsSyncing(p.phase !== 'done' && p.phase !== 'error');
      if (p.phase === 'done' || p.phase === 'error') refreshPendingCount();
    });
    return unsub;
  }, [refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 10000);
    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile top bar */}
      <nav className="md:hidden flex justify-between items-center w-full px-4 h-14 bg-surface-container-lowest border-b border-outline-variant/15 fixed top-0 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined" aria-hidden="true">menu</span>
        </button>
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          {pendingSyncCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold flex items-center justify-center">
              {pendingSyncCount > 99 ? '99+' : pendingSyncCount}
            </span>
          )}
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-primary' : 'bg-error'}`} />
        </div>
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
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-primary' : 'bg-error'} ${isSyncing ? 'animate-pulse' : ''}`} />
            <span className="text-xs text-on-surface-variant font-body">
              {isSyncing ? 'Syncing...' : `Status: ${isOnline ? 'Online' : 'Offline'}`}
              {!isSyncing && pendingSyncCount > 0 && ` (${pendingSyncCount} pending)`}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-2 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-3">
              <div className="px-5 mb-1 font-label text-[10px] uppercase tracking-widest text-on-surface-variant/40">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 w-full pl-5 pr-4 py-2.5 text-sm font-label uppercase tracking-wide transition-all duration-200 nav-glow ${
                        isActive
                          ? 'text-primary font-bold border-l-2 border-primary bg-surface-container-low/50 nav-indicator-active'
                          : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-low/30 border-l-2 border-transparent'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[20px] transition-all duration-200"
                        aria-hidden="true"
                        style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                      {/* Achievement badge */}
                      {item.href === '/achievements' && newAchievementCount > 0 && (
                        <span className="ml-auto w-5 h-5 rounded-full bg-primary text-on-primary text-[9px] font-bold flex items-center justify-center">
                          {newAchievementCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Links */}
        <div className="space-y-0.5 border-t border-outline-variant/10 pt-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-on-surface-variant/60 hover:text-error pl-5 pr-4 py-2.5 text-sm font-label uppercase tracking-wide transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">logout</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
