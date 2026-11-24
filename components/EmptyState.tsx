import * as motion from "motion/react-client";
import { enter, reveal } from "@/lib/motion";
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
          <motion.h1 {...enter(0)} className="title title-measure">{title}</motion.h1>
          {body && <motion.p {...enter(1)} className="mt-6 max-w-[40ch] text-lead">{body}</motion.p>}
          <motion.div {...enter(2)} className="mt-10 flex flex-wrap gap-2">{children}</motion.div>
        </div>
        <motion.div {...enter(1)}
          className="relative aspect-square lg:col-span-6 lg:aspect-[5/4]"
          style={{ backgroundColor: MOOD_COLORS.blue }}
        >
          <div className="absolute inset-[4%]">
            <Image src="/stages/shaker.webp" alt="" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="specimen" />
          </div>
        </motion.div>
      </div>
      {suggestions.length > 0 && (
        <section className="mt-[clamp(96px,14vh,180px)]" aria-labelledby="suggestions-heading">
          <motion.h2 {...reveal(0)} id="suggestions-heading" className="text-head">
            {suggestionsTitle}
          </motion.h2>
          <ul className="mt-10 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {suggestions.map((drink, index) => (
              <motion.li {...reveal(index)} key={drink.href}>
                <Link href={drink.href} className="group block">
                  <Specimen
                    src={drink.imageUrl}
                    alt={drink.name}
                    mood={drink.mood}
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="aspect-[4/5]"
                  />
                  <p className="mt-3 font-display text-lead leading-snug transition-opacity duration-200 group-hover:opacity-60">{drink.name}</p>
                </Link>
              </motion.li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
