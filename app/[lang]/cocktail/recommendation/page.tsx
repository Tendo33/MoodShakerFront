import { redirect } from "next/navigation";
import { Suspense } from "react";
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
