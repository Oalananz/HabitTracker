'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Logo from '@/components/ui/Logo';
import { onSyncProgress, initAutoSync } from '@/lib/offline/syncManager';
import { LIFE_AREAS } from '@/lib/lifeAreas';

/** href → page slug that has a dedicated page (not /life-areas/[id]) */
const LIFE_AREA_DEDICATED: Record<string, string> = {
  money: '/money',
  learning: '/learning',
};

function lifeAreaHref(id: string): string {
  return LIFE_AREA_DEDICATED[id] ?? `/life-areas/${id}`;
}

const navItems = [
  { href: '/today', label: 'Today', icon: 'terminal' },
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/habits', label: 'Habits', icon: 'cached' },
  { href: '/planner', label: 'Planner', icon: 'event_note' },
  { href: '/goals', label: 'Goals', icon: 'flag' },
  { href: '/life-areas', label: 'Life Areas', icon: 'grid_view', hasChildren: true },
  { href: '/recovery', label: 'Recovery', icon: 'healing' },
  { href: '/weekly-review', label: 'Weekly Review', icon: 'fact_check' },
  { href: '/achievements', label: 'Achievements', icon: 'workspace_premium' },
  { href: '/ai-coach', label: 'AI Coach', icon: 'smart_toy' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const {
    user, logout, sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed,
    pendingSyncCount, refreshPendingCount, newAchievementCount,
  } = useStore();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Life Areas sub-menu: auto-open when on any life-area route
  const isOnLifeArea = pathname === '/life-areas' || pathname.startsWith('/life-areas/');
  const [lifeAreasOpen, setLifeAreasOpen] = useState(isOnLifeArea);

  useEffect(() => {
    if (isOnLifeArea) setLifeAreasOpen(true);
  }, [isOnLifeArea]);

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
          aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={sidebarOpen}
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
        className={`fixed left-0 top-0 h-screen w-64 ${sidebarCollapsed ? 'md:w-16' : 'md:w-64'} bg-surface-container-lowest border-r border-outline-variant/15 flex flex-col py-6 z-50 transition-transform duration-200 md:transition-[width] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* User Section */}
        <div className={`mb-6 flex items-center justify-between ${sidebarCollapsed ? 'md:px-3' : 'px-6'}`}>
          <div className={sidebarCollapsed ? 'md:hidden' : ''}>
            <div className="font-headline text-lg font-bold text-primary tracking-tight">
              {user?.username || 'User'}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-primary' : 'bg-error'} ${isSyncing ? 'animate-pulse' : ''}`} />
              <span className="text-xs text-on-surface-variant font-body">
                {isSyncing ? 'Syncing...' : isOnline ? 'Online' : 'Offline'}
                {!isSyncing && pendingSyncCount > 0 && ` · ${pendingSyncCount} pending`}
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex text-on-surface-variant/60 hover:text-primary transition-colors flex-shrink-0"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {sidebarCollapsed ? 'menu' : 'left_panel_close'}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-1 overflow-y-auto overflow-x-hidden space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isLifeAreaParent = item.hasChildren;
            // For life areas parent: active when on /life-areas or any sub-page
            const isParentActive = isLifeAreaParent
              ? (pathname === item.href || pathname.startsWith('/life-areas/'))
              : isActive;

            if (isLifeAreaParent) {
              return (
                <div key={item.href}>
                  {/* Life Areas row — click toggles sub-list, link navigates */}
                  <div
                    className={`flex items-center gap-3 w-full pl-5 pr-2 py-2.5 text-sm font-label transition-all duration-200 nav-glow ${sidebarCollapsed ? 'md:justify-center md:px-0' : ''} ${
                      isParentActive
                        ? 'text-primary font-semibold border-l-2 border-primary bg-surface-container-low/60'
                        : 'text-on-surface-variant/75 hover:text-on-surface hover:bg-surface-container-low/30 border-l-2 border-transparent'
                    }`}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={isParentActive ? 'page' : undefined}
                      className="flex items-center gap-3 flex-1 min-w-0"
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <span
                        className={`material-symbols-outlined text-[20px] transition-all duration-200 flex-shrink-0 ${isParentActive ? 'text-primary' : ''}`}
                        aria-hidden="true"
                        style={isParentActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        {item.icon}
                      </span>
                      <span className={sidebarCollapsed ? 'md:hidden' : ''}>{item.label}</span>
                    </Link>
                    {/* Chevron toggle — hidden in collapsed mode */}
                    <button
                      onClick={() => setLifeAreasOpen((o) => !o)}
                      aria-label={lifeAreasOpen ? 'Collapse life areas' : 'Expand life areas'}
                      className={`flex-shrink-0 text-on-surface-variant/50 hover:text-primary transition-all duration-200 ${sidebarCollapsed ? 'md:hidden' : ''}`}
                    >
                      <span
                        className="material-symbols-outlined text-[18px] transition-transform duration-200"
                        style={{ transform: lifeAreasOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        aria-hidden="true"
                      >
                        expand_more
                      </span>
                    </button>
                  </div>

                  {/* Sub-list */}
                  <div
                    className={`overflow-hidden transition-all duration-200 ${sidebarCollapsed ? 'md:hidden' : ''}`}
                    style={{ maxHeight: lifeAreasOpen ? `${LIFE_AREAS.length * 44}px` : '0px' }}
                  >
                    {LIFE_AREAS.map((area) => {
                      const href = lifeAreaHref(area.id);
                      const subActive = pathname === href || pathname === `/life-areas/${area.id}`;
                      return (
                        <Link
                          key={area.id}
                          href={href}
                          onClick={() => setSidebarOpen(false)}
                          aria-current={subActive ? 'page' : undefined}
                          className={`flex items-center gap-2.5 w-full pl-11 pr-4 py-2 text-xs font-label transition-all duration-150 ${
                            subActive
                              ? 'text-on-surface font-semibold bg-surface-container-low/40'
                              : 'text-on-surface-variant/65 hover:text-on-surface hover:bg-surface-container-low/20'
                          }`}
                        >
                          <span
                            className="material-symbols-outlined text-[15px] flex-shrink-0"
                            aria-hidden="true"
                            style={{ color: area.color }}
                          >
                            {area.icon}
                          </span>
                          <span style={subActive ? { color: area.color } : undefined}>
                            {area.shortLabel}
                          </span>
                          {subActive && (
                            <span
                              className="ml-auto w-1 h-1 rounded-full flex-shrink-0"
                              style={{ backgroundColor: area.color }}
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 w-full pl-5 pr-4 py-2.5 text-sm font-label transition-all duration-200 nav-glow ${sidebarCollapsed ? 'md:justify-center md:px-0' : ''} ${
                  isActive
                    ? 'text-primary font-semibold border-l-2 border-primary bg-surface-container-low/60'
                    : 'text-on-surface-variant/75 hover:text-on-surface hover:bg-surface-container-low/30 border-l-2 border-transparent'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] transition-all duration-200 flex-shrink-0 ${isActive ? 'text-primary' : ''}`}
                  aria-hidden="true"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className={sidebarCollapsed ? 'md:hidden' : ''}>{item.label}</span>
                {/* Achievement badge */}
                {item.href === '/achievements' && newAchievementCount > 0 && (
                  <span className={`ml-auto w-5 h-5 rounded-full bg-primary text-on-primary text-[9px] font-bold flex items-center justify-center ${sidebarCollapsed ? 'md:hidden' : ''}`}>
                    {newAchievementCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Links */}
        <div className="space-y-0.5 border-t border-outline-variant/10 pt-2">
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Logout' : undefined}
            className={`flex items-center gap-3 w-full text-on-surface-variant/75 hover:text-error pl-5 pr-4 py-2.5 text-sm font-label transition-colors ${sidebarCollapsed ? 'md:justify-center md:px-0' : ''}`}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">logout</span>
            <span className={sidebarCollapsed ? 'md:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
