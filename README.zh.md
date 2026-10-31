# MoodShaker

[English](./README.md)

中英双语（`/cn`、`/en`）的 AI 调酒师。回答四个问题：今晚的心情、想要多少酒精、家里有哪些基酒、要经典还是创意，就能拿到一份为你写的完整配方、一张酒的照片，和一张可以带走的酒单卡。喜欢的酒可以放上公开酒单。

## 技术栈

Next.js 16（App Router）· React 19 · TypeScript · Tailwind CSS 4 · Drizzle ORM + PostgreSQL · Zod · 任意 OpenAI 兼容的对话与图像接口 · Cloudflare R2

## 本地运行

```bash
pnpm install
cp .env.example .env            # 填入 API key 和 DATABASE_URL
pnpm db:init                    # 执行迁移并写入示例经典酒
pnpm dev
```

`pnpm test` 跑单元测试，`pnpm test:e2e` 跑 Playwright 冒烟测试，`pnpm typecheck`、`pnpm lint` 做静态检查。

有两个脚本会真的调用模型，每次运行都有少量费用：

- `pnpm eval:recipes [n …]`：用八个差异很大的点单跑一遍，并排打印配方、耗时和是否触发修复。改 `lib/ai/prompts.ts` 或换模型后都要跑。
- `pnpm seeds:build [n …]`：重新生成示例酒单（配方和照片），写入 `scripts/seed-data.ts` 和 `public/drinks/`。

## 结构

```
app/[lang]/              页面：首页、问卷、酒单、cocktail/[slug]（公开）、drink/[id]（私有）
app/api/drinks/          POST 调酒 · [id] 读取 · [id]/image 生成图片 · [id]/publish 上架/撤下
lib/domain/              词表代码、配方 schema（zod）、问卷 schema、slug
lib/ai/                  模型调用、提示词、带一次修复的生成
lib/db/                  drizzle schema、酒的查询、基于 Postgres 的限流
lib/storage.ts           下载图片 → 转 WebP → 上传 R2
lib/dictionaries/        中英文案，由同一个接口约束
proxy.ts                 语言跳转 + 每请求 CSP nonce
drizzle/                 版本化 SQL 迁移
```

代码坚持的几条规则：

- **配方只有一处定义。** `lib/domain/recipe.ts` 是存储形态，每个文本字段都有中英文。模型按语言各写一遍完整配方（`lib/ai/draft.ts`）；服务端检查两版能一一对应、中文里没有夹英文、基酒是客人家里有的、无酒精点单里没有酒，然后合并。
- **成本有上限。** 每次请求最多一次生成加一次修复。调酒按 IP 限流，生图按单杯和 IP 双重限流，计数都在 Postgres 里，多实例共享。
- **默认私有。** 新调出的酒只能凭 edit token 访问。token 只在创建时返回一次，库里只存哈希，浏览器存在 localStorage，只放在 POST body 里发送。
- **提示词在服务端拼。** 生图提示词来自库里的配方，不接受请求传入。

`pnpm test:e2e` 会自己启动 `pnpm dev`，所以需要可连接的 `DATABASE_URL`；如果要测已在运行的服务，设置 `E2E_BASE_URL`。

## 部署

推送 `v*` 标签会触发 `.github/workflows/release.yml`，构建镜像并推送到 Docker Hub 的 `simonsun3/moodshaker`。`docker compose up -d` 运行的是这个已发布的镜像和 Postgres，配置从 `.env` 读取（复制 `.env.example`）；要跑当前代码，先执行 `docker build -t simonsun3/moodshaker:latest .`。

容器启动时先执行迁移（`pnpm db:migrate`），写入三款经典酒，再启动 Next。数据库不可达时 `/api/health` 返回 503。配置项说明见 `.env.example`。

限流没有内存兜底：缺数据库是部署错误，不会静默降级。
