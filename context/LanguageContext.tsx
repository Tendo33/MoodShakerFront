"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DEFAULT_LOCALE,
  HTML_LANG,
  LOCALES,
  LOCALE_COOKIE,
  type Locale,
  localeFromPathname,
  localizePathname,
} from "@/lib/i18n/config";
import {
  type TranslationKey,
  translate,
  translateDynamic,
} from "@/lib/i18n/dictionary";

/**
 * Exposes the locale taken from the URL.
 *
 * The URL prefix is the only source. The previous version resolved language from
 * the pathname, then `localStorage`, then `navigator.language`, and kept the
 * result in state that could drift from the address bar — so `/en/gallery` could
 * render Chinese if a stale value had been stored.
 *
 * Nothing is read from storage here, and nothing is persisted on load. The
 * explicit choice is written by `setLanguage` as a cookie, which is the only
 * form the proxy can read on an unprefixed URL.
 */

export type { Locale };

interface LanguageContextType {
  language: Locale;
  availableLanguages: readonly Locale[];
  /** Translates a literal key. A typo or unknown key fails the build. */
  t: (key: TranslationKey) => string;
  /**
   * Translates a key assembled at runtime, e.g. from a database value.
   *
   * Returns `null` when the key is unknown so the caller decides what to show.
   * `t()` used to accept any string and echo it back, which is how users saw the
   * literal text `gallery.spirit.rum` on screen.
   */
  tDynamic: (key: string) => string | null;
  setLanguage: (language: Locale) => void;
  getPathWithLanguage: (path: string, language?: Locale) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const pathname = usePathname();
  const router = useRouter();

  // The proxy guarantees a prefix on every page route, so the fallback only
  // applies to a render outside that guarantee.
  const language = localeFromPathname(pathname) ?? DEFAULT_LOCALE;

  // 客户端导航后同步 <html lang>。
  //
  // 根布局是服务端组件，客户端跳转时不会重新渲染，所以它设的 lang 会停在首次加载
  // 的值。实测：从 /cn 点切换到 /en，URL 和文案都变成英文了，lang 仍是 zh-CN。
  //
  // 后果不只是标记不准。globals.css 里那组 html:lang(en) 规则全部失效，标题的
  // overflow-wrap 拿不到 break-word，长单词又被裁回去；读屏软件也会继续用中文发音
  // 念英文内容。硬刷新才正常，这正是这类 bug 容易被漏掉的原因。
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[language];
  }, [language]);

  const t = useCallback(
    (key: TranslationKey) => translate(language, key),
    [language],
  );

  const tDynamic = useCallback(
    (key: string) => translateDynamic(language, key),
    [language],
  );

  const getPathWithLanguage = useCallback(
    (path: string, target?: Locale) => localizePathname(path, target ?? language),
    [language],
  );

  const setLanguage = useCallback(
    (next: Locale) => {
      if (next === language) return;

      // Persisted as a cookie because that is what the proxy reads when a URL
      // arrives without a prefix. The old code wrote `moodshaker-language` to
      // localStorage while the proxy looked for a cookie of the same name, so an
      // explicit choice never survived a visit to `/` and the browser's
      // `accept-language` won instead.
      document.cookie = [
        `${LOCALE_COOKIE}=${next}`,
        "path=/",
        `max-age=${60 * 60 * 24 * 365}`,
        "samesite=lax",
      ].join("; ");

      router.push(localizePathname(pathname || "/", next));
    },
    [language, pathname, router],
  );

  const value = useMemo(
    () => ({
      language,
      availableLanguages: LOCALES,
      t,
      tDynamic,
      setLanguage,
      getPathWithLanguage,
    }),
    [language, t, tDynamic, setLanguage, getPathWithLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
};
