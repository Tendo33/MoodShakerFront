import type { Metadata } from "next";
import { getGalleryCocktails } from "@/lib/cocktail-data";
import {
  isAlcoholLevel,
  isBaseSpirit,
  isFlavorProfile,
} from "@/lib/domain/vocabulary";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/i18n/metadata";
import { DataSourceUnavailableError } from "@/lib/runtime-errors";
import GalleryContent from "./GalleryContent";
import { redirect } from "next/navigation";

/**
 * The gallery previously declared no metadata at all, so both locales fell back to
 * the root layout and served a bare `MoodShaker` title with no description.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;

  return buildPageMetadata({
    locale,
    path: "/gallery",
    titleKey: "seo.gallery.title",
    descriptionKey: "seo.gallery.description",
  });
}

/** Reads a single-valued query parameter, ignoring repeated ones. */
function readParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Reads a query parameter only if it is a valid vocabulary code. */
function readCode<T extends string>(
  value: string | string[] | undefined,
  isValid: (candidate: string) => candidate is T,
): T | undefined {
  const raw = readParam(value);
  return raw && isValid(raw) ? raw : undefined;
}

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{
    q?: string | string[];
    cursor?: string | string[];
    spirit?: string | string[];
    flavor?: string | string[];
    alcohol?: string | string[];
  }>;
}) {
  const { lang } = await params;

  if (lang !== "en" && lang !== "cn") {
    redirect("/cn/gallery");
  }

  const resolvedSearchParams = await searchParams;

  // Query parameters are user input, so each vocabulary filter is validated
  // against the vocabulary and dropped when it does not match. Previously any
  // string was passed through as a filter value, and `?spirit=xyz` silently
  // returned an empty gallery instead of being ignored.
  const filters = {
    search: readParam(resolvedSearchParams?.q),
    cursor: readParam(resolvedSearchParams?.cursor),
    spirit: readCode(resolvedSearchParams?.spirit, isBaseSpirit),
    flavor: readCode(resolvedSearchParams?.flavor, isFlavorProfile),
    alcohol: readCode(resolvedSearchParams?.alcohol, isAlcoholLevel),
  };

  let cocktails = null;
  let isUnavailable = false;

  try {
    cocktails = await getGalleryCocktails(
      {
        search: filters.search,
        spirit: filters.spirit,
        flavor: filters.flavor,
        alcohol: filters.alcohol,
      },
      filters.cursor,
      lang,
    );
  } catch (error) {
    if (!(error instanceof DataSourceUnavailableError)) {
      throw error;
    }
    isUnavailable = true;
  }

  if (isUnavailable || !cocktails) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-xl w-full border-2 border-primary/40 bg-black/70 p-8 text-center glass-panel">
          <h1 className="text-2xl font-heading font-black tracking-widest uppercase text-primary mb-4">
            {lang === "en" ? "Gallery temporarily unavailable" : "酒单库暂时不可用"}
          </h1>
          <p className="font-mono text-foreground/80 leading-relaxed">
            {lang === "en"
              ? "We cannot load live cocktail data right now. Please try again shortly."
              : "当前无法加载实时酒单数据，请稍后再试。"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <GalleryContent
      cocktails={cocktails.items}
      nextCursor={cocktails.nextCursor}
      lang={lang}
      initialFilters={filters}
    />
  );
}
