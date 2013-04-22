var map;
var backupmap = {};// infowindow的备份数据集

//地图初始化
function initMap(selectId) {

	//地图显示div
	var mapDivContext="<span id=\"info\" style=\"position: absolute; left: 25px; bottom: 50px; color: #000; z-index: 50;\"></span><span class=\"companydescription\" >"+companyDescription+"</span>";
	//搜索
	mapDivContext+="<div id=\"fastToolBar\" style=\"position: absolute; left: 125px; top: 10px;z-index: 10050;display:none;\"><table><tr><td><input data-dojo-id=\"searchWord\" name=\"searchWord\" data-dojo-type=\"dijit.form.ValidationTextBox\" required=\"true\" trim=\"true\" missingMessage=\"不能为空\"/></td>" ;
	mapDivContext+="<td><button dojoType=\"dijit.form.Button\"  onClick=\"searchFeatures();\">搜索</button></td>" ;
	mapDivContext+="<td><button dojoType=\"dijit.form.Button\"  onClick=\"showEditToolsDialog()\">绘图</button></td></tr></table></div>";
	
	//退出
	mapDivContext+="<div id=\"fastToolBar\" style=\"position: absolute; right: 35px; top: 10px;z-index: 10050;\"><img src='images/logout.png' alt='注销' title='注销' onclick='logout()'></div>";
	
	mapDivContext+="<div style=\"position: absolute; right: 20px; top: 50px; z-Index: 1000;\"><div data-dojo-type=\"dijit.TitlePane\" title=\"底图\" closable=\"false\" open=\"false\" ><div data-dojo-type=\"dijit.layout.ContentPane\" data-dojo-id=\"basemapGalleryFatherDiv\" style=\"width: 380px; height: 280px; overflow: auto;\"><div id=\"basemapGalleryDiv\"></div></div></div></div>";
	mapDivContext+="<div style=\"position: absolute; right: 20px; top: 90px; z-Index: 999;\"><div data-dojo-type=\"dijit.TitlePane\" title=\"测量\" closable=\"false\"	open=\"false\"><div data-dojo-type=\"dijit.layout.ContentPane\" data-dojo-id=\"measurementFatherDiv\" style=\"width: 250px; height: 170px; overflow: auto;\"><div id=\"measurementDiv\"></div></div></div></div>";
	mapDivContext+="<div style=\"position: absolute; right: 20px; top: 130px; z-Index: 998;\"><div data-dojo-type=\"dijit.TitlePane\" title=\"叠加\" closable=\"false\" open=\"false\"><div data-dojo-type=\"dijit.layout.ContentPane\" style=\"width: 250px; height: 170px; overflow: auto;\"><div><span>图层url：</span><input data-dojo-id=\"overMapID\" data-dojo-type=\"dijit.form.ValidationTextBox\" data-dojo-props=\"validator:dojox.validate.isUrl\" required=\"true\" trim=\"true\" promptMessage=\"输入图层的url\" missingMessage=\"不能为空\" invalidMessage=\"请输入正确的网址\">";
	mapDivContext+="<span>透明度：</span>";
	mapDivContext+="<div data-dojo-id=\"opacitySlider\" style=\"width:200px;\" name=\"horizontalSlider\" data-dojo-type=\"dijit.form.HorizontalSlider\" data-dojo-props=\"value:0.5,minimum: 0,maximum:1,discreteValues:10,intermediateChanges:true,showButtons:false\" onChange=\"onChangeOpacity\">";
	mapDivContext+="<ol data-dojo-type=\"dijit.form.HorizontalRuleLabels\" container=\"topDecoration\" style=\"height:1.5em;font-size:75%;color:gray;\">";
	mapDivContext+="<li></li><li>20%</li><li>40%</li><li>60%</li><li>80%</li><li></li>";
	mapDivContext+="</ol>";
	mapDivContext+="<div data-dojo-type=\"dijit.form.HorizontalRule\" container=\"bottomDecoration\" count=11 style=\"height:5px;\"></div>";
	mapDivContext+="</div>";
	mapDivContext+="<button data-dojo-type=\"dijit.form.Button\" style=\"color: #000; z-Index: 99;\" onClick=\"addOverLayer();\">叠加</button></div></div></div></div>";
	
	//管理代码
	mapDivContext += managerToolHtml;
	
	mapDivContext+="<div style=\"position:absolute;left:10px;top:25px;width:60px;height:60px;background-image:url(images/bg-60-60.png);z-index:1000;\">";
	mapDivContext+="<img src=\"images/up1.png\" style=\"position:absolute;left:22px;top:3px;\" onclick=\"javascript:mapPan('up');\">";
	mapDivContext+="<img src=\"images/down1.png\" style=\"position:absolute;left:22px;top:37px;\" onclick=\"javascript:mapPan('down');\">";
	mapDivContext+="<img src=\"images/left1.png\" style=\"position:absolute;left:6px;top:20px;\" onclick=\"javascript:mapPan('left');\">";
	mapDivContext+="<img src=\"images/right1.png\" style=\"position:absolute;left:40px;top:20px;\" onclick=\"javascript:mapPan('right');\">";
	mapDivContext+="</div>";
	
	if(map){
		map.destroy();
		map = null;
	}
	if(basemapGallery){
		basemapGallery.destroy();
		basemapGallery = null;
	}
	if(measurement){
		measurement.destroy();
		measurement=null;
	}
	if(scalebar){
		scalebar.destroy();
		scalebar=null;
	}
	mapDiv.setContent(mapDivContext);

	map = new esri.Map("mapDiv");
	//dojo.connect(map, "onLayersAddResult", initEditor);
	dojo.connect(map, "onMouseMove", showCoordinates);
	dojo.connect(map, "onMouseDrag", showCoordinates);
	dojo.connect(map, "onLoad", function() {
		scalebar = new esri.dijit.Scalebar({map : map,scalebarUnit : 'metric'});

		initMeasurement();
		//调整地图窗口大小
		dojo.connect(dijit.byId('mapDiv'), 'resize', map,map.resize);
		dojo.connect(dijit.byId('mapDiv'), 'resize', map,function(){});
		
		dojo.style(dojo.byId('mapDiv_zoom_slider'), {
			position:"relative",
			left: "33px",
			top: "90px",
			width:"30px"
		});
		dojo.connect(map, "onClick", function(evt) {
			stopEditToolbar();
			map.infoWindow.hide();
		});
		dojo.connect(map, "onExtentChange", function(extent, delta, levelChange, lod) {
			//console.log("onExtentChange");
		});
		//绘图编辑窗口
		drawShapeToolbar = new esri.toolbars.Draw(map);
		dojo.connect(drawShapeToolbar, "onDrawEnd", addToMap);
		dojo.connect(drawShapeToolbar, "onActivate", function(geometryType) {
			console.log("开始绘制 "+geometryType);
		});
		dojo.connect(drawShapeToolbar, "onDeactivate", function(geometryType) {
			console.log("结束绘制 "+geometryType);
            this._onMouseDownHandler_connect=null;
            this._onMouseMoveHandler_connect=null;
            this._onMouseDragHandler_connect=null;
            this._onMouseUpHandler_connect=null;
            this._onClickHandler_connect=null;
            this._onDblClickHandler_connect=null;
            this._onKeyDown_connect=null;
            this._redrawConnect=null;
		});
		
		editToolbar = new esri.toolbars.Edit(map);
		dojo.connect(editToolbar, "onActivate", function(tool, graphic,info) {
			// 初始化样式
			if (!graphic.attributes.SYMBOL)
				graphic.attributes.SYMBOL = currentLayer.symbol;
			if (!graphic.attributes.USERID)
				graphic.attributes.USERID =  dojoConfig.userid;
		});
		// 自定义窗口
		map.infoWindow.resize(500, 300);
		dojo.connect(map.infoWindow, "onShow", createInfoWindow);
		dojo.connect(map.infoWindow, "onHide", function() {
			stopEditToolbar();
			if(currentLayer&&currentLayer.featureGrid){
				currentLayer.featureGrid.selection.clear();
			}
		});
		dojo.connect(map.infoWindow, "onShow", function() {
			
		});

		if(currentLayer!=null)
			showFastToolBar(true);
	});

	

	//加载图层集
	var basemaps = [];
	if(mapUrlList[selectId])
		makeBaseMap(basemaps,mapUrlList[selectId]);
	for (var i = 0; i < mapUrlList.length; i++) {
		makeBaseMap(basemaps,mapUrlList[i]);
	}

	basemapGallery = new esri.dijit.BasemapGallery({
		showArcGISBasemaps : false,
		basemaps : basemaps,
		map : map
	}, "basemapGalleryDiv");


	// 地图发生变化的情况
	basemapGallery.startup();
	basemapGallery.onSelectionChange= function(a) {
		//坐标发生变化后重新初始化map
		if(basemapGallery.getSelected()&&basemapGallery.getSelected().layers[0].wkid!=map.spatialReference.wkid)
		{
			for(var i=0;i<basemapGallery.basemaps.length;i++)
			{
				if(basemapGallery.getSelected()===basemapGallery.basemaps[i])
				{
					initMap(i);		
				}
			}
		}
	};
	basemapGallery.remove(basemapGallery.basemaps[0].id);
	basemapGallery.select(basemapGallery.basemaps[selectId].id);
	map.setExtent(makeExtent(basemapGallery.basemaps[selectId].layers[0].wkid));
}


function onMapExtentChange(){
	
}
//初始化测量工具
function initMeasurement(){
	
	// 初始化测距离和面积工具
	measurement = new esri.dijit.Measurement({
		map : map,
		defaultAreaUnit : esri.Units.SQUARE_KILOMETERS,
		defaultLengthUnit : esri.Units.KILOMETERS
	}, 'measurementDiv');
	//重写测距单击鼠标事件方法
	measurement._measureDistanceMouseClickHandler= function (evt) {
	    //if it's a new measurement, store the first pt, clear previous results and graphics
	    //if it's in the middle of a measurement, show the static result and geodesics, reset the currentstartpt
	    var snappingPoint;
	    if (this._map.snappingManager) {
	      snappingPoint = this._map.snappingManager._snappingPoint;
	    }
	    var mapPoint = snappingPoint || evt.mapPoint;
	    this.inputPoints.push(mapPoint);
	    this._currentStartPt = mapPoint;

	    if (this.inputPoints.length === 1) {
	      // A new measurement starts
	      for (var i = 0; i < this.measureGraphics.length; i++) {
	        this._map.graphics.remove(this.measureGraphics[i]);
	      }
	      this._map.graphics.remove(this.tempGraphic);
	      this.measureGraphics = [];
	      this.result = 0;
	      this._outputResult(this.result, esri.bundle.widgets.measurement.NLS_length_miles);
	      this.tempGraphic = new esri.Graphic();
	      this.tempGraphic.setSymbol(this._lineSymbol);
	      this._map.graphics.add(this.tempGraphic);
	      this.mouseMoveMapHandler = dojo.connect(this._map, "onMouseMove", this, "_measureDistanceMouseMoveHandler");
	    }
	    this.tempGraphic.setGeometry(new esri.geometry.Polyline());
	    this.flagGraphic = new esri.Graphic();
	    this.flagGraphic.setSymbol(this._pointSymbol);
	    this.flagGraphic.setGeometry(mapPoint);
	    this.measureGraphics.push(this.flagGraphic);
	    this._map.graphics.add(this.flagGraphic);

	    if (this.inputPoints.length > 1) {
	      this.measureGraphic = new esri.Graphic();
	      this.measureGraphic.setSymbol(this._lineSymbol);
	      this.measureGraphics.push(this.measureGraphic);
	      var line = new esri.geometry.Polyline(this._map.spatialReference);
	      line.addPath([this.inputPoints[this.inputPoints.length - 2], mapPoint]);
	      var densifiedLine = this._densifyGeometry(line);
	      this.measureGraphic.setGeometry(densifiedLine);
	      this._map.graphics.add(this.measureGraphic);
	      var rl=this._geodesicDistance(this.inputPoints[this.inputPoints.length - 2], mapPoint);
	      if(rl)
	    	  this.result += rl;
	      this._showDistance(this.result);
	    }
	  };
	//重写测距双击鼠标事件方法
	measurement._measureDistanceDblClickHandler=function (evt) {
	    dojo.disconnect(this.mouseMoveMapHandler);
	    var measurementGeometry = new esri.geometry.Polyline(this._map.spatialReference);
	    measurementGeometry.addPath(this.inputPoints);
	    measurementGeometry = this._densifyGeometry(measurementGeometry);
	    this.inputPoints = [];
	    this.onMeasureEnd(this.activeTool, measurementGeometry);
	    dojo.stopEvent(evt);
	    console.log("测距双击事件");
	};
	
	measurement._measureAreaMouseClickHandler = function (evt) {
	    var snappingPoint;
	    if (this._map.snappingManager) {
	      snappingPoint = this._map.snappingManager._snappingPoint;
	    }
	    var mapPoint = snappingPoint || evt.mapPoint;
	    this.inputPoints.push(mapPoint);
	    this._currentStartPt = mapPoint;
	    if (this.inputPoints.length === 1) {
	      this.tempGraphic.setGeometry(new esri.geometry.Polyline());
	      for (var i = 0; i < this.measureGraphics.length; i++) {
	        this._map.graphics.remove(this.measureGraphics[i]);
	      }
	      this.measureGraphics = [];
	      this.result = 0;
	      this._outputResult(this.result, esri.bundle.widgets.measurement.NLS_area_acres);
	      this.mouseMoveMapHandler = dojo.connect(this._map, "onMouseMove", this, "_measureAreaMouseMoveHandler");
	    }
	    this.measureGraphic = new esri.Graphic();
	    this.measureGraphic.setSymbol(this._lineSymbol);
	    this.measureGraphics.push(this.measureGraphic);

	    if (this.inputPoints.length > 1) {
	      var line = new esri.geometry.Polyline(this._map.spatialReference);
	      line.addPath([this.inputPoints[this.inputPoints.length - 2], mapPoint]);
	      var closeLine = new esri.geometry.Polyline(this._map.spatialReference);
	      closeLine.addPath([this.inputPoints[0], mapPoint]);
	      var densifiedLine = this._densifyGeometry(line);
	      var densifiedCloseLine = this._densifyGeometry(closeLine);
	      this.tempGraphic.setGeometry(densifiedCloseLine);
	      this.measureGraphic.setGeometry(densifiedLine);
	      this._map.graphics.add(this.measureGraphic);
	    }
	    if(this.inputPoints.length > 2){
	    	var polygon = new esri.geometry.Polygon(this._map.spatialReference);
			var ring = [];
			for (var i = 0; i < this.inputPoints.length; i++) {
				ring.push([this.inputPoints[i].x, this.inputPoints[i].y]);
			}
			ring.push([this.inputPoints[0].x, this.inputPoints[0].y]);
			polygon.addRing(ring);
			this.measurementGeometry = this._densifyGeometry(polygon);
			this._getArea(polygon);
			polygon = null;
			
	    }

	  };
	//重写侧面双击鼠标事件方法
	measurement._measureAreaDblClickHandler= function (evt) {
		dojo.disconnect(this.mouseMoveMapHandler);
		var polygon = new esri.geometry.Polygon(this._map.spatialReference);
		var ring = [];
		for (var i = 0; i < this.inputPoints.length; i++) {
			ring.push([this.inputPoints[i].x, this.inputPoints[i].y]);
		}
		ring.push([this.inputPoints[0].x, this.inputPoints[0].y]);
		polygon.addRing(ring);
		this.inputPoints = [];
		this.measurementGeometry = this._densifyGeometry(polygon);
		this._getArea(polygon);
		dojo.stopEvent(evt);
		console.log("测面双击事件");
	};
	measurement.onMeasureEnd= function (activeTool, measurementGeometry) {
		/*activeTool: the current active tool, geometry: the measurement geometry*/
	};
	//重写鼠标位置事件方法
	measurement._measureLocationClickHandler= function (evt) {
		this.clearResult();
	    //dijit.byNode(this.location.domNode).setAttribute("checked", false);
	    var snappingPoint;
	    if (this._map.snappingManager) {
	      snappingPoint = this._map.snappingManager._snappingPoint;
	    }
	    var mapPt = snappingPoint || evt.mapPoint;
	    //this.locationToggleButton();
	    this.locationGraphic = new esri.Graphic();

	    this.locationGraphic.setGeometry(mapPt);
	    this.locationGraphic.setSymbol(this._pointSymbol);
	    this._map.graphics.add(this.locationGraphic);
	    this.measureGraphics.push(this.locationGraphic);
	    var snapedPt = {
	      mapPoint: mapPt
	    };
	    this._showCoordinates(snapedPt);
	    this.onMeasureEnd(this.activeTool, mapPt);
	};
	measurement._outputLocationResult=function (x, y, unit) {
		    var lon, lat;
		    var localStrings = esri.bundle.widgets.measurement;
		    if (x&&y&&unit === localStrings.NLS_decimal_degrees) {
		      lon = x.toFixed(6);
		      lat = y.toFixed(6);
		    }
		    else if (x&&y&&unit === localStrings.NLS_deg_min_sec) {
		      var negativeX = false;
		      var negativeY = false;
		      if (x < 0) {
		        negativeX = true;
		        x = Math.abs(x);
		      }
		      if (y < 0) {
		        negativeY = true;
		        y = Math.abs(y);
		      }
		      lon = Math.floor(x) + "\u00B0" + Math.floor((x - Math.floor(x)) * 60) + "'" + Math.floor(((x - Math.floor(x)) * 60 - Math.floor((x - Math.floor(x)) * 60)) * 60) + '"';
		      lat = Math.floor(y) + "\u00B0" + Math.floor((y - Math.floor(y)) * 60) + "'" + Math.floor(((y - Math.floor(y)) * 60 - Math.floor((y - Math.floor(y)) * 60)) * 60) + '"';
		      if (negativeX){
		        lon = "-" + lon;
		      }
		      if (negativeY){
		        lat = "-" + lat;
		      }      
		    }else{
		    	lon="";
		    	lat="";
		    }
		    dijit.byNode(this.resultValue.domNode).setAttribute("content", esri.bundle.widgets.measurement.NLS_longitude + ": " + lon + "<br/>" + esri.bundle.widgets.measurement.NLS_latitude + ": " + lat);   
    };
    measurement.closeTool=function () {
	    var map = this._map;
	    map.__resetClickDuration();
	    if(!map.isDoubleClickZoom){
	      map.enableDoubleClickZoom();
	    }
	    this.inputPoints = [];
	    if (map.snappingManager && map.snappingManager._snappingGraphic) {
	      map.graphics.remove(map.snappingManager._snappingGraphic);
	    }
	    dojo.disconnect(this.mouseClickMapHandler);
	    dojo.disconnect(this.mouseMoveMapHandler);
	    dojo.disconnect(this.doubleClickMapHandler);
	    dojo.disconnect(this.mouseDragMapHandler);
	    dojo.disconnect(this._clickMapHandler);
	    dojo.disconnect(this._mapExtentChangeHandler);
	    dojo.disconnect(this._geometryAreaHandler);
	    
	    this.mouseClickMapHandler=null;
	    this.mouseMoveMapHandler=null;
	    this.doubleClickMapHandler=null;
	    this.mouseDragMapHandler=null;
	    this._clickMapHandler=null;
	    this._mapExtentChangeHandler=null;
	    this._geometryAreaHandler=null;
	    
	    if (this._map.snappingManager) {
	      this._map.snappingManager._stopSelectionLayerQuery();
	      this._map.snappingManager._killOffSnapping();
	    }
	  };
	measurement.stop=function(){
	    dijit.byNode(this.area.domNode).setAttribute("checked", false);
	    dijit.byNode(this.distance.domNode).setAttribute("checked", false);
	    dijit.byNode(this.location.domNode).setAttribute("checked", false);
	    this.closeTool();
	    this.clearResult();
	    this.locationX=null;
	    this.locationY=null;
	    
	};
	measurement.setTool= function (toolName, checked) {
		stopDrawToolbar();
		//清楚绘图选择
		if(currentLayer&&currentLayer.editToolsDialog&&currentLayer.editToolsDialog.drawToolTree.clickItem.obj)
			currentLayer.editToolsDialog.drawToolTree.clickItem.obj.className = "caption";
	    this.closeTool();
	    var toggled = dijit.byNode(this[toolName].domNode).checked;
	    dojo.style(this.unit.domNode, "visibility", "visible");
	    dijit.byNode(this.area.domNode).setAttribute("checked", false);
	    dijit.byNode(this.distance.domNode).setAttribute("checked", false);
	    dijit.byNode(this.location.domNode).setAttribute("checked", false);
	    if (checked === true || checked === false) {
	      toggled = checked;            
	    }
	    dijit.byNode(this[toolName].domNode).setAttribute("checked", toggled);
	    if (toggled) {
	      this.activeTool = toolName;
	      if(this.map.isDoubleClickZoom){
	        this._map.disableDoubleClickZoom();
	      }
	      if (toolName === "area") {
	        this.measureArea();
	      }
	      else if (toolName === "distance") {
	        this.measureDistance();
	      }
	      else if (toolName === "location") {
	        this.measureLocation();
	      }
	      if (this._map.snappingManager) {
	        this._map.snappingManager._startSelectionLayerQuery();
	        this._map.snappingManager._setUpSnapping();
	      }
	    }
	  };
	
	measurement.startup();
}

//创建要素编辑框
function createInfoWindow(evt){
	

	var feature = updateFeature;
	var gridItem = updateFeature.griditem;
	//选择grid行
	if (feature) 
	{
		currentLayer.featureGrid.selection.setSelected(currentLayer.featureGrid.getItemIndex(feature.griditem), true);
		feature = feature.attributes.OBJECTID;
	} 
	else
	{
		feature = "新建";
	}
	this.setTitle(currentLayer.layername + " - " + feature);
	if ((currentLayer.layername + " - " + feature).lengthb() > 33)
	{
		this.setTitle((currentLayer.layername).substrb(20) + "...-" + feature);
	}
	// 自定义html代码
	var windowdiv = dojo.create("div");
	var windowdiv_1 = dojo.create("div", {
		id: 'windowdiv_table'
	}, windowdiv);
	// 记录结构
	var columndef = currentLayer.columndef;
	var tmp = '';// name字段
	var tmpnode;
	// 备份集合清空
	backupmap = {};
	for (var i = 0; i < columndef.length; i++)
	{
		tmp = columndef[i].NAME;
		if (tmp != 'SHAPE' && tmp != 'OBJECTID' && tmp != 'USERID'
			&& tmp != 'SYMBOL')
		{
			var subdiv = dojo.create("div", null, windowdiv_1);
			dojo.create("div",{style: {'clear': 'both'}}, windowdiv_1);
			var rightdiv = dojo.create("div", null, subdiv);
			switch (columndef[i].TYPE){
            case "esriFieldTypeString":
            	var tmpvalue = gridItem ? gridItem[tmp] : '';
            	var params = {
                    'class': 'atiField',
                    trim: true,
                    alt: tmp,
                    value: tmpvalue,
                    'tmptype': columndef[i].TYPE,
                    style: {'float': 'right'},
                    maxLength: columndef[i].LENGTH
                };
            	tmpnode = new dijit.form.TextBox(params, rightdiv)
                break;
            case "esriFieldTypeDate":
            	var tmpvalue = gridItem ? new Date(gridItem[tmp]) : new Date();
            	var params = {
            		'class': 'atiField', 
            		trim: true,
            		alt: tmp,
            		style: {'float': 'right'},
            		required: true,
            		'tmptype': columndef[i].TYPE,
            		value: tmpvalue
            	};
            	updateFeature.attributes[tmp] = tmpvalue.getTime();
            	tmpnode = new dijit.form.DateTextBox(params, rightdiv);
                break;
            case "esriFieldTypeInteger":
            case "esriFieldTypeSmallInteger":
            	var tmpvalue = gridItem ? gridItem[tmp] : '';
            	var tmpmax1 = Math.pow(10, columndef[i].LENGTH) - 1;
            	var tmpmax = tmpmax1;
            	if (columndef[i].SCALE && columndef[i].SCALE != 0)
            	{
            		var tmpmax2 = Math.pow(10, columndef[i].SCALE);
            		tmpmax = tmpmax1 / tmpmax2;
            	}
            	var tmpmin = 0 - tmpmax;
            	tmpnode = new dijit.form.NumberTextBox({
                    'class': 'atiField',
                    constraints: {max: tmpmax, min: tmpmin},
                    trim: true,
                    alt: tmp,
                    'tmplen': columndef[i].SCALE,
                    'tmptype': columndef[i].TYPE,
                    invalidMessage: '必须输入整数',
                    style: {'float': 'right'},
                    format: function(inDatum){
                    	if (isNaN(inDatum)){
                    		return;
                    	}
                    	if (inDatum.toString().indexOf('.') != -1){
        					return inDatum.toFixed(this.tmplen);
        				}
        				return inDatum;
        			},
                    value: tmpvalue
                }, rightdiv);
                break;
            case "esriFieldTypeSingle":
            case "esriFieldTypeDouble":
            	var tmpvalue = gridItem ? gridItem[tmp] : '';
            	var tmpmax1 = Math.pow(10, columndef[i].LENGTH) - 1;
            	var tmpmax = tmpmax1;
            	if (columndef[i].SCALE && columndef[i].SCALE != 0)
            	{
            		var tmpmax2 = Math.pow(10, columndef[i].SCALE);
            		tmpmax = tmpmax1 / tmpmax2;
            	}
            	var tmpmin = 0 - tmpmax;
            	tmpnode = new dijit.form.NumberTextBox({
            			'class': 'atiField',
            			constraints: {max: tmpmax, min: tmpmin},
            			trim: true,
            			alt: tmp,
            			'tmptype': columndef[i].TYPE,
            			'tmplen': columndef[i].SCALE,
            			invalidMessage: '必须输入数字',
            			style: {'float': 'right'},
            			format: function(inDatum){
            				if (isNaN(inDatum)){
	                    		return;
	                    	}
            				if (inDatum.toString().indexOf('.') != -1){
            					return inDatum.toFixed(this.tmplen);
            				}
            				return inDatum;
            			},
            			value: tmpvalue
                }, rightdiv);
                break;
            default:
            	var tmpvalue = gridItem ? gridItem[tmp] : '';
            	var params = {
                    'class': 'atiField',
                    trim: true,
                    alt: tmp,
                    'tmptype': columndef[i].TYPE,
                    style: {'float': 'right'},
                    value: tmpvalue,
                    maxLength: columndef[i].LENGTH
                };
            	tmpnode = new dijit.form.TextBox(params, rightdiv);
                break;
            }
			var tmpname = columndef[i].ALIAS;
			if (tmpname == null){
				tmpname = columndef[i].NAME;
			}
			dojo.create("div", {innerHTML: tmpname, 
				'class': 'atiLabel',
				className: "tmpgridlabel"}, subdiv);
			// 备份原始数据
			backupmap[tmp] = gridItem ? gridItem[tmp] : '';
			// 参数变更响应
			dojo.connect(tmpnode, "onChange", function(newValue)
	        {
				var tmptype = this.get('tmptype');
				if (newValue instanceof Date){
					updateFeature.attributes[this.get('alt')] = newValue.getTime();
				}
				else if (tmptype == "esriFieldTypeSingle" ||
						tmptype == "esriFieldTypeDouble" ||
						tmptype == "esriFieldTypeInteger" ||
						tmptype == "esriFieldTypeSmallInteger"){
					if (newValue.toString().indexOf('.') != -1){
						var value = newValue.toFixed(this.get('tmplen'));
						updateFeature.attributes[this.get('alt')] = value;
					}
					else {
						updateFeature.attributes[this.get('alt')] = newValue;
					}
				}
				else{
					updateFeature.attributes[this.get('alt')] = newValue;
				}
				// 新增窗口不做处理
				//if (updateFeature.attributes.OBJECTID < 100000000)
					//currentLayer.featureGrid.store.setValue(updateFeature.griditem, this.get('alt'), newValue);
	        });
		}
	}
	// 按钮区
	var windowdiv_2 = dojo.create("div", null, windowdiv);
	var delButton = new dijit.form.Button({label:"删除","class":"delButton"},
			dojo.create("div", null, windowdiv_2));
    var saveButton = new dijit.form.Button({label:"保存","class":"saveButton"}, 
    		dojo.create("div", null, windowdiv_2));
    // 添加按钮响应方法
    dojo.connect(saveButton,"onClick",function(evt)
    {
    	// 如果有js校验不通过
    	if (dojo.query('#windowdiv_table .dijitTextBoxError').length > 0)
    	{
    		return;
    	}
    	if (updateFeature.attributes.OBJECTID > 100000000) 
    	{
    		saveFeature(updateFeature, "add");
		}
    	else
    	{
			upFeature(updateFeature, "up");
		}
        updateFeature.getLayer().refresh();
    });
    // 删除按钮响应方法
    dojo.connect(delButton, "onClick",function(evt)
    {
    	var name = updateFeature.attributes.NAME ? 
    			updateFeature.attributes.NAME : "";
        var msg = "你真的要删除要素吗？";
        if(name)
        	msg = "你真的要删除要素'" + name + "'吗？"
    	if (confirm(msg) == true) 
    	{
    		if (updateFeature.attributes.OBJECTID > 100000000) 
        	{
    			map.infoWindow.hide();
    			updateFeature.getLayer().applyEdits(null,null,[updateFeature]);
    			stopEditToolbar();
    		}
        	else
        	{
    			delFeatureByID(updateFeature.attributes.OBJECTID);
    		}
		}
    });
    // 添加html到窗口
    this.setContent(windowdiv);

}

//地图平移控件
function mapPan(direction){
	//alert(direction);
	if(direction=='up'){
		map.panUp();
	}else if(direction=='down'){
		map.panDown();
	}else if(direction=='left'){
		map.panLeft();
	}else if(direction=='right'){
		map.panRight();
	}
	
}

//地图初始化地图范围定位在北京
function makeExtent(wkid){
	if(wkid!=4326){
		// 地图显示区域
		var initialExtent = new esri.geometry.Extent({
			"xmin" : 12878262,
			"ymin" : 4798064,
			"xmax" : 13029607,
			"ymax" : 4908745,
			"spatialReference" : {
				"wkid" : 102100
			}
		});
		return initialExtent;
	}else{
		// 地图显示区域
		var point = new esri.geometry.Point([12878262,4798064],new esri.SpatialReference({ wkid:102100 }));  
		var pointMin = esri.geometry.webMercatorToGeographic(point);
		point = new esri.geometry.Point([13029607,4908745],new esri.SpatialReference({ wkid:102100 }));  
		var pointMax = esri.geometry.webMercatorToGeographic(point);
		var initialExtent = new esri.geometry.Extent({
			"xmin" : pointMin.x,
			"ymin" : pointMin.y,
			"xmax" : pointMax.x,
			"ymax" : pointMax.y,
			"spatialReference" : {
				"wkid" : 4326
			}
		});
		return initialExtent;
	}
}

//创建一个图层
function makeBaseMap(basemaps,layer){
	var parameters={};
	if(layer.type)parameters.type=layer.type;
	if(layer.url)parameters.url=layer.url;
	var basemapLayer = new esri.dijit.BasemapLayer(parameters);
	basemapLayer.wkid=layer.wkid;
	var basemap = new esri.dijit.Basemap({
		layers : [ basemapLayer ],
		title : layer.﻿title ? layer.﻿title : layer["﻿title"],
		thumbnailUrl : layer.thumbnailUrl
	});
	basemaps.push(basemap);
}



//新建叠加图层
function addOverLayer() {
	if(overLayer){
		map.removeLayer(overLayer);
		overLayer=null;	
	}
	if (overMapID.validate()) {
		validLayer(overMapID.getValue())
	}else{
		alert("请输入正确URL");
		return;
	}
}

// 验证图层网址
function validLayer(url){
	var data = {"oper" : "checkurl","url" : url};
	dojo.xhrPost({
		url : 'free.so',
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
   	    	    overLayer = new esri.layers.ArcGISDynamicMapServiceLayer(url, {"opacity" : opacitySlider.getValue()});
				map.addLayer(overLayer);
	    	}
		},
		error : function(msg) {
			console.log(msg);
			//alert("检查图层url失败!");
		}
	});
}

function onChangeOpacity(value){
	if(overLayer){
		overLayer.setOpacity(value);
	}
}

// 显示坐标信息
function showCoordinates(evt) {
		if (map.spatialReference&&evt.mapPoint.x && evt.mapPoint.y) {
			var point = map.spatialReference.wkid==4326 ? evt.mapPoint : esri.geometry.webMercatorToGeographic(evt.mapPoint);
			dojo.byId("info").innerHTML = dojo.number.format(point.x,{pattern:'#.000000'}) + ", "+ dojo.number.format(point.y,{pattern:'#.000000'});
		}
}

function showFastToolBar(isShow){
	dojo.byId("fastToolBar").style.display =isShow ? "inline" : "none";
	searchWord.setValue("");
}



//新建图层字段列表grid
function initLayerColumnGrid() {
	var store = new dojo.data.ItemFileWriteStore({
		data : {
			identifier : "id",
			items : [ ]
		}
	});
	/*设置布局 */
	var layout = [ [ {
		name : '字段名称',
		field : 'name'

	}, {
		name : '类型',
		field : 'type',
		formatter : function(item, rowIndex, cell) {
				return tableColumnTypeDescription[item] ? tableColumnTypeDescription[item] : "其它";
		}
	}] ];

	/* create a new createLayerColumnGrid */
	createLayerColumnGrid = new dojox.grid.DataGrid({
		id : 'createLayerColumnGrid',
		store : store,
		structure : layout
		//,
		//rowSelector : '20px'
	});

	/* append the new createLayerColumnGrid to the div */
	createLayerColumnGrid.placeAt("createLayerColumnGridDiv");

	// CellClick事件，用来触发update delete detail等按钮
	createLayerColumnGrid.on("CellClick",
			function(evt) {
				var idx = evt.rowIndex, idc = evt.cellIndex, item = this.getItem(idx), store = this.store;
				id = store.getValue(item, "id");
			});
	createLayerColumnGrid.startup();
}



// 初始化化要素列表
function createFeaturesGridAndTab(tablename) {
	if (currentLayer.pane) {
		mainTabContainer.selectChild(currentLayer.pane);
		return;
	}

	var pane = new dijit.layout.ContentPane({
				title : nameFormater(currentLayer.layername),
				closable : true,
				onClose : function(res,res2) {
					if(currentLayers[res2.tablename]&&currentLayers[res2.tablename].featureLayer){
						map.removeLayer(currentLayers[res2.tablename].featureLayer);
						delete currentLayers[res2.tablename];
					}
					return true;
				},
				content : "<div id=\"featureGridDiv"+ tablename+ "\" style=\"width:100%;height:100%;\"></div>",
				selected : true
			});
	pane.tablename=tablename
	mainTabContainer.addChild(pane);
	mainTabContainer.selectChild(pane);

	var myStore = dojo.store.Cache(dojo.store.JsonRest({
		target : "operatMap.do"
	}), dojo.store.Memory());

	var featureGrid = new dojox.grid.DataGrid({
		id : 'featureGrid' + tablename,
		store : dataStore = dojo.data.ObjectStore({
			objectStore : myStore,
			idProperty: "OBJECTID"
		}),
		structure :  currentLayer.layout,
		width: "100%", 
		height: "100%"
	}, "target-node-id"); // make sure you have a target HTML element with
	featureGrid.setQuery({
		oper : "queallpage",
		layer : tablename,
		wkid : map.spatialReference.wkid
	});
	/* append the new featureGrid to the div */
	featureGrid.placeAt("featureGridDiv" + tablename);

	// CellClick事件，用来触发update delete detail等按钮
	featureGrid.on("CellClick",
			function(evt) {
				var idx = evt.rowIndex, idc = evt.cellIndex, item = this
						.getItem(idx), store = this.store;
				id = store.getValue(item, "OBJECTID"), name = store.getValue(
						item, "NAME");
				name = name ? name : "";
				// 如果是detail按钮被按下
				if (idc == this.structure.length - 1) {
	                var msg = "你真的要删除要素吗？";
	                if(name)
	                	msg = "你真的要删除要素'" + name + "'吗？"
		        	if (confirm(msg) == true) {
						delFeatureByID(id);
						store.deleteItem(item);
					}
				} else {
					// 当选择一个要素的时候在地图上显示
					var feature = getFeatureByID(id)
					if(feature){
						moveToFeature(feature.geometry);
						// 编辑要素
						showEditInfoWindowByID(id);
					}
				}
			});
	

	currentLayer.featureGrid = featureGrid;
	currentLayer.pane = pane;
	//当数据加载的时候
	dojo.connect(featureGrid,"_onFetchComplete",function(items){
		if(currentLayer.featureLayer){
			addItemToLayer(items);
		}
	});
	
	currentLayer.featureGrid.startup();

	return featureGrid;
}
//添加一个表格里的记录在地图中显示
function addItemToLayer(items){
	dojo.forEach(items, function(item) {
		var newItem=dojo.clone(item);
		var geometry = newGeometry(newItem);
		delete newItem.SHAPE;
		var feature = new esri.Graphic(geometry, null, newItem);
		feature.griditem=item;
		currentLayer.featureLayer.add(feature);
		currentLayer.featureLayer._mode._addFeatureIIf(feature.attributes.OBJECTID, feature)
		feature._count = 1;
	});
}



// 加载要素列的结构描述
function loadLayerColumndef(layerName) {

	dojo.xhrPost({
				url : 'operatMap.do',
				content : {
					"oper" : "quecolumndef",
					"layer" : layerName
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
							updateFeaturesGridColumndef(info);
							createFeaturesGridAndTab(layerName);
						}
						//新建新的图层
					} else {
						alert("没有得到服务器信息！");
					}
				},
				error : function(msg) {
					console.log(msg);
					//alert("获得地图信息时候出现异常!");
				}
			});
}












