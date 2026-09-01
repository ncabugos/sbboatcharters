/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: `output: 'export'` was removed — it strips API routes (the /api/contact
  // serverless function), which silently broke the contact form. Vercel runs Next.js
  // natively, so the app deploys with working server functions without it.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Ported from the old public/.htaccess, which Vercel never executed (no Apache),
  // so these headers were not actually being sent by the live site.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
