"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function NotFound() {
  const { t, getPathWithLanguage } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center p-8 max-w-md border-2 border-secondary shadow-[0_0_16px_rgba(0,255,255,0.4)] bg-black/80">
        <h2 className="text-3xl font-heading font-black mb-4 text-secondary drop-shadow-[0_0_10px_currentColor]">
          {t("notFound.title")}
        </h2>
        <p className="text-muted-foreground font-mono mb-8">
          {t("notFound.description")}
        </p>
        <Link
          href={getPathWithLanguage("/")}
          className="inline-flex px-6 py-2 border-2 border-primary text-primary font-mono uppercase tracking-widest hover:bg-primary/20 hover:shadow-[0_0_15px_rgba(255,0,255,0.5)] transition-all"
        >
          {t("notFound.action")}
        </Link>
      </div>
    </div>
  );
}
