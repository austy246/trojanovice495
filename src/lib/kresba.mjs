/*
 * Katastrální kresba: přebarvení a měření. Čistý výpočet nad RGBA polem, žádné
 * sharp ani DOM — stejný kód běží ve skriptu scripts/srovnani-kresby.mjs
 * i na stránce /srovnani-podkladu, aby čísla z obou míst šla porovnat.
 */

/** Žlutá z Nahlížení do KN — odměřeno z jeho snímku (medián 245, 250, 50). */
export const BARVA_KRESBY = [245, 250, 50];

/** Nad tímhle už běh není čára, ale výplň nebo popisek. */
const NEJDELSI_CARA = 64;

/**
 * Zdroje kreslí kresbu různě a přebarvení na tom stojí:
 *   bílá na průhledné    WMS KN_I — vyhlazení je schované v barvě, alfa jen 0/255
 *   tmavá na průhledné   keš KM — standardní kartografie, vyhlazení poctivě v alfě
 *   neprůsvitná          kresba na bílém pozadí, které musí teprve zmizet do alfy
 */
export function rezimKresby(px) {
	let pruhlednych = 0;
	let jasSoucet = 0;
	let jasPocet = 0;
	for (let i = 0; i < px.length; i += 4) {
		if (px[i + 3] < 250) pruhlednych += 1;
		if (px[i + 3] >= 128) {
			jasSoucet += (px[i] + px[i + 1] + px[i + 2]) / 3;
			jasPocet += 1;
		}
	}
	if (pruhlednych / (px.length / 4) < 0.01) return 'neprůsvitná';
	return jasPocet && jasSoucet / jasPocet / 255 < 0.5 ? 'tmavá na průhledné' : 'bílá na průhledné';
}

/** Přebarví kresbu na zadanou barvu a vyhlazení přesune do alfy. Mění pole na místě. */
export function naZlutou(px, barva = BARVA_KRESBY, rezim = rezimKresby(px)) {
	for (let i = 0; i < px.length; i += 4) {
		const jas = (px[i] + px[i + 1] + px[i + 2]) / 3 / 255;
		const alfa =
			rezim === 'neprůsvitná'
				? Math.round(255 * (1 - jas))
				: rezim === 'tmavá na průhledné'
					? px[i + 3]
					: Math.round(px[i + 3] * jas);
		px[i] = barva[0];
		px[i + 1] = barva[1];
		px[i + 2] = barva[2];
		px[i + 3] = alfa;
	}
	return rezim;
}

/** Alfa kanál zvlášť — na něm stojí všechna měření. */
export function alfaKanal(px) {
	const alfa = new Uint8Array(px.length / 4);
	for (let i = 0; i < alfa.length; i += 1) alfa[i] = px[i * 4 + 3];
	return alfa;
}

/** Rozptyl Laplaciánu alfy: ostrý přechod kresby do prázdna dá vysoké číslo. */
export function ostrost(alfa, w, h) {
	let soucet = 0;
	let kvadraty = 0;
	for (let y = 1; y < h - 1; y += 1)
		for (let x = 1; x < w - 1; x += 1) {
			const i = y * w + x;
			const l = (4 * alfa[i] - alfa[i - 1] - alfa[i + 1] - alfa[i - w] - alfa[i + w]) / 255;
			soucet += l;
			kvadraty += l * l;
		}
	const n = (w - 2) * (h - 2);
	return kvadraty / n - (soucet / n) ** 2;
}

/** Medián vodorovných běhů kresby, tedy šířka čáry v pixelech mřížky. */
export function sirkaCary(alfa, w, h) {
	const behy = [];
	for (let y = 0; y < h; y += 1) {
		let delka = 0;
		for (let x = 0; x < w; x += 1) {
			if (alfa[y * w + x] >= 128) delka += 1;
			else {
				if (delka && delka <= NEJDELSI_CARA) behy.push(delka);
				delka = 0;
			}
		}
	}
	if (!behy.length) return 0;
	behy.sort((a, b) => a - b);
	return behy[Math.floor(behy.length / 2)];
}

/** Podíl pixelů, které kresba opravdu kryje. */
export function pokryti(alfa) {
	let n = 0;
	for (const a of alfa) if (a >= 128) n += 1;
	return n / alfa.length;
}

/** Kvantil alfy odshora: jak silné zůstaly nejsilnější pixely kresby. */
export function kvantil(alfa, podil) {
	const hist = new Array(256).fill(0);
	for (const a of alfa) hist[a] += 1;
	let n = 0;
	for (let v = 255; v >= 0; v -= 1) {
		n += hist[v];
		if (n / alfa.length >= podil) return v;
	}
	return 0;
}

/** IoU dvou masek: hlídá posun a pootočení, ne kartografii. */
export function shoda(a, b) {
	let prunik = 0;
	let sjednoceni = 0;
	for (let i = 0; i < a.length; i += 1) {
		const x = a[i] >= 64;
		const y = b[i] >= 64;
		if (x && y) prunik += 1;
		if (x || y) sjednoceni += 1;
	}
	return sjednoceni ? prunik / sjednoceni : 0;
}
