/**
 * Admins are configured, not stored: ADMIN_EMAILS is a comma-separated list of
 * account emails allowed to use admin tools (e.g. the landing page editor).
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}
