// Jediné místo, kde se mění údaje o domě, garáži a zahradě. Háječek, který se
// prodává spolu s nimi v jedné nabídce, má vlastní soubor hajecek.ts; údaje
// společné oběma částem (kontakt, lokalita, souřadnice) jsou v spolecne.ts.

import { proCast } from './parcely';

/*
 * Zastavěná plocha se dopočítává z výměr obou stavebních parcel u domu —
 * obrysem stavební parcely je sama stavba. Opsané číslo by se rozešlo
 * s katastrem, jakmile by se výměra opravila.
 *
 * Pozor na rozdíl proti užitné ploše níž: ta je součtem místností a je jen
 * za dům, kdežto zastavěná plocha je půdorys domu i garáže. Čísla vycházejí
 * skoro stejná (297 a 299 m²), a přitom měří něco jiného — proto jsou
 * v přehledu vedle sebe a s rozpisem, ne každé jinde.
 */
const cislo = new Intl.NumberFormat('cs-CZ');

/*
 * Průkaz energetické náročnosti budovy, ev. č. 879101.0, vyhotovil
 * Ing. Tomáš Brückner (oprávnění č. 896) 28. 8. 2026 s platností deset let.
 * Čísla jsou z protokolu průkazu, ne odhad — třídu A přiznává i sám protokol
 * („objekt spadá do energetické třídy A“), a proto v něm nejsou navržena
 * žádná úsporná opatření.
 */
export const energie = {
	trida: 'A',
	tridaSlovy: 'mimořádně úsporná',
	/** neobnovitelná primární energie, kWh/m² za rok — podle ní se třída určuje */
	primarni: 19,
	/** celková dodaná energie, kWh/m² za rok */
	dodana: 101,
	prumernyProstup: 0.27,
	prukaz: {
		evidencni: '879101.0',
		vyhotoven: '28. 8. 2026',
		platnyDo: '28. 8. 2036',
		specialista: 'Ing. Tomáš Brückner',
		/** doplní se do public/; odkaz ke stažení se ukáže, až soubor existuje */
		soubor: '/dokumenty/energeticky-prukaz.pdf',
	},
	/** skutečné náklady majitele, ne výpočet z průkazu */
	mesicne: 5500,
};

const staveb = proCast('dum').filter((p) => p.stavebni);
const vymeraStavby = (co: string) => staveb.find((p) => p.stavba?.startsWith(co))?.vymera ?? 0;
const zastavenoDum = vymeraStavby('dům');
const zastavenoGaraz = vymeraStavby('garáž');

/*
 * St. 173/4 — stavební parcela v háječku. V katastru je vedená jako zastavěná
 * plocha, ale stavba na ní už nestojí, takže je volná k zastavění.
 */
const stavebniVHajecku = proCast('hajecek').find((p) => p.stavebni);

// Plochy místností opsané z legend na stavebních výkresech (A.J.A, 07/2004) —
// listy „Půdorys přízemí“ a „Půdorys podkroví“; skeny obou půdorysů jsou
// v podklady/pudorys/, ostatní listy v podklady/vykresy/. Web výkresy neukazuje,
// schémata v pudorys.ts kreslí skutečný stav a výkresy se od něj místy liší.
// Čísla místností odpovídají popiskům ve výkresech, ať se dají v legendě dohledat.
//
// Terasy tu záměrně nejsou: legenda 1.NP je vede jako 1.14–1.16, ale plochu má
// vyčíslenou jen 1.14 (10,20 m²). Do užitné plochy se terasy nepočítají.
// `foto` u místnosti je jen tip, na kterou fotku z galerie se u schématu
// ukázat náhled — fotograf nedodal fotky podle čísel místností, spárování
// je odhadem podle nábytku a pohledu. Pár místností fotku nemá vůbec (šatna).
const plochy = [
	{
		podlazi: 'Přízemí',
		mistnosti: [
			{ cislo: '1.01', nazev: 'Zádveří', plocha: 7.3 },
			{ cislo: '1.02', nazev: 'Vstupní hala', plocha: 12.86, foto: '09-vstupni-hala.jpg' },
			{ cislo: '1.03', nazev: 'Jídelní hala', plocha: 32.73, foto: '12-jidelni-hala.jpg' },
			{ cislo: '1.04', nazev: 'Obytná hala', plocha: 34.0, foto: '10-obytna-hala.jpg' },
			{ cislo: '1.05', nazev: 'Kuchyň', plocha: 18.8, foto: '13-kuchyn.jpg' },
			{ cislo: '1.06', nazev: 'Spíž', plocha: 5.76, foto: '14-spiz.jpg' },
			{ cislo: '1.07', nazev: 'Pokoj', plocha: 12.6, foto: '16-pokoj.jpg' },
			{ cislo: '1.08', nazev: 'Pracovna', plocha: 12.78, foto: '15-pracovna.jpg' },
			{ cislo: '1.09', nazev: 'Ložnice', plocha: 17.12, foto: '17-loznice.jpg' },
			{ cislo: '1.10', nazev: 'Šatna', plocha: 7.25, foto: '08-satna.jpg' },
			{ cislo: '1.11', nazev: 'Koupelna', plocha: 10.36, foto: '18-koupelna.jpg' },
			{ cislo: '1.12', nazev: 'Koupelna', plocha: 3.7, foto: '19-koupelna-mala.jpg' },
			{ cislo: '1.13', nazev: 'Technické zázemí', plocha: 4.72, foto: '20-technicke-zazemi.jpg' },
		],
	},
	{
		podlazi: 'Podkroví',
		mistnosti: [
			{ cislo: '2.01', nazev: 'Galerie', plocha: 33.6, foto: '21-galerie.jpg' },
			{ cislo: '2.02', nazev: 'Pokoj', plocha: 30.6, foto: '22-pokoj-podkrovi.jpg' },
			{ cislo: '2.03', nazev: 'Pokoj', plocha: 23.1, foto: '24-pokoj-podkrovi-3.jpg' },
			{ cislo: '2.04', nazev: 'Pokoj', plocha: 25.75, foto: '23-pokoj-podkrovi-2.jpg' },
			{ cislo: '2.05', nazev: 'Koupelna', plocha: 4.05, foto: '25-koupelna-podkrovi.jpg' },
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

	// Cena za celou nabídku: dům, garáž, vymezený pozemek kolem nich a háječek.
	// Co přesně je v nabídce, rozepisuje parcely.ts.
	cena: 26_900_000,
	// Stavební pozemek v háječku je parcela St. 173/4 — zastavěná plocha, na které
	// už žádná stavba nestojí. Viz parcely.ts.
	cenaPoznamka:
		'za dům, garáž, pozemek ≈ 3 200 m² a háječek 2 642 m² se stavebním pozemkem 180 m²',

	perex:
		'Na horním konci Trojanovic, kde zástavba přechází v louky a les, stojí rodinný dům ' +
		'z roku 2006. Uvnitř je otevřená obytná hala s krbem a galerií přes dvě podlaží, ' +
		'sedm pokojů a tři koupelny; teplo dodává tepelné čerpadlo země-voda do podlahového ' +
		'vytápění. Zahrada kolem domu měla dvacet let na to, aby vzrostla — k domu patří ' +
		'zhruba 3 200 m² pozemku. Spolu s domem se v jedné nabídce prodává i sousední ' +
		'háječek, dalších 2 642 m² s vlastní přístupovou cestou a s volnou stavební ' +
		'parcelou — stavba, kterou na ní katastr eviduje, už fyzicky nestojí. Dolní ' +
		'stanice lanovky na Pustevny je odsud kilometr daleko.',

	// Úvodní fotka. Varianta na výšku je vlastní výřez pro úzké displeje —
	// na nich by se z fotky na šířku ukázalo celé nebe i celá louka.
	uvodniFoto: {
		soubor: '01-dum-a-pozemek.jpg',
		souborNaVysku: '01-dum-a-pozemek-na-vysku.jpg',
		popis: 'Dům s garáží uprostřed vlastní louky, v pozadí Beskydy',
	},

	// Rozpis místností, ze kterého se počítá užitná plocha níž.
	plochy,

	// Výměry pozemků pocházejí z katastru — viz src/data/parcely.ts.
	parametry: [
		{ nazev: 'Dispozice', hodnota: '7+1' },
		{ nazev: 'Koupelny', hodnota: '3' },
		// Obě plochy stojí vedle sebe schválně — viz poznámka u zastavenoDum výš.
		// V přehledu zaokrouhleno, přesný součet je v sekci Rozlohy místností.
		{ nazev: 'Užitná plocha domu', hodnota: `${Math.round(uzitnaPlocha)} m² ve dvou podlažích` },
		{
			nazev: 'Zastavěná plocha',
			hodnota: `${zastavenoDum + zastavenoGaraz} m² — dům ${zastavenoDum}, garáž ${zastavenoGaraz}`,
		},
		// Pozemek je odměřený ze zákresu do katastrální mapy — viz parcely.ts.
		{ nazev: 'Pozemek u domu', hodnota: '≈ 3 200 m²' },
		{ nazev: 'Háječek v nabídce', hodnota: '2 642 m² s vlastní přístupovou cestou' },
		{
			nazev: 'Volná stavební parcela',
			hodnota: `${stavebniVHajecku?.vymera ?? 0} m² v háječku (${stavebniVHajecku?.cislo ?? ''})`,
		},
		{ nazev: 'Rok výstavby', hodnota: '2006' },
		{ nazev: 'Stav', hodnota: 'Původní, bez rekonstrukce' },
		{ nazev: 'Fasáda', hodnota: 'Omítka, dřevem obložený štít' },
		{ nazev: 'Vytápění', hodnota: 'Tepelné čerpadlo země-voda' },
		{ nazev: 'Otopná soustava', hodnota: 'Podlahové vytápění' },
		{ nazev: 'Energetická třída', hodnota: `${energie.trida} — ${energie.tridaSlovy}` },
		{ nazev: 'Náklady na energie', hodnota: `${cislo.format(energie.mesicne)} Kč měsíčně` },
		{ nazev: 'Garáž', hodnota: 'Pro dva vozy, s dílnou a podkrovím' },
		{ nazev: 'Parkování', hodnota: '3 místa před garáží' },
	],

	// Profesionální fotky z 4. 9. 2026 (dron + interiéry).
	galerie: [
		{ soubor: '01-dum-a-pozemek.jpg', popis: 'Dům s garáží uprostřed vlastní louky' },
		{ soubor: '02-pozemek-shora.jpg', popis: 'Pozemek z ptačí perspektivy' },
		{ soubor: '03-dum-ze-zahrady.jpg', popis: 'Dům ze zahrady' },
		{ soubor: '04-terasa.jpg', popis: 'Krytá terasa s posezením' },
		{ soubor: '05-zahrada.jpg', popis: 'Vzrostlá zahrada kolem domu' },
		{ soubor: '06-vyhled.jpg', popis: 'Výhled na Beskydy' },
		{ soubor: '07-garaz.jpg', popis: 'Garáž pro dva vozy' },
		{ soubor: '08-satna.jpg', popis: 'Šatna s vestavěnou skříní' },
		{ soubor: '09-vstupni-hala.jpg', popis: 'Vstupní hala' },
		{ soubor: '10-obytna-hala.jpg', popis: 'Obytná hala se schodištěm do podkroví' },
		{ soubor: '11-obytna-hala-galerie.jpg', popis: 'Obytná hala s výhledem do galerie' },
		{ soubor: '12-jidelni-hala.jpg', popis: 'Jídelní hala' },
		{ soubor: '13-kuchyn.jpg', popis: 'Kuchyň s ostrůvkem a barem' },
		{ soubor: '14-spiz.jpg', popis: 'Spíž' },
		{ soubor: '15-pracovna.jpg', popis: 'Pracovna' },
		{ soubor: '16-pokoj.jpg', popis: 'Pokoj v přízemí' },
		{ soubor: '17-loznice.jpg', popis: 'Ložnice' },
		{ soubor: '18-koupelna.jpg', popis: 'Koupelna s vanou i sprchovým koutem' },
		{ soubor: '19-koupelna-mala.jpg', popis: 'Menší koupelna se sprchou' },
		{ soubor: '20-technicke-zazemi.jpg', popis: 'Technické zázemí' },
		{ soubor: '21-galerie.jpg', popis: 'Galerie v podkroví' },
		{ soubor: '22-pokoj-podkrovi.jpg', popis: 'Pokoj v podkroví' },
		{ soubor: '23-pokoj-podkrovi-2.jpg', popis: 'Další pokoj v podkroví' },
		{ soubor: '24-pokoj-podkrovi-3.jpg', popis: 'Třetí pokoj v podkroví' },
		{ soubor: '25-koupelna-podkrovi.jpg', popis: 'Koupelna v podkroví' },
	],
};
