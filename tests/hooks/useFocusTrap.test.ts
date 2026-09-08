import test, { after } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import * as React from "react";

/**
 * Focus management is DOM behavior, so these tests need a real document — jsdom
 */
const dom = new JSDOM(
  `<!doctype html><html><body>
    <button id="opener">Open</button>
    <div id="container">
      <a href="#" id="item1">One</a>
      <a href="#" id="item2">Two</a>
      <a href="#" id="item3">Three</a>
    </div>
    <div id="empty"></div>
  </body></html>`,
  { url: "http://localhost:3000/cn" },
);
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

// The hook uses `instanceof HTMLElement`, which needs the constructors jsdom created
// — the global ones from Node would not match nodes from this document.
for (const name of [
  "HTMLElement",
  "Element",
  "Node",
  "Event",
  "KeyboardEvent",
] as const) {
  globals[name] = (domWindow as unknown as Record<string, unknown>)[name];
}

// requestAnimationFrame backed by setTimeout, on both the window and the global.
// `pretendToBeVisual: true` would provide a real one but starts a perpetual rAF loop
// that keeps the process alive after the suite ends.
const raf = (callback: (time: number) => void) =>
  domWindow.setTimeout(() => callback(0), 0) as unknown as number;
const caf = (handle: number) => domWindow.clearTimeout(handle);
globals.requestAnimationFrame = raf;
globals.cancelAnimationFrame = caf;
(domWindow as unknown as Record<string, unknown>).requestAnimationFrame = raf;
(domWindow as unknown as Record<string, unknown>).cancelAnimationFrame = caf;

after(() => {
  domWindow.close();
});

type ReactTesting = typeof import("@testing-library/react");
type FocusTrapModule = typeof import("../../hooks/useFocusTrap");

/** Imports go in a helper: tsx compiles to CJS, so no top-level await. */
async function load(): Promise<{
  rtl: ReactTesting;
  useFocusTrap: FocusTrapModule["useFocusTrap"];
}> {
  const rtl = await import("@testing-library/react");
  const { useFocusTrap } = await import("../../hooks/useFocusTrap");
  return { rtl, useFocusTrap };
}

function byId(id: string): HTMLElement {
  return domWindow.document.getElementById(id) as HTMLElement;
}

function activeId(): string | undefined {
  return domWindow.document.activeElement?.id;
}

/** Long enough for the rAF-deferred initial focus to land. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 60));
}

/**
 * Mounts the trap the way real callers do — with an inline arrow for `onClose`, a new
 * reference on every render.
 */
async function mountTrap(
  containerId = "container",
  options: { initialFocusId?: string } = {},
) {
  const { rtl, useFocusTrap } = await load();
  const closeCalls: number[] = [];

  const rendered = rtl.renderHook(() => {
    const containerRef = React.useRef<HTMLElement | null>(byId(containerId));
    const initialFocusRef = React.useRef<HTMLElement | null>(
      options.initialFocusId ? byId(options.initialFocusId) : null,
    );

    return useFocusTrap({
      isOpen: true,
      containerRef: containerRef as React.RefObject<HTMLElement>,
      initialFocusRef: options.initialFocusId
        ? (initialFocusRef as React.RefObject<HTMLElement>)
        : undefined,
      onClose: () => closeCalls.push(1),
    });
  });

  await flush();
  return { rtl, closeCalls, ...rendered };
}

test("opening focuses the first focusable element", async () => {
  byId("opener").focus();
  const { unmount } = await mountTrap();

  assert.equal(activeId(), "item1");
  unmount();
  await flush();
});

test("initialFocusRef overrides the first element", async () => {
  byId("opener").focus();
  const { unmount } = await mountTrap("container", {
    initialFocusId: "item2",
  });

  assert.equal(activeId(), "item2");
  unmount();
  await flush();
});

test("a re-render does not steal focus back to the first element", async () => {
  // Regression test for a real accessibility bug. `onClose` was in the effect's
  // dependency array, and callers pass an inline arrow —
  // `onClose: () => setIsMobileMenuOpen(false)` in components/layout/Header.tsx — so
  // the effect re-ran on every render. Its cleanup restored focus to the opener, then
  // the re-run moved it to the first focusable element.
  //
  // Reachable in normal use: the header updates `isScrolled` on scroll, so scrolling
  // with the drawer open threw a keyboard user back to the top of the menu on every
  // scroll event. `onClose` now lives in a ref instead.
  byId("opener").focus();
  const { rtl, rerender, unmount } = await mountTrap();

  assert.equal(activeId(), "item1");

  // The user tabs onward.
  byId("item3").focus();
  assert.equal(activeId(), "item3");

  // Something unrelated re-renders the parent.
  rtl.act(() => {
    rerender();
  });
  await flush();

  assert.equal(activeId(), "item3");
  unmount();
  await flush();
});

test("Escape calls the latest onClose", async () => {
  // The reason the ref is written on every render rather than only once: holding the
  // first `onClose` forever would call a stale closure.
  byId("opener").focus();
  const { rtl, closeCalls, rerender, unmount } = await mountTrap();

  rtl.act(() => {
    rerender();
  });

  rtl.act(() => {
    domWindow.document.dispatchEvent(
      new domWindow.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  });

  assert.equal(closeCalls.length, 1);
  unmount();
  await flush();
});

test("Tab from the last element wraps to the first", async () => {
  byId("opener").focus();
  const { rtl, unmount } = await mountTrap();

  byId("item3").focus();
  rtl.act(() => {
    domWindow.document.dispatchEvent(
      new domWindow.KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
    );
  });

  assert.equal(activeId(), "item1");
  unmount();
  await flush();
});

test("Shift+Tab from the first element wraps to the last", async () => {
  byId("opener").focus();
  const { rtl, unmount } = await mountTrap();

  assert.equal(activeId(), "item1");
  rtl.act(() => {
    domWindow.document.dispatchEvent(
      new domWindow.KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey: true,
        bubbles: true,
      }),
    );
  });

  assert.equal(activeId(), "item3");
  unmount();
  await flush();
});

test("closing returns focus to whatever had it before", async () => {
  // Without this a keyboard user is dropped at the top of the document after closing
  // a menu, with no idea where they were.
  byId("opener").focus();
  const { unmount } = await mountTrap();
  assert.equal(activeId(), "item1");

  unmount();
  await flush();

  assert.equal(activeId(), "opener");
});

test("a container with nothing focusable does not throw", async () => {
  byId("opener").focus();
  const { rtl, unmount } = await mountTrap("empty");

  // Tab inside an empty container falls back to the container itself rather than
  // crashing on `focusableElements[0]`.
  rtl.act(() => {
    domWindow.document.dispatchEvent(
      new domWindow.KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
    );
  });

  unmount();
  await flush();
});
