/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      {
        // Preload core card assets only on game/event pages where they are used
        source: '/serate/:path*',
        headers: [
          {
            key: 'Link',
            value: [
              '</cards/back.svg>; rel=preload; as=image',
              '</cards/frame-gold.svg>; rel=preload; as=image',
              '</cards/frame-selected.svg>; rel=preload; as=image',
            ].join(', '),
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
