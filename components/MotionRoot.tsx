"use client";

import { MotionConfig } from "motion/react";

/** One place that makes every `motion.*` element honour prefers-reduced-motion. */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
