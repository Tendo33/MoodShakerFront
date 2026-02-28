import { redirect } from "next/navigation";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/ErrorBoundary";

// 懒加载问题页面组件
// 注意：在App Router中，我们移除了ssr: false，因为Questions组件已经使用"use client"
const Questions = dynamic(() => import("@/components/pages/Questions"), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  ),
});

interface PageProps {
  params: {
    lang: string;
  };
}

export const metadata: Metadata = {
  title: "Questions | MoodShaker",
  description: "Answer a few questions to find your perfect cocktail",
  icons: {
    icon: "/logo.png",
  },
};

export default async function QuestionsPage({ params }: PageProps) {
  // Validate language parameter
  const validLangs = ["en", "cn"];

  const { lang } = await params;

  if (!validLangs.includes(lang)) {
    redirect("/cn/questions");
  }

  return (
    <ErrorBoundary>
      <Questions />
    </ErrorBoundary>
  );
}
