import { AgentType } from "@/lib/cocktail-types";

const MAX_SESSION_ID_LENGTH = 64;
const MAX_EDIT_TOKEN_LENGTH = 256;
const MAX_SPECIAL_REQUESTS_LENGTH = 300;
const MAX_PROMPT_LENGTH = 1600;
const MAX_BASE_SPIRITS = 5;

const ALLOWED_ANSWER_VALUES: Record<string, readonly string[]> = {
  "1": ["classic", "creative"],
  "2": ["light", "medium", "strong", "surprise"],
  "3": ["beginner", "intermediate", "advanced"],
};

const ALLOWED_BASE_SPIRITS = new Set([
  "gin",
  "rum",
  "vodka",
  "whiskey",
  "tequila",
  "brandy",
]);

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

  if (Object.keys(answers).some((key) => !(key in ALLOWED_ANSWER_VALUES))) {
    return { success: false, message: "Unexpected answer key." };
  }

  if (
    Object.entries(answers).some(([key, value]) => {
      const normalizedValue = String(value).trim();
      return !ALLOWED_ANSWER_VALUES[key]?.includes(normalizedValue);
    })
  ) {
    return { success: false, message: "Invalid answer value." };
  }

  if (!isStringArray(baseSpirits)) {
    return { success: false, message: "Base spirits must be a string array." };
  }

  if (baseSpirits.length > MAX_BASE_SPIRITS) {
    return { success: false, message: "Too many base spirits." };
  }

  if (
    baseSpirits.some(
      (spirit) =>
        spirit.trim().length === 0 || !ALLOWED_BASE_SPIRITS.has(spirit.trim().toLowerCase()),
    )
  ) {
    return { success: false, message: "Invalid base spirit." };
  }

  if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    return { success: false, message: "Session id is required." };
  }

  if (sessionId.trim().length > MAX_SESSION_ID_LENGTH) {
    return {
      success: false,
      message: `Session id must be ${MAX_SESSION_ID_LENGTH} characters or fewer.`,
    };
  }

  if (
    specialRequests !== undefined &&
    typeof specialRequests !== "string"
  ) {
    return { success: false, message: "Special requests must be a string." };
  }

  if (
    typeof specialRequests === "string" &&
    specialRequests.trim().length > MAX_SPECIAL_REQUESTS_LENGTH
  ) {
    return {
      success: false,
      message: `Special requests must be ${MAX_SPECIAL_REQUESTS_LENGTH} characters or fewer.`,
    };
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
        Object.entries(answers).map(([key, value]) => [key, String(value).trim()]),
      ),
      baseSpirits: baseSpirits.map((spirit) => spirit.trim().toLowerCase()),
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

  if (editToken.trim().length > MAX_EDIT_TOKEN_LENGTH) {
    return {
      success: false,
      message: `Edit token must be ${MAX_EDIT_TOKEN_LENGTH} characters or fewer.`,
    };
  }

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return { success: false, message: "Prompt is required." };
  }

  if (prompt.trim().length > MAX_PROMPT_LENGTH) {
    return {
      success: false,
      message: `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.`,
    };
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

  if (editToken.trim().length > MAX_EDIT_TOKEN_LENGTH) {
    return {
      success: false,
      message: `Edit token must be ${MAX_EDIT_TOKEN_LENGTH} characters or fewer.`,
    };
  }

  return {
    success: true,
    data: {
      editToken: editToken.trim(),
    },
  };
}
