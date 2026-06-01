/** @type {import('next').NextConfig} */
const nextConfig = {
  // Types are hand-written pre-launch; regenerate with `supabase gen types typescript` after connecting
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.brickset.com' },
      { protocol: 'https', hostname: 'img.bricklink.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'cdn.rebrickable.com' },
    ],
  },
  serverExternalPackages: ['twilio'],
}

module.exports = nextConfig
