/*
 * Schémata podlaží pro sekci Rozlohy místností — zjednodušený půdorys, jaký
 * bývá v realitních nabídkách. Místnosti jsou obkreslené ručně z půdorysů
 * (přízemí podklady/pudorys/01-pudorys-prizemi.webp, 1415 × 1282 px; podkroví
 * podklady/pudorys/03-pudorys-podkrovi.webp, 1777 × 1567 px) a každé schéma stojí
 * v pixelových souřadnicích svého skenu, aby se dalo proti němu kdykoli
 * zkontrolovat: `npm run pudorys` (přízemí) nebo `npm run pudorys -- podkrovi`
 * vykreslí polygony přes sken do podklady/pudorys-kontrola*.png.
 *
 * V projektu je i list „PŮDORYS 2.NP“ (V1-06-03) s jinými plochami místností;
 * schéma i rozpis ploch vycházejí z listu „podkroví“. Skeny se na webu
 * neukazují, kde se rozcházejí se skutečností, platí slovo majitele.
 *
 * Kreslí se vnitřní líce stěn. Stěny vznikají samy: pod místnostmi leží tmavý
 * obrys domu po vnějším líci a co mezi světlými plochami místností zbude,
 * je zeď. Dvě místnosti, mezi kterými zeď není (jídelní a obytná hala),
 * proto sdílejí hranu přesně. Dveře jsou otvory vyříznuté do zdí, s křídlem
 * a obloukem na tu stranu, kam se otvírají; posuvné mají křídlo vedle zdi
 * (nebo kapsu ve zdi, když do ní zajíždějí), pevné zasklení tenkou čáru
 * v ose zdi a pouhý průchod nemá nic. Okna jsou světlé pruhy v obvodové zdi
 * s čarou skla uprostřed.
 *
 * Názvy a plochy místností se sem neopisují, berou se z rozpisu
 * v nemovitost.ts podle čísla místnosti. Terasy v rozpisu nejsou, ty si
 * popisek nesou tady; terasa 1.15 je jen v projektu, postavená není.
 */

export type Bod = [number, number];

/*
 * Kam míří vrch výkresů: azimut ve stupních. Z obrysu stavební parcely
 * v mapě (EPSG:3857) má dlouhá strana domu azimut 146° a křídlo s obytnou
 * halou vybíhá na jihozápad (236°); vrch výkresu, kde je vstup, tedy míří
 * na severovýchod. Sever je na výkresu o tolik stupňů doleva od svislice.
 */
export const AZIMUT_VRCHU = 56;

export interface MistnostSchematu {
	/** číslo místnosti podle legendy výkresu, klíč do rozpisu ploch */
	cislo: string;
	/** vnitřní líc stěn, po směru hodinových ručiček */
	body: Bod[];
	/** střed popisku; těžiště by u členitých místností padlo do kouta */
	popisek: Bod;
	/** místnost je tak malá, že se do ní vejde jen číslo */
	jenCislo?: boolean;
}

export interface TerasaSchematu extends MistnostSchematu {
	nazev: string;
	/** projekt vyčísluje jen terasu 1.14 */
	plocha?: number;
	/** jen čárkovaný obrys bez popisku (terasa v podkroví drží obrys domu, popisek má v přízemí) */
	jenObrys?: boolean;
}

export interface DvereSchematu {
	/** otvor ve zdi na její ose: od závěsu k druhé zárubni */
	od: Bod;
	do: Bod;
	/** na kterou stranu od směru od→do se křídlo otvírá (u posuvných kde leží) */
	strana?: 'vlevo' | 'vpravo';
	/**
	 * křídlové s obloukem, posuvné s křídlem vedle zdi, průchod bez dveří,
	 * nebo pevné zasklení — tenká čára v ose zdi
	 */
	typ?: 'kridlove' | 'posuvne' | 'otvor' | 'pevne';
	/** síla zdi, aby otvor prošel skrz; vnitřní zdi mají 12, obvodové 30 */
	sila?: number;
	/** posuvné křídlo zajíždí do kapsy ve zdi za druhou zárubní, ne podél zdi */
	doZdi?: boolean;
}

export interface OknoSchematu {
	/** okno na ose obvodové zdi, od jedné špalety ke druhé */
	od: Bod;
	do: Bod;
	/** síla zdi; obvodové mají 30 */
	sila?: number;
}

export interface KrbSchematu {
	/** těleso krbu: levý horní roh, šířka a hloubka, kterou vystupuje do místnosti */
	x: number;
	y: number;
	sirka: number;
	hloubka: number;
	/** poloměr půlkruhového ohniště před krbem */
	ohniste: number;
}

export interface OtvorSchematu {
	/** otvor v podlaze, kterým je vidět do podlaží pod ním; kreslí se šrafou */
	body: Bod[];
	popisek: Bod;
	/** řádky popisku */
	radky: string[];
}

export interface ProstorSchematu {
	/**
	 * prostor, který výkres nečísluje a v rozpisu ploch není (komora);
	 * kreslí se jako místnost, ale nezvýrazňuje se a nese jen název
	 */
	nazev: string;
	body: Bod[];
	popisek: Bod;
}

export interface ObdelnikSchematu {
	x: number;
	y: number;
	sirka: number;
	vyska: number;
}

export interface PudorysSchema {
	/** výřez schématu v souřadnicích skenu: x, y, šířka, výška */
	viewBox: [number, number, number, number];
	/** vnější líc obvodových stěn */
	obrys: Bod[];
	mistnosti: MistnostSchematu[];
	terasy: TerasaSchematu[];
	dvere: DvereSchematu[];
	okna: OknoSchematu[];
	krb?: KrbSchematu;
	/** schodiště: obdélník a počet stupňů, kreslí se jako pruhy */
	schodiste: { x: number; y: number; sirka: number; vyska: number; stupnu: number };
	/** kde se vchází: bod na vnějším líci a popisek nad ním; podkroví vstup nemá */
	vstup?: { x: number; y: number };
	/** otvory v podlaze do nižšího podlaží (galerie nad halou) */
	otvory?: OtvorSchematu[];
	/** prostory bez čísla místnosti */
	prostory?: ProstorSchematu[];
	/** střešní okna: čárkovaný obdélník v ploše místnosti */
	stresniOkna?: ObdelnikSchematu[];
	/** vestavěné skříně: tenký obrys s úhlopříčkou */
	skrine?: ObdelnikSchematu[];
	/** směrová růžice: střed a poloměr; natočení dává AZIMUT_VRCHU */
	ruzice: { x: number; y: number; polomer: number };
}

export const prizemi: PudorysSchema = {
	viewBox: [250, 90, 1140, 1050],

	obrys: [
		[291, 180],
		[1344, 180],
		[1344, 600],
		[1164, 600],
		[1164, 770],
		[799, 770],
		[799, 1096],
		[383, 1096],
		[383, 770],
		[291, 770],
	],

	mistnosti: [
		{
			cislo: '1.01',
			body: [
				[608, 210],
				[756, 210],
				[756, 375],
				[608, 375],
			],
			popisek: [682, 325],
		},
		{
			cislo: '1.02',
			body: [
				[608, 387],
				[756, 387],
				[756, 401],
				[828, 473],
				[1004, 473],
				[1004, 538],
				[608, 538],
			],
			popisek: [682, 462],
		},
		{
			cislo: '1.03',
			body: [
				[608, 551],
				[1139, 551],
				[1139, 744],
				[771, 744],
				[771, 757],
				[608, 757],
			],
			popisek: [910, 655],
		},
		{
			cislo: '1.04',
			body: [
				[409, 757],
				[771, 757],
				[771, 1066],
				[409, 1066],
			],
			popisek: [590, 915],
		},
		{
			cislo: '1.05',
			body: [
				[1084, 368],
				[1314, 368],
				[1314, 576],
				[1164, 576],
				[1164, 551],
				[1016, 551],
				[1016, 434],
			],
			popisek: [1190, 475],
		},
		{
			cislo: '1.06',
			body: [
				[1181, 210],
				[1314, 210],
				[1314, 356],
				[1181, 356],
			],
			popisek: [1248, 285],
		},
		{
			cislo: '1.07',
			body: [
				[945, 210],
				[1169, 210],
				[1169, 356],
				[1076, 356],
				[1004, 428],
				[1004, 461],
				[945, 461],
			],
			popisek: [1045, 305],
		},
		{
			cislo: '1.08',
			/* levý dolní roh je šikmo useklý — v šikmé stěně jsou dveře z haly */
			body: [
				[768, 210],
				[933, 210],
				[933, 461],
				[833, 461],
				[768, 396],
			],
			popisek: [850, 335],
		},
		{
			cislo: '1.09',
			body: [
				[316, 551],
				[595, 551],
				[595, 744],
				[316, 744],
			],
			popisek: [455, 650],
		},
		{
			cislo: '1.10',
			body: [
				[316, 402],
				[497, 402],
				[497, 538],
				[316, 538],
			],
			popisek: [406, 472],
		},
		{
			cislo: '1.11',
			body: [
				[316, 210],
				[497, 210],
				[497, 392],
				[316, 392],
			],
			popisek: [406, 300],
		},
		{
			cislo: '1.12',
			body: [
				[509, 402],
				[595, 402],
				[595, 538],
				[509, 538],
			],
			popisek: [552, 505],
			jenCislo: true,
		},
		{
			cislo: '1.13',
			body: [
				[509, 210],
				[595, 210],
				[595, 392],
				[509, 392],
			],
			popisek: [552, 355],
			jenCislo: true,
		},
	],

	terasy: [
		{
			cislo: '1.14',
			nazev: 'Terasa',
			plocha: 10.2,
			body: [
				[1164, 600],
				[1344, 600],
				[1344, 770],
				[1164, 770],
			],
			popisek: [1254, 688],
		},
		{
			cislo: '1.15',
			/* v projektu je, postavená není */
			nazev: 'Plánovaná terasa',
			body: [
				[799, 770],
				[1164, 770],
				[1164, 1096],
				[799, 1096],
			],
			popisek: [981, 935],
		},
	],

	/*
	 * Kam se která křídla otvírají, sken ukazuje jen u některých dveří;
	 * u ostatních je zvolený obvyklý směr — dovnitř menší místnosti.
	 */
	dvere: [
		// vchod do zádveří, obvodová zeď
		{ od: [700, 195], do: [615, 195], strana: 'vlevo', sila: 30 },
		// zádveří → vstupní hala: posuvné, křídlo se odsouvá podél zdi na straně haly
		{ od: [612, 381], do: [668, 381], strana: 'vpravo', typ: 'posuvne' },
		// zádveří → technické zázemí
		{ od: [601, 266], do: [601, 322], strana: 'vpravo' },
		// vstupní hala → koupelna 1.12
		{ od: [601, 462], do: [601, 414], strana: 'vlevo' },
		// šatna → koupelna 1.11
		{ od: [382, 397], do: [430, 397], strana: 'vlevo' },
		// šatna → ložnice
		{ od: [382, 545], do: [430, 545], strana: 'vpravo' },
		// jídelní hala → ložnice, u paty schodiště
		{ od: [601, 608], do: [601, 560], strana: 'vlevo' },
		// vstupní hala → pracovna, v šikmé stěně
		{ od: [780, 417], do: [814, 451], strana: 'vlevo' },
		// vstupní hala → pokoj 1.07
		{ od: [948, 467], do: [996, 467], strana: 'vlevo' },
		// kuchyň → spíž
		{ od: [1229, 362], do: [1265, 362], strana: 'vlevo' },
		// vstupní hala → kuchyň
		{ od: [1010, 489], do: [1010, 538], strana: 'vlevo' },
		// vstupní hala ↔ jídelní hala: posuvné dveře hned vedle krbu, křídlo
		// zajíždí do zdi za krbem. Čárkovaná čára ve skenu podél celé zdi je
		// hrana galerie nad halou, ne otvor.
		{ od: [680, 545], do: [748, 545], typ: 'posuvne', doZdi: true },
		// kuchyň → terasa 1.14: sklo přes celou jižní zeď kuchyně, od zdi jídelny
		// po obvodovou zeď; západní půlka se odsouvá dovnitř před východní,
		// která je pevně zasklená
		{ od: [1164, 588], do: [1239, 588], strana: 'vlevo', typ: 'posuvne', sila: 30 },
		{ od: [1239, 588], do: [1314, 588], typ: 'pevne', sila: 30 },
		// obytná hala → plánovaná terasa: velké posuvné dveře, jižní půlka
		// se odsouvá dovnitř před severní půlku, která je pevně zasklená
		{ od: [785, 930], do: [785, 870], strana: 'vlevo', typ: 'posuvne', sila: 30 },
		{ od: [785, 870], do: [785, 810], typ: 'pevne', sila: 30 },
	],

	/* Okna jen v obytných místnostech, kuchyni a koupelně; technické zázemí,
	 * spíž a zádveří je ve schématu nemají, i když ve skenu jsou. */
	okna: [
		// koupelna 1.11, pracovna a pokoj: severní zeď
		{ od: [395, 195], do: [450, 195] },
		{ od: [808, 195], do: [876, 195] },
		{ od: [1000, 195], do: [1118, 195] },
		// ložnice: západní zeď
		{ od: [303, 572], do: [303, 699] },
		// obytná hala: dvě okna v jižní zdi
		{ od: [485, 1081], do: [550, 1081] },
		{ od: [632, 1081], do: [705, 1081] },
		// jídelní hala: jižní a východní zeď
		{ od: [968, 757], do: [1090, 757] },
		{ od: [1151, 575], do: [1151, 705] },
		// kuchyň: východní zeď (jižní zeď je prosklená posuvnými dveřmi)
		{ od: [1329, 407], do: [1329, 530] },
	],

	/* krbová vložka ve zdi mezi halou a jídelnou, ohniště vystupuje do jídelny */
	krb: { x: 765, y: 551, sirka: 85, hloubka: 31, ohniste: 45 },

	/*
	 * Vestavěné skříně v šatně 1.10: dvě, každá po celé délce západní
	 * a východní stěny (podle majitele; výkres kreslí čtyři kusy po stranách
	 * dveří v severní a jižní stěně, tak to není). Hloubka 0,6 m je odhad.
	 */
	skrine: [
		{ x: 316, y: 402, sirka: 35, vyska: 136 },
		{ x: 462, y: 402, sirka: 35, vyska: 136 },
	],

	schodiste: { x: 608, y: 556, sirka: 60, vyska: 201, stupnu: 11 },

	vstup: { x: 655, y: 180 },

	/* pravý dolní roh, vedle plánované terasy */
	ruzice: { x: 1305, y: 1045, polomer: 42 },
};

/*
 * Podkroví. Obrys je stejný jako v přízemí, aby obě schémata vedle sebe
 * seděla na sebe: jižní křídlo ale v podkroví podlahu nemá, obytná hala je
 * otevřená až do krovu, a kreslí se proto jako otvor se šrafou, stejně jako
 * otvor galerie nad jídelní halou u krbu. Plánovaná terasa drží čárkovaný
 * obrys bez popisku; krytá terasa 1.14 je pod podlahou pokoje 2.04, v podkroví
 * není co kreslit. Sken je ohnutý v přehybu (kolem x 1010), kóty vpravo od
 * něj tedy vůči pixelům trochu plavou.
 *
 * Co je ve výkresu jasné: pět místností z legendy, otvor v podlaze galerie
 * nad jídelní halou, schodiště přicházející z jihu, dvě střešní okna nad
 * galerií a čtyři okna ve štítových zdech. Kde se výkres a skutečnost
 * rozcházejí (koupelna, hranice pokojů 2.03 a 2.04, vestavěné skříně, které
 * výkres kreslí a ve skutečnosti nejsou), platí slovo majitele a je to
 * poznamenáno u položky.
 */
export const podkrovi: PudorysSchema = {
	/*
	 * Výřez je výřez přízemí zvětšený 1,125× (o tolik je sken podkroví větší)
	 * a posunutý tak, aby severní i západní líc domu ležely na stejném místě.
	 * Obě schémata pak mají při stejné šířce stejnou výšku a domy se kryjí.
	 */
	viewBox: [238, 146, 1282, 1181],

	obrys: [
		[284, 247],
		[1464, 247],
		[1464, 913],
		[860, 913],
		[860, 1283],
		[390, 1283],
		[390, 913],
		[284, 913],
	],

	mistnosti: [
		{
			cislo: '2.01',
			/* galerie včetně chodbičky k pokojům a schodiště; jižní hrana nad
			 * otvorem do haly je zábradlí */
			body: [
				[640, 275],
				[985, 275],
				[985, 507],
				[1078, 507],
				[1078, 650],
				[700, 650],
				[700, 885],
				[640, 885],
			],
			popisek: [812, 470],
		},
		{
			cislo: '2.02',
			/* přes celou hloubku domu, koupelna z něj vykusuje obdélník v severovýchodním rohu */
			body: [
				[312, 275],
				[466, 275],
				[466, 506],
				[625, 506],
				[625, 885],
				[312, 885],
			],
			popisek: [445, 690],
		},
		{
			cislo: '2.03',
			/* výklenek u chodbičky (x 1000–1078) není od pokoje oddělený zdí.
			 * Příčka k pokoji 2.04 uskakuje: pás, který výkres kreslí jako
			 * vestavěné skříně, je u okna součást tohoto pokoje, u dveří
			 * pokoje 2.04 (podle majitele; skříně tam nejsou) */
			body: [
				[1000, 275],
				[1436, 275],
				[1436, 600],
				[1266, 600],
				[1266, 550],
				[1094, 550],
				[1094, 490],
				[1000, 490],
			],
			popisek: [1240, 420],
		},
		{
			cislo: '2.04',
			/* tvar L: výkres kreslí u otvoru do haly samostatnou místnost bez čísla,
			 * podle majitele je to součást pokoje a jediný vchod vede z chodbičky
			 * u galerie. Výřez v jihozápadním rohu je komín. */
			body: [
				[1094, 562],
				[1254, 562],
				[1254, 612],
				[1436, 612],
				[1436, 885],
				[950, 885],
				[950, 700],
				[978, 700],
				[978, 660],
				[1094, 660],
			],
			popisek: [1265, 760],
		},
		{
			cislo: '2.05',
			/* obdélník včetně sprchového koutu, který výkres kreslí zvlášť
			 * (podle majitele). Severní hranice je odhad: čára na y 340 ve
			 * skenu je spíš linie střechy než zeď, koupelna jde k obvodové zdi */
			body: [
				[478, 275],
				[625, 275],
				[625, 494],
				[478, 494],
			],
			popisek: [551, 372],
		},
	],

	terasy: [
		{
			cislo: '1.15',
			nazev: 'Plánovaná terasa',
			jenObrys: true,
			body: [
				[860, 913],
				[1246, 913],
				[1246, 1283],
				[860, 1283],
			],
			popisek: [1053, 1098],
		},
	],

	otvory: [
		// galerie nad jídelní halou, nad krbem
		{
			body: [
				[706, 656],
				[935, 656],
				[935, 885],
				[706, 885],
			],
			popisek: [820, 760],
			radky: ['Otevřeno dolů', 'do jídelní haly'],
		},
		// jižní křídlo: obytná hala je otevřená až do krovu; s otvorem nad
		// jídelnou se spojuje mezerou vedle schodiště, kde zeď mezi halami nesahá
		// do podkroví
		{
			body: [
				[706, 885],
				[805, 885],
				[805, 913],
				[835, 913],
				[835, 1255],
				[415, 1255],
				[415, 913],
				[706, 913],
			],
			popisek: [625, 1075],
			radky: ['Otevřeno dolů', 'do obytné haly,', 'strop až do krovu'],
		},
	],

	/* směr otvírání je ze skenu čitelný u všech čtyř dveří */
	dvere: [
		// galerie → pokoj 2.02, křídlo do pokoje
		{ od: [632, 514], do: [632, 558], strana: 'vpravo' },
		// galerie → koupelna, křídlo do koupelny
		{ od: [632, 458], do: [632, 410], strana: 'vlevo' },
		// chodbička → pokoj 2.03, křídlo do pokoje
		{ od: [1010, 498], do: [1065, 498], strana: 'vlevo' },
		// chodbička → pokoj 2.04, křídlo do pokoje
		{ od: [1010, 655], do: [1065, 655], strana: 'vpravo' },
	],

	/* okna ve štítových zdech; polohy odečtené ze skenu, výšky parapetů neřeší */
	okna: [
		// pokoj 2.02: západní zeď
		{ od: [298, 469], do: [298, 534], sila: 28 },
		{ od: [298, 630], do: [298, 694], sila: 28 },
		// pokoj 2.03 a 2.04: východní zeď
		{ od: [1450, 452], do: [1450, 522], sila: 28 },
		{ od: [1450, 620], do: [1450, 687], sila: 28 },
	],

	/* dvě střešní okna 800 × 1400 v severní střeše nad galerií */
	stresniOkna: [
		{ x: 792, y: 292, sirka: 58, vyska: 58 },
		{ x: 860, y: 292, sirka: 62, vyska: 58 },
	],

	/* schodiště přichází zdola z jihu, výstup je u galerie */
	schodiste: { x: 645, y: 700, sirka: 55, vyska: 185, stupnu: 12 },

	/* na stejném místě jako v přízemí, přepočteno 1,125× */
	ruzice: { x: 1425, y: 1220, polomer: 47 },
};
