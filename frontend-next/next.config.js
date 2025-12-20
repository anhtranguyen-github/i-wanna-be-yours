/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/e-api/:path*', destination: `${process.env.EXPRESS_API_URL}/e-api/:path*` },
      { source: '/f-api/:path*', destination: `${process.env.FLASK_API_URL}/:path*` },
      { source: '/s-api/:path*', destination: `${process.env.STUDY_PLAN_API_URL}/:path*` },  // Study Plan Service (port 5500)
      { source: '/d-api/:path*', destination: `${process.env.DICTIONARY_API_URL}/d-api/:path*` },
      { source: '/h-api/:path*', destination: `${process.env.HANACHAN_API_URL}/:path*` },
    ]
  },
  async redirects() {
    return [
      // JLPT routes - Old to New
      {
        source: '/practice/jlpt/session/:examId',
        destination: '/jlpt/:examId',
        permanent: true,
      },
      {
        source: '/practice/jlpt/result/:examId',
        destination: '/jlpt/:examId/result',
        permanent: true,
      },
      {
        source: '/practice/jlpt',
        destination: '/jlpt',
        permanent: true,
      },
      // Quiz routes - Old to New
      {
        source: '/practice/quiz/create',
        destination: '/quiz/create',
        permanent: true,
      },
      {
        source: '/practice/quiz/:id',
        destination: '/quiz/:id',
        permanent: true,
      },
      {
        source: '/practice/quiz',
        destination: '/quiz',
        permanent: true,
      },
      // Chat routes - Old to New
      {
        source: '/chat/ai-tutor',
        destination: '/chat',
        permanent: true,
      },
      {
        source: '/chat/hanachan',
        destination: '/chat',
        permanent: true,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}
module.exports = nextConfig

