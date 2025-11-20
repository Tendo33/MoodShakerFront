import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import CocktailDetailPage from "@/components/pages/CocktailDetailPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getCocktailFromDB } from "@/lib/cocktail-data";
import { getPopularCocktailIds } from "@/services/cocktailService";

interface CocktailPageProps {
  params: {
    lang: string;
    id: string;
  };
}

export async function generateMetadata({
  params,
}: CocktailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const cocktail = await getCocktailFromDB(id);
    return {
      title: `${cocktail?.name || "Cocktail"} | MoodShaker`,
      description:
        cocktail?.description ||
        "Discover this delicious cocktail recipe on MoodShaker",
      icons: {
        icon: "logo.png",
      },
    };
  } catch (error) {
    return {
      title: "Cocktail | MoodShaker",
      description: "Discover delicious cocktail recipes on MoodShaker",
      icons: {
        icon: "logo.png",
      },
    };
  }
}

// Generate static params for popular cocktails - Optional: Keep or remove.
// Since we now have dynamic DB content, static generation of EVERYTHING is impossible.
// But we can still statically generate popular ones.
export function generateStaticParams() {
  const cocktailIds = getPopularCocktailIds();
  const languages = ["en", "cn"];

  return languages.flatMap((lang) =>
    cocktailIds.map((id) => ({
      lang,
      id,
    })),
  );
}

export default async function CocktailPage({ params }: CocktailPageProps) {
  const { lang, id } = await params;

  // Validate language parameter
  if (lang !== "en" && lang !== "cn") {
    redirect("/cn/cocktail/" + id);
  }

  // Fetch cocktail from DB (or fallback to popular)
  const cocktail = await getCocktailFromDB(id);

  if (!cocktail) {
    notFound();
  }

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen">
            <LoadingSpinner variant="modern" />
          </div>
        }
      >
        <CocktailDetailPage id={id} initialData={cocktail} />
      </Suspense>
    </ErrorBoundary>
  );
}
