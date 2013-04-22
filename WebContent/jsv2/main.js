//定义显示字段
var basemapGallery;
var currentLayers = {};
var currentLayer;
var createLayerColumnGrid;
var layersGrid;
var featureGrid;
var layerColumnInfoGrid;
var measurement;
var scalebar;
var overLayer;
var layersGridCellClick;
/* 设置布局 */
var layersGridStructure;
//管理界面html
var managerToolHtml = "";





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
var layerGeoTypeShowDecs = {
		"point" : "点",
		"line" : "线",
		"polygon" : "面"
	};
function init() {
	
	esri.main.config.defaults.map.logoLink=companyUrl;

	
	//重写下树绘制图标的方法
	dijit._TreeNode.prototype._updateItemClasses = function(item){
		var tree = this.tree, model = tree.model;
		if(tree._v10Compat && item === model.root){
			item = null;
		}
		 if (isDrawToolNode(item)) {
			if (this.contentNode&&!dojo.isIE) {
				var nodeLabel = this.contentNode.childNodes[2];
				// this.contentNode.innerHTML="";
				this.contentNode.removeChild(this.contentNode.childNodes[1]);
				drawIconNode(this.contentNode, item);
				this.contentNode.appendChild(nodeLabel);
			}
		} else {
			this._applyClassAndStyle(item, "icon", "Icon");
		}
		this._applyClassAndStyle(item, "label", "Label");
		this._applyClassAndStyle(item, "row", "Row");
	};

	dijit.DialogUnderlay.prototype.hide=function(){
		// summary:
		//		Hides the dialog underlay
		if(this.bgIframe){
			this.bgIframe.destroy();
			delete this.bgIframe;
		}
		this.domNode.style.display = "none";
	}
	
	/**
	 * 初试化用户权限界面
	 */
	initPrivileges(); 

	dojo.connect(mainTabContainer, "selectChild", function(tabList) {
		map.infoWindow.hide();
		stopEditToolbar();
		stopDrawToolbar();
		measurement.stop();
		if(currentLayer&&currentLayer.editToolsDialog)
			currentLayer.editToolsDialog.hide();
		//measurement.clearResult();
		//当选择一个图层时候
		if (tabList.title != "图层"){
			if(currentLayer&&tabList.tablename==currentLayer.tablename&&currentLayer.featureLayer){
				createToolAttInspector(currentLayer.featureLayer) ;
			}else{
				currentLayer=currentLayers[tabList.tablename];
				if(currentLayer.featureLayer){
					createToolAttInspector(currentLayer.featureLayer) ;
				}
			}
			showFastToolBar(true);
			//显示编辑对话框
			showEditToolsDialog();
		}else{//隐藏绘图栏
			unCreateToolAttInspector();
			currentLayer.editToolsDialog.hide();
			mainLayoutContainer.resize();
			currentLayer=null;
			showFastToolBar(false);
		}
	});
	
	//每隔30s ping一次后台，避免session失效
	var pingTimer = setInterval("connectionFunc()", 30000);
	
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
  			console.log(msg);
  		}
		});
}


/**
 * 初试化用户权限
 */
function initPrivileges() {

	if (isManager) {
		manageUserTools();
		// 模板
		stencilColumnInfoGrid([]);
		// 管理树
		initMainTree([]);
		//showDrawToolTree([]);
		
		initManagerManagerToolHtml();
		// 初始化地图
		initMap(0);

		// 初始化图层列表
		initLayersGrid();

		// 新建图层字段grid
		initLayerColumnGrid();
		// 图层信息字段grid
		initLayerColumnInfoGrid([]);

		// 加载图层模板
		initLoadTemplates();
		
		dojo.connect(managerDialog, "onHide", initDrawToolSymbolTree);
		dojo.connect(managerDialog, "onHide", initLoadTemplates);
		dojo.connect(uploadLayerDialog, "onHide", uploadLayerCancel);
		dojo.connect(testUpLoadFileDialog, "onHide", testUploadStop);
		

		dojo.connect(dojo.byId("testShpFileUpload"),"onchange",testSelectShpFileChange);
		dojo.connect(dojo.byId("testShpFileUpload"),"onkeyup",testSelectShpFileChange);

	} else {
		normalUserTools();
		
		initNormalManagerToolHtml();

		// 初始化地图
		initMap(0);

		// 初始化图层列表
		initLayersGrid();

		// 新建图层字段grid
		initLayerColumnGrid();

		// 图层信息字段grid
		initLayerColumnInfoGrid([]);
	}


	//初试化工具条树
	initDrawToolSymbolTree();
}




/**
 * 管理员用户界面
 */
function manageUserTools() {
	//dojo.byId('managerToolsBarDiv').style.display = "inline";
	layersGridStructure = layersStructureManage;
	layersGridCellClick = layersCellClickManage;
}
/**
 * 普通用户界面
 */
function normalUserTools() {
	//dojo.byId('managerToolsBarDiv').style.display = "none";
	layersGridStructure = layersStructureNormal;
	layersGridCellClick = layersCellClickNormal;
}

function initManagerManagerToolHtml(){
	managerToolHtml = "";
	//管理代码
	managerToolHtml+="<div style=\"position: absolute; right: 20px; top: 170px; z-Index: 997;\"><div data-dojo-type=\"dijit.TitlePane\" title=\"管理\" closable=\"false\"	open=\"false\"><div data-dojo-type=\"dijit.layout.ContentPane\" data-dojo-id=\"measurementFatherDiv\" style=\"width: 250px; height: 170px; overflow: auto;\">";
	managerToolHtml+="<button data-dojo-type=\"dijit.form.Button\"  onClick=\"showNewLayerDialog();\">新建</button>";
	managerToolHtml+="<button data-dojo-type=\"dijit.form.Button\"  onClick=\"upLayer();\">上传</button>";
	managerToolHtml+="<button data-dojo-type=\"dijit.form.Button\"  onClick=\"managerTemplate();\">管理</button>";
	managerToolHtml+="</div></div></div>";
}
function initNormalManagerToolHtml(){
	managerToolHtml = "";
}

function handleExcetion(info){
	if(info.type==1){
		alert(info.msg);
		window.location.href = "index.html" ;
	}else{
		alert(info.msg);
	}
	
}

//退出
function logout(){
	if(confirm("确认要退出？")){
		dojo.xhrPost({
			url : 'logout.so',
			preventCache:true,
			dataType : "json",
			load : function(json) {
				window.location.href = "index.html"
			},
			error : function(msg) {
				console.log(msg);
				//alert("检查图层url失败!");
			}
			
		});
	}
}