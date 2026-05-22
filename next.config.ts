import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.100.11'],
  serverExternalPackages: ['@supabase/ssr'],
};

export default nextConfig;
