"use client";

import { useLanguage } from "@/context/LanguageContext";
import { TerminalLoader } from "@/components/ui/terminal-loader";

export default function Loading() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-black/90">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <TerminalLoader rows={5} cols={20} />
        <p className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
          {t("common.loading")}
        </p>
      </div>
    </div>
  );
}
