/**
 * Draws public/og.png, the card shown when a page without its own picture is
 * shared: the name and the promise on bone, one seed drink on its mood's field.
 * Run with `node scripts/build-og.mjs` after changing the wordmark or the seeds.
 */
import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;
const MARGIN = 72;
const FIELD = 486;
const BONE = "#e6e0d2";
const INK = "#1a1a1a";
const MOODS = ["#a9d3b5", "#f2c94c", "#aebfd6", "#f2aca4", "#d4e157", "#cbbfa8"];
const DRINK = { file: "public/drinks/rose-aperol.webp", field: "#f2aca4" };

const font = "font-family=\"Hanken Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif\"";
const swatches = MOODS.map(
  (colour, index) => `<rect x="${MARGIN + index * 64}" y="${HEIGHT - MARGIN - 56}" width="56" height="56" fill="${colour}"/>`,
).join("");

const card = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BONE}"/>
  <rect x="${WIDTH - MARGIN - FIELD}" y="${MARGIN}" width="${FIELD}" height="${FIELD}" fill="${DRINK.field}"/>
  <text x="${MARGIN}" y="${MARGIN + 74}" ${font} font-size="88" font-weight="500" letter-spacing="-3" fill="${INK}">MoodShaker</text>
  <text x="${MARGIN}" y="${MARGIN + 160}" ${font} font-size="38" fill="${INK}">Tell us the mood,</text>
  <text x="${MARGIN}" y="${MARGIN + 208}" ${font} font-size="38" fill="${INK}">we&#8217;ll pour the drink.</text>
  ${swatches}
</svg>`);

const inset = Math.round(FIELD * 0.08);
const drink = await sharp(DRINK.file)
  .resize(FIELD - inset * 2, FIELD - inset * 2, { fit: "contain", background: "#ffffff" })
  .flatten({ background: "#ffffff" })
  .toBuffer();

await sharp(card)
  .composite([{ input: drink, left: WIDTH - MARGIN - FIELD + inset, top: MARGIN + inset, blend: "multiply" }])
  .png({ compressionLevel: 9, palette: false })
  .toFile("public/og.png");

console.log("Wrote public/og.png");
