"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { DrinkSheet } from "@/components/DrinkSheet";
import { EmptyState, type Suggestion } from "@/components/EmptyState";
import { callApi, useSavedDrinks } from "@/lib/client";
import type { DrinkView } from "@/lib/db/drinks";
import type { Dictionary } from "@/lib/dictionaries";
import { localize } from "@/lib/domain/recipe";
import type { Mood } from "@/lib/domain/vocabulary";
import { localizePath, type Locale } from "@/lib/i18n";
import { moodColor } from "@/lib/moods";
import { deliverCard, renderShareCard } from "@/lib/share-card";
import { Button } from "@/components/action-button";
import { Alert, AlertDescription } from "@/components/coss/alert";
import { PourProgress } from "@/components/PourProgress";
import { Skeleton } from "@/components/coss/skeleton";

type Labels = Pick<Dictionary, "drink" | "recipe" | "vocab">;
type Phase = "loading" | "missing" | "failed" | "ready";
type ImageState = "idle" | "pending" | "failed";
type Busy = "publish" | "withdraw" | "share" | null;

/** A private drink, opened with the token this browser saved when it was poured. */
export function DrinkClient({
  id,
  locale,
  dict,
  suggestions,
  stamp,
  moodLabels,
}: {
  id: string;
  locale: Locale;
  dict: Labels;
  /** Drinks from the menu, offered when this one cannot be opened. */
  suggestions: Suggestion[];
  stamp: string;
  moodLabels: Record<Mood, string>;
}) {
  const t = dict.drink;
  const savedDrinks = useSavedDrinks();
  const token = savedDrinks?.find((item) => item.id === id)?.editToken ?? null;
  const savedMood = savedDrinks?.find((item) => item.id === id)?.mood ?? null;

  const [fetchPhase, setFetchPhase] = useState<Phase>("loading");
  const [attempt, setAttempt] = useState(0);
  const [drink, setDrink] = useState<DrinkView | null>(null);
  const [imageState, setImageState] = useState<ImageState>("idle");
  const [busy, setBusy] = useState<Busy>(null);
  const [actionError, setActionError] = useState(false);

  // Until hydration we cannot know whether this browser holds the token.
  const phase: Phase = savedDrinks === null ? "loading" : token === null ? "missing" : fetchPhase;

  const requestImage = useCallback(async () => {
    if (!token) return;
    setImageState("pending");
    const result = await callApi<DrinkView>(`/api/drinks/${id}/image`, { editToken: token });
    if (result.ok) {
      setDrink(result.data);
      setImageState("idle");
    } else {
      setImageState("failed");
    }
  }, [id, token]);

  useEffect(() => {
    if (!token) return;
    let live = true;

    void callApi<DrinkView>(`/api/drinks/${id}`, { editToken: token }).then((result) => {
      if (!live) return;
      if (!result.ok) {
        setFetchPhase(result.code === "NOT_FOUND" ? "missing" : "failed");
        return;
      }
      setDrink(result.data);
      setFetchPhase("ready");

      // One automatic attempt per tab; after that the guest decides.
      const triedKey = `moodshaker:image-tried:${id}`;
      if (result.data.imageUrl) return;
      try {
        if (sessionStorage.getItem(triedKey)) return;
        sessionStorage.setItem(triedKey, "1");
      } catch {
        // Without session storage the attempt cannot be remembered; the guest asks by hand.
        return;
      }
      void requestImage();
    });

    return () => {
      live = false;
    };
  }, [id, token, attempt, requestImage]);

  async function togglePublish() {
    if (!token || !drink) return;
    const publishing = !drink.published;
    setBusy(publishing ? "publish" : "withdraw");
    setActionError(false);
    const result = await callApi<DrinkView>(
      `/api/drinks/${id}/publish`,
      { editToken: token },
      publishing ? "POST" : "DELETE",
    );
    if (result.ok) setDrink(result.data);
    else setActionError(true);
    setBusy(null);
  }

  async function share(recipeName: string) {
    if (!drink) return;
    setBusy("share");
    setActionError(false);
    try {
      const blob = await renderShareCard(localize(drink.recipe, locale), drink.imageUrl, drink.mood, dict);
      await deliverCard(blob, `moodshaker-${drink.slug ?? drink.id}.png`, recipeName);
    } catch {
      setActionError(true);
    }
    setBusy(null);
  }

  if (phase === "loading") {
    return (
      // The same field and the same grid as the page that follows, in the mood's
      // colour when this browser poured the drink: arriving from the questionnaire,
      // the colour never changes and the recipe settles into the outline.
      <div
        className="transition-colors duration-500"
        style={{ backgroundColor: savedMood ? moodColor(savedMood) : undefined }}
        role="status"
        aria-live="polite"
      >
        <div className="frame grid gap-x-8 gap-y-6 py-8 lg:grid-cols-12 lg:py-12">
          <div className="order-2 aspect-square md:max-lg:aspect-[16/10] lg:order-none lg:col-span-6 lg:aspect-[4/5]" />
          <div className="order-1 flex flex-col gap-4 lg:order-none lg:col-span-6 lg:col-start-7 lg:self-end lg:pl-6 lg:pb-24">
            <Skeleton className="h-12 w-2/3 rounded-none" />
            <Skeleton className="h-4 w-1/4 rounded-none [animation-delay:80ms]" />
            <Skeleton className="mt-5 h-5 w-full rounded-none [animation-delay:160ms]" />
            <Skeleton className="h-5 w-5/6 rounded-none [animation-delay:240ms]" />
            {/* The ticket's outline, so the recipe settles into it instead of shifting the page. */}
            <div className="mt-8 border border-ink/12 bg-bone/45">
              <div className="border-b border-ink/15 px-4 py-4">
                <Skeleton className="h-5 w-1/4 rounded-none bg-bone/70" />
              </div>
              <div className="space-y-4 px-4 py-4">
                {[0, 1, 2, 3].map((row) => (
                  <div key={row} className="flex items-baseline justify-between gap-6">
                    <Skeleton className="h-3 w-1/4 rounded-none bg-bone/70" />
                    <Skeleton className="h-4 w-1/5 rounded-none bg-bone/70" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <span className="sr-only">{t.loading}</span>
      </div>
    );
  }

  if (phase === "missing" || phase === "failed" || !drink) {
    return (
      <EmptyState
        title={phase === "failed" ? t.actionFailed : t.missingTitle}
        body={phase === "failed" ? undefined : t.missingBody}
        suggestionsTitle={t.fromMenu}
        suggestions={suggestions}
      >
        {phase === "failed" && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFetchPhase("loading");
              setAttempt((n) => n + 1);
            }}
          >
            {t.retry}
          </Button>
        )}
        <Button render={<Link href={localizePath("/questions", locale)} />}>
          {t.again} <span aria-hidden>→</span>
        </Button>
      </EmptyState>
    );
  }

  const recipe = localize(drink.recipe, locale);

  // No photograph yet: the same shaker that waits on the questionnaire, faded onto
  // the field, with the work and its clock under it. An empty field with one line
  // of text in the middle of it reads as a broken image, not as a pour in progress.
  const photoFallback = (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
      <motion.img
        src="/stages/shaker.webp"
        alt=""
        className="specimen w-[46%] max-w-[19rem] opacity-70"
        animate={imageState === "pending" ? { rotate: [0, -5, 5, -5, 0], y: ["0%", "-2%", "0%"] } : { rotate: 0 }}
        transition={
          imageState === "pending"
            ? { duration: 2.6, ease: "easeInOut", repeat: Infinity }
            : { duration: 0.3 }
        }
      />
      {imageState === "pending" ? (
        <div role="status" className="mt-8 w-full max-w-[21rem]">
          <p className="text-lead">{t.imagePending}…</p>
          <PourProgress seconds={30} className="mt-4" />
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-lead">{t.imageFailed}</p>
          <Button type="button" variant="secondary" onClick={() => void requestImage()}>
            {t.retryImage}
          </Button>
        </div>
      )}
    </div>
  );

  // Only photographed drinks go on the menu; one already there can always come off.
  const canPublish = drink.published || Boolean(drink.imageUrl);

  const actions = (
    <div>
      {/* One primary: the next real action. Share is always available, so it stays
          quiet; publishing is primary only while it is the thing being asked for. */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={!drink.published && canPublish ? "secondary" : undefined}
          disabled={busy !== null}
          onClick={() => void share(recipe.name)}
        >
          {busy === "share" ? t.sharing : t.share}
        </Button>
        <Button
          type="button"
          variant={!drink.published && canPublish ? undefined : "secondary"}
          className={
            !drink.published && !canPublish
              ? "disabled:border-ink/10 disabled:bg-ink/[0.06] disabled:text-ink/40 disabled:opacity-100"
              : undefined
          }
          disabled={busy !== null || !canPublish}
          aria-describedby={canPublish ? undefined : "publish-hint"}
          onClick={() => void togglePublish()}
        >
          {busy === "publish"
            ? t.publishing
            : busy === "withdraw"
              ? t.withdrawing
              : drink.published
                ? t.withdraw
                : t.publish}
        </Button>
        <Link
          href={localizePath("/questions", locale)}
          className="link ml-2 inline-flex min-h-11 items-center gap-1.5"
        >
          {t.again} <span aria-hidden>→</span>
        </Link>
      </div>
      {!canPublish && (
        <p id="publish-hint" className="mt-5 text-ink/70">
          {t.publishNeedsPhoto}
        </p>
      )}
      {drink.published && drink.slug && (
        <p className="mt-5">
          {t.publishedNote}{" "}
          <Link href={localizePath(`/cocktail/${drink.slug}`, locale)} className="link">
            {t.viewPublic}
          </Link>
        </p>
      )}
      {actionError && (
        <Alert variant="error" className="mt-5 rounded-none">
          <AlertDescription className="text-ink">{t.actionFailed}</AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <DrinkSheet
      recipe={recipe}
      mood={drink.mood}
      imageUrl={drink.imageUrl}
      dict={dict}
      stamp={stamp}
      moodLabel={drink.mood ? moodLabels[drink.mood] : null}
      ticketKey={drink.slug ?? drink.id}
      actions={actions}
      photoFallback={photoFallback}
      develop
    />
  );
}
