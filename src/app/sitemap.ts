import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/siteUrl';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: new URL('/', SITE_URL).toString(), changeFrequency: 'monthly', priority: 1 },
    { url: new URL('/login', SITE_URL).toString(), changeFrequency: 'yearly', priority: 0.5 },
    { url: new URL('/privacy', SITE_URL).toString(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
