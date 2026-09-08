import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Home from "@/components/pages/Home";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/i18n/metadata";

interface HomePageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;

  return buildPageMetadata({
    locale,
    path: "/",
    titleKey: "seo.home.title",
    descriptionKey: "seo.home.description",
  });
}

/**
 * Imported directly rather than through `next/dynamic`.
 *
 * The wrapper was there to "reduce the initial bundle", but it had no `ssr: false`
 * — so Next server-rendered `Home` anyway, and the only effects were an extra
 * client chunk and a `loading` spinner that could flash over content already
 * present in the HTML. Measured in `docs/performance-baseline.md`.
 */
export default async function LangHomePage({ params }: HomePageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    redirect(`/${DEFAULT_LOCALE}`);
  }

  return <Home />;
}
