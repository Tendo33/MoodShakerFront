import { getGalleryCocktails } from "@/lib/cocktail-data";
import GalleryContent from "./GalleryContent";
import { redirect } from "next/navigation";

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams?: {
    q?: string | string[];
    spirit?: string | string[];
    flavor?: string | string[];
    alcohol?: string | string[];
  };
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

  const cocktails = await getGalleryCocktails(filters);

  return <GalleryContent cocktails={cocktails} lang={lang} initialFilters={filters} />;
}
