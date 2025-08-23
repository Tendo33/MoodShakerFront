// 性能优化：提取公共样式类，减少重复定义
// {{CHENGQI:
// Action: [Added]; Timestamp: [2025-08-23 14:51:20]; Reason: 性能优化 - 提取公共样式减少重复; Principle_Applied: DRY原则;
// }}

export const commonStyles = {
  // 主题相关样式
  theme: {
    background: "bg-gray-900 text-white",
    card: "bg-gray-800/80 text-white",
    cardSolid: "bg-gray-800 text-white", 
    border: "border-gray-700",
    textColor: "text-white",
    textSecondary: "text-gray-400",
  },

  // 渐变样式
  gradients: {
    primary: "bg-gradient-to-r from-amber-500 to-pink-500",
    primaryHover: "hover:from-amber-600 hover:to-pink-600",
    text: "bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent",
    cardHeader: "bg-gradient-to-r from-amber-500/10 to-pink-500/10",
    cardHeaderAlt: "bg-gradient-to-r from-pink-500/20 to-amber-500/20",
    cardHeaderSteps: "bg-gradient-to-r from-pink-500/20 to-purple-500/20",
  },

  // 动画和过渡
  transitions: {
    default: "transition-all duration-300",
    fast: "transition-all duration-150",
    slow: "transition-all duration-500",
    hover: "hover:scale-105",
    hoverSubtle: "hover:scale-[1.02]",
  },

  // 布局
  layout: {
    container: "container mx-auto py-8 px-4",
    section: "py-20",
    card: "border rounded-xl shadow-lg overflow-hidden",
    cardPadding: "p-6",
    cardHeader: "p-5",
  },

  // 按钮样式
  buttons: {
    primary: "bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white px-8 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105",
    secondary: "border border-gray-700/50 rounded-full transition-all duration-300 hover:bg-white/5",
    icon: "p-2.5 rounded-full hover:bg-white/10 transition-colors",
  },

  // 图片样式
  images: {
    cocktailHero: "relative rounded-3xl shadow-2xl object-cover cursor-pointer transition-transform duration-300 hover:scale-[1.02]",
    cocktailCard: "object-cover",
    avatar: "object-cover rounded-full",
  },

  // 响应式图片尺寸
  imageSizes: {
    hero: "(max-width: 768px) 100vw, 50vw",
    card: "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw", 
    small: "32px",
    medium: "80px",
  },
} as const;

// 样式组合函数
export const combineStyles = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// 条件样式函数
export const conditionalStyle = (condition: boolean, trueStyle: string, falseStyle?: string): string => {
  return condition ? trueStyle : (falseStyle || '');
};

// 通用组件样式
export const componentStyles = {
  // 问题组件样式
  question: {
    container: combineStyles(
      commonStyles.layout.card,
      commonStyles.theme.card,
      commonStyles.theme.border
    ),
    header: combineStyles(
      commonStyles.layout.cardHeader,
      commonStyles.gradients.cardHeader
    ),
    option: combineStyles(
      "cursor-pointer",
      commonStyles.transitions.default,
      commonStyles.transitions.hover,
      commonStyles.theme.border,
      "rounded-xl overflow-hidden h-full flex flex-col"
    ),
    optionSelected: "ring-2 ring-pink-500 shadow-lg",
  },

  // 步骤组件样式
  step: {
    number: combineStyles(
      "flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg flex-shrink-0",
      commonStyles.gradients.primary
    ),
    tip: "mt-3 p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg",
  },

  // 进度条样式
  progress: {
    container: "h-64 w-2 bg-gray-700/30 rounded-full overflow-hidden relative",
    bar: combineStyles(
      "w-full rounded-full absolute top-0",
      commonStyles.gradients.primary,
      commonStyles.transitions.slow
    ),
  },
} as const;
