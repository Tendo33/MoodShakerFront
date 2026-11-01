import type { LocalizedText } from "@/lib/i18n";

const MAX_LENGTH = 60;

/** URL slug from the English name, falling back when the name has no latin characters. */
export function buildSlug(name: LocalizedText, fallback: string): string {
  const slug = (name.en || name.cn)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LENGTH)
    .replace(/-+$/, "");

  return slug || fallback;
}
