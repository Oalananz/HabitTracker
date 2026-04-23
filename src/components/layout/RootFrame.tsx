'use client';

import { usePathname } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';

const PUBLIC_PATH_PREFIXES = ['/login'];
const PUBLIC_PATHS = new Set(['/']);

function isPublicPath(pathname: string | null) {
  if (!pathname) return true;
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function RootFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isPublicPath(pathname)) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}