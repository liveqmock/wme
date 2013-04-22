require({cache:{
'dijit/form/nls/nl/validate':function(){
define(
"dijit/form/nls/nl/validate", //begin v1.x content
({
	invalidMessage: "De opgegeven waarde is ongeldig.",
	missingMessage: "Deze waarde is verplicht.",
	rangeMessage: "Deze waarde is niet toegestaan."
})
//end v1.x content
);

},
'dijit/form/nls/nl-nl/validate':function(){
define('dijit/form/nls/nl-nl/validate',{});
},
'dijit/_editor/nls/nl/commands':function(){
define(
"dijit/_editor/nls/nl/commands", //begin v1.x content
({
	'bold': 'Vet',
	'copy': 'Kopiëren',
	'cut': 'Knippen',
	'delete': 'Wissen',
	'indent': 'Inspringen',
	'insertHorizontalRule': 'Horizontale liniaal',
	'insertOrderedList': 'Genummerde lijst',
	'insertUnorderedList': 'Lijst met opsommingstekens',
	'italic': 'Cursief',
	'justifyCenter': 'Centreren',
	'justifyFull': 'Uitvullen',
	'justifyLeft': 'Links uitlijnen',
	'justifyRight': 'Rechts uitlijnen',
	'outdent': 'Uitspringen',
	'paste': 'Plakken',
	'redo': 'Opnieuw',
	'removeFormat': 'Opmaak verwijderen',
	'selectAll': 'Alles selecteren',
	'strikethrough': 'Doorhalen',
	'subscript': 'Subscript',
	'superscript': 'Superscript',
	'underline': 'Onderstrepen',
	'undo': 'Ongedaan maken',
	'unlink': 'Link verwijderen',
	'createLink': 'Link maken',
	'toggleDir': 'Schrijfrichting wijzigen',
	'insertImage': 'Afbeelding invoegen',
	'insertTable': 'Tabel invoegen/bewerken',
	'toggleTableBorder': 'Tabelkader wijzigen',
	'deleteTable': 'Tabel wissen',
	'tableProp': 'Tabeleigenschap',
	'htmlToggle': 'HTML-bron',
	'foreColor': 'Voorgrondkleur',
	'hiliteColor': 'Achtergrondkleur',
	'plainFormatBlock': 'Alineastijl',
	'formatBlock': 'Alineastijl',
	'fontSize': 'Lettergrootte',
	'fontName': 'Lettertype',
	'tabIndent': 'Inspringen',
	"fullScreen": "Volledig scherm in-/uitschakelen",
	"viewSource": "HTML-bron bekijken",
	"print": "Afdrukken",
	"newPage": "Nieuwe pagina",
	/* Error messages */
	'systemShortcut': 'De actie "${0}" is alleen beschikbaar in uw browser via een sneltoetscombinatie. Gebruik ${1}.'
})
//end v1.x content
);

},
'dijit/_editor/nls/nl-nl/commands':function(){
define('dijit/_editor/nls/nl-nl/commands',{});
},
'dojo/cldr/nls/nl/gregorian':function(){
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
	"field-weekday": "Dag van de week",
	"dateFormatItem-yyQQQQ": "QQQQ yy",
	"dateFormatItem-yQQQ": "QQQ y",
	"dateFormatItem-yMEd": "EEE d-M-y",
	"dateFormatItem-MMMEd": "E d MMM",
	"eraNarrow": [
		"v. Chr.",
		"n. Chr."
	],
	"dateFormat-long": "d MMMM y",
	"months-format-wide": [
		"januari",
		"februari",
		"maart",
		"april",
		"mei",
		"juni",
		"juli",
		"augustus",
		"september",
		"oktober",
		"november",
		"december"
	],
	"dayPeriods-format-wide-pm": "PM",
	"dateFormat-full": "EEEE d MMMM y",
	"dateFormatItem-Md": "d-M",
	"field-era": "Tijdperk",
	"dateFormatItem-yM": "M-y",
	"months-standAlone-wide": [
		"januari",
		"februari",
		"maart",
		"april",
		"mei",
		"juni",
		"juli",
		"augustus",
		"september",
		"oktober",
		"november",
		"december"
	],
	"timeFormat-short": "HH:mm",
	"quarters-format-wide": [
		"1e kwartaal",
		"2e kwartaal",
		"3e kwartaal",
		"4e kwartaal"
	],
	"timeFormat-long": "HH:mm:ss z",
	"field-year": "Jaar",
	"dateFormatItem-yMMM": "MMM y",
	"dateFormatItem-yQ": "Q yyyy",
	"dateFormatItem-yyyyMMMM": "MMMM y",
	"field-hour": "Uur",
	"dateFormatItem-MMdd": "dd-MM",
	"months-format-abbr": [
		"jan.",
		"feb.",
		"mrt.",
		"apr.",
		"mei",
		"jun.",
		"jul.",
		"aug.",
		"sep.",
		"okt.",
		"nov.",
		"dec."
	],
	"dateFormatItem-yyQ": "Q yy",
	"timeFormat-full": "HH:mm:ss zzzz",
	"field-day-relative+0": "vandaag",
	"field-day-relative+1": "morgen",
	"field-day-relative+2": "overmorgen",
	"field-day-relative+3": "overovermorgen",
	"months-standAlone-abbr": [
		"jan.",
		"feb.",
		"mrt.",
		"apr.",
		"mei",
		"jun.",
		"jul.",
		"aug.",
		"sep.",
		"okt.",
		"nov.",
		"dec."
	],
	"quarters-format-abbr": [
		"K1",
		"K2",
		"K3",
		"K4"
	],
	"quarters-standAlone-wide": [
		"1e kwartaal",
		"2e kwartaal",
		"3e kwartaal",
		"4e kwartaal"
	],
	"dateFormatItem-M": "L",
	"days-standAlone-wide": [
		"zondag",
		"maandag",
		"dinsdag",
		"woensdag",
		"donderdag",
		"vrijdag",
		"zaterdag"
	],
	"dateFormatItem-MMMMd": "d MMMM",
	"dateFormatItem-yyMMM": "MMM yy",
	"timeFormat-medium": "HH:mm:ss",
	"dateFormatItem-Hm": "HH:mm",
	"quarters-standAlone-abbr": [
		"K1",
		"K2",
		"K3",
		"K4"
	],
	"eraAbbr": [
		"v. Chr.",
		"n. Chr."
	],
	"field-minute": "Minuut",
	"field-dayperiod": "AM/PM",
	"days-standAlone-abbr": [
		"zo",
		"ma",
		"di",
		"wo",
		"do",
		"vr",
		"za"
	],
	"dateFormatItem-d": "d",
	"dateFormatItem-ms": "mm:ss",
	"field-day-relative+-1": "gisteren",
	"field-day-relative+-2": "eergisteren",
	"field-day-relative+-3": "eereergisteren",
	"dateFormatItem-MMMd": "d-MMM",
	"dateFormatItem-MEd": "E d-M",
	"field-day": "Dag",
	"days-format-wide": [
		"zondag",
		"maandag",
		"dinsdag",
		"woensdag",
		"donderdag",
		"vrijdag",
		"zaterdag"
	],
	"field-zone": "Zone",
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
	"dateFormatItem-yyMM": "MM-yy",
	"days-format-abbr": [
		"zo",
		"ma",
		"di",
		"wo",
		"do",
		"vr",
		"za"
	],
	"eraNames": [
		"Voor Christus",
		"na Christus"
	],
	"days-format-narrow": [
		"Z",
		"M",
		"D",
		"W",
		"D",
		"V",
		"Z"
	],
	"field-month": "Maand",
	"days-standAlone-narrow": [
		"Z",
		"M",
		"D",
		"W",
		"D",
		"V",
		"Z"
	],
	"dateFormatItem-MMM": "LLL",
	"dayPeriods-format-wide-am": "AM",
	"dateFormat-short": "dd-MM-yy",
	"dateFormatItem-MMd": "d-MM",
	"field-second": "Seconde",
	"dateFormatItem-yMMMEd": "EEE d MMM y",
	"dateFormatItem-Ed": "E d",
	"field-week": "Week",
	"dateFormat-medium": "d MMM y"
}
//end v1.x content
);
},
'dojo/cldr/nls/nl-nl/gregorian':function(){
define('dojo/cldr/nls/nl-nl/gregorian',{});
},
'dijit/nls/nl/loading':function(){
define(
"dijit/nls/nl/loading", //begin v1.x content
({
	loadingState: "Bezig met laden...",
	errorState: "Er is een fout opgetreden"
})
//end v1.x content
);

},
'dijit/nls/nl-nl/loading':function(){
define('dijit/nls/nl-nl/loading',{});
},
'dojo/cldr/nls/nl/number':function(){
define(
//begin v1.x content
{
	"group": ".",
	"percentSign": "%",
	"exponential": "E",
	"scientificFormat": "#E0",
	"percentFormat": "#,##0%",
	"list": ";",
	"infinity": "∞",
	"patternDigit": "#",
	"minusSign": "-",
	"decimal": ",",
	"nan": "NaN",
	"nativeZeroDigit": "0",
	"perMille": "‰",
	"decimalFormat": "#,##0.###",
	"currencyFormat": "¤ #,##0.00;¤ #,##0.00-",
	"plusSign": "+"
}
//end v1.x content
);
},
'dojo/cldr/nls/nl-nl/number':function(){
define('dojo/cldr/nls/nl-nl/number',{});
},
'dijit/form/nls/nl/ComboBox':function(){
define(
"dijit/form/nls/nl/ComboBox", //begin v1.x content
({
		previousMessage: "Eerdere opties",
		nextMessage: "Meer opties"
})
//end v1.x content
);

},
'dijit/form/nls/nl-nl/ComboBox':function(){
define('dijit/form/nls/nl-nl/ComboBox',{});
},
'*noref':1}});
define("esri/dijit/editing/nls/Editor-all_nl-nl", [], 1);
