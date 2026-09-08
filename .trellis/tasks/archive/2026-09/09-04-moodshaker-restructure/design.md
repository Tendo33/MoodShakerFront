# 技术设计 — MoodShaker 结构性重构

本文件是**跨子任务的技术契约**。子任务的 `design.md` 负责各自的实现细节，
但不得违反此处的边界、接口与数据形态；如需违反，先改本文件并重新确认。

## 1. 现状诊断摘要

结论：三层问题叠加。

| 层 | 症状 | 根因 |
| --- | --- | --- |
| 安全 | 图片接口是开放文生图代理 | prompt 在客户端构造，服务端只做长度校验后透传 |
| 存储 | base64 图片入 Postgres TEXT | 早期为省一个对象存储依赖 |
| AI | 输出无保证、静默兜底、跨用户复用 | 无 schema 校验层；把通用 HTTP 缓存套在了非幂等的生成调用上 |
| 数据 | `english_*` 双列 + 中文子串反推英文 | 可枚举概念（基酒/酒精度/风味）被存成自由文本 |
| 路由 | 三处各自决定语言；内容页全 CSR | 客户端 Context 与 App Router 的服务端语义重复 |
| 状态 | 1400 行管线服务 3 道题 | 把同步的 localStorage 当成需要优化的异步 IO |

**关键洞察**：数据层的绝大部分复杂度（`normalizeAlcoholLevel`、`normalizeBaseSpirit`、
`inferEnglishBaseSpirit`、`inferEnglishAlcoholLevel`、`SPIRIT_FILTER_KEYWORDS`、
`FLAVOR_FILTER_KEYWORDS`、`ALCOHOL_FILTER_KEYWORDS` 共约 120 行）都源于同一个错误：
把「基酒」「酒精度」「风味」这三个**可枚举的封闭集合**存成了自由文本，
于是不得不在每个边界上做双语字符串子串匹配。改成 enum code 后这些代码全部消失。

## 2. 目标分层

删除顶层 `api/` 目录（它既不是路由也不是库，语义不明）。`utils/` 只保留真正的通用小工具。

```
app/
  [lang]/                    # 页面。内容型页面回归 Server Component
  api/                       # route handlers，保持薄：解析 → 校验 → 调 lib → 响应
lib/
  ai/
    provider.ts              # LLMProvider / ImageProvider 接口定义
    providers/
      openai-compatible.ts   # 默认实现（SiliconFlow / 任何 OpenAI 兼容端点）
    cocktail-schema.ts       # zod schema —— 唯一真相源
    cocktail-prompt.ts       # 由 schema 派生 prompt，不手写第二份
    generate-cocktail.ts     # 编排：prompt → provider → 校验 → 修复重试
    image-prompt.ts          # 服务端专用，禁止被 client 组件 import
  storage/
    object-store.ts          # S3 兼容接口
    providers/r2.ts          # Cloudflare R2 实现
    image-pipeline.ts        # 拉取 → sharp 转码 → 上传 → 返回 URL
  db/
    prisma.ts
    cocktails.ts
    recommendations.ts
  http/
    api-response.ts
    rate-limit.ts
    request-context.ts       # requestId、可信客户端 IP
  domain/
    cocktail.ts              # 领域类型（locale-keyed）
    vocabulary.ts            # 唯一词表：基酒 / 酒精度 / 风味 / 难度
i18n/
  dictionaries/{cn,en}.ts
  index.ts                   # 服务端字典解析
components/
context/                     # 大幅缩减
hooks/
utils/                       # 仅剩通用小工具
```

### 边界规则

- `app/api/**` 不含业务逻辑，只做「解析 → 校验 → 调 lib → 响应」
- `lib/ai/**`、`lib/storage/**`、`lib/db/**` 是 **server-only**，用 `import "server-only"` 强制
- 客户端组件不得 import 任何 `lib/ai`、`lib/storage`、`lib/db` 下的模块
- `lib/domain/**` 是同构的（纯类型 + 纯函数），两侧都可用

**这条规则直接杜绝 R1 类缺陷复发**：`image-prompt.ts` 带 `server-only` 后，
客户端再想构造 prompt 会在构建期报错，而不是等到有人发现能刷图。

## 3. 数据模型

### 3.1 可枚举概念改为 code

`lib/domain/vocabulary.ts` 成为唯一词表：

```ts
export const BASE_SPIRITS = ["gin","vodka","rum","tequila","whiskey","brandy","other","none"] as const;
export const ALCOHOL_LEVELS = ["none","low","medium","high"] as const;
export const FLAVOR_PROFILES = ["sweet","sour","bitter","spicy","fruity","herbal","floral","smoky","refreshing","creamy","salty"] as const;
export const SKILL_LEVELS = ["beginner","intermediate","advanced"] as const;
```

- DB 存 code，不存显示文本
- 显示文本从 i18n 字典查，`vocabulary.baseSpirit.rum` → `朗姆酒` / `Rum`
- LLM 被约束只能输出这些 code（schema enum）
- Gallery 过滤变成 `where baseSpirit = 'rum'`，可走索引，不再做双语子串匹配

**因此删除**：`normalizeAlcoholLevel`、`normalizeBaseSpirit`、`inferEnglishBaseSpirit`、
`inferEnglishAlcoholLevel`、`SPIRIT_FILTER_KEYWORDS`、`FLAVOR_FILTER_KEYWORDS`、
`ALCOHOL_FILTER_KEYWORDS`、`capitalizeKeyword`、`getFilterKeywords`。

### 3.2 自由文本改为 locale-keyed JSONB

```ts
type Locale = "cn" | "en";
type Localized<T = string> = Record<Locale, T>;

interface CocktailContent {
  name: Localized;
  description: Localized;
  matchReason: Localized;
  servingGlass: Localized;
  timeRequired: Localized;
  ingredients: Localized<Ingredient[]>;
  steps: Localized<Step[]>;
  tools: Localized<Tool[]>;
}
```

Prisma `Cocktail` 目标形态：

```prisma
model Cocktail {
  id             String   @id @default(cuid())
  slug           String   @unique          // 稳定的 URL 标识，取代按 name 唯一
  baseSpirit     String                     // vocabulary code
  alcoholLevel   String                     // vocabulary code
  flavorProfiles String[]                   // vocabulary code[]
  content        Json                       // CocktailContent
  imageUrl       String?                    // R2 URL，不再是 base64
  thumbnailUrl   String?
  searchVector   Unsupported("tsvector")?   // 全文检索，publish-gallery 子任务引入
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([baseSpirit])
  @@index([alcoholLevel])
  @@index([createdAt])
}
```

- 由 30 个标量列压到 10 个
- `english_*` 双列全部消失
- `name @unique` 换成 `slug @unique`（两杯酒重名是合法的，URL 唯一才是需求）

### 3.3 迁移策略

线上有真实数据，禁止 drop 重建。每个涉及 schema 的子任务遵循**扩展–回填–收缩**：

1. **扩展**：加新列，新旧并存，代码双写
2. **回填**：迁移脚本把存量数据转到新形态，可重复执行
3. **收缩**：确认无读旧列后，单独一次迁移删旧列

`image` → `imageUrl` 的回填需要把存量 base64 解码上传 R2，脚本必须可断点续跑。

## 4. AI 层

### 4.1 Provider 抽象

```ts
// lib/ai/provider.ts
export interface LLMProvider {
  readonly id: string;
  readonly supportsJsonSchema: boolean;
  complete(req: {
    system: string;
    user: string;
    jsonSchema?: { name: string; schema: unknown };
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;
  }): Promise<{ text: string; usage?: TokenUsage }>;
}

export interface ImageProvider {
  readonly id: string;
  generate(req: {
    prompt: string;
    size?: string;
    negativePrompt?: string;
    seed?: number;
    signal?: AbortSignal;
  }): Promise<{ url: string }>;
}
```

默认实现 `openai-compatible`，由环境变量装配。切换 provider 只改 env，不改代码。

### 4.2 输出保证

`lib/ai/cocktail-schema.ts` 的 zod schema 是**唯一真相源**，同时产出：

- TypeScript 类型（`z.infer`）
- 送给 provider 的 JSON Schema（structured output）
- 运行时校验器

生成流程：

```
构造 prompt（含由 schema 派生的字段说明）
  → supportsJsonSchema ? response_format: json_schema : response_format: json_object
  → zod.safeParse
  → 成功：落库
  → 失败：带 zod 错误信息做 1 次修复重试
  → 再失败：抛 CocktailGenerationError，接口返回 422/502，不落库
```

**明确移除**：正则 `/\{[\s\S]*\}/` 抠 JSON、`cocktail.name || "Unknown Cocktail"` 系列兜底。
坏输出必须是可见失败。

### 4.3 缓存与调用预算

- **移除** `getChatCompletion` 的 10 分钟 completion 缓存。生成是非幂等语义，不可跨用户复用
- 保留请求去重（同一 in-flight key 合并），但仅对**同一请求**，不跨请求
- 单次用户请求的 LLM 调用上界：`1 次生成 + 至多 1 次 schema 修复重试 = 2`
  - 移除 `optimizedFetch` 的内部 retry 与客户端 `COCKTAIL_REQUEST_RETRY_LIMIT` 的叠加
  - 网络层重试只对**连接失败**生效，不对已返回的 4xx/5xx 生效
- 记录每次调用的 token usage，供 observability 子任务消费

### 4.4 双语生成

当前 prompt 的 schema 完全没有 `english_*` 字段，导致双语数据从生成起就残缺。
目标：一次调用产出完整的 `Localized` 内容。

- schema 中每个文本字段是 `{ cn: string, en: string }`
- prompt 明确要求两种语言都填写，且语义对应而非机翻腔
- 可枚举字段只输出 code，不输出显示文本 —— 语言无关，天然双语

### 4.5 流式

生成耗时长（当前客户端 90s 超时配假进度条）。目标改为流式：

- route handler 返回流式响应，先推送已解析出的字段
- 客户端按字段渐进渲染，删除假进度条与轮换文案
- 此项若实现成本过高，允许 ai-pipeline 子任务降级为「真实阶段进度」而非逐字段流式，
  但**必须**在该子任务的 design.md 中记录降级理由

## 5. 图片链路

全流程服务端，客户端只拿 URL。

```
POST /api/image { recommendationId, editToken }      ← 无 prompt 字段
  → 校验 token
  → 限流
  → 服务端从 cocktailPayload 派生 prompt          （lib/ai/image-prompt.ts, server-only）
  → ImageProvider.generate → 临时 URL
  → 下载（host 白名单 + 超时 + 大小上限）
  → sharp 转 webp：1024 主图 + 320 缩略图
  → 上传 R2：cocktails/{id}/{variant}.webp
  → 写库 imageUrl / thumbnailUrl
  → 返回 { imageUrl, thumbnailUrl }
```

- `sharp` 从「动态 require 的可选依赖」升级为**必需依赖**。链路依赖它，静默降级只会产出更差的数据
- R2 通过 `@aws-sdk/client-s3` 访问（S3 兼容），换 S3/MinIO 只改 endpoint
- 新增环境变量：`R2_ACCOUNT_ID`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET`、`R2_PUBLIC_BASE_URL`
- `next.config.mjs` 的 `images.remotePatterns` 加入 R2 公开域，移除写死的阿里云 OSS host
- 客户端不再持久化图片二进制，`MAX_PERSISTED_IMAGE_BYTES` 及相关去抖逻辑删除

### 5.1 R2 必须配置 CORS（分享功能的硬约束）

`components/share/PolaroidCard.tsx:125` 的 `<img>` 带 `crossOrigin="anonymous"`，
`CocktailSharePortal.tsx:52` 用 `toPng(cardRef, { cacheBust: true, pixelRatio: 2 })`
把整张卡片渲染成 PNG 供分享。

当前 `imageUrl` 是 base64 data URL —— 同源，`crossOrigin` 是空操作，一切正常。
换成 R2 URL 后行为改变：

| R2 CORS 状态 | 结果 |
| --- | --- |
| 未配置 | `crossOrigin="anonymous"` 使图片**加载失败**，分享卡片产出无图白框 |
| 已配置但被 `cacheBust` 的 query 绕过 CDN 缓存 | CORS 响应头可能缺失，同上 |
| 已配置且覆盖带 query 的请求 | 正常 |

约束：

- R2 bucket 的 CORS 规则必须允许站点域名 `GET`，且 `AllowedHeaders` 覆盖预检
- 若使用自定义域 + Cloudflare CDN，需确认缓存规则不剥离 CORS 头
- 验收方式是**浏览器实测导出一张带图的 PNG**，不接受代码审查判定
- 若 CORS 方案受阻，备选是把卡片渲染移到服务端（satori / resvg），
  但那是更大的改动，不在批次 1 范围内 —— 届时批次 1 需暂缓合并并回到父任务讨论

## 6. i18n 与渲染

> **交付拆分**：§6.1 与 §6.2 归批次 3 `i18n-foundation`（无前置依赖）；
> §6.3 与 §6.4 归批次 5 `i18n-rsc`（依赖批次 4 `data-model`）。
> 原因：批次 4 的 locale-keyed 数据改造需要 i18n 层先能按 locale 取值，
> 因此语言判定收敛必须排在 data-model **之前**，而 RSC 化必须排在其**之后**。

### 6.1 单一真相源

语言只由 `[lang]` 路由参数决定。

- `proxy.ts` 只负责「无语言前缀 → 补前缀」的重定向，不再是语言状态的持有者
- `app/layout.tsx` 停止读内部 header `next-url`（非公开 API）。`<html lang>` 由
  `app/[lang]/layout.tsx` 提供
- `LanguageContext` 降级或删除：服务端已知语言，客户端只需要一个只读的
  locale 值和字典切片，不需要初始化 effect、不需要 localStorage 往返
- cookie 仅用于「用户显式切换语言后的下次落地页选择」，不参与当前请求的语言判定

### 6.2 字典与类型

- 字典按 namespace 拆分，避免一个平铺的 250 行 `Record<string,string>`
- `t()` 的 key 具备类型约束，写错 key 是编译错误而非静默返回 key 本身
- 支持插值（当前完全没有）

### 6.3 渲染策略

| 页面 | 当前 | 目标 |
| --- | --- | --- |
| `/[lang]` 首页 | `dynamic()` + `"use client"` | Server Component，静态化 |
| `/[lang]/gallery` | Server Component（已正确） | 保持，加全文检索 |
| `/[lang]/cocktail/[id]` | Server Component 外壳 + 客户端内层 | 内容服务端渲染，仅交互部分 client |
| `/[lang]/questions` | `dynamic()` + `"use client"` | 保持 client（本质是交互表单），但外壳服务端化 |
| `/[lang]/cocktail/recommendation` | `dynamic()` + `"use client"` | 保持 client，外壳服务端化 |

验收口径：`/cn` 与 `/en` 首页在禁用 JavaScript 时可渲染主要内容。

### 6.4 SEO

补齐 hreflang（`alternates.languages`）、`sitemap.ts`、`robots.ts`、
`opengraph-image`、Recipe JSON-LD（菜谱站的主要结构化数据收益点）。
metadata 按语言生成，不再在 `/cn` 下输出英文标题。

## 7. HTTP 契约

响应包络保持不变，避免无谓的客户端改动：

```ts
{ success: true, data: T }
{ success: false, error: { code: string, message: string, requestId: string } }
```

新增 `requestId`（当前只在服务端日志里，客户端排查无从下手）。

### 校验

引入 **zod** 替代 `lib/request-validation.ts` 的 225 行手写校验器。
schema 定义一次，服务端校验 + 客户端类型 + 错误信息全部复用。

### 限流

保持 Postgres 方案（决策：不引入 Redis），但补齐两处缺陷：

- **可信 IP**：`x-forwarded-for` 取第一跳可被伪造。引入 `TRUSTED_PROXY_HOPS`
  环境变量，从右往左数指定跳数取客户端 IP。自托管在 Caddy 后面时设为 1
- **清理**：`rate_limit_buckets` 当前只增不减。在 consume 路径上做概率性清理
  （如 1% 概率删除 `reset_at < now() - interval '1 hour'`），不引入外部 cron

### 安全头

- CSP 的 `script-src 'self' 'unsafe-inline'` 改为 nonce 化。当前写法等于没有 CSP。
  **归批次 5**，与语言判定收敛后的 `proxy.ts` 一起改，避免两个批次抢同一文件，
  也避免 nonce 化的水合风险拖慢批次 1 的 P0 合并
- POST 路由增加 Origin 校验（归批次 1）

## 8. 状态层目标形态

删除的抽象：

| 模块 | 行数 | 处置 | 理由 |
| --- | --- | --- | --- |
| `utils/asyncStorage.ts` | 415 | 删除 | 把微秒级的同步 localStorage 包装成 4ms 批处理异步队列 + TTL 缓存，解决不存在的问题，引入缓存与存储不一致的真实 bug 面 |
| `hooks/useAsyncState.ts` | 320 | 删除 | 仅服务于上者 |
| `context/CocktailContext.tsx` | 105 | 删除 | 自身已标 `@deprecated` 的合并门面 |
| `utils/api-optimization.ts` | 197 | 删除 | 缓存语义对生成调用是错的；重试与上层叠加 |
| `utils/cache-utils.ts` | 130 | 删除 | 仅服务于上者 |
| `components/PerformanceMonitor.tsx` | 302 | 移出 root layout | 每页发送 300 行监控组件；由 observability 子任务用标准方案替代 |

保留并简化：`CocktailFormContext`（3 道题的表单状态）、`CocktailResultContext`（结果 + 生图状态）。
持久化直接用 `localStorage` 同步读写，不加抽象层。

预期净删除约 1400 行。

## 9. 依赖调整

| 动作 | 包 | 理由 |
| --- | --- | --- |
| 新增 | `zod` | 替代手写校验器，schema 单一真相源 |
| 新增 | `@aws-sdk/client-s3` | R2 访问 |
| 提升 | `sharp` 为必需依赖 | 图片链路依赖它，不应静默降级 |
| 固定 | `framer-motion`、`@emotion/is-prop-valid` | 当前是 `"latest"`，复现性风险 |
| 评估 | `framer-motion` → `motion` | 已更名 |
| 评估 | Prisma 5 → 6/7 | 版本落后 |

## 10. 构建与部署

**归属批次 8**（`observability-tests`）。这几项彼此相关且都属运维面，
放在最后一批统一做，避免早期批次反复触碰 Dockerfile。

- `next.config.mjs` 启用 `output: "standalone"`。当前 Dockerfile 复制整个 `.next`
  并在 runner 阶段重装全部依赖（含 devDependencies），镜像明显偏大
- Dockerfile 中 `COPY /app/api ./api` 在批次 2 删除顶层 `api/` 后需同步移除
  （批次 2 只删 `api/openai.ts`，届时该 COPY 会指向空目录而失败，
  故**批次 2 必须同步修改 Dockerfile**，这一条是例外）
- `DATABASE_URL="postgresql://placeholder:..."` 的构建期占位符与
  `shouldUseBuildFallback()` 的运行时判断耦合，随批次 4 `data-model` 一并清理

## 11. 风险与缓解

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| base64 → R2 回填中断 | 存量图片丢失 | 脚本可断点续跑；收缩阶段前不删旧列；先在副本上演练 |
| SiliconFlow 不支持 json_schema | structured output 降级 | provider 声明 `supportsJsonSchema`，降级到 json_object + zod + 修复重试 |
| locale-keyed 迁移触及全部读路径 | 改动面大 | 扩展–回填–收缩三步走，双写期间新旧读路径并存 |
| RSC 化触发 vaporwave 视觉回归 | 观感劣化 | 每个页面改造后做浏览器实测比对，spec 已要求可见 UI 变更必须浏览器验证 |
| 一次性删 1400 行状态代码 | 隐藏行为丢失 | 先补 e2e 覆盖主流程，再删；state-slimdown 排在 i18n-rsc 之后正是为此 |

## 12. 不做的事

- 不引入用户账号体系
- 不引入 Redis
- 不迁移 Vercel
- 不重做视觉方向
- 不引入第三种语言
- 不把 `Cocktail` 拆成翻译子表（当前规模下 JSONB 更合适，且 gallery 检索走 tsvector）
