import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/siteUrl';

// Only the public pages are indexable; the app itself sits behind sign-in.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/privacy'],
      disallow: ['/api/', '/today', '/dashboard', '/planner', '/goals', '/habits', '/money', '/learning',
        '/recovery', '/achievements', '/weekly-review', '/settings', '/life-areas', '/onboarding', '/ai-coach'],
    },
    sitemap: new URL('/sitemap.xml', SITE_URL).toString(),
  };
}
