"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Clock, Droplet, RefreshCw, Beaker, GlassWater, Share2, Printer } from "lucide-react"
import { useTheme } from "@/context/ThemeContext"
import { useCocktail } from "@/context/CocktailContext"
import { useLanguage } from "@/context/LanguageContext"
import { getCocktailById } from "@/services/cocktailService"
import type { Cocktail } from "@/api/cocktail"
import LoadingSpinner from "@/components/LoadingSpinner"
import CocktailImage from "@/components/CocktailImage"

// Static cocktail images
const staticCocktailImages = {
  mojito: "/cocktail-mojito.png",
  margarita: "/cocktail-margarita.png",
  cosmopolitan: "/cocktail-cosmopolitan.png",
  "whiskey-sour": "/classic-whiskey-sour.png",
  manhattan: "/classic-manhattan.png",
  "old-fashioned": "/classic-old-fashioned.png",
  negroni: "/classic-negroni.png",
  daiquiri: "/classic-daiquiri.png",
}

export default function CocktailRecommendation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cocktailId = searchParams?.get("id")
  const { theme } = useTheme()
  const { t, locale } = useLanguage()
  const {
    recommendation: contextCocktail,
    userFeedback,
    imageData,
    isLoading: isContextLoading,
    isImageLoading,
    loadSavedData,
  } = useCocktail()

  const [cocktail, setCocktail] = useState<Cocktail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [showShareTooltip, setShowShareTooltip] = useState(false)

  // Optimize computed properties with useMemo
  const themeClasses = useMemo(
    () =>
      theme === "dark"
        ? "bg-gradient-to-b from-gray-950 to-gray-900 text-white"
        : "bg-gradient-to-b from-amber-50 to-white text-gray-900",
    [theme],
  )

  const textColorClass = useMemo(() => (theme === "dark" ? "text-white" : "text-gray-900"), [theme])
  const cardClasses = useMemo(
    () => (theme === "dark" ? "bg-white/10 text-white" : "bg-white/80 text-gray-900"),
    [theme],
  )
  const borderClasses = useMemo(() => (theme === "dark" ? "border-white/10" : "border-gray-200"), [theme])

  const loadingOverlayClasses = theme === "dark" ? "bg-gray-800/50" : "bg-white/50"
  const tagClasses = theme === "dark" ? "bg-white/10 text-white" : "bg-white/90 text-gray-900"
  const buttonClasses = theme === "dark" ? "bg-white/5" : "bg-white/90"

  const handleBack = () => {
    router.push("/")
  }

  const handleTryAgain = () => {
    // Clear local storage answers and restart the question flow
    if (typeof window !== "undefined") {
      localStorage.removeItem("moodshaker-answers")
      localStorage.removeItem("moodshaker-feedback")
      localStorage.removeItem("moodshaker-recommendation")
      localStorage.removeItem("moodshaker-base-spirits")
    }
    router.push("/questions")
  }

  const handleStepHover = (stepNumber: number) => {
    setActiveStep(stepNumber)
  }

  const handleStepLeave = () => {
    setActiveStep(null)
  }

  const handleShare = () => {
    try {
      // Check if navigator.share is available and we're in a secure context
      if (navigator.share && window.isSecureContext) {
        navigator
          .share({
            title: `${cocktail?.name} Recipe - MoodShaker`,
            text: `Check out this ${cocktail?.name} recipe from MoodShaker!`,
            url: window.location.href,
          })
          .catch((err) => {
            console.log("Share failed:", err.message)
            // Fall back to clipboard on any share error
            copyToClipboard()
          })
      } else {
        // Fallback for browsers that don't support the Web Share API
        copyToClipboard()
      }
    } catch (err) {
      console.error("Error in share functionality:", err)
      copyToClipboard()
    }
  }

  // Separate clipboard function for better organization
  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(window.location.href)
      setShowShareTooltip(true)
      setTimeout(() => setShowShareTooltip(false), 2000)
    } catch (err) {
      console.error("Clipboard write failed:", err)
      // If clipboard fails too, at least show the URL
      alert(`Copy this URL: ${window.location.href}`)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Load cocktail data
  useEffect(() => {
    if (cocktailId) {
      // If there's an ID parameter, load cocktail data from service
      setIsLoading(true)
      getCocktailById(cocktailId)
        .then((data) => {
          if (data) {
            setCocktail(data)
          }
          setIsLoading(false)
        })
        .catch((error) => {
          console.error("Error fetching cocktail:", error)
          setIsLoading(false)
        })
    } else if (!cocktail) {
      // Only load saved data if we don't already have a cocktail
      loadSavedData()
      setCocktail(contextCocktail)
    }
  }, [cocktailId, contextCocktail, loadSavedData, cocktail])

  // Show loading state
  if ((cocktailId && isLoading) || (!cocktailId && isContextLoading)) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${themeClasses}`}>
        <LoadingSpinner text={t("recommendation.loading")} />
      </div>
    )
  }

  // If no cocktail found
  if (!cocktail) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${themeClasses}`}>
        <div className="container mx-auto py-12">
          <div className="text-center py-12 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl">
            <h2 className={`text-2xl font-medium mb-4 ${textColorClass}`}>{t("recommendation.notFound")}</h2>
            <p className="text-gray-300 mb-6">{t("recommendation.notFoundDesc")}</p>
            <button
              onClick={handleBack}
              className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 border-0 text-white px-8 py-3 rounded-full shadow-lg shadow-pink-500/20 transition-all duration-300 hover:scale-105 whitespace-nowrap"
            >
              {t("recommendation.back")}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses}`}>
      {/* Enhanced background effects */}
      <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
        <div
          className="absolute top-1/4 right-1/4 w-72 h-72 bg-amber-500 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-pink-500 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "1.5s" }}
        ></div>
        <div
          className="absolute top-2/3 right-1/3 w-64 h-64 bg-purple-500 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "3s" }}
        ></div>
      </div>

      <div className="container mx-auto py-8 px-4 relative">
        {/* Navigation and actions bar */}
        <div className="flex flex-wrap justify-between items-center mb-8">
          <button
            className={`flex items-center hover:bg-white/10 px-4 py-2 rounded-full transition-colors duration-300 group ${textColorClass}`}
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:translate-x-[-4px] transition-transform" />{" "}
            {t("recommendation.back")}
          </button>

          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center p-2.5 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Print recipe"
              title="Print recipe"
            >
              <Printer className="h-5 w-5" />
            </button>
            <div className="relative">
              <button
                onClick={handleShare}
                className="flex items-center justify-center p-2.5 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Share recipe"
                title="Share recipe"
              >
                <Share2 className="h-5 w-5" />
              </button>
              {showShareTooltip && (
                <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-black/80 text-white text-xs rounded whitespace-nowrap">
                  {t("recommendation.copied")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User feedback section */}
        {!cocktailId && userFeedback && (
          <div
            className={`mb-8 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg transition-colors duration-300 ${cardClasses}`}
          >
            <div className="p-4 bg-gradient-to-r from-amber-500/10 to-pink-500/10">
              <h3 className={`text-lg font-bold mb-1 ${textColorClass}`}>{t("recommendation.yourRequirements")}</h3>
              <p className="text-gray-300">{userFeedback}</p>
            </div>
          </div>
        )}

        {/* Hero section with cocktail image and basic info */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Cocktail image */}
            <div className="w-full md:w-2/5">
              <div
                className={`rounded-2xl overflow-hidden shadow-xl border transition-colors duration-300 group ${borderClasses} relative aspect-square`}
              >
                {!cocktailId && isImageLoading && (
                  <div
                    className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm transition-colors duration-300 ${loadingOverlayClasses}`}
                  >
                    <div className="text-center">
                      <div className="relative w-12 h-12 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-amber-500/20"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-b-amber-500 border-r-pink-500 border-t-transparent border-l-transparent animate-spin"></div>
                      </div>
                      <p className="text-gray-300 font-medium">{t("recommendation.imageLoading")}</p>
                    </div>
                  </div>
                )}
                <CocktailImage
                  cocktailId={cocktailId}
                  imageData={imageData}
                  cocktailName={cocktail?.name}
                  staticCocktailImages={staticCocktailImages}
                  placeholderClassName={loadingOverlayClasses}
                />
              </div>
            </div>

            {/* Cocktail info */}
            <div className="w-full md:w-3/5 flex flex-col">
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent inline-block">
                  {cocktail?.name}
                </h1>
                {cocktail?.english_name && <p className="text-gray-400 text-xl mb-4">{cocktail.english_name}</p>}
              </div>

              <div className="mt-4 mb-6">
                <p className="text-gray-300 leading-relaxed text-lg">{cocktail?.description}</p>
              </div>

              {/* Specs grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-auto">
                <div className="flex flex-col items-center md:items-start">
                  <div className="flex items-center mb-1">
                    <Beaker className="mr-2 h-5 w-5 text-pink-500" />
                    <p className="text-sm text-gray-400">Base Spirit</p>
                  </div>
                  <p className={`font-medium ${textColorClass}`}>{cocktail?.base_spirit}</p>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <div className="flex items-center mb-1">
                    <Droplet className="mr-2 h-5 w-5 text-blue-500" />
                    <p className="text-sm text-gray-400">Alcohol Level</p>
                  </div>
                  <p className={`font-medium ${textColorClass}`}>{cocktail?.alcohol_level}</p>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <div className="flex items-center mb-1">
                    <Clock className="mr-2 h-5 w-5 text-amber-500" />
                    <p className="text-sm text-gray-400">Prep Time</p>
                  </div>
                  <p className={`font-medium ${textColorClass}`}>{cocktail?.time_required || "5 minutes"}</p>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <div className="flex items-center mb-1">
                    <GlassWater className="mr-2 h-5 w-5 text-emerald-500" />
                    <p className="text-sm text-gray-400">Serving Glass</p>
                  </div>
                  <p className={`font-medium ${textColorClass}`}>{cocktail?.serving_glass}</p>
                </div>
              </div>

              {/* Flavor tags */}
              <div className="mt-6">
                <p className="text-sm text-gray-400 mb-2">Flavor Profile</p>
                <div className="flex flex-wrap gap-2">
                  {cocktail?.flavor_profiles?.map((flavor, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 backdrop-blur-sm rounded-full text-xs border border-white/10 transition-colors duration-300 ${tagClasses}`}
                    >
                      {flavor}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation reason (if available) */}
        {!cocktailId && cocktail?.match_reason && (
          <div
            className={`mb-12 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg transition-colors duration-300 ${cardClasses}`}
          >
            <div className="p-5 bg-gradient-to-r from-amber-500/10 to-pink-500/10">
              <h3 className="text-xl font-bold mb-1 text-amber-400">{t("recommendation.recommendationReason")}</h3>
            </div>
            <div className="p-5">
              <p className="text-gray-300 leading-relaxed">{cocktail.match_reason}</p>
            </div>
          </div>
        )}

        {/* Recipe section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-pink-500 bg-clip-text text-transparent inline-block">
            Recipe
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Ingredients */}
            <div
              className={`backdrop-blur-sm border border-white/10 shadow-lg rounded-xl overflow-hidden transition-colors duration-300 ${cardClasses}`}
            >
              <div className="p-5 bg-gradient-to-r from-amber-500/20 to-pink-500/20">
                <h3 className={`text-xl font-bold ${textColorClass}`}>{t("recommendation.ingredients")}</h3>
              </div>
              <div className="p-5">
                <ul className="divide-y divide-gray-700/30">
                  {cocktail?.ingredients?.map((ingredient, index) => (
                    <li key={index} className="py-3 flex justify-between items-center">
                      <span className={`${textColorClass} font-medium`}>{ingredient.name}</span>
                      <span className="text-amber-400 font-medium">
                        {ingredient.amount}
                        {ingredient.unit ? ` ${ingredient.unit}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tools */}
            <div
              className={`backdrop-blur-sm border border-white/10 shadow-lg rounded-xl overflow-hidden transition-colors duration-300 ${cardClasses}`}
            >
              <div className="p-5 bg-gradient-to-r from-pink-500/20 to-amber-500/20">
                <h3 className={`text-xl font-bold ${textColorClass}`}>{t("recommendation.tools")}</h3>
              </div>
              <div className="p-5">
                <ul className="space-y-3">
                  {cocktail?.tools?.map((tool, index) => (
                    <li key={index} className="flex flex-col">
                      <span className={`${textColorClass} font-medium`}>{tool.name}</span>
                      {tool.alternative && (
                        <span className="text-sm text-gray-400 mt-1">
                          {locale === "en" ? "Alternative: " : "替代品: "}
                          {tool.alternative}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Steps */}
            <div
              className={`backdrop-blur-sm border border-white/10 shadow-lg rounded-xl overflow-hidden transition-colors duration-300 lg:col-span-1 ${cardClasses}`}
            >
              <div className="p-5 bg-gradient-to-r from-pink-500/20 to-purple-500/20">
                <h3 className={`text-xl font-bold ${textColorClass}`}>{t("recommendation.steps")}</h3>
              </div>
              <div className="p-5">
                <ol className="space-y-6">
                  {cocktail?.steps?.map((step) => (
                    <li
                      key={step.step_number}
                      className="flex"
                      onMouseEnter={() => handleStepHover(step.step_number)}
                      onMouseLeave={handleStepLeave}
                    >
                      <span
                        className={`mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-lg transition-transform duration-300 flex-shrink-0 ${
                          activeStep === step.step_number ? "scale-110" : ""
                        }`}
                      >
                        {step.step_number}
                      </span>
                      <div className="flex-1">
                        <p className={`${textColorClass}`}>{step.description}</p>
                        {step.tips && (
                          <p className="text-sm text-amber-400 mt-2 italic">
                            {locale === "en" ? "Tip: " : "提示: "}
                            {step.tips}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-16 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleBack}
            className={`flex items-center justify-center backdrop-blur-sm hover:bg-white/10 border border-white/20 rounded-full transition-all duration-300 group whitespace-nowrap ${textColorClass} ${buttonClasses} px-6 py-3`}
          >
            <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-[-4px] transition-transform" />{" "}
            {t("recommendation.back")}
          </button>
          {!cocktailId && (
            <button
              onClick={handleTryAgain}
              className="flex items-center justify-center bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 border-0 text-white shadow-lg shadow-pink-500/20 px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 whitespace-nowrap"
            >
              <RefreshCw className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />{" "}
              {t("recommendation.tryAgain")}
            </button>
          )}
        </div>
      </div>

      {/* Print styles - hidden in normal view, only applied when printing */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          
          header, footer, button, .bg-gradient-to-r, .bg-gradient-to-b {
            display: none !important;
          }
          
          .container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
          }
          
          h1, h2, h3, p, li {
            color: black !important;
          }
          
          .rounded-xl, .rounded-2xl, .shadow-lg, .shadow-xl {
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          
          .border {
            border: 1px solid #ddd !important;
          }
          
          .grid {
            display: block !important;
          }
          
          .grid > div {
            margin-bottom: 20px !important;
          }
        }
      `}</style>
    </div>
  )
}
