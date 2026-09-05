/**
 * SSRF guard for server-side image downloads.
 *
 * Kept free of `server-only` so the rules can be unit tested directly; the
 * module holds no credentials and performs no I/O. The pipeline that actually
 * fetches is server-only.
 *
 * Providers serve images from a different host than their API: SiliconFlow's
 * endpoint is `api.siliconflow.cn` while the returned image URLs point at its
 * object-storage CDN. Deriving the allowlist from IMAGE_API_URL alone therefore
 * rejects every real image, which is why delivery hosts are listed explicitly.
 */
const DEFAULT_IMAGE_DELIVERY_HOSTS = [
  "bizyair-prod.oss-cn-shanghai.aliyuncs.com",
  "sc-maas.oss-cn-shanghai.aliyuncs.com",
];

export function getAllowedImageHosts(): Set<string> {
  const hosts = new Set<string>(DEFAULT_IMAGE_DELIVERY_HOSTS);

  const configured = process.env.IMAGE_FETCH_HOST_ALLOWLIST;
  if (configured) {
    configured
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((host) => hosts.add(host));
  }

  // Some providers do serve images from their API host; harmless to include.
  if (process.env.IMAGE_API_URL) {
    try {
      hosts.add(new URL(process.env.IMAGE_API_URL).hostname);
    } catch {
      // A malformed IMAGE_API_URL simply contributes no host.
    }
  }

  return hosts;
}

/**
 * Requires HTTPS and an exact hostname match.
 *
 * Exact matching matters: a suffix check would accept
 * `bizyair-prod.oss-cn-shanghai.aliyuncs.com.evil.example`.
 */
export function isAllowedRemoteImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return false;
    }
    return getAllowedImageHosts().has(parsed.hostname);
  } catch {
    return false;
  }
}
