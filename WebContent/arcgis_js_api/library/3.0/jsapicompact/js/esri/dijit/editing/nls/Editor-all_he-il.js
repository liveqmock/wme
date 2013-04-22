require({cache:{
'dijit/form/nls/he/validate':function(){
define(
"dijit/form/nls/he/validate", //begin v1.x content
({
	invalidMessage: "הערך שצוין אינו חוקי.",
	missingMessage: "זהו ערך דרוש.",
	rangeMessage: "הערך מחוץ לטווח."
})
//end v1.x content
);

},
'dijit/form/nls/he-il/validate':function(){
define('dijit/form/nls/he-il/validate',{});
},
'dijit/_editor/nls/he/commands':function(){
define(
"dijit/_editor/nls/he/commands", //begin v1.x content
({
	'bold': 'מודגש',
	'copy': 'עותק',
	'cut': 'גזירה',
	'delete': 'מחיקה',
	'indent': 'הגדלת כניסה',
	'insertHorizontalRule': 'קו אופקי',
	'insertOrderedList': 'רשימה ממוספרת',
	'insertUnorderedList': 'רשימה עם תבליטים',
	'italic': 'נטוי',
	'justifyCenter': 'יישור למרכז',
	'justifyFull': 'יישור דו-צדדי',
	'justifyLeft': 'יישור לשמאל',
	'justifyRight': 'יישור לימין',
	'outdent': 'הקטנת כניסה',
	'paste': 'הדבקה',
	'redo': 'שחזור פעולה',
	'removeFormat': 'סילוק עיצוב',
	'selectAll': 'בחירת הכל',
	'strikethrough': 'קו חוצה',
	'subscript': 'כתב תחתי',
	'superscript': 'כתב עילי',
	'underline': 'קו תחתי',
	'undo': 'ביטול פעולה',
	'unlink': 'סילוק הקישור',
	'createLink': 'יצירת קישור',
	'toggleDir': 'מיתוג כיוון',
	'insertImage': 'הוספת תמונה',
	'insertTable': 'הוספת/עריכת טבלה',
	'toggleTableBorder': 'מיתוג גבול טבלה',
	'deleteTable': 'מחיקת טבלה',
	'tableProp': 'תכונת טבלה',
	'htmlToggle': 'מקור HTML',
	'foreColor': 'צבע חזית',
	'hiliteColor': 'צבע רקע',
	'plainFormatBlock': 'סגנון פיסקה',
	'formatBlock': 'סגנון פיסקה',
	'fontSize': 'גופן יחסי',
	'fontName': 'שם גופן',
	'tabIndent': 'כניסת טאב',
	"fullScreen": "מיתוג מסך מלא",
	"viewSource": "הצגת מקור HTML",
	"print": "הדפסה",
	"newPage": "דף חדש",
	/* Error messages */
	'systemShortcut': 'הפעולה "${0}" זמינה בדפדפן רק באמצעות קיצור דרך במקלדת. השתמשו בקיצור ${1}.',
	'ctrlKey':'ctrl+${0}‎',
	'appleKey':'\u2318${0}‎' // "command" or open-apple key on Macintosh
})
//end v1.x content
);

},
'dijit/_editor/nls/he-il/commands':function(){
define('dijit/_editor/nls/he-il/commands',{});
},
'dojo/cldr/nls/he/gregorian':function(){
define(
//begin v1.x content
{
	"field-weekday": "יום בשבוע",
	"dateFormatItem-yQQQ": "y QQQ",
	"dateFormatItem-yMEd": "EEE, d.M.yyyy",
	"dateFormatItem-MMMEd": "E, d בMMM",
	"eraNarrow": [
		"לפנה״ס",
		"לסה״נ"
	],
	"dateFormat-long": "d בMMMM y",
	"months-format-wide": [
		"ינואר",
		"פברואר",
		"מרס",
		"אפריל",
		"מאי",
		"יוני",
		"יולי",
		"אוגוסט",
		"ספטמבר",
		"אוקטובר",
		"נובמבר",
		"דצמבר"
	],
	"dateFormatItem-EEEd": "EEE ה-d",
	"dayPeriods-format-wide-pm": "אחה״צ",
	"dateFormat-full": "EEEE, d בMMMM y",
	"dateFormatItem-Md": "d/M",
	"field-era": "תקופה",
	"dateFormatItem-yM": "M.yyyy",
	"months-standAlone-wide": [
		"ינואר",
		"פברואר",
		"מרס",
		"אפריל",
		"מאי",
		"יוני",
		"יולי",
		"אוגוסט",
		"ספטמבר",
		"אוקטובר",
		"נובמבר",
		"דצמבר"
	],
	"timeFormat-short": "HH:mm",
	"quarters-format-wide": [
		"רבעון 1",
		"רבעון 2",
		"רבעון 3",
		"רבעון 4"
	],
	"timeFormat-long": "HH:mm:ss z",
	"field-year": "שנה",
	"dateFormatItem-yMMM": "MMM y",
	"dateFormatItem-yQ": "yyyy Q",
	"dateFormatItem-yyyyMMMM": "MMMM y",
	"field-hour": "שעה",
	"dateFormatItem-MMdd": "dd/MM",
	"months-format-abbr": [
		"ינו",
		"פבר",
		"מרס",
		"אפר",
		"מאי",
		"יונ",
		"יול",
		"אוג",
		"ספט",
		"אוק",
		"נוב",
		"דצמ"
	],
	"dateFormatItem-yyQ": "Q yy",
	"timeFormat-full": "HH:mm:ss zzzz",
	"field-day-relative+0": "היום",
	"field-day-relative+1": "מחר",
	"field-day-relative+2": "מחרתיים",
	"dateFormatItem-H": "HH",
	"field-day-relative+3": "בעוד שלושה ימים",
	"months-standAlone-abbr": [
		"ינו׳",
		"פבר׳",
		"מרס",
		"אפר׳",
		"מאי",
		"יונ׳",
		"יול׳",
		"אוג׳",
		"ספט׳",
		"אוק׳",
		"נוב׳",
		"דצמ׳"
	],
	"quarters-format-abbr": [
		"רבעון 1",
		"רבעון 2",
		"רבעון 3",
		"רבעון 4"
	],
	"quarters-standAlone-wide": [
		"רבעון 1",
		"רבעון 2",
		"רבעון 3",
		"רבעון 4"
	],
	"dateFormatItem-M": "L",
	"days-standAlone-wide": [
		"יום ראשון",
		"יום שני",
		"יום שלישי",
		"יום רביעי",
		"יום חמישי",
		"יום שישי",
		"יום שבת"
	],
	"dateFormatItem-MMMMd": "d בMMMM",
	"dateFormatItem-yyMMM": "MMM yyyy",
	"timeFormat-medium": "HH:mm:ss",
	"dateFormatItem-Hm": "HH:mm",
	"quarters-standAlone-abbr": [
		"רבעון 1",
		"רבעון 2",
		"רבעון 3",
		"רבעון 4"
	],
	"eraAbbr": [
		"לפנה״ס",
		"לסה״נ"
	],
	"field-minute": "דקה",
	"field-dayperiod": "לפה״צ/אחה״צ",
	"days-standAlone-abbr": [
		"יום א׳",
		"יום ב׳",
		"יום ג׳",
		"יום ד׳",
		"יום ה׳",
		"יום ו׳",
		"שבת"
	],
	"dateFormatItem-d": "d",
	"dateFormatItem-ms": "mm:ss",
	"field-day-relative+-1": "אתמול",
	"field-day-relative+-2": "שלשום",
	"field-day-relative+-3": "לפני שלושה ימים",
	"dateFormatItem-MMMd": "d בMMM",
	"dateFormatItem-MEd": "E, M-d",
	"dateFormatItem-yMMMM": "MMMM y",
	"field-day": "יום",
	"days-format-wide": [
		"יום ראשון",
		"יום שני",
		"יום שלישי",
		"יום רביעי",
		"יום חמישי",
		"יום שישי",
		"יום שבת"
	],
	"field-zone": "אזור",
	"dateFormatItem-yyyyMM": "MM/yyyy",
	"dateFormatItem-y": "y",
	"dateFormatItem-yyMM": "MM/yy",
	"dateFormatItem-hm": "h:mm a",
	"days-format-abbr": [
		"יום א׳",
		"יום ב׳",
		"יום ג׳",
		"יום ד׳",
		"יום ה׳",
		"יום ו׳",
		"שבת"
	],
	"eraNames": [
		"לפני הספירה",
		"לספירה"
	],
	"days-format-narrow": [
		"א",
		"ב",
		"ג",
		"ד",
		"ה",
		"ו",
		"ש"
	],
	"field-month": "חודש",
	"days-standAlone-narrow": [
		"א",
		"ב",
		"ג",
		"ד",
		"ה",
		"ו",
		"ש"
	],
	"dateFormatItem-MMM": "LLL",
	"dayPeriods-format-wide-am": "לפנה״צ",
	"dateFormatItem-MMMMEd": "E, d בMMMM",
	"dateFormat-short": "dd/MM/yy",
	"field-second": "שנייה",
	"dateFormatItem-yMMMEd": "EEE, d בMMM y",
	"dateFormatItem-Ed": "E ה-d",
	"field-week": "שבוע",
	"dateFormat-medium": "d בMMM yyyy",
	"dateFormatItem-mmss": "mm:ss",
	"dateFormatItem-Hms": "HH:mm:ss",
	"dateFormatItem-hms": "h:mm:ss a",
	"dateFormatItem-yyyy": "y"
}
//end v1.x content
);
},
'dojo/cldr/nls/he-il/gregorian':function(){
define('dojo/cldr/nls/he-il/gregorian',{});
},
'dijit/nls/he/loading':function(){
define(
"dijit/nls/he/loading", //begin v1.x content
({
	loadingState: "טעינה...‏",
	errorState: "אירעה שגיאה"
})
//end v1.x content
);

},
'dijit/nls/he-il/loading':function(){
define('dijit/nls/he-il/loading',{});
},
'dojo/cldr/nls/he/number':function(){
define(
//begin v1.x content
{
	"group": ",",
	"percentSign": "%",
	"exponential": "E",
	"scientificFormat": "#E0",
	"percentFormat": "#,##0%",
	"list": ";",
	"infinity": "∞",
	"patternDigit": "#",
	"minusSign": "-",
	"decimal": ".",
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
'dojo/cldr/nls/he-il/number':function(){
define('dojo/cldr/nls/he-il/number',{});
},
'dijit/form/nls/he/ComboBox':function(){
define(
"dijit/form/nls/he/ComboBox", //begin v1.x content
({
		previousMessage: "האפשרויות הקודמות",
		nextMessage: "אפשרויות נוספות"
})
//end v1.x content
);

},
'dijit/form/nls/he-il/ComboBox':function(){
define('dijit/form/nls/he-il/ComboBox',{});
},
'*noref':1}});
define("esri/dijit/editing/nls/Editor-all_he-il", [], 1);
