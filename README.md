<div align="center">

# MoodShaker

**回答四个问题，拿到一杯属于今晚的酒。**

中英双语的 AI 调酒师：给你一份写好的配方、一张酒的照片，和一张可以带走的酒单卡。

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat-square&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/developer-platform/r2/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

[![License](https://img.shields.io/badge/License-MIT-2EA043?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A522-339933?style=flat-square&logo=nodedotjs&logoColor=white)](package.json)
[![pnpm](https://img.shields.io/badge/pnpm-10.9.0-F69220?style=flat-square&logo=pnpm&logoColor=white)](package.json)

[快速开始](#快速开始) · [工作原理](#工作原理) · [接口](#接口) · [配置](#配置) · [部署](#部署)

<sub>中文 · [English](README_en.md)</sub>

<img src="docs/screenshots/home.webp" alt="MoodShaker 首页：左边是六个心情色块，右边是一杯「暮色浆果」的照片" width="900">

</div>

---

## 这是什么

不是鸡尾酒配方的搜索页，也不是一个聊天框。你回答四个问题：

| 问题 | 可选项 |
| --- | --- |
| 今晚什么心情 | `unwind` 放松 · `celebrate` 庆祝 · `blue` 低落 · `romantic` 浪漫 · `spark` 兴奋 · `reflect` 安静 |
| 想要多烈 | `none` 无酒精 · `light` · `medium` · `strong` |
| 家里有什么基酒 | `gin` · `vodka` · `rum` · `tequila` · `whiskey` · `brandy`，可以一个都不选 |
| 要经典还是创意 | `classic` · `creative` |

剩下的交给模型：它写出一份完整配方（材料、用量、步骤、杯型），服务端校验通过后生成一张照片。你不喜欢就再摇一杯，喜欢就把它放上公开酒单。

## 界面

浅色纸面、大字号，一杯酒就是一张票。首页先让你挑心情，四个问题都在同一屏里推进：

| 问卷 | 一杯酒 |
| --- | --- |
| <img src="docs/screenshots/questions.webp" alt="问卷第一问：六个心情各自配一杯酒的照片与一句解释"> | <img src="docs/screenshots/drink.webp" alt="金汤力详情页：照片、中英名、风味描述，右侧是带编号的酒票，列出基酒、酒精度、杯型、用时和风味"> |

酒单按心情和基酒两行筛选，每格是一条记录：

<img src="docs/screenshots/gallery.webp" alt="酒单：第一行按心情筛选，第二行按基酒筛选，下面是每杯酒的照片卡片" width="900">

窄屏上先看酒，再挑心情：

<img src="docs/screenshots/home-mobile.webp" alt="手机上的首页：标题、一杯立在它心情色上的酒，下面是六个心情色块" width="300">

## 快速开始

需要 Node.js 22 或更新版本，以及一个能连上的 PostgreSQL。限流计数存在 Postgres 里，没有数据库就没有能跑的版本。

```bash
pnpm install
cp .env.example .env
pnpm db:init
pnpm dev
```

`cp .env.example .env` 复制的是带注释的配置模板，至少填 `OPENAI_API_KEY` 和 `DATABASE_URL`；想要照片就再填 `IMAGE_API_KEY`。`pnpm db:init` 执行迁移并写入示例经典酒。

打开 `http://localhost:3000`，语言跳转把你带到 `/cn` 或 `/en`。首页先问今晚的心情，答完四个问题会停在一杯私有酒的页面 `/cn/drink/<id>`。

## 常用脚本

```bash
pnpm test          # 单元测试
pnpm test:e2e      # Playwright 冒烟测试，会自己启动 pnpm dev
pnpm typecheck     # 类型检查
pnpm lint          # ESLint
```

`pnpm test:e2e` 需要可连接的 `DATABASE_URL`；要测已经在跑的服务，设置 `E2E_BASE_URL`。

两个脚本会真的调用模型，每次都有少量费用：

| 命令 | 作用 |
| --- | --- |
| `pnpm eval:recipes [n …]` | 用八个差异很大的点单跑一遍，并排打印配方、耗时和是否触发修复。改 `lib/ai/prompts.ts` 或换模型后都要跑 |
| `pnpm seeds:build [n …]` | 重新生成示例酒单（配方和照片），写入 `scripts/seed-data.ts` 和 `public/drinks/` |
| `pnpm seeds:build stages` | 重拍首页的两张静物图 |
| `pnpm seeds:build reframe` | 不调用模型，只把已有照片按当前规则重新处理 |

改表结构走 `pnpm db:generate`，它会在 `drizzle/` 里生成一份带版本号的 SQL；容器启动时用 `pnpm db:migrate` 应用这些文件，不会把 schema 直接推到数据库。

## 工作原理

一次调酒从问卷到上架，中间每一步都有明确的边界：

```mermaid
flowchart LR
    A[问卷<br/>四个封闭代码字段] --> B[POST /api/drinks<br/>order schema 校验]
    B --> C[生成配方<br/>lib/ai/generate.ts]
    C --> D[按语言各写一遍<br/>cn + en]
    D --> E[服务端校验<br/>两版对齐、基酒合规]
    E --> F[(PostgreSQL<br/>私有酒 + editToken 哈希)]
    E --> G[生成照片<br/>POST /api/drinks/:id/image]
    G --> H[(Cloudflare R2<br/>WebP)]
    F --> I[私有酒页面<br/>/drink/:id]
    H --> J{主人决定}
    J -->|上架| K[公开酒单<br/>/gallery、/cocktail/:slug]
    J -->|不想要| L[再摇一杯]

    classDef client fill:#3B82F6,stroke:#2563EB,color:#fff,stroke-width:2px
    classDef service fill:#10B981,stroke:#059669,color:#fff,stroke-width:2px
    classDef data fill:#8B5CF6,stroke:#7C3AED,color:#fff,stroke-width:2px
    classDef choice fill:#F59E0B,stroke:#D97706,color:#fff,stroke-width:2px

    class A,I,K,L client
    class B,C,D,E,G service
    class F,H data
    class J choice
```

代码坚持的几条规则：

- **配方只有一处定义。** `lib/domain/recipe.ts` 是存储形态，每个文本字段都有中英文。模型按语言各写一遍完整配方（`lib/ai/draft.ts`）；服务端检查两版能一一对应、中文里没有夹英文、基酒是客人家里有的、无酒精点单里确实没有酒，然后合并。
- **成本有上限。** 每次请求最多一次生成加一次修复。调酒按 IP 每 5 分钟 4 次，生图按单杯和 IP 双重限流，计数都在 Postgres 里，多实例共享。
- **酒单由照片组成。** 没有照片的酒不能上架，接口返回 `IMAGE_REQUIRED`（409）。上架按 IP 限每小时 10 次，因为这里消耗的是公开数据行，不是算力。
- **默认私有。** 新调出的酒只能凭 edit token 访问。token 只在创建时返回一次，库里只存哈希，浏览器存在 localStorage，只放在 POST body 里发送。
- **提示词在服务端拼。** 生图提示词来自库里的配方，不接受请求传入。

## 目录结构

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

## 接口

所有酒的接口收发 JSON。读取私有酒、生成图片和上架都需要 edit token。

| Method | Path | 用途 |
| --- | --- | --- |
| `POST` | `/api/drinks` | 调酒：校验问卷、生成配方，返回这杯酒和只出现一次的 `editToken` |
| `POST` | `/api/drinks/[id]` | 读取私有酒；body 里带 `editToken` |
| `POST` | `/api/drinks/[id]/image` | 生成并存储这杯酒的照片 |
| `POST` | `/api/drinks/[id]/publish` | 上架到公开酒单；需要已有照片 |
| `DELETE` | `/api/drinks/[id]/publish` | 从酒单撤下，保留 slug 以便再次上架 |
| `GET` | `/api/health` | Postgres 正常时返回 `200`，不可达时返回 `503` |

失败时返回 `{ error: { code, requestId } }`，`code` 形如 `IMAGE_REQUIRED`、`RATE_LIMITED`、`INTERNAL`；反馈问题时请附上 `requestId`。

## 配置

所有配置项都在 `.env.example` 里有说明，下表默认值取自该文件。

| 变量 | 用途 | 默认值 |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://postgres:postgres@localhost:5432/moodshaker` |
| `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL` | 任意 OpenAI 兼容的对话接口及其模型 | `https://api.siliconflow.cn/v1`、`deepseek-ai/DeepSeek-V3.2` |
| `OPENAI_SUPPORTS_JSON_SCHEMA` | 确认接口真的强制 `json_schema` 后才打开 | `false` |
| `OPENAI_DISABLE_THINKING` | 发送 `enable_thinking=false`，供 Qwen3 这类混合模型使用 | `false` |
| `IMAGE_PROVIDER` | `siliconflow`（Qwen-Image 请求体）或 `openai`（OpenAI Images 请求体） | `siliconflow` |
| `IMAGE_API_URL`、`IMAGE_API_KEY`、`IMAGE_MODEL` | 生图接口 | `https://api.siliconflow.cn/v1/images/generations`、`Qwen/Qwen-Image` |
| `IMAGE_FETCH_HOST_ALLOWLIST` | 图片 URL 额外允许的来源主机 | 空 |
| `R2_ACCOUNT_ID`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET`、`R2_PUBLIC_BASE_URL` | Cloudflare R2 图片存储 | `moodshaker-images`、`https://img.moodshaker.de` |
| `SITE_URL` | 用于 metadata、sitemap 和 JSON-LD 的规范地址 | `https://moodshaker.de` |
| `TRUSTED_PROXY_HOPS` | 应用前面的反向代理层数；为 `0` 时所有访客共用一个桶 | `0` |
| `TRUST_CLOUDFLARE` | 是否相信 `cf-connecting-ip`；只有源站不对其他来源开放时才打开 | `false` |

`docker compose` 会覆盖其中两项：`TRUSTED_PROXY_HOPS=1`、`TRUST_CLOUDFLARE=true`。

### 生图供应商

`IMAGE_PROVIDER` 默认是 `siliconflow`，请求体仍是 Qwen-Image。设为 `openai` 时调用 OpenAI Images 兼容接口：

```bash
IMAGE_PROVIDER=openai
IMAGE_API_URL="https://c2a.apimux.cc/v1/images/generations"
IMAGE_API_KEY=""
IMAGE_MODEL="gpt-image-2.6"
```

请求体包含 `model`、`prompt`、`size`（`1024x1024`）、`quality`（`high`）和 `n`（`1`）。生图常常要 20 到 60 秒，客户端等待 120 秒，遇到 429 或 5xx 会再试两次；超时不重试。返回 `b64_json` 时，走和临时图片 URL 相同的 WebP / R2 存储；返回 URL 时，只从 `IMAGE_API_URL` 的主机、内置的硅基流动主机，或 `IMAGE_FETCH_HOST_ALLOWLIST` 里的主机下载。

## 部署

镜像由 CI 推到 `ghcr.io/tendo33/moodshaker`（`linux/amd64`、`linux/arm64`），服务器只拉镜像：

```bash
cp .env.example .env
docker compose pull && docker compose up -d
```

第一次启动前先复制模板并填好配置；`docker compose` 读的也是这个 `.env`。固定或回滚版本用 `IMAGE_TAG=sha-abc1234 docker compose up -d`；要跑当前代码，叠加 build override：`docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build`。

| 触发 | workflow | 结果 |
| --- | --- | --- |
| PR | `ci.yml`、`image.yml` | lint、typecheck、test、build，再用生产构建跑 Playwright 冒烟测试；试构建镜像，不推送 |
| 推 `main` | `image.yml` | 检查通过后推送 `sha-<7 位>` 和 `latest` |
| 推 `v*` 标签 | `image.yml`、`release.yml` | 检查通过后推送 `<版本>`、`<主>.<次>`，并创建 GitHub Release |

容器启动时先执行迁移（`pnpm db:migrate`），写入种子酒单（并与 `scripts/seed-data.ts` 保持一致：有变化的种子会被更新，已移除的会被删掉），再启动 Next。数据库不可达时 `/api/health` 返回 503。

限流没有内存兜底：缺数据库是部署错误，不会静默降级。

限流按访客计数，而访客地址来自客户端可以伪造的请求头，所以要明确信任哪一层代理：`TRUSTED_PROXY_HOPS` 是应用前面的反向代理层数；站点在 Cloudflare 后面时设 `TRUST_CLOUDFLARE=true`（compose 文件的默认值；其他情况设为 `false`，并且源站只接受 Cloudflare 回源）。两者都没设时，所有访客共用一个限流桶。

## 贡献

给 agent 和维护者的工作约定写在仓库的 `AGENTS.md` 里，视觉规则在 `DESIGN.md`。只用 pnpm，不要引入 npm 或 yarn 的 lockfile；保留 `/cn`、`/en` 路由，edit token 只走 POST body 的约定，以及基于 Postgres 的限流。

## 许可证

MIT，见 `LICENSE`。
