// Údaje společné oběma nabídkám i rozcestníku.

export const spolecne = {
	// Adresní bod č.p. 495 podle RÚIAN (ČÚZK), leží na parcele St. 1878.
	souradnice: { sirka: 49.511258, delka: 18.239152 },

	katastr: { uzemi: 'Trojanovice', kod: '768499' },

	// Vzdálenosti jsou po silnici, spočítané z adresního bodu domu.
	lokalita: {
		popis:
			'Trojanovice se táhnou po severním úbočí Radhoště a dům stojí v jejich horní části, ' +
			'kde už zástavbu střídají louky a les. Hřeben s Pustevnami a Radhoštěm je odsud ' +
			'vzdušnou čarou tři kilometry a nahoru se dá vyjet lanovkou z Ráztoky, jejíž dolní ' +
			'stanice je kousek po cestě. Veškerou občanskou vybavenost — obchody, školy i vlakové ' +
			'nádraží — nabízí Frenštát pod Radhoštěm pět minut autem.',
		vzdalenosti: [
			{ misto: 'Lanovka na Pustevny (Ráztoka)', hodnota: '1 km' },
			{ misto: 'Frenštát pod Radhoštěm', hodnota: '5 km' },
			{ misto: 'Rožnov pod Radhoštěm', hodnota: '13 km' },
			{ misto: 'Letiště Ostrava-Mošnov', hodnota: '26 km' },
			{ misto: 'Ostrava', hodnota: '48 km' },
		],
	},

	kontakt: {
		jmeno: 'Jan Austerlitz',
		telefon: '+420 725 398 765',
		email: 'hausterlitz@gmail.com',
	},
};

export const telefonHref = 'tel:' + spolecne.kontakt.telefon.replace(/\s/g, '');

/*
 * Cena v celých korunách. Oddělovač tisíců, který dá Intl, se sjednocuje na
 * pevnou mezeru — jinak by se číslo mohlo zalomit uprostřed.
 */
export const cenaSlovy = (cena: number) => `${cena.toLocaleString('cs-CZ').replace(/\s/g, ' ')} Kč`;
