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
		{ nazev: 'Dispozice', hodnota: '7+1' },
		{ nazev: 'Koupelny', hodnota: '3' },
		{ nazev: 'Užitná plocha', hodnota: '000 m²' },
		{ nazev: 'Pozemky celkem', hodnota: '33 152 m² (3,32 ha)' },
		{ nazev: 'Zastavěná plocha', hodnota: '479 m² (3 stavební parcely)' },
		{ nazev: 'Rok výstavby', hodnota: '2006' },
		{ nazev: 'Stav', hodnota: 'Původní, bez rekonstrukce' },
		{ nazev: 'Vytápění', hodnota: 'Tepelné čerpadlo země-voda' },
		{ nazev: 'Otopná soustava', hodnota: 'Podlahové vytápění' },
		{ nazev: 'Zemní kolektor', hodnota: '130 m' },
		{ nazev: 'Garáž', hodnota: 'Pro dva vozy, s dílnou a podkrovím' },
		{ nazev: 'Parkování', hodnota: '3 místa před garáží' },
	],

	rozlozeni: [
		{ podlazi: 'Přízemí', mistnosti: 'Ložnice, dva pokoje, obývák a kuchyň, dvě koupelny' },
		{ podlazi: 'Patro', mistnosti: 'Tři pokoje a koupelna' },
	],

	// Dočasné amatérské fotky z 2. 5. 2026, než budou profesionální.
	galerie: [
		{ soubor: '01-dum-a-pozemek.jpg', popis: 'Dům na kraji vlastní louky' },
		{ soubor: '02-dum-ze-zahrady.jpg', popis: 'Vstup do domu ze zahrady' },
		{ soubor: '03-terasa.jpg', popis: 'Krytá terasa s výhledem do zahrady' },
		{ soubor: '04-obytna-hala.jpg', popis: 'Obytná hala se schodištěm do podkroví' },
		{ soubor: '05-krb.jpg', popis: 'Krb v obytné hale' },
		{ soubor: '06-kuchyn.jpg', popis: 'Kuchyň s ostrůvkem a barem' },
		{ soubor: '07-jidelna.jpg', popis: 'Jídelna' },
		{ soubor: '08-obyvaci-cast.jpg', popis: 'Obývací část s výstupem na terasu' },
		{ soubor: '09-loznice.jpg', popis: 'Ložnice' },
		{ soubor: '10-koupelna.jpg', popis: 'Koupelna s vanou i sprchovým koutem' },
		{ soubor: '11-galerie.jpg', popis: 'Galerie v podkroví' },
		{ soubor: '12-pokoj-podkrovi.jpg', popis: 'Pokoj v podkroví' },
		{ soubor: '13-vyhled.jpg', popis: 'Výhled na Beskydy ze zahrady' },
		{ soubor: '14-garaz.jpg', popis: 'Garáž pro dva vozy' },
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
		telefon: '+420 725 398 765',
		email: 'hausterlitz@gmail.com',
	},
};
