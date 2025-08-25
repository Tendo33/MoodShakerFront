/**
 * 样式常量
 * 统一管理项目中重复使用的CSS类名
 */

// 主要渐变样式
export const gradientStyles = {
  // 主按钮渐变
  primaryButton: "bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600",
  
  // 文字渐变
  primaryText: "bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 bg-clip-text text-transparent",
  
  // 圆形图标背景
  iconBackground: "bg-gradient-to-r from-amber-500 to-pink-500",
  
  // 工具提示背景
  tooltip: "bg-black/80 text-white",
} as const;

// 通用样式组合
export const commonStyles = {
  // 主按钮完整样式
  primaryButtonFull: `${gradientStyles.primaryButton} text-white px-8 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105`,
  
  // 圆形图标完整样式
  circleIcon: `flex h-10 w-10 items-center justify-center rounded-full ${gradientStyles.iconBackground} text-white shadow-lg flex-shrink-0`,
  
  // 工具提示完整样式
  tooltipFull: `absolute right-0 top-full mt-2 px-3 py-1.5 ${gradientStyles.tooltip} text-xs rounded whitespace-nowrap`,
  
  // 主标题样式
  primaryTitle: `text-3xl font-bold ${gradientStyles.primaryText} tracking-wider`,
} as const;

export type GradientStyleKey = keyof typeof gradientStyles;
export type CommonStyleKey = keyof typeof commonStyles;
