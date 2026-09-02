/*
 * Kontrola obkresleného schématu přízemí proti skenu půdorysu.
 *
 *   npm run pudorys
 *
 * Vykreslí polygony, dveře (modře, tečka je závěs), okna (zeleně) a krb (fialově)
 * ze src/data/pudorys.ts přes sken
 * public/nakresy/01-pudorys-prizemi.webp a uloží podklady/pudorys-kontrola.png.
 * Nic na webu nemění — je to jen oko pro toho, kdo v datech posouvá body.
 * Jede na sharpu, který si s sebou nese Astro, a na čtení TypeScriptu
 * v Node ≥ 22.18 (odstraňování typů je tam zapnuté).
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { prizemi } from '../src/data/pudorys.ts';

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKEN = resolve(KOREN, 'public/nakresy/01-pudorys-prizemi.webp');
const VYSTUP = resolve(KOREN, 'podklady/pudorys-kontrola.png');

const { width, height } = await sharp(SKEN).metadata();

const body = (b) => b.map((p) => p.join(',')).join(' ');

const plochy = [...prizemi.mistnosti, ...prizemi.terasy]
	.map(
		(m, i) =>
			`<polygon points="${body(m.body)}" fill="hsl(${(i * 47) % 360} 80% 50% / 0.35)" stroke="hsl(${(i * 47) % 360} 80% 35%)" stroke-width="2"/>` +
			`<text x="${m.popisek[0]}" y="${m.popisek[1]}" font-size="22" text-anchor="middle" fill="#000">${m.cislo}</text>`,
	)
	.join('');

const dvere = prizemi.dvere
	.map(
		(d) =>
			`<line x1="${d.od[0]}" y1="${d.od[1]}" x2="${d.do[0]}" y2="${d.do[1]}" stroke="#00c" stroke-width="5"/>` +
			`<circle cx="${d.od[0]}" cy="${d.od[1]}" r="5" fill="#00c"/>`,
	)
	.join('');

const okna = prizemi.okna
	.map((o) => `<line x1="${o.od[0]}" y1="${o.od[1]}" x2="${o.do[0]}" y2="${o.do[1]}" stroke="#0a0" stroke-width="5"/>`)
	.join('');
const k = prizemi.krb;
const krb = k ? `<rect x="${k.x}" y="${k.y}" width="${k.sirka}" height="${k.hloubka}" fill="none" stroke="#c0c" stroke-width="3"/>` : '';

const s = prizemi.schodiste;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
	<polygon points="${body(prizemi.obrys)}" fill="none" stroke="#e00" stroke-width="3"/>
	${plochy}
	${dvere}
	${okna}
	${krb}
	<rect x="${s.x}" y="${s.y}" width="${s.sirka}" height="${s.vyska}" fill="none" stroke="#00c" stroke-width="2"/>
	<circle cx="${prizemi.vstup.x}" cy="${prizemi.vstup.y}" r="8" fill="#00c"/>
</svg>`;

await sharp(SKEN)
	.composite([{ input: Buffer.from(svg) }])
	.png()
	.toFile(VYSTUP);

console.log(`Zapsáno ${VYSTUP}`);
