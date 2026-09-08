# 执行计划 — MoodShaker 结构性重构（父任务）

父任务的执行计划只负责**批次编排、评审门与集成验收**。
每个批次的具体步骤在对应子任务的 `implement.md` 中。

## 批次编排

```
批次 1  sec-image-storage    P0  ─┐
批次 2  ai-pipeline          P0  ─┼─ 三者无共享文件，可完全并行
批次 3  i18n-foundation      P1  ─┘
                                  │
批次 4  data-model           P1  ←┘  依赖 1+2+3
                                  │
                    ┌─────────────┴─────────────┐
批次 5  i18n-rsc       P1                批次 6  publish-gallery  P1
        （含 CSP nonce）                        （含全文检索）
                    │
批次 7  state-slimdown P1  ←── 依赖 5
                    └─────────────┬─────────────┘
                                  │
批次 8  observability-tests  P2  ←┘  依赖 1–7
```

文件所有权见父任务 `prd.md` 的「批次间文件契约」。要点：

- `lib/domain/vocabulary.ts` 由批次 2 创建，批次 1、3 只读
- 批次 1 **不引入 `ImageProvider` 抽象**，直接调用现有 `generateImage`；
  批次 2 合并后由批次 2 负责切换调用点
- `proxy.ts` 由批次 3 改语言判定，批次 5 加 CSP nonce，批次 5 需 rebase
- `prisma/schema.prisma` 严格串行：批次 1 扩展 → 批次 4 收缩 → 批次 6 加索引

## 工作量

| 批次 | 粗估 |
| --- | --- |
| 1 sec-image-storage | 3–4 天 |
| 2 ai-pipeline | 3–4 天 |
| 3 i18n-foundation | 2 天 |
| 4 data-model | 4–5 天 |
| 5 i18n-rsc | 3 天 |
| 6 publish-gallery | 3–4 天 |
| 7 state-slimdown | 2–3 天 |
| 8 observability-tests | 3–4 天 |

净工作日合计约 23–29 天。按 1/2/3 并行、5/6 并行计，日历周期约 5–7 周。
估计不含 review 等待、R2 账号开通、线上观察期。

## 每批次的固定流程

1. `python3 ./.trellis/scripts/task.py start <child-dir>` — 仅在该子任务的
   `prd.md` / `design.md` / `implement.md` 齐备并经人工 review 后执行
2. 在子任务分支上实现（分支名 `refactor/<child-slug>`）
3. 跑该批次的验证命令（见下）
4. **Review Gate** — 人工评审，不允许自动合入
5. 合并到 `main`，`task.py archive`
6. 回到父任务，勾选对应的跨子任务验收项

## 验证命令

### 每批次必跑

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
```

### 涉及 Prisma 的批次（1、3、6）额外跑

```bash
pnpm db:init
```

并且必须在**存量数据副本**上演练迁移，而非空库。

### 涉及可见 UI 的批次（4、5、6）额外做

浏览器实测受影响路由的 `/cn` 与 `/en` 两个版本，视觉变更留截图。
spec 明确要求：不允许仅凭代码审查判定 Next.js 变更完成。

### 最终集成（批次 7 结束后）

```bash
pnpm lint && pnpm test && pnpm build && pnpm test:e2e
```

## 回滚点

每个批次合并即为一个回滚点。破坏性变更的额外约束：

| 批次 | 破坏性操作 | 回滚方式 |
| --- | --- | --- |
| 1 | 加 `imageUrl` 列、回填 R2 | 旧 `image` 列在批次 4 之前不删；回滚只需 revert 代码 |
| 4 | 删 `english_*` 列、删旧 `image` 列 | **单向**。必须在批次 1 稳定运行满一个观察期后执行；执行前做全库备份并实测可恢复 |
| 6 | 加 tsvector 列与 GIN 索引 | 可直接 drop 列与索引 |

**批次 4 的收缩阶段是本次重构唯一不可逆的操作**，需单独确认后执行。

## 集成验收清单

批次全部完成后，逐项核对父任务 `prd.md` 的 Cross-Cutting Acceptance Criteria。
额外的集成检查：

- [ ] 用干净数据库跑 `pnpm db:init` 后完整走一遍主流程可成功
- [ ] 用存量数据库副本跑全部迁移后主流程可成功
- [ ] 断开 R2 凭证时生图失败是明确报错，不产生脏数据
- [ ] 断开 LLM provider 时推荐失败是明确报错，不落库
- [ ] 分享卡片在 R2 图片下仍能产出带图 PNG
- [ ] 重写 `docs/release-readiness.md`
- [ ] 更新 `docs/performance-baseline.md`，逐条结论化其
      「Current Known Bottlenecks」
- [ ] 更新 `.trellis/spec/`：路由图、环境变量、脚本、验证命令、目录结构
- [ ] 更新 `README.md` / `README.zh.md` 的环境变量与部署章节
- [ ] `.env.example` 补齐 R2 与 `TRUSTED_PROXY_HOPS`

## 当前状态

- [x] 父任务 `prd.md`（含 review 修订）
- [x] 父任务 `design.md`（含 review 修订）
- [x] 父任务 `implement.md`（含 review 修订）
- [ ] 批次 1 `sec-image-storage` — 三件套已备，待开工
- [ ] 批次 2 `ai-pipeline` — 仅 prd
- [ ] 批次 3 `i18n-foundation` — 仅 prd
- [ ] 批次 4 `data-model` — 仅 prd
- [ ] 批次 5 `i18n-rsc` — 仅 prd
- [ ] 批次 6 `publish-gallery` — 仅 prd
- [ ] 批次 7 `state-slimdown` — 仅 prd
- [ ] 批次 8 `observability-tests` — 仅 prd

各批次的 `design.md` / `implement.md` 在轮到该批次开工前补齐，
避免基于过时假设提前设计。
