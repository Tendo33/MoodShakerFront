"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DrinkSheet } from "@/components/DrinkSheet";
import { EmptyState, type Suggestion } from "@/components/EmptyState";
import { callApi, useSavedDrinks } from "@/lib/client";
import type { DrinkView } from "@/lib/db/drinks";
import type { Dictionary } from "@/lib/dictionaries";
import { localize } from "@/lib/domain/recipe";
import { localizePath, type Locale } from "@/lib/i18n";
import { moodColor } from "@/lib/moods";
import { deliverCard, renderShareCard } from "@/lib/share-card";

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
}: {
  id: string;
  locale: Locale;
  dict: Labels;
  /** Drinks from the menu, offered when this one cannot be opened. */
  suggestions: Suggestion[];
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
            <div className="h-10 w-2/3 bg-ink/10 motion-safe:animate-[skeleton_1.6s_ease-in-out_infinite]" />
            <div className="h-5 w-1/3 bg-ink/10 motion-safe:animate-[skeleton_1.6s_ease-in-out_infinite] [animation-delay:80ms]" />
            <div className="mt-6 h-4 w-full bg-ink/10 motion-safe:animate-[skeleton_1.6s_ease-in-out_infinite] [animation-delay:160ms]" />
            <div className="h-4 w-5/6 bg-ink/10 motion-safe:animate-[skeleton_1.6s_ease-in-out_infinite] [animation-delay:240ms]" />
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
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => {
              setFetchPhase("loading");
              setAttempt((n) => n + 1);
            }}
          >
            {t.retry}
          </button>
        )}
        <Link href={localizePath("/questions", locale)} className="btn btn-primary">
          {t.again} <span aria-hidden>→</span>
        </Link>
      </EmptyState>
    );
  }

  const recipe = localize(drink.recipe, locale);

  const photoFallback = (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 text-center">
      {imageState === "pending" ? (
        <div role="status" className="w-full max-w-[18rem]">
          <p className="text-lead">{t.imagePending}…</p>
          <span aria-hidden className="mt-5 block h-1 overflow-hidden bg-ink/15">
            <span className="block h-full origin-left bg-ink motion-safe:animate-[pour_80s_cubic-bezier(0.25,0.6,0.5,1)_both] motion-reduce:hidden" />
          </span>
        </div>
      ) : (
        <>
          {imageState === "failed" && <p className="text-lead">{t.imageFailed}</p>}
          <button type="button" className="btn btn-quiet" onClick={() => void requestImage()}>
            {t.retryImage}
          </button>
        </>
      )}
    </div>
  );

  // Only photographed drinks go on the menu; one already there can always come off.
  const canPublish = drink.published || Boolean(drink.imageUrl);

  const actions = (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <button type="button" className="btn btn-primary" disabled={busy !== null} onClick={() => void share(recipe.name)}>
          {busy === "share" ? t.sharing : t.share}
        </button>
        <button
          type="button"
          className="btn bg-ink/10 transition-[background-color,color] duration-150 hover:bg-ink hover:text-bone"
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
        </button>
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
        <p role="alert" className="mt-5 font-medium">
          {t.actionFailed}
        </p>
      )}
    </div>
  );

  return (
    <DrinkSheet
      recipe={recipe}
      mood={drink.mood}
      imageUrl={drink.imageUrl}
      dict={dict}
      actions={actions}
      photoFallback={photoFallback}
      develop
    />
  );
}
