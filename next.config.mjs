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
  images: {
    // Development only: proxies with fake-IP DNS (Clash, Surge) resolve the
    // bucket's domain into 198.18.0.0/15, which the optimizer's SSRF guard
    // rejects. Production keeps the guard.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    // Generated cocktail images are served from the R2 bucket's custom domain.
    remotePatterns: [
      {
        protocol: "https",
        hostname: objectStorageHost,
      },
    ],
  },
  // The 0.x result page read the drink from browser storage; private drinks now
  // live at /drink/[id], so old bookmarks go back to the questionnaire.
  async redirects() {
    return [
      {
        source: "/:lang(cn|en)/cocktail/recommendation",
        destination: "/:lang/questions",
        permanent: false,
      },
    ];
  },
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
