# RSC 化与 SEO

父任务：[09-04-moodshaker-restructure](../09-04-moodshaker-restructure/prd.md)
批次：5 / 8 — 依赖批次 4 `data-model`；与批次 6 可并行

交付父任务的 R5.3、R5.4，以及从批次 1 移入的 CSP nonce 化。

> 语言判定收敛（R5.1 / R5.2）已拆到批次 3 `i18n-foundation` 前置完成。
> 本批次假定语言真相源已经唯一，字典已 namespace 化且有类型约束。

## Goal

内容型页面回归 Server Component，补齐 SEO，完成 CSP nonce 化。

## Background

### 全站 CSR

`app/[lang]/page.tsx:6` 用 `dynamic()` 加载 `"use client"` 的 `Home` 组件，
首页变成「转圈 → 再渲染」。`questions`、`cocktail/recommendation` 同样。
一个菜谱站放弃了 SSR 与 SEO。

注释里写着「在 App Router 中，我们移除了 `ssr: false`，因为 Home 组件已经使用
`use client`」—— 这个推理是错的：`dynamic()` 包裹客户端组件仍然会把它排除出
首屏 HTML，`ssr: false` 与否只影响是否在服务端预渲染，而 `dynamic` 本身
就制造了一次额外的加载瀑布。

### SEO 缺失

无 sitemap、无 robots、无 hreflang、无 OG image、无 Recipe JSON-LD。
`app/[lang]/page.tsx` 的 metadata 是硬编码英文，`/cn` 下也输出英文标题。

### CSP 形同虚设

`next.config.mjs` 的 `script-src 'self' 'unsafe-inline'` —— 允许内联脚本，
等于没有 CSP。静态 header 无法携带 per-request nonce，需移到 `proxy.ts` 生成。

## Requirements

### R5.3 — 渲染策略

| 页面 | 当前 | 目标 |
| --- | --- | --- |
| `/[lang]` | `dynamic()` + `"use client"` | Server Component，静态化 |
| `/[lang]/gallery` | Server Component（已正确） | 保持 |
| `/[lang]/cocktail/[id]` | Server 外壳 + 客户端内层 | 内容服务端渲染，仅交互部分 client |
| `/[lang]/questions` | `dynamic()` + `"use client"` | 外壳服务端化，表单本体保持 client |
| `/[lang]/cocktail/recommendation` | `dynamic()` + `"use client"` | 外壳服务端化，本体保持 client |

- 移除内容型页面上无谓的 `dynamic()` 包裹
- 保留 vaporwave 视觉与动效，不因服务端化而降级

### R5.4 — SEO

- `alternates.languages` hreflang
- `app/sitemap.ts`、`app/robots.ts`
- `opengraph-image`
- 鸡尾酒详情页 Recipe JSON-LD
- metadata 按语言生成，`/cn` 下输出中文标题与描述

### R3.CSP — CSP nonce 化（从批次 1 移入）

- CSP 移到 `proxy.ts` 按请求生成 nonce
- `script-src` 去掉 `'unsafe-inline'`
- 其余静态安全头留在 `next.config.mjs`
- 分两步落地：先加 nonce 保留 `'unsafe-inline'` 验证无水合回归，再收紧

风险：Next 自身的内联引导脚本需要 nonce。若 `strict-dynamic` 导致水合失败，
降级为 nonce + 保留 `'unsafe-inline'`（现代浏览器在有 nonce 时会忽略它），
并在本任务 `design.md` 中记录降级理由。

### R5.5 — 清理遗留 rewrite

`next.config.mjs` 有一条 rewrite：`/:lang/:path*` 在 `accept: image/*` 时
重写到 `/:path*`。这是为「语言前缀污染静态资源路径」打的补丁。
本批次动路由时评估其是否仍必要，能删则删。

## Dependencies

**批次 4 `data-model`** — RSC 化要在稳定的数据类型上做，否则展示层要改两遍。
**批次 3 `i18n-foundation`** — 语言真相源与字典类型必须先就位。

**文件冲突**：本批次改 `proxy.ts`，批次 3 已改过该文件，需 rebase。

## 基线前置

父任务验收要求「首页 LCP 有可测量改善」，但 `docs/performance-baseline.md`
只记录了 build time，**没有 LCP 数字**。

- 本批次动手前先在当前 `main` 上测一次 `/cn` 与 `/en` 首页的 LCP / FCP / TBT，
  写入 `docs/performance-baseline.md`
- 改造后同条件复测，两组数字都留档
- 没有基线就没有「改善」这个说法

## Acceptance Criteria

- [ ] 禁用 JavaScript 时 `/cn` 与 `/en` 首页可渲染主要内容
- [ ] 首页 HTML 源码中包含主要文案（`curl` 可见，非 JS 注入）
- [ ] `/cn` 页面的 `<title>` 与 `<meta name="description">` 是中文
- [ ] `/cn` 与 `/en` 互相有 hreflang 链接
- [ ] `/sitemap.xml` 与 `/robots.txt` 可访问且内容正确
- [ ] 详情页 Recipe JSON-LD 通过 Google Rich Results 校验
- [ ] 改造前后的 LCP 数字均已记录在 `docs/performance-baseline.md`
- [ ] 响应头 CSP 含 nonce，`script-src` 不含 `'unsafe-inline'`
- [ ] CSP 收紧后浏览器控制台无 CSP 违规、无水合报错
- [ ] `next.config.mjs` 的 image rewrite 已删除，或记录了保留理由
- [ ] `pnpm lint` / `pnpm test` / `pnpm build` 全绿
- [ ] 浏览器实测所有路由的 `/cn` 与 `/en`，vaporwave 视觉无回归（留截图）

## Non-Goals

- 不改语言判定逻辑（批次 3 已完成）
- 不改客户端状态层（批次 7）
- 不重做 vaporwave 视觉方向
- 不引入第三种语言
