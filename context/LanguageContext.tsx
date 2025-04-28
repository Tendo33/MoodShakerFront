"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

// Define available languages
export type Language = "en" | "zh-CN";

// Define translation dictionary structure
type TranslationDictionary = Record<string, Record<string, string>>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  availableLanguages: Record<string, string>;
  isLoading: boolean;
  locale: string;
  getPathWithLanguage: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

// Translation dictionaries
const translations: TranslationDictionary = {
  "zh-CN": {
    // App title
    "app.title": "MoodShaker",
    // Navigation
    "nav.home": "首页",
    "nav.discover": "探索",
    "nav.questions": "问题",
    "nav.about": "关于我们",

    // Home page
    "home.title": "找到适合您心情的鸡尾酒",
    "home.subtitle": "通过回答几个简单问题，让我为您推荐完美的鸡尾酒",
    "home.feature1.title": "个性化推荐",
    "home.feature1.description":
      "根据您的口味偏好和心情，为您量身定制鸡尾酒推荐",
    "home.feature2.title": "详细配方",
    "home.feature2.description":
      "获取完整的配料清单和制作步骤，轻松在家调制美味鸡尾酒",
    "home.feature3.title": "创意灵感",
    "home.feature3.description":
      "发现新的口味组合和创意调酒技巧，提升您的调酒体验",
    "home.start": "开始探索",
    "home.continue": "继续上次问卷",
    "home.new": "开始新问卷",
    "home.savedSession": "检测到未完成的问卷",
    "home.savedSessionDesc":
      "您有一个未完成的鸡尾酒推荐问卷。您想继续之前的问卷还是开始一个新的？",

    // Questions page
    "questions.back": "返回",
    "questions.availableSpirits": "可用的基酒（可选）",
    "questions.selectSpirits": "请选择您家中有的基酒",
    "questions.feedback.title": "还有什么想告诉我们的？",
    "questions.feedback.description": "请分享您的任何特殊需求或偏好",
    "questions.feedback.placeholder":
      "例如：我喜欢甜一点的鸡尾酒，或者我对某种成分过敏...",
    "questions.submit": "查看推荐鸡尾酒",
    "questions.loading": "正在为您匹配...",

    // Recommendation page
    "recommendation.back": "返回首页",
    "recommendation.share": "分享配方",
    "recommendation.copied": "链接已复制到剪贴板",
    "recommendation.yourRequirements": "您的需求",
    "recommendation.recommendationReason": "推荐理由",
    "recommendation.ingredients": "配料",
    "recommendation.prepareIngredients": "准备以下材料",
    "recommendation.tools": "工具",
    "recommendation.toolsNeeded": "您需要的调酒工具",
    "recommendation.alternative": "替代品",
    "recommendation.steps": "制作步骤",
    "recommendation.followSteps": "按照以下步骤制作您的鸡尾酒",
    "recommendation.tip": "提示",
    "recommendation.tryAgain": "重新选择",
    "recommendation.notFound": "未找到鸡尾酒",
    "recommendation.notFoundDesc": "抱歉，我们无法找到您请求的鸡尾酒",
    "recommendation.loading": "正在加载鸡尾酒信息...",
    "recommendation.imageLoading": "正在生成鸡尾酒图片...",

    // Footer
    "footer.quickLinks": "快速链接",
    "footer.about": "关于我们",
    "footer.privacy": "隐私政策",
    "footer.terms": "使用条款",
    "footer.contact": "联系我们",
    "footer.madeWith": "用",
    "footer.inShanghai": "在上海制作",

    // Language selector
    "language.select": "选择语言",
    "language.en": "English",
    "language.zh": "中文",

    // Common
    "common.loading": "加载中...",
    "common.error": "出错了",
    "common.tryAgain": "重试",
  },
  en: {
    // App title
    "app.title": "MoodShaker",
    // Navigation
    "nav.home": "Home",
    "nav.discover": "Discover",
    "nav.questions": "Questions",
    "nav.about": "About Us",

    // Home page
    "home.title": "Find the Perfect Cocktail for Your Mood",
    "home.subtitle":
      "Answer a few simple questions and let us recommend the perfect cocktail for you",
    "home.feature1.title": "Personalized Recommendations",
    "home.feature1.description":
      "Get cocktail recommendations tailored to your taste preferences and mood",
    "home.feature2.title": "Detailed Recipes",
    "home.feature2.description":
      "Get complete ingredient lists and step-by-step instructions to easily make delicious cocktails at home",
    "home.feature3.title": "Creative Inspiration",
    "home.feature3.description":
      "Discover new flavor combinations and creative bartending techniques to enhance your cocktail experience",
    "home.start": "Start Exploring",
    "home.continue": "Continue Previous Survey",
    "home.new": "Start New Survey",
    "home.savedSession": "Unfinished Survey Detected",
    "home.savedSessionDesc":
      "You have an unfinished cocktail recommendation survey. Would you like to continue your previous survey or start a new one?",

    // Questions page
    "questions.back": "Back",
    "questions.availableSpirits": "Available Spirits (Optional)",
    "questions.selectSpirits": "Please select the spirits you have at home",
    "questions.feedback.title": "Anything else you'd like to tell us?",
    "questions.feedback.description":
      "Please share any special requirements or preferences",
    "questions.feedback.placeholder":
      "For example: I prefer sweeter cocktails, or I'm allergic to certain ingredients...",
    "questions.submit": "View Recommended Cocktail",
    "questions.loading": "Finding your perfect match...",

    // Recommendation page
    "recommendation.back": "Back to Home",
    "recommendation.share": "Share Recipe",
    "recommendation.copied": "Link copied to clipboard",
    "recommendation.yourRequirements": "Your Requirements",
    "recommendation.recommendationReason": "Why We Recommend This",
    "recommendation.ingredients": "Ingredients",
    "recommendation.prepareIngredients": "Prepare the following ingredients",
    "recommendation.tools": "Tools",
    "recommendation.toolsNeeded": "Tools you'll need",
    "recommendation.alternative": "Alternative",
    "recommendation.steps": "Preparation Steps",
    "recommendation.followSteps": "Follow these steps to make your cocktail",
    "recommendation.tip": "Tip",
    "recommendation.tryAgain": "Try Again",
    "recommendation.notFound": "Cocktail Not Found",
    "recommendation.notFoundDesc":
      "Sorry, we couldn't find the cocktail you requested",
    "recommendation.loading": "Loading cocktail information...",
    "recommendation.imageLoading": "Generating cocktail image...",

    // Footer
    "footer.quickLinks": "Quick Links",
    "footer.about": "About Us",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Use",
    "footer.contact": "Contact Us",
    "footer.madeWith": "Made with",
    "footer.inShanghai": "in Shanghai",

    // Language selector
    "language.select": "Select Language",
    "language.en": "English",
    "language.zh": "中文",

    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.tryAgain": "Try Again",
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  const availableLanguages: Record<string, string> = {
    en: "English",
    "zh-CN": "中文",
  };

  // Helper function to extract language from pathname
  const extractLanguageFromPathname = useCallback(
    (path: string): Language | null => {
      if (path.startsWith("/en")) return "en";
      if (path.startsWith("/zh")) return "zh-CN";
      return null;
    },
    [],
  );

  // Helper function to get path without language prefix
  const getPathWithoutLanguage = useCallback((path: string): string => {
    if (path.startsWith("/en/")) return path.substring(3);
    if (path.startsWith("/zh/")) return path.substring(3);
    if (path === "/en" || path === "/zh") return "/";
    return path;
  }, []);

  // Helper function to get path with language prefix
  const getPathWithLanguage = useCallback(
    (path: string): string => {
      const langPrefix = language === "en" ? "/en" : "/zh";
      const pathWithoutLang = getPathWithoutLanguage(path);

      if (pathWithoutLang === "/") return langPrefix;
      return `${langPrefix}${pathWithoutLang}`;
    },
    [language, getPathWithoutLanguage],
  );

  // Initialize language from URL or localStorage
  useEffect(() => {
    const initializeLanguage = () => {
      setIsLoading(true);

      // First check URL path for language parameter
      if (pathname) {
        const pathLang = extractLanguageFromPathname(pathname);
        if (pathLang) {
          setLanguageState(pathLang);
          // Save to localStorage to maintain consistency
          localStorage.setItem("moodshaker-language", pathLang);
          setIsLoading(false);
          return;
        }
      }

      // Then check localStorage
      const savedLanguage = localStorage.getItem("moodshaker-language");
      if (
        savedLanguage &&
        (savedLanguage === "en" || savedLanguage === "zh-CN")
      ) {
        setLanguageState(savedLanguage as Language);
        setIsLoading(false);
        return;
      }

      // Finally, try to detect browser language
      const browserLang = navigator.language;
      const detectedLang = browserLang.startsWith("zh") ? "zh-CN" : "en";
      setLanguageState(detectedLang);
      localStorage.setItem("moodshaker-language", detectedLang);

      setIsLoading(false);
    };

    if (typeof window !== "undefined") {
      initializeLanguage();
    }
  }, [pathname, extractLanguageFromPathname]);

  // Set custom header for middleware when language changes
  useEffect(() => {
    if (typeof window !== "undefined" && !isLoading) {
      // This is a client-side effect to help with back navigation
      // Create a custom event that can be listened to by navigation handlers
      const event = new CustomEvent("languageChanged", { detail: language });
      window.dispatchEvent(event);

      // Add event listener for popstate (back/forward navigation)
      const handlePopState = () => {
        // When navigating back, we need to check if we should redirect
        const currentPath = window.location.pathname;
        const pathLang = extractLanguageFromPathname(currentPath);

        // If there's no language in the path or it's different from current language,
        // redirect to the correct language path
        if (
          !pathLang ||
          (pathLang !== language &&
            pathLang !== (language === "en" ? "en" : "zh"))
        ) {
          const newPath = getPathWithLanguage(currentPath);
          window.history.replaceState(null, "", newPath);
        }
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [language, isLoading, extractLanguageFromPathname, getPathWithLanguage]);

  // Update URL when language changes
  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageState(lang);

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("moodshaker-language", lang);
      }

      // Update URL path if we're on the client side
      if (typeof window !== "undefined" && pathname) {
        const langPrefix = lang === "en" ? "/en" : "/zh";
        const pathWithoutLang = getPathWithoutLanguage(pathname);

        const newPath =
          pathWithoutLang === "/"
            ? langPrefix
            : `${langPrefix}${pathWithoutLang}`;
        router.push(newPath);
      }
    },
    [pathname, router, getPathWithoutLanguage],
  );

  // Translation function
  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || key;
    },
    [language],
  );

  // Update document title when language changes
  useEffect(() => {
    if (!isLoading) {
      document.title = t("app.title") || "MoodShaker";
    }
  }, [language, isLoading, t]);

  const contextValue = {
    language,
    setLanguage,
    t,
    availableLanguages,
    isLoading,
    locale: language === "en" ? "en" : "zh",
    getPathWithLanguage,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
