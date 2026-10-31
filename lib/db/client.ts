import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");

  // `prepare: false` keeps the client compatible with transaction-mode poolers
  // such as Neon's and PgBouncer.
  const client = postgres(url, { max: 10, prepare: false, connect_timeout: 10 });
  return drizzle(client, { schema });
}

type Db = ReturnType<typeof createDb>;

// Reused across hot reloads in development so each edit does not open a new pool.
const globalForDb = globalThis as unknown as { moodshakerDb?: Db };

export function getDb(): Db {
  globalForDb.moodshakerDb ??= createDb();
  return globalForDb.moodshakerDb;
}
