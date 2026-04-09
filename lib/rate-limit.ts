import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DeploymentDependencyError } from "@/lib/runtime-errors";
import { createLogger } from "@/utils/logger";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const rateLimitLogger = createLogger("Rate Limit");

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

type RateLimitRow = {
  count: number;
  reset_at: Date;
};

function shouldUseDatabaseRateLimit(): boolean {
  const databaseUrl = process.env.DATABASE_URL;
  return Boolean(databaseUrl && !databaseUrl.includes("placeholder"));
}

function consumeMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: existing.resetAt - now,
    };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterMs: 0,
  };
}

function getRetryAfterSeconds(retryAfterMs: number): string {
  return String(Math.max(1, Math.ceil(retryAfterMs / 1000)));
}

function isRateLimitTableMissingError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const metaCode =
      typeof error.meta?.code === "string" ? error.meta.code : undefined;
    const metaMessage =
      typeof error.meta?.message === "string" ? error.meta.message : undefined;

    return (
      error.code === "P2010" &&
      (metaCode === "42P01" ||
        Boolean(
          metaMessage &&
            metaMessage.includes("rate_limit_buckets") &&
            metaMessage.includes("does not exist"),
        ))
    );
  }

  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    meta?: { code?: unknown; message?: unknown };
    message?: unknown;
  };

  const metaCode =
    typeof candidate.meta?.code === "string" ? candidate.meta.code : undefined;
  const metaMessage =
    typeof candidate.meta?.message === "string" ? candidate.meta.message : undefined;
  const message =
    typeof candidate.message === "string" ? candidate.message : undefined;

  return Boolean(
    candidate.code === "P2010" &&
      (metaCode === "42P01" ||
        (metaMessage &&
          metaMessage.includes("rate_limit_buckets") &&
          metaMessage.includes("does not exist")) ||
        (message &&
          message.includes("rate_limit_buckets") &&
          message.includes("does not exist"))),
  );
}

function isDatabaseUnavailableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    message?: unknown;
  };
  const message =
    typeof candidate.message === "string"
      ? candidate.message.toLowerCase()
      : "";

  return Boolean(
    candidate.code === "P1001" ||
      message.includes("can't reach database server") ||
      message.includes("connect econnrefused") ||
      message.includes("connection terminated unexpectedly") ||
      (message.includes("database server") && message.includes("timed out")),
  );
}

export function classifyRateLimitError(error: unknown): {
  kind: "missing_store" | "database_unavailable" | "unknown";
  isDeploymentIssue: boolean;
} {
  if (isRateLimitTableMissingError(error)) {
    return { kind: "missing_store", isDeploymentIssue: true };
  }

  if (isDatabaseUnavailableError(error)) {
    return { kind: "database_unavailable", isDeploymentIssue: true };
  }

  return { kind: "unknown", isDeploymentIssue: false };
}

function summarizeRateLimitError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const code = Reflect.get(error, "code");
    return typeof code === "string" ? code : "unknown_error";
  }

  return "unknown_error";
}

export function shouldFailClosedOnRateLimitError(
  error: unknown,
  runtimeEnv: string = process.env.NODE_ENV || "development",
): boolean {
  return runtimeEnv === "production" && classifyRateLimitError(error).isDeploymentIssue;
}

export function buildRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Remaining": String(Math.max(result.remaining, 0)),
    ...(result.retryAfterMs > 0
      ? { "Retry-After": getRetryAfterSeconds(result.retryAfterMs) }
      : {}),
  };
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (!shouldUseDatabaseRateLimit()) {
    return consumeMemoryRateLimit(key, limit, windowMs);
  }

  const nextResetAt = new Date(Date.now() + windowMs);

  try {
    const rows = await prisma.$queryRaw<RateLimitRow[]>(Prisma.sql`
      INSERT INTO rate_limit_buckets ("key", count, reset_at, created_at, updated_at)
      VALUES (${key}, 1, ${nextResetAt}, NOW(), NOW())
      ON CONFLICT ("key") DO UPDATE
      SET
        count = CASE
          WHEN rate_limit_buckets.reset_at <= NOW() THEN 1
          WHEN rate_limit_buckets.count < ${limit} THEN rate_limit_buckets.count + 1
          ELSE rate_limit_buckets.count
        END,
        reset_at = CASE
          WHEN rate_limit_buckets.reset_at <= NOW() THEN ${nextResetAt}
          ELSE rate_limit_buckets.reset_at
        END,
        updated_at = NOW()
      RETURNING count, reset_at
    `);

    const current = rows[0];
    if (!current) {
      return consumeMemoryRateLimit(key, limit, windowMs);
    }

    const retryAfterMs = Math.max(current.reset_at.getTime() - Date.now(), 0);

    return {
      allowed: current.count <= limit,
      remaining: Math.max(limit - current.count, 0),
      retryAfterMs: current.count <= limit ? 0 : retryAfterMs,
    };
  } catch (error) {
    const classification = classifyRateLimitError(error);
    const logData = {
      bucketScope: key.split(":")[0] || "unknown",
      error: summarizeRateLimitError(error),
      kind: classification.kind,
    };

    if (shouldFailClosedOnRateLimitError(error)) {
      rateLimitLogger.error(
        "Shared rate limit storage is unavailable; refusing insecure fallback",
        logData,
      );
      throw new DeploymentDependencyError(
        classification.kind === "missing_store"
          ? "RATE_LIMIT_STORAGE_UNAVAILABLE"
          : "DATABASE_UNAVAILABLE",
        classification.kind === "missing_store"
          ? "Shared rate limit storage is unavailable."
          : "Database connection unavailable for shared rate limiting.",
      );
    }

    rateLimitLogger.warn(
      "Shared rate limit storage failed; falling back to in-memory limiter",
      logData,
    );
    return consumeMemoryRateLimit(key, limit, windowMs);
  }
}
