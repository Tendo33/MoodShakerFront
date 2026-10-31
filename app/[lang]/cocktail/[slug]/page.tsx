import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { DrinkSheet } from "@/components/DrinkSheet";
import { Specimen } from "@/components/Specimen";
import { getPublishedDrink, listPublishedDrinks } from "@/lib/db/drinks";
import { orEmpty, summarize } from "@/lib/summaries";
import { format, getDictionary } from "@/lib/dictionaries";
import { localize } from "@/lib/domain/recipe";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { pageMetadata, recipeJsonLd, serializeJsonLd } from "@/lib/seo";

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

  // Same mood first, then anything else, so the closing row is always full.
  const pool = await orEmpty(
    listPublishedDrinks({ limit: 24 }).then((page) =>
      page.drinks.filter((other) => other.id !== row.id).map((other) => summarize(other, locale)),
    ),
    "cocktail",
  );
  const others = [...pool.filter((other) => other.mood === mood), ...pool.filter((other) => other.mood !== mood)].slice(0, 4);

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
        actions={
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link href={`${localizePath("/questions", locale)}${mood ? `?mood=${mood}` : ""}`} className="btn btn-primary">
              {dict.detail.shakeYours} <span aria-hidden>→</span>
            </Link>
            {mood && <p>{format(dict.detail.pouredFor, { mood: dict.options.moods[mood].label })}</p>}
          </div>
        }
        more={
          <section className="frame mt-[clamp(120px,18vh,220px)]" aria-labelledby="more-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 id="more-heading" className="reveal text-head">
                {mood ? format(dict.detail.moreForMood, { mood: dict.options.moods[mood].label }) : dict.detail.more}
              </h2>
              <Link href={localizePath("/gallery", locale)} className="link text-lead">
                {dict.detail.back} →
              </Link>
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {others.map((other, index) => (
                <li key={other.slug} className="reveal" style={{ ["--i" as string]: index }}>
                  <Link href={localizePath(`/cocktail/${other.slug}`, locale)} className="group block">
                    <Specimen
                      src={other.thumbnailUrl}
                      alt={other.name}
                      mood={other.mood}
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="aspect-[4/5] transition-transform duration-500 ease-out group-hover:scale-[0.985]"
                    />
                    <p className="mt-3 font-medium">{other.name}</p>
                    <p className="text-small text-muted">{dict.vocab.spirits[other.baseSpirit]}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        }
      />
    </>
  );
}
