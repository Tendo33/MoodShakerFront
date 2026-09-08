/**
 * Reports how much of each page arrives as server-rendered HTML.
 *
 * Fetches routes over plain HTTP with no JavaScript execution, which is what a
 * crawler and a first paint both see. The question this answers is not "how fast
 * is it" but "is the content there at all" — a page whose text only appears after
 * hydration shows a spinner first and gives a crawler an empty shell, no matter
 * how quick the response is.
 *
 * Used to record the RSC baseline and to verify the conversion afterwards.
 *
 *   node scripts/measure-ssr.mjs                    # against localhost:3000
 *   node scripts/measure-ssr.mjs http://host:port
 */

const BASE = process.argv[2] || "http://localhost:3000";

/**
 * Routes to probe, each with a phrase that must appear in the delivered HTML.
 *
 * The phrases are taken from the localized dictionaries, so a page that renders
 * on the server contains them and a page that renders after hydration does not.
 */
const ROUTES = [
  { path: "/cn", expect: ["调酒", "MoodShaker"] },
  { path: "/en", expect: ["Cocktail", "MoodShaker"] },
  { path: "/cn/questions", expect: ["心情", "问题"] },
  { path: "/en/questions", expect: ["mood", "question"] },
  { path: "/cn/gallery", expect: ["图鉴", "鸡尾酒"] },
  { path: "/en/gallery", expect: ["Gallery", "cocktail"] },
  { path: "/cn/cocktail/mojito", expect: ["莫吉托", "薄荷"] },
  { path: "/en/cocktail/mojito", expect: ["Mojito", "mint"] },
];

/** Strips scripts so inlined RSC payload is not mistaken for rendered text. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ");
}

async function probe(route) {
  const started = Date.now();

  let response;
  try {
    response = await fetch(BASE + route.path, {
      headers: { "User-Agent": "ssr-probe" },
      redirect: "manual",
    });
  } catch (error) {
    return { ...route, error: error.message };
  }

  const ttfb = Date.now() - started;
  const html = await response.text();
  const text = visibleText(html);

  const found = route.expect.filter((phrase) =>
    text.toLowerCase().includes(phrase.toLowerCase()),
  );

  return {
    ...route,
    status: response.status,
    ttfb,
    htmlBytes: html.length,
    textBytes: text.replace(/\s+/g, " ").trim().length,
    scriptTags: (html.match(/<script\b/gi) || []).length,
    foundPhrases: found,
    // A page is server-rendered when its own words are in the HTML. Everything
    // else is a shell that needs JavaScript before it says anything.
    serverRendered: found.length > 0,
    hasSpinner: /animate-spin|LoadingSpinner/i.test(html),
    langAttr: (html.match(/<html[^>]*lang="([^"]*)"/i) || [])[1] ?? null,
    title: (html.match(/<title>([^<]*)<\/title>/i) || [])[1] ?? null,
  };
}

const results = [];
for (const route of ROUTES) {
  results.push(await probe(route));
}

console.log(`\nServer-rendered content at ${BASE}\n`);
console.log(
  "route".padEnd(24) +
    "code".padEnd(6) +
    "ttfb".padEnd(8) +
    "html".padEnd(9) +
    "text".padEnd(8) +
    "scripts".padEnd(9) +
    "lang".padEnd(6) +
    "SSR",
);
console.log("-".repeat(84));

for (const r of results) {
  if (r.error) {
    console.log(r.path.padEnd(24) + "ERROR  " + r.error);
    continue;
  }

  console.log(
    r.path.padEnd(24) +
      String(r.status).padEnd(6) +
      `${r.ttfb}ms`.padEnd(8) +
      `${(r.htmlBytes / 1024).toFixed(1)}K`.padEnd(9) +
      `${r.textBytes}`.padEnd(8) +
      String(r.scriptTags).padEnd(9) +
      String(r.langAttr ?? "-").padEnd(6) +
      (r.serverRendered ? `yes (${r.foundPhrases.join(",")})` : "NO"),
  );
}

const shells = results.filter((r) => !r.error && !r.serverRendered);
const spinners = results.filter((r) => !r.error && r.hasSpinner);

console.log("\nTitles:");
for (const r of results) {
  if (!r.error) console.log(`  ${r.path.padEnd(24)} ${r.title ?? "(none)"}`);
}

console.log(
  `\n${results.length - shells.length}/${results.length} routes deliver their own text.`,
);
if (shells.length) {
  console.log(`Client-rendered shells: ${shells.map((r) => r.path).join(", ")}`);
}
if (spinners.length) {
  console.log(`Ship a spinner: ${spinners.map((r) => r.path).join(", ")}`);
}
