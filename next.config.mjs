/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: `output: 'export'` was removed — it strips API routes (the /api/contact
  // serverless function), which silently broke the contact form. Vercel runs Next.js
  // natively, so the app deploys with working server functions without it.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
