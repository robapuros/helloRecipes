import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage CDN
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // HelloFresh CDN — used for images during import
        protocol: 'https',
        hostname: 'img.hellofresh.com',
      },
      {
        // HelloFresh CloudFront CDN
        protocol: 'https',
        hostname: 'd3hvwccx09j84u.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'www.hellofresh.es',
      },
    ],
  },
}

export default nextConfig
