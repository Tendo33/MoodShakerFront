"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, Loader2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/core";
import { useLanguage } from "@/context/LanguageContext";
import { createLogger } from "@/utils/logger";

const logger = createLogger("PublishAction");

/**
 * Publishes a recommendation to the public gallery, or withdraws it again.
 *
 * The schema has carried `PUBLISHED` and `publishedCocktailId` from the start with
 * nothing ever writing them, so every recommendation stayed private and the gallery
 * could only show rows from the seed script. This is the control that closes that
 * loop.
 *
 * The edit token goes in the request body, never the URL — a token in a URL ends up
 * in server logs, browser history, and `Referer` headers.
 */

interface RecommendationPublishActionProps {
  recommendationId: string;
  editToken: string;
  /** Publish state as the server last reported it. */
  initialIsPublished: boolean;
  initialPublishedSlug: string | null;
}

type Phase = "idle" | "working" | "error";

export default function RecommendationPublishAction({
  recommendationId,
  editToken,
  initialIsPublished,
  initialPublishedSlug,
}: RecommendationPublishActionProps) {
  const { t, language } = useLanguage();
  const [isPublished, setIsPublished] = useState(initialIsPublished);
  const [slug, setSlug] = useState(initialPublishedSlug);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function run(method: "POST" | "DELETE") {
    setPhase("working");
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/recommendation/${recommendationId}/publish`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ editToken }),
        },
      );

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        // Surfaces the server's message when there is one: "this recommendation
        // cannot be published because its data is incomplete" is actionable, while
        // a generic failure is not.
        setErrorMessage(
          body?.error?.message ?? t("recommendation.publish.failed"),
        );
        setPhase("error");
        return;
      }

      if (method === "POST") {
        setIsPublished(true);
        setSlug(body?.data?.slug ?? null);
      } else {
        setIsPublished(false);
        setSlug(null);
      }
      setPhase("idle");
    } catch (error) {
      logger.error("Publish request failed", error);
      setErrorMessage(t("recommendation.publish.failed"));
      setPhase("error");
    }
  }

  const isWorking = phase === "working";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant={isPublished ? "outline" : "secondary"}
          size="md"
          onClick={() => run(isPublished ? "DELETE" : "POST")}
          disabled={isWorking}
          icon={
            isWorking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPublished ? (
              <Undo2 className="h-4 w-4" />
            ) : (
              <Globe className="h-4 w-4" />
            )
          }
          // Without this a screen reader hears only the label change, with no
          // indication that the button is mid-request.
          aria-busy={isWorking}
        >
          {isWorking
            ? t("recommendation.publish.working")
            : isPublished
              ? t("recommendation.publish.withdraw")
              : t("recommendation.publish.publish")}
        </Button>

        {isPublished && slug ? (
          <Link
            href={`/${language}/cocktail/${slug}`}
            className="text-sm font-mono uppercase tracking-[0.14em] text-primary underline decoration-primary/40 underline-offset-4 transition hover:decoration-primary"
          >
            {t("recommendation.publish.viewPublic")}
          </Link>
        ) : null}
      </div>

      {/* Announced rather than shown silently: a failed publish is the whole
          reason the user is still on this page. */}
      {errorMessage ? (
        <p role="status" className="text-xs text-destructive">
          {errorMessage}
        </p>
      ) : isPublished ? (
        <p className="text-xs text-muted-foreground">
          {t("recommendation.publish.publishedHint")}
        </p>
      ) : null}
    </div>
  );
}
