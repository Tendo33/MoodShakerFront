/**
 * Single source of truth for locales and language resolution.
 *
 * Language used to be decided independently in three places, each with its own
 * fallback chain:
 *
 *   - `proxy.ts`            cookie -> accept-language -> "cn"
 *   - `app/layout.tsx`      rewritten path -> accept-language -> "cn"
 *   - `LanguageContext.tsx` pathname -> localStorage -> navigator -> "cn"
 *
 * Three chains over the same inputs meant they could disagree: the proxy could
 * redirect to `/cn` from a cookie while the layout read `accept-language: en` and
 * rendered `<html lang="en">`, and the client could then read a third value from
 * `localStorage`. The URL prefix is now the only answer, and the proxy is the
 * only component that derives it from anything else.
 */

export const LOCALES = ["cn", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "cn";

/** Persists the user's explicit choice, read by the proxy on an unprefixed URL. */
export const LOCALE_COOKIE = "moodshaker-language";

/**
 * Carries the proxy's decision to the server components.
 *
 * The layout renders `<html lang>` but cannot read the `[lang]` route param, so
 * it used to re-sniff `accept-language` — a second derivation that could
 * disagree with the redirect that just happened. It now reads this header
 * instead, making the proxy the only decider.
 */
export const LOCALE_HEADER = "x-moodshaker-locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Reads the locale out of a URL path.
 *
 * The prefix is the source of truth: if it is present, nothing else is
 * consulted.
 */
export function localeFromPathname(pathname: string | null | undefined): Locale | null {
  if (!pathname) return null;

  const path = pathname.split("?")[0];
  const segment = path.split("/")[1];

  return isLocale(segment) ? segment : null;
}

/**
 * Picks a locale from an `Accept-Language` header by quality value.
 *
 * The previous implementations both did `lower.startsWith("en") ? "en" : "cn"`,
 * so `Accept-Language: en-GB` worked but `fr,en;q=0.9` silently became Chinese
 * despite English being acceptable and Chinese not being listed at all.
 */
export function localeFromAcceptLanguage(
  header: string | null | undefined,
): Locale | null {
  if (!header) return null;

  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      const quality = q === undefined ? 1 : Number.parseFloat(q);

      return {
        tag: tag.trim().toLowerCase(),
        quality: Number.isFinite(quality) ? quality : 0,
      };
    })
    .filter((entry) => entry.tag.length > 0 && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of candidates) {
    if (tag === "*") return DEFAULT_LOCALE;
    // `zh`, `zh-CN`, `zh-Hant` all map to the Chinese dictionary: the project
    // ships one Chinese variant, so a regional tag is not a reason to fall back
    // to English.
    if (tag === "zh" || tag.startsWith("zh-")) return "cn";
    if (tag === "en" || tag.startsWith("en-")) return "en";
  }

  return null;
}

/**
 * BCP 47 tags for the `lang` attribute. `cn` is our own route prefix, not a valid
 * language subtag.
 *
 * Shared because two places set this: the root layout on the server, and
 * `LanguageContext` after a client-side navigation (the root layout is a server
 * component and does not re-render on those, so the attribute would otherwise go
 * stale). Two copies of this map could drift.
 */
export const HTML_LANG: Record<Locale, string> = {
  cn: "zh-CN",
  en: "en",
};

/** Prefixes a path with a locale, replacing an existing prefix. */
export function localizePathname(pathname: string, locale: Locale): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const existing = localeFromPathname(path);

  if (!existing) {
    return path === "/" ? `/${locale}` : `/${locale}${path}`;
  }

  const rest = path.slice(existing.length + 1);
  return rest.length > 0 ? `/${locale}${rest}` : `/${locale}`;
}
