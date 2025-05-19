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
export type Language = "en" | "cn";

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
  cn: {
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
    "questions.availableSpirits": "可用的基酒（可选）✨",
    "questions.selectSpirits": "请选择您家中有的基酒",
    "questions.feedback.title": "最后一步：分享你的心情！🥳",
    "questions.feedback.description":
      "告诉我们你现在的心情 - 我们会为你调制一杯完美的鸡尾酒！",
    "questions.feedback.placeholder":
      "想要冒险？在庆祝什么？还是只想放松一下？今天的心情？告诉我们吧！✨",
    "questions.submit": "查看推荐鸡尾酒",
    "questions.loading": "正在为您匹配...",
    "questions.ready.title": "准备好摇一摇了吗？🍸",
    "questions.ready.description":
      "让我们找到你的完美鸡尾酒！今天是想来点经典款还是想尝试新花样？",
    "questions.strength.title": "想要多上头？💪",
    "questions.strength.description": "选择你的酒精等级 - 从微醺到派对启动器！",
    "questions.skill.title": "调酒技能点？🎯",
    "questions.skill.description":
      "想要多花哨的调酒方式？我们为每个技能等级都准备了选项！",

    // Question options
    "questions.options.classic": "经典特调",
    "questions.options.custom": "来点惊喜",
    "questions.options.low": "低酒精度",
    "questions.options.medium": "中酒精度",
    "questions.options.high": "高酒精度",
    "questions.options.any": "我无所谓",
    "questions.options.easy": "简单混合",
    "questions.options.hard": "调酒大师",

    // Base spirits
    "spirits.all": "全部🎉",
    "spirits.all.desc": "使用所有基酒",
    "spirits.gin": "金酒🌿",
    "spirits.gin.desc": "Gin",
    "spirits.rum": "朗姆酒🏝️",
    "spirits.rum.desc": "Rum",
    "spirits.vodka": "伏特加❄️",
    "spirits.vodka.desc": "Vodka",
    "spirits.whiskey": "威士忌🥃",
    "spirits.whiskey.desc": "Whiskey",
    "spirits.tequila": "龙舌兰🌵",
    "spirits.tequila.desc": "Tequila",
    "spirits.brandy": "白兰地🍇",
    "spirits.brandy.desc": "Brandy",

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
    "language.cn": "中文",

    // Common
    "common.loading": "加载中...",
    "common.error": "出错了",
    "common.tryAgain": "重试",

    // Recommendation page
    "recommendation.back": "返回首页",
    "recommendation.share": "分享配方",
    "recommendation.copied": "链接已复制到剪贴板",
    "recommendation.yourRequirements": "您的需求",
    "recommendation.recommendationReason": "为什么推荐这款",
    "recommendation.ingredients": "配料",
    "recommendation.prepareIngredients": "准备以下配料",
    "recommendation.tools": "工具",
    "recommendation.toolsNeeded": "需要的工具",
    "recommendation.alternative": "替代方案",
    "recommendation.steps": "制作步骤",
    "recommendation.followSteps": "按照以下步骤制作您的鸡尾酒",
    "recommendation.tip": "小贴士",
    "recommendation.tryAgain": "重试",
    "recommendation.notFound": "未找到鸡尾酒",
    "recommendation.notFoundDesc": "抱歉，我们找不到您请求的鸡尾酒",
    "recommendation.loading": "正在加载鸡尾酒信息...",
    "recommendation.imageLoading": "正在生成鸡尾酒图片...",
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
    "questions.availableSpirits": "Available Spirits (Optional) ✨",
    "questions.selectSpirits": "Please select the spirits you have at home",
    "questions.feedback.title": "Last Step: Share Your Mood! 🥳",
    "questions.feedback.description":
      "Tell us what you're in the mood for - we'll craft the perfect cocktail just for you!",
    "questions.feedback.placeholder":
      "Feeling adventurous? Celebrating something special? Just want to relax? Let us know! ✨",
    "questions.submit": "View Recommended Cocktail",
    "questions.loading": "Finding your perfect match...",
    "questions.ready.title": "Ready to shake things up? 🍸",
    "questions.ready.description":
      "Let's find your perfect cocktail match! Are you feeling classic or adventurous today?",
    "questions.strength.title": "How strong do you want it? 💪",
    "questions.strength.description":
      "Choose your power level - from a gentle buzz to a full-on party starter!",
    "questions.skill.title": "Mixology Level? 🎯",
    "questions.skill.description":
      "How fancy do you want to get with your cocktail making? We've got options for every skill level!",

    // Question options
    "questions.options.classic": "Choose from classics",
    "questions.options.custom": "Surprise Me!",
    "questions.options.low": "Just a Sip",
    "questions.options.medium": "Balanced Buzz",
    "questions.options.high": "Party Mode",
    "questions.options.any": "Surprise Me!",
    "questions.options.easy": "Mix & Pour",
    "questions.options.hard": "Master Mixologist",

    // Base spirits
    "spirits.all": "All",
    "spirits.all.desc": "Use all base spirits",
    "spirits.gin": "Gin",
    "spirits.gin.desc": "Gin",
    "spirits.rum": "Rum",
    "spirits.rum.desc": "Rum",
    "spirits.vodka": "Vodka",
    "spirits.vodka.desc": "Vodka",
    "spirits.whiskey": "Whiskey",
    "spirits.whiskey.desc": "Whiskey",
    "spirits.tequila": "Tequila",
    "spirits.tequila.desc": "Tequila",
    "spirits.brandy": "Brandy",
    "spirits.brandy.desc": "Brandy",

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
    "language.cn": "中文",

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
  const [language, setLanguageState] = useState<Language>("cn");
  const [isLoading, setIsLoading] = useState(true);

  const availableLanguages: Record<string, string> = {
    en: "English",
    cn: "中文",
  };

  // Helper function to extract language from pathname
  const extractLanguageFromPathname = useCallback(
    (path: string): Language | null => {
      if (path.startsWith("/en")) return "en";
      if (path.startsWith("/cn")) return "cn";
      return null;
    },
    [],
  );

  // Helper function to get path without language prefix
  const getPathWithoutLanguage = useCallback((path: string): string => {
    if (path.startsWith("/en/")) return path.substring(3);
    if (path.startsWith("/cn/")) return path.substring(3);
    if (path === "/en" || path === "/cn") return "/";
    return path;
  }, []);

  // Helper function to get path with language prefix
  const getPathWithLanguage = useCallback(
    (path: string): string => {
      const langPrefix = language === "en" ? "/en" : "/cn";
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
      console.log("初始化语言...");

      // First check URL path for language parameter
      if (pathname) {
        console.log("检查URL路径:", pathname);
        const pathLang = extractLanguageFromPathname(pathname);
        if (pathLang) {
          console.log("从URL检测到语言:", pathLang);
          setLanguageState(pathLang);
          // Save to localStorage to maintain consistency
          localStorage.setItem("moodshaker-language", pathLang);
          setIsLoading(false);
          return;
        }
      }

      // Then check localStorage
      const savedLanguage = localStorage.getItem("moodshaker-language");
      console.log("从localStorage中读取语言:", savedLanguage);
      if (savedLanguage && (savedLanguage === "en" || savedLanguage === "cn")) {
        console.log("使用localStorage中的语言:", savedLanguage);
        setLanguageState(savedLanguage as Language);
        setIsLoading(false);
        return;
      }

      // Default to Chinese
      console.log("默认使用中文");
      setLanguageState("cn");
      localStorage.setItem("moodshaker-language", "cn");
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
            pathLang !== (language === "en" ? "en" : "cn"))
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
      console.log("Setting language to:", lang);

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("moodshaker-language", lang);
      }

      // Update URL path if we're on the client side
      if (typeof window !== "undefined" && pathname) {
        const pathWithoutLang = getPathWithoutLanguage(pathname);
        const newPath =
          pathWithoutLang === "/" ? `/${lang}` : `/${lang}${pathWithoutLang}`;
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
    locale: language === "en" ? "en" : "cn",
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
