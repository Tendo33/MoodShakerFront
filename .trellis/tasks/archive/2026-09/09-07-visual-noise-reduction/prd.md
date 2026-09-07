# 降低前端视觉噪音并修复文本对比度

## 背景

用户反馈「现在看着有点光污染」。截图与浏览器实测确认了这个判断，并且暴露出一个比观感更严重的问题：部分文本对比度远低于可读阈值。

当前配色是霓虹方向：背景 `#0b0415`，三个高饱和主色同时争夺注意力。

| token | 值 | 用途 |
| --- | --- | --- |
| `--background` | `#0b0415` | 深紫底 |
| `--foreground` | `#f3ebff` | 正文，17.40:1，合规 |
| `--primary` | `#ff4fd8` | 洋红 |
| `--secondary` | `#5df6ff` | 青 |
| `--accent` | `#ffb15b` | 橙 |

叠加在配色之上的效果类使用量（`components/` + `app/` 的 tsx）：

| 类 | 次数 |
| --- | --- |
| `shadow-*` | 143 |
| `gradient` | 70 |
| `glass*` | 49 |
| `blur*` | 46 |
| `ring-*` | 37 |
| `animate-*` | 33 |

密度最高的文件：`components/pages/Home.tsx`（39）、`components/ui/core.tsx`（38）、
`components/pages/Questions.tsx`（33）、`app/[lang]/gallery/GalleryContent.tsx`（21）、
`components/pages/CocktailRecipeSections.tsx`（19）。

## 目标

用户已选定方向：**保留霓虹调性，大幅降噪**。洋红作唯一强调色，去掉发光，砍掉多余渐变和阴影，并修复对比度。改完后仍应认得出是同一个产品。

### 1. 文本对比度达到 WCAG AA

六个页面浏览器实测合计 **66 处**文本不达标，最低 1.30:1（正文要求 4.5:1，大字号 3:1）。

先前 PRD 写的「7 处」只测了单个页面，低估了实际规模。逐页基线：

| 页面 | 低对比 | 发光 | 透明填充 |
| --- | --- | --- | --- |
| `/cn` | 17 | 8 | 6 |
| `/en` | 9 | 8 | 6 |
| `/cn/questions` | 7 | 1 | 3 |
| `/en/questions` | 5 | 1 | 3 |
| `/cn/gallery` | 22 | 1 | 3 |
| `/en/gallery` | 6 | 1 | 3 |
| **合计** | **66** | **20** | **24** |

典型不达标处（按严重度）：

- 1.30:1 —— 页脚链接（关于我们 / 隐私政策 / 服务条款），最严重
- 1.44:1 —— 首页副标题、图库计数文本
- 1.50:1 —— 卡片描述文字
- 1.58:1 —— 图库酒名
- 2.28:1 —— 语言选择器（每页都有，中英文各 2 处）

根因在 token 层，不是散落的个别写法：

```css
--color-muted: rgba(219, 209, 239, 0.4);   /* 2.90:1，被 text-muted 引用 37 处 */
```

已算出的达标取值（基色 `rgb(219,209,239)` 合成在 `#0b0415` 上）：

| alpha | 对比度 | |
| --- | --- | --- |
| 0.4（当前） | 2.90:1 | 不达标 |
| 0.55 | 4.60:1 | 刚过线 |
| 0.65 | 6.09:1 | |
| 0.72 | 7.31:1 | 与现有 `--color-muted-foreground`（0.78 → 8.48:1）同一档 |

另一处独立问题：`components/share/PolaroidCard.tsx` 用 `text-white/40` → 3.73:1，
提到 `text-white/60` 得 7.31:1。

### 2. 去掉发光与标题的渐变填充

主因是 `.gradient-text`（`app/globals.css:273`），24 处在用：

```css
.gradient-text {
  background: linear-gradient(...三色...);
  -webkit-text-fill-color: transparent;   /* 文字没有实色 */
  animation: gradient-shift 5s linear infinite;
}
```

文字本身没有颜色，只靠渐变背景透出，标题因此发虚；还挂着 5 秒无限循环动画。
截图里问卷页标题读不出来就是这个原因。

连带影响：这类元素的对比度无法用 `color` 测量（没有实色），所以先前实测的 7 处
低对比**不包含**它们 —— 真实不达标数量比 7 更多。

其余发光：

- `drop-shadow` 共 39 处，全在组件里（不在 globals.css），其中 9 处是洋红。
  密集处：`shared/CocktailSpecs.tsx`(8)、`CocktailRecipeSections.tsx`(7)、`Home.tsx`(6)
- `--surface-glow` / `--surface-glow-cool`（`globals.css:59`、`:60`）
- `.neon-glow-primary` / `.neon-glow-secondary`（`:311`、`:315`）组件引用数为 **0**，
  是死代码，直接删除即可

### 3. 收敛效果类

- `shadow-*` 只保留真正表达层级的，去掉纯装饰
- `gradient` 收到 hero 区域
- 青色降为边框和次要文字，橙色基本移除
- `blur` / `ring-` 同步收敛

## 非目标

- 不改版式、间距、字体、圆角（`--radius: 0px` 的硬边几何风格保留）
- 不改交互逻辑、路由、文案
- 不替换背景色，不转向中性深灰（用户已明确否掉「转向克制暗色」方案）
- 不重构组件结构；只动样式类与 token
- 不处理 React 水合耗时问题（另一个议题，已在上一个提交里记录）

## 验收标准

1. `/cn`、`/en`、`/cn/questions`、`/en/questions`、`/cn/gallery`、`/en/gallery`
   六个页面，浏览器实测低对比文本数为 **0**（正文 ≥ 4.5:1，大字号 ≥ 3:1）
2. 全站计算样式中，文本相关的发光 `text-shadow` 与标题 `drop-shadow` 数为 **0**
3. 效果类总量相对基线（`shadow-` 143 / `gradient` 70 / `blur` 46）显著下降，
   且下降集中在装饰性用途，不牵连表达层级的阴影
4. 零裁切、无横向滚动（沿用既有检查方式）
5. `pnpm test` 全绿、lint 干净、build 干净、typecheck 0
6. 视觉复核：截图对比，洋红仍是主色，产品可识别

## 风险

- **改动面大**：涉及 5 个高密度组件 + `globals.css`。逐文件推进，每步验证。
- **对比度可能与实测数字不符**：浏览器测得页脚 1.30:1，而 token 层算出 2.90:1 —— 差异
  来自玻璃拟态面板自身的半透明背景参与合成。**以浏览器实测为准**，token 计算只用于
  定目标值。
- **过度降噪导致失去调性**：以截图复核收尾，不只看数字。
