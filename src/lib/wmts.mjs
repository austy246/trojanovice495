/*
 * WMTS: čtení capabilities a dlaždicová matematika. Čistý výpočet bez sítě,
 * sdílený skriptem scripts/srovnani-kresby.mjs a stránkou /srovnani-podkladu.
 *
 * Čísla úrovní ani jména vrstev se neuhodnou, čtou se z capabilities. Když
 * je prohlížeč kvůli CORS nepřečte, dá se sáhnout po standardní řadě Google,
 * na které měřítková řada ČÚZK stojí.
 */

/** WMTS 1.0 počítá měřítko na pixel 0,28 mm; z toho vychází velikost pixelu v metrech. */
const OGC_PX = 0.00028;

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
export function adresaDlazdice(zaklad, vrstva, sada, uroven, radek, sloupec, restem) {
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
	return `${zaklad}?${q}`;
}

/** Standardní řada Google pro případ, že capabilities nejsou po ruce. */
export function standardniUroven(z) {
	return {
		id: String(z),
		meritko: 559082264.0287178 / 2 ** z,
		roh: [-20037508.342789244, 20037508.342789244],
		sirkaD: 256,
		vyskaD: 256,
		sloupcu: 2 ** z,
		radku: 2 ** z,
	};
}
