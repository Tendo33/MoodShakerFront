import type { Dictionary } from "@/lib/dictionaries";
import type { RecipeView } from "@/lib/domain/recipe";
import type { Mood } from "@/lib/domain/vocabulary";
import { moodColor } from "@/lib/moods";
import { Specimen } from "@/components/Specimen";

type Labels = Pick<Dictionary, "recipe" | "vocab">;

/**
 * One drink: its specimen on its mood's field with the name beside it, then the
 * recipe on the ground colour. Used by both the private and the public page.
 */
export function DrinkSheet({
  recipe,
  mood,
  imageUrl,
  dict,
  actions,
  photoFallback,
  more,
}: {
  recipe: RecipeView;
  mood: Mood | null;
  imageUrl: string | null;
  dict: Labels;
  /** Under the facts in the hero: publish, share, or a call to shake one. */
  actions?: React.ReactNode;
  /** Shown in the picture's place while there is no photograph. */
  photoFallback?: React.ReactNode;
  /** Closes the page, e.g. other drinks poured for the same mood. */
  more?: React.ReactNode;
}) {
  const { recipe: t, vocab } = dict;
  const facts = [
    [t.spirit, vocab.spirits[recipe.baseSpirit]],
    [t.strength, vocab.alcohol[recipe.alcoholLevel]],
    [t.glass, recipe.servingGlass],
    [t.time, recipe.timeRequired],
  ];

  return (
    <article>
      <section style={{ backgroundColor: moodColor(mood) }}>
        <div className="frame grid gap-x-8 gap-y-6 py-8 lg:grid-cols-12 lg:grid-rows-[1fr_auto] lg:py-12">
          <Specimen
            src={imageUrl}
            alt={recipe.name}
            mood={mood}
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="enter order-2 aspect-square lg:order-none lg:col-span-6 lg:row-span-2 lg:aspect-[4/5]"
            inset="4%"
          >
            {photoFallback}
          </Specimen>
          <div className="order-1 lg:order-none lg:col-span-6 lg:col-start-7 lg:self-end lg:pl-6">
            <h1 className="enter text-head [--i:1]">{recipe.name}</h1>
            <p className="enter mt-3 text-lead text-ink/70 [--i:1]">{recipe.altName}</p>
          </div>
          <div className="order-3 lg:order-none lg:col-span-6 lg:col-start-7 lg:pl-6">
            <p className="enter max-w-[44ch] text-lead [--i:2]">{recipe.description}</p>
            <dl className="enter mt-10 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4 [--i:3]">
              {facts.map(([term, value]) => (
                <div key={term}>
                  <dt className="text-small text-ink/65">{term}</dt>
                  <dd className="mt-1 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="enter mt-6 text-ink/70 [--i:3]">
              {recipe.flavorProfiles.map((flavor) => vocab.flavors[flavor]).join(" · ")}
            </p>
            {actions && <div className="enter mt-10 [--i:4]">{actions}</div>}
          </div>
        </div>
      </section>

      <div className="frame mt-[clamp(80px,12vh,160px)] grid gap-x-8 gap-y-20 lg:grid-cols-12">
        <section className="order-2 lg:order-none lg:col-span-5" aria-labelledby="why-heading">
          <h2 id="why-heading" className="reveal text-lead text-muted">
            {t.why}
          </h2>
          <blockquote className="reveal mt-4 text-lead leading-[1.4] font-medium [--i:1]">
            {recipe.matchReason}
          </blockquote>
          {recipe.tools.length > 0 && (
            <>
              <h2 className="reveal mt-16 text-lead text-muted">{t.tools}</h2>
              <ul className="mt-4 space-y-2">
                {recipe.tools.map((tool, index) => (
                  <li key={index} className="reveal" style={{ ["--i" as string]: index }}>
                    {tool.name}
                    {tool.alternative && (
                      <span className="text-muted">
                        {" "}
                        · {t.alternative} {tool.alternative}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <div className="lg:col-span-6 lg:col-start-7">
          <section aria-labelledby="ingredients-heading">
            <h2 id="ingredients-heading" className="reveal text-head">
              {t.ingredients}
            </h2>
            <ul className="mt-8">
              {recipe.ingredients.map((item, index) => (
                <li
                  key={index}
                  className="reveal grid grid-cols-[6.5rem_1fr] gap-x-6 py-3 odd:bg-surface/60 sm:grid-cols-[8rem_1fr]"
                  style={{ ["--i" as string]: index }}
                >
                  <span className="num pl-4 text-lead font-medium">
                    {item.amount}
                    {item.unit && <span className="text-body font-normal"> {item.unit}</span>}
                  </span>
                  <span className="self-center pr-4">
                    {item.name}
                    {item.substitute && (
                      <span className="block text-small text-muted">
                        {t.substitute} {item.substitute}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-20" aria-labelledby="method-heading">
            <h2 id="method-heading" className="reveal text-head">
              {t.method}
            </h2>
            <ol className="mt-8 list-decimal space-y-6 pl-6 marker:font-medium marker:text-muted">
              {recipe.steps.map((step) => (
                <li key={step.stepNumber} className="reveal pl-3" style={{ ["--i" as string]: step.stepNumber - 1 }}>
                  <p>{step.description}</p>
                  {step.tips && <p className="mt-1 text-muted">{step.tips}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
      {more}
    </article>
  );
}
