// Parcely v k.ú. Trojanovice (kód 768499) podle výpisu z katastru.
//
// Údaje o parcelách se udržují tady, zákres do map se generuje — čísla, výměry
// a odkazy do KN jsou ruční, geometrie v zakresy.ts patří skriptu
// scripts/podklady.mjs, který ji bere z RÚIAN. Když se zákres má překreslit,
// pustí se skript, ne editor.

import { POZEMEK_ZAKRES, VYREZY, ZAKRESY, type Zakres } from './zakresy';

export { VYREZY, type Zakres };

/*
 * Prodává se jedna nabídka o dvou částech: pozemek vymezený kolem domu
 * a garáže, a vedle něj celý háječek. `cast` říká, do které z nich parcela
 * patří — a parcely bez ní do nabídky nepatří vůbec. Jsou to okolní louky;
 * pozemek u domu se z nich teprve oddělí (viz pozemekUDomu níž), samy se
 * ale neprodávají a na webu se o nich nemluví.
 */
export type Cast = 'dum' | 'hajecek';

export interface Parcela extends Udaje {
	prehled: Zakres;
	detail: Zakres;
}

interface Udaje {
	cislo: string;
	vymera: number;
	druh: string;
	stavebni: boolean;
	/** chybí u parcel mimo nabídku */
	cast?: Cast;
	/** co na stavební parcele stojí; chybí, když je parcela volná */
	stavba?: string;
	/** čím se parcela vypíše v tabulce nabídky; jinak stačí stavba nebo druh */
	poznamka?: string;
	kn: string;
}

const udaje: Udaje[] = [
	{
		cislo: 'St. 1878',
		vymera: 220,
		druh: 'zastavěná plocha a nádvoří',
		stavebni: true,
		cast: 'dum',
		stavba: 'dům č.p. 495',
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=3018265804',
	},
	{
		cislo: 'St. 173/4',
		vymera: 180,
		druh: 'zastavěná plocha a nádvoří',
		stavebni: true,
		cast: 'hajecek',
		poznamka: 'zastavěná plocha, stavba už nestojí',
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2196233804',
	},
	{
		cislo: 'St. 1879',
		vymera: 79,
		druh: 'zastavěná plocha a nádvoří',
		stavebni: true,
		cast: 'dum',
		stavba: 'garáž',
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=3018266804',
	},
	{
		cislo: '2260/8',
		vymera: 18794,
		druh: 'trvalý travní porost',
		stavebni: false,
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2797220804',
	},
	{
		cislo: '2338/11',
		vymera: 9175,
		druh: 'trvalý travní porost',
		stavebni: false,
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2797217804',
	},
	{
		cislo: '2290',
		vymera: 2178,
		druh: 'trvalý travní porost',
		stavebni: false,
		cast: 'hajecek',
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2200251804',
	},
	{
		cislo: '1888/18',
		vymera: 1172,
		druh: 'trvalý travní porost',
		stavebni: false,
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2797218804',
	},
	{
		cislo: '3587/5',
		vymera: 1070,
		druh: 'ostatní plocha',
		stavebni: false,
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2797219804',
	},
	{
		cislo: '3585/3',
		vymera: 284,
		druh: 'ostatní plocha',
		stavebni: false,
		cast: 'hajecek',
		poznamka: 'ostatní plocha — přístupová cesta',
		kn: 'https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2202030804',
	},
];

export const parcely: Parcela[] = udaje.map((p) => {
	const zakres = ZAKRESY[p.cislo];
	if (!zakres) throw new Error(`parcela ${p.cislo} nemá zákres — pusť node scripts/podklady.mjs`);
	return { ...p, ...zakres };
});

/*
 * Pozemek u domu — to, co se u domu a garáže skutečně prodává. Hranici tvoří
 * z většiny katastrální linie; jediná nová vede úhlopříčkou přes louku 2260/8
 * a je dlouhá 70 m. Plocha je odměřená ze zákresu, ne z katastru: vychází na
 * 3 235 m², na webu se uvádí zaokrouhlená. Rozpad po parcelách:
 * St. 1878 220 + St. 1879 79 + 2260/8 2 673 + 3587/5 204 + 1888/18 58.
 *
 * Pozor: kromě obou stavebních parcel nejde o celé parcely — pozemek kolem
 * domu se z 2260/8, 3587/5 a 1888/18 teprve oddělí geometrickým plánem.
 */
/*
 * Klíč pro provázání mapy s tabulkou. Pozemek nemá číslo parcely, protože
 * v katastru zatím není — potřebuje ale vlastní jméno, aby se na něm mapa
 * a tabulka domluvily stejně jako na parcelách. Mezera v něm zaručuje, že
 * se nesrazí s žádným katastrálním číslem.
 */
export const KLIC_POZEMKU = 'pozemek u staveb';

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
		[2030313.74, 6362046.83],
		[2030338.48, 6362055.98],
		[2030349.29, 6362072.01],
		[2030364.60, 6362080.76],
		[2030365.27, 6362088.45],
		[2030389.04, 6362090.61],
		[2030396.17, 6362094.56],
		[2030430.42, 6362043.86],
		[2030407.50, 6362003.35],
		[2030396.81, 6361984.14],
		[2030385.40, 6361966.62],
	],

	...POZEMEK_ZAKRES,
} as const;

/** Parcely, které do nabídky patří, v pořadí podle výpisu z katastru. */
const vNabidce = parcely.filter((p) => p.cast);

/**
 * Parcely jedné části nabídky. U domu jsou to jen obě stavební parcely —
 * zbytek pozemku kolem nich se z luk teprve oddělí, parcela z něj ještě není.
 */
export const proCast = (cast: Cast) => parcely.filter((p) => p.cast === cast);

const vymeraCasti = (cast: Cast) => proCast(cast).reduce((s, p) => s + p.vymera, 0);

/** Háječek se prodává jako celé parcely, jeho výměra je tedy úřední. */
export const vymeraHajecku = vymeraCasti('hajecek');

/**
 * Výměra celé nabídky: vymezený pozemek u domu (obě stavební parcely jsou
 * v něm) plus celý háječek. Pozemek u domu je odměřený, proto se i součet
 * zaokrouhluje na stovky a všude se uvádí s „≈".
 */
export const vymeraNabidky = Math.round((pozemekUDomu.vymera + vymeraHajecku) / 100) * 100;

/** Stavby v nabídce jsou celé parcely, zbytek pozemku se teprve oddělí. */
export const vymeraStaveb = vNabidce.filter((p) => p.stavebni).reduce((s, p) => s + p.vymera, 0);

/*
 * Pozemek kolem domu a garáže bez obou stavebních parcel — to, co se z luk
 * teprve oddělí. Zaokrouhleno na stovky, je to rozdíl dvou odměřených čísel.
 */
export const vymeraKolemStaveb = Math.round((pozemekUDomu.vymera - vymeraCasti('dum')) / 100) * 100;

/**
 * Výměra k zobrazení. Hektary dávají smysl až u velkých celků — z háječku
 * by zbylo „0,24 ha", proto se pod hektar zůstává u metrů.
 */
export const vymeraSlovy = (vymera: number) =>
	vymera >= 10000
		? `${(vymera / 10000).toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`
		: `${vymera.toLocaleString('cs-CZ')} m²`;
