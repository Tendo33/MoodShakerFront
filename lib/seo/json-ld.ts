/**
 * Serializes structured data for an inline `<script type="application/ld+json">`.
 *
 * JSON.stringify leaves `<` intact, so a published cocktail whose text contains
 * `</script>` would close the tag and inject HTML into the page. Escaping `<`,
 * `>`, `&` and the JS line separators keeps the payload valid JSON-LD while
 * making it inert inside the script element.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
