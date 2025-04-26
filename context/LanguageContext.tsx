"use client";

import type React from "react";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface LanguageContextType {
  locale: string;
  changeLanguage: (lang: string) => void;
  t: (key: string) => string;
  availableLanguages: Record<string, string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

// 翻译字典，包含中文和英文
const translations: Record<string, Record<string, string>> = {
  "zh-CN": {
    "app.title": "MoodShaker",
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
    "questions.back": "返回",
    "questions.availableSpirits": "可用的基酒（可选）",
    "questions.selectSpirits": "请选择您家中有的基酒",
    "questions.feedback.title": "还有什么想告诉我们的？",
    "questions.feedback.description": "请分享您的任何特殊需求或偏好",
    "questions.feedback.placeholder":
      "例如：我喜欢甜一点的鸡尾酒，或者我对某种成分过敏...",
    "questions.submit": "查看推荐鸡尾酒",
    "questions.loading": "正在为您匹配...",
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
  },
  en: {
    "app.title": "MoodShaker",
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
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const availableLanguages: Record<string, string> = {
    "zh-CN": "中文",
    en: "English",
  };

  const getInitialLanguage = (): string => {
    if (typeof window === "undefined") return "zh-CN";

    const savedLanguage = localStorage.getItem("moodshaker-language");
    if (savedLanguage && availableLanguages[savedLanguage]) {
      return savedLanguage;
    }

    // Try to detect browser language
    if (typeof navigator !== "undefined") {
      const browserLang = navigator.language;
      if (browserLang.startsWith("en")) return "en";
      if (browserLang.startsWith("zh")) return "zh-CN";
    }

    return "zh-CN";
  };

  const [locale, setLocale] = useState<string>(getInitialLanguage());

  const changeLanguage = async (lang: string): Promise<void> => {
    if (availableLanguages[lang]) {
      setLocale(lang);
      localStorage.setItem("moodshaker-language", lang);
    }
  };

  const t = (key: string): string => {
    return translations[locale]?.[key] || key;
  };

  // 更新页面标题
  useEffect(() => {
    document.title = t("app.title");
  }, [locale]);

  return (
    <LanguageContext.Provider
      value={{
        locale,
        changeLanguage,
        t,
        availableLanguages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
