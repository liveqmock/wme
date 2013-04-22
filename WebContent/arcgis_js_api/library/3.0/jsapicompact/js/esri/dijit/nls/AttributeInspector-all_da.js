require({cache:{
'dijit/form/nls/da/validate':function(){
define(
"dijit/form/nls/da/validate", //begin v1.x content
({
	invalidMessage: "Den angivne værdi er ikke gyldig.",
	missingMessage: "Værdien er påkrævet.",
	rangeMessage: "Værdien er uden for intervallet."
})
//end v1.x content
);

},
'dijit/_editor/nls/da/commands':function(){
define(
"dijit/_editor/nls/da/commands", //begin v1.x content
({
	'bold': 'Fed',
	'copy': 'Kopiér',
	'cut': 'Klip',
	'delete': 'Slet',
	'indent': 'Indrykning',
	'insertHorizontalRule': 'Vandret linje',
	'insertOrderedList': 'Nummereret liste',
	'insertUnorderedList': 'Punktliste',
	'italic': 'Kursiv',
	'justifyCenter': 'Centreret',
	'justifyFull': 'Lige margener',
	'justifyLeft': 'Venstrejusteret',
	'justifyRight': 'Højrejusteret',
	'outdent': 'Udrykning',
	'paste': 'Sæt ind',
	'redo': 'Annullér Fortryd',
	'removeFormat': 'Fjern format',
	'selectAll': 'Markér alle',
	'strikethrough': 'Gennemstreget',
	'subscript': 'Sænket skrift',
	'superscript': 'Hævet skrift',
	'underline': 'Understreget',
	'undo': 'Fortryd',
	'unlink': 'Fjern link',
	'createLink': 'Opret link',
	'toggleDir': 'Skift retning',
	'insertImage': 'Indsæt billede',
	'insertTable': 'Indsæt/redigér tabel',
	'toggleTableBorder': 'Skift tabelramme',
	'deleteTable': 'Slet tabel',
	'tableProp': 'Tabelegenskab',
	'htmlToggle': 'HTML-kilde',
	'foreColor': 'Forgrundsfarve',
	'hiliteColor': 'Baggrundsfarve',
	'plainFormatBlock': 'Afsnitstypografi',
	'formatBlock': 'Afsnitstypografi',
	'fontSize': 'Skriftstørrelse',
	'fontName': 'Skriftnavn',
	'tabIndent': 'Indrykning med tabulator',
	"fullScreen": "Aktivér/deaktivér fuldskærm",
	"viewSource": "Vis HTML-kilde",
	"print": "Udskriv",
	"newPage": "Ny side",
	/* Error messages */
	'systemShortcut': 'Funktionen "${0}" kan kun bruges i din browser med en tastaturgenvej. Brug ${1}.'
})
//end v1.x content
);

},
'dojo/cldr/nls/da/gregorian':function(){
define(
//begin v1.x content
{
	"months-format-narrow": [
		"J",
		"F",
		"M",
		"A",
		"M",
		"J",
		"J",
		"A",
		"S",
		"O",
		"N",
		"D"
	],
	"field-weekday": "ugedag",
	"dateFormatItem-yQQQ": "QQQ y",
	"dateFormatItem-yMEd": "EEE. d/M/y",
	"dateFormatItem-MMMEd": "E d MMM",
	"eraNarrow": [
		"f.Kr.",
		"e.Kr."
	],
	"dateFormat-long": "d. MMM y",
	"months-format-wide": [
		"januar",
		"februar",
		"marts",
		"april",
		"maj",
		"juni",
		"juli",
		"august",
		"september",
		"oktober",
		"november",
		"december"
	],
	"dayPeriods-format-wide-pm": "e.m.",
	"dateFormat-full": "EEEE 'den' d. MMMM y",
	"dateFormatItem-Md": "d/M",
	"field-era": "æra",
	"dateFormatItem-yM": "M/y",
	"months-standAlone-wide": [
		"januar",
		"februar",
		"marts",
		"april",
		"maj",
		"juni",
		"juli",
		"august",
		"september",
		"oktober",
		"november",
		"december"
	],
	"timeFormat-short": "HH.mm",
	"quarters-format-wide": [
		"1. kvartal",
		"2. kvartal",
		"3. kvartal",
		"4. kvartal"
	],
	"timeFormat-long": "HH.mm.ss z",
	"field-year": "år",
	"dateFormatItem-yMMM": "MMM y",
	"dateFormatItem-yQ": "Q yyyy",
	"field-hour": "time",
	"dateFormatItem-MMdd": "dd/MM",
	"months-format-abbr": [
		"jan.",
		"feb.",
		"mar.",
		"apr.",
		"maj",
		"jun.",
		"jul.",
		"aug.",
		"sep.",
		"okt.",
		"nov.",
		"dec."
	],
	"dateFormatItem-yyQ": "Q. 'kvartal' yy",
	"timeFormat-full": "HH.mm.ss zzzz",
	"field-day-relative+0": "i dag",
	"field-day-relative+1": "i morgen",
	"field-day-relative+2": "i overmorgen",
	"dateFormatItem-H": "HH",
	"field-day-relative+3": "i overovermorgen",
	"months-standAlone-abbr": [
		"jan",
		"feb",
		"mar",
		"apr",
		"maj",
		"jun",
		"jul",
		"aug",
		"sep",
		"okt",
		"nov",
		"dec"
	],
	"quarters-format-abbr": [
		"K1",
		"K2",
		"K3",
		"K4"
	],
	"quarters-standAlone-wide": [
		"1. kvartal",
		"2. kvartal",
		"3. kvartal",
		"4. kvartal"
	],
	"dateFormatItem-M": "M",
	"days-standAlone-wide": [
		"søndag",
		"mandag",
		"tirsdag",
		"onsdag",
		"torsdag",
		"fredag",
		"lørdag"
	],
	"dateFormatItem-yyyyMMM": "MMM y",
	"dateFormatItem-yyMMM": "MMM yy",
	"timeFormat-medium": "HH.mm.ss",
	"dateFormatItem-Hm": "HH.mm",
	"quarters-standAlone-abbr": [
		"K1",
		"K2",
		"K3",
		"K4"
	],
	"eraAbbr": [
		"f.Kr.",
		"e.Kr."
	],
	"field-minute": "minut",
	"field-dayperiod": "dagtid",
	"days-standAlone-abbr": [
		"søn",
		"man",
		"tir",
		"ons",
		"tor",
		"fre",
		"lør"
	],
	"dateFormatItem-d": "d.",
	"dateFormatItem-ms": "mm.ss",
	"field-day-relative+-1": "i går",
	"field-day-relative+-2": "i forgårs",
	"field-day-relative+-3": "i forforgårs",
	"dateFormatItem-MMMd": "d. MMM",
	"dateFormatItem-MEd": "E. d/M",
	"field-day": "dag",
	"days-format-wide": [
		"søndag",
		"mandag",
		"tirsdag",
		"onsdag",
		"torsdag",
		"fredag",
		"lørdag"
	],
	"field-zone": "zone",
	"dateFormatItem-yyyyMM": "MM/yyyy",
	"dateFormatItem-y": "y",
	"months-standAlone-narrow": [
		"J",
		"F",
		"M",
		"A",
		"M",
		"J",
		"J",
		"A",
		"S",
		"O",
		"N",
		"D"
	],
	"dateFormatItem-yyMM": "MM/yy",
	"dateFormatItem-hm": "h.mm a",
	"days-format-abbr": [
		"søn",
		"man",
		"tir",
		"ons",
		"tor",
		"fre",
		"lør"
	],
	"eraNames": [
		"f.Kr.",
		"e.Kr."
	],
	"days-format-narrow": [
		"S",
		"M",
		"T",
		"O",
		"T",
		"F",
		"L"
	],
	"field-month": "måned",
	"days-standAlone-narrow": [
		"S",
		"M",
		"T",
		"O",
		"T",
		"F",
		"L"
	],
	"dateFormatItem-MMM": "MMM",
	"dayPeriods-format-wide-am": "f.m.",
	"dateFormatItem-MMMMEd": "E, d. MMMM",
	"dateFormat-short": "dd/MM/yy",
	"field-second": "sekund",
	"dateFormatItem-yMMMEd": "EEE. d. MMM y",
	"dateFormatItem-Ed": "E d.",
	"field-week": "uge",
	"dateFormat-medium": "dd/MM/yyyy",
	"dateFormatItem-Hms": "HH.mm.ss",
	"dateFormatItem-hms": "h.mm.ss a",
	"dateFormatItem-yyyy": "y"
}
//end v1.x content
);
},
'dojo/cldr/nls/da/number':function(){
define(
//begin v1.x content
{
	"group": ".",
	"percentSign": "%",
	"exponential": "E",
	"scientificFormat": "#E0",
	"percentFormat": "#,##0 %",
	"list": ",",
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
'dijit/form/nls/da/ComboBox':function(){
define(
"dijit/form/nls/da/ComboBox", //begin v1.x content
({
		previousMessage: "Forrige valg",
		nextMessage: "Flere valg"
})
//end v1.x content
);

},
'*noref':1}});
define("esri/dijit/nls/AttributeInspector-all_da", [], 1);
