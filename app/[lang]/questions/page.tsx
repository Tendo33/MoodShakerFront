import { redirect } from "next/navigation";
import Questions from "@/components/pages/Questions";
import ErrorBoundary from "@/components/ErrorBoundary";

interface PageProps {
  params: {
    lang: string;
  };
}

export default async function QuestionsPage({ params }: PageProps) {
  // Validate language parameter
  const validLangs = ["en", "cn"];
  const lang = await Promise.resolve(params.lang);
  
  if (!validLangs.includes(lang)) {
    redirect("/cn/questions");
  }

  return (
    <ErrorBoundary>
      <Questions />
    </ErrorBoundary>
  );
}
