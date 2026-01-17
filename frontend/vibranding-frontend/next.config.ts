import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://vibranding-backend-prod.eba-733fc2mn.us-east-2.elasticbeanstalk.com/:path*',
      },
    ];
  },
};

export default nextConfig;
