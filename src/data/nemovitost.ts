// Jediné místo, kde se mění údaje o nemovitosti.

export const nemovitost = {
	nazev: 'Trojanovice 495',
	podtitul: 'Rodinný dům s 3,3 hektaru pozemků pod Radhoštěm',
	perex:
		'Na horním konci Trojanovic, kde zástavba přechází v louky a les, stojí rodinný dům ' +
		'z roku 2006. Uvnitř je otevřená obytná hala s krbem a galerií přes dvě podlaží, ' +
		'sedm pokojů a tři koupelny; teplo dodává tepelné čerpadlo země-voda do podlahového ' +
		'vytápění. Zahrada kolem domu měla dvacet let na to, aby vzrostla, a spolu s okolními ' +
		'loukami k domu patří 3,32 ha pozemků. Dolní stanice lanovky na Pustevny je odsud ' +
		'kilometr daleko.',

	// Úvodní fotka pod nadpisem. Soubor leží v public/fotky/.
	uvodniFoto: { soubor: '01-dum-a-pozemek.jpg', popis: 'Dům na kraji vlastní louky' },

	// Adresní bod č.p. 495 podle RÚIAN (ČÚZK), leží na parcele St. 1878.
	souradnice: { sirka: 49.511258, delka: 18.239152 },

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
		{ nazev: 'Fasáda', hodnota: 'Omítka, dřevem obložený štít' },
		{ nazev: 'Vytápění', hodnota: 'Tepelné čerpadlo země-voda' },
		{ nazev: 'Otopná soustava', hodnota: 'Podlahové vytápění' },
		{ nazev: 'Zemní kolektor', hodnota: '130 m jedním směrem' },
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
		{ soubor: '14-zahrada.jpg', popis: 'Vzrostlá zahrada kolem domu' },
		{ soubor: '15-garaz.jpg', popis: 'Garáž pro dva vozy' },
	],

	// Vzdálenosti jsou po silnici, spočítané z adresního bodu domu.
	lokalita: {
		popis:
			'Trojanovice se táhnou po severním úbočí Radhoště a dům stojí v jejich horní části, ' +
			'kde už zástavbu střídají louky a les. Hřeben s Pustevnami a Radhoštěm je odsud ' +
			'vzdušnou čarou tři kilometry a nahoru se dá vyjet lanovkou z Ráztoky, jejíž dolní ' +
			'stanice je kousek po cestě. Veškerou občanskou vybavenost — obchody, školy i vlakové ' +
			'nádraží — nabízí Frenštát pod Radhoštěm pět minut autem.',
		vzdalenosti: [
			{ misto: 'Lanovka na Pustevny (Ráztoka)', hodnota: '1 km' },
			{ misto: 'Frenštát pod Radhoštěm', hodnota: '5 km' },
			{ misto: 'Rožnov pod Radhoštěm', hodnota: '13 km' },
			{ misto: 'Letiště Ostrava-Mošnov', hodnota: '26 km' },
			{ misto: 'Ostrava', hodnota: '48 km' },
		],
	},

	kontakt: {
		jmeno: 'Jan Austerlitz',
		telefon: '+420 725 398 765',
		email: 'hausterlitz@gmail.com',
	},
};
