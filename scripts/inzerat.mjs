/*
 * Podklady pro inzerát mimo web (Sreality, Bezrealitky, e-mail, tisk).
 *
 *   npm run inzerat
 *
 * Vysází z dat webu jeden soubor podklady/inzerat.md: text k vložení do
 * formuláře portálu (nadpis, popis, parametry, dispozice, lokalita, cena,
 * kontakt) a soupis souborů k nahrání — video, plány podlaží, fotky
 * v pořadí galerie i s popisky a energetický průkaz.
 *
 * Skript nic nepřepisuje ručně: čte tytéž soubory v src/data, ze kterých
 * staví web, takže se inzerát nemůže rozejít se stránkou. Kdo změní cenu
 * nebo popis místnosti, spustí `npm run inzerat` znovu a výsledek commitne.
 *
 * Video ani fotky se nekopírují — portály si je nahrají z public/, a kopie
 * padesátimegového videa v repozitáři nikomu neposlouží. Soupis proto vede
 * cesty a velikosti, ne duplikáty.
 */

import module from 'node:module';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * Data webu jsou TypeScript a importují se bez přípony, jak je v Astru
 * zvykem. Node umí typy odstranit sám (--experimental-strip-types), o
 * příponu se musí doprosit tímhle hookem.
 */
module.registerHooks({
	resolve(spec, ctx, next) {
		try {
			return next(spec, ctx);
		} catch (chyba) {
			if (chyba.code !== 'ERR_MODULE_NOT_FOUND' || spec.endsWith('.ts')) throw chyba;
			return next(`${spec}.ts`, ctx);
		}
	},
});

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VYSTUP = resolve(KOREN, 'podklady/inzerat.md');

const { energie, nemovitost } = await import(resolve(KOREN, 'src/data/nemovitost.ts'));
const { spolecne, cenaSlovy } = await import(resolve(KOREN, 'src/data/spolecne.ts'));

const { nazev, podtitul, perex, cena, cenaPoznamka, parametry, plochy, galerie } = nemovitost;
const { lokalita, kontakt, souradnice, katastr } = spolecne;

/** 7.3 → „7,30“ — stejně jako na webu */
const cislo = (n) => n.toFixed(2).replace('.', ',');
const soucet = (mistnosti) => mistnosti.reduce((s, m) => s + m.plocha, 0);

/** velikost souboru v public/ pro soupis; chybějící soubor se pozná hned tady */
function velikost(cesta) {
	try {
		const bajty = statSync(resolve(KOREN, 'public', cesta.replace(/^\//, ''))).size;
		return `${(bajty / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
	} catch {
		return 'CHYBÍ';
	}
}

const videa = readdirSync(resolve(KOREN, 'public/video'))
	.filter((f) => f.endsWith('.mp4'))
	/* hlavní verze první, lehčí mobilní za ní — v tom pořadí se nahrávají */
	.sort((a, b) => Number(a.includes('mobile')) - Number(b.includes('mobile')) || a.localeCompare(b));

const radky = [];
const pis = (...text) => radky.push(...text);

pis(
	'<!-- Generovaný soubor — needitovat ručně, mění se přes `npm run inzerat`. -->',
	'',
	`# Podklady pro inzerát — ${nazev}`,
	'',
	'Text k vložení do formuláře portálu a soupis souborů k nahrání. Vše je vysázené',
	'z dat webu (`src/data/`), takže inzerát říká totéž co stránka.',
	'',
	'## Nadpis',
	'',
	`${nazev} — ${podtitul}`,
	'',
	'## Popis',
	'',
	perex,
	'',
	'## Cena',
	'',
	`${cenaSlovy(cena)} — ${cenaPoznamka}`,
	'',
	'## Parametry',
	'',
);

for (const p of parametry) pis(`- **${p.nazev}:** ${p.hodnota}`);

pis(
	'',
	'## Dispozice po místnostech',
	'',
	'Plochy podle legendy stavebních výkresů (projekt 2004), bez teras.',
	'',
);

let celkem = 0;
for (const p of plochy) {
	celkem += soucet(p.mistnosti);
	pis(`### ${p.podlazi} — ${cislo(soucet(p.mistnosti))} m²`, '');
	for (const m of p.mistnosti) pis(`- ${m.cislo} ${m.nazev} — ${cislo(m.plocha)} m²`);
	pis('');
}
pis(`**Užitná plocha celkem: ${cislo(celkem)} m²**`, '');

pis(
	'## Energetická náročnost',
	'',
	`- **Třída:** ${energie.trida} — ${energie.tridaSlovy}`,
	`- **Neobnovitelná primární energie:** ${energie.primarni} kWh/m² za rok`,
	`- **Celková dodaná energie:** ${energie.dodana} kWh/m² za rok`,
	`- **Průkaz:** ev. č. ${energie.prukaz.evidencni}, ${energie.prukaz.specialista},`,
	`  vyhotoven ${energie.prukaz.vyhotoven}, platný do ${energie.prukaz.platnyDo}`,
	'',
	'## Lokalita',
	'',
	lokalita.popis,
	'',
);
for (const v of lokalita.vzdalenosti) pis(`- ${v.misto} — ${v.hodnota}`);
pis(
	'',
	`Katastrální území ${katastr.uzemi} (${katastr.kod}).`,
	`Souřadnice adresního bodu: ${souradnice.sirka}, ${souradnice.delka}.`,
	'',
	'## Kontakt',
	'',
	`${kontakt.jmeno}, ${kontakt.telefon}, ${kontakt.email}`,
	'Prodej přímo majitelem, bez realitní kanceláře.',
	'',
	'## Soubory k nahrání',
	'',
	'### Video prohlídka',
	'',
);
for (const v of videa) {
	const mobil = v.includes('mobile');
	pis(`- \`public/video/${v}\` (${velikost(`/video/${v}`)})${mobil ? ' — lehčí verze pro mobil' : ' — hlavní verze'}`);
}
pis(
	`- Náhledový obrázek videa: \`public/video/poster.jpg\` (${velikost('/video/poster.jpg')})`,
	'',
	'Portály, které video nepřijmou jako soubor, chtějí odkaz — pak nahrát',
	'hlavní verzi na YouTube nebo Vimeo a do inzerátu vložit odkaz.',
	'',
	'### Plány podlaží',
	'',
	`- \`public/schemata/prizemi.png\` (${velikost('/schemata/prizemi.png')}) — schéma přízemí, 2000 px na šířku`,
	`- \`public/schemata/podkrovi.png\` (${velikost('/schemata/podkrovi.png')}) — schéma podkroví, 2000 px na šířku`,
	'',
	'Schémata kreslí skutečný stav a mají čísla místností shodná s rozpisem výše.',
	'Překreslují se přes `npm run schemata`. Skeny původních výkresů z projektu',
	'(půdorysy a řezy) leží v `podklady/pudorys/` a `podklady/vykresy/` — ty jsou',
	'na vyžádání, do inzerátu nepatří.',
	'',
	'### Energetický průkaz',
	'',
	`- \`public${energie.prukaz.soubor}\` (${velikost(energie.prukaz.soubor)})`,
	'',
	'### Fotografie',
	'',
	'V pořadí galerie na webu; popisek slouží i jako alternativní text.',
	'',
);
for (const [i, f] of galerie.entries()) {
	pis(`${String(i + 1).padStart(2, '0')}. \`public/fotky/${f.soubor}\` — ${f.popis}`);
}
pis('');

writeFileSync(VYSTUP, radky.join('\n'), 'utf8');
console.log(`Hotovo: ${VYSTUP}`);
