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

/** Stage pictures for "from mood to glass": what goes in, what shakes it, what comes out. */
const STAGES = [
  { image: "/stages/ingredients.webp", field: MOOD_COLORS.spark, height: "h-[30vh]", span: "lg:col-span-3" },
  { image: "/stages/shaker.webp", field: MOOD_COLORS.blue, height: "h-[44vh]", span: "lg:col-span-4" },
  { image: null, field: MOOD_COLORS.romantic, height: "h-[60vh]", span: "lg:col-span-5" },
] as const;

/** Masonry tiles vary their proportion so the sheet does not read as a grid. */
const TILE_SHAPES = ["aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-[4/5]", "aspect-[5/6]", "aspect-square"];

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = getDictionary(locale);

  const drinks = await orEmpty(
    listPublishedDrinks({ limit: 24 }).then((page) => page.drinks.map((row) => summarize(row, locale))),
    "home",
  );
  const pictured = drinks.filter((drink) => drink.imageUrl);
  const plinth: PlinthDrink[] = pictured.map((drink) => ({
    slug: drink.slug,
    name: drink.name,
    imageUrl: drink.imageUrl!,
    mood: drink.mood,
  }));
  const pick = (index: number) => pictured[index % Math.max(pictured.length, 1)];
  const [s0, s1, s2] = [pick(0), pick(3), pick(6)];
  const finale = pick(4);

  return (
    <>
      <section className="frame pt-2 pb-8" aria-labelledby="home-title">
        <h1 id="home-title" className="enter text-display leading-[0.88] tracking-[-0.055em]">
          MoodShaker
        </h1>
        <div className="mt-8 lg:mt-10">
          {plinth.length > 0 ? (
            <MoodPlinth locale={locale} drinks={plinth} dict={{ home: dict.home, options: dict.options }} />
          ) : (
            <>
              <p className="max-w-[30ch] text-lead">{dict.home.lede}</p>
              <Link href={localizePath("/questions", locale)} className="btn btn-primary mt-8">
                {dict.home.cta} <span aria-hidden>→</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {s0 && (
        <section className="frame py-[clamp(96px,18vh,220px)]" aria-label={dict.home.stepsTitle}>
          <p className="reveal mx-auto max-w-[34ch] text-[clamp(1.5rem,1rem+2vw,2.25rem)] leading-[1.3] font-medium tracking-[-0.025em] lg:text-center">
            {dict.home.statement[0]} <Thumb drink={s0} />
            {dict.home.statement[1]} <Thumb drink={s1} />
            {dict.home.statement[2]} <Thumb drink={s2} />
            {dict.home.statement[3]}
          </p>
        </section>
      )}

      <section className="frame" aria-labelledby="steps-title">
        <div className="grid gap-x-2.5 gap-y-12 lg:grid-cols-12">
          <h2 id="steps-title" className="reveal text-head lg:col-span-7 lg:row-start-1">
            {dict.home.stepsTitle}
          </h2>
          {STAGES.map((stage, index) => {
            const step = dict.home.steps[index];
            const image = stage.image ?? s2?.imageUrl ?? null;
            return (
              <div
                key={step.title}
                className={`${stage.span} lg:self-end ${index < 2 ? "lg:row-start-2" : "lg:col-start-8 lg:row-span-2 lg:row-start-1"}`}
                style={{ ["--i" as string]: index }}
              >
                <div
                  className={`reveal-picture relative w-full max-lg:aspect-[4/3] ${stage.height} max-lg:h-auto`}
                  style={{ backgroundColor: stage.field }}
                >
                  {image && (
                    <div className="absolute inset-[10%]">
                      <Image src={image} alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="specimen" />
                    </div>
                  )}
                </div>
                <h3 className="reveal mt-5 text-lead">{step.title}</h3>
                <p className="reveal mt-2 max-w-[34ch]">{step.body}</p>
              </div>
            );
          })}
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
              <Link href={localizePath("/gallery", locale)} className="link mt-5 inline-block">
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
                    className={`reveal-picture ${TILE_SHAPES[index % TILE_SHAPES.length]} transition-transform duration-500 ease-out group-hover:scale-[0.98]`}
                  />
                  <p className="mt-2 text-small">
                    {drink.name}, {dict.vocab.spirits[drink.baseSpirit]}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {finale && (
        <section
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

/** A small picture set into the line of the statement, the size of a capital letter. */
function Thumb({ drink }: { drink: { imageUrl: string | null; mood: keyof typeof MOOD_COLORS | null } | undefined }) {
  if (!drink?.imageUrl) return null;
  return (
    <span
      aria-hidden
      className="relative mx-[0.1em] inline-block h-[1.05em] w-[1.5em] overflow-hidden align-[-0.18em]"
      style={{ backgroundColor: MOOD_COLORS[drink.mood ?? "reflect"] }}
    >
      <Image src={drink.imageUrl} alt="" fill sizes="96px" className="specimen scale-[1.5] object-cover" />
    </span>
  );
}
