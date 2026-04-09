import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("docker builder stage copies prisma before pnpm install when postinstall generates prisma client", async () => {
  const [dockerfile, packageJsonRaw] = await Promise.all([
    readFile(new URL("../Dockerfile", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  const packageJson = JSON.parse(packageJsonRaw) as {
    scripts?: Record<string, string>;
  };
  const postinstallScript = packageJson.scripts?.postinstall ?? "";

  assert.match(
    postinstallScript,
    /prisma generate/,
    "This guard matters only when postinstall runs prisma generate.",
  );

  const builderStage = dockerfile
    .split("# 生产阶段")[0]
    .split("# 构建阶段")[1];

  assert.ok(builderStage, "Dockerfile should include a builder stage.");

  const copyPrismaIndex = builderStage.indexOf("COPY prisma ./prisma");
  const installIndex = builderStage.indexOf(
    "RUN pnpm install --frozen-lockfile --shamefully-hoist",
  );

  assert.notEqual(
    copyPrismaIndex,
    -1,
    "Builder stage should copy prisma directory before installing dependencies.",
  );
  assert.notEqual(
    installIndex,
    -1,
    "Builder stage should install dependencies with pnpm.",
  );
  assert.ok(
    copyPrismaIndex < installIndex,
    "Prisma schema must be available before pnpm install triggers postinstall.",
  );
});
