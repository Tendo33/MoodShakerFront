"use client";

import { usePathname } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { DEFAULT_LOCALE, localeFromPathname } from "@/lib/i18n";

export default function LocaleError({ reset }: { error: Error; reset: () => void }) {
  const dict = getDictionary(localeFromPathname(usePathname()) ?? DEFAULT_LOCALE);

  return (
    <div className="frame py-32">
      <h1 className="max-w-[16ch] text-head">{dict.error.title}</h1>
      <p className="mt-6 text-lead">{dict.error.body}</p>
      <button type="button" className="btn btn-primary mt-10" onClick={reset}>
        {dict.error.retry}
      </button>
    </div>
  );
}
