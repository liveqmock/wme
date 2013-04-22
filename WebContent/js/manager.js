var navTree_;
var layerTemplateGrid;
// 右键id
var rFatherId;
// 左键id
var lFatherId;
//
var gridId;
//
var pointtype;
function initMainTree(items) {
	// 管理树
	var treeStore = new dojo.data.ItemFileWriteStore({
		data : {
			identifier : 'id',
			label : 'name',
			items : items
		}
	});
	var treeModel = new dijit.tree.ForestStoreModel({
		store : treeStore,
		query : {
			'root' : true
		}
	});

	navTree_ = new dijit.Tree({
		model : treeModel,
		showRoot : false
	}, "navTree");

	navTree_.onClick = function(item) {
		if (item.flag == "temp") {
			var ids = item.id[0].split("_");
			lFatherId = ids[1];
			templateList(lFatherId);
		} else {
			pointtype = item.children;
			pointList(item.id);
			dojo.byId("pointFatherId").value = item.id;
			fatherId.setValue(item.id);
			updateFatherId.setValue(item.id);
		}
	};
	// var menu = dijit.byId("tree_menu_PointSymbel");
	var menu = new dijit.Menu();
	// when we right-click anywhere on the tree, make sure we open the menu
	menu.bindDomNode(navTree_.domNode);
	dojo.connect(menu, "_openMyself", this, function(e) {
		// get a hold of, and log out, the tree node that was the source of this
		// open event
		var tn = dijit.getEnclosingWidget(e.target);
		console.debug(tn);
		// now inspect the data store item that backs the tree node:
		currentItem = tn.item;
		console.debug(currentItem);
		// contrived condition: if this tree node doesn't have any children,
		// disable all of the menu items
		for (; menu.getChildren().length > 0;) {
			menu.removeChild(0);
		}
		// menu.getChildren().forEach(function(i) {
		// menu.removeChild(i);// i.attr('disabled', !tn.item.children);
		// });
		if (currentItem.flag == "temp") {
			var ids = currentItem.id[0].split("_");
			rFatherId = ids[1];
			if (!currentItem.children) {
				menu.addChild(new dijit.MenuItem({
					label : "修改名称",
					onClick : function(/* Event */) {
						updateStencilName.setValue(currentItem.name);
						updateStencilDialog.show();
					}
				}));
				menu.addChild(new dijit.MenuItem({
					label : "新建字段",
					onClick : function(/* Event */) {
						fieldname.setValue("");
						fieldtype.setValue("5");
						addTemplateDialog.show();
					}
				}));
				menu
						.addChild(new dijit.MenuItem(
								{
									label : "删除模版",
									onClick : function(event, item) {
										if (confirm("你真的要删除" + currentItem.name
												+ "吗？") == true) {
											delManagerTemplate(rFatherId);
										}

									}
								}));

			} else {

				menu.addChild(new dijit.MenuItem({
					label : "新建模版",
					onClick : function(/* Event */) {
						stencilName.setValue("");
						addStencilDialog.show();
					}
				}));
			}
		} else {
			dojo.byId("pointFatherId").value = currentItem.id;
			if (!currentItem.children) {
				fatherId.setValue(currentItem.id);

				menu.addChild(new dijit.MenuItem({
					label : "修改分类",
					onClick : function(/* Event */) {
						updatePointName.setValue(currentItem.name);
						updatePointCode.setValue(currentItem.code);

						updatePointDialog.show();
					}
				}));

				menu.addChild(new dijit.MenuItem({
					label : "新建分类",
					onClick : function(/* Event */) {
						pointlateName.setValue("");
						pointlateCode.setValue("");
						iconFileInput.reset();
						addPointSymbolDialog.show();
					}
				}));
				menu
						.addChild(new dijit.MenuItem(
								{
									label : "删除分类",
									onClick : function(/* Event */) {
										if (confirm("你真的要删除" + currentItem.name
												+ "吗？") == true) {
											delPointlate(currentItem.id);
										}
									}
								}));
			} else {
				updateFatherId.setValue(currentItem.id);
				if (currentItem.id != -3) {
					menu.addChild(new dijit.MenuItem({
						label : "修改名称",
						onClick : function(/* Event */) {
							updatePointName.setValue(currentItem.name);
							updatePointCode.setValue(currentItem.code);
							updatePointDialog.show();
						}
					}));
				}
				menu.addChild(new dijit.MenuItem({
					label : "新建分类",
					onClick : function(/* Event */) {
						pointName.setValue("");
						pointCode.setValue("");
						addPointDialog.show();

					}
				}));
			}
		}
		// menu.getChildren().forEach(function(i){
		// i.attr('disabled',!tn.item.children); });
		menu.focus();
		// IMPLEMENT CUSTOM MENU BEHAVIOR HERE
	});
}
/* 模版管理表格 */
function stencilColumnGrid(items) {
	var store = new dojo.data.ItemFileWriteStore({
		data : {
			identifier : "id",
			items : items
		}
	});
	/* set up layout */
	var layout = [ [
			{
				name : '模版名称',
				field : 'name',
				width : '100px',
				canSort : true
			},
			{
				'name' : "修改",
				'field' : "del",
				formatter : function(item, rowIndex, cell) {
					return "<img alt='修改' id='imgDel' class='imgBtn' src='images/edit_16x16.png' />";
				},
				'width' : '40px'
			},
			{
				'name' : "删除",
				'field' : "del",
				formatter : function(item, rowIndex, cell) {
					return "<img alt='删除' id='imgDel' class='imgBtn' src='images/nav_decline.png' />";
				},
				'width' : '40px'
			} ] ];

	/* create a new layerColumnGrid */
	layerTemplateGrid = new dojox.grid.DataGrid({
		id : 'stencilGrid',
		store : store,
		sortFields : [ {
			attribute : "id",
			descending : false
		} ],
		structure : layout,
		columnReordering : true,
		rowSelector : '20px'
	});

	/* append the new layerColumnGrid to the div */
	layerTemplateGrid.placeAt("stencilGrid");
	layerTemplateGrid.startup();
	layerTemplateGrid.on("CellClick", function(evt) {
		var idx = evt.rowIndex;
		var idc = evt.cellIndex;
		var item = this.getItem(idx);
		var name = store.getValue(item, "name");
		var id = store.getValue(item, "id");
		// 如果是detail按钮被按下
		if (idc == this.structure[0].length - 1) {
			if (confirm("你真的要删除" + name + "吗？")) {
				delManagerTemplate(id);
			}
		}
		if (idc == this.structure[0].length - 2) {
			rFatherId = id;
			updateStencilName.setValue(name);
			updateStencilDialog.show()

		}
	});
}
/* 模版表格 */
function stencilColumnInfoGrid(items) {

	var store = new dojo.data.ItemFileWriteStore({
		data : {
			identifier : "id",
			items : items
		}
	});

	/* set up layout */
	var layout = [ [
			{
				name : '字段名称',
				field : 'fieldname',
				width : '100px'
			},
			{
				name : '模版类型',
				field : 'fieldtype',
				width : '100px',
				formatter : function(item, rowIndex, cell) {
					return tableColumnTypeDescription[item] ? tableColumnTypeDescription[item]
							: "其它";

				}
			},
			{
				'name' : "修改",
				'field' : "del",
				formatter : function(item, rowIndex, cell) {
					return "<img alt='修改' id='imgDel' class='imgBtn' src='images/edit_16x16.png' />";
				},
				'width' : '40px'
			},
			{
				'name' : "删除",
				'field' : "del",
				formatter : function(item, rowIndex, cell) {
					return "<img alt='删除' id='imgDel' class='imgBtn' src='images/nav_decline.png' />";
				},
				'width' : '40px'
			} ] ];

	/* create a new layerColumnGrid */
	layerTemplateGrid = new dojox.grid.DataGrid({
		id : 'stencilGrid',
		store : store,
		structure : layout,
		sortFields : [ {
			attribute : "id",
			descending : false
		} ],
		rowSelector : '20px'
	});

	/* append the new layerColumnGrid to the div */
	layerTemplateGrid.placeAt("stencilGrid");
	layerTemplateGrid.startup();
	layerTemplateGrid.on("CellClick", function(evt) {
		var idx = evt.rowIndex;
		var idc = evt.cellIndex;
		var item = this.getItem(idx);
		var name = store.getValue(item, "fieldname");
		var id = store.getValue(item, "id");
		// 如果是detail按钮被按下
		if (idc == this.structure[0].length - 1) {
			if (confirm("你真的要删除" + name + "吗？") == true) {
				delTemplateField(id);
			}
		}
		if (idc == this.structure[0].length - 2) {
			updatefieldname.setValue(name);
			updatefieldtype.setValue(store.getValue(item, "fieldtype"));
			gridId = id;
			updateTemplateDialog.show();
		}
	});
}
/* 分类表格 */
function managerPointSymbolGrid(items) {

	var store = new dojo.data.ItemFileWriteStore({
		data : {
			identifier : "id",
			items : items
		}
	});

	/*
	 * set up layout
	 */
	var layout;
	if (!pointtype) {
		layout = [ [
				{
					name : '分类名称',
					field : 'name',
					width : '100px'
				},
				{
					name : '图标',
					field : 'image',
					width : '100px',
					formatter : function(item, rowIndex, cell) {
						if (item) {
							return "<img class='imgBtn' style='width:16px;height:16px' src='symbolImage.do?type=point&name="
									+ item + "' />";
						} else {
							return "";
						}
					}
				},
				{
					name : '分类编码',
					field : 'pointcode',
					width : '100px'
				},
				{
					'name' : "修改",
					'field' : "del",
					formatter : function(item, rowIndex, cell) {
						return "<img alt='修改' id='imgDel' class='imgBtn' src='images/edit_16x16.png' />";
					},
					'width' : '40px'
				},
				{
					'name' : "删除",
					'field' : "del",
					formatter : function(item, rowIndex, cell) {
						return "<img alt='删除' class='imgBtn' src='images/nav_decline.png' />";
					},
					'width' : '40px'
				} ] ];
	} else {
		layout = [ [
				{
					name : '分类名称',
					field : 'name',
					width : '100px'
				},
				{
					name : '分类编码',
					field : 'pointcode',
					width : '100px'
				},
				{
					'name' : "修改",
					'field' : "del",
					formatter : function(item, rowIndex, cell) {
						return "<img alt='修改' id='imgDel' class='imgBtn' src='images/edit_16x16.png' />";
					},
					'width' : '40px'
				},
				{
					'name' : "删除",
					'field' : "del",
					formatter : function(item, rowIndex, cell) {
						return "<img alt='删除' class='imgBtn' src='images/nav_decline.png' />";
					},
					'width' : '40px'
				} ] ];
	}

	/* create a new layerColumnGrid */
	layerTemplateGrid = new dojox.grid.DataGrid({
		id : 'stencilGrid',
		store : store,
		structure : layout,
		sortFields : [ {
			attribute : "id",
			descending : false
		} ],
		rowSelector : '20px'
	});

	/* append the new layerColumnGrid to the div */
	layerTemplateGrid.placeAt("stencilGrid");
	layerTemplateGrid.startup();
	layerTemplateGrid.on("CellClick",
			function(evt) {
				var idx = evt.rowIndex;
				var idc = evt.cellIndex;
				var item = this.getItem(idx);
				var name = store.getValue(item, "name");
				var id = store.getValue(item, "id");

				// 如果是detail按钮被按下
				if (idc == this.structure[0].length - 1) {
					if (confirm("你真的要删除" + name + "吗？") == true) {
						delPointlate(id);
					}
				}
				if (idc == this.structure[0].length - 2) {
					if (!pointtype) {
						updateIconFileInput.reset();
						updateId.setValue(id);
						updatePointlateName.setValue(name);
						updatePointlateCode.setValue(store.getValue(item,
								"pointcode"));
						updateIconFileInput.setValue(store.getValue(item,
								"image"));
						updatePointSymbolDialog.show();
					} else {
						dojo.byId("pointFatherId").value = id;
						updatePointName.setValue(name);
						updatePointCode.setValue(store.getValue(item,
								"pointcode"));
						updatePointDialog.show();
					}
				}
			});
}
/* 查询树 */
function managerTemplate() {
	dojo
			.xhrPost({
				url : 'managerTemplate.do',
				content : {
					"oper" : "query"
				},
				dataType : "json",
				load : function(json) {
					if (json) {
						var info = dojo.eval("(" + json + ")");
						if (info.ret) {
							navTree_.destroy();
							dojo.byId("dialogTree").innerHTML = "<div id='navTree'></div>";
							initMainTree(info.layers);
							managerDialog.show();
						} else {
							alert("你好！你的权限错误，无法进行管理操作");
						}

					} else {
						alert("没有得到模版信息！");
					}
				},
				error : function(msg) {
					// alert("获得模版信息时出现异常!");
				}
			});
}
/* 查询模版 */
function templateList(tempid) {
	// stencilName.setValue(tempid);
	if (tempid) {
		dojo
				.xhrPost({
					url : 'managerTemplate.do',
					content : {
						"oper" : "list",
						"tempid" : tempid
					},
					dataType : "json",
					load : function(json) {
						if (json) {
							var info = dojo.eval("(" + json + ")");
							layerTemplateGrid.destroy();
							dojo.byId("diaGrid").innerHTML = "<div id='stencilGrid' style='width: 99.5%; height: 95%;'></div>";
							stencilColumnInfoGrid(info["layers"]);
						} else {
							alert("没有得到模版信息！");
						}
					},
					error : function(msg) {
						// alert("获得模版出现异常!");
					}
				});
	} else {
		dojo
				.xhrPost({
					url : 'managerTemplate.do',
					content : {
						"oper" : "list",
						"tempid" : tempid
					},
					dataType : "json",
					load : function(json) {
						if (json) {
							var info = dojo.eval("(" + json + ")");
							layerTemplateGrid.destroy();
							dojo.byId("diaGrid").innerHTML = "<div id='stencilGrid' style='width: 99.5%; height: 95%;'></div>";
							stencilColumnGrid(info["layers"]);
						} else {
							alert("没有得到模版信息！");
						}
					},
					error : function(msg) {
						// alert("获得模版出现异常!");
					}
				});
	}
}

/* 增加模版 */
function addManagerTemplate() {
	if (stencilName.validate()) {
		dojo.xhrPost({
			url : 'managerTemplate.do',
			content : {
				"oper" : "addtemp",
				"name" : stencilName.getValue()
			},
			dataType : "json",
			load : function(json) {
				if (json) {
					var info = dojo.eval("(" + json + ")");
					if (info.ret) {
						addStencilDialog.hide();
						managerTemplate();
						rFatherId = info.id;
						templateList(info.id);
					} else {
						alert(info.msg);
					}
				} else {
					alert("新建模版信息时出现异常!");
				}
			},
			error : function(msg) {
				// alert("新建模版信息时出现异常!");
			}
		});

	} else {
		alert('请输入正确的参数后提交！');
	}
}
/* 修改模版 */
function updateManagerTemplate() {
	if (updateStencilName.validate()) {
		dojo.xhrPost({
			url : 'managerTemplate.do',
			content : {
				"oper" : "update",
				"id" : rFatherId,
				"name" : updateStencilName.getValue()
			},
			dataType : "json",
			load : function(json) {
				if (json) {
					var info = dojo.eval("(" + json + ")");
					if (info.ret) {
						updateStencilDialog.hide();
						rFatherId = info.id;
						managerTemplate();
						templateList(info.id);
					} else {
						alert(info.msg);
					}
				} else {
					alert("修改模版信息时出现异常!");
				}
			},
			error : function(msg) {
				// alert("修改模版信息时出现异常!");
			}
		});

	} else {
		alert('请输入正确的参数后提交！');
	}
}
/* 增加模版字段 */
function addManagerTemplateField() {
	if (fieldname.validate() && fieldtype.validate()) {
		dojo.xhrPost({
			url : 'managerTemplate.do',
			content : {
				"oper" : "add",
				"fieldname" : fieldname.getValue(),
				"tempid" : rFatherId,
				"fieldtype" : fieldtype.getValue()
			},
			dataType : "json",
			load : function(json) {
				if (json) {
					var info = dojo.eval("(" + json + ")");
					if (info.ret) {
						addTemplateDialog.hide();
						managerTemplate();
						templateList(rFatherId);
					} else {
						alert(info.msg);
					}
				} else {
					alert("新建模版信息时出现异常!");
				}
			},
			error : function(msg) {
				// alert("新建模版信息时出现异常!");
			}
		});

	} else {
		alert('请输入正确的参数后提交！');
	}
}
/* 修改模版字段 */
function updateManagerTemplateField() {
	if (updatefieldname.validate() && updatefieldtype.validate()) {
		dojo.xhrPost({
			url : 'managerTemplate.do',
			content : {
				"oper" : "updateTemp",
				"id" : gridId,
				"fieldname" : updatefieldname.getValue(),
				"tempid" : lFatherId,
				"fieldtype" : updatefieldtype.getValue()
			},
			dataType : "json",
			load : function(json) {
				if (json) {
					var info = dojo.eval("(" + json + ")");
					if (info.ret) {
						updateTemplateDialog.hide();
						templateList(lFatherId);
					} else {
						alert(info.msg);
					}
				} else {
					alert("新建模版信息时出现异常!");
				}
			},
			error : function(msg) {
				// alert("新建模版信息时出现异常!");
			}
		});

	} else {
		alert('请输入正确的参数后提交！');
	}
}
/* 删除模版 */
function delManagerTemplate(id) {
	dojo.xhrPost({
		url : 'managerTemplate.do',
		content : {
			"oper" : "del",
			"id" : id
		},
		dataType : "json",
		load : function(json) {
			managerTemplate();
			templateList();
		},
		error : function(msg) {
			// alert("删除模版时出现异常!");
		}
	});

}
/* 删除模版信息 */
function delTemplateField(id) {

	dojo.xhrPost({
		url : 'managerTemplate.do',
		content : {
			"oper" : "delTemplateField",
			"id" : id
		},
		dataType : "json",
		load : function(json) {
			templateList(lFatherId);
		},
		error : function(msg) {
			// alert("删除模版信息时出现异常!");
		}
	});

}
/* 查询分类属性 */
function pointList(fId) {
	dojo
			.xhrPost({
				url : 'managerPointSymbol.do',
				content : {
					"oper" : "list",
					"fatherId" : fId
				},
				dataType : "json",
				load : function(json) {
					if (json) {
						var info = dojo.eval("(" + json + ")");
						layerTemplateGrid.destroy();
						dojo.byId("diaGrid").innerHTML = "<div id='stencilGrid' style='width: 99.5%; height: 95%;'></div>";
						managerPointSymbolGrid(info["layers"]);

					} else {
						alert("没有得到分类属性信息！");
					}
				},
				error : function(msg) {
					// alert("获得分类属性时出现异常!");
				}
			});
}
/* 增加分类 */
function addManagerPointlate() {
	if (pointName.validate() && pointCode.validate()) {
		dojo.xhrPost({
			url : 'managerPointSymbol.do',
			content : {
				"oper" : "add",
				"pointcode" : pointCode.getValue(),
				"name" : pointName.getValue(),
				"fatherId" : dojo.byId("pointFatherId").value
			},
			dataType : "json",
			load : function(json) {
				if (json) {
					var info = dojo.eval("(" + json + ")");
					if (info.ret) {
						managerTemplate();
						pointList(fatherId.getValue());
						addPointDialog.hide();
					} else {
						alert(info.msg);
					}
				} else {
					alert("新建分类出现异常!");
				}
			},
			error : function(msg) {
				// alert("新建分类出现异常!");
			}
		});

	} else {
		alert('请输入正确的参数后提交！');
	}
}
/* 修改分类 */
function updateManagerPointlate() {
	if (updatePointName.validate() && updatePointCode.validate()) {
		dojo.xhrPost({
			url : 'managerPointSymbol.do',
			content : {
				"oper" : "update",
				"id" : dojo.byId("pointFatherId").value,
				"pointcode" : updatePointCode.getValue(),
				"name" : updatePointName.getValue()
			},
			dataType : "json",
			load : function(json) {
				if (json) {
					var info = dojo.eval("(" + json + ")");
					if (info.ret) {
						managerTemplate();
						pointList(fatherId.getValue());
						updatePointDialog.hide();
					} else {
						alert(info.msg);
					}
				} else {
					alert("修改分类出现异常!");
				}
			},
			error : function(msg) {
				// alert("修改分类出现异常!");
			}
		});

	} else {
		alert('请输入正确的参数后提交！');
	}
}

/*
 * 增加分类 属性 Math.round(ImgObj.fileSize/1024*100)/100
 */
function addPointSymbol() {
	if (myForm && pointlateCode.validate()
			&& pointlateName.validate()) {
		CheckExt(iconFileInput.fileInput);
		if(HasChecked){
			dojo.io.iframe.send({
				form : dojo.byId("myForm"),
				url : "managerPointSymbol.do?oper=addPointSymbol",
				method : "post",
				handleAs : "json",
				load : function(response, ioArgs) {
					if (response.ret) {
						pointtype = "";
						pointList(fatherId.getValue());
						addPointSymbolDialog.hide();
					} else {
						alert(response.msg);
					}
					// return response;
				}
			});
		}
	} else {
		alert('请输入正确的参数后提交！');
	}
}
/* 修改分类 属性 */
function updatePointSymbol() {
	if (myForm && updatePointlateCode.validate() && updatePointlateName.validate()) {
		CheckExt(updateIconFileInput.fileInput);
		dojo.io.iframe.send({
			form : dojo.byId("updatePointSymbolForm"),
			url : "managerPointSymbol.do?oper=updatePointSymbol",
			handleAs : "json",

			load : function(response, ioArgs) {
				if (response.ret) {
					pointtype = '';
					pointList(fatherId.getValue());
					updatePointSymbolDialog.hide();
				} else {
					alert(response.msg);
				}
				// return response;
			}
		});
	} else {
		alert('请输入正确的参数后提交！');
	}
}
/* 删除分类信息 */
function delPointlate(id) {
	dojo.xhrPost({
		url : 'managerPointSymbol.do',
		content : {
			"oper" : "del",
			"id" : id
		},
		dataType : "json",
		load : function(json) {
			pointList(dojo.byId("pointFatherId").value);
		},
		error : function(msg) {
			// alert("删除分类信息时出现异常!");
		}
	});
	managerTemplate();
}
var layerTemplates;
/* 加载模板 */
function initLoadTemplates() {

	dojo.xhrPost({
		url : 'managerTemplate.do',
		content : {
			"oper" : "layertemplates",
			"random" : Math.random()
		},
		dataType : "json",
		load : function(json) {
			var info = dojo.eval("(" + json + ")");
			layerTemplates = info.templates;
			initTemplateSelect(layerTemplates);
		},
		error : function(msg) {
			// alert("加载图层模板异常!");
		}
	});

}
/**
 * 初始化模板选择框
 * 
 * @param layerTemplates
 */
function initTemplateSelect(layerTemplates) {
	for (; layerTemplateSelect.options
			&& 0 < layerTemplateSelect.options.length;) {
		layerTemplateSelect.removeOption(0);
	}

	for (i = 0; layerTemplates.length && i < layerTemplates.length; i++) {
		layerTemplateSelect.addOption({
			value : String(i),
			label : layerTemplates[i].name
		})
	}
}

var pointSymbolAll;
/* 加载分类 */
function initLoadPointSymbel() {

	dojo.xhrPost({
		url : 'managerPointSymbol.do',
		content : {
			"oper" : "listtree"
		},
		dataType : "json",
		load : function(json) {
			var info = dojo.eval("(" + json + ")");
			pointSymbolAll = dojo.clone(info.items);
		},
		error : function(msg) {
			// alert("加载分类异常!");
		}
	});
}
/**
 * 初始化树
 * 
 * @param items
 */
function initPointSymbelTree(items) {
	var treeStore = new dojo.data.ItemFileWriteStore({
		data : {
			identifier : 'id',
			label : 'name',
			items : items
		}
	});

	var treeModel = new dijit.tree.ForestStoreModel({
		store : treeStore,
		query : {
			'root' : true
		}
	});
	var _tree = dijit.byId("categoryPointSymbelTree");
	if (_tree) {
		_tree.destroyRecursive();
		_tree.model.destroy();
		_tree.model.data = null;
	}
	categoryPointSymbelTreePane
			.setContent("<div id=\"categoryPointSymbelTree\"></div>");
	var navTree = new dijit.Tree({
		model : treeModel,
		showRoot : false
	}, "categoryPointSymbelTree")
	navTree.onClick = function(item) {
		/* load the url from datastore */
		currentItem = item;
		// location.href = item.url;
	};

}
// 修改图层模板
function changeTemplate(evn) {

	if (layerTemplateSelect.getValue() && layerTemplateSelect.getValue() != "") {
		var store = new dojo.data.ItemFileWriteStore({
			data : layerTemplates[layerTemplateSelect.getValue()].data
		});
		createLayerColumnGrid.setStore(store);
		// createLayerColumnGrid.startup();
	}
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
		initLoadPointSymbel();
		dojo.connect(managerDialog, "onHide", initLoadPointSymbel);
		dojo.connect(managerDialog, "onHide", initLoadTemplates);
	} else {
		normalUserTools();

		// 初始化地图
		initMap(0);

		// 初始化图层列表
		initLayersGrid();

		// 新建图层字段grid
		initLayerColumnGrid();

		// 图层信息字段grid
		initLayerColumnInfoGrid([]);

		// 加载图层模板
		initLoadPointSymbel();
	}
}

/* 设置布局 */
var layersGridStructure;
// 限制文字长度超长
var layerNameFormater = function(item, rowIndex, cell) {
	var num = 10;
	var objLength = item.length;
	if (objLength > num) {
		return "<span title='" + item + "'>" + item.substring(0, num - 1)
				+ '...' + "</span>";
	} else {
		return "<span title='" + item + "'>" + item + "</span>";
	}
}
/**
 * 管理员看到图层列表显示结构
 */
var structure1 = [ [

		{
			'name' : '类型',
			'field' : 'type',
			'width' : '40px',
			formatter : function(item, rowIndex, cell) {
				return "<img alt='图层类型' id='imgDel' class='imgBtn' src='images/"
						+ item + ".png' />";
			}
		},
		{
			'name' : '图层名称',
			'field' : 'layername',
			formatter : layerNameFormater
		},
		{
			'name' : '创建时间',
			'field' : 'date'
		},
		{
			'name' : "查看",
			'field' : "show",
			formatter : function(item, rowIndex, cell) {
				return "<img alt='查看' id='imgDel' class='imgBtn' src='images/kan_19x19.png' />";
			},
			'width' : '35px'
		},
		{
			'name' : "下载",
			'field' : "edit",
			formatter : function(item, rowIndex, cell) {
				return "<img alt='下载' id='imgDown' class='imgBtn' src='images/down16-16.png' />";
			},
			'width' : '35px'
		},
		{
			'name' : "删除",
			'field' : "del",
			formatter : function(item, rowIndex, cell) {
				return "<img alt='删除' id='imgDel' class='imgBtn' src='images/nav_decline.png' />";
			},
			'width' : '40px'
		} ] ];
/**
 * 普通用户看到的图层列表显示结构
 */
var structure2 = [ [

		{
			'name' : '类型',
			'field' : 'type',
			'width' : '40px',
			formatter : function(item, rowIndex, cell) {
				return "<img alt='图层类型' id='imgDel' class='imgBtn' src='images/"
						+ item + ".png' />";
			}
		},
		{
			'name' : '图层名称',
			'field' : 'layername',
			formatter : layerNameFormater
		},
		{
			'name' : '创建时间',
			'field' : 'date'
		},
		{
			'name' : "查看",
			'field' : "show",
			formatter : function(item, rowIndex, cell) {
				return "<img alt='查看' id='imgDel' class='imgBtn' src='images/kan_16x16.png' />";
			},
			'width' : '35px'
		} ] ];

var layersGridCellClick;
/**
 * 管理员用户看到的图层列表单击事件方法
 */
var cellClick1 = function(evt) {
	var idx = evt.rowIndex;
	var idc = evt.cellIndex;
	var item = this.getItem(idx);
	var store = this.store;
	var tablename = store.getValue(item, "tablename");
	var layername = store.getValue(item, "layername");
	// 如果是detail按钮被按下
	if (idc == this.structure[0].length - 1) {
		if (confirm("你真的要删除图层'" + layername + "'吗？") == true) {
			store.deleteItem(item);
			delLayerByName(tablename);
			closeLayerTab(tablename);
		}
	} else if (idc == this.structure[0].length - 2) {
		downLayer(tablename);
	} else if (idc == this.structure[0].length - 3) {
		showLayerInfo(tablename);
	} else {
		selectAndShowLayer(tablename, layername);
	}
}
/**
 * 普通用户看到的图层列表单击事件方法
 */
var cellClick2 = function(evt) {
	var idx = evt.rowIndex;
	var idc = evt.cellIndex;
	var item = this.getItem(idx);
	var store = this.store;
	var tablename = store.getValue(item, "tablename");
	var layername = store.getValue(item, "layername");
	// 如果是detail按钮被按下
	if (idc == this.structure[0].length - 1) {

		showLayerInfo(tablename);
	} else {
		// 当点击图层名称的时候会初试化图层
		selectAndShowLayer(tablename, layername);
	}
}
// 显示一个图层
function selectAndShowLayer(tablename, layername) {
	if (currentLayers[tablename] && currentLayers[tablename].pane) {
		mainTabContainer.selectChild(currentLayers[tablename].pane);
		return;
	}
	// 当点击图层名称的时候会初试化图层
	currentLayers[tablename] = currentLayers[tablename] ? currentLayers[tablename] : {};
	currentLayers[tablename].tablename = tablename;
	currentLayers[tablename].layername = layername;
	loadLayerColumndef(tablename);
}
/**
 * 管理员用户界面
 */
function manageUserTools() {
	dojo.byId('managerToolsBarDiv').style.display = "inline";
	layersGridStructure = structure1;
	layersGridCellClick = cellClick1;
}
/**
 * 普通用户界面
 */
function normalUserTools() {
	dojo.byId('managerToolsBarDiv').style.display = "none";
	layersGridStructure = structure2;
	layersGridCellClick = cellClick2;
}
/**
 * 图层名称发生变化的时候
 */
function upLayerNameChange() {
	var items = layersGrid.store.items;
	var layername = upLayerName.getValue();
	var flag = false;
	for ( var i = 0; i < items.length; i++) {
		if (items[i].layername == layername) {
			flag = true;
			break;
		}
	}
	if (!flag) {
		alert("名称已经存在！");
	}
}

/**
 * 验证上传图标
 */

var HasCheked

function CheckExt(obj) {
	var FileObj,ImgFileSize//全局变量 图片相关属性
	var AllImgExt=".jpg|.jpeg|.gif|.bmp|.png|"//全部图片格式类型
	var AllowExt=".jpg|.jpeg|.gif|.bmp|.png" //允许上传的文件类型 ?为无限制 每个扩展名后边要加一个"|" 小写字母表示
	var ErrMsg = "";
	var FileMsg = "";
	FileObj = obj;
	HasChecked = true;
	if (obj.value == "") {
		return false;
	}
	var FileExt=obj.value.substr(obj.value.lastIndexOf(".")).toLowerCase();
	 if(AllowExt!=0&&AllowExt.indexOf(FileExt+"|")==-1) //判断文件类型是否允许上传
	  {
	    alert("该文件类型不允许上传。请上传 "+AllowExt+" 类型的文件，当前文件类型为"+FileExt);
	    HasChecked=false;;
	  }
//	 else{
//	 var AllowImgFileSize=100;  //允许上传图片文件的大小 0为无限制  单位：KB
//		  if(window.addEventListener){ // FF
//		    ImgFileSize=Math.round(obj.files[0].size/1024*100)/100;//取得图片文件的大小
//		    HasChecked=true;
//		    if(AllowImgFileSize!=0&&AllowImgFileSize<ImgFileSize){
//		    	alert("图片文件大小超过限制。请上传小于"+AllowImgFileSize+"KB的文件，当前文件大小为"+ImgFileSize+"KB");
//		    	HasChecked=false;
//		    } 
//		  }
//	  }
}


