import test, { after, mock } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import * as React from "react";

/**
 * Questionnaire state lives in this context and persists through `localStorage`, so
 * it needs a DOM and an `act()` environment but no browser and no database.
 *
 * Everything here runs before React or the context is imported. `node --test` gives
 * each file its own process, so mutating `globalThis` is contained.
 *
 * See `.trellis/spec/frontend/quality.md` for why `pretendToBeVisual` is omitted and
 * why `navigator` needs `defineProperty`.
 */
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000/cn",
});
const domWindow = dom.window as unknown as Window & typeof globalThis;
const globals = globalThis as Record<string, unknown>;

globals.window = domWindow;
globals.document = domWindow.document;
globals.localStorage = domWindow.localStorage;
globals.IS_REACT_ACT_ENVIRONMENT = true;

Object.defineProperty(globalThis, "navigator", {
  value: domWindow.navigator,
  configurable: true,
  writable: true,
});

// `LanguageProvider` calls `usePathname` and `useRouter`, which need an app router
// this environment has no way to mount. Only the language prefix matters here.
mock.module("next/navigation", {
  namedExports: {
    usePathname: () => "/cn",
    useRouter: () => ({
      push: () => {},
      replace: () => {},
      refresh: () => {},
    }),
    useSearchParams: () => new URLSearchParams(),
  },
});

after(() => {
  domWindow.close();
});

type FormContextModule = typeof import("../../context/CocktailFormContext");
type ReactTesting = typeof import("@testing-library/react");

/** Imports live in a helper: tsx compiles these tests to CJS, so no top-level await. */
async function load(): Promise<{
  rtl: ReactTesting;
  useCocktailForm: FormContextModule["useCocktailForm"];
  wrapper: ({ children }: { children: React.ReactNode }) => React.ReactElement;
}> {
  const rtl = await import("@testing-library/react");
  const { CocktailFormProvider, useCocktailForm } = await import(
    "../../context/CocktailFormContext"
  );
  const { LanguageProvider } = await import("../../context/LanguageContext");

  // createElement rather than JSX so this file stays `.ts` and matches the test glob.
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(CocktailFormProvider, null, children),
    );

  return { rtl, useCocktailForm, wrapper };
}

/** Renders the context and waits for its initial load to finish. */
async function mountForm() {
  const { rtl, useCocktailForm, wrapper } = await load();
  const rendered = rtl.renderHook(() => useCocktailForm(), { wrapper });

  await rtl.waitFor(
    () => {
      if (rendered.result.current.isDataLoading) {
        throw new Error("still loading");
      }
    },
    { timeout: 4_000 },
  );

  return { rtl, ...rendered };
}

/** The keys this context persists, needed to reset between tests. */
const STORAGE_KEYS = [
  "moodshaker-answers",
  "moodshaker-feedback",
  "moodshaker-base-spirits",
];

/**
 * Resets each test to an empty store.
 *
 * `localStorage.clear()` alone is not enough: `asyncStorage` is a module singleton
 * with a read-through cache that survives between tests in this file, so the next
 * mount would read a previous test's values out of memory even with localStorage
 * empty. `removeItem` clears the cache entry and the stored value together.
 */
async function clearStorage(): Promise<void> {
  const { asyncStorage } = await import("../../utils/asyncStorage");
  await Promise.all(STORAGE_KEYS.map((key) => asyncStorage.removeItem(key)));
  domWindow.localStorage.clear();
}

test("answers save and are readable back", async () => {
  await clearStorage();
  const { rtl, result, unmount } = await mountForm();

  await rtl.act(async () => {
    await result.current.saveAnswer("mood", "relaxed");
  });

  assert.deepEqual(result.current.answers, { mood: "relaxed" });
  assert.deepEqual(
    JSON.parse(domWindow.localStorage.getItem("moodshaker-answers") as string),
    { mood: "relaxed" },
  );
  unmount();
});

test("concurrent saveAnswer calls do not lose answers", async () => {
  // Regression test for a real lost update. `saveAnswer` used to spread the
  // `answers` it captured from the closure — `{...answers, [id]: value}` — so two
  // calls in one render read the same snapshot and the second overwrote the first.
  // Measured before the fix: saving two answers concurrently kept only one.
  //
  // The questionnaire's `selectedOption` guard in Questions.tsx serializes clicks,
  // so this was not reachable through the current UI. It is a property of the
  // context API regardless, and relying on a caller happening to serialize is not a
  // guarantee.
  await clearStorage();
  const { rtl, result, unmount } = await mountForm();

  await rtl.act(async () => {
    await Promise.all([
      result.current.saveAnswer("q1", "a1"),
      result.current.saveAnswer("q2", "a2"),
      result.current.saveAnswer("q3", "a3"),
    ]);
  });

  assert.deepEqual(result.current.answers, {
    q1: "a1",
    q2: "a2",
    q3: "a3",
  });
  assert.deepEqual(
    JSON.parse(domWindow.localStorage.getItem("moodshaker-answers") as string),
    { q1: "a1", q2: "a2", q3: "a3" },
  );
  unmount();
});

test("concurrent base-spirit toggles all register", async () => {
  // The same bug on a path a user can actually hit: base spirits are multi-select
  // tags, so tapping two quickly produced two concurrent toggles and the second
  // overwrote the first — two taps, one selection.
  await clearStorage();
  const { rtl, result, unmount } = await mountForm();

  await rtl.act(async () => {
    await Promise.all([
      result.current.toggleBaseSpirit("gin"),
      result.current.toggleBaseSpirit("rum"),
      result.current.toggleBaseSpirit("vodka"),
    ]);
  });

  assert.deepEqual([...result.current.baseSpirits].sort(), [
    "gin",
    "rum",
    "vodka",
  ]);
  unmount();
});

test("toggling the same spirit twice returns to unselected", async () => {
  await clearStorage();
  const { rtl, result, unmount } = await mountForm();

  await rtl.act(async () => {
    await result.current.toggleBaseSpirit("gin");
  });
  assert.deepEqual(result.current.baseSpirits, ["gin"]);

  await rtl.act(async () => {
    await result.current.toggleBaseSpirit("gin");
  });
  assert.deepEqual(result.current.baseSpirits, []);
  unmount();
});

test("removeAnswer drops one answer and leaves the rest", async () => {
  await clearStorage();
  const { rtl, result, unmount } = await mountForm();

  await rtl.act(async () => {
    await Promise.all([
      result.current.saveAnswer("q1", "a1"),
      result.current.saveAnswer("q2", "a2"),
    ]);
  });

  await rtl.act(async () => {
    await result.current.removeAnswer("q1");
  });

  assert.deepEqual(result.current.answers, { q2: "a2" });
  unmount();
});

test("isQuestionAnswered reflects what is stored", async () => {
  await clearStorage();
  const { rtl, result, unmount } = await mountForm();

  assert.equal(result.current.isQuestionAnswered("mood"), false);

  await rtl.act(async () => {
    await result.current.saveAnswer("mood", "relaxed");
  });

  assert.equal(result.current.isQuestionAnswered("mood"), true);
  assert.equal(result.current.isQuestionAnswered("other"), false);
  unmount();
});

test("state survives a remount, which is the point of persisting it", async () => {
  await clearStorage();
  const first = await mountForm();

  await first.rtl.act(async () => {
    await first.result.current.saveAnswer("mood", "adventurous");
    await first.result.current.toggleBaseSpirit("gin");
  });
  first.unmount();

  const second = await mountForm();
  assert.deepEqual(second.result.current.answers, { mood: "adventurous" });
  assert.deepEqual(second.result.current.baseSpirits, ["gin"]);
  second.unmount();
});

test("resetForm clears answers, spirits, and feedback", async () => {
  await clearStorage();
  const { rtl, result, unmount } = await mountForm();

  await rtl.act(async () => {
    await result.current.saveAnswer("mood", "relaxed");
    await result.current.toggleBaseSpirit("gin");
    await result.current.saveFeedback("more citrus");
  });

  await rtl.act(async () => {
    await result.current.resetForm();
  });

  assert.deepEqual(result.current.answers, {});
  assert.deepEqual(result.current.baseSpirits, []);
  // The context exposes this as `userFeedback`, not `feedback`.
  assert.equal(result.current.userFeedback, "");
  unmount();
});

test("a reset is durable rather than only local", async () => {
  // Clearing React state while leaving localStorage populated would restore the
  // supposedly-reset answers on the next mount.
  await clearStorage();
  const first = await mountForm();

  await first.rtl.act(async () => {
    await first.result.current.saveAnswer("mood", "relaxed");
  });
  await first.rtl.act(async () => {
    await first.result.current.resetForm();
  });
  first.unmount();

  const second = await mountForm();
  assert.deepEqual(second.result.current.answers, {});
  second.unmount();
});

test("the context does not re-render in a loop once settled", async () => {
  // `useBatchAsyncState` holds its configs in a ref and depends on `[]`, so the
  // inline config array callers pass is safe. This asserts that rather than assuming
  // it — the sibling `useAsyncState` shipped with exactly that loop.
  await clearStorage();
  const { rtl, useCocktailForm, wrapper } = await load();

  let renders = 0;
  const { result, unmount } = rtl.renderHook(
    () => {
      renders += 1;
      return useCocktailForm();
    },
    { wrapper },
  );

  await rtl.waitFor(
    () => {
      if (result.current.isDataLoading) throw new Error("loading");
    },
    { timeout: 4_000 },
  );

  const settledAt = renders;
  await new Promise((resolve) => setTimeout(resolve, 800));

  assert.ok(
    renders - settledAt < 3,
    `re-rendered ${renders - settledAt} times while idle`,
  );
  unmount();
});
