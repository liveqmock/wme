/**
 * 管理员看到图层列表显示结构
 */
var layersStructureManage = [

		{
			'name' : '类型',
			'field' : 'type',
			'width' : '50px',
			formatter : function(item, rowIndex, cell) {
				return "<img alt='图层类型' id='imgDel' class='imgBtn' src='images/" + item + ".png' />";
			}
		},
		{
			'name' : '图层名称',
			'field' : 'layername',
			'width' : '145px',
			formatter :nameFormater
		},
		{
			'name' : '创建时间',
			'field' : 'date',
			'width' : '180px'
		},
		{
			'name' : "查看",
			'field' : "show",
			formatter : function(item, rowIndex, cell) {
				return "<img alt='查看' id='imgDel' class='imgBtn' src='images/kan_19x19.png' />";
			},
			'width' : '50px'
		},
		{
			'name' : "下载",
			'field' : "edit",
			formatter : function(item, rowIndex, cell) {
				return "<img alt='下载' id='imgDown' class='imgBtn' src='images/down16-16.png' />";
			},
			'width' : '50px'
		},
		{
			'name' : "删除",
			'field' : "del",
			formatter : function(item, rowIndex, cell) {
				return "<img alt='删除' id='imgDel' class='imgBtn' src='images/nav_decline.png' />";
			},
			'width' : '50px'
		} ];
/**
 * 普通用户看到的图层列表显示结构
 */
var layersStructureNormal = [

		{
			'name' : '类型',
			'field' : 'type',
			'width' : '50px',
			formatter : function(item, rowIndex, cell) {
				return "<img alt='图层类型' id='imgDel' class='imgBtn' src='images/"
						+ item + ".png' />";
			}
		},
		{
			'name' : '图层名称',
			'field' : 'layername',
			'width' : '145px',
			formatter :nameFormater
		},
		{
			'name' : '创建时间',
			'field' : 'date',
			'width' : '180px'
		},
		{
			'name' : "查看",
			'field' : "show",
			formatter : function(item, rowIndex, cell) {
				return "<img alt='查看' id='imgDel' class='imgBtn' src='images/kan_16x16.png' />";
			},
			'width' : '50px'
		} ];


/**
 * 管理员用户看到的图层列表单击事件方法
 */
function layersCellClickManage (evt) {
	var idx = evt.rowIndex;
	var idc = evt.cellIndex;
	var item = this.getItem(idx);
	var store = this.store;
	var tablename = store.getValue(item, "tablename");
	var layername = store.getValue(item, "layername");
	// 如果是detail按钮被按下
	
	if (idc == this.structure.length - 1) {
		if(evt.type=="click"){
			if (confirm("你真的要删除图层'" + layername + "'吗？") == true) {
				delLayerByName(tablename,item);
			}
		}
	} else if (idc == this.structure.length - 2) {
		if(evt.type=="click"){
			downLayer(tablename);
		}
	} else if (idc == this.structure.length - 3) {
		if(evt.type=="click"){
			showLayerInfo(tablename);
		}
	} else {
		if(evt.type=="dblclick"){
			selectAndShowLayer(tablename,layername);
		}
	}
}
/**
 * 普通用户看到的图层列表单击事件方法
 */
function layersCellClickNormal(evt) {
	var idx = evt.rowIndex;
	var idc = evt.cellIndex;
	var item = this.getItem(idx);
	var store = this.store;
	var tablename = store.getValue(item, "tablename");
	var layername = store.getValue(item, "layername");
	// 如果是detail按钮被按下
	if (idc == this.structure.length - 1) {
		if(evt.type=="click"){
			showLayerInfo(tablename);
		}
	} else {
		// 当点击图层名称的时候会初试化图层
		if(evt.type=="dblclick"){
			selectAndShowLayer(tablename,layername);
		}
	}
}

/**
 * 图层名称发生变化的时候
 */
function upLayerNameChange(){
	var items = layersGrid.store.items; 
	var layername = upLayerName.getValue();
	var flag=false;
	for(var i=0;i<items.length;i++){
		if(items[i].layername==layername)
		{
			flag=true;
			break;
		}
	}
	if(!flag){
		alert("名称已经存在！");	
	}
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
			var info = dojo.eval("(" + json + ")");
			if(!info.ret)
			{
				handleExcetion(info);
			}
			else
			{
				var data = {
					identifier : "tablename",
					items : info.layers
				};

				var store = new dojo.data.ItemFileWriteStore({
					data : data
				});
				layersGrid.setStore(store);
			} 
		},
		error : function(msg) {
			console.log(msg);
			//alert("获得图层列表信息时出现异常!"+msg);
		}
	});
}

//初始化一个图层
function updateFeaturesGridColumndef(data) {
	//更新要素结构grid

	var del = {
		'name' : "删除",
		'field' : "col3",
		formatter : function(item, rowIndex, cell) {
			return "<img alt='删除' id='imgDel' class='imgBtn' src='images/nav_decline.png' />";
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
		} else if(data.features.columndef[i].NAME!="SHAPE"&&data.features.columndef[i].NAME!="SYMBOL"){
			columndef.push({
				'name' : data.features.columndef[i].ALIAS,
				'field' : data.features.columndef[i].NAME
			});
		}
		i++;
	}
	columndef.push(del);
	currentLayer.columndef = dojo.clone(data.features.columndef);
	currentLayer.type = data.features.type;
	currentLayer.layout=columndef;
	currentLayer.featureLayer = new createFeatureLayer(currentLayer.type, currentLayer.columndef);
	currentLayer.featureLayer._nextId=100000000;
	currentLayer.layerRefresh=function(){
		var renderer = createSymbol(this.type);
		this.featureLayer.setRenderer(renderer);
		this.featureLayer.refresh();
	};
	currentLayer.layerRefresh();
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
		width : '200px',
		formatter :nameFormater
	}, {
		name : '类型',
		field : 'TYPE',
		width : '200px',
		formatter : function(item, rowIndex, cell) {
				return tableColumnTypeDescription[item] ? tableColumnTypeDescription[item] : "其它";
		}
	} ] ];

	/* create a new createLayerColumnGrid */
	layerColumnInfoGrid = new dojox.grid.DataGrid({
		id : 'layerColumnInfoGrid',
		store : store,
		structure : layout
		//,
		//rowSelector : '20px'
	});

	/* append the new createLayerColumnGrid to the div */
	layerColumnInfoGrid.placeAt("layerColumnGridInfoDiv");
	/* Call startup() to render the layerColumnGrid */
	layerColumnInfoGrid.startup();
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
		columnReordering : false,  // 此属性设置为true,可以拖拽标题栏，更换列顺序
		//rowSelector : '20px',
		width: "100%", 
		height: "100%"
	});

	/* 追加网格到div */
	layersGrid.placeAt("layersGridDiv");

	// CellClick事件，用来触发update delete detail等按钮
	layersGrid.startup();
	dojo.connect(layersGrid, "onCellDblClick", layersGridCellClick);
	dojo.connect(layersGrid, "onCellClick", layersGridCellClick);
	loadLayers();
}
//显示一个图层
function selectAndShowLayer(tablename,layername){
	// 当点击图层名称的时候会初试化图层
	if (currentLayers[tablename]&&currentLayers[tablename].pane) {
		mainTabContainer.selectChild(currentLayers[tablename].pane);
		currentLayer = currentLayers[tablename] ;
		return;
	}
	else{
		currentLayer={};
		currentLayer.tablename = tablename;
		currentLayer.layername=layername;
		currentLayers[tablename]=currentLayer;
		loadLayerColumndef(tablename);
	}
}





//下载图层
function downLayer(tablename) {
	window.location.href = "downShp.do?tablename=" + tablename;
}


// 查看图层信息
function showLayerInfo(tablename) {
	dojo.xhrPost({
		url : 'operatMap.do',
		content : {
			"oper" : "layerdesc",
			"layer" : tablename
		},
		dataType : "json",
		preventCache:true,
		load : function(json) {
			if (json) {
				var info = dojo.eval("(" + json + ")");
				if(!info.ret)
				{
					handleExcetion(info);
				}
				else
				{
					var innerHtml = "<table style='border: none;width: 500px;'>";
					innerHtml += "<tr><td><strong>图层名称：</strong></td><td>" + nameFormater(info.layer.layername)
							+ "</td><td><strong>图层类型：</strong></td><td>" + layerGeoTypeShowDecs[info.layer.type]
							+ "</td></tr>";
					innerHtml += "<tr><td><strong>新建时间：</strong></td><td>" + info.layer.date+ "</td>";
					if(info.layer.userid||info.layer.userid==0){
							innerHtml+="<td><strong>创建作者：</strong></td><td>"+info.layer.userid+"</td></tr>";
					}
					else{
						innerHtml+="<td></td><td></td></tr>";
					}
					innerHtml += "</table>";
					dojo.byId("layerBaseInfo").innerHTML = innerHtml;
					var data = {
						identifier : "ID",
						items : info.layer.fields
					};
					var store = new dojo.data.ItemFileWriteStore({
						data : data
					});
					layerInfoDialog.show();
					layerColumnInfoGrid.setStore(store);
				}

			} else {
				alert("没有得到图层信息！");
			}
		},
		error : function(msg) {
			console.log(msg);
			//alert("获得图层信息出现异常!");
		}
	});
}


//显示新建图层对话框
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
			"layer" : dojo.toJson(l)
		},
		dataType : "json",
		preventCache:true,
		load : function(json) {
			var info = dojo.eval("(" + json + ")");
			if(!info.ret)
			{
				handleExcetion(info);
			}
			else
			{
				loadLayers();
				//var item = dojo.clone(info.layer);
				//layersGrid.store.newItem(item);
				//layersGrid.selection.setSelected(layersGrid.getItemIndex(item), true);
				//layersGrid.onCellClick({rowIndex:layersGrid.getItemIndex(item),cellIndex:0});
				newLayerDialog.hide();

			} 

		},
		error : function(msg) {
			console.log(msg);
		}
	});
}

//根据名称删除图层
function closeLayerTab(tablename) {
	var childs = mainTabContainer.getChildren();
	for(var i=0;i<childs.length;i++){
		if(childs[i].tablename==tablename){
			childs[i].onClose(mainTabContainer,childs[i]);
			mainTabContainer.removeChild(childs[i]);
		}
	}
}

// 根据名称删除图层
function delLayerByName(name,item) {
	var data = {
		"oper" : "dellayer",
		"layer" : name
	};
	dojo.xhrPost({
		url : 'operatMap.do',
		content : data,
		// dataType : "json",
		preventCache:true,
		load : function(json) {
			var info = dojo.eval("(" + json + ")");
			if(!info.ret)
			{
				handleExcetion(info);
			}
			else
			{
				 layersGrid.store.deleteItem(item);
				 closeLayerTab(name);
			 }
		},
		error : function(msg) {
			console.log(msg);
			//alert("删除名称出错!");
		}
	});

}

//查询图层
function searchFeatures() {
	if(searchWord.validate()){
		if(currentLayer){
			var str = searchWord.getValue();
			var query = dojo.clone(currentLayer.featureGrid.query);
			query.oper="search";
			query.word=str;
			currentLayer.featureLayer.clear()
			currentLayer.featureGrid.setQuery(query);
		}else{
			alert("请确定要查询的图层！");
		}
	}else{
		alert("请输入查询内容！");
	}
}