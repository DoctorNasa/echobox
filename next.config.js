/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    // Handle node modules that need to be externalized
    config.externals.push('pino-pretty', 'lokijs', 'encoding')

    return config
  },
}

module.exports = nextConfig
