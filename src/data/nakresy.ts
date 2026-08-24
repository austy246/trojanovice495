// Výkresy z projektové dokumentace domu, Architektonický ateliér A.J.A,
// Ing. arch. Aleš Jílek, 07/2004. Naskenované listy jsou v public/nakresy/,
// zmenšené náhledy pro mřížku v public/nakresy/nahledy/ (stejné názvy).
//
// Roubenka (12-roubenka-rezy.webp) je ve stejné složce, ale záměrně se
// nikde nezobrazuje — není ověřené, ke které stavbě patří.

export interface Nakres {
	soubor: string;
	nazev: string;
	popis: string;
	/** poměr stran, aby mřížka nepodskakovala při načítání */
	pomer: string;
}

export const nakresy: Nakres[] = [
	{
		soubor: '01-pudorys-prizemi.webp',
		nazev: 'Půdorys přízemí',
		popis: 'S legendou místností a jejich plochami',
		pomer: '2400 / 1683',
	},
	{
		soubor: '03-pudorys-podkrovi.webp',
		nazev: 'Půdorys podkroví',
		popis: 'Galerie, tři pokoje a koupelna',
		pomer: '2010 / 1819',
	},
	{
		soubor: '02-pudorys-podkrovi-studie.webp',
		nazev: 'Půdorys podkroví — studie',
		popis: 'Starší varianta z architektonické studie',
		pomer: '2400 / 1689',
	},
	{
		soubor: '07-rez-a-a.webp',
		nazev: 'Řez A-A',
		popis: 'S legendou materiálů a skladbou podlahy',
		pomer: '2400 / 1467',
	},
	{ soubor: '08-rez-b-b.webp', nazev: 'Řez B-B', popis: 'Přes schodiště', pomer: '2400 / 1195' },
	{ soubor: '09-rez-c-c.webp', nazev: 'Řez C-C', popis: 'Příčný řez', pomer: '2400 / 1703' },
	{ soubor: '10-rez-d-d.webp', nazev: 'Řez D-D', popis: 'Podélný řez', pomer: '2400 / 1265' },
	{
		soubor: '05-strecha.webp',
		nazev: 'Střecha',
		popis: 'Sklony, žlaby a půdorysné rozměry',
		pomer: '2400 / 1678',
	},
	{ soubor: '06-krov.webp', nazev: 'Krov', popis: 'Skladba krovu', pomer: '2400 / 1673' },
	{
		soubor: '11-rezy-krovem.webp',
		nazev: 'Řezy krovem',
		popis: 'Řezy B-B a E-E',
		pomer: '2334 / 1579',
	},
	{
		soubor: '04-zaklady.webp',
		nazev: 'Základy',
		popis: 'Základové pasy a výškové kóty',
		pomer: '2400 / 1690',
	},
];
