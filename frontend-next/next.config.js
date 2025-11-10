/** @type {import('next').NextConfig} */
//const nextConfig = {basePath: '/grammarpoint',}
const nextConfig = {
  async rewrites() {
    return [
      { source: '/e-api/:path*', destination: 'http://localhost:8000/e-api/:path*' },
      { source: '/f-api/:path*', destination: 'http://localhost:5100/f-api/:path*' },
      { source: '/d-api/:path*', destination: 'http://localhost:5200/d-api/:path*' },
    ]
  },
}
module.exports = nextConfig
