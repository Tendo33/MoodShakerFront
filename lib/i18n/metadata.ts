import type { Metadata } from "next";
import { LOCALES, type Locale, localizePathname } from "@/lib/i18n/config";
import { translate, type TranslationKey } from "@/lib/i18n/dictionary";

/**
 * Localized page metadata.
 *
 * Every route used to declare a hardcoded English `metadata` object, so `/cn`
 * returned `MoodShaker - Find Your Perfect Cocktail` and `/cn/questions` returned
 * `Questions | MoodShaker`. Chinese users and crawlers both saw English.
 *
 * Also emits `hreflang` alternates, which were absent entirely: search engines had
 * no way to know `/cn/gallery` and `/en/gallery` are the same page in two
 * languages, and could treat them as duplicates.
 */

/** Public origin, used for canonical URLs and Open Graph. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://moodshaker.de"
).replace(/\/$/, "");

/**
 * BCP 47 tags for `hreflang` and the `lang` attribute.
 *
 * The internal locale codes are `cn` and `en`; `cn` is not a valid language tag,
 * so it must be mapped rather than emitted as-is.
 */
const HREFLANG: Record<Locale, string> = {
  cn: "zh-CN",
  en: "en",
};

export function htmlLang(locale: Locale): string {
  return HREFLANG[locale];
}

/**
 * Builds `hreflang` alternates for a path.
 *
 * `path` is the unlocalized route (`/gallery`, or `/` for the home page);
 * each locale's URL is derived from it.
 */
function alternates(path: string, locale: Locale): Metadata["alternates"] {
  const languages: Record<string, string> = {};

  for (const candidate of LOCALES) {
    languages[HREFLANG[candidate]] =
      SITE_URL + localizePathname(path, candidate);
  }

  // Tells a crawler which URL to use when no language matches, rather than
  // letting it pick one of the two arbitrarily.
  languages["x-default"] = SITE_URL + localizePathname(path, "cn");

  return {
    canonical: SITE_URL + localizePathname(path, locale),
    languages,
  };
}

interface PageMetadataInput {
  locale: Locale;
  /** Unlocalized route, e.g. `/gallery` or `/` for the home page. */
  path: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  /** Absolute or root-relative image URL for social cards. */
  image?: string;
}

export function buildPageMetadata({
  locale,
  path,
  titleKey,
  descriptionKey,
  image = "/logo.png",
}: PageMetadataInput): Metadata {
  const title = translate(locale, titleKey);
  const description = translate(locale, descriptionKey);
  const url = SITE_URL + localizePathname(path, locale);

  return {
    title,
    description,
    alternates: alternates(path, locale),
    openGraph: {
      title,
      description,
      url,
      siteName: "MoodShaker",
      locale: HREFLANG[locale],
      type: "website",
      images: [{ url: image.startsWith("http") ? image : SITE_URL + image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.startsWith("http") ? image : SITE_URL + image],
    },
  };
}

/**
 * Metadata for a cocktail detail page.
 *
 * Takes resolved strings rather than translation keys, because the title and
 * description come from the cocktail itself.
 */
export function buildCocktailMetadata(input: {
  locale: Locale;
  slug: string;
  name: string;
  description: string;
  imageUrl?: string | null;
}): Metadata {
  const title = `${input.name} | MoodShaker`;
  const path = `/cocktail/${input.slug}`;
  const url = SITE_URL + localizePathname(path, input.locale);
  const image = input.imageUrl || `${SITE_URL}/logo.png`;

  return {
    title,
    description: input.description,
    alternates: alternates(path, input.locale),
    openGraph: {
      title,
      description: input.description,
      url,
      siteName: "MoodShaker",
      locale: HREFLANG[input.locale],
      type: "article",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: input.description,
      images: [image],
    },
  };
}
