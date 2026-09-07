# 设计：降噪与对比度修复

## 边界

只动样式：`app/globals.css` 的 token 与工具类，以及组件里的 className。不改组件结构、
props 形状（唯一例外见下文 `GradientText` 死 API）、路由、文案、交互逻辑。

## 改动分层

按「一处改动覆盖多处使用」排序，优先动 token 层，最后才逐组件收尾。

### 第 1 层：token（`globals.css`，影响面最大）

| token | 现值 | 目标 | 依据 |
| --- | --- | --- | --- |
| `--color-muted` | `rgba(219,209,239,0.4)` → 2.90:1 | `rgba(219,209,239,0.72)` → 7.31:1 | 37 处引用一次性达标；0.72 与既有 `--color-muted-foreground`（0.78 → 8.48:1）同档，不引入新的明度层级 |
| `--surface-glow` | `rgba(255,79,216,0.18)` | 删除 | 引用数 0，死 token |
| `--surface-glow-cool` | `rgba(93,246,255,0.16)` | 删除 | 引用数 0，死 token |

两个 glow token 全仓引用数为 **0**（只有自身定义），直接删除即可，无需先清引用点。
`--color-muted` 则相反：37 处引用，改值前后都要实测。

### 第 2 层：工具类（`globals.css`）

**`.gradient-text`（`:273`，24 处使用）—— 本次核心**

现状：`accent → primary → secondary` 三色渐变 + `-webkit-text-fill-color: transparent`
+ `gradient-shift 5s linear infinite`。

需要说清的一点：**每个色标单独测对比度都是达标的**（primary 7.06:1、secondary 15.44:1、
accent 11.22:1、foreground 17.40:1，背景 `#0b0415`）。所以这不是 WCAG 数值失败，而是
三色高饱和 + 透明填充 + 无限动画共同造成的观感发虚。改它的理由是可读性与噪音，不是
合规性 —— 验收标准里不能把它算进「低对比处数」。

改法：降为双色 `foreground → primary`，去掉动画。

```css
.gradient-text {
  background: linear-gradient(to right, var(--color-foreground), var(--color-primary));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  /* 去掉 background-size / animation */
}
```

保留渐变本身，因为它是产品识别度的一部分（用户选的是「保留霓虹」）。去掉 accent 与
secondary 后洋红成为唯一强调色，符合选定方向。

`.gradient-text-bright`（`:287`）无动画，同样收成双色。

**`.neon-glow-primary` / `.neon-glow-secondary`（`:311`、`:315`）**

组件引用数为 0，直接删除。这是死代码清理，不影响渲染。

### 第 3 层：组件（逐文件）

按效果类密度排序推进：

| 文件 | 密度 | 主要工作 |
| --- | --- | --- |
| `components/ui/core.tsx` | 38 | 共享组件，改这里覆盖面最广；含 `GradientText` |
| `components/pages/Home.tsx` | 39 | 装饰性 shadow / gradient 最多 |
| `components/pages/Questions.tsx` | 33 | 卡片阴影与 ring |
| `app/[lang]/gallery/GalleryContent.tsx` | 21 | |
| `components/pages/CocktailRecipeSections.tsx` | 19 | 含 7 处 drop-shadow |
| `components/shared/CocktailSpecs.tsx` | — | 8 处 drop-shadow，最密集 |
| `components/share/PolaroidCard.tsx` | — | `text-white/40` → `/60`（3.73:1 → 7.31:1） |

判断标准 —— 阴影分两类，只删装饰的那类：

- **保留**：表达层级关系的（卡片浮于背景、下拉浮于卡片、模态浮于页面）
- **删除**：纯装饰的彩色发光（`drop-shadow` 的 39 处，尤其 9 处洋红）

`GradientText` 的 `from` / `to` 两个 props 在实现里被 `void` 掉了，是死 API。改这个文件
时顺手移除，属同一处清理。

## 验证方式

沿用上一轮找出三个 bug 的浏览器实测法（见 `.trellis/spec/frontend/quality.md` 的
"Real-Browser Checks"）：

1. **对比度**：脚本遍历叶子文本节点，`color` 与最近非透明祖先背景算比值。
   注意透明填充元素（`.gradient-text`）测不出来，需单独按色标核对。
2. **发光计数**：遍历计算样式，统计 `text-shadow` 非 `none` 与 `filter` 含
   `drop-shadow` 的元素数。
3. **裁切**：`scrollWidth > clientWidth`（沿用既有脚本）。
4. **截图复核**：六个页面前后对比，确认洋红仍是主色。

每层改完立刻验证，不累积到最后。

## 回滚

每层一个 commit，出问题 revert 单层即可。token 层风险最高（影响 37 处），单独成
commit 并立刻实测。

## 权衡

- **为什么不换背景色**：用户已明确否掉「转向中性深灰」方案。`#0b0415` 保留。
- **为什么保留渐变标题而非改纯色**：纯色最稳妥，但会丢掉产品识别度。双色 + 去动画
  是「降噪但保留调性」的折中，符合选定方向。若实测仍发虚，再降为纯色。
- **为什么 muted 取 0.72 而不是刚过线的 0.55**：0.55 只有 4.60:1，余量太小，一旦叠加
  玻璃拟态面板的半透明背景就可能跌破。0.72 与既有层级对齐，也不新增明度档位。
