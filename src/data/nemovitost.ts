// Jediné místo, kde se mění údaje o nabídce ①: dům, garáž, zahrada.
// Údaje společné s háječkem (kontakt, lokalita, souřadnice) jsou v spolecne.ts.

// Plochy místností opsané z legend na stavebních výkresech (A.J.A, 07/2004) —
// listy „Půdorys přízemí“ a „Půdorys podkroví“, viz nakresy.ts. Čísla místností
// odpovídají popiskům ve výkresech, ať se dají v legendě dohledat.
//
// Terasy tu záměrně nejsou: legenda 1.NP je vede jako 1.14–1.16, ale plochu má
// vyčíslenou jen 1.14 (10,20 m²). Do užitné plochy se terasy nepočítají.
const plochy = [
	{
		podlazi: 'Přízemí',
		mistnosti: [
			{ cislo: '1.01', nazev: 'Zádveří', plocha: 7.3 },
			{ cislo: '1.02', nazev: 'Vstupní hala', plocha: 12.86 },
			{ cislo: '1.03', nazev: 'Jídelní hala s galerií', plocha: 32.73 },
			{ cislo: '1.04', nazev: 'Obytná hala', plocha: 34.0 },
			{ cislo: '1.05', nazev: 'Kuchyň', plocha: 18.8 },
			{ cislo: '1.06', nazev: 'Spíž', plocha: 5.76 },
			{ cislo: '1.07', nazev: 'Pokoj', plocha: 12.6 },
			{ cislo: '1.08', nazev: 'Pracovna', plocha: 12.78 },
			{ cislo: '1.09', nazev: 'Ložnice', plocha: 17.12 },
			{ cislo: '1.10', nazev: 'Šatna', plocha: 7.25 },
			{ cislo: '1.11', nazev: 'Koupelna', plocha: 10.36 },
			{ cislo: '1.12', nazev: 'Koupelna', plocha: 3.7 },
			{ cislo: '1.13', nazev: 'Technické zázemí', plocha: 4.72 },
		],
	},
	{
		podlazi: 'Podkroví',
		mistnosti: [
			{ cislo: '2.01', nazev: 'Galerie', plocha: 33.6 },
			{ cislo: '2.02', nazev: 'Pokoj', plocha: 30.6 },
			{ cislo: '2.03', nazev: 'Pokoj', plocha: 23.1 },
			{ cislo: '2.04', nazev: 'Pokoj', plocha: 25.75 },
			{ cislo: '2.05', nazev: 'Koupelna', plocha: 4.05 },
		],
	},
];

/** Užitná plocha = součet místností obou podlaží, bez teras. Vychází 297,08 m². */
const uzitnaPlocha = plochy.reduce(
	(celkem, podlazi) => celkem + podlazi.mistnosti.reduce((s, m) => s + m.plocha, 0),
	0,
);

export const nemovitost = {
	nazev: 'Trojanovice 495',
	podtitul: 'Rodinný dům se vzrostlou zahradou pod Radhoštěm',

	// Cena za nabídku, tedy dům, garáž a vymezený pozemek kolem nich.
	// Okolní louky v ceně nejsou, jdou dokoupit - viz parcely.ts.
	cena: 24_900_000,
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

	// Rozpis místností, ze kterého se počítá užitná plocha níž.
	plochy,

	// Výměry pozemků pocházejí z katastru — viz src/data/parcely.ts.
	parametry: [
		{ nazev: 'Dispozice', hodnota: '7+1' },
		{ nazev: 'Koupelny', hodnota: '3' },
		// V přehledu zaokrouhleno, přesný součet je v sekci Rozlohy místností.
		{ nazev: 'Užitná plocha', hodnota: `${Math.round(uzitnaPlocha)} m²` },
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
