"use client";

import { Button as BaseButton, type ButtonProps } from "@/components/coss/button";

/**
 * The ticket's action: coss Button, defaulted to its `xl` size so a primary
 * and a quiet action carry the same weight on the paper.
 *
 * Do not add `text-*` or height utilities here. The registry variant already
 * sets `text-primary-foreground`; tailwind-merge treats a second `text-*` as
 * the same group, drops the colour, and the label disappears into the fill.
 * Local size differences belong at the call site.
 */
export function Button({ size = "xl", ...props }: ButtonProps) {
  return <BaseButton size={size} {...props} />;
}
