"use client";

import { useCallback, useEffect, useMemo, useState, useTransition, useId } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import type { CocktailSummary } from "@/lib/cocktail-types";
import { useLanguage } from "@/context/LanguageContext";
import {
  ALCOHOL_LEVELS,
  BASE_SPIRITS,
  FLAVOR_PROFILES,
  alcoholLevelLabel,
  baseSpiritLabel,
  coerceAlcoholLevel,
  coerceBaseSpirit,
  coerceFlavorProfiles,
  flavorProfileLabel,
} from "@/lib/domain/vocabulary";
import { GradientText } from "@/components/ui/gradient-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FilterChip } from "@/components/ui/filter-chip";
import { Button } from "@/components/ui/button";
import { shouldBypassNextImageOptimization } from "@/utils/image-optimization";
import { Activity, Filter, GlassWater, Search, Sparkles, X } from "lucide-react";

interface GalleryContentProps {
  cocktails: CocktailSummary[];
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

/**
 * Filter options come from the vocabulary, not a hand-written copy.
 *
 * There used to be three local arrays holding display text — `"Gin"`, `"Sweet"`,
 * `"Low"`. Two things were wrong with them. The data layer filters on codes
 * (`gin`, `sweet`, `low`) and the page validates the query parameter against the
 * vocabulary, so every one of these values was rejected and silently dropped:
 * clicking any filter returned the unfiltered gallery. And the lists were
 * incomplete — 9 of 12 flavours and 3 of 4 strengths — so no drink that was
 * `refreshing`, `floral`, or non-alcoholic could be filtered for at all.
 */
const SPIRIT_OPTIONS = BASE_SPIRITS;
const FLAVOR_OPTIONS = FLAVOR_PROFILES;
const ALCOHOL_OPTIONS = ALCOHOL_LEVELS;

export default function GalleryContent({
  cocktails,
  nextCursor,
  lang,
  initialFilters,
}: GalleryContentProps) {
  const { t } = useLanguage();
  // Labels come from the vocabulary rather than `gallery.*.*` dictionary keys.
  // Those keys were a second copy of the same mapping and had already fallen
  // behind: no entry existed for `none`, `floral`, `refreshing`, or `other`, so
  // those options would have rendered their raw code.
  const vocabLocale = lang === "en" ? "en" : "cn";
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
        {/* animate-gentleFloat 没有对应的 @keyframes（产物里 0 次出现），这个光斑
            一直是静止的。删掉死类名而不是补一个动画：本轮方向是减少无限动画，
            补上等于新增一个。旁边那个 animate-float 是真在动的。 */}
        <div className="absolute top-[-8%] left-[-8%] h-[28%] w-[28%] rounded-full bg-primary/8 blur-[110px]" />
        <div className="absolute bottom-[-8%] right-[-8%] h-[28%] w-[28%] rounded-full bg-secondary/8 blur-[110px] animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-14 text-center md:mb-16">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <GradientText
              as="h1"
              className="mb-6 text-4xl uppercase tracking-[0.16em] md:text-6xl lg:text-7xl"
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
          <Card className="mx-auto max-w-4xl border-primary/30 p-3 shadow-[0_24px_48px_rgba(3,0,9,0.3)] backdrop-blur-3xl transition-all duration-300 hover:border-primary/50">
            <div className="flex flex-col items-center gap-3 md:flex-row">
              <div className="group relative w-full flex-1">
                <label htmlFor="gallery-search" className="sr-only">
                  {t("gallery.search.placeholder")}
                </label>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Search className="h-4 w-4 text-muted-foreground transition-colors duration-300 group-focus-within:text-secondary" />
                </div>
                <Input
                  type="text"
                  id="gallery-search"
                  className="pl-11 pr-10"
                  placeholder={t("gallery.search.placeholder")}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  autoComplete="off"
                  aria-label={t("gallery.search.placeholder")}
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1 top-1/2 inline-flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-ring"
                    aria-label={lang === "en" ? "Clear search" : "清空搜索"}
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </div>

              <div className="flex w-full gap-2 md:w-auto">
                <Button
                  type="button"
                  variant={
                    isFilterOpen || selectedSpirit || selectedFlavor || selectedAlcohol
                      ? "secondary"
                      : "outline"
                  }
                  size="md"
                  onClick={() => setIsFilterOpen((value) => !value)}
                  className="flex-1 md:flex-none"
                  aria-expanded={isFilterOpen}
                  aria-controls={filterPanelId}
                  icon={<Filter className="h-3.5 w-3.5" />}
                >
                  {t("gallery.filter.button")}
                </Button>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/55">
                  {lang === "en" ? "Active filters" : "已启用筛选"}
                </span>
                {searchQuery.trim() ? (
                  <Badge variant="primary">
                    {lang === "en" ? "Search" : "搜索"}: {searchQuery.trim()}
                  </Badge>
                ) : null}
                {selectedSpirit ? (
                  <Badge variant="secondary">
                    {baseSpiritLabel(coerceBaseSpirit(selectedSpirit), vocabLocale)}
                  </Badge>
                ) : null}
                {selectedAlcohol ? (
                  <Badge variant="accent">
                    {alcoholLevelLabel(coerceAlcoholLevel(selectedAlcohol), vocabLocale)}
                  </Badge>
                ) : null}
                {selectedFlavor ? (
                  <Badge variant="primary">
                    {flavorProfileLabel(coerceFlavorProfiles([selectedFlavor])[0], vocabLocale)}
                  </Badge>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto tracking-[0.16em]"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSpirit(null);
                    setSelectedFlavor(null);
                    setSelectedAlcohol(null);
                  }}
                >
                  {lang === "en" ? "Clear all" : "清空全部"}
                </Button>
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
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2 ml-1">
                    <GlassWater className="h-3 w-3" />
                    {t("gallery.filter.base")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SPIRIT_OPTIONS.map((spirit) => (
                      <FilterChip
                        key={spirit}
                        tone="secondary"
                        pressed={selectedSpirit === spirit}
                        onClick={() => setSelectedSpirit(selectedSpirit === spirit ? null : spirit)}
                      >
                        {baseSpiritLabel(spirit, vocabLocale)}
                      </FilterChip>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2 ml-1">
                    <Activity className="h-3 w-3" />
                    {t("gallery.filter.alcohol_level")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ALCOHOL_OPTIONS.map((level) => (
                      <FilterChip
                        key={level}
                        tone="accent"
                        pressed={selectedAlcohol === level}
                        onClick={() => setSelectedAlcohol(selectedAlcohol === level ? null : level)}
                      >
                        {alcoholLevelLabel(level, vocabLocale)}
                      </FilterChip>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2 ml-1">
                    <Sparkles className="h-3 w-3" />
                    {t("gallery.filter.flavor")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FLAVOR_OPTIONS.map((flavor) => (
                      <FilterChip
                        key={flavor}
                        tone="primary"
                        pressed={selectedFlavor === flavor}
                        onClick={() => setSelectedFlavor(selectedFlavor === flavor ? null : flavor)}
                      >
                        {flavorProfileLabel(flavor, vocabLocale)}
                      </FilterChip>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {isPending ? (
              <p className="px-3 pt-2 text-xs text-muted-foreground">
                {t("common.loading")}
              </p>
            ) : null}
          </Card>
        </motion.div>

        {renderableCocktails.length === 0 ? (
          <Card className="mx-auto max-w-2xl border-primary/30 p-10 text-center shadow-[0_24px_46px_rgba(3,0,9,0.28)]">
            <CardTitle className="mb-4 text-2xl">
              {t("gallery.noResults.title")}
            </CardTitle>
            <p className="font-mono text-foreground/80">{t("gallery.noResults.desc")}</p>
          </Card>
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
                    href={`/${lang}/cocktail/${cocktail.slug}`}
                    className="block group relative h-full focus-ring"
                  >
                    <Card className="h-full shadow-[0_20px_42px_rgba(3,0,9,0.28)] transition-all duration-500 will-change-transform group-hover:-translate-y-2.5 group-hover:scale-[1.02] group-hover:border-secondary group-hover:shadow-[0_26px_52px_rgba(3,0,9,0.32),0_0_18px_rgba(93,246,255,0.14)]">
                      <div className="relative aspect-[4/5] overflow-hidden bg-black/60">
                        <SafeImage
                          src={cocktail.thumbnailUrl}
                          fallbackSrc={`/placeholder.svg?height=640&width=512&query=${encodeURIComponent(cocktail.name)}`}
                          alt={cocktail.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                          className="object-cover opacity-92 transition-transform duration-500 group-hover:scale-[1.03]"
                          unoptimized={shouldBypassNextImageOptimization(cocktail.thumbnailUrl)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                      </div>
                      <CardContent className="flex flex-col gap-4 p-5">
                        <CardHeader className="gap-1">
                          <CardTitle className="transition-colors group-hover:text-secondary">
                            {cocktail.name}
                          </CardTitle>
                          {lang === "cn" && cocktail.name ? (
                            <p className="text-xs font-mono uppercase tracking-[0.2em] text-secondary/88">
                              {cocktail.name}
                            </p>
                          ) : null}
                        </CardHeader>
                        <p className="line-clamp-3 font-mono text-sm leading-relaxed text-foreground/82">
                          {cocktail.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="primary">{cocktail.baseSpiritLabel}</Badge>
                          <Badge variant="secondary">{cocktail.alcoholLevelLabel}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {nextCursor && (
              <div className="mt-12 flex justify-center">
                <Button
                  href={`${pathname}?${createQueryString({ cursor: nextCursor })}`}
                  variant="outline"
                  size="lg"
                >
                  {lang === "en" ? "Next Page" : "下一页"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
