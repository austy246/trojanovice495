// Jediné místo, kde se mění údaje o nabídce ②: háječek se stavebním pozemkem.
// Údaje společné s domem (kontakt, lokalita, souřadnice) jsou v spolecne.ts.
//
// Zatím neověřené a proto nezobrazované údaje — až budou známé, doplň je
// mezi parametry: inženýrské sítě, územní plán.

export const hajecek = {
	nazev: 'Háječek se stavebním pozemkem',
	podtitul: 'Stavební parcela s vlastní zelení pod Radhoštěm',
	perex:
		'Na stejném svahu nad Trojanovicemi jako dům č.p. 495, hned vedle jeho pozemků, ' +
		'prodávám samostatně stavební parcelu St. 173/4, přilehlý háječek a přístupovou cestu ' +
		'k němu. Stavba, kterou na parcele eviduje katastr, už fyzicky nestojí — je to tedy ' +
		'volné místo ke stavbě se vzrostlou zelení kolem a s vlastním přístupem, kilometr od ' +
		'dolní stanice lanovky na Pustevny.',

	// Výměry pocházejí z katastru — viz src/data/parcely.ts.
	parametry: [
		{ nazev: 'Celková výměra', hodnota: '2 642 m²' },
		{ nazev: 'Stavební parcela', hodnota: '180 m² (St. 173/4)' },
		{ nazev: 'Trvalý travní porost', hodnota: '2 178 m² (2290)' },
		{ nazev: 'Přístupová cesta', hodnota: '284 m² (3585/3)' },
		{ nazev: 'Stavba na pozemku', hodnota: 'Žádná, parcela je volná' },
		{ nazev: 'Katastrální území', hodnota: 'Trojanovice (768499)' },
	],
};
