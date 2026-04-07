"use client";

const SIGNED_REMOTE_HOSTS = [
  "bizyair-prod.oss-cn-shanghai.aliyuncs.com",
];

export function shouldBypassNextImageOptimization(src: string | null | undefined) {
  if (!src) {
    return false;
  }

  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return true;
  }

  try {
    const url = new URL(src);
    const hasSignedQuery =
      url.searchParams.has("OSSAccessKeyId") ||
      url.searchParams.has("Expires") ||
      url.searchParams.has("Signature");

    return SIGNED_REMOTE_HOSTS.includes(url.hostname) && hasSignedQuery;
  } catch {
    return false;
  }
}
