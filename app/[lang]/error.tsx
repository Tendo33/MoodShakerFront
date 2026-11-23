"use client";

import { usePathname } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { getDictionary } from "@/lib/dictionaries";
import { DEFAULT_LOCALE, localeFromPathname } from "@/lib/i18n";
import { Button } from "@/components/action-button";

export default function LocaleError({ reset }: { error: Error; reset: () => void }) {
  const dict = getDictionary(localeFromPathname(usePathname()) ?? DEFAULT_LOCALE);

  return (
    <EmptyState title={dict.error.title} body={dict.error.body}>
      <Button type="button" onClick={reset}>
        {dict.error.retry}
      </Button>
    </EmptyState>
  );
}
