require({cache:{
'dijit/form/nls/zh/validate':function(){
define(
"dijit/form/nls/zh/validate", //begin v1.x content
({
	invalidMessage: "输入的值无效。",
	missingMessage: "此值是必需值。",
	rangeMessage: "此值超出范围。"
})
//end v1.x content
);

},
'dijit/form/nls/zh-cn/validate':function(){
define('dijit/form/nls/zh-cn/validate',{});
},
'dijit/_editor/nls/zh/commands':function(){
define(
"dijit/_editor/nls/zh/commands", //begin v1.x content
({
	'bold': '粗体',
	'copy': '复制',
	'cut': '剪切',
	'delete': '删除',
	'indent': '增加缩进',
	'insertHorizontalRule': '水平线',
	'insertOrderedList': '编号列表',
	'insertUnorderedList': '符号列表',
	'italic': '斜体',
	'justifyCenter': '居中',
	'justifyFull': '对齐',
	'justifyLeft': '左对齐',
	'justifyRight': '右对齐',
	'outdent': '减少缩进',
	'paste': '粘贴',
	'redo': '重做',
	'removeFormat': '除去格式',
	'selectAll': '全选',
	'strikethrough': '删除线',
	'subscript': '下标',
	'superscript': '上标',
	'underline': '下划线',
	'undo': '撤销',
	'unlink': '除去链接',
	'createLink': '创建链接',
	'toggleDir': '固定方向',
	'insertImage': '插入图像',
	'insertTable': '插入/编辑表',
	'toggleTableBorder': '切换表边框',
	'deleteTable': '删除表',
	'tableProp': '表属性',
	'htmlToggle': 'HTML 源代码',
	'foreColor': '前景色',
	'hiliteColor': '背景色',
	'plainFormatBlock': '段落样式',
	'formatBlock': '段落样式',
	'fontSize': '字体大小',
	'fontName': '字体名称',
	'tabIndent': '制表符缩进',
	"fullScreen": "切换全屏幕",
	"viewSource": "查看 HTML 源代码",
	"print": "打印",
	"newPage": "新建页面",
	/* Error messages */
	'systemShortcut': '只能在浏览器中通过键盘快捷方式执行“${0}”操作。使用 ${1}。'
})

//end v1.x content
);

},
'dijit/_editor/nls/zh-cn/commands':function(){
define('dijit/_editor/nls/zh-cn/commands',{});
},
'dojo/cldr/nls/zh/gregorian':function(){
define(
//begin v1.x content
{
	"months-format-narrow": [
		"1月",
		"2月",
		"3月",
		"4月",
		"5月",
		"6月",
		"7月",
		"8月",
		"9月",
		"10月",
		"11月",
		"12月"
	],
	"field-weekday": "周天",
	"dateFormatItem-yQQQ": "y年QQQ",
	"dateFormatItem-yMEd": "y年M月d日，E",
	"dateFormatItem-MMMEd": "MMMd日E",
	"eraNarrow": [
		"公元前",
		"公元"
	],
	"dayPeriods-format-wide-earlyMorning": "清晨",
	"dayPeriods-format-wide-morning": "上午",
	"dateFormat-long": "y年M月d日",
	"months-format-wide": [
		"1月",
		"2月",
		"3月",
		"4月",
		"5月",
		"6月",
		"7月",
		"8月",
		"9月",
		"10月",
		"11月",
		"12月"
	],
	"dateTimeFormat-medium": "{1} {0}",
	"dayPeriods-format-wide-pm": "下午",
	"dateFormat-full": "y年M月d日EEEE",
	"dateFormatItem-Md": "M-d",
	"field-era": "时期",
	"dateFormatItem-yM": "yyyy-M",
	"months-standAlone-wide": [
		"一月",
		"二月",
		"三月",
		"四月",
		"五月",
		"六月",
		"七月",
		"八月",
		"九月",
		"十月",
		"十一月",
		"十二月"
	],
	"timeFormat-short": "ah:mm",
	"quarters-format-wide": [
		"第1季度",
		"第2季度",
		"第3季度",
		"第4季度"
	],
	"timeFormat-long": "zah时mm分ss秒",
	"field-year": "年",
	"dateFormatItem-yMMM": "y年MMM",
	"dateFormatItem-yQ": "y年QQQ",
	"dateFormatItem-yyyyMMMM": "y年MMMM",
	"field-hour": "小时",
	"dateFormatItem-MMdd": "MM-dd",
	"months-format-abbr": [
		"1月",
		"2月",
		"3月",
		"4月",
		"5月",
		"6月",
		"7月",
		"8月",
		"9月",
		"10月",
		"11月",
		"12月"
	],
	"dateFormatItem-yyQ": "yy年第Q季度",
	"timeFormat-full": "zzzzah时mm分ss秒",
	"field-day-relative+0": "今天",
	"field-day-relative+1": "明天",
	"field-day-relative+2": "后天",
	"dateFormatItem-H": "H时",
	"months-standAlone-abbr": [
		"一月",
		"二月",
		"三月",
		"四月",
		"五月",
		"六月",
		"七月",
		"八月",
		"九月",
		"十月",
		"十一月",
		"十二月"
	],
	"quarters-format-abbr": [
		"1季",
		"2季",
		"3季",
		"4季"
	],
	"quarters-standAlone-wide": [
		"第1季度",
		"第2季度",
		"第3季度",
		"第4季度"
	],
	"dateFormatItem-M": "M月",
	"days-standAlone-wide": [
		"星期日",
		"星期一",
		"星期二",
		"星期三",
		"星期四",
		"星期五",
		"星期六"
	],
	"dateFormatItem-yyMMM": "yy年MMM",
	"timeFormat-medium": "ah:mm:ss",
	"dateFormatItem-Hm": "H:mm",
	"quarters-standAlone-abbr": [
		"1季",
		"2季",
		"3季",
		"4季"
	],
	"eraAbbr": [
		"公元前",
		"公元"
	],
	"field-minute": "分钟",
	"field-dayperiod": "上午/下午",
	"days-standAlone-abbr": [
		"周日",
		"周一",
		"周二",
		"周三",
		"周四",
		"周五",
		"周六"
	],
	"dayPeriods-format-wide-night": "晚上",
	"dateFormatItem-d": "d日",
	"dateFormatItem-ms": "mm:ss",
	"field-day-relative+-1": "昨天",
	"dateFormatItem-h": "ah时",
	"dateTimeFormat-long": "{1}{0}",
	"field-day-relative+-2": "前天",
	"dateFormatItem-MMMd": "MMMd日",
	"dayPeriods-format-wide-midDay": "中午",
	"dateFormatItem-MEd": "M-dE",
	"dateTimeFormat-full": "{1}{0}",
	"field-day": "日",
	"days-format-wide": [
		"星期日",
		"星期一",
		"星期二",
		"星期三",
		"星期四",
		"星期五",
		"星期六"
	],
	"field-zone": "区域",
	"dateFormatItem-y": "y年",
	"months-standAlone-narrow": [
		"1月",
		"2月",
		"3月",
		"4月",
		"5月",
		"6月",
		"7月",
		"8月",
		"9月",
		"10月",
		"11月",
		"12月"
	],
	"dateFormatItem-yyMM": "yy-MM",
	"dateFormatItem-hm": "ah:mm",
	"days-format-abbr": [
		"周日",
		"周一",
		"周二",
		"周三",
		"周四",
		"周五",
		"周六"
	],
	"dateFormatItem-yMMMd": "y年MMMd日",
	"eraNames": [
		"公元前",
		"公元"
	],
	"days-format-narrow": [
		"日",
		"一",
		"二",
		"三",
		"四",
		"五",
		"六"
	],
	"field-month": "月",
	"days-standAlone-narrow": [
		"日",
		"一",
		"二",
		"三",
		"四",
		"五",
		"六"
	],
	"dateFormatItem-MMM": "LLL",
	"dayPeriods-format-wide-am": "上午",
	"dateFormatItem-MMMMdd": "MMMMdd日",
	"dayPeriods-format-wide-weeHours": "凌晨",
	"dateFormat-short": "yy-M-d",
	"dayPeriods-format-wide-afternoon": "下午",
	"field-second": "秒钟",
	"dateFormatItem-yMMMEd": "y年MMMd日EEE",
	"dateFormatItem-Ed": "d日E",
	"field-week": "周",
	"dateFormat-medium": "yyyy-M-d",
	"dateFormatItem-yyyyM": "y年M月",
	"dateTimeFormat-short": "{1} {0}",
	"dateFormatItem-Hms": "H:mm:ss",
	"dateFormatItem-hms": "ah:mm:ss",
	"dateFormatItem-yyyy": "y年"
}
//end v1.x content
);
},
'dojo/cldr/nls/zh-cn/gregorian':function(){
define('dojo/cldr/nls/zh-cn/gregorian',{});
},
'dojo/cldr/nls/zh/number':function(){
define(
//begin v1.x content
{
	"decimalFormat": "#,##0.###",
	"group": ",",
	"scientificFormat": "#E0",
	"percentFormat": "#,##0%",
	"currencyFormat": "¤#,##0.00",
	"decimal": "."
}
//end v1.x content
);
},
'dojo/cldr/nls/zh-cn/number':function(){
define('dojo/cldr/nls/zh-cn/number',{});
},
'dijit/form/nls/zh/ComboBox':function(){
define(
"dijit/form/nls/zh/ComboBox", //begin v1.x content
({
		previousMessage: "先前选项",
		nextMessage: "更多选项"
})
//end v1.x content
);

},
'dijit/form/nls/zh-cn/ComboBox':function(){
define('dijit/form/nls/zh-cn/ComboBox',{});
},
'*noref':1}});
define("esri/dijit/nls/AttributeInspector-all_zh-cn", [], 1);
