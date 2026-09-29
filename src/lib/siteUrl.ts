/**
 * The public address the site is served from (e.g. https://habitterminal.app).
 * Used for absolute URLs in link previews, robots.txt and the sitemap.
 * Set SITE_URL at build time (see Dockerfile / docker-compose.yml).
 */
export const SITE_URL = new URL(process.env.SITE_URL || 'http://localhost:3000');
