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
  if (lang !== "en" && lang !== "cn") {
    redirect("/cn/cocktail/recommendation");
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
        <CocktailRecommendation />
      </Suspense>
    </ErrorBoundary>
  );
}
