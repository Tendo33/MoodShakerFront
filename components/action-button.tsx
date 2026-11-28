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
 *
 * The accent is spent here and on the stamp: the fill is ink at rest and turns
 * brand under the pointer, so the page keeps one red and only on the thing
 * being pressed. The arrow steps right with it. Secondary and link actions keep
 * the registry's quiet look and are left alone.
 */
export function Button({ size = "xl", variant, className, ...props }: ButtonProps) {
  const primary = variant === undefined || variant === "default";
  const secondary = variant === "secondary";

  return (
    <BaseButton
      size={size}
      variant={variant}
      className={[
        primary &&
          "group/action border-ink bg-ink text-bone shadow-none transition-[background-color,border-color,transform] duration-200 ease-out hover:border-brand hover:bg-brand hover:text-bone data-pressed:border-brand data-pressed:bg-brand active:translate-y-px motion-reduce:transition-none [&_[aria-hidden]]:inline-block [&_[aria-hidden]]:transition-transform [&_[aria-hidden]]:duration-200 group-hover/action:[&_[aria-hidden]]:translate-x-0.5",
        // The registry's secondary relies on its own grey; on bone it is invisible.
        // A hairline is the ticket's own way of drawing a quiet control.
        secondary &&
          "border-ink/30 bg-transparent text-ink transition-colors duration-200 hover:border-ink/60 hover:bg-surface data-pressed:bg-surface disabled:border-ink/12 disabled:text-ink/40 disabled:opacity-100",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
