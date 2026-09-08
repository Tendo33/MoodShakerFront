import test from "node:test";
import assert from "node:assert/strict";
import {
  getAllowedImageHosts,
  isAllowedRemoteImageUrl,
} from "../../lib/storage/image-hosts";

function withEnv(
  vars: Record<string, string | undefined>,
  run: () => void,
): void {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(vars)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("allows the provider's image delivery host, not just its API host", () => {
  // Regression guard: the allowlist was originally derived from IMAGE_API_URL
  // alone, but SiliconFlow answers on api.siliconflow.cn and serves images from
  // its object-storage CDN, so every real download was rejected.
  assert.equal(
    isAllowedRemoteImageUrl(
      "https://bizyair-prod.oss-cn-shanghai.aliyuncs.com/generated/abc.png",
    ),
    true,
  );
});

test("rejects an unknown host", () => {
  assert.equal(isAllowedRemoteImageUrl("https://evil.example/x.png"), false);
});

test("rejects a look-alike host suffix", () => {
  // A suffix match would accept this; the check must be an exact hostname.
  assert.equal(
    isAllowedRemoteImageUrl(
      "https://bizyair-prod.oss-cn-shanghai.aliyuncs.com.evil.example/x.png",
    ),
    false,
  );
});

test("rejects plain http even for an allowed host", () => {
  assert.equal(
    isAllowedRemoteImageUrl(
      "http://bizyair-prod.oss-cn-shanghai.aliyuncs.com/x.png",
    ),
    false,
  );
});

test("rejects non-http schemes used to reach local resources", () => {
  for (const url of [
    "file:///etc/passwd",
    "ftp://bizyair-prod.oss-cn-shanghai.aliyuncs.com/x.png",
    "data:image/png;base64,AAAA",
  ]) {
    assert.equal(isAllowedRemoteImageUrl(url), false, url);
  }
});

test("rejects a malformed url", () => {
  assert.equal(isAllowedRemoteImageUrl("not-a-url"), false);
});

test("honours additional hosts from IMAGE_FETCH_HOST_ALLOWLIST", () => {
  withEnv({ IMAGE_FETCH_HOST_ALLOWLIST: "cdn.example.com, other.example.com" }, () => {
    assert.equal(isAllowedRemoteImageUrl("https://cdn.example.com/a.png"), true);
    assert.equal(
      isAllowedRemoteImageUrl("https://other.example.com/a.png"),
      true,
    );
    assert.equal(
      isAllowedRemoteImageUrl("https://unlisted.example.com/a.png"),
      false,
    );
  });
});

test("includes the IMAGE_API_URL host", () => {
  withEnv({ IMAGE_API_URL: "https://api.example.com/v1/images" }, () => {
    assert.equal(getAllowedImageHosts().has("api.example.com"), true);
  });
});

test("tolerates a malformed IMAGE_API_URL", () => {
  withEnv({ IMAGE_API_URL: "definitely-not-a-url" }, () => {
    // Must not throw, and the built-in delivery hosts stay available.
    const hosts = getAllowedImageHosts();
    assert.equal(hosts.has("bizyair-prod.oss-cn-shanghai.aliyuncs.com"), true);
  });
});
