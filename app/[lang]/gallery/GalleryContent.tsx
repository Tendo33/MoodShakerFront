"use client";

import { useCallback, useEffect, useMemo, useState, useTransition, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import type { PublicCocktailSummary } from "@/lib/cocktail-types";
import { useLanguage } from "@/context/LanguageContext";
import { GradientText } from "@/components/ui/core";
import { shouldBypassNextImageOptimization } from "@/utils/image-optimization";
import { Activity, Filter, GlassWater, Search, Sparkles, X } from "lucide-react";

interface GalleryContentProps {
  cocktails: PublicCocktailSummary[];
  nextCursor: string | null;
  lang: string;
  initialFilters: {
    search?: string;
    cursor?: string;
    spirit?: string;
    flavor?: string;
    alcohol?: string;
  };
}

const BASE_SPIRITS = ["Gin", "Vodka", "Rum", "Tequila", "Whiskey", "Brandy", "Other"];
const FLAVORS = ["Sweet", "Sour", "Bitter", "Fruity", "Herbal", "Smoky", "Spicy", "Salty", "Creamy"];
const ALCOHOL_LEVELS = ["Low", "Medium", "High"];

export default function GalleryContent({
  cocktails,
  nextCursor,
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
  const filterPanelId = useId();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(initialFilters.search || "");
      setSelectedSpirit(initialFilters.spirit || null);
      setSelectedFlavor(initialFilters.flavor || null);
      setSelectedAlcohol(initialFilters.alcohol || null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    initialFilters.alcohol,
    initialFilters.flavor,
    initialFilters.search,
    initialFilters.spirit,
  ]);

  const createQueryString = useCallback(
    (overrides?: {
      search?: string;
      cursor?: string | null;
      spirit?: string | null;
      flavor?: string | null;
      alcohol?: string | null;
    }) => {
      const params = new URLSearchParams();
      const nextSearch = overrides?.search ?? searchQuery;
      const nextSpirit = overrides?.spirit ?? selectedSpirit;
      const nextFlavor = overrides?.flavor ?? selectedFlavor;
      const nextAlcohol = overrides?.alcohol ?? selectedAlcohol;
      const nextCursor = overrides?.cursor ?? null;

      if (nextSearch.trim()) {
        params.set("q", nextSearch.trim());
      }
      if (nextSpirit) {
        params.set("spirit", nextSpirit);
      }
      if (nextFlavor) {
        params.set("flavor", nextFlavor);
      }
      if (nextAlcohol) {
        params.set("alcohol", nextAlcohol);
      }
      if (nextCursor) {
        params.set("cursor", nextCursor);
      }

      return params.toString();
    },
    [searchQuery, selectedAlcohol, selectedFlavor, selectedSpirit],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const query = createQueryString({ cursor: null });
      const nextUrl = query ? `${pathname}?${query}` : pathname;
      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [
    createQueryString,
    pathname,
    router,
    searchQuery,
    selectedAlcohol,
    selectedFlavor,
    selectedSpirit,
  ]);

  const renderableCocktails = useMemo(
    () => cocktails.filter((cocktail) => cocktail.id.trim().length > 0),
    [cocktails],
  );

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
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 md:px-8 relative overflow-hidden selection:bg-primary/30">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-8%] left-[-8%] h-[28%] w-[28%] rounded-full bg-primary/8 blur-[110px] animate-gentleFloat" />
        <div className="absolute bottom-[-8%] right-[-8%] h-[28%] w-[28%] rounded-full bg-secondary/8 blur-[110px] animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <GradientText
              as="h1"
              className="text-4xl md:text-6xl lg:text-7xl mb-6 tracking-widest uppercase drop-shadow-[0_0_15px_rgba(255,0,255,0.6)]"
            >
              {t("gallery.title")}
            </GradientText>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-mono tracking-wide leading-relaxed"
          >
            {t("gallery.subtitle")}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky top-24 z-30 mb-10"
        >
          <div className="glass-panel border-2 border-primary/40 rounded-none p-3 shadow-[0_0_25px_rgba(255,0,255,0.2)] backdrop-blur-3xl max-w-3xl mx-auto transition-all duration-300 hover:border-primary hover:shadow-[0_0_35px_rgba(255,0,255,0.35)]">
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <div className="flex-1 w-full relative group">
                <label htmlFor="gallery-search" className="sr-only">
                  {t("gallery.search.placeholder")}
                </label>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-secondary transition-colors duration-300" />
                </div>
                <input
                  type="text"
                  id="gallery-search"
                  className="block w-full pl-11 pr-8 py-3 bg-black/40 border-2 border-primary/30 rounded-none text-foreground placeholder-muted-foreground focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/40 transition-all text-sm shadow-inner"
                  placeholder={t("gallery.search.placeholder")}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  autoComplete="off"
                  aria-label={t("gallery.search.placeholder")}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1 top-1/2 inline-flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus-ring"
                    aria-label={lang === "en" ? "Clear search" : "清空搜索"}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen((value) => !value)}
                  className={`flex-1 md:flex-none flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 rounded-none transition-all duration-300 border-2 text-sm font-mono uppercase tracking-widest focus-ring ${
                    isFilterOpen || selectedSpirit || selectedFlavor || selectedAlcohol
                      ? "bg-primary/20 text-primary border-primary/50 hover:bg-primary/30 shadow-[0_0_15px_rgba(255,0,255,0.25)]"
                      : "bg-black/40 text-muted-foreground border-primary/20 hover:border-primary hover:text-primary"
                  }`}
                  aria-expanded={isFilterOpen}
                  aria-controls={filterPanelId}
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span className="font-medium">{t("gallery.filter.button")}</span>
                </button>
              </div>
            </div>

            <div
              id={filterPanelId}
              className="mt-2 pb-1"
              hidden={!isFilterOpen}
              aria-hidden={!isFilterOpen}
            >
              <div className="px-1 pt-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 ml-1">
                    <GlassWater className="h-3 w-3" />
                    {t("gallery.filter.base")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {BASE_SPIRITS.map((spirit) => (
                      <button
                        key={spirit}
                        type="button"
                        onClick={() => setSelectedSpirit(selectedSpirit === spirit ? null : spirit)}
                        className={`min-h-11 px-4 py-2.5 rounded-none text-xs transition-all duration-400 border-2 backdrop-blur-md active:scale-95 font-mono uppercase tracking-widest focus-ring ${
                          selectedSpirit === spirit
                            ? "bg-secondary text-black border-secondary shadow-[0_0_15px_rgba(0,255,255,0.4)] font-semibold"
                            : "bg-black/40 text-muted-foreground border-primary/20 hover:border-secondary hover:text-secondary hover:bg-secondary/10"
                        }`}
                        aria-pressed={selectedSpirit === spirit}
                      >
                        {t(`gallery.spirit.${spirit.toLowerCase()}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 ml-1">
                    <Activity className="h-3 w-3" />
                    {t("gallery.filter.alcohol_level")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ALCOHOL_LEVELS.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSelectedAlcohol(selectedAlcohol === level ? null : level)}
                        className={`min-h-11 px-4 py-2.5 rounded-none text-xs transition-all duration-400 border-2 backdrop-blur-md active:scale-95 font-mono uppercase tracking-widest focus-ring ${
                          selectedAlcohol === level
                            ? "bg-accent text-black border-accent shadow-[0_0_15px_rgba(255,153,0,0.4)] font-semibold"
                            : "bg-black/40 text-muted-foreground border-primary/20 hover:border-accent hover:text-accent hover:bg-accent/10"
                        }`}
                        aria-pressed={selectedAlcohol === level}
                      >
                        {t(`gallery.level.${level.toLowerCase()}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 ml-1">
                    <Sparkles className="h-3 w-3" />
                    {t("gallery.filter.flavor")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FLAVORS.map((flavor) => (
                      <button
                        key={flavor}
                        type="button"
                        onClick={() => setSelectedFlavor(selectedFlavor === flavor ? null : flavor)}
                        className={`min-h-11 px-4 py-2.5 rounded-none text-xs transition-all duration-400 border-2 backdrop-blur-md active:scale-95 font-mono uppercase tracking-widest focus-ring ${
                          selectedFlavor === flavor
                            ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(255,0,255,0.4)] font-semibold"
                            : "bg-black/40 text-muted-foreground border-primary/20 hover:border-primary hover:text-primary hover:bg-primary/10"
                        }`}
                        aria-pressed={selectedFlavor === flavor}
                      >
                        {t(`gallery.flavor.${flavor.toLowerCase()}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {isPending && (
              <p className="px-3 pt-2 text-xs text-muted-foreground">
                {t("common.loading")}
              </p>
            )}
          </div>
        </motion.div>

        {renderableCocktails.length === 0 ? (
          <div className="glass-panel border-2 border-primary/30 p-10 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-heading font-bold uppercase tracking-widest text-primary mb-4">
              {t("gallery.noResults.title")}
            </h2>
            <p className="font-mono text-foreground/80">{t("gallery.noResults.desc")}</p>
          </div>
        ) : (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
            >
              {renderableCocktails.map((cocktail) => (
                <motion.div key={cocktail.id} variants={itemVariants} className="content-auto">
                  <Link
                    href={`/${lang}/cocktail/${cocktail.id}`}
                    className="block group relative h-full focus-ring"
                  >
                    <div className="relative h-full rounded-none overflow-hidden glass-panel border-2 border-primary/40 shadow-[0_0_16px_rgba(255,0,255,0.15)] transition-all duration-500 group-hover:shadow-[0_0_22px_rgba(0,255,255,0.35)] group-hover:border-secondary group-hover:-translate-y-3 group-hover:scale-[1.02] will-change-transform">
                      <div className="relative aspect-[4/5] overflow-hidden bg-black/60">
                        <Image
                          src={
                            cocktail.thumbnail ||
                            `/placeholder.svg?height=640&width=512&query=${encodeURIComponent(cocktail.name)}`
                          }
                          alt={lang === "en" ? cocktail.english_name || cocktail.name : cocktail.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                          className="object-cover opacity-92 transition-transform duration-500 group-hover:scale-[1.03]"
                          unoptimized={shouldBypassNextImageOptimization(cocktail.thumbnail)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                      </div>
                      <div className="p-5 space-y-4">
                        <div>
                          <h2 className="text-xl font-heading font-bold uppercase tracking-widest text-primary group-hover:text-secondary transition-colors">
                            {lang === "en" ? cocktail.english_name || cocktail.name : cocktail.name}
                          </h2>
                          {lang === "cn" && cocktail.english_name && (
                            <p className="text-xs font-mono tracking-[0.2em] uppercase text-secondary">
                              {cocktail.english_name}
                            </p>
                          )}
                        </div>
                        <p className="font-mono text-sm text-foreground/80 line-clamp-3">
                          {lang === "en"
                            ? cocktail.english_description || cocktail.description
                            : cocktail.description}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs font-mono uppercase tracking-widest">
                          <span className="px-3 py-1 border border-primary/40 text-primary">
                            {lang === "en"
                              ? cocktail.english_base_spirit || cocktail.base_spirit
                              : cocktail.base_spirit}
                          </span>
                          <span className="px-3 py-1 border border-secondary/40 text-secondary">
                            {lang === "en"
                              ? cocktail.english_alcohol_level || cocktail.alcohol_level
                              : cocktail.alcohol_level}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {nextCursor && (
              <div className="mt-12 flex justify-center">
                <Link
                  href={`${pathname}?${createQueryString({ cursor: nextCursor })}`}
                  className="px-6 py-3 border-2 border-primary text-primary hover:bg-primary hover:text-black transition-all duration-300 font-mono uppercase tracking-widest focus-ring"
                >
                  {lang === "en" ? "Next Page" : "下一页"}
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
