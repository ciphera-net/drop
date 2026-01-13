/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

const nextConfig = {
  reactStrictMode: true,
  // * Privacy-first: Disable analytics and telemetry
  productionBrowserSourceMaps: false,
  async redirects() {
    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.ciphera.net'
    return [
      {
        source: '/login',
        destination: `${authUrl}/login`,
        permanent: false,
      },
      {
        source: '/signup',
        destination: `${authUrl}/signup`,
        permanent: false,
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
