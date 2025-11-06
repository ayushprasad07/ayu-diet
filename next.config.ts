import type { NextConfig } from "next";

const nextConfig: NextConfig & { eslint?: { ignoreDuringBuilds?: boolean } } = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // ✅ Skip ESLint during production build
  },
};

export default nextConfig;
