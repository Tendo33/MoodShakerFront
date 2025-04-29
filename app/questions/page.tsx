import Questions from "@/components/pages/Questions";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Suspense } from "react";

export default function QuestionsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <Questions />
      </Suspense>
    </ErrorBoundary>
  );
}
