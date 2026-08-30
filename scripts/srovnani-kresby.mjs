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
import * as kresbaLib from '../src/lib/kresba.mjs';
import { BARVA_KRESBY } from '../src/lib/kresba.mjs';
import { adresaDlazdice, dlazdiceProBbox, precistCapabilities, sadaMercator } from '../src/lib/wmts.mjs';
import { HLAVICKY, MAX_SIRKA, ROZLISENI, VYREZY, kresba, ramec } from './podklady.mjs';

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VEN = (vyrez) => resolve(KOREN, 'srovnani', vyrez);

/** Dlaždicová služba pro katastrální mapu v měřítkové řadě Google (EPSG:3857). */
export const WMTS = 'https://services.cuzk.gov.cz/wmts/local-km-wmts-google.asp';

/** Pojistka proti překlepu v úrovni: 25. úroveň by znamenala miliony dlaždic. */
const MAX_DLAZDIC = 1500;

/** Šířka, na kterou stránka rastr zmenšuje na běžném displeji (2× pro retinu). */
const SIRKA_NA_STRANCE = 1440;

/* ---------- dlaždice ---------- */

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
		const url = adresaDlazdice(WMTS, vrstva, sada, uroven, mrizka.od.radek + r, mrizka.od.sloupec + s, restem);
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

/* ---------- přebarvení a měření ---------- */

/**
 * Sharp jen dekóduje a zakóduje, samotné přebarvení i měření dělá src/lib/kresba.mjs,
 * takže stránka /srovnani-podkladu počítá v prohlížeči přesně totéž.
 */
export async function prebarvi(data, barva = BARVA_KRESBY) {
	const { data: px, info } = await sharp(data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
	const rezim = kresbaLib.prebarvi(px, barva);
	return {
		rezim,
		data: await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer(),
	};
}

const alfaZ = async (data) => {
	const { data: px, info } = await sharp(data)
		.ensureAlpha()
		.extractChannel(3)
		.raw()
		.toBuffer({ resolveWithObject: true });
	return { alfa: px, w: info.width, h: info.height };
};

const zmensiAlfu = async ({ alfa, w, h }, sirka) => {
	const { data, info } = await sharp(Buffer.from(alfa), { raw: { width: w, height: h, channels: 1 } })
		.resize(sirka, Math.max(1, Math.round((sirka * h) / w)), { kernel: 'lanczos3' })
		.raw()
		.toBuffer({ resolveWithObject: true });
	return { alfa: data, w: info.width, h: info.height };
};

export async function metriky(kresbaData, referenceHruba) {
	const plna = await alfaZ(kresbaData);
	const hruba = await zmensiAlfu(plna, Math.round(plna.w / 4));
	const naStrance = await zmensiAlfu(plna, Math.min(SIRKA_NA_STRANCE, plna.w));
	const webp = await sharp(kresbaData).webp({ lossless: true, effort: 6 }).toBuffer();
	const kryti = kresbaLib.pokryti(plna.alfa);
	return {
		px: [plna.w, plna.h],
		ostrost: kresbaLib.ostrost(plna.alfa, plna.w, plna.h),
		sirkaCary: kresbaLib.sirkaCary(plna.alfa, plna.w, plna.h),
		pokryti: kryti,
		// kvantil se bere podle pokrytí, ať vždycky padne do kresby a ne do pozadí
		zmenseno: { vrchol: kresbaLib.kvantil(naStrance.alfa, kryti / 2), pokryti: kresbaLib.pokryti(naStrance.alfa) },
		kb: Math.round(webp.length / 1024),
		shoda: referenceHruba ? kresbaLib.shoda(hruba.alfa, referenceHruba.alfa) : null,
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
	const wms = await prebarvi(await kresba(r));
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

		const obarveno = await prebarvi(slozeno);
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
