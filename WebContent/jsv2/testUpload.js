
function testUploadStart(){
	testUpLoadFileDialog.show();
	testUpLayerNewName.reset();
	testUpLayerOleName.reset();
	dojo.byId("testShpFileUpload").value="";
}


function testSelectShpFileChange(){
	
	var fileName = dojo.byId("testShpFileUpload").value;
	if(fileName){
		var names= fileName.split("\\");
		fileName = names[names.length - 1];
		names = fileName.split(".");
		if(!testUpLayerNewName.getValue()&&names.length>0){
			testUpLayerNewName.setValue(names[0]);
		}
	}
}

/* 修改分类 属性 */
function testUploadShape() {
	console.log("开始上传！");
	if(!dojo.byId("testShpFileUpload").value){
		dojo.byId("testUpShapeInfoAlert").innerHTML = "你没有选择任何文件";
		return;
	}
	var uploadForm = dojo.byId("testUpLoadForm");
	if(uploadForm){
		testUpLoadFileDialog.uploadIframe = dojo.io.iframe.send({
			form : uploadForm,
			url : "testupshp.do",
			handleAs : "json",
			load : function(response, ioArgs) {
				if (response.message&&response.message.ret) {
					testUpLayerOleName.setValue(response.message.layerName);
					testUploadLayerOkButton.setDisabled(false);
				} 
				testUpLoadFileDialog.timer && window.clearInterval(testUpLoadFileDialog.timer);
				testUpLoadFileDialog.timer=null;
				dojo.byId("testUpShapeInfoAlert").innerHTML = response.message.msg;
			}
		});
	}
	console.log("开始更新进度！");

	testUpLoadFileDialog.timer = window.setInterval('testUploadUpdatePresent()', 500);  //定时触发事件
}


/* 修改分类 属性 */
function testUploadUpdatePresent() {
	console.log("刷新进度！");
	var data = {};
	dojo.xhrGet({
		url : 'testupshp.do',
		content : data,
		// dataType : "json",
		preventCache:true,
		load : function(json) {
			console.log("刷新进度获得响应！");
			var info = dojo.eval("(" + json + ")");
			if(!info.ret)
			{
				handleExcetion(info);
			}
			else
			{
				if(info.percent){
					dijit.byId("jsProgress").update({progress: info.percent});
				}
			}
		},
		error : function(msg) {
			console.log(msg);
		}
	});
}
/* 修改分类 属性 */
function testRemoveUpload() {
	console.log("刷新进度！");
	var data = {cancel:"cancel"};
	dojo.xhrGet({
		url : 'testupshp.do',
		content : data,
		// dataType : "json",
		preventCache:true,
		load : function(json) {
			console.log("刷新进度获得响应！");
			var info = dojo.eval("(" + json + ")");
			if(!info.ret)
			{
				handleExcetion(info);
				testUploadStop();
			}
			else
			{
				//alert(info.msg);
				dojo.byId("testUpShapeInfoAlert").innerHTML = info.msg;
			}
		},
		error : function(msg) {
			console.log(msg);
		}
	});
}

function testUploadStop() {
	testUpLoadFileDialog.uploadIframe&&testUpLoadFileDialog.uploadIframe.cancel();
	testUpLoadFileDialog.uploadIframe=null;
	testUpLoadFileDialog.timer && window.clearInterval(testUpLoadFileDialog.timer);
	testUpLoadFileDialog.timer=null;
	testRemoveUpload();
}

//修改上传图层名称，
function testUploadLayerChangeName() {
	if (!testUpLayerOleName.validate()) {
		alert("请先上传一个文件！");
		return;
	}
	if (!testUpLayerNewName.validate()) {
		alert("请输入正确图层名称！");
		return;
	}
	if (!nameLength(testUpLayerNewName.getValue())) {
		return;
	}
	var data = {
		"oper" : "updatelayername",
		"oldlayername" : testUpLayerOleName.getValue(),
		"newlayername" : testUpLayerNewName.getValue()
	};
	testUploadLayerOkButton.setDisabled(true);
	dojo.xhrPost({
		url : 'shpToSde.do',
		content : data,
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
				testUpLoadFileDialog.hide();
			}
			testUploadLayerOkButton.setDisabled(false);
		},
		error : function(msg) {
			console.log(msg);
			//alert("shp文件导入sde时候出现错误!");
		}
	});
}