/*
 * Kontrola obkresleného schématu podlaží proti skenu půdorysu.
 *
 *   npm run pudorys                 (přízemí)
 *   npm run pudorys -- podkrovi
 *
 * Vykreslí polygony, dveře (modře, tečka je závěs), okna (zeleně), krb
 * a skříně (fialově), otvory v podlaze (oranžově) ze src/data/pudorys.ts
 * přes sken v podklady/pudorys/ a uloží podklady/pudorys-kontrola.png
 * (přízemí) nebo podklady/pudorys-kontrola-podkrovi.png.
 * Nic na webu nemění — je to jen oko pro toho, kdo v datech posouvá body.
 * Jede na sharpu, který si s sebou nese Astro, a na čtení TypeScriptu
 * v Node ≥ 22.18 (odstraňování typů je tam zapnuté).
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { podkrovi, prizemi } from '../src/data/pudorys.ts';

const PODLAZI = {
	prizemi: { schema: prizemi, sken: '01-pudorys-prizemi.webp', vystup: 'pudorys-kontrola.png' },
	podkrovi: { schema: podkrovi, sken: '03-pudorys-podkrovi.webp', vystup: 'pudorys-kontrola-podkrovi.png' },
};

const klic = process.argv[2] ?? 'prizemi';
const podlazi = PODLAZI[klic];
if (!podlazi) {
	console.error(`Neznámé podlaží „${klic}“, umím: ${Object.keys(PODLAZI).join(', ')}`);
	process.exit(1);
}
const { schema } = podlazi;

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKEN = resolve(KOREN, 'podklady/pudorys', podlazi.sken);
const VYSTUP = resolve(KOREN, 'podklady', podlazi.vystup);

const { width, height } = await sharp(SKEN).metadata();

const body = (b) => b.map((p) => p.join(',')).join(' ');

const plochy = [...schema.mistnosti, ...schema.terasy, ...(schema.prostory ?? [])]
	.map(
		(m, i) =>
			`<polygon points="${body(m.body)}" fill="hsl(${(i * 47) % 360} 80% 50% / 0.35)" stroke="hsl(${(i * 47) % 360} 80% 35%)" stroke-width="2"/>` +
			`<text x="${m.popisek[0]}" y="${m.popisek[1]}" font-size="22" text-anchor="middle" fill="#000">${m.cislo ?? m.nazev}</text>`,
	)
	.join('');

const otvory = (schema.otvory ?? [])
	.map((o) => `<polygon points="${body(o.body)}" fill="rgb(255 140 0 / 0.3)" stroke="#e80" stroke-width="3"/>`)
	.join('');

const dvere = schema.dvere
	.map(
		(d) =>
			`<line x1="${d.od[0]}" y1="${d.od[1]}" x2="${d.do[0]}" y2="${d.do[1]}" stroke="#00c" stroke-width="5"/>` +
			`<circle cx="${d.od[0]}" cy="${d.od[1]}" r="5" fill="#00c"/>`,
	)
	.join('');

const okna = schema.okna
	.map((o) => `<line x1="${o.od[0]}" y1="${o.od[1]}" x2="${o.do[0]}" y2="${o.do[1]}" stroke="#0a0" stroke-width="5"/>`)
	.join('');

const obdelnik = (r, barva, dash = '') =>
	`<rect x="${r.x}" y="${r.y}" width="${r.sirka}" height="${r.vyska ?? r.hloubka}" fill="none" stroke="${barva}" stroke-width="3"${dash}/>`;
const krb = schema.krb ? obdelnik(schema.krb, '#c0c') : '';
const skrine = (schema.skrine ?? []).map((k) => obdelnik(k, '#c0c')).join('');
const stresniOkna = (schema.stresniOkna ?? []).map((o) => obdelnik(o, '#0a0', ' stroke-dasharray="8 6"')).join('');

const s = schema.schodiste;
const vstup = schema.vstup ? `<circle cx="${schema.vstup.x}" cy="${schema.vstup.y}" r="8" fill="#00c"/>` : '';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
	<polygon points="${body(schema.obrys)}" fill="none" stroke="#e00" stroke-width="3"/>
	${plochy}
	${otvory}
	${dvere}
	${okna}
	${krb}
	${skrine}
	${stresniOkna}
	<rect x="${s.x}" y="${s.y}" width="${s.sirka}" height="${s.vyska}" fill="none" stroke="#00c" stroke-width="2"/>
	${vstup}
</svg>`;

await sharp(SKEN)
	.composite([{ input: Buffer.from(svg) }])
	.png()
	.toFile(VYSTUP);

console.log(`Zapsáno ${VYSTUP}`);
