"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { DrinkView } from "@/lib/db/drinks";
import type { Dictionary } from "@/lib/dictionaries";
import { format } from "@/lib/dictionaries";
import { MAX_NOTES_LENGTH, type Order } from "@/lib/domain/order";
import {
  MOODS,
  SKILL_LEVELS,
  STOCKABLE_SPIRITS,
  STRENGTHS,
  STYLES,
  type Mood,
  type StockableSpirit,
} from "@/lib/domain/vocabulary";
import { callApi, saveDrink } from "@/lib/client";
import { localizePath, type Locale } from "@/lib/i18n";
import { MOOD_COLORS } from "@/lib/moods";

type Labels = Pick<Dictionary, "questions" | "options" | "vocab">;
type Draft = Partial<Omit<Order, "locale" | "spirits" | "notes">> & { spirits: StockableSpirit[]; notes: string };
/** Photographs of drinks already poured for each mood, used as the mood tiles. */
export type MoodImages = Partial<Record<Mood, string[]>>;

const DRAFT_KEY = "moodshaker:draft";
const STEPS = ["mood", "strength", "bar", "style"] as const;
const EMPTY_DRAFT: Draft = { spirits: [], notes: "" };
/** How full the drawn glass is for each strength. */
const FILL: Record<Order["strength"], number> = { none: 0, light: 0.3, medium: 0.55, strong: 0.85 };

interface SavedDraft {
  step: number;
  draft: Draft;
}

function readDraft(): string | null {
  try {
    return sessionStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

function parseDraft(raw: string | null): SavedDraft | null {
  try {
    const saved = JSON.parse(raw ?? "null");
    if (!saved?.draft) return null;
    return {
      draft: { ...EMPTY_DRAFT, ...saved.draft },
      step: Math.min(Math.max(Number(saved.step) || 0, 0), STEPS.length - 1),
    };
  } catch {
    return null;
  }
}

const noSubscription = () => () => {};

interface Props {
  locale: Locale;
  dict: Labels;
  moodImages: MoodImages;
  /** A mood chosen on the home page or a drink page, carried in as ?mood=. */
  initialMood: Mood | null;
}

/**
 * Resumes an unfinished questionnaire after a refresh. The server renders a
 * fresh form; once hydrated, a saved draft remounts it with that state. A mood
 * handed over in the URL wins over the draft and skips the first question.
 */
export function Questionnaire(props: Props) {
  const raw = useSyncExternalStore(noSubscription, readDraft, () => null);
  const [initial] = useState(() => parseDraft(raw));
  const restored = useMemo(() => {
    if (props.initialMood) return { step: 1, draft: { ...EMPTY_DRAFT, mood: props.initialMood } };
    return initial ?? parseDraft(raw);
  }, [initial, raw, props.initialMood]);
  return <QuestionnaireForm key={restored ? "restored" : "fresh"} initial={restored} {...props} />;
}

function QuestionnaireForm({ locale, dict, moodImages, initial }: Props & { initial: SavedDraft | null }) {
  const router = useRouter();
  const t = dict.questions;
  const [step, setStep] = useState(initial?.step ?? 0);
  const [draft, setDraft] = useState<Draft>(initial?.draft ?? EMPTY_DRAFT);
  const [pouring, setPouring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On a new question, move focus to its heading so keyboard and screen-reader
  // users start there instead of back at the top of the page. Not on first load.
  const firstStep = useRef(step);
  useEffect(() => {
    if (step === firstStep.current) return;
    firstStep.current = -1;
    document.getElementById("question-title")?.focus({ preventScroll: false });
  }, [step]);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ step, draft }));
    } catch {
      // Not being able to resume after a refresh is acceptable.
    }
  }, [step, draft]);

  const current = STEPS[step];
  const canContinue =
    (current === "mood" && Boolean(draft.mood)) ||
    (current === "strength" && Boolean(draft.strength)) ||
    (current === "bar" && Boolean(draft.skill)) ||
    (current === "style" && Boolean(draft.style));

  function update(patch: Partial<Draft>) {
    setDraft((previous) => ({ ...previous, ...patch }));
    setError(null);
  }

  // Pointer users move on as soon as they pick; keyboard users (event.detail === 0,
  // including arrow keys inside a radio group) stay put and press Next. A label
  // click arrives twice (label, then input), so the target step is fixed rather
  // than incremented.
  function advanceOnPointer(event: React.MouseEvent) {
    const next = Math.min(step + 1, STEPS.length - 1);
    if (event.detail > 0) window.setTimeout(() => setStep(next), 220);
  }

  async function submit() {
    if (!draft.mood || !draft.strength || !draft.skill || !draft.style) return;
    setPouring(true);
    setError(null);

    const result = await callApi<{ drink: DrinkView; editToken: string }>("/api/drinks", {
      locale,
      mood: draft.mood,
      strength: draft.strength,
      spirits: draft.spirits,
      skill: draft.skill,
      style: draft.style,
      notes: draft.notes,
    });

    if (!result.ok) {
      setPouring(false);
      setError(
        result.code === "RATE_LIMITED"
          ? t.errors.rateLimited
          : result.code === "PROVIDER_FAILED" || result.code === "SERVICE_UNAVAILABLE"
            ? t.errors.unavailable
            : t.errors.generic,
      );
      return;
    }

    const { drink, editToken } = result.data;
    saveDrink({ id: drink.id, editToken, name: drink.recipe.name, createdAt: new Date().toISOString() });
    sessionStorage.removeItem(DRAFT_KEY);
    router.push(localizePath(`/drink/${drink.id}`, locale));
  }

  // Once a mood is chosen the whole page takes its colour.
  const field = draft.mood ? MOOD_COLORS[draft.mood] : undefined;

  return (
    <div data-bleed-end className="transition-colors duration-700 ease-out" style={{ backgroundColor: field }}>
      {pouring && draft.mood ? (
        <Shaking dict={t.shaking} images={moodImages[draft.mood] ?? []} />
      ) : (
        <div className="frame pt-8 pb-24">
          <form
            key={current}
            className="mt-6 lg:mt-10"
            onSubmit={(event) => {
              event.preventDefault();
              if (!canContinue) return;
              if (current === "style") void submit();
              else setStep(step + 1);
            }}
          >
            {current === "mood" && (
              <Question title={t.mood.title} hint={t.mood.hint}>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                  {MOODS.map((mood, index) => (
                    <label
                      key={mood}
                      onClick={advanceOnPointer}
                      className="group enter block cursor-pointer has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-ink"
                      style={{ ["--i" as string]: index }}
                    >
                      <input
                        type="radio"
                        name="mood"
                        className="sr-only"
                        checked={draft.mood === mood}
                        onChange={() => update({ mood })}
                      />
                      <span
                        className="relative block aspect-[5/4] overflow-hidden transition-transform duration-500 ease-out group-hover:scale-[0.98] group-has-checked:scale-[0.96]"
                        style={{ backgroundColor: MOOD_COLORS[mood] }}
                      >
                        {moodImages[mood]?.[0] && (
                          <span className="absolute inset-[10%]">
                            <Image src={moodImages[mood][0]} alt="" fill sizes="(min-width: 1024px) 30vw, 50vw" className="specimen" />
                          </span>
                        )}
                      </span>
                      <span className="mt-3 flex items-baseline justify-between gap-3">
                        <span className="text-lead font-medium">{dict.options.moods[mood].label}</span>
                        <span aria-hidden className="size-3 shrink-0 bg-ink opacity-0 transition-opacity group-has-checked:opacity-100" />
                      </span>
                      <span className="block text-small text-muted">{dict.options.moods[mood].note}</span>
                    </label>
                  ))}
                </div>
              </Question>
            )}

            {current === "strength" && (
              <Question title={t.strength.title} hint={t.strength.hint}>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                  {STRENGTHS.map((strength, index) => (
                    <Choice
                      key={strength}
                      name="strength"
                      index={index}
                      checked={draft.strength === strength}
                      onChange={() => update({ strength })}
                      onClick={advanceOnPointer}
                      {...dict.options.strengths[strength]}
                    >
                      <Glass fill={FILL[strength]} />
                    </Choice>
                  ))}
                </div>
              </Question>
            )}

            {current === "bar" && (
              <Question title={t.bar.title} hint={t.bar.hint}>
                <fieldset>
                  <legend className="text-lead font-medium">{t.bar.spirits}</legend>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {STOCKABLE_SPIRITS.map((spirit) => (
                      <label
                        key={spirit}
                        className="cursor-pointer bg-bone/70 px-5 py-3 text-lead transition-colors duration-200 hover:bg-bone has-checked:bg-ink has-checked:text-bone has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-ink"
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={draft.spirits.includes(spirit)}
                          onChange={(event) =>
                            update({
                              spirits: event.target.checked
                                ? [...draft.spirits, spirit]
                                : draft.spirits.filter((item) => item !== spirit),
                            })
                          }
                        />
                        {dict.vocab.spirits[spirit]}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="mt-14">
                  <legend className="text-lead font-medium">{t.bar.skill}</legend>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {SKILL_LEVELS.map((skill, index) => (
                      <Choice
                        key={skill}
                        name="skill"
                        index={index}
                        checked={draft.skill === skill}
                        onChange={() => update({ skill })}
                        {...dict.options.skills[skill]}
                      />
                    ))}
                  </div>
                </fieldset>
              </Question>
            )}

            {current === "style" && (
              <Question title={t.style.title} hint={t.style.hint}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {STYLES.map((style, index) => (
                    <Choice
                      key={style}
                      name="style"
                      index={index}
                      checked={draft.style === style}
                      onChange={() => update({ style })}
                      {...dict.options.styles[style]}
                    />
                  ))}
                </div>
                <div className="mt-14">
                  <div className="flex items-baseline justify-between gap-4">
                    <label htmlFor="notes" className="text-lead font-medium">
                      {t.style.notes}
                    </label>
                    <span className="num text-small text-muted">
                      {format(t.style.notesCount, { n: draft.notes.length, max: MAX_NOTES_LENGTH })}
                    </span>
                  </div>
                  <textarea
                    id="notes"
                    rows={3}
                    maxLength={MAX_NOTES_LENGTH}
                    value={draft.notes}
                    onChange={(event) => update({ notes: event.target.value })}
                    placeholder={t.style.notesPlaceholder}
                    className="mt-4 w-full resize-y bg-bone/70 px-5 py-4 text-lead placeholder:text-muted focus:bg-bone focus:outline-3 focus:outline-ink"
                  />
                </div>
              </Question>
            )}

            {error && (
              <p role="alert" className="mt-10 bg-ink px-5 py-4 text-bone">
                {error}
              </p>
            )}

            <div className="mt-14 grid grid-cols-4 gap-1" aria-hidden>
              {STEPS.map((name, index) => (
                <span
                  key={name}
                  className={`h-1 transition-colors duration-500 ${index <= step ? "bg-ink" : "bg-ink/15"}`}
                />
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                {step > 0 && (
                  <button type="button" className="link text-lead" onClick={() => setStep(step - 1)}>
                    ← {t.back}
                  </button>
                )}
                <p aria-live="polite" className="text-muted">
                  {format(t.progress, { n: step + 1, total: STEPS.length })}
                </p>
                {step > 0 && (
                  <button
                    type="button"
                    className="link text-muted"
                    onClick={() => {
                      setDraft(EMPTY_DRAFT);
                      setStep(0);
                    }}
                  >
                    {t.restart}
                  </button>
                )}
              </div>
              <button type="submit" className="btn btn-primary max-sm:order-first max-sm:w-full" disabled={!canContinue}>
                {current === "style" ? t.submit : t.next} <span aria-hidden>→</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Question({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <>
      <h1
        id="question-title"
        tabIndex={-1}
        className="enter text-[clamp(2.5rem,1rem+5vw,6rem)] leading-[0.92] tracking-[-0.05em] focus:outline-none"
      >
        {title}
      </h1>
      <p className="enter mt-5 max-w-[40ch] text-lead [--i:1]">{hint}</p>
      <div className="mt-10">{children}</div>
    </>
  );
}

function Choice({
  name,
  index,
  label,
  note,
  checked,
  onChange,
  onClick,
  children,
}: {
  name: string;
  index: number;
  label: string;
  note: string;
  checked: boolean;
  onChange: () => void;
  onClick?: (event: React.MouseEvent) => void;
  children?: React.ReactNode;
}) {
  return (
    <label
      onClick={onClick}
      className="group enter flex cursor-pointer flex-col justify-between gap-6 bg-bone/70 p-5 transition-[background-color,transform] duration-300 ease-out hover:bg-bone active:scale-[0.98] has-checked:bg-ink has-checked:text-bone has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-ink"
      style={{ ["--i" as string]: index }}
    >
      <input type="radio" name={name} className="sr-only" checked={checked} onChange={onChange} />
      {children}
      <span>
        <span className="block text-lead font-medium">{label}</span>
        <span className="mt-1 block text-muted group-has-checked:text-bone/70">{note}</span>
      </span>
    </label>
  );
}

/** A glass drawn as a filled column: how much of it is spirit. */
function Glass({ fill }: { fill: number }) {
  return (
    <span aria-hidden className="relative block h-28 w-16 bg-ink/10 group-has-checked:bg-bone/20">
      <span
        className="absolute inset-x-0 bottom-0 bg-accent transition-[height] duration-500 ease-out"
        style={{ height: `${fill * 100}%` }}
      />
    </span>
  );
}

/** While the bartender works: the mood's drinks pass on the plinth and the order is read back line by line. */
function Shaking({ dict, images }: { dict: Labels["questions"]["shaking"]; images: string[] }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (images.length < 2) return;
    const timer = window.setInterval(() => setTick((value) => value + 1), 2400);
    return () => window.clearInterval(timer);
  }, [images.length]);

  return (
    <div className="frame grid gap-10 pt-12 pb-24 lg:grid-cols-12 lg:items-center" role="status" aria-live="polite">
      <div className="lg:col-span-5">
        <h1 className="text-head motion-safe:animate-pulse">{dict.title}…</h1>
        <ul className="mt-10 space-y-3 text-lead">
          {dict.lines.map((line, index) => (
            <li key={line} className="enter" style={{ animationDelay: `${index * 2.2}s` }}>
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-10 text-muted">{dict.note}</p>
      </div>
      <div className="relative aspect-square lg:col-span-6 lg:col-start-7">
        {images.map((src, index) => (
          <div
            key={src}
            className="absolute inset-[6%] transition-opacity duration-1000 ease-in-out"
            style={{ opacity: index === tick % images.length ? 1 : 0 }}
          >
            <Image src={src} alt="" fill sizes="45vw" className="specimen" />
          </div>
        ))}
      </div>
    </div>
  );
}
