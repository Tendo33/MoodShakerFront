import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const terminalNoteVariants = cva(
  "border-l-2 bg-black/40 p-4 font-mono leading-relaxed text-foreground/88",
  {
    variants: {
      tone: {
        primary: "border-primary/60",
        secondary: "border-secondary/60",
        accent: "border-accent/60",
      },
    },
    defaultVariants: {
      tone: "primary",
    },
  },
);

interface TerminalNoteProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof terminalNoteVariants> {}

const TerminalNote = React.forwardRef<HTMLParagraphElement, TerminalNoteProps>(
  ({ className, tone, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(terminalNoteVariants({ tone }), className)}
      {...props}
    />
  ),
);
TerminalNote.displayName = "TerminalNote";

export { TerminalNote, terminalNoteVariants };
export type { TerminalNoteProps };
