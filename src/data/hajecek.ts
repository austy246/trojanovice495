// Jediné místo, kde se mění údaje o háječku. Prodává se spolu s domem v jedné
// nabídce, cenu proto nemá vlastní — je v nemovitost.ts za celek. Údaje
// společné oběma částem (kontakt, lokalita, souřadnice) jsou v spolecne.ts.
//
// Zatím neověřené a proto nezobrazované údaje — až budou známé, doplň je
// mezi parametry: inženýrské sítě, územní plán.

export const hajecek = {
	nazev: 'Háječek se stavebním pozemkem',
	podtitul: 'Druhá část nabídky, hned vedle domu',

	perex:
		'Součástí nabídky je i sousední pozemek hned vedle pozemků domu: ' +
		'stavební parcela St. 173/4, přilehlý háječek a přístupová cesta k němu. Stavba, ' +
		'kterou na parcele eviduje katastr, už fyzicky nestojí — je to tedy volné místo ' +
		'ke stavbě se vzrostlou zelení kolem a s vlastním přístupem.',

	// Výměry pocházejí z katastru — viz src/data/parcely.ts.
	parametry: [
		{ nazev: 'Celková výměra', hodnota: '2 642 m²' },
		{ nazev: 'Stavební parcela', hodnota: '180 m² (St. 173/4)' },
		{ nazev: 'Trvalý travní porost', hodnota: '2 178 m² (2290)' },
		{ nazev: 'Přístupová cesta', hodnota: '284 m² (3585/3)' },
		{ nazev: 'Stavba na pozemku', hodnota: 'Žádná, parcela je volná' },
	],
};
