# 技术设计 — AI 生成管线重写

父任务设计契约：[design.md](../09-04-moodshaker-restructure/design.md) 第 4 节。

## 1. 前置验证的结果（未能完成）

prd 要求「开工第一件事」是 curl 实测 provider 是否支持 `response_format:
json_schema`。**实测被阻塞**：

| 端点 | 结果 |
| --- | --- |
| `OPENAI_BASE_URL` (`ai2-api.i-tudou.com`) | **401 Invalid token** |
| `IMAGE_API_URL` (`api.siliconflow.cn`) | **402 余额不足** |

两个凭证各自失效，互不相关。通过真实代码路径（`getChatCompletion`）复核，
确认不是我拼错 URL 或取错变量名。

**因此 `supportsJsonSchema` 的默认值是 `false`**，由
`OPENAI_SUPPORTS_JSON_SCHEMA=true` 显式开启。理由：`json_object` 路径在所有
OpenAI 兼容端点上都可用，配合 zod 校验 + 一次修复重试足以保证输出质量；
而 `json_schema` 在不支持的端点上会直接 400，把一个能工作的链路变成不能工作的。
默认值选保守的一侧，代价只是可能多一次修复往返。

凭证恢复后应执行 prd 中的 curl 探测，确认支持则设该环境变量。

## 2. 模块划分与 server-only 边界

```
lib/domain/vocabulary.ts        词表单一真相源（code + label）  非 server-only
lib/ai/cocktail-schema.ts       zod schema → 类型/JSON Schema/校验器  非 server-only
lib/ai/prompts.ts               prompt 组装（纯字符串）        非 server-only
lib/ai/provider.ts              接口 + ProviderError           非 server-only
lib/ai/providers/openai-compatible.ts  读凭证、发请求          **server-only**
lib/ai/cocktail-generation.ts   编排：prompt→provider→校验→修复  非 server-only
lib/ai/image-prompt.ts          批次 1 的安全修复              **server-only**
```

### 为什么不是全部 server-only（实现期修正）

初版给 `lib/ai/**` 全部加了 `server-only`。这导致生成管线**无法在
`node:test` 中导入**，而 prd 明确要求「生成管线有单元测试，provider 可 mock」。

`server-only` 是安全边界标记，不是「服务端代码」的装饰。只有两类模块真正需要：

1. **读凭证的模块** —— `providers/openai-compatible.ts` 读 `OPENAI_API_KEY` /
   `IMAGE_API_KEY`，泄漏到客户端 bundle 就是密钥泄漏
2. **修复过真实缺陷的模块** —— `image-prompt.ts`，浏览器曾构造 prompt 并 POST，
   标记它使复发在构建期失败（批次 1 已实测验证）

编排层不属于这两类：它不读密钥，provider 由参数注入。给它加标记只是把测试也
一起挡在门外，没有换来任何安全收益。

### provider 依赖注入

`generateCocktailRecommendation` 接收 `provider: LLMProvider` 而非内部
`getLLMProvider()`。这既让调用预算可被 stub 驱动验证，也把「读凭证」这件事
限制在路由层的一次调用里。

## 3. 输出保证

```
prompt（含由 schema 派生的字段说明）
  → provider.createChatCompletion({ jsonSchema })
  → extractJsonPayload    严格：裸对象 或 ```json 围栏，其余拒绝
  → zod safeParse
  ├─ 通过 → mapGeneratedCocktail → 返回
  └─ 失败 → 带 zod 具体问题做 1 次修复重试
       └─ 再失败 → CocktailValidationError（不落库）
```

### extractJsonPayload 为何严格

旧实现 `completion.match(/\{[\s\S]*\}/)` 会从任意夹带散文的响应里抠出 JSON，
再 `as Cocktail` 强转、逐字段 `||` 兜底 —— 这是数据库里出现「Unknown Cocktail」
的成因。新实现只接受纯 JSON 或围栏包裹，`Here you go! {...} Enjoy!` 会被拒绝
并进入修复重试。已有测试锁定这条行为。

### 调用预算

`MAX_LLM_CALLS_PER_REQUEST = 2`。三处叠加的重试全部拆掉：

| 层 | 旧行为 | 新行为 |
| --- | --- | --- |
| `optimizedFetch` | `retryCount: 1`（循环 2 次） | 模块已删除 |
| provider | — | 仅连接失败重试 1 次；超时与已返回响应不重试 |
| 客户端 | 5xx 重试，共 2 次 | 仅连接失败重试；`ResponseError` 直接抛出 |

旧组合下一次用户失败最多打 4 次 LLM（每次 `max_tokens: 5000`）。

## 4. 双语与词表

schema 的每个文本字段是 `{ cn, en }`，一次生成产出完整双语。可枚举字段只输出
code。这消除了两个旧问题：prompt schema 缺 `english_*` 字段导致双语数据从生成起
就残缺；`inferEnglishBaseSpirit` 靠中文子串猜英文。

### 词表统一时发现的三处冲突

| 概念 | 冲突 | 决断 |
| --- | --- | --- |
| 风味 | filter 有 `salty`/`creamy`，prompt 有 `floral`/`refreshing`/`other` | 取并集，不丢失任何原有能力 |
| 难度 | enum 是 `easy/medium/hard`，问卷答案是 `beginner/intermediate/advanced` | 用问卷的，那是用户实际发送的值 |
| 酒精度 | `normalizeAlcoholLevel` 在数据层把 code 转成 `低度/中度/高度` | code 保持 code，显示是渲染层的事 |

### 落库仍是显示文本（本批次范围限制）

`mapGeneratedCocktail` 把 code 渲染成 label 后写入旧列。因为当前列和整个展示层
直接读这些值，写 `"rum"` 会让 `/cn` 显示 "rum" 而不是「朗姆酒」。改成存 code
属批次 4 `data-model`，届时这个映射函数会大幅收缩。

相比旧代码的改进：双语都来自同一份 label map，不再靠子串反推。

## 5. R3.8 流式 — 降级，且部分前提有误

prd 允许降级但要求记录理由。这里有两层结论。

### 5.1 真流式与 R3.2 存在硬冲突

R3.2 要求「校验通过才允许落库/返回」。若把字段逐个流给客户端，则：

- 校验失败时，用户已经看到一个即将消失的酒名
- 修复重试可能产出**完全不同**的酒，前面流出去的内容全部作废

两者不能同时成立。可行的折中是流**状态事件**而非部分字段（`generating` →
`validating` → `saving`），这与校验不冲突。

### 5.2 但「删除假进度条与轮换文案」这个前提部分不成立

核查后发现：

- `progressPercentage` **是**死状态：只被设为 0 和 100，全库无任何 UI 消费。
  已删除（连同 `CocktailContext` 里的转发）
- `Questions.tsx` 的 5 条轮换文案**不是**假进度：它不声称任何百分比或阶段，
  只是在一个不透明的长等待中维持注意力。生成期间**只有一个长阶段**（等 LLM，
  约 30–60s），换成「真实阶段进度」的实际效果是「生成中…」定住 55 秒再闪一下
  「保存中」—— 信息量没增加，体验更差

所以本批次删掉了真正的假进度（`progressPercentage`），保留轮换文案。

### 5.3 状态事件流式：推迟，理由是无法验证

LLM 凭证 401，无法端到端验证流式响应的分块、错误中断、客户端渐进渲染。
在不能验证的情况下改动主链路的响应形态，风险高于收益。

推迟至凭证恢复后处理，归入批次 8 或单独小批次。

## 6. 删除的模块

| 文件 | 行数 | 理由 |
| --- | --- | --- |
| `api/openai.ts` | 256 | 拆为 provider 层；completion 缓存与重试叠加随之消失 |
| `utils/prompts.ts` | 88 | prompt 由 schema 派生，不再手写第二份 |
| `lib/cocktail-generation.ts` | 130 | 迁至 `lib/ai/`，正则抠 JSON 与 `\|\|` 兜底全部移除 |

顶层 `api/` 目录随之为空，Dockerfile 的 `COPY /app/api ./api` 同步删除
（否则镜像构建失败 —— prd 已标注这是本批次必须处理的例外）。

`utils/api-optimization.ts` 与 `utils/cache-utils.ts` **未删除**：仍被
`components/PerformanceMonitor.tsx` 引用，属批次 7 范围。它们已不在生成链路中。

## 7. 验证

- lint 干净、0 源码类型错误、`pnpm build` 通过
- 60 个测试通过，其中生成管线 13 个（stub provider 驱动）：
  正常输出 / 修复成功 / 修复仍失败 / 调用预算上界 / 围栏 JSON /
  夹带散文被拒 / 越界 enum 被拒 / 缺一种语言被拒 / provider 错误不重试 /
  每次调用都带 jsonSchema / code→label 双语映射 / 嵌套双语字段 / null 字段省略
- 库中 `Unknown Cocktail` 行数 0
- `grep jsonMatch` / `grep cacheTTL` 均无结果

**未验证**（凭证阻塞）：真实 provider 的端到端生成、`json_schema` 支持情况、
相同问卷连续两次返回不同酒（需真实调用）。
