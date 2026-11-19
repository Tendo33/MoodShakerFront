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
              <Link href={localizePath("/questions", locale)} className="btn btn-primary mt-8">
                {dict.home.cta} <span aria-hidden>→</span>
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="frame mt-[clamp(88px,14vh,180px)]" aria-labelledby="steps-title">
        <h2 id="steps-title" className="reveal text-head">
          {dict.home.stepsTitle}
        </h2>
        <div className="mt-12 grid gap-x-2.5 gap-y-12 lg:grid-cols-12">
          {/* Tell: the order as the guest gave it. */}
          <div className="flex flex-col lg:col-span-4">
            <div className="reveal flex flex-col bg-surface p-6 lg:min-h-[28rem] lg:p-8">
              {exampleOrder ? (
                <>
                  <p className="text-muted">{dict.home.ticket.title}</p>
                  <dl className="mt-6 space-y-3.5">
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
                      <div key={term} className="flex items-baseline justify-between gap-6">
                        <dt className="text-muted">{term}</dt>
                        <dd className="text-right text-lead font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {exampleOrder.notes && exampleOrder.locale === locale && (
                    <p className="mt-auto pt-8 font-display text-[clamp(1.25rem,1.05rem+0.6vw,1.5rem)] leading-[1.35]">
                      {locale === "cn" ? `「${exampleOrder.notes}」` : `“${exampleOrder.notes}”`}
                    </p>
                  )}
                </>
              ) : (
                <div className="relative flex-1">
                  <Image src="/stages/ingredients.webp" alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="specimen" />
                </div>
              )}
            </div>
            <h3 className="label reveal mt-5 text-lead">{dict.home.steps[0].title}</h3>
            <p className="reveal mt-2 max-w-[34ch] [--i:1]">{dict.home.steps[0].body}</p>
          </div>

          {/* Shake. */}
          <div className="flex flex-col lg:col-span-3">
            <div
              className="reveal-picture relative max-lg:aspect-[4/3] lg:h-[28rem] [--i:1]"
              style={{ backgroundColor: MOOD_COLORS.blue }}
            >
              <div className="absolute inset-[6%]">
                <Image src="/stages/shaker.webp" alt="" fill sizes="(min-width: 1024px) 25vw, 100vw" className="specimen" />
              </div>
            </div>
            <h3 className="label reveal mt-5 text-lead [--i:1]">{dict.home.steps[1].title}</h3>
            <p className="reveal mt-2 max-w-[34ch] [--i:2]">{dict.home.steps[1].body}</p>
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
                  className="reveal-picture max-lg:aspect-[4/3] lg:h-[28rem] [--i:2]"
                />
              </Link>
            ) : (
              <div className="lg:h-[28rem]" style={{ backgroundColor: MOOD_COLORS.romantic }} />
            )}
            <h3 className="label reveal mt-5 text-lead [--i:2]">{dict.home.steps[2].title}</h3>
            <p className="reveal mt-2 max-w-[34ch] [--i:3]">{dict.home.steps[2].body}</p>
            {exampleDrink && (
              <Link href={localizePath(`/cocktail/${exampleDrink.slug}`, locale)} className="link reveal mt-3 w-fit py-1 [--i:3]">
                {exampleDrink.name} · {dict.home.ticket.read} →
              </Link>
            )}
          </div>
        </div>
      </section>

      <RecentDrinks locale={locale} title={dict.home.yoursTitle} hint={dict.home.yoursHint} />

      {pictured.length > 0 && (
        <section className="mt-[clamp(120px,18vh,240px)]" aria-labelledby="menu-title">
          <div className="frame grid gap-6 lg:grid-cols-12">
            <h2 id="menu-title" className="reveal text-head lg:col-span-6">
              {dict.home.menuTitle}
            </h2>
            <div className="reveal lg:col-span-5 lg:col-start-8 [--i:1]">
              <p className="text-lead">{dict.home.menuStatement}</p>
              <Link href={localizePath("/gallery", locale)} className="link mt-3 inline-block py-2">
                {dict.home.viewMenu} →
              </Link>
            </div>
          </div>
          <ul className="frame mt-16 columns-2 gap-1 sm:columns-3 lg:columns-6">
            {pictured.slice(0, 18).map((drink, index) => (
              <li key={drink.slug} className="mb-4 break-inside-avoid">
                <Link href={localizePath(`/cocktail/${drink.slug}`, locale)} className="group block">
                  <Specimen
                    src={drink.thumbnailUrl}
                    alt={drink.name}
                    mood={drink.mood}
                    sizes="(min-width: 1024px) 17vw, (min-width: 640px) 33vw, 50vw"
                    className={`reveal-picture ${TILE_SHAPES[index % TILE_SHAPES.length]}`}
                  />
                  <p className="mt-2.5 font-display leading-snug transition-opacity duration-200 group-hover:opacity-60">{drink.name}</p>
                  <p className="text-small text-muted">{dict.vocab.spirits[drink.baseSpirit]}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {finale && (
        <section
          data-bleed-end
          className="relative mt-[clamp(120px,18vh,240px)] flex min-h-[90svh] items-center overflow-hidden"
          style={{ backgroundColor: MOOD_COLORS[finale.mood ?? "romantic"] }}
          aria-labelledby="close-title"
        >
          <div className="pointer-events-none absolute -bottom-[12%] -left-[6%] h-[115%] w-[75%] max-lg:top-auto max-lg:h-[60%] max-lg:w-[130%]">
            <Image src={finale.imageUrl!} alt="" fill sizes="75vw" className="specimen reveal-picture object-left-bottom" />
          </div>
          <div className="frame relative grid lg:grid-cols-12">
            <div className="lg:col-span-3 lg:col-start-10 max-lg:pt-16 max-lg:pb-[62%]">
              <h2 id="close-title" className="reveal text-head">
                {dict.home.closeTitle}
              </h2>
              <p className="reveal mt-5 [--i:1]">{dict.home.closeBody}</p>
              <p className="reveal mt-4 text-lead [--i:2]">{dict.home.closeFact}</p>
              <Link href={localizePath("/questions", locale)} className="btn btn-primary reveal mt-8 [--i:3] max-lg:w-full">
                {dict.home.cta} <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
