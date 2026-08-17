# Rozcestník a rozdělení na dvě samostatné nabídky

Datum: 2026-08-17

## Zadání

Web trojanovice495.cz dnes prezentuje dům i všech 3,32 ha pozemků jako jeden celek na
jediné stránce. Reálně jde ale o **dvě samostatné nabídky**, jak je má i tištěný banner
(`podklady/banner_trojanovice495_2550x850mm.pdf`, QR kód míří na kořen webu):

1. **Dům, garáž, zahrada**
2. **Háječek se stavebním pozemkem**

Web se má předělat tak, aby návštěvník nejdřív zvolil, která nabídka ho zajímá.

## Rozdělení parcel

Rozdělení podle katastru (k.ú. Trojanovice, kód 768499):

| Nabídka | Parcely | Výměra |
| --- | --- | --- |
| Dům | St. 1878, St. 1879, 2260/8, 2338/11, 1888/18, 3587/5, 3585/3 | 30 794 m² (3,08 ha) |
| Háječek | St. 173/4, 2290 | 2 358 m² |
| Celkem | 9 parcel | 33 152 m² (3,32 ha) |

Na St. 173/4 (180 m², vedená jako zastavěná plocha a nádvoří) **fyzicky nic nestojí** —
prodává se jako stavební pozemek s přilehlým háječkem 2290 (2 178 m², trvalý travní porost).
Na háječek zatím **nejsou žádné fotografie**, jeho stránka stojí na textu a katastrální mapě.

## Struktura webu

| URL | Soubor | Obsah |
| --- | --- | --- |
| `/` | `src/pages/index.astro` (přepsaný) | rozcestník |
| `/dum` | `src/pages/dum.astro` | dnešní obsah `index.astro`, beze změny |
| `/hajecek` | `src/pages/hajecek.astro` | nová stránka |

Každá nabídka má vlastní URL, kterou lze poslat konkrétnímu zájemci samostatně.
Zvažované alternativy — přepínač scrollující po jedné dlouhé stránce, a rozcestník
s interaktivní mapou obou nabídek — jsme zamítli: první neumožňuje poslat jednu nabídku
zvlášť, druhá duplikuje obsah podstránek a zdržuje rozhodnutí.

## Data

### `src/data/parcely.ts`

- Do `interface Parcela` přibude `nabidka: 'dum' | 'hajecek'`, vyplněná u všech devíti parcel
  podle tabulky výše.
- Přibudou helpery `proNabidku(nabidka)` (filtr) a `vymeraNabidky(nabidka)` (součet).
- `celkovaVymera` zůstává součtem přes všechny parcely (33 152 m²) — používá ho rozcestník.

### `src/data/spolecne.ts` (nový)

Vytažené z `nemovitost.ts`, protože je používají obě nabídky i rozcestník:
`kontakt`, `lokalita`, `souradnice`.

### `src/data/nemovitost.ts`

- Přijde o přesunuté části (viz výše).
- Opraví se parametry, protože St. 173/4 už do nabídky domu nepatří:
  - „Pozemky celkem" → `30 794 m² (3,08 ha)`
  - „Zastavěná plocha" → `299 m² (2 stavební parcely)`
- Perex zmiňuje 3,32 ha — přepsat na 3,08 ha.

### `src/data/hajecek.ts` (nový)

Název, podtitul, perex a `parametry`: celková výměra 2 358 m², stavební parcela 180 m²,
travní porost 2 178 m², katastrální území.

Údaje, které zatím nejsou k dispozici — inženýrské sítě, přístupová cesta, územní plán —
se zapíší jako zástupné hodnoty ve stejném stylu, jaký už v repu je (`'000 m²'`
v `nemovitost.ts`), s komentářem, že čekají na doplnění. Cena se na webu neuvádí ani
u domu, u háječku tedy také ne.

## Komponenty

### `Pozemky.astro`

Dostane povinnou prop `nabidka: 'dum' | 'hajecek'`. Podle ní filtruje tabulku parcel,
rozpisku i součty. Dnes natvrdo zapsané texty se odvodí z dat:

- nadpis `Devět parcel o celkové výměře 3,32 ha` → počet a výměra dané nabídky,
  se správným českým skloňováním číslovky („Dvě parcely", „Sedm parcel");
- `prehledPopis` a `detailPopis` — popisky pod mapami se složí z čísel parcel dané nabídky.

### `KatastralniMapa.astro`

Dostane stejnou prop. Vykresluje se dál **všech devět parcel** (kontext sousedství je
užitečný), ale ty mimo aktuální nabídku dostanou třídu `je-mimo`:

- ztlumená výplň a tenký obrys,
- bez `tabindex`, `role="button"` a `<title>`, `pointer-events: none` — nejsou klikací
  ani dosažitelné klávesnicí, takže se nedají zvýraznit ani omylem.

Oba výřezy (`prehled`, `detail`) fungují pro obě nabídky; žádné nové mapové podklady
nejsou potřeba.

## Rozcestník

1. Hero s `01-dum-a-pozemek.jpg` (varianta na výšku pro úzké displeje, jako dnes),
   h1 „Trojanovice 495".
2. Věta o tom, že se prodávají dvě samostatné nabídky.
3. Dvě karty vedle sebe, na mobilu pod sebou: pořadové číslo, název, výměra, jedna věta,
   odkaz na `/dum` resp. `/hajecek`.
4. Kontakt na majitele — kdo přišel z banneru kvůli telefonu, nemusí klikat dál.

Pořadí a názvy karet odpovídají banneru.

## Ověření

- `npm run build` projde bez chyb.
- V `astro dev` proklikat `/` → `/dum` → `/hajecek`.
- Na `/hajecek` je v obou mapách zvýrazněná pouze St. 173/4 a 2290, zbylé parcely jsou
  ztlumené a nereagují na kliknutí ani na Tab.
- Součty v tabulkách sedí na 30 794 m² a 2 358 m².
