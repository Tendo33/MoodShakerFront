# 发布闭环与 Gallery

父任务：[09-04-moodshaker-restructure](../09-04-moodshaker-restructure/prd.md)
批次：6 / 8 — 依赖批次 4；与批次 5 可并行

## Goal

打通「用户生成的酒 → 公共 gallery」这条路径，并让 gallery 搜索能走索引。
这是本次重构中**唯一新增产品能力**的批次。

## Background

### 闭环是断的

`prisma/schema.prisma` 定义了：

```prisma
enum RecommendationStatus { PRIVATE  PUBLISHED }
model RecommendationSession {
  status              RecommendationStatus @default(PRIVATE)
  publishedCocktailId String?
  publishedCocktail   Cocktail? @relation(...)
}
```

全仓库检索确认：**没有任何代码写入 `status = PUBLISHED` 或 `publishedCocktailId`**，
也没有任何路径把生成的酒写进 `Cocktail` 表（唯一的写入方是 `prisma/seed.ts`）。

结果：`/gallery` 永远只有 3 杯 seed 数据（mojito / margarita / cosmopolitan）。
用户生成的酒进了私有 session 就再也见不到。这是这个产品最大的价值漏点 ——
AI 生成的内容没有沉淀，也没有社交/发现价值。

### 搜索必然全表扫

`lib/cocktail-data.ts:503` 的 `getGalleryCocktails`：搜索词对
`name` / `englishName` / `description` / `englishDescription` /
`baseSpirit` / `englishBaseSpirit` 六列做 `contains` + `mode: insensitive`，
外加两个数组列的 `hasSome`。

`contains` 生成 `ILIKE '%term%'`，前置通配符使任何 B-tree 索引失效。
数据量上来必然全表扫。

（批次 4 已把 spirit / alcohol / flavor 改成 enum code 过滤，可走索引；
本批次只剩自由文本搜索需要解决。）

## Requirements

### R7.1 — 发布路径

- 推荐结果页提供「发布到酒单库」动作
- 需持有该推荐的 `editToken` 才能发布
- 发布时把 `cocktailPayload` 落成 `Cocktail` 行，回写
  `publishedCocktailId` 与 `status = PUBLISHED`
- 同一推荐重复发布是幂等的，不产生重复 `Cocktail` 行
- 提供撤回发布的路径

### R7.2 — 滥用控制

匿名发布必须有下限约束，否则 gallery 会变成垃圾场。

- 发布限流（按 IP + 按 session）
- 发布前的最低内容完整性校验（复用批次 2 的 zod schema）
- 重复内容检测（至少做 slug 冲突处理）
- 保留管理员下架能力（可以是直接操作数据库的运维路径，不必做后台 UI）

### R7.3 — 全文检索

- 引入 `tsvector` 列 + GIN 索引，覆盖 cn 与 en 两种语言的内容
- 中文分词方案需评估：`pg_trgm` 对中文子串匹配更实用，
  `to_tsvector('simple', ...)` 对英文足够；允许两者组合
- 搜索走索引，不再六列 `ILIKE '%...%'`
- `tsvector` 列由触发器或应用层在写入时维护，需明确选型

### R7.4 — Gallery 体验

- 分页保持 cursor 方式
- 补充排序选项（最新 / 热门，若无热度数据则只保留最新）
- 空结果与加载态有明确 UI

## Dependencies

**批次 4 `data-model`** — 发布路径要写入 `Cocktail` 表，
表结构（content JSONB + enum code + slug）必须先定稿。

## Acceptance Criteria

- [ ] 用户可以把自己的推荐发布，随后在 `/gallery` 中看到它
- [ ] 无 `editToken` 时发布被拒绝
- [ ] 同一推荐重复发布不产生第二条 `Cocktail` 记录
- [ ] 可以撤回发布，撤回后不再出现在 gallery
- [ ] 发布限流生效
- [ ] slug 冲突有确定的处理策略，不会 500
- [ ] `EXPLAIN ANALYZE` 显示 gallery 搜索走索引，无 Seq Scan
- [ ] 中文与英文关键词都能搜到对应的酒
- [ ] 造 1000 条数据后搜索响应时间在可接受范围（记录数据）
- [ ] `pnpm lint` / `pnpm test` / `pnpm build` / `pnpm db:init` 全绿
- [ ] 浏览器实测 `/cn` 与 `/en` 的 gallery 搜索、过滤、分页、发布、撤回

## Non-Goals

- 不做用户账号（发布仍是匿名 + editToken）
- 不做点赞 / 评论 / 收藏
- 不做管理后台 UI
- 不做推荐算法排序
