"use client";

import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error("Layout Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center p-8 max-w-md border-2 border-primary shadow-[0_0_20px_rgba(255,0,255,0.4)] bg-black/80">
        <h2 className="text-3xl font-heading font-black mb-4 text-primary drop-shadow-[0_0_10px_currentColor]">
          {t("common.error") || "SYSTEM ERROR"}
        </h2>
        <p className="text-muted-foreground font-mono mb-8">
          The simulation encountered an unexpected glitch.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-2 border-2 border-accent text-accent font-mono uppercase tracking-widest hover:bg-accent/20 hover:shadow-[0_0_15px_rgba(255,153,0,0.5)] transition-all"
        >
          {t("questions.reset") || "REBOOT"}
        </button>
      </div>
    </div>
  );
}
