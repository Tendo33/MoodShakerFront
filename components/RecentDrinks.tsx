"use client";

import * as motion from "motion/react-client";
import { reveal } from "@/lib/motion";
import Link from "next/link";
import { useSavedDrinks } from "@/lib/client";
import { localizePath, type Locale } from "@/lib/i18n";

/** Drinks this browser poured. Private, so only this browser can list them. */
export function RecentDrinks({ locale, title, hint }: { locale: Locale; title: string; hint: string }) {
  const drinks = useSavedDrinks();
  if (!drinks || drinks.length === 0) return null;

  return (
    <section className="frame mt-[clamp(120px,18vh,240px)]" aria-labelledby="yours-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <motion.h2 {...reveal(0)} id="yours-heading" className="text-head">
          {title}
        </motion.h2>
        <motion.p {...reveal(1)} className="text-note">{hint}</motion.p>
      </div>
      <ul className="mt-8 flex flex-wrap gap-2">
        {drinks.slice(0, 8).map((drink, index) => (
          <motion.li {...reveal(index)} key={drink.id}>
            {/* A slip in the stack: the number is printed, the name is written. */}
            <Link
              href={localizePath(`/drink/${drink.id}`, locale)}
              className="group flex min-h-11 items-center gap-3 border border-ink/20 px-4 py-2 transition-[border-color,background-color] duration-200 hover:border-ink hover:bg-surface"
            >
              <span aria-hidden className="edge num text-note">{String(index + 1).padStart(2, "0")}</span>
              <span className="text-[1.0625rem] leading-snug font-medium underline-offset-4 group-hover:underline">
                {drink.name?.[locale] ?? drink.id}
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
