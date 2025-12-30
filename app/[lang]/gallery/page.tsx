import { getAllCocktails } from "@/lib/cocktail-data";

// Since I don't know exactly how getDictionary works, I'll check how other pages handle text.
// They use useLanguage hook which is client side.
// For server component, I might need to pass lang to client component or use server-side translation if available.
// For now, I will use a simple Client Component wrapper for the content to use useLanguage.

import GalleryContent from "./GalleryContent";

export default async function GalleryPage({
  params,
}: {
  params: { lang: string };
}) {
  const { lang } = await params;
  const cocktails = await getAllCocktails();

  return <GalleryContent cocktails={cocktails} lang={lang} />;
}
