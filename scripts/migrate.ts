/**
 * Applies pending migrations from ./drizzle. Run before the server starts;
 * safe to run repeatedly.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL ?? "";
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

async function main() {
  const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  await client.end();
  console.log("Migrations applied.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
