# MoodShaker Product

MoodShaker is a bilingual AI cocktail discovery and recommendation app.

## User Flows

- Landing page introduces the product and routes users into the questionnaire.
- Questionnaire collects mood, preference, base spirit, alcohol level, skill,
  and special request inputs.
- Recommendation page displays a personalized cocktail, generated image,
  ingredients, tools, steps, and share actions.
- Gallery lets users browse public cocktails.
- Cocktail detail pages support localized revisit flows.
- Share-card UI renders downloadable recommendation visuals.

## Localization

- Supported language prefixes are `/cn` and `/en`.
- `proxy.ts` detects language from URL, cookie, and `Accept-Language`.
- `LanguageContext` and `locales/{cn,en}.ts` provide translated copy and route
  helpers.
- Default language is Chinese (`cn`) unless URL or preferences say otherwise.

## Frontend State

- `CocktailFormContext` owns questionnaire inputs.
- `CocktailResultContext` owns recommendation result state, same-browser
  recovery metadata, and image refresh state.
- `ErrorContext` owns global error display.
- Private recommendation recovery is intentionally same-browser-session access;
  missing local edit access shows an explicit unavailable state.
