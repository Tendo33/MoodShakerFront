import "server-only";

/**
 * OpenAI-compatible chat and image endpoints.
 *
 * Chat, and the SiliconFlow image API, never retry an HTTP error: a 4xx fails
 * the same way twice, and a 5xx from an LLM usually means the request was
 * expensive. Only a dropped connection gets one more attempt. Timeouts are not
 * retried either, since the upstream may still be generating and a retry would
 * double the cost.
 *
 * IMAGE_PROVIDER=openai (c2a and other OpenAI Images gateways) is the
 * exception. Those calls often run for most of a minute and occasionally come
 * back 429 or 5xx, so they wait longer and retry those two statuses.
 */

// DeepSeek-V3.2 writes about 16 tokens a second; a bilingual recipe is ~1,500.
const CHAT_TIMEOUT_MS = 150_000;
/** SiliconFlow Qwen-Image usually returns well inside a minute. */
const SILICONFLOW_IMAGE_TIMEOUT_MS = 60_000;
/** c2a / gpt-image commonly takes 20–60s to answer. */
const OPENAI_IMAGE_TIMEOUT_MS = 120_000;
/**
 * What a diffusion model adds to a product shot unasked. Each of these shows
 * once the picture is laid on a coloured field (see DESIGN.md, Pictures).
 */
const SILICONFLOW_NEGATIVE_PROMPT =
  "grey background, gray background, gradient background, vignette, table, surface, floor, horizon line, " +
  "cast shadow, drop shadow, reflection, low quality, blurry, distorted, text, watermark";
/** One try plus two retries. A timeout still does not consume a retry. */
const OPENAI_IMAGE_ATTEMPTS = 3;
/** Same ceiling as lib/storage.ts. A larger payload is rejected before it is stored. */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_RETRY_DELAY_MS = 10_000;

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

interface PostPolicy {
  maxAttempts: number;
  /** Retry 429 and 5xx. Connection drops are retried either way. Timeouts are not. */
  retryHttp: boolean;
}

const NO_HTTP_RETRY: PostPolicy = { maxAttempts: 2, retryHttp: false };

function retryDelayMs(response: Response, attempt: number): number {
  const header = response.headers.get("retry-after")?.trim();
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS);
    const when = Date.parse(header);
    if (!Number.isNaN(when)) return Math.min(Math.max(when - Date.now(), 0), MAX_RETRY_DELAY_MS);
  }
  return Math.min(1_000 * 2 ** attempt, 8_000);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postJson(
  url: string,
  apiKey: string,
  body: unknown,
  timeoutMs: number,
  policy: PostPolicy = NO_HTTP_RETRY,
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < policy.maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const retryable = response.status === 429 || response.status >= 500;
      if (policy.retryHttp && retryable && attempt < policy.maxAttempts - 1) {
        await response.body?.cancel().catch(() => undefined);
        await delay(retryDelayMs(response, attempt));
        continue;
      }
      return response;
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

type ImageProviderName = "siliconflow" | "openai";

function imageProvider(): ImageProviderName {
  const name = process.env.IMAGE_PROVIDER?.trim().toLowerCase() || "siliconflow";
  if (name === "siliconflow" || name === "openai") return name;
  throw new ProviderError("IMAGE_PROVIDER must be siliconflow or openai.");
}

function imageModel(provider: ImageProviderName): string {
  const configured = process.env.IMAGE_MODEL?.trim();
  if (configured) return configured;
  return provider === "openai" ? "gpt-image-2.6-sunburst" : "Qwen/Qwen-Image";
}

/** OpenAI Images `b64_json`, as a data URL `storeImage` already knows how to persist. */
function imageDataUrl(b64: string): string {
  const cleaned = b64.replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned) || cleaned.length % 4 === 1) {
    throw new ProviderError("Image generation returned invalid base64.");
  }
  const padded = cleaned.length % 4 === 0 ? cleaned : `${cleaned}${"=".repeat(4 - (cleaned.length % 4))}`;
  const padding = padded.endsWith("==") ? 2 : padded.endsWith("=") ? 1 : 0;
  const bytes = (padded.length / 4) * 3 - padding;
  if (bytes <= 0 || bytes > MAX_IMAGE_BYTES) {
    throw new ProviderError("Image generation returned an unusable image.");
  }
  return `data:image/png;base64,${padded}`;
}

/**
 * A URL the caller stores itself.
 *
 * SiliconFlow, and an OpenAI response that already has `url`, return the
 * provider's temporary HTTPS address. `b64_json` comes back as a `data:` URL
 * so `storeImage` can run the same WebP → R2 path it uses for that address.
 * Node's fetch reads the data URL too (`pnpm seeds:build`).
 */
export async function generateImage(prompt: string): Promise<string> {
  const provider = imageProvider();
  const openai = provider === "openai";
  const response = await postJson(
    env("IMAGE_API_URL"),
    env("IMAGE_API_KEY"),
    openai
      ? {
          model: imageModel(provider),
          prompt,
          size: "1024x1024",
          quality: "high",
          n: 1,
        }
      : {
          model: imageModel(provider),
          prompt,
          negative_prompt: SILICONFLOW_NEGATIVE_PROMPT,
          image_size: "1024x1024",
          batch_size: 1,
          num_inference_steps: 20,
          guidance_scale: 7.5,
        },
    openai ? OPENAI_IMAGE_TIMEOUT_MS : SILICONFLOW_IMAGE_TIMEOUT_MS,
    openai ? { maxAttempts: OPENAI_IMAGE_ATTEMPTS, retryHttp: true } : NO_HTTP_RETRY,
  );

  if (openai) {
    const data = (await readJson(response, "Image generation")) as {
      data?: { url?: string; b64_json?: string }[];
    };
    const image = data.data?.[0];
    if (typeof image?.b64_json === "string" && image.b64_json.trim()) return imageDataUrl(image.b64_json);
    if (typeof image?.url === "string" && image.url.trim()) return image.url.trim();
    throw new ProviderError("Image generation returned no image.");
  }

  const data = (await readJson(response, "Image generation")) as {
    images?: { url?: string }[];
    data?: { url?: string }[];
  };
  const url = data.images?.[0]?.url ?? data.data?.[0]?.url;
  if (!url) throw new ProviderError("Image generation returned no image URL.");
  return url;
}
