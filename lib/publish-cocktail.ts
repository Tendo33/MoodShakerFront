import {
  Prisma,
  RecommendationStatus as PrismaRecommendationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { StoredCocktailContent } from "@/lib/cocktail-types";
import { buildSlug, makeUniqueSlug } from "@/lib/domain/slug";
import { readStoredContent } from "@/lib/domain/resolve-cocktail";
import {
  coerceAlcoholLevel,
  coerceBaseSpirit,
  coerceFlavorProfiles,
} from "@/lib/domain/vocabulary";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Publish");

/**
 * Publishing a private recommendation to the public gallery.
 *
 * The schema has carried `RecommendationStatus.PUBLISHED` and
 * `publishedCocktailId` since the beginning, and nothing ever wrote either one:
 * every recommendation stayed `PRIVATE` forever, and the gallery could only show
 * rows inserted by the seed script. This is the missing half of that design.
 *
 * Both directions are gated on the edit token, in the `where` clause rather than
 * a separate check, so a caller cannot publish or withdraw someone else's
 * recommendation.
 */

export type PublishFailure =
  | "NOT_FOUND"
  | "UNREADABLE_PAYLOAD"
  | "SLUG_CONFLICT";

export type PublishResult =
  | { ok: true; slug: string; cocktailId: string; alreadyPublished: boolean }
  | { ok: false; reason: PublishFailure };

interface SessionRow {
  id: string;
  cocktailPayload: unknown;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  status: PrismaRecommendationStatus;
  publishedCocktailId: string | null;
}

interface StoredPayload {
  content: StoredCocktailContent;
  baseSpirit: string;
  alcoholLevel: string;
  flavorProfiles: string[];
}

function readPayload(value: unknown): StoredPayload | null {
  if (typeof value !== "object" || value === null) return null;

  const payload = value as Partial<StoredPayload>;
  const content = readStoredContent(payload.content);
  if (!content) return null;

  return {
    content,
    baseSpirit: String(payload.baseSpirit ?? "other"),
    alcoholLevel: String(payload.alcoholLevel ?? "medium"),
    flavorProfiles: Array.isArray(payload.flavorProfiles)
      ? payload.flavorProfiles.map(String)
      : [],
  };
}

/**
 * Reserves a slug for a name.
 *
 * Reads the taken slugs with the same prefix rather than the whole table, so this
 * stays cheap as the gallery grows. The unique index is still the real guarantee —
 * two concurrent publishes can both see a slug as free.
 */
async function reserveSlug(
  tx: Prisma.TransactionClient,
  content: StoredCocktailContent,
  sessionId: string,
): Promise<string> {
  const base = buildSlug(content.name, `cocktail-${sessionId.slice(0, 8)}`);

  const existing = await tx.cocktail.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });

  const taken = new Set(existing.map((row) => row.slug));
  return makeUniqueSlug(base, (candidate) => taken.has(candidate));
}

/**
 * Transaction budget for publish and withdraw.
 *
 * Prisma's defaults are 2 s to acquire a connection and 5 s to run. Publishing
 * does four round trips — a locking select, a slug scan, an insert, an update —
 * against a Neon instance that suspends when idle and takes several seconds to
 * accept its first connection. On the default budget the transaction is discarded
 * mid-flight and the caller sees `Transaction not found`, which reads like a bug
 * rather than a timeout.
 */
const TRANSACTION_OPTIONS = { maxWait: 15_000, timeout: 30_000 } as const;

export async function publishRecommendation(input: {
  recommendationId: string;
  editToken: string;
}): Promise<PublishResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<SessionRow[]>(Prisma.sql`
        SELECT id, cocktail_payload AS "cocktailPayload", image_url AS "imageUrl",
               thumbnail_url AS "thumbnailUrl", status,
               published_cocktail_id AS "publishedCocktailId"
        FROM recommendation_sessions
        WHERE id = ${input.recommendationId}
          AND edit_token = ${input.editToken}
        -- Serializes concurrent publishes of the same recommendation, so a double
        -- click cannot create two public cocktails.
        FOR UPDATE`);

      const session = rows[0];
      if (!session) return { ok: false as const, reason: "NOT_FOUND" as const };

      // Idempotent: publishing twice returns the existing cocktail rather than
      // creating a second copy.
      if (session.publishedCocktailId) {
        const published = await tx.cocktail.findUnique({
          where: { id: session.publishedCocktailId },
          select: { id: true, slug: true },
        });

        if (published) {
          return {
            ok: true as const,
            slug: published.slug,
            cocktailId: published.id,
            alreadyPublished: true,
          };
        }

        // The session points at a cocktail that no longer exists — it was deleted
        // out from under it. Fall through and republish rather than returning a
        // dangling reference.
        logger.warn("Session references a missing cocktail; republishing", {
          recommendationId: session.id,
          cocktailId: session.publishedCocktailId,
        });
      }

      const payload = readPayload(session.cocktailPayload);
      if (!payload) {
        return { ok: false as const, reason: "UNREADABLE_PAYLOAD" as const };
      }

      const slug = await reserveSlug(tx, payload.content, session.id);

      const cocktail = await tx.cocktail.create({
        data: {
          slug,
          content: payload.content as unknown as Prisma.InputJsonValue,
          baseSpirit: coerceBaseSpirit(payload.baseSpirit),
          alcoholLevel: coerceAlcoholLevel(payload.alcoholLevel),
          flavorProfiles: coerceFlavorProfiles(payload.flavorProfiles),
          imageUrl: session.imageUrl,
          thumbnailUrl: session.thumbnailUrl,
        },
        select: { id: true, slug: true },
      });

      await tx.recommendationSession.update({
        where: { id: session.id },
        data: {
          status: PrismaRecommendationStatus.PUBLISHED,
          publishedCocktailId: cocktail.id,
        },
      });

      logger.info("Published recommendation", {
        recommendationId: session.id,
        slug: cocktail.slug,
      });

      return {
        ok: true as const,
        slug: cocktail.slug,
        cocktailId: cocktail.id,
        alreadyPublished: false,
      };
    }, TRANSACTION_OPTIONS);
  } catch (error) {
    // The unique index on slug is the real collision guarantee; two concurrent
    // publishes of different recommendations with the same name can both pass the
    // pre-check above.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      logger.warn("Slug collision while publishing", {
        recommendationId: input.recommendationId,
      });
      return { ok: false, reason: "SLUG_CONFLICT" };
    }

    throw error;
  }
}

export type WithdrawResult =
  | {
      ok: true;
      wasPublished: boolean;
      /**
       * The slug that was withdrawn, so the caller can invalidate the cached page
       * for it. Null when nothing was published.
       */
      slug: string | null;
    }
  | { ok: false; reason: "NOT_FOUND" };

/**
 * Withdraws a published recommendation from the gallery.
 *
 * Deletes the public cocktail and returns the session to `PRIVATE`. The
 * recommendation itself survives, so the owner can still open it and republish.
 *
 * Without this, publishing was a one-way door: the plan called for a withdrawal
 * path before shipping the publish button, not after.
 */
export async function withdrawRecommendation(input: {
  recommendationId: string;
  editToken: string;
}): Promise<WithdrawResult> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      Array<{ id: string; publishedCocktailId: string | null }>
    >(Prisma.sql`
      SELECT id, published_cocktail_id AS "publishedCocktailId"
      FROM recommendation_sessions
      WHERE id = ${input.recommendationId}
        AND edit_token = ${input.editToken}
      FOR UPDATE`);

    const session = rows[0];
    if (!session) return { ok: false as const, reason: "NOT_FOUND" as const };

    // Already private. Reported as success: the caller asked for it to not be
    // published, and it is not published.
    if (!session.publishedCocktailId) {
      return { ok: true as const, wasPublished: false, slug: null };
    }

    // Read the slug before deleting: the caller needs it to invalidate the cached
    // public page, and after the delete there is nothing left to read it from.
    const doomed = await tx.cocktail.findUnique({
      where: { id: session.publishedCocktailId },
      select: { slug: true },
    });

    // deleteMany rather than delete: the row may already be gone, and that should
    // not fail a withdrawal whose goal is for it to be absent.
    await tx.cocktail.deleteMany({
      where: { id: session.publishedCocktailId },
    });

    await tx.recommendationSession.update({
      where: { id: session.id },
      data: {
        status: PrismaRecommendationStatus.PRIVATE,
        publishedCocktailId: null,
      },
    });

    logger.info("Withdrew recommendation", { recommendationId: session.id });

    return {
      ok: true as const,
      wasPublished: true,
      slug: doomed?.slug ?? null,
    };
  }, TRANSACTION_OPTIONS);
}
