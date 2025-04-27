import { redirect } from "next/navigation";
import { Suspense } from "react";
import CocktailRecommendation from "@/components/pages/CocktailRecommendation";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";

export default async function RecommendationPage({
  params,
}: {
  params: { lang: string };
}) {
  // Validate language parameter
  const { lang } = await params;
  if (lang !== "en" && lang !== "zh") {
    redirect("/en/cocktail/recommendation");
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
        <CocktailRecommendation />
      </Suspense>
    </ErrorBoundary>
  );
}
