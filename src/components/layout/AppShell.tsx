'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Sidebar from '@/components/layout/Sidebar';
import Logo from '@/components/ui/Logo';
import ToastContainer from '@/components/ui/Toast';
import dayjs from 'dayjs';

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
  } = useStore();

  useEffect(() => {
    if (!authInitialized) {
      checkAuth();
    }
  }, [authInitialized, checkAuth]);

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
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
