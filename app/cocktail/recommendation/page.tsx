import { Suspense } from "react"
import CocktailRecommendation from "@/components/pages/CocktailRecommendation"
import LoadingSpinner from "@/components/LoadingSpinner"
import ErrorBoundary from "@/components/ErrorBoundary"

export default function RecommendationPage() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen">
            <LoadingSpinner />
          </div>
        }
      >
        <CocktailRecommendation />
      </Suspense>
    </ErrorBoundary>
  )
}
