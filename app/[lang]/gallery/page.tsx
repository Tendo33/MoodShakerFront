import Link from "next/link";
import { listPublishedDrinks } from "@/lib/db/drinks";
import { getDictionary } from "@/lib/dictionaries";
import { BASE_SPIRITS, isBaseSpirit, STOCKABLE_SPIRITS } from "@/lib/domain/vocabulary";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { summarize } from "@/lib/summaries";
import { Specimen } from "@/components/Specimen";

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

  const spirit = isBaseSpirit(query.spirit) ? query.spirit : undefined;
  const cursor = typeof query.cursor === "string" ? query.cursor : undefined;
  const page = await listPublishedDrinks({ spirit, cursor });
  const drinks = page.drinks.map((row) => summarize(row, locale));
  const features = featureSlots(drinks.length);

  const href = (params: { spirit?: string; cursor?: string }) => {
    const search = new URLSearchParams();
    if (params.spirit) search.set("spirit", params.spirit);
    if (params.cursor) search.set("cursor", params.cursor);
    const qs = search.toString();
    return localizePath("/gallery", locale) + (qs ? `?${qs}` : "");
  };

  return (
    <div className="frame">
      <header className="grid gap-6 pt-6 lg:grid-cols-12 lg:items-end">
        <h1 className="enter text-display leading-[0.88] tracking-[-0.055em] lg:col-span-7">{dict.gallery.title}</h1>
        <p className="enter max-w-[36ch] text-lead [--i:1] lg:col-span-5 lg:justify-self-end lg:pb-3">{dict.gallery.lede}</p>
      </header>

      <nav aria-label={dict.recipe.spirit} className="enter mt-12 flex flex-wrap gap-2 [--i:2]">
        {[undefined, ...FILTERS].map((code) => {
          const active = code === spirit;
          return (
            <Link
              key={code ?? "all"}
              href={href({ spirit: code })}
              aria-current={active ? "page" : undefined}
              className={`px-4 py-2.5 transition-colors duration-200 ${active ? "bg-ink text-bone" : "bg-surface hover:bg-ink hover:text-bone"}`}
            >
              {code ? dict.vocab.spirits[code] : dict.gallery.all}
            </Link>
          );
        })}
      </nav>

      {drinks.length === 0 ? (
        <p className="py-32 text-lead text-muted">{dict.gallery.empty}</p>
      ) : (
        <ul className="mt-10 grid grid-flow-dense grid-cols-2 gap-x-2 gap-y-8 lg:grid-cols-4">
          {drinks.map((drink, index) => {
            const feature = features.has(index);
            return (
              <li key={drink.slug} className={feature ? "col-span-2 row-span-2" : ""}>
                <Link href={localizePath(`/cocktail/${drink.slug}`, locale)} className="group block">
                  <Specimen
                    src={feature ? drink.imageUrl : drink.thumbnailUrl}
                    alt={drink.name}
                    mood={drink.mood}
                    sizes={feature ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                    className="reveal-picture aspect-[4/5] transition-transform duration-500 ease-out group-hover:scale-[0.985]"
                  />
                  <p className={`mt-3 font-medium ${feature ? "text-lead" : ""}`}>{drink.name}</p>
                  <p className="text-small text-muted">
                    {dict.vocab.spirits[drink.baseSpirit]} · {dict.vocab.alcohol[drink.alcoholLevel]}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {(page.nextCursor || cursor) && (
        <div className="mt-20 flex items-center justify-between">
          {cursor ? (
            <Link href={href({ spirit })} className="link">
              ← {dict.gallery.first}
            </Link>
          ) : (
            <span />
          )}
          {page.nextCursor && (
            <Link href={href({ spirit, cursor: page.nextCursor })} className="btn btn-quiet">
              {dict.gallery.next} <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Which tiles are drawn double size. A feature takes four cells, so the count
 * is chosen to make the sheet come out even in both four and two columns, with
 * the features spread through it; holes at the end read as a broken page.
 */
function featureSlots(count: number): Set<number> {
  for (let features = Math.ceil(count / 3); features > 0; features -= 1) {
    if ((count + 3 * features) % 4 === 0) {
      return new Set(Array.from({ length: features }, (_, k) => Math.round((k * count) / features)));
    }
  }
  return new Set();
}
