"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
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
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { FilterChip } from "@/components/ui/filter-chip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { enterDuration, enterEase } from "@/utils/animation-utils";
import { shouldBypassNextImageOptimization } from "@/utils/image-optimization";
import { cn } from "@/lib/utils";
import { Activity, GlassWater, Search, Sparkles, X } from "lucide-react";

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
  const reduceMotion = useReducedMotion() === true;
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

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSpirit(null);
    setSelectedFlavor(null);
    setSelectedAlcohol(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <div className="mx-auto max-w-7xl px-4 pt-8 md:px-8 md:pt-12">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : enterDuration, ease: enterEase }}
        >
          <h1 className="text-safe-wrap font-heading text-4xl font-bold uppercase tracking-[0.12em] text-foreground md:text-6xl">
            {t("gallery.title")}
          </h1>
          <div className="mt-5 h-px w-24 bg-primary" aria-hidden />
          <p className="mt-5 max-w-2xl font-mono text-base leading-relaxed text-foreground/72">
            {t("gallery.subtitle")}
          </p>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.22em] text-foreground/55">
            {lang === "en"
              ? `${renderableCocktails.length} cocktails in view`
              : `当前展示 ${renderableCocktails.length} 款鸡尾酒`}
          </p>
        </motion.div>
      </div>

      <div className="sticky top-20 z-30 mt-8 border-y border-white/10 bg-background/95 backdrop-blur-md md:top-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="group relative min-w-0 flex-1">
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
                  className="focus-ring absolute top-1/2 right-1 inline-flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={lang === "en" ? "Clear search" : "清空搜索"}
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </div>
            {activeFilterCount > 0 ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                {lang === "en" ? "Clear all" : "清空全部"}
              </Button>
            ) : null}
          </div>

          <div className="flex max-h-[42vh] flex-col gap-4 overflow-y-auto md:max-h-none">
          <FilterGroup icon={<GlassWater className="h-3 w-3" />} label={t("gallery.filter.base")}>
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
          </FilterGroup>

          <FilterGroup
            icon={<Activity className="h-3 w-3" />}
            label={t("gallery.filter.alcohol_level")}
          >
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
          </FilterGroup>

          <FilterGroup icon={<Sparkles className="h-3 w-3" />} label={t("gallery.filter.flavor")}>
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
          </FilterGroup>
          </div>

          {isPending ? (
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {t("common.loading")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {renderableCocktails.length === 0 ? (
          <Empty className="mx-auto max-w-2xl border-white/10 bg-black/25">
            <EmptyHeader>
              <EmptyTitle className="font-heading text-2xl uppercase tracking-[0.12em] text-foreground">
                {t("gallery.noResults.title")}
              </EmptyTitle>
              <EmptyDescription className="font-mono text-foreground/80">
                {t("gallery.noResults.desc")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
              {renderableCocktails.map((cocktail, index) => (
                <li
                  key={cocktail.id}
                  className={cn(
                    "min-w-0 bg-background",
                    index === 0 && "md:col-span-2 md:row-span-2",
                  )}
                >
                  <HoverCard openDelay={120} closeDelay={80}>
                    <HoverCardTrigger asChild>
                      <Link
                        href={`/${lang}/cocktail/${cocktail.slug}`}
                        className="focus-ring group block"
                      >
                        <AspectRatio ratio={1} className="overflow-hidden bg-black">
                          <GalleryPhoto
                            src={cocktail.thumbnailUrl}
                            unoptimized={shouldBypassNextImageOptimization(cocktail.thumbnailUrl)}
                            sizes={
                              index === 0
                                ? "(max-width: 768px) 50vw, 40vw"
                                : "(max-width: 768px) 50vw, 20vw"
                            }
                          />
                          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#080212] via-[#080212]/80 to-transparent px-3 pt-12 pb-3 md:px-4 md:pb-4">
                            <h2
                              className={cn(
                                "text-safe-wrap font-heading font-bold uppercase tracking-[0.12em] text-foreground",
                                index === 0 ? "text-xl md:text-4xl" : "text-sm md:text-base",
                              )}
                            >
                              {cocktail.name}
                            </h2>
                            <span className="mt-2 block h-px bg-primary" />
                          </span>
                        </AspectRatio>
                      </Link>
                    </HoverCardTrigger>
                    <HoverCardContent className="uppercase tracking-[0.16em]">
                      <p className="text-safe-wrap">
                        <span>{cocktail.baseSpiritLabel}</span>
                        <span className="text-foreground/40"> · </span>
                        <span className="text-accent">{cocktail.alcoholLevelLabel}</span>
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                </li>
              ))}
            </ul>

            {nextCursor ? (
              <div className="mt-12 flex justify-center">
                <Button
                  href={`${pathname}?${createQueryString({ cursor: nextCursor })}`}
                  variant="outline"
                  size="lg"
                >
                  {lang === "en" ? "Next Page" : "下一页"}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function FilterGroup({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function GalleryPhoto({
  src,
  unoptimized,
  sizes,
}: {
  src: string | null;
  unoptimized: boolean;
  sizes: string;
}) {
  const [ready, setReady] = useState(false);

  if (!src) {
    return <Skeleton className="absolute inset-0 size-full" />;
  }

  return (
    <>
      {ready ? null : <Skeleton className="absolute inset-0 z-[1] size-full" />}
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        unoptimized={unoptimized}
        className="object-cover"
        onLoadingComplete={() => setReady(true)}
        onError={() => setReady(true)}
      />
    </>
  );
}
