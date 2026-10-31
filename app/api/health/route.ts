import { pingDatabase } from "@/lib/db/drinks";
import { logger } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * Liveness plus the one dependency every page needs. 503 while the database is
 * unreachable, so the container healthcheck stops routing traffic to it. The
 * timeout stays under the Docker healthcheck's so this answers first.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    await Promise.race([
      pingDatabase(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timed out")), 12_000)),
    ]);
    return Response.json(
      { status: "ok", durationMs: Date.now() - startedAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logger("health").error("Database check failed", { error });
    return Response.json(
      { status: "unavailable", durationMs: Date.now() - startedAt },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
