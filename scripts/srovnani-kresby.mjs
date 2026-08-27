/*
 * Srovnává zdroje katastrální kresby: dosavadní WMS KN_I proti dlaždicové
 * službě WMTS (services.cuzk.gov.cz/wmts/local-km-wmts-google).
 *
 *   npm run srovnani                              # přehled, WMS + WMTS 19 a 20
 *   npm run srovnani -- --vyrez=detail
 *   npm run srovnani -- --urovne=19,20,21 --vrstvy=KN
 *
 * Rámce, stahování WMS i přebarvení si bere z podklady.mjs, aby se srovnávalo
 * přesně to, co web dneska používá. Výsledky jdou do srovnani/ mimo repozitář:
 * rastry kresby, náhledy složené nad stávajícím ortofotem, stoprocentní výřezy
 * a tabulka čísel, každý výřez ve své složce.
 *
 * Všechny varianty se převzorkují na společnou mřížku rámce, takže čísla jdou
 * porovnávat mezi sebou:
 *   ostrost      rozptyl Laplaciánu alfy — stejná metrika jako u ortofota
 *   šířka čáry   medián délky vodorovných běhů plné alfy, v pixelech mřížky
 *   po zmenšení  co z čar zbyde, když stránka rastr zmenší na svou šířku;
 *                tenká čára se rozmaže do šedi a p95 alfy spadne
 *   shoda        IoU masky proti WMS na čtvrtinové mřížce — hlídá, že dlaždice
 *                sedí na stejné místo, ne že vypadají stejně
 *
 * WMTS má pevný žebřík úrovní, cíl 12,5 cm/px mezi dvě z nich padne. Proto se
 * měří obě sousední: z jedné se zmenšuje (čáry tenčí), z druhé zvětšuje.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { BARVA_KRESBY, HLAVICKY, MAX_SIRKA, ROZLISENI, VYREZY, kresba, obarvi, ramec } from './podklady.mjs';

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VEN = (vyrez) => resolve(KOREN, 'srovnani', vyrez);

/** Dlaždicová služba pro katastrální mapu v měřítkové řadě Google (EPSG:3857). */
const WMTS = 'https://services.cuzk.gov.cz/wmts/local-km-wmts-google.asp';

/** WMTS 1.0 počítá měřítko na pixel 0,28 mm; z toho vychází velikost pixelu v metrech. */
const OGC_PX = 0.00028;

/** Pojistka proti překlepu v úrovni: 25. úroveň by znamenala miliony dlaždic. */
const MAX_DLAZDIC = 1500;

/** Šířka, na kterou stránka rastr zmenšuje na běžném displeji (2× pro retinu). */
const SIRKA_NA_STRANCE = 1440;

/* ---------- čtení capabilities ---------- */

const znacka = (tag) => `<(?:\\w+:)?${tag}\\b[^>]*>([\\s\\S]*?)</(?:\\w+:)?${tag}>`;
const xmlBloky = (xml, tag) => [...xml.matchAll(new RegExp(znacka(tag), 'g'))].map((m) => m[1]);
const xmlHodnota = (xml, tag) => xml.match(new RegExp(znacka(tag)))?.[1].trim() ?? null;

/**
 * Čísla úrovní ani jména vrstev se neuhodnou, čtou se z capabilities. Pro
 * EPSG:3857 patří v rohu matice na první místo X; kdyby služba vrátila pořadí
 * podle osy CRS, pozná se to podle znamének a prohodí se.
 */
export function precistCapabilities(xml) {
	const obsah = xmlHodnota(xml, 'Contents') ?? xml;

	const sady = xmlBloky(obsah, 'TileMatrixSet')
		.filter((b) => b.includes('SupportedCRS'))
		.map((b) => ({
			id: xmlHodnota(b, 'Identifier'),
			crs: xmlHodnota(b, 'SupportedCRS'),
			urovne: xmlBloky(b, 'TileMatrix').map((m) => {
				const roh = xmlHodnota(m, 'TopLeftCorner').split(/\s+/).map(Number);
				return {
					id: xmlHodnota(m, 'Identifier'),
					meritko: Number(xmlHodnota(m, 'ScaleDenominator')),
					roh: roh[0] > roh[1] ? [roh[1], roh[0]] : roh,
					sirkaD: Number(xmlHodnota(m, 'TileWidth')),
					vyskaD: Number(xmlHodnota(m, 'TileHeight')),
					sloupcu: Number(xmlHodnota(m, 'MatrixWidth')),
					radku: Number(xmlHodnota(m, 'MatrixHeight')),
				};
			}),
		}));

	const vrstvy = xmlBloky(obsah, 'Layer').map((b) => ({
		id: xmlHodnota(b, 'Identifier'),
		nazev: xmlHodnota(b, 'Title'),
		styl: xmlHodnota(xmlBloky(b, 'Style')[0] ?? '', 'Identifier') ?? 'default',
		formaty: xmlBloky(b, 'Format').map((f) => f.trim()),
		sady: xmlBloky(b, 'TileMatrixSetLink').map((l) => xmlHodnota(l, 'TileMatrixSet')),
		sablona: b.match(/<(?:\w+:)?ResourceURL[^>]*resourceType="tile"[^>]*template="([^"]+)"/)?.[1] ?? null,
	}));

	return { sady, vrstvy };
}

/** Ze sad vybere tu v Mercatoru — v JTSK variantě by mapa byla vůči ortofotu pootočená. */
export function sadaMercator(sady) {
	const sada = sady.find((s) => /3857|900913|pseudo-?mercator/i.test(s.crs ?? ''));
	if (!sada) throw new Error(`WMTS nenabízí sadu v EPSG:3857, jen: ${sady.map((s) => s.crs).join(', ')}`);
	return sada;
}

/* ---------- dlaždice ---------- */

/** Rozsah dlaždic, které rám pokrývají, a výřez rámu v jejich souřadnicích. */
export function dlazdiceProBbox(uroven, bbox) {
	const px = uroven.meritko * OGC_PX;
	const [sirkaD, vyskaD] = [px * uroven.sirkaD, px * uroven.vyskaD];
	const sloupec = (x) => Math.floor((x - uroven.roh[0]) / sirkaD);
	const radek = (y) => Math.floor((uroven.roh[1] - y) / vyskaD);
	// pravý a dolní okraj patří ještě do předchozí dlaždice, když padne přesně na šev
	const od = { sloupec: sloupec(bbox[0]), radek: radek(bbox[3]) };
	const do_ = { sloupec: sloupec(bbox[2] - px / 2), radek: radek(bbox[1] + px / 2) };

	const sloupcu = do_.sloupec - od.sloupec + 1;
	const radku = do_.radek - od.radek + 1;
	if (od.sloupec < 0 || od.radek < 0 || do_.sloupec >= uroven.sloupcu || do_.radek >= uroven.radku)
		throw new Error(`rám leží mimo matici ${uroven.id}`);

	const rohX = uroven.roh[0] + od.sloupec * sirkaD;
	const rohY = uroven.roh[1] - od.radek * vyskaD;
	return {
		px,
		od,
		sloupcu,
		radku,
		platno: [sloupcu * uroven.sirkaD, radku * uroven.vyskaD],
		vyrez: {
			left: Math.round((bbox[0] - rohX) / px),
			top: Math.round((rohY - bbox[3]) / px),
			width: Math.max(1, Math.round((bbox[2] - bbox[0]) / px)),
			height: Math.max(1, Math.round((bbox[3] - bbox[1]) / px)),
		},
	};
}

/** Adresa dlaždice: KVP je to, co ČÚZK dokumentuje, RESTová šablona je záloha. */
function adresaDlazdice(vrstva, sada, uroven, radek, sloupec, restem) {
	if (restem && vrstva.sablona)
		return vrstva.sablona
			.replace('{TileMatrixSet}', sada.id)
			.replace('{TileMatrix}', uroven.id)
			.replace('{TileRow}', String(radek))
			.replace('{TileCol}', String(sloupec))
			.replace('{Style}', vrstva.styl);
	const q = new URLSearchParams({
		service: 'WMTS',
		request: 'GetTile',
		version: '1.0.0',
		layer: vrstva.id,
		style: vrstva.styl,
		format: vrstva.formaty.find((f) => f.includes('png')) ?? 'image/png',
		tilematrixset: sada.id,
		tilematrix: uroven.id,
		tilerow: String(radek),
		tilecol: String(sloupec),
	});
	return `${WMTS}?${q}`;
}

async function davkove(polozky, najednou, prace) {
	const hotovo = [];
	for (let i = 0; i < polozky.length; i += najednou)
		hotovo.push(...(await Promise.all(polozky.slice(i, i + najednou).map(prace))));
	return hotovo;
}

/**
 * Poskládá dlaždice do jednoho rastru a ořízne na rám. Švy tady nevadí: keš je
 * vykreslená vcelku a nakrájená až potom, takže popisek přes šev přejde celý —
 * to je proti WMS ten hlavní rozdíl, kvůli kterému se přehled ořezával na 4096 px.
 */
export async function mozaika({ vrstva, sada, uroven, bbox, cil, restem = false }) {
	const mrizka = dlazdiceProBbox(uroven, bbox);
	const pocet = mrizka.sloupcu * mrizka.radku;
	if (pocet > MAX_DLAZDIC) throw new Error(`úroveň ${uroven.id} by chtěla ${pocet} dlaždic (strop ${MAX_DLAZDIC})`);

	const souradnice = [];
	for (let r = 0; r < mrizka.radku; r += 1)
		for (let s = 0; s < mrizka.sloupcu; s += 1) souradnice.push([r, s]);

	const dily = await davkove(souradnice, 6, async ([r, s]) => {
		const url = adresaDlazdice(vrstva, sada, uroven, mrizka.od.radek + r, mrizka.od.sloupec + s, restem);
		const odpoved = await fetch(url, { headers: HLAVICKY, redirect: 'follow' });
		if (!odpoved.ok) throw new Error(`${odpoved.status} ${odpoved.statusText} — ${url}`);
		return {
			input: Buffer.from(await odpoved.arrayBuffer()),
			left: s * uroven.sirkaD,
			top: r * uroven.vyskaD,
		};
	});

	const platno = await sharp({
		create: {
			width: mrizka.platno[0],
			height: mrizka.platno[1],
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	})
		.composite(dily)
		.png()
		.toBuffer();

	return {
		pocet,
		rozliseni: mrizka.px,
		data: await sharp(platno)
			.extract(mrizka.vyrez)
			.resize(cil[0], cil[1], { fit: 'fill', kernel: 'lanczos3' })
			.png()
			.toBuffer(),
	};
}

/* ---------- přebarvení ---------- */

/**
 * WMS KN_I je bílá kresba s vyhlazením schovaným v barvě (alfa jen 0/255), na to
 * je obarvi() z podklady.mjs. Dlaždice z keše ale mají standardní kartografii KM,
 * tedy tmavé čáry, a vyhlazení nejspíš poctivě v alfě. Režim se proto pozná
 * z rastru: podle toho, kolik pixelů je průhledných a jak jsou kreslené body tmavé.
 */
export async function naZlutou(data, barva = BARVA_KRESBY) {
	const { data: px, info } = await sharp(data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

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
	const podilPruhlednych = pruhlednych / (px.length / 4);
	const jas = jasPocet ? jasSoucet / jasPocet / 255 : 1;

	// neprůsvitná dlaždice: inkoust je tmavý, bílé pozadí musí zmizet do alfy
	// tmavá na průhledné: alfa už kresbu popisuje, mění se jen barva
	// bílá na průhledné: vyhlazení je v jasu, přesune se do alfy (varianta WMS)
	const rezim = podilPruhlednych < 0.01 ? 'neprůsvitná' : jas < 0.5 ? 'tmavá na průhledné' : 'bílá na průhledné';

	for (let i = 0; i < px.length; i += 4) {
		const jasPx = (px[i] + px[i + 1] + px[i + 2]) / 3 / 255;
		const alfa =
			rezim === 'neprůsvitná'
				? Math.round(255 * (1 - jasPx))
				: rezim === 'tmavá na průhledné'
					? px[i + 3]
					: Math.round(px[i + 3] * jasPx);
		px[i] = barva[0];
		px[i + 1] = barva[1];
		px[i + 2] = barva[2];
		px[i + 3] = alfa;
	}

	return {
		rezim,
		data: await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer(),
	};
}

/* ---------- měření ---------- */

const alfaZ = async (data) => {
	const { data: px, info } = await sharp(data).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
	return { alfa: px, w: info.width, h: info.height };
};

const zmensiAlfu = async ({ alfa, w, h }, sirka) => {
	const { data, info } = await sharp(Buffer.from(alfa), { raw: { width: w, height: h, channels: 1 } })
		.resize(sirka, Math.max(1, Math.round((sirka * h) / w)), { kernel: 'lanczos3' })
		.raw()
		.toBuffer({ resolveWithObject: true });
	return { alfa: data, w: info.width, h: info.height };
};

const pokryti = ({ alfa }) => alfa.reduce((n, a) => n + (a >= 128 ? 1 : 0), 0) / alfa.length;

/** Kvantil alfy odshora: podíl 0,005 říká, jak silné zůstaly nejsilnější pixely kresby. */
function kvantil({ alfa }, podil) {
	const hist = new Array(256).fill(0);
	for (const a of alfa) hist[a] += 1;
	let n = 0;
	for (let v = 255; v >= 0; v -= 1) {
		n += hist[v];
		if (n / alfa.length >= podil) return v;
	}
	return 0;
}

/** Rozptyl Laplaciánu alfy: ostrý přechod kresby do prázdna dá vysoké číslo. */
function ostrost({ alfa, w, h }) {
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

/** Medián vodorovných běhů kresby. Delší než 64 px už není čára, ale výplň nebo popisek. */
function sirkaCary({ alfa, w, h }) {
	const behy = [];
	for (let y = 0; y < h; y += 1) {
		let delka = 0;
		for (let x = 0; x < w; x += 1) {
			if (alfa[y * w + x] >= 128) delka += 1;
			else {
				if (delka && delka <= 64) behy.push(delka);
				delka = 0;
			}
		}
	}
	if (!behy.length) return 0;
	behy.sort((a, b) => a - b);
	return behy[Math.floor(behy.length / 2)];
}

/** IoU masek na čtvrtinové mřížce: hlídá posun a pootočení, ne kartografii. */
function shoda(a, b) {
	let prunik = 0;
	let sjednoceni = 0;
	for (let i = 0; i < a.alfa.length; i += 1) {
		const x = a.alfa[i] >= 64;
		const y = b.alfa[i] >= 64;
		if (x && y) prunik += 1;
		if (x || y) sjednoceni += 1;
	}
	return sjednoceni ? prunik / sjednoceni : 0;
}

export async function metriky(kresbaData, referenceHruba) {
	const plna = await alfaZ(kresbaData);
	const hruba = await zmensiAlfu(plna, Math.round(plna.w / 4));
	const naStrance = await zmensiAlfu(plna, Math.min(SIRKA_NA_STRANCE, plna.w));
	const webp = await sharp(kresbaData).webp({ lossless: true, effort: 6 }).toBuffer();
	return {
		px: [plna.w, plna.h],
		ostrost: ostrost(plna),
		sirkaCary: sirkaCary(plna),
		pokryti: pokryti(plna),
		// kvantil se bere podle pokrytí, ať vždycky padne do kresby a ne do pozadí
		zmenseno: { vrchol: kvantil(naStrance, pokryti(plna) / 2), pokryti: pokryti(naStrance) },
		kb: Math.round(webp.length / 1024),
		shoda: referenceHruba ? shoda(hruba, referenceHruba) : null,
		hruba,
	};
}

/* ---------- běh ---------- */

const prepinac = (jmeno, vychozi) =>
	process.argv.find((a) => a.startsWith(`--${jmeno}=`))?.split('=').slice(1).join('=') ?? vychozi;

async function main() {
	const jmenoVyrezu = prepinac('vyrez', 'prehled');
	if (!VYREZY[jmenoVyrezu]) throw new Error(`neznámý výřez ${jmenoVyrezu}, mám ${Object.keys(VYREZY).join(', ')}`);
	const r = ramec(VYREZY[jmenoVyrezu]);
	const zTerenu = VYREZY[jmenoVyrezu].sirka / (r.bbox[2] - r.bbox[0]); // Mercator → metry v terénu

	console.log(`výřez ${jmenoVyrezu}: ${r.px[0]}×${r.px[1]} px, cíl ${ROZLISENI} m/px v terénu`);

	const ven = VEN(jmenoVyrezu);
	await mkdir(ven, { recursive: true });
	const varianty = [];

	// WMS tak, jak ho web používá dnes — včetně stropu 4096 px u přehledu
	const wms = await naZlutou(await kresba(r));
	const wmsCil = await sharp(wms.data).resize(r.px[0], r.px[1], { fit: 'fill', kernel: 'lanczos3' }).png().toBuffer();
	const wmsMetriky = await metriky(wmsCil, null);
	varianty.push({ jmeno: 'wms', popis: `WMS KN_I, ${Math.min(r.px[0], MAX_SIRKA)} px`, rezim: wms.rezim, data: wmsCil, ...wmsMetriky });

	// WMTS: co služba nabízí, se čte z capabilities, čísla úrovní se neuhodnou
	const capabilities = await (
		await fetch(`${WMTS}?service=WMTS&request=GetCapabilities`, { headers: HLAVICKY, redirect: 'follow' })
	).text();
	const { sady, vrstvy } = precistCapabilities(capabilities);
	const sada = sadaMercator(sady);
	console.log(`\nWMTS sada ${sada.id} (${sada.crs}), vrstvy: ${vrstvy.map((v) => v.id).join(', ')}`);

	const chtene = prepinac('vrstvy', '')
		.split(',')
		.filter(Boolean);
	const vybrane = chtene.length
		? chtene.map((id) => {
				const v = vrstvy.find((x) => x.id === id);
				if (!v) throw new Error(`WMTS nezná vrstvu ${id}`);
				return v;
			})
		: [vrstvy.find((v) => /^(KN|KM)$/i.test(v.id ?? '')) ?? vrstvy.find((v) => !/přehled|prehled/i.test(v.nazev ?? '')) ?? vrstvy[0]];
	console.log(`beru vrstvy: ${vybrane.map((v) => `${v.id} (${v.nazev})`).join(', ')}`);

	let restem = process.argv.includes('--rest');
	for (const cislo of prepinac('urovne', '19,20').split(',').filter(Boolean)) {
		const uroven = sada.urovne.find((u) => u.id === cislo || u.id.endsWith(`:${cislo}`));
		if (!uroven) {
			console.log(`  úroveň ${cislo} sada ${sada.id} nemá (má ${sada.urovne.map((u) => u.id).join(', ')})`);
			continue;
		}

		const vrstvySlozene = [];
		let pocet = 0;
		let rozliseni = 0;
		for (const vrstva of vybrane) {
			const m = await mozaika({ vrstva, sada, uroven, bbox: r.bbox, cil: r.px, restem }).catch(async (chyba) => {
				// KVP je to, co ČÚZK dokumentuje; když neodpoví, zkusí se RESTová šablona
				if (restem || !vrstva.sablona) throw chyba;
				console.log(`  KVP selhalo (${chyba.message}), zkouším RESTovou šablonu`);
				restem = true;
				return mozaika({ vrstva, sada, uroven, bbox: r.bbox, cil: r.px, restem });
			});
			vrstvySlozene.push(m.data);
			pocet += m.pocet;
			rozliseni = m.rozliseni;
		}
		const slozeno =
			vrstvySlozene.length === 1
				? vrstvySlozene[0]
				: await sharp(vrstvySlozene[0])
						.composite(vrstvySlozene.slice(1).map((input) => ({ input })))
						.png()
						.toBuffer();

		const obarveno = await naZlutou(slozeno);
		const m = await metriky(obarveno.data, wmsMetriky.hruba);
		varianty.push({
			jmeno: `wmts-${cislo}`,
			popis: `WMTS úroveň ${cislo}, ${(rozliseni * zTerenu).toFixed(3)} m/px, ${pocet} dlaždic`,
			rezim: obarveno.rezim,
			data: obarveno.data,
			...m,
		});
		console.log(`  úroveň ${cislo}: ${pocet} dlaždic, ${(rozliseni * zTerenu).toFixed(3)} m/px v terénu`);
	}

	// náhledy nad stávajícím ortofotem a stoprocentní výřez u domu
	const orto = await sharp(resolve(KOREN, `public/katastr/${jmenoVyrezu}-orto.webp`))
		.resize(r.px[0], r.px[1], { fit: 'fill' })
		.toBuffer()
		.catch(() => null);
	const stred = r.doViewBoxu(VYREZY.detail.stred).map((n) => n / 10 / ROZLISENI); // dm viewBoxu → px rastru
	const vyrez = {
		left: Math.max(0, Math.min(r.px[0] - 1000, Math.round(stred[0] - 500))),
		top: Math.max(0, Math.min(r.px[1] - 700, Math.round(stred[1] - 350))),
		width: Math.min(1000, r.px[0]),
		height: Math.min(700, r.px[1]),
	};

	for (const v of varianty) {
		await sharp(v.data).webp({ lossless: true, effort: 6 }).toFile(resolve(ven, `${v.jmeno}-kresba.webp`));
		if (!orto) continue;
		const nad = await sharp(orto).composite([{ input: v.data }]).png().toBuffer();
		await sharp(nad).webp({ quality: 80, effort: 6 }).toFile(resolve(ven, `${v.jmeno}-nahled.webp`));
		await sharp(nad).extract(vyrez).png().toFile(resolve(ven, `${v.jmeno}-vyrez.png`));
	}

	const sloupce = ['varianta', 'ostrost', 'šířka čáry', 'pokrytí', 'vrchol alfy', 'pokrytí po zmenšení', 'kB', 'shoda s WMS'];
	const radky = varianty.map((v) => [
		v.jmeno,
		v.ostrost.toFixed(4),
		`${v.sirkaCary} px`,
		`${(v.pokryti * 100).toFixed(2)} %`,
		String(v.zmenseno.vrchol),
		`${(v.zmenseno.pokryti * 100).toFixed(2)} %`,
		String(v.kb),
		v.shoda === null ? '—' : `${(v.shoda * 100).toFixed(1)} %`,
	]);
	const sirky = sloupce.map((s, i) => Math.max(s.length, ...radky.map((r2) => r2[i].length)));
	const radek = (bunky) => bunky.map((b, i) => b.padEnd(sirky[i])).join('  ');

	const tabulka = [
		`výřez ${jmenoVyrezu}, mřížka ${r.px[0]}×${r.px[1]} px (${ROZLISENI} m/px)`,
		'',
		...varianty.map((v) => `${v.jmeno}: ${v.popis}, přebarveno jako ${v.rezim}`),
		'',
		radek(sloupce),
		radek(sirky.map((s) => '-'.repeat(s))),
		...radky.map(radek),
	].join('\n');

	console.log(`\n${tabulka}`);
	await writeFile(resolve(ven, 'srovnani.txt'), `${tabulka}\n`, 'utf8');
	console.log(`\nzapsáno do srovnani/${jmenoVyrezu}/`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
