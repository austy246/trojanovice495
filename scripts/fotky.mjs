/*
 * Zmenšení fotek z galerie pro web.
 *
 *   npm run fotky
 *
 * Fotky od fotografa v `public/fotky/` jsou originály přímo z foťáku/dronu
 * (řádově MB, tisíce px na šířku) — pro web jsou zbytečně velké, ať se
 * ukazují v mřížce náhledů, nebo po kliknutí přes celou obrazovku. Skript
 * k původním souborům domalí dvě menší JPEG varianty vedle nich:
 *
 *   - `-nahled.jpg` — čtverec pro mřížku (šířka NAHLED, ořez podle stejného
 *     poměru stran, jaký drží CSS `.galerie__polozka img`)
 *   - `-plna.jpg` — pro lightbox po kliknutí, jen zmenšeno na šířku PLNA,
 *     bez ořezu
 *
 * Originály zůstávají beze změny (drží je stažitelný odkaz i hero fotka).
 * Kdo přidá nebo nahradí fotku v `public/fotky/`, spustí skript ručně
 * a varianty commitne spolu s ní.
 */

import { readdirSync } from 'node:fs';
import { basename, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SLOZKA = resolve(KOREN, 'public/fotky');

/** šířka náhledu v mřížce galerie (2x kvůli retině při zobrazovací šířce ~20rem) */
const NAHLED_SIRKA = 640;
/** poměr stran náhledu — musí odpovídat `aspect-ratio: 3 / 2` v index.astro */
const NAHLED_POMER = 3 / 2;
/** šířka plné fotky v lightboxu (víc už na obrazovku nesedí) */
const PLNA_SIRKA = 1920;

const generovane = /-(nahled|plna)\.jpg$/;

const soubory = readdirSync(SLOZKA).filter(
	(soubor) => extname(soubor).toLowerCase() === '.jpg' && !generovane.test(soubor)
);

for (const soubor of soubory) {
	const cesta = resolve(SLOZKA, soubor);
	const zaklad = basename(soubor, extname(soubor));

	const nahled = resolve(SLOZKA, `${zaklad}-nahled.jpg`);
	await sharp(cesta)
		.resize(NAHLED_SIRKA, Math.round(NAHLED_SIRKA / NAHLED_POMER), { fit: 'cover' })
		.jpeg({ quality: 78, mozjpeg: true })
		.toFile(nahled);

	const plna = resolve(SLOZKA, `${zaklad}-plna.jpg`);
	await sharp(cesta)
		.resize({ width: PLNA_SIRKA, withoutEnlargement: true })
		.jpeg({ quality: 82, mozjpeg: true })
		.toFile(plna);

	console.log(`${soubor} → ${basename(nahled)}, ${basename(plna)}`);
}

console.log(`Hotovo (${soubory.length} fotek).`);
