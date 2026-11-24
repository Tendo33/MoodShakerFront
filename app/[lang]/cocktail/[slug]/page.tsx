import * as motion from "motion/react-client";
import { reveal } from "@/lib/motion";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { DrinkSheet } from "@/components/DrinkSheet";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/coss/card";
import { Specimen } from "@/components/Specimen";
import { getPublishedDrink, listPublishedDrinks } from "@/lib/db/drinks";
import { orEmpty, summarize } from "@/lib/summaries";
import { format, getDictionary } from "@/lib/dictionaries";
import { localize } from "@/lib/domain/recipe";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { pageMetadata, recipeJsonLd, serializeJsonLd } from "@/lib/seo";
import { Button } from "@/components/action-button";

// Metadata and the page both need the row; one query per request.
const loadDrink = cache((slug: string) => getPublishedDrink(slug));

export async function generateMetadata({ params }: PageProps<"/[lang]/cocktail/[slug]">) {
  const { lang, slug } = await params;
  const locale: Locale = isLocale(lang) ? lang : "cn";
  const row = await loadDrink(slug);
  if (!row) return {};
  const recipe = localize(row.recipe, locale);
  return pageMetadata({
    locale,
    path: `/cocktail/${slug}`,
    title: `${recipe.name} · ${recipe.altName}`,
    description: recipe.description,
    image: row.imageUrl,
  });
}

export default async function CocktailPage({ params }: PageProps<"/[lang]/cocktail/[slug]">) {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const row = await loadDrink(slug);
  if (!row) notFound();

  const dict = getDictionary(locale);
  const recipe = localize(row.recipe, locale);
  const mood = row.order?.mood;

  // The closing row is always full. With enough drinks poured for the same mood it
  // shows only those and says so; otherwise it is a mixed row under a plain title,
  // never drinks from other moods under this mood's name.
  const pool = await orEmpty(
    listPublishedDrinks({ limit: 24 }).then((page) =>
      page.drinks.filter((other) => other.id !== row.id).map((other) => summarize(other, locale)),
    ),
    "cocktail",
  );
  const sameMood = pool.filter((other) => other.mood === mood);
  const onlySameMood = Boolean(mood) && sameMood.length >= 4;
  const others = (onlySameMood ? sameMood : [...sameMood, ...pool.filter((other) => other.mood !== mood)]).slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(recipeJsonLd(recipe, slug, locale, row.imageUrl)) }}
      />
      <DrinkSheet
        recipe={recipe}
        mood={mood ?? null}
        imageUrl={row.imageUrl}
        dict={dict}
        stamp={dict.detail.stamp}
        moodLabel={mood ? dict.options.moods[mood].label : null}
        ticketKey={slug}
        actions={
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <Button render={<Link href={`${localizePath("/questions", locale)}${mood ? `?mood=${mood}` : ""}`} />}>
              {dict.detail.shakeYours} <span aria-hidden>→</span>
            </Button>
            {mood && <p>{format(dict.detail.pouredFor, { mood: dict.options.moods[mood].label })}</p>}
          </div>
        }
        more={
          <section className="frame mt-[clamp(120px,18vh,220px)]" aria-labelledby="more-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <motion.h2 {...reveal(0)} id="more-heading" className="text-head">
                {mood && onlySameMood
                  ? format(dict.detail.moreForMood, { mood: dict.options.moods[mood].label })
                  : dict.detail.more}
              </motion.h2>
              <Link href={localizePath("/gallery", locale)} className="link py-2 text-lead">
                {dict.detail.back} →
              </Link>
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
              {others.map((other, index) => {
                const meta = [
                  dict.vocab.spirits[other.baseSpirit],
                  dict.vocab.alcohol[other.alcoholLevel],
                  other.mood ? dict.options.moods[other.mood].label : null,
                ]
                  .filter((part): part is string => Boolean(part))
                  .join(" · ");
                return (
                  <motion.li {...reveal(index)} key={other.slug} className="min-w-0">
                    <Link href={localizePath(`/cocktail/${other.slug}`, locale)} className="group block h-full">
                      <Card className="h-full overflow-hidden shadow-none before:shadow-none">
                        <Specimen
                          src={other.thumbnailUrl}
                          alt={other.name}
                          mood={other.mood}
                          sizes="(min-width: 1024px) 25vw, 50vw"
                          className="aspect-[4/5]"
                        />
                        <CardHeader className="flex flex-1 flex-col gap-2 px-4 pt-4 pb-5">
                          <CardTitle className="text-balance font-display text-lead leading-snug" render={<h3 />}>
                            {other.name}
                          </CardTitle>
                          <CardDescription className="mt-auto text-pretty text-small text-note">{meta}</CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </section>
        }
      />
    </>
  );
}
