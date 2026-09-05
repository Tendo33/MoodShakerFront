# P0 安全与图片存储

父任务：[09-04-moodshaker-restructure](../09-04-moodshaker-restructure/prd.md)
批次：1 / 8 — 与批次 2 `ai-pipeline`、批次 3 `i18n-foundation` 可并行

## Goal

关闭图片生成接口的开放代理缺陷，并把图片从 Postgres 的 base64 列迁移到 Cloudflare R2。

## Background

### 缺陷 1 — 开放的文生图代理

`context/CocktailResultContext.tsx:342` 与 `:439` 在浏览器调用
`generateImagePrompt()`（来自 `api/image.ts`），把完整 prompt 放进请求体
POST 给 `/api/image`。服务端 `app/api/image/route.ts:158` 从请求体取出
`prompt`，仅经 `validateImageRequest` 校验「是字符串、非空、≤1600 字符」，
随后原样传给 `generateImage(prompt, ...)` 打到图片 provider。

利用路径：走一次正常流程拿到 `recommendationId` + `editToken`（两者都在
localStorage，用户自己可见），此后即可以项目的 `IMAGE_API_KEY` 每分钟生成
3 张任意内容的图片。限流按 `image:${recommendationId}` 计，多开几个推荐即可放大。

### 缺陷 2 — base64 图片入库

`prisma/schema.prisma` 中四个 `@db.Text` 列存 `data:image/webp;base64,...`：
`Cocktail.image`、`Cocktail.thumbnail`、`RecommendationSession.image`、
`RecommendationSession.thumbnail`。1024px webp q80 约 150KB，base64 后约 200KB。

- `getCocktailById` 的 select 包含 `image`，每次详情查询拉 200KB
- `getGalleryCocktails` 的 select 包含 `thumbnail`，一页 24 条
- 客户端 `MAX_PERSISTED_IMAGE_BYTES = 320 * 1024`，往 localStorage 写 data URL

## Requirements

### R1.1 — prompt 服务端派生

- `POST /api/image` 请求体只接受 `{ recommendationId, editToken }`
- 收到 `prompt` 字段时按非法请求拒绝，不静默忽略
- prompt 由服务端从已持久化的 `cocktailPayload` 派生
- prompt 构造模块标记 `server-only`，客户端 import 时构建期报错

### R1.2 — 客户端不再接触 prompt

- `context/CocktailResultContext.tsx` 删除 `generateImagePrompt` 的 import 与调用
- 顶层 `api/image.ts` 迁至 `lib/ai/image-prompt.ts` 并加 `server-only`

### R2.1 — 图片写入 R2

- 新增 `lib/storage/object-store.ts`（S3 兼容接口）与 `providers/r2.ts`
- 图片管线：provider 生图 → 服务端下载 → sharp 转 webp 双尺寸 → 上传 R2 → 写库 URL
- 对象 key：`cocktails/{recommendationId}/{variant}.webp`，`variant ∈ {full, thumb}`
- `sharp` 从动态 require 的可选依赖改为 `package.json` 中的必需依赖

### R2.2 — 数据库列迁移（扩展 + 回填）

本批次只做**扩展**与**回填**，不删旧列。收缩留给批次 4。

- `Cocktail` 与 `RecommendationSession` 各加 `imageUrl` / `thumbnailUrl` 列
- 写路径改为只写新列
- 读路径优先读新列，新列为空时回落旧列（双读期）
- 提供可断点续跑的回填脚本，把存量 base64 解码上传 R2 并写入新列

### R2.3 — 客户端不再持久化图片二进制

- 删除 `MAX_PERSISTED_IMAGE_BYTES`、`estimateDataUrlBytes`、
  `IMAGE_PERSIST_DEBOUNCE_MS` 及相关去抖逻辑
- localStorage 只存图片 URL

### R2.4 — 保持分享卡片可用（✅ 基础设施已验证）

`components/share/PolaroidCard.tsx:125` 的 `<img>` 带 `crossOrigin="anonymous"`，
`CocktailSharePortal.tsx:52` 用 `toPng(..., { cacheBust: true })` 导出分享 PNG。

当前 `imageUrl` 是 base64 data URL，同源，`crossOrigin` 是空操作。
换成 R2 URL 后，若 bucket 未配置 CORS，图片会**加载失败**，
分享卡片产出一张没有酒的白框。`cacheBust` 追加的 query 还会绕过 CDN 缓存，
使 CORS 响应头更易缺失。

- ~~R2 bucket 配置 CORS~~ —— **已完成并实测**（2026-09-04），
  含 `cacheBust` query 与 CDN 缓存命中两种场景，ACAO 头均正常返回。
  详见 design §3.3
- 仍需在代码接通后做一次浏览器实测：导出的 PNG 中鸡尾酒图片可见。
  基础设施已排除，剩下的是代码正确性

### R3 — 顺带修复的安全项

同属 P0 安全面且改动小，本批次一并处理。

- POST 路由增加 Origin 校验
- 限流的可信 IP：引入 `TRUSTED_PROXY_HOPS`，从右往左取跳数，
  取代当前直取 `x-forwarded-for` 第一跳
- `rate_limit_buckets` 概率性清理过期行

> **不含 CSP nonce 化**。它与图片存储无关，且改 `proxy.ts` 会与批次 3
> 的语言判定收敛抢文件，nonce 化本身还有水合失败风险。已移至批次 5
> `i18n-rsc`，与收敛后的 `proxy.ts` 一起改。捆绑在此只会拖慢 P0 的合并。

## Constraints

- 不引入 Redis（父任务决策）
- 线上有真实数据，禁止 drop 重建
- `next.config.mjs` 的 `images.remotePatterns` 需加 R2 公开域
- 图片下载保留 host 白名单，并补充超时与响应体大小上限

## New Environment Variables

| 变量 | 必需 | 说明 |
| --- | --- | --- |
| `R2_ACCOUNT_ID` | 是 | Cloudflare 账号 ID |
| `R2_ACCESS_KEY_ID` | 是 | R2 API token |
| `R2_SECRET_ACCESS_KEY` | 是 | R2 API secret |
| `R2_BUCKET` | 是 | bucket 名 |
| `R2_PUBLIC_BASE_URL` | 是 | 公开访问基址（自定义域或 r2.dev） |
| `TRUSTED_PROXY_HOPS` | 否 | 默认 0；Caddy 反代后设 1 |

需同步更新 `.env.example`、`docker-compose.yml`、`README` 部署章节。

## Acceptance Criteria

- [ ] `POST /api/image` 携带 `prompt` 字段返回 400，且该 prompt 不会被发往 provider
- [ ] `grep -rn "generateImagePrompt" components context` 无结果
- [ ] 客户端组件 import `lib/ai/image-prompt` 时构建失败
- [ ] 新生成的推荐，其 `imageUrl` / `thumbnailUrl` 是 R2 URL，旧 base64 列为空
- [ ] 回填脚本在存量数据副本上跑通，中断后重跑不产生重复对象
- [ ] 回填脚本跑完后，所有非空旧列都有对应的新列 URL
- [ ] localStorage 中不再出现 `data:image/` 开头的值
- [ ] **分享卡片实测导出一张带图的 PNG**（R2.4；基础设施侧已于 2026-09-04
      验证通过，此处验的是代码接通后的端到端结果）
- [ ] 跨站 Origin 的 POST 被拒绝
- [ ] `TRUSTED_PROXY_HOPS=1` 时伪造的 `x-forwarded-for` 首跳不影响限流分桶
- [ ] `rate_limit_buckets` 中过期行会被清理
- [ ] R2 凭证缺失时生图返回明确错误，不产生脏数据
- [ ] `pnpm lint` / `pnpm test` / `pnpm build` / `pnpm db:init` 全绿
- [ ] 浏览器实测：`/cn` 与 `/en` 完整走一遍生成 + 生图 + 分享

## Non-Goals

- 不删除旧的 base64 列（批次 4 收缩阶段做）
- 不改 AI 文本生成管线（批次 2）
- 不引入 `ImageProvider` 抽象，直接调用现有 `generateImage`（批次 2 负责后续切换）
- 不改数据模型的 `english_*` 双列形态（批次 4）
- 不做 CSP nonce 化（批次 5）
- 不做图片的 CDN 缓存策略调优
