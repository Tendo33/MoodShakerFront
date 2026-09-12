import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("relative overflow-hidden rounded-none", {
  variants: {
    variant: {
      panel:
        "glass-panel border border-primary/35 shadow-[0_20px_42px_rgba(3,0,9,0.28)]",
      secondary:
        "glass-panel border border-secondary/35 shadow-[0_22px_46px_rgba(3,0,9,0.26)]",
      accent: "glass-panel border border-accent/40",
      subtle: "glass-subtle border border-white/10",
      effect: "glass-effect border border-white/10",
      popup: "glass-popup",
    },
    hover: {
      none: "",
      lift: "card-hover transition-all duration-500 hover:border-secondary hover:shadow-[0_24px_48px_rgba(3,0,9,0.28),0_0_18px_rgba(93,246,255,0.16)]",
    },
  },
  defaultVariants: {
    variant: "panel",
    hover: "none",
  },
});

function CardScanline({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-size-[100%_4px] mix-blend-overlay",
        className,
      )}
    />
  );
}

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  scanline?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className, variant, hover, scanline = false, children, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover }), className)}
      {...props}
    >
      {scanline ? <CardScanline /> : null}
      {children}
    </div>
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative z-10 flex flex-col gap-2", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-heading text-xl font-bold uppercase tracking-[0.16em] text-primary lg:text-2xl",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "font-mono text-sm leading-relaxed text-foreground/84 md:text-base",
      className,
    )}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("relative z-10", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative z-10 flex items-center", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardScanline,
  cardVariants,
};
export type { CardProps };
