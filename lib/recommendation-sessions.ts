import { Prisma, RecommendationStatus as PrismaRecommendationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  AgentType,
  Cocktail,
  RecommendationMeta,
  RecommendationSession,
  RecommendationStatus,
} from "@/lib/cocktail-types";
import { generateEditToken } from "@/utils/generateId";

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
  image: true,
  thumbnail: true,
  imageUrl: true,
  thumbnailUrl: true,
  status: true,
  publishedCocktailId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RecommendationSessionSelect;

type DBRecommendationSession = Prisma.RecommendationSessionGetPayload<{
  select: typeof recommendationSessionSelect;
}>;

function mapRecommendationStatus(
  status: PrismaRecommendationStatus,
): RecommendationStatus {
  switch (status) {
    case PrismaRecommendationStatus.PRIVATE:
      return RecommendationStatus.PRIVATE;
    case PrismaRecommendationStatus.PUBLISHED:
      return RecommendationStatus.PUBLISHED;
    default:
      return RecommendationStatus.PRIVATE;
  }
}

function mapSession(record: DBRecommendationSession): RecommendationSession {
  const cocktail = record.cocktailPayload as unknown as Cocktail;
  // Dual read for the object-storage migration: prefer the new URL columns and
  // fall back to the legacy inline values until the backfill is complete.
  const image = record.imageUrl || record.image || cocktail.image;
  const thumbnail =
    record.thumbnailUrl || record.thumbnail || cocktail.thumbnail;

  return {
    id: record.id,
    sessionId: record.sessionId,
    editToken: record.editToken,
    language: record.language,
    agentType: record.agentType as AgentType,
    answers: (record.answers as Record<string, string>) || {},
    baseSpirits: record.baseSpirits || [],
    specialRequests: record.specialRequests || undefined,
    cocktail: {
      ...cocktail,
      id: record.id,
      image,
      thumbnail,
    },
    image: image || undefined,
    thumbnail: thumbnail || undefined,
    status: mapRecommendationStatus(record.status),
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
  cocktail: Cocktail;
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
      imageUrl: input.cocktail.image,
      thumbnailUrl: input.cocktail.thumbnail,
      status: PrismaRecommendationStatus.PRIVATE,
    },
    select: recommendationSessionSelect,
  });

  return {
    session: mapSession(record),
    meta: {
      recommendationId: record.id,
      editToken,
      sessionId: record.sessionId,
    },
  };
}

export async function getRecommendationSessionByIdOnly(
  id: string,
): Promise<RecommendationSession | null> {
  const record = await prisma.recommendationSession.findUnique({
    where: { id },
    select: recommendationSessionSelect,
  });

  return record ? mapSession(record) : null;
}

export async function getRecommendationSessionById(
  id: string,
  editToken: string,
): Promise<RecommendationSession | null> {
  const record = await prisma.recommendationSession.findFirst({
    where: {
      id,
      editToken,
    },
    select: recommendationSessionSelect,
  });

  return record ? mapSession(record) : null;
}

/**
 * Persists object-storage URLs for a recommendation image.
 *
 * Also clears the legacy inline columns so a refreshed image cannot be shadowed
 * by a stale base64 payload during the dual-read window.
 */
export async function updateRecommendationSessionImageUrls(input: {
  id: string;
  editToken: string;
  imageUrl: string;
  thumbnailUrl: string;
}): Promise<RecommendationSession | null> {
  const updated = await prisma.recommendationSession.updateMany({
    where: {
      id: input.id,
      editToken: input.editToken,
    },
    data: {
      imageUrl: input.imageUrl,
      thumbnailUrl: input.thumbnailUrl,
      image: null,
      thumbnail: null,
    },
  });

  if (updated.count === 0) {
    return null;
  }

  return getRecommendationSessionById(input.id, input.editToken);
}
