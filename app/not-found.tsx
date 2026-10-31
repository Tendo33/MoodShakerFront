import Link from "next/link";
import { headers } from "next/headers";
import { EmptyState } from "@/components/EmptyState";
import { Reveals } from "@/components/Reveals";
import { menuSuggestions } from "@/lib/summaries";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getDictionary } from "@/lib/dictionaries";
import { DEFAULT_LOCALE, isLocale, localizePath } from "@/lib/i18n";

/**
 * Rendered for any unmatched URL. It sits outside `[lang]`, so it draws its own
 * header and footer, taking the locale from the header `proxy.ts` set.
 */
export default async function NotFound() {
  const header = (await headers()).get("x-locale");
  const locale = isLocale(header) ? header : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  return (
    <>
      <SiteHeader locale={locale} dict={dict} />
      <main>
        <EmptyState
          title={dict.notFound.title}
          body={dict.notFound.body}
          suggestionsTitle={dict.drink.fromMenu}
          suggestions={await menuSuggestions(locale)}
        >
          <Link href={localizePath("/", locale)} className="btn btn-primary">
            {dict.notFound.home}
          </Link>
        </EmptyState>
      </main>
      <SiteFooter locale={locale} dict={dict} />
      <Reveals />
    </>
  );
}
