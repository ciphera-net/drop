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
}

module.exports = withPWA(nextConfig)
