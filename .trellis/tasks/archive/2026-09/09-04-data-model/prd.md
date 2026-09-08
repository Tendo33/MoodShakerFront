# 数据模型统一

父任务：[09-04-moodshaker-restructure](../09-04-moodshaker-restructure/prd.md)
批次：4 / 8 — **依赖批次 1、2、3 全部合并**

## Goal

用 locale-keyed 结构 + 枚举 code 取代 `english_*` 双列与自由文本，
并清理由此衍生的全部启发式与兼容补丁。这是本次重构删代码最多的一批。

## Background

### 根因

「基酒」「酒精度」「风味」这三个**封闭可枚举集合**被存成了自由文本
（`base_spirit: "朗姆酒"` / `"Rum"`），于是每个边界都要做双语字符串子串匹配。
围绕这个错误长出了约 120 行代码：

- `lib/cocktail-data.ts` — `normalizeAlcoholLevel`、`normalizeBaseSpirit`、
  `inferEnglishBaseSpirit`、`inferEnglishAlcoholLevel`、`capitalizeKeyword`、
  `getFilterKeywords`、`SPIRIT_FILTER_KEYWORDS`、`FLAVOR_FILTER_KEYWORDS`、
  `ALCOHOL_FILTER_KEYWORDS`
- `inferEnglishBaseSpirit` 靠中文子串反推英文（`s.includes("朗姆") → "Rum"`），
  这是猜测而非数据

### 双列

`prisma/schema.prisma` 的 `Cocktail` 有 30 个标量列，其中 9 对是
`xxx` / `englishXxx` 双列。`lib/cocktail-types.ts` 的 `Cocktail` 接口同样
17 个字段配 `english_*` 孪生字段。

### 兼容补丁

- `runWithThumbnailCompatibility` — 为「该跑的迁移没跑」做运行时降级
- `isMissingThumbnailColumnError` / `logThumbnailMigrationHint`
- `isMissingJsonColumnError`（`app/api/image/route.ts`）
- `shouldUseBuildFallback()` — 判断 `DATABASE_URL.includes("placeholder")`，
  与 Dockerfile 的构建期占位符耦合
- `popularCocktails`（321 行）同时充当运行时 fallback 与 seed 数据

### 重叠类型

`Cocktail` / `GalleryCocktail` / `PublicCocktailSummary` / `PublicCocktailDetail`
四个接口大量重叠，映射函数在它们之间来回转。

## Requirements

### R4.1 — 枚举 code 落库

- `baseSpirit` / `alcoholLevel` / `flavorProfiles` 存 `lib/domain/vocabulary.ts` 的 code
- 显示文本从 i18n 字典查
- 删除全部 normalize / infer / keyword-mapping 函数

### R4.2 — locale-keyed 内容

- 自由文本字段收进 `content JSONB`，形如 `{ name: { cn, en }, ... }`
- 删除全部 `english_*` 列与 `english_*` 字段
- `Cocktail` 表由 30 个标量列压到约 10 个

### R4.3 — slug 取代 name 唯一

- `name @unique` 改为 `slug @unique`
- 两杯酒重名是合法的；URL 唯一才是真实需求

### R4.4 — 类型收敛

- 四个重叠接口收敛为「领域类型 + 按用途的 Pick/投影」
- 映射函数集中在 `lib/db/`，不散落

### R4.5 — 清理兼容补丁

- 删除 `runWithThumbnailCompatibility` 及配套错误识别
- 删除 `isMissingJsonColumnError`
- 删除 `shouldUseBuildFallback` 与构建期占位符耦合
- `popularCocktails` 只保留 seed 用途，不再作为运行时 fallback
- 删除已废弃的 `prisma/backfill-thumbnails.ts`

### R4.6 — 收缩迁移（不可逆）

删除批次 1 遗留的旧 base64 列与全部 `english_*` 列。

- 执行前必须全库备份
- 执行前必须确认批次 1 的回填已 100% 完成
- 这是本次重构**唯一不可逆的操作**，需单独确认

### R4.7 — zod 收编

把批次 1 遗留的手写校验器迁到 zod（`lib/request-validation.ts` 整体退役）。

## Dependencies

- **批次 1** — 图片列形态需先定稿，且回填必须已完成
- **批次 2** — vocabulary 与生成侧输出的 schema 决定了目标数据形态
- **批次 3** — locale-keyed 内容的展示需要 i18n 层能按 locale 取值，
  `pickLocalized` 等能力必须先就位

## Acceptance Criteria

- [ ] `grep -rn "english_\|englishName\|englishDescription" lib app components prisma` 无结果
- [ ] `grep -rn "normalizeAlcoholLevel\|inferEnglishBaseSpirit\|FILTER_KEYWORDS" .` 无结果
- [ ] `grep -rn "runWithThumbnailCompatibility\|shouldUseBuildFallback" .` 无结果
- [ ] `Cocktail` 表标量列数 ≤ 12
- [ ] 数据库中无 base64 图片列
- [ ] 迁移在存量数据副本上跑通，主流程功能无回归
- [ ] 迁移前已完成全库备份，备份可恢复（实测）
- [ ] `lib/request-validation.ts` 已删除，校验全部走 zod
- [ ] 干净库 `pnpm db:init` 后主流程可用
- [ ] `pnpm lint` / `pnpm test` / `pnpm build` / `pnpm db:init` 全绿
- [ ] 浏览器实测 `/cn` 与 `/en` 的 首页 / gallery / 详情 / 推荐

## Non-Goals

- 不改渲染策略（批次 5）
- 不改客户端状态层（批次 7）
- 不加全文检索（批次 6）
- 不拆翻译子表（父任务已决定 JSONB 更合适）
