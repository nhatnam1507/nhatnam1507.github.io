import type { NextConfig } from 'next';

// Static export for GitHub Pages. trailingSlash:false emits out/cv.html, so
// the legacy /cv.html URL keeps working alongside /cv.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: false,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
