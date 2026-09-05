# 状态层瘦身

父任务：[09-04-moodshaker-restructure](../09-04-moodshaker-restructure/prd.md)
批次：7 / 8 — 依赖批次 5

## Goal

删除约 1400 行为「3 道单选题 + 1 个结果对象」服务的状态管线。

## Background

### 核心误判

`utils/asyncStorage.ts`（415 行）把**同步的** `localStorage` 包装成
带 4ms 批处理队列（`BATCH_DELAY = 4`）、最大批量 10、5 分钟 TTL 内存缓存的
「异步存储管理器」，文件头注释写着「解决 localStorage 同步阻塞问题」。

读写几 KB JSON 的 `localStorage` 是微秒级操作。这个抽象没有解决真实问题，
却引入了「内存缓存与实际存储不一致」这一真实的 bug 面。

### 依赖它长出来的层

| 模块 | 行数 | 作用 |
| --- | --- | --- |
| `utils/asyncStorage.ts` | 415 | 上述管理器 |
| `hooks/useAsyncState.ts` | 320 | `useAsyncState` / `useBatchAsyncState`，仅服务于上者 |
| `context/CocktailContext.tsx` | 105 | 自身标注 `@deprecated` 的合并门面 |
| `utils/api-optimization.ts` | 197 | 手写 fetch 缓存 + 去重 + 重试 |
| `utils/cache-utils.ts` | 130 | 仅服务于上者 |
| `components/PerformanceMonitor.tsx` | 302 | 挂在 root layout，每页都发 |

`utils/api-optimization.ts` 的缓存语义对生成调用是错的（批次 2 已移除其在
AI 侧的使用），重试与上层叠加导致调用放大。

## Requirements

### R6.1 — 删除异步存储抽象

- 删除 `utils/asyncStorage.ts` 与 `hooks/useAsyncState.ts`
- 持久化直接用同步 `localStorage` 读写，加一层薄的类型化 helper 即可
- 保留 SSR 安全（`typeof window` 判断）

### R6.2 — Context 收敛

- 删除 `context/CocktailContext.tsx`（deprecated 门面）
- 调用方改用 `useCocktailForm` / `useCocktailResult`
- 简化 `CocktailResultContext`：批次 1 已删图片持久化逻辑，批次 4 已把
  部分状态服务端化，剩余部分重新评估

### R6.3 — 删除手写 fetch 层

- 删除 `utils/api-optimization.ts` 与 `utils/cache-utils.ts`
- 客户端数据获取统一走 `swr`（已在依赖中，当前仅 `CocktailRecommendation.tsx` 用）
  或原生 fetch

### R6.4 — PerformanceMonitor 移出 root layout

- 不再默认挂载于每个页面
- 由批次 8 用标准方案替代（Web Vitals 上报）

### R6.5 — 其余手写工具评估

`utils/performance-utils.ts`、`utils/animation-utils.ts`、
`utils/image-optimization.ts`、`utils/withTimeout.ts`、`utils/generateId.ts`、
`utils/style-constants.ts` 逐个评估：有真实调用方且不可替代则保留，否则删除。

## Dependencies

**批次 5 `i18n-rsc`** — 服务端化会先消化掉一部分客户端状态，
剩下的才是真正要瘦身的对象。先做批次 5 可以避免删了又加。

## Risk

一次性删 1400 行状态代码，隐藏行为可能丢失。

缓解：**动手前先补 e2e 覆盖主流程**（首页 → 问卷 → 推荐 → 生图 → 分享 →
刷新页面后状态恢复），有回归网再删。这是本批次排在批次 5 之后的原因之一。

## Acceptance Criteria

- [ ] `utils/asyncStorage.ts`、`hooks/useAsyncState.ts`、
      `context/CocktailContext.tsx`、`utils/api-optimization.ts`、
      `utils/cache-utils.ts` 均已删除
- [ ] `grep -rn "useCocktailContext\|useCocktail()" .` 无结果
- [ ] `PerformanceMonitor` 不在 `app/layout.tsx` 中
- [ ] 净删除行数 ≥ 1200
- [ ] 刷新页面后表单答案与推荐结果仍能恢复
- [ ] 中途关闭浏览器再打开，状态恢复行为与改造前一致
- [ ] e2e 覆盖主流程且通过
- [ ] `pnpm lint` / `pnpm test` / `pnpm build` / `pnpm test:e2e` 全绿
- [ ] 浏览器实测：无功能回归，无控制台报错

## Non-Goals

- 不改后端
- 不重做视觉
- 不引入状态管理库（Zustand / Jotai 等）—— 状态量不值得
