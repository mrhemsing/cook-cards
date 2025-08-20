/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hbxhwdttewefbhpwqgbd.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**'
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'lh4.googleusercontent.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'lh5.googleusercontent.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'lh6.googleusercontent.com',
        port: '',
        pathname: '/**'
      }
    ]
  }
};

module.exports = nextConfig;
