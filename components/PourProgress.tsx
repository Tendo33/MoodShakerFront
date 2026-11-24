"use client";

import { useEffect, useState } from "react";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/coss/progress";
import { cn } from "@/lib/utils";

/**
 * The wait, as a coss Progress: it runs fast, then slows, and never quite
 * arrives. Only `done` closes it, because the real end is the answer.
 * `seconds` is the time constant: after that long the bar is about 60% full.
 */
export function PourProgress({
  done = false,
  seconds = 30,
  className,
}: {
  done?: boolean;
  seconds?: number;
  className?: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (done) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [done]);

  const value = done ? 100 : 94 * (1 - Math.exp(-elapsed / seconds));

  return (
    <Progress value={value} aria-hidden className={cn("gap-0", className)}>
      <ProgressTrack className="h-1 rounded-none bg-ink/15">
        <ProgressIndicator className="rounded-none bg-ink duration-1000 ease-linear" />
      </ProgressTrack>
    </Progress>
  );
}
