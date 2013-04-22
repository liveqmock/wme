//定义显示字段
var basemapGallery;
var currentLayers = {};
var currentLayer;
var createLayerColumnGrid;
var layersGrid;
var featureGrid;
var layerColumnInfoGrid;
var myEditor;
var measurement;
var templatePicker;
var scalebar;
var overLayer;
var pingTimer;
// esri 数据类型
var dojoEsriType = {
	"esriFieldTypeSmallInteger" : "",
	"esriFieldTypeInteger" : "",
	"esriFieldTypeSingle" : "",
	"esriFieldTypeDouble" : "",
	"esriFieldTypeString" : "",
	"esriFieldTypeDate" : "",
	"esriFieldTypeOID" : "",
	"esriFieldTypeGeometry" : "",
	"esriFieldTypeBlob" : "",
	"esriFieldTypeRaster" : "",
	"esriFieldTypeGUID" : "",
	"esriFieldTypeGlobalID" : "",
	"esriFieldTypeXML" : ""
};
function init() {

	esri.main.config.defaults.map.logoLink=companyUrl;
	

	
	/**
	 * 初试化用户权限界面
	 */
	initPrivileges(); 

	dojo.connect(mainTabContainer, "selectChild", function(tabList) {
		map.infoWindow.hide();
		//当选择一个图层的时候
		if (tabList.title != "图层"){
			currentLayer=currentLayers[tabList.layerName];
			if(currentLayer.featureLayer){
				currentLayer.featureLayer.setEditable(true);
				initEditor([{layer:currentLayer.featureLayer,success:true}]);
			}
		}else{//隐藏绘图栏
			dojo.byId('editContentPane').style.display="none";
			mainLayoutContainer.resize();
		}
	});

	//每隔60s ping一次后台，避免session失效
	pingTimer = setInterval("connectionFunc()", 60000);
}

// 心跳方法
function connectionFunc()
{
				
		dojo.xhrPost({
  		url : 'Ping.so',
  		content : {
  			
  		},
  		dataType : "text",
  		load : function(msg) {
  			//alert(msg);
  			
  		},
  		error : function(msg) {
  			//alert("加载图层模板异常!");
  		}
		});
		//clearTimeout(pingTimer);
		//pingTimer = setTimeout("connectionFunc()", 60000);
		
		/*$.ajax({
			type : "POST",
			url : "Ping.so",
			dataType : "json",
			data : {
				
			},
			success : function(responTxt) {
				// 获取数据
				
			}
		});*/
}

//地图初始化
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
	//地图显示div
	var mapDivContext="<span id=\"info\" style=\"position: absolute; left: 25px; bottom: 50px; color: #000; z-index: 50;\"></span><span class=\"companydescription\" >"+companyDescription+"</span>";
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

	
	mapDivContext+="<div style=\"position:absolute;left:25px;top:25px;width:60px;height:60px;background-image:url(images/bg-60-60.png);z-index:1000;\">";
	mapDivContext+="<img src=\"images/up1.png\" style=\"position:absolute;left:22px;top:3px;\" onclick=\"javascript:mypan('up');\">";
	mapDivContext+="<img src=\"images/down1.png\" style=\"position:absolute;left:22px;top:37px;\" onclick=\"javascript:mypan('down');\">";
	mapDivContext+="<img src=\"images/left1.png\" style=\"position:absolute;left:6px;top:20px;\" onclick=\"javascript:mypan('left');\">";
	mapDivContext+="<img src=\"images/right1.png\" style=\"position:absolute;left:40px;top:20px;\" onclick=\"javascript:mypan('right');\">";
	mapDivContext+="</div>";
	
	mapDiv.setContent(mapDivContext);
	
	//esri.config.defaults.map.slider = { right:"100px", top:"10px", width:null, height:"100px" };



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
		
		dojo.style(dojo.byId('mapDiv_zoom_slider'), {
			  position:"relative",
			  left: "33px",
			  top: "90px",
			  width:"30px"
		});
		
	});

	//dojo.connect(map, "onLayersAddResult", initEditor);
	dojo.connect(map, "onMouseMove", showCoordinates);
	dojo.connect(map, "onMouseDrag", showCoordinates);

	//加载图层集
	var i;
	var basemaps = [];
	if(mapUrlList[selectId])
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

function mypan(direction){
	//alert(direction);
	if(direction=='up'){
		map.panUp();
	}else if(direction=='down'){
		map.panDown();
	}else if(direction=='left'){
		//alert('map.panLeft()');
		map.panLeft();
	}else if(direction=='right'){
		map.panRight();
	}
}

//地图初始化地图范围定位在北京
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
//创建一个图层
function makeBaseMap(basemaps,layer){
	var parameters={};
	if(layer.type)parameters.type=layer.type;
	if(layer.url)parameters.url=layer.url;
	var basemapLayer = new esri.dijit.BasemapLayer(parameters);
	basemapLayer.wkid=layer.wkid;
	var basemap = new esri.dijit.Basemap({
		layers : [ basemapLayer ],
		title : layer.﻿title ? layer.﻿title : layer["﻿title"],
		thumbnailUrl : layer.thumbnailUrl
	});
	basemaps.push(basemap);
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

//改变图层的透明度
function onChangeOpacity(value){
	if(overLayer){
		overLayer.setOpacity(value);
	}
}

// 显示坐标信息
function showCoordinates(evt) {
	if (evt.mapPoint.x && evt.mapPoint.y) {
		var point = esri.geometry.webMercatorToGeographic(evt.mapPoint);
		dojo.byId("info").innerHTML = dojo.number.format(point.x,{pattern:'#.000000'}) + ", "+ dojo.number.format(point.y,{pattern:'#.000000'});
	}
}

//新建图层字段列表grid
function initLayerColumnGrid() {
	var store = new dojo.data.ItemFileWriteStore({
		data : {
			identifier : "id",
			items : [ ]
		}
	});
	/*设置布局 */
	var layout = [ [ {
		name : '字段名称',
		field : 'name'

	}, {
		name : '类型',
		field : 'type',
		formatter : function(item, rowIndex, cell) {
				return tableColumnTypeDescription[item] ? tableColumnTypeDescription[item] : "其它";
		}
	}] ];

	/* create a new createLayerColumnGrid */
	createLayerColumnGrid = new dojox.grid.DataGrid({
		id : 'createLayerColumnGrid',
		store : store,
		structure : layout,
		rowSelector : '20px'
	});

	/* append the new createLayerColumnGrid to the div */
	createLayerColumnGrid.placeAt("createLayerColumnGridDiv");

	// CellClick事件，用来触发update delete detail等按钮
	createLayerColumnGrid.on("CellClick",
			function(evt) {
				var idx = evt.rowIndex, idc = evt.cellIndex, item = this.getItem(idx), store = this.store;
				id = store.getValue(item, "id");
			});
	createLayerColumnGrid.startup();
}




//显示图层属性列信息
function initLayerColumnInfoGrid(items) {

	var store = new dojo.data.ItemFileWriteStore({
		data : {
			identifier : "ID",
			items : [ ]
		}
	});

	/*设置布局 */
	var layout = [ [ {
		name : '字段名称',
		field : 'NAME',
		width : '100px'
	}, {
		name : '类型',
		field : 'TYPE',
		width : '200px',
		formatter : function(item, rowIndex, cell) {
				return tableColumnTypeDescription[item] ? tableColumnTypeDescription[item] : "其它";
		}
	}]];

	/* create a new createLayerColumnGrid */
	layerColumnInfoGrid = new dojox.grid.DataGrid({
		id : 'layerColumnInfoGrid',
		store : store,
		structure : layout,
		rowSelector : '20px'
	});

	/* append the new createLayerColumnGrid to the div */
	layerColumnInfoGrid.placeAt("layerColumnGridInfoDiv");
	/* Call startup() to render the layerColumnGrid */
	layerColumnInfoGrid.startup();
}
//加载图层列表
function loadLayers() {

	dojo.xhrPost({
		url : 'operatMap.do',
		content : {
			"oper" : "layers"
		},
		dataType : "json",
		preventCache:true,
		load : function(json) {
			if (json) {
				var info = dojo.eval("(" + json + ")");
				var data = {
					identifier : "tablename",
					items : info.layers
				};

				var store = new dojo.data.ItemFileWriteStore({
					data : data
				});
				layersGrid.setStore(store);
			} else {
				alert("没有得到图层列表信息！");
			}
		},
		error : function(msg) {
			alert("获得图层列表信息时出现异常!");
		}
	});
}
// 初始化图层列表
function initLayersGrid() {
	/* set up data store */
	var data = {
		identifier : "tablename",
		items : []
	};
	var store = new dojo.data.ItemFileWriteStore({
		data : data
	});



	/* 新建新的网格 */
	layersGrid = new dojox.grid.DataGrid({
		id : 'layersGrid',
		store : store,
		structure : layersGridStructure,/**这个变量是定义在全局变量中的**/
		selectionMode : "extended", // none,single,multiple
		loadingMessage : "请等待，数据正在加载中......",
		sortFields:[{ attribute: "id", descending: false }],
		errorMessage : "对不起，你的请求发生错误!",
		columnReordering : true,// 此属性设置为true,可以拖拽标题栏，更换列顺序
		rowSelector : '20px',
			width: "100%", 
			height: "100%"
	});

	/* 追加网格到div */
	layersGrid.placeAt("layersGridDiv");

	// CellClick事件，用来触发update delete detail等按钮
	layersGrid.on("CellClick", layersGridCellClick);
	layersGrid.startup();
	
	loadLayers();
}

// 初始化一个图层
function showLayer() {
	var fieldInfos = [];
	var length = currentLayer.columndef.length;
	var i = 0;
	var fields = [ {
		"name" : "OBJECTID",
		"alias" : "OBJECTID",
		"type" : "esriFieldTypeOID"
	} ];
	var outFields = [];
	while (i < length) {
		var c = currentLayer.columndef[i];
		if (c.NAME != "SHAPE") {
			fields.push({
				"name" : c.NAME,
				"alias" : c.ALIAS,
				"type" : c.TYPE,
				"length" : (c.LENGTH == 0 ? 255 : c.LENGTH)
			});
			fieldInfos.push({
				'fieldName' : c.NAME,
				'isEditable' : true,
				'tooltip' : '',
				'label' : c.NAME
			});
			outFields.push(c.NAME);
		}
		i++;
	}

	var layerDefinition = {
		"geometryType" : currentLayer.type,
		"objectIdField" : "OBJECTID",
		"fields" : fields
	};
	var featureCollection = {
		"layerDefinition" : {
			"geometryType" : currentLayer.type,
			"objectIdField" : "OBJECTID",
			"fields" : fields
		},
		"featureSet" : {
			"features" : [],
			"geometryType" : currentLayer.type
		}
	};
	
	var featureLayer = new esri.layers.FeatureLayer(featureCollection, {_editable:true,objectIdField:"OBJECTID",outFields : [ '*' ]});
	var renderer = createSymbol(currentLayer.type);
	featureLayer.setRenderer(renderer);
	featureLayer.setEditable(true);
	featureLayer._nextId=100000000;
	currentLayer.featureLayer = featureLayer;
	map.addLayers([ featureLayer ]);
	initEditor([{layer:currentLayer.featureLayer,success:true}]);

}

// 编辑修改后处理结果
function initEditor(results) {
	dojo.byId('editContentPane').style.display="inline";
	mainLayoutContainer.resize();
	dojo.byId('editContentPane').innerHTML='<div id="templatePickerDiv" ></div><div id="editorDiv"></div>';
	var layers = dojo.map(results, function(result) {
		var fieldInfos = dojo.map(result.layer.fields, function(field) {
			if (field.name === 'SYMBOL') {
				return {
					'fieldName' : field.name,
					'lable' : field.alias,
					'isEditable' : false,
					'tooltip' : ''
				};
			} else if (field.name === 'USERID') {
				return {
					'fieldName' : field.name,
					'lable' : field.alias,
					'isEditable' : false,
					'tooltip' : ''
				};
			} else {
				return {
					'fieldName' : field.name,
					'lable' : field.alias
				};
			}
		});
		return {
			featureLayer : result.layer,
			'fieldInfos' : fieldInfos
		};
	});
	var templateLayers = dojo.map(results, function(result) {
		return result.layer;
	});
	if (templatePicker) {
		templatePicker.destroy();
	}
	templatePicker = new esri.dijit.editing.TemplatePicker({
		featureLayers : templateLayers,
		rows : 'auto',
		columns : 'auto',
		style : 'height:100%;width:100%;'
	}, 'templatePickerDiv');

	templatePicker.startup();

	dojo.connect(templatePicker,"onSelectionChange",
					function() {
						if (templatePicker.getSelected()) {
							currentLayer.symbol = templatePicker.getSelected().symbolInfo.value;
						}
					});

	// 编辑类型
	var drawTool = esri.dijit.editing.Editor.CREATE_TOOL_POLYGON;
	if (currentLayer.type == "esriGeometryPoint") {
		drawTool = esri.dijit.editing.Editor.CREATE_TOOL_POINT;
	} else if (currentLayer.type == "esriGeometryPolyline") {
		drawTool = esri.dijit.editing.Editor.CREATE_TOOL_POLYLINE;
	}
	var settings = {
		templatePicker : templatePicker,
		map : map,
		// geometryService: new
		// esri.tasks.GeometryService("http://sampleserver3.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer"),
		layerInfos : layers,
		showObjectID : true,
		// toolbarVisible: true,
		// disableGeometryUpdate:true,
		// showAttributesOnClick: true,
		createOptions : {
			polygonDrawTools : [ drawTool,
					esri.dijit.editing.Editor.CREATE_TOOL_AUTOCOMPLETE ]
		},
		toolbarOptions : {
			reshapeVisible : true,
			cutVisible : true,
			mergeVisible : true
		}
	};
	var params = {
		settings : settings
	};
	if (myEditor) {
		myEditor.destroy();
	}
	myEditor = new esri.dijit.editing.Editor(params, 'editorDiv');
	myEditor.startup();
	currentLayer.editor = myEditor;

	// 属性改变更新到grid
	dojo.connect(myEditor.attributeInspector, "onAttributeChange", function(feature, fieldName, fieldValue) {
		currentLayer.featureGrid.store.setValue(feature.griditem, fieldName,fieldValue);
	});
	
	//重写删除方法
	myEditor._deleteFeature= function (feature, callback) {
		var name = feature.attributes.NAME ? feature.attributes.NAME : "";
		if (confirm("你真的要删除要素" + name + "吗？") == true) {
	        var edits = [];
	        if (!feature) {
	            var layers = this._settings.layers;
	            edits = dojo.map(dojo.filter(layers, function(layer){ return layer.getSelectedFeatures().length > 0; } ), "return {layer:item, deletes: item.getSelectedFeatures()}");
	            if ((!edits || !edits.length) && this._currentGraphic) {
	                edits.push({ layer: this._layer, deletes: [this._currentGraphic] });
	            }
	        } else {
	            edits.push({ layer: feature.getLayer(), deletes: [feature] });
	        }
	        this._applyEdits(edits, (callback));
	        delFeatureByID(feature.attributes.OBJECTID);
	        currentLayer.featureGrid.store.deleteItem(feature.griditem);
		}
	}

	map.infoWindow.setTitle(currentLayer.name);
	map.infoWindow.resize(300, 300);

	dojo.connect(map.infoWindow, "onShow", function(point, placement) {
		var featureLayer = currentLayer.featureLayer;
		var feature = featureLayer.getSelectedFeatures()[0];
		currentLayer.featureGrid.selection.clear();
		//选择grid行
		if (feature) {
			currentLayer.featureGrid.selection.setSelected(currentLayer.featureGrid.getItemIndex(feature.griditem), true);
			feature = feature.attributes.OBJECTID;
		} else {
			feature = "新建";
		}
		this.setTitle(currentLayer.name + " - " + feature);
	});
	dojo.connect(map.infoWindow, "onHide", function(point, placement) {
		currentLayer.featureGrid.selection.clear();
	});
	
    //初始化编辑事件//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////	
	var featureLayer = currentLayer.featureLayer;
	dojo.connect(featureLayer, "onEditsComplete", function(addResults,
			updateResults, deleteResults) {

		if (addResults) {
			var features = featureLayer.graphics;
			dojo.forEach(features, function(feature, i) {
				if (feature.attributes.OBJECTID == addResults[0].objectId) {
					feature.attributes.SYMBOL = currentLayer.symbol;
					feature.attributes.USERID = feature.attributes.USERID ? feature.attributes.USERID : dojoConfig.userid;
					saveFeature(feature, "add");
					featureLayer.refresh();
				}
			});
		} else if (updateResults) {
			updateResults[0].objectId;
			var features = currentLayer.featureLayer.graphics;
			dojo.forEach(features, function(feature, i) {
				if (feature.attributes.OBJECTID == updateResults[0].objectId) {
					upFeature(feature, "up");
				}
			});
		} else if (deleteResults) {
			//delFeatureByID(deleteResults[0].objectId);
		}

	});

	dojo.connect(myEditor._editToolbar, "onActivate", function(tool, graphic,
			info) {
		// 初始化样式
		if (!graphic.attributes.SYMBOL)
			graphic.attributes.SYMBOL = currentLayer.symbol;
		if (!graphic.attributes.USERID)
			graphic.attributes.USERID =  dojoConfig.userid;
		
		measurement.clearResult();
	});
}
// 初始化化要素列表
function createFeaturesGridAndTab(layerName) {
	//var tabs = dijit.byId("mainTabContainer");
	if (currentLayers[layerName].pane) {
		mainTabContainer.selectChild(currentLayers[layerName].pane);
		return;
	}

	var pane = new dijit.layout.ContentPane(
			{
				title : currentLayers[layerName].layername,
				closable : true,
				onClose : function(res,res2) {
					if(currentLayers[res2.layerName]&&currentLayers[res2.layerName].featureLayer){
						map.removeLayer(currentLayers[res2.layerName].featureLayer);
						delete currentLayers[res2.layerName];
					}
					return true;
				},
				content : "<div style=\"width: 100%; height:10%;\"><input id=\"searchWord"
						+ layerName
						+ "\" name=\"searchWord"
						+ layerName
						+ "\" data-dojo-type=\"dijit.form.TextBox\" type=\"text\"/><button dojoType=\"dijit.form.Button\" style=\"color: #000; z-Index: 99;\" onClick=\"searchFeatures('"
						+ layerName
						+ "');\">搜索</button></div><div id=\"featureGridDiv"
						+ layerName
						+ "\" style=\"width: 100%; height: 90%;\"></div>",
				selected : true
			});
	pane.layerName=layerName
	mainTabContainer.addChild(pane);
	mainTabContainer.selectChild(pane);

	var data = {
		identifier : "id",
		items : []
	};
	var myStore = dojo.store.Cache(dojo.store.JsonRest({
		target : "operatMap.do"
	}), dojo.store.Memory());

	var layout = [[]];

	var featureGrid = new dojox.grid.DataGrid({
		id : 'featureGrid' + layerName,
		store : dataStore = dojo.data.ObjectStore({
			objectStore : myStore,
			idProperty: "OBJECTID"
		}),
		structure : layout
	}, "target-node-id"); // make sure you have a target HTML element with
	featureGrid.setQuery({
		oper : "queallpage",
		layer : layerName,
		wkid : map.spatialReference.wkid
	});
	/* append the new featureGrid to the div */
	featureGrid.placeAt("featureGridDiv" + layerName);

	// CellClick事件，用来触发update delete detail等按钮
	featureGrid.on("CellClick",
			function(evt) {
				var idx = evt.rowIndex, idc = evt.cellIndex, item = this
						.getItem(idx), store = this.store;
				id = store.getValue(item, "OBJECTID"), name = store.getValue(
						item, "NAME");
				name = name ? name : "";
				// 如果是detail按钮被按下
				if (idc == this.structure[0].length - 1) {
					if (confirm("你真的要删除要素" + name + "吗？") == true) {
						delFeatureByID(id);
						store.deleteItem(item);
					}
				} else {
					// 当选择一个要素的时候在地图上显示
					var geometry = newGeometry(item);
					if(!geometry)
						return;
					moveToFeature(geometry);
					//选择一个图层
					
					var query = new esri.tasks.Query();
					query.objectIds = [item.OBJECTID ];
					currentLayer.featureLayer.selectFeatures(query, null, function(features) {
					//alert("");
						map.infoWindow.hide();
						currentLayer.editor.templatePicker.clearSelection();
						currentLayer.editor._updatePopupButtons(features);
						currentLayer.editor._onEditFeature(features);
					});
					
				}
			});
	
	currentLayers[layerName].featureGrid = featureGrid;
	currentLayers[layerName].pane = pane;
	currentLayers[layerName].searchWord = dijit.byId("searchWord" + layerName);
	//当数据加载的时候
	dojo.connect(featureGrid,"_onFetchComplete",function(items){
		if(currentLayer.featureLayer){
			addItemToLayer(items);
		}
	});

	return featureGrid;
}

//添加要素到图层
function addItemToLayer(items){
	dojo.forEach(items, function(item) {
		var newItem=dojo.clone(item);
		var geometry = newGeometry(newItem);
		delete newItem.SHAPE;
		var feature = new esri.Graphic(geometry, null, newItem);
		feature.griditem=item;
		currentLayer.featureLayer.add(feature);
		currentLayer.featureLayer._mode._addFeatureIIf(feature.attributes.OBJECTID, feature)
		feature._count = 1;
	});
}

// 下载图层
function downLayer(tablename) {
	window.location.href = "downShp.do?tablename=" + tablename;
}

// 上传图层
function upLayer(layerName) {
	upLayerNewName.setValue("");
	upLayerOleName.setValue("");
	uploadLayerOkButton.setDisabled(true);
	dojo.byId("upShapeInfoAlert").innerHTML ="";
	uploadLayerDialog.show();
	dojo.byId("uploader").innerHTML="";
	jsuOnLoad();
}

// 查看图层信息
function showLayerInfo(layerName) {
	dojo.xhrPost({
		url : 'operatMap.do',
		content : {
			"oper" : "layerdesc",
			"layer" : layerName
		},
		dataType : "json",
		preventCache:true,
		load : function(json) {
			if (json) {
				var d = dojo.eval("(" + json + ")");
				var innerHtml = "<table style='border: none;width: 500px;'>";
				innerHtml += "<tr><td>图层名称: </td><td>" + d.layer.layername
						+ "</td><td>图型类型: </td><td>" + d.layer.type
						+ "</td></tr>";
				innerHtml += "<tr><td>新建时间: </td><td>" + d.layer.date+ "</td>";
				if(d.layer.userid||d.layer.userid==0)
						innerHtml+="<td>新建者Id：</td><td>"+d.layer.userid+"</td></tr>";
				else
					innerHtml+="<td></td><td></td></tr>";
				innerHtml += "</table>";
				dojo.byId("layerBaseInfo").innerHTML = innerHtml;
				var data = {
					identifier : "ID",
					items : d.layer.fields
				};
				var store = new dojo.data.ItemFileWriteStore({
					data : data
				});
				layerInfoDialog.show();
				layerColumnInfoGrid.setStore(store);

			} else {
				alert("没有得到图层信息！");
			}
		},
		error : function(msg) {
			alert("获得图层信息出现异常!");
		}
	});
}

// 加载要素列的结构描述
function loadLayerColumndef(layerName) {

	dojo.xhrPost({
				url : 'operatMap.do',
				content : {
					"oper" : "quecolumndef",
					"layer" : layerName
				},
				dataType : "json",
				preventCache:true,
				load : function(json) {
					if (json) {
						var data = dojo.eval("(" + json + ")");
						createFeaturesGridAndTab(layerName);
						updateFeaturesGridColumndef(data);
						//新建新的图层
						showLayer();

					} else {
						alert("没有得到服务器信息！");
					}
				},
				error : function(msg) {
					alert("获得地图信息时候出现异常!");
				}
			});
}

//更新要素结构grid
function updateFeaturesGridColumndef(data){

	var del = {
		'name' : "删除",
		'field' : "col3",
		formatter : function(item, rowIndex, cell) {
			return "<img alt='删除' id='imgDel' class='imgBtn' src='images/delete_16x16.png' />";
		},
		'width' : '35px'
	};
	var columndef = [];
	var length = data.features.columndef.length;
	var i = 0;
	while (i < length) {
		if ("esriFieldTypeDate" === data.features.columndef[i].TYPE) {
			columndef.push({
				'name' : data.features.columndef[i].ALIAS,
				'field' : data.features.columndef[i].NAME,
				formatter : function(item, rowIndex, cell) {
					return dojo.date.locale.format(
							new Date(item), {
								selector : 'date',
								datePattern : 'yyyy-MM-dd'
							});
				}
			});
		} else if(data.features.columndef[i].NAME!="SHAPE"){
			columndef.push({
				'name' : data.features.columndef[i].ALIAS,
				'field' : data.features.columndef[i].NAME
			});
		}
		i++;
	}
	columndef.push(del);
	currentLayer.columndef = data.features.columndef;
	currentLayer.type = data.features.type;
	var featureGrid = currentLayer.featureGrid;
	featureGrid.setStructure([ columndef ]);
	featureGrid.startup();
	
}

// 新建一个地理要素
function newGeometry(f) {
	var geometry = null;
	if(!f.SHAPE)return;
	if (f.SHAPE.type == "polygon"||f.SHAPE.rings) {
		geometry = new esri.geometry.Polygon(f.SHAPE);
	} else if (f.SHAPE.type == "polyline"||f.SHAPE.paths) {
		geometry = new esri.geometry.Polyline(f.SHAPE);
	}else if (f.SHAPE.type == "point"||f.SHAPE.x) {
		geometry = new esri.geometry.Point(f.SHAPE);
	}
	return geometry;
}

// 将视图调整到可以看到要素位置
function moveToFeature(geometry) {
	if (geometry.type == "point") {
		var level = map.getLevel() > 10 ? map.getLevel() : 10;
		map.centerAndZoom(geometry, level);
	} else {
		var stateExtent = geometry.getExtent().expand(5.0);
		map.setExtent(stateExtent);
	}
}


// 保存要素到服务器
function saveFeature(feature, oper) {

	dojo.xhrPost({
		url : 'operatMap.do',
		content : {
			"oper" : oper,
			"layer" : currentLayer.name,
			"feature" : dojo.toJson(feature.toJson())
		},
		dataType : "json",
		preventCache:true,
		load : function(json) {
			var attr = dojo.eval("(" + json + ")");
			var newid = attr.newid;
			var oldid = attr.feature.attributes.OBJECTID;
			var features = currentLayer.featureLayer.graphics;
			var feature;
			var i = 0;
			
			for (i = 0; i < features.length; i++) {
				if (features[i].attributes.OBJECTID == oldid) {
					feature=features[i];
				}
			}
			var newItem = dojo.clone(attr.feature.attributes);
			// 更新到grid
			newItem.OBJECTID = newid;
			newItem.SHAPE=attr.feature.geometry;
			currentLayer.featureGrid.store.newItem(newItem);
			feature.griditem=newItem;
			feature.attributes.OBJECTID=newid;
			currentLayer.featureLayer._mode._addFeatureIIf(feature.attributes.OBJECTID, feature)
			feature._count = 1;

		},
		error : function(msg) {
			alert("保存出错!");
		}
	});
}

// 保存要素到服务器
function upFeature(feature, oper) {
	var id = feature.attributes.OBJECTID;
	dojo.xhrPost({
		url : 'operatMap.do',
		content : {
			"oper" : oper,
			"id" : id,
			"layer" : currentLayer.name,
			"feature" : dojo.toJson(feature.toJson())
		},
		dataType : "json",
		preventCache:true,
		load : function(json) {

		},
		error : function(msg) {
			alert("保存出错!");
		}
	});
}


// 删除图形
function delFeatureByID(id) {
	if (id) {
		var data = {
			"oper" : "del",
			"layer" : currentLayer.name,
			"id" : id
		};
		dojo.xhrPost({
			url : 'operatMap.do',
			content : data,
			preventCache:true,
			load : function(json) {
				// map.infoWindow.hide();
			},
			error : function(msg) {
				alert("删除出错!");
			}
		});
	}
}

// 显示新建图层对话框
function showNewLayerDialog() {
	if( layerTemplates[layerTemplateSelect.getValue()]){
		//输入框，选择框恢复默认
		layerNameInput.setValue("");
		layerTemplateSelect.setValue("0");
		shapeType.setValue("0");
		
		newLayerDialog.show();
		changeTemplate();
	}
	else{
		if (isManager&&confirm("新建图层需要模板，是否先去新建模板？") == true) {
			managerTemplate();
			managerDialog.show();
		}
	}
}

// 新建一个新图层,这个方法显示新建图层对话框，新建一个新的数据库里边的图层
function createLayer() {

	if (!layerNameInput.validate()) {
		alert("请输入正确名称！");
		return;
	}
	var l = {};
	l.layername = layerNameInput.getValue();
	l.wkid = 4326;
	l.shapetype = shapeType.getValue();

	var items = createLayerColumnGrid.store._getItemsArray();
	var fields = [];
	for ( var i = 0; i < items.length; i++) {
		var f = {};
		var item = items[i];
		for ( var name in item) {
			// 方法
			if (!(name.indexOf("_S") >= 0 || name.indexOf("_0") >= 0
					|| name.indexOf("_RI") >= 0 || name == undefined)) {
				f[name] = item[name][0];
			}
		}
		fields.push(f);
	}

	l.fields = fields;
	dojo.xhrPost({
		url : 'operatMap.do',
		content : {
			"oper" : "addlayer",
			"l" : dojo.toJson(l)
		},
		dataType : "json",
		preventCache:true,
		load : function(json) {
			var msg = dojo.eval("(" + json + ")");
			if (!msg.error) {
				//loadLayers();
				var item = layersGrid.store.newItem(msg.layer);
				//layersGrid.selection.setSelected(layersGrid.getItemIndex(item), true);
				layersGrid.onCellClick({rowIndex:layersGrid.getItemIndex(item),cellIndex:0});
				newLayerDialog.hide();

			} else {
				alert(msg.error);
			}

		},
		error : function(msg) {
			alert("保存出错!");
		}
	});
}

//根据名称删除图层
function closeLayerTab(name) {
	var childs = mainTabContainer.getChildren();
	for(var i=0;i<childs.length;i++){
		if(childs[i].layerName==name){
			childs[i].onClose(mainTabContainer,childs[i]);
			mainTabContainer.removeChild(childs[i]);
		}
	}
}

// 根据名称删除图层
function delLayerByName(tablename) {
	var data = {
		"oper" : "dellayer",
		"layer" : tablename
	};
	dojo.xhrPost({
		url : 'operatMap.do',
		content : data,
		// dataType : "json",
		preventCache:true,
		load : function(json) {
			// alert('delete veiwbox ok!');
			// var i = dojo.eval("(" + json + ")");
			//loadLayers();
		},
		error : function(msg) {
			alert("删除名称出错!");
		}
	});

}


//修改上传图层名称，
function uploadLayerChangeName() {
	if (!upLayerOleName.validate()) {
		alert("请先上传一个文件！");
		return;
	}
	if (!upLayerNewName.validate()) {
		alert("请输入正确图层名称！");
		return;
	}
	var data = {
		"oper" : "updatelayername",
		"oldlayername" : upLayerOleName.getValue(),
		"newlayername" : upLayerNewName.getValue()
	};
	dojo.xhrPost({
		url : 'shpToSde.do',
		content : data,
		dataType : "json",
		preventCache:true,
		load : function(json) {
			
			var info = dojo.eval("(" + json + ")");
			if(info.ret){
				loadLayers();
				uploadLayerDialog.hide();
			}else{
				alert(info.msg);
			}
		},
		error : function(msg) {
			alert("shp文件导入sde时候出现错误!");
		}
	});
}

//取消上传图层
function uploadLayerCancel() {	
	var upCancelButton = dojo.query(".cancel");
	upCancelButton.onclick();
	upCancelButton[0].click();
	uploadLayerDialog.hide();
	return;
}

//查询图层
function searchFeatures(layerName) {
	var str = currentLayer.searchWord.getValue();
	currentLayer.featureGrid.query.oper="search";
	currentLayer.featureGrid.query.word=str;
	currentLayer.featureLayer.clear()
	currentLayer.featureGrid.setQuery(currentLayer.featureGrid.query);
}

//墨卡托转经纬度
function  Mercator2lonLat(mercator)
{
    var  lonLat = {};
    var  x = mercator.x / 20037508.3427892 * 180;
    var  y = mercator.y / 20037508.3427892 * 180;
    y = 180 / Math.PI * (2 * Math.Atan(Math.Exp(y * Math.PI / 180)) - Math.PI / 2);
    lonLat.X = x;
    lonLat.Y = y;
    return lonLat;
}
