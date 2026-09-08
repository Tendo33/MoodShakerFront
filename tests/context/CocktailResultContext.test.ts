import test, { after, mock } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import * as React from "react";

/**
 * Recommendation state: the API call, its persistence, and `editToken` handling.
 * Needs a DOM and a stubbed `fetch`, but no browser and no database.
 *
 * See `.trellis/spec/frontend/quality.md` for the shared setup notes.
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

const STORAGE_KEYS = [
  "moodshaker-recommendation",
  "moodshaker-recommendation-meta",
  "moodshaker-session-id",
  "moodshaker-request",
  "moodshaker-image-data",
  "moodshaker-answers",
  "moodshaker-feedback",
  "moodshaker-base-spirits",
];

/** One recorded fetch, so tests can assert on what was actually sent. */
type Call = { url: string; method?: string; body: Record<string, unknown> };

const calls: Call[] = [];

/** The cocktail payload the API returns on success. */
function cocktailPayload() {
  return {
    name: "Mojito",
    description: "A refreshing Cuban classic",
    matchReason: "Good for summer",
    baseSpirit: "rum",
    alcoholLevel: "low",
    servingGlass: "Highball",
    timeRequired: "5 mins",
    flavorProfiles: ["refreshing"],
    ingredients: [{ name: "White rum", amount: "45", unit: "ml" }],
    tools: [{ name: "Muddler" }],
    steps: [{ stepNumber: 1, description: "Muddle the mint" }],
    imageUrl: null as string | null,
  };
}

/**
 * Installs a `fetch` stub. `handler` decides each response by URL, so a test can
 * fail the image call while the recommendation call succeeds.
 */
function stubFetch(
  handler: (url: string, body: Record<string, unknown>) => unknown,
): void {
  globals.fetch = (async (url: string, init?: RequestInit) => {
    const body = init?.body
      ? (JSON.parse(String(init.body)) as Record<string, unknown>)
      : {};
    calls.push({ url: String(url), method: init?.method, body });
    return handler(String(url), body);
  }) as unknown as typeof fetch;
}

/** A JSON response in this project's envelope. */
function ok(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data }),
  };
}

function fail(status: number, code = "GENERATION_FAILED") {
  return {
    ok: false,
    status,
    json: async () => ({
      success: false,
      error: { code, message: "Generation failed." },
    }),
  };
}

/**
 * The envelope the cocktail route actually returns: `{ cocktail, meta }`, with the
 * token inside `meta` rather than at the top level of `data`. My first version put it
 * at the top level and every request failed the context's `data.meta` check.
 */
function recommendationResponse() {
  return ok({
    cocktail: cocktailPayload(),
    meta: {
      recommendationId: "rec-1",
      editToken: "secret-token",
      sessionId: "sess-1",
    },
  });
}

/** The default: recommendation succeeds, image generation succeeds. */
function stubHappyPath(): void {
  stubFetch((url) => {
    if (url.includes("/image")) {
      return ok({ imageUrl: "https://img.example/mojito.png" });
    }
    return recommendationResponse();
  });
}

type ResultModule = typeof import("../../context/CocktailResultContext");
type ReactTesting = typeof import("@testing-library/react");

async function load(): Promise<{
  rtl: ReactTesting;
  useCocktailResult: ResultModule["useCocktailResult"];
  wrapper: ({ children }: { children: React.ReactNode }) => React.ReactElement;
}> {
  const rtl = await import("@testing-library/react");
  const { CocktailResultProvider, useCocktailResult } = await import(
    "../../context/CocktailResultContext"
  );
  const { CocktailFormProvider } = await import(
    "../../context/CocktailFormContext"
  );
  const { LanguageProvider } = await import("../../context/LanguageContext");

  // The result provider reads questionnaire answers, so the form provider has to be
  // above it — the same nesting as the real app.
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(
        CocktailFormProvider,
        null,
        React.createElement(CocktailResultProvider, null, children),
      ),
    );

  return { rtl, useCocktailResult, wrapper };
}

/**
 * `asyncStorage` is a module singleton with a read-through cache that outlives a
 * test, so clearing localStorage alone would let one test's recommendation appear in
 * the next. `removeItem` clears cache and store together.
 */
async function reset(): Promise<void> {
  const { asyncStorage } = await import("../../utils/asyncStorage");
  await Promise.all(STORAGE_KEYS.map((key) => asyncStorage.removeItem(key)));
  domWindow.localStorage.clear();
  calls.length = 0;
}

async function mountResult() {
  const { rtl, useCocktailResult, wrapper } = await load();
  const rendered = rtl.renderHook(() => useCocktailResult(), { wrapper });

  await rtl.waitFor(
    () => {
      if (rendered.result.current.isLoading) throw new Error("still loading");
    },
    { timeout: 4_000 },
  );

  return { rtl, ...rendered };
}

test("a successful request stores the recommendation", async () => {
  await reset();
  stubHappyPath();
  const { rtl, result, unmount } = await mountResult();

  await rtl.act(async () => {
    await result.current.submitRequest();
  });

  assert.equal(result.current.recommendation?.name, "Mojito");
  assert.equal(result.current.error, null);
  assert.equal(result.current.isLoading, false);
  unmount();
});

test("editToken is sent in the request body, never in the URL", async () => {
  // A hard constraint from CLAUDE.md: the token grants edit rights on a private
  // recommendation, and a URL is logged by proxies, kept in history, and leaked
  // through `Referer`. This asserts it for every call the flow makes.
  await reset();
  stubHappyPath();
  const { rtl, result, unmount } = await mountResult();

  await rtl.act(async () => {
    await result.current.submitRequest();
  });
  await rtl.act(async () => {
    await result.current.refreshImage();
  });

  assert.ok(calls.length >= 2, "expected a recommendation and an image call");
  for (const call of calls) {
    assert.ok(
      !call.url.includes("secret-token"),
      `token leaked into URL: ${call.url}`,
    );
    assert.ok(
      !/editToken|token=/.test(call.url),
      `token parameter in URL: ${call.url}`,
    );
  }

  // And the image call does carry it in the body, or it could not authorize.
  const imageCall = calls.find((c) => c.url.includes("/image"));
  assert.equal(imageCall?.body.editToken, "secret-token");
  assert.equal(imageCall?.method, "POST");
  unmount();
});

test("the recommendation survives a remount", async () => {
  // The point of persisting it: a reload during image generation must not lose the
  // recommendation the user already paid for.
  await reset();
  stubHappyPath();
  const first = await mountResult();

  await first.rtl.act(async () => {
    await first.result.current.submitRequest();
  });
  first.unmount();

  const second = await mountResult();
  await second.rtl.act(async () => {
    await second.result.current.loadSavedData();
  });

  assert.equal(second.result.current.recommendation?.name, "Mojito");
  second.unmount();
});

test("a failed request sets error and leaves recommendation null", async () => {
  await reset();
  stubFetch(() => fail(500));
  const { rtl, result, unmount } = await mountResult();

  await rtl.act(async () => {
    try {
      await result.current.submitRequest();
    } catch {
      // The context records the failure; whether it also rethrows is not the point
      // of this test.
    }
  });

  assert.notEqual(result.current.error, null);
  assert.equal(result.current.recommendation, null);
  assert.equal(result.current.isLoading, false);
  unmount();
});

test("an image failure does not discard a valid recommendation", async () => {
  // The two are tracked separately for this reason: image generation is the slow,
  // failure-prone half, and losing the recommendation because its picture failed
  // would throw away the expensive part of the flow.
  await reset();
  stubFetch((url) => {
    if (url.includes("/image")) return fail(500, "IMAGE_FAILED");
    return recommendationResponse();
  });
  const { rtl, result, unmount } = await mountResult();

  await rtl.act(async () => {
    await result.current.submitRequest();
  });
  await rtl.act(async () => {
    try {
      await result.current.refreshImage();
    } catch {
      // Recorded in `imageError`.
    }
  });

  assert.equal(result.current.recommendation?.name, "Mojito");
  assert.equal(result.current.error, null);
  assert.equal(result.current.isImageLoading, false);
  unmount();
});

test("resetResult clears state and storage together", async () => {
  // Clearing React state while leaving localStorage populated would restore the
  // supposedly-cleared recommendation on the next mount.
  await reset();
  stubHappyPath();
  const first = await mountResult();

  await first.rtl.act(async () => {
    await first.result.current.submitRequest();
  });
  assert.equal(first.result.current.recommendation?.name, "Mojito");

  await first.rtl.act(async () => {
    await first.result.current.resetResult();
  });
  assert.equal(first.result.current.recommendation, null);
  first.unmount();

  const second = await mountResult();
  await second.rtl.act(async () => {
    await second.result.current.loadSavedData();
  });
  assert.equal(second.result.current.recommendation, null);
  second.unmount();
});

test("a reset is not undone by the image job still running", async () => {
  // Regression test for a user-visible bug. `submitRequest` starts image generation
  // fire-and-forget with up to a 30 s timeout, and the block closed over that round's
  // recommendation. When the image came back it wrote state and localStorage
  // unconditionally.
  //
  // So: tap "start over" while the image is generating, and the reset appears to work
  // — state and storage both clear — then a second later the old recommendation
  // reappears in both. Measured before the fix.
  //
  // Each round now carries an epoch that reset and submit increment, and the
  // background job checks it before writing.
  await reset();

  let releaseImage: (() => void) | null = null;
  const imageHangs = new Promise<void>((resolve) => {
    releaseImage = resolve;
  });

  stubFetch((url) => {
    if (url.includes("/image")) {
      return imageHangs.then(() =>
        ok({ imageUrl: "https://img.example/generated.png" }),
      );
    }
    return recommendationResponse();
  });

  const { rtl, result, unmount } = await mountResult();

  await rtl.act(async () => {
    await result.current.submitRequest();
  });
  assert.equal(result.current.recommendation?.name, "Mojito");

  // The user starts over while the image is still generating.
  await rtl.act(async () => {
    await result.current.resetResult();
  });
  assert.equal(result.current.recommendation, null);
  // And the spinner stops, rather than waiting on a round that no longer matters.
  assert.equal(result.current.isImageLoading, false);

  // The image now finishes.
  await rtl.act(async () => {
    releaseImage?.();
    await new Promise((resolve) => setTimeout(resolve, 300));
  });

  assert.equal(result.current.recommendation, null);
  assert.equal(
    domWindow.localStorage.getItem("moodshaker-recommendation"),
    null,
  );
  assert.equal(result.current.isImageLoading, false);
  unmount();
});

test("the request goes to the cocktail endpoint as a POST", async () => {
  await reset();
  stubHappyPath();
  const { rtl, result, unmount } = await mountResult();

  await rtl.act(async () => {
    await result.current.submitRequest();
  });

  const call = calls[0];
  assert.match(call.url, /\/api\/cocktail/);
  assert.equal(call.method, "POST");
  unmount();
});

test("the context does not re-render in a loop once settled", async () => {
  await reset();
  stubHappyPath();
  const { rtl, useCocktailResult, wrapper } = await load();

  let renders = 0;
  const { result, unmount } = rtl.renderHook(
    () => {
      renders += 1;
      return useCocktailResult();
    },
    { wrapper },
  );

  await rtl.waitFor(
    () => {
      if (result.current.isLoading) throw new Error("loading");
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
