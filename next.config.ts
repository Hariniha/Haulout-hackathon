import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    // Skip 404 page build errors
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
