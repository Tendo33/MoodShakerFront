/**
 * Interfaces and the provider error type. Deliberately not `server-only`: it
 * holds no credentials, and marking it would make every consumer — including
 * unit tests — server-bound for no security benefit. The module that reads API
 * keys (`providers/openai-compatible.ts`) carries the marker instead.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /**
   * Requests structured output. Providers that advertise `supportsJsonSchema`
   * enforce the schema; the rest fall back to JSON mode, and validation happens
   * downstream either way.
   */
  jsonSchema?: {
    name: string;
    schema: Record<string, unknown>;
  };
}

export interface ChatCompletionResult {
  content: string;
  usage: TokenUsage | null;
}

export interface LLMProvider {
  readonly id: string;
  /**
   * Whether `response_format: { type: "json_schema" }` is honoured. When false
   * the provider is asked for `json_object` instead and the prompt carries the
   * field contract.
   */
  readonly supportsJsonSchema: boolean;
  createChatCompletion(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResult>;
}

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  size?: string;
}

export interface ImageProvider {
  readonly id: string;
  /** Returns the provider's temporary image URL; callers must persist a copy. */
  generateImage(request: ImageGenerationRequest): Promise<string>;
}

/**
 * Signals that the provider itself failed, as opposed to producing output we
 * then rejected. Route handlers map this to a 502 so an upstream outage is not
 * reported as a bug in our own pipeline.
 */
export class ProviderError extends Error {
  readonly status: number | null;
  readonly providerId: string;

  constructor(providerId: string, message: string, status: number | null = null) {
    super(message);
    this.name = "ProviderError";
    this.providerId = providerId;
    this.status = status;
  }
}
