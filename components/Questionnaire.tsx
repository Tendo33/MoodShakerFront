"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
import { Button } from "@/components/action-button";
import { Alert, AlertDescription } from "@/components/coss/alert";
import { Fieldset, FieldsetLegend } from "@/components/coss/fieldset";
import { Textarea } from "@/components/coss/textarea";
import { Label } from "@/components/coss/label";
import { PourProgress } from "@/components/PourProgress";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/coss/progress";
import { Toggle } from "@/components/coss/toggle";
import { motion } from "motion/react";
import { MotionImage } from "@/components/MotionImage";
import { EASE_OUT, enter, stepEnter } from "@/lib/motion";

type Labels = Pick<Dictionary, "questions" | "options" | "vocab">;
type Draft = Partial<Omit<Order, "locale" | "spirits" | "notes">> & { spirits: StockableSpirit[]; notes: string };
/** Photographs of drinks already poured for each mood, used as the mood tiles. */
export type MoodImages = Partial<Record<Mood, string[]>>;

const DRAFT_KEY = "moodshaker:draft";
const STEPS = ["mood", "strength", "bar", "style"] as const;
const EMPTY_DRAFT: Draft = { spirits: [], notes: "" };
type Direction = "forward" | "back";
/** Which way the guest is moving, so every part of a question arrives from that side. */
const DirectionContext = createContext<Direction | null>(null);
/** How long a step takes to leave: the form's exit animation runs for this long. */
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
  const errorRef = useRef<HTMLDivElement>(null);
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

  // The order so far, for the questions already passed: each answer leads back to its question.
  const answers: [number, string | null][] = [
    [0, draft.mood ? dict.options.moods[draft.mood].label : null],
    [1, draft.strength ? dict.options.strengths[draft.strength].label : null],
    [
      2,
      draft.skill
        ? [...draft.spirits.map((spirit) => dict.vocab.spirits[spirit]), dict.options.skills[draft.skill].label].join(" · ")
        : null,
    ],
  ];
  const answered = answers.filter((entry): entry is [number, string] => entry[0] < step && entry[1] !== null);

  // Once a mood is chosen the whole page takes its colour.
  const field = draft.mood ? MOOD_COLORS[draft.mood] : undefined;

  return (
    <div data-bleed-end className="transition-colors duration-700 ease-out" style={{ backgroundColor: field }}>
      {pouring && draft.mood ? (
        <Shaking dict={t.shaking} done={poured} />
      ) : (
        // A full screen for every question, with the bar and the controls at its foot:
        // they hold their place while the questions above them change length.
        <div className="frame flex min-h-[calc(100svh-4.5rem)] flex-col pt-8 pb-10 sm:min-h-[calc(100svh-5rem)]">
          <DirectionContext.Provider value={direction}>
          <motion.form
            key={current}
            id="questionnaire"
            className="mt-4 lg:mt-8"
            initial={false}
            animate={leaving ? { opacity: 0, x: leaving === "forward" ? -18 : 18 } : { opacity: 1, x: 0 }}
            transition={{ duration: LEAVE_MS / 1000, ease: "easeOut" }}
            onSubmit={(event) => {
              event.preventDefault();
              if (!canContinue) return;
              if (current === "style") void submit();
              else go(step + 1);
            }}
          >
            {current === "mood" && (
              <Question title={t.mood.title} hint={t.mood.hint}>
                <div role="radiogroup" aria-labelledby="question-title" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {MOODS.map((mood, index) => (
                    <motion.label
                      key={mood}
                      {...stepEnter(direction, index)}
                      onClick={advanceOnPointer}
                      className="group block cursor-pointer has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-ink"
                    >
                      <input
                        type="radio"
                        name="mood"
                        className="sr-only"
                        checked={draft.mood === mood}
                        onChange={() => update({ mood })}
                      />
                      {/* The chosen tile is pressed in: the glass holds still, the field
                          takes an ink edge, and its name is underlined — three quiet
                          signals instead of a moving dot. */}
                      <span
                        className="relative block aspect-[5/4] overflow-hidden transition-[transform,box-shadow] duration-300 ease-out group-has-checked:scale-[0.97] group-has-checked:ring-2 group-has-checked:ring-ink group-has-checked:ring-inset lg:aspect-[3/4]"
                        style={{ backgroundColor: MOOD_COLORS[mood] }}
                      >
                        {moodImages[mood]?.[0] && (
                          <span className="absolute inset-[2%]">
                            <Image src={moodImages[mood][0]} alt="" fill sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw" className="specimen transition-transform duration-500 ease-out group-hover:scale-[1.06]" />
                          </span>
                        )}
                      </span>
                      <span className="mt-3 flex flex-col gap-0.5">
                        <span className="w-fit text-lead font-medium underline-offset-4 group-has-checked:underline group-has-checked:decoration-2">
                          {dict.options.moods[mood].label}
                        </span>
                        <span className="block text-small text-ink/70">{dict.options.moods[mood].note}</span>
                      </span>
                    </motion.label>
                  ))}
                </div>
              </Question>
            )}

            {current === "strength" && (
              <Question title={t.strength.title} hint={t.strength.hint}>
                <div role="radiogroup" aria-labelledby="question-title" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
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
                <Fieldset>
                  <FieldsetLegend className="text-lead font-medium">{t.bar.spirits}</FieldsetLegend>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {STOCKABLE_SPIRITS.map((spirit) => (
                      <Toggle
                        key={spirit}
                        pressed={draft.spirits.includes(spirit)}
                        onPressedChange={(pressed) =>
                          update({
                            spirits: pressed
                              ? [...draft.spirits, spirit]
                              : draft.spirits.filter((item) => item !== spirit),
                          })
                        }
                        className="h-auto rounded-none border border-ink/15 bg-bone/55 px-4 py-2.5 text-[0.9375rem] hover:bg-bone/85 data-pressed:border-ink data-pressed:bg-ink data-pressed:text-bone sm:text-[0.9375rem]"
                      >
                        {dict.vocab.spirits[spirit]}
                      </Toggle>
                    ))}
                  </div>
                </Fieldset>
                <Fieldset className="mt-14">
                  <FieldsetLegend className="text-lead font-medium">{t.bar.skill}</FieldsetLegend>
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
                </Fieldset>
              </Question>
            )}

            {current === "style" && (
              <Question title={t.style.title} hint={t.style.hint}>
                <div role="radiogroup" aria-labelledby="question-title" className="grid gap-2 sm:grid-cols-2">
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
                    <Label htmlFor="notes" className="text-[length:var(--text-lead)] sm:text-[length:var(--text-lead)]">
                      {t.style.notes}
                    </Label>
                    <span className="num text-small text-ink/70">
                      {format(t.style.notesCount, { n: draft.notes.length, max: MAX_NOTES_LENGTH })}
                    </span>
                  </div>
                  <Textarea
                    id="notes"
                    rows={3}
                    maxLength={MAX_NOTES_LENGTH}
                    value={draft.notes}
                    onChange={(event) => update({ notes: event.target.value })}
                    placeholder={t.style.notesPlaceholder}
                    className="mt-4 w-full resize-y"
                  />
                </div>
              </Question>
            )}

            {error && (
              <Alert ref={errorRef} tabIndex={-1} variant="error" className="mt-10 rounded-none bg-bone/80 focus:outline-none">
                <AlertDescription className="text-ink">{error}</AlertDescription>
              </Alert>
            )}

          </motion.form>
          </DirectionContext.Provider>

          {/* Outside the keyed form, so the bar and the controls stay put while the question turns. */}
          <div className="mt-auto pt-10">
            {answered.length > 0 && (
              <ul className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-2" aria-label={t.order}>
                <li className="mr-1 text-ink/70">{t.order}</li>
                {answered.map(([index, label]) => (
                  <li key={index}>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-bone/80 hover:bg-bone data-pressed:bg-bone"
                      onClick={() => go(index)}
                    >
                      {label}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {/* One rule that fills as the questions go, not four blocks: the bar is
                the counter of the whole order, and the step counter beside it says
                which question is on the desk. */}
            <Progress value={((step + 1) / STEPS.length) * 100} className="gap-0">
              <ProgressTrack className="h-[3px] rounded-none bg-ink/15">
                <ProgressIndicator className="rounded-none bg-ink transition-[width] duration-500 ease-out" />
              </ProgressTrack>
            </Progress>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                {step > 0 && (
                  <Button variant="link" onClick={() => go(step - 1)}>
                    ← {t.back}
                  </Button>
                )}
                <p aria-live="polite" className="edge text-ink/70">
                  {format(t.progress, { n: step + 1, total: STEPS.length })}
                </p>
                {step > 0 && (
                  <Button
                    variant="link"
                    className="opacity-70"
                    onClick={() => {
                      setDraft(EMPTY_DRAFT);
                      go(0);
                    }}
                  >
                    {t.restart}
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-3 max-sm:order-first max-sm:w-full">
                {!canContinue && (
                  <p id="next-hint" className="edge text-ink/70 max-sm:order-last max-sm:w-full">
                    {current === "bar" ? t.bar.choose : t.choose}
                  </p>
                )}
                <Button
                  type="submit"
                  form="questionnaire"
                  className="max-sm:w-full disabled:border-ink/10 disabled:bg-ink/[0.08] disabled:text-ink/40 disabled:opacity-100 disabled:shadow-none"
                  disabled={!canContinue}
                  aria-describedby={canContinue ? undefined : "next-hint"}
                >
                  {current === "style" ? t.submit : t.next} <span aria-hidden>→</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Question({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  const direction = useContext(DirectionContext);
  return (
    <>
      <motion.h1
        {...stepEnter(direction)}
        id="question-title"
        tabIndex={-1}
        className="title focus:outline-none"
      >
        {title}
      </motion.h1>
      <motion.p {...stepEnter(direction, 1)} className="measure question-hint mt-5 text-balance text-lead">
        {hint}
      </motion.p>
      <div className="question-options mt-10">{children}</div>
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
  const direction = useContext(DirectionContext);
  return (
    <motion.label
      {...stepEnter(direction, index)}
      onClick={onClick}
      className="group flex cursor-pointer flex-col justify-between gap-6 bg-bone/90 p-5 transition-[background-color,scale] duration-200 ease-out hover:bg-bone active:scale-[0.98] has-checked:bg-ink has-checked:text-bone has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
    >
      <input type="radio" name={name} className="sr-only" checked={checked} onChange={onChange} />
      {children}
      <span>
        <span className="block text-lead font-medium">{label}</span>
        <span className="mt-1 block text-ink/70 group-has-checked:text-bone/70">{note}</span>
      </span>
    </motion.label>
  );
}

/**
 * A tumbler drawn in SVG, filled to the strength asked for: the number is a
 * picture of the pour, not a bar chart. The liquid rises once, when the step
 * arrives, and holds still afterwards.
 */
function Glass({ fill }: { fill: number }) {
  const id = useId();
  const bottom = 108;
  const inner = 102;
  return (
    <svg viewBox="0 0 72 116" aria-hidden className="block h-28 w-[4.5rem]">
      <defs>
        <clipPath id={id}>
          <path d="M10 6 H62 L55 104 Q54.6 108 50.6 108 H21.4 Q17.4 108 17 104 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect x="0" y="0" width="72" height="116" className="fill-current opacity-[0.05]" />
        <motion.rect
          x="0"
          width="72"
          className="fill-brand"
          initial={{ y: bottom, height: 0 }}
          animate={{ y: bottom - inner * fill, height: inner * fill }}
          transition={{ duration: 0.9, delay: 0.24, ease: EASE_OUT }}
        />
        {/* One soft light down the left of the glass. */}
        <rect x="16" y="12" width="3" height="92" className="fill-bone/45" />
      </g>
      <path
        d="M10 6 H62 L55 104 Q54.6 108 50.6 108 H21.4 Q17.4 108 17 104 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
      <line x1="8" y1="6" x2="64" y2="6" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
    </svg>
  );
}

/** Seconds into the wait at which each line of the work begins, spread over the minute a pour takes. */
/** Rocks left and right, then rests. The first 70% of the loop is the shaking. */
const SHAKE_TIMES = [0, 0.07, 0.14, 0.21, 0.28, 0.35, 0.42, 0.49, 0.56, 0.63, 0.7, 1];
const SHAKER = {
  rotate: [0, -17, 17, -17, 17, -17, 17, -17, 17, -17, 0, 0],
  x: ["0%", "-4%", "4%", "-4%", "4%", "-4%", "4%", "-4%", "4%", "-4%", "0%", "0%"],
  y: ["0%", "-6%", "-4%", "-6%", "-4%", "-6%", "-4%", "-6%", "-4%", "-6%", "0%", "0%"],
};
const SHAKER_REST = { rotate: 0, x: "0%", y: "0%" };
const SHAKER_TRANSITION = { duration: 3, times: SHAKE_TIMES, ease: "easeInOut" as const, repeat: Infinity };

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
      className="frame grid min-h-[calc(100svh-4.5rem)] content-center gap-10 pt-12 pb-24 sm:min-h-[calc(100svh-5rem)] lg:grid-cols-12 lg:items-center"
      role="status"
    >
      <div className="lg:col-span-5">
        <motion.h1 key={done ? "done" : "working"} {...enter(0)} className="text-head" aria-live="polite">
          {done ? dict.done : `${dict.title}…`}
        </motion.h1>
        <ul className="mt-10 space-y-3 text-lead">
          {dict.lines.map((line, index) => {
            const state = index < active ? "done" : index === active ? "active" : "waiting";
            return (
              <li
                key={line}
                className={`flex items-center gap-4 transition-opacity duration-500 ${state === "waiting" ? "opacity-35" : ""}`}
              >
                {/* A printed checklist: a filled box for a line done, an empty
                    box for one not yet reached, the current line pulsing. */}
                <motion.span
                  aria-hidden
                  animate={state === "active" ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
                  transition={state === "active" ? { duration: 1.6, ease: "easeInOut", repeat: Infinity } : { duration: 0.5 }}
                  className={`size-2.5 shrink-0 border-[1.5px] transition-colors duration-500 ${
                    state === "waiting" ? "border-ink/35 bg-transparent" : "border-ink bg-ink"
                  }`}
                />
                <span className={state === "active" ? "font-medium" : ""}>{line}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-10 flex items-center gap-4" aria-hidden>
          <PourProgress done={done} seconds={40} className="flex-1" />
          <span className="num w-10 text-right text-ink/70">{clock(elapsed)}</span>
        </div>
        <p className="mt-6 text-ink/70">{dict.note}</p>
      </div>
      <div className="relative mx-auto aspect-square w-full max-w-[560px] max-lg:max-w-[240px] lg:col-span-6 lg:col-start-7">
        {/* The animation sits on the photograph itself: a moving wrapper would be
            composited on its own, and the white backdrop would cross the field as a square. */}
        <MotionImage
          src="/stages/shaker.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 40vw, 320px"
          className="specimen"
          animate={done ? SHAKER_REST : SHAKER}
          transition={done ? { duration: 0.4 } : SHAKER_TRANSITION}
        />
      </div>
    </div>
  );
}
