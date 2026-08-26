/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Files (packs, ebooks, covers, bundles) live in /storage and are served
  // through signed-download API routes — never exposed statically.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
