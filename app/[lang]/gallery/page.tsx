import { getGalleryCocktails } from "@/lib/cocktail-data";
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

  const cocktails = await getGalleryCocktails(
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

  return (
    <GalleryContent
      cocktails={cocktails.items}
      nextCursor={cocktails.nextCursor}
      lang={lang}
      initialFilters={filters}
    />
  );
}
