import * as React from "react";
import { cn } from "@/lib/utils";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  label?: string;
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", label, ...props }, ref) => {
    if (orientation === "vertical") {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="vertical"
          className={cn("mx-2 h-full w-px bg-primary/50", className)}
          {...props}
        />
      );
    }

    if (label) {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="horizontal"
          className={cn("relative my-4 flex w-full items-center", className)}
          {...props}
        >
          <div className="h-0.5 grow bg-linear-to-r from-transparent to-primary" />
          <span className="px-4 font-mono text-sm uppercase tracking-widest text-primary">
            {label}
          </span>
          <div className="h-0.5 grow bg-linear-to-l from-transparent to-primary" />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="horizontal"
        className={cn(
          "my-4 h-0.5 w-full bg-linear-to-r from-primary to-transparent",
          className,
        )}
        {...props}
      />
    );
  },
);
Separator.displayName = "Separator";

const Divider = Separator;

export { Separator, Divider };
export type { SeparatorProps };
