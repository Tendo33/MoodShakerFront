import { redirect } from "next/navigation";
import Questions from "@/components/pages/Questions";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function QuestionsPage({
  params,
}: {
  params: { lang: string };
}) {
  // Validate language parameter
  if (params.lang !== "en" && params.lang !== "cn") {
    redirect("/cn/questions");
  }

  return (
    <ErrorBoundary>
      <Questions />
    </ErrorBoundary>
  );
}
