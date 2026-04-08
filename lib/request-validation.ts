import { AgentType } from "@/lib/cocktail-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export interface ValidatedCocktailRequest {
  answers: Record<string, string>;
  baseSpirits: string[];
  sessionId: string;
  specialRequests?: string;
  agentType: AgentType;
  language: "en" | "cn";
}

export interface ValidatedImageRequest {
  recommendationId: string;
  editToken: string;
  prompt: string;
  forceRefresh: boolean;
}

export interface ValidatedRecommendationAccessRequest {
  editToken: string;
}

export function validateCocktailRequest(
  input: unknown,
): { success: true; data: ValidatedCocktailRequest } | { success: false; message: string } {
  if (!isRecord(input)) {
    return { success: false, message: "Request body must be an object." };
  }

  const { answers, baseSpirits, sessionId, specialRequests, agentType, language } = input;

  if (!isRecord(answers) || Object.values(answers).some((value) => typeof value !== "string")) {
    return { success: false, message: "Invalid answers payload." };
  }

  if (!isStringArray(baseSpirits)) {
    return { success: false, message: "Base spirits must be a string array." };
  }

  if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    return { success: false, message: "Session id is required." };
  }

  if (
    specialRequests !== undefined &&
    typeof specialRequests !== "string"
  ) {
    return { success: false, message: "Special requests must be a string." };
  }

  if (
    agentType !== AgentType.CLASSIC_BARTENDER &&
    agentType !== AgentType.CREATIVE_BARTENDER
  ) {
    return { success: false, message: "Invalid agent type." };
  }

  if (language !== "en" && language !== "cn") {
    return { success: false, message: "Invalid language." };
  }

  return {
    success: true,
    data: {
      answers: Object.fromEntries(
        Object.entries(answers).map(([key, value]) => [key, String(value)]),
      ),
      baseSpirits,
      sessionId: sessionId.trim(),
      specialRequests: specialRequests?.trim() || undefined,
      agentType,
      language,
    },
  };
}

export function validateImageRequest(
  input: unknown,
): { success: true; data: ValidatedImageRequest } | { success: false; message: string } {
  if (!isRecord(input)) {
    return { success: false, message: "Request body must be an object." };
  }

  const { recommendationId, editToken, prompt, forceRefresh } = input;

  if (typeof recommendationId !== "string" || recommendationId.trim().length === 0) {
    return { success: false, message: "Recommendation id is required." };
  }

  if (typeof editToken !== "string" || editToken.trim().length === 0) {
    return { success: false, message: "Edit token is required." };
  }

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return { success: false, message: "Prompt is required." };
  }

  if (forceRefresh !== undefined && typeof forceRefresh !== "boolean") {
    return { success: false, message: "forceRefresh must be a boolean." };
  }

  return {
    success: true,
    data: {
      recommendationId: recommendationId.trim(),
      editToken: editToken.trim(),
      prompt: prompt.trim(),
      forceRefresh: Boolean(forceRefresh),
    },
  };
}

export function validateRecommendationAccessRequest(
  input: unknown,
): { success: true; data: ValidatedRecommendationAccessRequest } | { success: false; message: string } {
  if (!isRecord(input)) {
    return { success: false, message: "Request body must be an object." };
  }

  const { editToken } = input;

  if (typeof editToken !== "string" || editToken.trim().length === 0) {
    return { success: false, message: "Edit token is required." };
  }

  return {
    success: true,
    data: {
      editToken: editToken.trim(),
    },
  };
}
