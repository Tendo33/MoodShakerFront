"use client";

import type React from "react";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

interface LanguageLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function LanguageLink({
  href,
  children,
  className,
  onClick,
}: LanguageLinkProps) {
  const { getPathWithLanguage } = useLanguage();

  // Get the correct path with language prefix
  const languagePath = getPathWithLanguage(href);

  return (
    <Link href={languagePath} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
