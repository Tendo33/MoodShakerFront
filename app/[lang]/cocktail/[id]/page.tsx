import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import CocktailDetailPage from "@/components/pages/CocktailDetailPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  getCocktailById,
  getPopularCocktailIds,
} from "@/services/cocktailService";

interface CocktailPageProps {
  params: {
    lang: string;
    id: string;
  };
}

export async function generateMetadata({
  params,
}: CocktailPageProps): Promise<Metadata> {
  try {
    const cocktail = await getCocktailById(params.id);
    return {
      title: `${cocktail?.name || "Cocktail"} | MoodShaker`,
      description:
        cocktail?.description ||
        "Discover this delicious cocktail recipe on MoodShaker",
    };
  } catch (error) {
    return {
      title: "Cocktail | MoodShaker",
      description: "Discover delicious cocktail recipes on MoodShaker",
    };
  }
}

// Generate static params for popular cocktails
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
  // Validate language parameter
  const { lang } = await params;
  if (lang !== "en" && lang !== "cn") {
    redirect("/cn/cocktail/" + params.id);
  }

  // Validate cocktail ID
  const validCocktailIds = getPopularCocktailIds();
  if (!validCocktailIds.includes(params.id)) {
    notFound();
  }

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen">
            <LoadingSpinner />
          </div>
        }
      >
        <CocktailDetailPage id={params.id} />
      </Suspense>
    </ErrorBoundary>
  );
}
