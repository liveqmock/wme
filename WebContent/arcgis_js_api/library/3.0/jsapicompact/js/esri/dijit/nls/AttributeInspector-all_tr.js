require({cache:{
'dijit/form/nls/tr/validate':function(){
define(
"dijit/form/nls/tr/validate", //begin v1.x content
({
	invalidMessage: "Girilen değer geçersiz.",
	missingMessage: "Bu değer gerekli.",
	rangeMessage: "Bu değer aralık dışında."
})
//end v1.x content
);

},
'dijit/_editor/nls/tr/commands':function(){
define(
"dijit/_editor/nls/tr/commands", //begin v1.x content
({
	'bold': 'Kalın',
	'copy': 'Kopyala',
	'cut': 'Kes',
	'delete': 'Sil',
	'indent': 'Girinti',
	'insertHorizontalRule': 'Yatay Kural',
	'insertOrderedList': 'Numaralı Liste',
	'insertUnorderedList': 'Madde İşaretli Liste',
	'italic': 'İtalik',
	'justifyCenter': 'Ortaya Hizala',
	'justifyFull': 'Yasla',
	'justifyLeft': 'Sola Hizala',
	'justifyRight': 'Sağa Hizala',
	'outdent': 'Çıkıntı',
	'paste': 'Yapıştır',
	'redo': 'Yinele',
	'removeFormat': 'Biçimi Kaldır',
	'selectAll': 'Tümünü Seç',
	'strikethrough': 'Üstü Çizili',
	'subscript': 'Alt Simge',
	'superscript': 'Üst Simge',
	'underline': 'Altı Çizili',
	'undo': 'Geri Al',
	'unlink': 'Bağlantıyı Kaldır',
	'createLink': 'Bağlantı Oluştur',
	'toggleDir': 'Yönü Değiştir',
	'insertImage': 'Resim Ekle',
	'insertTable': 'Tablo Ekle/Düzenle',
	'toggleTableBorder': 'Tablo Kenarlığını Göster/Gizle',
	'deleteTable': 'Tabloyu Sil',
	'tableProp': 'Tablo Özelliği',
	'htmlToggle': 'HTML Kaynağı',
	'foreColor': 'Ön Plan Rengi',
	'hiliteColor': 'Arka Plan Rengi',
	'plainFormatBlock': 'Paragraf Stili',
	'formatBlock': 'Paragraf Stili',
	'fontSize': 'Yazı Tipi Boyutu',
	'fontName': 'Yazı Tipi Adı',
	'tabIndent': 'Sekme Girintisi',
	"fullScreen": "Tam Ekranı Aç/Kapat",
	"viewSource": "HTML Kaynağını Görüntüle",
	"print": "Yazdır",
	"newPage": "Yeni Sayfa",
	/* Error messages */
	'systemShortcut': '"${0}" işlemi yalnızca tarayıcınızda bir klavye kısayoluyla birlikte kullanılabilir. Şunu kullanın: ${1}.'
})

//end v1.x content
);

},
'dojo/cldr/nls/tr/gregorian':function(){
define(
//begin v1.x content
{
	"months-format-narrow": [
		"O",
		"Ş",
		"M",
		"N",
		"M",
		"H",
		"T",
		"A",
		"E",
		"E",
		"K",
		"A"
	],
	"field-weekday": "Haftanın Günü",
	"dateFormatItem-yyQQQQ": "QQQQ yy",
	"dateFormatItem-yQQQ": "QQQ y",
	"dateFormatItem-yMEd": "dd.MM.yyyy EEE",
	"dateFormatItem-MMMEd": "dd MMM E",
	"eraNarrow": [
		"MÖ",
		"MS"
	],
	"dateFormat-long": "dd MMMM y",
	"months-format-wide": [
		"Ocak",
		"Şubat",
		"Mart",
		"Nisan",
		"Mayıs",
		"Haziran",
		"Temmuz",
		"Ağustos",
		"Eylül",
		"Ekim",
		"Kasım",
		"Aralık"
	],
	"dateFormatItem-EEEd": "d EEE",
	"dayPeriods-format-wide-pm": "PM",
	"dateFormat-full": "dd MMMM y EEEE",
	"dateFormatItem-Md": "dd/MM",
	"field-era": "Miladi Dönem",
	"dateFormatItem-yM": "M/yyyy",
	"months-standAlone-wide": [
		"Ocak",
		"Şubat",
		"Mart",
		"Nisan",
		"Mayıs",
		"Haziran",
		"Temmuz",
		"Ağustos",
		"Eylül",
		"Ekim",
		"Kasım",
		"Aralık"
	],
	"timeFormat-short": "HH:mm",
	"quarters-format-wide": [
		"1. çeyrek",
		"2. çeyrek",
		"3. çeyrek",
		"4. çeyrek"
	],
	"timeFormat-long": "HH:mm:ss z",
	"field-year": "Yıl",
	"dateFormatItem-yMMM": "MMM y",
	"dateFormatItem-yQ": "Q yyyy",
	"field-hour": "Saat",
	"months-format-abbr": [
		"Oca",
		"Şub",
		"Mar",
		"Nis",
		"May",
		"Haz",
		"Tem",
		"Ağu",
		"Eyl",
		"Eki",
		"Kas",
		"Ara"
	],
	"dateFormatItem-yyQ": "Q yy",
	"timeFormat-full": "HH:mm:ss zzzz",
	"field-day-relative+0": "Bugün",
	"field-day-relative+1": "Yarın",
	"field-day-relative+2": "Yarından sonraki gün",
	"dateFormatItem-H": "HH",
	"field-day-relative+3": "Üç gün sonra",
	"months-standAlone-abbr": [
		"Oca",
		"Şub",
		"Mar",
		"Nis",
		"May",
		"Haz",
		"Tem",
		"Ağu",
		"Eyl",
		"Eki",
		"Kas",
		"Ara"
	],
	"quarters-format-abbr": [
		"Ç1",
		"Ç2",
		"Ç3",
		"Ç4"
	],
	"quarters-standAlone-wide": [
		"1. çeyrek",
		"2. çeyrek",
		"3. çeyrek",
		"4. çeyrek"
	],
	"dateFormatItem-M": "L",
	"days-standAlone-wide": [
		"Pazar",
		"Pazartesi",
		"Salı",
		"Çarşamba",
		"Perşembe",
		"Cuma",
		"Cumartesi"
	],
	"dateFormatItem-MMMMd": "dd MMMM",
	"dateFormatItem-yyMMM": "MMM yy",
	"timeFormat-medium": "HH:mm:ss",
	"dateFormatItem-Hm": "HH:mm",
	"quarters-standAlone-abbr": [
		"Ç1",
		"Ç2",
		"Ç3",
		"Ç4"
	],
	"eraAbbr": [
		"MÖ",
		"MS"
	],
	"field-minute": "Dakika",
	"field-dayperiod": "AM/PM",
	"days-standAlone-abbr": [
		"Paz",
		"Pzt",
		"Sal",
		"Çar",
		"Per",
		"Cum",
		"Cmt"
	],
	"dateFormatItem-d": "d",
	"dateFormatItem-ms": "mm:ss",
	"field-day-relative+-1": "Dün",
	"field-day-relative+-2": "Evvelsi gün",
	"field-day-relative+-3": "Üç gün önce",
	"dateFormatItem-MMMd": "dd MMM",
	"dateFormatItem-MEd": "dd/MM E",
	"dateFormatItem-yMMMM": "MMMM y",
	"field-day": "Gün",
	"days-format-wide": [
		"Pazar",
		"Pazartesi",
		"Salı",
		"Çarşamba",
		"Perşembe",
		"Cuma",
		"Cumartesi"
	],
	"field-zone": "Saat Dilimi",
	"dateFormatItem-y": "y",
	"months-standAlone-narrow": [
		"O",
		"Ş",
		"M",
		"N",
		"M",
		"H",
		"T",
		"A",
		"E",
		"E",
		"K",
		"A"
	],
	"dateFormatItem-yyMM": "MM/yy",
	"dateFormatItem-hm": "h:mm a",
	"days-format-abbr": [
		"Paz",
		"Pzt",
		"Sal",
		"Çar",
		"Per",
		"Cum",
		"Cmt"
	],
	"eraNames": [
		"Milattan Önce",
		"Milattan Sonra"
	],
	"days-format-narrow": [
		"P",
		"P",
		"S",
		"Ç",
		"P",
		"C",
		"C"
	],
	"field-month": "Ay",
	"days-standAlone-narrow": [
		"P",
		"P",
		"S",
		"Ç",
		"P",
		"C",
		"C"
	],
	"dateFormatItem-MMM": "LLL",
	"dayPeriods-format-wide-am": "AM",
	"dateFormatItem-MMMMEd": "dd MMMM E",
	"dateFormat-short": "dd.MM.yyyy",
	"field-second": "Saniye",
	"dateFormatItem-yMMMEd": "dd MMM y EEE",
	"dateFormatItem-Ed": "d E",
	"field-week": "Hafta",
	"dateFormat-medium": "dd MMM y",
	"dateFormatItem-mmss": "mm:ss",
	"dateFormatItem-Hms": "HH:mm:ss",
	"dateFormatItem-hms": "h:mm:ss a",
	"dateFormatItem-yyyy": "y"
}
//end v1.x content
);
},
'dojo/cldr/nls/tr/number':function(){
define(
//begin v1.x content
{
	"group": ".",
	"percentSign": "%",
	"exponential": "E",
	"scientificFormat": "#E0",
	"percentFormat": "% #,##0",
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
'dijit/form/nls/tr/ComboBox':function(){
define(
"dijit/form/nls/tr/ComboBox", //begin v1.x content
({
		previousMessage: "Önceki seçenekler",
		nextMessage: "Diğer seçenekler"
})
//end v1.x content
);

},
'*noref':1}});
define("esri/dijit/nls/AttributeInspector-all_tr", [], 1);
