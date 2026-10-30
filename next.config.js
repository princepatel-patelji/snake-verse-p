/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Vercel build ke waqt TypeScript errors ko ignore karega taaki build fail na ho
    ignoreBuildErrors: true,
  },
  eslint: {
    // Vercel build ke waqt ESLint warnings/errors ko ignore karega
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
