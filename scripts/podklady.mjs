/*
 * Stahuje mapové podklady z ČÚZK a generuje z RÚIAN zákres parcel.
 *
 *   npm run podklady
 *
 * Pouští se ručně, když se má překreslit mapa — výsledek je v repozitáři, build
 * ani nasazení skript nevolá. Jede na sharpu, který si s sebou nese Astro.
 *
 * Zdrojem pravdy o parcelách zůstává src/data/parcely.ts — čísla a identifikátory
 * si skript přečte z něj, geometrii dopočítá a zapíše do src/data/zakresy.ts.
 * Rastry jdou do public/katastr/.
 *
 * Obě mapy stojí v EPSG:3857, takže sever je v nich doopravdy nahoře a šipka
 * v mapě nelže. Ortofoto se bere z keše ORTOFOTO_WM, která má jemnější úrovně
 * než S-JTSK varianta — přepočet do Web Mercatoru proto ostrost neubere
 * (naměřeno 11,20 vs 11,26 Laplaciánu). Co ostrost sráží, je požadavek
 * nezarovnaný uvnitř téže úrovně keše: tam padá na 7,39. Proto se výřez počítá
 * na nativní rozlišení dat, ne na kulaté číslo pixelů.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* ---------- co se stahuje ---------- */

/** Ortofoto ČR nemá jemnější data než 12,5 cm/px — víc pixelů už jen dopočítává. */
const ROZLISENI = 0.125;

/** 1 jednotka viewBoxu = 1 dm v terénu. Měřítková úsečka pak vychází z kulatých čísel. */
const JEDNOTEK_NA_METR = 10;

/**
 * Výřezy jsou dané středem a velikostí v metrech, ne v pixelech — z toho se
 * teprve odvodí rastr i viewBox, takže všechno drží pohromadě.
 */
const VYREZY = {
	prehled: { stred: [2030369.425, 6362050.33], sirka: 555.5, vyska: 383.0, meritko: 100 },
	detail: { stred: [2030361.43, 6362057.16], sirka: 122.0, vyska: 152.5, meritko: 25 },
};

/** Žlutá z Nahlížení do KN — odměřeno z jeho snímku (medián 245, 250, 50). */
const BARVA_KRESBY = [245, 250, 50];

const ORTOFOTO = 'https://ags.cuzk.gov.cz/arcgis1/rest/services/ORTOFOTO_WM/MapServer/export';
const KATASTR = 'https://services.cuzk.gov.cz/wms/wms.asp';
const RUIAN = 'https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/MapServer/5/query';
const PREVOD = 'https://ags.cuzk.gov.cz/arcgis/rest/services/Utilities/Geometry/GeometryServer/project';

/** ArcGIS neposkytne širší snímek, přehled se proto skládá ze dvou dílů. */
const MAX_SIRKA = 4096;

/* ---------- pomůcky ---------- */

/** Bez hlavičky prohlížeče odpoví geoportál přesměrováním na prázdno. */
const HLAVICKY = { 'User-Agent': 'trojanovice495-podklady/1 (+https://trojanovice495.cz)' };

async function stahni(url, hledani) {
	const cil = new URL(url);
	for (const [k, v] of Object.entries(hledani)) cil.searchParams.set(k, String(v));
	const odpoved = await fetch(cil, { headers: HLAVICKY, redirect: 'follow' });
	if (!odpoved.ok) throw new Error(`${odpoved.status} ${odpoved.statusText} — ${cil}`);
	return odpoved;
}

const stahniBuffer = async (url, hledani) => Buffer.from(await (await stahni(url, hledani)).arrayBuffer());
const stahniJson = async (url, hledani) => (await stahni(url, hledani)).json();

/** Souřadnice se posílají POSTem — v adrese by se stovky bodů nevešly a server vrátí 400. */
async function odesliJson(url, telo) {
	const odpoved = await fetch(url, {
		method: 'POST',
		headers: { ...HLAVICKY, 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams(telo),
	});
	if (!odpoved.ok) throw new Error(`${odpoved.status} ${odpoved.statusText} — ${url}`);
	return odpoved.json();
}

/**
 * Web Mercator natahuje vzdálenosti o 1/cos(šířky). Přes 383 m se ten poměr
 * změní o 0,007 %, takže stačí jedno číslo pro celý výřez.
 */
const zkresleni = (y) => Math.cos(2 * Math.atan(Math.exp(y / 6378137)) - Math.PI / 2);

/** Ze středu a velikosti v metrech spočítá výřez v Mercatoru, rastr i viewBox. */
function ramec({ stred, sirka, vyska, meritko }) {
	const k = zkresleni(stred[1]);
	const [sirkaM, vyskaM] = [sirka / k, vyska / k];
	const bbox = [stred[0] - sirkaM / 2, stred[1] - vyskaM / 2, stred[0] + sirkaM / 2, stred[1] + vyskaM / 2];
	const px = [Math.round(sirka / ROZLISENI), Math.round(vyska / ROZLISENI)];
	const jednotek = [sirka * JEDNOTEK_NA_METR, vyska * JEDNOTEK_NA_METR];
	return {
		bbox,
		px,
		jednotek,
		meritko,
		meritkoPodil: (meritko * JEDNOTEK_NA_METR * 100) / jednotek[0],
		/** převod z Mercatoru do viewBoxu; svislá osa se obrací, SVG roste dolů */
		doViewBoxu: ([x, y]) => [
			((x - bbox[0]) / (bbox[2] - bbox[0])) * jednotek[0],
			((bbox[3] - y) / (bbox[3] - bbox[1])) * jednotek[1],
		],
		metru: (jednotekVzdalenost) => jednotekVzdalenost / JEDNOTEK_NA_METR,
	};
}

/* ---------- rastry ---------- */

/**
 * Ortofoto se stahuje bez ztrátové komprese. Server jinak přidá vlastní JPEG
 * generaci ještě před naším přepisem do AVIF/WebP a stojí to ~2 % ostrosti.
 */
async function ortofoto({ bbox, px }) {
	const [sirka, vyska] = px;
	const dilu = Math.ceil(sirka / MAX_SIRKA);
	const sirkaDilu = Math.round(sirka / dilu);
	const dily = [];

	for (let i = 0; i < dilu; i += 1) {
		const od = bbox[0] + ((bbox[2] - bbox[0]) * i) / dilu;
		const do_ = bbox[0] + ((bbox[2] - bbox[0]) * (i + 1)) / dilu;
		const sirkaTohoto = i === dilu - 1 ? sirka - sirkaDilu * (dilu - 1) : sirkaDilu;
		dily.push(
			stahniBuffer(ORTOFOTO, {
				bbox: [od, bbox[1], do_, bbox[3]].map((n) => n.toFixed(2)).join(','),
				bboxSR: 3857,
				imageSR: 3857,
				size: `${sirkaTohoto},${vyska}`,
				format: 'png24',
				f: 'image',
			}).then((data) => ({ input: data, left: sirkaDilu * i, top: 0 })),
		);
	}

	const casti = await Promise.all(dily);
	if (casti.length === 1) return casti[0].input;
	return sharp({ create: { width: sirka, height: vyska, channels: 3, background: '#000' } })
		.composite(casti)
		.png()
		.toBuffer();
}

/**
 * Katastrální kresba jde zhruba ve stejné pixelové mřížce jako ortofoto. WMS
 * kreslí čáry pevnou šířkou v pixelech, takže jemnější rastr by je jen ztenčil —
 * při zobrazení na šířku stránky by se pak ztrácely.
 *
 * Přes 4096 px WMS nejde a skládat kresbu z dílů se nevyplatí: popisky u švu se
 * ořežou. Je to samostatná vrstva, kterou CSS stejně roztáhne na stejný rám,
 * takže o osm procent hrubší čáry nikdo nepozná.
 */
async function kresba({ bbox, px }) {
	const sirka = Math.min(px[0], MAX_SIRKA);
	const vyska = Math.round((sirka * px[1]) / px[0]);
	return stahniBuffer(KATASTR, {
		service: 'WMS',
		version: '1.3.0',
		request: 'GetMap',
		layers: 'KN_I',
		styles: '',
		crs: 'EPSG:3857',
		bbox: bbox.map((n) => n.toFixed(2)).join(','),
		width: sirka,
		height: vyska,
		format: 'image/png',
		transparent: true,
	});
}

/**
 * Vrstva KN_I je bílá na průhledném pozadí, ale vyhlazení má schované v barvě,
 * ne v alfě — alfa je jen 0/255. Přebarvení proto luminanci přesouvá do alfy,
 * jinak by čáry vyšly zubaté.
 */
async function obarvi(data, barva) {
	const { data: px, info } = await sharp(data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
	for (let i = 0; i < px.length; i += 4) {
		const jas = (px[i] + px[i + 1] + px[i + 2]) / 3 / 255;
		px[i] = barva[0];
		px[i + 1] = barva[1];
		px[i + 2] = barva[2];
		px[i + 3] = Math.round(px[i + 3] * jas);
	}
	return sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

/* ---------- geometrie ---------- */

/** Z parcely.ts se berou jen čísla a identifikátory RÚIAN, zbytek dopočítáme. */
async function seznamParcel() {
	const zdroj = await readFile(resolve(KOREN, 'src/data/parcely.ts'), 'utf8');
	const parcely = [...zdroj.matchAll(/cislo:\s*['"]([^'"]+)['"][\s\S]*?kn:\s*['"][^'"]*[?&]id=(\d+)['"]/g)].map((m) => ({
		cislo: m[1],
		id: m[2],
	}));
	if (!parcely.length) throw new Error('v parcely.ts se nenašly žádné parcely');

	const hranice = zdroj.match(/hranice:\s*\[([\s\S]*?)\n\t\]/);
	if (!hranice) throw new Error('v parcely.ts se nenašla hranice pozemku u domu');
	const body = [...hranice[1].matchAll(/\[\s*(-?[\d.]+),\s*(-?[\d.]+)\s*\]/g)].map((m) => [
		Number(m[1]),
		Number(m[2]),
	]);

	return { parcely, pozemek: body };
}

/** RÚIAN vrací geometrii v S-JTSK; do Mercatoru ji převede transformační služba ČÚZK. */
async function doMercatoru(body) {
	const hotovo = [];
	for (let i = 0; i < body.length; i += 400) {
		const { geometries } = await odesliJson(PREVOD, {
			inSR: 5514,
			outSR: 3857,
			f: 'json',
			geometries: JSON.stringify({
				geometryType: 'esriGeometryPoint',
				geometries: body.slice(i, i + 400).map(([x, y]) => ({ x, y })),
			}),
		});
		hotovo.push(...geometries.map((g) => [g.x, g.y]));
	}
	return hotovo;
}

async function geometrieParcel(parcely) {
	const odpoved = await stahniJson(RUIAN, {
		where: `id IN (${parcely.map((p) => p.id).join(',')})`,
		outFields: 'id,cisloparcely,vymeraparcely,druhcislovanikod',
		returnGeometry: true,
		outSR: 5514,
		f: 'json',
	});

	const podleId = new Map(odpoved.features.map((f) => [String(Math.round(f.attributes.id)), f]));
	const chybi = parcely.filter((p) => !podleId.has(p.id));
	if (chybi.length) throw new Error(`RÚIAN nezná parcely: ${chybi.map((p) => p.cislo).join(', ')}`);

	// všechny vrcholy najednou, ať se transformační služba volá co nejméně
	const plocho = [];
	const rozvrh = parcely.map((p) => {
		const rings = podleId.get(p.id).geometry.rings;
		return {
			...p,
			vymeraKn: podleId.get(p.id).attributes.vymeraparcely,
			rings: rings.map((r) => r.map((bod) => (plocho.push(bod), plocho.length - 1))),
		};
	});
	const merc = await doMercatoru(plocho);
	return rozvrh.map((p) => ({ ...p, rings: p.rings.map((r) => r.map((i) => merc[i])) }));
}

/* ---------- popisky ---------- */

const vzdalenostKUsecce = (x, y, [ax, ay], [bx, by]) => {
	let dx = bx - ax;
	let dy = by - ay;
	if (dx || dy) {
		const t = ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy);
		if (t > 1) [ax, ay] = [bx, by];
		else if (t > 0) [ax, ay] = [ax + dx * t, ay + dy * t];
	}
	dx = x - ax;
	dy = y - ay;
	return Math.sqrt(dx * dx + dy * dy);
};

/** Kladně dovnitř, záporně ven. Díry v prstencích se řeší samy — sudá/lichá. */
function vzdalenostKObrysu(x, y, rings) {
	let uvnitr = false;
	let nej = Infinity;
	for (const r of rings) {
		for (let i = 0, j = r.length - 1; i < r.length; j = i, i += 1) {
			const a = r[i];
			const b = r[j];
			if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) uvnitr = !uvnitr;
			nej = Math.min(nej, vzdalenostKUsecce(x, y, a, b));
		}
	}
	return uvnitr ? nej : -nej;
}

/**
 * Střed největší kružnice vepsané do parcely (pole of inaccessibility). Těžiště
 * by u parcel tvaru L padlo mimo — třeba louka 2260/8 obepíná dům a garáž.
 * Vrací i poloměr, ze kterého se pak pozná, jestli se popisek dovnitř vejde.
 */
function vepsanaKruznice(rings, presnost) {
	const xs = rings.flat().map((p) => p[0]);
	const ys = rings.flat().map((p) => p[1]);
	const [minX, minY, maxX, maxY] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
	const krok = Math.min(maxX - minX, maxY - minY);

	let nej = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, r: -Infinity };
	let bunky = [];
	for (let x = minX; x < maxX; x += krok / 2) for (let y = minY; y < maxY; y += krok / 2) bunky.push([x, y, krok / 4]);

	while (bunky.length) {
		const dalsi = [];
		for (const [x, y, h] of bunky) {
			const d = vzdalenostKObrysu(x + h, y + h, rings);
			if (d > nej.r) nej = { x: x + h, y: y + h, r: d };
			// buňku má smysl dělit, jen když v ní vůbec může být něco lepšího
			if (d + h * Math.SQRT2 <= nej.r + presnost) continue;
			for (const [dx, dy] of [
				[0, 0],
				[h, 0],
				[0, h],
				[h, h],
			])
				dalsi.push([x + dx, y + dy, h / 2]);
		}
		bunky = dalsi;
	}
	return nej;
}

/* ---------- zápis ---------- */

const cesta = (rings, doViewBoxu) =>
	rings
		.map(
			(r) =>
				`M${r
					.map((bod) => doViewBoxu(bod).map((n) => n.toFixed(1)).join(','))
					.join('L')}Z`,
		)
		.join('');

const dnes = () => new Date().toISOString().slice(0, 10);

async function main() {
	const { parcely, pozemek } = await seznamParcel();
	console.log(`parcel v parcely.ts: ${parcely.length}, vrcholů zákresu pozemku: ${pozemek.length}`);

	const geometrie = await geometrieParcel(parcely);
	for (const p of geometrie) console.log(`  ${p.cislo.padEnd(10)} ${p.vymeraKn} m² podle RÚIAN`);

	const ramce = Object.fromEntries(Object.entries(VYREZY).map(([k, v]) => [k, ramec(v)]));
	const zakresy = {};

	for (const p of geometrie) {
		zakresy[p.cislo] = {};
		for (const [varianta, r] of Object.entries(ramce)) {
			const rings = p.rings.map((ring) => ring.map(r.doViewBoxu));
			const kruh = vepsanaKruznice(rings, 0.5);
			zakresy[p.cislo][varianta] = {
				d: cesta(p.rings, r.doViewBoxu),
				x: Math.round(kruh.x),
				y: Math.round(kruh.y),
				fit: Math.round(kruh.r * 2),
			};
		}
	}

	const pozemekZakres = Object.fromEntries(
		Object.entries(ramce).map(([varianta, r]) => [varianta, { d: cesta([pozemek], r.doViewBoxu) }]),
	);

	await mkdir(resolve(KOREN, 'public/katastr'), { recursive: true });
	for (const [varianta, r] of Object.entries(ramce)) {
		console.log(`\n${varianta}: ${r.px[0]}×${r.px[1]} px, viewBox ${r.jednotek[0]}×${r.jednotek[1]}`);

		const orto = await ortofoto(r);
		await sharp(orto).avif({ quality: 55, effort: 6 }).toFile(resolve(KOREN, `public/katastr/${varianta}-orto.avif`));
		await sharp(orto).webp({ quality: 74, effort: 6 }).toFile(resolve(KOREN, `public/katastr/${varianta}-orto.webp`));

		const cary = await obarvi(await kresba(r), BARVA_KRESBY);
		await sharp(cary)
			.webp({ lossless: true, effort: 6 })
			.toFile(resolve(KOREN, `public/katastr/${varianta}-kresba.webp`));
	}

	const soubor = `// GENEROVÁNO skriptem scripts/podklady.mjs — needitovat ručně.
// Podklady staženy z ČÚZK ${dnes()}, ortofoto v nativním rozlišení ${ROZLISENI} m/px.
//
// Obě mapy stojí v EPSG:3857, takže sever je v nich doopravdy nahoře. Jednotka
// viewBoxu je 1 dm v terénu — měřítková úsečka i práh pro skrývání popisků se
// pak dají číst přímo z čísel.

export interface Zakres {
	/** SVG path parcely */
	d: string;
	/** střed popisku — střed největší kružnice vepsané do parcely */
	x: number;
	y: number;
	/** průměr té kružnice; popisek se skryje, když se do ní nevejde text */
	fit: number;
}

export const VYREZY = {
${Object.entries(ramce)
	.map(
		([k, r]) =>
			`\t${k}: { sirka: ${r.jednotek[0]}, vyska: ${r.jednotek[1]}, meritko: ${r.meritko}, meritkoPodil: ${r.meritkoPodil.toFixed(2)} },`,
	)
	.join('\n')}
} as const;

export const ZAKRESY: Record<string, { prehled: Zakres; detail: Zakres }> = {
${Object.entries(zakresy)
	.map(
		([cislo, v]) =>
			`\t"${cislo}": {\n` +
			Object.entries(v)
				.map(
					([varianta, z]) =>
						`\t\t${varianta}: {\n\t\t\td: "${z.d}",\n\t\t\tx: ${z.x}, y: ${z.y}, fit: ${z.fit},\n\t\t},`,
				)
				.join('\n') +
			'\n\t},',
	)
	.join('\n')}
};

/** Zákres pozemku u domu, přepočtený ze souřadnic v parcely.ts. */
export const POZEMEK_ZAKRES = {
${Object.entries(pozemekZakres)
	.map(([varianta, z]) => `\t${varianta}: { d: "${z.d}" },`)
	.join('\n')}
} as const;
`;

	await writeFile(resolve(KOREN, 'src/data/zakresy.ts'), soubor, 'utf8');
	console.log('\nzapsáno src/data/zakresy.ts');
}

await main();
