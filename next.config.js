const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'nodemailer'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'eshop.fantsos.gr' },
      { protocol: 'https', hostname: 'netconnect.gr' },
    ],
  },
};

module.exports = withNextIntl(nextConfig);
