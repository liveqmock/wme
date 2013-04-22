<%@ page language="java" contentType="text/html;charset=utf-8"
	import="java.util.*,java.net.*,com.dien.manager.servlet.OperatMapServlet,com.dien.manager.dao.bean.User,com.dien.manager.dao.bean.Config,javax.servlet.http.HttpSession"
	pageEncoding="utf-8"%>
<%
	String mapURLList = OperatMapServlet.mapURLToJSON();
	String ip = request.getLocalAddr();
	ip = "0.0.0.0".equals(ip) ? "localhost" : ip;
	String path = "arcgis_js_api/library/3.0/jsapicompact/";
	String baseURL = ip + ":" + request.getServerPort()
			+ request.getContextPath() + "/" + path;
	User users = (User) session.getAttribute("user");
	String isManager = "false";
	int userid = -1;
	if (users != null) {
		isManager = "" + users.isDataAuth();
		userid = users.getUserId();
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
<meta name="viewport"
	content="initial-scale=1, maximum-scale=1,user-scalable=no" />
<title>地盈石油数据管理-Best</title>
<link rel="stylesheet" type="text/css" href="css/main.css">
<!-- include dojo theme -->
<link rel="stylesheet" type="text/css"
	href="<%=path%>js/dojo/dijit/themes/claro/claro.css">
<link rel="stylesheet" type="text/css"
	href="<%=path%>js/dojo/dojox/grid/resources/claroGrid.css">
<link rel="stylesheet"
	href="<%=path%>js/dojo/dojox/form/resources/FileInput.css" />
<link href="css/main.css" rel="stylesheet" type="text/css" />
<link href="css/JTree.css" rel="stylesheet" type="text/css" />
<style>
<!--
.tmpgridlabel{
	display: inline-block;
	line-height: 24px;
	width: 110px;
	word-wrap: break-word;
	overflow: hidden;
}
-->
</style>
<style type="text/css">
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

#navTree {
  overflow:scroll;
  width: 100%;
  height: 100%;
  }
  
#categoryPointSymbolTree{
  overflow: scroll;
  width: 250px;
  height: 300px;
} 
.claro .dijitContentPane {
    padding: 0px !important;
}
.claro .dojoxGrid {
    padding: 0px !important;
    border: 0px solid #ffffff !important;
}
#mapDiv_zoom_slider{
z-index: 1000 !important;
}
element.style {
    z-index: 1000 !important;
}

.dijitTreeRow svg {
    vertical-align: middle;
}
.dijitTreeRow vml {
    vertical-align: middle;
}
.dijitTreeRow div {
    vertical-align: middle;
}
</style>


<script type="text/javascript">
    dojoConfig = {
		parseOnLoad:true, 
		url: "<%=baseURL%>",
		bindEncoding:"utf-8",
		userid:<%=userid%>
		
	};
</script>

<!-- reference ArcGIS JavaScript API -->
<script type="text/javascript" src="<%=path%>"></script>
<!--  script type="text/javascript" src="http://192.168.0.179:8080/manager/arcgis_js_api/library/3.1/jsapi/index.jsp"></script-->
<script type="text/javascript" src="jsupload/jsupload.nocache.js"></script>
<script type="text/javascript" src="jsv2/util.js"></script>
<script type="text/javascript" src="jsv2/main.js"></script>
<script type="text/javascript" src="jsv2/symbol.js"></script>
<script type="text/javascript" src="jsv2/manager.js"></script>
<script type="text/javascript" src="jsv2/map.js"></script>
<script type="text/javascript" src="jsv2/layer.js"></script>
<script type="text/javascript" src="jsv2/edit.js"></script>


<script type="text/javascript" src="jsv2/JTree.js"></script>
<script type="text/javascript" src="jsv2/upload.js"></script>
<script type="text/javascript" src="jsv2/util.js"></script>
<script type="text/javascript" src="jsv2/test.js"></script>
<script type="text/javascript" src="jsv2/testUpload.js"></script>
<script type="text/javascript">
	dojo.require("esri.map");
	dojo.require("esri.dijit.BasemapGallery");
	dojo.require("esri.dijit.Measurement");
	dojo.require("esri.dijit.Scalebar");
	dojo.require("esri.SnappingManager");
	dojo.require("esri.layers.osm");
	dojo.require("esri.toolbars.draw");
	dojo.require("esri.toolbars.edit");
	dojo.require("esri.layers.FeatureLayer");
	dojo.require("esri.geometry");
	dojo.require("esri.utils");
	dojo.require("esri.symbol");
	dojo.require("dojo.data.ItemFileWriteStore");
	dojo.require("dojo.dom");
	dojo.require("dojo.date");
	dojo.require("dojo.domReady!");
	dojo.require("dojo.data.ObjectStore");
	dojo.require("dojo.parser");
	dojo.require("dojo._base.lang");
	dojo.require("dojo.store.JsonRest");
	dojo.require("dojo.store.Memory");
	dojo.require("dojo.store.Cache");
	dojo.require("dojo.io.iframe");
	dojo.require("dojo.io.script");
	dojo.require("dojo._base.window");
	dojo.require("dojo.aspect");
	dojo.require("dojo.ready");
	dojo.require("dojox.grid.DataGrid");
	dojo.require("dojox.validate");
	dojo.require("dojox.validate.web");
	dojo.require("dojox.grid.DataGrid");
	dojo.require("dojox.form.FileInput");
	dojo.require("dijit.Tree");
	dojo.require("dijit.Menu");
	dojo.require("dijit.MenuItem");
	dojo.require("dijit.layout.BorderContainer");
	dojo.require("dijit.layout.TabContainer");
	dojo.require("dijit.layout.ContentPane");
	dojo.require("dijit.form.Form");
	dojo.require("dijit.form.CheckBox");
	dojo.require("dijit.form.Button");
	dojo.require("dijit.form.TextBox");
	dojo.require("dijit.form.TimeTextBox");
	dojo.require("dijit.form.Select");
	dojo.require("dijit.form.DateTextBox");
	dojo.require("dijit.form.ComboBox");
	dojo.require("dijit.form.ValidationTextBox");
	dojo.require("dijit.form.NumberTextBox");
	dojo.require("dijit.dijit"); // optimize: load dijit layer
	dojo.require("dijit.TitlePane");
	dojo.require("dijit.Dialog");
	dojo.require("dijit.form.HorizontalSlider"); 
	dojo.require("dijit.form.HorizontalRule"); 
	dojo.require("dijit.form.HorizontalRuleLabels");
	dojo.require("dojox.gfx");
	dojo.require("dijit.ProgressBar");

	
	
	var mapUrlList =<%=mapURLList%>;
    //公司网址
    var companyUrl="<%=companyUrl%>";
    var companyDescription = '<%=companyDescription%>';
    var isManager=<%=isManager%>;
    var tableColumnTypeDescription ={"1":"短整型","2":"整型","3":"浮点","4":"双精度","5":"字符串","6":"二进制","7":"日期","8":"图形","9":"栅格","10":"XML","11":"LONG","12":"UUID","13":"CLOB","14":"NSTRING","14":"文本"};
    dojo.addOnLoad(init);
</script>
</head>
<body class="claro">
	<div data-dojo-type="dijit.layout.BorderContainer" design="headline"
		data-dojo-props="design:'sidebar', gutters:true, liveSplitters:true" data-dojo-id="mainLayoutContainer"
		style="width: 100%; height: 100%;">
		<!-- 布局 -->
		<div data-dojo-type="dijit.layout.TabContainer"
			data-dojo-id="mainTabContainer" data-dojo-props="splitter:true,region:'leading'" style="width:30%;">
			<div data-dojo-type="dijit.layout.ContentPane"
				data-dojo-props='title:"图层",selected:true'>
				<div id="layersGridDiv" style="width:100%; height: 100%;"></div>
			</div>
		</div>

		<div id="centerPane" data-dojo-type="dijit.layout.BorderContainer"
			data-dojo-props="splitter:true,region:'center'">
			<div data-dojo-id="mapDiv" id=mapDiv
				data-dojo-type="dijit.layout.ContentPane"
				data-dojo-props="region:'center'"
				style="position: relative;"></div>

		</div>
		<!-- end布局 -->
		<!-- 对话框 -->
		<div data-dojo-type="dijit.Dialog" data-dojo-id="managerDialog"
				data-dojo-props='title:"管理",selected:true'
				style="width:600px; display: none">
			<div data-dojo-type="dijit.layout.BorderContainer" design="headline"
					gutters="true" liveSplitters="true" id="border"
					style="height: 450px;">
				<div id="dialogTree" data-dojo-type="dijit.layout.ContentPane"
						splitter="true" data-dojo-props="region:'leading'"
						style="width: 30%; height: 100%">
					<div id="navTree"></div>
				</div>
				<div data-dojo-id="diaGrid" data-dojo-type="dijit.layout.ContentPane"
						data-dojo-props="region:'center'"
						style="width: 60%; height: 100%; border: 1px solid #B5BCC7; padding: 0;">
					<div id="stencilGrid" style="border: 0px solid #ffffff;"></div>
				</div>
			</div>
		</div>
		
		<div data-dojo-type="dijit.Dialog" data-dojo-id="editToolsPointDialog"
			data-dojo-props='title:"点绘制",selected:true' style="display: none;">
			<div id="categoryPointSymbolTree" style="width:300px; height: 300px;overflow:scroll;"></div>
		</div>
		<div data-dojo-type="dijit.Dialog" data-dojo-id="editToolsLineDialog"
			data-dojo-props='title:"线绘制",selected:true' style="display: none;">
			<div id="categoryLineSymbolTree" style="width:300px; height: 300px;overflow:scroll;"></div>
		</div>
		<div data-dojo-type="dijit.Dialog" data-dojo-id="editToolsPolygonDialog"
			data-dojo-props='title:"面绘制",selected:true' style="display: none;">
			<div id="categoryPolygonSymbolTree" style="width:300px; height: 300px;overflow:scroll;"></div>
		</div>
		
		
		<div data-dojo-type="dijit.Dialog" data-dojo-id="newLayerDialog"
			data-dojo-props='title:"新建图层",selected:true' style="display: none">
			<div class="dijitDialogPaneContentArea">
				<table>
					<tr>
						<td><label for="layerNameInput">名称: </label></td>
						<td><input data-dojo-id="layerNameInput"
							data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
							regExp="[a-zA-Z0-9_\u4e00-\u9fa5]*$"
							required="true" trim="true" uppercase="true" promptMessage="图层名称"
							missingMessage="不能为空" invalidMessage="只能输入长度30,中英文，数字，下划线!"><span style="color: red">*</span></td>
					</tr>
					<tr>
						<td><label for="shapeType">类型: </label></td>
						<td><select data-dojo-id="shapeType" style="width: 100px;"
							data-dojo-type="dijit.form.Select">
								<option value="2">点</option>
								<option value="4">线</option>
								<option value="16">面</option>
						</select></td>
						<td><label for="layerTemplateSelect">模板: </label></td>
						<td><select data-dojo-id="layerTemplateSelect"
							style="width: 100px;" onChange="changeTemplate();" maxHeight="200"
							data-dojo-type="dijit.form.Select">
							
						</select></td>
					</tr>
				</table>
			</div>

			<div id="createLayerColumnGridDiv"
				style="width: 500px; height: 300px;"></div>

			<div class="dijitDialogPaneActionBar">
				<button data-dojo-type="dijit.form.Button" type="button"
					data-dojo-id="createLayerButton" onClick="createLayer();">新建</button>
				<button data-dojo-type="dijit.form.Button" type="button"
					onClick="newLayerDialog.hide()">取消</button>
			</div>
		</div>
		<div data-dojo-type="dijit.Dialog" data-dojo-id="layerInfoDialog"
			data-dojo-props='title:"图层信息",selected:true' style="display: none">
			<div id="layerBaseInfo"></div>
			<div id="layerColumnGridInfoDiv" style="width: 500px; height: 300px;"></div>
		</div>
		<div data-dojo-type="dijit.Dialog" data-dojo-id="uploadLayerDialog"
			data-dojo-props='title:"上传图层",selected:true' style="display: none">
			<div style="padding: 0px 0px 10px 0px;">
				<span>只支持上传zip文件(注:必须包含*.shp,*.dbf,*.shx,*.prj),<br>目前最大上传100M的zip文件！
					<br>如果上传比较大的文件可能需要比较长的处理时间！
				</span>
			</div>
			<table>
				<tr>
					<td><label for="upLayerNewName">名称:</label></td>
					<td><input data-dojo-id="upLayerNewName"
						data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
						regExp="[a-zA-Z0-9_\u4e00-\u9fa5]*$"
						required="true" trim="true" uppercase="true" promptMessage="图层名称"
						missingMessage="不能为空" invalidMessage="只能输入长度30,中英文，数字，下划线!"><span style="color: red">*</span></td>
				</tr>
				<tr>
					<td><input data-dojo-id="upLayerOleName"
						data-dojo-type="dijit.form.ValidationTextBox"
						style="display: none" /></td>
					<td><span style="color: red; font-size: 13px;"
						id="upShapeInfoAlert"></span></td>
				</tr>
				<tr>
					<td><label for="shapeType">文件: </label></td>
					<td><div id="uploader"></div></td>

				</tr>
			</table>
			<div class="dijitDialogPaneActionBar">
				<button data-dojo-type="dijit.form.Button"
					data-dojo-id="uploadLayerOkButton"
					onClick="uploadLayerChangeName();" disabled="disabled">确定</button>
				<button data-dojo-type="dijit.form.Button"
					data-dojo-id="uploadLayerCancelButton" onClick="uploadLayerDialog.hide();">取消</button>
			</div>
		</div>
		<div data-dojo-type="dijit.Dialog"
			data-dojo-id="updateLayerNameDialog"
			data-dojo-props='title:"修改地图名称",selected:true' style="display: none">
			图层名称：<input data-dojo-id="layerNewName"
				data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
				regExp="[a-zA-Z0-9_\u4e00-\u9fa5]*$"
				required="true" trim="true" missingMessage="不能为空"
				invalidMessage="只能输入长度30,中英文，数字，下划线!" /> <input data-dojo-id="layerOleName"
				data-dojo-type="dijit.form.ValidationTextBox" style="display: none" />
				
			<div class="dijitDialogPaneActionBar">
				<button data-dojo-type="dijit.form.Button"
				style="color: #000; z-Index: 99;" onClick="uploadLayerChangeName();">修改</button>
			</div>
		</div>

		<div data-dojo-type="dijit.Dialog" data-dojo-id="addStencilDialog"
			data-dojo-props='title:"新建模板",selected:true' style="display: none">
			模板名称：<input data-dojo-id="stencilName"
				data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
				required="true" trim="true" 
				regExp="[a-zA-Z0-9_\u4e00-\u9fa5]*$"
				missingMessage="不能为空"
				invalidMessage="只能输入长度30,中英文，数字，下划线!" />
			<div class="dijitDialogPaneActionBar">
				<button data-dojo-type="dijit.form.Button"
					style="color: #000; z-Index: 99;" onClick="addManagerTemplate();">新建</button>
			</div>
		</div>
		<div data-dojo-type="dijit.Dialog" data-dojo-id="addTemplateDialog"
			data-dojo-props='title:"新建模板字段",selected:true' style="display: none">

			<table>
				<tr>
					<td></td>
					<td><span style="color: red; font-size: 13px;">名称不能为默认字段:SHAPE,ID,FID,DATE,USERID,OBJECTID,SYMBOL</span>
					</td>
				</tr>
				<tr>
					<td>字段名称：</td>
					<td><input data-dojo-id="templateFieldnameInput"
						data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
						required="true" trim="true" uppercase="true"
						regExp="^[a-zA-Z\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5]*$"
						missingMessage="不能为空" invalidMessage="只能输入长度30，允许输入中文英文数字或下划线，不能以数字下划线开头!"><span
						style="color: red">*</span>
					</td>
				</tr>
				<tr>
					<td>字段类型：</td>
					<td><select data-dojo-id="templateFieldtypeInput" name="templateFieldtypeInput"
						style="width: 100px;" data-dojo-type="dijit.form.Select">
							<option value="5">字符串</option>
							<option value="2">整型</option>
							<option value="1">短整型</option>
							<option value="3">浮点</option>
							<option value="4">双精度</option>
							<option value="7">日期</option>
					</select>
					</td>
				</tr>
			</table>
			<div class="dijitDialogPaneActionBar">
				<button data-dojo-type="dijit.form.Button"
					style="color: #000; z-Index: 99;"
					onClick="addManagerTemplateField();">新建</button>
			</div>
		</div>
		<div data-dojo-type="dijit.Dialog" data-dojo-id="updateStencilDialog"
			data-dojo-props='title:"修改名称",selected:true' style="display: none">
			<table>
				<tr>
					<td>模板名称：</td>
					<td><input data-dojo-id="updateStencilName"
						data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
						required="true" trim="true" 
						regExp="[a-zA-Z0-9_\u4e00-\u9fa5]*$"
						missingMessage="不能为空"
						invalidMessage="只能输入长度30,中英文，数字，下划线!" /><span style="color: red">*</span></td>
				</tr>
			</table>
			<div class="dijitDialogPaneActionBar">
				<button data-dojo-type="dijit.form.Button"
					style="color: #000; z-Index: 99;"
					onClick="updateManagerTemplate();">修改</button>
			</div>
		</div>
		<div data-dojo-type="dijit.Dialog" data-dojo-id="updateTemplateDialog"
			data-dojo-props='title:"修改模板参数",selected:true' style="display: none">
			<table>
				<tr>
					<td></td>
					<td><span style="color: red; font-size: 13px;">名称不能为默认字段:SHAPE,ID,FID,DATE,USERID,OBJECTID,SYMBOL</span>
					</td>
				</tr>
				<tr>
					<td>字段名称：</td>
					<td><input data-dojo-id="updatefieldname"
						data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
						required="true" trim="true" uppercase="true"
						regExp="^[a-zA-Z\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5]*$"
						missingMessage="不能为空"
						invalidMessage="名称长度30，允许输入中文英文数字或下划线，不能以数字下划线开头"><span
						style="color: red">*</span></td>
				</tr>
				<tr>
					<td>模板类型：</td>
					<td><select data-dojo-id="updatefieldtype"
						name="updatefieldtype" style="width: 100px;"
						data-dojo-type="dijit.form.Select">
							<option value="5">字符串</option>
							<option value="2">整型</option>
							<option value="1">短整型</option>
							<option value="3">浮点</option>
							<option value="4">双精度</option>
							<option value="7">日期</option>
					</select></td>
				</tr>
			</table>
			<div class="dijitDialogPaneActionBar">
				<button data-dojo-type="dijit.form.Button"
					style="color: #000; z-Index: 99;"
					onClick="updateManagerTemplateField();">修改</button>
			</div>
		</div>
	<!-- 	<div data-dojo-type="dijit.Dialog" data-dojo-id="addPointDialog"
			data-dojo-props='title:"新建分类",selected:true' style="display: none">
			<input id="pointFatherId" type="text" style="display: none" />
			<table>
				<tr>
					<td>分类名称：</td>
					<td><input data-dojo-id="pointName"
						data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
						required="true" trim="true" missingMessage="不能为空"
						invalidMessage="名称长度30，允许输入中文英文数字或下划线，不能以数字下划线开头"><span
						style="color: red">*</span></td>
				</tr>
				<tr>
					<td>分类编码：</td>
					<td><input data-dojo-id="pointCode"
						data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
						required="true" regExp="^[A-Za-z0-9]+$" trim="true"
						missingMessage="不能为空" invalidMessage="只能输入数字和英文字(长度30)"><span
						style="color: red">*</span></td>
				</tr>
			</table>
			<div class="dijitDialogPaneActionBar">
                  <button data-dojo-type="dijit.form.Button" style="color: #000; z-Index: 99;" onClick="addManagerPointlate();">新建</button>
			</div>
		</div> -->

<!-- 		<div data-dojo-type="dijit.Dialog" data-dojo-id="addPointSymbolDialog"
			data-dojo-props='title:"新建分类属性",selected:true' style="display: none">

			<div data-dojo-type="dijit.form.Form" id="myForm"
				encType="multipart/form-data" action="managerPointSymbol.do"
				method="POST">

				<input data-dojo-id="fatherId" name="fatherId"
					data-dojo-type="dijit.form.ValidationTextBox" style="display: none">
				<table cellspacing="10">
					<tr>
						<td>分类名称：</td>
						<td><input data-dojo-id="pointlateName" name="pointlateName"
							data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
							required="true" trim="true" uppercase="true"
							missingMessage="不能为空" invalidMessage="只能输入长度30"><span
							style="color: red">*</span></td>
					</tr>
					<tr>
						<td>分类编码：</td>
						<td><input data-dojo-id="pointlateCode" name="pointlateCode"
							data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
							required="true" regExp="^[A-Za-z0-9]+$" trim="true"
							uppercase="true" missingMessage="不能为空"
							invalidMessage="只能输入数字和英文字(长度30)"><span
							style="color: red">*</span></td>
					</tr>
					<tr>
						<td>图标：</td>
						<td><input data-dojo-id="iconFileInput" name="iconFileInput"
							data-dojo-type="dojox.form.FileInput" label="浏览" cancelText="取消">
						</td>
					</tr>
				</table>
			
			</div>
			<div class="dijitDialogPaneActionBar">
				<button data-dojo-type="dijit.form.Button" type=button
					onClick="addPointSymbol();">新建</button>
			</div>
		</div>
		<div data-dojo-type="dijit.Dialog" data-dojo-id="updatePointDialog"
			data-dojo-props='title:"修改分类",selected:true' style="display: none">
			<table>
				<tr>
					<td>分类名称：</td>
					<td><input data-dojo-id="updatePointName"
						data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
						required="true" trim="true" missingMessage="不能为空"
						invalidMessage="只能输入长度30"><span style="color: red">*</span>
					</td>
				</tr>
				<tr>
					<td>分类编码：</td>
					<td><input data-dojo-id="updatePointCode"
						data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
						required="true" regExp="^[A-Za-z0-9]+$" trim="true"
						missingMessage="不能为空" invalidMessage="只能输入数字和英文字(长度30)"><span
						style="color: red">*</span></td>
				</tr>
			</table>
			<div class="dijitDialogPaneActionBar">
				<button data-dojo-type="dijit.form.Button"
					style="color: #000; z-Index: 99;"
					onClick="updateManagerPointlate();">修改</button>
			</div>
		</div> -->
		<div data-dojo-type="dijit.Dialog"
			data-dojo-id="updatePointSymbolDialog"
			data-dojo-props='title:"修改分类属性",selected:true' style="display: none;width: 410px;">
			<div data-dojo-type="dijit.form.Form" id="updatePointSymbolForm"
				encType="multipart/form-data" action="managerPointSymbol.do"
				method="POST">

				<input data-dojo-id="updateFatherId" name="updateFatherId"
					data-dojo-type="dijit.form.ValidationTextBox" style="display: none" />
				<input data-dojo-id="updateId" name="updateId"
					data-dojo-type="dijit.form.ValidationTextBox" style="display: none" />
				<table cellspacing="10">
					<tr>
						<td>分类名称：</td>
						<td><input data-dojo-id="updatePointlateName"
							name="updatePointlateName"
							data-dojo-type="dijit.form.ValidationTextBox" disabled></td>
					</tr>
					<!-- <tr>
						<td>分类编码：</td>
						<td><input data-dojo-id="updatePointlateCode"
							name="updatePointlateCode"
							data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
							required="true" regExp="^[A-Za-z0-9]+$" trim="true"
							uppercase="true" missingMessage="不能为空"
							invalidMessage="只能输入数字和英文字(长度30)"><span
							style="color: red">*</span></td>
					</tr> -->
					<tr>
						<td>图标：</td>
						<td><input data-dojo-id="updateIconFileInput" readonly="readonly" 
							name="updateIconFileInput" data-dojo-type="dojox.form.FileInput"
							label="浏览" cancelText="清空"></td>
					</tr>
				</table>
				
			</div>
			<div class="dijitDialogPaneActionBar">
				<button data-dojo-type="dijit.form.Button" type="button" onClick="updatePointSymbol();">修改</button>
			</div>
		</div>
		<div data-dojo-type="dijit.Dialog" data-dojo-id="AliasDialog"
			data-dojo-props='title:"修改别名",selected:true' style="display: none">
			<input data-dojo-id="LayersNameInput" name="LayersNameInput" data-dojo-type="dijit.form.ValidationTextBox" style="display: none">
			<table>
				<tr>
					<td>字段名称：</td>
					<td><input data-dojo-id="fieldNameInput"
						name="fieldNameInput" data-dojo-type="dijit.form.ValidationTextBox" disabled></td>
				</tr>
				<tr>
					<td>别名：</td>
					<td><input data-dojo-id="aliasNameInput" name="aliasNameInput"
						data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
						trim="true" regExp="[a-zA-Z0-9_\u4e00-\u9fa5]*$"
						invalidMessage="只能输入长度30,中英文，数字，下划线!" ></td>
				</tr>
			</table>
			<div class="dijitDialogPaneActionBar"><button data-dojo-type="dijit.form.Button" style="color: #000; z-Index: 99;" onClick="aliasAdd();">修改</button>
			</div>
		</div>
		<div data-dojo-type="dijit.Dialog" data-dojo-id="LayersDialog"
			data-dojo-props='title:"修改别名",selected:true' style="display: none">
			<table>
				<tr>
					<td><input data-dojo-id="LayersNameText"
						name="LayersNameText" data-dojo-type="dijit.form.ValidationTextBox" style="display: none"  disabled></td>
				</tr>
				<tr>
					<td>图层名称：</td>
					<td><input data-dojo-id="LayersAlias" name="LayersAlias"
						data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
						required="true" trim="true" 
						regExp="[a-zA-Z0-9_\u4e00-\u9fa5]*$"
						missingMessage="不能为空" invalidMessage="只能输入长度30,中英文，数字，下划线!" ></td>
				</tr>
			</table>
			<div class="dijitDialogPaneActionBar">
			<button data-dojo-type="dijit.form.Button"
							style="color: #000; z-Index: 99;" onClick="layersUpdate();">确定</button></div>
							
		</div>
		<div data-dojo-type="dijit.Dialog" data-dojo-id="symbolPickerDialog"
			data-dojo-props='title:"测试树",selected:true' style="display: none">
			<input name="typeCaption" type="text" class="inputText" id="typeCaption" />
			<div id="symbolPickerDiv"></div>	
			<div id="showTree"  style="width:300px; height: 300px;overflow:scroll;"></div>			
		</div>
		
		
		<div data-dojo-type="dijit.Dialog" data-dojo-id="testUpLoadFileDialog"
			data-dojo-props='title:"测试文件上传",selected:true' style="display: none">
			<div style="padding: 0px 0px 10px 0px;">
				<span>只支持上传zip文件(注:必须包含*.shp,*.dbf,*.shx,*.prj),<br>
				               目前最大上传100M的zip文件！<br>
				               如果上传比较大的文件可能需要比较长的处理时间！
				</span>
			</div>
			<table>
			   <tr>
					<td></td>
					<td><span style="color: red; font-size: 13px;" id="testUpShapeInfoAlert"></span></td>
				</tr>
				<tr>
					<td>名称:</td>
					<td><input data-dojo-id="testUpLayerNewName"
						data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
						regExp="[a-zA-Z0-9_\u4e00-\u9fa5]*$"
						required="true" trim="true" uppercase="true" promptMessage="图层名称"
						missingMessage="不能为空" invalidMessage="只能输入长度30,中英文，数字，下划线!"><span style="color: red">*</span>
						<input data-dojo-id="testUpLayerOleName"
						data-dojo-type="dijit.form.ValidationTextBox"
						style="display: none" /></td>
				</tr>
				<tr>
					<td>进度：</td>
					<td><div data-dojo-type="dijit.ProgressBar" id="jsProgress"
							progress="0%" maximum="100" annotate="true"></div></td>
				</tr>
				<tr>
					<td>shp：</td>
					<td><form id="testUpLoadForm" enctype="multipart/form-data" action="testupshp.do"  method="post" >
							<input type="file" id="testShpFileUpload" name="testShpFileUpload"/>
						</form>
					</td>
				</tr>
				<tr>
					<td></td>
					<td>
						<button data-dojo-type="dijit.form.Button" type="button" onClick="testUploadShape()">上传</button>
					</td>
				</tr>
			</table>
			<div class="dijitDialogPaneActionBar">
				<button data-dojo-id="testUploadLayerOkButton" data-dojo-type="dijit.form.Button" type="button"
					onClick="testUploadLayerChangeName()">创建</button>
				<button data-dojo-type="dijit.form.Button" type="button"
					onClick="testUploadStop();testUpLoadFileDialog.hide()">取消</button>
			</div>
		</div>
		<!-- end 对话框 -->
		
		
	</div>
</body>
</html>
