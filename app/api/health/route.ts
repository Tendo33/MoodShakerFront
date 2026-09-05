import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createRequestId } from "@/lib/http/request-context";
import { createLogger } from "@/utils/logger";

const logger = createLogger("HealthRoute");

/**
 * Never prerendered. A health check answered from a build-time snapshot reports the
 * state of the build machine, not of this running instance — the same failure mode
 * that shipped an empty sitemap earlier in this project.
 */
export const dynamic = "force-dynamic";

/** Nothing should ever cache a liveness answer. */
const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
} as const;

/**
 * How long a dependency check may take before it is called a failure.
 *
 * Must exceed the dependency's cold-start time, or the check reports a dependency
 * that is merely asleep as one that is broken. Measured on this project's Neon
 * instance, which suspends when idle: the first query after a quiet period took
 * 9963 ms, subsequent ones 600-1400 ms. At the 5 s this was first set to, every
 * health check following a quiet period returned 503.
 *
 * This value sits inside a chain that has to stay ordered:
 *
 *   probe timeout (15 s, docker-compose)  >  this (12 s)  >  cold start (~10 s)
 *
 * If the probe's timeout is not the largest, the probe gives up while the endpoint
 * is still producing a correct answer, and the endpoint's accuracy stops mattering.
 * Change one and check the others.
 */
const CHECK_TIMEOUT_MS = 12_000;

type CheckResult = {
  ok: boolean;
  durationMs: number;
  error?: string;
};

async function withTimeout<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`timed out after ${CHECK_TIMEOUT_MS}ms`)),
          CHECK_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    // Without this the timer keeps the event loop alive for the full timeout on
    // every successful check.
    if (timer) clearTimeout(timer);
  }
}

async function timed(work: () => Promise<unknown>): Promise<CheckResult> {
  const startedAt = Date.now();
  try {
    await withTimeout(work());
    return { ok: true, durationMs: Date.now() - startedAt };
  } catch (error) {
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      // Message only. A health endpoint is typically reachable without
      // authentication, and a stack trace would describe internals to anyone who
      // asks. The full error goes to the log with the request id.
      error: error instanceof Error ? error.message : "unknown error",
    };
  }
}

/**
 * Readiness check for orchestrators and uptime monitors.
 *
 * `GET /` was the previous health probe, which returns 200 from a static shell
 * whether or not the database is reachable: a container with a dead database
 * reported itself healthy and kept receiving traffic. This checks the dependencies
 * that actually decide whether a request can be served.
 *
 * 200 when every check passes, 503 when any fails, so a load balancer can act on
 * the status code without parsing the body.
 */
export async function GET() {
  const requestId = createRequestId();
  const requestLogger = logger.forRequest(requestId);

  const [database, rateLimitStore] = await Promise.all([
    // `SELECT 1` proves the connection works. It deliberately does not touch a
    // table, so a schema problem is reported by the next check rather than
    // hidden inside this one.
    timed(() => prisma.$queryRaw`SELECT 1`),

    // The rate-limit table is a separate check because a missing one is a
    // deployment error in production, not a degraded extra. This project treats
    // it that way at request time, so readiness should agree.
    timed(
      () =>
        prisma.$queryRaw(
          Prisma.sql`SELECT 1 FROM rate_limit_buckets LIMIT 1`,
        ) as Promise<unknown>,
    ),
  ]);

  const checks = { database, rateLimitStore };
  const healthy = database.ok && rateLimitStore.ok;

  if (!healthy) {
    // Logged with the full error, unlike the response body.
    requestLogger.error("Health check failed", { checks });
  }

  return NextResponse.json(
    {
      status: healthy ? "ok" : "unhealthy",
      requestId,
      checks,
    },
    { status: healthy ? 200 : 503, headers: NO_STORE },
  );
}
