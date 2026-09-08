/*
 * Export schémat podlaží do obrázků pro sdílení mimo web.
 *
 *   npm run schemata
 *
 * Nekreslí nic vlastního: sestaví web (`astro build`), vyzobne z hotové
 * stránky obě SVG schémata i s jejich stylem a přes sharp je uloží jako
 * public/schemata/prizemi.png a public/schemata/podkrovi.png. Kdo posune
 * bod v src/data/pudorys.ts nebo změní styl v Pudorys.astro, dostane
 * obrázky beze změny skriptu.
 *
 * Stavy z myši (najetí, vybraná místnost) i drobení popisků na úzké
 * obrazovce se do obrázku nepřenášejí — obrázek je vždy „široká“ podoba
 * schématu s celými popisky.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(KOREN, 'dist');
const VYSTUP = resolve(KOREN, 'public/schemata');

/** šířka výsledného PNG v pixelech; výška dopadne podle poměru výřezu */
const SIRKA = 2000;

const PODLAZI = [
	{ nazev: 'Přízemí', soubor: 'prizemi.png' },
	{ nazev: 'Podkroví', soubor: 'podkrovi.png' },
];

/* styl schématu je scoped na Pudorys.astro; podle toho se v CSS pozná */
const CID = 'data-astro-cid-eism4k5i';

console.log('Sestavuji web…');
execFileSync(process.execPath, [resolve(KOREN, 'node_modules/astro/bin/astro.mjs'), 'build'], {
	cwd: KOREN,
	stdio: 'ignore',
});

const stranka = readFileSync(resolve(DIST, 'index.html'), 'utf8');
/* styly stránky: svazek v _astro plus to, co Astro vsadilo rovnou do hlavičky (tam je :root) */
const css = [
	...readdirSync(resolve(DIST, '_astro'))
		.filter((f) => f.endsWith('.css'))
		.map((f) => readFileSync(resolve(DIST, '_astro', f), 'utf8')),
	...[...stranka.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]),
].join('\n');

/*
 * Rozebrání minifikovaného CSS na pravidla nejvyšší úrovně. Bloky @media,
 * @container a @keyframes se přeskakují: obrázek má stálou šířku, takže
 * nepotřebuje ani přepínání popisků, ani animace karty.
 */
function pravidla(text) {
	const ven = [];
	let i = 0;
	while (i < text.length) {
		const zavorka = text.indexOf('{', i);
		if (zavorka === -1) break;
		const selektor = text.slice(i, zavorka).trim();
		let hloubka = 1;
		let j = zavorka + 1;
		while (j < text.length && hloubka > 0) {
			if (text[j] === '{') hloubka++;
			else if (text[j] === '}') hloubka--;
			j++;
		}
		if (!selektor.startsWith('@')) ven.push({ selektor, telo: text.slice(zavorka + 1, j - 1) });
		i = j;
	}
	return ven;
}

/* proměnné barev a písma z :root, ať se dají dosadit do hodnot */
const promenne = new Map();
for (const { selektor, telo } of pravidla(css)) {
	if (selektor !== ':root') continue;
	for (const [, jmeno, hodnota] of telo.matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) {
		promenne.set(jmeno, hodnota.trim());
	}
}
const dosad = (hodnota) =>
	hodnota.replace(/var\((--[\w-]+)(?:,([^)]*))?\)/g, (cela, jmeno, nahradnik) =>
		promenne.get(jmeno) ?? nahradnik?.trim() ?? cela,
	);

/*
 * color-mix rasterizér neumí, tak se míchá tady. Stačí podoba, kterou má
 * schéma — dvě barvy v srgb, druhá bez podílu; „transparent“ je průhledná
 * černá, takže z první barvy zbude jen její podíl krytí.
 */
const slozky = (barva) => {
	if (barva === 'transparent') return [0, 0, 0, 0];
	const m = barva.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
	if (!m) return null;
	const h = m[1].length === 3 ? [...m[1]].map((z) => z + z) : m[1].match(/../g);
	return [...h.map((z) => parseInt(z, 16)), 1];
};
const smichej = (hodnota) =>
	hodnota.replace(/color-mix\(\s*in srgb\s*,\s*(\S+)\s+([\d.]+)%\s*,\s*(\S+?)\s*\)/g, (cela, a, podil, b) => {
		const [x, y] = [slozky(a), slozky(b)];
		if (!x || !y) return cela;
		const p = Number(podil) / 100;
		const kryti = x[3] * p + y[3] * (1 - p);
		if (kryti === 0) return 'transparent';
		/* kanály se míchají s krytím, jinak by průhledná barva tu druhou ztmavila */
		const kanal = (i) => Math.round((x[i] * x[3] * p + y[i] * y[3] * (1 - p)) / kryti);
		return `rgb(${kanal(0)} ${kanal(1)} ${kanal(2)} / ${kryti.toFixed(3)})`;
	});

/*
 * Styl pro obrázek: jen pravidla ze schématu, bez stavů z myši a bez karty
 * nad schématem, která do obrázku nepatří.
 */
const styl = pravidla(css)
	.filter(({ selektor }) => selektor.includes(CID))
	.filter(({ selektor }) => !/:hover|:focus|\.je-|\.karta/.test(selektor))
	.map(({ selektor, telo }) => {
		const cisty = selektor
			.split(',')
			.map((s) => s.replaceAll(`[${CID}]`, '').trim())
			.filter((s) => s && !s.startsWith('.pudorys'))
			.join(',');
		const deklarace = telo
			.split(';')
			.map((d) => smichej(dosad(d)).trim())
			.filter((d) => d && !d.includes('color-mix'))
			.join(';');
		return cisty && deklarace ? `${cisty}{${deklarace}}` : '';
	})
	.filter(Boolean)
	.join('\n');

if (!styl) throw new Error(`Ve stylech není nic s ${CID} — přejmenoval se Pudorys.astro?`);

/*
 * Písmo dědí schéma na webu z obalu, který sem nejde; do obrázku se proto
 * vypisuje zvlášť. Rasterizér zná jen skutečná jména rodin, obecné system-ui
 * by mu spadlo na patkové písmo.
 */
const pismo = `svg{font-family:${dosad('var(--pismo-ui)').replace(/^system-ui,\s*-apple-system,\s*/, '')}}`;

mkdirSync(VYSTUP, { recursive: true });

for (const { nazev, soubor } of PODLAZI) {
	const znacka = `aria-label="Schéma podlaží ${nazev}"`;
	const kde = stranka.indexOf(znacka);
	if (kde === -1) throw new Error(`Schéma podlaží ${nazev} jsem ve stránce nenašel`);
	const zacatek = stranka.lastIndexOf('<svg', kde);
	const konec = stranka.indexOf('</svg>', kde) + '</svg>'.length;
	const svg = stranka
		.slice(zacatek, konec)
		/* rasterizér čte SVG jako XML: scoped atributy Astra jsou bez hodnoty a nesnese je */
		.replace(/\s*data-astro-cid-[a-z0-9]+(="[^"]*")?/g, ' ')
		.replace(/\s*(tabindex|role|aria-label|aria-hidden|data-m|data-nazev|data-plocha)="[^"]*"/g, ' ');

	const [, vx, vy, vs, vv] = svg.match(/viewBox="(-?[\d.]+) (-?[\d.]+) ([\d.]+) ([\d.]+)"/).map(Number);
	const vyska = Math.round((SIRKA * vv) / vs);
	const hlavicka =
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vs} ${vv}"` +
		` width="${SIRKA}" height="${vyska}">` +
		`<style>${pismo}
${styl}</style>` +
		`<rect x="${vx}" y="${vy}" width="${vs}" height="${vv}" fill="${promenne.get('--barva-pozadi')}"/>`;
	const celek = hlavicka + svg.replace(/^<svg[^>]*>/, '');

	const cil = resolve(VYSTUP, soubor);
	await sharp(Buffer.from(celek)).png().toFile(cil);
	console.log(`Zapsáno ${cil} (${SIRKA} × ${vyska})`);
}
