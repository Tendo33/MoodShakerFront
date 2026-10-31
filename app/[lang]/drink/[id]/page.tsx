import { DrinkClient } from "@/components/DrinkClient";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/drink/[id]">) {
  const { lang, id } = await params;
  const locale: Locale = isLocale(lang) ? lang : "cn";
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: `/drink/${id}`,
    title: dict.meta.drinkTitle,
    description: dict.meta.homeDescription,
    noIndex: true,
  });
}

export default async function DrinkPage({ params }: PageProps<"/[lang]/drink/[id]">) {
  const { lang, id } = await params;
  const locale = lang as Locale;
  const dict = getDictionary(locale);

  return (
    <DrinkClient
      id={id}
      locale={locale}
      dict={{ drink: dict.drink, recipe: dict.recipe, vocab: dict.vocab }}
    />
  );
}
