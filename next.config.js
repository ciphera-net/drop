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
  // * Silence Turbopack warning. PWA is disabled in dev, so webpack config from next-pwa is not critical for dev.
  turbopack: {},
}

module.exports = withPWA(nextConfig)
