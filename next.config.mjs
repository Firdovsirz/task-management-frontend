/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  // One static-generation worker: each is a separate Node process with its own heap, and on a
  // many-core server that is building next to other stacks the peak would grow with the cores.
  experimental: { cpus: 1 },
  // Platforms became spaces; old bookmarks still land in the right place. Temporary (307), since
  // browsers cache a permanent redirect and would keep leaving /platforms after a rollback.
  async redirects() {
    return [{ source: '/platforms', destination: '/spaces', permanent: false }];
  },
};

export default nextConfig;
