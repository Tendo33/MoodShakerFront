import "server-only";

import { DeploymentDependencyError } from "@/lib/runtime-errors";
import { createR2ObjectStore } from "@/lib/storage/providers/r2";

export interface PutResult {
  key: string;
  url: string;
}

export interface ObjectStore {
  readonly id: string;
  put(key: string, body: Buffer, contentType: string): Promise<PutResult>;
  delete(key: string): Promise<void>;
}

export interface ObjectStoreConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
}

/**
 * Reads object storage configuration from the environment.
 * Returns the missing variable names instead of throwing so callers can decide
 * between failing the request and reporting a deployment problem.
 */
export function readObjectStoreConfig():
  | { ok: true; config: ObjectStoreConfig }
  | { ok: false; missing: string[] } {
  const raw = {
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
    R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
  };

  const missing = Object.entries(raw)
    .filter(([, value]) => !value || value.trim().length === 0)
    .map(([name]) => name);

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  return {
    ok: true,
    config: {
      accountId: String(raw.R2_ACCOUNT_ID),
      accessKeyId: String(raw.R2_ACCESS_KEY_ID),
      secretAccessKey: String(raw.R2_SECRET_ACCESS_KEY),
      bucket: String(raw.R2_BUCKET),
      publicBaseUrl: String(raw.R2_PUBLIC_BASE_URL).replace(/\/+$/, ""),
    },
  };
}

let cachedStore: ObjectStore | null = null;
let cachedConfigFingerprint = "";

/**
 * Returns the configured object store.
 * Throws DeploymentDependencyError when configuration is incomplete — image
 * storage has no safe fallback, so a missing bucket is a deployment error.
 */
export function getObjectStore(): ObjectStore {
  const result = readObjectStoreConfig();

  if (!result.ok) {
    throw new DeploymentDependencyError(
      "OBJECT_STORE_UNAVAILABLE",
      `Object storage is not configured. Missing: ${result.missing.join(", ")}.`,
    );
  }

  const fingerprint = `${result.config.accountId}:${result.config.bucket}:${result.config.publicBaseUrl}`;
  if (!cachedStore || cachedConfigFingerprint !== fingerprint) {
    cachedStore = createR2ObjectStore(result.config);
    cachedConfigFingerprint = fingerprint;
  }

  return cachedStore;
}

/** Builds the public URL for an object key. */
export function buildPublicUrl(publicBaseUrl: string, key: string): string {
  const normalizedBase = publicBaseUrl.replace(/\/+$/, "");
  const normalizedKey = key.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedKey}`;
}
