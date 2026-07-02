'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Sidebar from '@/components/layout/Sidebar';
import Logo from '@/components/ui/Logo';
import ToastContainer from '@/components/ui/Toast';
import dayjs from 'dayjs';
import { networkStatus } from '@/lib/offline/networkStatus';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const {
    user,
    isAuthLoading,
    authInitialized,
    checkAuth,
    selectedDate,
    setSelectedDate,
    plannerDate,
    setPlannerDate,
    setOffline,
    initOfflineData,
    refreshPendingCount,
    sidebarCollapsed,
  } = useStore();

  useEffect(() => {
    if (!authInitialized) {
      checkAuth();
    }
    // Register Service Worker for PWA offline capability
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
        .catch((err) => console.error('Service Worker registration failed:', err));
    }
  }, [authInitialized, checkAuth]);

  // Initialize offline data cache after auth
  useEffect(() => {
    if (user) {
      initOfflineData();
      refreshPendingCount();
    }
  }, [user, initOfflineData, refreshPendingCount]);

  // Track network status
  useEffect(() => {
    const unsub = networkStatus.subscribe((online) => {
      setOffline(!online);
    });
    setOffline(!networkStatus.isOnline);
    return unsub;
  }, [setOffline]);

  useEffect(() => {
    if (authInitialized && !isAuthLoading && !user) {
      router.replace('/login');
    }
  }, [user, authInitialized, isAuthLoading, router]);

  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD');
    if (!selectedDate) setSelectedDate(today);
    if (!plannerDate) setPlannerDate(today);
  }, [plannerDate, selectedDate, setPlannerDate, setSelectedDate]);

  if (!authInitialized && isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in flex flex-col items-center">
          <div className="mb-6">
            <Logo size="lg" />
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant text-sm font-mono">
            <span className="animate-blink text-primary">▊</span>
            <span>Loading system modules...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className={`flex-1 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} pt-16 md:pt-0 min-h-screen transition-[margin] duration-200`}>
        <div className="p-4 md:px-8 md:pb-8 md:pt-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
