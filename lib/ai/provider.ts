import "server-only";

/**
 * OpenAI-compatible chat and image endpoints.
 *
 * HTTP error responses are never retried: a 4xx fails the same way twice, and a
 * 5xx from an LLM usually means the request was expensive. Only a dropped
 * connection gets one more attempt. Timeouts are not retried either, since the
 * upstream may still be generating and a retry would double the cost.
 */

// DeepSeek-V3.2 writes about 16 tokens a second; a bilingual recipe is ~1,500.
const CHAT_TIMEOUT_MS = 150_000;
const IMAGE_TIMEOUT_MS = 60_000;

export class ProviderError extends Error {
  constructor(message: string, readonly status: number | null = null) {
    super(message);
    this.name = "ProviderError";
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  jsonSchema?: { name: string; schema: Record<string, unknown> };
}

/** The seam the generator depends on, so tests can drive it without a network. */
export type ChatFn = (request: ChatRequest) => Promise<string>;

function env(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new ProviderError(`${name} is not configured.`);
  return value;
}

async function postJson(url: string, apiKey: string, body: unknown, timeoutMs: number) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new ProviderError(`Request timed out after ${timeoutMs}ms.`);
      }
      lastError = error;
    }
  }

  throw new ProviderError(
    `Connection failed: ${lastError instanceof Error ? lastError.message : "unknown"}`,
  );
}

async function readJson(response: Response, what: string): Promise<unknown> {
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 400);
    throw new ProviderError(`${what} failed (${response.status}): ${detail}`, response.status);
  }
  try {
    return await response.json();
  } catch {
    throw new ProviderError(`${what} returned a non-JSON body.`, response.status);
  }
}

/**
 * Chat completion. Endpoints that enforce `json_schema` are opted in with
 * OPENAI_SUPPORTS_JSON_SCHEMA=true; everything else gets `json_object`, and the
 * caller validates either way. OPENAI_DISABLE_THINKING=true sends
 * `enable_thinking: false` for hybrid models (Qwen3 on SiliconFlow) that would
 * otherwise reason for a minute before answering; other endpoints may reject it.
 */
export const chat: ChatFn = async ({ messages, jsonSchema }) => {
  const baseUrl = env("OPENAI_BASE_URL").replace(/\/+$/, "");
  const strict = process.env.OPENAI_SUPPORTS_JSON_SCHEMA === "true";

  const response = await postJson(
    `${baseUrl}/chat/completions`,
    env("OPENAI_API_KEY"),
    {
      model: env("OPENAI_MODEL"),
      messages,
      temperature: 0.8,
      max_tokens: 4000,
      ...(process.env.OPENAI_DISABLE_THINKING === "true" && { enable_thinking: false }),
      ...(jsonSchema && {
        response_format: strict
          ? { type: "json_schema", json_schema: { ...jsonSchema, strict: true } }
          : { type: "json_object" },
      }),
    },
    CHAT_TIMEOUT_MS,
  );

  const data = (await readJson(response, "Chat completion")) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) throw new ProviderError("Chat completion returned no content.");
  return content;
};

/** Returns the provider's temporary image URL. Callers must store their own copy. */
export async function generateImage(prompt: string): Promise<string> {
  const response = await postJson(
    env("IMAGE_API_URL"),
    env("IMAGE_API_KEY"),
    {
      model: process.env.IMAGE_MODEL?.trim() || "Qwen/Qwen-Image",
      prompt,
      negative_prompt: "low quality, blurry, distorted, text, watermark",
      image_size: "1024x1024",
      batch_size: 1,
      num_inference_steps: 20,
      guidance_scale: 7.5,
    },
    IMAGE_TIMEOUT_MS,
  );

  const data = (await readJson(response, "Image generation")) as {
    images?: { url?: string }[];
    data?: { url?: string }[];
  };
  const url = data.images?.[0]?.url ?? data.data?.[0]?.url;
  if (!url) throw new ProviderError("Image generation returned no image URL.");
  return url;
}
