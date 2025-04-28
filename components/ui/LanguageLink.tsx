"use client";

import type React from "react";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

interface LanguageLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export default function LanguageLink({
  href,
  children,
  className,
  ...props
}: LanguageLinkProps) {
  const { language } = useLanguage();

  // Ensure the href has the correct language prefix
  const getLanguageHref = () => {
    // If href already starts with a language code, replace it
    if (href.startsWith("/en/") || href.startsWith("/cn/")) {
      const pathWithoutLang = href.substring(3);
      return `/${language}${pathWithoutLang}`;
    }

    // If href is just a language code, return the new language code
    if (href === "/en" || href === "/cn") {
      return `/${language}`;
    }

    // If href starts with / but not with a language code, add the language code
    if (href.startsWith("/")) {
      return `/${language}${href}`;
    }

    // Otherwise, just return the href as is
    return href;
  };

  return (
    <Link href={getLanguageHref()} className={className} {...props}>
      {children}
    </Link>
  );
}
