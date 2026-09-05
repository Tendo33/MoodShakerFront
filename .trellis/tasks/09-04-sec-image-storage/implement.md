# 执行计划 — P0 安全与图片存储

分支：`refactor/sec-image-storage`
设计依据：本目录 [design.md](./design.md)

## 步骤

### 阶段 A — 存储层落地（无行为变更）

- [x] A1. `package.json`：加 `@aws-sdk/client-s3`，把 `sharp` 提为必需依赖
- [x] A2. 新增 `lib/storage/object-store.ts` — 接口 + `getObjectStore()` 装配
- [x] A3. 新增 `lib/storage/providers/r2.ts` — R2 实现
- [x] A4. 新增 `lib/storage/image-pipeline.ts` — 下载（白名单 + 15s 超时 + 10MB 上限）
      → sharp 双尺寸 → 上传 → 返回 URL
- [x] A5. `.env.example` 补 6 个新变量；`docker-compose.yml` 透传
- [x] A6. 启动期自检：GET `_probe/cors-check.png` 验证连通性
      （仅 `NODE_ENV=production`）
- [x] ~~A7. 配置 R2 bucket 与 CORS 并实测~~ — **2026-09-04 已完成**
      bucket `moodshaker-images` + `img.moodshaker.de` + CORS 均已就绪并验证，
      含 `cacheBust` query 与缓存命中场景。见 design §3.3

**验证**：`pnpm build` 通过；`.env` 配好 R2 凭证后自检通过。此时线上行为未变。

> 前置条件：`.env` 中需有 `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`
> （Dashboard 生成，wrangler 建不了）。其余 R2_* 变量值见 design §3.3。

### 阶段 B — Prisma 扩展迁移

- [x] B1. `prisma/schema.prisma` 四个模型字段加 `imageUrl` / `thumbnailUrl`
- [x] B2. `pnpm prisma migrate dev --name add_image_urls` 生成迁移
- [x] B3. `lib/db` 层（`recommendation-sessions.ts` / `cocktail-data.ts`）
      select 加新列，映射函数实现 `imageUrl ?? image` 双读

**验证**：`pnpm db:init`；现有页面读旧 base64 仍正常渲染。

**回滚点 1** — 到此为止只加了列和双读，可安全 revert。

### 阶段 C — prompt 服务端化（安全修复主体）

- [x] C1. `api/image.ts` → `lib/ai/image-prompt.ts`，加 `import "server-only"`
- [x] C2. 删除顶层 `api/image.ts`；`Dockerfile` 的 `COPY /app/api ./api` 暂留
      （`api/openai.ts` 还在，批次 2 处理）
- [x] C3. `lib/request-validation.ts`：`validateImageRequest` 去掉 `prompt`
      与 `forceRefresh`，出现 `prompt` 键时显式返回 `INVALID_PAYLOAD`
- [x] C4. `app/api/image/route.ts` 重写：
      - 去掉本地的 sharp 动态加载、`imageUrlToBuffer`、`createOptimizedImageData`、
        `bufferToDataUrl`、`isMissingJsonColumnError`（移入 image-pipeline 或删除）
      - 服务端 `buildImagePrompt(session.cocktail)`
      - 走 image-pipeline，按 design §2.2 的失败语义返回
      - 写入 `imageUrl` / `thumbnailUrl`
- [x] C5. `lib/recommendation-sessions.ts`：`updateRecommendationSessionImage`
      改为 `updateRecommendationSessionImageUrls`
- [x] C6. `context/CocktailResultContext.tsx`：
      - 删 `generateImagePrompt` import 与两处调用
      - 两处 fetch body 改为 `{ recommendationId, editToken }`
      - 响应字段改 `imageUrl` / `thumbnailUrl`
      - 删 `MAX_PERSISTED_IMAGE_BYTES`、`IMAGE_PERSIST_DEBOUNCE_MS`、
        `estimateDataUrlBytes`、`imagePersistenceRef` 及体积/去抖分支
- [x] C7. `next.config.mjs`：`images.remotePatterns` 加 R2 公开域，
      移除写死的 `bizyair-prod.oss-cn-shanghai.aliyuncs.com`
- [ ] C8. **分享链路回归** — **阻塞**：图片 provider 余额不足（402），
      无法生成新图走完整链路。基础设施侧 CORS 已实测通过（design §3.3），
      回填产生的 R2 图片实测 200 + 正常 webp。待余额恢复后补这一项。

**验证**：
```bash
pnpm lint && pnpm test && pnpm build
grep -rn "generateImagePrompt" components context app   # 应无结果
```
浏览器实测生图链路；DevTools 确认请求体无 prompt、图片 src 是 R2 URL。
手工构造带 prompt 的请求应返回 400。

**回滚点 2** — 安全缺陷已关闭。即使后续阶段中止，此处也是有价值的合并点。

### 阶段 D — 存量数据回填

- [x] D1. 新增 `prisma/backfill-image-urls.ts`（分页 20、跳过已填、id 为 key、
      失败记录并继续）
- [x] D2. `package.json` 加 `prisma:backfill-image-urls` 脚本
- [x] D3. `prisma/backfill-thumbnails.ts` 标记废弃（注释说明，批次 4 删除）
- [x] D4. **在存量数据副本上**跑通；中途中断后重跑验证断点续跑与幂等

**验证**：副本库中所有 `image IS NOT NULL` 的行都有 `image_url`；
R2 中对象数量与预期一致，无重复。

### 阶段 E — 其余安全加固

- [x] E1. 新增 `lib/http/request-context.ts`：`getRequestId`、`getClientIp`
      （`TRUSTED_PROXY_HOPS`）、`assertSameOrigin`
- [x] E2. `app/api/cocktail/route.ts` 的 `getRequestIp` 替换为 `getClientIp`
- [x] E3. 三个 POST 路由加 Origin 校验
- [x] E4. `lib/rate-limit.ts` 加过期行概率性清理（fire-and-forget）
- [x] E5. `lib/api-response.ts` 的 error 包络加 `requestId`

> CSP nonce 化已移至批次 5，与语言判定收敛后的 `proxy.ts` 一起改。

**验证**：
- 伪造 `x-forwarded-for` 首跳，确认限流分桶不变
- 跨站 Origin 的 POST 返回 403
- `rate_limit_buckets` 过期行会被清理

### 阶段 F — 文档与收尾

- [x] F1. 更新 `README.md` / `README.zh.md` 的环境变量与部署章节
- [x] F2. 更新 `.trellis/spec/frontend/api-and-data.md`（`/api/image` 契约变更）
- [x] F3. 更新 `.trellis/spec/shared/project-overview.md`（新增 R2 依赖）
- [x] F4. 更新 `.trellis/spec/big-question/image-provider-failures.md`（失败语义变了）
- [x] F5. 单元测试：`getClientIp` / `isSameOrigin` 14 例，
      SSRF 白名单 9 例（`lib/storage/image-hosts.ts`）。
      image-pipeline 本体因 `server-only` 无法在 node:test 中直接导入，
      故把可测的纯逻辑抽到 `image-hosts.ts`；下载/转码/上传三段的
      失败语义测试留待批次 8（需要 provider mock 设施）
- [ ] F6. **Roll R2 API token**。当前 token 曾出现在对话记录中，
      链路验证完成后到 Dashboard 重新生成，新值直接写入 `.env`。
      Access Key ID = 新 token 的 `id`；Secret = token value 的 SHA-256

## 完整验证

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
pnpm db:init
```

浏览器：`/cn` 与 `/en` 各走 首页 → 问卷 → 推荐 → 生图 → 刷新图 → 分享。

## Review Gate

合并前人工确认：

1. 安全修复确实生效（带 prompt 的请求被拒，且该 prompt 未发往 provider）
2. 回填脚本在真实数据副本上跑通，且旧列**未被删除**
3. 失败语义正确：任一环节失败都不写库、不产生死链
4. 分享卡片实测导出带图 PNG（R2 CORS 生效）

## 回滚

| 阶段 | 回滚方式 |
| --- | --- |
| A–C | `git revert` 即可；新列留着无害 |
| D | 回填是幂等写入，revert 代码后新列数据保留，不影响双读 |
| E | 独立可 revert |

本批次**不含**不可逆操作。旧 base64 列完整保留到批次 4。
