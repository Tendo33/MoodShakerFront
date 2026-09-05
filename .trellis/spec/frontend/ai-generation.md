# AI Generation Pipeline

Covers cocktail recommendation generation: schema, prompts, provider access, and
output guarantees. Read before touching anything under `lib/ai/`.

## Module Layout

| Module | Responsibility | `server-only` |
| --- | --- | --- |
| `lib/domain/vocabulary.ts` | Closed vocabularies: codes plus display labels | no |
| `lib/ai/cocktail-schema.ts` | zod schema; derives type, JSON Schema, validator | no |
| `lib/ai/prompts.ts` | Prompt assembly | no |
| `lib/ai/provider.ts` | Interfaces and `ProviderError` | no |
| `lib/ai/providers/openai-compatible.ts` | Reads credentials, issues requests | **yes** |
| `lib/ai/cocktail-generation.ts` | Orchestration and the repair retry | no |
| `lib/ai/image-prompt.ts` | Image prompt derivation | **yes** |

## Rules

- One definition per concept. The cocktail shape lives in
  `generatedCocktailSchema`; the TypeScript type, the provider JSON Schema, and
  the prompt's field guide are all derived from it. Do not hand-write a second
  copy — the previous prompt schema had drifted and omitted the bilingual fields
  entirely.
- Vocabularies (`baseSpirit`, `alcoholLevel`, `flavorProfiles`, skill level) come
  from `lib/domain/vocabulary.ts`. Do not add a fourth keyword map, and do not
  match on display text at a boundary.
- Nothing is persisted or returned before it passes
  `validateGeneratedCocktail`. No field-level `||` defaults: a record named
  "Unknown Cocktail" is worse than a reported failure.
- JSON extraction accepts a bare object or a fenced block only. Do not reinstate
  a `/\{[\s\S]*\}/` sweep over the completion.
- `MAX_LLM_CALLS_PER_REQUEST` is the ceiling for one user action: one generation
  plus at most one repair. Never add a retry at another layer — three layers once
  stacked into four generations per failure.
- Retry connection failures only. A returned response, including a 5xx, means the
  budget was already spent; surface it.
- Never cache chat completions. Identical questionnaires must be able to return
  different drinks.
- Pass the provider in as a parameter. Tests drive the retry path with a stub, so
  the orchestrator must not reach for a singleton.

## `server-only` Is A Security Boundary

Apply it to modules that read credentials, or where it enforces a fix for a real
defect. Do not apply it to pure logic: it also blocks `node:test` imports, which
costs test coverage and buys nothing.

`image-prompt.ts` carries it because the browser used to build that prompt and
POST it; the marker makes a regression fail the build.

## Structured Output

`supportsJsonSchema` defaults to false, enabled with
`OPENAI_SUPPORTS_JSON_SCHEMA=true`. The `json_object` path works on every
OpenAI-compatible endpoint, and validation plus the repair retry cover what the
provider does not enforce. Enabling it against an endpoint that rejects
`json_schema` turns a working pipeline into a 400.

Probe before enabling:

```bash
curl "$OPENAI_BASE_URL/chat/completions" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"...","messages":[{"role":"user","content":"hi"}],
       "response_format":{"type":"json_schema","json_schema":{...}}}'
```

`OPENAI_BASE_URL` must be joined without a trailing slash; `${base}//chat/completions`
returns 404.

## Bilingual Output

Every text field is `{ cn, en }` and both are required, so one generation serves
`/cn` and `/en`. Do not infer one language from the other by substring — that is
what `inferEnglishBaseSpirit` did.

Enumerable fields are currently rendered to display labels before hitting the
database, because the existing columns and the display layer read them directly.
They switch to codes in the data-model work.

## Error Mapping

| Condition | Route status | `error.code` |
| --- | --- | --- |
| `ProviderError` | 502 | `LLM_PROVIDER_FAILED` |
| `CocktailValidationError` | 502 | `COCKTAIL_SCHEMA_INVALID` |
| Missing deployment dependency | 503 | `SERVICE_UNAVAILABLE` |

Upstream outages and our own validation failures are reported separately so they
are not conflated when diagnosing.
