      // 地图样式定义 FillSymbol  LineSymbol  MarkerSymbol  TextSymbol  ]

      function createSymbol(type){

    	  var renderer ;
    	  if(type=="esriGeometryPolygon"){
    	  	  var defaultSymbol = new esri.symbol.SimpleFillSymbol().setStyle(esri.symbol.SimpleFillSymbol.STYLE_NULL);
    	      defaultSymbol.outline.setStyle(esri.symbol.SimpleLineSymbol.STYLE_NULL);
    	      renderer = new esri.renderer.UniqueValueRenderer(defaultSymbol, "SYMBOL");
          	  // add symbol for each possible value

	          renderer.addValue({
	        	  value: "开采区",
	        	  symbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_DIAGONAL_CROSS,
	        			  new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
	        					  new dojo.Color("blue"),2),new dojo.Color("blue")),
	        	  label: "开采区",
	        	  description: "开采区"
	        	});
	          renderer.addValue({
	        	  value: "油矿区",
	        	  symbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_FORWARD_DIAGONAL,
	        			  new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASHDOT,
	        					  new dojo.Color("blue"), 1),new dojo.Color("blue")),
	        	  label: "油矿区",
	        	  description: "油矿区"
	        	});
	          renderer.addValue({
	        	  value: "冶炼厂",
	        	  symbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_BACKWARD_DIAGONAL,
	        			  new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
	        					  new dojo.Color([255,0,0]), 1),new dojo.Color("blue")),
	        	  label: "冶炼厂",
	        	  description: "冶炼厂"
	        	});
	          renderer.addValue({
	        	  value: "存储区",
	        	  symbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_VERTICAL,
	        			  new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
	        					  new dojo.Color([255,0,0]), 1),new dojo.Color("blue")),
	        	  label: "存储区",
	        	  description: "存储区"
	        	});
	          renderer.addValue({
	        	  value: "其它",
	        	  symbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NULL,
	        			  new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
	        					  new dojo.Color([0,0,0]), 1),new dojo.Color("blue")),
	        	  label: "其它",
	        	  description: "其它"
	        	});
    
	      }else if(type=="esriGeometryPoint"){
	    	  renderer = new esri.renderer.UniqueValueRenderer(new esri.symbol.SimpleMarkerSymbol(),"SYMBOL");
	    	    var i=0,count=0;
	    	      for(i=0;pointSymbolAll&&i<pointSymbolAll.length;i++){
	    	    	  var item = pointSymbolAll[i];
	    	    	  if(!item.children&&item.image){

	    	    	  renderer.addValue({
	    	        	  value: item.pointcode,
	    	        	  symbol:  new esri.symbol.PictureMarkerSymbol("symbolImage.do?type=point&name=" + item.image, 19, 22),
	    	        	  label: item.name,
	    	        	  description: item.name
	    	        	});
	    	    	  }
	    	    	  count++;
	    	      }
				 if(count<1){
						if (confirm("点没有分类，是否新建分类？") == true) {
							managerTemplate();
							managerDialog.show();
						}
				 }

	      }else{
	    	  var defaultSymbol = new esri.symbol.SimpleFillSymbol();
	    	  renderer = new esri.renderer.UniqueValueRenderer(defaultSymbol, "SYMBOL");
          	  // add symbol for each possible value
	          renderer.addValue({
	        	  value: "地下石油管线",
	        	  symbol: new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color("blue"), 4),
	        	  label: "地下石油管线",
	        	  description: "地下石油管线"
	        	});
	          renderer.addValue({
	        	  value: "地上石油管线",
	        	  symbol: new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color("blue"), 4),
	        	  label: "地上石油管线",
	        	  description: "地上石油管线"
	        	});
	          
	          renderer.addValue({
	        	  value: "燃气管线",
	        	  symbol: new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([0,255,255]), 2),
	        	  label: "燃气管线",
	        	  description: "燃气管线"
	        	});
	          
	      }
          return renderer;
      }