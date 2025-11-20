"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Cocktail } from "@/api/cocktail";
import { useLanguage } from "@/context/LanguageContext";
import { Search, X, Filter, GlassWater, Sparkles, Droplet } from "lucide-react";
import { commonStyles, gradientStyles } from "@/utils/style-constants";

interface GalleryContentProps {
  cocktails: Cocktail[];
  lang: string;
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
];
const ALCOHOL_LEVELS = ["Low", "Medium", "High"];

export default function GalleryContent({
  cocktails,
  lang,
}: GalleryContentProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpirit, setSelectedSpirit] = useState<string | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter Logic
  const filteredCocktails = useMemo(() => {
    return cocktails.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.english_name &&
          c.english_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSpirit = selectedSpirit
        ? c.english_base_spirit?.toLowerCase().includes(selectedSpirit.toLowerCase()) ||
          c.base_spirit?.includes(selectedSpirit)
        : true;

      // For flavors, we check if any of the selected flavor keywords appear in the profile
      const matchesFlavor = selectedFlavor
        ? (c.english_flavor_profiles || []).some((f) =>
            f.toLowerCase().includes(selectedFlavor.toLowerCase())
          ) ||
          (c.flavor_profiles || []).some((f) => f.includes(selectedFlavor))
        : true;

      return matchesSearch && matchesSpirit && matchesFlavor;
    });
  }, [cocktails, searchQuery, selectedSpirit, selectedFlavor]);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-foreground pt-24 pb-20 px-4 md:px-8 relative overflow-hidden">
      {/* Background Ambient Light */}
      <div className="fixed top-0 left-0 w-full h-screen overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-5xl md:text-7xl font-bold font-playfair mb-6 tracking-tight"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300">
              The Cellar
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto font-light tracking-wide"
          >
            {lang === "cn"
              ? "探索由社区创造的独特鸡尾酒配方，每一杯都是一个故事。"
              : "Discover unique cocktail recipes created by the community. Every drink tells a story."}
          </motion.p>
        </div>

        {/* Search & Filter Control Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="sticky top-24 z-30 mb-12"
        >
          <div className="glass-effect border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search Input */}
              <div className="relative w-full flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all"
                  placeholder={
                    lang === "cn" ? "搜索鸡尾酒..." : "Search cocktails..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filter Toggle Button (Mobile) */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`md:hidden p-3 rounded-xl border border-white/10 transition-colors ${
                  isFilterOpen
                    ? "bg-pink-500/20 text-pink-300 border-pink-500/30"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                <Filter className="h-5 w-5" />
              </button>
            </div>

            {/* Expanded Filters */}
            <AnimatePresence>
              {(isFilterOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && ( // Always show on desktop via CSS trick or JS check, simplified here for responsive feeling
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="md:block overflow-hidden"
                >
                  <div className="pt-4 flex flex-col gap-4 border-t border-white/10 mt-4">
                    {/* Spirit Filter */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs uppercase tracking-wider text-gray-500 mr-2 flex items-center gap-1">
                        <GlassWater className="h-3 w-3" /> Base
                      </span>
                      {BASE_SPIRITS.map((spirit) => (
                        <button
                          key={spirit}
                          onClick={() =>
                            setSelectedSpirit(
                              selectedSpirit === spirit ? null : spirit
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 border ${
                            selectedSpirit === spirit
                              ? "bg-white text-black border-white font-medium shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                              : "bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white"
                          }`}
                        >
                          {spirit}
                        </button>
                      ))}
                    </div>

                    {/* Flavor Filter */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs uppercase tracking-wider text-gray-500 mr-2 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Flavor
                      </span>
                      {FLAVORS.map((flavor) => (
                        <button
                          key={flavor}
                          onClick={() =>
                            setSelectedFlavor(
                              selectedFlavor === flavor ? null : flavor
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 border ${
                            selectedFlavor === flavor
                              ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent font-medium shadow-lg"
                              : "bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white"
                          }`}
                        >
                          {flavor}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
              <Link href={`/${lang}/cocktail/${cocktail.id}`} className="block h-full group">
                <div className="relative h-full rounded-3xl overflow-hidden bg-gray-900/40 border border-white/5 shadow-lg transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-pink-500/10 group-hover:-translate-y-2">
                  {/* Image Area */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden">
                    {cocktail.image ? (
                      <Image
                        src={cocktail.image}
                        alt={cocktail.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <GlassWater className="h-12 w-12 text-gray-600" />
                      </div>
                    )}
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
                    
                    {/* Hover Reveal Content */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                       <span className="px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-medium tracking-wide">
                         View Recipe
                       </span>
                    </div>
                  </div>

                  {/* Card Info - Absolute positioned at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                      <h3 className="text-2xl font-bold text-white mb-1 font-playfair leading-tight">
                        {lang === 'en' ? cocktail.english_name || cocktail.name : cocktail.name}
                      </h3>
                      <p className="text-sm text-gray-300 mb-3 line-clamp-1 opacity-80">
                        {lang === 'en' ? cocktail.english_description : cocktail.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-white/10 text-xs font-medium text-pink-200 border border-pink-500/20">
                           {cocktail.base_spirit}
                        </span>
                        {cocktail.alcohol_level && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-white/5 text-xs font-medium text-blue-200 border border-white/10">
                             {cocktail.alcohol_level}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredCocktails.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
               <Search className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No cocktails found</h3>
            <p className="text-gray-400">Try adjusting your filters or search terms.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
