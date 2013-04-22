require({cache:{
'dijit/form/nls/cs/validate':function(){
define(
"dijit/form/nls/cs/validate", //begin v1.x content
({
	invalidMessage: "Zadaná hodnota není platná.",
	missingMessage: "Tato hodnota je vyžadována.",
	rangeMessage: "Tato hodnota je mimo rozsah."
})
//end v1.x content
);

},
'dijit/_editor/nls/cs/commands':function(){
define(
"dijit/_editor/nls/cs/commands", //begin v1.x content
({
	'bold': 'Tučné',
	'copy': 'Kopírovat',
	'cut': 'Vyjmout',
	'delete': 'Odstranit',
	'indent': 'Odsadit',
	'insertHorizontalRule': 'Vodorovná čára',
	'insertOrderedList': 'Číslovaný seznam',
	'insertUnorderedList': 'Seznam s odrážkami',
	'italic': 'Kurzíva',
	'justifyCenter': 'Zarovnat na střed',
	'justifyFull': 'Do bloku',
	'justifyLeft': 'Zarovnat vlevo',
	'justifyRight': 'Zarovnat vpravo',
	'outdent': 'Předsadit',
	'paste': 'Vložit',
	'redo': 'Opakovat',
	'removeFormat': 'Odebrat formát',
	'selectAll': 'Vybrat vše',
	'strikethrough': 'Přeškrtnutí',
	'subscript': 'Dolní index',
	'superscript': 'Horní index',
	'underline': 'Podtržení',
	'undo': 'Zpět',
	'unlink': 'Odebrat odkaz',
	'createLink': 'Vytvořit odkaz',
	'toggleDir': 'Přepnout směr',
	'insertImage': 'Vložit obrázek',
	'insertTable': 'Vložit/upravit tabulku',
	'toggleTableBorder': 'Přepnout ohraničení tabulky',
	'deleteTable': 'Odstranit tabulku',
	'tableProp': 'Vlastnost tabulky',
	'htmlToggle': 'Zdroj HTML',
	'foreColor': 'Barva popředí',
	'hiliteColor': 'Barva pozadí',
	'plainFormatBlock': 'Styl odstavce',
	'formatBlock': 'Styl odstavce',
	'fontSize': 'Velikost písma',
	'fontName': 'Název písma',
	'tabIndent': 'Odsazení tabulátoru',
	"fullScreen": "Přepnout celou obrazovku",
	"viewSource": "Zobrazit zdroj HTML",
	"print": "Tisk",
	"newPage": "Nová stránka",
	/* Error messages */
	'systemShortcut': 'Akce "${0}" je v prohlížeči dostupná pouze prostřednictvím klávesové zkratky. Použijte klávesovou zkratku ${1}.'
})
//end v1.x content
);

},
'dojo/cldr/nls/cs/gregorian':function(){
define(
//begin v1.x content
{
	"dateFormatItem-yM": "M.y",
	"dateFormatItem-yQ": "Q yyyy",
	"dayPeriods-format-wide-pm": "odp.",
	"eraNames": [
		"př.Kr.",
		"po Kr."
	],
	"dateFormatItem-MMMEd": "E, d. MMM",
	"field-day-relative+-1": "Včera",
	"dateFormatItem-yQQQ": "QQQ y",
	"field-day-relative+-2": "Předevčírem",
	"days-standAlone-wide": [
		"neděle",
		"pondělí",
		"úterý",
		"středa",
		"čtvrtek",
		"pátek",
		"sobota"
	],
	"months-standAlone-narrow": [
		"l",
		"ú",
		"b",
		"d",
		"k",
		"č",
		"č",
		"s",
		"z",
		"ř",
		"l",
		"p"
	],
	"dayPeriods-format-wide-am": "dop.",
	"quarters-standAlone-abbr": [
		"1. čtvrtletí",
		"2. čtvrtletí",
		"3. čtvrtletí",
		"4. čtvrtletí"
	],
	"timeFormat-full": "H:mm:ss zzzz",
	"dateFormatItem-yyyy": "y",
	"months-standAlone-abbr": [
		"1.",
		"2.",
		"3.",
		"4.",
		"5.",
		"6.",
		"7.",
		"8.",
		"9.",
		"10.",
		"11.",
		"12."
	],
	"dateFormatItem-yMMM": "LLL y",
	"field-day-relative+0": "Dnes",
	"field-day-relative+1": "Zítra",
	"days-standAlone-narrow": [
		"N",
		"P",
		"Ú",
		"S",
		"Č",
		"P",
		"S"
	],
	"eraAbbr": [
		"př.Kr.",
		"po Kr."
	],
	"field-day-relative+2": "Pozítří",
	"dateFormatItem-yyyyMMMM": "LLLL y",
	"dateFormat-long": "d. MMMM y",
	"timeFormat-medium": "H:mm:ss",
	"dateFormatItem-EEEd": "EEE, d.",
	"dateFormatItem-Hm": "H:mm",
	"dateFormat-medium": "d.M.yyyy",
	"dateFormatItem-Hms": "H:mm:ss",
	"dateFormatItem-yMd": "d.M.y",
	"quarters-standAlone-wide": [
		"1. čtvrtletí",
		"2. čtvrtletí",
		"3. čtvrtletí",
		"4. čtvrtletí"
	],
	"months-standAlone-wide": [
		"leden",
		"únor",
		"březen",
		"duben",
		"květen",
		"červen",
		"červenec",
		"srpen",
		"září",
		"říjen",
		"listopad",
		"prosinec"
	],
	"dateFormatItem-MMMd": "d. MMM",
	"dateFormatItem-yyQ": "Q yy",
	"timeFormat-long": "H:mm:ss z",
	"months-format-abbr": [
		"ledna",
		"února",
		"března",
		"dubna",
		"května",
		"června",
		"července",
		"srpna",
		"září",
		"října",
		"listopadu",
		"prosince"
	],
	"timeFormat-short": "H:mm",
	"dateFormatItem-H": "H",
	"quarters-format-abbr": [
		"1. čtvrtletí",
		"2. čtvrtletí",
		"3. čtvrtletí",
		"4. čtvrtletí"
	],
	"days-format-abbr": [
		"ne",
		"po",
		"út",
		"st",
		"čt",
		"pá",
		"so"
	],
	"days-format-narrow": [
		"N",
		"P",
		"Ú",
		"S",
		"Č",
		"P",
		"S"
	],
	"dateFormatItem-MEd": "E, d.M",
	"months-format-narrow": [
		"l",
		"ú",
		"b",
		"d",
		"k",
		"č",
		"č",
		"s",
		"z",
		"ř",
		"l",
		"p"
	],
	"days-standAlone-abbr": [
		"ne",
		"po",
		"út",
		"st",
		"čt",
		"pá",
		"so"
	],
	"dateFormat-short": "d.M.yy",
	"dateFormatItem-yyyyM": "M.yyyy",
	"dateFormatItem-yMMMEd": "EEE, d. MMM y",
	"dateFormat-full": "EEEE, d. MMMM y",
	"dateFormatItem-Md": "d.M",
	"dateFormatItem-yMEd": "EEE, d.M.y",
	"months-format-wide": [
		"ledna",
		"února",
		"března",
		"dubna",
		"května",
		"června",
		"července",
		"srpna",
		"září",
		"října",
		"listopadu",
		"prosince"
	],
	"dateFormatItem-d": "d.",
	"quarters-format-wide": [
		"1. čtvrtletí",
		"2. čtvrtletí",
		"3. čtvrtletí",
		"4. čtvrtletí"
	],
	"days-format-wide": [
		"neděle",
		"pondělí",
		"úterý",
		"středa",
		"čtvrtek",
		"pátek",
		"sobota"
	],
	"eraNarrow": [
		"př.Kr.",
		"po Kr."
	]
}
//end v1.x content
);
},
'dijit/nls/cs/loading':function(){
define(
"dijit/nls/cs/loading", //begin v1.x content
({
	loadingState: "Probíhá načítání...",
	errorState: "Omlouváme se, došlo k chybě"
})
//end v1.x content
);

},
'dojo/cldr/nls/cs/number':function(){
define(
//begin v1.x content
{
	"group": " ",
	"percentSign": "%",
	"exponential": "E",
	"scientificFormat": "#E0",
	"percentFormat": "#,##0 %",
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
'dijit/form/nls/cs/ComboBox':function(){
define(
"dijit/form/nls/cs/ComboBox", //begin v1.x content
({
		previousMessage: "Předchozí volby",
		nextMessage: "Další volby"
})
//end v1.x content
);

},
'*noref':1}});
define("esri/dijit/editing/nls/Editor-all_cs", [], 1);
