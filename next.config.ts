import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@supabase/ssr'],
  async redirects() {
    return [
      {
        source: '/prayer',
        destination: '/planner?view=prayer',
        permanent: true,
      },
      {
        source: '/prayer-planner',
        destination: '/planner?view=prayer',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
