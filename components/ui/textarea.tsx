import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "focus-ring flex min-h-36 w-full rounded-none border border-primary/30 bg-black/50 p-4 font-mono text-base text-foreground shadow-inner transition-all placeholder:text-muted-foreground focus:border-secondary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
