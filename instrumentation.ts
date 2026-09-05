/**
 * Next.js startup hook. Runs once per server process.
 *
 * Surfaces missing object-storage configuration at boot instead of letting the
 * first image request fail, which is when a forgotten environment variable
 * would otherwise show up.
 *
 * Deliberately does not perform a network probe: that would add startup latency
 * and turn a transient upstream blip into a boot-time failure. Presence of
 * configuration is the part that actually gets forgotten during deployment.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { readObjectStoreConfig } = await import("@/lib/storage/object-store");
  const { createLogger } = await import("@/utils/logger");
  const logger = createLogger("Startup");

  const result = readObjectStoreConfig();

  if (!result.ok) {
    const message = `Object storage is not configured. Image generation will fail. Missing: ${result.missing.join(", ")}`;
    if (process.env.NODE_ENV === "production") {
      logger.error(message);
    } else {
      logger.warn(message);
    }
    return;
  }

  logger.info(
    `Object storage configured: bucket=${result.config.bucket} public=${result.config.publicBaseUrl}`,
  );
}
