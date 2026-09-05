import {
  Prisma,
  RecommendationStatus as PrismaRecommendationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  AgentType,
  type Cocktail,
  type RecommendationMeta,
  type RecommendationSession,
  RecommendationStatus,
  type StoredCocktailContent,
} from "@/lib/cocktail-types";
import type { GeneratedStoredCocktail } from "@/lib/ai/cocktail-generation";
import {
  readStoredContent,
  resolveCocktail,
} from "@/lib/domain/resolve-cocktail";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";
import { generateEditToken } from "@/utils/generateId";

/**
 * Private recommendation sessions.
 *
 * `cocktailPayload` holds the bilingual stored shape rather than a display-ready
 * cocktail. It used to store whichever language the request happened to use, so
 * opening the same recommendation under the other locale showed the original
 * language — the data had already been flattened on write.
 */

const recommendationSessionSelect = {
  id: true,
  sessionId: true,
  editToken: true,
  language: true,
  agentType: true,
  answers: true,
  baseSpirits: true,
  specialRequests: true,
  cocktailPayload: true,
  imageUrl: true,
  thumbnailUrl: true,
  status: true,
  publishedCocktailId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RecommendationSessionSelect;

type SessionRecord = Prisma.RecommendationSessionGetPayload<{
  select: typeof recommendationSessionSelect;
}>;

/** The payload as written: bilingual content plus vocabulary codes. */
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

function resolveSessionCocktail(
  record: SessionRecord,
  locale: Locale,
): Cocktail | null {
  const payload = readPayload(record.cocktailPayload);
  if (!payload) return null;

  return resolveCocktail(
    {
      id: record.id,
      // A private recommendation has no public URL; the id stands in so callers
      // can treat sessions and published cocktails uniformly.
      slug: record.id,
      content: payload.content,
      baseSpirit: payload.baseSpirit,
      alcoholLevel: payload.alcoholLevel,
      flavorProfiles: payload.flavorProfiles,
      imageUrl: record.imageUrl,
      thumbnailUrl: record.thumbnailUrl,
    },
    locale,
  );
}

function mapSession(
  record: SessionRecord,
  locale?: Locale,
): RecommendationSession | null {
  // Defaults to the locale the recommendation was requested in, but any locale
  // can be rendered from the same row.
  const target =
    locale ?? (isLocale(record.language) ? record.language : DEFAULT_LOCALE);

  const cocktail = resolveSessionCocktail(record, target);
  if (!cocktail) return null;

  return {
    id: record.id,
    sessionId: record.sessionId,
    editToken: record.editToken,
    language: record.language,
    agentType: record.agentType as AgentType,
    answers: (record.answers ?? {}) as Record<string, string>,
    baseSpirits: record.baseSpirits,
    specialRequests: record.specialRequests || undefined,
    cocktail,
    status:
      record.status === PrismaRecommendationStatus.PUBLISHED
        ? RecommendationStatus.PUBLISHED
        : RecommendationStatus.PRIVATE,
    publishedCocktailId: record.publishedCocktailId || undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function createRecommendationSession(input: {
  sessionId: string;
  language: string;
  agentType: AgentType;
  answers: Record<string, string>;
  baseSpirits: string[];
  specialRequests?: string;
  cocktail: GeneratedStoredCocktail;
}): Promise<{ session: RecommendationSession; meta: RecommendationMeta }> {
  const editToken = generateEditToken();

  const record = await prisma.recommendationSession.create({
    data: {
      sessionId: input.sessionId,
      editToken,
      language: input.language,
      agentType: input.agentType,
      answers: input.answers as Prisma.InputJsonValue,
      baseSpirits: input.baseSpirits,
      specialRequests: input.specialRequests,
      cocktailPayload: input.cocktail as unknown as Prisma.InputJsonValue,
      status: PrismaRecommendationStatus.PRIVATE,
    },
    select: recommendationSessionSelect,
  });

  const session = mapSession(record);

  if (!session) {
    // The payload was just built from validated generator output, so an
    // unreadable one means the write shape and the read shape have diverged.
    throw new Error(
      `Recommendation ${record.id} was stored with an unreadable payload.`,
    );
  }

  return {
    session,
    meta: {
      recommendationId: record.id,
      editToken,
      sessionId: record.sessionId,
    },
  };
}

/**
 * Reads a recommendation without proof of ownership.
 *
 * Only for paths that have already established access some other way, such as
 * rendering an already-published cocktail. Anything acting on a private
 * recommendation must use {@link getRecommendationSessionById}, which requires the
 * edit token.
 */
export async function getRecommendationSessionByIdOnly(
  id: string,
  locale?: Locale,
): Promise<RecommendationSession | null> {
  const record = await prisma.recommendationSession.findUnique({
    where: { id },
    select: recommendationSessionSelect,
  });

  return record ? mapSession(record, locale) : null;
}

/**
 * Reads a private recommendation, gated on the edit token.
 *
 * The token is part of the `where` clause: a wrong token returns null rather than
 * a row the caller then has to remember to check. `locale` is separate and
 * optional, so adding it cannot be mistaken for the token.
 */
export async function getRecommendationSessionById(
  id: string,
  editToken: string,
  locale?: Locale,
): Promise<RecommendationSession | null> {
  const record = await prisma.recommendationSession.findFirst({
    where: { id, editToken },
    select: recommendationSessionSelect,
  });

  return record ? mapSession(record, locale) : null;
}

/**
 * Reads what the image pipeline needs, gated on the edit token.
 *
 * Returns the stored bilingual content rather than a resolved cocktail: the image
 * prompt is written in English regardless of the caller's locale, so resolving to
 * one language here would throw away the name the prompt actually wants.
 */
export async function getRecommendationImageContext(
  id: string,
  editToken: string,
): Promise<{
  content: StoredCocktailContent;
  imageUrl: string | null;
  thumbnailUrl: string | null;
} | null> {
  const record = await prisma.recommendationSession.findFirst({
    where: { id, editToken },
    select: {
      cocktailPayload: true,
      imageUrl: true,
      thumbnailUrl: true,
    },
  });

  if (!record) return null;

  const payload = readPayload(record.cocktailPayload);
  if (!payload) return null;

  return {
    content: payload.content,
    imageUrl: record.imageUrl,
    thumbnailUrl: record.thumbnailUrl,
  };
}

/**
 * Writes image URLs for a recommendation the caller can prove they own.
 *
 * The `editToken` is part of the `where` clause, not just checked in the route.
 * The route check is the primary gate, but keeping it here means a future caller
 * that forgets to check cannot silently overwrite someone else's image.
 *
 * Returns false when nothing matched, which means either an unknown id or a
 * wrong token — deliberately indistinguishable to the caller.
 */
export async function updateRecommendationSessionImageUrls(input: {
  id: string;
  editToken: string;
  imageUrl: string;
  thumbnailUrl: string;
}): Promise<boolean> {
  const updated = await prisma.recommendationSession.updateMany({
    where: {
      id: input.id,
      editToken: input.editToken,
    },
    data: {
      imageUrl: input.imageUrl,
      thumbnailUrl: input.thumbnailUrl,
    },
  });

  return updated.count > 0;
}
