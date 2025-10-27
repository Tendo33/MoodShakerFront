import { redirect } from "next/navigation";
import type { Metadata } from "next";
import dynamic from "next/dynamic";

// 懒加载首页组件，减少初始包大小
// 注意：在App Router中，我们移除了ssr: false，因为Home组件已经使用"use client"
const Home = dynamic(() => import("@/components/pages/Home"), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "MoodShaker - Find Your Perfect Cocktail",
  description:
    "Answer a few simple questions and let us recommend the perfect cocktail for you",
  icons: {
    icon: "logo.png",
  },
};

export default function LangHomePage({
  params,
}: {
  params: { lang: string };
}) {
  // Validate language parameter
  const { lang } = params;
  if (lang !== "en" && lang !== "cn") {
    redirect("/cn");
  }

  return <Home />;
}
