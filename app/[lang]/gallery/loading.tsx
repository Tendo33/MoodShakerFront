"use client";

import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Loading() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/90 text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
        <p className="text-lg font-medium animate-pulse text-white/80">
          {t("common.loading")}
        </p>
      </div>
    </div>
  );
}
