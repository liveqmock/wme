/*
 COPYRIGHT 2009 ESRI

 TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
 Unpublished material - all rights reserved under the
 Copyright Laws of the United States and applicable international
 laws, treaties, and conventions.

 For additional information, contact:
 Environmental Systems Research Institute, Inc.
 Attn: Contracts and Legal Services Department
 380 New York Street
 Redlands, California, 92373
 USA

 email: contracts@esri.com
 */
//>>built
require({cache:{
'esri/layers/agstiled':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/layers/tiled,esri/layers/agscommon"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.agstiled");

dojo.require("esri.layers.tiled");
dojo.require("esri.layers.agscommon");

dojo.declare("esri.layers.ArcGISTiledMapServiceLayer", [esri.layers.TiledMapServiceLayer, esri.layers.ArcGISMapServiceLayer], {
    constructor: function(/*String*/ url, /*Object?*/ options) {
      //options: tileServers: String[]: Array of servers where tiles can be retrieved from.
      if (options) {
        if (options.roundrobin) {
          dojo.deprecated(this.declaredClass + " : " + esri.bundle.layers.agstiled.deprecateRoundrobin);
          options.tileServers = options.roundrobin;
        }
        
        /*var ts = (this.tileServers = options.tileServers);
        if (ts) {
          if (ts.length === 0) {
            ts = null;
          }
          else {
            for (var i=0, il=ts.length; i<il; i++) {
              ts[i] = esri.urlToObject(ts[i]).path;
            }
          }
        }*/
        this._setTileServers(options.tileServers);
        this._loadCallback = options.loadCallback;
      }
      
      this._params = dojo.mixin({}, this._url.query);
  
      //this.tsi = 0; //tileServerIndex
      
      this._initLayer = dojo.hitch(this, this._initLayer);

      var resourceInfo = options && options.resourceInfo;
      if (resourceInfo) {
        this._initLayer(resourceInfo);
      }
      else {
        this._load = dojo.hitch(this, this._load);
        this._load();
      }
    },
    
    _TILE_FORMATS: { PNG:"png", PNG8:"png", PNG24:"png", PNG32:"png", JPG:"jpg", JPEG:"jpg", GIF:"gif" },
    
    _setTileServers: function(list) {
      if (list && list.length > 0) {
        this.tileServers = list;

        var i, il = list.length;
        for (i=0; i < il; i++) {
          list[i] = esri.urlToObject(list[i]).path;
        }
      }
    },
    
    _initLayer: function(response, io) {
      this.inherited(arguments);
      
      // Ideally we'd put this in agscommon.js but considering
      // this is really only needed for overview map use-case, we dont
      // want dynamic layers to incur this charge.
      // See Layer::getResourceInfo (layer.js) for more context
      this.resourceInfo = dojo.toJson(response);

      this.tileInfo = new esri.layers.TileInfo(response.tileInfo);
//      this._tileFormat = this._TILE_FORMATS[this.tileInfo.format];
      this.isPNG32 = this.tileInfo.format === "PNG24" || this.tileInfo.format === "PNG32";
      
      if (response.timeInfo) {
          this.timeInfo = new esri.layers.TimeInfo(response.timeInfo);
      }
      
      if (!this.tileServers) {
        var path = this._url.path;
        
        if (response.tileServers) {
          this._setTileServers(response.tileServers);
        }
        else {
          var isServer   = (path.search(/^https?\:\/\/server\.arcgisonline\.com/i) !== -1),
              isServices = (path.search(/^https?\:\/\/services\.arcgisonline\.com/i) !== -1);
          
          if (isServer || isServices) {
            this._setTileServers([
              path,
              path.replace(
                (isServer ? /server\.arcgisonline/i : /services\.arcgisonline/i),
                (isServer ? "services.arcgisonline" : "server.arcgisonline")
              )
            ]);
          }
        }
      }

      this.loaded = true;
      this.onLoad(this);
      
      var callback = this._loadCallback;
      if (callback) {
        delete this._loadCallback;
        callback(this);
      }
    },
    
    getTileUrl: function(level, row, col) {
      // Using "Column ID" for tileServer selection may lead to relatively faster
      // exhaustion of a server's max connection limit - given that tiled.js or 
      // the implementation that calls this method does so in "column major"
      // order fashion i.e. outer loop iterating through columns and inner
      // loop iterating through rows. Consider this pattern for example:
      //   1  2  3  4  1  2
      //   1  2  3  4  1  2
      //   1  2  3  4  1* 2*
      //   1  2  3  4  1* 2*
      // Numbers 1 through 4 indicate the tileServer indices.
      // * indicates blocking request (assuming Firefox that has max connection
      // limit of 6)
      
      // Using "Row ID" on the otherhand is better because the servers are 
      // exhausted equally (relatively) with respect to each other.
      // For the example above, using row id will yield the following pattern:
      //   1  1  1  1  1  1
      //   2  2  2  2  2  2
      //   3  3  3  3  3  3
      //   4  4  4  4  4  4
      // Note that there is no blocking in this pattern.
      // But it under-utilizes the tileServers if the map height is such 
      // that it displays only 2 rows where we have a total of 4 tile servers. 
      // This is bound to happen when using "Col ID" as well.

      // Ideally we would want a selection algorithm that has the distribution
      // characteristics of using an ever incrementing counter but also maximizes
      // the cache hit ratio. Granted, it's hard to come up with an algorithm
      // that can satisfy these two factors equally for varying map control size,
      // browser connection limit and number of tileServers. Here are some thoughts
      // on measuring the overall efficency:
      // - Distribution (number of requests served by a server over a period of time)
      // - Avg latency of individual tileServers over a period of time
      // - Max idle time (how long a server sits idle without handling a request)
      // - Total idle time
      // - Raw computational efficiency of the algorithm
      
      // The new algorithm based on "Row ID" will not necessarily load tiles 
      // faster than before but it certainly avoids trashing the browser's cache 
      // by mapping tiles to a certain tileServer consistently.
      
      var ts = this.tileServers,
          query = this._url.query,
          iurl = (ts ? ts[row % ts.length] : this._url.path) + "/tile/" + level + "/" + row + "/" + col;

      if (query) {
        iurl += ("?" + dojo.objectToQuery(query));
      }
      
      var token = this._getToken();
      if (token && (!query || !query.token)) {
        iurl += (iurl.indexOf("?") === -1 ? "?" : "&") + "token=" + token;
      }

      return esri._getProxiedUrl(iurl);
    }
  }
);
});

},
'dojox/gfx/matrix':function(){
define("dojox/gfx/matrix", ["./_base","dojo/_base/lang"], 
  function(g, lang){
	var m = g.matrix = {};
	/*===== g = dojox.gfx; m = dojox.gfx.matrix =====*/

	// candidates for dojox.math:
	var _degToRadCache = {};
	m._degToRad = function(degree){
		return _degToRadCache[degree] || (_degToRadCache[degree] = (Math.PI * degree / 180));
	};
	m._radToDeg = function(radian){ return radian / Math.PI * 180; };

	m.Matrix2D = function(arg){
		// summary: 
		//		a 2D matrix object
		// description: Normalizes a 2D matrix-like object. If arrays is passed,
		//		all objects of the array are normalized and multiplied sequentially.
		// arg: Object
		//		a 2D matrix-like object, a number, or an array of such objects
		if(arg){
			if(typeof arg == "number"){
				this.xx = this.yy = arg;
			}else if(arg instanceof Array){
				if(arg.length > 0){
					var matrix = m.normalize(arg[0]);
					// combine matrices
					for(var i = 1; i < arg.length; ++i){
						var l = matrix, r = m.normalize(arg[i]);
						matrix = new m.Matrix2D();
						matrix.xx = l.xx * r.xx + l.xy * r.yx;
						matrix.xy = l.xx * r.xy + l.xy * r.yy;
						matrix.yx = l.yx * r.xx + l.yy * r.yx;
						matrix.yy = l.yx * r.xy + l.yy * r.yy;
						matrix.dx = l.xx * r.dx + l.xy * r.dy + l.dx;
						matrix.dy = l.yx * r.dx + l.yy * r.dy + l.dy;
					}
					lang.mixin(this, matrix);
				}
			}else{
				lang.mixin(this, arg);
			}
		}
	};

	// the default (identity) matrix, which is used to fill in missing values
	lang.extend(m.Matrix2D, {xx: 1, xy: 0, yx: 0, yy: 1, dx: 0, dy: 0});

	lang.mixin(m, {
		// summary: class constants, and methods of dojox.gfx.matrix

		// matrix constants

		// identity: dojox.gfx.matrix.Matrix2D
		//		an identity matrix constant: identity * (x, y) == (x, y)
		identity: new m.Matrix2D(),

		// flipX: dojox.gfx.matrix.Matrix2D
		//		a matrix, which reflects points at x = 0 line: flipX * (x, y) == (-x, y)
		flipX:    new m.Matrix2D({xx: -1}),

		// flipY: dojox.gfx.matrix.Matrix2D
		//		a matrix, which reflects points at y = 0 line: flipY * (x, y) == (x, -y)
		flipY:    new m.Matrix2D({yy: -1}),

		// flipXY: dojox.gfx.matrix.Matrix2D
		//		a matrix, which reflects points at the origin of coordinates: flipXY * (x, y) == (-x, -y)
		flipXY:   new m.Matrix2D({xx: -1, yy: -1}),

		// matrix creators

		translate: function(a, b){
			// summary: forms a translation matrix
			// description: The resulting matrix is used to translate (move) points by specified offsets.
			// a: Number: an x coordinate value
			// b: Number: a y coordinate value
			if(arguments.length > 1){
				return new m.Matrix2D({dx: a, dy: b}); // dojox.gfx.matrix.Matrix2D
			}
			// branch
			// a: dojox.gfx.Point: a point-like object, which specifies offsets for both dimensions
			// b: null
			return new m.Matrix2D({dx: a.x, dy: a.y}); // dojox.gfx.matrix.Matrix2D
		},
		scale: function(a, b){
			// summary: forms a scaling matrix
			// description: The resulting matrix is used to scale (magnify) points by specified offsets.
			// a: Number: a scaling factor used for the x coordinate
			// b: Number: a scaling factor used for the y coordinate
			if(arguments.length > 1){
				return new m.Matrix2D({xx: a, yy: b}); // dojox.gfx.matrix.Matrix2D
			}
			if(typeof a == "number"){
				// branch
				// a: Number: a uniform scaling factor used for the both coordinates
				// b: null
				return new m.Matrix2D({xx: a, yy: a}); // dojox.gfx.matrix.Matrix2D
			}
			// branch
			// a: dojox.gfx.Point: a point-like object, which specifies scale factors for both dimensions
			// b: null
			return new m.Matrix2D({xx: a.x, yy: a.y}); // dojox.gfx.matrix.Matrix2D
		},
		rotate: function(angle){
			// summary: forms a rotating matrix
			// description: The resulting matrix is used to rotate points
			//		around the origin of coordinates (0, 0) by specified angle.
			// angle: Number: an angle of rotation in radians (>0 for CW)
			var c = Math.cos(angle);
			var s = Math.sin(angle);
			return new m.Matrix2D({xx: c, xy: -s, yx: s, yy: c}); // dojox.gfx.matrix.Matrix2D
		},
		rotateg: function(degree){
			// summary: forms a rotating matrix
			// description: The resulting matrix is used to rotate points
			//		around the origin of coordinates (0, 0) by specified degree.
			//		See dojox.gfx.matrix.rotate() for comparison.
			// degree: Number: an angle of rotation in degrees (>0 for CW)
			return m.rotate(m._degToRad(degree)); // dojox.gfx.matrix.Matrix2D
		},
		skewX: function(angle) {
			// summary: forms an x skewing matrix
			// description: The resulting matrix is used to skew points in the x dimension
			//		around the origin of coordinates (0, 0) by specified angle.
			// angle: Number: an skewing angle in radians
			return new m.Matrix2D({xy: Math.tan(angle)}); // dojox.gfx.matrix.Matrix2D
		},
		skewXg: function(degree){
			// summary: forms an x skewing matrix
			// description: The resulting matrix is used to skew points in the x dimension
			//		around the origin of coordinates (0, 0) by specified degree.
			//		See dojox.gfx.matrix.skewX() for comparison.
			// degree: Number: an skewing angle in degrees
			return m.skewX(m._degToRad(degree)); // dojox.gfx.matrix.Matrix2D
		},
		skewY: function(angle){
			// summary: forms a y skewing matrix
			// description: The resulting matrix is used to skew points in the y dimension
			//		around the origin of coordinates (0, 0) by specified angle.
			// angle: Number: an skewing angle in radians
			return new m.Matrix2D({yx: Math.tan(angle)}); // dojox.gfx.matrix.Matrix2D
		},
		skewYg: function(degree){
			// summary: forms a y skewing matrix
			// description: The resulting matrix is used to skew points in the y dimension
			//		around the origin of coordinates (0, 0) by specified degree.
			//		See dojox.gfx.matrix.skewY() for comparison.
			// degree: Number: an skewing angle in degrees
			return m.skewY(m._degToRad(degree)); // dojox.gfx.matrix.Matrix2D
		},
		reflect: function(a, b){
			// summary: forms a reflection matrix
			// description: The resulting matrix is used to reflect points around a vector,
			//		which goes through the origin.
			// a: dojox.gfx.Point: a point-like object, which specifies a vector of reflection
			// b: null
			if(arguments.length == 1){
				b = a.y;
				a = a.x;
			}
			// branch
			// a: Number: an x coordinate value
			// b: Number: a y coordinate value

			// make a unit vector
			var a2 = a * a, b2 = b * b, n2 = a2 + b2, xy = 2 * a * b / n2;
			return new m.Matrix2D({xx: 2 * a2 / n2 - 1, xy: xy, yx: xy, yy: 2 * b2 / n2 - 1}); // dojox.gfx.matrix.Matrix2D
		},
		project: function(a, b){
			// summary: forms an orthogonal projection matrix
			// description: The resulting matrix is used to project points orthogonally on a vector,
			//		which goes through the origin.
			// a: dojox.gfx.Point: a point-like object, which specifies a vector of projection
			// b: null
			if(arguments.length == 1){
				b = a.y;
				a = a.x;
			}
			// branch
			// a: Number: an x coordinate value
			// b: Number: a y coordinate value

			// make a unit vector
			var a2 = a * a, b2 = b * b, n2 = a2 + b2, xy = a * b / n2;
			return new m.Matrix2D({xx: a2 / n2, xy: xy, yx: xy, yy: b2 / n2}); // dojox.gfx.matrix.Matrix2D
		},

		// ensure matrix 2D conformance
		normalize: function(matrix){
			// summary: converts an object to a matrix, if necessary
			// description: Converts any 2D matrix-like object or an array of
			//		such objects to a valid dojox.gfx.matrix.Matrix2D object.
			// matrix: Object: an object, which is converted to a matrix, if necessary
			return (matrix instanceof m.Matrix2D) ? matrix : new m.Matrix2D(matrix); // dojox.gfx.matrix.Matrix2D
		},

		// common operations

		clone: function(matrix){
			// summary: creates a copy of a 2D matrix
			// matrix: dojox.gfx.matrix.Matrix2D: a 2D matrix-like object to be cloned
			var obj = new m.Matrix2D();
			for(var i in matrix){
				if(typeof(matrix[i]) == "number" && typeof(obj[i]) == "number" && obj[i] != matrix[i]) obj[i] = matrix[i];
			}
			return obj; // dojox.gfx.matrix.Matrix2D
		},
		invert: function(matrix){
			// summary: inverts a 2D matrix
			// matrix: dojox.gfx.matrix.Matrix2D: a 2D matrix-like object to be inverted
			var M = m.normalize(matrix),
				D = M.xx * M.yy - M.xy * M.yx;
				M = new m.Matrix2D({
					xx: M.yy/D, xy: -M.xy/D,
					yx: -M.yx/D, yy: M.xx/D,
					dx: (M.xy * M.dy - M.yy * M.dx) / D,
					dy: (M.yx * M.dx - M.xx * M.dy) / D
				});
			return M; // dojox.gfx.matrix.Matrix2D
		},
		_multiplyPoint: function(matrix, x, y){
			// summary: applies a matrix to a point
			// matrix: dojox.gfx.matrix.Matrix2D: a 2D matrix object to be applied
			// x: Number: an x coordinate of a point
			// y: Number: a y coordinate of a point
			return {x: matrix.xx * x + matrix.xy * y + matrix.dx, y: matrix.yx * x + matrix.yy * y + matrix.dy}; // dojox.gfx.Point
		},
		multiplyPoint: function(matrix, /* Number||Point */ a, /* Number? */ b){
			// summary: applies a matrix to a point
			// matrix: dojox.gfx.matrix.Matrix2D: a 2D matrix object to be applied
			// a: Number: an x coordinate of a point
			// b: Number?: a y coordinate of a point
			var M = m.normalize(matrix);
			if(typeof a == "number" && typeof b == "number"){
				return m._multiplyPoint(M, a, b); // dojox.gfx.Point
			}
			// branch
			// matrix: dojox.gfx.matrix.Matrix2D: a 2D matrix object to be applied
			// a: dojox.gfx.Point: a point
			// b: null
			return m._multiplyPoint(M, a.x, a.y); // dojox.gfx.Point
		},
		multiply: function(matrix){
			// summary: combines matrices by multiplying them sequentially in the given order
			// matrix: dojox.gfx.matrix.Matrix2D...: a 2D matrix-like object,
			//		all subsequent arguments are matrix-like objects too
			var M = m.normalize(matrix);
			// combine matrices
			for(var i = 1; i < arguments.length; ++i){
				var l = M, r = m.normalize(arguments[i]);
				M = new m.Matrix2D();
				M.xx = l.xx * r.xx + l.xy * r.yx;
				M.xy = l.xx * r.xy + l.xy * r.yy;
				M.yx = l.yx * r.xx + l.yy * r.yx;
				M.yy = l.yx * r.xy + l.yy * r.yy;
				M.dx = l.xx * r.dx + l.xy * r.dy + l.dx;
				M.dy = l.yx * r.dx + l.yy * r.dy + l.dy;
			}
			return M; // dojox.gfx.matrix.Matrix2D
		},

		// high level operations

		_sandwich: function(matrix, x, y){
			// summary: applies a matrix at a centrtal point
			// matrix: dojox.gfx.matrix.Matrix2D: a 2D matrix-like object, which is applied at a central point
			// x: Number: an x component of the central point
			// y: Number: a y component of the central point
			return m.multiply(m.translate(x, y), matrix, m.translate(-x, -y)); // dojox.gfx.matrix.Matrix2D
		},
		scaleAt: function(a, b, c, d){
			// summary: scales a picture using a specified point as a center of scaling
			// description: Compare with dojox.gfx.matrix.scale().
			// a: Number: a scaling factor used for the x coordinate
			// b: Number: a scaling factor used for the y coordinate
			// c: Number: an x component of a central point
			// d: Number: a y component of a central point

			// accepts several signatures:
			//	1) uniform scale factor, Point
			//	2) uniform scale factor, x, y
			//	3) x scale, y scale, Point
			//	4) x scale, y scale, x, y

			switch(arguments.length){
				case 4:
					// a and b are scale factor components, c and d are components of a point
					return m._sandwich(m.scale(a, b), c, d); // dojox.gfx.matrix.Matrix2D
				case 3:
					if(typeof c == "number"){
						// branch
						// a: Number: a uniform scaling factor used for both coordinates
						// b: Number: an x component of a central point
						// c: Number: a y component of a central point
						// d: null
						return m._sandwich(m.scale(a), b, c); // dojox.gfx.matrix.Matrix2D
					}
					// branch
					// a: Number: a scaling factor used for the x coordinate
					// b: Number: a scaling factor used for the y coordinate
					// c: dojox.gfx.Point: a central point
					// d: null
					return m._sandwich(m.scale(a, b), c.x, c.y); // dojox.gfx.matrix.Matrix2D
			}
			// branch
			// a: Number: a uniform scaling factor used for both coordinates
			// b: dojox.gfx.Point: a central point
			// c: null
			// d: null
			return m._sandwich(m.scale(a), b.x, b.y); // dojox.gfx.matrix.Matrix2D
		},
		rotateAt: function(angle, a, b){
			// summary: rotates a picture using a specified point as a center of rotation
			// description: Compare with dojox.gfx.matrix.rotate().
			// angle: Number: an angle of rotation in radians (>0 for CW)
			// a: Number: an x component of a central point
			// b: Number: a y component of a central point

			// accepts several signatures:
			//	1) rotation angle in radians, Point
			//	2) rotation angle in radians, x, y

			if(arguments.length > 2){
				return m._sandwich(m.rotate(angle), a, b); // dojox.gfx.matrix.Matrix2D
			}

			// branch
			// angle: Number: an angle of rotation in radians (>0 for CCW)
			// a: dojox.gfx.Point: a central point
			// b: null
			return m._sandwich(m.rotate(angle), a.x, a.y); // dojox.gfx.matrix.Matrix2D
		},
		rotategAt: function(degree, a, b){
			// summary: rotates a picture using a specified point as a center of rotation
			// description: Compare with dojox.gfx.matrix.rotateg().
			// degree: Number: an angle of rotation in degrees (>0 for CW)
			// a: Number: an x component of a central point
			// b: Number: a y component of a central point

			// accepts several signatures:
			//	1) rotation angle in degrees, Point
			//	2) rotation angle in degrees, x, y

			if(arguments.length > 2){
				return m._sandwich(m.rotateg(degree), a, b); // dojox.gfx.matrix.Matrix2D
			}

			// branch
			// degree: Number: an angle of rotation in degrees (>0 for CCW)
			// a: dojox.gfx.Point: a central point
			// b: null
			return m._sandwich(m.rotateg(degree), a.x, a.y); // dojox.gfx.matrix.Matrix2D
		},
		skewXAt: function(angle, a, b){
			// summary: skews a picture along the x axis using a specified point as a center of skewing
			// description: Compare with dojox.gfx.matrix.skewX().
			// angle: Number: an skewing angle in radians
			// a: Number: an x component of a central point
			// b: Number: a y component of a central point

			// accepts several signatures:
			//	1) skew angle in radians, Point
			//	2) skew angle in radians, x, y

			if(arguments.length > 2){
				return m._sandwich(m.skewX(angle), a, b); // dojox.gfx.matrix.Matrix2D
			}

			// branch
			// angle: Number: an skewing angle in radians
			// a: dojox.gfx.Point: a central point
			// b: null
			return m._sandwich(m.skewX(angle), a.x, a.y); // dojox.gfx.matrix.Matrix2D
		},
		skewXgAt: function(degree, a, b){
			// summary: skews a picture along the x axis using a specified point as a center of skewing
			// description: Compare with dojox.gfx.matrix.skewXg().
			// degree: Number: an skewing angle in degrees
			// a: Number: an x component of a central point
			// b: Number: a y component of a central point

			// accepts several signatures:
			//	1) skew angle in degrees, Point
			//	2) skew angle in degrees, x, y

			if(arguments.length > 2){
				return m._sandwich(m.skewXg(degree), a, b); // dojox.gfx.matrix.Matrix2D
			}

			// branch
			// degree: Number: an skewing angle in degrees
			// a: dojox.gfx.Point: a central point
			// b: null
			return m._sandwich(m.skewXg(degree), a.x, a.y); // dojox.gfx.matrix.Matrix2D
		},
		skewYAt: function(angle, a, b){
			// summary: skews a picture along the y axis using a specified point as a center of skewing
			// description: Compare with dojox.gfx.matrix.skewY().
			// angle: Number: an skewing angle in radians
			// a: Number: an x component of a central point
			// b: Number: a y component of a central point

			// accepts several signatures:
			//	1) skew angle in radians, Point
			//	2) skew angle in radians, x, y

			if(arguments.length > 2){
				return m._sandwich(m.skewY(angle), a, b); // dojox.gfx.matrix.Matrix2D
			}

			// branch
			// angle: Number: an skewing angle in radians
			// a: dojox.gfx.Point: a central point
			// b: null
			return m._sandwich(m.skewY(angle), a.x, a.y); // dojox.gfx.matrix.Matrix2D
		},
		skewYgAt: function(/* Number */ degree, /* Number||Point */ a, /* Number? */ b){
			// summary: skews a picture along the y axis using a specified point as a center of skewing
			// description: Compare with dojox.gfx.matrix.skewYg().
			// degree: Number: an skewing angle in degrees
			// a: Number: an x component of a central point
			// b: Number?: a y component of a central point

			// accepts several signatures:
			//	1) skew angle in degrees, Point
			//	2) skew angle in degrees, x, y

			if(arguments.length > 2){
				return m._sandwich(m.skewYg(degree), a, b); // dojox.gfx.matrix.Matrix2D
			}

			// branch
			// degree: Number: an skewing angle in degrees
			// a: dojox.gfx.Point: a central point
			// b: null
			return m._sandwich(m.skewYg(degree), a.x, a.y); // dojox.gfx.matrix.Matrix2D
		}

		//TODO: rect-to-rect mapping, scale-to-fit (isotropic and anisotropic versions)

	});
	// propagate Matrix2D up
	g.Matrix2D = m.Matrix2D;

	return m;
});



},
'esri/dijit/InfoWindowLite':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/InfoWindowBase,esri/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.InfoWindowLite");

dojo.require("esri.InfoWindowBase");
dojo.require("esri.utils");

dojo.declare("esri.dijit.InfoWindow", [ esri.InfoWindowBase ], {
  constructor: function(params, srcNodeRef) {
    dojo.mixin(this, params);
    
    var domNode = (this.domNode = dojo.byId(srcNodeRef));
    domNode.id = this.id || dijit.getUniqueId(this.declaredClass);
    dojo.addClass(domNode, "simpleInfoWindow");
    
    this._title = dojo.create("div", { "class": "title" }, domNode);
    this._content = dojo.create("div", { "class": "content" }, domNode);
    this._close = dojo.create("div", { "class": "close" }, domNode);
  },
  
  /********************
   * Public Properties
   ********************/

  domNode: null,
  
  //boolean: default anchor
  anchor: "upperright",
  
  //String: fixed anchor, if anchor position should not be fixed
  fixedAnchor: null,
  
  //coords: current coords
  coords: null,

  //boolean: whether InfoWindow is showing
  isShowing: true,

  //number: width of infowindow
  width: 250,
  
  //number: height of infowindow
  height: 150,
  
  //string: title property
  title: "Info Window",
  
  /**********************
   * Internal Properties
   *   _title (DOMNode)
   *   _content (DOMNode)
   *   _anchors
   **********************/
  
  _bufferWidth: 10,
  _bufferHeight: 10,
  
  /*****************
   * Public Methods
   *****************/
  
  startup: function() {
    this._anchors = [esri.dijit.InfoWindow.ANCHOR_UPPERRIGHT, esri.dijit.InfoWindow.ANCHOR_LOWERRIGHT, esri.dijit.InfoWindow.ANCHOR_LOWERLEFT, esri.dijit.InfoWindow.ANCHOR_UPPERLEFT];
    this.resize(this.width, this.height);
    this.hide();
    this._closeConnect = dojo.connect(this._close, "onclick", this, this.hide);
  },

  destroy: function() {
    if (this.isShowing) {
      this.hide();
    }
    this.destroyDijits(this._title);
    this.destroyDijits(this._content);
    dojo.disconnect(this._closeConnect);
    dojo.destroy(this.domNode);
    this.domNode = this._title = this._content = this._anchors = this._closeConnect = null;
  },

  setTitle: function(/*String*/ title) {
    if (!title) {
      dojo.addClass(this._title, "empty");
    }
    else {
      dojo.removeClass(this._title, "empty");
    }
    
    this.destroyDijits(this._title);
    this.__setValue("_title", title);
    //this._adjustContentArea();
    
    return this;
  },

  setContent: function(/*String | DOMNode*/ content) {
    if (!content) {
      dojo.addClass(this._title, "empty");
    }
    else {
      dojo.removeClass(this._title, "empty");
    }

    this.destroyDijits(this._content);
    this.__setValue("_content", content);

    return this;
  },

  setFixedAnchor: function(/*String*/ anchor) {
    if (anchor && dojo.indexOf(this._anchors, anchor) === -1) {
      return;
    }
    this.fixedAnchor = anchor;
    if (this.isShowing) {
      this.show(this.mapCoords || this.coords, anchor);
    }
    this.onAnchorChange(anchor);
  },

  show: function(/*Point*/ point, /*String?*/ anchor) {
    if (!point) {
      return;
    }
    
    if (point.spatialReference) {
      this.mapCoords = point;
      point = this.coords = this.map.toScreen(point, true);
    }
    else {
      this.mapCoords = null;
      this.coords = point;
    }
    
    if (! anchor || dojo.indexOf(this._anchors, anchor) === -1) {
      anchor = this.map.getInfoWindowAnchor(point); //this._anchors[0];
    }
    
    //dojo.removeClass(this._pointer, this.anchor);

    anchor = (this.anchor = this.fixedAnchor || anchor);
    
    //dojo.addClass(this._pointer, anchor);

    esri.show(this.domNode);
    this._adjustContentArea();
    this._adjustPosition(point, anchor);
    this.isShowing = true;
    if (! arguments[2]) {
      this.onShow();
    }
  },

  hide: function() {
    esri.hide(this.domNode);
    this.isShowing = false;
    if (!arguments[1]) {
      this.onHide();
    }
  },

  move: function(/*Point*/ screenPoint, isDelta) {
    // Boolean isDelta: internal argument used by map
    if (isDelta) { // point is delta from this.coords
      screenPoint = this.coords.offset(screenPoint.x, screenPoint.y);
    }
    else {
      this.coords = screenPoint;

      if (this.mapCoords) {
        this.mapCoords = this.map.toMap(screenPoint);
      }
    }
    
    this._adjustPosition(screenPoint, this.anchor);
  },

  resize: function(/*Number*/ width, /*Number*/ height) {
    this.width = width;
    this.height = height;
    dojo.style(this.domNode, { width: width + "px", height: height + "px" });
    dojo.style(this._close, { left: (width - 2) + "px", top: "-12px" });
    this._adjustContentArea();
    if (this.coords) {
      this._adjustPosition(this.coords, this.anchor);
    }
    this.onResize(width, height);
  },
  
  /*********
   * Events
   *********/
  
  onShow: function() {
    this.__registerMapListeners();
    this.startupDijits(this._title);
    this.startupDijits(this._content);
  },
  
  onHide: function() {
    this.__unregisterMapListeners();
  },
  
  onResize: function() {},
  onAnchorChange: function() {},
  
  /*******************
   * Internal Methods
   *******************/
  
  _adjustContentArea: function() {
    var box = dojo.contentBox(this.domNode);
    //console.log(dojo.toJson(box));
    var titleCoords = dojo.coords(this._title);
    //console.log(dojo.toJson(titleCoords));
    
    var contentCoords = dojo.coords(this._content);
    //console.log(dojo.toJson(contentCoords));
    var contentBox = dojo.contentBox(this._content);
    //console.log(dojo.toJson(contentBox));
    var diff = contentCoords.h - contentBox.h;
    
    dojo.style(this._content, { height: (box.h - titleCoords.h - diff) + "px" });
  },
    
  _adjustPosition: function(/*Point*/ screenPoint, /*String*/ anchor) {
    var posX = Math.round(screenPoint.x), posY = Math.round(screenPoint.y);
    var bufferWidth = this._bufferWidth, bufferHeight = this._bufferHeight;
    var coords = dojo.coords(this.domNode);

    switch(anchor) {
      case esri.dijit.InfoWindow.ANCHOR_UPPERLEFT:
        posX -= (coords.w + bufferWidth);
        posY -= (coords.h + bufferHeight);
        break;
      case esri.dijit.InfoWindow.ANCHOR_UPPERRIGHT:
        posX += bufferWidth;
        posY -= (coords.h + bufferHeight);
        break;
      case esri.dijit.InfoWindow.ANCHOR_LOWERRIGHT:
        posX += bufferWidth;
        posY += bufferHeight;
        break;
      case esri.dijit.InfoWindow.ANCHOR_LOWERLEFT:
        posX -= (coords.w + bufferWidth);
        posY += bufferHeight;
        break;
    }
    
    dojo.style(this.domNode, { left: posX + "px", top: posY + "px" });
  }
});

dojo.mixin(esri.dijit.InfoWindow, {
  ANCHOR_UPPERRIGHT: "upperright", ANCHOR_LOWERRIGHT: "lowerright", ANCHOR_LOWERLEFT: "lowerleft", ANCHOR_UPPERLEFT: "upperleft"
});
});

},
'dojo/fx':function(){
define([
	"./_base/lang",
	"./Evented",
	"./_base/kernel",
	"./_base/array",
	"./_base/connect",
	"./_base/fx",
	"./dom",
	"./dom-style",
	"./dom-geometry",
	"./ready",
	"require" // for context sensitive loading of Toggler
], function(lang, Evented, dojo, arrayUtil, connect, baseFx, dom, domStyle, geom, ready, require) {

	// module:
	//		dojo/fx
	// summary:
	//		TODOC


	/*=====
	dojo.fx = {
		// summary: Effects library on top of Base animations
	};
	var coreFx = dojo.fx;
	=====*/
	
// For back-compat, remove in 2.0.
if(!dojo.isAsync){
	ready(0, function(){
		var requires = ["./fx/Toggler"];
		require(requires);	// use indirection so modules not rolled into a build
	});
}

	var coreFx = dojo.fx = {};

	var _baseObj = {
			_fire: function(evt, args){
				if(this[evt]){
					this[evt].apply(this, args||[]);
				}
				return this;
			}
		};

	var _chain = function(animations){
		this._index = -1;
		this._animations = animations||[];
		this._current = this._onAnimateCtx = this._onEndCtx = null;

		this.duration = 0;
		arrayUtil.forEach(this._animations, function(a){
			this.duration += a.duration;
			if(a.delay){ this.duration += a.delay; }
		}, this);
	};
	_chain.prototype = new Evented();
	lang.extend(_chain, {
		_onAnimate: function(){
			this._fire("onAnimate", arguments);
		},
		_onEnd: function(){
			connect.disconnect(this._onAnimateCtx);
			connect.disconnect(this._onEndCtx);
			this._onAnimateCtx = this._onEndCtx = null;
			if(this._index + 1 == this._animations.length){
				this._fire("onEnd");
			}else{
				// switch animations
				this._current = this._animations[++this._index];
				this._onAnimateCtx = connect.connect(this._current, "onAnimate", this, "_onAnimate");
				this._onEndCtx = connect.connect(this._current, "onEnd", this, "_onEnd");
				this._current.play(0, true);
			}
		},
		play: function(/*int?*/ delay, /*Boolean?*/ gotoStart){
			if(!this._current){ this._current = this._animations[this._index = 0]; }
			if(!gotoStart && this._current.status() == "playing"){ return this; }
			var beforeBegin = connect.connect(this._current, "beforeBegin", this, function(){
					this._fire("beforeBegin");
				}),
				onBegin = connect.connect(this._current, "onBegin", this, function(arg){
					this._fire("onBegin", arguments);
				}),
				onPlay = connect.connect(this._current, "onPlay", this, function(arg){
					this._fire("onPlay", arguments);
					connect.disconnect(beforeBegin);
					connect.disconnect(onBegin);
					connect.disconnect(onPlay);
				});
			if(this._onAnimateCtx){
				connect.disconnect(this._onAnimateCtx);
			}
			this._onAnimateCtx = connect.connect(this._current, "onAnimate", this, "_onAnimate");
			if(this._onEndCtx){
				connect.disconnect(this._onEndCtx);
			}
			this._onEndCtx = connect.connect(this._current, "onEnd", this, "_onEnd");
			this._current.play.apply(this._current, arguments);
			return this;
		},
		pause: function(){
			if(this._current){
				var e = connect.connect(this._current, "onPause", this, function(arg){
						this._fire("onPause", arguments);
						connect.disconnect(e);
					});
				this._current.pause();
			}
			return this;
		},
		gotoPercent: function(/*Decimal*/percent, /*Boolean?*/ andPlay){
			this.pause();
			var offset = this.duration * percent;
			this._current = null;
			arrayUtil.some(this._animations, function(a){
				if(a.duration <= offset){
					this._current = a;
					return true;
				}
				offset -= a.duration;
				return false;
			});
			if(this._current){
				this._current.gotoPercent(offset / this._current.duration, andPlay);
			}
			return this;
		},
		stop: function(/*boolean?*/ gotoEnd){
			if(this._current){
				if(gotoEnd){
					for(; this._index + 1 < this._animations.length; ++this._index){
						this._animations[this._index].stop(true);
					}
					this._current = this._animations[this._index];
				}
				var e = connect.connect(this._current, "onStop", this, function(arg){
						this._fire("onStop", arguments);
						connect.disconnect(e);
					});
				this._current.stop();
			}
			return this;
		},
		status: function(){
			return this._current ? this._current.status() : "stopped";
		},
		destroy: function(){
			if(this._onAnimateCtx){ connect.disconnect(this._onAnimateCtx); }
			if(this._onEndCtx){ connect.disconnect(this._onEndCtx); }
		}
	});
	lang.extend(_chain, _baseObj);

	coreFx.chain = /*===== dojo.fx.chain = =====*/ function(/*dojo.Animation[]*/ animations){
		// summary:
		//		Chain a list of `dojo.Animation`s to run in sequence
		//
		// description:
		//		Return a `dojo.Animation` which will play all passed
		//		`dojo.Animation` instances in sequence, firing its own
		//		synthesized events simulating a single animation. (eg:
		//		onEnd of this animation means the end of the chain,
		//		not the individual animations within)
		//
		// example:
		//	Once `node` is faded out, fade in `otherNode`
		//	|	dojo.fx.chain([
		//	|		dojo.fadeIn({ node:node }),
		//	|		dojo.fadeOut({ node:otherNode })
		//	|	]).play();
		//
		return new _chain(animations); // dojo.Animation
	};

	var _combine = function(animations){
		this._animations = animations||[];
		this._connects = [];
		this._finished = 0;

		this.duration = 0;
		arrayUtil.forEach(animations, function(a){
			var duration = a.duration;
			if(a.delay){ duration += a.delay; }
			if(this.duration < duration){ this.duration = duration; }
			this._connects.push(connect.connect(a, "onEnd", this, "_onEnd"));
		}, this);

		this._pseudoAnimation = new baseFx.Animation({curve: [0, 1], duration: this.duration});
		var self = this;
		arrayUtil.forEach(["beforeBegin", "onBegin", "onPlay", "onAnimate", "onPause", "onStop", "onEnd"],
			function(evt){
				self._connects.push(connect.connect(self._pseudoAnimation, evt,
					function(){ self._fire(evt, arguments); }
				));
			}
		);
	};
	lang.extend(_combine, {
		_doAction: function(action, args){
			arrayUtil.forEach(this._animations, function(a){
				a[action].apply(a, args);
			});
			return this;
		},
		_onEnd: function(){
			if(++this._finished > this._animations.length){
				this._fire("onEnd");
			}
		},
		_call: function(action, args){
			var t = this._pseudoAnimation;
			t[action].apply(t, args);
		},
		play: function(/*int?*/ delay, /*Boolean?*/ gotoStart){
			this._finished = 0;
			this._doAction("play", arguments);
			this._call("play", arguments);
			return this;
		},
		pause: function(){
			this._doAction("pause", arguments);
			this._call("pause", arguments);
			return this;
		},
		gotoPercent: function(/*Decimal*/percent, /*Boolean?*/ andPlay){
			var ms = this.duration * percent;
			arrayUtil.forEach(this._animations, function(a){
				a.gotoPercent(a.duration < ms ? 1 : (ms / a.duration), andPlay);
			});
			this._call("gotoPercent", arguments);
			return this;
		},
		stop: function(/*boolean?*/ gotoEnd){
			this._doAction("stop", arguments);
			this._call("stop", arguments);
			return this;
		},
		status: function(){
			return this._pseudoAnimation.status();
		},
		destroy: function(){
			arrayUtil.forEach(this._connects, connect.disconnect);
		}
	});
	lang.extend(_combine, _baseObj);

	coreFx.combine = /*===== dojo.fx.combine = =====*/ function(/*dojo.Animation[]*/ animations){
		// summary:
		//		Combine a list of `dojo.Animation`s to run in parallel
		//
		// description:
		//		Combine an array of `dojo.Animation`s to run in parallel,
		//		providing a new `dojo.Animation` instance encompasing each
		//		animation, firing standard animation events.
		//
		// example:
		//	Fade out `node` while fading in `otherNode` simultaneously
		//	|	dojo.fx.combine([
		//	|		dojo.fadeIn({ node:node }),
		//	|		dojo.fadeOut({ node:otherNode })
		//	|	]).play();
		//
		// example:
		//	When the longest animation ends, execute a function:
		//	|	var anim = dojo.fx.combine([
		//	|		dojo.fadeIn({ node: n, duration:700 }),
		//	|		dojo.fadeOut({ node: otherNode, duration: 300 })
		//	|	]);
		//	|	dojo.connect(anim, "onEnd", function(){
		//	|		// overall animation is done.
		//	|	});
		//	|	anim.play(); // play the animation
		//
		return new _combine(animations); // dojo.Animation
	};

	coreFx.wipeIn = /*===== dojo.fx.wipeIn = =====*/ function(/*Object*/ args){
		// summary:
		//		Expand a node to it's natural height.
		//
		// description:
		//		Returns an animation that will expand the
		//		node defined in 'args' object from it's current height to
		//		it's natural height (with no scrollbar).
		//		Node must have no margin/border/padding.
		//
		// args: Object
		//		A hash-map of standard `dojo.Animation` constructor properties
		//		(such as easing: node: duration: and so on)
		//
		// example:
		//	|	dojo.fx.wipeIn({
		//	|		node:"someId"
		//	|	}).play()
		var node = args.node = dom.byId(args.node), s = node.style, o;

		var anim = baseFx.animateProperty(lang.mixin({
			properties: {
				height: {
					// wrapped in functions so we wait till the last second to query (in case value has changed)
					start: function(){
						// start at current [computed] height, but use 1px rather than 0
						// because 0 causes IE to display the whole panel
						o = s.overflow;
						s.overflow = "hidden";
						if(s.visibility == "hidden" || s.display == "none"){
							s.height = "1px";
							s.display = "";
							s.visibility = "";
							return 1;
						}else{
							var height = domStyle.get(node, "height");
							return Math.max(height, 1);
						}
					},
					end: function(){
						return node.scrollHeight;
					}
				}
			}
		}, args));

		var fini = function(){
			s.height = "auto";
			s.overflow = o;
		};
		connect.connect(anim, "onStop", fini);
		connect.connect(anim, "onEnd", fini);

		return anim; // dojo.Animation
	};

	coreFx.wipeOut = /*===== dojo.fx.wipeOut = =====*/ function(/*Object*/ args){
		// summary:
		//		Shrink a node to nothing and hide it.
		//
		// description:
		//		Returns an animation that will shrink node defined in "args"
		//		from it's current height to 1px, and then hide it.
		//
		// args: Object
		//		A hash-map of standard `dojo.Animation` constructor properties
		//		(such as easing: node: duration: and so on)
		//
		// example:
		//	|	dojo.fx.wipeOut({ node:"someId" }).play()

		var node = args.node = dom.byId(args.node), s = node.style, o;

		var anim = baseFx.animateProperty(lang.mixin({
			properties: {
				height: {
					end: 1 // 0 causes IE to display the whole panel
				}
			}
		}, args));

		connect.connect(anim, "beforeBegin", function(){
			o = s.overflow;
			s.overflow = "hidden";
			s.display = "";
		});
		var fini = function(){
			s.overflow = o;
			s.height = "auto";
			s.display = "none";
		};
		connect.connect(anim, "onStop", fini);
		connect.connect(anim, "onEnd", fini);

		return anim; // dojo.Animation
	};

	coreFx.slideTo = /*===== dojo.fx.slideTo = =====*/ function(/*Object*/ args){
		// summary:
		//		Slide a node to a new top/left position
		//
		// description:
		//		Returns an animation that will slide "node"
		//		defined in args Object from its current position to
		//		the position defined by (args.left, args.top).
		//
		// args: Object
		//		A hash-map of standard `dojo.Animation` constructor properties
		//		(such as easing: node: duration: and so on). Special args members
		//		are `top` and `left`, which indicate the new position to slide to.
		//
		// example:
		//	|	.slideTo({ node: node, left:"40", top:"50", units:"px" }).play()

		var node = args.node = dom.byId(args.node),
			top = null, left = null;

		var init = (function(n){
			return function(){
				var cs = domStyle.getComputedStyle(n);
				var pos = cs.position;
				top = (pos == 'absolute' ? n.offsetTop : parseInt(cs.top) || 0);
				left = (pos == 'absolute' ? n.offsetLeft : parseInt(cs.left) || 0);
				if(pos != 'absolute' && pos != 'relative'){
					var ret = geom.position(n, true);
					top = ret.y;
					left = ret.x;
					n.style.position="absolute";
					n.style.top=top+"px";
					n.style.left=left+"px";
				}
			};
		})(node);
		init();

		var anim = baseFx.animateProperty(lang.mixin({
			properties: {
				top: args.top || 0,
				left: args.left || 0
			}
		}, args));
		connect.connect(anim, "beforeBegin", anim, init);

		return anim; // dojo.Animation
	};

	return coreFx;
});

},
'dojo/fx/Toggler':function(){
define(["../_base/lang","../_base/declare","../_base/fx", "../_base/connect"], 
  function(lang, declare, baseFx, connectUtil) {
	// module:
	//		dojo/fx/Toggler
	// summary:
	//		TODOC

return declare("dojo.fx.Toggler", null, {
	// summary:
	//		A simple `dojo.Animation` toggler API.
	//
	// description:
	//		class constructor for an animation toggler. It accepts a packed
	//		set of arguments about what type of animation to use in each
	//		direction, duration, etc. All available members are mixed into
	//		these animations from the constructor (for example, `node`,
	//		`showDuration`, `hideDuration`).
	//
	// example:
	//	|	var t = new dojo.fx.Toggler({
	//	|		node: "nodeId",
	//	|		showDuration: 500,
	//	|		// hideDuration will default to "200"
	//	|		showFunc: dojo.fx.wipeIn,
	//	|		// hideFunc will default to "fadeOut"
	//	|	});
	//	|	t.show(100); // delay showing for 100ms
	//	|	// ...time passes...
	//	|	t.hide();

	// node: DomNode
	//		the node to target for the showing and hiding animations
	node: null,

	// showFunc: Function
	//		The function that returns the `dojo.Animation` to show the node
	showFunc: baseFx.fadeIn,

	// hideFunc: Function
	//		The function that returns the `dojo.Animation` to hide the node
	hideFunc: baseFx.fadeOut,

	// showDuration:
	//		Time in milliseconds to run the show Animation
	showDuration: 200,

	// hideDuration:
	//		Time in milliseconds to run the hide Animation
	hideDuration: 200,

	// FIXME: need a policy for where the toggler should "be" the next
	// time show/hide are called if we're stopped somewhere in the
	// middle.
	// FIXME: also would be nice to specify individual showArgs/hideArgs mixed into
	// each animation individually.
	// FIXME: also would be nice to have events from the animations exposed/bridged

	/*=====
	_showArgs: null,
	_showAnim: null,

	_hideArgs: null,
	_hideAnim: null,

	_isShowing: false,
	_isHiding: false,
	=====*/

	constructor: function(args){
		var _t = this;

		lang.mixin(_t, args);
		_t.node = args.node;
		_t._showArgs = lang.mixin({}, args);
		_t._showArgs.node = _t.node;
		_t._showArgs.duration = _t.showDuration;
		_t.showAnim = _t.showFunc(_t._showArgs);

		_t._hideArgs = lang.mixin({}, args);
		_t._hideArgs.node = _t.node;
		_t._hideArgs.duration = _t.hideDuration;
		_t.hideAnim = _t.hideFunc(_t._hideArgs);

		connectUtil.connect(_t.showAnim, "beforeBegin", lang.hitch(_t.hideAnim, "stop", true));
		connectUtil.connect(_t.hideAnim, "beforeBegin", lang.hitch(_t.showAnim, "stop", true));
	},

	show: function(delay){
		// summary: Toggle the node to showing
		// delay: Integer?
		//		Ammount of time to stall playing the show animation
		return this.showAnim.play(delay || 0);
	},

	hide: function(delay){
		// summary: Toggle the node to hidden
		// delay: Integer?
		//		Ammount of time to stall playing the hide animation
		return this.hideAnim.play(delay || 0);
	}
});

});

},
'esri/_time':function(){
// wrapped by build app
define(["dijit","dojo","dojox"], function(dijit,dojo,dojox){
dojo.provide("esri._time");

dojo.declare("esri.TimeExtent", null, {
    constructor: function(json) {
      if (arguments.length > 1) { // multiple arguments: <Date> start, <Date> end
        this._create(arguments[0], arguments[1]);
      }
      else { // one argument
        if (json) {
          if (dojo.isArray(json)) {
            var start = json[0], end = json[1];
            this.startTime = (start === null || start === "null") ? null : new Date(start);                             
            this.endTime = (end === null || end === "null") ? null : new Date(end);              
          }
          else if (json instanceof Date) {
            this._create(json, null);
          }
          /*else if (json.declaredClass === "esri.TimeExtent") {
            this._create(json.startTime, json.endTime);
          }*/
        } // json
      } // one
    },
    
    offset: function(/*Number*/ offsetValue, /*String*/ offsetUnits) {
      var retVal = new esri.TimeExtent();
      
      var start = this.startTime, end = this.endTime;
      if (start) {
        retVal.startTime = this._getOffsettedDate(start, offsetValue, offsetUnits);
      }
      if (end) {
        retVal.endTime = this._getOffsettedDate(end, offsetValue, offsetUnits);
      }
      
      return retVal;
    },
    
    intersection: function(inTimeExtent) {
      return this._intersection(this, inTimeExtent);
    },
    
    toJson: function() {
      var retVal = [];
      
      var start = this.startTime;
      retVal.push(start ? start.getTime() : "null");
      
      var end   = this.endTime;
      retVal.push(end ? end.getTime() : "null");
      
      return retVal;
    },
    
    /***********
     * Internal
     ***********/
    
    _create: function(/*Date*/ start, /*Date*/ end) {
      this.startTime = start ? new Date(start) : null;
      this.endTime = end ? new Date(end) : null;
    },
    
    // some reference data for calculating date/time offsets
    _refData: {
      "esriTimeUnitsMilliseconds":   { getter: "getUTCMilliseconds", setter: "setUTCMilliseconds", multiplier: 1 },
      "esriTimeUnitsSeconds":   { getter: "getUTCSeconds", setter: "setUTCSeconds", multiplier: 1 },
      "esriTimeUnitsMinutes":   { getter: "getUTCMinutes", setter: "setUTCMinutes", multiplier: 1 },
      "esriTimeUnitsHours":     { getter: "getUTCHours", setter: "setUTCHours", multiplier: 1 },
      "esriTimeUnitsDays":      { getter: "getUTCDate", setter: "setUTCDate", multiplier: 1 },
      "esriTimeUnitsWeeks":     { getter: "getUTCDate", setter: "setUTCDate", multiplier: 7 },
      "esriTimeUnitsMonths":    { getter: "getUTCMonth", setter: "setUTCMonth", multiplier: 1 },
      "esriTimeUnitsYears":     { getter: "getUTCFullYear", setter: "setUTCFullYear", multiplier: 1 },
      "esriTimeUnitsDecades":   { getter: "getUTCFullYear", setter: "setUTCFullYear", multiplier: 10 },
      "esriTimeUnitsCenturies": { getter: "getUTCFullYear", setter: "setUTCFullYear", multiplier: 100 }
    },
    
    /*_intersection: function(timeExtent1, timeExtent2) {
      // Test cases
      // instants
      console.log( _intersection({startTime: 1}, {endTime: 6}) === null );
      console.log( _intersection({endTime: 3}, {startTime: 3}).join(",") === "3" );
      
      // instant, extent
      console.log( _intersection({startTime: 1}, {startTime: 2, endTime: 6}) === null );
      console.log( _intersection({endTime: 3}, {startTime: 2, endTime: 6}).join(",") === "3" );
      
      // extent, instant
      console.log( _intersection({startTime: 2, endTime: 6}, {startTime: 10}) === null );
      console.log( _intersection({startTime: 2, endTime: 6}, {endTime: 6}).join(",") === "6" );
      
      // invalid arguments
      console.log( _intersection({startTime: 1, endTime: 2}, {}) === null );
      console.log( _intersection({}, {startTime: 1, endTime: 2}) === null );
      console.log( _intersection({}, {}) === null );

      // no overlap
      console.log( _intersection({startTime: 1, endTime: 2}, {startTime: 3, endTime: 4}) === null );
      console.log( _intersection({startTime: 3, endTime: 4}, {startTime: 1, endTime: 2}) === null );
      
      // overlap in the middle
      console.log( _intersection({startTime: 1, endTime: 4}, {startTime: 2, endTime: 6}).join(",") === "2,4" );
      console.log( _intersection({startTime: 2, endTime: 6}, {startTime: 1, endTime: 4}).join(",") === "2,4" );
      
      // overlap to the left
      console.log( _intersection({startTime: 1, endTime: 4}, {startTime: 1, endTime: 2}).join(",") === "1,2" );
      console.log( _intersection({startTime: 1, endTime: 2}, {startTime: 1, endTime: 4}).join(",") === "1,2" );
      
      // overlap to the right
      console.log( _intersection({startTime: 1, endTime: 4}, {startTime: 3, endTime: 4}).join(",") === "3,4" );
      console.log( _intersection({startTime: 3, endTime: 4}, {startTime: 1, endTime: 4}).join(",") === "3,4" );
      
      // contains
      console.log( _intersection({startTime: 1, endTime: 5}, {startTime: 2, endTime: 3}).join(",") === "2,3" );
      console.log( _intersection({startTime: 2, endTime: 3}, {startTime: 1, endTime: 5}).join(",") === "2,3" );
      
      // within
      console.log( _intersection({startTime: 2, endTime: 4}, {startTime: 1, endTime: 5}).join(",") === "2,4" );
      console.log( _intersection({startTime: 1, endTime: 5}, {startTime: 2, endTime: 4}).join(",") === "2,4" );

      if (timeExtent1 && timeExtent2) {
        var res1 = this._getKind(timeExtent1), valid1 = res1[0], kind1 = res1[1];
        var res2 = this._getKind(timeExtent2), valid2 = res2[0], kind2 = res2[1];
        
        // invalid arguments
        if (!(valid1 && valid2)) {
          return null;
        }
        
        var isInstant1 = (kind1 === "instant");
        var isInstant2 = (kind2 === "instant");
        
        // both instants
        if (isInstant1 && isInstant2) {
          return this._instantsIntersection(timeExtent1, timeExtent2);
        }
        
        if (isInstant1) {
          return this._mixedIntersection(timeExtent1, timeExtent2);
        }
        else if (isInstant2) {
          return this._mixedIntersection(timeExtent2, timeExtent1);
        }
        
        var start1 = timeExtent1.startTime.getTime(), end1 = timeExtent1.endTime.getTime();
        var start2 = timeExtent2.startTime.getTime(), end2 = timeExtent2.endTime.getTime();
        var start, end;
        
        // Is 'start2' in between the first extent?
        if (start2 >= start1 && start2 <= end1) {
          start = start2;
        }
        // Is 'start1' in between the second extent? 
        else if (start1 >= start2 && start1 <= end2) {
          start = start1;
        }
        
        // Is 'end1' in between the second extent?
        if (end1 >= start2 && end1 <= end2) {
          end = end1;
        }
        // Is 'end2' in between the first extent?
        else if (end2 >= start1 && end2 <= end1) {
          end = end2;
        }
    
        if (start && end) {
          var overlap = new esri.TimeExtent();
          overlap.startTime = new Date(start);
          overlap.endTime = new Date(end);
          return overlap;
        }
        else {
          return null;
        }
      }
      else {
        return null;
      }
    },*/
    
    _intersection: function(timeExtent1, timeExtent2) {
      /*// Test cases:
      // null - null
      console.log("1. ", _intersection(null, null) === null );
      
      // value - null
      console.log("2. ", _intersection({startTime: new Date(100), endTime: new Date(200)}, null) === null );
      
      // null - value
      console.log("3. ", _intersection(null, {startTime: new Date(100), endTime: new Date(200)}) === null );
      
      // value1 - value2
      //  [1] value1 = instant, value2 = instant
      //  no overlap
      console.log("4. ", _intersection({startTime: new Date(100), endTime: new Date(100)}, 
                                 {startTime: new Date(200), endTime: new Date(200)}) === null );
      //  overlap
      console.log("5. ", _intersection({startTime: new Date(100), endTime: new Date(100)}, 
                                 {startTime: new Date(100), endTime: new Date(100)})
                                 .toJson().join(",") === "100,100" );
      
      //  [2] value1 = instant, value2 = extent
      //  no overlap
      console.log("6. ", _intersection({startTime: new Date(100), endTime: new Date(100)}, 
                                 {startTime: new Date(200), endTime: new Date(300)}) === null );
      //  overlap: middle
      console.log("7. ", _intersection({startTime: new Date(100), endTime: new Date(100)}, 
                                 {startTime: new Date(50), endTime: new Date(150)})
                                 .toJson().join(",") === "100,100" );
      
      //  overlap: left
      console.log("8. ", _intersection({startTime: new Date(100), endTime: new Date(100)}, 
                                 {startTime: new Date(100), endTime: new Date(150)})
                                 .toJson().join(",") === "100,100" );

      //  overlap: right
      console.log("9. ", _intersection({startTime: new Date(100), endTime: new Date(100)}, 
                                 {startTime: new Date(50), endTime: new Date(100)})
                                 .toJson().join(",") === "100,100" );
      
      //  [3] value1 = instant, value2 = special
      //  no overlap: left
      console.log("10. ", _intersection({startTime: new Date(100), endTime: new Date(100)}, 
                                 {startTime: new Date(200), endTime: null}) === null );
      //  no overlap: right
      console.log("11. ", _intersection({startTime: new Date(400), endTime: new Date(400)}, 
                                 {startTime: null, endTime: new Date(300)}) === null );
      //  overlap: middle, special = start
      console.log("12. ", _intersection({startTime: new Date(200), endTime: new Date(200)}, 
                                 {startTime: null, endTime: new Date(300)})
                                 .toJson().join(",") === "200,200" );
      //  overlap: middle, special = end
      console.log("13. ", _intersection({startTime: new Date(300), endTime: new Date(300)}, 
                                 {startTime: new Date(200), endTime: null})
                                 .toJson().join(",") === "300,300" );
      //  overlap with start
      console.log("14. ", _intersection({startTime: new Date(300), endTime: new Date(300)}, 
                                 {startTime: new Date(300), endTime: null})
                                 .toJson().join(",") === "300,300" );
      //  overlap with end
      console.log("15. ", _intersection({startTime: new Date(200), endTime: new Date(200)}, 
                                 {startTime: null, endTime: new Date(200)})
                                 .toJson().join(",") === "200,200" );
      
      //  [4] value1 = extent, value2 = extent
      //  no overlap
      console.log("16. ", _intersection({startTime: new Date(100), endTime: new Date(200)}, 
                                 {startTime: new Date(300), endTime: new Date(400)}) === null );
      //  overlap: middle
      console.log("17. ", _intersection({startTime: new Date(100), endTime: new Date(200)}, 
                                 {startTime: new Date(150), endTime: new Date(250)})
                                 .toJson().join(",") === "150,200" );
      //  overlap: left
      console.log("18. ", _intersection({startTime: new Date(100), endTime: new Date(200)}, 
                                 {startTime: new Date(100), endTime: new Date(150)})
                                 .toJson().join(",") === "100,150" );
      //  overlap: right
      console.log("19. ", _intersection({startTime: new Date(100), endTime: new Date(200)}, 
                                 {startTime: new Date(150), endTime: new Date(200)})
                                 .toJson().join(",") === "150,200" );
      //  contains
      console.log("20. ", _intersection({startTime: new Date(100), endTime: new Date(200)}, 
                                 {startTime: new Date(125), endTime: new Date(175)})
                                 .toJson().join(",") === "125,175" );
      
      //  [5] value1 = special, value2 = special
      //  value1: start, value2: start
      console.log("21. ", _intersection({startTime: new Date(200), endTime: null}, 
                                 {startTime: new Date(100), endTime: null})
                                 .toJson().join(",") === "200,null" );
      //  value1: start, value2: end
      //  no overlap
      console.log("22. ", _intersection({startTime: new Date(400), endTime: null}, 
                                 {startTime: null, endTime: new Date(300)}) === null );
      //  overlap
      console.log("23. ", _intersection({startTime: new Date(400), endTime: null}, 
                                 {startTime: null, endTime: new Date(450)})
                                 .toJson().join(",") === "400,450" );
      //  value1: end, value2: start
      //  no overlap
      console.log("24. ", _intersection({startTime: null, endTime: new Date(400)}, 
                                 {startTime: new Date(500), endTime: null}) === null );
      //  overlap
      console.log("25. ", _intersection({startTime: null, endTime: new Date(450)}, 
                                 {startTime: new Date(400), endTime: null})
                                 .toJson().join(",") === "400,450" );
      //  value1: end, value2: end
      console.log("26. ", _intersection({startTime: null, endTime: new Date(300)}, 
                                 {startTime: null, endTime: new Date(400)})
                                 .toJson().join(",") === "null,300" );*/
      
      if (timeExtent1 && timeExtent2) {
        var start1 = timeExtent1.startTime, end1 = timeExtent1.endTime;
        var start2 = timeExtent2.startTime, end2 = timeExtent2.endTime;
        start1 = start1 ? start1.getTime() : -Infinity;
        start2 = start2 ? start2.getTime() : -Infinity;
        end1 = end1 ? end1.getTime() : Infinity;
        end2 = end2 ? end2.getTime() : Infinity;

        var start, end;
        
        // Is 'start2' in between the first extent?
        if (start2 >= start1 && start2 <= end1) {
          start = start2;
        }
        // Is 'start1' in between the second extent? 
        else if (start1 >= start2 && start1 <= end2) {
          start = start1;
        }
        
        // Is 'end1' in between the second extent?
        if (end1 >= start2 && end1 <= end2) {
          end = end1;
        }
        // Is 'end2' in between the first extent?
        else if (end2 >= start1 && end2 <= end1) {
          end = end2;
        }
    
        if (!isNaN(start) && !isNaN(end)) {
          var overlap = new esri.TimeExtent();
          overlap.startTime = (start === -Infinity) ? null : new Date(start);
          overlap.endTime = (end === Infinity) ? null : new Date(end);
          return overlap;
        }
        else {
          return null;
        }
      }
      else {
        return null;
      }
    },
    
    /*_instantsIntersection: function(instant1, instant2) {
      var time1 = (instant1.startTime || instant1.endTime).getTime();
      var time2 = (instant2.startTime || instant2.endTime).getTime();
      
      if (time1 === time2) {
        var out = new esri.TimeExtent();
        out.startTime = new Date(time1);
        return out;
      }
      return null;
    },
    
    _mixedIntersection: function(instant, extent) {
      var instantTime = (instant.startTime || instant.endTime).getTime();
      var start = extent.startTime.getTime(), end = extent.endTime.getTime();
      
      if (instantTime >= start && instantTime <= end) {
        var out = new esri.TimeExtent();
        out.startTime = new Date(instantTime);
        return out;
      }
      return null;
    },
    
    _getKind: function(extent) {
      var start = extent.startTime, end = extent.endTime;
      if (start && end) {
        return [true, "extent"];
      }
      if (start || end) {
        return [ true, "instant" ];
      }
      return [ false ];
    },*/
    
    _getOffsettedDate: function(inDate, offset, units) {
      /*// Test cases:
      console.log("45000 ms - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 45000, "UNIT_MILLISECONDS"));
      console.log("1000 s - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 1000, "UNIT_SECONDS"));
      console.log("1500 m - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 1500, "UNIT_MINUTES"));
      console.log("100 h - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 100, "UNIT_HOURS"));
      console.log("100 days - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 100, "UNIT_DAYS"));
      console.log("100 weeks - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 100, "UNIT_WEEKS"));
      console.log("100 months - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 100, "UNIT_MONTHS"));
      console.log("100 years - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 100, "UNIT_YEARS"));
      console.log("7 decades - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 7, "UNIT_DECADES"));
      console.log("5 centuries - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 5, "UNIT_CENTURIES"));*/
      
      var data = this._refData;
      var outDate = new Date(inDate.getTime());
       
      if (offset && units) {
        var data = data[units];
        outDate[data.setter](outDate[data.getter]() + (offset * data.multiplier));
      }
      
      return outDate;
    }
    
  }
);
 
dojo.declare("esri.TimeReference", null, {
   constructor: function(json) {
     //respectsDaylightSaving : Boolean      
     //timeZone : String
     if (json) {
         dojo.mixin(this, json);      
     }             
   }
 }
);

});

},
'esri/utils':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!dojo/io/script,esri/graphic,dojo/_base/url"], function(dijit,dojo,dojox){
dojo.provide("esri.utils");

dojo.require("dojo.io.script");
dojo.require("esri.graphic");


dojo.require("dojo._base.url");






//TODO: Replace with show/hide/toggle once introduced in dojo 0.9
esri.show = function(/*HTMLElement*/ node) {
  if (node) {
    node.style.display = "block";
  }
};

esri.hide = function(/*HTMLElement*/ node) {
  if (node) {
    node.style.display = "none";
  }
};

esri.toggle = function(/*HTMLElement*/ node) {
  node.style.display = node.style.display === "none" ? "block" : "none";
  // if (node.style.display == "none") {
  //   node.style.display = "block";
  // }
  // else {
  //   node.style.display = "none";
  // }
};

esri.valueOf = function(/*Array*/ array, /*Object*/ value) {
  //summary: Similar to dojo.indexOf, this function returns the first property
  // matching argument value. If property not found, null is returned
  // array: Array: Array to look in
  // value: Object: Object being searched for
  var i;
  for (i in array) {
    if (array[i] == value) {
      return i;
    }
  }
  return null;
};

esri.substitute = (function() {
  var _TEMPLATE_WILDCARD = "${*}",
//      _TEMPLATE_WILDCARD_STRING = "${key} = ${value}<br/>",
      _FORMATTERS = [ "NumberFormat", "DateString", "DateFormat" ];

  function cleanup(value) {
    return esri._isDefined(value) ? value : "";
  }

  function exec(key, data, template) {
    /********
     * Parse
     ********/
    var parts = template.match(/([^\(]+)(\([^\)]+\))?/i);
    var funcName = dojo.trim(parts[1]);
    // TODO
    // Parse-out options instead of eval-ing?
    var args = dojo.fromJson((parts[2] ? dojo.trim(parts[2]) : "()")
                     .replace(/^\(/, "({")
                     .replace(/\)$/, "})"));
    //console.log("[func] = ", funcName, " [args] = ", dojo.toJson(args));

    /**********
     * Execute
     **********/
    var value = data[key];
    if (dojo.indexOf(_FORMATTERS, funcName) === -1) {
      // unsupported function
      //console.warn("unknown function: ", funcName);

      // Assume this is a user-defined global function and execute it
      var ref = dojo.getObject(funcName);
      if (dojo.isFunction(ref)) {
        value = ref(value, key, data);
      }
    }
    else if ( typeof value === "number" || (typeof value === "string" && value && !isNaN(Number(value))) ) {
      value = Number(value);
      
      switch(funcName) {
        case "NumberFormat":
          // TODO
          // Is dojo.number module already part of regular and compact builds?
          if (dojo.getObject("dojo.number.format")) {
            return dojo.number.format(value, args);
          }
          break;
          
        case "DateString":
          var dateVal = new Date(value);
          
          if (args.local || args.systemLocale) {
            // American English; Uses local timezone
            
            if (args.systemLocale) {
              // Uses OS locale's conventions
              // toLocaleDateString and toLocaleTimeString are better than toLocaleString
              return dateVal.toLocaleDateString() + (args.hideTime ? "" : (" " + dateVal.toLocaleTimeString()));

              // Example: "Wednesday, December 31, 1969 4:00:00 PM"
              
              // Related Chromium bug:
              // http://code.google.com/p/chromium/issues/detail?id=3607
              // http://code.google.com/p/v8/issues/detail?id=180
            }
            else {
              // toDateString and toTimeString are better than toString
              return dateVal.toDateString() + (args.hideTime ? "" : (" " + dateVal.toTimeString()));
            }
          }
          else {
            // American English; Uses universal time convention (w.r.t GMT)
            dateVal = dateVal.toUTCString();
            if (args.hideTime) {
              dateVal = dateVal.replace(/\s+\d\d\:\d\d\:\d\d\s+(utc|gmt)/i, "");
            }
            return dateVal;

            // Example: "Thu, 01 Jan 1970 00:00:00 GMT"
            // NOTE: IE writes out UTC instead of GMT
          }
          break;
          
        case "DateFormat":
          // TODO
          // Have the user require this module explicitly, instead of
          // making utils.js directly depend on dojo.date.locale?
          if (dojo.getObject("dojo.date.locale.format")) {
            return dojo.date.locale.format(new Date(value), args);
          }
          break;
      }
    }
      
    return cleanup(value);
  }

  return function(data, template, options) {
    //summary: A function to substitute the argument data, using a template.
    // data: Array: Data object to be substituted
    // template?: String: Template string to use for substitution
    // first?: boolean: If no template, and only first data element is to be returned. Note, different browsers may interpret the for...in loop differently, thus returning different results.
    
    //  Normalize options (for backward compatibility)
    var first, dateFormat, nbrFormat;
    if (esri._isDefined(options)) {
      if (dojo.isObject(options)) {
        first = options.first;
        dateFormat = options.dateFormat;
        nbrFormat = options.numberFormat;
      }
      else {
        first = options;
      }
    }
    //options = options || {};
    //console.log("first = ", first);
    
    /*var transformFn = function(value, key) {
      if (value === undefined || value === null) {
        return "";
      }
      return value;
    };*/
    
    if (!template || template === _TEMPLATE_WILDCARD) {
      var s = [], val, i;
          /*d = {
                key: null,
                value: null
              },
          i,
          _tws = _TEMPLATE_WILDCARD_STRING;*/
      for (i in data) {
        /*d.key = i;
        d.value = data[i];
        s.push(dojo.string.substitute(_tws, d, cleanup));*/
        val = data[i];
        
        if (dateFormat && dojo.indexOf(dateFormat.properties || "", i) !== -1) {
          val = exec(i, data, dateFormat.formatter || "DateString");
        }
        else if (nbrFormat && dojo.indexOf(nbrFormat.properties || "", i) !== -1) {
          val = exec(i, data, nbrFormat.formatter || "NumberFormat");
        }

        s.push(i + " = " + cleanup(val) + "<br/>");
        
        if (first) {
          break;
        }
      }
      return s.join("");
    }
    else {
      //return dojo.string.substitute(template, data, transformFn);
      
      return dojo.replace(template, dojo.hitch({obj:data}, function(_, key){
        //console.log("Processing... ", _);
        
        var colonSplit = key.split(":");
        if (colonSplit.length > 1) {
          key = colonSplit[0];
          colonSplit.shift();
          return exec(key, this.obj, colonSplit.join(":"));
        }
        else {
          //console.log("No function");
          
          // Lookup common date format options
          if (dateFormat && dojo.indexOf(dateFormat.properties || "", key) !== -1) {
            return exec(key, this.obj, dateFormat.formatter || "DateString");
          }
          
          // Lookup common number format options
          if (nbrFormat && dojo.indexOf(nbrFormat.properties || "", key) !== -1) {
            return exec(key, this.obj, nbrFormat.formatter || "NumberFormat");
          }
        }
        
        return cleanup(this.obj[key]);
      }), /\$\{([^\}]+)\}/g);
    }
  };
  
}());

esri.documentBox = dojo.isIE ? { w:document.documentElement.clientWidth, h:document.documentElement.clientHeight } : { w:window.innerWidth, h:window.innerHeight };

esri.urlToObject = function(/*String*/ url) {
  //summary: Returns an object representation of the argument url string
  // url: String: URL in the format of http://path?query
  // returns: { path:String, query:{ key:value } }: Object representing url as path string & query object
  var iq = url.indexOf("?");
  if (iq === -1) {
    return { path:url, query:null }; //{}
  }
  else {
    return { path:url.substring(0, iq), query:dojo.queryToObject(url.substring(iq + 1)) };
  }
};

esri._getProxyUrl = function(isSecureResource) {
  var proxyUrl = esri.config.defaults.io.proxyUrl,
      retVal, fixed, hasFix;
  
  if (!proxyUrl) {
    console.log(esri.bundle.io.proxyNotSet);
    throw new Error(esri.bundle.io.proxyNotSet);
  }
  
  if (isSecureResource && window.location.href.toLowerCase().indexOf("https:") !== 0) {
    fixed = proxyUrl;
    
    if (fixed.toLowerCase().indexOf("http") !== 0) { // is relative url?
      fixed = esri._getAbsoluteUrl(fixed);
    }
    
    fixed = fixed.replace(/^http:/i, "https:");
    
    if (esri._canDoXOXHR(fixed)) {
      proxyUrl = fixed;
      hasFix = 1;
    }
  }
  
  retVal = esri.urlToObject(proxyUrl);
  retVal._xo = hasFix;
  
  return retVal;
};

esri._getProxiedUrl = function(/*String*/ url) {
  if (esri.config.defaults.io.alwaysUseProxy) {
    var proxyUrl = esri._getProxyUrl(),
        _url = esri.urlToObject(url);
    url = proxyUrl.path + "?" + _url.path;
    var params = dojo.objectToQuery(dojo.mixin(proxyUrl.query || {}, _url.query));
    if (params) {
      url += ("?" + params);
    }
  }
  
  return url;
};

esri._hasSameOrigin = function(url1, url2, ignoreProtocol) {
  // Returns:
  //   true - if the given urls have the same origin as defined here:
  //          https://developer.mozilla.org/en/Same_origin_policy_for_JavaScript
  //   false - otherwise
  
  // Tests:
  /*
  console.log("1. " + (esri._hasSameOrigin("http://abc.com", "http://abc.com") === true));
  console.log("2. " + (esri._hasSameOrigin("http://abc.com:9090", "http://abc.com:9090") === true));
  console.log("3. " + (esri._hasSameOrigin("https://abc.com", "https://abc.com") === true));
  console.log("4. " + (esri._hasSameOrigin("https://abc.com:9090", "https://abc.com:9090") === true));
  console.log("5. " + (esri._hasSameOrigin("http://abc.com/", "http://abc.com") === true));
  console.log("6. " + (esri._hasSameOrigin("http://abc.com/res", "http://abc.com/res2/res3") === true));
  console.log("7. " + (esri._hasSameOrigin("http://abc.com:9090/res", "http://abc.com:9090/res2/res3") === true));

  console.log("8. " + (esri._hasSameOrigin("http://abc.com", "http://xyz.com") === false));
  console.log("9. " + (esri._hasSameOrigin("http://abc.com", "http://abc.com:9090") === false));
  console.log("10. " + (esri._hasSameOrigin("http://abc.com", "https://abc.com") === false));
  console.log("11. " + (esri._hasSameOrigin("http://abc.com", "https://abc.com:9090") === false));
  console.log("12. " + (esri._hasSameOrigin("http://abc.com", "https://xyz.com:9090") === false));

  console.log("13. " + (esri._hasSameOrigin("http://abc.com", "https://abc.com", true) === true));
  console.log("14. " + (esri._hasSameOrigin("http://abc.com:9090", "https://abc.com:9090", true) === true));
  console.log("15. " + (esri._hasSameOrigin("http://xyz.com:9090", "https://xyz.com:9090", true) === true));
  
  // The following tests assume the app is hosted on "http://pponnusamy.esri.com"
  console.log("16. " + (esri._hasSameOrigin("http://pponnusamy.esri.com:9090", "/app.html") === true));
  console.log("17. " + (esri._hasSameOrigin("https://pponnusamy.esri.com:9090", "app.html") === false));
  console.log("18. " + (esri._hasSameOrigin("http://pponnusamy.esri.com:9090", "./app.html") === true));
  console.log("19. " + (esri._hasSameOrigin("https://pponnusamy.esri.com:9090", "../app.html") === false));
  
  console.log("20. " + (esri._hasSameOrigin("app.html", "/app.html") === true));
  console.log("21. " + (esri._hasSameOrigin("./app.html", "app.html") === true));
  console.log("22. " + (esri._hasSameOrigin("../app.html", "./app.html") === true));
  console.log("23. " + (esri._hasSameOrigin("/app.html", "../app.html") === true));
  
  console.log("24. " + (esri._hasSameOrigin("/app.html", "https://pponnusamy.esri.com:9090") === false));
  console.log("25. " + (esri._hasSameOrigin("app.html", "http://pponnusamy.esri.com:9090") === true));
  console.log("26. " + (esri._hasSameOrigin("./app.html", "https://pponnusamy.esri.com:9090") === false));
  console.log("27. " + (esri._hasSameOrigin("../app.html", "http://pponnusamy.esri.com:9090") === true));

  console.log("28. " + (esri._hasSameOrigin("app.html", "http://abc.com") === false));
  console.log("29. " + (esri._hasSameOrigin("./app.html", "http://xyz.com:9090") === false));
  */
 
  url1 = url1.toLowerCase();
  url2 = url2.toLowerCase();
  
  var appUrl = window.location.href.toLowerCase();
  
  url1 = url1.indexOf("http") === 0 ? // is absolute url?
           new dojo._Url(url1) : 
           (appUrl = new dojo._Url(appUrl)); // relative urls have the same authority as the application

  url2 = url2.indexOf("http") === 0 ? 
           new dojo._Url(url2) : 
           (dojo.isString(appUrl) ? new dojo._Url(appUrl) : appUrl);
  
  return (
    (ignoreProtocol || (url1.scheme === url2.scheme)) && 
    url1.host === url2.host && 
    url1.port === url2.port
  );
};

esri._canDoXOXHR = function(url, returnIndex) {
  // Returns:
  //   true - if the library can make cross-origin XHR request to the
  //          given url
  //   false - otherwise
  
  // Tests:
  /*
  esri._hasCors = true;
  
  var corsServers = [
    "http://abc.com",
    "https://xyz.com",
    "http://klm.com:9090",
    "https://ijk.com:8080",
    "asdf.net",
    "asdf.net:6080"
  ];
  
  var V_TRUE = true, ALWAYS_TRUE = true, V_FALSE = false;
  
  function test_print(actual, expected) {
    if (actual === expected) {
      console.log("true");
    }
    else {
      console.info("false");
    }
  }
  
  function test_run(num) {
    console.log("(" + num + "): hasCors: " + esri._hasCors + ", #servers: " + (esri.config.defaults.io.corsEnabledServers ? esri.config.defaults.io.corsEnabledServers.length : 0) + ", #builtins: " + (esri.config.defaults.io.corsEnabledPortalServers ? esri.config.defaults.io.corsEnabledPortalServers.length : 0));
    
    test_print(esri._canDoXOXHR("http://abc.com"), V_TRUE);
    test_print(esri._canDoXOXHR("http://abc.com/res1/res2/"), V_TRUE);
    test_print(esri._canDoXOXHR("http://abc.com:99"), V_FALSE);
    test_print(esri._canDoXOXHR("https://abc.com"), V_FALSE);
    test_print(esri._canDoXOXHR("https://abc.com:99"), V_FALSE);

    test_print(esri._canDoXOXHR("https://xyz.com"), V_TRUE);
    test_print(esri._canDoXOXHR("https://xyz.com/res1/res2/"), V_TRUE);
    test_print(esri._canDoXOXHR("https://xyz.com:99"), V_FALSE);
    test_print(esri._canDoXOXHR("http://xyz.com"), V_FALSE);
    test_print(esri._canDoXOXHR("http://xyz.com:99"), V_FALSE);
  
    test_print(esri._canDoXOXHR("http://klm.com:9090"), V_TRUE);
    test_print(esri._canDoXOXHR("http://klm.com:9090/res1/res2/"), V_TRUE);
    test_print(esri._canDoXOXHR("http://klm.com"), V_FALSE);
    test_print(esri._canDoXOXHR("http://klm.com:88"), V_FALSE);
    test_print(esri._canDoXOXHR("https://klm.com"), V_FALSE);
    test_print(esri._canDoXOXHR("https://klm.com:9090"), V_FALSE);
    test_print(esri._canDoXOXHR("https://klm.com:88"), V_FALSE);

    test_print(esri._canDoXOXHR("https://ijk.com:8080"), V_TRUE);
    test_print(esri._canDoXOXHR("https://ijk.com:8080/res1/res2/"), V_TRUE);
    test_print(esri._canDoXOXHR("https://ijk.com"), V_FALSE);
    test_print(esri._canDoXOXHR("https://ijk.com:88"), V_FALSE);
    test_print(esri._canDoXOXHR("http://ijk.com"), V_FALSE);
    test_print(esri._canDoXOXHR("http://ijk.com:8080"), V_FALSE);
    test_print(esri._canDoXOXHR("http://ijk.com:88"), V_FALSE);
    
    test_print(esri._canDoXOXHR("http://asdf.net"), V_TRUE);
    test_print(esri._canDoXOXHR("http://asdf.net/res1/res2/"), V_TRUE);
    test_print(esri._canDoXOXHR("https://asdf.net"), V_TRUE);
    test_print(esri._canDoXOXHR("http://asdf.net:99"), V_FALSE);
    test_print(esri._canDoXOXHR("https://asdf.net:99"), V_FALSE);
    
    test_print(esri._canDoXOXHR("http://asdf.net:6080"), V_TRUE);
    test_print(esri._canDoXOXHR("http://asdf.net:6080/res1/res2/"), V_TRUE);
    test_print(esri._canDoXOXHR("https://asdf.net:6080"), V_TRUE);
    
    test_print(esri._canDoXOXHR("http://www.arcgis.com"), esri._hasCors && ALWAYS_TRUE);
    test_print(esri._canDoXOXHR("http://www.arcgis.com/sharing/"), esri._hasCors && ALWAYS_TRUE);
    test_print(esri._canDoXOXHR("https://www.arcgis.com"), esri._hasCors && ALWAYS_TRUE);
    test_print(esri._canDoXOXHR("http://tiles.arcgis.com"), esri._hasCors && ALWAYS_TRUE);
    test_print(esri._canDoXOXHR("https://services.arcgis.com/sharing/"), esri._hasCors && ALWAYS_TRUE);
  }
  
  var saved = esri.config.defaults.io.corsEnabledServers;
  
  esri.config.defaults.io.corsEnabledServers = saved.concat(corsServers);
  test_run(1);
  
  esri._hasCors = false;
  V_TRUE = false;
  test_run(2);
  
  esri._hasCors = false;
  esri.config.defaults.io.corsEnabledServers = saved;
  V_TRUE = false;
  test_run(3);
  
  esri._hasCors = true;
  esri.config.defaults.io.corsEnabledServers = saved;
  V_TRUE = false;
  test_run(4);
  
  esri._hasCors = true;
  esri.config.defaults.io.corsEnabledServers = null;
  V_TRUE = false;
  ALWAYS_TRUE = false;
  test_run(5);
  */
  
  var canDo = false, hasSameOrigin = esri._hasSameOrigin,
      servers = esri.config.defaults.io.corsEnabledServers,
      //builtin = esri.config.defaults.io.corsEnabledPortalServers,
      sansProtocol, found = -1;
  
  //servers = (servers && builtin) ? servers.concat(builtin) : (servers || builtin);
  
  if (esri._hasCors && servers && servers.length) {
    canDo = dojo.some(servers, function(server, idx) {
      sansProtocol = (dojo.trim(server).toLowerCase().indexOf("http") !== 0);
      
      if (hasSameOrigin(url, sansProtocol ? ("http://" + server) : server) || 
         (sansProtocol && hasSameOrigin(url, "https://" + server))) {
        found = idx;
        return true;
      }
      
      return false;
    });
  }
  
  return returnIndex ? found : canDo;
};

esri.request = function(req, options) {
  var dfd, form = req.form,
      isMultipart = form && dojo.some(form.elements, function(el) { return el.type === "file"; }),
      hasToken = (
                  req.url.toLowerCase().indexOf("token=") !== -1 || 
                  (req.content && req.content.token) ||
                  (isMultipart && dojo.some(form.elements, function(el) { return el.name === "token"; }))
                 ) ? 1 : 0;

  // Let's kick off CORS detection now. "this" request will not be able to
  // use the result of detection as the detection process is asynchronous.
  // However subsequent requests to the same server have better chance of 
  // seeing/using the result.
  esri._detectCors(req.url);
  
  // TODO
  // Note that neither "this" request nor any subsequent request will wait
  // for the detection process to complete. Should we do this in the future?
  // Pro: CORS enabled servers will never ever see a JSONP request from JSAPI
  // Con: Is the detection process fast enough and reliable enough to justify
  //      low latency for the first request?
  
  // initialization stuff
  if (req._usrDfd) {
    dfd = req._usrDfd;
  }
  else {
    dfd = new dojo.Deferred(esri._dfdCanceller);
    
    dfd.addBoth(function(response) {
      // This will notify the caller about SSL requirement, and let it use
      // HTTPS for any further requests so that we don't keep bumping into
      // "403 - ssl required" error - 
      // for example: feature layer query requests
      // See Layer._useSSL and _Task._useSSL

      if ( 
        response && 
        // Catch XML Document response in IE
        // nodeType cannot be 0 (http://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html)
        (!dojo.isIE || !response.nodeType) 
      ) {
        response._ssl = req._ssl;
      }
      
      // TODO
      // What is the strategy to return _ssl to the caller for non-json
      // response?
  
      // TODO
      // We need a formal way to return "credential" and "ssl" to the caller
      // We don't have the proper API today (in Dojo) to return a response
      // that contains data + credential + ssl + etc. However future IO
      // enhancement in Dojo would allow this - see here:
      // http://livedocs.dojotoolkit.org/dojo/request
    });
   
    // setup this dfd to invoke caller's "load" and
    // "error" functions as the first order of business
    // Based on pattern in dojo._ioSetArgs (xhr.js)
    var ld = req.load, errFunc = req.error;
    if (ld) {
      dfd.addCallback(function(value) {
        var realDfd = dfd._pendingDfd,
            ioArgs = realDfd && realDfd.ioArgs,
            args = ioArgs && ioArgs.args;
        return ld.call(args, value, ioArgs);
      });
    }
     
    if (errFunc) {
      dfd.addErrback(function(value) {
        var realDfd = dfd._pendingDfd,
            ioArgs = realDfd && realDfd.ioArgs,
            args = ioArgs && ioArgs.args;
        return errFunc.call(args, value, ioArgs);
      });
    }
    
    // TODO
    // What about caller's "handle" function?
  }
  
  // Does IdentityManager have a Credential for this Service? 
  var noLookup = options && options.disableIdentityLookup;
  if (esri.id 
      && !hasToken && !req._token 
      && !esri.id._isPublic(req.url) 
      && !noLookup
      //&& esri.id.findServerInfo(req.url)
  ) {
    // We're only looking for already acquired credential, if any
    var credential = esri.id.findCredential(req.url);

    if (credential) {
      //console.log("found existing credential = ", credential);
      req._token = credential.token;
      req._ssl = credential.ssl;
    }
    
    /*dfd._pendingDfd = esri.id.getCredential(req.url);
    dfd._pendingDfd
      .addCallback(function(credential) {
        req._token = credential.token;
        req._usrDfd = dfd;
        esri.request(req, options);
      })
      .addErrback(function(error) {
        req._usrDfd = null;
        dfd.errback(error);
        dfd._pendingDfd = null;
      });*/
  }
  
  //else {
    dfd._pendingDfd = esri._request(req, options, isMultipart);
    
    if (!dfd._pendingDfd) {
      dfd.ioArgs = dfd._pendingDfd && dfd._pendingDfd.ioArgs;
      var err = new Error("Deferred object is missing");
      err.log = dojo.config.isDebug; // see Deferred.js:reject for context
      req._usrDfd = null;
      dfd.errback(err);
      dfd._pendingDfd = null;
      return dfd;
    }
    
    dfd._pendingDfd
      .addCallback(function(response) {
        // dfd.ioArgs is being accessed here: arcgis/utils.js, BasemapGallery, FeatureLayer
        // Let's pass it out to the caller
        dfd.ioArgs = dfd._pendingDfd && dfd._pendingDfd.ioArgs;
        
        req._usrDfd = null;
        dfd.callback(response);
        dfd._pendingDfd = null;
      })
      .addErrback(function(error) {
        // Check for SSL required error
        if (
          error && error.code == 403 && 
          
          // We need to differentiate based on "message", because 403
          // can be returned for "you do not have permissions" case as well 
          error.message && 
          error.message.toLowerCase().indexOf("ssl") > -1 &&
          error.message.toLowerCase().indexOf("permission") === -1 
          // covers the case where arcgis server includes "folderName/serviceName"
          // in a "403: do not have permissions" error and folder or service name
          // contains "ssl" in it.
        ) {
          //console.log("ssl = ", req._ssl);
          
          if (!req._ssl) { // prevent infinite loop, obviously something is wrong - let the error bubble up to the caller
            // Flag for esri._request to fix the protocol
            req._ssl = req._sslFromServer = true;
            
            // "_sslFromServer" is a pristine property that is not affected
            // by whatever credential is tried out for this resource

            req._usrDfd = dfd;
            esri.request(req, options);
            return;
          }
        }
        else if (error && error.status == 415) {
          // Java SDS strangely supports CORS for rest/info and rest/services
          // but not for other resources like services and layers. Let's 
          // disable CORS for such servers.
          
          //console.log("CORS ERR: ", error);
          var found = esri._disableCors(req.url);

          if (!req._err415) {
            // Indicates that we've handled 415 error once. Subsequest 415 error
            // for the "same" request (different transport) should be considered an
            // error
            req._err415 = 1; 
            
            req._usrDfd = dfd;
            esri.request(req, options);
            return;
          }
        }
        // Check for "unauthorized access" error
        else if (esri.id 
            && dojo.indexOf(esri.id._errorCodes, error.code) !== -1 
            && !esri.id._isPublic(req.url)
            && !noLookup
            // TODO
            // Treat "subscription disabled" as error
        ) {
          // We're testing error."code" which is typically returned by
          // arcgis server or arcgis.com. So I think it is safe to assume
          // that we'll enter this block for urls that idmgr knows how to handle
          
          dfd._pendingDfd = esri.id.getCredential(req.url, {
            token: req._token,
            error: error
          });
          dfd._pendingDfd
            .addCallback(function(credential) {
              req._token = credential.token;
              req._usrDfd = dfd;
              
              // More weight to the fact that this request may already insist on
              // using SSL. Scenario:
              //  - Resource requires SSL
              //  - This credential is valid but for another user that does not 
              //    require SSL
              //  We don't want to lose the fact that resource still requires SSL
              req._ssl = req._sslFromServer || credential.ssl;
              // Note that it's very likely that this credential will not work
              // for this request if credential.ssl differs from req._ssl.
              // Note that credential.ssl is currently returned only by arcgis.com
              // token service and by federated arcgis server token service
              
              esri.request(req, options);
            })
            .addErrback(function(error) {
              req._usrDfd = null;
              dfd.errback(error);
              dfd._pendingDfd = null;
            });
          return;
        }

        dfd.ioArgs = dfd._pendingDfd && dfd._pendingDfd.ioArgs;
        req._usrDfd = null;
        dfd.errback(error);
        dfd._pendingDfd = null;
      });
  //}
  
  return dfd;
};

esri._request = function(/*Object*/ req, /*Object?*/ options, /*Boolean?*/ isMultipart) {
  // pre-process options
  var useProxy = false, usePost = false;
  if (esri._isDefined(options)) {
    if (dojo.isObject(options)) {
      useProxy = !!options.useProxy;
      usePost = !!options.usePost;
    }
    else { // backward compatibility
      useProxy = !!options;
    }
  }
  
  req = dojo.mixin({}, req);
  
  if (req._ssl) {
    // Fix the protocol before making the request
    req.url = req.url.replace(/^http:/i, "https:");
    
    // TODO
    // What about the port number for HTTPS protocol?
    // Port number could be different for ArcGIS Server where a web
    // adaptor is not configured
    // For example: at 10.1, HTTP runs on 6080 and HTTPS on 6443 by default
  }
  
  var content = req.content,
      path = req.url,
      form = isMultipart && req.form,
      cfgIO = esri.config.defaults.io;

  // Intercept and check for REST error
  req.load = function(response) {
    //esri._detectCors(dojo.getObject("args.url", false, ioArgs));
    
    var err;
    if (response) {
      if (response.error) {
        err = dojo.mixin(new Error(), response.error);
        err.log = dojo.config.isDebug; // see Deferred.js:reject for context
      }
      else if (response.status === "error") { // arcgis server admin resource
        err = dojo.mixin(new Error(), {
          code: response.code,
          message: response.messages && response.messages.join && response.messages.join(".")
        });
        err.log = dojo.config.isDebug; // see Deferred.js:reject for context
      }
    }
    
    return err || response;
  };
  
  // Intercept and create proper JS Error object
  req.error = function(error, io) {
    if (io && io.xhr) {
      io.xhr.abort();
    }

    if (!(error instanceof Error)) {
      error = dojo.mixin(new Error(), error);
    }
    
    error.log = dojo.config.isDebug; // see Deferred.js:reject for context
    
    cfgIO.errorHandler(error, io);
    return error;
  };
 
  if (req._token) {
    req.content = req.content || {};
    req.content.token = req._token;
  }

  // get the length of URL string
  var len = 0;
  if (content && path) {
    len = dojo.objectToQuery(content).length + path.length + 1;
  }

  req.timeout = esri._isDefined(req.timeout) ? req.timeout : cfgIO.timeout;
  req.handleAs = req.handleAs || "json";

  // send the request
  try {
    var proxyUrl, proxyPath,
        sentinel = esri._reqPreCallback, 
        canDoXo = esri._canDoXOXHR(req.url) && !(/https?:\/\/[^\/]+\/[^\/]+\/admin\/?(\/.*)?$/i.test(req.url)),
        sameOrigin = (esri._hasSameOrigin(req.url, window.location.href) || canDoXo),
        doPost = (usePost || isMultipart || len > cfgIO.postLength) ? true : false,
        doJSONP = (!sameOrigin && req.handleAs.indexOf("json") !== -1 && req.callbackParamName && !isMultipart) ? true : false,
        // TODO
        // Override alwaysUseProxy and useProxy for sameOrigin requests?
        doProxy = (
                    cfgIO.alwaysUseProxy || useProxy || 
                    ((!doJSONP || doPost) && !sameOrigin) 
                  ) ? true : false; 
    
    /*if (!doJSONP && request.handleAs.indexOf("json") !== -1) {
      console.log("esri.request: if the service you're trying to call supports JSONP response format, then you need to set 'callbackParamName' option in the request. Consult the service documentation to find out this callback parameter name.");
    }*/
    
    if (isMultipart && !esri._hasFileUpload && !doProxy && canDoXo) {
      // CORS does not help make iframe.send. Iframe technique inherently
      // requires strict same-origin condition
      doProxy = true;
    }
    
    if (doProxy) {
      proxyUrl = esri._getProxyUrl(dojo.trim(path).toLowerCase().indexOf("https:") === 0);
      proxyPath = proxyUrl.path;
      
      // We need to use HTTPS endpoint for the proxy if the resource 
      // being accessed has HTTPS endpoint
      //proxyPath = esri._fixProxyProtocol(proxyPath, path);
      
      if (proxyUrl._xo) {
        canDoXo = true;
      }
      
      // Make sure we dont have to post 
      if (!doPost && (proxyPath.length + 1 + len) > cfgIO.postLength) {
        doPost = true;
      }

      // Modify the request object as necessary
      //request = dojo.mixin({}, request);
      req.url = proxyPath + "?" + path;
      
      if (doPost) {
        req.content = dojo.mixin(proxyUrl.query || {}, content);
      }
      else {
        var kvString = dojo.objectToQuery(dojo.mixin(proxyUrl.query || {}, content));
        if (kvString) {
          req.url += ("?" + kvString);
        }
        
        req.content = null;
      }
    }
    
    if (doJSONP && !doPost) { // using dynamic SCRIPT tag
      // Background info:
      // Servery seems to be slow responding to some queries at certain times 
      // and as a result queries sent after this slow request are blocked on 
      // the client. Server returned the response to these blocked queries but 
      // they are not processed(jsonp script execution) by Firefox until the 
      // slow request has either succeeded or timed out. This has to do with 
      // how Firefox handles script tags. This issue has been fixed at 
      // Firefox 3.6 (via an async attribute to script tags)  
      // Chrome, Safari and IE exhibit async=true by default
      // References:
      // http://trac.dojotoolkit.org/ticket/11953
      // https://developer.mozilla.org/En/HTML/Element/Script
      // http://stackoverflow.com/questions/2804212/dynamic-script-addition-should-be-ordered
      // http://blogs.msdn.com/b/kristoffer/archive/2006/12/22/loading-javascript-files-in-parallel.aspx
      // http://code.google.com/p/jquery-jsonp/issues/detail?id=20
      // http://tagneto.blogspot.com/2010/01/script-async-raindrop-and-firefox-36.html
      if (!esri._isDefined(req.isAsync) && dojo.isFF < 4) {
        // Default is true for FF 3.6 if the caller did not set it
        req.isAsync = true;
      }

      //console.log("++++++++++++++++[ dojo.io.script.get ]");
      return dojo.io.script.get(sentinel ? sentinel(req) : req);
    }
    else {
      // Background info: http://trac.dojotoolkit.org/ticket/9486
      var hdrs = req.headers;
      if (canDoXo && (!hdrs || !hdrs.hasOwnProperty("X-Requested-With"))) {
        hdrs = req.headers = (hdrs || {});
        // Prevent unnecessary preflighted CORS request
        hdrs["X-Requested-With"] = null;
      }
      
      // Make form modifications for multipart requests
      if (isMultipart) {
        var paramName = req.callbackParamName || "callback.html", 
            elementName = req.callbackElementName || "textarea",
            param, found, paramValue, i, il = form.elements.length, el;
        
        // Copy content over to the form
        content = req.content;
        if (content) {
          for (param in content) {
            paramValue = content[param];
            
            if (esri._isDefined(paramValue)) {
              found = null;
              
              for (i = 0; i < il; i++) {
                el = form.elements[i];
                if (el.name === param) {
                  found = el;
                  break;
                }
              }
              
              /*dojo.some(form.elements, function(el) {
                if (el.name === param) {
                  found = el;
                  return true;
                }
                return false;
              });*/
              
              if (found) {
                found.value = paramValue;
              }
              else {
                form.appendChild( dojo.create("input", { type: "hidden", name: param, value: paramValue }) );
              }
            }
          }
        }
        
        if (esri._hasFileUpload) {
          //console.log("[req FormData]");
          
          // Remove "callback.html" if present in the form, because
          // we're going to process the response as normal JSON
          dojo.forEach(form.elements, function(el) {
            if (el.name === paramName) {
              //console.log("Removed callback.html element from the form");
              form.removeChild(el);
            }
          });
          
          // This usage of contentType is available after backporting a 
          // Dojo 1.7 patch to Dojo 1.6.1.
          // See: dojo/_base/xhr.js - dojo.xhr
          // http://trac.dojotoolkit.org/changeset/25326/dojo
          req.contentType = false;
          req.postData = new FormData(form);
          delete req.form;
        }
        else {
          //console.log("[req IFrame]");
          
          form.enctype = "multipart/form-data";
          if (dojo.isIE < 9) {
            // In IE, dynamically setting the value of "enctype" attribute
            // does not seem to take effect
            form.encoding = "multipart/form-data";
          }
          form.method = "post";
          
          // Add "callback.html" if not already in the form
          if ( !dojo.some(form.elements, function(el) { return el.name === paramName; }) ) {
            form.appendChild( dojo.create("input", { type: "hidden", name: paramName, value: elementName }) );
          }
    
          // A version of arcgis server before 10.1 (.net or java) would fail without
          // callback.html parameter in the URL for add and update attachment operations
          if (path.toLowerCase().indexOf("addattachment") !== -1 || path.toLowerCase().indexOf("updateattachment") !== -1) {
            req.url = path + ((path.indexOf("?") === -1) ? "?" : "&") + paramName + "=" + elementName;
            if (doProxy) {
              req.url = proxyPath + "?" + req.url;
            }
            //console.log("fixed: " + req.url);
          }
          
          // iframe typically supports content object. However IE 7 (IE 8 in IE 7 standards mode)
          // throws an error related to element focus if this is not deleted here.
          // Could be something to do with iframe impl deleting form elements that it
          // adds from content object
          delete req.content;
        }
      }
      
      req = sentinel ? sentinel(req) : req;
          
      // TODO
      // Connect xhr download and upload progress events for
      // xhr get and post
      
      if (doPost) {
        if (isMultipart && !esri._hasFileUpload) {
          //console.log("++++++++++++++++[ dojo.io.iframe.send ]");
          return dojo.io.iframe.send(req);
        }
        else {
          //console.log("++++++++++++++++[ dojo.rawXhrPost ]");
          return dojo.rawXhrPost(req);
        }
      }
      else {
        //console.log("++++++++++++++++[ dojo.xhrGet ]");
        return dojo.xhrGet(req);
      }
    }
  }
  catch (e) {
    var dfd = new dojo.Deferred();
    dfd.errback(req.error(e));
    return dfd;
  }
};

esri._disableCors = function(url) {
  //console.log("esri._disableCors: ", url);
  
  var ioConfig = esri.config.defaults.io,
      processed = ioConfig._processedCorsServers,
      origin = new dojo._Url(url), found = -1;
      
  origin = (origin.host + (origin.port ? (":" + origin.port) : "")).toLowerCase();
  found = esri._canDoXOXHR(url, true);

  if (found > -1) {
    //console.log("index: ", found);
    ioConfig.corsEnabledServers.splice(found, 1);
  }
  
  processed[origin] = 1;
  
  return found;
};

esri._detectCors = function(url) {
  // I know we don't want to get used to the habit of using try-catch
  // programming, but esri.request is a core part of the API.
  // We don't want unexpected(*) error in the code below to affect
  // normal response processing workflow (not to mention what we're doing
  // below is an optimization - not a critical functionality)
  // Note: the term "unexpected" means the developer overlooked something

  var ioConfig = esri.config.defaults.io,
      processed = ioConfig._processedCorsServers;
  
  if (!ioConfig.corsDetection) {
    return;
  }
  
  try {
    var origin = new dojo._Url(url);
    origin = (origin.host + (origin.port ? (":" + origin.port) : "")).toLowerCase();
    
    if (
      // Browser support
      esri._hasCors &&
      
      // ServerInfo is available since version 10.0, but token service has
      // issues prior to 10 SP1
      //this.version >= 10.01 && 
      
      // Interested in ArcGIS REST resources only
      (url && url.toLowerCase().indexOf("/rest/services") !== -1) &&
      
      // AND server not already known to support CORS
      (!esri._hasSameOrigin(url, window.location.href) && !esri._canDoXOXHR(url)) &&
      
      // AND NOT already processed
      !processed[origin]
    ) {
      //console.log("***************** esri._detectCors *********** ]", url);
      //console.log("***************** [fetching server info] **************** ", origin);
      processed[origin] = -1;
      
      // TODO
      // Can we use fetch "rest/services" instead of "rest/info"? This will allow
      // 9.3 servers to get in the action.
      // How reliable and fast is "rest/services" resource?
      
      // If we use esri.request, it will use proxy to get the response.
      // We don't want that - because we want to find out if cross-origin
      // XHR works. So let's use dojo.xhrGet directly.
      dojo.xhrGet({
        url: url.substring(0, url.toLowerCase().indexOf("/rest/") + "/rest/".length) + "info",
        content: { f: "json" },
        handleAs: "json",
        headers: { "X-Requested-With": null }
        
      }).then(
        function(response) {
          //console.log("REST Info response: ", arguments);

          if (response) {
            processed[origin] = 2;
            
            // Add this server to corsEnabledServers list
            if (!esri._canDoXOXHR(url)) {
              ioConfig.corsEnabledServers.push(origin);
            }

            // Yes - response.error is also considered as confirmation for
            // CORS support
          }
          else {
            // Indicates no support for CORS on this server. Older servers
            // that don't support ServerInfo will follow this path.
            // Dojo returns null in this case.
            processed[origin] = 1;
          }
        },
        
        function(error) {
          //console.error("REST Info FAILED: ", error);
          
          // Mark this server so that we don't make info request again
          processed[origin] = 1;
        }
      );
    }
  }
  catch (e) {
    console.log("esri._detectCors: an unknown error occurred while detecting CORS support");
  }
};

/*
 * Related info and discussion:
 * http://o.dojotoolkit.org/forum/dojo-core-dojo-0-9/dojo-core-support/ajax-send-callback
 * http://trac.dojotoolkit.org/ticket/5882
 * http://api.jquery.com/jQuery.ajax/#options
 */
esri.setRequestPreCallback = function(callback) {
  esri._reqPreCallback = callback;
};

esri._getParts = function(arr, obj, cb) {
	return [ 
		dojo.isString(arr) ? arr.split("") : arr, 
		obj || dojo.global,
		// FIXME: cache the anonymous functions we create here?
		dojo.isString(cb) ? new Function("item", "index", "array", cb) : cb
	];
};

esri.filter = function(arr, callback, thisObject) {
  var _p = esri._getParts(arr, thisObject, callback), outArr = {}, i;
  arr = _p[0];

  for (i in arr) {
    if (_p[2].call(_p[i], arr[i], i, arr)) {
      outArr[i] = arr[i];
    }
  }

  return outArr; // Array
};

esri.TileUtils = (function() {
  function getClosestLodInfo(map, ti, extent) {
//    var tw = ti.width,
//        th = ti.height,

    var wd = map.width, // / tw, //widthRatio
        ht = map.height, // / th, //heightRatio

        ew = extent.xmax - extent.xmin, //extentW
        eh = extent.ymax - extent.ymin, //extentH

        ed = -1, //extentDiff
        lods = ti.lods,
        i, il = lods.length,
        abs = Math.abs,
        lod, cl, ced; //currLod, currExtentDiff

    for (i=0; i<il; i++) {
      cl = lods[i];
      ced = ew > eh ? abs( eh - (ht * cl.resolution) ) : abs( ew - (wd * cl.resolution) );
      if (ed < 0 || ced <= ed) {
        lod = cl;
        ed = ced;
      }
      else {
        break;
      }
    }
    return lod;
  }
  
  function getAdjustedExtent(map, extent, lod) {
    var res = lod.resolution, //resolution
        cx = (extent.xmin + extent.xmax) / 2, //centerX
        cy = (extent.ymin + extent.ymax) / 2, //centerY
        w2res = (map.width / 2) * res,
        h2res = (map.height / 2) * res;

    return new esri.geometry.Extent(cx-(w2res), cy-(h2res), cx+(w2res), cy+(h2res), extent.spatialReference);
  }
  
  function getContainingTile(map, ti, point, lod) {
    var res = lod.resolution,
        tw = ti.width, //tileWidth
        th = ti.height, //tileHeight
        to = ti.origin, //tileOrigin
        mv = map.__visibleDelta,
        floor = Math.floor,

        tmw = tw * res, //tileMapWidth
        tmh = th * res, //tileMapHeight
        tr = floor( (to.y - point.y) / tmh ), //tileRow
        tc = floor( (point.x - to.x) / tmw ), //tileCol
        tmox = to.x + (tc * tmw), //tileMapOriginX
        tmoy = to.y - (tr * tmh), //tileMapOriginY
        oX = floor( Math.abs( (point.x - tmox) * tw / tmw ) ) + mv.x, //offsetX
        oY = floor( Math.abs( (point.y - tmoy) * th / tmh ) ) + mv.y; //offsetY

    return { point:point, coords:{ row:tr, col:tc }, offsets:{ x:oX, y:oY } };
  }
  
  return {
    _addFrameInfo: function(tileInfo, srInfo) {
      // NOTE
      // This method will augment tileInfo.lods with
      // frame info. If you don't want that you should
      // pass in a cloned tileInfo
      
      var pixelsCoveringWorld, numTiles, 
          world = 2 * srInfo.origin[1], m180 = srInfo.origin[0],
          originX = tileInfo.origin.x, tileWidth = tileInfo.width,
          m180Col;
      
      dojo.forEach(tileInfo.lods, function(lod){
        pixelsCoveringWorld = Math.round(world / lod.resolution);
        numTiles = Math.ceil(pixelsCoveringWorld / tileWidth);
        m180Col = Math.floor( (m180 - originX) / (tileWidth * lod.resolution) );
        
        if (!lod._frameInfo) {
          lod._frameInfo = [ 
            /* #tiles */ numTiles, 
            /* -180 */ m180Col, 
            /* +180 */ m180Col + numTiles - 1, 
            /* pixels per world */ pixelsCoveringWorld // used in _coremap.js:_getFrameWidth
          ];
          //console.log(lod.level, ": ", lod._frameInfo);
        }
      });
    },
    
    getContainingTileCoords: function(ti, point, lod) {
      var to = ti.origin,
          res = lod.resolution,
          tmw = ti.width * res, //tileMapWidth
          tmh = ti.height * res, //tileMapHeight
          tc = Math.floor((point.x - to.x) / tmw), //tileColumn
          tr = Math.floor((to.y - point.y) / tmh); //tileRow
      return { row:tr, col:tc };
    },

    getCandidateTileInfo: function(map, ti, extent) {
      var lod = getClosestLodInfo(map, ti, extent),
          adj = getAdjustedExtent(map, extent, lod), //adjustedExtent
          ct = getContainingTile(map, ti, new esri.geometry.Point(adj.xmin, adj.ymax, extent.spatialReference), lod); //containingTile
      return { tile:ct, lod:lod, extent:adj };
    },

    getTileExtent: function(ti, level, row, col) {
      // console.log(map + ", " + ti ", " level + ", " + row + ", " + col);
      var to = ti.origin,
          lod = ti.lods[level],
          res = lod.resolution,
          // sr = lod.startTileRow,
          // sc = lod.startTileCol,
          tw = ti.width,
          th = ti.height;

      return new esri.geometry.Extent(
        ((col * res) * tw) + to.x,
        to.y - ((row + 1) * res) * th,
        (((col + 1) * res) * tw) + to.x,
        to.y - ((row * res) * th),
        ti.spatialReference
      );
    }
  };
}());

esri.graphicsExtent = function(/*esri.Graphic[]*/ graphics) {
  var g = graphics[0].geometry,
      fullExt = g.getExtent(),
      ext, i, il = graphics.length;
      
  if (fullExt === null) {
    fullExt = new esri.geometry.Extent(g.x, g.y, g.x, g.y, g.spatialReference);
  }

  for (i=1; i<il; i++) {
    ext = (g = graphics[i].geometry).getExtent();
    if (ext === null) {
      ext = new esri.geometry.Extent(g.x, g.y, g.x, g.y, g.spatialReference);
    }

    fullExt = fullExt.union(ext);
  }

  if (fullExt.getWidth() <= 0 && fullExt.getHeight() <= 0) {
    return null;
  }
  
  return fullExt;
};

esri.getGeometries = function(/*esri.Graphic[]*/ graphics) {
  return dojo.map(graphics, function(graphic) {
    return graphic.geometry;
  });
};

esri._encodeGraphics = function(/*esri.Graphic[]*/ graphics, normalized) {
  var encoded = [], json, enc, norm;
  dojo.forEach(graphics, function(g, i) {
    json = g.toJson();
    enc = {};
    if (json.geometry) {
      norm = normalized && normalized[i];
      enc.geometry = norm && norm.toJson() || json.geometry;
    }
    if (json.attributes) {
      enc.attributes = json.attributes;
    }
    encoded[i] = enc;
  });
  return encoded;
};

esri._serializeLayerDefinitions = function(/*String[] (sparse array)*/ layerDefinitions) {
  // Test cases
  /*
   var result = _serializeLayerDefinitions();
   console.log(result === null, result);
  
   var result = _serializeLayerDefinitions(null);
   console.log(result === null, result);
  
   var result = _serializeLayerDefinitions([]);
   console.log(result === null, result);

   var definitions = [];
   definitions[0] = "abc = 100";
   definitions[5] = "def LIKE '%test%'";
   var result = _serializeLayerDefinitions(definitions);
   console.log(result === "0:abc = 100;5:def LIKE '%test%'", result);

   var definitions = [];
   definitions[0] = "abc = 100";
   definitions[5] = "def LIKE '%te:st%'";
   var result = _serializeLayerDefinitions(definitions);
   console.log(result === '{"0":"abc = 100","5":"def LIKE \'%te:st%\'"}', result);

   var definitions = [];
   definitions[0] = "abc = 100";
   definitions[5] = "def LIKE '%te;st%'";
   var result = _serializeLayerDefinitions(definitions);
   console.log(result === '{"0":"abc = 100","5":"def LIKE \'%te;st%\'"}', result);

   var definitions = [];
   definitions[0] = "abc:xyz = 100";
   definitions[5] = "def LIKE '%te;st%'";
   var result = _serializeLayerDefinitions(definitions);
   console.log(result === '{"0":"abc:xyz = 100","5":"def LIKE \'%te;st%\'"}', result);
  */
  
  var defs = [], hasSpecialChars = false, re = /[:;]/;
  
  if (layerDefinitions) {
    dojo.forEach(layerDefinitions, function(defn, i) {
      if (defn) {
        defs.push([ i, defn ]);
        
        if (!hasSpecialChars && re.test(defn)) {
          hasSpecialChars = true;
        }
      } // if defn
    }); // forEach
  
    if (defs.length > 0) {
      var retVal;
      
      if (hasSpecialChars) { // 9.4 format
        retVal = {};
        dojo.forEach(defs, function(defn) {
          retVal[defn[0]] = defn[1];
        });
        retVal = dojo.toJson(retVal);
      }
      else { // old format
        retVal = [];
        dojo.forEach(defs, function(defn) {
          retVal.push(defn[0] + ":" + defn[1]);
        });
        retVal = retVal.join(";");
      }
      
      return retVal;
    } // if defs.length
    
  } // if layerDefinitions
  
  return null;
};

esri._serializeTimeOptions = function(layerTimeOptions, ids) {
  if (!layerTimeOptions) {
    return;
  }
  
  var retVal = [];
  
  dojo.forEach(layerTimeOptions, function(option, i) {
    // It's going to be a sparse array. So we got to
    // make sure the element is not empty
    if (option) {
      var json = option.toJson();
      if (ids && dojo.indexOf(ids, i) !== -1) {
        json.useTime = false;
      }
      retVal.push("\"" + i + "\":" + dojo.toJson(json));
    }
  });
  
  if (retVal.length) {
    return "{" + retVal.join(",") + "}";
  }
};

esri._isDefined = function(value) {
  return (value !== undefined) && (value !== null);
};

esri._sanitize = function(obj, recursive) {
  // Helper method to remove properties with undefined value.
  // Notes:
  // - This should happen in dojo.toJson. It cannot allow an
  //   invalid json value like undefined. See http://json.org
  // - Does not recurse
  var prop;
  
  if (recursive) {
    for (prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        if (obj[prop] === undefined || obj[prop] === null) {
          delete obj[prop];
        }
        else if (obj[prop] instanceof Object) {
          esri._sanitize(obj[prop], true);
        }
      }
    }
  }
  else {
    for (prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        if (obj[prop] === undefined) {
          delete obj[prop];
        }
      }
    } // for
  }
  return obj;
};

/***************************************************
 * Routines to manage deferreds and method wrappers
 **************************************************/

esri._dfdCanceller = function(dfd) {
  dfd.canceled = true;
  
  var pending = dfd._pendingDfd;
  if (dfd.fired === -1 && pending && pending.fired === -1) { // both "dfd" and "pending" are not fired yet
    //console.log("Cancelling... ", pending.ioArgs);
    pending.cancel();
    // In our arch, by the time "cancel" returns
    // "dfd" would have been deemed finished because
    // "pending"s rejection is wired to reject "dfd"
  }
  dfd._pendingDfd = null;
};

esri._fixDfd = function(dfd) {
  // Use this method only if your deferred supports
  // more than one result arguments for its callback
  
  // Refer to dojo/_base/Deferred.js::notify() for context
  // before reading this function
  
  // TODO
  // Are there better/alternative solutions?
  
  var saved = dfd.then;
  
  // Patch "then"
  dfd.then = function(resolvedCallback, b, c) {
    if (resolvedCallback) {
      var resolved = resolvedCallback;
      
      // Patch "resolved callback"
      resolvedCallback = function(result) {
        if (result && result._argsArray) {
          return resolved.apply(null, result);
        }
        return resolved(result);
      };
    }
    
    return saved.call(this, resolvedCallback, b, c);
  };
  
  return dfd;
};

esri._resDfd = function(dfd, /*Anything[]*/ args, isError) {
  var count = args.length;
  
  if (count === 1) {
    if (isError) {
      dfd.errback(args[0]);
    }
    else {
      dfd.callback(args[0]);
    }
  }
  else if (count > 1) {
    // NOTE
    // See esri._fixDfd for context
    args._argsArray = true;
    dfd.callback(args);
  }
  else {
    dfd.callback();
  }
};

// TODO
// Will this routine be available at any time a module is
// loaded?
// May need to be hosted in esri.js
esri._createWrappers = function(className) {
  var classProto = dojo.getObject(className + ".prototype");

  /**
   * Spec for the method signature:
   * {
   *   n: <String>,
   *      // Name of the method being wrapped
   *   
   *   c: <Number>,
   *      // Number of arguments supported by the method before
   *      // normalization came into play.
   *   
   *      // List of arguments or properties of arguments that
   *      // need to be normalized
   *   a: [
   *    {
   *      i: <Number>,
   *         // Index of this argument in the method signature
   *      
   *      p: <String[]>
   *         // If this argument is an object that may contain
   *         // properties that need to be normalized, indicate
   *         // such properties here. OPTIONAL.
   *    }
   *   ],
   *   
   *   e: <Number>,
   *      // Index of the argument that is an error callback
   *   
   *   f: <Number>
   *      // Specify 1 if the deferred object should be fixed
   *      // to support multiple callback arguments
   * }
   */  
  dojo.forEach(classProto.__msigns, function(sig) {
    //console.log("Patching: ", className + ".prototype." + sig.n);
    var methodProto = classProto[sig.n];
    
    // Define wrapper
    // methodInfo and methodProto will be available within 
    // this wrapper via closure
    // Test multiple consecutive invocations of the wrapped
    // method -- seems to be doing okay
    classProto[sig.n] = function() {
      var self = this, inArgs = [], i,
          outDfd = new dojo.Deferred(esri._dfdCanceller);
      
      if (sig.f) {
        esri._fixDfd(outDfd);
      }
      
      // Pre-process input arguments
      for (i = 0; i < sig.c; i++) {
        inArgs[i] = arguments[i];
      }
      
      // Make sure the wrapped method is aware that
      // "context" is passed as the last argument
      var context = { dfd: outDfd };
      inArgs.push(context);
      
      var components, toBeNormalized = [], intermediateDfd;

      if (self.normalization && !self._isTable) { // normalize if not a feature layer "table"
        components = esri._disassemble(inArgs, sig.a);
        
        dojo.forEach(components, function(comp) {
          toBeNormalized = toBeNormalized.concat(comp.value);
        });
        
        //intermediateDfd = esri._fakeNormalize(toBeNormalized.length ? toBeNormalized : null); 
        
        if (toBeNormalized.length) {
          var sr = toBeNormalized[0].spatialReference;
          if (sr && sr._isWrappable()) {
            intermediateDfd = esri.geometry.normalizeCentralMeridian(toBeNormalized, esri.config.defaults.geometryService);
          }
        }
      }
      
      // Check if normalize routine is initiated
      if (intermediateDfd) {
        // Register proper callbacks to be called when we
        // have normalize results
        //console.log("Normalizing...");
        outDfd._pendingDfd = intermediateDfd;
        
        intermediateDfd.addCallbacks(
          function(normalized) {
            //console.log("Normalized: ", normalized);
            if (outDfd.canceled) {
              return;
            }
           
            context.assembly = esri._reassemble(normalized, components);
            //console.log("Assembly: ", context.assembly);

            // We need to invoke the actual method now that we have
            // the normalized geometry
            outDfd._pendingDfd = methodProto.apply(self, inArgs);
          }, 
          function(err) {
            var className = self.declaredClass;
            if (className && className.indexOf("FeatureLayer") !== -1) {
              // See FeatureLayer.js
              self._resolve([err], null, inArgs[sig.e], outDfd, true);
            }
            else { // tasks have _errorHandler
              // See _task.js
              self._errorHandler(err, inArgs[sig.e], outDfd);
            }
          }
        );
      }
      else {
        //console.log("Normalizing not happening...");
        
        // We're not normalizing, just execute the query 
        outDfd._pendingDfd = methodProto.apply(self, inArgs);
      }
      
      // Caller can add its callbacks and error callbacks to
      // this deferred
      return outDfd;
    };
    
  }); // methods
  
};

esri._disassemble = function(inArgs, argInfos) {
  // This method will look into the input arguments
  // or their individual properties, find values as 
  // specified by argInfos and put them in an array.
  
  // TODO
  // Add test cases
  
  var bucket = [];
  
  // Look for geometry(s) in the input arguments
  // and push them into a bucket to be normalized
  // Disassembly: arguments broken down
  dojo.forEach(argInfos, function(argInfo) {
    var argIndex = argInfo.i,
        arg = inArgs[argIndex], 
        properties = argInfo.p, prop;
    
    // We want to look for geometry(s) only
    if (!dojo.isObject(arg) || !arg) {
      return;
    }
    
    if (properties) { // argument has property(s) that need to be normalized
      if (properties[0] === "*") { 
        // UNKNOWN parameters. GP FeatureSet parameters
        for (prop in arg) {
          if (arg.hasOwnProperty(prop)) {
            esri._addToBucket(arg[prop], bucket, argIndex, prop);
          }
        }
      }
      else {
        dojo.forEach(properties, function(prop) {
          esri._addToBucket(dojo.getObject(prop, false, arg) /*arg[prop]*/, bucket, argIndex, prop);
        });
      }
    }
    else { // argument itself needs to be normalized
      esri._addToBucket(arg, bucket, argIndex);
    }    
  });
  
  return bucket;
};

esri._addToBucket = function(value, bucket, argIndex, property) {
  // TODO
  // Add test cases
  var flag = false, className;
  
  if (dojo.isObject(value) && value) {
    if (dojo.isArray(value)) {
      if (value.length) {
        className = value[0] && value[0].declaredClass;
        if (className && className.indexOf("Graphic") !== -1) {
          // Array of Graphics. Extract Geometries
          value = dojo.map(value, function(feature) {
            return feature.geometry;
          });
          value = dojo.filter(value, esri._isDefined);
          flag = value.length ? true : false;
        }
        else if (className && className.indexOf("esri.geometry.") !== -1) {
          // Array of Geometries
          flag = true;
        }
      }
    }
    else {
      className = value.declaredClass;
      if (className && className.indexOf("FeatureSet") !== -1) {
        // Array of Graphics. Extract Geometries
        value = dojo.map(value.features || [], function(feature) {
          return feature.geometry;
        });
        value = dojo.filter(value, esri._isDefined);
        flag = value.length ? true : false;
      }
      else if (className && className.indexOf("esri.geometry.") !== -1) {
        // Geometry
        flag = true;
      }
      //flag = true;
    }
  }
  
  if (flag) {
    bucket.push({
      index: argIndex,
      property: property, // optional
      value: value // can be a single geometry or array of geometries
    });
  }
};

esri._reassemble = function(normalized, components) {
  var idx = 0, assembly = {};
  
  dojo.forEach(components, function(comp) {
    var index = comp.index,
        property = comp.property,
        value = comp.value,
        len = value.length || 1;
    
    var result = normalized.slice(idx, idx + len);
    if (!dojo.isArray(value)) {
      result = result[0];
    }
    
    idx += len;
    delete comp.value;
    
    if (property) {
      assembly[index] = assembly[index] || {};
      assembly[index][property] = result;
    }
    else {
      assembly[index] = result;
    }
  });
  
  return assembly;
};

/*esri._fakeNormalize = function(values) {
  if (values && values.length) {
    var dfd = new dojo.Deferred();
    
    setTimeout(function() {
      var normalized = [];
      for (var i = 0; i < values.length; i++) {
        //normalized[i] = { x: i };
        normalized[i] = esri.geometry.fromJson(values[i].toJson());
        normalized[i].x *= 10;
        normalized[i].y *= 10;
      }
      dfd.callback(normalized);
    }, 1000);
    
    return dfd;
  }
};*/

esri.setScrollable = function(node) {
  var previousX = 0, previousY = 0, sWidth = 0, sHeight = 0, cWidth = 0, cHeight = 0;
  
  return [
    dojo.connect(node, "ontouchstart", function(evt) {
      previousX = evt.touches[0].screenX;
      previousY = evt.touches[0].screenY;
      
      sWidth = node.scrollWidth;
      sHeight = node.scrollHeight;
      cWidth = node.clientWidth;
      cHeight = node.clientHeight;
    }),
    
    dojo.connect(node, "ontouchmove", function(evt) {
      // Prevent page from scrolling
      evt.preventDefault();
      
      var child = node.firstChild; 
      if (child instanceof Text) {
        child = node.childNodes[1];
      }    
      var currentX = child._currentX || 0,
          currentY = child._currentY || 0;
          
      currentX += (evt.touches[0].screenX - previousX);
      if (currentX > 0) {
        currentX = 0;
      }
      else if (currentX < 0 && (Math.abs(currentX) + cWidth) > sWidth) {
        currentX = -1 * (sWidth - cWidth);
      }
      child._currentX = currentX;

      currentY += (evt.touches[0].screenY - previousY);
      if (currentY > 0) {
        currentY = 0;
      }
      else if (currentY < 0 && (Math.abs(currentY) + cHeight) > sHeight) {
        currentY = -1 * (sHeight - cHeight);
      }
      child._currentY = currentY;
      
      dojo.style(child, {
        "-webkit-transition-property": "-webkit-transform",
        "-webkit-transform": "translate(" + currentX + "px, " + currentY + "px)"
      });
      
      previousX = evt.touches[0].screenX;
      previousY = evt.touches[0].screenY;
    })
  ];
};

esri._getAbsoluteUrl = function (url) {
  if (dojo.isString(url) && url.indexOf("http://") === -1 && url.indexOf("https://") === -1) {
    if (url.indexOf("//") === 0) {
      return window.location.protocol + url;
    }
    else if (url.indexOf("/") === 0) {
      return window.location.protocol + "//" + window.location.host + url;
    } else {          
      return esri._appBaseUrl + url;
    }
  }
  return url;
};
//test cases for the method _getAbsoluteUrl
//call the method in a page, such as http://myserver.com/hello/app.html
//esri._getAbsoluteUrl("http://myserver.com/hello/world.jpg"); it should return "http://myserver.com/hello/world.jpg"
//esri._getAbsoluteUrl("//myserver.com/hello/world.jpg"); it should return "http://myserver.com/hello/world.jpg"
//esri._getAbsoluteUrl("/hey/world.jpg"); it should return "http://myserver.com/hey/world.jpg"
//esri._getAbsoluteUrl("../world.jpg"); it should return "http://myserver.com/world.jpg"
//esri._getAbsoluteUrl("./world.jpg"); it should return "http://myserver.com/hello/world.jpg"
//esri._getAbsoluteUrl("world.jpg"); it should return "http://myserver.com/hello/world.jpg"
//Additionally, it should pass different window.location senario.
//http://myserver.com/
//http://myserver.com/myapp    note: browser will always resolve this as http://myserver.com/myapp/
//http://myserver.com/myapp/   
//http://myserver.com/myapp/test.html
//http://myserver.com/myapp/test.html?f=1&g=2
//http://myserver.com/myapp/test.html?f=/1&g=/?2

esri._getDefaultVisibleLayers = function (infos) {
  //tests:
  //use http://nil:6080/arcgis/rest/services/usa_sde_dynamic/MapServer as an example. The layerInfos is:
  /*[{
        "id":0,
        "name":"USA",
        "parentLayerId":-1,
        "defaultVisibility":true,
        "subLayerIds":[1,
            3,
            4,
            5,
            6,
            7
        ],
        "minScale":0,
        "maxScale":0,
        "declaredClass":"esri.layers.LayerInfo"
    },
    {
        "id":1,
        "name":"countiesAnno",
        "parentLayerId":0,
        "defaultVisibility":false,
        "subLayerIds":[2
        ],
        "minScale":0,
        "maxScale":0,
        "declaredClass":"esri.layers.LayerInfo"
    },
    {
        "id":2,
        "name":"Default",
        "parentLayerId":1,
        "defaultVisibility":true,
        "subLayerIds":null,
        "minScale":0,
        "maxScale":0,
        "declaredClass":"esri.layers.LayerInfo"
    },
    {
        "id":3,
        "name":"wind",
        "parentLayerId":0,
        "defaultVisibility":true,
        "subLayerIds":null,
        "minScale":0,
        "maxScale":0,
        "declaredClass":"esri.layers.LayerInfo"
    },
    {
        "id":4,
        "name":"ushigh",
        "parentLayerId":0,
        "defaultVisibility":true,
        "subLayerIds":null,
        "minScale":0,
        "maxScale":0,
        "declaredClass":"esri.layers.LayerInfo"
    },
    {
        "id":5,
        "name":"counties",
        "parentLayerId":0,
        "defaultVisibility":false,
        "subLayerIds":null,
        "minScale":0,
        "maxScale":0,
        "declaredClass":"esri.layers.LayerInfo"
    },
    {
        "id":6,
        "name":"states",
        "parentLayerId":0,
        "defaultVisibility":true,
        "subLayerIds":null,
        "minScale":0,
        "maxScale":0,
        "declaredClass":"esri.layers.LayerInfo"
    },
    {
        "id":7,
        "name":"sde.SDE.usacatalog",
        "parentLayerId":0,
        "defaultVisibility":true,
        "subLayerIds":null,
        "minScale":0,
        "maxScale":0,
        "declaredClass":"esri.layers.LayerInfo"
    }
  ]*/
  //esri._getDefaultVisibleLayers(layerInfos) === [0, 3, 4, 6, 7];
  var result = [], i;
  if (!infos) {
    return result;
  }
  for (i = 0; i < infos.length; i++) {
    if (infos[i].parentLayerId >= 0 && dojo.indexOf(result, infos[i].parentLayerId) === -1) {
      // layer is not visible if it's parent is not visible
      continue;
    }
    if (infos[i].defaultVisibility) {
      result.push(infos[i].id);
    }
  }
  return result;
};

esri._getLayersForScale = function (scale, infos) {
  //tests:
  //use http://servicesbeta4.esri.com/arcgis/rest/services/Census/MapServer as test sample.
  /*  var map;
      function init() {
        map = new esri.Map("map");
        var usaLayer = new esri.layers.ArcGISDynamicMapServiceLayer("http://servicesbeta4.esri.com/arcgis/rest/services/Census/MapServer");
        map.addLayer(usaLayer);
        dojo.connect(usaLayer, "onLoad", function(layer){
          console.log(esri._getLayerForScale(esri.geometry.getScale(map), layer.layerInfos);
        });
      }
  */
  //When zooming in/out, the results should be different. For example,
  //when mapScale == 73957190.94894394, the result is [2,3,5];
  //when mapScale == 577790.5542889987, the result is [1,2,4,5];
  //when mapScale == 36111.9096430061, the result is [0,1,2,4,5];
  var result = [];
  if (scale > 0 && infos) {
    var i;
    for (i = 0; i < infos.length; i++) {
      if (infos[i].parentLayerId >= 0 && dojo.indexOf(result, infos[i].parentLayerId) === -1) {
        // layer is not in scale range if it's parent is not in scale range
        continue;
      }
      if (infos[i].id >= 0) {
        var isInScaleRange = true,
          maxScale = infos[i].maxScale,
          minScale = infos[i].minScale;
        if (maxScale > 0 || minScale > 0) {
          if (maxScale > 0 && minScale > 0) {
            isInScaleRange = maxScale <= scale && scale <= minScale;
          } else if (maxScale > 0) {
            isInScaleRange = maxScale <= scale;
          } else if (minScale > 0) {
            isInScaleRange = scale <= minScale;
          }
        }
        if (isInScaleRange) {
          result.push(infos[i].id);
        }
      }
    }
  }
  return result;
};    
});

},
'esri/layers/agsdynamic':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/layers/dynamic,esri/layers/agscommon,esri/_time"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.agsdynamic");

dojo.require("esri.layers.dynamic");
dojo.require("esri.layers.agscommon");
dojo.require("esri._time");

dojo.declare("esri.layers.ArcGISDynamicMapServiceLayer", [esri.layers.DynamicMapServiceLayer, esri.layers.ArcGISMapServiceLayer], {
    constructor: function(url, options) {
      var imgParams = options && options.imageParameters,
          dh = dojo.hitch;

      if (imgParams) {
        var ldef = imgParams.layerDefinitions;
        if (ldef) {
          this.setLayerDefinitions(ldef);
        }
        if (imgParams.layerOption === esri.layers.ImageParameters.LAYER_OPTION_SHOW) {
          this.visibleLayers = [].concat(imgParams.layerIds);
        }
      }
      
      this._setIsPNG32 = dh(this, this._setIsPNG32);
      
      this.dpi = (imgParams && imgParams.dpi) || 96;
      this.imageFormat = (imgParams && imgParams.format) || "png8";
      this.imageTransparency = (imgParams && imgParams.transparent === false) ? false : true;
      this._setIsPNG32();
      this.gdbVersion = options && options.gdbVersion;
      this._params.gdbVersion = this.gdbVersion;

      dojo.mixin( this._params,
                  this._url.query,
                  {
                    dpi: this.dpi,
                    transparent: this.imageTransparency,
                    format: this.imageFormat
                  },
                  imgParams ? imgParams.toJson() : {});

      this.getImageUrl = dh(this, this.getImageUrl);
      this._initLayer = dh(this, this._initLayer);
      this._load = dh(this, this._load);
      
      this.useMapImage = options ? options.useMapImage : false;
      if (this.useMapImage) {
        this._imageExportHandler = dh(this, this._imageExportHandler);
      }
      
      this._loadCallback = options && options.loadCallback;
      var resourceInfo = options && options.resourceInfo;
      if (resourceInfo) {
        this._initLayer(resourceInfo);
      }
      else if (arguments[2] === undefined || arguments[2] === false) {
        this._load();
      }
    },

    disableClientCaching: false,
    layerDefinitions: null,
    
    _initLayer: function(response, io) {
      this.inherited(arguments);
      
      if (response.timeInfo) {
          this.timeInfo = new esri.layers.TimeInfo(response.timeInfo);
      }
      
      this.loaded = true;
      this.onLoad(this);
      
      var callback = this._loadCallback;
      if (callback) {
        delete this._loadCallback;
        callback(this);
      }
    },
    
    getImageUrl: function(extent, width, height, callback) {
      var path = this._url.path + "/export?",
          _p = this._params,
          sr = extent.spatialReference.wkid || dojo.toJson(extent.spatialReference.toJson()),
          _errorHandler = this._errorHandler;
      delete _p._ts;

      dojo.mixin( _p,
                  {
                    bbox: extent.xmin + "," + extent.ymin + "," + extent.xmax + "," + extent.ymax, //dojo.toJson(extent.toJson()),
                    bboxSR: sr,
                    imageSR: sr,
                    size: width + "," + height
                  },
                  this.disableClientCaching ? { _ts: new Date().getTime() } : {}
                );

      if (_p.layerDefs) {
        var defs = _p.layerDefs;
        delete _p.layerDefs;
        dojo.mixin(_p, { layerDefs:defs });
      }
      
      var token = (_p.token = this._getToken()),
          requestString = esri._getProxiedUrl(path + dojo.objectToQuery(dojo.mixin({}, _p, { f:"image" })));

      if ((requestString.length > esri.config.defaults.io.postLength) || this.useMapImage) {
        //var _h = this._imageExportHandler;
        
        // we need a reference to this request, so that we
        // we can cancel it if necessary.
        // see also: _onExtentChangeHandler in dynamic.js
        // TODO
        // Ideally, we should let this class completely
        // manage the cancellation, instead of dynamic.js.
        // I'm postponing this effort for another time, as this is
        // an internal affair. In general, we could manage the contract
        // between DynamicMapServiceLayer and its subclasses better, not 
        // just from the user perspective but as a discipline for
        // inter-module contracts (as opposed to magic/dangling assumptions).
        this._jsonRequest = esri.request({
          url: path,
          content: dojo.mixin(_p, { f:"json" }),
          callbackParamName: "callback",
          
          load: function(response, io) {
            var href = response.href;
            
            // 10.1 servers require token to access output directory URLs as well
            if (token) {
              href += (
                href.indexOf("?") === -1 ? 
                  ("?token=" + token) : 
                  ("&token=" + token)
              );
            }
            
            //console.log("token=" + token);
            callback(esri._getProxiedUrl(href));
          },
          
          error: _errorHandler //esri.config.defaults.io.errorHandler //this._errorHandler
        });
      }
      else {
        callback(requestString);
      }
    },
    
    /*_imageExportHandler: function(response, io, callback) {
      callback(esri._getProxiedUrl(response.href));
    },*/

    _setIsPNG32: function() {
      var format = this.imageFormat.toLowerCase();
      var isIE = dojo.isIE;
      this.isPNG32 = isIE && isIE === 6 && (format === "png32" || format === "png24") && this.imageTransparency;
    },
    
    _setTime: function(timeExtent) {
      // This method is a copy of _setTime in dynamic.js.
      // Re-implemented here for the sole purpose of applying
      // the workaround below.
      
      //console.log("testing..");
      var timeInfo = this.timeInfo,
          time = (this._params.time = timeExtent ? timeExtent.toJson().join(",") : null);
      
      // Workaround for server version < 10.02 where "some" time-aware
      // layers do not return a valid image if "time" parameter is absent
      if (this.version < 10.02 && timeInfo) {
        if (!time) {
          // When there is no "time", go ahead and turn
          // time for all sub-layers
          
          var layerInfos = this.layerInfos;
              
          if (layerInfos) {
            var current = this.layerTimeOptions,
                dupOptions = current ? current.slice(0) : [], 
                ids = [];
            
            // Get all the sub-layer ids
            dojo.forEach(layerInfos, function(info) {
              if (!info.subLayerIds) {
                ids.push(info.id);
              }
            });
            //console.log("ids: ", ids);
            
            if (ids.length) {
              // Let's make sure all sub-layers have a corresponding
              // layer time options object
              dojo.forEach(ids, function(id) {
                if (!dupOptions[id]) {
                  var opt = new esri.layers.LayerTimeOptions();
                  opt.useTime = false;
                  dupOptions[id] = opt;
                }
              });
              
              this._params.layerTimeOptions = esri._serializeTimeOptions(dupOptions, ids);
            }
          } // layerInfos
        }
        else {
          // Restore layer time options to user-defined value
          this._params.layerTimeOptions = esri._serializeTimeOptions(this.layerTimeOptions);
        }
      }
      
      // Workaround for server version >= 10.02 where time=null,null
      // will give all the features
      if (this.version >= 10.02 && timeInfo) {
        if (!time && !timeInfo.hasLiveData) {
          this._params.time = "null,null";
        }
        
        // From REST API Reference at 10.1:
        // hasLiveData returns a boolean value. If true, export and identify 
        // operations will default the value for time parameter to be 
        // [<current server time - defaultTimeWindow>, <current server time>]
        // http://nil/rest-docs/mapserver.html
      }
      
      // It is possible that we don't need this workaround beyond
      // 10.02 but not sure if this will be completely fixed at 10.1
    },
    
    setDPI: function(/*Number*/ dpi, /*Boolean?*/ doNotRefresh) {
      this.dpi = (this._params.dpi = dpi);
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },

    setImageFormat: function(/*String*/ format, /*Boolean?*/ doNotRefresh) {
      this.imageFormat = (this._params.format = format);
      this._setIsPNG32();
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setImageTransparency: function(/*Boolean*/ transparent, /*Boolean?*/ doNotRefresh) {
      this.imageTransparency = (this._params.transparent = transparent);
      this._setIsPNG32();
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setVisibleLayers: function(/*Number[]*/ layerIds, /*Boolean?*/ doNotRefresh) {
      this.visibleLayers = layerIds;
      this._params.layers = esri.layers.ImageParameters.LAYER_OPTION_SHOW + ":" + layerIds.join(",");
      this._updateDynamicLayers();
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },

    setDefaultVisibleLayers: function(/*Boolean?*/ doNotRefresh) {
      this.visibleLayers = this._defaultVisibleLayers;
      this._params.layers = null;
      this._updateDynamicLayers();
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setLayerDefinitions: function(/*String[]*/ layerDefinitions, /*Boolean?*/ doNotRefresh) {
      this.layerDefinitions = layerDefinitions;

      this._params.layerDefs = esri._serializeLayerDefinitions(layerDefinitions);
      this._updateDynamicLayers();
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setDefaultLayerDefinitions: function(/*Boolean?*/ doNotRefresh) {
      this.layerDefinitions = this._params.layerDefs = null;
      this._updateDynamicLayers();
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setDisableClientCaching: function(/*boolean*/ caching) {
      this.disableClientCaching = caching;
    },
                  
    setLayerTimeOptions : function(/*esri.layers.LayerTimeOptions*/ layerTimeOptions, /*Boolean?*/ doNotRefresh) {
      this.layerTimeOptions = layerTimeOptions;
      
      /*var layerTimeOptionsArr = [];
      
      dojo.forEach(layerTimeOptions, function(lyrTimeOption, i){
         if (lyrTimeOption) {
             layerTimeOptionsArr.push(i + ":" + lyrTimeOption.toJson());
         }          
      });
                  
      this._params.layerTimeOptions = (layerTimeOptionsArr.length > 0) ? layerTimeOptionsArr.join(",") : null;*/               
      
      this._params.layerTimeOptions = esri._serializeTimeOptions(layerTimeOptions);
      this._updateDynamicLayers();
      
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
            
    refresh: function(/*Boolean?*/ _noCacheOverride) {
      if (_noCacheOverride) {
        this.inherited(arguments);
      }
      else {
        var dc = this.disableClientCaching;
        this.disableClientCaching = true;
        this.inherited(arguments);
        this.disableClientCaching = dc;
      }
    },
    
    /*******************************
    * dynamic layer related methods
    *******************************/
    setLayerDrawingOptions: function(/*array of esri.layers.LayerDrawingOptions*/ layerDrawingOptions, /*Boolean?*/ doNotRefresh) {
      this.layerDrawingOptions = layerDrawingOptions; 
      this._updateDynamicLayers();
      
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setDynamicLayerInfos: function(/*array of esri.layers.DynamicLayerInfo*/ dynamicLayerInfos, /*Boolean?*/ doNotRefresh) {            
      if (dynamicLayerInfos && dynamicLayerInfos.length > 0) {
        this.dynamicLayerInfos = dynamicLayerInfos;
        this.visibleLayers = esri._getDefaultVisibleLayers(dynamicLayerInfos);
      }
      else {
        this.dynamicLayerInfos = this.layerDrawingOptions = null;
      }
      this._updateDynamicLayers();
      
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    createDynamicLayerInfosFromLayerInfos: function () {
      var dynamicLayerInfos = [],
        dynamicLayerInfo,
        mapLayerSource;
      dojo.forEach(this.layerInfos, function (layerInfo, idx) {
        dynamicLayerInfo = new esri.layers.DynamicLayerInfo(layerInfo.toJson());
        dynamicLayerInfo.source = new esri.layers.LayerMapSource({mapLayerId: layerInfo.id});       
        dynamicLayerInfos.push(dynamicLayerInfo);
      });
      return dynamicLayerInfos;
    },
    
    _onDynamicLayersChange: function () {},

    _updateDynamicLayers: function () {
      //only when this.dynamicLayerInfos or this.layerDrawingOptions presents, dynamicLayers need to be sent to server.
      if ((this.dynamicLayerInfos && this.dynamicLayerInfos.length > 0) || (this.layerDrawingOptions && this.layerDrawingOptions.length > 0)) {
        var result,
          infos = this.dynamicLayerInfos || this.layerInfos,
          dynLayerObjs = [],
          mapScale = this._map && esri.geometry.getScale(this._map),
          visibleLayers = this.visibleLayers,
          layersInScale = mapScale ? esri._getLayersForScale(mapScale, infos) : visibleLayers;

        dojo.forEach(infos, function (info) {
          if (!info.subLayerIds) // skip group layers
          {
            var layerId = info.id;
            // if visible and in scale
            if (dojo.indexOf(visibleLayers, layerId) !== -1 && dojo.indexOf(layersInScale, layerId) !== -1) {
              var dynLayerObj = {
                id: layerId
              };
              if (this.dynamicLayerInfos) {
                dynLayerObj.source = info.source && info.source.toJson();
              } else {
                dynLayerObj.source = {
                  type: "mapLayer",
                  mapLayerId: layerId
                };
              }
              var definitionExpression;
              if (this.layerDefinitions && this.layerDefinitions[layerId]) {
                definitionExpression = this.layerDefinitions[layerId];
              }
              if (definitionExpression) {
                dynLayerObj.definitionExpression = definitionExpression;
              }
              var layerDrawingOptions;
              if (this.layerDrawingOptions && this.layerDrawingOptions[layerId]) {
                layerDrawingOptions = this.layerDrawingOptions[layerId];
              }
              if (layerDrawingOptions) {
                dynLayerObj.drawingInfo = layerDrawingOptions.toJson();
              }
              var layerTimeOptions;
              if (this.layerTimeOptions && this.layerTimeOptions[layerId]) {
                layerTimeOptions = this.layerTimeOptions[layerId];
              }
              if (layerTimeOptions) {
                dynLayerObj.layerTimeOptions = layerTimeOptions.toJson();
              }
              dynLayerObjs.push(dynLayerObj);
            }
          }
        }, this);

        result = dojo.toJson(dynLayerObjs);
        //if dynamic layers should not show any layers, for example, if the scale range doesn't allow to draw the layer,
        //then it has to send an array with an empty object to prevent server from drawing the default existing map layers.
        //Note: this is a server bug.
        if (result === "[]") {
          result = "[{}]";
        }
        if (!this._params.dynamicLayers || (this._params.dynamicLayers.length !== result.length || this._params.dynamicLayers !== result)) {
          this._params.dynamicLayers = result;
          this._onDynamicLayersChange(this._params.dynamicLayers);
        }
      }
      else {
        if (this._params.dynamicLayers) {
          this._params.dynamicLayers = null;
          this._onDynamicLayersChange(null);
        }
        else {
          this._params.dynamicLayers = null;
        }
      }
    },

    _onExtentChangeHandler: function (extent, delta, levelChange) {
      if (levelChange) {
        this._updateDynamicLayers();
      }
      this.inherited(arguments);
    },
    
    _setMap: function(map, container, index) {
      this._map = map;
      this._updateDynamicLayers();
      return this.inherited(arguments);
    },
    /*******************************
    * end of dynamic layer related methods
    *******************************/
    
    //From ArcGIS Server 10.1, ExportImage supports gdbVersion
    onGDBVersionChange: function(){},
    
    setGDBVersion: function(/*String*/ gdbVersion, /*Boolean*/doNotRefresh){
      this.gdbVersion = gdbVersion;
      this._params.gdbVersion = gdbVersion;
      this.onGDBVersionChange();
      
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    exportMapImage: function(/*esri.layers.ImageParameters?*/ params, /*function*/ callback) {
      var m = esri.config.defaults.map,
          p = dojo.mixin({ size:m.width + "," + m.height }, this._params, params ? params.toJson(this.normalization) : {}, { f:"json" });
      delete p._ts;

      //FIXME: .NET REST bug where layerDefs needs to be last query param.
      if (p.layerDefs) {
        var defs = p.layerDefs;
        delete p.layerDefs;
        dojo.mixin(p, { layerDefs:defs });
      }
      
      this._exportMapImage(this._url.path + "/export", p, callback);
    }
  }
);

dojo.declare("esri.layers.ImageParameters", null, {
    constructor: function() {
      this.layerDefinitions = [];
      this._bundle = dojo.i18n.getLocalization("esri", "jsapi");
    },
  
    bbox: null,
    extent: null,
    width: null,
    height: null,
    dpi: null,
    format: null,
    imageSpatialReference: null,
    layerOption: null,
    layerIds: null,
    transparent: null,
    timeExtent: null,
    layerTimeOptions: null,

    toJson: function(doNormalize) {
      if (this.bbox) {
        dojo.deprecated(this.declaredClass + " : " + this._bundle.layers.imageParameters.deprecateBBox);
      }

      var bb = this.bbox || this.extent;
      bb = bb && doNormalize && bb._normalize(true);
      
      var layerOption = this.layerOption,
          wkid = bb ? (bb.spatialReference.wkid || dojo.toJson(bb.spatialReference.toJson())) : null,
          imageSR = this.imageSpatialReference,
          json = {
            dpi: this.dpi,
            format: this.format,
            transparent: this.transparent,
            size: (this.width !== null && this.height !== null ? this.width + "," + this.height : null),
            bbox: (bb ? (bb.xmin + "," + bb.ymin + "," + bb.xmax + "," + bb.ymax) : null),
            bboxSR: wkid,
            layers: (layerOption ? layerOption + ":" + this.layerIds.join(",") : null),
            imageSR: (imageSR ? (imageSR.wkid || dojo.toJson(imageSR.toJson())) : wkid)
          };
      
      json.layerDefs = esri._serializeLayerDefinitions(this.layerDefinitions);
     
      var timeExtent = this.timeExtent;
      json.time = timeExtent ? timeExtent.toJson().join(",") : null;
     
      json.layerTimeOptions = esri._serializeTimeOptions(this.layerTimeOptions);
           
      return esri.filter(json, function(value) {
        if (value !== null) {
          return true;
        }
      });
    }
  }
);

dojo.mixin(esri.layers.ImageParameters, {
  LAYER_OPTION_SHOW: "show", LAYER_OPTION_HIDE: "hide", LAYER_OPTION_INCLUDE: "include", LAYER_OPTION_EXCLUDE: "exclude"
});

dojo.declare("esri.layers.MapImage", null, {
    constructor: function(/*Object*/ json) {
      dojo.mixin(this, json);
      this.extent = new esri.geometry.Extent(this.extent);
    }
  }
);
});

},
'dojox/main':function(){
define("dojox/main", ["dojo/_base/kernel"], function(dojo) {
	// module:
	//		dojox/main
	// summary:
	//		The dojox package main module; dojox package is somewhat unusual in that the main module currently just provides an empty object.

	return dojo.dojox;
});
},
'esri/geometry/utils':function(){
// wrapped by build app
define(["dijit","dojo","dojox"], function(dijit,dojo,dojox){
dojo.provide("esri.geometry.utils");

(function () {
  var EG = esri.geometry;
  
  /*****************
   * Public Methods
   *****************/
  
  /*****************************************
   * esri.geometry.normalizeCentralMeridian
   *****************************************/

  EG.normalizeCentralMeridian = function (geometries, geometryService, callback, errorCallback) {
    // Deferred
    var dfd = new dojo.Deferred();
    dfd.addCallbacks(callback, errorCallback);

    var normalizedGeometries = [],
        geometriesToBeCut = [],
        normalizedSR = geometries[0].spatialReference, 
        info = normalizedSR._getInfo(), //input SR
        webMercatorFlag = normalizedSR._isWebMercator(),
        maxX = webMercatorFlag ? 20037508.342788905 : 180,
        minX = webMercatorFlag ? -20037508.342788905 : -180,
        plus180Line = new esri.geometry.Polyline({
          'paths': [
            [
              [maxX, minX],
              [maxX, maxX]
            ]
          ]
        }),
        minus180Line = new esri.geometry.Polyline({
          'paths': [
            [
              [minX, minX],
              [minX, maxX]
            ]
          ]
        }),
        geometryMaxX = 0;  //used to define the maxX for all geometries.  
    
    dojo.forEach(geometries, function (geometry) {
      //first pass through geometries to see if they need to be normalized (shift OR cut and shift).  
      //If geometry type point then offset point if needed.
      //Else If geometry type is multipoint, then offset each point as needed to ensure points between -180 and 180.
      //Else geometry is polyline or polygon, translate geometry if needed so that geometry extent.xmin is within -180 and 180 and then test if geometry extent intersects either -180 or +180
      var newGeometry = esri.geometry.fromJson(dojo.fromJson(dojo.toJson(geometry.toJson()))), //clone geometry.
          geomExtent = geometry.getExtent();

      if (geometry.type === "point") {  //
      
        normalizedGeometries.push(EG._pointNormalization(newGeometry, maxX, minX));
        
      } else if (geometry.type === "multipoint") {
        
        newGeometry.points = dojo.map(newGeometry.points, function(point) {
          return EG._pointNormalization(point, maxX, minX);
        });
        normalizedGeometries.push(newGeometry);
        
      } else if (geometry.type === "extent") {
       
        normalizedGeometries.push(geomExtent._normalize(null, null, info));
        
      } else {  //geometry is polyline or polygon, translate geometry so that geometry extent.xmin is within -180 and 180
      
        var magnitude = EG._offsetMagnitude(geomExtent.xmin,minX),  //magnitude of offset with respect to minX
            offset = magnitude * (2 * maxX);
        newGeometry = (offset === 0) ? newGeometry : EG._updatePolyGeometry(newGeometry, offset);  //offset if needed to bring into range
        geomExtent = geomExtent.offset(offset,0);       
        
        if (geomExtent.intersects(plus180Line) && (geomExtent.xmax !== maxX)) {
          geometryMaxX = (geomExtent.xmax > geometryMaxX) ? geomExtent.xmax : geometryMaxX;  
          newGeometry = EG._prepareGeometryForCut(newGeometry,webMercatorFlag);
          geometriesToBeCut.push(newGeometry); //intersects 180, candidate for cut
          normalizedGeometries.push("cut"); //place holder for cut geometry        
        
        } else if (geomExtent.intersects(minus180Line) && (geomExtent.xmin !== minX)) {
          geometryMaxX = (geomExtent.xmax * (2*maxX) > geometryMaxX) ? geomExtent.xmax * (2*maxX) : geometryMaxX;
          newGeometry = EG._prepareGeometryForCut(newGeometry,webMercatorFlag,360);
          geometriesToBeCut.push(newGeometry); //intersects -180 candidate for cut against 180 cut line after offset
          normalizedGeometries.push("cut"); //place holder for cut geometry        
        
        } else {
          //console.log(newGeometry);
          normalizedGeometries.push(newGeometry);  //geometry is within -180 and +180      
        }
      }
    });

    var cutLineDegrees = new esri.geometry.Polyline(),
        cutCount = EG._offsetMagnitude(geometryMaxX,maxX),  //offset magnitude from maxX defines the number of cut lines needed.
        yLast = -90, count = cutCount;
    while (cutCount > 0) {
      var cutLongitude = -180 + (360 * cutCount);
      cutLineDegrees.addPath([[cutLongitude,yLast],[cutLongitude,yLast * -1]]);
      yLast = yLast * -1;
      cutCount--;
    }
    //console.log(dojo.toJson(cutLineDegrees.toJson()));
    
    // "count" could be 0 if geometryMaxX and maxX are equal
    if (geometriesToBeCut.length > 0 && count > 0) {  //need to call geometry service to cut; after cut operation is done, push features back into normalizedGeometries array
      
      if (geometryService) {
        geometryService.cut(geometriesToBeCut,cutLineDegrees,function(cutResults) {
          geometriesToBeCut = EG._foldCutResults(geometriesToBeCut,cutResults);
          
          var geometriesToBeSimplified = [];
          dojo.forEach(normalizedGeometries, function (normalizedGeometry, i) { //keep order of input geometries
            if (normalizedGeometry === "cut") {
              var newGeometry = geometriesToBeCut.shift();
              
              // The "equals" case in the if condition below happens in the 
              // following scenario:
              // 1. Draw a polygon across the dateline and normalize it, 
              //    resulting in two rings.
              // 2. Move the polygon so that it is contained within -180 and 
              //    +180.
              // 3. Normalize the polygon now. You'll get here after cut 
              //    finished on this polygon.
              
              if ((geometries[i].rings) && (geometries[i].rings.length > 1) && (newGeometry.rings.length >= geometries[i].rings.length)) {  //candidate for simplify if orig geometry is polygon and has more than 1 ring and the new geometry has more ringss than the orig geometry
                normalizedGeometries[i] = "simplify";
                geometriesToBeSimplified.push(newGeometry);
              } else {  //convert back to web mercator if needed and assign to normalizedGeometries array
                normalizedGeometries[i] = (webMercatorFlag === true) ? EG.geographicToWebMercator(newGeometry) : newGeometry;            
              }
            }
          });
          
          if (geometriesToBeSimplified.length > 0) {
            geometryService.simplify(geometriesToBeSimplified,function(simplifiedGeometries) {
              dojo.forEach(normalizedGeometries, function(normalizedGeometry,i) {
                if (normalizedGeometry === "simplify") {
                  normalizedGeometries[i] = (webMercatorFlag === true) ? EG.geographicToWebMercator(simplifiedGeometries.shift()) : simplifiedGeometries.shift();            
                }
              });
              dfd.callback(normalizedGeometries);  //return normalizedGeometries to caller
            }, function(error) {
              dfd.errback(error);
            });
          } else {
            dfd.callback(normalizedGeometries);  //return normalizedGeometries to caller
          }
          
        }, function(error) {
          dfd.errback(error);
        });
        
      } else { // geometryService argument is missing
        dfd.errback(new Error("esri.geometry.normalizeCentralMeridian: 'geometryService' argument is missing."));
      }
      
    } else {
      // It is possible that some geometries were marked for "cut" but are 
      // false positives. 
      // Example: an input polygon that is split on either side of +180 or -180.
      // Let's handle them before returning to the caller.
      dojo.forEach(normalizedGeometries, function (normalizedGeometry, i) {
        if (normalizedGeometry === "cut") {
          var newGeometry = geometriesToBeCut.shift();
          //console.log("False positive: ", newGeometry);
          normalizedGeometries[i] = (webMercatorFlag === true) ? EG.geographicToWebMercator(newGeometry) : newGeometry;
        }
      });
      
      dfd.callback(normalizedGeometries);  //return normalizedGeometries to caller
    }
    
    return dfd;
  };
  
  /********************************
   * esri.geometry.geodesicDensify
   ********************************/

  EG.geodesicDensify = function (geom, maxSegmentLength) {
    //geom must be under WGS84
    var toRad = Math.PI / 180;
    var radius = 6371008.771515059;
    if (maxSegmentLength < radius / 10000) {
      maxSegmentLength = radius / 10000;
    }
    if (!(geom instanceof esri.geometry.Polyline || geom instanceof esri.geometry.Polygon)) {
      var msg = "_geodesicDensify: the input geometry is neither polyline nor polygon";
      console.error(msg);
      throw new Error(msg);
    }
    var isPline = geom instanceof esri.geometry.Polyline,
        iRings = isPline ? geom.paths : geom.rings,
        oRings = [],
        oRing;
    dojo.forEach(iRings, function (ring) {
      oRings.push(oRing = []);
      oRing.push([ring[0][0], ring[0][1]]);
      var lon1, lat1, lon2, lat2, i, j;
      lon1 = ring[0][0] * toRad;
      lat1 = ring[0][1] * toRad;
      for (i = 0; i < ring.length - 1; i++) {
        lon2 = ring[i + 1][0] * toRad;
        lat2 = ring[i + 1][1] * toRad;
        var inverseGeodeticResult = EG._inverseGeodeticSolver(lat1, lon1, lat2, lon2);
        var azimuth = inverseGeodeticResult.azimuth; //radians
        var geodesicDist = inverseGeodeticResult.geodesicDistance; //meters
        var numberOfSegment = geodesicDist / maxSegmentLength;
        if (numberOfSegment > 1) {
          for (j = 1; j <= numberOfSegment - 1; j++) {
            var length = j * maxSegmentLength;
            var pt = EG._directGeodeticSolver(lat1, lon1, azimuth, length);
            oRing.push([pt.x, pt.y]);
          }
          var lastDensifiedLength = (geodesicDist + Math.floor(numberOfSegment - 1) * maxSegmentLength) / 2;
          var lastSecondPt = EG._directGeodeticSolver(lat1, lon1, azimuth, lastDensifiedLength);
          oRing.push([lastSecondPt.x, lastSecondPt.y]);
        }
        var endPt = EG._directGeodeticSolver(lat1, lon1, azimuth, geodesicDist);
        oRing.push([endPt.x, endPt.y]);
        lon1 = endPt.x * toRad;
        lat1 = endPt.y * toRad;
      }
    });
    if (isPline) {
      return new esri.geometry.Polyline({
        paths: oRings,
        spatialReference: geom.spatialReference
      });
    } else {
      return new esri.geometry.Polygon({
        rings: oRings,
        spatialReference: geom.spatialReference
      });
    }
  };
  
  /********************************
   * esri.geometry.geodesicLengths
   ********************************/

  EG.geodesicLengths = function (polylines, lengthUnit) {
    var toRan = Math.PI / 180;
    var lengths = [];
    dojo.forEach(polylines, function (polyline, idx) {
      var length = 0;
      dojo.forEach(polyline.paths, function (path, idx) {
        var subLength = 0;
        var i, lon1, lon2, lat1, lat2, inverseGeodeticResult;
        for (i = 1; i < path.length; i++) {
          lon1 = path[i - 1][0] * toRan;
          lon2 = path[i][0] * toRan;
          lat1 = path[i - 1][1] * toRan;
          lat2 = path[i][1] * toRan;
          inverseGeodeticResult = EG._inverseGeodeticSolver(lat1, lon1, lat2, lon2);
          subLength += inverseGeodeticResult.geodesicDistance / 1609.344; //miles
        }
        length += subLength;
      });
      length *= EG._unitsDictionary[lengthUnit];
      lengths.push(length);
    });
    return lengths;
  };
  
  /********************************
   * esri.geometry.geodesicAreas
   ********************************/

  EG.geodesicAreas = function (polygons, areaUnit) {
    var geodesicDensifiedPolygons = [];
    dojo.forEach(polygons, function (polygon, idx) {
      var geodesicDensifiedPolygon = EG.geodesicDensify(polygon, 10000);
      geodesicDensifiedPolygons.push(geodesicDensifiedPolygon);
    });
    var areas = [];
    var point1, point2;
    dojo.forEach(geodesicDensifiedPolygons, function (polygon, idx) {
      var area = 0;
      dojo.forEach(polygon.rings, function (ring, idx) {
        point1 = EG._toEqualAreaPoint(new esri.geometry.Point(ring[0][0], ring[0][1]));
        point2 = EG._toEqualAreaPoint(new esri.geometry.Point(ring[ring.length - 1][0], ring[ring.length - 1][1]));
        var subArea = point2.x * point1.y - point1.x * point2.y;
        var i;
        for (i = 0; i < ring.length - 1; i++) {
          point1 = EG._toEqualAreaPoint(new esri.geometry.Point(ring[i + 1][0], ring[i + 1][1]));
          point2 = EG._toEqualAreaPoint(new esri.geometry.Point(ring[i][0], ring[i][1]));
          subArea += point2.x * point1.y - point1.x * point2.y;
        }
        subArea /= 4046.87; //acres
        area += subArea;
      });
      area *= EG._unitsDictionary[areaUnit];
      areas.push(area / (-2));
    });
    return areas;
  };

  EG.polygonSelfIntersecting = function (polygon) {
    var i, j, k, m, line1, line2, intersectResult, ringCount = polygon.rings.length;
    
    for (k = 0; k < ringCount; k++) {
      //check if rings cross each other
      for (i = 0; i < polygon.rings[k].length - 1; i++) {
        line1 = [
          [polygon.rings[k][i][0], polygon.rings[k][i][1]],
          [polygon.rings[k][i + 1][0], polygon.rings[k][i + 1][1]]
        ];
        for (j = k + 1; j < ringCount; j++){
          for (m = 0; m < polygon.rings[j].length - 1; m++){
            line2 = [
              [polygon.rings[j][m][0], polygon.rings[j][m][1]],
              [polygon.rings[j][m + 1][0], polygon.rings[j][m + 1][1]]
            ];
            intersectResult = esri.geometry._getLineIntersection2(line1, line2);
            if (intersectResult) {
              //in case the intersecting point is the start/end point of the compared lines
            if(!((intersectResult[0] === line1[0][0] && intersectResult[1] === line1[0][1]) ||
               (intersectResult[0] === line2[0][0] && intersectResult[1] === line2[0][1]) ||
               (intersectResult[0] === line1[1][0] && intersectResult[1] === line1[1][1]) ||
               (intersectResult[0] === line2[1][0] && intersectResult[1] === line2[1][1]))){
              return true;
            }
            }            
          }
        }
      }
      //check if the ring self intersecting
      var vertexCount = polygon.rings[k].length;
      if (vertexCount <= 4) {
        // the ring is a triangle
        continue;
      }
      for (i = 0; i < vertexCount - 3; i++) {
        var compareLineCount = vertexCount - 1;
        if (i === 0) {
          compareLineCount = vertexCount - 2;
        }
        line1 = [
          [polygon.rings[k][i][0], polygon.rings[k][i][1]],
          [polygon.rings[k][i + 1][0], polygon.rings[k][i + 1][1]]
        ];
        for (j = i + 2; j < compareLineCount; j++) {
          line2 = [
            [polygon.rings[k][j][0], polygon.rings[k][j][1]],
            [polygon.rings[k][j + 1][0], polygon.rings[k][j + 1][1]]
          ];
          intersectResult = esri.geometry._getLineIntersection2(line1, line2);
          if (intersectResult) {
            //in case the intersecting point is the start/end point of the compared lines
            if(!((intersectResult[0] === line1[0][0] && intersectResult[1] === line1[0][1]) ||
               (intersectResult[0] === line2[0][0] && intersectResult[1] === line2[0][1]) ||
               (intersectResult[0] === line1[1][0] && intersectResult[1] === line1[1][1]) ||
               (intersectResult[0] === line2[1][0] && intersectResult[1] === line2[1][1]))){
              return true;
            }
          }
        }
      }
    }
    return false;
  };

  /*******************
   * Internal Methods
   *******************/
  
  /***********************************
   * normalizeCentralMeridian Helpers
   ***********************************/
 
  EG._foldCutResults = function(geometries,cutResults) {
    var currentGeometryIndex = -1;
    dojo.forEach(cutResults.cutIndexes, function(cutIndex, i) {
      var currentGeometry = cutResults.geometries[i];
      var geometryParts = currentGeometry.rings || currentGeometry.paths;

      dojo.forEach(geometryParts, function(points, geometryPartIndex) {
        dojo.some(points,function(point) {  //test if geometry part is to the right of 180, if so then shift to bring within -180 and +180
          /*if (point[0] === (180 + (offsetMagnitude * 360))) {  //point is equal to either 180, 540, 900, etc.  need to test next point
            return false;  //continue test
          } else*/ 
          
          if (point[0] < 180) {
            return true;  //geometry doesn't need to be shifted; exit out of function
          } else {  //point should be shifted.  Use offsetMagnitude to determine offset.
          
            var partMaxX = 0, j, jl = points.length, ptX;
            for (j = 0; j < jl; j++) {
              ptX = points[j][0];
              partMaxX = ptX > partMaxX ? ptX : partMaxX;
            }
            
            var offsetMagnitude = EG._offsetMagnitude(partMaxX,180),
                offsetX = offsetMagnitude * -360,
                pointIndex, pointsLength = points.length;
            
            for (pointIndex = 0; pointIndex < pointsLength; pointIndex++) {
              var currentPoint = currentGeometry.getPoint(geometryPartIndex, pointIndex);
              currentGeometry.setPoint(geometryPartIndex,pointIndex,currentPoint.offset(offsetX,0));
            }

            return true;  //exit out of function
          }      
        });  //end points array.some 
      });  //end geometryPart loop
      
      //cut geometry is either added to geometries array as a new geometry or it is added as a new ring/path to the existing geometry.  
      if (cutIndex === currentGeometryIndex) {  //cut index is equal to current geometry index; add geometry to existing geometry as new rings
        if (currentGeometry.rings) {  //polygon
          dojo.forEach(currentGeometry.rings, function(ring,j) {  //each ring in cut geometry should be added to existing geometry
            geometries[cutIndex] = geometries[cutIndex].addRing(ring);
          });
        } else { //polyline
          dojo.forEach(currentGeometry.paths, function(path,j) {  //each path in cut geometry should be added to existing geometry
            geometries[cutIndex] = geometries[cutIndex].addPath(path);
          });        
        }
      } else {  //new geometry; add to geometries array.
        currentGeometryIndex = cutIndex;
        geometries[cutIndex] = currentGeometry;
      }
    });
    return geometries;
  };


  EG._prepareGeometryForCut = function(geometry,mercatorFlag,offsetX) {  //prepares geometry for projection input.
    var densifiedMaxSegementLength = 1000000;  //1000km max segment length.  Should this be configurable?
    if (mercatorFlag) {  //densify and conver to wgs84 if coord system is web mercator.  Call webMercatorToGeographic with flag that keeps coordinates in linear space (x can be greater than 180 or less than -180
      var densifiedGeometry = EG._straightLineDensify(geometry,densifiedMaxSegementLength);
      geometry = EG.webMercatorToGeographic(densifiedGeometry,true);
    }
    if (offsetX) {  //offset geometry if defined
      geometry = EG._updatePolyGeometry(geometry, offsetX);
    }
    return geometry;
  };

  EG._offsetMagnitude = function(xCoord,offsetFromX) {  //takes xCoord and computes offsetMagnitude with respect to offsetFromX value   
    return Math.ceil((xCoord - offsetFromX) / (offsetFromX * 2));
  };
  
  EG._pointNormalization = function (point, maxX, minX) {
    var pointX = point.x || point[0];  //point or multipoint
    var offsetMagnitude;
    if (pointX > maxX) {
      offsetMagnitude = EG._offsetMagnitude(pointX,maxX); 
      if (point.x) {
        point = point.offset(offsetMagnitude * (-2 * maxX),0);
      } else {
        point[0] = pointX + (offsetMagnitude * (-2 * maxX));
      }
    } else if (pointX < minX) {
      offsetMagnitude = EG._offsetMagnitude(pointX,minX);  
      if (point.x) {
        point = point.offset(offsetMagnitude * (-2 * minX),0);
      } else {
        point[0] = pointX + (offsetMagnitude * (-2 * minX));
      }
    }
    //console.log(point);
    return point;
  };

  EG._updatePolyGeometry = function (geometry, offsetX) {  //transforms polyline or polygon geometry types
    var geometryParts = geometry.paths || geometry.rings,
        i, j, il = geometryParts.length, jl;
        
    for (i = 0; i < il; i++) {
      var geometryPart = geometryParts[i];
      jl = geometryPart.length;
      
      for (j = 0; j < jl; j++) {
        var currentPoint = geometry.getPoint(i, j);
        geometry.setPoint(i,j,currentPoint.offset(offsetX,0));
      }
    }
    return geometry;
  };

  EG._straightLineDensify = function (geom, maxSegmentLength) {
    if (!(geom instanceof esri.geometry.Polyline || geom instanceof esri.geometry.Polygon)) {
      var msg = "_straightLineDensify: the input geometry is neither polyline nor polygon";
      console.error(msg);
      throw new Error(msg);
    }
    var isPline = geom instanceof esri.geometry.Polyline,
        iRings = isPline ? geom.paths : geom.rings,
        oRings = [],
        oRing;
    dojo.forEach(iRings, function (ring) {
      oRings.push(oRing = []);
      oRing.push([ring[0][0], ring[0][1]]);
      var x1, y1, x2, y2;
      var i, j, straightLineDist, sinAlpha, cosAlpha, numberOfSegment, xj, yj;
      for (i = 0; i < ring.length - 1; i++) {
        x1 = ring[i][0];
        y1 = ring[i][1];
        x2 = ring[i + 1][0];
        y2 = ring[i + 1][1];
        straightLineDist = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        sinAlpha = (y2 - y1) / straightLineDist;
        cosAlpha = (x2 - x1) / straightLineDist;
        numberOfSegment = straightLineDist / maxSegmentLength;
        if (numberOfSegment > 1) {
          for (j = 1; j <= numberOfSegment - 1; j++) {
            var length = j * maxSegmentLength;
            xj = cosAlpha * length + x1;
            yj = sinAlpha * length + y1;
            oRing.push([xj, yj]);
          }
          //the last segment which is longer than the max, but shorter than 2*max
          //devide it in the middle to prevent the result of a very small segment          
          var lastDensifiedLength = (straightLineDist + Math.floor(numberOfSegment - 1) * maxSegmentLength) / 2;
          xj = cosAlpha * lastDensifiedLength + x1;
          yj = sinAlpha * lastDensifiedLength + y1;
          oRing.push([xj, yj]);
        }
        //add the end of the original segment
        oRing.push([x2, y2]);
      }
    });
    if (isPline) {
      return new esri.geometry.Polyline({
        paths: oRings,
        spatialReference: geom.spatialReference
      });
    } else {
      return new esri.geometry.Polygon({
        rings: oRings,
        spatialReference: geom.spatialReference
      });
    }
  };

  /*// This logic can be moved into normalizeCentralMerdian method
  EG._normalizeGeometries = function(geometries) {
    var geometryService = esri.config.defaults.geometryService;
    
    if (geometries && geometries.length && geometryService) {
      var sr = geometries[0].spatialReference;
      if (sr && sr._isWrappable()) {
        return esri.geometry.normalizeCentralMeridian(geometries, geometryService);
      }
    }
  };*/
  
  EG._unitsDictionary = {
    //length unit conversion from miles
    "esriMiles": 1,
    "esriKilometers": 1.609344,
    "esriFeet": 5280,
    "esriMeters": 1609.34,
    "esriYards": 1760,
    "esriNauticalMiles": 0.869,
    "esriCentimeters": 160934,
    "esriDecimeters": 16093.4,
    "esriInches": 63360,
    "esriMillimeters": 1609340,    
    //area unit conversion from acres
    "esriAcres": 1,
    "esriAres": 40.4685642,
    "esriSquareKilometers": 0.00404685642,
    "esriSquareMiles": 0.0015625,
    "esriSquareFeet": 43560,
    "esriSquareMeters": 4046.85642,
    "esriHectares": 0.404685642,
    "esriSquareYards": 4840,
    "esriSquareInches": 6272640,
    "esriSquareMillimeters": 4046856420,
    "esriSquareCentimeters": 40468564.2,
    "esriSquareDecimeters": 404685.642
  };

  EG._toEqualAreaPoint = function (pt) {
    var toRad = Math.PI / 180;
    var a = 6378137;
    var eSq = 0.00669437999019741354678198566736,
        e = 0.08181919084296430236105472696748;
    var sinY = Math.sin(pt.y * toRad);
    var q = (1 - eSq) * ((sinY / (1 - eSq * (sinY * sinY)) - (1 / (2 * e)) * Math.log((1 - e * sinY) / (1 + e * sinY))));
    var x = a * pt.x * toRad;
    var y = a * q * 0.5;
    var equalAreaCynlindricalProjectedPt = new esri.geometry.Point(x, y);
    return equalAreaCynlindricalProjectedPt;
  };
  
  /**************************
   * geodesicDensify Helpers
   **************************/

  EG._directGeodeticSolver = function ( /*radians*/ lat1, /*radians*/ lon1, /*radians*/ alpha1, /*meters*/ s) {
    var a = 6378137,
        b = 6356752.31424518,
        f = 1 / 298.257223563; // WGS84 ellipsoid params
    var sinAlpha1 = Math.sin(alpha1);
    var cosAlpha1 = Math.cos(alpha1);
    var tanU1 = (1 - f) * Math.tan(lat1);
    var cosU1 = 1 / Math.sqrt((1 + tanU1 * tanU1)),
        sinU1 = tanU1 * cosU1;
    var sigma1 = Math.atan2(tanU1, cosAlpha1);
    var sinAlpha = cosU1 * sinAlpha1;
    var cosSqAlpha = 1 - sinAlpha * sinAlpha;
    var uSq = cosSqAlpha * (a * a - b * b) / (b * b);
    var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    var sigma = s / (b * A),
        sigmaP = 2 * Math.PI;
    var sinSigma, cosSigma, cos2SigmaM;
    while (Math.abs(sigma - sigmaP) > 1e-12) {
      cos2SigmaM = Math.cos(2 * sigma1 + sigma);
      sinSigma = Math.sin(sigma);
      cosSigma = Math.cos(sigma);
      var deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
      sigmaP = sigma;
      sigma = s / (b * A) + deltaSigma;
    }
    var tmp = sinU1 * sinSigma - cosU1 * cosSigma * cosAlpha1;
    var lat2 = Math.atan2(sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1, (1 - f) * Math.sqrt(sinAlpha * sinAlpha + tmp * tmp));
    var lambda = Math.atan2(sinSigma * sinAlpha1, cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1);
    var C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    var L = lambda - (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    //var revAz = Math.atan2(sinAlpha, -tmp); // final bearing
    var lat2Deg = lat2 / (Math.PI / 180);
    var lon2Deg = (lon1 + L) / (Math.PI / 180);
    var pt = new esri.geometry.Point(lon2Deg, lat2Deg, new esri.SpatialReference({
      wkid: 4326
    }));
    return pt;
  };

  EG._inverseGeodeticSolver = function ( /*radians*/ lat1, /*radians*/ lon1, /*radians*/ lat2, /*radians*/ lon2) {
    var a = 6378137,
        b = 6356752.31424518,
        f = 1 / 298.257223563; // WGS84 ellipsoid params
    var L = (lon2 - lon1);
    var U1 = Math.atan((1 - f) * Math.tan(lat1));
    var U2 = Math.atan((1 - f) * Math.tan(lat2));
    var sinU1 = Math.sin(U1),
        cosU1 = Math.cos(U1);
    var sinU2 = Math.sin(U2),
        cosU2 = Math.cos(U2);
    var lambda = L,
        lambdaP, iterLimit = 1000;
    var cosSqAlpha, sinSigma, cos2SigmaM, cosSigma, sigma;
    do {
      var sinLambda = Math.sin(lambda),
          cosLambda = Math.cos(lambda);
      sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
      if (sinSigma === 0) {
        return 0;
      }
      cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
      sigma = Math.atan2(sinSigma, cosSigma);
      var sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
      cosSqAlpha = 1 - sinAlpha * sinAlpha;
      cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
      if (isNaN(cos2SigmaM)) {
        cos2SigmaM = 0;
      }
      var C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
      lambdaP = lambda;
      lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    }
    while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);
    if (iterLimit === 0) {
      //return NaN;
      //As Vincenty pointed out, when two points are nearly antipodal, the formula may not converge
      //It's time to switch to other formula, which may not as highly accurate as Vincenty's. Just for the special case.
      //Here implements Haversine formula
      var haversine_R = 6371009; // km
      var haversine_d = Math.acos(Math.sin(lat1)*Math.sin(lat2) + Math.cos(lat1)*Math.cos(lat2) * Math.cos(lon2-lon1)) * haversine_R;
      var dLon = lon2-lon1; 
      var y = Math.sin(dLon) * Math.cos(lat2);
      var x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
      var brng = Math.atan2(y, x);
      return {"azimuth": brng, "geodesicDistance": haversine_d};
    }
    var uSq = cosSqAlpha * (a * a - b * b) / (b * b);
    var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    var deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
    var s = b * A * (sigma - deltaSigma);
    var alpha1 = Math.atan2(cosU2 * Math.sin(lambda), cosU1 * sinU2 - sinU1 * cosU2 * Math.cos(lambda));
    var alpha2 = Math.atan2(cosU1 * Math.sin(lambda), cosU1 * sinU2 * Math.cos(lambda) - sinU1 * cosU2);
    var inverseResult = {
      azimuth: alpha1,
      geodesicDistance: s,
      reverseAzimuth: alpha2
    };
    return inverseResult;
  };
  
}()); // end of module anonymous
});

},
'dojox/xml/parser':function(){
define("dojox/xml/parser", ['dojo/_base/kernel', 'dojo/_base/lang', 'dojo/_base/array', 'dojo/_base/window', 'dojo/_base/sniff'], function(dojo){

dojo.getObject("xml.parser", true, dojox);

//DOM type to int value for reference.
//Ints make for more compact code than full constant names.
//ELEMENT_NODE                  = 1;
//ATTRIBUTE_NODE                = 2;
//TEXT_NODE                     = 3;
//CDATA_SECTION_NODE            = 4;
//ENTITY_REFERENCE_NODE         = 5;
//ENTITY_NODE                   = 6;
//PROCESSING_INSTRUCTION_NODE   = 7;
//COMMENT_NODE                  = 8;
//DOCUMENT_NODE                 = 9;
//DOCUMENT_TYPE_NODE            = 10;
//DOCUMENT_FRAGMENT_NODE        = 11;
//NOTATION_NODE                 = 12;

dojox.xml.parser.parse = function(/*String?*/ str, /*String?*/ mimetype){
	//	summary:
	//		cross-browser implementation of creating an XML document object from null, empty string, and XML text..
	//
	//	str:
	//		Optional text to create the document from.  If not provided, an empty XML document will be created.
	//		If str is empty string "", then a new empty document will be created.
	//	mimetype:
	//		Optional mimetype of the text.  Typically, this is text/xml.  Will be defaulted to text/xml if not provided.
	var _document = dojo.doc;
	var doc;

	mimetype = mimetype || "text/xml";
	if(str && dojo.trim(str) && "DOMParser" in dojo.global){
		//Handle parsing the text on Mozilla based browsers etc..
		var parser = new DOMParser();
		doc = parser.parseFromString(str, mimetype);
		var de = doc.documentElement;
		var errorNS = "http://www.mozilla.org/newlayout/xml/parsererror.xml";
		if(de.nodeName == "parsererror" && de.namespaceURI == errorNS){
			var sourceText = de.getElementsByTagNameNS(errorNS, 'sourcetext')[0];
			if(sourceText){
				sourceText = sourceText.firstChild.data;
			}
        	throw new Error("Error parsing text " + de.firstChild.data + " \n" + sourceText);
		}
		return doc;

	}else if("ActiveXObject" in dojo.global){
		//Handle IE.
		var ms = function(n){ return "MSXML" + n + ".DOMDocument"; };
		var dp = ["Microsoft.XMLDOM", ms(6), ms(4), ms(3), ms(2)];
		dojo.some(dp, function(p){
			try{
				doc = new ActiveXObject(p);
			}catch(e){ return false; }
			return true;
		});
		if(str && doc){
			doc.async = false;
			doc.loadXML(str);
			var pe = doc.parseError;
			if(pe.errorCode !== 0){
				throw new Error("Line: " + pe.line + "\n" +
					"Col: " + pe.linepos + "\n" +
					"Reason: " + pe.reason + "\n" +
					"Error Code: " + pe.errorCode + "\n" +
					"Source: " + pe.srcText);
			}
		}
		if(doc){
			return doc; //DOMDocument
		}
	}else if(_document.implementation && _document.implementation.createDocument){
		if(str && dojo.trim(str) && _document.createElement){
			//Everyone else that we couldn't get to work.  Fallback case.
			// FIXME: this may change all tags to uppercase!
			var tmp = _document.createElement("xml");
			tmp.innerHTML = str;
			var xmlDoc = _document.implementation.createDocument("foo", "", null);
			dojo.forEach(tmp.childNodes, function(child){
				xmlDoc.importNode(child, true);
			});
			return xmlDoc;	//	DOMDocument
		}else{
			return _document.implementation.createDocument("", "", null); // DOMDocument
		}
	}
	return null;	//	null
};

dojox.xml.parser.textContent = function(/*Node*/node, /*String?*/text){
	//	summary:
	//		Implementation of the DOM Level 3 attribute; scan node for text
	//	description:
	//		Implementation of the DOM Level 3 attribute; scan node for text
	//		This function can also update the text of a node by replacing all child
	//		content of the node.
	//	node:
	//		The node to get the text off of or set the text on.
	//	text:
	//		Optional argument of the text to apply to the node.
	if(arguments.length>1){
		var _document = node.ownerDocument || dojo.doc;  //Preference is to get the node owning doc first or it may fail
		dojox.xml.parser.replaceChildren(node, _document.createTextNode(text));
		return text;	//	String
	}else{
		if(node.textContent !== undefined){ //FF 1.5 -- remove?
			return node.textContent;	//	String
		}
		var _result = "";
		if(node){
			dojo.forEach(node.childNodes, function(child){
				switch(child.nodeType){
					case 1: // ELEMENT_NODE
					case 5: // ENTITY_REFERENCE_NODE
						_result += dojox.xml.parser.textContent(child);
						break;
					case 3: // TEXT_NODE
					case 2: // ATTRIBUTE_NODE
					case 4: // CDATA_SECTION_NODE
						_result += child.nodeValue;
				}
			});
		}
		return _result;	//	String
	}
};

dojox.xml.parser.replaceChildren = function(/*Element*/node, /*Node || Array*/ newChildren){
	//	summary:
	//		Removes all children of node and appends newChild. All the existing
	//		children will be destroyed.
	//	description:
	//		Removes all children of node and appends newChild. All the existing
	//		children will be destroyed.
	// 	node:
	//		The node to modify the children on
	//	newChildren:
	//		The children to add to the node.  It can either be a single Node or an
	//		array of Nodes.
	var nodes = [];

	if(dojo.isIE){
		dojo.forEach(node.childNodes, function(child){
			nodes.push(child);
		});
	}

	dojox.xml.parser.removeChildren(node);
	dojo.forEach(nodes, dojo.destroy);

	if(!dojo.isArray(newChildren)){
		node.appendChild(newChildren);
	}else{
		dojo.forEach(newChildren, function(child){
			node.appendChild(child);
		});
	}
};

dojox.xml.parser.removeChildren = function(/*Element*/node){
	//	summary:
	//		removes all children from node and returns the count of children removed.
	//		The children nodes are not destroyed. Be sure to call dojo.destroy on them
	//		after they are not used anymore.
	//	node:
	//		The node to remove all the children from.
	var count = node.childNodes.length;
	while(node.hasChildNodes()){
		node.removeChild(node.firstChild);
	}
	return count; // int
};


dojox.xml.parser.innerXML = function(/*Node*/node){
	//	summary:
	//		Implementation of MS's innerXML function.
	//	node:
	//		The node from which to generate the XML text representation.
	if(node.innerXML){
		return node.innerXML;	//	String
	}else if(node.xml){
		return node.xml;		//	String
	}else if(typeof XMLSerializer != "undefined"){
		return (new XMLSerializer()).serializeToString(node);	//	String
	}
	return null;
};

return dojox.xml.parser;

});

},
'dojox/collections/ArrayList':function(){
define("dojox/collections/ArrayList", ["dojo/_base/kernel", "dojo/_base/array", "./_base"], function(dojo, darray, dxc){
/*=====
var dxc = dojox.collections;
=====*/
	dxc.ArrayList=function(/* array? */arr){
		//	summary
		//	Returns a new object of type dojox.collections.ArrayList
		var items=[];
		if(arr) items=items.concat(arr);
		this.count=items.length;
		this.add=function(/* object */obj){
			//	summary
			//	Add an element to the collection.
			items.push(obj);
			this.count=items.length;
		};
		this.addRange=function(/* array */a){
			//	summary
			//	Add a range of objects to the ArrayList
			if(a.getIterator){
				var e=a.getIterator();
				while(!e.atEnd()){
					this.add(e.get());
				}
				this.count=items.length;
			}else{
				for(var i=0; i<a.length; i++){
					items.push(a[i]);
				}
				this.count=items.length;
			}
		};
		this.clear=function(){
			//	summary
			//	Clear all elements out of the collection, and reset the count.
			items.splice(0, items.length);
			this.count=0;
		};
		this.clone=function(){
			//	summary
			//	Clone the array list
			return new dxc.ArrayList(items);	//	dojox.collections.ArrayList
		};
		this.contains=function(/* object */obj){
			//	summary
			//	Check to see if the passed object is a member in the ArrayList
			for(var i=0; i < items.length; i++){
				if(items[i] == obj) {
					return true;	//	bool
				}
			}
			return false;	//	bool
		};
		this.forEach=function(/* function */ fn, /* object? */ scope){
			//	summary
			//	functional iterator, following the mozilla spec.
			dojo.forEach(items, fn, scope);
		};
		this.getIterator=function(){
			//	summary
			//	Get an Iterator for this object
			return new dxc.Iterator(items);	//	dojox.collections.Iterator
		};
		this.indexOf=function(/* object */obj){
			//	summary
			//	Return the numeric index of the passed object; will return -1 if not found.
			for(var i=0; i < items.length; i++){
				if(items[i] == obj) {
					return i;	//	int
				}
			}
			return -1;	// int
		};
		this.insert=function(/* int */ i, /* object */ obj){
			//	summary
			//	Insert the passed object at index i
			items.splice(i,0,obj);
			this.count=items.length;
		};
		this.item=function(/* int */ i){
			//	summary
			//	return the element at index i
			return items[i];	//	object
		};
		this.remove=function(/* object */obj){
			//	summary
			//	Look for the passed object, and if found, remove it from the internal array.
			var i=this.indexOf(obj);
			if(i >=0) {
				items.splice(i,1);
			}
			this.count=items.length;
		};
		this.removeAt=function(/* int */ i){
			//	summary
			//	return an array with function applied to all elements
			items.splice(i,1);
			this.count=items.length;
		};
		this.reverse=function(){
			//	summary
			//	Reverse the internal array
			items.reverse();
		};
		this.sort=function(/* function? */ fn){
			//	summary
			//	sort the internal array
			if(fn){
				items.sort(fn);
			}else{
				items.sort();
			}
		};
		this.setByIndex=function(/* int */ i, /* object */ obj){
			//	summary
			//	Set an element in the array by the passed index.
			items[i]=obj;
			this.count=items.length;
		};
		this.toArray=function(){
			//	summary
			//	Return a new array with all of the items of the internal array concatenated.
			return [].concat(items);
		}
		this.toString=function(/* string */ delim){
			//	summary
			//	implementation of toString, follows [].toString();
			return items.join((delim||","));
		};
	};
	return dxc.ArrayList;
});

},
'dojox/collections/_base':function(){
define("dojox/collections/_base", ["dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/array"], 
  function(dojo, lang, arr){
	var collections = lang.getObject("dojox.collections", true);

/*=====
	collections = dojox.collections;
=====*/

	collections.DictionaryEntry=function(/* string */k, /* object */v){
		//	summary
		//	return an object of type dojox.collections.DictionaryEntry
		this.key=k;
		this.value=v;
		this.valueOf=function(){
			return this.value; 	//	object
		};
		this.toString=function(){
			return String(this.value);	//	string
		};
	}

	/*	Iterators
	 *	The collections.Iterators (Iterator and DictionaryIterator) are built to
	 *	work with the Collections included in this module.  However, they *can*
	 *	be used with arrays and objects, respectively, should one choose to do so.
	 */
	collections.Iterator=function(/* array */a){
		//	summary
		//	return an object of type dojox.collections.Iterator
		var position=0;
		this.element=a[position]||null;
		this.atEnd=function(){
			//	summary
			//	Test to see if the internal cursor has reached the end of the internal collection.
			return (position>=a.length);	//	bool
		};
		this.get=function(){
			//	summary
			//	Get the next member in the collection.
			if(this.atEnd()){
				return null;		//	object
			}
			this.element=a[position++];
			return this.element;	//	object
		};
		this.map=function(/* function */fn, /* object? */scope){
			//	summary
			//	Functional iteration with optional scope.
			return arr.map(a, fn, scope);
		};
		this.reset=function(){
			//	summary
			//	reset the internal cursor.
			position=0;
			this.element=a[position];
		};
	}

	/*	Notes:
	 *	The DictionaryIterator no longer supports a key and value property;
	 *	the reality is that you can use this to iterate over a JS object
	 *	being used as a hashtable.
	 */
	collections.DictionaryIterator=function(/* object */obj){
		//	summary
		//	return an object of type dojox.collections.DictionaryIterator
		var a=[];	//	Create an indexing array
		var testObject={};
		for(var p in obj){
			if(!testObject[p]){
				a.push(obj[p]);	//	fill it up
			}
		}
		var position=0;
		this.element=a[position]||null;
		this.atEnd=function(){
			//	summary
			//	Test to see if the internal cursor has reached the end of the internal collection.
			return (position>=a.length);	//	bool
		};
		this.get=function(){
			//	summary
			//	Get the next member in the collection.
			if(this.atEnd()){
				return null;		//	object
			}
			this.element=a[position++];
			return this.element;	//	object
		};
		this.map=function(/* function */fn, /* object? */scope){
			//	summary
			//	Functional iteration with optional scope.
			return arr.map(a, fn, scope);
		};
		this.reset=function() {
			//	summary
			//	reset the internal cursor.
			position=0;
			this.element=a[position];
		};
	};

	return collections;
});

},
'dojo/_base/url':function(){
define(["./kernel"], function(dojo) {
	// module:
	//		dojo/url
	// summary:
	//		This module contains dojo._Url

	var
		ore = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?$"),
		ire = new RegExp("^((([^\\[:]+):)?([^@]+)@)?(\\[([^\\]]+)\\]|([^\\[:]*))(:([0-9]+))?$"),
		_Url = function(){
			var n = null,
				_a = arguments,
				uri = [_a[0]];
			// resolve uri components relative to each other
			for(var i = 1; i<_a.length; i++){
				if(!_a[i]){ continue; }

				// Safari doesn't support this.constructor so we have to be explicit
				// FIXME: Tracked (and fixed) in Webkit bug 3537.
				//		http://bugs.webkit.org/show_bug.cgi?id=3537
				var relobj = new _Url(_a[i]+""),
					uriobj = new _Url(uri[0]+"");

				if(
					relobj.path == "" &&
					!relobj.scheme &&
					!relobj.authority &&
					!relobj.query
				){
					if(relobj.fragment != n){
						uriobj.fragment = relobj.fragment;
					}
					relobj = uriobj;
				}else if(!relobj.scheme){
					relobj.scheme = uriobj.scheme;

					if(!relobj.authority){
						relobj.authority = uriobj.authority;

						if(relobj.path.charAt(0) != "/"){
							var path = uriobj.path.substring(0,
								uriobj.path.lastIndexOf("/") + 1) + relobj.path;

							var segs = path.split("/");
							for(var j = 0; j < segs.length; j++){
								if(segs[j] == "."){
									// flatten "./" references
									if(j == segs.length - 1){
										segs[j] = "";
									}else{
										segs.splice(j, 1);
										j--;
									}
								}else if(j > 0 && !(j == 1 && segs[0] == "") &&
									segs[j] == ".." && segs[j-1] != ".."){
									// flatten "../" references
									if(j == (segs.length - 1)){
										segs.splice(j, 1);
										segs[j - 1] = "";
									}else{
										segs.splice(j - 1, 2);
										j -= 2;
									}
								}
							}
							relobj.path = segs.join("/");
						}
					}
				}

				uri = [];
				if(relobj.scheme){
					uri.push(relobj.scheme, ":");
				}
				if(relobj.authority){
					uri.push("//", relobj.authority);
				}
				uri.push(relobj.path);
				if(relobj.query){
					uri.push("?", relobj.query);
				}
				if(relobj.fragment){
					uri.push("#", relobj.fragment);
				}
			}

			this.uri = uri.join("");

			// break the uri into its main components
			var r = this.uri.match(ore);

			this.scheme = r[2] || (r[1] ? "" : n);
			this.authority = r[4] || (r[3] ? "" : n);
			this.path = r[5]; // can never be undefined
			this.query = r[7] || (r[6] ? "" : n);
			this.fragment	 = r[9] || (r[8] ? "" : n);

			if(this.authority != n){
				// server based naming authority
				r = this.authority.match(ire);

				this.user = r[3] || n;
				this.password = r[4] || n;
				this.host = r[6] || r[7]; // ipv6 || ipv4
				this.port = r[9] || n;
			}
		};
	_Url.prototype.toString = function(){ return this.uri; };

	return dojo._Url = _Url;
});

},
'dijit/registry':function(){
define("dijit/registry", [
	"dojo/_base/array", // array.forEach array.map
	"dojo/_base/sniff", // has("ie")
	"dojo/_base/unload", // unload.addOnWindowUnload
	"dojo/_base/window", // win.body
	"."	// dijit._scopeName
], function(array, has, unload, win, dijit){

	// module:
	//		dijit/registry
	// summary:
	//		Registry of existing widget on page, plus some utility methods.
	//		Must be accessed through AMD api, ex:
	//		require(["dijit/registry"], function(registry){ registry.byId("foo"); })

	var _widgetTypeCtr = {}, hash = {};

	var registry =  {
		// summary:
		//		A set of widgets indexed by id

		length: 0,

		add: function(/*dijit._Widget*/ widget){
			// summary:
			//		Add a widget to the registry. If a duplicate ID is detected, a error is thrown.
			//
			// widget: dijit._Widget
			//		Any dijit._Widget subclass.
			if(hash[widget.id]){
				throw new Error("Tried to register widget with id==" + widget.id + " but that id is already registered");
			}
			hash[widget.id] = widget;
			this.length++;
		},

		remove: function(/*String*/ id){
			// summary:
			//		Remove a widget from the registry. Does not destroy the widget; simply
			//		removes the reference.
			if(hash[id]){
				delete hash[id];
				this.length--;
			}
		},

		byId: function(/*String|Widget*/ id){
			// summary:
			//		Find a widget by it's id.
			//		If passed a widget then just returns the widget.
			return typeof id == "string" ? hash[id] : id;	// dijit._Widget
		},

		byNode: function(/*DOMNode*/ node){
			// summary:
			//		Returns the widget corresponding to the given DOMNode
			return hash[node.getAttribute("widgetId")]; // dijit._Widget
		},

		toArray: function(){
			// summary:
			//		Convert registry into a true Array
			//
			// example:
			//		Work with the widget .domNodes in a real Array
			//		|	array.map(dijit.registry.toArray(), function(w){ return w.domNode; });

			var ar = [];
			for(var id in hash){
				ar.push(hash[id]);
			}
			return ar;	// dijit._Widget[]
		},

		getUniqueId: function(/*String*/widgetType){
			// summary:
			//		Generates a unique id for a given widgetType

			var id;
			do{
				id = widgetType + "_" +
					(widgetType in _widgetTypeCtr ?
						++_widgetTypeCtr[widgetType] : _widgetTypeCtr[widgetType] = 0);
			}while(hash[id]);
			return dijit._scopeName == "dijit" ? id : dijit._scopeName + "_" + id; // String
		},

		findWidgets: function(/*DomNode*/ root){
			// summary:
			//		Search subtree under root returning widgets found.
			//		Doesn't search for nested widgets (ie, widgets inside other widgets).

			var outAry = [];

			function getChildrenHelper(root){
				for(var node = root.firstChild; node; node = node.nextSibling){
					if(node.nodeType == 1){
						var widgetId = node.getAttribute("widgetId");
						if(widgetId){
							var widget = hash[widgetId];
							if(widget){	// may be null on page w/multiple dojo's loaded
								outAry.push(widget);
							}
						}else{
							getChildrenHelper(node);
						}
					}
				}
			}

			getChildrenHelper(root);
			return outAry;
		},

		_destroyAll: function(){
			// summary:
			//		Code to destroy all widgets and do other cleanup on page unload

			// Clean up focus manager lingering references to widgets and nodes
			dijit._curFocus = null;
			dijit._prevFocus = null;
			dijit._activeStack = [];

			// Destroy all the widgets, top down
			array.forEach(registry.findWidgets(win.body()), function(widget){
				// Avoid double destroy of widgets like Menu that are attached to <body>
				// even though they are logically children of other widgets.
				if(!widget._destroyed){
					if(widget.destroyRecursive){
						widget.destroyRecursive();
					}else if(widget.destroy){
						widget.destroy();
					}
				}
			});
		},

		getEnclosingWidget: function(/*DOMNode*/ node){
			// summary:
			//		Returns the widget whose DOM tree contains the specified DOMNode, or null if
			//		the node is not contained within the DOM tree of any widget
			while(node){
				var id = node.getAttribute && node.getAttribute("widgetId");
				if(id){
					return hash[id];
				}
				node = node.parentNode;
			}
			return null;
		},

		// In case someone needs to access hash.
		// Actually, this is accessed from WidgetSet back-compatibility code
		_hash: hash
	};

	if(has("ie")){
		// Only run _destroyAll() for IE because we think it's only necessary in that case,
		// and because it causes problems on FF.  See bug #3531 for details.
		unload.addOnWindowUnload(function(){
			registry._destroyAll();
		});
	}

	/*=====
	dijit.registry = {
		// summary:
		//		A list of widgets on a page.
	};
	=====*/
	dijit.registry = registry;

	return registry;
});

},
'dijit/_base/manager':function(){
define("dijit/_base/manager", [
	"dojo/_base/array",
	"dojo/_base/config", // defaultDuration
	"../registry",
	".."	// for setting exports to dijit namespace
], function(array, config, registry, dijit){

	// module:
	//		dijit/_base/manager
	// summary:
	//		Shim to methods on registry, plus a few other declarations.
	//		New code should access dijit/registry directly when possible.

	/*=====
	dijit.byId = function(id){
		// summary:
		//		Returns a widget by it's id, or if passed a widget, no-op (like dom.byId())
		// id: String|dijit._Widget
		return registry.byId(id); // dijit._Widget
	};

	dijit.getUniqueId = function(widgetType){
		// summary:
		//		Generates a unique id for a given widgetType
		// widgetType: String
		return registry.getUniqueId(widgetType); // String
	};

	dijit.findWidgets = function(root){
		// summary:
		//		Search subtree under root returning widgets found.
		//		Doesn't search for nested widgets (ie, widgets inside other widgets).
		// root: DOMNode
		return registry.findWidgets(root);
	};

	dijit._destroyAll = function(){
		// summary:
		//		Code to destroy all widgets and do other cleanup on page unload

		return registry._destroyAll();
	};

	dijit.byNode = function(node){
		// summary:
		//		Returns the widget corresponding to the given DOMNode
		// node: DOMNode
		return registry.byNode(node); // dijit._Widget
	};

	dijit.getEnclosingWidget = function(node){
		// summary:
		//		Returns the widget whose DOM tree contains the specified DOMNode, or null if
		//		the node is not contained within the DOM tree of any widget
		// node: DOMNode
		return registry.getEnclosingWidget(node);
	};
	=====*/
	array.forEach(["byId", "getUniqueId", "findWidgets", "_destroyAll", "byNode", "getEnclosingWidget"], function(name){
		dijit[name] = registry[name];
	});

	/*=====
	dojo.mixin(dijit, {
		// defaultDuration: Integer
		//		The default fx.animation speed (in ms) to use for all Dijit
		//		transitional fx.animations, unless otherwise specified
		//		on a per-instance basis. Defaults to 200, overrided by
		//		`djConfig.defaultDuration`
		defaultDuration: 200
	});
	=====*/
	dijit.defaultDuration = config["defaultDuration"] || 200;

	return dijit;
});

},
'esri/geometry':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!dojox/gfx/_base,esri/WKIDUnitConversion,esri/geometry/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.geometry");

dojo.require("dojox.gfx._base");
dojo.require("esri.WKIDUnitConversion");
dojo.require("esri.geometry.utils");

esri.Units = {
  //distance units
  CENTIMETERS: "esriCentimeters",
  DECIMAL_DEGREES: "esriDecimalDegrees",
  DEGREE_MINUTE_SECONDS: "esriDegreeMinuteSeconds",
  DECIMETERS: "esriDecimeters",
  FEET: "esriFeet",
  INCHES: "esriInches",
  KILOMETERS: "esriKilometers",
  METERS: "esriMeters",
  MILES: "esriMiles",
  MILLIMETERS: "esriMillimeters",
  NAUTICAL_MILES: "esriNauticalMiles",
  POINTS: "esriPoints",
  UNKNOWN: "esriUnknownUnits",
  YARDS: "esriYards",
  //area units
  ACRES: "esriAcres",
  ARES: "esriAres",
  SQUARE_KILOMETERS: "esriSquareKilometers",
  SQUARE_MILES: "esriSquareMiles",
  SQUARE_FEET: "esriSquareFeet",
  SQUARE_METERS: "esriSquareMeters",
  HECTARES: "esriHectares",
  SQUARE_YARDS: "esriSquareYards",
  SQUARE_INCHES: "esriSquareInches",
  SQUARE_MILLIMETERS: "esriSquareMillimeters",
  SQUARE_CENTIMETERS: "esriSquareCentimeters",
  SQUARE_DECIMETERS: "esriSquareDecimeters"
};

(function() {
  var auxSphere = 'PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",${Central_Meridian}],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]';
  var valid = [ -20037508.342788905, 20037508.342788905 ];
  var origin = [ -20037508.342787, 20037508.342787 ];

dojo.declare("esri.SpatialReference", null, {
    constructor: function(json) {
      // Tests:
      /*
      console.log("1. " + ( dojo.toJson((new esri.SpatialReference()).toJson()) === "null" ));
      console.log("2. " + ( dojo.toJson((new esri.SpatialReference(4326)).toJson()) === "{\"wkid\":4326}" ));
      console.log("3. " + ( dojo.toJson((new esri.SpatialReference("somewellknowntext")).toJson()) === "{\"wkt\":\"somewellknowntext\"}" ));
      console.log("4. " + ( dojo.toJson((new esri.SpatialReference({ wkid: 4326 })).toJson()) === "{\"wkid\":4326}" ));
      console.log("5. " + ( dojo.toJson((new esri.SpatialReference({ wkt: "somewellknowntext" })).toJson()) === "{\"wkt\":\"somewellknowntext\"}" ));
      console.log("6. " + ( dojo.toJson((new esri.SpatialReference({})).toJson()) === "null" ));
      */
      
      if (json) { // relax, wkid cannot be 0 and wkt cannot be empty string
        if (dojo.isObject(json)) {
          dojo.mixin(this, json);
        }
        else if (dojo.isString(json)) {
          this.wkt = json;
        }
        else {
          this.wkid = json;
        }
      }
    },

    wkid: null,
    wkt: null,
    
    /*****************
     * Internal stuff
     *****************/

    // coordinate system info
    _info: {
      // Projected CS
      
      "102113": {
        wkTemplate: 'PROJCS["WGS_1984_Web_Mercator",GEOGCS["GCS_WGS_1984_Major_Auxiliary_Sphere",DATUM["D_WGS_1984_Major_Auxiliary_Sphere",SPHEROID["WGS_1984_Major_Auxiliary_Sphere",6378137.0,0.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",${Central_Meridian}],PARAMETER["Standard_Parallel_1",0.0],UNIT["Meter",1.0]]',
        valid: valid,
        origin: origin,
        dx: 0.00001 // Maximimum allowed difference between origin[0] and tileInfo.origin.x
      },
      
      "102100": {
        wkTemplate: auxSphere,
        valid: valid,
        origin: origin,
        dx: 0.00001
      },
      
      "3857": {
        wkTemplate: auxSphere,
        valid: valid,
        origin: origin,
        dx: 0.00001
      },
      
      // Geographic CS
      
      "4326": {
        wkTemplate: 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",${Central_Meridian}],UNIT["Degree",0.0174532925199433]]',
        // dynamic layers need this altTemplate
        altTemplate: 'PROJCS["WGS_1984_Plate_Carree",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Plate_Carree"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",${Central_Meridian}],UNIT["Degrees",111319.491]]',
        valid: [ -180, 180 ],
        origin: [ -180, 180 ],
        dx: 0.00001
      }
    },
      
    _isWebMercator: function() {
      // true if this spatial reference is web mercator
      return dojo.indexOf([ 102113, 102100, 3857, 3785 ], this.wkid) !== -1;
    },
    
    _isWrappable: function() {
      // true if we support wrap around for this spatial reference
      return dojo.indexOf([ 102113, 102100, 3857, 3785, 4326 ], this.wkid) !== -1;
    },
    
    _getInfo: function() {
      return this.wkid ? this._info[this.wkid] : null;
    },
    
    /*****************
     * Public Methods
     *****************/

    toJson: function() {
      if (this.wkid !== null) {
        return { wkid: this.wkid };
      }
      else if (this.wkt !== null) {
        return { wkt: this.wkt };
      }
      return null;
    }
  }
);

}());


dojo.mixin(esri.geometry,
  (function() {
    var earthRad = 6378137, // in meters
        PI = 3.14159265358979323846264338327950288,
        degPerRad = 57.295779513082320,
        radPerDeg =  0.017453292519943,
        //webMercatorSR = new esri.SpatialReference({ wkid:102100 }),
        //geographicSR = new esri.SpatialReference({ wkid:4326 }),
        floor = Math.floor,
        log = Math.log,
        sin = Math.sin,
        exp = Math.exp,
        atan = Math.atan;

    //lon/lat to web mercator conversion
    function radToDeg(rad) {
      return rad * degPerRad;
    }

    function degToRad(deg) {
      return deg * radPerDeg;
    }

    function lngLatToXY(lng, lat) {
      var lat_rad = degToRad(lat);
      return [degToRad(lng) * earthRad, earthRad/2.0 * log( (1.0 + sin(lat_rad)) / (1.0 - sin(lat_rad)) )];
    }
    
    function xyToLngLat(x, y, isLinear) {
      var lng_deg = radToDeg(x / earthRad);

      if (isLinear){
        return [lng_deg, radToDeg((PI / 2) - (2 * atan(exp(-1.0 * y / earthRad))))];
      }
      return [lng_deg - (floor((lng_deg + 180) / 360) * 360), radToDeg((PI / 2) - (2 * atan(exp(-1.0 * y / earthRad))))];
    }
    
    function convert(geom, func, sr, isLinear) {
      if (geom instanceof esri.geometry.Point) {
        var pt = func(geom.x, geom.y, isLinear);
        return new esri.geometry.Point(pt[0], pt[1], new esri.SpatialReference(sr));
      }
      else if (geom instanceof esri.geometry.Extent) {
        var min = func(geom.xmin, geom.ymin, isLinear),
            max = func(geom.xmax, geom.ymax, isLinear);
        return new esri.geometry.Extent(min[0], min[1], max[0], max[1], new esri.SpatialReference(sr));
      }
      else if (geom instanceof esri.geometry.Polyline || geom instanceof esri.geometry.Polygon) {
        var isPline = geom instanceof esri.geometry.Polyline,
            iRings = isPline ? geom.paths : geom.rings,
            oRings = [], oRing;

        dojo.forEach(iRings, function(iRing) {
          oRings.push(oRing = []);
          dojo.forEach(iRing, function(iPt) {
            oRing.push(func(iPt[0], iPt[1], isLinear));
          });
        });
        
        if (isPline) {
          return new esri.geometry.Polyline({ paths:oRings, spatialReference:sr });
        }
        else {
          return new esri.geometry.Polygon({ rings:oRings, spatialReference:sr });
        }
      }
      else if (geom instanceof esri.geometry.Multipoint) {
        var oPts = [];
        dojo.forEach(geom.points, function(iPt) {
          oPts.push(func(iPt[0], iPt[1], isLinear));
        });
        return new esri.geometry.Multipoint({ points:oPts, spatialReference:sr });
      }
    }

    //for scale calculation
    var inchesPerMeter = 39.37,
        decDegToMeters = 20015077.0 / 180.0,
        ecd = esri.config.defaults,
        lookup = esri.WKIDUnitConversion;

    return {
      //xyToLngLat, geographicSR
      geographicToWebMercator: function(geom) {
        return convert(geom, lngLatToXY, { wkid:102100 });
      },
      
      //lngLatToXY, webMercatorSR
      webMercatorToGeographic: function(geom, isLinear) {
        return convert(geom, xyToLngLat, { wkid:4326 }, isLinear);
      },

      //scale calculation
      getScale: function(map) {
        var extent, width, wkid, wkt;
        
        if (arguments.length > 1) { // backward compatibility for method signature
          extent = arguments[0];
          width = arguments[1];
          wkid = arguments[2];
        }
        else {
          extent = map.extent;
          width = map.width;
          
          var sr = map.spatialReference;
          if (sr) {
            wkid = sr.wkid;
            wkt = sr.wkt;
          }
        }
        
        var unitValue;
        
        if (wkid) {
          unitValue = lookup.values[lookup[wkid]];
        }
        else if ( wkt && (wkt.search(/^PROJCS/i) !== -1) ) {
          var result = /UNIT\[([^\]]+)\]\]$/i.exec(wkt);
          if (result && result[1]) {
            unitValue = parseFloat(result[1].split(",")[1]);
          }
        }
        // else assumed to be in degrees
        
        return esri.geometry._getScale(extent, width, unitValue);
      },
      
      _getScale: function(extent, mapWd, unitValue) {
        return (extent.getWidth() / mapWd) * (unitValue || decDegToMeters) * inchesPerMeter * ecd.screenDPI;
      },
      
      getExtentForScale: function(map, scale) {
        var wkid, wkt, sr = map.spatialReference;
        if (sr) {
          wkid = sr.wkid;
          wkt = sr.wkt;
        }

        var unitValue;
        
        if (wkid) {
          unitValue = lookup.values[lookup[wkid]];
        }
        else if ( wkt && (wkt.search(/^PROJCS/i) !== -1) ) {
          var result = /UNIT\[([^\]]+)\]\]$/i.exec(wkt);
          if (result && result[1]) {
            unitValue = parseFloat(result[1].split(",")[1]);
          }
        }
        // else assumed to be in degrees
        
        return esri.geometry._getExtentForScale(map.extent, map.width, unitValue, scale, true);
      },

      _getExtentForScale: function(extent, mapWd, wkid, scale, /*internal*/ wkidIsUnitValue) {
        var unitValue;
        if (wkidIsUnitValue) {
          unitValue = wkid;
        }
        else {
          unitValue = lookup.values[lookup[wkid]];
        }
        
        return extent.expand(((scale * mapWd) / ((unitValue || decDegToMeters) * inchesPerMeter * ecd.screenDPI)) / extent.getWidth());
      }
    };
  }()),

  {
    defaultPoint:{ type:"point", x:0, y:0 },
    defaultMultipoint: { type:"multipoint", points: null },
    defaultExtent:{ type:"extent", xmin:0, ymin:0, xmax:0, ymax:0 },
    defaultPolyline: { type:"polyline", paths:null },
    defaultPolygon: { type:"polygon", rings:null },

    _rectToExtent: function(/*esri.geometry.Rect*/ rect) {
      //summary: Returns an Extent representation of the argument Rect
      // rect: esri.geometry.Rect: Rect to convert
      // returns: esri.geometry.Extent: Converted Extent
      return new esri.geometry.Extent(parseFloat(rect.x), parseFloat(rect.y) - parseFloat(rect.height), parseFloat(rect.x) + parseFloat(rect.width), parseFloat(rect.y), rect.spatialReference);
    },

    _extentToRect: function(/*esri.geometry.Extent*/ extent) {
      //summary: Returns an Rect representation of the argument Extent
      // rect: esri.geometry.Extent: Extent to convert
      // returns: esri.geometry.Rect: Converted Rect
      return new esri.geometry.Rect(extent.xmin, extent.ymax, extent.getWidth(), extent.getHeight(), extent.spatialReference);
    },

  //  _lineToPolyline: function(/*esri.geometry.Line*/ line) {
  //    return new esri.geometry.Polyline({ paths:[[[line.x1, line.y1], [line.x2, line.y2]]], spatialReference:line.spatialReference });
  //  },

    fromJson: function(/*Object*/ json) {
      //Convert json representation to appropriate esri.geometry.* object
      if (json.x !== undefined && json.y !== undefined) {
        return new esri.geometry.Point(json);
      }
      else if (json.paths !== undefined) {
        return new esri.geometry.Polyline(json);
      }
      else if (json.rings !== undefined) {
        return new esri.geometry.Polygon(json);
      }
      else if (json.points !== undefined) {
        return new esri.geometry.Multipoint(json);
      }
      else if (json.xmin !== undefined && json.ymin !== undefined && json.xmax !== undefined && json.ymax !== undefined) {
        return new esri.geometry.Extent(json);
      }
    },

    getJsonType: function(/*esri.geometry.Geometry*/ geometry) {
      //summary: Returns the JSON type name for a given geometry. This is only
      //         for geometries that can be processed by the server
      // geometry: esri.geometry.Point/Polyline/Polygon/Extent: Geometry to get type for
      // returns: String: Geometry trype name as represented on server

      if (geometry instanceof esri.geometry.Point) {
        return "esriGeometryPoint";
      }
      else if (geometry instanceof esri.geometry.Polyline) {
        return "esriGeometryPolyline";
      }
      else if (geometry instanceof esri.geometry.Polygon) {
        return "esriGeometryPolygon";
      }
      else if (geometry instanceof esri.geometry.Extent) {
        return "esriGeometryEnvelope";
      }
      else if (geometry instanceof esri.geometry.Multipoint) {
        return "esriGeometryMultipoint";
      }

      return null;
    },
  
    getGeometryType: function(/*String*/ jsonType) {
      if (jsonType === "esriGeometryPoint") {
        return esri.geometry.Point;
      }
      else if (jsonType === "esriGeometryPolyline") {
        return esri.geometry.Polyline;
      }
      else if (jsonType === "esriGeometryPolygon") {
        return esri.geometry.Polygon;
      }
      else if (jsonType === "esriGeometryEnvelope") {
        return esri.geometry.Extent;
      }
      else if (jsonType === "esriGeometryMultipoint") {
        return esri.geometry.Multipoint;
      }
    
      return null;
    },

    isClockwise: function(/*[[0:x, 1:y]], ring/path*/ arr) {
      //summary: Returns true if Polygon ring is clockwise.
      // arr: esri.geometry.Point[]: Points array representing polygon path
      // returns: Boolean: True if ring is clockwise
      var area = 0, i, il = arr.length,
          func = dojo.isArray(arr[0]) ? 
                  function(p1, p2) { return p1[0] * p2[1] - p2[0] * p1[1]; } : 
                  function(p1, p2) { return p1.x * p2.y - p2.x * p1.y; };
      for (i=0; i<il; i++) {
        area += func(arr[i], arr[(i+1) % il]);
      }
      return (area / 2) <= 0;
    },

    toScreenPoint: function(/*esri.geometry.Extent*/ ext, /*Number*/ wd, /*Number*/ ht, /*esri.geometry.Point*/ pt, doNotRound) {
      //make sure to update esri.layers.GraphicsLayer.__toScreenPoint if you update this one
      if (doNotRound) {
        return new esri.geometry.Point((pt.x - ext.xmin) * (wd / ext.getWidth()),
                                       (ext.ymax - pt.y) * (ht / ext.getHeight()));
      }
      else {
        return new esri.geometry.Point(Math.round((pt.x - ext.xmin) * (wd / ext.getWidth())),
                                       Math.round((ext.ymax - pt.y) * (ht / ext.getHeight())));
      }
    },

    toScreenGeometry: function(/*esri.geometry.Extent*/ ext, /*Number*/ wd, /*Number*/ ht, /*esri.geometry.Geometry*/ g) {
      var x = ext.xmin,
          y = ext.ymax,
          rwd = wd / ext.getWidth(),
          rht = ht / ext.getHeight(),
          forEach = dojo.forEach,
          round = Math.round;

      if (g instanceof esri.geometry.Point) {
        return new esri.geometry.Point( round((g.x - x) * rwd),
                                        round((y - g.y) * rht));
      }
      else if (g instanceof esri.geometry.Multipoint) {
        var mp = new esri.geometry.Multipoint(),
            mpp = mp.points;
        forEach(g.points, function(pt, i) {
          mpp[i] = [round((pt[0] - x) * rwd), round((y - pt[1]) * rht)];
        });
        return mp;
      }
      else if (g instanceof esri.geometry.Extent) {
        return new esri.geometry.Extent(
          round((g.xmin - x) * rwd),
          round((y - g.ymin) * rht),
          round((g.xmax - x) * rwd),
          round((y - g.ymax) * rwd)
        );
      }
      else if (g instanceof esri.geometry.Polyline) {
        var pline = new esri.geometry.Polyline(),
            paths = pline.paths,
            newPath;
        forEach(g.paths, function(path, i) {
          newPath = (paths[i] = []);
          forEach(path, function(pt, j) {
            newPath[j] = [round((pt[0] - x) * rwd), round((y - pt[1]) * rht)];
          });
        });
        return pline;
      }
      else if (g instanceof esri.geometry.Polygon) {
        var pgon = new esri.geometry.Polygon(),
            rings = pgon.rings,
            newRing;
        forEach(g.rings, function(ring, i) {
          newRing = (rings[i] = []);
          forEach(ring, function(pt, j) {
            newRing[j] = [round((pt[0] - x) * rwd), round((y - pt[1]) * rht)];
          });
        });
        return pgon;
      }
    },

    _toScreenPath: (function() {
      var convert = (function() {
        // esri.vml won't be ready at this point
        if (dojo.isIE < 9) {
          return function(x, y, rwd, rht, dx, dy, inPaths) { //toVML
            var paths = [], //paths or rings, for simplicity in function variable names, just using path. But also applies for rings
                round = Math.round, p, pl = inPaths.length,
                path, pathIndex, pathLength, pt, x1, y1, x2, y2; //, left, top, left2, top2;

            for (p=0; p<pl; p++) {
              path = inPaths[p];
              pt = path[0];

              if ((pathLength = path.length) > 1) {
                pt = path[0];
                x1 = round(((pt[0] - x) * rwd) + dx);
                y1 = round(((y - pt[1]) * rht) + dy);
                x2 = round(((path[1][0] - x) * rwd) + dx);
                y2 = round(((y - path[1][1]) * rht) + dy);
                //left2 = x2 < x1 ? x2 : x1;
                //top2 = y2 < y1 ? y2 : y1;
                paths.push(
                  "M", x1 + "," + y1,
                  "L", x2 + "," + y2
                );

                for (pathIndex=2; pathIndex<pathLength; pathIndex++) {
                  pt = path[pathIndex];
                  x1 = round(((pt[0] - x) * rwd) + dx);
                  y1 = round(((y - pt[1]) * rht) + dy);
                  //left2 = x1 < left2 ? x1 : left2;
                  //top2 = y1 < top2 ? y1 : top2;
                  paths.push(x1 + "," + y1);
                }
              }
              else {
                x1 = round(((pt[0] - x) * rwd) + dx);
                y1 = round(((y - pt[1]) * rht) + dy);
                paths.push("M", x1 + "," + y1);
              }
              
              /*if (p === 0) { // first path
                left = left2;
                top = top2;
              }
              else {
                left = left2 < left ? left2 : left;
                top = top2 < top ? top2 : top;
              }*/
            }

            // We are calculating left and top here so that it can be used to
            // identify if clipping is required. Normally, this information
            // is available for free from GFX - but we've overridden GFX path
            // in VML using esri.gfx.Path impl which prevents GFX from getting
            // the necessary data. (see _GraphicsLayer::_getCorners)
            //geom._screenLeft = left;
            //geom._screenTop = top;

            return paths;
          };
        }
        else {
          return function(x, y, rwd, rht, dx, dy, inPaths) { //toGFX/SVG
            var paths = [], i, j, il, jl, path, pt,
                round = Math.round;
                /*forEach = dojo.forEach;

            forEach(inPaths, function(path, i) {
              paths.push("M");
              forEach(path, function(pt, j) {
                paths.push(round(((pt[0] - x) * rwd) + dx) + "," + round(((y - pt[1]) * rht) + dy));
              });
            });*/
           
            for (i = 0, il = inPaths ? inPaths.length : 0; i < il; i++) {
              path = inPaths[i];
              paths.push("M");
              for (j = 0, jl = path ? path.length : 0; j < jl; j++) {
                pt = path[j];
                paths.push(round(((pt[0] - x) * rwd) + dx) + "," + round(((y - pt[1]) * rht) + dy));
              }
            }
           
            return paths;
          };
        }
      }());
        
      return function(ext, wd, ht, g, dx, dy) {
        var isPline = g instanceof esri.geometry.Polyline;
        return convert(ext.xmin, ext.ymax, wd / ext.getWidth(), ht / ext.getHeight(), dx, dy, isPline ? g.paths : g.rings);
      };
    }()),
  
    // _toScreenPath: function(ext, wd, ht, g, dx, dy) {
    //   var x = ext.xmin,
    //       y = ext.ymax,
    //       rwd = wd / ext.getWidth(),
    //       rht = ht / ext.getHeight(),
    //       forEach = dojo.forEach,
    //       round = Math.round;
    // 
    //   if (g instanceof esri.geometry.Polyline) {
    //     var paths = [];
    //     forEach(g.paths, function(path, i) {
    //       paths.push("M");
    //       forEach(path, function(pt, j) {
    //         paths.push((round((pt[0] - x) * rwd) + dx) + "," + (round((y - pt[1]) * rht) + dy));
    //       });
    //     });
    //     return paths;
    //   }
    //   else if (g instanceof esri.geometry.Polygon) {
    //     var rings = [];
    //     forEach(g.rings, function(ring, i) {
    //       rings.push("M");
    //       forEach(ring, function(pt, j) {
    //         rings.push((round((pt[0] - x) * rwd) + dx) + "," + (round((y - pt[1]) * rht) + dy));
    //       });
    //       rings.push("Z");
    //     });
    //     return rings;
    //   }
    // },

    toMapPoint: function(/*esri.geometry.Extent*/ ext, /*Number*/ wd, /*Number*/ ht, /*esri.geometry.Point*/ pt) {
      return new esri.geometry.Point(ext.xmin + (pt.x / (wd / ext.getWidth())),
                                     ext.ymax - (pt.y / (ht / ext.getHeight())),
                                     ext.spatialReference);
    },
  
    toMapGeometry: function(/*esri.geometry.Extent*/ ext, /*Number*/ wd, /*Number*/ ht, /*esri.geometry.Geometry*/ g) {
      var x = ext.xmin,
          y = ext.ymax,
          sr = ext.spatialReference,
          rwd = wd / ext.getWidth(),
          rht = ht / ext.getHeight(),
          forEach = dojo.forEach;

      if (g instanceof esri.geometry.Point) {
        return new esri.geometry.Point( x + (g.x / rwd),
                                        y - (g.y / rht),
                                        sr);
      }
      else if (g instanceof esri.geometry.Multipoint) {
        var mp = new esri.geometry.Multipoint(sr),
            mpp = mp.points;
        forEach(g.points, function(pt, i) {
          mpp[i] = [x + (pt[0] / rwd), y - (pt[1] / rht)];
        });
        return mp;
      }
      else if (g instanceof esri.geometry.Extent) {
        return new esri.geometry.Extent(x + (g.xmin / rwd),
                                        y - (g.ymin / rht),
                                        x + (g.xmax / rwd),
                                        y - (g.ymax / rht),
                                        sr);
      }
      else if (g instanceof esri.geometry.Polyline) {
        var pline = new esri.geometry.Polyline(sr),
            paths = pline.paths,
            newPath;
        forEach(g.paths, function(path, i) {
          newPath = (paths[i] = []);
          forEach(path, function(pt, j) {
            newPath[j] = [x + (pt[0] / rwd), y - (pt[1] / rht)];
          });
        });
        return pline;
      }
      else if (g instanceof esri.geometry.Polygon) {
        var pgon = new esri.geometry.Polygon(sr),
            rings = pgon.rings,
            newRing;
        forEach(g.rings, function(ring, i) {
          newRing = (rings[i] = []);
          forEach(ring, function(pt, j) {
            newRing[j] = [x + (pt[0] / rwd), y - (pt[1] / rht)];
          });
        });
        return pgon;
      }
    },
  
    getLength: function(pt1, pt2) {
      //summary: Returns the length of this line
      //returns: double: length of line
      var dx = pt2.x - pt1.x,
          dy = pt2.y - pt1.y;

      return Math.sqrt(dx*dx + dy*dy);
    },
  
    _getLength: function(pt1, pt2) {
      var dx = pt2[0] - pt1[0],
          dy = pt2[1] - pt1[1];

      return Math.sqrt(dx*dx + dy*dy);
    },
  
    getMidpoint: function(pt0, pt1) {
      return esri.geometry.getPointOnLine(pt0, pt1, 0.5);
    },

    getPointOnLine: function(pt0, pt1, fraction) {
      if (pt0 instanceof esri.geometry.Point) {
        return new esri.geometry.Point(pt0.x + fraction * (pt1.x - pt0.x), pt0.y + fraction * (pt1.y - pt0.y));
      }
      else {
        return [pt0[0] + fraction * (pt1[0] - pt0[0]), pt0[1] + fraction * (pt1[1] - pt0[1])];
      }
    },
  
    _equals: function(n1, n2) {
      return Math.abs(n1 - n2) < 1.0e-8;
    },
  
    getLineIntersection: function(line1start, line1end, line2start, line2end) {
      var pt = esri.geometry._getLineIntersection([line1start.x, line1start.y], [line1end.x, line1end.y], [line2start.x, line2start.y], [line2end.x, line2end.y]);
      if (pt) {
        pt = new esri.geometry.Point(pt[0], pt[1]);
      }
      return pt;
    },

    _getLineIntersection: function(p0, p1, p2, p3) {
      var INFINITY = 1e10, x, y,

          a0 = esri.geometry._equals(p0[0], p1[0]) ? INFINITY : (p0[1] - p1[1]) / (p0[0] - p1[0]),
          a1 = esri.geometry._equals(p2[0], p3[0]) ? INFINITY : (p2[1] - p3[1]) / (p2[0] - p3[0]),

          b0 = p0[1] - a0 * p0[0],
          b1 = p2[1] - a1 * p2[0];
          
      // a0 and a1 are line slopes
    
      // Check if lines are parallel
      if (esri.geometry._equals(a0, a1)) {
        if (!esri.geometry._equals(b0, b1)) {
          return null; // Parallell non-overlapping
        }
        else {
          if (esri.geometry._equals(p0[0], p1[0])) {
            if (Math.min(p0[1], p1[1]) < Math.max(p2[1], p3[1]) || Math.max(p0[1], p1[1]) > Math.min(p2[1], p3[1])) {
              y = (p0[1] + p1[1] + p2[1] + p3[1] - Math.min(p0[1], p1[1], p2[1], p3[1]) - Math.max(p0[1], p1[1], p2[1], p3[1])) / 2.0;
              x = (y - b0) / a0;
            }
            else {
              return null; // Parallell non-overlapping
            }
          }
          else {
            if (Math.min(p0[0], p1[0]) < Math.max(p2[0], p3[0]) || Math.max(p0[0], p1[0]) > Math.min(p2[0], p3[0])) {
              x = (p0[0] + p1[0] + p2[0] + p3[0] - Math.min(p0[0], p1[0], p2[0], p3[0]) - Math.max(p0[0], p1[0], p2[0], p3[0])) / 2.0;
              y = a0 * x + b0;
            }
            else {
              return null;
            }
          }
        
          return [x, y];
        }
      }
    
      if (esri.geometry._equals(a0, INFINITY)) {
        x = p0[0];
        y = a1 * x + b1;
      }
      else if (esri.geometry._equals(a1, INFINITY)) {
        x = p2[0];
        y = a0 * x + b0;
      }
      else {
        x = - (b0 - b1) / (a0 - a1);
        y = a0 * x + b0; 
      }

      return [x, y];
    },
    
    // Returns "true" if the given lines intersect each other
    _getLineIntersection2: function(/*[[x1, y1], [x2, y2]]*/ line1, /*[[x3, y3], [x4, y4]]*/ line2) {
      // Algorithm: http://local.wasp.uwa.edu.au/~pbourke/geometry/lineline2d/
      
      // This algorithm determines if the lines intersect
      // between the given points. For interesection points
      // beyond the lengths of the line segments use 
      // "_getLineIntersection3"
      
      var p1 = line1[0], p2 = line1[1],
          p3 = line2[0], p4 = line2[1],
          x1 = p1[0], y1 = p1[1],
          x2 = p2[0], y2 = p2[1],
          x3 = p3[0], y3 = p3[1],
          x4 = p4[0], y4 = p4[1],
          x43 = x4 - x3, x13 = x1 - x3, x21 = x2 - x1,
          y43 = y4 - y3, y13 = y1 - y3, y21 = y2 - y1,
          denom = (y43 * x21) - (x43 * y21),
          ua, ub, px, py;
      
      if (denom === 0) {
        return false; // parallel or coincident
      }
      
      ua = ( (x43 * y13) - (y43 * x13) ) / denom;
      ub = ( (x21 * y13) - (y21 * x13) ) / denom;
      
      if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        px = x1 + (ua * (x2 - x1));
        py = y1 + (ua * (y2 - y1)); // you're seeing it right. we are using "ua"
        //console.log("Lines intersect at this point - ", px, py);
        return [px,py];
        //return true;
      }
      else {
        return false;
      }
    },
    
    _pointLineDistance: function(point, line) {
      // Returns the shortest distance from point to line
      // Algorithm: http://local.wasp.uwa.edu.au/~pbourke/geometry/pointline/
      
      var p1 = line[0], p2 = line[1],
          x1 = p1[0], y1 = p1[1], x2 = p2[0], y2 = p2[1],
          x3 = point[0], y3 = point[1],
          x21 = x2 - x1, y21 = y2 - y1,
          x31 = x3 - x1, y31 = y3 - y1,
          sqrt = Math.sqrt, pow = Math.pow,
          mag = sqrt(pow(x21, 2) + pow(y21, 2)),
          u = ((x31 * x21) + (y31 * y21)) / (mag * mag),
          x = x1 + u * x21, y = y1 + u * y21;
      
      return sqrt(pow(x3-x, 2) + pow(y3-y, 2));
    }
    
//    // TODO
//    // Need to replace _getLineIntersection above with this algorithm
//    // as it is much faster
//    // Test page: http://pponnusamy.esri.com:9090/jsapi/mapapps/testing/v20/line-intersection-tests.html
//    _getLineIntersection3: function(/*[[x1, y1], [x2, y2]]*/ line1, /*[[x3, y3], [x4, y4]]*/ line2) {
//      // Algorithm: http://en.wikipedia.org/wiki/Line-line_intersection
//
//      // Note that the intersection point is for the infinitely long lines 
//      // defined by the points, rather than the line segments between the points, 
//      // and can produce an intersection point beyond the lengths of the line segments.
//
//      var p1 = line1[0], p2 = line1[1];
//      var p3 = line2[0], p4 = line2[1];
//      var x1 = p1[0], y1 = p1[1];
//      var x2 = p2[0], y2 = p2[1];
//      var x3 = p3[0], y3 = p3[1];
//      var x4 = p4[0], y4 = p4[1];
//      
//      var dx12 = x1 - x2, dy12 = y1 - y2;
//      var dx34 = x3 - x4, dy34 = y3 - y4;
//      var x1y2 = x1 * y2, y1x2 = y1 * x2;
//      var x3y4 = x3 * y4, y3x4 = y3 * x4;
//      
//      var denom = (dx12 * dy34) - (dy12 * dx34);
//      var diff1 = x1y2 - y1x2;
//      var diff2 = x3y4 - y3x4;
//      var px = ( (diff1 * dx34) - (dx12 * diff2) ) / denom;
//      var py = ( (diff1 * dy34) - (dy12 * diff2) ) / denom;
//      //console.log("Lines intersect at this point - ", px, py);
//      return [px, py];
//    }

  }
);

dojo.declare("esri.geometry.Geometry", null, {
    // spatialReference: esri.SpatialReference: spatial reference well-known-id
    spatialReference: null,
    type: null,

    setSpatialReference: function(/*esri.SpatialReference*/ sr) {
      this.spatialReference = sr;
      return this;
    },

    getExtent: function() {
      return null;
    }
  }
);

dojo.declare("esri.geometry.Point", esri.geometry.Geometry, {
    constructor: function(/*Array|Object|Number*/ x, /*esri.SpatialReference|Number*/ y, /*esri.SpatialReference*/ spatialReference) {
      //summary: Create a new Point object
      // x: Number or Object: x coordinate of point or { x, y, spatialReference } object
      // y: Number: y coordinate of point
      // spatialReference: esri.SpatialReference: spatial reference well-known-id
      dojo.mixin(this, esri.geometry.defaultPoint);
      if (dojo.isArray(x)) {
        this.x = x[0];
        this.y = x[1];
        this.spatialReference = y;
      }
      else if (dojo.isObject(x)) {
        dojo.mixin(this, x);
        if (this.spatialReference) {
          this.spatialReference = new esri.SpatialReference(this.spatialReference);
        }
      }
      else {
        this.x = x;
        this.y = y;
        this.spatialReference = spatialReference;
      }
    },

    offset: function(/*Number*/ x, /*Number*/ y) {
      //summary: Creates and returns new point offsetted by argument distance
      // x: Number: Offset in x direction
      // y: Number: Offset in y direction
      // return: esri.geometry.Point: offsetted point
      return new esri.geometry.Point(this.x + x, this.y + y, this.spatialReference);
    },

    setX: function(/*Number*/ x) {
      this.x = x;
      return this;
    },

    setY: function(/*Number*/ y) {
      this.y = y;
      return this;
    },
    
    update: function(x, y) {
      this.x = x;
      this.y = y;
      return this;
    },
    
    /*getExtent: function() {
      var x = this.x, y = this.y, sr = this.spatialReference;
      
      return new esri.geometry.Extent(
        x, y, x, y, 
        sr && new esri.SpatialReference(sr.toJson())
      );
    },*/
    
    normalize: function() {
      // Shifts "x" to within +/- 180 span
      
      /*// Test cases:
      var res, sr = new esri.SpatialReference({ wkid: 4326 });
      res = esri.geometry.Point.prototype.normalize.call({ x: -200, spatialReference: sr });
      console.log(res.x === 160);
      res = esri.geometry.Point.prototype.normalize.call({ x: -528, spatialReference: sr });
      console.log(res.x === -168);
      res = esri.geometry.Point.prototype.normalize.call({ x: -1676, spatialReference: sr });
      console.log(res.x === 124);
      res = esri.geometry.Point.prototype.normalize.call({ x: -181, spatialReference: sr });
      console.log(res.x === 179);
      res = esri.geometry.Point.prototype.normalize.call({ x: 250, spatialReference: sr });
      console.log(res.x === -110);
      res = esri.geometry.Point.prototype.normalize.call({ x: 896, spatialReference: sr });
      console.log(res.x === 176);
      res = esri.geometry.Point.prototype.normalize.call({ x: 181, spatialReference: sr });
      console.log(res.x === -179);
      res = esri.geometry.Point.prototype.normalize.call({ x: 2346, spatialReference: sr });
      console.log(res.x === -174);*/
      
      var x = this.x, sr = this.spatialReference;
      
      if (sr) {
        var info = sr._getInfo();
        if (info) {
          var minus180 = info.valid[0], plus180 = info.valid[1], world = 2 * plus180, ratio;
  
          if (x > plus180) {
            /*while (x > plus180) {
              x -= world;
            }*/
            ratio = Math.ceil(Math.abs(x - plus180) / world);
            x -= (ratio * world);
          }
          else if (x < minus180) {
            /*while (x < minus180) {
              x += world;
            }*/
            ratio = Math.ceil(Math.abs(x - minus180) / world);
            x += (ratio * world);
          }
        }
      }

      return new esri.geometry.Point(x, this.y, sr);
    },

//    toString: function() {
//      return this.declaredClass + "(" + this.x + ", " + this.y + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    },

    toJson: function() {
      var json = { x:this.x, y:this.y },
          sr = this.spatialReference;
      if (sr) {
        json.spatialReference = sr.toJson();
      }
      return json;
    }
  }
);

dojo.declare("esri.geometry.Polyline", esri.geometry.Geometry, {
    constructor: function(/*Object*/ obj) {
      //summary: Create a new Polyline object
      // sr: esri.SpatialReference: spatial reference or REST JSON object
      dojo.mixin(this, esri.geometry.defaultPolyline);
      this.paths = [];
      this._path = 0;
  
      if (obj) {
        if (obj.paths) {
          dojo.mixin(this, obj);
        }
        else {
          this.spatialReference = obj;
        }
        this.spatialReference = new esri.SpatialReference(this.spatialReference);
      }
    },

    _extent: null,
//    _length: null,

    addPath: function(/*esri.geometry.Point[] or json.paths[i]*/ points) {
      //summary: Add path to polyline
      // points: esri.geometry.Point[] or json.paths[i]: Points on path or a path in json format
      this._extent = null; //this._length 
      this._path = this.paths.length;
      this.paths[this._path] = [];
      if (dojo.isArray(points[0])) {
        dojo.forEach(points, this._addPointArr, this);
      }
      else {
        dojo.forEach(points, this._addPoint, this);
      }
      return this;
    },

    _addPointArr: function(/*[x, y]*/ point) {
      // point: [x, y]: Add point to path
      this.paths[this._path].push(point); //[point[0], point[1]]);
    },

    _addPoint: function(/*esri.geometry.Point*/ point) {
      // point: esri.geometry.Point: Add point to path
      this.paths[this._path].push([point.x, point.y]);
    },

    _insertPoints: function(/*esri.geometry.Point[]*/ points, /*int*/ index) {
      //summary: insert points into path at specified path index
      // points: esri.geometry.Point[]: Points to insert into path
      // index: int: Index to insert points in path
      this._extent = null; //this._length
      this._path = index;
      if (! this.paths[this._path]) {
        this.paths[this._path] = [];
      }
      dojo.forEach(points, this._addPoint, this);
    },

    _validateInputs: function(pathIndex, pointIndex) {
      if ((pathIndex !== null && pathIndex !== undefined) && (pathIndex < 0 || pathIndex >= this.paths.length)) {
        return false;
      }

      if ((pointIndex !== null && pathIndex !== undefined) && (pointIndex < 0 || pointIndex >= this.paths[pathIndex].length)) {
        return false;
      }

      return true;
    },

    getPoint: function(pathIndex, pointIndex) {
      //summary: 
      if (this._validateInputs(pathIndex, pointIndex)) {
        return new esri.geometry.Point(this.paths[pathIndex][pointIndex], this.spatialReference);

        /*var point = this.paths[pathIndex][pointIndex];
        point = new esri.geometry.Point(point[0], point[1], this.spatialReference);
        point.setSpatialReference(this.spatialReference);
        return point;*/
      }
    },

    setPoint: function(pathIndex, pointIndex, point) {
      if (this._validateInputs(pathIndex, pointIndex)) {
        this._extent = null;
        this.paths[pathIndex][pointIndex] = [point.x, point.y];
        return this;
      }
    },
    
    insertPoint: function(pathIndex, pointIndex, point) {
      if (
        this._validateInputs(pathIndex) && 
        esri._isDefined(pointIndex) && (pointIndex >= 0 && pointIndex <= this.paths[pathIndex].length) 
      ) {
        this._extent = null;
        this.paths[pathIndex].splice(pointIndex, 0, [point.x, point.y]);
        return this;
      }
    },

    removePath: function(index) {
      //summary: remove path at argument index
      // index: int: Index of path to be removed
      // returns: esri.geometry.Point[]: Returns array of points representing the removed path
      if (this._validateInputs(index, null)) {
        this._extent = null; //this._length = 
        var arr = this.paths.splice(index, 1)[0],
            i, il = arr.length,
            point = esri.geometry.Point,
            sr = this.spatialReference;
        for (i = 0; i < il; i++) {
          arr[i] = new point(arr[i], sr);
        }
        return arr;
      }
    },

    removePoint: function(pathIndex, pointIndex) {
      if (this._validateInputs(pathIndex, pointIndex)) {
        this._extent = null;
        return new esri.geometry.Point(this.paths[pathIndex].splice(pointIndex, 1)[0], this.spatialReference);
      }
    },

    getExtent: function() {
      var retVal;
      if (this._extent) {
        retVal = new esri.geometry.Extent(this._extent);
        retVal._partwise = this._partwise;
        return retVal;
      }

      var paths = this.paths, pal = paths.length;
      if (!pal || !paths[0].length) {
        return;
      }

      var path, point, x, y, xmax, ymax, pa, pt, ptl,
          xmin = (xmax = paths[0][0][0]),
          ymin = (ymax = paths[0][0][1]),
          min = Math.min,
          max = Math.max,
          sr = this.spatialReference,
          parts = [], rxmin, rxmax, rymin, rymax;
          
      for (pa=0; pa<pal; pa++) {
        path = paths[pa];
        rxmin = (rxmax = path[0] && path[0][0]);
        rymin = (rymax = path[0] && path[0][1]);
        ptl = path.length;
        
        for (pt=0; pt < ptl; pt++) {
          point = path[pt];
          x = point[0];
          y = point[1];
          xmin = min(xmin, x);
          ymin = min(ymin, y);
          xmax = max(xmax, x);
          ymax = max(ymax, y);
          
          rxmin = min(rxmin, x);
          rymin = min(rymin, y);
          rxmax = max(rxmax, x);
          rymax = max(rymax, y);
        }
        parts.push(new esri.geometry.Extent({ xmin: rxmin, ymin: rymin, xmax: rxmax, ymax: rymax, spatialReference:(sr ? sr.toJson() : null) }));
      }
      
      this._extent = { xmin:xmin, ymin:ymin, xmax:xmax, ymax:ymax, spatialReference:sr ? sr.toJson() : null };
      this._partwise = parts.length > 1 ? parts : null;
      
      retVal = new esri.geometry.Extent(this._extent);
      retVal._partwise = this._partwise;
      return retVal;
    },

    /*getLength: function() {
      if (this._length) {
        return this._length;
      }

      var paths = this.paths, path, l = 0, gl = esri.geometry._getLength;
      for (var pa = 0, pal=paths.length; pa < pal; pa++) {
        path = paths[pa];

        for (var p=0, pl=path.length; p<pl-1; p++) {
          l += gl(path[p], path[p+1]);
        }
      }

      return (this._length = l);
    },

    intersects: function(point) {
      var paths = this.paths, path, length, gl = esri.geometry._getLength, u, pi, pj, xp, yp, l;

      for (var pa=0, pal=paths.length; pa<pal; pa++) {
        path = paths[pa];

        for (var p=0, pl=path.length-1; p<pl; p++) {
          pi = path[p];
          pj = path[p+1];
          length = gl(pi, pj);

          if (length == 0) {
            length = gl(path[p], [point.x, point.y]);
          }

          u = ((point.x - pi[0]) * (pj[0] - pi[0]) + (point.y - pi[1]) * (pj[1] - pi[1])) / (length * length);
              
          xp = pi[0] + u * (pj[0] - pi[0]);
          yp = pi[1] + u * (pj[1] - pi[1]);

          l = gl([xp, yp], [point.x, point.y]);
          if (! l) {
            return true;
          }
        }
      }

      return false;
    },*/

//    toString: function() {
//      return this.declaredClass + "(" + this.paths + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    },

    toJson: function() {
      //var json = { paths: [].concat(this.paths) },
      var json = { paths: dojo.clone(this.paths) },
          sr = this.spatialReference;
      if (sr) {
        json.spatialReference = sr.toJson();
      }
      return json;
    }
  }
);

dojo.declare("esri.geometry.Polygon", esri.geometry.Geometry, {
    constructor: function(/*Object*/ obj) {
      //summary: Create a new Polygon object
      // sr: esri.SpatialReference: spatial reference or REST JSON
      dojo.mixin(this, esri.geometry.defaultPolygon);
      this.rings = [];
      this._ring = 0;
  
      if (obj) {
        if (obj.rings) {
          dojo.mixin(this, obj);
        }
        else {
          this.spatialReference = obj;
        }
        this.spatialReference = new esri.SpatialReference(this.spatialReference);
      }
    },

    _extent: null,
//    _area: null,
//    _length: null,

    addRing: function(/*esri.geometry.Point[]*/ points) {
      //summary: Add ring to polylgon
      // points: esri.geometry.Point[] or json.rings[i]: Points on ring or a ring in json format
      this._extent = null; //(this._area = (this._length = null))
      this._ring = this.rings.length;
      this.rings[this._ring] = [];

      if (dojo.isArray(points[0])) {
        dojo.forEach(points, this._addPointArr, this);
      }
      else {
        dojo.forEach(points, this._addPoint, this);
      }
      return this;
    },

    _addPointArr: function(/*[x, y]*/ point) {
      // point: [x, y]: Add point to ring
      this.rings[this._ring].push(point); //[point[0], point[1]]);
    },

    _addPoint: function(/*esri.geometry.Point*/ point) {
      // point: esri.geometry.Point: Add point to ring
      this.rings[this._ring].push([point.x, point.y]);
    },

    _insertPoints: function(/*esri.geometry.Point[]*/ points, /*int*/ index) {
      //summary: insert points into ring at specified ring index
      // points: esri.geometry.Point[]: Points to insert into path
      // index: int: Index to insert points in path
      this._extent = null; //(this._area = (this._length = null))
      this._ring = index;
      if (! this.rings[this._ring]) {
        this.rings[this._ring] = [];
      }
      dojo.forEach(points, this._addPoint, this);
    },

    _validateInputs: function(ringIndex, pointIndex) {
      if ((ringIndex !== null && ringIndex !== undefined) && (ringIndex < 0 || ringIndex >= this.rings.length)) {
        return false;
      }

      if ((pointIndex !== null && ringIndex !== undefined) && (pointIndex < 0 || pointIndex >= this.rings[ringIndex].length)) {
        return false;
      }

      return true;
    },

    getPoint: function(ringIndex, pointIndex) {
      //summary: 
      if (this._validateInputs(ringIndex, pointIndex)) {
        return new esri.geometry.Point(this.rings[ringIndex][pointIndex], this.spatialReference);
        
        /*var point = this.rings[ringIndex][pointIndex];
        point = new esri.geometry.Point(point[0], point[1], this.spatialReference);
        point.setSpatialReference(this.spatialReference);
        return point;*/
      }
    },

    setPoint: function(ringIndex, pointIndex, point) {
      if (this._validateInputs(ringIndex, pointIndex)) {
        this._extent = null;
        this.rings[ringIndex][pointIndex] = [point.x, point.y];
        return this;
      }
    },

    insertPoint: function(ringIndex, pointIndex, point) {
      // Note: its the caller's responsibility to make sure the ring is 
      // properly closed i.e. first and the last point should be the same
      
      if (
        this._validateInputs(ringIndex) &&
        esri._isDefined(pointIndex) && (pointIndex >= 0 && pointIndex <= this.rings[ringIndex].length)
      ) {
        this._extent = null;
        this.rings[ringIndex].splice(pointIndex, 0, [point.x, point.y]);
        return this;
      }
    },

    removeRing: function(index) {
      //summary: remove ring at argument index
      // index: int: Index of ring to be removed
      // returns: esri.geometry.Point[]: Returns array of points representing the removed ring
      if (this._validateInputs(index, null)) {
        this._extent = null; //(this._area = (this._length = null)
        var arr = this.rings.splice(index, 1)[0],
            i, il = arr.length,
            point = esri.geometry.Point,
            sr = this.spatialReference;
        for (i = 0; i < il; i++) {
          arr[i] = new point(arr[i], sr);
        }
        return arr;
      }
    },
    
    removePoint: function(ringIndex, pointIndex) {
      if (this._validateInputs(ringIndex, pointIndex)) {
        this._extent = null;
        return new esri.geometry.Point(this.rings[ringIndex].splice(pointIndex, 1)[0], this.spatialReference);
      }
    },

    getExtent: function() {
      var retVal;
      if (this._extent) {
        retVal = new esri.geometry.Extent(this._extent);
        retVal._partwise = this._partwise;
        return retVal;
      }

      var rings = this.rings, pal = rings.length;
      if (!pal || !rings[0].length) {
        return;
      }
      
      var ring, point, x, y, xmax, ymax, pa, pt, ptl,
          xmin = (xmax = rings[0][0][0]),
          ymin = (ymax = rings[0][0][1]),
          min = Math.min,
          max = Math.max,
          sr = this.spatialReference, 
          parts = [], rxmin, rxmax, rymin, rymax;
          
      for (pa=0; pa<pal; pa++) {
        ring = rings[pa];
        rxmin = (rxmax = ring[0] && ring[0][0]);
        rymin = (rymax = ring[0] && ring[0][1]);
        ptl = ring.length;
        
        for (pt=0; pt < ptl; pt++) {
          point = ring[pt];
          x = point[0];
          y = point[1];
          xmin = min(xmin, x);
          ymin = min(ymin, y);
          xmax = max(xmax, x);
          ymax = max(ymax, y);
          
          rxmin = min(rxmin, x);
          rymin = min(rymin, y);
          rxmax = max(rxmax, x);
          rymax = max(rymax, y);
        }
        parts.push(new esri.geometry.Extent({ xmin: rxmin, ymin: rymin, xmax: rxmax, ymax: rymax, spatialReference:(sr ? sr.toJson() : null) }));
      }
      
      this._extent = { xmin:xmin, ymin:ymin, xmax:xmax, ymax:ymax, spatialReference:(sr ? sr.toJson() : null) };
      this._partwise = parts.length > 1 ? parts : null;
      
      retVal = new esri.geometry.Extent(this._extent);
      retVal._partwise = this._partwise;
      return retVal;
    },
    
    contains: function(point) {
      var rings = this.rings, ring, isInside = false, pi, pj, nPoints, j, i, pa, pal = rings.length;

      for (pa=0; pa<pal; pa++) {
        ring = rings[pa];

        nPoints = ring.length;
        j = 0;
        for (i=0; i<nPoints; i++) {
          j++;
          if (j === nPoints) {
            j = 0;
          }
          pi = ring[i];
          pj = ring[j];

          if ((pi[1] < point.y && pj[1] >= point.y || pj[1] < point.y && pi[1] >= point.y) && (pi[0] + (point.y - pi[1]) / (pj[1] - pi[1]) * (pj[0] - pi[0]) < point.x)) {
            isInside = !isInside;
          }
        }            
      }

      return isInside;
    },

    /*getArea: function() {
      if (this._area) {
        return this._area;
      }

      var rings = this.rings;
      var area = 0;

      for (var pa = 0, pal = rings.length; pa < pal; pa++) {
        area += this._getArea(rings[pa]);
      }

      return (this._area = Math.abs(area));
    },

    _getArea: function(ring) {
      var pi, pj, n = ring.length, area = 0;

      for (var i=0; i<n-1; i++) {
        pi = ring[i];
        pj = ring[i+1];
        area += (pi[0] * pj[1]) - (pj[0] * pi[1]);
      }

      pi = ring[0];
      pj = ring[n-1];
      
      area += (pj[0] * pi[1]) - (pi[0] * pj[1]);
      return area * 0.5;
    },

    getLength: function() {
      if (this._length) {
        return this._length;
      }

      var paths = this.paths, path, l = 0, gl = esri.geometry._getLength;
      for (var pa = 0, pal=paths.length; pa < pal; pa++) {
        path = paths[pa];

        for (var p=0, pl=path.length; p<pl-1; p++) {
          l += gl(path[p], path[p+1]);
        }

        l += gl(path[path.length - 1], path[0]);
      }

      return (this._length = l);
    },*/

//    toString: function() {
//      return this.declaredClass + "(" + this.rings + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    },

    toJson: function() {
      //var json = { rings: [].concat(this.rings) },
      var json = { rings: dojo.clone(this.rings) },
          sr = this.spatialReference;
      if (sr) {
        json.spatialReference = sr.toJson();
      }
      return json;
    }
  }
);

dojo.declare("esri.geometry.Multipoint", esri.geometry.Geometry, {
    constructor: function(/*JSON or esri.SpatialReference*/ obj) {
      dojo.mixin(this, esri.geometry.defaultMultipoint);
      this.points = [];

      if (obj) {
        if (obj.points) {
          dojo.mixin(this, obj);
        }
        else {
          this.spatialReference = obj;
        }
        this.spatialReference = new esri.SpatialReference(this.spatialReference);
      }
    },

    _extent: null,

    addPoint: function(/*Array[x,y]|esri.geometry.Point*/ point) {
      this._extent = null;
      if (dojo.isArray(point)) {
        this.points.push(point);
      }
      else {
        this.points.push([point.x, point.y]);
      }
      return this;
    },

    removePoint: function(index) {
      if (this._validateInputs(index)) {
        this._extent = null;
        return new esri.geometry.Point(this.points.splice(index, 1)[0], this.spatialReference);
      }
    },

    getExtent: function() {
      if (this._extent) {
        return new esri.geometry.Extent(this._extent);
      }

      var points = this.points, il = points.length;
      if (!il) {
        return;
      }

      var point = points[0], xmax, ymax,
          xmin = (xmax = point[0]),
          ymin = (ymax = point[1]),
          min = Math.min,
          max = Math.max,
          sr = this.spatialReference,
          x, y, i;

      for (i=0; i<il; i++) {
        point = points[i];
        x = point[0];
        y = point[1];
        xmin = min(xmin, x);
        ymin = min(ymin, y);
        xmax = max(xmax, x);
        ymax = max(ymax, y);
      }
      
      this._extent = { xmin:xmin, ymin:ymin, xmax:xmax, ymax:ymax, spatialReference:sr ? sr.toJson() : null };
      return new esri.geometry.Extent(this._extent);
    },

    _validateInputs: function(index) {
      if (index === null || index < 0 || index >= this.points.length) {
        return false;
      }
      
      return true;
    },

    getPoint: function(index) {
      if (this._validateInputs(index)) {
        var point = this.points[index];
        return new esri.geometry.Point(point[0], point[1], this.spatialReference);
      }
    },

    setPoint: function(index, point) {
      if (this._validateInputs(index)) {
        this._extent = null;
        this.points[index] = [ point.x, point.y ];
        return this;
      }
    },

//    toString: function() {
//      return this.declaredClass + "(" + this.points + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    },

    toJson: function() {
      //var json = { points: [].concat(this.points) },
      var json = { points: dojo.clone(this.points) },
          sr = this.spatialReference;
      if (sr) {
        json.spatialReference = sr.toJson();
      }
      return json;
    }
  }
);

dojo.declare("esri.geometry.Extent", esri.geometry.Geometry, {
    constructor: function(/*Number or Object*/ xmin, /*Number*/ ymin, /*Number*/ xmax, /*Number*/ ymax, /*esri.SpatialReference*/ spatialReference) {
      //summary: Create a new Extent object
      // xmin: Number or Object: Bottom-left x coordinate or { xmin, ymin, xmax, ymax, spatialReference } object.
      // ymin: Number: Bottom-left y coordinate
      // xmax: Number: Top-right x coordinate
      // ymax: Number: Top-right y coordinate
      // spatialReference: esri.SpatialReference: spatial reference well-known-id
      dojo.mixin(this, esri.geometry.defaultExtent);
      
      if (dojo.isObject(xmin)) {
        dojo.mixin(this, xmin);
        this.spatialReference = new esri.SpatialReference(this.spatialReference);
        //this._fix();
      }
      else {
        this.update(xmin, ymin, xmax, ymax, spatialReference);
      }
    },
    
    /*_fix: function() {
      var xmin = this.xmin, ymin = this.ymin,
          xmax = this.xmax, ymax = this.ymax;
    
      this.xmin = xmin || xmax || 0;
      this.ymin = ymin || ymax || 0;
      this.xmax = xmax || xmin || 0;
      this.ymax = ymax || ymin || 0;
    },*/

    getWidth: function() {
      //returns: Number: Returns the width of the Extent
      return Math.abs(this.xmax - this.xmin);
    },

    getHeight: function() {
      //returns: Number: Returns the height of the Extent
      return Math.abs(this.ymax - this.ymin);
    },

    getCenter: function() {
      //returns: esri.geometry.Point: Return center point of extent
      return new esri.geometry.Point((this.xmin + this.xmax)/2, (this.ymin + this.ymax)/2, this.spatialReference);
    },

    centerAt: function(/*esri.geometry.Point*/ point) {
      var center = this.getCenter(),
          dx = point.x - center.x,
          dy = point.y - center.y;
      return new esri.geometry.Extent(this.xmin + dx, this.ymin + dy, this.xmax + dx, this.ymax + dy, this.spatialReference);

//      this.update(this.xmin + dx, this.ymin + dy, this.xmax + dx, this.ymax + dy, this.spatialReference);
    },

    update: function(/*Number*/ xmin, /*Number*/ ymin, /*Number*/ xmax, /*Number*/ ymax, /*esri.SpatialReference*/ spatialReference) {
      this.xmin = xmin;
      this.ymin = ymin;
      this.xmax = xmax;
      this.ymax = ymax;
      this.spatialReference = spatialReference;
      //this._fix();
      return this;
    },

    offset: function(/*Number*/ ox, /*Number*/ oy) {
      //summary: esri.geometry.Extent: Return new extent object by offsetting by
      //         argument x and y
      // ox: Number: Offset x distance
      // oy: Number: Offset y distance
      // returns: esri.geometry.Extent: Returns offsetted extent object
      return new esri.geometry.Extent(this.xmin + ox, this.ymin + oy, this.xmax + ox, this.ymax + oy, this.spatialReference);
    },

    expand: function(/*Number*/ factor) {
      //summary: Expands the Extent object by argument factor. If 0 > factor < 1,
      //         the Extent shrinks. If factor > 1, the Extent expands.
      // factor: Number: Factor to expand the Extent by
      var deltaf = (1 - factor) / 2,
          deltaw = this.getWidth() * deltaf,
          deltah = this.getHeight() * deltaf;

      return new esri.geometry.Extent(this.xmin + deltaw, this.ymin + deltah, this.xmax - deltaw, this.ymax - deltah, this.spatialReference);
    },
    
    intersects: function(/*Point | Multipoint | Extent | Polygon | Polyline*/ geometry) {
      var type = geometry.type;
      switch(type) {
        case "point":
          return this.contains(geometry);
        case "multipoint":
          return this._intersectsMultipoint(geometry);
        case "extent":
          return this._intersectsExtent(geometry);
        case "polygon":
          return this._intersectsPolygon(geometry);
        case "polyline":
          return this._intersectsPolyline(geometry);
      }
    },
    
    _intersectsMultipoint: function(multipoint) {
      var len = multipoint.points.length, i;
      for (i = 0; i < len; i++) {
        if (this.contains(multipoint.getPoint(i))) {
          return true;
        }
      }
      return false;
    },

    _intersectsExtent: function(extent) {
      var xmin, ymin, width, height, emptyIntersection = false;

      // check on horizontal overlap
      if (this.xmin <= extent.xmin) {
        xmin = extent.xmin;
        if (this.xmax < xmin) {
          emptyIntersection = true;
        }
        else {
          width = Math.min(this.xmax, extent.xmax) - xmin;
        }
      }
      else {
        xmin = this.xmin;
        if (extent.xmax < xmin) {
          emptyIntersection = true;
        }
        else {
          width = Math.min(this.xmax, extent.xmax) - xmin;
        }
      }

      // check on vertical overlap
      if (this.ymin <= extent.ymin) {
        ymin = extent.ymin;
        if (this.ymax < ymin) {
          emptyIntersection = true;
        }
        else {
          height = Math.min(this.ymax, extent.ymax) - ymin;
        }
      }
      else {
        ymin = this.ymin;
        if (extent.ymax < ymin) {
          emptyIntersection = true;
        }
        else {
          height = Math.min(this.ymax, extent.ymax) - ymin;
        }
      }

      if (emptyIntersection) {
        return null;
      }

      return new esri.geometry.Extent(xmin, ymin, xmin + width, ymin + height, this.spatialReference);
    },
    
    _intersectsPolygon: function(polygon) {
      // Convert this extent into line segments
      var topLeft =  [ this.xmin, this.ymax ], topRight = [ this.xmax, this.ymax ],
          bottomLeft = [ this.xmin, this.ymin ], bottomRight = [ this.xmax, this.ymin ],
          corners = [ topLeft, topRight, bottomLeft, bottomRight ],
          extentLines = [
            [ bottomLeft,  topLeft ],
            [ topLeft,     topRight ],
            [ topRight,    bottomRight ],
            [ bottomRight, bottomLeft ]
          ],
          i, j, rings = polygon.rings, ringsLength = rings.length, ring, len, point = new esri.geometry.Point(0, 0);

      // Check if the polygon contains any of the points
      // defining the extent
      len = corners.length;
      for (i = 0; i < len; i++) {
        point.update(corners[i][0], corners[i][1]);
        if (polygon.contains(point)) {
          return true;
        }
      }
      
      // Check if any line segment of the extent and polygon intersect
      // each other
      var pi, pj;
      for(i = 0; i < ringsLength; i++) {
        ring = rings[i];
        len = ring.length;
        
        // Ideally we don't expect a ring to be empty.
        // However we have seen this in the wild
        if (!len) {
          continue;
        }
        
        pi = ring[0];
        
        // check if the first point in this ring
        // is within this extent
        point.update(pi[0], pi[1]);
        if (this.contains(point)) {
          return true;
        }

        for(j = 1; j < len; j++) {
          pj = ring[j];
          point.update(pj[0], pj[1]);
          if (this.contains(point) || this._intersectsLine([pi, pj], extentLines)) {
            return true;
          }
          pi = pj;
        }
      }
      
      return false;
    },
    
    _intersectsPolyline: function(polyline) {
      // Convert this extent into line segments 
      var extentLines = [
        [ [ this.xmin, this.ymin ], [ this.xmin, this.ymax ] ],
        [ [ this.xmin, this.ymax ], [ this.xmax, this.ymax ] ],
        [ [ this.xmax, this.ymax ], [ this.xmax, this.ymin ] ],
        [ [ this.xmax, this.ymin ], [ this.xmin, this.ymin ] ]
      ];
      
      // Check if any line segment of the extent and polyline intersect
      // each other
      var i, j, paths = polyline.paths, pathsLength = paths.length, path, len; 
      var pi, pj, point = new esri.geometry.Point(0, 0);
      
      for(i = 0; i < pathsLength; i++) {
        path = paths[i];
        len = path.length;
        
        // Ideally we don't expect a path to be empty.
        // However we have seen this in the wild
        if (!len) {
          continue;
        }
        
        pi = path[0];
        
        // check if the first point in this path
        // is within this extent
        point.update(pi[0], pi[1]);
        if (this.contains(point)) {
          return true;
        }
        
        for(j = 1; j < len; j++) {
          pj = path[j];
          point.update(pj[0], pj[1]);
          if (this.contains(point) || this._intersectsLine([pi, pj], extentLines)) {
            return true;
          }
          pi = pj;
        }
      }

      return false;
    },
    
    // Returns "true" if the given line intersects this extent
    _intersectsLine: function(/*[[x1, y1], [x2, y2]]*/ line, extentLines) {
      var check = esri.geometry._getLineIntersection2, i, len = extentLines.length;
      for (i = 0; i < len; i++ ) {
        if (check(line, extentLines[i])) {
          return true;
        }
      }
      return false;
    },

    contains: function(/*Point | Extent*/ geometry) {
      //summary: Returns true if argument point contained within this Extent
      // returns: boolean: true if contained, else false
      if (!geometry) {
        return false;
      }

      var type = geometry.type;
      switch(type) {
        case "point":
          return geometry.x >= this.xmin && geometry.x <= this.xmax && geometry.y >= this.ymin && geometry.y <= this.ymax;
        case "extent":
          return this._containsExtent(geometry);
      }
      return false;
    },
    
    _containsExtent: function(extent) {
      var xmin = extent.xmin, ymin = extent.ymin,
          xmax = extent.xmax, ymax = extent.ymax,
          pt1 = new esri.geometry.Point(xmin, ymin),
          pt2 = new esri.geometry.Point(xmin, ymax),
          pt3 = new esri.geometry.Point(xmax, ymax),
          pt4 = new esri.geometry.Point(xmax, ymin);
      
      if (this.contains(pt1) && this.contains(pt2) && this.contains(pt3) && this.contains(pt4)) {
        return true;
      }
      return false;
    },

		union: function(/*esri.geometry.Extent*/ extent) {
			//summary: Returns the union of this and argument Extents
			// returns: esri.geometry.Extent: unioned Extent
			return new esri.geometry.Extent(Math.min(this.xmin, extent.xmin), Math.min(this.ymin, extent.ymin), Math.max(this.xmax, extent.xmax), Math.max(this.ymax, extent.ymax), this.spatialReference);
		},
		
		getExtent: function() {
		  //summary: esri.geometry.Extent: Returns a copy of this extent object
      var sr = this.spatialReference;
      
			return new esri.geometry.Extent(
        this.xmin, this.ymin, 
        this.xmax, this.ymax, 
        sr && new esri.SpatialReference(sr.toJson())
      );
		},

//    toString: function() {
//      return this.declaredClass + "(" + this.xmin + ", " + this.ymin + ", " + this.xmax + ", " + this.ymax + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    },

    _shiftCM: function(info) {
      // Shift the central meridian if necessary and adjust the
      // extent accordingly
      
      if (!this._shifted) {
        var EG = esri.geometry, newExtent = EG.fromJson(this.toJson()), 
            sr = newExtent.spatialReference;
        
        info = info || sr._getInfo();
        if (info) {
          var newMeridian = this._getCM(info);
          
          if (newMeridian) {
            // Adjust extent
            var meridianInDeg = sr._isWebMercator() ? EG.webMercatorToGeographic(newMeridian) : newMeridian;
            newExtent.xmin -= newMeridian.x;
            newExtent.xmax -= newMeridian.x;
            
            // GCS seems to have a problem with CM > 720
            if (!sr._isWebMercator()) {
              meridianInDeg.x = this._normalizeX(meridianInDeg.x, info).x;
            }
  
            // Set central meridian via WKT
            //newExtent.spatialReference.wkt = info.wkTemplate.replace(/\[\"Central_Meridian\",[^\]]+\]/, "\[\"Central_Meridian\"," + meridianInDeg.x + "\]");
            newExtent.spatialReference.wkt = esri.substitute({ Central_Meridian: meridianInDeg.x }, sr.wkid === 4326 ? info.altTemplate : info.wkTemplate);
            newExtent.spatialReference.wkid = null;
          }
        }
        
        this._shifted = newExtent;
      }
      
      return this._shifted;
    },
    
    _getCM: function(info) {
      // Returns a new central meridian if the extent
      // intersects beyond +/- 180 span
      
      var newMeridian, minus180 = info.valid[0], plus180 = info.valid[1],
          xmin = this.xmin, xmax = this.xmax;
      
      //if ( this.getWidth() <= (2 * plus180) ) {
        var isMinValid = (xmin >= minus180 && xmin <= plus180),
            isMaxValid = (xmax >= minus180 && xmax <= plus180);
        // TODO
        // We can normalize xmin and xmax before doing
        // this comparison coz we dont have to shift CM
        // for an extent which when normalized does not
        // cross 180
            
        if (!(isMinValid && isMaxValid)) {
          newMeridian = this.getCenter();
        }
      //}
      
      //console.log("_getCM: ", newMeridian && newMeridian.x);
      
      return newMeridian;
    },
    
    _normalize: function(shift, sameType, info) {
      // Returns normalized extent or a polygon with two rings
      // TODO
      // Add test cases
      
      var EG = esri.geometry, newExtent = EG.fromJson(this.toJson()), 
          sr = newExtent.spatialReference;
      
      if (sr) {
        info = info || sr._getInfo();
        if (info) {
          
          var extents = dojo.map(this._getParts(info), function(part) {
            return part.extent;
          });    
          
          if (extents.length > 2) {
            if (shift) {
              return this._shiftCM(info);
            }
            else {
              // _getParts returns more than 2 extents for graphics pipeline.
              // We dont need them here. In this case, it is the entire world
              return newExtent.update(info.valid[0], newExtent.ymin, info.valid[1], newExtent.ymax, sr);
            }
          }
          else if (extents.length === 2) {
            // Let's convert the extent to polygon only
            // when necessary
            if (shift) {
              return this._shiftCM(info);
            }
            else {
              return sameType ? extents : new EG.Polygon({
                "rings": dojo.map(extents, function(extent) {
                  return [ 
                    [ extent.xmin, extent.ymin ], [ extent.xmin, extent.ymax ], 
                    [ extent.xmax, extent.ymax ], [ extent.xmax, extent.ymin ],
                    [ extent.xmin, extent.ymin ] 
                  ];
                }),
                "spatialReference": sr
              });
            }
          }
          else {
            return extents[0] || newExtent;
          }
          
        } // info
      } // sr

      return newExtent;
    },
    
    _getParts: function(info) {
      // Split this extent into one or more valid
      // extents (parts) if necessary. Also return 
      // the world frames that these parts intersect
      
      if (!this._parts) {
        var xmin = this.xmin, xmax = this.xmax, 
            ymin = this.ymin, ymax = this.ymax, sr = this.spatialReference,
            linearWidth = this.getWidth(), linearXmin = xmin, linearXmax = xmax,
            minFrame = 0, maxFrame = 0, nrml, parts = [], minus180, plus180, nexus;
        
        info = info || sr._getInfo();
        minus180 = info.valid[0];
        plus180 = info.valid[1];
  
        nrml = this._normalizeX(xmin, info);
        xmin = nrml.x;
        minFrame = nrml.frameId;
        
        nrml = this._normalizeX(xmax, info);
        xmax = nrml.x;
        maxFrame = nrml.frameId;
        
        nexus = (xmin === xmax && linearWidth > 0);
  
  //      console.log(xmin, xmax, minFrame, maxFrame);
        
        if (linearWidth > (2 * plus180)) { // really wide extent!
          var E1 = new esri.geometry.Extent(linearXmin < linearXmax ? xmin : xmax, ymin, plus180, ymax, sr),
              E2 = new esri.geometry.Extent(minus180, ymin, linearXmin < linearXmax ? xmax : xmin, ymax, sr),
              E3 = new esri.geometry.Extent(0, ymin, plus180, ymax, sr),
              E4 = new esri.geometry.Extent(minus180, ymin, 0, ymax, sr),
              k, framesE3 = [], framesE4 = []; //, countE3 = 0, countE4 = 0;
              
          if (E1.contains(E3)) {
            //countE3++;
            framesE3.push(minFrame);
          }
          if (E1.contains(E4)) {
            //countE4++;
            framesE4.push(minFrame);
          }
          if (E2.contains(E3)) {
            //countE3++;
            framesE3.push(maxFrame);
          }
          if (E2.contains(E4)) {
            //countE4++;
            framesE4.push(maxFrame);
          }
          
          for (k = minFrame + 1; k < maxFrame; k++) {
            //countE3++;
            //countE4++;
            framesE3.push(k);
            framesE4.push(k);
          }
          
          parts.push(
            { extent: E1, frameIds: [ minFrame ] }, 
            { extent: E2, frameIds: [ maxFrame ] }, 
            { extent: E3, frameIds: framesE3 }, 
            { extent: E4, frameIds: framesE4 }
          );
        }
        else if ((xmin > xmax) || nexus) { // extent crosses dateline (partly invalid)
          parts.push(
            {
              extent: new esri.geometry.Extent(xmin, ymin, plus180, ymax, sr),
              frameIds: [ minFrame ]
            }, 
            {
              extent: new esri.geometry.Extent(minus180, ymin, xmax, ymax, sr),
              frameIds: [ maxFrame ]
            }
          );
        }
        else { // a valid extent
          parts.push({
            extent: new esri.geometry.Extent(xmin, ymin, xmax, ymax, sr),
            frameIds: [ minFrame ]
          });
        }
        
        /*console.log("_normalize:");
        dojo.forEach(parts, function(part) {
          console.log(dojo.toJson(part.extent.toJson()), part.count, part.frameIds);
        });*/
       
        this._parts = parts;
      }
      
      return this._parts;
    },
    
    _normalizeX: function(x, info) {
      // Shifts "x" to within +/- 180 span
      // Calculates the world frame where "x" lies (Point::normalize does not do this)
      
      /*// Test cases:
      var info, res;
      info = esri.SpatialReference.prototype._info["4326"];
      res = esri.geometry.Extent.prototype._normalizeX(-200, info);
      console.log(res.x === 160, res.frameId === -1);
      res = esri.geometry.Extent.prototype._normalizeX(-528, info);
      console.log(res.x === -168, res.frameId === -1);
      res = esri.geometry.Extent.prototype._normalizeX(-1676, info);
      console.log(res.x === 124, res.frameId === -5);
      res = esri.geometry.Extent.prototype._normalizeX(-181, info);
      console.log(res.x === 179, res.frameId === -1);
      res = esri.geometry.Extent.prototype._normalizeX(250, info);
      console.log(res.x === -110, res.frameId === 1);
      res = esri.geometry.Extent.prototype._normalizeX(896, info);
      console.log(res.x === 176, res.frameId === 2);
      res = esri.geometry.Extent.prototype._normalizeX(181, info);
      console.log(res.x === -179, res.frameId === 1);
      res = esri.geometry.Extent.prototype._normalizeX(2346, info);
      console.log(res.x === -174, res.frameId === 7);*/
      
      var frameId = 0, minus180 = info.valid[0], plus180 = info.valid[1], world = 2 * plus180, ratio;
      
      if (x > plus180) {
        /*while (x > plus180) {
          x -= world;
          frameId++;
        }*/
        ratio = Math.ceil(Math.abs(x - plus180) / world);
        x -= (ratio * world);
        frameId = ratio;
      }
      else if (x < minus180) {
        /*while (x < minus180) {
          x += world;
          frameId--;
        }*/
        ratio = Math.ceil(Math.abs(x - minus180) / world);
        x += (ratio * world);
        frameId = -ratio;
      }

      return { x: x, frameId: frameId };
    },

    toJson: function() {
      var json = { xmin: this.xmin, ymin: this.ymin, xmax: this.xmax, ymax: this.ymax },
          sr = this.spatialReference;
      if (sr) {
        json.spatialReference = sr.toJson();
      }
      return json;
    }
  }
);

dojo.declare("esri.geometry.Rect", esri.geometry.Geometry, {
    constructor: function(/*Number or Object*/ json, /*Number*/ y, /*Number*/ width, /*Number*/ height, /*esri.SpatialReference*/ spatialReference) {
      //summary: Create a new Rectangle object with top-left point ( x, y ) and width
      //         and height of rectangle
      // json: Number or Object: x coordinate of top-left point or { x, y, width, id, spatialReference } object
      // y: Number: y coordinate of top-left point
      // width: Number: width of rectangle
      // height: Number: height of rectangle
      // spatialReference: esri.SpatialReference: spatial reference well-known-id
      dojo.mixin(this, dojox.gfx.defaultRect);
      if (dojo.isObject(json)) {
        dojo.mixin(this, json);
        this.spatialReference = new esri.SpatialReference(this.spatialReference);
      }
      else {
        this.x = json;
        this.y = y;
        this.width = width;
        this.height = height;
        this.spatialReference = spatialReference;
      }
    },

    getCenter: function() {
      //summary: Get center point of Rect
      // returns: esri.geometry.Point: Center point of rectangle
      return new esri.geometry.Point(this.x + this.width/2, this.y + this.height/2, this.spatialReference);
    },

		offset: function(/*Number*/ ox, /*Number*/ oy) {
			//summary: esri.geometry.Extent: Return new extent object by offsetting by
      //         argument x and y
      // ox: Number: Offset x distance
      // oy: Number: Offset y distance
      // returns: esri.geometry.Extent: Returns offsetted extent object
      return new esri.geometry.Rect(this.x + ox, this.y + oy, this.width, this.height, this.spatialReference);
		},

    intersects: function(/*esri.geometry.Rect*/ rect) {
      //summary: Return true if argument Rect intersects this Rect
      // returns: boolean: true if intersects, else false
      if ((rect.x + rect.width) <= this.x) {
        return false;
      }
      if ((rect.y + rect.height) <= this.y) {
        return false;
      }
      if (rect.y >= (this.y + this.height)) {
        return false;
      }
      if (rect.x >= (this.x + this.width)) {
        return false;
      }
    
      return true;
    },

    getExtent: function() {
      return esri.geometry._rectToExtent(this);
    },

//    contains: function(/*esri.geometry.Point*/ point) {
//      //summary: Return true if argument Point is fully contained within this Rect
//      // returns: boolean: true if contained, else false
//      return point !== null && point.x >= this.x && point.x <= (this.x + this.width) && point.y >= this.y && point.y <= (this.y + this.height);
//    },
//
//      union: function(/*esri.geometry.Rect*/ rect) {
//        //summary: Returns the union of this and argument Rects
//        // returns: esri.geometry.Rect: unioned Rect
//        var x = Math.min(this.x, rect.x);
//        var y = Math.min(this.y, rect.y);
//        var r = Math.max(this.x + this.width, rect.x + rect.width);
//        var b = Math.max(this.y + this.height, rect.y + rect.height);
//        return new esri.geometry.Rect(x, y, r - x, b - y, this.spatialReference);
//      },

    update: function(x, y, width, height, spatialReference) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.spatialReference = spatialReference;
      return this;
    } //,

//    toString: function() {
//      return this.declaredClass + "(" + this.x + ", " + this.y + ", " + this.width + ", " + this.height + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    }
  }
);

//dojo.declare("esri.geometry.Image", esri.geometry.Geometry, {
//    constructor: function(/*Number or Object*/ json, /*Number*/ y, /*Number*/ width, /*Number*/ height, /*String*/ src, /*esri.SpatialReference*/ spatialReference) {
//      //summary: Create a new Image object
//      // json: Number or Object: X coordinate of top-left point of image or { x, y, width, height, src, spatialReference } object
//      // y: Number: Y coordinate of top-left point of image
//      // width: Number: Width of image
//      // height: Number: Height of image
//      // src: String: Path to image
//      // spatialReference: esri.SpatialReference: spatial reference well-known-id
//      dojo.mixin(this, dojox.gfx.defaultImage);
//      if (dojo.isObject(json)) {
//        dojo.mixin(this, json);
//        this.spatialReference = new esri.SpatialReference(this.spatialReference);
//      }
//      else {
//        this.x = json;
//        this.y = y;
//        this.width = width; //in map units
//        this.height = height; //in map units
//        this.src = src;
//        this.spatialReference = spatialReference;
//      }
//    },
//
//    toString: function() {
//      return this.declaredClass + "(" + this.src + ", " + this.x + ", " + this.y + ", " + this.width + ", " + this.height + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    }
//  }
//);
//
//dojo.declare("esri.geometry.Line", esri.geometry.Geometry, {
//    constructor: function(/*Number or Object*/ x1, /*Number*/ y1, /*Number*/ x2, /*Number*/ y2, /*esri.SpatialReference*/ spatialReference) {
//      //summary: Create a new Line object
//      // x1: Number or Object: X coordinate of starting point or { x1, y1, x2, y2, spatialReference } object
//      // y1: Number: Y coordinate of starting point
//      // x2: Number: X coordinate of ending point
//      // y2: Number: Y coordinate of ending point
//      // spatialReference: esri.SpatialReference: spatial reference well-known-id
//      dojo.mixin(this, dojox.gfx.defaultLine);
//      if (dojo.isObject(x1)) {
//        dojo.mixin(this, x1);
//      }
//      else {
//        this.x1 = x1;
//        this.y1 = y1;
//        this.x2 = x2;
//        this.y2 = y2;
//        this.spatialReference = spatialReference;
//      }
//      this.spatialReference = new esri.SpatialReference(this.spatialReference);
//    },
//
//    /*getLength: function() {
//      //summary: Returns the length of this line
//      //returns: double: length of line
//      return esri.geometry.getLength([x1, y1], [x2, y2]);
//    },*/
//
//    toString: function() {
//      return this.declaredClass + "(" + this.x1 + ", " + this.y1 + " - " + this.x2 + ", " + this.y2 + (this.spatialReference ? ", " + this.spatialReference : "");
//    }
//  }
//);
//
//dojo.declare("esri.geometry.Ellipse", esri.geometry.Geometry, {
//    constructor: function(/*Number or Object*/ cx, /*Number*/ cy, /*Number*/ rx, /*Number*/ ry, /*esri.SpatialReference*/ spatialReference) {
//      //summary: Create a new Ellipse object
//      // cx: Number of Object: X coordinate of center of ellipse or { cx, cy, rx, ry, spatialReference } object
//      // cy: Number: Y coordinate of center of ellipse
//      // rx: Number: Radius of ellipse along x axis
//      // ry: Number: Radius of ellipse along y axis
//      // spatialReference: esri.SpatialReference: spatial reference well-known-id
//      dojo.mixin(this, dojox.gfx.defaultEllipse);
//      if (dojo.isObject(cx)) {
//        dojo.mixin(this, cx);
//        this.spatialReference = new esri.SpatialReference(this.spatialReference);
//      }
//      else {
//        this.cx = cx;
//        this.cy = cy;
//        this.rx = rx;
//        this.ry = ry;
//        this.spatialReference = spatialReference;
//      }
//    },
//
//    toString: function() {
//      return this.declaredClass + "(" + this.cx + ", " + this.cy + " " + this.rx + ", " + this.ry + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    }
//  }
//);
//
//dojo.declare("esri.geometry.Circle", esri.geometry.Geometry, {
//    constructor: function(/*Number or Object*/ cx, /*Number*/ cy, /*Number*/ r, /*esri.SpatialReference*/ spatialReference) {
//      //summary: Create a new Circle object
//      // cx: Number or Object: X coordinate of center of circle or { cx, cy, r, spatialReference } object
//      // cy: Number: Y coordinate of center of circle
//      // r: Number: Radius of circle
//      // spatialReference: esri.SpatialReference: spatial reference well-known-id
//      dojo.mixin(this, dojox.gfx.defaultCircle);
//      if (dojo.isObject(cx)) {
//        dojo.mixin(this, cx);
//        this.spatialReference = new esri.SpatialReference(this.spatialReference);
//      }
//      else {
//        this.cx = cx;
//        this.cy = cy;
//        this.r = r;
//        this.spatialReference = spatialReference;
//      }
//    },
//
//    toString: function() {
//      return this.declaredClass + "(" + this.cx + ", " + this.cy + " " + this.r + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    }
//  }
//);
});

},
'esri/fx':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!dojo/fx"], function(dijit,dojo,dojox){
dojo.provide("esri.fx");

dojo.require("dojo.fx");

esri.fx.animateRange = function(/*Object*/ args) {
  //summary: Returns an animation for animating numbers in a given range
  // args: Object: Parameters for creating range animation
  //     : range: Object: Object representing range for start and end
  //     : range.start: Number: Starting of range
  //     : range.end: Number: End of range
  var range = args.range;
  return new dojo._Animation(dojo.mixin({
    curve:new dojo._Line(range.start, range.end)
  }, args));
};

esri.fx.resize = function(/*Object*/ args) {
  //summary: Returns an animation for resizing args.node.
  //  args: Object: Parameters for creating resize animation
  //      : node: DOMNode: Node to be resized
  //      : start: {left,top,width,height}: Start dimesions for node resizing. Overrides dimensions of node
  //      : end: {left,top,width,height}: End dimesions for node resizing. Overrides args.size and args.anchor
  //      : anchor: {x,y}: Point to be used as anchor point for resizing. If no anchor is specified and using size, the top-left of the node will be used as anchor
  //      : size: {width,height}: Ending width and height of node

  var node = (args.node = dojo.byId(args.node)),
  start = args.start,
  end = args.end;

  if (! start) {
    var mb = dojo._getMarginBox(node),
    pb = dojo._getPadBorderExtents(node);
    start = (args.start = { left:mb.l + pb.l, top:mb.t + pb.t, width:mb.w - pb.w, height:mb.h - pb.h });
  }

  if (! end) {
    var anchor = args.anchor ? args.anchor : { x:start.left, y:start.top },
    size = args.size;
    end = args.end = { left:(start.left - ((size.width - start.width) * (anchor.x - start.left) / start.width)),
                 top:(start.top - ((size.height - start.height) * (anchor.y - start.top) / start.height)),
                 width:size.width,
                 height:size.height };
  }

  return dojo.animateProperty(dojo.mixin({
		properties: {
      left: { start:start.left, end:end.left },
			top: { start:start.top, end:end.top },
      width: { start:start.width, end:end.width },
      height: { start:start.height, end:end.height }
		}
	}, args));
};

esri.fx.slideTo = function(/*Object?*/ args){
	// summary
	//		Returns an animation that will slide "node" 
	//		defined in args Object from its current position to
	//		the position defined by (args.left, args.top).

	var node = (args.node = dojo.byId(args.node)),
	    compute = dojo.getComputedStyle,

	    top = null,
	    left = null,

	init = (function(){
		var innerNode = node;
		return function(){
      var pos = innerNode.style.position == "absolute" ? "absolute" : "relative";
			top = (pos == 'absolute' ? node.offsetTop : parseInt(compute(node).top) || 0);
			left = (pos == 'absolute' ? node.offsetLeft : parseInt(compute(node).left) || 0);

			if(pos != 'absolute' && pos != 'relative'){
				var ret = dojo.coords(innerNode, true);
				top = ret.y;
				left = ret.x;
				innerNode.style.position="absolute";
				innerNode.style.top=top+"px";
				innerNode.style.left=left+"px";
			}
		};
	})();
	init();

	var anim = dojo.animateProperty(dojo.mixin({
		properties: {
			top: { start: top, end: args.top||0 },
			left: { start: left, end: args.left||0 }
		}
	}, args));
	dojo.connect(anim, "beforeBegin", anim, init);

	return anim; // dojo._Animation
};

esri.fx.flash = function(/*Object*/ args) {
  // summary: Returns any animation to flash args.node background color.
  // node: HTMLElement: The node to flash
  // start?: String: Starting color. Defaults to current background color.
  // end?: String: Ending color. Defaults is "#f00" (red)
  // count?: Number: Number of times to flash. Default is 1
  args = dojo.mixin({ end:"#f00", duration:500, count:1 }, args);
  args.duration /= args.count * 2;

  var node = dojo.byId(args.node),
      start = args.start;
  if (! start) {
    start = dojo.getComputedStyle(node).backgroundColor;
  }
  
  var end = args.end,
      duration = args.duration,
      anims = [],
      base = { node:node, duration:duration };
  for (var i=0, il=args.count; i<il; i++) {
    anims.push(dojo.animateProperty(dojo.mixin({ properties:{ backgroundColor:{ start:start, end:end } } }, base)));
    anims.push(dojo.animateProperty(dojo.mixin({ properties:{ backgroundColor:{ start:end, end:start } } }, base)));
  }
  return dojo.fx.chain(anims);
};
});

},
'esri/main':function(){
define(["dojo", "dojo/i18n!esri/nls/jsapi"], function(dojo, jsapiBundle) {
  // module:
  //    esri/main
  // summary:
  //    This is the package main module for the esri package; it bootstraps the execution environment.


  //dojo.registerModulePath("esri", "../../esri");

  //Declare esri namespace object
  dojo.mixin((typeof window.esri === "undefined") ? (window.esri = {}) : esri, {

    //version
    version: 3.0,
    
    //application base url
    _appBaseUrl: window.location.protocol + "//" + window.location.host + window.location.pathname.substring(0, window.location.pathname.lastIndexOf(window.location.pathname.split("/")[window.location.pathname.split("/").length - 1])),
    
    //Configuration used by JavaScript API.
    config: {
      defaults: {
        //screen DPI
        screenDPI: 96.0,

        geometryService: null,
        kmlService: null,

        map: {
          //default width of map
          width: 400,
          //default height of map
          height: 400,

          //default layer to be displayed on map. If null, no default layer.
          // type: String: Object name of layer
          // url: String: Url to end-point for layer
          // options: Object: All layer options
          // layer: null,
          //default prefix added for all layers, without id, added to the map
          layerNamePrefix: "layer",
          graphicsLayerNamePrefix: "graphicsLayer",

          //position & size of slider on map
          slider: { left: "30px", top: "30px", width:null, height:"200px" },

          //add labels to slider
          //if sliderLabel is null, no labels or ticks will be displayed
          //  labels: Array: Array of labels to be displayed
          //  style: String: Default style for displaying labels
          sliderLabel: { tick:5, labels: null, style: "width:2em; font-family:Verdana; font-size:75%;" },

          //change slider values immediately
          sliderChangeImmediate: true,

          //color of zoom rectangle
          // stroke: { color:[r, g, b, a], width:int }: Stroke data object
          // fill: Array: [r, g, b, a]
          zoomSymbol: { color:[0,0,0,64], outline:{ color:[255,0,0,255], width:1.25, style:"esriSLSSolid" }, style:"esriSFSSolid" },

          //zoomDuration: dojo._Animation.duration: Duration of animation
          zoomDuration: 500,
          //zoomRate: dojo._Animation.rate: Animation frame rate
          zoomRate: 25,

          //duration a map's recentering should take, in milliseconds
          panDuration: 350,
          //slideRate: dojo_Animation.rate: Animation frame rate
          panRate: 25,

          //url to link opened when logo is clicked
          logoLink: "http://www.esri.com"
        },

        io: {
          //default io error handler
          errorHandler: function(error, io) {
            dojo.publish("esri.Error", [ error ]);
          },

          //cross domain post using proxy
          proxyUrl: null,
          alwaysUseProxy: false,

          // Array of servers that have CORS support enabled
          // See: http://mediawikidev.esri.com/index.php/JSAPI/Research/Cross-Origin_Resource_Sharing
          corsEnabledServers: [
            /** Production setup **/
            "www.arcgis.com",
            "tiles.arcgis.com",
            "services.arcgis.com", // Not enabled yet

            /** QA setup **/
            "qaext.arcgis.com",
            "tilesqa.arcgis.com",
            "servicesqa.arcgis.com", // Not enabled yet

            /** Dev setup **/
            "dev.arcgis.com",
            "devext.arcgis.com",
            "tilesdevext.arcgis.com",
            "servicesdev.arcgis.com"
          ],

          // Note that servers don't have protocol - implies CORS enabled
          // for both HTTP and HTTPS
          
          corsDetection: true,
          
          _processedCorsServers: {
            // "<host:port?>": -1/0/1
            // -1 indicates ServerInfo request is in-flight
            //  1 indicates CORS support not available
            //  2 indicates CORS support available
          },

          //post request length
          postLength: 2000,

          //default timeout for all requests
          timeout:60000
        }
      }
    }
  });

  /**********************
   * Mobile OS detection
   **********************/

  var nua = navigator.userAgent, match;
  //esri.isiPhone = esri.isAndroid = 0;

  match = nua.match(/(iPhone|iPad|CPU)\s+OS\s+(\d+\_\d+)/i);
  if (match) {
    esri.isiPhone = parseFloat(match[2].replace("_", "."));
  }

  match = nua.match(/Android\s+(\d+\.\d+)/i);
  if (match) {
    esri.isAndroid = parseFloat(match[1]);
  }

  match = nua.match(/Fennec\/(\d+\.\d+)/i);
  if (match) {
    esri.isFennec = parseFloat(match[1]);
  }

  if (nua.indexOf("BlackBerry") >= 0) {
    if (nua.indexOf("WebKit") >= 0) {
      esri.isBlackBerry = 1;
    }
  }

  esri.isTouchEnabled = (esri.isiPhone || esri.isAndroid || esri.isBlackBerry || (esri.isFennec >= 6)) ? true : false;

  /*// Future Work
  if (!esri.isTouchEnabled) {
    // References:
    // http://modernizr.github.com/Modernizr/touch.html
    // http://stackoverflow.com/questions/2607248/optimize-website-for-touch-devices
    esri.isTouchEnabled = "ontouchstart" in document;
  }*/

  esri._getDOMAccessor = function(propName) {
    var prefix = "";

    if (dojo.isFF) {
      prefix = "Moz";
    }
    else if (dojo.isWebKit) {
      prefix = "Webkit";
    }
    else if (dojo.isIE) {
      prefix = "ms";
    }
    else if (dojo.isOpera) {
      prefix = "O";
    }

    return prefix + propName.charAt(0).toUpperCase() + propName.substr(1);
  };

  // See: http://caniuse.com/#search=cross-origin
  esri._hasCors = dojo.isChrome >= 4 || dojo.isFF >= 3.5 || 
                  dojo.isSafari >= 4 || dojo.isIE >= 10;

  // See: 
  // http://www.html5rocks.com/en/tutorials/file/xhr2/
  // https://developer.mozilla.org/En/XMLHttpRequest/Using_XMLHttpRequest#Using_FormData_objects
  // https://developer.mozilla.org/en/DOM/XMLHttpRequest/FormData
  esri._hasFileUpload = window.FormData && window.FileList;

  // TODO
  // See here for discussion related to feature detection:
  // http://hacks.mozilla.org/2011/10/css-3d-transformations-in-firefox-nightly/comment-page-1/#comment-991061
  // Android 2.x bug: http://code.google.com/p/android/issues/detail?id=12451
  // Dojo version sniffing bug in Opera: http://bugs.dojotoolkit.org/ticket/13159
  esri._hasTransforms =   dojo.isIE >= 9 || dojo.isFF >= 3.5 || 
                          dojo.isChrome >= 4 || dojo.isSafari >= 3.1 || 
                          dojo.isOpera >= 10.5 || 
                          esri.isiPhone >= 3.2 || esri.isAndroid >= 2.1;

  esri._hasTransitions =  dojo.isIE >= 10 || dojo.isFF >= 4 || 
                          dojo.isChrome >= 4 || dojo.isSafari >= 3.1 || 
                          dojo.isOpera >= 10.5 || 
                          esri.isiPhone >= 3.2 || esri.isAndroid >= 2.1;

  esri._has3DTransforms = dojo.isIE >= 11 || dojo.isFF >= 10 || 
                          dojo.isChrome >= 12 || dojo.isSafari >= 4 || 
                          esri.isiPhone >= 3.2 || esri.isAndroid >= 3;

  // ========== Internet Explorer Notes ==========
  // Looks like 3D Transform is only supported in IE 10 Developer Preview.
  // Not in Platform Preview. Developer Preview is available only with Windows 8.
  // Still 3D Transforms scale image in a peculiar manner such that images
  // appear watered down and wobble when scaling over multiple map levels

  // ========== Chrome Bug ==========
  // Technically Chrome supports 3D Transforms since version 12, but has the 
  // following problem identified in v15:
  // Overall there are 3 unique issues:
  // 1) Navigating from one feature to the next in the popup does not set proper 
  //    scrollbar height - unless you pan the map while the popup is open with 
  //    scrollbar leaking out. This issue is fixed by the txSuffix workaround
  //    described below in esri._css scope.
  // 2) On Windows, the scrollbar is invisible or very transparent so that users
  //    dont see them, But can be clicked or dragged
  // 3) Dragging the scrollbar or using mouse wheel does not scroll the popup
  //    content
  // Chrome at version 17 seems to have fixed issues #2 and #3 above.
  // Note: 15.0.874.121 m is the stable version at the time of this writing, and
  // 17.0.942.0 dev-m is the dev version.
  // Note: 15.0.874.121 m with 2D transform flickers when opening a new tab
  // and begin to zoom in.

  // ========== Android Bug ==========
  // Catch the case where Android Browser identifies itself as Safari as well
  // i.e. both isSafari and isAndroid will be true.
  // Android 2.x bug: http://code.google.com/p/android/issues/detail?id=12451
  if (esri.isAndroid < 3) {
    esri._hasTransforms = esri._hasTransitions = esri._has3DTransforms = false;
  }

  esri._css = function(force3D) {
    var has3D = esri._has3DTransforms;

    // Override to force 3D
    if (esri._isDefined(force3D)) {
      has3D = force3D;
    }
    // Override to disable 3D on some versions of Chrome and Safari on Desktop
    else if (has3D) {
      // Adelheid reported some issues in Safari:
      //   a duplicate focus highlight below find input box
      //   text leaking outside the textbox in "Share" dialog etc
      if ((dojo.isChrome /*&& dojo.isChrome < 17*/) || (dojo.isSafari && !esri.isiPhone)) {
          has3D = false;
      }
      // As of this writing, Chrome scrollbar bug is not fixed at "18.0.1010.0 canary"
      // Let's always do 2D in Chrome.
    }

    var txPrefix = has3D ? "translate3d(" : "translate(",
        txSuffix = has3D ? (dojo.isChrome ? ",-1px)" : ",0px)") : ")",
        scalePrefix = has3D ? "scale3d(" : "scale(",
        scaleSuffix = has3D ? ",1)" : ")",
        rotPrefix = has3D ? "rotate3d(0,0,1," : "rotate(",
        matrixPrefix = has3D ? "matrix3d(" : "matrix(",
        matrixC1 = has3D ? ",0,0," : ",",
        matrixC2 = has3D ? ",0,0,0,0,1,0," : ",",
        matrixSuffix = has3D ? ",0,1)" : ")";

    // Background info on txSuffix (scrollFix):
    // Workaround for a Chrome bug where children and grand-children of the  
    // parent of a 3d-translated element have messed-up scrollbars.
    //   3d-translated element = map layers
    //   parent = map container
    //   one of the children = Popup contentPane
    // Observed in Chrome 15.0.874.121 m (Win and Mac)
    // Test case: 
    // http://pponnusamy.esri.com:9090/jsapi/mapapps/testing/map/transforms/chrome-scrollbar-bug.html
    // Discussion:
    // http://stackoverflow.com/questions/6810174/z-index-on-position-fixed-in-webkit-nightly
    // https://bugs.webkit.org/show_bug.cgi?id=56917

    return {
      // Reference:
      // https://developer.mozilla.org/en/CSS/CSS_transitions
      // http://www.opera.com/docs/specs/presto25/css/transitions/#events
      names: {
        transition:    (dojo.isWebKit && "-webkit-transition") || (dojo.isFF && "MozTransition") || 
                       (dojo.isOpera && "OTransition") || (dojo.isIE && "msTransition"),

        transform:     (dojo.isWebKit && "-webkit-transform") || (dojo.isFF && "MozTransform") || 
                       (dojo.isOpera && "OTransform") || (dojo.isIE && "msTransform"),

        transformName: (dojo.isWebKit && "-webkit-transform") || (dojo.isFF && "-moz-transform") || 
                       (dojo.isOpera && "-o-transform") || (dojo.isIE && "-ms-transform"),

        origin:        (dojo.isWebKit && "-webkit-transform-origin") || (dojo.isFF && "MozTransformOrigin") || 
                       (dojo.isOpera && "OTransformOrigin") || (dojo.isIE && "msTransformOrigin"),

        endEvent:      (dojo.isWebKit && "webkitTransitionEnd") || (dojo.isFF && "transitionend") || 
                       (dojo.isOpera && "oTransitionEnd") || (dojo.isIE && "MSTransitionEnd")
      },

      translate: function(x, y) {
        return txPrefix + x + "px," + y + "px" + txSuffix;
      },

      scale: function(factor) {
        return scalePrefix + factor + "," + factor + scaleSuffix;
      },

      rotate: function(angle) {
        return rotPrefix + angle + "deg)";
      },

      matrix: function(m) {
        // http://www.w3.org/TR/css3-3d-transforms/#transform-functions
        // http://www.useragentman.com/blog/2011/01/07/css3-matrix-transform-for-the-mathematically-challenged/
        // http://www.useragentman.com/matrix/
        // http://www.eleqtriq.com/2010/05/css-3d-matrix-transformations/
        // http://www.eleqtriq.com/2010/05/understanding-css-3d-transforms/
        // http://developer.apple.com/library/safari/#documentation/InternetWeb/Conceptual/SafariVisualEffectsProgGuide/Transforms/Transforms.html
        // http://9elements.com/html5demos/matrix3d/
        // Firefox does not accept unitless values for dx and dy: https://developer.mozilla.org/en/CSS/-moz-transform#matrix
        return matrixPrefix + m.xx + "," + m.xy + matrixC1 +  
               m.yx + "," + m.yy + matrixC2 + 
               m.dx.toFixed(10) + (dojo.isFF ? "px," : ",") + m.dy.toFixed(10) + (dojo.isFF ? "px" : "") +
               matrixSuffix;

        // Without toFixed above for dx and dy, transforms will silently fail if
        // the values contain "e" (exponent notation) in them

        /*return "matrix(" +
               m.xx + "," + m.xy + "," + m.yx + "," + m.yy + "," + m.dx + "," + m.dy +
               ")";*/
      }
    };
  };

  //deprecated (remove at v2.0)
  esriConfig = esri.config;


  //load css files
  var h = document.getElementsByTagName("head")[0],
      //list of css files to be included (in specified order)
      csss = [
        dojo.moduleUrl("esri") + "../../css/jsapi.css", //map
        dojo.moduleUrl("esri") + "dijit/css/InfoWindow.css" //info window
      ],
      attr = { rel:"stylesheet", type:"text/css", media:"all" };

  dojo.forEach(csss, function(css) {
    // Do not expect that css.toString() will be called.
    // See IE 8 remark at the bottom of this page:
    // http://msdn.microsoft.com/en-us/library/ms536739%28VS.85%29.aspx
    // dojo.create -> dojo.attr -> node.setAttribute(...)
    attr.href = css.toString();
    dojo.create("link", attr, h);
  });
  
  // Various widgets and classes expect localized string bundles to be 
  // available via esri.bundle object
  esri.bundle = jsapiBundle;


  /*dojo.addOnLoad(function() {

    if (esri.IdentityManager) {
      //console.log("Instantiating identity manager...");
      esri.id = new esri.IdentityManager();
    }*/

    // See: 
    // http://ejohn.org/blog/ecmascript-5-objects-and-properties/
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/defineProperty
    // http://blogs.msdn.com/b/ie/archive/2009/01/13/responding-to-change-updated-getter-setter-syntax-in-ie8-rc-1.aspx
    // http://webreflection.blogspot.com/2011/02/btw-getters-setters-for-ie-6-7-and-8.html
    /*if (Object.defineProperty) {
      Object.defineProperty(esri, "id", { writable: false, configurable: false });
      //console.log("esri.id", dojo.toJson(Object.getOwnPropertyDescriptor(esri, "id")));

      Object.defineProperty(esri.id, "generateToken", { writable: false, configurable: false });
      //console.log("esri.id.generateToken", dojo.toJson(Object.getOwnPropertyDescriptor(esri.id, "generateToken")));

      // TODO
      // Ideally we need to make the following methods un-writable and un-configurable as well:
      // esri.request
      // esri._request
      // dojo.io.script.get
      // dojo.xhrGet
      // dojo.rawXhrPost
      // dojo.xhr
      // ...pretty much any method that gets passed request query parameters for
      // some kind of processing should be frozen as well
    }*/
  //});

  return esri;
});

},
'dojo/date':function(){
define(["./_base/kernel", "./_base/lang"], function(dojo, lang) {
	// module:
	//		dojo/date
	// summary:
	//		TODOC

lang.getObject("date", true, dojo);

/*=====
dojo.date = {
	// summary: Date manipulation utilities
}
=====*/

dojo.date.getDaysInMonth = function(/*Date*/dateObject){
	//	summary:
	//		Returns the number of days in the month used by dateObject
	var month = dateObject.getMonth();
	var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	if(month == 1 && dojo.date.isLeapYear(dateObject)){ return 29; } // Number
	return days[month]; // Number
};

dojo.date.isLeapYear = function(/*Date*/dateObject){
	//	summary:
	//		Determines if the year of the dateObject is a leap year
	//	description:
	//		Leap years are years with an additional day YYYY-02-29, where the
	//		year number is a multiple of four with the following exception: If
	//		a year is a multiple of 100, then it is only a leap year if it is
	//		also a multiple of 400. For example, 1900 was not a leap year, but
	//		2000 is one.

	var year = dateObject.getFullYear();
	return !(year%400) || (!(year%4) && !!(year%100)); // Boolean
};

// FIXME: This is not localized
dojo.date.getTimezoneName = function(/*Date*/dateObject){
	//	summary:
	//		Get the user's time zone as provided by the browser
	// dateObject:
	//		Needed because the timezone may vary with time (daylight savings)
	//	description:
	//		Try to get time zone info from toString or toLocaleString method of
	//		the Date object -- UTC offset is not a time zone.  See
	//		http://www.twinsun.com/tz/tz-link.htm Note: results may be
	//		inconsistent across browsers.

	var str = dateObject.toString(); // Start looking in toString
	var tz = ''; // The result -- return empty string if nothing found
	var match;

	// First look for something in parentheses -- fast lookup, no regex
	var pos = str.indexOf('(');
	if(pos > -1){
		tz = str.substring(++pos, str.indexOf(')'));
	}else{
		// If at first you don't succeed ...
		// If IE knows about the TZ, it appears before the year
		// Capital letters or slash before a 4-digit year
		// at the end of string
		var pat = /([A-Z\/]+) \d{4}$/;
		if((match = str.match(pat))){
			tz = match[1];
		}else{
		// Some browsers (e.g. Safari) glue the TZ on the end
		// of toLocaleString instead of putting it in toString
			str = dateObject.toLocaleString();
			// Capital letters or slash -- end of string,
			// after space
			pat = / ([A-Z\/]+)$/;
			if((match = str.match(pat))){
				tz = match[1];
			}
		}
	}

	// Make sure it doesn't somehow end up return AM or PM
	return (tz == 'AM' || tz == 'PM') ? '' : tz; // String
};

// Utility methods to do arithmetic calculations with Dates

dojo.date.compare = function(/*Date*/date1, /*Date?*/date2, /*String?*/portion){
	//	summary:
	//		Compare two date objects by date, time, or both.
	//	description:
	//  	Returns 0 if equal, positive if a > b, else negative.
	//	date1:
	//		Date object
	//	date2:
	//		Date object.  If not specified, the current Date is used.
	//	portion:
	//		A string indicating the "date" or "time" portion of a Date object.
	//		Compares both "date" and "time" by default.  One of the following:
	//		"date", "time", "datetime"

	// Extra step required in copy for IE - see #3112
	date1 = new Date(+date1);
	date2 = new Date(+(date2 || new Date()));

	if(portion == "date"){
		// Ignore times and compare dates.
		date1.setHours(0, 0, 0, 0);
		date2.setHours(0, 0, 0, 0);
	}else if(portion == "time"){
		// Ignore dates and compare times.
		date1.setFullYear(0, 0, 0);
		date2.setFullYear(0, 0, 0);
	}

	if(date1 > date2){ return 1; } // int
	if(date1 < date2){ return -1; } // int
	return 0; // int
};

dojo.date.add = function(/*Date*/date, /*String*/interval, /*int*/amount){
	//	summary:
	//		Add to a Date in intervals of different size, from milliseconds to years
	//	date: Date
	//		Date object to start with
	//	interval:
	//		A string representing the interval.  One of the following:
	//			"year", "month", "day", "hour", "minute", "second",
	//			"millisecond", "quarter", "week", "weekday"
	//	amount:
	//		How much to add to the date.

	var sum = new Date(+date); // convert to Number before copying to accomodate IE (#3112)
	var fixOvershoot = false;
	var property = "Date";

	switch(interval){
		case "day":
			break;
		case "weekday":
			//i18n FIXME: assumes Saturday/Sunday weekend, but this is not always true.  see dojo.cldr.supplemental

			// Divide the increment time span into weekspans plus leftover days
			// e.g., 8 days is one 5-day weekspan / and two leftover days
			// Can't have zero leftover days, so numbers divisible by 5 get
			// a days value of 5, and the remaining days make up the number of weeks
			var days, weeks;
			var mod = amount % 5;
			if(!mod){
				days = (amount > 0) ? 5 : -5;
				weeks = (amount > 0) ? ((amount-5)/5) : ((amount+5)/5);
			}else{
				days = mod;
				weeks = parseInt(amount/5);
			}
			// Get weekday value for orig date param
			var strt = date.getDay();
			// Orig date is Sat / positive incrementer
			// Jump over Sun
			var adj = 0;
			if(strt == 6 && amount > 0){
				adj = 1;
			}else if(strt == 0 && amount < 0){
			// Orig date is Sun / negative incrementer
			// Jump back over Sat
				adj = -1;
			}
			// Get weekday val for the new date
			var trgt = strt + days;
			// New date is on Sat or Sun
			if(trgt == 0 || trgt == 6){
				adj = (amount > 0) ? 2 : -2;
			}
			// Increment by number of weeks plus leftover days plus
			// weekend adjustments
			amount = (7 * weeks) + days + adj;
			break;
		case "year":
			property = "FullYear";
			// Keep increment/decrement from 2/29 out of March
			fixOvershoot = true;
			break;
		case "week":
			amount *= 7;
			break;
		case "quarter":
			// Naive quarter is just three months
			amount *= 3;
			// fallthrough...
		case "month":
			// Reset to last day of month if you overshoot
			fixOvershoot = true;
			property = "Month";
			break;
//		case "hour":
//		case "minute":
//		case "second":
//		case "millisecond":
		default:
			property = "UTC"+interval.charAt(0).toUpperCase() + interval.substring(1) + "s";
	}

	if(property){
		sum["set"+property](sum["get"+property]()+amount);
	}

	if(fixOvershoot && (sum.getDate() < date.getDate())){
		sum.setDate(0);
	}

	return sum; // Date
};

dojo.date.difference = function(/*Date*/date1, /*Date?*/date2, /*String?*/interval){
	//	summary:
	//		Get the difference in a specific unit of time (e.g., number of
	//		months, weeks, days, etc.) between two dates, rounded to the
	//		nearest integer.
	//	date1:
	//		Date object
	//	date2:
	//		Date object.  If not specified, the current Date is used.
	//	interval:
	//		A string representing the interval.  One of the following:
	//			"year", "month", "day", "hour", "minute", "second",
	//			"millisecond", "quarter", "week", "weekday"
	//		Defaults to "day".

	date2 = date2 || new Date();
	interval = interval || "day";
	var yearDiff = date2.getFullYear() - date1.getFullYear();
	var delta = 1; // Integer return value

	switch(interval){
		case "quarter":
			var m1 = date1.getMonth();
			var m2 = date2.getMonth();
			// Figure out which quarter the months are in
			var q1 = Math.floor(m1/3) + 1;
			var q2 = Math.floor(m2/3) + 1;
			// Add quarters for any year difference between the dates
			q2 += (yearDiff * 4);
			delta = q2 - q1;
			break;
		case "weekday":
			var days = Math.round(dojo.date.difference(date1, date2, "day"));
			var weeks = parseInt(dojo.date.difference(date1, date2, "week"));
			var mod = days % 7;

			// Even number of weeks
			if(mod == 0){
				days = weeks*5;
			}else{
				// Weeks plus spare change (< 7 days)
				var adj = 0;
				var aDay = date1.getDay();
				var bDay = date2.getDay();

				weeks = parseInt(days/7);
				mod = days % 7;
				// Mark the date advanced by the number of
				// round weeks (may be zero)
				var dtMark = new Date(date1);
				dtMark.setDate(dtMark.getDate()+(weeks*7));
				var dayMark = dtMark.getDay();

				// Spare change days -- 6 or less
				if(days > 0){
					switch(true){
						// Range starts on Sat
						case aDay == 6:
							adj = -1;
							break;
						// Range starts on Sun
						case aDay == 0:
							adj = 0;
							break;
						// Range ends on Sat
						case bDay == 6:
							adj = -1;
							break;
						// Range ends on Sun
						case bDay == 0:
							adj = -2;
							break;
						// Range contains weekend
						case (dayMark + mod) > 5:
							adj = -2;
					}
				}else if(days < 0){
					switch(true){
						// Range starts on Sat
						case aDay == 6:
							adj = 0;
							break;
						// Range starts on Sun
						case aDay == 0:
							adj = 1;
							break;
						// Range ends on Sat
						case bDay == 6:
							adj = 2;
							break;
						// Range ends on Sun
						case bDay == 0:
							adj = 1;
							break;
						// Range contains weekend
						case (dayMark + mod) < 0:
							adj = 2;
					}
				}
				days += adj;
				days -= (weeks*2);
			}
			delta = days;
			break;
		case "year":
			delta = yearDiff;
			break;
		case "month":
			delta = (date2.getMonth() - date1.getMonth()) + (yearDiff * 12);
			break;
		case "week":
			// Truncate instead of rounding
			// Don't use Math.floor -- value may be negative
			delta = parseInt(dojo.date.difference(date1, date2, "day")/7);
			break;
		case "day":
			delta /= 24;
			// fallthrough
		case "hour":
			delta /= 60;
			// fallthrough
		case "minute":
			delta /= 60;
			// fallthrough
		case "second":
			delta /= 1000;
			// fallthrough
		case "millisecond":
			delta *= date2.getTime() - date1.getTime();
	}

	// Round for fractional values and DST leaps
	return Math.round(delta); // Number (integer)
};

return dojo.date;
});

},
'esri/renderer':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/graphic,dojo/date"], function(dijit,dojo,dojox){
dojo.provide("esri.renderer");

dojo.require("esri.graphic");
dojo.require("dojo.date");

// Utility method to deserialize a renderer from json
// returned by REST
esri.renderer.fromJson = function(json) {
  var type = json.type || "", renderer;
  switch(type) {
    case "simple":
      renderer = new esri.renderer.SimpleRenderer(json);
      break;
    case "uniqueValue":
      renderer = new esri.renderer.UniqueValueRenderer(json);
      break;
    case "classBreaks":
      renderer = new esri.renderer.ClassBreaksRenderer(json);
      break;
  }
  return renderer;
};

dojo.declare("esri.renderer.Renderer", null, {
    constructor: function() {
      this.getSymbol = dojo.hitch(this, this.getSymbol);
    },
  
    getSymbol: function(graphic) {
      //to be implemented by Renderer
    },
    
    toJson: function() {
      //to be implemented by subclasses
    }
  }
);

dojo.declare("esri.renderer.SimpleRenderer", esri.renderer.Renderer, {
    constructor: function(sym) {
      // 2nd constructor signature added at v2.0:
      // esri.renderer.SimpleRenderer(<Object> json);

      if (sym && !sym.declaredClass) {
        // REST JSON representation
        var json = sym;
        sym = json.symbol;
        
        if (sym) {
          this.symbol = esri.symbol.fromJson(sym);
        }
        
        this.label = json.label;
        this.description = json.description;
      }
      else {
        this.symbol = sym;
      }
      
      /*var className = sym.declaredClass;
      if (className && (className.indexOf("esri.symbol") !== -1)) { // symbol
        this.symbol = sym;
      }
      else { // json
        var json = sym, sym = json.symbol;
        if (sym) {
          this.symbol = esri.symbol.fromJson(sym);
        }
        this.label = json.label;
        this.description = json.description;
      }*/
    },

    getSymbol: function(graphic) {
      return this.symbol;
    },
    
    toJson: function() {
      return esri._sanitize({
        type: "simple",
        label: this.label,
        description: this.description,
        symbol: this.symbol && this.symbol.toJson()
      });
    }
  }
);

dojo.declare("esri.renderer.UniqueValueRenderer", esri.renderer.Renderer, {
    constructor: function(sym, attr, /*Optional*/ attr2, /*Optional*/ attr3, /*Optional*/ fieldDelimiter) {
      // 2nd constructor signature added at v2.0:
      // esri.renderer.UniqueValueRenderer(<Object> json);
      this.values = [];
      this._values = [];
      this.infos = [];
      
      if (sym && !sym.declaredClass) {
        // REST JSON representation
        var json = sym;
        sym = json.defaultSymbol;
        
        if (sym) {
          this.defaultSymbol = esri.symbol.fromJson(sym);
        }
        this.attributeField = json.field1;
        this.attributeField2 = json.field2;
        this.attributeField3 = json.field3;
        this.fieldDelimiter = json.fieldDelimiter;
        this.defaultLabel = json.defaultLabel;
        
        dojo.forEach(json.uniqueValueInfos, this._addValueInfo, this);
      }
      else {
        this.defaultSymbol = sym;
        this.attributeField = attr;
        this.attributeField2 = attr2;
        this.attributeField3 = attr3;
        this.fieldDelimiter = fieldDelimiter;
      }

      /*var className = sym.declaredClass;
      if (className && (className.indexOf("esri.symbol") !== -1)) { // symbol, ...
        this.defaultSymbol = sym;
        this.attributeField = attr;
        this.attributeField2 = attr2;
        this.attributeField3 = attr3;
        this.fieldDelimiter = fieldDelimiter;
      }
      else { // json
        var json = sym, sym = json.defaultSymbol;
        if (sym) {
          this.defaultSymbol = esri.symbol.fromJson(sym);
        }
        this.attributeField = json.field1;
        this.attributeField2 = json.field2;
        this.attributeField3 = json.field3;
        this.fieldDelimiter = json.fieldDelimiter;
        this.defaultLabel = json.defaultLabel;
        dojo.forEach(json.uniqueValueInfos, this._addValueInfo, this);
      }*/
      
      this._multi = (this.attributeField2) ? true : false;
    },
    
    addValue: function(value, symbol) {
      // 2nd method signature added at v2.0:
      // addValue(<Object> info); 
      var info = dojo.isObject(value) ? value : { value: value, symbol: symbol };
      this._addValueInfo(info);
    },
    
    removeValue: function(value) {
      var i = dojo.indexOf(this.values, value);
      if (i === -1) {
        return;
      }
      
      this.values.splice(i, 1);
      delete this._values[value];
      this.infos.splice(i, 1);
    },
    
    getSymbol: function(graphic) {
      if (this._multi) {
        var attributes = graphic.attributes, field1 = this.attributeField, field2 = this.attributeField2, field3 = this.attributeField3;
        var values = [];
        if (field1) {
          values.push(attributes[field1]);
        }
        if (field2) {
          values.push(attributes[field2]);
        }
        if (field3) {
          values.push(attributes[field3]);
        }
        return this._values[values.join(this.fieldDelimiter || "")] || this.defaultSymbol;
      }
      else {
        return this._values[graphic.attributes[this.attributeField]] || this.defaultSymbol;
      }
    },
    
    /*******************
     * Internal Methods
     *******************/
    
    _addValueInfo: function(/*Object*/ info) {
      /*
       * info = {
       *   value: <String>,
       *   symbol: <Symbol | json>,
       *   label: <String>,
       *   description: <String>
       * }
       */
      var value = info.value;
      this.values.push(value);
      this.infos.push(info);
      
      var symbol = info.symbol;
      if (symbol) {
        if (!symbol.declaredClass) { // symbol in its json form?
          info.symbol = esri.symbol.fromJson(symbol);
        }
      }
      this._values[value] = info.symbol;
    },
    
    toJson: function() {
      var sanitize = esri._sanitize;
      return sanitize({
        type: "uniqueValue",
        field1: this.attributeField,
        field2: this.attributeField2,
        field3: this.attributeField3,
        fieldDelimiter: this.fieldDelimiter,
        defaultSymbol: this.defaultSymbol && this.defaultSymbol.toJson(),
        defaultLabel: this.defaultLabel,
        uniqueValueInfos: dojo.map(this.infos || [], function(info) {
          info = dojo.mixin({}, info);
          info.symbol = info.symbol && info.symbol.toJson();
          // http://stackoverflow.com/questions/5765398/whats-the-best-way-to-convert-a-number-to-a-string
          info.value = info.value + "";
          return sanitize(info);
        })
      });
    }
  }
);

dojo.declare("esri.renderer.ClassBreaksRenderer", esri.renderer.Renderer, {
    constructor: function(sym, attr) {
      // 2nd constructor signature added at v2.0:
      // esri.renderer.ClassBreaksRenderer(<Object> json);
      this.breaks = [];
      this._symbols = [];
      this.infos = [];
      
      if (sym && !sym.declaredClass) {
        // REST JSON representation
        var json = sym;
        this.attributeField = json.field;

        sym = json.defaultSymbol;
        if (sym) {
          this.defaultSymbol = esri.symbol.fromJson(sym);
        }
        
        this.defaultLabel = json.defaultLabel;
        
        var min = json.minValue, infos = json.classBreakInfos;
        if (infos && infos[0] && esri._isDefined(infos[0].classMaxValue)) {
          dojo.forEach(infos, function(info) {
            var classMax = info.classMaxValue;
            info.minValue = min;
            info.maxValue = classMax;
            min = classMax;
          }, this);
        }
        
        dojo.forEach(infos, this._addBreakInfo, this);
      }
      else {
        this.defaultSymbol = sym;
        this.attributeField = attr;
      }

      /*var className = sym.declaredClass;
      if (className && (className.indexOf("esri.symbol") !== -1)) { // symbol, ...
        this.defaultSymbol = sym;
        this.attributeField = attr;
      }
      else { // json
        var json = sym;
        this.attributeField = json.field;
        
        var min = json.minValue, infos = json.classBreakInfos;
        if (infos && infos[0] && esri._isDefined(infos[0].classMaxValue)) {
          dojo.forEach(infos, function(info) {
            var classMax = info.classMaxValue;
            info.minValue = min;
            info.maxValue = classMax;
            min = classMax;
          }, this);
        }
        dojo.forEach(infos, this._addBreakInfo, this);
      }*/
    },
    
    addBreak: function(min, max, symbol) {
      // 2nd method signature added at v2.0:
      // addBreak(<Object> info); 
      var info = dojo.isObject(min) ? min : { minValue: min, maxValue: max, symbol: symbol };
      this._addBreakInfo(info);
    },

    removeBreak: function(min, max) {
      var range, ranges = this.breaks,
          i, il = ranges.length,
          _syms = this._symbols;
      for (i=0; i<il; i++) {
        range = ranges[i];
        if (range[0] == min && range[1] == max) {
          ranges.splice(i, 1);
          delete _syms[min + "-" + max];
          this.infos.splice(i, 1);
          break;
        }
      }
    },

    getSymbol: function(graphic) {
      var val = parseFloat(graphic.attributes[this.attributeField]),
          rs = this.breaks,
          i, il = rs.length,
          _syms = this._symbols,
          range, incl = this.isMaxInclusive;
      
      for (i=0; i<il; i++) {
        range = rs[i];
        if (range[0] <= val && (incl ? (val <= range[1]) : (val < range[1])) ) {
          return _syms[range[0] + "-" + range[1]];
        }
      }
      
      return this.defaultSymbol;
    },
    
    /*******************
     * Internal Methods
     *******************/
    
    _setMaxInclusiveness: function(isInclusive) {
      this.isMaxInclusive = isInclusive;
    },
    
    _addBreakInfo: function(/*Object*/ info) {
      /*
       * info = {
       *   minValue: <Number>,
       *   maxValue: <Number>,
       *   symbol: <Symbol | json>,
       *   label: <String>,
       *   description: <String>
       * }
       */
      var min = info.minValue, max = info.maxValue;
      this.breaks.push([min, max]);
      this.infos.push(info);
      
      var symbol = info.symbol;
      if (symbol) {
        if (!symbol.declaredClass) { // symbol in its json form?
          info.symbol = esri.symbol.fromJson(symbol);
        }
      }
      this._symbols[min + "-" + max] = info.symbol;
      
      //this._sort();
    },

    toJson: function() {
      var infos = this.infos || [], sanitize = esri._sanitize;
      var minValue = infos[0] && infos[0].minValue;
      return sanitize({
        type: "classBreaks",
        field: this.attributeField,
        defaultSymbol: this.defaultSymbol && this.defaultSymbol.toJson(),
        defaultLabel: this.defaultLabel,
        minValue: (minValue === -Infinity) ? -Number.MAX_VALUE : minValue,
        classBreakInfos: dojo.map(infos, function(info) {
          info = dojo.mixin({}, info);
          info.symbol = info.symbol && info.symbol.toJson();
          info.classMaxValue = (info.maxValue === Infinity) ? Number.MAX_VALUE : info.maxValue;
          delete info.minValue;
          delete info.maxValue;
          return sanitize(info);
        })
      });
    }
    
    /*_sort: function() {
      this.breaks.sort(function(a, b) {
        var min1 = a[0], min2 = b[0];
        if (min1 < min2) {
          return -1;
        }
        if (min1 > min2) {
          return 1;
        }
        return 0;
      });

      this.infos.sort(function(a, b) {
        var min1 = a.minValue, min2 = b.minValue;
        if (min1 < min2) {
          return -1;
        }
        if (min1 > min2) {
          return 1;
        }
        return 0;
      });
    }*/
  }
);


/********************
 * Temporal Renderer
 ********************/

dojo.declare("esri.renderer.TemporalRenderer", esri.renderer.Renderer, {
  constructor: function(observationRenderer, latestObservationRenderer, trackRenderer, observationAger) {
    this.observationRenderer = observationRenderer;
    this.latestObservationRenderer = latestObservationRenderer;
    this.trackRenderer = trackRenderer;
    this.observationAger = observationAger;
  },

  // Uses internal feature layer members: _getKind, _map
  getSymbol: function(graphic) {
    var featureLayer = graphic.getLayer();
    var kind = featureLayer._getKind(graphic);
    
    var renderer = (kind === 0) ? this.observationRenderer 
                   : (this.latestObservationRenderer || this.observationRenderer);
    
    var symbol = (renderer && renderer.getSymbol(graphic));
    
    // age the symbol for regular observations
    var ager = this.observationAger;
    if (featureLayer.timeInfo && featureLayer._map.timeExtent && 
       (renderer === this.observationRenderer) && ager && symbol) {
      symbol = ager.getAgedSymbol(symbol, graphic);
    }
    
    return symbol;
  }
});


/***************
 * Symbol Agers
 ***************/
 
dojo.declare("esri.renderer.SymbolAger", null, {
  getAgedSymbol: function(symbol, graphic) {
    // to be implemented by subclasses
  },
  
  _setSymbolSize: function(symbol, size) {
    switch(symbol.type) {
      case "simplemarkersymbol":
        symbol.setSize(size);
        break;
      case "picturemarkersymbol":
        symbol.setWidth(size);
        symbol.setHeight(size);
        break;
      case "simplelinesymbol":
      case "cartographiclinesymbol":
        symbol.setWidth(size);
        break;
      case "simplefillsymbol":
      case "picturefillsymbol":
        if (symbol.outline) {
          symbol.outline.setWidth(size);
        }
        break;
    }
  }
});
 
dojo.declare("esri.renderer.TimeClassBreaksAger", esri.renderer.SymbolAger, {
  constructor: function(/*Object[]*/ infos, /*String?*/ timeUnits) {
    /*
     * [
     *   {
     *     minAge: <Number>,
     *     maxAge: <Number>,
     *     color: <dojo.Color>,
     *     size: <Number>,
     *     alpha: <Number>
     *   }
     *   ,...
     * ]
     */
    this.infos = infos;
    this.timeUnits = timeUnits || "day"; // see constants mixin below
    
    // re-arrange infos in incremental order
    infos.sort(function(a, b) {
      if (a.minAge < b.minAge) {
        return -1;
      }
      if (a.minAge > b.minAge) {
        return 1;
      }
      return 0;
    });
  },
  
  // Uses internal feature layer members: _map, _startTimeField
  getAgedSymbol: function(symbol, graphic) {
    var featureLayer = graphic.getLayer(), attributes = graphic.attributes, isDef = esri._isDefined;
    symbol = esri.symbol.fromJson(symbol.toJson());
    
    // get map time
    var mapTimeExtent = featureLayer._map.timeExtent;
    var mapEndTime = mapTimeExtent.endTime;
    if (!mapEndTime) {
      return symbol;
    }
    
    // get timestamp of the graphic
    var featureStartTime = new Date(attributes[featureLayer._startTimeField]);
    
    // find the difference between the above
    var diff = dojo.date.difference(featureStartTime, mapEndTime, this.timeUnits);
    
    // modify symbol based on the class break that the difference falls between
    dojo.some(this.infos, function(info) {
      if (diff >= info.minAge && diff <= info.maxAge) {
        var color = info.color, size = info.size, alpha = info.alpha;
        
        if (color) {
          symbol.setColor(color);
        }
        
        if (isDef(size)) {
          //symbol.setSize(size);
          this._setSymbolSize(symbol, size);
        }
        
        if (isDef(alpha) && symbol.color) {
          symbol.color.a = alpha;
        }
        
        return true;
      } // diff
    }, this);
    
    return symbol;
  }
});

dojo.mixin(esri.renderer.TimeClassBreaksAger, {
  UNIT_DAYS:         "day",         // default
  UNIT_HOURS:        "hour",
  UNIT_MILLISECONDS: "millisecond",
  UNIT_MINUTES:      "minute",
  UNIT_MONTHS:       "month",
  UNIT_SECONDS:      "second",
  UNIT_WEEKS:        "week",
  UNIT_YEARS:        "year"
});
 
dojo.declare("esri.renderer.TimeRampAger", esri.renderer.SymbolAger, {
  constructor: function(/*dojo.Color[]?*/ colorRange, /*Number[]?*/ sizeRange, /*Number[]?*/ alphaRange) {
    this.colorRange = colorRange; // || [ new dojo.Color([0,0,0,0.1]), new dojo.Color([0,0,255,1]) ];
    this.sizeRange = sizeRange; // || [ 2, 10 ];
    this.alphaRange = alphaRange;
  },
  
  // Uses internal feature layer members: _map, _startTimeField
  getAgedSymbol: function(symbol, graphic) {
    var featureLayer = graphic.getLayer(), attributes = graphic.attributes;
    symbol = esri.symbol.fromJson(symbol.toJson());
    
    // get map time
    var mapTimeExtent = featureLayer._map.timeExtent;
    var mapStartTime = mapTimeExtent.startTime, mapEndTime = mapTimeExtent.endTime;
    if (!mapStartTime || !mapEndTime) {
      return symbol;
    }
    mapStartTime = mapStartTime.getTime();
    mapEndTime = mapEndTime.getTime();
    
    // get timestamp of the graphic
    var featureStartTime = new Date(attributes[featureLayer._startTimeField]);
    featureStartTime = featureStartTime.getTime();
    if (featureStartTime < mapStartTime) {
      featureStartTime = mapStartTime;
    }
    
    // find the ratio
    var ratio = (mapEndTime === mapStartTime) ? 
                1 : 
                (featureStartTime - mapStartTime) / (mapEndTime - mapStartTime);
    
    // set size
    var range = this.sizeRange, color, delta;
    if (range) {
      var from = range[0], to = range[1];
      delta = Math.abs(to - from) * ratio;
      
      //symbol.setSize( (from < to) ? (from + delta) : (from - delta) );
      this._setSymbolSize(symbol, (from < to) ? (from + delta) : (from - delta));
    }
    
    // set color
    range = this.colorRange;
    if (range) {
      var fromColor = range[0], toColor = range[1], round = Math.round;
      color = new dojo.Color();
      
      // R
      var fromR = fromColor.r, toR = toColor.r;
      delta = Math.abs(toR - fromR) * ratio;
      color.r = round((fromR < toR) ? (fromR + delta) : (fromR - delta));
      
      // G
      var fromG = fromColor.g, toG = toColor.g;
      delta = Math.abs(toG - fromG) * ratio;
      color.g = round((fromG < toG) ? (fromG + delta) : (fromG - delta));
      
      // B
      var fromB = fromColor.b, toB = toColor.b;
      delta = Math.abs(toB - fromB) * ratio;
      color.b = round((fromB < toB) ? (fromB + delta) : (fromB - delta));
      
      // A
      var fromA = fromColor.a, toA = toColor.a;
      delta = Math.abs(toA - fromA) * ratio;
      color.a = (fromA < toA) ? (fromA + delta) : (fromA - delta);
      
      symbol.setColor(color);
    }
    
    // set alpha for color if available
    color = symbol.color;
    range = this.alphaRange;
    if (range && color) {
      var fromAlpha = range[0], toAlpha = range[1];
      delta = Math.abs(toAlpha - fromAlpha) * ratio;
      
      color.a = (fromAlpha < toAlpha) ? (fromAlpha + delta) : (fromAlpha - delta);
    }
    
    return symbol;
  }
});

});

},
'esri/touchcontainer':function(){
// wrapped by build app
define(["dijit","dojo","dojox"], function(dijit,dojo,dojox){
dojo.provide("esri.touchcontainer");

// Reference:
// Handling Events: http://developer.apple.com/library/IOS/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html
// Safari DOM Additions Reference: http://developer.apple.com/library/safari/#documentation/appleapplications/reference/SafariJSRef/_index.html
// Multitouch Gestures: http://jonoscript.wordpress.com/2010/10/29/game-on-2010-example-code-multitouch-gestures/
// http://www.sitepen.com/blog/2008/07/10/touching-and-gesturing-on-the-iphone/

//all map container functionality
dojo.declare("esri._MapContainer", esri._CoreMap, (function() {
    var connect = dojo.connect,
        disconnect = dojo.disconnect,
        Point = esri.geometry.Point; //local var since Point constructor is used in processEvent
    
    var _CLICK_DURATION = 300;
               
    return {
      constructor: function() {
        this._onTouchStart_connect = connect(this.__container, "ontouchstart", this, this._onTouchStartHandler);
        this._gestureStartConnect = connect(this.__container, "ongesturestart", this, this._onGestureStartHandler);
        
        //this._connects.push(connect(this.__container, "ongesturestart", this, this._onGestureStartHandler));
        this._connects.push(connect(this.__container, "onmouseover", this, this._onMouseOverHandler));       
        this._connects.push(connect(this.__container, "onmouseout",  this, this._onMouseOutHandler));
        this._connects.push(connect(this.__container, "onmousedown", this, this._onMouseDownHandler));
        this._connects.push(connect(this.__container, "onmouseup",   this, this._onMouseUpHandler));
        this._connects.push(connect(this.__container, "onclick",     this, this._onClickHandler));
        
        this._endX = this._endY = 0;
        this._firstTapOn = false;
        this._processDoubleTap = false;
        this._processMultiTouchTap = false;
        this._doubleTapTimeoutObject = false;
        this._doubleTapTimeout = dojo.hitch(this, this._doubleTapTimeout);
      },
      
      _doubleTapTimeout: function() {
        this._firstTapOn = false;
      },

      _cleanUp: function() {
        var i;
        for (i=this._connects.length; i>=0; i--) {
          disconnect(this._connects[i]);
          delete this._connects[i];
        }
        
        disconnect(this._onTouchMoveHandler_connect);
        disconnect(this._onTouchEndHandler_connect);
        disconnect(this._onTouchCancelHandler_connect);
        
        this.inherited("_cleanUp", arguments);
      },
      
      __setClickDuration: function(dur) {        
        this._clickDuration = dur;
      },
      
      __resetClickDuration: function() {        
        this._clickDuration = _CLICK_DURATION;
      },
      
      _processEvent: function(evt) {
        if (evt.type.indexOf("touch") !== -1) {
          if (evt.touches.length === 2) {
            evt.screenPoints = [
              new Point(evt.touches.item(0).pageX - this.position.x, evt.touches.item(0).pageY - this.position.y),
              new Point(evt.touches.item(1).pageX - this.position.x, evt.touches.item(1).pageY - this.position.y)
            ];
            return evt;
          }
          else {
            if (evt.type === "touchstart") {
              evt.screenPoint = new Point(evt.targetTouches.item(0).pageX - this.position.x, evt.targetTouches.item(0).pageY - this.position.y);
            }
            else {
              evt.screenPoint = new Point(evt.changedTouches.item(0).pageX - this.position.x, evt.changedTouches.item(0).pageY - this.position.y);
            }
            evt.mapPoint = this.extent ? this.toMap(evt.screenPoint) : new Point();
            return evt;
          }
        }

        evt.screenPoint = new Point(evt.pageX - this.position.x, evt.pageY - this.position.y);
        evt.mapPoint = this.extent ? this.toMap(evt.screenPoint) : new Point();
        return evt;
      },
      
      _onClickHandler: function(evt) {
        evt = this._processEvent(evt);        
        var dx = Math.abs(this._endX - evt.screenPoint.x);
        var dy = Math.abs(this._endY - evt.screenPoint.y);
        
        // BlackBerry Torch have different coordinates value in the evt of touchend vs onclick. 
        // We need to branch the codes to allow onclick to fire.
        if (esri.isBlackBerry) {
            clearTimeout(this._doubleTapTimeoutObject);
            this._firstTapOn = false;
            // BlackBerry Torch sometimes fire click event while panning. Need to add logic to prevent it.
            if (!this._tmoved) {
              this.onClick(evt);
            }
        }
        else {
          if (dx <= 1 && dy <= 1) {
            var ts = (new Date()).getTime(),
                doDoubleClick = this._clkTS && ((ts - this._clkTS) <= 400),
                diffX = doDoubleClick && Math.abs(this._lastClickX - evt.pageX),
                diffY = doDoubleClick && Math.abs(this._lastClickY - evt.pageY);
            
            clearTimeout(this._doubleTapTimeoutObject);
            this._firstTapOn = false;
            this.onClick(evt);
            
            // iOS browser does not fire a click event during double-tap gesture 
            // However, Android does (atleast on Android 3.2.1 on Xoom). 
            // This disrupts double tap processing on touch-end, thereby preventing
            // onDblClick - and double-tap-to-zoomin action.
            // In Android 2.x we don't get into this if block because dx and dy
            // are usually large. This in itself is strange because why would touchend
            // and click event coords differ by a large amount. However this seems to be
            // fixed in 3.x and hence we get into this if block resulting in cancellation
            // of impending double-tap. Ugly flow.
            // TODO
            // I hate this solution - have to tolerate such hacks until this 
            // module is rewritten. See MSPointerContainer.js for future direction
            if (esri.isAndroid && doDoubleClick && diffX <= 15 && diffY <= 15) {
              this.onDblClick(evt);
              this._processDoubleTap = false;
            }
          }
        }
      },
               
      _onMouseOverHandler: function(evt){
        evt = this._processEvent(evt);
        this.onMouseOver(evt);        
      },
               
      _onMouseOutHandler: function(evt){
        evt = this._processEvent(evt);
        this.onMouseOut(evt);
      },
      
      _onMouseDownHandler: function(evt){
        evt = this._processEvent(evt);
        this.onMouseDown(evt);
      },
      
      _onMouseUpHandler: function(evt){
        evt = this._processEvent(evt);
        this.onMouseUp(evt);
      },
               
      _onTouchStartHandler: function(evt) {
        var fireEnd;
        
        if (this._firstTapOn) {
          // Fix BlackBerry Torch issue, discard second touch start if first touch start established without a touch end.
          if (esri.isBlackBerry) {
            if (this._lastTouchEvent === "touchend") {
              this._processDoubleTap = true;
              clearTimeout(this._doubleTapTimeoutObject);
              this._firstTapOn = false;
              
              // BlackBerry Torch is missing second touchend so we need to properly fire it by calling onTouchEndHandler              
              //this._onTouchEndHandler(evt);
              fireEnd = 1;
            }
          }
          else {
            this._processDoubleTap = true;
            clearTimeout(this._doubleTapTimeoutObject);
            this._firstTapOn = false;
          }
        }
        else {
          this._firstTapOn = true;
          this._doubleTapTimeoutObject = setTimeout(this._doubleTapTimeout, 400);
        }
        
        this._lastTouchEvent = "touchstart";
        
        evt = this._processEvent(evt);
        this._tmoved = false;
        
        disconnect(this._onTouchMoveHandler_connect);
        disconnect(this._onTouchEndHandler_connect);
        disconnect(this._onTouchCancelHandler_connect);
        this._onTouchMoveHandler_connect = connect(this.__container, "ontouchmove", this, this._onTouchMoveHandler);
        this._onTouchEndHandler_connect = connect(this.__container, "ontouchend", this, this._onTouchEndHandler);
        this._onTouchCancelHandler_connect = connect(this.__container, "ontouchcancel", this, this._onTouchEndHandler);
        
        this.onTouchStart(evt);
        
        if (fireEnd) {
          this._onTouchEndHandler(evt);
        }
      },
      
      _onTouchMoveHandler: function(evt) {
        this._tmoved = true;
        this.onTouchMove(this._processEvent(evt));
      },
      
      _onTouchEndHandler: function(evt) {
        disconnect(this._onTouchMoveHandler_connect);
        disconnect(this._onTouchEndHandler_connect);
        disconnect(this._onTouchCancelHandler_connect);

        this._lastTouchEvent = "touchend";
        evt = this._processEvent(evt);
        
        var dx = Math.abs(this._endX - evt.screenPoint.x),
            dy = Math.abs(this._endY - evt.screenPoint.y);
        this._endX = evt.screenPoint.x;
        this._endY = evt.screenPoint.y;
               
        this.onTouchEnd(evt);
        
        if (this._processDoubleTap) {
          if (dx <= 15 && dy <= 15) {
            // This check is to avoid inadvertently zooming-in when:
            // 1. the taps fall far from each other
            // 2. panning rapidly
            this.onDblClick(evt);
          }
          this._processDoubleTap = false;
        }
        /*if (!this._tmoved) {
          this.onClick(evt);
        }*/
      },
      
      _onGestureStartHandler: function(evt) {
        // TODO
        // Ideally we'd want to keep touchstart event wired up so that
        // when a finger is lifted up while pinching, panning still happens.
        // When the whole event inference logic is rewritten we should be
        // able to easily do this.
        disconnect(this._onTouchStart_connect);
        disconnect(this._gestureStartConnect);
        disconnect(this._onTouchMoveHandler_connect);
        disconnect(this._onTouchEndHandler_connect);
        disconnect(this._onTouchCancelHandler_connect);
        
        this._processMultiTouchTap = true;
        
        this._onTouchMoveHandler_connect = connect(this.__container, "ontouchmove", this, this._onGestureTouchMoveHandler);
        this._onTouchEndHandler_connect = connect(this.__container, "ontouchend", this, this._onGestureTouchEndHandler);
        this._onTouchCancelHandler_connect = connect(this.__container, "ontouchcancel", this, this._onGestureTouchEndHandler);
        
        this.onGestureStart(this._processEvent(evt));
      },
      
      _onGestureTouchMoveHandler: function(evt) {
        this._processMultiTouchTap = false;
        
        this.onGestureChange(this._processEvent(evt));
      },
      
      _onGestureTouchEndHandler: function(evt) {
        disconnect(this._onTouchMoveHandler_connect);
        disconnect(this._onTouchEndHandler_connect);
        disconnect(this._onTouchCancelHandler_connect);
        this._onTouchStart_connect = connect(this.__container, "ontouchstart", this, this._onTouchStartHandler);
        this._gestureStartConnect = connect(this.__container, "ongesturestart", this, this._onGestureStartHandler);
        
        if (this._processMultiTouchTap) {
          evt.processMultiTouchTap = true;
          this._processMultiTouchTap = false;
        }
        
        this.onGestureEnd(this._processEvent(evt));
      },
         
      //events
      onClick: function(evt){ 
        this._clkTS = (new Date()).getTime(); 
        this._lastClickX = evt.pageX; 
        this._lastClickY = evt.pageY; 
      },
      
      onMouseOver: function(){},     
      onMouseOut:  function(){},
      onMouseDown: function(){},
      onMouseUp:   function(){},
         
      //touch events
      onTouchStart: function() {},
      onTouchMove: function() {},
      onTouchEnd: function() {},
      
      //gesture events
      onGestureStart: function() {},
      onGestureChange: function() {},
      onGestureEnd: function() {}
    };
  }())
);
});

},
'dojox/gfx/_base':function(){
define("dojox/gfx/_base", ["dojo/_base/lang", "dojo/_base/html", "dojo/_base/Color", "dojo/_base/sniff", "dojo/_base/window",
	    "dojo/_base/array","dojo/dom", "dojo/dom-construct","dojo/dom-geometry"], 
  function(lang, html, Color, has, win, arr, dom, domConstruct, domGeom){
	// module:
	//		dojox/gfx
	// summary:
	//		This module contains common core Graphics API used by different graphics renderers.
	var g = lang.getObject("dojox.gfx", true),
		b = g._base = {};
	/*===== g = dojox.gfx; b = dojox.gfx._base; =====*/
	
	// candidates for dojox.style (work on VML and SVG nodes)
	g._hasClass = function(/*DomNode*/node, /*String*/classStr){
		//	summary:
		//		Returns whether or not the specified classes are a portion of the
		//		class list currently applied to the node.
		// return (new RegExp('(^|\\s+)'+classStr+'(\\s+|$)')).test(node.className)	// Boolean
		var cls = node.getAttribute("className");
		return cls && (" " + cls + " ").indexOf(" " + classStr + " ") >= 0;  // Boolean
	};
	g._addClass = function(/*DomNode*/node, /*String*/classStr){
		//	summary:
		//		Adds the specified classes to the end of the class list on the
		//		passed node.
		var cls = node.getAttribute("className") || "";
		if(!cls || (" " + cls + " ").indexOf(" " + classStr + " ") < 0){
			node.setAttribute("className", cls + (cls ? " " : "") + classStr);
		}
	};
	g._removeClass = function(/*DomNode*/node, /*String*/classStr){
		//	summary: Removes classes from node.
		var cls = node.getAttribute("className");
		if(cls){
			node.setAttribute(
				"className",
				cls.replace(new RegExp('(^|\\s+)' + classStr + '(\\s+|$)'), "$1$2")
			);
		}
	};

	// candidate for dojox.html.metrics (dynamic font resize handler is not implemented here)

	//	derived from Morris John's emResized measurer
	b._getFontMeasurements = function(){
		//	summary:
		//		Returns an object that has pixel equivilents of standard font
		//		size values.
		var heights = {
			'1em': 0, '1ex': 0, '100%': 0, '12pt': 0, '16px': 0, 'xx-small': 0,
			'x-small': 0, 'small': 0, 'medium': 0, 'large': 0, 'x-large': 0,
			'xx-large': 0
		};
		var p;

		if(has("ie")){
			//	we do a font-size fix if and only if one isn't applied already.
			//	NOTE: If someone set the fontSize on the HTML Element, this will kill it.
			win.doc.documentElement.style.fontSize="100%";
		}

		//	set up the measuring node.
		var div = domConstruct.create("div", {style: {
				position: "absolute",
				left: "0",
				top: "-100px",
				width: "30px",
				height: "1000em",
				borderWidth: "0",
				margin: "0",
				padding: "0",
				outline: "none",
				lineHeight: "1",
				overflow: "hidden"
			}}, win.body());

		//	do the measurements.
		for(p in heights){
			div.style.fontSize = p;
			heights[p] = Math.round(div.offsetHeight * 12/16) * 16/12 / 1000;
		}

		win.body().removeChild(div);
		return heights; //object
	};

	var fontMeasurements = null;

	b._getCachedFontMeasurements = function(recalculate){
		if(recalculate || !fontMeasurements){
			fontMeasurements = b._getFontMeasurements();
		}
		return fontMeasurements;
	};

	// candidate for dojox.html.metrics

	var measuringNode = null, empty = {};
	b._getTextBox = function(	/*String*/ text,
								/*Object*/ style,
								/*String?*/ className){
		var m, s, al = arguments.length;
		var i;
		if(!measuringNode){
			measuringNode = domConstruct.create("div", {style: {
				position: "absolute",
				top: "-10000px",
				left: "0"
			}}, win.body());
		}
		m = measuringNode;
		// reset styles
		m.className = "";
		s = m.style;
		s.borderWidth = "0";
		s.margin = "0";
		s.padding = "0";
		s.outline = "0";
		// set new style
		if(al > 1 && style){
			for(i in style){
				if(i in empty){ continue; }
				s[i] = style[i];
			}
		}
		// set classes
		if(al > 2 && className){
			m.className = className;
		}
		// take a measure
		m.innerHTML = text;

		if(m["getBoundingClientRect"]){
			var bcr = m.getBoundingClientRect();
			return {l: bcr.left, t: bcr.top, w: bcr.width || (bcr.right - bcr.left), h: bcr.height || (bcr.bottom - bcr.top)};
		}else{
			return domGeom.getMarginBox(m);
		}
	};

	// candidate for dojo.dom

	var uniqueId = 0;
	b._getUniqueId = function(){
		// summary: returns a unique string for use with any DOM element
		var id;
		do{
			id = dojo._scopeName + "xUnique" + (++uniqueId);
		}while(dom.byId(id));
		return id;
	};

	lang.mixin(g, {
		//	summary:
		//		defines constants, prototypes, and utility functions for the core Graphics API

		// default shapes, which are used to fill in missing parameters
		defaultPath: {
			//	summary:
			//		Defines the default Path prototype object.
			type: "path", 
			//	type: String
			//		Specifies this object is a Path, default value 'path'.
			path: ""
			//	path: String
			//		The path commands. See W32C SVG 1.0 specification. 
			//		Defaults to empty string value.
		},
		defaultPolyline: {
			//	summary:
			//		Defines the default PolyLine prototype.
			type: "polyline", 
			//	type: String
			//		Specifies this object is a PolyLine, default value 'polyline'.
			points: []
			//	points: Array
			//		An array of point objects [{x:0,y:0},...] defining the default polyline's line segments. Value is an empty array [].
		},
		defaultRect: {
			//	summary:
			//		Defines the default Rect prototype.
			type: "rect",
			//	type: String
			//		Specifies this default object is a type of Rect. Value is 'rect' 
			x: 0, 
			//	x: Number
			//		The X coordinate of the default rectangles position, value 0.
			y: 0, 
			//	y: Number
			//		The Y coordinate of the default rectangle's position, value 0.
			width: 100, 
			//	width: Number
			//		The width of the default rectangle, value 100.
			height: 100, 
			//	height: Number
			//		The height of the default rectangle, value 100.
			r: 0
			//	r: Number
			//		The corner radius for the default rectangle, value 0.
		},
		defaultEllipse: {
			//	summary:
			//		Defines the default Ellipse prototype.
			type: "ellipse", 
			//	type: String
			//		Specifies that this object is a type of Ellipse, value is 'ellipse'
			cx: 0, 
			//	cx: Number
			//		The X coordinate of the center of the ellipse, default value 0.
			cy: 0, 
			//	cy: Number
			//		The Y coordinate of the center of the ellipse, default value 0.
			rx: 200,
			//	rx: Number
			//		The radius of the ellipse in the X direction, default value 200.
			ry: 100
			//	ry: Number
			//		The radius of the ellipse in the Y direction, default value 200.
		},
		defaultCircle: {
			//	summary:
			//		An object defining the default Circle prototype.
			type: "circle", 
			//	type: String
			//		Specifies this object is a circle, value 'circle'
			cx: 0, 
			//	cx: Number
			//		The X coordinate of the center of the circle, default value 0.
			cy: 0, 
			//	cy: Number
			//		The Y coordinate of the center of the circle, default value 0.
			r: 100
			//	r: Number
			//		The radius, default value 100.
		},
		defaultLine: {
			//	summary:
			//		An pbject defining the default Line prototype.
			type: "line", 
			//	type: String
			//		Specifies this is a Line, value 'line'
			x1: 0, 
			//	x1: Number
			//		The X coordinate of the start of the line, default value 0.
			y1: 0, 
			//	y1: Number
			//		The Y coordinate of the start of the line, default value 0.
			x2: 100,
			//	x2: Number
			//		The X coordinate of the end of the line, default value 100.
			y2: 100
			//	y2: Number
			//		The Y coordinate of the end of the line, default value 100.
		},
		defaultImage: {
			//	summary:
			//		Defines the default Image prototype.
			type: "image",
			//	type: String
			//		Specifies this object is an image, value 'image'.
			x: 0, 
			//	x: Number
			//		The X coordinate of the image's position, default value 0.
			y: 0, 
			//	y: Number
			//		The Y coordinate of the image's position, default value 0.
			width: 0,
			//	width: Number
			//		The width of the image, default value 0.
			height: 0,
			//	height:Number
			//		The height of the image, default value 0.
			src: ""
			//	src: String
			//		The src url of the image, defaults to empty string.
		},
		defaultText: {
			//	summary:
			//		Defines the default Text prototype.
			type: "text", 
			//	type: String
			//		Specifies this is a Text shape, value 'text'.
			x: 0, 
			//	x: Number
			//		The X coordinate of the text position, default value 0.
			y: 0, 
			//	y: Number
			//		The Y coordinate of the text position, default value 0.
			text: "",
			//	text: String
			//		The text to be displayed, default value empty string.
			align: "start",
			//	align:	String
			//		The horizontal text alignment, one of 'start', 'end', 'center'. Default value 'start'.
			decoration: "none",
			//	decoration: String
			//		The text decoration , one of 'none', ... . Default value 'none'.
			rotated: false,
			//	rotated: Boolean
			//		Whether the text is rotated, boolean default value false.
			kerning: true
			//	kerning: Boolean
			//		Whether kerning is used on the text, boolean default value true.
		},
		defaultTextPath: {
			//	summary:
			//		Defines the default TextPath prototype.
			type: "textpath", 
			//	type: String
			//		Specifies this is a TextPath, value 'textpath'.
			text: "", 
			//	text: String
			//		The text to be displayed, default value empty string.
			align: "start",
			//	align: String
			//		The horizontal text alignment, one of 'start', 'end', 'center'. Default value 'start'.
			decoration: "none",
			//	decoration: String
			//		The text decoration , one of 'none', ... . Default value 'none'.
			rotated: false,
			//	rotated: Boolean
			//		Whether the text is rotated, boolean default value false.
			kerning: true
			//	kerning: Boolean
			//		Whether kerning is used on the text, boolean default value true.
		},

		// default stylistic attributes
		defaultStroke: {
			//	summary:
			//		A stroke defines stylistic properties that are used when drawing a path.  
			//		This object defines the default Stroke prototype.
			type: "stroke", 
			//	type: String
			//		Specifies this object is a type of Stroke, value 'stroke'.
			color: "black", 
			//	color: String
			//		The color of the stroke, default value 'black'.
			style: "solid",
			//	style: String
			//		The style of the stroke, one of 'solid', ... . Default value 'solid'.
			width: 1,
			//	width: Number
			//		The width of a stroke, default value 1.
			cap: "butt",
			//	cap: String
			//		The endcap style of the path. One of 'butt', 'round', ... . Default value 'butt'.
			join: 4
			//	join: Number
			//		The join style to use when combining path segments. Default value 4.
		},
		defaultLinearGradient: {
			//	summary:
			//		An object defining the default stylistic properties used for Linear Gradient fills.
			//		Linear gradients are drawn along a virtual line, which results in appearance of a rotated pattern in a given direction/orientation.
			type: "linear", 
			//	type: String
			//		Specifies this object is a Linear Gradient, value 'linear'
			x1: 0, 
			//	x1: Number
			//		The X coordinate of the start of the virtual line along which the gradient is drawn, default value 0.
			y1: 0, 
			//	y1: Number
			//		The Y coordinate of the start of the virtual line along which the gradient is drawn, default value 0.
			x2: 100,
			//	x2: Number
			//		The X coordinate of the end of the virtual line along which the gradient is drawn, default value 100.
			y2: 100,
			//	y2: Number
			//		The Y coordinate of the end of the virtual line along which the gradient is drawn, default value 100.
			colors: [
				{ offset: 0, color: "black" }, { offset: 1, color: "white" }
			]
			//	colors: Array
			//		An array of colors at given offsets (from the start of the line).  The start of the line is
			//		defined at offest 0 with the end of the line at offset 1.
			//		Default value, [{ offset: 0, color: 'black'},{offset: 1, color: 'white'}], is a gradient from black to white. 
		},
		defaultRadialGradient: {
			// summary:
			//		An object specifying the default properties for RadialGradients using in fills patterns.
			type: "radial",
			//	type: String
			//		Specifies this is a RadialGradient, value 'radial'
			cx: 0, 
			//	cx: Number
			//		The X coordinate of the center of the radial gradient, default value 0.
			cy: 0, 
			//	cy: Number
			//		The Y coordinate of the center of the radial gradient, default value 0.
			r: 100,
			//	r: Number
			//		The radius to the end of the radial gradient, default value 100.
			colors: [
				{ offset: 0, color: "black" }, { offset: 1, color: "white" }
			]
			//	colors: Array
			//		An array of colors at given offsets (from the center of the radial gradient).  
			//		The center is defined at offest 0 with the outer edge of the gradient at offset 1.
			//		Default value, [{ offset: 0, color: 'black'},{offset: 1, color: 'white'}], is a gradient from black to white. 
		},
		defaultPattern: {
			// summary:
			//		An object specifying the default properties for a Pattern using in fill operations.
			type: "pattern", 
			// type: String
			//		Specifies this object is a Pattern, value 'pattern'.
			x: 0, 
			//	x: Number
			//		The X coordinate of the position of the pattern, default value is 0.
			y: 0, 
			//	y: Number
			//		The Y coordinate of the position of the pattern, default value is 0.
			width: 0, 
			//	width: Number
			//		The width of the pattern image, default value is 0.
			height: 0, 
			//	height: Number
			//		The height of the pattern image, default value is 0.
			src: ""
			//	src: String
			//		A url specifing the image to use for the pattern.
		},
		defaultFont: {
			// summary:
			//		An object specifying the default properties for a Font used in text operations.
			type: "font", 
			// type: String
			//		Specifies this object is a Font, value 'font'.
			style: "normal", 
			//	style: String
			//		The font style, one of 'normal', 'bold', default value 'normal'.
			variant: "normal",
			//	variant: String
			//		The font variant, one of 'normal', ... , default value 'normal'.
			weight: "normal", 
			//	weight: String
			//		The font weight, one of 'normal', ..., default value 'normal'.
			size: "10pt", 
			//	size: String
			//		The font size (including units), default value '10pt'.
			family: "serif"
			//	family: String
			//		The font family, one of 'serif', 'sanserif', ..., default value 'serif'.
		},

		getDefault: (function(){
			//	summary:
			//		Returns a function used to access default memoized prototype objects (see them defined above).
			var typeCtorCache = {};
			// a memoized delegate()
			return function(/*String*/ type){
				var t = typeCtorCache[type];
				if(t){
					return new t();
				}
				t = typeCtorCache[type] = new Function();
				t.prototype = g[ "default" + type ];
				return new t();
			}
		})(),

		normalizeColor: function(/*dojo.Color|Array|string|Object*/ color){
			//	summary:
			//		converts any legal color representation to normalized
			//		dojo.Color object
			return (color instanceof Color) ? color : new Color(color); // dojo.Color
		},
		normalizeParameters: function(existed, update){
			//	summary:
			//		updates an existing object with properties from an 'update'
			//		object
			//	existed: Object
			//		the target object to be updated
			//	update:  Object
			//		the 'update' object, whose properties will be used to update
			//		the existed object
			var x;
			if(update){
				var empty = {};
				for(x in existed){
					if(x in update && !(x in empty)){
						existed[x] = update[x];
					}
				}
			}
			return existed;	// Object
		},
		makeParameters: function(defaults, update){
			//	summary:
			//		copies the original object, and all copied properties from the
			//		'update' object
			//	defaults: Object
			//		the object to be cloned before updating
			//	update:   Object
			//		the object, which properties are to be cloned during updating
			var i = null;
			if(!update){
				// return dojo.clone(defaults);
				return lang.delegate(defaults);
			}
			var result = {};
			for(i in defaults){
				if(!(i in result)){
					result[i] = lang.clone((i in update) ? update[i] : defaults[i]);
				}
			}
			return result; // Object
		},
		formatNumber: function(x, addSpace){
			// summary: converts a number to a string using a fixed notation
			// x: Number
			//		number to be converted
			// addSpace: Boolean
			//		whether to add a space before a positive number
			var val = x.toString();
			if(val.indexOf("e") >= 0){
				val = x.toFixed(4);
			}else{
				var point = val.indexOf(".");
				if(point >= 0 && val.length - point > 5){
					val = x.toFixed(4);
				}
			}
			if(x < 0){
				return val; // String
			}
			return addSpace ? " " + val : val; // String
		},
		// font operations
		makeFontString: function(font){
			// summary: converts a font object to a CSS font string
			// font:	Object:	font object (see dojox.gfx.defaultFont)
			return font.style + " " + font.variant + " " + font.weight + " " + font.size + " " + font.family; // Object
		},
		splitFontString: function(str){
			// summary:
			//		converts a CSS font string to a font object
			// description:
			//		Converts a CSS font string to a gfx font object. The CSS font
			//		string components should follow the W3C specified order
			//		(see http://www.w3.org/TR/CSS2/fonts.html#font-shorthand):
			//		style, variant, weight, size, optional line height (will be
			//		ignored), and family.
			// str: String
			//		a CSS font string
			var font = g.getDefault("Font");
			var t = str.split(/\s+/);
			do{
				if(t.length < 5){ break; }
				font.style   = t[0];
				font.variant = t[1];
				font.weight  = t[2];
				var i = t[3].indexOf("/");
				font.size = i < 0 ? t[3] : t[3].substring(0, i);
				var j = 4;
				if(i < 0){
					if(t[4] == "/"){
						j = 6;
					}else if(t[4].charAt(0) == "/"){
						j = 5;
					}
				}
				if(j < t.length){
					font.family = t.slice(j).join(" ");
				}
			}while(false);
			return font;	// Object
		},
		// length operations
		cm_in_pt: 72 / 2.54, 
			//	cm_in_pt: Number
			//		points per centimeter (constant)
		mm_in_pt: 7.2 / 2.54,
			//	mm_in_pt: Number
			//		points per millimeter (constant)
		px_in_pt: function(){
			//	summary: returns the current number of pixels per point.
			return g._base._getCachedFontMeasurements()["12pt"] / 12;	// Number
		},
		pt2px: function(len){
			//	summary: converts points to pixels
			//	len: Number
			//		a value in points
			return len * g.px_in_pt();	// Number
		},
		px2pt: function(len){
			//	summary: converts pixels to points
			//	len: Number
			//		a value in pixels
			return len / g.px_in_pt();	// Number
		},
		normalizedLength: function(len) {
			//	summary: converts any length value to pixels
			//	len: String
			//		a length, e.g., '12pc'
			if(len.length === 0){ return 0; }
			if(len.length > 2){
				var px_in_pt = g.px_in_pt();
				var val = parseFloat(len);
				switch(len.slice(-2)){
					case "px": return val;
					case "pt": return val * px_in_pt;
					case "in": return val * 72 * px_in_pt;
					case "pc": return val * 12 * px_in_pt;
					case "mm": return val * g.mm_in_pt * px_in_pt;
					case "cm": return val * g.cm_in_pt * px_in_pt;
				}
			}
			return parseFloat(len);	// Number
		},

		pathVmlRegExp: /([A-Za-z]+)|(\d+(\.\d+)?)|(\.\d+)|(-\d+(\.\d+)?)|(-\.\d+)/g,
			//	pathVmlRegExp: RegExp
			//		a constant regular expression used to split a SVG/VML path into primitive components
		pathSvgRegExp: /([A-Za-z])|(\d+(\.\d+)?)|(\.\d+)|(-\d+(\.\d+)?)|(-\.\d+)/g,
			//	pathVmlRegExp: RegExp
			//		a constant regular expression used to split a SVG/VML path into primitive components

		equalSources: function(a /*Object*/, b /*Object*/){
			//	summary: compares event sources, returns true if they are equal
			//	a: first event source
			//	b: event source to compare against a
			return a && b && a === b;
		},

		switchTo: function(renderer/*String|Object*/){
			//	summary: switch the graphics implementation to the specified renderer.
			//	renderer: 
			//		Either the string name of a renderer (eg. 'canvas', 'svg, ...) or the renderer
			//		object to switch to.
			var ns = typeof renderer == "string" ? g[renderer] : renderer;
			if(ns){
				arr.forEach(["Group", "Rect", "Ellipse", "Circle", "Line",
						"Polyline", "Image", "Text", "Path", "TextPath",
						"Surface", "createSurface", "fixTarget"], function(name){
					g[name] = ns[name];
				});
			}
		}
	});
	return g; // defaults object api
});

},
'esri/nls/jsapi':function(){
define({ root:
({
  io: {
    proxyNotSet:"esri.config.defaults.io.proxyUrl is not set."
  },
  
  map: {
    deprecateReorderLayerString: "Map.reorderLayer(/*String*/ id, /*Number*/ index) deprecated. Use Map.reorderLayer(/*Layer*/ layer, /*Number*/ index).",
    deprecateShiftDblClickZoom: "Map.(enable/disable)ShiftDoubleClickZoom deprecated. Shift-Double-Click zoom behavior will not be supported."
  },

  geometry: {
    deprecateToScreenPoint:"esri.geometry.toScreenPoint deprecated. Use esri.geometry.toScreenGeometry.",
    deprecateToMapPoint:"esri.geometry.toMapPoint deprecated. Use esri.geometry.toMapGeometry."
  },

  layers: {
    tiled: {
      tileError:"Unable to load tile"
    },
    
    dynamic: {
      imageError:"Unable to load image"
    },
    
    graphics: {
      drawingError:"Unable to draw graphic "
    },

    agstiled: {
      deprecateRoundrobin:"Constructor option 'roundrobin' deprecated. Use option 'tileServers'."
    },

    imageParameters: {
      deprecateBBox:"Property 'bbox' deprecated. Use property 'extent'."
    },
    
    FeatureLayer: {
      noOIDField: "objectIdField is not set [url: ${url}]",
      fieldNotFound: "unable to find '${field}' field in the layer 'fields' information [url: ${url}]",
      noGeometryField: "unable to find a field of type 'esriFieldTypeGeometry' in the layer 'fields' information. If you are using a map service layer, features will not have geometry [url: ${url}]",
      invalidParams: "query contains one or more unsupported parameters",
      updateError: "an error occurred while updating the layer",
      
      createUserSeconds: "Created by ${userId} seconds ago",
      createUserMinute: "Created by ${userId} a minute ago",
      editUserSeconds: "Edited by ${userId} seconds ago",
      editUserMinute: "Edited by ${userId} a minute ago",
      createSeconds: "Created seconds ago",
      createMinute: "Created a minute ago",
      editSeconds: "Edited seconds ago",
      editMinute: "Edited a minute ago",
      
      createUserMinutes: "Created by ${userId} ${minutes} minutes ago",
      createUserHour: "Created by ${userId} an hour ago",
      createUserHours: "Created by ${userId} ${hours} hours ago",
      createUserWeekDay: "Created by ${userId} on ${weekDay} at ${formattedTime}",
      createUserFull: "Created by ${userId} on ${formattedDate} at ${formattedTime}",
      
      editUserMinutes: "Edited by ${userId} ${minutes} minutes ago",
      editUserHour: "Edited by ${userId} an hour ago",
      editUserHours: "Edited by ${userId} ${hours} hours ago",
      editUserWeekDay: "Edited by ${userId} on ${weekDay} at ${formattedTime}",
      editUserFull: "Edited by ${userId} on ${formattedDate} at ${formattedTime}",
      
      createUser: "Created by ${userId}",
      editUser: "Edited by ${userId}",
      
      createMinutes: "Created ${minutes} minutes ago",
      createHour: "Created an hour ago",
      createHours: "Created ${hours} hours ago",
      createWeekDay: "Created on ${weekDay} at ${formattedTime}",
      createFull: "Created on ${formattedDate} at ${formattedTime}",
      
      editMinutes: "Edited ${minutes} minutes ago",
      editHour: "Edited an hour ago",
      editHours: "Edited ${hours} hours ago",
      editWeekDay: "Edited on ${weekDay} at ${formattedTime}",
      editFull: "Edited on ${formattedDate} at ${formattedTime}"
    }
  },

  tasks: {
    gp: {
      gpDataTypeNotHandled:"GP Data type not handled."
    },
        
    na: {
      route: {
        routeNameNotSpecified: "'RouteName' not specified for atleast 1 stop in stops FeatureSet."
      }
    },
    
    query: {
      invalid: "Unable to perform query. Please check your parameters."
    }
  },

  toolbars: {
    draw: {
      convertAntiClockwisePolygon: "Polygons drawn in anti-clockwise direction will be reversed to be clockwise.",
      addPoint: "Click to add a point",
      addShape: "Click to add a shape",
      addMultipoint: "Click to start adding points",
      freehand: "Press down to start and let go to finish",
      start: "Click to start drawing",
      resume: "Click to continue drawing",
      complete: "Double-click to complete",
      finish: "Double-click to finish",
      invalidType: "Unsupported geometry type"
    },
    edit: {
      invalidType: "Unable to activate the tool. Check if the tool is valid for the given geometry type.",
      deleteLabel: "Delete"
    }
  },
  
  virtualearth: {
    // minMaxTokenDuration:"Token duration must be greater than 15 minutes and lesser than 480 minutes (8 hours).",
    
    vetiledlayer: {
      //tokensNotSpecified:"Either clientToken & serverToken must be provided or tokenUrl must be specified."
      bingMapsKeyNotSpecified: "BingMapsKey must be provided."
    },
    
    vegeocode: {
      //tokensNotSpecified:"Either serverToken must be provided or tokenUrl must be specified.",
      bingMapsKeyNotSpecified: "BingMapsKey must be provided.",
      requestQueued: "Server token not retrieved. Queing request to be executed after server token retrieved."
    }
  },
  widgets: {
    attributeInspector: {
      NLS_first: "First",
      NLS_previous: "Previous",
      NLS_next: "Next",
      NLS_last: "Last",
      NLS_deleteFeature: "Delete",
      NLS_title: "Edit Attributes",
      NLS_errorInvalid: "Invalid",
      NLS_validationInt: "Value must be an integer.",
      NLS_validationFlt: "Value must be a float.",
      NLS_of: "of",
      NLS_noFeaturesSelected: "No features selected"
    },
    overviewMap: {
      NLS_drag: "Drag To Change The Map Extent",
      NLS_show: "Show Map Overview",
      NLS_hide: "Hide Map Overview",
      NLS_maximize: "Maximize",
      NLS_restore: "Restore",
      NLS_noMap: "'map' not found in input parameters",
      NLS_noLayer: "main map does not have a base layer",
      NLS_invalidSR: "spatial reference of the given layer is not compatible with the main map",
      NLS_invalidType: "unsupported layer type. Valid types are 'TiledMapServiceLayer' and 'DynamicMapServiceLayer'"
    },
    timeSlider: {
      NLS_first: "First",
      NLS_previous: "Previous",
      NLS_next: "Next",
      NLS_play: "Play/Pause",
      NLS_invalidTimeExtent: "TimeExtent not specified, or in incorrect format."
    },
    attachmentEditor: {
      NLS_attachments: "Attachments:",
      NLS_add: "Add",
      NLS_none: "None"
    },
    editor: {
      tools: {
        NLS_attributesLbl: "Attributes",
        NLS_cutLbl: "Cut",
        NLS_deleteLbl: "Delete",
        NLS_extentLbl: "Extent",
        NLS_freehandPolygonLbl: "Freehand Polygon",
        NLS_freehandPolylineLbl: "Freehand Polyline",
        NLS_pointLbl: "Point",
        NLS_polygonLbl: "Polygon",
        NLS_polylineLbl: "Polyline",
        NLS_reshapeLbl: "Reshape",
        NLS_selectionNewLbl: "New selection",
        NLS_selectionAddLbl: "Add to selection",
        NLS_selectionClearLbl: "Clear selection",
        NLS_selectionRemoveLbl: "Subtract from selection",
        NLS_selectionUnionLbl: "Union",
        NLS_autoCompleteLbl: "Auto Complete",
        NLS_unionLbl: "Union",
        NLS_rectangleLbl: "Rectangle",
        NLS_circleLbl: "Circle",
        NLS_ellipseLbl: "Ellipse",
        NLS_triangleLbl: "Triangle",
        NLS_arrowLbl: "Arrow",
        NLS_arrowLeftLbl: "Left Arrow",
        NLS_arrowUpLbl: "Up Arrow",
        NLS_arrowDownLbl: "Down Arrow",
        NLS_arrowRightLbl: "Right Arrow",
        NLS_undoLbl: "Undo",
        NLS_redoLbl: "Redo"
      }
    },
    legend: {
      NLS_creatingLegend: "Creating legend",
      NLS_noLegend: "No legend"
    },
    popup: {
      NLS_moreInfo: "More info",
      NLS_searching: "Searching",
      NLS_prevFeature: "Previous feature",
      NLS_nextFeature: "Next feature",
      NLS_close: "Close",
      NLS_prevMedia: "Previous media",
      NLS_nextMedia: "Next media",
      NLS_noInfo: "No information available",
      NLS_noAttach: "No attachments found",
      NLS_maximize: "Maximize",
      NLS_restore: "Restore",
      NLS_zoomTo: "Zoom to",
      NLS_pagingInfo: "(${index} of ${total})",
      NLS_attach: "Attachments"
    },
    measurement: {
      NLS_distance: "Distance",
      NLS_area: "Area",
      NLS_location: "Location",
      NLS_resultLabel: "Measurement Result",
      NLS_length_miles: "Miles",
      NLS_length_kilometers: "Kilometers",
      NLS_length_feet: "Feet",
      NLS_length_meters: "Meters",
      NLS_length_yards: "Yards",
      NLS_area_acres: "Acres",
      NLS_area_sq_miles: "Sq Miles",
      NLS_area_sq_kilometers: "Sq Kilometers",
      NLS_area_hectares: "Hectares",
      NLS_area_sq_yards: "Sq Yards",
      NLS_area_sq_feet: "Sq Feet",
      NLS_area_sq_meters: "Sq Meters",
      NLS_deg_min_sec: "DMS",
      NLS_decimal_degrees: "Degrees",
      NLS_longitude: "Longitude",
      NLS_latitude: "Latitude"
    },
    bookmarks: {
      NLS_add_bookmark: "Add Bookmark",
      NLS_new_bookmark: "Untitled",
      NLS_bookmark_edit: "Edit",
      NLS_bookmark_remove: "Remove"
    },
    print: {
      NLS_print: "Print",
      NLS_printing: "Printing",
      NLS_printout: "Printout"
    },
    templatePicker: {
      creationDisabled: "Feature creation is disabled for all layers.",
      loading: "Loading.."
    }
  },
  arcgis: {
    utils: {
      baseLayerError: "Unable to load the base map layer",
      geometryServiceError: "Provide a geometry service to open Web Map."
    }
  },
  
  identity: {
    lblItem: "item",
    title: "Sign in",
    info: "Please sign in to access the item on ${server} ${resource}",
    lblUser: "User Name:",
    lblPwd: "Password:",
    lblOk: "OK",
    lblSigning: "Signing in...",
    lblCancel: "Cancel",
    errorMsg: "Invalid username/password. Please try again.",
    invalidUser: "The username or password you entered is incorrect.",
    forbidden: "The username and password are valid, but you don't have access to this resource.",
    noAuthService: "Unable to access the authentication service."
  }
}),
"ar": true,
"de": true,
"es": true,
"fr": true,
"it": true,
"ja": true,
"ko": true,
"nl": true,
"nb": true,
"pl": true,
"pt-br": true,
"ro": true,
"ru": true,
"sv": true,
"zh": true,
"zh-cn": true
});
},
'esri/layers/agscommon':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/geometry,esri/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.agscommon");

dojo.require("esri.geometry");
dojo.require("esri.utils");

dojo.declare("esri.layers.ArcGISMapServiceLayer", null, {
    constructor: function(url, options) {
      //layers: Array:
      this.layerInfos = [];
      
      // this._url = esri.urlToObject(url);

      var _params = (this._params = {}),
          token = this._url.query ? this._url.query.token : null;
      if (token) {
        _params.token = token;
      }
    },

    _load: function() {
      esri.request({
        url: this._url.path,
        content: dojo.mixin({ f:"json" }, this._params),
        callbackParamName: "callback",
        load: this._initLayer,
        error: this._errorHandler
      });
    },

    //spatialReference: esri.SpatialReference: spatial reference object
    spatialReference: null,
    //initialExtent: esri.geometry.Extent: Initial extent of layers in map
    initialExtent: null,
    //fullExtent: esri.geometry.Extent: Full extent of layers
    fullExtent: null,
    //description: String: Description of map document
    description: null,
    //units: String: Map units
    units: null,

    _initLayer: function(response, io) {
      try {
        this._findCredential();

        // See esri.request for context regarding "_ssl"
        var ssl = (this.credential && this.credential.ssl) || (response && response._ssl);
        if (ssl) {
          this._useSSL();
        }
        
        this.description = response.description;
        this.copyright = response.copyrightText;
        this.spatialReference = response.spatialReference && new esri.SpatialReference(response.spatialReference);
        this.initialExtent = response.initialExtent && new esri.geometry.Extent(response.initialExtent);
        this.fullExtent = response.fullExtent && new esri.geometry.Extent(response.fullExtent);
        this.units = response.units;
        this.maxRecordCount = response.maxRecordCount;
        this.maxImageHeight = response.maxImageHeight;
        this.maxImageWidth = response.maxImageWidth;
        this.supportsDynamicLayers = response.supportsDynamicLayers;
      
        var layerInfos = (this.layerInfos = []),
            lyrs = response.layers,
            dvl = (this._defaultVisibleLayers = []);
          
        dojo.forEach(lyrs, function(lyr, i) {
          layerInfos[i] = new esri.layers.LayerInfo(lyr);
          if (lyr.defaultVisibility) {
            dvl.push(lyr.id);
          }
        });

        if (! this.visibleLayers) {
          this.visibleLayers = dvl;
        }

        // for (var i=0, il=lyrs.length; i<il; i++) {
        //   layerInfos.push(new esri.layers.LayerInfo(lyrs[i]));
        //   if (lyrs[i].defaultVisibility) {
        //     _defaultLayerVisibility.push(i);
        //   }
        // }

        // REST added currentVersion property to some resources
        // at 10 SP1
        this.version = response.currentVersion;
        
        if (!this.version) {
          var ver;
          
          if ( "capabilities" in response || "tables" in response ) {
            ver = 10;
          }
          else if ("supportedImageFormatTypes" in response) {
            ver = 9.31;
          }
          else {
            ver = 9.3;
          }
          
          this.version = ver;
        } // version
        
        this.capabilities = response.capabilities;

      }
      catch (e) {
        this._errorHandler(e);
      }
    }
  }
);

dojo.declare("esri.layers.LayerInfo", null, {
    constructor: function(/*Object*/ json) {
      dojo.mixin(this, json);
    },
    toJson: function () {
      var json = {
        defaultVisibility: this.defaultVisibility,
        id: this.id,
        maxScale: this.maxScale,
        minScale: this.minScale,
        name: this.name,
        parentLayerId: this.parentLayerId,
        subLayerIds: this.subLayerIds
      };
      return esri._sanitize(json);
    }
  }
);

dojo.declare("esri.layers.TimeInfo", null, {
    constructor: function(json) {
      //timeInterval : Number
      //timeIntervalUnits : String    
      //endTimeField : String    
      //exportOptions : LayerTimeOptions  
      //startTimeField : String    
      //timeExtent : TimeExtent    
      //timeReference : TimeReference    
      //trackIdField : String      
      if (json !== null) {
          dojo.mixin(this, json);
          if (json.exportOptions) {
              this.exportOptions = new esri.layers.LayerTimeOptions(json.exportOptions);
          }
          
          this.timeExtent = new esri.TimeExtent(json.timeExtent);
          this.timeReference = new esri.layers.TimeReference(json.timeReference);
      }      
    }
  }
);

dojo.mixin(esri.layers.TimeInfo, {
   UNIT_CENTURIES: "esriTimeUnitsCenturies", 
   UNIT_DAYS: "esriTimeUnitsDays", 
   UNIT_DECADES: "esriTimeUnitsDecades", 
   UNIT_HOURS: "esriTimeUnitsHours",
   UNIT_MILLISECONDS: "esriTimeUnitsMilliseconds",
   UNIT_MINUTES: "esriTimeUnitsMinutes",
   UNIT_MONTHS: "esriTimeUnitsMonths",
   UNIT_SECONDS: "esriTimeUnitsSeconds",
   UNIT_UNKNOWN: "esriTimeUnitsUnknown",
   UNIT_WEEKS: "esriTimeUnitsWeeks",
   UNIT_YEARS: "esriTimeUnitsYears"
});

dojo.declare("esri.layers.LayerTimeOptions", null, {
    constructor: function(json) {
     //timeDataCumulative:Boolean
     //timeOffset:Number
     //timeOffsetUnits:String
     //useTime:Boolean     
     if (json) {
         dojo.mixin(this, json);
     }
    },
    
    toJson : function() {
     var json = {
         timeDataCumulative: this.timeDataCumulative,
         timeOffset: this.timeOffset,
         timeOffsetUnits: this.timeOffsetUnits,
         useTime: this.useTime                            
     };
     
     return esri._sanitize(json);                   
    }
   }
 );
 
 dojo.declare("esri.layers.TimeReference", null, {
   constructor: function(json) {
     //respectsDaylightSaving : Boolean      
     //timeZone : String
     if (json) {
         dojo.mixin(this, json);      
     }             
   }
 }
);

/********************
 * esri.layers.Field
 ********************/

dojo.declare("esri.layers.Field", null, {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.name = json.name;
      this.type = json.type;
      this.alias = json.alias;
      this.length = json.length;
      this.editable = json.editable;
      this.nullable = json.nullable;
      var domain = json.domain;
      if (domain && dojo.isObject(domain)) {
        switch(domain.type) {
          case "range":
            this.domain = new esri.layers.RangeDomain(domain);
            break;
          case "codedValue":
            this.domain = new esri.layers.CodedValueDomain(domain);
            break;
        }
      } // domain
    }
  }
});

/*********************
 * esri.layers.Domain
 *********************/

dojo.declare("esri.layers.Domain", null, {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.name = json.name;
      this.type = json.type;
    }
  },
  
  toJson: function() {
    return esri._sanitize({
      name: this.name,
      type: this.type
    });
  }
});

/**************************
 * esri.layers.RangeDomain
 **************************/

dojo.declare("esri.layers.RangeDomain", [ esri.layers.Domain ], {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.minValue = json.range[0];
      this.maxValue = json.range[1];
    }
  },
  
  toJson: function() {
    var json = this.inherited(arguments);
    json.range = [ this.minValue, this.maxValue ];
    return esri._sanitize(json);
  }
});

/*******************************
 * esri.layers.CodedValueDomain
 *******************************/

dojo.declare("esri.layers.CodedValueDomain", [ esri.layers.Domain ], {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.codedValues = json.codedValues;
    }
  },
  
  toJson: function() {
    var json = this.inherited(arguments);
    json.codedValues = dojo.clone(this.codedValues);
    return esri._sanitize(json);
  }
});

/*******************************
 * esri.layers.InheritedDomain
 *******************************/

dojo.declare("esri.layers.InheritedDomain", [ esri.layers.Domain ], {});

/*******************************
 * dynamic layer related classes
 *******************************/
dojo.declare("esri.layers.LayerSource", null, {
  type: null,
  
  constructor: function(json) {
    if (json) {
      dojo.mixin(this, json);
    }             
  },
  
  toJson: function () {
  }
});

dojo.declare("esri.layers.LayerMapSource", esri.layers.LayerSource, {
  type: "mapLayer",
  
  toJson: function () {
    var json = {type: "mapLayer", mapLayerId: this.mapLayerId, gdbVersion: this.gdbVersion};
    return esri._sanitize(json);
  }
});

dojo.declare("esri.layers.LayerDataSource", esri.layers.LayerSource, {
  type: "dataLayer",
  
  toJson: function () {
    var json = {type: "dataLayer", dataSource: this.dataSource && this.dataSource.toJson()};
    return esri._sanitize(json);
  }
});

dojo.declare("esri.layers.DataSource", null, {
  constructor: function(json) {
    if (json) {
      dojo.mixin(this, json);
    }             
  },
  
  toJson: function(){    
  }
});

dojo.declare("esri.layers.TableDataSource", esri.layers.DataSource, {  
  toJson: function () {
    var json = {
      type: "table",
      workspaceId: this.workspaceId,
      dataSourceName: this.dataSourceName,
      gdbVersion: this.gdbVersion
    };
    return esri._sanitize(json);
  }
});

dojo.declare("esri.layers.QueryDataSource", esri.layers.DataSource, {  
  toJson: function () {
    var json = {
      type: "queryTable",
      workspaceId: this.workspaceId,
      query: this.query,
      oidFields: this.oidFields && this.oidFields.join(),
      spatialReference: this.spatialReference && this.spatialReference.toJson()
    };
    if (this.geometryType) {
      var geometryType;
      if (this.geometryType.toLowerCase() === "point") {
        geometryType = "esriGeometryPoint";
      }
      else if (this.geometryType.toLowerCase() === "multipoint") {
        geometryType = "esriGeometryMultipoint";
      }
      else if (this.geometryType.toLowerCase() === "polyline") {
        geometryType = "esriGeometryPolyline";
      }
      else if (this.geometryType.toLowerCase() === "polygon") {
        geometryType = "esriGeometryPolygon";
      }
      else {
        geometryType = this.geometryType;
      }
      json.geometryType = geometryType;
    }
    return esri._sanitize(json);
  }
});

dojo.declare("esri.layers.JoinDataSource", esri.layers.DataSource, {  
  toJson: function () {
    var json = {
      type: "joinTable",
      leftTableSource: this.leftTableSource && this.leftTableSource.toJson(),
      rightTableSource: this.rightTableSource && this.rightTableSource.toJson(),
      leftTableKey: this.leftTableKey,
      rightTableKey: this.rightTableKey
    };
    var joinType;
    if (this.joinType.toLowerCase() === "left-outer-join") {
      joinType = "esriLeftOuterJoin";
    }
    else if (this.joinType.toLowerCase() === "left-inner-join") {
      joinType = "esriLeftInnerJoin";
    }
    else {
      joinType = this.joinType;
    }
    json.joinType = joinType;
    return esri._sanitize(json);
  }
});

dojo.declare("esri.layers.RasterDataSource", esri.layers.DataSource, {  
  toJson: function () {
    var json = {
      type: "raster",
      workspaceId: this.workspaceId,
      dataSourceName: this.dataSourceName
    };
    return esri._sanitize(json);
  }
});

dojo.declare("esri.layers.DynamicLayerInfo", esri.layers.LayerInfo, {
  defaultVisibility: true,
  parentLayerId: -1,
  maxScale: 0,
  minScale: 0,
  
  constructor: function(/*Object*/ json) {    
    if (json && !json.source) {
      var mapLayerSource = new esri.layers.LayerMapSource();
      mapLayerSource.mapLayerId = this.id;
      this.source = mapLayerSource; 
    }
  },
  
  toJson: function() {
    var json = this.inherited(arguments);
    json.source = this.source && this.source.toJson();
    return esri._sanitize(json);
  }
});

dojo.declare("esri.layers.LayerDrawingOptions", null, {
  constructor: function(json) {
    if (json) {
      dojo.mixin(this, json);
    }             
  },
  
  toJson: function () {
    var json = {
      renderer: this.renderer && this.renderer.toJson(),
      transparency: this.transparency,
      scaleSymbols: this.scaleSymbols,
      showLabels: this.showLabels
    }; 
    return esri._sanitize(json);
  }
});
});

},
'dijit/main':function(){
define("dijit/main", [
	"dojo/_base/kernel"
], function(dojo){
	// module:
	//		dijit
	// summary:
	//		The dijit package main module

	return dojo.dijit;
});

},
'dojox/gfx':function(){
define("dojox/gfx", ["dojo/_base/lang", "./gfx/_base", "./gfx/renderer!"], 
  function(lang, gfxBase, renderer){
	// module:
	//		dojox/gfx
	// summary:
	//		This the root of the Dojo Graphics package
	gfxBase.switchTo(renderer);
	return gfxBase;
});

},
'esri/graphic':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/geometry,esri/symbol"], function(dijit,dojo,dojox){
dojo.provide("esri.graphic");

dojo.require("esri.geometry");
dojo.require("esri.symbol");

dojo.declare("esri.Graphic", null, {
    constructor: function(/*esri.geometry.Geometry|Object*/ json, /*esri.symbol.Symbol*/ symbol, /*HashMap*/ attributes, /*esri.InfoTemplate*/ infoTemplate) {
      //summary: Create a new Graphic object
      // geometry: esri.geometry.Geometry: Geometry to display
      // symbol: esri.symbol.Symbol: Symbol to render geometry
      // attributes: HashMap: Attributes object { key1:value1, key2:value2, ..., keyN, valueN }
      // info: esri.InfoTemplate: Info object ({ title:String, content:String }), defining formatting of attributes.

      if (json && ! (json instanceof esri.geometry.Geometry)) {
        this.geometry = json.geometry ? esri.geometry.fromJson(json.geometry) : null;
        this.symbol = json.symbol ? esri.symbol.fromJson(json.symbol) : null;
        this.attributes = json.attributes || null;
        this.infoTemplate = json.infoTemplate ? new esri.InfoTemplate(json.infoTemplate) : null;
      }
      else {
        this.geometry = json;
        this.symbol = symbol;
        this.attributes = attributes;
        this.infoTemplate = infoTemplate;
      }
    },

    // _shape: dojox.gfx.Shape: populated by esri.layers.GraphicsLayer
    _shape: null,

    // _graphicsLayer: esri.layers.GraphicsLayer: graphics layer in which this graphic is added
    _graphicsLayer: null,
    
    // _visible: Boolean: whether graphic is visible
    _visible: true,
    visible: true,

    getDojoShape: function() {
      //summary: Returns the dojox.gfx.Shape object, if currently displayed on esri.layers.GraphicsLayer
      // returns: dojox.gfx.Shape: Rendered dojo shape, else null
      return this._shape;
    },
    
    getLayer: function() {
      return this._graphicsLayer;
    },

    setGeometry: function(geometry) {
      this.geometry = geometry;
      var gl = this._graphicsLayer;
      if (gl) {
        //var type = geometry.type;
        gl._updateExtent(this);
        gl._draw(this, true);
      }
      return this;
    },

    setSymbol: function(symbol, /*Boolean?*/ _force) {
      // TODO
      // We may want to create a _getActiveSymbol on graphic or something like that
      var gl = this._graphicsLayer, shape = this._shape; //, renderer = gl && gl.renderer;
      //var prevSymbol = this.symbol || (renderer && renderer.getSymbol(this));
      this.symbol = symbol;
      if (symbol) {
        this.symbol._stroke = this.symbol._fill = null;
      }
      if (gl) {
        
        // See FeatureLayer::_repaint for when _force is used
        // TODO
        // This does not feel right but it works for now.
        // Need to do some code reorg in graphics layer to better
        // manage graphic rendering routines
        if (_force) {
          if (shape) {
            gl._removeShape(this);
          }
          gl._draw(this, true);
          return this;
        }
        
        if (!this.geometry) {
          return this;
        }
        
        var type = this.geometry.type;
        if (type === "point" || type === "multipoint") {
          // Invalidate shape if symbol type has changed
          // Or, incompatible style change for an SMS
          /*if (shape && prevSymbol && symbol) {
            var type1 = prevSymbol.type, type2 = symbol.type, circle = esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE;
            if (type1 !== type2 || (type1 === "simplemarkersymbol" && prevSymbol.style !== symbol.style && (prevSymbol.style === circle || symbol.style === circle))) {
              //console.log(type1, type2, prevSymbol.style, symbol.style);
              gl._removeShape(this);
            }
          }*/
          
          gl._draw(this, true);
        }
        else if (shape) {
          gl._symbolizeShape(this);
        }
      }
      
      return this;
    },

    setAttributes: function(/*Object*/ attributes) {
      this.attributes = attributes;
      return this;
    },

    setInfoTemplate: function(/*esri.InfoTemplate*/ infoTemplate) {
      this.infoTemplate = infoTemplate;
      return this;
    },
    
    _getEffInfoTemplate: function() {
      // Convenience method for internal use only.
      // Returns the effective info template applicable to
      // this graphic.
      // Returns: 
      // Instance of esri.InfoTemplate or null/undefined
      var layer = this.getLayer();
      return this.infoTemplate || (layer && layer.infoTemplate);
    },

    getTitle: function() {
      var template = this._getEffInfoTemplate();
      var title = template && template.title;
      
      if (dojo.isFunction(title)) {
        title = title.call(template, this);
      }
      else if (dojo.isString(title)) {
        var layer = this._graphicsLayer;
        var func = layer && layer._getDateOpts; // feature layer

        title = esri.substitute(this.attributes, title, {
          first: true,
          dateFormat: func && func.call(layer)
        });
      }
      
      return title;
    },

    getContent: function() {
      var template = this._getEffInfoTemplate();
      var content = template && template.content;
      
      if (dojo.isFunction(content)) {
        content = content.call(template, this);
      }
      else if (dojo.isString(content)) {
        var layer = this._graphicsLayer;
        var func = layer && layer._getDateOpts; // feature layer

        content = esri.substitute(this.attributes, content, {
          dateFormat: func && func.call(layer)
        });
      }
      
      return content;
    },

    show: function() {
      this.visible = this._visible = true;

      if (this._shape) {
        var source = this._shape.getEventSource();
        if (source) {
          esri.show(source);
        }
        // else
        // canvas
      }
      else if (this._graphicsLayer) {
        this._graphicsLayer._draw(this, true);
      }

      return this;
    },

    hide: function() {
      this.visible = this._visible = false;

      var shape = this._shape;
      if (shape) {
        var source = shape.getEventSource();
        
        if (source) {
          esri.hide(source);
        }
        else { // canvas
          var layer = this._graphicsLayer;
          if (layer) {
            layer._removeShape(this);
          }
        }
      }

      return this;
    },

    toJson: function() {
      var json = {};
      if (this.geometry) {
        json.geometry = this.geometry.toJson();
      }
      if (this.attributes) {
        json.attributes = dojo.mixin({}, this.attributes);
      }
      if (this.symbol) {
        json.symbol = this.symbol.toJson();
      }
      if (this.infoTemplate) {
        json.infoTemplate = this.infoTemplate.toJson();
      }
      return json;
    }
  }
);

dojo.declare("esri.InfoTemplate", null, {
    /**
     * ========== Constructor 1 ==========
     * new esri.InfoTemplate(title, content);
     * 
     * title: <String|Function>
     * content: <String|Function>
     *
     * Function: A user-defined function that will be
     * passed reference to the graphic being processed.
     * Returns one of the following:
     *   String
     *   DOMNode
     *   Instance of dojo.Deferred
     * 
     * ========== Constructor 2 ==========
     * new esri.InfoTemplate(JSON);
     * 
     * JSON: {
     *   title: <String|DOMNode|Function>,
     *   content: <String|DOMNode|Function>
     * }
     */
    constructor: function(/*String|Object*/ title, /*String*/ content) {
      if (title && dojo.isObject(title) && !dojo.isFunction(title)) {
        dojo.mixin(this, title);
      }
      else {
        this.title = title || "${*}";
        this.content = content || "${*}";
      }
    },

    setTitle: function(title) {
      this.title = title;
      return this;
    },

    setContent: function(content) {
      this.content = content;
      return this;
    },

    toJson: function() {
      return esri._sanitize({
        title: this.title,
        content: this.content
      });
    }
  }
);
});

},
'esri/_coremap':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!dijit/_base/manager,esri/geometry,esri/utils,esri/fx,dojox/gfx/matrix,esri/layers/graphics,esri/dijit/InfoWindowLite"], function(dijit,dojo,dojox){
dojo.provide("esri._coremap");

dojo.require("dijit._base.manager");

dojo.require("esri.geometry");
dojo.require("esri.utils");
dojo.require("esri.fx");
dojo.require("dojox.gfx.matrix");

dojo.require("esri.layers.graphics");

// BUILD DIRECTIVE


dojo.require("esri.dijit.InfoWindowLite");
  


//all mapping functionality
dojo.declare("esri._CoreMap", null, (function() {
    //CLASS VARIABLES
    //classes & methods
    var toMapPt = esri.geometry.toMapPoint, //coords converters
        toScreenPt = esri.geometry.toScreenPoint,
        dc = dojo.connect,
        ddc = dojo.disconnect,
        dh = dojo.hitch,
        ds = dojo.style,
        iOf = dojo.indexOf,
        mixin = dojo.mixin,
        Point = esri.geometry.Point,
        Extent = esri.geometry.Extent,
        GraphicsLayer = esri.layers.GraphicsLayer,
        Rect = esri.geometry.Rect,
        uid = 0,
        mapDefaults = esri.config.defaults.map; //map default configuration
       
    //factors and constants 
    var _LEVEL_CHANGE_FACTOR = 1000000,
        _FIXED_PAN_FACTOR = 0.75,
        _FIT_ZOOM_FACTOR = 0.25,
        _FIT_ZOOM_MAX = 3.0,
        _ZINDEX_GRAPHICS = 20,
        _ZINDEX_INFO = 40; 
    
    //functions
    function _initTileInfo(tileInfo, params) {
      // TODO
      // This method is doing unwanted things like
      // updating the incoming "params". Why?
      // Also, both caller and callee are cloning
      // tileInfo. Why?
      
      var lods = tileInfo.lods;
      
      //sort lods based on scale
      lods.sort(function(l1, l2) {
        if (l1.scale > l2.scale) {
          return -1;
        }
        else if (l1.scale < l2.scale) {
          return 1;
        }
        return 0;
      });
      
      //remove any duplicate scales
      var scales = [];
      lods = dojo.filter(lods, function(l) {
        if (iOf(scales, l.scale) === -1) {
          scales.push(l.scale);
          return true;
        }
      });

      //add/set level attribute to each lod
      var pl = (params.lods = []),
          l;
      dojo.forEach(lods, function(lod, index) {
        l = (pl[index] = new esri.layers.LOD(lod));
        l.level = index;
      });

      params.tileInfo = new esri.layers.TileInfo(
        mixin(tileInfo, { lods:pl })
      );
    }
    
    return {
      resizeDelay: 300, // in milliseconds
      
      constructor: function(containerId, params) {
        //summary: Creates a container using HTMLElement with argument id and
        //         normalizes all mouse/key events.
        // containerId: String: Id of HTMLElement (generally div)
        // options: Object: Optional parameters
        //        : layer: Layer to initialize map with
      
        //INSTANCE VARIABLES
        //variables with default values
        mixin(this, { _internalLayerIds:[], _layers:[], _layerDivs:[], _layerSize:0, _clickHandles: [], _connects:[]/*, _infoWindowIsShowing:false*/ });
        
        //variables with no default value
        mixin(this, {
          /*_infoWindowCoords:null, _iwPan_connect:null, _iwZoomStart_connect:null, _iwExtentChange_connect:null,*/
          _zoomAnimDiv:null, _zoomAnim:null, //zoom animation
          _layersDiv:null, _firstLayerId:null,
          _delta:null,
          _gc: null,
          // _zoomStartHandler:null, _zoomingHandler: null, _zoomEndHandler:null,
          // _panningHandler: null, _panEndHandler:null,
          // _fixedPan: null,
          _cursor: null,
          
          //were protected, but not required
          _ratioW:1, _ratioH:1,
          _params:null
        });
        
        //public variables
        mixin(this, {
          // container:null, id:null, position:null, width:0, height:0, extent:null, spatialReference:null, infoWindow:null,
          cursor:null,
          layerIds:[],
          graphicsLayerIds:[],
          graphics:null,
          loaded:false //loaded: boolean: Whether the map control is loaded
        });
        
        //protected variables
        mixin(this, {
          __panning:false, __zooming:false, __container:null, root:null, __LOD:null,
          __tileInfo:null,
          __visibleRect:null, __visibleDelta:null
        });
      
        //START: _MapContainer
        var cont = (this.container = dojo.byId(containerId));
        var id = (this.id = dojo.attr(cont, "id") || dijit.getUniqueId(this.declaredClass));
        dojo.addClass(cont, "map");

        //position of container on screen
        var box = dojo.contentBox(cont), //container box
            dac = dojo.addClass,
            dcr = dojo.create;

        //position
        this.position = new Point(0, 0);
        this._reposition();

        //width: int: Width of map
        var width = (this.width = (box.w || mapDefaults.width));
        //height: int: height of map control
        var height = (this.height = box.h || mapDefaults.height);

        if (box.w === 0) {
          ds(cont, "width", width + "px");
        }
        if (box.h === 0) {
          ds(cont, "height", height + "px");
        }

        // TODO
        // containerId can be a node reference. Fix id below
        var _root = (this.root = dcr("div", { id:id + "_root", style:{ width:width + "px", height:height + "px" } }));
        dac(_root, "container");

        var _cont = (this.__container = dcr("div", { id:id + "_container" }, _root));
        ds(_cont, "position", "absolute");
        dac(_cont, "container");
        cont.appendChild(_root);
        //END: _MapContainer
      
        var _params = (this._params = mixin({
          slider:true, 
          nav:false, 
          extent:null, 
          layer:null, 
          scales:null, 
          showInfoWindowOnClick:true, 
          displayGraphicsOnPan:true, 
          lods:null, 
          tileInfo:null, 
          wrapAround180: false,
          fitExtent: false 
        }, params || {}));
        
        this.wrapAround180 = _params.wrapAround180;
        
        if (esri._isDefined(_params.resizeDelay)) {
          this.resizeDelay =  _params.resizeDelay;
        }

        if (_params.lods) {
          _initTileInfo({ rows: 512, cols: 512, dpi: 96, format: "JPEG", compressionQuality: 75, origin: { x:-180, y:90 }, spatialReference: { wkid: 4326 }, lods:_params.lods }, _params);
          this.__tileInfo = _params.tileInfo;
        }
      
        //id: String: Id of map control
        //this.id = null;
        //layerIds: String[]: Ids of layers currently displayed on map

        //layerIds: String[]: Ids of graphics layers currently displayed on map
      
        //extent: esri.geometry.Extent: Currently visible extent of map
        var ext = (this.extent = _params.extent);
        //spatialReference: esri.SpatialReference: spatial reference well-known-id
        this.spatialReference = (ext && ext.spatialReference) ? ext.spatialReference : null;
      
        //currently visible area of map
        this.__visibleRect = new Rect(0, 0, width, height);
        this.__visibleDelta = new Rect(0, 0, width, height);
      
        var _layersDiv = (this._layersDiv = dcr("div", { id:id + "_layers" }));
        dac(_layersDiv, "layersDiv");
        _cont.appendChild(_layersDiv);
      
        //initialize zoom animation div
        this._zoomAnimDiv = dcr("div", { style:{ position:"absolute" }});

        if (_params.infoWindow) {
          this.infoWindow = _params.infoWindow;
        }
        else {
          //initialize div for info window
          var iw = (this.infoWindow = new esri.dijit.InfoWindow({ map: this, title:"", id:id + "_infowindow" }, dcr("div", null, _root)));
          iw.startup();
          iw._ootb = true; // mark for internal use
          //infoWindow.hide();
          ds(iw.domNode, "zIndex", _ZINDEX_INFO);
        }

        // this._infoWindowZoomStartHandler = dh(this, this._infoWindowZoomStartHandler);
        // this._infoWindowExtentChangeHandler = dh(this, this._infoWindowExtentChangeHandler);

        //this._connects.push(dc(infoWindow, "onShow", this, "_infoWindowShowHandler"), dc(infoWindow, "onHide", this, "_infoWindowHideHandler"));

        this._zoomStartHandler = dh(this, this._zoomStartHandler);
        this._zoomingHandler = dh(this, this._zoomingHandler);
        this._zoomEndHandler = dh(this, this._zoomEndHandler);
        this._panningHandler = dh(this, this._panningHandler);
        this._panEndHandler = dh(this, this._panEndHandler);
        this._endTranslate = dh(this, this._endTranslate);
        
        dojo.addOnWindowUnload(this, this.destroy);
      },
      
      _cleanUp: function() {
        // this.inherited("_cleanUp", arguments);
        //summary: clean up to prevent browser memory leaks
        //event handlers

        var iw = this.infoWindow;
        if (iw) {
          //iw.hide();
          if (iw._ootb) {
            iw.destroy();
          }
          else {
            iw.unsetMap(this);
          }
          delete this.infoWindow;
        }
        
        var cons = this._connects, i;

        for (i=cons.length-1; i>=0; i--) {
          ddc(cons[i]);
          delete cons[i];
        }
        
        ddc(this._tsTimeExtentChange_connect);
        this.setInfoWindowOnClick(false);
        
        dojo.destroy(this.root);
        this.root = null;
      },
      
      //layer handling
      _addLayer: function(/*esri.layers.Layer*/ layer, /*[]*/ layersArr, /*Number?*/ index) {
        //set layer id if none already specified
        var id = (layer.id = layer.id || (layer instanceof GraphicsLayer ? mapDefaults.graphicsLayerNamePrefix : mapDefaults.layerNamePrefix) + (uid++) /*layersArr.length*/);
        this._layers[id] = layer;

        var i;
        if (layersArr === this.layerIds || layersArr === this.graphicsLayerIds) {
          i = this._layerSize;
          this._layerSize++;
        }

        index = (index === undefined || index < 0 || index > layersArr.length) ? layersArr.length : index;

        //determine if base layer
        if (i === 0) {
          this._firstLayerId = id;
        }

        //determine index for layer
        layersArr.splice(index, 0, id);

        // TODO
        // Need to destroy all the connect tokens after the 
        // corresponding event has fired
        var _addLayerHandler = dh(this, this._addLayerHandler),
            self = this,
            _connects = this._connects,
            addLayerClosure = function() {
                                if (layer.loaded) {
                                  _addLayerHandler(layer);
                                }
                                else {
                                  self[id + "_addtoken_load"] = dc(layer, "onLoad", self, "_addLayerHandler");
                                  self[id + "_addtoken_err"] = dc(layer, "onError", self, function(error) {
                                    _addLayerHandler(layer, error, layersArr);
                                  });
                                }
                              };

        if (this.loaded || i === 0 || (layer.loaded && iOf(this.graphicsLayerIds, id) === -1)) {
          addLayerClosure();
        }
        else {
          _connects.push(dc(this, "onLoad", addLayerClosure));
        }

        return layer;
      },

      _addLayerHandler: function(/*esri.layers.Layer*/ layer, /*Error?*/ error, /*String[]?*/ layersArr) {
        var id = this.id,
            layerId = layer.id,
            layerIndex = iOf(layer instanceof GraphicsLayer ? this.graphicsLayerIds : this.layerIds, layerId),
            zIndex = layerIndex,
            isInternalLayer = false,
            _params = this._params;
            
        // disconnect the load/error tokens for this layer
        ddc(this[layerId + "_addtoken_load"]);
        ddc(this[layerId + "_addtoken_err"]);

        // Check if error occurred while loading the layer
        if (error) {
          delete this._layers[layerId];
          if (layerIndex !== -1) {
            layersArr.splice(layerIndex, 1);
            this.onLayerAddResult(layer, error);
          }
          return;
        }
        
        if (layerIndex === -1) {
          layerIndex = iOf(this._internalLayerIds, layerId);
          zIndex = _ZINDEX_GRAPHICS + layerIndex;
          isInternalLayer = true;
        }

        if (layer instanceof GraphicsLayer) {
          var group = layer._setMap(this, this._gc._surface);
          group.id = id + "_" + layerId;
          this._layerDivs[layerId] = group;
          this._reorderLayers(this.graphicsLayerIds);

          //TODO: Move to _Map
          if (_params.showInfoWindowOnClick) {
            this._clickHandles.push(dc(layer, "onClick", this, "_gClickHandler"));
            // TODO
            // We should be disconnecting when this layer is removed from map
          }
        }
        else {
          var layerDiv = layer._setMap(this, this._layersDiv, zIndex, this.__LOD);
          layerDiv.id = id + "_" + layerId;
          //ds(layerDiv, "zIndex", zIndex);
          this._layerDivs[layerId] = layerDiv;
          this._reorderLayers(this.layerIds);
          if (!isInternalLayer && layer.declaredClass.indexOf("VETiledLayer") !== -1){
            this._onBingLayerAdd(layer);
          }
        }

        if (layerId === this._firstLayerId) {
          this.spatialReference = this.spatialReference || layer.spatialReference;
          
          // Verify wrap support now that map's SR is available
          var mapSR = this.spatialReference;
          this.wrapAround180 = (this.wrapAround180 && mapSR && mapSR._isWrappable()) ? true : false;
          
          if (layer.tileInfo) {
            if (!this.__tileInfo) {
              _initTileInfo(mixin({}, layer.tileInfo), _params);
              this.__tileInfo = _params.tileInfo;
            }
            else {
              // We've already got "lods" but other tileInfo properties
              // are placeholders added in the constructor without
              // any knowledge of the tiled layer to be added. So,
              // let's mixin those other properties
              var lods = this.__tileInfo.lods;
              this.__tileInfo = mixin({}, layer.tileInfo);
              this.__tileInfo.lods = lods;
            }
          }
          
          if (this.wrapAround180) {
            var tileInfo = this.__tileInfo, info = mapSR._getInfo();
            
            // TODO
            // We need to overlap tiles to fix an issue where the horizon
            // does not align with tile boundary. This can happen if one of the
            // following conditions is true:
            // 1. tile origin is not -180
            // 2. scale for a given level is chosen such that horizon does not
            //    align with tile boundary
            // Once we fix this issue, the "second condition" in the following
            // decision block can be removed.
            // See also: TiledMapServiceLayer::_setMap
            if (!tileInfo || Math.abs(info.origin[0] - tileInfo.origin.x) > info.dx) {
              this.wrapAround180 = false;
            }
            
            if (this.wrapAround180 && tileInfo) {
              // Let's make sure all LODs have _frameInfo
              // Note that tileInfo will be augmented by _addFrameInfo
              esri.TileUtils._addFrameInfo(tileInfo, info);
            }
          }
          
          _params.units = layer.units;

          this._gc = new esri.layers._GraphicsContainer();
          var gc = this._gc._setMap(this, this._layersDiv);
          gc.id = id + "_gc";
          //ds(gc, "zIndex", _ZINDEX_GRAPHICS);

          this.graphics = new GraphicsLayer({
            id: id + "_graphics",
            displayOnPan: _params.displayGraphicsOnPan
          });
          this._addLayer(this.graphics, this._internalLayerIds, _ZINDEX_GRAPHICS);
        }

        if (layer === this.graphics) {
          // FIXES CR 58077: For Map:  include enable and disable methods for map navigation arrows and slider
          // These statements moved into enableMapNavigation()

          // TODO
          // Ideally, we don't want to reshape here as it is automatically
          // done within __setExtent. But, in IE, that would result in a crash 
          // while creating the slider trying to access __LOD in getLevel().
          // Fix it when adding "fit" to constructor options
          if (this.extent) {
            //var x = this._getAdjustedExtent(this.extent);
            var x = this._fixExtent(this.extent, _params.fitExtent);
            this.extent = x.extent;
            this.__LOD = x.lod;
          }

          var fli = this._firstLayerId;
          this._firstLayerId = null;
          this.__setExtent(this.extent || new Extent(this._layers[fli].initialExtent || this._layers[fli].fullExtent), null, null, _params.fitExtent);

          this.loaded = true;
          this.infoWindow.setMap(this);
          this.onLoad(this);
        }

        if (! isInternalLayer) {
          this.onLayerAdd(layer);
          this.onLayerAddResult(layer);
        }
        ddc(this[layerId + "_addLayerHandler_connect"]);
      },
      
      /*_filterLods: function(tileInfo, mapSR) {
        mapSR = mapSR || this.spatialReference;
        
        var mapWidth = this.width, info = mapSR._getInfo(), world = 2 * info.valid[1];
        
        //console.log("Before: ", lods.length);
        var lods = dojo.filter(tileInfo.lods, function(lod) {
          return (lod.resolution * mapWidth) <= world;
        });
        //console.log("After: ", lods.length);
        
        dojo.forEach(lods, function(lod, index) {
          lod.level = index;
        });
        
        tileInfo.lods = lods;
        
        // Let's make sure all LODs have _frameInfo
        // Note that tileInfo will be augmented by _addFrameInfo
        esri.TileUtils._addFrameInfo(tileInfo, info);
      },*/
      
      _reorderLayers: function(layerIds) {
        //reorder layer z-indices whenever a new layer is added/removed or reordered
        var onLayerReorder = this.onLayerReorder,
            djp = dojo.place,
            _layerDivs = this._layerDivs,
            _layers = this._layers,
            gcES = this._gc ? this._gc._surface.getEventSource() : null;

        if (layerIds === this.graphicsLayerIds) {
          dojo.forEach(layerIds, function(id, i) {
            var layerDiv = _layerDivs[id];
            if (layerDiv) {
              djp(layerDiv.getEventSource(), gcES, i);
              onLayerReorder(_layers[id], i);
            }
          });
        }
        else {
          var g = this.graphics,
              gId = g ? g.id : null,
              _layersDiv = this._layersDiv,
              layerDiv;

          dojo.forEach(layerIds, function(id, i) {
            layerDiv = _layerDivs[id];
            if (id !== gId && layerDiv) {
              djp(layerDiv, _layersDiv, i);
              //ds(layerDiv, "zIndex", i);
              onLayerReorder(_layers[id], i);
            }
          });

          if (gcES) {
            gcES = esri.vml ? gcES.parentNode : gcES;
            djp(gcES, gcES.parentNode, layerIds.length);
          }
        }

        this.onLayersReordered([].concat(layerIds));
      },

      //zoom animation handlers
      _zoomStartHandler: function() {
        this.__zoomStart(this._zoomAnimDiv.startingExtent, this._zoomAnimDiv.anchor);
      },

      _zoomingHandler: function(rect) {
        var rl = parseFloat(rect.left),
            rt = parseFloat(rect.top),
            extent = new Extent(rl, rt - parseFloat(rect.height), rl + parseFloat(rect.width), rt, this.spatialReference),
            scale = this.extent.getWidth() / extent.getWidth();

        this.__zoom(extent, scale, this._zoomAnimDiv.anchor);
      },

      _zoomEndHandler: function() {
        var _zAD = this._zoomAnimDiv,
            extent = _zAD.extent,
            scale = this.extent.getWidth() / extent.getWidth();
        
        var anchor = _zAD.anchor, newLod = _zAD.newLod, change = _zAD.levelChange;
        _zAD.extent = _zAD.anchor = _zAD.levelChange = _zAD.startingExtent = _zAD.newLod = this._delta = this._zoomAnim = null;

        this.__zoomEnd(extent, scale, anchor, newLod, change);
      },

      //pan animation handlers
      _panningHandler: function(delta) {
        // "delta" can be NaN if panDuration is 0. We need better high-level
        // map APIs to support the case where user wants immediate (non-animated)
        // change to map extent
        if (isNaN(parseFloat(delta.left)) || isNaN(parseFloat(delta.top))) {
          var round = Math.round, dojoStyle = dojo.style,  
              node = this._panAnim.node;
          
          // IE: Update the input "delta" object so that no more exceptions
          // thrown in dojo/_base/fx.js:_cycle after firing onAnimate
          delta.left = (-1 * (this._delta.x - round(this.width / 2))) + "px";
          delta.top = (-1 * (this._delta.y - round(this.height / 2))) + "px";
          
          // Update the animated node so that panEndHandler below can make
          // informed decision
          dojoStyle(node, "left", delta.left);
          dojoStyle(node, "top", delta.top);
        }
        
        var d = new Point(parseFloat(delta.left), parseFloat(delta.top)),
            dm = this.toMap(d);
            
        this.onPan(this.extent.offset(dm.x, dm.y), d);
      },

      _panEndHandler: function(node) {
        // FIXES CR 58626: The second call of PanWhatever() does not work in two continuous pan calls.
        this.__panning = false;

        var round = Math.round, delta = new Point(-round(parseFloat(node.style.left)), -round(parseFloat(node.style.top))), // this._delta.offset(-round(this.width / 2), -round(this.height / 2)),
            dx = delta.x,
            dy = delta.y,
            _vr = this.__visibleRect,
            _vd = this.__visibleDelta;

        _vr.x += -dx;
        _vr.y += -dy;
        _vd.x += -dx;
        _vd.y += -dy;

        ds(this._zoomAnimDiv, { left:"0px", top:"0px" });

        var extent = this.extent,
            rw = this._ratioW,
            rh = this._ratioH;
        extent = (this.extent = new Extent(extent.xmin + (dx / rw),
                                           extent.ymin - (dy / rh),
                                           extent.xmax + (dx / rw),
                                           extent.ymax - (dy / rh),
                                           this.spatialReference));

        delta.setX(-delta.x);
        delta.setY(-delta.y);

        this._delta = this._panAnim = null;
        this.onPanEnd(extent, delta);
        this.onExtentChange(extent, delta, false, this.__LOD);
      },
      
      _fixExtent: function(extent, /*Boolean?*/ fit) {
        var reshaped = this._reshapeExtent(extent),
            zoomFactor = 1.0 + _FIT_ZOOM_FACTOR;

        while (fit === true &&
            (reshaped.extent.getWidth() < extent.getWidth() || reshaped.extent.getHeight() < extent.getHeight()) &&
            reshaped.lod.level > 0 &&
            zoomFactor <= _FIT_ZOOM_MAX) {
          reshaped = this._reshapeExtent(extent.expand(zoomFactor));
          zoomFactor += _FIT_ZOOM_FACTOR;
        }
        
        return reshaped;
      },
      
      _getFrameWidth: function() {
        // Assumes being called after the map is loaded
        var width = -1, info = this.spatialReference._getInfo();
        
        if (this.__LOD) { // tiled base layer
          var frameInfo = this.__LOD._frameInfo;
          if (frameInfo) {
            width = frameInfo[3];
          }
        }
        else if (info) { // dynamic base layer
          width = Math.round( (2 * info.valid[1]) / (this.extent.getWidth() / this.width) );
        }
        
        return width;
      },
      
      //extent handling
      _reshapeExtent: function(extent) {
        //summary: Reshapes and returns the argument extent such that its aspect ratio matches that of the map
        // extent: esri.geometry.Extent: Extent object to reshape
        // anchor?: String: Named position to use as anchor when resizing extent. Same as resize anchor argument.
        var w = extent.getWidth(),
            h = extent.getHeight(),
            r = w / h,
            ratio = this.width / this.height,

            dw = 0,
            dh = 0;

        // The input extent need not necessarily have the same aspect ratio
        // as the map control. So, the general idea behind this reshaping is 
        // to fix the extent so that its aspect ratio is the same as that of
        // map control, while making sure that the user can see the extent in
        // its entirety.

        if (this.width > this.height) {
          if (w > h) {
            if (ratio > r) {
              dw = (h * ratio) - w;
            }
            else {
              dh = (w / ratio) - h;
            }
          }
          else if (w < h) {
            dw = (h * ratio) - w;
          }
          else {
            dw = (h * ratio) - w;
          }
        }
        else if (this.width < this.height) {
          if (w > h) {
            dh = (w / ratio) - h;
          }
          else if (w < h) {
            if (ratio > r) {
              //dh = (w / ratio) - h;
              dw = (h * ratio) - w;
            }
            else {
              //dw = (h * ratio) - w;
              dh = (w / ratio) - h;
            }
          }
          else {
            dh = (w / ratio) - h;
          }
        }
        else {
          if (w < h) {
            dw = h - w;
          }
          else if (w > h) {
            dh = (w / ratio) - h;
          }
        }

        if (dw) {
          extent.xmin -= dw / 2;
          extent.xmax += dw / 2;
        }
        if (dh) {
          extent.ymin -= dh / 2;
          extent.ymax += dh / 2;
        }

        return this._getAdjustedExtent(extent);
      },

      _getAdjustedExtent: function(extent) {
        if (this.__tileInfo) {
          return esri.TileUtils.getCandidateTileInfo(this, this.__tileInfo, extent);
        }
        else {
          return { extent:extent };
        }
      },
      
      //pan operation
//      _panTo: function(/*esri.geometry.Point*/ point) {
//        // point: map coordinates of new center point
//        var ewd = this.extent.getWidth(),
//            eht = this.extent.getHeight(),
//            xmin = point.x - (ewd / 2),
//            xmax = xmin + ewd,
//            ymin = point.y - (eht / 2),
//            ymax = ymin + eht;
//        this.__setExtent(new Extent(xmin, ymin, xmax, ymax));
//      },
      
      _fixedPan: function(dx, dy) {
        //this._panTo(this.toMap(new Point((this.width / 2) + dx, (this.height / 2) + dy)));
        this._extentUtil(null, { dx: dx, dy: dy });
      },
      
      //info window handling
      _gClickHandler: function(evt) {
        var graphic = evt.graphic, iw = this.infoWindow;
        // TODO
        // Why should we check if the graphic has an infotemplate,
        // can't we just call getTitle/getContent?
        if (graphic._getEffInfoTemplate() && iw) {
          dojo.stopEvent(evt);
          //this._showInfoWindow(graphic, evt.mapPoint);

          var geometry = graphic.geometry, 
              mapPoint = (geometry && geometry.type === "point") ? geometry : evt.mapPoint;
          
          iw.setTitle(graphic.getTitle());
          iw.setContent(graphic.getContent());
          iw.show(mapPoint/*, this.getInfoWindowAnchor(sp)*/);
        }
      },
      
      _onBingLayerAdd : function(layer){
        this["__" + layer.id + "_vis_connect"] = dojo.connect(layer, "onVisibilityChange", this, "_toggleBingLogo");        
        this._toggleBingLogo(layer.visible);
      },
      
      _onBingLayerRemove : function(layer){
        dojo.disconnect(this["__" + layer.id + "_vis_connect"]);
        delete this["__" + layer.id + "_vis_connect"];
        
        //Check if any other layers in the map are bing layers.
        var layerIds = this.layerIds;
        var moreBing = dojo.some(layerIds, function(layerId){
          var layer = this._layers[layerId];
          return layer && layer.visible && layer.declaredClass.indexOf("VETiledLayer") !== -1;
        }, this);
        
        this._toggleBingLogo(moreBing);
      },
      
      _toggleBingLogo : function(visibility){
        if (visibility && !this._bingLogo){
          var style = {left:(this._mapParams && this._mapParams.nav ? "25px" : "")};
          if (dojo.isIE === 6) {
            style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled='true', sizingMethod='crop', src='" + dojo.moduleUrl("esri") + "../../images/map/logo-med.png" + "')";             
          }
          var bingLogo = this._bingLogo = dojo.create("div", { style: style }, this.root);
          dojo.addClass(bingLogo, "bingLogo-lg");
        } else if (!visibility && this._bingLogo){
          dojo.destroy(this._bingLogo);
          delete this._bingLogo;
        }
      },

      /*_infoWindowShowHandler: function() {
        this._infoWindowIsShowing = true;
        if (! this._iwPan_connect) {
          this._iwPan_connect = dc(this, "onPan", this, "_infoWindowPanHandler");
          this._iwZoomStart_connect = dc(this, "onZoomStart", this, "_infoWindowZoomStartHandler");
          ddc(this._iwExtentChange_connect);
          this._iwExtentChange_connect = dc(this, "onExtentChange", this, "_infoWindowExtentChangeHandler");
        }
      },

      _infoWindowHideHandler: function() {
        this._infoWindowIsShowing = false;
        ddc(this._iwPan_connect);
        ddc(this._iwZoomStart_connect);
        ddc(this._iwExtentChange_connect);
        this._iwPan_connect = this._iwZoomStart_connect = this._iwExtentChange_connect = null;
      },

      _infoWindowPanHandler: function(extent, delta) {
        //this.infoWindow.move(this.infoWindow.coords.offset(delta.x, delta.y));
        this.infoWindow.move(delta, true);
      },

      _infoWindowZoomStartHandler: function() {
        this.infoWindow.hide(null, true);
        this._infoWindowCoords = this.toMap(new Point(this.infoWindow.coords));
        this._infoWindowIsShowing = true;
      },

      _infoWindowExtentChangeHandler: function(extent, delta, levelChange) {
        if (this._infoWindowIsShowing) {
          var _isc;
          if (levelChange) {
            _isc = this.toScreen(this._infoWindowCoords);
          }
          else {
            _isc = this.infoWindow.coords.offset(delta.x, delta.y);
          }
          this.infoWindow.show(_isc, this.getInfoWindowAnchor(_isc), true);
        }
      },

      _showInfoWindow: function(graphic, mp) {
        //summary: Display info window for argument graphic at argument coordinate
        // graphic: esri.Graphic: Graphic to use to display info window
        // coords: esri.geometry.Point: Map coordinate to display info window at
        //var git = graphic.infoTemplate;
        //if (git) {
          var sp = this.toScreen(mp),  //.offset(2, 2);
              iw = this.infoWindow;
          //iw.hide();
          iw.setTitle(graphic.getTitle()).setContent(graphic.getContent());
          iw.show(sp, this.getInfoWindowAnchor(sp));
        //}
      },*/

      //PROTECTED
      __panStart: function(x, y) {
        var zoomAnim = this._zoomAnim,
            panAnim = this._panAnim;
        
        if (zoomAnim && zoomAnim._active) {
          // Let's go to the end of zoom animation and fire
          // onZoomEnd and onExtentChange. Then let *this* pan
          // sequence take over starting with onPanStart call below
          //zoomAnim.gotoPercent(1, true); // this ends up firing onZoomStart which we dont want
          zoomAnim.stop();
          zoomAnim._fire("onEnd", [zoomAnim.node]);
        }
        else if (panAnim && panAnim._active) {
          panAnim.stop(); // freeze frame right where it is at this moment
          this._panAnim = null;

          var rect = panAnim.curve.getValue(panAnim._getStep()),
              rl = Math.round(parseFloat(rect.left)),
              rt = Math.round(parseFloat(rect.top)),
              drag = this._dragOrigin;
          
          // We don't want to fire onPanStart again because pan animation
          // would have already fired it. 
          // Let's continue on with onPan events
          this.__pan(rl, rt);
          
          // Adjust dragOrigin so that _panHandler in map.js can take
          // over from here
          if (drag) {
            drag.x -= rl;
            drag.y -= rt;
          }
          return; // Let's return, we don't want to fire onPanStart
        }

        this.__panning = true;
        this.onPanStart(this.extent, new Point(x, y));
      },
      
      __pan: function(dx, dy) {
        var extent = this.extent,
            rw = this._ratioW,
            rh = this._ratioH;

        this.onPan(new Extent( extent.xmin - (dx / rw),
                               extent.ymin + (dy / rh),
                               extent.xmax - (dx / rw),
                               extent.ymax + (dy / rh),
                               this.spatialReference),
                   new Point(dx, dy));
      },
      
      __panEnd: function(dx, dy) {
        var _vr =this.__visibleRect,
            _vd = this.__visibleDelta;
        
        _vr.x += dx;
        _vr.y += dy;
        _vd.x += dx;
        _vd.y += dy;

        var d = new Point(dx, dy),
            extent = this.extent,
            rw = this._ratioW,
            rh = this._ratioH;
        extent = (this.extent = new Extent(extent.xmin - (dx / rw), extent.ymin + (dy / rh), extent.xmax - (dx / rw), extent.ymax + (dy / rh), this.spatialReference));

        this.__panning = false;
        this.onPanEnd(extent, d);
        this.onExtentChange(extent, d, false, this.__LOD);
      },

      __zoomStart: function(extent, anchor) {
        this.__zooming = true;
        this.onZoomStart(extent, 1, anchor, this.__LOD ? this.__LOD.level : null);
      },
      
      __zoom: function(extent, scale, anchor) {
          this.onZoom(extent, scale, anchor);
      },
      
      __zoomEnd: function(extent, scale, anchor, lod, levelChange) {
        ds(this._layersDiv, { left:"0px", top:"0px" });
        this._delta = new Point(0, 0);
        this.__visibleRect.x = (this.__visibleRect.y = 0);
        
        extent = (this.extent = new Extent(extent));
        this.__LOD = lod;
        
        this._ratioW = this.width / extent.getWidth();
        this._ratioH = this.height / extent.getHeight();
        
        var delta = this._delta;
        this._delta = null;
        this.__zooming = false;
        
        this.onZoomEnd(extent, scale, anchor, lod ? lod.level : null);
        this.onExtentChange(extent, delta, levelChange, lod);
      },
      
      _extentUtil: function(zoom, pan, targetExtent, fit, immediate) {
        // TODO
        // Need a better solution instead of "immediate" option: feels
        // like an ugly shortcut/workaround
        //console.log("[ _extentUtil ]");
        
        // TESTS:
        // Set esri.config.defaults.map.zoomDuration to 2000 before running the
        // tests:
        // Continuously scroll mouse wheel over a map location
        // Scroll mouse wheel down once and up once in quick succession to end up in the extent where you started
        // Scroll mouse wheel over location, immediately scroll over another location
        // Keep pressing NUMPAD_MINUS or NUMPAD_PLUS
        // Press NUMPAD_MINUS once and NUMPAD_PLUS once in quick succession to end up in the extent where you started
        // Keep pressing slider PLUS or MINUS buttons
        // Press slider MINUS once and slider PLUS once in quick succession to end up in the extent where you started
        // Initiate zoom, then call map.panRight
        // Initiate zoom, then call map.centerAt
        // Initiate zoom, then call map.centerAndZoom
        //   Case 1: map.centerAndZoom(esri.geometry.fromJson({"x":364986.4881850274,"y":6252854.5,"spatialReference":{"wkid":102100}}), 10)
        //   Case 2: map.centerAndZoom(esri.geometry.fromJson({"x":364986.4881850274,"y":6252854.5,"spatialReference":{"wkid":102100}}), 110)
        // Initiate zoom, then call map.setExtent
        // Initiate zoom, then call dojo.style(map.container, { width: "1200px"}); map.resize();
        
        var numLevels, targetLevel, factor, mapAnchor, screenAnchor, mapCenter,
            dx, dy, mapWidth = this.width, mapHeight = this.height;
        
        // Unpack input parameters
        if (zoom) {
          numLevels = zoom.numLevels; 
          targetLevel = zoom.targetLevel; 
          factor = zoom.factor;
          mapAnchor = zoom.mapAnchor; 
          screenAnchor = zoom.screenAnchor;
          mapCenter = zoom.mapCenter;
        }
        if (pan) {
          dx = pan.dx;
          dy = pan.dy;
          mapCenter = pan.mapCenter;
        }
        
        var panAnim = this._panAnim, 
            zoomAnim = this._stopAnim(), 
            currentExtent = zoomAnim ? zoomAnim.divExtent : this.extent,
            tileInfo = this.__tileInfo,
            xmin, ymin, ewd, eht;
       
       if (panAnim && mapAnchor && screenAnchor) {
         // Re-calculate the map anchor based on the latest map extent
         mapAnchor = toMapPt(this.extent, mapWidth, mapHeight, screenAnchor);
       }
       
       if (zoomAnim && mapAnchor && screenAnchor) {
         // The current anchor may be different from the previous one.
         // Let's adjust the map coordinates of the current anchor so that
         // the targetExtent is correct (after zoom end) and in sync with the anchor
         mapAnchor = toMapPt(zoomAnim.divExtent, mapWidth, mapHeight, screenAnchor);
         // TODO
         // Even after we make this adjustment this, positioning during onZoom 
         // does not feel right:
         // Could be paritally fixed by having __setExtent use "anchor" for 
         // _zAD.anchor even if zoomAnchor is available
       }
       
        // Pre-process "targetLevel" and convert it to "numLevels"
        if (esri._isDefined(targetLevel)) {
          if (tileInfo) {
            var maxLevel = this.getNumLevels() - 1;
            if (targetLevel < 0) {
              targetLevel = 0;
            }
            else if (targetLevel > maxLevel) {
              targetLevel = maxLevel;
            }
            
            numLevels = targetLevel - (zoomAnim ? zoomAnim.level : this.getLevel());
          }
          else {
            numLevels = targetLevel > 0 ? -1 : 1;
          }
        }
            
        if (targetExtent) {
          // Nothing to do here. Just call __setExtent.
        }
        // ===== ZOOM ROUTINE =====
        else if (esri._isDefined(numLevels)) {
          var size;
          if (tileInfo) {
            var currentLevel = zoomAnim ? zoomAnim.level : this.getLevel();
            size = this.__getExtentForLevel(currentLevel + numLevels, mapCenter, currentExtent).extent;
          }
          else {
            // NOTE
            // It's debatable if we need to use temp instead of currentExtent.
            // At this time, in the interest of maintaining compat in cases where
            // user clicks on zoom buttons or use scroll wheel (where basemap is 
            // a dynamic layer), temp is used.
            var temp = zoomAnim ? zoomAnim.end : this.extent;
            size = temp.expand(numLevels > 0 ? 0.5 * numLevels : 2 * -numLevels);
          }
          
          if (size) {
            if (mapCenter) {
              targetExtent = size;
            }
            else {
              var center = mapAnchor || currentExtent.getCenter(),
                  ymax = currentExtent.ymax - ((size.getHeight() - currentExtent.getHeight()) * (center.y - currentExtent.ymax) / currentExtent.getHeight());

              xmin = currentExtent.xmin - ((size.getWidth() - currentExtent.getWidth()) * (center.x - currentExtent.xmin) / currentExtent.getWidth());
              
              targetExtent = new Extent(xmin, ymax - size.getHeight(), xmin + size.getWidth(), ymax, this.spatialReference);
            }
          }
        }
        else if (esri._isDefined(factor)) {
          // TODO
          // Probably don't need this code path - not used?
          targetExtent = currentExtent.expand(factor);
        }
        // ===== PAN ROUTINE =====
        else if (dx || dy) {
          //console.log("dx = ", dx, ", dy = ", dy, ", mapCenter = ", dojo.toJson(mapCenter.toJson()));
          
          if (zoomAnim) {
            var end = zoomAnim.end,
                c1 = end.getCenter(),
                c2 = toScreenPt(end, mapWidth, mapHeight, c1);
            c2.x += dx;
            c2.y += dy;
            c2 = toMapPt(end, mapWidth, mapHeight, c2);
            
            targetExtent = end.offset(c2.x - c1.x, c2.y - c1.y);
          }
          else {
            var screenPt = new Point((mapWidth / 2) + dx, (mapHeight / 2) + dy),
                mapPt = toMapPt(currentExtent, mapWidth, mapHeight, screenPt);

            ewd = currentExtent.getWidth();
            eht = currentExtent.getHeight();
            xmin = mapPt.x - (ewd / 2);
            ymin = mapPt.y - (eht / 2);
            
            targetExtent = new Extent(xmin, ymin, xmin + ewd, ymin + eht);
          }
        }
        
        // Fallback
        if (!targetExtent) {
          if (mapCenter) {
            var ext = zoomAnim ? zoomAnim.end : currentExtent;
            
            ewd = ext.getWidth();
            eht = ext.getHeight();
            xmin = mapCenter.x - (ewd / 2);
            ymin = mapCenter.y - (eht / 2);
            
            targetExtent = new Extent(xmin, ymin, xmin + ewd, ymin + eht);
          }
          else if (zoomAnim) {
            targetExtent = zoomAnim.end;
          }
        }
        
        if (targetExtent) {
          this.__setExtent(targetExtent, null, screenAnchor, fit, zoomAnim, immediate);
        }
      },

      __setExtent: function(/*Extent*/ extent, /*Object*/ delta, /*esri.geometry.Point? screenPoint*/ zoomAnchor, /*Boolean?*/ fit, /*Object?*/ zoomAnim, immediate) {
        try {
        if (this._firstLayerId) {
          this.extent = extent;
          return;
        }
        
        //console.log("__setExtent: target scale = ", this.extent.getWidth() / extent.getWidth());

        var levelChange = true,
            ext = zoomAnim ? zoomAnim.divExtent : this.extent,
            reshaped = this._fixExtent(extent, fit || false);

        extent = reshaped.extent;
        
        var extentwd = extent.getWidth(),
            extentht = extent.getHeight(),
            round = Math.round;

        if (ext) {
          var tw = round(ext.getWidth() * _LEVEL_CHANGE_FACTOR),
              w = round(extentwd * _LEVEL_CHANGE_FACTOR),
              th = round(ext.getHeight() * _LEVEL_CHANGE_FACTOR),
              h = round(extentht * _LEVEL_CHANGE_FACTOR);
          levelChange = (tw !== w) || (th !== h);
        }
        
        //console.log("1. levelChange = " + levelChange);

        var anchor, end, ratioW, ratioH, //ratioW/H for resize animation
            start = zoomAnim && zoomAnim.rect,
            startingExtent = zoomAnim && zoomAnim.divExtent;
        
        if (mapDefaults.zoomDuration && levelChange && ext) {
          startingExtent = startingExtent || new Extent(ext); //mixin({}, ext);
          start = start || { left:ext.xmin, top:ext.ymax, width:ext.getWidth(), height:ext.getHeight() };
          end = { left:extent.xmin, top:extent.ymax, width:extentwd, height:extentht };
          ratioW = start.width / end.width;
          ratioH = start.height / end.height;

          // Draw a line from top-left corner of current extent -> top-left corner of new extent
          // Draw a line from bottom-left corner of current extent -> bottom-left corner of new extent
          // "anchor" is the point where the above two lines (extended) intersect
          var mtl = new Point(extent.xmin, extent.ymax),
              mbl = new Point(extent.xmin, extent.ymin),
              etl = new Point(this.extent.xmin, this.extent.ymax),
              ebl = new Point(this.extent.xmin, this.extent.ymin);
          anchor = esri.geometry.getLineIntersection(etl, mtl, ebl, mbl);
          //console.log("calc anchor = " + (anchor ? dojo.toJson(anchor.toJson()) : "null"));
          if (!anchor && !zoomAnim) {
            // no intersection => parallel lines => no level change
            
            // However, if there was zoomAnim that is now stopped, then we know from
            // the fact there was previous animation sequence that we certainly have a 
            // levelChange. So let's not make it false just because the lines were
            // parallel
            levelChange = false;
          }
        }

        //ratioW/H for map
        this._ratioW = this.width / extentwd; //Math.abs(ext.xmax - ext.xmin);
        this._ratioH = this.height / extentht; //Math.abs(ext.ymax - ext.ymin);
        
        var _zAD = this._zoomAnimDiv;
        
        //console.log("2. levelChange = " + levelChange);

        if (levelChange) {
          ds(this._layersDiv, { left:"0px", top:"0px" });
          delta = new Point(0, 0);

          // FIXES CR 58592: layer.hide()/show() do not work properly.
          // ISSUE: Misalignment of the layers when you do a PAN and then ZOOM.
          // This fix avoids tiledlayer._div from being reset to 0,0 in layer._onExtentChangehandler() - thereby avoiding the
          this.__visibleRect.x = (this.__visibleRect.y = 0);

          if (start && end) {
            this._delta = delta;
            _zAD.id = "_zAD";
            _zAD.startingExtent = startingExtent;
            _zAD.extent = extent;
            _zAD.levelChange = levelChange;
            _zAD.newLod = reshaped.lod;

            if (zoomAnchor) {
              //console.log("zoomAnchor = " + dojo.toJson(zoomAnchor.toJson()));
              _zAD.anchor = zoomAnchor;
            }
            else {
              if (!anchor && zoomAnim) {
                // Happens when you zoom out(NUMPAD_MINUS) => In the middle of anim zoom back in (NUMPAD_PLUS),
                // where getLineIntersection returns null due to parallel lines
                _zAD.anchor = zoomAnim.anchor;
              }
              else {
                _zAD.anchor = toScreenPt(this.extent, this.width, this.height, anchor);
              }
              //console.log("_zAD.anchor = " + dojo.toJson(_zAD.anchor.toJson()));
            }
            
            // window.requestAnimationFrame API:
            // Is an alternative to dojo.Animation (dojo/_base/fx.js):
            // http://notes.jetienne.com/2011/05/18/cancelRequestAnimFrame-for-paul-irish-requestAnimFrame.html
            // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
            // https://developer.mozilla.org/en/DOM/window.mozRequestAnimationFrame

            this._zoomAnim = esri.fx.resize({
              node: _zAD,
              start: start,
              end: end,
              duration: mapDefaults.zoomDuration,
              rate: mapDefaults.zoomRate,
              beforeBegin: !zoomAnim ? this._zoomStartHandler : null,
              onAnimate: this._zoomingHandler,
              onEnd: this._zoomEndHandler
            }).play();

            /*if (this.navigationMode === "css-transforms") {
              // Fire onScale event if map.navigationMode is "css-transforms"
              var scaleFactor = this.extent.getWidth() / extent.getWidth(),
                  vd = this.__visibleDelta,
                  mtx = dojox.gfx.matrix.scaleAt(scaleFactor, {
                    x: -1 * ( (this.width / 2) - (_zAD.anchor.x - vd.x) ),
                    y: -1 * ( (this.height / 2) - (_zAD.anchor.y - vd.y) )
                  });
              
              this.onScale(mtx);
            }*/
            this._fireOnScale(this.extent.getWidth() / extent.getWidth(), _zAD.anchor);
          }
          else {
            this.extent = extent;
            this.onExtentChange(this.extent, delta, levelChange, (this.__LOD = reshaped.lod));
          }
        }
        else {
          if (! this.__panning) {
            if (this.loaded === false || immediate) {
              this.extent = extent;
              this.onExtentChange(this.extent, delta, levelChange, (this.__LOD = reshaped.lod));
            }
            else {
              // FIXES CR 58626: The second call of PanWhatever() does not work in two continuous pan calls.
              this.__panning = true;

              //summary: Pans map to argument 
              start = new Rect(0, 0, this.width, this.height, this.spatialReference).getCenter();
              start.x = round(start.x);
              start.y = round(start.y);
              this.onPanStart(this.extent, new Point(0, 0));

              // See _panningHandler for how this._delta is used
              var point = (this._delta = this.toScreen(extent.getCenter()));
              
              this._panAnim = esri.fx.slideTo({
                node: _zAD,
                left: start.x - point.x,
                top: start.y - point.y,
                duration: mapDefaults.panDuration,
                rate: mapDefaults.panRate,
                onAnimate: this._panningHandler,
                onEnd: this._panEndHandler
              });
              
              // "play" call is a separate statement so that this._panAnim
              // reference is available to _panningHandler
              this._panAnim.play();
            }
          }
        }
        }
        catch(e) {
          console.log(e.stack);
          console.error(e);
        }
      },
      
      _fireOnScale: function(scaleFactor, anchor, immediate) {
        if (this.navigationMode === "css-transforms") {
          // Fire onScale event if map.navigationMode is "css-transforms"
          var vd = this.__visibleDelta;
          
          this.onScale(dojox.gfx.matrix.scaleAt(
            scaleFactor, 
            {
              x: -1 * ( (this.width / 2) - (anchor.x - vd.x) ),
              y: -1 * ( (this.height / 2) - (anchor.y - vd.y) )
            }
          ), immediate);
        }
      },
      
      _stopAnim: function() {
        var zoomAnim = this._zoomAnim,
            panAnim = this._panAnim;
        
        // NOTE
        // Internal members used here: see dojo/_base/fx.js for reference
        
        // TODO
        // IE 9 stalls a bit when panning right after initiating zoom
        // IE 7, 8, 9: initiate zoom by a level, then grab the map to start
        //   panning, you'll notice that the map image doesn't reflect zoom-end.
        //   Rather it stays right where it is at that moment in animation sequence
        
        if (zoomAnim && zoomAnim._active) {
          zoomAnim.stop();
          //console.log("ZOOM STOPPED: ", zoomAnim._percent, " - ", zoomAnim._getStep(), " - ", dojo.toJson(zoomAnim.curve.getValue(zoomAnim._getStep())));

          var rect = zoomAnim.curve.getValue(zoomAnim._getStep()),
              rl = parseFloat(rect.left),
              rt = parseFloat(rect.top),
              node = zoomAnim.node;
          
          //console.log("node width = " + node.style.width);
          
          return {
            anchor: node.anchor,
            start: node.startingExtent,
            end: node.extent,
            level: node.newLod && node.newLod.level,
            rect: rect,
            divExtent: new Extent(rl, rt - parseFloat(rect.height), rl + parseFloat(rect.width), rt, this.spatialReference)
          };
        }
        // Don't expect to see live pan and zoom animations at the same time
        else if (panAnim && panAnim._active) {
          panAnim.stop();
          //console.log("PAN STOPPED: ", panAnim._percent, " - ", panAnim._getStep(), " - ", dojo.toJson(panAnim.curve.getValue(panAnim._getStep())));
          
          // Officially end this pan sequence in its current state
          panAnim._fire("onEnd", [panAnim.node]);
        }
      },

      __getExtentForLevel: function(/*Number*/ level, /*esri.geometry.Point?*/ center, /*esri.Extent?*/ extent) {
        //previously _setLevel
        //summary: Sets the level of the map if within range of base TiledLayer's range
        // level: int: Level of map to zoom to
        var ti = this.__tileInfo;
        extent = extent || this.extent;
        center = center || extent.getCenter();

        if (ti) {
          var lods = ti.lods;

          if (level < 0 || level >= lods.length) {
            return {};
          }

          var lod = lods[level],
              extW2 = this.width * lod.resolution / 2,
              extH2 = this.height * lod.resolution / 2;

          return { extent: new Extent(center.x - extW2, center.y - extH2, center.x + extW2, center.y + extH2, center.spatialReference), lod: lod };
        }
        else {
          return { extent: extent.expand(level).centerAt(center) };
        }
      },

      __scaleExtent: function(extent, scale, center) {
        var anchor = center || extent.getCenter();

        var newExt = extent.expand(scale),
            xmin = extent.xmin - ((newExt.getWidth() - extent.getWidth()) * (anchor.x - extent.xmin) / extent.getWidth()),
            ymax = extent.ymax - ((newExt.getHeight() - extent.getHeight()) * (anchor.y - extent.ymax) / extent.getHeight());

        return new Extent(xmin, ymax - newExt.getHeight(), xmin + newExt.getWidth(), ymax, extent.spatialReference);
      },
      
      _jobs: 0, // indicates the number of pending updates

      _incr: function() {
        /*
         * This function will be called by all map layers
         * when they begin updating their content
         * See Layer::_fireUpdateStart
         */
        if ((++this._jobs) === 1) {
          // Fire the event for the first update only
          this.updating = true;
          this.onUpdateStart();
        }
      },
      
      _decr: function() {
        /*
         * This function will be called by all map layers
         * when they are done updating their content
         * See Layer::_fireUpdateEnd
         */
        var count = --this._jobs;
        if (!count) {
          // Fire the event if there are no pending updates
          this.updating = false;
          this.onUpdateEnd();
        }
        else if (count < 0) {
          this._jobs = 0;
        }
      },
      
      onUpdateStart: function() {},
      onUpdateEnd: function(/*Error?*/) {},

      //EVENTS
      //when map has been initialized with 1 layer
      onLoad: function() {
        //summary: Event fired when map is loaded
        this._setClipRect();
      },
      onUnload: function() {
        //summary: Event fired when map is unloaded
      },

      //extent events
      onExtentChange: function(a, b, levelChange) {
        //summary: Event fired once map extent has changed
        // esri.geometry.Extent : extent
        // esri.geometry.Point : delta
        // boolean : levelChange
        // esri.layers.LOD : lod
        //console.log("ON-EXTENT-CHANGE");
        if (levelChange) {
          this._setClipRect();
        }
      },
      
      onTimeExtentChange: function() {
        // Arguments: timeExtent
      },

      //layer events
      onLayerAdd: function() {
        //summary: Event fired when layer added to map
      },
      onLayerAddResult: function() {
        //summary: Event fired after a layer add operation succeeded or failed
        // Arguments: layer, error?
      },
      onLayersAddResult: function() {
        //summary: Event fired when a group of layers are added to the
        // map by calling addLayers method
        // Arguments:
        // [
        //  { layer: <Layer>, success: <Boolean>, error: <Error> },
        //  ...
        // ]
      },
      onLayerRemove: function() {
        //summary: Event fired when a layer is removed
        //Layer : layer
      },
      onLayersRemoved: function() {
        //summary: Event fired when all layers are removed
      },

      onLayerReorder: function() {
        //summary: Event fired when layers are reordered on map
        //esri.layers.Layer : layer
        //Number : new index
      },
      onLayersReordered: function() {
        //summary: Event fired after all layers have been reordered
        //String[]: reordered layer ids list
      },

      //pan
      onPanStart: function() {
        //console.log("<<<<<<<<<<<<<<<<< PAN-START " + dojo.toJson(arguments[1].toJson()));
        //summary: Event fired before map panning starts
      },
      onPan: function() {
        //console.log("pan: " + dojo.toJson(arguments[1].toJson()));
        //summary: Event fired during map pan
      },
      onPanEnd: function() {
        //console.log(">>>>>>>>>>>>>>>>> PAN-END " + dojo.toJson(arguments[1].toJson()));
        //summary: Event fired once map pan has ended
      },
      
      onScale: function() {
        //console.log("------- scale: " + dojo.toJson(arguments[0]));
        // arguments:
        //  matrix - matrix representation of this scale transformation
      },

      //zoom
      onZoomStart: function() {
        //console.log(arguments[1] + "," + arguments[3] + "ZOOM-START <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
        //summary: Event fired before map zoom starts
      },
      onZoom: function() {
        //console.log("zoom: ", arguments[1]);
        //summary: Event fired during map zoom
        //esri.geometry.Extent extent
        //Number scale
        //esri.geometry.Point anchor
      },
      onZoomEnd: function() {
        //console.log(arguments[1] + "," + arguments[3]+ "ZOOM-END >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
        //summary: Event fired once map zoom has ended
      },

      //map control resize
      onResize: function() {
        //summary: Event fired when the map container is resized.
        // arguments[0]: Extent of map
        // arguments[1]: Number: New width
        // arguments[2]: Number: New height
        this._setClipRect();
      },
      onReposition: function() {
        //summary: Event fired when map is respositions
        // arguments[0]: Number: Top-left x coordinate
        // arguments[1]: Number: Top-left y coordinate
      },
      
      //PUBLIC METHODS
      destroy: function() {
        if (!this._destroyed) {
          this.removeAllLayers();
          this._cleanUp();
          if (this._gc) {
            this._gc._cleanUp();
          }
  
          this._destroyed = true;
          this.onUnload(this);
        }
      },
      
      //cursor functions
      setCursor: function(cursor) {
        ds(this.__container, "cursor", (this.cursor = cursor));
      },
      
      setMapCursor: function(c) {
        this.setCursor((this._cursor = c));
      },
      
      resetMapCursor: function() {
        this.setCursor(this._cursor);
      },
      
      setInfoWindow: function(infoWindow) {
        var iw = this.infoWindow;
        if (iw) {
          iw.unsetMap(this);
        }
        
        this.infoWindow = infoWindow;
        
        if (this.loaded && infoWindow) {
          infoWindow.setMap(this);
        }
      },
      
      setInfoWindowOnClick: function(enable) {
        var params = this._params;
        
        if (enable) {
          if (!params.showInfoWindowOnClick) {
            var graphicsLayers = [ this.graphics ].concat(dojo.map(this.graphicsLayerIds, this.getLayer, this));
            
            dojo.map(graphicsLayers, function(layer) {
              if (layer && layer.loaded) {
                this._clickHandles.push(dc(layer, "onClick", this, "_gClickHandler"));
              }
              
              // Note that when a graphics layer is loaded, based on the then
              // showInfoWindowOnClick setting, _addLayerHandler will establish
              // connection (or not)
            }, this);
          }
        }
        else {
          dojo.forEach(this._clickHandles, ddc);
          this._clickHandles = [];
        }

        params.showInfoWindowOnClick = enable;
      },
      
      getInfoWindowAnchor: function(pt) {
        var w2 = this.width / 2,
            h2 = this.height / 2,
            anchor;

        if (pt.y < h2) {
          anchor = "LOWER";
        }
        else {
          anchor = "UPPER";
        }

        if (pt.x < w2) {
          return esri.dijit.InfoWindow["ANCHOR_" + anchor + "RIGHT"];
        }
        else {
          return esri.dijit.InfoWindow["ANCHOR_" + anchor + "LEFT"];
        }
      },
      
      toScreen: function(/*esri.geometry.Point*/ pt, doNotRound) {
        //summary: Converts a point in map coordinates to screen coordinates
        // pt: esri.geometry.Point: Map point to be converted
        // returns: esri.geometry.Point: Resultant point in screen coordinates
        
        // doNotRound is currently used by esri.toolbars._Box to avoid losing
        // precision when doing: map -> screen -> transform screen -> map
        return toScreenPt(this.extent, this.width, this.height, pt, doNotRound);
      },

      toMap: function(/*esri.geometry.Point*/ pt) {
        //summary: Converts a point from screen coordinates to map coordinates.
        // pt: esri.geometry.Point: Screen point to be converted
        // returns: esri.geometry.Point: Resultant point in map coordinates
        return toMapPt(this.extent, this.width, this.height, pt);
      },
      
      //layer functions
      addLayer: function(/*esri.layers.Layer*/ layer, /*int?*/ index) {
        //summary: Add layer to map
        // layer: esri.layers.Layer: Layer object to add to map
        // index: int?: Index of layer from bottom. Base Layer/Bottom most layer is index 0 and the indices increase going up the layer stack. By default the layer is added to the top of the layer stack
        return this._addLayer(layer, layer instanceof GraphicsLayer ? this.graphicsLayerIds : this.layerIds, index);
      },
      
      addLayers: function(layers) {
        var results = [], count = layers.length, token, i, len = layers.length;
        
        // This callback will be called after each layer is added to the map
        var callback = function(layer, error) {
          if (dojo.indexOf(layers, layer) !== -1) {
            count--;
            results.push({ "layer": layer, "success": !error, "error": error });
            if (!count) {
              dojo.disconnect(token);
              this.onLayersAddResult(results);
            }
          }
        };
        token = dojo.connect(this, "onLayerAddResult", callback);
        
        for (i = 0; i < len; i++) {
          this.addLayer(layers[i]);
        }
        return this;
      },

      removeLayer: function(/*esri.layers.Layer*/ layer, doNotReorder) {
        var id = layer.id,
            ids = layer instanceof GraphicsLayer ? this.graphicsLayerIds : this.layerIds,
            i = iOf(ids, id);

        if (i >= 0) {
          ids.splice(i, 1);
          if (layer instanceof GraphicsLayer) {
            ddc(this["_gl_" + layer.id + "_click_connect"]);
            
            // Dont have to call unset on a layer that never finished loading.
            // setMap would've been called if and only when the layer loads.
            // So it doesnt make sense to call unsetMap if the layer has not
            // loaded
            if (layer.loaded) {
              layer._unsetMap(this, this._gc._surface);
            }
          }
          else {
            if (layer.loaded) {
              layer._unsetMap(this, this._layersDiv);
              if (layer.declaredClass.indexOf("VETiledLayer") !== -1) {
                this._onBingLayerRemove(layer);
              }
            }
          }

          delete this._layers[id];
          delete this._layerDivs[id];

          // Avoid re-ordering DOM nodes when we're going down - map is being
          // destroyed
          if (!doNotReorder) {
            this._reorderLayers(ids);
          }
          
          this.onLayerRemove(layer);
        }
      },

      removeAllLayers: function() {
        var ids = this.layerIds, i;
        for (i=ids.length-1; i>=0; i--) {
          this.removeLayer(this._layers[ids[i]], 1);
        }
        ids = this.graphicsLayerIds;
        for (i=ids.length-1; i>=0; i--) {
          this.removeLayer(this._layers[ids[i]], 1);
        }
        this.onLayersRemoved();
      },

      reorderLayer: function(/*String|Layer*/ layer, /*Number*/ index) {
        //summary: Reorders layer with argument id to specified index. If index > top most layer, the index is changed appropriately
        // id: String: Id of layer to be reordered
        // index: Number: New index of layer as displayed on map
        if (dojo.isString(layer)) {
          dojo.deprecated(this.declaredClass + ": " + esri.bundle.map.deprecateReorderLayerString, null, "v2.0");
          layer = this.getLayer(layer);
        }

        var id = layer.id,
            ids = layer instanceof GraphicsLayer ? this.graphicsLayerIds : this.layerIds;

        if (index < 0) {
          index = 0;
        }
        else if (index >= ids.length) {
          index = ids.length - 1;
        }

        var i = iOf(ids, id);
        if (i === -1 || i === index) {
          return;
        }

        ids.splice(i, 1);

        ids.splice(index, 0, id);
        this._reorderLayers(ids);
      },

      getLayer: function(/*String*/ id) {
        //summary: Get layer with argument id
        //id: String: Id of layer
        return this._layers[id];
      },

      //extent manipulation
      setExtent: function(/*esri.geometry.Extent*/ extent, /*Boolean?*/ fit) {
        //summary: Set the extent of the map
        // extent: esri.geometry.Extent: Extent to be set
        extent = new esri.geometry.Extent(extent.toJson());
        
        var width = extent.getWidth(), height = extent.getHeight();
        //console.log("extent width = ", width, ", extent height = ", height);
        
        if (width === 0 && height === 0) { // point
          this.centerAt(new esri.geometry.Point({
            x: extent.xmin,
            y: extent.ymin,
            spatialReference: extent.spatialReference && extent.spatialReference.toJson()
          }));
        }
        else {
          //this.__setExtent(extent, null, null, fit);
          this._extentUtil(null, null, extent, fit);
        }
      },

      centerAt: function(/*esri.geometry.Point*/ point) {
        //summary: Recenters the map at argument map point
        // point: esri.geometry.Point: Map coordinates of new center point
        //this._panTo(point);
        this._extentUtil(null, {
          mapCenter: point
        });
      },

      centerAndZoom: function(/*esri.geometry.Point*/ center, /*Number*/ level) {
        /*var ext = this.__getExtentForLevel(level, center).extent;
        if (ext) {
          this.__setExtent(ext);
        }
        else {
          this.centerAt(center);
        }*/
        this._extentUtil({
          targetLevel: level,
          mapCenter: center
        });
      },

      getNumLevels: function() {
        return this.__tileInfo ? this.__tileInfo.lods.length : 0;
      },

      getLevel: function() {
        //summary: Get current level on map, if base layer is a TiledLayer
        // returns: int: Current level displayed if TiledLayer else -1
        return this.__LOD ? this.__LOD.level : -1;
      },

      setLevel: function(/*Number*/ level) {
        //summary: Sets the level of the map if within range of base TiledLayer's range
        // level: int: Level of map to zoom to
        /*var ext = this.__getExtentForLevel(level).extent;
        if (ext) {
          this.setExtent(ext);
        }*/
        this._extentUtil({ targetLevel: level });
      },
      
      translate: function(dx, dy) {
        dx = dx || 0;
        dy = dy || 0;
        
        if (!this._txTimer) {
          //console.log("PAN-START");
          this._tx = this._ty = 0;
    
          var center = this.toScreen(this.extent.getCenter());      
          this.__panStart(center.x, center.y);
        }
        
        this._tx += dx;
        this._ty += dy;
        //console.log("pan... ", x, y);
        this.__pan(this._tx, this._ty);
    
        clearTimeout(this._txTimer);
        this._txTimer = setTimeout(this._endTranslate, 150);
      },
      
      _endTranslate: function() {
        //console.log("PAN-END");
        
        clearTimeout(this._txTimer);
        this._txTimer = null;

        var dx = this._tx, dy = this._ty;
        this._tx = this._ty = 0;
        
        this.__panEnd(dx, dy);
      },
      
      setTimeExtent: function(timeExtent) {
        this.timeExtent = timeExtent;

        var arg = timeExtent ? new esri.TimeExtent(timeExtent.startTime, timeExtent.endTime) : null;
        this.onTimeExtentChange(arg);
      },
      
      setTimeSlider : function(timeSlider){          
          if (this.timeSlider) {
              ddc(this._tsTimeExtentChange_connect);
              this._tsTimeExtentChange_connect = null;
              this.timeSlider = null;
          }    
          
          if (timeSlider){              
              this.timeSlider = timeSlider;
              this.setTimeExtent(timeSlider.getCurrentTimeExtent());
              this._tsTimeExtentChange_connect = dc(timeSlider, "onTimeExtentChange", this, "setTimeExtent");                  
          }                                      
      },
      
      resize: function(immediate) {
        var self = this, 
            execResize = function() {
              //console.log("Resizing map...");
              clearTimeout(self._resizeT);
              
              self.reposition();
              self._resize();
            };
        //console.log("[rsz]");

        clearTimeout(self._resizeT);
        
        // WARNING!
        // Ideally "if (immediate)" would be okay, but when this function is
        // tied to a dijit resize like below, the argument can be something
        // else. So let's explicitly check for boolean true value:
        // dojo.connect(dijit.byId('map'), 'resize', map,map.resize)
        if (immediate === true) {
          // This usage can be seen in esri/dijit/OverviewMap.js
          execResize();
        }
        else {
          self._resizeT = setTimeout(execResize, self.resizeDelay);
        }
        
        // Alternate solution (not fully supported on webkit):
        // Make use of "onresize" in IE, "DOMAttrModified" (height) in Firefox
        // http://www.west-wind.com/weblog/posts/2011/Feb/22/A-jQuery-Plugin-to-monitor-Html-Element-CSS-Changes
      },
      
      _resize: function() {
        var w = this.width, h = this.height, 
            box = dojo.contentBox(this.container);

        if (w === box.w && h === box.h) {
          //console.log("nothing changed!");
          return;
        }

        var prevAnim = this._zoomAnim || this._panAnim;
        if (prevAnim) {
          //prevAnim.gotoPercent(1, true);
          prevAnim.stop();
          prevAnim._fire("onEnd", [prevAnim.node]);
        }

        ds(this.root, { width:(this.width = box.w) + "px", height:(this.height = box.h) + "px" });

        var wd = this.width,
            ht = this.height;

        this.__visibleRect.update(this.__visibleRect.x, this.__visibleRect.y, wd, ht);
        this.__visibleDelta.update(this.__visibleDelta.x, this.__visibleDelta.y, wd, ht);
        
        var r = esri.geometry._extentToRect(this.extent),
            ne = (esri.geometry._rectToExtent(new Rect(r.x, r.y, r.width * (wd / w), r.height * (ht / h), this.spatialReference)));
        
        this.onResize(ne, wd, ht);
        //this.__setExtent(ne);
        this._extentUtil(null, null, ne, null, true);
      },

      reposition: function() {
        this._reposition();
        this.onReposition(this.position.x, this.position.y);
      },
      
      _reposition: function() {
        var pos = dojo.coords(this.container, true), // need to include the effect of scrolling in firefox 
            brdr = dojo._getPadBorderExtents(this.container);
        this.position.update(pos.x + brdr.l, pos.y + brdr.t);
      },
      
      _setClipRect: function() {
        delete this._clip;
        
        var clipRect = dojo.isIE ? "rect(auto,auto,auto,auto)" : null;
        
        if (this.wrapAround180) {
          var mapWidth = this.width, mapHeight = this.height,
              world = this._getFrameWidth(), // clipRect = null,
              diff = mapWidth - world;
          
          if (diff > 0) {
            // In wrapAround mode, do not show more than
            // 360 degree of map area.
            var left = diff / 2;
            clipRect = "rect(0px," + (left + world) + "px," + mapHeight + "px," + left + "px)";
            
            var oldWidth = this.extent.getWidth(),
                newWidth = oldWidth * (world / mapWidth); 
                
            this._clip = [ (oldWidth - newWidth) / 2, newWidth ];
            //console.log("Clip = ", this._clip);
          }
          /*else {
            if (dojo.isIE) {
              // IE throws error when setting clip=null. Cross fingers!
              clipRect = "rect(0px," + mapWidth + "px," + mapHeight + "px,0px)";
            }
          }*/
          
          //console.log("Clip Rectangle: ", clipRect);
          //ds(this.__container, "clip", clipRect);
        }
        
        ds(this.__container, "clip", clipRect);
        //console.log("Clip Rect: ", this.__container.style.clip);
      },
      
      _getAvailExtent: function() {
        var extent = this.extent, clip = this._clip;
        
        if (clip) {
          if (!extent._clip) {
            var rect = new esri.geometry._extentToRect(extent);
            rect.width = clip[1];
            rect.x = rect.x + clip[0];
            
            extent._clip = rect.getExtent();
          }
          
          return extent._clip;  
        }
        
        return extent;
      },
      
      //fixed panning methods
      panUp: function() {
        this._fixedPan(0, this.height * -_FIXED_PAN_FACTOR);
      },

      panUpperRight: function() {
        this._fixedPan(this.width * _FIXED_PAN_FACTOR, this.height * -_FIXED_PAN_FACTOR);
      },

      panRight: function() {
        this._fixedPan(this.width * _FIXED_PAN_FACTOR, 0);
      },

      panLowerRight: function() {
        this._fixedPan(this.width * _FIXED_PAN_FACTOR, this.height * _FIXED_PAN_FACTOR);
      },

      panDown: function() {
        this._fixedPan(0, this.height * _FIXED_PAN_FACTOR);
      },

      panLowerLeft: function() {
        this._fixedPan(this.width * -_FIXED_PAN_FACTOR, this.height * _FIXED_PAN_FACTOR);
      },

      panLeft: function() {
        this._fixedPan(this.width * -_FIXED_PAN_FACTOR, 0);
      },

      panUpperLeft: function() {
        this._fixedPan(this.width * -_FIXED_PAN_FACTOR, this.height * -_FIXED_PAN_FACTOR);
      },
      
      enableSnapping: function(snapOptions) {
        if (!snapOptions) {
          snapOptions = {};
        }
        if (snapOptions.declaredClass === "esri.SnappingManager") {
          this.snappingManager = snapOptions;
        }
        else {        
          this.snappingManager = new esri.SnappingManager(dojo.mixin({map: this}, snapOptions));
        }
        //this.snappingManager._setUpSnapping();
        return this.snappingManager;
      },

      disableSnapping: function() {
        if (this.snappingManager) {
          this.snappingManager.destroy();
        }
        this.snappingManager = null;
      }
    };
  }())
);
});

},
'esri/layers/tiled':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!dojox/collections/ArrayList,esri/layers/layer,esri/geometry,dojox/gfx/matrix"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.tiled");

dojo.require("dojox.collections.ArrayList");
dojo.require("esri.layers.layer");
dojo.require("esri.geometry");
dojo.require("dojox.gfx.matrix");

dojo.declare("esri.layers.TiledMapServiceLayer", esri.layers.Layer, {
    constructor: function(/*String*/ url, /*Object?*/ options) {
      //options: displayLevels: Number[]: Levels to display in layer, based on LOD.level
      dojo.connect(this, "onLoad", this, "_initTiledLayer");
      
      this._displayLevels = options ? options.displayLevels : null;

      var dh = dojo.hitch;

      this._addImage = dh(this, this._addImage);
      this._tileLoadHandler = dh(this, this._tileLoadHandler);
      this._tileErrorHandler = dh(this, this._tileErrorHandler);
      this._tilePopPop = dh(this, this._tilePopPop);
      this._cleanUpRemovedImages = dh(this, this._cleanUpRemovedImages);
      this._fireOnUpdateEvent = dh(this, this._fireOnUpdateEvent);
      this._transitionEnd = dh(this, this._transitionEnd);
    },
    
    opacity: 1,
    isPNG32: false,
    
    _initTiledLayer: function() {
      //tiling scheme
      var ti = this.tileInfo,
          lods = ti.lods;
      //this._tileOrigin = new esri.geometry.Point(dojo.mixin(ti.origin, this.spatialReference));
      this._tileW = ti.width;
      this._tileH = ti.height;
      this._normalizedScales = [];
      
      var scales = (this.scales = []),
          dl = this._displayLevels,
          fe = this.fullExtent,
          ul = new esri.geometry.Point(fe.xmin, fe.ymax),
          lr = new esri.geometry.Point(fe.xmax, fe.ymin),
          gctc = esri.TileUtils.getContainingTileCoords,
          coords, lod, i, len = lods.length;

      for (i=0; i<len; i++) {
        lod = lods[i];
        coords = gctc(ti, ul, lod);
        lod.startTileRow = coords.row < 0 ? 0 : coords.row;
        lod.startTileCol = coords.col < 0 ? 0 : coords.col;
        coords = gctc(ti, lr, lod);
        lod.endTileRow = coords.row;
        lod.endTileCol = coords.col;
        
        if (! dl || dojo.indexOf(dl, lod.level) !== -1) {
          scales[i] = lod.scale;
          this._normalizedScales[i] = lod.scale/ti.dpi;
        }
      }
      
      // Mixed mode caching will have tiles in both PNG32 AND JPG formats.
      // We need to apply IE 6 patch for this mode as well. Looks like the patch
      // does not negatively impact JPG rendering.
      this._patchIE = dojo.isIE >= 6 && dojo.isIE < 7 && (this.isPNG32 || ti.format === "Mixed");
    },

    //Layer specific
    _setMap: function(map, container, index, lod) {
      //console.log("setMap: ", this.url, map._jobs);
      this._map = map;
      var d = (this._div = dojo.create("div", null, container));
      this._layerIndex = index;

      var _mv = map.__visibleDelta,
          dc = dojo.connect,
          names = esri._css.names,
          css = {
            position: "absolute", 
            width: map.width + "px", 
            height: map.height + "px", 
            overflow: "visible" 
          };
      
      if (map.navigationMode === "css-transforms") {
        css[names.transform] = esri._css.translate(-_mv.x, -_mv.y);
        dojo.style(d, css);
        
        delete css[names.transform];
        css[names.transition] = names.transformName + " " + esri.config.defaults.map.zoomDuration + "ms ease";
        
        dojo.style((this._active = dojo.create("div", null, d)), css);
        this._active._remove = 0;
        this._passives = [];

        this._onScaleHandler_connect = dc(map, "onScale", this, this._onScaleHandler);

        // We don't want to suspend dom mutation on desktop browsers
        if (esri.isTouchEnabled) {
          this._standby = [];
          var self = this,
              // Prevent *displaying* images in the dom when zoom/pan has begun, thereby
              // prevent _cleanUpRemovedImages from running. Or else, old img where
              // touchmove originated is destroyed and hence touch sequence is broken
              // and no more events are fired.
              // Related info:
              // http://stackoverflow.com/questions/2598529/touch-event-missing-when-pushing-new-view
              // http://stackoverflow.com/questions/6328978/click-event-on-new-element-after-html-update-in-sencha-touch
              suspendDOM = function() { self._noDom = 1; };
          this._onPanStartHandler_connect = dc(map, "onPanStart", suspendDOM);
          this._onZoomStartHandler_connect = dc(map, "onZoomStart", suspendDOM);
        }
      }
      else {
        css.left = -_mv.x + "px";
        css.top = -_mv.y + "px";
        dojo.style(d, css);
        this._onZoomHandler_connect = dc(map, "onZoom", this, "_onZoomHandler");
      }
      
      this._onPanHandler_connect = dc(map, "onPan", this, "_onPanHandler");
      this._onExtentChangeHandler_connect = dc(map, "onExtentChange", this, "_onExtentChangeHandler");
      this._onResizeHandler_connect = dc(map, "onResize", this, "_onResizeHandler");
      this._opacityChangeHandler_connect = dc(this, "onOpacityChange", this, "_opacityChangeHandler");
      this._visibilityChangeHandler_connect = dc(this, "onVisibilityChange", this, "_visibilityChangeHandler");

      //visual properties
      this._tileIds = [];
      this._tiles = [];
      this._tileBounds = [];
      this._ct = null;
      this._removeList = new dojox.collections.ArrayList();
      this._loadingList = new dojox.collections.ArrayList();
      
      // wrap around support
      var tileInfo = this.tileInfo, sr = tileInfo.spatialReference,
          info = sr._getInfo();

      // TODO
      // We need to overlap tiles to fix an issue where the horizon
      // does not align with tile boundary. This can happen if one of the
      // following conditions is true:
      // 1. tile origin is not -180
      // 2. scale for a given level is chosen such that horizon does not
      //    align with tile boundary
      // Once we fix this issue, the "third condition" in the following
      // decision block can be removed
      // See also: Map::_addLayerHandler
      this._wrap = map.wrapAround180 && sr._isWrappable() && Math.abs(info.origin[0] - tileInfo.origin.x) <= info.dx;

      if (this._wrap) {
        // Note that tileInfo will be augmented by _addFrameInfo
        esri.TileUtils._addFrameInfo(tileInfo, info);
      }

      var mapExtent = map.extent;
      if (! this.visible) {
        this._visibilityChangeHandler(this.visible);
      }
      if (mapExtent && map.loaded) {
        this._onExtentChangeHandler(mapExtent, null, null, lod);
      }

      // if (map._baseLayerId == this.id) {
        // this._ct = esri.TileUtils.getCandidateTileInfo(map, this.tileInfo, mapExtent || this.initialExtent);
      // }

      return d;
    },
    
    //event handlers
    _unsetMap: function(map, container) {
      //console.log("UNSETmap", this.url, map._jobs);
      /*if (container) {
        this._div = container.removeChild(this._div);
      }*/
      
      var tiles = this._tiles, loadingList = this._loadingList, img,
          dd = dojo.disconnect;

      // Let's clear out images that are still loading. This would prevent
      // _cleanUpRemovedImages from being executed unnecessarily after this
      // layer is removed from map.
      if (loadingList && loadingList.count > 0) {
        //console.log("BEFORE COUNT ==== ", loadingList.count);
        
        loadingList.forEach(function(imgId) {
          //console.log("destroying...", imgId);
          img = tiles[imgId];
          
          if (img) {
            dd(img._onload_connect);
            dd(img._onerror_connect);
            dd(img._onabort_connect);
            img._onload_connect = img._onerror_connect = img._onabort_connect = null;
          }
        });
        
        loadingList.clear();
        this._fireUpdateEnd();
        //console.log("AFTER COUNT ==== ", loadingList.count, map._jobs);
      }

      dojo.destroy(this._div);
      this._map = this._layerIndex = this._div = this._standby = null;

      dd(this._onExtentChangeHandler_connect);
      dd(this._onPanHandler_connect);
      dd(this._onZoomHandler_connect);
      dd(this._onScaleHandler_connect);
      dd(this._onLayerReorderHandler_connect);
      dd(this._onResizeHandler_connect);
      dd(this._opacityChangeHandler_connect);
      dd(this._visibilityChangeHandler_connect);
      dd(this._onPanStartHandler_connect);
      dd(this._onZoomStartHandler_connect);
    },
    
    _visibilityChangeHandler: function(v) {
      if (v) {
        esri.show(this._div);
        var map = this._map;
        if (map.navigationMode === "css-transforms") {
          this._onScaleHandler_connect = dojo.connect(map, "onScale", this, this._onScaleHandler);
        }
        else {
          this._onZoomHandler_connect = dojo.connect(map, "onZoom", this, "_onZoomHandler");
        }
        this._onPanHandler_connect = dojo.connect(map, "onPan", this, "_onPanHandler");
        this._onExtentChangeHandler(map.extent, null, true);
      }
      else {
        esri.hide(this._div);
        dojo.disconnect(this._onPanHandler_connect);
        dojo.disconnect(this._onZoomHandler_connect);
        dojo.disconnect(this._onScaleHandler_connect);
      }
    },
    
    //map event handlers
    _onResizeHandler: function(extent, width, height) {
      var css = { width: width + "px", height: height + "px" },
          ds = dojo.style, i;
      
      ds(this._div, css); //, clip:"rect(0px " + width + "px " + height + "px 0px)"
      
      if (this._map.navigationMode === "css-transforms") {
        if (this._active) {
          ds(this._active, css);
        }
  
        for (i = this._passives.length - 1; i >= 0; i--) {
          ds(this._passives[i], css);
        }
      }
    },

    _onExtentChangeHandler: function(extent, delta, levelChange, lod) {
      var map = this._map, i, standby = this._standby, img, passive;

      if (map._isPanningOrZooming()) {
        // Bail out if we're here while the map is still panning or zooming,
        // thereby avoid unnecessary network requests
        
        // You can end up here as a result of the following sequence:
        // - map has a base layer
        // - now switch the base map to a different layer:
        //   - change map extent to the new layer's initial extent
        //     (thereby triggering map animation)
        //   - remove old base layer
        //   - add new base layer of the same spatial reference
        // In this sequence, this extent change handler will be called twice:
        // First, from within the new layer's _setMap - resulting in tiles 
        // loaded for old map level.
        // Second, when the current map animation ends - resulting in tiles
        // loaded for the new map level. However in "css-transforms" mode
        // tiles from the old level are left intact because there are no
        // passive nodes yet and the old tiles are within the active node
        // (see the css-transforms block below that attempts to destroy
        // passives).
        
        return;
      }

      if (map.navigationMode === "css-transforms") {
        if (levelChange) {
          for (i = this._passives.length - 1; i >= 0; i--) {
            passive = this._passives[i];
            
            // Conclude transition *now*
            dojo.style(passive, esri._css.names.transition, "none");
            
            if (passive._marked) {
              this._passives.splice(i, 1);
              if (passive.parentNode) {
                passive.parentNode.removeChild(passive);
              }
              dojo.destroy(passive);
              //console.log("destroyed 2: " + passive.childNodes.length);
            }
            // Let's remember the current matrix so that when the
            // next scaling begins before this passive node destroys,
            // we can apply the matrix
            else if (passive.childNodes.length > 0) {
              passive._multiply = passive._multiply ? 
                                    dojox.gfx.matrix.multiply(passive._matrix, passive._multiply) : 
                                    passive._matrix;
            }
          }
          
          /*if (lod) {
            return;
          }*/
        }

        // Let's append pending images to the DOM.
        this._noDom = 0;
        if (standby && standby.length) {
          for (i = standby.length - 1; i >= 0; i--) {
            img = standby[i];
            dojo.style(img, "visibility", "visible");
            this._tilePopPop(img);
            standby.splice(i, 1);
          }
        }
      }
      
      
      var showing = true;
      this._refreshArgs = { extent:extent, lod:lod };
      if (! this.visible) {
        showing = false;
      }

      var scale;
      if (lod) {
        scale = dojo.indexOf(this.scales, lod.scale) === -1;
        if (this.declaredClass === "esri.layers.WMTSLayer") {       
          var baseMapDpi = map._params.tileInfo.dpi;
          var wider = map.width > map.height? map.width:map.height;      
          scale = true;
          var s1, s2 = lod.scale/baseMapDpi;
          for (i=0; i< this._normalizedScales.length; i++){
            s1 = this._normalizedScales[i];
            if (Math.abs((s1 - s2)/s1) < (1/wider)){
              scale = false;
              break;
            }
          }
        }
      }
      else {
        var _lev = map.getLevel(),
            _scale = (_lev !== -1) ? map._params.tileInfo.lods[_lev].scale : -1;
        scale = ( dojo.indexOf(this.scales, _scale) === -1 );
      }

      if (showing) {
        var dd = dojo.disconnect;
        if (scale) {
          showing = false;
          esri.hide(this._div);
          dd(this._onPanHandler_connect);
          dd(this._onZoomHandler_connect);
          dd(this._onScaleHandler_connect);
        }
        else {
          this._fireUpdateStart();
          esri.show(this._div);
          dd(this._onPanHandler_connect);
          dd(this._onZoomHandler_connect);
          dd(this._onScaleHandler_connect);
          if (map.navigationMode === "css-transforms") {
            this._onScaleHandler_connect = dojo.connect(map, "onScale", this, this._onScaleHandler);
          }
          else {
            this._onZoomHandler_connect = dojo.connect(map, "onZoom", this, "_onZoomHandler");
          }
          this._onPanHandler_connect = dojo.connect(map, "onPan", this, "_onPanHandler");
        }
      }

      this._rrIndex = 0;
      var ct = esri.TileUtils.getCandidateTileInfo(map, this.tileInfo, extent),
          mv = map.__visibleDelta, id;

      if (!this._ct || ct.lod.level !== this._ct.lod.level || levelChange) {
        var didZoom = (ct && this._ct && ct.lod.level !== this._ct.lod.level);
        
        this._ct = ct;
        var _tiles = this._tiles,
            _tileIds = this._tileIds,
            _tileBounds = this._tileBounds,
            _removeList = this._removeList,
            tile, il=_tileIds.length;

        this._cleanUpRemovedImages();

        for (i=0; i < il; i++) {
          id = _tileIds[i];
          tile = _tiles[id];
          _tileBounds[id] = _tileIds[i] = null;
          if (
            (map.navigationMode === "css-transforms") && didZoom && 
            tile.parentNode && map.fadeOnZoom && 
            showing 
            // If not visible or showing, let's not mark them fadeOut so that 
            // they'll be immediately destroyed by cleanUp call below.
            // If these images stay, later when the layer becomes visible, we'll
            // have images from two levels displayed at the same time.
            // TODO
            // Why are we even here after the layer has been hidden?
            // Do these calcs outside the loop
          ) {
            tile._fadeOut = didZoom;
            tile.parentNode._remove++;
          }
          _removeList.add(tile);
        }

        if (levelChange) {
          this._tileIds = [];
          this._tiles = [];
          this._tileBounds = [];
        }
      }

      var mx = mv.x,
          my = mv.y;
      
      if (map.navigationMode === "css-transforms") {
        var css = {};
        css[esri._css.names.transform] = esri._css.translate(mx, my);
        dojo.style(this._div, css);
      }
      else {
        dojo.style(this._div, {
          left: mx + "px", 
          top: my + "px"
        });
      }
      
      if (showing && !scale) {
        this.__coords_dx = mx;
        this.__coords_dy = my;
        this._updateImages(new esri.geometry.Rect(0, 0, mv.width, mv.height));

        if (this._loadingList.count === 0) {
          this.onUpdate();
          this._fireUpdateEnd();
        }
        else {
          this._fireOnUpdate = true;
        }
      }
      else {
        this._cleanUpRemovedImages();
      }

      //tile cleanup
      var coords, rect,
          tileW = this._tileW,
          tileH = this._tileH;
          mv = new esri.geometry.Rect(-mv.x, -mv.y, mv.width, mv.height);

      for (i=this._tileIds.length-1; i>=0; i--) {
        id = this._tileIds[i];
        if (id) {
          img = this._tiles[id];
          
          coords = dojo.coords(img);
          rect = new esri.geometry.Rect(coords.l, coords.t, tileW, tileH);
          if (map.navigationMode === "css-transforms") {
            rect.x = img._left;
            rect.y = img._top;
          }
          
          if (mv.intersects(rect)) {
            this._tileBounds[id] = rect;
          }
          else {
            if (this._loadingList.contains(id)) {
              this._tilePopPop(img);
            }
            dojo.destroy(img);
            this._tileIds.splice(i, 1);
            delete this._tileBounds[id];
            delete this._tiles[id];
          }
        }
        else {
          this._tileIds.splice(i, 1);
          delete this._tileBounds[id];
          delete this._tiles[id];
        }
      }
    },

    _onPanHandler: function(extent, delta) {
      var map = this._map,
          mv = map.__visibleDelta.offset(delta.x, delta.y);
          
      this.__coords_dx = this.__coords_dy = 0;
      
      if (map.navigationMode === "css-transforms") {
        var css = {};
        css[esri._css.names.transform] = esri._css.translate(mv.x, mv.y);
        dojo.style(this._div, css);
        
        if (!esri.isTouchEnabled) {
          this._updateImages({ x:-mv.x, y:-mv.y, width:mv.width, height:mv.height });
        }
      }
      else {
        dojo.style(this._div, {
          left: mv.x + "px", 
          top: mv.y + "px"
        });

        // TODO
        // On mobile, to compensate for not doing this update on pan, let's
        // fetch one more row and column of tiles on all sides of the map
        this._updateImages({ x:-mv.x, y:-mv.y, width:mv.width, height:mv.height });
      }
      
      // NOTE
      // Is it advisable to fire update start event on pan?
      // Depending on what the users do in the event handler,
      // this could slow down the actual update.
      // Users shouldn't be doing crazy things
      if (this._loadingList.count > 0) {
        this._fireUpdateStart();
        this._fireOnUpdate = true;
      }
    },
    
    _onScaleHandler: function(mtx, immediate) {
      // TODO
      // Need to stop adding new images to "passive" containers
      // Passives are obsolete anyway
      
      // NOTE
      // Chrome and Firefox seem to do sub-pixel scaling
      // for transitioning css transformations. This shows
      // up as white line between tiles while zooming in/out.
      
      var i, css = {}, names = esri._css.names, map = this._map;

      for (i = this._passives.length - 1; i >= 0; i--) {
        var passive = this._passives[i];
        if (passive.childNodes.length === 0) {
          // Cleanup unused passive nodes
          this._passives.splice(i, 1);
          dojo.destroy(passive);
        }
        else {
          // We set it to "none" onExtentChange. Let's re-set the
          // transition duration.
          if (passive.style[names.transition] === "none") {
            dojo.style(passive, names.transition, names.transformName + " " + esri.config.defaults.map.zoomDuration + "ms ease");
          }
          
          dojo.style(passive, names.transition, immediate ? "none" : (names.transformName + " " + esri.config.defaults.map.zoomDuration + "ms ease"));
          
          // Scale passives that still have old images
          //passive._matrix = dojox.gfx.matrix.multiply(mtx, passive._matrix);
          //css[names.transform] = esri._css.matrix(passive._matrix);
          passive._matrix = mtx;
          css[names.transform] = esri._css.matrix(
                                   passive._multiply ?
                                   dojox.gfx.matrix.multiply(mtx, passive._multiply) :
                                   mtx
                                 );
          
          //console.log("xply: " + dojo.toJson(css[names.transform]));
          dojo.style(passive, css);
          
          // _matrix holds the matrix applied since the previous onExtentChange
          // _multiply holds the matrix applied prior to the previous onExtentChange
        }
      }
      
      if (this._active && this._active.childNodes.length === 0) {
        // Active node is still fresh. No need to create another
        return;
      }

      dojo.style(this._active, names.transition, immediate ? "none" : (names.transformName + " " + esri.config.defaults.map.zoomDuration + "ms ease"));

      // Scale currently active node
      // http://docs.dojocampus.org/dojox/gfx/#transformations-around-a-point
      // http://www.w3.org/TR/css3-3d-transforms/#transform-functions
      this._active._matrix = mtx;
      css[names.transform] = esri._css.matrix(this._active._matrix);
      //console.log(dojo.toJson(css[names.transform]));
      dojo.style(this._active, css);
      
      // Push the active node into passive list and create a new active node
      // Note that any new img element will be appended to "active" node:
      // see _addImage function in this class
      this._passives.push(this._active);

      css = {
        position: "absolute", 
        width: map.width + "px", 
        height: map.height + "px", 
        overflow: "visible" 
      };
      css[names.transition] = names.transformName + " " + esri.config.defaults.map.zoomDuration + "ms ease";
      dojo.style((this._active = dojo.create("div", null, this._div)), css);
      this._active._remove = 0;
      if (map.fadeOnZoom) {
        dojo.place(this._active, this._div, "first");
      }
    },
    
    _onZoomHandler: function(/*esri.geometry.Extent*/ extent, /*Number*/ scale, /*esri.geometry.Point*/ anchor) {
      var coords = dojo.coords(this._div);
      anchor = anchor.offset(-coords.l, -coords.t);

      var bounds,
          sizeW = this._tileW * scale,
          sizeH = this._tileH * scale,
          _tileBounds = this._tileBounds,
          _tiles = this._tiles,
          es = dojo.style;
          
      var isIE = dojo.isIE;

      if (isIE && isIE < 8) {
        dojo.forEach(this._tileIds, function(id) {
          bounds = _tileBounds[id];
          es(_tiles[id], {  left:(bounds.x - ((sizeW - bounds.width) * (anchor.x - bounds.x) / bounds.width)) + "px",
                            top:(bounds.y - ((sizeH - bounds.height) * (anchor.y - bounds.y) / bounds.height)) + "px",
                            zoom:scale });
        });
      }
      else {
        dojo.forEach(this._tileIds, function(id) {
          bounds = _tileBounds[id];
        
          es(_tiles[id], {  left:(bounds.x - ((sizeW - bounds.width) * (anchor.x - bounds.x) / bounds.width)) + "px",
                            top:(bounds.y - ((sizeH - bounds.height) * (anchor.y - bounds.y) / bounds.height)) + "px",
                            width:sizeW + "px",
                            height:sizeH + "px" });
        });
      }
    },

    _updateImages: function(rect) {
      var id,
          _tw = this._tileW,
          _th = this._tileH,
          _ct = this._ct,
          lod = _ct.lod,
          tile = _ct.tile,
          off = tile.offsets,
          coords = tile.coords,
          cr = coords.row,
          cc = coords.col,
          level = lod.level,
          opacity = this.opacity,
          _tileIds = this._tileIds,
          _loadingList = this._loadingList,
          _addImage = this._addImage,
          mId = this._map.id,
          tId = this.id,
          rx = rect.x,
          ry = rect.y,
          str = lod.startTileRow,
          etr = lod.endTileRow,
          stc = lod.startTileCol,
          etc = lod.endTileCol,
          indexOf = dojo.indexOf,
          r, c,
          mvx = -rect.x,
          mvy = -rect.y,
          ct_offsetx = off.x - this.__coords_dx,
          ct_offsety = off.y - this.__coords_dy,
          vx = ((_tw - ct_offsetx) + mvx),
          vy = ((_th - ct_offsety) + mvy),
          ceil = Math.ceil,
          ct_viewx = (vx > 0) ? (vx % _tw) :  ( (_tw - (Math.abs(vx) % _tw)) ),
          ct_viewy = (vy > 0) ? (vy % _th) :  ( (_th - (Math.abs(vy) % _th)) ),
          colstart = (rx > 0) ? Math.floor( (rx+ct_offsetx)/_tw ) : ceil( (rx-(_tw-ct_offsetx))/_tw ),
          rowstart = (ry > 0) ? Math.floor( (ry+ct_offsety)/_th ) : ceil( (ry-(_th-ct_offsety))/_th ),
          colend = colstart + ceil( (rect.width - ct_viewx)/_tw ),
          rowend = rowstart + ceil( (rect.height - ct_viewy)/_th ),
          frameInfo, total_cols, m180, p180,
          col, row;
         
      if (this._wrap) {
        frameInfo = lod._frameInfo;
        total_cols = frameInfo[0]; 
        m180 = frameInfo[1]; 
        p180 = frameInfo[2];
      }

      for (col=colstart; col<=colend; col++) {
        for (row=rowstart; row<=rowend; row++) {
          r = cr + row;
          c = cc + col;

          // wrap tile coords into valid space if necessary
          if (this._wrap) {
            if (c < m180 /*&& c >= m360*/) {
              /*while (c < m180) {
                c += total_cols;
              }*/
              c = c % total_cols;
              c = c < m180 ? c + total_cols : c;
            }
            else if (c > p180 /*&& c <= p360*/) {
              /*while (c > p180) {
                c -= total_cols;
              }*/
              c = c % total_cols;
            }
          }

          if (r >= str && r <= etr && c >= stc && c <= etc) {
            id = mId + "_" + tId + "_tile_" + level + "_" + row + "_" + col;
            if (indexOf(_tileIds, id) === -1) {
              //console.log("level = " + level + ", row = " + r + ", col = " + c + ", x = " + ((_tw * col) - off.x) + ", y = " + ((_th * row) - off.y));
              
              _loadingList.add(id);
              _tileIds.push(id);
              _addImage(level, row, r, col, c, id, _tw, _th, opacity, tile, off);
            }
          }
        }
      }
    },

    _cleanUpRemovedImages: function() {
      //console.log("cleanup..", this.url);
      var list = this._removeList,
          dd = dojo.destroy, i, names = esri._css.names;
      
      list.forEach(function(img) {
        /*if (img._fadeOut) {
          dojo.style(img, esri._css.names.transition, "opacity 0.4s linear");
          dojo.style(img, "opacity", 0);
          img._next = "destroy";
        }
        else {*/
        if (!img._fadeOut) {
          img.style.filter = "";
          img.style.zoom = 1.0;
          dd(img);
        }
        //}
      });

      // _removeList is empty now. Let's cleanup unused passive nodes
      if (this._map.navigationMode === "css-transforms") {
        for (i = this._passives.length - 1; i >= 0; i--) {
          var passive = this._passives[i];
          if (passive.childNodes.length === 0) {
            this._passives.splice(i, 1);
            dd(passive);
          }
          else if (this._map.fadeOnZoom && !passive._marked && (passive._remove === passive.childNodes.length)) {
            dojo.style(passive, names.transition, "opacity 0.65s");
            dojo.style(passive, "opacity", 0);
            passive._marked = 1;
            //console.log("fadeout: " + passive.childNodes.length);
            if (dojo.isIE >= 10) {
              passive.addEventListener(names.endEvent, this._transitionEnd, false);
            }
            else {
              passive._endHandle = dojo.connect(passive, names.endEvent, this._transitionEnd);
            }
          }
        }
      }
      
      list.clear();
    },
    
    _transitionEnd: function(evt) {
      var passive = evt.target, idx;
      //console.log("event: " + evt.propertyName + passive.childNodes.length);
      if (evt.propertyName !== "opacity") {
        return;
      }
      
      if (dojo.isIE >= 10) {
        passive.removeEventListener(esri._css.names.endEvent, this._transitionEnd, false);
      }
      else {
        dojo.disconnect(passive._endHandle);
        passive._endHandle = null;
      }
      
      idx = dojo.indexOf(this._passives, passive);
      if (idx > -1) {
        this._passives.splice(idx, 1);
      }
      
      // TODO
      // Can we avoid removing+destroying passive nodes?
      // Perhaps hide them and later recycle
      
      // TODO
      // The following logic causes panning to break down in IE 10
      // (observed on samsung tablet). Also, from then on onGestureDoubleTap
      // stops firing. Probably on Android as well
      if (passive.parentNode) {
        passive.parentNode.removeChild(passive);
      }
      dojo.destroy(passive);
      //console.log("destroyed: " + passive.childNodes.length);
    },
    
    _addImage: function(level, row, r, col, c, id, tileW, tileH, opacity, tile, offsets) {
      if (this._patchIE) {
        var div = (this._tiles[id] = dojo.create("div"));
        
        div.id = id;
        dojo.addClass(div, "layerTile");
        dojo.style(div, {
          left:((tileW * col) - offsets.x) + "px",
          top:((tileH * row) - offsets.y) + "px",
          width:tileW + "px",
          height:tileH + "px",
          filter:"progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + this.getTileUrl(level, r, c) + "', sizingMethod='scale')"
        });
        
        if (opacity < 1) {
          dojo.style(div, "opacity", opacity);
        }

        var innerDiv = div.appendChild(dojo.create("div"));
        dojo.style(innerDiv, { opacity:0, width:tileW + "px", height:tileH + "px" });

        this._div.appendChild(div);
        div = null;
        
        this._loadingList.remove(id);
        this._fireOnUpdateEvent();
      }
      else {
        var img = (this._tiles[id] = dojo.create("img")),
            dc = dojo.connect;

        img.id = id;
        dojo.addClass(img, "layerTile");
        
        var left = (tileW * col) - offsets.x, top = (tileH * row) - offsets.y,
            map = this._map, names = esri._css.names,
            css = {
              width: tileW + "px", 
              height: tileH + "px",
              visibility: "hidden"
            };
        
        if (map.navigationMode === "css-transforms") {
          css[names.transform] = esri._css.translate(left, top);
          //css[names.transition] = "opacity 0.4s linear";
          //css.opacity = 0;
          dojo.style(img, css);

          img._left = left;
          img._top = top;
          //img._transition_connect = dc(img, names.endEvent, this, this._transitionEnd);
        }
        else {
          css.left = left + "px";
          css.top = top + "px";
          //css.visibility = "hidden";
          dojo.style(img, css);
        }

        if (opacity < 1) {
          dojo.style(img, "opacity", opacity);
        }

        img._onload_connect = dc(img, "onload", this, "_tileLoadHandler");
        img._onerror_connect = dc(img, "onerror", this, "_tileErrorHandler");
        img._onabort_connect = dc(img, "onabort", this, "_tileErrorHandler");

        var url = this.getTileUrl(level, r, c, img);
        if (url) {
          img.src = url;
        }
        
        if (map.navigationMode === "css-transforms") {
          this._active.appendChild(img);
        }
        else {
          this._div.appendChild(img);
        }
        
        img = null;
      }
    },
    
    /*_transitionEnd: function(evt) {
      var img = evt.currentTarget;
      //console.log("[end]");
      
      switch (img._next) {
        case "off":
          //console.log("off: " + img.id);
          dojo.style(img, esri._css.names.transition, "none");
          break;
        case "destroy":
          //console.log("destroy: " + img.id);
          dojo.disconnect(img._transition_connect);
          img._transition_connect = null;
          dojo.destroy(img);
          img._next = null;

          if (this._removeList.count === 0) {
            for (var i = this._passives.length - 1; i >= 0; i--) {
              var passive = this._passives[i];
              if (passive.childNodes.length === 0) {
                this._passives.splice(i, 1);
                dojo.destroy(passive);
              }
            }
          }
          break;
      }
    },*/
    
    getTileUrl: function(level, row, col) {
      //method to be implemented by child for url to retrieve tile images
    },
    
    refresh: function() {
      var ra = this._refreshArgs;
      this._onExtentChangeHandler(ra.extent, null, true, ra.lod);
    },
    
    _tilePopPop: function(img) {
      var dd = dojo.disconnect;

      dd(img._onload_connect);
      dd(img._onerror_connect);
      dd(img._onabort_connect);
      img._onload_connect = img._onerror_connect = img._onabort_connect = null;

      this._loadingList.remove(img.id);
      this._fireOnUpdateEvent();
    },

    _tileLoadHandler: function(evt) {
      var img = evt.currentTarget;

      if (this._noDom) {
        this._standby.push(img);
        return;
      }
      
      /*if (this._map.navigationMode === "css-transforms") {
        dojo.style(img, "opacity", this.opacity);
        img._next = "off";
      }
      else {*/
        dojo.style(img, "visibility", "visible");
      //}
      
      this._tilePopPop(img);
    },

    _tileErrorHandler: function(evt) {
      var img = evt.currentTarget;
      this.onError(new Error(esri.bundle.layers.tiled.tileError + ": " + img.src));
      dojo.style(img, "visibility", "hidden");
      this._tilePopPop(img);
    },
    
    _fireOnUpdateEvent: function() {
      if (this._loadingList.count === 0) {
        this._cleanUpRemovedImages();

        if (this._fireOnUpdate) {
          this._fireOnUpdate = false;
          this.onUpdate();
          this._fireUpdateEnd();
        }
      }
    },
    
    setOpacity: function(o) {
      if (this.opacity != o) {
        this.onOpacityChange(this.opacity = o);
      }
    },
    
    onOpacityChange: function() {},
    
    _opacityChangeHandler: function(/*Number*/ value) {
      //summary: Method to handle changing opacity on a layer
      var djs = dojo.style, i, j, nodes;
      
      if (this._map.navigationMode === "css-transforms") {
        if (this._active) {
          nodes = this._active.childNodes;
          for (i = nodes.length - 1; i >= 0; i--) {
            djs(nodes[i], "opacity", value);
          }
        }
  
        for (i = this._passives.length - 1; i >= 0; i--) {
          nodes = this._passives[i].childNodes;
          for (j = nodes.length - 1; j >=0; j--) {
            djs(nodes[j], "opacity", value);
          }
        }
        
        return;
      }
      
      nodes = this._div.childNodes;
      for (i = nodes.length - 1; i >= 0; i--) {
        djs(nodes[i], "opacity", value);
      }
    }
  }
);

dojo.declare("esri.layers.TileInfo", null, {
    constructor: function(json) {
      this.width = json.cols || json.width;
      this.height = json.rows || json.height;
      this.dpi = json.dpi;
      this.format = json.format;

      var sr = json.spatialReference, ori = json.origin;
      
      if (sr) {
        sr = (this.spatialReference = new esri.SpatialReference(sr.declaredClass ? sr.toJson() : sr));
      }
      
      if (ori) { // "Hallowed are the Ori"
        ori = (this.origin = new esri.geometry.Point(ori.declaredClass ? ori.toJson() : ori));
        
        if (!ori.spatialReference && sr) {
          ori.setSpatialReference(new esri.SpatialReference(sr.toJson()));
        }
      }
      
      var lods = (this.lods = []);
      dojo.forEach(json.lods, function(lod, i) {
        lods[i] = new esri.layers.LOD(lod);
      });
    }
  }
);

dojo.declare("esri.layers.LOD", null, {
    constructor: function(json) {
      dojo.mixin(this, json);
    }
  }
);
});

},
'dojox/gfx/renderer':function(){
define("dojox/gfx/renderer", ["./_base","dojo/_base/lang", "dojo/_base/sniff", "dojo/_base/window", "dojo/_base/config"],
  function(g, lang, has, win, config){
  //>> noBuildResolver
/*=====
	dojox.gfx.renderer = {
		// summary:
		//		This module is an AMD loader plugin that loads the appropriate graphics renderer
		//		implementation based on detected environment and current configuration settings.
	};
  =====*/
	var currentRenderer = null;
	return {
		load: function(id, require, load){
			if(currentRenderer && id != "force"){
				load(currentRenderer);
				return;
			}
			var renderer = config.forceGfxRenderer,
				renderers = !renderer && (lang.isString(config.gfxRenderer) ?
					config.gfxRenderer : "svg,vml,canvas,silverlight").split(","),
				silverlightObject, silverlightFlag;

			while(!renderer && renderers.length){
				switch(renderers.shift()){
					case "svg":
						// the next test is from https://github.com/phiggins42/has.js
						if("SVGAngle" in win.global){
							renderer = "svg";
						}
						break;
					case "vml":
						if(has("ie")){
							renderer = "vml";
						}
						break;
					case "silverlight":
						try{
							if(has("ie")){
								silverlightObject = new ActiveXObject("AgControl.AgControl");
								if(silverlightObject && silverlightObject.IsVersionSupported("1.0")){
									silverlightFlag = true;
								}
							}else{
								if(navigator.plugins["Silverlight Plug-In"]){
									silverlightFlag = true;
								}
							}
						}catch(e){
							silverlightFlag = false;
						}finally{
							silverlightObject = null;
						}
						if(silverlightFlag){
							renderer = "silverlight";
						}
						break;
					case "canvas":
						if(win.global.CanvasRenderingContext2D){
							renderer = "canvas";
						}
						break;
				}
			}

			if (renderer === 'canvas' && config.canvasEvents !== false) {
				renderer = "canvasWithEvents";
			}

			if(config.isDebug){
				console.log("gfx renderer = " + renderer);
			}

			function loadRenderer(){
				require(["dojox/gfx/" + renderer], function(module){
					g.renderer = renderer;
					// memorize the renderer module
					currentRenderer = module;
					// now load it
					load(module);
				});
			}
			if(renderer == "svg" && typeof window.svgweb != "undefined"){
				window.svgweb.addOnLoad(loadRenderer);
			}else{
				loadRenderer();
			}
		}
	};
});

},
'esri/layers/graphics':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/layers/layer,dojox/gfx,esri/graphic,esri/renderer"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.graphics");

dojo.require("esri.layers.layer");
dojo.require("dojox.gfx");
dojo.require("esri.graphic");
dojo.require("esri.renderer");

if (dojox.gfx.renderer === "vml") {
  esri.vml = true;
  
  dojo.addOnLoad(function() {
    dojo.declare("esri.gfx.Path", dojox.gfx.Path, {
      setShape: function(newShape) {
        this.rawNode.path.v = (this.vmlPath = newShape);
        return this;
      }
    });
  
    esri.gfx.Path.nodeType = "shape";
    
    // Overrides to support layer opacity in IE
    
    var shapeClass = dojox.gfx.Shape || dojox.gfx.vml.Shape, 
        gfxSetStroke = shapeClass.prototype.setStroke;
        
    shapeClass.prototype.setStroke = function() {
      var retVal = gfxSetStroke.apply(this, arguments);
      
      var node = this.rawNode, stroke = node && node.stroke, parent = this.getParent();
      if (stroke && parent) {
        var op = esri._isDefined(parent._esriIeOpacity) ? parent._esriIeOpacity : 1;
        stroke.opacity *= op;
      }
      
      return retVal;
    };

    var gfxSetFill = shapeClass.prototype.setFill;
    shapeClass.prototype.setFill = function() {
      var retVal = gfxSetFill.apply(this, arguments);
      
      var node = this.rawNode, fill = node && node.fill, parent = this.getParent();
      if (fill && parent) {
        var op = esri._isDefined(parent._esriIeOpacity) ? parent._esriIeOpacity : 1;
        
        if (fill.type === "tile") {
          dojo.style(node, "opacity", op);
        }
        else {
          fill.opacity *= op;
        }
      }
      
      return retVal;
    };
    
    /*// Note: We don't call setFill and setStroke for PictureMarkerSymbol 
    var imgCreate = dojox.gfx.Group.prototype.createImage;
    dojox.gfx.Group.prototype.createImage = function() {
      var retVal = imgCreate.apply(this, arguments);
      
      // TODO
      // Transforms applied to images is messing with opacity.
      // It's risky to mess with that part of GFX code
      var node = retVal.rawNode, parent = retVal.getParent();
      if (node && parent) {
        var op = esri._isDefined(parent._esriIeOpacity) ? parent._esriIeOpacity : 1;
        dojo.style(node, "opacity", op);
      }
      
      return retVal;
    };*/
  }); // end of add on load
} // if ie

dojo.declare("esri.layers._GraphicsContainer", null, {
    _setMap: function(map, divContainer) {
      var es, connects = (this._connects = []);

      this._map = map;
      
      if (dojox.gfx.renderer === "canvas") { // canvas
        es = dojo.create("div", { style: "overflow: visible; position: absolute;" }, divContainer);
        
        // faking a GFX surface object
        // map doesn't seem to use anything other than getEventSource at this point
        this._surface = {
          getEventSource: function() {
            return es;
          }
        };
        
        connects.push(dojo.connect(es, "onmousedown", this, this._canvasDownHandler));
        connects.push(dojo.connect(es, "onmouseup", this, this._canvasUpHandler));
        connects.push(dojo.connect(es, "onclick", this, this._canvasClickHandler));
        
        esri.layers._GraphicsLayer.prototype._canvas = true;
      }
      else {
        var surface = (this._surface = dojox.gfx.createSurface(divContainer, map.width, map.height));
        es = surface.getEventSource();
  
        dojo.style((es = esri.vml ? es.parentNode : es), { overflow:"visible", position:"absolute" }); //position:"relative" //position at v1.1
      }
      
      connects.push(dojo.connect(map, "onResize", this, "_onResizeHandler"));
      return es;
    },
    
    _onResizeHandler: function(extent, width, height) {
      var es = this._surface.getEventSource(), map = this._map, layer;
      
      if (esri.vml) {
        dojo.style((es = es.parentNode), { width:width + "px", height:height + "px", clip:"rect(0px " + width + "px " + height + "px 0px)" });
      }
      dojo.attr(es, "width", width);
      dojo.attr(es, "height", height);
      
      if (!this._surface.declaredClass) { // canvas
        dojo.forEach(es.childNodes, function(canvasNode) {
          dojo.attr(canvasNode, "width", width);
          dojo.attr(canvasNode, "height", height);
        });
      }
      
      if (map.loaded) {
        if (!map.graphics._suspended) {
          //console.log(map.graphics.id);
          map.graphics._resized = true;
        }
        
        dojo.forEach(map.graphicsLayerIds, function(layerId) {
          layer = map.getLayer(layerId);
          
          if (!layer._suspended) {
            //console.log(layerId);
            layer._resized = true;
          }
        });
      }

      // es.setAttribute("width", width);
      // es.setAttribute("height", height);
    },
    
    _cleanUp: function() {
      dojo.forEach(this._connects, dojo.disconnect, dojo);
      this._map = this._surface = null;
    },
    
    /**************************
     * Canvas specific methods
     **************************/
    
    _processEvent: function(evt) {
      var map = this._map;
      evt.screenPoint = new esri.geometry.Point(evt.pageX - map.position.x, evt.pageY - map.position.y);
      evt.mapPoint = map.toMap(evt.screenPoint);
    },
    
    _canvasDownHandler: function(evt) {
      this._processEvent(evt);
      this._downPt = evt.screenPoint.x + "," + evt.screenPoint.y;
    },
    
    _canvasUpHandler: function(evt) {
      this._processEvent(evt);
      this._upPt = evt.screenPoint.x + "," + evt.screenPoint.y;
    },
    
    _tolerance: 15, // pixels
    
    _canvasClickHandler: function(evt) {
      //console.log("Div click handler...", evt, this._downPt, this._upPt);
      if (!this._downPt || !this._upPt || this._downPt !== this._upPt) {
        return;
      }
      //console.log("clicked...");

      this._processEvent(evt);
      
      //Canvas hit-test implementation:
      var map = this._map;
      
      // get qualified graphics layers
      var layers = dojo.map(map.graphicsLayerIds, function(id) {
        return map.getLayer(id);
      });
      layers.push(map.graphics);
      layers.reverse();
      
      layers = dojo.filter(layers, function(layer) {
        return layer.loaded && layer._mouseEvents &&  layer.visible && (!esri._isDefined(layer.opacity) || layer.opacity > 0);
      });
      
//      dojo.forEach(layers, function(layer) {
//        console.log(layer.id);
//      });
      
      //1. Create an extent around the screenPoint where the user clicked
      var screenPoint = evt.screenPoint, geo = esri.geometry, tolerance = this._tolerance;
      var xmin = screenPoint.x - tolerance, ymin = screenPoint.y + tolerance;
      var xmax = screenPoint.x + tolerance, ymax = screenPoint.y - tolerance;
      var screenExtent = new geo.Extent(xmin, ymax, xmax, ymin);
      
      //2. Convert the above extent from screen coordinates to map coordinates.
      var bottomLeft = map.toMap(new geo.Point(xmin, ymin));
      var topRight = map.toMap(new geo.Point(xmax, ymax));
      var queryExtent = new geo.Extent(bottomLeft.x, bottomLeft.y, topRight.x, topRight.y);
      //map.graphics.add(new esri.Graphic(queryExtent, new esri.symbol.SimpleFillSymbol()));
      
      var match, touch = esri.isTouchEnabled;
      
      //3. Intersect the above query extent with the extents of all the graphics in the top-most graphics layer
      //4. If step 3 did not yield any result, repeat it with the next layer. If there are no layers left, go to step 6.
      dojo.some(layers, function(layer) {
        
        // a) Get a list of all graphics whose extent contains the clicked location. If there are none, go to step 4, else go to step 3.b.
        var primary = dojo.filter(layer.graphics, function(graphic) {
          var shape = graphic.getDojoShape();
          
          if (!graphic.visible || !shape) {
            return false;
          }
          
          var bbox = shape.getTransformedBoundingBox();
          //console.log(bbox);
          
          if (bbox) {
            var graphicExtent = new geo.Extent(bbox[0].x, bbox[0].y, bbox[2].x, bbox[2].y);
            return touch ? graphicExtent.intersects(screenExtent) : graphicExtent.contains(screenPoint);
          }
          else {
            // this is a multipoint graphic
            return dojo.some(shape.children || [], function(child) {
              bbox = child.getTransformedBoundingBox();
              //console.log(bbox);
              var graphicExtent = new geo.Extent(bbox[0].x, bbox[0].y, bbox[2].x, bbox[2].y);
              return touch ? graphicExtent.intersects(screenExtent) : graphicExtent.contains(screenPoint);
            });
          }
        }); // foreach
        
        if (primary.length > 0) {
          //console.log("Primary: ", primary);
          var secondary;
          
          // b) From the list obtained from 3.a, filter it further to find the list of graphics with geometry intersecting the query extent. If there are none, go to step 4, else go to step 3.c.
          dojo.some(primary, function(graphic) {
            //if (graphic.geometry.contains(mapPoint)) {
            if (graphic.geometry && queryExtent.intersects(graphic.geometry)) {
              // c) Pick the first matching graphic
              secondary = graphic;
              return true;
            }
            return false;
          }); // foreach
          
          if (secondary) {
            match = secondary;
            return true;
          }
        } // if primary
        
        return false;
      }); // some
      
      //5. Fire click event on the layer that contains the graphic found in step 3.c
      if (match) {
        var layer = match.getLayer();
        if (layer) {
          evt.graphic = match;
          layer.onClick(evt);
        }
      }
      
      //6. Done
    }
  }
);

dojo.declare("esri.layers._GraphicsLayer", esri.layers.Layer, {
    constructor: function(params) {
      // TODO
      // This is a hack!
      // This is really really ugly!
      // At Dojo 1.4, we have more control over how the constructor
      // chaining happens between subclass and super classes.
      // When we move to 1.4, we need to take advantage of that
      // and remove this ugly hack
      // REF: http://docs.dojocampus.org/dojo/declare#manual-constructor-chaining
      if (params && (dojo.isString(params) || (dojo.isObject(params) && params.layerDefinition) )) {
        params = arguments[1]; // assuming signature: (url, params) - ignore url - see FeatureLayer
      }
      
      this._params = dojo.mixin({ displayOnPan: true, drawMode: true }, params || {});
      this.infoTemplate = params && params.infoTemplate;

      this.graphics = [];
      this._init = false;
      this._suspended = false;

      this._draw = dojo.hitch(this, this._draw);
      this._refresh = dojo.hitch(this, this._refresh);
    },
    
    setDrawMode: function(/*Boolean*/ value) {
      this._params.drawMode = value;
    },
    
    renderer: null,

    _setMap: function(map, surface) {
      this._map = map;
      
      var mapSR = map.spatialReference;
      this._wrap = map.wrapAround180 /*&& mapSR._isWrappable()*/;
      this._srInfo = mapSR._getInfo();
      
      // multi-graphics v2

      if (!this._canvas) {
        this._div = surface.createGroup();
      }
      else { // canvas
        surface = dojox.gfx.createSurface(surface.getEventSource(), map.width, map.height);
        dojo.style(surface.rawNode, "position", "absolute");
        this._div = surface.createGroup();
        
        // GFX canvas renderer does not support events yet so the 
        // event source has been disabled at the GFX tier. But we
        // need to fake it so that existing code can live happily
        this._div.getEventSource = function() {
          return surface.rawNode;
        };
        
        // See also:
        // _canvasRender
        // dojox.gfx.canvas.Group::_render
        this._renderProto = this._div.constructor.prototype._render;
        this._div._render = dojo.hitch(this, this._canvasRender);
      }
      
      this._div.getEventSource().id = this.id + "_layer";
      
      this._enableAllConnectors();
      
      this._updateStatus();

      if (!this._suspended && map.extent && map.loaded === true) {
        this._onExtentChangeHandler(map.extent, null, null, null);
      }

      //this._visibilityChangeHandler(this.visible);
      
      var op = this.opacity;
      if (esri._isDefined(op) && op < 1) {
        this.setOpacity(op, true);
      }

      return this._div;
    },
    
    _unsetMap: function(map, surface) {
      dojo.forEach(this.graphics, function(g) {
        g._shape = null;
      });

      if (!this._canvas) {
        this._div.clear();
        surface.remove(this._div);
        dojo.destroy(this._div.getEventSource());
      }
      else { // canvas
        surface = this._div.getParent();
        
        // HACK
        // hack to prevent dojox.gfx.shape.Surface::destroy from destroying 
        // other graphics layers (canvases) in the graphics container
        surface._parent = {};
        
        dojo.destroy(surface.rawNode);
        surface.destroy();
      }
      this._map = this._div = null;
      this._init = false;
      this._disableAllConnectors();
    },

    _onZoomStartHandler: function() {
      esri.hide(this._div.getEventSource());
    },

    _onExtentChangeHandler: function(extent, delta, levelChange, lod) {
      if (levelChange || !this._init) {
        //summary: Redraw graphics on extent change
        var _mvr = this._map.__visibleRect, group = this._div;
        this._init = true;

        this._refresh(true);

        group.setTransform(dojox.gfx.matrix.translate({ x:_mvr.x, y:_mvr.y }));
        
        if (this._renderProto && group.surface.pendingRender) { // canvas
          this._dirty = true;
        }
        else {
          if (this.visible) {
            esri.show(group.getEventSource());
          }
        }
      }
      else if (this._resized) {
        // "this._resized" equals true indicates that this extent change event
        // is for an immediately preceding map resize event. 
        // Background: we no longer fire pan events when map is resized - as a
        // result of cleanup that occurred when adding support for css-transforms
        // So, we need to perform resize chore here - this is very similar to 
        // pan end chore.
        
        //console.log("resized... " + this.id);
        this._refresh(false);
        this._resized = false;
      }

      if (this.graphics.length > 0) {
        this.onUpdate();
      }
    },
    
    _canvasRender: function() {
      // This method is an override for dojox.gfx.canvas.Group::_render
      // to run "show" GraphicsLayer only after GFX has finished 
      // rendering the group (i.e. the children)
      
      var group = this._div;
      
      if (this._dirty) {
        //console.log("...dirty...", this.id);
        delete this._dirty;
        
        if (this.visible) {
          esri.show(group.getEventSource());
        }
      }
      
      return this._renderProto.apply(group, arguments);
    },

    _refresh: function(redraw) {
      var gs = this.graphics,
          il = gs.length, i,
          _draw = this._draw;

      for (i=0; i<il; i++) {
        _draw(gs[i], redraw);
      }
    },
    
    refresh: function() {
      this._refresh(true);
    },

    // displayOnPan = true (default)
    _onPanHandler: function(extent, delta) {
      this._panDx = delta.x;
      this._panDy = delta.y;

      var _mvr = this._map.__visibleRect;
      this._div.setTransform(dojox.gfx.matrix.translate({ x:_mvr.x + delta.x, y:_mvr.y + delta.y }));
    },

    _onPanEndUpdateHandler: function(extent, delta) {
      // It is possible that PAN (mousemove) handler is not fired for 
      // the mouse position at which this PAN END (mouseup) happened.
      // Graphics position will not be in sync with map unless we check
      // for this condition and call setTransform. So far, I/people have
      // seen this behavior only in Chrome.
      // See _onPanHandler for related changes
      if (!this._params._child && (delta.x !== this._panDx || delta.y !== this._panDy)) {
        var _mvr = this._map.__visibleRect;
        this._div.setTransform(dojox.gfx.matrix.translate({ x:_mvr.x, y:_mvr.y }));
      }
      
      this._refresh(false);
      if (this.graphics.length) {
        this.onUpdate();
      }
    },

    // displayOnPan = false
    _onPanStartHandler: function() {
      esri.hide(this._div.getEventSource());
    },

    _onPanEndHandler: function() {
      var _mvr = this._map.__visibleRect, group = this._div;
      group.setTransform(dojox.gfx.matrix.translate({ x:_mvr.x, y:_mvr.y }));
      
      this._refresh(false);
      
      if (this._renderProto && group.surface.pendingRender) {
        this._dirty = true;
      }
      else {
        esri.show(group.getEventSource());
      }
      //this._visibilityChangeHandler(this.visible);
      
      if (this.graphics.length) {
        this.onUpdate();
      }
    },
    
    _getDesiredStatus: function() {
      // Returns true if the layer should be alive, false otherwise
      return this.visible;
    },
    
    _updateStatus: function() {
      //console.log("update status...");
      // Put the layer in the desired status
      if (this._getDesiredStatus()) {
        if (this._suspended) {
          //console.log("resuming...");
          this._resume();
        }
      }
      else {
        if (!this._suspended) {
          //console.log("suspending...");
          this._suspend();
        }
      }
    },
    
    // Hide and be passive to map events
    _suspend: function() {
      this._suspended = true;
      esri.hide(this._div.getEventSource());
      this._disableDrawConnectors();
    },
    
    // Resume normal operations
    _resume: function() {
      var group = this._div;
      
      this._suspended = false;
      this._enableDrawConnectors();
      var _mvr = this._map.__visibleRect;
      group.setTransform(dojox.gfx.matrix.translate({ x:_mvr.x, y:_mvr.y }));
      this._refresh(true);
      
      //this._visibilityChangeHandler(this.visible);
      if (this._renderProto && group.surface.pendingRender) {
        this._dirty = true;
      }
      else {
        esri.show(group.getEventSource());
      }
    },
    
    // enable level 1 connectors
    // - when the layer is added to the map
    _enableAllConnectors: function() {
      this._disableAllConnectors();
      //this._cleanUp_connect = dojo.connect(this._map, "onUnload", this, "_cleanUp");
      this._onVisibilityChangeHandler_connect = dojo.connect(this, "onVisibilityChange", this, this._updateStatus);
      this._enableDrawConnectors();
    },
    
    // disable level 1 connectors
    // - when the layer is removed from the map
    // - when the layer is destroyed
    _disableAllConnectors: function() {
      this._disableDrawConnectors();
      //dojo.disconnect(this._cleanUp_connect);
      dojo.disconnect(this._onVisibilityChangeHandler_connect);
      this._onVisibilityChangeHandler_connect = null;
    },
    
    // enable level 2 connectors
    // - when the layer wants to internally turn itself ON
    _enableDrawConnectors: function() {
      var map = this._map, dc = dojo.connect;
      this._disableDrawConnectors();
      
      if (this._params.displayOnPan) {
        if (!this._params._child) { // see esri.layers._TrackManager:initialize for context
          this._onPanHandler_connect = dc(map, "onPan", this, "_onPanHandler");
        }
        this._onPanEndHandler_connect = dc(map, "onPanEnd", this, "_onPanEndUpdateHandler");
      }
      else {
        this._onPanStartHandler_connect = dc(map, "onPanStart", this, "_onPanStartHandler");
        this._onPanEndHandler_connect = dc(map, "onPanEnd", this, "_onPanEndHandler");
      }
      this._onZoomStartHandler_connect = dc(map, "onZoomStart", this, "_onZoomStartHandler");
      this._onExtentChangeHandler_connect = dc(map, "onExtentChange", this, "_onExtentChangeHandler");
    },
    
    // disable level 2 connectors
    // - when the layer wants to internally turn itself OFF
    _disableDrawConnectors: function() {
      var dd = dojo.disconnect;

      dd(this._onExtentChangeHandler_connect);
      dd(this._onZoomStartHandler_connect);
      dd(this._onPanHandler_connect);
      dd(this._onPanStartHandler_connect);
      dd(this._onPanEndHandler_connect);
      
      // Let's clear out the handles so that next time disableConnectors is called
      // right before enableConnectors, handle.remove (inside dojo.disconnect) will
      // not be called once more on the handle that is removed in "this" current call.
      // Obviously calling remove twice on the same handle leads to some funky
      // behavior (seen in Dojo 1.7).
      this._onExtentChangeHandler_connect = this._onZoomStartHandler_connect =
      this._onPanHandler_connect = this._onPanStartHandler_connect =
      this._onPanEndHandler_connect = null;
    },

    _updateExtent: function(graphic) {
      var geom = graphic.geometry, eg = esri.geometry;
      
      if (!geom) {
        graphic._extent = null;
        return;
      }
      
      var _e = (graphic._extent = geom.getExtent());
      if (! _e) {
        var x, y;
        if (geom instanceof eg.Point) {
          x = geom.x;
          y = geom.y;
        }
        else if (geom instanceof eg.Multipoint) {
          x = geom.points[0][0];
          y = geom.points[0][1];
        }
        else {
          //Extent not calculated for this type of geometry. All geometries should return an extent, what geometry type failed?
          //console.debug("Error condition: " + this.declaredClass + "._updateExtent(" + geom.type + ").");
          graphic._extent = null;
          return;
        }
        
        graphic._extent = new eg.Extent(x, y, x, y, geom.spatialReference);
      }
    },
    
    _intersects: function(map, extent, originOnly) {
      // "_originOnly" is an internal flag to draw this geometry only over its
      // originating frame. Used when drawing map's zoom box, 
      // and when drawing using extent tool.

      if (this._wrap && !originOnly) {
        var offsets = [], world = map._getFrameWidth(), info = this._srInfo,
            partsGE, mapExtent = map._clip ? map._getAvailExtent() : map.extent, 
            partsME = mapExtent._getParts(info),
            g, m, f, gl, ml, fl, gePart, mePart, filtered = [],
            partwise = extent._partwise;

        // If the geometry is a line or polygon, we need to
        // perform "partwise" extent comparison with map extent.
        // This will avoid a situation where a polygon split by
        // the 180deg and "moved" a little bit will result in
        // identical xmin and xmax (before calling normalizeCM),
        // thereby not repeated the right amount.
        // See Polygon/Polyline::getExtent for "_partwise" creation
        if (partwise && partwise.length) {
          partsGE = [];
          for (g = 0, gl = partwise.length; g < gl; g++ ) {
            partsGE = partsGE.concat(partwise[g]._getParts(info));
          }
        }
        else {
          partsGE = extent._getParts(info);
        }

        for (g = 0, gl = partsGE.length; g < gl; g++) {
          gePart = partsGE[g];
          
          for (m = 0, ml = partsME.length; m < ml; m++) {
            mePart = partsME[m];
            
            if (mePart.extent.intersects(gePart.extent)) {
              for (f = 0, fl = gePart.frameIds.length; f < fl; f++) {
                offsets.push( (mePart.frameIds[0] - gePart.frameIds[f]) * world );
              }
            }
          } // loop m
          
        } // loop g
        
        // remove duplicate offsets
        for (g = 0, gl = offsets.length; g < gl; g++) {
          f = offsets[g];
          if (dojo.indexOf(offsets, f) === g) {
            filtered.push(f);
          }
        }

        /*dojo.forEach(partsGE, function(gePart) {
          dojo.forEach(partsME, function(mePart) {
            if (mePart.extent.intersects(gePart.extent)) {
              dojo.forEach(gePart.frameIds, function(gFrame) {
                offsets.push( (mePart.frameIds[0] - gFrame) * world );
              });
            }
          });
        
          // remove duplicate offsets
          offsets = dojo.filter(offsets, function(offset, k) {
            return dojo.indexOf(offsets, offset) === k;
          });
          
          if (offsets.length === 2) {
            return true;
          }
          
          return false;
        });
        
        // remove duplicate offsets
        offsets = dojo.filter(offsets, function(offset, k) {
          return dojo.indexOf(offsets, offset) === k;
        });*/
        
        //console.log("offsets = ", filtered);
        return (filtered.length) ? filtered : null;
      }
      else {
        return map.extent.intersects(extent) ? [ 0 ] : null;
      }
    },
    
    _draw: function(graphic, redraw) {
      if (!this._params.drawMode || !this._map) {
        return;
      }
      
      try {
        // TODO
        // No extent indicates graphic with no geometry, we could
        // optimize this by combining it with _visible to create
        // a new variable that would answer "should I attempt to draw this graphic now?" 
        var extent = graphic._extent, offsets;
        // Do we really want to charge normal graphics with this check for an
        // uncommon scenario?
        
        if (graphic.visible && extent && (offsets = this._intersects(this._map, extent, graphic.geometry._originOnly))) {
          if (! graphic.getDojoShape() || redraw || offsets) {
            var type = graphic.geometry.type;
      
            if (type === "point") {
              this._drawMarker(graphic, offsets);
              this._symbolizeMarker(graphic);
            }
            else if (type === "multipoint") {
              this._drawMarkers(graphic, offsets);
              this._symbolizeMarkers(graphic);
            }
            else {
              this._drawShape(graphic, offsets);
              this._symbolizeShape(graphic);
            }
          }
        }
        else if (graphic.getDojoShape() /*|| ! graphic.visible*/) {
          this._removeShape(graphic);
        }
      }
      catch (err) {
        this._errorHandler(err, graphic);
      }
    },
    
    _removeShape: function(graphic) {
      var shape = graphic.getDojoShape();
      shape.removeShape();
      graphic._shape = null;
    },

    _drawShape: function(graphic, offsets) {
      var geometry = graphic.geometry,
          type = geometry.type,
          map = this._map,
          me = map.extent,
          mw = map.width,
          mh = map.height,
          eg = esri.geometry,
          _mvr = map.__visibleRect,
          paths = [], i, il;
 
      if (type === "rect" || type === "extent") {
        // TODO
        // Need to be able to duplicate rects/extents when wrapping
        // Will have to render them as polygons to do that, which means
        // may need clipping like polygons below.
        var rect;
        if (type === "extent") {
          rect = eg.toScreenGeometry(me, mw, mh, geometry);
          rect = { x:rect.xmin - _mvr.x + offsets[0], y:rect.ymax - _mvr.y, width:rect.getWidth(), height:rect.getHeight() };
        }
        else {
          var xy = eg.toScreenPoint(me, mw, mh, geometry),
              wh = eg.toScreenPoint(me, mw, mh, { x:geometry.x + geometry.width, y:geometry.y + geometry.height });
          rect = { x: xy.x - _mvr.x + offsets[0], y: xy.y - _mvr.y, width: wh.x - xy.x, height: xy.y - wh.y };
        }

        if (rect.width === 0) {
          rect.width = 1;
        }
        if (rect.height === 0) {
          rect.height = 1;
        }
        graphic._shape = this._drawRect(this._div, graphic.getDojoShape(), rect);
      }
      else if (type === "polyline" || type === "polygon") {
        for (i = 0, il = offsets.length; i < il; i++) {
          paths = paths.concat(eg._toScreenPath(me, mw, mh, geometry, -_mvr.x + offsets[i], -_mvr.y));
        }
        /*dojo.forEach(offsets, function(offset) {
          paths = paths.concat(eg._toScreenPath(me, mw, mh, geometry, -_mvr.x + offset, -_mvr.y));
        });*/
        
        graphic._shape = this._drawPath(this._div, graphic.getDojoShape(), paths);
        if (this._rendererLimits) {
          if (type === "polyline") {
            this._clipPolyline(graphic._shape, geometry);
          }
          else {
            this._clipPolygon(graphic._shape, geometry);
          }
        }
      }
      /*else if (type === "polygon") {
        graphic._shape = this._drawPath(this._div, graphic.getDojoShape(), eg._toScreenPath(me, mw, mh, geometry, -_mvr.x, -_mvr.y));
        if (this._rendererLimits) {
          this._clipPolygon(graphic._shape, geometry);
        }
      }*/
    },

    _drawRect: function(/*dojox.gfx.Surface/Group*/ container, /*dojox.gfx.Shape*/ shape, /*dojox.gfx.Rect*/ rect) {
      return shape ? shape.setShape(rect) : container.createRect(rect);
    },

    _drawImage: function(container, shape, image) {
      return shape ? shape.setShape(image) : container.createImage(image);
    },

    _drawCircle: function(container, shape, circle) {
      return shape ? shape.setShape(circle) : container.createCircle(circle);
    },

    _drawPath: (function() {
      if (esri.vml) {
        return function(container, shape, /*String[]*/ path) {
          if (shape) {
            return shape.setShape(path.join(" "));
          }
          else {
            var p = container.createObject(esri.gfx.Path, path.join(" "));
            container._overrideSize(p.getEventSource());
            return p;
          }
        };
      }
      else {
        return function(container, shape, /*String[]*/ path) {
          return shape ? shape.setShape(path.join(" ")) : container.createPath(path.join(" "));
        };
      }
    }()),

    _drawText: function(container, shape, text) {
      return shape ? shape.setShape(text) : container.createText(text);
    },

    //glyph
    // _drawGlyph: function(container, shape, text, symbol) {
    //   if (shape) {
    //     shape.removeShape();
    //   }
    // 
    //   var scale = 0.1,
    //       font = symbol.font,
    //       wd = font.getWidth(text.text, scale),
    //       ht = font.getLineHeight(scale),
    //       x = text.x - (wd/2),
    //       y = text.y - (ht/2),
    //       matrix = dojox.gfx.matrix;
    // 
    //   var glyph = symbol.font.draw(
    //     container.createGroup(),
    //     { text:text.text }, //, x:x, y:y
    //     { size:"10px" },
    //     symbol.getFill()
    //   );
    // 
    //   glyph.children[0].setTransform(
    //     dojox.gfx.matrix.multiply(
    //       matrix.translate(text.x, text.y),
    //       matrix.scale(scale),
    //       matrix.rotateg(-symbol.angle)
    //     )
    //   );
    // 
    //   // glyph.children[0].setTransform(
    //   //   dojox.gfx.matrix.multiply(
    //   //     // dojox.gfx.matrix.translate(-wd/2, -ht/2),
    //   //     dojox.gfx.matrix.scale(scale),
    //   //               dojox.gfx.matrix.rotategAt(-45, text.x, text.y)
    //   //   )
    //   // );
    // 
    //   // , dojox.gfx.matrix.rotateg(-45)
    //   // dojox.gfx.matrix.translate(x, y), 
    //   
    //   // glyph.children[0].setTransform(
    //   //   new dojox.gfx.Matrix2D([
    //   //     dojox.gfx.matrix.rotategAt(-45, x, y),
    //   //     dojox.gfx.matrix.scale(scale)
    //   //   ])
    //   // );
    //   
    //   return glyph;
    // },
    
    _getSymbol: function(graphic) {
      return graphic.symbol || (this.renderer ? this.renderer.getSymbol(graphic) : null) || null;
    },

    _symbolizeShape: function(graphic) {
      var symbol = this._getSymbol(graphic);
//      if (!symbol) {
//        return;
//      }
      
      var stroke = symbol._stroke,
          fill = symbol._fill;

      if (stroke === null || fill === null) {
        stroke = symbol.getStroke();
        fill = symbol.getFill();
      }

      graphic.getDojoShape().setStroke(stroke).setFill(fill);
      symbol._stroke = stroke;
      symbol._fill = fill;
    },
    
    _smsToPath: (function() {
      if (esri.vml) {
        return function(SMS, style, x, y, xMh, xPh, yMh, yPh, spikeSize) {
          switch (style) {
            case SMS.STYLE_SQUARE:
              return ["M", xMh + "," + yMh, "L", xPh + "," + yMh, xPh + "," + yPh, xMh + "," + yPh, "X", "E"];
            case SMS.STYLE_CROSS:
              return ["M", x + "," + yMh, "L", x + "," + yPh, "M", xMh + "," + y, "L", xPh + "," + y, "E"];
            case SMS.STYLE_X:
              return ["M", xMh + "," + yMh, "L", xPh + "," + yPh, "M", xMh + "," + yPh, "L", xPh + "," + yMh, "E"];
            case SMS.STYLE_DIAMOND:
              return ["M", x + "," + yMh, "L", xPh + "," + y, x + "," + yPh, xMh + "," + y, "X", "E"];
            case SMS.STYLE_TARGET:
              return [
                "M", xMh + "," + yMh, "L", xPh + "," + yMh, xPh + "," + yPh, xMh + "," + yPh, xMh + "," + yMh,
                "M", (xMh - spikeSize) + "," + y, "L", xMh + "," + y,
                "M", x + "," + (yMh - spikeSize), "L", x + "," + yMh,
                "M", (xPh + spikeSize) + "," + y, "L", xPh + "," + y,
                "M", x + "," + (yPh + spikeSize), "L", x + "," + yPh, 
                "E"
              ];
          }
        };
      }
      else {
        return function(SMS, style, x, y, xMh, xPh, yMh, yPh, spikeSize) {
          switch (style) {
            case SMS.STYLE_SQUARE:
              return ["M", xMh + "," + yMh, xPh + "," + yMh, xPh + "," + yPh, xMh + "," + yPh, "Z"];
            case SMS.STYLE_CROSS:
              return ["M", x + "," + yMh, x + "," + yPh, "M", xMh + "," + y, xPh + "," + y];
            case SMS.STYLE_X:
              return ["M", xMh + "," + yMh, xPh + "," + yPh, "M", xMh + "," + yPh, xPh + "," + yMh];
            case SMS.STYLE_DIAMOND:
              return ["M", x + "," + yMh, xPh + "," + y, x + "," + yPh, xMh + "," + y, "Z"];
            case SMS.STYLE_TARGET:
              return [
                "M", xMh + "," + yMh, xPh + "," + yMh, xPh + "," + yPh, xMh + "," + yPh, xMh + "," + yMh,
                "M", (xMh - spikeSize) + "," + y, xMh + "," + y,
                "M", x + "," + (yMh - spikeSize), x + "," + yMh,
                "M", (xPh + spikeSize) + "," + y, xPh + "," + y,
                "M", x + "," + (yPh + spikeSize), x + "," + yPh
              ];
          }
        };

        // return function(SMS, style, x, y, h) {
        //   switch (style) {
        //     case SMS.STYLE_SQUARE:
        //       return ["M", (x - h) + "," + (y - h), (x + h) + "," + (y - h), (x + h) + "," + (y + h), (x - h) + "," + (y + h), "Z"];
        //     case SMS.STYLE_CROSS:
        //       return ["M", x + "," + (y - h), x + "," + (y + h), "M", (x - h) + "," + y, (x + h) + "," + y];
        //     case SMS.STYLE_X:
        //       return ["M", (x - h) + "," + (y - h), (x + h) + "," + (y + h), "M", (x - h) + "," + (y + h), (x + h) + "," + (y - h)];
        //     case SMS.STYLE_DIAMOND:
        //       return ["M", x + "," + (y - h), (x + h) + "," + y, x + "," + (y + h), (x - h) + "," + y, "Z"];
        //   }
        // }
      }
    }()),
    
    _pathStyles: {
      "square": 1, "cross": 1, "x": 1, "diamond": 1, "target": 1
    },
    
    _typeMaps: {
      "picturemarkersymbol": "image",
      "textsymbol": "text"
    },
    
    _isInvalidShape: function(symbol, shape) {
      // GFX Shape Types: SMS (circle, path), PMS (image), TS(text)
      // SYM Type Styles: SMS (circle, square, cross, x, diamond, target), PMS, TS
      var shpType = shape && shape.shape && shape.shape.type, 
          symType = symbol && symbol.type, 
          symStyle = symbol && symbol.style;
      
      if (!symStyle) {
        if (symType) {
          symStyle = this._typeMaps[symType];
        }
      }
      else if (this._pathStyles[symStyle]) {
        symStyle = "path";
      }
      //console.log(shpType, symStyle);
      
      if (shpType && symStyle && (shpType !== symStyle)) {
        //console.info("Clear out...");
        return true;
      }
    },

    _drawPoint: function(container, geometry, symbol, _shape, offsets) {
//      if (!symbol) {
//        return;
//      }

      var type = symbol.type,
          map = this._map,
          _mvr = map.__visibleRect,
          point = esri.geometry.toScreenPoint(map.extent, map.width, map.height, geometry).offset(-_mvr.x + offsets[0], -_mvr.y),
          px = point.x,
          py = point.y,
          shape;

      if (this._isInvalidShape(symbol, _shape)) {
        // Remove existing shape if the new shape is incompatible
        // with it at the node level
        _shape.removeShape();
        _shape = null;
      }
      
      if (type === "simplemarkersymbol") {
        var style = symbol.style,
            half = symbol.size / 2,
            round = Math.round,
            SMS = esri.symbol.SimpleMarkerSymbol;

        switch (style) {
          case SMS.STYLE_SQUARE:
          case SMS.STYLE_CROSS:
          case SMS.STYLE_X:
          case SMS.STYLE_DIAMOND:
            shape = this._drawPath(container, _shape, this._smsToPath(SMS, style, px, py, round(px - half), round(px + half), round(py - half), round(py + half)));
            break;
          case SMS.STYLE_TARGET:
            var halfWidth = symbol._targetWidth / 2,
                halfHeight = symbol._targetHeight / 2;
            
            shape = this._drawPath(container, _shape, this._smsToPath(SMS, style, px, py, round(px - halfWidth), round(px + halfWidth), round(py - halfHeight), round(py + halfHeight), symbol._spikeSize));
            break;
          default:
            shape = this._drawCircle(container, _shape, {cx:px, cy:py, r:half});
        }

        // if (style === SMS.STYLE_CIRCLE) {
        //   shape = this._drawCircle(container, _shape, {cx:px, cy:py, r:half});
        // }
        // else {
        //   shape = this._drawPath(container, _shape, this._smsToPath(SMS, style, px, py, round(px - half), round(px + half), round(py - half), round(py + half)));
        // }
        
        // switch (symbol.style) {
        //   case SMS.STYLE_SQUARE:
        //     shape = this._drawPath(container, _shape, ["M", (px - half) + "," + (py - half), (px + half) + "," + (py - half), (px + half) + "," + (py + half), (px - half) + "," + (py + half), "Z"]);
        //     break;
        //   case SMS.STYLE_CROSS:
        //     shape = this._drawPath(container, _shape, ["M", px + "," + (py - half), px + "," + (py + half), "M", (px - half) + "," + py, (px + half) + "," + py]);
        //     break;
        //   case SMS.STYLE_X:
        //     shape = this._drawPath(container, _shape, ["M", (px - half) + "," + (py - half), (px + half) + "," + (py + half), "M", (px - half) + "," + (py + half), (px + half) + "," + (py - half)]);
        //     break;
        //   case SMS.STYLE_DIAMOND:
        //     shape = this._drawPath(container, _shape, ["M", px + "," + (py - half), (px + half) + "," + py, px + "," + (py + half), (px - half) + "," + py, "Z"]);
        //     break;
        //   default:
        //     shape = this._drawCircle(container, _shape, {cx:px, cy:py, r:half});
        // }
      }
      else if (type === "picturemarkersymbol") {
        var w = symbol.width,
            h = symbol.height;
        shape = this._drawImage(container, _shape, {x:px - (w/2), y:py - (h/2), width:w, height:h, src:symbol.url});
      }
      else if (type === "textsymbol") {
        shape = this._drawText(container, _shape, { type:"text", text:symbol.text, x:px, y:py, align:symbol.align, decoration:symbol.decoration, rotated:symbol.rotated, kerning:symbol.kerning });

        //glyph
        // var text = { type:"text", text:symbol.text, x:px, y:py, align:symbol.align, decoration:symbol.decoration, rotated:symbol.rotated, kerning:symbol.kerning };
        // if (symbol.font instanceof dojox.gfx.VectorFont) {
        //   shape = this._drawGlyph(this._div, _shape, text, symbol);
        // }
        // else {
        //   shape = this._drawText(this._div, _shape, text);
        // }
      }

      shape.setTransform(dojox.gfx.matrix.multiply(dojox.gfx.matrix.translate(symbol.xoffset, -symbol.yoffset), dojox.gfx.matrix.rotategAt(symbol.angle, point)));
      shape._wrapOffsets = offsets; // used by _VertexMover.js, _Box.js to figure out offset to use for ghost lines
      return shape;
    },

    _symbolizePoint: function(shape, symbol) {
//      if (!symbol) {
//        return;
//      }
      
      var type = symbol.type;
      if (type === "picturemarkersymbol") {
        return;
      }

      var stroke = symbol._stroke,
          fill = symbol._fill;

      if (type === "textsymbol") {
        shape.setFont(symbol.font).setFill(symbol.getFill());

        //glyph
        // if (! (symbol.font instanceof dojox.gfx.VectorFont)) {
        //   shape.setFont(symbol.font).setFill(symbol.getFill());
        // }
      }
      else {
        if (stroke === null || fill === null) {
          stroke = symbol.getStroke();
          fill = symbol.getFill();
        }

        if (type === "simplemarkersymbol") {
          shape.setFill(fill).setStroke(stroke);
        }

        symbol._stroke = stroke;
        symbol._fill = fill;
      }
    },

    _drawMarker: function(graphic, offsets) {
      graphic._shape = this._drawPoint(this._div, graphic.geometry, this._getSymbol(graphic), graphic.getDojoShape(), offsets);
    },

    _symbolizeMarker: function(graphic) {
      this._symbolizePoint(graphic.getDojoShape(), this._getSymbol(graphic));
    },

    _drawMarkers: function(graphic, offsets) {
      var geometry = graphic.geometry,
          points = geometry.points,
          symbol = this._getSymbol(graphic),
          group = graphic.getDojoShape() || this._div.createGroup(),
          point, i, il = points.length, temp = [], idx = 0,
          j, jl = offsets ? offsets.length : 0;

      if (group.children[0] && this._isInvalidShape(symbol, group.children[0])) {
        // Remove existing shapes in the group if the new symbol is incompatible
        // with it at the node level
        group.clear();
      }
          
      for (i = 0; i < il; i++) {
        point = points[i];
        
        for (j = 0; j < jl; j++) {
          temp[0] = offsets[j]; // optimization to avoid creating temp arrays
          this._drawPoint(group, { x:point[0], y:point[1] }, symbol, group.children[idx++], temp);
        }
      }
      
      var numChildren = group.children.length;
      if (il * offsets.length < numChildren) { // means one or more points have been removed from the multipoint geometry
        for (i = numChildren - 1; i >= il * offsets.length; i--) {
          group.children[i].removeShape();
        }
      }

      graphic._shape = group;
    },

    _symbolizeMarkers: function(graphic) {
      var symbol = this._getSymbol(graphic),
          group = graphic.getDojoShape(),
          children = group.children, i, il = children.length;
          
      for (i=0; i<il; i++) {
        this._symbolizePoint(children[i], symbol);
      }
    },

    _errorHandler: function(err, graphic) {
      var msg = esri.bundle.layers.graphics.drawingError;
      if (graphic) {
        err.message = msg +
          "(geometry:" + (graphic.geometry ? graphic.geometry.declaredClass : null) +
          ", symbol:" + (graphic.symbol ? graphic.symbol.declaredClass : null) + "): " +
          err.message;
      }
      else {
        err.message = msg + "(null): " + err.message;
      }
      this.inherited(arguments);
    },
    
    _rendererLimits: (function() {
      var clipLimit, rangeMin, rangeMax;
      // clipLimit - defines the boundary of the clipper
      // rangeXXX  - the min/max coordinate values beyond which renderers choke
      
      // TODO
      // Verify the need for this when using Canvas renderer
      
      // TODO
      // The following limits are obtained by trial and 
      // error using the test case at hand.
      // Why are clipLimit and  rangeXXX values not the same? 
      // Need confirmation
      // [Firefox]
      // http://groups.google.com/group/mozilla.dev.tech.svg/browse_thread/thread/4480e0e872c7f9aa#
      // https://bugzilla.mozilla.org/show_bug.cgi?id=539436
      // [Chrome]
      // http://code.google.com/p/chromium/issues/detail?id=35915
      if (dojo.isFF) {
        clipLimit = 16125;
        rangeMin = -32250;
        rangeMax = 32250;
      }
      else if (dojo.isIE < 9) {
        clipLimit = 100000; // 175000
        rangeMin = -100000; // -200000
        rangeMax = 100000; // 200000
      }
      else if (dojo.isChrome && dojo.isChrome < 6) {
        clipLimit = 8150;
        rangeMin = -10000;
        rangeMax = 10000;
      }
      //else {
        // Assumed Safari - no known renderer limits - no clipper
        // Or, Chrome 6.x
      //}
      
      if (clipLimit) {
        var clipBBox, clipSegments;
        
        // clipper boundary (browser specific)  
        // [ left, top, right, bottom ]
        clipBBox = [ -clipLimit, -clipLimit, clipLimit, clipLimit ];

        clipSegments = [
          [ [ -clipLimit, -clipLimit ], [ clipLimit, -clipLimit ] ], // topLeft -> topRight
          [ [ clipLimit, -clipLimit ],  [ clipLimit, clipLimit ] ], // topRight -> bottomRight
          [ [ clipLimit, clipLimit ],   [ -clipLimit, clipLimit ] ], // bottomRight -> bottomLeft
          [ [ -clipLimit, clipLimit ],  [ -clipLimit, -clipLimit ] ] // bottomLeft -> topLeft
        ];
        
        return {
          clipLimit: clipLimit,
          rangeMin: rangeMin,
          rangeMax: rangeMax,
          clipBBox: clipBBox,
          clipSegments: clipSegments
        };
      } // if clipLimit
    }()),
    
    /*_didPanBeyondLimits: function(transform) {
      var limits = this._rendererLimits;
      if (!limits) {
        return;
      }
      
      var isPointWithinRange = this._isPointWithinRange;
      return !isPointWithinRange({ x: transform.dx, y: transform.dy }, limits.rangeMin, limits.rangeMax);
    },*/
    
    _clipPolyline: function(shape, geometry) {
      //console.log("_clipPolyline");
      // clips the given polyline to a browser specific
      // boundary. We are not implementing this clipping logic in
      // esri.geometry._toScreenPath in order to avoid perf penalty 
      // for rendering normal graphics.
      
      var corners = this._getCorners(shape, geometry);
      var topLeft = corners.tl, bottomRight = corners.br; // extremes
      
      var limits = this._rendererLimits;
      var rangeMin = limits.rangeMin, rangeMax = limits.rangeMax, clipBBox = limits.clipBBox, clipSegments = limits.clipSegments;
      var isPointWithinRange = this._isPointWithinRange, isPointWithinBBox = this._isPointWithinBBox, getClipperIntersection = this._getClipperIntersection, getPlaneIndex = this._getPlaneIndex;

      if (!isPointWithinRange(topLeft, rangeMin, rangeMax) || 
          !isPointWithinRange(bottomRight, rangeMin, rangeMax)) {
        // Implies there is atleast one point in the shape
        // that is beyond the browser limits - Need to apply fix
        //console.log("manually clipping this shape: ", node);
        
        // A side-effect of esri.gfx.Path impl. We may be okay with the
        // perf penalty here as this code is reached only for graphics
        // that need the fix which imposes the overhead anyways.
        if (esri.vml) {
          //shape.segments = this._getPathsFromPathString(shape.getNode().path.v);
          this._createSegments(shape);
        }

        var outPaths = [];
        dojo.forEach(shape.segments, function(segment) {
          var inPath = segment.args, len = inPath.length, outPath = [], i;
          //console.log(dojo.toJson(inPath));
          for (i = 0; i < len; i +=2) {
            var pt1 = [ inPath[i], inPath[i+1] ];
            var pt2 = [ inPath[i+2], inPath[i+3] ];
            var inside1 = isPointWithinBBox(pt1, clipBBox);
            var inside2 = isPointWithinBBox(pt2, clipBBox);
            if (inside1 ^ inside2) {
              var intersection = getClipperIntersection([ pt1, pt2 ], clipSegments);
              if (intersection) {
                //console.log("points " + (pt1) + " and " + (pt2) + " intersect clip boundary!", intersection);
                if (!inside1) { // pt1 is outside the clip boundary
                  outPath.push(intersection[1], pt2);
                }
                else { // pt2 is outside the clip boundary
                  if (i) {
                    outPath.push(intersection[1]);
                  }
                  else {
                    outPath.push(pt1, intersection[1]);
                  }
                  outPaths.push(outPath);
                  outPath = [];
                }
              } // intersection
            } // if XOR
            else { // both points lie inside or outside the clipper
              if (inside1) { // both points are inside the clipper
                if (i) {
                  outPath.push(pt2);
                }
                else {
                  outPath.push(pt1, pt2);
                }
              }
              else { // both points lie outside the clipper
                var plane1 = getPlaneIndex(pt1, clipBBox);
                var plane2 = getPlaneIndex(pt2, clipBBox);
                //console.log("plane1,plane2: ", plane1, plane2);
                if (plane1 === -1 || plane2 === -1 || plane1 === plane2) {
                  continue;
                }

                var intersectionData = getClipperIntersection([ pt1, pt2 ], clipSegments, true);
                if (intersectionData.length > 0) {
                  //console.log("intersectionData[]: ", dojo.toJson(intersectionData));
                  
                  if (!intersectionData[plane1]) {
                    plane1 = intersectionData[plane1[0]] ? plane1[0] : plane1[1];
                  }
                  if (!intersectionData[plane2]) {
                    plane2 = intersectionData[plane2[0]] ? plane2[0] : plane2[1];
                  }
                  
                  var intPoint1 = intersectionData[plane1], intPoint2 = intersectionData[plane2];
                  if (intPoint1) {
                    outPath.push(intPoint1);
                  }
                  if (intPoint2) {
                    outPath.push(intPoint2);
                    outPaths.push(outPath);
                    outPath = [];
                  }
                } // intersectionData.length
              }
            } // if XOR
          } // for i
          
          //console.info("path after manual clipping: ", outPath);
          outPaths.push(outPath);
        });
        
        //console.info("shape after manual clipping: ", pathString);
        shape.setShape(this._getPathStringFromPaths(outPaths));
      } // if !isPointWithinRange
    },
    
    _clipPolygon: function(shape, geometry) {
      //console.log("_clipPolygon");
      var corners = this._getCorners(shape, geometry);
      var topLeft = corners.tl, bottomRight = corners.br; // extremes
      
      var limits = this._rendererLimits;
      var clipLimit = limits.clipLimit, rangeMin = limits.rangeMin, rangeMax = limits.rangeMax, clipBBox = limits.clipBBox, clipSegments = limits.clipSegments;
      var isPointWithinRange = this._isPointWithinRange, isPointWithinBBox = this._isPointWithinBBox, getClipperIntersection = this._getClipperIntersection, getPlaneIndex = this._getPlaneIndex, pointLineDistance = esri.geometry._pointLineDistance;

      if (!isPointWithinRange(topLeft, rangeMin, rangeMax) || 
          !isPointWithinRange(bottomRight, rangeMin, rangeMax)) {

        if (esri.vml) {
          //shape.segments = this._getPathsFromPathString(shape.getNode().path.v);
          this._createSegments(shape);
        }

        var outPaths = dojo.map(shape.segments, function(segment) {
          var inPath = segment.args, len = inPath.length, outPath = [], pathData = [], i;
          //console.log(dojo.toJson(inPath));
          for (i = 0; i < len; i +=2) {
            var pt1 = [ inPath[i], inPath[i+1] ];
            var pt2 = [ inPath[i+2], inPath[i+3] ];
            if (i === (len-2)) {
              outPath.push(pt1);
              break;
            }
            
            var inside1 = isPointWithinBBox(pt1, clipBBox);
            var inside2 = isPointWithinBBox(pt2, clipBBox);
            outPath.push(pt1);
            //console.log("layout ", inside1, inside2);
            
            if (inside1 ^ inside2) { // one is inside and the other is outside 
              var intersectionData = getClipperIntersection([ pt1, pt2 ], clipSegments);
              if (intersectionData) {
                //console.log("points " + pt1 + " and " + pt2 + " intersects clip boundary!", intersectionData);
                var point = intersectionData[1];
                point[inside1 ? "inOut" : "outIn"] = true;
                outPath.push(point);
                
                // [ inside-to-outside?, index of intersection point in the path, intersecting plane index ]
                pathData.push([ inside1 ? "INOUT" : "OUTIN", outPath.length - 1, intersectionData[0] ]);
              } // if intersection
            } // if XOR
            else {
              if (!inside1) { // both points lie outside one or more half planes
                //console.log("outside-outside: ", dojo.toJson(pt1), dojo.toJson(pt2));
                var plane1 = getPlaneIndex(pt1, clipBBox);
                var plane2 = getPlaneIndex(pt2, clipBBox);
                //console.log("plane1,plane2: ", plane1, plane2);
                if (plane1 === -1 || plane2 === -1 || plane1 === plane2) {
                  continue;
                }
                
                var intersectionData = getClipperIntersection([ pt1, pt2 ], clipSegments, true);
                if (intersectionData.length > 0) {
                  //console.log("intersectionData[]: ", dojo.toJson(intersectionData));
                  
                  if (!intersectionData[plane1]) {
                    plane1 = intersectionData[plane1[0]] ? plane1[0] : plane1[1];
                  }

                  if (!intersectionData[plane2]) {
                    plane2 = intersectionData[plane2[0]] ? plane2[0] : plane2[1];
                  }
                  
                  var intPoint1 = intersectionData[plane1], intPoint2 = intersectionData[plane2];
                  
                  if (intPoint1) {
                    intPoint1.outIn = true;
                    outPath.push(intPoint1);
                    pathData.push(["OUTIN", outPath.length - 1, plane1]);
                  }
                  
                  if (intPoint2) {
                    intPoint2.inOut = true;
                    outPath.push(intPoint2);
                    pathData.push(["INOUT", outPath.length - 1, plane2]);
                  }
                } // intersectionData.length
                else {
                  if (dojo.isArray(plane1) && dojo.isArray(plane2)) {
                    var planes = plane1.concat(plane2);
                    planes.sort();
                    if (planes.join("") === "0123") {
                      //console.log("[ special case... ]");
                      var candidates = [];
                      if ((plane1[0] + plane1[1]) === 3) { // tl <-> br
                        candidates.push([clipLimit, -clipLimit], [-clipLimit, clipLimit]);
                      }
                      else { // tr <-> bl
                        candidates.push([-clipLimit, -clipLimit], [clipLimit, clipLimit]);
                      }
                      var d1 = pointLineDistance(candidates[0], [pt1, pt2]);
                      var d2 = pointLineDistance(candidates[1], [pt1, pt2]);
                      outPath.push((d1 < d2) ? candidates[0] : candidates[1]);
                    } // join 
                  } // isArray
                }
              } // if !inside
            } // inside-inside or outside-outside
          } // for i
          //console.log("pathData: ", dojo.toJson(pathData));
          
          var xmin = clipBBox[0], ymin = clipBBox[1], xmax = clipBBox[2], ymax = clipBBox[3];
        
          // Half plane XMin
          dojo.forEach(outPath, function(point) {
            if (point[0] < xmin) {
              if (point[1] >= ymin && point[1] <= ymax) { // between ymin and ymax?
                point[0] = xmin; // project this point onto the half plane xmin
              }
              else {
                //point[2] = true; // mark this point for deletion
                point[0] = xmin;
                point[1] = point[1] < ymin ? ymin : ymax;
              }
            }
          });
          
          // Half plane YMin
          dojo.forEach(outPath, function(point) {
            if (point[1] < ymin) {
              if (point[0] >= xmin && point[0] <= xmax) { // between xmin and xmax?
                point[1] = ymin;
              }
              else {
                //point[2] = true;
                point[1] = ymin;
                point[0] = point[0] < xmin ? xmin : xmax;
              }
            }
          });
          
          // Half plane XMax
          dojo.forEach(outPath, function(point) {
            if (point[0] > xmax) {
              if (point[1] >= ymin && point[1] <= ymax) { // between ymin and ymax?
                point[0] = xmax;
              }
              else {
                //point[2] = true;
                point[0] = xmax;
                point[1] = point[1] < ymin ? ymin : ymax;
              }
            }
          });
          
          // Half plane YMax
          dojo.forEach(outPath, function(point) {
            if (point[1] > ymax) {
              if (point[0] >= xmin && point[0] <= xmax) { // between xmin and xmax?
                point[1] = ymax;
              }
              else {
                //point[2] = true;
                point[1] = ymax;
                point[0] = point[0] < xmin ? xmin : xmax;
              }
            }
          });
          
          //console.log("Before loop check: ", dojo.toJson(outPath));
          var k = 0, len = pathData.length;
          if (len > 0) {
            do {
              var curr = pathData[k];
              var next = pathData[(k + 1) % len];
              
              // remove superfluous points (loop anchored on a half plane outside the clipper )
              if (curr[2] === next[2] && curr[0] === "INOUT" && next[0] === "OUTIN") { // if inout -> outin on the same half plance
                var start = curr[1], end = next[1], u;
                if (start < end) {
                  // mark for deletion
                  for (u = start + 1; u < end; u++) {
                    outPath[u][2] = true;
                  }
                }
                else if (start > end) {
                  // mark for deletion
                  for (u = start + 1; u < outPath.length; u++) {
                    outPath[u][2] = true;
                  }
                  for (u = 0; u < end; u++) {
                    outPath[u][2] = true;
                  }
                }
              }
              
              k = (k + 1) % len;
            } while (k !== 0);
          }
          //console.log("After loop check: ", dojo.toJson(outPath));
          
          // preprocess before deleting marked points
          var first = outPath[0], last = outPath[outPath.length - 1];
          if (first[2]) { // the first point is marked for removal
            last[2] = true; // mark its buddy (the last point) as well
            
            // if the point at index 1 is an intersection point,
            // add it to the end of the path as well to close the path
            dojo.some(pathData, function(data) {
              if (data[1] === 1) {
                outPath.splice(outPath.length - 1, 0, dojo.clone(outPath[1]));
                return true;
              }
              return false;
            });
          }

          // remove points marked for deletion
          outPath = dojo.filter(outPath, function(point) {
            return point[2] ? false : true;
          });
          //console.log("After deleting marked points: ", dojo.toJson(outPath));
          
          // remove consecutive identical points
          for (k = 0; k < outPath.length - 1; k++) {
            var now = outPath[k];
            var next = outPath[k + 1];
            if (!next || (now[0] !== next[0]) || (now[1] !== next[1])) {
              continue;
            }
            
            if (next.outIn) {
              now.outIn = true;
            }
            else if (next.inOut) {
              now.inOut = true;
            }
            
            outPath.splice(k + 1, 1);
          }
          //console.log("After deleting consecutive identical points: ", dojo.toJson(outPath));
          
          // add corners of the clipper if they're engulfed
          var abs = Math.abs, cornerPointsData = [];
          for (k = 0; k < outPath.length - 1; k++) {
            var curr = outPath[k], cx = curr[0], cy = curr[1];
            var x1 = (abs(cx) === clipLimit);
            var y1 = (abs(cy) === clipLimit);
            var next = outPath[k + 1], nx = next[0], ny = next[1];
            var x2 = (abs(nx) === clipLimit);
            var y2 = (abs(ny) === clipLimit);
            
            if (x1 && y2) {
              cornerPointsData.push([ k + 1, [ cx, ny ] ]);
            }
            else if (y1 && x2) {
              cornerPointsData.push([ k + 1, [ nx, cy ] ]);
            }
          }
          //console.log("cornerPointsData: ", dojo.toJson(cornerPointsData));
          
          for (k = cornerPointsData.length - 1; k >= 0; k--) {
            var data = cornerPointsData[k];
            var prev = outPath[data[0]-1];
            var now = outPath[data[0]];
            /*if (outPath[data[0]-1].outIn && outPath[data[0]].inOut) {
              continue;
            }*/
            if (prev.outIn || prev.inOut || now.outIn || now.inOut) {
              continue;
            }
            outPath.splice(data[0], 0, data[1]);
          }
          
          // check if the path is closed
          var first = outPath[0], last = outPath[outPath.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            outPath.push(first);
          }
          
          //console.info("path after manual clipping: ", dojo.toJson(outPath));
          return outPath;
        }); // dojo.map(myPath.segments)
        
        //console.info("shape after manual clipping: ", dojo.toJson(outPaths));
        shape.setShape(this._getPathStringFromPaths(outPaths));
      } // if !isPointWithinRange
    },
    
    _getCorners: function(shape, geometry) {
      if (esri.vml) {
        // Typically we would just call shape.getTransformedBoundingBox(),
        // but the esri.gfx.Path impl for IE prevents GFX from getting the 
        // the necessary data to do this calculation.
        // Ref: https://support.sitepen.com/issues/64
        /*var box = dojo.contentBox(shape.getNode());
        var left = geometry._screenLeft, top = geometry._screenTop;
        //console.log(dojo.toJson(topLeft), dojo.toJson(bottomRight), node.path.v);
        return {
          tl: { x: left, y: top }, 
          br: { x: left + box.w, y: top + box.h }
        };*/

        var map = this._map;
        var extent = geometry.getExtent();
        var topLeft = map.toScreen(new esri.geometry.Point(extent.xmin, extent.ymax));
        var bottomRight = map.toScreen(new esri.geometry.Point(extent.xmax, extent.ymin));
        return {
          tl: topLeft, 
          br: bottomRight
        };
        
        // Ideally you'd want to use dojo.coords like below. But
        // unfortunately calling coords messes up the positioning of
        // paths in IE by a small amount (gets corrected on map pan). 
        // This is puzzling because coords is supposed to do read 
        // operations only.
        /*var coords = dojo.coords(shape.getEventSource());
        topLeft = { x: coords.x, y: coords.y };
        bottomRight = { x: coords.x + coords.w, y: coords.y + coords.h };*/
      }
      else {
        var shpBBox = shape.getTransformedBoundingBox();
        //console.log(dojo.toJson(shpBBox));
        return { tl: shpBBox[0], br: shpBBox[2] };
      }
    },
    
    _createSegments: function(shape) {
      // See dojox/gfx/path.js::setShape method for 
      // more information and context
      shape.shape.path = shape.vmlPath;
      shape.segmented = false;
      shape._confirmSegmented();
      
      var segments = shape.segments;
      if (segments.length > 1) {
        shape.segments = dojo.filter(segments, function(segment, idx, arr) {
          var next = arr[idx + 1];
          if (segment.action === "M" && next && next.action === "L") {
            segment.args = segment.args.concat(next.args);
            return true;
          }
          return false;
        });
      }
    },
    
    /*_getPathsFromPathString: function(pathString) {
      var paths = pathString.replace(/[\ e]/g, "").split("m");
      paths.shift();
      return dojo.map(paths, function(pathStr) {
        var coords = pathStr.replace(/l/g, ",").split(",");
        return {
          action: "M",
          args: dojo.map(coords, function(coord) {
            return parseInt(coord, 10);
          })
        };
      }); // map
    },*/
    
    _getPathStringFromPaths: function(paths) {
      if (esri.vml) { // path spec for VML
        paths = dojo.map(paths, function(path) {
          var newPath = dojo.map(path, function(point, idx) {
            return (idx === 1 ? "l " : "") + point.join(",");
          });
          return "m " + newPath.join(" ");
        });
        paths.push("e");
      }
      else {
        paths = dojo.map(paths, function(path) {
          var newPath = dojo.map(path, function(point) {
            return point.join(",");
          });
          return "M " + newPath.join(" ");
        });
      }
      return paths.join(" ");
    },

    _isPointWithinBBox: function(point, bbox) {
      var left = bbox[0], top = bbox[1];
      var right = bbox[2], bottom = bbox[3];
      var x = point[0], y = point[1];
      //if (x >= left && x <= right && y >= top && y <= bottom) {
      if (x > left && x < right && y > top && y < bottom) {
        return true;
      }
      else {
        return false;
      }
    },
    
    _isPointWithinRange: function(point, rangeMin, rangeMax) {
      var x = point.x, y = point.y;
      if (x < rangeMin || y < rangeMin || x > rangeMax || y > rangeMax) {
        return false;
      }
      else {
        return true;
      }
    },
    
    _getClipperIntersection: function(line, clipSegments, processAllHalfPlanes) {
      var i, check = esri.geometry._getLineIntersection2, round = Math.round, data = { length: 0 };
      for (i = 0; i < 4; i++) {
        var intersection = check(line, clipSegments[i]);
        if (intersection) {
          intersection[0] = round(intersection[0]);
          intersection[1] = round(intersection[1]);
          if (!processAllHalfPlanes) {
            return [ i, intersection ];
          }
          else {
            data[i] = intersection;
            data.length++;
          }
        } // if intersection
      }
      return processAllHalfPlanes ? data : null;
    },
    
    _getPlaneIndex: function(point, clipBBox) {
      var px = point[0], py = point[1], xmin = clipBBox[0], ymin = clipBBox[1], xmax = clipBBox[2], ymax = clipBBox[3];
      
      if (px <= xmin) { // xmin
        if ((py >= ymin) && (py <= ymax)) {
          return 3;
        }
        else {
          return (py < ymin) ? [0,3] : [2,3];
        }
      }
      
      if (py <= ymin) { // ymin
        if ((px >= xmin) && (px <= xmax)) {
          return 0;
        }
        else {
          return (px < xmin) ? [3,0] : [1,0];
        }
      }
      
      if (px >= xmax) { // xmax
        if ((py >= ymin) && (py <= ymax)) {
          return 1;
        }
        else {
          return (py < ymin) ? [0,1] : [2,1];
        }
      }
      
      if (py >= ymax) { // ymax
        if ((px >= xmin) && (px <= xmax)) {
          return 2;
        }
        else {
          return (px < xmin) ? [3,2] : [1,2];
        }
      }
      
      return -1;
    },

    //PUBLIC METHODS
    //Events
    onGraphicAdd: function() {
      //summary: Event fired when graphic is added to layer
      // arguments[0]: esri.Graphic: Added graphic feature
    },

    onGraphicRemove: function() {
      //summary: Event fired when graphic is removed from layer
      // arguments[0]: esri.Graphic: Removed graphic feature
    },

    onGraphicsClear: function() {
      //summary: Event fired when all graphics are removed from layer
    },
    
    onOpacityChange: function() {
      // arguments[0]: Number: current opacity
    },
  
    setInfoTemplate: function(newTemplate) {
      this.infoTemplate = newTemplate;
    },

    add: function(graphic) {
      //summary: Add a graphic object onto this layer
      // graphic: esri.Graphic: Graphic to be added. If graphic already contained
      //          in collection, returns the previously added graphic and does not
      //          redraw.
      //    returns: esri.Graphic: Added graphic or previously added graphic
      var silent = arguments[1];

      /*if ((i = dojo.indexOf(this.graphics, graphic)) !== -1) {
        return this.graphics[i];
      }*/
     
      if (graphic._graphicsLayer === this) {
        return graphic;
      }

      if (! silent) {
        this.graphics.push(graphic);
      }

      graphic._graphicsLayer = this;
      this._updateExtent(graphic);
      this._draw(graphic);
      if (! silent) {
        this.onGraphicAdd(graphic);
      }
      return graphic;
    },

    remove: function(graphic) {
      //summary: Remove argument graphic from this layer
      // g: esri.Graphic: Graphic to be removed
      //    returns: esri.Graphic: Removed graphic object
      // var silent = arguments[1];

      if (! arguments[1]) {
        var graphics = this.graphics,
            i;
        if ((i = dojo.indexOf(graphics, graphic)) === -1) {
          return null;
        }
        
        graphic = this.graphics.splice(i, 1)[0];
      }

      if (graphic.getDojoShape()) {
        this._removeShape(graphic);
      }
      graphic._shape = graphic._graphicsLayer = null;

      this.onGraphicRemove(graphic);
      return graphic;
    },

    clear: function() {
      //summary: Remove all graphics from this layer
      var silent = arguments[1],
          g = this.graphics;
      
      while (g.length > 0) {
        this.remove(g[0]);
      }

      if (! silent) {
        this.onGraphicsClear();
      }
    },
    
    setOpacity: function(op, _init) {
      if (_init || this.opacity != op) { // is there a change in opacity?
      
        var div = this._div;
        if (div) {
          if (esri.vml) { // IE
          
            dojo.forEach(this.graphics, function(graphic) {
              var shape = graphic._shape;
              var node = shape && shape.getNode();
              if (node) {
                var strokeStyle = shape.strokeStyle, stroke = node.stroke;
                if (strokeStyle && stroke) {
                  stroke.opacity = strokeStyle.color.a * op;
                } // stroke
                
                var fillStyle = shape.fillStyle, fill = node.fill;
                if (fillStyle && fill) {
                  if (fill.type === "tile") {
                    dojo.style(node, "opacity", op);
                  }
                  else {
                    fill.opacity = fillStyle.a * op;
                  }
                } // fill
                
                /*if (shape.declaredClass === "dojox.gfx.Image") {
                  dojo.style(node, "opacity", op);
                }*/
                
              } // if node
            }); // loop end
            
            div._esriIeOpacity = op;
          } // if IE
          
          else if (this._canvas) { // canvas
            dojo.style(div.getEventSource(), "opacity", op);
          }
          
          else { // SVG
            //dojo.style(div.getEventSource(), "opacity", op);
            div.getEventSource().setAttribute("opacity", op);
            
            // Ref:
            // http://www.w3.org/TR/SVG/masking.html#OpacityProperty
          }
        } // if div
        
        this.opacity = op;
        
        if (!_init) {
          this.onOpacityChange(op);
        }
      } // if
    },
    
    setRenderer: function(ren) {
      this.renderer = ren;
    }
  }
);

dojo.declare("esri.layers.GraphicsLayer", esri.layers._GraphicsLayer, {
    constructor: function() {
      this.enableMouseEvents = dojo.hitch(this, this.enableMouseEvents);
      this.disableMouseEvents = dojo.hitch(this, this.disableMouseEvents);
      this._processEvent = dojo.hitch(this, this._processEvent);

      this._initLayer();
    },
    
    _initLayer: function() {
      this.loaded = true;
      this.onLoad(this);
    },
    
    _setMap: function() {
      var d = this.inherited("_setMap", arguments);
      this.enableMouseEvents();
      return d;
    },
    
    _unsetMap: function() {
      this.disableMouseEvents();
      this.inherited("_unsetMap", arguments);
    },

    //mouse event handling
    _processEvent: function(/*Event*/ evt) {
      //summary: Get XY coordinates of event
      // returns: esri.geometry.Point: Screen point
      var _m = this._map,
          g = this.graphics,
          gl = g.length;
      evt.screenPoint = new esri.geometry.Point(evt.pageX - _m.position.x, evt.pageY - _m.position.y);
      evt.mapPoint = _m.toMap(evt.screenPoint);

      var i, es, gr, ds,
          target = evt.target,
          targetParent = target.parentNode;
      for (i=0; i<gl; i++) {
        gr = g[i];
        ds = gr.getDojoShape();
        if (ds) {
          es = ds.getEventSource();
          if (es === target || es === targetParent) {
            evt.graphic = gr;
            return evt;
          }
        }
      }
    },

    _onMouseOverHandler: function(/*Event*/ evt) {
      if (this._processEvent(evt)) {
        this.onMouseOver(evt);
      }
    },

    _onMouseMoveHandler: function(/*Event*/ evt) {
      if (this._processEvent(evt)) {
        this.onMouseMove(evt);
      }
    },
    
    _onMouseDragHandler: function(/*Event*/ evt) {
      if (this._processEvent(evt)) {
        this.onMouseDrag(evt);
      }
    },

    _onMouseOutHandler: function(/*Event*/ evt) {
      if (this._processEvent(evt)) {
        this.onMouseOut(evt);
      }
    },

    _onMouseDownHandler: function(/*Event*/ evt) {
      this._downGr = this._downPt = null;
      if (this._processEvent(evt)) {
        dojo.disconnect(this._onmousemove_connect);
        dojo.disconnect(this._onmousedrag_connect);
        this._onmousedrag_connect = dojo.connect(this._div.getEventSource(), "onmousemove", this, "_onMouseDragHandler");
        this._downGr = evt.graphic;
        this._downPt = evt.screenPoint.x + "," + evt.screenPoint.y;
        this.onMouseDown(evt);
      }
    },

    _onMouseUpHandler: function(/*Event*/ evt) {
      this._upGr = this._upPt = null;
      if (this._processEvent(evt)) {
        dojo.disconnect(this._onmousedrag_connect);
        dojo.disconnect(this._onmousemove_connect);
        this._onmousemove_connect = dojo.connect(this._div.getEventSource(), "onmousemove", this, "_onMouseMoveHandler");
        this._upGr = evt.graphic;
        this._upPt = evt.screenPoint.x + "," + evt.screenPoint.y;
        this.onMouseUp(evt);
      }
    },

    _onClickHandler: function(/*Event*/ evt) {
      if (this._processEvent(evt)) {
        var downGr = this._downGr, upGr = this._upGr;
        if (downGr && upGr && downGr === upGr && this._downPt === this._upPt) {
          // Click is perceived as MouseDown followed by MouseUp on the same graphic
          // where the Down and Up happened on the same screen location
          // We are not bothered about the graphic/location for the click event
          // as a click on a different graphic/location cannot happen without the
          // corresponding MouseDown and MouseUp events.
          // Do we really need this click handler then? We could infer click from within
          // the mouse up handler itself.
          
          // In non-IE browsers, "graphic" property attached to the event object
          // (by _processEvt method) is seen by map click handlers. This workaround 
          // will do the same in IE. Having the clicked graphic available to map
          // onClick handlers will simplify listening to click event on multiple
          // graphics layers. The alternative would be to register click event 
          // listeners for each graphics layer (or) provide a static GraphicsLayer
          // event named "onClick". We still MAY NOT want to announce it to the public that:
          // "listen to map onClick and if the event argument has a "graphic" property
          // that means the click happened on a graphic"
          // See also: _MapContainer::_fireClickEvent method
          if (dojo.isIE < 9) {
            esri.layers.GraphicsLayer._clicked = evt.graphic;
          }

          this.onClick(evt);
        }
      }
    },
    
    _onDblClickHandler: function(/*Event*/ evt) {
      if (this._processEvent(evt)) {
        this.onDblClick(evt);
      }
    },

    //Mouse event
    onMouseOver: function() {
      //summary: Mouse enters graphic
      // arguments[0]: Event: Mouse event
      //             : Event.screenPoint: Screen coordinates, wrt map's top-left
      //             : Event.mapPoint: Map coordinates
      //             : Event.graphic: Target graphic triggering event
    },

    onMouseMove: function() {
      //summary: Mouse move over graphic
      // arguments[0]: Event: Mouse event
      //             : Event.screenPoint: Screen coordinates, wrt map's top-left
      //             : Event.mapPoint: Map coordinates
      //             : Event.graphic: Target graphic triggering event
    },

    onMouseDrag: function() {
      //summary: Mouse move over graphic
      // arguments[0]: Event: Mouse event
      //             : Event.screenPoint: Screen coordinates, wrt map's top-left
      //             : Event.mapPoint: Map coordinates
      //             : Event.graphic: Target graphic triggering event
    },

    onMouseOut: function() {
      //summary: Mouse exits graphic
      // arguments[0]: Event: Mouse event
      //             : Event.screenPoint: Screen coordinates, wrt map's top-left
      //             : Event.mapPoint: Map coordinates
      //             : Event.graphic: Target graphic triggering event
    },

    onMouseDown: function() {
      //summary: Mouse is pressed on a graphic
      // arguments[0]: Event: Mouse event
      //             : Event.screenPoint: Screen coordinates, wrt map's top-left
      //             : Event.mapPoint: Map coordinates
      //             : Event.graphic: Target graphic triggering event
    },

    onMouseUp: function() {
      //summary: Mouse is released on a graphic
      // arguments[0]: Event: Mouse event
      //             : Event.screenPoint: Screen coordinates, wrt map's top-left
      //             : Event.mapPoint: Map coordinates
      //             : Event.graphic: Target graphic triggering event
    },

    onClick: function() {
      //summary: Mouse clicked on graphic
      // arguments[0]: Event: Mouse event
      //             : Event.screenPoint: Screen coordinates, wrt map's top-left
      //             : Event.mapPoint: Map coordinates
      //             : Event.graphic: Target graphic triggering event
    },

    onDblClick: function() {
      //summary: Mouse double clicked on a graphic
      // arguments[0]: Event: Mouse event
      //             : Event.screenPoint: Screen coordinates, wrt map's top-left
      //             : Event.mapPoint: Map coordinates
      //             : Event.graphic: Target graphic triggering event
    },

    enableMouseEvents: function() {
      if (this._mouseEvents) {
        return;
      }

      var dc = dojo.connect,
          gc = this._div.getEventSource();
          
      if (dojox.gfx.renderer !== "canvas") { // canvas
        this._onmouseover_connect =  dc(gc, "onmouseover", this, "_onMouseOverHandler");
        this._onmousemove_connect = dc(gc, "onmousemove", this, "_onMouseMoveHandler");
        this._onmouseout_connect = dc(gc, "onmouseout", this, "_onMouseOutHandler");
        this._onmousedown_connect = dc(gc, "onmousedown", this, "_onMouseDownHandler");
        this._onmouseup_connect = dc(gc, "onmouseup", this, "_onMouseUpHandler");
        this._onclick_connect = dc(gc, "onclick",  this, "_onClickHandler");
        this._ondblclick_connect = dc(gc, "ondblclick",  this, "_onDblClickHandler");
      }
      this._mouseEvents = true;
    },

    disableMouseEvents: function() {
      if (! this._mouseEvents) {
        return;
      }

      var ddc = dojo.disconnect;
      ddc(this._onmouseover_connect);
      ddc(this._onmousemove_connect);
      ddc(this._onmousedrag_connect);
      ddc(this._onmouseout_connect);
      ddc(this._onmousedown_connect);
      ddc(this._onmouseup_connect);
      ddc(this._onclick_connect);
      ddc(this._ondblclick_connect);
      this._mouseEvents = false;
    }
  }
);
});

},
'esri/InfoWindowBase':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!dijit/_base/manager"], function(dijit,dojo,dojox){
dojo.provide("esri.InfoWindowBase");

dojo.require("dijit._base.manager");

/**
 * Base class for InfoWindow implementation. It defines
 * the following:
 * - Defines what esri.Map expects from an InfoWindow.
 * - Provides implementation for some functionality that
 *   may be used by most implementations.
 * 
 * Sub-classes may define additional properties, methods
 * and events on top of what is defined by this base class.
 */
dojo.declare("esri.InfoWindowBase", null, {
  constructor: function() {
    var hitch = dojo.hitch;
    this.__set_title = hitch(this, this.__set_title);
    this.__err_title = hitch(this, this.__err_title);
    this.__set_content = hitch(this, this.__set_content);
    this.__err_content = hitch(this, this.__err_content);
  },

  /*************
   * Properties
   *************/
  
  /*
   * isShowing: <Boolean>
   * 
   * Return true if the info window is visible.
   * Else, return false.
   * 
   * domNode: <Object>
   * 
   * Return the HTML element where the info window
   * is rendered
   */
  
  /**********
   * Methods
   **********/
  
  setMap: function(map) {
    /*
     * This method will be called by the map (after the map has loaded) 
     * when this object is set as its info window.
     * 
     * Sub-classes can override this method to do more.
     */
    
    this.map = map;
  },
  
  unsetMap: function(map) {
    /*
     * This method will be called by the map when this object is no
     * longer the map's info window. This method will be called
     * when the map is destroyed, if this object is the map's info window
     * at the time of its destruction.
     * 
     * Sub-classes can override this method to do more.
     */
    
    delete this.map;
  },
  
  setTitle: function(/* title */) {
    /*
     * Set the given value as title for the info window.
     * 
     * Value can be one of the following:
     *   String
     *   DOM Node or DOM Node of a Dijit
     *   Instance of dojo.Deferred
     *   null or undefined (clear the current title)
     */
  },
  
  setContent: function(/* content */) {
    /*
     * Set the given value as the info window content.
     * 
     * Value can be one of the following:
     *   String
     *   DOM Node or DOM Node of a Dijit
     *   Instance of dojo.Deferred
     *   null or undefined (clear the current content)
     *   
     * Possible implementation variations:
     *
     * [1] Sub-class may choose to render title as integral
     * part of the content/body.
     * 
     * [2] Sub-class may choose to not make the content
     * visible by default. It can be shown (or animated-in) 
     * in response to user clicking on the title.
     */
  },
  
  show: function(/* location */) {
    /*
     * Make the info window visible - all or part of it. If displaying
     * partially, the rest of the UI can be displayed in response to 
     * user interaction.
     * 
     * Fire onShow event at the end of show logic.
     * 
     * "location" is an instance of esri.geometry.Point. If the location
     * contains spatialReference, then it is assumed to be in map 
     * coordinates. Else, it is assumed to be in screen coordinates.
     * Screen coordinates are measured in pixels from the top-left corner
     * of the map control. Map::toMap and Map::toScreen methods can be
     * used for conversion between map and screen coordinates.
     */
  },
  
  hide: function() {
    /*
     * Hide the info window completely.
     * 
     * Fire onHide event at the end of hide logic.
     */
  },
  
  resize: function(/* width, height */) {
    /*
     * Resize the info window to the given width and height (in pixels)
     */
  },
  
  /*********
   * Events
   *********/
  
  onShow: function() {
    /*
     * Fire this event after the info window becomes visible.
     */
  },
  
  onHide: function() {
    /*
     * Fire this event after the info window is hidden. 
     */
  },
  
  /*********************************
   * Helper Methods for Sub-Classes
   *********************************/
  
  place: function(/* String|DOM Node|null|undefined */ newValue, /* DOM Node */ parentNode) {
    if (esri._isDefined(newValue)) {
      if (dojo.isObject(newValue)) {
        dojo.place(newValue, parentNode, "only");
      }
      else {
        parentNode.innerHTML = newValue;        
      }
    }
    else {
      parentNode.innerHTML = "";
    }
  },
  
  startupDijits: function(/* DOM Node */ node) {
    this._processDijits(node);
  },
  
  destroyDijits: function(/* DOM Node */ node) {
    this._processDijits(node, true);
  },
  
  /*******************
   * Internal Methods
   *******************/

  _processDijits: function(node, destroy) {
    if (node && node.children.length === 1) {
      var child = node.children[0];
      if (child) {
        var widget = dijit.byNode(child);
        var widgets = widget ? [ widget ] : dijit.findWidgets(child);
        
        dojo.forEach(widgets, function(widget) {
          if (destroy) {
            if (widget._started && !widget._destroyed) {
              try {
                //console.log("destroy...", widget.id);
                if (widget.destroyRecursive) {
                  widget.destroyRecursive();
                }
                else if (widget.destroy) {
                  widget.destroy();
                }
              }
              catch (ex) {
                console.debug("An error occurred when destroying a widget embedded within InfoWindow: " + ex.message);
              }
            }
          } // destroy
          else {
            if (!widget._started) {
              try {
                //console.log("startup.....", widget.id);
                widget.startup();
              }
              catch (ex2) {
                console.debug("An error occurred when starting a widget embedded within InfoWindow: " + ex2.message);
              }
            }
          } // startup
        });
      } // child
    } // node
  },
  
  /*******************
   * Internal Methods
   *******************/
  
  /**
   * For internal use by out-of-the-box InfoWindow 
   * implementations only. I didn't want to define
   * another internal class to hold this implementation
   * just for out-of-the-box InfoWindows.
   */
  
  __registerMapListeners: function() {
    this.__unregisterMapListeners();
    //console.log("register");
    
    var map = this.map;
    this.__handles = [
      dojo.connect(map, "onPan", this, this.__onMapPan),
      dojo.connect(map, "onZoomStart", this, this.__onMapZmStart),
      dojo.connect(map, "onExtentChange", this, this.__onMapExtChg)
    ];
  },
  
  __unregisterMapListeners: function() {
    //console.log("UNregister");
    
    var handles = this.__handles;
    if (handles) {
      dojo.forEach(handles, dojo.disconnect, dojo);
      this.__handles = null;
    }
  },
  
  __onMapPan: function(extent, delta) {
    //console.log("pan");

    this.move(delta, true);
  },
  
  __onMapZmStart: function() {
    //console.log("zoom start");
    
    this.__mcoords = this.mapCoords || this.map.toMap(new esri.geometry.Point(this.coords));
    this.hide(null, true);
  },
  
  __onMapExtChg: function(extent, delta, levelChange) {
    //console.log("extent change");
    
    var map = this.map, mapPoint = this.mapCoords;
    if (mapPoint) {
      this.show(mapPoint, null /*map.getInfoWindowAnchor(map.toScreen(mapPoint))*/, true);
    }
    else {
      var screenPoint;
      if (levelChange) {
        screenPoint = map.toScreen(this.__mcoords);
      }
      else {
        // delta will not be available when map extent change event is fired
        // due to map resize
        screenPoint = this.coords.offset(
          (delta && delta.x) || 0, 
          (delta && delta.y) || 0
        );
      }
      this.show(screenPoint, null /*map.getInfoWindowAnchor(screenPoint)*/, true);
    }
  },
  
  __setValue: function(propertyName, newValue) {
    this[propertyName].innerHTML = "";
    
    // Cancel pending unfired deferred
    var dfd = "_dfd" + propertyName, pending = this[dfd];
    if (pending && pending.fired === -1) {
      //console.log("Cancelling...", pending);
      pending.cancel();
      this[dfd] = null;
      //console.log("cancelled.");
    }
    
    if (esri._isDefined(newValue)) { // we don't want to miss 0 or false
      if (newValue instanceof dojo.Deferred) {
        this[dfd] = newValue;
        newValue.addCallbacks(this["__set" + propertyName], this["__err" + propertyName]);
      }
      else {
        this.__render(propertyName, newValue);
      }
    }
  },
    
  __set_title: function(response) {
    //console.log("rendering title...");
    this._dfd_title = null;
    this.__render("_title", response);
  },
  
  __err_title: function(error) {
    //console.log("ERROR rendering title...", error);
    this._dfd_title = null;
  },
  
  __set_content: function(response) {
    //console.log("rendering content...");
    this._dfd_content = null;
    this.__render("_content", response);
  },
  
  __err_content: function(error) {
    //console.log("ERROR rendering content...", error);
    this._dfd_content = null;
  },
  
  __render: function(propertyName, newValue) {
    var node = this[propertyName];
    this.place(newValue, node);
    
    // If the infowindow is visible, startup widgets
    // right away.
    if (this.isShowing) {
      this.startupDijits(node);
    
      if (propertyName === "_title" && this._adjustContentArea) {
        this._adjustContentArea();
      }
    }
  }
});

});

},
'esri/WKIDUnitConversion':function(){
// wrapped by build app
define(["dijit","dojo","dojox"], function(dijit,dojo,dojox){
dojo.provide("esri.WKIDUnitConversion");

esri.WKIDUnitConversion = {values:[1,0.2011661949,0.3047997101815088,0.3048006096012192,0.3048,0.304797265,0.9143985307444408,20.11678249437587,0.9143984146160287,20.11676512155263,0.3047994715386762,0.91439523,50000,150000],2000:0,2001:0,2002:0,2003:0,2004:0,2005:0,2006:0,2007:0,2008:0,2009:0,2010:0,2011:0,2012:0,2013:0,2014:0,2015:0,2016:0,2017:0,2018:0,2019:0,2020:0,2021:0,2022:0,2023:0,2024:0,2025:0,2026:0,2027:0,2028:0,2029:0,2030:0,2031:0,2032:0,2033:0,2034:0,2035:0,2036:0,2037:0,2038:0,2039:0,2040:0,2041:0,2042:0,2043:0,2044:0,2045:0,2056:0,2057:0,2058:0,2059:0,2060:0,2061:0,2062:0,2063:0,2064:0,2065:0,2066:1,2067:0,2068:0,2069:0,2070:0,2071:0,2072:0,2073:0,2074:0,2075:0,2076:0,2077:0,2078:0,2079:0,2080:0,2081:0,2082:0,2083:0,2084:0,2085:0,2086:0,2087:0,2088:0,2089:0,2090:0,2091:0,2092:0,2093:0,2094:0,2095:0,2096:0,2097:0,2098:0,2099:0,2100:0,2101:0,2102:0,2103:0,2104:0,2105:0,2106:0,2107:0,2108:0,2109:0,2110:0,2111:0,2112:0,2113:0,2114:0,2115:0,2116:0,2117:0,2118:0,2119:0,2120:0,2121:0,2122:0,2123:0,2124:0,2125:0,2126:0,2127:0,2128:0,2129:0,2130:0,2131:0,2132:0,2133:0,2134:0,2135:0,2136:2,2137:0,2138:0,2139:0,2140:0,2141:0,2142:0,2143:0,2144:0,2145:0,2146:0,2147:0,2148:0,2149:0,2150:0,2151:0,2152:0,2153:0,2154:0,2155:3,2157:0,2158:0,2159:2,2160:2,2161:0,2162:0,2163:0,2164:0,2165:0,2166:0,2167:0,2168:0,2169:0,2170:0,2172:0,2173:0,2174:0,2175:0,2176:0,2177:0,2178:0,2179:0,2180:0,2181:0,2182:0,2183:0,2184:0,2185:0,2186:0,2187:0,2188:0,2189:0,2190:0,2192:0,2193:0,2195:0,2196:0,2197:0,2198:0,2200:0,2201:0,2202:0,2203:0,2204:3,2205:0,2206:0,2207:0,2208:0,2209:0,2210:0,2211:0,2212:0,2213:0,2214:0,2215:0,2216:0,2217:0,2219:0,2220:0,2222:4,2223:4,2224:4,2225:3,2226:3,2227:3,2228:3,2229:3,2230:3,2231:3,2232:3,2233:3,2234:3,2235:3,2236:3,2237:3,2238:3,2239:3,2240:3,2241:3,2242:3,2243:3,2244:3,2245:3,2246:3,2247:3,2248:3,2249:3,2250:3,2251:4,2252:4,2253:4,2254:3,2255:3,2256:4,2257:3,2258:3,2259:3,2260:3,2261:3,2262:3,2263:3,2264:3,2265:4,2266:4,2267:3,2268:3,2269:4,2270:4,2271:3,2272:3,2273:4,2274:3,2275:3,2276:3,2277:3,2278:3,2279:3,2280:4,2281:4,2282:4,2283:3,2284:3,2285:3,2286:3,2287:3,2288:3,2289:3,2290:0,2291:0,2292:0,2294:0,2295:0,2308:0,2309:0,2310:0,2311:0,2312:0,2313:0,2314:5,2315:0,2316:0,2317:0,2318:0,2319:0,2320:0,2321:0,2322:0,2323:0,2324:0,2325:0,2326:0,2327:0,2328:0,2329:0,2330:0,2331:0,2332:0,2333:0,2334:0,2335:0,2336:0,2337:0,2338:0,2339:0,2340:0,2341:0,2342:0,2343:0,2344:0,2345:0,2346:0,2347:0,2348:0,2349:0,2350:0,2351:0,2352:0,2353:0,2354:0,2355:0,2356:0,2357:0,2358:0,2359:0,2360:0,2361:0,2362:0,2363:0,2364:0,2365:0,2366:0,2367:0,2368:0,2369:0,2370:0,2371:0,2372:0,2373:0,2374:0,2375:0,2376:0,2377:0,2378:0,2379:0,2380:0,2381:0,2382:0,2383:0,2384:0,2385:0,2386:0,2387:0,2388:0,2389:0,2390:0,2391:0,2392:0,2393:0,2394:0,2395:0,2396:0,2397:0,2398:0,2399:0,2400:0,2401:0,2402:0,2403:0,2404:0,2405:0,2406:0,2407:0,2408:0,2409:0,2410:0,2411:0,2412:0,2413:0,2414:0,2415:0,2416:0,2417:0,2418:0,2419:0,2420:0,2421:0,2422:0,2423:0,2424:0,2425:0,2426:0,2427:0,2428:0,2429:0,2430:0,2431:0,2432:0,2433:0,2434:0,2435:0,2436:0,2437:0,2438:0,2439:0,2440:0,2441:0,2442:0,2443:0,2444:0,2445:0,2446:0,2447:0,2448:0,2449:0,2450:0,2451:0,2452:0,2453:0,2454:0,2455:0,2456:0,2457:0,2458:0,2459:0,2460:0,2461:0,2462:0,2523:0,2524:0,2525:0,2526:0,2527:0,2528:0,2529:0,2530:0,2531:0,2532:0,2533:0,2534:0,2535:0,2536:0,2537:0,2538:0,2539:0,2540:0,2541:0,2542:0,2543:0,2544:0,2545:0,2546:0,2547:0,2548:0,2549:0,2550:0,2551:0,2552:0,2553:0,2554:0,2555:0,2556:0,2557:0,2558:0,2559:0,2560:0,2561:0,2562:0,2563:0,2564:0,2565:0,2566:0,2567:0,2568:0,2569:0,2570:0,2571:0,2572:0,2573:0,2574:0,2575:0,2576:0,2577:0,2578:0,2579:0,2580:0,2581:0,2582:0,2583:0,2584:0,2585:0,2586:0,2587:0,2588:0,2589:0,2590:0,2591:0,2592:0,2593:0,2594:0,2595:0,2596:0,2597:0,2598:0,2599:0,2600:0,2601:0,2602:0,2603:0,2604:0,2605:0,2606:0,2607:0,2608:0,2609:0,2610:0,2611:0,2612:0,2613:0,2614:0,2615:0,2616:0,2617:0,2618:0,2619:0,2620:0,2621:0,2622:0,2623:0,2624:0,2625:0,2626:0,2627:0,2628:0,2629:0,2630:0,2631:0,2632:0,2633:0,2634:0,2635:0,2636:0,2637:0,2638:0,2639:0,2640:0,2641:0,2642:0,2643:0,2644:0,2645:0,2646:0,2647:0,2648:0,2649:0,2650:0,2651:0,2652:0,2653:0,2654:0,2655:0,2656:0,2657:0,2658:0,2659:0,2660:0,2661:0,2662:0,2663:0,2664:0,2665:0,2666:0,2667:0,2668:0,2669:0,2670:0,2671:0,2672:0,2673:0,2674:0,2675:0,2676:0,2677:0,2678:0,2679:0,2680:0,2681:0,2682:0,2683:0,2684:0,2685:0,2686:0,2687:0,2688:0,2689:0,2690:0,2691:0,2692:0,2693:0,2694:0,2695:0,2696:0,2697:0,2698:0,2699:0,2700:0,2701:0,2702:0,2703:0,2704:0,2705:0,2706:0,2707:0,2708:0,2709:0,2710:0,2711:0,2712:0,2713:0,2714:0,2715:0,2716:0,2717:0,2718:0,2719:0,2720:0,2721:0,2722:0,2723:0,2724:0,2725:0,2726:0,2727:0,2728:0,2729:0,2730:0,2731:0,2732:0,2733:0,2734:0,2735:0,2736:0,2737:0,2738:0,2739:0,2740:0,2741:0,2742:0,2743:0,2744:0,2745:0,2746:0,2747:0,2748:0,2749:0,2750:0,2751:0,2752:0,2753:0,2754:0,2755:0,2756:0,2757:0,2758:0,2759:0,2760:0,2761:0,2762:0,2763:0,2764:0,2765:0,2766:0,2767:0,2768:0,2769:0,2770:0,2771:0,2772:0,2773:0,2774:0,2775:0,2776:0,2777:0,2778:0,2779:0,2780:0,2781:0,2782:0,2783:0,2784:0,2785:0,2786:0,2787:0,2788:0,2789:0,2790:0,2791:0,2792:0,2793:0,2794:0,2795:0,2796:0,2797:0,2798:0,2799:0,2800:0,2801:0,2802:0,2803:0,2804:0,2805:0,2806:0,2807:0,2808:0,2809:0,2810:0,2811:0,2812:0,2813:0,2814:0,2815:0,2816:0,2817:0,2818:0,2819:0,2820:0,2821:0,2822:0,2823:0,2824:0,2825:0,2826:0,2827:0,2828:0,2829:0,2830:0,2831:0,2832:0,2833:0,2834:0,2835:0,2836:0,2837:0,2838:0,2839:0,2840:0,2841:0,2842:0,2843:0,2844:0,2845:0,2846:0,2847:0,2848:0,2849:0,2850:0,2851:0,2852:0,2853:0,2854:0,2855:0,2856:0,2857:0,2858:0,2859:0,2860:0,2861:0,2862:0,2863:0,2864:0,2865:0,2866:0,2867:4,2868:4,2869:4,2870:3,2871:3,2872:3,2873:3,2874:3,2875:3,2876:3,2877:3,2878:3,2879:3,2880:3,2881:3,2882:3,2883:3,2884:3,2885:3,2886:3,2887:3,2888:3,2891:3,2892:3,2893:3,2894:3,2895:3,2896:4,2897:4,2898:4,2899:3,2900:3,2901:4,2902:3,2903:3,2904:3,2905:3,2906:3,2907:3,2908:3,2909:4,2910:4,2911:3,2912:3,2913:4,2914:4,2915:3,2916:3,2917:3,2918:3,2919:3,2920:3,2921:4,2922:4,2923:4,2924:3,2925:3,2926:3,2927:3,2928:3,2929:3,2930:3,2931:0,2932:0,2933:0,2935:0,2936:0,2937:0,2938:0,2939:0,2940:0,2941:0,2942:0,2943:0,2944:0,2945:0,2946:0,2947:0,2948:0,2949:0,2950:0,2951:0,2952:0,2953:0,2954:0,2955:0,2956:0,2957:0,2958:0,2959:0,2960:0,2961:0,2962:0,2964:3,2965:3,2966:3,2967:3,2968:3,2969:0,2970:0,2971:0,2972:0,2973:0,2975:0,2976:0,2977:0,2978:0,2979:0,2980:0,2981:0,2982:0,2984:0,2985:0,2986:0,2987:0,2988:0,2989:0,2991:0,2992:4,2993:0,2994:4,2995:0,2996:0,2997:0,2998:0,2999:0,3000:0,3001:0,3002:0,3003:0,3004:0,3005:0,3006:0,3007:0,3008:0,3009:0,3010:0,3011:0,3012:0,3013:0,3014:0,3015:0,3016:0,3017:0,3018:0,3019:0,3020:0,3021:0,3022:0,3023:0,3024:0,3025:0,3026:0,3027:0,3028:0,3029:0,3030:0,3031:0,3032:0,3033:0,3034:0,3035:0,3036:0,3037:0,3054:0,3055:0,3056:0,3057:0,3058:0,3059:0,3060:0,3061:0,3062:0,3063:0,3064:0,3065:0,3066:0,3067:0,3068:0,3069:0,3070:0,3071:0,3072:0,3073:0,3074:0,3075:0,3076:0,3077:0,3078:0,3079:0,3080:4,3081:0,3082:0,3083:0,3084:0,3085:0,3086:0,3087:0,3088:0,3089:3,3090:0,3091:3,3092:0,3093:0,3094:0,3095:0,3096:0,3097:0,3098:0,3099:0,3100:0,3101:0,3102:3,3106:0,3107:0,3108:0,3109:0,3110:0,3111:0,3112:0,3113:0,3114:0,3115:0,3116:0,3117:0,3118:0,3119:0,3120:0,3121:0,3122:0,3123:0,3124:0,3125:0,3126:0,3127:0,3128:0,3129:0,3130:0,3131:0,3132:0,3133:0,3134:0,3135:0,3136:0,3137:0,3138:0,3141:0,3142:0,3148:0,3149:0,3153:0,3154:0,3155:0,3156:0,3157:0,3158:0,3159:0,3160:0,3161:0,3162:0,3163:0,3164:0,3165:0,3166:0,3169:0,3170:0,3171:0,3172:0,3174:0,3175:0,3176:0,3177:0,3178:0,3179:0,3180:0,3181:0,3182:0,3183:0,3184:0,3185:0,3186:0,3187:0,3188:0,3189:0,3190:0,3191:0,3192:0,3193:0,3194:0,3195:0,3196:0,3197:0,3198:0,3199:0,3200:0,3201:0,3202:0,3203:0,3294:0,3296:0,3297:0,3298:0,3299:0,3300:0,3301:0,3302:0,3303:0,3304:0,3305:0,3306:0,3307:0,3308:0,3309:0,3310:0,3311:0,3312:0,3313:0,3314:0,3315:0,3316:0,3317:0,3318:0,3319:0,3320:0,3321:0,3322:0,3323:0,3324:0,3325:0,3326:0,3327:0,3328:0,3329:0,3330:0,3331:0,3332:0,3333:0,3334:0,3335:0,3336:0,3337:0,3338:0,3339:0,3340:0,3341:0,3342:0,3343:0,3344:0,3345:0,3346:0,3347:0,3348:0,3349:0,3350:0,3351:0,3352:0,3353:0,3354:0,3355:0,3356:0,3357:0,3358:0,3359:3,3360:0,3361:4,3362:0,3363:3,3364:0,3365:3,3366:5,3367:0,3368:0,3369:0,3370:0,3371:0,3372:0,3373:0,3374:0,3375:0,3376:0,3377:0,3378:0,3379:0,3380:0,3381:0,3382:0,3383:0,3384:0,3385:0,3386:0,3387:0,3388:0,3391:0,3392:0,3393:0,3394:0,3395:0,3396:0,3397:0,3398:0,3399:0,3400:0,3401:0,3402:0,3403:0,3404:3,3405:0,3406:0,3407:5,3408:0,3409:0,3410:0,3411:0,3412:0,3413:0,3414:0,3415:0,3416:0,3417:3,3418:3,3419:3,3420:3,3421:3,3422:3,3423:3,3424:3,3425:3,3426:3,3427:3,3428:3,3429:3,3430:3,3431:3,3432:3,3433:3,3434:3,3435:3,3436:3,3437:3,3438:3,3439:0,3440:0,3441:3,3442:3,3443:3,3444:3,3445:3,3446:3,3447:0,3448:0,3449:0,3450:0,3453:3,3456:3,3457:3,3458:3,3459:3,3460:0,3461:0,3462:0,3463:0,3464:0,3560:3,3561:3,3562:3,3563:3,3564:3,3565:3,3566:3,3567:3,3568:3,3569:3,3570:3,3571:0,3572:0,3573:0,3574:0,3575:0,3576:0,3577:0,3578:0,3579:0,3580:0,3581:0,3582:3,3583:0,3584:3,3585:0,3586:3,3587:0,3588:4,3589:0,3590:4,3591:0,3592:0,3593:4,3594:0,3595:0,3596:0,3597:0,3598:3,3599:0,3600:3,3601:0,3602:0,3603:0,3604:0,3605:4,3606:0,3607:0,3608:3,3609:0,3610:3,3611:0,3612:3,3613:0,3614:3,3615:0,3616:3,3617:0,3618:3,3619:0,3620:3,3621:0,3622:3,3623:0,3624:3,3625:0,3626:3,3627:0,3628:3,3629:0,3630:3,3631:0,3632:3,3633:0,3634:4,3635:0,3636:4,3637:0,3638:0,3639:0,3640:3,3641:0,3642:3,3643:0,3644:4,3645:0,3646:4,3647:0,3648:4,3649:0,3650:3,3651:0,3652:3,3653:0,3654:3,3655:0,3656:4,3657:0,3658:3,3659:0,3660:3,3661:0,3662:3,3663:0,3664:3,3665:0,3666:0,3667:0,3668:3,3669:0,3670:3,3671:0,3672:3,3673:0,3674:3,3675:0,3676:4,3677:3,3678:0,3679:4,3680:3,3681:0,3682:4,3683:3,3684:0,3685:0,3686:3,3687:0,3688:3,3689:0,3690:3,3691:0,3692:3,3693:0,3694:0,3695:0,3696:3,3697:0,3698:3,3699:0,3700:3,3701:0,3702:0,3703:0,3704:0,3705:0,3706:0,3707:0,3708:0,3709:0,3710:0,3711:0,3712:0,3713:0,3714:0,3715:0,3716:0,3717:0,3718:0,3719:0,3720:0,3721:0,3722:0,3723:0,3724:0,3725:0,3726:0,3727:0,3728:3,3729:3,3730:3,3731:3,3732:3,3733:3,3734:3,3735:3,3736:3,3737:3,3738:3,3739:3,3753:3,3754:3,3755:3,3756:3,3757:3,3758:3,3759:3,3760:3,3761:0,3762:0,3763:0,3764:0,3765:0,3766:0,3767:0,3768:0,3769:0,3770:0,3771:0,3772:0,3773:0,3775:0,3776:0,3777:0,3779:0,3780:0,3781:0,3783:0,3784:0,3788:0,3789:0,3790:0,3791:0,3793:0,3794:0,3797:0,3798:0,3799:0,3800:0,3801:0,3802:0,3812:0,3814:0,3815:0,3816:0,3832:0,3833:0,3834:0,3835:0,3836:0,3837:0,3838:0,3839:0,3840:0,3841:0,3851:0,3852:0,3857:0,3890:0,3891:0,3892:0,3893:0,3912:0,3920:0,3942:0,3943:0,3944:0,3945:0,3946:0,3947:0,3948:0,3949:0,3950:0,3968:0,3969:0,3670:0,3973:0,3974:0,3975:0,3976:0,3978:0,3979:0,3986:0,3987:0,3988:0,3989:0,3991:3,3992:3,3994:0,3995:0,3996:0,3997:0,20002:0,20003:0,20004:0,20005:0,20006:0,20007:0,20008:0,20009:0,20010:0,20011:0,20012:0,20013:0,20014:0,20015:0,20016:0,20017:0,20018:0,20019:0,20020:0,20021:0,20022:0,20023:0,20024:0,20025:0,20026:0,20027:0,20028:0,20029:0,20030:0,20031:0,20032:0,20062:0,20063:0,20064:0,20065:0,20066:0,20067:0,20068:0,20069:0,20070:0,20071:0,20072:0,20073:0,20074:0,20075:0,20076:0,20077:0,20078:0,20079:0,20080:0,20081:0,20082:0,20083:0,20084:0,20085:0,20086:0,20087:0,20088:0,20089:0,20090:0,20091:0,20092:0,20135:0,20136:0,20137:0,20138:0,20248:0,20249:0,20250:0,20251:0,20252:0,20253:0,20254:0,20255:0,20256:0,20257:0,20258:0,20348:0,20349:0,20350:0,20351:0,20352:0,20353:0,20354:0,20355:0,20356:0,20357:0,20358:0,20436:0,20437:0,20438:0,20439:0,20440:0,20499:0,20538:0,20539:0,20790:0,20822:0,20823:0,20824:0,20934:0,20935:0,20936:0,21035:0,21036:0,21037:0,21095:0,21096:0,21097:0,21148:0,21149:0,21150:0,21291:0,21292:0,21413:0,21414:0,21415:0,21416:0,21417:0,21418:0,21419:0,21420:0,21421:0,21422:0,21423:0,21473:0,21474:0,21475:0,21476:0,21477:0,21478:0,21479:0,21480:0,21481:0,21482:0,21483:0,21500:0,21780:0,21781:0,21817:0,21818:0,21891:0,21892:0,21893:0,21894:0,21896:0,21897:0,21898:0,21899:0,22032:0,22033:0,22091:0,22092:0,22171:0,22172:0,22173:0,22174:0,22175:0,22176:0,22177:0,22181:0,22182:0,22183:0,22184:0,22185:0,22186:0,22187:0,22191:0,22192:0,22193:0,22194:0,22195:0,22196:0,22197:0,22234:0,22235:0,22236:0,22332:0,22391:0,22392:0,22521:0,22522:0,22523:0,22524:0,22525:0,22700:0,22770:0,22780:0,22832:0,22991:0,22992:0,22993:0,22994:0,23028:0,23029:0,23030:0,23031:0,23032:0,23033:0,23034:0,23035:0,23036:0,23037:0,23038:0,23090:0,23095:0,23239:0,23240:0,23433:0,23700:0,23830:0,23831:0,23832:0,23833:0,23834:0,23835:0,23836:0,23837:0,23838:0,23839:0,23840:0,23841:0,23842:0,23843:0,23844:0,23845:0,23846:0,23847:0,23848:0,23849:0,23850:0,23851:0,23852:0,23853:0,23866:0,23867:0,23868:0,23869:0,23870:0,23871:0,23872:0,23877:0,23878:0,23879:0,23880:0,23881:0,23882:0,23883:0,23884:0,23886:0,23887:0,23888:0,23889:0,23890:0,23891:0,23892:0,23893:0,23894:0,23946:0,23947:0,23948:0,24047:0,24048:0,24100:0,24200:0,24305:0,24306:0,24311:0,24312:0,24313:0,24342:0,24343:0,24344:0,24345:0,24346:0,24347:0,24370:6,24371:6,24372:6,24373:6,24374:6,24375:0,24376:0,24377:0,24378:0,24379:0,24380:0,24381:0,24382:6,24383:0,24500:0,24547:0,24548:0,24571:7,24600:0,24718:0,24719:0,24720:0,24721:0,24817:0,24818:0,24819:0,24820:0,24821:0,24877:0,24878:0,24879:0,24880:0,24881:0,24882:0,24891:0,24892:0,24893:0,25000:0,25231:0,25391:0,25392:0,25393:0,25394:0,25395:0,25828:0,25829:0,25830:0,25831:0,25832:0,25833:0,25834:0,25835:0,25836:0,25837:0,25838:0,25884:0,25932:0,26191:0,26192:0,26193:0,26194:0,26195:0,26237:0,26331:0,26332:0,26391:0,26392:0,26393:0,26432:0,26591:0,26592:0,26632:0,26692:0,26701:0,26702:0,26703:0,26704:0,26705:0,26706:0,26707:0,26708:0,26709:0,26710:0,26711:0,26712:0,26713:0,26714:0,26715:0,26716:0,26717:0,26718:0,26719:0,26720:0,26721:0,26722:0,26729:3,26730:3,26731:3,26732:3,26733:3,26734:3,26735:3,26736:3,26737:3,26738:3,26739:3,26740:3,26741:3,26742:3,26743:3,26744:3,26745:3,26746:3,26747:3,26748:3,26749:3,26750:3,26751:3,26752:3,26753:3,26754:3,26755:3,26756:3,26757:3,26758:3,26759:3,26760:3,26761:3,26762:3,26763:3,26764:3,26765:3,26766:3,26767:3,26768:3,26769:3,26770:3,26771:3,26772:3,26773:3,26774:3,26775:3,26776:3,26777:3,26778:3,26779:3,26780:3,26781:3,26782:3,26783:3,26784:3,26785:3,26786:3,26787:3,26788:3,26789:3,26790:3,26791:3,26792:3,26793:3,26794:3,26795:3,26796:3,26797:3,26798:3,26799:3,26801:3,26802:3,26803:3,26811:3,26812:3,26813:3,26901:0,26902:0,26903:0,26904:0,26905:0,26906:0,26907:0,26908:0,26909:0,26910:0,26911:0,26912:0,26913:0,26914:0,26915:0,26916:0,26917:0,26918:0,26919:0,26920:0,26921:0,26922:0,26923:0,26929:0,26930:0,26931:0,26932:0,26933:0,26934:0,26935:0,26936:0,26937:0,26938:0,26939:0,26940:0,26941:0,26942:0,26943:0,26944:0,26945:0,26946:0,26948:0,26949:0,26950:0,26951:0,26952:0,26953:0,26954:0,26955:0,26956:0,26957:0,26958:0,26959:0,26960:0,26961:0,26962:0,26963:0,26964:0,26965:0,26966:0,26967:0,26968:0,26969:0,26970:0,26971:0,26972:0,26973:0,26974:0,26975:0,26976:0,26977:0,26978:0,26979:0,26980:0,26981:0,26982:0,26983:0,26984:0,26985:0,26986:0,26987:0,26988:0,26989:0,26990:0,26991:0,26992:0,26993:0,26994:0,26995:0,26996:0,26997:0,26998:0,27037:0,27038:0,27039:0,27040:0,27120:0,27200:0,27205:0,27206:0,27207:0,27208:0,27209:0,27210:0,27211:0,27212:0,27213:0,27214:0,27215:0,27216:0,27217:0,27218:0,27219:0,27220:0,27221:0,27222:0,27223:0,27224:0,27225:0,27226:0,27227:0,27228:0,27229:0,27230:0,27231:0,27232:0,27258:0,27259:0,27260:0,27291:8,27292:8,27391:0,27392:0,27393:0,27394:0,27395:0,27396:0,27397:0,27398:0,27429:0,27492:0,27500:0,27561:0,27562:0,27563:0,27564:0,27571:0,27572:0,27573:0,27574:0,27581:0,27582:0,27583:0,27584:0,27591:0,27592:0,27593:0,27594:0,27700:0,28191:0,28192:0,28193:0,28232:0,28348:0,28349:0,28350:0,28351:0,28352:0,28353:0,28354:0,28355:0,28356:0,28357:0,28358:0,28402:0,28403:0,28404:0,28405:0,28406:0,28407:0,28408:0,28409:0,28410:0,28411:0,28412:0,28413:0,28414:0,28415:0,28416:0,28417:0,28418:0,28419:0,28420:0,28421:0,28422:0,28423:0,28424:0,28425:0,28426:0,28427:0,28428:0,28429:0,28430:0,28431:0,28432:0,28462:0,28463:0,28464:0,28465:0,28466:0,28467:0,28468:0,28469:0,28470:0,28471:0,28472:0,28473:0,28474:0,28475:0,28476:0,28477:0,28478:0,28479:0,28480:0,28481:0,28482:0,28483:0,28484:0,28485:0,28486:0,28487:0,28488:0,28489:0,28490:0,28491:0,28492:0,28600:0,28991:0,28992:0,29100:0,29101:0,29118:0,29119:0,29120:0,29121:0,29122:0,29168:0,29169:0,29170:0,29171:0,29172:0,29177:0,29178:0,29179:0,29180:0,29181:0,29182:0,29183:0,29184:0,29185:0,29187:0,29188:0,29189:0,29190:0,29191:0,29192:0,29193:0,29194:0,29195:0,29220:0,29221:0,29333:0,29635:0,29636:0,29738:0,29739:0,29849:0,29850:0,29871:9,29872:10,29873:0,29900:0,29901:0,29902:0,29903:0,30161:0,30162:0,30163:0,30164:0,30165:0,30166:0,30167:0,30168:0,30169:0,30170:0,30171:0,30172:0,30173:0,30174:0,30175:0,30176:0,30177:0,30178:0,30179:0,30200:1,30339:0,30340:0,30491:0,30492:0,30493:0,30494:0,30591:0,30592:0,30729:0,30730:0,30731:0,30732:0,30791:0,30792:0,30800:0,31028:0,31121:0,31154:0,31170:0,31171:0,31251:0,31252:0,31253:0,31254:0,31255:0,31256:0,31257:0,31258:0,31259:0,31265:0,31266:0,31267:0,31268:0,31275:0,31276:0,31277:0,31278:0,31279:0,31281:0,31282:0,31283:0,31284:0,31285:0,31286:0,31287:0,31288:0,31289:0,31290:0,31291:0,31292:0,31293:0,31294:0,31295:0,31296:0,31297:0,31370:0,31461:0,31462:0,31463:0,31464:0,31465:0,31466:0,31467:0,31468:0,31469:0,31491:0,31492:0,31493:0,31494:0,31495:0,31528:0,31529:0,31600:0,31700:0,31838:0,31839:0,31901:0,31917:0,31918:0,31919:0,31920:0,31921:0,31922:0,31971:0,31972:0,31973:0,31974:0,31975:0,31976:0,31977:0,31978:0,31979:0,31980:0,31981:0,31982:0,31983:0,31984:0,31985:0,31986:0,31987:0,31988:0,31989:0,31990:0,31991:0,31992:0,31993:0,31994:0,31995:0,31996:0,31997:0,31998:0,31999:0,32000:0,32001:3,32002:3,32003:3,32005:3,32006:3,32007:3,32008:3,32009:3,32010:3,32011:3,32012:3,32013:3,32014:3,32015:3,32016:3,32017:3,32018:3,32019:3,32020:3,32021:3,32022:3,32023:3,32024:3,32025:3,32026:3,32027:3,32028:3,32029:3,32030:3,32031:3,32033:3,32034:3,32035:3,32036:3,32037:3,32038:3,32039:3,32040:3,32041:3,32042:3,32043:3,32044:3,32045:3,32046:3,32047:3,32048:3,32049:3,32050:3,32051:3,32052:3,32053:3,32054:3,32055:3,32056:3,32057:3,32058:3,32059:3,32060:3,32061:0,32062:0,32064:3,32065:3,32066:3,32067:3,32074:3,32075:3,32076:3,32077:3,32081:0,32082:0,32083:0,32084:0,32085:0,32086:0,32098:0,32099:3,32100:0,32104:0,32107:0,32108:0,32109:0,32110:0,32111:0,32112:0,32113:0,32114:0,32115:0,32116:0,32117:0,32118:0,32119:0,32120:0,32121:0,32122:0,32123:0,32124:0,32125:0,32126:0,32127:0,32128:0,32129:0,32130:0,32133:0,32134:0,32135:0,32136:0,32137:0,32138:0,32139:0,32140:0,32141:0,32142:0,32143:0,32144:0,32145:0,32146:0,32147:0,32148:0,32149:0,32150:0,32151:0,32152:0,32153:0,32154:0,32155:0,32156:0,32157:0,32158:0,32161:0,32164:3,32165:3,32166:3,32167:3,32180:0,32181:0,32182:0,32183:0,32184:0,32185:0,32186:0,32187:0,32188:0,32189:0,32190:0,32191:0,32192:0,32193:0,32194:0,32195:0,32196:0,32197:0,32198:0,32199:0,32201:0,32202:0,32203:0,32204:0,32205:0,32206:0,32207:0,32208:0,32209:0,32210:0,32211:0,32212:0,32213:0,32214:0,32215:0,32216:0,32217:0,32218:0,32219:0,32220:0,32221:0,32222:0,32223:0,32224:0,32225:0,32226:0,32227:0,32228:0,32229:0,32230:0,32231:0,32232:0,32233:0,32234:0,32235:0,32236:0,32237:0,32238:0,32239:0,32240:0,32241:0,32242:0,32243:0,32244:0,32245:0,32246:0,32247:0,32248:0,32249:0,32250:0,32251:0,32252:0,32253:0,32254:0,32255:0,32256:0,32257:0,32258:0,32259:0,32260:0,32301:0,32302:0,32303:0,32304:0,32305:0,32306:0,32307:0,32308:0,32309:0,32310:0,32311:0,32312:0,32313:0,32314:0,32315:0,32316:0,32317:0,32318:0,32319:0,32320:0,32321:0,32322:0,32323:0,32324:0,32325:0,32326:0,32327:0,32328:0,32329:0,32330:0,32331:0,32332:0,32333:0,32334:0,32335:0,32336:0,32337:0,32338:0,32339:0,32340:0,32341:0,32342:0,32343:0,32344:0,32345:0,32346:0,32347:0,32348:0,32349:0,32350:0,32351:0,32352:0,32353:0,32354:0,32355:0,32356:0,32357:0,32358:0,32359:0,32360:0,32601:0,32602:0,32603:0,32604:0,32605:0,32606:0,32607:0,32608:0,32609:0,32610:0,32611:0,32612:0,32613:0,32614:0,32615:0,32616:0,32617:0,32618:0,32619:0,32620:0,32621:0,32622:0,32623:0,32624:0,32625:0,32626:0,32627:0,32628:0,32629:0,32630:0,32631:0,32632:0,32633:0,32634:0,32635:0,32636:0,32637:0,32638:0,32639:0,32640:0,32641:0,32642:0,32643:0,32644:0,32645:0,32646:0,32647:0,32648:0,32649:0,32650:0,32651:0,32652:0,32653:0,32654:0,32655:0,32656:0,32657:0,32658:0,32659:0,32660:0,32661:0,32662:0,32664:3,32665:3,32666:3,32667:3,32701:0,32702:0,32703:0,32704:0,32705:0,32706:0,32707:0,32708:0,32709:0,32710:0,32711:0,32712:0,32713:0,32714:0,32715:0,32716:0,32717:0,32718:0,32719:0,32720:0,32721:0,32722:0,32723:0,32724:0,32725:0,32726:0,32727:0,32728:0,32729:0,32730:0,32731:0,32732:0,32733:0,32734:0,32735:0,32736:0,32737:0,32738:0,32739:0,32740:0,32741:0,32742:0,32743:0,32744:0,32745:0,32746:0,32747:0,32748:0,32749:0,32750:0,32751:0,32752:0,32753:0,32754:0,32755:0,32756:0,32757:0,32758:0,32759:0,32760:0,32761:0,32766:0,53001:0,53002:0,53003:0,53004:0,53008:0,53009:0,53010:0,53011:0,53012:0,53013:0,53014:0,53015:0,53016:0,53017:0,53018:0,53019:0,53021:0,53022:0,53023:0,53024:0,53025:0,53026:0,53027:0,53028:0,53029:0,53030:0,53031:0,53032:0,53034:0,53042:0,53043:0,53044:0,53045:0,53046:0,53048:0,53049:0,54001:0,54002:0,54003:0,54004:0,54008:0,54009:0,54010:0,54011:0,54012:0,54013:0,54014:0,54015:0,54016:0,54017:0,54018:0,54019:0,54021:0,54022:0,54023:0,54024:0,54025:0,54026:0,54027:0,54028:0,54029:0,54030:0,54031:0,54032:0,54034:0,54042:0,54043:0,54044:0,54045:0,54046:0,54048:0,54049:0,54050:0,54051:0,54052:0,54053:0,65061:3,65062:3,65161:0,65163:0,102001:0,102002:0,102003:0,102004:0,102005:0,102006:0,102007:0,102008:0,102009:0,102010:0,102011:0,102012:0,102013:0,102014:0,102015:0,102016:0,102017:0,102018:0,102019:0,102020:0,102021:0,102022:0,102023:0,102024:0,102025:0,102026:0,102027:0,102028:0,102029:0,102030:0,102031:0,102032:0,102033:0,102034:0,102035:0,102036:0,102037:0,102038:0,102039:0,102060:0,102061:0,102062:0,102063:0,102064:11,102065:0,102066:0,102067:0,102068:12,102069:13,102070:0,102071:0,102072:0,102073:0,102074:0,102075:0,102076:0,102077:0,102078:0,102079:0,102090:0,102091:0,102092:0,102093:0,102094:0,102095:0,102096:0,102097:0,102098:0,102099:0,102100:0,102101:0,102102:0,102103:0,102104:0,102105:0,102106:0,102107:0,102108:0,102109:0,102110:0,102111:0,102112:0,102113:0,102114:0,102115:0,102116:0,102117:0,102118:3,102119:4,102120:3,102121:3,102122:0,102123:0,102124:0,102125:0,102126:0,102127:0,102128:0,102129:0,102130:0,102131:0,102132:0,102133:0,102134:0,102135:0,102136:0,102137:0,102138:0,102139:0,102140:0,102141:0,102142:0,102143:0,102144:0,102145:0,102146:0,102147:0,102148:0,102149:0,102150:0,102151:0,102152:0,102153:0,102154:0,102155:0,102156:0,102157:0,102158:0,102159:0,102160:0,102161:0,102162:0,102163:0,102164:0,102165:0,102166:0,102167:0,102168:0,102169:0,102170:0,102171:0,102172:0,102173:0,102174:0,102175:0,102176:0,102177:0,102178:0,102179:0,102180:0,102181:0,102182:0,102183:0,102184:0,102185:0,102186:0,102187:0,102188:0,102189:0,102190:0,102191:0,102192:0,102193:0,102194:0,102195:0,102196:0,102197:0,102198:0,102199:0,102200:0,102201:0,102202:0,102203:0,102205:0,102206:0,102207:0,102208:0,102209:0,102210:0,102211:0,102218:0,102219:3,102220:3,102221:0,102222:0,102223:0,102224:0,102225:0,102226:0,102227:0,102228:0,102229:0,102230:0,102231:0,102232:0,102233:0,102234:0,102235:0,102236:0,102237:0,102238:0,102239:0,102240:0,102241:0,102242:0,102243:0,102244:0,102245:0,102246:0,102248:0,102249:0,102250:0,102251:0,102252:0,102253:0,102254:0,102255:0,102256:0,102257:0,102258:0,102259:0,102260:0,102261:0,102262:0,102263:0,102264:0,102265:0,102266:0,102267:0,102268:0,102269:0,102270:0,102271:0,102272:0,102273:0,102274:0,102275:0,102276:0,102277:0,102278:0,102279:0,102280:0,102281:0,102282:0,102283:0,102284:0,102285:0,102286:0,102287:0,102288:0,102289:0,102290:0,102291:0,102292:0,102293:0,102294:0,102295:0,102296:0,102297:0,102298:0,102300:0,102304:0,102307:0,102308:0,102309:0,102310:0,102311:0,102312:0,102313:0,102314:0,102315:0,102316:0,102317:0,102318:0,102320:0,102321:0,102322:0,102323:0,102324:0,102325:0,102326:0,102327:0,102330:0,102334:0,102335:0,102336:0,102337:0,102338:0,102339:0,102340:0,102341:0,102342:0,102343:0,102344:0,102345:0,102346:0,102347:0,102348:0,102349:0,102350:0,102351:0,102352:0,102353:0,102354:0,102355:0,102356:0,102357:0,102358:0,102361:0,102363:0,102421:0,102422:0,102423:0,102424:0,102425:0,102426:0,102427:0,102428:0,102429:0,102430:0,102431:0,102432:0,102433:0,102434:0,102435:0,102436:0,102437:0,102438:0,102440:0,102441:0,102442:0,102443:0,102444:0,102461:3,102462:3,102463:3,102464:3,102465:3,102466:3,102467:3,102468:3,102469:0,102491:0,102492:0,102570:0,102571:0,102572:0,102573:0,102574:0,102575:0,102576:0,102577:0,102578:0,102579:0,102580:0,102581:0,102582:0,102583:0,102584:0,102591:0,102592:0,102601:0,102602:0,102603:0,102604:3,102605:0,102606:0,102607:0,102608:0,102609:0,102629:3,102630:3,102631:3,102632:3,102633:3,102634:3,102635:3,102636:3,102637:3,102638:3,102639:3,102640:3,102641:3,102642:3,102643:3,102644:3,102645:3,102646:3,102648:3,102649:3,102650:3,102651:3,102652:3,102653:3,102654:3,102655:3,102656:3,102657:3,102658:3,102659:3,102660:3,102661:3,102662:3,102663:3,102664:3,102665:3,102666:3,102667:3,102668:3,102669:3,102670:3,102671:3,102672:3,102673:3,102674:3,102675:3,102676:3,102677:3,102678:3,102679:3,102680:3,102681:3,102682:3,102683:3,102684:3,102685:3,102686:3,102687:3,102688:3,102689:3,102690:3,102691:3,102692:3,102693:3,102694:3,102695:3,102696:3,102697:3,102698:3,102700:3,102704:3,102707:3,102708:3,102709:3,102710:3,102711:3,102712:3,102713:3,102714:3,102715:3,102716:3,102717:3,102718:3,102719:3,102720:3,102721:3,102722:3,102723:3,102724:3,102725:3,102726:3,102727:3,102728:3,102729:3,102730:3,102733:3,102734:3,102735:3,102736:3,102737:3,102738:3,102739:3,102740:3,102741:3,102742:3,102743:3,102744:3,102745:3,102746:3,102747:3,102748:3,102749:3,102750:3,102751:3,102752:3,102753:3,102754:3,102755:3,102756:3,102757:3,102758:3,102761:3,102763:3,102766:3,103300:0,103301:0,103302:0,103303:0,103304:0,103305:0,103306:0,103307:0,103308:0,103309:0,103310:0,103311:0,103312:0,103313:0,103314:0,103315:0,103316:0,103317:0,103318:0,103319:0,103320:0,103321:0,103322:0,103323:0,103324:0,103325:0,103326:0,103327:0,103328:0,103329:0,103330:0,103331:0,103332:0,103333:0,103334:0,103335:0,103336:0,103337:0,103338:0,103339:0,103340:0,103341:0,103342:0,103343:0,103344:0,103345:0,103346:0,103347:0,103348:0,103349:0,103350:0,103351:0,103352:0,103353:0,103354:0,103355:0,103356:0,103357:0,103358:0,103359:0,103360:0,103361:0,103362:0,103363:0,103364:0,103365:0,103366:0,103367:0,103368:0,103369:0,103370:0,103371:0,103400:3,103401:3,103402:3,103403:3,103404:3,103405:3,103406:3,103407:3,103408:3,103409:3,103410:3,103411:3,103412:3,103413:3,103414:3,103415:3,103416:3,103417:3,103418:3,103419:3,103420:3,103421:3,103422:3,103423:3,103424:3,103425:3,103426:3,103427:3,103428:3,103429:3,103430:3,103431:3,103432:3,103433:3,103434:3,103435:3,103436:3,103437:3,103438:3,103439:3,103440:3,103441:3,103442:3,103443:3,103444:3,103445:3,103446:3,103447:3,103448:3,103449:3,103450:3,103451:3,103452:3,103453:3,103454:3,103455:3,103456:3,103457:3,103458:3,103459:3,103460:3,103461:3,103462:3,103463:3,103464:3,103465:3,103466:3,103467:3,103468:3,103469:3,103470:3,103471:3,103528:0,103529:0,103530:0,103531:0,103532:0,103533:0,103534:0,103535:0,103536:0,103537:0,103538:0,103584:0,103600:0,103601:0,103602:0,103603:0,103604:0,103605:0,103606:0,103607:0,103608:0,103609:0,103610:0,103611:0,103612:0,103613:0,103614:0,103615:0,103616:0,103617:0,103618:0,103619:0,103620:0,103621:0,103622:0,103623:0,103624:0,103625:0,103626:0,103627:0,103628:0,103629:0,103630:0,103631:0,103632:0,103633:0,103634:0,103635:0,103636:0,103637:0,103638:0,103639:0,103640:0,103641:0,103642:0,103643:0,103644:0,103645:0,103646:0,103647:0,103648:0,103649:0,103650:0,103651:0,103652:0,103653:0,103654:0,103655:0,103656:0,103657:0,103658:0,103659:0,103660:0,103661:0,103662:0,103663:0,103664:0,103665:0,103666:0,103667:0,103668:0,103669:0,103670:0,103671:0,103672:0,103673:0,103674:0,103675:0,103676:0,103677:0,103678:0,103679:0,103680:0,103681:0,103682:0,103683:0,103684:0,103685:0,103686:0,103687:0,103688:0,103689:0,103690:0,103691:0,103692:0,103693:0,103700:3,103701:3,103702:3,103703:3,103704:3,103705:3,103706:3,103707:3,103708:3,103709:3,103710:3,103711:3,103712:3,103713:3,103714:3,103715:3,103716:3,103717:3,103718:3,103719:3,103720:3,103721:3,103722:3,103723:3,103724:3,103725:3,103726:3,103727:3,103728:3,103729:3,103730:3,103731:3,103732:3,103733:3,103734:3,103735:3,103736:3,103737:3,103738:3,103739:3,103740:3,103741:3,103742:3,103743:3,103744:3,103745:3,103746:3,103747:3,103748:3,103749:3,103750:3,103751:3,103752:3,103753:3,103754:3,103755:3,103756:3,103757:3,103758:3,103759:3,103760:3,103761:3,103762:3,103763:3,103764:3,103765:3,103766:3,103767:3,103768:3,103769:3,103770:3,103771:3,103772:3,103773:3,103774:3,103775:3,103776:3,103777:3,103778:3,103779:3,103780:3,103781:3,103782:3,103783:3,103784:3,103785:3,103786:3,103787:3,103788:3,103789:3,103790:3,103791:3,103792:3,103793:3,103800:0,103801:0,103802:0,103803:0,103804:0,103805:0,103806:0,103807:0,103808:0,103809:0,103810:0,103811:0,103812:0,103813:0,103814:0,103815:0,103816:0,103817:0,103818:0,103819:0,103820:0,103821:0,103822:0,103823:0,103824:0,103825:0,103826:0,103827:0,103828:0,103829:0,103830:0,103831:0,103832:0,103833:0,103834:0,103835:0,103836:0,103837:0,103838:0,103839:0,103840:0,103841:0,103842:0,103843:0,103844:0,103845:0,103846:0,103847:0,103848:0,103849:0,103850:0,103851:0,103852:0,103853:0,103854:0,103855:0,103856:0,103857:0,103858:0,103859:0,103860:0,103861:0,103862:0,103863:0,103864:0,103865:0,103866:0,103867:0,103868:0,103869:0,103870:0,103871:0,103900:3,103901:3,103902:3,103903:3,103904:3,103905:3,103906:3,103907:3,103908:3,103909:3,103910:3,103911:3,103912:3,103913:3,103914:3,103915:3,103916:3,103917:3,103918:3,103919:3,103920:3,103921:3,103922:3,103923:3,103924:3,103925:3,103926:3,103927:3,103928:3,103929:3,103930:3,103931:3,103932:3,103933:3,103934:3,103935:3,103936:3,103937:3,103938:3,103939:3,103940:3,103941:3,103942:3,103943:3,103944:3,103945:3,103946:3,103947:3,103948:3,103949:3,103950:3,103951:3,103952:3,103953:3,103954:3,103955:3,103956:3,103957:3,103958:3,103959:3,103960:3,103961:3,103962:3,103963:3,103964:3,103965:3,103966:3,103967:3,103968:3,103969:3,103970:3,103971:3};
});

},
'esri/symbol':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!dojo/_base/Color,dojox/gfx/_base,esri/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.symbol");

dojo.require("dojo._base.Color");
dojo.require("dojox.gfx._base");
dojo.require("esri.utils");

dojo.mixin(esri.symbol, {
    toDojoColor: function(clr) {
      return clr && new dojo.Color([clr[0], clr[1], clr[2], clr[3] / 255]);
    },

    toJsonColor: function(clr) {
      return clr && [clr.r, clr.g, clr.b, Math.round(clr.a * 255)];
    },

    fromJson: function(/*Object*/ json) {
      //Convert json representation to appropriate esri.symbol.* object
      var type = json.type,
          symbol = null;
      switch (type.substring(0, "esriXX".length)) {
        case "esriSM":
          symbol = new esri.symbol.SimpleMarkerSymbol(json);
          break;
        case "esriPM":
          symbol = new esri.symbol.PictureMarkerSymbol(json);
          break;
        case "esriTS":
          symbol = new esri.symbol.TextSymbol(json);
          break;
        case "esriSL":
          if (json.cap !== undefined) {
            symbol = new esri.symbol.CartographicLineSymbol(json);
          }
          else {
            symbol = new esri.symbol.SimpleLineSymbol(json);
          }
          break;
        // case "esriCLS":
        //   symbol = new esri.symbol.CartographicLineSymbol(json);
        //   break;
        case "esriSF":
          symbol = new esri.symbol.SimpleFillSymbol(json);
          break;
        case "esriPF":
          symbol = new esri.symbol.PictureFillSymbol(json);
          break;
      }

      return symbol;
    }
  }
);

dojo.declare("esri.symbol.Symbol", null, {
    color: new dojo.Color([0,0,0,1]),
    type: null,
    _stroke: null,
    _fill: null,

    constructor: function(json) {
      if (json && dojo.isObject(json)) {
        dojo.mixin(this, json);
        
        // Check if color is an array. We could just do dojo.isArray
        // but would fail when run from another (child) window
        if (this.color && esri._isDefined(this.color[0])) {
          this.color = esri.symbol.toDojoColor(this.color);
        }
        
        // For some reason, we are not exposing the "type" code
        // as returned by REST. Let's do the translation.  
        var type = this.type;
        if (type && type.indexOf("esri") === 0) {
          this.type = {
            "esriSMS": "simplemarkersymbol",
            "esriPMS": "picturemarkersymbol",
            "esriSLS": "simplelinesymbol",
            "esriCLS": "cartographiclinesymbol",
            "esriSFS": "simplefillsymbol",
            "esriPFS": "picturefillsymbol",
            "esriTS": "textsymbol"
          }[type];
        }
      }
    },

    setColor: function(/*dojo.Color*/ color) {
      this.color = color;
      return this;
    },

    toJson: function() {
      return { color: esri.symbol.toJsonColor(this.color) };
    }
  }
);

//MARKERS
dojo.declare("esri.symbol.MarkerSymbol", esri.symbol.Symbol, {
    constructor: function(/*JSON*/ json) {
      if (json && dojo.isObject(json)) {
        this.size = dojox.gfx.pt2px(this.size);
        this.xoffset = dojox.gfx.pt2px(this.xoffset);
        this.yoffset = dojox.gfx.pt2px(this.yoffset);
      }
    },

    setAngle: function(/*Number*/ angle) {
      this.angle = angle;
      return this;
    },

    setSize: function(/*Number*/ size) {
      this.size = size;
      return this;
    },

    setOffset: function(/*Number*/ x, /*Number*/ y) {
      this.xoffset = x;
      this.yoffset = y;
      return this;
    },

    toJson: function() {
      var size = dojox.gfx.px2pt(this.size);
      size = isNaN(size) ? undefined : size;
      
      var xoff = dojox.gfx.px2pt(this.xoffset);
      xoff = isNaN(xoff) ? undefined : xoff;
      
      var yoff = dojox.gfx.px2pt(this.yoffset);
      yoff = isNaN(yoff) ? undefined : yoff;
      
      return dojo.mixin(
        this.inherited("toJson", arguments), 
        { 
          size: size, 
          angle: this.angle, 
          xoffset: xoff, 
          yoffset: yoff 
        }
      );
    },

    angle: 0,
    xoffset: 0,
    yoffset: 0,
    size: 12
  }
);

/* {
 * style: "esriSMSCircle|esriSMSSquare|esriSMSCross|esriSMSX|esriSMSDiamond",
 * color: [r,g,b,a] (0-255),
 * outline: true|false,
 * outlineColor: { red:0-255, green:0-255, blue: 0-255, transparency: 0-255 },
 * outlineSize: 1-n (in points),
 * size: 0-n (in points),
 * angle: 0-360,
 * xoffset: 0-n (in points),
 * yoffset: 0-n (in points)
 * }
 */
dojo.declare("esri.symbol.SimpleMarkerSymbol", esri.symbol.MarkerSymbol, {
    constructor: function(/*String|JSON*/ json, /*Number*/ size, /*esri.symbol.SimpleLineSymbol*/ outline, /*dojo.Color*/ color) {
      if (json) {
        if (dojo.isString(json)) {
          this.style = json;
          if (size) {
            this.size = size;
          }
          if (outline) {
            this.outline = outline;
          }
          if (color) {
            this.color = color;
          }
        }
        else {
          this.style = esri.valueOf(this._styles, this.style);
          if (json.outline) {
            this.outline = new esri.symbol.SimpleLineSymbol(json.outline);
          }
        }
      }
      else {
        dojo.mixin(this, esri.symbol.defaultSimpleMarkerSymbol);
        this.size = dojox.gfx.pt2px(this.size);
        this.outline = new esri.symbol.SimpleLineSymbol(this.outline);
        this.color = new dojo.Color(this.color);
      }

      if (! this.style) {
        this.style = esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE;
      }
    },
    
    type: "simplemarkersymbol",

    setStyle: function(/*String*/ style) {
      this.style = style;
      return this;
    },

    setOutline: function(/*esri.symbol.SimpleLineSymbol*/ outline) {
      this.outline = outline;
      return this;
    },

    getStroke: function() {
      return this.outline && this.outline.getStroke();
    },

    getFill: function() {
      return this.color;
    },
    
    _setDim: function(targetWidth, targetHeight, spikeSize) {
      this._targetWidth = targetWidth;
      this._targetHeight = targetHeight;
      this._spikeSize = spikeSize;
    },

    toJson: function() {
      var json = dojo.mixin(this.inherited("toJson", arguments), { type:"esriSMS", style:this._styles[this.style] }),
          outline = this.outline;

      if (outline) {
        json.outline = outline.toJson();
      }
      /*else {
        json.outline = false;
      }*/

      return esri._sanitize(json);
    },

    _styles: { circle:"esriSMSCircle", square:"esriSMSSquare", cross:"esriSMSCross", x:"esriSMSX", diamond:"esriSMSDiamond" }
  }
);

dojo.mixin(esri.symbol.SimpleMarkerSymbol, {
  STYLE_CIRCLE: "circle", 
  STYLE_SQUARE: "square", 
  STYLE_CROSS: "cross", 
  STYLE_X: "x", 
  STYLE_DIAMOND: "diamond",
  STYLE_TARGET: "target"
  // TODO
  // STYLE_TARGET and _setDim is an intermediate solution until
  // we can support STYLE_PATH
});

/* {
 * url: "http://...",
 * size: 0-n (in points),
 * angle: 0-360,
 * xoffset: 0-n (in points),
 * yoffset: 0-n (in points)
 * }
 */
dojo.declare("esri.symbol.PictureMarkerSymbol", esri.symbol.MarkerSymbol, {
    constructor: function(/*String|JSON*/ json, /*Number*/ width, /*Number*/ height) {
      if (json) {
        if (dojo.isString(json)) {
          this.url = json;
          if (width) {
            this.width = width;
          }
          if (height) {
            this.height = height;
          }
        }
        else {
          this.width = dojox.gfx.pt2px(json.width);
          this.height = dojox.gfx.pt2px(json.height);

          // see - http://en.wikipedia.org/wiki/Data_Uri
          // also - https://developer.mozilla.org/en/data_URIs
          // "IE 8 does not support data URIs for VML image elements": 
          // http://code.google.com/p/explorercanvas/issues/detail?id=60#c1
          var imageData = json.imageData;
          if ( (!esri.vml /*|| (isIE && isIE >= 8 && imageData.length <= 32768)*/) && imageData ) {
            var temp = this.url;
            this.url = "data:" + (json.contentType || "image") + ";base64," + imageData;
            this.imageData = temp;
          }
          
          // TODO
          // Got to revisit this again
//          if (this.size) {
//            this.width = this.height = this.size;
//          }
        }
      }
      else {
        dojo.mixin(this, esri.symbol.defaultPictureMarkerSymbol);
        this.width = dojox.gfx.pt2px(this.width);
        this.height = dojox.gfx.pt2px(this.height);
      }
    },

    type: "picturemarkersymbol",

    getStroke: function() {
      return null;
    },

    getFill: function() {
      return null;
    },

    setWidth: function(/*Number*/ width) {
      this.width = width;
      return this;
    },

    setHeight: function(/*Number*/ height) {
      this.height = height;
      return this;
    },

    setUrl: function(/*String*/ url) {
      if (url !== this.url) {
        delete this.imageData;
        delete this.contentType;
      }
      this.url = url;
      return this;
    },

    toJson: function() {
      // Swap url and imageData if necessary
      var url = this.url, imageData = this.imageData;
      if (url.indexOf("data:") === 0) {
        var temp = url;
        url = imageData;
        
        var index = temp.indexOf(";base64,") + 8;
        imageData = temp.substr(index);
      }
      url = esri._getAbsoluteUrl(url);
      
      var width = dojox.gfx.px2pt(this.width);
      width = isNaN(width) ? undefined : width;
      
      var height = dojox.gfx.px2pt(this.height);
      height = isNaN(height) ? undefined : height;

      var retVal = esri._sanitize(dojo.mixin(this.inherited("toJson", arguments), { 
        type: "esriPMS", 
        /*style: "esriPMS", */
        url: url, 
        imageData: imageData,
        contentType: this.contentType,
        width: width, 
        height: height
      }));
      
      // http://nil/rest-docs/symbol.html#pms
      delete retVal.color;
      delete retVal.size;
      if (!retVal.imageData) {
        delete retVal.imageData;
      }
      
      return retVal;
    }
  }
);

//LINES
dojo.declare("esri.symbol.LineSymbol", esri.symbol.Symbol, {
    constructor: function(/*JSON*/ json) {
      if (dojo.isObject(json)) {
        this.width = dojox.gfx.pt2px(this.width);
      }
      else {
        this.width = 12;
      }
    },

    setWidth: function(/*Number*/ width) {
      this.width = width;
      return this;
    },

    toJson: function() {
      var width = dojox.gfx.px2pt(this.width);
      width = isNaN(width) ? undefined : width;
      
      return dojo.mixin(
        this.inherited("toJson", arguments),
        { width: width }
      );
    }
  }
);

/* {
 * style: "esriSLSSolid|esriSLSDash|esriSLSDot|esriSLSDashDot|esriSLSDashDotDot|esriSLSNull|esriSLSInsideFrame",
 * color: [r,g,b,a] (0-255),
 * width: 1-n (in points)
 * }
 */
dojo.declare("esri.symbol.SimpleLineSymbol", esri.symbol.LineSymbol, {
    constructor: function(/*String|JSON*/ json, /*dojo.Color*/ color, /*Number*/ width) {
      if (json) {
        if (dojo.isString(json)) {
          this.style = json;
          if (color) {
            this.color = color;
          }
          if (width) {
            this.width = width;
          }
        }
        else {
          this.style = esri.valueOf(this._styles, json.style) || esri.symbol.SimpleLineSymbol.STYLE_SOLID;
        }
      }
      else {
        dojo.mixin(this, esri.symbol.defaultSimpleLineSymbol);
        this.color = new dojo.Color(this.color);
        this.width = dojox.gfx.pt2px(this.width);
      }
    },
    
    type: "simplelinesymbol",

    setStyle: function(/*String*/ style) {
      this.style = style;
      return this;
    },

    getStroke: function() {
      return (this.style === esri.symbol.SimpleLineSymbol.STYLE_NULL || this.width === 0) ? null : { color:this.color, style:this.style, width:this.width };
    },

    getFill: function() {
      return null;
    },

    toJson: function() {
      return esri._sanitize(dojo.mixin(this.inherited("toJson", arguments), { type:"esriSLS", style: this._styles[this.style] }));
    },

    _styles: { solid:"esriSLSSolid", dash:"esriSLSDash", dot:"esriSLSDot", dashdot:"esriSLSDashDot", longdashdotdot:"esriSLSDashDotDot", none:"esriSLSNull", insideframe:"esriSLSInsideFrame" }
  }
);

dojo.mixin(esri.symbol.SimpleLineSymbol, {
  STYLE_SOLID: "solid", STYLE_DASH: "dash", STYLE_DOT: "dot", STYLE_DASHDOT: "dashdot", STYLE_DASHDOTDOT: "longdashdotdot", STYLE_NULL: "none"
});

/* {
 * style: "esriSLSSolid|esriSLSDash|esriSLSDot|esriSLSDashDot|esriSLSDashDotDot|esriSLSNull|esriSLSInsideFrame",
 * color: [r,g,b,a] (0-255),
 * width: 1-n (in points),
 * cap: "esriLCSButt|esriLCSRound|esriLCSSquare",
 * join: "esriLJSMiter|esriLJSRound|esriLJSBevel",
 * miterLimit: 1-n (in points)
 * }
 */
dojo.declare("esri.symbol.CartographicLineSymbol", esri.symbol.SimpleLineSymbol, {
    constructor: function(/*String|JSON*/ json, /*dojo.Color*/ color, /*Number*/ width, /*String*/ cap, /*String*/ join, /*Number*/ miterLimit) {
      if (json) {
        if (dojo.isString(json)) {
          this.style = json;
          if (color) {
            this.color = color;
          }
          if (width !== undefined) {
            this.width = width;
          }
          if (cap) {
            this.cap = cap;
          }
          if (join) {
            this.join = join;
          }
          if (miterLimit !== undefined) {
            this.miterLimit = miterLimit;
          }
        }
        else {
          this.cap = esri.valueOf(this._caps, json.cap);
          this.join = esri.valueOf(this._joins, json.join);
          this.width = dojox.gfx.pt2px(json.width);
          this.miterLimit = dojox.gfx.pt2px(json.miterLimit);
        }
      }
      else {
        dojo.mixin(this, esri.symbol.defaultCartographicLineSymbol);
        this.color = new dojo.Color(this.color);
        this.width = dojox.gfx.pt2px(this.width);
        this.miterLimit = dojox.gfx.pt2px(this.miterLimit);
      }
    },

    type: "cartographiclinesymbol",

    setCap: function(/*String*/ cap) {
      this.cap = cap;
      return this;
    },

    setJoin: function(/*String*/ join) {
      this.join = join;
      return this;
    },

    setMiterLimit: function(/*Number*/ miterLimit) {
      this.miterLimit = miterLimit;
      return this;
    },

    getStroke: function() {
      return dojo.mixin(this.inherited("getStroke", arguments), { cap:this.cap, join:(this.join === esri.symbol.CartographicLineSymbol.JOIN_MITER ? this.miterLimit : this.join) });
    },

    getFill: function() {
      return null;
    },

    toJson: function() {
      var miter = dojox.gfx.px2pt(this.miterLimit);
      miter = isNaN(miter) ? undefined : miter;
      
      return esri._sanitize(dojo.mixin(
        this.inherited("toJson", arguments),
        { 
          type:"esriCLS", 
          cap:this._caps[this.cap], 
          join:this._joins[this.join], 
          miterLimit: miter 
        }
      ));
    },

    _caps: { butt: "esriLCSButt", round: "esriLCSRound", square: "esriLCSSquare" },
    _joins: { miter: "esriLJSMiter", round: "esriLJSRound", bevel: "esriLJSBevel" }
  }
);

//BUG: STYLE_NULL doesn't do anything. It still draws it
dojo.mixin(esri.symbol.CartographicLineSymbol, {
  STYLE_SOLID: "solid", STYLE_DASH: "dash", STYLE_DOT: "dot", STYLE_DASHDOT: "dashdot", STYLE_DASHDOTDOT: "longdashdotdot", STYLE_NULL: "none", STYLE_INSIDE_FRAME: "insideframe",
  CAP_BUTT: "butt", CAP_ROUND: "round", CAP_SQUARE: "square",
  JOIN_MITER: "miter", JOIN_ROUND: "round", JOIN_BEVEL: "bevel"
});

//FILLS
dojo.declare("esri.symbol.FillSymbol", esri.symbol.Symbol, {
    constructor: function(/*JSON*/ json) {
      if (json && dojo.isObject(json) && json.outline) {
        this.outline = new esri.symbol.SimpleLineSymbol(json.outline);
      }
    },

    setOutline: function(outline) {
      this.outline = outline;
      return this;
    },

    toJson: function() {
      var json = this.inherited("toJson", arguments);
      if (this.outline) {
        json.outline = this.outline.toJson();
      }
      return json;
    }
  }
);

/* {
 * style: "esriSFSSolid|esriSFSNull|esriSFSHorizontal|esriSFSVertical|esriSFSForwardDiagonal|esriSFSBackwardDiagonal|esriSFSCross|esriSFSDiagonalCross",
 * color: [r,g,b,a] (0-255),
 * outline: JSON representation for SimpleLineSymbol
 * }
 */
dojo.declare("esri.symbol.SimpleFillSymbol", esri.symbol.FillSymbol, {
    constructor: function(/*String|JSON*/ json, /*SimpleLineSymbol*/ outline, /*dojo.Color*/ color) {
      if (json) {
        if (dojo.isString(json)) {
          this.style = json;
          if (outline !== undefined) {
            this.outline = outline;
          }
          if (color !== undefined) {
            this.color = color;
          }
        }
        else {
          this.style = esri.valueOf(this._styles, json.style);
        }
      }
      else {
        dojo.mixin(this, esri.symbol.defaultSimpleFillSymbol);
        this.outline = new esri.symbol.SimpleLineSymbol(this.outline);
        this.color = new dojo.Color(this.color);
      }

      var style = this.style;
      if (style !== "solid" && style !== "none") {
        this._src = dojo.moduleUrl("esri") + "../../images/symbol/sfs/" + style + ".png";
      }
    },

    type: "simplefillsymbol",

    setStyle: function(/*String*/ style) {
      this.style = style;
      return this;
    },

    getStroke: function() {
      return this.outline && this.outline.getStroke();
    },

    getFill: function() {
      var style = this.style;
      if (style === esri.symbol.SimpleFillSymbol.STYLE_NULL) {
        return null;
      }
      else if (style === esri.symbol.SimpleFillSymbol.STYLE_SOLID) {
        return this.color;
      }
      else {
        return dojo.mixin(dojo.mixin({}, dojox.gfx.defaultPattern), { src: this._src, width:10, height:10 });
      }
    },

    toJson: function() {
      return esri._sanitize(dojo.mixin(this.inherited("toJson", arguments), { type:"esriSFS", style:this._styles[this.style] }));
    },

    _styles: { solid: "esriSFSSolid", none: "esriSFSNull", horizontal: "esriSFSHorizontal", vertical: "esriSFSVertical", forwarddiagonal: "esriSFSForwardDiagonal", backwarddiagonal: "esriSFSBackwardDiagonal", cross: "esriSFSCross", diagonalcross: "esriSFSDiagonalCross" }
  }
);

//BUG INCORRECT NAMES: STYLE_FORWARDDIAGONAL, STYLE_BACKWARDDIAGONAL, STYLE_DIAGONALCROSS
dojo.mixin(esri.symbol.SimpleFillSymbol, {
  STYLE_SOLID: "solid", STYLE_NULL: "none", STYLE_HORIZONTAL: "horizontal", STYLE_VERTICAL: "vertical", STYLE_FORWARD_DIAGONAL: "forwarddiagonal", STYLE_BACKWARD_DIAGONAL: "backwarddiagonal", STYLE_CROSS: "cross", STYLE_DIAGONAL_CROSS: "diagonalcross",
  STYLE_FORWARDDIAGONAL: "forwarddiagonal", STYLE_BACKWARDDIAGONAL: "backwarddiagonal", STYLE_DIAGONALCROSS: "diagonalcross"
});

/* {
 * pictureUri: String,
 * xoffset: 0-n (in points),
 * yoffset: 0-n (in points),
 * xscale: 0-n,
 * yscale: 0-n,
 * color: [r,g,b,a] (0-255),
 * outline: JSON representation for SimpleLineSymbol,
 * angle: 0-n,
 * backgroundColor: [r,g,b,a] (0-255),
 * bitmapTransparencyColor: [r,g,b,a] (0-255),
 * xseparation: 0-n,
 * yseparation: 0-n
 * }
 */
dojo.declare("esri.symbol.PictureFillSymbol", esri.symbol.FillSymbol, {
    constructor: function(/*String|JSON*/ json, /*SimpleLineSymbol*/ outline, /*Number*/ width, /*Number*/ height) {
      if (json) {
        if (dojo.isString(json)) {
          this.url = json;
          if (outline !== undefined) {
            this.outline = outline;
          }
          if (width !== undefined) {
            this.width = width;
          }
          if (height !== undefined) {
            this.height = height;
          }
        }
        else {
          this.xoffset = dojox.gfx.pt2px(json.xoffset);
          this.yoffset = dojox.gfx.pt2px(json.yoffset);
          this.width = dojox.gfx.pt2px(json.width);
          this.height = dojox.gfx.pt2px(json.height);

          // see - http://en.wikipedia.org/wiki/Data_Uri
          // also - https://developer.mozilla.org/en/data_URIs
          // also - PictureMarkerSymbol
          // "IE 8 does not support data URIs for VML image elements": 
          // http://code.google.com/p/explorercanvas/issues/detail?id=60#c1
          var imageData = json.imageData;
          if ( (!esri.vml /*|| (isIE && isIE >= 8 && imageData.length <= 32768)*/) && imageData ) {
            var temp = this.url;
            this.url = "data:" + (json.contentType || "image") + ";base64," + imageData;
            this.imageData = temp;
          }
          
        }
      }
      else {
        dojo.mixin(this, esri.symbol.defaultPictureFillSymbol);
        this.width = dojox.gfx.pt2px(this.width);
        this.height = dojox.gfx.pt2px(this.height);
      }
    },

    type: "picturefillsymbol",
    xscale: 1,
    yscale: 1,
    xoffset: 0,
    yoffset: 0,

    setWidth: function(/*Number*/ width) {
      this.width = width;
      return this;
    },

    setHeight: function(/*Number*/ height) {
      this.height = height;
      return this;
    },

    setOffset: function(/*Number*/ x, /*Number*/ y) {
      this.xoffset = x;
      this.yoffset = y;
      return this;
    },

    setUrl: function(/*String*/ url) {
      if (url !== this.url) {
        delete this.imageData;
        delete this.contentType;
      }
      this.url = url;
      return this;
    },

    setXScale: function(/*Number*/ scale) {
      this.xscale = scale;
      return this;
    },

    setYScale: function(/*Number*/ scale) {
      this.yscale = scale;
      return this;
    },

    getStroke: function() {
      return this.outline && this.outline.getStroke();
    },

    getFill: function() {
      return dojo.mixin({}, dojox.gfx.defaultPattern,
                        { src:this.url, width:(this.width * this.xscale), height:(this.height * this.yscale), x:this.xoffset, y:this.yoffset });
    },

    toJson: function() {
      // Swap url and imageData if necessary
      var url = this.url, imageData = this.imageData;
      if (url.indexOf("data:") === 0) {
        var temp = url;
        url = imageData;
        
        var index = temp.indexOf(";base64,") + 8;
        imageData = temp.substr(index);
      }
      url = esri._getAbsoluteUrl(url);
      
      var width = dojox.gfx.px2pt(this.width);
      width = isNaN(width) ? undefined : width;
      
      var height = dojox.gfx.px2pt(this.height);
      height = isNaN(height) ? undefined : height;
      
      var xoff = dojox.gfx.px2pt(this.xoffset);
      xoff = isNaN(xoff) ? undefined : xoff;
      
      var yoff = dojox.gfx.px2pt(this.yoffset);
      yoff = isNaN(yoff) ? undefined : yoff;

      var json = esri._sanitize(dojo.mixin(
        this.inherited("toJson", arguments),
        { 
          type: "esriPFS", 
          /*style: "esriPFS", */
          url: url, 
          imageData: imageData,
          contentType: this.contentType,
          width: width, 
          height: height, 
          xoffset: xoff, 
          yoffset: yoff, 
          xscale: this.xscale, 
          yscale: this.yscale 
        }
      ));
      if (!json.imageData) {
        delete json.imageData;
      }
      return json;
    }
  }
);

dojo.declare("esri.symbol.Font", null, {
    constructor: function(/*String|JSON*/ json, /*String*/ style, /*String*/ variant, /*String|Number*/ weight, /*String*/ family) {
      if (json) {
        if (dojo.isObject(json)) {
          dojo.mixin(this, json);
        }
        else {
          this.size = json;
          if (style !== undefined) {
            this.style = style;
          }
          if (variant !== undefined) {
            this.variant = variant;
          }
          if (weight !== undefined) {
            this.weight = weight;
          }
          if (family !== undefined) {
            this.family = family;
          }
        }
      }
      else {
        dojo.mixin(this, dojox.gfx.defaultFont);
      }
    },

    setSize: function(size) {
      this.size = size;
      return this;
    },

    setStyle: function(style) {
      this.style = style;
      return this;
    },

    setVariant: function(variant) {
      this.variant = variant;
      return this;
    },

    setWeight: function(weight) {
      this.weight = weight;
      return this;
    },

    setFamily: function(family) {
      this.family = family;
      return this;
    },

    toJson: function() {
      return esri._sanitize({ 
        size:this.size, 
        style:this.style, 
        variant:this.variant,
        decoration: this.decoration, 
        weight:this.weight, 
        family:this.family 
      });
    }
  }
);

dojo.mixin(esri.symbol.Font, {
  STYLE_NORMAL: "normal", STYLE_ITALIC: "italic", STYLE_OBLIQUE: "oblique",
  VARIANT_NORMAL: "normal", VARIANT_SMALLCAPS: "small-caps",
  WEIGHT_NORMAL:"normal", WEIGHT_BOLD: "bold", WEIGHT_BOLDER: "bolder", WEIGHT_LIGHTER: "lighter"
});

dojo.declare("esri.symbol.TextSymbol", esri.symbol.Symbol, {
    constructor: function(/*String|JSON*/ json, /*esri.symbol.Font*/ font, /*dojo.Color*/ color) {
      dojo.mixin(this, esri.symbol.defaultTextSymbol);
      this.font = new esri.symbol.Font(this.font);
      this.color = new dojo.Color(this.color);

      if (json) {
        if (dojo.isObject(json)) {
          dojo.mixin(this, json);
          
          // Check if color is an array. We could just do dojo.isArray
          // but would fail when run from another (child) window
          if (this.color && esri._isDefined(this.color[0])) {
            this.color = esri.symbol.toDojoColor(this.color);
          }
          
          // TODO
          // I don't really want to override type here.
          // Ideally, I'd want to remove the two preceding lines
          // as they are already done in Symbol ctor. But doing so messes up
          // the TextSymbol defaults set earlier in this method.
          // Overall, the way defaults and later overrides are handled in
          // the esri.symbol package feels out of place. I'd like to rewrite
          // it but not at v1.5
          this.type = "textsymbol";
          this.font = new esri.symbol.Font(this.font);
          this.xoffset = dojox.gfx.pt2px(this.xoffset);
          this.yoffset = dojox.gfx.pt2px(this.yoffset);
        }
        else {
          this.text = json;
          if (font) {
            this.font = font;
          }
          if (color) {
            this.color = color;
          }
        }
      }
    },

    angle: 0,
    xoffset: 0,
    yoffset: 0,
    
    setFont: function(/*esri.symbol.Font*/ font) {
      this.font = font;
      return this;
    },
    
    setAngle: function(/*Number*/ angle) {
      this.angle = angle;
      return this;
    },

    setOffset: function(/*Number*/ x, /*Number*/ y) {
      this.xoffset = x;
      this.yoffset = y;
      return this;
    },

    setAlign: function(/*String*/ align) {
      this.align = align;
      return this;
    },

    setDecoration: function(/*String*/ decoration) {
      // TODO
      // We need to move this into "Font"
      // See: http://nil/rest-docs/symbol.html
      this.decoration = decoration;
      return this;
    },

    setRotated: function(/*boolean*/ rotated) {
      this.rotated = rotated;
      return this;
    },

    setKerning: function(/*boolean*/ kerning) {
      this.kerning = kerning;
      return this;
    },

    setText: function(/*String*/ text) {
      this.text = text;
      return this;
    },

    getStroke: function() {
      return null;
    },

    getFill: function() {
      return this.color;
    },

    toJson: function() {
      var xoff = dojox.gfx.px2pt(this.xoffset);
      xoff = isNaN(xoff) ? undefined : xoff;
      
      var yoff = dojox.gfx.px2pt(this.yoffset);
      yoff = isNaN(yoff) ? undefined : yoff;
      
      // NOTE
      // We don't support backgroundColor, borderLineColor, verticalAlignment
      // and horizontalAlignment, but we need to serialize them back to not
      // mess with other environments reading this serialized json.
      // See: http://nil/rest-docs/symbol.html
      
      return esri._sanitize(dojo.mixin(
        this.inherited("toJson", arguments),
        { 
          type:"esriTS", /*style:"esriTS",*/ 
          backgroundColor: this.backgroundColor,
          borderLineColor: this.borderLineColor,
          verticalAlignment: this.verticalAlignment,
          horizontalAlignment: this.horizontalAlignment,
          rightToLeft: this.rightToLeft,
          width: this.width, // Not in REST model but Explorer online has it. Let's serialize it out.
          angle: this.angle, 
          xoffset: xoff, 
          yoffset: yoff, 
          text:this.text, 
          align:this.align, 
          decoration:this.decoration, 
          rotated:this.rotated, 
          kerning:this.kerning, 
          font:this.font.toJson() 
        }
      ));
    }
  }
);

dojo.mixin(esri.symbol.TextSymbol, {
  ALIGN_START: "start", ALIGN_MIDDLE: "middle", ALIGN_END: "end",
  DECORATION_NONE: "none", DECORATION_UNDERLINE: "underline", DECORATION_OVERLINE: "overline", DECORATION_LINETHROUGH: "line-through"
});

dojo.mixin(esri.symbol, {
    defaultSimpleLineSymbol: { color:[0,0,0,1], style:esri.symbol.SimpleLineSymbol.STYLE_SOLID, width:1 },
    defaultSimpleMarkerSymbol: { style:esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, color:[255,255,255,0.25], outline:esri.symbol.defaultSimpleLineSymbol, size:12, angle:0, xoffset:0, yoffset:0 },
    defaultPictureMarkerSymbol: { url:"", width:12, height:12, angle:0, xoffset:0, yoffset:0 },
    defaultCartographicLineSymbol: { color:[0,0,0,1], style:esri.symbol.CartographicLineSymbol.STYLE_SOLID, width:1, cap:esri.symbol.CartographicLineSymbol.CAP_BUTT, join:esri.symbol.CartographicLineSymbol.JOIN_MITER, miterLimit:10 },
    defaultSimpleFillSymbol: { style:esri.symbol.SimpleFillSymbol.STYLE_SOLID, color:[0,0,0,0.25], outline:esri.symbol.defaultSimpleLineSymbol },
    defaultPictureFillSymbol: { xoffset:0, yoffset:0, width:12, height:12 },
    defaultTextSymbol: { color:[0,0,0,1], font:dojox.gfx.defaultFont, angle:0, xoffset:0, yoffset:0 },
    
    getShapeDescriptors: function(symbol) {
      var shape, fill, stroke;
      
      // shape
      var type = symbol.type;
      switch(type) {
        case "simplemarkersymbol":
          var style = symbol.style, SMS = esri.symbol.SimpleMarkerSymbol;
          var size = symbol.size || dojox.gfx.pt2px(esri.symbol.defaultSimpleMarkerSymbol.size), cx = 0, cy = 0, half = size / 2;
          var left = cx - half, right = cx + half, top = cy - half, bottom = cy + half;
          
          switch(style) {
            case SMS.STYLE_CIRCLE:
              shape = { type: "circle", cx: cx, cy: cy, r: half };
              fill = symbol.getFill();
              stroke = symbol.getStroke();
              if (stroke) {
                stroke.style = stroke.style || "Solid";
              }
              break;
            case SMS.STYLE_CROSS:
              shape = { type: "path", path: "M " + left + ",0 L " + right + ",0 M 0," + top + " L 0," + bottom + " E" };
              fill = null;
              stroke = symbol.getStroke();
              break;
            case SMS.STYLE_DIAMOND:
              shape = { type: "path", path: "M " + left + ",0 L 0," + top + " L " + right + ",0 L 0," + bottom + " L " + left + ",0 E" };
              fill = symbol.getFill();
              stroke = symbol.getStroke();
              break;
            case SMS.STYLE_SQUARE:
              shape = { type: "path", path: "M " + left + "," + bottom + " L " + left + "," + top + " L " + right + "," + top + " L " + right + "," + bottom + " L " + left + "," + bottom + " E" };
              fill = symbol.getFill();
              stroke = symbol.getStroke();
              break;
            case SMS.STYLE_X:
              shape = { type: "path", path: "M " + left + "," + bottom + " L " + right + "," + top + " M " + left + "," + top + " L " + right + "," + bottom + " E" };
              fill = null;
              stroke = symbol.getStroke();
              break;
          }
          break;
        case "picturemarkersymbol":
          shape = { type: "image", x: 0, y: 0, width: 16, height: 16, src: "" };
          shape.x = shape.x - Math.round(symbol.width / 2);
          shape.y = shape.y - Math.round(symbol.height / 2);
          shape.width = symbol.width;
          shape.height = symbol.height;
          shape.src = symbol.url;
          break;
        case "simplelinesymbol":
        case "cartographiclinesymbol":
          //shape = { type: "path", path: "M -15,10 L 0,-10 L 0,10 L 15,-10 E" };
          shape = { type: "path", path: "M -15,0 L 15,0 E" };
          fill = null;
          stroke = symbol.getStroke();
          break;
        case "simplefillsymbol":
        case "picturefillsymbol":
          shape = { type: "path", path: "M -10,-10 L 10,0 L 10,10 L -10,10 L -10,-10 E" };
          fill = symbol.getFill();
          stroke = symbol.getStroke();
          break;
      }
      
      return { defaultShape: shape, fill: fill, stroke: stroke };
    }
  }
);

dojo.mixin(esri.symbol.defaultTextSymbol, dojox.gfx.defaultText, { type:"textsymbol", align:"middle" });
});

},
'esri/map':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/main,esri/_coremap,esri/touchcontainer,esri/layers/agsdynamic,esri/layers/agstiled"], function(dijit,dojo,dojox){
dojo.provide("esri.map");


dojo.require("esri.main");


dojo.require("esri._coremap");

if (esri.isTouchEnabled) {
  dojo.require("esri.touchcontainer");
}
else {
//all map container functionality
dojo.declare("esri._MapContainer", esri._CoreMap, (function() {
    //function/class alias
    var dc = dojo.connect,
        ddc = dojo.disconnect,
        dh = dojo.hitch,
        mixin = dojo.mixin,
        isMoz = dojo.isMozilla,
        stopEvt = dojo.stopEvent,
        dfe = dojo.fixEvent, //local var since fixEvent is called in processEvent
        Point = esri.geometry.Point; //local var since Point constructor is used in processEvent
        
    //constants
    var WHEEL_MOZ = navigator.userAgent.indexOf("Macintosh") !== -1 ? 1 : 3,
        WHEEL = dojo.isChrome < 2 ? 360 : 120,
        WHEEL_MIN = 1,
        WHEEL_MAX = 1,
        //_WHEEL_DURATION = 300,
        _CLICK_DURATION = 300;

    return {
      constructor: function(/*String/Node*/ containerId) {
        //variables
        mixin(this, { _dragEnd:false, _clickDuration:_CLICK_DURATION, //_mouseWheelEvent:{},
          _downCoords:null,
          _clickTimer:null,
          //_mouseWheelTimer:null,
          // _clickEvent:null, _fireClickEvent:null, _fireMouseWheel:null,
          _onKeyDown_connect:null, _onKeyUp_connect:null,
          // _onMouseMoveHandler_connect, _onMouseUpHandler_connect,
          _onMouseDragHandler_connect:null
        });
        
        var _cont = this.__container,
            cons = this._connects;
        
        // if (dojo.isIE || dojo.isWebKit) {
          // Shift-Click or drawing a zoom rectangle on a map with dynamic layer that has PNG32 fix applied
          // will lead to text selection like behaviour on elements within the map. The following
          // hack fixes that issue.
          cons.push(
            dc(_cont, "onselectstart", function(evt) { stopEvt(evt); return false; }),
            dc(_cont, "ondragstart", function(evt) { stopEvt(evt); return false; })
          );
        // }
        // cons.push(dc(_cont, "onfocus", function(evt) { stopEvt(evt); return false; }));
        // _cont.onselectstart = function() { return false; };

        if (isMoz) {
          dojo.style(_cont, "MozUserSelect", "none");
        }
        
        cons.push(
          dc(_cont, "onmouseenter", this, "_onMouseEnterHandler"),
          dc(_cont, "onmouseleave", this, "_onMouseLeaveHandler"),
          dc(_cont, "onmousedown", this, "_onMouseDownHandler"),
          dc(_cont, "onclick", this, "_onClickHandler"),
          dc(_cont, "ondblclick", this, "_onDblClickHandler")
        );

        this.enableMouseWheel(false); // enable per-line resolution
        this._onMouseMoveHandler_connect = dc(_cont, "onmousemove", this, "_onMouseMoveHandler");
        this._onMouseUpHandler_connect = dc(_cont, "onmouseup", this, "_onMouseUpHandler");

        this._processEvent = dh(this, this._processEvent);
        this._fireClickEvent = dh(this, this._fireClickEvent);
        //this._fireMouseWheel = dh(this, this._fireMouseWheel);
      },

      _cleanUp: function() {
        ddc(this._onMouseMoveHandler_connect);
        ddc(this._onMouseUpHandler_connect);
        ddc(this._onMouseDragHandler_connect);
        ddc(this._scrollHandle);
        
        var cons = this._connects, i;
        
        for (i=cons.length; i>=0; i--) {
          ddc(cons[i]);
          delete cons[i];
        }
        
        this.inherited("_cleanUp", arguments);
      },
      
      //event processing function
      _processEvent: function(/*MouseEvent*/ evt) {
        evt = dfe(evt, evt.target);
        if (evt.type === "DOMMouseScroll" && dojo.isFF < 3) {
          evt.screenPoint = new Point(window.scrollX + evt.screenX - this.position.x, window.scrollY + evt.screenY - this.position.y);
        }
        else {
          evt.screenPoint = new Point(evt.pageX - this.position.x, evt.pageY - this.position.y);
        }
        evt.mapPoint = this.extent ? this.toMap(evt.screenPoint) : new Point();
        return evt;
      },

      //event handlers
      _onMouseEnterHandler: function(evt) {
        //summary: handle mouseover event on container
        // evt: Event: Mouse event
        ddc(this._onKeyDown_connect);
        ddc(this._onKeyUp_connect);

        this._onKeyDown_connect = dc(document, "onkeydown", this, "_onKeyDownHandler");
        this._onKeyUp_connect = dc(document, "onkeyup", this, "_onKeyUpHandler");
        
        this.onMouseOver(this._processEvent(evt));
      },

      _onMouseLeaveHandler: function(evt) {
        //summary: handle mouseout event on container
        // evt: Event: Mouse event
        ddc(this._onKeyDown_connect);
        ddc(this._onKeyUp_connect);
        
        this.onMouseOut(this._processEvent(evt));
      },

      _onMouseMoveHandler: function(evt) {
        //summary: handle mousemove event on container
        // evt: Event: Mouse event
        if (this._dragEnd) {
          this._dragEnd = false;
          return;
        }

        this.onMouseMove(this._processEvent(evt));
      },
      
      _onMouseDownHandler: function(evt) {
        //summary: handle mousedown event on container
        // evt: Event: Mouse event
        ddc(this._onMouseMoveHandler_connect);
        var _cont = this.__container;
        if(_cont.setCapture) {
          // References:
          // http://stackoverflow.com/questions/1685326/responding-to-the-onmousemove-event-outside-of-the-browser-window-in-ie
          // http://msdn.microsoft.com/en-us/library/ms536742%28VS.85,loband%29.aspx
          _cont.setCapture(false);
          // TODO
          // we may not need "_docLeaveConnect" connection in IE when using setCapture
          // perhaps need to verify with frame sets as well?
          // see - http://pponnusamy.esri.com:9090/jsapi/mapapps/bugs/v1.6/iframe/main-fixed.html
        }
        this._onMouseDragHandler_connect = dc(document, "onmousemove", this, "_onMouseDragHandler");

        evt = this._processEvent(evt);
        this._downCoords = evt.screenPoint.x + "," + evt.screenPoint.y;
        this.onMouseDown(evt);
      },
      
      _onMouseUpHandler: function(evt) {
        //summary: handle mouseUp event on container
        // evt: Event: Mouse event
        var _cont = this.__container;
        if(_cont.releaseCapture) {
          _cont.releaseCapture();
        }
        evt = this._processEvent(evt);
        
        ddc(this._onMouseDragHandler_connect);
        ddc(this._onMouseMoveHandler_connect);
        this._onMouseMoveHandler_connect = dc(_cont, "onmousemove", this, "_onMouseMoveHandler");
        this.onMouseUp(evt);
      },
      
      _onMouseDragHandler: function(evt) {
        //summary: handle mousemove event on container. This handler is connected on mouse down and disconnected on mouseup
        // evt: Event: Mouse event
        ddc(this._onMouseDragHandler_connect);
        this._onMouseDragHandler_connect = dc(document, "onmousemove", this, "_onMouseDraggingHandler");

        ddc(this._onMouseUpHandler_connect);
        this._onMouseUpHandler_connect = dc(document, "onmouseup", this, "_onDragMouseUpHandler");
        
        // To be notified when drag goes out of an iframe and into the parent document
        this._docLeaveConnect = dc(document, "onmouseout", this, "_onDocMouseOut");
        
        this.onMouseDragStart(this._processEvent(evt));
      },
      
      _onDocMouseOut: function(evt) {
        /*
        // The following logic will let us listen for mousemove and
        // mouseup events of an iframe's parent. However chrome displays
        // "unsafe operation" error in the console that might appear to
        // users as if our map control is trying to access privileged
        // information.
        // Let's not do this right now.
        var fromElt = evt.fromElement, toElt = evt.toElement,
            sameOriginParent, docElt;
        
        if (dojo.isChrome && fromElt && toElt) {
          if (toElt instanceof HTMLHtmlElement) {
            console.log("in-out");
            try {
              var parentURL = window.parent.document.URL;
              sameOriginParent = true;
              docElt = window.parent.document;
            } 
            catch (e) {
              sameOriginParent = false;
            }
          }
          else if (fromElt instanceof HTMLHtmlElement && this._moveOut) {
            console.log("out-in");
            docElt = document;
          }
        }
        
        if (docElt) {
          console.log("switching...");
          this._moveOut = (docElt !== document);
          ddc(this._onMouseDragHandler_connect);
          ddc(this._onMouseUpHandler_connect);
          this._onMouseDragHandler_connect = dc(docElt, "onmousemove", this, "_onMouseDraggingHandler");
          this._onMouseUpHandler_connect = dc(docElt, "onmouseup", this, "_onDragMouseUpHandler");
          return;
        }
        
        if (sameOriginParent === false) {
          this._onDragMouseUpHandler(evt);
          return;
        }*/
        
        var related = evt.relatedTarget, 
            nodeName = evt.relatedTarget && evt.relatedTarget.nodeName.toLowerCase();
        
        if (!related || (dojo.isChrome && nodeName === "html")) {
          // venturing outside the known universe (eg: out of an iframe)
          this._onDragMouseUpHandler(evt);
        }
        // NOTE: In Chrome, "related" will not be NULL when dragging the mouse
        // from inside the iframe and exiting the iframe document onto the 
        // parent document. However, it is NULL when you normally move the mouse
        // out of the iframe onto the parent. Hence the following.
        // IE, FF: map pan is concluded when mouse drag crosses over to the parent
        // Chrome, Safari: map pan will continue (looks like this behavior has
        // changed atleast in Chrome on Windows)
        
        // Note about nodeName check above: it appears Chrome on Mac does seem
        // to fire mousemove events for an iframe while the user is moving
        // the mouse over its parent document. However this is not consistent.
        // Stopping the mouse over the iframe-parent boundary seems to disable
        // this behavior. So as a general rule let's just conclude pan instead
        // of relying on inconsistent impl across platforms
      },

      _onMouseDraggingHandler: function(evt) {
        this.onMouseDrag(this._processEvent(evt));
        dojo.stopEvent(evt);
      },
      
      _onDragMouseUpHandler: function(evt) {
        var _cont = this.__container;
        if(_cont.releaseCapture) {
          _cont.releaseCapture();
        }
        this._dragEnd = true;
        //this._moveOut = false;
        
        evt = this._processEvent(evt);
        this.onMouseDragEnd(evt);
        
        ddc(this._docLeaveConnect);
        ddc(this._onMouseDragHandler_connect);
        ddc(this._onMouseUpHandler_connect);
        
        this._onMouseMoveHandler_connect = dc(_cont, "onmousemove", this, "_onMouseMoveHandler");
        this._onMouseUpHandler_connect = dc(_cont, "onmouseup", this, "_onMouseUpHandler");
        
        this.onMouseUp(evt);
      },
      
      _onClickHandler: function(evt) {
        evt = this._processEvent(evt);
        if (this._downCoords !== (evt.screenPoint.x + "," + evt.screenPoint.y)) {
          return;
        }
        
        clearTimeout(this._clickTimer);
        this._clickEvent = mixin({}, evt);
        this._clickTimer = setTimeout(this._fireClickEvent, this._clickDuration);
      },
      
      _fireClickEvent: function() {
        clearTimeout(this._clickTimer);
        if (dojo.isIE < 9) {
          // See GraphicsLayer::_onClickHandler for reasoning
          // behind this piece of code
          var GL = esri.layers.GraphicsLayer;
          this._clickEvent.graphic = GL._clicked;
          delete GL._clicked;
        }
        this.onClick(this._clickEvent);
      },
      
      _onDblClickHandler: function(evt) {
        clearTimeout(this._clickTimer);
        this.onDblClick(this._processEvent(evt));
      },
      
      _onMouseWheelHandler: function(evt) {
        if (this.__canStopSWEvt()) {
          dojo.stopEvent(evt);
        }
        
        /*var currentTime = evt.timeStamp;
        
        // IE less than 9 don't have "timeStamp" and Opera upto 11.52 always returns 0.
        // Firefox (8.0.1) on Windows XP SP 3 returns negative values. Also see: http://bugs.jquery.com/ticket/10755
        // http://help.dottoro.com/ljmhtrht.php
        // http://www.quirksmode.org/dom/w3c_events.html
        if (!esri._isDefined(currentTime) || currentTime <= 0) {
          currentTime = (new Date()).getTime();
        }

        //if (currentTime !== undefined && currentTime !== 0) {
          var elapsedTime = this._ts ? (currentTime - this._ts) : currentTime;
          
          //console.log("elapsedTime = " + elapsedTime + " / value = " + evt.value + " / detail = " + evt.detail + " / wheelDelta = " + evt.wheelDelta);
          if (elapsedTime < 50) {
            //console.log("[a b o r t e d ] !");
            return;
          }
          
          this._ts = currentTime;
        //}*/

        //clearTimeout(this._mouseWheelTimer);
        
        // https://developer.mozilla.org/en/Gecko-Specific_DOM_Events#DOMMouseScroll
        // http://stackoverflow.com/questions/5527601/normalizing-mousewheel-speed-across-browsers
        // https://github.com/cubiq/iscroll/issues/44
        // http://www.javascriptkit.com/javatutors/onmousewheel.shtml
        // http://www.quirksmode.org/dom/w3c_events.html
        // http://www.switchonthecode.com/tutorials/javascript-tutorial-the-scroll-wheel
        // http://www.adomas.org/javascript-mouse-wheel/
        
        evt = this._processEvent(evt);
        var value = dojo.isIE || dojo.isWebKit ? evt.wheelDelta / WHEEL : -evt.detail / WHEEL_MOZ,
            absValue = Math.abs(value);
        
        if (absValue <= WHEEL_MIN) {
          absValue = WHEEL_MIN;
        }
        else {
          absValue = WHEEL_MAX;
        }
        evt.value = value < 0 ? -absValue : absValue;
        //mixin(this._mouseWheelEvent, evt);

        //clearTimeout(this._mouseWheelTimer);
        //this._mouseWheelTimer = setTimeout(this._fireMouseWheel, _WHEEL_DURATION);
        
        //console.log("F I R E D");
        //this._fireMouseWheel(evt);
        this.onMouseWheel(evt);
      },
      
      __canStopSWEvt: function() {
        // TO BE IMPLEMENTED BY THE SUB CLASSES
        // Summary: specifies whether this _MapContainer
        // can stop scroll wheel events from bubbling up
        // the dom tree
        // Returns: Boolean
      },
      
      //_fireMouseWheel: function(evt) {
        //this.onMouseWheel(evt);
        //this._mouseWheelEvent = {};
        //this._mouseWheelTimer = null;
      //},
      
      _onKeyDownHandler: function(evt) {
        //summary: handle key down event on document
        // evt: KeyEvent: Keyboard event
        this.onKeyDown(evt);
      },

      _onKeyUpHandler: function(evt) {
        //summary: handle key up event on document
        // evt: KeyEvent: Keyboard event\
        this.onKeyUp(evt);
      },

      //protected
      __setClickDuration: function(dur) {
        this._clickDuration = dur;
      },
      
      __resetClickDuration: function() {
        this._clickDuration = _CLICK_DURATION;
      },
      
      enableMouseWheel: function(pixelPrecision) {
        // <Boolean> pixelPrecision: true indicates pixel resolution; false indicates
        //   line resolution
        // See: https://developer.mozilla.org/en/Gecko-Specific_DOM_Events#MozMousePixelScroll
        
        ddc(this._scrollHandle);

        this._scrollHandle = dc(
          this.__container, 
          (dojo.isFF || isMoz) ? (pixelPrecision ? "MozMousePixelScroll" : "DOMMouseScroll") : "onmousewheel", 
          this, this._onMouseWheelHandler
        );
      },

      //PUBLIC EVENTS
      onMouseOver: function() {
        //summary: When mouse enters map
      },
      onMouseMove: function() {
        //summary: When mouse moves over map
      },
      onMouseOut: function() {
        //summary: When mouse leaves map
      },
      onMouseDown: function() {
        //summary: When user presses mouse on map
      },
      onMouseDragStart: function() {
        //summary: User starts dragging mouse on map with mouse button down
      },
      onMouseDrag: function() {
        //summary: User drags mouse on map
      },
      onMouseDragEnd: function() {
        //summary: User completes drag and mouse button is up
      },
      onMouseUp: function() {
        //summary: User release mouse button
      },
      onClick: function() {
        //summary: User clicks mouse button
      },
      onDblClick: function() {
        //summary: User double clicks mouse button
      },
      onMouseWheel: function() {
        //console.log("=========== MOUSE WHEEL EVENT =========== value: " + arguments[0].value);
        //summary: User scrolls mouse wheel up/down
      },

      //keyboard events
      onKeyDown: function() {
        //summary: User presses key on keyboard
      },
      onKeyUp: function() {
        //summary: User release key on keyboard
      }
    };
  }())
);
}

/*--------------*/
/*-- esri.Map --*/
/*--------------*/

// BUILD DIRECTIVE

//all map navigation functionily
dojo.declare("esri.Map", esri._MapContainer, (function() {
    //CLASS VARIABLES
    //constants
    var _ZINDEX_NAV = 30,
        _WHEEL_DURATION = 100,
        _ZINDEX_SLIDER = 30,
        _PAN_PX = 10,
        _ZOOM_IN = 1,
        _ZOOM_OUT = -1,
        LEFT_BUT = dojo.mouseButtons.LEFT,
        _FIXEDPAN_CARDINAL = { up:"panUp", right:"panRight", down:"panDown", left:"panLeft" },
        _FIXEDPAN_DIAGONAL = { upperRight:"panUpperRight", lowerRight:"panLowerRight", lowerLeft:"panLowerLeft", upperLeft:"panUpperLeft" };

    //function/class pointers
    var dc = dojo.connect,
        ddc = dojo.disconnect,
        dcr = dojo.create,
        ds = dojo.style,
        dh = dojo.hitch,
        abs = Math.abs,
        coords = dojo.coords,
        deprecated = dojo.deprecated,
        dk = dojo.keys,
        mixin = dojo.mixin,
        Rect = esri.geometry.Rect,
        Point = esri.geometry.Point,
        Extent = esri.geometry.Extent;

    var _NAV_KEYS = [ dk.NUMPAD_PLUS, 61, dk.NUMPAD_MINUS, //zoom
                      dk.UP_ARROW, dk.NUMPAD_8, dk.RIGHT_ARROW, dk.NUMPAD_6, dk.DOWN_ARROW, dk.NUMPAD_2, dk.LEFT_ARROW, dk.NUMPAD_4, //pan cardinal
                      dk.PAGE_UP, dk.NUMPAD_9, dk.PAGE_DOWN, dk.NUMPAD_3, dk.END, dk.NUMPAD_1, dk.HOME, dk.NUMPAD_7]; //pan diagonal 

    return {
      constructor: function(containerId, params) {
        //INSTANCE VARIABLES
        mixin(this, {
          _dragOrigin:null, _slider:null, _navDiv:null, _zoomRect:null,
          _mapParams: mixin({ slider:true, nav:false, logo:true, sliderStyle: "default" }, params || {}),
          //_sliderChangeAnchor:null,
          _zoom:0,
          _keyboardPanDx:0, //keyboard navigation key set
          _keyboardPanDy:0
          //_ogol: null
        });
        
        mixin(this, {
          _onLoadHandler_connect:null,
          _panHandler_connect:null, _panStartHandler_connect:null, _upPanHandler_connect:null,
          _dblClickZoomHandler_connect:null,
          _recenterZoomHandler_connect:null, _recenterHandler_connect:null,
          _downPanHandler_connect:null, _downZoomHandler_connect:null,
          _keyNavigatingHandler_connect:null, _keyNavigationEndHandler_connect:null,
          _scrollZoomHandler_connect:null,
          _zoomHandler_connect:null, _upZoomHandler_connect:null
          //_slider_connect:null, _slidermovestop_connect:null
          //_ogol_connect: null
          //_slidermove_connect:null,
          // _normalizeRect:null, _isPanningOrZooming;null, _canZoom:null
        });
        
        mixin(this, {
          isDoubleClickZoom:false, //isDoubleClickZoom: boolean: Whether double click zoom is enabled
          isShiftDoubleClickZoom:false, //isShiftDoubleClickZoom: boolean: Whether shift double click zoom is enabled
          isClickRecenter:false, //isClickRecenter: boolean: Whether click + shift recenter is enabled
          isScrollWheelZoom:false, //isScrollWheelZoom: boolean: Whether mouse scroll wheel zoom in/out is enabled
          isPan:false, //isPan: boolean: Whether map panning is enabled

          isRubberBandZoom:false, //isRubberBandZoom: boolean: Whether rubber band zooming is enabled
          isKeyboardNavigation:false, //isKeyboardControl: boolean: Whether keyboard map navigation is enabled

          // FIXES CR 58077: For Map:  include enable and disable methods for map navigation arrows and slider
          isPanArrows:false, //isPanArrows: boolean: Whether map panning using arrows is enabled
          isZoomSlider:false //isZoomSlider: boolean: Whether slider zoom is enabled
        });
        
        if (dojo.isFunction(esri._css)) {
          esri._css = esri._css(this._mapParams.force3DTransforms);
          this.force3DTransforms = this._mapParams.force3DTransforms;
        }
        
        var canDoTransforms = (esri._hasTransforms && esri._hasTransitions);
        
        this.navigationMode = this._mapParams.navigationMode || (canDoTransforms && "css-transforms") || "classic";
        if (this.navigationMode === "css-transforms" && !canDoTransforms) {
          this.navigationMode = "classic";
        }
        
        this.fadeOnZoom = esri._isDefined(this._mapParams.fadeOnZoom) ? 
                          this._mapParams.fadeOnZoom :
                          (this.navigationMode === "css-transforms");
        if (this.navigationMode !== "css-transforms") {
          this.fadeOnZoom = false;
        }
        
        this._zoomRect = new esri.Graphic(null, new esri.symbol.SimpleFillSymbol(esri.config.defaults.map.zoomSymbol));
        this.setMapCursor("default");
        
        this.smartNavigation = params && params.smartNavigation;
        
        if (!esri._isDefined(this.smartNavigation) && dojo.isMac && !esri.isTouchEnabled && !(dojo.isFF <= 3.5)) {
          // Ideally we want the Browser to give us proper gesture events
          // from Trackpad and MagicMouse, or give us the source device of
          // the mousewheel event. Firefox seems to have the infrastructure
          // for exposing the source device but for whatever reason is not
          // exposed
          // See: http://www.trymbill.is/in-browser-multitouch-gestures-with-the-trackpad/
          
          // userAgent examples:
          // Firefox 10: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:10.0) Gecko/20100101 Firefox/10.0"
          // Chrome:     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/535.7 (KHTML, like Gecko) Chrome/16.0.912.77 Safari/535.7"
          // Safari:     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.52.7 (KHTML, like Gecko) Version/5.1.2 Safari/534.52.7"
          // Note Firefox has 10.6 and WebKit has 10_6_x
          var parts = navigator.userAgent.match(/Mac\s+OS\s+X\s+([\d]+)(\.|\_)([\d]+)\D/i);
          if (parts && esri._isDefined(parts[1]) && esri._isDefined(parts[3])) {
            var majorVersion = parseInt(parts[1], 10),
                minorVersion = parseInt(parts[3], 10);
            //console.log("Mac OS Version = " + majorVersion + "." + minorVersion);
            
            // Snow Leopard, Lion and Beyond
            this.smartNavigation = (
              (majorVersion > 10) || 
              (majorVersion === 10 && minorVersion >= 6)
            );
          }
        }
        
        //this._normalizeRect = dh(this, this._normalizeRect);
        // this._panHandler = dh(this, this._panHandler);
        // this._zoomHandler = dh(this, this._zoomHandler);
        // this._recenterHandler = dh(this, this._recenterHandler);
        // this._recenterZoomHandler = dh(this, this._recenterZoomHandler);
        // this._dblClickZoomHandler = dh(this, this._dblClickZoomHandler);
        // this._scrollZoomHandler = dh(this, this._scrollZoomHandler);
        // this._keyNavigatingHandler = dh(this, this._keyNavigatingHandler);
        // this._keyNavigationEndHandler = dh(this, this._keyNavigationEndHandler);
        //this._isPanningOrZooming = dh(this, this._isPanningOrZooming);
        //this._canZoom = dh(this, this._canZoom);

        this._onLoadHandler_connect = dc(this, "onLoad", this, "_onLoadInitNavsHandler");
        
        //initialize logo
        if (this._mapParams.logo) {
          var style = {
            right:(this._mapParams.nav ? "25px" : "") 
          };
                              
          if (dojo.isIE === 6) {
            style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled='true', sizingMethod='crop', src='" + dojo.moduleUrl("esri") + "../../images/map/logo-med.png" + "')";
          }
          
          var logo = this._ogol = dcr("div", { style: style }, this.root);          
          if ((this.root.clientWidth * this.root.clientHeight) < 250000){
              dojo.addClass(logo, "logo-sm");    
          } else {
              dojo.addClass(logo, "logo-med");   
          }
          if (!esri.isTouchEnabled) {
            this._ogol_connect = dc(logo, "onclick", this, "_openLogoLink");
          }
        }
        
        if (esri.isTouchEnabled) {
          this._panInitEvent = "onTouchStart";
          this._zoomInitEvent = "onGestureStart";
        }
        else {
          this._panInitEvent = "onMouseDown";
          this._zoomInitEvent = "onMouseDown";
        }
      },
      
      _cleanUp: function() {
        this.disableMapNavigation();
        
        var i;
        for (i=this._connects.length; i>=0; i--) {
          ddc(this._connects[i]);
          delete this._connects[i];
        }
        
        ddc(this._slider_connect);
        ddc(this._ogol_connect);
        
        var slider = this._slider;
        if (slider && slider.destroy && !slider._destroyed) {
          slider.destroy();
        }
        
        var navDiv = this._navDiv;
        if (navDiv) {
          dojo.destroy(navDiv);
        }
        
        this.inherited("_cleanUp", arguments);
      },
                  
      //MAP EVENT HANDLERS
      _normalizeRect: function(evt) {
        var xy = evt.screenPoint,
            dx = this._dragOrigin.x,
            dy = this._dragOrigin.y,
            rect = new Rect((xy.x < dx ? xy.x : dx) - this.__visibleRect.x,
                            (xy.y < dy ? xy.y : dy) - this.__visibleRect.y,
                            abs(xy.x - dx),
                            abs(xy.y - dy));

        if (rect.width === 0) {
          rect.width = 1;
        }
        if (rect.height === 0) {
          rect.height = 1;
        }

        return rect;
      },
      
      _downZoomHandler: function(evt) {
        if (evt.button === LEFT_BUT && evt.shiftKey && this.isRubberBandZoom) {
          this._dragOrigin = mixin({}, evt.screenPoint);

          this.setCursor("crosshair");
          this._zoomHandler_connect = dc(this, "onMouseDrag", this, "_zoomHandler");
          this._upZoomHandler_connect = dc(this, "onMouseUp", this, "_upZoomHandler");

          if (evt.ctrlKey) {
            this._zoom = _ZOOM_OUT;
          }
          else {
            this._zoom = _ZOOM_IN;
          }
        
          if (dojo.isChrome) {
            // Prevent text outside map from being selected when dragging the
            // map outside of its bounds
            evt.preventDefault();
          }
        }
      },
      
      _zoomHandler: function(evt) {
        var rect = this._normalizeRect(evt).offset(this.__visibleRect.x, this.__visibleRect.y),
            g = this.graphics, zoomRect = this._zoomRect;

        if (! zoomRect.geometry) {
          this.setCursor("crosshair");
        }

        if (zoomRect.geometry) {
          g.remove(zoomRect, true);
        }

        var tl = this.toMap(new Point(rect.x, rect.y)),
            br = this.toMap(new Point(rect.x + rect.width, rect.y + rect.height));
            
        rect = new Rect(tl.x, tl.y, br.x - tl.x, tl.y - br.y);
        rect._originOnly = true;
        zoomRect.setGeometry(rect);
        g.add(zoomRect, true);
      },
      
      _upZoomHandler: function(evt) {
        var _zoomRect = this._zoomRect;
        
        ddc(this._zoomHandler_connect);
        ddc(this._upZoomHandler_connect);

        if (this._canZoom(this._zoom) && _zoomRect.getDojoShape()) {
          this.graphics.remove(_zoomRect);
          _zoomRect.geometry = null;

          var rect = this._normalizeRect(evt);
          rect.x += this.__visibleRect.x;
          rect.y += this.__visibleRect.y;

          var extent;
          if (this._zoom === _ZOOM_OUT) {
            var mapWidth = this.extent.getWidth(),
                newWidth = (mapWidth * this.width) / rect.width,
                deltaW = (newWidth - mapWidth) / 2,
                ext = this.extent;
            extent = new Extent(ext.xmin - deltaW, ext.ymin - deltaW, ext.xmax + deltaW, ext.ymax + deltaW, this.spatialReference);
          }
          else /*(_zoom == this._ZOOM_IN)*/ {
            var min = this.toMap({ x: rect.x, y: (rect.y + rect.height) }),
                max = this.toMap({ x: (rect.x + rect.width), y: rect.y });
            extent = new Extent(min.x, min.y, max.x, max.y, this.spatialReference);
          }

          //this.__setExtent(extent); //, null, this.toScreen(extent.getCenter()));
          this._extentUtil(null, null, extent);
        }

        if (_zoomRect.getDojoShape()) {
          this.graphics.remove(_zoomRect, true);
        }
        this._zoom = 0;
        this.resetMapCursor();
      },

      _downPanHandler: function(evt) {
        if (evt.button === LEFT_BUT && ! evt.shiftKey && this.isPan) {
          this._dragOrigin = new Point(0, 0);
          mixin(this._dragOrigin, evt.screenPoint);

          this._panHandler_connect = dc(this, "onMouseDrag", this, "_panHandler");
          this._panStartHandler_connect = dc(this, "onMouseDragStart", this, "_panStartHandler");
          this._upPanHandler_connect = dc(this, "onMouseUp", this, "_upPanHandler");
        
          if (dojo.isChrome) {
            // Prevent text outside map from being selected when dragging the
            // map outside of its bounds
            evt.preventDefault();
          }
        }
      },
      
      _panStartHandler: function(evt) {
        this.setCursor("move");
        this.__panStart(evt.screenPoint.x, evt.screenPoint.y);
      },

      _panHandler: function(evt) {
        this.__pan(evt.screenPoint.x - this._dragOrigin.x, evt.screenPoint.y - this._dragOrigin.y);
      },

      _upPanHandler: function(evt) {
        ddc(this._panHandler_connect);
        ddc(this._panStartHandler_connect);
        ddc(this._upPanHandler_connect);
        
        if (this.__panning) {
          this.__panEnd(evt.screenPoint.x - this._dragOrigin.x, evt.screenPoint.y - this._dragOrigin.y);
          this.resetMapCursor();
        }
      },

      _isPanningOrZooming: function() {
        return this.__panning || this.__zooming;
      },

      _recenterHandler: function(evt) {
        if (evt.shiftKey && ! this._isPanningOrZooming()) {
          this.centerAt(evt.mapPoint);
        }
      },

      _recenterZoomHandler: function(evt) {
        if (evt.shiftKey && ! this._isPanningOrZooming()) {
          evt.value = evt.ctrlKey ? -1 : 1;
          this._scrollZoomHandler(evt, true);
        }
      },

      _dblClickZoomHandler: function(evt) {
        if (! this._isPanningOrZooming()) {
          evt.value = 1;
          this._scrollZoomHandler(evt, true);
        }
      },

      _canZoom: function(value) {
        if (! this.__tileInfo) {
          return true;
        }

        // 'level' will be -1 if dynamic baselayer
        var level = this.getLevel(), // current zoom level if tiled baselayer
            maxLevel = this.getNumLevels(); // max zoom level if tiled baselayer

        if ((level === 0 && value < 0) || (level === maxLevel-1 && value > 0)) { // this 'if' expression will always fail if dynamic baselayer
          return false;
        }
        return true;
      },

      _scrollZoomHandler: function(evt, nonMouseWheelSrc) {
        if (!nonMouseWheelSrc) {
          if (this.smartNavigation && !evt.shiftKey && !this._isPanningOrZooming()) {
            this.disableScrollWheelZoom();
            this._setScrollWheelPan(true);
            this._scrollPanHandler(evt);
            return;
          }
          
          var currentTime = evt.timeStamp;
          
          // IE less than 9 don't have "timeStamp" and Opera upto 11.52 always returns 0.
          // Firefox (8.0.1) on Windows XP SP 3 returns negative values. Also see: http://bugs.jquery.com/ticket/10755
          // http://help.dottoro.com/ljmhtrht.php
          // http://www.quirksmode.org/dom/w3c_events.html
          if (!esri._isDefined(currentTime) || currentTime <= 0) {
            currentTime = (new Date()).getTime();
          }
  
          var elapsedTime = this._ts ? (currentTime - this._ts) : currentTime;
          
          //console.log("elapsedTime = " + elapsedTime + " / value = " + evt.value + " / detail = " + evt.detail + " / wheelDelta = " + evt.wheelDelta);
          if (elapsedTime < _WHEEL_DURATION) {
            //console.log("[a b o r t e d ] !");
            return;
          }
          
          this._ts = currentTime;
        }

        if (!this._canZoom(evt.value)) {
          return;
        }
        
        this._extentUtil({
          numLevels: evt.value, 
          mapAnchor: evt.mapPoint,
          screenAnchor: evt.screenPoint
        });
        
        /*var start = this.extent, size;
        if (this.__tileInfo) {
          size = this.__getExtentForLevel(this.getLevel() + evt.value).extent;
        }
        else {
          size = start.expand(evt.value > 0 ? 0.5 * evt.value : 2 * -evt.value);
        }

        var center = evt.mapPoint,
            xmin = start.xmin - ((size.getWidth() - start.getWidth()) * (center.x - start.xmin) / start.getWidth()),
            ymax = start.ymax - ((size.getHeight() - start.getHeight()) * (center.y - start.ymax) / start.getHeight());

        this.__setExtent(new Extent(xmin, ymax - size.getHeight(), xmin + size.getWidth(), ymax, this.spatialReference),
                        null,
                        evt.screenPoint);*/
      },
      
      _scrollPanHandler: function(evt) {
        // SHIFT + MouseWheel implies Zoom
        if (evt.shiftKey && !this._isPanningOrZooming()) {
          this._setScrollWheelPan(false);
          this.enableScrollWheelZoom();
          this._scrollZoomHandler(evt);
          return;
        }

        // Let's make sense out of the scroll event
        var dx = 0, dy = 0;
        
        if (dojo.isFF) {
          if (evt.axis === evt.HORIZONTAL_AXIS) {
            dx = -evt.detail;
          }
          else {
            dy = -evt.detail;
          }
        }
        else {
          dx = evt.wheelDeltaX;
          dy = evt.wheelDeltaY;
        }
        
        this.translate(dx, dy);
      },

      _keyNavigatingHandler: function(evt) {
        var kc = evt.keyCode;

        if (dojo.indexOf(_NAV_KEYS, kc) !== -1) {
          //var ti = this.__tileInfo;

          if (kc === dk.NUMPAD_PLUS || kc === 61) {
            /*if (ti) {
              this.setLevel(this.getLevel() + 1);
            }
            else {
              this.__setExtent(this.extent.expand(0.5));
            }*/
            this._extentUtil({ numLevels: 1 });
          }
          else if (kc === dk.NUMPAD_MINUS) {
            /*if (ti) {
              this.setLevel(this.getLevel() - 1);
            }
            else {
              this.__setExtent(this.extent.expand(2));
            }*/
            this._extentUtil({ numLevels: -1 });
          }
          else {
            if (! this.__panning) {
              this.__panStart(0, 0);
            }

            switch (kc) {
              case dk.UP_ARROW: //pan up
              case dk.NUMPAD_8:
                this._keyboardPanDy += _PAN_PX;
                break;
              case dk.RIGHT_ARROW: //pan right
              case dk.NUMPAD_6:
                this._keyboardPanDx -= _PAN_PX;
                break;
              case dk.DOWN_ARROW: //pan down
              case dk.NUMPAD_2:
                this._keyboardPanDy -= _PAN_PX;
                break;
              case dk.LEFT_ARROW: //pan left
              case dk.NUMPAD_4:
                this._keyboardPanDx += _PAN_PX;
                break;
              case dk.PAGE_UP: //pan upper right
              case dk.NUMPAD_9:
                this._keyboardPanDx -= _PAN_PX;
                this._keyboardPanDy += _PAN_PX;
                break;
              case dk.PAGE_DOWN: //pan lower right
              case dk.NUMPAD_3:
                this._keyboardPanDx -= _PAN_PX;
                this._keyboardPanDy -= _PAN_PX;
                break;
              case dk.END: //pan lower left
              case dk.NUMPAD_1:
                this._keyboardPanDx += _PAN_PX;
                this._keyboardPanDy -= _PAN_PX;
                break;
              case dk.HOME: //pan upper left
              case dk.NUMPAD_7:
                this._keyboardPanDx += _PAN_PX;
                this._keyboardPanDy += _PAN_PX;
                break;
              default:
                return;
            }
            
            this.__pan(this._keyboardPanDx, this._keyboardPanDy);
          }

          dojo.stopEvent(evt);
        }
      },

      _keyNavigationEndHandler: function(evt) {
        if (this.__panning && (evt.keyCode !== dk.SHIFT)) {
          this.__panEnd(this._keyboardPanDx, this._keyboardPanDy);
          this._keyboardPanDx = this._keyboardPanDy = 0;
        }
      },
      
      _onLoadInitNavsHandler: function() {
        this.enableMapNavigation();
        this._createNav();
        
        if (this._mapParams.sliderStyle === "small" || !this._createSlider) {
          this._createSimpleSlider();
        }
        else {
          this._createSlider();
        }
        
        ddc(this._onLoadHandler_connect);
      },
      
      //NAV ARROWS
      _createNav: function() {
        //create navigation controls
        // FIXES CR 58077: For Map:  include enable and disable methods for map navigation arrows and slider
        if (this._mapParams.nav) {
          var div, v, i,
              addClass = dojo.addClass,
              id = this.id;

          this._navDiv = dcr("div", { id:id + "_navdiv" }, this.root);

          addClass(this._navDiv, "navDiv");

          var w2 = this.width / 2,
              h2 = this.height / 2,
              wh;
          for (i in _FIXEDPAN_CARDINAL) {
            v = _FIXEDPAN_CARDINAL[i];
            div = dcr("div", { id:id + "_pan_" + i }, this._navDiv);
            addClass(div, "fixedPan " + v);

            if (i === "up" || i === "down") {
              wh = parseInt(coords(div).w, 10) / 2;
              ds(div, { left: (w2 - wh) + "px", zIndex: _ZINDEX_NAV });
            }
            else {
              wh = parseInt(coords(div).h, 10) / 2;
              ds(div, { top: (h2 - wh) + "px", zIndex: _ZINDEX_NAV });
            }

            this._connects.push(dc(div, "onclick", dh(this, this[v])));
          }

          this._onMapResizeNavHandler_connect = dc(this, "onResize", this, "_onMapResizeNavHandler");

          for (i in _FIXEDPAN_DIAGONAL) {
            v = _FIXEDPAN_DIAGONAL[i];
            div = dcr("div", { id:id + "_pan_" + i, style:{ zIndex:_ZINDEX_NAV } }, this._navDiv);
            addClass(div, "fixedPan " + v);
            this._connects.push(dc(div, "onclick", dh(this, this[v])));
          }

          this.isPanArrows = true;
        }
      },

      _onMapResizeNavHandler: function(extent, wd, ht) {
        var id = this.id,
            w2 = wd / 2,
            h2 = ht / 2,
            byId = dojo.byId,
            i, div, wh;

        for (i in _FIXEDPAN_CARDINAL) {
          div = byId(id + "_pan_" + i);

          if (i === "up" || i === "down") {
            wh = parseInt(coords(div).w, 10) / 2;
            ds(div, "left", (w2 - wh) + "px");
          }
          else {
            wh = parseInt(coords(div).h, 10) / 2;
            ds(div, "top", (h2 - wh) + "px");
          }
        }
      },
      
      _createSimpleSlider: function() {
        if (this._mapParams.slider) {
          var sliderContainer  = (this._slider = dcr("div", {
            id: this.id + "_zoom_slider",
            "class": "esriSimpleSlider",
            style: "z-index: " + _ZINDEX_SLIDER + ";"
          }));
          
          dojo.addClass(sliderContainer, esri.config.defaults.map.slider.width ? "esriSimpleSliderHorizontal" : "esriSimpleSliderVertical");
          
          var incButton = dcr("div", { "class": "esriSimpleSliderIncrementButton" }, sliderContainer);
          incButton.innerHTML = "+";
          
          var decButton = dcr("div", { "class": "esriSimpleSliderDecrementButton" }, sliderContainer);
          decButton.innerHTML = "-";
          if (dojo.isIE < 8) {
            dojo.addClass(decButton, "dj_ie67Fix");
          }
          
          this._connects.push(dc(incButton, "onclick", this, this._simpleSliderChangeHandler));
          this._connects.push(dc(decButton, "onclick", this, this._simpleSliderChangeHandler));
          
          this.root.appendChild(sliderContainer);
          this.isZoomSlider = true;
        }
      },
      
      _simpleSliderChangeHandler: function(evt) {
        var zoomIn = (evt.currentTarget.className.indexOf("IncrementButton") !== -1) ? true : false;
        
        /*var currentLevel = this.getLevel();
        
        if (currentLevel !== -1) { // base layer is 'tiled'
          var newLevel = zoomIn ? (currentLevel + 1) : (currentLevel - 1);
          this.setLevel(newLevel);
        }
        else { // base layer is 'dynamic'
          var zoomFactor = zoomIn ? 0.5 : 2;
          this.__setExtent(this.extent.expand(zoomFactor));
        }*/
       
        this._extentUtil({ numLevels: zoomIn ? 1 : -1 });
      },

// BUILD DIRECTIVE
      
//      //logo link function
      _openLogoLink: function(evt) {
        window.open(esri.config.defaults.map.logoLink, "_blank");
        dojo.stopEvent(evt);
      },
      
      //PUBLIC METHODS
      enableMapNavigation: function() {
        //summary: Enable map navigation
        this.enableDoubleClickZoom();
        this.enableClickRecenter();
        this.enablePan();
        this.enableRubberBandZoom();
        this.enableKeyboardNavigation();
        
        if (this.smartNavigation) {
          this._setScrollWheelPan(true);
        }
        else {
          this.enableScrollWheelZoom();
        }
      },

      disableMapNavigation: function() {
        //summary: Disable map navigation
        this.disableDoubleClickZoom();
        this.disableClickRecenter();
        this.disablePan();
        this.disableRubberBandZoom();
        this.disableKeyboardNavigation();
        this.disableScrollWheelZoom();
        if (this.smartNavigation) {
          this._setScrollWheelPan(false);
        }
      },

      enableDoubleClickZoom: function() {
        //summary: Enable double click map zooming
        if (! this.isDoubleClickZoom) {
          this._dblClickZoomHandler_connect = dc(this, "onDblClick", this, "_dblClickZoomHandler");
          this.isDoubleClickZoom = true;
        }
      },

      disableDoubleClickZoom: function() {
        //summary: Disable double click map zooming
        if (this.isDoubleClickZoom) {
          ddc(this._dblClickZoomHandler_connect);
          this.isDoubleClickZoom = false;
        }
      },

      enableShiftDoubleClickZoom: function() {
        if (! this.isShiftDoubleClickZoom) {
          deprecated(this.declaredClass + ": " + esri.bundle.map.deprecateShiftDblClickZoom, null, "v2.0");
          this._recenterZoomHandler_connect = dc(this, "onDblClick", this, "_recenterZoomHandler");
          this.isShiftDoubleClickZoom = true;
        }
      },

      disableShiftDoubleClickZoom: function() {
        if (this.isShiftDoubleClickZoom) {
          deprecated(this.declaredClass + ": " + esri.bundle.map.deprecateShiftDblClickZoom, null, "v2.0");
          ddc(this._recenterZoomHandler_connect);
          this.isShiftDoubleClickZoom = false;
        }
      },

      enableClickRecenter: function() {
        //summary: Enable click + shift recenter
        if (! this.isClickRecenter) {
          this._recenterHandler_connect = dc(this, "onClick", this, "_recenterHandler");
          this.isClickRecenter = true;
        }
      },

      disableClickRecenter: function() {
        //summary: Disable click + shift recenter
        if (this.isClickRecenter) {
          ddc(this._recenterHandler_connect);
          this.isClickRecenter = false;
        }
      },

      enablePan: function() {
        //summary: Enable map panning
        if (! this.isPan) {
          this._downPanHandler_connect = dc(this, this._panInitEvent, this, "_downPanHandler");
          this.isPan = true;
        }
      },

      disablePan: function() {
        //summary: Disable map panning
        if (this.isPan) {
          ddc(this._downPanHandler_connect);
          this.isPan = false;
        }
      },

      enableRubberBandZoom: function() {
        //summary: Enable rubber band zooming in/out
        if (! this.isRubberBandZoom) {
          this._downZoomHandler_connect = dc(this, this._zoomInitEvent, this, "_downZoomHandler");
          this.isRubberBandZoom = true;
        }
      },

      disableRubberBandZoom: function() {
        //summary: Disable rubber band zooming in/out
        if (this.isRubberBandZoom) {
          ddc(this._downZoomHandler_connect);
          this.isRubberBandZoom = false;
        }
      },

      enableKeyboardNavigation: function() {
        //summary: Enable keyboard map navigation
        if (! this.isKeyboardNavigation) {
          this._keyNavigatingHandler_connect = dc(this, "onKeyDown", this, "_keyNavigatingHandler");
          this._keyNavigationEndHandler_connect = dc(this, "onKeyUp", this, "_keyNavigationEndHandler");
          this.isKeyboardNavigation = true;
        }
      },

      disableKeyboardNavigation: function() {
        //summary: Disable keyboard map navigation
        if (this.isKeyboardNavigation) {
          ddc(this._keyNavigatingHandler_connect);
          ddc(this._keyNavigationEndHandler_connect);
          this.isKeyboardNavigation = false;
        }
      },

      enableScrollWheelZoom: function() {
        //summary: Enable mouse scroll wheel zoom in/out
        if (! this.isScrollWheelZoom) {
          this._scrollZoomHandler_connect = dc(this, "onMouseWheel", this, "_scrollZoomHandler");
          this.isScrollWheelZoom = true;
        }
      },
      
      __canStopSWEvt: function() {
        // overrides _MapContainer::__canStopSWEvt
        return this.isScrollWheelZoom || this.isScrollWheelPan;
      },

      disableScrollWheelZoom: function() {
        //summary: Disable mouse scroll wheel zoom in/out
        if (this.isScrollWheelZoom) {
          ddc(this._scrollZoomHandler_connect);
          this.isScrollWheelZoom = false;
        }
      },
      
      _setScrollWheelPan: function(enable) {
        this.isScrollWheelPan = enable;
        this.enableMouseWheel(enable); // enable per-line resolution
        ddc(this._mwMacHandle);
        
        if (enable) {
          this._mwMacHandle = dc(this, "onMouseWheel", this, this._scrollPanHandler);
        }
      },

      // FIXES CR 58077: For Map:  include enable and disable methods for map navigation arrows and slider            
      showPanArrows: function() {
        //summary: Enable map panning using the arrows
        if (this._navDiv) {
          esri.show(this._navDiv);
          this.isPanArrows = true;
        }
      },

      hidePanArrows: function() {
        //summary: Disable map panning using the arrows
        if (this._navDiv) {
          esri.hide(this._navDiv);
          this.isPanArrows = false;
        }
      },

      showZoomSlider: function() {
        //summary: Enable slider zooming in/out
        if (this._slider) {
          ds(this._slider.domNode || this._slider, "visibility", "visible");
          this.isZoomSlider = true;
        }
      },

      hideZoomSlider: function() {
        //summary: Disable slider zooming in/out
        if (this._slider) {
          ds(this._slider.domNode || this._slider, "visibility", "hidden");
          this.isZoomSlider = false;
        }
      }
    };
  }())
);

dojo.require("esri.layers.agsdynamic");
dojo.require("esri.layers.agstiled");
// BUILD DIRECTIVE

if (esri.isTouchEnabled) {
dojo.extend(esri.Map, (function() {
    var dc = dojo.connect,
        ddc = dojo.disconnect,
        Point = esri.geometry.Point,
        getLength = esri.geometry.getLength,        
        getCandidateTileInfo = esri.TileUtils.getCandidateTileInfo;
                 
    return {
      /*constructor: function(container, params) {                
        
        this._connects.push(dc(this, "onTouchStart", this, this._downPanHandler));
        this._connects.push(dc(this, "onGestureStart", this, this._downZoomHandler));
      },
      
      _cleanUp: function() {
        for (var i=this._connects.length; i>=0; i--) {
          ddc(this._connects[i]);
          delete this._connects[i];
        }
        
        ddc(this._panHandler_connect);
        ddc(this._upPanHandler_connect);
        
        this.inherited("_cleanUp", arguments);
      },*/
     
      _multiTouchTapZoomHandler: function(evt) {
        if (! this._isPanningOrZooming()) {
          evt.value = -1;
          this._scrollZoomHandler(evt, true);
        }
      },
            
      _downPanHandler: function(evt) {
        var prevAnim = this._zoomAnim || this._panAnim;
        if (prevAnim && prevAnim._active) {
          prevAnim.stop();
          prevAnim._fire("onEnd", [prevAnim.node]);
        }
//        else if (this.__zooming) {
//          console.log("finalize ZOOM");
//          evt.screenPoint = new Point(this._panX, this._panY);
//          evt.mapPoint = this.toMap(evt.screenPoint);
//          this._upPanHandler(evt);
//        }

        this._dragOrigin = new Point(0, 0);
        dojo.mixin(this._dragOrigin, evt.screenPoint);

        ddc(this._panHandler_connect);
        ddc(this._upPanHandler_connect);
        this._panHandler_connect = dc(this, "onTouchMove", this, this._panHandler);
        this._upPanHandler_connect = dc(this, "onTouchEnd", this, this._upPanHandler);
        //dojo.stopEvent(evt);
      },
      
      _panHandler: function(evt) {
        evt.preventDefault();

        if (this.__panning) {
          this._panX = evt.screenPoint.x;
          this._panY = evt.screenPoint.y;
          
          this.__pan(evt.screenPoint.x - this._dragOrigin.x, evt.screenPoint.y - this._dragOrigin.y);
        }
        else {
          this.setCursor("move");
          this.__panStart(evt.screenPoint.x, evt.screenPoint.y);
        }
        //dojo.stopEvent(evt);
      },
      
      _upPanHandler: function(evt) {
        ddc(this._panHandler_connect);
        ddc(this._upPanHandler_connect);
        
        if (this.__panning) {
          this.__panEnd(evt.screenPoint.x - this._dragOrigin.x, evt.screenPoint.y - this._dragOrigin.y);
          this.resetMapCursor();
        }
        //dojo.stopEvent(evt);
      },
      
      _downZoomHandler: function(evt) {
        var prevAnim = this._zoomAnim || this._panAnim;
        if (prevAnim && prevAnim._active) {
          prevAnim.stop();
          prevAnim._fire("onEnd", [prevAnim.node]);
        }
        else if (this.__panning) {
          evt.screenPoint = new Point(this._panX, this._panY);
          evt.mapPoint = this.toMap(evt.screenPoint);
          this._upPanHandler(evt);
        }
        
        ddc(this._zoomHandler_connect);
        ddc(this._upZoomHandler_connect);
        this._zoomHandler_connect = dc(this, "onGestureChange", this, this._zoomHandler);
        this._upZoomHandler_connect = dc(this, "onGestureEnd", this, this._upZoomHandler);
        //dojo.stopEvent(evt);
      },
      
      _zoomHandler: function(evt) {
        if (evt.screenPoints) {
          evt.preventDefault();
          this.currLength = getLength(evt.screenPoints[0], evt.screenPoints[1]);
          
          // TODO
          // Need to fix the selection of anchor point. The map locations underneath
          // the fingers at the start of gesture do not remain so as the gesture
          // progresses (try moving only finger 1, then moving only finger 2).
          // We need a solution where two map location act as anchors
          
          if (this.__zooming) {
            var scale = this.currLength / this._length;
            this._zoomStartExtent = this.__scaleExtent(this.extent, scale, this._dragOrigin);
            this.__zoom(this._zoomStartExtent, scale, this._dragOrigin);
          }
          else {
            this._dragOrigin = new Point((evt.screenPoints[0].x + evt.screenPoints[1].x) / 2, (evt.screenPoints[0].y + evt.screenPoints[1].y) / 2);
            this._length = this.currLength;
            this.__zoomStart(this.extent, this._dragOrigin);
          }

          this._fireOnScale(this.currLength / this._length, this._dragOrigin, true);
        }
        //dojo.stopEvent(evt);
      },
      
      _upZoomHandler: function(evt) {
        ddc(this._zoomHandler_connect);
        ddc(this._upZoomHandler_connect);
        
        if (evt.processMultiTouchTap) {
          this._multiTouchTapZoomHandler(evt);
          evt.preventDefault();
        }
        else {
          if (this.__zooming && this._zoomAnim === null) {
            var scale = this.currLength / this._length, extWd = this.extent.getWidth();
            this._zoomAnimAnchor = this.toMap(this._dragOrigin);
            this._zoomStartExtent = this.__scaleExtent(this.extent, 1 / scale, this._zoomAnimAnchor);
            
            if (this.__tileInfo) {
              var ct = getCandidateTileInfo(this, this.__tileInfo, this._zoomStartExtent),
                  extLod = this.__getExtentForLevel(ct.lod.level, this._zoomAnimAnchor), 
                  maxLevel = this.getNumLevels() - 1,
                  endExtent = extLod.extent, endLod = extLod.lod,
                  targetScale = extWd / endExtent.getWidth(),
                  targetLevel = ct.lod.level;
                  
              if (scale < 1) { // zooming out
                if (targetScale > scale) {
                  targetLevel--;
                }
              }
              else { // zoom in
                if (targetScale < scale) {
                  targetLevel++;
                }
              }
              
              if (targetLevel < 0) {
                targetLevel = 0;
              }
              else if (targetLevel > maxLevel) {
                targetLevel = maxLevel;
              }
              
              if (targetLevel !== ct.lod.level) {
                extLod = this.__getExtentForLevel(targetLevel, this._zoomAnimAnchor);
                endExtent = extLod.extent;
                endLod = extLod.lod;
              }

              this._zoomEndExtent = endExtent;
              this._zoomEndLod = endLod;
              
              this._zoomAnim = esri.fx.animateRange({
                range: {
                  start: (extWd / this._zoomStartExtent.getWidth()),
                  end: targetScale
                },
                duration: esri.config.defaults.map.zoomDuration,
                rate: esri.config.defaults.map.zoomRate,
                onAnimate: dojo.hitch(this, "_adjustZoomHandler"),
                onEnd: dojo.hitch(this, "_adjustZoomEndHandler")
              }).play();

              this._fireOnScale(this.extent.getWidth()/this._zoomEndExtent.getWidth(), this._dragOrigin);
            }
            else {
              this._zoomEndExtent = this._zoomStartExtent;
              this._fireOnScale(this.extent.getWidth()/this._zoomEndExtent.getWidth(), this._dragOrigin);
              this._adjustZoomEndHandler();
            }
          }
        }
      },
      
      _adjustZoomHandler: function(scale) {
        var extent = this.__scaleExtent(this.extent, scale, this._zoomAnimAnchor);
        this.__zoom(extent, scale, this._dragOrigin);
      },
      
      _adjustZoomEndHandler: function() {
        var scale = this.extent.getWidth() / this._zoomEndExtent.getWidth(),
            extent = this.__scaleExtent(this.extent, 1/scale, this._zoomAnimAnchor);
            
        this.__zoomEnd(extent, scale, this._dragOrigin, this._zoomEndLod, /*this.__LOD ? (this.__LOD.level != this._zoomEndLod.level) :*/ true);
        this._zoomStartExtent = this._zoomEndExtent = this._zoomEndLod = this._dragOrigin = this._zoomAnim = this._zoomAnimAnchor = null;
      }
    };
  }())
);
}

});

},
'esri/layers/dynamic':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/layers/layer,esri/geometry,dojox/xml/parser,dojox/gfx/matrix"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.dynamic");

dojo.require("esri.layers.layer");
dojo.require("esri.geometry");
dojo.require("dojox.xml.parser");
dojo.require("dojox.gfx.matrix");

dojo.declare("esri.layers.DynamicMapServiceLayer", esri.layers.Layer, {
    constructor: function(/*String*/ url, /*Object?*/ options) {
      this.useMapTime = (options && options.hasOwnProperty("useMapTime")) ? 
                        (!!options.useMapTime) : 
                        true;
      
      var hitch = dojo.hitch;
      this._exportMapImageHandler = hitch(this, this._exportMapImageHandler);
      this._imgSrcFunc = hitch(this, this._imgSrcFunc);
      this._divAlphaImageFunc = hitch(this, this._divAlphaImageFunc);
      this._tileLoadHandler = hitch(this, this._tileLoadHandler);
      this._tileErrorHandler = hitch(this, this._tileErrorHandler);
    },

    opacity: 1,
    isPNG32: false,
  
    _setMap: function(map, container, index) {
      this._map = map;

      var d = (this._div = dojo.create("div", null, container)),
          names = esri._css.names,
          css = {
            position: "absolute", 
            width: map.width + "px", 
            height: map.height + "px", 
            overflow: "visible", 
            opacity: this.opacity 
          },
          isIE = dojo.isIE,
          connect = dojo.connect,
          vd = map.__visibleDelta;
          
      if (isIE && isIE > 7) {
        delete css.opacity;
      }
      
      if (map.navigationMode === "css-transforms") {
        // Without visibleDelta, scaling anchor is correct only when
        // this layer is added before any map pan has occured.
        css[names.transform] = esri._css.translate(vd.x, vd.y);
        dojo.style(d, css);

        this._onScaleHandler_connect = connect(map, "onScale", this, this._onScaleHandler);
        this._left = vd.x; 
        this._top = vd.y;
      }
      else {
        css.left = "0px";
        css.top = "0px";
        dojo.style(d, css);
        this._onZoomHandler_connect = connect(map, "onZoom", this, "_onZoomHandler");
        this._left = this._top = 0;
      }
      
      dojo.style(d, css);
      
      this._onPanHandler_connect = connect(map, "onPan", this, "_onPanHandler");
      this._onExtentChangeHandler_connect = connect(map, "onExtentChange", this, "_onExtentChangeHandler");
      this._onResizeHandler_connect = connect(map, "onResize", this, "_onResizeHandler");
      this._opacityChangeHandler_connect = connect(this, "onOpacityChange", this, "_opacityChangeHandler");
      this._visibilityChangeHandler_connect = connect(this, "onVisibilityChange", this, "_visibilityChangeHandler");
      this._toggleTime();

      this._layerIndex = index;
      this._img_loading = null;
      this._dragOrigin = { x:0, y:0 };

      if (!this.visible) {
        this._visibilityChangeHandler(this.visible);
      }
      else if (map.extent && map.loaded) {
        this._onExtentChangeHandler(map.extent);
      }
      
      return d;
    },
    
    _unsetMap: function(map, container) {
      /*if (container) {
        this._div = container.removeChild(this._div);
      }*/
      dojo.destroy(this._div);
      this._map = this._layerIndex = this._div = null;
      
      var disconnect = dojo.disconnect;
      disconnect(this._onPanHandler_connect);
      disconnect(this._onExtentChangeHandler_connect);
      disconnect(this._onZoomHandler_connect);
      disconnect(this._onScaleHandler_connect);
      disconnect(this._onResizeHandler_connect);
      disconnect(this._opacityChangeHandler_connect);
      disconnect(this._visibilityChangeHandler_connect);
      this._toggleTime();
    },
    
    _onResizeHandler: function(extent, width, height) {
      dojo.style(this._div, { width:width + "px", height:height + "px" });
      this._onExtentChangeHandler(extent);
    },

    _visibilityChangeHandler: function(v) {
      var connect = dojo.connect,
          disconnect = dojo.disconnect,
          map = this._map;

      this._toggleTime();

      if (v) {
        // We need to sync our div with map here, because map have been panned 
        // while this layer was hidden
        if (map.navigationMode === "css-transforms") {
          var vd = map.__visibleDelta;
          this._left = vd.x;
          this._top =  vd.y;
          dojo.style(this._div, esri._css.names.transform, esri._css.translate(this._left, this._top));
        }

        this._onExtentChangeHandler(map.extent);
        this._onPanHandler_connect = connect(map, "onPan", this, "_onPanHandler");              
        this._onExtentChangeHandler_connect = connect(map, "onExtentChange", this, "_onExtentChangeHandler");
        if (map.navigationMode === "css-transforms") {
          this._onScaleHandler_connect = connect(map, "onScale", this, this._onScaleHandler);
        }
        else {
          this._onZoomHandler_connect = connect(map, "onZoom", this, "_onZoomHandler");
        }
      }
      else {
        esri.hide(this._div);
        disconnect(this._onPanHandler_connect);
        disconnect(this._onExtentChangeHandler_connect);
        disconnect(this._onZoomHandler_connect);
        disconnect(this._onScaleHandler_connect);
      }
    },
    
    _toggleTime: function() {
      var map = this._map;
      
      // Listen for map timeextent change when all controlling factors are ON
      // Disconnect from map when one of the controlling factors is OFF
      // Note that this method should be called when the state of a  
      // controlling factor changes.
      
      if (this.timeInfo && this.useMapTime && map && this.visible) {
        if (!this._timeConnect) {
          this._timeConnect = dojo.connect(map, "onTimeExtentChange", this, this._onTimeExtentChangeHandler);
        }
        
        this._setTime(map.timeExtent);
      }
      else {
        dojo.disconnect(this._timeConnect);
        this._timeConnect = null;
        this._setTime(null);
      }
    },
    
    _setTime: function(timeExtent) {
      if (this._params) {
        this._params.time = timeExtent ? timeExtent.toJson().join(",") : null;
      }
    },

    _onPanHandler: function(extent, delta) {
      this._panDx = delta.x;
      this._panDy = delta.y;

      var dragOrigin = this._dragOrigin,
          vd = this._map.__visibleDelta,
          img = this._img;
          
      if (img) {
        if (this._map.navigationMode === "css-transforms") {
          this._left = vd.x + delta.x;
          this._top =  vd.y + delta.y;
          dojo.style(this._div, esri._css.names.transform, esri._css.translate(this._left, this._top));
        }
        else {
          dojo.style(img, {
            left: (dragOrigin.x + delta.x) + "px",
            top: (dragOrigin.y + delta.y) + "px"
          });
        }
      }
    },
    
    _onExtentChangeHandler: function(extent, delta, levelChange) {
      if (! this.visible) {
        return;
      }
      
      var _m = this._map,
          // params = this._getImageParams(_m, extent),
          _i = this._img,
          _istyle = _i && _i.style,
          _do = this._dragOrigin;

      // See GraphicsLayer::_onPanEndUpdateHandler for details on the bug
      // that this piece of code fixes.
      // Ideally, we want to do this onPanEnd like in GraphicsLayer, but 
      // works just as well here. We don't have to attach another event
      // handler just to do this.
      if (delta && !levelChange && _i && (delta.x !== this._panDx || delta.y !== this._panDy)) {
        if (_m.navigationMode === "css-transforms") {
          var vd = _m.__visibleDelta;
          this._left = vd.x;
          this._top =  vd.y;
          dojo.style(this._div, esri._css.names.transform, esri._css.translate(this._left, this._top));
        }
        else {
          dojo.style(_i, { left: (_do.x + delta.x) + "px", top: (_do.y + delta.y) + "px" });
        }
      }

      // Record the current position of the image. Will need 
      // this in _onPanHandler() if the user starts to drag the map
      // while the new image is still loading.
      if (_i) {
        _do.x = parseInt(_istyle.left, 10);
        _do.y = parseInt(_istyle.top, 10);
      }
      else {
        _do.x = (_do.y = 0);
      }
      
      if (_m.navigationMode === "css-transforms") {
        if (levelChange && _i) {
          // Conclude transition *now*
          dojo.style(_i, esri._css.names.transition, "none");
          
          // Let's remember the current matrix so that when the
          // next scaling begins before the new map image loads,
          // we can apply the matrix
          _i._multiply = _i._multiply ? 
                         dojox.gfx.matrix.multiply(_i._matrix, _i._multiply) : 
                         _i._matrix;
        }
      }

      //if (window._halt) return;
      
      this._fireUpdateStart();

      // If an image is already loading, abort it. Why?
      // Because, we are now here as the user has changed the extent and
      // hence the image that is already loading is obsolete.
      // if (this._img_onload_connect) {
      var loading = this._img_loading;
      if (loading) {
        dojo.disconnect(loading._onload_connect);
        dojo.disconnect(loading._onerror_connect);
        dojo.disconnect(loading._onabort_connect);
        dojo.destroy(loading);
        this._img_loading = null;
        
        // _jsonRequest is used if useMapImage option is enabled.
        // see also getImageUrl in agsdynamic.js
        var request = this._jsonRequest;
        if (request) {
          try {
            request.cancel();
          }
          catch(e) {}
          this._jsonRequest = null;
        }
      }
      
      if (this.version >= 10 && _m.wrapAround180 /*&& _m.spatialReference._isWrappable()*/) {
        //extent = extent._shiftCM();
        extent = extent._normalize(true);
        // _shiftCM caches the result. So, multiple dynamic map service layers
        // can reuse it.
      }

      if (this.isPNG32) {
        var div = (this._img_loading = dojo.create("div"));
        div.id = _m.id + "_" + this.id + "_" + new Date().getTime();
        dojo.style(div, { position:"absolute", left:"0px", top:"0px", width:_m.width+"px", height:_m.height+"px" });
        
        var innerDiv = div.appendChild(dojo.create("div"));
        dojo.style(innerDiv, { opacity:0, width:_m.width + "px", height:_m.height + "px" });
        
        this.getImageUrl(extent, _m.width, _m.height, this._divAlphaImageFunc);
        div = null;
      }
      else {
        var img = (this._img_loading = dojo.create("img")),
            names = esri._css.names,
            isIE = dojo.isIE,
            css = { 
              position: "absolute", 
              width: _m.width + "px", 
              height: _m.height + "px" 
            };

        if (isIE && isIE > 7) {
          css.opacity = this.opacity;
        }
        
        if (_m.navigationMode === "css-transforms") {
          css[names.transform] = esri._css.translate(-this._left, -this._top);
          img._tdx = -this._left;
          img._tdy = -this._top;
          css[names.transition] = names.transformName + " " + esri.config.defaults.map.zoomDuration + "ms ease";
        }
        else {
          css.left = "0px";
          css.top = "0px";
        }

        img.id = _m.id + "_" + this.id + "_" + new Date().getTime();
        dojo.style(img, css);

        img._onload_connect = dojo.connect(img, "onload", this, "_onLoadHandler");
        img._onerror_connect = dojo.connect(img, "onerror", this, "_onErrorHandler");
        img._onabort_connect = dojo.connect(img, "onabort", this, "_onErrorHandler");
        
        // need to place this *before* getImageUrl() as the image might be fetched from the browser cache (and _onLoadHandler called immediately)
        // and we don't want to be incorrect after getImageUrl() 
        this._startRect = { left: _do.x, top: _do.y, width: _i ? parseInt(_istyle.width, 10) : _m.width, height: _i ? parseInt(_istyle.height, 10) : _m.height, zoom: (_istyle && _istyle.zoom) ? parseFloat(_istyle.zoom) : 1 };
      
        this.getImageUrl(extent, _m.width, _m.height, this._imgSrcFunc);
        img = null;
      }
    },
    
    _onTimeExtentChangeHandler : function(timeExtent){
      if (! this.visible) {
        return;
      }
      
      this._setTime(timeExtent);
      this.refresh(true);            
    },
       
    getImageUrl: function(extent, wd, ht, callback) {
      //function to be implemented by extending class to provide an image
    },
    
    _imgSrcFunc: function(src) {
      this._img_loading.src = src;
    },
    
    _divAlphaImageFunc: function(src) {
      dojo.style(this._img_loading, "filter", "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + src + "', sizingMethod='scale')");
      this._onLoadHandler({ currentTarget:this._img_loading });
    },
    
    _onLoadHandler: function(evt) {
      var img = evt.currentTarget,
          disconnect = dojo.disconnect,
          _m = this._map;
      
      disconnect(img._onload_connect);
      disconnect(img._onerror_connect);
      disconnect(img._onabort_connect);

      if (! _m || _m.__panning || _m.__zooming) { // Is map in the middle of panning? (eg: user dragging) then ABORT
        dojo.destroy(img);
        this._fireUpdateEnd();
        return;
      }

      // var cn = _d.childNodes;
      // if (dojo.isIE) {
      //   for (var i=0, il=cn.length; i<il; i++) {
      //     cn.item(i).setAttribute("src", null);
      //   }
      // }

      // TODO
      // Remove this XML parser dependency
      dojox.xml.parser.removeChildren(this._div);
      this._img = img;
      this._startRect = { left: 0, top: 0, width: _m.width, height: _m.height, zoom: 1 };
      this._div.appendChild(img);

      // This line was moved from _visibilityChangeHandler() to here.
      // Fixes the following problem:
      // 1. Add a tiled layer and a dynamic layer to the map.
      // 2. 'Hide' the dynamic layer
      // 3. Drag on the map to change its extent
      // 4. 'Show' the dynamic layer --> it'll show up in its previous position 
      //    and only then load the new image for the current extent.
      // TODO: What about similar scenario for a tiled layer ??
      if (this.visible) {
        esri.show(this._div);
      }

      img._onload_connect = img._onerror_connect = img._onabort_connect = this._img_loading = null;
      var _do = this._dragOrigin;
      _do.x = (_do.y = 0);

      this.onUpdate();
      this._fireUpdateEnd();
    },

    _onErrorHandler: function(evt) {
      var img = evt.currentTarget,
          disconnect = dojo.disconnect;
      dojo.style(img, "visibility", "hidden");

      disconnect(img._onload_connect);
      disconnect(img._onerror_connect);
      disconnect(img._onabort_connect);
      img._onload_connect = img._onerror_connect = img._onabort_connect = null;
      
      var error = new Error(esri.bundle.layers.dynamic.imageError + ": " + img.src);
      this.onError(error);
      this._fireUpdateEnd(error);
    },
    
    setUseMapTime: function(/*Boolean*/ use, /*Boolean?*/ doNotRefresh) {
      this.useMapTime = use;
      this._toggleTime();
      
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },

    refresh: function() {
      if (this._map) {
        this._onExtentChangeHandler(this._map.extent);
      }
    },
    
    _onScaleHandler: function(mtx, immediate) {
      var css = {}, names = esri._css.names,
          img = this._img;
      
      if (!img) {
        return;
      }
      
      dojo.style(img, names.transition, immediate ? "none" : (names.transformName + " " + esri.config.defaults.map.zoomDuration + "ms ease"));
      
      img._matrix = mtx;
      
      // "_multiply" has the transformation applied to the image during the 
      // previous zoom sequence (in case a new image has not been loaded
      // yet after the previous sequence)
      // Map sends the cumulative transformation for this sequence in "mtx" 
      mtx = img._multiply ?
            dojox.gfx.matrix.multiply(mtx, img._multiply) :
            mtx;
      
      // The image may contain its own translation as well. We can get
      // it from _tdx and _tdy
      if (img._tdx || img._tdy) {
        mtx = dojox.gfx.matrix.multiply(mtx, {
          "xx": 1,"xy": 0,"yx": 0,"yy": 1,
          "dx": img._tdx,
          "dy": img._tdy
        });
      }
      
      css[names.transform] = esri._css.matrix(mtx);
      //console.log("xply: " + dojo.toJson(css[names.transform]));
      dojo.style(img, css);
    },

    _onZoomHandler: function(extent, scale, anchor) {
      var start = this._startRect,
          targetWidth = start.width * scale, 
          targetHeight = start.height * scale,
          img = this._img, isIE = dojo.isIE;
          
      if (img) {
        if (isIE && isIE < 8) {
          dojo.style(img, {
            left: (start.left - ((targetWidth - start.width) * (anchor.x - start.left) / start.width)) + "px",
            top: (start.top - ((targetHeight - start.height) * (anchor.y - start.top) / start.height)) + "px",
            zoom: scale * start.zoom
          });
        }
        else {
          dojo.style(img, {
            left: (start.left - ((targetWidth - start.width) * (anchor.x - start.left) / start.width)) + "px",
            top: (start.top - ((targetHeight - start.height) * (anchor.y - start.top) / start.height)) + "px",
            width: targetWidth + "px",
            height: targetHeight + "px"
          });
        }
      }
    },
    
    _exportMapImage: function(url, params, callback) {
      var _h = this._exportMapImageHandler;
      
      params.token = this._getToken();
      
      esri.request({
        url: url,
        content: params,
        callbackParamName: "callback",
        load: function() { _h(arguments[0], arguments[1], callback); },
        error: esri.config.defaults.io.errorHandler
      });
    },
    
    _exportMapImageHandler: function(response, io, callback) {
      var mapImage = new esri.layers.MapImage(response);
      this.onMapImageExport(mapImage);
      if (callback) {
        callback(mapImage);
      }
    },

    onMapImageExport: function() {
      //summary: Event fired when exportMapImage completes
      // args[0]: esri.layers.MapImage: Map image returned from server
    },
    
    setOpacity: function(o) {
      if (this.opacity != o) {
        this.onOpacityChange(this.opacity = o);
      }
    },
    
    onOpacityChange: function() {
    },
    
    _opacityChangeHandler: function(value) {
      dojo.style(this._div, "opacity", value);
    }
  }
);
});

},
'dojo/io/script':function(){
define(["../main"], function(dojo) {
	// module:
	//		dojo/io/script
	// summary:
	//		TODOC

	dojo.getObject("io", true, dojo);

/*=====
dojo.declare("dojo.io.script.__ioArgs", dojo.__IoArgs, {
	constructor: function(){
		//	summary:
		//		All the properties described in the dojo.__ioArgs type, apply to this
		//		type as well, EXCEPT "handleAs". It is not applicable to
		//		dojo.io.script.get() calls, since it is implied by the usage of
		//		"jsonp" (response will be a JSONP call returning JSON)
		//		or the response is pure JavaScript defined in
		//		the body of the script that was attached.
		//	callbackParamName: String
		//		Deprecated as of Dojo 1.4 in favor of "jsonp", but still supported for
		//		legacy code. See notes for jsonp property.
		//	jsonp: String
		//		The URL parameter name that indicates the JSONP callback string.
		//		For instance, when using Yahoo JSONP calls it is normally,
		//		jsonp: "callback". For AOL JSONP calls it is normally
		//		jsonp: "c".
		//	checkString: String
		//		A string of JavaScript that when evaluated like so:
		//		"typeof(" + checkString + ") != 'undefined'"
		//		being true means that the script fetched has been loaded.
		//		Do not use this if doing a JSONP type of call (use callbackParamName instead).
		//	frameDoc: Document
		//		The Document object for a child iframe. If this is passed in, the script
		//		will be attached to that document. This can be helpful in some comet long-polling
		//		scenarios with Firefox and Opera.
		this.callbackParamName = callbackParamName;
		this.jsonp = jsonp;
		this.checkString = checkString;
		this.frameDoc = frameDoc;
	}
});
=====*/

	var loadEvent = dojo.isIE ? "onreadystatechange" : "load",
		readyRegExp = /complete|loaded/;

	dojo.io.script = {
		get: function(/*dojo.io.script.__ioArgs*/args){
			//	summary:
			//		sends a get request using a dynamically created script tag.
			var dfd = this._makeScriptDeferred(args);
			var ioArgs = dfd.ioArgs;
			dojo._ioAddQueryToUrl(ioArgs);

			dojo._ioNotifyStart(dfd);

			if(this._canAttach(ioArgs)){
				var node = this.attach(ioArgs.id, ioArgs.url, args.frameDoc);

				//If not a jsonp callback or a polling checkString case, bind
				//to load event on the script tag.
				if(!ioArgs.jsonp && !ioArgs.args.checkString){
					var handle = dojo.connect(node, loadEvent, function(evt){
						if(evt.type == "load" || readyRegExp.test(node.readyState)){
							dojo.disconnect(handle);
							ioArgs.scriptLoaded = evt;
						}
					});
				}
			}

			dojo._ioWatch(dfd, this._validCheck, this._ioCheck, this._resHandle);
			return dfd;
		},

		attach: function(/*String*/id, /*String*/url, /*Document?*/frameDocument){
			//	summary:
			//		creates a new <script> tag pointing to the specified URL and
			//		adds it to the document.
			//	description:
			//		Attaches the script element to the DOM.	 Use this method if you
			//		just want to attach a script to the DOM and do not care when or
			//		if it loads.
			var doc = (frameDocument || dojo.doc);
			var element = doc.createElement("script");
			element.type = "text/javascript";
			element.src = url;
			element.id = id;
			element.async = true;
			element.charset = "utf-8";
			return doc.getElementsByTagName("head")[0].appendChild(element);
		},

		remove: function(/*String*/id, /*Document?*/frameDocument){
			//summary: removes the script element with the given id, from the given frameDocument.
			//If no frameDocument is passed, the current document is used.
			dojo.destroy(dojo.byId(id, frameDocument));

			//Remove the jsonp callback on dojo.io.script, if it exists.
			if(this["jsonp_" + id]){
				delete this["jsonp_" + id];
			}
		},

		_makeScriptDeferred: function(/*Object*/args){
			//summary:
			//		sets up a Deferred object for an IO request.
			var dfd = dojo._ioSetArgs(args, this._deferredCancel, this._deferredOk, this._deferredError);

			var ioArgs = dfd.ioArgs;
      // callbackSuffix: to take advantage of ETags set by the ArcGIS server
      // Added support for pre-determined callback name suffix
			ioArgs.id = dojo._scopeName + "IoScript" + (args.callbackSuffix || (this._counter++));
			ioArgs.canDelete = false;

			//Special setup for jsonp case
			ioArgs.jsonp = args.callbackParamName || args.jsonp;
			if(ioArgs.jsonp){
				//Add the jsonp parameter.
				ioArgs.query = ioArgs.query || "";
				if(ioArgs.query.length > 0){
					ioArgs.query += "&";
				}
				ioArgs.query += ioArgs.jsonp
					+ "="
					+ (args.frameDoc ? "parent." : "")
					+ dojo._scopeName + ".io.script.jsonp_" + ioArgs.id + "._jsonpCallback";

				ioArgs.frameDoc = args.frameDoc;

				//Setup the Deferred to have the jsonp callback.
				ioArgs.canDelete = true;
				dfd._jsonpCallback = this._jsonpCallback;
				this["jsonp_" + ioArgs.id] = dfd;
			}
			return dfd; // dojo.Deferred
		},

		_deferredCancel: function(/*Deferred*/dfd){
			//summary: canceller function for dojo._ioSetArgs call.

			//DO NOT use "this" and expect it to be dojo.io.script.
			dfd.canceled = true;
			if(dfd.ioArgs.canDelete){
				dojo.io.script._addDeadScript(dfd.ioArgs);
			}
		},

		_deferredOk: function(/*Deferred*/dfd){
			//summary: okHandler function for dojo._ioSetArgs call.

			//DO NOT use "this" and expect it to be dojo.io.script.
			var ioArgs = dfd.ioArgs;

			//Add script to list of things that can be removed.
			if(ioArgs.canDelete){
				dojo.io.script._addDeadScript(ioArgs);
			}

			//Favor JSONP responses, script load events then lastly ioArgs.
			//The ioArgs are goofy, but cannot return the dfd since that stops
			//the callback chain in Deferred. The return value is not that important
			//in that case, probably a checkString case.
			return ioArgs.json || ioArgs.scriptLoaded || ioArgs;
		},

		_deferredError: function(/*Error*/error, /*Deferred*/dfd){
			//summary: errHandler function for dojo._ioSetArgs call.

			if(dfd.ioArgs.canDelete){
				//DO NOT use "this" and expect it to be dojo.io.script.
				if(error.dojoType == "timeout"){
					//For timeouts, remove the script element immediately to
					//avoid a response from it coming back later and causing trouble.
					dojo.io.script.remove(dfd.ioArgs.id, dfd.ioArgs.frameDoc);
				}else{
					dojo.io.script._addDeadScript(dfd.ioArgs);
				}
			}
			console.log("dojo.io.script error", error);
			return error;
		},

		_deadScripts: [],
		_counter: 1,

		_addDeadScript: function(/*Object*/ioArgs){
			//summary: sets up an entry in the deadScripts array.
			dojo.io.script._deadScripts.push({id: ioArgs.id, frameDoc: ioArgs.frameDoc});
			//Being extra paranoid about leaks:
			ioArgs.frameDoc = null;
		},

		_validCheck: function(/*Deferred*/dfd){
			//summary: inflight check function to see if dfd is still valid.

			//Do script cleanup here. We wait for one inflight pass
			//to make sure we don't get any weird things by trying to remove a script
			//tag that is part of the call chain (IE 6 has been known to
			//crash in that case).
			var _self = dojo.io.script;
			var deadScripts = _self._deadScripts;
			if(deadScripts && deadScripts.length > 0){
				for(var i = 0; i < deadScripts.length; i++){
					//Remove the script tag
					_self.remove(deadScripts[i].id, deadScripts[i].frameDoc);
					deadScripts[i].frameDoc = null;
				}
				dojo.io.script._deadScripts = [];
			}

			return true;
		},

		_ioCheck: function(/*Deferred*/dfd){
			//summary: inflight check function to see if IO finished.
			var ioArgs = dfd.ioArgs;
			//Check for finished jsonp
			if(ioArgs.json || (ioArgs.scriptLoaded && !ioArgs.args.checkString)){
				return true;
			}

			//Check for finished "checkString" case.
			var checkString = ioArgs.args.checkString;
			return checkString && eval("typeof(" + checkString + ") != 'undefined'");


		},

		_resHandle: function(/*Deferred*/dfd){
			//summary: inflight function to handle a completed response.
			if(dojo.io.script._ioCheck(dfd)){
				dfd.callback(dfd);
			}else{
				//This path should never happen since the only way we can get
				//to _resHandle is if _ioCheck is true.
				dfd.errback(new Error("inconceivable dojo.io.script._resHandle error"));
			}
		},

		_canAttach: function(/*Object*/ioArgs){
			//summary: A method that can be overridden by other modules
			//to control when the script attachment occurs.
			return true;
		},

		_jsonpCallback: function(/*JSON Object*/json){
			//summary:
			//		generic handler for jsonp callback. A pointer to this function
			//		is used for all jsonp callbacks.  NOTE: the "this" in this
			//		function will be the Deferred object that represents the script
			//		request.
			this.ioArgs.json = json;
		}
	};

	return dojo.io.script;
});

},
'esri/layers/layer':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.layer");

dojo.require("esri.utils");

dojo.declare("esri.layers.Layer", null, {
    constructor: function(/*String*/ url, /*Object?*/ options) {
      //summary: Creates a new Layer that can be added onto a map
      // url: String: Url to resource to display layer on map
      // options: Object?: Initial options for layer
      //        : id: String: Layer id to assign to this layer. If not assigned, will be assigned by esri.Map
      //        : visible: boolean: Initial visibility of layer
      //        : opacity: double: Initial opacity of layer

      // TEST
      // Need to add test cases for the various url-options scenarios 
      // handled here:
      //  TiledLayer(url)
      //  TiledLayer(url, options)
      //  DynamicLayer(url)
      //  DynamicLayer(url, options)
      //  GraphicsLayer()
      //  GraphicsLayer(options)
      //  VETiledLayer()
      //  VETiledLayer(options)
      //  OSM()
      //  OSM(options)
      //  WMS()
      //  WMS(options)
      //  FeatureLayer(url)
      //  FeatureLayer(url, options)
      //  FeatureLayer(featureCollection)
      //  FeatureLayer(featureCollection, options)

      //members to be used by inheriting classes
      if (url && dojo.isString(url)) {
        this._url = esri.urlToObject(this.url = url);
      }
      else {
        this.url = (this._url = null);
        //assuming the options specified instead of url (for example: Graphics Layer & VETiledLayer)
        options = options || url;
        
        // NOTE
        // new FeatureLayer(featureCollection):
        // This will result in options pointing to
        // the collection object. Let's check.
        if (options && options.layerDefinition) {
          options = null;
        }
      }

      this._map = this._div = null;
      this.normalization = true;

      if (options) {
        if (options.id) {
          this.id = options.id;
        }
        if (options.visible === false) {
          this.visible = false;
        }
        if (options.opacity !== undefined) {
          this.opacity = options.opacity;
        }
      }
      
      this._errorHandler = dojo.hitch(this, this._errorHandler);
    },

    //id: String: Id of layer as specified by user or set when added to map
    id: null,
    //visible: boolean: Whether layer is currently visible
    visible: true,
    // //opacity: double (0-1): Opacity of layer
    // opacity: 1,
    //loaded: boolean: True if layer has been loaded, else false
    loaded: false,

    //PRIVATE METHODS

    // _opacityChangeHandler: function(/*Number*/ value) {
    //   //summary: Method to handle changing opacity on a layer
    //   // var djs = dojo.style;
    //   // dojo.forEach(this._div.childNodes, function(node) {
    //   //   djs(node, "opacity", value);
    //   // });
    //   dojo.style(this._div, "opacity", value);
    // },
    
    _errorHandler: function(err) {
      this.onError(err);
    },

    //METHODS TO BE OVERRIDDEN BY INHERITING CLASSES
    _setMap: function(/*esri.Map*/ map, /*HTMLElement*/ divContainer, /*Number*/ index, /*Object*/ lod) {
      //summary: The _setMap is called by the map when the layer successfully completes
      //loads and fires the onLoad event, or isLoaded is true when calling map.addLayer.
      // map: esri.Map: Map within which layer is added
      // divContainer: HTMLElement: Div whose child this._div is to be added
      // index: Number: Index of layer in map
      // lod: Object: Map base layer's Level Of Detail (only if base layer is ArcGISTiledMapServiceLayer)
      // returns: HTMLElement: Reference to this._div
    },

    _unsetMap: function(/*esri.Map*/ map, /*HTMLElement*/ container) {
      //summary: The _unsetMap is called by the map when the layer is to be removed
    },

    _cleanUp: function() {
      //summary: Disconnect all mouse event
      this._map = this._div = null;
    },
  
    _fireUpdateStart: function() {
      if (this.updating) {
        return;
      }
      this.updating = true;
      this.onUpdateStart();
      
      // Notify map
      if (this._map) {
        this._map._incr();
      }
    },
    
    _fireUpdateEnd: function(error, info) {
      this.updating = false;
      this.onUpdateEnd(error, info);
      
      // Notify map
      if (this._map) {
        this._map._decr();
      }
    },
    
    _getToken: function() {
      var url = this._url, crd = this.credential;
      
      // TODO
      // If credential.token has expired, initiate token refresh
      
      // 1. Note that url.query.token is looked at first
      // 2. this.credential will be available if the sub-classes called
      //    _findCredential after they are loaded.
      // 3. Also note that reading directly from the "credential" object 
      //    ensures token freshness
      return (url && url.query && url.query.token) || (crd && crd.token) || undefined;
    },
    
    _findCredential: function() {
      this.credential = esri.id && this._url && esri.id.findCredential(this._url.path);
    },
    
    _useSSL: function() {
      var urlObject = this._url, re = /^http:/i, rep = "https:";
      
      if (this.url) {
        this.url = this.url.replace(re, rep);
      }
      
      if (urlObject && urlObject.path) {
        urlObject.path = urlObject.path.replace(re, rep);
      }
    },
    
    refresh: function() {
      //to be implemented by children
    },

    //PUBLIC METHODS
    show: function() {
      //summary: Show layer
      this.setVisibility(true);
    },

    hide: function() {
      //summary: Hide layer
      this.setVisibility(false);
    },
  
    // For internal use at this point. Used by
    // overview map widget and intended for 
    // tiled and vetiled layers
    // Have to think about implications with
    // respect to toJson pattern. How it fits
    // in the presence of cache manager.
    getResourceInfo: function() {
      // It is the layer's responsibility to
      // set resourceInfo
      // See VETiledLayer.js::_initLayer and
      // agstiled.js::_initLayer
      var info = this.resourceInfo;
      return dojo.isString(info) ? dojo.fromJson(info) : dojo.clone(info);
    },
    
    setNormalization: function(/*Booelan*/ enable) {
      this.normalization = enable;
    },
    
    setVisibility: function(/*boolean*/ v) {
      if (this.visible !== v) {
        this.visible = v;
        this.onVisibilityChange(this.visible);
      }
    },

    // setOpacity: function(/*double*/ o) {
    //   //summary: Set layer's opacity as displayed in map
    //   // o: double: Opacity, in range 0-1.
    //   if (this.opacity != o) {
    //     this.opacity = o;
    //     this.onOpacityChange(this.opacity);
    //   }
    // },

    //LAYER EVENTS
    onLoad: function() {
      //summary: When layer is loaded
      // arguments[0]: esri.layers.Layer: This layer
    },

    onVisibilityChange: function() {
      //summary: When visibility of layer is changed
      // arguments[0]: boolean: Layer's visibility
    },

    // onOpacityChange: function() {
    //   //summary: When opacity of layer is changed
    //   // arguments[0]: Number: New opacity value
    // },
    
    onUpdate: function() {
      // DEPRECATED AT v2.0
      //summary: Event fired when the layer has been updated. Usually fired
      //         when the layer has finished loading all images. This event
      //         should not be confused with the onLoad which is fired when
      //         the layer finishes loading.
    },

    onUpdateStart: function() {},
    onUpdateEnd: function(/*Error?*/) {},
    
    onError: function() {
      //summary: Error: Event fired whenever there is an error
    }
  }
);

});

},
'*noref':1}});

require(["dojo/i18n"], function(i18n){
i18n._preloadLocalizations("esri/nls/jsapi", ["nl-nl","en-us","da","fi-fi","pt-pt","hu","sk","sl","pl","ca","sv","zh-tw","ar","en-gb","he-il","de-de","ko-kr","ja-jp","ro","az","nb","ru","es-es","th","cs","it-it","pt-br","fr-fr","el","tr","zh-cn"]);
});
// wrapped by build app
define("esri/jsapi", ["dijit","dojo","dojox","dojo/require!esri/main,dojo/fx/Toggler,esri/map,esri/layers/graphics,esri/layers/agstiled,esri/layers/agsdynamic,esri/dijit/InfoWindowLite"], function(dijit,dojo,dojox){
dojo.provide("esri.jsapi");

dojo.require("esri.main");

// At 1.7, dojo.fx lazy loads this module at runtime. We want to have it in the initial download of the library
dojo.require("dojo.fx.Toggler");

        
dojo.require("esri.map");

dojo.require("esri.layers.graphics");
dojo.require("esri.layers.agstiled");
dojo.require("esri.layers.agsdynamic");


  dojo.require("esri.dijit.InfoWindowLite");

});
