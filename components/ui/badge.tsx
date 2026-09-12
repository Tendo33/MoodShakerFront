import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "glass-subtle inline-flex items-center border px-3 py-1 font-mono text-xs uppercase tracking-[0.16em]",
  {
    variants: {
      variant: {
        primary: "border-primary/35 text-primary",
        secondary: "border-secondary/35 text-secondary",
        accent: "border-accent/40 text-accent",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
