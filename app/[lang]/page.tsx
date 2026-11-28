import * as motion from "motion/react-client";
import { reveal, revealPicture } from "@/lib/motion";
import Image from "next/image";
import Link from "next/link";
import { MoodPlinth, type PlinthDrink } from "@/components/MoodPlinth";
import { RecentDrinks } from "@/components/RecentDrinks";
import { Specimen } from "@/components/Specimen";
import { listPublishedDrinks } from "@/lib/db/drinks";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { MOOD_COLORS } from "@/lib/moods";
import { pageMetadata } from "@/lib/seo";
import { orEmpty, summarize } from "@/lib/summaries";
import { Button } from "@/components/action-button";

export async function generateMetadata({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "cn";
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: "/",
    title: dict.meta.homeTitle,
    description: dict.meta.homeDescription,
  });
}

/** Masonry tiles vary their proportion so the sheet does not read as a grid. */
const TILE_SHAPES = ["aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-[4/5]", "aspect-[5/6]", "aspect-square"];

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = getDictionary(locale);

  const rows = await orEmpty(
    listPublishedDrinks({ limit: 24 }).then((page) => page.drinks),
    "home",
  );
  const drinks = rows.map((row) => summarize(row, locale));
  // "From mood to glass" is told with one real order and the drink it became:
  // preferably one whose guest added a note, in the language being read.
  const picturedRows = rows.filter((row) => row.order && row.imageUrl && row.slug);
  const example =
    picturedRows.find((row) => row.order?.notes && row.order.locale === locale && row.order.spirits.length > 0) ??
    picturedRows.find((row) => row.order?.notes && row.order.locale === locale) ??
    picturedRows.find((row) => row.order?.locale === locale) ??
    picturedRows[0];
  const exampleOrder = example?.order ?? null;
  const exampleDrink = example ? summarize(example, locale) : null;
  const pictured = drinks.filter((drink) => drink.imageUrl);
  const plinth: PlinthDrink[] = pictured.map((drink) => ({
    slug: drink.slug,
    name: drink.name,
    imageUrl: drink.imageUrl!,
    mood: drink.mood,
  }));
  const pick = (index: number) => pictured[index % Math.max(pictured.length, 1)];
  const finale = pick(4);

  return (
    <>
      <section className="frame pt-2 pb-8" aria-labelledby="home-title">
        <div className="mt-4 lg:mt-6">
          {plinth.length > 0 ? (
            <MoodPlinth locale={locale} drinks={plinth} dict={{ home: dict.home, options: dict.options }} />
          ) : (
            <>
              <h1 id="home-title" className="title">
                {dict.home.headline[0]}
                <br />
                {dict.home.headline[1]}
              </h1>
              <p className="mt-6 max-w-[34ch] text-lead">{dict.home.lede}</p>
              <Button render={<Link href={localizePath("/questions", locale)} />} className="mt-8">
                {dict.home.cta} <span aria-hidden>→</span>
              </Button>
            </>
          )}
        </div>
      </section>

      <section className="frame mt-[clamp(88px,14vh,180px)]" aria-labelledby="steps-title">
        <motion.h2 {...reveal(0)} id="steps-title" className="text-head">
          {dict.home.stepsTitle}
        </motion.h2>
        <div className="mt-12 grid gap-x-2.5 gap-y-12 lg:grid-cols-12">
          {/* Tell: the order as the guest gave it. */}
          <div className="flex flex-col lg:col-span-4">
            <motion.div {...reveal(0)} className="flex flex-col lg:min-h-[28rem]">
              {exampleOrder ? (
                <div className="ticket flex flex-1 flex-col">
                  <div className="flex items-baseline justify-between gap-4 border-b border-ink/75 pb-2.5">
                    <span className="edge text-note">{dict.home.ticket.title}</span>
                    <span className="edge num">No. 0001</span>
                  </div>
                  <dl className="mt-5 space-y-3.5">
                    {(
                      [
                        [dict.home.ticket.mood, dict.options.moods[exampleOrder.mood].label],
                        [dict.home.ticket.strength, dict.options.strengths[exampleOrder.strength].label],
                        [
                          dict.home.ticket.spirits,
                          exampleOrder.spirits.map((spirit) => dict.vocab.spirits[spirit]).join(locale === "cn" ? "、" : ", ") ||
                            dict.home.ticket.anySpirit,
                        ],
                        [dict.home.ticket.skill, dict.options.skills[exampleOrder.skill].label],
                        [dict.home.ticket.style, dict.options.styles[exampleOrder.style].label],
                      ] as const
                    ).map(([term, value]) => (
                      <div key={term} className="flex items-baseline gap-2">
                        <dt className="edge shrink-0 text-note">{term}</dt>
                        <span className="leader" aria-hidden="true" />
                        <dd className="shrink-0 text-[0.9375rem] font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {/* The guest's own words stay on the paper, above the tear, and the
                      stamp closes the sheet at its foot: facts, then the note, then the mark. */}
                  <div className="mt-auto pt-8">
                    {exampleOrder.notes && exampleOrder.locale === locale && (
                      <p className="text-pretty font-display text-[clamp(1.25rem,1.05rem+0.6vw,1.5rem)] leading-[1.5]">
                        {locale === "cn" ? `「${exampleOrder.notes}」` : `“${exampleOrder.notes}”`}
                      </p>
                    )}
                    {exampleDrink ? (
                      <div className="mt-7 flex justify-end">
                        <span className="stamp">{locale === "cn" ? "已调好" : "POURED"}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="ticket-tear -mb-px mt-6" aria-hidden="true" />
                </div>
              ) : (
                <div className="relative flex-1">
                  <Image src="/stages/ingredients.webp" alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="specimen" />
                </div>
              )}
            </motion.div>
            <motion.h3 {...reveal(0)} className="label mt-5 flex items-baseline gap-3 text-lead">
              <span aria-hidden className="edge num text-note">01</span>
              {dict.home.steps[0].title}
            </motion.h3>
            <motion.p {...reveal(1)} className="measure mt-2">{dict.home.steps[0].body}</motion.p>
          </div>

          {/* Shake. */}
          <div className="flex flex-col lg:col-span-3">
            <motion.div {...revealPicture(1)}
              className="relative max-lg:aspect-[4/3] lg:h-[28rem]"
              style={{ backgroundColor: MOOD_COLORS.blue }}
            >
              <div className="absolute inset-[6%]">
                <Image src="/stages/shaker.webp" alt="" fill sizes="(min-width: 1024px) 25vw, 100vw" className="specimen" />
              </div>
            </motion.div>
            <motion.h3 {...reveal(1)} className="label mt-5 flex items-baseline gap-3 text-lead">
              <span aria-hidden className="edge num text-note">02</span>
              {dict.home.steps[1].title}
            </motion.h3>
            <motion.p {...reveal(2)} className="measure mt-2">{dict.home.steps[1].body}</motion.p>
          </div>

          {/* Pour: the drink that order became. */}
          <div className="flex flex-col lg:col-span-5">
            {exampleDrink ? (
              <Link href={localizePath(`/cocktail/${exampleDrink.slug}`, locale)} className="group block">
                <Specimen
                  src={exampleDrink.imageUrl}
                  alt={exampleDrink.name}
                  mood={exampleDrink.mood}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  entrance={revealPicture(2)}
                  className="max-lg:aspect-[4/3] lg:h-[28rem]"
                />
              </Link>
            ) : (
              <div className="lg:h-[28rem]" style={{ backgroundColor: MOOD_COLORS.romantic }} />
            )}
            <motion.h3 {...reveal(2)} className="label mt-5 flex items-baseline gap-3 text-lead">
              <span aria-hidden className="edge num text-note">03</span>
              {dict.home.steps[2].title}
            </motion.h3>
            <motion.p {...reveal(3)} className="measure mt-2">{dict.home.steps[2].body}</motion.p>
            {exampleDrink && (
              <motion.div {...reveal(3)} className="mt-1">
              <Link href={localizePath(`/cocktail/${exampleDrink.slug}`, locale)} className="link group/link flex min-h-11 w-fit items-center gap-1.5">
                {exampleDrink.name} · {dict.home.ticket.read}
                <span aria-hidden className="transition-transform duration-200 ease-out group-hover/link:translate-x-0.5">→</span>
              </Link>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <RecentDrinks locale={locale} title={dict.home.yoursTitle} hint={dict.home.yoursHint} />

      {pictured.length > 0 && (
        <section className="mt-[clamp(120px,18vh,240px)]" aria-labelledby="menu-title">
          <div className="frame grid gap-6 lg:grid-cols-12">
            <motion.h2 {...reveal(0)} id="menu-title" className="text-head lg:col-span-6">
              {dict.home.menuTitle}
            </motion.h2>
            <motion.div {...reveal(1)} className="lg:col-span-5 lg:col-start-8">
              <p className="measure text-lead">{dict.home.menuStatement}</p>
              <Link href={localizePath("/gallery", locale)} className="link group/link mt-3 inline-flex items-center gap-1.5 py-2">
                {dict.home.viewMenu}
                <span aria-hidden className="transition-transform duration-200 ease-out group-hover/link:translate-x-0.5">→</span>
              </Link>
            </motion.div>
          </div>
          <ul className="frame mt-14 columns-2 gap-x-3 sm:columns-3 lg:columns-6">
            {pictured.slice(0, 18).map((drink, index) => (
              <li key={drink.slug} className="mb-7 break-inside-avoid">
                <Link href={localizePath(`/cocktail/${drink.slug}`, locale)} className="group block">
                  <Specimen
                    src={drink.thumbnailUrl}
                    alt={drink.name}
                    mood={drink.mood}
                    sizes="(min-width: 1024px) 17vw, (min-width: 640px) 33vw, 50vw"
                    entrance={revealPicture()}
                    className={TILE_SHAPES[index % TILE_SHAPES.length]}
                  />
                  <p className="mt-3 w-fit text-[1.0625rem] leading-snug font-medium tracking-[-0.01em] underline-offset-4 group-hover:underline">
                    {drink.name}
                  </p>
                  <p className="mt-0.5 text-small text-note">{dict.vocab.spirits[drink.baseSpirit]}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {finale && (
        <section
          data-bleed-end
          className="relative mt-[clamp(120px,18vh,240px)] flex min-h-[86svh] items-center overflow-hidden"
          style={{ backgroundColor: MOOD_COLORS[finale.mood ?? "romantic"] }}
          aria-labelledby="close-title"
        >
          {/* The last glass is laid on the field like the rest: its own margin, its
              own colour behind it, cropped by the foot of the section. */}
          <motion.div
            {...revealPicture(0)}
            className="pointer-events-none absolute -bottom-[4%] -left-[3%] h-[88%] w-[54%] max-lg:top-auto max-lg:h-[54%] max-lg:w-[104%]"
            style={{ backgroundColor: MOOD_COLORS[finale.mood ?? "romantic"] }}
          >
            <Image src={finale.imageUrl!} alt="" fill sizes="54vw" className="specimen object-left-bottom" />
          </motion.div>
          <div className="frame relative grid lg:grid-cols-12">
            <div className="lg:col-span-4 lg:col-start-9 max-lg:pt-16 max-lg:pb-[58%]">
              <motion.h2 {...reveal(0)} id="close-title" className="text-head">
                {dict.home.closeTitle}
              </motion.h2>
              <motion.p {...reveal(1)} className="measure mt-5">{dict.home.closeBody}</motion.p>
              <motion.p {...reveal(2)} className="mt-4 text-lead">{dict.home.closeFact}</motion.p>
              <motion.div {...reveal(3)} className="mt-9">
                <Button render={<Link href={localizePath("/questions", locale)} />} className="max-lg:w-full">
                  {dict.home.cta} <span aria-hidden>→</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
