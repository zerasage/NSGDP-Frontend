import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import { createMDX } from "fumadocs-mdx/next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Pin tracing root to this app — avoids picking up ~/package-lock.json
  outputFileTracingRoot: projectRoot,

  // Production optimizations
  reactStrictMode: true,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Performance optimizations
  compress: true,
  
  // Output standalone for optimal deployment
  output: 'standalone',

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Custom redirects (if needed)
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/login',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'user-role',
            value: 'public',
          },
        ],
      },
    ];
  },
};

/** Compiles the MDX pages under src/content/docs for the /docs route. */
const withMDX = createMDX();

export default withMDX(nextConfig);
