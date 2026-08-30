/*
 * Ořezává naskenované stavební výkresy a generuje z nich to, co se ukazuje na webu.
 *
 *   npm run vykresy
 *
 * Pouští se ručně, když se má sada výkresů změnit — výsledek je v repozitáři,
 * build ani nasazení skript nevolá. Jede na sharpu, který si s sebou nese Astro.
 *
 * Zdrojem jsou nedotčené skeny v podklady/vykresy/. Do public/nakresy/ jde
 * ořezaná plná verze pro lupu, do public/nakresy/nahledy/ zmenšenina do mřížky.
 *
 * Ořez má dva kroky. Nejdřív VYREZY odříznou to, co na výkres nepatří —
 * u půdorysu přízemí razítkový roh a legendu místností, protože rozpis ploch
 * je na webu ve vlastní sekci. Pak se strhnou bílé okraje, kterých mají skeny
 * kolem kresby požehnaně. Samotná kresba si díky tomu na dlaždici stejné šířky
 * sedne větší, aniž by ztratila jediný pixel rozlišení.
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ZDROJ = resolve(KOREN, 'podklady/vykresy');
const PLNE = resolve(KOREN, 'public/nakresy');
const NAHLEDY = resolve(PLNE, 'nahledy');

/** Šířka zmenšeniny do mřížky. Plná verze si nechává rozlišení skenu. */
const SIRKA_NAHLEDU = 900;

/*
 * Výřez před stržením okrajů, v podílech původního listu [x0, y0, x1, y1].
 * Kdo tu není, jde rovnou na strhnutí okrajů — řezy žádný cizí obsah nemají.
 */
const VYREZY = {
	// Vpravo razítkový roh a legenda místností; obojí je jinde na webu.
	'01-pudorys-prizemi': [0, 0, 0.575, 1],
	// Vpravo a dole prázdno za kótami a popiskem listu.
	'03-pudorys-podkrovi': [0.02, 0.03, 0.88, 0.9],
	// Pod základovou čarou už je jen prázdný list.
	'09-rez-c-c': [0.02, 0.02, 1, 0.86],
	'10-rez-d-d': [0.02, 0.03, 1, 0.88],
};

/*
 * Práh pro bílou. Skeny nejsou čistě bílé a mají zrno, takže úplně nízký práh
 * by okraje nestrhl vůbec. Vyšší by ukusoval světlé čáry kresby.
 */
const PRAH_BILE = 18;

/** Kolik bílé se kolem kresby nechá, aby se nelepila na okraj dlaždice. */
const OKRAJ = 24;

async function zpracuj(soubor) {
	const jmeno = soubor.replace(/\.webp$/, '');
	const puvodni = sharp(resolve(ZDROJ, soubor));
	const { width, height } = await puvodni.metadata();

	let obraz = puvodni;
	const vyrez = VYREZY[jmeno];
	if (vyrez) {
		const [x0, y0, x1, y1] = vyrez;
		obraz = sharp(await puvodni.toBuffer()).extract({
			left: Math.round(x0 * width),
			top: Math.round(y0 * height),
			width: Math.round((x1 - x0) * width),
			height: Math.round((y1 - y0) * height),
		});
	}

	const orezano = await sharp(await obraz.toBuffer())
		.trim({ threshold: PRAH_BILE })
		.extend({ top: OKRAJ, bottom: OKRAJ, left: OKRAJ, right: OKRAJ, background: '#ffffff' })
		.toBuffer();

	const rozmer = await sharp(orezano).metadata();
	await sharp(orezano).webp({ quality: 88 }).toFile(resolve(PLNE, soubor));
	await sharp(orezano)
		.resize(SIRKA_NAHLEDU)
		.webp({ quality: 82 })
		.toFile(resolve(NAHLEDY, soubor));

	return { jmeno, z: `${width}×${height}`, na: `${rozmer.width}×${rozmer.height}`, pomer: `${rozmer.width} / ${rozmer.height}` };
}

const soubory = (await readdir(ZDROJ)).filter((s) => s.endsWith('.webp')).sort();
await mkdir(NAHLEDY, { recursive: true });

const hotovo = [];
for (const s of soubory) hotovo.push(await zpracuj(s));

for (const h of hotovo) console.log(`  ${h.jmeno.padEnd(22)} ${h.z.padStart(10)} → ${h.na.padStart(10)}`);

/*
 * Poměry stran se propíšou do nakresy.ts, aby mřížka nepodskakovala při
 * načítání. Ořez je pokaždé jiný, opisovat je ručně by se rozešlo s obrázky.
 */
const cesta = resolve(KOREN, 'src/data/nakresy.ts');
let zdroj = await readFile(cesta, 'utf8');
let zmen = 0;
for (const h of hotovo) {
	const re = new RegExp(`(soubor: '${h.jmeno}\\.webp',[\\s\\S]*?pomer: ')[^']+(')`);
	if (re.test(zdroj)) {
		zdroj = zdroj.replace(re, `$1${h.pomer}$2`);
		zmen += 1;
	} else {
		console.warn(`  ! ${h.jmeno} není v nakresy.ts, poměr se nepropsal`);
	}
}
await writeFile(cesta, zdroj);
console.log(`\npoměry stran zapsány do src/data/nakresy.ts (${zmen} z ${hotovo.length})`);
