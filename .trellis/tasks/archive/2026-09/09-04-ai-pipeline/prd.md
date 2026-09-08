# AI 生成管线重写

父任务：[09-04-moodshaker-restructure](../09-04-moodshaker-restructure/prd.md)
批次：2 / 8 — 与批次 1、3 可并行（交集仅 `lib/domain/vocabulary.ts`，由本批次创建）

## Goal

把「模型说什么就存什么」的管线改造成「模型输出必须通过 schema 才允许落库」，
并消除生成结果的跨用户复用与不受控的重试放大。

## Background

`lib/cocktail-generation.ts:72` 的 `parseCocktailFromCompletion`：

```ts
const jsonMatch = completion.match(/\{[\s\S]*\}/);      // 正则抠 JSON
const cocktail = JSON.parse(jsonMatch[0]) as Cocktail;  // 强制断言，无校验
return { name: cocktail.name || "Unknown Cocktail", ... }  // 全字段 || 兜底
```

后果：模型返回任何形状的 JSON 都会被接受，缺字段静默变成默认值，
最终在数据库里留下一杯叫 "Unknown Cocktail" 的酒。

其余四处缺陷：

1. `utils/prompts.ts` 的 `JSON_SCHEMA` 是贴在 system prompt 里的文本，
   **完全没有 `english_*` 字段**，但 `Cocktail` 类型和 DB 都要 —— 双语数据从生成起就残缺
2. `api/openai.ts:79` 给 chat completion 设了 `cacheTTL: 10 * 60 * 1000`。
   相同问卷答案的两个用户在 10 分钟内拿到**逐字相同**的推荐，`temperature: 0.8` 失效
3. 词表三套打架：prompt 里写 `none/low/medium/high`，`AlcoholLevel` enum 同上，
   而 `lib/cocktail-data.ts:141` 的 `normalizeAlcoholLevel` 转成 `低度/中度/高度`
4. 重试放大：客户端 `COCKTAIL_REQUEST_RETRY_LIMIT = 2` × `optimizedFetch`
   的 `retryCount: 1`（循环 `attempt <= retryCount` 即 2 次）= 一次失败最多打 4 次 LLM，
   每次 `max_tokens: 5000`，无成本上限

## Requirements

### R3.1 — schema 单一真相源

- 引入 `zod`，`lib/ai/cocktail-schema.ts` 是唯一的鸡尾酒输出定义
- 从该 schema 派生：TS 类型、送给 provider 的 JSON Schema、运行时校验器
- prompt 中的字段说明由 schema 生成，不手写第二份

### R3.2 — 输出必须校验

- 模型输出经 `safeParse` 通过后才允许落库
- 失败时带 zod 错误信息做**至多 1 次**修复重试
- 再失败抛错，接口返回明确错误码，**不落库**
- 删除正则抠 JSON 与全部 `|| "默认值"` 兜底

### R3.3 — provider 抽象

- `lib/ai/provider.ts` 定义 `LLMProvider` / `ImageProvider` 接口
- `lib/ai/providers/openai-compatible.ts` 为默认实现
- provider 声明 `supportsJsonSchema`；支持则用 `response_format: json_schema`，
  否则降级 `json_object` + zod 校验 + 修复重试
- 切换 provider 只改环境变量

### R3.4 — 移除生成结果缓存

- 删除 `getChatCompletion` 的 completion 缓存
- 保留同一 in-flight 请求的去重，但不跨请求复用结果

### R3.5 — 调用预算

- 单次用户请求的 LLM 调用上界 = 2（1 次生成 + 至多 1 次修复重试）
- 网络层重试只对连接失败生效，不对已返回的 4xx/5xx 生效
- 移除客户端与 `optimizedFetch` 的重试叠加
- 记录每次调用的 token usage

### R3.6 — 唯一词表

- 新增 `lib/domain/vocabulary.ts`：基酒 / 酒精度 / 风味 / 难度的 code 常量
- schema 中这些字段是 enum，模型只能输出 code
- 本批次先让生成侧输出 code；DB 侧的迁移在批次 3

### R3.7 — 完整双语输出

- schema 中每个文本字段是 `{ cn: string, en: string }`
- prompt 明确要求两种语言语义对应而非机翻
- 可枚举字段只输出 code（语言无关）

### R3.8 — 流式（可降级）

- 目标：route handler 流式返回，客户端渐进渲染，删除假进度条与轮换文案
- 若实现成本过高，允许降级为「真实阶段进度」，但必须在本任务 `design.md`
  中记录降级理由

## 前置验证（开工第一步）

本批次的核心假设是「provider 支持结构化输出」。**开工第一件事**是用 curl
对配置中的 `OPENAI_BASE_URL` + `OPENAI_MODEL` 实测：

```bash
# 1. 测 response_format: json_schema 是否被接受
# 2. 若不支持，测 response_format: json_object 是否被接受
# 3. 两者都不支持则只能靠 prompt 约束 + zod 校验 + 修复重试
```

结果写入本任务 `design.md`，它决定 `supportsJsonSchema` 的默认值与降级路径。
**不要先写代码再发现 provider 不支持。**

## Dependencies

无前置依赖。与批次 1、3 并行时注意：

- `lib/domain/vocabulary.ts` 由**本批次创建**，批次 1 只读
- 本批次会拆分 `api/openai.ts`；批次 1 承诺不修改该文件
- 若本批次先合并，批次 1 rebase 后把 `generateImage` 的 import 指向新位置
- 批次 1 **不引入** `ImageProvider` 抽象；本批次定义该接口后，
  **由本批次负责**把批次 1 的图片管线调用点切过来
- 本批次删除顶层 `api/` 目录后，**必须同步修改 Dockerfile** 的
  `COPY --from=builder /app/api ./api`，否则镜像构建失败

## Acceptance Criteria

- [ ] 相同问卷答案连续提交两次，返回两杯不同的酒
- [ ] 模型返回非法 JSON 时接口返回明确错误码，数据库中无新记录
- [ ] 生成结果的 `name` / `description` / `matchReason` 等字段 cn 与 en 均非空
- [ ] `alcoholLevel` / `baseSpirit` / `flavorProfiles` 输出的是 vocabulary code
- [ ] 单次失败请求的 LLM 调用次数 ≤ 2（日志可验证）
- [ ] 切换 `OPENAI_BASE_URL` / `OPENAI_MODEL` 到另一个兼容端点后功能正常
- [ ] `grep -rn "jsonMatch" lib app` 无结果（正则抠 JSON 已移除）
- [ ] `grep -rn "Unknown Cocktail" .` 无结果
- [ ] token usage 出现在日志中
- [ ] `pnpm lint` / `pnpm test` / `pnpm build` 全绿
- [ ] 生成管线有单元测试，provider 可 mock

## Non-Goals

- 不改数据库 schema（批次 4）
- 不改图片链路（批次 1）
- 不做 i18n 展示层改造（批次 3 / 5）
- 不引入多模型路由 / fallback provider 链
