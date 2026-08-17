// Parcely v k.u. Trojanovice (kod 768499) podle vypisu z katastru.
// Geometrie stazena z RUIAN (CUZK), souradnice jsou v soustave viewBoxu
// prislusne mapy - viz VYREZY nize. Generovano ze zakresu do katastralni mapy.

/** Pozemky se prodavaji ve dvou samostatnych nabidkach. */
export type Nabidka = "dum" | "hajecek";

export interface Parcela {
	cislo: string;
	vymera: number;
	druh: string;
	stavebni: boolean;
	nabidka: Nabidka;
	/** co na stavebni parcele stoji; chybi, kdyz je parcela volna */
	stavba?: string;
	kn: string;
	prehled: Zakres;
	detail: Zakres;
}

export interface Zakres {
	/** SVG path parcely */
	d: string;
	/** stred popisku */
	x: number;
	y: number;
	/** sirka parcely v jednotkach viewBoxu - popisek se skryje, kdyz se nevejde */
	fit: number;
}

export const VYREZY = {
	prehled: { sirka: 1800, vyska: 1240, meritko: 100, meritkoPodil: 17.93 },
	detail: { sirka: 1200, vyska: 900, meritko: 25, meritkoPodil: 16.67 },
} as const;

export const parcely: Parcela[] = [
	{
		cislo: "St. 1878",
		vymera: 220,
		druh: "zastavěná plocha a nádvoří",
		stavebni: true,
		nabidka: "dum",
		stavba: "dům č.p. 495",
		kn: "https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=3018265804",
		prehled: {
			d: "M895.8,585.1L898.8,589.5L883.6,599.6L895.9,618.1L911.0,607.8L922.7,625.1L928.5,633.6L937.0,628.0L955.2,615.5L922.7,567.1L895.8,585.1Z",
			x: 917, y: 591, fit: 17,
		},
		detail: {
			d: "M470.9,393.9L478.2,404.7L440.5,429.8L471.1,475.6L508.6,450.1L537.5,493.0L551.9,514.1L572.9,500.1L618.1,469.3L537.5,349.3L470.9,393.9Z",
			x: 523, y: 410, fit: 42,
		},
	},
	{
		cislo: "St. 173/4",
		vymera: 180,
		druh: "zastavěná plocha a nádvoří",
		stavebni: true,
		nabidka: "hajecek",
		kn: "https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2196233804",
		prehled: {
			d: "M821.4,539.3L838.4,557.6L849.5,570.0L883.8,539.9L871.4,527.4L854.2,508.8L821.4,539.3Z",
			x: 853, y: 539, fit: 21,
		},
		detail: {
			d: "M286.5,280.3L328.5,325.8L356.0,356.5L441.1,281.9L410.2,250.8L367.6,204.7L286.5,280.3Z",
			x: 364, y: 281, fit: 52,
		},
	},
	{
		cislo: "St. 1879",
		vymera: 79,
		druh: "zastavěná plocha a nádvoří",
		stavebni: true,
		nabidka: "dum",
		stavba: "garáž",
		kn: "https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=3018266804",
		prehled: {
			d: "M983.5,617.2L1002.8,645.9L1022.6,632.5L1003.3,603.8L983.5,617.2Z",
			x: 1003, y: 625, fit: 12,
		},
		detail: {
			d: "M688.2,473.5L735.9,544.5L785.1,511.3L737.2,440.3L688.2,473.5Z",
			x: 737, y: 492, fit: 30,
		},
	},
	{
		cislo: "2260/8",
		vymera: 18794,
		druh: "trvalý travní porost",
		stavebni: false,
		nabidka: "dum",
		kn: "https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2797220804",
		prehled: {
			d: "M518.1,94.6L524.4,154.4L534.7,273.5L550.2,513.6L553.6,598.1L560.7,686.0L569.8,780.5L575.7,794.5L584.6,856.5L601.9,859.5L869.4,765.7L985.5,725.0L1033.5,640.1L961.7,533.8L946.8,542.1L896.9,546.6L895.6,562.7L863.5,581.1L840.8,614.7L788.9,633.9L723.3,512.4L866.3,413.7L938.3,524.1L949.5,521.8L961.8,517.6L912.3,444.5L827.2,298.4L742.6,177.1L711.9,188.2L699.3,196.0L620.5,244.7L613.0,233.8L593.1,204.6L557.6,152.5L518.1,94.6ZM1022.6,632.5L1002.8,645.9L983.5,617.2L1003.3,603.8L1022.6,632.5ZM955.2,615.5L937.0,628.0L928.5,633.6L922.7,625.1L911.0,607.8L895.9,618.1L883.6,599.6L898.8,589.5L895.8,585.1L922.7,567.1L955.2,615.5Z",
			x: 690, y: 375, fit: 132,
		},
		detail: {
			d: "M-465.3,-821.8L-449.6,-673.6L-424.2,-378.5L-385.6,216.6L-377.2,426.0L-359.7,644.0L-337.1,878.1L-322.6,912.8L-300.4,1066.4L-257.6,1073.8L405.5,841.3L693.0,740.5L812.1,530.1L634.2,266.8L597.2,287.3L473.7,298.5L470.2,338.4L390.7,383.9L334.5,467.1L206.0,514.7L43.4,213.8L397.6,-31.0L576.1,242.6L603.8,237.0L634.4,226.6L511.6,45.3L300.8,-316.6L91.1,-617.3L15.2,-589.8L-16.2,-570.4L-211.5,-449.6L-230.0,-476.7L-279.4,-549.2L-367.4,-678.2L-465.3,-821.8ZM785.1,511.3L735.9,544.5L688.2,473.5L737.2,440.3L785.1,511.3ZM618.1,469.3L572.9,500.1L551.9,514.1L537.5,493.0L508.6,450.1L471.1,475.6L440.5,429.8L478.2,404.7L470.9,393.9L537.5,349.3L618.1,469.3Z",
			x: -39, y: -127, fit: 327,
		},
	},
	{
		cislo: "2338/11",
		vymera: 9175,
		druh: "trvalý travní porost",
		stavebni: false,
		nabidka: "dum",
		kn: "https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2797217804",
		prehled: {
			d: "M914.4,924.2L1048.0,1055.7L1117.1,1123.7L1139.2,1145.4L1156.1,1140.5L1281.9,1141.9L1229.9,927.6L1112.4,744.7L1047.2,647.5L945.3,837.7L922.8,879.7L914.4,924.2Z",
			x: 1061, y: 896, fit: 123,
		},
		detail: {
			d: "M516.8,1234.3L847.9,1560.1L1019.2,1728.7L1074.0,1782.5L1115.9,1770.3L1427.7,1773.7L1298.9,1242.8L1007.6,789.5L846.1,548.4L593.4,1019.9L537.6,1124.0L516.8,1234.3Z",
			x: 881, y: 1165, fit: 305,
		},
	},
	{
		cislo: "2290",
		vymera: 2178,
		druh: "trvalý travní porost",
		stavebni: false,
		nabidka: "hajecek",
		kn: "https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2200251804",
		prehled: {
			d: "M838.4,557.6L821.4,539.3L854.2,508.8L871.4,527.4L938.3,524.1L866.3,413.7L723.3,512.4L788.9,633.9L840.8,614.7L863.5,581.1L895.6,562.7L896.9,546.6L946.8,542.1L961.7,533.8L883.8,539.9L849.5,570.0L838.4,557.6Z",
			x: 779, y: 524, fit: 41,
		},
		detail: {
			d: "M328.5,325.8L286.5,280.3L367.6,204.7L410.2,250.8L576.1,242.6L397.6,-31.0L43.4,213.8L206.0,514.7L334.5,467.1L390.7,383.9L470.2,338.4L473.7,298.5L597.2,287.3L634.2,266.8L441.1,281.9L356.0,356.5L328.5,325.8Z",
			x: 181, y: 242, fit: 101,
		},
	},
	{
		cislo: "1888/18",
		vymera: 1172,
		druh: "trvalý travní porost",
		stavebni: false,
		nabidka: "dum",
		kn: "https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2797218804",
		prehled: {
			d: "M963.1,765.3L906.7,785.4L679.4,866.6L729.2,871.5L775.4,871.3L865.2,872.2L902.4,866.2L932.4,816.3L963.1,765.3Z",
			x: 878, y: 833, fit: 35,
		},
		detail: {
			d: "M637.5,840.4L497.9,890.2L-65.6,1091.5L57.9,1103.6L172.5,1103.3L394.9,1105.3L487.2,1090.5L561.5,966.8L637.5,840.4Z",
			x: 427, y: 1008, fit: 87,
		},
	},
	{
		cislo: "3587/5",
		vymera: 1070,
		druh: "ostatní plocha",
		stavebni: false,
		nabidka: "dum",
		kn: "https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2797219804",
		prehled: {
			d: "M601.9,859.5L679.4,866.6L906.7,785.4L963.1,765.3L985.5,725.0L869.4,765.7L601.9,859.5Z",
			x: 858, y: 786, fit: 16,
		},
		detail: {
			d: "M-257.6,1073.8L-65.6,1091.5L497.9,890.2L637.5,840.4L693.0,740.5L405.5,841.3L-257.6,1073.8Z",
			x: 376, y: 893, fit: 39,
		},
	},
	{
		cislo: "3585/3",
		vymera: 284,
		druh: "ostatní plocha",
		stavebni: false,
		nabidka: "hajecek",
		kn: "https://nahlizenidokn.cuzk.gov.cz/ZobrazObjekt.aspx?typ=parcela&id=2202030804",
		prehled: {
			d: "M938.3,524.1L871.4,527.4L883.8,539.9L961.7,533.8L1033.5,640.1L1041.7,626.5L961.8,517.6L949.5,521.8L938.3,524.1Z",
			x: 1030, y: 624, fit: 6,
		},
		detail: {
			d: "M576.1,242.6L410.2,250.8L441.1,281.9L634.2,266.8L812.1,530.1L832.3,496.4L634.4,226.6L603.8,237.0L576.1,242.6Z",
			x: 804, y: 490, fit: 16,
		},
	},
];

export const celkovaVymera = parcely.reduce((s, p) => s + p.vymera, 0);

/** Parcely jedne nabidky, v poradi podle vypisu z katastru. */
export const proNabidku = (nabidka: Nabidka) => parcely.filter((p) => p.nabidka === nabidka);

export const vymeraNabidky = (nabidka: Nabidka) =>
	proNabidku(nabidka).reduce((s, p) => s + p.vymera, 0);

/**
 * Vymera k zobrazeni. Hektary davaji smysl az u velkych celku - z hajecku
 * by zbylo "0,24 ha", proto se pod hektar zustava u metru.
 */
export const vymeraSlovy = (vymera: number) =>
	vymera >= 10000
		? `${(vymera / 10000).toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`
		: `${vymera.toLocaleString("cs-CZ")} m²`;
