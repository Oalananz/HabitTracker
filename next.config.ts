import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (see Dockerfile).
  output: 'standalone',
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
