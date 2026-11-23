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
- `pnpm seeds:build [n …]`：重新生成示例酒单（配方和照片），写入 `scripts/seed-data.ts` 和 `public/drinks/`。`pnpm seeds:build stages` 重拍首页的两张静物图；`pnpm seeds:build reframe` 不调用模型，只把已有照片按当前规则重新处理。

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

## 生图供应商

`IMAGE_PROVIDER` 默认是 `siliconflow`，请求体仍是 Qwen-Image。设为 `openai` 时调用 OpenAI Images 兼容接口。c2a 的配置：

```bash
IMAGE_PROVIDER=openai
IMAGE_API_URL="https://c2a.apimux.cc/v1/images/generations"
IMAGE_API_KEY=""
IMAGE_MODEL="gpt-image-2.6"
```

请求体包含 `model`、`prompt`、`size`（`1024x1024`）、`quality`（`high`）和 `n`（`1`）。生图常常要 20 到 60 秒，客户端等待 120 秒，遇到 429 或 5xx 会再试两次；超时不重试。返回 `b64_json` 时，走和临时图片 URL 相同的 WebP / R2 存储。返回 URL 时，只从 `IMAGE_API_URL` 的主机、内置的硅基流动主机，或 `IMAGE_FETCH_HOST_ALLOWLIST` 里的主机下载。

## 部署

镜像由 CI 推到 `ghcr.io/tendo33/moodshaker`（`linux/amd64`、`linux/arm64`），服务器只拉镜像：

```bash
cp .env.example .env   # 然后填好配置
docker compose pull && docker compose up -d
```

这会运行已发布的镜像和 Postgres。固定或回滚版本：`IMAGE_TAG=sha-abc1234 docker compose up -d`。要跑当前代码：`docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build`。

| 触发 | workflow | 结果 |
|---|---|---|
| PR | `ci.yml`、`image.yml` | lint、typecheck、test、build，再用生产构建跑 Playwright 冒烟测试；试构建镜像，不推送 |
| 推 `main` | `image.yml` | 检查通过后推送 `sha-<7 位>` 和 `latest` |
| 推 `v*` 标签 | `image.yml`、`release.yml` | 检查通过后推送 `<版本>`、`<主>.<次>`，并创建 GitHub Release |

容器启动时先执行迁移（`pnpm db:migrate`），写入种子酒单（并与 `scripts/seed-data.ts` 保持一致：有变化的种子会被更新，已移除的会被删掉），再启动 Next。数据库不可达时 `/api/health` 返回 503。配置项说明见 `.env.example`。

限流没有内存兜底：缺数据库是部署错误，不会静默降级。

限流按访客计数，而访客地址来自客户端可以伪造的请求头，所以要明确信任哪一层代理：`TRUSTED_PROXY_HOPS` 是应用前面的反向代理层数；站点在 Cloudflare 后面时设 `TRUST_CLOUDFLARE=true`（compose 文件的默认值；其他情况设为 `false`，并且源站只接受 Cloudflare 回源）。两者都没设时，所有访客共用一个限流桶。
