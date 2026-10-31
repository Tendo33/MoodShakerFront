"use client";

import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, localizePath, type Locale } from "@/lib/i18n";

/** Same page in the other language. The choice is remembered for locale-less URLs. */
export function LanguageSwitch({ locale, label, ariaLabel }: { locale: Locale; label: string; ariaLabel: string }) {
  const pathname = usePathname();
  const target: Locale = locale === "cn" ? "en" : "cn";

  return (
    <a
      href={localizePath(pathname, target)}
      hrefLang={target === "cn" ? "zh-CN" : "en"}
      aria-label={ariaLabel}
      onClick={(event) => {
        document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
        // Keep filters such as ?spirit= across the switch.
        event.currentTarget.href = localizePath(pathname, target) + window.location.search;
      }}
      className="link"
    >
      {label}
    </a>
  );
}
