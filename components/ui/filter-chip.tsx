import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const filterChipVariants = cva(
  "min-h-11 rounded-none border-2 px-4 py-2.5 text-xs font-mono uppercase tracking-widest backdrop-blur-md transition-all duration-300 active:scale-95 focus-ring",
  {
    variants: {
      tone: {
        primary: "",
        secondary: "",
        accent: "",
      },
      pressed: {
        true: "font-semibold",
        false: "border-primary/20 bg-black/40 text-muted-foreground",
      },
    },
    compoundVariants: [
      {
        tone: "primary",
        pressed: true,
        class: "border-primary bg-primary text-black",
      },
      {
        tone: "primary",
        pressed: false,
        class: "hover:border-primary hover:bg-primary/10 hover:text-primary",
      },
      {
        tone: "secondary",
        pressed: true,
        class: "border-secondary bg-secondary text-black",
      },
      {
        tone: "secondary",
        pressed: false,
        class:
          "hover:border-secondary hover:bg-secondary/10 hover:text-secondary",
      },
      {
        tone: "accent",
        pressed: true,
        class: "border-accent bg-accent text-black",
      },
      {
        tone: "accent",
        pressed: false,
        class: "hover:border-accent hover:bg-accent/10 hover:text-accent",
      },
    ],
    defaultVariants: {
      tone: "primary",
      pressed: false,
    },
  },
);

interface FilterChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof filterChipVariants> {}

const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ className, tone, pressed, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        aria-pressed={Boolean(pressed)}
        className={cn(filterChipVariants({ tone, pressed }), className)}
        {...props}
      />
    );
  },
);
FilterChip.displayName = "FilterChip";

export { FilterChip, filterChipVariants };
export type { FilterChipProps };
