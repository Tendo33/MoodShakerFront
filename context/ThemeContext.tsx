"use client";

import type React from "react";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

type ThemeType = "dark";

interface ThemeContextType {
  theme: ThemeType;
  getTextColorClass: (defaultClass?: string) => string;
  getSecondaryTextColorClass: () => string;
  getMutedTextColorClass: () => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>("dark");
  const [mounted, setMounted] = useState(false);

  // 应用主题到文档
  const applyTheme = (newTheme: ThemeType): void => {
    if (typeof document === "undefined") return;

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);

    // 更新 meta 标签以支持移动设备的主题色
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", "#111827");
    }
  };

  // 获取当前主题的文本颜色类
  const getTextColorClass = (defaultClass = ""): string => {
    return defaultClass || "text-white";
  };

  // 获取当前主题的次要文本颜色类
  const getSecondaryTextColorClass = (): string => {
    return "text-gray-300";
  };

  // 获取当前主题的静音文本颜色类
  const getMutedTextColorClass = (): string => {
    return "text-gray-400";
  };

  // 初始化主题
  useEffect(() => {
    setMounted(true);
    applyTheme(theme);
  }, [theme]);

  // 防止水合不匹配
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          theme: "dark",
          getTextColorClass,
          getSecondaryTextColorClass,
          getMutedTextColorClass,
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        getTextColorClass,
        getSecondaryTextColorClass,
        getMutedTextColorClass,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
