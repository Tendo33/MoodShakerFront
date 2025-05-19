import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Questions from "@/components/pages/Questions";
import ErrorBoundary from "@/components/ErrorBoundary";

interface PageProps {
  params: {
    lang: string;
  };
}

export const metadata: Metadata = {
  title: "Questions | MoodShaker",
  description: "Answer a few questions to find your perfect cocktail",
  icons: {
    icon: "logo.png",
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
