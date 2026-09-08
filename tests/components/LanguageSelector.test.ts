import test, { after, mock } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import * as React from "react";

/**
 * The language selector's contract: it lists the real locales, shows their display
 * names, and routes to a valid localized path.
 *
 */
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000/cn/questions",
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

for (const name of [
  "HTMLElement",
  "Element",
  "Node",
  "Event",
  "KeyboardEvent",
  "MouseEvent",
] as const) {
  globals[name] = (domWindow as unknown as Record<string, unknown>)[name];
}

// The dropdown animates open, so it needs rAF. `setTimeout`-backed rather than
// `pretendToBeVisual`, which starts a loop that outlives the suite.
const raf = (callback: (time: number) => void) =>
  domWindow.setTimeout(() => callback(0), 0) as unknown as number;
const caf = (handle: number) => domWindow.clearTimeout(handle);
globals.requestAnimationFrame = raf;
globals.cancelAnimationFrame = caf;
(domWindow as unknown as Record<string, unknown>).requestAnimationFrame = raf;
(domWindow as unknown as Record<string, unknown>).cancelAnimationFrame = caf;

/** Records where the selector tried to navigate. */
const pushed: string[] = [];

mock.module("next/navigation", {
  namedExports: {
    usePathname: () => "/cn/questions",
    useRouter: () => ({
      push: (url: string) => pushed.push(url),
      replace: (url: string) => pushed.push(url),
      refresh: () => {},
    }),
    useSearchParams: () => new URLSearchParams(),
  },
});

after(() => {
  domWindow.close();
});

type ReactTesting = typeof import("@testing-library/react");

async function mountSelector(): Promise<{
  rtl: ReactTesting;
  container: HTMLElement;
  unmount: () => void;
}> {
  const rtl = await import("@testing-library/react");
  const selectorModule = await import("../../components/LanguageSelector");
  const LanguageSelector = selectorModule.default;
  const { LanguageProvider } = await import("../../context/LanguageContext");

  const rendered = rtl.render(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(LanguageSelector),
    ),
  );

  await new Promise((resolve) => setTimeout(resolve, 200));
  return { rtl, container: rendered.container as HTMLElement, unmount: rendered.unmount };
}

function buttonTexts(container: HTMLElement): string[] {
  return [...container.querySelectorAll("button")].map((button) =>
    (button.textContent || "").trim(),
  );
}

test("the trigger shows a display name, not a locale code", async () => {
  // Regression test. `languageOptions` was built with
  // `Object.entries(availableLanguages)`, but `availableLanguages` is the array
  // `["cn", "en"]` — so entries produced `[["0", "cn"], ["1", "en"]]` and the code
  // ended up as the array index. One visible symptom was the trigger reading "cn".
  pushed.length = 0;
  const { container, unmount } = await mountSelector();

  const trigger = container.querySelector("button") as HTMLElement;
  const label = (trigger.textContent || "").trim();

  assert.ok(label.includes("中文"), `trigger showed ${JSON.stringify(label)}`);
  assert.ok(!/^(cn|en|0|1)$/i.test(label), "trigger showed a raw code");
  unmount();
});

test("the dropdown lists both locales with display names", async () => {
  pushed.length = 0;
  const { rtl, container, unmount } = await mountSelector();

  const trigger = container.querySelector("button") as HTMLElement;
  rtl.act(() => {
    trigger.click();
  });
  await new Promise((resolve) => setTimeout(resolve, 200));

  const texts = buttonTexts(container).slice(1);
  assert.equal(texts.length, 2, `expected 2 options, got ${texts.length}`);
  assert.ok(
    texts.some((text) => text.includes("中文")),
    `no 中文 option in ${JSON.stringify(texts)}`,
  );
  assert.ok(
    texts.some((text) => /English/i.test(text)),
    `no English option in ${JSON.stringify(texts)}`,
  );
  unmount();
});

test("choosing English routes to the English path", async () => {
  // The bug's worst symptom: `code` was "1", so this pushed `/1/questions` — an
  // invalid route, which is why the language would not switch at all.
  pushed.length = 0;
  const { rtl, container, unmount } = await mountSelector();

  const trigger = container.querySelector("button") as HTMLElement;
  rtl.act(() => {
    trigger.click();
  });
  await new Promise((resolve) => setTimeout(resolve, 200));

  const englishOption = [...container.querySelectorAll("button")].find((button) =>
    /English/i.test(button.textContent || ""),
  ) as HTMLElement;
  assert.ok(englishOption, "no English option to click");

  rtl.act(() => {
    englishOption.click();
  });
  await new Promise((resolve) => setTimeout(resolve, 300));

  assert.deepEqual(pushed, ["/en/questions"]);
  // Guards against index-shaped or otherwise invalid locale segments.
  for (const url of pushed) {
    assert.ok(
      /^\/(cn|en)(\/|$)/.test(url),
      `routed to a non-locale path: ${url}`,
    );
  }
  unmount();
});

test("English typography overrides do not use !important", () => {
  // Regression test for clipped option titles, and a cascade rule worth pinning.
  //
  // `html:lang(en) h3 { font-size: clamp(1.125rem, 2.5vw, 1.75rem) !important }` in
  // `@layer base` beat the component's own `text-lg sm:text-xl` and pushed the title
  // to 25.76px (1.75rem against the 92% root size). In the four-column layout each
  // column is 136px and fits about 19.8px, so `ALCOHOL` overflowed by 40px and the
  // card's `overflow-hidden` clipped the last letter. English only, since these rules
  // are scoped to `:lang(en)`.
  //
  // Without `!important` the cascade already does the right thing — Tailwind v4 orders
  // `utilities` after `base`, so a component that states a size wins and these rules
  // stay a fallback for elements that do not. Measured after the fix: 18.4px, zero
  // overflow on all four cards.
  const css = readFileSync(
    new URL("../../app/globals.css", import.meta.url),
    "utf8",
  );

  // Match each `html:lang(...) selector { ... }` block and inspect only its body.
  // These blocks have no nested rules, so a non-greedy match to the first `}` is
  // enough. `!important` elsewhere in this file is legitimate — the 16px on textarea
  // stops iOS zooming on focus, and the reduced-motion block has to win — so scoping
  // the check matters.
  const offenders: string[] = [];
  const blockPattern = /html:lang\(([^)]*)\)([^{]*)\{([^}]*)\}/g;

  for (const match of css.matchAll(blockPattern)) {
    const [, locale, selector, body] = match;
    if (!body.includes("!important")) continue;
    offenders.push(`html:lang(${locale})${selector.trimEnd()}`);
  }

  assert.deepEqual(
    offenders,
    [],
    `!important in html:lang() blocks: ${offenders.join(", ")}`,
  );
});
