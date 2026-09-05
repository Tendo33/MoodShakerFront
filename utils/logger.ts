/**
 * Unified logging utility.
 *
 * Emits one JSON object per line in production and a readable line in development.
 *
 * The previous version concatenated everything into a single string —
 * `[INFO][Cocktail API][2026-09-06T...] Generated recommendation\n{"id":"..."}` —
 * which no log aggregator can parse into fields. Worse, it truncated the JSON
 * payload at 500 characters mid-string, so the one place a large object mattered
 * (an upstream error body) was exactly where the log became unreadable.
 *
 * The call signature is unchanged: 20 files use `logger.info(msg, data)` and none
 * of them need to know the output shape.
 */

type LogLevel = "INFO" | "ERROR" | "DEBUG" | "WARN";

type LogFn = (message: string, data?: unknown) => void;

export interface Logger {
  info: LogFn;
  error: LogFn;
  warn: LogFn;
  debug: LogFn;
  /** Same logger, with `requestId` stamped on every line it emits. */
  forRequest: (requestId: string) => Logger;
}

interface LoggerOptions {
  module?: string;
  timestamp?: boolean;
  /**
   * Kept for call-site compatibility. Structured output does not truncate, because
   * truncating JSON produces a string that is neither readable nor parseable.
   */
  maxDataLength?: number;
  /**
   * Correlates every line from one request. Set by `logger.forRequest(id)` rather
   * than by a module-level variable: concurrent requests interleave at every
   * `await`, so a shared variable would attach request B's id to request A's logs.
   * Mislabeled correlation is worse than none — it sends you reading the wrong
   * request's history.
   *
   * `AsyncLocalStorage` would remove the need to thread it explicitly, but this
   * module is imported by 8 client components and `node:async_hooks` cannot be
   * bundled for the browser.
   */
  requestId?: string;
}

/**
 * Development gets colored, aligned, human-scannable lines. Production gets JSON.
 *
 * Checked at module load: the value cannot change within a process, and reading it
 * per log call showed up as measurable overhead in the request path.
 */
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const CONSOLE_METHOD: Record<LogLevel, "error" | "warn" | "debug" | "log"> = {
  ERROR: "error",
  WARN: "warn",
  DEBUG: "debug",
  INFO: "log",
};

/** ANSI colors, development only. */
const LEVEL_COLOR: Record<LogLevel, string> = {
  ERROR: "[31m",
  WARN: "[33m",
  DEBUG: "[90m",
  INFO: "[36m",
};
const RESET = "[0m";

/**
 * Converts a thrown value into something JSON can represent.
 *
 * `JSON.stringify(new Error("x"))` returns `{}` — message and stack are
 * non-enumerable. Logging an error without this yields an empty object, which is
 * the least useful possible output at the moment it matters most.
 */
function serializeValue(value: unknown, ancestors = new Set<object>()): unknown {
  if (!value || typeof value !== "object") return value;

  // A cycle would otherwise recurse until the stack overflows, and that
  // `RangeError` is not catchable by the `JSON.stringify` guard below — it happens
  // while building the object to be stringified, not while stringifying it. Any
  // circular payload would crash the request, at the exact moment the log was
  // trying to explain a failure.
  //
  // `ancestors` holds only the current path, and the entry is removed on the way
  // back out. Tracking every object ever visited instead would report the second
  // appearance of a *shared* reference as circular — `{author: u, editor: u}` would
  // silently lose `editor`, which is not a cycle at all.
  if (ancestors.has(value)) return "[circular]";
  ancestors.add(value);

  try {
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
        ...(value.cause === undefined
          ? {}
          : { cause: serializeValue(value.cause, ancestors) }),
      };
    }

    if (Array.isArray(value)) {
      return value.map((item) => serializeValue(item, ancestors));
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        serializeValue(v, ancestors),
      ]),
    );
  } finally {
    ancestors.delete(value);
  }
}

function emit(
  level: LogLevel,
  moduleName: string,
  message: string,
  data: unknown,
  options: LoggerOptions,
): void {
  const method = CONSOLE_METHOD[level];
  const includeTimestamp = options.timestamp ?? true;

  if (IS_PRODUCTION) {
    const entry: Record<string, unknown> = {
      level,
      module: moduleName,
      message,
    };
    if (includeTimestamp) entry.time = new Date().toISOString();
    if (options.requestId) entry.requestId = options.requestId;
    if (data !== undefined) entry.data = serializeValue(data);

    try {
      console[method](JSON.stringify(entry));
    } catch {
      // A circular reference in `data` would otherwise throw from inside the
      // logger and take down the request it was trying to describe.
      console[method](
        JSON.stringify({
          ...entry,
          data: "[unserializable]",
        }),
      );
    }
    return;
  }

  const parts = [`${LEVEL_COLOR[level]}${level}${RESET}`, `[${moduleName}]`];
  if (options.requestId) parts.push(`(${options.requestId.slice(0, 8)})`);
  parts.push(message);

  if (data === undefined) {
    console[method](parts.join(" "));
    return;
  }

  // Passing the object as a separate argument rather than stringifying it: the
  // terminal and browser both render it expandably, and nothing gets truncated.
  console[method](parts.join(" "), serializeValue(data));
}

/**
 * Creates a logger bound to a module name.
 *
 * @param moduleName Identifies the log source.
 * @param options Defaults applied to every call on this instance.
 */
export function createLogger(
  moduleName: string,
  options: LoggerOptions = {},
): Logger {
  const bound = (level: LogLevel) => (message: string, data?: unknown) =>
    emit(level, moduleName, message, data, options);

  return {
    info: bound("INFO"),
    error: bound("ERROR"),
    warn: bound("WARN"),
    debug: bound("DEBUG"),

    /**
     * A logger that stamps `requestId` on every line.
     *
     * Explicit rather than ambient so that one request's id can never leak into a
     * concurrent request's logs. Call it once at the top of a route handler and use
     * the result for the rest of that request.
     */
    forRequest: (requestId: string) =>
      createLogger(moduleName, { ...options, requestId }),
  };
}

// Pre-defined common loggers
export const cocktailLogger = createLogger("Cocktail API");
export const openaiLogger = createLogger("OpenAI Service");
export const imageLogger = createLogger("Image Service");
export const appLogger = createLogger("App");

/**
 * Client-side event helpers.
 *
 * Only the two methods that have callers. The previous version defined seven —
 * `appStart`, `pageNavigation`, `cacheOperation`, `networkRequest`, and
 * `performanceMetric` were never called from anywhere.
 */
export const safeLogger = {
  /**
   * A component crash. Takes the error, because the point of the log is to say what
   * broke — the previous version recorded only the component name, so a production
   * crash produced `Component error: ErrorBoundary` with no message and no stack.
   *
   * This runs in the browser, where the user already has the error in devtools, so
   * including it exposes nothing they cannot already see.
   */
  appError: (component: string, error?: unknown) =>
    appLogger.error("Component error", { component, error }),

  userInteraction: (action: string) => appLogger.debug("User action", { action }),
};
