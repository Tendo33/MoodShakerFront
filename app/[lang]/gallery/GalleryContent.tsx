"use client";

import { useState, useEffect, useMemo, useCallback, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import type { GalleryCocktail } from "@/lib/cocktail-types";
import { useLanguage } from "@/context/LanguageContext";
import { Search, X, Filter, GlassWater, Sparkles, Activity } from "lucide-react";

interface GalleryContentProps {
  cocktails: GalleryCocktail[];
  lang: string;
  initialFilters: {
    search?: string;
    spirit?: string;
    flavor?: string;
    alcohol?: string;
  };
}

// --- Constants for Filtering ---
const BASE_SPIRITS = [
  "Gin",
  "Vodka",
  "Rum",
  "Tequila",
  "Whiskey",
  "Brandy",
  "Other",
];
const FLAVORS = [
  "Sweet",
  "Sour",
  "Bitter",
  "Fruity",
  "Herbal",
  "Smoky",
  "Spicy",
  "Salty",
  "Creamy",
];

const ALCOHOL_LEVELS = ["Low", "Medium", "High"];

export default function GalleryContent({
  cocktails,
  lang,
  initialFilters,
}: GalleryContentProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || "");
  const [selectedSpirit, setSelectedSpirit] = useState<string | null>(
    initialFilters.spirit || null,
  );
  const [selectedFlavor, setSelectedFlavor] = useState<string | null>(
    initialFilters.flavor || null,
  );
  const [selectedAlcohol, setSelectedAlcohol] = useState<string | null>(
    initialFilters.alcohol || null,
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(initialFilters.search || "");
      setSelectedSpirit(initialFilters.spirit || null);
      setSelectedFlavor(initialFilters.flavor || null);
      setSelectedAlcohol(initialFilters.alcohol || null);
    }, 0);

    return () => clearTimeout(timer);
  }, [
    initialFilters.search,
    initialFilters.spirit,
    initialFilters.flavor,
    initialFilters.alcohol,
  ]);

  const updateServerFilters = useCallback(
    (next: {
      search: string;
      spirit: string | null;
      flavor: string | null;
      alcohol: string | null;
    }) => {
      const params = new URLSearchParams();
      const normalizedSearch = next.search.trim();

      if (normalizedSearch) {
        params.set("q", normalizedSearch);
      }
      if (next.spirit) {
        params.set("spirit", next.spirit);
      }
      if (next.flavor) {
        params.set("flavor", next.flavor);
      }
      if (next.alcohol) {
        params.set("alcohol", next.alcohol);
      }

      if (typeof window !== "undefined") {
        const currentQuery = window.location.search.replace(/^\?/, "");
        if (currentQuery === params.toString()) {
          return;
        }
      }

      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    },
    [pathname, router],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      updateServerFilters({
        search: searchQuery,
        spirit: selectedSpirit,
        flavor: selectedFlavor,
        alcohol: selectedAlcohol,
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedSpirit, selectedFlavor, selectedAlcohol, updateServerFilters]);

  const filteredCocktails = useMemo(() => cocktails, [cocktails]);

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-black text-foreground pt-24 pb-20 px-4 md:px-8 relative overflow-hidden selection:bg-pink-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-600/10 rounded-full blur-[150px] animate-gentleFloat" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[150px] animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-8xl font-bold font-playfair mb-6 tracking-tight relative inline-block"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50">
              {t("gallery.title")}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-light tracking-wide leading-relaxed"
          >
            {t("gallery.subtitle")}
          </motion.p>
        </div>

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky top-24 z-30 mb-10"
        >
          <div className="bg-black/40 border border-white/10 rounded-2xl p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-3xl max-w-3xl mx-auto transition-all duration-300 hover:bg-black/50 hover:border-white/20 hover:shadow-[0_8px_40px_rgba(236,72,153,0.15)] ring-1 ring-white/5">
            <div className="flex flex-col md:flex-row gap-3 items-center">
              {/* Search Field */}
              <div className="flex-1 w-full relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 group-focus-within:text-pink-400 transition-colors duration-300" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-11 pr-8 py-3 bg-white/5 border border-transparent focus:border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all text-sm shadow-inner"
                  placeholder={t("gallery.search.placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full md:w-auto">
                 <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 border text-sm ${
                    isFilterOpen || selectedSpirit || selectedFlavor || selectedAlcohol
                      ? "bg-pink-500/20 text-pink-300 border-pink-500/30 hover:bg-pink-500/30"
                      : "bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span className="font-medium">{t("gallery.filter.button")}</span>
                  {(selectedSpirit || selectedFlavor || selectedAlcohol) && (
                    <span className="ml-1 flex items-center justify-center w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-bold shadow-lg shadow-pink-500/20">
                      {(selectedSpirit ? 1 : 0) + (selectedFlavor ? 1 : 0) + (selectedAlcohol ? 1 : 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Expandable Filters */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-[0.22,1,0.36,1] ${
                isFilterOpen ? "max-h-[700px] opacity-100 mt-2 pb-1" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-1 pt-1 space-y-4">
                {/* Spirits */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2 ml-1">
                    <GlassWater className="h-3 w-3" />
                    {t("gallery.filter.base")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {BASE_SPIRITS.map((spirit) => (
                      <button
                        key={spirit}
                        onClick={() => setSelectedSpirit(selectedSpirit === spirit ? null : spirit)}
                        className={`px-4 py-2 rounded-full text-xs transition-all duration-400 border backdrop-blur-md active:scale-95 flex items-center gap-1.5 ${
                          selectedSpirit === spirit
                            ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] font-semibold"
                            : "bg-black/40 text-gray-400 border-white/10 hover:border-white/30 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {t(`gallery.spirit.${spirit.toLowerCase()}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alcohol Level */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2 ml-1">
                    <Activity className="h-3 w-3" />
                    {t("gallery.filter.alcohol_level")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ALCOHOL_LEVELS.map((level) => (
                      <button
                        key={level}
                        onClick={() => setSelectedAlcohol(selectedAlcohol === level ? null : level)}
                        className={`px-4 py-2 rounded-full text-xs transition-all duration-400 border backdrop-blur-md active:scale-95 flex items-center gap-1.5 ${
                          selectedAlcohol === level
                            ? "bg-blue-500 text-white border-blue-400 shadow-[0_4px_20px_rgba(59,130,246,0.4)] font-semibold"
                            : "bg-black/40 text-gray-400 border-white/10 hover:border-white/30 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {t(`gallery.level.${level.toLowerCase()}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flavors */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2 ml-1">
                    <Sparkles className="h-3 w-3" />
                    {t("gallery.filter.flavor")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FLAVORS.map((flavor) => (
                      <button
                        key={flavor}
                        onClick={() => setSelectedFlavor(selectedFlavor === flavor ? null : flavor)}
                        className={`px-4 py-2 rounded-full text-xs transition-all duration-400 border backdrop-blur-md active:scale-95 flex items-center gap-1.5 ${
                          selectedFlavor === flavor
                            ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-[0_4px_20px_rgba(236,72,153,0.4)] font-semibold"
                            : "bg-black/40 text-gray-400 border-white/10 hover:border-white/30 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {t(`gallery.flavor.${flavor.toLowerCase()}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {isPending && (
              <p className="px-3 pt-2 text-xs text-gray-500">{t("common.loading")}</p>
            )}
          </div>
        </motion.div>

        {/* Gallery Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
        >
          {filteredCocktails.map((cocktail) => (
            <motion.div key={cocktail.id} variants={itemVariants}>
              <Link
                href={`/${lang}/cocktail/${cocktail.id}`}
                className="block group relative h-full"
              >
                <div className="relative h-full rounded-[2rem] overflow-hidden bg-gray-900 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] py-[1px] px-[1px] transition-all duration-500 group-hover:shadow-[0_30px_60px_-15px_rgba(236,72,153,0.2)] group-hover:border-pink-500/30 group-hover:-translate-y-3 group-hover:scale-[1.02] will-change-transform">
                  
                  {/* Image Container */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[calc(2rem-1px)]">
                    {cocktail.thumbnail || cocktail.image ? (
                      <Image
                        src={cocktail.thumbnail || cocktail.image || "/placeholder.svg"}
                        alt={cocktail.name}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <GlassWater className="h-12 w-12 text-gray-700" />
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-90" />
                  </div>

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <div className="transform transition-transform duration-500 group-hover:-translate-y-1">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="px-2.5 py-1 rounded-lg bg-pink-500/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-pink-200 border border-pink-500/20">
                          {lang === "en" ? cocktail.english_base_spirit || cocktail.base_spirit : cocktail.base_spirit}
                        </span>
                        {(cocktail.alcohol_level || cocktail.english_alcohol_level) && (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-blue-200 border border-blue-500/20">
                             {lang === "en" ? cocktail.english_alcohol_level || cocktail.alcohol_level : cocktail.alcohol_level}
                          </span>
                        )}
                      </div>

                      {/* Title & Desc */}
                      <h3 className="text-2xl font-bold text-white mb-2 font-playfair leading-tight group-hover:text-pink-100 transition-colors">
                        {lang === "en" ? cocktail.english_name || cocktail.name : cocktail.name}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-20 transition-all duration-500 ease-out">
                        {lang === "en" ? cocktail.english_description : cocktail.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Hover Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                     <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 translate-x-full group-hover:animate-shimmer" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredCocktails.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32"
          >
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-[40px] animate-pulse" />
              <div className="relative z-10 flex items-center justify-center w-full h-full rounded-full bg-black/40 border border-white/10 backdrop-blur-xl shadow-2xl">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
            </div>
            <h3 className="text-2xl font-medium text-white mb-3 font-playfair">
              {t("gallery.noResults.title")}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">{t("gallery.noResults.desc")}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
