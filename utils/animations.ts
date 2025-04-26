// 动画持续时间常量
export const DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
};

// 常用的动画类名
export const ANIMATIONS = {
  fadeIn: "animate-fadeIn",
  fadeOut: "animate-fadeOut",
  slideInRight: "animate-slideInRight",
  slideOutRight: "animate-slideOutRight",
  slideInLeft: "animate-slideInLeft",
  slideOutLeft: "animate-slideOutLeft",
  scaleIn: "animate-scaleIn",
  scaleOut: "animate-scaleOut",
  pulse: "animate-pulse",
  bounce: "animate-bounce",
  spin: "animate-spin",
};

// 动画延迟类
export const DELAYS = {
  none: "",
  small: "delay-150",
  medium: "delay-300",
  large: "delay-500",
};

// 动画缓动函数
export const EASINGS = {
  default: "ease-in-out",
  linear: "linear",
  in: "ease-in",
  out: "ease-out",
  inOut: "ease-in-out",
};

// 为元素添加进入动画的工具函数
export function getEnterAnimationClass(index = 0): string {
  return `opacity-0 animate-fadeIn ${index > 0 ? `delay-${index * 100}` : ""}`;
}

// 为列表项添加交错动画的工具函数
export function getStaggeredAnimationClass(index: number): string {
  return `animate-fadeIn opacity-0 [animation-delay:${index * 100}ms] [animation-fill-mode:forwards]`;
}
