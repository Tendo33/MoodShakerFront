# i18n 语言判定收敛

父任务：[09-04-moodshaker-restructure](../09-04-moodshaker-restructure/prd.md)
批次：3 / 8 — **无前置依赖，可与批次 1、2 并行**

交付父任务的 R5.1 与 R5.2。渲染策略与 SEO 归批次 5 `i18n-rsc`。

## Goal

把语言真相源收敛到 `[lang]` 路由参数，并让字典具备类型约束。

## 为什么必须排在 data-model 之前

原规划把整个 i18n 排在 `data-model` 之后，理由是「RSC 化要在稳定数据类型上做」。
review 时发现依赖方向对语言判定这半边是**反的**：

批次 4 `data-model` 要把 `english_*` 双列改成 locale-keyed 的 `content` JSONB，
展示层从此必须按 locale 取值。如果那时 i18n 还是「客户端 Context + 平铺字典
+ 三处各自判定语言」，data-model 的展示层改造会非常别扭，且很可能要返工。

而语言判定收敛本身**不依赖任何数据模型**，它是纯路由与上下文的问题。
故拆出来前置。

## Background

三处各自决定语言：

| 位置 | 依据 |
| --- | --- |
| `proxy.ts:20` | cookie `moodshaker-language` → `accept-language` → 默认 cn，重定向并写 24h cookie |
| `app/layout.tsx:75` | 内部 header `next-url` → `x-nextjs-rewritten-path` → cookie → accept-language |
| `context/LanguageContext.tsx:970` | pathname → localStorage → 默认值，带初始化 effect |

`app/layout.tsx` 读的 `next-url` 是 Next 的**内部 header，不是公开 API**，
Next 升级随时可能失效。项目 spec 已把 "route-groups-locale-drift" 列为已知坑 ——
那正是三处判定不一致的必然结果。

字典侧：

- `locales/index.ts` 的 `t: (key: string) => string`，写错 key 静默返回 key 本身
- `locales/cn.ts` / `en.ts` 各约 250 行平铺 `Record<string, string>`
- 无插值、无复数
- 两个文件的 key 集合没有任何机制保证一致（一边加了另一边忘了加，静默降级）

## Requirements

### R5.1 — 单一真相源

- 语言只由 `[lang]` 路由参数决定
- `proxy.ts` 只保留「无语言前缀 → 补前缀」的重定向，不再持有语言状态
- `app/layout.tsx` 停止读 `next-url` 与 `x-nextjs-rewritten-path`
- `<html lang>` 由 `app/[lang]/layout.tsx` 提供
- `LanguageContext` 降级为只读 locale + 字典切片：删除初始化 effect、
  删除 localStorage 往返、删除 `isLoading` 状态
- cookie 仅用于「用户显式切换语言后的下次落地页选择」，不参与当前请求的语言判定

### R5.2 — 字典与类型

- 字典按 namespace 拆分（如 `home` / `questions` / `cocktail` / `error` / `share`）
- `t()` 的 key 有类型约束，写错 key 是 TypeScript 编译错误
- 两种语言的 key 集合由类型保证一致（一边缺 key 编译不过）
- 支持插值

### R5.3 — 为 data-model 预留 locale 取值能力

批次 4 会引入 `Localized<T> = Record<Locale, T>`。本批次需提供配套的读取方式，
使批次 4 的展示层可以直接按当前 locale 取值，无需再造轮子。

- 提供 `pickLocalized(value: Localized<T>, locale: Locale): T` 或等价能力
- 该函数放在 `lib/domain/` 下，同构可用（服务端与客户端均可 import）

## Dependencies

无。可与批次 1、2 并行。

**文件冲突提醒**：本批次改 `proxy.ts` 与 `app/layout.tsx`。批次 5 会再动
`proxy.ts` 加 CSP nonce，届时批次 5 需 rebase。批次 1、2 不碰这两个文件。

## Acceptance Criteria

- [ ] `grep -rn "next-url\|x-nextjs-rewritten-path" app lib components context` 无结果
- [ ] 语言判定逻辑只存在于一处，且该处以 `[lang]` 路由参数为输入
- [ ] `t("不存在的key")` 是 TypeScript 编译错误
- [ ] 在 `cn.ts` 中加一个 key 而不在 `en.ts` 中加，`pnpm build` 失败
- [ ] 插值可用（至少一处真实调用点使用）
- [ ] `LanguageContext` 不再有初始化 effect 与 `isLoading`
- [ ] 直接访问 `/en/questions` 时页面语言为英文，且首屏无语言闪烁
- [ ] 显式切换语言后 URL、`<html lang>`、页面内容三者一致
- [ ] `pickLocalized` 或等价能力已就位并有测试
- [ ] `pnpm lint` / `pnpm test` / `pnpm build` 全绿
- [ ] 浏览器实测所有现有路由的 `/cn` 与 `/en`，无回归

## Non-Goals

- 不做 RSC 化（批次 5）
- 不做 SEO（批次 5）
- 不做 CSP nonce（批次 5）
- 不引入 i18n 框架（next-intl 等），自建字典足够
- 不引入第三种语言
- 不改文案内容本身，只改组织方式
