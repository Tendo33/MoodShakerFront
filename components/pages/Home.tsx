"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, History } from "lucide-react"
import { useTheme } from "@/context/ThemeContext"
import { useLanguage } from "@/context/LanguageContext"

// Import cocktail images
const cocktailImages = {
  mojito: "/vibrant-mojito.png",
  margarita: "/vibrant-margarita.png",
  cosmopolitan: "/city-lights-cocktail.png",
}

export default function Home() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const [hasSavedSession, setHasSavedSession] = useState(false)
  const [currentCocktailIndex, setCurrentCocktailIndex] = useState(0)
  const [isClient, setIsClient] = useState(false)

  // Featured cocktails for the hero section
  const featuredCocktails = [
    {
      id: "mojito",
      name: "莫吉托",
      englishName: "Mojito",
      description: "清新薄荷与青柠的完美结合",
      image: cocktailImages.mojito,
    },
    {
      id: "margarita",
      name: "玛格丽特",
      englishName: "Margarita",
      description: "经典龙舌兰鸡尾酒，酸甜平衡",
      image: cocktailImages.margarita,
    },
    {
      id: "cosmopolitan",
      name: "大都会",
      englishName: "Cosmopolitan",
      description: "时尚优雅的蔓越莓伏特加鸡尾酒",
      image: cocktailImages.cosmopolitan,
    },
  ]

  useEffect(() => {
    setIsClient(true)
    const answers = localStorage.getItem("moodshaker-answers")
    setHasSavedSession(!!answers)
  }, [])

  // Rotate featured cocktails
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCocktailIndex((prev) => (prev + 1) % featuredCocktails.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // 确定主题相关的样式
  const bgClass = theme === "dark" ? "bg-gray-900" : "bg-gray-50"
  const textClass = theme === "dark" ? "text-white" : "text-gray-900"
  const cardClass = theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
  const mutedTextClass = theme === "dark" ? "text-gray-400" : "text-gray-600"

  return (
    <div className={`${bgClass} ${textClass}`}>
      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left column - Text content */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent">
                {t("home.title")}
              </h1>
              <p className={`text-lg mb-8 ${mutedTextClass}`}>{t("home.subtitle")}</p>

              {/* Session buttons */}
              {hasSavedSession ? (
                <div className={`p-6 border rounded-xl mb-6 ${cardClass}`}>
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500/20 to-pink-500/20 flex items-center justify-center mr-3">
                      <History className="h-5 w-5 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold">{t("home.savedSession")}</h3>
                  </div>
                  <p className={`mb-5 ${mutedTextClass}`}>{t("home.savedSessionDesc")}</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/questions"
                      className="px-5 py-3 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105 text-center"
                    >
                      {t("home.continue")}
                    </Link>
                    <Link
                      href="/questions?new=true"
                      className={`px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-300 ${textClass} text-center`}
                    >
                      {t("home.new")}
                    </Link>
                  </div>
                </div>
              ) : (
                <Link
                  href="/questions"
                  className="px-8 py-4 text-lg font-medium bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105 flex items-center inline-flex"
                >
                  {t("home.start")}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {/* Right column - Featured cocktail */}
            <div className="relative h-[400px] md:h-[500px]">
              {featuredCocktails.map((cocktail, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-1000 ${
                    index === currentCocktailIndex
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8 pointer-events-none"
                  }`}
                >
                  <div className="relative h-full">
                    <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-pink-500/20 rounded-full blur-xl"></div>
                    <img
                      src={cocktail.image || "/placeholder.svg?height=500&width=500&query=cocktail"}
                      alt={cocktail.name}
                      className="relative rounded-3xl shadow-2xl w-full h-full object-cover"
                      onError={(e) => {
                        // 如果图片加载失败，使用占位图
                        e.currentTarget.src = `/placeholder.svg?height=500&width=500&query=${encodeURIComponent(
                          cocktail.name,
                        )}`
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-3xl">
                      <h3 className="text-2xl font-bold text-white">{cocktail.name}</h3>
                      <p className="text-sm text-gray-300">{cocktail.englishName}</p>
                      <p className="text-white/80 mt-2">{cocktail.description}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Navigation dots */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {featuredCocktails.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentCocktailIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentCocktailIndex
                        ? "bg-gradient-to-r from-amber-500 to-pink-500 scale-125"
                        : "bg-white/30"
                    }`}
                    aria-label={`View cocktail ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-16 ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-100"}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-pink-500 bg-clip-text text-transparent">
              为什么选择 MoodShaker?
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${mutedTextClass}`}>
              我们的智能推荐系统会根据您的喜好和心情，为您找到完美的鸡尾酒
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              className={`border rounded-xl p-6 text-left transition-transform duration-300 hover:scale-105 ${cardClass}`}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                <span className="text-2xl">🧪</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{t("home.feature1.title")}</h3>
              <p className={mutedTextClass}>{t("home.feature1.description")}</p>
            </div>
            <div
              className={`border rounded-xl p-6 text-left transition-transform duration-300 hover:scale-105 ${cardClass}`}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{t("home.feature2.title")}</h3>
              <p className={mutedTextClass}>{t("home.feature2.description")}</p>
            </div>
            <div
              className={`border rounded-xl p-6 text-left transition-transform duration-300 hover:scale-105 ${cardClass}`}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{t("home.feature3.title")}</h3>
              <p className={mutedTextClass}>{t("home.feature3.description")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Cocktails Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-pink-500 bg-clip-text text-transparent">
              热门鸡尾酒
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${mutedTextClass}`}>探索我们用户最喜爱的鸡尾酒</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCocktails.map((cocktail, index) => (
              <div
                key={index}
                className={`border rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105 ${cardClass}`}
              >
                <div className="h-48">
                  <img
                    src={cocktail.image || "/placeholder.svg?height=300&width=400&query=cocktail"}
                    alt={cocktail.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // 如果图片加载失败，使用占位图
                      e.currentTarget.src = `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(
                        cocktail.name,
                      )}`
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{cocktail.name}</h3>
                  <p className="text-sm text-gray-400 mb-3">{cocktail.englishName}</p>
                  <p className={mutedTextClass}>{cocktail.description}</p>
                  <Link
                    href={`/cocktail/recommendation?id=${cocktail.id}`}
                    className="mt-4 w-full py-2 bg-gradient-to-r from-amber-500/20 to-pink-500/20 hover:from-amber-500/30 hover:to-pink-500/30 text-white border border-white/10 rounded-full transition-all duration-300 block text-center"
                  >
                    查看详情
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
