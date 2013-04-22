var navTree_;
var layerTemplateGrid;
// 右键点击树id
var rFatherId;
// 左键点击树id
var lFatherId;
//
var gridId;
//
var pointtype;

var stencilGridHtml = "<div id='stencilGrid' style='width: 99.5%; height: 95%;'></div>";
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
	// 下面是管理模块树节点左键点击事件
	navTree_.onClick = function(item) {
		if (item.flag == "temp") {
			var ids = item.id[0].split("_");
			lFatherId = ids[1];
			templateList(lFatherId);
		} else if (item.flag == "point") {
			var ids = item.id[0].split("_");
			pointtype = item.children;
			pointList(ids[1]);
			/*dojo.byId("pointFatherId").value = ids[1];*/
			/*fatherId.setValue(ids[1]);*/
			updateFatherId.setValue(ids[1]);
		} else if (item.flag == "alias") {
			var ids = item.id[0].split("_");
			lFatherId = ids[1];
			LayersNameInput.setValue(item.tableName)
			aliasQuery(lFatherId, item.tableName)
		}
	};
	// 下面是管理模块树节点右键点击事件
	// var menu = dijit.byId("tree_menu_PointSymbol");
	var menu = new dijit.Menu();
	// when we right-click anywhere on the tree, make sure we open the menu
	menu.bindDomNode(navTree_.domNode);
	dojo.connect(menu, "_openMyself", this, function(e) {
		// get a hold of, and log out, the tree node that was the source of this
		// open event
		var tn = dijit.getEnclosingWidget(e.target);
		// console.debug(tn);
		// now inspect the data store item that backs the tree node:
		currentItem = tn.item;
		// console.debug(currentItem);
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
						templateFieldnameInput.setValue("");
						templateFieldtypeInput.setValue("5");
						addTemplateDialog.show();
					}
				}));
				menu.addChild(new dijit.MenuItem(
								{
									label : "删除模板",
									onClick : function(event, item) {
										if (confirm("你真的要删除'" + currentItem.name
												+ "'吗？") == true) {
											delManagerTemplate(rFatherId);
										}

									}
								}));

			} else {
				menu.addChild(new dijit.MenuItem({
					label : "新建模板",
					onClick : function(/* Event */) {
						stencilName.setValue("");
						addStencilDialog.show();
					}
				}));
			}
		} else if (currentItem.flag == "point") {
			/*
			 * var ids = currentItem.id[0].split("_");
			 * dojo.byId("pointFatherId").value = ids[1]; if
			 * (!currentItem.children) { fatherId.setValue(ids[1]);
			 * 
			 * menu.addChild(new dijit.MenuItem({ label : "修改分类", onClick :
			 * function( Event ) { updatePointName.setValue(currentItem.name);
			 * updatePointCode.setValue(currentItem.code);
			 * 
			 * updatePointDialog.show(); } }));
			 * 
			 * menu.addChild(new dijit.MenuItem({ label : "新建分类", onClick :
			 * function( Event ) { pointlateName.setValue("");
			 * pointlateCode.setValue(""); iconFileInput.reset();
			 * addPointSymbolDialog.show(); } })); menu.addChild(new
			 * dijit.MenuItem({ label : "删除分类", onClick : function( Event ) { if
			 * (confirm("你真的要删除" + currentItem.name + "吗？") == true) {
			 * delPointlate(ids[1]); } } })); } else {
			 * updateFatherId.setValue(ids[1]); if (ids[1] != -3) {
			 * menu.addChild(new dijit.MenuItem({ label : "修改名称", onClick :
			 * function( Event ) { updatePointName.setValue(currentItem.name);
			 * updatePointCode.setValue(currentItem.code);
			 * updatePointDialog.show(); } })); } menu.addChild(new
			 * dijit.MenuItem({ label : "新建分类", onClick : function( Event ) {
			 * pointName.setValue(""); pointCode.setValue("");
			 * addPointDialog.show();
			 *  } })); }
			 */
		}
		// menu.getChildren().forEach(function(i){
		// i.attr('disabled',!tn.item.children); });
		menu.focus();
		// IMPLEMENT CUSTOM MENU BEHAVIOR HERE
	});
}

/* 模板管理表格 */
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
				name : '模板名称',
				field : 'name',
				width : '190px',
				canSort : true
			},
			{
				'name' : "修改",
				'field' : "del",
				formatter : function(item, rowIndex, cell) {
					return "<img alt='修改' id='imgDel' class='imgBtn' src='images/edit_16x16.png' />";
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
		columnReordering : false,
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
			if (confirm("你真的要删除'" + name + "'吗？")) {
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

/* 模板表格 */
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
				name : '模板类型',
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
			if (confirm("你真的要删除'" + name + "'吗？") == true) {
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
					width : '50px',
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
		layerTemplateGrid.on("CellClick",
				function(evt) {
					var idx = evt.rowIndex;
					var idc = evt.cellIndex;
					var item = this.getItem(idx);
					var name = store.getValue(item, "name");
					var id = store.getValue(item, "id");

					if (idc == this.structure[0].length - 1) {
						if (!pointtype) {
							updateIconFileInput.reset();
							updateId.setValue(id);
							updatePointlateName.setValue(name);
							/*updatePointlateCode.setValue(store.getValue(item,
									"pointcode"));*/
							updateIconFileInput.setValue(store.getValue(item,
									"image"));
							updatePointSymbolDialog.show();
						} else {
							/*dojo.byId("pointFatherId").value = id;*/
							updatePointName.setValue(name);
							updatePointCode.setValue(store.getValue(item,
									"pointcode"));
							updatePointDialog.show();
						}
					}
				});
	} else {
		layout = [ [ {
			name : '分类名称',
			field : 'name',
			width : '150px'
		}, {
			name : '分类编码',
			field : 'pointcode',
			width : '150px'
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
	}

}
/* 别名表格 */
function aliasColumnInfoGrid(items) {

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
				width : '135px'
			},
			{
				name : '别名',
				field : 'alias',
				width : '135px'
			},
			{
				'name' : "修改",
				'field' : "del",
				formatter : function(item, rowIndex, cell) {
					return "<img alt='修改' id='imgDel' class='imgBtn' src='images/edit_16x16.png' />";
				},
				'width' : '40px'
			} ] ];

	/* create a new layerColumnGrid */
	layerTemplateGrid = new dojox.grid.DataGrid({
		id : 'stencilGrid',
		store : store,
		structure : layout,
		// sortFields:[{ attribute: "id", descending: false }],
		rowSelector : '20px'
	});

	/* append the new layerColumnGrid to the div */
	layerTemplateGrid.placeAt("stencilGrid");
	layerTemplateGrid.startup();
	layerTemplateGrid.on("CellClick", function(evt) {
		var idx = evt.rowIndex;
		var idc = evt.cellIndex;
		var item = this.getItem(idx);

		if (idc == this.structure[0].length - 1) {
			aliasNameInput.setValue(store.getValue(item, "alias"));
			fieldNameInput.setValue(store.getValue(item, "fieldname"));
			gridId = store.getValue(item, "id");
			AliasDialog.show();
		}
	});
}
/* 别名管理表格 */
function aliasColumnGrid(items) {
	var store = new dojo.data.ItemFileWriteStore({
		data : {
			identifier : "id",
			items : items
		}
	});
	/* set up layout */
	var layout = [ [
			{
				name : '图层名称',
				field : 'layername',
				width : '190px'
			},
			{
				'name' : "修改",
				'field' : "del",
				formatter : function(item, rowIndex, cell) {
					return "<img alt='修改' id='imgDel' class='imgBtn' src='images/edit_16x16.png' />";
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
		// 如果是按钮被按下
		if (idc == this.structure[0].length - 1) {
			gridId = store.getValue(item, "id");
			LayersNameText.setValue(store.getValue(item, "tablename"));
			LayersAlias.setValue(store.getValue(item, "layername"));
			LayersDialog.show()

		}
	});
}
/* 查询树 */
function managerTemplate() {
	dojo.xhrPost({
				url : 'managerTemplate.do',
				content : {
					"oper" : "query"
				},
				dataType : "json",
				load : function(json) {
					if (json) {
						var info = dojo.eval("(" + json + ")");
						if(!info.ret)
						{
							handleExcetion(info);
						}
						else
						{
							navTree_.destroy();
							dojo.byId("dialogTree").innerHTML = "<div id='navTree'></div>";
							initMainTree(info.layers);
							managerDialog.show();
						}
					} else {
						alert("没有得到模板信息！");
					}
				},
				error : function(msg) {
					// alert("获得模板信息时出现异常!");
				}
			});
}
/* 查询模板 */
function templateList(tempid) {
	// stencilName.setValue(tempid);
	if (tempid) {
		dojo.xhrPost({
			url : 'managerTemplate.do',
			content : {
				"oper" : "list",
				"tempid" : tempid
			},
			dataType : "json",
			load : function(json) {
				if (json) {
					var info = dojo.eval("(" + json + ")");
					if(!info.ret)
					{
						handleExcetion(info);
					}
					else
					{
					layerTemplateGrid.destroy();
					diaGrid.setContent(stencilGridHtml);
					stencilColumnInfoGrid(info["layers"]);
					}
				} else {
					alert("没有得到模板信息！");
				}
			},
			error : function(msg) {
				console.log(msg);
				// alert("获得模板出现异常!");
			}
		});
	} else {
		dojo.xhrPost({
			url : 'managerTemplate.do',
			content : {
				"oper" : "list",
				"tempid" : tempid
			},
			dataType : "json",
			load : function(json) {
				if (json) {
					var info = dojo.eval("(" + json + ")");
					if(!info.ret)
					{
						handleExcetion(info);
					}
					else
					{
					layerTemplateGrid.destroy();
					diaGrid.setContent(stencilGridHtml);
					stencilColumnGrid(info["layers"]);
					}
				} else {
					alert("没有得到模板信息！");
				}
			},
			error : function(msg) {
				console.log(msg);
				// alert("获得模板出现异常!");
			}
		});
	}
}

/* 增加模板 */
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
					if(!info.ret)
					{
						handleExcetion(info);

					}
					else
					{
						addStencilDialog.hide();
						managerTemplate();
						templateList("");
					} 
				} else {
					alert("新建模板信息时出现异常!");
				}
			},
			error : function(msg) {
				console.log(msg);
				// alert("新建模板信息时出现异常!");
			}
		});

	} else {
		alert('请输入正确的参数后提交！');
	}
}
/* 修改模板 */
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
					if(!info.ret)
					{
						handleExcetion(info);
			
					}
					else
					{
						updateStencilDialog.hide();
						rFatherId = info.id;
						managerTemplate();
						templateList("");
					} 
				} else {
					alert("修改模板信息时出现异常!");
				}
			},
			error : function(msg) {
				console.log(msg);
				// alert("修改模板信息时出现异常!");
			}
		});

	} else {
		alert('请输入正确的参数后提交！');
	}
}

/* 增加模板字段 */
function addManagerTemplateField() {
	if (templateFieldnameInput.validate() && templateFieldtypeInput.validate()) {
		var fieldname = templateFieldnameInput.getValue();
		if(nameLength(fieldname)){
			dojo.xhrPost({
				url : 'managerTemplate.do',
				content : {
					"oper" : "add",
					"fieldname" : fieldname,
					"tempid" : rFatherId,
					"fieldtype" : templateFieldtypeInput.getValue()
				},
				dataType : "json",
				load : function(json) {
					if (json) {
						var info = dojo.eval("(" + json + ")");
						if(!info.ret)
						{
							handleExcetion(info);
						}
						else
						{
							addTemplateDialog.hide();
							managerTemplate();
							templateList(rFatherId);
						} 
					} else {
						alert("新建模板信息时出现异常!");
					}
				},
				error : function(msg) {
					console.log(msg);
					// alert("新建模板信息时出现异常!");
				}
			});
		}
	} else {
		alert('请输入正确的参数后提交！');
	}
}
/* 修改模板字段 */
function updateManagerTemplateField() {
	if (updatefieldname.validate() && updatefieldtype.validate()) {
		var fieldname = updatefieldname.getValue()
		if (nameLength(fieldname)) {
			dojo.xhrPost({
				url : 'managerTemplate.do',
				content : {
					"oper" : "updateTemp",
					"id" : gridId,
					"fieldname" : fieldname,
					"tempid" : lFatherId,
					"fieldtype" : updatefieldtype.getValue()
				},
				dataType : "json",
				load : function(json) {
					if (json) {
						var info = dojo.eval("(" + json + ")");
						if(!info.ret)
						{
							handleExcetion(info);
						}
						else
						{
							updateTemplateDialog.hide();
							templateList(lFatherId);
						} 
					} else {
						alert("新建模板信息时出现异常!");
					}
				},
				error : function(msg) {
					console.log(msg);
					// alert("新建模板信息时出现异常!");
				}
			});
		}

	} else {
		alert('请输入正确的参数后提交！');
	}
}
/* 删除模板 */
function delManagerTemplate(id) {
	dojo.xhrPost({
		url : 'managerTemplate.do',
		content : {
			"oper" : "del",
			"id" : id
		},
		dataType : "json",
		load : function(json) {
			if(json){
				var info = dojo.eval("(" + json + ")");
				if(!info.ret)
				{
					handleExcetion(info);
				}
				else
				{
					managerTemplate();
					templateList();
				}
			}
		},
		error : function(msg) {
			console.log(msg);
			// alert("删除模板时出现异常!");
		}
	});

}
/* 删除模板信息 */
function delTemplateField(id) {

	dojo.xhrPost({
		url : 'managerTemplate.do',
		content : {
			"oper" : "delTemplateField",
			"id" : id
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
				templateList(lFatherId);
			}
		},
		error : function(msg) {
			console.log(msg);
			// alert("删除模板信息时出现异常!");
		}
	});

}
/* 查询分类属性 */
function pointList(fId) {
	dojo.xhrPost({
		url : 'managerPointSymbol.do',
		content : {
			"oper" : "list",
			"fatherId" : fId
		},
		dataType : "json",
		load : function(json) {
			if (json) {
				var info = dojo.eval("(" + json + ")");
				if(!info.ret)
				{
					handleExcetion(info);

				}
				else
				{
				layerTemplateGrid.destroy();
				diaGrid.setContent(stencilGridHtml);
				managerPointSymbolGrid(info["layers"]);
				}

			} else {
				alert("没有得到分类属性信息！");
			}
		},
		error : function(msg) {
			console.log(msg);
			// alert("获得分类属性时出现异常!");
		}
	});
}
/* 增加分类 
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
				if(!info.ret)
				{
					handleExcetion(info);
				}
				else
				{
						managerTemplate();
						pointList(fatherId.getValue());
						addPointDialog.hide();
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
 修改分类 
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
					if(!info.ret)
					{
						handleExcetion(info);
					}
					else
					{
						managerTemplate();
						pointList(fatherId.getValue());
						updatePointDialog.hide();
					}
				} else {
					alert("修改分类出现异常!");
				}
			},
			error : function(msg) {
			console.log(msg);
				// alert("修改分类出现异常!");
			}
		});

	} else {
		alert('请输入正确的参数后提交！');
	}
}
*/
/* 增加分类 属性 */
/*function addPointSymbol() {
	if (myForm && pointlateCode.validate() && pointlateName.validate()) {
		if (CheckExt(iconFileInput.fileInput)) {
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
}*/
/* 修改分类 属性 */
function updatePointSymbol() {
	if (CheckExt(updateIconFileInput.fileInput)) {
			dojo.io.iframe.send({
				form : dojo.byId("updatePointSymbolForm"),
				url : "managerPointSymbol.do?oper=updatePointSymbol",
				handleAs : "json",

				load : function(response, ioArgs) {
					if (response.ret) {
						pointtype = '';
						pointList(updateFatherId.getValue());
						updatePointSymbolDialog.hide();
					} else {
						alert(response.msg);
					}
					// return response;
				}
			});
	} 
}
/* 删除分类信息 */
/*function delPointlate(id) {
	dojo.xhrPost({
		url : 'managerPointSymbol.do',
		content : {
			"oper" : "del",
			"id" : id
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
				pointList(dojo.byId("pointFatherId").value);
			}
		},
		error : function(msg) {
		console.log(msg);
			// alert("删除分类信息时出现异常!");
		}
	});
	managerTemplate();
}*/
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
			if(!info.ret)
			{
				handleExcetion(info);

			}
			else
			{
			layerTemplates = info.templates;
			initTemplateSelect(layerTemplates);
			}
		},
		error : function(msg) {
			console.log(msg);
			// alert("加载图层模板异常!");
		}
	});

}
/* 查询别名 */
function aliasQuery(layerid, layerName) {
	if (layerid) {
		dojo.xhrPost({
			url : 'managerAliasServlet.do',
			content : {
				"oper" : "query",
				"layerid" : layerid,
				"layerName" : layerName
			},
			dataType : "json",
			load : function(json) {
				if (json) {
					var info = dojo.eval("(" + json + ")");
					if(!info.ret)
					{
						handleExcetion(info);
						layerTemplateGrid.destroy();
						diaGrid.setContent(stencilGridHtml);
						aliasColumnInfoGrid("");
					}
					else
					{
						layerTemplateGrid.destroy();
						diaGrid.setContent(stencilGridHtml);
						aliasColumnInfoGrid(info.layers);
					} 

				} else {
					alert("没有得到图层别名信息！");
				}
			},
			error : function(msg) {
				console.log(msg);
				// alert("获得分类属性时出现异常!");
			}
		});
	} else {
		dojo.xhrPost({
			url : 'managerAliasServlet.do',
			content : {
				"oper" : "query",
				"layerid" : layerid,
				"layerName" : layerName
			},
			dataType : "json",
			load : function(json) {
				if (json) {
					var info = dojo.eval("(" + json + ")");
					if(!info.ret)
					{
						handleExcetion(info);
						layerTemplateGrid.destroy();
						diaGrid.setContent(stencilGridHtml);
						aliasColumnGrid("");
					}
					else
					{
						layerTemplateGrid.destroy();
						diaGrid.setContent(stencilGridHtml);
						aliasColumnGrid(info.layers);
					} 

				} else {
					alert("没有得到图层别名信息！");
				}
			},
			error : function(msg) {
				console.log(msg);
				// alert("获得分类属性时出现异常!");
			}
		});
	}
}
/* 修改字段别名 */
function aliasAdd() {
	var alias = aliasNameInput.getValue();
	if(aliasNameInput.validate()&&nameLength(alias)){
		var fieldname = fieldNameInput.getValue();
		var id = gridId;
		var layerid = lFatherId;
		dojo.xhrPost({
			url : 'managerAliasServlet.do',
			content : {
				"oper" : "add",
				"id" : id,
				"layerid" : layerid,
				"fieldname" : fieldname,
				"alias" : alias
			},
			dataType : "json",
			load : function(json) {
				if (json) {
					var info = dojo.eval("(" + json + ")");
					if(!info.ret)
					{
						handleExcetion(info);
						
					}
					else
					{
						aliasQuery(layerid, LayersNameInput.getValue());
						AliasDialog.hide();
					} 
					
				} else {
					alert("没有得到图层别名信息！");
				}
			},
			error : function(msg) {
				console.log(msg);
				// alert("获得分类属性时出现异常!");
			}
		});
	}
}
/* 修改图层别名 */
function layersUpdate() {
	var layername = LayersAlias.getValue();
	if(LayersAlias.validate()&&nameLength(layername)){
		var layerid = gridId;
		dojo.xhrPost({
			url : 'managerAliasServlet.do',
			content : {
				"oper" : "updateLayer",
				"layerid" : layerid,
				"layername" : layername
			},
			dataType : "json",
			load : function(json) {
				if (json) {
					var info = dojo.eval("(" + json + ")");
					if(!info.ret)
					{
						handleExcetion(info);
					}
					else
					{
						aliasQuery("", "");
						managerTemplate();
						LayersDialog.hide();
						
						// 图层刷新
						loadLayers();
					}
					
				} else {
					alert("没有得到图层别名信息！");
				}
			},
			error : function(msg) {
				console.log(msg);
				// alert("获得分类属性时出现异常!");
			}
		});
	}
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

/**
 * 验证上传图标
 */
function CheckExt(obj) {
	var FileObj, ImgFileSize// 全局变量 图片相关属性
	var AllImgExt = ".jpg|.jpeg|.gif|.bmp|.png|"// 全部图片格式类型
	var AllowExt = ".jpg|.jpeg|.gif|.bmp|.png|" // 允许上传的文件类型 ?为无限制
												// 每个扩展名后边要加一个"|" 小写字母表示
	var ErrMsg = "";
	var FileMsg = "";
	FileObj = obj;
	if (obj.value == "") {
	} else {
		var FileExt = obj.value.substr(obj.value.lastIndexOf("."))
				.toLowerCase();
		if (AllowExt != 0 && AllowExt.indexOf(FileExt + "|") == -1) // 判断文件类型是否允许上传
		{
			alert("该文件类型不允许上传。请上传 " + AllowExt + " 类型的文件，当前文件类型为" + FileExt);
			return false;
		}
	}
	return true;
}
// 中英文长度比较
function nameLength(str) {
	var iLength = 0; // 记录字符的总字节数
	for ( var i = 0; i < str.length; i++) // 遍历字符串中的每个字符
	{
		if (str.charCodeAt(i) > 255) // 如果当前字符的编码大于255
		{
			iLength += 2; // 所占字节数加2
		} else {
			iLength += 1; // 否则所占字节数加1
		}
	}
	if (iLength > 30) // 如果当前字符串超过限制长度
	{
		alert("名称过长");
		return false;
	}
	return true;
}
//中英文长度比较
function nameSub(str) {
	var iLength = 0; // 记录字符的总字节数
	for ( var i = 0; i < str.length; i++) // 遍历字符串中的每个字符
	{
		if (iLength > 30) // 如果当前字符串超过限制长度
		{
			return str.substring(0,i-1) ;
		}
		if (str.charCodeAt(i) > 255) // 如果当前字符的编码大于255
		{
			iLength += 2; // 所占字节数加2
		} else {
			iLength += 1; // 否则所占字节数加1
		}

	}
	return str;
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
