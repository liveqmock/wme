require({cache:{
'dijit/form/nls/hu/validate':function(){
define(
"dijit/form/nls/hu/validate", //begin v1.x content
({
	invalidMessage: "A megadott érték érvénytelen.",
	missingMessage: "Meg kell adni egy értéket.",
	rangeMessage: "Az érték kívül van a megengedett tartományon."
})
//end v1.x content
);

},
'dijit/_editor/nls/hu/commands':function(){
define(
"dijit/_editor/nls/hu/commands", //begin v1.x content
({
	'bold': 'Félkövér',
	'copy': 'Másolás',
	'cut': 'Kivágás',
	'delete': 'Törlés',
	'indent': 'Behúzás',
	'insertHorizontalRule': 'Vízszintes vonalzó',
	'insertOrderedList': 'Számozott lista',
	'insertUnorderedList': 'Felsorolásjeles lista',
	'italic': 'Dőlt',
	'justifyCenter': 'Középre igazítás',
	'justifyFull': 'Sorkizárás',
	'justifyLeft': 'Balra igazítás',
	'justifyRight': 'Jobbra igazítás',
	'outdent': 'Negatív behúzás',
	'paste': 'Beillesztés',
	'redo': 'Újra',
	'removeFormat': 'Formázás eltávolítása',
	'selectAll': 'Összes kijelölése',
	'strikethrough': 'Áthúzott',
	'subscript': 'Alsó index',
	'superscript': 'Felső index',
	'underline': 'Aláhúzott',
	'undo': 'Visszavonás',
	'unlink': 'Hivatkozás eltávolítása',
	'createLink': 'Hivatkozás létrehozása',
	'toggleDir': 'Irány váltókapcsoló',
	'insertImage': 'Kép beszúrása',
	'insertTable': 'Táblázat beszúrása/szerkesztése',
	'toggleTableBorder': 'Táblázatszegély ki-/bekapcsolása',
	'deleteTable': 'Táblázat törlése',
	'tableProp': 'Táblázat tulajdonságai',
	'htmlToggle': 'HTML forrás',
	'foreColor': 'Előtérszín',
	'hiliteColor': 'Háttérszín',
	'plainFormatBlock': 'Bekezdés stílusa',
	'formatBlock': 'Bekezdés stílusa',
	'fontSize': 'Betűméret',
	'fontName': 'Betűtípus',
	'tabIndent': 'Tab behúzás',
	"fullScreen": "Váltás teljes képernyőre",
	"viewSource": "HTML forrás megjelenítése",
	"print": "Nyomtatás",
	"newPage": "Új oldal",
	/* Error messages */
	'systemShortcut': 'A(z) "${0}" művelet a böngészőben csak billentyűparancs használatával érhető el. Használja a következőt: ${1}.'
})
//end v1.x content
);

},
'dojo/cldr/nls/hu/gregorian':function(){
define(
//begin v1.x content
{
	"field-dayperiod": "napszak",
	"dayPeriods-format-wide-pm": "du.",
	"field-minute": "perc",
	"eraNames": [
		"időszámításunk előtt",
		"időszámításunk szerint"
	],
	"dateFormatItem-MMMEd": "MMM d., E",
	"field-day-relative+-1": "tegnap",
	"field-weekday": "hét napja",
	"field-day-relative+-2": "tegnapelőtt",
	"dateFormatItem-MMdd": "MM.dd.",
	"field-day-relative+-3": "három nappal ezelőtt",
	"days-standAlone-wide": [
		"vasárnap",
		"hétfő",
		"kedd",
		"szerda",
		"csütörtök",
		"péntek",
		"szombat"
	],
	"dateFormatItem-MMM": "LLL",
	"months-standAlone-narrow": [
		"J",
		"F",
		"M",
		"Á",
		"M",
		"J",
		"J",
		"A",
		"Sz",
		"O",
		"N",
		"D"
	],
	"field-era": "éra",
	"field-hour": "óra",
	"dayPeriods-format-wide-am": "de.",
	"quarters-standAlone-abbr": [
		"N1",
		"N2",
		"N3",
		"N4"
	],
	"timeFormat-full": "H:mm:ss zzzz",
	"months-standAlone-abbr": [
		"jan.",
		"febr.",
		"márc.",
		"ápr.",
		"máj.",
		"jún.",
		"júl.",
		"aug.",
		"szept.",
		"okt.",
		"nov.",
		"dec."
	],
	"dateFormatItem-Ed": "d., E",
	"field-day-relative+0": "ma",
	"field-day-relative+1": "holnap",
	"days-standAlone-narrow": [
		"V",
		"H",
		"K",
		"Sz",
		"Cs",
		"P",
		"Sz"
	],
	"eraAbbr": [
		"i. e.",
		"i. sz."
	],
	"field-day-relative+2": "holnapután",
	"field-day-relative+3": "három nap múlva",
	"dateFormatItem-yyyyMM": "yyyy.MM",
	"dateFormatItem-yyyyMMMM": "y. MMMM",
	"dateFormat-long": "y. MMMM d.",
	"timeFormat-medium": "H:mm:ss",
	"field-zone": "zóna",
	"dateFormatItem-Hm": "H:mm",
	"dateFormat-medium": "yyyy.MM.dd.",
	"dateFormatItem-Hms": "H:mm:ss",
	"quarters-standAlone-wide": [
		"I. negyedév",
		"II. negyedév",
		"III. negyedév",
		"IV. negyedév"
	],
	"field-year": "év",
	"field-week": "hét",
	"months-standAlone-wide": [
		"január",
		"február",
		"március",
		"április",
		"május",
		"június",
		"július",
		"augusztus",
		"szeptember",
		"október",
		"november",
		"december"
	],
	"dateFormatItem-MMMd": "MMM d.",
	"dateFormatItem-yyQ": "yy/Q",
	"timeFormat-long": "H:mm:ss z",
	"months-format-abbr": [
		"jan.",
		"febr.",
		"márc.",
		"ápr.",
		"máj.",
		"jún.",
		"júl.",
		"aug.",
		"szept.",
		"okt.",
		"nov.",
		"dec."
	],
	"timeFormat-short": "H:mm",
	"dateFormatItem-H": "H",
	"field-month": "hónap",
	"dateFormatItem-MMMMd": "MMMM d.",
	"quarters-format-abbr": [
		"N1",
		"N2",
		"N3",
		"N4"
	],
	"days-format-abbr": [
		"V",
		"H",
		"K",
		"Sze",
		"Cs",
		"P",
		"Szo"
	],
	"dateFormatItem-mmss": "mm:ss",
	"dateFormatItem-M": "L",
	"days-format-narrow": [
		"V",
		"H",
		"K",
		"Sz",
		"Cs",
		"P",
		"Sz"
	],
	"field-second": "másodperc",
	"field-day": "nap",
	"dateFormatItem-MEd": "M. d., E",
	"months-format-narrow": [
		"J",
		"F",
		"M",
		"Á",
		"M",
		"J",
		"J",
		"A",
		"Sz",
		"O",
		"N",
		"D"
	],
	"days-standAlone-abbr": [
		"V",
		"H",
		"K",
		"Sze",
		"Cs",
		"P",
		"Szo"
	],
	"dateFormat-short": "yyyy.MM.dd.",
	"dateFormatItem-yMMMEd": "y. MMM d., E",
	"dateFormat-full": "y. MMMM d., EEEE",
	"dateFormatItem-Md": "M. d.",
	"dateFormatItem-yMEd": "yyyy.MM.dd., E",
	"months-format-wide": [
		"január",
		"február",
		"március",
		"április",
		"május",
		"június",
		"július",
		"augusztus",
		"szeptember",
		"október",
		"november",
		"december"
	],
	"dateFormatItem-d": "d",
	"quarters-format-wide": [
		"I. negyedév",
		"II. negyedév",
		"III. negyedév",
		"IV. negyedév"
	],
	"days-format-wide": [
		"vasárnap",
		"hétfő",
		"kedd",
		"szerda",
		"csütörtök",
		"péntek",
		"szombat"
	],
	"eraNarrow": [
		"i. e.",
		"i. sz."
	]
}
//end v1.x content
);
},
'dojo/cldr/nls/hu/number':function(){
define(
//begin v1.x content
{
	"group": " ",
	"percentSign": "%",
	"exponential": "E",
	"scientificFormat": "#E0",
	"list": ";",
	"infinity": "∞",
	"patternDigit": "#",
	"minusSign": "-",
	"decimal": ",",
	"nan": "NaN",
	"nativeZeroDigit": "0",
	"perMille": "‰",
	"decimalFormat": "#,##0.###",
	"currencyFormat": "#,##0.00 ¤",
	"plusSign": "+"
}
//end v1.x content
);
},
'dijit/form/nls/hu/ComboBox':function(){
define(
"dijit/form/nls/hu/ComboBox", //begin v1.x content
({
		previousMessage: "Előző menüpontok",
		nextMessage: "További menüpontok"
})
//end v1.x content
);

},
'*noref':1}});
define("esri/dijit/nls/AttributeInspector-all_hu", [], 1);
