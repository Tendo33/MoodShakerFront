import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";
import CocktailRecommendation from "@/components/pages/CocktailRecommendation";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/i18n/metadata";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;

  return {
    ...buildPageMetadata({
      locale,
      path: "/cocktail/recommendation",
      titleKey: "seo.recommendation.title",
      descriptionKey: "seo.recommendation.description",
    }),
    // A recommendation is private and reached with an edit token; there is nothing
    // here for a crawler to index, and indexing it would expose one user's result
    // under a shared URL.
    robots: { index: false, follow: false },
  };
}

/**
 * Imported directly rather than through `next/dynamic`.
 *
 * The wrapper had no `ssr: false`, so it never prevented server rendering — it
 * only added a client chunk and a second spinner alongside the Suspense fallback.
 */
export default async function RecommendationPage({ params }: PageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    redirect(`/${DEFAULT_LOCALE}/cocktail/recommendation`);
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
