"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { LocalizedText } from "@/lib/i18n";

/**
 * Drinks this browser poured. The edit token is the only key to a private
 * drink, so it lives here and is sent in POST bodies, never in a URL.
 */
interface SavedDrink {
  id: string;
  editToken: string;
  name: LocalizedText;
  createdAt: string;
}

const KEY = "moodshaker:drinks";
const CHANGE_EVENT = "moodshaker:drinks-changed";
const MAX_SAVED = 30;

function parse(raw: string | null): SavedDrink[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is SavedDrink => typeof item?.id === "string" && typeof item?.editToken === "string")
      : [];
  } catch {
    return [];
  }
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveDrink(drink: SavedDrink) {
  const rest = parse(readRaw()).filter((item) => item.id !== drink.id);
  try {
    localStorage.setItem(KEY, JSON.stringify([drink, ...rest].slice(0, MAX_SAVED)));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Storage full or disabled: the drink still opens now, it just won't be listed later.
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * Drinks saved in this browser, or `null` until hydration has finished (the
 * server cannot know). The raw string is the snapshot, so React compares by value.
 */
export function useSavedDrinks(): SavedDrink[] | null {
  const raw = useSyncExternalStore(subscribe, readRaw, () => undefined);
  return useMemo(() => (raw === undefined ? null : parse(raw)), [raw]);
}

/** POSTs JSON to our API and unwraps `{ ok, data }` / `{ ok, error }`. */
export async function callApi<T>(
  url: string,
  body: unknown,
  method: "POST" | "DELETE" = "POST",
): Promise<{ ok: true; data: T } | { ok: false; code: string; status: number }> {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => null)) as
      | { ok: true; data: T }
      | { ok: false; error: { code: string } }
      | null;
    if (payload?.ok) return { ok: true, data: payload.data };
    return { ok: false, code: payload?.error.code ?? "INTERNAL", status: response.status };
  } catch {
    return { ok: false, code: "NETWORK", status: 0 };
  }
}
