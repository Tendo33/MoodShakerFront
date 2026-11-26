# MoodShakerFront

双语 AI 鸡尾酒推荐产品，Next.js + Drizzle/PostgreSQL。不是通用 Next.js 模板。

## 不能破坏的契约

- 保留 `/cn` 与 `/en` 本地化路由、`proxy.ts` 的语言检测、以及本地化词典。
- 私密酒单用 POST body 里的 `editToken`，绝不放进 URL。它只由 `POST /api/drinks` 返回一次，库里只存 SHA-256 哈希，其他任何响应都不能带出。
- Drizzle 结构变更走 `pnpm db:generate`（生成的 SQL 在 `drizzle/`），并要在本地库跑通 `pnpm db:init`。
- 生产环境缺少共享限流存储属于部署错误，不能静默退化成进程内限流。
- 只用 pnpm，不要引入 npm/yarn 的 lockfile。
- 视觉规则在 `DESIGN.md`。

## 命令

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test          # node --test，覆盖 tests/**/*.test.ts
pnpm test:e2e      # Playwright
pnpm build
pnpm db:generate   # 生成迁移
pnpm db:init       # migrate + seed，需要本地库
```

## 验证

改动后端或数据层要跑 typecheck 与 test；涉及路由、语言切换、私密酒单的改动补 e2e。视觉改动对照 `DESIGN.md`，不另起一套。

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
