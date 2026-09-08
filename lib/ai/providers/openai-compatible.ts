import "server-only";

import {
  type ChatCompletionRequest,
  type ChatCompletionResult,
  type ImageGenerationRequest,
  type ImageProvider,
  type LLMProvider,
  ProviderError,
  type TokenUsage,
} from "@/lib/ai/provider";
import { createLogger } from "@/utils/logger";

const logger = createLogger("AIProvider");

const CHAT_TIMEOUT_MS = 90_000;
const IMAGE_TIMEOUT_MS = 60_000;

/**
 * Requests are not retried on an HTTP response.
 *
 * A 4xx will fail identically on a second attempt, and a 5xx from an LLM
 * endpoint usually means the request was expensive enough to break something.
 * The previous stack retried at two layers at once — `optimizedFetch`'s
 * `retryCount: 1` inside a client loop of 2 — so one user-visible failure could
 * cost four generations at `max_tokens: 5000` with no ceiling. Only genuine
 * connection failures are retried now, and only once.
 */
const CONNECTION_RETRY_LIMIT = 1;

function readEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new ProviderError(
      "openai-compatible",
      `${name} is not configured.`,
    );
  }
  return value.trim();
}

/** Trailing slashes produce a 404 on `${base}//chat/completions`. */
function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

function parseUsage(raw: unknown): TokenUsage | null {
  if (typeof raw !== "object" || raw === null) return null;
  const usage = raw as Record<string, unknown>;
  const prompt = Number(usage.prompt_tokens ?? 0);
  const completion = Number(usage.completion_tokens ?? 0);
  const total = Number(usage.total_tokens ?? prompt + completion);
  if (!Number.isFinite(total) || total <= 0) return null;
  return {
    promptTokens: Number.isFinite(prompt) ? prompt : 0,
    completionTokens: Number.isFinite(completion) ? completion : 0,
    totalTokens: total,
  };
}

async function postJson(
  url: string,
  apiKey: string,
  body: unknown,
  timeoutMs: number,
): Promise<Response> {
  let lastConnectionError: unknown = null;

  for (let attempt = 0; attempt <= CONNECTION_RETRY_LIMIT; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      // A timeout is not retried: the upstream may still be generating, and a
      // second attempt would double the cost of an already slow request.
      if (error instanceof Error && error.name === "AbortError") {
        throw new ProviderError(
          "openai-compatible",
          `Request timed out after ${timeoutMs}ms.`,
        );
      }
      lastConnectionError = error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new ProviderError(
    "openai-compatible",
    lastConnectionError instanceof Error
      ? `Connection failed: ${lastConnectionError.message}`
      : "Connection failed.",
  );
}

/**
 * Whether the endpoint enforces `response_format: { type: "json_schema" }`.
 *
 * Defaults to false so an unverified endpoint takes the JSON-mode path, which
 * works everywhere; validation and the single repair retry catch what the
 * provider does not enforce. Set OPENAI_SUPPORTS_JSON_SCHEMA=true once the
 * endpoint is confirmed to honour it — the stricter path saves a repair round
 * trip. Probe with:
 *
 *   curl "$OPENAI_BASE_URL/chat/completions" -H "Authorization: Bearer $KEY" \
 *     -d '{"model":"...","messages":[...],
 *          "response_format":{"type":"json_schema","json_schema":{...}}}'
 */
function readJsonSchemaSupport(): boolean {
  return process.env.OPENAI_SUPPORTS_JSON_SCHEMA === "true";
}

export function createOpenAICompatibleLLMProvider(): LLMProvider {
  const supportsJsonSchema = readJsonSchemaSupport();

  return {
    id: "openai-compatible",
    supportsJsonSchema,

    async createChatCompletion(
      request: ChatCompletionRequest,
    ): Promise<ChatCompletionResult> {
      const baseUrl = normalizeBaseUrl(readEnv("OPENAI_BASE_URL"));
      const apiKey = readEnv("OPENAI_API_KEY");
      const model = readEnv("OPENAI_MODEL");

      const body: Record<string, unknown> = {
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.8,
        max_tokens: request.maxTokens ?? 4000,
      };

      if (request.jsonSchema) {
        body.response_format = supportsJsonSchema
          ? {
              type: "json_schema",
              json_schema: {
                name: request.jsonSchema.name,
                strict: true,
                schema: request.jsonSchema.schema,
              },
            }
          : { type: "json_object" };
      }

      const startedAt = Date.now();
      const response = await postJson(
        `${baseUrl}/chat/completions`,
        apiKey,
        body,
        CHAT_TIMEOUT_MS,
      );
      const durationMs = Date.now() - startedAt;

      if (!response.ok) {
        const detail = (await response.text()).slice(0, 400);
        throw new ProviderError(
          "openai-compatible",
          `Chat completion failed (${response.status}): ${detail}`,
          response.status,
        );
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new ProviderError(
          "openai-compatible",
          "Chat completion returned a non-JSON body.",
          response.status,
        );
      }

      const data = payload as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: unknown;
      };
      const content = data.choices?.[0]?.message?.content;

      if (typeof content !== "string" || content.trim().length === 0) {
        throw new ProviderError(
          "openai-compatible",
          "Chat completion returned no content.",
          response.status,
        );
      }

      const usage = parseUsage(data.usage);
      logger.info("Chat completion succeeded", {
        model,
        durationMs,
        jsonMode: request.jsonSchema
          ? supportsJsonSchema
            ? "json_schema"
            : "json_object"
          : "none",
        promptTokens: usage?.promptTokens ?? null,
        completionTokens: usage?.completionTokens ?? null,
        totalTokens: usage?.totalTokens ?? null,
      });

      return { content, usage };
    },
  };
}

export function createOpenAICompatibleImageProvider(): ImageProvider {
  return {
    id: "openai-compatible-image",

    async generateImage(request: ImageGenerationRequest): Promise<string> {
      const url = readEnv("IMAGE_API_URL");
      const apiKey = readEnv("IMAGE_API_KEY");
      const model = process.env.IMAGE_MODEL?.trim() || "Qwen/Qwen-Image";

      const startedAt = Date.now();
      const response = await postJson(
        url,
        apiKey,
        {
          model,
          prompt: request.prompt,
          ...(request.negativePrompt
            ? { negative_prompt: request.negativePrompt }
            : {}),
          image_size: request.size ?? "1024x1024",
          batch_size: 1,
          num_inference_steps: 20,
          guidance_scale: 7.5,
        },
        IMAGE_TIMEOUT_MS,
      );
      const durationMs = Date.now() - startedAt;

      if (!response.ok) {
        const detail = (await response.text()).slice(0, 400);
        throw new ProviderError(
          "openai-compatible-image",
          `Image generation failed (${response.status}): ${detail}`,
          response.status,
        );
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new ProviderError(
          "openai-compatible-image",
          "Image generation returned a non-JSON body.",
          response.status,
        );
      }

      const data = payload as {
        images?: Array<{ url?: string }>;
        data?: Array<{ url?: string }>;
      };
      const imageUrl = data.images?.[0]?.url ?? data.data?.[0]?.url;

      if (typeof imageUrl !== "string" || imageUrl.length === 0) {
        throw new ProviderError(
          "openai-compatible-image",
          "Image generation returned no image URL.",
          response.status,
        );
      }

      logger.info("Image generation succeeded", { model, durationMs });
      return imageUrl;
    },
  };
}

let cachedLLMProvider: LLMProvider | null = null;
let cachedImageProvider: ImageProvider | null = null;

export function getLLMProvider(): LLMProvider {
  cachedLLMProvider ??= createOpenAICompatibleLLMProvider();
  return cachedLLMProvider;
}

export function getImageProvider(): ImageProvider {
  cachedImageProvider ??= createOpenAICompatibleImageProvider();
  return cachedImageProvider;
}
