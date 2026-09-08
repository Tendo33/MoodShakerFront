# 可观测性与测试

父任务：[09-04-moodshaker-restructure](../09-04-moodshaker-restructure/prd.md)
批次：8 / 8 — 依赖批次 1–7

## Goal

关闭 `docs/release-readiness.md` 列出的「可观测性低于发布门槛」与
「端到端回归覆盖缺失」两项生产阻塞，并重写该文档。

## Background

### 可观测性

`utils/logger.ts`（128 行）是 console 的薄包装。没有结构化日志、
没有指标、没有链路追踪、没有错误上报。

`docs/release-readiness.md` 2026-04-08 已明确列出所需但缺失的指标：

- 推荐成功率
- 生图成功率
- 限流命中率
- 推荐恢复失败率
- gallery 搜索延迟

`components/PerformanceMonitor.tsx`（302 行）曾承担部分职责，
但它挂在 root layout 每页发送，且是自研方案。批次 7 已将其移出 layout。

### 测试

当前覆盖：

| 文件 | 覆盖对象 |
| --- | --- |
| `tests/lib/rate-limit.test.ts` | 限流错误分类 |
| `tests/lib/request-validation.test.ts` | 手写校验器（批次 4 后该模块已删） |
| `tests/lib/recommendation-access.test.ts` | 访问载荷构造 |
| `tests/lib/recommendation-state.test.ts` | 一个 11 行的纯函数 |
| `tests/dockerfile.test.ts` / `tests/next-config.test.ts` | 配置文件文本断言 |
| `tests/e2e/smoke.spec.ts` | 首页 → 问卷，点了两下 |

生成管线零覆盖，API 路由零覆盖，provider 无 mock。

## Requirements

### R8.1 — 结构化日志

- 替换 console 包装为结构化日志（JSON 行），字段含 `requestId`、
  `level`、`scope`、`durationMs`
- 与 docker-compose 的 `json-file` 日志驱动兼容
- 生产环境不输出 debug 级别

### R8.2 — 核心指标

至少覆盖 release-readiness 列出的五项：

- 推荐成功率（成功 / 总请求）
- 生图成功率
- 限流命中率
- 推荐恢复失败率
- gallery 搜索延迟

另加批次 2 引入的：

- LLM token usage 与调用次数
- schema 校验失败率与修复重试命中率

方案需在本任务 `design.md` 中选型。约束：自托管、不引入 Redis、
资源上限 1 CPU / 1G。可选路径包括暴露 `/api/metrics`（Prometheus 文本格式）
或结构化日志派生。

### R8.3 — 错误上报

- 引入错误上报（Sentry 或等价方案）
- 服务端与客户端未捕获异常均上报
- 上报内容不得包含 `editToken`、API Key 等敏感字段

### R8.4 — Web Vitals

替代已移出 layout 的 `PerformanceMonitor`：用标准 `useReportWebVitals` 上报
LCP / INP / CLS，不自研 302 行监控组件。

### R8.5 — 测试补齐

- 生成管线单元测试，provider 可 mock，覆盖：正常输出、schema 校验失败 +
  修复重试成功、修复重试仍失败
- 图片管线单元测试，覆盖 design 中定义的全部失败语义
- API 路由测试：`/api/cocktail`、`/api/image`、`/api/recommendation/[id]`、
  `/api/cocktail/[id]`
- 清理已失效的测试（`request-validation.test.ts` 对应的模块已在批次 4 删除）
- 配置文件文本断言测试（`dockerfile.test.ts` / `next-config.test.ts`）
  重新评估价值，无价值则删除

### R8.6 — e2e 主流程

覆盖：首页 → 问卷 → 推荐 → 生图 → 分享 → 发布 → gallery 中可见 → 撤回。
外部 provider 需要可 stub，e2e 不应真实消耗 API 额度。

### R8.7 — 构建与部署收尾（父任务 design §10）

这几项属运维面，集中在最后一批做，避免早期批次反复触碰 Dockerfile。

- `next.config.mjs` 启用 `output: "standalone"`。当前 Dockerfile 复制整个
  `.next` 并在 runner 阶段重装全部依赖（含 devDependencies），镜像明显偏大
- 相应精简 Dockerfile 的 runner 阶段
- 记录改造前后的镜像体积

### R8.8 — 重写发布文档

`docs/release-readiness.md` 按重构后的真实状态重写，
四项生产阻塞逐项给出关闭证据。

## Dependencies

批次 1–7 全部完成。指标口径取决于前七批的最终形态。

## Acceptance Criteria

- [ ] 日志为结构化 JSON 行，含 `requestId`，可在 `docker logs` 中直接检索
- [ ] 五项核心指标均可查询，各有一次实测数据记录
- [ ] 错误上报接通，人为触发一次异常可在上报端看到
- [ ] 上报内容经检查不含 `editToken` 与 API Key
- [ ] Web Vitals 有数据
- [ ] 生成管线的三条路径（正常 / 修复成功 / 修复失败）均有测试
- [ ] 图片管线的全部失败语义均有测试
- [ ] 四个 API 路由均有测试
- [ ] e2e 覆盖完整主流程且不消耗真实 API 额度
- [ ] 已失效的测试已清理
- [ ] `output: "standalone"` 已启用，镜像体积改造前后均已记录
- [ ] `docs/release-readiness.md` 重写完成，四项阻塞逐项关闭
- [ ] `docs/performance-baseline.md` 的「Current Known Bottlenecks」逐条结论化
- [ ] `.trellis/spec/` 与最终代码一致
- [ ] `pnpm lint` / `pnpm test` / `pnpm build` / `pnpm test:e2e` 全绿

## Non-Goals

- 不引入 Prometheus / Grafana 容器（除非 design 阶段论证必要且资源可承受）
- 不做告警规则配置（留给运维）
- 不做分布式追踪（单体自托管，收益有限）
- 不追求覆盖率数字指标
