require({cache:{
'dijit/form/nls/sk/validate':function(){
define(
"dijit/form/nls/sk/validate", //begin v1.x content
({
	invalidMessage: "Zadaná hodnota nie je platná.",
	missingMessage: "Táto hodnota je vyžadovaná.",
	rangeMessage: "Táto hodnota je mimo rozsah."
})

//end v1.x content
);

},
'dijit/_editor/nls/sk/commands':function(){
define(
"dijit/_editor/nls/sk/commands", //begin v1.x content
({
	'bold': 'Tučné písmo',
	'copy': 'Kopírovať',
	'cut': 'Vystrihnúť',
	'delete': 'Vymazať',
	'indent': 'Odsadiť',
	'insertHorizontalRule': 'Horizontálna čiara',
	'insertOrderedList': 'Číslovaný zoznam',
	'insertUnorderedList': 'Zoznam s odrážkami',
	'italic': 'Kurzíva',
	'justifyCenter': 'Zarovnať na stred',
	'justifyFull': 'Zarovnať podľa okraja',
	'justifyLeft': 'Zarovnať doľava',
	'justifyRight': 'Zarovnať doprava',
	'outdent': 'Predsadiť',
	'paste': 'Nalepiť',
	'redo': 'Znova vykonať',
	'removeFormat': 'Odstrániť formát',
	'selectAll': 'Vybrať všetko',
	'strikethrough': 'Prečiarknuť',
	'subscript': 'Dolný index',
	'superscript': 'Horný index',
	'underline': 'Podčiarknuť',
	'undo': 'Vrátiť späť',
	'unlink': 'Odstrániť prepojenie',
	'createLink': 'Vytvoriť prepojenie',
	'toggleDir': 'Prepnúť smer',
	'insertImage': 'Vložiť obrázok',
	'insertTable': 'Vložiť/upraviť tabuľku',
	'toggleTableBorder': 'Prepnúť rámček tabuľky',
	'deleteTable': 'Vymazať tabuľku',
	'tableProp': 'Vlastnosť tabuľky',
	'htmlToggle': 'Zdroj HTML',
	'foreColor': 'Farba popredia',
	'hiliteColor': 'Farba pozadia',
	'plainFormatBlock': 'Štýl odseku',
	'formatBlock': 'Štýl odseku',
	'fontSize': 'Veľkosť písma',
	'fontName': 'Názov písma',
	'tabIndent': 'Odsadenie tabulátora',
	"fullScreen": "Zobraziť na celú obrazovku",
	"viewSource": "Zobraziť zdrojový kód HTML ",
	"print": "Tlačiť",
	"newPage": "Nová stránka ",
	/* Error messages */
	'systemShortcut': 'Akcia "${0}" je vo vašom prehliadači dostupná len s použitím klávesovej skratky. Použite ${1}.'
})

//end v1.x content
);

},
'dojo/cldr/nls/sk/gregorian':function(){
define(
//begin v1.x content
{
	"field-dayperiod": "Časť dňa",
	"dateFormatItem-yQ": "Q yyyy",
	"dayPeriods-format-wide-pm": "popoludní",
	"field-minute": "Minúta",
	"eraNames": [
		"pred n.l.",
		"n.l."
	],
	"dateFormatItem-MMMEd": "E, d. MMM",
	"field-day-relative+-1": "Včera",
	"field-weekday": "Deň v týždni",
	"dateFormatItem-yQQQ": "QQQ y",
	"field-day-relative+-2": "Predvčerom",
	"field-day-relative+-3": "Pred tromi dňami",
	"days-standAlone-wide": [
		"nedeľa",
		"pondelok",
		"utorok",
		"streda",
		"štvrtok",
		"piatok",
		"sobota"
	],
	"months-standAlone-narrow": [
		"j",
		"f",
		"m",
		"a",
		"m",
		"j",
		"j",
		"a",
		"s",
		"o",
		"n",
		"d"
	],
	"field-era": "Éra",
	"field-hour": "Hodina",
	"dayPeriods-format-wide-am": "dopoludnia",
	"timeFormat-full": "H:mm:ss zzzz",
	"months-standAlone-abbr": [
		"jan",
		"feb",
		"mar",
		"apr",
		"máj",
		"jún",
		"júl",
		"aug",
		"sep",
		"okt",
		"nov",
		"dec"
	],
	"dateFormatItem-yMMM": "LLL y",
	"field-day-relative+0": "Dnes",
	"field-day-relative+1": "Zajtra",
	"days-standAlone-narrow": [
		"N",
		"P",
		"U",
		"S",
		"Š",
		"P",
		"S"
	],
	"eraAbbr": [
		"pred n.l.",
		"n.l."
	],
	"field-day-relative+2": "Pozajtra",
	"field-day-relative+3": "O tri dni",
	"dateFormatItem-yyyyMMMM": "LLLL y",
	"dateFormat-long": "d. MMMM y",
	"timeFormat-medium": "H:mm:ss",
	"dateFormatItem-EEEd": "EEE, d.",
	"field-zone": "Pásmo",
	"dateFormatItem-Hm": "H:mm",
	"dateFormat-medium": "d.M.yyyy",
	"dateFormatItem-Hms": "H:mm:ss",
	"dateFormatItem-yyQQQQ": "QQQQ yy",
	"quarters-standAlone-wide": [
		"1. štvrťrok",
		"2. štvrťrok",
		"3. štvrťrok",
		"4. štvrťrok"
	],
	"dateFormatItem-yMMMM": "LLLL y",
	"dateFormatItem-ms": "mm:ss",
	"field-year": "Rok",
	"months-standAlone-wide": [
		"január",
		"február",
		"marec",
		"apríl",
		"máj",
		"jún",
		"júl",
		"august",
		"september",
		"október",
		"november",
		"december"
	],
	"field-week": "Týždeň",
	"dateFormatItem-MMMMEd": "E, d. MMMM",
	"dateFormatItem-MMMd": "d. MMM",
	"dateFormatItem-yyQ": "Q yy",
	"timeFormat-long": "H:mm:ss z",
	"months-format-abbr": [
		"jan",
		"feb",
		"mar",
		"apr",
		"máj",
		"jún",
		"júl",
		"aug",
		"sep",
		"okt",
		"nov",
		"dec"
	],
	"timeFormat-short": "H:mm",
	"dateFormatItem-H": "H",
	"field-month": "Mesiac",
	"dateFormatItem-MMMMd": "d. MMMM",
	"quarters-format-abbr": [
		"Q1",
		"Q2",
		"Q3",
		"Q4"
	],
	"days-format-abbr": [
		"ne",
		"po",
		"ut",
		"st",
		"št",
		"pi",
		"so"
	],
	"dateFormatItem-mmss": "mm:ss",
	"days-format-narrow": [
		"N",
		"P",
		"U",
		"S",
		"Š",
		"P",
		"S"
	],
	"field-second": "Sekunda",
	"field-day": "Deň",
	"dateFormatItem-MEd": "E, d.M.",
	"months-format-narrow": [
		"j",
		"f",
		"m",
		"a",
		"m",
		"j",
		"j",
		"a",
		"s",
		"o",
		"n",
		"d"
	],
	"days-standAlone-abbr": [
		"ne",
		"po",
		"ut",
		"st",
		"št",
		"pi",
		"so"
	],
	"dateFormat-short": "d.M.yyyy",
	"dateFormatItem-yyyyM": "M.yyyy",
	"dateFormatItem-yMMMEd": "EEE, d. MMM y",
	"dateFormat-full": "EEEE, d. MMMM y",
	"dateFormatItem-Md": "d.M.",
	"dateFormatItem-yMEd": "EEE, d.M.yyyy",
	"months-format-wide": [
		"januára",
		"februára",
		"marca",
		"apríla",
		"mája",
		"júna",
		"júla",
		"augusta",
		"septembra",
		"októbra",
		"novembra",
		"decembra"
	],
	"dateFormatItem-d": "d.",
	"quarters-format-wide": [
		"1. štvrťrok",
		"2. štvrťrok",
		"3. štvrťrok",
		"4. štvrťrok"
	],
	"days-format-wide": [
		"nedeľa",
		"pondelok",
		"utorok",
		"streda",
		"štvrtok",
		"piatok",
		"sobota"
	],
	"eraNarrow": [
		"pred n.l.",
		"n.l."
	]
}
//end v1.x content
);
},
'dojo/cldr/nls/sk/number':function(){
define(
//begin v1.x content
{
	"currencyFormat": "#,##0.00 ¤",
	"group": " ",
	"decimal": ","
}
//end v1.x content
);
},
'dijit/form/nls/sk/ComboBox':function(){
define(
"dijit/form/nls/sk/ComboBox", //begin v1.x content
({
		previousMessage: "Predchádzajúce voľby",
		nextMessage: "Ďalšie voľby"
})

//end v1.x content
);

},
'*noref':1}});
define("esri/dijit/nls/AttributeInspector-all_sk", [], 1);
