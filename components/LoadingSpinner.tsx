"use client";

import { TerminalLoader } from "@/components/ui/terminal-loader";

interface LoadingSpinnerProps {
  text?: string;
  colorClass?: string;
  variant?: "classic" | "modern" | "dots" | "ring" | "inline";
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({
  text,
  colorClass,
  variant,
  size,
}: LoadingSpinnerProps) {
  void colorClass;
  void variant;
  void size;

  return (
    <div
      className="flex flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      <TerminalLoader rows={5} cols={20} />
      {text ? (
        <p className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
          {text}
        </p>
      ) : null}
    </div>
  );
}
