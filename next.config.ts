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
        // HelloFresh CDN (fallback during development)
        protocol: 'https',
        hostname: 'img.hellofresh.com',
      },
      {
        protocol: 'https',
        hostname: 'www.hellofresh.es',
      },
    ],
  },
}

export default nextConfig
