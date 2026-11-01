export const LOCALES = ["cn", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "cn";
export const LOCALE_COOKIE = "moodshaker-language";

export const HTML_LANG: Record<Locale, string> = { cn: "zh-CN", en: "en" };

/** Text stored in both languages. Every generated field has this shape. */
export interface LocalizedText {
  cn: string;
  en: string;
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function localeFromPathname(pathname: string): Locale | null {
  const segment = pathname.split("?")[0].split("/")[1];
  return isLocale(segment) ? segment : null;
}

export function localeFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;

  const tags = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const quality = q ? Number.parseFloat(q.slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((entry) => entry.tag && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of tags) {
    if (tag === "*") return DEFAULT_LOCALE;
    if (tag === "zh" || tag.startsWith("zh-")) return "cn";
    if (tag === "en" || tag.startsWith("en-")) return "en";
  }
  return null;
}

/** Prefixes `path` with `locale`, replacing an existing locale segment. */
export function localizePath(path: string, locale: Locale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const existing = localeFromPathname(normalized);
  const rest = existing ? normalized.slice(existing.length + 1) : normalized;
  return rest === "/" || rest === "" ? `/${locale}` : `/${locale}${rest}`;
}
