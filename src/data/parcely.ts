// Parcely v k.ú. Trojanovice (kód 768499) podle výpisu z katastru.
//
// Údaje o parcelách se udržují tady, zákres do map se generuje — čísla, výměry
// a odkazy do KN jsou ruční, geometrie v zakresy.ts patří skriptu
// scripts/podklady.mjs, který ji bere z RÚIAN. Když se zákres má překreslit,
// pustí se skript, ne editor.

import { POZEMEK_ZAKRES, VYREZY, ZAKRESY, type Zakres } from './zakresy';

export { VYREZY, type Zakres };

/*
 * Pozemky se prodávají ve dvou samostatných nabídkách. U háječku jsou v nabídce
 * celé tři parcely; u domu se prodává jen pozemek vymezený kolem staveb (viz
 * pozemekUDomu níže) a okolní louky jsou k dokoupení nad rámec nabídky.
 * `nabidka` proto říká, ke které nabídce parcela patří — ne že je celá na prodej.
 */
export type Nabidka = 'dum' | 'hajecek';

export interface Parcela extends Udaje {
	prehled: Zakres;
	detail: Zakres;
}

interface Udaje {
	cislo: string;
	vymera: number;
	druh: string;
	stavebni: boolean;
	nabidka: Nabidka;
	/** co na stavební parcele stojí; chybí, když je parcela volná */
	stavba?: string;
	kn: string;
}

const udaje: Udaje[] = [
	{
		cislo: 'St. 1878',
		vymera: 220,
		druh: 'zastavěná plocha a nádvoří',
		stavebni: true,
		nabidka: 'dum',
		stavba: 'dům č.p. 495',
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=3018265804',
	},
	{
		cislo: 'St. 173/4',
		vymera: 180,
		druh: 'zastavěná plocha a nádvoří',
		stavebni: true,
		nabidka: 'hajecek',
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2196233804',
	},
	{
		cislo: 'St. 1879',
		vymera: 79,
		druh: 'zastavěná plocha a nádvoří',
		stavebni: true,
		nabidka: 'dum',
		stavba: 'garáž',
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=3018266804',
	},
	{
		cislo: '2260/8',
		vymera: 18794,
		druh: 'trvalý travní porost',
		stavebni: false,
		nabidka: 'dum',
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2797220804',
	},
	{
		cislo: '2338/11',
		vymera: 9175,
		druh: 'trvalý travní porost',
		stavebni: false,
		nabidka: 'dum',
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2797217804',
	},
	{
		cislo: '2290',
		vymera: 2178,
		druh: 'trvalý travní porost',
		stavebni: false,
		nabidka: 'hajecek',
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2200251804',
	},
	{
		cislo: '1888/18',
		vymera: 1172,
		druh: 'trvalý travní porost',
		stavebni: false,
		nabidka: 'dum',
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2797218804',
	},
	{
		cislo: '3587/5',
		vymera: 1070,
		druh: 'ostatní plocha',
		stavebni: false,
		nabidka: 'dum',
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2797219804',
	},
	{
		cislo: '3585/3',
		vymera: 284,
		druh: 'ostatní plocha',
		stavebni: false,
		nabidka: 'hajecek',
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2202030804',
	},
];

export const parcely: Parcela[] = udaje.map((p) => {
	const zakres = ZAKRESY[p.cislo];
	if (!zakres) throw new Error(`parcela ${p.cislo} nemá zákres — pusť node scripts/podklady.mjs`);
	return { ...p, ...zakres };
});

/*
 * Pozemek u domu — to, co se u nabídky ① skutečně prodává. Hranici tvoří
 * z většiny katastrální linie; jediná nová vede úhlopříčkou přes louku 2260/8
 * a je dlouhá 70 m. Plocha je odměřená ze zákresu, ne z katastru: vychází na
 * 3 235 m², na webu se uvádí zaokrouhlená. Rozpad po parcelách:
 * St. 1878 220 + St. 1879 79 + 2260/8 2 673 + 3587/5 204 + 1888/18 58.
 *
 * Pozor: kromě obou stavebních parcel nejde o celé parcely — pozemek kolem
 * domu se z 2260/8, 3587/5 a 1888/18 teprve oddělí geometrickým plánem.
 */
export const pozemekUDomu = {
	/** zaokrouhleno na stovky — zdroj je zákres, ne geometrický plán */
	vymera: 3200,
	/** délka nově vyznačené hranice v metrech */
	delka: 70,
	/** parcely, ze kterých se pozemek kolem staveb oddělí */
	zParcel: ['2260/8', '3587/5', '1888/18'],

	/*
	 * Obvod v EPSG:3857. Deset z jedenácti vrcholů leží na katastrálních bodech
	 * (odchylka do 10 cm), poslední je volný konec nové hranice — uzavírací
	 * strana zpátky k prvnímu bodu je ta jediná bez opory v katastru.
	 *
	 * Skutečné souřadnice tu stojí schválně: zákres se pak dá překreslit do
	 * libovolného výřezu, aniž by se přeměřoval.
	 */
	hranice: [
		[2030316.79, 6362044.74],
		[2030341.54, 6362053.89],
		[2030352.35, 6362069.92],
		[2030367.66, 6362078.67],
		[2030368.32, 6362086.36],
		[2030392.1, 6362088.52],
		[2030399.23, 6362092.47],
		[2030433.48, 6362041.77],
		[2030410.55, 6362001.26],
		[2030399.86, 6361982.04],
		[2030388.46, 6361964.53],
	],

	...POZEMEK_ZAKRES,
} as const;

export const celkovaVymera = parcely.reduce((s, p) => s + p.vymera, 0);

/** Parcely jedné nabídky, v pořadí podle výpisu z katastru. */
export const proNabidku = (nabidka: Nabidka) => parcely.filter((p) => p.nabidka === nabidka);

export const vymeraNabidky = (nabidka: Nabidka) =>
	proNabidku(nabidka).reduce((s, p) => s + p.vymera, 0);

/**
 * Co nabídka skutečně obsahuje. U háječku jsou to celé parcely, u domu jen
 * vymezený pozemek — okolní louky se k němu dají dokoupit, ale součástí
 * nabídky nejsou.
 */
export const vymeraVNabidce = (nabidka: Nabidka) =>
	nabidka === 'dum' ? pozemekUDomu.vymera : vymeraNabidky(nabidka);

/** Louky kolem domu, které jsou k dokoupení nad rámec nabídky. */
export const vymeraKDokoupeni = vymeraNabidky('dum') - pozemekUDomu.vymera;

/** Stavby v nabídce jsou celé parcely, zbytek pozemku se teprve oddělí. */
export const vymeraStaveb = proNabidku('dum')
	.filter((p) => p.stavebni)
	.reduce((s, p) => s + p.vymera, 0);

/**
 * Výměra k zobrazení. Hektary dávají smysl až u velkých celků — z háječku
 * by zbylo „0,24 ha", proto se pod hektar zůstává u metrů.
 */
export const vymeraSlovy = (vymera: number) =>
	vymera >= 10000
		? `${(vymera / 10000).toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`
		: `${vymera.toLocaleString('cs-CZ')} m²`;
