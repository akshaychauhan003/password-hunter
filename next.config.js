/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'password-hunter-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: { serverComponentsExternalPackages: ['mongoose'] },
  webpack: (config) => {
    config.externals.push({ 'utf-8-validate': 'commonjs utf-8-validate', bufferutil: 'commonjs bufferutil' });
    return config;
  },
};

module.exports = withPWA(nextConfig);
