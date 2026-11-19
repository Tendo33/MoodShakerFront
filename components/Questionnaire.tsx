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
type Direction = "forward" | "back";
/** How long a step takes to leave. Matches `.step` in globals.css. */
const LEAVE_MS = 170;
/** The finished wait is shown for a moment before the drink's page opens. */
const POURED_MS = 650;
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
 * handed over in the URL skips the first question and replaces a draft begun
 * for another mood; a draft already continuing from that mood is kept, so a
 * refresh part-way does not lose the answers.
 */
export function Questionnaire(props: Props) {
  const raw = useSyncExternalStore(noSubscription, readDraft, () => null);
  const [initial] = useState(() => parseDraft(raw));
  const { initialMood } = props;
  const saved = useMemo(() => {
    const draft = initial ?? parseDraft(raw);
    if (!initialMood) return draft;
    return draft?.draft.mood === initialMood ? { ...draft, step: Math.max(draft.step, 1) } : null;
  }, [initial, raw, initialMood]);
  const handed = useMemo(
    () => (initialMood ? { step: 1, draft: { ...EMPTY_DRAFT, mood: initialMood } } : null),
    [initialMood],
  );
  return <QuestionnaireForm key={saved ? "restored" : "fresh"} initial={saved ?? handed} {...props} />;
}

function QuestionnaireForm({ locale, dict, moodImages, initial }: Props & { initial: SavedDraft | null }) {
  const router = useRouter();
  const t = dict.questions;
  const [step, setStep] = useState(initial?.step ?? 0);
  const [draft, setDraft] = useState<Draft>(initial?.draft ?? EMPTY_DRAFT);
  const [pouring, setPouring] = useState(false);
  const [poured, setPoured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Which way the guest is moving through the questions; the step leaves and arrives that way.
  const [direction, setDirection] = useState<Direction | null>(null);
  const [leaving, setLeaving] = useState<Direction | null>(null);
  const turning = useRef<number | null>(null);
  useEffect(() => () => window.clearTimeout(turning.current ?? undefined), []);

  // On a new question, move focus to its heading so keyboard and screen-reader
  // users start there instead of back at the top of the page. Not on first load.
  const firstStep = useRef(step);
  useEffect(() => {
    if (step === firstStep.current) return;
    firstStep.current = -1;
    document.getElementById("question-title")?.focus({ preventScroll: false });
  }, [step]);

  // Saved on change only: writing on mount would replace the stored draft with
  // an empty one before the refreshed page has had the chance to restore it.
  const persisted = useRef({ step, draft });
  useEffect(() => {
    if (persisted.current.step === step && persisted.current.draft === draft) return;
    persisted.current = { step, draft };
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ step, draft }));
    } catch {
      // Not being able to resume after a refresh is acceptable.
    }
  }, [step, draft]);

  // The form and the waiting screen swap in place, so the page is brought back
  // to the top for the wait, and a refused order is brought into view.
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (pouring) window.scrollTo({ top: 0 });
  }, [pouring]);
  useEffect(() => {
    if (!error) return;
    // Focus as well: the button that was pressed is gone, and keyboard users would restart at the top.
    errorRef.current?.focus({ preventScroll: true });
    errorRef.current?.scrollIntoView({ block: "center" });
  }, [error]);

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

  // The current step fades out the way it is leaving, then the next one is mounted.
  // One turn at a time: a second request while the page is turning is dropped.
  function go(next: number) {
    if (next === step || turning.current !== null) return;
    const way: Direction = next > step ? "forward" : "back";
    setLeaving(way);
    turning.current = window.setTimeout(() => {
      turning.current = null;
      setDirection(way);
      setLeaving(null);
      setStep(next);
    }, LEAVE_MS);
  }

  // Pointer users move on as soon as they pick, after a beat in which the choice
  // is seen to take; keyboard users (event.detail === 0, including arrow keys
  // inside a radio group) stay put and press Next. A label click arrives twice
  // (label, then input), so the target step is fixed rather than incremented.
  function advanceOnPointer(event: React.MouseEvent) {
    const next = Math.min(step + 1, STEPS.length - 1);
    if (event.detail > 0) window.setTimeout(() => go(next), 200);
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
    saveDrink({
      id: drink.id,
      editToken,
      name: drink.recipe.name,
      createdAt: new Date().toISOString(),
      mood: drink.mood,
    });
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // The drink is poured either way; a stale draft only pre-fills the next order.
    }
    setPoured(true);
    window.setTimeout(() => router.push(localizePath(`/drink/${drink.id}`, locale)), POURED_MS);
  }

  // Once a mood is chosen the whole page takes its colour.
  const field = draft.mood ? MOOD_COLORS[draft.mood] : undefined;

  return (
    <div data-bleed-end className="transition-colors duration-700 ease-out" style={{ backgroundColor: field }}>
      {pouring && draft.mood ? (
        <Shaking dict={t.shaking} done={poured} />
      ) : (
        // A full screen for every question, with the bar and the controls at its foot:
        // they hold their place while the questions above them change length.
        <div className="frame flex min-h-[calc(100svh-5rem)] flex-col pt-8 pb-10">
          <form
            key={current}
            id="questionnaire"
            className="step mt-4 lg:mt-8"
            data-dir={direction ?? undefined}
            data-leaving={leaving ?? undefined}
            onSubmit={(event) => {
              event.preventDefault();
              if (!canContinue) return;
              if (current === "style") void submit();
              else go(step + 1);
            }}
          >
            {current === "mood" && (
              <Question title={t.mood.title} hint={t.mood.hint}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
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
                        className="relative block aspect-[5/4] overflow-hidden lg:aspect-[3/4] transition-transform duration-300 ease-out group-hover:scale-[0.98] group-has-checked:scale-[0.96]"
                        style={{ backgroundColor: MOOD_COLORS[mood] }}
                      >
                        {moodImages[mood]?.[0] && (
                          <span className="absolute inset-[10%]">
                            <Image src={moodImages[mood][0]} alt="" fill sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw" className="specimen" />
                          </span>
                        )}
                      </span>
                      <span className="mt-3 flex items-baseline justify-between gap-3">
                        <span className="text-lead font-medium">{dict.options.moods[mood].label}</span>
                        <span aria-hidden className="size-3 shrink-0 bg-ink opacity-0 transition-opacity duration-200 group-has-checked:opacity-100" />
                      </span>
                      <span className="block text-small text-ink/70">{dict.options.moods[mood].note}</span>
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
                    <span className="num text-small text-ink/70">
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
                    className="mt-4 w-full resize-y bg-bone/70 px-5 py-4 text-lead transition-colors duration-200 placeholder:text-ink/70 focus:bg-bone focus:outline-3 focus:outline-ink"
                  />
                </div>
              </Question>
            )}

            {error && (
              <p ref={errorRef} role="alert" tabIndex={-1} className="mt-10 bg-ink px-5 py-4 text-bone">
                {error}
              </p>
            )}

          </form>

          {/* Outside the keyed form, so the bar and the controls stay put while the question turns. */}
          <div className="mt-auto pt-10">
            <div className="grid grid-cols-4 gap-1" aria-hidden>
              {STEPS.map((name, index) => (
                <span key={name} className="h-1 overflow-hidden bg-ink/15">
                  <span
                    className="block h-full origin-left bg-ink transition-transform duration-500 ease-out"
                    style={{ transform: `scaleX(${index <= step ? 1 : 0})` }}
                  />
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                {step > 0 && (
                  <button type="button" className="link py-2 text-lead" onClick={() => go(step - 1)}>
                    ← {t.back}
                  </button>
                )}
                <p aria-live="polite" className="text-ink/70">
                  {format(t.progress, { n: step + 1, total: STEPS.length })}
                </p>
                {step > 0 && (
                  <button
                    type="button"
                    className="link py-2 text-ink/70"
                    onClick={() => {
                      setDraft(EMPTY_DRAFT);
                      go(0);
                    }}
                  >
                    {t.restart}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-3 max-sm:order-first max-sm:w-full">
                {!canContinue && (
                  <p id="next-hint" className="text-ink/70 max-sm:order-last max-sm:w-full">
                    {current === "bar" ? t.bar.choose : t.choose}
                  </p>
                )}
                <button
                  type="submit"
                  form="questionnaire"
                  className="btn btn-primary max-sm:w-full"
                  disabled={!canContinue}
                  aria-describedby={canContinue ? undefined : "next-hint"}
                >
                  {current === "style" ? t.submit : t.next} <span aria-hidden>→</span>
                </button>
              </div>
            </div>
          </div>
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
        className="title enter focus:outline-none"
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
      className="group enter flex cursor-pointer flex-col justify-between gap-6 bg-bone/70 p-5 transition-[background-color,transform] duration-200 ease-out hover:bg-bone active:scale-[0.98] has-checked:bg-ink has-checked:text-bone has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-ink"
      style={{ ["--i" as string]: index }}
    >
      <input type="radio" name={name} className="sr-only" checked={checked} onChange={onChange} />
      {children}
      <span>
        <span className="block text-lead font-medium">{label}</span>
        <span className="mt-1 block text-ink/70 group-has-checked:text-bone/70">{note}</span>
      </span>
    </label>
  );
}

/** A glass drawn as a filled column: how much of it is spirit. */
function Glass({ fill }: { fill: number }) {
  return (
    <span aria-hidden className="relative block h-28 w-16 bg-ink/10 group-has-checked:bg-bone/20">
      <span
        className="absolute inset-x-0 bottom-0 bg-accent transition-[height] duration-500 ease-out motion-safe:animate-[fill-up_800ms_var(--ease-out)_both] motion-safe:[animation-delay:260ms]"
        style={{ height: `${fill * 100}%` }}
      />
    </span>
  );
}

/** Seconds into the wait at which each line of the work begins, spread over the minute a pour takes. */
const LINE_STARTS = [0, 6, 16, 30];

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * While the bartender works: the shaker shakes, the work is ticked off line by
 * line, and a bar and a clock show the wait is alive. The bar slows as it goes
 * and only closes when the drink is really there.
 */
function Shaking({ dict, done }: { dict: Labels["questions"]["shaking"]; done: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (done) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [done]);

  const active = done ? dict.lines.length : LINE_STARTS.filter((start) => start <= elapsed).length - 1;

  return (
    <div
      className="frame grid min-h-[calc(100svh-5rem)] content-center gap-10 pt-12 pb-24 lg:grid-cols-12 lg:items-center"
      role="status"
    >
      <div className="lg:col-span-5">
        <h1 key={done ? "done" : "working"} className="enter text-head" aria-live="polite">
          {done ? dict.done : `${dict.title}…`}
        </h1>
        <ul className="mt-10 space-y-3 text-lead">
          {dict.lines.map((line, index) => {
            const state = index < active ? "done" : index === active ? "active" : "waiting";
            return (
              <li
                key={line}
                className={`flex items-center gap-4 transition-opacity duration-500 ${state === "waiting" ? "opacity-35" : ""}`}
              >
                <span
                  aria-hidden
                  className={`size-2.5 shrink-0 bg-ink transition-transform duration-500 ease-out ${
                    state === "waiting"
                      ? "scale-50"
                      : state === "active"
                        ? "motion-safe:animate-[breathe_1.6s_ease-in-out_infinite]"
                        : ""
                  }`}
                />
                <span className={state === "active" ? "font-medium" : ""}>{line}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-10 flex items-center gap-4" aria-hidden>
          <span className="h-1 flex-1 overflow-hidden bg-ink/15">
            <span
              className={`block h-full origin-left bg-ink ${
                // Reduced motion clamps every animation to an instant, which would park the bar
                // at its end and read as "nearly done"; there the track stays empty and the clock speaks.
                done ? "" : "motion-safe:animate-[pour_120s_cubic-bezier(0.25,0.6,0.5,1)_both] motion-reduce:hidden"
              }`}
            />
          </span>
          <span className="num w-10 text-right text-ink/70">{clock(elapsed)}</span>
        </div>
        <p className="mt-6 text-ink/70">{dict.note}</p>
      </div>
      <div className="relative mx-auto aspect-square w-full max-w-[560px] max-lg:max-w-[240px] lg:col-span-6 lg:col-start-7">
        {/* The animation sits on the photograph itself: a moving wrapper would be
            composited on its own, and the white backdrop would cross the field as a square. */}
        <Image
          src="/stages/shaker.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 40vw, 320px"
          className={`specimen ${done ? "" : "motion-safe:animate-[shake_3s_ease-in-out_infinite]"}`}
        />
      </div>
    </div>
  );
}
