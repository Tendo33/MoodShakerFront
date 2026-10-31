"use client";

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
        <h2 id="yours-heading" className="text-head">
          {title}
        </h2>
        <p className="text-muted">{hint}</p>
      </div>
      <ul className="mt-8 flex flex-wrap gap-2">
        {drinks.slice(0, 8).map((drink) => (
          <li key={drink.id}>
            <Link
              href={localizePath(`/drink/${drink.id}`, locale)}
              className="block bg-surface px-5 py-3 text-lead transition-colors duration-200 hover:bg-ink hover:text-bone"
            >
              {drink.name[locale]}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
