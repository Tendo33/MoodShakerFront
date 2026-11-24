import * as motion from "motion/react-client";
import { enter, reveal } from "@/lib/motion";
import type { Dictionary } from "@/lib/dictionaries";
import type { RecipeView } from "@/lib/domain/recipe";
import type { Mood } from "@/lib/domain/vocabulary";
import { moodColor } from "@/lib/moods";
import { Badge } from "@/components/coss/badge";
import { Card, CardAction, CardFooter, CardHeader, CardPanel, CardTitle } from "@/components/coss/card";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/coss/table";
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
  stamp,
  moodLabel,
  ticketKey,
}: {
  recipe: RecipeView;
  mood: Mood | null;
  imageUrl: string | null;
  dict: Labels;
  /** Under the facts in the hero: publish, share, or a call to shake one. */
  actions?: React.ReactNode;
  /** The stamp, printed once because this order became a drink. */
  stamp?: string;
  /** The mood in the page's language, when the order named one. */
  moodLabel?: string | null;
  /** Slug or id. Printed as the slip number on the ticket header. */
  ticketKey: string;
  /** Shown in the picture's place while there is no photograph. */
  photoFallback?: React.ReactNode;
  /** The photograph arrives after the page (a private drink): fade it in when it loads. */
  develop?: boolean;
  /** Closes the page, e.g. other drinks poured for the same mood. */
  more?: React.ReactNode;
}) {
  const { recipe: t, vocab } = dict;
  const facts = [
    { term: t.spirit, value: vocab.spirits[recipe.baseSpirit] },
    { term: t.strength, value: vocab.alcohol[recipe.alcoholLevel] },
    { term: t.glass, value: recipe.servingGlass },
    { term: t.time, value: recipe.timeRequired },
    {
      term: t.flavor,
      value: recipe.flavorProfiles.map((flavor) => vocab.flavors[flavor]).join(" · "),
    },
  ].filter((row): row is { term: string; value: string } => Boolean(row?.value));

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
            entrance={enter(0)}
            className="order-2 aspect-square md:max-lg:aspect-[16/10] lg:order-none lg:col-span-6 lg:row-span-2 lg:aspect-[4/5]"
            inset="0%"
          >
            {photoFallback}
          </Specimen>
          <div className="order-1 lg:order-none lg:col-span-6 lg:col-start-7 lg:self-end lg:pl-6">
            <motion.h1 {...enter(1)} className="text-[clamp(2.5rem,1.2rem+3.6vw,4.75rem)]">{recipe.name}</motion.h1>
            <motion.p {...enter(2)} className="mt-3 text-lead text-ink/70">{recipe.altName}</motion.p>
          </div>
          <div className="order-3 lg:order-none lg:col-span-6 lg:col-start-7 lg:pl-6">
            <motion.p {...enter(3)} className="max-w-[44ch] text-pretty text-lead">{recipe.description}</motion.p>
            <motion.div {...enter(4)} className="mt-10">
              <Card className="shadow-none before:shadow-none">
                <CardHeader className="border-b">
                  {moodLabel ? (
                    <CardTitle className="font-display text-lead leading-snug">{moodLabel}</CardTitle>
                  ) : null}
                  <CardAction className="self-center">
                    <span className="edge">{ticketNumber(ticketKey)}</span>
                  </CardAction>
                </CardHeader>
                <CardPanel className="px-3 py-1">
                  <Table>
                    <TableBody>
                      {facts.map((row) => (
                        <TableRow key={row.term}>
                          <TableHead scope="row" className="edge h-auto w-2/5 py-3 whitespace-normal text-note">
                            {row.term}
                          </TableHead>
                          <TableCell className="py-3 text-end font-medium leading-snug whitespace-normal">{row.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardPanel>
                {stamp ? (
                  <CardFooter className="justify-end border-t">
                    <Badge
                      variant="outline"
                      size="lg"
                      className="h-auto border-brand px-2.5 py-1 font-mono tracking-widest text-brand uppercase"
                    >
                      {stamp}
                    </Badge>
                  </CardFooter>
                ) : null}
              </Card>
            </motion.div>
            {actions && <motion.div {...enter(5)} className="mt-10">{actions}</motion.div>}
          </div>
        </div>
      </section>

      {/* Why this drink, said once and large: it is what makes the page this guest's and not a recipe card. */}
      <section className="frame mt-[clamp(72px,11vh,140px)] grid gap-x-8 lg:grid-cols-12" aria-labelledby="why-heading">
        <motion.h2 {...reveal(0)} id="why-heading" className="label text-note lg:col-span-3 lg:pt-3">
          {t.why}
        </motion.h2>
        <motion.blockquote {...reveal(1)} className="mt-4 max-w-[26em] text-pretty font-display text-[clamp(1.625rem,1rem+2.2vw,3rem)] leading-[1.25] tracking-[-0.01em] lg:col-span-9 lg:mt-0">
          {recipe.matchReason}
        </motion.blockquote>
      </section>

      <div className="frame mt-[clamp(72px,11vh,140px)] grid gap-x-8 gap-y-20 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <section aria-labelledby="ingredients-heading">
            <motion.h2 {...reveal(0)} id="ingredients-heading" className="text-head">
              {t.ingredients}
            </motion.h2>
            <Table className="mt-8 text-base">
              <TableBody>
                {recipe.ingredients.map((item, index) => (
                  <TableRow key={`${item.name}-${index}`}>
                    <TableCell className="py-3.5 ps-0 leading-snug whitespace-normal">
                      {item.name}
                      {item.substitute ? (
                        <span className="mt-1 block text-small text-note">
                          {t.substitute} {item.substitute}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-3.5 text-end font-medium leading-snug whitespace-normal">
                      {item.amount}
                      {item.unit ? ` ${item.unit}` : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {recipe.tools.length > 0 && (
            <section className="mt-16" aria-labelledby="tools-heading">
              <motion.h2 {...reveal(0)} id="tools-heading" className="label text-lead">
                {t.tools}
              </motion.h2>
              <ul className="mt-4 space-y-3 text-pretty">
                {recipe.tools.map((tool, index) => (
                  <motion.li {...reveal(index)} key={index}>
                    <p>
                      {tool.name}
                      {tool.alternative ? (
                        <span className="text-note">
                          {" "}
                          · {t.alternative} {tool.alternative}
                        </span>
                      ) : null}
                    </p>
                  </motion.li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <section className="lg:col-span-6 lg:col-start-7" aria-labelledby="method-heading">
          <motion.h2 {...reveal(0)} id="method-heading" className="text-head">
            {t.method}
          </motion.h2>
          <ol className="mt-8 space-y-9">
            {recipe.steps.map((step) => (
              <motion.li {...reveal(step.stepNumber - 1)} key={step.stepNumber}>
                <div className="grid grid-cols-[3rem_1fr] gap-x-4 sm:grid-cols-[4.5rem_1fr]">
                  <span aria-hidden className="num font-display text-[clamp(2.25rem,1.6rem+1.6vw,3.25rem)] leading-[0.9] text-ink/35">
                    {step.stepNumber}
                  </span>
                  <div>
                    <p className="text-pretty text-lead">{step.description}</p>
                    {step.tips ? <p className="mt-2 text-pretty text-note">{step.tips}</p> : null}
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
        </section>
      </div>
      {more}
    </article>
  );
}

/** Stable slip number. The same key always prints the same four digits. */
function ticketNumber(key: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const n = (hash >>> 0) % 10000 || 1;
  return `No. ${String(n).padStart(4, "0")}`;
}
