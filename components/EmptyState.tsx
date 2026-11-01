import Image from "next/image";
import Link from "next/link";
import { Specimen } from "@/components/Specimen";
import type { Mood } from "@/lib/domain/vocabulary";
import { MOOD_COLORS } from "@/lib/moods";

export interface Suggestion {
  href: string;
  name: string;
  imageUrl: string | null;
  mood: Mood | null;
}

/**
 * A dead end (no such drink, no such page) told beside an empty shaker, with a
 * few drinks from the menu as the way out.
 */
export function EmptyState({
  title,
  body,
  children,
  suggestionsTitle,
  suggestions = [],
}: {
  title: string;
  body?: string;
  children: React.ReactNode;
  suggestionsTitle?: string;
  suggestions?: Suggestion[];
}) {
  return (
    <div className="frame py-12 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <h1 className="enter max-w-[14ch] text-[clamp(2.5rem,1rem+5vw,6rem)] leading-[0.92] tracking-[-0.05em]">{title}</h1>
          {body && <p className="enter mt-6 max-w-[40ch] text-lead [--i:1]">{body}</p>}
          <div className="enter mt-10 flex flex-wrap gap-2 [--i:2]">{children}</div>
        </div>
        <div
          className="enter relative aspect-square lg:col-span-6 lg:aspect-[5/4] [--i:1]"
          style={{ backgroundColor: MOOD_COLORS.blue }}
        >
          <div className="absolute inset-[8%]">
            <Image src="/stages/shaker.webp" alt="" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="specimen" />
          </div>
        </div>
      </div>
      {suggestions.length > 0 && (
        <section className="mt-[clamp(96px,14vh,180px)]" aria-labelledby="suggestions-heading">
          <h2 id="suggestions-heading" className="reveal text-head">
            {suggestionsTitle}
          </h2>
          <ul className="mt-10 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {suggestions.map((drink, index) => (
              <li key={drink.href} className="reveal" style={{ ["--i" as string]: index }}>
                <Link href={drink.href} className="group block">
                  <Specimen
                    src={drink.imageUrl}
                    alt={drink.name}
                    mood={drink.mood}
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="aspect-[4/5] transition-transform duration-500 ease-out group-hover:scale-[0.985]"
                  />
                  <p className="mt-3 font-medium">{drink.name}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
