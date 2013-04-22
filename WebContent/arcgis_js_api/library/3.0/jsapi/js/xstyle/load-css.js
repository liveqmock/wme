//>>built
define("xstyle/load-css",[],function(){"use strict";var _1="onreadystatechange",_2="onload",_3="createElement",_4=false,_5=document,_6=typeof _css_cache=="undefined"?{}:_css_cache,_7,_8={"event-link-onload":false,"dom-create-style-element":!document.createStyleSheet},_9=_5.head||(_5.head=_5.getElementsByTagName("head")[0]);function _a(_b){return _8[_b];};function _c(_d,_e){var _f=_d[_3]("link");_f.rel="stylesheet";_f.type="text/css";if(_e){_f.href=_e;}return _f;};function _10(_11,_12){return _11.lastIndexOf(".")<=_11.lastIndexOf("/")?_11+"."+_12:_11;};function _13(_14){var _15=_14.split("!"),suf,i=1,_16;while((suf=_15[i++])){_16=suf.split("=",2);_15[_16[0]]=_16.length==2?_16[1]:true;}return _15;};if(!_a("bundled-css")){var _17=function(_18,cb){if(require.onError){require.onError=(function(_19){return function(){_4=true;_19.apply(this,arguments);};})(require.onError);}function _1a(_1b,cb){var _1c=_1b.link;_1c[_1]=_1c[_2]=function(){if(!_1c.readyState||_1c.readyState=="complete"){_8["event-link-onload"]=true;_1d(_1b);cb();}};};var _1e;function _1f(){if(!_1e){_1e=document[_3]("div");_1e.id="_cssx_load_test";_1e.style.cssText="position:absolute;top:-999px;left:-999px;";_5.body.appendChild(_1e);}return _5.defaultView.getComputedStyle(_1e,null).marginTop=="-5px";};function _20(_21){var _22,_23,_24=false;try{_22=_21.sheet||_21.styleSheet;if(_22){_23=_22.cssRules||_22.rules;_24=_23?_23.length>0:_23!==_7;if(_24&&navigator.userAgent.indexOf("Chrome")>=0){_22.insertRule("#_cssx_load_test{margin-top:-5px;}",0);_24=_1f();_22.deleteRule(0);}}}catch(ex){_24=(ex.code==1000)||(ex.message.match(/security|denied/i));}return _24;};function _25(_26,cb){if(_20(_26.link)){_1d(_26);cb();}else{if(!_4){setTimeout(function(){_25(_26,cb);},_26.wait);}}};function _1d(_27){var _28=_27.link;_28[_1]=_28[_2]=null;};var _29;function _2a(){if(!_29){_29=true;cb();}};_1a(_18,_2a);if(!_a("event-link-onload")){_25(_18,_2a);}};}function _2b(css){if(_a("dom-create-style-element")){_2c=document.createElement("style");_2c.setAttribute("type","text/css");_2c.appendChild(document.createTextNode(css));_9.insertBefore(_2c,_9.firstChild);return _2c;}else{var _2c=document.createStyleSheet();_2c.cssText=css;return _2c.owningElement;}};return function(_2d,_2e,_2f){var _30=_2d.split(","),_31=_30.length,_32=function(){if(--_31==0){_2e(_33.sheet||_33.styleSheet);}};for(var i=0,_34;i<_30.length;i++,_34=url){_2d=_30[i];var _35=_6[_2d];if(_35){_33=_2b(_35);return _32();}var _36=_13(_2d),_37=_36.shift(),url=_10(_37,"css"),_33=_c(_5),_38="nowait" in _36?_36.nowait!="false":!!(_2f&&_2f.cssDeferLoad),_39={link:_33,url:url,wait:_2f&&_2f.cssWatchPeriod||50};_17(_39,_32);if(_38){_2e(_33);}_33.href=url;_9.appendChild(_33);}};});