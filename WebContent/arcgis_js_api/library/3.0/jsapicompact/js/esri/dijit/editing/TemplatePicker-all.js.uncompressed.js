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
'url:dijit/templates/CheckedMenuItem.html':"<tr class=\"dijitReset dijitMenuItem\" data-dojo-attach-point=\"focusNode\" role=\"menuitemcheckbox\" tabIndex=\"-1\"\r\n\t\tdata-dojo-attach-event=\"onmouseenter:_onHover,onmouseleave:_onUnhover,ondijitclick:_onClick\">\r\n\t<td class=\"dijitReset dijitMenuItemIconCell\" role=\"presentation\">\r\n\t\t<img src=\"${_blankGif}\" alt=\"\" class=\"dijitMenuItemIcon dijitCheckedMenuItemIcon\" data-dojo-attach-point=\"iconNode\"/>\r\n\t\t<span class=\"dijitCheckedMenuItemIconChar\">&#10003;</span>\r\n\t</td>\r\n\t<td class=\"dijitReset dijitMenuItemLabel\" colspan=\"2\" data-dojo-attach-point=\"containerNode,labelNode\"></td>\r\n\t<td class=\"dijitReset dijitMenuItemAccelKey\" style=\"display: none\" data-dojo-attach-point=\"accelKeyNode\"></td>\r\n\t<td class=\"dijitReset dijitMenuArrowCell\" role=\"presentation\">&#160;</td>\r\n</tr>\r\n",
'dojox/grid/DataGrid':function(){
define("dojox/grid/DataGrid", [
	"../main",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/_base/json",
	"dojo/_base/sniff",
	"dojo/_base/declare",
	"./_Grid",
	"./DataSelection",
	"dojo/_base/html"
], function(dojox, array, lang, json, has, declare, _Grid, DataSelection, html){

/*=====
declare("dojox.grid.__DataCellDef", dojox.grid.__CellDef, {
	constructor: function(){
		//	field: String?
		//		The attribute to read from the dojo.data item for the row.
		//  fields: String[]?
		//		An array of fields to grab the values of and pass as an array to the grid
		//	get: Function?
		//		function(rowIndex, item?){} rowIndex is of type Integer, item is of type
		//		Object.  This function will be called when a cell requests data.  Returns
		//		the unformatted data for the cell.
	}
});
=====*/

/*=====
declare("dojox.grid.__DataViewDef", dojox.grid.__ViewDef, {
	constructor: function(){
		//	cells: dojox.grid.__DataCellDef[]|Array[dojox.grid.__DataCellDef[]]?
		//		The structure of the cells within this grid.
		//	defaultCell: dojox.grid.__DataCellDef?
		//		A cell definition with default values for all cells in this view.  If
		//		a property is defined in a cell definition in the "cells" array and
		//		this property, the cell definition's property will override this
		//		property's property.
	}
});
=====*/

var DataGrid = declare("dojox.grid.DataGrid", _Grid, {
	store: null,
	query: null,
	queryOptions: null,
	fetchText: '...',
	sortFields: null,
	
	// updateDelay: int
	//		Time, in milliseconds, to delay updates automatically so that multiple
	//		calls to onSet/onNew/onDelete don't keep rerendering the grid.  Set
	//		to 0 to immediately cause updates.  A higher value will result in
	//		better performance at the expense of responsiveness of the grid.
	updateDelay: 1,

/*=====
	// structure: dojox.grid.__DataViewDef|dojox.grid.__DataViewDef[]|dojox.grid.__DataCellDef[]|Array[dojox.grid.__DataCellDef[]]
	//		View layout defintion.
	structure: '',
=====*/

	// You can specify items instead of a query, if you like.  They do not need
	// to be loaded - but the must be items in the store
	items: null,
	
	_store_connects: null,
	_by_idty: null,
	_by_idx: null,
	_cache: null,
	_pages: null,
	_pending_requests: null,
	_bop: -1,
	_eop: -1,
	_requests: 0,
	rowCount: 0,

	_isLoaded: false,
	_isLoading: false,
	
	//keepSelection: Boolean
	//		Whether keep selection after sort, filter etc.
	keepSelection: false,	
	
	postCreate: function(){
		this._pages = [];
		this._store_connects = [];
		this._by_idty = {};
		this._by_idx = [];
		this._cache = [];
		this._pending_requests = {};

		this._setStore(this.store);
		this.inherited(arguments);
	},
	
	destroy: function(){
		this.selection.destroy();
		this.inherited(arguments);
	},

	createSelection: function(){
		this.selection = new DataSelection(this);
	},

	get: function(inRowIndex, inItem){
		// summary: Default data getter.
		// description:
		//		Provides data to display in a grid cell. Called in grid cell context.
		//		So this.cell.index is the column index.
		// inRowIndex: Integer
		//		Row for which to provide data
		// returns:
		//		Data to display for a given grid cell.
		
		if(inItem && this.field == "_item" && !this.fields){
			return inItem;
		}else if(inItem && this.fields){
			var ret = [];
			var s = this.grid.store;
			array.forEach(this.fields, function(f){
				ret = ret.concat(s.getValues(inItem, f));
			});
			return ret;
		}else if(!inItem && typeof inRowIndex === "string"){
			return this.inherited(arguments);
		}
		return (!inItem ? this.defaultValue : (!this.field ? this.value : (this.field == "_item" ? inItem : this.grid.store.getValue(inItem, this.field))));
	},

	_checkUpdateStatus: function(){
		if(this.updateDelay > 0){
			var iStarted = false;
			if(this._endUpdateDelay){
				clearTimeout(this._endUpdateDelay);
				delete this._endUpdateDelay;
				iStarted = true;
			}
			if(!this.updating){
				this.beginUpdate();
				iStarted = true;
			}
			if(iStarted){
				var _this = this;
				this._endUpdateDelay = setTimeout(function(){
					delete _this._endUpdateDelay;
					_this.endUpdate();
				}, this.updateDelay);
			}
		}
	},
	
	_onSet: function(item, attribute, oldValue, newValue){
		this._checkUpdateStatus();
		var idx = this.getItemIndex(item);
		if(idx>-1){
			this.updateRow(idx);
		}
	},
	
	_createItem: function(item, index){
		var idty = this._hasIdentity ? this.store.getIdentity(item) : json.toJson(this.query) + ":idx:" + index + ":sort:" + json.toJson(this.getSortProps());
		var o = this._by_idty[idty] = { idty: idty, item: item };
		return o;
	},

	_addItem: function(item, index, noUpdate){
		this._by_idx[index] = this._createItem(item, index);
		if(!noUpdate){
			this.updateRow(index);
		}
	},

	_onNew: function(item, parentInfo){
		this._checkUpdateStatus();
		var rowCount = this.get('rowCount');
		this._addingItem = true;
		this.updateRowCount(rowCount+1);
		this._addingItem = false;
		this._addItem(item, rowCount);
		this.showMessage();
	},

	_onDelete: function(item){
		this._checkUpdateStatus();
		var idx = this._getItemIndex(item, true);

		if(idx >= 0){
			// When a row is deleted, all rest rows are shifted down,
			// and migrate from page to page. If some page is not
			// loaded yet empty rows can migrate to initialized pages
			// without refreshing. It causes empty rows in some pages, see:
			// http://bugs.dojotoolkit.org/ticket/6818
			// this code fix this problem by reseting loaded page info
			this._pages = [];
			this._bop = -1;
			this._eop = -1;

			var o = this._by_idx[idx];
			this._by_idx.splice(idx, 1);
			delete this._by_idty[o.idty];
			this.updateRowCount(this.get('rowCount')-1);
			if(this.get('rowCount') === 0){
				this.showMessage(this.noDataMessage);
			}
		}
		if(this.selection.isSelected(idx)){
			this.selection.deselect(idx);
			this.selection.selected.splice(idx, 1);
		}
	},

	_onRevert: function(){
		this._refresh();
	},

	setStore: function(store, query, queryOptions){
		if(this._requestsPending(0)){
			return;
		}
		this._setQuery(query, queryOptions);
		this._setStore(store);
		this._refresh(true);
	},
	
	setQuery: function(query, queryOptions){
		if(this._requestsPending(0)){
			return;
		}
		this._setQuery(query, queryOptions);
		this._refresh(true);
	},
	
	setItems: function(items){
		this.items = items;
		this._setStore(this.store);
		this._refresh(true);
	},
	
	_setQuery: function(query, queryOptions){
		this.query = query;
		this.queryOptions = queryOptions || this.queryOptions;
	},

	_setStore: function(store){
		if(this.store && this._store_connects){
			array.forEach(this._store_connects, this.disconnect, this);
		}
		this.store = store;

		if(this.store){
			var f = this.store.getFeatures();
			var h = [];

			this._canEdit = !!f["dojo.data.api.Write"] && !!f["dojo.data.api.Identity"];
			this._hasIdentity = !!f["dojo.data.api.Identity"];

			if(!!f["dojo.data.api.Notification"] && !this.items){
				h.push(this.connect(this.store, "onSet", "_onSet"));
				h.push(this.connect(this.store, "onNew", "_onNew"));
				h.push(this.connect(this.store, "onDelete", "_onDelete"));
			}
			if(this._canEdit){
				h.push(this.connect(this.store, "revert", "_onRevert"));
			}

			this._store_connects = h;
		}
	},

	_onFetchBegin: function(size, req){
		if(!this.scroller){ return; }
		if(this.rowCount != size){
			if(req.isRender){
				this.scroller.init(size, this.keepRows, this.rowsPerPage);
				this.rowCount = size;
				this._setAutoHeightAttr(this.autoHeight, true);
				this._skipRowRenormalize = true;
				this.prerender();
				this._skipRowRenormalize = false;
			}else{
				this.updateRowCount(size);
			}
		}
		if(!size){
			this.views.render();
			this._resize();
			this.showMessage(this.noDataMessage);
			this.focus.initFocusView();
		}else{
			this.showMessage();
		}
	},

	_onFetchComplete: function(items, req){
		if(!this.scroller){ return; }
		if(items && items.length > 0){
			//console.log(items);
			array.forEach(items, function(item, idx){
				this._addItem(item, req.start+idx, true);
			}, this);
			this.updateRows(req.start, items.length);
			if(req.isRender){
				this.setScrollTop(0);
				this.postrender();
			}else if(this._lastScrollTop){
				this.setScrollTop(this._lastScrollTop);
			}
			if(has("ie")){
				html.setSelectable(this.domNode, this.selectable);
			}	
		}
		delete this._lastScrollTop;
		if(!this._isLoaded){
			this._isLoading = false;
			this._isLoaded = true;
		}
		this._pending_requests[req.start] = false;
	},

	_onFetchError: function(err, req){
		console.log(err);
		delete this._lastScrollTop;
		if(!this._isLoaded){
			this._isLoading = false;
			this._isLoaded = true;
			this.showMessage(this.errorMessage);
		}
		this._pending_requests[req.start] = false;
		this.onFetchError(err, req);
	},

	onFetchError: function(err, req){
	},

	_fetch: function(start, isRender){
		start = start || 0;
		if(this.store && !this._pending_requests[start]){
			if(!this._isLoaded && !this._isLoading){
				this._isLoading = true;
				this.showMessage(this.loadingMessage);
			}
			this._pending_requests[start] = true;
			//console.log("fetch: ", start);
			try{
				if(this.items){
					var items = this.items;
					var store = this.store;
					this.rowsPerPage = items.length;
					var req = {
						start: start,
						count: this.rowsPerPage,
						isRender: isRender
					};
					this._onFetchBegin(items.length, req);
					
					// Load them if we need to
					var waitCount = 0;
					array.forEach(items, function(i){
						if(!store.isItemLoaded(i)){ waitCount++; }
					});
					if(waitCount === 0){
						this._onFetchComplete(items, req);
					}else{
						var onItem = function(item){
							waitCount--;
							if(waitCount === 0){
								this._onFetchComplete(items, req);
							}
						};
						array.forEach(items, function(i){
							if(!store.isItemLoaded(i)){
								store.loadItem({item: i, onItem: onItem, scope: this});
							}
						}, this);
					}
				}else{
					this.store.fetch({
						start: start,
						count: this.rowsPerPage,
						query: this.query,
						sort: this.getSortProps(),
						queryOptions: this.queryOptions,
						isRender: isRender,
						onBegin: lang.hitch(this, "_onFetchBegin"),
						onComplete: lang.hitch(this, "_onFetchComplete"),
						onError: lang.hitch(this, "_onFetchError")
					});
				}
			}catch(e){
				this._onFetchError(e, {start: start, count: this.rowsPerPage});
			}
		}
	},

	_clearData: function(){
		this.updateRowCount(0);
		this._by_idty = {};
		this._by_idx = [];
		this._pages = [];
		this._bop = this._eop = -1;
		this._isLoaded = false;
		this._isLoading = false;
	},

	getItem: function(idx){
		var data = this._by_idx[idx];
		if(!data||(data&&!data.item)){
			this._preparePage(idx);
			return null;
		}
		return data.item;
	},

	getItemIndex: function(item){
		return this._getItemIndex(item, false);
	},
	
	_getItemIndex: function(item, isDeleted){
		if(!isDeleted && !this.store.isItem(item)){
			return -1;
		}

		var idty = this._hasIdentity ? this.store.getIdentity(item) : null;

		for(var i=0, l=this._by_idx.length; i<l; i++){
			var d = this._by_idx[i];
			if(d && ((idty && d.idty == idty) || (d.item === item))){
				return i;
			}
		}
		return -1;
	},

	filter: function(query, reRender){
		this.query = query;
		if(reRender){
			this._clearData();
		}
		this._fetch();
	},

	_getItemAttr: function(idx, attr){
		var item = this.getItem(idx);
		return (!item ? this.fetchText : this.store.getValue(item, attr));
	},

	// rendering
	_render: function(){
		if(this.domNode.parentNode){
			this.scroller.init(this.get('rowCount'), this.keepRows, this.rowsPerPage);
			this.prerender();
			this._fetch(0, true);
		}
	},

	// paging
	_requestsPending: function(inRowIndex){
		return this._pending_requests[inRowIndex];
	},

	_rowToPage: function(inRowIndex){
		return (this.rowsPerPage ? Math.floor(inRowIndex / this.rowsPerPage) : inRowIndex);
	},

	_pageToRow: function(inPageIndex){
		return (this.rowsPerPage ? this.rowsPerPage * inPageIndex : inPageIndex);
	},

	_preparePage: function(inRowIndex){
		if((inRowIndex < this._bop || inRowIndex >= this._eop) && !this._addingItem){
			var pageIndex = this._rowToPage(inRowIndex);
			this._needPage(pageIndex);
			this._bop = pageIndex * this.rowsPerPage;
			this._eop = this._bop + (this.rowsPerPage || this.get('rowCount'));
		}
	},

	_needPage: function(inPageIndex){
		if(!this._pages[inPageIndex]){
			this._pages[inPageIndex] = true;
			this._requestPage(inPageIndex);
		}
	},

	_requestPage: function(inPageIndex){
		var row = this._pageToRow(inPageIndex);
		var count = Math.min(this.rowsPerPage, this.get('rowCount') - row);
		if(count > 0){
			this._requests++;
			if(!this._requestsPending(row)){
				setTimeout(lang.hitch(this, "_fetch", row, false), 1);
				//this.requestRows(row, count);
			}
		}
	},

	getCellName: function(inCell){
		return inCell.field;
		//console.log(inCell);
	},

	_refresh: function(isRender){
		this._clearData();
		this._fetch(0, isRender);
	},

	sort: function(){
		this.edit.apply();
		this._lastScrollTop = this.scrollTop;
		this._refresh();
	},

	canSort: function(){
		return (!this._isLoading);
	},

	getSortProps: function(){
		var c = this.getCell(this.getSortIndex());
		if(!c){
			if(this.sortFields){
				return this.sortFields;
			}
			return null;
		}else{
			var desc = c["sortDesc"];
			var si = !(this.sortInfo>0);
			if(typeof desc == "undefined"){
				desc = si;
			}else{
				desc = si ? !desc : desc;
			}
			return [{ attribute: c.field, descending: desc }];
		}
	},

	styleRowState: function(inRow){
		// summary: Perform row styling
		if(this.store && this.store.getState){
			var states=this.store.getState(inRow.index), c='';
			for(var i=0, ss=["inflight", "error", "inserting"], s; s=ss[i]; i++){
				if(states[s]){
					c = ' dojoxGridRow-' + s;
					break;
				}
			}
			inRow.customClasses += c;
		}
	},

	onStyleRow: function(inRow){
		this.styleRowState(inRow);
		this.inherited(arguments);
	},

	// editing
	canEdit: function(inCell, inRowIndex){
		return this._canEdit;
	},

	_copyAttr: function(idx, attr){
		var row = {};
		var backstop = {};
		var src = this.getItem(idx);
		return this.store.getValue(src, attr);
	},

	doStartEdit: function(inCell, inRowIndex){
		if(!this._cache[inRowIndex]){
			this._cache[inRowIndex] = this._copyAttr(inRowIndex, inCell.field);
		}
		this.onStartEdit(inCell, inRowIndex);
	},

	doApplyCellEdit: function(inValue, inRowIndex, inAttrName){
		this.store.fetchItemByIdentity({
			identity: this._by_idx[inRowIndex].idty,
			onItem: lang.hitch(this, function(item){
				var oldValue = this.store.getValue(item, inAttrName);
				if(typeof oldValue == 'number'){
					inValue = isNaN(inValue) ? inValue : parseFloat(inValue);
				}else if(typeof oldValue == 'boolean'){
					inValue = inValue == 'true' ? true : inValue == 'false' ? false : inValue;
				}else if(oldValue instanceof Date){
					var asDate = new Date(inValue);
					inValue = isNaN(asDate.getTime()) ? inValue : asDate;
				}
				this.store.setValue(item, inAttrName, inValue);
				this.onApplyCellEdit(inValue, inRowIndex, inAttrName);
			})
		});
	},

	doCancelEdit: function(inRowIndex){
		var cache = this._cache[inRowIndex];
		if(cache){
			this.updateRow(inRowIndex);
			delete this._cache[inRowIndex];
		}
		this.onCancelEdit.apply(this, arguments);
	},

	doApplyEdit: function(inRowIndex, inDataAttr){
		var cache = this._cache[inRowIndex];
		/*if(cache){
			var data = this.getItem(inRowIndex);
			if(this.store.getValue(data, inDataAttr) != cache){
				this.update(cache, data, inRowIndex);
			}
			delete this._cache[inRowIndex];
		}*/
		this.onApplyEdit(inRowIndex);
	},

	removeSelectedRows: function(){
		// summary:
		//		Remove the selected rows from the grid.
		if(this._canEdit){
			this.edit.apply();
			var fx = lang.hitch(this, function(items){
				if(items.length){
					array.forEach(items, this.store.deleteItem, this.store);
					this.selection.clear();
				}
			});
			if(this.allItemsSelected){
				this.store.fetch({
							query: this.query,
							queryOptions: this.queryOptions,
							onComplete: fx});
			}else{
				fx(this.selection.getSelected());
			}
		}
	}
});

DataGrid.cell_markupFactory = function(cellFunc, node, cellDef){
	var field = lang.trim(html.attr(node, "field")||"");
	if(field){
		cellDef.field = field;
	}
	cellDef.field = cellDef.field||cellDef.name;
	var fields = lang.trim(html.attr(node, "fields")||"");
	if(fields){
		cellDef.fields = fields.split(",");
	}
	if(cellFunc){
		cellFunc(node, cellDef);
	}
};

DataGrid.markupFactory = function(props, node, ctor, cellFunc){
	return _Grid.markupFactory(props, node, ctor,
					lang.partial(DataGrid.cell_markupFactory, cellFunc));
};

return DataGrid;

});
},
'dijit/_TemplatedMixin':function(){
define("dijit/_TemplatedMixin", [
	"dojo/_base/lang", // lang.getObject
	"dojo/touch",
	"./_WidgetBase",
	"dojo/string", // string.substitute string.trim
	"dojo/cache",	// dojo.cache
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/dom-construct", // domConstruct.destroy, domConstruct.toDom
	"dojo/_base/sniff", // has("ie")
	"dojo/_base/unload", // unload.addOnWindowUnload
	"dojo/_base/window" // win.doc
], function(lang, touch, _WidgetBase, string, cache, array, declare, domConstruct, has, unload, win) {

/*=====
	var _WidgetBase = dijit._WidgetBase;
=====*/

	// module:
	//		dijit/_TemplatedMixin
	// summary:
	//		Mixin for widgets that are instantiated from a template

	var _TemplatedMixin = declare("dijit._TemplatedMixin", null, {
		// summary:
		//		Mixin for widgets that are instantiated from a template

		// templateString: [protected] String
		//		A string that represents the widget template.
		//		Use in conjunction with dojo.cache() to load from a file.
		templateString: null,

		// templatePath: [protected deprecated] String
		//		Path to template (HTML file) for this widget relative to dojo.baseUrl.
		//		Deprecated: use templateString with require([... "dojo/text!..."], ...) instead
		templatePath: null,

		// skipNodeCache: [protected] Boolean
		//		If using a cached widget template nodes poses issues for a
		//		particular widget class, it can set this property to ensure
		//		that its template is always re-built from a string
		_skipNodeCache: false,

		// _earlyTemplatedStartup: Boolean
		//		A fallback to preserve the 1.0 - 1.3 behavior of children in
		//		templates having their startup called before the parent widget
		//		fires postCreate. Defaults to 'false', causing child widgets to
		//		have their .startup() called immediately before a parent widget
		//		.startup(), but always after the parent .postCreate(). Set to
		//		'true' to re-enable to previous, arguably broken, behavior.
		_earlyTemplatedStartup: false,

/*=====
		// _attachPoints: [private] String[]
		//		List of widget attribute names associated with data-dojo-attach-point=... in the
		//		template, ex: ["containerNode", "labelNode"]
 		_attachPoints: [],
 =====*/

/*=====
		// _attachEvents: [private] Handle[]
		//		List of connections associated with data-dojo-attach-event=... in the
		//		template
 		_attachEvents: [],
 =====*/

		constructor: function(){
			this._attachPoints = [];
			this._attachEvents = [];
		},

		_stringRepl: function(tmpl){
			// summary:
			//		Does substitution of ${foo} type properties in template string
			// tags:
			//		private
			var className = this.declaredClass, _this = this;
			// Cache contains a string because we need to do property replacement
			// do the property replacement
			return string.substitute(tmpl, this, function(value, key){
				if(key.charAt(0) == '!'){ value = lang.getObject(key.substr(1), false, _this); }
				if(typeof value == "undefined"){ throw new Error(className+" template:"+key); } // a debugging aide
				if(value == null){ return ""; }

				// Substitution keys beginning with ! will skip the transform step,
				// in case a user wishes to insert unescaped markup, e.g. ${!foo}
				return key.charAt(0) == "!" ? value :
					// Safer substitution, see heading "Attribute values" in
					// http://www.w3.org/TR/REC-html40/appendix/notes.html#h-B.3.2
					value.toString().replace(/"/g,"&quot;"); //TODO: add &amp? use encodeXML method?
			}, this);
		},

		buildRendering: function(){
			// summary:
			//		Construct the UI for this widget from a template, setting this.domNode.
			// tags:
			//		protected

			if(!this.templateString){
				this.templateString = cache(this.templatePath, {sanitize: true});
			}

			// Lookup cached version of template, and download to cache if it
			// isn't there already.  Returns either a DomNode or a string, depending on
			// whether or not the template contains ${foo} replacement parameters.
			var cached = _TemplatedMixin.getCachedTemplate(this.templateString, this._skipNodeCache);

			var node;
			if(lang.isString(cached)){
				node = domConstruct.toDom(this._stringRepl(cached));
				if(node.nodeType != 1){
					// Flag common problems such as templates with multiple top level nodes (nodeType == 11)
					throw new Error("Invalid template: " + cached);
				}
			}else{
				// if it's a node, all we have to do is clone it
				node = cached.cloneNode(true);
			}

			this.domNode = node;

			// Call down to _Widget.buildRendering() to get base classes assigned
			// TODO: change the baseClass assignment to _setBaseClassAttr
			this.inherited(arguments);

			// recurse through the node, looking for, and attaching to, our
			// attachment points and events, which should be defined on the template node.
			this._attachTemplateNodes(node, function(n,p){ return n.getAttribute(p); });

			this._beforeFillContent();		// hook for _WidgetsInTemplateMixin

			this._fillContent(this.srcNodeRef);
		},

		_beforeFillContent: function(){
		},

		_fillContent: function(/*DomNode*/ source){
			// summary:
			//		Relocate source contents to templated container node.
			//		this.containerNode must be able to receive children, or exceptions will be thrown.
			// tags:
			//		protected
			var dest = this.containerNode;
			if(source && dest){
				while(source.hasChildNodes()){
					dest.appendChild(source.firstChild);
				}
			}
		},

		_attachTemplateNodes: function(rootNode, getAttrFunc){
			// summary:
			//		Iterate through the template and attach functions and nodes accordingly.
			//		Alternately, if rootNode is an array of widgets, then will process data-dojo-attach-point
			//		etc. for those widgets.
			// description:
			//		Map widget properties and functions to the handlers specified in
			//		the dom node and it's descendants. This function iterates over all
			//		nodes and looks for these properties:
			//			* dojoAttachPoint/data-dojo-attach-point
			//			* dojoAttachEvent/data-dojo-attach-event
			// rootNode: DomNode|Widget[]
			//		the node to search for properties. All children will be searched.
			// getAttrFunc: Function
			//		a function which will be used to obtain property for a given
			//		DomNode/Widget
			// tags:
			//		private

			var nodes = lang.isArray(rootNode) ? rootNode : (rootNode.all || rootNode.getElementsByTagName("*"));
			var x = lang.isArray(rootNode) ? 0 : -1;
			for(; x<nodes.length; x++){
				var baseNode = (x == -1) ? rootNode : nodes[x];
				if(this.widgetsInTemplate && (getAttrFunc(baseNode, "dojoType") || getAttrFunc(baseNode, "data-dojo-type"))){
					continue;
				}
				// Process data-dojo-attach-point
				var attachPoint = getAttrFunc(baseNode, "dojoAttachPoint") || getAttrFunc(baseNode, "data-dojo-attach-point");
				if(attachPoint){
					var point, points = attachPoint.split(/\s*,\s*/);
					while((point = points.shift())){
						if(lang.isArray(this[point])){
							this[point].push(baseNode);
						}else{
							this[point]=baseNode;
						}
						this._attachPoints.push(point);
					}
				}

				// Process data-dojo-attach-event
				var attachEvent = getAttrFunc(baseNode, "dojoAttachEvent") || getAttrFunc(baseNode, "data-dojo-attach-event");
				if(attachEvent){
					// NOTE: we want to support attributes that have the form
					// "domEvent: nativeEvent; ..."
					var event, events = attachEvent.split(/\s*,\s*/);
					var trim = lang.trim;
					while((event = events.shift())){
						if(event){
							var thisFunc = null;
							if(event.indexOf(":") != -1){
								// oh, if only JS had tuple assignment
								var funcNameArr = event.split(":");
								event = trim(funcNameArr[0]);
								thisFunc = trim(funcNameArr[1]);
							}else{
								event = trim(event);
							}
							if(!thisFunc){
								thisFunc = event;
							}
							// Map "press", "move" and "release" to keys.touch, keys.move, keys.release
							this._attachEvents.push(this.connect(baseNode, touch[event] || event, thisFunc));
						}
					}
				}
			}
		},

		destroyRendering: function(){
			// Delete all attach points to prevent IE6 memory leaks.
			array.forEach(this._attachPoints, function(point){
				delete this[point];
			}, this);
			this._attachPoints = [];

			// And same for event handlers
			array.forEach(this._attachEvents, this.disconnect, this);
			this._attachEvents = [];

			this.inherited(arguments);
		}
	});

	// key is templateString; object is either string or DOM tree
	_TemplatedMixin._templateCache = {};

	_TemplatedMixin.getCachedTemplate = function(templateString, alwaysUseString){
		// summary:
		//		Static method to get a template based on the templatePath or
		//		templateString key
		// templateString: String
		//		The template
		// alwaysUseString: Boolean
		//		Don't cache the DOM tree for this template, even if it doesn't have any variables
		// returns: Mixed
		//		Either string (if there are ${} variables that need to be replaced) or just
		//		a DOM tree (if the node can be cloned directly)

		// is it already cached?
		var tmplts = _TemplatedMixin._templateCache;
		var key = templateString;
		var cached = tmplts[key];
		if(cached){
			try{
				// if the cached value is an innerHTML string (no ownerDocument) or a DOM tree created within the current document, then use the current cached value
				if(!cached.ownerDocument || cached.ownerDocument == win.doc){
					// string or node of the same document
					return cached;
				}
			}catch(e){ /* squelch */ } // IE can throw an exception if cached.ownerDocument was reloaded
			domConstruct.destroy(cached);
		}

		templateString = string.trim(templateString);

		if(alwaysUseString || templateString.match(/\$\{([^\}]+)\}/g)){
			// there are variables in the template so all we can do is cache the string
			return (tmplts[key] = templateString); //String
		}else{
			// there are no variables in the template so we can cache the DOM tree
			var node = domConstruct.toDom(templateString);
			if(node.nodeType != 1){
				throw new Error("Invalid template: " + templateString);
			}
			return (tmplts[key] = node); //Node
		}
	};

	if(has("ie")){
		unload.addOnWindowUnload(function(){
			var cache = _TemplatedMixin._templateCache;
			for(var key in cache){
				var value = cache[key];
				if(typeof value == "object"){ // value is either a string or a DOM node template
					domConstruct.destroy(value);
				}
				delete cache[key];
			}
		});
	}

	// These arguments can be specified for widgets which are used in templates.
	// Since any widget can be specified as sub widgets in template, mix it
	// into the base widget class.  (This is a hack, but it's effective.)
	lang.extend(_WidgetBase,{
		dojoAttachEvent: "",
		dojoAttachPoint: ""
	});

	return _TemplatedMixin;
});

},
'dojox/grid/_FocusManager':function(){
define("dojox/grid/_FocusManager", [
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/_base/declare",
	"dojo/_base/connect",
	"dojo/_base/event",
	"dojo/_base/sniff",
	"dojo/query",
	"./util",
	"dojo/_base/html"
], function(array, lang, declare, connect, event, has, query, util, html){

// focus management
return declare("dojox.grid._FocusManager", null, {
	// summary:
	//	Controls grid cell focus. Owned by grid and used internally for focusing.
	//	Note: grid cell actually receives keyboard input only when cell is being edited.
	constructor: function(inGrid){
		this.grid = inGrid;
		this.cell = null;
		this.rowIndex = -1;
		this._connects = [];
		this._headerConnects = [];
		this.headerMenu = this.grid.headerMenu;
		this._connects.push(connect.connect(this.grid.domNode, "onfocus", this, "doFocus"));
		this._connects.push(connect.connect(this.grid.domNode, "onblur", this, "doBlur"));
		this._connects.push(connect.connect(this.grid.domNode, "mousedown", this, "_mouseDown"));
		this._connects.push(connect.connect(this.grid.domNode, "mouseup", this, "_mouseUp"));
		this._connects.push(connect.connect(this.grid.domNode, "oncontextmenu", this, "doContextMenu"));
		this._connects.push(connect.connect(this.grid.lastFocusNode, "onfocus", this, "doLastNodeFocus"));
		this._connects.push(connect.connect(this.grid.lastFocusNode, "onblur", this, "doLastNodeBlur"));
		this._connects.push(connect.connect(this.grid,"_onFetchComplete", this, "_delayedCellFocus"));
		this._connects.push(connect.connect(this.grid,"postrender", this, "_delayedHeaderFocus"));
	},
	destroy: function(){
		array.forEach(this._connects, connect.disconnect);
		array.forEach(this._headerConnects, connect.disconnect);
		delete this.grid;
		delete this.cell;
	},
	_colHeadNode: null,
	_colHeadFocusIdx: null,
	_contextMenuBindNode: null,
	tabbingOut: false,
	focusClass: "dojoxGridCellFocus",
	focusView: null,
	initFocusView: function(){
		this.focusView = this.grid.views.getFirstScrollingView() || this.focusView || this.grid.views.views[0];
		this._initColumnHeaders();
	},
	isFocusCell: function(inCell, inRowIndex){
		// summary:
		//	states if the given cell is focused
		// inCell: object
		//	grid cell object
		// inRowIndex: int
		//	grid row index
		// returns:
		//	true of the given grid cell is focused
		return (this.cell == inCell) && (this.rowIndex == inRowIndex);
	},
	isLastFocusCell: function(){
		if(this.cell){
			return (this.rowIndex == this.grid.rowCount-1) && (this.cell.index == this.grid.layout.cellCount-1);
		}
		return false;
	},
	isFirstFocusCell: function(){
		if(this.cell){
			return (this.rowIndex === 0) && (this.cell.index === 0);
		}
		return false;
	},
	isNoFocusCell: function(){
		return (this.rowIndex < 0) || !this.cell;
	},
	isNavHeader: function(){
		// summary:
		//	states whether currently navigating among column headers.
		// returns:
		//	true if focus is on a column header; false otherwise.
		return (!!this._colHeadNode);
	},
	getHeaderIndex: function(){
		// summary:
		//	if one of the column headers currently has focus, return its index.
		// returns:
		//	index of the focused column header, or -1 if none have focus.
		if(this._colHeadNode){
			return array.indexOf(this._findHeaderCells(), this._colHeadNode);
		}else{
			return -1;
		}
	},
	_focusifyCellNode: function(inBork){
		var n = this.cell && this.cell.getNode(this.rowIndex);
		if(n){
			html.toggleClass(n, this.focusClass, inBork);
			if(inBork){
				var sl = this.scrollIntoView();
				try{
					if(!this.grid.edit.isEditing()){
						util.fire(n, "focus");
						if(sl){ this.cell.view.scrollboxNode.scrollLeft = sl; }
					}
				}catch(e){}
			}
		}
	},
	_delayedCellFocus: function(){
		if(this.isNavHeader()||!this.grid.focused){
				return;
		}
		var n = this.cell && this.cell.getNode(this.rowIndex);
		if(n){
			try{
				if(!this.grid.edit.isEditing()){
					html.toggleClass(n, this.focusClass, true);
					if(this._colHeadNode){
						this.blurHeader();
					}
					util.fire(n, "focus");
				}
			}
			catch(e){}
		}
	},
	_delayedHeaderFocus: function(){
		if(this.isNavHeader()){
			this.focusHeader();
			this.grid.domNode.focus();
		}
	},
	_initColumnHeaders: function(){
		array.forEach(this._headerConnects, connect.disconnect);
		this._headerConnects = [];
		var headers = this._findHeaderCells();
		for(var i = 0; i < headers.length; i++){
			this._headerConnects.push(connect.connect(headers[i], "onfocus", this, "doColHeaderFocus"));
			this._headerConnects.push(connect.connect(headers[i], "onblur", this, "doColHeaderBlur"));
		}
	},
	_findHeaderCells: function(){
		// This should be a one liner:
		//	query("th[tabindex=-1]", this.grid.viewsHeaderNode);
		// But there is a bug in query() for IE -- see trac #7037.
		var allHeads = query("th", this.grid.viewsHeaderNode);
		var headers = [];
		for (var i = 0; i < allHeads.length; i++){
			var aHead = allHeads[i];
			var hasTabIdx = html.hasAttr(aHead, "tabIndex");
			var tabindex = html.attr(aHead, "tabIndex");
			if (hasTabIdx && tabindex < 0) {
				headers.push(aHead);
			}
		}
		return headers;
	},
	_setActiveColHeader: function(/*Node*/colHeaderNode, /*Integer*/colFocusIdx, /*Integer*/ prevColFocusIdx){
		//console.log("setActiveColHeader() - colHeaderNode:colFocusIdx:prevColFocusIdx = " + colHeaderNode + ":" + colFocusIdx + ":" + prevColFocusIdx);
		this.grid.domNode.setAttribute("aria-activedescendant",colHeaderNode.id);
		if (prevColFocusIdx != null && prevColFocusIdx >= 0 && prevColFocusIdx != colFocusIdx){
			html.toggleClass(this._findHeaderCells()[prevColFocusIdx],this.focusClass,false);
		}
		html.toggleClass(colHeaderNode,this.focusClass, true);
		this._colHeadNode = colHeaderNode;
		this._colHeadFocusIdx = colFocusIdx;
		this._scrollHeader(this._colHeadFocusIdx);
	},
	scrollIntoView: function(){
		var info = (this.cell ? this._scrollInfo(this.cell) : null);
		if(!info || !info.s){
			return null;
		}
		var rt = this.grid.scroller.findScrollTop(this.rowIndex);
		// place cell within horizontal view
		if(info.n && info.sr){
			if(info.n.offsetLeft + info.n.offsetWidth > info.sr.l + info.sr.w){
				info.s.scrollLeft = info.n.offsetLeft + info.n.offsetWidth - info.sr.w;
			}else if(info.n.offsetLeft < info.sr.l){
				info.s.scrollLeft = info.n.offsetLeft;
			}
		}
		// place cell within vertical view
		if(info.r && info.sr){
			if(rt + info.r.offsetHeight > info.sr.t + info.sr.h){
				this.grid.setScrollTop(rt + info.r.offsetHeight - info.sr.h);
			}else if(rt < info.sr.t){
				this.grid.setScrollTop(rt);
			}
		}

		return info.s.scrollLeft;
	},
	_scrollInfo: function(cell, domNode){
		if(cell){
			var cl = cell,
				sbn = cl.view.scrollboxNode,
				sbnr = {
					w: sbn.clientWidth,
					l: sbn.scrollLeft,
					t: sbn.scrollTop,
					h: sbn.clientHeight
				},
				rn = cl.view.getRowNode(this.rowIndex);
			return {
				c: cl,
				s: sbn,
				sr: sbnr,
				n: (domNode ? domNode : cell.getNode(this.rowIndex)),
				r: rn
			};
		}
		return null;
	},
	_scrollHeader: function(currentIdx){
		var info = null;
		if(this._colHeadNode){
			var cell = this.grid.getCell(currentIdx);
			if(!cell){ return; }
			info = this._scrollInfo(cell, cell.getNode(0));
		}
		if(info && info.s && info.sr && info.n){
			// scroll horizontally as needed.
			var scroll = info.sr.l + info.sr.w;
			if(info.n.offsetLeft + info.n.offsetWidth > scroll){
				info.s.scrollLeft = info.n.offsetLeft + info.n.offsetWidth - info.sr.w;
			}else if(info.n.offsetLeft < info.sr.l){
				info.s.scrollLeft = info.n.offsetLeft;
			}else if(has("ie") <= 7 && cell && cell.view.headerNode){
				// Trac 7158: scroll dojoxGridHeader for IE7 and lower
				cell.view.headerNode.scrollLeft = info.s.scrollLeft;
			}
		}
	},
	_isHeaderHidden: function(){
		// summary:
		//		determine if the grid headers are hidden
		//		relies on documented technique of setting .dojoxGridHeader { display:none; }
		// returns: Boolean
		//		true if headers are hidden
		//		false if headers are not hidden
		
		var curView = this.focusView;
		if (!curView){
			// find one so we can determine if headers are hidden
			// there is no focusView after adding items to empty grid (test_data_grid_empty.html)
			for (var i = 0, cView; (cView = this.grid.views.views[i]); i++) {
				if(cView.headerNode ){
					curView=cView;
					break;
				}
			}
		}
		return (curView && html.getComputedStyle(curView.headerNode).display == "none");
	},
	colSizeAdjust: function (e, colIdx, delta){ // adjust the column specified by colIdx by the specified delta px
		var headers = this._findHeaderCells();
		var view = this.focusView;
		if (!view) {
			for (var i = 0, cView; (cView = this.grid.views.views[i]); i++) {
				// find first view with a tableMap in order to work with empty grid
				if(cView.header.tableMap.map ){
					view=cView;
					break;
				}
			}
		}
		var curHeader = headers[colIdx];
		if (!view || (colIdx == headers.length-1 && colIdx === 0)){
			return; // can't adjust single col. grid
		}
		view.content.baseDecorateEvent(e);
		// need to adjust event with header cell info since focus is no longer on header cell
		e.cellNode = curHeader; //this.findCellTarget(e.target, e.rowNode);
		e.cellIndex = view.content.getCellNodeIndex(e.cellNode);
		e.cell = (e.cellIndex >= 0 ? this.grid.getCell(e.cellIndex) : null);
		if (view.header.canResize(e)){
			var deltaObj = {
				l: delta
			};
			var drag = view.header.colResizeSetup(e,false);
			view.header.doResizeColumn(drag, null, deltaObj);
			view.update();
		}
	},
	styleRow: function(inRow){
		return;
	},
	setFocusIndex: function(inRowIndex, inCellIndex){
		// summary:
		//	focuses the given grid cell
		// inRowIndex: int
		//	grid row index
		// inCellIndex: int
		//	grid cell index
		this.setFocusCell(this.grid.getCell(inCellIndex), inRowIndex);
	},
	setFocusCell: function(inCell, inRowIndex){
		// summary:
		//	focuses the given grid cell
		// inCell: object
		//	grid cell object
		// inRowIndex: int
		//	grid row index
		if(inCell && !this.isFocusCell(inCell, inRowIndex)){
			this.tabbingOut = false;
			if (this._colHeadNode){
				this.blurHeader();
			}
			this._colHeadNode = this._colHeadFocusIdx = null;
			this.focusGridView();
			this._focusifyCellNode(false);
			this.cell = inCell;
			this.rowIndex = inRowIndex;
			this._focusifyCellNode(true);
		}
		// even if this cell isFocusCell, the document focus may need to be rejiggered
		// call opera on delay to prevent keypress from altering focus
		if(has("opera")){
			setTimeout(lang.hitch(this.grid, 'onCellFocus', this.cell, this.rowIndex), 1);
		}else{
			this.grid.onCellFocus(this.cell, this.rowIndex);
		}
	},
	next: function(){
		// summary:
		//	focus next grid cell
		if(this.cell){
			var row=this.rowIndex, col=this.cell.index+1, cc=this.grid.layout.cellCount-1, rc=this.grid.rowCount-1;
			if(col > cc){
				col = 0;
				row++;
			}
			if(row > rc){
				col = cc;
				row = rc;
			}
			if(this.grid.edit.isEditing()){ //when editing, only navigate to editable cells
				var nextCell = this.grid.getCell(col);
				if (!this.isLastFocusCell() && (!nextCell.editable ||
					this.grid.canEdit && !this.grid.canEdit(nextCell, row))){
					this.cell=nextCell;
					this.rowIndex=row;
					this.next();
					return;
				}
			}
			this.setFocusIndex(row, col);
		}
	},
	previous: function(){
		// summary:
		//	focus previous grid cell
		if(this.cell){
			var row=(this.rowIndex || 0), col=(this.cell.index || 0) - 1;
			if(col < 0){
				col = this.grid.layout.cellCount-1;
				row--;
			}
			if(row < 0){
				row = 0;
				col = 0;
			}
			if(this.grid.edit.isEditing()){ //when editing, only navigate to editable cells
				var prevCell = this.grid.getCell(col);
				if (!this.isFirstFocusCell() && !prevCell.editable){
					this.cell=prevCell;
					this.rowIndex=row;
					this.previous();
					return;
				}
			}
			this.setFocusIndex(row, col);
		}
	},
	move: function(inRowDelta, inColDelta) {
		// summary:
		//	focus grid cell or  simulate focus to column header based on position relative to current focus
		// inRowDelta: int
		// vertical distance from current focus
		// inColDelta: int
		// horizontal distance from current focus

		var colDir = inColDelta < 0 ? -1 : 1;
		// Handle column headers.
		if(this.isNavHeader()){
			var headers = this._findHeaderCells();
			var savedIdx = currentIdx = array.indexOf(headers, this._colHeadNode);
			currentIdx += inColDelta;
			while(currentIdx >=0 && currentIdx < headers.length && headers[currentIdx].style.display == "none"){
				// skip over hidden column headers
				currentIdx += colDir;
			}
			if((currentIdx >= 0) && (currentIdx < headers.length)){
				this._setActiveColHeader(headers[currentIdx],currentIdx, savedIdx);
			}
		}else{
			if(this.cell){
				// Handle grid proper.
				var sc = this.grid.scroller,
					r = this.rowIndex,
					rc = this.grid.rowCount-1,
					row = Math.min(rc, Math.max(0, r+inRowDelta));
				if(inRowDelta){
					if(inRowDelta>0){
						if(row > sc.getLastPageRow(sc.page)){
							//need to load additional data, let scroller do that
							this.grid.setScrollTop(this.grid.scrollTop+sc.findScrollTop(row)-sc.findScrollTop(r));
						}
					}else if(inRowDelta<0){
						if(row <= sc.getPageRow(sc.page)){
							//need to load additional data, let scroller do that
							this.grid.setScrollTop(this.grid.scrollTop-sc.findScrollTop(r)-sc.findScrollTop(row));
						}
					}
				}
				var cc = this.grid.layout.cellCount-1,
				i = this.cell.index,
				col = Math.min(cc, Math.max(0, i+inColDelta));
				var cell = this.grid.getCell(col);
				while(col>=0 && col < cc && cell && cell.hidden === true){
					// skip hidden cells
					col += colDir;
					cell = this.grid.getCell(col);
				}
				if (!cell || cell.hidden === true){
					// don't change col if would move to hidden
					col = i;
				}
				//skip hidden row|cell
				var n = cell.getNode(row);
				if(!n && inRowDelta){
					if((row + inRowDelta) >= 0 && (row + inRowDelta) <= rc){
						this.move(inRowDelta > 0 ? ++inRowDelta : --inRowDelta, inColDelta);
					}
					return;
				}else if((!n || html.style(n, "display") === "none") && inColDelta){
					if((col + inRowDelta) >= 0 && (col + inRowDelta) <= cc){
						this.move(inRowDelta, inColDelta > 0 ? ++inColDelta : --inColDelta);
					}
					return;
				}
				this.setFocusIndex(row, col);
				if(inRowDelta){
					this.grid.updateRow(r);
				}
			}
		}
	},
	previousKey: function(e){
		if(this.grid.edit.isEditing()){
			event.stop(e);
			this.previous();
		}else if(!this.isNavHeader() && !this._isHeaderHidden()) {
			this.grid.domNode.focus(); // will call doFocus and set focus into header.
			event.stop(e);
		}else{
			this.tabOut(this.grid.domNode);
			if (this._colHeadFocusIdx != null) { // clear grid header focus
				html.toggleClass(this._findHeaderCells()[this._colHeadFocusIdx], this.focusClass, false);
				this._colHeadFocusIdx = null;
			}
			this._focusifyCellNode(false);
		}
	},
	nextKey: function(e) {
		var isEmpty = (this.grid.rowCount === 0);
		if(e.target === this.grid.domNode && this._colHeadFocusIdx == null){
			this.focusHeader();
			event.stop(e);
		}else if(this.isNavHeader()){
			// if tabbing from col header, then go to grid proper.
			this.blurHeader();
			if(!this.findAndFocusGridCell()){
				this.tabOut(this.grid.lastFocusNode);
			}
			this._colHeadNode = this._colHeadFocusIdx= null;
		}else if(this.grid.edit.isEditing()){
			event.stop(e);
			this.next();
		}else{
			this.tabOut(this.grid.lastFocusNode);
		}
	},
	tabOut: function(inFocusNode){
		this.tabbingOut = true;
		inFocusNode.focus();
	},
	focusGridView: function(){
		util.fire(this.focusView, "focus");
	},
	focusGrid: function(inSkipFocusCell){
		this.focusGridView();
		this._focusifyCellNode(true);
	},
	findAndFocusGridCell: function(){
		// summary:
		//		find the first focusable grid cell
		// returns: Boolean
		//		true if focus was set to a cell
		//		false if no cell found to set focus onto
		
		var didFocus = true;
		var isEmpty = (this.grid.rowCount === 0); // If grid is empty this.grid.rowCount == 0
		if (this.isNoFocusCell() && !isEmpty){
			var cellIdx = 0;
			var cell = this.grid.getCell(cellIdx);
			if (cell.hidden) {
				// if first cell isn't visible, use _colHeadFocusIdx
				// could also use a while loop to find first visible cell - not sure that is worth it
				cellIdx = this.isNavHeader() ? this._colHeadFocusIdx : 0;
			}
			this.setFocusIndex(0, cellIdx);
		}
		else if (this.cell && !isEmpty){
			if (this.focusView && !this.focusView.rowNodes[this.rowIndex]){
				// if rowNode for current index is undefined (likely as a result of a sort and because of #7304)
				// scroll to that row
				this.grid.scrollToRow(this.rowIndex);
			}
			this.focusGrid();
		}else {
			didFocus = false;
		}
		this._colHeadNode = this._colHeadFocusIdx= null;
		return didFocus;
	},
	focusHeader: function(){
		var headerNodes = this._findHeaderCells();
		var saveColHeadFocusIdx = this._colHeadFocusIdx;
		if (this._isHeaderHidden()){
			// grid header is hidden, focus a cell
			this.findAndFocusGridCell();
		}
		else if (!this._colHeadFocusIdx) {
			if (this.isNoFocusCell()) {
				this._colHeadFocusIdx = 0;
			}
			else {
				this._colHeadFocusIdx = this.cell.index;
			}
		}
		this._colHeadNode = headerNodes[this._colHeadFocusIdx];
		while(this._colHeadNode && this._colHeadFocusIdx >=0 && this._colHeadFocusIdx < headerNodes.length &&
				this._colHeadNode.style.display == "none"){
			// skip over hidden column headers
			this._colHeadFocusIdx++;
			this._colHeadNode = headerNodes[this._colHeadFocusIdx];
		}
		if(this._colHeadNode && this._colHeadNode.style.display != "none"){
			// Column header cells know longer receive actual focus.  So, for keyboard invocation of
			// contextMenu to work, the contextMenu must be bound to the grid.domNode rather than the viewsHeaderNode.
			// unbind the contextmenu from the viewsHeaderNode and to the grid when header cells are active.  Reset
			// the binding back to the viewsHeaderNode when header cells are no longer acive (in blurHeader) #10483
			if (this.headerMenu && this._contextMenuBindNode != this.grid.domNode){
				this.headerMenu.unBindDomNode(this.grid.viewsHeaderNode);
				this.headerMenu.bindDomNode(this.grid.domNode);
				this._contextMenuBindNode = this.grid.domNode;
			}
			this._setActiveColHeader(this._colHeadNode, this._colHeadFocusIdx, saveColHeadFocusIdx);
			this._scrollHeader(this._colHeadFocusIdx);
			this._focusifyCellNode(false);
		}else {
			// all col head nodes are hidden - focus the grid
			this.findAndFocusGridCell();
		}
	},
	blurHeader: function(){
		html.removeClass(this._colHeadNode, this.focusClass);
		html.removeAttr(this.grid.domNode,"aria-activedescendant");
		// reset contextMenu onto viewsHeaderNode so right mouse on header will invoke (see focusHeader)
		if (this.headerMenu && this._contextMenuBindNode == this.grid.domNode) {
			var viewsHeader = this.grid.viewsHeaderNode;
			this.headerMenu.unBindDomNode(this.grid.domNode);
			this.headerMenu.bindDomNode(viewsHeader);
			this._contextMenuBindNode = viewsHeader;
		}
	},
	doFocus: function(e){
		// trap focus only for grid dom node
		if(e && e.target != e.currentTarget){
			event.stop(e);
			return;
		}
		// don't change focus if clicking on scroller bar
		if(this._clickFocus){
			return;
		}
		// do not focus for scrolling if grid is about to blur
		if(!this.tabbingOut){
			this.focusHeader();
		}
		this.tabbingOut = false;
		event.stop(e);
	},
	doBlur: function(e){
		event.stop(e);	// FF2
	},
	doContextMenu: function(e){
	//stop contextMenu event if no header Menu to prevent default/browser contextMenu
		if (!this.headerMenu){
			event.stop(e);
		}
	},
	doLastNodeFocus: function(e){
		if (this.tabbingOut){
			this._focusifyCellNode(false);
		}else if(this.grid.rowCount >0){
			if (this.isNoFocusCell()){
				this.setFocusIndex(0,0);
			}
			this._focusifyCellNode(true);
		}else {
			this.focusHeader();
		}
		this.tabbingOut = false;
		event.stop(e);	 // FF2
	},
	doLastNodeBlur: function(e){
		event.stop(e);	 // FF2
	},
	doColHeaderFocus: function(e){
		this._setActiveColHeader(e.target,html.attr(e.target, "idx"),this._colHeadFocusIdx);
		this._scrollHeader(this.getHeaderIndex());
		event.stop(e);
	},
	doColHeaderBlur: function(e){
		html.toggleClass(e.target, this.focusClass, false);
	},
	_mouseDown: function(e){
		// a flag indicating grid is being focused by clicking
		this._clickFocus = dojo.some(this.grid.views.views, function(v){
			return v.scrollboxNode === e.target;
		});
	},
	_mouseUp: function(e){
		this._clickFocus = false;
	}
});
});
},
'esri/toolbars/_VertexEditor':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!dijit/Menu,esri/toolbars/_VertexMover"], function(dijit,dojo,dojox){
dojo.provide("esri.toolbars._VertexEditor");

dojo.require("dijit.Menu");
dojo.require("esri.toolbars._VertexMover");

/************************************
 * esri.toolbars._GraphicVertexEditor
 ************************************/

dojo.declare("esri.toolbars._GraphicVertexEditor", null, {
  /*****************
   * Public Methods
   *****************/
  
  constructor: function(graphic, map, toolbar) {
    this.graphic = graphic;
    this.map = map;
    this.toolbar = toolbar;
    
    // symbols
    var options = toolbar._options;
    this._symbol1 = options.vertexSymbol;
    this._symbol2 = options.ghostVertexSymbol;
    var symbol = options.ghostLineSymbol;
    this._lineStroke = { style: symbol.style, width: symbol.width, color: symbol.color };
    
    // other options
    this._canDel = options.allowDeleteVertices;
    this._canAdd = options.allowAddVertices;
    
    this._addControllers();
  },
  
  destroy: function() {
    this._removeControllers();
  },
  
  refresh: function(force) {
    if (force) {
      this._removeControllers();
      this._addControllers();
    }
    else {
      this._refresh(this._vertexMovers);
      this._refresh(this._mpVertexMovers);
    }
  },
  
  suspend: function() {
    if (!this._suspended) {
      this._removeControllers();
    }
    this._suspended = true;
  },
  
  resume: function() {
    if (this._suspended) {
      this._addControllers();
    }
    this._suspended = false;
  },
  
  /***************************
   * Events
   * 
   * Handled for Edit toolbar
   *   onVertexMouseOver (graphic, vertexInfo)
   *   onVertexMouseOut (graphic, vertexInfo)
   *   onVertexDelete (graphic, vertexInfo)
   ***************************/
  
  /*******************
   * Internal Methods
   *******************/
  
  _addControllers: function() {
    this._firstMoveHandle = dojo.connect(esri.toolbars.VertexMover, "onFirstMove", this, this._firstMoveHandler);
    this._moveStopHandle = dojo.connect(esri.toolbars.VertexMover, "onMoveStop", this, this._moveStopHandler);
    
    // make the existing vertices moveable
    this._vertexMovers = this._add(this._getSegments(this.graphic.geometry), this._symbol1);
    
    // add place holders for new vertices at the midpoints of existing vertices
    if (this._canAdd) {
      this._mpVertexMovers = this._add(this._getMidpointSegments(this.graphic.geometry), this._symbol2, true);
    }

    // misc handlers
    var graphicsLayer = this._getGraphicsLayer();
    this._mouseOverHandle = dojo.connect(graphicsLayer, "onMouseOver", this, this._mouseOverHandler);
    this._mouseOutHandle = dojo.connect(graphicsLayer, "onMouseOut", this, this._mouseOutHandler);

    if (this._canDel) {
      // create right-click context menu for existing vertices
      this._ctxMenu = new dijit.Menu({ style: "font-size: 12px; margin-left: 5px; margin-top: 5px;" });
      var menuItem = (this._ctxDelete = new dijit.MenuItem({ label: esri.bundle.toolbars.edit.deleteLabel, iconClass: "vertexDeleteIcon", style: "outline: none;" }));
      this._deleteHandle = dojo.connect(menuItem, "onClick", this, this._deleteHandler);
      this._ctxMenu.addChild(menuItem);
      this._ctxMenu.startup();
    }
  },
  
  _removeControllers: function() {
    dojo.disconnect(this._firstMoveHandle);
    dojo.disconnect(this._moveStopHandle);
    dojo.disconnect(this._mouseOverHandle);
    dojo.disconnect(this._mouseOutHandle);
    dojo.disconnect(this._deleteHandle);
    if (this._ctxMenu) {
      this._ctxDelete = null;
      this._unbindCtxNode();
      this._ctxMenu.destroyRecursive();
    }
    this._remove(this._vertexMovers);
    this._remove(this._mpVertexMovers);
    this._vertexMovers = this._mpVertexMovers = null;
  },
  
  _add: function(segments, symbol, placeholders) {
    var i, j, graphic = this.graphic, movers = [];
    for (i = 0; i < segments.length; i++) {
      var segment = segments[i], group = [];
      for (j = 0; j < segment.length; j++) {
        group.push(
          new esri.toolbars.VertexMover(segment[j], symbol, graphic, i, j, segment.length, this, placeholders)
        );
      }
      movers.push(group);
    }
    return movers;
  },
  
  _remove: function(movers) {
    if (movers) {
      dojo.forEach(movers, function(group) {
        dojo.forEach(group, function(mover) {
          mover.destroy();
        });
      });
    }
  },
  
  _refresh: function(movers) {
    if (movers) {
      dojo.forEach(movers, function(group) {
        dojo.forEach(group, function(mover) {
          mover.refresh();
        });
      });
    }
  },
  
  _isNew: function(mover) {
    return (dojo.indexOf(this._vertexMovers[mover.segIndex], mover) === -1) ? true : false;
  },
  
  _getGraphicsLayer: function() {
    return this.toolbar._scratchGL;
  },
  
  _deleteHandler: function(evt) {
    var mover = this._selectedMover, ptIndex = mover.ptIndex;
    //console.log(mover.segIndex, mover.ptIndex);
    
//    if (window.confirm("Are you sure you want to delete this vertex?")) {
      this._updateRelatedGraphic(mover, mover.relatedGraphic, mover.graphic.geometry, mover.segIndex, mover.ptIndex, mover.segLength, false, true);
      if (this._canAdd) {
        this._deleteMidpoints(mover);
      }
      this._deleteVertex(mover);
//    }
    this.toolbar._endOperation("VERTICES");
  },
  
  _mouseOverHandler: function(evt) {
    ////console.log("O V E R");
    var graphic = evt.graphic, mover = this._findMover(graphic);
    if (mover) {
      this.toolbar.onVertexMouseOver(this.graphic, mover._getInfo());
      if (!mover._placeholder) { // context-menu only for existing vertices
        this._selectedMover = mover;
        if (this._canDel) {
          this._bindCtxNode(graphic.getDojoShape().getNode());
        }
      }
    }
  },
  
  _mouseOutHandler: function(evt) {
    ////console.log("O U T");
    var graphic = evt.graphic, mover = this._findMover(graphic);
    if (mover) {
      this.toolbar.onVertexMouseOut(this.graphic, mover._getInfo());
    }
  },
  
  _bindCtxNode: function(node) {
    // TODO
    // Don't bind if node === this._bindNode
    this._unbindCtxNode();
    this._ctxDelete.set("disabled", (this._selectedMover.segLength <= this.minLength) ? true : false);
    this._ctxMenu.bindDomNode(node);
    this._bindNode = node;
  },
  
  _unbindCtxNode: function() {
    var node = this._bindNode;
    if (node) {
      this._ctxMenu.unBindDomNode(node);
    }
  },
  
  _findMover: function(graphic) {
    var i, movers = [], mpMovers = this._mpVertexMovers;
    
    dojo.forEach(this._vertexMovers, function(group) {
      movers = movers.concat(group);
    });

    if (mpMovers) {
      dojo.forEach(mpMovers, function(group) {
        movers = movers.concat(group);
      });
    }
    
    for (i = 0; i < movers.length; i++) {
      var mover = movers[i];
      if (mover.graphic === graphic) {
        return mover;
      }
    }
  },
  
  _firstMoveHandler: function(mover) {
    if (!this._isNew(mover) && this._canAdd) {
      // hide related midpoints
      this._hideRelatedMidpoints(mover);
    }
    this.toolbar._beginOperation("VERTICES");
  },
  
  _moveStopHandler: function(mover, tx) {
    //console.log("_moveStopHandler");
    var add = this._isNew(mover);
    
    if (!tx || !tx.dx && !tx.dy) {
      if (!add && this._canAdd) {
        this._showRelatedMidpoints(mover);
      }
      return;
    }
    
    this._updateRelatedGraphic(mover, mover.relatedGraphic, mover.graphic.geometry, mover.segIndex, mover.ptIndex, mover.segLength, add);
    
    if (this._canAdd) {
      if (add) {
        // update midpoints list
        this._addMidpoints(mover);
      }
      else {
        // 1. update the location of related midpoints
        this._repositionRelatedMidpoints(mover);
              
        // 2. show hidden midpoints
        this._showRelatedMidpoints(mover);
      }
    }
    
    this.toolbar._endOperation("VERTICES");
  },
  
  _showRelatedMidpoints: function(mover) {
    var i, indices = this._getAdjacentMidpoints(mover.ptIndex, mover.segLength), movers = this._mpVertexMovers[mover.segIndex];
    //console.log("showing mps - ", indices);
    for (i = 0; i < indices.length; i++) {
      var mvr = movers[indices[i]];
      mvr.graphic.show();
      mvr.refresh();
    }
  },
  
  _hideRelatedMidpoints: function(mover) {
    var i, indices = this._getAdjacentMidpoints(mover.ptIndex, mover.segLength), movers = this._mpVertexMovers[mover.segIndex];
    //console.log("hiding mps - ", indices);
    for (i = 0; i < indices.length; i++) {
      movers[indices[i]].graphic.hide();
    }
  },
  
  _repositionRelatedMidpoints: function(mover) {
    var i, indices = this._getAdjacentMidpoints(mover.ptIndex, mover.segLength), movers = this._mpVertexMovers[mover.segIndex];
    //console.log("updating mps - ", indices);
    for (i = 0; i < indices.length; i++) {
      var verts = this._getAdjacentVertices(indices[i], mover.segLength);
      //console.log("verts - ", verts);
      var point1 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts[0]), point2 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts[1]);
      var midpoint = new esri.geometry.Point({ x: (point1.x + point2.x ) / 2, y: (point1.y + point2.y ) / 2, spatialReference: point1.spatialReference.toJson() });
      movers[indices[i]].graphic.setGeometry(midpoint);
    }
  },
  
  _addMidpoints: function(mover) {
    var segIndex = mover.segIndex, ptIndex = mover.ptIndex, segLength = mover.segLength;
    var newIndex = ptIndex + 1;
    var i, newLength = segLength + 1;

    // remove from the midpoint movers list      
    this._mpVertexMovers[segIndex].splice(ptIndex, 1);
    
    // update vertex movers list
    var movers = this._vertexMovers[segIndex];
    for (i = 0; i < newIndex; i++) {
      movers[i].segLength += 1;
    }
    for (i = newIndex; i < movers.length; i++) {
      movers[i].ptIndex += 1;
      movers[i].segLength += 1;
    }
    
    // insert into to vertex movers list
    mover.ptIndex = newIndex;
    mover.segLength = movers.length + 1;
    movers.splice(newIndex, 0, mover);
    
    // change symbology
    mover.graphic.setSymbol(this._symbol1);
    
    // update the midpoints list
    movers = this._mpVertexMovers[segIndex];
    for (i = 0; i < ptIndex; i++) {
      movers[i].segLength += 1;
    }
    for (i = ptIndex; i < segLength - 1; i++) {
      movers[i].ptIndex += 1;
      movers[i].segLength += 1;
    }
    
    //console.log("ptIndex ", ptIndex);
    //console.log("segLength ", segLength);
    //console.log("newIndex ", newIndex);
    //console.log("newLength ", newLength);
    
    var verts1 = this._getAdjacentVertices(ptIndex, newLength);
    var verts2 = this._getAdjacentVertices(ptIndex + 1, newLength);
    //console.log("verts1 - ", verts1);
    //console.log("verts2 - ", verts2);
    
    var point1, point2;
    point1 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts1[0]);
    point2 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts1[1]);
    var midpoint1 = new esri.geometry.Point({ x: (point1.x + point2.x ) / 2, y: (point1.y + point2.y ) / 2, spatialReference: point1.spatialReference.toJson() });
    
    point1 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts2[0]);
    point2 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts2[1]);
    var midpoint2 = new esri.geometry.Point({ x: (point1.x + point2.x ) / 2, y: (point1.y + point2.y ) / 2, spatialReference: point1.spatialReference.toJson() });
    
    var mvr1 = new esri.toolbars.VertexMover(midpoint1, this._symbol2, this.graphic, mover.segIndex, ptIndex, newLength, this, true);
    var mvr2 = new esri.toolbars.VertexMover(midpoint2, this._symbol2, this.graphic, mover.segIndex, ptIndex + 1, newLength, this, true);
    movers.splice(ptIndex, 0, mvr1, mvr2);
  },
  
  _deleteVertex: function(mover) {
    var i, segIndex = mover.segIndex, ptIndex = mover.ptIndex;
    
    // update vertex movers list
    var movers = this._vertexMovers[segIndex];
    for (i = 0; i < ptIndex; i++) {
      movers[i].segLength -= 1;
    }
    for (i = ptIndex + 1; i < movers.length; i++) {
      var mvr = movers[i];
      mvr.ptIndex -= 1;
      mvr.segLength -= 1;
    }
    movers.splice(ptIndex, 1);
    var info = mover._getInfo();
    mover.destroy();
    this.toolbar.onVertexDelete(this.graphic, info);
  }
});

// statics
dojo.mixin(esri.toolbars._GraphicVertexEditor, {
  create: function(graphic, map, toolbar) {
    var type = graphic.geometry.type;
    switch(type) {
      case "multipoint":
        return new esri.toolbars._MultipointVertexEditor(graphic, map, toolbar);
        break;
      case "polyline":
        return new esri.toolbars._PolylineVertexEditor(graphic, map, toolbar);
        break;
      case "polygon":
        return new esri.toolbars._PolygonVertexEditor(graphic, map, toolbar);
        break;
    }
  }
});

/***************************************
 * esri.toolbars._MultipointVertexEditor
 ***************************************/

dojo.declare("esri.toolbars._MultipointVertexEditor", esri.toolbars._GraphicVertexEditor, {
  minLength: 1, // end-user will not be able to delete the last remaining point
  
  constructor: function() {
    this._moveStartHandle = dojo.connect(esri.toolbars.VertexMover, "onMoveStart", this, this._moveStartHandler);
    dojo.disconnect(this._firstMoveHandle);
  },
  
  destroy: function() {
    this.inherited(arguments);
    dojo.disconnect(this._moveStartHandle);
  },
  
  _getSegments: function(geometry) {
    var i, points = geometry.points, segment = [], sr = geometry.spatialReference;
    for (i = 0; i < points.length; i++) {
      var point = points[i];
      segment.push(new esri.geometry.Point({ x: point[0], y: point[1], spatialReference: sr.toJson() }));
    }
    return [ segment ];
  },
  
  _getMidpointSegments: function(geometry) {
    return [];
  },
  
  _getControlPoints: function(mover, geometry, segIndex, ptIndex, segLength) {
    return [];
  },
  
  _getGraphicsLayer: function() {
    return this.graphic._graphicsLayer;
  },
  
  _mouseOverHandler: function(evt) {
    ////console.log("O V E R");
    var graphic = evt.graphic, mover = this._findMover(evt);
    if (mover) {
      this.toolbar.onVertexMouseOver(graphic, mover._getInfo());
      this._selectedMover = mover;
      if (this._canDel) {
        this._bindCtxNode(mover.graphic.getDojoShape().getNode());
      }
    }
  },
  
  _mouseOutHandler: function(evt) {
    ////console.log("O U T");
    var graphic = evt.graphic, mover = this._findMover(evt);
    if (mover) {
      this.toolbar.onVertexMouseOut(graphic, mover._getInfo());
    }
  },
  
  _findMover: function(evt) {
    var i, movers = [].concat(this._vertexMovers[0]), target = evt.target;
    for (i = 0; i < movers.length; i++) {
      var mover = movers[i];
      if (mover.graphic.getDojoShape().getNode() === target) {
        return mover;
      }
    }
  },
  
  _moveStartHandler: function(mover) {
    var geom = mover.relatedGraphic.geometry, ptIndex = mover.ptIndex;

    // adjust the links (we need this because we are moving the shape to the front)
    var newIndex = mover.segLength - 1;
    var points = geom.points;
    var spliced = points.splice(ptIndex, 1);
    points.push(spliced[0]);
    
    var j, movers = this._vertexMovers[0];
    for (j = newIndex; j > ptIndex; j--) {
      movers[j].ptIndex -= 1; 
    }
    spliced = movers.splice(ptIndex, 1);
    movers.push(spliced[0]);
    spliced[0].ptIndex = newIndex;
  },
  
  _moveStopHandler: function(mover) {
    this._updateRelatedGraphic(mover, mover.relatedGraphic, mover.graphic.geometry, mover.segIndex, mover.ptIndex, mover.segLength);
    this.toolbar._endOperation("VERTICES");
  },
  
  _updateRelatedGraphic: function(mover, graphic, newPoint, segIndex, ptIndex, segLen, add, del) {
    // Note: add is unused
    var geom = graphic.geometry;

    if (del) {
      geom.removePoint(ptIndex);
    }
    else {
      geom.setPoint(ptIndex, newPoint);
//      geom.points[ptIndex] = [ newPoint.x, newPoint.y ];
//      // ISSUE: GL clipping is broken because of obsolete geometry extent
//      // At the time of this writing (07/30/09), multipoint does not support
//      // setters to modify the geometry, unlike polyine/polygon.
//      // If mulitpoint supports setters, then we need to clear out
//      // _extent within the setters.
//      geom._extent = null;
    }

    graphic.setGeometry(geom);
  },
  
  _deleteMidpoints: function(mover){
  }
});

/*************************************
 * esri.toolbars._PolylineVertexEditor
 *************************************/

dojo.declare("esri.toolbars._PolylineVertexEditor", esri.toolbars._GraphicVertexEditor, {
  minLength: 2,
  
  _getSegments: function(geometry) {
    var i, j, paths = geometry.paths, segments = [];
    for (i = 0; i < paths.length; i++) {
      var path = paths[i], segment = [];
      for (j = 0; j < path.length; j++) {
        segment.push(geometry.getPoint(i, j));
      }
      segments.push(segment);
    }
    return segments;
  },
  
  _getMidpointSegments: function(geometry) {
    var i, j, paths = geometry.paths, segments = [], sr = geometry.spatialReference;
    for (i = 0; i < paths.length; i++) {
      var path = paths[i], segment = [];
      for (j = 0; j < path.length - 1; j++) {
        var point1 = geometry.getPoint(i, j), point2 = geometry.getPoint(i, j + 1);
        var midX = (point1.x + point2.x ) / 2, midY = (point1.y + point2.y ) / 2;
        var midpoint = new esri.geometry.Point({ x: midX, y: midY, spatialReference: sr.toJson() });
        segment.push(midpoint);
      }
      segments.push(segment);
    }
    return segments;
  },
  
  _getControlPoints: function(mover, geometry, segIndex, ptIndex, segLength) {
    var map = this.map, idx1, idx2, pt1, pt2;
    //console.log(segIndex, ptIndex, segLength);
    
    if (this._isNew(mover)) {
      idx1 = ptIndex;
      idx2 = ptIndex + 1;
      if (idx1 >= 0) {
        pt1 = map.toScreen(geometry.getPoint(segIndex, idx1));
      }
      if (idx2 <= segLength) {
        pt2 = map.toScreen(geometry.getPoint(segIndex, idx2));
      }
    }
    else {
      idx1 = ptIndex - 1;
      idx2 = ptIndex + 1;
      if (idx1 >= 0) {
        pt1 = map.toScreen(geometry.getPoint(segIndex, idx1));
      }
      if (idx2 < segLength) {
        pt2 = map.toScreen(geometry.getPoint(segIndex, idx2));
      }
    }
    
    return [ pt1, pt2 ];
  },
  
  _getAdjacentMidpoints: function(vtxIndex, segLength) {
    var points = [];
    var idx1 = vtxIndex - 1;
    if (idx1 >= 0) {
      points.push(idx1);
    }
    var idx2 = vtxIndex;
    if (idx2 < segLength - 1) {
      points.push(idx2);
    }
    return points;
  },
  
  _getAdjacentVertices: function(midPtIndex, segLength) {
    return [ midPtIndex, midPtIndex + 1 ];
  },
  
  _deleteMidpoints: function(mover) {
    var segIndex = mover.segIndex, ptIndex = mover.ptIndex, segLength = mover.segLength;

    // update the midpoints list
    var movers = this._mpVertexMovers[segIndex], newLength = movers.length - 1;  
    var indices = this._getAdjacentMidpoints(ptIndex, segLength).sort();
    var i, min = indices[0];

    for (i = 0; i < min; i++) {
      movers[i].segLength -= 1;
    }
    for (i = min + 1; i < movers.length; i++) {
      var mvr = movers[i];
      mvr.ptIndex -= 1;
      mvr.segLength -= 1;
    }
    
    if (indices.length === 1) { // deleting first or last vertex
      movers.splice(min, 1)[0].destroy();
    }
    else {
      // create mover for the new midpoint
      var verts = this._getAdjacentVertices(min, newLength);
      var point1 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts[0]);
      var point2 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts[1]);
      var midpoint1 = new esri.geometry.Point({ x: (point1.x + point2.x ) / 2, y: (point1.y + point2.y ) / 2, spatialReference: point1.spatialReference.toJson() });
      var mvr1 = new esri.toolbars.VertexMover(midpoint1, this._symbol2, this.graphic, mover.segIndex, min, newLength, this, true);
      var spliced = movers.splice(min, indices.length, mvr1);
      for (i = 0; i < spliced.length; i++) {
        spliced[i].destroy();
      }
    }
  },
  
  _updateRelatedGraphic: function(mover, graphic, newPoint, segIndex, ptIndex, segLen, add, del) {
    var geom = graphic.geometry;
    
    if (add) {
      geom.insertPoint(segIndex, ptIndex + 1, esri.geometry.fromJson(newPoint.toJson()));
    }
    else if (del) {
      geom.removePoint(segIndex, ptIndex);
    }
    else {
      geom.setPoint(segIndex, ptIndex, esri.geometry.fromJson(newPoint.toJson()));
    }
    
    graphic.setGeometry(geom);
  }
});

/************************************
 * esri.toolbars._PolygonVertexEditor
 ************************************/

dojo.declare("esri.toolbars._PolygonVertexEditor", esri.toolbars._GraphicVertexEditor, {
  minLength: 3,
  
  _getSegments: function(geometry) {
    var i, j, rings = geometry.rings, segments = [];
    for (i = 0; i < rings.length; i++) {
      var ring = rings[i], segment = [];
      for (j = 0; j < ring.length - 1; j++) { // exclude the last point in the ring
        segment.push(geometry.getPoint(i, j));
      }
      segments.push(segment);
    }
    return segments;
  },
  
  _getMidpointSegments: function(geometry) {
    var i, j, rings = geometry.rings, segments = [], sr = geometry.spatialReference;
    for (i = 0; i < rings.length; i++) {
      var ring = rings[i], segment = [];
      for (j = 0; j < ring.length - 1; j++) {
        var point1 = geometry.getPoint(i, j), point2 = geometry.getPoint(i, j + 1);
        var midX = (point1.x + point2.x ) / 2, midY = (point1.y + point2.y ) / 2;
        var midpoint = new esri.geometry.Point({ x: midX, y: midY, spatialReference: sr.toJson() });
        segment.push(midpoint);
      }
      segments.push(segment);
    }
    return segments;
  },
  
  _getControlPoints: function(mover, geometry, segIndex, ptIndex, segLength) {
    var map = this.map, idx1, idx2, pt1, pt2;
    
    if (this._isNew(mover)) { // new vertex
      idx1 = ptIndex;
      idx2 = (ptIndex + 1) % segLength;
    }
    else { // movement of existing vertices
      idx1 = ptIndex - 1;
      idx1 = idx1 < 0 ? (segLength + idx1) % segLength  : idx1;
      idx2 = (ptIndex + 1) % segLength;
    }
    
    pt1 = map.toScreen(geometry.getPoint(segIndex, idx1));
    pt2 = map.toScreen(geometry.getPoint(segIndex, idx2));
    return [ pt1, pt2 ];
  },
  
  _getAdjacentMidpoints: function(vtxIndex, segLength) {
    var idx1 = vtxIndex - 1;
    idx1 = idx1 < 0 ? (segLength + idx1) % segLength  : idx1;
    var idx2 = vtxIndex;
    return [ idx1, idx2 ];
  },
  
  _getAdjacentVertices: function(midPtIndex, segLength) {
    return [ midPtIndex, (midPtIndex + 1) % segLength ];
  },
  
  _deleteMidpoints: function(mover) {
    var segIndex = mover.segIndex, ptIndex = mover.ptIndex, segLength = mover.segLength;

    // update the midpoints list
    var movers = this._mpVertexMovers[segIndex], newLength = movers.length - 1,  
        indices = this._getAdjacentMidpoints(ptIndex, segLength).sort(),
        verts, point1, point2, midpoint1, i, mvr1, mvr, 
        min = indices[0], max = indices[indices.length - 1];
    
    if (ptIndex === 0) {
      // create mover for the new midpoint
      verts = this._getAdjacentVertices(newLength - 1, newLength);
      point1 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts[0]);
      point2 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts[1]);
      midpoint1 = new esri.geometry.Point({ x: (point1.x + point2.x ) / 2, y: (point1.y + point2.y ) / 2, spatialReference: point1.spatialReference.toJson() });
      mvr1 = new esri.toolbars.VertexMover(midpoint1, this._symbol2, this.graphic, mover.segIndex, newLength - 1, newLength, this, true);
      movers.splice(max, 1, mvr1)[0].destroy();
      movers.splice(min, 1)[0].destroy();
      
      for (i = 0; i < movers.length - 1; i++) {
        mvr = movers[i];
        mvr.ptIndex -= 1;
        mvr.segLength -= 1;
      }
    }
    else {
      // create mover for the new midpoint
      verts = this._getAdjacentVertices(min, newLength);
      point1 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts[0]);
      point2 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts[1]);
      midpoint1 = new esri.geometry.Point({ x: (point1.x + point2.x ) / 2, y: (point1.y + point2.y ) / 2, spatialReference: point1.spatialReference.toJson() });
      mvr1 = new esri.toolbars.VertexMover(midpoint1, this._symbol2, this.graphic, mover.segIndex, min, newLength, this, true);
      var spliced = movers.splice(min, indices.length, mvr1);
      for (i = 0; i < spliced.length; i++) {
        spliced[i].destroy();
      }
      
      for (i = 0; i < min; i++) {
        movers[i].segLength -= 1;
      }
      for (i = min + 1; i < movers.length; i++) {
        mvr = movers[i];
        mvr.ptIndex -= 1;
        mvr.segLength -= 1;
      }
    }
  },
  
  _updateRelatedGraphic: function(mover, graphic, newPoint, segIndex, ptIndex, segLen, add, del) {
    var geom = graphic.geometry;
    
    if (add) {
      geom.insertPoint(segIndex, ptIndex + 1, esri.geometry.fromJson(newPoint.toJson()));
    }
    else if (del) {
      geom.removePoint(segIndex, ptIndex);
      if (ptIndex === 0) {
        //geom.removePoint(segIndex, segLen);
        geom.setPoint(segIndex, segLen - 1, esri.geometry.fromJson(geom.getPoint(segIndex, 0).toJson()));
      }
    }
    else {
      geom.setPoint(segIndex, ptIndex, esri.geometry.fromJson(newPoint.toJson()));
      if (ptIndex === 0) { // polygons are "closed", remember? first & last points must be updated together
        geom.setPoint(segIndex, segLen, esri.geometry.fromJson(newPoint.toJson()));
      }
    }
    
    graphic.setGeometry(geom);
  }
});

});

},
'dijit/_Templated':function(){
define("dijit/_Templated", [
	"./_WidgetBase",
	"./_TemplatedMixin",
	"./_WidgetsInTemplateMixin",
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.extend lang.isArray
	"dojo/_base/kernel" // kernel.deprecated
], function(_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, array, declare, lang, kernel){

/*=====
	var _WidgetBase = dijit._WidgetBase;
	var _TemplatedMixin = dijit._TemplatedMixin;
	var _WidgetsInTemplateMixin = dijit._WidgetsInTemplateMixin;
=====*/

	// module:
	//		dijit/_Templated
	// summary:
	//		Deprecated mixin for widgets that are instantiated from a template.

	// These arguments can be specified for widgets which are used in templates.
	// Since any widget can be specified as sub widgets in template, mix it
	// into the base widget class.  (This is a hack, but it's effective.)
	lang.extend(_WidgetBase, {
		waiRole: "",
		waiState:""
	});

	return declare("dijit._Templated", [_TemplatedMixin, _WidgetsInTemplateMixin], {
		// summary:
		//		Deprecated mixin for widgets that are instantiated from a template.
		//		Widgets should use _TemplatedMixin plus if necessary _WidgetsInTemplateMixin instead.

		// widgetsInTemplate: [protected] Boolean
		//		Should we parse the template to find widgets that might be
		//		declared in markup inside it?  False by default.
		widgetsInTemplate: false,

		constructor: function(){
			kernel.deprecated(this.declaredClass + ": dijit._Templated deprecated, use dijit._TemplatedMixin and if necessary dijit._WidgetsInTemplateMixin", "", "2.0");
		},

		_attachTemplateNodes: function(rootNode, getAttrFunc){

			this.inherited(arguments);

			// Do deprecated waiRole and waiState
			var nodes = lang.isArray(rootNode) ? rootNode : (rootNode.all || rootNode.getElementsByTagName("*"));
			var x = lang.isArray(rootNode) ? 0 : -1;
			for(; x<nodes.length; x++){
				var baseNode = (x == -1) ? rootNode : nodes[x];

				// waiRole, waiState
				var role = getAttrFunc(baseNode, "waiRole");
				if(role){
					baseNode.setAttribute("role", role);
				}
				var values = getAttrFunc(baseNode, "waiState");
				if(values){
					array.forEach(values.split(/\s*,\s*/), function(stateValue){
						if(stateValue.indexOf('-') != -1){
							var pair = stateValue.split('-');
							baseNode.setAttribute("aria-"+pair[0], pair[1]);
						}
					});
				}
			}
		}
	});
});

},
'dijit/_CssStateMixin':function(){
define("dijit/_CssStateMixin", [
	"dojo/touch",
	"dojo/_base/array", // array.forEach array.map
	"dojo/_base/declare",	// declare
	"dojo/dom-class", // domClass.toggle
	"dojo/_base/lang", // lang.hitch
	"dojo/_base/window" // win.body
], function(touch, array, declare, domClass, lang, win){

// module:
//		dijit/_CssStateMixin
// summary:
//		Mixin for widgets to set CSS classes on the widget DOM nodes depending on hover/mouse press/focus
//		state changes, and also higher-level state changes such becoming disabled or selected.

return declare("dijit._CssStateMixin", [], {
	// summary:
	//		Mixin for widgets to set CSS classes on the widget DOM nodes depending on hover/mouse press/focus
	//		state changes, and also higher-level state changes such becoming disabled or selected.
	//
	// description:
	//		By mixing this class into your widget, and setting the this.baseClass attribute, it will automatically
	//		maintain CSS classes on the widget root node (this.domNode) depending on hover,
	//		active, focus, etc. state.   Ex: with a baseClass of dijitButton, it will apply the classes
	//		dijitButtonHovered and dijitButtonActive, as the user moves the mouse over the widget and clicks it.
	//
	//		It also sets CSS like dijitButtonDisabled based on widget semantic state.
	//
	//		By setting the cssStateNodes attribute, a widget can also track events on subnodes (like buttons
	//		within the widget).

	// cssStateNodes: [protected] Object
	//		List of sub-nodes within the widget that need CSS classes applied on mouse hover/press and focus
	//.
	//		Each entry in the hash is a an attachpoint names (like "upArrowButton") mapped to a CSS class names
	//		(like "dijitUpArrowButton"). Example:
	//	|		{
	//	|			"upArrowButton": "dijitUpArrowButton",
	//	|			"downArrowButton": "dijitDownArrowButton"
	//	|		}
	//		The above will set the CSS class dijitUpArrowButton to the this.upArrowButton DOMNode when it
	//		is hovered, etc.
	cssStateNodes: {},

	// hovering: [readonly] Boolean
	//		True if cursor is over this widget
	hovering: false,

	// active: [readonly] Boolean
	//		True if mouse was pressed while over this widget, and hasn't been released yet
	active: false,

	_applyAttributes: function(){
		// This code would typically be in postCreate(), but putting in _applyAttributes() for
		// performance: so the class changes happen before DOM is inserted into the document.
		// Change back to postCreate() in 2.0.  See #11635.

		this.inherited(arguments);

		// Automatically monitor mouse events (essentially :hover and :active) on this.domNode
		array.forEach(["onmouseenter", "onmouseleave", touch.press], function(e){
			this.connect(this.domNode, e, "_cssMouseEvent");
		}, this);

		// Monitoring changes to disabled, readonly, etc. state, and update CSS class of root node
		array.forEach(["disabled", "readOnly", "checked", "selected", "focused", "state", "hovering", "active"], function(attr){
			this.watch(attr, lang.hitch(this, "_setStateClass"));
		}, this);

		// Events on sub nodes within the widget
		for(var ap in this.cssStateNodes){
			this._trackMouseState(this[ap], this.cssStateNodes[ap]);
		}
		// Set state initially; there's probably no hover/active/focus state but widget might be
		// disabled/readonly/checked/selected so we want to set CSS classes for those conditions.
		this._setStateClass();
	},

	_cssMouseEvent: function(/*Event*/ event){
		// summary:
		//	Sets hovering and active properties depending on mouse state,
		//	which triggers _setStateClass() to set appropriate CSS classes for this.domNode.

		if(!this.disabled){
			switch(event.type){
				case "mouseenter":
				case "mouseover":	// generated on non-IE browsers even though we connected to mouseenter
					this._set("hovering", true);
					this._set("active", this._mouseDown);
					break;

				case "mouseleave":
				case "mouseout":	// generated on non-IE browsers even though we connected to mouseleave
					this._set("hovering", false);
					this._set("active", false);
					break;

				case "mousedown":
				case "touchpress":
					this._set("active", true);
					this._mouseDown = true;
					// Set a global event to handle mouseup, so it fires properly
					// even if the cursor leaves this.domNode before the mouse up event.
					// Alternately could set active=false on mouseout.
					var mouseUpConnector = this.connect(win.body(), touch.release, function(){
						this._mouseDown = false;
						this._set("active", false);
						this.disconnect(mouseUpConnector);
					});
					break;
			}
		}
	},

	_setStateClass: function(){
		// summary:
		//		Update the visual state of the widget by setting the css classes on this.domNode
		//		(or this.stateNode if defined) by combining this.baseClass with
		//		various suffixes that represent the current widget state(s).
		//
		// description:
		//		In the case where a widget has multiple
		//		states, it sets the class based on all possible
		//	 	combinations.  For example, an invalid form widget that is being hovered
		//		will be "dijitInput dijitInputInvalid dijitInputHover dijitInputInvalidHover".
		//
		//		The widget may have one or more of the following states, determined
		//		by this.state, this.checked, this.valid, and this.selected:
		//			- Error - ValidationTextBox sets this.state to "Error" if the current input value is invalid
		//			- Incomplete - ValidationTextBox sets this.state to "Incomplete" if the current input value is not finished yet
		//			- Checked - ex: a checkmark or a ToggleButton in a checked state, will have this.checked==true
		//			- Selected - ex: currently selected tab will have this.selected==true
		//
		//		In addition, it may have one or more of the following states,
		//		based on this.disabled and flags set in _onMouse (this.active, this.hovering) and from focus manager (this.focused):
		//			- Disabled	- if the widget is disabled
		//			- Active		- if the mouse (or space/enter key?) is being pressed down
		//			- Focused		- if the widget has focus
		//			- Hover		- if the mouse is over the widget

		// Compute new set of classes
		var newStateClasses = this.baseClass.split(" ");

		function multiply(modifier){
			newStateClasses = newStateClasses.concat(array.map(newStateClasses, function(c){ return c+modifier; }), "dijit"+modifier);
		}

		if(!this.isLeftToRight()){
			// For RTL mode we need to set an addition class like dijitTextBoxRtl.
			multiply("Rtl");
		}

		var checkedState = this.checked == "mixed" ? "Mixed" : (this.checked ? "Checked" : "");
		if(this.checked){
			multiply(checkedState);
		}
		if(this.state){
			multiply(this.state);
		}
		if(this.selected){
			multiply("Selected");
		}

		if(this.disabled){
			multiply("Disabled");
		}else if(this.readOnly){
			multiply("ReadOnly");
		}else{
			if(this.active){
				multiply("Active");
			}else if(this.hovering){
				multiply("Hover");
			}
		}

		if(this.focused){
			multiply("Focused");
		}

		// Remove old state classes and add new ones.
		// For performance concerns we only write into domNode.className once.
		var tn = this.stateNode || this.domNode,
			classHash = {};	// set of all classes (state and otherwise) for node

		array.forEach(tn.className.split(" "), function(c){ classHash[c] = true; });

		if("_stateClasses" in this){
			array.forEach(this._stateClasses, function(c){ delete classHash[c]; });
		}

		array.forEach(newStateClasses, function(c){ classHash[c] = true; });

		var newClasses = [];
		for(var c in classHash){
			newClasses.push(c);
		}
		tn.className = newClasses.join(" ");

		this._stateClasses = newStateClasses;
	},

	_trackMouseState: function(/*DomNode*/ node, /*String*/ clazz){
		// summary:
		//		Track mouse/focus events on specified node and set CSS class on that node to indicate
		//		current state.   Usually not called directly, but via cssStateNodes attribute.
		// description:
		//		Given class=foo, will set the following CSS class on the node
		//			- fooActive: if the user is currently pressing down the mouse button while over the node
		//			- fooHover: if the user is hovering the mouse over the node, but not pressing down a button
		//			- fooFocus: if the node is focused
		//
		//		Note that it won't set any classes if the widget is disabled.
		// node: DomNode
		//		Should be a sub-node of the widget, not the top node (this.domNode), since the top node
		//		is handled specially and automatically just by mixing in this class.
		// clazz: String
		//		CSS class name (ex: dijitSliderUpArrow).

		// Current state of node (initially false)
		// NB: setting specifically to false because domClass.toggle() needs true boolean as third arg
		var hovering=false, active=false, focused=false;

		var self = this,
			cn = lang.hitch(this, "connect", node);

		function setClass(){
			var disabled = ("disabled" in self && self.disabled) || ("readonly" in self && self.readonly);
			domClass.toggle(node, clazz+"Hover", hovering && !active && !disabled);
			domClass.toggle(node, clazz+"Active", active && !disabled);
			domClass.toggle(node, clazz+"Focused", focused && !disabled);
		}

		// Mouse
		cn("onmouseenter", function(){
			hovering = true;
			setClass();
		});
		cn("onmouseleave", function(){
			hovering = false;
			active = false;
			setClass();
		});
		cn(touch.press, function(){
			active = true;
			setClass();
		});
		cn(touch.release, function(){
			active = false;
			setClass();
		});

		// Focus
		cn("onfocus", function(){
			focused = true;
			setClass();
		});
		cn("onblur", function(){
			focused = false;
			setClass();
		});

		// Just in case widget is enabled/disabled while it has focus/hover/active state.
		// Maybe this is overkill.
		this.watch("disabled", setClass);
		this.watch("readOnly", setClass);
	}
});
});

},
'dijit/place':function(){
define("dijit/place", [
	"dojo/_base/array", // array.forEach array.map array.some
	"dojo/dom-geometry", // domGeometry.getMarginBox domGeometry.position
	"dojo/dom-style", // domStyle.getComputedStyle
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/_base/window", // win.body
	"dojo/window", // winUtils.getBox
	"."	// dijit (defining dijit.place to match API doc)
], function(array, domGeometry, domStyle, kernel, win, winUtils, dijit){

	// module:
	//		dijit/place
	// summary:
	//		Code to place a popup relative to another node


	function _place(/*DomNode*/ node, choices, layoutNode, aroundNodeCoords){
		// summary:
		//		Given a list of spots to put node, put it at the first spot where it fits,
		//		of if it doesn't fit anywhere then the place with the least overflow
		// choices: Array
		//		Array of elements like: {corner: 'TL', pos: {x: 10, y: 20} }
		//		Above example says to put the top-left corner of the node at (10,20)
		// layoutNode: Function(node, aroundNodeCorner, nodeCorner, size)
		//		for things like tooltip, they are displayed differently (and have different dimensions)
		//		based on their orientation relative to the parent.	 This adjusts the popup based on orientation.
		//		It also passes in the available size for the popup, which is useful for tooltips to
		//		tell them that their width is limited to a certain amount.	 layoutNode() may return a value expressing
		//		how much the popup had to be modified to fit into the available space.	 This is used to determine
		//		what the best placement is.
		// aroundNodeCoords: Object
		//		Size of aroundNode, ex: {w: 200, h: 50}

		// get {x: 10, y: 10, w: 100, h:100} type obj representing position of
		// viewport over document
		var view = winUtils.getBox();

		// This won't work if the node is inside a <div style="position: relative">,
		// so reattach it to win.doc.body.	 (Otherwise, the positioning will be wrong
		// and also it might get cutoff)
		if(!node.parentNode || String(node.parentNode.tagName).toLowerCase() != "body"){
			win.body().appendChild(node);
		}

		var best = null;
		array.some(choices, function(choice){
			var corner = choice.corner;
			var pos = choice.pos;
			var overflow = 0;

			// calculate amount of space available given specified position of node
			var spaceAvailable = {
				w: {
					'L': view.l + view.w - pos.x,
					'R': pos.x - view.l,
					'M': view.w
				   }[corner.charAt(1)],
				h: {
					'T': view.t + view.h - pos.y,
					'B': pos.y - view.t,
					'M': view.h
				   }[corner.charAt(0)]
			};

			// configure node to be displayed in given position relative to button
			// (need to do this in order to get an accurate size for the node, because
			// a tooltip's size changes based on position, due to triangle)
			if(layoutNode){
				var res = layoutNode(node, choice.aroundCorner, corner, spaceAvailable, aroundNodeCoords);
				overflow = typeof res == "undefined" ? 0 : res;
			}

			// get node's size
			var style = node.style;
			var oldDisplay = style.display;
			var oldVis = style.visibility;
			if(style.display == "none"){
				style.visibility = "hidden";
				style.display = "";
			}
			var mb = domGeometry. getMarginBox(node);
			style.display = oldDisplay;
			style.visibility = oldVis;

			// coordinates and size of node with specified corner placed at pos,
			// and clipped by viewport
			var
				startXpos = {
					'L': pos.x,
					'R': pos.x - mb.w,
					'M': Math.max(view.l, Math.min(view.l + view.w, pos.x + (mb.w >> 1)) - mb.w) // M orientation is more flexible
				}[corner.charAt(1)],
				startYpos = {
					'T': pos.y,
					'B': pos.y - mb.h,
					'M': Math.max(view.t, Math.min(view.t + view.h, pos.y + (mb.h >> 1)) - mb.h)
				}[corner.charAt(0)],
				startX = Math.max(view.l, startXpos),
				startY = Math.max(view.t, startYpos),
				endX = Math.min(view.l + view.w, startXpos + mb.w),
				endY = Math.min(view.t + view.h, startYpos + mb.h),
				width = endX - startX,
				height = endY - startY;

			overflow += (mb.w - width) + (mb.h - height);

			if(best == null || overflow < best.overflow){
				best = {
					corner: corner,
					aroundCorner: choice.aroundCorner,
					x: startX,
					y: startY,
					w: width,
					h: height,
					overflow: overflow,
					spaceAvailable: spaceAvailable
				};
			}

			return !overflow;
		});

		// In case the best position is not the last one we checked, need to call
		// layoutNode() again.
		if(best.overflow && layoutNode){
			layoutNode(node, best.aroundCorner, best.corner, best.spaceAvailable, aroundNodeCoords);
		}

		// And then position the node.  Do this last, after the layoutNode() above
		// has sized the node, due to browser quirks when the viewport is scrolled
		// (specifically that a Tooltip will shrink to fit as though the window was
		// scrolled to the left).
		//
		// In RTL mode, set style.right rather than style.left so in the common case,
		// window resizes move the popup along with the aroundNode.
		var l = domGeometry.isBodyLtr(),
			s = node.style;
		s.top = best.y + "px";
		s[l ? "left" : "right"] = (l ? best.x : view.w - best.x - best.w) + "px";
		s[l ? "right" : "left"] = "auto";	// needed for FF or else tooltip goes to far left

		return best;
	}

	/*=====
	dijit.place.__Position = function(){
		// x: Integer
		//		horizontal coordinate in pixels, relative to document body
		// y: Integer
		//		vertical coordinate in pixels, relative to document body

		this.x = x;
		this.y = y;
	};
	=====*/

	/*=====
	dijit.place.__Rectangle = function(){
		// x: Integer
		//		horizontal offset in pixels, relative to document body
		// y: Integer
		//		vertical offset in pixels, relative to document body
		// w: Integer
		//		width in pixels.   Can also be specified as "width" for backwards-compatibility.
		// h: Integer
		//		height in pixels.   Can also be specified as "height" from backwards-compatibility.

		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	};
	=====*/

	return (dijit.place = {
		// summary:
		//		Code to place a DOMNode relative to another DOMNode.
		//		Load using require(["dijit/place"], function(place){ ... }).

		at: function(node, pos, corners, padding){
			// summary:
			//		Positions one of the node's corners at specified position
			//		such that node is fully visible in viewport.
			// description:
			//		NOTE: node is assumed to be absolutely or relatively positioned.
			// node: DOMNode
			//		The node to position
			// pos: dijit.place.__Position
			//		Object like {x: 10, y: 20}
			// corners: String[]
			//		Array of Strings representing order to try corners in, like ["TR", "BL"].
			//		Possible values are:
			//			* "BL" - bottom left
			//			* "BR" - bottom right
			//			* "TL" - top left
			//			* "TR" - top right
			// padding: dijit.place.__Position?
			//		optional param to set padding, to put some buffer around the element you want to position.
			// example:
			//		Try to place node's top right corner at (10,20).
			//		If that makes node go (partially) off screen, then try placing
			//		bottom left corner at (10,20).
			//	|	place(node, {x: 10, y: 20}, ["TR", "BL"])
			var choices = array.map(corners, function(corner){
				var c = { corner: corner, pos: {x:pos.x,y:pos.y} };
				if(padding){
					c.pos.x += corner.charAt(1) == 'L' ? padding.x : -padding.x;
					c.pos.y += corner.charAt(0) == 'T' ? padding.y : -padding.y;
				}
				return c;
			});

			return _place(node, choices);
		},

		around: function(
			/*DomNode*/		node,
			/*DomNode || dijit.place.__Rectangle*/ anchor,
			/*String[]*/	positions,
			/*Boolean*/		leftToRight,
			/*Function?*/	layoutNode){

			// summary:
			//		Position node adjacent or kitty-corner to anchor
			//		such that it's fully visible in viewport.
			//
			// description:
			//		Place node such that corner of node touches a corner of
			//		aroundNode, and that node is fully visible.
			//
			// anchor:
			//		Either a DOMNode or a __Rectangle (object with x, y, width, height).
			//
			// positions:
			//		Ordered list of positions to try matching up.
			//			* before: places drop down to the left of the anchor node/widget, or to the right in the case
			//				of RTL scripts like Hebrew and Arabic; aligns either the top of the drop down
			//				with the top of the anchor, or the bottom of the drop down with bottom of the anchor.
			//			* after: places drop down to the right of the anchor node/widget, or to the left in the case
			//				of RTL scripts like Hebrew and Arabic; aligns either the top of the drop down
			//				with the top of the anchor, or the bottom of the drop down with bottom of the anchor.
			//			* before-centered: centers drop down to the left of the anchor node/widget, or to the right
			//				 in the case of RTL scripts like Hebrew and Arabic
			//			* after-centered: centers drop down to the right of the anchor node/widget, or to the left
			//				 in the case of RTL scripts like Hebrew and Arabic
			//			* above-centered: drop down is centered above anchor node
			//			* above: drop down goes above anchor node, left sides aligned
			//			* above-alt: drop down goes above anchor node, right sides aligned
			//			* below-centered: drop down is centered above anchor node
			//			* below: drop down goes below anchor node
			//			* below-alt: drop down goes below anchor node, right sides aligned
			//
			// layoutNode: Function(node, aroundNodeCorner, nodeCorner)
			//		For things like tooltip, they are displayed differently (and have different dimensions)
			//		based on their orientation relative to the parent.	 This adjusts the popup based on orientation.
			//
			// leftToRight:
			//		True if widget is LTR, false if widget is RTL.   Affects the behavior of "above" and "below"
			//		positions slightly.
			//
			// example:
			//	|	placeAroundNode(node, aroundNode, {'BL':'TL', 'TR':'BR'});
			//		This will try to position node such that node's top-left corner is at the same position
			//		as the bottom left corner of the aroundNode (ie, put node below
			//		aroundNode, with left edges aligned).	If that fails it will try to put
			// 		the bottom-right corner of node where the top right corner of aroundNode is
			//		(ie, put node above aroundNode, with right edges aligned)
			//

			// if around is a DOMNode (or DOMNode id), convert to coordinates
			var aroundNodePos = (typeof anchor == "string" || "offsetWidth" in anchor)
				? domGeometry.position(anchor, true)
				: anchor;

			// Adjust anchor positioning for the case that a parent node has overflw hidden, therefore cuasing the anchor not to be completely visible
			if(anchor.parentNode){
				var parent = anchor.parentNode;
				while(parent && parent.nodeType == 1 && parent.nodeName != "BODY"){  //ignoring the body will help performance
					var parentPos = domGeometry.position(parent, true);
					var parentStyleOverflow = domStyle.getComputedStyle(parent).overflow;
					if(parentStyleOverflow == "hidden" || parentStyleOverflow == "auto" || parentStyleOverflow == "scroll"){
						var bottomYCoord = Math.min(aroundNodePos.y + aroundNodePos.h, parentPos.y + parentPos.h);
						var rightXCoord = Math.min(aroundNodePos.x + aroundNodePos.w, parentPos.x + parentPos.w);
						aroundNodePos.x = Math.max(aroundNodePos.x, parentPos.x);
						aroundNodePos.y = Math.max(aroundNodePos.y, parentPos.y);
						aroundNodePos.h = bottomYCoord - aroundNodePos.y;
						aroundNodePos.w = rightXCoord - aroundNodePos.x;
					}	
					parent = parent.parentNode;
				}
			}			

			var x = aroundNodePos.x,
				y = aroundNodePos.y,
				width = "w" in aroundNodePos ? aroundNodePos.w : (aroundNodePos.w = aroundNodePos.width),
				height = "h" in aroundNodePos ? aroundNodePos.h : (kernel.deprecated("place.around: dijit.place.__Rectangle: { x:"+x+", y:"+y+", height:"+aroundNodePos.height+", width:"+width+" } has been deprecated.  Please use { x:"+x+", y:"+y+", h:"+aroundNodePos.height+", w:"+width+" }", "", "2.0"), aroundNodePos.h = aroundNodePos.height);

			// Convert positions arguments into choices argument for _place()
			var choices = [];
			function push(aroundCorner, corner){
				choices.push({
					aroundCorner: aroundCorner,
					corner: corner,
					pos: {
						x: {
							'L': x,
							'R': x + width,
							'M': x + (width >> 1)
						   }[aroundCorner.charAt(1)],
						y: {
							'T': y,
							'B': y + height,
							'M': y + (height >> 1)
						   }[aroundCorner.charAt(0)]
					}
				})
			}
			array.forEach(positions, function(pos){
				var ltr =  leftToRight;
				switch(pos){
					case "above-centered":
						push("TM", "BM");
						break;
					case "below-centered":
						push("BM", "TM");
						break;
					case "after-centered":
						ltr = !ltr;
						// fall through
					case "before-centered":
						push(ltr ? "ML" : "MR", ltr ? "MR" : "ML");
						break;
					case "after":
						ltr = !ltr;
						// fall through
					case "before":
						push(ltr ? "TL" : "TR", ltr ? "TR" : "TL");
						push(ltr ? "BL" : "BR", ltr ? "BR" : "BL");
						break;
					case "below-alt":
						ltr = !ltr;
						// fall through
					case "below":
						// first try to align left borders, next try to align right borders (or reverse for RTL mode)
						push(ltr ? "BL" : "BR", ltr ? "TL" : "TR");
						push(ltr ? "BR" : "BL", ltr ? "TR" : "TL");
						break;
					case "above-alt":
						ltr = !ltr;
						// fall through
					case "above":
						// first try to align left borders, next try to align right borders (or reverse for RTL mode)
						push(ltr ? "TL" : "TR", ltr ? "BL" : "BR");
						push(ltr ? "TR" : "TL", ltr ? "BR" : "BL");
						break;
					default:
						// To assist dijit/_base/place, accept arguments of type {aroundCorner: "BL", corner: "TL"}.
						// Not meant to be used directly.
						push(pos.aroundCorner, pos.corner);
				}
			});

			var position = _place(node, choices, layoutNode, {w: width, h: height});
			position.aroundNodePos = aroundNodePos;

			return position;
		}
	});
});

},
'dojo/dnd/Selector':function(){
define(["../main", "./common", "./Container"], function(dojo) {
	// module:
	//		dojo/dnd/Selector
	// summary:
	//		TODOC


/*
	Container item states:
		""			- an item is not selected
		"Selected"	- an item is selected
		"Anchor"	- an item is selected, and is an anchor for a "shift" selection
*/

/*=====
dojo.declare("dojo.dnd.__SelectorArgs", [dojo.dnd.__ContainerArgs], {
	//	singular: Boolean
	//		allows selection of only one element, if true
	singular: false,

	//	autoSync: Boolean
	//		autosynchronizes the source with its list of DnD nodes,
	autoSync: false
});
=====*/

dojo.declare("dojo.dnd.Selector", dojo.dnd.Container, {
	// summary:
	//		a Selector object, which knows how to select its children

	/*=====
	// selection: Set<String>
	//		The set of id's that are currently selected, such that this.selection[id] == 1
	//		if the node w/that id is selected.  Can iterate over selected node's id's like:
	//	|		for(var id in this.selection)
	selection: {},
	=====*/

	constructor: function(node, params){
		// summary:
		//		constructor of the Selector
		// node: Node||String
		//		node or node's id to build the selector on
		// params: dojo.dnd.__SelectorArgs?
		//		a dictionary of parameters
		if(!params){ params = {}; }
		this.singular = params.singular;
		this.autoSync = params.autoSync;
		// class-specific variables
		this.selection = {};
		this.anchor = null;
		this.simpleSelection = false;
		// set up events
		this.events.push(
			dojo.connect(this.node, "onmousedown", this, "onMouseDown"),
			dojo.connect(this.node, "onmouseup",   this, "onMouseUp"));
	},

	// object attributes (for markup)
	singular: false,	// is singular property

	// methods
	getSelectedNodes: function(){
		// summary:
		//		returns a list (an array) of selected nodes
		var t = new dojo.NodeList();
		var e = dojo.dnd._empty;
		for(var i in this.selection){
			if(i in e){ continue; }
			t.push(dojo.byId(i));
		}
		return t;	// NodeList
	},
	selectNone: function(){
		// summary:
		//		unselects all items
		return this._removeSelection()._removeAnchor();	// self
	},
	selectAll: function(){
		// summary:
		//		selects all items
		this.forInItems(function(data, id){
			this._addItemClass(dojo.byId(id), "Selected");
			this.selection[id] = 1;
		}, this);
		return this._removeAnchor();	// self
	},
	deleteSelectedNodes: function(){
		// summary:
		//		deletes all selected items
		var e = dojo.dnd._empty;
		for(var i in this.selection){
			if(i in e){ continue; }
			var n = dojo.byId(i);
			this.delItem(i);
			dojo.destroy(n);
		}
		this.anchor = null;
		this.selection = {};
		return this;	// self
	},
	forInSelectedItems: function(/*Function*/ f, /*Object?*/ o){
		// summary:
		//		iterates over selected items;
		//		see `dojo.dnd.Container.forInItems()` for details
		o = o || dojo.global;
		var s = this.selection, e = dojo.dnd._empty;
		for(var i in s){
			if(i in e){ continue; }
			f.call(o, this.getItem(i), i, this);
		}
	},
	sync: function(){
		// summary:
		//		sync up the node list with the data map

		dojo.dnd.Selector.superclass.sync.call(this);

		// fix the anchor
		if(this.anchor){
			if(!this.getItem(this.anchor.id)){
				this.anchor = null;
			}
		}

		// fix the selection
		var t = [], e = dojo.dnd._empty;
		for(var i in this.selection){
			if(i in e){ continue; }
			if(!this.getItem(i)){
				t.push(i);
			}
		}
		dojo.forEach(t, function(i){
			delete this.selection[i];
		}, this);

		return this;	// self
	},
	insertNodes: function(addSelected, data, before, anchor){
		// summary:
		//		inserts new data items (see `dojo.dnd.Container.insertNodes()` method for details)
		// addSelected: Boolean
		//		all new nodes will be added to selected items, if true, no selection change otherwise
		// data: Array
		//		a list of data items, which should be processed by the creator function
		// before: Boolean
		//		insert before the anchor, if true, and after the anchor otherwise
		// anchor: Node
		//		the anchor node to be used as a point of insertion
		var oldCreator = this._normalizedCreator;
		this._normalizedCreator = function(item, hint){
			var t = oldCreator.call(this, item, hint);
			if(addSelected){
				if(!this.anchor){
					this.anchor = t.node;
					this._removeItemClass(t.node, "Selected");
					this._addItemClass(this.anchor, "Anchor");
				}else if(this.anchor != t.node){
					this._removeItemClass(t.node, "Anchor");
					this._addItemClass(t.node, "Selected");
				}
				this.selection[t.node.id] = 1;
			}else{
				this._removeItemClass(t.node, "Selected");
				this._removeItemClass(t.node, "Anchor");
			}
			return t;
		};
		dojo.dnd.Selector.superclass.insertNodes.call(this, data, before, anchor);
		this._normalizedCreator = oldCreator;
		return this;	// self
	},
	destroy: function(){
		// summary:
		//		prepares the object to be garbage-collected
		dojo.dnd.Selector.superclass.destroy.call(this);
		this.selection = this.anchor = null;
	},

	// mouse events
	onMouseDown: function(e){
		// summary:
		//		event processor for onmousedown
		// e: Event
		//		mouse event
		if(this.autoSync){ this.sync(); }
		if(!this.current){ return; }
		if(!this.singular && !dojo.isCopyKey(e) && !e.shiftKey && (this.current.id in this.selection)){
			this.simpleSelection = true;
			if(e.button === dojo.mouseButtons.LEFT){
				// accept the left button and stop the event
				// for IE we don't stop event when multiple buttons are pressed
				dojo.stopEvent(e);
			}
			return;
		}
		if(!this.singular && e.shiftKey){
			if(!dojo.isCopyKey(e)){
				this._removeSelection();
			}
			var c = this.getAllNodes();
			if(c.length){
				if(!this.anchor){
					this.anchor = c[0];
					this._addItemClass(this.anchor, "Anchor");
				}
				this.selection[this.anchor.id] = 1;
				if(this.anchor != this.current){
					var i = 0;
					for(; i < c.length; ++i){
						var node = c[i];
						if(node == this.anchor || node == this.current){ break; }
					}
					for(++i; i < c.length; ++i){
						var node = c[i];
						if(node == this.anchor || node == this.current){ break; }
						this._addItemClass(node, "Selected");
						this.selection[node.id] = 1;
					}
					this._addItemClass(this.current, "Selected");
					this.selection[this.current.id] = 1;
				}
			}
		}else{
			if(this.singular){
				if(this.anchor == this.current){
					if(dojo.isCopyKey(e)){
						this.selectNone();
					}
				}else{
					this.selectNone();
					this.anchor = this.current;
					this._addItemClass(this.anchor, "Anchor");
					this.selection[this.current.id] = 1;
				}
			}else{
				if(dojo.isCopyKey(e)){
					if(this.anchor == this.current){
						delete this.selection[this.anchor.id];
						this._removeAnchor();
					}else{
						if(this.current.id in this.selection){
							this._removeItemClass(this.current, "Selected");
							delete this.selection[this.current.id];
						}else{
							if(this.anchor){
								this._removeItemClass(this.anchor, "Anchor");
								this._addItemClass(this.anchor, "Selected");
							}
							this.anchor = this.current;
							this._addItemClass(this.current, "Anchor");
							this.selection[this.current.id] = 1;
						}
					}
				}else{
					if(!(this.current.id in this.selection)){
						this.selectNone();
						this.anchor = this.current;
						this._addItemClass(this.current, "Anchor");
						this.selection[this.current.id] = 1;
					}
				}
			}
		}
		dojo.stopEvent(e);
	},
	onMouseUp: function(e){
		// summary:
		//		event processor for onmouseup
		// e: Event
		//		mouse event
		if(!this.simpleSelection){ return; }
		this.simpleSelection = false;
		this.selectNone();
		if(this.current){
			this.anchor = this.current;
			this._addItemClass(this.anchor, "Anchor");
			this.selection[this.current.id] = 1;
		}
	},
	onMouseMove: function(e){
		// summary:
		//		event processor for onmousemove
		// e: Event
		//		mouse event
		this.simpleSelection = false;
	},

	// utilities
	onOverEvent: function(){
		// summary:
		//		this function is called once, when mouse is over our container
		this.onmousemoveEvent = dojo.connect(this.node, "onmousemove", this, "onMouseMove");
	},
	onOutEvent: function(){
		// summary:
		//		this function is called once, when mouse is out of our container
		dojo.disconnect(this.onmousemoveEvent);
		delete this.onmousemoveEvent;
	},
	_removeSelection: function(){
		// summary:
		//		unselects all items
		var e = dojo.dnd._empty;
		for(var i in this.selection){
			if(i in e){ continue; }
			var node = dojo.byId(i);
			if(node){ this._removeItemClass(node, "Selected"); }
		}
		this.selection = {};
		return this;	// self
	},
	_removeAnchor: function(){
		if(this.anchor){
			this._removeItemClass(this.anchor, "Anchor");
			this.anchor = null;
		}
		return this;	// self
	}
});

return dojo.dnd.Selector;
});

},
'dijit/_MenuBase':function(){
define("dijit/_MenuBase", [
	"./popup",
	"dojo/window",
	"./_Widget",
	"./_KeyNavContainer",
	"./_TemplatedMixin",
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.isDescendant domClass.replace
	"dojo/dom-attr",
	"dojo/dom-class", // domClass.replace
	"dojo/_base/lang", // lang.hitch
	"dojo/_base/array"	// array.indexOf
], function(pm, winUtils, _Widget, _KeyNavContainer, _TemplatedMixin,
	declare, dom, domAttr, domClass, lang, array){

/*=====
	var _Widget = dijit._Widget;
	var _TemplatedMixin = dijit._TemplatedMixin;
	var _KeyNavContainer = dijit._KeyNavContainer;
=====*/

// module:
//		dijit/_MenuBase
// summary:
//		Base class for Menu and MenuBar

return declare("dijit._MenuBase",
	[_Widget, _TemplatedMixin, _KeyNavContainer],
{
	// summary:
	//		Base class for Menu and MenuBar

	// parentMenu: [readonly] Widget
	//		pointer to menu that displayed me
	parentMenu: null,

	// popupDelay: Integer
	//		number of milliseconds before hovering (without clicking) causes the popup to automatically open.
	popupDelay: 500,

	onExecute: function(){
		// summary:
		//		Attach point for notification about when a menu item has been executed.
		//		This is an internal mechanism used for Menus to signal to their parent to
		//		close them, because they are about to execute the onClick handler.  In
		//		general developers should not attach to or override this method.
		// tags:
		//		protected
	},

	onCancel: function(/*Boolean*/ /*===== closeAll =====*/){
		// summary:
		//		Attach point for notification about when the user cancels the current menu
		//		This is an internal mechanism used for Menus to signal to their parent to
		//		close them.  In general developers should not attach to or override this method.
		// tags:
		//		protected
	},

	_moveToPopup: function(/*Event*/ evt){
		// summary:
		//		This handles the right arrow key (left arrow key on RTL systems),
		//		which will either open a submenu, or move to the next item in the
		//		ancestor MenuBar
		// tags:
		//		private

		if(this.focusedChild && this.focusedChild.popup && !this.focusedChild.disabled){
			this.focusedChild._onClick(evt);
		}else{
			var topMenu = this._getTopMenu();
			if(topMenu && topMenu._isMenuBar){
				topMenu.focusNext();
			}
		}
	},

	_onPopupHover: function(/*Event*/ /*===== evt =====*/){
		// summary:
		//		This handler is called when the mouse moves over the popup.
		// tags:
		//		private

		// if the mouse hovers over a menu popup that is in pending-close state,
		// then stop the close operation.
		// This can't be done in onItemHover since some popup targets don't have MenuItems (e.g. ColorPicker)
		if(this.currentPopup && this.currentPopup._pendingClose_timer){
			var parentMenu = this.currentPopup.parentMenu;
			// highlight the parent menu item pointing to this popup
			if(parentMenu.focusedChild){
				parentMenu.focusedChild._setSelected(false);
			}
			parentMenu.focusedChild = this.currentPopup.from_item;
			parentMenu.focusedChild._setSelected(true);
			// cancel the pending close
			this._stopPendingCloseTimer(this.currentPopup);
		}
	},

	onItemHover: function(/*MenuItem*/ item){
		// summary:
		//		Called when cursor is over a MenuItem.
		// tags:
		//		protected

		// Don't do anything unless user has "activated" the menu by:
		//		1) clicking it
		//		2) opening it from a parent menu (which automatically focuses it)
		if(this.isActive){
			this.focusChild(item);
			if(this.focusedChild.popup && !this.focusedChild.disabled && !this.hover_timer){
				this.hover_timer = setTimeout(lang.hitch(this, "_openPopup"), this.popupDelay);
			}
		}
		// if the user is mixing mouse and keyboard navigation,
		// then the menu may not be active but a menu item has focus,
		// but it's not the item that the mouse just hovered over.
		// To avoid both keyboard and mouse selections, use the latest.
		if(this.focusedChild){
			this.focusChild(item);
		}
		this._hoveredChild = item;
	},

	_onChildBlur: function(item){
		// summary:
		//		Called when a child MenuItem becomes inactive because focus
		//		has been removed from the MenuItem *and* it's descendant menus.
		// tags:
		//		private
		this._stopPopupTimer();
		item._setSelected(false);
		// Close all popups that are open and descendants of this menu
		var itemPopup = item.popup;
		if(itemPopup){
			this._stopPendingCloseTimer(itemPopup);
			itemPopup._pendingClose_timer = setTimeout(function(){
				itemPopup._pendingClose_timer = null;
				if(itemPopup.parentMenu){
					itemPopup.parentMenu.currentPopup = null;
				}
				pm.close(itemPopup); // this calls onClose
			}, this.popupDelay);
		}
	},

	onItemUnhover: function(/*MenuItem*/ item){
		// summary:
		//		Callback fires when mouse exits a MenuItem
		// tags:
		//		protected

		if(this.isActive){
			this._stopPopupTimer();
		}
		if(this._hoveredChild == item){ this._hoveredChild = null; }
	},

	_stopPopupTimer: function(){
		// summary:
		//		Cancels the popup timer because the user has stop hovering
		//		on the MenuItem, etc.
		// tags:
		//		private
		if(this.hover_timer){
			clearTimeout(this.hover_timer);
			this.hover_timer = null;
		}
	},

	_stopPendingCloseTimer: function(/*dijit._Widget*/ popup){
		// summary:
		//		Cancels the pending-close timer because the close has been preempted
		// tags:
		//		private
		if(popup._pendingClose_timer){
			clearTimeout(popup._pendingClose_timer);
			popup._pendingClose_timer = null;
		}
	},

	_stopFocusTimer: function(){
		// summary:
		//		Cancels the pending-focus timer because the menu was closed before focus occured
		// tags:
		//		private
		if(this._focus_timer){
			clearTimeout(this._focus_timer);
			this._focus_timer = null;
		}
	},

	_getTopMenu: function(){
		// summary:
		//		Returns the top menu in this chain of Menus
		// tags:
		//		private
		for(var top=this; top.parentMenu; top=top.parentMenu);
		return top;
	},

	onItemClick: function(/*dijit._Widget*/ item, /*Event*/ evt){
		// summary:
		//		Handle clicks on an item.
		// tags:
		//		private

		// this can't be done in _onFocus since the _onFocus events occurs asynchronously
		if(typeof this.isShowingNow == 'undefined'){ // non-popup menu
			this._markActive();
		}

		this.focusChild(item);

		if(item.disabled){ return false; }

		if(item.popup){
			this._openPopup();
		}else{
			// before calling user defined handler, close hierarchy of menus
			// and restore focus to place it was when menu was opened
			this.onExecute();

			// user defined handler for click
			item.onClick(evt);
		}
	},

	_openPopup: function(){
		// summary:
		//		Open the popup to the side of/underneath the current menu item
		// tags:
		//		protected

		this._stopPopupTimer();
		var from_item = this.focusedChild;
		if(!from_item){ return; } // the focused child lost focus since the timer was started
		var popup = from_item.popup;
		if(popup.isShowingNow){ return; }
		if(this.currentPopup){
			this._stopPendingCloseTimer(this.currentPopup);
			pm.close(this.currentPopup);
		}
		popup.parentMenu = this;
		popup.from_item = from_item; // helps finding the parent item that should be focused for this popup
		var self = this;
		pm.open({
			parent: this,
			popup: popup,
			around: from_item.domNode,
			orient: this._orient || ["after", "before"],
			onCancel: function(){ // called when the child menu is canceled
				// set isActive=false (_closeChild vs _cleanUp) so that subsequent hovering will NOT open child menus
				// which seems aligned with the UX of most applications (e.g. notepad, wordpad, paint shop pro)
				self.focusChild(from_item);	// put focus back on my node
				self._cleanUp();			// close the submenu (be sure this is done _after_ focus is moved)
				from_item._setSelected(true); // oops, _cleanUp() deselected the item
				self.focusedChild = from_item;	// and unset focusedChild
			},
			onExecute: lang.hitch(this, "_cleanUp")
		});

		this.currentPopup = popup;
		// detect mouseovers to handle lazy mouse movements that temporarily focus other menu items
		popup.connect(popup.domNode, "onmouseenter", lang.hitch(self, "_onPopupHover")); // cleaned up when the popped-up widget is destroyed on close

		if(popup.focus){
			// If user is opening the popup via keyboard (right arrow, or down arrow for MenuBar),
			// if the cursor happens to collide with the popup, it will generate an onmouseover event
			// even though the mouse wasn't moved.  Use a setTimeout() to call popup.focus so that
			// our focus() call overrides the onmouseover event, rather than vice-versa.  (#8742)
			popup._focus_timer = setTimeout(lang.hitch(popup, function(){
				this._focus_timer = null;
				this.focus();
			}), 0);
		}
	},

	_markActive: function(){
		// summary:
		//		Mark this menu's state as active.
		//		Called when this Menu gets focus from:
		//			1) clicking it (mouse or via space/arrow key)
		//			2) being opened by a parent menu.
		//		This is not called just from mouse hover.
		//		Focusing a menu via TAB does NOT automatically set isActive
		//		since TAB is a navigation operation and not a selection one.
		//		For Windows apps, pressing the ALT key focuses the menubar
		//		menus (similar to TAB navigation) but the menu is not active
		//		(ie no dropdown) until an item is clicked.
		this.isActive = true;
		domClass.replace(this.domNode, "dijitMenuActive", "dijitMenuPassive");
	},

	onOpen: function(/*Event*/ /*===== e =====*/){
		// summary:
		//		Callback when this menu is opened.
		//		This is called by the popup manager as notification that the menu
		//		was opened.
		// tags:
		//		private

		this.isShowingNow = true;
		this._markActive();
	},

	_markInactive: function(){
		// summary:
		//		Mark this menu's state as inactive.
		this.isActive = false; // don't do this in _onBlur since the state is pending-close until we get here
		domClass.replace(this.domNode, "dijitMenuPassive", "dijitMenuActive");
	},

	onClose: function(){
		// summary:
		//		Callback when this menu is closed.
		//		This is called by the popup manager as notification that the menu
		//		was closed.
		// tags:
		//		private

		this._stopFocusTimer();
		this._markInactive();
		this.isShowingNow = false;
		this.parentMenu = null;
	},

	_closeChild: function(){
		// summary:
		//		Called when submenu is clicked or focus is lost.  Close hierarchy of menus.
		// tags:
		//		private
		this._stopPopupTimer();

		if(this.currentPopup){
			// If focus is on a descendant MenuItem then move focus to me,
			// because IE doesn't like it when you display:none a node with focus,
			// and also so keyboard users don't lose control.
			// Likely, immediately after a user defined onClick handler will move focus somewhere
			// else, like a Dialog.
			if(array.indexOf(this._focusManager.activeStack, this.id) >= 0){
				domAttr.set(this.focusedChild.focusNode, "tabIndex", this.tabIndex);
				this.focusedChild.focusNode.focus();
			}
			// Close all popups that are open and descendants of this menu
			pm.close(this.currentPopup);
			this.currentPopup = null;
		}

		if(this.focusedChild){ // unhighlight the focused item
			this.focusedChild._setSelected(false);
			this.focusedChild._onUnhover();
			this.focusedChild = null;
		}
	},

	_onItemFocus: function(/*MenuItem*/ item){
		// summary:
		//		Called when child of this Menu gets focus from:
		//			1) clicking it
		//			2) tabbing into it
		//			3) being opened by a parent menu.
		//		This is not called just from mouse hover.
		if(this._hoveredChild && this._hoveredChild != item){
			this._hoveredChild._onUnhover(); // any previous mouse movement is trumped by focus selection
		}
	},

	_onBlur: function(){
		// summary:
		//		Called when focus is moved away from this Menu and it's submenus.
		// tags:
		//		protected
		this._cleanUp();
		this.inherited(arguments);
	},

	_cleanUp: function(){
		// summary:
		//		Called when the user is done with this menu.  Closes hierarchy of menus.
		// tags:
		//		private

		this._closeChild(); // don't call this.onClose since that's incorrect for MenuBar's that never close
		if(typeof this.isShowingNow == 'undefined'){ // non-popup menu doesn't call onClose
			this._markInactive();
		}
	}
});

});

},
'dijit/focus':function(){
define("dijit/focus", [
	"dojo/aspect",
	"dojo/_base/declare", // declare
	"dojo/dom", // domAttr.get dom.isDescendant
	"dojo/dom-attr", // domAttr.get dom.isDescendant
	"dojo/dom-construct", // connect to domConstruct.empty, domConstruct.destroy
	"dojo/Evented",
	"dojo/_base/lang", // lang.hitch
	"dojo/on",
	"dojo/ready",
	"dojo/_base/sniff", // has("ie")
	"dojo/Stateful",
	"dojo/_base/unload", // unload.addOnWindowUnload
	"dojo/_base/window", // win.body
	"dojo/window", // winUtils.get
	"./a11y",	// a11y.isTabNavigable
	"./registry",	// registry.byId
	"."		// to set dijit.focus
], function(aspect, declare, dom, domAttr, domConstruct, Evented, lang, on, ready, has, Stateful, unload, win, winUtils,
			a11y, registry, dijit){

	// module:
	//		dijit/focus
	// summary:
	//		Returns a singleton that tracks the currently focused node, and which widgets are currently "active".

/*=====
	dijit.focus = {
		// summary:
		//		Tracks the currently focused node, and which widgets are currently "active".
		//		Access via require(["dijit/focus"], function(focus){ ... }).
		//
		//		A widget is considered active if it or a descendant widget has focus,
		//		or if a non-focusable node of this widget or a descendant was recently clicked.
		//
		//		Call focus.watch("curNode", callback) to track the current focused DOMNode,
		//		or focus.watch("activeStack", callback) to track the currently focused stack of widgets.
		//
		//		Call focus.on("widget-blur", func) or focus.on("widget-focus", ...) to monitor when
		//		when widgets become active/inactive
		//
		//		Finally, focus(node) will focus a node, suppressing errors if the node doesn't exist.

		// curNode: DomNode
		//		Currently focused item on screen
		curNode: null,

		// activeStack: dijit._Widget[]
		//		List of currently active widgets (focused widget and it's ancestors)
		activeStack: [],

		registerIframe: function(iframe){
			// summary:
			//		Registers listeners on the specified iframe so that any click
			//		or focus event on that iframe (or anything in it) is reported
			//		as a focus/click event on the <iframe> itself.
			// description:
			//		Currently only used by editor.
			// returns:
			//		Handle with remove() method to deregister.
		},

		registerWin: function(targetWindow, effectiveNode){
			// summary:
			//		Registers listeners on the specified window (either the main
			//		window or an iframe's window) to detect when the user has clicked somewhere
			//		or focused somewhere.
			// description:
			//		Users should call registerIframe() instead of this method.
			// targetWindow: Window?
			//		If specified this is the window associated with the iframe,
			//		i.e. iframe.contentWindow.
			// effectiveNode: DOMNode?
			//		If specified, report any focus events inside targetWindow as
			//		an event on effectiveNode, rather than on evt.target.
			// returns:
			//		Handle with remove() method to deregister.
		}
	};
=====*/

	var FocusManager = declare([Stateful, Evented], {
		// curNode: DomNode
		//		Currently focused item on screen
		curNode: null,

		// activeStack: dijit._Widget[]
		//		List of currently active widgets (focused widget and it's ancestors)
		activeStack: [],

		constructor: function(){
			// Don't leave curNode/prevNode pointing to bogus elements
			var check = lang.hitch(this, function(node){
				if(dom.isDescendant(this.curNode, node)){
					this.set("curNode", null);
				}
				if(dom.isDescendant(this.prevNode, node)){
					this.set("prevNode", null);
				}
			});
			aspect.before(domConstruct, "empty", check);
			aspect.before(domConstruct, "destroy", check);
		},

		registerIframe: function(/*DomNode*/ iframe){
			// summary:
			//		Registers listeners on the specified iframe so that any click
			//		or focus event on that iframe (or anything in it) is reported
			//		as a focus/click event on the <iframe> itself.
			// description:
			//		Currently only used by editor.
			// returns:
			//		Handle with remove() method to deregister.
			return this.registerWin(iframe.contentWindow, iframe);
		},

		registerWin: function(/*Window?*/targetWindow, /*DomNode?*/ effectiveNode){
			// summary:
			//		Registers listeners on the specified window (either the main
			//		window or an iframe's window) to detect when the user has clicked somewhere
			//		or focused somewhere.
			// description:
			//		Users should call registerIframe() instead of this method.
			// targetWindow:
			//		If specified this is the window associated with the iframe,
			//		i.e. iframe.contentWindow.
			// effectiveNode:
			//		If specified, report any focus events inside targetWindow as
			//		an event on effectiveNode, rather than on evt.target.
			// returns:
			//		Handle with remove() method to deregister.

			// TODO: make this function private in 2.0; Editor/users should call registerIframe(),

			var _this = this;
			var mousedownListener = function(evt){
				_this._justMouseDowned = true;
				setTimeout(function(){ _this._justMouseDowned = false; }, 0);

				// workaround weird IE bug where the click is on an orphaned node
				// (first time clicking a Select/DropDownButton inside a TooltipDialog)
				if(has("ie") && evt && evt.srcElement && evt.srcElement.parentNode == null){
					return;
				}

				_this._onTouchNode(effectiveNode || evt.target || evt.srcElement, "mouse");
			};

			// Listen for blur and focus events on targetWindow's document.
			// IIRC, I'm using attachEvent() rather than dojo.connect() because focus/blur events don't bubble
			// through dojo.connect(), and also maybe to catch the focus events early, before onfocus handlers
			// fire.
			// Connect to <html> (rather than document) on IE to avoid memory leaks, but document on other browsers because
			// (at least for FF) the focus event doesn't fire on <html> or <body>.
			var doc = has("ie") ? targetWindow.document.documentElement : targetWindow.document;
			if(doc){
				if(has("ie")){
					targetWindow.document.body.attachEvent('onmousedown', mousedownListener);
					var activateListener = function(evt){
						// IE reports that nodes like <body> have gotten focus, even though they have tabIndex=-1,
						// ignore those events
						var tag = evt.srcElement.tagName.toLowerCase();
						if(tag == "#document" || tag == "body"){ return; }

						// Previous code called _onTouchNode() for any activate event on a non-focusable node.   Can
						// probably just ignore such an event as it will be handled by onmousedown handler above, but
						// leaving the code for now.
						if(a11y.isTabNavigable(evt.srcElement)){
							_this._onFocusNode(effectiveNode || evt.srcElement);
						}else{
							_this._onTouchNode(effectiveNode || evt.srcElement);
						}
					};
					doc.attachEvent('onactivate', activateListener);
					var deactivateListener =  function(evt){
						_this._onBlurNode(effectiveNode || evt.srcElement);
					};
					doc.attachEvent('ondeactivate', deactivateListener);

					return {
						remove: function(){
							targetWindow.document.detachEvent('onmousedown', mousedownListener);
							doc.detachEvent('onactivate', activateListener);
							doc.detachEvent('ondeactivate', deactivateListener);
							doc = null;	// prevent memory leak (apparent circular reference via closure)
						}
					};
				}else{
					doc.body.addEventListener('mousedown', mousedownListener, true);
					doc.body.addEventListener('touchstart', mousedownListener, true);
					var focusListener = function(evt){
						_this._onFocusNode(effectiveNode || evt.target);
					};
					doc.addEventListener('focus', focusListener, true);
					var blurListener = function(evt){
						_this._onBlurNode(effectiveNode || evt.target);
					};
					doc.addEventListener('blur', blurListener, true);

					return {
						remove: function(){
							doc.body.removeEventListener('mousedown', mousedownListener, true);
							doc.body.removeEventListener('touchstart', mousedownListener, true);
							doc.removeEventListener('focus', focusListener, true);
							doc.removeEventListener('blur', blurListener, true);
							doc = null;	// prevent memory leak (apparent circular reference via closure)
						}
					};
				}
			}
		},

		_onBlurNode: function(/*DomNode*/ /*===== node =====*/){
			// summary:
			// 		Called when focus leaves a node.
			//		Usually ignored, _unless_ it *isn't* followed by touching another node,
			//		which indicates that we tabbed off the last field on the page,
			//		in which case every widget is marked inactive
			this.set("prevNode", this.curNode);
			this.set("curNode", null);

			if(this._justMouseDowned){
				// the mouse down caused a new widget to be marked as active; this blur event
				// is coming late, so ignore it.
				return;
			}

			// if the blur event isn't followed by a focus event then mark all widgets as inactive.
			if(this._clearActiveWidgetsTimer){
				clearTimeout(this._clearActiveWidgetsTimer);
			}
			this._clearActiveWidgetsTimer = setTimeout(lang.hitch(this, function(){
				delete this._clearActiveWidgetsTimer;
				this._setStack([]);
				this.prevNode = null;
			}), 100);
		},

		_onTouchNode: function(/*DomNode*/ node, /*String*/ by){
			// summary:
			//		Callback when node is focused or mouse-downed
			// node:
			//		The node that was touched.
			// by:
			//		"mouse" if the focus/touch was caused by a mouse down event

			// ignore the recent blurNode event
			if(this._clearActiveWidgetsTimer){
				clearTimeout(this._clearActiveWidgetsTimer);
				delete this._clearActiveWidgetsTimer;
			}

			// compute stack of active widgets (ex: ComboButton --> Menu --> MenuItem)
			var newStack=[];
			try{
				while(node){
					var popupParent = domAttr.get(node, "dijitPopupParent");
					if(popupParent){
						node=registry.byId(popupParent).domNode;
					}else if(node.tagName && node.tagName.toLowerCase() == "body"){
						// is this the root of the document or just the root of an iframe?
						if(node === win.body()){
							// node is the root of the main document
							break;
						}
						// otherwise, find the iframe this node refers to (can't access it via parentNode,
						// need to do this trick instead). window.frameElement is supported in IE/FF/Webkit
						node=winUtils.get(node.ownerDocument).frameElement;
					}else{
						// if this node is the root node of a widget, then add widget id to stack,
						// except ignore clicks on disabled widgets (actually focusing a disabled widget still works,
						// to support MenuItem)
						var id = node.getAttribute && node.getAttribute("widgetId"),
							widget = id && registry.byId(id);
						if(widget && !(by == "mouse" && widget.get("disabled"))){
							newStack.unshift(id);
						}
						node=node.parentNode;
					}
				}
			}catch(e){ /* squelch */ }

			this._setStack(newStack, by);
		},

		_onFocusNode: function(/*DomNode*/ node){
			// summary:
			//		Callback when node is focused

			if(!node){
				return;
			}

			if(node.nodeType == 9){
				// Ignore focus events on the document itself.  This is here so that
				// (for example) clicking the up/down arrows of a spinner
				// (which don't get focus) won't cause that widget to blur. (FF issue)
				return;
			}

			this._onTouchNode(node);

			if(node == this.curNode){ return; }
			this.set("curNode", node);
		},

		_setStack: function(/*String[]*/ newStack, /*String*/ by){
			// summary:
			//		The stack of active widgets has changed.  Send out appropriate events and records new stack.
			// newStack:
			//		array of widget id's, starting from the top (outermost) widget
			// by:
			//		"mouse" if the focus/touch was caused by a mouse down event

			var oldStack = this.activeStack;
			this.set("activeStack", newStack);

			// compare old stack to new stack to see how many elements they have in common
			for(var nCommon=0; nCommon<Math.min(oldStack.length, newStack.length); nCommon++){
				if(oldStack[nCommon] != newStack[nCommon]){
					break;
				}
			}

			var widget;
			// for all elements that have gone out of focus, set focused=false
			for(var i=oldStack.length-1; i>=nCommon; i--){
				widget = registry.byId(oldStack[i]);
				if(widget){
					widget._hasBeenBlurred = true;		// TODO: used by form widgets, should be moved there
					widget.set("focused", false);
					if(widget._focusManager == this){
						widget._onBlur(by);
					}
					this.emit("widget-blur", widget, by);
				}
			}

			// for all element that have come into focus, set focused=true
			for(i=nCommon; i<newStack.length; i++){
				widget = registry.byId(newStack[i]);
				if(widget){
					widget.set("focused", true);
					if(widget._focusManager == this){
						widget._onFocus(by);
					}
					this.emit("widget-focus", widget, by);
				}
			}
		},

		focus: function(node){
			// summary:
			//		Focus the specified node, suppressing errors if they occur
			if(node){
				try{ node.focus(); }catch(e){/*quiet*/}
			}
		}
	});

	var singleton = new FocusManager();

	// register top window and all the iframes it contains
	ready(function(){
		var handle = singleton.registerWin(win.doc.parentWindow || win.doc.defaultView);
		if(has("ie")){
			unload.addOnWindowUnload(function(){
				handle.remove();
				handle = null;
			})
		}
	});

	// Setup dijit.focus as a pointer to the singleton but also (for backwards compatibility)
	// as a function to set focus.
	dijit.focus = function(node){
		singleton.focus(node);	// indirection here allows dijit/_base/focus.js to override behavior
	};
	for(var attr in singleton){
		if(!/^_/.test(attr)){
			dijit.focus[attr] = typeof singleton[attr] == "function" ? lang.hitch(singleton, attr) : singleton[attr];
		}
	}
	singleton.watch(function(attr, oldVal, newVal){
		dijit.focus[attr] = newVal;
	});

	return singleton;
});

},
'dijit/hccss':function(){
define("dijit/hccss", [
	"require",			// require.toUrl
	"dojo/_base/config", // config.blankGif
	"dojo/dom-class", // domClass.add domConstruct.create domStyle.getComputedStyle
	"dojo/dom-construct", // domClass.add domConstruct.create domStyle.getComputedStyle
	"dojo/dom-style", // domClass.add domConstruct.create domStyle.getComputedStyle
	"dojo/ready", // ready
	"dojo/_base/sniff", // has("ie") has("mozilla")
	"dojo/_base/window" // win.body
], function(require, config, domClass, domConstruct, domStyle, ready, has, win){

	// module:
	//		dijit/hccss
	// summary:
	//		Test if computer is in high contrast mode, and sets dijit_a11y flag on <body> if it is.

	if(has("ie") || has("mozilla")){	// NOTE: checking in Safari messes things up
		// priority is 90 to run ahead of parser priority of 100
		ready(90, function(){
			// summary:
			//		Detects if we are in high-contrast mode or not

			// create div for testing if high contrast mode is on or images are turned off
			var div = domConstruct.create("div",{
				id: "a11yTestNode",
				style:{
					cssText:'border: 1px solid;'
						+ 'border-color:red green;'
						+ 'position: absolute;'
						+ 'height: 5px;'
						+ 'top: -999px;'
						+ 'background-image: url("' + (config.blankGif || require.toUrl("dojo/resources/blank.gif")) + '");'
				}
			}, win.body());

			// test it
			var cs = domStyle.getComputedStyle(div);
			if(cs){
				var bkImg = cs.backgroundImage;
				var needsA11y = (cs.borderTopColor == cs.borderRightColor) || (bkImg != null && (bkImg == "none" || bkImg == "url(invalid-url:)" ));
				if(needsA11y){
					domClass.add(win.body(), "dijit_a11y");
				}
				if(has("ie")){
					div.outerHTML = "";		// prevent mixed-content warning, see http://support.microsoft.com/kb/925014
				}else{
					win.body().removeChild(div);
				}
			}
		});
	}
});

},
'dojox/html/metrics':function(){
define("dojox/html/metrics", ["dojo/_base/kernel","dojo/_base/lang", "dojo/_base/sniff", "dojo/ready", "dojo/_base/unload",
		"dojo/_base/window", "dojo/dom-geometry"],
  function(kernel,lang,has,ready,UnloadUtil,Window,DOMGeom){
	var dhm = lang.getObject("dojox.html.metrics",true);
	var dojox = lang.getObject("dojox");

	//	derived from Morris John's emResized measurer
	dhm.getFontMeasurements = function(){
		//	summary
		//	Returns an object that has pixel equivilents of standard font size values.
		var heights = {
			'1em':0, '1ex':0, '100%':0, '12pt':0, '16px':0, 'xx-small':0, 'x-small':0,
			'small':0, 'medium':0, 'large':0, 'x-large':0, 'xx-large':0
		};
	
		if(has("ie")){
			//	we do a font-size fix if and only if one isn't applied already.
			//	NOTE: If someone set the fontSize on the HTML Element, this will kill it.
			Window.doc.documentElement.style.fontSize="100%";
		}
	
		//	set up the measuring node.
		var div=Window.doc.createElement("div");
		var ds = div.style;
		ds.position="absolute";
		ds.left="-100px";
		ds.top="0";
		ds.width="30px";
		ds.height="1000em";
		ds.borderWidth="0";
		ds.margin="0";
		ds.padding="0";
		ds.outline="0";
		ds.lineHeight="1";
		ds.overflow="hidden";
		Window.body().appendChild(div);
	
		//	do the measurements.
		for(var p in heights){
			ds.fontSize = p;
			heights[p] = Math.round(div.offsetHeight * 12/16) * 16/12 / 1000;
		}
		
		Window.body().removeChild(div);
		div = null;
		return heights; 	//	object
	};

	var fontMeasurements = null;
	
	dhm.getCachedFontMeasurements = function(recalculate){
		if(recalculate || !fontMeasurements){
			fontMeasurements = dhm.getFontMeasurements();
		}
		return fontMeasurements;
	};

	var measuringNode = null, empty = {};
	dhm.getTextBox = function(/* String */ text, /* Object */ style, /* String? */ className){
		var m, s;
		if(!measuringNode){
			m = measuringNode = Window.doc.createElement("div");
			// Container that we can set contraints on so that it doesn't
			// trigger a scrollbar.
			var c = Window.doc.createElement("div");
			c.appendChild(m);
			s = c.style;
			s.overflow='scroll';
			s.position = "absolute";
			s.left = "0px";
			s.top = "-10000px";
			s.width = "1px";
			s.height = "1px";
			s.visibility = "hidden";
			s.borderWidth = "0";
			s.margin = "0";
			s.padding = "0";
			s.outline = "0";
			Window.body().appendChild(c);
		}else{
			m = measuringNode;
		}
		// reset styles
		m.className = "";
		s = m.style;
		s.borderWidth = "0";
		s.margin = "0";
		s.padding = "0";
		s.outline = "0";
		// set new style
		if(arguments.length > 1 && style){
			for(var i in style){
				if(i in empty){ continue; }
				s[i] = style[i];
			}
		}
		// set classes
		if(arguments.length > 2 && className){
			m.className = className;
		}
		// take a measure
		m.innerHTML = text;
		var box = DOMGeom.position(m);
		// position doesn't report right (reports 1, since parent is 1)
		// So we have to look at the scrollWidth to get the real width
		// Height is right.
		box.w = m.parentNode.scrollWidth;
		return box;
	};

	//	determine the scrollbar sizes on load.
	var scroll={ w:16, h:16 };
	dhm.getScrollbar=function(){ return { w:scroll.w, h:scroll.h }; };

	dhm._fontResizeNode = null;

	dhm.initOnFontResize = function(interval){
		var f = dhm._fontResizeNode = Window.doc.createElement("iframe");
		var fs = f.style;
		fs.position = "absolute";
		fs.width = "5em";
		fs.height = "10em";
		fs.top = "-10000px";
		if(has("ie")){
			f.onreadystatechange = function(){
				if(f.contentWindow.document.readyState == "complete"){
					f.onresize = f.contentWindow.parent[dojox._scopeName].html.metrics._fontresize;
				}
			};
		}else{
			f.onload = function(){
				f.contentWindow.onresize = f.contentWindow.parent[dojox._scopeName].html.metrics._fontresize;
			};
		}
		//The script tag is to work around a known firebug race condition.  See comments in bug #9046
		f.setAttribute("src", "javascript:'<html><head><script>if(\"loadFirebugConsole\" in window){window.loadFirebugConsole();}</script></head><body></body></html>'");
		Window.body().appendChild(f);
		dhm.initOnFontResize = function(){};
	};

	dhm.onFontResize = function(){};
	dhm._fontresize = function(){
		dhm.onFontResize();
	}

	UnloadUtil.addOnUnload(function(){
		// destroy our font resize iframe if we have one
		var f = dhm._fontResizeNode;
		if(f){
			if(has("ie") && f.onresize){
				f.onresize = null;
			}else if(f.contentWindow && f.contentWindow.onresize){
				f.contentWindow.onresize = null;
			}
			dhm._fontResizeNode = null;
		}
	});

	ready(function(){
		// getScrollbar metrics node
		try{
			var n=Window.doc.createElement("div");
			n.style.cssText = "top:0;left:0;width:100px;height:100px;overflow:scroll;position:absolute;visibility:hidden;";
			Window.body().appendChild(n);
			scroll.w = n.offsetWidth - n.clientWidth;
			scroll.h = n.offsetHeight - n.clientHeight;
			Window.body().removeChild(n);
			//console.log("Scroll bar dimensions: ", scroll);
			delete n;
		}catch(e){}

		// text size poll setup
		if("fontSizeWatch" in kernel.config && !!kernel.config.fontSizeWatch){
			dhm.initOnFontResize();
		}
	});
	return dhm;
});
},
'esri/tasks/query':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/tasks/_task,esri/_time"], function(dijit,dojo,dojox){
dojo.provide("esri.tasks.query");

dojo.require("esri.tasks._task");
dojo.require("esri._time");

dojo.declare("esri.tasks.QueryTask", esri.tasks._Task, {
    constructor: function(/*String*/ url, options) {
      //summary: Perform query on layer and return results
      this._handler = dojo.hitch(this, this._handler);
      this._relationshipQueryHandler = dojo.hitch(this, this._relationshipQueryHandler);
      this._executeForIdsHandler = dojo.hitch(this, this._executeForIdsHandler);
      this._countHandler = dojo.hitch(this, this._countHandler);
      this.source = options && options.source;
      this.gdbVersion = options && options.gdbVersion;
    },
    
    // Methods to be wrapped with normalize logic
    __msigns: [
      {
        n: "execute",
        c: 4, // number of arguments expected by the method before the normalize era
        a: [ // arguments or properties of arguments that need to be normalized
          { i: 0, p: [ "geometry"/*, "test1", "test2", "test3.features"*/ ] }
        ],
        e: 2
      },
      {
        n: "executeForIds",
        c: 3,
        a: [
          { i: 0, p: [ "geometry" ] }
        ],
        e: 2
      },
      {
        n: "executeForCount",
        c: 3,
        a: [
          { i: 0, p: [ "geometry" ] }
        ],
        e: 2
      }
    ],
    
    /*********
     * Events
     *********/

    onComplete: function() {},
    onExecuteRelationshipQueryComplete: function() {},
    onExecuteForIdsComplete: function() {},
    onExecuteForCountComplete: function() {},
    
    /*****************
     * Public Methods
     *****************/

    execute: function(/*Object*/ params, /*Function?*/ callback, /*Function?*/ errback, /*String?*/ callbackSuffix, context) {
      //summary: Execute the task and fire onComplete event. If callback is provided, the
      //         callback function will also be called.
      // params: Object: Parameters to pass to server to execute task
      // callback: Function?: Function to be called once task completes

      var assembly = context.assembly,
          _params = this._encode(dojo.mixin({}, this._url.query, { f:"json" }, params.toJson(assembly && assembly[0]))),
          _h = this._handler,
          _e = this._errorHandler;
      if (this.source) {
        var layer = {source: this.source.toJson()};
        _params.layer = dojo.toJson(layer);
      }
      if (this.gdbVersion) {
        _params.gdbVersion = this.gdbVersion;
      }
      
      return esri.request({
        url: this._url.path + "/query",
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { _h(r, i, callback, errback, context.dfd); },
        error: function(r) { _e(r, errback, context.dfd); },
        callbackSuffix: callbackSuffix
      });
    },
  
    executeRelationshipQuery: function(/*Object*/ relationshipQuery, /*Function?*/ callback, /*Function?*/ errback) {
      //summary: Execute the task and fire onComplete event. If callback is provided, the
      //         callback function will also be called.
      // relationShipQuery: Object: Parameters to pass to server to execute task
      // callback: Function?: Function to be called once task completes

      var _params = this._encode(dojo.mixin({}, this._url.query, { f:"json" }, relationshipQuery.toJson())),
          _h = this._relationshipQueryHandler,
          _e = this._errorHandler;
      if (this.gdbVersion) {
        _params.gdbVersion = this.gdbVersion;
      }

      var dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/queryRelatedRecords",
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { _h(r, i, callback, errback, dfd); },
        error: function(r) { _e(r, errback, dfd); }
      });
      
      return dfd;
    },

    executeForIds: function(/*Object*/ params, /*Function?*/ callback, /*Function?*/ errback, context) {
      //summary: Execute the task and fire onComplete event. If callback is provided, the
      //         callback function will also be called.
      // params: Object: Parameters to pass to server to execute task
      // callback: Function?: Function to be called once task completes

      var assembly = context.assembly,
          _params = this._encode(dojo.mixin({}, this._url.query, { f:"json", returnIdsOnly:true }, params.toJson(assembly && assembly[0]))),
          _h = this._executeForIdsHandler,
          _e = this._errorHandler;
      if (this.source) {
        var layer = {source: this.source.toJson()};
        _params.layer = dojo.toJson(layer);
      }
      if (this.gdbVersion) {
        _params.gdbVersion = this.gdbVersion;
      }

      return esri.request({
        url: this._url.path + "/query",
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { _h(r, i, callback, errback, context.dfd); },
        error: function(r) { _e(r, errback, context.dfd); }
      });
    },
    
    executeForCount: function(/*Object*/ query, /*Function?*/ callback, /*Function?*/ errback, context) {
      var assembly = context.assembly,
          _params = this._encode(dojo.mixin({}, this._url.query, { f:"json", returnIdsOnly:true, returnCountOnly:true }, query.toJson(assembly && assembly[0]))),
          _h = this._countHandler,
          _e = this._errorHandler;
      if (this.source) {
        var layer = {source: this.source.toJson()};
        _params.layer = dojo.toJson(layer);
      }
      if (this.gdbVersion) {
        _params.gdbVersion = this.gdbVersion;
      }

      return esri.request({
        url: this._url.path + "/query",
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { _h(r, i, callback, errback, context.dfd); },
        error: function(r) { _e(r, errback, context.dfd); }
      });
    },
    
    /*******************
     * Internal Methods
     *******************/

    _handler: function(response, io, callback, errback, dfd) {
      try {
        var result = new esri.tasks.FeatureSet(response);
        
        /*this.onComplete(result);
        if (callback) {
          callback(result);
        }*/
       
        this._successHandler([ result ], "onComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    _relationshipQueryHandler: function(response, io, callback, errback, dfd) {
      try {       
        var gt = response.geometryType, sr = response.spatialReference, result={};
        dojo.forEach(response.relatedRecordGroups, function(gr) {
          var fsetJson = {};
          fsetJson.geometryType = gt;
          fsetJson.spatialReference = sr;
          fsetJson.features = gr.relatedRecords;
          var fset = new esri.tasks.FeatureSet(fsetJson);
          result[gr.objectId] = fset;
        });
        
        /*this.onExecuteRelationshipQueryComplete(result);
        if (callback) {
          callback(result);
        }*/
        
        this._successHandler([ result ], "onExecuteRelationshipQueryComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    _executeForIdsHandler: function(response, io, callback, errback, dfd) {
      try {
        /*this.onExecuteForIdsComplete(response.objectIds);
        if (callback) {
          callback(response.objectIds);
        }*/
        this._successHandler([ response.objectIds ], "onExecuteForIdsComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },
    
    _countHandler: function(response, io, callback, errback, dfd) {
      try {
        var returnValue, features = response.features, ids = response.objectIds;
        
        if (ids) {
          // 10.0 server
          // Query operation of this layer does not seem to support
          // 'returnCountOnly' parameter. Let's return the count 
          // anyway. 
          returnValue = ids.length;
        }
        else if (features) {
          // 9.3 or 9.3.1 server
          // Query responses containing feature set are subject to 
          // limitation on the number of features returned and does
          // not reflect the exact count. Throw an error.
          throw new Error(esri.bundle.tasks.query.invalid);
        }
        else {
          // 10 SP1 server
          returnValue = response.count;
        }
        
        /*this.onExecuteForCountComplete(returnValue);
        if (callback) {
          callback(returnValue);
        }*/
       
        this._successHandler([ returnValue ], "onExecuteForCountComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    }
  }
);

esri._createWrappers("esri.tasks.QueryTask");

dojo.declare("esri.tasks.Query", null, {
    constructor: function() {
      this.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
    },

    text: null,
    where: "",
    geometry: null,
    groupByFieldsForStatistics: null,
    objectIds: null,
    returnGeometry: false,
    orderByFields: null,
    outSpatialReference: null,
    outFields: null,
    outStatistics: null,    
    timeExtent:null,
    relationParam: null,

    toJson: function(normalized) {
      var json = { text:this.text, where:this.where, returnGeometry:this.returnGeometry, spatialRel:this.spatialRelationship, maxAllowableOffset: this.maxAllowableOffset, geometryPrecision: this.geometryPrecision },
          g = normalized && normalized["geometry"] || this.geometry,
          ids = this.objectIds,
          outFields = this.outFields,
          outSR = this.outSpatialReference,
          groupByFieldsForStatistics = this.groupByFieldsForStatistics,
          orderByFields = this.orderByFields,
          outStatistics = this.outStatistics;
      
      if (g) {
        json.geometry = g;
        json.geometryType = esri.geometry.getJsonType(g);
        json.inSR = g.spatialReference.wkid || dojo.toJson(g.spatialReference.toJson());
      }
      
      if (ids) {
        json.objectIds = ids.join(",");
      }

      if (outFields) {
        json.outFields = outFields.join(",");
      }
      
      if (groupByFieldsForStatistics) {
        json.groupByFieldsForStatistics = groupByFieldsForStatistics.join(",");
      }
      
      if (orderByFields) {
        json.orderByFields = orderByFields.join(",");
      }
      
      if (outStatistics) {
        var outStatisticsJson = [];
        dojo.forEach(outStatistics, function(item, idx){
          outStatisticsJson.push(item.toJson());
        });
        json.outStatistics = dojo.toJson(outStatisticsJson);
      }

      if (outSR !== null) {
        json.outSR = outSR.wkid || dojo.toJson(outSR.toJson());
      }
      else if (g) {
        json.outSR = g.spatialReference.wkid || dojo.toJson(g.spatialReference.toJson()) ;
      }
     
      var timeExtent = this.timeExtent;
      json.time = timeExtent ? timeExtent.toJson().join(",") : null;
      
      var relationParam = this.relationParam;
      if (relationParam && this.spatialRelationship === esri.tasks.Query.SPATIAL_REL_RELATION) {
        json.relationParam = relationParam;
      }
      
      // NOTE
      // Used by feature layer to set a timestamp under
      // certain conditions. See FeatureLayer.js for details
      json._ts = this._ts;
                                               
      return json;
    }
  }
);

dojo.mixin(esri.tasks.Query, esri.tasks._SpatialRelationship);

dojo.declare("esri.tasks.RelationshipQuery", null, {
    definitionExpression: "",
    relationshipId: null,
    returnGeometry: false,
    objectIds: null,
    outSpatialReference: null,
    outFields: null,

    toJson: function() {
      var json = { definitionExpression:this.definitionExpression, relationshipId:this.relationshipId, returnGeometry:this.returnGeometry, maxAllowableOffset: this.maxAllowableOffset, geometryPrecision: this.geometryPrecision },
          objectIds = this.objectIds,
          outFields = this.outFields,
          outSR = this.outSpatialReference;

      if (objectIds) {
        json.objectIds = objectIds.join(",");
      }
      
      if (outFields) {
        json.outFields = outFields.join(",");
      }

      if (outSR) {
        json.outSR = outSR.toJson();
      }
      
      // NOTE
      // Used by feature layer to set a timestamp under
      // certain conditions. See FeatureLayer.js for details
      json._ts = this._ts;

      return json;
    }
  }
);

dojo.declare("esri.tasks.StatisticDefinition", null, {
  statisticType: null,
  onStatisticField: null,
  outStatisticFieldName: null,
  
  toJson: function(){
    var json = {statisticType: this.statisticType, onStatisticField: this.onStatisticField};
    if (this.outStatisticFieldName) {
      json.outStatisticFieldName = this.outStatisticFieldName;
    }
    return json;
  }
});

});

},
'dojox/grid/_RowSelector':function(){
define("dojox/grid/_RowSelector", [
	"dojo/_base/declare",
	"./_View"
], function(declare, _View){

return declare('dojox.grid._RowSelector', _View, {
	// summary:
	//	Custom grid view. If used in a grid structure, provides a small selectable region for grid rows.
	defaultWidth: "2em",
	noscroll: true,
	padBorderWidth: 2,
	buildRendering: function(){
		this.inherited('buildRendering', arguments);
		this.scrollboxNode.style.overflow = "hidden";
		this.headerNode.style.visibility = "hidden";
	},
	getWidth: function(){
		return this.viewWidth || this.defaultWidth;
	},
	buildRowContent: function(inRowIndex, inRowNode){
		var w = this.contentWidth || 0;
		inRowNode.innerHTML = '<table class="dojoxGridRowbarTable" style="width:' + w + 'px;height:1px;" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="dojoxGridRowbarInner">&nbsp;</td></tr></table>';
	},
	renderHeader: function(){
	},
	updateRow: function(){
	},
	resize: function(){
		this.adaptHeight();
	},
	adaptWidth: function(){
		// Only calculate this here - rather than every call to buildRowContent
		if(!("contentWidth" in this) && this.contentNode){
			this.contentWidth = this.contentNode.offsetWidth - this.padBorderWidth;
		}
	},
	// styling
	doStyleRowNode: function(inRowIndex, inRowNode){
		var n = [ "dojoxGridRowbar dojoxGridNonNormalizedCell" ];
		if(this.grid.rows.isOver(inRowIndex)){
			n.push("dojoxGridRowbarOver");
		}
		if(this.grid.selection.isSelected(inRowIndex)){
			n.push("dojoxGridRowbarSelected");
		}
		inRowNode.className = n.join(" ");
	},
	// event handlers
	domouseover: function(e){
		this.grid.onMouseOverRow(e);
	},
	domouseout: function(e){
		if(!this.isIntraRowEvent(e)){
			this.grid.onMouseOutRow(e);
		}
	}
});
});
},
'dojo/parser':function(){
define(
	["./_base/kernel", "./_base/lang", "./_base/array", "./_base/html", "./_base/window", "./_base/url",
		"./_base/json", "./aspect", "./date/stamp", "./query", "./on", "./ready"],
	function(dojo, dlang, darray, dhtml, dwindow, _Url, djson, aspect, dates, query, don){

// module:
//		dojo/parser
// summary:
//		The Dom/Widget parsing package

new Date("X"); // workaround for #11279, new Date("") == NaN

var features = {
	// Feature detection for when node.attributes only lists the attributes specified in the markup
	// rather than old IE/quirks behavior where it lists every default value too
	"dom-attributes-explicit": document.createElement("div").attributes.length < 40
};
function has(feature){
	return features[feature];
}


dojo.parser = new function(){
	// summary:
	//		The Dom/Widget parsing package

	var _nameMap = {
		// Map from widget name (ex: "dijit.form.Button") to structure mapping
		// lowercase version of attribute names to the version in the widget ex:
		//	{
		//		label: "label",
		//		onclick: "onClick"
		//	}
	};
	function getNameMap(proto){
		// summary:
		//		Returns map from lowercase name to attribute name in class, ex: {onclick: "onClick"}
		var map = {};
		for(var name in proto){
			if(name.charAt(0)=="_"){ continue; }	// skip internal properties
			map[name.toLowerCase()] = name;
		}
		return map;
	}
	// Widgets like BorderContainer add properties to _Widget via dojo.extend().
	// If BorderContainer is loaded after _Widget's parameter list has been cached,
	// we need to refresh that parameter list (for _Widget and all widgets that extend _Widget).
	aspect.after(dlang, "extend", function(){
		_nameMap = {};
	}, true);

	// Map from widget name (ex: "dijit.form.Button") to constructor
	var _ctorMap = {};

	this._functionFromScript = function(script, attrData){
		// summary:
		//		Convert a <script type="dojo/method" args="a, b, c"> ... </script>
		//		into a function
		// script: DOMNode
		//		The <script> DOMNode
		// attrData: String
		//		For HTML5 compliance, searches for attrData + "args" (typically
		//		"data-dojo-args") instead of "args"
		var preamble = "";
		var suffix = "";
		var argsStr = (script.getAttribute(attrData + "args") || script.getAttribute("args"));
		if(argsStr){
			darray.forEach(argsStr.split(/\s*,\s*/), function(part, idx){
				preamble += "var "+part+" = arguments["+idx+"]; ";
			});
		}
		var withStr = script.getAttribute("with");
		if(withStr && withStr.length){
			darray.forEach(withStr.split(/\s*,\s*/), function(part){
				preamble += "with("+part+"){";
				suffix += "}";
			});
		}
		return new Function(preamble+script.innerHTML+suffix);
	};

	this.instantiate = /*====== dojo.parser.instantiate= ======*/function(nodes, mixin, args){
		// summary:
		//		Takes array of nodes, and turns them into class instances and
		//		potentially calls a startup method to allow them to connect with
		//		any children.
		// nodes: Array
		//		Array of nodes or objects like
		//	|		{
		//	|			type: "dijit.form.Button",
		//	|			node: DOMNode,
		//	|			scripts: [ ... ],	// array of <script type="dojo/..."> children of node
		//	|			inherited: { ... }	// settings inherited from ancestors like dir, theme, etc.
		//	|		}
		// mixin: Object?
		//		An object that will be mixed in with each node in the array.
		//		Values in the mixin will override values in the node, if they
		//		exist.
		// args: Object?
		//		An object used to hold kwArgs for instantiation.
		//		See parse.args argument for details.

		var thelist = [],
		mixin = mixin||{};
		args = args||{};

		// Precompute names of special attributes we are looking for
		// TODO: for 2.0 default to data-dojo- regardless of scopeName (or maybe scopeName won't exist in 2.0)
		var dojoType = (args.scope || dojo._scopeName) + "Type",		// typically "dojoType"
			attrData = "data-" + (args.scope || dojo._scopeName) + "-",// typically "data-dojo-"
			dataDojoType = attrData + "type",						// typically "data-dojo-type"
			dataDojoProps = attrData + "props",						// typically "data-dojo-props"
			dataDojoAttachPoint = attrData + "attach-point",
			dataDojoAttachEvent = attrData + "attach-event",
			dataDojoId = attrData + "id";

		// And make hash to quickly check if a given attribute is special, and to map the name to something friendly
		var specialAttrs = {};
		darray.forEach([dataDojoProps, dataDojoType, dojoType, dataDojoId, "jsId", dataDojoAttachPoint,
				dataDojoAttachEvent, "dojoAttachPoint", "dojoAttachEvent", "class", "style"], function(name){
			specialAttrs[name.toLowerCase()] = name.replace(args.scope, "dojo");
		});

		darray.forEach(nodes, function(obj){
			if(!obj){ return; }

			var node = obj.node || obj,
				type = dojoType in mixin ? mixin[dojoType] : obj.node ? obj.type : (node.getAttribute(dataDojoType) || node.getAttribute(dojoType)),
				ctor = _ctorMap[type] || (_ctorMap[type] = dlang.getObject(type)),
				proto = ctor && ctor.prototype;
			if(!ctor){
				throw new Error("Could not load class '" + type);
			}

			// Setup hash to hold parameter settings for this widget.	Start with the parameter
			// settings inherited from ancestors ("dir" and "lang").
			// Inherited setting may later be overridden by explicit settings on node itself.
			var params = {};

			if(args.defaults){
				// settings for the document itself (or whatever subtree is being parsed)
				dlang.mixin(params, args.defaults);
			}
			if(obj.inherited){
				// settings from dir=rtl or lang=... on a node above this node
				dlang.mixin(params, obj.inherited);
			}

			// Get list of attributes explicitly listed in the markup
			var attributes;
			if(has("dom-attributes-explicit")){
				// Standard path to get list of user specified attributes
				attributes = node.attributes;
			}else{
				// Special path for IE, avoid (sometimes >100) bogus entries in node.attributes
				var clone = /^input$|^img$/i.test(node.nodeName) ? node : node.cloneNode(false),
					attrs = clone.outerHTML.replace(/=[^\s"']+|="[^"]*"|='[^']*'/g, "").replace(/^\s*<[a-zA-Z0-9]*/, "").replace(/>.*$/, "");

				attributes = darray.map(attrs.split(/\s+/), function(name){
					var lcName = name.toLowerCase();
					return {
						name: name,
						// getAttribute() doesn't work for button.value, returns innerHTML of button.
						// but getAttributeNode().value doesn't work for the form.encType or li.value
						value: (node.nodeName == "LI" && name == "value") || lcName == "enctype" ?
								node.getAttribute(lcName) : node.getAttributeNode(lcName).value,
						specified: true
					};
				});
			}

			// Read in attributes and process them, including data-dojo-props, data-dojo-type,
			// dojoAttachPoint, etc., as well as normal foo=bar attributes.
			var i=0, item;
			while(item = attributes[i++]){
				if(!item || !item.specified){
					continue;
				}

				var name = item.name,
					lcName = name.toLowerCase(),
					value = item.value;

				if(lcName in specialAttrs){
					switch(specialAttrs[lcName]){

					// Data-dojo-props.   Save for later to make sure it overrides direct foo=bar settings
					case "data-dojo-props":
						var extra = value;
						break;

					// data-dojo-id or jsId. TODO: drop jsId in 2.0
					case "data-dojo-id":
					case "jsId":
						var jsname = value;
						break;

					// For the benefit of _Templated
					case "data-dojo-attach-point":
					case "dojoAttachPoint":
						params.dojoAttachPoint = value;
						break;
					case "data-dojo-attach-event":
					case "dojoAttachEvent":
						params.dojoAttachEvent = value;
						break;

					// Special parameter handling needed for IE
					case "class":
						params["class"] = node.className;
						break;
					case "style":
						params["style"] = node.style && node.style.cssText;
						break;
					}
				}else{
					// Normal attribute, ex: value="123"

					// Find attribute in widget corresponding to specified name.
					// May involve case conversion, ex: onclick --> onClick
					if(!(name in proto)){
						var map = (_nameMap[type] || (_nameMap[type] = getNameMap(proto)));
						name = map[lcName] || name;
					}

					// Set params[name] to value, doing type conversion
					if(name in proto){
						switch(typeof proto[name]){
						case "string":
							params[name] = value;
							break;
						case "number":
							params[name] = value.length ? Number(value) : NaN;
							break;
						case "boolean":
							// for checked/disabled value might be "" or "checked".	 interpret as true.
							params[name] = value.toLowerCase() != "false";
							break;
						case "function":
							if(value === "" || value.search(/[^\w\.]+/i) != -1){
								// The user has specified some text for a function like "return x+5"
								params[name] = new Function(value);
							}else{
								// The user has specified the name of a function like "myOnClick"
								// or a single word function "return"
								params[name] = dlang.getObject(value, false) || new Function(value);
							}
							break;
						default:
							var pVal = proto[name];
							params[name] =
								(pVal && "length" in pVal) ? (value ? value.split(/\s*,\s*/) : []) :	// array
									(pVal instanceof Date) ?
										(value == "" ? new Date("") :	// the NaN of dates
										value == "now" ? new Date() :	// current date
										dates.fromISOString(value)) :
								(pVal instanceof dojo._Url) ? (dojo.baseUrl + value) :
								djson.fromJson(value);
						}
					}else{
						params[name] = value;
					}
				}
			}

			// Mix things found in data-dojo-props into the params, overriding any direct settings
			if(extra){
				try{
					extra = djson.fromJson.call(args.propsThis, "{" + extra + "}");
					dlang.mixin(params, extra);
				}catch(e){
					// give the user a pointer to their invalid parameters. FIXME: can we kill this in production?
					throw new Error(e.toString() + " in data-dojo-props='" + extra + "'");
				}
			}

			// Any parameters specified in "mixin" override everything else.
			dlang.mixin(params, mixin);

			var scripts = obj.node ? obj.scripts : (ctor && (ctor._noScript || proto._noScript) ? [] :
						query("> script[type^='dojo/']", node));

			// Process <script type="dojo/*"> script tags
			// <script type="dojo/method" event="foo"> tags are added to params, and passed to
			// the widget on instantiation.
			// <script type="dojo/method"> tags (with no event) are executed after instantiation
			// <script type="dojo/connect" data-dojo-event="foo"> tags are dojo.connected after instantiation
			// <script type="dojo/watch" data-dojo-prop="foo"> tags are dojo.watch after instantiation
			// <script type="dojo/on" data-dojo-event="foo"> tags are dojo.on after instantiation
			// note: dojo/* script tags cannot exist in self closing widgets, like <input />
			var connects = [],	// functions to connect after instantiation
				calls = [],		// functions to call after instantiation
				watch = [],  //functions to watch after instantiation
				on = []; //functions to on after instantiation

			if(scripts){
				for(i=0; i<scripts.length; i++){
					var script = scripts[i];
					node.removeChild(script);
					// FIXME: drop event="" support in 2.0. use data-dojo-event="" instead
					var event = (script.getAttribute(attrData + "event") || script.getAttribute("event")),
						prop = script.getAttribute(attrData + "prop"),
						type = script.getAttribute("type"),
						nf = this._functionFromScript(script, attrData);
					if(event){
						if(type == "dojo/connect"){
							connects.push({event: event, func: nf});
						}else if(type == "dojo/on"){
							on.push({event: event, func: nf});
						}else{
							params[event] = nf;
						}
					}else if(type == "dojo/watch"){
						watch.push({prop: prop, func: nf});
					}else{
						calls.push(nf);
					}
				}
			}

			// create the instance
			var markupFactory = ctor.markupFactory || proto.markupFactory;
			var instance = markupFactory ? markupFactory(params, node, ctor) : new ctor(params, node);
			thelist.push(instance);

			// map it to the JS namespace if that makes sense
			if(jsname){
				dlang.setObject(jsname, instance);
			}

			// process connections and startup functions
			for(i=0; i<connects.length; i++){
				aspect.after(instance, connects[i].event, dojo.hitch(instance, connects[i].func), true);
			}
			for(i=0; i<calls.length; i++){
				calls[i].call(instance);
			}
			for(i=0; i<watch.length; i++){
				instance.watch(watch[i].prop, watch[i].func);
			}
			for(i=0; i<on.length; i++){
				don(instance, on[i].event, on[i].func);
			}
		}, this);

		// Call startup on each top level instance if it makes sense (as for
		// widgets).  Parent widgets will recursively call startup on their
		// (non-top level) children
		if(!mixin._started){
			darray.forEach(thelist, function(instance){
				if( !args.noStart && instance  &&
					dlang.isFunction(instance.startup) &&
					!instance._started
				){
					instance.startup();
				}
			});
		}
		return thelist;
	};

	this.parse = /*====== dojo.parser.parse= ======*/ function(rootNode, args){
		// summary:
		//		Scan the DOM for class instances, and instantiate them.
		//
		// description:
		//		Search specified node (or root node) recursively for class instances,
		//		and instantiate them. Searches for either data-dojo-type="Class" or
		//		dojoType="Class" where "Class" is a a fully qualified class name,
		//		like `dijit.form.Button`
		//
		//		Using `data-dojo-type`:
		//		Attributes using can be mixed into the parameters used to instantiate the
		//		Class by using a `data-dojo-props` attribute on the node being converted.
		//		`data-dojo-props` should be a string attribute to be converted from JSON.
		//
		//		Using `dojoType`:
		//		Attributes are read from the original domNode and converted to appropriate
		//		types by looking up the Class prototype values. This is the default behavior
		//		from Dojo 1.0 to Dojo 1.5. `dojoType` support is deprecated, and will
		//		go away in Dojo 2.0.
		//
		// rootNode: DomNode?
		//		A default starting root node from which to start the parsing. Can be
		//		omitted, defaulting to the entire document. If omitted, the `args`
		//		object can be passed in this place. If the `args` object has a
		//		`rootNode` member, that is used.
		//
		// args: Object
		//		a kwArgs object passed along to instantiate()
		//
		//			* noStart: Boolean?
		//				when set will prevent the parser from calling .startup()
		//				when locating the nodes.
		//			* rootNode: DomNode?
		//				identical to the function's `rootNode` argument, though
		//				allowed to be passed in via this `args object.
		//			* template: Boolean
		//				If true, ignores ContentPane's stopParser flag and parses contents inside of
		//				a ContentPane inside of a template.   This allows dojoAttachPoint on widgets/nodes
		//				nested inside the ContentPane to work.
		//			* inherited: Object
		//				Hash possibly containing dir and lang settings to be applied to
		//				parsed widgets, unless there's another setting on a sub-node that overrides
		//			* scope: String
		//				Root for attribute names to search for.   If scopeName is dojo,
		//				will search for data-dojo-type (or dojoType).   For backwards compatibility
		//				reasons defaults to dojo._scopeName (which is "dojo" except when
		//				multi-version support is used, when it will be something like dojo16, dojo20, etc.)
		//			* propsThis: Object
		//				If specified, "this" referenced from data-dojo-props will refer to propsThis.
		//				Intended for use from the widgets-in-template feature of `dijit._WidgetsInTemplateMixin`
		//
		// example:
		//		Parse all widgets on a page:
		//	|		dojo.parser.parse();
		//
		// example:
		//		Parse all classes within the node with id="foo"
		//	|		dojo.parser.parse(dojo.byId('foo'));
		//
		// example:
		//		Parse all classes in a page, but do not call .startup() on any
		//		child
		//	|		dojo.parser.parse({ noStart: true })
		//
		// example:
		//		Parse all classes in a node, but do not call .startup()
		//	|		dojo.parser.parse(someNode, { noStart:true });
		//	|		// or
		//	|		dojo.parser.parse({ noStart:true, rootNode: someNode });

		// determine the root node based on the passed arguments.
		var root;
		if(!args && rootNode && rootNode.rootNode){
			args = rootNode;
			root = args.rootNode;
		}else{
			root = rootNode;
		}
		root = root ? dhtml.byId(root) : dwindow.body();
		args = args || {};

		var dojoType = (args.scope || dojo._scopeName) + "Type",		// typically "dojoType"
			attrData = "data-" + (args.scope || dojo._scopeName) + "-",	// typically "data-dojo-"
			dataDojoType = attrData + "type",						// typically "data-dojo-type"
			dataDojoTextDir = attrData + "textdir";					// typically "data-dojo-textdir"

		// List of all nodes on page w/dojoType specified
		var list = [];

		// Info on DOMNode currently being processed
		var node = root.firstChild;

		// Info on parent of DOMNode currently being processed
		//	- inherited: dir, lang, and textDir setting of parent, or inherited by parent
		//	- parent: pointer to identical structure for my parent (or null if no parent)
		//	- scripts: if specified, collects <script type="dojo/..."> type nodes from children
		var inherited = args && args.inherited;
		if(!inherited){
			function findAncestorAttr(node, attr){
				return (node.getAttribute && node.getAttribute(attr)) ||
					(node !== dwindow.doc && node !== dwindow.doc.documentElement && node.parentNode ? findAncestorAttr(node.parentNode, attr) : null);
			}
			inherited = {
				dir: findAncestorAttr(root, "dir"),
				lang: findAncestorAttr(root, "lang"),
				textDir: findAncestorAttr(root, dataDojoTextDir)
			};
			for(var key in inherited){
				if(!inherited[key]){ delete inherited[key]; }
			}
		}
		var parent = {
			inherited: inherited
		};

		// For collecting <script type="dojo/..."> type nodes (when null, we don't need to collect)
		var scripts;

		// when true, only look for <script type="dojo/..."> tags, and don't recurse to children
		var scriptsOnly;

		function getEffective(parent){
			// summary:
			//		Get effective dir, lang, textDir settings for specified obj
			//		(matching "parent" object structure above), and do caching.
			//		Take care not to return null entries.
			if(!parent.inherited){
				parent.inherited = {};
				var node = parent.node,
					grandparent = getEffective(parent.parent);
				var inherited  = {
					dir: node.getAttribute("dir") || grandparent.dir,
					lang: node.getAttribute("lang") || grandparent.lang,
					textDir: node.getAttribute(dataDojoTextDir) || grandparent.textDir
				};
				for(var key in inherited){
					if(inherited[key]){
						parent.inherited[key] = inherited[key];
					}
				}
			}
			return parent.inherited;
		}

		// DFS on DOM tree, collecting nodes with data-dojo-type specified.
		while(true){
			if(!node){
				// Finished this level, continue to parent's next sibling
				if(!parent || !parent.node){
					break;
				}
				node = parent.node.nextSibling;
				scripts = parent.scripts;
				scriptsOnly = false;
				parent = parent.parent;
				continue;
			}

			if(node.nodeType != 1){
				// Text or comment node, skip to next sibling
				node = node.nextSibling;
				continue;
			}

			if(scripts && node.nodeName.toLowerCase() == "script"){
				// Save <script type="dojo/..."> for parent, then continue to next sibling
				type = node.getAttribute("type");
				if(type && /^dojo\/\w/i.test(type)){
					scripts.push(node);
				}
				node = node.nextSibling;
				continue;
			}
			if(scriptsOnly){
				node = node.nextSibling;
				continue;
			}

			// Check for data-dojo-type attribute, fallback to backward compatible dojoType
			var type = node.getAttribute(dataDojoType) || node.getAttribute(dojoType);

			// Short circuit for leaf nodes containing nothing [but text]
			var firstChild = node.firstChild;
			if(!type && (!firstChild || (firstChild.nodeType == 3 && !firstChild.nextSibling))){
				node = node.nextSibling;
				continue;
			}

			// Setup data structure to save info on current node for when we return from processing descendant nodes
			var current = {
				node: node,
				scripts: scripts,
				parent: parent
			};

			// If dojoType/data-dojo-type specified, add to output array of nodes to instantiate
			var ctor = type && (_ctorMap[type] || (_ctorMap[type] = dlang.getObject(type))), // note: won't find classes declared via dojo.Declaration
				childScripts = ctor && !ctor.prototype._noScript ? [] : null; // <script> nodes that are parent's children
			if(type){
				list.push({
					"type": type,
					node: node,
					scripts: childScripts,
					inherited: getEffective(current) // dir & lang settings for current node, explicit or inherited
				});
			}

			// Recurse, collecting <script type="dojo/..."> children, and also looking for
			// descendant nodes with dojoType specified (unless the widget has the stopParser flag).
			// When finished with children, go to my next sibling.
			node = firstChild;
			scripts = childScripts;
			scriptsOnly = ctor && ctor.prototype.stopParser && !(args && args.template);
			parent = current;

		}

		// go build the object instances
		var mixin = args && args.template ? {template: true} : null;
		return this.instantiate(list, mixin, args); // Array
	};
}();


//Register the parser callback. It should be the first callback
//after the a11y test.
if(dojo.config.parseOnLoad){
	dojo.ready(100, dojo.parser, "parse");
}

return dojo.parser;
});

},
'dojo/dnd/Manager':function(){
define(["../main", "../Evented", "./common", "./autoscroll", "./Avatar"], function(dojo, Evented) {
	// module:
	//		dojo/dnd/Manager
	// summary:
	//		TODOC


var Manager = dojo.declare("dojo.dnd.Manager", [Evented], {
	// summary:
	//		the manager of DnD operations (usually a singleton)
	constructor: function(){
		this.avatar  = null;
		this.source = null;
		this.nodes = [];
		this.copy  = true;
		this.target = null;
		this.canDropFlag = false;
		this.events = [];
	},

	// avatar's offset from the mouse
	OFFSET_X: 16,
	OFFSET_Y: 16,

	// methods
	overSource: function(source){
		// summary:
		//		called when a source detected a mouse-over condition
		// source: Object
		//		the reporter
		if(this.avatar){
			this.target = (source && source.targetState != "Disabled") ? source : null;
			this.canDropFlag = Boolean(this.target);
			this.avatar.update();
		}
		dojo.publish("/dnd/source/over", [source]);
	},
	outSource: function(source){
		// summary:
		//		called when a source detected a mouse-out condition
		// source: Object
		//		the reporter
		if(this.avatar){
			if(this.target == source){
				this.target = null;
				this.canDropFlag = false;
				this.avatar.update();
				dojo.publish("/dnd/source/over", [null]);
			}
		}else{
			dojo.publish("/dnd/source/over", [null]);
		}
	},
	startDrag: function(source, nodes, copy){
		// summary:
		//		called to initiate the DnD operation
		// source: Object
		//		the source which provides items
		// nodes: Array
		//		the list of transferred items
		// copy: Boolean
		//		copy items, if true, move items otherwise
		this.source = source;
		this.nodes  = nodes;
		this.copy   = Boolean(copy); // normalizing to true boolean
		this.avatar = this.makeAvatar();
		dojo.body().appendChild(this.avatar.node);
		dojo.publish("/dnd/start", [source, nodes, this.copy]);
		this.events = [
			dojo.connect(dojo.doc, "onmousemove", this, "onMouseMove"),
			dojo.connect(dojo.doc, "onmouseup",   this, "onMouseUp"),
			dojo.connect(dojo.doc, "onkeydown",   this, "onKeyDown"),
			dojo.connect(dojo.doc, "onkeyup",     this, "onKeyUp"),
			// cancel text selection and text dragging
			dojo.connect(dojo.doc, "ondragstart",   dojo.stopEvent),
			dojo.connect(dojo.body(), "onselectstart", dojo.stopEvent)
		];
		var c = "dojoDnd" + (copy ? "Copy" : "Move");
		dojo.addClass(dojo.body(), c);
	},
	canDrop: function(flag){
		// summary:
		//		called to notify if the current target can accept items
		var canDropFlag = Boolean(this.target && flag);
		if(this.canDropFlag != canDropFlag){
			this.canDropFlag = canDropFlag;
			this.avatar.update();
		}
	},
	stopDrag: function(){
		// summary:
		//		stop the DnD in progress
		dojo.removeClass(dojo.body(), ["dojoDndCopy", "dojoDndMove"]);
		dojo.forEach(this.events, dojo.disconnect);
		this.events = [];
		this.avatar.destroy();
		this.avatar = null;
		this.source = this.target = null;
		this.nodes = [];
	},
	makeAvatar: function(){
		// summary:
		//		makes the avatar; it is separate to be overwritten dynamically, if needed
		return new dojo.dnd.Avatar(this);
	},
	updateAvatar: function(){
		// summary:
		//		updates the avatar; it is separate to be overwritten dynamically, if needed
		this.avatar.update();
	},

	// mouse event processors
	onMouseMove: function(e){
		// summary:
		//		event processor for onmousemove
		// e: Event
		//		mouse event
		var a = this.avatar;
		if(a){
			dojo.dnd.autoScrollNodes(e);
			//dojo.dnd.autoScroll(e);
			var s = a.node.style;
			s.left = (e.pageX + this.OFFSET_X) + "px";
			s.top  = (e.pageY + this.OFFSET_Y) + "px";
			var copy = Boolean(this.source.copyState(dojo.isCopyKey(e)));
			if(this.copy != copy){
				this._setCopyStatus(copy);
			}
		}
	},
	onMouseUp: function(e){
		// summary:
		//		event processor for onmouseup
		// e: Event
		//		mouse event
		if(this.avatar){
			if(this.target && this.canDropFlag){
				var copy = Boolean(this.source.copyState(dojo.isCopyKey(e))),
				params = [this.source, this.nodes, copy, this.target, e];
				dojo.publish("/dnd/drop/before", params);
				dojo.publish("/dnd/drop", params);
			}else{
				dojo.publish("/dnd/cancel");
			}
			this.stopDrag();
		}
	},

	// keyboard event processors
	onKeyDown: function(e){
		// summary:
		//		event processor for onkeydown:
		//		watching for CTRL for copy/move status, watching for ESCAPE to cancel the drag
		// e: Event
		//		keyboard event
		if(this.avatar){
			switch(e.keyCode){
				case dojo.keys.CTRL:
					var copy = Boolean(this.source.copyState(true));
					if(this.copy != copy){
						this._setCopyStatus(copy);
					}
					break;
				case dojo.keys.ESCAPE:
					dojo.publish("/dnd/cancel");
					this.stopDrag();
					break;
			}
		}
	},
	onKeyUp: function(e){
		// summary:
		//		event processor for onkeyup, watching for CTRL for copy/move status
		// e: Event
		//		keyboard event
		if(this.avatar && e.keyCode == dojo.keys.CTRL){
			var copy = Boolean(this.source.copyState(false));
			if(this.copy != copy){
				this._setCopyStatus(copy);
			}
		}
	},

	// utilities
	_setCopyStatus: function(copy){
		// summary:
		//		changes the copy status
		// copy: Boolean
		//		the copy status
		this.copy = copy;
		this.source._markDndStatus(this.copy);
		this.updateAvatar();
		dojo.replaceClass(dojo.body(),
			"dojoDnd" + (this.copy ? "Copy" : "Move"),
			"dojoDnd" + (this.copy ? "Move" : "Copy"));
	}
});

// dojo.dnd._manager:
//		The manager singleton variable. Can be overwritten if needed.
dojo.dnd._manager = null;

Manager.manager = dojo.dnd.manager = function(){
	// summary:
	//		Returns the current DnD manager.  Creates one if it is not created yet.
	if(!dojo.dnd._manager){
		dojo.dnd._manager = new dojo.dnd.Manager();
	}
	return dojo.dnd._manager;	// Object
};

return Manager;
});

},
'dojo/date/stamp':function(){
define(["../_base/kernel", "../_base/lang", "../_base/array"], function(dojo, lang, array) {
	// module:
	//		dojo/date/stamp
	// summary:
	//		TODOC

lang.getObject("date.stamp", true, dojo);

// Methods to convert dates to or from a wire (string) format using well-known conventions

dojo.date.stamp.fromISOString = function(/*String*/formattedString, /*Number?*/defaultTime){
	//	summary:
	//		Returns a Date object given a string formatted according to a subset of the ISO-8601 standard.
	//
	//	description:
	//		Accepts a string formatted according to a profile of ISO8601 as defined by
	//		[RFC3339](http://www.ietf.org/rfc/rfc3339.txt), except that partial input is allowed.
	//		Can also process dates as specified [by the W3C](http://www.w3.org/TR/NOTE-datetime)
	//		The following combinations are valid:
	//
	//			* dates only
	//			|	* yyyy
	//			|	* yyyy-MM
	//			|	* yyyy-MM-dd
	// 			* times only, with an optional time zone appended
	//			|	* THH:mm
	//			|	* THH:mm:ss
	//			|	* THH:mm:ss.SSS
	// 			* and "datetimes" which could be any combination of the above
	//
	//		timezones may be specified as Z (for UTC) or +/- followed by a time expression HH:mm
	//		Assumes the local time zone if not specified.  Does not validate.  Improperly formatted
	//		input may return null.  Arguments which are out of bounds will be handled
	// 		by the Date constructor (e.g. January 32nd typically gets resolved to February 1st)
	//		Only years between 100 and 9999 are supported.
	//
  	//	formattedString:
	//		A string such as 2005-06-30T08:05:00-07:00 or 2005-06-30 or T08:05:00
	//
	//	defaultTime:
	//		Used for defaults for fields omitted in the formattedString.
	//		Uses 1970-01-01T00:00:00.0Z by default.

	if(!dojo.date.stamp._isoRegExp){
		dojo.date.stamp._isoRegExp =
//TODO: could be more restrictive and check for 00-59, etc.
			/^(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(.\d+)?)?((?:[+-](\d{2}):(\d{2}))|Z)?)?$/;
	}

	var match = dojo.date.stamp._isoRegExp.exec(formattedString),
		result = null;

	if(match){
		match.shift();
		if(match[1]){match[1]--;} // Javascript Date months are 0-based
		if(match[6]){match[6] *= 1000;} // Javascript Date expects fractional seconds as milliseconds

		if(defaultTime){
			// mix in defaultTime.  Relatively expensive, so use || operators for the fast path of defaultTime === 0
			defaultTime = new Date(defaultTime);
			array.forEach(array.map(["FullYear", "Month", "Date", "Hours", "Minutes", "Seconds", "Milliseconds"], function(prop){
				return defaultTime["get" + prop]();
			}), function(value, index){
				match[index] = match[index] || value;
			});
		}
		result = new Date(match[0]||1970, match[1]||0, match[2]||1, match[3]||0, match[4]||0, match[5]||0, match[6]||0); //TODO: UTC defaults
		if(match[0] < 100){
			result.setFullYear(match[0] || 1970);
		}

		var offset = 0,
			zoneSign = match[7] && match[7].charAt(0);
		if(zoneSign != 'Z'){
			offset = ((match[8] || 0) * 60) + (Number(match[9]) || 0);
			if(zoneSign != '-'){ offset *= -1; }
		}
		if(zoneSign){
			offset -= result.getTimezoneOffset();
		}
		if(offset){
			result.setTime(result.getTime() + offset * 60000);
		}
	}

	return result; // Date or null
};

/*=====
	dojo.date.stamp.__Options = function(){
		//	selector: String
		//		"date" or "time" for partial formatting of the Date object.
		//		Both date and time will be formatted by default.
		//	zulu: Boolean
		//		if true, UTC/GMT is used for a timezone
		//	milliseconds: Boolean
		//		if true, output milliseconds
		this.selector = selector;
		this.zulu = zulu;
		this.milliseconds = milliseconds;
	}
=====*/

dojo.date.stamp.toISOString = function(/*Date*/dateObject, /*dojo.date.stamp.__Options?*/options){
	//	summary:
	//		Format a Date object as a string according a subset of the ISO-8601 standard
	//
	//	description:
	//		When options.selector is omitted, output follows [RFC3339](http://www.ietf.org/rfc/rfc3339.txt)
	//		The local time zone is included as an offset from GMT, except when selector=='time' (time without a date)
	//		Does not check bounds.  Only years between 100 and 9999 are supported.
	//
	//	dateObject:
	//		A Date object

	var _ = function(n){ return (n < 10) ? "0" + n : n; };
	options = options || {};
	var formattedDate = [],
		getter = options.zulu ? "getUTC" : "get",
		date = "";
	if(options.selector != "time"){
		var year = dateObject[getter+"FullYear"]();
		date = ["0000".substr((year+"").length)+year, _(dateObject[getter+"Month"]()+1), _(dateObject[getter+"Date"]())].join('-');
	}
	formattedDate.push(date);
	if(options.selector != "date"){
		var time = [_(dateObject[getter+"Hours"]()), _(dateObject[getter+"Minutes"]()), _(dateObject[getter+"Seconds"]())].join(':');
		var millis = dateObject[getter+"Milliseconds"]();
		if(options.milliseconds){
			time += "."+ (millis < 100 ? "0" : "") + _(millis);
		}
		if(options.zulu){
			time += "Z";
		}else if(options.selector != "time"){
			var timezoneOffset = dateObject.getTimezoneOffset();
			var absOffset = Math.abs(timezoneOffset);
			time += (timezoneOffset > 0 ? "-" : "+") +
				_(Math.floor(absOffset/60)) + ":" + _(absOffset%60);
		}
		formattedDate.push(time);
	}
	return formattedDate.join('T'); // String
};

return dojo.date.stamp;
});

},
'dojo/Stateful':function(){
define(["./_base/kernel", "./_base/declare", "./_base/lang", "./_base/array"], function(dojo, declare, lang, array) {
	// module:
	//		dojo/Stateful
	// summary:
	//		TODOC

return dojo.declare("dojo.Stateful", null, {
	// summary:
	//		Base class for objects that provide named properties with optional getter/setter
	//		control and the ability to watch for property changes
	// example:
	//	|	var obj = new dojo.Stateful();
	//	|	obj.watch("foo", function(){
	//	|		console.log("foo changed to " + this.get("foo"));
	//	|	});
	//	|	obj.set("foo","bar");
	postscript: function(mixin){
		if(mixin){
			lang.mixin(this, mixin);
		}
	},

	get: function(/*String*/name){
		// summary:
		//		Get a property on a Stateful instance.
		//	name:
		//		The property to get.
		//	returns:
		//		The property value on this Stateful instance.
		// description:
		//		Get a named property on a Stateful object. The property may
		//		potentially be retrieved via a getter method in subclasses. In the base class
		// 		this just retrieves the object's property.
		// 		For example:
		//	|	stateful = new dojo.Stateful({foo: 3});
		//	|	stateful.get("foo") // returns 3
		//	|	stateful.foo // returns 3

		return this[name]; //Any
	},
	set: function(/*String*/name, /*Object*/value){
		// summary:
		//		Set a property on a Stateful instance
		//	name:
		//		The property to set.
		//	value:
		//		The value to set in the property.
		//	returns:
		//		The function returns this dojo.Stateful instance.
		// description:
		//		Sets named properties on a stateful object and notifies any watchers of
		// 		the property. A programmatic setter may be defined in subclasses.
		// 		For example:
		//	|	stateful = new dojo.Stateful();
		//	|	stateful.watch(function(name, oldValue, value){
		//	|		// this will be called on the set below
		//	|	}
		//	|	stateful.set(foo, 5);
		//
		//	set() may also be called with a hash of name/value pairs, ex:
		//	|	myObj.set({
		//	|		foo: "Howdy",
		//	|		bar: 3
		//	|	})
		//	This is equivalent to calling set(foo, "Howdy") and set(bar, 3)
		if(typeof name === "object"){
			for(var x in name){
				this.set(x, name[x]);
			}
			return this;
		}
		var oldValue = this[name];
		this[name] = value;
		if(this._watchCallbacks){
			this._watchCallbacks(name, oldValue, value);
		}
		return this; //dojo.Stateful
	},
	watch: function(/*String?*/name, /*Function*/callback){
		// summary:
		//		Watches a property for changes
		//	name:
		//		Indicates the property to watch. This is optional (the callback may be the
		// 		only parameter), and if omitted, all the properties will be watched
		// returns:
		//		An object handle for the watch. The unwatch method of this object
		// 		can be used to discontinue watching this property:
		//		|	var watchHandle = obj.watch("foo", callback);
		//		|	watchHandle.unwatch(); // callback won't be called now
		//	callback:
		//		The function to execute when the property changes. This will be called after
		//		the property has been changed. The callback will be called with the |this|
		//		set to the instance, the first argument as the name of the property, the
		// 		second argument as the old value and the third argument as the new value.

		var callbacks = this._watchCallbacks;
		if(!callbacks){
			var self = this;
			callbacks = this._watchCallbacks = function(name, oldValue, value, ignoreCatchall){
				var notify = function(propertyCallbacks){
					if(propertyCallbacks){
                        propertyCallbacks = propertyCallbacks.slice();
						for(var i = 0, l = propertyCallbacks.length; i < l; i++){
							try{
								propertyCallbacks[i].call(self, name, oldValue, value);
							}catch(e){
								console.error(e);
							}
						}
					}
				};
				notify(callbacks['_' + name]);
				if(!ignoreCatchall){
					notify(callbacks["*"]); // the catch-all
				}
			}; // we use a function instead of an object so it will be ignored by JSON conversion
		}
		if(!callback && typeof name === "function"){
			callback = name;
			name = "*";
		}else{
			// prepend with dash to prevent name conflicts with function (like "name" property)
			name = '_' + name;
		}
		var propertyCallbacks = callbacks[name];
		if(typeof propertyCallbacks !== "object"){
			propertyCallbacks = callbacks[name] = [];
		}
		propertyCallbacks.push(callback);
		return {
			unwatch: function(){
				propertyCallbacks.splice(array.indexOf(propertyCallbacks, callback), 1);
			}
		}; //Object
	}

});

});

},
'dojox/grid/Selection':function(){
define("dojox/grid/Selection", [
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/dom-attr"
], function(declare, array, lang, domAttr){

return declare("dojox.grid.Selection", null, {
	// summary:
	//		Manages row selection for grid. Owned by grid and used internally
	//		for selection. Override to implement custom selection.

	constructor: function(inGrid){
		this.grid = inGrid;
		this.selected = [];

		this.setMode(inGrid.selectionMode);
	},

	mode: 'extended',

	selected: null,
	updating: 0,
	selectedIndex: -1,

	setMode: function(mode){
		if(this.selected.length){
			this.deselectAll();
		}
		if(mode != 'extended' && mode != 'multiple' && mode != 'single' && mode != 'none'){
			this.mode = 'extended';
		}else{
			this.mode = mode;
		}
	},

	onCanSelect: function(inIndex){
		return this.grid.onCanSelect(inIndex);
	},

	onCanDeselect: function(inIndex){
		return this.grid.onCanDeselect(inIndex);
	},

	onSelected: function(inIndex){
	},

	onDeselected: function(inIndex){
	},

	//onSetSelected: function(inIndex, inSelect) { };
	onChanging: function(){
	},

	onChanged: function(){
	},

	isSelected: function(inIndex){
		if(this.mode == 'none'){
			return false;
		}
		return this.selected[inIndex];
	},

	getFirstSelected: function(){
		if(!this.selected.length||this.mode == 'none'){ return -1; }
		for(var i=0, l=this.selected.length; i<l; i++){
			if(this.selected[i]){
				return i;
			}
		}
		return -1;
	},

	getNextSelected: function(inPrev){
		if(this.mode == 'none'){ return -1; }
		for(var i=inPrev+1, l=this.selected.length; i<l; i++){
			if(this.selected[i]){
				return i;
			}
		}
		return -1;
	},

	getSelected: function(){
		var result = [];
		for(var i=0, l=this.selected.length; i<l; i++){
			if(this.selected[i]){
				result.push(i);
			}
		}
		return result;
	},

	getSelectedCount: function(){
		var c = 0;
		for(var i=0; i<this.selected.length; i++){
			if(this.selected[i]){
				c++;
			}
		}
		return c;
	},

	_beginUpdate: function(){
		if(this.updating === 0){
			this.onChanging();
		}
		this.updating++;
	},

	_endUpdate: function(){
		this.updating--;
		if(this.updating === 0){
			this.onChanged();
		}
	},

	select: function(inIndex){
		if(this.mode == 'none'){ return; }
		if(this.mode != 'multiple'){
			this.deselectAll(inIndex);
			this.addToSelection(inIndex);
		}else{
			this.toggleSelect(inIndex);
		}
	},

	addToSelection: function(inIndex){
		if(this.mode == 'none'){ return; }
		if(lang.isArray(inIndex)){
			array.forEach(inIndex, this.addToSelection, this);
			return;
		}
		inIndex = Number(inIndex);
		if(this.selected[inIndex]){
			this.selectedIndex = inIndex;
		}else{
			if(this.onCanSelect(inIndex) !== false){
				this.selectedIndex = inIndex;
				var rowNode = this.grid.getRowNode(inIndex);
				if(rowNode){
					domAttr.set(rowNode, "aria-selected", "true");
				}
				this._beginUpdate();
				this.selected[inIndex] = true;
				//this.grid.onSelected(inIndex);
				this.onSelected(inIndex);
				//this.onSetSelected(inIndex, true);
				this._endUpdate();
			}
		}
	},

	deselect: function(inIndex){
		if(this.mode == 'none'){ return; }
		if(lang.isArray(inIndex)){
			array.forEach(inIndex, this.deselect, this);
			return;
		}
		inIndex = Number(inIndex);
		if(this.selectedIndex == inIndex){
			this.selectedIndex = -1;
		}
		if(this.selected[inIndex]){
			if(this.onCanDeselect(inIndex) === false){
				return;
			}
			var rowNode = this.grid.getRowNode(inIndex);
			if(rowNode){
				domAttr.set(rowNode, "aria-selected", "false");
			}
			this._beginUpdate();
			delete this.selected[inIndex];
			//this.grid.onDeselected(inIndex);
			this.onDeselected(inIndex);
			//this.onSetSelected(inIndex, false);
			this._endUpdate();
		}
	},

	setSelected: function(inIndex, inSelect){
		this[(inSelect ? 'addToSelection' : 'deselect')](inIndex);
	},

	toggleSelect: function(inIndex){
		if(lang.isArray(inIndex)){
			array.forEach(inIndex, this.toggleSelect, this);
			return;
		}
		this.setSelected(inIndex, !this.selected[inIndex]);
	},

	_range: function(inFrom, inTo, func){
		var s = (inFrom >= 0 ? inFrom : inTo), e = inTo;
		if(s > e){
			e = s;
			s = inTo;
		}
		for(var i=s; i<=e; i++){
			func(i);
		}
	},

	selectRange: function(inFrom, inTo){
		this._range(inFrom, inTo, lang.hitch(this, "addToSelection"));
	},

	deselectRange: function(inFrom, inTo){
		this._range(inFrom, inTo, lang.hitch(this, "deselect"));
	},

	insert: function(inIndex){
		this.selected.splice(inIndex, 0, false);
		if(this.selectedIndex >= inIndex){
			this.selectedIndex++;
		}
	},

	remove: function(inIndex){
		this.selected.splice(inIndex, 1);
		if(this.selectedIndex >= inIndex){
			this.selectedIndex--;
		}
	},

	deselectAll: function(inExcept){
		for(var i in this.selected){
			if((i!=inExcept)&&(this.selected[i]===true)){
				this.deselect(i);
			}
		}
	},

	clickSelect: function(inIndex, inCtrlKey, inShiftKey){
		if(this.mode == 'none'){ return; }
		this._beginUpdate();
		if(this.mode != 'extended'){
			this.select(inIndex);
		}else{
			var lastSelected = this.selectedIndex;
			if(!inCtrlKey){
				this.deselectAll(inIndex);
			}
			if(inShiftKey){
				this.selectRange(lastSelected, inIndex);
			}else if(inCtrlKey){
				this.toggleSelect(inIndex);
			}else{
				this.addToSelection(inIndex);
			}
		}
		this._endUpdate();
	},

	clickSelectEvent: function(e){
		this.clickSelect(e.rowIndex, dojo.isCopyKey(e), e.shiftKey);
	},

	clear: function(){
		this._beginUpdate();
		this.deselectAll();
		this._endUpdate();
	}
});
});
},
'esri/toolbars/_Box':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!dojox/gfx/Moveable,dojox/gfx/matrix"], function(dijit,dojo,dojox){
dojo.provide("esri.toolbars._Box");

dojo.require("dojox.gfx.Moveable");
dojo.require("dojox.gfx.matrix");

dojo.declare("esri.toolbars._Box", null, {
  constructor: function(graphic, map, toolbar, scale, rotate) {
    this._graphic = graphic;
    this._map = map;
    this._toolbar = toolbar;
    this._scale = scale;
    this._rotate = rotate;
    this._defaultEventArgs = {};
    this._scaleEvent = "Scale";
    this._rotateEvent = "Rotate";
    
    // symbols
    var options = toolbar._options;
    this._markerSymbol = options.boxHandleSymbol; // new esri.symbol.SimpleMarkerSymbol();
    this._lineSymbol = options.boxLineSymbol; // new esri.symbol.SimpleLineSymbol();
    
    this._moveStartHandler = dojo.hitch(this, this._moveStartHandler);
    this._firstMoveHandler = dojo.hitch(this, this._firstMoveHandler);
    this._moveStopHandler = dojo.hitch(this, this._moveStopHandler);
    this._moveHandler = dojo.hitch(this, this._moveHandler);
    
    this._init();
  },
  
  destroy: function() {
    this._cleanUp();
    this._graphic = this._map = this._toolbar = this._markerSymbol = this._lineSymbol = null;
  },
  
  refresh: function() {
    this._draw();
  },
  
  suspend: function() {
    dojo.forEach(this._getAllGraphics(), function(g) {
      g.hide();
    });
  },
  
  resume: function() {
    dojo.forEach(this._getAllGraphics(), function(g) {
      g.show();
    });

    this._draw();
  },
  
  /***************************
   * Events
   * 
   * Handled for Edit toolbar
   *   onScaleStart (graphic)
   *   onScaleFirstMove (graphic)
   *   onScale (graphic, info)
   *   onScaleStop (graphic, info)
   *   onRotateStart (graphic)
   *   onRotateFirstMove (graphic)
   *   onRotate (graphic, info)
   *   onRotateStop (graphic, info)
   ***************************/
  
  /*******************
   * Internal Methods
   *******************/
  
  _init: function() {
    this._draw();
  },
  
  _cleanUp: function() {
    if (this._connects) {
      dojo.forEach(this._connects, dojo.disconnect, dojo);
    }

    var gLayer = this._toolbar._scratchGL;
    if (this._anchors) {
      dojo.forEach(this._anchors, function(info) {
        gLayer.remove(info.graphic);
        var mov = info.moveable;
        if (mov) {
          mov.destroy();
        }
      });
    }
    
    if (this._box) {
      gLayer.remove(this._box);
    }
    
    this._box = this._anchors = this._connects = null;
  },
  
  _draw: function() {
    if (!this._graphic.getDojoShape()) {
      this._cleanUp();
      return;
    }
    
    var map = this._map, gLayer = this._toolbar._scratchGL;
    var points = this._getBoxCoords();

    // Box
    var polyline = new esri.geometry.Polyline(map.spatialReference);
    var path = dojo.clone(dojo.filter(points, function(pt, index) {
      // remove rotor and midpoints
      return (index !== 8  && index % 2 === 0);
    }));
    if (path[0]) {
      path.push([ path[0][0], path[0][1] ]);
    }
    polyline.addPath(path);
    
    if (this._rotate) {
      polyline.addPath([points[1], points[8]]);
    }
    
    if (this._box) {
      // Update box
      this._box.setGeometry(polyline);
    }
    else {
      // Create box
      this._box = new esri.Graphic(polyline, this._lineSymbol);
      gLayer.add(this._box);
    }
    
    // Anchors
    if (this._anchors) {
      // Update existing anchors
      dojo.forEach(this._anchors, function(info, index) {
        if (!this._scale) {
          index = 8;
        }
        
        // update geometry
        var point = new esri.geometry.Point(points[index], map.spatialReference);
        info.graphic.setGeometry(point);
        
        // refresh moveable
        var mov = info.moveable, shape = info.graphic.getDojoShape();
        if (shape) {
          if (!mov) {
            info.moveable = this._getMoveable(info.graphic, index);
          }
          else if (shape !== mov.shape) {
            mov.destroy();
            info.moveable = this._getMoveable(info.graphic, index);
          }
        }
      }, this); // loop
    }
    else {
      // Create anchors
      this._anchors = [];
      this._connects = [];
      
      dojo.forEach(points, function(point, index) {
        if (!this._scale && index < 8) {
          return;
        }
        
        point = new esri.geometry.Point(point, map.spatialReference);
        var anchor = new esri.Graphic(point, this._markerSymbol);
        gLayer.add(anchor);
  
        this._anchors.push({ graphic: anchor, moveable: this._getMoveable(anchor, index) });
      }, this); // loop
    }
  },
  
  _getBoxCoords: function(returnScreen) {
    var graphic = this._graphic,
        map = this._map,
        bbox = this._getTransformedBoundingBox(graphic), points = [],
        pt, next, midpt;
    
    dojo.forEach(bbox, function(coord, index, arr) {
      pt = coord;
      
      // midpoint
      next = arr[index + 1];
      if (!next) {
        next = arr[0];
      }
      midpt = { x: (pt.x + next.x) / 2, y: (pt.y + next.y) / 2 };

      if (!returnScreen) {
        pt = map.toMap(pt);
        midpt = map.toMap(midpt);
      }

      points.push([ pt.x, pt.y ]);
      points.push([ midpt.x, midpt.y ]);
    });

    if (this._rotate) {
      var rotorPoint = dojo.clone(points[1]);
      rotorPoint = returnScreen ? { x: rotorPoint[0], y: rotorPoint[1] } : map.toScreen({ x: rotorPoint[0], y: rotorPoint[1] });
      rotorPoint.y -= this._toolbar._options.rotateHandleOffset;
      if (!returnScreen) {
        rotorPoint = map.toMap(rotorPoint);
      }
      points.push([ rotorPoint.x, rotorPoint.y ]);
    }
    
    return points;
  },
  
  _getTransformedBoundingBox: function(graphic) {
    // When map wrapping is enabled, Shape::getTransformedBoundingBox
    // will not help. Let's do it at geometry level for all browsers
    
    //if (dojo.isIE) {
      // Normally we dont need this routine, but we've overridden
      // GFX path in VML using esri.gfx.Path impl. This prevents
      // GFX from having the necessary data to compute transformed
      // bounding box
      var map = this._map;
      var extent = graphic.geometry.getExtent();
      var topLeft = new esri.geometry.Point(extent.xmin, extent.ymax);
      var bottomRight = new esri.geometry.Point(extent.xmax, extent.ymin);
      topLeft = map.toScreen(topLeft);
      bottomRight = map.toScreen(bottomRight);
      return [
        { x: topLeft.x, y: topLeft.y },
        { x: bottomRight.x, y: topLeft.y },
        { x: bottomRight.x, y: bottomRight.y },
        { x: topLeft.x, y: bottomRight.y }
      ];
    /*}
    else {
      return graphic.getDojoShape().getTransformedBoundingBox();
    }*/
  },
  
  _getAllGraphics: function() {
    var graphics = [ this._box ];
    
    if (this._anchors) {
      dojo.forEach(this._anchors, function(anchor) {
        graphics.push(anchor.graphic);
      });
    }
    
    graphics = dojo.filter(graphics, esri._isDefined);
    return graphics;
  },
  
  _getMoveable: function(anchor, index) {
    var shape = anchor.getDojoShape();
    if (!shape) {
      return;
    }
    
    var moveable = new dojox.gfx.Moveable(shape);
    moveable._index = index;
    // 0 - TL, 2 - TR, 4 - BR, 6 - BL
    // 1 - (TL+TR)/2, 3 - (TR+BR)/2, 5 - (BR+BL)/2, 7 - (BL+TR)/2
    // 8 - RotateHandle
    
    this._connects.push(dojo.connect(moveable, "onMoveStart", this._moveStartHandler));
    this._connects.push(dojo.connect(moveable, "onFirstMove", this._firstMoveHandler));
    this._connects.push(dojo.connect(moveable, "onMoveStop", this._moveStopHandler));
    
    // We dont want to move the anchor itself.
    // See: dojox.gfx.Moveable::onMove method
    // So, override Moveable's onMove impl
    moveable.onMove = this._moveHandler;
    
    var node = shape.getEventSource();
    if (node) {
      dojo.style(node, "cursor", this._toolbar._cursors["box" + index]);
    }
    
    return moveable;
  },
  
  _moveStartHandler: function(mover) {
    this._toolbar["on" + (mover.host._index === 8 ? this._rotateEvent : this._scaleEvent) + "Start"](this._graphic);
  },
  
  _firstMoveHandler: function(mover) {
    //console.log("START: ", mover);
    
    var index = mover.host._index, wrapOffset = (this._wrapOffset = mover.host.shape._wrapOffsets[0] || 0),
        surfaceTx = this._graphic.getLayer()._div.getTransform(), mx = dojox.gfx.matrix,
        moverCoord, anchorCoord, boxCenter,
        coords = dojo.map(this._getBoxCoords(true), function(arr) {
          return { x: arr[0] + wrapOffset, y: arr[1] };
        });
    
    if (index === 8) {
      // Rotate
      moverCoord = mx.multiplyPoint(mx.invert(surfaceTx), coords[1]);
      boxCenter = { x: coords[1].x, y: coords[3].y };
      anchorCoord = mx.multiplyPoint(mx.invert(surfaceTx), boxCenter);
      this._startLine = [ anchorCoord, moverCoord ];
      this._moveLine = dojo.clone(this._startLine);
    }
    else {
      // Scale
      moverCoord = mx.multiplyPoint(mx.invert(surfaceTx), coords[index]);
      anchorCoord = mx.multiplyPoint(mx.invert(surfaceTx), coords[(index + 4) % 8]);
      
      this._startBox = anchorCoord;
      this._startBox.width = (coords[4].x - coords[0].x);
      this._startBox.height = (coords[4].y - coords[0].y);
      this._moveBox = dojo.clone(this._startBox);
      
      this._xfactor = moverCoord.x > anchorCoord.x ? 1 : -1;
      this._yfactor = moverCoord.y > anchorCoord.y ? 1 : -1;
      if (index === 1 || index === 5) {
        this._xfactor = 0;
      }
      else if (index === 3 || index === 7) {
        this._yfactor = 0;
      }
    }
    
    this._toolbar._beginOperation("BOX");
    this._toolbar["on" + (index === 8 ? this._rotateEvent : this._scaleEvent) + "FirstMove"](this._graphic);
  },
  
  _moveHandler: function(mover, shift) {
    //console.log(dojo.toJson(shift));
    
    var index = mover.host._index, args = this._defaultEventArgs,
        start, move, tx, pt, angle, xscale, yscale;
    
    args.angle = 0;
    args.scaleX = 1;
    args.scaleY = 1;
    
    if (index === 8) {
      // Rotate
      start = this._startLine;
      move = this._moveLine;
      pt = move[1];
      pt.x += shift.dx;
      pt.y += shift.dy;
      angle = this._getAngle(start, move);
      
      tx = dojox.gfx.matrix.rotategAt(angle, start[0]);
      this._graphic.getDojoShape().setTransform(tx);
      
      args.transform = tx;
      args.angle = angle;
      args.around = start[0];
    }
    else {
      // Scale
      start = this._startBox;
      move = this._moveBox;
      move.width += (shift.dx * this._xfactor);
      move.height += (shift.dy * this._yfactor);
      xscale = move.width / start.width;
      yscale = move.height / start.height;
      
      // Avoid NaNs or Infinitys for scale factors
      if (isNaN(xscale) || xscale === Infinity || xscale === -Infinity) {
        xscale = 1;
      }
      if (isNaN(yscale) || yscale === Infinity || yscale === -Infinity) {
        yscale = 1;
      }
      
      tx = dojox.gfx.matrix.scaleAt(xscale, yscale, start);
      this._graphic.getDojoShape().setTransform(tx);

      args.transform = tx;
      args.scaleX = xscale;
      args.scaleY = yscale;
      args.around = start;
    }
    
    this._toolbar["on" + (index === 8 ? this._rotateEvent : this._scaleEvent)](this._graphic, args);
  },
  
  _moveStopHandler: function(mover) {
    //console.log("END");
    var graphic = this._graphic, geometry = graphic.geometry.toJson(),
        shape = graphic.getDojoShape(), transform = shape.getTransform(),
        surfaceTx = graphic.getLayer()._div.getTransform();
    
    // update geometry
    this._updateSegments(geometry.paths || geometry.rings, transform, surfaceTx);
    shape.setTransform(null);
    graphic.setGeometry(esri.geometry.fromJson(geometry));
    
    // redraw box
    this._draw();
    
    // reset state
    this._startBox = this._moveBox = this._xfactor = this._yfactor = null;
    this._startLine = this._moveLine = null;
    
    this._toolbar._endOperation("BOX");
    this._defaultEventArgs.transform = transform;
    this._toolbar["on" + (mover.host._index === 8 ? this._rotateEvent : this._scaleEvent) + "Stop"](this._graphic, this._defaultEventArgs);
  },
  
  _updateSegments: function(segments, transform, surfaceTx) {
    var mx = dojox.gfx.matrix, map = this._map, wrapOffset = this._wrapOffset || 0;
    
    dojo.forEach(segments, function(segment) {
      dojo.forEach(segment, function(point) {
        var screenPt = map.toScreen({ x: point[0], y: point[1] }, /*doNotRound*/ true);
        screenPt.x += wrapOffset;
        // This is same as multiplying in this sequence:
        // 1. multiply with mx.invert(surfaceTx)
        // 2. multiply with transform
        // 3. multiply with surfaceTx
        screenPt = mx.multiplyPoint([surfaceTx, transform, mx.invert(surfaceTx)], screenPt);
        screenPt.x -= wrapOffset;
        
        var mapPt = map.toMap(screenPt);
        // Update in-place
        point[0] = mapPt.x;
        point[1] = mapPt.y;
      });
    });
  },
  
  _getAngle: function(line1, line2) {
    /*// points
    var p1 = line1[0], p2 = line1[1];
    var p3 = line2[0], p4 = line2[1];
    
    // 2D corrdinates
    var x1 = p1.x, y1 = p1.y;
    var x2 = p2.x, y2 = p2.y;
    var x3 = p3.x, y3 = p3.y;
    var x4 = p4.x, y4 = p4.y;

    // Deltas
    var dx1 = x2 - x1, dy1 = y2 - y1;
    var dx2 = x4 - x3, dy2 = y4 - y3;
    
    var dot = (dx1 * dx2) + (dy1 * dy2);
    var l2 = (dx1 * dx1 + dy1 * dy1) * (dx2 * dx2 + dy2 * dy2);
    
    var angle = Math.acos(dot / Math.sqrt(l2)) * 180 / Math.PI;
    //console.log(angle);
    return angle;*/
   
    /*var m1 = this.slope(line1[0], line1[1]);
    var m2 = this.slope(line2[0], line2[1]);
    var angle = Math.atan((m1 - m2) / (1 - (m1 * m2))) * 180 / Math.PI;
    console.log(angle);
    return angle;*/
   
    var angle1 = Math.atan2(line1[0].y - line1[1].y, line1[0].x - line1[1].x) * 180 / Math.PI,
        angle2 = Math.atan2(line2[0].y - line2[1].y, line2[0].x - line2[1].x) * 180 / Math.PI;
    return angle2 - angle1;
  }
});

// Reading related to SVG non-scaling-stroke:
// http://stackoverflow.com/questions/3127973/svg-polyline-and-path-scaling-issue
// http://www.w3.org/TR/SVGTiny12/painting.html#NonScalingStroke
// http://stackoverflow.com/questions/1039714/svg-problems
// https://bugs.webkit.org/show_bug.cgi?id=31438
// https://bugzilla.mozilla.org/show_bug.cgi?id=528332
// http://code.google.com/p/svg-edit/wiki/BrowserBugs

});

},
'dijit/_OnDijitClickMixin':function(){
define("dijit/_OnDijitClickMixin", [
	"dojo/on",
	"dojo/_base/array", // array.forEach
	"dojo/keys", // keys.ENTER keys.SPACE
	"dojo/_base/declare", // declare
	"dojo/_base/sniff", // has("ie")
	"dojo/_base/unload", // unload.addOnWindowUnload
	"dojo/_base/window" // win.doc.addEventListener win.doc.attachEvent win.doc.detachEvent
], function(on, array, keys, declare, has, unload, win){

	// module:
	//		dijit/_OnDijitClickMixin
	// summary:
	//		Mixin so you can pass "ondijitclick" to this.connect() method,
	//		as a way to handle clicks by mouse, or by keyboard (SPACE/ENTER key)


	// Keep track of where the last keydown event was, to help avoid generating
	// spurious ondijitclick events when:
	// 1. focus is on a <button> or <a>
	// 2. user presses then releases the ENTER key
	// 3. onclick handler fires and shifts focus to another node, with an ondijitclick handler
	// 4. onkeyup event fires, causing the ondijitclick handler to fire
	var lastKeyDownNode = null;
	if(has("ie")){
		(function(){
			var keydownCallback = function(evt){
				lastKeyDownNode = evt.srcElement;
			};
			win.doc.attachEvent('onkeydown', keydownCallback);
			unload.addOnWindowUnload(function(){
				win.doc.detachEvent('onkeydown', keydownCallback);
			});
		})();
	}else{
		win.doc.addEventListener('keydown', function(evt){
			lastKeyDownNode = evt.target;
		}, true);
	}

	// Custom a11yclick (a.k.a. ondijitclick) event
	var a11yclick = function(node, listener){
		if(/input|button/i.test(node.nodeName)){
			// pass through, the browser already generates click event on SPACE/ENTER key
			return on(node, "click", listener);
		}else{
			// Don't fire the click event unless both the keydown and keyup occur on this node.
			// Avoids problems where focus shifted to this node or away from the node on keydown,
			// either causing this node to process a stray keyup event, or causing another node
			// to get a stray keyup event.

			function clickKey(/*Event*/ e){
				return (e.keyCode == keys.ENTER || e.keyCode == keys.SPACE) &&
						!e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;
			}
			var handles = [
				on(node, "keypress", function(e){
					//console.log(this.id + ": onkeydown, e.target = ", e.target, ", lastKeyDownNode was ", lastKeyDownNode, ", equality is ", (e.target === lastKeyDownNode));
					if(clickKey(e)){
						// needed on IE for when focus changes between keydown and keyup - otherwise dropdown menus do not work
						lastKeyDownNode = e.target;

						// Prevent viewport scrolling on space key in IE<9.
						// (Reproducible on test_Button.html on any of the first dijit.form.Button examples)
						// Do this onkeypress rather than onkeydown because onkeydown.preventDefault() will
						// suppress the onkeypress event, breaking _HasDropDown
						e.preventDefault();
					}
				}),

				on(node, "keyup", function(e){
					//console.log(this.id + ": onkeyup, e.target = ", e.target, ", lastKeyDownNode was ", lastKeyDownNode, ", equality is ", (e.target === lastKeyDownNode));
					if(clickKey(e) && e.target == lastKeyDownNode){	// === breaks greasemonkey
						//need reset here or have problems in FF when focus returns to trigger element after closing popup/alert
						lastKeyDownNode = null;
						listener.call(this, e);
					}
				}),

				on(node, "click", function(e){
					// and connect for mouse clicks too (or touch-clicks on mobile)
					listener.call(this, e);
				})
			];

			return {
				remove: function(){
					array.forEach(handles, function(h){ h.remove(); });
				}
			};
		}
	};

	return declare("dijit._OnDijitClickMixin", null, {
		connect: function(
				/*Object|null*/ obj,
				/*String|Function*/ event,
				/*String|Function*/ method){
			// summary:
			//		Connects specified obj/event to specified method of this object
			//		and registers for disconnect() on widget destroy.
			// description:
			//		Provide widget-specific analog to connect.connect, except with the
			//		implicit use of this widget as the target object.
			//		This version of connect also provides a special "ondijitclick"
			//		event which triggers on a click or space or enter keyup.
			//		Events connected with `this.connect` are disconnected upon
			//		destruction.
			// returns:
			//		A handle that can be passed to `disconnect` in order to disconnect before
			//		the widget is destroyed.
			// example:
			//	|	var btn = new dijit.form.Button();
			//	|	// when foo.bar() is called, call the listener we're going to
			//	|	// provide in the scope of btn
			//	|	btn.connect(foo, "bar", function(){
			//	|		console.debug(this.toString());
			//	|	});
			// tags:
			//		protected

			return this.inherited(arguments, [obj, event == "ondijitclick" ? a11yclick : event, method]);
		}
	});
});

},
'esri/tasks/_task':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/graphic,esri/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.tasks._task");

dojo.require("esri.graphic");
dojo.require("esri.utils");

dojo.declare("esri.tasks._Task", null, {
    constructor: function(/*String*/ url) {
      //summary: Base class for all simple tasks. This is an abstract class and overriding
      //         classes can override any specific behavior.
      // url: String: Url to service/layer to use to execute task
      if (url && dojo.isString(url)) {
        this._url = esri.urlToObject(this.url = url);
      }
      
      this.normalization = true;
      this._errorHandler = dojo.hitch(this, this._errorHandler);
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

    _encode: function(/*Object*/ params, doNotStringify, normalized) {
      //summary: Method may be implemented by extending classes if additional encoding
      //         parameters/modifications are required. This method is called before the
      //         request is sent to the server for processing.
      // params: Object: Parameters to be sent to server. f:"json" is added by default
      // doNotStringify is used by "gp" module when handling GPMultiValued input parameters
      var param, type, result = {}, i, p, pl;
      for (i in params) {
        if (i === "declaredClass") {
          continue;
        }
        param = params[i];
        type = typeof(param);
        if (param !== null && param !== undefined && type !== "function") {
          if (dojo.isArray(param)) {
            result[i] = [];
            pl = param.length;
            
            for (p=0; p<pl; p++) {
              result[i][p] = this._encode(param[p]);
            }
          }
          else if (type === "object") {
            if (param.toJson) {
              var json = param.toJson(normalized && normalized[i]); // normalized geometries for gp feature set parameter
              if (param instanceof esri.tasks.FeatureSet){
                //in order to workaround the issue in GP service 9.3, which doesn't take spatialReference as input featureset
                //replace spatialReference as sr.
                if (json.spatialReference){
                  json.sr = json.spatialReference;
                  delete json.spatialReference;
                }
              }
              result[i] = doNotStringify ? json : dojo.toJson(json);
            }
          }
          else {
            result[i] = param;
          }
        }
      }
      return result;
    },
    
    _successHandler: function(args, eventName, callback, dfd) {
      // Fire Event
      if (eventName) {
        this[eventName].apply(this, args);
      }
      
      // Invoke Callback
      if (callback) {
        callback.apply(null, args);
      }
      
      // Resolve Deferred
      if (dfd) {
        esri._resDfd(dfd, args);
      }
    },

    _errorHandler: function(err, errback, dfd) {
      this.onError(err);

      if (errback) {
        errback(err);
      }
      
      if (dfd) {
        dfd.errback(err);
      }
    },
    
    setNormalization: function(/*Booelan*/ enable) {
      this.normalization = enable;
    },

    onError: function() {
      //summary event fired whenever there is an error
    }
  }
);

//common
dojo.declare("esri.tasks.FeatureSet", null, {
    constructor: function(/*Object*/ json) {
      if (json) {
        dojo.mixin(this, json);
        var features = this.features,
            sr = json.spatialReference,
            Graphic = esri.Graphic,
            Geometry = esri.geometry.getGeometryType(json.geometryType);

        sr = (this.spatialReference = new esri.SpatialReference(sr));
        this.geometryType = json.geometryType;
        if (json.fields) {
          this.fields = json.fields;
        }

        dojo.forEach(features, function(feature, i) {
          var hasSR = feature.geometry && feature.geometry.spatialReference;
          
          features[i] = new Graphic(
            (Geometry && feature.geometry) ? new Geometry(feature.geometry) : null, 
            feature.symbol && esri.symbol.fromJson(feature.symbol), 
            feature.attributes
          );
          
          if (features[i].geometry && !hasSR) {
            features[i].geometry.setSpatialReference(sr);
          }
        });
      }
      else {
        this.features = [];
        this.fields = [];
      }
    },

    displayFieldName: null,
    geometryType: null,
    spatialReference: null,
    fieldAliases: null,    

    toJson: function(normalized) {
      var json = {};
      if (this.displayFieldName) {
        json.displayFieldName = this.displayFieldName;
      }
      // if (this.geometryType) {
      //   json.geometryType = this.geometryType;
      // }
      if (this.fields) {
        json.fields = this.fields;
      }

      if (this.spatialReference) {
        json.spatialReference = this.spatialReference.toJson();
      }
      else if (this.features[0] && this.features[0].geometry) {
        json.spatialReference = this.features[0].geometry.spatialReference.toJson();
      }

      // var fjson, gjson, jfeatures = (json.features = []), features = this.features;
      // for (var i=0, il=features.length; i<il; i++) {
      //   fjson = features[i].toJson();
      //   gjson = {};
      //   if (fjson.geometry) {
      //     gjson.geometry = fjson.geometry;
      //   }
      //   if (fjson.attributes) {
      //     gjson.attributes = fjson.attributes;
      //   }
      //   jfeatures.push(gjson);
      // }
      
      if (this.features[0]) {
        // TODO
        // What if the first feature did not have a geometry?
        // FIX THIS!
        if (this.features[0].geometry) {
          json.geometryType = esri.geometry.getJsonType(this.features[0].geometry);
        }
        json.features = esri._encodeGraphics(this.features, normalized);
      }
      
      json.exceededTransferLimit = this.exceededTransferLimit;
      
      return esri._sanitize(json);
    }
  }
);

esri.tasks._SpatialRelationship = {
  SPATIAL_REL_INTERSECTS: "esriSpatialRelIntersects",
  SPATIAL_REL_CONTAINS: "esriSpatialRelContains",
  SPATIAL_REL_CROSSES: "esriSpatialRelCrosses",
  SPATIAL_REL_ENVELOPEINTERSECTS: "esriSpatialRelEnvelopeIntersects",
  SPATIAL_REL_INDEXINTERSECTS: "esriSpatialRelIndexIntersects",
  SPATIAL_REL_OVERLAPS: "esriSpatialRelOverlaps",
  SPATIAL_REL_TOUCHES: "esriSpatialRelTouches",
  SPATIAL_REL_WITHIN: "esriSpatialRelWithin",
  SPATIAL_REL_RELATION: "esriSpatialRelRelation"
};
});

},
'dojo/dnd/autoscroll':function(){
define(["../main", "../window"], function(dojo) {
	// module:
	//		dojo/dnd/autoscroll
	// summary:
	//		TODOC

dojo.getObject("dnd", true, dojo);

dojo.dnd.getViewport = dojo.window.getBox;

dojo.dnd.V_TRIGGER_AUTOSCROLL = 32;
dojo.dnd.H_TRIGGER_AUTOSCROLL = 32;

dojo.dnd.V_AUTOSCROLL_VALUE = 16;
dojo.dnd.H_AUTOSCROLL_VALUE = 16;

dojo.dnd.autoScroll = function(e){
	// summary:
	//		a handler for onmousemove event, which scrolls the window, if
	//		necesary
	// e: Event
	//		onmousemove event

	// FIXME: needs more docs!
	var v = dojo.window.getBox(), dx = 0, dy = 0;
	if(e.clientX < dojo.dnd.H_TRIGGER_AUTOSCROLL){
		dx = -dojo.dnd.H_AUTOSCROLL_VALUE;
	}else if(e.clientX > v.w - dojo.dnd.H_TRIGGER_AUTOSCROLL){
		dx = dojo.dnd.H_AUTOSCROLL_VALUE;
	}
	if(e.clientY < dojo.dnd.V_TRIGGER_AUTOSCROLL){
		dy = -dojo.dnd.V_AUTOSCROLL_VALUE;
	}else if(e.clientY > v.h - dojo.dnd.V_TRIGGER_AUTOSCROLL){
		dy = dojo.dnd.V_AUTOSCROLL_VALUE;
	}
	window.scrollBy(dx, dy);
};

dojo.dnd._validNodes = {"div": 1, "p": 1, "td": 1};
dojo.dnd._validOverflow = {"auto": 1, "scroll": 1};

dojo.dnd.autoScrollNodes = function(e){
	// summary:
	//		a handler for onmousemove event, which scrolls the first avaialble
	//		Dom element, it falls back to dojo.dnd.autoScroll()
	// e: Event
	//		onmousemove event

	// FIXME: needs more docs!

	var b, t, w, h, rx, ry, dx = 0, dy = 0, oldLeft, oldTop;

	for(var n = e.target; n;){
		if(n.nodeType == 1 && (n.tagName.toLowerCase() in dojo.dnd._validNodes)){
			var s = dojo.getComputedStyle(n),
				overflow = (s.overflow.toLowerCase() in dojo.dnd._validOverflow),
				overflowX = (s.overflowX.toLowerCase() in dojo.dnd._validOverflow),
				overflowY = (s.overflowY.toLowerCase() in dojo.dnd._validOverflow);
			if(overflow || overflowX || overflowY){
				b = dojo._getContentBox(n, s);
				t = dojo.position(n, true);
			}
			// overflow-x
			if(overflow || overflowX){
				w = Math.min(dojo.dnd.H_TRIGGER_AUTOSCROLL, b.w / 2);
				rx = e.pageX - t.x;
				if(dojo.isWebKit || dojo.isOpera){
					// FIXME: this code should not be here, it should be taken into account
					// either by the event fixing code, or the dojo.position()
					// FIXME: this code doesn't work on Opera 9.5 Beta
					rx += dojo.body().scrollLeft;
				}
				dx = 0;
				if(rx > 0 && rx < b.w){
					if(rx < w){
						dx = -w;
					}else if(rx > b.w - w){
						dx = w;
					}
					oldLeft = n.scrollLeft;
					n.scrollLeft = n.scrollLeft + dx;
				}
			}
			// overflow-y
			if(overflow || overflowY){
				//console.log(b.l, b.t, t.x, t.y, n.scrollLeft, n.scrollTop);
				h = Math.min(dojo.dnd.V_TRIGGER_AUTOSCROLL, b.h / 2);
				ry = e.pageY - t.y;
				if(dojo.isWebKit || dojo.isOpera){
					// FIXME: this code should not be here, it should be taken into account
					// either by the event fixing code, or the dojo.position()
					// FIXME: this code doesn't work on Opera 9.5 Beta
					ry += dojo.body().scrollTop;
				}
				dy = 0;
				if(ry > 0 && ry < b.h){
					if(ry < h){
						dy = -h;
					}else if(ry > b.h - h){
						dy = h;
					}
					oldTop = n.scrollTop;
					n.scrollTop  = n.scrollTop  + dy;
				}
			}
			if(dx || dy){ return; }
		}
		try{
			n = n.parentNode;
		}catch(x){
			n = null;
		}
	}
	dojo.dnd.autoScroll(e);
};

	return dojo.dnd;
});

},
'dojo/cache':function(){
define(["./_base/kernel", "./text"], function(dojo, text){
	// module:
	//		dojo/cache
	// summary:
	//		The module defines dojo.cache by loading dojo/text.

	//dojo.cache is defined in dojo/text
	return dojo.cache;
});

},
'dojox/grid/_ViewManager':function(){
define("dojox/grid/_ViewManager", [
	"dojo/_base/declare",
	"dojo/_base/sniff",
	"dojo/dom-class"
], function(declare, has, domClass){

return declare('dojox.grid._ViewManager', null, {
	// summary:
	//		A collection of grid views. Owned by grid and used internally for managing grid views.
	// description:
	//		Grid creates views automatically based on grid's layout structure.
	//		Users should typically not need to access individual views or the views collection directly.
	constructor: function(inGrid){
		this.grid = inGrid;
	},

	defaultWidth: 200,

	views: [],

	// operations
	resize: function(){
		this.onEach("resize");
	},

	render: function(){
		this.onEach("render");
	},

	// views
	addView: function(inView){
		inView.idx = this.views.length;
		this.views.push(inView);
	},

	destroyViews: function(){
		for(var i=0, v; v=this.views[i]; i++){
			v.destroy();
		}
		this.views = [];
	},

	getContentNodes: function(){
		var nodes = [];
		for(var i=0, v; v=this.views[i]; i++){
			nodes.push(v.contentNode);
		}
		return nodes;
	},

	forEach: function(inCallback){
		for(var i=0, v; v=this.views[i]; i++){
			inCallback(v, i);
		}
	},

	onEach: function(inMethod, inArgs){
		inArgs = inArgs || [];
		for(var i=0, v; v=this.views[i]; i++){
			if(inMethod in v){
				v[inMethod].apply(v, inArgs);
			}
		}
	},

	// layout
	normalizeHeaderNodeHeight: function(){
		var rowNodes = [];
		for(var i=0, v; (v=this.views[i]); i++){
			if(v.headerContentNode.firstChild){
				rowNodes.push(v.headerContentNode);
			}
		}
		this.normalizeRowNodeHeights(rowNodes);
	},

	normalizeRowNodeHeights: function(inRowNodes){
		var h = 0;
		var currHeights = [];
		if(this.grid.rowHeight){
			h = this.grid.rowHeight;
		}else{
			if(inRowNodes.length <= 1){
				// no need to normalize if we are the only one...
				return;
			}
			for(var i=0, n; (n=inRowNodes[i]); i++){
				// We only care about the height - so don't use marginBox.  This
				// depends on the container not having any margin (which it shouldn't)
				// Also - we only look up the height if the cell doesn't have the
				// dojoxGridNonNormalizedCell class (like for row selectors)
				if(!domClass.contains(n, "dojoxGridNonNormalizedCell")){
					currHeights[i] = n.firstChild.offsetHeight;
					h =  Math.max(h, currHeights[i]);
				}
			}
			h = (h >= 0 ? h : 0);
	
			//Work around odd FF3 rendering bug: #8864.
			//A one px increase fixes FireFox 3's rounding bug for fractional font sizes.
			if((has("mozilla") || has("ie") > 8 ) && h){h++;}
		}
		for(i=0; (n=inRowNodes[i]); i++){
			if(currHeights[i] != h){
				n.firstChild.style.height = h + "px";
			}
		}
	},
	
	resetHeaderNodeHeight: function(){
		for(var i=0, v, n; (v=this.views[i]); i++){
			n = v.headerContentNode.firstChild;
			if(n){
				n.style.height = "";
			}
		}
	},

	renormalizeRow: function(inRowIndex){
		var rowNodes = [];
		for(var i=0, v, n; (v=this.views[i])&&(n=v.getRowNode(inRowIndex)); i++){
			n.firstChild.style.height = '';
			rowNodes.push(n);
		}
		this.normalizeRowNodeHeights(rowNodes);
	},

	getViewWidth: function(inIndex){
		return this.views[inIndex].getWidth() || this.defaultWidth;
	},

	// must be called after view widths are properly set or height can be miscalculated
	// if there are flex columns
	measureHeader: function(){
		// need to reset view header heights so they are properly measured.
		this.resetHeaderNodeHeight();
		this.forEach(function(inView){
			inView.headerContentNode.style.height = '';
		});
		var h = 0;
		// calculate maximum view header height
		this.forEach(function(inView){
			h = Math.max(inView.headerNode.offsetHeight, h);
		});
		return h;
	},

	measureContent: function(){
		var h = 0;
		this.forEach(function(inView){
			h = Math.max(inView.domNode.offsetHeight, h);
		});
		return h;
	},

	findClient: function(inAutoWidth){
		// try to use user defined client
		var c = this.grid.elasticView || -1;
		// attempt to find implicit client
		if(c < 0){
			for(var i=1, v; (v=this.views[i]); i++){
				if(v.viewWidth){
					for(i=1; (v=this.views[i]); i++){
						if(!v.viewWidth){
							c = i;
							break;
						}
					}
					break;
				}
			}
		}
		// client is in the middle by default
		if(c < 0){
			c = Math.floor(this.views.length / 2);
		}
		return c;
	},

	arrange: function(l, w){
		var i, v, vw, len = this.views.length, self = this;
		// find the client
		var c = (w <= 0 ? len : this.findClient());
		// layout views
		var setPosition = function(v, l){
			var ds = v.domNode.style;
			var hs = v.headerNode.style;

			if(!self.grid.isLeftToRight()){
				ds.right = l + 'px';
				// fixed rtl, the scrollbar is on the right side in FF or WebKit
				if (has("ff") < 4 || has("webkit")){
					hs.right = l + v.getScrollbarWidth() + 'px';
					hs.width = parseInt(hs.width, 10) - v.getScrollbarWidth() + 'px';
				}else{
					hs.right = l + 'px';
				}
			}else{
				ds.left = l + 'px';
				hs.left = l + 'px';
			}
			ds.top = 0 + 'px';
			hs.top = 0;
		};
		// for views left of the client
		//BiDi TODO: The left and right should not appear in BIDI environment. Should be replaced with
		//leading and tailing concept.
		for(i=0; (v=this.views[i])&&(i<c); i++){
			// get width
			vw = this.getViewWidth(i);
			// process boxes
			v.setSize(vw, 0);
			setPosition(v, l);
			if(v.headerContentNode && v.headerContentNode.firstChild){
				vw = v.getColumnsWidth()+v.getScrollbarWidth();
			}else{
				vw = v.domNode.offsetWidth;
			}
			// update position
			l += vw;
		}
		// next view (is the client, i++ == c)
		i++;
		// start from the right edge
		var r = w;
		// for views right of the client (iterated from the right)
		for(var j=len-1; (v=this.views[j])&&(i<=j); j--){
			// get width
			vw = this.getViewWidth(j);
			// set size
			v.setSize(vw, 0);
			// measure in pixels
			vw = v.domNode.offsetWidth;
			// update position
			r -= vw;
			// set position
			setPosition(v, r);
		}
		if(c<len){
			v = this.views[c];
			// position the client box between left and right boxes
			vw = Math.max(1, r-l);
			// set size
			v.setSize(vw + 'px', 0);
			setPosition(v, l);
		}
		return l;
	},

	// rendering
	renderRow: function(inRowIndex, inNodes, skipRenorm){
		var rowNodes = [];
		for(var i=0, v, n, rowNode; (v=this.views[i])&&(n=inNodes[i]); i++){
			rowNode = v.renderRow(inRowIndex);
			n.appendChild(rowNode);
			rowNodes.push(rowNode);
		}
		if(!skipRenorm){
			this.normalizeRowNodeHeights(rowNodes);
		}
	},
	
	rowRemoved: function(inRowIndex){
		this.onEach("rowRemoved", [ inRowIndex ]);
	},
	
	// updating
	updateRow: function(inRowIndex, skipRenorm){
		for(var i=0, v; v=this.views[i]; i++){
			v.updateRow(inRowIndex);
		}
		if(!skipRenorm){
			this.renormalizeRow(inRowIndex);
		}
	},
	
	updateRowStyles: function(inRowIndex){
		this.onEach("updateRowStyles", [ inRowIndex ]);
	},
	
	// scrolling
	setScrollTop: function(inTop){
		var top = inTop;
		for(var i=0, v; v=this.views[i]; i++){
			top = v.setScrollTop(inTop);
			// Work around IE not firing scroll events that cause header offset
			// issues to occur.
			if(has("ie") && v.headerNode && v.scrollboxNode){
				v.headerNode.scrollLeft = v.scrollboxNode.scrollLeft;
			}
		}
		return top;
		//this.onEach("setScrollTop", [ inTop ]);
	},
	
	getFirstScrollingView: function(){
		// summary: Returns the first grid view with a scroll bar
		for(var i=0, v; (v=this.views[i]); i++){
			if(v.hasHScrollbar() || v.hasVScrollbar()){
				return v;
			}
		}
		return null;
	}
});
});
},
'esri/toolbars/_GraphicMover':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!dojox/gfx/move"], function(dijit,dojo,dojox){
dojo.provide("esri.toolbars._GraphicMover");

dojo.require("dojox.gfx.move");

// ALERT
// We extend the gfx mover here so that we can record
// the last event and extract the screen point out of it
// for the onGraphicClick event
// Need a keep an eye on the constructor signature for
// dojox.gfx.Mover at every dojo release
dojo.declare("esri.toolbars._Mover", dojox.gfx.Mover, {
  constructor: function(shape, e, host) {
    this.__e = e;
  }
});

dojo.declare("esri.toolbars._GraphicMover", null, {
  constructor: function(graphic, map, toolbar) {
    this.graphic = graphic;
    this.map = map;
    this.toolbar = toolbar;
    
    this._enableGraphicMover();
    this._moved = false;
  },
  
  refresh: function(force) {
    var shape = this.graphic.getDojoShape();
    if (shape && (force || !shape._hostGraphic)) { // just clipped-in?
      //console.log("_GraphicMover - refresh");
      this._disableGraphicMover();
      this._enableGraphicMover();
    }
  },
  
  destroy: function() {
    this._disableGraphicMover();
  },
  
  hasMoved: function() {
    return this._moved;
  },
  
  /***************************
   * Events
   * 
   * Handled for Edit toolbar
   *   onGraphicMoveStart (graphic)
   *   onGraphicFirstMove (graphic)
   *   onGraphicMove (graphic, transform)
   *   onGraphicMoveStop (graphic, transform)
   *   onGraphicClick (graphic, info)
   ***************************/
  
  /*******************
   * Internal Methods
   *******************/
  
  _enableGraphicMover: function() {
    var graphic = this.graphic;
    var dojoShape = graphic.getDojoShape();
    if (dojoShape) {
      dojoShape._hostGraphic = graphic;
      this._moveable = new dojox.gfx.Moveable(dojoShape, { mover: esri.toolbars._Mover });
      this._moveStartHandle = dojo.connect(this._moveable, "onMoveStart", this, this._moveStartHandler);
      this._firstMoveHandle = dojo.connect(this._moveable, "onFirstMove", this, this._firstMoveHandler);
      this._movingHandle = dojo.connect(this._moveable, "onMoving", this, this._movingHandler);
      this._moveStopHandle = dojo.connect(this._moveable, "onMoveStop", this, this._moveStopHandler);
      
      var node = dojoShape.getEventSource();
      if (node) {
        dojo.style(node, "cursor", this.toolbar._cursors.move);
      }
    }
  },
  
  _disableGraphicMover: function() {
    var moveable = this._moveable;
    if (moveable) {
      dojo.disconnect(this._moveStartHandle);
      dojo.disconnect(this._firstMoveHandle);
      dojo.disconnect(this._movingHandle);
      dojo.disconnect(this._moveStopHandle);
      var shape = moveable.shape;
      if (shape) {
        shape._hostGraphic = null;
      
        var node = shape.getEventSource();
        if (node) {
          dojo.style(node, "cursor", null);
        }
      }
      moveable.destroy();
    }
    this._moveable = null;
  },
  
  _moveStartHandler: function() {
    var graphic = this.graphic;
    this._startTx = graphic.getDojoShape().getTransform();
    if (this.graphic.geometry.type === "point") {
      var map = this.map;
      if (map.snappingManager) {
        map.snappingManager._setUpSnapping();
      }
    }
    //console.log(dojo.toJson(this._startTx));
    this.toolbar.onGraphicMoveStart(graphic);
  },
  
  _firstMoveHandler: function() {
    //this.constructor.onFirstMove(this);
    this.toolbar._beginOperation("MOVE");
    this.toolbar.onGraphicFirstMove(this.graphic);
  },
  
  _movingHandler: function(mover) {
    this.toolbar.onGraphicMove(this.graphic, mover.shape.getTransform());
  },
  
  _moveStopHandler: function(mover) {
    //console.log("_moveStopHandler");
    var graphic = /*evt.graphic*/ /*this._moveable.shape._hostGraphic*/ this.graphic,
        map = this.map,
        mx = dojox.gfx.matrix,
        geometry = graphic.geometry,
        type = geometry.type,
        dojoShape = graphic.getDojoShape(),
        tx = dojoShape.getTransform();
    //console.log(dojo.toJson(tx));
    //if (!tx || !tx.dx && !tx.dy) {
    if ( dojo.toJson(tx) !==  dojo.toJson(this._startTx) ) {
      this._moved = true;
      
      switch(type) {
        case "point":
          //var newMapPt = map.toMap(map.toScreen(firstPt).offset(tx.dx, tx.dy));          
          var matrix = [ tx, mx.invert(this._startTx) ];
          var snappingPoint;
          if (map.snappingManager) {
            snappingPoint = map.snappingManager._snappingPoint;
          }
          geometry = snappingPoint || map.toMap(mx.multiplyPoint(matrix, map.toScreen(geometry, /*doNotRound*/ true)));
          if(map.snappingManager) {
            map.snappingManager._killOffSnapping();
          }
          break;
        case "polyline":
          geometry = this._updatePolyGeometry(geometry, geometry.paths, tx);
          break;
        case "polygon":
          geometry = this._updatePolyGeometry(geometry, geometry.rings, tx);
          break;
      }
      
      dojoShape.setTransform(null);
      graphic.setGeometry(geometry);
    }
    else {
      this._moved = false;
    }
    //this.constructor.onMoveStop(this);
    this.toolbar._endOperation("MOVE");
    this.toolbar.onGraphicMoveStop(graphic, tx);
    if (!this._moved) {
      var e = mover.__e,
          mapPosition = this.map.position,
          pt = new esri.geometry.Point(e.pageX - mapPosition.x, e.pageY - mapPosition.y);
      this.toolbar.onGraphicClick(graphic, { screenPoint: pt, mapPoint: this.map.toMap(pt) });
    }
  },
  
  _updatePolyGeometry: function(geometry, /*rings or paths*/ segments, transform) {
    var map = this.map;
    var firstPt = geometry.getPoint(0, 0);
    var newMapPt = map.toMap(map.toScreen(firstPt).offset(transform.dx, transform.dy));
    var d_mapX = newMapPt.x - firstPt.x;
    var d_mapY = newMapPt.y - firstPt.y;
  
    //var rings = geometry.rings;
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      for (var j = 0; j < seg.length; j++) {
        var point = geometry.getPoint(i, j);
        geometry.setPoint(i, j, point.offset(d_mapX, d_mapY));
      }
    }
    return geometry;
  }
});

// mixins
//dojo.mixin(esri.toolbars._GraphicMover, {
//  onFirstMove: function() {},
//  onMoveStop: function() {}
//});

});

},
'url:dijit/templates/MenuItem.html':"<tr class=\"dijitReset dijitMenuItem\" data-dojo-attach-point=\"focusNode\" role=\"menuitem\" tabIndex=\"-1\"\r\n\t\tdata-dojo-attach-event=\"onmouseenter:_onHover,onmouseleave:_onUnhover,ondijitclick:_onClick\">\r\n\t<td class=\"dijitReset dijitMenuItemIconCell\" role=\"presentation\">\r\n\t\t<img src=\"${_blankGif}\" alt=\"\" class=\"dijitIcon dijitMenuItemIcon\" data-dojo-attach-point=\"iconNode\"/>\r\n\t</td>\r\n\t<td class=\"dijitReset dijitMenuItemLabel\" colspan=\"2\" data-dojo-attach-point=\"containerNode\"></td>\r\n\t<td class=\"dijitReset dijitMenuItemAccelKey\" style=\"display: none\" data-dojo-attach-point=\"accelKeyNode\"></td>\r\n\t<td class=\"dijitReset dijitMenuArrowCell\" role=\"presentation\">\r\n\t\t<div data-dojo-attach-point=\"arrowWrapper\" style=\"visibility: hidden\">\r\n\t\t\t<img src=\"${_blankGif}\" alt=\"\" class=\"dijitMenuExpand\"/>\r\n\t\t\t<span class=\"dijitMenuExpandA11y\">+</span>\r\n\t\t</div>\r\n\t</td>\r\n</tr>\r\n",
'dojo/cldr/nls/gregorian':function(){
define({ root:

//begin v1.x content
{
	"months-format-narrow": [
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9",
		"10",
		"11",
		"12"
	],
	"quarters-standAlone-narrow": [
		"1",
		"2",
		"3",
		"4"
	],
	"field-weekday": "Day of the Week",
	"dateFormatItem-yQQQ": "y QQQ",
	"dateFormatItem-yMEd": "EEE, y-M-d",
	"dateFormatItem-MMMEd": "E MMM d",
	"eraNarrow": [
		"BCE",
		"CE"
	],
	"dateTimeFormats-appendItem-Day-Of-Week": "{0} {1}",
	"dateFormat-long": "y MMMM d",
	"months-format-wide": [
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9",
		"10",
		"11",
		"12"
	],
	"dateTimeFormat-medium": "{1} {0}",
	"dateFormatItem-EEEd": "d EEE",
	"dayPeriods-format-wide-pm": "PM",
	"dateFormat-full": "EEEE, y MMMM dd",
	"dateFormatItem-Md": "M-d",
	"dayPeriods-format-abbr-am": "AM",
	"dateTimeFormats-appendItem-Second": "{0} ({2}: {1})",
	"field-era": "Era",
	"dateFormatItem-yM": "y-M",
	"months-standAlone-wide": [
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9",
		"10",
		"11",
		"12"
	],
	"timeFormat-short": "HH:mm",
	"quarters-format-wide": [
		"Q1",
		"Q2",
		"Q3",
		"Q4"
	],
	"timeFormat-long": "HH:mm:ss z",
	"field-year": "Year",
	"dateFormatItem-yMMM": "y MMM",
	"dateFormatItem-yQ": "y Q",
	"dateTimeFormats-appendItem-Era": "{0} {1}",
	"field-hour": "Hour",
	"months-format-abbr": [
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9",
		"10",
		"11",
		"12"
	],
	"timeFormat-full": "HH:mm:ss zzzz",
	"dateTimeFormats-appendItem-Week": "{0} ({2}: {1})",
	"field-day-relative+0": "Today",
	"field-day-relative+1": "Tomorrow",
	"dateFormatItem-H": "HH",
	"months-standAlone-abbr": [
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9",
		"10",
		"11",
		"12"
	],
	"quarters-format-abbr": [
		"Q1",
		"Q2",
		"Q3",
		"Q4"
	],
	"quarters-standAlone-wide": [
		"Q1",
		"Q2",
		"Q3",
		"Q4"
	],
	"dateFormatItem-M": "L",
	"days-standAlone-wide": [
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7"
	],
	"timeFormat-medium": "HH:mm:ss",
	"dateFormatItem-Hm": "HH:mm",
	"quarters-standAlone-abbr": [
		"Q1",
		"Q2",
		"Q3",
		"Q4"
	],
	"eraAbbr": [
		"BCE",
		"CE"
	],
	"field-minute": "Minute",
	"field-dayperiod": "Dayperiod",
	"days-standAlone-abbr": [
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7"
	],
	"dateFormatItem-d": "d",
	"dateFormatItem-ms": "mm:ss",
	"quarters-format-narrow": [
		"1",
		"2",
		"3",
		"4"
	],
	"field-day-relative+-1": "Yesterday",
	"dateFormatItem-h": "h a",
	"dateTimeFormat-long": "{1} {0}",
	"dayPeriods-format-narrow-am": "AM",
	"dateFormatItem-MMMd": "MMM d",
	"dateFormatItem-MEd": "E, M-d",
	"dateTimeFormat-full": "{1} {0}",
	"field-day": "Day",
	"days-format-wide": [
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7"
	],
	"field-zone": "Zone",
	"dateTimeFormats-appendItem-Day": "{0} ({2}: {1})",
	"dateFormatItem-y": "y",
	"months-standAlone-narrow": [
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9",
		"10",
		"11",
		"12"
	],
	"dateFormatItem-hm": "h:mm a",
	"dateTimeFormats-appendItem-Year": "{0} {1}",
	"dateTimeFormats-appendItem-Hour": "{0} ({2}: {1})",
	"dayPeriods-format-abbr-pm": "PM",
	"days-format-abbr": [
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7"
	],
	"eraNames": [
		"BCE",
		"CE"
	],
	"days-format-narrow": [
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7"
	],
	"days-standAlone-narrow": [
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7"
	],
	"dateFormatItem-MMM": "LLL",
	"field-month": "Month",
	"dateTimeFormats-appendItem-Quarter": "{0} ({2}: {1})",
	"dayPeriods-format-wide-am": "AM",
	"dateTimeFormats-appendItem-Month": "{0} ({2}: {1})",
	"dateTimeFormats-appendItem-Minute": "{0} ({2}: {1})",
	"dateFormat-short": "yyyy-MM-dd",
	"field-second": "Second",
	"dateFormatItem-yMMMEd": "EEE, y MMM d",
	"dateTimeFormats-appendItem-Timezone": "{0} {1}",
	"field-week": "Week",
	"dateFormat-medium": "y MMM d",
	"dayPeriods-format-narrow-pm": "PM",
	"dateTimeFormat-short": "{1} {0}",
	"dateFormatItem-Hms": "HH:mm:ss",
	"dateFormatItem-hms": "h:mm:ss a"
}
//end v1.x content
,
	"ar": true,
	"ca": true,
	"cs": true,
	"da": true,
	"de": true,
	"el": true,
	"en": true,
	"en-au": true,
	"en-ca": true,
	"en-gb": true,
	"es": true,
	"fi": true,
	"fr": true,
	"fr-ch": true,
	"he": true,
	"hu": true,
	"it": true,
	"ja": true,
	"ko": true,
	"nb": true,
	"nl": true,
	"pl": true,
	"pt": true,
	"pt-pt": true,
	"ro": true,
	"ru": true,
	"sk": true,
	"sl": true,
	"sv": true,
	"th": true,
	"tr": true,
	"zh": true,
	"zh-hant": true,
	"zh-hk": true,
	"zh-tw": true
});
},
'dojo/uacss':function(){
define(["./dom-geometry", "./_base/lang", "./ready", "./_base/sniff", "./_base/window"],
	function(geometry, lang, ready, has, baseWindow){
	// module:
	//		dojo/uacss
	// summary:
	//		Applies pre-set CSS classes to the top-level HTML node, based on:
	//			- browser (ex: dj_ie)
	//			- browser version (ex: dj_ie6)
	//			- box model (ex: dj_contentBox)
	//			- text direction (ex: dijitRtl)
	//
	//		In addition, browser, browser version, and box model are
	//		combined with an RTL flag when browser text is RTL. ex: dj_ie-rtl.

	var
		html = baseWindow.doc.documentElement,
		ie = has("ie"),
		opera = has("opera"),
		maj = Math.floor,
		ff = has("ff"),
		boxModel = geometry.boxModel.replace(/-/,''),

		classes = {
			"dj_ie": ie,
			"dj_ie6": maj(ie) == 6,
			"dj_ie7": maj(ie) == 7,
			"dj_ie8": maj(ie) == 8,
			"dj_ie9": maj(ie) == 9,
			"dj_quirks": has("quirks"),
			"dj_iequirks": ie && has("quirks"),

			// NOTE: Opera not supported by dijit
			"dj_opera": opera,

			"dj_khtml": has("khtml"),

			"dj_webkit": has("webkit"),
			"dj_safari": has("safari"),
			"dj_chrome": has("chrome"),

			"dj_gecko": has("mozilla"),
			"dj_ff3": maj(ff) == 3
		}; // no dojo unsupported browsers

	classes["dj_" + boxModel] = true;

	// apply browser, browser version, and box model class names
	var classStr = "";
	for(var clz in classes){
		if(classes[clz]){
			classStr += clz + " ";
		}
	}
	html.className = lang.trim(html.className + " " + classStr);

	// If RTL mode, then add dj_rtl flag plus repeat existing classes with -rtl extension.
	// We can't run the code below until the <body> tag has loaded (so we can check for dir=rtl).
	// priority is 90 to run ahead of parser priority of 100
	ready(90, function(){
		if(!geometry.isBodyLtr()){
			var rtlClassStr = "dj_rtl dijitRtl " + classStr.replace(/ /g, "-rtl ");
			html.className = lang.trim(html.className + " " + rtlClassStr + "dj_rtl dijitRtl " + classStr.replace(/ /g, "-rtl "));
		}
	});
	return has;
});

},
'dojo/string':function(){
define(["./_base/kernel", "./_base/lang"], function(dojo, lang) {
	// module:
	//		dojo/string
	// summary:
	//		TODOC

lang.getObject("string", true, dojo);

/*=====
dojo.string = {
	// summary: String utilities for Dojo
};
=====*/

dojo.string.rep = function(/*String*/str, /*Integer*/num){
	// summary:
	//		Efficiently replicate a string `n` times.
	// str:
	//		the string to replicate
	// num:
	//		number of times to replicate the string

	if(num <= 0 || !str){ return ""; }

	var buf = [];
	for(;;){
		if(num & 1){
			buf.push(str);
		}
		if(!(num >>= 1)){ break; }
		str += str;
	}
	return buf.join("");	// String
};

dojo.string.pad = function(/*String*/text, /*Integer*/size, /*String?*/ch, /*Boolean?*/end){
	// summary:
	//		Pad a string to guarantee that it is at least `size` length by
	//		filling with the character `ch` at either the start or end of the
	//		string. Pads at the start, by default.
	// text:
	//		the string to pad
	// size:
	//		length to provide padding
	// ch:
	//		character to pad, defaults to '0'
	// end:
	//		adds padding at the end if true, otherwise pads at start
	// example:
	//	|	// Fill the string to length 10 with "+" characters on the right.  Yields "Dojo++++++".
	//	|	dojo.string.pad("Dojo", 10, "+", true);

	if(!ch){
		ch = '0';
	}
	var out = String(text),
		pad = dojo.string.rep(ch, Math.ceil((size - out.length) / ch.length));
	return end ? out + pad : pad + out;	// String
};

dojo.string.substitute = function(	/*String*/		template,
									/*Object|Array*/map,
									/*Function?*/	transform,
									/*Object?*/		thisObject){
	// summary:
	//		Performs parameterized substitutions on a string. Throws an
	//		exception if any parameter is unmatched.
	// template:
	//		a string with expressions in the form `${key}` to be replaced or
	//		`${key:format}` which specifies a format function. keys are case-sensitive.
	// map:
	//		hash to search for substitutions
	// transform:
	//		a function to process all parameters before substitution takes
	//		place, e.g. mylib.encodeXML
	// thisObject:
	//		where to look for optional format function; default to the global
	//		namespace
	// example:
	//		Substitutes two expressions in a string from an Array or Object
	//	|	// returns "File 'foo.html' is not found in directory '/temp'."
	//	|	// by providing substitution data in an Array
	//	|	dojo.string.substitute(
	//	|		"File '${0}' is not found in directory '${1}'.",
	//	|		["foo.html","/temp"]
	//	|	);
	//	|
	//	|	// also returns "File 'foo.html' is not found in directory '/temp'."
	//	|	// but provides substitution data in an Object structure.  Dotted
	//	|	// notation may be used to traverse the structure.
	//	|	dojo.string.substitute(
	//	|		"File '${name}' is not found in directory '${info.dir}'.",
	//	|		{ name: "foo.html", info: { dir: "/temp" } }
	//	|	);
	// example:
	//		Use a transform function to modify the values:
	//	|	// returns "file 'foo.html' is not found in directory '/temp'."
	//	|	dojo.string.substitute(
	//	|		"${0} is not found in ${1}.",
	//	|		["foo.html","/temp"],
	//	|		function(str){
	//	|			// try to figure out the type
	//	|			var prefix = (str.charAt(0) == "/") ? "directory": "file";
	//	|			return prefix + " '" + str + "'";
	//	|		}
	//	|	);
	// example:
	//		Use a formatter
	//	|	// returns "thinger -- howdy"
	//	|	dojo.string.substitute(
	//	|		"${0:postfix}", ["thinger"], null, {
	//	|			postfix: function(value, key){
	//	|				return value + " -- howdy";
	//	|			}
	//	|		}
	//	|	);

	thisObject = thisObject || dojo.global;
	transform = transform ?
		lang.hitch(thisObject, transform) : function(v){ return v; };

	return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g,
		function(match, key, format){
			var value = lang.getObject(key, false, map);
			if(format){
				value = lang.getObject(format, false, thisObject).call(thisObject, value, key);
			}
			return transform(value, key).toString();
		}); // String
};

/*=====
dojo.string.trim = function(str){
	// summary:
	//		Trims whitespace from both sides of the string
	// str: String
	//		String to be trimmed
	// returns: String
	//		Returns the trimmed string
	// description:
	//		This version of trim() was taken from [Steven Levithan's blog](http://blog.stevenlevithan.com/archives/faster-trim-javascript).
	//		The short yet performant version of this function is dojo.trim(),
	//		which is part of Dojo base.  Uses String.prototype.trim instead, if available.
	return "";	// String
}
=====*/

dojo.string.trim = String.prototype.trim ?
	lang.trim : // aliasing to the native function
	function(str){
		str = str.replace(/^\s+/, '');
		for(var i = str.length - 1; i >= 0; i--){
			if(/\S/.test(str.charAt(i))){
				str = str.substring(0, i + 1);
				break;
			}
		}
		return str;
	};

return dojo.string;
});

},
'esri/toolbars/draw':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/toolbars/_toolbar,esri/geometry,esri/symbol,esri/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.toolbars.draw");

dojo.require("esri.toolbars._toolbar");
dojo.require("esri.geometry");
dojo.require("esri.symbol");
dojo.require("esri.utils");

dojo.declare("esri.toolbars.Draw", esri.toolbars._Toolbar, {
    constructor: function(/*esri.Map*/ map,  /*Object?*/ options) {
      //summary: Create a new toolbar to draw geometries (point, line,
      //         rect, polyline, polygon, circle, oval) on a map.
      this.markerSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SOLID, 10, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0]), 2), new dojo.Color([0,0,0,0.25]));
      this.lineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0]), 2);
      this.fillSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0]), 2), new dojo.Color([0,0,0,0.25]));

      this._points = [];
      
      // default options
      this._defaultOptions = {
          showTooltips: true,
          drawTime  : 75,
          tolerance : 8,
          tooltipOffset: 15         
      };
      
      this._options = dojo.mixin(dojo.mixin({}, this._defaultOptions), options || {});
      
      // disable tooltip on touch devices
      if (esri.isTouchEnabled) {
        this._options.showTooltips = false;
      }
                       
      this._onKeyDownHandler = dojo.hitch(this, this._onKeyDownHandler);
      this._onMouseDownHandler = dojo.hitch(this, this._onMouseDownHandler);
      this._onMouseUpHandler = dojo.hitch(this, this._onMouseUpHandler);
      this._onClickHandler = dojo.hitch(this, this._onClickHandler);
      this._onMouseMoveHandler = dojo.hitch(this, this._onMouseMoveHandler);
      this._onMouseDragHandler = dojo.hitch(this, this._onMouseDragHandler);
      this._onDblClickHandler = dojo.hitch(this, this._onDblClickHandler);
      this._updateTooltip = dojo.hitch(this, this._updateTooltip);
      this._hideTooltip = dojo.hitch(this, this._hideTooltip);
      this._redrawGraphic = dojo.hitch(this, this._redrawGraphic);
    },

    _geometryType: null,
    respectDrawingVertexOrder: false,

    setRespectDrawingVertexOrder: function(set) {
      this.respectDrawingVertexOrder = set;
    },

    setMarkerSymbol: function(markerSymbol) {
      this.markerSymbol = markerSymbol;
    },

    setLineSymbol: function(lineSymbol) {
      this.lineSymbol = lineSymbol;
    },

    setFillSymbol: function(fillSymbol) {
      this.fillSymbol = fillSymbol;
    },

    activate: function(/*String*/ geometryType, /*Object?*/ options) {
      //summary: Activates tool to draw geometry
      // geometry: String: Geometry type to be drawn (esri.toolbar.Draw.GEOMETRIES.<type>)
      // symbol?: esri.symbol.Symbol: Symbology to be used to draw geometry
      if (this._geometryType) {
        this.deactivate();
      }

      var map = this.map,
          dc = dojo.connect,
          Draw = esri.toolbars.Draw;
          
      this._options = dojo.mixin(dojo.mixin({}, this._options), options || {});       
      map.__resetClickDuration();

      switch (geometryType) {
        case Draw.POINT:
        case Draw.ARROW:
        case Draw.LEFT_ARROW:
        case Draw.RIGHT_ARROW:
        case Draw.UP_ARROW:
        case Draw.DOWN_ARROW:		
        case Draw.TRIANGLE:
        case Draw.CIRCLE:
        case Draw.ELLIPSE:
        case Draw.RECTANGLE:
          this._onClickHandler_connect = dc(map, "onClick", this._onClickHandler);
          break;
          
        case Draw.LINE:
        case Draw.EXTENT:
        case Draw.FREEHAND_POLYLINE:
        case Draw.FREEHAND_POLYGON:
          this._deactivateMapTools(true, false, false, true);
          this._onMouseDownHandler_connect = dc(map, esri.isTouchEnabled ? "onTouchStart" : "onMouseDown", this._onMouseDownHandler);
          this._onMouseDragHandler_connect = dc(map, esri.isTouchEnabled ? "onTouchMove" : "onMouseDrag", this._onMouseDragHandler);
          this._onMouseUpHandler_connect = dc(map, esri.isTouchEnabled ? "onTouchEnd" : "onMouseUp", this._onMouseUpHandler);
          break;
          
        case Draw.POLYLINE:
        case Draw.POLYGON:
        case Draw.MULTI_POINT:
          map.__setClickDuration(0);
          this._onClickHandler_connect = dc(map, "onClick", this._onClickHandler);
          this._onDblClickHandler_connect = dc(map, "onDblClick", this._onDblClickHandler);
          map.disableDoubleClickZoom();
          break;
          
        default:
          console.error(esri.bundle.toolbars.draw.invalidType + ": " + geometryType);
          return;
      }

      this._onKeyDown_connect = dc(map, "onKeyDown", this._onKeyDownHandler);
      this._redrawConnect = dc(map, "onExtentChange", this._redrawGraphic);

      //this._deactivateMapTools(true, false, false, true);
      this._geometryType = geometryType;
      this._toggleTooltip(true);
      if (map.snappingManager && this._geometryType !== "freehandpolyline" && this._geometryType !== "freehandpolygon" && !esri.isTouchEnabled) {
        map.snappingManager._startSelectionLayerQuery();
        map.snappingManager._setUpSnapping();
      }
      this.onActivate(this._geometryType);
    },

    deactivate: function() {
      //summary: Deactivate draw tools
      var map = this.map;
      this._clear();

      var ddc = dojo.disconnect;
      ddc(this._onMouseDownHandler_connect);
      ddc(this._onMouseMoveHandler_connect);
      ddc(this._onMouseDragHandler_connect);
      ddc(this._onMouseUpHandler_connect);
      ddc(this._onClickHandler_connect);
      ddc(this._onDblClickHandler_connect);
      ddc(this._onKeyDown_connect);
      ddc(this._redrawConnect);
	  if (map.snappingManager) {
        map.snappingManager._stopSelectionLayerQuery();
	    map.snappingManager._killOffSnapping();
      }
      
      switch (this._geometryType) {       
        case esri.toolbars.Draw.LINE:
        case esri.toolbars.Draw.EXTENT:
        case esri.toolbars.Draw.FREEHAND_POLYLINE:
        case esri.toolbars.Draw.FREEHAND_POLYGON:                    
          this._activateMapTools(true, false, false, true);
          break;
          
        case esri.toolbars.Draw.POLYLINE:
        case esri.toolbars.Draw.POLYGON:
        case esri.toolbars.Draw.MULTI_POINT:
          map.enableDoubleClickZoom();
          break;
      }
                            
      var geometryType = this._geometryType;
      this._geometryType = null;
            
      map.__resetClickDuration();
      this._toggleTooltip(false);
      this.onDeactivate(geometryType);      
    },
    
    _clear: function() {
      if (this._graphic) {
        this.map.graphics.remove(this._graphic, true);
      }

      if (this._tGraphic) {
        this.map.graphics.remove(this._tGraphic, true);
      }
      
      this._graphic = this._tGraphic = null;
      if (this.map.snappingManager) {
        this.map.snappingManager._setGraphic(null);
      }
      this._points = [];
    },
    
    finishDrawing : function() {
      var geometry,
          _pts = this._points,
          map = this.map,
          spatialReference = map.spatialReference,
          Draw = esri.toolbars.Draw;
      
      _pts = _pts.slice(0, _pts.length);            
      switch (this._geometryType) {
        case Draw.POLYLINE:
          if (! this._graphic || _pts.length < 2) {            
            return;
          }

          geometry = new esri.geometry.Polyline(spatialReference);
          geometry.addPath([].concat(_pts));
          break;
        case Draw.POLYGON:
          if (! this._graphic || _pts.length < 3) {            
            return;
          }

          geometry = new esri.geometry.Polygon(spatialReference);
          var ring = [].concat(_pts, [_pts[0].offset(0, 0)]); //this._points, [evt.mapPoint.offset(0, 0), this._points[0].offset(0, 0)]);

          if (! esri.geometry.isClockwise(ring) && ! this.respectDrawingVertexOrder) {
            console.debug(this.declaredClass + " : " + esri.bundle.toolbars.draw.convertAntiClockwisePolygon);
            ring.reverse();
          }          
          geometry.addRing(ring);
          break;
        case Draw.MULTI_POINT:
          geometry = new esri.geometry.Multipoint(spatialReference);
          dojo.forEach(_pts, function(pt) {
            geometry.addPoint(pt);
          });                  
          break;                  
      }

      dojo.disconnect(this._onMouseMoveHandler_connect);
      this._clear();
      this._setTooltipMessage(0);
      if (geometry) {
        this.onDrawEnd(geometry);
      }
    },

    _normalizeRect: function(start, end, spatialReference) {
      var sx = start.x,
          sy = start.y,
          ex = end.x,
          ey = end.y,
          width = Math.abs(sx - ex), // || 1;
          height = Math.abs(sy - ey); // || 1;
      return { x:Math.min(sx, ex), y:Math.max(sy, ey), width:width, height:height, spatialReference:spatialReference };
    },

    _onMouseDownHandler: function(evt) {
      this._dragged = false;
      var snappingPoint;
      if (this.map.snappingManager) {
        snappingPoint = this.map.snappingManager._snappingPoint;
      }
      var start = snappingPoint || evt.mapPoint,
          Draw = esri.toolbars.Draw,
          map = this.map,
          spatialReference = map.spatialReference;

      this._points.push(start.offset(0, 0));
      switch (this._geometryType) {
        case Draw.LINE:
          this._graphic = map.graphics.add(new esri.Graphic(new esri.geometry.Polyline({ paths:[[[start.x, start.y], [start.x, start.y]]] }), this.lineSymbol), true);
          if (map.snappingManager) {
            map.snappingManager._setGraphic(this._graphic);
          }
          break;
          
        case Draw.EXTENT:
          //this._graphic = map.graphics.add(new esri.Graphic(new esri.geometry.Rect(start.x, start.y, 0, 0, spatialReference), this.fillSymbol), true);
          break;
          
        case Draw.FREEHAND_POLYLINE:
          this._oldPoint = evt.screenPoint;
          var polyline = new esri.geometry.Polyline(spatialReference);
          polyline.addPath(this._points);
          this._graphic = map.graphics.add(new esri.Graphic(polyline, this.lineSymbol), true);
          if (map.snappingManager) {
            map.snappingManager._setGraphic(this._graphic);
          }
          break;
          
        case Draw.FREEHAND_POLYGON:
          this._oldPoint = evt.screenPoint;
          var polygon = new esri.geometry.Polygon(spatialReference);
          polygon.addRing(this._points);
          this._graphic = map.graphics.add(new esri.Graphic(polygon, this.fillSymbol), true);
          if (map.snappingManager) {
            map.snappingManager._setGraphic(this._graphic);
          }
          break;
      }
      
      if (esri.isTouchEnabled) {
        // This is essential to stop iOS from firing
        // synthesized(delayed) mouse events later. 
        // Why?
        // Typically users deactivate the toolbar onDrawEnd. But
        // delayed mouse events are synthesized and fired after
        // deactivate happens - at this point graphics layer events
        // are active and will capture over-down-up-click events. Now
        // if the app is wired to activate edit toolbar on map.graphics.click,
        // this will cause edit toolbars to appear right after the user has
        // finished drawing the geometry - this is not desirable.
        evt.preventDefault();

        // Alternative solution is for the apps to do this in onDrawEnd handler:
        //   setTimeout(function() { drawToolbar.deactivate(); }, 0);
        // This new JS context will be executed after the browser has finished
        // firing the delayed mouse events. Hence there is no chance for 
        // graphics layers to inadvertently catch these events and act on them.
      }
    },

    _onMouseMoveHandler: function(evt) {
      var snappingPoint;
      if (this.map.snappingManager) {
        snappingPoint = this.map.snappingManager._snappingPoint;
      }
      var start = this._points[this._points.length - 1],
          end = snappingPoint || evt.mapPoint,
          tGraphic = this._tGraphic, geom = tGraphic.geometry;

      switch (this._geometryType) {
        case esri.toolbars.Draw.POLYLINE:
        case esri.toolbars.Draw.POLYGON:
          //_tGraphic.setGeometry(dojo.mixin(_tGraphic.geometry, { paths:[[[start.x, start.y], [end.x, end.y]]] }));
          geom.setPoint(0, 0, { x: start.x, y: start.y });
          geom.setPoint(0, 1, { x: end.x, y: end.y });
          tGraphic.setGeometry(geom);
          break;
      }
    },

    _onMouseDragHandler: function(evt) {
      if (esri.isTouchEnabled && !this._points.length) {
        // BlackBerry Torch certainly needs this
        // to prevent page from panning
        evt.preventDefault();
        
        return;
      }
      
      this._dragged = true;
      var snappingPoint;
      if (this.map.snappingManager) {
        snappingPoint = this.map.snappingManager._snappingPoint;
      }
      var start = this._points[0],
          end = snappingPoint || evt.mapPoint,
          map = this.map,
          spatialReference = map.spatialReference,
          _graphic = this._graphic,
          Draw = esri.toolbars.Draw;
                     
      switch (this._geometryType) {
        case Draw.LINE:
          _graphic.setGeometry(dojo.mixin(_graphic.geometry, { paths:[[[start.x, start.y], [end.x, end.y]]] }));
          break;
        case Draw.EXTENT:
          if (_graphic) {
            map.graphics.remove(_graphic, true);
          }
          var rect = new esri.geometry.Rect(this._normalizeRect(start, end, spatialReference));
          // TODO
          // We can remove this once graphics layer is able to duplicate
          // rects/extens when wrapping (we may have to render them as polygons).
          rect._originOnly = true;
          this._graphic = map.graphics.add(new esri.Graphic(rect, this.fillSymbol), true);
          if (map.snappingManager) {
            map.snappingManager._setGraphic(this._graphic);
          }
          // _graphic.setGeometry(dojo.mixin(_graphic.geometry, this._normalizeRect(start, end, spatialReference)));
          break;
        case Draw.FREEHAND_POLYLINE:
          this._hideTooltip();
          if (this._canDrawFreehandPoint(evt) === false){
              if (esri.isTouchEnabled) {
                // BlackBerry Torch certainly needs this
                // to prevent page from panning
                evt.preventDefault();
              }
              return;
          }
                    
          this._points.push(evt.mapPoint.offset(0, 0));
          _graphic.geometry._insertPoints([end.offset(0, 0)], 0);
          _graphic.setGeometry(_graphic.geometry);
          break;
        case Draw.FREEHAND_POLYGON:
          this._hideTooltip();
          if (this._canDrawFreehandPoint(evt) === false){
              if (esri.isTouchEnabled) {
                // BlackBerry Torch certainly needs this
                // to prevent page from panning
                evt.preventDefault();
              }
              return;
          }
                        
          this._points.push(evt.mapPoint.offset(0, 0));
          _graphic.geometry._insertPoints([end.offset(0, 0)], 0);
          _graphic.setGeometry(_graphic.geometry);
          break;
      }
      
      if (esri.isTouchEnabled) {
        // Prevent iOS from panning the web page
        evt.preventDefault();
      }
    },
           
    _canDrawFreehandPoint : function(evt) {
        if (!this._oldPoint){
            return false;
        }
            
        var dx = this._oldPoint.x - evt.screenPoint.x;
        dx = (dx < 0) ? dx * -1 : dx;
        
        var dy = this._oldPoint.y - evt.screenPoint.y;
        dy = (dy < 0) ? dy * -1 : dy;
        
        var tolerance = this._options.tolerance;
        if (dx < tolerance && dy < tolerance){
            return false;
        }
        
        var now = new Date();
        var timeDiff = now - this._startTime;
        if (timeDiff < this._options.drawTime){
            return false;
        }

        this._startTime = now;      
        this._oldPoint = evt.screenPoint;        
        return true;        
    },

    _onMouseUpHandler: function(evt) {
      if (!this._dragged) {
        // It is not going to be a valid geometry.
        // Clear state and return. Do not fire onDrawEnd.
        this._clear();
        return;
      }
      
      // IE seems to have a problem when double clicking on the map
      // when polyline/polygon/multipoint tool is active.
      if (this._points.length === 0) {
        this._points.push(evt.mapPoint.offset(0,0));
      }
      var snappingPoint;
      if (this.map.snappingManager) {
        snappingPoint = this.map.snappingManager._snappingPoint;
      }
      var start = this._points[0],
          end = snappingPoint || evt.mapPoint,
          map = this.map,
          spatialReference = map.spatialReference,
          Draw = esri.toolbars.Draw,
          geometry;
          
      switch (this._geometryType) {
        case Draw.LINE:
          geometry = new esri.geometry.Polyline({ paths:[[[start.x, start.y], [end.x, end.y]]], spatialReference:spatialReference });
          break;
          
        case Draw.EXTENT:
          geometry = esri.geometry._rectToExtent(new esri.geometry.Rect(this._normalizeRect(start, end, spatialReference)));
          break;
          
        case Draw.FREEHAND_POLYLINE:
          geometry = new esri.geometry.Polyline(spatialReference);
          geometry.addPath([].concat(this._points, [end.offset(0, 0)]));
          break;
          
        case Draw.FREEHAND_POLYGON:
          geometry = new esri.geometry.Polygon(spatialReference);
          var ring = [].concat(this._points, [end.offset(0, 0), this._points[0].offset(0, 0)]);

          if (! esri.geometry.isClockwise(ring) && ! this.respectDrawingVertexOrder) {
            console.debug(this.declaredClass + " : " + esri.bundle.toolbars.draw.convertAntiClockwisePolygon);
            ring.reverse();
          }

          geometry.addRing(ring);
          break;
      }
      
      if (esri.isTouchEnabled) {
        evt.preventDefault();
      }
     
      this._clear();
      this.onDrawEnd(geometry);
    },

    _onClickHandler: function(evt) {
      var snappingPoint;
      if (this.map.snappingManager) {
        snappingPoint = this.map.snappingManager._snappingPoint;
      }
      var start = snappingPoint || evt.mapPoint,
          map = this.map,
          screenPoint = map.toScreen(start),
          Draw = esri.toolbars.Draw,
          pts, dx, dy, numPts, i, tGraphic, geom;

      this._points.push(start.offset(0, 0));
      switch (this._geometryType) {
        case Draw.POINT:          
          this.onDrawEnd(start.offset(0, 0));
          this._setTooltipMessage(0);          
          break;
        case Draw.POLYLINE:
          if (this._points.length === 1) {
            var polyline = new esri.geometry.Polyline(map.spatialReference);
            polyline.addPath(this._points);
            this._graphic = map.graphics.add(new esri.Graphic(polyline, this.lineSymbol), true);
            if (map.snappingManager) {
              map.snappingManager._setGraphic(this._graphic);
            }
            this._onMouseMoveHandler_connect = dojo.connect(map, "onMouseMove", this._onMouseMoveHandler);

            this._tGraphic = map.graphics.add(new esri.Graphic(new esri.geometry.Polyline({ paths: [[[start.x, start.y], [start.x, start.y]]] }), this.lineSymbol), true);
          }
          else {
            this._graphic.geometry._insertPoints([start.offset(0, 0)], 0);
//            map.graphics.remove(this._tGraphic, true);
            this._graphic.setGeometry(this._graphic.geometry).setSymbol(this.lineSymbol);

            tGraphic = this._tGraphic;
            geom = tGraphic.geometry;
            //geom._insertPoints([start.offset(0, 0), start.offset(0, 0)], 0);
            geom.setPoint(0, 0, start.offset(0, 0));
            geom.setPoint(0, 1, start.offset(0, 0));
            tGraphic.setGeometry(geom);
          }
          break;
        case Draw.POLYGON:
          if (this._points.length === 1) {
            var polygon = new esri.geometry.Polygon(map.spatialReference);
            polygon.addRing(this._points);
            this._graphic = map.graphics.add(new esri.Graphic(polygon, this.fillSymbol), true);
            if (map.snappingManager) {
              map.snappingManager._setGraphic(this._graphic);
            }
            this._onMouseMoveHandler_connect = dojo.connect(map, "onMouseMove", this._onMouseMoveHandler);

            /*
             * IE gets confused when we delete and create this polyline every
             * time a point is added. Deleting and inserting a node
             * on which click happened clobbers double-click event.
             * Note - click/double-click to add a point sometimes falls
             * on this polyline which is the root of the problem in IE.  
             * POLYLINE tool above has the same problem
             */
            this._tGraphic = map.graphics.add(new esri.Graphic(new esri.geometry.Polyline({ paths: [[[start.x, start.y], [start.x, start.y]]] }), this.fillSymbol), true);
          }
          else {
            this._graphic.geometry._insertPoints([start.offset(0, 0)], 0);
//            map.graphics.remove(this._tGraphic, true);
            this._graphic.setGeometry(this._graphic.geometry).setSymbol(this.fillSymbol);

            tGraphic = this._tGraphic;
            geom = tGraphic.geometry;
            //geom._insertPoints([start.offset(0, 0), start.offset(0, 0)], 0);
            geom.setPoint(0, 0, start.offset(0, 0));
            geom.setPoint(0, 1, start.offset(0, 0));
            tGraphic.setGeometry(geom);
          }
          break;
        case Draw.MULTI_POINT:
          var tps = this._points;
          if (tps.length === 1) {
            var multiPoint = new esri.geometry.Multipoint(map.spatialReference);
            multiPoint.addPoint(tps[tps.length - 1]);
            this._graphic = map.graphics.add(new esri.Graphic(multiPoint, this.markerSymbol), true);
            if (map.snappingManager) {
              map.snappingManager._setGraphic(this._graphic);
            }
          }
          else {
            this._graphic.geometry.addPoint(tps[tps.length - 1]);
            this._graphic.setGeometry(this._graphic.geometry).setSymbol(this.markerSymbol);
          }
          break;
          
        case Draw.ARROW:
           pts = [[96,24],[72,52],[72,40],[0,40],[0,12],[72,12],[72,0],[96,24]];
           dx = screenPoint.x - 36;
           dy = screenPoint.y - 24;
           this._addShape(pts, dx, dy);
           break;

        case Draw.LEFT_ARROW:
           pts = [[0,24],[24,52],[24,40],[96,40],[96,12],[24,12],[24,0],[0,24]];
           dx = screenPoint.x - 60;
           dy = screenPoint.y - 24;
           this._addShape(pts, dx, dy);
           break;

        case Draw.RIGHT_ARROW:
           pts = [[96,24],[72,52],[72,40],[0,40],[0,12],[72,12],[72,0],[96,24]];
           dx = screenPoint.x - 36;
           dy = screenPoint.y - 24;
           this._addShape(pts, dx, dy);
           break;

        case Draw.UP_ARROW:
           pts = [[24,0],[52,24],[40,24],[40,96],[12,96],[12,24],[0,24],[24,0]];
           dx = screenPoint.x - 24;
           dy = screenPoint.y - 60;
           this._addShape(pts, dx, dy);
           break;

        case Draw.DOWN_ARROW:
           pts = [[24,96],[52,72],[40,72],[40,0],[12,0],[12,72],[0,72],[24,96]];
           dx = screenPoint.x - 24;
           dy = screenPoint.y - 36;
           this._addShape(pts, dx, dy);
           break;
           
        case Draw.TRIANGLE:
           pts = [[0,96],[48,0],[96,96],[0,96]];
           dx = screenPoint.x - 48; 
           dy = screenPoint.y - 48;
           this._addShape(pts, dx, dy); 
           break;
        
        case Draw.RECTANGLE:
           pts = [[0,-96],[96,-96],[96,0],[0,0], [0,-96]];
           dx = screenPoint.x - 48; 
           dy = screenPoint.y + 48;
           this._addShape(pts, dx, dy); 
           break;
           
        case Draw.CIRCLE: 
           numPts = 360;
           var angle = (2 * Math.PI) / numPts;
           pts = [];
           for (i = 0; i < numPts; i++) { 
               pts.push([48 * Math.cos(angle * i), 48 * Math.sin(angle * i)]);
           }
           pts.push(pts[0]);
           this._addShape(pts, screenPoint.x, screenPoint.y);
           break;
           
        case Draw.ELLIPSE:
           var rad = Math.PI / 180;
           var beta = -rad; 
           var sinbeta = Math.sin(beta);
           var cosbeta = Math.cos(beta);
           numPts = 360;
           pts = []; 
           for (i = 0; i < numPts; i++) 
           {
               var alpha = i * (rad) ;
               var sinalpha = Math.sin(alpha);
               var cosalpha = Math.cos(alpha);
 
               var x = (48 * cosalpha * cosbeta - 24 * sinalpha * sinbeta);
               var y = (48 * cosalpha * sinbeta + 24 * sinalpha * cosbeta);
 
               pts.push([x, y]);
           }
           pts.push(pts[0]);  
           this._addShape(pts, screenPoint.x, screenPoint.y);
           break;
      }
      
      this._setTooltipMessage(this._points.length);
    },
    
    _addShape : function(path, dx, dy){
       var graphic = this.map.graphics.add(new esri.Graphic(this._toPolygon(path, dx, dy), this.fillSymbol), true);
       this._setTooltipMessage(0);
       var geom;
       if (graphic) {
         geom = esri.geometry.fromJson(graphic.geometry.toJson());
         this.map.graphics.remove(graphic, true);
       }
       this.onDrawEnd(geom);
       graphic = geom = null;
    },
    
    _toPolygon : function(path, dx, dy){
        var map = this.map;
        var polygon = new esri.geometry.Polygon(map.spatialReference);
        polygon.addRing(dojo.map(path, function(pt) { return map.toMap( {x:pt[0] + dx, y:pt[1] + dy}); }));        
        return polygon;
    },

    _onDblClickHandler: function(evt) {
      var geometry,
          _pts = this._points,
          map = this.map,
          spatialReference = map.spatialReference,
          Draw = esri.toolbars.Draw;
      
      if (esri.isTouchEnabled) {
        _pts.push(evt.mapPoint);
      }    
          
      _pts = _pts.slice(0, _pts.length); // - (1 + (dojo.isIE ? 0: 1)));            
      switch (this._geometryType) {
        case Draw.POLYLINE:
          if (! this._graphic || _pts.length < 2) {
            dojo.disconnect(this._onMouseMoveHandler_connect);
            this._clear();
            this._onClickHandler(evt);
            return;
          }

          geometry = new esri.geometry.Polyline(spatialReference);
          geometry.addPath([].concat(_pts)); //this._points, [evt.mapPoint.offset(0, 0)]));
          break;
        case Draw.POLYGON:
          if (! this._graphic || _pts.length < 2) { //this._points.length < 2) {
            dojo.disconnect(this._onMouseMoveHandler_connect);
            this._clear();
            this._onClickHandler(evt);
            return;
          }

          geometry = new esri.geometry.Polygon(spatialReference);
          var ring = [].concat(_pts, [_pts[0].offset(0, 0)]); //this._points, [evt.mapPoint.offset(0, 0), this._points[0].offset(0, 0)]);

          if (! esri.geometry.isClockwise(ring) && ! this.respectDrawingVertexOrder) {
            console.debug(this.declaredClass + " : " + esri.bundle.toolbars.draw.convertAntiClockwisePolygon);
            ring.reverse();
          }
          
          geometry.addRing(ring);
          break;
        case Draw.MULTI_POINT:
          geometry = new esri.geometry.Multipoint(spatialReference);
          dojo.forEach(_pts, function(pt) {
            geometry.addPoint(pt);
          });
        
          // if (this._graphic) {
          //   var geom = this._graphic.geometry;
          //   // geom.addPoint(evt.mapPoint.offset(0, 0));
          //   // geometry = new esri.geometry.Multipoint({ points:[].concat([], geom.points.slice(0, geom.points.length - 1)), spatialReference: spatialReference });
          // }
          // else {
          //   geometry = new esri.geometry.Multipoint(spatialReference);
          //   geometry.addPoint(evt.mapPoint.offset(0, 0));
          // }
          break;
      }

      dojo.disconnect(this._onMouseMoveHandler_connect);
      this._clear();
      this._setTooltipMessage(0);
      this.onDrawEnd(geometry);
    },
    
    _onKeyDownHandler : function(evt) {
      if (evt.keyCode === dojo.keys.ESCAPE) {
        dojo.disconnect(this._onMouseMoveHandler_connect);
        this._clear();
        this._setTooltipMessage(0);     
      }
    },
               
    _toggleTooltip: function(show) {
      if (!this._options.showTooltips){
          return;
      }
      
      if (show) { // enable if not already enabled
        if (this._tooltip) {
          return;
        }
      
        var domNode = this.map.container;
        this._tooltip = dojo.create("div", { "class": "tooltip" }, domNode);
        this._tooltip.style.display = "none";
        this._tooltip.style.position = "fixed";
        
        this._setTooltipMessage(0);
             
        this._onTooltipMouseEnterHandler_connect = dojo.connect(this.map, "onMouseOver", this._updateTooltip);
        this._onTooltipMouseLeaveHandler_connect = dojo.connect(this.map, "onMouseOut",  this._hideTooltip);
        this._onTooltipMouseMoveHandler_connect = dojo.connect(this.map, "onMouseMove",  this._updateTooltip);
      }
      else { // disable
        if (this._tooltip) {
          dojo.disconnect(this._onTooltipMouseEnterHandler_connect);
          dojo.disconnect(this._onTooltipMouseLeaveHandler_connect);
          dojo.disconnect(this._onTooltipMouseMoveHandler_connect);
          dojo.destroy(this._tooltip);
          this._tooltip = null;
        }
      }
    },
    
    _hideTooltip : function() {
      var tooltip = this._tooltip;
      if (!tooltip){
          return;
      }
                
      tooltip.style.display = "none";
    },
    
    _setTooltipMessage : function(numPoints) {
     var tooltip = this._tooltip;
        if (!tooltip){
            return;
        }
         
     var points = numPoints;
     var message = "";
     switch (this._geometryType) {       
        case esri.toolbars.Draw.POINT:                      
          message = esri.bundle.toolbars.draw.addPoint;                            
          break;
        case esri.toolbars.Draw.ARROW:
        case esri.toolbars.Draw.LEFT_ARROW:
        case esri.toolbars.Draw.RIGHT_ARROW:
        case esri.toolbars.Draw.UP_ARROW:
        case esri.toolbars.Draw.DOWN_ARROW:
        case esri.toolbars.Draw.TRIANGLE:
        case esri.toolbars.Draw.RECTANGLE:
        case esri.toolbars.Draw.CIRCLE:
        case esri.toolbars.Draw.ELLIPSE:
          message = esri.bundle.toolbars.draw.addShape;
          break;        
        case esri.toolbars.Draw.LINE:
        case esri.toolbars.Draw.EXTENT:
        case esri.toolbars.Draw.FREEHAND_POLYLINE:
        case esri.toolbars.Draw.FREEHAND_POLYGON: 
          message = esri.bundle.toolbars.draw.freehand; 
          break;
        case esri.toolbars.Draw.POLYLINE:
        case esri.toolbars.Draw.POLYGON:
           message = esri.bundle.toolbars.draw.start;
           if (points === 1){
             message = esri.bundle.toolbars.draw.resume;
           } else if (points >= 2) {
             message = esri.bundle.toolbars.draw.complete;
           }
           break;        
        case esri.toolbars.Draw.MULTI_POINT:           
            message = esri.bundle.toolbars.draw.addMultipoint;
            if (points >= 1) {
                message = esri.bundle.toolbars.draw.finish;
              }
            break;                  
      }       
     
      tooltip.innerHTML = message;                     
    },
    
    _updateTooltip : function(evt) {
        var tooltip = this._tooltip;
        if (!tooltip){
            return;
        }
                                
        var px, py;        
        if (evt.clientX || evt.pageY) {
            px = evt.clientX;
            py = evt.clientY;
        } else {
            px = evt.clientX + dojo.body().scrollLeft - dojo.body().clientLeft;
            py = evt.clientY + dojo.body().scrollTop - dojo.body().clientTop;
        }
                       
        tooltip.style.display = "none";
        dojo.style(tooltip, { left: (px + this._options.tooltipOffset) + "px", top: (py) + "px" });
        tooltip.style.display = "";            
    },

    _redrawGraphic: function(extent, delta, levelChange, lod) {
      if (levelChange || this.map.wrapAround180) {
        var g = this._graphic;
        if (g) {
          g.setGeometry(g.geometry);
        }
        
        g = this._tGraphic;
        if (g) {
          g.setGeometry(g.geometry);
        }
      }
    },
    
   /*********
   * Events
   *********/

    onActivate: function() {
      // Arguments:
      //  <String> geometryType
    },
    
    onDeactivate: function() {
      // Arguments:
      //  <String> geometryType
    },
    
    onDrawEnd: function() {
      //summary: Event fired when a new geometry drawing is complete.
      //         arguments[0]: esri.geometry.Point: If geometryType == esri.toolbar.Draw.POINT
      //         arguments[0]: esri.geometry.Rect: If geometryType == esri.toolbar.Draw.RECT
      //         arguments[0]: esri.geometry.Extent: If geometryType == esri.toolbar.Draw.EXTENT
      //         arguments[0]: esri.geometry.Polyline: If geometryType == esri.toolbar.Draw.POLYLINE
      //         arguments[0]: esri.geometry.Polyline: If geometryType == esri.toolbar.Draw.FREEHAND_POLYLINE
      //         arguments[0]: esri.geometry.Polygon: If geometryType == esri.toolbar.Draw.POLYGON
      //         arguments[0]: esri.geometry.Polygon: If geometryType == esri.toolbar.Draw.FREEHAND_POLYGON
      //         arguments[0]: esri.geometry.Line: If geometryType == esri.toolbar.Draw.LINE
      //         arguments[0]: esri.geometry.Circle: If geometryType == esri.toolbar.Draw.CIRCLE
      //         arguments[0]: esri.geometry.Ellipse: If geometryType == esri.toolbar.Draw.ELLIPSE
    }
  }
);

dojo.mixin(esri.toolbars.Draw, {
  POINT: "point", 
  MULTI_POINT: "multipoint", 
  LINE: "line", 
  EXTENT: "extent", 
  POLYLINE: "polyline", 
  POLYGON:"polygon",
  FREEHAND_POLYLINE:"freehandpolyline", 
  FREEHAND_POLYGON:"freehandpolygon", 
  ARROW:"arrow", 
  LEFT_ARROW:"leftarrow", 
  RIGHT_ARROW:"rightarrow", 
  UP_ARROW:"uparrow", 
  DOWN_ARROW:"downarrow", 
  TRIANGLE:"triangle", 
  CIRCLE:"circle", 
  ELLIPSE:"ellipse", 
  RECTANGLE:"rectangle"
});
});

},
'dojox/grid/cells':function(){
define("dojox/grid/cells", ["../main", "./cells/_base"], function(dojox){
	return dojox.grid.cells;
});
},
'dojox/grid/_Layout':function(){
define("dojox/grid/_Layout", [
	"dojo/_base/kernel",
	"../main",
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/dom-geometry",
	"./cells",
	"./_RowSelector"
], function(dojo, dojox, declare, array, lang, domGeometry){

return declare("dojox.grid._Layout", null, {
	// summary:
	//	Controls grid cell layout. Owned by grid and used internally.
	constructor: function(inGrid){
		this.grid = inGrid;
	},
	// flat array of grid cells
	cells: [],
	// structured array of grid cells
	structure: null,
	// default cell width
	defaultWidth: '6em',

	// methods
	moveColumn: function(sourceViewIndex, destViewIndex, cellIndex, targetIndex, before){
		var source_cells = this.structure[sourceViewIndex].cells[0];
		var dest_cells = this.structure[destViewIndex].cells[0];

		var cell = null;
		var cell_ri = 0;
		var target_ri = 0;

		for(var i=0, c; c=source_cells[i]; i++){
			if(c.index == cellIndex){
				cell_ri = i;
				break;
			}
		}
		cell = source_cells.splice(cell_ri, 1)[0];
		cell.view = this.grid.views.views[destViewIndex];

		for(i=0, c=null; c=dest_cells[i]; i++){
			if(c.index == targetIndex){
				target_ri = i;
				break;
			}
		}
		if(!before){
			target_ri += 1;
		}
		dest_cells.splice(target_ri, 0, cell);

		var sortedCell = this.grid.getCell(this.grid.getSortIndex());
		if(sortedCell){
			sortedCell._currentlySorted = this.grid.getSortAsc();
		}

		this.cells = [];
		cellIndex = 0;
		var v;
		for(i=0; v=this.structure[i]; i++){
			for(var j=0, cs; cs=v.cells[j]; j++){
				for(var k=0; c=cs[k]; k++){
					c.index = cellIndex;
					this.cells.push(c);
					if("_currentlySorted" in c){
						var si = cellIndex + 1;
						si *= c._currentlySorted ? 1 : -1;
						this.grid.sortInfo = si;
						delete c._currentlySorted;
					}
					cellIndex++;
				}
			}
		}
		
		//Fix #9481 - reset idx in cell markup
		array.forEach(this.cells, function(c){
			var marks = c.markup[2].split(" ");
			var oldIdx = parseInt(marks[1].substring(5));//get old "idx"
			if(oldIdx != c.index){
				marks[1] = "idx=\"" + c.index + "\"";
				c.markup[2] = marks.join(" ");
			}
		});
		
		this.grid.setupHeaderMenu();
		//this.grid.renderOnIdle();
	},

	setColumnVisibility: function(columnIndex, visible){
		var cell = this.cells[columnIndex];
		if(cell.hidden == visible){
			cell.hidden = !visible;
			var v = cell.view, w = v.viewWidth;
			if(w && w != "auto"){
				v._togglingColumn = domGeometry.getMarginBox(cell.getHeaderNode()).w || 0;
			}
			v.update();
			return true;
		}else{
			return false;
		}
	},
	
	addCellDef: function(inRowIndex, inCellIndex, inDef){
		var self = this;
		var getCellWidth = function(inDef){
			var w = 0;
			if(inDef.colSpan > 1){
				w = 0;
			}else{
				w = inDef.width || self._defaultCellProps.width || self.defaultWidth;

				if(!isNaN(w)){
					w = w + "em";
				}
			}
			return w;
		};

		var props = {
			grid: this.grid,
			subrow: inRowIndex,
			layoutIndex: inCellIndex,
			index: this.cells.length
		};

		if(inDef && inDef instanceof dojox.grid.cells._Base){
			var new_cell = lang.clone(inDef);
			props.unitWidth = getCellWidth(new_cell._props);
			new_cell = lang.mixin(new_cell, this._defaultCellProps, inDef._props, props);
			return new_cell;
		}

		var cell_type = inDef.type || inDef.cellType || this._defaultCellProps.type || this._defaultCellProps.cellType || dojox.grid.cells.Cell;
		if(lang.isString(cell_type)){
			cell_type = lang.getObject(cell_type);
		}

		props.unitWidth = getCellWidth(inDef);
		return new cell_type(lang.mixin({}, this._defaultCellProps, inDef, props));
	},
	
	addRowDef: function(inRowIndex, inDef){
		var result = [];
		var relSum = 0, pctSum = 0, doRel = true;
		for(var i=0, def, cell; (def=inDef[i]); i++){
			cell = this.addCellDef(inRowIndex, i, def);
			result.push(cell);
			this.cells.push(cell);
			// Check and calculate the sum of all relative widths
			if(doRel && cell.relWidth){
				relSum += cell.relWidth;
			}else if(cell.width){
				var w = cell.width;
				if(typeof w == "string" && w.slice(-1) == "%"){
					pctSum += window.parseInt(w, 10);
				}else if(w == "auto"){
					// relative widths doesn't play nice with auto - since we
					// don't have a way of knowing how much space the auto is
					// supposed to take up.
					doRel = false;
				}
			}
		}
		if(relSum && doRel){
			// We have some kind of relWidths specified - so change them to %
			array.forEach(result, function(cell){
				if(cell.relWidth){
					cell.width = cell.unitWidth = ((cell.relWidth / relSum) * (100 - pctSum)) + "%";
				}
			});
		}
		return result;
	
	},

	addRowsDef: function(inDef){
		var result = [];
		if(lang.isArray(inDef)){
			if(lang.isArray(inDef[0])){
				for(var i=0, row; inDef && (row=inDef[i]); i++){
					result.push(this.addRowDef(i, row));
				}
			}else{
				result.push(this.addRowDef(0, inDef));
			}
		}
		return result;
	},
	
	addViewDef: function(inDef){
		this._defaultCellProps = inDef.defaultCell || {};
		if(inDef.width && inDef.width == "auto"){
			delete inDef.width;
		}
		return lang.mixin({}, inDef, {cells: this.addRowsDef(inDef.rows || inDef.cells)});
	},
	
	setStructure: function(inStructure){
		this.fieldIndex = 0;
		this.cells = [];
		var s = this.structure = [];

		if(this.grid.rowSelector){
			var sel = { type: dojox._scopeName + ".grid._RowSelector" };

			if(lang.isString(this.grid.rowSelector)){
				var width = this.grid.rowSelector;

				if(width == "false"){
					sel = null;
				}else if(width != "true"){
					sel['width'] = width;
				}
			}else{
				if(!this.grid.rowSelector){
					sel = null;
				}
			}

			if(sel){
				s.push(this.addViewDef(sel));
			}
		}

		var isCell = function(def){
			return ("name" in def || "field" in def || "get" in def);
		};

		var isRowDef = function(def){
			if(lang.isArray(def)){
				if(lang.isArray(def[0]) || isCell(def[0])){
					return true;
				}
			}
			return false;
		};

		var isView = function(def){
			return (def !== null && lang.isObject(def) &&
					("cells" in def || "rows" in def || ("type" in def && !isCell(def))));
		};

		if(lang.isArray(inStructure)){
			var hasViews = false;
			for(var i=0, st; (st=inStructure[i]); i++){
				if(isView(st)){
					hasViews = true;
					break;
				}
			}
			if(!hasViews){
				s.push(this.addViewDef({ cells: inStructure }));
			}else{
				for(i=0; (st=inStructure[i]); i++){
					if(isRowDef(st)){
						s.push(this.addViewDef({ cells: st }));
					}else if(isView(st)){
						s.push(this.addViewDef(st));
					}
				}
			}
		}else if(isView(inStructure)){
			// it's a view object
			s.push(this.addViewDef(inStructure));
		}

		this.cellCount = this.cells.length;
		this.grid.setupHeaderMenu();
	}
});
});
},
'dijit/nls/loading':function(){
define("dijit/nls/loading", { root:
//begin v1.x content
({
	loadingState: "Loading...",
	errorState: "Sorry, an error occurred"
})
//end v1.x content
,
"zh": true,
"zh-tw": true,
"tr": true,
"th": true,
"sv": true,
"sl": true,
"sk": true,
"ru": true,
"ro": true,
"pt": true,
"pt-pt": true,
"pl": true,
"nl": true,
"nb": true,
"ko": true,
"kk": true,
"ja": true,
"it": true,
"hu": true,
"hr": true,
"he": true,
"fr": true,
"fi": true,
"es": true,
"el": true,
"de": true,
"da": true,
"cs": true,
"ca": true,
"az": true,
"ar": true
});

},
'dojo/dnd/Moveable':function(){
define(["../main", "../Evented", "../touch", "./Mover"], function(dojo, Evented, touch) {
	// module:
	//		dojo/dnd/Moveable
	// summary:
	//		TODOC


/*=====
dojo.declare("dojo.dnd.__MoveableArgs", [], {
	// handle: Node||String
	//		A node (or node's id), which is used as a mouse handle.
	//		If omitted, the node itself is used as a handle.
	handle: null,

	// delay: Number
	//		delay move by this number of pixels
	delay: 0,

	// skip: Boolean
	//		skip move of form elements
	skip: false,

	// mover: Object
	//		a constructor of custom Mover
	mover: dojo.dnd.Mover
});
=====*/

dojo.declare("dojo.dnd.Moveable", [Evented], {
	// object attributes (for markup)
	handle: "",
	delay: 0,
	skip: false,

	constructor: function(node, params){
		// summary:
		//		an object, which makes a node moveable
		// node: Node
		//		a node (or node's id) to be moved
		// params: dojo.dnd.__MoveableArgs?
		//		optional parameters
		this.node = dojo.byId(node);
		if(!params){ params = {}; }
		this.handle = params.handle ? dojo.byId(params.handle) : null;
		if(!this.handle){ this.handle = this.node; }
		this.delay = params.delay > 0 ? params.delay : 0;
		this.skip  = params.skip;
		this.mover = params.mover ? params.mover : dojo.dnd.Mover;
		this.events = [
			dojo.connect(this.handle, touch.press, this, "onMouseDown"),
			// cancel text selection and text dragging
			dojo.connect(this.handle, "ondragstart",   this, "onSelectStart"),
			dojo.connect(this.handle, "onselectstart", this, "onSelectStart")
		];
	},

	// markup methods
	markupFactory: function(params, node, ctor){
		return new ctor(node, params);
	},

	// methods
	destroy: function(){
		// summary:
		//		stops watching for possible move, deletes all references, so the object can be garbage-collected
		dojo.forEach(this.events, dojo.disconnect);
		this.events = this.node = this.handle = null;
	},

	// mouse event processors
	onMouseDown: function(e){
		// summary:
		//		event processor for onmousedown/ontouchstart, creates a Mover for the node
		// e: Event
		//		mouse/touch event
		if(this.skip && dojo.dnd.isFormElement(e)){ return; }
		if(this.delay){
			this.events.push(
				dojo.connect(this.handle, touch.move, this, "onMouseMove"),
				dojo.connect(this.handle, touch.release, this, "onMouseUp")
			);
			this._lastX = e.pageX;
			this._lastY = e.pageY;
		}else{
			this.onDragDetected(e);
		}
		dojo.stopEvent(e);
	},
	onMouseMove: function(e){
		// summary:
		//		event processor for onmousemove/ontouchmove, used only for delayed drags
		// e: Event
		//		mouse/touch event
		if(Math.abs(e.pageX - this._lastX) > this.delay || Math.abs(e.pageY - this._lastY) > this.delay){
			this.onMouseUp(e);
			this.onDragDetected(e);
		}
		dojo.stopEvent(e);
	},
	onMouseUp: function(e){
		// summary:
		//		event processor for onmouseup, used only for delayed drags
		// e: Event
		//		mouse event
		for(var i = 0; i < 2; ++i){
			dojo.disconnect(this.events.pop());
		}
		dojo.stopEvent(e);
	},
	onSelectStart: function(e){
		// summary:
		//		event processor for onselectevent and ondragevent
		// e: Event
		//		mouse event
		if(!this.skip || !dojo.dnd.isFormElement(e)){
			dojo.stopEvent(e);
		}
	},

	// local events
	onDragDetected: function(/* Event */ e){
		// summary:
		//		called when the drag is detected;
		//		responsible for creation of the mover
		new this.mover(this.node, e, this);
	},
	onMoveStart: function(/* dojo.dnd.Mover */ mover){
		// summary:
		//		called before every move operation
		dojo.publish("/dnd/move/start", [mover]);
		dojo.addClass(dojo.body(), "dojoMove");
		dojo.addClass(this.node, "dojoMoveItem");
	},
	onMoveStop: function(/* dojo.dnd.Mover */ mover){
		// summary:
		//		called after every move operation
		dojo.publish("/dnd/move/stop", [mover]);
		dojo.removeClass(dojo.body(), "dojoMove");
		dojo.removeClass(this.node, "dojoMoveItem");
	},
	onFirstMove: function(/* dojo.dnd.Mover */ mover, /* Event */ e){
		// summary:
		//		called during the very first move notification;
		//		can be used to initialize coordinates, can be overwritten.

		// default implementation does nothing
	},
	onMove: function(/* dojo.dnd.Mover */ mover, /* Object */ leftTop, /* Event */ e){
		// summary:
		//		called during every move notification;
		//		should actually move the node; can be overwritten.
		this.onMoving(mover, leftTop);
		var s = mover.node.style;
		s.left = leftTop.l + "px";
		s.top  = leftTop.t + "px";
		this.onMoved(mover, leftTop);
	},
	onMoving: function(/* dojo.dnd.Mover */ mover, /* Object */ leftTop){
		// summary:
		//		called before every incremental move; can be overwritten.

		// default implementation does nothing
	},
	onMoved: function(/* dojo.dnd.Mover */ mover, /* Object */ leftTop){
		// summary:
		//		called after every incremental move; can be overwritten.

		// default implementation does nothing
	}
});

return dojo.dnd.Moveable;
});

},
'dojox/grid/_View':function(){
require({cache:{
'url:dojox/grid/resources/View.html':"<div class=\"dojoxGridView\" role=\"presentation\">\r\n\t<div class=\"dojoxGridHeader\" dojoAttachPoint=\"headerNode\" role=\"presentation\">\r\n\t\t<div dojoAttachPoint=\"headerNodeContainer\" style=\"width:9000em\" role=\"presentation\">\r\n\t\t\t<div dojoAttachPoint=\"headerContentNode\" role=\"row\"></div>\r\n\t\t</div>\r\n\t</div>\r\n\t<input type=\"checkbox\" class=\"dojoxGridHiddenFocus\" dojoAttachPoint=\"hiddenFocusNode\" role=\"presentation\" />\r\n\t<input type=\"checkbox\" class=\"dojoxGridHiddenFocus\" role=\"presentation\" />\r\n\t<div class=\"dojoxGridScrollbox\" dojoAttachPoint=\"scrollboxNode\" role=\"presentation\">\r\n\t\t<div class=\"dojoxGridContent\" dojoAttachPoint=\"contentNode\" hidefocus=\"hidefocus\" role=\"presentation\"></div>\r\n\t</div>\r\n</div>\r\n"}});
define("dojox/grid/_View", [
	"dojo",
	"dijit/registry",
	"../main",
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/_base/connect",
	"dojo/_base/sniff",
	"dojo/query",
	"dojo/_base/window",
	"dojo/text!./resources/View.html",
	"dojo/dnd/Source",
	"dijit/_Widget",
	"dijit/_TemplatedMixin",
	"dojox/html/metrics",
	"./util",
	"dojo/_base/html",
	"./_Builder",
	"dojo/dnd/Avatar",
	"dojo/dnd/Manager"
], function(dojo, dijit, dojox, declare, array, lang, connect, has, query,
	win, template, Source, _Widget, _TemplatedMixin, metrics, util, html, _Builder, Avatar){

	// a private function
	var getStyleText = function(inNode, inStyleText){
		return inNode.style.cssText == undefined ? inNode.getAttribute("style") : inNode.style.cssText;
	};

	// some public functions
	var _View = declare('dojox.grid._View', [_Widget, _TemplatedMixin], {
		// summary:
		//		A collection of grid columns. A grid is comprised of a set of views that stack horizontally.
		//		Grid creates views automatically based on grid's layout structure.
		//		Users should typically not need to access individual views directly.
		//
		// defaultWidth: String
		//		Default width of the view
		defaultWidth: "18em",

		// viewWidth: String
		// 		Width for the view, in valid css unit
		viewWidth: "",

		templateString: template,
		
		themeable: false,
		classTag: 'dojoxGrid',
		marginBottom: 0,
		rowPad: 2,

		// _togglingColumn: int
		//		Width of the column being toggled (-1 for none)
		_togglingColumn: -1,
		
		// _headerBuilderClass: Object
		//		The class to use for our header builder
		_headerBuilderClass: _Builder._HeaderBuilder,
		
		// _contentBuilderClass: Object
		//		The class to use for our content builder
		_contentBuilderClass: _Builder._ContentBuilder,
		
		postMixInProperties: function(){
			this.rowNodes = {};
		},

		postCreate: function(){
			this.connect(this.scrollboxNode,"onscroll","doscroll");
			util.funnelEvents(this.contentNode, this, "doContentEvent", [ 'mouseover', 'mouseout', 'click', 'dblclick', 'contextmenu', 'mousedown' ]);
			util.funnelEvents(this.headerNode, this, "doHeaderEvent", [ 'dblclick', 'mouseover', 'mouseout', 'mousemove', 'mousedown', 'click', 'contextmenu' ]);
			this.content = new this._contentBuilderClass(this);
			this.header = new this._headerBuilderClass(this);
			//BiDi: in RTL case, style width='9000em' causes scrolling problem in head node
			if(!this.grid.isLeftToRight()){
				this.headerNodeContainer.style.width = "";
			}
		},

		destroy: function(){
			html.destroy(this.headerNode);
			delete this.headerNode;
			for(var i in this.rowNodes){
				this._cleanupRowWidgets(this.rowNodes[i]);
				html.destroy(this.rowNodes[i]);
			}
			this.rowNodes = {};
			if(this.source){
				this.source.destroy();
			}
			this.inherited(arguments);
		},

		// focus
		focus: function(){
			if(has("ie") || has("webkit") || has("opera")){
				this.hiddenFocusNode.focus();
			}else{
				this.scrollboxNode.focus();
			}
		},

		setStructure: function(inStructure){
			var vs = (this.structure = inStructure);
			// FIXME: similar logic is duplicated in layout
			if(vs.width && !isNaN(vs.width)){
				this.viewWidth = vs.width + 'em';
			}else{
				this.viewWidth = vs.width || (vs.noscroll ? 'auto' : this.viewWidth); //|| this.defaultWidth;
			}
			this._onBeforeRow = vs.onBeforeRow||function(){};
			this._onAfterRow = vs.onAfterRow||function(){};
			this.noscroll = vs.noscroll;
			if(this.noscroll){
				this.scrollboxNode.style.overflow = "hidden";
			}
			this.simpleStructure = Boolean(vs.cells.length == 1);
			// bookkeeping
			this.testFlexCells();
			// accomodate new structure
			this.updateStructure();
		},
		
		_cleanupRowWidgets: function(inRowNode){
			// Summary:
			//		Cleans up the widgets for the given row node so that
			//		we can reattach them if needed
			if(inRowNode){
				array.forEach(query("[widgetId]", inRowNode).map(dijit.byNode), function(w){
					if(w._destroyOnRemove){
						w.destroy();
						delete w;
					}else if(w.domNode && w.domNode.parentNode){
						w.domNode.parentNode.removeChild(w.domNode);
					}
				});
			}
		},
		
		onBeforeRow: function(inRowIndex, cells){
			this._onBeforeRow(inRowIndex, cells);
			if(inRowIndex >= 0){
				this._cleanupRowWidgets(this.getRowNode(inRowIndex));
			}
		},
		
		onAfterRow: function(inRowIndex, cells, inRowNode){
			this._onAfterRow(inRowIndex, cells, inRowNode);
			var g = this.grid;
			array.forEach(query(".dojoxGridStubNode", inRowNode), function(n){
				if(n && n.parentNode){
					var lw = n.getAttribute("linkWidget");
					var cellIdx = window.parseInt(html.attr(n, "cellIdx"), 10);
					var cellDef = g.getCell(cellIdx);
					var w = dijit.byId(lw);
					if(w){
						n.parentNode.replaceChild(w.domNode, n);
						if(!w._started){
							w.startup();
						}
						dojo.destroy(n);
					}else{
						n.innerHTML = "";
					}
				}
			}, this);
		},

		testFlexCells: function(){
			// FIXME: cheater, this function does double duty as initializer and tester
			this.flexCells = false;
			for(var j=0, row; (row=this.structure.cells[j]); j++){
				for(var i=0, cell; (cell=row[i]); i++){
					cell.view = this;
					this.flexCells = this.flexCells || cell.isFlex();
				}
			}
			return this.flexCells;
		},

		updateStructure: function(){
			// header builder needs to update table map
			this.header.update();
			// content builder needs to update markup cache
			this.content.update();
		},

		getScrollbarWidth: function(){
			var hasScrollSpace = this.hasVScrollbar();
			var overflow = html.style(this.scrollboxNode, "overflow");
			if(this.noscroll || !overflow || overflow == "hidden"){
				hasScrollSpace = false;
			}else if(overflow == "scroll"){
				hasScrollSpace = true;
			}
			return (hasScrollSpace ? metrics.getScrollbar().w : 0); // Integer
		},

		getColumnsWidth: function(){
			var h = this.headerContentNode;
			return h && h.firstChild ? h.firstChild.offsetWidth : 0; // Integer
		},

		setColumnsWidth: function(width){
			this.headerContentNode.firstChild.style.width = width + 'px';
			if(this.viewWidth){
				this.viewWidth = width + 'px';
			}
		},

		getWidth: function(){
			return this.viewWidth || (this.getColumnsWidth()+this.getScrollbarWidth()) +'px'; // String
		},

		getContentWidth: function(){
			return Math.max(0, html._getContentBox(this.domNode).w - this.getScrollbarWidth()) + 'px'; // String
		},

		render: function(){
			this.scrollboxNode.style.height = '';
			this.renderHeader();
			if(this._togglingColumn >= 0){
				this.setColumnsWidth(this.getColumnsWidth() - this._togglingColumn);
				this._togglingColumn = -1;
			}
			var cells = this.grid.layout.cells;
			var getSibling = lang.hitch(this, function(node, before){
				!this.grid.isLeftToRight() && (before = !before);
				var inc = before?-1:1;
				var idx = this.header.getCellNodeIndex(node) + inc;
				var cell = cells[idx];
				while(cell && cell.getHeaderNode() && cell.getHeaderNode().style.display == "none"){
					idx += inc;
					cell = cells[idx];
				}
				if(cell){
					return cell.getHeaderNode();
				}
				return null;
			});
			if(this.grid.columnReordering && this.simpleStructure){
				if(this.source){
					this.source.destroy();
				}
				
				// Create the top and bottom markers
				var bottomMarkerId = "dojoxGrid_bottomMarker";
				var topMarkerId = "dojoxGrid_topMarker";
				if(this.bottomMarker){
					html.destroy(this.bottomMarker);
				}
				this.bottomMarker = html.byId(bottomMarkerId);
				if(this.topMarker){
					html.destroy(this.topMarker);
				}
				this.topMarker = html.byId(topMarkerId);
				if (!this.bottomMarker) {
					this.bottomMarker = html.create("div", {
						"id": bottomMarkerId,
						"class": "dojoxGridColPlaceBottom"
					}, win.body());
					this._hide(this.bottomMarker);

					
					this.topMarker = html.create("div", {
						"id": topMarkerId,
						"class": "dojoxGridColPlaceTop"
					}, win.body());
					this._hide(this.topMarker);
				}
				this.arrowDim = html.contentBox(this.bottomMarker);

				var headerHeight = html.contentBox(this.headerContentNode.firstChild.rows[0]).h;
				
				this.source = new Source(this.headerContentNode.firstChild.rows[0], {
					horizontal: true,
					accept: [ "gridColumn_" + this.grid.id ],
					viewIndex: this.index,
					generateText: false,
					onMouseDown: lang.hitch(this, function(e){
						this.header.decorateEvent(e);
						if((this.header.overRightResizeArea(e) || this.header.overLeftResizeArea(e)) &&
							this.header.canResize(e) && !this.header.moveable){
							this.header.beginColumnResize(e);
						}else{
							if(this.grid.headerMenu){
								this.grid.headerMenu.onCancel(true);
							}
							// IE reports a left click as 1, where everything else reports 0
							if(e.button === (has("ie") < 9 ? 1 : 0)){
								Source.prototype.onMouseDown.call(this.source, e);
							}
						}
					}),
					onMouseOver: lang.hitch(this, function(e){
						var src = this.source;
						if(src._getChildByEvent(e)){
							Source.prototype.onMouseOver.apply(src, arguments);
						}
					}),
					_markTargetAnchor: lang.hitch(this, function(before){
						var src = this.source;
						if(src.current == src.targetAnchor && src.before == before){ return; }
						if(src.targetAnchor && getSibling(src.targetAnchor, src.before)){
							src._removeItemClass(getSibling(src.targetAnchor, src.before), src.before ? "After" : "Before");
						}
						Source.prototype._markTargetAnchor.call(src, before);
						
						var target = before ? src.targetAnchor : getSibling(src.targetAnchor, src.before);
						var endAdd = 0;

						if (!target) {
							target = src.targetAnchor;
							endAdd = html.contentBox(target).w + this.arrowDim.w/2 + 2;
						}

						var pos = html.position(target, true);
						var left = Math.floor(pos.x - this.arrowDim.w/2 + endAdd);

						html.style(this.bottomMarker, "visibility", "visible");
						html.style(this.topMarker, "visibility", "visible");
						html.style(this.bottomMarker, {
							"left": left + "px",
							"top" : (headerHeight + pos.y) + "px"
						});

						html.style(this.topMarker, {
							"left": left + "px",
							"top" : (pos.y - this.arrowDim.h) + "px"
						});

						if(src.targetAnchor && getSibling(src.targetAnchor, src.before)){
							src._addItemClass(getSibling(src.targetAnchor, src.before), src.before ? "After" : "Before");
						}
					}),
					_unmarkTargetAnchor: lang.hitch(this, function(){
						var src = this.source;
						if(!src.targetAnchor){ return; }
						if(src.targetAnchor && getSibling(src.targetAnchor, src.before)){
							src._removeItemClass(getSibling(src.targetAnchor, src.before), src.before ? "After" : "Before");
						}
						this._hide(this.bottomMarker);
						this._hide(this.topMarker);
						Source.prototype._unmarkTargetAnchor.call(src);
					}),
					destroy: lang.hitch(this, function(){
						connect.disconnect(this._source_conn);
						connect.unsubscribe(this._source_sub);
						Source.prototype.destroy.call(this.source);
						if(this.bottomMarker){
							html.destroy(this.bottomMarker);
							delete this.bottomMarker;
						}
						if(this.topMarker){
							html.destroy(this.topMarker);
							delete this.topMarker;
						}
					}),
					onDndCancel: lang.hitch(this, function(){
						Source.prototype.onDndCancel.call(this.source);
						this._hide(this.bottomMarker);
						this._hide(this.topMarker);
					})
				});

				this._source_conn = connect.connect(this.source, "onDndDrop", this, "_onDndDrop");
				this._source_sub = connect.subscribe("/dnd/drop/before", this, "_onDndDropBefore");
				this.source.startup();
			}
		},
		
		_hide: function(node){
			html.style(node, {
				top: "-10000px",
				"visibility": "hidden"
			});
		},

		_onDndDropBefore: function(source, nodes, copy){
			if(dojo.dnd.manager().target !== this.source){
				return;
			}
			this.source._targetNode = this.source.targetAnchor;
			this.source._beforeTarget = this.source.before;
			var views = this.grid.views.views;
			var srcView = views[source.viewIndex];
			var tgtView = views[this.index];
			if(tgtView != srcView){
				srcView.convertColPctToFixed();
				tgtView.convertColPctToFixed();
			}
		},

		_onDndDrop: function(source, nodes, copy){
			if(dojo.dnd.manager().target !== this.source){
				if(dojo.dnd.manager().source === this.source){
					this._removingColumn = true;
				}
				return;
			}
			this._hide(this.bottomMarker);
			this._hide(this.topMarker);

			var getIdx = function(n){
				return n ? html.attr(n, "idx") : null;
			};
			var w = html.marginBox(nodes[0]).w;
			if(source.viewIndex !== this.index){
				var views = this.grid.views.views;
				var srcView = views[source.viewIndex];
				var tgtView = views[this.index];
				if(srcView.viewWidth && srcView.viewWidth != "auto"){
					srcView.setColumnsWidth(srcView.getColumnsWidth() - w);
				}
				if(tgtView.viewWidth && tgtView.viewWidth != "auto"){
					tgtView.setColumnsWidth(tgtView.getColumnsWidth());
				}
			}
			var stn = this.source._targetNode;
			var stb = this.source._beforeTarget;
			!this.grid.isLeftToRight() && (stb = !stb);
			var layout = this.grid.layout;
			var idx = this.index;
			delete this.source._targetNode;
			delete this.source._beforeTarget;
			
			layout.moveColumn(
				source.viewIndex,
				idx,
				getIdx(nodes[0]),
				getIdx(stn),
				stb);
		},

		renderHeader: function(){
			this.headerContentNode.innerHTML = this.header.generateHtml(this._getHeaderContent);
			if(this.flexCells){
				this.contentWidth = this.getContentWidth();
				this.headerContentNode.firstChild.style.width = this.contentWidth;
			}
			util.fire(this, "onAfterRow", [-1, this.structure.cells, this.headerContentNode]);
		},

		// note: not called in 'view' context
		_getHeaderContent: function(inCell){
			var n = inCell.name || inCell.grid.getCellName(inCell);
			if(/^\s+$/.test(n)){
				n = '&nbsp;'//otherwise arrow styles will be messed up
			}
			var ret = [ '<div class="dojoxGridSortNode' ];
			
			if(inCell.index != inCell.grid.getSortIndex()){
				ret.push('">');
			}else{
				ret = ret.concat([ ' ',
							inCell.grid.sortInfo > 0 ? 'dojoxGridSortUp' : 'dojoxGridSortDown',
							'"><div class="dojoxGridArrowButtonChar">',
							inCell.grid.sortInfo > 0 ? '&#9650;' : '&#9660;',
							'</div><div class="dojoxGridArrowButtonNode" role="presentation"></div>',
							'<div class="dojoxGridColCaption">']);
			}
			ret = ret.concat([n, '</div></div>']);
			return ret.join('');
		},

		resize: function(){
			this.adaptHeight();
			this.adaptWidth();
		},

		hasHScrollbar: function(reset){
			var hadScroll = this._hasHScroll||false;
			if(this._hasHScroll == undefined || reset){
				if(this.noscroll){
					this._hasHScroll = false;
				}else{
					var style = html.style(this.scrollboxNode, "overflow");
					if(style == "hidden"){
						this._hasHScroll = false;
					}else if(style == "scroll"){
						this._hasHScroll = true;
					}else{
						this._hasHScroll = (this.scrollboxNode.offsetWidth - this.getScrollbarWidth() < this.contentNode.offsetWidth );
					}
				}
			}
			if(hadScroll !== this._hasHScroll){
				this.grid.update();
			}
			return this._hasHScroll; // Boolean
		},

		hasVScrollbar: function(reset){
			var hadScroll = this._hasVScroll||false;
			if(this._hasVScroll == undefined || reset){
				if(this.noscroll){
					this._hasVScroll = false;
				}else{
					var style = html.style(this.scrollboxNode, "overflow");
					if(style == "hidden"){
						this._hasVScroll = false;
					}else if(style == "scroll"){
						this._hasVScroll = true;
					}else{
						this._hasVScroll = (this.scrollboxNode.scrollHeight > this.scrollboxNode.clientHeight);
					}
				}
			}
			if(hadScroll !== this._hasVScroll){
				this.grid.update();
			}
			return this._hasVScroll; // Boolean
		},
		
		convertColPctToFixed: function(){
			// Fix any percentage widths to be pixel values
			var hasPct = false;
			this.grid.initialWidth = "";
			var cellNodes = query("th", this.headerContentNode);
			var fixedWidths = array.map(cellNodes, function(c, vIdx){
				var w = c.style.width;
				html.attr(c, "vIdx", vIdx);
				if(w && w.slice(-1) == "%"){
					hasPct = true;
				}else if(w && w.slice(-2) == "px"){
					return window.parseInt(w, 10);
				}
				return html.contentBox(c).w;
			});
			if(hasPct){
				array.forEach(this.grid.layout.cells, function(cell, idx){
					if(cell.view == this){
						var cellNode = cell.view.getHeaderCellNode(cell.index);
						if(cellNode && html.hasAttr(cellNode, "vIdx")){
							var vIdx = window.parseInt(html.attr(cellNode, "vIdx"));
							this.setColWidth(idx, fixedWidths[vIdx]);
							html.removeAttr(cellNode, "vIdx");
						}
					}
				}, this);
				return true;
			}
			return false;
		},

		adaptHeight: function(minusScroll){
			if(!this.grid._autoHeight){
				var h = (this.domNode.style.height && parseInt(this.domNode.style.height.replace(/px/,''), 10)) || this.domNode.clientHeight;
				var self = this;
				var checkOtherViewScrollers = function(){
					var v;
					for(var i in self.grid.views.views){
						v = self.grid.views.views[i];
						if(v !== self && v.hasHScrollbar()){
							return true;
						}
					}
					return false;
				};
				if(minusScroll || (this.noscroll && checkOtherViewScrollers())){
					h -= metrics.getScrollbar().h;
				}
				util.setStyleHeightPx(this.scrollboxNode, h);
			}
			this.hasVScrollbar(true);
		},

		adaptWidth: function(){
			if(this.flexCells){
				// the view content width
				this.contentWidth = this.getContentWidth();
				this.headerContentNode.firstChild.style.width = this.contentWidth;
			}
			// FIXME: it should be easier to get w from this.scrollboxNode.clientWidth,
			// but clientWidth seemingly does not include scrollbar width in some cases
			var w = this.scrollboxNode.offsetWidth - this.getScrollbarWidth();
			if(!this._removingColumn){
				w = Math.max(w, this.getColumnsWidth()) + 'px';
			}else{
				w = Math.min(w, this.getColumnsWidth()) + 'px';
				this._removingColumn = false;
			}
			var cn = this.contentNode;
			cn.style.width = w;
			this.hasHScrollbar(true);
		},

		setSize: function(w, h){
			var ds = this.domNode.style;
			var hs = this.headerNode.style;

			if(w){
				ds.width = w;
				hs.width = w;
			}
			ds.height = (h >= 0 ? h + 'px' : '');
		},

		renderRow: function(inRowIndex){
			var rowNode = this.createRowNode(inRowIndex);
			this.buildRow(inRowIndex, rowNode);
			//this.grid.edit.restore(this, inRowIndex);
			return rowNode;
		},

		createRowNode: function(inRowIndex){
			var node = document.createElement("div");
			node.className = this.classTag + 'Row';
			if (this instanceof dojox.grid._RowSelector){
				html.attr(node,"role","presentation");
			}else{
				html.attr(node,"role","row");
				if (this.grid.selectionMode != "none") {
					node.setAttribute("aria-selected", "false"); //rows can be selected so add aria-selected prop
				}
			}
			node[util.gridViewTag] = this.id;
			node[util.rowIndexTag] = inRowIndex;
			this.rowNodes[inRowIndex] = node;
			return node;
		},

		buildRow: function(inRowIndex, inRowNode){
			
			this.buildRowContent(inRowIndex, inRowNode);
		  	
			this.styleRow(inRowIndex, inRowNode);
		  
		 
		},

		buildRowContent: function(inRowIndex, inRowNode){
			inRowNode.innerHTML = this.content.generateHtml(inRowIndex, inRowIndex);
			if(this.flexCells && this.contentWidth){
				// FIXME: accessing firstChild here breaks encapsulation
				inRowNode.firstChild.style.width = this.contentWidth;
			}
			util.fire(this, "onAfterRow", [inRowIndex, this.structure.cells, inRowNode]);
		},

		rowRemoved:function(inRowIndex){
			if(inRowIndex >= 0){
				this._cleanupRowWidgets(this.getRowNode(inRowIndex));
			}
			this.grid.edit.save(this, inRowIndex);
			delete this.rowNodes[inRowIndex];
		},

		getRowNode: function(inRowIndex){
			return this.rowNodes[inRowIndex];
		},

		getCellNode: function(inRowIndex, inCellIndex){
			var row = this.getRowNode(inRowIndex);
			if(row){
				return this.content.getCellNode(row, inCellIndex);
			}
		},

		getHeaderCellNode: function(inCellIndex){
			if(this.headerContentNode){
				return this.header.getCellNode(this.headerContentNode, inCellIndex);
			}
		},

		// styling
		styleRow: function(inRowIndex, inRowNode){
			inRowNode._style = getStyleText(inRowNode);
			this.styleRowNode(inRowIndex, inRowNode);
		},

		styleRowNode: function(inRowIndex, inRowNode){
			if(inRowNode){
				this.doStyleRowNode(inRowIndex, inRowNode);
			}
		},

		doStyleRowNode: function(inRowIndex, inRowNode){
			this.grid.styleRowNode(inRowIndex, inRowNode);
		},

		// updating
		updateRow: function(inRowIndex){
			var rowNode = this.getRowNode(inRowIndex);
			if(rowNode){
				rowNode.style.height = '';
				this.buildRow(inRowIndex, rowNode);
			}
			return rowNode;
		},

		updateRowStyles: function(inRowIndex){
			this.styleRowNode(inRowIndex, this.getRowNode(inRowIndex));
		},

		// scrolling
		lastTop: 0,
		firstScroll:0,

		doscroll: function(inEvent){
			//var s = dojo.marginBox(this.headerContentNode.firstChild);
			var isLtr = this.grid.isLeftToRight();
			if(this.firstScroll < 2){
				if((!isLtr && this.firstScroll == 1) || (isLtr && this.firstScroll === 0)){
					var s = html.marginBox(this.headerNodeContainer);
					if(has("ie")){
						this.headerNodeContainer.style.width = s.w + this.getScrollbarWidth() + 'px';
					}else if(has("mozilla")){
						//TODO currently only for FF, not sure for safari and opera
						this.headerNodeContainer.style.width = s.w - this.getScrollbarWidth() + 'px';
						//this.headerNodeContainer.style.width = s.w + 'px';
						//set scroll to right in FF
						this.scrollboxNode.scrollLeft = isLtr ?
							this.scrollboxNode.clientWidth - this.scrollboxNode.scrollWidth :
							this.scrollboxNode.scrollWidth - this.scrollboxNode.clientWidth;
					}
				}
				this.firstScroll++;
			}
			this.headerNode.scrollLeft = this.scrollboxNode.scrollLeft;
			// 'lastTop' is a semaphore to prevent feedback-loop with setScrollTop below
			var top = this.scrollboxNode.scrollTop;
			if(top !== this.lastTop){
				this.grid.scrollTo(top);
			}
		},

		setScrollTop: function(inTop){
			// 'lastTop' is a semaphore to prevent feedback-loop with doScroll above
			this.lastTop = inTop;
			this.scrollboxNode.scrollTop = inTop;
			return this.scrollboxNode.scrollTop;
		},

		// event handlers (direct from DOM)
		doContentEvent: function(e){
			if(this.content.decorateEvent(e)){
				this.grid.onContentEvent(e);
			}
		},

		doHeaderEvent: function(e){
			if(this.header.decorateEvent(e)){
				this.grid.onHeaderEvent(e);
			}
		},

		// event dispatch(from Grid)
		dispatchContentEvent: function(e){
			return this.content.dispatchEvent(e);
		},

		dispatchHeaderEvent: function(e){
			return this.header.dispatchEvent(e);
		},

		// column resizing
		setColWidth: function(inIndex, inWidth){
			this.grid.setCellWidth(inIndex, inWidth + 'px');
		},

		update: function(){
			if(!this.domNode){
				return;
			}
			this.content.update();
			this.grid.update();
			//get scroll after update or scroll left setting goes wrong on IE.
			//See trac: #8040
			var left = this.scrollboxNode.scrollLeft;
			this.scrollboxNode.scrollLeft = left;
			this.headerNode.scrollLeft = left;
		}
	});

	var _GridAvatar = declare("dojox.grid._GridAvatar", Avatar, {
		construct: function(){
			var dd = win.doc;

			var a = dd.createElement("table");
			a.cellPadding = a.cellSpacing = "0";
			a.className = "dojoxGridDndAvatar";
			a.style.position = "absolute";
			a.style.zIndex = 1999;
			a.style.margin = "0px"; // to avoid dojo.marginBox() problems with table's margins
			var b = dd.createElement("tbody");
			var tr = dd.createElement("tr");
			var td = dd.createElement("td");
			var img = dd.createElement("td");
			tr.className = "dojoxGridDndAvatarItem";
			img.className = "dojoxGridDndAvatarItemImage";
			img.style.width = "16px";
			var source = this.manager.source, node;
			if(source.creator){
				// create an avatar representation of the node
				node = source._normalizedCreator(source.getItem(this.manager.nodes[0].id).data, "avatar").node;
			}else{
				// or just clone the node and hope it works
				node = this.manager.nodes[0].cloneNode(true);
				var table, tbody;
				if(node.tagName.toLowerCase() == "tr"){
					// insert extra table nodes
					table = dd.createElement("table");
					tbody = dd.createElement("tbody");
					tbody.appendChild(node);
					table.appendChild(tbody);
					node = table;
				}else if(node.tagName.toLowerCase() == "th"){
					// insert extra table nodes
					table = dd.createElement("table");
					tbody = dd.createElement("tbody");
					var r = dd.createElement("tr");
					table.cellPadding = table.cellSpacing = "0";
					r.appendChild(node);
					tbody.appendChild(r);
					table.appendChild(tbody);
					node = table;
				}
			}
			node.id = "";
			td.appendChild(node);
			tr.appendChild(img);
			tr.appendChild(td);
			html.style(tr, "opacity", 0.9);
			b.appendChild(tr);

			a.appendChild(b);
			this.node = a;

			var m = dojo.dnd.manager();
			this.oldOffsetY = m.OFFSET_Y;
			m.OFFSET_Y = 1;
		},
		destroy: function(){
			dojo.dnd.manager().OFFSET_Y = this.oldOffsetY;
			this.inherited(arguments);
		}
	});

	var oldMakeAvatar = dojo.dnd.manager().makeAvatar;
	dojo.dnd.manager().makeAvatar = function(){
		var src = this.source;
		if(src.viewIndex !== undefined && !html.hasClass(win.body(),"dijit_a11y")){
			return new _GridAvatar(this);
		}
		return oldMakeAvatar.call(dojo.dnd.manager());
	};

	return _View;

});
},
'dijit/MenuItem':function(){
require({cache:{
'url:dijit/templates/MenuItem.html':"<tr class=\"dijitReset dijitMenuItem\" data-dojo-attach-point=\"focusNode\" role=\"menuitem\" tabIndex=\"-1\"\r\n\t\tdata-dojo-attach-event=\"onmouseenter:_onHover,onmouseleave:_onUnhover,ondijitclick:_onClick\">\r\n\t<td class=\"dijitReset dijitMenuItemIconCell\" role=\"presentation\">\r\n\t\t<img src=\"${_blankGif}\" alt=\"\" class=\"dijitIcon dijitMenuItemIcon\" data-dojo-attach-point=\"iconNode\"/>\r\n\t</td>\r\n\t<td class=\"dijitReset dijitMenuItemLabel\" colspan=\"2\" data-dojo-attach-point=\"containerNode\"></td>\r\n\t<td class=\"dijitReset dijitMenuItemAccelKey\" style=\"display: none\" data-dojo-attach-point=\"accelKeyNode\"></td>\r\n\t<td class=\"dijitReset dijitMenuArrowCell\" role=\"presentation\">\r\n\t\t<div data-dojo-attach-point=\"arrowWrapper\" style=\"visibility: hidden\">\r\n\t\t\t<img src=\"${_blankGif}\" alt=\"\" class=\"dijitMenuExpand\"/>\r\n\t\t\t<span class=\"dijitMenuExpandA11y\">+</span>\r\n\t\t</div>\r\n\t</td>\r\n</tr>\r\n"}});
define("dijit/MenuItem", [
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.setSelectable
	"dojo/dom-attr", // domAttr.set
	"dojo/dom-class", // domClass.toggle
	"dojo/_base/event", // event.stop
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/_base/sniff", // has("ie")
	"./_Widget",
	"./_TemplatedMixin",
	"./_Contained",
	"./_CssStateMixin",
	"dojo/text!./templates/MenuItem.html"
], function(declare, dom, domAttr, domClass, event, kernel, has,
			_Widget, _TemplatedMixin, _Contained, _CssStateMixin, template){

/*=====
	var _Widget = dijit._Widget;
	var _TemplatedMixin = dijit._TemplatedMixin;
	var _Contained = dijit._Contained;
	var _CssStateMixin = dijit._CssStateMixin;
=====*/

	// module:
	//		dijit/MenuItem
	// summary:
	//		A line item in a Menu Widget


	return declare("dijit.MenuItem",
		[_Widget, _TemplatedMixin, _Contained, _CssStateMixin],
		{
		// summary:
		//		A line item in a Menu Widget

		// Make 3 columns
		// icon, label, and expand arrow (BiDi-dependent) indicating sub-menu
		templateString: template,

		baseClass: "dijitMenuItem",

		// label: String
		//		Menu text
		label: '',
		_setLabelAttr: { node: "containerNode", type: "innerHTML" },

		// iconClass: String
		//		Class to apply to DOMNode to make it display an icon.
		iconClass: "dijitNoIcon",
		_setIconClassAttr: { node: "iconNode", type: "class" },

		// accelKey: String
		//		Text for the accelerator (shortcut) key combination.
		//		Note that although Menu can display accelerator keys there
		//		is no infrastructure to actually catch and execute these
		//		accelerators.
		accelKey: "",

		// disabled: Boolean
		//		If true, the menu item is disabled.
		//		If false, the menu item is enabled.
		disabled: false,

		_fillContent: function(/*DomNode*/ source){
			// If button label is specified as srcNodeRef.innerHTML rather than
			// this.params.label, handle it here.
			if(source && !("label" in this.params)){
				this.set('label', source.innerHTML);
			}
		},

		buildRendering: function(){
			this.inherited(arguments);
			var label = this.id+"_text";
			domAttr.set(this.containerNode, "id", label);
			if(this.accelKeyNode){
				domAttr.set(this.accelKeyNode, "id", this.id + "_accel");
				label += " " + this.id + "_accel";
			}
			this.domNode.setAttribute("aria-labelledby", label);
			dom.setSelectable(this.domNode, false);
		},

		_onHover: function(){
			// summary:
			//		Handler when mouse is moved onto menu item
			// tags:
			//		protected
			this.getParent().onItemHover(this);
		},

		_onUnhover: function(){
			// summary:
			//		Handler when mouse is moved off of menu item,
			//		possibly to a child menu, or maybe to a sibling
			//		menuitem or somewhere else entirely.
			// tags:
			//		protected

			// if we are unhovering the currently selected item
			// then unselect it
			this.getParent().onItemUnhover(this);

			// When menu is hidden (collapsed) due to clicking a MenuItem and having it execute,
			// FF and IE don't generate an onmouseout event for the MenuItem.
			// So, help out _CssStateMixin in this case.
			this._set("hovering", false);
		},

		_onClick: function(evt){
			// summary:
			//		Internal handler for click events on MenuItem.
			// tags:
			//		private
			this.getParent().onItemClick(this, evt);
			event.stop(evt);
		},

		onClick: function(/*Event*/){
			// summary:
			//		User defined function to handle clicks
			// tags:
			//		callback
		},

		focus: function(){
			// summary:
			//		Focus on this MenuItem
			try{
				if(has("ie") == 8){
					// needed for IE8 which won't scroll TR tags into view on focus yet calling scrollIntoView creates flicker (#10275)
					this.containerNode.focus();
				}
				this.focusNode.focus();
			}catch(e){
				// this throws on IE (at least) in some scenarios
			}
		},

		_onFocus: function(){
			// summary:
			//		This is called by the focus manager when focus
			//		goes to this MenuItem or a child menu.
			// tags:
			//		protected
			this._setSelected(true);
			this.getParent()._onItemFocus(this);

			this.inherited(arguments);
		},

		_setSelected: function(selected){
			// summary:
			//		Indicate that this node is the currently selected one
			// tags:
			//		private

			/***
			 * TODO: remove this method and calls to it, when _onBlur() is working for MenuItem.
			 * Currently _onBlur() gets called when focus is moved from the MenuItem to a child menu.
			 * That's not supposed to happen, but the problem is:
			 * In order to allow dijit.popup's getTopPopup() to work,a sub menu's popupParent
			 * points to the parent Menu, bypassing the parent MenuItem... thus the
			 * MenuItem is not in the chain of active widgets and gets a premature call to
			 * _onBlur()
			 */

			domClass.toggle(this.domNode, "dijitMenuItemSelected", selected);
		},

		setLabel: function(/*String*/ content){
			// summary:
			//		Deprecated.   Use set('label', ...) instead.
			// tags:
			//		deprecated
			kernel.deprecated("dijit.MenuItem.setLabel() is deprecated.  Use set('label', ...) instead.", "", "2.0");
			this.set("label", content);
		},

		setDisabled: function(/*Boolean*/ disabled){
			// summary:
			//		Deprecated.   Use set('disabled', bool) instead.
			// tags:
			//		deprecated
			kernel.deprecated("dijit.Menu.setDisabled() is deprecated.  Use set('disabled', bool) instead.", "", "2.0");
			this.set('disabled', disabled);
		},
		_setDisabledAttr: function(/*Boolean*/ value){
			// summary:
			//		Hook for attr('disabled', ...) to work.
			//		Enable or disable this menu item.

			this.focusNode.setAttribute('aria-disabled', value ? 'true' : 'false');
			this._set("disabled", value);
		},
		_setAccelKeyAttr: function(/*String*/ value){
			// summary:
			//		Hook for attr('accelKey', ...) to work.
			//		Set accelKey on this menu item.

			this.accelKeyNode.style.display=value?"":"none";
			this.accelKeyNode.innerHTML=value;
			//have to use colSpan to make it work in IE
			domAttr.set(this.containerNode,'colSpan',value?"1":"2");

			this._set("accelKey", value);
		}
	});
});

},
'dojo/cldr/supplemental':function(){
define(["../_base/kernel", "../_base/lang", "../i18n"], function(dojo, lang) {
	// module:
	//		dojo/cldr/supplemental
	// summary:
	//		TODOC

lang.getObject("cldr.supplemental", true, dojo);

dojo.cldr.supplemental.getFirstDayOfWeek = function(/*String?*/locale){
// summary: Returns a zero-based index for first day of the week
// description:
//		Returns a zero-based index for first day of the week, as used by the local (Gregorian) calendar.
//		e.g. Sunday (returns 0), or Monday (returns 1)

	// from http://www.unicode.org/cldr/data/common/supplemental/supplementalData.xml:supplementalData/weekData/firstDay
	var firstDay = {/*default is 1=Monday*/
		mv:5,
		ae:6,af:6,bh:6,dj:6,dz:6,eg:6,er:6,et:6,iq:6,ir:6,jo:6,ke:6,kw:6,
		ly:6,ma:6,om:6,qa:6,sa:6,sd:6,so:6,sy:6,tn:6,ye:6,
		ar:0,as:0,az:0,bw:0,ca:0,cn:0,fo:0,ge:0,gl:0,gu:0,hk:0,
		il:0,'in':0,jm:0,jp:0,kg:0,kr:0,la:0,mh:0,mn:0,mo:0,mp:0,
		mt:0,nz:0,ph:0,pk:0,sg:0,th:0,tt:0,tw:0,um:0,us:0,uz:0,
		vi:0,zw:0
// variant. do not use?		gb:0,
	};

	var country = dojo.cldr.supplemental._region(locale);
	var dow = firstDay[country];
	return (dow === undefined) ? 1 : dow; /*Number*/
};

dojo.cldr.supplemental._region = function(/*String?*/locale){
	locale = dojo.i18n.normalizeLocale(locale);
	var tags = locale.split('-');
	var region = tags[1];
	if(!region){
		// IE often gives language only (#2269)
		// Arbitrary mappings of language-only locales to a country:
		region = {de:"de", en:"us", es:"es", fi:"fi", fr:"fr", he:"il", hu:"hu", it:"it",
			ja:"jp", ko:"kr", nl:"nl", pt:"br", sv:"se", zh:"cn"}[tags[0]];
	}else if(region.length == 4){
		// The ISO 3166 country code is usually in the second position, unless a
		// 4-letter script is given. See http://www.ietf.org/rfc/rfc4646.txt
		region = tags[2];
	}
	return region;
};

dojo.cldr.supplemental.getWeekend = function(/*String?*/locale){
// summary: Returns a hash containing the start and end days of the weekend
// description:
//		Returns a hash containing the start and end days of the weekend according to local custom using locale,
//		or by default in the user's locale.
//		e.g. {start:6, end:0}

	// from http://www.unicode.org/cldr/data/common/supplemental/supplementalData.xml:supplementalData/weekData/weekend{Start,End}
	var weekendStart = {/*default is 6=Saturday*/
		'in':0,
		af:4,dz:4,ir:4,om:4,sa:4,ye:4,
		ae:5,bh:5,eg:5,il:5,iq:5,jo:5,kw:5,ly:5,ma:5,qa:5,sd:5,sy:5,tn:5
	};

	var weekendEnd = {/*default is 0=Sunday*/
		af:5,dz:5,ir:5,om:5,sa:5,ye:5,
		ae:6,bh:5,eg:6,il:6,iq:6,jo:6,kw:6,ly:6,ma:6,qa:6,sd:6,sy:6,tn:6
	};

	var country = dojo.cldr.supplemental._region(locale);
	var start = weekendStart[country];
	var end = weekendEnd[country];
	if(start === undefined){start=6;}
	if(end === undefined){end=0;}
	return {start:start, end:end}; /*Object {start,end}*/
};

return dojo.cldr.supplemental;
});

},
'dijit/popup':function(){
define("dijit/popup", [
	"dojo/_base/array", // array.forEach array.some
	"dojo/aspect",
	"dojo/_base/connect",	// connect._keypress
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.isDescendant
	"dojo/dom-attr", // domAttr.set
	"dojo/dom-construct", // domConstruct.create domConstruct.destroy
	"dojo/dom-geometry", // domGeometry.isBodyLtr
	"dojo/dom-style", // domStyle.set
	"dojo/_base/event", // event.stop
	"dojo/keys",
	"dojo/_base/lang", // lang.hitch
	"dojo/on",
	"dojo/_base/sniff", // has("ie") has("mozilla")
	"dojo/_base/window", // win.body
	"./place",
	"./BackgroundIframe",
	"."	// dijit (defining dijit.popup to match API doc)
], function(array, aspect, connect, declare, dom, domAttr, domConstruct, domGeometry, domStyle, event, keys, lang, on, has, win,
			place, BackgroundIframe, dijit){

	// module:
	//		dijit/popup
	// summary:
	//		Used to show drop downs (ex: the select list of a ComboBox)
	//		or popups (ex: right-click context menus)


	/*=====
	dijit.popup.__OpenArgs = function(){
		// popup: Widget
		//		widget to display
		// parent: Widget
		//		the button etc. that is displaying this popup
		// around: DomNode
		//		DOM node (typically a button); place popup relative to this node.  (Specify this *or* "x" and "y" parameters.)
		// x: Integer
		//		Absolute horizontal position (in pixels) to place node at.  (Specify this *or* "around" parameter.)
		// y: Integer
		//		Absolute vertical position (in pixels) to place node at.  (Specify this *or* "around" parameter.)
		// orient: Object|String
		//		When the around parameter is specified, orient should be a list of positions to try, ex:
		//	|	[ "below", "above" ]
		//		For backwards compatibility it can also be an (ordered) hash of tuples of the form
		//		(around-node-corner, popup-node-corner), ex:
		//	|	{ "BL": "TL", "TL": "BL" }
		//		where BL means "bottom left" and "TL" means "top left", etc.
		//
		//		dijit.popup.open() tries to position the popup according to each specified position, in order,
		//		until the popup appears fully within the viewport.
		//
		//		The default value is ["below", "above"]
		//
		//		When an (x,y) position is specified rather than an around node, orient is either
		//		"R" or "L".  R (for right) means that it tries to put the popup to the right of the mouse,
		//		specifically positioning the popup's top-right corner at the mouse position, and if that doesn't
		//		fit in the viewport, then it tries, in order, the bottom-right corner, the top left corner,
		//		and the top-right corner.
		// onCancel: Function
		//		callback when user has canceled the popup by
		//			1. hitting ESC or
		//			2. by using the popup widget's proprietary cancel mechanism (like a cancel button in a dialog);
		//			   i.e. whenever popupWidget.onCancel() is called, args.onCancel is called
		// onClose: Function
		//		callback whenever this popup is closed
		// onExecute: Function
		//		callback when user "executed" on the popup/sub-popup by selecting a menu choice, etc. (top menu only)
		// padding: dijit.__Position
		//		adding a buffer around the opening position. This is only useful when around is not set.
		this.popup = popup;
		this.parent = parent;
		this.around = around;
		this.x = x;
		this.y = y;
		this.orient = orient;
		this.onCancel = onCancel;
		this.onClose = onClose;
		this.onExecute = onExecute;
		this.padding = padding;
	}
	=====*/

	/*=====
	dijit.popup = {
		// summary:
		//		Used to show drop downs (ex: the select list of a ComboBox)
		//		or popups (ex: right-click context menus).
		//
		//		Access via require(["dijit/popup"], function(popup){ ... }).

		moveOffScreen: function(widget){
			// summary:
			//		Moves the popup widget off-screen.
			//		Do not use this method to hide popups when not in use, because
			//		that will create an accessibility issue: the offscreen popup is
			//		still in the tabbing order.
			// widget: dijit._WidgetBase
			//		The widget
		},

		hide: function(widget){
			// summary:
			//		Hide this popup widget (until it is ready to be shown).
			//		Initialization for widgets that will be used as popups
			//
			// 		Also puts widget inside a wrapper DIV (if not already in one)
			//
			//		If popup widget needs to layout it should
			//		do so when it is made visible, and popup._onShow() is called.
			// widget: dijit._WidgetBase
			//		The widget
		},

		open: function(args){
			// summary:
			//		Popup the widget at the specified position
			// example:
			//		opening at the mouse position
			//		|		popup.open({popup: menuWidget, x: evt.pageX, y: evt.pageY});
			// example:
			//		opening the widget as a dropdown
			//		|		popup.open({parent: this, popup: menuWidget, around: this.domNode, onClose: function(){...}});
			//
			//		Note that whatever widget called dijit.popup.open() should also listen to its own _onBlur callback
			//		(fired from _base/focus.js) to know that focus has moved somewhere else and thus the popup should be closed.
			// args: dijit.popup.__OpenArgs
			//		Parameters
			return {};	// Object specifying which position was chosen
		},

		close: function(popup){
			// summary:
			//		Close specified popup and any popups that it parented.
			//		If no popup is specified, closes all popups.
			// widget: dijit._WidgetBase?
			//		The widget, optional
		}
	};
	=====*/

	var PopupManager = declare(null, {
		// _stack: dijit._Widget[]
		//		Stack of currently popped up widgets.
		//		(someone opened _stack[0], and then it opened _stack[1], etc.)
		_stack: [],

		// _beginZIndex: Number
		//		Z-index of the first popup.   (If first popup opens other
		//		popups they get a higher z-index.)
		_beginZIndex: 1000,

		_idGen: 1,

		_createWrapper: function(/*Widget*/ widget){
			// summary:
			//		Initialization for widgets that will be used as popups.
			//		Puts widget inside a wrapper DIV (if not already in one),
			//		and returns pointer to that wrapper DIV.

			var wrapper = widget._popupWrapper,
				node = widget.domNode;

			if(!wrapper){
				// Create wrapper <div> for when this widget [in the future] will be used as a popup.
				// This is done early because of IE bugs where creating/moving DOM nodes causes focus
				// to go wonky, see tests/robot/Toolbar.html to reproduce
				wrapper = domConstruct.create("div",{
					"class":"dijitPopup",
					style:{ display: "none"},
					role: "presentation"
				}, win.body());
				wrapper.appendChild(node);

				var s = node.style;
				s.display = "";
				s.visibility = "";
				s.position = "";
				s.top = "0px";

				widget._popupWrapper = wrapper;
				aspect.after(widget, "destroy", function(){
					domConstruct.destroy(wrapper);
					delete widget._popupWrapper;
				});
			}

			return wrapper;
		},

		moveOffScreen: function(/*Widget*/ widget){
			// summary:
			//		Moves the popup widget off-screen.
			//		Do not use this method to hide popups when not in use, because
			//		that will create an accessibility issue: the offscreen popup is
			//		still in the tabbing order.

			// Create wrapper if not already there
			var wrapper = this._createWrapper(widget);

			domStyle.set(wrapper, {
				visibility: "hidden",
				top: "-9999px",		// prevent transient scrollbar causing misalign (#5776), and initial flash in upper left (#10111)
				display: ""
			});
		},

		hide: function(/*Widget*/ widget){
			// summary:
			//		Hide this popup widget (until it is ready to be shown).
			//		Initialization for widgets that will be used as popups
			//
			// 		Also puts widget inside a wrapper DIV (if not already in one)
			//
			//		If popup widget needs to layout it should
			//		do so when it is made visible, and popup._onShow() is called.

			// Create wrapper if not already there
			var wrapper = this._createWrapper(widget);

			domStyle.set(wrapper, "display", "none");
		},

		getTopPopup: function(){
			// summary:
			//		Compute the closest ancestor popup that's *not* a child of another popup.
			//		Ex: For a TooltipDialog with a button that spawns a tree of menus, find the popup of the button.
			var stack = this._stack;
			for(var pi=stack.length-1; pi > 0 && stack[pi].parent === stack[pi-1].widget; pi--){
				/* do nothing, just trying to get right value for pi */
			}
			return stack[pi];
		},

		open: function(/*dijit.popup.__OpenArgs*/ args){
			// summary:
			//		Popup the widget at the specified position
			//
			// example:
			//		opening at the mouse position
			//		|		popup.open({popup: menuWidget, x: evt.pageX, y: evt.pageY});
			//
			// example:
			//		opening the widget as a dropdown
			//		|		popup.open({parent: this, popup: menuWidget, around: this.domNode, onClose: function(){...}});
			//
			//		Note that whatever widget called dijit.popup.open() should also listen to its own _onBlur callback
			//		(fired from _base/focus.js) to know that focus has moved somewhere else and thus the popup should be closed.

			var stack = this._stack,
				widget = args.popup,
				orient = args.orient || ["below", "below-alt", "above", "above-alt"],
				ltr = args.parent ? args.parent.isLeftToRight() : domGeometry.isBodyLtr(),
				around = args.around,
				id = (args.around && args.around.id) ? (args.around.id+"_dropdown") : ("popup_"+this._idGen++);

			// If we are opening a new popup that isn't a child of a currently opened popup, then
			// close currently opened popup(s).   This should happen automatically when the old popups
			// gets the _onBlur() event, except that the _onBlur() event isn't reliable on IE, see [22198].
			while(stack.length && (!args.parent || !dom.isDescendant(args.parent.domNode, stack[stack.length-1].widget.domNode))){
				this.close(stack[stack.length-1].widget);
			}

			// Get pointer to popup wrapper, and create wrapper if it doesn't exist
			var wrapper = this._createWrapper(widget);


			domAttr.set(wrapper, {
				id: id,
				style: {
					zIndex: this._beginZIndex + stack.length
				},
				"class": "dijitPopup " + (widget.baseClass || widget["class"] || "").split(" ")[0] +"Popup",
				dijitPopupParent: args.parent ? args.parent.id : ""
			});

			if(has("ie") || has("mozilla")){
				if(!widget.bgIframe){
					// setting widget.bgIframe triggers cleanup in _Widget.destroy()
					widget.bgIframe = new BackgroundIframe(wrapper);
				}
			}

			// position the wrapper node and make it visible
			var best = around ?
				place.around(wrapper, around, orient, ltr, widget.orient ? lang.hitch(widget, "orient") : null) :
				place.at(wrapper, args, orient == 'R' ? ['TR','BR','TL','BL'] : ['TL','BL','TR','BR'], args.padding);

			wrapper.style.display = "";
			wrapper.style.visibility = "visible";
			widget.domNode.style.visibility = "visible";	// counteract effects from _HasDropDown

			var handlers = [];

			// provide default escape and tab key handling
			// (this will work for any widget, not just menu)
			handlers.push(on(wrapper, connect._keypress, lang.hitch(this, function(evt){
				if(evt.charOrCode == keys.ESCAPE && args.onCancel){
					event.stop(evt);
					args.onCancel();
				}else if(evt.charOrCode === keys.TAB){
					event.stop(evt);
					var topPopup = this.getTopPopup();
					if(topPopup && topPopup.onCancel){
						topPopup.onCancel();
					}
				}
			})));

			// watch for cancel/execute events on the popup and notify the caller
			// (for a menu, "execute" means clicking an item)
			if(widget.onCancel && args.onCancel){
				handlers.push(widget.on("cancel", args.onCancel));
			}

			handlers.push(widget.on(widget.onExecute ? "execute" : "change", lang.hitch(this, function(){
				var topPopup = this.getTopPopup();
				if(topPopup && topPopup.onExecute){
					topPopup.onExecute();
				}
			})));

			stack.push({
				widget: widget,
				parent: args.parent,
				onExecute: args.onExecute,
				onCancel: args.onCancel,
				onClose: args.onClose,
				handlers: handlers
			});

			if(widget.onOpen){
				// TODO: in 2.0 standardize onShow() (used by StackContainer) and onOpen() (used here)
				widget.onOpen(best);
			}

			return best;
		},

		close: function(/*Widget?*/ popup){
			// summary:
			//		Close specified popup and any popups that it parented.
			//		If no popup is specified, closes all popups.

			var stack = this._stack;

			// Basically work backwards from the top of the stack closing popups
			// until we hit the specified popup, but IIRC there was some issue where closing
			// a popup would cause others to close too.  Thus if we are trying to close B in [A,B,C]
			// closing C might close B indirectly and then the while() condition will run where stack==[A]...
			// so the while condition is constructed defensively.
			while((popup && array.some(stack, function(elem){return elem.widget == popup;})) ||
				(!popup && stack.length)){
				var top = stack.pop(),
					widget = top.widget,
					onClose = top.onClose;

				if(widget.onClose){
					// TODO: in 2.0 standardize onHide() (used by StackContainer) and onClose() (used here)
					widget.onClose();
				}

				var h;
				while(h = top.handlers.pop()){ h.remove(); }

				// Hide the widget and it's wrapper unless it has already been destroyed in above onClose() etc.
				if(widget && widget.domNode){
					this.hide(widget);
				}

				if(onClose){
					onClose();
				}
			}
		}
	});

	return (dijit.popup = new PopupManager());
});

},
'dojox/grid/_RowManager':function(){
define("dojox/grid/_RowManager", [
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-class"
], function(declare, lang, domClass){

	var setStyleText = function(inNode, inStyleText){
		if(inNode.style.cssText == undefined){
			inNode.setAttribute("style", inStyleText);
		}else{
			inNode.style.cssText = inStyleText;
		}
	};

	return declare("dojox.grid._RowManager", null, {
		//	Stores information about grid rows. Owned by grid and used internally.
		constructor: function(inGrid){
			this.grid = inGrid;
		},
		linesToEms: 2,
		overRow: -2,
		// styles
		prepareStylingRow: function(inRowIndex, inRowNode){
			return {
				index: inRowIndex,
				node: inRowNode,
				odd: Boolean(inRowIndex&1),
				selected: !!this.grid.selection.isSelected(inRowIndex),
				over: this.isOver(inRowIndex),
				customStyles: "",
				customClasses: "dojoxGridRow"
			};
		},
		styleRowNode: function(inRowIndex, inRowNode){
			var row = this.prepareStylingRow(inRowIndex, inRowNode);
			this.grid.onStyleRow(row);
			this.applyStyles(row);
		},
		applyStyles: function(inRow){
			var i = inRow;

			i.node.className = i.customClasses;
			var h = i.node.style.height;
			setStyleText(i.node, i.customStyles + ';' + (i.node._style||''));
			i.node.style.height = h;
		},
		updateStyles: function(inRowIndex){
			this.grid.updateRowStyles(inRowIndex);
		},
		// states and events
		setOverRow: function(inRowIndex){
			var last = this.overRow;
			this.overRow = inRowIndex;
			if((last!=this.overRow)&&(lang.isString(last) || last >= 0)){
				this.updateStyles(last);
			}
			this.updateStyles(this.overRow);
		},
		isOver: function(inRowIndex){
			return (this.overRow == inRowIndex && !domClass.contains(this.grid.domNode, "dojoxGridColumnResizing"));
		}
	});
});
},
'dojo/dnd/Mover':function(){
define(["../main", "../Evented", "../touch", "./common", "./autoscroll"], function(dojo, Evented, touch) {
	// module:
	//		dojo/dnd/Mover
	// summary:
	//		TODOC


dojo.declare("dojo.dnd.Mover", [Evented], {
	constructor: function(node, e, host){
		// summary:
		//		an object which makes a node follow the mouse, or touch-drag on touch devices.
		//		Used as a default mover, and as a base class for custom movers.
		// node: Node
		//		a node (or node's id) to be moved
		// e: Event
		//		a mouse event, which started the move;
		//		only pageX and pageY properties are used
		// host: Object?
		//		object which implements the functionality of the move,
		//	 	and defines proper events (onMoveStart and onMoveStop)
		this.node = dojo.byId(node);
		this.marginBox = {l: e.pageX, t: e.pageY};
		this.mouseButton = e.button;
		var h = (this.host = host), d = node.ownerDocument;
		this.events = [
			// At the start of a drag, onFirstMove is called, and then the following two
			// connects are disconnected
			dojo.connect(d, touch.move, this, "onFirstMove"),

			// These are called continually during the drag
			dojo.connect(d, touch.move, this, "onMouseMove"),

			// And these are called at the end of the drag
			dojo.connect(d, touch.release,   this, "onMouseUp"),

			// cancel text selection and text dragging
			dojo.connect(d, "ondragstart",   dojo.stopEvent),
			dojo.connect(d.body, "onselectstart", dojo.stopEvent)
		];
		// notify that the move has started
		if(h && h.onMoveStart){
			h.onMoveStart(this);
		}
	},
	// mouse event processors
	onMouseMove: function(e){
		// summary:
		//		event processor for onmousemove/ontouchmove
		// e: Event
		//		mouse/touch event
		dojo.dnd.autoScroll(e);
		var m = this.marginBox;
		this.host.onMove(this, {l: m.l + e.pageX, t: m.t + e.pageY}, e);
		dojo.stopEvent(e);
	},
	onMouseUp: function(e){
		if(dojo.isWebKit && dojo.isMac && this.mouseButton == 2 ?
				e.button == 0 : this.mouseButton == e.button){ // TODO Should condition be met for touch devices, too?
			this.destroy();
		}
		dojo.stopEvent(e);
	},
	// utilities
	onFirstMove: function(e){
		// summary:
		//		makes the node absolute; it is meant to be called only once.
		// 		relative and absolutely positioned nodes are assumed to use pixel units
		var s = this.node.style, l, t, h = this.host;
		switch(s.position){
			case "relative":
			case "absolute":
				// assume that left and top values are in pixels already
				l = Math.round(parseFloat(s.left)) || 0;
				t = Math.round(parseFloat(s.top)) || 0;
				break;
			default:
				s.position = "absolute";	// enforcing the absolute mode
				var m = dojo.marginBox(this.node);
				// event.pageX/pageY (which we used to generate the initial
				// margin box) includes padding and margin set on the body.
				// However, setting the node's position to absolute and then
				// doing dojo.marginBox on it *doesn't* take that additional
				// space into account - so we need to subtract the combined
				// padding and margin.  We use getComputedStyle and
				// _getMarginBox/_getContentBox to avoid the extra lookup of
				// the computed style.
				var b = dojo.doc.body;
				var bs = dojo.getComputedStyle(b);
				var bm = dojo._getMarginBox(b, bs);
				var bc = dojo._getContentBox(b, bs);
				l = m.l - (bc.l - bm.l);
				t = m.t - (bc.t - bm.t);
				break;
		}
		this.marginBox.l = l - this.marginBox.l;
		this.marginBox.t = t - this.marginBox.t;
		if(h && h.onFirstMove){
			h.onFirstMove(this, e);
		}

		// Disconnect onmousemove and ontouchmove events that call this function
		dojo.disconnect(this.events.shift());
	},
	destroy: function(){
		// summary:
		//		stops the move, deletes all references, so the object can be garbage-collected
		dojo.forEach(this.events, dojo.disconnect);
		// undo global settings
		var h = this.host;
		if(h && h.onMoveStop){
			h.onMoveStop(this);
		}
		// destroy objects
		this.events = this.node = this.host = null;
	}
});

return dojo.dnd.Mover;
});

},
'dijit/BackgroundIframe':function(){
define("dijit/BackgroundIframe", [
	"require",			// require.toUrl
	".",	// to export dijit.BackgroundIframe
	"dojo/_base/config",
	"dojo/dom-construct", // domConstruct.create
	"dojo/dom-style", // domStyle.set
	"dojo/_base/lang", // lang.extend lang.hitch
	"dojo/on",
	"dojo/_base/sniff", // has("ie"), has("mozilla"), has("quirks")
	"dojo/_base/window" // win.doc.createElement
], function(require, dijit, config, domConstruct, domStyle, lang, on, has, win){

	// module:
	//		dijit/BackgroundIFrame
	// summary:
	//		new dijit.BackgroundIframe(node)
	//		Makes a background iframe as a child of node, that fills
	//		area (and position) of node

	// TODO: remove _frames, it isn't being used much, since popups never release their
	// iframes (see [22236])
	var _frames = new function(){
		// summary:
		//		cache of iframes

		var queue = [];

		this.pop = function(){
			var iframe;
			if(queue.length){
				iframe = queue.pop();
				iframe.style.display="";
			}else{
				if(has("ie") < 9){
					var burl = config["dojoBlankHtmlUrl"] || require.toUrl("dojo/resources/blank.html") || "javascript:\"\"";
					var html="<iframe src='" + burl + "' role='presentation'"
						+ " style='position: absolute; left: 0px; top: 0px;"
						+ "z-index: -1; filter:Alpha(Opacity=\"0\");'>";
					iframe = win.doc.createElement(html);
				}else{
					iframe = domConstruct.create("iframe");
					iframe.src = 'javascript:""';
					iframe.className = "dijitBackgroundIframe";
					iframe.setAttribute("role", "presentation");
					domStyle.set(iframe, "opacity", 0.1);
				}
				iframe.tabIndex = -1; // Magic to prevent iframe from getting focus on tab keypress - as style didn't work.
			}
			return iframe;
		};

		this.push = function(iframe){
			iframe.style.display="none";
			queue.push(iframe);
		}
	}();


	dijit.BackgroundIframe = function(/*DomNode*/ node){
		// summary:
		//		For IE/FF z-index schenanigans. id attribute is required.
		//
		// description:
		//		new dijit.BackgroundIframe(node)
		//			Makes a background iframe as a child of node, that fills
		//			area (and position) of node

		if(!node.id){ throw new Error("no id"); }
		if(has("ie") || has("mozilla")){
			var iframe = (this.iframe = _frames.pop());
			node.appendChild(iframe);
			if(has("ie")<7 || has("quirks")){
				this.resize(node);
				this._conn = on(node, 'resize', lang.hitch(this, function(){
					this.resize(node);
				}));
			}else{
				domStyle.set(iframe, {
					width: '100%',
					height: '100%'
				});
			}
		}
	};

	lang.extend(dijit.BackgroundIframe, {
		resize: function(node){
			// summary:
			// 		Resize the iframe so it's the same size as node.
			//		Needed on IE6 and IE/quirks because height:100% doesn't work right.
			if(this.iframe){
				domStyle.set(this.iframe, {
					width: node.offsetWidth + 'px',
					height: node.offsetHeight + 'px'
				});
			}
		},
		destroy: function(){
			// summary:
			//		destroy the iframe
			if(this._conn){
				this._conn.remove();
				this._conn = null;
			}
			if(this.iframe){
				_frames.push(this.iframe);
				delete this.iframe;
			}
		}
	});

	return dijit.BackgroundIframe;
});

},
'url:dijit/templates/Menu.html':"<table class=\"dijit dijitMenu dijitMenuPassive dijitReset dijitMenuTable\" role=\"menu\" tabIndex=\"${tabIndex}\" data-dojo-attach-event=\"onkeypress:_onKeyPress\" cellspacing=\"0\">\r\n\t<tbody class=\"dijitReset\" data-dojo-attach-point=\"containerNode\"></tbody>\r\n</table>\r\n",
'dojo/dnd/Avatar':function(){
define(["../main", "./common"], function(dojo) {
	// module:
	//		dojo/dnd/Avatar
	// summary:
	//		TODOC


dojo.declare("dojo.dnd.Avatar", null, {
	// summary:
	//		Object that represents transferred DnD items visually
	// manager: Object
	//		a DnD manager object

	constructor: function(manager){
		this.manager = manager;
		this.construct();
	},

	// methods
	construct: function(){
		// summary:
		//		constructor function;
		//		it is separate so it can be (dynamically) overwritten in case of need
		this.isA11y = dojo.hasClass(dojo.body(),"dijit_a11y");
		var a = dojo.create("table", {
				"class": "dojoDndAvatar",
				style: {
					position: "absolute",
					zIndex:   "1999",
					margin:   "0px"
				}
			}),
			source = this.manager.source, node,
			b = dojo.create("tbody", null, a),
			tr = dojo.create("tr", null, b),
			td = dojo.create("td", null, tr),
			icon = this.isA11y ? dojo.create("span", {
						id : "a11yIcon",
						innerHTML : this.manager.copy ? '+' : "<"
					}, td) : null,
			span = dojo.create("span", {
				innerHTML: source.generateText ? this._generateText() : ""
			}, td),
			k = Math.min(5, this.manager.nodes.length), i = 0;
		// we have to set the opacity on IE only after the node is live
		dojo.attr(tr, {
			"class": "dojoDndAvatarHeader",
			style: {opacity: 0.9}
		});
		for(; i < k; ++i){
			if(source.creator){
				// create an avatar representation of the node
				node = source._normalizedCreator(source.getItem(this.manager.nodes[i].id).data, "avatar").node;
			}else{
				// or just clone the node and hope it works
				node = this.manager.nodes[i].cloneNode(true);
				if(node.tagName.toLowerCase() == "tr"){
					// insert extra table nodes
					var table = dojo.create("table"),
						tbody = dojo.create("tbody", null, table);
					tbody.appendChild(node);
					node = table;
				}
			}
			node.id = "";
			tr = dojo.create("tr", null, b);
			td = dojo.create("td", null, tr);
			td.appendChild(node);
			dojo.attr(tr, {
				"class": "dojoDndAvatarItem",
				style: {opacity: (9 - i) / 10}
			});
		}
		this.node = a;
	},
	destroy: function(){
		// summary:
		//		destructor for the avatar; called to remove all references so it can be garbage-collected
		dojo.destroy(this.node);
		this.node = false;
	},
	update: function(){
		// summary:
		//		updates the avatar to reflect the current DnD state
		dojo[(this.manager.canDropFlag ? "add" : "remove") + "Class"](this.node, "dojoDndAvatarCanDrop");
		if (this.isA11y){
			var icon = dojo.byId("a11yIcon");
			var text = '+';   // assume canDrop && copy
			if (this.manager.canDropFlag && !this.manager.copy) {
				text = '< '; // canDrop && move
			}else if (!this.manager.canDropFlag && !this.manager.copy) {
				text = "o"; //!canDrop && move
			}else if(!this.manager.canDropFlag){
				text = 'x';  // !canDrop && copy
			}
			icon.innerHTML=text;
		}
		// replace text
		dojo.query(("tr.dojoDndAvatarHeader td span" +(this.isA11y ? " span" : "")), this.node).forEach(
			function(node){
				node.innerHTML = this._generateText();
			}, this);
	},
	_generateText: function(){
		// summary: generates a proper text to reflect copying or moving of items
		return this.manager.nodes.length.toString();
	}
});

return dojo.dnd.Avatar;
});

},
'dojox/gfx/Moveable':function(){
define("dojox/gfx/Moveable", ["dojo/_base/lang","dojo/_base/declare","dojo/_base/array","dojo/_base/event","dojo/_base/connect",
	"dojo/dom-class","dojo/_base/window","./Mover"], 
  function(lang,declare,arr,event,connect,domClass,win,Mover){
	return declare("dojox.gfx.Moveable", null, {
		constructor: function(shape, params){
			// summary: an object, which makes a shape moveable
			// shape: dojox.gfx.Shape: a shape object to be moved
			// params: Object: an optional object with additional parameters;
			//	following parameters are recognized:
			//		delay: Number: delay move by this number of pixels
			//		mover: Object: a constructor of custom Mover
			this.shape = shape;
			this.delay = (params && params.delay > 0) ? params.delay : 0;
			this.mover = (params && params.mover) ? params.mover : Mover;
      this.leftButtonOnly = params && params.leftButtonOnly;
			this.events = [
        this.shape.connect("onmousedown", this, "onMouseDown"),
        this.shape.connect("ontouchstart", this, "onMouseDown")
				// cancel text selection and text dragging
				//, dojo.connect(this.handle, "ondragstart",   dojo, "stopEvent")
				//, dojo.connect(this.handle, "onselectstart", dojo, "stopEvent")
			];
		},
	
		// methods
		destroy: function(){
			// summary: stops watching for possible move, deletes all references, so the object can be garbage-collected
			arr.forEach(this.events, this.shape.disconnect, this.shape);
			this.events = this.shape = null;
		},
	
		// mouse event processors
		onMouseDown: function(e){
			// summary: event processor for onmousedown, creates a Mover for the shape
			// e: Event: mouse event
      var pos = e.touches ? e.touches[0] : e;
			if(this.delay){
        this.events.push(this.shape.connect("onmousemove", this, "onMouseMove"));
        this.events.push(this.shape.connect("ontouchmove", this, "onMouseMove"));
        this.events.push(this.shape.connect("onmouseup", this, "onMouseUp"));
        this.events.push(this.shape.connect("ontouchend", this, "onMouseUp"));
				this._lastX = pos.clientX;
				this._lastY = pos.clientY;
			}else{
        if (!this.leftButtonOnly || (pos.button === dojo.mouseButtons.LEFT)) {
          new this.mover(this.shape, pos, this);
        }
			}
			event.stop(e);
		},
		onMouseMove: function(e){
			// summary: event processor for onmousemove, used only for delayed drags
			// e: Event: mouse event
			var pos = e.touches ? e.touches[0] : e;
      if(Math.abs(pos.clientX - this._lastX) > this.delay || Math.abs(pos.clientY - this._lastY) > this.delay){
				this.onMouseUp(e);
				new this.mover(this.shape, pos, this);
			}
			event.stop(e);
		},
		onMouseUp: function(e){
			// summary: event processor for onmouseup, used only for delayed delayed drags
			// e: Event: mouse event
			this.shape.disconnect(this.events.shift());
			this.shape.disconnect(this.events.shift());
		},
	
		// local events
		onMoveStart: function(/* dojox.gfx.Mover */ mover){
			// summary: called before every move operation
			connect.publish("/gfx/move/start", [mover]);
			domClass.add(win.body(), "dojoMove");
		},
		onMoveStop: function(/* dojox.gfx.Mover */ mover){
			// summary: called after every move operation
			connect.publish("/gfx/move/stop", [mover]);
			domClass.remove(win.body(), "dojoMove");
		},
		onFirstMove: function(/* dojox.gfx.Mover */ mover){
			// summary: called during the very first move notification,
			//	can be used to initialize coordinates, can be overwritten.
	
			// default implementation does nothing
		},
		onMove: function(/* dojox.gfx.Mover */ mover, /* Object */ shift){
			// summary: called during every move notification,
			//	should actually move the node, can be overwritten.
			this.onMoving(mover, shift);
			this.shape.applyLeftTransform(shift);
			this.onMoved(mover, shift);
		},
		onMoving: function(/* dojox.gfx.Mover */ mover, /* Object */ shift){
			// summary: called before every incremental move,
			//	can be overwritten.
	
			// default implementation does nothing
		},
		onMoved: function(/* dojox.gfx.Mover */ mover, /* Object */ shift){
			// summary: called after every incremental move,
			//	can be overwritten.
	
			// default implementation does nothing
		}
	});
});

},
'dijit/_WidgetBase':function(){
define("dijit/_WidgetBase", [
	"require",			// require.toUrl
	"dojo/_base/array", // array.forEach array.map
	"dojo/aspect",
	"dojo/_base/config", // config.blankGif
	"dojo/_base/connect", // connect.connect
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.byId
	"dojo/dom-attr", // domAttr.set domAttr.remove
	"dojo/dom-class", // domClass.add domClass.replace
	"dojo/dom-construct", // domConstruct.create domConstruct.destroy domConstruct.place
	"dojo/dom-geometry",	// isBodyLtr
	"dojo/dom-style", // domStyle.set, domStyle.get
	"dojo/_base/kernel",
	"dojo/_base/lang", // mixin(), isArray(), etc.
	"dojo/on",
	"dojo/ready",
	"dojo/Stateful", // Stateful
	"dojo/topic",
	"dojo/_base/window", // win.doc.createTextNode
	"./registry"	// registry.getUniqueId(), registry.findWidgets()
], function(require, array, aspect, config, connect, declare,
			dom, domAttr, domClass, domConstruct, domGeometry, domStyle, kernel,
			lang, on, ready, Stateful, topic, win, registry){

/*=====
var Stateful = dojo.Stateful;
=====*/

// module:
//		dijit/_WidgetBase
// summary:
//		Future base class for all Dijit widgets.

// For back-compat, remove in 2.0.
if(!kernel.isAsync){
	ready(0, function(){
		var requires = ["dijit/_base/manager"];
		require(requires);	// use indirection so modules not rolled into a build
	});
}

// Nested hash listing attributes for each tag, all strings in lowercase.
// ex: {"div": {"style": true, "tabindex" true}, "form": { ...
var tagAttrs = {};
function getAttrs(obj){
	var ret = {};
	for(var attr in obj){
		ret[attr.toLowerCase()] = true;
	}
	return ret;
}

function nonEmptyAttrToDom(attr){
	// summary:
	//		Returns a setter function that copies the attribute to this.domNode,
	//		or removes the attribute from this.domNode, depending on whether the
	//		value is defined or not.
	return function(val){
		domAttr[val ? "set" : "remove"](this.domNode, attr, val);
		this._set(attr, val);
	};
}

return declare("dijit._WidgetBase", Stateful, {
	// summary:
	//		Future base class for all Dijit widgets.
	// description:
	//		Future base class for all Dijit widgets.
	//		_Widget extends this class adding support for various features needed by desktop.
	//
	//		Provides stubs for widget lifecycle methods for subclasses to extend, like postMixInProperties(), buildRendering(),
	//		postCreate(), startup(), and destroy(), and also public API methods like set(), get(), and watch().
	//
	//		Widgets can provide custom setters/getters for widget attributes, which are called automatically by set(name, value).
	//		For an attribute XXX, define methods _setXXXAttr() and/or _getXXXAttr().
	//
	//		_setXXXAttr can also be a string/hash/array mapping from a widget attribute XXX to the widget's DOMNodes:
	//
	//		- DOM node attribute
	// |		_setFocusAttr: {node: "focusNode", type: "attribute"}
	// |		_setFocusAttr: "focusNode"	(shorthand)
	// |		_setFocusAttr: ""		(shorthand, maps to this.domNode)
	// 		Maps this.focus to this.focusNode.focus, or (last example) this.domNode.focus
	//
	//		- DOM node innerHTML
	//	|		_setTitleAttr: { node: "titleNode", type: "innerHTML" }
	//		Maps this.title to this.titleNode.innerHTML
	//
	//		- DOM node innerText
	//	|		_setTitleAttr: { node: "titleNode", type: "innerText" }
	//		Maps this.title to this.titleNode.innerText
	//
	//		- DOM node CSS class
	// |		_setMyClassAttr: { node: "domNode", type: "class" }
	//		Maps this.myClass to this.domNode.className
	//
	//		If the value of _setXXXAttr is an array, then each element in the array matches one of the
	//		formats of the above list.
	//
	//		If the custom setter is null, no action is performed other than saving the new value
	//		in the widget (in this).
	//
	//		If no custom setter is defined for an attribute, then it will be copied
	//		to this.focusNode (if the widget defines a focusNode), or this.domNode otherwise.
	//		That's only done though for attributes that match DOMNode attributes (title,
	//		alt, aria-labelledby, etc.)

	// id: [const] String
	//		A unique, opaque ID string that can be assigned by users or by the
	//		system. If the developer passes an ID which is known not to be
	//		unique, the specified ID is ignored and the system-generated ID is
	//		used instead.
	id: "",
	_setIdAttr: "domNode",	// to copy to this.domNode even for auto-generated id's

	// lang: [const] String
	//		Rarely used.  Overrides the default Dojo locale used to render this widget,
	//		as defined by the [HTML LANG](http://www.w3.org/TR/html401/struct/dirlang.html#adef-lang) attribute.
	//		Value must be among the list of locales specified during by the Dojo bootstrap,
	//		formatted according to [RFC 3066](http://www.ietf.org/rfc/rfc3066.txt) (like en-us).
	lang: "",
	// set on domNode even when there's a focus node.   but don't set lang="", since that's invalid.
	_setLangAttr: nonEmptyAttrToDom("lang"),

	// dir: [const] String
	//		Bi-directional support, as defined by the [HTML DIR](http://www.w3.org/TR/html401/struct/dirlang.html#adef-dir)
	//		attribute. Either left-to-right "ltr" or right-to-left "rtl".  If undefined, widgets renders in page's
	//		default direction.
	dir: "",
	// set on domNode even when there's a focus node.   but don't set dir="", since that's invalid.
	_setDirAttr: nonEmptyAttrToDom("dir"),	// to set on domNode even when there's a focus node

	// textDir: String
	//		Bi-directional support,	the main variable which is responsible for the direction of the text.
	//		The text direction can be different than the GUI direction by using this parameter in creation
	//		of a widget.
	// 		Allowed values:
	//			1. "ltr"
	//			2. "rtl"
	//			3. "auto" - contextual the direction of a text defined by first strong letter.
	//		By default is as the page direction.
	textDir: "",

	// class: String
	//		HTML class attribute
	"class": "",
	_setClassAttr: { node: "domNode", type: "class" },

	// style: String||Object
	//		HTML style attributes as cssText string or name/value hash
	style: "",

	// title: String
	//		HTML title attribute.
	//
	//		For form widgets this specifies a tooltip to display when hovering over
	//		the widget (just like the native HTML title attribute).
	//
	//		For TitlePane or for when this widget is a child of a TabContainer, AccordionContainer,
	//		etc., it's used to specify the tab label, accordion pane title, etc.
	title: "",

	// tooltip: String
	//		When this widget's title attribute is used to for a tab label, accordion pane title, etc.,
	//		this specifies the tooltip to appear when the mouse is hovered over that text.
	tooltip: "",

	// baseClass: [protected] String
	//		Root CSS class of the widget (ex: dijitTextBox), used to construct CSS classes to indicate
	//		widget state.
	baseClass: "",

	// srcNodeRef: [readonly] DomNode
	//		pointer to original DOM node
	srcNodeRef: null,

	// domNode: [readonly] DomNode
	//		This is our visible representation of the widget! Other DOM
	//		Nodes may by assigned to other properties, usually through the
	//		template system's data-dojo-attach-point syntax, but the domNode
	//		property is the canonical "top level" node in widget UI.
	domNode: null,

	// containerNode: [readonly] DomNode
	//		Designates where children of the source DOM node will be placed.
	//		"Children" in this case refers to both DOM nodes and widgets.
	//		For example, for myWidget:
	//
	//		|	<div data-dojo-type=myWidget>
	//		|		<b> here's a plain DOM node
	//		|		<span data-dojo-type=subWidget>and a widget</span>
	//		|		<i> and another plain DOM node </i>
	//		|	</div>
	//
	//		containerNode would point to:
	//
	//		|		<b> here's a plain DOM node
	//		|		<span data-dojo-type=subWidget>and a widget</span>
	//		|		<i> and another plain DOM node </i>
	//
	//		In templated widgets, "containerNode" is set via a
	//		data-dojo-attach-point assignment.
	//
	//		containerNode must be defined for any widget that accepts innerHTML
	//		(like ContentPane or BorderContainer or even Button), and conversely
	//		is null for widgets that don't, like TextBox.
	containerNode: null,

/*=====
	// _started: Boolean
	//		startup() has completed.
	_started: false,
=====*/

	// attributeMap: [protected] Object
	//		Deprecated.   Instead of attributeMap, widget should have a _setXXXAttr attribute
	//		for each XXX attribute to be mapped to the DOM.
	//
	//		attributeMap sets up a "binding" between attributes (aka properties)
	//		of the widget and the widget's DOM.
	//		Changes to widget attributes listed in attributeMap will be
	//		reflected into the DOM.
	//
	//		For example, calling set('title', 'hello')
	//		on a TitlePane will automatically cause the TitlePane's DOM to update
	//		with the new title.
	//
	//		attributeMap is a hash where the key is an attribute of the widget,
	//		and the value reflects a binding to a:
	//
	//		- DOM node attribute
	// |		focus: {node: "focusNode", type: "attribute"}
	// 		Maps this.focus to this.focusNode.focus
	//
	//		- DOM node innerHTML
	//	|		title: { node: "titleNode", type: "innerHTML" }
	//		Maps this.title to this.titleNode.innerHTML
	//
	//		- DOM node innerText
	//	|		title: { node: "titleNode", type: "innerText" }
	//		Maps this.title to this.titleNode.innerText
	//
	//		- DOM node CSS class
	// |		myClass: { node: "domNode", type: "class" }
	//		Maps this.myClass to this.domNode.className
	//
	//		If the value is an array, then each element in the array matches one of the
	//		formats of the above list.
	//
	//		There are also some shorthands for backwards compatibility:
	//		- string --> { node: string, type: "attribute" }, for example:
	//	|	"focusNode" ---> { node: "focusNode", type: "attribute" }
	//		- "" --> { node: "domNode", type: "attribute" }
	attributeMap: {},

	// _blankGif: [protected] String
	//		Path to a blank 1x1 image.
	//		Used by <img> nodes in templates that really get their image via CSS background-image.
	_blankGif: config.blankGif || require.toUrl("dojo/resources/blank.gif"),

	//////////// INITIALIZATION METHODS ///////////////////////////////////////

	postscript: function(/*Object?*/params, /*DomNode|String*/srcNodeRef){
		// summary:
		//		Kicks off widget instantiation.  See create() for details.
		// tags:
		//		private
		this.create(params, srcNodeRef);
	},

	create: function(/*Object?*/params, /*DomNode|String?*/srcNodeRef){
		// summary:
		//		Kick off the life-cycle of a widget
		// params:
		//		Hash of initialization parameters for widget, including
		//		scalar values (like title, duration etc.) and functions,
		//		typically callbacks like onClick.
		// srcNodeRef:
		//		If a srcNodeRef (DOM node) is specified:
		//			- use srcNodeRef.innerHTML as my contents
		//			- if this is a behavioral widget then apply behavior
		//			  to that srcNodeRef
		//			- otherwise, replace srcNodeRef with my generated DOM
		//			  tree
		// description:
		//		Create calls a number of widget methods (postMixInProperties, buildRendering, postCreate,
		//		etc.), some of which of you'll want to override. See http://dojotoolkit.org/reference-guide/dijit/_WidgetBase.html
		//		for a discussion of the widget creation lifecycle.
		//
		//		Of course, adventurous developers could override create entirely, but this should
		//		only be done as a last resort.
		// tags:
		//		private

		// store pointer to original DOM tree
		this.srcNodeRef = dom.byId(srcNodeRef);

		// For garbage collection.  An array of listener handles returned by this.connect() / this.subscribe()
		this._connects = [];

		// For widgets internal to this widget, invisible to calling code
		this._supportingWidgets = [];

		// this is here for back-compat, remove in 2.0 (but check NodeList-instantiate.html test)
		if(this.srcNodeRef && (typeof this.srcNodeRef.id == "string")){ this.id = this.srcNodeRef.id; }

		// mix in our passed parameters
		if(params){
			this.params = params;
			lang.mixin(this, params);
		}
		this.postMixInProperties();

		// generate an id for the widget if one wasn't specified
		// (be sure to do this before buildRendering() because that function might
		// expect the id to be there.)
		if(!this.id){
			this.id = registry.getUniqueId(this.declaredClass.replace(/\./g,"_"));
		}
		registry.add(this);

		this.buildRendering();

		if(this.domNode){
			// Copy attributes listed in attributeMap into the [newly created] DOM for the widget.
			// Also calls custom setters for all attributes with custom setters.
			this._applyAttributes();

			// If srcNodeRef was specified, then swap out original srcNode for this widget's DOM tree.
			// For 2.0, move this after postCreate().  postCreate() shouldn't depend on the
			// widget being attached to the DOM since it isn't when a widget is created programmatically like
			// new MyWidget({}).   See #11635.
			var source = this.srcNodeRef;
			if(source && source.parentNode && this.domNode !== source){
				source.parentNode.replaceChild(this.domNode, source);
			}
		}

		if(this.domNode){
			// Note: for 2.0 may want to rename widgetId to dojo._scopeName + "_widgetId",
			// assuming that dojo._scopeName even exists in 2.0
			this.domNode.setAttribute("widgetId", this.id);
		}
		this.postCreate();

		// If srcNodeRef has been processed and removed from the DOM (e.g. TemplatedWidget) then delete it to allow GC.
		if(this.srcNodeRef && !this.srcNodeRef.parentNode){
			delete this.srcNodeRef;
		}

		this._created = true;
	},

	_applyAttributes: function(){
		// summary:
		//		Step during widget creation to copy  widget attributes to the
		//		DOM according to attributeMap and _setXXXAttr objects, and also to call
		//		custom _setXXXAttr() methods.
		//
		//		Skips over blank/false attribute values, unless they were explicitly specified
		//		as parameters to the widget, since those are the default anyway,
		//		and setting tabIndex="" is different than not setting tabIndex at all.
		//
		//		For backwards-compatibility reasons attributeMap overrides _setXXXAttr when
		//		_setXXXAttr is a hash/string/array, but _setXXXAttr as a functions override attributeMap.
		// tags:
		//		private

		// Get list of attributes where this.set(name, value) will do something beyond
		// setting this[name] = value.  Specifically, attributes that have:
		//		- associated _setXXXAttr() method/hash/string/array
		//		- entries in attributeMap.
		var ctor = this.constructor,
			list = ctor._setterAttrs;
		if(!list){
			list = (ctor._setterAttrs = []);
			for(var attr in this.attributeMap){
				list.push(attr);
			}

			var proto = ctor.prototype;
			for(var fxName in proto){
				if(fxName in this.attributeMap){ continue; }
				var setterName = "_set" + fxName.replace(/^[a-z]|-[a-zA-Z]/g, function(c){ return c.charAt(c.length-1).toUpperCase(); }) + "Attr";
				if(setterName in proto){
					list.push(fxName);
				}
			}
		}

		// Call this.set() for each attribute that was either specified as parameter to constructor,
		// or was found above and has a default non-null value.   For correlated attributes like value and displayedValue, the one
		// specified as a parameter should take precedence, so apply attributes in this.params last.
		// Particularly important for new DateTextBox({displayedValue: ...}) since DateTextBox's default value is
		// NaN and thus is not ignored like a default value of "".
		array.forEach(list, function(attr){
			if(this.params && attr in this.params){
				// skip this one, do it below
			}else if(this[attr]){
				this.set(attr, this[attr]);
			}
		}, this);
		for(var param in this.params){
			this.set(param, this[param]);
		}
	},

	postMixInProperties: function(){
		// summary:
		//		Called after the parameters to the widget have been read-in,
		//		but before the widget template is instantiated. Especially
		//		useful to set properties that are referenced in the widget
		//		template.
		// tags:
		//		protected
	},

	buildRendering: function(){
		// summary:
		//		Construct the UI for this widget, setting this.domNode.
		//		Most widgets will mixin `dijit._TemplatedMixin`, which implements this method.
		// tags:
		//		protected

		if(!this.domNode){
			// Create root node if it wasn't created by _Templated
			this.domNode = this.srcNodeRef || domConstruct.create('div');
		}

		// baseClass is a single class name or occasionally a space-separated list of names.
		// Add those classes to the DOMNode.  If RTL mode then also add with Rtl suffix.
		// TODO: make baseClass custom setter
		if(this.baseClass){
			var classes = this.baseClass.split(" ");
			if(!this.isLeftToRight()){
				classes = classes.concat( array.map(classes, function(name){ return name+"Rtl"; }));
			}
			domClass.add(this.domNode, classes);
		}
	},

	postCreate: function(){
		// summary:
		//		Processing after the DOM fragment is created
		// description:
		//		Called after the DOM fragment has been created, but not necessarily
		//		added to the document.  Do not include any operations which rely on
		//		node dimensions or placement.
		// tags:
		//		protected
	},

	startup: function(){
		// summary:
		//		Processing after the DOM fragment is added to the document
		// description:
		//		Called after a widget and its children have been created and added to the page,
		//		and all related widgets have finished their create() cycle, up through postCreate().
		//		This is useful for composite widgets that need to control or layout sub-widgets.
		//		Many layout widgets can use this as a wiring phase.
		if(this._started){ return; }
		this._started = true;
		array.forEach(this.getChildren(), function(obj){
			if(!obj._started && !obj._destroyed && lang.isFunction(obj.startup)){
				obj.startup();
				obj._started = true;
			}
		});
	},

	//////////// DESTROY FUNCTIONS ////////////////////////////////

	destroyRecursive: function(/*Boolean?*/ preserveDom){
		// summary:
		// 		Destroy this widget and its descendants
		// description:
		//		This is the generic "destructor" function that all widget users
		// 		should call to cleanly discard with a widget. Once a widget is
		// 		destroyed, it is removed from the manager object.
		// preserveDom:
		//		If true, this method will leave the original DOM structure
		//		alone of descendant Widgets. Note: This will NOT work with
		//		dijit._Templated widgets.

		this._beingDestroyed = true;
		this.destroyDescendants(preserveDom);
		this.destroy(preserveDom);
	},

	destroy: function(/*Boolean*/ preserveDom){
		// summary:
		// 		Destroy this widget, but not its descendants.
		//		This method will, however, destroy internal widgets such as those used within a template.
		// preserveDom: Boolean
		//		If true, this method will leave the original DOM structure alone.
		//		Note: This will not yet work with _Templated widgets

		this._beingDestroyed = true;
		this.uninitialize();

		// remove this.connect() and this.subscribe() listeners
		var c;
		while((c = this._connects.pop())){
			c.remove();
		}

		// destroy widgets created as part of template, etc.
		var w;
		while((w = this._supportingWidgets.pop())){
			if(w.destroyRecursive){
				w.destroyRecursive();
			}else if(w.destroy){
				w.destroy();
			}
		}

		this.destroyRendering(preserveDom);
		registry.remove(this.id);
		this._destroyed = true;
	},

	destroyRendering: function(/*Boolean?*/ preserveDom){
		// summary:
		//		Destroys the DOM nodes associated with this widget
		// preserveDom:
		//		If true, this method will leave the original DOM structure alone
		//		during tear-down. Note: this will not work with _Templated
		//		widgets yet.
		// tags:
		//		protected

		if(this.bgIframe){
			this.bgIframe.destroy(preserveDom);
			delete this.bgIframe;
		}

		if(this.domNode){
			if(preserveDom){
				domAttr.remove(this.domNode, "widgetId");
			}else{
				domConstruct.destroy(this.domNode);
			}
			delete this.domNode;
		}

		if(this.srcNodeRef){
			if(!preserveDom){
				domConstruct.destroy(this.srcNodeRef);
			}
			delete this.srcNodeRef;
		}
	},

	destroyDescendants: function(/*Boolean?*/ preserveDom){
		// summary:
		//		Recursively destroy the children of this widget and their
		//		descendants.
		// preserveDom:
		//		If true, the preserveDom attribute is passed to all descendant
		//		widget's .destroy() method. Not for use with _Templated
		//		widgets.

		// get all direct descendants and destroy them recursively
		array.forEach(this.getChildren(), function(widget){
			if(widget.destroyRecursive){
				widget.destroyRecursive(preserveDom);
			}
		});
	},

	uninitialize: function(){
		// summary:
		//		Stub function. Override to implement custom widget tear-down
		//		behavior.
		// tags:
		//		protected
		return false;
	},

	////////////////// GET/SET, CUSTOM SETTERS, ETC. ///////////////////

	_setStyleAttr: function(/*String||Object*/ value){
		// summary:
		//		Sets the style attribute of the widget according to value,
		//		which is either a hash like {height: "5px", width: "3px"}
		//		or a plain string
		// description:
		//		Determines which node to set the style on based on style setting
		//		in attributeMap.
		// tags:
		//		protected

		var mapNode = this.domNode;

		// Note: technically we should revert any style setting made in a previous call
		// to his method, but that's difficult to keep track of.

		if(lang.isObject(value)){
			domStyle.set(mapNode, value);
		}else{
			if(mapNode.style.cssText){
				mapNode.style.cssText += "; " + value;
			}else{
				mapNode.style.cssText = value;
			}
		}

		this._set("style", value);
	},

	_attrToDom: function(/*String*/ attr, /*String*/ value, /*Object?*/ commands){
		// summary:
		//		Reflect a widget attribute (title, tabIndex, duration etc.) to
		//		the widget DOM, as specified by commands parameter.
		//		If commands isn't specified then it's looked up from attributeMap.
		//		Note some attributes like "type"
		//		cannot be processed this way as they are not mutable.
		//
		// tags:
		//		private

		commands = arguments.length >= 3 ? commands : this.attributeMap[attr];

		array.forEach(lang.isArray(commands) ? commands : [commands], function(command){

			// Get target node and what we are doing to that node
			var mapNode = this[command.node || command || "domNode"];	// DOM node
			var type = command.type || "attribute";	// class, innerHTML, innerText, or attribute

			switch(type){
				case "attribute":
					if(lang.isFunction(value)){ // functions execute in the context of the widget
						value = lang.hitch(this, value);
					}

					// Get the name of the DOM node attribute; usually it's the same
					// as the name of the attribute in the widget (attr), but can be overridden.
					// Also maps handler names to lowercase, like onSubmit --> onsubmit
					var attrName = command.attribute ? command.attribute :
						(/^on[A-Z][a-zA-Z]*$/.test(attr) ? attr.toLowerCase() : attr);

					domAttr.set(mapNode, attrName, value);
					break;
				case "innerText":
					mapNode.innerHTML = "";
					mapNode.appendChild(win.doc.createTextNode(value));
					break;
				case "innerHTML":
					mapNode.innerHTML = value;
					break;
				case "class":
					domClass.replace(mapNode, value, this[attr]);
					break;
			}
		}, this);
	},

	get: function(name){
		// summary:
		//		Get a property from a widget.
		//	name:
		//		The property to get.
		// description:
		//		Get a named property from a widget. The property may
		//		potentially be retrieved via a getter method. If no getter is defined, this
		// 		just retrieves the object's property.
		//
		// 		For example, if the widget has properties `foo` and `bar`
		//		and a method named `_getFooAttr()`, calling:
		//		`myWidget.get("foo")` would be equivalent to calling
		//		`widget._getFooAttr()` and `myWidget.get("bar")`
		//		would be equivalent to the expression
		//		`widget.bar2`
		var names = this._getAttrNames(name);
		return this[names.g] ? this[names.g]() : this[name];
	},

	set: function(name, value){
		// summary:
		//		Set a property on a widget
		//	name:
		//		The property to set.
		//	value:
		//		The value to set in the property.
		// description:
		//		Sets named properties on a widget which may potentially be handled by a
		// 		setter in the widget.
		//
		// 		For example, if the widget has properties `foo` and `bar`
		//		and a method named `_setFooAttr()`, calling
		//		`myWidget.set("foo", "Howdy!")` would be equivalent to calling
		//		`widget._setFooAttr("Howdy!")` and `myWidget.set("bar", 3)`
		//		would be equivalent to the statement `widget.bar = 3;`
		//
		//		set() may also be called with a hash of name/value pairs, ex:
		//
		//	|	myWidget.set({
		//	|		foo: "Howdy",
		//	|		bar: 3
		//	|	});
		//
		//	This is equivalent to calling `set(foo, "Howdy")` and `set(bar, 3)`

		if(typeof name === "object"){
			for(var x in name){
				this.set(x, name[x]);
			}
			return this;
		}
		var names = this._getAttrNames(name),
			setter = this[names.s];
		if(lang.isFunction(setter)){
			// use the explicit setter
			var result = setter.apply(this, Array.prototype.slice.call(arguments, 1));
		}else{
			// Mapping from widget attribute to DOMNode attribute/value/etc.
			// Map according to:
			//		1. attributeMap setting, if one exists (TODO: attributeMap deprecated, remove in 2.0)
			//		2. _setFooAttr: {...} type attribute in the widget (if one exists)
			//		3. apply to focusNode or domNode if standard attribute name, excluding funcs like onClick.
			// Checks if an attribute is a "standard attribute" by whether the DOMNode JS object has a similar
			// attribute name (ex: accept-charset attribute matches jsObject.acceptCharset).
			// Note also that Tree.focusNode() is a function not a DOMNode, so test for that.
			var defaultNode = this.focusNode && !lang.isFunction(this.focusNode) ? "focusNode" : "domNode",
				tag = this[defaultNode].tagName,
				attrsForTag = tagAttrs[tag] || (tagAttrs[tag] = getAttrs(this[defaultNode])),
				map =	name in this.attributeMap ? this.attributeMap[name] :
						names.s in this ? this[names.s] :
						((names.l in attrsForTag && typeof value != "function") ||
							/^aria-|^data-|^role$/.test(name)) ? defaultNode : null;
			if(map != null){
				this._attrToDom(name, value, map);
			}
			this._set(name, value);
		}
		return result || this;
	},

	_attrPairNames: {},		// shared between all widgets
	_getAttrNames: function(name){
		// summary:
		//		Helper function for get() and set().
		//		Caches attribute name values so we don't do the string ops every time.
		// tags:
		//		private

		var apn = this._attrPairNames;
		if(apn[name]){ return apn[name]; }
		var uc = name.replace(/^[a-z]|-[a-zA-Z]/g, function(c){ return c.charAt(c.length-1).toUpperCase(); });
		return (apn[name] = {
			n: name+"Node",
			s: "_set"+uc+"Attr",	// converts dashes to camel case, ex: accept-charset --> _setAcceptCharsetAttr
			g: "_get"+uc+"Attr",
			l: uc.toLowerCase()		// lowercase name w/out dashes, ex: acceptcharset
		});
	},

	_set: function(/*String*/ name, /*anything*/ value){
		// summary:
		//		Helper function to set new value for specified attribute, and call handlers
		//		registered with watch() if the value has changed.
		var oldValue = this[name];
		this[name] = value;
		if(this._watchCallbacks && this._created && value !== oldValue){
			this._watchCallbacks(name, oldValue, value);
		}
	},

	on: function(/*String*/ type, /*Function*/ func){
		// summary:
		//		Call specified function when event occurs, ex: myWidget.on("click", function(){ ... }).
		// description:
		//		Call specified function when event `type` occurs, ex: `myWidget.on("click", function(){ ... })`.
		//		Note that the function is not run in any particular scope, so if (for example) you want it to run in the
		//		widget's scope you must do `myWidget.on("click", lang.hitch(myWidget, func))`.

		return aspect.after(this, this._onMap(type), func, true);
	},

	_onMap: function(/*String*/ type){
		// summary:
		//		Maps on() type parameter (ex: "mousemove") to method name (ex: "onMouseMove")
		var ctor = this.constructor, map = ctor._onMap;
		if(!map){
			map = (ctor._onMap = {});
			for(var attr in ctor.prototype){
				if(/^on/.test(attr)){
					map[attr.replace(/^on/, "").toLowerCase()] = attr;
				}
			}
		}
		return map[type.toLowerCase()];	// String
	},

	toString: function(){
		// summary:
		//		Returns a string that represents the widget
		// description:
		//		When a widget is cast to a string, this method will be used to generate the
		//		output. Currently, it does not implement any sort of reversible
		//		serialization.
		return '[Widget ' + this.declaredClass + ', ' + (this.id || 'NO ID') + ']'; // String
	},

	getChildren: function(){
		// summary:
		//		Returns all the widgets contained by this, i.e., all widgets underneath this.containerNode.
		//		Does not return nested widgets, nor widgets that are part of this widget's template.
		return this.containerNode ? registry.findWidgets(this.containerNode) : []; // dijit._Widget[]
	},

	getParent: function(){
		// summary:
		//		Returns the parent widget of this widget
		return registry.getEnclosingWidget(this.domNode.parentNode);
	},

	connect: function(
			/*Object|null*/ obj,
			/*String|Function*/ event,
			/*String|Function*/ method){
		// summary:
		//		Connects specified obj/event to specified method of this object
		//		and registers for disconnect() on widget destroy.
		// description:
		//		Provide widget-specific analog to dojo.connect, except with the
		//		implicit use of this widget as the target object.
		//		Events connected with `this.connect` are disconnected upon
		//		destruction.
		// returns:
		//		A handle that can be passed to `disconnect` in order to disconnect before
		//		the widget is destroyed.
		// example:
		//	|	var btn = new dijit.form.Button();
		//	|	// when foo.bar() is called, call the listener we're going to
		//	|	// provide in the scope of btn
		//	|	btn.connect(foo, "bar", function(){
		//	|		console.debug(this.toString());
		//	|	});
		// tags:
		//		protected

		var handle = connect.connect(obj, event, this, method);
		this._connects.push(handle);
		return handle;		// _Widget.Handle
	},

	disconnect: function(handle){
		// summary:
		//		Disconnects handle created by `connect`.
		//		Also removes handle from this widget's list of connects.
		// tags:
		//		protected
		var i = array.indexOf(this._connects, handle);
		if(i != -1){
			handle.remove();
			this._connects.splice(i, 1);
		}
	},

	subscribe: function(t, method){
		// summary:
		//		Subscribes to the specified topic and calls the specified method
		//		of this object and registers for unsubscribe() on widget destroy.
		// description:
		//		Provide widget-specific analog to dojo.subscribe, except with the
		//		implicit use of this widget as the target object.
		// t: String
		//		The topic
		// method: Function
		//		The callback
		// example:
		//	|	var btn = new dijit.form.Button();
		//	|	// when /my/topic is published, this button changes its label to
		//	|   // be the parameter of the topic.
		//	|	btn.subscribe("/my/topic", function(v){
		//	|		this.set("label", v);
		//	|	});
		// tags:
		//		protected
		var handle = topic.subscribe(t, lang.hitch(this, method));
		this._connects.push(handle);
		return handle;		// _Widget.Handle
	},

	unsubscribe: function(/*Object*/ handle){
		// summary:
		//		Unsubscribes handle created by this.subscribe.
		//		Also removes handle from this widget's list of subscriptions
		// tags:
		//		protected
		this.disconnect(handle);
	},

	isLeftToRight: function(){
		// summary:
		//		Return this widget's explicit or implicit orientation (true for LTR, false for RTL)
		// tags:
		//		protected
		return this.dir ? (this.dir == "ltr") : domGeometry.isBodyLtr(); //Boolean
	},

	isFocusable: function(){
		// summary:
		//		Return true if this widget can currently be focused
		//		and false if not
		return this.focus && (domStyle.get(this.domNode, "display") != "none");
	},

	placeAt: function(/* String|DomNode|_Widget */reference, /* String?|Int? */position){
		// summary:
		//		Place this widget's domNode reference somewhere in the DOM based
		//		on standard domConstruct.place conventions, or passing a Widget reference that
		//		contains and addChild member.
		//
		// description:
		//		A convenience function provided in all _Widgets, providing a simple
		//		shorthand mechanism to put an existing (or newly created) Widget
		//		somewhere in the dom, and allow chaining.
		//
		// reference:
		//		The String id of a domNode, a domNode reference, or a reference to a Widget possessing
		//		an addChild method.
		//
		// position:
		//		If passed a string or domNode reference, the position argument
		//		accepts a string just as domConstruct.place does, one of: "first", "last",
		//		"before", or "after".
		//
		//		If passed a _Widget reference, and that widget reference has an ".addChild" method,
		//		it will be called passing this widget instance into that method, supplying the optional
		//		position index passed.
		//
		// returns:
		//		dijit._Widget
		//		Provides a useful return of the newly created dijit._Widget instance so you
		//		can "chain" this function by instantiating, placing, then saving the return value
		//		to a variable.
		//
		// example:
		// | 	// create a Button with no srcNodeRef, and place it in the body:
		// | 	var button = new dijit.form.Button({ label:"click" }).placeAt(win.body());
		// | 	// now, 'button' is still the widget reference to the newly created button
		// | 	button.on("click", function(e){ console.log('click'); }));
		//
		// example:
		// |	// create a button out of a node with id="src" and append it to id="wrapper":
		// | 	var button = new dijit.form.Button({},"src").placeAt("wrapper");
		//
		// example:
		// |	// place a new button as the first element of some div
		// |	var button = new dijit.form.Button({ label:"click" }).placeAt("wrapper","first");
		//
		// example:
		// |	// create a contentpane and add it to a TabContainer
		// |	var tc = dijit.byId("myTabs");
		// |	new dijit.layout.ContentPane({ href:"foo.html", title:"Wow!" }).placeAt(tc)

		if(reference.declaredClass && reference.addChild){
			reference.addChild(this, position);
		}else{
			domConstruct.place(this.domNode, reference, position);
		}
		return this;
	},

	getTextDir: function(/*String*/ text,/*String*/ originalDir){
		// summary:
		//		Return direction of the text.
		//		The function overridden in the _BidiSupport module,
		//		its main purpose is to calculate the direction of the
		//		text, if was defined by the programmer through textDir.
		//	tags:
		//		protected.
		return originalDir;
	},

	applyTextDir: function(/*===== element, text =====*/){
		// summary:
		//		The function overridden in the _BidiSupport module,
		//		originally used for setting element.dir according to this.textDir.
		//		In this case does nothing.
		// element: DOMNode
		// text: String
		// tags:
		//		protected.
	},

	defer: function(fcn, delay){ 
		// summary:
		//		Wrapper to setTimeout to avoid deferred functions executing
		//		after the originating widget has been destroyed.
		//		Returns an object handle with a remove method (that returns null) (replaces clearTimeout).
		// fcn: function reference
		// delay: Optional number (defaults to 0)
		// tags:
		//		protected.
		var timer = setTimeout(lang.hitch(this, 
			function(){ 
				timer = null;
				if(!this._destroyed){ 
					lang.hitch(this, fcn)(); 
				} 
			}),
			delay || 0
		);
		return {
			remove:	function(){
					if(timer){
						clearTimeout(timer);
						timer = null;
					}
					return null; // so this works well: handle = handle.remove();
				}
		};
	}
});

});

},
'dojox/grid/_Grid':function(){
require({cache:{
'url:dojox/grid/resources/_Grid.html':"<div hidefocus=\"hidefocus\" role=\"grid\" dojoAttachEvent=\"onmouseout:_mouseOut\">\r\n\t<div class=\"dojoxGridMasterHeader\" dojoAttachPoint=\"viewsHeaderNode\" role=\"presentation\"></div>\r\n\t<div class=\"dojoxGridMasterView\" dojoAttachPoint=\"viewsNode\" role=\"presentation\"></div>\r\n\t<div class=\"dojoxGridMasterMessages\" style=\"display: none;\" dojoAttachPoint=\"messagesNode\"></div>\r\n\t<span dojoAttachPoint=\"lastFocusNode\" tabindex=\"0\"></span>\r\n</div>\r\n"}});
define("dojox/grid/_Grid", [
	"dojo/_base/kernel",
	"../main",
	"dojo/_base/declare",
	"./_Events",
	"./_Scroller",
	"./_Layout",
	"./_View",
	"./_ViewManager",
	"./_RowManager",
	"./_FocusManager",
	"./_EditManager",
	"./Selection",
	"./_RowSelector",
	"./util",
	"dijit/_Widget",
	"dijit/_TemplatedMixin",
	"dijit/CheckedMenuItem",
	"dojo/text!./resources/_Grid.html",
	"dojo/string",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/_base/sniff",
	"dojox/html/metrics",
	"dojo/_base/html",
	"dojo/query",
	"dojo/dnd/common",
	"dojo/i18n!dijit/nls/loading"
], function(dojo, dojox, declare, _Events, _Scroller, _Layout, _View, _ViewManager,
	_RowManager, _FocusManager, _EditManager, Selection, _RowSelector, util, _Widget,
	 _TemplatedMixin, CheckedMenuItem, template, string, array, lang, has, metrics, html, query){

	// NOTE: this is for backwards compatibility with Dojo 1.3
	if(!dojo.isCopyKey){
		dojo.isCopyKey = dojo.dnd.getCopyKeyState;
	}
	/*=====
	dojox.grid.__CellDef = function(){
		//	name: String?
		//		The text to use in the header of the grid for this cell.
		//	get: Function?
		//		function(rowIndex){} rowIndex is of type Integer.  This
		//		function will be called when a cell	requests data.  Returns the
		//		unformatted data for the cell.
		//	value: String?
		//		If "get" is not specified, this is used as the data for the cell.
		//	defaultValue: String?
		//		If "get" and "value" aren't specified or if "get" returns an undefined
		//		value, this is used as the data for the cell.  "formatter" is not run
		//		on this if "get" returns an undefined value.
		//	formatter: Function?
		//		function(data, rowIndex){} data is of type anything, rowIndex
		//		is of type Integer.  This function will be called after the cell
		//		has its data but before it passes it back to the grid to render.
		//		Returns the formatted version of the cell's data.
		//	type: dojox.grid.cells._Base|Function?
		//		TODO
		//	editable: Boolean?
		//		Whether this cell should be editable or not.
		//	hidden: Boolean?
		//		If true, the cell will not be displayed.
		//	noresize: Boolean?
		//		If true, the cell will not be able to be resized.
		//	width: Integer|String?
		//		A CSS size.  If it's an Integer, the width will be in em's.
		//	colSpan: Integer?
		//		How many columns to span this cell.  Will not work in the first
		//		sub-row of cells.
		//	rowSpan: Integer?
		//		How many sub-rows to span this cell.
		//	styles: String?
		//		A string of styles to apply to both the header cell and main
		//		grid cells.  Must end in a ';'.
		//	headerStyles: String?
		//		A string of styles to apply to just the header cell.  Must end
		//		in a ';'
		//	cellStyles: String?
		//		A string of styles to apply to just the main grid cells.  Must
		//		end in a ';'
		//	classes: String?
		//		A space separated list of classes to apply to both the header
		//		cell and the main grid cells.
		//	headerClasses: String?
		//		A space separated list of classes to apply to just the header
		//		cell.
		//	cellClasses: String?
		//		A space separated list of classes to apply to just the main
		//		grid cells.
		//	attrs: String?
		//		A space separated string of attribute='value' pairs to add to
		//		the header cell element and main grid cell elements.
		this.name = name;
		this.value = value;
		this.get = get;
		this.formatter = formatter;
		this.type = type;
		this.editable = editable;
		this.hidden = hidden;
		this.width = width;
		this.colSpan = colSpan;
		this.rowSpan = rowSpan;
		this.styles = styles;
		this.headerStyles = headerStyles;
		this.cellStyles = cellStyles;
		this.classes = classes;
		this.headerClasses = headerClasses;
		this.cellClasses = cellClasses;
		this.attrs = attrs;
	}
	=====*/

	/*=====
	dojox.grid.__ViewDef = function(){
		//	noscroll: Boolean?
		//		If true, no scrollbars will be rendered without scrollbars.
		//	width: Integer|String?
		//		A CSS size.  If it's an Integer, the width will be in em's. If
		//		"noscroll" is true, this value is ignored.
		//	cells: dojox.grid.__CellDef[]|Array[dojox.grid.__CellDef[]]?
		//		The structure of the cells within this grid.
		//	type: String?
		//		A string containing the constructor of a subclass of
		//		dojox.grid._View.  If this is not specified, dojox.grid._View
		//		is used.
		//	defaultCell: dojox.grid.__CellDef?
		//		A cell definition with default values for all cells in this view.  If
		//		a property is defined in a cell definition in the "cells" array and
		//		this property, the cell definition's property will override this
		//		property's property.
		//	onBeforeRow: Function?
		//		function(rowIndex, cells){} rowIndex is of type Integer, cells
		//		is of type Array[dojox.grid.__CellDef[]].  This function is called
		//		before each row of data is rendered.  Before the header is
		//		rendered, rowIndex will be -1.  "cells" is a reference to the
		//		internal structure of this view's cells so any changes you make to
		//		it will persist between calls.
		//	onAfterRow: Function?
		//		function(rowIndex, cells, rowNode){} rowIndex is of type Integer, cells
		//		is of type Array[dojox.grid.__CellDef[]], rowNode is of type DOMNode.
		//		This function is called	after each row of data is rendered.  After the
		//		header is rendered, rowIndex will be -1.  "cells" is a reference to the
		//		internal structure of this view's cells so any changes you make to
		//		it will persist between calls.
		this.noscroll = noscroll;
		this.width = width;
		this.cells = cells;
		this.type = type;
		this.defaultCell = defaultCell;
		this.onBeforeRow = onBeforeRow;
		this.onAfterRow = onAfterRow;
	}
	=====*/

	var _Grid = declare('dojox.grid._Grid',
		[ _Widget, _TemplatedMixin, _Events ],
		{
		// summary:
		// 		A grid widget with virtual scrolling, cell editing, complex rows,
		// 		sorting, fixed columns, sizeable columns, etc.
		//
		//	description:
		//		_Grid provides the full set of grid features without any
		//		direct connection to a data store.
		//
		//		The grid exposes a get function for the grid, or optionally
		//		individual columns, to populate cell contents.
		//
		//		The grid is rendered based on its structure, an object describing
		//		column and cell layout.
		//
		//	example:
		//		A quick sample:
		//
		//		define a get function
		//	|	function get(inRowIndex){ // called in cell context
		//	|		return [this.index, inRowIndex].join(', ');
		//	|	}
		//
		//		define the grid structure:
		//	|	var structure = [ // array of view objects
		//	|		{ cells: [// array of rows, a row is an array of cells
		//	|			[
		//	|				{ name: "Alpha", width: 6 },
		//	|				{ name: "Beta" },
		//	|				{ name: "Gamma", get: get }]
		//	|		]}
		//	|	];
		//
		//	|	<div id="grid"
		//	|		rowCount="100" get="get"
		//	|		structure="structure"
		//	|		dojoType="dojox.grid._Grid"></div>

		templateString: template,

		// classTag: String
		// 		CSS class applied to the grid's domNode
		classTag: 'dojoxGrid',

		// settings
		// rowCount: Integer
		//		Number of rows to display.
		rowCount: 5,

		// keepRows: Integer
		//		Number of rows to keep in the rendering cache.
		keepRows: 75,

		// rowsPerPage: Integer
		//		Number of rows to render at a time.
		rowsPerPage: 25,

		// autoWidth: Boolean
		//		If autoWidth is true, grid width is automatically set to fit the data.
		autoWidth: false,
		
		// initialWidth: String
		//		A css string to use to set our initial width (only used if autoWidth
		//		is true).  The first rendering of the grid will be this width, any
		//		resizing of columns, etc will result in the grid switching to
		//		autoWidth mode.  Note, this width will override any styling in a
		//		stylesheet or directly on the node.
		initialWidth: "",

		// autoHeight: Boolean|Integer
		//		If autoHeight is true, grid height is automatically set to fit the data.
		//		If it is an integer, the height will be automatically set to fit the data
		//		if there are fewer than that many rows - and the height will be set to show
		//		that many rows if there are more
		autoHeight: '',

		// rowHeight: Integer
		//		If rowHeight is set to a positive number, it will define the height of the rows
		//		in pixels. This can provide a significant performance advantage, since it
		//		eliminates the need to measure row sizes during rendering, which is one
		// 		the primary bottlenecks in the DataGrid's performance.
		rowHeight: 0,
		
		// autoRender: Boolean
		//		If autoRender is true, grid will render itself after initialization.
		autoRender: true,

		// defaultHeight: String
		//		default height of the grid, measured in any valid css unit.
		defaultHeight: '15em',
		
		// height: String
		//		explicit height of the grid, measured in any valid css unit.  This will be populated (and overridden)
		//		if the height: css attribute exists on the source node.
		height: '',

		// structure: dojox.grid.__ViewDef|dojox.grid.__ViewDef[]|dojox.grid.__CellDef[]|Array[dojox.grid.__CellDef[]]
		//		View layout defintion.
		structure: null,

		// elasticView: Integer
		//	Override defaults and make the indexed grid view elastic, thus filling available horizontal space.
		elasticView: -1,

		// singleClickEdit: boolean
		//		Single-click starts editing. Default is double-click
		singleClickEdit: false,

		// selectionMode: String
		//		Set the selection mode of grid's Selection.  Value must be 'single', 'multiple',
		//		or 'extended'.  Default is 'extended'.
		selectionMode: 'extended',

		// rowSelector: Boolean|String
		// 		If set to true, will add a row selector view to this grid.  If set to a CSS width, will add
		// 		a row selector of that width to this grid.
		rowSelector: '',

		// columnReordering: Boolean
		// 		If set to true, will add drag and drop reordering to views with one row of columns.
		columnReordering: false,

		// headerMenu: dijit.Menu
		// 		If set to a dijit.Menu, will use this as a context menu for the grid headers.
		headerMenu: null,

		// placeholderLabel: String
		// 		Label of placeholders to search for in the header menu to replace with column toggling
		// 		menu items.
		placeholderLabel: "GridColumns",
		
		// selectable: Boolean
		//		Set to true if you want to be able to select the text within the grid.
		selectable: false,
		
		// Used to store the last two clicks, to ensure double-clicking occurs based on the intended row
		_click: null,
		
		// loadingMessage: String
		//  Message that shows while the grid is loading
		loadingMessage: "<span class='dojoxGridLoading'>${loadingState}</span>",

		// errorMessage: String
		//  Message that shows when the grid encounters an error loading
		errorMessage: "<span class='dojoxGridError'>${errorState}</span>",

		// noDataMessage: String
		//  Message that shows if the grid has no data - wrap it in a
		//  span with class 'dojoxGridNoData' if you want it to be
		//  styled similar to the loading and error messages
		noDataMessage: "",
		
		// escapeHTMLInData: Boolean
		//		This will escape HTML brackets from the data to prevent HTML from
		// 		user-inputted data being rendered with may contain JavaScript and result in
		// 		XSS attacks. This is true by default, and it is recommended that it remain
		// 		true. Setting this to false will allow data to be displayed in the grid without
		// 		filtering, and should be only used if it is known that the data won't contain
		// 		malicious scripts. If HTML is needed in grid cells, it is recommended that
		// 		you use the formatter function to generate the HTML (the output of
		// 		formatter functions is not filtered, even with escapeHTMLInData set to true).
		escapeHTMLInData: true,
		
		// formatterScope: Object
		//		An object to execute format functions within.  If not set, the
		//		format functions will execute within the scope of the cell that
		//		has a format function.
		formatterScope: null,
		
		// editable: boolean
		// indicates if the grid contains editable cells, default is false
		// set to true if editable cell encountered during rendering
		editable: false,
		
		// private
		sortInfo: 0,
		themeable: true,
		_placeholders: null,

		// _layoutClass: Object
		//	The class to use for our layout - can be overridden by grid subclasses
		_layoutClass: _Layout,

		// initialization
		buildRendering: function(){
			this.inherited(arguments);
			if(!this.domNode.getAttribute('tabIndex')){
				this.domNode.tabIndex = "0";
			}
			this.createScroller();
			this.createLayout();
			this.createViews();
			this.createManagers();

			this.createSelection();

			this.connect(this.selection, "onSelected", "onSelected");
			this.connect(this.selection, "onDeselected", "onDeselected");
			this.connect(this.selection, "onChanged", "onSelectionChanged");

			metrics.initOnFontResize();
			this.connect(metrics, "onFontResize", "textSizeChanged");
			util.funnelEvents(this.domNode, this, 'doKeyEvent', util.keyEvents);
			if (this.selectionMode != "none") {
				this.domNode.setAttribute("aria-multiselectable", this.selectionMode == "single" ? "false" : "true");
			}

			html.addClass(this.domNode, this.classTag);
			if(!this.isLeftToRight()){
				html.addClass(this.domNode, this.classTag+"Rtl");
			}
		},
		
		postMixInProperties: function(){
			this.inherited(arguments);
			var messages = dojo.i18n.getLocalization("dijit", "loading", this.lang);
			this.loadingMessage = string.substitute(this.loadingMessage, messages);
			this.errorMessage = string.substitute(this.errorMessage, messages);
			if(this.srcNodeRef && this.srcNodeRef.style.height){
				this.height = this.srcNodeRef.style.height;
			}
			// Call this to update our autoheight to start out
			this._setAutoHeightAttr(this.autoHeight, true);
			this.lastScrollTop = this.scrollTop = 0;
		},
		
		postCreate: function(){
			this._placeholders = [];
			this._setHeaderMenuAttr(this.headerMenu);
			this._setStructureAttr(this.structure);
			this._click = [];
			this.inherited(arguments);
			if(this.domNode && this.autoWidth && this.initialWidth){
				this.domNode.style.width = this.initialWidth;
			}
			if (this.domNode && !this.editable){
				// default value for aria-readonly is false, set to true if grid is not editable
				html.attr(this.domNode,"aria-readonly", "true");
			}
		},

		destroy: function(){
			this.domNode.onReveal = null;
			this.domNode.onSizeChange = null;

			// Fixes IE domNode leak
			delete this._click;

			if(this.scroller){
				this.scroller.destroy();
				delete this.scroller;
			}
			this.edit.destroy();
			delete this.edit;
			this.views.destroyViews();
			if(this.focus){
				this.focus.destroy();
				delete this.focus;
			}
			if(this.headerMenu&&this._placeholders.length){
				array.forEach(this._placeholders, function(p){ p.unReplace(true); });
				this.headerMenu.unBindDomNode(this.viewsHeaderNode);
			}
			this.inherited(arguments);
		},

		_setAutoHeightAttr: function(ah, skipRender){
			// Calculate our autoheight - turn it into a boolean or an integer
			if(typeof ah == "string"){
				if(!ah || ah == "false"){
					ah = false;
				}else if (ah == "true"){
					ah = true;
				}else{
					ah = window.parseInt(ah, 10);
				}
			}
			if(typeof ah == "number"){
				if(isNaN(ah)){
					ah = false;
				}
				// Autoheight must be at least 1, if it's a number.  If it's
				// less than 0, we'll take that to mean "all" rows (same as
				// autoHeight=true - if it is equal to zero, we'll take that
				// to mean autoHeight=false
				if(ah < 0){
					ah = true;
				}else if (ah === 0){
					ah = false;
				}
			}
			this.autoHeight = ah;
			if(typeof ah == "boolean"){
				this._autoHeight = ah;
			}else if(typeof ah == "number"){
				this._autoHeight = (ah >= this.get('rowCount'));
			}else{
				this._autoHeight = false;
			}
			if(this._started && !skipRender){
				this.render();
			}
		},

		_getRowCountAttr: function(){
			return this.updating && this.invalidated && this.invalidated.rowCount != undefined ?
				this.invalidated.rowCount : this.rowCount;
		},
		
		textSizeChanged: function(){
			this.render();
		},

		sizeChange: function(){
			this.update();
		},

		createManagers: function(){
			// summary:
			//		create grid managers for various tasks including rows, focus, selection, editing

			// row manager
			this.rows = new _RowManager(this);
			// focus manager
			this.focus = new _FocusManager(this);
			// edit manager
			this.edit = new _EditManager(this);
		},

		createSelection: function(){
			// summary:	Creates a new Grid selection manager.

			// selection manager
			this.selection = new Selection(this);
		},

		createScroller: function(){
			// summary: Creates a new virtual scroller
			this.scroller = new _Scroller();
			this.scroller.grid = this;
			this.scroller.renderRow = lang.hitch(this, "renderRow");
			this.scroller.removeRow = lang.hitch(this, "rowRemoved");
		},

		createLayout: function(){
			// summary: Creates a new Grid layout
			this.layout = new this._layoutClass(this);
			this.connect(this.layout, "moveColumn", "onMoveColumn");
		},

		onMoveColumn: function(){
			this.render();
		},
		
		onResizeColumn: function(/*int*/ cellIdx){
			// Called when a column is resized.
		},

		// views
		createViews: function(){
			this.views = new _ViewManager(this);
			this.views.createView = lang.hitch(this, "createView");
		},

		createView: function(inClass, idx){
			var c = lang.getObject(inClass);
			var view = new c({ grid: this, index: idx });
			this.viewsNode.appendChild(view.domNode);
			this.viewsHeaderNode.appendChild(view.headerNode);
			this.views.addView(view);
			html.attr(this.domNode, "align", this.isLeftToRight() ? 'left' : 'right');
			return view;
		},

		buildViews: function(){
			for(var i=0, vs; (vs=this.layout.structure[i]); i++){
				this.createView(vs.type || dojox._scopeName + ".grid._View", i).setStructure(vs);
			}
			this.scroller.setContentNodes(this.views.getContentNodes());
		},

		_setStructureAttr: function(structure){
			var s = structure;
			if(s && lang.isString(s)){
				dojo.deprecated("dojox.grid._Grid.set('structure', 'objVar')", "use dojox.grid._Grid.set('structure', objVar) instead", "2.0");
				s=lang.getObject(s);
			}
			this.structure = s;
			if(!s){
				if(this.layout.structure){
					s = this.layout.structure;
				}else{
					return;
				}
			}
			this.views.destroyViews();
			this.focus.focusView = null;
			if(s !== this.layout.structure){
				this.layout.setStructure(s);
			}
			this._structureChanged();
		},

		setStructure: function(/* dojox.grid.__ViewDef|dojox.grid.__ViewDef[]|dojox.grid.__CellDef[]|Array[dojox.grid.__CellDef[]] */ inStructure){
			// summary:
			//		Install a new structure and rebuild the grid.
			dojo.deprecated("dojox.grid._Grid.setStructure(obj)", "use dojox.grid._Grid.set('structure', obj) instead.", "2.0");
			this._setStructureAttr(inStructure);
		},
		
		getColumnTogglingItems: function(){
			// Summary: returns an array of dijit.CheckedMenuItem widgets that can be
			//		added to a menu for toggling columns on and off.
			var items, checkedItems = [];
			items = array.map(this.layout.cells, function(cell){
				if(!cell.menuItems){ cell.menuItems = []; }

				var self = this;
				var item = new CheckedMenuItem({
					label: cell.name,
					checked: !cell.hidden,
					_gridCell: cell,
					onChange: function(checked){
						if(self.layout.setColumnVisibility(this._gridCell.index, checked)){
							var items = this._gridCell.menuItems;
							if(items.length > 1){
								array.forEach(items, function(item){
									if(item !== this){
										item.setAttribute("checked", checked);
									}
								}, this);
							}
							checked = array.filter(self.layout.cells, function(c){
								if(c.menuItems.length > 1){
									array.forEach(c.menuItems, "item.set('disabled', false);");
								}else{
									c.menuItems[0].set('disabled', false);
								}
								return !c.hidden;
							});
							if(checked.length == 1){
								array.forEach(checked[0].menuItems, "item.set('disabled', true);");
							}
						}
					},
					destroy: function(){
						var index = array.indexOf(this._gridCell.menuItems, this);
						this._gridCell.menuItems.splice(index, 1);
						delete this._gridCell;
						CheckedMenuItem.prototype.destroy.apply(this, arguments);
					}
				});
				cell.menuItems.push(item);
				if(!cell.hidden) {
					checkedItems.push(item);
				}
				return item;
			}, this); // dijit.CheckedMenuItem[]
			if(checkedItems.length == 1) {
				checkedItems[0].set('disabled', true);
			}
			return items;
		},

		_setHeaderMenuAttr: function(menu){
			if(this._placeholders && this._placeholders.length){
				array.forEach(this._placeholders, function(p){
					p.unReplace(true);
				});
				this._placeholders = [];
			}
			if(this.headerMenu){
				this.headerMenu.unBindDomNode(this.viewsHeaderNode);
			}
			this.headerMenu = menu;
			if(!menu){ return; }

			this.headerMenu.bindDomNode(this.viewsHeaderNode);
			if(this.headerMenu.getPlaceholders){
				this._placeholders = this.headerMenu.getPlaceholders(this.placeholderLabel);
			}
		},

		setHeaderMenu: function(/* dijit.Menu */ menu){
			dojo.deprecated("dojox.grid._Grid.setHeaderMenu(obj)", "use dojox.grid._Grid.set('headerMenu', obj) instead.", "2.0");
			this._setHeaderMenuAttr(menu);
		},
		
		setupHeaderMenu: function(){
			if(this._placeholders && this._placeholders.length){
				array.forEach(this._placeholders, function(p){
					if(p._replaced){
						p.unReplace(true);
					}
					p.replace(this.getColumnTogglingItems());
				}, this);
			}
		},

		_fetch: function(start){
			this.setScrollTop(0);
		},

		getItem: function(inRowIndex){
			return null;
		},
		
		showMessage: function(message){
			if(message){
				this.messagesNode.innerHTML = message;
				this.messagesNode.style.display = "";
			}else{
				this.messagesNode.innerHTML = "";
				this.messagesNode.style.display = "none";
			}
		},

		_structureChanged: function() {
			this.buildViews();
			if(this.autoRender && this._started){
				this.render();
			}
		},

		hasLayout: function() {
			return this.layout.cells.length;
		},

		// sizing
		resize: function(changeSize, resultSize){
			// summary:
			//		Update the grid's rendering dimensions and resize it
			
			// Calling sizeChange calls update() which calls _resize...so let's
			// save our input values, if any, and use them there when it gets
			// called.  This saves us an extra call to _resize(), which can
			// get kind of heavy.
			
			// fixes #11101, should ignore resize when in autoheight mode(IE) to avoid a deadlock
			// e.g when an autoheight editable grid put in dijit.form.Form or other similar containers,
			// grid switch to editing mode --> grid height change --> From height change
			// ---> Form call grid.resize() ---> grid height change  --> deaklock
			if(dojo.isIE && !changeSize && !resultSize && this._autoHeight){
				return;
			}
			this._pendingChangeSize = changeSize;
			this._pendingResultSize = resultSize;
			this.sizeChange();
		},

		_getPadBorder: function() {
			this._padBorder = this._padBorder || html._getPadBorderExtents(this.domNode);
			return this._padBorder;
		},

		_getHeaderHeight: function(){
			var vns = this.viewsHeaderNode.style, t = vns.display == "none" ? 0 : this.views.measureHeader();
			vns.height = t + 'px';
			// header heights are reset during measuring so must be normalized after measuring.
			this.views.normalizeHeaderNodeHeight();
			return t;
		},
		
		_resize: function(changeSize, resultSize){
			// Restore our pending values, if any
			changeSize = changeSize || this._pendingChangeSize;
			resultSize = resultSize || this._pendingResultSize;
			delete this._pendingChangeSize;
			delete this._pendingResultSize;
			// if we have set up everything except the DOM, we cannot resize
			if(!this.domNode){ return; }
			var pn = this.domNode.parentNode;
			if(!pn || pn.nodeType != 1 || !this.hasLayout() || pn.style.visibility == "hidden" || pn.style.display == "none"){
				return;
			}
			// useful measurement
			var padBorder = this._getPadBorder();
			var hh = undefined;
			var h;
			// grid height
			if(this._autoHeight){
				this.domNode.style.height = 'auto';
			}else if(typeof this.autoHeight == "number"){
				h = hh = this._getHeaderHeight();
				h += (this.scroller.averageRowHeight * this.autoHeight);
				this.domNode.style.height = h + "px";
			}else if(this.domNode.clientHeight <= padBorder.h){
				if(pn == document.body){
					this.domNode.style.height = this.defaultHeight;
				}else if(this.height){
					this.domNode.style.height = this.height;
				}else{
					this.fitTo = "parent";
				}
			}
			// if we are given dimensions, size the grid's domNode to those dimensions
			if(resultSize){
				changeSize = resultSize;
			}
			if(!this._autoHeight && changeSize){
				html.marginBox(this.domNode, changeSize);
				this.height = this.domNode.style.height;
				delete this.fitTo;
			}else if(this.fitTo == "parent"){
				h = this._parentContentBoxHeight = this._parentContentBoxHeight || html._getContentBox(pn).h;
				this.domNode.style.height = Math.max(0, h) + "px";
			}
			
			var hasFlex = array.some(this.views.views, function(v){ return v.flexCells; });

			if(!this._autoHeight && (h || html._getContentBox(this.domNode).h) === 0){
				// We need to hide the header, since the Grid is essentially hidden.
				this.viewsHeaderNode.style.display = "none";
			}else{
				// Otherwise, show the header and give it an appropriate height.
				this.viewsHeaderNode.style.display = "block";
				if(!hasFlex && hh === undefined){
					hh = this._getHeaderHeight();
				}
			}
			if(hasFlex){
				hh = undefined;
			}

			// NOTE: it is essential that width be applied before height
			// Header height can only be calculated properly after view widths have been set.
			// This is because flex column width is naturally 0 in Firefox.
			// Therefore prior to width sizing flex columns with spaces are maximally wrapped
			// and calculated to be too tall.
			this.adaptWidth();
			this.adaptHeight(hh);

			this.postresize();
		},

		adaptWidth: function() {
			// private: sets width and position for views and update grid width if necessary
			var doAutoWidth = (!this.initialWidth && this.autoWidth);
			var w = doAutoWidth ? 0 : this.domNode.clientWidth || (this.domNode.offsetWidth - this._getPadBorder().w),
				vw = this.views.arrange(1, w);
			this.views.onEach("adaptWidth");
			if(doAutoWidth){
				this.domNode.style.width = vw + "px";
			}
		},

		adaptHeight: function(inHeaderHeight){
			// private: measures and normalizes header height, then sets view heights, and then updates scroller
			// content extent
			var t = inHeaderHeight === undefined ? this._getHeaderHeight() : inHeaderHeight;
			var h = (this._autoHeight ? -1 : Math.max(this.domNode.clientHeight - t, 0) || 0);
			this.views.onEach('setSize', [0, h]);
			this.views.onEach('adaptHeight');
			if(!this._autoHeight){
				var numScroll = 0, numNoScroll = 0;
				var noScrolls = array.filter(this.views.views, function(v){
					var has = v.hasHScrollbar();
					if(has){ numScroll++; }else{ numNoScroll++; }
					return (!has);
				});
				if(numScroll > 0 && numNoScroll > 0){
					array.forEach(noScrolls, function(v){
						v.adaptHeight(true);
					});
				}
			}
			if(this.autoHeight === true || h != -1 || (typeof this.autoHeight == "number" && this.autoHeight >= this.get('rowCount'))){
				this.scroller.windowHeight = h;
			}else{
				this.scroller.windowHeight = Math.max(this.domNode.clientHeight - t, 0);
			}
		},

		// startup
		startup: function(){
			if(this._started){return;}
			this.inherited(arguments);
			if(this.autoRender){
				this.render();
			}
		},

		// render
		render: function(){
			// summary:
			//	Render the grid, headers, and views. Edit and scrolling states are reset. To retain edit and
			// scrolling states, see Update.

			if(!this.domNode){return;}
			if(!this._started){return;}

			if(!this.hasLayout()) {
				this.scroller.init(0, this.keepRows, this.rowsPerPage);
				return;
			}
			//
			this.update = this.defaultUpdate;
			this._render();
		},

		_render: function(){
			this.scroller.init(this.get('rowCount'), this.keepRows, this.rowsPerPage);
			this.prerender();
			this.setScrollTop(0);
			this.postrender();
		},

		prerender: function(){
			// if autoHeight, make sure scroller knows not to virtualize; everything must be rendered.
			this.keepRows = this._autoHeight ? 0 : this.keepRows;
			this.scroller.setKeepInfo(this.keepRows);
			this.views.render();
			this._resize();
		},

		postrender: function(){
			this.postresize();
			this.focus.initFocusView();
			// make rows unselectable
			html.setSelectable(this.domNode, this.selectable);
		},

		postresize: function(){
			// views are position absolute, so they do not inflate the parent
			if(this._autoHeight){
				var size = Math.max(this.views.measureContent()) + 'px';
				
				this.viewsNode.style.height = size;
			}
		},

		renderRow: function(inRowIndex, inNodes){
			// summary: private, used internally to render rows
			this.views.renderRow(inRowIndex, inNodes, this._skipRowRenormalize);
		},

		rowRemoved: function(inRowIndex){
			// summary: private, used internally to remove rows
			this.views.rowRemoved(inRowIndex);
		},

		invalidated: null,

		updating: false,

		beginUpdate: function(){
			// summary:
			//		Use to make multiple changes to rows while queueing row updating.
			// NOTE: not currently supporting nested begin/endUpdate calls
			this.invalidated = [];
			this.updating = true;
		},

		endUpdate: function(){
			// summary:
			//		Use after calling beginUpdate to render any changes made to rows.
			this.updating = false;
			var i = this.invalidated, r;
			if(i.all){
				this.update();
			}else if(i.rowCount != undefined){
				this.updateRowCount(i.rowCount);
			}else{
				for(r in i){
					this.updateRow(Number(r));
				}
			}
			this.invalidated = [];
		},

		// update
		defaultUpdate: function(){
			// note: initial update calls render and subsequently this function.
			if(!this.domNode){return;}
			if(this.updating){
				this.invalidated.all = true;
				return;
			}
			//this.edit.saveState(inRowIndex);
			this.lastScrollTop = this.scrollTop;
			this.prerender();
			this.scroller.invalidateNodes();
			this.setScrollTop(this.lastScrollTop);
			this.postrender();
			//this.edit.restoreState(inRowIndex);
		},

		update: function(){
			// summary:
			//		Update the grid, retaining edit and scrolling states.
			this.render();
		},

		updateRow: function(inRowIndex){
			// summary:
			//		Render a single row.
			// inRowIndex: Integer
			//		Index of the row to render
			inRowIndex = Number(inRowIndex);
			if(this.updating){
				this.invalidated[inRowIndex]=true;
			}else{
				this.views.updateRow(inRowIndex);
				this.scroller.rowHeightChanged(inRowIndex);
			}
		},

		updateRows: function(startIndex, howMany){
			// summary:
			//		Render consecutive rows at once.
			// startIndex: Integer
			//		Index of the starting row to render
			// howMany: Integer
			//		How many rows to update.
			startIndex = Number(startIndex);
			howMany = Number(howMany);
			var i;
			if(this.updating){
				for(i=0; i<howMany; i++){
					this.invalidated[i+startIndex]=true;
				}
			}else{
				for(i=0; i<howMany; i++){
					this.views.updateRow(i+startIndex, this._skipRowRenormalize);
				}
				this.scroller.rowHeightChanged(startIndex);
			}
		},

		updateRowCount: function(inRowCount){
			//summary:
			//	Change the number of rows.
			// inRowCount: int
			//	Number of rows in the grid.
			if(this.updating){
				this.invalidated.rowCount = inRowCount;
			}else{
				this.rowCount = inRowCount;
				this._setAutoHeightAttr(this.autoHeight, true);
				if(this.layout.cells.length){
					this.scroller.updateRowCount(inRowCount);
				}
				this._resize();
				if(this.layout.cells.length){
					this.setScrollTop(this.scrollTop);
				}
			}
		},

		updateRowStyles: function(inRowIndex){
			// summary:
			//		Update the styles for a row after it's state has changed.
			this.views.updateRowStyles(inRowIndex);
		},
		getRowNode: function(inRowIndex){
			// summary:
			//		find the rowNode that is not a rowSelector
			if (this.focus.focusView && !(this.focus.focusView instanceof _RowSelector)){
					return this.focus.focusView.rowNodes[inRowIndex];
			}else{ // search through views
				for (var i = 0, cView; (cView = this.views.views[i]); i++) {
					if (!(cView instanceof _RowSelector)) {
						return cView.rowNodes[inRowIndex];
					}
				}
			}
			return null;
		},
		rowHeightChanged: function(inRowIndex){
			// summary:
			//		Update grid when the height of a row has changed. Row height is handled automatically as rows
			//		are rendered. Use this function only to update a row's height outside the normal rendering process.
			// inRowIndex: Integer
			// 		index of the row that has changed height

			this.views.renormalizeRow(inRowIndex);
			this.scroller.rowHeightChanged(inRowIndex);
		},

		// fastScroll: Boolean
		//		flag modifies vertical scrolling behavior. Defaults to true but set to false for slower
		//		scroll performance but more immediate scrolling feedback
		fastScroll: true,

		delayScroll: false,

		// scrollRedrawThreshold: int
		//	pixel distance a user must scroll vertically to trigger grid scrolling.
		scrollRedrawThreshold: (has("ie") ? 100 : 50),

		// scroll methods
		scrollTo: function(inTop){
			// summary:
			//		Vertically scroll the grid to a given pixel position
			// inTop: Integer
			//		vertical position of the grid in pixels
			if(!this.fastScroll){
				this.setScrollTop(inTop);
				return;
			}
			var delta = Math.abs(this.lastScrollTop - inTop);
			this.lastScrollTop = inTop;
			if(delta > this.scrollRedrawThreshold || this.delayScroll){
				this.delayScroll = true;
				this.scrollTop = inTop;
				this.views.setScrollTop(inTop);
				if(this._pendingScroll){
					window.clearTimeout(this._pendingScroll);
				}
				var _this = this;
				this._pendingScroll = window.setTimeout(function(){
					delete _this._pendingScroll;
					_this.finishScrollJob();
				}, 200);
			}else{
				this.setScrollTop(inTop);
			}
		},

		finishScrollJob: function(){
			this.delayScroll = false;
			this.setScrollTop(this.scrollTop);
		},

		setScrollTop: function(inTop){
			this.scroller.scroll(this.views.setScrollTop(inTop));
		},

		scrollToRow: function(inRowIndex){
			// summary:
			//		Scroll the grid to a specific row.
			// inRowIndex: Integer
			// 		grid row index
			this.setScrollTop(this.scroller.findScrollTop(inRowIndex) + 1);
		},

		// styling (private, used internally to style individual parts of a row)
		styleRowNode: function(inRowIndex, inRowNode){
			if(inRowNode){
				this.rows.styleRowNode(inRowIndex, inRowNode);
			}
		},
		
		// called when the mouse leaves the grid so we can deselect all hover rows
		_mouseOut: function(e){
			this.rows.setOverRow(-2);
		},
	
		// cells
		getCell: function(inIndex){
			// summary:
			//		Retrieves the cell object for a given grid column.
			// inIndex: Integer
			// 		Grid column index of cell to retrieve
			// returns:
			//		a grid cell
			return this.layout.cells[inIndex];
		},

		setCellWidth: function(inIndex, inUnitWidth){
			this.getCell(inIndex).unitWidth = inUnitWidth;
		},

		getCellName: function(inCell){
			// summary: Returns the cell name of a passed cell
			return "Cell " + inCell.index; // String
		},

		// sorting
		canSort: function(inSortInfo){
			// summary:
			//		Determines if the grid can be sorted
			// inSortInfo: Integer
			//		Sort information, 1-based index of column on which to sort, positive for an ascending sort
			// 		and negative for a descending sort
			// returns: Boolean
			//		True if grid can be sorted on the given column in the given direction
		},

		sort: function(){
		},

		getSortAsc: function(inSortInfo){
			// summary:
			//		Returns true if grid is sorted in an ascending direction.
			inSortInfo = inSortInfo == undefined ? this.sortInfo : inSortInfo;
			return Boolean(inSortInfo > 0); // Boolean
		},

		getSortIndex: function(inSortInfo){
			// summary:
			//		Returns the index of the column on which the grid is sorted
			inSortInfo = inSortInfo == undefined ? this.sortInfo : inSortInfo;
			return Math.abs(inSortInfo) - 1; // Integer
		},

		setSortIndex: function(inIndex, inAsc){
			// summary:
			// 		Sort the grid on a column in a specified direction
			// inIndex: Integer
			// 		Column index on which to sort.
			// inAsc: Boolean
			// 		If true, sort the grid in ascending order, otherwise in descending order
			var si = inIndex +1;
			if(inAsc != undefined){
				si *= (inAsc ? 1 : -1);
			} else if(this.getSortIndex() == inIndex){
				si = -this.sortInfo;
			}
			this.setSortInfo(si);
		},

		setSortInfo: function(inSortInfo){
			if(this.canSort(inSortInfo)){
				this.sortInfo = inSortInfo;
				this.sort();
				this.update();
			}
		},

		// DOM event handler
		doKeyEvent: function(e){
			e.dispatch = 'do' + e.type;
			this.onKeyEvent(e);
		},

		// event dispatch
		//: protected
		_dispatch: function(m, e){
			if(m in this){
				return this[m](e);
			}
			return false;
		},

		dispatchKeyEvent: function(e){
			this._dispatch(e.dispatch, e);
		},

		dispatchContentEvent: function(e){
			this.edit.dispatchEvent(e) || e.sourceView.dispatchContentEvent(e) || this._dispatch(e.dispatch, e);
		},

		dispatchHeaderEvent: function(e){
			e.sourceView.dispatchHeaderEvent(e) || this._dispatch('doheader' + e.type, e);
		},

		dokeydown: function(e){
			this.onKeyDown(e);
		},

		doclick: function(e){
			if(e.cellNode){
				this.onCellClick(e);
			}else{
				this.onRowClick(e);
			}
		},

		dodblclick: function(e){
			if(e.cellNode){
				this.onCellDblClick(e);
			}else{
				this.onRowDblClick(e);
			}
		},

		docontextmenu: function(e){
			if(e.cellNode){
				this.onCellContextMenu(e);
			}else{
				this.onRowContextMenu(e);
			}
		},

		doheaderclick: function(e){
			if(e.cellNode){
				this.onHeaderCellClick(e);
			}else{
				this.onHeaderClick(e);
			}
		},

		doheaderdblclick: function(e){
			if(e.cellNode){
				this.onHeaderCellDblClick(e);
			}else{
				this.onHeaderDblClick(e);
			}
		},

		doheadercontextmenu: function(e){
			if(e.cellNode){
				this.onHeaderCellContextMenu(e);
			}else{
				this.onHeaderContextMenu(e);
			}
		},

		// override to modify editing process
		doStartEdit: function(inCell, inRowIndex){
			this.onStartEdit(inCell, inRowIndex);
		},

		doApplyCellEdit: function(inValue, inRowIndex, inFieldIndex){
			this.onApplyCellEdit(inValue, inRowIndex, inFieldIndex);
		},

		doCancelEdit: function(inRowIndex){
			this.onCancelEdit(inRowIndex);
		},

		doApplyEdit: function(inRowIndex){
			this.onApplyEdit(inRowIndex);
		},

		// row editing
		addRow: function(){
			// summary:
			//		Add a row to the grid.
			this.updateRowCount(this.get('rowCount')+1);
		},

		removeSelectedRows: function(){
			// summary:
			//		Remove the selected rows from the grid.
			if(this.allItemsSelected){
				this.updateRowCount(0);
			}else{
				this.updateRowCount(Math.max(0, this.get('rowCount') - this.selection.getSelected().length));
			}
			this.selection.clear();
		}

	});

	_Grid.markupFactory = function(props, node, ctor, cellFunc){
		var widthFromAttr = function(n){
			var w = html.attr(n, "width")||"auto";
			if((w != "auto")&&(w.slice(-2) != "em")&&(w.slice(-1) != "%")){
				w = parseInt(w, 10)+"px";
			}
			return w;
		};
		// if(!props.store){ console.debug("no store!"); }
		// if a structure isn't referenced, do we have enough
		// data to try to build one automatically?
		if(	!props.structure &&
			node.nodeName.toLowerCase() == "table"){

			// try to discover a structure
			props.structure = query("> colgroup", node).map(function(cg){
				var sv = html.attr(cg, "span");
				var v = {
					noscroll: (html.attr(cg, "noscroll") == "true") ? true : false,
					__span: (!!sv ? parseInt(sv, 10) : 1),
					cells: []
				};
				if(html.hasAttr(cg, "width")){
					v.width = widthFromAttr(cg);
				}
				return v; // for vendetta
			});
			if(!props.structure.length){
				props.structure.push({
					__span: Infinity,
					cells: [] // catch-all view
				});
			}
			// check to see if we're gonna have more than one view

			// for each tr in our th, create a row of cells
			query("thead > tr", node).forEach(function(tr, tr_idx){
				var cellCount = 0;
				var viewIdx = 0;
				var lastViewIdx;
				var cView = null;
				query("> th", tr).map(function(th){
					// what view will this cell go into?

					// NOTE:
					//		to prevent extraneous iteration, we start counters over
					//		for each row, incrementing over the surface area of the
					//		structure that colgroup processing generates and
					//		creating cell objects for each <th> to place into those
					//		cell groups.  There's a lot of state-keepking logic
					//		here, but it is what it has to be.
					if(!cView){ // current view book keeping
						lastViewIdx = 0;
						cView = props.structure[0];
					}else if(cellCount >= (lastViewIdx+cView.__span)){
						viewIdx++;
						// move to allocating things into the next view
						lastViewIdx += cView.__span;
						var lastView = cView;
						cView = props.structure[viewIdx];
					}

					// actually define the cell from what markup hands us
					var cell = {
						name: lang.trim(html.attr(th, "name")||th.innerHTML),
						colSpan: parseInt(html.attr(th, "colspan")||1, 10),
						type: lang.trim(html.attr(th, "cellType")||""),
						id: lang.trim(html.attr(th,"id")||"")
					};
					cellCount += cell.colSpan;
					var rowSpan = html.attr(th, "rowspan");
					if(rowSpan){
						cell.rowSpan = rowSpan;
					}
					if(html.hasAttr(th, "width")){
						cell.width = widthFromAttr(th);
					}
					if(html.hasAttr(th, "relWidth")){
						cell.relWidth = window.parseInt(html.attr(th, "relWidth"), 10);
					}
					if(html.hasAttr(th, "hidden")){
						cell.hidden = (html.attr(th, "hidden") == "true" || html.attr(th, "hidden") === true/*always boolean true in Chrome*/);
					}

					if(cellFunc){
						cellFunc(th, cell);
					}

					cell.type = cell.type ? lang.getObject(cell.type) : dojox.grid.cells.Cell;

					if(cell.type && cell.type.markupFactory){
						cell.type.markupFactory(th, cell);
					}

					if(!cView.cells[tr_idx]){
						cView.cells[tr_idx] = [];
					}
					cView.cells[tr_idx].push(cell);
				});
			});
		}

		return new ctor(props, node);
	};

	return _Grid;

});
},
'url:dojox/grid/resources/_Grid.html':"<div hidefocus=\"hidefocus\" role=\"grid\" dojoAttachEvent=\"onmouseout:_mouseOut\">\r\n\t<div class=\"dojoxGridMasterHeader\" dojoAttachPoint=\"viewsHeaderNode\" role=\"presentation\"></div>\r\n\t<div class=\"dojoxGridMasterView\" dojoAttachPoint=\"viewsNode\" role=\"presentation\"></div>\r\n\t<div class=\"dojoxGridMasterMessages\" style=\"display: none;\" dojoAttachPoint=\"messagesNode\"></div>\r\n\t<span dojoAttachPoint=\"lastFocusNode\" tabindex=\"0\"></span>\r\n</div>\r\n",
'dojo/regexp':function(){
define(["./_base/kernel", "./_base/lang"], function(dojo, lang) {
	// module:
	//		dojo/regexp
	// summary:
	//		TODOC

lang.getObject("regexp", true, dojo);

/*=====
dojo.regexp = {
	// summary: Regular expressions and Builder resources
};
=====*/

dojo.regexp.escapeString = function(/*String*/str, /*String?*/except){
	//	summary:
	//		Adds escape sequences for special characters in regular expressions
	// except:
	//		a String with special characters to be left unescaped

	return str.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, function(ch){
		if(except && except.indexOf(ch) != -1){
			return ch;
		}
		return "\\" + ch;
	}); // String
};

dojo.regexp.buildGroupRE = function(/*Object|Array*/arr, /*Function*/re, /*Boolean?*/nonCapture){
	//	summary:
	//		Builds a regular expression that groups subexpressions
	//	description:
	//		A utility function used by some of the RE generators. The
	//		subexpressions are constructed by the function, re, in the second
	//		parameter.  re builds one subexpression for each elem in the array
	//		a, in the first parameter. Returns a string for a regular
	//		expression that groups all the subexpressions.
	// arr:
	//		A single value or an array of values.
	// re:
	//		A function. Takes one parameter and converts it to a regular
	//		expression.
	// nonCapture:
	//		If true, uses non-capturing match, otherwise matches are retained
	//		by regular expression. Defaults to false

	// case 1: a is a single value.
	if(!(arr instanceof Array)){
		return re(arr); // String
	}

	// case 2: a is an array
	var b = [];
	for(var i = 0; i < arr.length; i++){
		// convert each elem to a RE
		b.push(re(arr[i]));
	}

	 // join the REs as alternatives in a RE group.
	return dojo.regexp.group(b.join("|"), nonCapture); // String
};

dojo.regexp.group = function(/*String*/expression, /*Boolean?*/nonCapture){
	// summary:
	//		adds group match to expression
	// nonCapture:
	//		If true, uses non-capturing match, otherwise matches are retained
	//		by regular expression.
	return "(" + (nonCapture ? "?:":"") + expression + ")"; // String
};

return dojo.regexp;
});

},
'dijit/DropDownMenu':function(){
require({cache:{
'url:dijit/templates/Menu.html':"<table class=\"dijit dijitMenu dijitMenuPassive dijitReset dijitMenuTable\" role=\"menu\" tabIndex=\"${tabIndex}\" data-dojo-attach-event=\"onkeypress:_onKeyPress\" cellspacing=\"0\">\r\n\t<tbody class=\"dijitReset\" data-dojo-attach-point=\"containerNode\"></tbody>\r\n</table>\r\n"}});
define("dijit/DropDownMenu", [
	"dojo/_base/declare", // declare
	"dojo/_base/event", // event.stop
	"dojo/keys", // keys
	"dojo/text!./templates/Menu.html",
	"./_OnDijitClickMixin",
	"./_MenuBase"
], function(declare, event, keys, template, _OnDijitClickMixin, _MenuBase){

/*=====
	var _MenuBase = dijit._MenuBase;
	var _OnDijitClickMixin = dijit._OnDijitClickMixin;
=====*/

	// module:
	//		dijit/DropDownMenu
	// summary:
	//		dijit.DropDownMenu widget

	return declare("dijit.DropDownMenu", [_MenuBase, _OnDijitClickMixin], {
		// summary:
		//		A menu, without features for context menu (Meaning, drop down menu)

		templateString: template,

		baseClass: "dijitMenu",

		postCreate: function(){
			var l = this.isLeftToRight();
			this._openSubMenuKey = l ? keys.RIGHT_ARROW : keys.LEFT_ARROW;
			this._closeSubMenuKey = l ? keys.LEFT_ARROW : keys.RIGHT_ARROW;
			this.connectKeyNavHandlers([keys.UP_ARROW], [keys.DOWN_ARROW]);
		},

		_onKeyPress: function(/*Event*/ evt){
			// summary:
			//		Handle keyboard based menu navigation.
			// tags:
			//		protected

			if(evt.ctrlKey || evt.altKey){ return; }

			switch(evt.charOrCode){
				case this._openSubMenuKey:
					this._moveToPopup(evt);
					event.stop(evt);
					break;
				case this._closeSubMenuKey:
					if(this.parentMenu){
						if(this.parentMenu._isMenuBar){
							this.parentMenu.focusPrev();
						}else{
							this.onCancel(false);
						}
					}else{
						event.stop(evt);
					}
					break;
			}
		}
	});
});

},
'dojo/data/util/simpleFetch':function(){
define(["dojo/_base/lang", "dojo/_base/window", "./sorter"], 
  function(lang, winUtil, sorter) {
	// module:
	//		dojo/data/util/simpleFetch
	// summary:
	//		TODOC

var simpleFetch = lang.getObject("dojo.data.util.simpleFetch", true);

simpleFetch.fetch = function(/* Object? */ request){
	//	summary:
	//		The simpleFetch mixin is designed to serve as a set of function(s) that can
	//		be mixed into other datastore implementations to accelerate their development.
	//		The simpleFetch mixin should work well for any datastore that can respond to a _fetchItems()
	//		call by returning an array of all the found items that matched the query.  The simpleFetch mixin
	//		is not designed to work for datastores that respond to a fetch() call by incrementally
	//		loading items, or sequentially loading partial batches of the result
	//		set.  For datastores that mixin simpleFetch, simpleFetch
	//		implements a fetch method that automatically handles eight of the fetch()
	//		arguments -- onBegin, onItem, onComplete, onError, start, count, sort and scope
	//		The class mixing in simpleFetch should not implement fetch(),
	//		but should instead implement a _fetchItems() method.  The _fetchItems()
	//		method takes three arguments, the keywordArgs object that was passed
	//		to fetch(), a callback function to be called when the result array is
	//		available, and an error callback to be called if something goes wrong.
	//		The _fetchItems() method should ignore any keywordArgs parameters for
	//		start, count, onBegin, onItem, onComplete, onError, sort, and scope.
	//		The _fetchItems() method needs to correctly handle any other keywordArgs
	//		parameters, including the query parameter and any optional parameters
	//		(such as includeChildren).  The _fetchItems() method should create an array of
	//		result items and pass it to the fetchHandler along with the original request object
	//		-- or, the _fetchItems() method may, if it wants to, create an new request object
	//		with other specifics about the request that are specific to the datastore and pass
	//		that as the request object to the handler.
	//
	//		For more information on this specific function, see dojo.data.api.Read.fetch()
	request = request || {};
	if(!request.store){
		request.store = this;
	}
	var self = this;

	var _errorHandler = function(errorData, requestObject){
		if(requestObject.onError){
			var scope = requestObject.scope || winUtil.global;
			requestObject.onError.call(scope, errorData, requestObject);
		}
	};

	var _fetchHandler = function(items, requestObject){
		var oldAbortFunction = requestObject.abort || null;
		var aborted = false;

		var startIndex = requestObject.start?requestObject.start:0;
		var endIndex = (requestObject.count && (requestObject.count !== Infinity))?(startIndex + requestObject.count):items.length;

		requestObject.abort = function(){
			aborted = true;
			if(oldAbortFunction){
				oldAbortFunction.call(requestObject);
			}
		};

		var scope = requestObject.scope || winUtil.global;
		if(!requestObject.store){
			requestObject.store = self;
		}
		if(requestObject.onBegin){
			requestObject.onBegin.call(scope, items.length, requestObject);
		}
		if(requestObject.sort){
			items.sort(sorter.createSortFunction(requestObject.sort, self));
		}
		if(requestObject.onItem){
			for(var i = startIndex; (i < items.length) && (i < endIndex); ++i){
				var item = items[i];
				if(!aborted){
					requestObject.onItem.call(scope, item, requestObject);
				}
			}
		}
		if(requestObject.onComplete && !aborted){
			var subset = null;
			if(!requestObject.onItem){
				subset = items.slice(startIndex, endIndex);
			}
			requestObject.onComplete.call(scope, subset, requestObject);
		}
	};
	this._fetchItems(request, _fetchHandler, _errorHandler);
	return request;	// Object
};

return simpleFetch;
});

},
'dijit/Menu':function(){
define("dijit/Menu", [
	"require",
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/_base/event", // event.stop
	"dojo/dom", // dom.byId dom.isDescendant
	"dojo/dom-attr", // domAttr.get domAttr.set domAttr.has domAttr.remove
	"dojo/dom-geometry", // domStyle.getComputedStyle domGeometry.position
	"dojo/dom-style", // domStyle.getComputedStyle
	"dojo/_base/kernel",
	"dojo/keys",	// keys.F10
	"dojo/_base/lang", // lang.hitch
	"dojo/on",
	"dojo/_base/sniff", // has("ie"), has("quirks")
	"dojo/_base/window", // win.body win.doc.documentElement win.doc.frames win.withGlobal
	"dojo/window", // winUtils.get
	"./popup",
	"./DropDownMenu",
	"dojo/ready"
], function(require, array, declare, event, dom, domAttr, domGeometry, domStyle, kernel, keys, lang, on,
			has, win, winUtils, pm, DropDownMenu, ready){

/*=====
	var DropDownMenu = dijit.DropDownMenu;
=====*/

// module:
//		dijit/Menu
// summary:
//		Includes dijit.Menu widget and base class dijit._MenuBase

// Back compat w/1.6, remove for 2.0
if(!kernel.isAsync){
	ready(0, function(){
		var requires = ["dijit/MenuItem", "dijit/PopupMenuItem", "dijit/CheckedMenuItem", "dijit/MenuSeparator"];
		require(requires);	// use indirection so modules not rolled into a build
	});
}

return declare("dijit.Menu", DropDownMenu, {
	// summary:
	//		A context menu you can assign to multiple elements

	constructor: function(){
		this._bindings = [];
	},

	// targetNodeIds: [const] String[]
	//		Array of dom node ids of nodes to attach to.
	//		Fill this with nodeIds upon widget creation and it becomes context menu for those nodes.
	targetNodeIds: [],

	// contextMenuForWindow: [const] Boolean
	//		If true, right clicking anywhere on the window will cause this context menu to open.
	//		If false, must specify targetNodeIds.
	contextMenuForWindow: false,

	// leftClickToOpen: [const] Boolean
	//		If true, menu will open on left click instead of right click, similar to a file menu.
	leftClickToOpen: false,

	// refocus: Boolean
	// 		When this menu closes, re-focus the element which had focus before it was opened.
	refocus: true,

	postCreate: function(){
		if(this.contextMenuForWindow){
			this.bindDomNode(win.body());
		}else{
			// TODO: should have _setTargetNodeIds() method to handle initialization and a possible
			// later set('targetNodeIds', ...) call.  There's also a problem that targetNodeIds[]
			// gets stale after calls to bindDomNode()/unBindDomNode() as it still is just the original list (see #9610)
			array.forEach(this.targetNodeIds, this.bindDomNode, this);
		}
		this.inherited(arguments);
	},

	// thanks burstlib!
	_iframeContentWindow: function(/* HTMLIFrameElement */iframe_el){
		// summary:
		//		Returns the window reference of the passed iframe
		// tags:
		//		private
		return winUtils.get(this._iframeContentDocument(iframe_el)) ||
			// Moz. TODO: is this available when defaultView isn't?
			this._iframeContentDocument(iframe_el)['__parent__'] ||
			(iframe_el.name && win.doc.frames[iframe_el.name]) || null;	//	Window
	},

	_iframeContentDocument: function(/* HTMLIFrameElement */iframe_el){
		// summary:
		//		Returns a reference to the document object inside iframe_el
		// tags:
		//		protected
		return iframe_el.contentDocument // W3
			|| (iframe_el.contentWindow && iframe_el.contentWindow.document) // IE
			|| (iframe_el.name && win.doc.frames[iframe_el.name] && win.doc.frames[iframe_el.name].document)
			|| null;	//	HTMLDocument
	},

	bindDomNode: function(/*String|DomNode*/ node){
		// summary:
		//		Attach menu to given node
		node = dom.byId(node);

		var cn;	// Connect node

		// Support context menus on iframes.  Rather than binding to the iframe itself we need
		// to bind to the <body> node inside the iframe.
		if(node.tagName.toLowerCase() == "iframe"){
			var iframe = node,
				window = this._iframeContentWindow(iframe);
			cn = win.withGlobal(window, win.body);
		}else{

			// To capture these events at the top level, attach to <html>, not <body>.
			// Otherwise right-click context menu just doesn't work.
			cn = (node == win.body() ? win.doc.documentElement : node);
		}


		// "binding" is the object to track our connection to the node (ie, the parameter to bindDomNode())
		var binding = {
			node: node,
			iframe: iframe
		};

		// Save info about binding in _bindings[], and make node itself record index(+1) into
		// _bindings[] array.  Prefix w/_dijitMenu to avoid setting an attribute that may
		// start with a number, which fails on FF/safari.
		domAttr.set(node, "_dijitMenu" + this.id, this._bindings.push(binding));

		// Setup the connections to monitor click etc., unless we are connecting to an iframe which hasn't finished
		// loading yet, in which case we need to wait for the onload event first, and then connect
		// On linux Shift-F10 produces the oncontextmenu event, but on Windows it doesn't, so
		// we need to monitor keyboard events in addition to the oncontextmenu event.
		var doConnects = lang.hitch(this, function(cn){
			return [
				// TODO: when leftClickToOpen is true then shouldn't space/enter key trigger the menu,
				// rather than shift-F10?
				on(cn, this.leftClickToOpen ? "click" : "contextmenu", lang.hitch(this, function(evt){
					// Schedule context menu to be opened unless it's already been scheduled from onkeydown handler
					event.stop(evt);
					this._scheduleOpen(evt.target, iframe, {x: evt.pageX, y: evt.pageY});
				})),
				on(cn, "keydown", lang.hitch(this, function(evt){
					if(evt.shiftKey && evt.keyCode == keys.F10){
						event.stop(evt);
						this._scheduleOpen(evt.target, iframe);	// no coords - open near target node
					}
				}))
			];
		});
		binding.connects = cn ? doConnects(cn) : [];

		if(iframe){
			// Setup handler to [re]bind to the iframe when the contents are initially loaded,
			// and every time the contents change.
			// Need to do this b/c we are actually binding to the iframe's <body> node.
			// Note: can't use connect.connect(), see #9609.

			binding.onloadHandler = lang.hitch(this, function(){
				// want to remove old connections, but IE throws exceptions when trying to
				// access the <body> node because it's already gone, or at least in a state of limbo

				var window = this._iframeContentWindow(iframe);
					cn = win.withGlobal(window, win.body);
				binding.connects = doConnects(cn);
			});
			if(iframe.addEventListener){
				iframe.addEventListener("load", binding.onloadHandler, false);
			}else{
				iframe.attachEvent("onload", binding.onloadHandler);
			}
		}
	},

	unBindDomNode: function(/*String|DomNode*/ nodeName){
		// summary:
		//		Detach menu from given node

		var node;
		try{
			node = dom.byId(nodeName);
		}catch(e){
			// On IE the dom.byId() call will get an exception if the attach point was
			// the <body> node of an <iframe> that has since been reloaded (and thus the
			// <body> node is in a limbo state of destruction.
			return;
		}

		// node["_dijitMenu" + this.id] contains index(+1) into my _bindings[] array
		var attrName = "_dijitMenu" + this.id;
		if(node && domAttr.has(node, attrName)){
			var bid = domAttr.get(node, attrName)-1, b = this._bindings[bid], h;
			while(h = b.connects.pop()){
				h.remove();
			}

			// Remove listener for iframe onload events
			var iframe = b.iframe;
			if(iframe){
				if(iframe.removeEventListener){
					iframe.removeEventListener("load", b.onloadHandler, false);
				}else{
					iframe.detachEvent("onload", b.onloadHandler);
				}
			}

			domAttr.remove(node, attrName);
			delete this._bindings[bid];
		}
	},

	_scheduleOpen: function(/*DomNode?*/ target, /*DomNode?*/ iframe, /*Object?*/ coords){
		// summary:
		//		Set timer to display myself.  Using a timer rather than displaying immediately solves
		//		two problems:
		//
		//		1. IE: without the delay, focus work in "open" causes the system
		//		context menu to appear in spite of stopEvent.
		//
		//		2. Avoid double-shows on linux, where shift-F10 generates an oncontextmenu event
		//		even after a event.stop(e).  (Shift-F10 on windows doesn't generate the
		//		oncontextmenu event.)

		if(!this._openTimer){
			this._openTimer = setTimeout(lang.hitch(this, function(){
				delete this._openTimer;
				this._openMyself({
					target: target,
					iframe: iframe,
					coords: coords
				});
			}), 1);
		}
	},

	_openMyself: function(args){
		// summary:
		//		Internal function for opening myself when the user does a right-click or something similar.
		// args:
		//		This is an Object containing:
		//		* target:
		//			The node that is being clicked
		//		* iframe:
		//			If an <iframe> is being clicked, iframe points to that iframe
		//		* coords:
		//			Put menu at specified x/y position in viewport, or if iframe is
		//			specified, then relative to iframe.
		//
		//		_openMyself() formerly took the event object, and since various code references
		//		evt.target (after connecting to _openMyself()), using an Object for parameters
		//		(so that old code still works).

		var target = args.target,
			iframe = args.iframe,
			coords = args.coords;

		// Get coordinates to open menu, either at specified (mouse) position or (if triggered via keyboard)
		// then near the node the menu is assigned to.
		if(coords){
			if(iframe){
				// Specified coordinates are on <body> node of an <iframe>, convert to match main document
				var ifc = domGeometry.position(iframe, true),
					window = this._iframeContentWindow(iframe),
					scroll = win.withGlobal(window, "_docScroll", dojo);

				var cs = domStyle.getComputedStyle(iframe),
					tp = domStyle.toPixelValue,
					left = (has("ie") && has("quirks") ? 0 : tp(iframe, cs.paddingLeft)) + (has("ie") && has("quirks") ? tp(iframe, cs.borderLeftWidth) : 0),
					top = (has("ie") && has("quirks") ? 0 : tp(iframe, cs.paddingTop)) + (has("ie") && has("quirks") ? tp(iframe, cs.borderTopWidth) : 0);

				coords.x += ifc.x + left - scroll.x;
				coords.y += ifc.y + top - scroll.y;
			}
		}else{
			coords = domGeometry.position(target, true);
			coords.x += 10;
			coords.y += 10;
		}

		var self=this;
		var prevFocusNode = this._focusManager.get("prevNode");
		var curFocusNode = this._focusManager.get("curNode");
		var savedFocusNode = !curFocusNode || (dom.isDescendant(curFocusNode, this.domNode)) ? prevFocusNode : curFocusNode;

		function closeAndRestoreFocus(){
			// user has clicked on a menu or popup
			if(self.refocus && savedFocusNode){
				savedFocusNode.focus();
			}
			pm.close(self);
		}
		pm.open({
			popup: this,
			x: coords.x,
			y: coords.y,
			onExecute: closeAndRestoreFocus,
			onCancel: closeAndRestoreFocus,
			orient: this.isLeftToRight() ? 'L' : 'R'
		});
		this.focus();

		this._onBlur = function(){
			this.inherited('_onBlur', arguments);
			// Usually the parent closes the child widget but if this is a context
			// menu then there is no parent
			pm.close(this);
			// don't try to restore focus; user has clicked another part of the screen
			// and set focus there
		};
	},

	uninitialize: function(){
 		array.forEach(this._bindings, function(b){ if(b){ this.unBindDomNode(b.node); } }, this);
 		this.inherited(arguments);
	}
});

});

},
'esri/toolbars/_toolbar':function(){
// wrapped by build app
define(["dijit","dojo","dojox"], function(dijit,dojo,dojox){
dojo.provide("esri.toolbars._toolbar");

dojo.declare("esri.toolbars._Toolbar", null, {
    constructor: function(/*esri.Map*/ map) {
      this.map = map;
    },
    
    _cursors: {
      "move": "pointer",
      "move-v": "pointer",
      "move-gv": "pointer",
      "box0": "nw-resize",
      "box1": "n-resize",
      "box2": "ne-resize",
      "box3": "e-resize",
      "box4": "se-resize",
      "box5": "s-resize",
      "box6": "sw-resize",
      "box7": "w-resize",
      "box8": "pointer"
    },

    _deactivateMapTools: function(nav, slider, fixedPan, graphics) {
      var map = this.map;

      if (nav) {
        //store map navigation state so that when deactivated, the map's navigation state is restored to original
        this._mapNavState = { isDoubleClickZoom:map.isDoubleClickZoom, isClickRecenter:map.isClickRecenter, isPan:map.isPan,
          isRubberBandZoom:map.isRubberBandZoom, isKeyboardNavigation:map.isKeyboardNavigation, isScrollWheelZoom:map.isScrollWheelZoom };
        map.disableDoubleClickZoom();
        map.disableClickRecenter();
        map.disablePan();
        map.disableRubberBandZoom();
        map.disableKeyboardNavigation();
      }
      if (slider) {
        map.hideZoomSlider();
      }
      if (fixedPan) {
        map.hidePanArrows();
      }
      if (graphics) {
        map.graphics.disableMouseEvents();
      }
    },

    _activateMapTools: function(nav, slider, fixedPan, graphics) {
      var map = this.map,
          navState = this._mapNavState;

      if (nav && navState) {
        if (navState.isDoubleClickZoom) {
          map.enableDoubleClickZoom();
        }
        if (navState.isClickRecenter) {
          map.enableClickRecenter();
        }
        if (navState.isPan) {
          map.enablePan();
        }
        if (navState.isRubberBandZoom) {
          map.enableRubberBandZoom();
        }
        if (navState.isKeyboardNavigation) {
          map.enableKeyboardNavigation();
        }
        if (navState.isScrollWheelZoom) {
          map.enableScrollWheelZoom();
        }
      }
      if (slider) {
        map.showZoomSlider();
      }
      if (fixedPan) {
        map.showPanArrows();
      }
      if (graphics) {
        map.graphics.enableMouseEvents();
      }
    }
  }
);
});

},
'dijit/_KeyNavContainer':function(){
define("dijit/_KeyNavContainer", [
	"dojo/_base/kernel", // kernel.deprecated
	"./_Container",
	"./_FocusMixin",
	"dojo/_base/array", // array.forEach
	"dojo/keys", // keys.END keys.HOME
	"dojo/_base/declare", // declare
	"dojo/_base/event", // event.stop
	"dojo/dom-attr", // domAttr.set
	"dojo/_base/lang" // lang.hitch
], function(kernel, _Container, _FocusMixin, array, keys, declare, event, domAttr, lang){

/*=====
	var _FocusMixin = dijit._FocusMixin;
	var _Container = dijit._Container;
=====*/

	// module:
	//		dijit/_KeyNavContainer
	// summary:
	//		A _Container with keyboard navigation of its children.

	return declare("dijit._KeyNavContainer", [_FocusMixin, _Container], {

		// summary:
		//		A _Container with keyboard navigation of its children.
		// description:
		//		To use this mixin, call connectKeyNavHandlers() in
		//		postCreate().
		//		It provides normalized keyboard and focusing code for Container
		//		widgets.

/*=====
		// focusedChild: [protected] Widget
		//		The currently focused child widget, or null if there isn't one
		focusedChild: null,
=====*/

		// tabIndex: Integer
		//		Tab index of the container; same as HTML tabIndex attribute.
		//		Note then when user tabs into the container, focus is immediately
		//		moved to the first item in the container.
		tabIndex: "0",

		connectKeyNavHandlers: function(/*keys[]*/ prevKeyCodes, /*keys[]*/ nextKeyCodes){
			// summary:
			//		Call in postCreate() to attach the keyboard handlers
			//		to the container.
			// preKeyCodes: keys[]
			//		Key codes for navigating to the previous child.
			// nextKeyCodes: keys[]
			//		Key codes for navigating to the next child.
			// tags:
			//		protected

			// TODO: call this automatically from my own postCreate()

			var keyCodes = (this._keyNavCodes = {});
			var prev = lang.hitch(this, "focusPrev");
			var next = lang.hitch(this, "focusNext");
			array.forEach(prevKeyCodes, function(code){ keyCodes[code] = prev; });
			array.forEach(nextKeyCodes, function(code){ keyCodes[code] = next; });
			keyCodes[keys.HOME] = lang.hitch(this, "focusFirstChild");
			keyCodes[keys.END] = lang.hitch(this, "focusLastChild");
			this.connect(this.domNode, "onkeypress", "_onContainerKeypress");
			this.connect(this.domNode, "onfocus", "_onContainerFocus");
		},

		startupKeyNavChildren: function(){
			kernel.deprecated("startupKeyNavChildren() call no longer needed", "", "2.0");
		},

		startup: function(){
			this.inherited(arguments);
			array.forEach(this.getChildren(), lang.hitch(this, "_startupChild"));
		},

		addChild: function(/*dijit._Widget*/ widget, /*int?*/ insertIndex){
			this.inherited(arguments);
			this._startupChild(widget);
		},

		focus: function(){
			// summary:
			//		Default focus() implementation: focus the first child.
			this.focusFirstChild();
		},

		focusFirstChild: function(){
			// summary:
			//		Focus the first focusable child in the container.
			// tags:
			//		protected
			this.focusChild(this._getFirstFocusableChild());
		},

		focusLastChild: function(){
			// summary:
			//		Focus the last focusable child in the container.
			// tags:
			//		protected
			this.focusChild(this._getLastFocusableChild());
		},

		focusNext: function(){
			// summary:
			//		Focus the next widget
			// tags:
			//		protected
			this.focusChild(this._getNextFocusableChild(this.focusedChild, 1));
		},

		focusPrev: function(){
			// summary:
			//		Focus the last focusable node in the previous widget
			//		(ex: go to the ComboButton icon section rather than button section)
			// tags:
			//		protected
			this.focusChild(this._getNextFocusableChild(this.focusedChild, -1), true);
		},

		focusChild: function(/*dijit._Widget*/ widget, /*Boolean*/ last){
			// summary:
			//		Focus specified child widget.
			// widget:
			//		Reference to container's child widget
			// last:
			//		If true and if widget has multiple focusable nodes, focus the
			//		last one instead of the first one
			// tags:
			//		protected

			if(!widget){ return; }

			if(this.focusedChild && widget !== this.focusedChild){
				this._onChildBlur(this.focusedChild);	// used by _MenuBase
			}
			widget.set("tabIndex", this.tabIndex);	// for IE focus outline to appear, must set tabIndex before focs
			widget.focus(last ? "end" : "start");
			this._set("focusedChild", widget);
		},

		_startupChild: function(/*dijit._Widget*/ widget){
			// summary:
			//		Setup for each child widget
			// description:
			//		Sets tabIndex=-1 on each child, so that the tab key will
			//		leave the container rather than visiting each child.
			// tags:
			//		private

			widget.set("tabIndex", "-1");

			this.connect(widget, "_onFocus", function(){
				// Set valid tabIndex so tabbing away from widget goes to right place, see #10272
				widget.set("tabIndex", this.tabIndex);
			});
			this.connect(widget, "_onBlur", function(){
				widget.set("tabIndex", "-1");
			});
		},

		_onContainerFocus: function(evt){
			// summary:
			//		Handler for when the container gets focus
			// description:
			//		Initially the container itself has a tabIndex, but when it gets
			//		focus, switch focus to first child...
			// tags:
			//		private

			// Note that we can't use _onFocus() because switching focus from the
			// _onFocus() handler confuses the focus.js code
			// (because it causes _onFocusNode() to be called recursively)
			// Also, _onFocus() would fire when focus went directly to a child widget due to mouse click.

			// Ignore spurious focus events:
			//	1. focus on a child widget bubbles on FF
			//	2. on IE, clicking the scrollbar of a select dropdown moves focus from the focused child item to me
			if(evt.target !== this.domNode || this.focusedChild){ return; }

			this.focusFirstChild();

			// and then set the container's tabIndex to -1,
			// (don't remove as that breaks Safari 4)
			// so that tab or shift-tab will go to the fields after/before
			// the container, rather than the container itself
			domAttr.set(this.domNode, "tabIndex", "-1");
		},

		_onBlur: function(evt){
			// When focus is moved away the container, and its descendant (popup) widgets,
			// then restore the container's tabIndex so that user can tab to it again.
			// Note that using _onBlur() so that this doesn't happen when focus is shifted
			// to one of my child widgets (typically a popup)
			if(this.tabIndex){
				domAttr.set(this.domNode, "tabIndex", this.tabIndex);
			}
			this.focusedChild = null;
			this.inherited(arguments);
		},

		_onContainerKeypress: function(evt){
			// summary:
			//		When a key is pressed, if it's an arrow key etc. then
			//		it's handled here.
			// tags:
			//		private
			if(evt.ctrlKey || evt.altKey){ return; }
			var func = this._keyNavCodes[evt.charOrCode];
			if(func){
				func();
				event.stop(evt);
			}
		},

		_onChildBlur: function(/*dijit._Widget*/ /*===== widget =====*/){
			// summary:
			//		Called when focus leaves a child widget to go
			//		to a sibling widget.
			//		Used by MenuBase.js (TODO: move code there)
			// tags:
			//		protected
		},

		_getFirstFocusableChild: function(){
			// summary:
			//		Returns first child that can be focused
			return this._getNextFocusableChild(null, 1);	// dijit._Widget
		},

		_getLastFocusableChild: function(){
			// summary:
			//		Returns last child that can be focused
			return this._getNextFocusableChild(null, -1);	// dijit._Widget
		},

		_getNextFocusableChild: function(child, dir){
			// summary:
			//		Returns the next or previous focusable child, compared
			//		to "child"
			// child: Widget
			//		The current widget
			// dir: Integer
			//		* 1 = after
			//		* -1 = before
			if(child){
				child = this._getSiblingOfChild(child, dir);
			}
			var children = this.getChildren();
			for(var i=0; i < children.length; i++){
				if(!child){
					child = children[(dir>0) ? 0 : (children.length-1)];
				}
				if(child.isFocusable()){
					return child;	// dijit._Widget
				}
				child = this._getSiblingOfChild(child, dir);
			}
			// no focusable child found
			return null;	// dijit._Widget
		}
	});
});

},
'dijit/_Contained':function(){
define("dijit/_Contained", [
	"dojo/_base/declare", // declare
	"./registry"	// registry.getEnclosingWidget(), registry.byNode()
], function(declare, registry){

	// module:
	//		dijit/_Contained
	// summary:
	//		Mixin for widgets that are children of a container widget

	return declare("dijit._Contained", null, {
		// summary:
		//		Mixin for widgets that are children of a container widget
		//
		// example:
		// | 	// make a basic custom widget that knows about it's parents
		// |	declare("my.customClass",[dijit._Widget,dijit._Contained],{});

		_getSibling: function(/*String*/ which){
			// summary:
			//      Returns next or previous sibling
			// which:
			//      Either "next" or "previous"
			// tags:
			//      private
			var node = this.domNode;
			do{
				node = node[which+"Sibling"];
			}while(node && node.nodeType != 1);
			return node && registry.byNode(node);	// dijit._Widget
		},

		getPreviousSibling: function(){
			// summary:
			//		Returns null if this is the first child of the parent,
			//		otherwise returns the next element sibling to the "left".

			return this._getSibling("previous"); // dijit._Widget
		},

		getNextSibling: function(){
			// summary:
			//		Returns null if this is the last child of the parent,
			//		otherwise returns the next element sibling to the "right".

			return this._getSibling("next"); // dijit._Widget
		},

		getIndexInParent: function(){
			// summary:
			//		Returns the index of this widget within its container parent.
			//		It returns -1 if the parent does not exist, or if the parent
			//		is not a dijit._Container

			var p = this.getParent();
			if(!p || !p.getIndexOfChild){
				return -1; // int
			}
			return p.getIndexOfChild(this); // int
		}
	});
});

},
'dojox/gfx/move':function(){
define("dojox/gfx/move", ["dojo/_base/lang", "./Mover", "./Moveable"], 
  function(lang){ return lang.getObject("dojox.gfx.move", true); });

},
'dijit/_Container':function(){
define("dijit/_Container", [
	"dojo/_base/array", // array.forEach array.indexOf
	"dojo/_base/declare", // declare
	"dojo/dom-construct", // domConstruct.place
	"./registry"	// registry.byNode()
], function(array, declare, domConstruct, registry){

	// module:
	//		dijit/_Container
	// summary:
	//		Mixin for widgets that contain a set of widget children.

	return declare("dijit._Container", null, {
		// summary:
		//		Mixin for widgets that contain a set of widget children.
		// description:
		//		Use this mixin for widgets that needs to know about and
		//		keep track of their widget children. Suitable for widgets like BorderContainer
		//		and TabContainer which contain (only) a set of child widgets.
		//
		//		It's not suitable for widgets like ContentPane
		//		which contains mixed HTML (plain DOM nodes in addition to widgets),
		//		and where contained widgets are not necessarily directly below
		//		this.containerNode.   In that case calls like addChild(node, position)
		//		wouldn't make sense.

		buildRendering: function(){
			this.inherited(arguments);
			if(!this.containerNode){
				// all widgets with descendants must set containerNode
	 			this.containerNode = this.domNode;
			}
		},

		addChild: function(/*dijit._Widget*/ widget, /*int?*/ insertIndex){
			// summary:
			//		Makes the given widget a child of this widget.
			// description:
			//		Inserts specified child widget's dom node as a child of this widget's
			//		container node, and possibly does other processing (such as layout).

			var refNode = this.containerNode;
			if(insertIndex && typeof insertIndex == "number"){
				var children = this.getChildren();
				if(children && children.length >= insertIndex){
					refNode = children[insertIndex-1].domNode;
					insertIndex = "after";
				}
			}
			domConstruct.place(widget.domNode, refNode, insertIndex);

			// If I've been started but the child widget hasn't been started,
			// start it now.  Make sure to do this after widget has been
			// inserted into the DOM tree, so it can see that it's being controlled by me,
			// so it doesn't try to size itself.
			if(this._started && !widget._started){
				widget.startup();
			}
		},

		removeChild: function(/*Widget|int*/ widget){
			// summary:
			//		Removes the passed widget instance from this widget but does
			//		not destroy it.  You can also pass in an integer indicating
			//		the index within the container to remove

			if(typeof widget == "number"){
				widget = this.getChildren()[widget];
			}

			if(widget){
				var node = widget.domNode;
				if(node && node.parentNode){
					node.parentNode.removeChild(node); // detach but don't destroy
				}
			}
		},

		hasChildren: function(){
			// summary:
			//		Returns true if widget has children, i.e. if this.containerNode contains something.
			return this.getChildren().length > 0;	// Boolean
		},

		_getSiblingOfChild: function(/*dijit._Widget*/ child, /*int*/ dir){
			// summary:
			//		Get the next or previous widget sibling of child
			// dir:
			//		if 1, get the next sibling
			//		if -1, get the previous sibling
			// tags:
			//      private
			var node = child.domNode,
				which = (dir>0 ? "nextSibling" : "previousSibling");
			do{
				node = node[which];
			}while(node && (node.nodeType != 1 || !registry.byNode(node)));
			return node && registry.byNode(node);	// dijit._Widget
		},

		getIndexOfChild: function(/*dijit._Widget*/ child){
			// summary:
			//		Gets the index of the child in this container or -1 if not found
			return array.indexOf(this.getChildren(), child);	// int
		}
	});
});

},
'dojo/dnd/Source':function(){
define(["../main", "./Selector", "./Manager"], function(dojo, Selector, Manager) {
	// module:
	//		dojo/dnd/Source
	// summary:
	//		TODOC

/*=====
Selector = dojo.dnd.Selector;
=====*/

/*
	Container property:
		"Horizontal"- if this is the horizontal container
	Source states:
		""			- normal state
		"Moved"		- this source is being moved
		"Copied"	- this source is being copied
	Target states:
		""			- normal state
		"Disabled"	- the target cannot accept an avatar
	Target anchor state:
		""			- item is not selected
		"Before"	- insert point is before the anchor
		"After"		- insert point is after the anchor
*/

/*=====
dojo.dnd.__SourceArgs = function(){
	//	summary:
	//		a dict of parameters for DnD Source configuration. Note that any
	//		property on Source elements may be configured, but this is the
	//		short-list
	//	isSource: Boolean?
	//		can be used as a DnD source. Defaults to true.
	//	accept: Array?
	//		list of accepted types (text strings) for a target; defaults to
	//		["text"]
	//	autoSync: Boolean
	//		if true refreshes the node list on every operation; false by default
	//	copyOnly: Boolean?
	//		copy items, if true, use a state of Ctrl key otherwise,
	//		see selfCopy and selfAccept for more details
	//	delay: Number
	//		the move delay in pixels before detecting a drag; 0 by default
	//	horizontal: Boolean?
	//		a horizontal container, if true, vertical otherwise or when omitted
	//	selfCopy: Boolean?
	//		copy items by default when dropping on itself,
	//		false by default, works only if copyOnly is true
	//	selfAccept: Boolean?
	//		accept its own items when copyOnly is true,
	//		true by default, works only if copyOnly is true
	//	withHandles: Boolean?
	//		allows dragging only by handles, false by default
	//  generateText: Boolean?
	//		generate text node for drag and drop, true by default
	this.isSource = isSource;
	this.accept = accept;
	this.autoSync = autoSync;
	this.copyOnly = copyOnly;
	this.delay = delay;
	this.horizontal = horizontal;
	this.selfCopy = selfCopy;
	this.selfAccept = selfAccept;
	this.withHandles = withHandles;
	this.generateText = true;
}
=====*/

// For back-compat, remove in 2.0.
if(!dojo.isAsync){
	dojo.ready(0, function(){
		var requires = ["dojo/dnd/AutoSource", "dojo/dnd/Target"];
		require(requires);	// use indirection so modules not rolled into a build
	})
}

return dojo.declare("dojo.dnd.Source", Selector, {
	// summary:
	//		a Source object, which can be used as a DnD source, or a DnD target

	// object attributes (for markup)
	isSource: true,
	horizontal: false,
	copyOnly: false,
	selfCopy: false,
	selfAccept: true,
	skipForm: false,
	withHandles: false,
	autoSync: false,
	delay: 0, // pixels
	accept: ["text"],
	generateText: true,

	constructor: function(/*DOMNode|String*/node, /*dojo.dnd.__SourceArgs?*/params){
		// summary:
		//		a constructor of the Source
		// node:
		//		node or node's id to build the source on
		// params:
		//		any property of this class may be configured via the params
		//		object which is mixed-in to the `dojo.dnd.Source` instance
		dojo.mixin(this, dojo.mixin({}, params));
		var type = this.accept;
		if(type.length){
			this.accept = {};
			for(var i = 0; i < type.length; ++i){
				this.accept[type[i]] = 1;
			}
		}
		// class-specific variables
		this.isDragging = false;
		this.mouseDown = false;
		this.targetAnchor = null;
		this.targetBox = null;
		this.before = true;
		this._lastX = 0;
		this._lastY = 0;
		// states
		this.sourceState  = "";
		if(this.isSource){
			dojo.addClass(this.node, "dojoDndSource");
		}
		this.targetState  = "";
		if(this.accept){
			dojo.addClass(this.node, "dojoDndTarget");
		}
		if(this.horizontal){
			dojo.addClass(this.node, "dojoDndHorizontal");
		}
		// set up events
		this.topics = [
			dojo.subscribe("/dnd/source/over", this, "onDndSourceOver"),
			dojo.subscribe("/dnd/start",  this, "onDndStart"),
			dojo.subscribe("/dnd/drop",   this, "onDndDrop"),
			dojo.subscribe("/dnd/cancel", this, "onDndCancel")
		];
	},

	// methods
	checkAcceptance: function(source, nodes){
		// summary:
		//		checks if the target can accept nodes from this source
		// source: Object
		//		the source which provides items
		// nodes: Array
		//		the list of transferred items
		if(this == source){
			return !this.copyOnly || this.selfAccept;
		}
		for(var i = 0; i < nodes.length; ++i){
			var type = source.getItem(nodes[i].id).type;
			// type instanceof Array
			var flag = false;
			for(var j = 0; j < type.length; ++j){
				if(type[j] in this.accept){
					flag = true;
					break;
				}
			}
			if(!flag){
				return false;	// Boolean
			}
		}
		return true;	// Boolean
	},
	copyState: function(keyPressed, self){
		// summary:
		//		Returns true if we need to copy items, false to move.
		//		It is separated to be overwritten dynamically, if needed.
		// keyPressed: Boolean
		//		the "copy" key was pressed
		// self: Boolean?
		//		optional flag that means that we are about to drop on itself

		if(keyPressed){ return true; }
		if(arguments.length < 2){
			self = this == Manager.manager().target;
		}
		if(self){
			if(this.copyOnly){
				return this.selfCopy;
			}
		}else{
			return this.copyOnly;
		}
		return false;	// Boolean
	},
	destroy: function(){
		// summary:
		//		prepares the object to be garbage-collected
		dojo.dnd.Source.superclass.destroy.call(this);
		dojo.forEach(this.topics, dojo.unsubscribe);
		this.targetAnchor = null;
	},

	// mouse event processors
	onMouseMove: function(e){
		// summary:
		//		event processor for onmousemove
		// e: Event
		//		mouse event
		if(this.isDragging && this.targetState == "Disabled"){ return; }
		dojo.dnd.Source.superclass.onMouseMove.call(this, e);
		var m = Manager.manager();
		if(!this.isDragging){
			if(this.mouseDown && this.isSource &&
					(Math.abs(e.pageX - this._lastX) > this.delay || Math.abs(e.pageY - this._lastY) > this.delay)){
				var nodes = this.getSelectedNodes();
				if(nodes.length){
					m.startDrag(this, nodes, this.copyState(dojo.isCopyKey(e), true));
				}
			}
		}
		if(this.isDragging){
			// calculate before/after
			var before = false;
			if(this.current){
				if(!this.targetBox || this.targetAnchor != this.current){
					this.targetBox = dojo.position(this.current, true);
				}
				if(this.horizontal){
					before = (e.pageX - this.targetBox.x) < (this.targetBox.w / 2);
				}else{
					before = (e.pageY - this.targetBox.y) < (this.targetBox.h / 2);
				}
			}
			if(this.current != this.targetAnchor || before != this.before){
				this._markTargetAnchor(before);
				m.canDrop(!this.current || m.source != this || !(this.current.id in this.selection));
			}
		}
	},
	onMouseDown: function(e){
		// summary:
		//		event processor for onmousedown
		// e: Event
		//		mouse event
		if(!this.mouseDown && this._legalMouseDown(e) && (!this.skipForm || !dojo.dnd.isFormElement(e))){
			this.mouseDown = true;
			this._lastX = e.pageX;
			this._lastY = e.pageY;
			dojo.dnd.Source.superclass.onMouseDown.call(this, e);
		}
	},
	onMouseUp: function(e){
		// summary:
		//		event processor for onmouseup
		// e: Event
		//		mouse event
		if(this.mouseDown){
			this.mouseDown = false;
			dojo.dnd.Source.superclass.onMouseUp.call(this, e);
		}
	},

	// topic event processors
	onDndSourceOver: function(source){
		// summary:
		//		topic event processor for /dnd/source/over, called when detected a current source
		// source: Object
		//		the source which has the mouse over it
		if(this != source){
			this.mouseDown = false;
			if(this.targetAnchor){
				this._unmarkTargetAnchor();
			}
		}else if(this.isDragging){
			var m = Manager.manager();
			m.canDrop(this.targetState != "Disabled" && (!this.current || m.source != this || !(this.current.id in this.selection)));
		}
	},
	onDndStart: function(source, nodes, copy){
		// summary:
		//		topic event processor for /dnd/start, called to initiate the DnD operation
		// source: Object
		//		the source which provides items
		// nodes: Array
		//		the list of transferred items
		// copy: Boolean
		//		copy items, if true, move items otherwise
		if(this.autoSync){ this.sync(); }
		if(this.isSource){
			this._changeState("Source", this == source ? (copy ? "Copied" : "Moved") : "");
		}
		var accepted = this.accept && this.checkAcceptance(source, nodes);
		this._changeState("Target", accepted ? "" : "Disabled");
		if(this == source){
			Manager.manager().overSource(this);
		}
		this.isDragging = true;
	},
	onDndDrop: function(source, nodes, copy, target){
		// summary:
		//		topic event processor for /dnd/drop, called to finish the DnD operation
		// source: Object
		//		the source which provides items
		// nodes: Array
		//		the list of transferred items
		// copy: Boolean
		//		copy items, if true, move items otherwise
		// target: Object
		//		the target which accepts items
		if(this == target){
			// this one is for us => move nodes!
			this.onDrop(source, nodes, copy);
		}
		this.onDndCancel();
	},
	onDndCancel: function(){
		// summary:
		//		topic event processor for /dnd/cancel, called to cancel the DnD operation
		if(this.targetAnchor){
			this._unmarkTargetAnchor();
			this.targetAnchor = null;
		}
		this.before = true;
		this.isDragging = false;
		this.mouseDown = false;
		this._changeState("Source", "");
		this._changeState("Target", "");
	},

	// local events
	onDrop: function(source, nodes, copy){
		// summary:
		//		called only on the current target, when drop is performed
		// source: Object
		//		the source which provides items
		// nodes: Array
		//		the list of transferred items
		// copy: Boolean
		//		copy items, if true, move items otherwise

		if(this != source){
			this.onDropExternal(source, nodes, copy);
		}else{
			this.onDropInternal(nodes, copy);
		}
	},
	onDropExternal: function(source, nodes, copy){
		// summary:
		//		called only on the current target, when drop is performed
		//		from an external source
		// source: Object
		//		the source which provides items
		// nodes: Array
		//		the list of transferred items
		// copy: Boolean
		//		copy items, if true, move items otherwise

		var oldCreator = this._normalizedCreator;
		// transferring nodes from the source to the target
		if(this.creator){
			// use defined creator
			this._normalizedCreator = function(node, hint){
				return oldCreator.call(this, source.getItem(node.id).data, hint);
			};
		}else{
			// we have no creator defined => move/clone nodes
			if(copy){
				// clone nodes
				this._normalizedCreator = function(node, hint){
					var t = source.getItem(node.id);
					var n = node.cloneNode(true);
					n.id = dojo.dnd.getUniqueId();
					return {node: n, data: t.data, type: t.type};
				};
			}else{
				// move nodes
				this._normalizedCreator = function(node, hint){
					var t = source.getItem(node.id);
					source.delItem(node.id);
					return {node: node, data: t.data, type: t.type};
				};
			}
		}
		this.selectNone();
		if(!copy && !this.creator){
			source.selectNone();
		}
		this.insertNodes(true, nodes, this.before, this.current);
		if(!copy && this.creator){
			source.deleteSelectedNodes();
		}
		this._normalizedCreator = oldCreator;
	},
	onDropInternal: function(nodes, copy){
		// summary:
		//		called only on the current target, when drop is performed
		//		from the same target/source
		// nodes: Array
		//		the list of transferred items
		// copy: Boolean
		//		copy items, if true, move items otherwise

		var oldCreator = this._normalizedCreator;
		// transferring nodes within the single source
		if(this.current && this.current.id in this.selection){
			// do nothing
			return;
		}
		if(copy){
			if(this.creator){
				// create new copies of data items
				this._normalizedCreator = function(node, hint){
					return oldCreator.call(this, this.getItem(node.id).data, hint);
				};
			}else{
				// clone nodes
				this._normalizedCreator = function(node, hint){
					var t = this.getItem(node.id);
					var n = node.cloneNode(true);
					n.id = dojo.dnd.getUniqueId();
					return {node: n, data: t.data, type: t.type};
				};
			}
		}else{
			// move nodes
			if(!this.current){
				// do nothing
				return;
			}
			this._normalizedCreator = function(node, hint){
				var t = this.getItem(node.id);
				return {node: node, data: t.data, type: t.type};
			};
		}
		this._removeSelection();
		this.insertNodes(true, nodes, this.before, this.current);
		this._normalizedCreator = oldCreator;
	},
	onDraggingOver: function(){
		// summary:
		//		called during the active DnD operation, when items
		//		are dragged over this target, and it is not disabled
	},
	onDraggingOut: function(){
		// summary:
		//		called during the active DnD operation, when items
		//		are dragged away from this target, and it is not disabled
	},

	// utilities
	onOverEvent: function(){
		// summary:
		//		this function is called once, when mouse is over our container
		dojo.dnd.Source.superclass.onOverEvent.call(this);
		Manager.manager().overSource(this);
		if(this.isDragging && this.targetState != "Disabled"){
			this.onDraggingOver();
		}
	},
	onOutEvent: function(){
		// summary:
		//		this function is called once, when mouse is out of our container
		dojo.dnd.Source.superclass.onOutEvent.call(this);
		Manager.manager().outSource(this);
		if(this.isDragging && this.targetState != "Disabled"){
			this.onDraggingOut();
		}
	},
	_markTargetAnchor: function(before){
		// summary:
		//		assigns a class to the current target anchor based on "before" status
		// before: Boolean
		//		insert before, if true, after otherwise
		if(this.current == this.targetAnchor && this.before == before){ return; }
		if(this.targetAnchor){
			this._removeItemClass(this.targetAnchor, this.before ? "Before" : "After");
		}
		this.targetAnchor = this.current;
		this.targetBox = null;
		this.before = before;
		if(this.targetAnchor){
			this._addItemClass(this.targetAnchor, this.before ? "Before" : "After");
		}
	},
	_unmarkTargetAnchor: function(){
		// summary:
		//		removes a class of the current target anchor based on "before" status
		if(!this.targetAnchor){ return; }
		this._removeItemClass(this.targetAnchor, this.before ? "Before" : "After");
		this.targetAnchor = null;
		this.targetBox = null;
		this.before = true;
	},
	_markDndStatus: function(copy){
		// summary:
		//		changes source's state based on "copy" status
		this._changeState("Source", copy ? "Copied" : "Moved");
	},
	_legalMouseDown: function(e){
		// summary:
		//		checks if user clicked on "approved" items
		// e: Event
		//		mouse event

		// accept only the left mouse button
		if(!dojo.mouseButtons.isLeft(e)){ return false; }

		if(!this.withHandles){ return true; }

		// check for handles
		for(var node = e.target; node && node !== this.node; node = node.parentNode){
			if(dojo.hasClass(node, "dojoDndHandle")){ return true; }
			if(dojo.hasClass(node, "dojoDndItem") || dojo.hasClass(node, "dojoDndIgnore")){ break; }
		}
		return false;	// Boolean
	}
});

});

},
'dojo/data/ItemFileReadStore':function(){
define(["../_base/kernel", "../_base/lang", "../_base/declare", "../_base/array", "../_base/xhr", 
	"../Evented", "../_base/window", "./util/filter", "./util/simpleFetch", "../date/stamp"
], function(kernel, lang, declare, array, xhr, Evented, window, filterUtil, simpleFetch, dateStamp) {
	// module:
	//		dojo/data/ItemFileReadStore
	// summary:
	//		TODOC


var ItemFileReadStore = declare("dojo.data.ItemFileReadStore", [Evented],{
	//	summary:
	//		The ItemFileReadStore implements the dojo.data.api.Read API and reads
	//		data from JSON files that have contents in this format --
	//		{ items: [
	//			{ name:'Kermit', color:'green', age:12, friends:['Gonzo', {_reference:{name:'Fozzie Bear'}}]},
	//			{ name:'Fozzie Bear', wears:['hat', 'tie']},
	//			{ name:'Miss Piggy', pets:'Foo-Foo'}
	//		]}
	//		Note that it can also contain an 'identifer' property that specified which attribute on the items
	//		in the array of items that acts as the unique identifier for that item.
	//
	constructor: function(/* Object */ keywordParameters){
		//	summary: constructor
		//	keywordParameters: {url: String}
		//	keywordParameters: {data: jsonObject}
		//	keywordParameters: {typeMap: object)
		//		The structure of the typeMap object is as follows:
		//		{
		//			type0: function || object,
		//			type1: function || object,
		//			...
		//			typeN: function || object
		//		}
		//		Where if it is a function, it is assumed to be an object constructor that takes the
		//		value of _value as the initialization parameters.  If it is an object, then it is assumed
		//		to be an object of general form:
		//		{
		//			type: function, //constructor.
		//			deserialize:	function(value) //The function that parses the value and constructs the object defined by type appropriately.
		//		}

		this._arrayOfAllItems = [];
		this._arrayOfTopLevelItems = [];
		this._loadFinished = false;
		this._jsonFileUrl = keywordParameters.url;
		this._ccUrl = keywordParameters.url;
		this.url = keywordParameters.url;
		this._jsonData = keywordParameters.data;
		this.data = null;
		this._datatypeMap = keywordParameters.typeMap || {};
		if(!this._datatypeMap['Date']){
			//If no default mapping for dates, then set this as default.
			//We use the dojo.date.stamp here because the ISO format is the 'dojo way'
			//of generically representing dates.
			this._datatypeMap['Date'] = {
											type: Date,
											deserialize: function(value){
												return dateStamp.fromISOString(value);
											}
										};
		}
		this._features = {'dojo.data.api.Read':true, 'dojo.data.api.Identity':true};
		this._itemsByIdentity = null;
		this._storeRefPropName = "_S"; // Default name for the store reference to attach to every item.
		this._itemNumPropName = "_0"; // Default Item Id for isItem to attach to every item.
		this._rootItemPropName = "_RI"; // Default Item Id for isItem to attach to every item.
		this._reverseRefMap = "_RRM"; // Default attribute for constructing a reverse reference map for use with reference integrity
		this._loadInProgress = false; //Got to track the initial load to prevent duelling loads of the dataset.
		this._queuedFetches = [];
		if(keywordParameters.urlPreventCache !== undefined){
			this.urlPreventCache = keywordParameters.urlPreventCache?true:false;
		}
		if(keywordParameters.hierarchical !== undefined){
			this.hierarchical = keywordParameters.hierarchical?true:false;
		}
		if(keywordParameters.clearOnClose){
			this.clearOnClose = true;
		}
		if("failOk" in keywordParameters){
			this.failOk = keywordParameters.failOk?true:false;
		}
	},

	url: "",	// use "" rather than undefined for the benefit of the parser (#3539)

	//Internal var, crossCheckUrl.  Used so that setting either url or _jsonFileUrl, can still trigger a reload
	//when clearOnClose and close is used.
	_ccUrl: "",

	data: null,	// define this so that the parser can populate it

	typeMap: null, //Define so parser can populate.

	//Parameter to allow users to specify if a close call should force a reload or not.
	//By default, it retains the old behavior of not clearing if close is called.  But
	//if set true, the store will be reset to default state.  Note that by doing this,
	//all item handles will become invalid and a new fetch must be issued.
	clearOnClose: false,

	//Parameter to allow specifying if preventCache should be passed to the xhrGet call or not when loading data from a url.
	//Note this does not mean the store calls the server on each fetch, only that the data load has preventCache set as an option.
	//Added for tracker: #6072
	urlPreventCache: false,

	//Parameter for specifying that it is OK for the xhrGet call to fail silently.
	failOk: false,

	//Parameter to indicate to process data from the url as hierarchical
	//(data items can contain other data items in js form).  Default is true
	//for backwards compatibility.  False means only root items are processed
	//as items, all child objects outside of type-mapped objects and those in
	//specific reference format, are left straight JS data objects.
	hierarchical: true,

	_assertIsItem: function(/* item */ item){
		//	summary:
		//		This function tests whether the item passed in is indeed an item in the store.
		//	item:
		//		The item to test for being contained by the store.
		if(!this.isItem(item)){
			throw new Error("dojo.data.ItemFileReadStore: Invalid item argument.");
		}
	},

	_assertIsAttribute: function(/* attribute-name-string */ attribute){
		//	summary:
		//		This function tests whether the item passed in is indeed a valid 'attribute' like type for the store.
		//	attribute:
		//		The attribute to test for being contained by the store.
		if(typeof attribute !== "string"){
			throw new Error("dojo.data.ItemFileReadStore: Invalid attribute argument.");
		}
	},

	getValue: function(	/* item */ item,
						/* attribute-name-string */ attribute,
						/* value? */ defaultValue){
		//	summary:
		//		See dojo.data.api.Read.getValue()
		var values = this.getValues(item, attribute);
		return (values.length > 0)?values[0]:defaultValue; // mixed
	},

	getValues: function(/* item */ item,
						/* attribute-name-string */ attribute){
		//	summary:
		//		See dojo.data.api.Read.getValues()

		this._assertIsItem(item);
		this._assertIsAttribute(attribute);
		// Clone it before returning.  refs: #10474
		return (item[attribute] || []).slice(0); // Array
	},

	getAttributes: function(/* item */ item){
		//	summary:
		//		See dojo.data.api.Read.getAttributes()
		this._assertIsItem(item);
		var attributes = [];
		for(var key in item){
			// Save off only the real item attributes, not the special id marks for O(1) isItem.
			if((key !== this._storeRefPropName) && (key !== this._itemNumPropName) && (key !== this._rootItemPropName) && (key !== this._reverseRefMap)){
				attributes.push(key);
			}
		}
		return attributes; // Array
	},

	hasAttribute: function(	/* item */ item,
							/* attribute-name-string */ attribute){
		//	summary:
		//		See dojo.data.api.Read.hasAttribute()
		this._assertIsItem(item);
		this._assertIsAttribute(attribute);
		return (attribute in item);
	},

	containsValue: function(/* item */ item,
							/* attribute-name-string */ attribute,
							/* anything */ value){
		//	summary:
		//		See dojo.data.api.Read.containsValue()
		var regexp = undefined;
		if(typeof value === "string"){
			regexp = filterUtil.patternToRegExp(value, false);
		}
		return this._containsValue(item, attribute, value, regexp); //boolean.
	},

	_containsValue: function(	/* item */ item,
								/* attribute-name-string */ attribute,
								/* anything */ value,
								/* RegExp?*/ regexp){
		//	summary:
		//		Internal function for looking at the values contained by the item.
		//	description:
		//		Internal function for looking at the values contained by the item.  This
		//		function allows for denoting if the comparison should be case sensitive for
		//		strings or not (for handling filtering cases where string case should not matter)
		//
		//	item:
		//		The data item to examine for attribute values.
		//	attribute:
		//		The attribute to inspect.
		//	value:
		//		The value to match.
		//	regexp:
		//		Optional regular expression generated off value if value was of string type to handle wildcarding.
		//		If present and attribute values are string, then it can be used for comparison instead of 'value'
		return array.some(this.getValues(item, attribute), function(possibleValue){
			if(possibleValue !== null && !lang.isObject(possibleValue) && regexp){
				if(possibleValue.toString().match(regexp)){
					return true; // Boolean
				}
			}else if(value === possibleValue){
				return true; // Boolean
			}
		});
	},

	isItem: function(/* anything */ something){
		//	summary:
		//		See dojo.data.api.Read.isItem()
		if(something && something[this._storeRefPropName] === this){
			if(this._arrayOfAllItems[something[this._itemNumPropName]] === something){
				return true;
			}
		}
		return false; // Boolean
	},

	isItemLoaded: function(/* anything */ something){
		//	summary:
		//		See dojo.data.api.Read.isItemLoaded()
		return this.isItem(something); //boolean
	},

	loadItem: function(/* object */ keywordArgs){
		//	summary:
		//		See dojo.data.api.Read.loadItem()
		this._assertIsItem(keywordArgs.item);
	},

	getFeatures: function(){
		//	summary:
		//		See dojo.data.api.Read.getFeatures()
		return this._features; //Object
	},

	getLabel: function(/* item */ item){
		//	summary:
		//		See dojo.data.api.Read.getLabel()
		if(this._labelAttr && this.isItem(item)){
			return this.getValue(item,this._labelAttr); //String
		}
		return undefined; //undefined
	},

	getLabelAttributes: function(/* item */ item){
		//	summary:
		//		See dojo.data.api.Read.getLabelAttributes()
		if(this._labelAttr){
			return [this._labelAttr]; //array
		}
		return null; //null
	},

	_fetchItems: function(	/* Object */ keywordArgs,
							/* Function */ findCallback,
							/* Function */ errorCallback){
		//	summary:
		//		See dojo.data.util.simpleFetch.fetch()
		var self = this,
		    filter = function(requestArgs, arrayOfItems){
			var items = [],
			    i, key;
			if(requestArgs.query){
				var value,
				    ignoreCase = requestArgs.queryOptions ? requestArgs.queryOptions.ignoreCase : false;

				//See if there are any string values that can be regexp parsed first to avoid multiple regexp gens on the
				//same value for each item examined.  Much more efficient.
				var regexpList = {};
				for(key in requestArgs.query){
					value = requestArgs.query[key];
					if(typeof value === "string"){
						regexpList[key] = filterUtil.patternToRegExp(value, ignoreCase);
					}else if(value instanceof RegExp){
						regexpList[key] = value;
					}
				}
				for(i = 0; i < arrayOfItems.length; ++i){
					var match = true;
					var candidateItem = arrayOfItems[i];
					if(candidateItem === null){
						match = false;
					}else{
						for(key in requestArgs.query){
							value = requestArgs.query[key];
							if(!self._containsValue(candidateItem, key, value, regexpList[key])){
								match = false;
							}
						}
					}
					if(match){
						items.push(candidateItem);
					}
				}
				findCallback(items, requestArgs);
			}else{
				// We want a copy to pass back in case the parent wishes to sort the array.
				// We shouldn't allow resort of the internal list, so that multiple callers
				// can get lists and sort without affecting each other.  We also need to
				// filter out any null values that have been left as a result of deleteItem()
				// calls in ItemFileWriteStore.
				for(i = 0; i < arrayOfItems.length; ++i){
					var item = arrayOfItems[i];
					if(item !== null){
						items.push(item);
					}
				}
				findCallback(items, requestArgs);
			}
		};

		if(this._loadFinished){
			filter(keywordArgs, this._getItemsArray(keywordArgs.queryOptions));
		}else{
			//Do a check on the JsonFileUrl and crosscheck it.
			//If it doesn't match the cross-check, it needs to be updated
			//This allows for either url or _jsonFileUrl to he changed to
			//reset the store load location.  Done this way for backwards
			//compatibility.  People use _jsonFileUrl (even though officially
			//private.
			if(this._jsonFileUrl !== this._ccUrl){
				kernel.deprecated("dojo.data.ItemFileReadStore: ",
					"To change the url, set the url property of the store," +
					" not _jsonFileUrl.  _jsonFileUrl support will be removed in 2.0");
				this._ccUrl = this._jsonFileUrl;
				this.url = this._jsonFileUrl;
			}else if(this.url !== this._ccUrl){
				this._jsonFileUrl = this.url;
				this._ccUrl = this.url;
			}

			//See if there was any forced reset of data.
			if(this.data != null){
				this._jsonData = this.data;
				this.data = null;
			}

			if(this._jsonFileUrl){
				//If fetches come in before the loading has finished, but while
				//a load is in progress, we have to defer the fetching to be
				//invoked in the callback.
				if(this._loadInProgress){
					this._queuedFetches.push({args: keywordArgs, filter: filter});
				}else{
					this._loadInProgress = true;
					var getArgs = {
							url: self._jsonFileUrl,
							handleAs: "json-comment-optional",
							preventCache: this.urlPreventCache,
							failOk: this.failOk
						};
					var getHandler = xhr.get(getArgs);
					getHandler.addCallback(function(data){
						try{
							self._getItemsFromLoadedData(data);
							self._loadFinished = true;
							self._loadInProgress = false;

							filter(keywordArgs, self._getItemsArray(keywordArgs.queryOptions));
							self._handleQueuedFetches();
						}catch(e){
							self._loadFinished = true;
							self._loadInProgress = false;
							errorCallback(e, keywordArgs);
						}
					});
					getHandler.addErrback(function(error){
						self._loadInProgress = false;
						errorCallback(error, keywordArgs);
					});

					//Wire up the cancel to abort of the request
					//This call cancel on the deferred if it hasn't been called
					//yet and then will chain to the simple abort of the
					//simpleFetch keywordArgs
					var oldAbort = null;
					if(keywordArgs.abort){
						oldAbort = keywordArgs.abort;
					}
					keywordArgs.abort = function(){
						var df = getHandler;
						if(df && df.fired === -1){
							df.cancel();
							df = null;
						}
						if(oldAbort){
							oldAbort.call(keywordArgs);
						}
					};
				}
			}else if(this._jsonData){
				try{
					this._loadFinished = true;
					this._getItemsFromLoadedData(this._jsonData);
					this._jsonData = null;
					filter(keywordArgs, this._getItemsArray(keywordArgs.queryOptions));
				}catch(e){
					errorCallback(e, keywordArgs);
				}
			}else{
				errorCallback(new Error("dojo.data.ItemFileReadStore: No JSON source data was provided as either URL or a nested Javascript object."), keywordArgs);
			}
		}
	},

	_handleQueuedFetches: function(){
		//	summary:
		//		Internal function to execute delayed request in the store.
		//Execute any deferred fetches now.
		if(this._queuedFetches.length > 0){
			for(var i = 0; i < this._queuedFetches.length; i++){
				var fData = this._queuedFetches[i],
				    delayedQuery = fData.args,
				    delayedFilter = fData.filter;
				if(delayedFilter){
					delayedFilter(delayedQuery, this._getItemsArray(delayedQuery.queryOptions));
				}else{
					this.fetchItemByIdentity(delayedQuery);
				}
			}
			this._queuedFetches = [];
		}
	},

	_getItemsArray: function(/*object?*/queryOptions){
		//	summary:
		//		Internal function to determine which list of items to search over.
		//	queryOptions: The query options parameter, if any.
		if(queryOptions && queryOptions.deep){
			return this._arrayOfAllItems;
		}
		return this._arrayOfTopLevelItems;
	},

	close: function(/*dojo.data.api.Request || keywordArgs || null */ request){
		 //	summary:
		 //		See dojo.data.api.Read.close()
		 if(this.clearOnClose &&
			this._loadFinished &&
			!this._loadInProgress){
			 //Reset all internalsback to default state.  This will force a reload
			 //on next fetch.  This also checks that the data or url param was set
			 //so that the store knows it can get data.  Without one of those being set,
			 //the next fetch will trigger an error.

			 if(((this._jsonFileUrl == "" || this._jsonFileUrl == null) &&
				 (this.url == "" || this.url == null)
				) && this.data == null){
				 console.debug("dojo.data.ItemFileReadStore: WARNING!  Data reload " +
					" information has not been provided." +
					"  Please set 'url' or 'data' to the appropriate value before" +
					" the next fetch");
			 }
			 this._arrayOfAllItems = [];
			 this._arrayOfTopLevelItems = [];
			 this._loadFinished = false;
			 this._itemsByIdentity = null;
			 this._loadInProgress = false;
			 this._queuedFetches = [];
		 }
	},

	_getItemsFromLoadedData: function(/* Object */ dataObject){
		//	summary:
		//		Function to parse the loaded data into item format and build the internal items array.
		//	description:
		//		Function to parse the loaded data into item format and build the internal items array.
		//
		//	dataObject:
		//		The JS data object containing the raw data to convery into item format.
		//
		// 	returns: array
		//		Array of items in store item format.

		// First, we define a couple little utility functions...
		var addingArrays = false,
		    self = this;

		function valueIsAnItem(/* anything */ aValue){
			// summary:
			//		Given any sort of value that could be in the raw json data,
			//		return true if we should interpret the value as being an
			//		item itself, rather than a literal value or a reference.
			// example:
			// 	|	false == valueIsAnItem("Kermit");
			// 	|	false == valueIsAnItem(42);
			// 	|	false == valueIsAnItem(new Date());
			// 	|	false == valueIsAnItem({_type:'Date', _value:'1802-05-14'});
			// 	|	false == valueIsAnItem({_reference:'Kermit'});
			// 	|	true == valueIsAnItem({name:'Kermit', color:'green'});
			// 	|	true == valueIsAnItem({iggy:'pop'});
			// 	|	true == valueIsAnItem({foo:42});
			return (aValue !== null) &&
				(typeof aValue === "object") &&
				(!lang.isArray(aValue) || addingArrays) &&
				(!lang.isFunction(aValue)) &&
				(aValue.constructor == Object || lang.isArray(aValue)) &&
				(typeof aValue._reference === "undefined") &&
				(typeof aValue._type === "undefined") &&
				(typeof aValue._value === "undefined") &&
				self.hierarchical;
		}

		function addItemAndSubItemsToArrayOfAllItems(/* Item */ anItem){
			self._arrayOfAllItems.push(anItem);
			for(var attribute in anItem){
				var valueForAttribute = anItem[attribute];
				if(valueForAttribute){
					if(lang.isArray(valueForAttribute)){
						var valueArray = valueForAttribute;
						for(var k = 0; k < valueArray.length; ++k){
							var singleValue = valueArray[k];
							if(valueIsAnItem(singleValue)){
								addItemAndSubItemsToArrayOfAllItems(singleValue);
							}
						}
					}else{
						if(valueIsAnItem(valueForAttribute)){
							addItemAndSubItemsToArrayOfAllItems(valueForAttribute);
						}
					}
				}
			}
		}

		this._labelAttr = dataObject.label;

		// We need to do some transformations to convert the data structure
		// that we read from the file into a format that will be convenient
		// to work with in memory.

		// Step 1: Walk through the object hierarchy and build a list of all items
		var i,
		    item;
		this._arrayOfAllItems = [];
		this._arrayOfTopLevelItems = dataObject.items;

		for(i = 0; i < this._arrayOfTopLevelItems.length; ++i){
			item = this._arrayOfTopLevelItems[i];
			if(lang.isArray(item)){
				addingArrays = true;
			}
			addItemAndSubItemsToArrayOfAllItems(item);
			item[this._rootItemPropName]=true;
		}

		// Step 2: Walk through all the attribute values of all the items,
		// and replace single values with arrays.  For example, we change this:
		//		{ name:'Miss Piggy', pets:'Foo-Foo'}
		// into this:
		//		{ name:['Miss Piggy'], pets:['Foo-Foo']}
		//
		// We also store the attribute names so we can validate our store
		// reference and item id special properties for the O(1) isItem
		var allAttributeNames = {},
		    key;

		for(i = 0; i < this._arrayOfAllItems.length; ++i){
			item = this._arrayOfAllItems[i];
			for(key in item){
				if(key !== this._rootItemPropName){
					var value = item[key];
					if(value !== null){
						if(!lang.isArray(value)){
							item[key] = [value];
						}
					}else{
						item[key] = [null];
					}
				}
				allAttributeNames[key]=key;
			}
		}

		// Step 3: Build unique property names to use for the _storeRefPropName and _itemNumPropName
		// This should go really fast, it will generally never even run the loop.
		while(allAttributeNames[this._storeRefPropName]){
			this._storeRefPropName += "_";
		}
		while(allAttributeNames[this._itemNumPropName]){
			this._itemNumPropName += "_";
		}
		while(allAttributeNames[this._reverseRefMap]){
			this._reverseRefMap += "_";
		}

		// Step 4: Some data files specify an optional 'identifier', which is
		// the name of an attribute that holds the identity of each item.
		// If this data file specified an identifier attribute, then build a
		// hash table of items keyed by the identity of the items.
		var arrayOfValues;

		var identifier = dataObject.identifier;
		if(identifier){
			this._itemsByIdentity = {};
			this._features['dojo.data.api.Identity'] = identifier;
			for(i = 0; i < this._arrayOfAllItems.length; ++i){
				item = this._arrayOfAllItems[i];
				arrayOfValues = item[identifier];
				var identity = arrayOfValues[0];
				if(!Object.hasOwnProperty.call(this._itemsByIdentity, identity)){
					this._itemsByIdentity[identity] = item;
				}else{
					if(this._jsonFileUrl){
						throw new Error("dojo.data.ItemFileReadStore:  The json data as specified by: [" + this._jsonFileUrl + "] is malformed.  Items within the list have identifier: [" + identifier + "].  Value collided: [" + identity + "]");
					}else if(this._jsonData){
						throw new Error("dojo.data.ItemFileReadStore:  The json data provided by the creation arguments is malformed.  Items within the list have identifier: [" + identifier + "].  Value collided: [" + identity + "]");
					}
				}
			}
		}else{
			this._features['dojo.data.api.Identity'] = Number;
		}

		// Step 5: Walk through all the items, and set each item's properties
		// for _storeRefPropName and _itemNumPropName, so that store.isItem() will return true.
		for(i = 0; i < this._arrayOfAllItems.length; ++i){
			item = this._arrayOfAllItems[i];
			item[this._storeRefPropName] = this;
			item[this._itemNumPropName] = i;
		}

		// Step 6: We walk through all the attribute values of all the items,
		// looking for type/value literals and item-references.
		//
		// We replace item-references with pointers to items.  For example, we change:
		//		{ name:['Kermit'], friends:[{_reference:{name:'Miss Piggy'}}] }
		// into this:
		//		{ name:['Kermit'], friends:[miss_piggy] }
		// (where miss_piggy is the object representing the 'Miss Piggy' item).
		//
		// We replace type/value pairs with typed-literals.  For example, we change:
		//		{ name:['Nelson Mandela'], born:[{_type:'Date', _value:'1918-07-18'}] }
		// into this:
		//		{ name:['Kermit'], born:(new Date(1918, 6, 18)) }
		//
		// We also generate the associate map for all items for the O(1) isItem function.
		for(i = 0; i < this._arrayOfAllItems.length; ++i){
			item = this._arrayOfAllItems[i]; // example: { name:['Kermit'], friends:[{_reference:{name:'Miss Piggy'}}] }
			for(key in item){
				arrayOfValues = item[key]; // example: [{_reference:{name:'Miss Piggy'}}]
				for(var j = 0; j < arrayOfValues.length; ++j){
					value = arrayOfValues[j]; // example: {_reference:{name:'Miss Piggy'}}
					if(value !== null && typeof value == "object"){
						if(("_type" in value) && ("_value" in value)){
							var type = value._type; // examples: 'Date', 'Color', or 'ComplexNumber'
							var mappingObj = this._datatypeMap[type]; // examples: Date, dojo.Color, foo.math.ComplexNumber, {type: dojo.Color, deserialize(value){ return new dojo.Color(value)}}
							if(!mappingObj){
								throw new Error("dojo.data.ItemFileReadStore: in the typeMap constructor arg, no object class was specified for the datatype '" + type + "'");
							}else if(lang.isFunction(mappingObj)){
								arrayOfValues[j] = new mappingObj(value._value);
							}else if(lang.isFunction(mappingObj.deserialize)){
								arrayOfValues[j] = mappingObj.deserialize(value._value);
							}else{
								throw new Error("dojo.data.ItemFileReadStore: Value provided in typeMap was neither a constructor, nor a an object with a deserialize function");
							}
						}
						if(value._reference){
							var referenceDescription = value._reference; // example: {name:'Miss Piggy'}
							if(!lang.isObject(referenceDescription)){
								// example: 'Miss Piggy'
								// from an item like: { name:['Kermit'], friends:[{_reference:'Miss Piggy'}]}
								arrayOfValues[j] = this._getItemByIdentity(referenceDescription);
							}else{
								// example: {name:'Miss Piggy'}
								// from an item like: { name:['Kermit'], friends:[{_reference:{name:'Miss Piggy'}}] }
								for(var k = 0; k < this._arrayOfAllItems.length; ++k){
									var candidateItem = this._arrayOfAllItems[k],
									    found = true;
									for(var refKey in referenceDescription){
										if(candidateItem[refKey] != referenceDescription[refKey]){
											found = false;
										}
									}
									if(found){
										arrayOfValues[j] = candidateItem;
									}
								}
							}
							if(this.referenceIntegrity){
								var refItem = arrayOfValues[j];
								if(this.isItem(refItem)){
									this._addReferenceToMap(refItem, item, key);
								}
							}
						}else if(this.isItem(value)){
							//It's a child item (not one referenced through _reference).
							//We need to treat this as a referenced item, so it can be cleaned up
							//in a write store easily.
							if(this.referenceIntegrity){
								this._addReferenceToMap(value, item, key);
							}
						}
					}
				}
			}
		}
	},

	_addReferenceToMap: function(/*item*/ refItem, /*item*/ parentItem, /*string*/ attribute){
		 //	summary:
		 //		Method to add an reference map entry for an item and attribute.
		 //	description:
		 //		Method to add an reference map entry for an item and attribute. 		 //
		 //	refItem:
		 //		The item that is referenced.
		 //	parentItem:
		 //		The item that holds the new reference to refItem.
		 //	attribute:
		 //		The attribute on parentItem that contains the new reference.

		 //Stub function, does nothing.  Real processing is in ItemFileWriteStore.
	},

	getIdentity: function(/* item */ item){
		//	summary:
		//		See dojo.data.api.Identity.getIdentity()
		var identifier = this._features['dojo.data.api.Identity'];
		if(identifier === Number){
			return item[this._itemNumPropName]; // Number
		}else{
			var arrayOfValues = item[identifier];
			if(arrayOfValues){
				return arrayOfValues[0]; // Object || String
			}
		}
		return null; // null
	},

	fetchItemByIdentity: function(/* Object */ keywordArgs){
		//	summary:
		//		See dojo.data.api.Identity.fetchItemByIdentity()

		// Hasn't loaded yet, we have to trigger the load.
		var item,
		    scope;
		if(!this._loadFinished){
			var self = this;
			//Do a check on the JsonFileUrl and crosscheck it.
			//If it doesn't match the cross-check, it needs to be updated
			//This allows for either url or _jsonFileUrl to he changed to
			//reset the store load location.  Done this way for backwards
			//compatibility.  People use _jsonFileUrl (even though officially
			//private.
			if(this._jsonFileUrl !== this._ccUrl){
				kernel.deprecated("dojo.data.ItemFileReadStore: ",
					"To change the url, set the url property of the store," +
					" not _jsonFileUrl.  _jsonFileUrl support will be removed in 2.0");
				this._ccUrl = this._jsonFileUrl;
				this.url = this._jsonFileUrl;
			}else if(this.url !== this._ccUrl){
				this._jsonFileUrl = this.url;
				this._ccUrl = this.url;
			}

			//See if there was any forced reset of data.
			if(this.data != null && this._jsonData == null){
				this._jsonData = this.data;
				this.data = null;
			}

			if(this._jsonFileUrl){

				if(this._loadInProgress){
					this._queuedFetches.push({args: keywordArgs});
				}else{
					this._loadInProgress = true;
					var getArgs = {
							url: self._jsonFileUrl,
							handleAs: "json-comment-optional",
							preventCache: this.urlPreventCache,
							failOk: this.failOk
					};
					var getHandler = xhr.get(getArgs);
					getHandler.addCallback(function(data){
						var scope = keywordArgs.scope?keywordArgs.scope:window.global;
						try{
							self._getItemsFromLoadedData(data);
							self._loadFinished = true;
							self._loadInProgress = false;
							item = self._getItemByIdentity(keywordArgs.identity);
							if(keywordArgs.onItem){
								keywordArgs.onItem.call(scope, item);
							}
							self._handleQueuedFetches();
						}catch(error){
							self._loadInProgress = false;
							if(keywordArgs.onError){
								keywordArgs.onError.call(scope, error);
							}
						}
					});
					getHandler.addErrback(function(error){
						self._loadInProgress = false;
						if(keywordArgs.onError){
							var scope = keywordArgs.scope?keywordArgs.scope:window.global;
							keywordArgs.onError.call(scope, error);
						}
					});
				}

			}else if(this._jsonData){
				// Passed in data, no need to xhr.
				self._getItemsFromLoadedData(self._jsonData);
				self._jsonData = null;
				self._loadFinished = true;
				item = self._getItemByIdentity(keywordArgs.identity);
				if(keywordArgs.onItem){
					scope = keywordArgs.scope?keywordArgs.scope:window.global;
					keywordArgs.onItem.call(scope, item);
				}
			}
		}else{
			// Already loaded.  We can just look it up and call back.
			item = this._getItemByIdentity(keywordArgs.identity);
			if(keywordArgs.onItem){
				scope = keywordArgs.scope?keywordArgs.scope:window.global;
				keywordArgs.onItem.call(scope, item);
			}
		}
	},

	_getItemByIdentity: function(/* Object */ identity){
		//	summary:
		//		Internal function to look an item up by its identity map.
		var item = null;
		if(this._itemsByIdentity){
			// If this map is defined, we need to just try to get it.  If it fails
			// the item does not exist.
			if(Object.hasOwnProperty.call(this._itemsByIdentity, identity)){
				item = this._itemsByIdentity[identity];
			}
		}else if (Object.hasOwnProperty.call(this._arrayOfAllItems, identity)){
			item = this._arrayOfAllItems[identity];
		}
		if(item === undefined){
			item = null;
		}
		return item; // Object
	},

	getIdentityAttributes: function(/* item */ item){
		//	summary:
		//		See dojo.data.api.Identity.getIdentityAttributes()

		var identifier = this._features['dojo.data.api.Identity'];
		if(identifier === Number){
			// If (identifier === Number) it means getIdentity() just returns
			// an integer item-number for each item.  The dojo.data.api.Identity
			// spec says we need to return null if the identity is not composed
			// of attributes
			return null; // null
		}else{
			return [identifier]; // Array
		}
	},

	_forceLoad: function(){
		//	summary:
		//		Internal function to force a load of the store if it hasn't occurred yet.  This is required
		//		for specific functions to work properly.
		var self = this;
		//Do a check on the JsonFileUrl and crosscheck it.
		//If it doesn't match the cross-check, it needs to be updated
		//This allows for either url or _jsonFileUrl to he changed to
		//reset the store load location.  Done this way for backwards
		//compatibility.  People use _jsonFileUrl (even though officially
		//private.
		if(this._jsonFileUrl !== this._ccUrl){
			kernel.deprecated("dojo.data.ItemFileReadStore: ",
				"To change the url, set the url property of the store," +
				" not _jsonFileUrl.  _jsonFileUrl support will be removed in 2.0");
			this._ccUrl = this._jsonFileUrl;
			this.url = this._jsonFileUrl;
		}else if(this.url !== this._ccUrl){
			this._jsonFileUrl = this.url;
			this._ccUrl = this.url;
		}

		//See if there was any forced reset of data.
		if(this.data != null){
			this._jsonData = this.data;
			this.data = null;
		}

		if(this._jsonFileUrl){
				var getArgs = {
					url: this._jsonFileUrl,
					handleAs: "json-comment-optional",
					preventCache: this.urlPreventCache,
					failOk: this.failOk,
					sync: true
				};
			var getHandler = xhr.get(getArgs);
			getHandler.addCallback(function(data){
				try{
					//Check to be sure there wasn't another load going on concurrently
					//So we don't clobber data that comes in on it.  If there is a load going on
					//then do not save this data.  It will potentially clobber current data.
					//We mainly wanted to sync/wait here.
					//TODO:  Revisit the loading scheme of this store to improve multi-initial
					//request handling.
					if(self._loadInProgress !== true && !self._loadFinished){
						self._getItemsFromLoadedData(data);
						self._loadFinished = true;
					}else if(self._loadInProgress){
						//Okay, we hit an error state we can't recover from.  A forced load occurred
						//while an async load was occurring.  Since we cannot block at this point, the best
						//that can be managed is to throw an error.
						throw new Error("dojo.data.ItemFileReadStore:  Unable to perform a synchronous load, an async load is in progress.");
					}
				}catch(e){
					console.log(e);
					throw e;
				}
			});
			getHandler.addErrback(function(error){
				throw error;
			});
		}else if(this._jsonData){
			self._getItemsFromLoadedData(self._jsonData);
			self._jsonData = null;
			self._loadFinished = true;
		}
	}
});
//Mix in the simple fetch implementation to this class.
lang.extend(ItemFileReadStore,simpleFetch);

return ItemFileReadStore;
});

},
'esri/toolbars/_VertexMover':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!dojox/gfx/move"], function(dijit,dojo,dojox){
dojo.provide("esri.toolbars._VertexMover");

dojo.require("dojox.gfx.move");

dojo.declare("esri.toolbars.VertexMover", null, {
  constructor: function(point, symbol, relatedGraphic, segIndex, ptIndex, segLength, editor, placeholder) {
    this.point = point;
    this.symbol = symbol;
    this.relatedGraphic = relatedGraphic;
    this.segIndex = segIndex;
    this.ptIndex = ptIndex;
    this.segLength = segLength;
    this.editor = editor;
    this.map = editor.map;
    this._scratchGL = editor.toolbar._scratchGL;
    this._placeholder = placeholder || false;
    
    this._type = relatedGraphic.geometry.type;
    this._init();
    this._enable();
  },
  
  refresh: function(force) {
    if (force || this._needRefresh()) {
      this._disable();
      this._enable();
    }
  },
  
  destroy: function() {
    this._disable();
    if (this.graphic) {
      this._scratchGL.remove(this.graphic);
    }
    this.point = this.symbol = this.graphic = this.relatedGraphic = this.segIndex = this.ptIndex = this.segLength = this.editor = this.map = this._scratchGL = null;
  },
  
  /***************************
   * Events
   * 
   * Handled for Edit toolbar
   *   onVertexMoveStart (graphic, vertexInfo)
   *   onVertexFirstMove (graphic, vertexInfo)
   *   onVertexMove (graphic, vertexInfo, transform)
   *   onVertexMoveStop (graphic, vertexInfo, transform)
   *   onVertexAdd (graphic, vertexInfo)
   *   onVertexClick (graphic, vertexInfo)
   ***************************/
  
  /*******************
   * Internal Methods
   *******************/
  
  _init: function() {
    var newPt = new esri.geometry.Point(this.point.toJson());
    var ptGraphic = new esri.Graphic(newPt, this.symbol);

    switch(this._type) {
      case "multipoint":
        // don't add the graphic to GL, just pretend
        ptGraphic._shape = this.relatedGraphic.getDojoShape().children[this.ptIndex];
        break;
      case "polyline":
      case "polygon":
        this._scratchGL.add(ptGraphic);
        break;        
    }
    this.graphic = ptGraphic;
  },
  
  _enable: function() {
    var shape = this.graphic.getDojoShape();
    if (shape) {
      shape._hasMover = true;
      this._moveable = this._getMoveable(shape);
      
      var node = shape.getEventSource();
      if (node) {
        dojo.style(node, "cursor", this.editor.toolbar._cursors[this._placeholder ? "move-gv" : "move-v"]);
      }
    }
  },
  
  _disable: function() {
    var moveable = this._moveable;
    if (moveable) {
      dojo.disconnect(this._startHandle);
      dojo.disconnect(this._firstHandle);
      dojo.disconnect(this._movingHandle);
      dojo.disconnect(this._stopHandle);
      var shape = moveable.shape;
      if (shape) {
        var node = shape.getEventSource();
        if (node) {
          dojo.style(node, "cursor", null);
        }
      }
      moveable.destroy();
      this._moveable = null;
    }
  },
  
  _needRefresh: function() {
    var shape = this.graphic.getDojoShape(), need = false;
    if (shape) {
      switch(this._type) {
        case "multipoint":
          var group = this.relatedGraphic.getDojoShape();
          if (group) {
            var child = group.children[this.ptIndex];
            if (shape !== child) {
              shape = child;
              this.graphic._shape = shape;
              need = true;
            }
          }
          break;
        case "polyline":
        case "polygon":
          need = !shape._hasMover;
          break;
      }
    }
    return need;
  },
  
  _getMoveable: function(shape) {
    // Note that support for leftButtonOnly is added to dojox/gfx/Moveable.js
    // as a local/private patch for Dojo 1.6.1
    // TODO
    // Perhaps we should enable leftButtonOnly for all browsers
    var moveable = new dojox.gfx.Moveable(shape, dojo.isMac && dojo.isFF && !esri.isTouchEnabled && { leftButtonOnly: true } );
    this._startHandle = dojo.connect(moveable, "onMoveStart", this, this._moveStartHandler);
    this._firstHandle = dojo.connect(moveable, "onFirstMove", this, this._firstMoveHandler);
    this._movingHandle = dojo.connect(moveable, "onMoving", this, this._movingHandler);
    this._stopHandle = dojo.connect(moveable, "onMoveStop", this, this._moveStopHandler);
    return moveable;
  },
  
  _getPtIndex: function() {
    return this.ptIndex + (this._placeholder ? 1 : 0);
  },
  
  _getInfo: function() {
    return {
      graphic: this.graphic,
      isGhost: this._placeholder,
      segmentIndex: this.segIndex,
      pointIndex: this._getPtIndex()
    };
  },
  
  _moveStartHandler: function(mover) {
    //console.log("[M-START]");
    var map = this.map;
    if (map.snappingManager) {
      map.snappingManager._setUpSnapping();
    }
    mover.shape.moveToFront();
    this.constructor.onMoveStart(this);
    this.editor.toolbar.onVertexMoveStart(this.relatedGraphic, this._getInfo());
  },
  
  _firstMoveHandler: function(mover) {
    //console.log("[M-FIRST START]");
    var shape = mover.shape;
    var edges = this._getControlEdges();
    var surface = this._scratchGL._div;
    
    var i, lines = [], wrapOffset = mover.host.shape._wrapOffsets[0] || 0;
    for (i = 0; i < edges.length; i++) {
      var edge = edges[i];
      edge.x1 += wrapOffset;
      edge.x2 += wrapOffset;
      lines.push([ surface.createLine({x1: edge.x1, y1: edge.y1, x2: edge.x2, y2: edge.y2}).setStroke(this.editor._lineStroke), edge.x1, edge.y1, edge.x2, edge.y2 ]);
    }
    shape._lines = lines;
    mover.shape.moveToFront();
    
    this.constructor.onFirstMove(this);
    this.editor.toolbar.onVertexFirstMove(this.relatedGraphic, this._getInfo());
  },
  
  _movingHandler: function(mover) {
    var shape = mover.shape, tx = shape.getTransform();
    
    // update guide lines
    var i, lines = shape._lines;
    for (i = 0; i < lines.length; i++) {
      var line = lines[i];
      line[0].setShape({x1: line[1] + tx.dx, y1: line[2] + tx.dy, x2: line[3], y2: line[4]});
    }
    
    this.editor.toolbar.onVertexMove(this.relatedGraphic, this._getInfo(), tx);
  },
  
  _moveStopHandler: function(mover) {
    //console.log("[M-STOP]");
    var shape = mover.shape, tx = shape.getTransform(), map = this.map;
    var host = this.graphic;

    // remove guide lines
    var i, lines = shape._lines;
    if (lines) {
      for (i = 0; i < lines.length; i++) {
        lines[i][0].removeShape();
      }
      shape._lines = null;
    }
    
    var ph = false, moved = true, info = this._getInfo();
    if (tx && (tx.dx || tx.dy)) {
      if (this._placeholder) {
        this._placeholder = false;
        ph = true;
      }
    }
    else {
      moved = false; // no movement
    }
    
    // update geometry for control graphic
    var snappingPoint;
    if (this.map.snappingManager) {
      snappingPoint = this.map.snappingManager._snappingPoint;
    }
    var newMapPt = snappingPoint || map.toMap(map.toScreen(host.geometry).offset(tx.dx, tx.dy));
    if(this.map.snappingManager) {
      this.map.snappingManager._killOffSnapping();
    }
    shape.setTransform(null);
    host.setGeometry(newMapPt);
    
    this.constructor.onMoveStop(this, tx);
    this.editor.toolbar.onVertexMoveStop(this.relatedGraphic, info, tx);
    if (!moved) {
      this.editor.toolbar.onVertexClick(this.relatedGraphic, info);
    }
    if (ph) {
      this.editor.toolbar.onVertexAdd(this.relatedGraphic, this._getInfo());
    }
  },
  
  _getControlEdges: function() {
    var map = this.map;
    var geometry = this.relatedGraphic.geometry;
    var segIndex = this.segIndex, ptIndex = this.ptIndex, segLen = this.segLength;
    ////console.log("seg ", segIndex, " point ", ptIndex, " length ", segLen);

    var surface = this._scratchGL._div;
    var surfaceTx = surface.getTransform(); // after map pan, the surface will have a transformation set, consider it as well
    var sdx = surfaceTx.dx, sdy = surfaceTx.dy;
    ////console.log(sdx, sdy);

    var pt = map.toScreen(this.graphic.geometry);
    var x = pt.x - sdx, y = pt.y - sdy;

    var edges = [];
    var cpoints = this.editor._getControlPoints(this, geometry, segIndex, ptIndex, segLen);
    if (cpoints[0]) {
      edges.push({x1: x, y1: y, x2: cpoints[0].x - sdx, y2: cpoints[0].y - sdy});
    }
    if (cpoints[1]) {
      edges.push({x1: x, y1: y, x2: cpoints[1].x - sdx, y2: cpoints[1].y - sdy});
    }
    
    return edges;
  }
});

// mixins
dojo.mixin(esri.toolbars.VertexMover, {
  onMoveStart: function() {},
  onFirstMove: function() {},
  onMoveStop: function() {}
});

});

},
'dojo/window':function(){
define(["./_base/lang", "./_base/sniff", "./_base/window", "./dom", "./dom-geometry", "./dom-style"],
	function(lang, has, baseWindow, dom, geom, style) {

// module:
//		dojo/window
// summary:
//		TODOC

var window = lang.getObject("dojo.window", true);

/*=====
dojo.window = {
	// summary:
	//		TODO
};
window = dojo.window;
=====*/

window.getBox = function(){
	// summary:
	//		Returns the dimensions and scroll position of the viewable area of a browser window

	var
		scrollRoot = (baseWindow.doc.compatMode == 'BackCompat') ? baseWindow.body() : baseWindow.doc.documentElement,
		// get scroll position
		scroll = geom.docScroll(), // scrollRoot.scrollTop/Left should work
		w, h;

	if(has("touch")){ // if(scrollbars not supported)
		var uiWindow = baseWindow.doc.parentWindow || baseWindow.doc.defaultView;   // use UI window, not dojo.global window. baseWindow.doc.parentWindow probably not needed since it's not defined for webkit
		// on mobile, scrollRoot.clientHeight <= uiWindow.innerHeight <= scrollRoot.offsetHeight, return uiWindow.innerHeight
		w = uiWindow.innerWidth || scrollRoot.clientWidth; // || scrollRoot.clientXXX probably never evaluated
		h = uiWindow.innerHeight || scrollRoot.clientHeight;
	}else{
		// on desktops, scrollRoot.clientHeight <= scrollRoot.offsetHeight <= uiWindow.innerHeight, return scrollRoot.clientHeight
		// uiWindow.innerWidth/Height includes the scrollbar and cannot be used
		w = scrollRoot.clientWidth;
		h = scrollRoot.clientHeight;
	}
	return {
		l: scroll.x,
		t: scroll.y,
		w: w,
		h: h
	};
};

window.get = function(doc){
	// summary:
	// 		Get window object associated with document doc

	// In some IE versions (at least 6.0), document.parentWindow does not return a
	// reference to the real window object (maybe a copy), so we must fix it as well
	// We use IE specific execScript to attach the real window reference to
	// document._parentWindow for later use
	if(has("ie") && window !== document.parentWindow){
		/*
		In IE 6, only the variable "window" can be used to connect events (others
		may be only copies).
		*/
		doc.parentWindow.execScript("document._parentWindow = window;", "Javascript");
		//to prevent memory leak, unset it after use
		//another possibility is to add an onUnload handler which seems overkill to me (liucougar)
		var win = doc._parentWindow;
		doc._parentWindow = null;
		return win;	//	Window
	}

	return doc.parentWindow || doc.defaultView;	//	Window
};

window.scrollIntoView = function(/*DomNode*/ node, /*Object?*/ pos){
	// summary:
	//		Scroll the passed node into view, if it is not already.

	// don't rely on node.scrollIntoView working just because the function is there

	try{ // catch unexpected/unrecreatable errors (#7808) since we can recover using a semi-acceptable native method
		node = dom.byId(node);
		var doc = node.ownerDocument || baseWindow.doc,
			body = doc.body || baseWindow.body(),
			html = doc.documentElement || body.parentNode,
			isIE = has("ie"), isWK = has("webkit");
		// if an untested browser, then use the native method
		if((!(has("mozilla") || isIE || isWK || has("opera")) || node == body || node == html) && (typeof node.scrollIntoView != "undefined")){
			node.scrollIntoView(false); // short-circuit to native if possible
			return;
		}
		var backCompat = doc.compatMode == 'BackCompat',
			clientAreaRoot = (isIE >= 9 && node.ownerDocument.parentWindow.frameElement)
				? ((html.clientHeight > 0 && html.clientWidth > 0 && (body.clientHeight == 0 || body.clientWidth == 0 || body.clientHeight > html.clientHeight || body.clientWidth > html.clientWidth)) ? html : body)
				: (backCompat ? body : html),
			scrollRoot = isWK ? body : clientAreaRoot,
			rootWidth = clientAreaRoot.clientWidth,
			rootHeight = clientAreaRoot.clientHeight,
			rtl = !geom.isBodyLtr(),
			nodePos = pos || geom.position(node),
			el = node.parentNode,
			isFixed = function(el){
				return ((isIE <= 6 || (isIE && backCompat))? false : (style.get(el, 'position').toLowerCase() == "fixed"));
			};
		if(isFixed(node)){ return; } // nothing to do

		while(el){
			if(el == body){ el = scrollRoot; }
			var elPos = geom.position(el),
				fixedPos = isFixed(el);

			if(el == scrollRoot){
				elPos.w = rootWidth; elPos.h = rootHeight;
				if(scrollRoot == html && isIE && rtl){ elPos.x += scrollRoot.offsetWidth-elPos.w; } // IE workaround where scrollbar causes negative x
				if(elPos.x < 0 || !isIE){ elPos.x = 0; } // IE can have values > 0
				if(elPos.y < 0 || !isIE){ elPos.y = 0; }
			}else{
				var pb = geom.getPadBorderExtents(el);
				elPos.w -= pb.w; elPos.h -= pb.h; elPos.x += pb.l; elPos.y += pb.t;
				var clientSize = el.clientWidth,
					scrollBarSize = elPos.w - clientSize;
				if(clientSize > 0 && scrollBarSize > 0){
					elPos.w = clientSize;
					elPos.x += (rtl && (isIE || el.clientLeft > pb.l/*Chrome*/)) ? scrollBarSize : 0;
				}
				clientSize = el.clientHeight;
				scrollBarSize = elPos.h - clientSize;
				if(clientSize > 0 && scrollBarSize > 0){
					elPos.h = clientSize;
				}
			}
			if(fixedPos){ // bounded by viewport, not parents
				if(elPos.y < 0){
					elPos.h += elPos.y; elPos.y = 0;
				}
				if(elPos.x < 0){
					elPos.w += elPos.x; elPos.x = 0;
				}
				if(elPos.y + elPos.h > rootHeight){
					elPos.h = rootHeight - elPos.y;
				}
				if(elPos.x + elPos.w > rootWidth){
					elPos.w = rootWidth - elPos.x;
				}
			}
			// calculate overflow in all 4 directions
			var l = nodePos.x - elPos.x, // beyond left: < 0
				t = nodePos.y - Math.max(elPos.y, 0), // beyond top: < 0
				r = l + nodePos.w - elPos.w, // beyond right: > 0
				bot = t + nodePos.h - elPos.h; // beyond bottom: > 0
			if(r * l > 0){
				var s = Math[l < 0? "max" : "min"](l, r);
				if(rtl && ((isIE == 8 && !backCompat) || isIE >= 9)){ s = -s; }
				nodePos.x += el.scrollLeft;
				el.scrollLeft += s;
				nodePos.x -= el.scrollLeft;
			}
			if(bot * t > 0){
				nodePos.y += el.scrollTop;
				el.scrollTop += Math[t < 0? "max" : "min"](t, bot);
				nodePos.y -= el.scrollTop;
			}
			el = (el != scrollRoot) && !fixedPos && el.parentNode;
		}
	}catch(error){
		console.error('scrollIntoView: ' + error);
		node.scrollIntoView(false);
	}
};

return window;
});

},
'esri/toolbars/edit':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/toolbars/_toolbar,esri/toolbars/_GraphicMover,esri/toolbars/_VertexEditor,esri/toolbars/_Box"], function(dijit,dojo,dojox){
dojo.provide("esri.toolbars.edit");

dojo.require("esri.toolbars._toolbar");
dojo.require("esri.toolbars._GraphicMover");
dojo.require("esri.toolbars._VertexEditor");
dojo.require("esri.toolbars._Box");

// TODO
// [haitham] vertex move stop is fired when right-clicking on a vertex
// [DONE] arguments for onVertexClick etc for interpolated vertices
// [DONE] support multiple rings and paths
// DEL after clicking a vertex can delete the vertex
// ESC while moving a vertex or ghost vertex should cancel the current move
// optimize vertex movers by not creating moveable until mouseover
// add a point to multipoint
// context sensitive cursors
// undo/redo methods
// [DONE] Double click event for GL
// [GL?] moving a graphic in MOVE mode, fires graphic click at the end of move (http://pponnusamy.esri.com:9090/jsapi/mapapps/prototypes/editing/test-click-to-change.html)
//   - this problem is tough to solve when using moveable
// [DONE] remove vertices
// [DONE] vertex selection/unselection or just click?
// [DONE] context menu for vertices


/***************
 * CSS Includes
 ***************/
//anonymous function to load CSS files required for this module
(function() {
  var link = document.createElement("link");
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = dojo.moduleUrl("esri", "toolbars/css/edit.css").toString();
  document.getElementsByTagName("head").item(0).appendChild(link);
}());


/*********************
 * esri.toolbars.Edit
 *********************/

dojo.declare("esri.toolbars.Edit", esri.toolbars._Toolbar, {
  
  /**************
   * Constructor
   **************/
  
  constructor: function(/*esri.Map*/ map, /*Object?*/ options) {
    //console.log("edit toolbar constructor");
    this._map = map;
    this._tool = 0;

    //this._scratchGL = new esri.layers.GraphicsLayer();
    //map.addLayer(this._scratchGL);
    this._scratchGL = map.graphics;
    
    // default options
    var touch = esri.isTouchEnabled;
    
    this._defaultOptions = dojo.mixin({
      vertexSymbol: new esri.symbol.SimpleMarkerSymbol(
        esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 
        touch ? 20 : 12, 
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 0, 0.5]), 1), 
        new dojo.Color([128, 128, 128])
      ),
      ghostVertexSymbol: new esri.symbol.SimpleMarkerSymbol(
        esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 
        touch ? 18 : 10, 
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 0, 0.5]), 1), 
        new dojo.Color([255, 255, 255, 0.75])
      ),
      ghostLineSymbol: new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DOT, new dojo.Color([128, 128, 128]), 2),
      allowDeleteVertices: true,
      allowAddVertices: true,
      
      rotateHandleOffset: touch ? 24 : 16,
      boxLineSymbol: new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([64, 64, 64]), 1),
      boxHandleSymbol: new esri.symbol.SimpleMarkerSymbol(
        esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 
        touch ? 16 : 9, 
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 0, 0.5]), 1), 
        new dojo.Color([255, 255, 255, 0.75])
      )
    }, options || {});    
  },
  
  /*****************
   * Public Methods
   *****************/
  
  activate: function(/*Number*/ tool, /*esri.Graphic*/ graphic, /*Object?*/ options) {
    //console.log("Activate");
    this.deactivate();
    this._graphic = graphic;
    this._options = dojo.mixin(dojo.mixin({}, this._defaultOptions), options || {});

    var MOVE = esri.toolbars.Edit.MOVE, EDIT = esri.toolbars.Edit.EDIT_VERTICES;
    var SCALE = esri.toolbars.Edit.SCALE, ROTATE = esri.toolbars.Edit.ROTATE;
    var move = false, edit = false, box = false;
    
    if ((tool & MOVE) === MOVE) {
      move = this._enableMove(graphic);
    }
    
    var scale = ((tool & SCALE) === SCALE), rotate = ((tool & ROTATE) === ROTATE);
    if (scale || rotate) {
      box = this._enableBoxEditing(graphic, scale, rotate);
    }
    
    if ((tool & EDIT) === EDIT) {
      edit = this._enableVertexEditing(graphic);
    }
    
//    if (move || edit) {
//      if (move && edit) {
//        this._setupMultitoolMode();
//      }
//    }
    
    if (!(move || edit || box)) {
      throw new Error("[esri.toolbars.Edit::activate] " + esri.bundle.toolbars.edit.invalidType);
    }
    
    this._tool = tool;

    // post processing
    var map = this._map;
    if (this._tool) {
      // we need to redraw the graphics that were previously clipped out
      // and now getting into the viewport
      this._mapPanEndHandle = dojo.connect(map, "onPanEnd", this, this._mapPanEndHandler);
      this._mapExtChgHandle = dojo.connect(map, "onExtentChange", this, this._mapExtentChangeHandler);

      this.onActivate(this._tool, graphic);
    }
    if (map.snappingManager && (move || edit)) {
      map.snappingManager._startSelectionLayerQuery();
    }
  },
  
  deactivate: function() {
    //console.log("De-activate");
    var tool = this._tool, graphic = this._graphic;
    if (!tool) {
      return;
    }

    var modified = !!this._modified;
    
    this._clear();
    //this._setTool(0);
    dojo.disconnect(this._mapPanEndHandle);
    dojo.disconnect(this._mapExtChgHandle);
    //dojo.disconnect(this._gFMHandle);
    //dojo.disconnect(this._gMSHandle);
    this._graphic = null;
    this.onDeactivate(tool, graphic, {
      isModified: modified
    });
    if (this._map.snappingManager) {
      this._map.snappingManager._stopSelectionLayerQuery();
    }
  },
  
  refresh: function() {
    this._refreshMoveables(/*force*/ true); 
  },
  
  getCurrentState: function() {
    return {
      tool: this._tool,
      graphic: this._graphic,
      isModified: !!this._modified
    };
  },
  
  /*********
   * Events
   *********/
  
  onActivate: function(tool, graphic) {},
  onDeactivate: function(tool, graphic, info) {},
  
  // delegated to _GraphicMover
  onGraphicMoveStart: function(graphic) {},
  onGraphicFirstMove: function(graphic) { this._modified = true; },
  onGraphicMove: function(graphic, transform) {},
  onGraphicMoveStop: function(graphic, transform) {},
  onGraphicClick: function(graphic, info) {},
  
  // delegated to _vertexMover
  onVertexMoveStart: function(graphic, vertexInfo) {},
  onVertexFirstMove: function(graphic, vertexInfo) { this._modified = true; },
  onVertexMove: function(graphic, vertexInfo, transform) {},
  onVertexMoveStop: function(graphic, vertexInfo, transform) {},
  onVertexAdd: function(graphic, vertexInfo) { this._modified = true; },
  onVertexClick: function(graphic, vertexInfo) {},
  
  // delegated to _vertexEditor
  onVertexMouseOver: function(graphic, vertexInfo) {},
  onVertexMouseOut: function(graphic, vertexInfo) {},
  onVertexDelete: function(graphic, vertexInfo) { this._modified = true; },
  
  // delegated to _Box
  onScaleStart: function(graphic) {},
  onScaleFirstMove: function(graphic) { this._modified = true; },
  onScale: function(graphic, info) {},
  onScaleStop: function(graphic, info) {},
  onRotateStart: function(graphic) {},
  onRotateFirstMove: function(graphic) { this._modified = true; },
  onRotate: function(graphic, info) {},
  onRotateStop: function(graphic, info) {},
  
  /*******************
   * Internal Methods
   *******************/
  
  _enableMove: function(graphic) {
    //console.log("_enableMove");
    var map = this._map, type = graphic.geometry.type;
    
    switch(type) {
      case "point":
      case "polyline":
      case "polygon":
        this._graphicMover = new esri.toolbars._GraphicMover(graphic, map, this);
        return true;
      case "multipoint": // would a user want to move a multipoint graphic as a whole?
        break;
    }
    return false;
  },
  
  _enableVertexEditing: function(graphic) {
    //console.log("_enableVertexEditing");
    var map = this._map, type = graphic.geometry.type;
    
    switch(type) {
      case "point":
        break;
      case "multipoint":
      case "polyline":
      case "polygon":
        this._vertexEditor = esri.toolbars._GraphicVertexEditor.create(graphic, map, this);
        return true;
    }
    return false;
  },
  
  _enableBoxEditing: function(graphic, scale, rotate) {
    //console.log("_enableBoxEditing");
    var map = this._map, type = graphic.geometry.type;
    
    switch(type) {
      case "point":
      case "multipoint":
        break;
      case "polyline":
      case "polygon":
        this._boxEditor = new esri.toolbars._Box(graphic, map, this, scale, rotate);
        return true;
    }
    return false;
  },
  
  _disableMove: function() {
    //console.log("_disableMove");
    var graphicMover = this._graphicMover;
    if (graphicMover) {
      graphicMover.destroy();
      this._graphicMover = null;
    }
  },
  
  _disableVertexEditing: function() {
    //console.log("_disableVertexEditing");
    var vertexEditor = this._vertexEditor;
    if (vertexEditor) {
      vertexEditor.destroy();
      this._vertexEditor = null;
    }
  },
  
  _disableBoxEditing: function() {
    //console.log("_disableBoxEditing");
    var box = this._boxEditor;
    if (box) {
      box.destroy();
      this._boxEditor = null;
    }
  },
  
  _clear: function() {
    this._disableMove();
    this._disableVertexEditing();
    this._disableBoxEditing();
    this._tool = 0;
    this._modified = false;
  },
  
  _mapPanEndHandler: function() {
    //console.log("_mapPanEndHandler");
    this._refreshMoveables();
  },
  
  _mapExtentChangeHandler: function(e, d, levelChange) {
    if (levelChange) {
      //console.log("_mapExtentChangeHandler");
      this._refreshMoveables();    
    }
  },

  _refreshMoveables: function(force) {
    //console.log("_refreshMoveables");
    /*var graphicMover = this._graphicMover;
    if (graphicMover) {
      graphicMover.refresh(force);
    }

    var vertexEditor = this._vertexEditor;
    if (vertexEditor) {
      vertexEditor.refresh(force);
    }*/
    
    var tools = dojo.filter([
      this._graphicMover, this._vertexEditor, 
      this._boxEditor 
    ], esri._isDefined);
    
    dojo.forEach(tools, function(mov) {
      mov.refresh(force);
    });
  },
  
  // _beginOperation and _endOperation will be called by
  // the tools to indicate that the user is currently
  // interacting with the said tool. Used to suspend or
  // resume other tools. We could have gone the formal
  // route of tools firing events and the Edit module
  // would react but that's probably too much considering
  // this is an internal aspect.
  _beginOperation: function(toolName) {
    dojo.forEach(this._getAffectedTools(toolName), function(tool) {
      tool.suspend();
    });
  },
  
  _endOperation: function(toolName) {
    dojo.forEach(this._getAffectedTools(toolName), function(tool) {
      tool.resume();
    });
  },
  
  _getAffectedTools: function(toolName) {
    var tools = [];
    
    switch(toolName) {
      case "MOVE":
        tools = [ this._vertexEditor, this._boxEditor ];
        break;
      case "VERTICES":
        tools = [ this._boxEditor ];
        break;
      case "BOX":
        tools = [ this._vertexEditor ];
        break;
    }
    
    tools = dojo.filter(tools, esri._isDefined);
    return tools;
  }/*,
  
  _setupMultitoolMode: function() {
    dojo.disconnect(this._gFMHandle);
    dojo.disconnect(this._gMSHandle);
    this._gFMHandle = dojo.connect(esri.toolbars._GraphicMover, "onFirstMove", this, this._gFirstMoveHandler);
    this._gMSHandle = dojo.connect(esri.toolbars._GraphicMover, "onMoveStop", this, this._gMoveStopHandler);
  },
  
  _gFirstMoveHandler: function() {
    //console.log("FM");
    var vertexEditor = this._vertexEditor;
    if (vertexEditor) {
      vertexEditor.suspend();
    }
  },
  
  _gMoveStopHandler: function() {
    //console.log("MSTOP");
    var vertexEditor = this._vertexEditor;
    if (vertexEditor) {
      vertexEditor.resume();
    }
  }*/
});

// Tool type constants
dojo.mixin(esri.toolbars.Edit, {
  MOVE: 1,
  EDIT_VERTICES: 2,
  SCALE: 4,
  ROTATE: 8
});

});

},
'dijit/_FocusMixin':function(){
define("dijit/_FocusMixin", [
	"./focus",
	"./_WidgetBase",
	"dojo/_base/declare", // declare
	"dojo/_base/lang" // lang.extend
], function(focus, _WidgetBase, declare, lang){

/*=====
	var _WidgetBase = dijit._WidgetBase;
=====*/

	// module:
	//		dijit/_FocusMixin
	// summary:
	//		Mixin to widget to provide _onFocus() and _onBlur() methods that
	//		fire when a widget or it's descendants get/lose focus

	// We don't know where _FocusMixin will occur in the inheritance chain, but we need the _onFocus()/_onBlur() below
	// to be last in the inheritance chain, so mixin to _WidgetBase.
	lang.extend(_WidgetBase, {
		// focused: [readonly] Boolean
		//		This widget or a widget it contains has focus, or is "active" because
		//		it was recently clicked.
		focused: false,

		onFocus: function(){
			// summary:
			//		Called when the widget becomes "active" because
			//		it or a widget inside of it either has focus, or has recently
			//		been clicked.
			// tags:
			//		callback
		},

		onBlur: function(){
			// summary:
			//		Called when the widget stops being "active" because
			//		focus moved to something outside of it, or the user
			//		clicked somewhere outside of it, or the widget was
			//		hidden.
			// tags:
			//		callback
		},

		_onFocus: function(){
			// summary:
			//		This is where widgets do processing for when they are active,
			//		such as changing CSS classes.  See onFocus() for more details.
			// tags:
			//		protected
			this.onFocus();
		},

		_onBlur: function(){
			// summary:
			//		This is where widgets do processing for when they stop being active,
			//		such as changing CSS classes.  See onBlur() for more details.
			// tags:
			//		protected
			this.onBlur();
		}
	});

	return declare("dijit._FocusMixin", null, {
		// summary:
		//		Mixin to widget to provide _onFocus() and _onBlur() methods that
		//		fire when a widget or it's descendants get/lose focus

		// flag that I want _onFocus()/_onBlur() notifications from focus manager
		_focusManager: focus
	});

});

},
'dojo/data/util/filter':function(){
define(["dojo/_base/lang"], function(lang) {
	// module:
	//		dojo/data/util/filter
	// summary:
	//		TODOC

var filter = lang.getObject("dojo.data.util.filter", true);

filter.patternToRegExp = function(/*String*/pattern, /*boolean?*/ ignoreCase){
	//	summary:
	//		Helper function to convert a simple pattern to a regular expression for matching.
	//	description:
	//		Returns a regular expression object that conforms to the defined conversion rules.
	//		For example:
	//			ca*   -> /^ca.*$/
	//			*ca*  -> /^.*ca.*$/
	//			*c\*a*  -> /^.*c\*a.*$/
	//			*c\*a?*  -> /^.*c\*a..*$/
	//			and so on.
	//
	//	pattern: string
	//		A simple matching pattern to convert that follows basic rules:
	//			* Means match anything, so ca* means match anything starting with ca
	//			? Means match single character.  So, b?b will match to bob and bab, and so on.
	//      	\ is an escape character.  So for example, \* means do not treat * as a match, but literal character *.
	//				To use a \ as a character in the string, it must be escaped.  So in the pattern it should be
	//				represented by \\ to be treated as an ordinary \ character instead of an escape.
	//
	//	ignoreCase:
	//		An optional flag to indicate if the pattern matching should be treated as case-sensitive or not when comparing
	//		By default, it is assumed case sensitive.

	var rxp = "^";
	var c = null;
	for(var i = 0; i < pattern.length; i++){
		c = pattern.charAt(i);
		switch(c){
			case '\\':
				rxp += c;
				i++;
				rxp += pattern.charAt(i);
				break;
			case '*':
				rxp += ".*"; break;
			case '?':
				rxp += "."; break;
			case '$':
			case '^':
			case '/':
			case '+':
			case '.':
			case '|':
			case '(':
			case ')':
			case '{':
			case '}':
			case '[':
			case ']':
				rxp += "\\"; //fallthrough
			default:
				rxp += c;
		}
	}
	rxp += "$";
	if(ignoreCase){
		return new RegExp(rxp,"mi"); //RegExp
	}else{
		return new RegExp(rxp,"m"); //RegExp
	}

};

return filter;
});

},
'dijit/_WidgetsInTemplateMixin':function(){
define("dijit/_WidgetsInTemplateMixin", [
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/parser", // parser.parse
	"dijit/registry"	// registry.findWidgets
], function(array, declare, parser, registry){

	// module:
	//		dijit/_WidgetsInTemplateMixin
	// summary:
	//		Mixin to supplement _TemplatedMixin when template contains widgets

	return declare("dijit._WidgetsInTemplateMixin", null, {
		// summary:
		//		Mixin to supplement _TemplatedMixin when template contains widgets

		// _earlyTemplatedStartup: Boolean
		//		A fallback to preserve the 1.0 - 1.3 behavior of children in
		//		templates having their startup called before the parent widget
		//		fires postCreate. Defaults to 'false', causing child widgets to
		//		have their .startup() called immediately before a parent widget
		//		.startup(), but always after the parent .postCreate(). Set to
		//		'true' to re-enable to previous, arguably broken, behavior.
		_earlyTemplatedStartup: false,

		// widgetsInTemplate: [protected] Boolean
		//		Should we parse the template to find widgets that might be
		//		declared in markup inside it?  (Remove for 2.0 and assume true)
		widgetsInTemplate: true,

		_beforeFillContent: function(){
			if(this.widgetsInTemplate){
				// Before copying over content, instantiate widgets in template
				var node = this.domNode;

				var cw = (this._startupWidgets = parser.parse(node, {
					noStart: !this._earlyTemplatedStartup,
					template: true,
					inherited: {dir: this.dir, lang: this.lang, textDir: this.textDir},
					propsThis: this,	// so data-dojo-props of widgets in the template can reference "this" to refer to me
					scope: "dojo"	// even in multi-version mode templates use dojoType/data-dojo-type
				}));

				this._supportingWidgets = registry.findWidgets(node);

				this._attachTemplateNodes(cw, function(n,p){
					return n[p];
				});
			}
		},

		startup: function(){
			array.forEach(this._startupWidgets, function(w){
				if(w && !w._started && w.startup){
					w.startup();
				}
			});
			this.inherited(arguments);
		}
	});
});

},
'dojox/grid/_Builder':function(){
define("dojox/grid/_Builder", [
	"../main",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dojo/_base/event",
	"dojo/_base/sniff",
	"dojo/_base/connect",
	"dojo/dnd/Moveable",
	"dojox/html/metrics",
	"./util",
	"dojo/_base/html"
], function(dojox, array, lang, win, event, has, connect, Moveable, metrics, util, html){

	var dg = dojox.grid;

	var getTdIndex = function(td){
		return td.cellIndex >=0 ? td.cellIndex : array.indexOf(td.parentNode.cells, td);
	};
	
	var getTrIndex = function(tr){
		return tr.rowIndex >=0 ? tr.rowIndex : array.indexOf(tr.parentNode.childNodes, tr);
	};
	
	var getTr = function(rowOwner, index){
		return rowOwner && ((rowOwner.rows||0)[index] || rowOwner.childNodes[index]);
	};

	var findTable = function(node){
		for(var n=node; n && n.tagName!='TABLE'; n=n.parentNode){}
		return n;
	};
	
	var ascendDom = function(inNode, inWhile){
		for(var n=inNode; n && inWhile(n); n=n.parentNode){}
		return n;
	};
	
	var makeNotTagName = function(inTagName){
		var name = inTagName.toUpperCase();
		return function(node){ return node.tagName != name; };
	};

	var rowIndexTag = util.rowIndexTag;
	var gridViewTag = util.gridViewTag;

	// base class for generating markup for the views
	var _Builder = dg._Builder = lang.extend(function(view){
		if(view){
			this.view = view;
			this.grid = view.grid;
		}
	},{
		view: null,
		// boilerplate HTML
		_table: '<table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"',

		// Returns the table variable as an array - and with the view width, if specified
		getTableArray: function(){
			var html = [this._table];
			if(this.view.viewWidth){
				html.push([' style="width:', this.view.viewWidth, ';"'].join(''));
			}
			html.push('>');
			return html;
		},
		
		// generate starting tags for a cell
		generateCellMarkup: function(inCell, inMoreStyles, inMoreClasses, isHeader){
			var result = [], html;
			if(isHeader){
				var sortInfo = inCell.index != inCell.grid.getSortIndex() ? "" : inCell.grid.sortInfo > 0 ? 'aria-sort="ascending"' : 'aria-sort="descending"';
				if (!inCell.id){
					inCell.id = this.grid.id + "Hdr" + inCell.index;
				}
				// column headers are not editable, mark as aria-readonly=true
				html = ['<th tabIndex="-1" aria-readonly="true" role="columnheader"', sortInfo, 'id="', inCell.id, '"'];
			}else{
				// cells inherit grid aria-readonly property; default value for aria-readonly is false(grid is editable)
				// if grid is editable (had any editable cells), mark non editable cells as aria-readonly=true
				// if no editable cells, grid's aria-readonly value will have been set to true and cells will inherit
				var editInfo = this.grid.editable && !inCell.editable ? 'aria-readonly="true"' : "";
				html = ['<td tabIndex="-1" role="gridcell"', editInfo];
			}
			if(inCell.colSpan){
				html.push(' colspan="', inCell.colSpan, '"');
			}
			if(inCell.rowSpan){
				html.push(' rowspan="', inCell.rowSpan, '"');
			}
			html.push(' class="dojoxGridCell ');
			if(inCell.classes){
				html.push(inCell.classes, ' ');
			}
			if(inMoreClasses){
				html.push(inMoreClasses, ' ');
			}
			// result[0] => td opener, style
			result.push(html.join(''));
			// SLOT: result[1] => td classes
			result.push('');
			html = ['" idx="', inCell.index, '" style="'];
			if(inMoreStyles && inMoreStyles[inMoreStyles.length-1] != ';'){
				inMoreStyles += ';';
			}
			html.push(inCell.styles, inMoreStyles||'', inCell.hidden?'display:none;':'');
			if(inCell.unitWidth){
				html.push('width:', inCell.unitWidth, ';');
			}
			// result[2] => markup
			result.push(html.join(''));
			// SLOT: result[3] => td style
			result.push('');
			html = [ '"' ];
			if(inCell.attrs){
				html.push(" ", inCell.attrs);
			}
			html.push('>');
			// result[4] => td postfix
			result.push(html.join(''));
			// SLOT: result[5] => content
			result.push('');
			// result[6] => td closes
			result.push(isHeader?'</th>':'</td>');
			return result; // Array
		},

		// cell finding
		isCellNode: function(inNode){
			return Boolean(inNode && inNode!=win.doc && html.attr(inNode, "idx"));
		},
		
		getCellNodeIndex: function(inCellNode){
			return inCellNode ? Number(html.attr(inCellNode, "idx")) : -1;
		},
		
		getCellNode: function(inRowNode, inCellIndex){
			for(var i=0, row; ((row = getTr(inRowNode.firstChild, i)) && row.cells); i++){
				for(var j=0, cell; (cell = row.cells[j]); j++){
					if(this.getCellNodeIndex(cell) == inCellIndex){
						return cell;
					}
				}
			}
			return null;
		},
		
		findCellTarget: function(inSourceNode, inTopNode){
			var n = inSourceNode;
			while(n && (!this.isCellNode(n) || (n.offsetParent && gridViewTag in n.offsetParent.parentNode && n.offsetParent.parentNode[gridViewTag] != this.view.id)) && (n!=inTopNode)){
				n = n.parentNode;
			}
			return n!=inTopNode ? n : null;
		},
		
		// event decoration
		baseDecorateEvent: function(e){
			e.dispatch = 'do' + e.type;
			e.grid = this.grid;
			e.sourceView = this.view;
			e.cellNode = this.findCellTarget(e.target, e.rowNode);
			e.cellIndex = this.getCellNodeIndex(e.cellNode);
			e.cell = (e.cellIndex >= 0 ? this.grid.getCell(e.cellIndex) : null);
		},
		
		// event dispatch
		findTarget: function(inSource, inTag){
			var n = inSource;
			while(n && (n!=this.domNode) && (!(inTag in n) || (gridViewTag in n && n[gridViewTag] != this.view.id))){
				n = n.parentNode;
			}
			return (n != this.domNode) ? n : null;
		},

		findRowTarget: function(inSource){
			return this.findTarget(inSource, rowIndexTag);
		},

		isIntraNodeEvent: function(e){
			try{
				return (e.cellNode && e.relatedTarget && html.isDescendant(e.relatedTarget, e.cellNode));
			}catch(x){
				// e.relatedTarget has permission problem in FF if it's an input: https://bugzilla.mozilla.org/show_bug.cgi?id=208427
				return false;
			}
		},

		isIntraRowEvent: function(e){
			try{
				var row = e.relatedTarget && this.findRowTarget(e.relatedTarget);
				return !row && (e.rowIndex==-1) || row && (e.rowIndex==row.gridRowIndex);
			}catch(x){
				// e.relatedTarget on INPUT has permission problem in FF: https://bugzilla.mozilla.org/show_bug.cgi?id=208427
				return false;
			}
		},

		dispatchEvent: function(e){
			if(e.dispatch in this){
				return this[e.dispatch](e);
			}
			return false;
		},

		// dispatched event handlers
		domouseover: function(e){
			if(e.cellNode && (e.cellNode!=this.lastOverCellNode)){
				this.lastOverCellNode = e.cellNode;
				this.grid.onMouseOver(e);
			}
			this.grid.onMouseOverRow(e);
		},

		domouseout: function(e){
			if(e.cellNode && (e.cellNode==this.lastOverCellNode) && !this.isIntraNodeEvent(e, this.lastOverCellNode)){
				this.lastOverCellNode = null;
				this.grid.onMouseOut(e);
				if(!this.isIntraRowEvent(e)){
					this.grid.onMouseOutRow(e);
				}
			}
		},
		
		domousedown: function(e){
			if (e.cellNode)
				this.grid.onMouseDown(e);
			this.grid.onMouseDownRow(e);
		}
	});

	// Produces html for grid data content. Owned by grid and used internally
	// for rendering data. Override to implement custom rendering.
	var _ContentBuilder = dg._ContentBuilder = lang.extend(function(view){
		_Builder.call(this, view);
	},_Builder.prototype,{
		update: function(){
			this.prepareHtml();
		},

		// cache html for rendering data rows
		prepareHtml: function(){
			var defaultGet=this.grid.get, cells=this.view.structure.cells;
			for(var j=0, row; (row=cells[j]); j++){
				for(var i=0, cell; (cell=row[i]); i++){
					cell.get = cell.get || (cell.value == undefined) && defaultGet;
					cell.markup = this.generateCellMarkup(cell, cell.cellStyles, cell.cellClasses, false);
					if (!this.grid.editable && cell.editable){
						this.grid.editable = true;
					}
				}
			}
		},

		// time critical: generate html using cache and data source
		generateHtml: function(inDataIndex, inRowIndex){
			var
				html = this.getTableArray(),
				v = this.view,
				cells = v.structure.cells,
				item = this.grid.getItem(inRowIndex);

			util.fire(this.view, "onBeforeRow", [inRowIndex, cells]);
			for(var j=0, row; (row=cells[j]); j++){
				if(row.hidden || row.header){
					continue;
				}
				html.push(!row.invisible ? '<tr>' : '<tr class="dojoxGridInvisible">');
				for(var i=0, cell, m, cc, cs; (cell=row[i]); i++){
					m = cell.markup; cc = cell.customClasses = []; cs = cell.customStyles = [];
					// content (format can fill in cc and cs as side-effects)
					m[5] = cell.format(inRowIndex, item);
					if(has("ie") < 8 && (m[5] === null || m[5] === '' || /^\s+$/.test(m[5]))){
						//fix IE 6/7 quirks - border style not effective for empty td
						m[5] = '&nbsp;'
					}
					// classes
					m[1] = cc.join(' ');
					// styles
					m[3] = cs.join(';');
					// in-place concat
					html.push.apply(html, m);
				}
				html.push('</tr>');
			}
			html.push('</table>');
			return html.join(''); // String
		},

		decorateEvent: function(e){
			e.rowNode = this.findRowTarget(e.target);
			if(!e.rowNode){return false;}
			e.rowIndex = e.rowNode[rowIndexTag];
			this.baseDecorateEvent(e);
			e.cell = this.grid.getCell(e.cellIndex);
			return true; // Boolean
		}
	});

	// Produces html for grid header content. Owned by grid and used internally
	// for rendering data. Override to implement custom rendering.
	var _HeaderBuilder = dg._HeaderBuilder = lang.extend(function(view){
		this.moveable = null;
		_Builder.call(this, view);
	},_Builder.prototype,{
		_skipBogusClicks: false,
		overResizeWidth: 4,
		minColWidth: 1,
		
		update: function(){
			if(this.tableMap){
				this.tableMap.mapRows(this.view.structure.cells);
			}else{
				this.tableMap = new dg._TableMap(this.view.structure.cells);
			}
		},

		generateHtml: function(inGetValue, inValue){
			var html = this.getTableArray(), cells = this.view.structure.cells;
			
			util.fire(this.view, "onBeforeRow", [-1, cells]);
			for(var j=0, row; (row=cells[j]); j++){
				if(row.hidden){
					continue;
				}
				html.push(!row.invisible ? '<tr>' : '<tr class="dojoxGridInvisible">');
				for(var i=0, cell, markup; (cell=row[i]); i++){
					cell.customClasses = [];
					cell.customStyles = [];
					if(this.view.simpleStructure){
						if(cell.draggable){
							if(cell.headerClasses){
								if(cell.headerClasses.indexOf('dojoDndItem') == -1){
									cell.headerClasses += ' dojoDndItem';
								}
							}else{
								cell.headerClasses = 'dojoDndItem';
							}
						}
						if(cell.attrs){
							if(cell.attrs.indexOf("dndType='gridColumn_") == -1){
								cell.attrs += " dndType='gridColumn_" + this.grid.id + "'";
							}
						}else{
							cell.attrs = "dndType='gridColumn_" + this.grid.id + "'";
						}
					}
					markup = this.generateCellMarkup(cell, cell.headerStyles, cell.headerClasses, true);
					// content
					markup[5] = (inValue != undefined ? inValue : inGetValue(cell));
					// styles
					markup[3] = cell.customStyles.join(';');
					// classes
					markup[1] = cell.customClasses.join(' '); //(cell.customClasses ? ' ' + cell.customClasses : '');
					html.push(markup.join(''));
				}
				html.push('</tr>');
			}
			html.push('</table>');
			return html.join('');
		},

		// event helpers
		getCellX: function(e){
			var n, x = e.layerX;
			if(has("mozilla") || has("ie") >= 9){
				n = ascendDom(e.target, makeNotTagName("th"));
				x -= (n && n.offsetLeft) || 0;
				var t = e.sourceView.getScrollbarWidth();
				if(!this.grid.isLeftToRight()/*&& e.sourceView.headerNode.scrollLeft < t*/){
					//fix #11253
					table = ascendDom(n,makeNotTagName("table"));
					x -= (table && table.offsetLeft) || 0;
				}
				//x -= getProp(ascendDom(e.target, mkNotTagName("td")), "offsetLeft") || 0;
			}
			n = ascendDom(e.target, function(){
				if(!n || n == e.cellNode){
					return false;
				}
				// Mozilla 1.8 (FF 1.5) has a bug that makes offsetLeft = -parent border width
				// when parent has border, overflow: hidden, and is positioned
				// handle this problem here ... not a general solution!
				x += (n.offsetLeft < 0 ? 0 : n.offsetLeft);
				return true;
			});
			return x;
		},

		// event decoration
		decorateEvent: function(e){
			this.baseDecorateEvent(e);
			e.rowIndex = -1;
			e.cellX = this.getCellX(e);
			return true;
		},

		// event handlers
		// resizing
		prepareResize: function(e, mod){
			do{
				var i = e.cellIndex;
				e.cellNode = (i ? e.cellNode.parentNode.cells[i+mod] : null);
				e.cellIndex = (e.cellNode ? this.getCellNodeIndex(e.cellNode) : -1);
			}while(e.cellNode && e.cellNode.style.display == "none");
			return Boolean(e.cellNode);
		},

		canResize: function(e){
			if(!e.cellNode || e.cellNode.colSpan > 1){
				return false;
			}
			var cell = this.grid.getCell(e.cellIndex);
			return !cell.noresize && cell.canResize();
		},

		overLeftResizeArea: function(e){
			// We are never over a resize area if we are in the process of moving
			if(html.hasClass(win.body(), "dojoDndMove")){
				return false;
			}
			//Bugfix for crazy IE problem (#8807).  IE returns position information for the icon and text arrow divs
			//as if they were still on the left instead of returning the position they were 'float: right' to.
			//So, the resize check ends up checking the wrong adjacent cell.  This checks to see if the hover was over
			//the image or text nodes, then just ignored them/treat them not in scale range.
			if(has("ie")){
				var tN = e.target;
				if(html.hasClass(tN, "dojoxGridArrowButtonNode") ||
					html.hasClass(tN, "dojoxGridArrowButtonChar") ||
					html.hasClass(tN, "dojoxGridColCaption")){
					return false;
				}
			}

			if(this.grid.isLeftToRight()){
				return (e.cellIndex>0) && (e.cellX > 0 && e.cellX < this.overResizeWidth) && this.prepareResize(e, -1);
			}
			var t = e.cellNode && (e.cellX > 0 && e.cellX < this.overResizeWidth);
			return t;
		},

		overRightResizeArea: function(e){
			// We are never over a resize area if we are in the process of moving
			if(html.hasClass(win.body(), "dojoDndMove")){
				return false;
			}
			//Bugfix for crazy IE problem (#8807).  IE returns position information for the icon and text arrow divs
			//as if they were still on the left instead of returning the position they were 'float: right' to.
			//So, the resize check ends up checking the wrong adjacent cell.  This checks to see if the hover was over
			//the image or text nodes, then just ignored them/treat them not in scale range.
			if(has("ie")){
				var tN = e.target;
				if(html.hasClass(tN, "dojoxGridArrowButtonNode") ||
					html.hasClass(tN, "dojoxGridArrowButtonChar") ||
					html.hasClass(tN, "dojoxGridColCaption")){
					return false;
				}
			}

			if(this.grid.isLeftToRight()){
				return e.cellNode && (e.cellX >= e.cellNode.offsetWidth - this.overResizeWidth);
			}
			return (e.cellIndex>0) && (e.cellX >= e.cellNode.offsetWidth - this.overResizeWidth) && this.prepareResize(e, -1);
		},

		domousemove: function(e){
			//console.log(e.cellIndex, e.cellX, e.cellNode.offsetWidth);
			if(!this.moveable){
				var c = (this.overRightResizeArea(e) ? 'dojoxGridColResize' : (this.overLeftResizeArea(e) ? 'dojoxGridColResize' : ''));
				if(c && !this.canResize(e)){
					c = 'dojoxGridColNoResize';
				}
				html.toggleClass(e.sourceView.headerNode, "dojoxGridColNoResize", (c == "dojoxGridColNoResize"));
				html.toggleClass(e.sourceView.headerNode, "dojoxGridColResize", (c == "dojoxGridColResize"));
				if(c){
					event.stop(e);
				}
			}
		},

		domousedown: function(e){
			if(!this.moveable){
				if((this.overRightResizeArea(e) || this.overLeftResizeArea(e)) && this.canResize(e)){
					this.beginColumnResize(e);
				}else{
					this.grid.onMouseDown(e);
					this.grid.onMouseOverRow(e);
				}
				//else{
				//	this.beginMoveColumn(e);
				//}
			}
		},

		doclick: function(e) {
			if(this._skipBogusClicks){
				event.stop(e);
				return true;
			}
			return false;
		},

		// column resizing
		colResizeSetup: function(/*Event Object*/e, /*boolean*/ isMouse ){
			//Set up the drag object for column resizing
			// Called with mouse event in case of drag and drop,
			// Also called from keyboard shift-arrow event when focus is on a header
			var headContentBox = html.contentBox(e.sourceView.headerNode);
			
			if(isMouse){  //IE draws line even with no mouse down so separate from keyboard
				this.lineDiv = document.createElement('div');

				var vw = html.position(e.sourceView.headerNode, true);
				var bodyContentBox = html.contentBox(e.sourceView.domNode);
				//fix #11340
				var l = e.pageX;
				if(!this.grid.isLeftToRight() && has("ie") < 8){
					l -= metrics.getScrollbar().w;
				}
				html.style(this.lineDiv, {
					top: vw.y + "px",
					left: l + "px",
					height: (bodyContentBox.h + headContentBox.h) + "px"
				});
				html.addClass(this.lineDiv, "dojoxGridResizeColLine");
				this.lineDiv._origLeft = l;
				win.body().appendChild(this.lineDiv);
			}
			var spanners = [], nodes = this.tableMap.findOverlappingNodes(e.cellNode);
			for(var i=0, cell; (cell=nodes[i]); i++){
				spanners.push({ node: cell, index: this.getCellNodeIndex(cell), width: cell.offsetWidth });
				//console.log("spanner: " + this.getCellNodeIndex(cell));
			}

			var view = e.sourceView;
			var adj = this.grid.isLeftToRight() ? 1 : -1;
			var views = e.grid.views.views;
			var followers = [];
			for(var j=view.idx+adj, cView; (cView=views[j]); j=j+adj){
				followers.push({ node: cView.headerNode, left: window.parseInt(cView.headerNode.style.left) });
			}
			var table = view.headerContentNode.firstChild;
			var drag = {
				scrollLeft: e.sourceView.headerNode.scrollLeft,
				view: view,
				node: e.cellNode,
				index: e.cellIndex,
				w: html.contentBox(e.cellNode).w,
				vw: headContentBox.w,
				table: table,
				tw: html.contentBox(table).w,
				spanners: spanners,
				followers: followers
			};
			return drag;
		},
		beginColumnResize: function(e){
			this.moverDiv = document.createElement("div");
			html.style(this.moverDiv,{position: "absolute", left:0}); // to make DnD work with dir=rtl
			win.body().appendChild(this.moverDiv);
			html.addClass(this.grid.domNode, "dojoxGridColumnResizing");
			var m = (this.moveable = new Moveable(this.moverDiv));

			var drag = this.colResizeSetup(e,true);

			m.onMove = lang.hitch(this, "doResizeColumn", drag);

			connect.connect(m, "onMoveStop", lang.hitch(this, function(){
				this.endResizeColumn(drag);
				if(drag.node.releaseCapture){
					drag.node.releaseCapture();
				}
				this.moveable.destroy();
				delete this.moveable;
				this.moveable = null;
				html.removeClass(this.grid.domNode, "dojoxGridColumnResizing");
			}));

			if(e.cellNode.setCapture){
				e.cellNode.setCapture();
			}
			m.onMouseDown(e);
		},

		doResizeColumn: function(inDrag, mover, leftTop){
			var changeX = leftTop.l;
			var data = {
				deltaX: changeX,
				w: inDrag.w + (this.grid.isLeftToRight() ? changeX : -changeX),//fix #11341
				vw: inDrag.vw + changeX,
				tw: inDrag.tw + changeX
			};
			
			this.dragRecord = {inDrag: inDrag, mover: mover, leftTop:leftTop};
			
			if(data.w >= this.minColWidth){
				if (!mover) { // we are using keyboard do immediate resize
					this.doResizeNow(inDrag, data);
				}
				else{
					html.style(this.lineDiv, "left", (this.lineDiv._origLeft + data.deltaX) + "px");
				}
			}
		},

		endResizeColumn: function(inDrag){
			if(this.dragRecord){
				var leftTop = this.dragRecord.leftTop;
				var changeX = this.grid.isLeftToRight() ? leftTop.l : -leftTop.l;
				// Make sure we are not under our minimum
				// http://bugs.dojotoolkit.org/ticket/9390
				changeX += Math.max(inDrag.w + changeX, this.minColWidth) - (inDrag.w + changeX);
				if(has("webkit") && inDrag.spanners.length){
					// Webkit needs the pad border extents back in
					changeX += html._getPadBorderExtents(inDrag.spanners[0].node).w;
				}
				var data = {
					deltaX: changeX,
					w: inDrag.w + changeX,
					vw: inDrag.vw + changeX,
					tw: inDrag.tw + changeX
				};
				// Only resize the columns when the drag has finished
				this.doResizeNow(inDrag, data);
				delete this.dragRecord;
			}
			
			html.destroy(this.lineDiv);
 			html.destroy(this.moverDiv);
			html.destroy(this.moverDiv);
			delete this.moverDiv;
			this._skipBogusClicks = true;
			inDrag.view.update();
			this._skipBogusClicks = false;
			this.grid.onResizeColumn(inDrag.index);
		},
		doResizeNow: function(inDrag, data){
			inDrag.view.convertColPctToFixed();
			if(inDrag.view.flexCells && !inDrag.view.testFlexCells()){
				var t = findTable(inDrag.node);
				if(t){
					(t.style.width = '');
				}
			}
			var i, s, sw, f, fl;
			for(i=0; (s=inDrag.spanners[i]); i++){
				sw = s.width + data.deltaX;
				if(sw > 0){
					s.node.style.width = sw + 'px';
					inDrag.view.setColWidth(s.index, sw);
				}
			}
			if(this.grid.isLeftToRight() || !has("ie")){//fix #11339
				for(i=0; (f=inDrag.followers[i]); i++){
					fl = f.left + data.deltaX;
					f.node.style.left = fl + 'px';
				}
			}
			inDrag.node.style.width = data.w + 'px';
			inDrag.view.setColWidth(inDrag.index, data.w);
			inDrag.view.headerNode.style.width = data.vw + 'px';
			inDrag.view.setColumnsWidth(data.tw);
			if(!this.grid.isLeftToRight()){
				inDrag.view.headerNode.scrollLeft = inDrag.scrollLeft + data.deltaX;
			}
		}
	});

	// Maps an html table into a structure parsable for information about cell row and col spanning.
	// Used by HeaderBuilder.
	dg._TableMap = lang.extend(function(rows){
		this.mapRows(rows);
	},{
		map: null,

		mapRows: function(inRows){
			// summary: Map table topography

			//console.log('mapRows');
			// # of rows
			var rowCount = inRows.length;
			if(!rowCount){
				return;
			}
			// map which columns and rows fill which cells
			this.map = [];
			var row;
			for(var k=0; (row=inRows[k]); k++){
				this.map[k] = [];
			}
			for(var j=0; (row=inRows[j]); j++){
				for(var i=0, x=0, cell, colSpan, rowSpan; (cell=row[i]); i++){
					while(this.map[j][x]){x++;}
					this.map[j][x] = { c: i, r: j };
					rowSpan = cell.rowSpan || 1;
					colSpan = cell.colSpan || 1;
					for(var y=0; y<rowSpan; y++){
						for(var s=0; s<colSpan; s++){
							this.map[j+y][x+s] = this.map[j][x];
						}
					}
					x += colSpan;
				}
			}
			//this.dumMap();
		},

		dumpMap: function(){
			for(var j=0, row, h=''; (row=this.map[j]); j++,h=''){
				for(var i=0, cell; (cell=row[i]); i++){
					h += cell.r + ',' + cell.c + '   ';
				}
			}
		},

		getMapCoords: function(inRow, inCol){
			// summary: Find node's map coords by it's structure coords
			for(var j=0, row; (row=this.map[j]); j++){
				for(var i=0, cell; (cell=row[i]); i++){
					if(cell.c==inCol && cell.r == inRow){
						return { j: j, i: i };
					}
					//else{console.log(inRow, inCol, ' : ', i, j, " : ", cell.r, cell.c); };
				}
			}
			return { j: -1, i: -1 };
		},
		
		getNode: function(inTable, inRow, inCol){
			// summary: Find a node in inNode's table with the given structure coords
			var row = inTable && inTable.rows[inRow];
			return row && row.cells[inCol];
		},
		
		_findOverlappingNodes: function(inTable, inRow, inCol){
			var nodes = [];
			var m = this.getMapCoords(inRow, inCol);
			//console.log("node j: %d, i: %d", m.j, m.i);
			for(var j=0, row; (row=this.map[j]); j++){
				if(j == m.j){ continue; }
				var rw = row[m.i];
				//console.log("overlaps: r: %d, c: %d", rw.r, rw.c);
				var n = (rw?this.getNode(inTable, rw.r, rw.c):null);
				if(n){ nodes.push(n); }
			}
			//console.log(nodes);
			return nodes;
		},
		
		findOverlappingNodes: function(inNode){
			return this._findOverlappingNodes(findTable(inNode), getTrIndex(inNode.parentNode), getTdIndex(inNode));
		}
	});

	return {
		_Builder: _Builder,
		_HeaderBuilder: _HeaderBuilder,
		_ContentBuilder: _ContentBuilder
	};
});
},
'dojox/grid/_EditManager':function(){
define("dojox/grid/_EditManager", [
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/connect",
	"dojo/_base/sniff",
	"./util"
], function(lang, array, declare, connect, has, util){

return declare("dojox.grid._EditManager", null, {
	// summary:
	//		Controls grid cell editing process. Owned by grid and used internally for editing.
	constructor: function(inGrid){
		// inGrid: dojox.Grid
		//		The dojox.Grid this editor should be attached to
		this.grid = inGrid;
		if(has("ie")){
			this.connections = [connect.connect(document.body, "onfocus", lang.hitch(this, "_boomerangFocus"))];
		}else{
			this.connections = [connect.connect(this.grid, 'onBlur', this, 'apply')];
		}
	},
	
	info: {},

	destroy: function(){
		array.forEach(this.connections, connect.disconnect);
	},

	cellFocus: function(inCell, inRowIndex){
		// summary:
		//		Invoke editing when cell is focused
		// inCell: cell object
		//		Grid cell object
		// inRowIndex: Integer
		//		Grid row index
		if(this.grid.singleClickEdit || this.isEditRow(inRowIndex)){
			// if same row or quick editing, edit
			this.setEditCell(inCell, inRowIndex);
		}else{
			// otherwise, apply any pending row edits
			this.apply();
		}
		// if dynamic or static editing...
		if(this.isEditing() || (inCell && inCell.editable && inCell.alwaysEditing)){
			// let the editor focus itself as needed
			this._focusEditor(inCell, inRowIndex);
		}
	},

	rowClick: function(e){
		if(this.isEditing() && !this.isEditRow(e.rowIndex)){
			this.apply();
		}
	},

	styleRow: function(inRow){
		if(inRow.index == this.info.rowIndex){
			inRow.customClasses += ' dojoxGridRowEditing';
		}
	},

	dispatchEvent: function(e){
		var c = e.cell, ed = (c && c["editable"]) ? c : 0;
		return ed && ed.dispatchEvent(e.dispatch, e);
	},

	// Editing
	isEditing: function(){
		// summary:
		//		Indicates editing state of the grid.
		// returns: Boolean
		//	 	True if grid is actively editing
		return this.info.rowIndex !== undefined;
	},

	isEditCell: function(inRowIndex, inCellIndex){
		// summary:
		//		Indicates if the given cell is being edited.
		// inRowIndex: Integer
		//		Grid row index
		// inCellIndex: Integer
		//		Grid cell index
		// returns: Boolean
		//	 	True if given cell is being edited
		return (this.info.rowIndex === inRowIndex) && (this.info.cell.index == inCellIndex);
	},

	isEditRow: function(inRowIndex){
		// summary:
		//		Indicates if the given row is being edited.
		// inRowIndex: Integer
		//		Grid row index
		// returns: Boolean
		//	 	True if given row is being edited
		return this.info.rowIndex === inRowIndex;
	},

	setEditCell: function(inCell, inRowIndex){
		// summary:
		//		Set the given cell to be edited
		// inRowIndex: Integer
		//		Grid row index
		// inCell: Object
		//		Grid cell object
		if(!this.isEditCell(inRowIndex, inCell.index) && this.grid.canEdit && this.grid.canEdit(inCell, inRowIndex)){
			this.start(inCell, inRowIndex, this.isEditRow(inRowIndex) || inCell.editable);
		}
	},

	_focusEditor: function(inCell, inRowIndex){
		util.fire(inCell, "focus", [inRowIndex]);
	},

	focusEditor: function(){
		if(this.isEditing()){
			this._focusEditor(this.info.cell, this.info.rowIndex);
		}
	},

	// implement fix for focus boomerang effect on IE
	_boomerangWindow: 500,
	_shouldCatchBoomerang: function(){
		return this._catchBoomerang > new Date().getTime();
	},
	_boomerangFocus: function(){
		//console.log("_boomerangFocus");
		if(this._shouldCatchBoomerang()){
			// make sure we don't utterly lose focus
			this.grid.focus.focusGrid();
			// let the editor focus itself as needed
			this.focusEditor();
			// only catch once
			this._catchBoomerang = 0;
		}
	},
	_doCatchBoomerang: function(){
		// give ourselves a few ms to boomerang IE focus effects
		if(has("ie")){this._catchBoomerang = new Date().getTime() + this._boomerangWindow;}
	},
	// end boomerang fix API

	start: function(inCell, inRowIndex, inEditing){
		if(!this._isValidInput()){
			return;
		}
		this.grid.beginUpdate();
		this.editorApply();
		if(this.isEditing() && !this.isEditRow(inRowIndex)){
			this.applyRowEdit();
			this.grid.updateRow(inRowIndex);
		}
		if(inEditing){
			this.info = { cell: inCell, rowIndex: inRowIndex };
			this.grid.doStartEdit(inCell, inRowIndex);
			this.grid.updateRow(inRowIndex);
		}else{
			this.info = {};
		}
		this.grid.endUpdate();
		// make sure we don't utterly lose focus
		this.grid.focus.focusGrid();
		// let the editor focus itself as needed
		this._focusEditor(inCell, inRowIndex);
		// give ourselves a few ms to boomerang IE focus effects
		this._doCatchBoomerang();
	},

	_editorDo: function(inMethod){
		var c = this.info.cell;
		//c && c.editor && c.editor[inMethod](c, this.info.rowIndex);
		if(c && c.editable){
			c[inMethod](this.info.rowIndex);
		}
	},

	editorApply: function(){
		this._editorDo("apply");
	},

	editorCancel: function(){
		this._editorDo("cancel");
	},

	applyCellEdit: function(inValue, inCell, inRowIndex){
		if(this.grid.canEdit(inCell, inRowIndex)){
			this.grid.doApplyCellEdit(inValue, inRowIndex, inCell.field);
		}
	},

	applyRowEdit: function(){
		this.grid.doApplyEdit(this.info.rowIndex, this.info.cell.field);
	},

	apply: function(){
		// summary:
		//		Apply a grid edit
		if(this.isEditing() && this._isValidInput()){
			this.grid.beginUpdate();
			this.editorApply();
			this.applyRowEdit();
			this.info = {};
			this.grid.endUpdate();
			this.grid.focus.focusGrid();
			this._doCatchBoomerang();
		}
	},

	cancel: function(){
		// summary:
		//		Cancel a grid edit
		if(this.isEditing()){
			this.grid.beginUpdate();
			this.editorCancel();
			this.info = {};
			this.grid.endUpdate();
			this.grid.focus.focusGrid();
			this._doCatchBoomerang();
		}
	},

	save: function(inRowIndex, inView){
		// summary:
		//		Save the grid editing state
		// inRowIndex: Integer
		//		Grid row index
		// inView: Object
		//		Grid view
		var c = this.info.cell;
		if(this.isEditRow(inRowIndex) && (!inView || c.view==inView) && c.editable){
			c.save(c, this.info.rowIndex);
		}
	},

	restore: function(inView, inRowIndex){
		// summary:
		//		Restores the grid editing state
		// inRowIndex: Integer
		//		Grid row index
		// inView: Object
		//		Grid view
		var c = this.info.cell;
		if(this.isEditRow(inRowIndex) && c.view == inView && c.editable){
			c.restore(this.info.rowIndex);
		}
	},
	
	_isValidInput: function(){
		var w = (this.info.cell || {}).widget;		
		if(!w || !w.isValid){
			//no validation needed
			return true;
		}		
		w.focused = true;
		return w.isValid(true);
	}
});
});
},
'dojo/data/util/sorter':function(){
define(["dojo/_base/lang"], function(lang) {
	// module:
	//		dojo/data/util/sorter
	// summary:
	//		TODOC

var sorter = lang.getObject("dojo.data.util.sorter", true);

sorter.basicComparator = function(	/*anything*/ a,
													/*anything*/ b){
	//	summary:
	//		Basic comparision function that compares if an item is greater or less than another item
	//	description:
	//		returns 1 if a > b, -1 if a < b, 0 if equal.
	//		'null' values (null, undefined) are treated as larger values so that they're pushed to the end of the list.
	//		And compared to each other, null is equivalent to undefined.

	//null is a problematic compare, so if null, we set to undefined.
	//Makes the check logic simple, compact, and consistent
	//And (null == undefined) === true, so the check later against null
	//works for undefined and is less bytes.
	var r = -1;
	if(a === null){
		a = undefined;
	}
	if(b === null){
		b = undefined;
	}
	if(a == b){
		r = 0;
	}else if(a > b || a == null){
		r = 1;
	}
	return r; //int {-1,0,1}
};

sorter.createSortFunction = function(	/* attributes array */sortSpec, /*dojo.data.core.Read*/ store){
	//	summary:
	//		Helper function to generate the sorting function based off the list of sort attributes.
	//	description:
	//		The sort function creation will look for a property on the store called 'comparatorMap'.  If it exists
	//		it will look in the mapping for comparisons function for the attributes.  If one is found, it will
	//		use it instead of the basic comparator, which is typically used for strings, ints, booleans, and dates.
	//		Returns the sorting function for this particular list of attributes and sorting directions.
	//
	//	sortSpec: array
	//		A JS object that array that defines out what attribute names to sort on and whether it should be descenting or asending.
	//		The objects should be formatted as follows:
	//		{
	//			attribute: "attributeName-string" || attribute,
	//			descending: true|false;   // Default is false.
	//		}
	//	store: object
	//		The datastore object to look up item values from.
	//
	var sortFunctions=[];

	function createSortFunction(attr, dir, comp, s){
		//Passing in comp and s (comparator and store), makes this
		//function much faster.
		return function(itemA, itemB){
			var a = s.getValue(itemA, attr);
			var b = s.getValue(itemB, attr);
			return dir * comp(a,b); //int
		};
	}
	var sortAttribute;
	var map = store.comparatorMap;
	var bc = sorter.basicComparator;
	for(var i = 0; i < sortSpec.length; i++){
		sortAttribute = sortSpec[i];
		var attr = sortAttribute.attribute;
		if(attr){
			var dir = (sortAttribute.descending) ? -1 : 1;
			var comp = bc;
			if(map){
				if(typeof attr !== "string" && ("toString" in attr)){
					 attr = attr.toString();
				}
				comp = map[attr] || bc;
			}
			sortFunctions.push(createSortFunction(attr,
				dir, comp, store));
		}
	}
	return function(rowA, rowB){
		var i=0;
		while(i < sortFunctions.length){
			var ret = sortFunctions[i++](rowA, rowB);
			if(ret !== 0){
				return ret;//int
			}
		}
		return 0; //int
	}; // Function
};

return sorter;
});

},
'dojo/date/locale':function(){
define([
	"../_base/kernel",
	"../_base/lang",
	"../_base/array",
	"../date",
	"../cldr/supplemental",
	"../regexp",
	"../string",
	"../i18n!../cldr/nls/gregorian"
], function(dojo, lang, array, date, cldr, regexp, string, gregorian) {
	// module:
	//		dojo/date/locale
	// summary:
	//		This modules defines dojo.date.locale, localization methods for Date.

lang.getObject("date.locale", true, dojo);

// Localization methods for Date.   Honor local customs using locale-dependent dojo.cldr data.

// Load the bundles containing localization information for
// names and formats

//NOTE: Everything in this module assumes Gregorian calendars.
// Other calendars will be implemented in separate modules.

	// Format a pattern without literals
	function formatPattern(dateObject, bundle, options, pattern){
		return pattern.replace(/([a-z])\1*/ig, function(match){
			var s, pad,
				c = match.charAt(0),
				l = match.length,
				widthList = ["abbr", "wide", "narrow"];
			switch(c){
				case 'G':
					s = bundle[(l < 4) ? "eraAbbr" : "eraNames"][dateObject.getFullYear() < 0 ? 0 : 1];
					break;
				case 'y':
					s = dateObject.getFullYear();
					switch(l){
						case 1:
							break;
						case 2:
							if(!options.fullYear){
								s = String(s); s = s.substr(s.length - 2);
								break;
							}
							// fallthrough
						default:
							pad = true;
					}
					break;
				case 'Q':
				case 'q':
					s = Math.ceil((dateObject.getMonth()+1)/3);
//					switch(l){
//						case 1: case 2:
							pad = true;
//							break;
//						case 3: case 4: // unimplemented
//					}
					break;
				case 'M':
					var m = dateObject.getMonth();
					if(l<3){
						s = m+1; pad = true;
					}else{
						var propM = ["months", "format", widthList[l-3]].join("-");
						s = bundle[propM][m];
					}
					break;
				case 'w':
					var firstDay = 0;
					s = dojo.date.locale._getWeekOfYear(dateObject, firstDay); pad = true;
					break;
				case 'd':
					s = dateObject.getDate(); pad = true;
					break;
				case 'D':
					s = dojo.date.locale._getDayOfYear(dateObject); pad = true;
					break;
				case 'E':
					var d = dateObject.getDay();
					if(l<3){
						s = d+1; pad = true;
					}else{
						var propD = ["days", "format", widthList[l-3]].join("-");
						s = bundle[propD][d];
					}
					break;
				case 'a':
					var timePeriod = (dateObject.getHours() < 12) ? 'am' : 'pm';
					s = options[timePeriod] || bundle['dayPeriods-format-wide-' + timePeriod];
					break;
				case 'h':
				case 'H':
				case 'K':
				case 'k':
					var h = dateObject.getHours();
					// strange choices in the date format make it impossible to write this succinctly
					switch (c){
						case 'h': // 1-12
							s = (h % 12) || 12;
							break;
						case 'H': // 0-23
							s = h;
							break;
						case 'K': // 0-11
							s = (h % 12);
							break;
						case 'k': // 1-24
							s = h || 24;
							break;
					}
					pad = true;
					break;
				case 'm':
					s = dateObject.getMinutes(); pad = true;
					break;
				case 's':
					s = dateObject.getSeconds(); pad = true;
					break;
				case 'S':
					s = Math.round(dateObject.getMilliseconds() * Math.pow(10, l-3)); pad = true;
					break;
				case 'v': // FIXME: don't know what this is. seems to be same as z?
				case 'z':
					// We only have one timezone to offer; the one from the browser
					s = dojo.date.locale._getZone(dateObject, true, options);
					if(s){break;}
					l=4;
					// fallthrough... use GMT if tz not available
				case 'Z':
					var offset = dojo.date.locale._getZone(dateObject, false, options);
					var tz = [
						(offset<=0 ? "+" : "-"),
						string.pad(Math.floor(Math.abs(offset)/60), 2),
						string.pad(Math.abs(offset)% 60, 2)
					];
					if(l==4){
						tz.splice(0, 0, "GMT");
						tz.splice(3, 0, ":");
					}
					s = tz.join("");
					break;
//				case 'Y': case 'u': case 'W': case 'F': case 'g': case 'A': case 'e':
//					console.log(match+" modifier unimplemented");
				default:
					throw new Error("dojo.date.locale.format: invalid pattern char: "+pattern);
			}
			if(pad){ s = string.pad(s, l); }
			return s;
		});
	}

/*=====
	dojo.date.locale.__FormatOptions = function(){
	//	selector: String
	//		choice of 'time','date' (default: date and time)
	//	formatLength: String
	//		choice of long, short, medium or full (plus any custom additions).  Defaults to 'short'
	//	datePattern:String
	//		override pattern with this string
	//	timePattern:String
	//		override pattern with this string
	//	am: String
	//		override strings for am in times
	//	pm: String
	//		override strings for pm in times
	//	locale: String
	//		override the locale used to determine formatting rules
	//	fullYear: Boolean
	//		(format only) use 4 digit years whenever 2 digit years are called for
	//	strict: Boolean
	//		(parse only) strict parsing, off by default
		this.selector = selector;
		this.formatLength = formatLength;
		this.datePattern = datePattern;
		this.timePattern = timePattern;
		this.am = am;
		this.pm = pm;
		this.locale = locale;
		this.fullYear = fullYear;
		this.strict = strict;
	}
=====*/

dojo.date.locale._getZone = function(/*Date*/dateObject, /*boolean*/getName, /*dojo.date.locale.__FormatOptions?*/options){
	// summary:
	//		Returns the zone (or offset) for the given date and options.  This
	//		is broken out into a separate function so that it can be overridden
	//		by timezone-aware code.
	//
	// dateObject:
	//		the date and/or time being formatted.
	//
	// getName:
	//		Whether to return the timezone string (if true), or the offset (if false)
	//
	// options:
	//		The options being used for formatting
	if(getName){
		return date.getTimezoneName(dateObject);
	}else{
		return dateObject.getTimezoneOffset();
	}
};


dojo.date.locale.format = function(/*Date*/dateObject, /*dojo.date.locale.__FormatOptions?*/options){
	// summary:
	//		Format a Date object as a String, using locale-specific settings.
	//
	// description:
	//		Create a string from a Date object using a known localized pattern.
	//		By default, this method formats both date and time from dateObject.
	//		Formatting patterns are chosen appropriate to the locale.  Different
	//		formatting lengths may be chosen, with "full" used by default.
	//		Custom patterns may be used or registered with translations using
	//		the dojo.date.locale.addCustomFormats method.
	//		Formatting patterns are implemented using [the syntax described at
	//		unicode.org](http://www.unicode.org/reports/tr35/tr35-4.html#Date_Format_Patterns)
	//
	// dateObject:
	//		the date and/or time to be formatted.  If a time only is formatted,
	//		the values in the year, month, and day fields are irrelevant.  The
	//		opposite is true when formatting only dates.

	options = options || {};

	var locale = dojo.i18n.normalizeLocale(options.locale),
		formatLength = options.formatLength || 'short',
		bundle = dojo.date.locale._getGregorianBundle(locale),
		str = [],
		sauce = lang.hitch(this, formatPattern, dateObject, bundle, options);
	if(options.selector == "year"){
		return _processPattern(bundle["dateFormatItem-yyyy"] || "yyyy", sauce);
	}
	var pattern;
	if(options.selector != "date"){
		pattern = options.timePattern || bundle["timeFormat-"+formatLength];
		if(pattern){str.push(_processPattern(pattern, sauce));}
	}
	if(options.selector != "time"){
		pattern = options.datePattern || bundle["dateFormat-"+formatLength];
		if(pattern){str.push(_processPattern(pattern, sauce));}
	}

	return str.length == 1 ? str[0] : bundle["dateTimeFormat-"+formatLength].replace(/\{(\d+)\}/g,
		function(match, key){ return str[key]; }); // String
};

dojo.date.locale.regexp = function(/*dojo.date.locale.__FormatOptions?*/options){
	// summary:
	//		Builds the regular needed to parse a localized date

	return dojo.date.locale._parseInfo(options).regexp; // String
};

dojo.date.locale._parseInfo = function(/*dojo.date.locale.__FormatOptions?*/options){
	options = options || {};
	var locale = dojo.i18n.normalizeLocale(options.locale),
		bundle = dojo.date.locale._getGregorianBundle(locale),
		formatLength = options.formatLength || 'short',
		datePattern = options.datePattern || bundle["dateFormat-" + formatLength],
		timePattern = options.timePattern || bundle["timeFormat-" + formatLength],
		pattern;
	if(options.selector == 'date'){
		pattern = datePattern;
	}else if(options.selector == 'time'){
		pattern = timePattern;
	}else{
		pattern = bundle["dateTimeFormat-"+formatLength].replace(/\{(\d+)\}/g,
			function(match, key){ return [timePattern, datePattern][key]; });
	}

	var tokens = [],
		re = _processPattern(pattern, lang.hitch(this, _buildDateTimeRE, tokens, bundle, options));
	return {regexp: re, tokens: tokens, bundle: bundle};
};

dojo.date.locale.parse = function(/*String*/value, /*dojo.date.locale.__FormatOptions?*/options){
	// summary:
	//		Convert a properly formatted string to a primitive Date object,
	//		using locale-specific settings.
	//
	// description:
	//		Create a Date object from a string using a known localized pattern.
	//		By default, this method parses looking for both date and time in the string.
	//		Formatting patterns are chosen appropriate to the locale.  Different
	//		formatting lengths may be chosen, with "full" used by default.
	//		Custom patterns may be used or registered with translations using
	//		the dojo.date.locale.addCustomFormats method.
	//
	//		Formatting patterns are implemented using [the syntax described at
	//		unicode.org](http://www.unicode.org/reports/tr35/tr35-4.html#Date_Format_Patterns)
	//		When two digit years are used, a century is chosen according to a sliding
	//		window of 80 years before and 20 years after present year, for both `yy` and `yyyy` patterns.
	//		year < 100CE requires strict mode.
	//
	// value:
	//		A string representation of a date

	// remove non-printing bidi control chars from input and pattern
	var controlChars = /[\u200E\u200F\u202A\u202E]/g,
		info = dojo.date.locale._parseInfo(options),
		tokens = info.tokens, bundle = info.bundle,
		re = new RegExp("^" + info.regexp.replace(controlChars, "") + "$",
			info.strict ? "" : "i"),
		match = re.exec(value && value.replace(controlChars, ""));

	if(!match){ return null; } // null

	var widthList = ['abbr', 'wide', 'narrow'],
		result = [1970,0,1,0,0,0,0], // will get converted to a Date at the end
		amPm = "",
		valid = dojo.every(match, function(v, i){
		if(!i){return true;}
		var token=tokens[i-1];
		var l=token.length;
		switch(token.charAt(0)){
			case 'y':
				if(l != 2 && options.strict){
					//interpret year literally, so '5' would be 5 A.D.
					result[0] = v;
				}else{
					if(v<100){
						v = Number(v);
						//choose century to apply, according to a sliding window
						//of 80 years before and 20 years after present year
						var year = '' + new Date().getFullYear(),
							century = year.substring(0, 2) * 100,
							cutoff = Math.min(Number(year.substring(2, 4)) + 20, 99);
						result[0] = (v < cutoff) ? century + v : century - 100 + v;
					}else{
						//we expected 2 digits and got more...
						if(options.strict){
							return false;
						}
						//interpret literally, so '150' would be 150 A.D.
						//also tolerate '1950', if 'yyyy' input passed to 'yy' format
						result[0] = v;
					}
				}
				break;
			case 'M':
				if(l>2){
					var months = bundle['months-format-' + widthList[l-3]].concat();
					if(!options.strict){
						//Tolerate abbreviating period in month part
						//Case-insensitive comparison
						v = v.replace(".","").toLowerCase();
						months = dojo.map(months, function(s){ return s.replace(".","").toLowerCase(); } );
					}
					v = dojo.indexOf(months, v);
					if(v == -1){
//						console.log("dojo.date.locale.parse: Could not parse month name: '" + v + "'.");
						return false;
					}
				}else{
					v--;
				}
				result[1] = v;
				break;
			case 'E':
			case 'e':
				var days = bundle['days-format-' + widthList[l-3]].concat();
				if(!options.strict){
					//Case-insensitive comparison
					v = v.toLowerCase();
					days = dojo.map(days, function(d){return d.toLowerCase();});
				}
				v = dojo.indexOf(days, v);
				if(v == -1){
//					console.log("dojo.date.locale.parse: Could not parse weekday name: '" + v + "'.");
					return false;
				}

				//TODO: not sure what to actually do with this input,
				//in terms of setting something on the Date obj...?
				//without more context, can't affect the actual date
				//TODO: just validate?
				break;
			case 'D':
				result[1] = 0;
				// fallthrough...
			case 'd':
				result[2] = v;
				break;
			case 'a': //am/pm
				var am = options.am || bundle['dayPeriods-format-wide-am'],
					pm = options.pm || bundle['dayPeriods-format-wide-pm'];
				if(!options.strict){
					var period = /\./g;
					v = v.replace(period,'').toLowerCase();
					am = am.replace(period,'').toLowerCase();
					pm = pm.replace(period,'').toLowerCase();
				}
				if(options.strict && v != am && v != pm){
//					console.log("dojo.date.locale.parse: Could not parse am/pm part.");
					return false;
				}

				// we might not have seen the hours field yet, so store the state and apply hour change later
				amPm = (v == pm) ? 'p' : (v == am) ? 'a' : '';
				break;
			case 'K': //hour (1-24)
				if(v == 24){ v = 0; }
				// fallthrough...
			case 'h': //hour (1-12)
			case 'H': //hour (0-23)
			case 'k': //hour (0-11)
				//TODO: strict bounds checking, padding
				if(v > 23){
//					console.log("dojo.date.locale.parse: Illegal hours value");
					return false;
				}

				//in the 12-hour case, adjusting for am/pm requires the 'a' part
				//which could come before or after the hour, so we will adjust later
				result[3] = v;
				break;
			case 'm': //minutes
				result[4] = v;
				break;
			case 's': //seconds
				result[5] = v;
				break;
			case 'S': //milliseconds
				result[6] = v;
//				break;
//			case 'w':
//TODO				var firstDay = 0;
//			default:
//TODO: throw?
//				console.log("dojo.date.locale.parse: unsupported pattern char=" + token.charAt(0));
		}
		return true;
	});

	var hours = +result[3];
	if(amPm === 'p' && hours < 12){
		result[3] = hours + 12; //e.g., 3pm -> 15
	}else if(amPm === 'a' && hours == 12){
		result[3] = 0; //12am -> 0
	}

	//TODO: implement a getWeekday() method in order to test
	//validity of input strings containing 'EEE' or 'EEEE'...

	var dateObject = new Date(result[0], result[1], result[2], result[3], result[4], result[5], result[6]); // Date
	if(options.strict){
		dateObject.setFullYear(result[0]);
	}

	// Check for overflow.  The Date() constructor normalizes things like April 32nd...
	//TODO: why isn't this done for times as well?
	var allTokens = tokens.join(""),
		dateToken = allTokens.indexOf('d') != -1,
		monthToken = allTokens.indexOf('M') != -1;

	if(!valid ||
		(monthToken && dateObject.getMonth() > result[1]) ||
		(dateToken && dateObject.getDate() > result[2])){
		return null;
	}

	// Check for underflow, due to DST shifts.  See #9366
	// This assumes a 1 hour dst shift correction at midnight
	// We could compare the timezone offset after the shift and add the difference instead.
	if((monthToken && dateObject.getMonth() < result[1]) ||
		(dateToken && dateObject.getDate() < result[2])){
		dateObject = date.add(dateObject, "hour", 1);
	}

	return dateObject; // Date
};

function _processPattern(pattern, applyPattern, applyLiteral, applyAll){
	//summary: Process a pattern with literals in it

	// Break up on single quotes, treat every other one as a literal, except '' which becomes '
	var identity = function(x){return x;};
	applyPattern = applyPattern || identity;
	applyLiteral = applyLiteral || identity;
	applyAll = applyAll || identity;

	//split on single quotes (which escape literals in date format strings)
	//but preserve escaped single quotes (e.g., o''clock)
	var chunks = pattern.match(/(''|[^'])+/g),
		literal = pattern.charAt(0) == "'";

	dojo.forEach(chunks, function(chunk, i){
		if(!chunk){
			chunks[i]='';
		}else{
			chunks[i]=(literal ? applyLiteral : applyPattern)(chunk.replace(/''/g, "'"));
			literal = !literal;
		}
	});
	return applyAll(chunks.join(''));
}

function _buildDateTimeRE(tokens, bundle, options, pattern){
	pattern = regexp.escapeString(pattern);
	if(!options.strict){ pattern = pattern.replace(" a", " ?a"); } // kludge to tolerate no space before am/pm
	return pattern.replace(/([a-z])\1*/ig, function(match){
		// Build a simple regexp.  Avoid captures, which would ruin the tokens list
		var s,
			c = match.charAt(0),
			l = match.length,
			p2 = '', p3 = '';
		if(options.strict){
			if(l > 1){ p2 = '0' + '{'+(l-1)+'}'; }
			if(l > 2){ p3 = '0' + '{'+(l-2)+'}'; }
		}else{
			p2 = '0?'; p3 = '0{0,2}';
		}
		switch(c){
			case 'y':
				s = '\\d{2,4}';
				break;
			case 'M':
				s = (l>2) ? '\\S+?' : '1[0-2]|'+p2+'[1-9]';
				break;
			case 'D':
				s = '[12][0-9][0-9]|3[0-5][0-9]|36[0-6]|'+p2+'[1-9][0-9]|'+p3+'[1-9]';
				break;
			case 'd':
				s = '3[01]|[12]\\d|'+p2+'[1-9]';
				break;
			case 'w':
				s = '[1-4][0-9]|5[0-3]|'+p2+'[1-9]';
				break;
			case 'E':
				s = '\\S+';
				break;
			case 'h': //hour (1-12)
				s = '1[0-2]|'+p2+'[1-9]';
				break;
			case 'k': //hour (0-11)
				s = '1[01]|'+p2+'\\d';
				break;
			case 'H': //hour (0-23)
				s = '1\\d|2[0-3]|'+p2+'\\d';
				break;
			case 'K': //hour (1-24)
				s = '1\\d|2[0-4]|'+p2+'[1-9]';
				break;
			case 'm':
			case 's':
				s = '[0-5]\\d';
				break;
			case 'S':
				s = '\\d{'+l+'}';
				break;
			case 'a':
				var am = options.am || bundle['dayPeriods-format-wide-am'],
					pm = options.pm || bundle['dayPeriods-format-wide-pm'];
					s = am + '|' + pm;
				if(!options.strict){
					if(am != am.toLowerCase()){ s += '|' + am.toLowerCase(); }
					if(pm != pm.toLowerCase()){ s += '|' + pm.toLowerCase(); }
					if(s.indexOf('.') != -1){ s += '|' + s.replace(/\./g, ""); }
				}
				s = s.replace(/\./g, "\\.");
				break;
			default:
			// case 'v':
			// case 'z':
			// case 'Z':
				s = ".*";
//				console.log("parse of date format, pattern=" + pattern);
		}

		if(tokens){ tokens.push(match); }

		return "(" + s + ")"; // add capture
	}).replace(/[\xa0 ]/g, "[\\s\\xa0]"); // normalize whitespace.  Need explicit handling of \xa0 for IE.
}

var _customFormats = [];
dojo.date.locale.addCustomFormats = function(/*String*/packageName, /*String*/bundleName){
	// summary:
	//		Add a reference to a bundle containing localized custom formats to be
	//		used by date/time formatting and parsing routines.
	//
	// description:
	//		The user may add custom localized formats where the bundle has properties following the
	//		same naming convention used by dojo.cldr: `dateFormat-xxxx` / `timeFormat-xxxx`
	//		The pattern string should match the format used by the CLDR.
	//		See dojo.date.locale.format() for details.
	//		The resources must be loaded by dojo.requireLocalization() prior to use

	_customFormats.push({pkg:packageName,name:bundleName});
};

dojo.date.locale._getGregorianBundle = function(/*String*/locale){
	var gregorian = {};
	dojo.forEach(_customFormats, function(desc){
		var bundle = dojo.i18n.getLocalization(desc.pkg, desc.name, locale);
		gregorian = lang.mixin(gregorian, bundle);
	}, this);
	return gregorian; /*Object*/
};

dojo.date.locale.addCustomFormats("dojo.cldr","gregorian");

dojo.date.locale.getNames = function(/*String*/item, /*String*/type, /*String?*/context, /*String?*/locale){
	// summary:
	//		Used to get localized strings from dojo.cldr for day or month names.
	//
	// item:
	//	'months' || 'days'
	// type:
	//	'wide' || 'abbr' || 'narrow' (e.g. "Monday", "Mon", or "M" respectively, in English)
	// context:
	//	'standAlone' || 'format' (default)
	// locale:
	//	override locale used to find the names

	var label,
		lookup = dojo.date.locale._getGregorianBundle(locale),
		props = [item, context, type];
	if(context == 'standAlone'){
		var key = props.join('-');
		label = lookup[key];
		// Fall back to 'format' flavor of name
		if(label[0] == 1){ label = undefined; } // kludge, in the absence of real aliasing support in dojo.cldr
	}
	props[1] = 'format';

	// return by copy so changes won't be made accidentally to the in-memory model
	return (label || lookup[props.join('-')]).concat(); /*Array*/
};

dojo.date.locale.isWeekend = function(/*Date?*/dateObject, /*String?*/locale){
	// summary:
	//	Determines if the date falls on a weekend, according to local custom.

	var weekend = cldr.getWeekend(locale),
		day = (dateObject || new Date()).getDay();
	if(weekend.end < weekend.start){
		weekend.end += 7;
		if(day < weekend.start){ day += 7; }
	}
	return day >= weekend.start && day <= weekend.end; // Boolean
};

// These are used only by format and strftime.  Do they need to be public?  Which module should they go in?

dojo.date.locale._getDayOfYear = function(/*Date*/dateObject){
	// summary: gets the day of the year as represented by dateObject
	return date.difference(new Date(dateObject.getFullYear(), 0, 1, dateObject.getHours()), dateObject) + 1; // Number
};

dojo.date.locale._getWeekOfYear = function(/*Date*/dateObject, /*Number*/firstDayOfWeek){
	if(arguments.length == 1){ firstDayOfWeek = 0; } // Sunday

	var firstDayOfYear = new Date(dateObject.getFullYear(), 0, 1).getDay(),
		adj = (firstDayOfYear - firstDayOfWeek + 7) % 7,
		week = Math.floor((dojo.date.locale._getDayOfYear(dateObject) + adj - 1) / 7);

	// if year starts on the specified day, start counting weeks at 1
	if(firstDayOfYear == firstDayOfWeek){ week++; }

	return week; // Number
};

return dojo.date.locale;
});

},
'url:dojox/grid/resources/View.html':"<div class=\"dojoxGridView\" role=\"presentation\">\r\n\t<div class=\"dojoxGridHeader\" dojoAttachPoint=\"headerNode\" role=\"presentation\">\r\n\t\t<div dojoAttachPoint=\"headerNodeContainer\" style=\"width:9000em\" role=\"presentation\">\r\n\t\t\t<div dojoAttachPoint=\"headerContentNode\" role=\"row\"></div>\r\n\t\t</div>\r\n\t</div>\r\n\t<input type=\"checkbox\" class=\"dojoxGridHiddenFocus\" dojoAttachPoint=\"hiddenFocusNode\" role=\"presentation\" />\r\n\t<input type=\"checkbox\" class=\"dojoxGridHiddenFocus\" role=\"presentation\" />\r\n\t<div class=\"dojoxGridScrollbox\" dojoAttachPoint=\"scrollboxNode\" role=\"presentation\">\r\n\t\t<div class=\"dojoxGridContent\" dojoAttachPoint=\"contentNode\" hidefocus=\"hidefocus\" role=\"presentation\"></div>\r\n\t</div>\r\n</div>\r\n",
'esri/dijit/editing/TemplatePicker':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!dojo/data/ItemFileReadStore,dojox/grid/DataGrid,dijit/_Widget,dijit/_Templated,dojox/gfx,esri/utils,esri/symbol"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.editing.TemplatePicker");

dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dojox.grid.DataGrid");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dojox.gfx");
dojo.require("esri.utils");
dojo.require("esri.symbol");

// TODO
// IE - left border for selection is not visible for some cells
// There are some issues with rendered width of the widget in Safari and Firefox on Linux
// Collapsible groups
// Ability/API to Add/Remove/Update templates
// Add a "view" option which can be "grid" or "list"
// [DONE] Automatically set the width of the widget? 
// [DONE] Polyline template - use a straight line across instead of zig-zag

/***************
 * CSS Includes
 ***************/
//anonymous function to load CSS files required for this module
(function() {
  var css = [
    dojo.moduleUrl("esri.dijit.editing", "css/TemplatePicker.css"),
    dojo.moduleUrl("dojox", "grid/resources/Grid.css")       // required css for grids
    //dojo.moduleUrl("dojox", "grid/resources/tundraGrid.css") // tundra theme for grids
  ];

  var head = document.getElementsByTagName("head").item(0), link,
      i, il = css.length;
  
  for (i=0; i<il; i++) {
    link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = css[i].toString();
    head.appendChild(link);
  }
}());


/******************
 * CSS class names
 ******************
 *  templatePicker
 *    grid
 *    groupLabel
 *    item
 *    itemLabel
 *    itemSymbol
 *    selectedItem
 *    tooltip
 ******************/


/************************
 * Template Picker Dijit
 ************************/
dojo.declare("esri.dijit.editing.TemplatePicker", [dijit._Widget, dijit._Templated], {

  // Let the dijit framework know that the template for this dijit 
  // uses other dijits such as BorderContainer, StackContainer, Grid etc
  widgetsInTemplate: true,
  
  // Let the dijit framework know the location of the template file where
  // the UI for this dijit is defined 
  templateString:"<div class=\"templatePicker\">\r\n\r\n  <table dojoType=\"dojox.grid.DataGrid\" noDataMessage=\"${emptyMessage}\" selectionMode=\"none\" autoHeight=\"${_rows}\" autoWidth=\"${_autoWidth}\"\r\n         query=\"{ query: '*' }\" dojoAttachPoint=\"grid\" class=\"grid\">\r\n  </table>\r\n  \r\n</div>",
  
  // Path to the folder containing the resources used by this dijit.
  // This can be used to refer to images in the template or other
  // resources
  basePath: dojo.moduleUrl("esri.dijit.editing"),
  
  /********************
   * Public properties
   ********************/
  
  featureLayers: null,
  
  items: null, // [ { label: <String>, symbol: <esri.symbol.Symbol>, description: <String> } ];
  
  grouping: true,
  
  showTooltip: false,
  
  maxLabelLength: 0,
  
  rows: 4,
  
  columns: 3,
  
  surfaceWidth: 30, // in pixels
  
  surfaceHeight: 30, // in pixels
  
  emptyMessage: "", // passed on to grid as noDataMessage. See TemplatePicker.html
  
  useLegend: true,
  
  legendCache: {}, // intended as static member of this class
  
  // Implicit public properties: grid, tooltip
  
  /**********************
   * Internal Properties
   **********************/
  
  _uniqueId: { id: 0 },
  
  _assumedCellWidth: 90, // in pixels
  
  _initialAutoWidth: 300, // in pixels
  
  _initialAutoHeight: 200, // in pixels
  
  _ieTimer: 150, // milliseconds
  
  /*************
   * Overrides
   *************/
  
  // This section provides implementation for some of the extension points
  // (methods) exposed by the dijit framework. See the following document
  // for more information about a dijit's life-cycle and when these methods
  // are called, see:
  // http://docs.dojocampus.org/dijit/_Widget#lifecycle
  
  constructor: function(params, srcNodeRef) {
    params = params || {};
    if (!params.items && !params.featureLayers) {
      console.error("TemplatePicker: please provide 'featureLayers' or 'items' parameter in the constructor");
    }
    this._dojo14x = (dojo.version.minor >= 4); // 1.4.0 or later
    this._itemWidgets = {};
    
    // We still need to do this here because the implicit _setXXAttr methods
    // are called after "buildRendering" phase and before "startup" is called.
    // But we preprocess in "postMixInProperties" where we need sane _flChanged
    if (params.featureLayers && params.featureLayers.length) {
      this._flChanged = 1;
    }
    
    this._nls = dojo.getObject("bundle.widgets.templatePicker", false, esri);
    
    // passed on to grid as noDataMessage. See TemplatePicker.html
    this.emptyMessage = params.emptyMessage || 
                        (this._nls && this._nls.creationDisabled) ||
                        "";
  },
  
  postMixInProperties: function() {
    this.inherited(arguments);
    
    // pre-processing of the input data
    this._preprocess();
  },

  startup: function() {
    // overriding methods typically call their implementation up the inheritance chain
    this.inherited(arguments);
    
    if (this.rows === "auto" && this.columns === "auto") {
      var box = dojo.contentBox(this.domNode);
      if (!box.w) {
        this.domNode.style.width = this._initialAutoWidth + "px";
      }
      if (!box.h) {
        this.domNode.style.height = this._initialAutoHeight + "px";
      }
      box = dojo.contentBox(this.domNode);
      this._columns = Math.floor( box.w / this._assumedCellWidth ) || 1;
    }
    
    this._applyGridPatches();
    this._setGridLayout();

    // event handlers for the grid
    dojo.connect(this.grid, "onRowClick", this, this._rowClicked);
    
    this._setGridData();
    
//    if (this.rows === "auto" && this.columns === "auto") {
//      this.grid._resize();
//    }
    
    this._toggleTooltip();
    
    if (dojo.isIE < 9) {
      this._repaintItems = dojo.hitch(this, this._repaintItems);
      setTimeout(this._repaintItems, this._ieTimer);
    }
    //this.inherited(arguments);
  },
  
  destroy: function() {
    //dojo.disconnect(this._renderConnect);
    
    this.showTooltip = false;
    this._toggleTooltip();
    this._clearLegendInfo();
    
    this.featureLayers = this.items =  this.grid =  
    this._flItems = this._itItems = this._groupRowIndices = 
    this._selectedCell = this._selectedInfo = this._selectedItem = null; //this._renderConnect = null;
    
    this.inherited(arguments);
  },
  
  /*****************
   * Public Methods
   *****************/
  
  getSelected: function() {
    return this._selectedCell ? this._selectedItem : null;
  },
  
  clearSelection: function() {
    var cellNode = this._selectedCell, info = this._selectedInfo;
    if (cellNode) {
      // fake a row click event to clear the selection
      this._rowClicked({ cellNode: cellNode, rowIndex: info.selRow, cellIndex: info.selCol });
    }
  },
  
  update: function(/*Boolean?*/ resize) {
    var doResize = (this.rows === "auto" && this.columns === "auto" && resize) ? true : false,
        grid = this.grid, box;
    
    if (doResize) {
      var domNode = this.domNode, 
          id = domNode.id, width, item = dojo.query("#" + id + ".templatePicker div.item")[0];
      
      box = dojo.contentBox(domNode);
      
      item = item && item.parentNode;
      // No "item" indicates template picker has nothing to show
      
      if (item) {
        width = dojo.coords(item).w;
      }
      else {
        width = this._assumedCellWidth;
      }
      
      this._columns = Math.floor( ( box.w - grid.views.views[0].getScrollbarWidth() ) / width );
      this._columns = this._columns || 1;
      //grid.render();
      //grid.prerender();
    }
    
    var previous = this._rows;
    this._preprocess();
    var current = this._rows;
    
    this._setGridLayout();
    this._setGridData();
    
    if (current !== previous) {
      //console.log(previous, current);
      grid.set("autoHeight", this._rows, false);
    }
    
    if (doResize) {
      grid._resize({ w: box.w, h: box.h });
      
      // At Dojo 1.4.1, for some reason this node becomes
      // a "block" after resize
      grid.viewsHeaderNode.style.display = "none";
      //grid.adaptWidth(); 
      //grid.adaptHeight();
    }
    else {
      grid.update();
    }
    
    this._toggleTooltip();
    
    // restore selected item
    var self = this, selected = this.getSelected();
    if (selected) {
      grid.store.fetch({
        onComplete: function(its) {
          var found = self._locate(selected, self._selectedInfo, its);
          var cellNode = found && grid.views.views[0].getCellNode(found[0], found[1]);
          if (cellNode) {
            // fake a row click event to restore the selection
            self._rowClicked({ cellNode: cellNode, rowIndex: found[0], cellIndex: found[1] }, true);
          }
          
        }
      });
    }

    if (dojo.isIE < 9) {
      setTimeout(this._repaintItems, this._ieTimer);
    }
    
    // This is typically done automatically by setting noDataMessage property
    // of the grid (see constrcutor and template html). However when grouping
    // is disabled, grid has a stray row (grid.rowCount is 1) and hence prevents
    // display of emptyMessage.
    // Let's handle it here
    var layers = this.featureLayers, items = this.items;
    if (
      (!layers || !layers.length) &&
      (!items || !items.length) && 
      grid && this.emptyMessage
    ) {
      grid.showMessage(this.emptyMessage);
    }
  },
  
  /*********
   * Events
   *********/
  
  onSelectionChange: function() {},
  
  /*****************
   * Setter Methods
   *****************/
  
  _setUseLegendAttr: function(use) {
    var previous = this.useLegend;
    //console.log("[ _setUseLegendAttr ] ", previous, use);
    
    if (!this._started || previous !== use) {
      if (use) {
        this._flChanged = 1;
      }
      else {
        this._clearLegendInfo();
      }
    }

    this.useLegend = use;
  },
  
  _setFeatureLayersAttr: function(layers) {
    var previous = this.featureLayers;
    //console.log("[ _setFeatureLayersAttr ] ", previous, layers);

    if (!this._started || previous !== layers) {
      this._flChanged = 1;
    }
    
    this.featureLayers = layers;
  },
  
  /*******************
   * Internal Methods
   *******************/
  
  _preprocess: function() {
    if (this.items) {
      // grouping not supported for 'items'
      this.grouping = false;
    }
    
    this._autoWidth = false;
    if (this.rows === "auto" || this.columns === "auto") {
      this._autoWidth = true;  // used in the template
    }

    var items;
    if (this.featureLayers) {
      // Handles the case where some feature layer added in "selection-only"
      // mode where the features are actually rendered using a dynamic map
      // service layer
      if (this.useLegend && this._flChanged) {
        // This array contains the indices of "this.featureLayers" array.
        // Indicates these layers should use the legend symbols instead 
        // of the renderer returned by the feature layer resource
        this._legendIndices = [];
        
        // This array contains the indices of "this.featureLayers" array.
        // Indicates outstanding legend request for these layers
        this._loadingIndices = [];
        
        // A dictionary that maps an index of "this.featureLayers" array
        // to a dictionary that maps a "value" to its symbol info object 
        // obtained from legend response
        this._legendSymbols = {};
        
        this._ignoreLegends();
        this._loadingLegends = [];
        
        clearTimeout(this._legendTimer);
        this._legendTimer = null;
        
        this._processSelectionLayers();

        // We've processed "this.featureLayers". Not dirty anymore
        // until the user sets a different value for this.featureLayers
        this._flChanged = 0;
      }
      
      items = this._flItems = this._getItemsFromLayers(this.featureLayers);
    }
    else {
      items = this._itItems = this._getItemsFromItems(this.items);
    }
    
    if (this.rows === "auto" && this.columns === "auto") {
      if (!this._started) {
        this._rows = false;
        this._columns = null;
        this._autoWidth = false;
      }
      return;
    }

    // adjust rows and columns
    var len = 0;
    this._rows = this.rows;
    this._columns = this.columns;
    if (this.rows === "auto") {
      
      if (this.featureLayers) {
        if (this.grouping) {
          len = items.length;
          dojo.forEach(items, function(subItems) {
            len += Math.ceil(subItems.length / this.columns);
          }, this);
        }
        else {
          dojo.forEach(items, function(subItems) {
            len += subItems.length;
          }, this);
          len = Math.ceil(len / this.columns);
        }
      }
      else {
        len = Math.ceil(items.length / this.columns);
      }

      this._rows = len; // used in the template
    }
    else if (this.columns === "auto") {

      if (this.featureLayers) {
        if (this.grouping) {
          // TODO
          // what does this layout even mean? (Not supported)
          len = 3;
        }
        else {
          dojo.forEach(items, function(subItems) {
            len += subItems.length;
          }, this);
          len = Math.ceil(len / this.rows);
        }
      }
      else {
        len = Math.ceil(items.length / this.rows);
      }
      
      this._columns = len;
    }

    /*if (this._dojo14x && this.grouping) {
      this._rows *= 2; // each row has an inner row, remember?
    }*/
  },
  
  _processSelectionLayers: function() {
    // 1. find selection mode feature layers that have been added to the map
    // 2. group these layers by their respective services
    // 3. find if the map service corresponding to those feature services have been added to the map as well
    // 4. make legend requests for each of these map services
    // 5. use these legend symbols instead of the renderer returned by feature layer resource
    
    var map, serviceUrl, info, layers, key, indices, legend,
        mapServiceDict = {
          /***
          "<map-service-url>": {
            "featureLayers": {
              "<layer-id>": <FeatureLayer>,
              ...
            },
            
            "indices": [ <layer-id>, ... ],
            "mapServiceUrl": "<string>",
            "mapServiceLayer": <ArcGISMapServiceLayer>
          },
          ...
          ***/
        };
    
    // mapServiceDict would contain one entry for each map service that we want to
    // fetch legend for. Each map service entry would provide legend symbols
    // for one or more featureLayers dislayed in this template picker
    dojo.forEach(this.featureLayers, function(layer, idx) {
      if (
        layer.mode === esri.layers.FeatureLayer.MODE_SELECTION && 
        layer._map && layer.url && layer._params.drawMode &&
        // TODO
        !layer.source // Why not?
      ) {
        serviceUrl = dojo.trim(layer._url.path)
                       .replace(/\/(MapServer|FeatureServer).*/ig, "\/MapServer")
                       .replace(/^https?:\/\//ig, "")
                       .toLowerCase();
                      
        info = (mapServiceDict[serviceUrl] = mapServiceDict[serviceUrl] || {}); 
        layers = (info.featureLayers = info.featureLayers || {});
        indices = (info.indices = info.indices || []);

        layers[idx] = layer;
        indices.push(idx);
        map = layer._map;
      }
    });
    
    if (map) { // indicates there is atleast one legend request to be made
      dojo.forEach(map.layerIds, function(layer) {
        layer = map.getLayer(layer);
        
        // TODO
        // Should we wait for the layer to load before attempting to read "version"?
        if (
          layer && layer.url && (layer.getImageUrl || layer.getTileUrl) && 
          layer.loaded && layer.version >= 10.1
        ) {
          serviceUrl = dojo.trim(layer._url.path).replace(/(\/MapServer).*/ig, "$1");
          key = serviceUrl.replace(/^https?:\/\//ig, "").toLowerCase();
        
          if (mapServiceDict[key] && (!mapServiceDict[key].mapServiceUrl)) {
            //console.log("FOUND matching map service layer: ", layer, serviceUrl);

            info = mapServiceDict[key];
            info.mapServiceUrl = serviceUrl;
            info.mapServiceLayer = layer;
            
            this._legendIndices = this._legendIndices.concat(info.indices);
            
            legend = this._fetchLegend({
              pickerInstance: this,
              info: info
            }, key);
            
            if (legend.then) {
              this._loadingIndices = this._loadingIndices.concat(info.indices);
              this._loadingLegends.push(legend);
            }
            else {
              this._processLegendResponse(legend, info);
            }
          }
        }
      }, this);
    }
    
    //console.log("mapServiceDict = ", mapServiceDict);
    //this._printLegendInfo();
  },
  
  _fetchLegend: function(context, key) {
    //console.log("making legend request...");
    
    var proto = esri.dijit.editing.TemplatePicker.prototype,
        legend = proto.legendCache[key];
    
    if (!legend) {
      legend = (proto.legendCache[key] = esri.request({
        url: context.info.mapServiceUrl/*.replace("symbols", "sadfsad")*/ + "/legend",
        content: { f: "json" },
        callbackParamName: "callback"
      }));
      
      legend._contexts = [ context ];
      
      legend.addBoth(
        function(response) {
          //console.log("success/error: ", response);
          
          if (legend.canceled) {
            return;
          }
          
          // add this legend response/error to the cache
          proto.legendCache[key] = response;
          
          var contexts = legend._contexts;
          legend._contexts = null;
          
          dojo.forEach(contexts, function(ctxt) {
            var pickerInstance = ctxt.pickerInstance, info = ctxt.info, found;
            
            if (pickerInstance._destroyed) {
              return;
            }
            
            // update pendingIndices list
            dojo.forEach(info.indices, function(idx) {
              found = dojo.indexOf(pickerInstance._loadingIndices, idx);
              if (found > -1) {
                pickerInstance._loadingIndices.splice(found, 1);
              }
            });
            
            found = dojo.indexOf(pickerInstance._loadingLegends, legend);
            if (found > -1) {
              pickerInstance._loadingLegends.splice(found, 1);
            }
            
            pickerInstance._processLegendResponse(response, info);
          });
        }
      );
    }
    else if (legend.then) {
      legend._contexts.push(context);
    }
    
    return legend;
  },
  
  _clearLegendInfo: function() {
    clearTimeout(this._legendTimer);
    this._ignoreLegends();

    this._legendIndices = this._loadingIndices = this._legendSymbols = 
    this._loadingLegends = this._legendTimer = null;
  },
  
  _ignoreLegends: function() {
    if (this._loadingLegends) {
      dojo.forEach(this._loadingLegends, function(legend) {
        var found = -1;
        
        dojo.some(legend._contexts, function(ctxt, idx) {
          if (ctxt.pickerInstance === this) {
            found = idx;
          }
          
          return (found > -1);
        }, this);
        
        if (found > -1) {
          legend._contexts.splice(found, 1);
        }
      }, this);
    }
  },
  
  /*_printLegendInfo: function() {
    console.log("=========================");
    console.log("useLegend = ", this.useLegend);
    console.log("legend indices = ", this._legendIndices);
    console.log("loading indices = ", this._loadingIndices);
    console.log("loading legends = ", this._loadingLegends);
    console.log("legend symbols = ", this._legendSymbols);
    console.log("timer = ", this._legendTimer);
    console.log("changed = ", this._flChanged);
    console.log("=========================");
  },*/
  
  _processLegendResponse: function(legend, info) {
    //console.log("processing legend response from....", info.mapServiceUrl, arguments);
    
    if (legend && !(legend instanceof Error)) {
      // iterate over indices and process the legend info
      dojo.forEach(info.indices, function(idx) {
        var layerId = info.featureLayers[idx].layerId, i,
            baseUrl = info.mapServiceUrl + "/" + layerId + "/images/", 
            token = info.mapServiceLayer._getToken(), found, obj, values, url;
        
        if (this._legendSymbols[idx]) {
          return;
        }
        
        found = null;
        dojo.some(legend.layers, function(layerObj) {
          if (layerObj.layerId == layerId) {
            found = layerObj;
          }
          
          return !!found;
        });
        
        if (found) {
          //console.log("found legend = ", found);
          obj = (this._legendSymbols[idx] = {});
          
          dojo.forEach(found.legend, function(symbolObj) {
            values = symbolObj.values;
            
            if (values && values.length) {
              // unique value or class breaks renderer
              for (i = 0; i < values.length; i++) {
                obj[values[i]] = symbolObj;
              }
            }
            else {
              // simple renderer (or defaultSymbol of unique value or class breaks?)
              obj.defaultSymbol = symbolObj;
            }
                    
            // Convert relative urls to absolute image urls.
            // Use token where required.
            // This block of code borrowed from FeatureLayer._initLayer method.
            url = symbolObj.url;
            if (url && !symbolObj._fixed) {
              symbolObj._fixed = 1;
              
              // translate relative image resources to absolute paths
              if ( (url.search(/https?\:/) === -1) ) {
                symbolObj.url = baseUrl + url;
              }
              
              // we're not going through esri.request. So, we need to append 
              // the token ourselves
              if (token && symbolObj.url.search(/https?\:/) !== -1) {
                symbolObj.url += ( 
                  ((symbolObj.url.indexOf("?") > -1) ? "&" : "?") + 
                  "token=" + token 
                );
              }
            }
            //console.log("url = " + symbolObj.url);

          });
        }
      }, this);
      
      //console.log("processed legend symbols: ", this._legendSymbols);
    }
    else {
      var found;
      
      dojo.forEach(info.indices, function(idx) {
        found = dojo.indexOf(this._legendIndices, idx);
        if (found > -1) {
          this._legendIndices.splice(found, 1);
        }
      }, this);
    }
    
    // In any case, trigger update if the widget already started up.
    var self = this;
    if (self._started && !self._legendTimer) {
      self._legendTimer = setTimeout(function() {
        clearTimeout(self._legendTimer);
        self._legendTimer = null;
        
        if (!self._destroyed) {
          self.update();
        }
      }, 0);
    }
  },
  
  _applyGridPatches: function() {
    var grid = this.grid;

    // patching for "autoWidth and grid header display" issue
    // see sitepen ticket: https://support.sitepen.com/issues/20400
    var oldAdaptWidth = grid.adaptWidth, views, i, view;
    
    grid.adaptWidth = function(){
      views = this.views.views;
      
      for(i = 0; view=views[i]; i++){
        dojo.style(view.headerNode, 'display', 'block');
      }
      
      oldAdaptWidth.apply(this, arguments);
      
      for(i = 0; view=views[i]; i++){
        dojo.style(view.headerNode, 'display', 'none');
      }
    };

    if (this._dojo14x) {
      if (this.rows !== "auto" && this.columns !== "auto") {
        //console.log("fetch complete patch applied...");
        // see https://support.sitepen.com/issues/20422#note-16
        var fetchConnect = dojo.connect(grid, "_onFetchComplete", this, function() {
          dojo.disconnect(fetchConnect);
          this.grid.set("autoHeight", this._rows);
        });
      }

      // cleanup gfx surfaces as needed
      // see https://support.sitepen.com/issues/20422#note-10
      dojo.connect(grid, "_onDelete", this, this._destroyItems);
      dojo.connect(grid, "_clearData", this, this._destroyItems);
      dojo.connect(grid, "destroy", this, this._destroyItems);
      
      var focus = grid.focus;
      if (focus && focus.findAndFocusGridCell) {
        // disable focusing on the current selection
        // when scrollbar is clicked (odd ui behavior)
        focus.findAndFocusGridCell = function() { return false; };
      }
    }
  },
  
  _setGridLayout: function() {
    // grid cell "getter" function
    var getFunc = function(sequence) {
      return function(inRowIndex, inItem) {
        return this._cellGet(sequence, inRowIndex, inItem);
      };
    };
    
    // item fields definition
    var formatterFunc = dojo.hitch(this, this._cellFormatter),
        cells = [], cols = this._columns, i;
    
    for (i = 0; i < cols; i++) {
      cells.push({ field: "cell" + i, get: dojo.hitch(this, getFunc(i)), formatter: formatterFunc });
    }

    var layout = { cells: [ cells ] };
    
    if (this.grouping) {
      // group field definition
      var groupField = { field: "groupName", colSpan: cols, get: dojo.hitch(this, this._cellGetGroup), formatter: dojo.hitch(this, this._cellGroupFormatter) };
      layout.cells.push([ groupField ]);
    }
    
    //console.log("grid per page = ", this.grid.rowsPerPage);
    //console.log("current _rows = ", this._rows);

    // final grid structure/layout
    var grid = this.grid, defaultRPP = dojox.grid.DataGrid.prototype.rowsPerPage;
    
    grid.set("rowsPerPage", (this._rows > defaultRPP)? this._rows : defaultRPP);
    
    grid.set("structure", layout);
    
    //dojo.disconnect(this._renderConnect);
    //this._renderConnect = dojo.connect(grid.views.views[0], "onAfterRow", this, this._afterRowFunc);
  },
  
  _setGridData: function() {
    // get store items
    var storeItems = [];
    
    if (this.grouping) {
      this._groupRowIndices = [];
      var prevIndex, prevNumRows, cols = this._columns;
      
      dojo.forEach(this._flItems, function(subItems, idx) {
        // store item for group name row
        storeItems.push({});
        
        // housekeeping
        var index = (idx === 0) ? 0 : (prevIndex + prevNumRows + 1);
        this._groupRowIndices.push(index);
        prevIndex = index;
        prevNumRows = Math.ceil(subItems.length / cols);
        
        // store items for templates
        storeItems = storeItems.concat(this._getStoreItems(subItems));
      }, this);
      
      //console.log("Group row indices = " , this._groupRowIndices);
    }
    else {
      if (this.featureLayers) {
        dojo.forEach(this._flItems, function(subItems) {
          storeItems = storeItems.concat(subItems);
        });
        storeItems = this._getStoreItems(storeItems);
      }
      else {
        storeItems = this._getStoreItems(this._itItems);
      }
    }
    
    // data store for the grid
    var store = new dojo.data.ItemFileReadStore({ 
      data: { items: storeItems }
    });
    this.grid.setStore(store);
  },
  
  _toggleTooltip: function() {
    if (this.showTooltip) { // enable if not already enabled
      if (this.tooltip) {
        return;
      }
      
      this.tooltip = dojo.create("div", { "class": "tooltip" },this.domNode);
      this.tooltip.style.display = "none";
      this.tooltip.style.position = "fixed";
      
      var grid = this.grid;
      this._mouseOverConnect = dojo.connect(grid, "onCellMouseOver", this, this._cellMouseOver);
      this._mouseOutConnect = dojo.connect(grid, "onCellMouseOut", this, this._cellMouseOut);
    }
    else { // disable
      if (this.tooltip) {
        dojo.disconnect(this._mouseOverConnect);
        dojo.disconnect(this._mouseOutConnect);
        dojo.destroy(this.tooltip);
        this.tooltip = null;
      }
    }
  },
  
  _rowClicked: function(evt, silent) {
    //console.log("[ ROW CLICK ] ", evt);
    var cellNode = evt.cellNode, row = evt.rowIndex, col = evt.cellIndex;
    
    // get clicked cell info
    var cell = this._getCellInfo(cellNode, row, col);
    if (!cell) {
      // clicked an invalid cell
      return;
    }
    
    var store = this.grid.store;
    if (store.getValue(cell, "loadingCell")) {
      return;
    }
    
    // unselect the previous selection
    if (this._selectedCell) {
      dojo.removeClass(this._selectedCell, "selectedItem");
    }
    
    if (cellNode !== this._selectedCell) {
      dojo.addClass(cellNode, "selectedItem");
      this._selectedCell = cellNode;
      
      this._selectedItem = {
        featureLayer: store.getValue(cell, "layer"),
        type: store.getValue(cell, "type"),
        template: store.getValue(cell, "template"),
        symbolInfo: store.getValue(cell, "symbolInfo"),
        item: this._getItem(cell)
      };
      
      this._selectedInfo = {
        selRow: row,
        selCol: col,
        index1: store.getValue(cell, "index1"),
        index2: store.getValue(cell, "index2"),
        index: store.getValue(cell, "index")
      };
      //this._selRow = row;
      //this._selCol = col;
    }
    else {
      this._selectedCell = this._selectedInfo = this._selectedItem = null;
    }
    
    if (!silent) {
      this.onSelectionChange();
    }
  },
  
  _locate: function(selected, info, storeItems) {
    var store = this.grid.store, cols = new Array(this._columns);
    var found, index1 = info.index1, index2 = info.index2, index = info.index, item = selected.item;
    
    dojo.some(storeItems, function(storeItem, rowIndex) {
      return dojo.some(cols, function(ignore, cellIndex) {
        var cell = store.getValue(storeItem, "cell" + cellIndex);
        
        if (cell && 
           (item ? (index === store.getValue(cell, "index")) : (index1 === store.getValue(cell, "index1")  && index2 === store.getValue(cell, "index2")) )
           ) {
          found = [ rowIndex, cellIndex ];
          return true; 
        }
        else {
          return false;
        }
      });
    });
    
    return found;
  },
  
  _getCellInfo: function(cellNode, row, col) {
    if (!cellNode) {
      // Just return if the user clicked any area inside the grid
      // that does not have a cell
      return;
    }

    //console.log(row + ", " + col);

    var grid = this.grid;
    var item = grid.getItem(row);
    var cell = grid.store.getValue(item, "cell" + col);
    //console.log(cell && grid.store.getValue(cell, "label"));
    return cell;
  },
  
  _getItem: function(cell) {
    var items = this.items;
    if (items) {
      return items[this.grid.store.getValue(cell, "index")];
    }
  },
  
  _cellMouseOver: function(evt) {
    var tooltip = this.tooltip;
    var cellNode = evt.cellNode, row = evt.rowIndex, col = evt.cellIndex;
    var cell = this._getCellInfo(cellNode, row, col);
    
    if (tooltip && cell) {
      var store = this.grid.store;
      var template = store.getValue(cell, "template");
      var type = store.getValue(cell, "type");
      var symbolInfo = store.getValue(cell, "symbolInfo");
      var layer = store.getValue(cell, "layer");
      var item = this._getItem(cell);
      
      var label = ( item && (item.label + (item.description ? (": " + item.description) : "" )) ) || 
                  (template && (template.name + (template.description ? (": " + template.description) : "" )) ) || 
                  (type && type.name) || 
                  (symbolInfo && (symbolInfo.label + (symbolInfo.description ? (": " + symbolInfo.description) : "" ))) || 
                  ((layer && layer.name + ": ") + "Default");
      
      
      tooltip.style.display = "none";
      tooltip.innerHTML = label;
      var coords = dojo.coords(cellNode.firstChild);
      dojo.style(tooltip, { left: (coords.x) + "px", top: (coords.y + coords.h + 5) + "px" });
      tooltip.style.display = "";
    }
  },
  
  _cellMouseOut: function() {
    var tooltip = this.tooltip;
    if (tooltip) {
      tooltip.style.display = "none";
    }
  },
  
  /*_afterRowFunc: function(inRowIndex, inSubRows) {
    //console.log("[ AFTER ROW ] ", inRowIndex);

    var grid = this.grid;
    var item = grid.getItem(inRowIndex);
    if (!item) {
      return;
    }
    
    var cols = this._columns, surfaces = this._surfaces;
    for (var i = 0; i < cols; i++) {
      var cell = grid.store.getValue(item, "cell" + i);
      if (cell) {
        try {
          var sid = grid.store.getValue(cell, "surfaceId");
          surfaces[sid] = this._drawSymbol(sid, grid.store.getValue(cell, "symbol"));
        }
        catch(e) {
          // TODO
          // Need to try catch here for IE.
          // In IE, sometimes createShape crashes because shape.rawNode has no
          // 'path' property yet (slow). This happens when IE is first opened 
          // with a page that has template picker. Everything is fine when the page
          // is refreshed. Instead of crashing, we can try catch here so that
          // atleast the label is displayed for the templates.
          // NOTE: This problem only happens for shapes of type 'path'
          // NOTE: registering 'whenLoaded' function does not solve this problem 
        }
      }
    }
  },
  
  _drawSymbol: function(surfaceId, symbol) {
    var sWidth = this.surfaceWidth, sHeight = this.surfaceHeight;
    var surface = dojox.gfx.createSurface(dojo.byId(surfaceId), sWidth, sHeight);
    if (dojo.isIE) {
      // Fixes an issue in IE where the shape is partially drawn and
      // positioned to the right of the table cell  
      var source = surface.getEventSource();
      dojo.style(source, "position", "relative");
      dojo.style(source.parentNode, "position", "relative");
    }
    var shapeDesc = esri.symbol.getShapeDescriptors(symbol);
    gfxShape = surface.createShape(shapeDesc.defaultShape).setFill(shapeDesc.fill).setStroke(shapeDesc.stroke);
    
    var dim = surface.getDimensions();
    var transform = { dx: dim.width/2, dy: dim.height/2 };
    
    var bbox = gfxShape.getBoundingBox(), width = bbox.width, height = bbox.height;
    if (width > sWidth || height > sHeight) {
      var actualSize = width > height ? width : height;
      var refSize = sWidth < sHeight ? sWidth : sHeight;
      var scaleBy = (refSize - 5) / actualSize;
      dojo.mixin(transform, { xx: scaleBy, yy: scaleBy });
    }

    gfxShape.applyTransform(transform);
    return surface;
  },*/
  
  _destroyItems: function() {
    //console.log("_destroyItems");
    var widgets = this._itemWidgets, w;
    
    for (w in widgets) {
      if(!widgets[w]){
        continue;
      }
      //console.log("destroying... ", w);
      widgets[w].destroy();
      delete widgets[w];
    }
  },
  
  _repaintItems: function() {
    //console.log("_repaintItems");
    var widgets = this._itemWidgets, w;
    
    for (w in widgets) {
      var widget = widgets[w];
      if (widget) {
        widget._repaint(widget._surface);
      }
    }
  },
  
  _getStoreItems: function(inItems) {
    // item = { label: <String>, symbol: <esri.symbol.Symbol> };
    //console.log("[ Create Store ]");
    
    // clone the items
    var uid = this._uniqueId;
    inItems = dojo.map(inItems, function(item) {
      return dojo.mixin({
        "surfaceId": "tpick-surface-" + (uid.id++)
      }, item);
    });
    
    /*//var _uniqueId = 0;
    var uid = this._uniqueId;
    var itemHtml = 
      "<div class='item' style='text-align: center;'>" + 
        "<div class='itemSymbol' id='${surfaceId}'></div>" + 
        "<div class='itemLabel'>${label}</div>" + 
      "</div>";
    
    dojo.map(inItems, function(item) {
      item.surfaceId = "tpick-surface-" + (uid.id++);
      item.content = esri.substitute(item, itemHtml);
    });*/
    
    var len = inItems.length, index = 0, obj = {}, k = 0, prop, filteredItems = [], flag = true, cols = this._columns;
    while (index < len) {
      flag = true;
      prop = "cell" + k;
      obj[prop] = inItems[index];
      index++;
      
      k++;
      if (k % cols === 0) {
        flag = false;
        filteredItems.push(obj);
        obj = {};
        k = 0;
      }
    }
    
    if (flag && len) {
      filteredItems.push(obj);
    }
    
    return filteredItems;
  },
  
  _getItemsFromLayers: function(layers) {
    var items = [];
    
    dojo.forEach(layers, function(layer, index1) {
      items.push(this._getItemsFromLayer(layer, index1));
    }, this); // layers
    
    return items; // [ [ item1, item2, ... ], ... ]
  },
  
  _getItemsFromLayer: function(layer, index1) {
    var items = [];
    
    if (this.useLegend && dojo.indexOf(this._loadingIndices, index1) > -1) {
      //console.log("skipping this layer for now...", index1, layer);
      
      // Let's just return one item that shows "Loading" message
      return [{
        label: (this._nls && this._nls.loading) || "",
        symbol: null,
        layer: layer,
        type: null,
        template: null,
        index1: index1,
        index2: 0,
        loadingCell: 1
      }];
    }
    
    // index1 and index2 together represent the
    // location of an item in _flItems

    // find all the templates defined in the layer
    var outTemplates = [];
    
    // layer templates
    outTemplates = outTemplates.concat(layer.templates);
    
    // templates defined for layer types
    dojo.forEach(layer.types, function(fType) {
      var templates = fType.templates;
      dojo.forEach(templates, function(fTemplate) {
        fTemplate._type_ = fType;
      });
      outTemplates = outTemplates.concat(templates);
    });
    
    outTemplates = dojo.filter(outTemplates, esri._isDefined);
    
    var renderer = layer.renderer;
    
    if (renderer) {
      var className = renderer.declaredClass.replace("esri.renderer.", "");
      
      if (outTemplates.length > 0) { // use Renderer::getSymbol
      
        dojo.forEach(outTemplates, function(outTemplate) {
          var proto = outTemplate.prototype;
          
          if (proto) {
            var symbol = renderer.getSymbol(proto);
            //console.log("original symbol = ", symbol);
            
            if (symbol) {
              var found = null, pms, legend;
              
              // Check if we have a legend symbol that should be used
              if (this.useLegend && dojo.indexOf(this._legendIndices, index1) > -1) {
                legend = this._legendSymbols && this._legendSymbols[index1];
                
                if (legend) {
                  switch(className) {
                    case "SimpleRenderer":
                      found = legend.defaultSymbol;
                      break;
                      
                    case "UniqueValueRenderer":
                      dojo.some(renderer.infos, function(info) {
                        if (info.symbol === symbol) {
                          found = legend[info.value];
                        }
                        return !!found;
                      });
                      break;
                      
                    case "ClassBreaksRenderer":
                      dojo.some(renderer.infos, function(info) {
                        if (info.symbol === symbol) {
                          found = legend[info.maxValue];
                        }
                        return !!found;
                      });
                      break;
                  }
                }
                
                if (found) {
                  pms = dojo.fromJson(dojo.toJson(esri.symbol.defaultPictureMarkerSymbol));
                  pms.url = found.url;
                  pms.imageData = found.imageData;
                  pms.contentType = found.contentType;
                  pms.width = found.width;
                  pms.height = found.height;
                  
                  // For whatever reason legend operation does not return
                  // width and height for the image symbols, but for the most
                  // part, default is 20px by 20px (15pt by 15pt)
                  // http://nil/rest-docs/mslegend.html
                  if (!esri._isDefined(pms.width) || !esri._isDefined(pms.height)) {
                    pms.width = 15;
                    pms.height = 15;
                  }
                  
                  found = new esri.symbol.PictureMarkerSymbol(pms);
                }
                
                //console.log("legend symbol found = ", found);
              }

              items.push({
                label: this._trimLabel(outTemplate.name),
                symbol: found || symbol,
                legendOverride: !!found,
                layer: layer,
                type: outTemplate._type_,
                template: outTemplate,
                index1: index1,
                index2: items.length
              });
            }
//            else {
//              console.debug("SYMBOL not available: ", outTemplate);
//            }
          } // prototype available
//          else {
//            console.debug("PROTOTYPE not available: ", outTemplate);
//          }
          delete outTemplate._type_;
        }, this);
        
      } // templates available
      
      else { // use "infos" from renderer (specific to each renderer type)
      
        var infos = [];
        
        if (className === "TemporalRenderer") {
          renderer = renderer.observationRenderer;
          if (renderer) {
            className = renderer.declaredClass.replace("esri.renderer.", "");
          }
        }
        
        switch(className) {
          case "SimpleRenderer":
            infos = [{symbol: renderer.symbol, label: renderer.label, description: renderer.description}];
            break;
          case "UniqueValueRenderer":
          case "ClassBreaksRenderer":
            infos = renderer.infos;
            break;
        }
        
        items = dojo.map(infos, function(info, idx) {
          return {
            label: this._trimLabel(info.label),
            description: info.description,
            symbolInfo: dojo.mixin({constructor: function() {}}, info), // ctor to avoid data store from corrupting it
            symbol: info.symbol,
            layer: layer,
            index1: index1,
            index2: idx
          };
        }, this);
        
      } // no templates
      
    } // layer renderer
    
    return items;
  },
  
  _getItemsFromItems: function(inItems) {
    // clone
    return dojo.map(inItems, function(item, idx) {
      item = dojo.mixin({ index: idx }, item);
      item.label = this._trimLabel(item.label);
      return item;
    }, this);
    
    // [ item1, item2, ... ]
  },
  
  _trimLabel: function(label) {
    var max = this.maxLabelLength;
    if (max && label) {
      if (label.length > max) {
        label = label.substr(0, max) + "...";
      }
    }
    return label || "";
  },
  
  /****************************
   * Item getter and formatter
   ****************************/
  
  _cellGet: function(sequence, inRowIndex, inItem) {
    if(!inItem) {
      return "";
    }
    return this.grid.store.getValue(inItem, "cell" + sequence);
  },
  
  _cellFormatter: function(value) {
    //console.log("[ FORMATTER ] ", value);
    
    if (value) {
      /*value = this.grid.store.getValue(value, "content");
      return value.replace(/&lt;/g, "<");*/
     
      var widgets = this._itemWidgets, store = this.grid.store;
      var sid = store.getValue(value, "surfaceId");
      var w = widgets[sid];
      if(!w){
        w = (widgets[sid] = new esri.dijit.editing.TemplatePickerItem({
          id: sid, 
          label: store.getValue(value, "label"),
          symbol: store.getValue(value, "symbol"),
          legendOverride: store.getValue(value, "legendOverride"),
          surfaceWidth: this.surfaceWidth,
          surfaceHeight: this.surfaceHeight,
          template: store.getValue(value, "template") 
        }));
      }
      return w || "";
    }
    else {
      return "";
    }
  },
  
  /**********************************
   * Group name getter and formatter
   **********************************/
  
  _cellGetGroup: function(inRowIndex, inItem) {
    if (!this._groupRowIndices) {
      return "";
    }
    
    var found = dojo.indexOf(this._groupRowIndices, inRowIndex);
    if(!inItem || found === -1) {
      return "";
    }
    
    // featureLayers[found] could be undefined when updating the grid: like this:
    //   widget.grid.attr(featureLayers, [ layer1 ]);
    //   widget.update();
    return (this.featureLayers[found] && this.featureLayers[found].name) || "";
  },
  
  _cellGroupFormatter: function(value) {
    if (value) {
      return "<div class='groupLabel'>" + value + "</div>";
    }
    else {
      return "";
    }
  }

});


/***********************
 * Template Picker Item 
 ***********************/

dojo.declare("esri.dijit.editing.TemplatePickerItem", [dijit._Widget, dijit._Templated], {
  templateString: "<div class='item' style='text-align: center;'>" + 
                    "<div class='itemSymbol' dojoAttachPoint='_surfaceNode'></div>" + 
                    "<div class='itemLabel'>${label}</div>" + 
                  "</div>",

  startup: function(){
    if(this._started){
      return;
    }
    this.inherited(arguments);
    
    //try {
      this._surface = this._draw(this._surfaceNode, this.symbol, this.surfaceWidth, this.surfaceHeight, this.template);
    /*}
    catch (e) {
      //console.log(this.id);
      // TODO
      // Need to try catch here for IE.
      // In IE, sometimes createShape crashes because shape.rawNode has no
      // 'path' property yet (slow). This happens when IE is first opened 
      // with a page that has template picker. Everything is fine when the page
      // is refreshed. Instead of crashing, we can try catch here so that
      // atleast the label is displayed for the templates.
      // NOTE: This problem only happens for shapes of type 'path'
      // NOTE: registering 'whenLoaded' function does not solve this problem 
    }*/
  },
  
  _draw: function(node, symbol, sWidth, sHeight, template) {
    if (!symbol) {
      return;
    }
    
    var surface = dojox.gfx.createSurface(node, sWidth, sHeight);
    if (dojo.isIE < 9) {
      // Fixes an issue in IE where the shape is partially drawn and
      // positioned to the right of the table cell  
      var source = surface.getEventSource();
      dojo.style(source, "position", "relative");
      dojo.style(source.parentNode, "position", "relative");
    }
    var shapeDesc = (!this.legendOverride && this._getDrawingToolShape(symbol, template)) || 
                    esri.symbol.getShapeDescriptors(symbol);
    
    var gfxShape;
    try {
      gfxShape = surface.createShape(shapeDesc.defaultShape).setFill(shapeDesc.fill).setStroke(shapeDesc.stroke);
    }
    catch (e) {
      surface.clear();
      surface.destroy();
      return;
    }
    
    var dim = surface.getDimensions();
    var transform = { dx: dim.width/2, dy: dim.height/2 };
    
    var bbox = gfxShape.getBoundingBox(), width = bbox.width, height = bbox.height;
    if (width > sWidth || height > sHeight) {
      var actualSize = width > height ? width : height;
      var refSize = sWidth < sHeight ? sWidth : sHeight;
      var scaleBy = (refSize - 5) / actualSize;
      dojo.mixin(transform, { xx: scaleBy, yy: scaleBy });
    }

    gfxShape.applyTransform(transform);
    return surface;
  },
  
  _getDrawingToolShape : function(symbol, template){
      var shape, drawingTool = template ? template.drawingTool || null : null;
      switch(drawingTool){
        case "esriFeatureEditToolArrow" : 
          shape = { type: "path", path: "M 10,1 L 3,8 L 3,5 L -15,5 L -15,-2 L 3,-2 L 3,-5 L 10,1 E" };
          break;
        case "esriFeatureEditToolLeftArrow" : 
          shape = { type: "path", path: "M -15,1 L -8,8 L -8,5 L 10,5 L 10,-2 L -8,-2 L -8,-5 L -15,1 E" };
          break;
        case "esriFeatureEditToolRightArrow" : 
          shape = { type: "path", path: "M 10,1 L 3,8 L 3,5 L -15,5 L -15,-2 L 3,-2 L 3,-5 L 10,1 E" };
          break;
        case "esriFeatureEditToolUpArrow" : 
          shape = { type: "path", path: "M 1,-10 L 8,-3 L 5,-3 L 5,15 L -2,15 L -2,-3 L -5,-3 L 1,-10 E" };
          break;
        case "esriFeatureEditToolDownArrow" : 
          shape = { type: "path", path: "M 1,15 L 8,8 L 5,8 L 5,-10 L -2,-10 L -2,8 L -5,8 L 1,15 E" };
          break;
        case "esriFeatureEditToolTriangle" :
          shape = { type: "path", path: "M -10,14 L 2,-10 L 14,14 L -10,14 E" };
          break;
        case "esriFeatureEditToolRectangle" :
          shape = { type: "path", path: "M -10,-10 L 10,-10 L 10,10 L -10,10 L -10,-10 E" };
          break;
        case "esriFeatureEditToolCircle" :
          shape = { type: "circle", cx: 0, cy: 0, r: 10 };
          break;
        case "esriFeatureEditToolEllipse" :
          shape = { type: "ellipse", cx: 0, cy: 0, rx: 10, ry: 5 };
          break;
        case "esriFeatureEditToolFreehand" :          
          if (symbol.type === "simplelinesymbol" || symbol.type === "cartographiclinesymbol"){            
            shape = { type: "path", path: "m -11, -7c-1.5,-3.75 7.25,-9.25 12.5,-7c5.25,2.25 6.75,9.75 3.75,12.75c-3,3 -3.25,2.5 -9.75,5.25c-6.5,2.75 -7.25,14.25 2,15.25c9.25,1 11.75,-4 13.25,-6.75c1.5,-2.75 3.5,-11.75 12,-6.5" };
          }
          else {
            shape = { type: "path", path: "M 10,-13 c3.1,0.16667 4.42564,2.09743 2.76923,3.69231c-2.61025,2.87179 -5.61025,5.6718 -6.14358,6.20513c-0.66667,0.93333 -0.46667,1.2 -0.53333,1.93333c-0.00001,0.86666 0.6,1.66667 1.13334,2c1.03077,0.38462 2.8,0.93333 3.38974,1.70769c0.47693,0.42564 0.87693,0.75897 1.41026,1.75897c0.13333,1.06667 -0.46667,2.86667 -1.8,3.8c-0.73333,0.73333 -3.86667,2.66666 -4.86667,3.13333c-0.93333,0.8 -7.4,3.2 -7.6,3.06667c-1.06667,0.46667 -4.73333,1.13334 -5.2,1.26667c-1.6,0.33334 -4.6,0.4 -6.25128,0.05128c-1.41539,-0.18462 -2.34872,-2.31796 -1.41539,-4.45129c0.93333,-1.73333 1.86667,-3.13333 2.64615,-3.85641c1.28718,-1.47692 2.57437,-2.68204 3.88718,-3.54359c0.88718,-1.13845 1.8,-1.33333 2.26666,-2.45641c0.33334,-0.74359 0.37949,-1.7641 0.06667,-2.87692c-0.66666,-1.46666 -1.66666,-1.86666 -2.98975,-2.2c-1.27692,-0.26666 -2.12307,-0.64102 -3.27692,-1.46666c-0.66667,-1.00001 -1.01538,-3.01539 0.73333,-4.06667c1.73333,-1.2 3.6,-1.93333 4.93333,-2.2c1.33333,-0.46667 4.84104,-1.09743 5.84103,-1.23076c1.60001,-0.46667 6.02564,-0.50257 7.29231,-0.56924z" };
          }
          break;
        default: return null;
      }
      return { defaultShape: shape, fill: symbol.getFill(), stroke: symbol.getStroke() };
  },
  
  _repaint: function(shape) {
    // shape: is a surface or a shape
    if (!shape) {
      this._surface = this._draw(this._surfaceNode, this.symbol, this.surfaceWidth, this.surfaceHeight, this.template);
      return;
    }
    
    if(shape.getStroke && shape.setStroke){
      shape.setStroke(shape.getStroke());
    }
    if(shape.getFill && shape.setFill){
      shape.setFill(shape.getFill());
    }
    if(shape.children && dojo.isArray(shape.children)){
      dojo.forEach(shape.children, this._repaint, this);
    }
  },
  
  destroy: function(){
    if(this._surface){
      this._surface.destroy();
      delete this._surface;
      //this._surface = null;
    }
    this.inherited(arguments);
  }
});

});

},
'dojo/dnd/common':function(){
define(["../main"], function(dojo) {
	// module:
	//		dojo/dnd/common
	// summary:
	//		TODOC

dojo.getObject("dnd", true, dojo);

dojo.dnd.getCopyKeyState = dojo.isCopyKey;

dojo.dnd._uniqueId = 0;
dojo.dnd.getUniqueId = function(){
	// summary:
	//		returns a unique string for use with any DOM element
	var id;
	do{
		id = dojo._scopeName + "Unique" + (++dojo.dnd._uniqueId);
	}while(dojo.byId(id));
	return id;
};

dojo.dnd._empty = {};

dojo.dnd.isFormElement = function(/*Event*/ e){
	// summary:
	//		returns true if user clicked on a form element
	var t = e.target;
	if(t.nodeType == 3 /*TEXT_NODE*/){
		t = t.parentNode;
	}
	return " button textarea input select option ".indexOf(" " + t.tagName.toLowerCase() + " ") >= 0;	// Boolean
};

return dojo.dnd;
});

},
'dojox/grid/_Events':function(){
define("dojox/grid/_Events", [
	"dojo/keys",
	"dojo/dom-class",
	"dojo/_base/declare",
	"dojo/_base/event",
	"dojo/_base/sniff"
], function(keys, domClass, declare, event, has){

return declare("dojox.grid._Events", null, {
	// summary:
	//		_Grid mixin that provides default implementations for grid events.
	// description:
	//		Default synthetic events dispatched for _Grid. dojo.connect to events to
	//		retain default implementation or override them for custom handling.
	
	// cellOverClass: String
	// 		css class to apply to grid cells over which the cursor is placed.
	cellOverClass: "dojoxGridCellOver",
	
	onKeyEvent: function(e){
		// summary: top level handler for Key Events
		this.dispatchKeyEvent(e);
	},

	onContentEvent: function(e){
		// summary: Top level handler for Content events
		this.dispatchContentEvent(e);
	},

	onHeaderEvent: function(e){
		// summary: Top level handler for header events
		this.dispatchHeaderEvent(e);
	},

	onStyleRow: function(inRow){
		// summary:
		//		Perform row styling on a given row. Called whenever row styling is updated.
		//
		// inRow: Object
		// 		Object containing row state information: selected, true if the row is selcted; over:
		// 		true of the mouse is over the row; odd: true if the row is odd. Use customClasses and
		// 		customStyles to control row css classes and styles; both properties are strings.
		//
		// example: onStyleRow({ selected: true, over:true, odd:false })
		var i = inRow;
		i.customClasses += (i.odd?" dojoxGridRowOdd":"") + (i.selected?" dojoxGridRowSelected":"") + (i.over?" dojoxGridRowOver":"");
		this.focus.styleRow(inRow);
		this.edit.styleRow(inRow);
	},
	
	onKeyDown: function(e){
		// summary:
		// 		Grid key event handler. By default enter begins editing and applies edits, escape cancels an edit,
		// 		tab, shift-tab, and arrow keys move grid cell focus.
		if(e.altKey || e.metaKey){
			return;
		}
		var colIdx;
		switch(e.keyCode){
			case keys.ESCAPE:
				this.edit.cancel();
				break;
			case keys.ENTER:
				if(!this.edit.isEditing()){
					colIdx = this.focus.getHeaderIndex();
					if(colIdx >= 0) {
						this.setSortIndex(colIdx);
						break;
					}else {
						this.selection.clickSelect(this.focus.rowIndex, dojo.isCopyKey(e), e.shiftKey);
					}
					event.stop(e);
				}
				if(!e.shiftKey){
					var isEditing = this.edit.isEditing();
					this.edit.apply();
					if(!isEditing){
						this.edit.setEditCell(this.focus.cell, this.focus.rowIndex);
					}
				}
				if (!this.edit.isEditing()){
					var curView = this.focus.focusView || this.views.views[0];  //if no focusView than only one view
					curView.content.decorateEvent(e);
					this.onRowClick(e);
					event.stop(e);
				}
				break;
			case keys.SPACE:
				if(!this.edit.isEditing()){
					colIdx = this.focus.getHeaderIndex();
					if(colIdx >= 0) {
						this.setSortIndex(colIdx);
						break;
					}else {
						this.selection.clickSelect(this.focus.rowIndex, dojo.isCopyKey(e), e.shiftKey);
					}
					event.stop(e);
				}
				break;
			case keys.TAB:
				this.focus[e.shiftKey ? 'previousKey' : 'nextKey'](e);
				break;
			case keys.LEFT_ARROW:
			case keys.RIGHT_ARROW:
				if(!this.edit.isEditing()){
					var keyCode = e.keyCode;  // IE seems to lose after stopEvent when modifier keys
					event.stop(e);
					colIdx = this.focus.getHeaderIndex();
					if (colIdx >= 0 && (e.shiftKey && e.ctrlKey)){
						this.focus.colSizeAdjust(e, colIdx, (keyCode == keys.LEFT_ARROW ? -1 : 1)*5);
					}
					else{
						var offset = (keyCode == keys.LEFT_ARROW) ? 1 : -1;
						if(this.isLeftToRight()){ offset *= -1; }
						this.focus.move(0, offset);
					}
				}
				break;
			case keys.UP_ARROW:
				if(!this.edit.isEditing() && this.focus.rowIndex !== 0){
					event.stop(e);
					this.focus.move(-1, 0);
				}
				break;
			case keys.DOWN_ARROW:
				if(!this.edit.isEditing() && this.focus.rowIndex+1 != this.rowCount){
					event.stop(e);
					this.focus.move(1, 0);
				}
				break;
			case keys.PAGE_UP:
				if(!this.edit.isEditing() && this.focus.rowIndex !== 0){
					event.stop(e);
					if(this.focus.rowIndex != this.scroller.firstVisibleRow+1){
						this.focus.move(this.scroller.firstVisibleRow-this.focus.rowIndex, 0);
					}else{
						this.setScrollTop(this.scroller.findScrollTop(this.focus.rowIndex-1));
						this.focus.move(this.scroller.firstVisibleRow-this.scroller.lastVisibleRow+1, 0);
					}
				}
				break;
			case keys.PAGE_DOWN:
				if(!this.edit.isEditing() && this.focus.rowIndex+1 != this.rowCount){
					event.stop(e);
					if(this.focus.rowIndex != this.scroller.lastVisibleRow-1){
						this.focus.move(this.scroller.lastVisibleRow-this.focus.rowIndex-1, 0);
					}else{
						this.setScrollTop(this.scroller.findScrollTop(this.focus.rowIndex+1));
						this.focus.move(this.scroller.lastVisibleRow-this.scroller.firstVisibleRow-1, 0);
					}
				}
				break;
			default:
				break;
		}
	},
	
	onMouseOver: function(e){
		// summary:
		//		Event fired when mouse is over the grid.
		// e: Event
		//		Decorated event object contains reference to grid, cell, and rowIndex
		e.rowIndex == -1 ? this.onHeaderCellMouseOver(e) : this.onCellMouseOver(e);
	},
	
	onMouseOut: function(e){
		// summary:
		//		Event fired when mouse moves out of the grid.
		// e: Event
		//		Decorated event object that contains reference to grid, cell, and rowIndex
		e.rowIndex == -1 ? this.onHeaderCellMouseOut(e) : this.onCellMouseOut(e);
	},
	
	onMouseDown: function(e){
		// summary:
		//		Event fired when mouse is down inside grid.
		// e: Event
		//		Decorated event object that contains reference to grid, cell, and rowIndex
		e.rowIndex == -1 ? this.onHeaderCellMouseDown(e) : this.onCellMouseDown(e);
	},
	
	onMouseOverRow: function(e){
		// summary:
		//		Event fired when mouse is over any row (data or header).
		// e: Event
		//		Decorated event object contains reference to grid, cell, and rowIndex
		if(!this.rows.isOver(e.rowIndex)){
			this.rows.setOverRow(e.rowIndex);
			e.rowIndex == -1 ? this.onHeaderMouseOver(e) : this.onRowMouseOver(e);
		}
	},
	onMouseOutRow: function(e){
		// summary:
		//		Event fired when mouse moves out of any row (data or header).
		// e: Event
		//		Decorated event object contains reference to grid, cell, and rowIndex
		if(this.rows.isOver(-1)){
			this.onHeaderMouseOut(e);
		}else if(!this.rows.isOver(-2)){
			this.rows.setOverRow(-2);
			this.onRowMouseOut(e);
		}
	},
	
	onMouseDownRow: function(e){
		// summary:
		//		Event fired when mouse is down inside grid row
		// e: Event
		//		Decorated event object that contains reference to grid, cell, and rowIndex
		if(e.rowIndex != -1)
			this.onRowMouseDown(e);
	},

	// cell events
	onCellMouseOver: function(e){
		// summary:
		//		Event fired when mouse is over a cell.
		// e: Event
		//		Decorated event object contains reference to grid, cell, and rowIndex
		if(e.cellNode){
			domClass.add(e.cellNode, this.cellOverClass);
		}
	},
	
	onCellMouseOut: function(e){
		// summary:
		//		Event fired when mouse moves out of a cell.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
		if(e.cellNode){
			domClass.remove(e.cellNode, this.cellOverClass);
		}
	},
	
	onCellMouseDown: function(e){
		// summary:
		//		Event fired when mouse is down in a header cell.
		// e: Event
		// 		Decorated event object which contains reference to grid, cell, and rowIndex
	},

	onCellClick: function(e){
		// summary:
		//		Event fired when a cell is clicked.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
		this._click[0] = this._click[1];
		this._click[1] = e;
		if(!this.edit.isEditCell(e.rowIndex, e.cellIndex)){
			this.focus.setFocusCell(e.cell, e.rowIndex);
		}
		// in some cases click[0] is null which causes false doubeClicks. Fixes #100703
		if(this._click.length > 1 && this._click[0] == null){
			this._click.shift();
		}
		this.onRowClick(e);
	},

	onCellDblClick: function(e){
		// summary:
		//		Event fired when a cell is double-clicked.
		// e: Event
		//		Decorated event object contains reference to grid, cell, and rowIndex
		var event;
		if(this._click.length > 1 && has("ie")){
			event = this._click[1];
		}else if(this._click.length > 1 && this._click[0].rowIndex != this._click[1].rowIndex){
			event = this._click[0];
		}else{
			event = e;
		}
		this.focus.setFocusCell(event.cell, event.rowIndex);
		this.onRowClick(event);
		this.edit.setEditCell(event.cell, event.rowIndex);
		this.onRowDblClick(e);
	},

	onCellContextMenu: function(e){
		// summary:
		//		Event fired when a cell context menu is accessed via mouse right click.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
		this.onRowContextMenu(e);
	},

	onCellFocus: function(inCell, inRowIndex){
		// summary:
		//		Event fired when a cell receives focus.
		// inCell: Object
		//		Cell object containing properties of the grid column.
		// inRowIndex: Integer
		//		Index of the grid row
		this.edit.cellFocus(inCell, inRowIndex);
	},

	// row events
	onRowClick: function(e){
		// summary:
		//		Event fired when a row is clicked.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
		this.edit.rowClick(e);
		this.selection.clickSelectEvent(e);
	},

	onRowDblClick: function(e){
		// summary:
		//		Event fired when a row is double clicked.
		// e: Event
		//		decorated event object which contains reference to grid, cell, and rowIndex
	},

	onRowMouseOver: function(e){
		// summary:
		//		Event fired when mouse moves over a data row.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
	},

	onRowMouseOut: function(e){
		// summary:
		//		Event fired when mouse moves out of a data row.
		// e: Event
		// 		Decorated event object contains reference to grid, cell, and rowIndex
	},
	
	onRowMouseDown: function(e){
		// summary:
		//		Event fired when mouse is down in a row.
		// e: Event
		// 		Decorated event object which contains reference to grid, cell, and rowIndex
	},

	onRowContextMenu: function(e){
		// summary:
		//		Event fired when a row context menu is accessed via mouse right click.
		// e: Event
		// 		Decorated event object which contains reference to grid, cell, and rowIndex
		event.stop(e);
	},

	// header events
	onHeaderMouseOver: function(e){
		// summary:
		//		Event fired when mouse moves over the grid header.
		// e: Event
		// 		Decorated event object contains reference to grid, cell, and rowIndex
	},

	onHeaderMouseOut: function(e){
		// summary:
		//		Event fired when mouse moves out of the grid header.
		// e: Event
		// 		Decorated event object which contains reference to grid, cell, and rowIndex
	},

	onHeaderCellMouseOver: function(e){
		// summary:
		//		Event fired when mouse moves over a header cell.
		// e: Event
		// 		Decorated event object which contains reference to grid, cell, and rowIndex
		if(e.cellNode){
			domClass.add(e.cellNode, this.cellOverClass);
		}
	},

	onHeaderCellMouseOut: function(e){
		// summary:
		//		Event fired when mouse moves out of a header cell.
		// e: Event
		// 		Decorated event object which contains reference to grid, cell, and rowIndex
		if(e.cellNode){
			domClass.remove(e.cellNode, this.cellOverClass);
		}
	},
	
	onHeaderCellMouseDown: function(e) {
		// summary:
		//		Event fired when mouse is down in a header cell.
		// e: Event
		// 		Decorated event object which contains reference to grid, cell, and rowIndex
	},

	onHeaderClick: function(e){
		// summary:
		//		Event fired when the grid header is clicked.
		// e: Event
		// Decorated event object which contains reference to grid, cell, and rowIndex
	},

	onHeaderCellClick: function(e){
		// summary:
		//		Event fired when a header cell is clicked.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
		this.setSortIndex(e.cell.index);
		this.onHeaderClick(e);
	},

	onHeaderDblClick: function(e){
		// summary:
		//		Event fired when the grid header is double clicked.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
	},

	onHeaderCellDblClick: function(e){
		// summary:
		//		Event fired when a header cell is double clicked.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
		this.onHeaderDblClick(e);
	},

	onHeaderCellContextMenu: function(e){
		// summary:
		//		Event fired when a header cell context menu is accessed via mouse right click.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
		this.onHeaderContextMenu(e);
	},

	onHeaderContextMenu: function(e){
		// summary:
		//		Event fired when the grid header context menu is accessed via mouse right click.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
		if(!this.headerMenu){
			event.stop(e);
		}
	},

	// editing
	onStartEdit: function(inCell, inRowIndex){
		// summary:
		//		Event fired when editing is started for a given grid cell
		// inCell: Object
		//		Cell object containing properties of the grid column.
		// inRowIndex: Integer
		//		Index of the grid row
	},

	onApplyCellEdit: function(inValue, inRowIndex, inFieldIndex){
		// summary:
		//		Event fired when editing is applied for a given grid cell
		// inValue: String
		//		Value from cell editor
		// inRowIndex: Integer
		//		Index of the grid row
		// inFieldIndex: Integer
		//		Index in the grid's data store
	},

	onCancelEdit: function(inRowIndex){
		// summary:
		//		Event fired when editing is cancelled for a given grid cell
		// inRowIndex: Integer
		//		Index of the grid row
	},

	onApplyEdit: function(inRowIndex){
		// summary:
		//		Event fired when editing is applied for a given grid row
		// inRowIndex: Integer
		//		Index of the grid row
	},

	onCanSelect: function(inRowIndex){
		// summary:
		//		Event to determine if a grid row may be selected
		// inRowIndex: Integer
		//		Index of the grid row
		// returns: Boolean
		//		true if the row can be selected
		return true;
	},

	onCanDeselect: function(inRowIndex){
		// summary:
		//		Event to determine if a grid row may be deselected
		// inRowIndex: Integer
		//		Index of the grid row
		// returns: Boolean
		//		true if the row can be deselected
		return true;
	},

	onSelected: function(inRowIndex){
		// summary:
		//		Event fired when a grid row is selected
		// inRowIndex: Integer
		//		Index of the grid row
		this.updateRowStyles(inRowIndex);
	},

	onDeselected: function(inRowIndex){
		// summary:
		//		Event fired when a grid row is deselected
		// inRowIndex: Integer
		//		Index of the grid row
		this.updateRowStyles(inRowIndex);
	},

	onSelectionChanged: function(){
	}
});
});
},
'dijit/CheckedMenuItem':function(){
require({cache:{
'url:dijit/templates/CheckedMenuItem.html':"<tr class=\"dijitReset dijitMenuItem\" data-dojo-attach-point=\"focusNode\" role=\"menuitemcheckbox\" tabIndex=\"-1\"\r\n\t\tdata-dojo-attach-event=\"onmouseenter:_onHover,onmouseleave:_onUnhover,ondijitclick:_onClick\">\r\n\t<td class=\"dijitReset dijitMenuItemIconCell\" role=\"presentation\">\r\n\t\t<img src=\"${_blankGif}\" alt=\"\" class=\"dijitMenuItemIcon dijitCheckedMenuItemIcon\" data-dojo-attach-point=\"iconNode\"/>\r\n\t\t<span class=\"dijitCheckedMenuItemIconChar\">&#10003;</span>\r\n\t</td>\r\n\t<td class=\"dijitReset dijitMenuItemLabel\" colspan=\"2\" data-dojo-attach-point=\"containerNode,labelNode\"></td>\r\n\t<td class=\"dijitReset dijitMenuItemAccelKey\" style=\"display: none\" data-dojo-attach-point=\"accelKeyNode\"></td>\r\n\t<td class=\"dijitReset dijitMenuArrowCell\" role=\"presentation\">&#160;</td>\r\n</tr>\r\n"}});
define("dijit/CheckedMenuItem", [
	"dojo/_base/declare", // declare
	"dojo/dom-class", // domClass.toggle
	"./MenuItem",
	"dojo/text!./templates/CheckedMenuItem.html",
	"./hccss"
], function(declare, domClass, MenuItem, template){

/*=====
	var MenuItem = dijit.MenuItem;
=====*/

	// module:
	//		dijit/CheckedMenuItem
	// summary:
	//		A checkbox-like menu item for toggling on and off

	return declare("dijit.CheckedMenuItem", MenuItem, {
		// summary:
		//		A checkbox-like menu item for toggling on and off

		templateString: template,

		// checked: Boolean
		//		Our checked state
		checked: false,
		_setCheckedAttr: function(/*Boolean*/ checked){
			// summary:
			//		Hook so attr('checked', bool) works.
			//		Sets the class and state for the check box.
			domClass.toggle(this.domNode, "dijitCheckedMenuItemChecked", checked);
			this.domNode.setAttribute("aria-checked", checked);
			this._set("checked", checked);
		},

		iconClass: "",	// override dijitNoIcon

		onChange: function(/*Boolean*/ /*===== checked =====*/){
			// summary:
			//		User defined function to handle check/uncheck events
			// tags:
			//		callback
		},

		_onClick: function(/*Event*/ e){
			// summary:
			//		Clicking this item just toggles its state
			// tags:
			//		private
			if(!this.disabled){
				this.set("checked", !this.checked);
				this.onChange(this.checked);
			}
			this.inherited(arguments);
		}
	});
});

},
'dojo/io/iframe':function(){
define(["../main", "require"], function(dojo, require) {
	// module:
	//		dojo/io/iframe
	// summary:
	//		TODOC

dojo.getObject("io", true, dojo);

/*=====
dojo.declare("dojo.io.iframe.__ioArgs", dojo.__IoArgs, {
	constructor: function(){
		//	summary:
		//		All the properties described in the dojo.__ioArgs type, apply
		//		to this type. The following additional properties are allowed
		//		for dojo.io.iframe.send():
		//	method: String?
		//		The HTTP method to use. "GET" or "POST" are the only supported
		//		values.  It will try to read the value from the form node's
		//		method, then try this argument. If neither one exists, then it
		//		defaults to POST.
		//	handleAs: String?
		//		Specifies what format the result data should be given to the
		//		load/handle callback. Valid values are: text, html, xml, json,
		//		javascript. IMPORTANT: For all values EXCEPT html and xml, The
		//		server response should be an HTML file with a textarea element.
		//		The response data should be inside the textarea element. Using an
		//		HTML document the only reliable, cross-browser way this
		//		transport can know when the response has loaded. For the html
		//		handleAs value, just return a normal HTML document.  NOTE: xml
		//		is now supported with this transport (as of 1.1+); a known issue
		//		is if the XML document in question is malformed, Internet Explorer
		//		will throw an uncatchable error.
		//	content: Object?
		//		If "form" is one of the other args properties, then the content
		//		object properties become hidden form form elements. For
		//		instance, a content object of {name1 : "value1"} is converted
		//		to a hidden form element with a name of "name1" and a value of
		//		"value1". If there is not a "form" property, then the content
		//		object is converted into a name=value&name=value string, by
		//		using dojo.objectToQuery().
		this.method = method;
		this.handleAs = handleAs;
		this.content = content;
	}
});
=====*/

dojo.io.iframe = {
	// summary:
	//		Sends an Ajax I/O call using and Iframe (for instance, to upload files)

	create: function(/*String*/fname, /*String*/onloadstr, /*String?*/uri){
		//	summary:
		//		Creates a hidden iframe in the page. Used mostly for IO
		//		transports.  You do not need to call this to start a
		//		dojo.io.iframe request. Just call send().
		//	fname: String
		//		The name of the iframe. Used for the name attribute on the
		//		iframe.
		//	onloadstr: String
		//		A string of JavaScript that will be executed when the content
		//		in the iframe loads.
		//	uri: String
		//		The value of the src attribute on the iframe element. If a
		//		value is not given, then dojo/resources/blank.html will be
		//		used.
		if(window[fname]){ return window[fname]; }
		if(window.frames[fname]){ return window.frames[fname]; }
		var turi = uri;
		if(!turi){
			if(dojo.config["useXDomain"] && !dojo.config["dojoBlankHtmlUrl"]){
				console.warn("dojo.io.iframe.create: When using cross-domain Dojo builds,"
					+ " please save dojo/resources/blank.html to your domain and set djConfig.dojoBlankHtmlUrl"
					+ " to the path on your domain to blank.html");
			}
			turi = (dojo.config["dojoBlankHtmlUrl"]||require.toUrl("../resources/blank.html"));
		}
		var cframe = dojo.place(
			'<iframe id="'+fname+'" name="'+fname+'" src="'+turi+'" onload="'+onloadstr+
			'" style="position: absolute; left: 1px; top: 1px; height: 1px; width: 1px; visibility: hidden">',
		dojo.body());

		window[fname] = cframe;

		return cframe;
	},

	setSrc: function(/*DOMNode*/iframe, /*String*/src, /*Boolean*/replace){
		//summary:
		//		Sets the URL that is loaded in an IFrame. The replace parameter
		//		indicates whether location.replace() should be used when
		//		changing the location of the iframe.
		try{
			if(!replace){
				if(dojo.isWebKit){
					iframe.location = src;
				}else{
					frames[iframe.name].location = src;
				}
			}else{
				// Fun with DOM 0 incompatibilities!
				var idoc;
				if(dojo.isIE || dojo.isWebKit){
					idoc = iframe.contentWindow.document;
				}else{ //  if(d.isMozilla){
					idoc = iframe.contentWindow;
				}

				//For Safari (at least 2.0.3) and Opera, if the iframe
				//has just been created but it doesn't have content
				//yet, then iframe.document may be null. In that case,
				//use iframe.location and return.
				if(!idoc){
					iframe.location = src;
				}else{
					idoc.location.replace(src);
				}
			}
		}catch(e){
			console.log("dojo.io.iframe.setSrc: ", e);
		}
	},

	doc: function(/*DOMNode*/iframeNode){
		//summary: Returns the document object associated with the iframe DOM Node argument.
		return iframeNode.contentDocument || // W3
			(
				(
					(iframeNode.name) && (iframeNode.document) &&
					(dojo.doc.getElementsByTagName("iframe")[iframeNode.name].contentWindow) &&
					(dojo.doc.getElementsByTagName("iframe")[iframeNode.name].contentWindow.document)
				)
			) ||  // IE
			(
				(iframeNode.name)&&(dojo.doc.frames[iframeNode.name])&&
				(dojo.doc.frames[iframeNode.name].document)
			) || null;
	},

	send: function(/*dojo.io.iframe.__ioArgs*/args){
		//summary:
		//		Function that sends the request to the server.
		//		This transport can only process one send() request at a time, so if send() is called
		//multiple times, it will queue up the calls and only process one at a time.
		if(!this["_frame"]){
			this._frame = this.create(this._iframeName, dojo._scopeName + ".io.iframe._iframeOnload();");
		}

		//Set up the deferred.
		var dfd = dojo._ioSetArgs(
			args,
			function(/*Deferred*/dfd){
				//summary: canceller function for dojo._ioSetArgs call.
				dfd.canceled = true;
				dfd.ioArgs._callNext();
			},
			function(/*Deferred*/dfd){
				//summary: okHandler function for dojo._ioSetArgs call.
				var value = null;
				try{
					var ioArgs = dfd.ioArgs;
					var dii = dojo.io.iframe;
					var ifd = dii.doc(dii._frame);
					var handleAs = ioArgs.handleAs;

					//Assign correct value based on handleAs value.
					value = ifd; //html
					if(handleAs != "html"){
						if(handleAs == "xml"){
							//	FF, Saf 3+ and Opera all seem to be fine with ifd being xml.  We have to
							//	do it manually for IE6-8.  Refs #6334.
							if(dojo.isIE < 9 || (dojo.isIE && dojo.isQuirks)){
								dojo.query("a", dii._frame.contentWindow.document.documentElement).orphan();
								var xmlText=(dii._frame.contentWindow.document).documentElement.innerText;
								xmlText=xmlText.replace(/>\s+</g, "><");
								xmlText=dojo.trim(xmlText);
								//Reusing some code in base dojo for handling XML content.  Simpler and keeps
								//Core from duplicating the effort needed to locate the XML Parser on IE.
								var fauxXhr = { responseText: xmlText };
								value = dojo._contentHandlers["xml"](fauxXhr); // DOMDocument
							}
						}else{
							value = ifd.getElementsByTagName("textarea")[0].value; //text
							if(handleAs == "json"){
								value = dojo.fromJson(value); //json
							}else if(handleAs == "javascript"){
								value = dojo.eval(value); //javascript
							}
						}
					}
				}catch(e){
					value = e;
				}finally{
					ioArgs._callNext();
				}
				return value;
			},
			function(/*Error*/error, /*Deferred*/dfd){
				//summary: errHandler function for dojo._ioSetArgs call.
				dfd.ioArgs._hasError = true;
				dfd.ioArgs._callNext();
				return error;
			}
		);

		//Set up a function that will fire the next iframe request. Make sure it only
		//happens once per deferred.
		dfd.ioArgs._callNext = function(){
			if(!this["_calledNext"]){
				this._calledNext = true;
				dojo.io.iframe._currentDfd = null;
				dojo.io.iframe._fireNextRequest();
			}
		};

		this._dfdQueue.push(dfd);
		this._fireNextRequest();

		//Add it the IO watch queue, to get things like timeout support.
		dojo._ioWatch(
			dfd,
			function(/*Deferred*/dfd){
				//validCheck
				return !dfd.ioArgs["_hasError"];
			},
			function(dfd){
				//ioCheck
				return (!!dfd.ioArgs["_finished"]);
			},
			function(dfd){
				//resHandle
				if(dfd.ioArgs._finished){
					dfd.callback(dfd);
				}else{
					dfd.errback(new Error("Invalid dojo.io.iframe request state"));
				}
			}
		);

		return dfd;
	},

	_currentDfd: null,
	_dfdQueue: [],
	_iframeName: dojo._scopeName + "IoIframe",

	_fireNextRequest: function(){
		//summary: Internal method used to fire the next request in the bind queue.
		try{
			if((this._currentDfd)||(this._dfdQueue.length == 0)){ return; }
			//Find next deferred, skip the canceled ones.
			do{
				var dfd = this._currentDfd = this._dfdQueue.shift();
			} while(dfd && dfd.canceled && this._dfdQueue.length);

			//If no more dfds, cancel.
			if(!dfd || dfd.canceled){
				this._currentDfd =  null;
				return;
			}

			var ioArgs = dfd.ioArgs;
			var args = ioArgs.args;

			ioArgs._contentToClean = [];
			var fn = dojo.byId(args["form"]);
			var content = args["content"] || {};
			if(fn){
				if(content){
					// if we have things in content, we need to add them to the form
					// before submission
					var pHandler = function(name, value) {
						dojo.create("input", {type: "hidden", name: name, value: value}, fn);
						ioArgs._contentToClean.push(name);
					};
					for(var x in content){
						var val = content[x];
						if(dojo.isArray(val) && val.length > 1){
							var i;
							for (i = 0; i < val.length; i++) {
								pHandler(x,val[i]);
							}
						}else{
							if(!fn[x]){
								pHandler(x,val);
							}else{
								fn[x].value = val;
							}
						}
					}
				}
				//IE requires going through getAttributeNode instead of just getAttribute in some form cases,
				//so use it for all.  See #2844
				var actnNode = fn.getAttributeNode("action");
				var mthdNode = fn.getAttributeNode("method");
				var trgtNode = fn.getAttributeNode("target");
				if(args["url"]){
					ioArgs._originalAction = actnNode ? actnNode.value : null;
					if(actnNode){
						actnNode.value = args.url;
					}else{
						fn.setAttribute("action",args.url);
					}
				}
				if(!mthdNode || !mthdNode.value){
					if(mthdNode){
						mthdNode.value= (args["method"]) ? args["method"] : "post";
					}else{
						fn.setAttribute("method", (args["method"]) ? args["method"] : "post");
					}
				}
				ioArgs._originalTarget = trgtNode ? trgtNode.value: null;
				if(trgtNode){
					trgtNode.value = this._iframeName;
				}else{
					fn.setAttribute("target", this._iframeName);
				}
				fn.target = this._iframeName;
				dojo._ioNotifyStart(dfd);
				fn.submit();
			}else{
				// otherwise we post a GET string by changing URL location for the
				// iframe
				var tmpUrl = args.url + (args.url.indexOf("?") > -1 ? "&" : "?") + ioArgs.query;
				dojo._ioNotifyStart(dfd);
				this.setSrc(this._frame, tmpUrl, true);
			}
		}catch(e){
			dfd.errback(e);
		}
	},

	_iframeOnload: function(){
		var dfd = this._currentDfd;
		if(!dfd){
			this._fireNextRequest();
			return;
		}

		var ioArgs = dfd.ioArgs;
		var args = ioArgs.args;
		var fNode = dojo.byId(args.form);

		if(fNode){
			// remove all the hidden content inputs
			var toClean = ioArgs._contentToClean;
			for(var i = 0; i < toClean.length; i++) {
				var key = toClean[i];
				//Need to cycle over all nodes since we may have added
				//an array value which means that more than one node could
				//have the same .name value.
				for(var j = 0; j < fNode.childNodes.length; j++){
					var chNode = fNode.childNodes[j];
					if(chNode.name == key){
						dojo.destroy(chNode);
						break;
					}
				}
			}

			// restore original action + target
			if(ioArgs["_originalAction"]){
				fNode.setAttribute("action", ioArgs._originalAction);
			}
			if(ioArgs["_originalTarget"]){
				fNode.setAttribute("target", ioArgs._originalTarget);
				fNode.target = ioArgs._originalTarget;
			}
		}

		ioArgs._finished = true;
	}
};

return dojo.io.iframe;
});

},
'dojox/gfx/Mover':function(){
define("dojox/gfx/Mover", ["dojo/_base/lang","dojo/_base/array", "dojo/_base/declare", "dojo/_base/connect", "dojo/_base/event"], 
  function(lang,arr,declare,connect,evt){
	return declare("dojox.gfx.Mover", null, {
		constructor: function(shape, e, host){
			// summary: an object, which makes a shape follow the mouse,
			//	used as a default mover, and as a base class for custom movers
			// shape: dojox.gfx.Shape: a shape object to be moved
			// e: Event: a mouse event, which started the move;
			//	only clientX and clientY properties are used
			// host: Object?: object which implements the functionality of the move,
			//	 and defines proper events (onMoveStart and onMoveStop)
			this.shape = shape;
			this.lastX = e.clientX;
			this.lastY = e.clientY;
      var h = this.host = host, d = document;
			this.events = [
        connect.connect(d, "onmousemove", this, "onFirstMove"),
        connect.connect(d, "ontouchmove", this, "onFirstMove"),

			  connect.connect(d, "onmousemove", this, "onMouseMove"),
        connect.connect(d, "ontouchmove", this, "onMouseMove"),
      
			  connect.connect(d, "onmouseup",   this, "destroy"),
        connect.connect(d, "ontouchend",   this, "destroy"),
      
				// cancel text selection and text dragging
			  connect.connect(d, "ondragstart",   evt, "stop"),
        connect.connect(d, "onselectstart", evt, "stop")
			];
			// notify that the move has started
			if(h && h.onMoveStart){
				h.onMoveStart(this);
			}
		},
		// mouse event processors
		onMouseMove: function(e){
			// summary: event processor for onmousemove
			// e: Event: mouse event
      var pos = e.touches ? e.touches[0] : e;
			var x = pos.clientX;
			var y = pos.clientY;
			this.host.onMove(this, {dx: x - this.lastX, dy: y - this.lastY});
			this.lastX = x;
			this.lastY = y;
			evt.stop(e);
		},
		// utilities
		onFirstMove: function(){
			// summary: it is meant to be called only once
			this.host.onFirstMove(this);
			connect.disconnect(this.events.shift());
      connect.disconnect(this.events.shift());
		},
		destroy: function(){
			// summary: stops the move, deletes all references, so the object can be garbage-collected
			arr.forEach(this.events, connect.disconnect);
			// undo global settings
			var h = this.host;
			if(h && h.onMoveStop){
				h.onMoveStop(this);
			}
			// destroy objects
			this.events = this.shape = null;
		}
	});
});

},
'dojox/grid/util':function(){
define("dojox/grid/util", [
	"../main",
	"dojo/_base/lang",
	"dojo/dom"
], function(dojox, lang, dom){

// summary: grid utility library
	var dgu = lang.getObject("grid.util", true, dojox);

	dgu.na = '...';
	dgu.rowIndexTag = "gridRowIndex";
	dgu.gridViewTag = "gridView";


	dgu.fire = function(ob, ev, args){
		var fn = ob && ev && ob[ev];
		return fn && (args ? fn.apply(ob, args) : ob[ev]());
	};
	
	dgu.setStyleHeightPx = function(inElement, inHeight){
		if(inHeight >= 0){
			var s = inElement.style;
			var v = inHeight + 'px';
			if(inElement && s['height'] != v){
				s['height'] = v;
			}
		}
	};
	
	dgu.mouseEvents = [ 'mouseover', 'mouseout', /*'mousemove',*/ 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu' ];

	dgu.keyEvents = [ 'keyup', 'keydown', 'keypress' ];

	dgu.funnelEvents = function(inNode, inObject, inMethod, inEvents){
		var evts = (inEvents ? inEvents : dgu.mouseEvents.concat(dgu.keyEvents));
		for (var i=0, l=evts.length; i<l; i++){
			inObject.connect(inNode, 'on' + evts[i], inMethod);
		}
	};

	dgu.removeNode = function(inNode){
		inNode = dom.byId(inNode);
		inNode && inNode.parentNode && inNode.parentNode.removeChild(inNode);
		return inNode;
	};
	
	dgu.arrayCompare = function(inA, inB){
		for(var i=0,l=inA.length; i<l; i++){
			if(inA[i] != inB[i]){return false;}
		}
		return (inA.length == inB.length);
	};
	
	dgu.arrayInsert = function(inArray, inIndex, inValue){
		if(inArray.length <= inIndex){
			inArray[inIndex] = inValue;
		}else{
			inArray.splice(inIndex, 0, inValue);
		}
	};
	
	dgu.arrayRemove = function(inArray, inIndex){
		inArray.splice(inIndex, 1);
	};
	
	dgu.arraySwap = function(inArray, inI, inJ){
		var cache = inArray[inI];
		inArray[inI] = inArray[inJ];
		inArray[inJ] = cache;
	};

	return dojox.grid.util;

});
},
'dojox/grid/cells/_base':function(){
define("dojox/grid/cells/_base", [
	"dojo/_base/kernel",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/event",
	"dojo/_base/connect",
	"dojo/_base/array",
	"dojo/_base/sniff",
	"dojo/dom",
	"dojo/dom-attr",
	"dojo/dom-construct",
	"dijit/_Widget",
	"../util"
], function(dojo, declare, lang, event, connect, array, has, dom, domAttr, domConstruct, _Widget, util){

	var _DeferredTextWidget = declare("dojox.grid._DeferredTextWidget", _Widget, {
		deferred: null,
		_destroyOnRemove: true,
		postCreate: function(){
			if(this.deferred){
				this.deferred.addBoth(lang.hitch(this, function(text){
					if(this.domNode){
						this.domNode.innerHTML = text;
					}
				}));
			}
		}
	});

	var focusSelectNode = function(inNode){
		try{
			util.fire(inNode, "focus");
			util.fire(inNode, "select");
		}catch(e){// IE sux bad
		}
	};
	
	var whenIdle = function(/*inContext, inMethod, args ...*/){
		setTimeout(lang.hitch.apply(dojo, arguments), 0);
	};

	var BaseCell = declare("dojox.grid.cells._Base", null, {
		// summary:
		//	Respresents a grid cell and contains information about column options and methods
		//	for retrieving cell related information.
		//	Each column in a grid layout has a cell object and most events and many methods
		//	provide access to these objects.
		styles: '',
		classes: '',
		editable: false,
		alwaysEditing: false,
		formatter: null,
		defaultValue: '...',
		value: null,
		hidden: false,
		noresize: false,
		draggable: true,
		//private
		_valueProp: "value",
		_formatPending: false,

		constructor: function(inProps){
			this._props = inProps || {};
			lang.mixin(this, inProps);
			if(this.draggable === undefined){
				this.draggable = true;
			}
		},

		_defaultFormat: function(inValue, callArgs){
			var s = this.grid.formatterScope || this;
			var f = this.formatter;
			if(f && s && typeof f == "string"){
				f = this.formatter = s[f];
			}
			var v = (inValue != this.defaultValue && f) ? f.apply(s, callArgs) : inValue;
			if(typeof v == "undefined"){
				return this.defaultValue;
			}
			if(v && v.addBoth){
				// Check if it's a deferred
				v = new _DeferredTextWidget({deferred: v},
									domConstruct.create("span", {innerHTML: this.defaultValue}));
			}
			if(v && v.declaredClass && v.startup){
				return "<div class='dojoxGridStubNode' linkWidget='" +
						v.id +
						"' cellIdx='" +
						this.index +
						"'>" +
						this.defaultValue +
						"</div>";
			}
			return v;
		},
		
		// data source
		format: function(inRowIndex, inItem){
			// summary:
			//	provides the html for a given grid cell.
			// inRowIndex: int
			// grid row index
			// returns: html for a given grid cell
			var f, i=this.grid.edit.info, d=this.get ? this.get(inRowIndex, inItem) : (this.value || this.defaultValue);
      // The first regex below is modified to avoid "double-escaping" 
      // i.e., replacing an ampersand that is part of &lt; or any 
      // such HTML entities
      // Ref: https://support.sitepen.com/issues/20980
      // The max number 8 is based on the assumption that entities are
      // typically no longer than 8 characters not including the ampersand
      // prefix
			d = (d && d.replace && this.grid.escapeHTMLInData) ? d.replace(/&(?![a-z0-9]{1,8}\;)/ig, '&amp;').replace(/</g, '&lt;') : d;
			if(this.editable && (this.alwaysEditing || (i.rowIndex==inRowIndex && i.cell==this))){
				return this.formatEditing(d, inRowIndex);
			}else{
				return this._defaultFormat(d, [d, inRowIndex, this]);
			}
		},
		formatEditing: function(inDatum, inRowIndex){
			// summary:
			//	formats the cell for editing
			// inDatum: anything
			//	cell data to edit
			// inRowIndex: int
			//	grid row index
			// returns: string of html to place in grid cell
		},
		// utility
		getNode: function(inRowIndex){
			// summary:
			//	gets the dom node for a given grid cell.
			// inRowIndex: int
			// grid row index
			// returns: dom node for a given grid cell
			return this.view.getCellNode(inRowIndex, this.index);
		},
		getHeaderNode: function(){
			return this.view.getHeaderCellNode(this.index);
		},
		getEditNode: function(inRowIndex){
			return (this.getNode(inRowIndex) || 0).firstChild || 0;
		},
		canResize: function(){
			var uw = this.unitWidth;
			return uw && (uw!=='auto');
		},
		isFlex: function(){
			var uw = this.unitWidth;
			return uw && lang.isString(uw) && (uw=='auto' || uw.slice(-1)=='%');
		},
		// edit support
		applyEdit: function(inValue, inRowIndex){
			this.grid.edit.applyCellEdit(inValue, this, inRowIndex);
		},
		cancelEdit: function(inRowIndex){
			this.grid.doCancelEdit(inRowIndex);
		},
		_onEditBlur: function(inRowIndex){
			if(this.grid.edit.isEditCell(inRowIndex, this.index)){
				//console.log('editor onblur', e);
				this.grid.edit.apply();
			}
		},
		registerOnBlur: function(inNode, inRowIndex){
			if(this.commitOnBlur){
				connect.connect(inNode, "onblur", function(e){
					// hack: if editor still thinks this editor is current some ms after it blurs, assume we've focused away from grid
					setTimeout(lang.hitch(this, "_onEditBlur", inRowIndex), 250);
				});
			}
		},
		//protected
		needFormatNode: function(inDatum, inRowIndex){
			this._formatPending = true;
			whenIdle(this, "_formatNode", inDatum, inRowIndex);
		},
		cancelFormatNode: function(){
			this._formatPending = false;
		},
		//private
		_formatNode: function(inDatum, inRowIndex){
			if(this._formatPending){
				this._formatPending = false;
				// make cell selectable
				if(!has("ie")){
					dom.setSelectable(this.grid.domNode, true);
				}
				this.formatNode(this.getEditNode(inRowIndex), inDatum, inRowIndex);
			}
		},
		//protected
		formatNode: function(inNode, inDatum, inRowIndex){
			// summary:
			//	format the editing dom node. Use when editor is a widget.
			// inNode: dom node
			// dom node for the editor
			// inDatum: anything
			//	cell data to edit
			// inRowIndex: int
			//	grid row index
			if(has("ie")){
				// IE sux bad
				whenIdle(this, "focus", inRowIndex, inNode);
			}else{
				this.focus(inRowIndex, inNode);
			}
		},
		dispatchEvent: function(m, e){
			if(m in this){
				return this[m](e);
			}
		},
		//public
		getValue: function(inRowIndex){
			// summary:
			//	returns value entered into editor
			// inRowIndex: int
			// grid row index
			// returns:
			//	value of editor
			return this.getEditNode(inRowIndex)[this._valueProp];
		},
		setValue: function(inRowIndex, inValue){
			// summary:
			//	set the value of the grid editor
			// inRowIndex: int
			// grid row index
			// inValue: anything
			//	value of editor
			var n = this.getEditNode(inRowIndex);
			if(n){
				n[this._valueProp] = inValue;
			}
		},
		focus: function(inRowIndex, inNode){
			// summary:
			//	focus the grid editor
			// inRowIndex: int
			// grid row index
			// inNode: dom node
			//	editor node
			focusSelectNode(inNode || this.getEditNode(inRowIndex));
		},
		save: function(inRowIndex){
			// summary:
			//	save editor state
			// inRowIndex: int
			// grid row index
			this.value = this.value || this.getValue(inRowIndex);
			//console.log("save", this.value, inCell.index, inRowIndex);
		},
		restore: function(inRowIndex){
			// summary:
			//	restore editor state
			// inRowIndex: int
			// grid row index
			this.setValue(inRowIndex, this.value);
			//console.log("restore", this.value, inCell.index, inRowIndex);
		},
		//protected
		_finish: function(inRowIndex){
			// summary:
			//	called when editing is completed to clean up editor
			// inRowIndex: int
			// grid row index
			dom.setSelectable(this.grid.domNode, false);
			this.cancelFormatNode();
		},
		//public
		apply: function(inRowIndex){
			// summary:
			//	apply edit from cell editor
			// inRowIndex: int
			// grid row index
			this.applyEdit(this.getValue(inRowIndex), inRowIndex);
			this._finish(inRowIndex);
		},
		cancel: function(inRowIndex){
			// summary:
			//	cancel cell edit
			// inRowIndex: int
			// grid row index
			this.cancelEdit(inRowIndex);
			this._finish(inRowIndex);
		}
	});
	BaseCell.markupFactory = function(node, cellDef){
		var formatter = lang.trim(domAttr.get(node, "formatter")||"");
		if(formatter){
			cellDef.formatter = lang.getObject(formatter)||formatter;
		}
		var get = lang.trim(domAttr.get(node, "get")||"");
		if(get){
			cellDef.get = lang.getObject(get);
		}
		var getBoolAttr = function(attr, cell, cellAttr){
			var value = lang.trim(domAttr.get(node, attr)||"");
			if(value){ cell[cellAttr||attr] = !(value.toLowerCase()=="false"); }
		};
		getBoolAttr("sortDesc", cellDef);
		getBoolAttr("editable", cellDef);
		getBoolAttr("alwaysEditing", cellDef);
		getBoolAttr("noresize", cellDef);
		getBoolAttr("draggable", cellDef);

		var value = lang.trim(domAttr.get(node, "loadingText")||domAttr.get(node, "defaultValue")||"");
		if(value){
			cellDef.defaultValue = value;
		}

		var getStrAttr = function(attr, cell, cellAttr){
			var value = lang.trim(domAttr.get(node, attr)||"")||undefined;
			if(value){ cell[cellAttr||attr] = value; }
		};
		getStrAttr("styles", cellDef);
		getStrAttr("headerStyles", cellDef);
		getStrAttr("cellStyles", cellDef);
		getStrAttr("classes", cellDef);
		getStrAttr("headerClasses", cellDef);
		getStrAttr("cellClasses", cellDef);
	};

	var Cell = declare("dojox.grid.cells.Cell", BaseCell, {
		// summary
		// grid cell that provides a standard text input box upon editing
		constructor: function(){
			this.keyFilter = this.keyFilter;
		},
		// keyFilter: RegExp
		//		optional regex for disallowing keypresses
		keyFilter: null,
		formatEditing: function(inDatum, inRowIndex){
			this.needFormatNode(inDatum, inRowIndex);
			return '<input class="dojoxGridInput" type="text" value="' + inDatum + '">';
		},
		formatNode: function(inNode, inDatum, inRowIndex){
			this.inherited(arguments);
			// FIXME: feels too specific for this interface
			this.registerOnBlur(inNode, inRowIndex);
		},
		doKey: function(e){
			if(this.keyFilter){
				var key = String.fromCharCode(e.charCode);
				if(key.search(this.keyFilter) == -1){
					event.stop(e);
				}
			}
		},
		_finish: function(inRowIndex){
			this.inherited(arguments);
			var n = this.getEditNode(inRowIndex);
			try{
				util.fire(n, "blur");
			}catch(e){}
		}
	});
	Cell.markupFactory = function(node, cellDef){
		BaseCell.markupFactory(node, cellDef);
		var keyFilter = lang.trim(domAttr.get(node, "keyFilter")||"");
		if(keyFilter){
			cellDef.keyFilter = new RegExp(keyFilter);
		}
	};

	var RowIndex = declare("dojox.grid.cells.RowIndex", Cell, {
		name: 'Row',

		postscript: function(){
			this.editable = false;
		},
		get: function(inRowIndex){
			return inRowIndex + 1;
		}
	});
	RowIndex.markupFactory = function(node, cellDef){
		Cell.markupFactory(node, cellDef);
	};

	var Select = declare("dojox.grid.cells.Select", Cell, {
		// summary:
		// grid cell that provides a standard select for editing

		// options: Array
		// 		text of each item
		options: null,

		// values: Array
		//		value for each item
		values: null,

		// returnIndex: Integer
		// 		editor returns only the index of the selected option and not the value
		returnIndex: -1,

		constructor: function(inCell){
			this.values = this.values || this.options;
		},
		formatEditing: function(inDatum, inRowIndex){
			this.needFormatNode(inDatum, inRowIndex);
			var h = [ '<select class="dojoxGridSelect">' ];
			for (var i=0, o, v; ((o=this.options[i]) !== undefined)&&((v=this.values[i]) !== undefined); i++){
				v = v.replace ? v.replace(/&/g, '&amp;').replace(/</g, '&lt;') : v;
				o = o.replace ? o.replace(/&/g, '&amp;').replace(/</g, '&lt;') : o;
				h.push("<option", (inDatum==v ? ' selected' : ''), ' value="' + v + '"', ">", o, "</option>");
			}
			h.push('</select>');
			return h.join('');
		},
		_defaultFormat: function(inValue, callArgs){
			var v = this.inherited(arguments);
			// when 'values' and 'options' both provided and there is no cutomized formatter,
			// then we use 'options' as label in order to be consistent
			if(!this.formatter && this.values && this.options){
				var i = array.indexOf(this.values, v);
				if(i >= 0){
					v = this.options[i];
				}
			}
			return v;
		},
		getValue: function(inRowIndex){
			var n = this.getEditNode(inRowIndex);
			if(n){
				var i = n.selectedIndex, o = n.options[i];
				return this.returnIndex > -1 ? i : o.value || o.innerHTML;
			}
		}
	});
	Select.markupFactory = function(node, cell){
		Cell.markupFactory(node, cell);
		var options = lang.trim(domAttr.get(node, "options")||"");
		if(options){
			var o = options.split(',');
			if(o[0] != options){
				cell.options = o;
			}
		}
		var values = lang.trim(domAttr.get(node, "values")||"");
		if(values){
			var v = values.split(',');
			if(v[0] != values){
				cell.values = v;
			}
		}
	};

	var AlwaysEdit = declare("dojox.grid.cells.AlwaysEdit", Cell, {
		// summary:
		// grid cell that is always in an editable state, regardless of grid editing state
		alwaysEditing: true,
		_formatNode: function(inDatum, inRowIndex){
			this.formatNode(this.getEditNode(inRowIndex), inDatum, inRowIndex);
		},
		applyStaticValue: function(inRowIndex){
			var e = this.grid.edit;
			e.applyCellEdit(this.getValue(inRowIndex), this, inRowIndex);
			e.start(this, inRowIndex, true);
		}
	});
	AlwaysEdit.markupFactory = function(node, cell){
		Cell.markupFactory(node, cell);
	};

	var Bool = declare("dojox.grid.cells.Bool", AlwaysEdit, {
		// summary:
		// grid cell that provides a standard checkbox that is always on for editing
		_valueProp: "checked",
		formatEditing: function(inDatum, inRowIndex){
			return '<input class="dojoxGridInput" type="checkbox"' + (inDatum ? ' checked="checked"' : '') + ' style="width: auto" />';
		},
		doclick: function(e){
			if(e.target.tagName == 'INPUT'){
				this.applyStaticValue(e.rowIndex);
			}
		}
	});
	Bool.markupFactory = function(node, cell){
		AlwaysEdit.markupFactory(node, cell);
	};

	return BaseCell;

});
},
'dijit/a11y':function(){
define("dijit/a11y", [
	"dojo/_base/array", // array.forEach array.map
	"dojo/_base/config", // defaultDuration
	"dojo/_base/declare", // declare
	"dojo/dom",			// dom.byId
	"dojo/dom-attr", // domAttr.attr domAttr.has
	"dojo/dom-style", // style.style
	"dojo/_base/sniff", // has("ie")
	"./_base/manager",	// manager._isElementShown
	"."	// for exporting methods to dijit namespace
], function(array, config, declare, dom, domAttr, domStyle, has, manager, dijit){

	// module:
	//		dijit/a11y
	// summary:
	//		Accessibility utility functions (keyboard, tab stops, etc.)

	var shown = (dijit._isElementShown = function(/*Element*/ elem){
		var s = domStyle.get(elem);
		return (s.visibility != "hidden")
			&& (s.visibility != "collapsed")
			&& (s.display != "none")
			&& (domAttr.get(elem, "type") != "hidden");
	});

	dijit.hasDefaultTabStop = function(/*Element*/ elem){
		// summary:
		//		Tests if element is tab-navigable even without an explicit tabIndex setting

		// No explicit tabIndex setting, need to investigate node type
		switch(elem.nodeName.toLowerCase()){
			case "a":
				// An <a> w/out a tabindex is only navigable if it has an href
				return domAttr.has(elem, "href");
			case "area":
			case "button":
			case "input":
			case "object":
			case "select":
			case "textarea":
				// These are navigable by default
				return true;
			case "iframe":
				// If it's an editor <iframe> then it's tab navigable.
				var body;
				try{
					// non-IE
					var contentDocument = elem.contentDocument;
					if("designMode" in contentDocument && contentDocument.designMode == "on"){
						return true;
					}
					body = contentDocument.body;
				}catch(e1){
					// contentWindow.document isn't accessible within IE7/8
					// if the iframe.src points to a foreign url and this
					// page contains an element, that could get focus
					try{
						body = elem.contentWindow.document.body;
					}catch(e2){
						return false;
					}
				}
				return body && (body.contentEditable == 'true' ||
					(body.firstChild && body.firstChild.contentEditable == 'true'));
			default:
				return elem.contentEditable == 'true';
		}
	};

	var isTabNavigable = (dijit.isTabNavigable = function(/*Element*/ elem){
		// summary:
		//		Tests if an element is tab-navigable

		// TODO: convert (and rename method) to return effective tabIndex; will save time in _getTabNavigable()
		if(domAttr.get(elem, "disabled")){
			return false;
		}else if(domAttr.has(elem, "tabIndex")){
			// Explicit tab index setting
			return domAttr.get(elem, "tabIndex") >= 0; // boolean
		}else{
			// No explicit tabIndex setting, so depends on node type
			return dijit.hasDefaultTabStop(elem);
		}
	});

	dijit._getTabNavigable = function(/*DOMNode*/ root){
		// summary:
		//		Finds descendants of the specified root node.
		//
		// description:
		//		Finds the following descendants of the specified root node:
		//		* the first tab-navigable element in document order
		//		  without a tabIndex or with tabIndex="0"
		//		* the last tab-navigable element in document order
		//		  without a tabIndex or with tabIndex="0"
		//		* the first element in document order with the lowest
		//		  positive tabIndex value
		//		* the last element in document order with the highest
		//		  positive tabIndex value
		var first, last, lowest, lowestTabindex, highest, highestTabindex, radioSelected = {};

		function radioName(node){
			// If this element is part of a radio button group, return the name for that group.
			return node && node.tagName.toLowerCase() == "input" &&
				node.type && node.type.toLowerCase() == "radio" &&
				node.name && node.name.toLowerCase();
		}

		var walkTree = function(/*DOMNode*/parent){
			for(var child = parent.firstChild; child; child = child.nextSibling){
				// Skip text elements, hidden elements, and also non-HTML elements (those in custom namespaces) in IE,
				// since show() invokes getAttribute("type"), which crash on VML nodes in IE.
				if(child.nodeType != 1 || (has("ie") && child.scopeName !== "HTML") || !shown(child)){
					continue;
				}

				if(isTabNavigable(child)){
					var tabindex = domAttr.get(child, "tabIndex");
					if(!domAttr.has(child, "tabIndex") || tabindex == 0){
						if(!first){
							first = child;
						}
						last = child;
					}else if(tabindex > 0){
						if(!lowest || tabindex < lowestTabindex){
							lowestTabindex = tabindex;
							lowest = child;
						}
						if(!highest || tabindex >= highestTabindex){
							highestTabindex = tabindex;
							highest = child;
						}
					}
					var rn = radioName(child);
					if(domAttr.get(child, "checked") && rn){
						radioSelected[rn] = child;
					}
				}
				if(child.nodeName.toUpperCase() != 'SELECT'){
					walkTree(child);
				}
			}
		};
		if(shown(root)){
			walkTree(root);
		}
		function rs(node){
			// substitute checked radio button for unchecked one, if there is a checked one with the same name.
			return radioSelected[radioName(node)] || node;
		}

		return { first: rs(first), last: rs(last), lowest: rs(lowest), highest: rs(highest) };
	};
	dijit.getFirstInTabbingOrder = function(/*String|DOMNode*/ root){
		// summary:
		//		Finds the descendant of the specified root node
		//		that is first in the tabbing order
		var elems = dijit._getTabNavigable(dom.byId(root));
		return elems.lowest ? elems.lowest : elems.first; // DomNode
	};

	dijit.getLastInTabbingOrder = function(/*String|DOMNode*/ root){
		// summary:
		//		Finds the descendant of the specified root node
		//		that is last in the tabbing order
		var elems = dijit._getTabNavigable(dom.byId(root));
		return elems.last ? elems.last : elems.highest; // DomNode
	};

	return {
		hasDefaultTabStop: dijit.hasDefaultTabStop,
		isTabNavigable: dijit.isTabNavigable,
		_getTabNavigable: dijit._getTabNavigable,
		getFirstInTabbingOrder: dijit.getFirstInTabbingOrder,
		getLastInTabbingOrder: dijit.getLastInTabbingOrder
	};
});

},
'dojox/grid/_Scroller':function(){
define("dojox/grid/_Scroller", [
	"dijit/registry",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"./util",
	"dojo/_base/html"
], function(dijitRegistry, declare, lang, util, html){

	var indexInParent = function(inNode){
		var i=0, n, p=inNode.parentNode;
		while((n = p.childNodes[i++])){
			if(n == inNode){
				return i - 1;
			}
		}
		return -1;
	};
	
	var cleanNode = function(inNode){
		if(!inNode){
			return;
		}
		dojo.forEach(dijitRegistry.toArray(), function(w){
			if(w.domNode && html.isDescendant(w.domNode, inNode, true)){
				w.destroy();
			}
		});
	};

	var getTagName = function(inNodeOrId){
		var node = html.byId(inNodeOrId);
		return (node && node.tagName ? node.tagName.toLowerCase() : '');
	};
	
	var nodeKids = function(inNode, inTag){
		var result = [];
		var i=0, n;
		while((n = inNode.childNodes[i])){
			i++;
			if(getTagName(n) == inTag){
				result.push(n);
			}
		}
		return result;
	};
	
	var divkids = function(inNode){
		return nodeKids(inNode, 'div');
	};

	return declare("dojox.grid._Scroller", null, {
		constructor: function(inContentNodes){
			this.setContentNodes(inContentNodes);
			this.pageHeights = [];
			this.pageNodes = [];
			this.stack = [];
		},
		// specified
		rowCount: 0, // total number of rows to manage
		defaultRowHeight: 32, // default height of a row
		keepRows: 100, // maximum number of rows that should exist at one time
		contentNode: null, // node to contain pages
		scrollboxNode: null, // node that controls scrolling
		// calculated
		defaultPageHeight: 0, // default height of a page
		keepPages: 10, // maximum number of pages that should exists at one time
		pageCount: 0,
		windowHeight: 0,
		firstVisibleRow: 0,
		lastVisibleRow: 0,
		averageRowHeight: 0, // the average height of a row
		// private
		page: 0,
		pageTop: 0,
		// init
		init: function(inRowCount, inKeepRows, inRowsPerPage){
			switch(arguments.length){
				case 3: this.rowsPerPage = inRowsPerPage;
				case 2: this.keepRows = inKeepRows;
				case 1: this.rowCount = inRowCount;
				default: break;
			}
			this.defaultPageHeight = this.defaultRowHeight * this.rowsPerPage;
			this.pageCount = this._getPageCount(this.rowCount, this.rowsPerPage);
			this.setKeepInfo(this.keepRows);
			this.invalidate();
			if(this.scrollboxNode){
				this.scrollboxNode.scrollTop = 0;
				this.scroll(0);
				this.scrollboxNode.onscroll = lang.hitch(this, 'onscroll');
			}
		},
		_getPageCount: function(rowCount, rowsPerPage){
			return rowCount ? (Math.ceil(rowCount / rowsPerPage) || 1) : 0;
		},
		destroy: function(){
			this.invalidateNodes();
			delete this.contentNodes;
			delete this.contentNode;
			delete this.scrollboxNode;
		},
		setKeepInfo: function(inKeepRows){
			this.keepRows = inKeepRows;
			this.keepPages = !this.keepRows ? this.keepPages : Math.max(Math.ceil(this.keepRows / this.rowsPerPage), 2);
		},
		// nodes
		setContentNodes: function(inNodes){
			this.contentNodes = inNodes;
			this.colCount = (this.contentNodes ? this.contentNodes.length : 0);
			this.pageNodes = [];
			for(var i=0; i<this.colCount; i++){
				this.pageNodes[i] = [];
			}
		},
		getDefaultNodes: function(){
			return this.pageNodes[0] || [];
		},
		// updating
		invalidate: function(){
			this._invalidating = true;
			this.invalidateNodes();
			this.pageHeights = [];
			this.height = (this.pageCount ? (this.pageCount - 1)* this.defaultPageHeight + this.calcLastPageHeight() : 0);
			this.resize();
			this._invalidating = false;
		},
		updateRowCount: function(inRowCount){
			this.invalidateNodes();
			this.rowCount = inRowCount;
			// update page count, adjust document height
			var oldPageCount = this.pageCount;
			if(oldPageCount === 0){
				//We want to have at least 1px in height to keep scroller.  Otherwise with an
				//empty grid you can't scroll to see the header.
				this.height = 1;
			}
			this.pageCount = this._getPageCount(this.rowCount, this.rowsPerPage);
			if(this.pageCount < oldPageCount){
				for(var i=oldPageCount-1; i>=this.pageCount; i--){
					this.height -= this.getPageHeight(i);
					delete this.pageHeights[i];
				}
			}else if(this.pageCount > oldPageCount){
				this.height += this.defaultPageHeight * (this.pageCount - oldPageCount - 1) + this.calcLastPageHeight();
			}
			this.resize();
		},
		// implementation for page manager
		pageExists: function(inPageIndex){
			return Boolean(this.getDefaultPageNode(inPageIndex));
		},
		measurePage: function(inPageIndex){
			if(this.grid.rowHeight){
				var height = this.grid.rowHeight + 1;
				return ((inPageIndex + 1) * this.rowsPerPage > this.rowCount ?
					this.rowCount - inPageIndex * this.rowsPerPage :
					this.rowsPerPage) * height;
					 
			}
			var n = this.getDefaultPageNode(inPageIndex);
			return (n && n.innerHTML) ? n.offsetHeight : undefined;
		},
		positionPage: function(inPageIndex, inPos){
			for(var i=0; i<this.colCount; i++){
				this.pageNodes[i][inPageIndex].style.top = inPos + 'px';
			}
		},
		repositionPages: function(inPageIndex){
			var nodes = this.getDefaultNodes();
			var last = 0;

			for(var i=0; i<this.stack.length; i++){
				last = Math.max(this.stack[i], last);
			}
			//
			var n = nodes[inPageIndex];
			var y = (n ? this.getPageNodePosition(n) + this.getPageHeight(inPageIndex) : 0);
			for(var p=inPageIndex+1; p<=last; p++){
				n = nodes[p];
				if(n){
					if(this.getPageNodePosition(n) == y){
						return;
					}
					this.positionPage(p, y);
				}
				y += this.getPageHeight(p);
			}
		},
		installPage: function(inPageIndex){
			for(var i=0; i<this.colCount; i++){
				this.contentNodes[i].appendChild(this.pageNodes[i][inPageIndex]);
			}
		},
		preparePage: function(inPageIndex, inReuseNode){
			var p = (inReuseNode ? this.popPage() : null);
			for(var i=0; i<this.colCount; i++){
				var nodes = this.pageNodes[i];
				var new_p = (p === null ? this.createPageNode() : this.invalidatePageNode(p, nodes));
				new_p.pageIndex = inPageIndex;
				nodes[inPageIndex] = new_p;
			}
		},
		// rendering implementation
		renderPage: function(inPageIndex){
			var nodes = [];
			var i, j;
			for(i=0; i<this.colCount; i++){
				nodes[i] = this.pageNodes[i][inPageIndex];
			}
			for(i=0, j=inPageIndex*this.rowsPerPage; (i<this.rowsPerPage)&&(j<this.rowCount); i++, j++){
				this.renderRow(j, nodes);
			}
		},
		removePage: function(inPageIndex){
			for(var i=0, j=inPageIndex*this.rowsPerPage; i<this.rowsPerPage; i++, j++){
				this.removeRow(j);
			}
		},
		destroyPage: function(inPageIndex){
			for(var i=0; i<this.colCount; i++){
				var n = this.invalidatePageNode(inPageIndex, this.pageNodes[i]);
				if(n){
					html.destroy(n);
				}
			}
		},
		pacify: function(inShouldPacify){
		},
		// pacification
		pacifying: false,
		pacifyTicks: 200,
		setPacifying: function(inPacifying){
			if(this.pacifying != inPacifying){
				this.pacifying = inPacifying;
				this.pacify(this.pacifying);
			}
		},
		startPacify: function(){
			this.startPacifyTicks = new Date().getTime();
		},
		doPacify: function(){
			var result = (new Date().getTime() - this.startPacifyTicks) > this.pacifyTicks;
			this.setPacifying(true);
			this.startPacify();
			return result;
		},
		endPacify: function(){
			this.setPacifying(false);
		},
		// default sizing implementation
		resize: function(){
			if(this.scrollboxNode){
				this.windowHeight = this.scrollboxNode.clientHeight;
			}
			for(var i=0; i<this.colCount; i++){
				//We want to have 1px in height min to keep scroller.  Otherwise can't scroll
				//and see header in empty grid.
				util.setStyleHeightPx(this.contentNodes[i], Math.max(1,this.height));
			}
			
			// Calculate the average row height and update the defaults (row and page).
			var needPage = (!this._invalidating);
			if(!needPage){
				var ah = this.grid.get("autoHeight");
				if(typeof ah == "number" && ah <= Math.min(this.rowsPerPage, this.rowCount)){
					needPage = true;
				}
			}
			if(needPage){
				this.needPage(this.page, this.pageTop);
			}
			var rowsOnPage = (this.page < this.pageCount - 1) ? this.rowsPerPage : ((this.rowCount % this.rowsPerPage) || this.rowsPerPage);
			var pageHeight = this.getPageHeight(this.page);
			this.averageRowHeight = (pageHeight > 0 && rowsOnPage > 0) ? (pageHeight / rowsOnPage) : 0;
		},
		calcLastPageHeight: function(){
			if(!this.pageCount){
				return 0;
			}
			var lastPage = this.pageCount - 1;
			var lastPageHeight = ((this.rowCount % this.rowsPerPage)||(this.rowsPerPage)) * this.defaultRowHeight;
			this.pageHeights[lastPage] = lastPageHeight;
			return lastPageHeight;
		},
		updateContentHeight: function(inDh){
			this.height += inDh;
			this.resize();
		},
		updatePageHeight: function(inPageIndex, fromBuild, fromAsynRendering){
			if(this.pageExists(inPageIndex)){
				var oh = this.getPageHeight(inPageIndex);
				var h = (this.measurePage(inPageIndex));
				if(h === undefined){
					h = oh;
				}
				this.pageHeights[inPageIndex] = h;
				if(oh != h){
					this.updateContentHeight(h - oh);
					var ah = this.grid.get("autoHeight");
					if((typeof ah == "number" && ah > this.rowCount)||(ah === true && !fromBuild)){
						if(!fromAsynRendering){
							this.grid.sizeChange();
						}else{//fix #11101 by using fromAsynRendering to avoid deadlock
							var ns = this.grid.viewsNode.style;
							ns.height = parseInt(ns.height) + h - oh + 'px';
							this.repositionPages(inPageIndex);
						}
					}else{
						this.repositionPages(inPageIndex);
					}
				}
				return h;
			}
			return 0;
		},
		rowHeightChanged: function(inRowIndex, fromAsynRendering){
			this.updatePageHeight(Math.floor(inRowIndex / this.rowsPerPage), false, fromAsynRendering);
		},
		// scroller core
		invalidateNodes: function(){
			while(this.stack.length){
				this.destroyPage(this.popPage());
			}
		},
		createPageNode: function(){
			var p = document.createElement('div');
			html.attr(p,"role","presentation");
			p.style.position = 'absolute';
			//p.style.width = '100%';
			p.style[this.grid.isLeftToRight() ? "left" : "right"] = '0';
			return p;
		},
		getPageHeight: function(inPageIndex){
			var ph = this.pageHeights[inPageIndex];
			return (ph !== undefined ? ph : this.defaultPageHeight);
		},
		// FIXME: this is not a stack, it's a FIFO list
		pushPage: function(inPageIndex){
			return this.stack.push(inPageIndex);
		},
		popPage: function(){
			return this.stack.shift();
		},
		findPage: function(inTop){
			var i = 0, h = 0;
			for(var ph = 0; i<this.pageCount; i++, h += ph){
				ph = this.getPageHeight(i);
				if(h + ph >= inTop){
					break;
				}
			}
			this.page = i;
			this.pageTop = h;
		},
		buildPage: function(inPageIndex, inReuseNode, inPos){
			this.preparePage(inPageIndex, inReuseNode);
			this.positionPage(inPageIndex, inPos);
			// order of operations is key below
			this.installPage(inPageIndex);
			this.renderPage(inPageIndex);
			// order of operations is key above
			this.pushPage(inPageIndex);
		},
		needPage: function(inPageIndex, inPos){
			var h = this.getPageHeight(inPageIndex), oh = h;
			if(!this.pageExists(inPageIndex)){
				this.buildPage(inPageIndex, (!this.grid._autoHeight/*fix #10543*/ && this.keepPages&&(this.stack.length >= this.keepPages)), inPos);
				h = this.updatePageHeight(inPageIndex, true);
			}else{
				this.positionPage(inPageIndex, inPos);
			}
			return h;
		},
		onscroll: function(){
			this.scroll(this.scrollboxNode.scrollTop);
		},
		scroll: function(inTop){
			this.grid.scrollTop = inTop;
			if(this.colCount){
				this.startPacify();
				this.findPage(inTop);
				var h = this.height;
				var b = this.getScrollBottom(inTop);
				for(var p=this.page, y=this.pageTop; (p<this.pageCount)&&((b<0)||(y<b)); p++){
					y += this.needPage(p, y);
				}
				this.firstVisibleRow = this.getFirstVisibleRow(this.page, this.pageTop, inTop);
				this.lastVisibleRow = this.getLastVisibleRow(p - 1, y, b);
				// indicates some page size has been updated
				if(h != this.height){
					this.repositionPages(p-1);
				}
				this.endPacify();
			}
		},
		getScrollBottom: function(inTop){
			return (this.windowHeight >= 0 ? inTop + this.windowHeight : -1);
		},
		// events
		processNodeEvent: function(e, inNode){
			var t = e.target;
			while(t && (t != inNode) && t.parentNode && (t.parentNode.parentNode != inNode)){
				t = t.parentNode;
			}
			if(!t || !t.parentNode || (t.parentNode.parentNode != inNode)){
				return false;
			}
			var page = t.parentNode;
			e.topRowIndex = page.pageIndex * this.rowsPerPage;
			e.rowIndex = e.topRowIndex + indexInParent(t);
			e.rowTarget = t;
			return true;
		},
		processEvent: function(e){
			return this.processNodeEvent(e, this.contentNode);
		},
		// virtual rendering interface
		renderRow: function(inRowIndex, inPageNode){
		},
		removeRow: function(inRowIndex){
		},
		// page node operations
		getDefaultPageNode: function(inPageIndex){
			return this.getDefaultNodes()[inPageIndex];
		},
		positionPageNode: function(inNode, inPos){
		},
		getPageNodePosition: function(inNode){
			return inNode.offsetTop;
		},
		invalidatePageNode: function(inPageIndex, inNodes){
			var p = inNodes[inPageIndex];
			if(p){
				delete inNodes[inPageIndex];
				this.removePage(inPageIndex, p);
				cleanNode(p);
				p.innerHTML = '';
			}
			return p;
		},
		// scroll control
		getPageRow: function(inPage){
			return inPage * this.rowsPerPage;
		},
		getLastPageRow: function(inPage){
			return Math.min(this.rowCount, this.getPageRow(inPage + 1)) - 1;
		},
		getFirstVisibleRow: function(inPage, inPageTop, inScrollTop){
			if(!this.pageExists(inPage)){
				return 0;
			}
			var row = this.getPageRow(inPage);
			var nodes = this.getDefaultNodes();
			var rows = divkids(nodes[inPage]);
			for(var i=0,l=rows.length; i<l && inPageTop<inScrollTop; i++, row++){
				inPageTop += rows[i].offsetHeight;
			}
			return (row ? row - 1 : row);
		},
		getLastVisibleRow: function(inPage, inBottom, inScrollBottom){
			if(!this.pageExists(inPage)){
				return 0;
			}
			var nodes = this.getDefaultNodes();
			var row = this.getLastPageRow(inPage);
			var rows = divkids(nodes[inPage]);
			for(var i=rows.length-1; i>=0 && inBottom>inScrollBottom; i--, row--){
				inBottom -= rows[i].offsetHeight;
			}
			return row + 1;
		},
		findTopRow: function(inScrollTop){
			var nodes = this.getDefaultNodes();
			var rows = divkids(nodes[this.page]);
			for(var i=0,l=rows.length,t=this.pageTop,h; i<l; i++){
				h = rows[i].offsetHeight;
				t += h;
				if(t >= inScrollTop){
					this.offset = h - (t - inScrollTop);
					return i + this.page * this.rowsPerPage;
				}
			}
			return -1;
		},
		findScrollTop: function(inRow){
			var rowPage = Math.floor(inRow / this.rowsPerPage);
			var t = 0;
			var i, l;
			for(i=0; i<rowPage; i++){
				t += this.getPageHeight(i);
			}
			this.pageTop = t;
			this.page = rowPage;//fix #10543
			this.needPage(rowPage, this.pageTop);

			var nodes = this.getDefaultNodes();
			var rows = divkids(nodes[rowPage]);
			var r = inRow - this.rowsPerPage * rowPage;
			for(i=0,l=rows.length; i<l && i<r; i++){
				t += rows[i].offsetHeight;
			}
			return t;
		},
		dummy: 0
	});
});

},
'dojo/dnd/Container':function(){
define(["../main", "../Evented", "./common", "../parser"], function(dojo, Evented) {
	// module:
	//		dojo/dnd/Container
	// summary:
	//		TODOC


/*
	Container states:
		""		- normal state
		"Over"	- mouse over a container
	Container item states:
		""		- normal state
		"Over"	- mouse over a container item
*/

/*=====
dojo.declare("dojo.dnd.__ContainerArgs", [], {
	creator: function(){
		// summary:
		//		a creator function, which takes a data item, and returns an object like that:
		//		{node: newNode, data: usedData, type: arrayOfStrings}
	},

	// skipForm: Boolean
	//		don't start the drag operation, if clicked on form elements
	skipForm: false,

	// dropParent: Node||String
	//		node or node's id to use as the parent node for dropped items
	//		(must be underneath the 'node' parameter in the DOM)
	dropParent: null,

	// _skipStartup: Boolean
	//		skip startup(), which collects children, for deferred initialization
	//		(this is used in the markup mode)
	_skipStartup: false
});

dojo.dnd.Item = function(){
	// summary:
	//		Represents (one of) the source node(s) being dragged.
	//		Contains (at least) the "type" and "data" attributes.
	// type: String[]
	//		Type(s) of this item, by default this is ["text"]
	// data: Object
	//		Logical representation of the object being dragged.
	//		If the drag object's type is "text" then data is a String,
	//		if it's another type then data could be a different Object,
	//		perhaps a name/value hash.

	this.type = type;
	this.data = data;
}
=====*/

dojo.declare("dojo.dnd.Container", Evented, {
	// summary:
	//		a Container object, which knows when mouse hovers over it,
	//		and over which element it hovers

	// object attributes (for markup)
	skipForm: false,

	/*=====
	// current: DomNode
	//		The DOM node the mouse is currently hovered over
	current: null,

	// map: Hash<String, dojo.dnd.Item>
	//		Map from an item's id (which is also the DOMNode's id) to
	//		the dojo.dnd.Item itself.
	map: {},
	=====*/

	constructor: function(node, params){
		// summary:
		//		a constructor of the Container
		// node: Node
		//		node or node's id to build the container on
		// params: dojo.dnd.__ContainerArgs
		//		a dictionary of parameters
		this.node = dojo.byId(node);
		if(!params){ params = {}; }
		this.creator = params.creator || null;
		this.skipForm = params.skipForm;
		this.parent = params.dropParent && dojo.byId(params.dropParent);

		// class-specific variables
		this.map = {};
		this.current = null;

		// states
		this.containerState = "";
		dojo.addClass(this.node, "dojoDndContainer");

		// mark up children
		if(!(params && params._skipStartup)){
			this.startup();
		}

		// set up events
		this.events = [
			dojo.connect(this.node, "onmouseover", this, "onMouseOver"),
			dojo.connect(this.node, "onmouseout",  this, "onMouseOut"),
			// cancel text selection and text dragging
			dojo.connect(this.node, "ondragstart",   this, "onSelectStart"),
			dojo.connect(this.node, "onselectstart", this, "onSelectStart")
		];
	},

	// object attributes (for markup)
	creator: function(){
		// summary:
		//		creator function, dummy at the moment
	},

	// abstract access to the map
	getItem: function(/*String*/ key){
		// summary:
		//		returns a data item by its key (id)
		return this.map[key];	// dojo.dnd.Item
	},
	setItem: function(/*String*/ key, /*dojo.dnd.Item*/ data){
		// summary:
		//		associates a data item with its key (id)
		this.map[key] = data;
	},
	delItem: function(/*String*/ key){
		// summary:
		//		removes a data item from the map by its key (id)
		delete this.map[key];
	},
	forInItems: function(/*Function*/ f, /*Object?*/ o){
		// summary:
		//		iterates over a data map skipping members that
		//		are present in the empty object (IE and/or 3rd-party libraries).
		o = o || dojo.global;
		var m = this.map, e = dojo.dnd._empty;
		for(var i in m){
			if(i in e){ continue; }
			f.call(o, m[i], i, this);
		}
		return o;	// Object
	},
	clearItems: function(){
		// summary:
		//		removes all data items from the map
		this.map = {};
	},

	// methods
	getAllNodes: function(){
		// summary:
		//		returns a list (an array) of all valid child nodes
		return dojo.query("> .dojoDndItem", this.parent);	// NodeList
	},
	sync: function(){
		// summary:
		//		sync up the node list with the data map
		var map = {};
		this.getAllNodes().forEach(function(node){
			if(node.id){
				var item = this.getItem(node.id);
				if(item){
					map[node.id] = item;
					return;
				}
			}else{
				node.id = dojo.dnd.getUniqueId();
			}
			var type = node.getAttribute("dndType"),
				data = node.getAttribute("dndData");
			map[node.id] = {
				data: data || node.innerHTML,
				type: type ? type.split(/\s*,\s*/) : ["text"]
			};
		}, this);
		this.map = map;
		return this;	// self
	},
	insertNodes: function(data, before, anchor){
		// summary:
		//		inserts an array of new nodes before/after an anchor node
		// data: Array
		//		a list of data items, which should be processed by the creator function
		// before: Boolean
		//		insert before the anchor, if true, and after the anchor otherwise
		// anchor: Node
		//		the anchor node to be used as a point of insertion
		if(!this.parent.firstChild){
			anchor = null;
		}else if(before){
			if(!anchor){
				anchor = this.parent.firstChild;
			}
		}else{
			if(anchor){
				anchor = anchor.nextSibling;
			}
		}
		if(anchor){
			for(var i = 0; i < data.length; ++i){
				var t = this._normalizedCreator(data[i]);
				this.setItem(t.node.id, {data: t.data, type: t.type});
				this.parent.insertBefore(t.node, anchor);
			}
		}else{
			for(var i = 0; i < data.length; ++i){
				var t = this._normalizedCreator(data[i]);
				this.setItem(t.node.id, {data: t.data, type: t.type});
				this.parent.appendChild(t.node);
			}
		}
		return this;	// self
	},
	destroy: function(){
		// summary:
		//		prepares this object to be garbage-collected
		dojo.forEach(this.events, dojo.disconnect);
		this.clearItems();
		this.node = this.parent = this.current = null;
	},

	// markup methods
	markupFactory: function(params, node, ctor){
		params._skipStartup = true;
		return new ctor(node, params);
	},
	startup: function(){
		// summary:
		//		collects valid child items and populate the map

		// set up the real parent node
		if(!this.parent){
			// use the standard algorithm, if not assigned
			this.parent = this.node;
			if(this.parent.tagName.toLowerCase() == "table"){
				var c = this.parent.getElementsByTagName("tbody");
				if(c && c.length){ this.parent = c[0]; }
			}
		}
		this.defaultCreator = dojo.dnd._defaultCreator(this.parent);

		// process specially marked children
		this.sync();
	},

	// mouse events
	onMouseOver: function(e){
		// summary:
		//		event processor for onmouseover
		// e: Event
		//		mouse event
		var n = e.relatedTarget;
		while(n){
			if(n == this.node){ break; }
			try{
				n = n.parentNode;
			}catch(x){
				n = null;
			}
		}
		if(!n){
			this._changeState("Container", "Over");
			this.onOverEvent();
		}
		n = this._getChildByEvent(e);
		if(this.current == n){ return; }
		if(this.current){ this._removeItemClass(this.current, "Over"); }
		if(n){ this._addItemClass(n, "Over"); }
		this.current = n;
	},
	onMouseOut: function(e){
		// summary:
		//		event processor for onmouseout
		// e: Event
		//		mouse event
		for(var n = e.relatedTarget; n;){
			if(n == this.node){ return; }
			try{
				n = n.parentNode;
			}catch(x){
				n = null;
			}
		}
		if(this.current){
			this._removeItemClass(this.current, "Over");
			this.current = null;
		}
		this._changeState("Container", "");
		this.onOutEvent();
	},
	onSelectStart: function(e){
		// summary:
		//		event processor for onselectevent and ondragevent
		// e: Event
		//		mouse event
		if(!this.skipForm || !dojo.dnd.isFormElement(e)){
			dojo.stopEvent(e);
		}
	},

	// utilities
	onOverEvent: function(){
		// summary:
		//		this function is called once, when mouse is over our container
	},
	onOutEvent: function(){
		// summary:
		//		this function is called once, when mouse is out of our container
	},
	_changeState: function(type, newState){
		// summary:
		//		changes a named state to new state value
		// type: String
		//		a name of the state to change
		// newState: String
		//		new state
		var prefix = "dojoDnd" + type;
		var state  = type.toLowerCase() + "State";
		//dojo.replaceClass(this.node, prefix + newState, prefix + this[state]);
		dojo.replaceClass(this.node, prefix + newState, prefix + this[state]);
		this[state] = newState;
	},
	_addItemClass: function(node, type){
		// summary:
		//		adds a class with prefix "dojoDndItem"
		// node: Node
		//		a node
		// type: String
		//		a variable suffix for a class name
		dojo.addClass(node, "dojoDndItem" + type);
	},
	_removeItemClass: function(node, type){
		// summary:
		//		removes a class with prefix "dojoDndItem"
		// node: Node
		//		a node
		// type: String
		//		a variable suffix for a class name
		dojo.removeClass(node, "dojoDndItem" + type);
	},
	_getChildByEvent: function(e){
		// summary:
		//		gets a child, which is under the mouse at the moment, or null
		// e: Event
		//		a mouse event
		var node = e.target;
		if(node){
			for(var parent = node.parentNode; parent; node = parent, parent = node.parentNode){
				if(parent == this.parent && dojo.hasClass(node, "dojoDndItem")){ return node; }
			}
		}
		return null;
	},
	_normalizedCreator: function(/*dojo.dnd.Item*/ item, /*String*/ hint){
		// summary:
		//		adds all necessary data to the output of the user-supplied creator function
		var t = (this.creator || this.defaultCreator).call(this, item, hint);
		if(!dojo.isArray(t.type)){ t.type = ["text"]; }
		if(!t.node.id){ t.node.id = dojo.dnd.getUniqueId(); }
		dojo.addClass(t.node, "dojoDndItem");
		return t;
	}
});

dojo.dnd._createNode = function(tag){
	// summary:
	//		returns a function, which creates an element of given tag
	//		(SPAN by default) and sets its innerHTML to given text
	// tag: String
	//		a tag name or empty for SPAN
	if(!tag){ return dojo.dnd._createSpan; }
	return function(text){	// Function
		return dojo.create(tag, {innerHTML: text});	// Node
	};
};

dojo.dnd._createTrTd = function(text){
	// summary:
	//		creates a TR/TD structure with given text as an innerHTML of TD
	// text: String
	//		a text for TD
	var tr = dojo.create("tr");
	dojo.create("td", {innerHTML: text}, tr);
	return tr;	// Node
};

dojo.dnd._createSpan = function(text){
	// summary:
	//		creates a SPAN element with given text as its innerHTML
	// text: String
	//		a text for SPAN
	return dojo.create("span", {innerHTML: text});	// Node
};

// dojo.dnd._defaultCreatorNodes: Object
//		a dictionary that maps container tag names to child tag names
dojo.dnd._defaultCreatorNodes = {ul: "li", ol: "li", div: "div", p: "div"};

dojo.dnd._defaultCreator = function(node){
	// summary:
	//		takes a parent node, and returns an appropriate creator function
	// node: Node
	//		a container node
	var tag = node.tagName.toLowerCase();
	var c = tag == "tbody" || tag == "thead" ? dojo.dnd._createTrTd :
			dojo.dnd._createNode(dojo.dnd._defaultCreatorNodes[tag]);
	return function(item, hint){	// Function
		var isObj = item && dojo.isObject(item), data, type, n;
		if(isObj && item.tagName && item.nodeType && item.getAttribute){
			// process a DOM node
			data = item.getAttribute("dndData") || item.innerHTML;
			type = item.getAttribute("dndType");
			type = type ? type.split(/\s*,\s*/) : ["text"];
			n = item;	// this node is going to be moved rather than copied
		}else{
			// process a DnD item object or a string
			data = (isObj && item.data) ? item.data : item;
			type = (isObj && item.type) ? item.type : ["text"];
			n = (hint == "avatar" ? dojo.dnd._createSpan : c)(String(data));
		}
		if(!n.id){
			n.id = dojo.dnd.getUniqueId();
		}
		return {node: n, data: data, type: type};
	};
};

return dojo.dnd.Container;
});

},
'dijit/_Widget':function(){
define("dijit/_Widget", [
	"dojo/aspect",	// aspect.around
	"dojo/_base/config",	// config.isDebug
	"dojo/_base/connect",	// connect.connect
	"dojo/_base/declare", // declare
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/_base/lang", // lang.hitch
	"dojo/query",
	"dojo/ready",
	"./registry",	// registry.byNode
	"./_WidgetBase",
	"./_OnDijitClickMixin",
	"./_FocusMixin",
	"dojo/uacss",		// browser sniffing (included for back-compat; subclasses may be using)
	"./hccss"		// high contrast mode sniffing (included to set CSS classes on <body>, module ret value unused)
], function(aspect, config, connect, declare, kernel, lang, query, ready,
			registry, _WidgetBase, _OnDijitClickMixin, _FocusMixin){

/*=====
	var _WidgetBase = dijit._WidgetBase;
	var _OnDijitClickMixin = dijit._OnDijitClickMixin;
	var _FocusMixin = dijit._FocusMixin;
=====*/


// module:
//		dijit/_Widget
// summary:
//		Old base for widgets.   New widgets should extend _WidgetBase instead


function connectToDomNode(){
	// summary:
	//		If user connects to a widget method === this function, then they will
	//		instead actually be connecting the equivalent event on this.domNode
}

// Trap dojo.connect() calls to connectToDomNode methods, and redirect to _Widget.on()
function aroundAdvice(originalConnect){
	return function(obj, event, scope, method){
		if(obj && typeof event == "string" && obj[event] == connectToDomNode){
			return obj.on(event.substring(2).toLowerCase(), lang.hitch(scope, method));
		}
		return originalConnect.apply(connect, arguments);
	};
}
aspect.around(connect, "connect", aroundAdvice);
if(kernel.connect){
	aspect.around(kernel, "connect", aroundAdvice);
}

var _Widget = declare("dijit._Widget", [_WidgetBase, _OnDijitClickMixin, _FocusMixin], {
	// summary:
	//		Base class for all Dijit widgets.
	//
	//		Extends _WidgetBase, adding support for:
	//			- declaratively/programatically specifying widget initialization parameters like
	//				onMouseMove="foo" that call foo when this.domNode gets a mousemove event
	//			- ondijitclick
	//				Support new data-dojo-attach-event="ondijitclick: ..." that is triggered by a mouse click or a SPACE/ENTER keypress
	//			- focus related functions
	//				In particular, the onFocus()/onBlur() callbacks.   Driven internally by
	//				dijit/_base/focus.js.
	//			- deprecated methods
	//			- onShow(), onHide(), onClose()
	//
	//		Also, by loading code in dijit/_base, turns on:
	//			- browser sniffing (putting browser id like .dj_ie on <html> node)
	//			- high contrast mode sniffing (add .dijit_a11y class to <body> if machine is in high contrast mode)


	////////////////// DEFERRED CONNECTS ///////////////////

	onClick: connectToDomNode,
	/*=====
	onClick: function(event){
		// summary:
		//		Connect to this function to receive notifications of mouse click events.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onDblClick: connectToDomNode,
	/*=====
	onDblClick: function(event){
		// summary:
		//		Connect to this function to receive notifications of mouse double click events.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onKeyDown: connectToDomNode,
	/*=====
	onKeyDown: function(event){
		// summary:
		//		Connect to this function to receive notifications of keys being pressed down.
		// event:
		//		key Event
		// tags:
		//		callback
	},
	=====*/
	onKeyPress: connectToDomNode,
	/*=====
	onKeyPress: function(event){
		// summary:
		//		Connect to this function to receive notifications of printable keys being typed.
		// event:
		//		key Event
		// tags:
		//		callback
	},
	=====*/
	onKeyUp: connectToDomNode,
	/*=====
	onKeyUp: function(event){
		// summary:
		//		Connect to this function to receive notifications of keys being released.
		// event:
		//		key Event
		// tags:
		//		callback
	},
	=====*/
	onMouseDown: connectToDomNode,
	/*=====
	onMouseDown: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse button is pressed down.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseMove: connectToDomNode,
	/*=====
	onMouseMove: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse moves over nodes contained within this widget.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseOut: connectToDomNode,
	/*=====
	onMouseOut: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse moves off of nodes contained within this widget.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseOver: connectToDomNode,
	/*=====
	onMouseOver: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse moves onto nodes contained within this widget.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseLeave: connectToDomNode,
	/*=====
	onMouseLeave: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse moves off of this widget.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseEnter: connectToDomNode,
	/*=====
	onMouseEnter: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse moves onto this widget.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseUp: connectToDomNode,
	/*=====
	onMouseUp: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse button is released.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/

	constructor: function(params){
		// extract parameters like onMouseMove that should connect directly to this.domNode
		this._toConnect = {};
		for(var name in params){
			if(this[name] === connectToDomNode){
				this._toConnect[name.replace(/^on/, "").toLowerCase()] = params[name];
				delete params[name];
			}
		}
	},

	postCreate: function(){
		this.inherited(arguments);

		// perform connection from this.domNode to user specified handlers (ex: onMouseMove)
		for(var name in this._toConnect){
			this.on(name, this._toConnect[name]);
		}
		delete this._toConnect;
	},

	on: function(/*String*/ type, /*Function*/ func){
		if(this[this._onMap(type)] === connectToDomNode){
			// Use connect.connect() rather than on() to get handling for "onmouseenter" on non-IE, etc.
			// Also, need to specify context as "this" rather than the default context of the DOMNode
			return connect.connect(this.domNode, type.toLowerCase(), this, func);
		}
		return this.inherited(arguments);
	},

	_setFocusedAttr: function(val){
		// Remove this method in 2.0 (or sooner), just here to set _focused == focused, for back compat
		// (but since it's a private variable we aren't required to keep supporting it).
		this._focused = val;
		this._set("focused", val);
	},

	////////////////// DEPRECATED METHODS ///////////////////

	setAttribute: function(/*String*/ attr, /*anything*/ value){
		// summary:
		//		Deprecated.  Use set() instead.
		// tags:
		//		deprecated
		kernel.deprecated(this.declaredClass+"::setAttribute(attr, value) is deprecated. Use set() instead.", "", "2.0");
		this.set(attr, value);
	},

	attr: function(/*String|Object*/name, /*Object?*/value){
		// summary:
		//		Set or get properties on a widget instance.
		//	name:
		//		The property to get or set. If an object is passed here and not
		//		a string, its keys are used as names of attributes to be set
		//		and the value of the object as values to set in the widget.
		//	value:
		//		Optional. If provided, attr() operates as a setter. If omitted,
		//		the current value of the named property is returned.
		// description:
		//		This method is deprecated, use get() or set() directly.

		// Print deprecation warning but only once per calling function
		if(config.isDebug){
			var alreadyCalledHash = arguments.callee._ach || (arguments.callee._ach = {}),
				caller = (arguments.callee.caller || "unknown caller").toString();
			if(!alreadyCalledHash[caller]){
				kernel.deprecated(this.declaredClass + "::attr() is deprecated. Use get() or set() instead, called from " +
				caller, "", "2.0");
				alreadyCalledHash[caller] = true;
			}
		}

		var args = arguments.length;
		if(args >= 2 || typeof name === "object"){ // setter
			return this.set.apply(this, arguments);
		}else{ // getter
			return this.get(name);
		}
	},

	getDescendants: function(){
		// summary:
		//		Returns all the widgets contained by this, i.e., all widgets underneath this.containerNode.
		//		This method should generally be avoided as it returns widgets declared in templates, which are
		//		supposed to be internal/hidden, but it's left here for back-compat reasons.

		kernel.deprecated(this.declaredClass+"::getDescendants() is deprecated. Use getChildren() instead.", "", "2.0");
		return this.containerNode ? query('[widgetId]', this.containerNode).map(registry.byNode) : []; // dijit._Widget[]
	},

	////////////////// MISCELLANEOUS METHODS ///////////////////

	_onShow: function(){
		// summary:
		//		Internal method called when this widget is made visible.
		//		See `onShow` for details.
		this.onShow();
	},

	onShow: function(){
		// summary:
		//		Called when this widget becomes the selected pane in a
		//		`dijit.layout.TabContainer`, `dijit.layout.StackContainer`,
		//		`dijit.layout.AccordionContainer`, etc.
		//
		//		Also called to indicate display of a `dijit.Dialog`, `dijit.TooltipDialog`, or `dijit.TitlePane`.
		// tags:
		//		callback
	},

	onHide: function(){
		// summary:
			//		Called when another widget becomes the selected pane in a
			//		`dijit.layout.TabContainer`, `dijit.layout.StackContainer`,
			//		`dijit.layout.AccordionContainer`, etc.
			//
			//		Also called to indicate hide of a `dijit.Dialog`, `dijit.TooltipDialog`, or `dijit.TitlePane`.
			// tags:
			//		callback
	},

	onClose: function(){
		// summary:
		//		Called when this widget is being displayed as a popup (ex: a Calendar popped
		//		up from a DateTextBox), and it is hidden.
		//		This is called from the dijit.popup code, and should not be called directly.
		//
		//		Also used as a parameter for children of `dijit.layout.StackContainer` or subclasses.
		//		Callback if a user tries to close the child.   Child will be closed if this function returns true.
		// tags:
		//		extension

		return true;		// Boolean
	}
});

// For back-compat, remove in 2.0.
if(!kernel.isAsync){
	ready(0, function(){
		var requires = ["dijit/_base"];
		require(requires);	// use indirection so modules not rolled into a build
	});
}
return _Widget;
});

},
'dojo/touch':function(){
define(["./_base/kernel", "./on", "./has", "./mouse"], function(dojo, on, has, mouse){
// module:
//		dojo/touch

/*=====
	dojo.touch = {
		// summary:
		//		This module provides unified touch event handlers by exporting
		//		press, move, release and cancel which can also run well on desktop.
		//		Based on http://dvcs.w3.org/hg/webevents/raw-file/tip/touchevents.html
		//
		// example:
		//		1. Used with dojo.connect()
		//		|	dojo.connect(node, dojo.touch.press, function(e){});
		//		|	dojo.connect(node, dojo.touch.move, function(e){});
		//		|	dojo.connect(node, dojo.touch.release, function(e){});
		//		|	dojo.connect(node, dojo.touch.cancel, function(e){});
		//
		//		2. Used with dojo.on
		//		|	define(["dojo/on", "dojo/touch"], function(on, touch){
		//		|		on(node, touch.press, function(e){});
		//		|		on(node, touch.move, function(e){});
		//		|		on(node, touch.release, function(e){});
		//		|		on(node, touch.cancel, function(e){});
		//
		//		3. Used with dojo.touch.* directly
		//		|	dojo.touch.press(node, function(e){});
		//		|	dojo.touch.move(node, function(e){});
		//		|	dojo.touch.release(node, function(e){});
		//		|	dojo.touch.cancel(node, function(e){});
		
		press: function(node, listener){
			// summary:
			//		Register a listener to 'touchstart'|'mousedown' for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		move: function(node, listener){
			// summary:
			//		Register a listener to 'touchmove'|'mousemove' for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		release: function(node, listener){
			// summary:
			//		Register a listener to 'touchend'|'mouseup' for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		cancel: function(node, listener){
			// summary:
			//		Register a listener to 'touchcancel'|'mouseleave' for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		}
	};
=====*/

	function _handle(/*String - press | move | release | cancel*/type){
		return function(node, listener){//called by on(), see dojo.on
			return on(node, type, listener);
		};
	}
	var touch = has("touch");
	//device neutral events - dojo.touch.press|move|release|cancel
	dojo.touch = {
		press: _handle(touch ? "touchstart": "mousedown"),
		move: _handle(touch ? "touchmove": "mousemove"),
		release: _handle(touch ? "touchend": "mouseup"),
		cancel: touch ? _handle("touchcancel") : mouse.leave
	};
	return dojo.touch;
});
},
'dojox/grid/DataSelection':function(){
define("dojox/grid/DataSelection", [
	"dojo/_base/declare",
	"./_SelectionPreserver",
	"./Selection"
], function(declare, _SelectionPreserver, Selection){
	
return declare("dojox.grid.DataSelection", Selection, {
	constructor: function(grid){
		if(grid.keepSelection){
			this.preserver = new _SelectionPreserver(this);
		}
	},
	
	destroy: function(){
		if(this.preserver){
			this.preserver.destroy();
		}
	},
	
	getFirstSelected: function(){
		var idx = Selection.prototype.getFirstSelected.call(this);

		if(idx == -1){ return null; }
		return this.grid.getItem(idx);
	},

	getNextSelected: function(inPrev){
		var old_idx = this.grid.getItemIndex(inPrev);
		var idx = Selection.prototype.getNextSelected.call(this, old_idx);

		if(idx == -1){ return null; }
		return this.grid.getItem(idx);
	},

	getSelected: function(){
		var result = [];
		for(var i=0, l=this.selected.length; i<l; i++){
			if(this.selected[i]){
				result.push(this.grid.getItem(i));
			}
		}
		return result;
	},

	addToSelection: function(inItemOrIndex){
		if(this.mode == 'none'){ return; }
		var idx = null;
		if(typeof inItemOrIndex == "number" || typeof inItemOrIndex == "string"){
			idx = inItemOrIndex;
		}else{
			idx = this.grid.getItemIndex(inItemOrIndex);
		}
		Selection.prototype.addToSelection.call(this, idx);
	},

	deselect: function(inItemOrIndex){
		if(this.mode == 'none'){ return; }
		var idx = null;
		if(typeof inItemOrIndex == "number" || typeof inItemOrIndex == "string"){
			idx = inItemOrIndex;
		}else{
			idx = this.grid.getItemIndex(inItemOrIndex);
		}
		Selection.prototype.deselect.call(this, idx);
	},

	deselectAll: function(inItemOrIndex){
		var idx = null;
		if(inItemOrIndex || typeof inItemOrIndex == "number"){
			if(typeof inItemOrIndex == "number" || typeof inItemOrIndex == "string"){
				idx = inItemOrIndex;
			}else{
				idx = this.grid.getItemIndex(inItemOrIndex);
			}
			Selection.prototype.deselectAll.call(this, idx);
		}else{
			this.inherited(arguments);
		}
	}
});
});
},
'dojox/grid/_SelectionPreserver':function(){
define("dojox/grid/_SelectionPreserver", [
	"dojo/_base/declare",
	"dojo/_base/connect",
	"dojo/_base/lang",
	"dojo/_base/array"
], function(declare, connect, lang, array){

return declare("dojox.grid._SelectionPreserver", null, {
	// summary:
	//		Preserve selections across various user actions.
	//
	// description:
	//		When this feature is turned on, Grid will try to preserve selections across actions, e.g. sorting, filtering etc.
	//
	//		Precondition - Identifier(id) is required for store since id is the only way for differentiating row items.
	//		Known issue - The preserved selections might be inaccurate if some unloaded rows are previously selected by range(e.g.SHIFT + click)
	//
	// example:
	// |	//To turn on this - please set 'keepSelection' attribute to true
	// |	<div dojoType="dojox.grid.DataGrid" keepSelection = true .../>
	// |	<div dojoType="dojox.grid.TreeGrid" keepSelection = true .../>
	// |	<div dojoType="dojox.grid.LazyTreeGrid" keepSelection = true .../>
	
	constructor: function(selection){
		this.selection = selection;
		var grid = this.grid = selection.grid;
		this.reset();
		this._connects = [
			connect.connect(grid, '_setStore', this, 'reset'),
			connect.connect(grid, '_addItem', this, '_reSelectById'),
			connect.connect(selection, 'addToSelection', lang.hitch(this, '_selectById', true)),
			connect.connect(selection, 'deselect', lang.hitch(this, '_selectById', false)),
			connect.connect(selection, 'deselectAll', this, 'reset')
		];
	},
	destroy: function(){
		this.reset();
		array.forEach(this._connects, connect.disconnect);
		delete this._connects;
	},
	reset: function(){
		this._selectedById = {};
	},
	_reSelectById: function(item, index){
		// summary:
		//		When some rows is fetched, determine whether it should be selected.
		if(item && this.grid._hasIdentity){
			this.selection.selected[index] = this._selectedById[this.grid.store.getIdentity(item)];
		}
	},
	_selectById: function(toSelect, inItemOrIndex){
		// summary:
		//		Record selected rows by ID.
		if(this.selection.mode == 'none' || !this.grid._hasIdentity){ return; }
		var item = inItemOrIndex, g = this.grid;
		if(typeof inItemOrIndex == "number" || typeof inItemOrIndex == "string"){
			var entry = g._by_idx[inItemOrIndex];
			item = entry && entry.item;
		}
		if(item){
			this._selectedById[g.store.getIdentity(item)] = !!toSelect;
		}
		return item;
	}
});
});
},
'esri/layers/FeatureLayer':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/layers/graphics,esri/tasks/query,dojo/io/iframe,esri/layers/agscommon,dojo/date/locale"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.FeatureLayer");

dojo.require("esri.layers.graphics");
dojo.require("esri.tasks.query");
dojo.require("dojo.io.iframe");
dojo.require("esri.layers.agscommon");
dojo.require("dojo.date.locale");

// TODO
// Support for spatial definition in snapshot mode
// Optimize zoom-in operation in on-demand mode
// In snapshot mode, "selection" and "query" should happen on the client for most cases.
// Looks like we need to "suspend" the layer when the layer defn and map time extent did not overlap 
// [NEED TO REPRO] In snapshot mode, panning after zooming into a small area with a handful of features causes page freeze for a while.
//   - Need to optimize this based on a spatial index featureMap/cellMap similar to on-demand mode
// what about onLoad, onUpdate(on-demand mode) etc?
// onUpdate/onRefresh/onRedraw
// data store
// clustering
// modify GL to perform clipping using the grid extent in ondemand mode
// should the graphics layer always display the selected features? (clipping). Yes - it will be good for user experience 
// [FIXED] modify esri.request to fix the etag issue - utils.js, query.js, xhr.js
// [DONE] time offset
// [DONE] Client-side selection should honor query.timeExtent (i.e. time definition, map time extent)
// [DONE] Apply - layer defn expr, layer time defn, map time extent - to selectFeatures, queryFeatures, queryIds
// [DONE] Layer refresh is not honoring the map's time extent
// [DONE] Snapshot mode should honor map time extent (i.e. filter) after querying
// [DONE] Add refresh impl
// [NON-ISSUE] fix coded values domain format
// [DONE] min/max scale
// [DONE] enable infoTemplate
// [PARTIAL] [haitham] select a feature and move it, then zoom in, the feature layer shows the feature in the old location
//   - the feature will be in the new location as long as it remains selected thru the zoom operation
//   - need not be selected if the FL caches features across zoom levels
// [JEREMY] Unable to change the selection symbol between various types.
// [DONE] Add add/remove/refresh impl [NOTE: may be revoked later]
// [DONE] do not "select" when double clicking on a feature (map zoom in).
// [AS DESIGNED] add selectFeatures(oids/features, selectionMethod)?
// [DONE] add query methods
// [DONE] definition expression. set "null" in snapshot mode does "1=1", in ondemand mode uses "null". getter should return appropriate value
// [DONE] initial implementation for editing
// [DONE] add "map-render" mode
// [DONE] outFields issue - oidField in snapshot, ondemand modes
// [DONE] cannot lose selection on zoom in/out, property change
// [DONE] add "paging" mode for tables? - FeatureLayer will act as a data source in this case.
// [DONE] update/finish snapshot mode
// [DONE] get rid of the dependency on layer's full extent (need to discuss this with keyur again)
// [DONE] cannot remove a "selected" feature even when it goes out of focus or extent changes
// [DONE] panning the map by dragging on a feature "selects" it. fix it. -- jayant fixed it for 1.5 - yay! 

/***************************
 * esri.layers.FeatureLayer
 ***************************/

dojo.declare("esri.layers.FeatureLayer", esri.layers.GraphicsLayer, {
  
  /************
   * Overrides 
   ************/
  
  // TODO
  // At Dojo 1.4, we have more control over how the constructor
  // chaining happens between subclass and super classes.
  // When we move to 1.4, we need to take advantage of that
  // and remove the ugly hack from <_GraphicsLayer> constructor
  // REF: http://docs.dojocampus.org/dojo/declare#manual-constructor-chaining

  constructor: function(/*String*/ url, /*Object?*/ options) {
    // "url" is processed by <Layer> and "options" is processed by <_GraphicsLayer>
    //console.log("featurelayer: ", url, options);
    
    // custom options
    this._outFields = options && options.outFields;
    //this._infoTemplate = options && options.infoTemplate; // || "${*}";
    this._loadCallback = options && options.loadCallback;
    
    var patch = options && options._usePatch;
    this._usePatch = (patch === null || patch === undefined) ? true : patch;
    //console.log("patch status: ", this._usePatch);
    
    this._trackIdField = options && options.trackIdField;
    this.objectIdField = options && options.objectIdField;
    this._maxOffset = options && options.maxAllowableOffset;
    this._optEditable = options && options.editable;
    this._optAutoGen = options && options.autoGeneralize;
    this.editSummaryCallback = options && options.editSummaryCallback;
    this.userId = options && options.userId;
    this.userIsAdmin = options && options.userIsAdmin;

    this.useMapTime = (options && options.hasOwnProperty("useMapTime")) ? 
                      (!!options.useMapTime) : 
                      true;
    this.source = options && options.source;
    this.gdbVersion = options && options.gdbVersion;
    
    // other defaults
    this._selectedFeatures = {};
    this._selectedFeaturesArr = [];
    this._newFeatures = [];
    this._deletedFeatures = {};

    // this value will be unique for each feature layer
    // in an application
    this._ulid = this._getUniqueId();
    
    // construct appropriate "mode"
    var ctor = this.constructor, mode = this.mode = (esri._isDefined(options && options.mode) ? options.mode : ctor.MODE_ONDEMAND);
    switch(mode) {
      case ctor.MODE_SNAPSHOT:
        this._mode = new esri.layers._SnapshotMode(this);
        this._isSnapshot = true;
        break;
      case ctor.MODE_ONDEMAND:
        this._tileWidth = (options && options.tileWidth) || 512;
        this._tileHeight = (options && options.tileHeight) || 512;
        this._mode = new esri.layers._OnDemandMode(this);
    
        var lattice = options && options.latticeTiling;
        this.latticeTiling = /*!esri._isDefined(lattice) ||*/ lattice;
        break;
      case ctor.MODE_SELECTION:
        this._mode = new esri.layers._SelectionMode(this);
        this._isSelOnly = true;
        break;
    }

    this._initLayer = dojo.hitch(this, this._initLayer);
    //this._preprocess = dojo.hitch(this, this._preprocess);
    this._selectHandler = dojo.hitch(this, this._selectHandler);
    this._editable = false;
    
    // Deal with feature collection
    if (dojo.isObject(url) && url.layerDefinition) {
      var json = url;
      this._collection = true;
      this.mode = ctor.MODE_SNAPSHOT;
      this._initLayer(json);
      return this;
    }

    this._task = new esri.tasks.QueryTask(this.url, {
      source: this.source, 
      gdbVersion: this.gdbVersion
    });
    
    // is the layer editable?
    var urlPath = this._url.path;
    this._fserver = false;
    if (urlPath.search(/\/FeatureServer\//i) !== -1) {
      // TODO
      // template picker uses this variable as well
      this._fserver = true;
      //console.log(" -- is editable --");
    }

    var resourceInfo = options && options.resourceInfo;
    if (resourceInfo) {
      this._initLayer(resourceInfo);
    }
    else {
      // fetch layer information
      if (this.source) {
        var layer = {source: this.source.toJson()};
        this._url.query = dojo.mixin(this._url.query, {layer: dojo.toJson(layer)});
      }
      if (this.gdbVersion) {
        this._url.query = dojo.mixin(this._url.query, {gdbVersion: this.gdbVersion});
      }
      esri.request({
        url: urlPath,
        content: dojo.mixin({ f:"json" }, this._url.query),
        callbackParamName: "callback",
        load: this._initLayer, // this._preprocess,
        error: this._errorHandler
      });
    }
  },
  
  // (override)
  _initLayer: function(response, io) {
    // do not enter if this method is invoked by GraphicsLayer constructor
    if (response || io) {
      this._json = response; // TODO
      
      this._findCredential();
      
      // See esri.request for context regarding "_ssl"
      var ssl = (this.credential && this.credential.ssl) || (response && response._ssl);
      if (ssl) {
        this._useSSL();
        this._task._useSSL();
      }
      
      // check if this an ArcGIS Online Feature Collection Item
      if (this._collection) {
        // force snapshot mode
        this._mode = new esri.layers._SnapshotMode(this);
        this._isSnapshot = true;
        this._featureSet = response.featureSet;
        this._nextId = response.nextObjectId; // webmap spec
        response = response.layerDefinition;
      }
      
      if (response.hasOwnProperty("capabilities")) {
        var capabilities = (this.capabilities = response.capabilities);
        if (capabilities && capabilities.toLowerCase().indexOf("editing") !== -1) {
          this._editable = true;
        }
        else {
          this._editable = false;
        }
      }
      else if (!this._collection) {
        this._editable = this._fserver;
      }
      
      if (esri._isDefined(this._optEditable)) {
        this._editable = this._optEditable;
        delete this._optEditable;
      }
      
      //if (!this._collection) {
        // let's serialize and store
        this._json = dojo.toJson(this._json);
      //}
      
      // offset not applicable when the layer is editable
      if (this.isEditable()) {
        delete this._maxOffset;
      }
      // autoGeneralize applicable to non-editable, on-demand layers only
      else if (
        this.mode !== this.constructor.MODE_SNAPSHOT &&
        ((response.geometryType === "esriGeometryPolyline") || (response.geometryType === "esriGeometryPolygon"))
      ) {
        this._autoGeneralize = esri._isDefined(this._optAutoGen) ? 
                                this._optAutoGen :
                                (this.mode === this.constructor.MODE_ONDEMAND); 
        delete this._optAutoGen;
      }
      
      // process layer information
      this.minScale = response.effectiveMinScale || response.minScale || 0;
      this.maxScale = response.effectiveMaxScale || response.maxScale || 0;

      this.layerId = response.id;
      this.name = response.name;
      this.description = response.description;
      this.copyright = response.copyrightText;
      this.type = response.type;
      this.geometryType = response.geometryType;
      this.displayField = response.displayField;
      this.defaultDefinitionExpression = response.definitionExpression;
      this.fullExtent = new esri.geometry.Extent(response.extent);
      this.defaultVisibility = response.defaultVisibility;
      
      // disable lattice tiling for point and multipoint layers
      if (
        (this.geometryType === "esriGeometryPoint") || 
        (this.geometryType === "esriGeometryMultipoint")
      ) {
        this.latticeTiling = false;
      }
      
      // properties added since server 10.1
      this.indexedFields = response.indexedFields;
      this.maxRecordCount = response.maxRecordCount;
      this.canModifyLayer = response.canModifyLayer;
      this.supportsStatistics = response.supportsStatistics;
      this.supportsAdvancedQueries = response.supportsAdvancedQueries;
      this.hasLabels = response.hasLabels;
      this.canScaleSymbols = response.canScaleSymbols;
      this.supportsRollbackOnFailure = response.supportsRollbackOnFailure;
      this.syncCanReturnChanges = response.syncCanReturnChanges;
      this.isDataVersioned = response.isDataVersioned;
      this.editFieldsInfo = response.editFieldsInfo;
      this.ownershipBasedAccessControlForFeatures = response.ownershipBasedAccessControlForFeatures;
      if (this.editFieldsInfo && this.ownershipBasedAccessControlForFeatures) {
        this.creatorField = this.editFieldsInfo.creatorField;
      }
      this.relationships = response.relationships;
      this.allowGeometryUpdates = esri._isDefined(response.allowGeometryUpdates) ? response.allowGeometryUpdates : true;
      
      this._isTable = (this.type === "Table");
      
      // TODO
      // This is related to adding a FL as the base map layer. There
      // are some difficulties in _addLayerHandler in map code.
      //this.spatialReference = this.fullExtent.spatialReference;
      
      // fields
      var fieldObjs = (this.fields = []),
          fields = response.fields, i;
      
      for (i = 0; i < fields.length; i++) {
        fieldObjs.push(new esri.layers.Field(fields[i]));
      }
      
      // determine object id field for this layer
      if (!this.objectIdField) {
        /*if (this._collection) {
          this.objectIdField = "__object__id__";
        }
        else {*/
          this.objectIdField = response.objectIdField;
          if (!this.objectIdField) {
            // identify the field that provides unique id for the features in the layer
            fields = response.fields;
            for (i = 0; i < fields.length; i++) {
              var field = fields[i];
              if (field.type === "esriFieldTypeOID") {
                this.objectIdField = field.name;
                break;
              }
            }
          }
        //}
        
        if (!this.objectIdField) {
          console.debug("esri.layers.FeatureLayer: " + esri.substitute({ url: this.url }, esri.bundle.layers.FeatureLayer.noOIDField));
        }
      }

      if (!esri._isDefined(this._nextId)) {
        // Let's determine the oid that we need to use if a feature
        // is added
        var oidField = this.objectIdField, maxId = -1;
        if (this._collection && oidField) {
          var fset = this._featureSet, 
              features = fset && fset.features, 
              il = features ? features.length : 0, oid, attr;
          
          // find the max of existing oids
          for (i = 0; i < il; i++) {
            attr = features[i].attributes;
            oid = attr && attr[oidField];
    
            if (oid > maxId) {
              maxId = oid;
            }
          }
        }
        
        this._nextId = /*(maxId === -1) ? this._getUniqueId() :*/ (maxId + 1);
      }
      
      this.globalIdField = response.globalIdField;
      
      var fieldName = (this.typeIdField = response.typeIdField), fieldInfo;

      // Fix typeIdField if necessary - it's known to have different case
      // compared to this.fields
      if (fieldName) {
        fieldInfo = !this._getField(fieldName) && this._getField(fieldName, true);
        
        if (fieldInfo) {
          this.typeIdField = fieldInfo.name;
        }
      }
      
      // webmap spec
      this.visibilityField = response.visibilityField;
      
      // default symbol
      var symbol = response.defaultSymbol;

      if (symbol) {
        this.defaultSymbol = esri.symbol.fromJson(symbol);
      }
      
      // sub-types
      var typeObjs = this.types = [],
          types = response.types,
          fType, fTemplates, protoAttributes,
          fieldsInfo = this.editFieldsInfo, 
          creatorField = fieldsInfo && fieldsInfo.creatorField,
          editorField = fieldsInfo && fieldsInfo.editorField,
          fix = (creatorField || editorField), fixList = [];
          
      if (types) {
        for (i = 0; i < types.length; i++) {
          fType = new esri.layers.FeatureType(types[i]);
          
          fTemplates = fType.templates;
          if (fix && fTemplates && fTemplates.length) {
            fixList = fixList.concat(fTemplates);
          }
          
          typeObjs.push(fType);
        }
      }
      
      // templates for the layer
      var templates = response.templates, template,
          templateObjs = this.templates = [];
          
      if (templates) {
        for (i = 0; i < templates.length; i++) {
          template = new esri.layers.FeatureTemplate(templates[i]);
          
          if (fix) {
            fixList.push(template);
          }
          
          templateObjs.push(template);
        }
      }
      
      // Fix 10.1 server bug where prototypes contain null values for 
      // creator and editor fields. null values have special meaning as
      // userIds and hence should not be returned with prototypes
      // Server CR 222052 (Prototype feature should not return the read-only fields) 
      // for this issue is scheduled to be fixed in 10.1 SP1
      for (i = 0; i < fixList.length; i++) {
        protoAttributes = dojo.getObject("prototype.attributes", false, fixList[i]);

        if (protoAttributes) {
          if (creatorField) {
            delete protoAttributes[creatorField];
          }
          if (editorField) {
            delete protoAttributes[editorField];
          }
        }
      }
      
      // the layer is time aware if it has time info
      var timeInfo = response.timeInfo;
      if (timeInfo) {
        this.timeInfo = new esri.layers.TimeInfo(timeInfo);
        this._startTimeField = timeInfo.startTimeField;
        this._endTimeField = timeInfo.endTimeField;
        if (this._startTimeField && this._endTimeField) {
          this._twoTimeFields = true;
        }
        
        if (this._trackIdField) {
          timeInfo.trackIdField = this._trackIdField;
        }
        else {
          this._trackIdField = timeInfo.trackIdField;
        }
      }
      
      this.hasAttachments = (!this._collection && response.hasAttachments) ? true : false;
      this.htmlPopupType = response.htmlPopupType;

      var drawingInfo = response.drawingInfo, renderer;      
      if (!this.renderer) {
        
        if (drawingInfo && drawingInfo.renderer) {
          renderer = drawingInfo.renderer;
          this.setRenderer(esri.renderer.fromJson(renderer));
          if (renderer.type === "classBreaks") {
            this.renderer._setMaxInclusiveness(true);
          }
          
          // translate relative image resources defined in pms/pfs to absolute paths
          // see - http://nil/rest-docs/msimage.html
          if (!this._collection) {
            
            var rendererType = renderer.type, symbols = [];
            renderer = this.renderer;
            
            switch(rendererType) {
              case "simple":
                symbols.push(renderer.symbol);
                break;
              case "uniqueValue":
              case "classBreaks":
                symbols.push(renderer.defaultSymbol);
                symbols = symbols.concat(dojo.map(renderer.infos, function(info) {
                  return info.symbol;
                }));
                break;
            } // switch
            
            symbols = dojo.filter(symbols, esri._isDefined);
            
            var baseUrl = this._url.path + "/images/", token = this._getToken();
            dojo.forEach(symbols, function(sym) {
              var url = sym.url;
              if (url) {
                // translate relative image resources defined in pms/pfs to absolute paths
                if ( (url.search(/https?\:/) === -1) && (url.indexOf("data:") === -1) ) {
                  sym.url = baseUrl + url;
                }
                //console.log(sym.url);
                
                // append token
                if (token && sym.url.search(/https?\:/) !== -1) {
                  sym.url += ("?token=" + token);
                }
              }
            });
            
          } // not a collection
        }
        else if (symbol) { // default symbol defined in the layer resource
          types = this.types;
          if (types.length > 0) {
            renderer = new esri.renderer.UniqueValueRenderer(this.defaultSymbol, this.typeIdField);
            
            dojo.forEach(types, function(type) {
              renderer.addValue(type.id, type.symbol);
            });
          }
          else {
            renderer = new esri.renderer.SimpleRenderer(this.defaultSymbol);
          }
          
          this.setRenderer(renderer);
        }
        else if (!this._isTable) { // fallback
          var fallbackSymbol;
          switch(this.geometryType) {
            case "esriGeometryPoint":
            case "esriGeometryMultipoint":
              fallbackSymbol = new esri.symbol.SimpleMarkerSymbol();
              break;
            case "esriGeometryPolyline":
              fallbackSymbol = new esri.symbol.SimpleLineSymbol();
              break;
            case "esriGeometryPolygon":
              fallbackSymbol = new esri.symbol.SimpleFillSymbol();
              break;
          }
          
          this.setRenderer(fallbackSymbol ? new esri.renderer.SimpleRenderer(fallbackSymbol) : null);
        }
      } // renderer
      
      // layer transparency
      var transparency = (drawingInfo && drawingInfo.transparency) || 0 ;
      if (!esri._isDefined(this.opacity) && transparency > 0) {
        this.opacity = 1 - (transparency / 100);
      }
    
//      // initialize the "mode" with layer info
//      var mode = this._mode;
//      if (mode) {
//        mode.layerInfoHandler(response);
//      }

      // REST added currentVersion property to some resources
      // at 10 SP1
      this.version = response.currentVersion;
      
      if (!this.version) {
        var ver;
        
        if (
          "capabilities" in response || "drawingInfo" in response || 
          "hasAttachments" in response || "htmlPopupType" in response || 
          "relationships" in response || "timeInfo" in response || 
          "typeIdField" in response || "types" in response 
        ) {
          ver = 10;
        }
        else {
          ver = 9.3; // or could be 9.3.1
        }
        
        this.version = ver;
      } // version
      
      if ((dojo.isIE || dojo.isSafari) && this.isEditable() && this.version < 10.02) {
        this._ts = true;
      }
      
      // announce "loaded", imples ready to be added to the map
      this.loaded = true;
      
      this._fixRendererFields();
      this._checkFields();
      this._updateCaps();

      if (this._collection) {
        this._fireUpdateStart();
        
        var featureSet = this._featureSet;
        delete this._featureSet;
        
        this._mode._drawFeatures(new esri.tasks.FeatureSet(featureSet));
        this._fcAdded = true;
      }

      this.onLoad(this);
      var callback = this._loadCallback;
      if (callback) {
        delete this._loadCallback;
        callback(this);
      }
    }
  },
    
  // (extend)
  setRenderer: function(ren) {
    this.inherited("setRenderer", arguments);
    
    var renderer = this.renderer;
    if (renderer) {
      this._ager = (renderer.declaredClass.indexOf("TemporalRenderer") !== -1 && renderer.observationAger && renderer.observationRenderer);
      
      var renderers = dojo.filter([
        renderer, renderer.observationRenderer, 
        renderer.latestObservationRenderer, renderer.trackRenderer
      ], esri._isDefined);
      
      var fields = [];
      dojo.forEach(renderers, function(rnd) {
        fields.push(rnd.attributeField);
        fields.push(rnd.attributeField2);
        fields.push(rnd.attributeField3);
      }, this);
      this._rendererFields = dojo.filter(fields, esri._isDefined);
    } 
    else {
      this._ager = false;
      this._rendererFields = [];
    }
    
    if (this.loaded && this._rendererFields.length > 0) {
      this._fixRendererFields();
      this._checkFields(this._rendererFields);
    }

    if (this.loaded && this._collection) {
      // we want to write out the renderer in toJson()
      this._typesDirty = true;
    }
  },

  // (extend)
  _setMap: function(map, surface) {
    this._map = map;

    // if the layer is time-aware, listen for changes in time extent
    this._toggleTime(true);
    
    // invoke superclass version of this method
    var div = this.inherited("_setMap", arguments);
    
    this.clearSelection(); // flush out features brought down before being added to the map
    
    // do we have a temporal renderer?
    var renderer = this.renderer;
    /*if (renderer) {
      this._ager = (renderer.declaredClass.indexOf("TemporalRenderer") !== -1 && renderer.observationAger);
      
      //this._rendererAttrField = renderer.observationRenderer ? renderer.observationRenderer.attributeField : renderer.attributeField;
      
      var renderers = dojo.filter([
        renderer, renderer.observationRenderer, 
        renderer.latestObservationRenderer, renderer.trackRenderer
      ], esri._isDefined);
      
      var fields = [];
      dojo.forEach(renderers, function(rnd) {
        fields.push(rnd.attributeField);
        fields.push(rnd.attributeField2);
        fields.push(rnd.attributeField3);
      });
      this._rendererFields = dojo.filter(fields, esri._isDefined);
    } 
    
    this._checkFields();*/
    
    if (this.timeInfo) {
      // tracking management
      if (this._trackIdField || ( renderer && (renderer.latestObservationRenderer || renderer.trackRenderer) )) {
        this._trackManager = new esri.layers._TrackManager(this);
        this._trackManager.initialize(map);
      }
    }
    
    /*// listen for map zoom to act on scale dependency
    //this.minScale = 0; this.maxScale = 44000;
    if (this.minScale !== 0 || this.maxScale !== 0) {
      this._zoomConnect = dojo.connect(map, "onZoomEnd", this, this._updateStatus);
      //this._zoomHandler();
    }*/
   
    // listen for map zoom end to act on scale dependency and auto-generalization
    this._zoomConnect = dojo.connect(map, "onZoomEnd", this, this._zoomHandler);
    this._zoomHandler();
   
    //this.setScaleRange(this.minScale, this.maxScale);
    
    // initialize the "mode" with map
    var mode = this._mode;
    if (mode) {
      mode.initialize(map);
    }
    
    return div;
  },
  
  // (extend)
  _unsetMap: function(map, surface) {
    var mode = this._mode;
    if (mode) {
      mode.destroy();
      this._mode = null;
    }
    if (this._trackManager) {
      this._trackManager.destroy();
      this._trackManager = null;
    }
    dojo.disconnect(this._zoomConnect);
    this._zoomConnect = null;
    this._toggleTime(false);
    this.inherited("_unsetMap", arguments);
  },
  
//  // (override)
//  add: function(graphic) {
//    graphic.attributes = graphic.attributes || {};
//    var attributes = graphic.attributes, oidField = this.objectIdField;
//    if (/*!attributes ||*/ !attributes[oidField]) { // brand new feature
//      this._registerNew(graphic);
//      return this._add(graphic);
//    }
//    else { // feature that was previously removed (known to feature layer)
//      this._unRegisterDelete(graphic);
//      this._mode.drawFeature(graphic);
//      return graphic;
//    }
//  },
//  
//  // (override)
//  remove: function(graphic) {
//    var attributes = graphic.attributes, oidField = this.objectIdField;
//    if (/*!attributes ||*/ !attributes[oidField]) { // brand new feature previously added
//      this._unRegisterNew(graphic);
//      
//      // unselect
//      this._unSelectNewFeature(graphic);
//      
//      return this._remove(graphic);
//    }
//    else { // existing feature (known to feature layer)
//      this._registerDelete(graphic);
//      
//      var oid = attributes[oidField], mode = this._mode;
//      
//      // unselect
//      this._unSelectFeatureIIf(oid, mode);
//      
//      // remove
//      graphic._count = 0;
//      return mode._removeFeatureIIf(oid);
//    }
//  },

  // (incompatible override)
  refresh: function() {
    // Lose all the features and fetch them again 
    // from the server
    var mode = this._mode;
    if (mode) {
      mode.refresh();
    }
  },
  
  /*****************
   * Public Methods
   *****************/
  
  setEditable: function(/*Boolean*/ editable) {
    // Currently supported for by-value layers only
    if (!this._collection) {
      console.log("FeatureLayer:setEditable - this functionality is not yet supported for layer in a feature service");
      return this;
    }
    
    if (!this.loaded) {
      // Just record user's choice and leave. We'll process them
      // when the layer has loaded
      this._optEditable = editable;
      return this;
    }
    
    var previousState = this._editable;
    this._editable = editable;
    this._updateCaps();
    
    if (previousState !== editable) {
      this.onCapabilitiesChange();
    }
    return this;
  },
  
  getEditCapabilities: function(options) {
    /*
      // Tests:
      (function() {
      
      var scope = {
            loaded: false, _editable: null,
            capabilities: null,
            editFieldsInfo: null,
            ownershipBasedAccessControlForFeatures: null,
            getUserId: esri.layers.FeatureLayer.prototype.getUserId,
            isEditable: esri.layers.FeatureLayer.prototype.isEditable
          }, 
          fieldsInfo = { creatorField: "creator" },
          othersTT = { allowUpdateToOthers: true, allowDeleteToOthers: true },
          othersFF = { allowUpdateToOthers: false, allowDeleteToOthers: false },
          othersTF = { allowUpdateToOthers: true, allowDeleteToOthers: false },
          othersFT = { allowUpdateToOthers: false, allowDeleteToOthers: true };
      
      var FFF = '{"canCreate":false,"canUpdate":false,"canDelete":false}',
          TTT = '{"canCreate":true,"canUpdate":true,"canDelete":true}',
          TFF = '{"canCreate":true,"canUpdate":false,"canDelete":false}',
          FTF = '{"canCreate":false,"canUpdate":true,"canDelete":false}',
          FFT = '{"canCreate":false,"canUpdate":false,"canDelete":true}',
          TTF = '{"canCreate":true,"canUpdate":true,"canDelete":false}',
          FTT = '{"canCreate":false,"canUpdate":true,"canDelete":true}',
          TFT = '{"canCreate":true,"canUpdate":false,"canDelete":true}',
          T = true,
          F = false;
      
      var fUserA = { attributes: { creator: "UserA" } },
          fUserB = { attributes: { creator: "UserB" } },
          fUserAnonymous = { attributes: { creator: "" } },
          fUserNull = { attributes: { creator: null } },
          fNoAttr = {},
          fNoField = { attributes: {} },
          opts = {}, result;
      
      ////////// Layer level capabilities //////////
      console.log("Layer level capabilities");
      
      scope.loaded = F; scope._editable = F;
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("1. " + (result === FFF));

      scope.loaded = T; scope._editable = F;
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("2. " + (result === FFF));

      scope.loaded = T; scope._editable = F;
      scope.userIsAdmin = true;
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("2.1. " + (result === TTT));
      scope.userIsAdmin = undefined;

      scope.loaded = T; scope._editable = T;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("3. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("4. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("5. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("6. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("7. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("8. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("9. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("10. " + (result === TTT));
      
      console.log("Layer level capabilities, loggedInUser: IS-ADMIN");
      scope.userIsAdmin = true;
      
      scope.capabilities = "Map,Query";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("2. " + (result === TTT));
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("3. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("4. " + (result === TTT));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("5. " + (result === TTT));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("6. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("7. " + (result === TTT));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("8. " + (result === TTT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("9. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("10. " + (result === TTT));
      
      scope.userIsAdmin = undefined;
      
      console.log("Layer level capabilities, feature Y");
      opts.feature = fUserA;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TTT));
      
      scope.userIsAdmin = true;
      console.log("Layer level capabilities, loggedInUser: IS-ADMIN, feature Y");
      opts.feature = fUserA;
      
      scope.capabilities = "Map,Query";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TTT));
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === TTT));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TTT));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === TTT));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TTT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TTT));
      
      scope.userIsAdmin = undefined;
    
      ////////// LoggedInUser = Creator //////////
      
      opts.userId = "UserA";
      opts.feature = fUserA;
    
      console.log("LoggedInUser = Creator, No Access Control");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = null;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("1. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("2. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("3. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("4. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("5. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("6. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("7. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("8. " + (result === TTT));
    
      console.log("LoggedInUser = Creator, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("9. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TTT));
    
      opts.userId = "UserA";
      opts.feature = fUserAnonymous;
      console.log("LoggedInUser = Creator, Feature owned by ANONYMOUS, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("19. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("20. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("21. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("22. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("23. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("24. " + (result === TTT));
    
      ////////// LoggedInUser !== Creator //////////
      
      opts.userId = "UserA";
      opts.feature = fUserB;
    
      console.log("LoggedInUser !== Creator, No Access Control");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = null;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("1. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("2. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("3. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("4. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("5. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("6. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("7. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("8. " + (result === TTT));
    
      console.log("LoggedInUser !== Creator, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("9. " + (result === TFF));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === FFF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TFF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TFF));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TFF));
    
      scope.userIsAdmin = true;
      console.log("LoggedInUser !== Creator, LoggedInUser: IS-ADMIN, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Map,Query";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("8. " + (result === TTT));
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("9. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TTT));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === TTT));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TTT));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TTT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TTT));

      scope.userIsAdmin = undefined;
    
      console.log("LoggedInUser !== Creator, AccessControl = othersTT");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersTT;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("19. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("20. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("21. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("22. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("23. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("24. " + (result === TTT));
    
      console.log("LoggedInUser !== Creator, AccessControl = othersTF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersTF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("25. " + (result === TTF));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("26. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("27. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("28. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("29. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("30. " + (result === TFF));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("31. " + (result === FTF));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("32. " + (result === TTF));
    
      console.log("LoggedInUser !== Creator, AccessControl = othersFT");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFT;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("33. " + (result === TFT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("34. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("35. " + (result === FFF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("36. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("37. " + (result === TFF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("38. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("39. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("40. " + (result === TFT));
      
      ////////// NO LoggedInUser //////////

      opts.userId = "";
      opts.feature = fUserB;
    
      console.log("NO LoggedInUser, AccessControl = othersTT");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersTT;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("1. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("2. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("3. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("4. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("5. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("6. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("7. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("8. " + (result === TTT));
    
      console.log("NO LoggedInUser, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("9. " + (result === TFF));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === FFF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TFF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TFF));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TFF));

      opts.userId = "";
      opts.feature = fUserNull;
      console.log("NO LoggedInUser, Feature owned by NULL, AccessControl = othersTT");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersTT;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("19. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("20. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("21. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("22. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("23. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("24. " + (result === TTT));

      opts.userId = "";
      opts.feature = fUserNull;
      console.log("NO LoggedInUser, Feature owned by NULL, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("25. " + (result === TFF));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("26. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("27. " + (result === FFF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("28. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("29. " + (result === TFF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("30. " + (result === TFF));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("31. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("32. " + (result === TFF));
    
      }());
    
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("X. " + (result === TTT));
    */
    
    var denyAll = { "canCreate": false, "canUpdate": false, "canDelete": false };
    
    if (!this.loaded || !this.isEditable()) {
      return denyAll;
    }
    
    var feature = options && options.feature, userId = options && options.userId,
        caps = dojo.map((this.capabilities ? this.capabilities.toLowerCase().split(",") : []), dojo.trim),
        layerEditing = dojo.indexOf(caps, "editing") > -1,
        layerCreate = layerEditing && (dojo.indexOf(caps, "create") > -1),
        layerUpdate = layerEditing && (dojo.indexOf(caps, "update") > -1),
        layerDelete = layerEditing && (dojo.indexOf(caps, "delete") > -1),
        accessCtrl = this.ownershipBasedAccessControlForFeatures,
        fieldsInfo = this.editFieldsInfo,
        creatorField = fieldsInfo && fieldsInfo.creatorField,
        realm = fieldsInfo && fieldsInfo.realm,
        attributes = feature && feature.attributes,
        creator = (attributes && creatorField) ? attributes[creatorField] : undefined,
        retVal, userIsAdmin = !!this.userIsAdmin,
        othersCanUpdate = !accessCtrl || userIsAdmin || !!(accessCtrl.allowOthersToUpdate || accessCtrl.allowUpdateToOthers), 
        othersCanDelete = !accessCtrl || userIsAdmin || !!(accessCtrl.allowOthersToDelete || accessCtrl.allowDeleteToOthers);
    
    if (
      userIsAdmin || // arcgis.com use-case
      (layerEditing && !(layerCreate || layerUpdate || layerDelete)) // Pre 10.1 layers
    ) {
      layerCreate = layerUpdate = layerDelete = true;
    }
    
    // Start with what layer allows
    retVal = {
      "canCreate": layerCreate, 
      "canUpdate": layerUpdate, 
      "canDelete": layerDelete 
    };
    
    // Refine retVal based on various available information
    if (creator === null) {
      // Feature created by no one:
      // Can be updated or deleted by "" or "<userId>" if accessCtrl allows
      // "Feature created by null is owned by no one"
      retVal.canUpdate = layerUpdate && othersCanUpdate;
      retVal.canDelete = layerDelete && othersCanDelete;
    }
    else if (creator === "") {
      // Feature created by an anonymous user:
      // Use layer's capabilities.
      // "Feature created by anonymous users is owned by everyone"
      return retVal;
    }
    else if (creator) {
      // userId can only be "" or "<userId>". You cannot login as null.
      userId = userId || this.getUserId();
      
      if (userId && realm) {
        userId = userId + "@" + realm;
        
        // Note that realm will not be appended to anonymous users 
        // (i.e. <empty-string> values) either
      }

      if (userId.toLowerCase() === creator.toLowerCase()) {
        // Logged in user is the owner
        return retVal;
      }
      else {
        // Logged in user is NOT the owner
        // Or, user is not logged in at all (anonymous) 
        retVal.canUpdate = layerUpdate && othersCanUpdate;
        retVal.canDelete = layerDelete && othersCanDelete;
      }
    }
    
    return retVal;
  },
  
  getUserId: function() {
    var userId;
    
    if (this.loaded) {
      userId = (this.credential && this.credential.userId) || this.userId || "";
    }

    return userId;
  },
  
  setUserIsAdmin: function(isAdmin) {
    // This information will be factored in within the getEditCapabilities
    // logic above - so that widgets and other consuming code can allow or
    // disallow certain editing tools.
    // It is assumed that the calling code "somehow" determined that the 
    // logged in user is someone who owns this layer i.e. an "admin" in 
    // arcgis.com context
    this.userIsAdmin = isAdmin;
  },
  
  setEditSummaryCallback: function(callback) {
    this.editSummaryCallback = callback;
  },
  
  getEditSummary: function(feature, options, /*For Testing Only*/ currentTime) {
    // Requirements driven by arcgis.com
    // Example:
    //   Edited by Mikem on 2/1/2012 at 3:28 PM
    //   Edited by MWaltuch on Tuesday at 1:20 PM
    //   Created by mapper on Wednesday at 1:20 PM
    // Action: 
    //   Edited
    //   Created
    // Name: 
    //   by <userId>
    // Date/Time:
    //   0 - less than   1 min:   "seconds ago"
    //   1 - less than   2 mins:  "a minute ago"
    //   2 - less than  60 mins:  "<n> minutes ago" (round down)
    //  60 - less than 120 mins:  "an hour ago"
    //   2 - less than  24 hours: "<n> hours ago" (round down)
    //   1 - less than   7 days:  "on <day of the week> at <time>"
    //   Equals or greater than 7 days: "on <date> at <time>"

    /*
      // Tests:
      (function() {
      
      var scope = {
            loaded: false,
            editFieldsInfo: null,
            getEditInfo: esri.layers.FeatureLayer.prototype.getEditInfo,
            _getEditData: esri.layers.FeatureLayer.prototype._getEditData
          }, 
          testFunc = esri.layers.FeatureLayer.prototype.getEditSummary,
          infoA = { creatorField: "creator", creationDateField: "creationDate", editorField: "editor", editDateField: "editDate" }, 
          infoB = { creatorField: "creator", editorField: "editor" }, 
          infoC = { creationDateField: "creationDate", editDateField: "editDate" }, 
          infoD = { creatorField: "creator", creationDateField: "creationDate" }, 
          infoE = { editorField: "editor", editDateField: "editDate" }, 
          infoF = { creatorField: "creator" }, 
          infoG = { editorField: "editor" }, 
          infoH = { creationDateField: "creationDate" }, 
          infoI = { editDateField: "editDate" };
      
      var noAttr = {},
          emptyAttr = { attributes: {} },
          attrA1 = { attributes: { creator: "UserA", creationDate: 0 } },
          attrA2 = { attributes: { creator: "UserA", creationDate: 0, editor: "UserB", editDate: 1 } },
          attrB1 = { attributes: { creator: "UserA" } },
          attrB2 = { attributes: { creator: "UserA", editor: "UserB" } },
          attrC1 = { attributes: { creationDate: 0 } },
          attrC2 = { attributes: { creationDate: 0, editDate: 1 } },
          attrD = { attributes: { creator: "UserA", creationDate: 0 } },
          attrE = { attributes: { editor: "UserB", editDate: 1 } },
          attrF = { attributes: { creator: "UserA" } },
          attrG = { attributes: { editor: "UserB" } },
          attrH = { attributes: { creationDate: 0 } },
          attrI = { attributes: { editDate: 1 } };
      
      var printFunc = function(testNum, check, result) {
        console[check ? "log" : "error"](testNum + check + " - " + result + (result ? (" - " + esri.bundle.layers.FeatureLayer[result]) : "") );
      };
      
      var wrapper = function(testNum, attr, currentTime, expectedResult1, expectedResult2, expectedResult3) {
        var result;
        
        result = testFunc.call(scope, attr, null, currentTime);
        printFunc(testNum + "a. ", (result === expectedResult1), result);
        
        result = testFunc.call(scope, attr, { action: "creation" }, currentTime);
        printFunc(testNum + "b. ", (result === expectedResult2), result);

        result = testFunc.call(scope, attr, { action: "edit" }, currentTime);
        printFunc(testNum + "c. ", (result === expectedResult3), result);

        result = testFunc.call(scope, attr, { 
          callback: function(feature, info) {} 
        }, currentTime);
        printFunc(testNum + "d. ", (result === ""), result);

        result = testFunc.call(scope, attr, { 
          callback: function(feature, info) {
            return "<testing callback>";
          } 
        }, currentTime);
        printFunc(testNum + "e. ", (result === "<testing callback>"), result);

        scope.editSummaryCallback = function(feature, info) {
          return "<testing callback>";
        };
        result = testFunc.call(scope, attr, currentTime);
        printFunc(testNum + "f. ", (result === "<testing callback>"), result);
        scope.editSummaryCallback = null;

        result = testFunc.call(scope, attr, { 
          callback: function(feature, info) {
            if (info && (info.displayPattern === "Full")) {
              info.displayPattern = "WeekDay";
            }
            return info;
          } 
        }, currentTime);
        var exp = ( 
                    expectedResult1.indexOf("Full") > -1 ? 
                    expectedResult1.replace("Full", "WeekDay") : 
                    expectedResult1 
                   );
        printFunc(testNum + "g. ", (result === exp), result);
      };
      
      scope.loaded = false;
      console.log("0. " + (testFunc.call(scope, emptyAttr) === ""));
          
      scope.loaded = true;
      console.log("0. " + (testFunc.call(scope, emptyAttr) === ""));
      
      scope.editFieldsInfo = infoA;
      
      attrA1.attributes.creationDate = -40000;
      wrapper(1, attrA1, 0, "createUserSeconds", "createUserSeconds", "");
      attrA1.attributes.creationDate = -80000;
      wrapper(2, attrA1, 0, "createUserMinute", "createUserMinute", "");
      attrA1.attributes.creationDate = -3000000;
      wrapper(3, attrA1, 0, "createUserMinutes", "createUserMinutes", "");
      attrA1.attributes.creationDate = -2 * 3000000;
      wrapper(4, attrA1, 0, "createUserHour", "createUserHour", "");
      attrA1.attributes.creationDate = -24 * 3000000;
      wrapper(5, attrA1, 0, "createUserHours", "createUserHours", "");
      attrA1.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(6, attrA1, 0, "createUserWeekDay", "createUserWeekDay", "");
      attrA1.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(7, attrA1, 0, "createUserFull", "createUserFull", "");
      
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -40000;
      wrapper(8, attrA2, 0, "editUserSeconds", "createUserSeconds", "editUserSeconds");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -80000;
      wrapper(9, attrA2, 0, "editUserMinute", "createUserMinute", "editUserMinute");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -3000000;
      wrapper(10, attrA2, 0, "editUserMinutes", "createUserMinutes", "editUserMinutes");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -2 * 3000000;
      wrapper(11, attrA2, 0, "editUserHour", "createUserHour", "editUserHour");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -24 * 3000000;
      wrapper(12, attrA2, 0, "editUserHours", "createUserHours", "editUserHours");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(13, attrA2, 0, "editUserWeekDay", "createUserWeekDay", "editUserWeekDay");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(14, attrA2, 0, "editUserFull", "createUserFull", "editUserFull");
      
      scope.editFieldsInfo = infoB;
      wrapper(15, attrB1, 0, "createUser", "createUser", "");
      wrapper(16, attrB2, 0, "editUser", "createUser", "editUser");
      
      scope.editFieldsInfo = infoC;
      
      attrC1.attributes.creationDate = -40000;
      wrapper(17, attrC1, 0, "createSeconds", "createSeconds", "");
      attrC1.attributes.creationDate = -80000;
      wrapper(18, attrC1, 0, "createMinute", "createMinute", "");
      attrC1.attributes.creationDate = -3000000;
      wrapper(19, attrC1, 0, "createMinutes", "createMinutes", "");
      attrC1.attributes.creationDate = -2 * 3000000;
      wrapper(20, attrC1, 0, "createHour", "createHour", "");
      attrC1.attributes.creationDate = -24 * 3000000;
      wrapper(21, attrC1, 0, "createHours", "createHours", "");
      attrC1.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(22, attrC1, 0, "createWeekDay", "createWeekDay", "");
      attrC1.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(23, attrC1, 0, "createFull", "createFull", "");
      
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -40000;
      wrapper(24, attrC2, 0, "editSeconds", "createSeconds", "editSeconds");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -80000;
      wrapper(25, attrC2, 0, "editMinute", "createMinute", "editMinute");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -3000000;
      wrapper(26, attrC2, 0, "editMinutes", "createMinutes", "editMinutes");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -2 * 3000000;
      wrapper(27, attrC2, 0, "editHour", "createHour", "editHour");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -24 * 3000000;
      wrapper(28, attrC2, 0, "editHours", "createHours", "editHours");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(29, attrC2, 0, "editWeekDay", "createWeekDay", "editWeekDay");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(30, attrC2, 0, "editFull", "createFull", "editFull");
      
      scope.editFieldsInfo = infoD;
      
      attrD.attributes.creationDate = -40000;
      wrapper(31, attrD, 0, "createUserSeconds", "createUserSeconds", "");
      attrD.attributes.creationDate = -80000;
      wrapper(32, attrD, 0, "createUserMinute", "createUserMinute", "");
      attrD.attributes.creationDate = -3000000;
      wrapper(33, attrD, 0, "createUserMinutes", "createUserMinutes", "");
      attrD.attributes.creationDate = -2 * 3000000;
      wrapper(34, attrD, 0, "createUserHour", "createUserHour", "");
      attrD.attributes.creationDate = -24 * 3000000;
      wrapper(35, attrD, 0, "createUserHours", "createUserHours", "");
      attrD.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(36, attrD, 0, "createUserWeekDay", "createUserWeekDay", "");
      attrD.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(37, attrD, 0, "createUserFull", "createUserFull", "");
      
      scope.editFieldsInfo = infoE;
      
      attrE.attributes.editDate = -40000;
      wrapper(38, attrE, 0, "editUserSeconds", "", "editUserSeconds");
      attrE.attributes.editDate = -80000;
      wrapper(39, attrE, 0, "editUserMinute", "", "editUserMinute");
      attrE.attributes.editDate = -3000000;
      wrapper(40, attrE, 0, "editUserMinutes", "", "editUserMinutes");
      attrE.attributes.editDate = -2 * 3000000;
      wrapper(41, attrE, 0, "editUserHour", "", "editUserHour");
      attrE.attributes.editDate = -24 * 3000000;
      wrapper(42, attrE, 0, "editUserHours", "", "editUserHours");
      attrE.attributes.editDate = -7 * 24 * 3000000;
      wrapper(43, attrE, 0, "editUserWeekDay", "", "editUserWeekDay");
      attrE.attributes.editDate = -14 * 24 * 3000000;
      wrapper(44, attrE, 0, "editUserFull", "", "editUserFull");
      
      scope.editFieldsInfo = infoF;
      wrapper(45, attrF, 0, "createUser", "createUser", "");
      
      scope.editFieldsInfo = infoG;
      wrapper(46, attrG, 0, "editUser", "", "editUser");
                
      scope.editFieldsInfo = infoH;
      
      attrH.attributes.creationDate = -40000;
      wrapper(47, attrH, 0, "createSeconds", "createSeconds", "");
      attrH.attributes.creationDate = -80000;
      wrapper(48, attrH, 0, "createMinute", "createMinute", "");
      attrH.attributes.creationDate = -3000000;
      wrapper(49, attrH, 0, "createMinutes", "createMinutes", "");
      attrH.attributes.creationDate = -2 * 3000000;
      wrapper(50, attrH, 0, "createHour", "createHour", "");
      attrH.attributes.creationDate = -24 * 3000000;
      wrapper(51, attrH, 0, "createHours", "createHours", "");
      attrH.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(52, attrH, 0, "createWeekDay", "createWeekDay", "");
      attrH.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(53, attrH, 0, "createFull", "createFull", "");
      
      scope.editFieldsInfo = infoI;
      
      attrI.attributes.editDate = -40000;
      wrapper(54, attrI, 0, "editSeconds", "", "editSeconds");
      attrI.attributes.editDate = -80000;
      wrapper(55, attrI, 0, "editMinute", "", "editMinute");
      attrI.attributes.editDate = -3000000;
      wrapper(56, attrI, 0, "editMinutes", "", "editMinutes");
      attrI.attributes.editDate = -2 * 3000000;
      wrapper(57, attrI, 0, "editHour", "", "editHour");
      attrI.attributes.editDate = -24 * 3000000;
      wrapper(58, attrI, 0, "editHours", "", "editHours");
      attrI.attributes.editDate = -7 * 24 * 3000000;
      wrapper(59, attrI, 0, "editWeekDay", "", "editWeekDay");
      attrI.attributes.editDate = -14 * 24 * 3000000;
      wrapper(60, attrI, 0, "editFull", "", "editFull");

      }());
    */
    
    currentTime = esri._isDefined(currentTime) ? currentTime : (new Date()).getTime();

    var summary = "", info = this.getEditInfo(feature, options, currentTime),
        callback = (options && options.callback) || this.editSummaryCallback;
    
    // Callback support for developer customization
    if (callback) {
      info = callback(feature, info) || "";
      
      // callback function may return one of the following:
      // - "info" object with modified properties
      // - final "summary" string (callback should take care of localization if needed)
      // - null/undefined/"" implying empty string
    }
    
    if (dojo.isString(info)) {
      summary = info;
    }
    else {
      if (info) {
        var action = info.action, userId = info.userId, timeValue = info.timeValue,
            count = 0;
        
        // How many display components do we have?
        if (action) { count++; }
        if (userId) { count++; } // null and <empty string> are not displayworthy
        if (esri._isDefined(timeValue)) { count++; }
        
        // We need atleast two components to display a meaningful summary
        if (count > 1) {
          summary = (action === "edit" ? "edit" : "create") + 
                    (userId ? "User" : "") + 
                    (esri._isDefined(timeValue) ? info.displayPattern : "");
        }
      }

      // NOTE
      // Comment out this section when testing using the unit test cases at the
      // beginning of this method
      //console.log(info, summary);
      summary = summary && esri.substitute(info, esri.bundle.layers.FeatureLayer[summary]);
    }
    
    return summary;
  },
  
  getEditInfo: function(feature, options, /*For Testing Only*/ currentTime) {
    if (!this.loaded) {
      return;
    }
    
    currentTime = esri._isDefined(currentTime) ? currentTime : (new Date()).getTime();
    
    var reqAction = (options && options.action) || "last",
        fieldsInfo = this.editFieldsInfo,
        creatorField = fieldsInfo && fieldsInfo.creatorField,
        creationDateField = fieldsInfo && fieldsInfo.creationDateField,
        editorField = fieldsInfo && fieldsInfo.editorField,
        editDateField = fieldsInfo && fieldsInfo.editDateField,
        realm = fieldsInfo && fieldsInfo.realm,
        attributes = feature && feature.attributes,
        creator = (attributes && creatorField) ? attributes[creatorField] : undefined,
        creationDate = (attributes && creationDateField) ? attributes[creationDateField] : null,
        editor = (attributes && editorField) ? attributes[editorField] : undefined,
        editDate = (attributes && editDateField) ? attributes[editDateField] : null,
        creationData = this._getEditData(creator, creationDate, currentTime),
        editData = this._getEditData(editor, editDate, currentTime),
        retVal;
    
    switch(reqAction) {
      case "creation":
        retVal = creationData;
        break;
      case "edit":
        retVal = editData;
        break;
      case "last":
        retVal = editData || creationData;
        break;
    }
    
    if (retVal) {
      retVal.action = (retVal === editData) ? "edit" : "creation";
      //retVal.userId = retVal.userId || ""; // we don't want to show null and "" as userIds
    }
    
    return retVal;
  },
  
  _getEditData: function(userId, timeValue, currentTime) {
    var data, timeDiff, displayPattern,
        oneMin = 60000,
        mins60 = 3600000, // 60 * 60 * 1000,
        mins120 = 2 * mins60,
        hours24 = 24 * mins60,
        days7 = 7 * hours24;
    
    if (esri._isDefined(timeValue)) {
      timeDiff = currentTime - timeValue;
      //console.log(currentTime, timeValue, timeDiff );
      
      if (timeDiff < 0) {
        // This condition is really a fallback for assertion failure.
        // Assertion: a feature cannot have timestamp later than current time
        displayPattern = "Full";
      }
      else if (timeDiff < oneMin) {
        displayPattern = "Seconds";
      }
      else if (timeDiff < (2 * oneMin)) {
        displayPattern = "Minute";
      }
      else if (timeDiff < mins60) {
        displayPattern = "Minutes";
      }
      else if (timeDiff < mins120) {
        displayPattern = "Hour";
      }
      else if (timeDiff < hours24) {
        displayPattern = "Hours";
      }
      else if (timeDiff < days7) {
        displayPattern = "WeekDay";
      }
      else {
        displayPattern = "Full";
      }
    }

    if ((userId !== undefined) || displayPattern) {
      data = data || {};

      data.userId = userId; // can be undefined, null, "" or "<userId>"

      if (displayPattern) {
        var localeFormat = dojo.date.locale.format, dateObject = new Date(timeValue);
        
        data.minutes = Math.floor(timeDiff / oneMin);
        data.hours = Math.floor(timeDiff / mins60);
        data.weekDay = localeFormat(dateObject, { datePattern: "EEEE", selector: "date" });
        data.formattedDate = localeFormat(dateObject, { selector: "date" });
        data.formattedTime = localeFormat(dateObject, { selector: "time" });
        data.displayPattern = displayPattern;
        data.timeValue = timeValue;
      }
    }
    
    return data; // can be: undefined/have userId/have time components/have both userId and time
  },
  
  isEditable: function() {
    return !!(this._editable || this.userIsAdmin);
  },
  
  setMaxAllowableOffset: function(offset) {
    if (!this.isEditable()) {
      this._maxOffset = offset;
    }
    return this;
  },
  
  getMaxAllowableOffset: function() {
    return this._maxOffset;
  },
  
  setAutoGeneralize: function(enable) {
    if (!this.loaded) {
      this._optAutoGen = enable;
    }
    else if (
      !this.isEditable() && 
      (this.mode !== this.constructor.MODE_SNAPSHOT) &&
      ((this.geometryType === "esriGeometryPolyline") || (this.geometryType === "esriGeometryPolygon"))
    ) {
      this._autoGeneralize = enable;
      
      if (enable) {
        var map = this._map;
        if (map && map.loaded) {
          this._maxOffset = Math.floor(map.extent.getWidth() / map.width);
        }
      }
      else {
        delete this._maxOffset;
      }
    }
    
    return this;
  },
  
  setScaleRange: function(/*Number*/ minScale, /*Number*/ maxScale) {
    this.minScale = minScale || 0;
    this.maxScale = maxScale || 0;
    
    // listen for map zoom end to act on scale dependency
    //this.minScale = 0; this.maxScale = 44000;
    if (this._map && this._map.loaded) {
      /*if (minScale !== 0 || maxScale !== 0) {
        if (!this._zoomConnect) {
          this._zoomConnect = dojo.connect(this._map, "onZoomEnd", this, this._updateStatus);
        }
      }
      else {
        dojo.disconnect(this._zoomConnect);
        this._zoomConnect = null;
      }*/

      // effective immediately
      this._updateStatus();
    }
  },
  
  setGDBVersion: function(versionName) {
    if (
      !this._collection && 
      (versionName !== this.gdbVersion) && 
      (versionName || this.gdbVersion) // to catch null !== undefined !== "" passing the above condition
    ) {
      this.gdbVersion = versionName;
      this._task.gdbVersion = versionName;
      this._url.query = dojo.mixin(this._url.query, { gdbVersion: versionName });
      
      if (this.loaded) { // layer has loaded
        // this should finalize ongoing edits
        this.clearSelection();
        
        if (this._map) { // layer has been added to the map
          this.refresh();
        }
      }
      
      this.onGDBVersionChange();
    }
    
    return this;
  },
  
  setDefinitionExpression: function(/*String*/ expr) {
    this._defnExpr = expr;
    var mode = this._mode;
    if (mode) {
      mode.propertyChangeHandler(/*definition expression changed*/ 1);
    }
    return this;
  },
  
  getDefinitionExpression: function() {
    return this._defnExpr; // === undefined ? this.defaultDefinitionExpression : this._defnExpr;
  },
  
  setTimeDefinition: function(/*esri.TimeExtent*/ timeDefn) {
    if (/*this.timeInfo &&*/ this._isSnapshot) {
      this._timeDefn = timeDefn;
  
      var mode = this._mode;
      if (mode) {
        mode.propertyChangeHandler(/*snapshot time definition changed*/ 2);
      }
    }
    return this;
  },
  
  getTimeDefinition: function() {
    return this._timeDefn;
  },
  
  setTimeOffset: function(offsetValue, offsetUnits) {
    this._timeOffset = offsetValue;
    this._timeOffsetUnits = offsetUnits;
    var mode = this._mode;
    if (mode) {
      mode.propertyChangeHandler(/*map time extent changed*/ 0);
    }
    return this;
  },
  
  setUseMapTime: function(use) {
    this.useMapTime = use;
    this._toggleTime(!this._suspended);

    var mode = this._mode;
    if (mode) {
      mode.propertyChangeHandler(/*map time extent changed*/ 0);
    }
  },
  
  selectFeatures: function(/*esri.tasks.Query*/ query, /*Number?*/ selectionMethod, /*Function?*/ callback, /*Function?*/ errback) {
    selectionMethod = selectionMethod || this.constructor.SELECTION_NEW;
    
    var query2 = this._getShallowClone(query),
        map = this._map, featureSet,
        dfd = esri._fixDfd(new dojo.Deferred(esri._dfdCanceller));
    
    // override user query
    query2.outFields = this._getOutFields();
    query2.returnGeometry = true;
    if (map) {
      query2.outSpatialReference = new esri.SpatialReference(map.spatialReference.toJson());
    }
    
    // apply query filters
    if (!this._applyQueryFilters(query2)) {
//      return; // abort selection
      featureSet = { features: [] };
      // TODO
      // Need to consider doing setTimeout with delay=0
      this._selectHandler(featureSet, selectionMethod, callback, errback, dfd);
      //return this._getDeferred([featureSet.features, selectionMethod]);
      return dfd;
    }
    
    var queryTypes = this._canDoClientSideQuery(query2);
    if (queryTypes) { // use client-side implementation of selection
      featureSet = { features: this._doQuery(query2, queryTypes) };
      this._selectHandler(featureSet, selectionMethod, callback, errback, dfd);
      //return this._getDeferred([featureSet.features, selectionMethod]);
      return dfd;
    }
    else { // go to server
      if (this._collection) {
        var err = new Error("FeatureLayer::selectFeatures - " + esri.bundle.layers.FeatureLayer.invalidParams);
        /*if (errback) {
          errback(err);
        }
        return this._getDeferred(null, err);*/
       
        this._resolve([err], null, errback, dfd, true);
        return dfd;
      }

      var self = this;
      
      if (this._ts) {
        query2._ts = (new Date()).getTime();
      }

      var temp = dfd._pendingDfd = this._task.execute(query2);
      temp.addCallbacks(
        function(response) {
          self._selectHandler(response, selectionMethod, callback, errback, dfd);
        }, 
        function(err) {
          //dfd.errback(err);
          self._resolve([err], null, errback, dfd, true);
        }
      );
      
      return dfd;
    }
  },
  
  getSelectedFeatures: function() {
    var selected = this._selectedFeatures, retVal = [], item;
    
    for (item in selected) {
      if (selected.hasOwnProperty(item)) {
        retVal.push(selected[item]);
      }
    }
    
    /*selected = this._selectedFeaturesArr;
    if (selected.length > 0) {
      retVal = retVal.concat(selected);
    }*/
    
    return retVal;
  },
  
  clearSelection: function(silent) {
    // unselect and clear the selection
    var selected = this._selectedFeatures, mode = this._mode, item;
    
    for (item in selected) {
      if (selected.hasOwnProperty(item)) {
        this._unSelectFeatureIIf(item, mode);
        mode._removeFeatureIIf(item);
      }
    }
    this._selectedFeatures = {};
    
    /*selected = this._selectedFeaturesArr;
    var i = selected.length;
    while (i >= 0) {
      this._unSelectNewFeature(selected[i]);
      i--;
    }
    this._selectedFeaturesArr = [];*/

    if (this._isSelOnly) {
      mode._applyTimeFilter(true);
    }
    
    if (!silent) {
      this.onSelectionClear();
    }
    return this;
  },
  
  setSelectionSymbol: function(/*esri.symbol.Symbol*/ symbol) {
    this._selectionSymbol = symbol;
    
    if (symbol) {
      // apply it to the current selection
      var selected = this._selectedFeatures, item;
      for (item in selected) {
        if (selected.hasOwnProperty(item)) {
          selected[item].setSymbol(symbol);
        }
      }
    }
    
    return this;
  },
  
  getSelectionSymbol: function() {
    return this._selectionSymbol;
  },
  
  // Methods to be wrapped with normalize logic
  __msigns: [
    {
      n: "applyEdits",
      c: 5, // number of arguments expected by the method before the normalize era
      a: [ // arguments or properties of arguments that need to be normalized
        { i: 0 },
        { i: 1 }
      ],
      e: 4,
      f: 1
    }
  ],
  
  applyEdits: function(/*esri.Graphic[]*/ adds, /*esri.Graphic[]*/ updates, /*esri.Graphic[]*/ deletes, 
                       /*Function?*/ callback, /*Function?*/ errback, context) {
    
    // Use normalized geometries in place of the originals
    var assembly = context.assembly, dfd = context.dfd;
    // "adds" and "updates" will be mutated in-place
    this._applyNormalized(adds, assembly && assembly[0]);
    this._applyNormalized(updates, assembly && assembly[1]);
    
    // This event will be fired just before the edits request is sent 
    // to the server when 'FeatureLayer.applyEdits' method is called. 
    // You wouldn't need to use this event for most cases. But when 
    // using the Editor widget, this event can be used to intercept 
    // feature edits to, for example, to add additional attributes to 
    // newly created features that you did not want to show in the 
    // attribute inspector.
    this.onBeforeApplyEdits(adds, updates, deletes);
    
    var i, updatesMap = {}, oidField = this.objectIdField, content = { f: "json" }, dirty = false;

    if (this._collection) {
      // process edits on the client. there is no service to talk to.
      var response = {};
      
      response.addResults = adds ? dojo.map(adds, function() {
        dirty = true;
        return { objectId: this._nextId++, success: true };
      }, this) : null;
      
      response.updateResults = updates ? dojo.map(updates, function(feature) {
        dirty = true;
        var oid = feature.attributes[oidField];
        updatesMap[oid] = feature;
        return { objectId: oid, success: true };
      }, this) : null;
      
      response.deleteResults = deletes ? dojo.map(deletes, function(feature) {
        dirty = true;
        return { objectId: feature.attributes[oidField], success: true };
      }, this) : null;
      
      if (dirty) {
        this._editHandler(response, adds, updatesMap, callback, errback, dfd);
        //return this._getDeferred([response.addResults, response.updateResults, response.deleteResults]);
      }
      return;
    }
    
    // add features
    if (adds && adds.length > 0) {
      content.adds = this._convertFeaturesToJson(adds, 0, 1);
      dirty = true;
    }
    
    // update features
    if (updates && updates.length > 0) {
      for (i = 0; i < updates.length; i++) {
        var update = updates[i];
        updatesMap[update.attributes[oidField]] = update;
      }
      content.updates = this._convertFeaturesToJson(updates, 0, 0, 1);
      dirty = true;
    }
    
    // delete features
    if (deletes && deletes.length > 0) {
      var ids = [];
      for (i = 0; i < deletes.length; i++) {
        ids.push(deletes[i].attributes[oidField]);
      }
      content.deletes = ids.join(",");
      dirty = true;
    }
    
    if (dirty) {
      var self = this;
      
      return esri.request({
        url: this._url.path + "/applyEdits",
        content: dojo.mixin(content, this._url.query),
        callbackParamName: "callback",
        load: function(response) {
          self._editHandler(response, adds, updatesMap, callback, errback, dfd);
        },
        error: function(err) {
          self._resolve([err], null, errback, dfd, true);
        }
      }, { usePost: true });
    }
  },
  
  queryFeatures: function(/*esri.tasks.Query*/ query, /*Function?*/ callback, /*Function?*/ errback) {
    return this._query("execute", "onQueryFeaturesComplete", query, callback, errback);
  },
  
  queryRelatedFeatures: function(/*esri.tasks.RelationshipQuery*/ query, /*Function?*/ callback, /*Function?*/ errback) {
    return this._query("executeRelationshipQuery", "onQueryRelatedFeaturesComplete", query, callback, errback);
  },
  
  queryIds: function(/*esri.tasks.Query*/ query, /*Function?*/ callback, /*Function?*/ errback) {
    return this._query("executeForIds", "onQueryIdsComplete", query, callback, errback);
  },
  
  queryCount: function(/*esri.tasks.Query*/ query, /*Function?*/ callback, /*Function?*/ errback) {
    return this._query("executeForCount", "onQueryCountComplete", query, callback, errback);
  },
  
  queryAttachmentInfos: function(/*Number*/ objectId, callback, errback) {
    var url = this._url.path + "/" + objectId + "/attachments",
        dfd = new dojo.Deferred(esri._dfdCanceller),
        self = this;
    
    dfd._pendingDfd = esri.request({
      url: url,
      content: dojo.mixin({ f: "json" }, this._url.query),
      callbackParamName: "callback",
      
      load: function(response) {
        var infos = response.attachmentInfos,
          params;
        dojo.forEach(infos, function(info) {
          params = dojo.objectToQuery({
            gdbVersion: self._url.query && self._url.query.gdbVersion,
            layer: self._url.query && self._url.query.layer,
            token: self._getToken()
          });
          info.url = url + "/" + info.id + (params ? ("?" + params) : "");
          info.objectId = objectId;
        });
        
        /*this.onQueryAttachmentInfosComplete(infos);
        if (callback) {
          callback(infos);
        }*/
        
        self._resolve([infos], "onQueryAttachmentInfosComplete", callback, dfd);
      },
      
      error: function(err) {
        self._resolve([err], null, errback, dfd, true);
      }
    });
    
    return dfd;
  },
  
  addAttachment: function(/*Number*/ objectId, formNode, callback, errback) {
    return this._sendAttachment("add", objectId, formNode, callback, errback);
  },
  
  updateAttachment: function(/*Number*/ objectId, /*Number*/ attachmentId, formNode, callback, errback) {
    formNode.appendChild( dojo.create("input", { type: "hidden", name: "attachmentId", value: attachmentId }) );
    return this._sendAttachment("update", objectId, formNode, callback, errback);
  },
  
  deleteAttachments: function(/*Number*/ objectId, /*Number[]*/ attachmentIds, callback, errback) {
    var url = this._url.path + "/" + objectId + "/deleteAttachments",
        dfd = new dojo.Deferred(esri._dfdCanceller),
        self = this,
        content = {
          f: "json",
          attachmentIds: attachmentIds.join(",")
        };
    
    dfd._pendingDfd = esri.request({
      url: url,
      content: dojo.mixin(content, this._url.query),
      callbackParamName: "callback",
      
      load: dojo.hitch(this, function(response) {
        var results = response.deleteAttachmentResults;
        results = dojo.map(results, function(result) {
          var res = new esri.layers.FeatureEditResult(result);
          res.attachmentId = res.objectId;
          res.objectId = objectId;
          return res;
        });
        
        /*this.onDeleteAttachmentsComplete(results);
        if (callback) {
          callback(results);
        }*/
        
        self._resolve([results], "onDeleteAttachmentsComplete", callback, dfd);
      }), // load handler
      
      error: function(err) {
        self._resolve([err], null, errback, dfd, true);
      }
    }, { usePost: true });
    
    return dfd;
  },
  
  addType: function(newType) {
    // we want to add types to FS layers that are editable but don't have types and templates
    // this is the case for old hosted FS
    //if (!this._collection) {
    //  return false;
    //}
    
    var types = this.types;

    if (types) {
      var found = dojo.some(types, function(type) {
        if (type.id == newType.id) {
          return true;
        }
        return false;
      }); // some
      
      if (found) { // type already exists
        return false;
      }
      else { // new type, add it
        types.push(newType);
      }
    }
    else { // layer has no types yet
      this.types = [ newType ];
    }

    this._typesDirty = true;
    return true;
  },
  
  deleteType: function(typeId) {
    if (!this._collection) {
      return;
    }
    
    var types = this.types;
    
    if (types) {
      var found = -1;
      dojo.some(types, function(type, index) {
        if (type.id == typeId) {
          found = index;
          return true;
        }
        return false;
      }); // some
      
      if (found > -1) { // type exists
        this._typesDirty = true;
        return types.splice(found, 1)[0];
      }
    }
  },
  
  toJson: function() {
    var _json = this._json, json = dojo.isString(_json) ? dojo.fromJson(_json) : dojo.clone(_json);
    if (!json) {
      return;
    }
    
    json = json.layerDefinition ? json : { layerDefinition: json };
    
    var definition = json.layerDefinition, collection = this._collection;
    
    // if collection, update layerDefinition
    if (collection && this._typesDirty) {
      // update types
      definition.types = dojo.map(this.types || [], function(type) {
        return type.toJson();
      });

      // update renderer
      var renderer = this.renderer, drawInfo = definition.drawingInfo;
      if (drawInfo && renderer && renderer.declaredClass.indexOf("TemporalRenderer") === -1) {
        drawInfo.renderer = renderer.toJson();
      }
    }
    
    var outFeatureSet = null;
    if (!(collection && !this._fcAdded)) {
      outFeatureSet = {
        geometryType: definition.geometryType,
        features: this._convertFeaturesToJson(this.graphics, true/*, collection ? this.objectIdField : null*/)
      };
    }
    
    json.featureSet = dojo.mixin({}, json.featureSet || {}, outFeatureSet);
    
    // webmap spec
    if (collection) {
      json.nextObjectId = this._nextId;
      definition.capabilities = this.capabilities;
    }
    
    return json;
  },
  
  /*********
   * Events
   *********/
  
  onSelectionComplete: function() {},
  onSelectionClear: function() {},
  onBeforeApplyEdits: function() {},
  onEditsComplete: function() {},
  onQueryFeaturesComplete: function() {},
  onQueryRelatedFeaturesComplete: function() {},
  onQueryIdsComplete: function() {},
  onQueryCountComplete: function() {},
  onQueryAttachmentInfosComplete: function() {},
  onAddAttachmentComplete: function() {},
  onUpdateAttachmentComplete: function() {},
  onDeleteAttachmentsComplete: function() {},
  onCapabilitiesChange: function() {},
  onGDBVersionChange: function() {},
  onQueryLimitExceeded: function() {},
  
  /*******************
   * Internal Methods
   *******************/
  
  _updateCaps: function() {
    /*
      // Tests:
      (function() {
      
      var scope = { _editable: null, capabilities: null },
          result;
      
      console.log("Editable = FALSE");
      
      scope._editable = false; scope.capabilities = "";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("1. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Editing";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("2. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Editing,Create";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("3. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Editing,Create,Update";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("4. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Editing,Create,Update,Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("5. " + (scope.capabilities === ""));
      
      scope._editable = false; scope.capabilities = undefined;
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("6. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Query";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("7. " + (scope.capabilities === "Query"));
          
      scope._editable = false; scope.capabilities = "Query,Editing";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("8. " + (scope.capabilities === "Query"));
      
      console.log("Editable = TRUE");
      
      scope._editable = true; scope.capabilities = "";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("1. " + (scope.capabilities === "Editing"));
          
      scope._editable = true; scope.capabilities = "Editing";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("2. " + (scope.capabilities === "Editing"));
          
      scope._editable = true; scope.capabilities = "Editing,Create";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("3. " + (scope.capabilities === "Editing,Create"));
          
      scope._editable = true; scope.capabilities = "Editing,Create,Update";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("4. " + (scope.capabilities === "Editing,Create,Update"));
          
      scope._editable = true; scope.capabilities = "Editing,Create,Update,Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("5. " + (scope.capabilities === "Editing,Create,Update,Delete"));
      
      scope._editable = true; scope.capabilities = undefined;
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("6. " + (scope.capabilities === "Editing"));
          
      scope._editable = true; scope.capabilities = "Query";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("7. " + (scope.capabilities === "Query,Editing"));
          
      scope._editable = true; scope.capabilities = "Query,Editing";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("8. " + (scope.capabilities === "Query,Editing"));

      console.log("Editable = TRUE, SPACES in capabilities");
          
      scope._editable = true; scope.capabilities = "Query, Editing, Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("1. " + (scope.capabilities === "Query,Editing,Delete"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Update";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("2. " + (scope.capabilities === "Query,Editing,Update"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Update, Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("3. " + (scope.capabilities === "Query,Editing,Update,Delete"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Create, Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("4. " + (scope.capabilities === "Query,Editing,Create,Delete"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Create, Update";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("5. " + (scope.capabilities === "Query,Editing,Create,Update"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Create";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("6. " + (scope.capabilities === "Query,Editing,Create"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Create, Update, Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("7. " + (scope.capabilities === "Query,Editing,Create,Update,Delete"));
      
      }());
      
      result = dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("X. " + (result === TTT));
    */
    
    // Update "capabilities" to reflect current state of the layer's
    // editability
    
    var editable = this._editable, capabilities = dojo.trim(this.capabilities || ""),
        outCaps = dojo.map((capabilities ? capabilities.split(",") : []), dojo.trim),
        caps = dojo.map((capabilities ? capabilities.toLowerCase().split(",") : []), dojo.trim),
        found = dojo.indexOf(caps, "editing"), cap, i, toRemove,
        specifics = {
          "Create": dojo.indexOf(caps, "create"),
          "Update": dojo.indexOf(caps, "update"),
          "Delete": dojo.indexOf(caps, "delete")
        };
    
    if (editable && found === -1) {
      outCaps.push("Editing");
      
      // Push Create, Update and Delete as well
      /*for (cap in specifics) {
        if (specifics[cap] === -1) {
          outCaps.push(cap);
        }
      }*/
    }
    else if (!editable && found > -1) {
      toRemove = [ found ];
      
      // Remove Create, Update and Delete as well
      for (cap in specifics) {
        if (specifics[cap] > -1) {
          toRemove.push(specifics[cap]);
        }
      }
      
      toRemove.sort();
      for (i = toRemove.length - 1; i >=0; i--) {
        outCaps.splice(toRemove[i], 1);
      }
    }
    
    this.capabilities = outCaps.join(",");
  },
  
  _counter: { value: 0 }, // this object will be shared by all feature layer instances
  
  _getUniqueId: function() {
    return this._counter.value++;
  },
    
  // (override)
  _getDesiredStatus: function() {
    // Returns true if the layer shold be alive, false otherwise
    return this.visible && this._isMapAtVisibleScale();
  },
  
  _isMapAtVisibleScale: function() {
    if (!this._map) {
      return false;
    }
    
    var scale = esri.geometry.getScale(this._map);
    //console.info(scale);
    
    // Examples:
    // minScale = 25000, maxScale = 7500
    // minScale = 0, maxScale = 7500
    // minScale = 7499, maxScale = 0
    // minScale = 0, maxScale = 0
    // More on semantics here: http://webhelp.esri.com/arcgisdesktop/9.3/index.cfm?TopicName=Displaying_layers_at_certain_scales
    
    var minScale = this.minScale, maxScale = this.maxScale, minPassed = !minScale, maxPassed = !maxScale;
    if (!minPassed && scale <= minScale) {
      minPassed = true;
    }
    if (!maxPassed && scale >= maxScale) {
      maxPassed = true;
    }
    
    return (minPassed && maxPassed) ? true : false;
  },
  
  // (extend)
  _suspend: function() {
    //console.info("suspending...");
    this.inherited("_suspend", arguments);
    this._toggleTime(false);
    var mode = this._mode;
    if (mode) {
      mode.suspend();
    }
  },
  
  // (extend)
  _resume: function() {
    //console.info("resuming...");
    this.inherited("_resume", arguments);
    this._toggleTime(true);
    var mode = this._mode;
    if (mode) {
      mode.resume();
    }
  },
  
  _zoomHandler: function() {
    var map = this._map;

    if (map && map.loaded) {
      if (this._autoGeneralize) {
        this._maxOffset = Math.floor(map.extent.getWidth() / map.width);
      }

      this._updateStatus();
    }
  },
  
  _toggleTime: function(enable) {
    //if (this.timeInfo) {
      var map = this._map;
      if (enable && this.timeInfo && this.useMapTime && map) {
        this._mapTimeExtent = map.timeExtent;
        if (!this._timeConnect) {
          this._timeConnect = dojo.connect(map, "onTimeExtentChange", this, this._timeChangeHandler);
        }
      }
      else {
        this._mapTimeExtent = null;
        dojo.disconnect(this._timeConnect);
        this._timeConnect = null;
      }
    //} 
  },
  
  _timeChangeHandler: function(newTimeExtent) {
    this._mapTimeExtent = newTimeExtent;
    var mode = this._mode;
    if (mode) {
      mode.propertyChangeHandler(/*map time extent changed*/ 0);
    }
  },
  
  _getOffsettedTE: function(timeExtent) {
    var offset = this._timeOffset, units = this._timeOffsetUnits;
    return (timeExtent && offset && units) ? timeExtent.offset(-1 * offset, units) : timeExtent;
  },
  
  _getTimeOverlap: function(timeExtent1, timeExtent2) {
    if (timeExtent1 && timeExtent2) {
      return timeExtent1.intersection(timeExtent2);
    }
    else {
      return timeExtent1 || timeExtent2;
    }
  },
  
  _getTimeFilter: function(queryTime) {
    // The effective time filter is the overlap
    // between query time, layer time defn and map time extent
    // If atleast two of the above variables have values and there is no
    // overlap, then ABORT selection
    
    // Group 1: NO queryTime
    
    /*// Subgroup 1: NO time definition, NO time extent
       var tDefn = null;
       var tExtent = null;
       console.log( (ov = _getTimeFilter(null)) && ov[0] === true && !ov[1] );
    
    // Subgroup 2: time definition + time extent
    
    //   Subgroup 1: overlap
         var tDefn = { startTime: 10, endTime: 20 };
         var tExtent = { startTime: 5, endTime: 15 };
         console.log( (ov = _getTimeFilter(null)) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "10,15") );
    
    //   Subgroup 2: NO overlap
         var tDefn = { startTime: 10, endTime: 20 };
         var tExtent = { startTime: 30, endTime: 40 };
         console.log( (ov = _getTimeFilter(null)) && ov[0] === false );
    
    // Subgroup 3: time definition + NO time extent
       var tDefn = { startTime: 10, endTime: 20 };
       var tExtent = null;
       console.log( (ov = _getTimeFilter(null)) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "10,20") );
    
    // Subgroup 4: NO time definition + time extent
       var tDefn = null;
       var tExtent = { startTime: 5, endTime: 10 };
       console.log( (ov = _getTimeFilter(null)) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "5,10") );*/

    // Group 2: queryTime is defined
    
    /*// Subgroup 1: NO time definition, NO time extent
       var tDefn = null;
       var tExtent = null;
       console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "5,15") );
    
    // Subgroup 2: time definition + time extent
    
    //   Subgroup 1: overlap
         var tDefn = { startTime: 13, endTime: 20 };
         var tExtent = { startTime: 11, endTime: 17 };
         console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "13,15") );
         console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 12 })) && ov[0] === false );
         console.log( (ov = _getTimeFilter({ startTime: 18, endTime: 20 })) && ov[0] === false );
         console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 10 })) && ov[0] === false );
    
    //   Subgroup 2: NO overlap
         var tDefn = { startTime: 20, endTime: 30 };
         var tExtent = { startTime: 35, endTime: 45 };
         console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === false );
         console.log( (ov = _getTimeFilter({ startTime: 15, endTime: 25 })) && ov[0] === false );
         console.log( (ov = _getTimeFilter({ startTime: 35, endTime: 40 })) && ov[0] === false );
    
    // Subgroup 3: time definition + NO time extent
       var tDefn = { startTime: 10, endTime: 20 };
       var tExtent = null;
       console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "10,15") );
       console.log( (ov = _getTimeFilter({ startTime: 1, endTime: 5 })) && ov[0] === false );
    
    // Subgroup 4: NO time definition + time extent
       var tDefn = null;
       var tExtent = { startTime: 10, endTime: 20 };
       console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "10,15") );
       console.log( (ov = _getTimeFilter({ startTime: 1, endTime: 5 })) && ov[0] === false );*/
    

    // Updated Test Cases: "map time extent is never used"
    
    /*// Group 1: NO queryTime
    var tDefn = null;
    console.log( (ov = _getTimeFilter(null)) && ov[0] === true && !ov[1] );

    var tDefn = new esri.TimeExtent();
    tDefn.startTime = new Date(10);
    tDefn.endTime = new Date(20);
    console.log( (ov = _getTimeFilter(null)) && ov[0] === true && (ov[1].startTime.getTime() + "," + ov[1].endTime.getTime() === "10,20") );
    
    // Group 2: queryTime is defined
    var tDefn = null;
    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(5);
    qTime.endTime = new Date(15);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === true && (ov[1].startTime.getTime() + "," + ov[1].endTime.getTime() === "5,15") );

    var tDefn = new esri.TimeExtent();
    tDefn.startTime = new Date(10);
    tDefn.endTime = new Date(20);
    
    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(1);
    qTime.endTime = new Date(5);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === false );
    
    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(25);
    qTime.endTime = new Date(30);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === false );

    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(5);
    qTime.endTime = new Date(15);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === true && (ov[1].startTime.getTime() + "," + ov[1].endTime.getTime() === "10,15") );

    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(15);
    qTime.endTime = new Date(23);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === true && (ov[1].startTime.getTime() + "," + ov[1].endTime.getTime() === "15,20") );*/
    
    
    var timeDefn = this.getTimeDefinition(), mapTime = null /*this._getOffsettedTE(this._mapTimeExtent)*/, overlap;
    if (timeDefn || mapTime) {
      overlap = this._getTimeOverlap(timeDefn, mapTime);
      if (!overlap) {
        return [ false ]; // abort selection
      }
    }
    
    if (queryTime) {
      queryTime = overlap ? this._getTimeOverlap(queryTime, overlap) : queryTime;
      if (!queryTime) {
        return [ false ]; // abort selection
      }
    }
    else {
      queryTime = overlap;
    }
    
    return [ true, queryTime ];
  },
  
  _getAttributeFilter: function(queryWhere) {
    // The effective where clause is an AND 
    // between query where and layer definition
    
    // TODO
    // Add test cases
    
    var defExpr = this.getDefinitionExpression();
    if (queryWhere) {
      //queryWhere = defExpr ? queryWhere + " AND " + defExpr : queryWhere;
      queryWhere = defExpr ? "(" + defExpr + ") AND (" + queryWhere + ")" : queryWhere;
    }
    else {
      queryWhere = defExpr;
    }
    return queryWhere;
  },
  
  _applyQueryFilters: function(query) {
    // definition expression
    query.where = this._getAttributeFilter(query.where);
    query.maxAllowableOffset = this._maxOffset;
    
    // time
    if (this.timeInfo) {
      var result = this._getTimeFilter(query.timeExtent);
      if (!result[0]) {
        return false; // abort
      }
      else {
        query.timeExtent = result[1];
        //console.log("Time Filter ", "query.timeExtent: ", query.timeExtent.startTime, ", ", query.timeExtent.endTime);
      }
    }
    
    return true;
  },
  
  /*_registerNew: function(feature) {
    this._unRegisterNew(feature);
    this._newFeatures.push(feature);
    feature._count = 1;
  },
  
  _unRegisterNew: function(feature) {
    var newFeatures = this._newFeatures;
    var index = dojo.indexOf(newFeatures, feature);
    if (index !== -1) {
      newFeatures.splice(index, 1);
      feature._count = 0;
    }
  },
  
  _isNew: function(feature) {
    var index = dojo.indexOf(this._newFeatures, feature);
    return index === -1 ? false : true;
  },*/
  
  /*_registerDelete: function(feature) {
    var attributes = feature.attributes, oidField = this.objectIdField, oid = attributes[oidField];
    this._deletedFeatures[oid] = feature;
  },
  
  _unRegisterDelete: function(feature) {
    var attributes = feature.attributes, oidField = this.objectIdField, oid = attributes[oidField];
    delete this._deletedFeatures[oid];
  },
  
  _isDeleted: function(feature) {
    var attributes = feature.attributes, oidField = this.objectIdField, oid = attributes[oidField];
    return this._deletedFeatures[oid] ? true : false;
  },*/
  
  _add: function(graphic) {
    var symbol = this._selectionSymbol, attr = graphic.attributes,
        visField = this.visibilityField;

    // set correct symbology for the graphic
    if (symbol && this._isSelOnly) {
      graphic.setSymbol(symbol);
    }
    
    // webmap spec
    if (visField && attr && attr.hasOwnProperty(visField)) {
      graphic[attr[visField] ? "show" : "hide"]();
    }
    
    // [Dojo 1.4.0] Calling an inherited method by name from a function 
    // that does not have the same name as the overridden method does not 
    // work at Dojo 1.4.0 (If the derived class had a method with the same 
    // name as the inherited method, then that would be called instead)
    
    //return this.inherited("add", arguments);
    return this.add.apply(this, arguments);
  },
  
  _remove: function() {
    //return this.inherited("remove", arguments);
    return this.remove.apply(this, arguments);
  },
  
  _canDoClientSideQuery: function(query) {
    // Return values:
    //  null/undefined --> cannot perform client-side query
    //  1 --> can do client side query for "extent"
    //  2 --> can do client side query for "object ids"
    //  3 --> can do client side query for "time"
    //console.log("_canDoClientSideQuery");
    var retVal = [], map = this._map;
    
    if (this._isTable || !map) {
      return;
    }
    
    // cannot do most attribute based queries on the client
    if ( query.text || (query.where && query.where !== this.getDefinitionExpression()) ) {
      return;
    }
    
    var isSnapshot = this._isSnapshot, selOnly = this._isSelOnly;
    
    // geometry
    var geometry = query.geometry;
    if (geometry) {
      if (!selOnly && 
          query.spatialRelationship === esri.tasks.Query.SPATIAL_REL_INTERSECTS && 
          (geometry.type === "extent" && (isSnapshot || map.extent.contains(geometry)))
      ) {
        // can do extent based intersection query, if it is within the current map extent
        retVal.push(1);
      }
      else {
        return;
      }
    }

    // object ids
    var ids = query.objectIds;
    if (ids) {
      if (isSnapshot) {
        retVal.push(2);
      }
      else {
        var len = ids.length, mode = this._mode, matchCount = 0, i;
        for (i = 0; i < len; i++) {
          if (mode._getFeature(ids[i])) {
            matchCount++;
          }
        }
        
        if (matchCount === len) {
          // can do client-side if "all" object ids in the request are
          // currently available locally
          retVal.push(2);
        }
        else {
          return;
        }
      } // if snapshot
    }
    
    // time
    if (this.timeInfo) {
      var queryTime = query.timeExtent, mapTime = this._mapTimeExtent;
      
      if (isSnapshot) {
        if (queryTime) {
          retVal.push(3);
        }
      }
      else if (selOnly) {
        if (queryTime) {
          return;
        }
      }
      else { // on-demand
        if (mapTime) {
          if (dojo.indexOf(retVal, 2) !== -1) {
            if (queryTime) {
              retVal.push(3);
            }
          }
          else {
            // Does not matter if query has time or not - 
            // we need to go to the server
            return;
          }
        }
        else {
          if (retVal.length > 0) {
            if (queryTime) {
              retVal.push(3);
            }
          }
          else {
            if (queryTime) {
              return;
            }
          }
        } // mapTime
      } // on-demand
    }
    
//    // time
//    if (query.timeExtent) {
//      if (isSnapshot) {
//        retVal.push(3);
//      }
//      else {
//        if (selOnly) {
//          return;
//        }
//        else { // on-demand mode
//          if (retVal.length > 0) {
//            retVal.push(3);
//          }
//        } // if selOnly
//      } // if isSnapshot
//    }
    
    return retVal.length > 0 ? retVal : null;
  },

  _doQuery: function(query, queryTypes, returnIdsOnly) {
    //console.log("_doQuery");
    var matched = [], mode = this._mode, oidField = this.objectIdField, i,
        len, features;

    if (dojo.indexOf(queryTypes, 2) !== -1) { // object ids
      matched = [];
      var ids = query.objectIds;
      len = ids.length;
      for (i = 0; i < len; i++) {
        var obj = mode._getFeature(ids[i]);
        if (obj) {
          matched.push(obj);
        }
      }
      
      if (matched.length === 0) {
        return [];
      }
    }

    if (dojo.indexOf(queryTypes, 1) !== -1) { // query extent
      features = matched.length > 0 ? matched : this.graphics; 
      len = features.length; 
      
      var extent = query.geometry._normalize(null, true); // can be an extent or an array of extents
      
      matched = [];
      
      for (i = 0; i < len; i++) {
        var feature = features[i], geometry = feature.geometry;
        
        if (geometry) {
          if (this.normalization && extent.length) {
            // there will be two extents in the array (see Extent::_normalize to understand why)
            if (extent[0].intersects(geometry) || extent[1].intersects(geometry)) {
              matched.push(feature);
            }
          }
          else {
            if (extent.intersects(geometry)) {
              matched.push(feature);
            }
          }
        }
      }
      
      if (matched.length === 0) {
        return [];
      }
    }

    if (dojo.indexOf(queryTypes, 3) !== -1) { // time
      if (this.timeInfo) {
        // layer is time-aware
        features = matched.length > 0 ? matched : this.graphics;
        var time = query.timeExtent, result = this._filterByTime(features, time.startTime, time.endTime);
        matched = result.match;
      }
    }

    if (returnIdsOnly) {
      return dojo.map(matched, function(obj) {
        return obj.attributes[oidField];
      }, this);
    }
    else {
      return matched;
    }
  },
  
  _filterByTime: function(graphics, startTime, endTime) {
    var startTimeField = this._startTimeField, endTimeField = this._endTimeField, timeField;
    if (!this._twoTimeFields) {
      timeField = startTimeField || endTimeField;
    }
    
    var isDef = esri._isDefined, yea = [], nay = [], i, len = graphics.length, graphic, attributes;
    startTime = startTime ? startTime.getTime() : -Infinity;
    endTime = endTime ? endTime.getTime() : Infinity;
    
    /*if (startTime && endTime) { // time extent?
      startTime = startTime.getTime();
      endTime = endTime.getTime();*/

      if (timeField) { // there is only one time field
        for (i = 0; i < len; i++) {
          graphic = graphics[i];
          attributes = graphic.attributes;
          
          var time = attributes[timeField];
          
          if ( time >= startTime && time <= endTime ) {
            yea.push(graphic); //graphic.show();
          }
          else {
            nay.push(graphic); //graphic.hide();
          }
        } // loop
      }
      else { // we have start and end time fields
        for (i = 0; i < len; i++) {
          graphic = graphics[i];
          attributes = graphic.attributes;
          
          var start = attributes[startTimeField], end = attributes[endTimeField];
          start = isDef(start) ? start : -Infinity;
          end = isDef(end) ? end : Infinity;
          
          // Should it be INTERSECTS or CONTAINS? Looks like it should be
          // INTERSECTS
          if ( (start >= startTime && start <= endTime) || // feature-start within filter's timespan
               (end >= startTime && end <= endTime) || //  feature-end within filter's timespan
               (startTime >= start && endTime <= end) // filter's timespan completely within feature's timespan
             ) {
            yea.push(graphic); //graphic.show();
          }
          else {
            nay.push(graphic); //graphic.hide();
          }
        }
      } // timeField
      
    /*}
    else if (startTime || endTime) { // time instant?
      startTime = (startTime || endTime).getTime();

      if (timeField) { // there is only one time field
        for (var i = 0, len = graphics.length; i < len; i++) {
          var graphic = graphics[i], attributes = graphic.attributes;
          var time = attributes[timeField];
          
          if (time === startTime) {
            yea.push(graphic); //graphic.show();
          }
          else {
            nay.push(graphic); //graphic.hide();
          }
        } // loop
      }
      else { // we have start and end time fields
        for (var i = 0, len = graphics.length; i < len; i++) {
          var graphic = graphics[i], attributes = graphic.attributes;
          var start = attributes[startTimeField], end = attributes[endTimeField];
          start = isNotDefined(start) ? -Infinity : start;
          end = isNotDefined(end) ? Infinity : end;
          
          if (startTime >= start && startTime <= end) {
            yea.push(graphic); //graphic.show();
          }
          else {
            nay.push(graphic); //graphic.hide();
          }
        }
      } // timeField

    }*/
    return { match: yea, noMatch: nay };
  },
  
  /*_getDeferred: function(response, error) {
    var df = new dojo.Deferred();
    
    if (error) {
      df.errback(error);
    }
    else {
      //df.callback(response);
      if (dojo.isArray(response) && response.length > 1) {
        df = esri._fixDfd(df);
      }
      esri._resDfd(df, response);
    }
    
    return df;
  },*/
  
  _resolve: function(args, eventName, callback, dfd, isError) {
    // Fire Event
    if (eventName) {
      this[eventName].apply(this, args);
    }
    
    // Invoke Callback
    if (callback) {
      callback.apply(null, args);
    }
    
    // Resolve Deferred
    if (dfd) {
      esri._resDfd(dfd, args, isError);
    }
  },
  
  _getShallowClone: function(query) {
    // clone (shallow) query object
    var query2 = new esri.tasks.Query(), prop;
    for (prop in query) {
      if (query.hasOwnProperty(prop)) {
        query2[prop] = query[prop];
      }
    }
    return query2;
  },
  
  _query: function(type, eventName, query, callback, errback) {
    var that = this, 
        dfd = new dojo.Deferred(esri._dfdCanceller);
    
    var cbFunc = function(response, noLookup) {
      if (!noLookup && type === "execute" && !that._isTable) {
        // if some features are already on the client,
        // we need to replace them with references that we
        // already have
        var features = response.features, mode = that._mode, oidField = that.objectIdField,
            il = features.length, i;
            
        for (i = il - 1; i >= 0; i--) {
          var oid = features[i].attributes[oidField];
          var localRef = mode._getFeature(oid);
          if (localRef) {
            features.splice(i, 1, localRef);
          }
        }
      }
      
      /*that[eventName](response);
      if (callback) {
        callback(response);
      }
      if (dfd) {
        esri._resDfd(dfd, [response]);
      }*/
      that._resolve([response], eventName, callback, dfd);
    };

    if (type !== "executeRelationshipQuery") {
      query = this._getShallowClone(query);
      query.outFields = this._getOutFields();
      query.returnGeometry = true;
      
      var map = this._map, output;
      if (map) {
        query.outSpatialReference = new esri.SpatialReference(map.spatialReference.toJson());
      }
      
      // apply query filters
      if (!this._applyQueryFilters(query)) {
        //var output = (type === "execute") ? new esri.tasks.FeatureSet({ features: [] }) : [];
        switch(type) {
          case "execute":
            output = new esri.tasks.FeatureSet({ features: [] });
            break;
          case "executeForIds":
            output = [];
            break;
          case "executeForCount":
            output = 0;
            break;
        }
        
        cbFunc(output, true);
        //return this._getDeferred([output]);
        return dfd;
      }
      
      // execute the query: client-side or server-side
      var queryTypes = this._canDoClientSideQuery(query);
      if (queryTypes) {
        var features = this._doQuery(query, queryTypes, (type === "executeForIds" || type === "executeForCount"));
        
        //var output = (type === "execute") ? { features: features } : features;
        /*var output = features;
        if (type === "execute") {
          output = new esri.tasks.FeatureSet();
          output.features = features;
        }*/
        
        switch(type) {
          case "execute":
            output = new esri.tasks.FeatureSet();
            output.features = features;
            break;
          case "executeForIds":
            output = features;
            break;
          case "executeForCount":
            output = features.length;
            break;
        }
        
        cbFunc(output, true);
        //return this._getDeferred([output]);
        return dfd;
      }
    }

    if (this._collection) {
      var err = new Error("FeatureLayer::_query - " + esri.bundle.layers.FeatureLayer.invalidParams);
      /*if (errback) {
        errback(err);
      }
      return this._getDeferred(null, err);*/
     
      this._resolve([err], null, errback, dfd, true);
      return dfd;
    }

    if (this._ts) {
      query._ts = (new Date()).getTime();
    }
    
    var temp = dfd._pendingDfd = this._task[type](query);
    temp.addCallbacks(
      cbFunc,
      function(err) {
        that._resolve([err], null, errback, dfd, true);
      }
    );
    
    return dfd;
  },
  
  _convertFeaturesToJson: function(features, dontStringify, isAdd, isUpdate) {
    var json = [], selSymbol = this._selectionSymbol,
        visField = this.visibilityField, i, nonEditableFields,
        oidField = this.objectIdField;
    
    // Identify non-editable fields so that we can avoid sending
    // them to the server
    if (this.loaded && (isAdd || isUpdate)) {
      nonEditableFields = dojo.filter(this.fields, function(field) {
        return (field.editable === false) && 
               (!isUpdate || (field.name !== oidField));
      });
    }
    
    for (i = 0; i < features.length; i++) {
      var feature = features[i], featureJson = {}, 
          geometry = feature.geometry, attr = feature.attributes,
          symbol = feature.symbol;
          
      if (geometry && (!isUpdate || !this.loaded || this.allowGeometryUpdates)) {
        featureJson.geometry = geometry.toJson();
      }
      
      // webmap spec
      // Write out visibilityField
      if (visField) {
        featureJson.attributes = attr = dojo.mixin({}, attr);
        attr[visField] = feature.visible ? 1 : 0;
      }
      else if (attr) {
        featureJson.attributes = dojo.mixin({}, attr);
        /*if (suppressField) {
          delete featureJson.attributes[suppressField];
        }*/
      }
      
      // Remove non-editable fields from the attributes
      if (featureJson.attributes && nonEditableFields && nonEditableFields.length) {
        dojo.forEach(nonEditableFields, function(field) {
          delete featureJson.attributes[field.name];
        });
      }
      
      if (symbol && (symbol !== selSymbol)) {
        featureJson.symbol = symbol.toJson();
      }
      
      json.push(featureJson);
    }
    
    return dontStringify ? json : dojo.toJson(json);
  },
  
  _selectHandler: function(response, selectionMethod, callback, errback, dfd) {
    //console.log(" select features: ", response);

    // To select or to not select these new features?
    var doSelect, ctor = this.constructor;
    switch(selectionMethod) {
      case ctor.SELECTION_NEW:
        this.clearSelection(true);
        doSelect = true;
        break;
      case ctor.SELECTION_ADD:
        doSelect = true;
        break;
      case ctor.SELECTION_SUBTRACT:
        doSelect = false;
        break;
    }
    
    // process the features
    var i, features = response.features, mode = this._mode, retVal = [], oidField = this.objectIdField,
        feature, oid;
    if (doSelect) {
      for (i = 0; i < features.length; i++) {
        feature = features[i];
        oid = feature.attributes[oidField];
        
        /*if (this._isNew(feature)) {
          retVal.push(feature);
          this._selectNewFeature(feature);
        }
        else if (!this._isDeleted(feature)) {*/
          var added = mode._addFeatureIIf(oid, feature);
          retVal.push(added);
          this._selectFeatureIIf(oid, added, mode);
        //}
      }
    }
    else {
      for (i = 0; i < features.length; i++) {
        feature = features[i];
        oid = feature.attributes[oidField];
        
        /*if (this._isNew(feature)) {
          retVal.push(feature);
          this._unSelectNewFeature(feature);
        }
        else {*/
          this._unSelectFeatureIIf(oid, mode);
          var removed = mode._removeFeatureIIf(oid);
          retVal.push(removed || feature);
        //}
      }
    }

    if (this._isSelOnly) {
      mode._applyTimeFilter(true);
    }
    
    /*this.onSelectionComplete(retVal, selectionMethod);
    if (callback) {
      callback(retVal, selectionMethod);
    }
    if (dfd) {
      esri._resDfd(dfd, [retVal, selectionMethod]);
    }*/

    this._resolve(
      [retVal, selectionMethod, response.exceededTransferLimit ? { queryLimitExceeded: true } : null], 
      "onSelectionComplete", callback, dfd
    );
    
    if (response.exceededTransferLimit) {
      this.onQueryLimitExceeded();
    }
  },
  
  _selectFeatureIIf: function(oid, feature, mode) {
    var selected = this._selectedFeatures, found = selected[oid]; //, symbol = this._selectionSymbol, isSelOnly = this._isSelOnly;
    if (!found) {
      mode._incRefCount(oid);
      selected[oid] = feature;
      if (!this._isTable) {
        this._setSelectSymbol(feature);
      }
    }
    return found || feature;
  },

  _unSelectFeatureIIf: function(oid, mode) {
    var found = this._selectedFeatures[oid];
    if (found) {
      mode._decRefCount(oid);
      delete this._selectedFeatures[oid];
      if (!this._isTable) {
        this._setUnSelectSymbol(found);
      }
    }
    return found;
  },
  
  /*_selectNewFeature: function(feature) {
    var selected = this._selectedFeaturesArr;
    var index = dojo.indexOf(selected, feature);
    if (index === -1) {
      selected.push(feature);
      feature._count++;
      this._setSelectSymbol(feature);
    }
    return feature;
  },
  
  _unSelectNewFeature: function(feature) {
    var selected = this._selectedFeaturesArr;
    var index = dojo.indexOf(selected, feature), found;
    if (index !== -1) {
      found = selected[index];
      found._count = 1;
      this._setUnSelectSymbol(found);
      selected.splice(index, 1);
    }
    return found;
  },*/
  
  _isSelected: function(feature) {
    // TODO
  },
  
  _setSelectSymbol: function(feature) {
    var symbol = this._selectionSymbol;
    if (symbol && !this._isSelOnly) {
      // TODO 
      // How should we handle if feature
      // has its own symbol?
      feature.setSymbol(symbol);
    }
  },
  
  _setUnSelectSymbol: function(feature) {
    var symbol = this._selectionSymbol;
    if (symbol && !this._isSelOnly) {
      //feature.setSymbol(this.renderer.getSymbol(feature));
      if (symbol === feature.symbol) {
        feature.setSymbol(null, true);
      }
    }
  },
  
  /*_getSymbol: function(feature) {
    if (this.isEditable()) { // layer in a feature service 
      return this._getSymbolByType(feature.attributes[this.typeIdField]) || this.defaultSymbol;
    }
    else { // layer in a map service
      return null;
    }
  },
  
  _getSymbolByType: function(typeId) {
    if (typeId === undefined || typeId === null) {
      return null;
    }
    
    var types = this.types;
    for (var i = 0; i < types.length; i++) {
      var type = types[i];
      if (type.id == typeId) {
        return type.symbol;
      }
    }
    return null;
  },*/
  
  _getOutFields: function() {
    // Test Cases:
    /*console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "tid",
      _startTimeField: "stid",
      _endTimeField: "endid",
      _trackIdField: "tkid",
      
      _rendererFields: [ "rndid", "rndid2" ],
      _outFields: null
    }).join(",") === "oid,tid,stid,endid,tkid,rndid,rndid2");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "tid",
      _startTimeField: "stid",
      _endTimeField: "endid",
      _trackIdField: "tkid",
      
      _rendererFields: [ "rndid" ],
      _outFields: [ "*" ]
    }).join(",") === "*");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "tid",
      _startTimeField: "stid",
      _endTimeField: "endid",
      _trackIdField: "tkid",
      
      _rendererFields: [ "rndid" ],
      _outFields: ["f1", "f2"]
    }).join(",") === "f1,f2,oid,tid,stid,endid,tkid,rndid");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "tid",
      _startTimeField: "stid",
      _endTimeField: "endid",
      _trackIdField: "tkid",
      
      _rendererFields: [ "rndid" ],
      _outFields: ["oid", "tkid", "f1", "f2"]
    }).join(",") === "oid,tkid,f1,f2,tid,stid,endid,rndid");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: null,
      _startTimeField: "stid",
      _endTimeField: null,
      _trackIdField: null,
      
      _rendererFields: [ "rndid" ],
      _outFields: null
    }).join(",") === "oid,stid,rndid");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: null,
      typeIdField: null,
      _startTimeField: null,
      _endTimeField: null,
      _trackIdField: null,
      
      _rendererFields: null,
      _outFields: null
    }).join(",") === "");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "OBJECTID",
      typeIdField: "",
      _startTimeField: null,
      _endTimeField: null,
      _trackIdField: "",
      
      _rendererFields: [ "rndid", null, "" ],
      _outFields: null
    }).join(",") === "OBJECTID,rndid");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "stid",
      _startTimeField: null,
      _endTimeField: null,
      _trackIdField: "oid",
      
      _rendererFields: [ "stid" ],
      _outFields: null
    }).join(",") === "oid,stid");
    */
    
    var requiredFields = dojo.filter([
      this.objectIdField,
      this.typeIdField,
      this.creatorField,
      this._startTimeField,
      this._endTimeField,
      this._trackIdField
    ].concat(this._rendererFields), function(field, index, arr) {
      return !!field && (dojo.indexOf(arr, field) === index);
    });
    
    var outFields = dojo.clone(this._outFields);
    if (outFields) {
      if (dojo.indexOf(outFields, "*") !== -1) {
        return outFields;
      }
      
      dojo.forEach(requiredFields, function(field) {
        if (dojo.indexOf(outFields, field) === -1) {
          outFields.push(field);
        }
      });
      return outFields;
    }
    else {
      return requiredFields;
    }
  },
  
  _checkFields: function(inFields) {
    var requiredFields = inFields || this._getOutFields();
    
    dojo.forEach(requiredFields, function(reqField) {
      if (reqField === "*" /*|| reqField === "__object__id__"*/) {
        return;
      }
      
//      var found = dojo.some(this.fields, function(fieldInfo) {
//        return (fieldInfo && fieldInfo.name === reqField) ? true : false;
//      });
      
      if (!this._getField(reqField)) {
        console.debug("esri.layers.FeatureLayer: " + esri.substitute({ url: this.url, field: reqField }, esri.bundle.layers.FeatureLayer.fieldNotFound));
      }
    }, this);
    
    if (!inFields && !this._isTable && !this._fserver && !this._collection) {
      var found = dojo.some(this.fields, function(fieldInfo) {
        return (fieldInfo && fieldInfo.type === "esriFieldTypeGeometry") ? true : false;
      });
      
      if (!found) {
        console.debug("esri.layers.FeatureLayer: " + esri.substitute({ url: this.url }, esri.bundle.layers.FeatureLayer.noGeometryField));
      }
    }
  },
  
  _fixRendererFields: function() {
    var renderer = this.renderer;
    
    if (renderer && this.fields.length > 0) {
      var renderers = dojo.filter([
        renderer, renderer.observationRenderer, 
        renderer.latestObservationRenderer, renderer.trackRenderer
      ], esri._isDefined);
      
      var fields = [];
      dojo.forEach(renderers, function(rnd) {
        var fieldInfo, fieldName;
        
        fieldName = rnd.attributeField;
        if (fieldName) {
          fieldInfo = !this._getField(fieldName) && this._getField(fieldName, true);
          if (fieldInfo) {
            rnd.attributeField = fieldInfo.name;
          }
        }

        fieldName = rnd.attributeField2;
        if (fieldName) {
          fieldInfo = !this._getField(fieldName) && this._getField(fieldName, true);
          if (fieldInfo) {
            rnd.attributeField2 = fieldInfo.name;
          }
        }

        fieldName = rnd.attributeField3;
        if (fieldName) {
          fieldInfo = !this._getField(fieldName) && this._getField(fieldName, true);
          if (fieldInfo) {
            rnd.attributeField3 = fieldInfo.name;
          }
        }

        fields.push(rnd.attributeField);
        fields.push(rnd.attributeField2);
        fields.push(rnd.attributeField3);
      }, this); // for loop
      
      this._rendererFields = dojo.filter(fields, esri._isDefined);
      
    } // if renderer
  },
  
  _getField: function(fieldName, ignoreCase) {
    var fields = this.fields;
    if (fields.length === 0) {
      return null;
    }

    var retVal;
    
    if (ignoreCase) {
      fieldName = fieldName.toLowerCase();
    }
    
    dojo.some(fields, function(fieldInfo) {
      var found = false;
      if (ignoreCase) {
        found = (fieldInfo && fieldInfo.name.toLowerCase() === fieldName) ? true : false;
      }
      else {
        found = (fieldInfo && fieldInfo.name === fieldName) ? true : false;
      }
      
      if (found) {
        retVal = fieldInfo;
      }
      
      return found;
    });
    
    return retVal;
  },
  
  _getDateOpts: function() {
    /*
     * Internally used by Graphic::getTitle and 
     * getContent methods
     */
    
    if (!this._dtOpts) {
      var props = dojo.map(
        dojo.filter(this.fields, function(fieldInfo) {
          return !!(fieldInfo && fieldInfo.type === "esriFieldTypeDate");
        }),
        function(fieldInfo) {
          return fieldInfo.name;
        }
      );
      
      // See esri.substitute for this object's spec
      this._dtOpts = { properties: props };
    }

    return this._dtOpts;
  },
  
  _applyNormalized: function(features, normalized) {
    // note: "features" are mutated with "normalized"
    
    if (features && normalized) {
      dojo.forEach(features, function(feature, index) {
        if (feature && normalized[index]) {
          feature.setGeometry(normalized[index]);
        }
      });
    }
  },
  
  _editHandler: function(response, adds, updatesMap, callback, errback, dfd) {
    var addResults = response.addResults, updateResults = response.updateResults, 
        deleteResults = response.deleteResults, i, result, oid, feature,
        attr, oidField = this.objectIdField,
        mode = this._mode, isTable = this._isTable/*, calculate,
        extent, newExtent, dataSR, fullExtent = this.fullExtent,
        extSR = fullExtent && fullExtent.spatialReference*/;
    
    // TODO
    // do not do display related stuff if the FL is not on the map

    var fieldsInfo = this.editFieldsInfo,
        outFields = this._getOutFields() || [],
        creatorField = fieldsInfo && fieldsInfo.creatorField,
        creationDateField = fieldsInfo && fieldsInfo.creationDateField,
        editorField = fieldsInfo && fieldsInfo.editorField,
        editDateField = fieldsInfo && fieldsInfo.editDateField,
        realm = fieldsInfo && fieldsInfo.realm;
    
    // Make sure the editor tracking fields are defined in the layer's outFields config
    // If they are not defined, we don't want to assign time and userId
    // for newly added and updated features
    if (dojo.indexOf(outFields, "*") === -1) {
      if (creatorField && dojo.indexOf(outFields, creatorField) === -1) {
        creatorField = null;
      }

      if (creationDateField && dojo.indexOf(outFields, creationDateField) === -1) {
        creationDateField = null;
      }

      if (editorField && dojo.indexOf(outFields, editorField) === -1) {
        editorField = null;
      }

      if (editDateField && dojo.indexOf(outFields, editDateField) === -1) {
        editDateField = null;
      }
    }

    // Calculate currentTime and userId if required
    var currentTime = (creationDateField || editDateField) ? 
                      (new Date()).getTime() : null,
        userId = (creatorField || editorField) ? 
                 this.getUserId() : undefined;
    
    if (userId && realm) {
      userId = userId + "@" + realm;
      
      // Note that realm will not be appended to anonymous users 
      // (i.e. <empty-string> values) either
    }
    
    if (addResults) {
      /*if (this._collection) {
        dataSR = dojo.getObject("0.geometry.spatialReference", false, adds);

        if ( !extSR || (dataSR && extSR._isEqual(dataSR)) ) {
          console.log("[ calculating extent 2... ]");
          calculate = true;
        }
      }*/
      
      for (i = 0; i < addResults.length; i++) {
        addResults[i] = new esri.layers.FeatureEditResult(addResults[i]);
        if (isTable) {
          continue;
        }
        
        result = addResults[i];
        if (result.success) {
          oid = result.objectId;
          feature = adds[i];
          
          var gl = feature._graphicsLayer;
          if (gl && gl !== this) {
            gl.remove(feature);
          }
          
          // attach the object id returned to the feature
          attr = feature.attributes || {};
          
          attr[oidField] = oid;
          
          if (creatorField) {
            attr[creatorField] = userId;
          }
          
          if (editorField) {
            attr[editorField] = userId;
          }
          
          if (creationDateField) {
            attr[creationDateField] = currentTime;
          }
          
          if (editDateField) {
            attr[editDateField] = currentTime;
          }
          
          feature.setAttributes(attr);
          
          if (mode._init) {
            mode.drawFeature(feature);
          }
          
          // extent calculation
          /*if (calculate) {
            extent = feature.geometry && feature.geometry.getExtent();
            
            if (extent) {
              newExtent = newExtent ? (newExtent.union(extent)) : extent;
            }
          }*/
          
        }
      } // for
      
      /*if (newExtent) {
        this.fullExtent = extSR ? (fullExtent.union(newExtent)) : newExtent;
      }*/
    }
    
    if (updateResults) {
      //var selected = this._selectedFeatures, selSymbol = this._selectionSymbol;
      for (i = 0; i < updateResults.length; i++) {
        updateResults[i] = new esri.layers.FeatureEditResult(updateResults[i]);
        if (isTable) {
          continue;
        }
        
        result = updateResults[i];
        if (result.success) {
          oid = result.objectId;
          feature = updatesMap[oid];
          
          // update geometry - technically we don't have to
          // update because "found" and "feature" should be
          // one and the same 
          var found = mode._getFeature(oid);
          if (found) {
            if (found.geometry !== feature.geometry) {
              found.setGeometry(esri.geometry.fromJson(feature.geometry.toJson()));
            }
            
            /*if (!(oid in selected) || !selSymbol) {
              // trigger repaint
              found.setSymbol(null);
            }*/
            this._repaint(found, oid);
          } // found
          
          feature = found || feature;

          attr = feature.attributes || {};
          
          if (editorField) {
            attr[editorField] = userId;
          }
          
          if (editDateField) {
            attr[editDateField] = currentTime;
          }

          feature.setAttributes(attr);
        }
      } // for
    }
    
    if (deleteResults) {
      var unselected = [];
      for (i = 0; i < deleteResults.length; i++) {
        deleteResults[i] = new esri.layers.FeatureEditResult(deleteResults[i]);
        if (isTable) {
          continue;
        }
        
        result = deleteResults[i];
        if (result.success) {
          oid = result.objectId;
          feature = mode._getFeature(oid);
          if (feature) {
            // unselect
            if (this._unSelectFeatureIIf(oid, mode)) {
              unselected.push(feature);
            }
            
            // force remove
            feature._count = 0;
            mode._removeFeatureIIf(oid);
          } // if feature
        }
      } // for
      
      /*if (this._collection && this.graphics.length === 0) {
        console.log("deleting fullExtent property");
        delete this.fullExtent;
      }*/
      
      if (unselected.length > 0) {
        this.onSelectionComplete(unselected, this.constructor.SELECTION_SUBTRACT);
      }
    }
    
    // disseminate the information
    /*this.onEditsComplete(addResults, updateResults, deleteResults);
    if (callback) {
      callback(addResults, updateResults, deleteResults);
    }*/
    this._resolve([addResults, updateResults, deleteResults], "onEditsComplete", callback, dfd);
  },
  
  _sendAttachment: function(type, objectId, formNode, callback, errback) {
    var operationName = (type === "add") ? "addAttachment" : "updateAttachment",
        url = this._url.path + "/" + objectId + "/" + operationName,
        self = this;

    /*formNode.enctype = "multipart/form-data";
    if (dojo.isIE < 9) {
      // in IE, dynamically setting the value of "enctype" attribute
      // does not seem to take effect
      formNode.encoding = "multipart/form-data";
    }
    formNode.method = "post";
    
    var elements = formNode.elements;
    
    // add "f" if not already in the form
    if ( !dojo.some(elements, function(el) { return el.name === "f"; }) ) {
      formNode.appendChild( dojo.create("input", { type: "hidden", name: "f", value: "json" }) );
    }
    
    // add "callback.html" if not already in the form
    if ( !dojo.some(elements, function(el) { return el.name === "callback.html"; }) ) {
      formNode.appendChild( dojo.create("input", { type: "hidden", name: "callback.html", value: "textarea" }) );
    }
    
    // add token
    var token = this._getToken();
    if (token && !dojo.some(elements, function(el) { return el.name === "token"; }) ) {
      formNode.appendChild( dojo.create("input", { type: "hidden", name: "token", value: token }) );
    }
    
    var dfd = new dojo.Deferred(esri._dfdCanceller),
        self = this,
        _errorFunc = function(error) {
          if (!(error instanceof Error)) {
            error = dojo.mixin(new Error(), error);
          }
          //if (errback) {
            //errback(error);
          //}
          self._resolve([error], null, errback, dfd, true);
        },
        proxy = (esri.config.defaults.io.alwaysUseProxy || !esri._hasSameOrigin(url, window.location.href)) ? 
                esri._getProxyUrl() : 
                null;
    
    dfd._pendingDfd = dojo.io.iframe.send({
      url: (proxy ? (proxy.path + "?") : "") + url + "?callback.html=textarea",
      form: formNode,
      handleAs: "json",
      
      load:  dojo.hitch(this, function(response, io) {
        var error = response.error;
        if (error) {
          _errorFunc(error);
          return;
        }
        
        var propertyName = (type === "add") ? "addAttachmentResult" : "updateAttachmentResult";
        var eventName = (type === "add") ? "onAddAttachmentComplete" : "onUpdateAttachmentComplete";
        
        var result = new esri.layers.FeatureEditResult(response[propertyName]);
        result.attachmentId = result.objectId;
        result.objectId = objectId;
        
        //this[eventName](result);
        //if (callback) {
          //callback(result);
        //}
        
        self._resolve([result], eventName, callback, dfd);
      }), // load handler
      
      error: _errorFunc
    });*/
    
    var dfd = esri.request({
      url: url,
      form: formNode,
      content: dojo.mixin(this._url.query, {f:"json", token: this._getToken() || undefined}),
      callbackParamName: "callback.html",
      handleAs: "json"
    })
    .addCallback(function(response) {
      var propertyName = (type === "add") ? "addAttachmentResult" : "updateAttachmentResult",
          eventName = (type === "add") ? "onAddAttachmentComplete" : "onUpdateAttachmentComplete",
          result = new esri.layers.FeatureEditResult(response[propertyName]);
          
      result.attachmentId = result.objectId;
      result.objectId = objectId;
      
      self._resolve([result], eventName, callback);
      return result;
    })
    .addErrback(function(error) {
      self._resolve([error], null, errback, null, true);
    });
    
    return dfd;
  },
  
  _repaint: function(feature, oid, force) {
    oid = esri._isDefined(oid) ? oid : feature.attributes[this.objectIdField];
    if (!(oid in this._selectedFeatures) || !this._selectionSymbol) {
      // repaint only when:
      // - the feature is not selected, or
      // - the feature is selected but the layer has no selection symbol
      feature.setSymbol(feature.symbol, force);
    }
  },
  
  /***************************
   * Tracking related methods
   ***************************/
  
  _getKind: function(feature) {
    var trackManager = this._trackManager;
    if (trackManager) {
      return trackManager.isLatestObservation(feature) ? 1 : 0;
    }
    return 0;
  }
  
});

// mixin enums for FeatureLayer
dojo.mixin(esri.layers.FeatureLayer, {
  MODE_SNAPSHOT: 0,
  MODE_ONDEMAND: 1,
  MODE_SELECTION: 2,
  SELECTION_NEW: 3,
  SELECTION_ADD: 4,
  SELECTION_SUBTRACT: 5,
  POPUP_NONE: "esriServerHTMLPopupTypeNone",
  POPUP_HTML_TEXT: "esriServerHTMLPopupTypeAsHTMLText",
  POPUP_URL: "esriServerHTMLPopupTypeAsURL"
});

esri._createWrappers("esri.layers.FeatureLayer");

/**************************
 * esri.layers.FeatureType
 **************************/

dojo.declare("esri.layers.FeatureType", null, {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.id = json.id;
      this.name = json.name;

      var symbol = json.symbol;
      
      if (symbol) {
        this.symbol = esri.symbol.fromJson(symbol);
      }
      
      // domains
      var domains = json.domains, field, i;
      var domainObjs = this.domains = {};
      for (field in domains) {
        if (domains.hasOwnProperty(field)) {
          var domain = domains[field];
          switch(domain.type) {
            case "range":
              domainObjs[field] = new esri.layers.RangeDomain(domain);
              break;
            case "codedValue":
              domainObjs[field] = new esri.layers.CodedValueDomain(domain);
              break;
            case "inherited":
              domainObjs[field] = new esri.layers.InheritedDomain(domain);
              break;
          }
        } // if
      }
      
      // templates
      var templates = json.templates;
      if (templates) {
        var templateObjs = this.templates = [];
        for (i = 0; i < templates.length; i++) {
          templateObjs.push(new esri.layers.FeatureTemplate(templates[i]));
        }
      }
      
    } // json
  },
  
  toJson: function() {
    var json = {
      id: this.id,
      name: this.name,
      symbol: this.symbol && this.symbol.toJson()
    };
    
    var field, domains = this.domains, templates = this.templates, sanitize = esri._sanitize;
    if (domains) {
      var newCopy = json.domains = {};
      for (field in domains) {
        if (domains.hasOwnProperty(field)) {
          newCopy[field] = domains[field] && domains[field].toJson();
        }
      }
      sanitize(newCopy);
    }
    if (templates) {
      json.templates = dojo.map(templates, function(template) {
        return template.toJson();
      });
    }
    
    return sanitize(json);
  }
});

/******************************
 * esri.layers.FeatureTemplate
 ******************************/

dojo.declare("esri.layers.FeatureTemplate", null, {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.name = json.name;
      this.description = json.description;
      this.drawingTool = json.drawingTool;
      
      // prototypical feature
      var prototype = json.prototype;
      this.prototype = new esri.Graphic(prototype.geometry, null, prototype.attributes);
    }
  },
  
  toJson: function() {
    return esri._sanitize({
      name: this.name,
      description: this.description,
      drawingTool: this.drawingTool,
      prototype: this.prototype && this.prototype.toJson() 
    });
  }
});

// mixin enums for FeatureTemplate
dojo.mixin(esri.layers.FeatureTemplate, {
  TOOL_AUTO_COMPLETE_POLYGON: "esriFeatureEditToolAutoCompletePolygon",
  TOOL_CIRCLE: "esriFeatureEditToolCircle", // mapped to TOOL_POLYGON
  TOOL_ELLIPSE: "esriFeatureEditToolEllipse", // mapped to TOOL_POLYGON
  TOOL_FREEHAND: "esriFeatureEditToolFreehand",
  TOOL_LINE: "esriFeatureEditToolLine",
  TOOL_NONE: "esriFeatureEditToolNone", // for non-spatial tables; cannot be set for spatial data in ArcMap
  TOOL_POINT: "esriFeatureEditToolPoint",
  TOOL_POLYGON: "esriFeatureEditToolPolygon",
  TOOL_RECTANGLE: "esriFeatureEditToolRectangle",
  TOOL_ARROW: "esriFeatureEditToolArrow",
  TOOL_TRIANGLE: "esriFeatureEditToolTriangle",
  TOOL_LEFT_ARROW: "esriFeatureEditToolLeftArrow",
  TOOL_RIGHT_ARROW: "esriFeatureEditToolRightArrow",
  TOOL_UP_ARROW: "esriFeatureEditToolUpArrow",
  TOOL_DOWN_ARROW: "esriFeatureEditToolDownArrow"
});

/********************************
 * esri.layers.FeatureEditResult
 ********************************/

dojo.declare("esri.layers.FeatureEditResult", null, {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.objectId = json.objectId;
      this.success = json.success;
      if (!json.success) {
        var err = json.error;
        this.error = new Error();
        this.error.code = err.code;
        this.error.message = err.description;
      }
    }
  }
});

/**************************
 * esri.layers._RenderMode
 **************************/

dojo.declare("esri.layers._RenderMode", null, {
  constructor: function() {
    this._prefix = "jsonp_" + (dojo._scopeName || "dojo") + "IoScript";
  },
//  layerInfoHandler: function(layerInfo) {},
  initialize: function(map) {},
  propertyChangeHandler: function(type) {
    /*
     * type = 0 denotes map time extent changed
     * type = 1 denotes layer definition expression changed
     * type = 2 denotes layer time definition changed
     */
  },
  destroy: function() {},
  drawFeature: function(feature) {},
  suspend: function() {},
  resume: function() {},
  refresh: function() {},
  
  _incRefCount: function(oid) {
    var found = this._featureMap[oid];
    if (found) {
      found._count++;
    }
  },
  
  _decRefCount: function(oid) {
    var found = this._featureMap[oid];
    if (found) {
      found._count--;
    }
  },
  
  _getFeature: function(oid) {
    return this._featureMap[oid];
  },
  
  _addFeatureIIf: function(oid, feature) {
    var fmap = this._featureMap, found = fmap[oid], layer = this.featureLayer; //, template = layer._infoTemplate;
    if (!found) {
      fmap[oid] = feature;
      /*if (template) {
        feature.setInfoTemplate(template);
      }*/
      layer._add(feature);
      feature._count = 0;
    }
    return found || feature;
  },
  
  _removeFeatureIIf: function(oid) {
    var found = this._featureMap[oid], layer = this.featureLayer;
    if (found) {
      if (found._count) {
        return;
      }
      delete this._featureMap[oid];
      layer._remove(found); 
    }
    return found;
  },
  
  _clearIIf: function() {
    var i, layer = this.featureLayer, graphics = layer.graphics, 
        selected = layer._selectedFeatures, oidField = layer.objectIdField;
        
    for (i = graphics.length - 1; i >= 0; i--) {
      var feature = graphics[i];
      var oid = feature.attributes[oidField];
      if (oid in selected) {
        feature._count = 1;
        continue;
      }
      feature._count = 0;
      this._removeFeatureIIf(oid);
    }
  },
  
//  _fireUpdateStart: function() {
//    if (this._started) {
//      return;
//    }
//    this._started = true;
//    this.featureLayer.onUpdateStart();
//  },
//  
//  _fireUpdateEnd: function() {
//    this._started = false;
//    this.featureLayer.onUpdateEnd();
//  },
  
  _isPending: function(id) {
    var dfd = dojo.io.script[this._prefix + id]; // see dojo.io.script._makeScriptDeferred
    return dfd ? true : false;
  },
  
  // Methods to make ETags useful
  _cancelPendingRequest: function(dfd, id) {
    dfd = dfd || dojo.io.script[this._prefix + id]; // see dojo.io.script._makeScriptDeferred
    if (dfd) {
      try {
        dfd.cancel(); // call ends up at dojo.io.script._deferredCancel
        dojo.io.script._validCheck(dfd);
        //console.info(dfd.startTime, dfd.canceled, dfd);
      }
      catch(e) {}
    }
  },
  
  _purgeRequests: function() {
    // The first argument is not used in this method
    dojo.io.script._validCheck(null);
  },

  _toggleVisibility: function(/*Boolean*/ show) {
    var layer = this.featureLayer, graphics = layer.graphics, 
        methodName = show ? "show" : "hide", i, len = graphics.length;
    
    show = show && layer._ager; // show morphs here
    for (i = 0; i < len; i++) {
      var graphic = graphics[i];
      graphic[methodName]();
      if (show) {
        layer._repaint(graphic);
      }
    }
  },

  _applyTimeFilter: function(silent) {
    // Display only features that belong in the intersection of
    // snapshot time definition and map time extent
    
    var layer = this.featureLayer;
    if (!layer.timeInfo || layer._suspended) {
      // layer is not time aware
      return;
    }
    
    if (!silent) {
      layer._fireUpdateStart();
    }
    
    // clear all the track lines
    var trackManager = layer._trackManager;
    if (trackManager) {
      trackManager.clearTracks();
    }
     
    var defn = layer.getTimeDefinition(), timeExtent = layer._getOffsettedTE(layer._mapTimeExtent);
    if (timeExtent) {
      timeExtent = layer._getTimeOverlap(defn, timeExtent);
      if (timeExtent) { // there is overlap, do filter
        //console.log("Snapshot Client Filter ", "query.timeExtent: ", timeExtent.startTime, ", ", timeExtent.endTime);
        var result = layer._filterByTime(layer.graphics, timeExtent.startTime, timeExtent.endTime);
    
        if (trackManager) {
          trackManager.addFeatures(result.match);
        }
        dojo.forEach(result.match, function(graphic) {
          var shape = graphic._shape;
          if (!graphic.visible) {
            graphic.show();
            shape = graphic._shape;
            shape && shape._moveToFront();
          }
          if (layer._ager && shape) {
            layer._repaint(graphic);
          }
        });
        
        dojo.forEach(result.noMatch, function(graphic) {
          if (graphic.visible) {
            graphic.hide();
          }
        });
      }
      else { // there is no overlap, so hide everything
        this._toggleVisibility(false);
      }
    }
    else { // map time extent is set to null
      if (trackManager) {
        trackManager.addFeatures(layer.graphics);
      }
      this._toggleVisibility(true);
    }
    
    // draw track lines corresponding to the observations
    if (trackManager) {
      trackManager.moveLatestToFront();
      trackManager.drawTracks();
    }
    
    if (!silent) {
      layer._fireUpdateEnd();
    }
  }
});

/*****************************
 * esri.layers._SelectionMode
 *****************************/

dojo.declare("esri.layers._SelectionMode", [ esri.layers._RenderMode ], {
  
  /************
   * Overrides 
   ************/
  
  constructor: function(featureLayer) {
    //console.log("entering 'selection only' mode...");
    this.featureLayer = featureLayer;
    this._featureMap = {};
  },
  
//  layerInfoHandler: function(layerInfo) {
//    this.layerInfo = layerInfo;
//  },

  initialize: function(map) {
    this.map = map;
    this._init = true;
  },

  propertyChangeHandler: function(type) {
    if (this._init && type === 0) {
      // map time extent changed
      this._applyTimeFilter();
    }
  },

  destroy: function() {
    this._init = false;
  },
  
  resume: function() {
    this.propertyChangeHandler(0);
  }
});

/****************************
 * esri.layers._SnapshotMode
 ****************************/

dojo.declare("esri.layers._SnapshotMode", [ esri.layers._RenderMode ], {
  
  /************
   * Overrides 
   ************/
  
  constructor: function(featureLayer) {
    //console.log("entering 'snapshot' mode...");
    this.featureLayer = featureLayer;
    this._featureMap = {};
    this._drawFeatures = dojo.hitch(this, this._drawFeatures);
    this._queryErrorHandler = dojo.hitch(this, this._queryErrorHandler);
  },
  
//  layerInfoHandler: function(layerInfo) {
//    this.layerInfo = layerInfo;
//  },

  initialize: function(map) {
    this.map = map;
    var layer = this.featureLayer;
    if (layer._collection) {
      /*layer._fireUpdateStart();
      
      // create and assign unique ids for features 
      var featureSet = layer._featureSet;
      delete layer._featureSet;
      
      this._drawFeatures(new esri.tasks.FeatureSet(featureSet));
      layer._fcAdded = true;*/
     
      this._applyTimeFilter();
    }
    else {
      this._fetchAll();
    }
    this._init = true;
  },

  propertyChangeHandler: function(type) {
    if (this._init) {
      if (type) {
        this._fetchAll();
      }
      else { // map time extent changed
        this._applyTimeFilter();
      }
    }
  },

  destroy: function() {
    this._init = false;
  },
  
  drawFeature: function(feature) {
    var layer = this.featureLayer, oidField = layer.objectIdField, oid = feature.attributes[oidField];
    //if (!layer._isDeleted(feature)) {
      this._addFeatureIIf(oid, feature);
      this._incRefCount(oid);
    //}
  },
  
  resume: function() {
    this.propertyChangeHandler(0);
  },
  
  refresh: function() {
    var layer = this.featureLayer;
    
    if (layer._collection) {
      layer._fireUpdateStart();
      layer._refresh(true);
      layer._fireUpdateEnd();
    }
    else {
      this._fetchAll();
    }
  },
  
  /*******************
   * Internal Methods
   *******************/
  
  _getRequestId: function(layer) {
    var id = "_" + layer.name + layer.layerId + layer._ulid;
    return id.replace(/[^a-zA-Z0-9\_]+/g, "_"); // cannot have hyphens in callback function names
  },
  
  _fetchAll: function() {
    var layer = this.featureLayer;
    if (layer._collection) {
      return;
    }

    layer._fireUpdateStart();
    this._clearIIf();
    this._sendRequest();
  },
  
  _sendRequest: function() {
    //console.log("fetching...");
    var map = this.map, layer = this.featureLayer, defExpr = layer.getDefinitionExpression();
    
    var query = new esri.tasks.Query();
    query.outFields = layer._getOutFields();
    query.where = defExpr || "1=1";
    query.returnGeometry = true;
    query.outSpatialReference = new esri.SpatialReference(map.spatialReference.toJson());
    query.timeExtent = layer.getTimeDefinition();
    //query.timeExtent && console.log("Snapshot ", "query.timeExtent: ", query.timeExtent.startTime, ", ", query.timeExtent.endTime);
    query.maxAllowableOffset = layer._maxOffset;
    if (layer._ts) {
      query._ts = (new Date()).getTime();
    }

    var callbackSuffix;
    if (layer._usePatch) {
      // get an id for this request
      callbackSuffix = this._getRequestId(layer);

      // cancel the previous request of the same kind
      this._cancelPendingRequest(null, callbackSuffix);
    }
  
    layer._task.execute(query, this._drawFeatures, this._queryErrorHandler, callbackSuffix);
  },
    
  _drawFeatures: function(response) {
    //console.log("drawing");
    this._purgeRequests();

    var features = response.features, layer = this.featureLayer, 
        oidField = layer.objectIdField, i, len = features.length,
        feature, oid/*, newExtent, extent, calculate*/;
    
    /*if (layer._collection) {
      var extSR = layer.fullExtent && layer.fullExtent.spatialReference;
      
      if (!extSR) {
        console.log("[ calculating extent... ]");
        calculate = true;
      }
    }*/
    
    // add features to the map
    for (i = 0; i < len; i++) {
      feature = features[i];
      oid = feature.attributes[oidField];
      //if (!layer._isDeleted(feature)) {
        this._addFeatureIIf(oid, feature);
        this._incRefCount(oid);
      //}
      
      /*if (calculate) {
        extent = feature.geometry && feature.geometry.getExtent();
        
        if (extent) {
          newExtent = newExtent ? (newExtent.union(extent)) : extent;
        }
      }*/
    }
    
    /*if (newExtent) {
      layer.fullExtent = newExtent;
    }*/
    
    // process and apply map time extent
    this._applyTimeFilter(true);
    
    layer._fireUpdateEnd(null, response.exceededTransferLimit ? { queryLimitExceeded: true } : null);
    
    if (response.exceededTransferLimit) {
      layer.onQueryLimitExceeded();
    }
  },
  
  _queryErrorHandler: function(err) {
    //console.log("query error! ", err);
    
    this._purgeRequests();
    
    var layer = this.featureLayer;
    layer._errorHandler(err);
    layer._fireUpdateEnd(err);
  }
  
});

/****************************
 * esri.layers._OnDemandMode
 ****************************/

dojo.declare("esri.layers._OnDemandMode", [ esri.layers._RenderMode ], {
  
  /************
   * Overrides 
   ************/
  
  constructor: function(featureLayer) {
    //console.log("entering 'on-demand' mode...");
    this.featureLayer = featureLayer;
    this._featureMap = {};
    this._queryErrorHandler = dojo.hitch(this, this._queryErrorHandler);
  },
  
//  layerInfoHandler: function(layerInfo) {
//    this.layerInfo = layerInfo;
//  },
  
  initialize: function(map) {
    this.map = map;
    this._initialize();
    this._init = true;
  },
  
  propertyChangeHandler: function(type) {
    if (this._init) {
      if (type < 2) {
        this._zoomHandler();
      }
      // On-demand mode is not affected by time definition (type = 2)?
    }
  },
  
  destroy: function() {
    this._disableConnectors();
    this._init = false;
  },
  
  drawFeature: function(feature) {
    // find the cells touching the feature
    var gridLayer = this._gridLayer, geom = feature.geometry, cells = [];

    if (!geom) {
      return;
    }
    
    cells = gridLayer.getCellsInExtent(
      (geom.type === "point") ?
       { xmin: geom.x, ymin: geom.y, xmax: geom.x, ymax: geom.y } :
       geom.getExtent(),
       false
    ).cells;
    
    //console.log("cells = ", cells);
    
    // add and set ref-count based on the #cells this feature intersects
    var cellMap = this._cellMap, i, cell,
        oid = feature.attributes[this.featureLayer.objectIdField],
        cLatticeID, row, col;
    
    for (i = 0; i < cells.length; i++) {
      cell = cells[i];
      cLatticeID = cell.latticeID;
      row = cell.row;
      col = cell.col;
      
      if (cLatticeID) {
        cell = (cellMap[cLatticeID] = (cellMap[cLatticeID] || cell));
      }
      else {
        cellMap[row] = cellMap[row] || {};
        cell = (cellMap[row][col] = (cellMap[row][col] || cell));
      }
      
      cell.features = cell.features || [];
      cell.features.push(feature);
      
      this._addFeatureIIf(oid, feature);
      this._incRefCount(oid);
    }
  },
  
  suspend: function() {
    if (!this._init) {
      return;
    }
    this._disableConnectors();
  },
  
  resume: function() {
    if (!this._init) {
      return;
    }
    this._enableConnectors();
    this._zoomHandler();
  },
  
  refresh: function() {
    this._zoomHandler();
  },
  
  /*******************
   * Internal Methods
   *******************/
  
  _initialize: function() {
    var map = this.map, layer = this.featureLayer;
    
    // Set -180 as the grid layout origin
    // NOTE: _wrap and _srInfo are defined by _GraphicsLayer::_setMap
    var srInfo = /*layer._wrap &&*/ layer._srInfo;
    
    this._gridLayer = new esri.layers._GridLayout(
//      map.extent.getCenter(),
      new esri.geometry.Point(srInfo ? srInfo.valid[0] : map.extent.xmin, map.extent.ymax, map.spatialReference),
      { width: layer._tileWidth, height: layer._tileHeight }, 
      { width: map.width, height: map.height },
      srInfo
    );
  
    this._ioQueue = [];
    if (!layer._suspended) {
      this._zoomHandler();
      this._enableConnectors();
    }
  },
  
  _enableConnectors: function() {
    var map = this.map;
    this._zoomConnect = dojo.connect(map, "onZoomEnd", this, this._zoomHandler);
    this._panConnect = dojo.connect(map, "onPanEnd", this, this._panHandler);
    this._resizeConnect = dojo.connect(map, "onResize", this, this._panHandler);
  },
  
  _disableConnectors: function() {
    dojo.disconnect(this._zoomConnect);
    dojo.disconnect(this._panConnect);
    dojo.disconnect(this._resizeConnect);
  },
    
  _zoomHandler: function() {
    this._processIOQueue(true);
    var layer = this.featureLayer, map = this.map;
    
    // we need to do this check here because even though
    // this zoom handler is disconnected on suspend, the handler
    // is still called one last time. Reason: suspension also happens in one of 
    // the zoom end listeners and this handler is not removed (in practice) from the
    // list of listeners that dojo maintains as part of connect-disconnect
    // infrastructure (the zoom end callback sequence has already started)
    // Perhaps, we can remove this check when ondemand uses "onExtentChange"
    // instead of "onZoomEnd"
    if (layer._suspended) {
      return;
    }
    
    /*if (layer._autoGeneralize) {
      layer._maxOffset = Math.floor(map.extent.getWidth() / map.width);
    }*/

    layer._fireUpdateStart();
    this._clearIIf();
    var trackManager = layer._trackManager;
    if (trackManager) {
      trackManager.clearTracks();
    }

    this._cellMap = {};
    this._gridLayer.setResolution(map.extent);
    
    this._sendRequest();
  },
    
  _panHandler: function() {
    this.featureLayer._fireUpdateStart();
    this._sendRequest(this.featureLayer._resized && arguments[0]);
  },
  
  _getRequestId: function(layer, cell) {
    var id = "_" + layer.name + layer.layerId + layer._ulid + "_" + cell.resolution + "_" + 
             (cell.latticeID || (cell.row + "_" +  cell.col));
    
    return id.replace(/[^a-zA-Z0-9\_]+/g, "_"); // cannot have hyphens in callback function names
  },
  
  _sendRequest: function(resized) {
    //console.log("fetching...");
    this._exceeds = false;
    
    var layer = this.featureLayer, map = this.map, extent = resized || map.extent,
        gridInfo = this._gridLayer.getCellsInExtent(extent, layer.latticeTiling), 
        cells = gridInfo.cells;
    
    //console.log(gridInfo.minRow, gridInfo.maxRow, gridInfo.minCol, gridInfo.maxCol);
    
//    // debug
//    this._debugClear();
//    this._debugInfo(cells);

    if (!layer.isEditable()) {
      // filter out the cells that already have content (optimization for non-editable layers)
      var cellMap = this._cellMap;
      cells = dojo.filter(cells, function(cell) {
        // cell map lookup
        if (cell.lattice) {
          if (cellMap[cell.latticeID]) {
            return false;
          }
        }
        else if (cellMap[cell.row] && cellMap[cell.row][cell.col]) {
          return false;
        }
        return true;
      });
    }

    var fields = layer._getOutFields(),
        where = layer.getDefinitionExpression(),
        time = layer._getOffsettedTE(layer._mapTimeExtent),
        patch = layer._usePatch, ioQueue = this._ioQueue, i,
        self = this, func = this._drawFeatures, cell, query, callbackSuffix;
    //time && console.log("OnDemand ", "query.timeExtent: ", time.startTime, ", ", time.endTime);
    
    // send requests
    //this._pending = cells.length;
    this._pending = this._pending || 0;
    for (i = 0; i < cells.length; i++) {
      cell = cells[i];
      
      // query
      query = new esri.tasks.Query();
      query.geometry = cell.extent || cell.lattice;
      query.outFields = fields;
      query.where = where;
      if (layer.latticeTiling && cell.extent) {
        query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
      }
      query.returnGeometry = true;
      query.timeExtent = time;
      query.maxAllowableOffset = layer._maxOffset;
      if (layer._ts) {
        query._ts = (new Date()).getTime();
      }
      
      callbackSuffix = null;
      if (patch) {
        // callback suffix
        callbackSuffix = this._getRequestId(layer, cell);
        
        // cancel the previous request for the given zoom level, row, col
        //this._cancelPendingRequest(callbackSuffix);
        
        if (this._isPending(callbackSuffix)) {
          continue;
        }
      }
    
      // execute
      //console.log("requesting for cell: ", cell.row, cell.col);
      this._pending++;
      ioQueue.push(layer._task.execute(query, function() {
        var cellInfo = cell;
        return function(response) { // callback
          func.apply(self, [ response, cellInfo ]);
        };
      }.call(this), this._queryErrorHandler, callbackSuffix));
    } // loop
    
    //console.log("pending = ", this._pending, ioQueue);
    this._removeOldCells(extent);
    this._endCheck();
  },
    
  _drawFeatures: function(response, cell) {
    //console.log("drawing " + cell.row + ", " + cell.col + "," + cell.resolution);
    this._exceeds = this._exceeds || response.exceededTransferLimit;
    this._finalizeIO();
    
    var layer = this.featureLayer, map = this.map, mExtent = map.extent, 
        cExtent = cell.extent, row = cell.row, col = cell.col, 
        oidField = layer.objectIdField,
        features = response.features, gridLayer = this._gridLayer,
        // lookup cell map
        cellMap = this._cellMap, i, len,
        cLatticeID = cell.latticeID,
        found = cLatticeID ? cellMap[cLatticeID] : (cellMap[row] && cellMap[row][col]);
    
    // don't add the cell if it does not intersect the current map extent or does not belong to this level
    if ( 
      (cell.resolution != gridLayer._resolution) || 
      ( 
        cLatticeID ? 
        (cLatticeID !== gridLayer.getLatticeID(mExtent)) : 
        (!gridLayer.intersects(cExtent, mExtent)) 
      )
    ) {
      if (found) {
        this._removeCell(row, col, cLatticeID);
      }
    }
    // already displayed, update it
    else if (found) {
      // update existing cell with new features
      this._updateCell(found, features);
    }
    else {
      // record
      cell.features = features;
      
      if (cLatticeID) {
        cellMap[cLatticeID] = cell;
      }
      else {
        cellMap[row] = cellMap[row] || {};
        cellMap[row][col] = cell;
      }
      
      len = features.length;
      
      // add features to the map
      for (i = 0; i < len; i++) {
        var feature = features[i];
        var oid = feature.attributes[oidField];
        
        //if (!layer._isDeleted(feature)) {
          this._addFeatureIIf(oid, feature);
          this._incRefCount(oid);
        //}
        //console.log(" [count] ", feature.attributes["STATE_NAME"], fmap[oid]._count);
      } // loop
    }
    
    // Be careful when adding code here! Consider branching above.

    // finalize the request    
    this._endCheck();
  },
  
  _queryErrorHandler: function(err) {
    //console.log("query error! ", err);
    
    this._finalizeIO();
    this.featureLayer._errorHandler(err);
    this._endCheck(true);
  },
  
  _finalizeIO: function() {
    this._purgeRequests();
    this._pending--;
  },
  
  _endCheck: function(isError) {
    if (this._pending === 0) {
      this._processIOQueue();
      
      // tracking functionality
      var layer = this.featureLayer, trackManager = layer._trackManager;
      if (trackManager) {
        trackManager.clearTracks();
        trackManager.addFeatures(layer.graphics);
        if (layer._ager) {
          dojo.forEach(layer.graphics, function(graphic) {
            if (graphic._shape) {
              layer._repaint(graphic);
            }
          });
        }
        trackManager.moveLatestToFront();
        trackManager.drawTracks();
      }
      
      this.featureLayer._fireUpdateEnd(
        isError && new Error("FeatureLayer: " + esri.bundle.layers.FeatureLayer.updateError),
        this._exceeds ? { queryLimitExceeded: true } : null
      );
      
      if (this._exceeds) {
        layer.onQueryLimitExceeded();
      }
    }
  },
  
  _processIOQueue: function(cancel) {
    this._ioQueue = dojo.filter(this._ioQueue, function(dfd) {
      var keep = dfd.fired > -1 ? /*success or error*/ false : /*initial condition*/ true;
      return keep;
    });
    
    if (cancel) {
      dojo.forEach(this._ioQueue, this._cancelPendingRequest);
    }
  },
  
  _removeOldCells: function(extent) {
    var cellMap = this._cellMap, gridLayer = this._gridLayer, rowNum, colNum;
    
    for (rowNum in cellMap) {
      if (cellMap[rowNum]) { // can be a rowNum or latticeID
        var row = cellMap[rowNum],
            cLatticeID = row.latticeID,
            count = 0, removed = 0;
        
        if (cLatticeID) { // lattice entry
          count++;
          if (cLatticeID !== gridLayer.getLatticeID(extent)) {
            this._removeCell(null, null, cLatticeID);
            removed++;
          }
        }
        else { // regular row/col entry
          for (colNum in row) {
            if (row[colNum]) {
              count++;
              var cExtent = row[colNum].extent;
              //if (!cExtent.intersects(extent)) { // remove the cell if it does not intersect the given extent
              if (!gridLayer.intersects(cExtent, extent)) {
                //console.log("[removing old cell] ", rowNum, colNum);
                this._removeCell(rowNum, colNum);
                removed++;
              } // does not intersect
            }
          } // cols
        }
        
        if (removed === count) { // empty row
          delete cellMap[rowNum];
        }
      }
    } // rows
  },
  
  _updateCell: function(cell, latestFeatures) {
    //console.log("_updateCell");
    var layer = this.featureLayer, oidField = layer.objectIdField, selected = layer._selectedFeatures,
        i, len = latestFeatures.length;
    
    cell.features = cell.features || [];
    
    for (i = 0; i < len; i++) {
      var feature = latestFeatures[i];
      var oid = feature.attributes[oidField];
      
      var found = this._addFeatureIIf(oid, feature);
      if (found === feature) { // this feature is a new member of the cell
        this._incRefCount(oid);
        cell.features.push(found);
      }
      else { // update the existing feature (geometry and attributes) if not selected
        if (!(oid in selected)) {
          found.setGeometry(feature.geometry);
          found.setAttributes(feature.attributes);
        }
      }
    } // for loop
  },
    
  _removeCell: function(row, col, cLatticeID) {
    var cellMap = this._cellMap, layer = this.featureLayer, oidField = layer.objectIdField;
    var cell = cLatticeID ? cellMap[cLatticeID] : (cellMap[row] && cellMap[row][col]);

    if (cell) {
      // delete cell map 
      if (cLatticeID) {
        delete cellMap[cLatticeID];
      }
      else {
        delete cellMap[row][col];
      }

      // remove cell's features
      var features = cell.features, i;
      for (i = 0; i < features.length; i++) {
        var feature = features[i];
        var oid = feature.attributes[oidField];
        //console.log("- attempting ", oid, feature.attributes["STATE_NAME"], row, col);
        this._decRefCount(oid);
        if (oid in layer._selectedFeatures) { // this may not be needed after all because we are ref-counting the selection.
          continue; // do not remove if this feature is currently selected. DON'T BREAK THE CONTRACT
        }
        this._removeFeatureIIf(oid);
        //console.log("--- removing ", oid, feature.attributes["STATE_NAME"], row, col);
      }
    } // if
  }//,
    
  /*************************
   * For debugging purposes
   *************************/
  
  /*_debugClear: function() {
    var gs = this._cellExtentGraphics, i;
    if (gs) {
      for (i = 0; i < gs.length; i++) {
        this.map.graphics.remove(gs[i]);
      }
      this._cellExtentGraphics = null;
    }
  },
  
  _debugInfo: function(cells) {
    // draw the cell extents
    var outline = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 0, 1]), 1),
        i, symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, outline, new dojo.Color([0, 0, 0, 0.25]));
    
    this._cellExtentGraphics = [];
    for (i = 0; i < cells.length; i++) {
      var polygon = this._extentToPolygon(this._gridLayer.getCellExtent(cells[i].row, cells[i].col));
      var graphic = new esri.Graphic(polygon, symbol);
      this.map.graphics.add(graphic);
      this._cellExtentGraphics.push(graphic);
    }
  },

  _extentToPolygon: function(extent) {
    //console.log("_extentToPolygon");
    var xmin = extent.xmin, ymin = extent.ymin, xmax = extent.xmax, ymax = extent.ymax;
    return new esri.geometry.Polygon({
      "rings": [
        [ [ xmin, ymin ], [ xmin, ymax ], [ xmax, ymax ], [ xmax, ymin ], [ xmin, ymin ] ]
      ],
      "spatialReference": extent.spatialReference.toJson()
    });
  }*/
});


/**************************
 * esri.layers._GridLayout
 **************************/

dojo.declare("esri.layers._GridLayout", null, {
  /*
   * cellSize = { width: <Number>, height: <Number> }
   * mapSize  = { width: <Number>, height: <Number> }
   */
  constructor: function(origin, cellSize, mapSize, srInfo) {
    this.origin = origin;
    this.cellWidth = cellSize.width;
    this.cellHeight = cellSize.height;
    this.mapWidth = mapSize.width;
    this.mapHeight = mapSize.height;
    this.srInfo = srInfo; // map wrapping is enabled and sr is wrappable
  },
  
  /*****************
   * Public Methods
   *****************/
  
  setResolution: function(mapExtent) {
    this._resolution = (mapExtent.xmax - mapExtent.xmin) / this.mapWidth;

    if (this.srInfo) {
      // Logic borrowed from tiled layer
      var pixelsCoveringWorld = Math.round((2 * this.srInfo.valid[1]) / this._resolution),
          numTiles = Math.round(pixelsCoveringWorld / this.cellWidth);
      
      this._frameStats = [ 
        /* #tiles */ numTiles, 
        /* -180 */ 0, 
        /* +180 */ numTiles - 1 
      ];
    }
  },
  
  getCellCoordinates: function(point) {
    //console.log("getCellCoordinates");
    var res = this._resolution,
        origin = this.origin;
    return {
      row: Math.floor((origin.y - point.y) / (this.cellHeight * res)),
      col: Math.floor((point.x - origin.x) / (this.cellWidth * res))
    };
  },
  
  normalize: function(col) {
    var frameStats = this._frameStats;
    if (frameStats) {
      // Logic borrowed from tiled layer
      var total_cols = frameStats[0], m180 = frameStats[1], p180 = frameStats[2];

      if (col < m180) {
        /*while (col < m180) {
          col += total_cols;
        }*/
        col = col % total_cols;
        col = col < m180 ? col + total_cols : col;
      }
      else if (col > p180) {
        /*while (col > p180) {
          col -= total_cols;
        }*/
        col = col % total_cols;
      }
    }
    
    return col;
  },
  
  intersects: function(cExtent, mExtent) {
    // cExtent assumed to be normalized already
    // and does not span across dateline
    
    var srInfo = this.srInfo;
    if (srInfo) {
      return dojo.some(mExtent._getParts(srInfo), function(mePart) {
        return cExtent.intersects(mePart.extent);
      });
    }
    else {
      return cExtent.intersects(mExtent);
    }
  },
  
  getCellExtent: function(row, col) {
    //console.log("getCellExtent");
    var res = this._resolution,
        origin = this.origin,
        cellWidth = this.cellWidth,
        cellHeight = this.cellHeight;
        
    return new esri.geometry.Extent(
      (col * cellWidth * res) + origin.x,
      origin.y - ( (row + 1) * cellHeight * res),
      ( (col + 1) * cellWidth * res) + origin.x,
      origin.y - (row * cellHeight * res),
      new esri.SpatialReference(origin.spatialReference.toJson())
    );
  },
  
  getLatticeID: function(mExtent) {
    var topLeftCoord = this.getCellCoordinates({ x: mExtent.xmin, y: mExtent.ymax }),
        bottomRightCoord = this.getCellCoordinates({ x: mExtent.xmax, y: mExtent.ymin }),
        minRow = topLeftCoord.row, 
        maxRow = bottomRightCoord.row,
        minCol = this.normalize(topLeftCoord.col), 
        maxCol = this.normalize(bottomRightCoord.col);
        
    return minRow + "_" + maxRow + "_" + minCol + "_" + maxCol;
  },
  
  sorter: function(a, b) {
    return (a < b) ? -1 : 1;
  },
  
  getCellsInExtent: function(extent, needLattice) {
    //console.log("getCellsInExtent");
    var topLeftCoord = this.getCellCoordinates({ x: extent.xmin, y: extent.ymax }),
        bottomRightCoord = this.getCellCoordinates({ x: extent.xmax, y: extent.ymin }),
        minRow = topLeftCoord.row, maxRow = bottomRightCoord.row,
        minCol = topLeftCoord.col, maxCol = bottomRightCoord.col,
        cells = [], i, j, nj, xcoords = [], ycoords = [], 
        len, xmin, xmax, ymin, ymax, paths = [], lattice, latticeID;
        
    for (i = minRow; i <= maxRow; i++) {
      for (j = minCol; j <= maxCol; j++) {
        nj = this.normalize(j);
        extent = this.getCellExtent(i, nj);
        
        cells.push({ 
          row: i, col: nj, 
          extent: extent, 
          resolution: this._resolution 
        });
        
        if (needLattice) {
          xcoords.push(extent.xmin, extent.xmax);
          ycoords.push(extent.ymin, extent.ymax);
        }
      }
    }
    //console.log(cells);
    
    minCol = this.normalize(minCol);
    maxCol = this.normalize(maxCol);
    
    // create a unique lost of x-coordinatesd and y-coordinates
    xcoords.sort(this.sorter);
    ycoords.sort(this.sorter);
    
    len = xcoords.length;
    for (i = len - 1; i >= 0; i--) {
      if (i < (len - 1)) {
        if (xcoords[i] === xcoords[i + 1]) {
          xcoords.splice(i, 1);
        }
      }
    }
    
    len = ycoords.length;
    for (i = len - 1; i >= 0; i--) {
      if (i < (len - 1)) {
        if (ycoords[i] === ycoords[i + 1]) {
          ycoords.splice(i, 1);
        }
      }
    }
    //console.log(xcoords, ycoords);
    
    // create the lattice
    if (xcoords.length && ycoords.length) {
      xmin = xcoords[0];
      xmax = xcoords[xcoords.length - 1];
      ymin = ycoords[0];
      ymax = ycoords[ycoords.length - 1];
      //console.log(xmin, xmax, ymin, ymax);
  
      len = xcoords.length;
      for (i = 0; i < len; i++) {
        // a line from ymax to ymin at this x-coordinate
        paths.push([ 
          [xcoords[i], ymax],
          [xcoords[i], ymin]
        ]);
      }
  
      len = ycoords.length;
      for (i = 0; i < len; i++) {
        // a line from xmin to xmax at this y-coordinate
        paths.push([
          [xmin, ycoords[i]],
          [xmax, ycoords[i]]
        ]);
      }
      
      lattice = new esri.geometry.Polyline({
        paths: paths,
        spatialReference: this.origin.spatialReference.toJson()
      });

      latticeID = minRow + "_" + maxRow + "_" + minCol + "_" + maxCol;
      
      //console.log("lattice = ", paths.length, dojo.toJson(lattice.toJson()));
      //console.log("key = " + latticeID);
      
      cells.push({
        latticeID: latticeID,
        lattice: lattice, // a polyline
        resolution: this._resolution
      });
    }
    
    return {
      minRow: minRow,
      maxRow: maxRow,
      minCol: minCol,
      maxCol: maxCol,
      cells: cells
    }; // cellInfo
  }
});

  
/****************************
 * esri.layers._TrackManager
 ****************************/

dojo.declare("esri.layers._TrackManager", null, {
  constructor: function(layer) {
    this.layer = layer;
    this.trackMap = {};
  },
  
  initialize: function(map) {
    this.map = map;
    
    var layer = this.layer, trackRenderer = layer.renderer.trackRenderer;
    if (trackRenderer && (layer.geometryType === "esriGeometryPoint")) {
      // TODO
      // Investigate the feasibility of doing this using a 
      // GroupElement or GroupGraphic that can be added to 
      // a graphics layer
      
      var container = (this.container = new esri.layers._GraphicsLayer({ 
        id: layer.id + "_tracks",
        _child: true 
      }));
      
      //container._onPanHandler = function() {}; // we don't want "translate" applied twice on pan
      container._setMap(map, layer._div);
      container.setRenderer(trackRenderer);
    }
  },
  
  addFeatures: function(features) {
    var tkid, trackMap = this.trackMap, layer = this.layer, tkidField = layer._trackIdField;
    
    // create a list of all the tracks and their corresponding features
    dojo.forEach(features, function(feature) {
      var attributes = feature.attributes; 
      tkid = attributes[tkidField];
      var ary = (trackMap[tkid] = (trackMap[tkid] || []));
      ary.push(feature);
    });

    // sort features in each track from oldest to newest
    var timeField = layer._startTimeField, oidField = layer.objectIdField;
    
    var sorter = function(a, b) {
      var time1 = a.attributes[timeField], time2 = b.attributes[timeField];
      if (time1 === time2) {
        // See:
        // http://code.google.com/p/v8/issues/detail?id=324
        // http://code.google.com/p/v8/issues/detail?id=90
        return (a.attributes[oidField] < b.attributes[oidField]) ? -1 : 1;
      }
      else {
        return (time1 < time2) ? -1 : 1;
      }
    };
    
    for (tkid in trackMap) {
      trackMap[tkid].sort(sorter);
      
      /*var ary = trackMap[tkid];
      ary.sort(function(a, b){
        var time1 = a.attributes[timeField], time2 = b.attributes[timeField];
        if (time1 === time2) {
          // See:
          // http://code.google.com/p/v8/issues/detail?id=324
          // http://code.google.com/p/v8/issues/detail?id=90
          return (a.attributes[oidField] < b.attributes[oidField]) ? -1 : 1;
        }
        else {
          return (time1 < time2) ? -1 : 1;
        }

//        if (time1 < time2) {
//          return -1;
//        }
//        if (time1 >= time2) {
//          return 1;
//        }
//        return 0;
      });*/
      
//      if (latestRendering) {
//        layer._repaint(ary[ary.length - 1]);
//      }
    }
  },
  
  drawTracks: function() {
    var container = this.container;
    if (!container) {
      return;
    }
    
    var trackMap = this.trackMap, sr = this.map.spatialReference,
        tkid, ary, path, i, point, tkidField = this.layer._trackIdField,
        attrs;
    
    /*var mapper = function(feature) {
      var point = feature.geometry;
      return [point.x, point.y];
    };*/
    
    // draw track lines
    for (tkid in trackMap) {
      // create polyline representing a track and add it to the container
      //var path = dojo.map(trackMap[tkid], mapper);
      ary = trackMap[tkid];
      path = [];
      
      for (i = ary.length - 1; i >=0 ; i--) {
        point = ary[i].geometry;
        
        if (point) {
          path.push([ point.x, point.y ]);
        }
      }
      
      attrs = {};
      attrs[tkidField] = tkid;
      
      if (path.length > 0) {
        container.add(
          new esri.Graphic(
            new esri.geometry.Polyline({ paths: [path], spatialReference: sr }),
            null,
            attrs
          )
        );
      }
    }
  },
  
  moveLatestToFront: function() {
    /*var layer = this.layer;
    if (!layer.renderer.latestObservationRenderer) {
      return;
    }
    
    var trackMap = this.trackMap;
    
    for (var tkid in trackMap) {
      var ary = trackMap[tkid];
      var graphic = ary[ary.length - 1], shape = graphic._shape;
      shape && shape._moveToFront();
      layer._repaint(graphic);
    }*/

    dojo.forEach(this.getLatestObservations(), function(graphic) {
      var shape = graphic._shape;
      shape && shape._moveToFront();
      this._repaint(graphic, null, true);
    }, this.layer);
  },
  
  getLatestObservations: function() {
    var retVal = [];
    if (!this.layer.renderer.latestObservationRenderer) {
      return retVal;
    }
    
    var trackMap = this.trackMap, tkid;
    
    for (tkid in trackMap) {
      var ary = trackMap[tkid];
      retVal.push(ary[ary.length - 1]);
    }
    
    return retVal;
  },
  
  clearTracks: function() {
    var latest = this.getLatestObservations();
    
    this.trackMap = {};
    var container = this.container;
    if (container) {
      container.clear();
    }
    
    dojo.forEach(latest, function(graphic) {
      this._repaint(graphic, null, true);
    }, this.layer);
  },
  
  isLatestObservation: function(feature) {
    var tkidField = this.layer._trackIdField;
    var track = this.trackMap[feature.attributes[tkidField]];
    if (track) {
      return (track[track.length - 1] === feature); 
    }
    return false;
  },
  
  destroy: function() {
    var container = this.container;
    if (container) {
      container.clear();
      container._unsetMap(this.map, this.layer._div);
      this.container = null;
    }
    this.map = null;
    this.layer = null;
    this.trackMap = null;
  }
});

});

},
'*noref':1}});

require(["dojo/i18n"], function(i18n){
i18n._preloadLocalizations("esri/dijit/editing/nls/TemplatePicker-all", ["nl-nl","en-us","da","fi-fi","pt-pt","hu","sk","sl","pl","ca","sv","zh-tw","ar","en-gb","he-il","de-de","ko-kr","ja-jp","ro","az","nb","ru","es-es","th","cs","it-it","pt-br","fr-fr","el","tr","zh-cn"]);
});
// wrapped by build app
define("esri/dijit/editing/TemplatePicker-all", ["dijit","dojo","dojox","dojo/require!esri/layers/FeatureLayer,esri/toolbars/draw,esri/toolbars/edit,esri/dijit/editing/TemplatePicker"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.editing.TemplatePicker-all");

dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.toolbars.draw");
dojo.require("esri.toolbars.edit");
dojo.require("esri.dijit.editing.TemplatePicker");

});
