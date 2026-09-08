import test, { after } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

/**
 * `useAsyncState` is a React hook over `localStorage`, so it needs both a DOM and an
 * `act()` environment. jsdom supplies the first; `IS_REACT_ACT_ENVIRONMENT` the
 * second. Neither needs a browser binary.
 *
 * All of this has to run before React or the hook is imported, and `node --test`
 * gives each file its own process, so mutating `globalThis` here is contained.
 */
// Deliberately without `pretendToBeVisual`: that option starts a repeating
// requestAnimationFrame loop which holds the Node event loop open, so the suite
// finishes and then hangs instead of exiting. This hook never uses rAF — verified by
// running it with the option off.
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000/cn",
});
const domWindow = dom.window as unknown as Window & typeof globalThis;
const globals = globalThis as Record<string, unknown>;

globals.window = domWindow;
globals.document = domWindow.document;
globals.localStorage = domWindow.localStorage;
globals.IS_REACT_ACT_ENVIRONMENT = true;

// `navigator` is a getter-only property on recent Node versions, so it cannot be
// assigned the way the others can.
Object.defineProperty(globalThis, "navigator", {
  value: domWindow.navigator,
  configurable: true,
  writable: true,
});

// Releases jsdom's timers and handles so the process exits after the last test.
after(() => {
  domWindow.close();
});

type ReactTesting = typeof import("@testing-library/react");
type HookModule = typeof import("../../hooks/useAsyncState");

/**
 * Imports sit in helpers because tsx compiles these tests to CJS, where top-level
 * await is unavailable.
 */
async function load(): Promise<{
  rtl: ReactTesting;
  useAsyncState: HookModule["useAsyncState"];
}> {
  const rtl = await import("@testing-library/react");
  const { useAsyncState } = await import("../../hooks/useAsyncState");
  return { rtl, useAsyncState };
}

/** Distinct key per test — the underlying storage singleton is shared. */
let keySeq = 0;
function uniqueKey(name: string): string {
  return `hook-${name}-${keySeq++}`;
}

/** Waits until the hook has left its initial load. */
async function settled(
  rtl: ReactTesting,
  read: () => { phase: string },
): Promise<void> {
  await rtl.waitFor(
    () => {
      const { phase } = read();
      if (phase === "idle" || phase === "loading") {
        throw new Error(`still ${phase}`);
      }
    },
    { timeout: 4_000 },
  );
}

test("loads a stored value and reports success", async () => {
  const { rtl, useAsyncState } = await load();
  const storageKey = uniqueKey("stored");
  domWindow.localStorage.setItem(
    storageKey,
    JSON.stringify({ answers: ["sweet"] }),
  );

  const { result, unmount } = rtl.renderHook(() =>
    useAsyncState<{ answers: string[] }>({ storageKey }),
  );

  await settled(rtl, () => result.current);

  assert.equal(result.current.phase, "success");
  assert.deepEqual(result.current.data, { answers: ["sweet"] });
  assert.equal(result.current.error, null);
  assert.equal(result.current.isLoading, false);
  unmount();
});

test("falls back to defaultValue when nothing is stored", async () => {
  const { rtl, useAsyncState } = await load();
  // Outside the render callback: calling `uniqueKey()` inside it produces a new
  // storageKey every render, which correctly rebuilds `loadData` and re-runs the
  // effect — a loop of the test's own making, not the hook's.
  const storageKey = uniqueKey("absent");

  const { result, unmount } = rtl.renderHook(() =>
    useAsyncState({
      storageKey,
      defaultValue: { answers: [] as string[] },
    }),
  );

  await settled(rtl, () => result.current);

  assert.deepEqual(result.current.data, { answers: [] });
  assert.equal(result.current.error, null);
  unmount();
});

test("a corrupt stored value falls back instead of erroring", async () => {
  // The integration side of the storage fix: an unparseable value degrades to the
  // default rather than rejecting. Before that, this left the hook in `error` phase,
  // so one bad key turned a whole screen into a failure state.
  const { rtl, useAsyncState } = await load();
  const storageKey = uniqueKey("corrupt");
  domWindow.localStorage.setItem(storageKey, "{truncated");

  const { result, unmount } = rtl.renderHook(() =>
    useAsyncState({ storageKey, defaultValue: "fallback" }),
  );

  await settled(rtl, () => result.current);

  assert.equal(result.current.phase, "success");
  assert.equal(result.current.data, "fallback");
  assert.equal(result.current.error, null);
  unmount();
});

test("immediate: false leaves the hook idle until asked", async () => {
  const { rtl, useAsyncState } = await load();
  const storageKey = uniqueKey("deferred");
  domWindow.localStorage.setItem(storageKey, JSON.stringify("present"));

  const { result, unmount } = rtl.renderHook(() =>
    useAsyncState<string>({ storageKey, immediate: false }),
  );

  assert.equal(result.current.phase, "idle");
  assert.equal(result.current.data, null);

  await rtl.act(async () => {
    await result.current.reload();
  });

  assert.equal(result.current.data, "present");
  unmount();
});

test("updateData persists and is readable by a fresh hook", async () => {
  const { rtl, useAsyncState } = await load();
  const storageKey = uniqueKey("updated");

  const first = rtl.renderHook(() =>
    useAsyncState<{ step: number }>({ storageKey }),
  );
  await settled(rtl, () => first.result.current);

  await rtl.act(async () => {
    await first.result.current.updateData({ step: 4 });
  });

  // Local state updates immediately, which is what makes the UI feel responsive.
  assert.deepEqual(first.result.current.data, { step: 4 });
  // And it reached storage, not just React state.
  assert.deepEqual(
    JSON.parse(domWindow.localStorage.getItem(storageKey) as string),
    { step: 4 },
  );
  first.unmount();

  const second = rtl.renderHook(() =>
    useAsyncState<{ step: number }>({ storageKey }),
  );
  await settled(rtl, () => second.result.current);
  assert.deepEqual(second.result.current.data, { step: 4 });
  second.unmount();
});

test("a burst of updates all persist, with the last one winning", async () => {
  // This is the hook-level consequence of the batch-queue hang: `updateData` awaits
  // the storage promise, so a stranded operation left this await pending forever —
  // a save indicator spinning with no error. The questionnaire writes on every
  // answer, which is exactly this shape.
  const { rtl, useAsyncState } = await load();
  const storageKey = uniqueKey("burst");

  const { result, unmount } = rtl.renderHook(() =>
    useAsyncState<number>({ storageKey }),
  );
  await settled(rtl, () => result.current);

  await rtl.act(async () => {
    await Promise.all(
      Array.from({ length: 25 }, (_, i) => result.current.updateData(i)),
    );
  });

  assert.equal(result.current.data, 24);
  assert.equal(
    JSON.parse(domWindow.localStorage.getItem(storageKey) as string),
    24,
  );
  unmount();
});

test("reload picks up a value changed outside the hook", async () => {
  // Another tab, or a context that writes through the storage layer directly.
  const { rtl, useAsyncState } = await load();
  const storageKey = uniqueKey("external");
  domWindow.localStorage.setItem(storageKey, JSON.stringify("before"));

  const { result, unmount } = rtl.renderHook(() =>
    useAsyncState<string>({ storageKey }),
  );
  await settled(rtl, () => result.current);
  assert.equal(result.current.data, "before");

  // Written through the hook's own layer so the read-through cache stays coherent;
  // a raw localStorage write would be masked by that cache.
  const { asyncStorage } = await import("../../utils/asyncStorage");
  await asyncStorage.setItem(storageKey, "after");

  await rtl.act(async () => {
    await result.current.reload();
  });

  assert.equal(result.current.data, "after");
  unmount();
});

test("onSuccess receives the loaded value", async () => {
  const { rtl, useAsyncState } = await load();
  const storageKey = uniqueKey("callback");
  domWindow.localStorage.setItem(storageKey, JSON.stringify("delivered"));

  const seen: string[] = [];
  const { result, unmount } = rtl.renderHook(() =>
    useAsyncState<string>({
      storageKey,
      onSuccess: (value) => seen.push(value),
    }),
  );

  await settled(rtl, () => result.current);

  assert.deepEqual(seen, ["delivered"]);
  unmount();
});

test("onSuccess fires with a stored falsy value", async () => {
  // `if (result && onSuccess)` skipped `false`, `0`, and `""`, so a stored `false`
  // looked identical to nothing having been stored. The check is against `null` now.
  const { rtl, useAsyncState } = await load();
  const storageKey = uniqueKey("falsy-callback");
  domWindow.localStorage.setItem(storageKey, JSON.stringify(false));

  const seen: boolean[] = [];
  const { result, unmount } = rtl.renderHook(() =>
    useAsyncState<boolean>({
      storageKey,
      onSuccess: (value) => seen.push(value),
    }),
  );

  await settled(rtl, () => result.current);

  assert.deepEqual(seen, [false]);
  assert.equal(result.current.data, false);
  unmount();
});

test("onSuccess also fires when the default value is used", async () => {
  // Documenting existing behavior rather than asserting a preference: `getItem`
  // returns `defaultValue` for an absent key, and the hook cannot tell that apart
  // from a value genuinely read from storage.
  //
  // So `onSuccess` means "a value is available", not "a previous session was
  // restored". A caller that needs the latter has to compare against its default.
  // Giving the hook a provenance signal would be speculative — no consumer passes
  // `onSuccess` today.
  const { rtl, useAsyncState } = await load();

  const storageKey = uniqueKey("default-callback");
  const seen: string[] = [];
  const { result, unmount } = rtl.renderHook(() =>
    useAsyncState<string>({
      storageKey,
      defaultValue: "default",
      onSuccess: (value) => seen.push(value),
    }),
  );

  await settled(rtl, () => result.current);

  assert.deepEqual(seen, ["default"]);
  unmount();
});

test("an inline defaultValue does not cause a render loop", async () => {
  // The regression guard for a live production bug. `loadData` depended on
  // `defaultValue`, `onSuccess`, and `onError`, which callers pass as inline
  // literals and arrow functions — new references on every render. So `loadData` was
  // rebuilt each render, the effect depending on it re-ran, setState triggered
  // another render, and around it went.
  //
  // `components/pages/Home.tsx` passes `defaultValue: {}` inline. Measured before
  // the fix: 475 renders in 1.5 s against 3 with a stable reference. The home page
  // was in an unbounded render loop, rate-limited only by the storage layer's batch
  // delay, which is why it never looked like a hang.
  const { rtl, useAsyncState } = await load();
  const storageKey = uniqueKey("loop");

  let renders = 0;
  const { unmount } = rtl.renderHook(() => {
    renders += 1;
    // Exactly the shape Home.tsx uses.
    return useAsyncState({ storageKey, defaultValue: {}, immediate: true });
  });

  await new Promise((resolve) => setTimeout(resolve, 1_200));

  assert.ok(
    renders < 10,
    `expected a handful of renders, got ${renders} — the loop is back`,
  );
  unmount();
});

test("an inline onSuccess is called once, not once per render", async () => {
  // Same root cause seen from the callback side: 133 calls before the fix.
  const { rtl, useAsyncState } = await load();
  const storageKey = uniqueKey("callback-loop");
  domWindow.localStorage.setItem(storageKey, JSON.stringify("value"));

  let calls = 0;
  const { result, unmount } = rtl.renderHook(() =>
    useAsyncState<string>({
      storageKey,
      onSuccess: () => {
        calls += 1;
      },
    }),
  );

  await settled(rtl, () => result.current);
  await new Promise((resolve) => setTimeout(resolve, 400));

  assert.equal(calls, 1);
  unmount();
});

test("unmounting before the load finishes does not warn or throw", async () => {
  // `mountedRef` exists for this. A setState after unmount is a React warning today
  // and a leak in any case; the questionnaire unmounts on navigation mid-load.
  const { rtl, useAsyncState } = await load();
  const storageKey = uniqueKey("unmounted");
  domWindow.localStorage.setItem(storageKey, JSON.stringify("value"));

  const warnings: string[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => warnings.push(String(args[0]));

  try {
    const { unmount } = rtl.renderHook(() =>
      useAsyncState<string>({ storageKey }),
    );
    unmount(); // during the in-flight initial load

    // Long enough for the storage batch to flush into the unmounted hook.
    await new Promise((resolve) => setTimeout(resolve, 200));
  } finally {
    console.error = originalError;
  }

  assert.deepEqual(
    warnings.filter((w) => w.includes("unmounted")),
    [],
  );
});
