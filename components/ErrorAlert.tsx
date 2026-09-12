"use client";

import { CircleAlert, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useError } from "@/context/ErrorContext";
import { useLanguage } from "@/context/LanguageContext";

export default function ErrorAlert() {
  const { errors, clearError } = useError();
  const { t, language } = useLanguage();

  // Get the first error message (if any)
  const message = errors.length > 0 ? errors[0].message : null;
  const isVisible = Boolean(message);

  if (!message) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center px-4 py-6 sm:items-start sm:justify-end sm:p-6"
      aria-live="assertive"
    >
      <Alert
        variant="destructive"
        className={`max-w-sm pointer-events-auto p-4 shadow-lg transition duration-300 ease-out ${
          isVisible
            ? "translate-y-0 opacity-100 sm:translate-x-0"
            : "translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        }`}
      >
        <div className="flex items-start">
          <CircleAlert className="h-6 w-6 shrink-0 text-destructive" />
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <AlertTitle>{t("common.error")}</AlertTitle>
            <AlertDescription className="mt-1">{message}</AlertDescription>
          </div>
          <button
            onClick={() => clearError(errors[0].id)}
            className="ml-4 inline-flex text-muted-foreground transition duration-150 ease-in-out hover:text-foreground focus:text-foreground focus-ring"
            type="button"
            aria-label={language === "en" ? "Close" : "关闭"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </Alert>
    </div>
  );
}
