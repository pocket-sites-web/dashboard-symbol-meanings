# Dashboard Symbol Meanings

Astro site: what each dashboard warning light means, per make and model, from official owner's manuals.
Cloudflare Pages: build `npm run build`, output `dist`.

- `src/lib/symbols.ts`: our own SVG symbol library (drawn from scratch, never copied from manuals), label matching, usual colours.
- `data/lights.json`: one record per make/model/year: `{make, model, year, source_name, lights: [{name, symbol, colour, meaning, action?, page?}]}`. `symbol` may be null (matched by name at build). `colour` null = shown as the usual colour, marked with *.
- Years with nearly the same light list are grouped into one generation section on the model page.
- `src/lib/site.ts`: `PREVIEW = true` keeps the site noindex until launch.
