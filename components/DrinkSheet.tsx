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
  develop,
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
  /** The photograph arrives after the page (a private drink): fade it in when it loads. */
  develop?: boolean;
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
            develop={develop}
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="enter order-2 aspect-square md:max-lg:aspect-[16/10] lg:order-none lg:col-span-6 lg:row-span-2 lg:aspect-[4/5]"
            inset="0%"
          >
            {photoFallback}
          </Specimen>
          <div className="order-1 lg:order-none lg:col-span-6 lg:col-start-7 lg:self-end lg:pl-6">
            <h1 className="enter text-[clamp(2.5rem,1.2rem+3.6vw,4.75rem)] [--i:1]">{recipe.name}</h1>
            <p className="enter mt-3 text-lead text-ink/70 [--i:2]">{recipe.altName}</p>
          </div>
          <div className="order-3 lg:order-none lg:col-span-6 lg:col-start-7 lg:pl-6">
            <p className="enter max-w-[44ch] text-lead [--i:3]">{recipe.description}</p>
            <dl className="enter mt-10 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4 [--i:4]">
              {facts.map(([term, value]) => (
                <div key={term}>
                  <dt className="edge text-ink/60">{term}</dt>
                  <dd className="mt-1.5 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="enter mt-6 text-ink/70 [--i:4]">
              {recipe.flavorProfiles.map((flavor) => vocab.flavors[flavor]).join(" · ")}
            </p>
            {actions && <div className="enter mt-10 [--i:5]">{actions}</div>}
          </div>
        </div>
      </section>

      {/* Why this drink, said once and large: it is what makes the page this guest's and not a recipe card. */}
      <section className="frame mt-[clamp(72px,11vh,140px)] grid gap-x-8 lg:grid-cols-12" aria-labelledby="why-heading">
        <h2 id="why-heading" className="label reveal text-note lg:col-span-3 lg:pt-3">
          {t.why}
        </h2>
        <blockquote className="reveal mt-4 max-w-[26em] font-display text-[clamp(1.625rem,1rem+2.2vw,3rem)] leading-[1.25] tracking-[-0.01em] [--i:1] lg:col-span-9 lg:mt-0">
          {recipe.matchReason}
        </blockquote>
      </section>

      <div className="frame mt-[clamp(72px,11vh,140px)] grid gap-x-8 gap-y-20 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <section aria-labelledby="ingredients-heading">
            <h2 id="ingredients-heading" className="reveal text-head">
              {t.ingredients}
            </h2>
            <ul className="mt-8">
              {recipe.ingredients.map((item, index) => (
                <li
                  key={index}
                  className="reveal grid grid-cols-[6.5rem_1fr] gap-x-6 py-3.5 odd:bg-surface/60"
                  style={{ ["--i" as string]: index }}
                >
                  <span className="num pl-4 text-lead font-medium">
                    {item.amount}
                    {item.unit && <span className="text-body font-normal"> {item.unit}</span>}
                  </span>
                  <span className="self-center pr-4">
                    {item.name}
                    {item.substitute && (
                      <span className="block text-small text-note">
                        {t.substitute} {item.substitute}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {recipe.tools.length > 0 && (
            <section className="mt-16" aria-labelledby="tools-heading">
              <h2 id="tools-heading" className="label reveal text-lead">
                {t.tools}
              </h2>
              <ul className="mt-4 space-y-2">
                {recipe.tools.map((tool, index) => (
                  <li key={index} className="reveal" style={{ ["--i" as string]: index }}>
                    {tool.name}
                    {tool.alternative && (
                      <span className="text-note">
                        {" "}
                        · {t.alternative} {tool.alternative}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <section className="lg:col-span-6 lg:col-start-7" aria-labelledby="method-heading">
          <h2 id="method-heading" className="reveal text-head">
            {t.method}
          </h2>
          <ol className="mt-8 space-y-9">
            {recipe.steps.map((step) => (
              <li
                key={step.stepNumber}
                className="reveal grid grid-cols-[3rem_1fr] gap-x-4 sm:grid-cols-[4.5rem_1fr]"
                style={{ ["--i" as string]: step.stepNumber - 1 }}
              >
                <span aria-hidden className="num font-display text-[clamp(2.25rem,1.6rem+1.6vw,3.25rem)] leading-[0.9] text-ink/35">
                  {step.stepNumber}
                </span>
                <div>
                  <p className="text-lead">{step.description}</p>
                  {step.tips && <p className="mt-2 text-note">{step.tips}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
      {more}
    </article>
  );
}
