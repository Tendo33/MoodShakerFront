/**
 * 鸡尾酒图片映射配置
 * 集中管理所有鸡尾酒的静态图片资源
 */

export const cocktailImages = {
  mojito: "/vibrant-mojito.png",
  margarita: "/vibrant-margarita.png",
  cosmopolitan: "/city-lights-cocktail.png",
} as const;

export type CocktailImageKey = keyof typeof cocktailImages;
