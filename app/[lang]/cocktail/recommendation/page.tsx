import { redirect } from "next/navigation";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";

// 懒加载推荐页面组件
// 注意：在App Router中，我们移除了ssr: false，因为CocktailRecommendation组件已经使用"use client"
const CocktailRecommendation = dynamic(
  () => import("@/components/pages/CocktailRecommendation"),
  {
    loading: () => (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner variant="modern" />
      </div>
    ),
  },
);

export async function generateMetadata({
  params,
}: {
  params: { lang: string };
}): Promise<Metadata> {
  const { lang } = await params;
  const isEnglish = lang === "en";

  return {
    title: isEnglish ? "Your Recommendation | MoodShaker" : "你的专属推荐 | MoodShaker",
    description: isEnglish
      ? "Your personalized cocktail recommendation is ready."
      : "你的个性化鸡尾酒推荐已生成。",
  };
}

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
      <CocktailRecommendation />
    </ErrorBoundary>
  );
}
