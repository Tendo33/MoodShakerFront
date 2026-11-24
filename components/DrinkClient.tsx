"use client";

import Link from "next/link";
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
          <div className="order-1 flex flex-col gap-4 lg:order-none lg:col-span-6 lg:col-start-7 lg:self-end lg:pb-40 lg:pl-6">
            <Skeleton className="h-10 w-2/3 rounded-none" />
            <Skeleton className="h-5 w-1/3 rounded-none [animation-delay:80ms]" />
            <Skeleton className="mt-6 h-4 w-full rounded-none [animation-delay:160ms]" />
            <Skeleton className="h-4 w-5/6 rounded-none [animation-delay:240ms]" />
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

  const photoFallback = (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 text-center">
      {imageState === "pending" ? (
        <div role="status" className="w-full max-w-[18rem]">
          <p className="text-lead">{t.imagePending}…</p>
          <PourProgress seconds={30} className="mt-5" />
        </div>
      ) : (
        <>
          {imageState === "failed" && <p className="text-lead">{t.imageFailed}</p>}
          <Button type="button" variant="secondary" onClick={() => void requestImage()}>
            {t.retryImage}
          </Button>
        </>
      )}
    </div>
  );

  // Only photographed drinks go on the menu; one already there can always come off.
  const canPublish = drink.published || Boolean(drink.imageUrl);

  const actions = (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Button
          type="button"
          variant={drink.published ? undefined : "ghost"}
          className={drink.published ? undefined : "bg-ink/10 hover:bg-ink hover:text-bone"}
          disabled={busy !== null}
          onClick={() => void share(recipe.name)}
        >
          {busy === "share" ? t.sharing : t.share}
        </Button>
        <Button
          type="button"
          variant={drink.published ? "ghost" : undefined}
          className={drink.published ? "bg-ink/10 hover:bg-ink hover:text-bone" : undefined}
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
        <Link href={localizePath("/questions", locale)} className="link col-span-2 py-2 sm:ml-2">
          {t.again} →
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
