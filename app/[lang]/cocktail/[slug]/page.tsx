import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import CocktailDetailPage from "@/components/pages/CocktailDetailPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getCocktailBySlug } from "@/lib/cocktail-data";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { buildCocktailMetadata } from "@/lib/i18n/metadata";
import { DataSourceUnavailableError } from "@/lib/runtime-errors";
import {
  buildBreadcrumbSchema,
  buildRecipeSchema,
} from "@/lib/seo/recipe-schema";

interface CocktailPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: CocktailPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;

  try {
    const cocktail = await getCocktailBySlug(slug, locale);

    if (!cocktail) {
      return { title: "Cocktail | MoodShaker" };
    }

    return buildCocktailMetadata({
      locale,
      slug: cocktail.slug,
      name: cocktail.name,
      description: cocktail.description,
      imageUrl: cocktail.imageUrl,
    });
  } catch {
    // A database outage must not fail metadata generation, which would take the
    // whole page down rather than just its title.
    return {
      title: "Cocktail | MoodShaker",
      description: "Discover delicious cocktail recipes on MoodShaker",
    };
  }
}

/**
 * Rendered on demand rather than pre-generated.
 *
 * `generateStaticParams` used to pre-render three cocktails from a hardcoded
 * catalogue, because the build runs with a placeholder `DATABASE_URL` and cannot
 * reach a database. That catalogue doubled as a silent runtime fallback, which is
 * how the project shipped with two migrations that had never been applied — the
 * build succeeded against data that was never in a database.
 */
export default async function CocktailPage({ params }: CocktailPageProps) {
  const { lang, slug } = await params;

  if (!isLocale(lang)) {
    redirect(`/${DEFAULT_LOCALE}/cocktail/${slug}`);
  }

  let cocktail = null;
  try {
    cocktail = await getCocktailBySlug(slug, lang);
  } catch (error) {
    if (!(error instanceof DataSourceUnavailableError)) {
      throw error;
    }

    return (
      <div className="flex justify-center items-center min-h-screen px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-3">
            {lang === "en" ? "Temporarily unavailable" : "暂时无法访问"}
          </h1>
          <p className="text-muted-foreground">
            {lang === "en"
              ? "We could not reach the cocktail database. Please try again shortly."
              : "无法连接鸡尾酒数据库，请稍后重试。"}
          </p>
        </div>
      </div>
    );
  }

  if (!cocktail) {
    notFound();
  }

  return (
    <ErrorBoundary>
      {/*
        Structured data, so a cocktail page is eligible for recipe rich results
        instead of reading as plain prose to a crawler. This is data rather than
        executable code, so the CSP nonce does not apply.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            buildRecipeSchema(cocktail, lang),
            buildBreadcrumbSchema(cocktail, lang),
          ]),
        }}
      />
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen">
            <LoadingSpinner variant="modern" />
          </div>
        }
      >
        <CocktailDetailPage slug={slug} initialData={cocktail} />
      </Suspense>
    </ErrorBoundary>
  );
}
