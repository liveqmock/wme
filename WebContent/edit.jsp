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
			int userid =-1;
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
</style>
<script language="javascript" src="jsupload/jsupload.nocache.js"></script>

<script type="text/javascript">
    dojoConfig = {
		parseOnLoad:true, 
		url: "<%=baseURL%>",
		bindEncoding:"utf-8",
		userid:<%=userid%>
	};
</script>
<script type="text/javascript" src="js/jsupload.js"></script>
<!-- reference ArcGIS JavaScript API -->
<script type="text/javascript" src="<%=path%>"></script>
<!--  script type="text/javascript" src="http://192.168.0.179:8080/manager/arcgis_js_api/library/3.1/jsapi/index.jsp"></script-->
<script type="text/javascript" src="js/symbol.js"></script>
<script type="text/javascript" src="js/manager.js"></script>
<script type="text/javascript" src="js/map.js"></script>
<script type="text/javascript">
	dojo.require("esri.map");
	dojo.require("esri.dijit.BasemapGallery");
	dojo.require("esri.dijit.editing.Editor-all");
	dojo.require("esri.dijit.Measurement");
	dojo.require("esri.dijit.Scalebar");
	dojo.require("esri.SnappingManager");
	dojo.require("esri.layers.osm");
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
	dojo.require("dijit.dijit"); // optimize: load dijit layer
	dojo.require("dijit.TitlePane");
	dojo.require("dijit.Dialog");
	dojo.require("dijit.form.HorizontalSlider"); 
	dojo.require("dijit.form.HorizontalRule"); 
	dojo.require("dijit.form.HorizontalRuleLabels");
	
	
	
	var map;


	dojo.addOnLoad(init);
	
	var mapUrlList =<%=mapURLList%>;
    //公司网址
    var companyUrl="<%=companyUrl%>";
    var companyDescription = '<%=companyDescription%>';
    var isManager=<%=isManager%>;
    var tableColumnTypeDescription ={"1":"短整型","2":"整型","3":"浮点","4":"双精度","5":"字符串","6":"二进制","7":"日期","8":"图形","9":"栅格","10":"XML","11":"LONG","12":"UUID","13":"CLOB","14":"NSTRING","14":"文本"};

</script>
</head>
<body class="claro">
	<div data-dojo-type="dijit.layout.BorderContainer" design="headline"
		gutters="true" liveSplitters="true" data-dojo-id="mainLayoutContainer"
		style="width: 100%; height: 100%;">
		<div data-dojo-type="dijit.layout.TabContainer"
			data-dojo-id="mainTabContainer" region="leading" style="width: 30%;">
			<div data-dojo-type="dijit.layout.ContentPane"
				data-dojo-props='title:"图层",selected:true'>
				<div id="managerToolsBarDiv"
					style="width: 100%; height: 10%; display: none">
					<table>
						<tr>
							<td><button data-dojo-type="dijit.form.Button"
									style="color: #000; z-Index: 99;"
									onClick="showNewLayerDialog();">新建</button></td>
							<td><button data-dojo-type="dijit.form.Button"
									style="color: #000; z-Index: 99;" onClick="upLayer();">上传</button>
							</td>
							<td></td>
							<td></td>
							<td><button data-dojo-type="dijit.form.Button"
									style="color: #000; z-Index: 99;" onClick="managerTemplate();">管理</button>
							</td>
						</tr>
					</table>
				</div>
				<div id="layersGridDiv" style="width: 100%; height: 90%;"></div>
			</div>
		</div>

		<div id="centerPane" data-dojo-type="dijit.layout.BorderContainer"
			data-dojo-props="region:'center',gutters:'false'">
			<div data-dojo-id="mapDiv" id=mapDiv data-dojo-type="dijit.layout.ContentPane"
				data-dojo-props="region:'center'"
				style="position: relative; overflow: hidden;">
			</div>
			<div id="editContentPane" data-dojo-type="dijit.layout.ContentPane"
				data-dojo-props="region:'bottom'">
				<div id="templatePickerDiv"></div>
				<div id="editorDiv"></div>
			</div>

			<div data-dojo-type="dijit.Dialog" data-dojo-id="updatePointDialog" data-dojo-props='title:"修改分类",selected:true' style="display: none">
				<table>
					<tr>
						<td>分类名称：</td>
						<td><input data-dojo-id="updatePointName"
							data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
							required="true" trim="true" missingMessage="不能为空"
							invalidMessage="只能输入长度30"> <span style="color: red">*</span>
						</td>
					</tr>
					<tr>
						<td>分类代码：</td>
						<td><input data-dojo-id="updatePointCode"
							data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
							required="true" regExp="^[A-Za-z0-9]+$" trim="true"
							missingMessage="不能为空" invalidMessage="只能输入数字和英文字(长度30)"><span
							style="color: red">*</span></td>
					</tr>
					<tr>
						<td></td>
						<td><button data-dojo-type="dijit.form.Button"
								style="color: #000; z-Index: 99;"
								onClick="updateManagerPointlate();">修改</button></td>
					</tr>
				</table>
			</div>
			<div data-dojo-type="dijit.Dialog" data-dojo-id="newLayerDialog" data-dojo-props='title:"新建图层",selected:true' style="display: none">
				<div class="dijitDialogPaneContentArea">
					<table >
						<tr>
							<td><label for="layerNameInput">名称: </label></td>
							<td><input data-dojo-id="layerNameInput"
								data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
								required="true" trim="true" uppercase="true"
								promptMessage="图层名称" missingMessage="不能为空"
								invalidMessage="只能输入长度30"></td>
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
								style="width: 100px;" onChange="changeTemplate();"
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
			<div data-dojo-type="dijit.Dialog" data-dojo-id="layerInfoDialog" data-dojo-props='title:"图层信息",selected:true' style="display: none">
				<div id="layerBaseInfo"></div>
				<div id="layerColumnGridInfoDiv"
					style="width: 500px; height: 300px;"></div>
			</div>
			<div data-dojo-type="dijit.Dialog" data-dojo-id="uploadLayerDialog" data-dojo-props='title:"上传图层",selected:true' style="display: none">
				<div style="padding: 0px 0px 10px 0px;">
					<span >只支持上传zip文件(注:必须包含*.shp,*.dbf,*.shx,*.prj),<br>目前最大上传100M的zip文件！</span>
				</div>
				<table >
						<tr>
							<td><label for="upLayerNewName">名称: </label></td>
							<td><input data-dojo-id="upLayerNewName"
								data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
								required="true" trim="true" uppercase="true"
								promptMessage="图层名称" missingMessage="不能为空"
								invalidMessage="只能输入长度30"></td>
						</tr>
						<tr>
							<td><input data-dojo-id="upLayerOleName" data-dojo-type="dijit.form.ValidationTextBox" style="display: none" /></td>
							<td><span style="color: red; font-size: 13px;" id="upShapeInfoAlert"></span></td>
						</tr>
						<tr>
							<td><label for="shapeType">文件: </label></td>
							<td><div id="uploader"></div></td>
		
						</tr>
					</table>
				<div class="dijitDialogPaneActionBar">
					<button data-dojo-type="dijit.form.Button" data-dojo-id="uploadLayerOkButton" onClick="uploadLayerChangeName();" disabled="disabled">确定</button>
					<button data-dojo-type="dijit.form.Button" data-dojo-id="uploadLayerCancelButton" onClick="uploadLayerCancel">取消</button>
				</div>
			</div>
			<div data-dojo-type="dijit.Dialog" data-dojo-id="updateLayerNameDialog" data-dojo-props='title:"修改地图名称",selected:true' style="display: none">
				图层名称：<input data-dojo-id="layerNewName"
					data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
					required="true" trim="true" missingMessage="不能为空"
					invalidMessage="只能输入长度30" /> <input
					data-dojo-id="layerOleName"
					data-dojo-type="dijit.form.ValidationTextBox" style="display: none" />
				<button data-dojo-type="dijit.form.Button"
					style="color: #000; z-Index: 99;" onClick="uploadLayerChangeName();">修改</button>

			</div>
			<div data-dojo-type="dijit.Dialog" data-dojo-id="managerDialog" data-dojo-props='title:"管理",selected:true' style="width: 60%;display: none">
				<div data-dojo-type="dijit.layout.BorderContainer" design="headline"
					gutters="true" liveSplitters="true" id="border"
					style=" height:450px;">
					<div id="dialogTree" data-dojo-type="dijit.layout.ContentPane"
						splitter="true" region="leading"
						style="width: 30%; height: 100%">
						<div id="navTree"></div>
					</div>
					<div id="diaGrid" data-dojo-type="dijit.layout.ContentPane"
						data-dojo-props="region:'center'"
						style="width: 60%; height: 100%; border: 1px solid #000; padding: 0;">
						<div id="stencilGrid" ></div>
					</div>
				</div>
			</div>
			<div data-dojo-type="dijit.Dialog" data-dojo-id="addStencilDialog" data-dojo-props='title:"新建模版",selected:true' style="display: none">
				模版名称：<input data-dojo-id="stencilName"
					data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
					required="true" trim="true" missingMessage="不能为空"
					invalidMessage="只能输入长度30" />
				<button data-dojo-type="dijit.form.Button"
					style="color: #000; z-Index: 99;" onClick="addManagerTemplate();">新建</button>
			</div>
			<div data-dojo-type="dijit.Dialog" data-dojo-id="addTemplateDialog" data-dojo-props='title:"新建模板参数",selected:true' style="display: none">

				<table>
					<tr>
						<td></td>
						<td><span style="color: red; font-size: 13px;">名称不能为默认字段:SHAPE,ID,FID</span>
						</td>
					</tr>
					<tr>
						<td>字段名称：</td>
						<td><input data-dojo-id="fieldname"
							data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
							required="true" trim="true" uppercase="true" regExp="^[a-zA-Z\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5]*$"
							missingMessage="不能为空" invalidMessage="只能输入长度30"> <span
							style="color: red">*</span></td>
					</tr>
					<tr>
						<td>模版类型：</td>
						<td><select data-dojo-id="fieldtype" name="fieldtype"
							style="width: 100px;" data-dojo-type="dijit.form.Select">
								<option value="5">字符串</option>
								<option value="2">整型</option>
								<option value="1">短整型</option>
								<option value="3">浮点</option>
								<option value="4">双精度</option>
								<option value="7">日期</option>
						</select></td>
					</tr>
					<tr>
						<td></td>
						<td><button data-dojo-type="dijit.form.Button"
								style="color: #000; z-Index: 99;"
								onClick="addManagerTemplateField();">确定</button></td>
					</tr>
				</table>
			</div>
			<div data-dojo-type="dijit.Dialog" data-dojo-id="updateStencilDialog" data-dojo-props='title:"修改模版",selected:true' style="display: none">
				模版名称：<input data-dojo-id="updateStencilName"
					data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
					required="true" trim="true" missingMessage="不能为空"
					invalidMessage="只能输入长度30" />
				<button data-dojo-type="dijit.form.Button"
					style="color: #000; z-Index: 99;"
					onClick="updateManagerTemplate();">修改</button>
			</div>
			<div data-dojo-type="dijit.Dialog" data-dojo-id="updateTemplateDialog" data-dojo-props='title:"修改模版参数",selected:true' style="display: none">
				<table>
					<tr>
						<td></td>
						<td><span style="color: red; font-size: 13px;">名称长度30，不能为默认字段:SHAPE,ID,FID,DATE,</span>
						</td>
					</tr>
					<tr>
						<td>字段名称：</td>
						<td><input data-dojo-id="updatefieldname"
							data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
							required="true" trim="true" uppercase="true" regExp="^[a-zA-Z\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5]*$"
							missingMessage="不能为空" invalidMessage="名称长度30，允许输入中文英文数字或下划线，不能以数字下划线开头"><span
							style="color: red">*</span></td>
					</tr>
					<tr>
						<td>模版类型：</td>
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
					<tr>
						<td></td>
						<td><button data-dojo-type="dijit.form.Button"
								style="color: #000; z-Index: 99;"
								onClick="updateManagerTemplateField();">修改</button></td>
					</tr>
				</table>
			</div>
			<div data-dojo-type="dijit.Dialog" data-dojo-id="addPointDialog" data-dojo-props='title:"新建分类",selected:true' style="display: none">
				<input id="pointFatherId" type="text" style="display: none" />
				<table>
					<tr>
						<td>分类名称：</td>
						<td><input data-dojo-id="pointName"
							data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
							required="true" trim="true" missingMessage="不能为空"
							invalidMessage="名称长度30"> <span style="color: red">*</span>
						</td>
					</tr>
					<tr>
						<td>分类代码：</td>
						<td><input data-dojo-id="pointCode"
							data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
							required="true" regExp="^[A-Za-z0-9]+$" trim="true"
							missingMessage="不能为空" invalidMessage="只能输入数字和英文字(长度30)"><span
							style="color: red">*</span></td>
					</tr>
					<tr>
						<td></td>
						<td><button data-dojo-type="dijit.form.Button"
								style="color: #000; z-Index: 99;"
								onClick="addManagerPointlate();">新建</button></td>
					</tr>
				</table>
			</div>

			<div data-dojo-type="dijit.Dialog" data-dojo-id="addPointSymbolDialog" data-dojo-props='title:"新建分类属性",selected:true' style="display: none">

				<div data-dojo-type="dijit.form.Form" id="myForm"
					encType="multipart/form-data" action="managerPointSymbol.do"
					method="POST">

					<input data-dojo-id="fatherId" name="fatherId"
						data-dojo-type="dijit.form.ValidationTextBox"
						style="display: none">
					<table style="border: 1px solid #9f9f9f;" cellspacing="10">
						<tr>
							<td>分类名称：</td>
							<td><input data-dojo-id="pointlateName" name="pointlateName"
								data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
								required="true" trim="true" uppercase="true"
								missingMessage="不能为空" invalidMessage="只能输入长度30"> <span
								style="color: red">*</span></td>
						</tr>
						<tr>
							<td>分类编码：</td>
							<td><input data-dojo-id="pointlateCode" name="pointlateCode"
								data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
								required="true" regExp="^[A-Za-z0-9]+$" trim="true"
								uppercase="true" missingMessage="不能为空"
								invalidMessage="只能输入数字和英文字(长度30)"> <span
								style="color: red">*</span></td>
						</tr>
						<tr>
							<td>图标：</td>
							<td><input data-dojo-id="iconFileInput" name="iconFileInput"
								data-dojo-type="dojox.form.FileInput" label="浏览" cancelText="取消">
							</td>
						</tr>
					</table>
					<button data-dojo-type="dijit.form.Button" type=button
						onClick="addPointSymbol();">新建</button>
				</div>
			</div>
			<div data-dojo-type="dijit.Dialog" data-dojo-id="updatePointSymbolDialog" data-dojo-props='title:"修改分类属性",selected:true' style="display: none">

				<div data-dojo-type="dijit.form.Form" id="updatePointSymbolForm"
					encType="multipart/form-data" action="managerPointSymbol.do"
					method="POST">

					<input data-dojo-id="updateFatherId" name="updateFatherId"
						data-dojo-type="dijit.form.ValidationTextBox"
						style="display: none" /> <input data-dojo-id="updateId"
						name="updateId" data-dojo-type="dijit.form.ValidationTextBox"
						style="display: none" />
					<table style="border: 1px solid #9f9f9f;" cellspacing="10">
						<tr>
							<td>分类名称：</td>
							<td><input data-dojo-id="updatePointlateName"
								name="updatePointlateName"
								data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
								required="true" trim="true" uppercase="true"
								missingMessage="不能为空" invalidMessage="只能输入长度30"> <span
								style="color: red">*</span></td>
						</tr>
						<tr>
							<td>分类编码：</td>
							<td><input data-dojo-id="updatePointlateCode"
								name="updatePointlateCode"
								data-dojo-type="dijit.form.ValidationTextBox" maxlength="30"
								required="true" regExp="^[A-Za-z0-9]+$" trim="true"
								uppercase="true" missingMessage="不能为空"
								invalidMessage="只能输入数字和英文字(长度30)"> <span
								style="color: red">*</span></td>
						</tr>
						<tr>
							<td>图标：</td>
							<td><input data-dojo-id="updateIconFileInput"
								name="updateIconFileInput" data-dojo-type="dojox.form.FileInput"
								label="浏览" cancelText="清空"></td>
						</tr>
					</table>
					<button data-dojo-type="dijit.form.Button" type="button"
						onClick="updatePointSymbol();">修改</button>
				</div>
			</div>

		</div>
	</div>
</body>
</html>
