'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Logo from '@/components/ui/Logo';
import { performBackup, onSyncProgress, isSyncInProgress, type SyncResult } from '@/lib/offline/syncManager';

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
  const { user, logout, sidebarOpen, setSidebarOpen, pendingSyncCount, refreshPendingCount } = useStore();
  const [isOnline, setIsOnline] = useState(true);
  const [isBacking, setIsBacking] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);

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
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 10000);
    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  const handleBackup = useCallback(async () => {
    if (isSyncInProgress()) return;
    setIsBacking(true);
    setSyncMessage('Starting backup...');
    setSyncProgress(0);

    const unsub = onSyncProgress((p) => {
      setSyncMessage(p.message);
      if (p.total > 0) setSyncProgress(Math.round((p.current / p.total) * 100));
    });

    try {
      const result: SyncResult = await performBackup();
      await refreshPendingCount();
      if (result.success) {
        setSyncMessage(`✓ ${result.pushed} changes synced`);
      } else {
        setSyncMessage(`⚠ ${result.failed} failed, ${result.pushed} synced`);
      }
      setTimeout(() => { setSyncMessage(''); setSyncProgress(0); }, 4000);
    } catch {
      setSyncMessage('Backup failed');
      setTimeout(() => setSyncMessage(''), 3000);
    } finally {
      setIsBacking(false);
      unsub();
    }
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
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-primary' : 'bg-error'}`} />
            <span className="text-xs text-on-surface-variant font-body">
              Status: {isOnline ? 'Online' : 'Offline'}
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
              </Link>
            );
          })}
        </nav>

        {/* Backup Button */}
        <div className="px-4 mb-2">
          <button
            onClick={handleBackup}
            disabled={isBacking || !isOnline}
            className="w-full relative overflow-hidden bg-surface-container border border-outline-variant/20 text-on-surface font-headline font-bold py-3 px-4 rounded-sm hover:border-primary/40 transition-all disabled:opacity-40 uppercase tracking-wider text-xs flex items-center justify-center gap-2 group"
            id="backup-data-btn"
          >
            {isBacking ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                <span className="truncate">{syncMessage || 'Syncing...'}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px] text-primary group-hover:scale-110 transition-transform">cloud_upload</span>
                <span>Backup Data</span>
                {pendingSyncCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold flex items-center justify-center animate-pulse-glow">
                    {pendingSyncCount}
                  </span>
                )}
              </>
            )}
            {isBacking && syncProgress > 0 && (
              <div className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300" style={{ width: `${syncProgress}%` }} />
            )}
          </button>
          {syncMessage && !isBacking && (
            <div className="text-[10px] font-mono text-center mt-1 text-on-surface-variant animate-fade-in">
              {syncMessage}
            </div>
          )}
        </div>

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
