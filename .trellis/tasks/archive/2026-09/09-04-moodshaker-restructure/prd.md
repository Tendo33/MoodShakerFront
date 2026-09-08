# MoodShaker 结构性重构

父任务。持有需求全集、子任务地图、跨子任务验收标准和最终集成评审。
本任务本身不承载实现工作，实现全部落在子任务。

## Goal

在保留 MoodShaker 产品概念（双语 AI 鸡尾酒推荐 + vaporwave 视觉）的前提下，
分批重构前后端，消除一处安全缺陷、两处结构性错误决策，以及若干层防御性补丁堆积，
让项目从「可控 beta」达到「可全量发布」。

## Source Requirements

用户原始诉求（2026-09-04）：全面分析前后端，全面改进，允许完全重构，包括 prompt。
选定路线 **B：结构性重构** —— 保留产品与视觉，重写数据模型 / AI 层 / i18n / 状态层。

## Fixed Decisions

这些决策已由用户拍板，子任务不得单方面推翻；如需推翻，回到父任务重新确认。

| 决策项 | 结论 | 影响的子任务 |
| --- | --- | --- |
| 改进路线 | B：结构性重构，非重写 | 全部 |
| 图片存储 | Cloudflare R2（S3 兼容），应用只存 URL | sec-image-storage、data-model |
| 部署形态 | 保持 Docker Compose 自托管，**不引入 Redis** | sec-image-storage、observability-tests |
| LLM provider | 抽象 provider 层，默认 SiliconFlow，可环境变量切换 | ai-pipeline |
| 保留约束 | 无硬约束。视觉、数据、provider 均可重新选择 | 全部 |

## Requirements

### R1 — 关闭图片生成的开放代理（P0，安全）

当前 `context/CocktailResultContext.tsx` 在浏览器构造 image prompt 并 POST 给
`/api/image`，服务端仅校验长度后透传给图片 provider。持有任一 `recommendationId +
editToken` 的人即可用项目的 API Key 生成任意内容图片。

- 请求体不得再包含 `prompt` 字段
- prompt 必须由服务端从已持久化的 `cocktailPayload` 派生
- `api/image.ts` 的 `generateImagePrompt` 不得被客户端代码引用

### R2 — 图片移出数据库（P0，性能与成本）

`Cocktail.image` / `Cocktail.thumbnail` / `RecommendationSession.image` /
`RecommendationSession.thumbnail` 目前是 `@db.Text` 里的 base64 data URL
（单图约 200KB），每次详情与 gallery 查询都会拉进内存；客户端还会往 localStorage
写 320KB 的 data URL。

- 图片写入 Cloudflare R2，数据库只保留 URL
- 存量 base64 数据需要可回滚的迁移路径
- 客户端不再持久化图片二进制

### R3 — AI 生成管线可信化（P0）

当前管线没有任何输出保证：正则抠 JSON、`||` 兜底、prompt 内 schema 缺 `english_*`
字段、completion 被缓存 10 分钟、词表三套打架、失败时最多打 4 次 LLM。

- 模型输出必须经 schema 校验后才允许落库，校验失败要显式失败而非静默兜底
- 生成结果不得跨用户复用（移除 completion 缓存）
- 酒精度 / 基酒 / 风味的词表全局唯一
- 单次用户请求的 LLM 调用次数有明确上界
- prompt 与 schema 同源，不再手写两份

### R4 — 数据模型统一（P1）

`english_*` 双列 + `cocktailPayload` JSON blob + 三套重叠的 Cocktail 类型
+ 从中文子串反推英文的启发式函数（`inferEnglishBaseSpirit` 等）。

- 双语内容用 locale-keyed 结构表达，不再字段翻倍
- 收敛 `Cocktail` / `GalleryCocktail` / `PublicCocktailSummary` / `PublicCocktailDetail`
- 删除启发式反推，缺失翻译就是缺失，由生成层保证完整
- 清理 `runWithThumbnailCompatibility`、`isMissingJsonColumnError`、
  `shouldUseBuildFallback` 等兼容补丁

### R5 — i18n 单一真相源与 RSC 化（P1）

语言当前由 `proxy.ts`、`app/layout.tsx`（读内部 header `next-url`）、
`LanguageContext`（pathname + localStorage）三处各自决定。首页 / 问卷 / 结果页
全部是 `dynamic()` 包裹的客户端组件，SEO 与 LCP 被放弃。

拆为两批交付（见 Task Map 修订记录）：

**R5.1 / R5.2 — 语言判定收敛（批次 3，无依赖）**

- 语言只有一个真相源：`[lang]` 路由参数
- 字典按 namespace 拆分，`t()` 具备 key 类型约束，支持插值

**R5.3 / R5.4 — 渲染与 SEO（批次 5，依赖 data-model）**

- 内容型页面回归 Server Component
- 补齐 hreflang / sitemap / robots / OG image / Recipe JSON-LD

### R9 — 保持分享卡片可用（P0，随批次 1）

`components/share/PolaroidCard.tsx:125` 带 `crossOrigin="anonymous"`，
`CocktailSharePortal.tsx:52` 用 `toPng(..., { cacheBust: true })` 把卡片渲染成 PNG。

当前 `imageUrl` 是 base64 data URL，天然同源，`crossOrigin` 是空操作。
一旦换成 R2 URL，若 bucket 未配置 CORS，`crossOrigin="anonymous"` 会使图片
**加载失败**（不是画布污染，是压根不显示），分享卡片会产出一张没有酒的白框。
`cacheBust: true` 追加的 query 参数还会绕过 CDN 缓存，让 CORS 响应头更易缺失。

- R2 bucket 必须配置 CORS，允许站点域名读取
- 图片迁移到 R2 后，分享卡片必须在浏览器实测中产出带图的 PNG
- 这是批次 1 的验收阻塞项，不是后续优化

### R6 — 状态层瘦身（P1）

约 1400 行状态管线（`AsyncStorageManager` 415 行 + `useAsyncState` 320 行
+ 4 个 Context + 1 个 `@deprecated` 门面）服务于「3 道单选题 + 1 个结果对象」。

- 删除把同步 localStorage 包装成异步批处理队列的抽象
- Context 数量收敛，删除 deprecated 门面
- `PerformanceMonitor` 不再默认挂载于 root layout
- 手写的 cache / api-optimization / performance / image-optimization 工具按需删除或替换

### R7 — 打通发布闭环（P1，产品）

schema 里有 `RecommendationStatus.PUBLISHED` 和 `publishedCocktailId` 外键，
但全仓库没有任何代码写入它们，也没有任何路径把生成的酒写入 `Cocktail` 表。
`/gallery` 永远只有 3 杯 seed 数据。

- 用户可以把自己的推荐发布到公共 gallery
- Gallery 搜索从 6 列 `contains` 全表扫改为可索引方案
- 发布内容需要有最低限度的滥用控制

### R8 — 可观测性与测试（P2）

- 结构化日志替代 console 包装
- 核心指标：推荐成功率、生图成功率、限流命中率、gallery 查询延迟
- 错误上报
- 生成管线与 API 路由具备测试覆盖，provider 可 mock
- 主流程 e2e 覆盖（当前 e2e 只点了两下）

## Non-Goals

- 不引入用户账号 / 登录体系（匿名 + editToken 模型保留）
- 不迁移到 Vercel，不引入 Redis
- 不重做 vaporwave 视觉方向（组件实现可改，设计语言保留）
- 不做移动端原生应用
- 不在本轮引入多语言（保持 cn / en 两种）

## Task Map

按依赖与风险排序。**顺序是契约**，写在此处而非由树形位置隐含。

| # | 子任务 | 优先级 | 依赖 | 交付物 | 粗估 |
| --- | --- | --- | --- | --- | --- |
| 1 | `09-04-sec-image-storage` | P0 | 无 | R1 + R2 | 3–4 天 |
| 2 | `09-04-ai-pipeline` | P0 | 无 | R3 | 3–4 天 |
| 3 | `09-04-i18n-foundation` | P1 | 无 | R5.1 + R5.2 | 2 天 |
| 4 | `09-04-data-model` | P1 | 1、2、3 | R4 | 4–5 天 |
| 5 | `09-04-i18n-rsc` | P1 | 4 | R5.3 + R5.4 + R3.CSP | 3 天 |
| 6 | `09-04-publish-gallery` | P1 | 4 | R7 | 3–4 天 |
| 7 | `09-04-state-slimdown` | P1 | 5 | R6 | 2–3 天 |
| 8 | `09-04-observability-tests` | P2 | 1–7 | R8 + `output: standalone` | 3–4 天 |

粗估为单人投入的净工作日，不含 review 与等待时间。合计约 **23–29 个工作日**。
批次 1/2/3 并行、5/6 并行的情况下，日历周期约 **5–7 周**。

依赖说明：

- 1、2、3 三者无共享文件，可完全并行。交集见「批次间文件契约」
- 4 依赖 1、2、3：图片字段形态（1）、AI 输出 schema 与 vocabulary（2）
  共同决定目标数据模型；而 locale-keyed 内容需要 i18n 层先能按 locale 取值（3）
- 5 依赖 4，RSC 化要在稳定的数据类型上做，否则要改两遍
- 6 依赖 4，发布路径要写入 `Cocktail` 表，表结构必须先定稿
- 7 依赖 5，服务端化会先消化掉一部分客户端状态，剩下的才是真正要瘦身的
- 8 最后，指标口径取决于前七项的最终形态

> **修订记录（review 后）**：原计划把 i18n 整体排在 data-model 之后，依赖方向是
> 错的 —— data-model 的 locale-keyed 改造反过来需要 i18n 层先就位。故拆分为
> `i18n-foundation`（语言判定收敛，无依赖，前置）与 `i18n-rsc`（RSC 化 + SEO，
> 依赖 data-model）。同时把 CSP nonce 化从批次 1 移到批次 5 —— 二者都改
> `proxy.ts`，且 CSP 与图片存储无关，捆绑只会拖慢 P0 的合并。

## 批次间文件契约

并行批次之间的所有权划分，避免冲突。

| 文件 / 目录 | 所有者 | 其他批次的约束 |
| --- | --- | --- |
| `lib/domain/vocabulary.ts` | 批次 2 创建 | 批次 1、3 只读 |
| `lib/ai/**` | 批次 2 | 批次 1 不创建、不修改 |
| `api/openai.ts` | 批次 2 拆分 | 批次 1 只 import，不改 |
| `lib/storage/**` | 批次 1 创建 | 其他批次不动 |
| `lib/request-validation.ts` | 批次 1 做最小改动 | 批次 2 引入 zod 后，批次 4 整体退役该文件 |
| `proxy.ts` | 批次 3 改语言判定 | 批次 5 加 CSP nonce，需 rebase |
| `app/layout.tsx` | 批次 3 | 批次 5 再动 |
| `prisma/schema.prisma` | 批次 1 扩展 → 批次 4 收缩 → 批次 6 加索引 | 严格串行 |

**批次 1 与批次 2 的接口衔接**：批次 1 的图片管线直接调用现有的
`generateImage`（来自 `api/openai.ts`），**不引入 `ImageProvider` 抽象**。
批次 2 合并后，由批次 2 负责把批次 1 的调用点切到 `ImageProvider` 接口。
若批次 2 先合并，批次 1 rebase 时直接对接新接口。

## Cross-Cutting Acceptance Criteria

父任务只有在以下全部满足时才算完成。

- [ ] 每个子任务独立通过 `.trellis/spec/shared/verification.md` 的相关章节
- [ ] `pnpm lint`、`pnpm test`、`pnpm build`、`pnpm test:e2e` 在最终状态全绿
- [ ] `POST /api/image` 的请求体不含任何自由文本 prompt 字段
- [ ] `cocktails` 与 `recommendation_sessions` 两表均无 `image` / `thumbnail`
      这两个存 base64 的列（`\d cocktails` 核对）
- [ ] 相同问卷答案连续提交两次，返回两杯不同的酒（缓存已移除）
- [ ] 模型返回非法 JSON 时接口返回明确错误，而非落库一杯 "Unknown Cocktail"
- [ ] 全站不存在 `english_*` 双列模式
- [ ] `/cn` 与 `/en` 首页在禁用 JavaScript 时可渲染主要内容
- [ ] 分享卡片在图片迁移到 R2 后仍能产出带图的 PNG（R9）
- [ ] 用户生成的推荐可发布并出现在 `/gallery`
- [ ] e2e 覆盖 首页 → 问卷 → 推荐 → 生图 → 分享 → 发布 完整链路
- [ ] `docs/release-readiness.md` 中列出的 4 项生产阻塞项全部关闭
- [ ] `docs/performance-baseline.md` 更新为重构后的数据，其
      「Current Known Bottlenecks」逐条给出关闭或保留的结论
- [ ] `.trellis/spec/` 与最终代码一致（路由图、环境变量、脚本、验证命令）

## Rollout Constraints

- 每个子任务是一次独立可合并、可回滚的变更；不允许一个大 PR
- 涉及 schema 的子任务（1、3、6）必须提供正向迁移与回滚说明
- 线上已有真实数据，禁止 drop 重建；破坏性变更需要先做数据迁移再删列
- 每个子任务合并前需人工 review gate，不允许自动合入

## Notes

- 原始分析结论与证据见本目录 `research/`（若后续补充）
- `docs/release-readiness.md` 记录了 2026-04-08 的发布姿态，重构完成后需要重写
