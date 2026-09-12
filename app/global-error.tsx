"use client";

import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isEnglish] = useState(() => {
    if (typeof document === "undefined") {
      return true;
    }

    return document.documentElement.lang.startsWith("en");
  });

  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html lang={isEnglish ? "en" : "zh-CN"}>
      <body className="flex min-h-screen items-center justify-center bg-black font-mono text-white">
        <Card className="max-w-lg border-2 border-primary p-8 text-center">
          <CardHeader>
            <CardTitle className="mb-4 text-3xl font-black text-secondary">
              {isEnglish ? "System Failure" : "系统故障"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-muted-foreground">
              {isEnglish
                ? "A critical error occurred in the atmospheric simulation matrix."
                : "模拟矩阵发生了严重错误。"}
            </p>
            <button
              className={cn(buttonVariants({ variant: "outline" }))}
              onClick={() => reset()}
              type="button"
            >
              {isEnglish ? "Reboot System" : "重启系统"}
            </button>
          </CardContent>
        </Card>
      </body>
    </html>
  );
}
