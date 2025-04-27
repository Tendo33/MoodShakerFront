import { redirect } from "next/navigation";
import Questions from "@/components/pages/Questions";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function QuestionsPage({
  params,
}: {
  params: { lang: string };
}) {
  // Validate language parameter
  if (params.lang !== "en" && params.lang !== "zh") {
    redirect("/en/questions");
  }

  return (
    <ErrorBoundary>
      <Questions />
    </ErrorBoundary>
  );
}
