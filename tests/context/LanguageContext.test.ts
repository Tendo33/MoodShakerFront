import test, { after, mock } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import * as React from "react";

/**
 * The language context derives the locale from the pathname and keeps `<html lang>` in
 * step with it.
 *
 */
const dom = new JSDOM("<!doctype html><html lang=\"zh-CN\"><body></body></html>", {
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

/** Swapped per test to simulate a client-side navigation. */
let currentPathname = "/cn";
const pushed: string[] = [];

mock.module("next/navigation", {
  namedExports: {
    usePathname: () => currentPathname,
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

type LanguageModule = typeof import("../../context/LanguageContext");
type ReactTesting = typeof import("@testing-library/react");

async function load(): Promise<{
  rtl: ReactTesting;
  useLanguage: LanguageModule["useLanguage"];
  wrapper: ({ children }: { children: React.ReactNode }) => React.ReactElement;
}> {
  const rtl = await import("@testing-library/react");
  const { LanguageProvider, useLanguage } = await import(
    "../../context/LanguageContext"
  );

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(LanguageProvider, null, children);

  return { rtl, useLanguage, wrapper };
}

test("the locale comes from the pathname", async () => {
  currentPathname = "/en/questions";
  const { rtl, useLanguage, wrapper } = await load();
  const { result, unmount } = rtl.renderHook(() => useLanguage(), { wrapper });

  assert.equal(result.current.language, "en");
  unmount();
});

test("an unprefixed path falls back to the default locale", async () => {
  currentPathname = "/";
  const { rtl, useLanguage, wrapper } = await load();
  const { result, unmount } = rtl.renderHook(() => useLanguage(), { wrapper });

  assert.equal(result.current.language, "cn");
  unmount();
});

test("html lang follows a client-side navigation", async () => {
  // Regression test for a bug that only appears on client-side navigation, which is
  // why it survived: the root layout is a server component and does not re-render on
  // those, so the `lang` it set stayed at the first-load value. Measured in a real
  // browser — switching from /cn to /en changed the URL and the copy while `lang`
  // stayed `zh-CN`.
  //
  // It is not only a markup detail. Every `html:lang(en)` rule in globals.css stopped
  // matching, so headings lost `overflow-wrap: break-word` and long English words were
  // clipped again; a screen reader also kept reading English content with Chinese
  // pronunciation. A hard reload looked correct, which is the trap.
  currentPathname = "/cn";
  const { rtl, useLanguage, wrapper } = await load();
  const { result, rerender, unmount } = rtl.renderHook(() => useLanguage(), {
    wrapper,
  });

  assert.equal(domWindow.document.documentElement.lang, "zh-CN");

  // The navigation the selector triggers: same tree, new pathname.
  currentPathname = "/en";
  rtl.act(() => {
    rerender();
  });

  assert.equal(result.current.language, "en");
  assert.equal(domWindow.document.documentElement.lang, "en");

  // And back, so the attribute is not just set once.
  currentPathname = "/cn";
  rtl.act(() => {
    rerender();
  });
  assert.equal(domWindow.document.documentElement.lang, "zh-CN");
  unmount();
});

test("html lang uses a valid BCP 47 tag, not the route prefix", async () => {
  // `cn` is our route prefix; the language subtag is `zh-CN`. Emitting `lang="cn"`
  // would be invalid and would break `:lang()` matching and speech synthesis.
  currentPathname = "/cn";
  const { rtl, useLanguage, wrapper } = await load();
  const { unmount } = rtl.renderHook(() => useLanguage(), { wrapper });

  assert.equal(domWindow.document.documentElement.lang, "zh-CN");
  assert.notEqual(domWindow.document.documentElement.lang, "cn");
  unmount();
});

test("getPathWithLanguage keeps the current locale prefix", async () => {
  currentPathname = "/en/questions";
  const { rtl, useLanguage, wrapper } = await load();
  const { result, unmount } = rtl.renderHook(() => useLanguage(), { wrapper });

  assert.equal(result.current.getPathWithLanguage("/gallery"), "/en/gallery");
  unmount();
});

test("setLanguage routes to the same page under the other locale", async () => {
  pushed.length = 0;
  currentPathname = "/cn/questions";
  const { rtl, useLanguage, wrapper } = await load();
  const { result, unmount } = rtl.renderHook(() => useLanguage(), { wrapper });

  rtl.act(() => {
    result.current.setLanguage("en");
  });

  assert.deepEqual(pushed, ["/en/questions"]);
  unmount();
});
