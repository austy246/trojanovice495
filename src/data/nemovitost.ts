// Jediné místo, kde se mění údaje o nemovitosti.
// Hodnoty jsou zatím orientační zástupné texty — přepiš je skutečnými.

export const nemovitost = {
	nazev: 'Trojanovice 495',
	podtitul: 'Rodinný dům na úpatí Beskyd',
	perex:
		'Doplň dva až tři věty, které nemovitost představí — co je na ní výjimečné, ' +
		'komu bude sedět a jaký je z ní výhled.',

	// Výměry pozemků pocházejí z katastru — viz src/data/parcely.ts.
	// Zbytek je zatím zástupný a čeká na doplnění.
	parametry: [
		{ nazev: 'Dispozice', hodnota: '5+1' },
		{ nazev: 'Užitná plocha', hodnota: '000 m²' },
		{ nazev: 'Pozemky celkem', hodnota: '33 152 m² (3,32 ha)' },
		{ nazev: 'Zastavěná plocha', hodnota: '479 m² (3 stavební parcely)' },
		{ nazev: 'Rok výstavby', hodnota: '2006' },
		{ nazev: 'Stav', hodnota: 'Původní, bez rekonstrukce' },
		{ nazev: 'Vytápění', hodnota: 'Tepelné čerpadlo země-voda' },
		{ nazev: 'Otopná soustava', hodnota: 'Podlahové vytápění' },
		{ nazev: 'Zemní kolektor', hodnota: '130 m' },
		{ nazev: 'Parkování', hodnota: 'Garáž na parcele St. 1879' },
	],

	// Fotky ulož do public/fotky/ a doplň sem názvy souborů:
	// { soubor: 'dum-01.jpg', popis: 'Pohled na dům z příjezdové cesty' }
	galerie: [] as { soubor: string; popis: string }[],

	lokalita: {
		popis:
			'Trojanovice leží pod Radhoštěm a Pustevnami, s Frenštátem pod Radhoštěm ' +
			'na dosah. Doplň, co je v okolí a jak daleko.',
		vzdalenosti: [
			{ misto: 'Frenštát pod Radhoštěm', hodnota: '0 km' },
			{ misto: 'Pustevny', hodnota: '0 km' },
			{ misto: 'Ostrava', hodnota: '0 km' },
		],
	},

	kontakt: {
		jmeno: 'Jan Austerlitz',
		telefon: '+420 725 398 765',
		email: 'hausterlitz@gmail.com',
	},
};
