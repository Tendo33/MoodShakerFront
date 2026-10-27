import test from "node:test";
import assert from "node:assert/strict";
import { serializeJsonLd } from "../../../lib/seo/json-ld";

test("serializeJsonLd cannot break out of the script element", () => {
  const value = { name: "</script><img src=x onerror=alert(1)>&" };
  const out = serializeJsonLd(value);
  assert.ok(!out.includes("<"));
  assert.ok(!out.includes(">"));
  assert.deepEqual(JSON.parse(out), value);
});
