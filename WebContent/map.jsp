<%@ page language="java" pageEncoding="utf-8" contentType="text/html;charset=utf-8"
	import="java.util.*,java.net.*,com.dien.manager.servlet.OperatMapServlet,com.dien.manager.dao.bean.User,com.dien.manager.dao.bean.Config,javax.servlet.http.HttpSession"
	%>
<%
    String mapURLList = OperatMapServlet.mapURLToJSON();
			String ip = request.getLocalAddr();
			ip = "0.0.0.0".equals(ip) ? "localhost" : ip;
			String path = "arcgis_js_api/library/3.0/jsapi/";
			String baseURL = ip + ":" + request.getServerPort()
					+ request.getContextPath() + "/" + path;
			User users = (User) session.getAttribute("user");
			String isManager = "false";
			if (users != null) {
				isManager = "" + users.isDataAuth();
			}
			String companyDescription = Config.getCompanyDescription();
			String companyLogo = Config.getCompanyLogo();
			String companyUrl = Config.getCompanyUrl();
%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">

<html lang="zh">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=7, IE=9" />
<!--The viewport meta tag is used to improve the presentation and behavior of the samples on iOS devices-->
<meta name="viewport" content="initial-scale=1, maximum-scale=1,user-scalable=no" />
<title>地盈石油数据管理-Best</title>
<!-- include dojo theme -->
<link rel="stylesheet" type="text/css"
	href="<%=path%>js/dojo/dijit/themes/claro/claro.css">
<link rel="stylesheet" type="text/css"
	href="<%=path%>js/dojo/dojox/grid/resources/claroGrid.css">
<link rel="stylesheet"
	href="<%=path%>js/dojo/dojox/form/resources/FileInput.css" />
<style type="text/css">
html,body {
	height: 100%;
	width: 100%;
	margin: 0;
	padding: 0;
}

.map {
	height: 100%;
	width: 100%;
	margin: 0;
	padding: 0;
}

.claro .dijitContentPane {
    padding: 0px !important;
}
.map .logo-med {
	background-image: url("<%=companyLogo%>") !important;
	bottom: 5px;
	cursor: pointer;
	height: 36px;
	position: absolute;
	right: 5px;
	width: 65px;
	z-index: 30;
}
#mapDiv_zoom_slider{
    left: 33px;
    position: relative;
    top: 90px !important;
}

</style>
<script type="text/javascript">
    dojoConfig = {
		parseOnLoad:true, 
		url: "<%=baseURL%>",
		bindEncoding:"utf-8"
	};
    
    var isManager=<%=isManager%>;
    var companyDescription = '<%=companyDescription%>';
</script>
<!--  script type="text/javascript" src="<%=path%>"></script-->
<script type="text/javascript" src="http://192.168.0.179:8080/manager/arcgis_js_api/library/3.1/jsapi/index.jsp"></script>
<script type="text/javascript">

	dojo.require("esri.map");
	dojo.require("esri.dijit.BasemapGallery");
	dojo.require("esri.dijit.Measurement");
	dojo.require("esri.dijit.Scalebar");
	dojo.require("esri.layers.osm");
	dojo.require("dojox.validate");
	dojo.require("dojox.validate.web");
	dojo.require("dijit.layout.ContentPane");
	dojo.require("dijit.form.ValidationTextBox");
	dojo.require("dijit.dijit"); // optimize: load dijit layer
	dojo.require("dijit.TitlePane");
	dojo.require("dojo.io.script");
	dojo.require("dojo.parser");
	dojo.require("dijit.form.HorizontalSlider"); 
	dojo.require("dijit.form.HorizontalRule"); 
	dojo.require("dijit.form.HorizontalRuleLabels");
	var map;
	var basemapGallery,measurement,scalebar;
	var mapUrlList = <%=mapURLList%>;
	var companyUrl="<%=companyUrl%>";
	var overLayer;
	function init() {
		esri.main.config.defaults.map.logoLink=companyUrl;
		initMap(0);
	}
	// 地图初始化
	function initMap(selectId) {
		if(map){
			map.destroy();
			map = null;
		}
		if(basemapGallery){
			basemapGallery.destroy();
			basemapGallery = null;
		}
		if(measurement){
			measurement.destroy();
			measurement=null;
		}
		if(scalebar){
			scalebar.destroy();
			scalebar=null;
		}
		//var mapDivContext="<div id=\"map\" data-dojo-type=\"dijit.layout.ContentPane\" >";
		var mapDivContext="<span id=\"info\" style=\"position: absolute; left: 25px; bottom: 50px; color: #000; z-index: 50;\"></span><span id=\"company_description\" style=\"position: absolute; right: 80px; bottom: 5px; color: gray; z-index: 50; font-size: 10pt;\">"+companyDescription+"</span>";
		mapDivContext+="<div style=\"position: absolute; right: 20px; top: 10px; z-Index: 1000;\"><div data-dojo-type=\"dijit.TitlePane\" title=\"底图\" closable=\"false\" open=\"false\"><div data-dojo-type=\"dijit.layout.ContentPane\" data-dojo-id=\"basemapGalleryFatherDiv\" style=\"width: 380px; height: 280px; overflow: auto;\"><div id=\"basemapGalleryDiv\"></div></div></div></div>";
		mapDivContext+="<div style=\"position: absolute; right: 20px; top: 50px; z-Index: 999;\"><div data-dojo-type=\"dijit.TitlePane\" title=\"测量\" closable=\"false\"	open=\"false\"><div data-dojo-type=\"dijit.layout.ContentPane\" data-dojo-id=\"measurementFatherDiv\" style=\"width: 250px; height: 170px; overflow: auto;\"><div id=\"measurementDiv\"></div></div></div></div>";
		mapDivContext+="<div style=\"position: absolute; right: 20px; top: 90px; z-Index: 998;\"><div data-dojo-type=\"dijit.TitlePane\" title=\"叠加\" closable=\"false\" open=\"false\"><div data-dojo-type=\"dijit.layout.ContentPane\" style=\"width: 250px; height: 170px; overflow: auto;\"><div><span>图层url：</span><input data-dojo-id=\"overMapID\" data-dojo-type=\"dijit.form.ValidationTextBox\" data-dojo-props=\"validator:dojox.validate.isUrl\" required=\"true\" trim=\"true\" promptMessage=\"输入图层的url\" missingMessage=\"不能为空\" invalidMessage=\"请输入正确的网址\">";
		mapDivContext+="<span>透明度：</span>";
		mapDivContext+="<div data-dojo-id=\"opacitySlider\" style=\"width:200px;\" name=\"horizontalSlider\" data-dojo-type=\"dijit.form.HorizontalSlider\" data-dojo-props=\"value:0.5,minimum: 0,maximum:1,discreteValues:10,intermediateChanges:true,showButtons:false\" onChange=\"onChangeOpacity\">";
		mapDivContext+="<ol data-dojo-type=\"dijit.form.HorizontalRuleLabels\" container=\"topDecoration\" style=\"height:1.5em;font-size:75%;color:gray;\">";
		mapDivContext+="<li></li><li>20%</li><li>40%</li><li>60%</li><li>80%</li><li></li>";
		mapDivContext+="</ol>";
		mapDivContext+="<div data-dojo-type=\"dijit.form.HorizontalRule\" container=\"bottomDecoration\" count=11 style=\"height:5px;\"></div>";
		mapDivContext+="</div>";
		mapDivContext+="<button data-dojo-type=\"dijit.form.Button\" style=\"color: #000; z-Index: 99;\" onClick=\"addOverLayer();\">叠加</button></div></div></div></div>";
		//平移按钮
		mapDivContext+="<div style=\"position:absolute;left:10px;top:25px;width:60px;height:60px;background-image:url(images/bg-60-60.png);z-index:1000;\">";
		mapDivContext+="<img src=\"images/up1.png\" style=\"position:absolute;left:22px;top:3px;\" onclick=\"javascript:mypan('up');\">";
		mapDivContext+="<img src=\"images/down1.png\" style=\"position:absolute;left:22px;top:37px;\" onclick=\"javascript:mypan('down');\">";
		mapDivContext+="<img src=\"images/left1.png\" style=\"position:absolute;left:6px;top:20px;\" onclick=\"javascript:mypan('left');\">";
		mapDivContext+="<img src=\"images/right1.png\" style=\"position:absolute;left:40px;top:20px;\" onclick=\"javascript:mypan('right');\">";
		mapDivContext+="</div>";
		
		//mapDivContext+="</div>";
		//mainDiv.setContent(mapDivContext);
		mapDiv.setContent(mapDivContext);
		map = new esri.Map("mapDiv");

	    
		dojo.connect(map, "onLoad", function() {
			scalebar = new esri.dijit.Scalebar({map : map,scalebarUnit : 'metric'});
			// 初始化测距离和面积工具
			measurement = new esri.dijit.Measurement({
				map : map,
				defaultAreaUnit : esri.Units.SQUARE_KILOMETERS,
				defaultLengthUnit : esri.Units.KILOMETERS
			}, 'measurementDiv');
			measurement.startup();
			// 调整地图窗口大小
			dojo.connect(dijit.byId('mapDiv'), 'resize', map, map.resize);
			
		});

		//dojo.connect(map, "onLayersAddResult", initEditor);
		dojo.connect(map, "onMouseMove", showCoordinates);
		dojo.connect(map, "onMouseDrag", showCoordinates);

		//加载图层集
		var i;
		var basemaps = [];
		makeBaseMap(basemaps,mapUrlList[selectId]);
		for (i = 0; i < mapUrlList.length; i++) {
			makeBaseMap(basemaps,mapUrlList[i]);
		}
	
		basemapGallery = new esri.dijit.BasemapGallery({
			showArcGISBasemaps : false,
			basemaps : basemaps,
			map : map
		}, "basemapGalleryDiv");

		// 地图发生变化的情况
		basemapGallery.startup();
		basemapGallery.onSelectionChange= function(a) {
			//坐标发生变化后重新初始化map
			if(basemapGallery.getSelected()&&basemapGallery.getSelected().layers[0].wkid!=map.spatialReference.wkid)
			{
				for(var i=0;i<basemapGallery.basemaps.length;i++)
				{
					if(basemapGallery.getSelected()===basemapGallery.basemaps[i])
					{
						initMap(i);		
					}
				}
			}
		};
		basemapGallery.remove(basemapGallery.basemaps[0].id);
		basemapGallery.select(basemapGallery.basemaps[selectId].id);
		map.setExtent(makeExtent(basemapGallery.basemaps[selectId].layers[0].wkid));
	}
	function makeExtent(wkid){
		if(wkid!=4326){
			// 地图显示区域
			var initialExtent = new esri.geometry.Extent({
				"xmin" : 12878262,
				"ymin" : 4798064,
				"xmax" : 13029607,
				"ymax" : 4908745,
				"spatialReference" : {
					"wkid" : 102100
				}
			});
			return initialExtent;
		}else{
			// 地图显示区域
			var point = new esri.geometry.Point([12878262,4798064],new esri.SpatialReference({ wkid:102100 }));  
			var pointMin = esri.geometry.webMercatorToGeographic(point);
			point = new esri.geometry.Point([13029607,4908745],new esri.SpatialReference({ wkid:102100 }));  
			var pointMax = esri.geometry.webMercatorToGeographic(point);
			var initialExtent = new esri.geometry.Extent({
				"xmin" : pointMin.x,
				"ymin" : pointMin.y,
				"xmax" : pointMax.x,
				"ymax" : pointMax.y,
				"spatialReference" : {
					"wkid" : 4326
				}
			});
			return initialExtent;
		}
	}
	//创建一个底图图层
	function makeBaseMap(basemaps,layer){
		var basemapLayer = new esri.dijit.BasemapLayer({
			type : layer.type,
			url : layer.url
		});
		basemapLayer.wkid=layer.wkid;
		var basemap = new esri.dijit.Basemap({
			layers : [ basemapLayer ],
			title : layer.﻿title ? layer.﻿title : layer["﻿title"],
			thumbnailUrl : layer.thumbnailUrl
		});
		basemaps.push(basemap);
	}

	// 显示坐标信息
	// 显示坐标信息
function showCoordinates(evt) {
		if (map.spatialReference&&evt.mapPoint.x && evt.mapPoint.y) {
			var point = map.spatialReference.wkid==4326 ? evt.mapPoint : esri.geometry.webMercatorToGeographic(evt.mapPoint);
			dojo.byId("info").innerHTML = dojo.number.format(point.x,{pattern:'#.000000'}) + ", "+ dojo.number.format(point.y,{pattern:'#.000000'});
		}
}


	//新建叠加图层
	function addOverLayer() {
		if(overLayer){
			map.removeLayer(overLayer);
			overLayer=null;	
		}
		if (overMapID.validate()) {
			validLayer(overMapID.getValue())
		
		}else{
			alert("请输入正确URL");
			return;
		}

	}
	
	// 对图层网址验证
	function validLayer(url){
		var data = {"oper" : "checkurl","url" : url};
		dojo.xhrPost({
			url : 'free.so',
			content : data,
			preventCache:true,
			load : function(json) {
				var json = dojo.eval("(" + json + ")");
				if(json.ret){
	   	    	    overLayer = new esri.layers.ArcGISDynamicMapServiceLayer(url, {"opacity" : opacitySlider.getValue()});
					map.addLayer(overLayer);
		    	}else{
		    	    alert("图层url经检查是错误的！");
		    	}
			},
			error : function(msg) {
				alert("检查图层url失败!");
			}
		});
	}
	function onChangeOpacity(value){
		if(overLayer){
			overLayer.setOpacity(value);
		}
	}
	//地图平移控件
	function mypan(direction){
		//alert(direction);
		if(direction=='up'){
			map.panUp();
		}else if(direction=='down'){
			map.panDown();
		}else if(direction=='left'){
			map.panLeft();
		}else if(direction=='right'){
			map.panRight();
		}
	}
	dojo.addOnLoad(init);
</script>
</head>
<body class="claro">
	<div data-dojo-id="mapDiv" id=mapDiv data-dojo-type="dijit.layout.ContentPane"></div>
</body>
</html>
