
function jsuOnLoad() {
          var d = new jsu.Upload({
            type: "incubator",
            containerId: "uploader",
            validExtensions: ".zip",
            multiple: false, 
            auto: false,
            regional: {
                uploadStatusSuccess: "文件保存在服务器",
                uploadStatusError:   "无法保存该文件。",
             	uploadBrowse: "选择要保存的文件..." ,        	
             	submitError:'无法自动提交表单，您的浏览器安全问题功能。',
             	uploadStatusCanceled: '清空',
             	uploadStatusCanceling: '取消中...',
             	uploadStatusDeleted:'删除',
             	uploadStatusError:'错误',
             	uploadStatusInProgress:'进行中',
             	uploadStatusQueued:'排队',
             	uploadStatusSubmitting:'提交表单...',
             	uploadStatusSuccess:'完成',
             	uploaderActiveUpload:'已经有一正在上传，请稍后再试。',
             	uploaderAlreadyDone:'此文件已被上传。',
             	uploaderBlobstoreError : 'It seems the application is configured to use GAE blobstore.\nThe server has raised an error while creating an Upload-Url\nBe sure thar you have enabled billing for this application in order to use blobstore.',
             	uploadBrowse: '选择要上传的文件...',
             	uploaderInvalidExtension:'文件无效。只有允许类型:\n',
             	uploaderSend:'上传',
             	uploaderServerError:'无效的服务器响应。你有没有正确地配置您的应用程序在服务器端？',
             	uploaderServerUnavailable:'无法与服务器联系： ',
             	uploaderTimeout:'超时发送的文件：\n也许你的浏览器不发送文件正确，\n您的会话已过期，\n或有服务器的错误。\n请再试一次。'
            },
            /* 
             * Uncomment the next line to handle actions when 
             *  the upload status changes
             */ 
            onChange: function(evn) {
            	if(upLayerNewName.getValue()){
            		return ;
            	}
				var names = evn.filename.split("\\");
				var fn = names[names.length-1];
            	if (fn.search(".") >= 0) {
					var name = fn.substr(0,fn.lastIndexOf("."));
					upLayerNewName.setValue(name) ;
				} else {
					upLayerNewName.setValue(fn);
				}
            },
            onStatus: function(evn) {  },
            onFinish: onFinish
          });
        }

function onFinish(evn){
	if(!evn.message )return;
    if (evn.status != "ERROR") {
		if (evn.message.search("-error>") >= 0) {
			var names = evn.message.split("error>");
			names = names[1].split("<");
			dojo.byId("upShapeInfoAlert").innerHTML = names[0];
			uploadLayerOkButton.setDisabled(true);
		} else {
			var names = evn.message.split("layerid>");
			names = names[1].split("<");
			upLayerOleName.setValue(names[0]);
			uploadLayerOkButton.setDisabled(false);
			// upLayerNewName.setValue(names[0]);
			dojo.byId("upShapeInfoAlert").innerHTML = "上传" + evn.filename+ "成功";
		}
	} else {
		alert("对不起，图层上传处理过程中出现错误！");
	}
 }