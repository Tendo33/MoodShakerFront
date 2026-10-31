import "server-only";

import { lt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { rateLimits } from "@/lib/db/schema";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Fixed-window counter in Postgres, so every instance shares one budget.
 * There is deliberately no in-memory fallback: a per-process limit in a
 * multi-instance deployment is no limit at all, so a missing table fails the
 * request loudly instead.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const db = getDb();
  const resetAt = new Date(Date.now() + windowMs);

  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} <= now() then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} <= now() then excluded.reset_at else ${rateLimits.resetAt} end`,
      },
    })
    .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });

  // Expired buckets are swept occasionally rather than on a schedule.
  if (Math.random() < 0.02) {
    void db.delete(rateLimits).where(lt(rateLimits.resetAt, new Date())).catch(() => {});
  }

  return {
    allowed: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    retryAfterSeconds: Math.max(1, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000)),
  };
}
