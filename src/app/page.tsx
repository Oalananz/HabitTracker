'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Logo from '@/components/ui/Logo';

function HomeContent() {
  const router = useRouter();
  const { checkAuth, user, isAuthLoading } = useStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthLoading) {
      if (user) {
        router.replace('/today');
      } else {
        router.replace('/login');
      }
    }
  }, [user, isAuthLoading, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center animate-fade-in flex flex-col items-center">
        <div className="mb-8">
          <Logo size="lg" />
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant text-sm font-mono">
          <span className="animate-blink text-primary">▊</span>
          <span>Initializing system...</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center p-4 text-primary font-mono text-xs animate-pulse">Loading system protocols...</div>}>
      <HomeContent />
    </Suspense>
  );
}
