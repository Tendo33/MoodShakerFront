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
  // No `rewrites`. There used to be one mapping `/:lang/:path*` to `/:path*` for
  // any request whose `Accept` header matched `image/.*`, meant to fix localized
  // static asset URLs. It matched on a client-controlled header, so any request
  // that asked for an image could reach an unprefixed route — and localized asset
  // paths are not something the app generates. `proxy.ts` already skips locale
  // handling for static file extensions.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // No Content-Security-Policy here. It is set per-request in `proxy.ts`,
          // which is the only place a nonce can be generated. The static header
          // this replaces allowed `script-src 'unsafe-inline'`, permitting exactly
          // the inline injection a CSP exists to prevent.
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
