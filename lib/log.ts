/**
 * One JSON line per event, so fields such as `requestId` and `durationMs` can
 * be filtered and graphed by whatever collects stdout.
 */

type Level = "info" | "warn" | "error";

function serialize(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack, cause: serialize(value.cause) };
  }
  return value;
}

function write(level: Level, scope: string, message: string, fields: Record<string, unknown> = {}) {
  const entry: Record<string, unknown> = { time: new Date().toISOString(), level, scope, message };
  for (const [key, value] of Object.entries(fields)) entry[key] = serialize(value);
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export function logger(scope: string, base: Record<string, unknown> = {}) {
  return {
    info: (message: string, fields?: Record<string, unknown>) => write("info", scope, message, { ...base, ...fields }),
    warn: (message: string, fields?: Record<string, unknown>) => write("warn", scope, message, { ...base, ...fields }),
    error: (message: string, fields?: Record<string, unknown>) => write("error", scope, message, { ...base, ...fields }),
  };
}
