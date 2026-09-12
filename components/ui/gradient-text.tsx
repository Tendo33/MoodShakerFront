import * as React from "react";
import { cn } from "@/lib/utils";

interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  as?: React.ElementType;
  from?: string;
  to?: string;
}

const GradientText = React.forwardRef<HTMLSpanElement, GradientTextProps>(
  (
    {
      as: Component = "span",
      children,
      className,
      from = "primary",
      to = "secondary",
      ...props
    },
    ref,
  ) => {
    void from;
    void to;
    return (
      <Component
        ref={ref}
        className={cn(
          "gradient-text font-heading font-black tracking-tight",
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    );
  },
);
GradientText.displayName = "GradientText";

export { GradientText };
export type { GradientTextProps };
