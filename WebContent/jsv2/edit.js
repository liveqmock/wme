var drawShapeToolbar, editToolbar;
var updateFeature;
var symbol;
var featureLayerOnClick;
var noEidtFields = {SYMBOL:true,USERID:true};


function createFeatureLayer(type, columndef) {
	
	var length = columndef.length;
	var i = 0;
	var fields = [ {
		"name" : "OBJECTID",
		"alias" : "OBJECTID",
		"type" : "esriFieldTypeOID"
	} ];
	var outFields = [];
	var fieldInfos = [];
	while (i < length) {
		var c = columndef[i];
		if (c.NAME != "SHAPE") {
			fields.push({
				"name" : c.NAME,
				"alias" : c.ALIAS,
				"type" : c.TYPE,
				"length" : (c.LENGTH == 0 ? 255 : c.LENGTH)
			});
			fieldInfos.push({
				'fieldName' : c.NAME,
				'isEditable' : noEidtFields[c.NAME] ? false : true ,
				'tooltip' : '',
				'label' : c.ALIAS
			});
			outFields.push(c.NAME);
		}
		i++;
	}

	var layerDefinition = {
		"geometryType" : type,
		"objectIdField" : "OBJECTID",
		"fields" : fields
	};
	var featureCollection = {
		"layerDefinition" : {
			"geometryType" : type,
			"objectIdField" : "OBJECTID",
			"fields" : fields
		},
		"featureSet" : {
			"features" : [],
			"geometryType" : type
		}
	};

	var featureLayer = new esri.layers.FeatureLayer(featureCollection, {
		_editable : true,
		objectIdField : "OBJECTID",
		outFields : outFields
	});
	featureLayer.fieldInfos = fieldInfos;
	featureLayer.capabilities = "Editing,Create,Update,Delete";
	featureLayer.setEditable(true);
	featureLayer.name = currentLayer.layername;
	map.addLayer(featureLayer);
	return featureLayer;
}

function addToMap(geometry) {
	if(geometry.rings){
		var isIntersecting = esri.geometry.polygonSelfIntersecting(geometry);
		if(isIntersecting){
			alert("多边形自相交是无效图形！");
			return;
		}
	}
	
	stopDrawToolbar();
	//清楚工具选择
	if(currentLayer.editToolsDialog.drawToolTree.clickItem.obj)
		currentLayer.editToolsDialog.drawToolTree.clickItem.obj.className = "caption";
	drawShapeToolbar.toolTreeItem = null;
	
	map.showZoomSlider();
	currentLayer.featureLayer._nextId++;
	
	var feature = new esri.Graphic(geometry,symbol,{
		"OBJECTID":currentLayer.featureLayer._nextId,
		"SYMBOL":currentLayer.pointcode,
		"USERID" : dojoConfig.userid});
	currentLayer.featureLayer.add(feature);
	console.log("图层："+currentLayer.featureLayer.name+"增加一个要素");
	currentLayer.featureLayer._mode._addFeatureIIf(feature.attributes.OBJECTID, feature)
	feature._count = 1;
	// 同时开始编辑
	showEditInfoWindow(feature);
}
function activateToolbar(graphic) {
	var tool = 0;
	tool = tool | esri.toolbars.Edit.MOVE;
	tool = tool | esri.toolbars.Edit.EDIT_VERTICES;
	tool = tool | esri.toolbars.Edit.SCALE;
	tool = tool | esri.toolbars.Edit.ROTATE;
   
	var options = {
		allowAddVertices : true,
		allowDeleteVertices : true
	};
	editToolbar.activate(tool, graphic, options);
}
//编辑工具停止编辑
function stopEditToolbar(){
	editToolbar.deactivate();
}
//绘图工具停止绘制
function stopDrawToolbar(){
	//判断绘图工具是否停止
	//if(drawShapeToolbar._geometryType){
		drawShapeToolbar.deactivate();
	//}
}
// 根据要素的OBJECTID,显示编辑框
function showEditInfoWindowByID(id){
	var feature = getFeatureByID(id);
	showEditInfoWindow(feature);

}


//新建一个地理要素
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

// 将视图调整到可以看到要素的位置
function moveToFeature(geometry) {
	if (geometry.type == "point") {
		var level = map.getLevel() > 10 ? map.getLevel() : 10;
		map.centerAndZoom(geometry, level);
	} else {
		var stateExtent = geometry.getExtent().expand(5.0);
		map.setExtent(stateExtent);
	}
}

// 根据要素的OBJECTID,显示编辑框
function getFeatureByID(id){
	var features = currentLayer.featureLayer.graphics;
	for(var i=0;i<features.length;i++){
		if(features[i].attributes.OBJECTID ==id){
			return features[i];
		}
	}
}
// 显示编辑框
function showEditInfoWindow(feature,screenPoint){
	// console.log("编辑");
	  if (feature) { 
		//图层显示表格里的记录
		connectionMap(feature.attributes.OBJECTID);
		activateToolbar(feature);
      	updateFeature = feature;
		currentLayer.featureGrid.selection.setSelected(currentLayer.featureGrid.getItemIndex(feature.griditem), true);
		
		if(!screenPoint){
			if (feature.geometry.type == "point") {
				screenPoint=map.toScreen(feature.geometry )
			} else {
				screenPoint=map.toScreen(feature.geometry.getExtent().getCenter() )
			}	
		}
		map.infoWindow.show(screenPoint,map.getInfoWindowAnchor(screenPoint));
      } else {
           map.infoWindow.hide();
      }

}
 function createToolAttInspector(featureLayer) {
	if(featureLayerOnClick){
		dojo.disconnect(featureLayerOnClick);
	}

	featureLayerOnClick=dojo.connect(featureLayer, "onClick", function(evt) {
		dojo.stopEvent(evt);
		var feature =evt.graphic;
		showEditInfoWindow(feature,evt.screenPoint);
	});

    var layerInfos = [{'featureLayer':featureLayer,
       'showAttachments':true,
       'isEditable': true,
       'showDeleteButton':true,
       'fieldInfos': featureLayer.fieldInfos
    }];
    map.infoWindow.resize(325,210);
  }
 
 function unCreateToolAttInspector() {
	if(featureLayerOnClick){
		dojo.disconnect(featureLayerOnClick);
	}
 }
 
//保存要素到服务器
 function saveFeature(feature, oper) {

 	dojo.xhrPost({
 		url : 'operatMap.do',
 		content : {
 			"oper" : oper,
 			"layer" : currentLayer.tablename,
 			"feature" : dojo.toJson(feature.toJson())
 		},
 		dataType : "json",
 		preventCache:true,
 		load : function(json) {
 			var info = dojo.eval("(" + json + ")");
 			if(!info.ret)
 			{
 				handleExcetion(info);

 			}else{
 				alert("添加成功!");
 				// 修改成功
 				var newid = info.newid;
 				var oldid = info.feature.attributes.OBJECTID;
 				var features = currentLayer.featureLayer.graphics;
 				var feature;
 				var i = 0;
 				
 				for (i = 0; i < features.length; i++) {
 					if (features[i].attributes.OBJECTID == oldid) {
 						feature=features[i];
 					}
 				}
 				var newItem = dojo.clone(info.feature.attributes);
 				// 更新到grid
 				newItem.OBJECTID = newid;
 				newItem.SHAPE=info.feature.geometry;
 				currentLayer.featureGrid.store.newItem(newItem);
 				feature.griditem=newItem;
 				feature.attributes.OBJECTID=newid;
 				currentLayer.featureLayer._mode._addFeatureIIf(feature.attributes.OBJECTID, feature)
 				feature._count = 1;
 			}
 		},
 		error : function(msg) {
 			console.log(msg);
 			//alert("保存出错!");
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
 			"layer" : currentLayer.tablename,
 			"feature" : dojo.toJson(feature.toJson())
 		},
 		dataType : "json",
 		preventCache:true,
 		load : function(json) {
 			var info = dojo.eval("(" + json + ")");
 			if(!info.ret)
 			{
 				handleExcetion(info);
 				// 回退数据
 				var columndef = currentLayer.columndef;
 				for (var i = 0; i < columndef.length; i++)
 				{
 					var tmp = columndef[i].NAME;
 					if (tmp != 'SHAPE' && tmp != 'OBJECTID' && tmp != 'USERID' && tmp != 'SYMBOL') {
 						updateFeature.attributes[tmp] = backupmap[tmp];
 					}
 				}
 			}else{
 				// 修改成功
 				alert("修改成功!");
 				// 更新到grid
 				var modItem = dojo.clone(info.feature.attributes);
 				var columndef = currentLayer.columndef;
 				for (var i = 0; i < columndef.length; i++)
 				{
 					var tmp = columndef[i].NAME;
 					if (tmp == 'SHAPE'){
 						updateFeature.attributes[tmp] = info.feature.geometry;
 						currentLayer.featureGrid.store.setValue(updateFeature.griditem, 
 								tmp, info.feature.geometry);
 					}
 					else if (tmp != 'OBJECTID' && tmp != 'USERID' && tmp != 'SYMBOL'){
 						updateFeature.attributes[tmp] = modItem[tmp];
 						currentLayer.featureGrid.store.setValue(updateFeature.griditem, 
 								tmp, modItem[tmp]);
 					}
 				}
 			}
 		},
 		error : function(msg) {
 			console.log(msg);
 			//alert("修改失败!");
 		}
 	});
 }


 // 删除图形
 function delFeatureByID(id) {
 	if (id) {
 		var data = {
 			"oper" : "del",
 			"layer" : currentLayer.tablename,
 			"id" : id
 		};
 		dojo.xhrPost({
 			url : 'operatMap.do',
 			content : data,
 			preventCache:true,
 			load : function(json) {

 				var info = dojo.eval("(" + json + ")");
 				if(!info.ret)
 				{
 					handleExcetion(info);
 				}
 				else
 				{
 					var feature=getFeatureByID(id);
 					feature.getLayer().applyEdits(null,null,[feature]);
 					currentLayer.featureGrid.store.deleteItem(feature.griditem);
 					stopEditToolbar();
 					map.infoWindow.hide();
 				}
 			},
 			error : function(msg) {
 				console.log(msg);
 				//alert("删除出错!");
 			}
 		});
 	}
 }