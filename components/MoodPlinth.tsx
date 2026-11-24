"use client";

import * as motion from "motion/react-client";
import { enter } from "@/lib/motion";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { format, type Dictionary } from "@/lib/dictionaries";
import { MOODS, type Mood } from "@/lib/domain/vocabulary";
import { localizePath, type Locale } from "@/lib/i18n";
import { MOOD_COLORS, moodForHour } from "@/lib/moods";
import { Button } from "@/components/action-button";
import { MotionImage } from "@/components/MotionImage";
import { Toggle } from "@/components/coss/toggle";
import { Fieldset, FieldsetLegend } from "@/components/coss/fieldset";
import { cn } from "@/lib/utils";

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
    if (
      shown.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setTick((value) => value + 1);
    }, HOLD_MS);
    return () => window.clearInterval(timer);
  }, [shown.length, mood]);

  const moodLabel = dict.options.moods[mood].label;

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-12">
      {/* One column that spans both rows and centres itself against the plinth:
          `contents` on small screens keeps the mobile order lede, drink, picker. */}
      <div className="max-lg:contents lg:col-span-5 lg:row-span-2 lg:flex lg:flex-col lg:justify-center">
        <div className="order-1">
          <motion.h1 {...enter(0)}
            id="home-title"
            className="headline"
          >
            {dict.home.headline[0]}
            <br />
            {dict.home.headline[1]}
          </motion.h1>
          <motion.p {...enter(1)} className="mt-6 max-w-[34ch] text-lead lg:mt-8">
            {dict.home.lede}
          </motion.p>
        </div>
        <div className="order-3 mt-10 lg:mt-12">
          <motion.div {...enter(2)}>
          <Fieldset>
            <FieldsetLegend className="font-medium">{dict.home.moodPrompt}</FieldsetLegend>
            {/* Each mood is its own colour, so the picker is the palette of the whole site. */}
            <div className="mt-4 grid grid-cols-3 gap-1.5">
              {MOODS.map((code) => {
                const selected = code === mood;
                return (
                  <Toggle
                    key={code}
                    pressed={selected}
                    onPressedChange={() => {
                      setPicked(code);
                      setTick(0);
                    }}
                    className={cn(
                      "flex min-h-14 items-center justify-between gap-2 rounded-none px-4 text-left font-medium whitespace-nowrap transition-[background-color,color,transform] duration-200 ease-out hover:bg-transparent hover:-translate-y-0.5 active:scale-[0.97] data-pressed:bg-transparent data-pressed:text-bone sm:text-base",
                      selected && "text-bone",
                    )}
                    style={{
                      backgroundColor: selected
                        ? "var(--color-ink)"
                        : MOOD_COLORS[code],
                    }}
                  >
                    {dict.options.moods[code].label}
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 transition-transform duration-200 ease-out"
                      style={{
                        backgroundColor: MOOD_COLORS[code],
                        transform: selected ? "scale(1)" : "scale(0)",
                      }}
                    />
                  </Toggle>
                );
              })}
            </div>
          </Fieldset>
          </motion.div>
          <motion.div {...enter(3)} className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button
              render={<Link href={`${localizePath("/questions", locale)}?mood=${mood}`} />}
            >
              {format(dict.home.ctaForMood, { mood: moodLabel })}{" "}
              <span aria-hidden>→</span>
            </Button>
            <span className="text-note">{dict.home.ctaNote}</span>
          </motion.div>
        </div>
      </div>

      <motion.figure {...enter(1)} className="order-2 lg:order-none lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:flex lg:flex-col">
        <div
          className="relative aspect-square w-full overflow-hidden transition-colors duration-700 ease-out sm:aspect-[4/3] lg:aspect-auto lg:min-h-[560px] lg:flex-1"
          style={{ backgroundColor: MOOD_COLORS[mood] }}
        >
          {shown.map((drink, index) => (
            <Link
              key={drink.slug}
              href={localizePath(`/cocktail/${drink.slug}`, locale)}
              tabIndex={drink === active ? 0 : -1}
              aria-hidden={drink !== active}
              // Blended here, where the opacity is: a fading layer is composited on its own,
              // and a photograph multiplied only inside it would cross the field as a white square.
              className="absolute inset-[2%] mix-blend-multiply transition-opacity duration-[1600ms] ease-in-out"
              style={{
                opacity: drink === active ? 1 : 0,
                pointerEvents: drink === active ? "auto" : "none",
              }}
            >
              <MotionImage
                src={drink.imageUrl}
                alt={drink.name}
                fill
                priority={index === 0}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="specimen"
                initial={{ y: "0%", scale: 1 }}
                animate={{ y: "-1.5%", scale: 1.025 }}
                transition={{ duration: 11, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
              />
            </Link>
          ))}
        </div>
        {active && (
          <figcaption
            className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1"
            aria-live="polite"
          >
            <span className="font-display text-[clamp(1.375rem,1.1rem+0.8vw,1.75rem)]">{active.name}</span>
            <span className="text-note">
              {format(dict.home.pouredFor, {
                mood: dict.options.moods[active.mood ?? mood].label,
              })}
            </span>
          </figcaption>
        )}
      </motion.figure>
    </div>
  );
}
