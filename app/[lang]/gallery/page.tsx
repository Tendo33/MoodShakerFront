import { getGalleryCocktails } from "@/lib/cocktail-data";
import { DataSourceUnavailableError } from "@/lib/runtime-errors";
import GalleryContent from "./GalleryContent";
import { redirect } from "next/navigation";

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
  const filters = {
    search:
      typeof resolvedSearchParams?.q === "string"
        ? resolvedSearchParams.q
        : undefined,
    cursor:
      typeof resolvedSearchParams?.cursor === "string"
        ? resolvedSearchParams.cursor
        : undefined,
    spirit:
      typeof resolvedSearchParams?.spirit === "string"
        ? resolvedSearchParams.spirit
        : undefined,
    flavor:
      typeof resolvedSearchParams?.flavor === "string"
        ? resolvedSearchParams.flavor
        : undefined,
    alcohol:
      typeof resolvedSearchParams?.alcohol === "string"
        ? resolvedSearchParams.alcohol
        : undefined,
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
      {
        cursor: filters.cursor,
        limit: 24,
      },
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
