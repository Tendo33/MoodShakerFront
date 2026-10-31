import { Questionnaire, type MoodImages } from "@/components/Questionnaire";
import { listPublishedDrinks } from "@/lib/db/drinks";
import { MOODS, type Mood } from "@/lib/domain/vocabulary";
import { orEmpty } from "@/lib/summaries";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/questions">) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "cn";
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: "/questions",
    title: dict.meta.questionsTitle,
    description: dict.meta.questionsDescription,
  });
}

export default async function QuestionsPage({ params, searchParams }: PageProps<"/[lang]/questions">) {
  const { lang } = await params;
  const { mood } = await searchParams;
  const locale = lang as Locale;
  const dict = getDictionary(locale);

  const drinks = await orEmpty(listPublishedDrinks({ limit: 48 }).then((page) => page.drinks), "questions");
  const moodImages: MoodImages = {};
  for (const drink of drinks) {
    const code = drink.order?.mood;
    if (code && drink.imageUrl) (moodImages[code] ??= []).push(drink.imageUrl);
  }

  return (
    <Questionnaire
      locale={locale}
      dict={{ questions: dict.questions, options: dict.options, vocab: dict.vocab }}
      moodImages={moodImages}
      initialMood={(MOODS as readonly unknown[]).includes(mood) ? (mood as Mood) : null}
    />
  );
}
