// Jediné místo, kde se mění údaje o nabídce ①: dům, garáž, zahrada.
// Údaje společné s háječkem (kontakt, lokalita, souřadnice) jsou v spolecne.ts.

export const nemovitost = {
	nazev: 'Trojanovice 495',
	podtitul: 'Rodinný dům se vzrostlou zahradou pod Radhoštěm',

	// Cena za nabídku, tedy dům, garáž a vymezený pozemek kolem nich.
	// Okolní louky v ceně nejsou, jdou dokoupit - viz parcely.ts.
	cena: 21_900_000,
	cenaPoznamka: 'za dům, garáž a pozemek ≈ 3 200 m²',

	perex:
		'Na horním konci Trojanovic, kde zástavba přechází v louky a les, stojí rodinný dům ' +
		'z roku 2006. Uvnitř je otevřená obytná hala s krbem a galerií přes dvě podlaží, ' +
		'sedm pokojů a tři koupelny; teplo dodává tepelné čerpadlo země-voda do podlahového ' +
		'vytápění. Zahrada kolem domu měla dvacet let na to, aby vzrostla — k domu patří ' +
		'zhruba 3 200 m² pozemku a dokoupit se dají i okolní louky až k lesu. Dolní stanice ' +
		'lanovky na Pustevny je odsud kilometr daleko.',

	// Úvodní fotka. Varianta na výšku je vlastní výřez pro úzké displeje —
	// na nich by se z fotky na šířku ukázalo celé nebe i celá louka.
	uvodniFoto: {
		soubor: '01-dum-a-pozemek.jpg',
		souborNaVysku: '01-dum-a-pozemek-na-vysku.jpg',
		popis: 'Dům na kraji vlastní louky',
	},

	// Výměry pozemků pocházejí z katastru — viz src/data/parcely.ts.
	// Zbytek je zatím zástupný a čeká na doplnění.
	parametry: [
		{ nazev: 'Dispozice', hodnota: '7+1' },
		{ nazev: 'Koupelny', hodnota: '3' },
		{ nazev: 'Užitná plocha', hodnota: '000 m²' },
		// Pozemek je odměřený ze zákresu do katastrální mapy — viz parcely.ts.
		{ nazev: 'Pozemek', hodnota: '≈ 3 200 m²' },
		{ nazev: 'Louky k dokoupení', hodnota: '≈ 27 310 m² (2,73 ha)' },
		{ nazev: 'Zastavěná plocha', hodnota: '299 m² (2 stavební parcely)' },
		{ nazev: 'Rok výstavby', hodnota: '2006' },
		{ nazev: 'Stav', hodnota: 'Původní, bez rekonstrukce' },
		{ nazev: 'Fasáda', hodnota: 'Omítka, dřevem obložený štít' },
		{ nazev: 'Vytápění', hodnota: 'Tepelné čerpadlo země-voda' },
		{ nazev: 'Otopná soustava', hodnota: 'Podlahové vytápění' },
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
};
