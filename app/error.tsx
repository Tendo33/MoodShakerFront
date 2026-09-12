"use client";

import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error("Layout Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <Card className="max-w-md border-2 border-primary p-8 text-center">
        <CardHeader>
          <CardTitle className="mb-4 text-3xl font-black">
            {t("error.page.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-8 font-mono text-muted-foreground">
            {t("error.page.description")}
          </p>
          <Button variant="outline" onClick={() => reset()}>
            {t("error.page.action")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
