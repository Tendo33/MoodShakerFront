"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { appLogger } from "@/utils/logger";
import { usePathname, useRouter } from "next/navigation";
import { asyncStorage } from "@/utils/asyncStorage";
import type { ReactNode } from "react";

// Import translations from centralized locales
import {
  translations,
  availableLanguages,
  defaultLanguage,
  type Language,
  type TranslationKey,
} from "@/locales";

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

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

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

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize language from URL or localStorage
  useEffect(() => {
    const initializeLanguage = async () => {
      setIsLoading(true);

      try {
        // First check URL path for language parameter
        if (pathname) {
          const pathLang = extractLanguageFromPathname(pathname);
          if (pathLang) {
            appLogger.debug("Language detected from URL:", pathLang);
            setLanguageState(pathLang);
            // Save to localStorage to maintain consistency (only on client)
            if (isClient) {
              await asyncStorage.setItem("moodshaker-language", pathLang);
            }
            setIsLoading(false);
            return;
          }
        }

        // Then check localStorage (only on client)
        if (isClient) {
          const savedLanguage = await asyncStorage.getItem(
            "moodshaker-language",
            "",
          );
          if (
            savedLanguage &&
            (savedLanguage === "en" || savedLanguage === "cn")
          ) {
            appLogger.debug("Using language from localStorage:", savedLanguage);
            setLanguageState(savedLanguage as Language);
            setIsLoading(false);
            return;
          }
        }

        // Default to configured default language
        setLanguageState(defaultLanguage);
        if (isClient) {
          await asyncStorage.setItem("moodshaker-language", defaultLanguage);
        }
        setIsLoading(false);
      } catch (error) {
        appLogger.error("Language initialization failed:", error);
        // Fallback to default language
        setLanguageState(defaultLanguage);
        setIsLoading(false);
      }
    };

    // Only initialize when we know we're on client or when we have pathname
    if (isClient || pathname) {
      initializeLanguage();
    }
  }, [pathname, extractLanguageFromPathname, isClient]);

  // Set custom header for middleware when language changes
  useEffect(() => {
    if (isClient && !isLoading) {
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
  }, [language, isLoading, extractLanguageFromPathname, getPathWithLanguage, isClient]);

  // Update URL when language changes
  const setLanguage = useCallback(
    async (lang: Language) => {
      setLanguageState(lang);

      // Save to localStorage
      if (isClient) {
        try {
          await asyncStorage.setItem("moodshaker-language", lang);
        } catch (error) {
          appLogger.error("Failed to save language preference:", error);
        }
      }

      // Update URL path if we're on the client side
      if (isClient && pathname) {
        const pathWithoutLang = getPathWithoutLanguage(pathname);
        const newPath =
          pathWithoutLang === "/" ? `/${lang}` : `/${lang}${pathWithoutLang}`;
        router.push(newPath);
      }
    },
    [pathname, router, getPathWithoutLanguage, isClient],
  );

  // Translation function - uses imported translations
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

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      availableLanguages,
      isLoading,
      locale: language === "en" ? "en" : "cn",
      getPathWithLanguage,
    }),
    [language, setLanguage, t, isLoading, getPathWithLanguage],
  );

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

// Re-export types for convenience
export type { Language, TranslationKey };
