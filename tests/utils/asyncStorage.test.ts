import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

/**
 * `utils/asyncStorage.ts` writes to `localStorage`, so it needs a DOM. jsdom
 * provides a working one — `setItem`, `getItem`, `removeItem`, `length`, and `key`
 * all behave — which is enough for this module without a real browser.
 *
 * The globals have to exist before the module is first imported, because its
 * constructor reads `localStorage`. `node --test` gives each file its own process,
 * so assigning to `globalThis` here does not affect other test files.
 */
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000/cn",
});
const domWindow = dom.window as unknown as Window & typeof globalThis;
const globals = globalThis as Record<string, unknown>;
globals.window = domWindow;
globals.localStorage = domWindow.localStorage;

type AsyncStorageModule = typeof import("../../utils/asyncStorage");

/**
 * The import sits in a helper rather than at the top level because tsx compiles
 * these tests to CJS, where top-level await is unavailable. Module caching makes
 * every call return the same singleton.
 */
async function load(): Promise<AsyncStorageModule> {
  return import("../../utils/asyncStorage");
}

/** Resolves to `"hung"` if the promise has not settled in time. */
function withDeadline<T>(work: Promise<T>, ms = 5_000): Promise<T | "hung"> {
  return Promise.race([
    work,
    new Promise<"hung">((resolve) => setTimeout(() => resolve("hung"), ms)),
  ]);
}

/** Distinct key prefix per test, so the shared singleton's cache cannot leak. */
let keySeq = 0;
function uniqueKey(name: string): string {
  return `test-${name}-${keySeq++}`;
}

test("a value survives a write and read", async () => {
  const { asyncStorage } = await load();
  const key = uniqueKey("roundtrip");

  await asyncStorage.setItem(key, { name: "Mojito", abv: 12 });

  assert.deepEqual(await asyncStorage.getItem(key), {
    name: "Mojito",
    abv: 12,
  });
});

test("the value actually reaches localStorage, not just the cache", async () => {
  // Reading back through `getItem` alone would pass even if nothing persisted,
  // because the cache answers first. This asserts the write went through.
  const { asyncStorage } = await load();
  const key = uniqueKey("persisted");

  await asyncStorage.setItem(key, ["gin", "tonic"]);

  assert.deepEqual(
    JSON.parse(domWindow.localStorage.getItem(key) as string),
    ["gin", "tonic"],
  );
});

test("a missing key reads as null", async () => {
  const { asyncStorage } = await load();

  assert.equal(await asyncStorage.getItem(uniqueKey("absent")), null);
});

test("removeItem clears both the store and the cache", async () => {
  const { asyncStorage } = await load();
  const key = uniqueKey("removed");

  await asyncStorage.setItem(key, "value");
  await asyncStorage.removeItem(key);

  assert.equal(domWindow.localStorage.getItem(key), null);
  // Via the public API too, which would still hit a stale cache entry if
  // `removeItem` only touched localStorage.
  assert.equal(await asyncStorage.getItem(key), null);
});

test("20 writes queued in one tick all resolve and all persist", async () => {
  // This is a regression test for a real hang, found by running this module under
  // jsdom rather than by reading it.
  //
  // `maxBatchSize` is 10. The 10th write filled the queue, which cleared the
  // pending timeout and called `processBatch`; that call returned immediately
  // because a batch was already in flight (`isProcessing`). At that point 10
  // operations sat in the queue with `batchTimeout` set to null and nothing left
  // to schedule them — so 10 of 20 writes were lost and their promises never
  // settled. In the UI that is a save spinner that turns forever, not an error.
  const { asyncStorage } = await load();
  const keys = Array.from({ length: 20 }, (_, i) => uniqueKey(`burst-${i}`));

  const settled = await withDeadline(
    Promise.all(keys.map((key, i) => asyncStorage.setItem(key, i))),
  );

  assert.notEqual(settled, "hung", "some writes never resolved");
  const persisted = keys.filter(
    (key) => domWindow.localStorage.getItem(key) !== null,
  );
  assert.equal(persisted.length, 20);
});

test("a burst far larger than one batch still drains completely", async () => {
  // Six full batches. Draining depends on `processBatch` re-scheduling whatever
  // arrived while it was busy; one missed re-schedule strands the remainder.
  const { asyncStorage } = await load();
  const keys = Array.from({ length: 60 }, (_, i) => uniqueKey(`flood-${i}`));

  const settled = await withDeadline(
    Promise.all(keys.map((key, i) => asyncStorage.setItem(key, i))),
    8_000,
  );

  assert.notEqual(settled, "hung");
  assert.equal(
    keys.filter((key) => domWindow.localStorage.getItem(key) !== null).length,
    60,
  );
});

test("values in a burst keep their own data", async () => {
  // Draining is not enough — a batching bug could resolve every promise while
  // writing one operation's value under another's key.
  const { asyncStorage } = await load();
  const entries = Array.from({ length: 15 }, (_, i) => ({
    key: uniqueKey(`distinct-${i}`),
    value: { index: i, label: `drink-${i}` },
  }));

  await withDeadline(
    Promise.all(entries.map(({ key, value }) => asyncStorage.setItem(key, value))),
  );

  for (const { key, value } of entries) {
    assert.deepEqual(
      JSON.parse(domWindow.localStorage.getItem(key) as string),
      value,
    );
  }
});

test("removeStorageKeysAsync removes every key it is given", async () => {
  const { asyncStorage, removeStorageKeysAsync } = await load();
  const keys = [uniqueKey("bulk-a"), uniqueKey("bulk-b"), uniqueKey("bulk-c")];

  await Promise.all(keys.map((key) => asyncStorage.setItem(key, "x")));
  await removeStorageKeysAsync(keys);

  for (const key of keys) {
    assert.equal(domWindow.localStorage.getItem(key), null);
  }
});

test("removeStorageKeysAsync tolerates keys that were never set", async () => {
  const { removeStorageKeysAsync } = await load();

  await removeStorageKeysAsync([uniqueKey("never-set")]);
});

test("null and false survive the round trip", async () => {
  // Both are falsy, so an implementation using `||` or a truthiness check to detect
  // "missing" would turn a stored `false` into `null`.
  const { asyncStorage } = await load();
  const falseKey = uniqueKey("false");
  const zeroKey = uniqueKey("zero");
  const emptyKey = uniqueKey("empty-string");

  await asyncStorage.setItem(falseKey, false);
  await asyncStorage.setItem(zeroKey, 0);
  await asyncStorage.setItem(emptyKey, "");

  assert.equal(await asyncStorage.getItem(falseKey), false);
  assert.equal(await asyncStorage.getItem(zeroKey), 0);
  assert.equal(await asyncStorage.getItem(emptyKey), "");
});

test("a later write wins over an earlier one for the same key", async () => {
  const { asyncStorage } = await load();
  const key = uniqueKey("overwritten");

  await asyncStorage.setItem(key, "first");
  await asyncStorage.setItem(key, "second");

  assert.equal(await asyncStorage.getItem(key), "second");
  assert.equal(
    JSON.parse(domWindow.localStorage.getItem(key) as string),
    "second",
  );
});

test("corrupt stored JSON reads as null instead of throwing", async () => {
  // localStorage is shared with anything else on the origin: older versions of this
  // app, other scripts, a write interrupted midway. Unparseable content is expected
  // noise, not an exception. Rejecting here put `useAsyncState` into its error state
  // and skipped `CocktailResultContext`'s `|| ""` fallback, so one bad key broke a
  // whole block of persisted state that should have fallen back to a default.
  const { asyncStorage } = await load();
  const key = uniqueKey("corrupt");
  domWindow.localStorage.setItem(key, "{not valid json");

  assert.equal(await asyncStorage.getItem(key), null);
});

test("a corrupt value falls back to the caller's default", async () => {
  // This is the point of resolving rather than rejecting: `getItem` takes a
  // `defaultValue`, and a caller that supplied one wants it used when the stored
  // value is unusable — not an exception to handle.
  const { asyncStorage } = await load();
  const key = uniqueKey("corrupt-default");
  domWindow.localStorage.setItem(key, "]]not json[[");

  assert.deepEqual(await asyncStorage.getItem(key, { fallback: true }), {
    fallback: true,
  });
});

test("a truncated JSON value also falls back", async () => {
  // The realistic corruption shape: a write cut off partway, so the content starts
  // out valid and fails at the end.
  const { asyncStorage } = await load();
  const key = uniqueKey("truncated");
  domWindow.localStorage.setItem(key, '{"name":"Mojito","ingredi');

  assert.equal(await asyncStorage.getItem(key), null);
});
