import test from "node:test";
import assert from "node:assert/strict";

/**
 * The logger decides JSON-vs-readable at module load, so production behavior has to
 * be imported after `NODE_ENV` is set. `node --test` gives each file its own
 * process, so this does not affect other tests.
 *
 * The import sits inside a helper rather than at the top level because tsx compiles
 * these tests to CJS, where top-level await is unavailable.
 */
// Cast because `NODE_ENV` is typed read-only; it is writable at runtime and this
// has to happen before the logger module is first imported.
(process.env as Record<string, string>).NODE_ENV = "production";

type CreateLogger = typeof import("../../utils/logger").createLogger;

async function loadCreateLogger(): Promise<CreateLogger> {
  return (await import("../../utils/logger")).createLogger;
}

/** Captures what the logger writes, returning the parsed JSON lines. */
function capture(fn: () => void): Array<Record<string, unknown>> {
  const lines: string[] = [];
  const originals = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.debug,
  };
  const record = (arg: unknown) => lines.push(String(arg));
  console.log = record;
  console.error = record;
  console.warn = record;
  console.debug = record;

  try {
    fn();
  } finally {
    Object.assign(console, originals);
  }

  return lines.map((line) => JSON.parse(line) as Record<string, unknown>);
}

test("production output is one parseable JSON object per call", async () => {
  const createLogger = await loadCreateLogger();
  const entries = capture(() => {
    createLogger("TestModule").info("Something happened");
  });

  assert.equal(entries.length, 1);
  assert.equal(entries[0].level, "INFO");
  assert.equal(entries[0].module, "TestModule");
  assert.equal(entries[0].message, "Something happened");
  assert.equal(typeof entries[0].time, "string");
});

test("each level maps to its own severity", async () => {
  const createLogger = await loadCreateLogger();
  const logger = createLogger("Levels");
  const entries = capture(() => {
    logger.info("i");
    logger.warn("w");
    logger.error("e");
    logger.debug("d");
  });

  assert.deepEqual(
    entries.map((e) => e.level),
    ["INFO", "WARN", "ERROR", "DEBUG"],
  );
});

test("an Error keeps its message and stack", async () => {
  // `JSON.stringify(new Error("boom"))` is `{}` — message and stack are
  // non-enumerable. Without explicit serialization the log says nothing at exactly
  // the moment it matters, which is the regression this guards.
  const createLogger = await loadCreateLogger();
  const entries = capture(() => {
    createLogger("Failing").error("Request failed", new Error("boom"));
  });

  const data = entries[0].data as Record<string, unknown>;
  assert.equal(data.name, "Error");
  assert.equal(data.message, "boom");
  assert.match(String(data.stack), /boom/);
});

test("an Error nested inside data is serialized too", async () => {
  const createLogger = await loadCreateLogger();
  const entries = capture(() => {
    createLogger("Nested").error("Publish failed", {
      id: "abc123",
      error: new Error("constraint violated"),
    });
  });

  const data = entries[0].data as Record<string, unknown>;
  assert.equal(data.id, "abc123");
  assert.equal(
    (data.error as Record<string, unknown>).message,
    "constraint violated",
  );
});

test("an error cause is preserved", async () => {
  const createLogger = await loadCreateLogger();
  const entries = capture(() => {
    createLogger("Caused").error(
      "Upstream failed",
      new Error("wrapper", { cause: new Error("root cause") }),
    );
  });

  const cause = (entries[0].data as Record<string, unknown>).cause as Record<
    string,
    unknown
  >;
  assert.equal(cause.message, "root cause");
});

test("forRequest stamps requestId on every line", async () => {
  const createLogger = await loadCreateLogger();
  const logger = createLogger("Route").forRequest("req-1234");
  const entries = capture(() => {
    logger.info("first");
    logger.error("second");
  });

  assert.deepEqual(
    entries.map((e) => e.requestId),
    ["req-1234", "req-1234"],
  );
});

test("requestId is absent when no request is bound", async () => {
  const createLogger = await loadCreateLogger();
  const entries = capture(() => {
    createLogger("Plain").info("no request here");
  });

  assert.ok(!("requestId" in entries[0]));
});

test("two bound loggers do not leak ids into each other", async () => {
  // The reason `forRequest` returns a new logger instead of setting a module-level
  // variable: concurrent requests interleave at every `await`, and a shared variable
  // would attach request B's id to request A's lines. Mislabeled correlation is
  // worse than none — it sends you reading the wrong request's history.
  const createLogger = await loadCreateLogger();
  const base = createLogger("Concurrent");
  const a = base.forRequest("aaa");
  const b = base.forRequest("bbb");

  const entries = capture(() => {
    a.info("from a");
    b.info("from b");
    a.info("from a again");
    base.info("from base");
  });

  assert.deepEqual(
    entries.map((e) => e.requestId),
    ["aaa", "bbb", "aaa", undefined],
  );
});

test("a circular reference is marked, not thrown on", async () => {
  // This test caught a real crash: the first version recursed until the stack
  // overflowed, and the `RangeError` was not catchable by the `JSON.stringify`
  // guard because it happened while building the object to stringify. A logger
  // that throws takes down the request it was trying to explain.
  const createLogger = await loadCreateLogger();
  const circular: Record<string, unknown> = { name: "loop" };
  circular.self = circular;

  const entries = capture(() => {
    createLogger("Circular").error("Bad payload", circular);
  });

  assert.equal(entries.length, 1);
  assert.equal(entries[0].message, "Bad payload");
  // The non-circular fields survive; only the cycle is replaced.
  const data = entries[0].data as Record<string, unknown>;
  assert.equal(data.name, "loop");
  assert.equal(data.self, "[circular]");
});

test("the same object appearing twice is not mistaken for a cycle", async () => {
  // A shared reference is not a cycle. Cycle detection that tracks every object
  // ever visited, rather than the current path, reports the second appearance as
  // circular and silently drops real data — the same user attached to two fields
  // would lose one of them.
  const createLogger = await loadCreateLogger();
  const shared = { id: "u1" };

  const entries = capture(() => {
    createLogger("Shared").info("Two references", {
      author: shared,
      editor: shared,
    });
  });

  const data = entries[0].data as Record<string, Record<string, unknown>>;
  assert.equal(data.author.id, "u1");
  assert.equal(data.editor.id, "u1");
});

test("a cycle deeper than one level is caught", async () => {
  const createLogger = await loadCreateLogger();
  const parent: Record<string, unknown> = { name: "parent" };
  const child: Record<string, unknown> = { name: "child", parent };
  parent.child = child;

  const entries = capture(() => {
    createLogger("DeepCycle").info("Tree", parent);
  });

  const data = entries[0].data as Record<string, Record<string, unknown>>;
  assert.equal(data.name as unknown, "parent");
  assert.equal(data.child.name, "child");
  assert.equal(data.child.parent as unknown, "[circular]");
});

test("data is omitted entirely when not passed", async () => {
  const createLogger = await loadCreateLogger();
  const entries = capture(() => {
    createLogger("NoData").info("just a message");
  });

  assert.ok(!("data" in entries[0]));
});

test("timestamp can be disabled", async () => {
  const createLogger = await loadCreateLogger();
  const entries = capture(() => {
    createLogger("NoTime", { timestamp: false }).info("untimed");
  });

  assert.ok(!("time" in entries[0]));
});
