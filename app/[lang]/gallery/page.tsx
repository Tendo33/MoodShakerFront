import { getGalleryCocktails } from "@/lib/cocktail-data";
import GalleryContent from "./GalleryContent";

export default async function GalleryPage({
  params,
}: {
  params: { lang: string };
}) {
  const { lang } = await params;
  const cocktails = await getGalleryCocktails();

  return <GalleryContent cocktails={cocktails} lang={lang} />;
}
