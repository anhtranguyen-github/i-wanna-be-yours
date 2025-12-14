/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/e-api/:path*', destination: `${process.env.EXPRESS_API_URL}/e-api/:path*` },
      { source: '/f-api/:path*', destination: `${process.env.FLASK_API_URL}/f-api/:path*` },
      { source: '/d-api/:path*', destination: `${process.env.DICTIONARY_API_URL}/d-api/:path*` },
      { source: '/h-api/:path*', destination: `${process.env.HANACHAN_API_URL}/:path*` },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}
module.exports = nextConfig
