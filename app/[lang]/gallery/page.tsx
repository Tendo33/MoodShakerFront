import * as motion from "motion/react-client";
import { enter, revealPicture } from "@/lib/motion";
import Image from "next/image";
import Link from "next/link";
import { listPublishedDrinks } from "@/lib/db/drinks";
import { getDictionary } from "@/lib/dictionaries";
import { BASE_SPIRITS, isBaseSpirit, isMood, MOODS, STOCKABLE_SPIRITS } from "@/lib/domain/vocabulary";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { MOOD_COLORS } from "@/lib/moods";
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
        <motion.h1 {...enter(0)} className="title lg:col-span-7">{dict.gallery.title}</motion.h1>
        <motion.p {...enter(1)} className="max-w-[36ch] text-lead lg:col-span-5 lg:justify-self-end lg:pb-3">{dict.gallery.lede}</motion.p>
      </header>

      {/* Two axes, two rows, each named: without the labels both rows open with
          "全部" and the page asks the guest to guess which is which. */}
      <motion.div {...enter(2)} className="mt-14 grid gap-y-1">
        <div className="flex items-baseline gap-x-5">
          <span aria-hidden className="edge w-10 shrink-0 text-note">{dict.recipe.mood}</span>
          <nav aria-label={dict.recipe.mood} className="flex flex-wrap gap-x-5 text-body">
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
          </nav>
        </div>
        <div className="flex items-baseline gap-x-5">
          <span aria-hidden className="edge w-10 shrink-0 text-note">{dict.recipe.spirit}</span>
          <nav aria-label={dict.recipe.spirit} className="flex flex-wrap gap-x-5 text-body">
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
          </nav>
        </div>
      </motion.div>

      {drinks.length === 0 ? (
        // A blank slip: the filter is still on the desk, so its field keeps its
        // colour and the shaker stands on it, empty. The way out is beside it.
        <div className="mt-12 grid gap-10 border-t border-ink/12 pt-12 lg:grid-cols-12 lg:items-center lg:gap-8">
          <div className="lg:col-span-6">
            <p aria-hidden className="edge num text-note">No. — — — —</p>
            <p className="measure mt-4 text-lead">{dict.gallery.empty}</p>
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
          <div
            className="relative aspect-[16/10] lg:col-span-6 lg:aspect-[5/4]"
            style={{ backgroundColor: mood ? MOOD_COLORS[mood] : undefined }}
          >
            <div className="absolute inset-[6%] opacity-60">
              <Image src="/stages/shaker.webp" alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="specimen" />
            </div>
          </div>
        </div>
      ) : (
        // No frame around the card: the specimen's own field is the boundary.
        // The name and the facts sit under it, on the paper, like a label.
        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
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
                  <Card className="h-full gap-0 overflow-visible rounded-none border-0 bg-transparent shadow-none before:hidden">
                    <Specimen
                      src={drink.thumbnailUrl}
                      alt={drink.name}
                      mood={drink.mood}
                      sizes="(min-width: 768px) 25vw, 50vw"
                      priority={index < 4}
                      entrance={revealPicture()}
                      className="aspect-[4/5]"
                    />
                    <CardHeader className="flex flex-1 flex-col gap-1 px-0 pt-4 pb-0">
                      <CardTitle className="w-fit text-balance text-[1.0625rem] leading-snug font-medium tracking-[-0.01em] underline-offset-4 group-hover:underline" render={<h2 />}>
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
