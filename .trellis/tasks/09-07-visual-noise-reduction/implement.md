# 执行计划

每步一个 commit，改完立刻验证，不累积。任一步实测不达标就停下来重新判断，不往下推。

## 步骤 0：固定基线

在动代码前把基线数字记下来，否则「显著下降」无从判定。

```bash
# 效果类基线
for p in 'shadow-' 'gradient' 'blur' 'ring-' 'animate-' 'glass'; do
  printf "%-10s %s\n" "$p" "$(grep -rho -- "$p" --include='*.tsx' components app | wc -l | tr -d ' ')"
done
grep -rn "drop-shadow" --include='*.tsx' components app | wc -l
```

已测得的基线：`shadow-` 143、`gradient` 70、`glass` 49、`blur` 46、`ring-` 37、
`animate-` 33、`drop-shadow` 39（其中洋红 9）。

浏览器基线：低对比文本 7 处（最低 1.30:1）。

**产出**：把六个页面的截图存到 `/tmp/before-*.png`，收尾时对比。

## 步骤 1：token 层

改 `app/globals.css`：

- [ ] `--color-muted`: `rgba(219,209,239,0.4)` → `rgba(219,209,239,0.72)`
- [ ] 删除 `--surface-glow`（`:59`）、`--surface-glow-cool`（`:60`）
- [ ] 删除 `.neon-glow-primary`（`:311`）、`.neon-glow-secondary`（`:315`）

**验证**（这步影响 37 处，必须实测）：

```bash
pnpm build && pnpm start
# 浏览器实测六个页面的低对比文本数，期望从 7 降到接近 0
```

**风险点**：玻璃拟态面板的半透明背景会参与合成，实测值可能低于 token 层算出的
7.31:1。若仍有不达标处，记录具体元素再决定是继续提 alpha 还是改那个面板。

**回滚**：单独 revert 这个 commit。

## 步骤 2：`.gradient-text`

- [ ] `.gradient-text`（`:273`）：三色 → `foreground → primary` 双色，去掉
      `background-size` 与 `animation`
- [ ] `.gradient-text-bright`（`:287`）：同样收成双色

**验证**：

```bash
# 无限动画应只剩 1 处（原 2 处）
grep -c "animation:.*infinite" app/globals.css
```

浏览器截图确认问卷页标题不再发虚（这是用户报的原始症状之一）。

**注意**：这一步改的是观感，不是 WCAG 数值 —— 每个色标本来就达标。不要把它计入
「低对比处数」的改善。

**回滚**：单独 revert。若实测仍发虚，下一步降为纯色 `--color-foreground`。

## 步骤 3：组件（逐文件，每文件一个 commit）

顺序按影响面，共享组件优先：

- [ ] `components/ui/core.tsx`（38）—— 顺带移除 `GradientText` 的死 props `from` / `to`
- [ ] `components/share/PolaroidCard.tsx` —— `text-white/40` → `text-white/60`
- [ ] `components/shared/CocktailSpecs.tsx` —— 8 处 drop-shadow，最密集
- [ ] `components/pages/Home.tsx`（39）
- [ ] `components/pages/Questions.tsx`（33）
- [ ] `components/pages/CocktailRecipeSections.tsx`（19，含 7 处 drop-shadow）
- [ ] `app/[lang]/gallery/GalleryContent.tsx`（21）

每个文件的判断标准：

- **删**：纯装饰的彩色发光（`drop-shadow` 全部 39 处）、非 hero 的渐变、多余的 ring
- **留**：表达层级的阴影（卡片浮于背景、下拉浮于卡片、模态浮于页面）
- 青色降为边框和次要文字，橙色基本移除

**验证**（每文件改完）：

```bash
npx tsc --noEmit
pnpm test
```

改完全部组件后跑一次浏览器实测 + 截图。

## 步骤 4：收尾验证

```bash
pnpm lint
pnpm test
pnpm build
npx tsc --noEmit
```

浏览器实测六个页面（`/cn`、`/en`、`/cn/questions`、`/en/questions`、`/cn/gallery`、
`/en/gallery`）：

- [ ] 低对比文本 0 处
- [ ] 文本 `text-shadow` 与标题 `drop-shadow` 0 处
- [ ] 零裁切、无横向滚动
- [ ] 截图与 `/tmp/before-*.png` 对比，确认洋红仍是主色、产品可识别

## 步骤 5：spec 更新

- [ ] `.trellis/spec/frontend/components-and-styling.md`：记录 muted token 的对比度
      下限、阴影的「层级 vs 装饰」判断标准
- [ ] 若发现新的验证手法，补进 `quality.md` 的 "Real-Browser Checks"

## 审查门

- 步骤 1 之后：低对比数是否真的下降？没有就说明根因判断错了，停下重查。
- 步骤 2 之后：标题是否还发虚？还虚就降纯色。
- 步骤 4：截图复核。数字全绿但观感变平，也算没达成目标 —— 用户要的是降噪，不是
  去掉调性。
