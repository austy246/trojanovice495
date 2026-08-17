// Jediné místo, kde se mění údaje o nabídce ②: háječek se stavebním pozemkem.
// Údaje společné s domem (kontakt, lokalita, souřadnice) jsou v spolecne.ts.
//
// Zatím neověřené a proto nezobrazované údaje — až budou známé, doplň je
// mezi parametry: inženýrské sítě, přístupová cesta, územní plán.

export const hajecek = {
	nazev: 'Háječek se stavebním pozemkem',
	podtitul: 'Stavební parcela s vlastní zelení pod Radhoštěm',
	perex:
		'Na stejném svahu nad Trojanovicemi jako dům č.p. 495, hned vedle jeho pozemků, ' +
		'prodávám samostatně stavební parcelu St. 173/4 a přilehlý háječek. Stavba, kterou ' +
		'na parcele eviduje katastr, už fyzicky nestojí — je to tedy volné místo ke stavbě ' +
		'se vzrostlou zelení kolem, kilometr od dolní stanice lanovky na Pustevny.',

	// Výměry pocházejí z katastru — viz src/data/parcely.ts.
	parametry: [
		{ nazev: 'Celková výměra', hodnota: '2 358 m²' },
		{ nazev: 'Stavební parcela', hodnota: '180 m² (St. 173/4)' },
		{ nazev: 'Trvalý travní porost', hodnota: '2 178 m² (2290)' },
		{ nazev: 'Stavba na pozemku', hodnota: 'Žádná, parcela je volná' },
		{ nazev: 'Katastrální území', hodnota: 'Trojanovice (768499)' },
	],
};
