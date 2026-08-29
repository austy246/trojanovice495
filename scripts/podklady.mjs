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
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { BARVA_KRESBY, alfaKanal, naZlutou, pokryti, souladZakresu } from '../src/lib/kresba.mjs';

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* ---------- co se stahuje ---------- */

/** Ortofoto ČR nemá jemnější data než 12,5 cm/px — víc pixelů už jen dopočítává. */
export const ROZLISENI = 0.125;

/** 1 jednotka viewBoxu = 1 dm v terénu. Měřítková úsečka pak vychází z kulatých čísel. */
const JEDNOTEK_NA_METR = 10;

/**
 * Výřezy jsou dané středem a velikostí v metrech, ne v pixelech — z toho se
 * teprve odvodí rastr i viewBox, takže všechno drží pohromadě.
 */
export const VYREZY = {
	prehled: { stred: [2030369.425, 6362050.33], sirka: 555.5, vyska: 383.0, meritko: 100 },
	detail: { stred: [2030361.43, 6362057.16], sirka: 122.0, vyska: 152.5, meritko: 25 },
};

/** Barvu kresby i její přebarvení drží src/lib/kresba.mjs — počítá s ní i stránka srovnání. */
export { BARVA_KRESBY };

const ORTOFOTO = 'https://ags.cuzk.gov.cz/arcgis1/rest/services/ORTOFOTO_WM/MapServer/export';
const KATASTR = 'https://services.cuzk.gov.cz/wms/wms.asp';
const RUIAN = 'https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/MapServer/5/query';
const PREVOD = 'https://ags.cuzk.gov.cz/arcgis/rest/services/Utilities/Geometry/GeometryServer/project';

/** ArcGIS neposkytne širší snímek, přehled se proto skládá ze dvou dílů. */
export const MAX_SIRKA = 4096;

/**
 * Kresba se bere bez čísel parcel — popisky kreslí SVG, aby byly čitelné i v
 * přehledu, kde by rastrová čísla vyšla na pár pixelů. `KN_I` je skupinová
 * vrstva, která čísla nese; slouží jako záloha, kdyby samotné hranice služba
 * nenabídla. Co která vrstva umí, řekne GetCapabilities:
 * services.cuzk.gov.cz/wms/wms.asp?service=WMS&request=GetCapabilities
 */
export const VRSTVY_KRESBY = ['hranice_parcel', 'KN_I'];

/**
 * Klíč pro převod S-JTSK → Web Mercator. `null` znamená výchozí klíč služby;
 * ten ale zákres míjel katastrální mapu o 2,4 m, takže se výsledek vždycky měří
 * proti stažené kresbě a při nesouladu se zkusí i ostatní klíče, které služba
 * pro tuhle dvojici zná. Až se jeden osvědčí, dá se sem zapsat natvrdo.
 */
export const TRANSFORMACE = null;

/** Nad tuhle odchylku zákresu od kresby (v metrech) skript raději skončí. */
export const TOLERANCE = 0.3;

/* ---------- pomůcky ---------- */

/** Bez hlavičky prohlížeče odpoví geoportál přesměrováním na prázdno. */
export const HLAVICKY = { 'User-Agent': 'trojanovice495-podklady/1 (+https://trojanovice495.cz)' };

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
export function ramec({ stred, sirka, vyska, meritko }) {
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
export async function kresba({ bbox, px }, vrstvy = VRSTVY_KRESBY[0]) {
	const sirka = Math.min(px[0], MAX_SIRKA);
	const vyska = Math.round((sirka * px[1]) / px[0]);
	const odpoved = await stahni(KATASTR, {
		service: 'WMS',
		version: '1.3.0',
		request: 'GetMap',
		layers: vrstvy,
		styles: '',
		crs: 'EPSG:3857',
		bbox: bbox.map((n) => n.toFixed(2)).join(','),
		width: sirka,
		height: vyska,
		format: 'image/png',
		transparent: true,
	});

	// Neznámou vrstvu WMS neodmítne stavovým kódem, vrátí XML se ServiceException.
	const typ = odpoved.headers.get('content-type') ?? '';
	if (!typ.startsWith('image/')) throw new Error(`WMS nevrátil obrázek pro vrstvy "${vrstvy}": ${typ}`);
	return Buffer.from(await odpoved.arrayBuffer());
}

/**
 * Kresba z první vrstvy, kterou služba umí a která něco nakreslí. Prázdný rastr
 * je stejná porucha jako chybějící vrstva, jen tišší — proto se měří pokrytí.
 */
async function stahniKresbu(r) {
	for (const [i, vrstvy] of VRSTVY_KRESBY.entries()) {
		try {
			const data = await obarvi(await kresba(r, vrstvy), BARVA_KRESBY);
			const podil = pokryti(alfaKanal((await sharp(data).ensureAlpha().raw().toBuffer({ resolveWithObject: true })).data));
			if (podil < 0.001) throw new Error(`vrstvy "${vrstvy}" nic nenakreslily (pokrytí ${(podil * 100).toFixed(3)} %)`);
			if (i > 0) console.log(`  ! kresba jen jako "${vrstvy}" — nese čísla parcel, ta se pak v mapě zdvojí s popisky SVG`);
			return { data, vrstvy };
		} catch (chyba) {
			if (i === VRSTVY_KRESBY.length - 1) throw chyba;
			console.log(`  ! vrstvy "${vrstvy}" nepoužitelné (${chyba.message}), zkouším "${VRSTVY_KRESBY[i + 1]}"`);
		}
	}
}

/**
 * Přebarvení řeší src/lib/kresba.mjs, protože stejná úvaha platí i pro stránku
 * srovnání. Podstatné je, že každá vrstva nese vyhlazení jinde: KN_I je bílá na
 * průhledné a vyhlazení má v barvě (alfa jen 0/255), vrstva bez čísel kreslí
 * tmavě a vyhlazení má poctivě v alfě. Režim se pozná z dat, ne z názvu vrstvy.
 */
export async function obarvi(data, barva) {
	const { data: px, info } = await sharp(data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
	naZlutou(px, barva);
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
async function doMercatoru(body, transformace = TRANSFORMACE) {
	const hotovo = [];
	for (let i = 0; i < body.length; i += 400) {
		const { geometries } = await odesliJson(PREVOD, {
			inSR: 5514,
			outSR: 3857,
			f: 'json',
			...(transformace ? { transformation: typeof transformace === 'object' ? JSON.stringify(transformace) : transformace } : {}),
			geometries: JSON.stringify({
				geometryType: 'esriGeometryPoint',
				geometries: body.slice(i, i + 400).map(([x, y]) => ({ x, y })),
			}),
		});
		hotovo.push(...geometries.map((g) => [g.x, g.y]));
	}
	return hotovo;
}

/**
 * Klíče, které služba pro dvojici S-JTSK → Web Mercator zná, od nejvhodnějšího.
 * Výchozí (bez klíče) je tříprvkový a v Česku míjí o jednotky metrů, přesný je
 * až sedmiprvkový nebo tabulkový — který to je, rozhodne měření proti kresbě.
 */
async function klice(bbox) {
	const { transformations = [] } = await stahniJson(`${PREVOD.replace(/\/project$/, '')}/findTransformations`, {
		inSR: 5514,
		outSR: 3857,
		extentOfInterest: JSON.stringify({ xmin: bbox[0], ymin: bbox[1], xmax: bbox[2], ymax: bbox[3], spatialReference: { wkid: 3857 } }),
		numOfResults: 6,
		f: 'json',
	});
	return transformations;
}

/** Jak se klíč jmenuje v logu; složené klíče mají jméno až uvnitř. */
const jmenoKlice = (klic) =>
	klic ? (klic.name ?? klic.wkid ?? klic.geoTransforms?.map((t) => t.name ?? t.wkid).join(' + ') ?? JSON.stringify(klic)) : 'výchozí klíč služby';

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

	return parcely.map((p) => ({
		...p,
		vymeraKn: podleId.get(p.id).attributes.vymeraparcely,
		rings: podleId.get(p.id).geometry.rings,
	}));
}

/* ---------- soulad zákresu s kresbou ---------- */

/** Hrany zákresu jako body v pixelech rastru, po jednom pixelu. */
function vzorkyHran(rings, { bbox }, [w, h]) {
	const doPx = ([x, y]) => [
		((x - bbox[0]) / (bbox[2] - bbox[0])) * w,
		((bbox[3] - y) / (bbox[3] - bbox[1])) * h,
	];
	const body = [];
	for (const ring of rings) {
		for (let i = 0; i < ring.length; i += 1) {
			const [ax, ay] = doPx(ring[i]);
			const [bx, by] = doPx(ring[(i + 1) % ring.length]);
			const kroku = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));
			for (let k = 0; k <= kroku; k += 1) body.push([ax + ((bx - ax) * k) / kroku, ay + ((by - ay) * k) / kroku]);
		}
	}
	return body;
}

/**
 * Odchylka zákresu od stažené kresby, v metrech. Kresba je měřítko pravdy:
 * vzniká u ČÚZK ze stejných dat jako ortofoto a v mapě leží na něm.
 */
async function zmerSoulad(rings, r, kresbaData, hledatPosun = false) {
	const { data, info } = await sharp(kresbaData).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
	const { width: w, height: h } = info;
	// v metrech na zemi, ne v jednotkách Mercatoru — ty jsou tady nadsazené o 1/cos φ
	const mNaPx = r.jednotek[0] / JEDNOTEK_NA_METR / w;
	const dosah = hledatPosun ? Math.ceil(3 / mNaPx) : 0;
	const s = souladZakresu(alfaKanal(data), w, h, vzorkyHran(rings, r, [w, h]), dosah);
	return {
		odchylka: s.odchylka * mNaPx,
		poPosunu: s.poPosunu * mNaPx,
		posun: [s.dx * mNaPx, -s.dy * mNaPx],
	};
}

/**
 * Převede geometrii do Mercatoru klíčem, který sedne na kresbu. Výchozí klíč
 * ArcGISu odsouval celý zákres o 2,4 m k jihovýchodu — chyba se nepozná jinak
 * než měřením, protože sama o sobě vypadá jako věrohodná mapa.
 */
async function vMercatoru(geometrie, r, kresbaData) {
	const plocho = [];
	const rozvrh = geometrie.map((p) => ({ ...p, rings: p.rings.map((ring) => ring.map((bod) => (plocho.push(bod), plocho.length - 1))) }));
	const slozit = (merc) => rozvrh.map((p) => ({ ...p, rings: p.rings.map((ring) => ring.map((i) => merc[i])) }));

	const zkusit = TRANSFORMACE ? [TRANSFORMACE] : [null, ...(await klice(r.bbox))];
	let nejlepsi = null;

	for (const klic of zkusit) {
		const parcely = slozit(await doMercatoru(plocho, klic));
		const { odchylka } = await zmerSoulad(parcely.flatMap((p) => p.rings), r, kresbaData);
		console.log(`  ${jmenoKlice(klic)}: odchylka od kresby ${odchylka.toFixed(2)} m`);
		if (!nejlepsi || odchylka < nejlepsi.odchylka) nejlepsi = { klic, parcely, odchylka };
		if (odchylka <= TOLERANCE) break;
	}

	if (nejlepsi.odchylka > TOLERANCE) {
		const { poPosunu, posun } = await zmerSoulad(nejlepsi.parcely.flatMap((p) => p.rings), r, kresbaData, true);
		throw new Error(
			`zákres neleží na katastrální kresbě: nejlepší klíč (${jmenoKlice(nejlepsi.klic)}) má odchylku ` +
				`${nejlepsi.odchylka.toFixed(2)} m, tolerance je ${TOLERANCE} m.\n` +
				`Posun o ${posun[0].toFixed(2)} m na východ a ${posun[1].toFixed(2)} m na sever by ji srazil na ` +
				`${poPosunu.toFixed(2)} m — souvislý posun znamená špatný transformační klíč, ne chybu v datech.\n` +
				`Zkus jiný klíč z findTransformations a zapiš ho do TRANSFORMACE.`,
		);
	}
	if (nejlepsi.klic) console.log(`  → zapiš do TRANSFORMACE: ${JSON.stringify(nejlepsi.klic)}`);
	return nejlepsi.parcely;
}

/**
 * Obvod pozemku u domu je ruční zákres, ale deset z jedenácti vrcholů leží na
 * katastrálních bodech. Když se hne geometrie parcel, musí se hnout i on —
 * jinak by nabídka vedla hranici vedle katastrální čáry.
 */
function zkontrolujObvod(pozemek, geometrie) {
	const vrcholy = geometrie.flatMap((p) => p.rings.flat());
	// vzdálenosti v metrech na zemi; Mercator je nadsazuje o 1/cos φ, viz ramec()
	const k = zkresleni(pozemek[0][1]);
	const nejblizsi = (bod) => {
		let nej = { d: Infinity, bod: null };
		for (const v of vrcholy) {
			const d = Math.hypot(v[0] - bod[0], v[1] - bod[1]) * k;
			if (d < nej.d) nej = { d, bod: v };
		}
		return nej;
	};

	const nalezy = pozemek.map(nejblizsi);
	const daleko = nalezy.filter((n) => n.d > TOLERANCE).length;
	// jeden vrchol je volný konec nové hranice, ten oporu v katastru nemá
	if (daleko <= 1) return;

	/*
	 * Vrcholy na katastrálních bodech se přisadí na ně. Volný konec oporu nemá,
	 * ten se posune o tolik co ostatní — jinak by zůstal viset na starém místě.
	 */
	const drzene = nalezy.map((n, i) => ({ ...n, i })).filter((n) => n.d <= 3);
	if (!drzene.length)
		throw new Error(`obvod pozemku v parcely.ts neleží u žádného katastrálního bodu — zkontroluj hranice ručně.`);
	const posun = [0, 1].map((os) => drzene.reduce((s, n) => s + (n.bod[os] - pozemek[n.i][os]), 0) / drzene.length);
	const opraveny = pozemek.map((bod, i) =>
		nalezy[i].d <= 3 ? nalezy[i].bod : [bod[0] + posun[0], bod[1] + posun[1]],
	);
	const blok = opraveny.map((b) => `\t\t[${b[0].toFixed(2)}, ${b[1].toFixed(2)}],`).join('\n');
	throw new Error(
		`obvod pozemku v parcely.ts nesedí na katastrální body: ${daleko} z ${pozemek.length} vrcholů je dál ` +
			`než ${TOLERANCE} m (nejdál ${Math.max(...nalezy.map((n) => n.d)).toFixed(2)} m).\n` +
			`Přepiš hranice v src/data/parcely.ts tímhle a pusť skript znovu:\n\thranice: [\n${blok}\n\t],`,
	);
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

	const ramce = Object.fromEntries(Object.entries(VYREZY).map(([k, v]) => [k, ramec(v)]));

	/*
	 * Kresba jde první: je malá a slouží jako měřítko pravdy pro zákres. Ortofoto
	 * se stahuje až po kontrolách, ať se megabajty netahají zbytečně.
	 */
	const kresby = {};
	for (const [varianta, r] of Object.entries(ramce)) {
		kresby[varianta] = await stahniKresbu(r);
		console.log(`kresba ${varianta}: vrstvy "${kresby[varianta].vrstvy}"`);
	}

	const vJtsk = await geometrieParcel(parcely);
	for (const p of vJtsk) console.log(`  ${p.cislo.padEnd(10)} ${p.vymeraKn} m² podle RÚIAN`);

	console.log('\npřevod do Mercatoru:');
	const geometrie = await vMercatoru(vJtsk, ramce.detail, kresby.detail.data);
	for (const [varianta, r] of Object.entries(ramce)) {
		const { odchylka } = await zmerSoulad(geometrie.flatMap((p) => p.rings), r, kresby[varianta].data);
		console.log(`  soulad s kresbou (${varianta}): ${odchylka.toFixed(2)} m`);
	}
	zkontrolujObvod(pozemek, geometrie);

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

		await sharp(kresby[varianta].data)
			.webp({ lossless: true, effort: 6 })
			.toFile(resolve(KOREN, `public/katastr/${varianta}-kresba.webp`));
	}

	const soubor = `// GENEROVÁNO skriptem scripts/podklady.mjs — needitovat ručně.
// Podklady staženy z ČÚZK ${dnes()}, ortofoto v nativním rozlišení ${ROZLISENI} m/px,
// kresba z vrstev "${kresby.detail.vrstvy}", zákres ověřený proti ní na ${TOLERANCE} m.
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

/** Rozměry viewBoxu v dm, k tomu rám v EPSG:3857 a rastr, ze kterého mapa vznikla. */
export const VYREZY = {
${Object.entries(ramce)
	.map(
		([k, r]) =>
			`\t${k}: {\n\t\tsirka: ${r.jednotek[0]}, vyska: ${r.jednotek[1]}, meritko: ${r.meritko}, meritkoPodil: ${r.meritkoPodil.toFixed(2)},\n\t\tbbox: [${r.bbox.map((n) => n.toFixed(2)).join(', ')}], px: [${r.px.join(', ')}],\n\t},`,
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

/* Skript jde i importovat: srovnání kresby si z něj bere rámce, WMS i přebarvení. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
