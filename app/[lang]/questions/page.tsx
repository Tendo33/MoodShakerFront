import { redirect } from "next/navigation";
import type { Metadata } from "next";
import ErrorBoundary from "@/components/ErrorBoundary";
import Questions from "@/components/pages/Questions";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/i18n/metadata";

interface PageProps {
  params: Promise<{
    lang: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;

  return buildPageMetadata({
    locale,
    path: "/questions",
    titleKey: "seo.questions.title",
    descriptionKey: "seo.questions.description",
  });
}

/**
 * Imported directly rather than through `next/dynamic`.
 *
 * The wrapper had no `ssr: false`, so Next server-rendered `Questions` regardless;
 * it only added a client chunk and a spinner that could flash over content already
 * in the HTML. See `docs/performance-baseline.md`.
 */
export default async function QuestionsPage({ params }: PageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    redirect(`/${DEFAULT_LOCALE}/questions`);
  }

  return (
    <ErrorBoundary>
      <Questions />
    </ErrorBoundary>
  );
}
