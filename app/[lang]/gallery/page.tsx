import * as motion from "motion/react-client";
import { enter, revealPicture } from "@/lib/motion";
import Link from "next/link";
import { listPublishedDrinks } from "@/lib/db/drinks";
import { getDictionary } from "@/lib/dictionaries";
import { BASE_SPIRITS, isBaseSpirit, isMood, MOODS, STOCKABLE_SPIRITS } from "@/lib/domain/vocabulary";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { summarize } from "@/lib/summaries";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/coss/card";
import { Specimen } from "@/components/Specimen";
import { Button } from "@/components/action-button";

const FILTERS = [...STOCKABLE_SPIRITS, "none"] as const satisfies readonly (typeof BASE_SPIRITS)[number][];

export async function generateMetadata({ params }: PageProps<"/[lang]/gallery">) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "cn";
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: "/gallery",
    title: dict.meta.galleryTitle,
    description: dict.meta.galleryDescription,
  });
}

export default async function GalleryPage({ params, searchParams }: PageProps<"/[lang]/gallery">) {
  const { lang } = await params;
  const query = await searchParams;
  const locale = lang as Locale;
  const dict = getDictionary(locale);

  const mood = isMood(query.mood) ? query.mood : undefined;
  const spirit = isBaseSpirit(query.spirit) ? query.spirit : undefined;
  const cursor = typeof query.cursor === "string" ? query.cursor : undefined;
  const page = await listPublishedDrinks({ mood, spirit, cursor });
  const drinks = page.drinks.map((row) => summarize(row, locale));

  const href = (params: { mood?: string; spirit?: string; cursor?: string }) => {
    const search = new URLSearchParams();
    if (params.mood) search.set("mood", params.mood);
    if (params.spirit) search.set("spirit", params.spirit);
    if (params.cursor) search.set("cursor", params.cursor);
    const qs = search.toString();
    return localizePath("/gallery", locale) + (qs ? `?${qs}` : "");
  };

  return (
    <div className="frame">
      <header className="grid gap-6 pt-6 lg:grid-cols-12 lg:items-end">
        <motion.h1 {...enter(0)} className="text-display leading-[0.95] lg:col-span-7">{dict.gallery.title}</motion.h1>
        <motion.p {...enter(1)} className="max-w-[36ch] text-lead lg:col-span-5 lg:justify-self-end lg:pb-3">{dict.gallery.lede}</motion.p>
      </header>

      <motion.nav {...enter(2)} aria-label={dict.recipe.mood} className="mt-12 flex flex-wrap gap-x-4 gap-y-1 text-lead">
        {[undefined, ...MOODS].map((code) => {
          const active = code === mood;
          return (
            <Link
              key={code ?? "all"}
              href={href({ mood: code, spirit })}
              aria-current={active ? "page" : undefined}
              className={`nav-link ${active ? "font-medium" : "text-note hover:text-ink"}`}
            >
              {code ? dict.options.moods[code].label : dict.gallery.all}
            </Link>
          );
        })}
      </motion.nav>

      <motion.nav {...enter(3)} aria-label={dict.recipe.spirit} className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-lead">
        {[undefined, ...FILTERS].map((code) => {
          const active = code === spirit;
          return (
            <Link
              key={code ?? "all"}
              href={href({ mood, spirit: code })}
              aria-current={active ? "page" : undefined}
              className={`nav-link ${active ? "font-medium" : "text-note hover:text-ink"}`}
            >
              {code ? dict.vocab.spirits[code] : dict.gallery.all}
            </Link>
          );
        })}
      </motion.nav>

      {drinks.length === 0 ? (
        <div className="py-32">
          <p className="text-lead">{dict.gallery.empty}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button render={<Link href={localizePath("/questions", locale)} />}>
              {dict.nav.shake} <span aria-hidden>→</span>
            </Button>
            {(mood || spirit) && (
              <Button variant="secondary" render={<Link href={href({})} />}>
                {dict.gallery.all}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {drinks.map((drink, index) => {
            const meta = [
              dict.vocab.spirits[drink.baseSpirit],
              dict.vocab.alcohol[drink.alcoholLevel],
              drink.mood ? dict.options.moods[drink.mood].label : null,
            ]
              .filter((part): part is string => Boolean(part))
              .join(" · ");
            return (
              <li key={drink.slug} className="min-w-0">
                <Link href={localizePath(`/cocktail/${drink.slug}`, locale)} className="group block h-full">
                  <Card className="h-full overflow-hidden shadow-none before:shadow-none">
                    <Specimen
                      src={drink.thumbnailUrl}
                      alt={drink.name}
                      mood={drink.mood}
                      sizes="(min-width: 768px) 25vw, 50vw"
                      priority={index < 4}
                      entrance={revealPicture()}
                      className="aspect-[4/5]"
                    />
                    <CardHeader className="flex flex-1 flex-col gap-2 px-4 pt-4 pb-5">
                      <CardTitle className="text-balance font-display text-lead leading-snug" render={<h2 />}>
                        {drink.name}
                      </CardTitle>
                      <CardDescription className="mt-auto text-pretty text-small text-note">{meta}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {(page.nextCursor || cursor) && (
        <div className="mt-20 flex items-center justify-between">
          {cursor ? (
            <Link href={href({ mood, spirit })} className="link py-2">
              ← {dict.gallery.first}
            </Link>
          ) : (
            <span />
          )}
          {page.nextCursor && (
            <Button variant="secondary" render={<Link href={href({ mood, spirit, cursor: page.nextCursor })} />}>
              {dict.gallery.next} <span aria-hidden>→</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
