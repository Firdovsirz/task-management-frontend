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
};

export default nextConfig;
