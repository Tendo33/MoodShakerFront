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
  const activeFilterCount =
    [selectedSpirit, selectedFlavor, selectedAlcohol].filter(Boolean).length +
    (searchQuery.trim() ? 1 : 0);

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

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-14 text-center md:mb-16">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <GradientText
              as="h1"
              className="mb-6 text-4xl uppercase tracking-[0.16em] drop-shadow-[0_0_14px_rgba(255,79,216,0.28)] md:text-6xl lg:text-7xl"
            >
              {t("gallery.title")}
            </GradientText>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mx-auto max-w-2xl text-base font-mono leading-relaxed tracking-[0.04em] text-muted-foreground md:text-lg"
          >
            {t("gallery.subtitle")}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-4 text-xs font-mono uppercase tracking-[0.22em] text-foreground/55 md:text-sm"
          >
            {lang === "en"
              ? `${renderableCocktails.length} cocktails in view`
              : `当前展示 ${renderableCocktails.length} 款鸡尾酒`}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky top-24 z-30 mb-10"
        >
          <div className="glass-panel mx-auto max-w-4xl border border-primary/30 p-3 shadow-[0_24px_48px_rgba(3,0,9,0.3),0_0_18px_rgba(255,79,216,0.12)] backdrop-blur-3xl transition-all duration-300 hover:border-primary/50">
            <div className="flex flex-col items-center gap-3 md:flex-row">
              <div className="group relative w-full flex-1">
                <label htmlFor="gallery-search" className="sr-only">
                  {t("gallery.search.placeholder")}
                </label>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-secondary transition-colors duration-300" />
                </div>
                <input
                  type="text"
                  id="gallery-search"
                  className="block w-full border border-primary/30 bg-black/40 py-3 pl-11 pr-10 text-sm text-foreground shadow-inner transition-all placeholder:text-muted-foreground focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/25"
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

              <div className="flex w-full gap-2 md:w-auto">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen((value) => !value)}
                  className={`focus-ring flex min-h-11 flex-1 items-center justify-center gap-2 border px-4 py-2.5 text-sm font-mono uppercase tracking-[0.18em] transition-all duration-300 md:flex-none ${
                    isFilterOpen || selectedSpirit || selectedFlavor || selectedAlcohol
                      ? "border-primary/50 bg-primary/16 text-primary shadow-[0_16px_28px_rgba(3,0,9,0.22)] hover:bg-primary/22"
                      : "border-primary/20 bg-black/40 text-muted-foreground hover:border-primary/45 hover:text-primary"
                  }`}
                  aria-expanded={isFilterOpen}
                  aria-controls={filterPanelId}
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span className="font-medium">{t("gallery.filter.button")}</span>
                </button>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-foreground/55">
                  {lang === "en" ? "Active filters" : "已启用筛选"}
                </span>
                {searchQuery.trim() && (
                  <span className="glass-subtle border border-primary/35 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-primary">
                    {lang === "en" ? "Search" : "搜索"}: {searchQuery.trim()}
                  </span>
                )}
                {selectedSpirit && (
                  <span className="glass-subtle border border-secondary/35 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-secondary">
                    {t(`gallery.spirit.${selectedSpirit.toLowerCase()}`)}
                  </span>
                )}
                {selectedAlcohol && (
                  <span className="glass-subtle border border-accent/40 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-accent">
                    {t(`gallery.level.${selectedAlcohol.toLowerCase()}`)}
                  </span>
                )}
                {selectedFlavor && (
                  <span className="glass-subtle border border-primary/35 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-primary">
                    {t(`gallery.flavor.${selectedFlavor.toLowerCase()}`)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSpirit(null);
                    setSelectedFlavor(null);
                    setSelectedAlcohol(null);
                  }}
                  className="focus-ring ml-auto inline-flex min-h-10 items-center justify-center border border-white/10 px-3 py-2 text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
                >
                  {lang === "en" ? "Clear all" : "清空全部"}
                </button>
              </div>
            )}

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
                        className={`min-h-11 px-4 py-2.5 rounded-none text-xs transition-all duration-300 border-2 backdrop-blur-md active:scale-95 font-mono uppercase tracking-widest focus-ring ${
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
                        className={`min-h-11 px-4 py-2.5 rounded-none text-xs transition-all duration-300 border-2 backdrop-blur-md active:scale-95 font-mono uppercase tracking-widest focus-ring ${
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
                        className={`min-h-11 px-4 py-2.5 rounded-none text-xs transition-all duration-300 border-2 backdrop-blur-md active:scale-95 font-mono uppercase tracking-widest focus-ring ${
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
          <div className="glass-panel mx-auto max-w-2xl border border-primary/30 p-10 text-center shadow-[0_24px_46px_rgba(3,0,9,0.28)]">
            <h2 className="mb-4 text-2xl font-heading font-bold uppercase tracking-[0.16em] text-primary">
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
                    <div className="glass-panel relative h-full overflow-hidden border border-primary/35 shadow-[0_20px_42px_rgba(3,0,9,0.28),0_0_14px_rgba(255,79,216,0.1)] transition-all duration-500 group-hover:-translate-y-2.5 group-hover:scale-[1.02] group-hover:border-secondary group-hover:shadow-[0_26px_52px_rgba(3,0,9,0.32),0_0_18px_rgba(93,246,255,0.14)] will-change-transform">
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
                        <div className="space-y-4 p-5">
                          <div>
                          <h2 className="text-xl font-heading font-bold uppercase tracking-[0.16em] text-primary transition-colors group-hover:text-secondary">
                            {lang === "en" ? cocktail.english_name || cocktail.name : cocktail.name}
                          </h2>
                          {lang === "cn" && cocktail.english_name && (
                            <p className="text-xs font-mono uppercase tracking-[0.2em] text-secondary/88">
                              {cocktail.english_name}
                            </p>
                          )}
                        </div>
                        <p className="line-clamp-3 font-mono text-sm leading-relaxed text-foreground/82">
                          {lang === "en"
                            ? cocktail.english_description || cocktail.description
                            : cocktail.description}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs font-mono uppercase tracking-[0.16em]">
                          <span className="glass-subtle border border-primary/35 px-3 py-1 text-primary">
                            {lang === "en"
                              ? cocktail.english_base_spirit || cocktail.base_spirit
                              : cocktail.base_spirit}
                          </span>
                          <span className="glass-subtle border border-secondary/35 px-3 py-1 text-secondary">
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
                  className="focus-ring inline-flex min-h-11 items-center justify-center border border-primary/35 px-6 py-3 font-mono uppercase tracking-[0.16em] text-primary transition-all duration-300 hover:border-primary/70 hover:bg-primary hover:text-black"
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
