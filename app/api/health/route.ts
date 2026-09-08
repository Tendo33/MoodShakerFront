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
 * Upper bound on a single dependency check. This is a backstop, not the deadline
 * that usually decides the outcome.
 *
 * Prisma's own connect timeout fires first. With no `connect_timeout` in
 * `DATABASE_URL` it gives up at roughly 5 s, so a check against a suspended database
 * returns 503 with `durationMs` near 5009 and this value never applies. Set
 * `connect_timeout` on the connection string if you want this deadline to govern.
 *
 * Cold starts on this project's Neon instance are not deterministic — both a 5036 ms
 * failure and a 9956 ms success were observed, against 600-1400 ms warm. So a single
 * 503 during wake-up is expected, and what absorbs it is the probe's retry policy
 * (`retries: 3`, `start_period: 40s` in docker-compose.yml), not this number.
 *
 * Keep the probe's timeout (15 s) above this one, so that when this deadline does
 * fire the probe is still listening rather than having given up on its own.
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
