import type { Locale } from "@/lib/i18n";
import type {
  AlcoholLevel,
  BaseSpirit,
  FlavorProfile,
  Mood,
  SkillLevel,
  Strength,
  Style,
} from "@/lib/domain/vocabulary";
import { cn } from "@/lib/dictionaries/cn";
import { en } from "@/lib/dictionaries/en";

type Option = { label: string; note: string };

/**
 * The full string table. Defined as an interface rather than inferred from one
 * locale, so both dictionaries are checked against it and neither can drift.
 */
export interface Dictionary {
  meta: Record<
    | "siteName"
    | "homeTitle"
    | "homeDescription"
    | "questionsTitle"
    | "questionsDescription"
    | "galleryTitle"
    | "galleryDescription"
    | "drinkTitle",
    string
  >;
  nav: Record<"shake" | "menu" | "switchTo" | "switchLabel" | "home", string>;
  home: {
    lede: string;
    moodPrompt: string;
    ctaForMood: string;
    pouredFor: string;
    /** Statement split where the inline pictures go. */
    statement: [string, string, string, string];
    stepsTitle: string;
    steps: { title: string; body: string }[];
    menuTitle: string;
    menuStatement: string;
    viewMenu: string;
    closeTitle: string;
    closeBody: string;
    closeFact: string;
    cta: string;
    yoursTitle: string;
    yoursHint: string;
  };
  questions: {
    progress: string;
    back: string;
    next: string;
    submit: string;
    restart: string;
    mood: { title: string; hint: string };
    strength: { title: string; hint: string };
    bar: { title: string; hint: string; spirits: string; skill: string };
    style: { title: string; hint: string; notes: string; notesPlaceholder: string; notesCount: string };
    shaking: { title: string; lines: string[]; note: string };
    errors: Record<"generic" | "rateLimited" | "unavailable", string>;
  };
  options: {
    moods: Record<Mood, Option>;
    strengths: Record<Strength, Option>;
    skills: Record<SkillLevel, Option>;
    styles: Record<Style, Option>;
  };
  vocab: {
    spirits: Record<BaseSpirit, string>;
    alcohol: Record<AlcoholLevel, string>;
    flavors: Record<FlavorProfile, string>;
  };
  recipe: Record<
    | "ingredients"
    | "method"
    | "tools"
    | "glass"
    | "time"
    | "spirit"
    | "strength"
    | "flavor"
    | "why"
    | "substitute"
    | "tip"
    | "alternative",
    string
  >;
  drink: Record<
    | "loading"
    | "missingTitle"
    | "missingBody"
    | "imagePending"
    | "imageFailed"
    | "retryImage"
    | "publish"
    | "publishing"
    | "publishedNote"
    | "viewPublic"
    | "withdraw"
    | "share"
    | "sharing"
    | "again"
    | "retry"
    | "actionFailed",
    string
  >;
  gallery: Record<"title" | "lede" | "all" | "empty" | "next" | "first", string>;
  detail: Record<"back" | "pouredFor" | "shakeYours" | "more" | "moreForMood", string>;
  footer: { disclaimer: string; credit: string };
  notFound: Record<"title" | "body" | "home", string>;
  error: Record<"title" | "body" | "retry", string>;
}

const dictionaries: Record<Locale, Dictionary> = { cn, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Replaces `{name}` placeholders. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
