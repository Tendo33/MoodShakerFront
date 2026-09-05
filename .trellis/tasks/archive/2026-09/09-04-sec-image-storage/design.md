# 技术设计 — P0 安全与图片存储

父任务设计契约：[design.md](../09-04-moodshaker-restructure/design.md) 第 5、7 节。

## 1. 边界

### 改动的文件

```
新增  lib/storage/object-store.ts          S3 兼容接口
新增  lib/storage/providers/r2.ts          R2 实现
新增  lib/storage/image-pipeline.ts        下载 → 转码 → 上传
新增  lib/ai/image-prompt.ts               server-only，从 api/image.ts 迁入
新增  lib/http/request-context.ts          requestId + 可信客户端 IP
新增  prisma/migrations/*_add_image_urls/  扩展迁移
新增  prisma/backfill-image-urls.ts        回填脚本
改动  app/api/image/route.ts               去 prompt 入参，接管完整管线
改动  lib/request-validation.ts            validateImageRequest 去掉 prompt
改动  lib/recommendation-sessions.ts       读写新列
改动  lib/cocktail-data.ts                 select 与映射加新列
改动  lib/rate-limit.ts                    可信 IP + 过期清理
改动  context/CocktailResultContext.tsx    去 prompt、去图片持久化
改动  prisma/schema.prisma                 加 imageUrl / thumbnailUrl
改动  next.config.mjs                      R2 remotePattern（CSP nonce 移至批次 5）
改动  package.json                         sharp 转必需，加 @aws-sdk/client-s3
改动  .env.example / docker-compose.yml / README*
删除  api/image.ts                         迁至 lib/ai/image-prompt.ts
```

### 不碰的文件

`lib/cocktail-generation.ts`、`api/openai.ts` 的文本生成部分、`utils/prompts.ts`
—— 全部属于批次 2。本批次只调用 `generateImage`，不改它的实现。

### 与批次 2 的接口边界（review 修订）

父任务 design §4.1 定义的 `ImageProvider` 抽象是**批次 2 的交付物**，
本批次不创建、不依赖它。`lib/storage/image-pipeline.ts` 直接 import 现有的
`generateImage`：

```ts
import { generateImage } from "@/api/openai";   // 批次 2 合并后改为 lib/ai
```

理由：引入抽象需要先定义接口，而接口定义权归批次 2；两个并行批次各写一份
`ImageProvider` 必然冲突。批次 2 合并后由**批次 2 负责**把本批次的调用点
切到 `ImageProvider`。若批次 2 先合并，本批次 rebase 时直接对接新接口。

## 2. 图片管线

### 2.1 时序

```
POST /api/image { recommendationId, editToken }
  │
  ├─ Origin 校验
  ├─ 入参校验（本批次仍用手写校验器并收紧；zod 引入见批次 2）
  ├─ getRecommendationSessionById(id, editToken) → 403 if null
  ├─ consumeRateLimit(`image:${id}`, 3, 60_000)
  │
  ├─ buildImagePrompt(session.cocktail)          ← server-only，无外部输入
  ├─ generateImage(prompt, {...}) → 临时 URL      ← 现有 api/openai.ts，不引入抽象
  │
  ├─ fetchImageBuffer(url)
  │    ├─ host 白名单
  │    ├─ AbortSignal 15s
  │    └─ 大小上限 10MB（新增，当前无上限）
  │
  ├─ sharp: rotate → resize(1024, inside, noEnlarge) → webp(80)  → full
  ├─ sharp: rotate → resize(320,  inside, noEnlarge) → webp(60)  → thumb
  │
  ├─ digest = sha256(full).slice(0,16)            ← 内容寻址，见 §3.4
  ├─ objectStore.put(`cocktails/${id}/${digest}-full.webp`,  full,  "image/webp")
  ├─ objectStore.put(`cocktails/${id}/${digest}-thumb.webp`, thumb, "image/webp")
  │
  ├─ updateRecommendationSessionImageUrls({ id, editToken, imageUrl, thumbnailUrl })
  └─ 200 { imageUrl, thumbnailUrl }
```

### 2.2 失败语义

当前实现把转码失败 catch 掉并回落到 provider 的临时 URL，等于产出一条会变死链的数据。
改为**明确失败**：

| 失败点 | 状态码 | code | 是否写库 |
| --- | --- | --- | --- |
| token 不匹配 | 403 | `FORBIDDEN` | 否 |
| 限流 | 429 | `RATE_LIMITED` | 否 |
| provider 生图失败 | 502 | `IMAGE_PROVIDER_FAILED` | 否 |
| 下载失败 / 超时 / 超限 | 502 | `IMAGE_FETCH_FAILED` | 否 |
| 转码失败 | 500 | `IMAGE_PROCESSING_FAILED` | 否 |
| R2 上传失败 | 502 | `IMAGE_UPLOAD_FAILED` | 否 |
| R2 未配置 | 503 | `OBJECT_STORE_UNAVAILABLE` | 否 |

任一环节失败都不写库。宁可没有图，不要死链。

### 2.3 sharp 转为必需依赖

当前 `app/api/image/route.ts:75` 用 `createRequire` 动态加载 sharp，失败则
`sharpFactory = null` 并 warn，随后直接用 provider URL。

改为顶层 `import sharp from "sharp"`。理由：整条链路（转码 → 上传 R2）依赖它，
静默降级只会产出更差的数据。Dockerfile 的 alpine 基础镜像需确认 sharp 的
`linux-musl` 二进制可用（`libc6-compat` 已安装）。

## 3. 对象存储

### 3.1 接口

```ts
// lib/storage/object-store.ts
import "server-only";

export interface PutResult { key: string; url: string }

export interface ObjectStore {
  readonly id: string;
  put(key: string, body: Buffer, contentType: string): Promise<PutResult>;
  delete(key: string): Promise<void>;
}

export function getObjectStore(): ObjectStore;  // 按 env 装配，缺配置时抛 DeploymentDependencyError
```

### 3.2 R2 实现

`@aws-sdk/client-s3`，`endpoint: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`，
`region: "auto"`，`forcePathStyle: true`。

公开 URL 由 `R2_PUBLIC_BASE_URL` 拼接，不用 SDK 生成签名 URL —— 图片是公开内容，
签名 URL 会过期且不利于 CDN 缓存。

换成 MinIO 或 AWS S3 时只改 endpoint 与凭证，接口不变。

### 3.4 内容寻址的对象 key（实现期修正 2026-09-05）

本节原先规定固定 key `cocktails/{id}/{variant}.webp`。实现时发现它与 R2 上的
长效 `Cache-Control: immutable` **相互矛盾**：刷新图片会写回同一个 key，
而 CDN 会按 immutable 永久返回旧图，用户点「换一张」看不到变化。

改为把内容摘要放进 key：

```
cocktails/{recommendationId}/{sha256(full).slice(0,16)}-{full|thumb}.webp
```

这样刷新必然产生新 URL，immutable 缓存才是诚实的。代价是旧对象会留存，
需要处置孤儿对象（见 §3.5）。

### 3.5 孤儿对象处置

内容寻址的代价：刷新图片后旧对象不再被引用，但仍占用存储。

**不能用基于年龄的 R2 生命周期规则** —— 那会删除仍在使用的当前图片
（一张一年前生成、至今仍在展示的图会被误删）。这是个容易踩的陷阱。

采用**替换时精确删除**：写入新 URL 成功后，从数据库里的旧 URL 反推出 key，
尽力删除旧对象。

- 删除失败只记日志，不影响请求结果 —— 新 URL 已持久化，残留孤儿无害
- 删除发生在数据库更新**之后**，避免删掉仍被引用的对象
- 免费额度 10GB，即使完全不清理也够用很久；此机制是卫生措施而非必需


### 3.3 CORS（分享功能的硬约束）— ✅ 已实测通过

> **2026-09-04 实测结论**：基础设施已创建并验证，R2.4 阻塞项解除。
> 分享卡片可继续走客户端 `html-to-image`，**不需要**退到服务端渲染的备选方案。
>
> 实测结果：
>
> | 场景 | `access-control-allow-origin` |
> | --- | --- |
> | `Origin: https://moodshaker.de` | ✅ 回显 |
> | `Origin: http://localhost:3000` | ✅ 回显 |
> | `Origin: https://evil.example` | ✅ 无此头（浏览器会拦截，行为正确）|
> | 带 `?t=<ts>`（`cacheBust: true` 的实际行为）| ✅ 回显 |
> | `cf-cache-status: HIT` 时 | ✅ 回显 |
>
> 最后两行是原先最担心的点，均已排除。`cacheBust` 不必移除。

bucket 必须配置 CORS，否则分享卡片会坏。见 prd R2.4。

**已就绪的基础设施**（2026-09-04 创建）：

| 项 | 值 |
| --- | --- |
| 账号 | `Sjf1998112@gmail.com's Account` / `8df4b2d101725e4f3789c72de405bd1e` |
| bucket | `moodshaker-images`（Standard，位置 automatic）|
| 公开域 | `https://img.moodshaker.de`（zone `7d7db8482061492ca9cfff57c5dc43df`）|
| min TLS | 1.2（默认给的是 1.0，已上调）|
| CORS 配置 | 版本化于 `infra/r2-cors.json`，用 `wrangler r2 bucket cors set` 应用 |
| 探针对象 | `_probe/cors-check.png`，保留作健康检查目标 |

> 注意：R2 与 `moodshaker.de` 的 zone 必须同账号。最初 R2 只在
> `410915218@qq.com's Account` 启用，而 zone 在 Sjf 账号下 —— 已在 Sjf 账号
> 开通 R2 解决。若日后迁移账号，自定义域绑定会失效。

当前生效的 CORS 规则（`infra/r2-cors.json`）：

```json
{
  "rules": [{
    "allowed": {
      "origins": ["https://moodshaker.de", "https://www.moodshaker.de", "http://localhost:3000"],
      "methods": ["GET", "HEAD"],
      "headers": ["*"]
    },
    "exposeHeaders": ["Content-Length", "Content-Type", "ETag"],
    "maxAgeSeconds": 86400
  }]
}
```

改动 CORS 时改这个文件并重新应用，不要在 Dashboard 里直接改 —— 否则仓库里的
配置与线上不一致：

```bash
CLOUDFLARE_ACCOUNT_ID=8df4b2d101725e4f3789c72de405bd1e \
  npx wrangler r2 bucket cors set moodshaker-images --file infra/r2-cors.json
```

> 若日后新增站点域名（如预览环境），必须同步加进 `origins`，否则该环境的
> 分享卡片会静默产出无图 PNG。这是最容易被忽略的回归点。

### 3.6 本地开发的 DNS 劫持坑（实现期发现 2026-09-05）

本机若运行 Clash / Surge 等代理工具的 **fake-ip 模式**，`img.moodshaker.de`
会被解析到 `198.18.0.0/15`（RFC2544 保留段）。此时 `next/image` 的优化端点
`/_next/image` 会拒绝该 URL：

```
⨯ upstream image ... resolved to private ip ["198.18.135.89"]
"url" parameter is not allowed        ← 400，且报错信息误导
```

**这不是配置问题，`remotePatterns` 是对的。** 判定方法：

```bash
# 本机 DNS（被劫持时返回 198.18.x.x）
dig +short img.moodshaker.de A

# DoH 绕过劫持，看真实解析
curl -s -H 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=img.moodshaker.de&type=A'
```

实测真实解析为 Cloudflare 公网段（`104.21.32.33` / `172.67.182.152`），
**生产环境不受影响**。直接 `curl` 图片 URL 也是 200 + 正常 webp ——
只有 Next 基于 IP 的 SSRF 检查会被污染的解析结果绊倒。

本地要验证 `/_next/image`，需把该域加入代理工具的 direct/绕过规则。

## 4. 数据库迁移

### 4.1 扩展迁移

```sql
ALTER TABLE "cocktails"                ADD COLUMN "image_url"     TEXT;
ALTER TABLE "cocktails"                ADD COLUMN "thumbnail_url" TEXT;
ALTER TABLE "recommendation_sessions"  ADD COLUMN "image_url"     TEXT;
ALTER TABLE "recommendation_sessions"  ADD COLUMN "thumbnail_url" TEXT;
```

纯加列，可安全回滚（drop column）。

### 4.2 双读期

```
写：只写 imageUrl / thumbnailUrl
读：imageUrl ?? image        （image 是旧的 base64 data URL，仍可直接渲染）
```

双读逻辑集中在 `lib/db` 的映射函数里，不散落到组件。批次 4 删旧列时只删这一处。

### 4.3 回填脚本

`prisma/backfill-image-urls.ts`，`pnpm prisma:backfill-image-urls`。

```
按 id 升序分页扫描（page size 20，避免一次拉太多 base64 进内存）
对每行：
  跳过 imageUrl 已非空的行            ← 断点续跑的依据
  跳过 image 为空的行
  解析 data URL → Buffer
  sharp 转码双尺寸
  上传 R2（内容寻址 key，幂等：同内容 → 同 key）
  UPDATE 该行的 imageUrl / thumbnailUrl
  失败则记录 id 并继续，最后汇总输出
```

幂等性：key 由内容摘要决定，同一行重跑得到同一个 key，不产生垃圾。
跳过条件基于 `imageUrl IS NOT NULL`，中断后重跑从断点继续。

替代现有的 `prisma/backfill-thumbnails.ts`（该脚本为旧 base64 缩略图设计，
本批次完成后失效，标记废弃，批次 4 删除）。

## 5. 安全加固

> **CSP nonce 已移出本批次**（review 修订）。它与图片存储无关，
> 会与批次 3 的 `proxy.ts` 改动抢文件，且 nonce 化本身有水合失败风险，
> 捆绑只会拖慢 P0 的合并。见批次 5 `i18n-rsc`。

### 5.1 Origin 校验

`lib/http/request-context.ts` 提供 `assertSameOrigin(request)`：
比对 `Origin` 头与 `Host`，不匹配返回 403。无 `Origin` 头（同源 GET、curl）放行 POST 需谨慎 ——
仅对 `POST` 且存在 `Origin` 时校验，缺失时依赖 CSRF 的 JSON content-type 约束。

### 5.2 可信客户端 IP

> **实现期修正（2026-09-05）**：本节原先写的公式 `idx = len - 1 - hops` 是**错的**，
> 它恰好取到被伪造的那一跳，等于没有修复漏洞。已验算改为 `idx = len - hops`。

XFF 的语义是：**每个代理追加它看到的上游连接方 IP**。所以最右侧的条目是最靠近
应用的代理写入的，最可信；左侧条目可由客户端任意伪造。

设 `hops` = 可信代理层数，则客户端真实 IP 位于 `idx = len - hops`：

| 场景 | XFF 链 | hops | 正确 idx | 取值 |
| --- | --- | --- | --- | --- |
| Caddy 反代，客户端伪造首跳 | `1.1.1.1(伪造), 5.5.5.5(真实)` | 1 | 1 | `5.5.5.5` ✅ |
| CDN + Caddy，客户端伪造首跳 | `1.1.1.1(伪造), 5.5.5.5(真实), 9.9.9.9(CDN)` | 2 | 1 | `5.5.5.5` ✅ |

优先级设计：

1. `CF-Connecting-IP` —— 流量经 Cloudflare 时由 CF 写入，客户端无法伪造，最可靠
2. `x-forwarded-for` 按上述 `len - hops` 计算
3. `x-real-ip`
4. `"unknown"`

`hops = 0` 的语义是「无可信代理」，此时整条 XFF 都不可信。但若因此返回固定值，
所有流量会落进同一个限流桶，形成自我 DoS。折中：退回取最右侧条目，并在文档与
代码注释中标明该值可伪造。**生产部署（Caddy 反代）应设 `TRUSTED_PROXY_HOPS=1`。**

### 5.3 限流表清理

在 `consumeRateLimit` 的成功路径上做概率性清理，不引入外部 cron：

```sql
-- 约 1% 的请求触发
DELETE FROM rate_limit_buckets WHERE reset_at < NOW() - INTERVAL '1 hour';
```

放在返回之后 fire-and-forget，失败只 warn 不影响主流程。

## 6. 校验层的过渡处理

父任务设计要求用 zod 替代手写校验器，但 zod 的引入归属批次 2
（那里 schema 是核心产物）。本批次不提前引入，只做最小改动：

- `validateImageRequest` 删除 `prompt` 与 `forceRefresh` 的处理
- 新增：请求体出现 `prompt` 键时返回 `INVALID_PAYLOAD`（显式拒绝而非忽略）

批次 2 合并后，批次 4 顺带把本文件涉及的校验器迁到 zod。

> `forceRefresh` 在现有代码里被解析但从未使用（`route.ts` 取出后未读）。
> 一并删除。刷新语义由「再次调用该接口」表达，key 幂等覆盖。

## 7. 客户端改动

`context/CocktailResultContext.tsx`：

- 删除 `import { generateImagePrompt } from "@/api/image"`
- 两处 fetch（`:342` 后台生图、`:439` refreshImage）的 body 改为
  `{ recommendationId, editToken }`
- 响应字段 `image` / `thumbnail` 改为 `imageUrl` / `thumbnailUrl`
- 删除 `MAX_PERSISTED_IMAGE_BYTES`、`IMAGE_PERSIST_DEBOUNCE_MS`、
  `estimateDataUrlBytes`、`imagePersistenceRef` 及 `persistImageData` 的
  体积检查与去抖分支 —— 存 URL 不需要这些

保留 `volatileImageData` / `scopedPersistedImageData` 的作用域判断逻辑，
那部分是防止旧图串到新推荐上的，与本批次无关。

## 8. 风险

| 风险 | 缓解 |
| --- | --- |
| alpine 上 sharp 二进制不可用 | 先在 Dockerfile 构建阶段验证；`libc6-compat` 已装，必要时加 `vips-dev` |
| 回填脚本 OOM（base64 全拉内存） | 分页 20 条，单条处理完即释放；容器限 1G 内存 |
| R2 公开域未配好导致图片 404 | 加一个启动期自检：put 一个探针对象并 GET 验证 |
| 双读期读到旧 base64 影响性能 | 双读期是临时状态，回填跑完即可进入批次 4 收缩 |
| ~~R2 未配 CORS 导致分享卡片无图~~ | **已排除**：2026-09-04 实测通过，见 §3.3 |

## 9. 验证

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
pnpm db:init
```

存量数据副本上：

```bash
pnpm prisma:backfill-image-urls          # 跑通
# 中途 Ctrl-C 后重跑，确认不重复、从断点继续
```

浏览器：`/cn` 与 `/en` 各走一遍 首页 → 问卷 → 推荐 → 生图 → 刷新图 → 分享。
DevTools 确认：
- `/api/image` 请求体无 prompt 字段
- 图片 src 是 R2 URL 而非 data URL
- localStorage 无 `data:image/` 值
- 分享卡片导出的 PNG 中鸡尾酒图片可见（§3.3）

手工渗透检查：
- 构造带 `prompt` 的请求 → 400
- 伪造 `x-forwarded-for` 首跳 → 限流分桶不变
- 跨站 Origin 的 POST → 403
