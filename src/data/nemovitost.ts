// Jediné místo, kde se mění údaje o nemovitosti.
// Hodnoty jsou zatím orientační zástupné texty — přepiš je skutečnými.

export const nemovitost = {
	nazev: 'Trojanovice 495',
	podtitul: 'Rodinný dům na úpatí Beskyd',
	perex:
		'Doplň dva až tři věty, které nemovitost představí — co je na ní výjimečné, ' +
		'komu bude sedět a jaký je z ní výhled.',

	parametry: [
		{ nazev: 'Dispozice', hodnota: '5+1' },
		{ nazev: 'Užitná plocha', hodnota: '000 m²' },
		{ nazev: 'Plocha pozemku', hodnota: '000 m²' },
		{ nazev: 'Rok výstavby', hodnota: '0000' },
		{ nazev: 'Stav', hodnota: 'Po rekonstrukci' },
		{ nazev: 'Vytápění', hodnota: 'Doplnit' },
		{ nazev: 'Energetická třída', hodnota: 'Doplnit' },
		{ nazev: 'Parkování', hodnota: 'Garáž + stání na pozemku' },
	],

	// Fotky ulož do public/fotky/ a doplň sem názvy souborů.
	galerie: [
		{ soubor: 'dum-01.jpg', popis: 'Pohled na dům z příjezdové cesty' },
		{ soubor: 'dum-02.jpg', popis: 'Obývací pokoj' },
		{ soubor: 'dum-03.jpg', popis: 'Zahrada' },
	],

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
		telefon: '+420 000 000 000',
		email: 'hausterlitz@gmail.com',
	},
};
