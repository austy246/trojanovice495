// Parcely v k.u. Trojanovice (kod 768499) podle vypisu z katastru.
// Geometrie stazena z RUIAN (CUZK), souradnice jsou v soustave viewBoxu
// prislusne mapy - viz VYREZY nize. Generovano ze zakresu do katastralni mapy.

/*
 * Pozemky se prodavaji ve dvou samostatnych nabidkach. U hajecku jsou v nabidce
 * cele tri parcely; u domu se prodava jen pozemek vymezeny kolem staveb (viz
 * pozemekUDomu nize) a okolni louky jsou k dokoupeni nad ramec nabidky.
 * `nabidka` proto rika, ke ktere nabidce parcela patri - ne ze je cela na prodej.
 */
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
	// Detail je vyrez ze snimku nahlizeni do KN (880x1100 px, 1 px = 12,47 cm),
	// takze jednotka viewBoxu odpovida pixelu podkladu.
	detail: { sirka: 880, vyska: 1100, meritko: 25, meritkoPodil: 22.79 },
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
			d: "M464.8,494.4L471.2,505.8L431.4,527.8L458.2,576.1L497.8,553.7L523.1,599.0L535.7,621.3L557.9,609.1L605.6,582.1L535.1,455.4L464.8,494.4Z",
			x: 516, y: 493, fit: 42,
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
			d: "M290.0,365.5L328.2,414.5L353.1,447.5L444.4,380.0L416.1,346.4L377.4,296.7L290.0,365.5Z",
			x: 367, y: 351, fit: 52,
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
			d: "M675.3,592.1L717.1,667.0L769.0,638.0L727.1,563.0L675.3,592.1Z",
			x: 723, y: 593, fit: 30,
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
			d: "M-369.3,-798.6L-366.0,-649.2L-365.2,-352.2L-376.3,245.7L-385.4,455.7L-386.1,675.0L-383.1,910.8L-371.5,946.7L-362.1,1102.1L-320.0,1113.1L362.1,936.1L657.8,859.3L794.4,659.0L638.6,381.0L599.9,398.4L475.6,399.3L468.7,438.9L385.5,477.7L322.4,556.2L190.0,593.0L52.6,278.8L427.0,63.7L582.6,352.0L610.7,348.7L642.2,340.9L534.6,149.5L354.1,-229.8L169.7,-547.8L91.5,-526.7L58.5,-509.9L-146.7,-405.5L-162.9,-434.1L-206.3,-510.7L-283.4,-646.9L-369.3,-798.6ZM769.0,638.0L717.1,667.0L675.3,592.1L727.1,563.0L769.0,638.0ZM605.6,582.1L557.9,609.1L535.7,621.3L523.1,599.0L497.8,553.7L458.2,576.1L431.4,527.8L471.2,505.8L464.8,494.4L535.1,455.4L605.6,582.1Z",
			x: 170, y: 810, fit: 328,
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
			d: "M440.5,1338.1L744.2,1691.3L901.3,1874.1L951.6,1932.4L994.5,1923.7L1305.8,1953.2L1221.4,1411.9L968.1,934.6L826.9,680.1L535.0,1130.2L470.5,1229.6L440.5,1338.1Z",
			x: 810, y: 1299, fit: 306,
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
			d: "M328.2,414.5L290.0,365.5L377.4,296.7L416.1,346.4L582.6,352.0L427.0,63.7L52.6,278.8L190.0,593.0L322.4,556.2L385.5,477.7L468.7,438.9L475.6,399.3L599.9,398.4L638.6,381.0L444.4,380.0L353.1,447.5L328.2,414.5Z",
			x: 188, y: 318, fit: 101,
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
			d: "M594.0,954.5L450.4,992.6L-129.6,1146.8L-7.2,1169.2L107.4,1178.4L329.5,1199.0L422.9,1191.9L507.5,1074.5L594.0,954.5Z",
			x: 330, y: 1075, fit: 87,
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
			d: "M-320.0,1113.1L-129.6,1146.8L450.4,992.6L594.0,954.5L657.8,859.3L362.1,936.1L-320.0,1113.1Z",
			x: 328, y: 985, fit: 39,
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
			d: "M582.6,352.0L416.1,346.4L444.4,380.0L638.6,381.0L794.4,659.0L817.4,627.0L642.2,340.9L610.7,348.7L582.6,352.0Z",
			x: 790, y: 618, fit: 16,
		},
	},
];

/*
 * Pozemek u domu - to, co se u nabidky (1) skutecne prodava. Hranici tvori
 * z vetsiny katastralni linie; jedina nova vede uhloprickou pres louku 2260/8
 * a je dlouha 70 m. Plocha je odmerena ze zakresu, ne z katastru: vychazi na
 * 3 235 m2, na webu se uvadi zaokrouhlena. Rozpad po parcelach:
 * St. 1878 220 + St. 1879 79 + 2260/8 2 673 + 3587/5 204 + 1888/18 58.
 *
 * Pozor: krome obou stavebnich parcel nejde o cele parcely - pozemek kolem
 * domu se z 2260/8, 3587/5 a 1888/18 teprve oddeli geometrickym planem.
 */
export const pozemekUDomu = {
	/** zaokrouhleno na stovky - zdroj je zakres, ne geometricky plan */
	vymera: 3200,
	/** delka nove vyznacene hranice v metrech */
	delka: 70,
	/** parcely, ze kterych se pozemek kolem staveb oddeli */
	zParcel: ["2260/8", "3587/5", "1888/18"],
	// Prvni a posledni bod obrysu jsou konce nove vyznacene hranice - jedine
	// strany pozemku bez opory v katastru.
	prehled: {
		d: "M789.0,633.9L840.8,614.7L863.5,581.1L895.6,562.7L897.0,546.6L946.8,542.1L961.7,533.8L1033.5,640.1L985.5,725.0L963.1,765.3L939.3,801.8Z",
	},
	detail: {
		d: "M190.0,593.0L322.4,556.2L385.5,477.7L468.7,438.9L475.6,399.3L599.9,398.4L638.6,381.0L794.4,659.0L657.8,859.3L594.0,954.5L527.5,1040.0Z",
	},
} as const;

export const celkovaVymera = parcely.reduce((s, p) => s + p.vymera, 0);

/** Parcely jedne nabidky, v poradi podle vypisu z katastru. */
export const proNabidku = (nabidka: Nabidka) => parcely.filter((p) => p.nabidka === nabidka);

export const vymeraNabidky = (nabidka: Nabidka) =>
	proNabidku(nabidka).reduce((s, p) => s + p.vymera, 0);

/**
 * Co nabidka skutecne obsahuje. U hajecku jsou to cele parcely, u domu jen
 * vymezeny pozemek - okolni louky se k nemu daji dokoupit, ale soucasti
 * nabidky nejsou.
 */
export const vymeraVNabidce = (nabidka: Nabidka) =>
	nabidka === "dum" ? pozemekUDomu.vymera : vymeraNabidky(nabidka);

/** Louky kolem domu, ktere jsou k dokoupeni nad ramec nabidky. */
export const vymeraKDokoupeni = vymeraNabidky("dum") - pozemekUDomu.vymera;

/** Stavby v nabidce jsou cele parcely, zbytek pozemku se teprve oddeli. */
export const vymeraStaveb = proNabidku("dum")
	.filter((p) => p.stavebni)
	.reduce((s, p) => s + p.vymera, 0);

/**
 * Vymera k zobrazeni. Hektary davaji smysl az u velkych celku - z hajecku
 * by zbylo "0,24 ha", proto se pod hektar zustava u metru.
 */
export const vymeraSlovy = (vymera: number) =>
	vymera >= 10000
		? `${(vymera / 10000).toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`
		: `${vymera.toLocaleString("cs-CZ")} m²`;
