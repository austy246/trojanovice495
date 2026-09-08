## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Mapové podklady

Rastry map i zákresy parcel jsou hotové v repozitáři. **Build je negeneruje** —
přepočítávají se ručně skriptem `npm run podklady`, a to jen když se má mapa
překreslit.

- **Obě mapy stojí v EPSG:3857**, aby v nich byl sever doopravdy nahoře. Rámy
  (střed, velikost v metrech) jsou v `VYREZY` v `scripts/podklady.mjs`.
- **Ortofoto** se bere z keše `ORTOFOTO_WM`. Strop dat Ortofota ČR je 12,5 cm/px,
  víc pixelů už jen dopočítává; výřez se proto počítá na nativní rozlišení dat,
  ne na kulaté číslo pixelů. Požadavek nezarovnaný uvnitř téže úrovně keše stojí
  ostrost.
- **Kresba** je WMS vrstva `KN_I` přebarvená na žlutou z Nahlížení — černá na
  tmavém ortofotu zaniká. WMS nejde přes 4096 px, přehled se proto ořezává
  (skládat kresbu z dílů nelze, popisky u švu se ořežou).
- **`src/data/zakresy.ts` je generovaný soubor — needitovat ručně.** Geometrie
  parcel se bere z RÚIAN, `src/data/parcely.ts` drží jen čísla, výměry a odkazy
  do KN.
- **Srovnání zdrojů kresby** (WMS proti dlaždicové WMTS): lokálně
  `npm run srovnani`, nebo stránka `/srovnani-podkladu`, která totéž počítá
  v prohlížeči nad daty staženými přímo z ČÚZK. Přebarvení a metriky jsou
  společné v `src/lib/kresba.mjs`, čtení capabilities a dlaždicová matematika
  v `src/lib/wmts.mjs`. Stránka je technická: nikam neodkazuje a nese `noindex`.

**Z Claude Code na webu se na ČÚZK nedosáhne** — síťová politika prostředí
`cuzk.gov.cz` blokuje, takže `npm run podklady` i `npm run srovnani` musí běžet
lokálně. Odsud jde ověřit jen to, co síť nepotřebuje: build, a stránky
v prohlížeči proti podvrženým odpovědím.

## Schémata podlaží jako obrázky

`npm run schemata` vyexportuje obě schémata podlaží do
`public/schemata/prizemi.png` a `public/schemata/podkrovi.png` (2000 px na
šířku) pro sdílení mimo web — do inzerátu, do e-mailu, k vytištění.

- Skript nekreslí nic vlastního: sestaví web a z hotové stránky vyzobne SVG
  schémat i pravidla jejich stylu, takže obrázky jdou samy s daty
  v `src/data/pudorys.ts` i se stylem v `Pudorys.astro`. Vazbou je scoped
  atribut `data-astro-cid-…` v `scripts/schemata.mjs`; když se přejmenuje
  komponenta, přestane se styl chytat.
- Obrázek je vždy „široká“ podoba schématu s celými popisky; stavy z myši
  a přepínání popisků na úzké obrazovce se do něj nepřenášejí. Rasterizuje
  sharp, který neumí `color-mix` ani `var()` — obojí skript dopočítá sám.
- Obrázky nevznikají v buildu; kdo posune bod ve schématu, spustí `npm run
  schemata` ručně a výsledek commitne.
