// Derived from R2_PUBLIC_BASE_URL so the allowed image host has a single source
// of truth. Hardcoding it would silently break images whenever the bucket domain
// changes. The fallback keeps `next build` working without R2 credentials.
const objectStorageHost = (() => {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) return "img.moodshaker.de";
  try {
    return new URL(base).hostname;
  } catch {
    return "img.moodshaker.de";
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // TypeScript 严格模式 - 不忽略构建错误
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    // Generated cocktail images are served from the R2 bucket's custom domain.
    // The previous entry pointed at a third-party OSS host whose links have
    // since expired; those rows are cleared by the image-url backfill.
    remotePatterns: [
      {
        protocol: "https",
        hostname: objectStorageHost,
      },
    ],
  },
  // 添加重写规则，将静态资源请求重定向到根路径
  async rewrites() {
    return [
      {
        source: "/:lang/:path*",
        destination: "/:path*",
        has: [
          {
            type: "header",
            key: "accept",
            value: "image/.*",
          },
        ],
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; img-src 'self' data: blob: https:; font-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https:; object-src 'none'; upgrade-insecure-requests",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
