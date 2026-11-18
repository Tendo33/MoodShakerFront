import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import sharp from "sharp";
import { chat, generateImage, ProviderError } from "@/lib/ai/provider";
import { StorageError, storeImage } from "@/lib/storage";

const IMAGE_ENV: Record<string, string | undefined> = {
  IMAGE_PROVIDER: undefined,
  IMAGE_API_URL: "https://images.example.test/v1/images/generations",
  IMAGE_API_KEY: "test-image-key",
  IMAGE_MODEL: "Qwen/Qwen-Image",
  IMAGE_FETCH_HOST_ALLOWLIST: undefined,
};

const CHAT_ENV: Record<string, string | undefined> = {
  OPENAI_BASE_URL: "https://chat.example.test/v1",
  OPENAI_API_KEY: "test-chat-key",
  OPENAI_MODEL: "test-model",
  OPENAI_SUPPORTS_JSON_SCHEMA: undefined,
  OPENAI_DISABLE_THINKING: undefined,
};

const R2_OFF: Record<string, string | undefined> = {
  R2_ACCOUNT_ID: undefined,
  R2_ACCESS_KEY_ID: undefined,
  R2_SECRET_ACCESS_KEY: undefined,
  R2_BUCKET: undefined,
  R2_PUBLIC_BASE_URL: undefined,
};

interface Call {
  url: string;
  init?: RequestInit;
}

const originalFetch = globalThis.fetch;
const envKeys = [...Object.keys(IMAGE_ENV), ...Object.keys(CHAT_ENV), ...Object.keys(R2_OFF)];
const originalEnv = new Map(envKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of originalEnv) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function useEnv(values: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function useFetch(handler: (call: Call, index: number) => Response | Promise<Response>) {
  const calls: Call[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const call = { url, init };
    calls.push(call);
    return handler(call, calls.length - 1);
  }) as typeof fetch;
  return calls;
}

function jsonResponse(status: number, body: unknown, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function timeoutError(): Error {
  const error = new Error("The operation was aborted due to timeout");
  error.name = "TimeoutError";
  return error;
}

function sentBody(call: Call): Record<string, unknown> {
  return JSON.parse(String(call.init?.body)) as Record<string, unknown>;
}

function authorization(call: Call): string | null {
  return new Headers(call.init?.headers).get("authorization");
}

async function tinyPng(): Promise<Buffer> {
  return sharp({ create: { width: 32, height: 32, channels: 3, background: "#d0e8ff" } })
    .png()
    .toBuffer();
}

const siliconflowBody = {
  model: "Qwen/Qwen-Image",
  prompt: "a clear gin drink",
  negative_prompt: "low quality, blurry, distorted, text, watermark",
  image_size: "1024x1024",
  batch_size: 1,
  num_inference_steps: 20,
  guidance_scale: 7.5,
};

describe("generateImage", () => {
  it("keeps the SiliconFlow request when IMAGE_PROVIDER is unset", async () => {
    useEnv(IMAGE_ENV);
    const calls = useFetch(() => jsonResponse(200, { images: [{ url: "https://s3.siliconflow.cn/a.png" }] }));

    const url = await generateImage("a clear gin drink");

    assert.equal(url, "https://s3.siliconflow.cn/a.png");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://images.example.test/v1/images/generations");
    assert.equal(authorization(calls[0]), "Bearer test-image-key");
    assert.deepEqual(sentBody(calls[0]), siliconflowBody);
  });

  it("accepts SiliconFlow's data[0].url shape", async () => {
    useEnv({ ...IMAGE_ENV, IMAGE_PROVIDER: "siliconflow" });
    useFetch(() => jsonResponse(200, { data: [{ url: "https://sc-maas.oss-cn-shanghai.aliyuncs.com/a.png" }] }));

    assert.equal(
      await generateImage("a clear gin drink"),
      "https://sc-maas.oss-cn-shanghai.aliyuncs.com/a.png",
    );
  });

  it("sends an OpenAI Images body and returns a URL unchanged", async () => {
    useEnv({ ...IMAGE_ENV, IMAGE_PROVIDER: "openai", IMAGE_MODEL: "gpt-image-2.6-sunburst" });
    const calls = useFetch(() =>
      jsonResponse(200, { data: [{ url: "  https://images.example.test/out.png  " }] }),
    );

    const url = await generateImage("a clear gin drink");

    assert.equal(url, "https://images.example.test/out.png");
    assert.deepEqual(sentBody(calls[0]), {
      model: "gpt-image-2.6-sunburst",
      prompt: "a clear gin drink",
      size: "1024x1024",
      quality: "high",
      n: 1,
    });
  });

  it("uses the c2a model name when IMAGE_MODEL is unset in openai mode", async () => {
    useEnv({ ...IMAGE_ENV, IMAGE_PROVIDER: "OpenAI", IMAGE_MODEL: undefined });
    const calls = useFetch(() => jsonResponse(200, { data: [{ url: "https://images.example.test/out.png" }] }));

    await generateImage("a clear gin drink");

    assert.equal(sentBody(calls[0]).model, "gpt-image-2.6-sunburst");
  });

  it("keeps Qwen/Qwen-Image as the SiliconFlow default model", async () => {
    useEnv({ ...IMAGE_ENV, IMAGE_MODEL: "  " });
    const calls = useFetch(() => jsonResponse(200, { images: [{ url: "https://s3.siliconflow.cn/a.png" }] }));

    await generateImage("a clear gin drink");

    assert.equal(sentBody(calls[0]).model, "Qwen/Qwen-Image");
  });

  it("turns b64_json into a data URL the R2 path and fetch can both read", async () => {
    const png = await tinyPng();
    const wrapped = png.toString("base64").replace(/(.{12})/g, "$1\n");
    useEnv({ ...IMAGE_ENV, ...R2_OFF, IMAGE_PROVIDER: "openai", IMAGE_MODEL: "gpt-image-2.6-sunburst" });
    useFetch(() => jsonResponse(200, { data: [{ b64_json: wrapped, url: "https://evil.example/ignored.png" }] }));

    const source = await generateImage("a clear gin drink");

    assert.match(source, /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/);
    const fetched = Buffer.from(await (await originalFetch(source)).arrayBuffer());
    assert.ok(fetched.equals(png));

    globalThis.fetch = (async () => {
      throw new Error("data URL must not be downloaded");
    }) as typeof fetch;
    await assert.rejects(storeImage("drink-1", source), (error: unknown) => {
      assert.ok(error instanceof StorageError);
      assert.equal(error.stage, "config");
      assert.match(error.message, /R2 is not configured/);
      return true;
    });
  });

  it("rejects an OpenAI payload that is not an image", async () => {
    useEnv({ ...IMAGE_ENV, IMAGE_PROVIDER: "openai" });
    const calls = useFetch(() => jsonResponse(200, { images: [{ url: "https://images.example.test/nope.png" }] }));

    await assert.rejects(generateImage("a clear gin drink"), (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.message, "Image generation returned no image.");
      return true;
    });
    assert.equal(calls.length, 1);
  });

  it("rejects invalid or oversized base64 without storing it", async () => {
    useEnv({ ...IMAGE_ENV, IMAGE_PROVIDER: "openai" });
    useFetch(() => jsonResponse(200, { data: [{ b64_json: "not base64!!!" }] }));
    await assert.rejects(generateImage("a clear gin drink"), /invalid base64/);

    useFetch(() => jsonResponse(200, { data: [{ b64_json: Buffer.alloc(10 * 1024 * 1024 + 1, 7).toString("base64") }] }));
    await assert.rejects(generateImage("a clear gin drink"), /unusable image/);
  });

  it("retries openai 429 and 5xx, and does not retry other 4xx or timeouts", async () => {
    useEnv({ ...IMAGE_ENV, IMAGE_PROVIDER: "openai", IMAGE_MODEL: "gpt-image-2.6-sunburst" });

    const recovered = useFetch((_call, index) =>
      index === 0
        ? jsonResponse(429, { error: "slow down" }, { "retry-after": "0" })
        : jsonResponse(200, { data: [{ url: "https://images.example.test/out.png" }] }),
    );
    assert.equal(await generateImage("a clear gin drink"), "https://images.example.test/out.png");
    assert.equal(recovered.length, 2);
    assert.deepEqual(sentBody(recovered[1]), sentBody(recovered[0]));

    const serverErrors = useFetch(() => jsonResponse(503, { error: "unavailable" }, { "retry-after": "0" }));
    await assert.rejects(generateImage("a clear gin drink"), (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.status, 503);
      return true;
    });
    assert.equal(serverErrors.length, 3);

    const badRequest = useFetch(() => jsonResponse(400, { error: "bad prompt" }));
    await assert.rejects(generateImage("a clear gin drink"), (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.status, 400);
      return true;
    });
    assert.equal(badRequest.length, 1);

    const timedOut = useFetch(() => {
      throw timeoutError();
    });
    await assert.rejects(generateImage("a clear gin drink"), /timed out after 120000ms/);
    assert.equal(timedOut.length, 1);

    const dropped = useFetch(() => {
      throw new TypeError("socket reset");
    });
    await assert.rejects(generateImage("a clear gin drink"), /Connection failed: socket reset/);
    assert.equal(dropped.length, 3);
  });

  it("does not retry SiliconFlow HTTP errors, and retries one dropped connection", async () => {
    useEnv(IMAGE_ENV);

    const limited = useFetch(() => jsonResponse(429, { error: "slow down" }));
    await assert.rejects(generateImage("a clear gin drink"), (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.status, 429);
      return true;
    });
    assert.equal(limited.length, 1);

    const failed = useFetch(() => jsonResponse(500, { error: "boom" }));
    await assert.rejects(generateImage("a clear gin drink"), (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.status, 500);
      return true;
    });
    assert.equal(failed.length, 1);

    const timedOut = useFetch(() => {
      throw timeoutError();
    });
    await assert.rejects(generateImage("a clear gin drink"), /timed out after 60000ms/);
    assert.equal(timedOut.length, 1);

    let attempts = 0;
    const calls = useFetch(() => {
      attempts += 1;
      if (attempts === 1) throw new TypeError("socket reset");
      return jsonResponse(200, { images: [{ url: "https://s3.siliconflow.cn/a.png" }] });
    });
    assert.equal(await generateImage("a clear gin drink"), "https://s3.siliconflow.cn/a.png");
    assert.equal(calls.length, 2);
  });

  it("rejects an unknown provider before calling the network", async () => {
    useEnv({ ...IMAGE_ENV, IMAGE_PROVIDER: "azure", IMAGE_API_URL: undefined, IMAGE_API_KEY: undefined });
    const calls = useFetch(() => {
      throw new Error("fetch should not run");
    });

    await assert.rejects(generateImage("a clear gin drink"), /IMAGE_PROVIDER must be siliconflow or openai/);
    assert.equal(calls.length, 0);
  });
});

describe("chat retry policy", () => {
  it("still fails a 5xx once and retries one dropped connection", async () => {
    useEnv(CHAT_ENV);
    const failed = useFetch(() => jsonResponse(500, { error: "boom" }));
    await assert.rejects(
      chat({ messages: [{ role: "user", content: "pour" }] }),
      (error: unknown) => {
        assert.ok(error instanceof ProviderError);
        assert.equal(error.status, 500);
        return true;
      },
    );
    assert.equal(failed.length, 1);
    assert.equal(failed[0].url, "https://chat.example.test/v1/chat/completions");
    assert.equal(authorization(failed[0]), "Bearer test-chat-key");

    let attempts = 0;
    const calls = useFetch(() => {
      attempts += 1;
      if (attempts === 1) throw new TypeError("socket reset");
      return jsonResponse(200, { choices: [{ message: { content: "ok" } }] });
    });
    assert.equal(await chat({ messages: [{ role: "user", content: "pour" }] }), "ok");
    assert.equal(calls.length, 2);
  });
});

describe("storeImage sources", () => {
  it("downloads an allowlisted host and refuses anything else", async () => {
    const png = await tinyPng();
    useEnv({
      ...R2_OFF,
      IMAGE_API_URL: "https://images.example.test/v1/images/generations",
      IMAGE_FETCH_HOST_ALLOWLIST: "cdn.example.test",
    });

    const allowed = useFetch(() => new Response(new Uint8Array(png)));
    await assert.rejects(storeImage("drink-1", "https://images.example.test/out.png"), (error: unknown) => {
      assert.ok(error instanceof StorageError);
      assert.equal(error.stage, "config");
      return true;
    });
    assert.equal(allowed.length, 1);
    assert.equal(allowed[0].url, "https://images.example.test/out.png");

    const listed = useFetch(() => new Response(new Uint8Array(png)));
    await assert.rejects(storeImage("drink-1", "https://cdn.example.test/out.png"), (error: unknown) => {
      assert.ok(error instanceof StorageError);
      assert.equal(error.stage, "config");
      return true;
    });
    assert.equal(listed.length, 1);

    const builtin = useFetch(() => new Response(new Uint8Array(png)));
    await assert.rejects(storeImage("drink-1", "https://s3.siliconflow.cn/bucket/a.png"), (error: unknown) => {
      assert.ok(error instanceof StorageError);
      assert.equal(error.stage, "config");
      return true;
    });
    assert.equal(builtin.length, 1);

    const blocked = useFetch(() => {
      throw new Error("blocked host must not be fetched");
    });
    await assert.rejects(storeImage("drink-1", "https://evil.example/a.png"), (error: unknown) => {
      assert.ok(error instanceof StorageError);
      assert.equal(error.stage, "fetch");
      assert.match(error.message, /Image host not allowed/);
      return true;
    });
    await assert.rejects(storeImage("drink-1", "http://images.example.test/a.png"), /Image host not allowed/);
    assert.equal(blocked.length, 0);
  });

  it("rejects a data URL that is not a base64 bitmap, including one that is too large", async () => {
    useEnv(R2_OFF);
    const calls = useFetch(() => {
      throw new Error("data URL must not be downloaded");
    });

    await assert.rejects(storeImage("drink-1", "data:image/svg+xml;base64,aaaa"), (error: unknown) => {
      assert.ok(error instanceof StorageError);
      assert.equal(error.stage, "fetch");
      assert.equal(error.message, "Image data URL is not a supported base64 image.");
      return true;
    });
    await assert.rejects(
      storeImage("drink-1", `data:image/png;base64,${Buffer.alloc(10 * 1024 * 1024 + 1, 3).toString("base64")}`),
      /Image too large/,
    );
    assert.equal(calls.length, 0);
  });
});
