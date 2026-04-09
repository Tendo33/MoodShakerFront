import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import CocktailDetailPage from "@/components/pages/CocktailDetailPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getCocktailById, getPopularCocktailIds } from "@/lib/cocktail-data";
import { DataSourceUnavailableError } from "@/lib/runtime-errors";

interface CocktailPageProps {
  params: Promise<{
    lang: string;
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: CocktailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const cocktail = await getCocktailById(id);
    return {
      title: `${cocktail?.name || "Cocktail"} | MoodShaker`,
      description:
        cocktail?.description ||
        "Discover this delicious cocktail recipe on MoodShaker",
      icons: {
        icon: "/logo.png",
      },
    };
  } catch {
    return {
      title: "Cocktail | MoodShaker",
      description: "Discover delicious cocktail recipes on MoodShaker",
      icons: {
        icon: "/logo.png",
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
  let cocktail = null;
  try {
    cocktail = await getCocktailById(id);
  } catch (error) {
    if (!(error instanceof DataSourceUnavailableError)) {
      throw error;
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-xl w-full border-2 border-primary/40 bg-black/70 p-8 text-center glass-panel">
          <h1 className="text-2xl font-heading font-black tracking-widest uppercase text-primary mb-4">
            {lang === "en" ? "Cocktail detail unavailable" : "鸡尾酒详情暂时不可用"}
          </h1>
          <p className="font-mono text-foreground/80 leading-relaxed">
            {lang === "en"
              ? "We cannot load this cocktail right now. Please try again shortly."
              : "当前无法加载这杯酒的详情，请稍后再试。"}
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
