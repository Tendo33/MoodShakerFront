import Questions from "@/components/pages/Questions";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function QuestionsPage() {
  return (
    <ErrorBoundary>
      <Questions />
    </ErrorBoundary>
  );
}
