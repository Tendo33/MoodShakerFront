import Link from "next/link";
import { headers } from "next/headers";
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
      <main className="frame py-32">
        <h1 className="max-w-[16ch] text-head">{dict.notFound.title}</h1>
        <p className="mt-6 text-lead">{dict.notFound.body}</p>
        <Link href={localizePath("/", locale)} className="btn btn-primary mt-10">
          {dict.notFound.home}
        </Link>
      </main>
      <SiteFooter locale={locale} dict={dict} />
    </>
  );
}
