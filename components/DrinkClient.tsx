"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DrinkSheet } from "@/components/DrinkSheet";
import { callApi, useSavedDrinks } from "@/lib/client";
import type { DrinkView } from "@/lib/db/drinks";
import type { Dictionary } from "@/lib/dictionaries";
import { localize } from "@/lib/domain/recipe";
import { localizePath, type Locale } from "@/lib/i18n";
import { deliverCard, renderShareCard } from "@/lib/share-card";

type Labels = Pick<Dictionary, "drink" | "recipe" | "vocab">;
type Phase = "loading" | "missing" | "failed" | "ready";
type ImageState = "idle" | "pending" | "failed";
type Busy = "publish" | "withdraw" | "share" | null;

/** A private drink, opened with the token this browser saved when it was poured. */
export function DrinkClient({ id, locale, dict }: { id: string; locale: Locale; dict: Labels }) {
  const t = dict.drink;
  const savedDrinks = useSavedDrinks();
  const token = savedDrinks?.find((item) => item.id === id)?.editToken ?? null;

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
      if (!result.data.imageUrl && !sessionStorage.getItem(triedKey)) {
        sessionStorage.setItem(triedKey, "1");
        void requestImage();
      }
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
      <p className="frame py-40 text-lead text-muted" role="status">
        {t.loading}
      </p>
    );
  }

  if (phase === "missing" || phase === "failed" || !drink) {
    return (
      <div className="frame py-32">
        <h1 className="max-w-[18ch] text-head">{phase === "failed" ? t.actionFailed : t.missingTitle}</h1>
        {phase !== "failed" && <p className="mt-6 max-w-[48ch] text-lead">{t.missingBody}</p>}
        <div className="mt-10 flex flex-wrap gap-3">
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
        </div>
      </div>
    );
  }

  const recipe = localize(drink.recipe, locale);

  const photoFallback = (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 text-center">
      {imageState === "pending" ? (
        <p className="text-lead motion-safe:animate-pulse" role="status">
          {t.imagePending}…
        </p>
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

  const actions = (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary" disabled={busy !== null} onClick={() => void share(recipe.name)}>
          {busy === "share" ? t.sharing : t.share}
        </button>
        <button
          type="button"
          className="btn bg-ink/10 hover:bg-ink hover:text-bone"
          disabled={busy !== null}
          onClick={() => void togglePublish()}
        >
          {busy === "publish" ? t.publishing : drink.published ? t.withdraw : t.publish}
        </button>
        <Link href={localizePath("/questions", locale)} className="link ml-2">
          {t.again} →
        </Link>
      </div>
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
    />
  );
}
