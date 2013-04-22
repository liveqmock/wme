// 地图样式定义 FillSymbol  LineSymbol  MarkerSymbol  TextSymbol  ]
var pointSymbolAll;
var lineSymbolAll;
var polygonSymbolAll;


//显示编辑对话框
function showEditToolsDialog(){
	var editToolsDialog;
	if(currentLayer.type == "esriGeometryPoint"){
		editToolsDialog=editToolsPointDialog;
	}else if(currentLayer.type == "esriGeometryPolyline"){
		editToolsDialog=editToolsLineDialog;
	}else if(currentLayer.type == "esriGeometryPolygon"){
		editToolsDialog=editToolsPolygonDialog;
	}
	
	editToolsDialog.show();
	editToolsDialog.underlay=dijit._underlay;
	editToolsDialog.underlay.hide();
	editToolsDialog._relativePosition = {x:50,y:150};
	editToolsDialog._position();
	currentLayer.editToolsDialog=editToolsDialog;
}
function initDrawToolSymbolTree() {

		loadPointSymbol();
	
		loadLineSymbol();
	
		loadPolygonSymbol();
		
		var editToolsDialogHide=function(){
			if(this.drawToolTree.clickItem.obj)
				this.drawToolTree.clickItem.obj.className = "caption";
			drawShapeToolbar.toolTreeItem = null;
			stopDrawToolbar();
		};
		
		var editToolsDialogResize=function(){
			if(this.underlay)
				this.underlay.hide();
		};
		
		dojo.connect(editToolsPointDialog, 'resize', editToolsPointDialog,editToolsDialogResize);
		dojo.connect(editToolsPointDialog, 'onHide', editToolsPointDialog,editToolsDialogHide);
		
		dojo.connect(editToolsLineDialog, 'resize', editToolsLineDialog,editToolsDialogResize);
		dojo.connect(editToolsLineDialog, 'onHide', editToolsLineDialog,editToolsDialogHide);
		
		dojo.connect(editToolsPolygonDialog, 'resize', editToolsPolygonDialog,editToolsDialogResize);
		dojo.connect(editToolsPolygonDialog, 'onHide', editToolsPolygonDialog,editToolsDialogHide);
		

}
function layersRefresh(layers) {
	if (layers) {
		for ( var itm in layers) {
			if (layers[itm]&&layers[itm].layerRefresh) {
				layers[itm].layerRefresh();
				console.log("刷新图层样式");
			}
		}
	}
}


/**
 * 初始化树
 * 
 * @param items
 */

function initDrawToolTree(items,divID,dialog) {
    dojo.byId(divID).innerHTML="";
	var drawToolTree = new JTree(divID, {items : items});
	drawToolTree.setPicPath("images/")
	drawToolTree.onclick = function() {
		//setValueById("typeCaption", vControl('REPLACE', getNodeAtt(myTree.selectNode, myTree.CAPTIONATT)));
		// 重置测量工具
		measurement.stop();
		stopEditToolbar();
		var item = this.selectNode;
		if (isDrawToolNode(item)) {
			if (drawShapeToolbar.toolTreeItem != item) {
				drawShapeToolbar.toolTreeItem = item;
				currentLayer.pointcode = item.pointcode;
				if (currentLayer.type == "esriGeometryPoint") {
					drawShapeToolbar.activate(esri.toolbars.Draw.POINT);
				} else if (currentLayer.type == "esriGeometryPolyline") {
					drawShapeToolbar.activate(esri.toolbars.Draw.POLYLINE);
				} else if (currentLayer.type == "esriGeometryPolygon") {
					drawShapeToolbar.activate(esri.toolbars.Draw.POLYGON);
				}
			} else {
				drawShapeToolbar.toolTreeItem = null;
				stopDrawToolbar();
				if(this.clickItem.obj)
					this.clickItem.obj.className = "caption";
			}
		} else {
			currentLayer.pointcode = null;
			if(this.clickItem.obj)
				this.clickItem.obj.className = "caption";
		}

	}
	drawToolTree.CAPTIONATT = "name";
	drawToolTree.ICONATT = "image";
	drawToolTree.create();
	dialog.drawToolTree=drawToolTree;
}

/* 加载点分类 */
function loadPointSymbol() {

	dojo.xhrPost({
		url : 'managerPointSymbol.do',
		content : {
			"oper" : "listtree"
		},
		dataType : "json",
		load : function(json) {
			var info = dojo.eval("(" + json + ")");
			if(!info.ret)
			{
				handleExcetion(info);
			}
			else
			{
				pointSymbolAll=dojo.clone(info.items);
				initDrawToolTree(info.items,"categoryPointSymbolTree",editToolsPointDialog);
				layersRefresh(currentLayers);
			}
		},
		error : function(msg) {
			// alert("加载分类异常!");
		}
	});
}

/* 初始化线分类 */
function loadLineSymbol() {

	// 地图样式定义 FillSymbol LineSymbol MarkerSymbol TextSymbol ]
	lineSymbolAll = [ {
		"id" : 1,
		"name" : "餐饮",
		"root" : true,
		"fatherid" : -3,
		"pointcode" : "0xline1",
		"children" : [{
			"_reference" : 6
		}]
	}, {
		"id" : 2,
		"name" : "石油",
		"root" : true,
		"fatherid" : 1,
		"pointcode" : "0xline2",
		"children" : [ {
			"_reference" : 3
		}, {
			"_reference" : 4
		}, {
			"_reference" : 5
		} ]
	}, {
		"id" : 3,
		"name" : "地下石油管线",
		"description" : "地下石油管线",
		"linestyle" : "STYLE_SOLID",
		"linecolor" : [ 0, 0, 255 ],
		"linewidth" : 4,
		"root" : false,
		"fatherid" : 2,
		"pointcode" : "0xline3"
	}, {
		"id" : 4,
		"name" : "地上石油管线",
		"description" : "地上石油管线",
		"linestyle" : "STYLE_DASHDOT",
		"linecolor" : [ 255, 0, 0 ],
		"linewidth" : 4,
		"root" : false,
		"fatherid" : 2,
		"pointcode" : "0xline4"
	}, {
		"id" : 5,
		"name" : "燃气管线",
		"description" : "燃气管线",
		"linestyle" : "STYLE_DASHDOT",
		"linecolor" : [ 0, 255, 255 ],
		"linewidth" : 2,
		"root" : false,
		"fatherid" : 2,
		"pointcode" : "0xline5"
	}
	, {
		"id" : 6,
		"name" : "美食广场",
		"description" : "美食广场",
		"linestyle" : "STYLE_DASHDOT",
		"linecolor" : [ 0, 255, 255 ],
		"linewidth" : 2,
		"root" : false,
		"fatherid" : 1,
		"pointcode" : "0xline6"
	}];
	
	initDrawToolTree(dojo.clone(lineSymbolAll),"categoryLineSymbolTree",editToolsLineDialog);
}

/* 初始化面分类 */
function loadPolygonSymbol() {
	polygonSymbolAll = [ {
		"id" : 1,
		"name" : "餐饮",
		"root" : true,
		"fatherid" : -3,
		"pointcode" : "0x1",
		"children" : [ {
			"_reference" : 8
		}]
	}, {
		"id" : 2,
		"name" : "石油",
		"root" : true,
		"fatherid" : 1,
		"pointcode" : "0x2",
		"children" : [ {
			"_reference" : 3
		}, {
			"_reference" : 4
		}, {
			"_reference" : 5
		}, {
			"_reference" : 6
		}, {
			"_reference" : 7
		} ]
	}, {
		"id" : 3,
		"name" : "开采区",
		"description" : "开采区",
		"linestyle" : "STYLE_SOLID",
		"linecolor" : [ 0, 0, 255 ],
		"linewidth" : 2,
		"fillstyle" : "STYLE_DIAGONAL_CROSS",
		"fillcolor" : [ 0, 0, 255 ],
		"root" : false,
		"fatherid" : 2,
		"pointcode" : "0xpolygon3"
	}, {
		"id" : 4,
		"name" : "油矿区",
		"description" : "油矿区",
		"linestyle" : "STYLE_DASHDOT",
		"linecolor" : [ 0, 0, 255 ],
		"linewidth" : 1,
		"fillstyle" : "STYLE_FORWARD_DIAGONAL",
		"fillcolor" : [ 0, 0, 255 ],
		"root" : false,
		"fatherid" : 2,
		"pointcode" : "0xpolygon4"
	}, {
		"id" : 5,
		"name" : "冶炼厂",
		"description" : "冶炼厂",
		"linestyle" : "STYLE_DASHDOT",
		"linecolor" : [ 0, 0, 255 ],
		"linewidth" : 1,
		"fillstyle" : "STYLE_VERTICAL",
		"fillcolor" : [ 0, 0, 255 ],
		"root" : false,
		"fatherid" : 2,
		"pointcode" : "0xpolygon5"
	}, {
		"id" : 6,
		"name" : "存储区",
		"description" : "存储区",
		"linestyle" : "STYLE_SOLID",
		"linecolor" : [ 255, 0, 0 ],
		"linewidth" : 1,
		"fillstyle" : "STYLE_DIAGONAL_CROSS",
		"fillcolor" : [ 0, 0, 255 ],
		"root" : false,
		"fatherid" : 2,
		"pointcode" : "0xpolygon6"
	}, {
		"id" : 7,
		"name" : "其它",
		"description" : "其它",
		"linestyle" : "STYLE_SOLID",
		"linecolor" : [ 0, 0, 0 ],
		"linewidth" : 1,
		"fillstyle" : "STYLE_BACKWARD_DIAGONAL",
		"fillcolor" : [ 0, 0, 255 ],
		"root" : false,
		"fatherid" : 2,
		"pointcode" : "0xpolygon7"
	}, {
		"id" : 8,
		"name" : "美食广场",
		"description" : "美食广场",
		"linestyle" : "STYLE_SOLID",
		"linecolor" : [ 0, 0, 0 ],
		"linewidth" : 1,
		"fillstyle" : "STYLE_BACKWARD_DIAGONAL",
		"fillcolor" : [ 0, 0, 255 ],
		"root" : false,
		"fatherid" : 1,
		"pointcode" : "0xpolygon8"
	} ];
	
	initDrawToolTree(dojo.clone(polygonSymbolAll),"categoryPolygonSymbolTree",editToolsPolygonDialog);
}
//创建图层显示样式
function createSymbol(type) {

	var renderer;
	if (type == "esriGeometryPolygon") {
		var defaultSymbol = new esri.symbol.SimpleFillSymbol()
				.setStyle(esri.symbol.SimpleFillSymbol.STYLE_BACKWARD_DIAGONAL);
		defaultSymbol.outline.setStyle(esri.symbol.SimpleLineSymbol.STYLE_BACKWARD_DIAGONAL);
		renderer = new esri.renderer.UniqueValueRenderer(defaultSymbol,"SYMBOL");
		var i = 0, count = 0;
		for (i = 0; polygonSymbolAll && i < polygonSymbolAll.length; i++) {
			var item = polygonSymbolAll[i];
			if (!item.children) {
				renderer.addValue({
							value : item.pointcode,
							symbol : createPolygonSymbol(item),
							label : item.name,
							description : item.description
						});
			}
			count++;
		}
	} else if (type == "esriGeometryPoint") {
		renderer = new esri.renderer.UniqueValueRenderer(
				new esri.symbol.SimpleMarkerSymbol(), "SYMBOL");
		var i = 0, count = 0;
		for (i = 0; pointSymbolAll && i < pointSymbolAll.length; i++) {
			var item = pointSymbolAll[i];
			if (!item.children && item.image) {
				renderer.addValue({
					value : item.pointcode,
					symbol : createPointSymbol(item),
					label : item.name,
					description : item.description
				});
			}
			count++;
		}
		if (count < 1) {
			if (confirm("点没有分类，是否新建分类？") == true) {
				managerTemplate();
				managerDialog.show();
			}
		}

	} else {
		var defaultSymbol = new esri.symbol.SimpleFillSymbol();
		renderer = new esri.renderer.UniqueValueRenderer(defaultSymbol,
				"SYMBOL");

		var i = 0, count = 0;
		for (i = 0; lineSymbolAll && i < lineSymbolAll.length; i++) {
			var item = lineSymbolAll[i];
			if (!item.children) {
				renderer.addValue({
					value : item.pointcode,
					symbol : createLineSymbol(item),
					label : item.name,
					description : item.description
				});
			}
			count++;
		}
	}
	return renderer;
}

function isDrawToolNode(item){
	return item.image || item.fillcolor || item.linecolor;
}
function createNodeSymbol(item){
	
	if(item.image){
		return createPointSymbol(item);
	}else if(item.fillcolor){
		return createPolygonSymbol(item);
	}else if(item.linecolor){
		return createLineSymbol(item);
	}
	return null;
}
function createPointSymbol(item){
	return new esri.symbol.PictureMarkerSymbol(createTreeNodeImage(item), 19,22);
}
function createLineSymbol(item){
	return new esri.symbol.SimpleLineSymbol(
			esri.symbol.SimpleLineSymbol.STYLE_DASH,
			new dojo.Color(item.linecolor), item.linewidth);
}
function createPolygonSymbol(item){
	return new esri.symbol.SimpleFillSymbol(
			esri.symbol.SimpleFillSymbol[item.fillstyle],
			new esri.symbol.SimpleLineSymbol(
					esri.symbol.SimpleLineSymbol[item.linestyle],
					new dojo.Color(item.linecolor),
					item.linewidth), new dojo.Color(
					item.fillcolor));
}
// 生成树节点的小图标
function createTreeNodeImage(item) {
	if (item.image) {
		return "symbolImage.do?type=point&name=" + item.image;
	} else {
		return "";
	}
}
//将样式绘制到节点对象中
function drawIconNode(node,item){
	var symbol = createNodeSymbol(item);
	if(symbol){
		symbolDraw(node, symbol, 18, 18)
	}
}

function symbolDraw(node, symbol, sWidth, sHeight) {
	if (!symbol) {
		return;
	}

	var surface = dojox.gfx.createSurface(node, sWidth, sHeight);
	if (dojo.isIE < 9) {
		// Fixes an issue in IE where the shape is partially drawn and
		// positioned to the right of the table cell
		var source = surface.getEventSource();
		dojo.style(source, "position", "relative");
		dojo.style(source.parentNode, "position", "relative");
		dojo.style(source.parentNode, "display", "inline");
//		dojo.style(source.parentNode,"vertical-align", "middle");
//		dojo.style(source.parentNode,"z-Index", "99");
//		dojo.style(source.parentNode,"unselectable","on")
//		dojo.style(source.parentNode,"border-collapse","separate");
	}
	var shapeDesc = esri.symbol.getShapeDescriptors(symbol);

	var gfxShape;
	try {
		  gfxShape = surface.createShape(shapeDesc.defaultShape).setFill(shapeDesc.fill).setStroke(shapeDesc.stroke);

	} catch (e) {
		surface.clear();
		surface.destroy();
		return;
	}

	var dim = surface.getDimensions();
	var transform = {
		dx : dim.width / 2,
		dy : dim.height / 2
	};

	var bbox = gfxShape.getBoundingBox(), width = bbox.width, height = bbox.height;
	if (width > sWidth || height > sHeight) {
		var actualSize = width > height ? width : height;
		var refSize = sWidth < sHeight ? sWidth : sHeight;
		var scaleBy = (refSize - 5) / actualSize;
		dojo.mixin(transform, {
			xx : scaleBy,
			yy : scaleBy
		});
	}
	gfxShape.applyTransform(transform);
	return surface;
}

