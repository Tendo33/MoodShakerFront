"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { format, type Dictionary } from "@/lib/dictionaries";
import { MOODS, type Mood } from "@/lib/domain/vocabulary";
import { localizePath, type Locale } from "@/lib/i18n";
import { MOOD_COLORS, moodForHour } from "@/lib/moods";

export interface PlinthDrink {
  slug: string;
  name: string;
  imageUrl: string;
  mood: Mood | null;
}

const HOLD_MS = 5500;
const noSubscription = () => () => {};

/**
 * The live part of the home page: pick tonight's mood and the plinth takes its
 * colour and shows drinks poured for it, one after another. The button carries
 * the mood into the questionnaire. Before a pick, the mood follows the
 * visitor's clock, so the page is different at breakfast and at midnight.
 */
export function MoodPlinth({
  locale,
  drinks,
  dict,
}: {
  locale: Locale;
  drinks: PlinthDrink[];
  dict: Pick<Dictionary, "home" | "options">;
}) {
  // Desktop: description, picker and action on the left, the plinth on the right.
  // Phone: description, then the drink, then the picker, so a drink is on the first screen.
  const hourMood = useSyncExternalStore(
    noSubscription,
    () => moodForHour(new Date().getHours()),
    () => "unwind" as Mood,
  );
  const [picked, setPicked] = useState<Mood | null>(null);
  const mood = picked ?? hourMood;

  const forMood = drinks.filter((drink) => drink.mood === mood);
  const shown = forMood.length > 0 ? forMood : drinks;
  const [tick, setTick] = useState(0);
  const active = shown.length > 0 ? shown[tick % shown.length] : null;

  useEffect(() => {
    if (shown.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setTick((value) => value + 1);
    }, HOLD_MS);
    return () => window.clearInterval(timer);
  }, [shown.length, mood]);

  const moodLabel = dict.options.moods[mood].label;

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-12">
      <p className="enter max-w-[30ch] text-[clamp(1.375rem,1rem+1.2vw,2.125rem)] leading-[1.3] tracking-[-0.015em] [--i:1] lg:col-span-5">
        {dict.home.lede}
      </p>
      <div className="order-3 lg:order-none lg:col-span-5 lg:row-start-2 lg:self-end">
        <fieldset className="enter [--i:2]">
          <legend className="text-lead font-medium">{dict.home.moodPrompt}</legend>
          <div className="mt-5 flex flex-wrap gap-2">
            {MOODS.map((code) => {
              const selected = code === mood;
              return (
                <button
                  key={code}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setPicked(code);
                    setTick(0);
                  }}
                  className="flex min-h-12 items-center gap-3 bg-surface px-4 transition-[background-color,transform] duration-300 ease-out hover:-translate-y-0.5 active:scale-[0.97] aria-pressed:text-ink"
                  style={selected ? { backgroundColor: MOOD_COLORS[code] } : undefined}
                >
                  <span aria-hidden className="size-3.5" style={{ backgroundColor: MOOD_COLORS[code] }} />
                  {dict.options.moods[code].label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <Link
          href={`${localizePath("/questions", locale)}?mood=${mood}`}
          className="btn btn-primary enter mt-10 [--i:3]"
        >
          {format(dict.home.ctaForMood, { mood: moodLabel })} <span aria-hidden>→</span>
        </Link>
      </div>

      <figure className="enter order-2 lg:order-none lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 [--i:1]">
        <div
          className="relative aspect-square w-full overflow-hidden transition-colors duration-700 ease-out lg:aspect-[4/3]"
          style={{ backgroundColor: MOOD_COLORS[mood] }}
        >
          {shown.map((drink, index) => (
            <Link
              key={drink.slug}
              href={localizePath(`/cocktail/${drink.slug}`, locale)}
              tabIndex={drink === active ? 0 : -1}
              aria-hidden={drink !== active}
              className="absolute inset-[8%] transition-opacity duration-[1600ms] ease-in-out"
              style={{ opacity: drink === active ? 1 : 0, pointerEvents: drink === active ? "auto" : "none" }}
            >
              <Image
                src={drink.imageUrl}
                alt={drink.name}
                fill
                priority={index === 0}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="specimen motion-safe:animate-[drift_11s_ease-in-out_infinite_alternate]"
              />
            </Link>
          ))}
        </div>
        {active && (
          <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1" aria-live="polite">
            <span className="text-lead font-medium">{active.name}</span>
            <span className="text-muted">
              {format(dict.home.pouredFor, { mood: dict.options.moods[active.mood ?? mood].label })}
            </span>
          </figcaption>
        )}
      </figure>
    </div>
  );
}
