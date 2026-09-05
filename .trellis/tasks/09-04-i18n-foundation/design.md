# 技术设计 — i18n 语言判定收敛与字典类型化

父任务设计契约：[design.md](../09-04-moodshaker-restructure/design.md) §6.1–6.2。

## 1. 语言判定：三条链收敛为一条

### 收敛前

| 位置 | 判定链 |
| --- | --- |
| `proxy.ts` | cookie → accept-language → `cn` |
| `app/layout.tsx` | `next-url` → cookie → accept-language → `cn` |
| `context/LanguageContext.tsx` | pathname → localStorage → navigator → `cn` |

三条链读的输入不同、顺序不同，因此可以互相矛盾：proxy 依 cookie 重定向到
`/cn`，layout 读 `accept-language: en` 渲染 `<html lang="en">`，客户端再从
localStorage 读出第三个值。

### 收敛后

**URL 前缀是唯一答案。** 只有 proxy 在 URL 无前缀时才从别处推导，推导结果通过
`x-moodshaker-locale` 请求头转发给 layout。

```
proxy.ts              有前缀 → 直接采用并转发 header
                      无前缀 → cookie → accept-language → DEFAULT_LOCALE，重定向
app/layout.tsx        读 header（缺失才回落，意味着请求绕过了 proxy）
LanguageContext.tsx   读 usePathname()，不读任何存储
```

`lib/i18n/config.ts` 是唯一真相源：`LOCALES`、`DEFAULT_LOCALE`、
`LOCALE_COOKIE`、`LOCALE_HEADER`，以及四个纯函数
（`localeFromPathname` / `localeFromAcceptLanguage` / `localizePathname` / `isLocale`）。

## 2. 偏离 prd：`<html lang>` 仍在根 layout

prd R5.1 写的是「`<html lang>` 由 `app/[lang]/layout.tsx` 输出」。**未采纳**，
因为 Next.js App Router 只允许一个 layout 渲染 `<html>`，而这些路由在 `[lang]` 之外：

```
app/page.tsx        重定向到 /cn
app/not-found.tsx   404 页
```

把 `<html>` 移入 `app/[lang]/layout.tsx` 会让上述路由失去 `<html>` 包裹。

**替代实现**：`<html>` 留在 `app/layout.tsx`，但它不再自己推导语言，而是读
proxy 转发的 `x-moodshaker-locale`。单一真相源的保证不变，只是落在不同文件。

顺带修正：`lang` 属性从 `"cn"` 改为 BCP 47 的 `zh-CN`（`cn` 不是合法语言子标签，
是国家代码）。

## 3. 实现期发现的三个真实缺陷

### 3.1 localStorage / cookie 键名相同但存储不同

客户端把 `moodshaker-language` 写进 **localStorage**（`utils/asyncStorage.ts`），
proxy 读的是同名 **cookie**。`asyncStorage` 从不触碰 cookie。

**后果**：proxy 里的 cookie 分支是死代码。用户显式选过语言后，只要访问一次无前缀
URL（例如从 `/` 进入），选择就丢失，`accept-language` 接管。

**修复**：`setLanguage` 改写 cookie，这是 proxy 唯一能读到的形式。

### 3.2 `detail.alternative` 键在两个字典里都不存在

`CocktailRecipeSections` 的 `toolAlternativeLabelKey` 默认值是
`"detail.alternative"`，渲染于第 196 和 349 行。字典里只有
`recommendation.alternative`。

**后果**：详情页的工具替代品标签直接显示字面文本 `detail.alternative: Shaker`。
推荐页因为显式传了存在的键，所以正常 —— 这掩盖了缺陷。

旧 `t()` 签名是 `(key: string) => string` 且缺键时返回键本身，所以这个缺陷
既不报错也不崩溃。类型化后它成为编译错误。

**修复**：两个字典各补一条，措辞沿用已有的 `recommendation.alternative`。

### 3.3 `translateDynamic` 会返回原型链上的函数

这是我自己新写的代码，由我自己写的测试抓到：`translateDynamic("cn", "toString")`
返回 `Object.prototype.toString` —— 一个函数，交给期待字符串的调用方。

因为这些键是从数据库值拼出来的，键名不总是我们选定的。已改为
`hasOwnProperty` 检查 + `typeof value === "string"` 双重约束。

## 4. 字典类型化

### 4.1 保持扁平点号键（排除嵌套对象方案）

**16 个键既是叶子又是前缀**，例如 `spirits.gin` 与 `spirits.gin.description`
同时存在。嵌套对象里同一个名字不能既是字符串又是对象，因此不做扁平转嵌套。

### 4.2 修正联合类型导致的漂移

`locales/index.ts` 原本是：

```ts
export type TranslationKey = keyof typeof cn | keyof typeof en;   // 联合
export type TranslationDictionary = Record<string, string>;       // 键类型被擦除
```

联合类型接受「只存在于一种语言」的键 —— 正是它本该防住的漂移。

新的 `lib/i18n/dictionary.ts` 以 `cn` 为基准，用
`Record<Exclude<keyof T, TranslationKey>, never>` 双向锁定：

- en 缺键 → `Property 'x' is missing`
- en 多键 → `Type 'string' is not assignable to type 'never'`

两个方向都实测注入验证过（注入后 tsc 报错，恢复后干净）。

### 4.3 `t()` 与 `tDynamic()` 分离

`t(key: TranslationKey)` 只接受字面量键，拼接键在编译期就被拒绝。

`tDynamic(key: string): string | null` 给从数据拼键的场景，未知键返回 `null`
而不是回显键名，由调用方决定显示什么。

类型化后暴露出 **17 处** 此前不受检查的调用点，全部处理：

| 处理 | 数量 |
| --- | --- |
| 6 处 gallery 从筛选值拼键 → `tDynamic`，未知值回落到原文而非键名 | 6 |
| 8 处组件 prop 声明 `string` → `TranslationKey` | 8 |
| 2 处 `detail.alternative` → 补字典（真实缺陷，见 §3.2） | 2 |
| 1 处 `Language` 类型改名为 `Locale` | 1 |

## 5. accept-language 解析

旧实现（两处各写一遍）：

```ts
lower.startsWith("en") ? "en" : "cn"
```

`en-GB` 能工作，但 `fr,en;q=0.9` 会变成中文 —— 英语可接受、中文根本没被列出。

新实现按 q 值降序遍历，跳过不支持的语言，`q=0` 视为拒绝，`*` 视为默认，
`zh` / `zh-CN` / `zh-Hant` 统一映射到中文字典（项目只有一种中文变体）。
全部无匹配时返回 `null`，由调用方决定回落。

## 6. cookie 写入策略

只在用户**显式选择**时写 cookie。从 `accept-language` 推导出的结果不写入 ——
否则一次猜测会被固化成「显式偏好」，并从此压过它所来源的那个 header。

已实测：仅带 `accept-language` 的首访不产生 `set-cookie`；带显式 cookie 的请求
续期一年。

## 7. 已发现但不在本批次修的问题

### 7.1 gallery 持有第四份词表副本

`app/[lang]/gallery/GalleryContent.tsx` 本地硬编码：

```ts
const SPIRITS = ["Gin", "Vodka", "Rum", "Tequila", "Whiskey", "Brandy"];
const ALCOHOL_LEVELS = ["Low", "Medium", "High"];
const FLAVORS = ["Sweet", "Sour", "Bitter", "Fruity", "Herbal", "Smoky", "Spicy", "Salty", "Creamy"];
```

批次 2 已把词表扩宽（酒精度含 `none`，风味含 `floral`/`refreshing`/`other`），
因此**新生成的酒可能无法被筛选到**：`alcoholLevel: "none"` 的无酒精特调不在
`ALCOHOL_LEVELS` 里，`floral` 风味不在 `FLAVORS` 里。

**不在本批次修**：这些值直接作为 API 查询参数发出
（`?spirit=Gin&alcohol=Low`），统一词表会改变 API 筛选契约，属批次 4
`data-model` / 批次 6 范围。本批次只把 6 处 `t()` 改成 `tDynamic()`，
使未知值显示原文而不是键名。

### 7.2 `PerformanceMonitor` 在 `/en` 页面输出硬编码中文

按钮 title「性能监控」。受 `NODE_ENV === "development"` 守卫，不进生产构建。
属批次 7 范围。

### 7.3 `app/globals.css:281` 渐变文字

设计钩子提示项，与本批次无关，未改动。

## 8. 验证

静态：lint 干净、0 源码类型错误、80 个测试通过（新增 20 个）、`pnpm build` 通过。

运行时实测 12 项：

| 项 | 结果 |
| --- | --- |
| `/cn` / `/en` 的 `<html lang>` | `zh-CN` / `en` |
| 深层路由 `/cn/gallery` `/en/gallery` | 跟随前缀 |
| 前缀 vs 冲突的 `accept-language` | **前缀胜**（双向） |
| 前缀 vs 冲突的 cookie | **前缀胜**（双向） |
| 无前缀 + `en-US` / `zh-CN` | → `/en` / `/cn` |
| 无前缀 + `fr,en;q=0.9` | → `/en`（**旧代码会错判为 `/cn`**） |
| 无前缀 + `en;q=0.4,zh-CN;q=0.9` | → `/cn`（按 q 值） |
| 无前缀 + 皆不支持 / 无 header | → `/cn`（默认） |
| cookie 优先于 accept-language | cookie 胜；非法 cookie 值被忽略 |
| 深层无前缀路径 `/gallery?q=x` | → `/cn/gallery?q=x`（路径与查询串保留） |
| 首访不写 cookie；显式 cookie 续期 | 符合 §6 |
| 前缀路由转发 `x-moodshaker-locale` | `cn` / `en` |
| 4 个页面的键名泄漏扫描 | 无泄漏 |

`/en` 页面残留 6 个中文字符，来源为 §7.2 的开发期组件，非生产问题。
