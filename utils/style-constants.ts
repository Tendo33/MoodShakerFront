/**
 * 样式常量
 * 统一管理项目中重复使用的CSS类名
 */

// 主要渐变样式
export const gradientStyles = {
  // 主按钮渐变
  primaryButton:
    "border-2 border-secondary bg-secondary text-black hover:bg-secondary/90 hover:shadow-[0_0_18px_var(--color-secondary)]",

  // 文字渐变
  primaryText:
    "text-transparent bg-clip-text bg-[linear-gradient(135deg,var(--color-secondary),var(--color-primary),var(--color-accent))]",

  // 圆形图标背景
  iconBackground:
    "bg-[linear-gradient(135deg,var(--color-secondary)_0%,var(--color-primary)_58%,var(--color-accent)_100%)] border border-white/10 shadow-[0_0_18px_rgba(0,255,255,0.18)]",

  // 工具提示背景
  tooltip: "bg-black/80 text-white",
} as const;

// 通用样式组合
export const commonStyles = {
  // 主按钮完整样式
  primaryButtonFull: `${gradientStyles.primaryButton} px-6 py-2.5 shadow-lg transition-all duration-300 hover:scale-[1.02]`,

  // 圆形图标完整样式
  circleIcon: `flex h-10 w-10 items-center justify-center rounded-full ${gradientStyles.iconBackground} text-white shadow-lg flex-shrink-0`,

  // 工具提示完整样式
  tooltipFull: `absolute right-0 top-full mt-2 px-3 py-1.5 ${gradientStyles.tooltip} text-xs rounded whitespace-nowrap`,

  // 主标题样式
  primaryTitle: `text-3xl font-bold ${gradientStyles.primaryText} tracking-wider`,
} as const;
