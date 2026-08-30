// Výkresy z projektové dokumentace domu, Architektonický ateliér A.J.A,
// Ing. arch. Aleš Jílek, 07/2004.
//
// Zdrojem jsou nedotčené skeny v podklady/vykresy/. Co je v public/nakresy/
// a public/nakresy/nahledy/, generuje `npm run vykresy` — ten listy ořeže
// a poměry stran níž si přepisuje sám, takže se ručně needitují.
//
// Ukazuje se jen to, co zajímá kupujícího: dva půdorysy a čtyři řezy.
// Základy, střecha, krov a řezy krovem jsou konstrukční detaily pro stavbu,
// na inzerát nepatří a v dokumentaci si je vyžádá, kdo je potřebuje.
//
// Nezobrazuje se ani druhý půdorys podkroví (list „PŮDORYS 2.NP“, V1-06-03).
// Uvádí jiné plochy místností než list „podkroví“, ze kterého počítá užitnou
// plochu nemovitost.ts — dva rozporné půdorysy vedle sebe by kupujícího mátly.

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
		popis: 'Obytná hala s krbem, kuchyň, ložnice a dva pokoje',
		pomer: '1415 / 1282',
	},
	{
		soubor: '03-pudorys-podkrovi.webp',
		nazev: 'Půdorys podkroví',
		popis: 'Galerie, tři pokoje a koupelna',
		pomer: '1777 / 1567',
	},
	{
		soubor: '07-rez-a-a.webp',
		nazev: 'Řez A-A',
		popis: 'Podélný řez s legendou materiálů',
		pomer: '2405 / 1447',
	},
	{ soubor: '08-rez-b-b.webp', nazev: 'Řez B-B', popis: 'Přes schodiště', pomer: '2395 / 1173' },
	{ soubor: '09-rez-c-c.webp', nazev: 'Řez C-C', popis: 'Příčný řez', pomer: '2366 / 1479' },
	{ soubor: '10-rez-d-d.webp', nazev: 'Řez D-D', popis: 'Podélný řez', pomer: '2366 / 1123' },
];
