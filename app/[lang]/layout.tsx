import { notFound } from "next/navigation";
import { Reveals } from "@/components/Reveals";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <>
      <SiteHeader locale={lang} dict={dict} />
      <main>{children}</main>
      <Reveals />
      <SiteFooter locale={lang} dict={dict} />
    </>
  );
}
