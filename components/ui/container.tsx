import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerVariants = cva("mx-auto w-full px-4 md:px-6 lg:px-8", {
  variants: {
    size: {
      sm: "max-w-screen-sm",
      md: "max-w-screen-md",
      lg: "max-w-screen-lg",
      xl: "max-w-screen-xl",
      full: "max-w-full",
    },
    centered: {
      true: "flex flex-col items-center",
      false: "",
    },
  },
  defaultVariants: {
    size: "lg",
    centered: false,
  },
});

interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ children, className, size, centered, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(containerVariants({ size, centered }), className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Container.displayName = "Container";

export { Container, containerVariants };
export type { ContainerProps };
