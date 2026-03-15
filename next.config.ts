import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance: Enable React strict mode for better debugging
  reactStrictMode: true,

  // Performance: Compress responses
  compress: true,

  // Performance: Generate ETags for caching
  generateEtags: true,

  // Performance: Enable powered by header removal (security + fewer bytes)
  poweredByHeader: false,

  // Security & Performance: Configure image optimization
  images: {
    // Limit image sizes to reduce server load
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Minimize image formats
    formats: ["image/avif", "image/webp"],
    // Cache optimized images for 60 days
    minimumCacheTTL: 5184000,
  },

  // Security & Performance: HTTP headers
  async headers() {
    return [
      {
        // Cache static assets aggressively
        source: "/:path*.(js|css|woff2|woff|ttf|ico|png|jpg|jpeg|svg|webp|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache API responses for tutor listings
        source: "/api/tutors",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=120",
          },
        ],
      },
      {
        // Cache individual tutor profiles
        source: "/api/tutors/:id",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=120, stale-while-revalidate=300",
          },
        ],
      },
      {
        // Security headers for all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
