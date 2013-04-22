/*=============================================================================
程序名：JTree。
完成时间：2005/12/5
作者：xlinFairy
E-mail：1fairy1@163.com
	更新日期：2005/12/9
	更新功能：使之在opera下也能正常使用。
	特别感谢：
	Sheneyan，LeXRus (排名不分先后,^-^)
	
	更新日期：2006/01/06
	更新功能：加入treeNodes(数组形式)，通过treeNodes可以对指定的子树进行收缩和展开功能，查找指定节点的功能。
	加入这个功能之后，个人感觉有些混乱。不过，现在没有时间整理。待下一版吧
请保留作者信息
=============================================================================*/
function treeNode() {
	var self = this;
	this.obj = null; // 指caption所在的标签：<span>。。</span>
	this.caption = null; // 显示的文字
	this.level = null; // 节点的层次
	this.value = null; // 这个值暂时没有用到。预感到会有用，因为做Delphi的树时，就因为缺少相关的东东，不得不用其它的办法来取代
	// ----------------------------------
	this.treeNodes = new Array(); // 子树集合

	this.parentTreeNode = null; // 当前“树枝”父树枝，就像树叶和树枝的关系一样。
	this.expand = function(pFlag) { // 如果是树枝，就收缩或展开。要重定位一下要展开或收缩的对象。
		try {
			self.obj.parentNode.expand(pFlag);// pFlag只能为false或true
		} catch (e) {
		}
		;
	};
	this.click = function() {
		self.obj.onclick();
	};
}

function JTree(pParent, treeData) {
	this.PICPATH = "JTree/"; // 图片文件所在的文件夹，可见public，可改变。

	var self = this; // 相当于一个引用，指向自己。JTree.
	// -----------------------------------------------------------------------------
	// 不可见private。
	// 常量
	var JOIN = this.PICPATH + "join.gif";
	var JOINBOTTOM = this.PICPATH + "joinbottom.gif";
	var MINUS = this.PICPATH + "minus.gif";
	var MINUSBOTTOM = this.PICPATH + "minusbottom.gif";
	var PLUS = this.PICPATH + "plus.gif";
	var PLUSBOTTOM = this.PICPATH + "plusbottom.gif";
	var EMPTY = this.PICPATH + "empty.gif";
	var LINE = this.PICPATH + "line.gif";

	var LEAFICON = this.PICPATH + "page.gif";
	var NODEICON = this.PICPATH + "folder.gif";

	var OPEN = new Array();
	OPEN[true] = MINUS;
	OPEN[false] = PLUS;

	var OPENBOTTOM = new Array();
	OPENBOTTOM[true] = MINUSBOTTOM;
	OPENBOTTOM[false] = PLUSBOTTOM;

	this.setPicPath = function(pPath) {
		self.PICPATH = pPath;

		JOIN = self.PICPATH + "join.gif";
		JOINBOTTOM = self.PICPATH + "joinbottom.gif";
		MINUS = self.PICPATH + "minus.gif";
		MINUSBOTTOM = self.PICPATH + "minusbottom.gif";
		PLUS = self.PICPATH + "plus.gif";
		PLUSBOTTOM = self.PICPATH + "plusbottom.gif";
		EMPTY = self.PICPATH + "empty.gif";
		LINE = self.PICPATH + "line.gif";

		OPEN[true] = MINUS;
		OPEN[false] = PLUS;

		OPENBOTTOM[true] = MINUSBOTTOM;
		OPENBOTTOM[false] = PLUSBOTTOM;

		LEAFICON = self.PICPATH + "page.gif";
		NODEICON = self.PICPATH + "folder.gif";
	};

	this.CAPTIONATT = "caption";// 标题属性是哪一个属性
	this.ICONATT = "icon";// 图标属性
	this.EXPANDALL = true;// 是否全部扩展。

	// this.clickItem=new treeNode;
	this.clickItem = new treeNode;// 用于点击时，返回值。
	this.selectNode = null;// 同上
	// ----------------------------------------------------
	this.treeNodes = new Array();// 树节点的集合。
	this.treeNodes.push(null);
	this.root = this.treeNodes[0] = new treeNode;// 树的根

	this.onclick = null;
	this.onmouseover = null;
	this.onmouseout = null;
	// -----------------------------------------------------------------------------
	// 跟据ID得到OBJ
	var $ = function(pObjID) {
		return document.getElementById(pObjID);
	};
	// -----------------------------------------------------------------------------
	this.body = $(pParent) || document.body;

	// 注：FF不支持xml
	// alert(xmlDom.documentElement.childNodes[1].xml);
	//var DOMRoot = xmlDom.documentElement;
	var DOMRoot = treeData;
	var items  = treeData.items;
	treeData.itemsIndex={};
	for(var i=0;i<items.length;i++){
		var item = items[i];
		treeData.itemsIndex[item.id]=item;
	}
	// for(o in DOMRoot){//只能用在FireFox和opera下，不有用在IE下。
	// document.write(o+" = " + DOMRoot.eval(o)+"<br>");
	// }
	// FF和IE都支持下面这个方法取属性的内容。
	// alert(root.attributes.getNamedItem("caption").nodeValue);
	// -----------------------------------------------------------------------------
	// 取出指定节点的属性。
	var getDOMAtt = function(node, pAttribute) {
		try {
			return node[pAttribute];
		} catch (e) {
			// alert("指定节点不存在，或指定属性："+pAttribute+" 不存在!")
			return false;
		}

	};
	
	// 新建HTML标签。
	var createTag = function(pTagName) {
		return document.createElement(pTagName);
	};
	var createImg = function(pSrc) {
		var tmp = createTag("IMG");
		tmp.align = "absmiddle";
		tmp.src = pSrc;
		tmp.onerror = function() {
			try {
				this.parentNode.removeChild(this);
			} catch (e) {
			}
		};
		return tmp;
	};

	var createCaption = function(node, pLevel) {
		var tmp = createTag("SPAN");
		tmp.innerHTML = getDOMAtt(node, self.CAPTIONATT);
		tmp.className = "caption";
		tmp.onmouseover = function() {
			if (this.className != "captionHighLight")
				this.className = "captionActive";
			try {
				if(self.onmouseover)
					self.onmouseover();
			} catch (e) {
			}// 必须加上
		};
		tmp.onmouseout = function() {
			if (this.className != "captionHighLight")
				this.className = "caption";
			try {
				if(self.onmouseout)
					self.onmouseout();
			} catch (e) {
			}// 必须加上
		};
		tmp.onclick = function() {
			if(self.clickItem.obj)
				self.clickItem.obj.className = "caption";

			this.className = "captionHighLight";

			// alert(self);
			var clickItem = new treeNode;

			clickItem.obj = tmp;
			clickItem.caption = getDOMAtt(node, self.CAPTIONATT);
			clickItem.level = pLevel;

			try {
				clickItem.treeNodes = this.parentNode.tree.treeNodes;
				clickItem.parentTreeNode = this.parentNode.tree.parentTreeNode;
			} catch (e) {
			}

			self.clickItem = clickItem;
			self.selectNode = node;
			try {
				self.onclick();
			} catch (e) {
			}// 必须加上，如果self没有对onclick赋值的话，会引发错误。
		};
		return tmp;
	};

	var createTreeLine = function(node, pParentArea) {
		var hasChildren = node.children;// 是否有孩子。
		for ( var i = 0; i < pParentArea.level; i++) {
			var tmpArea = pParentArea;
			for ( var j = pParentArea.level; j > i; j--) {
				// tmpArea=tmpArea.parentNode;
				tmpArea = tmpArea.parentNode.parentNode;
			}

			if (tmpArea.isLastChild)
				appendTo(createImg(EMPTY), pParentArea);
			else
				appendTo(createImg(LINE), pParentArea);
		}

		if (hasChildren) {// 有孩子
			var childShowBtn;
			if (!node.isLastChild) {
				childShowBtn = createImg(OPEN[true]);
				appendTo(childShowBtn, pParentArea);
			} else {
				childShowBtn = createImg(OPENBOTTOM[true]);
				appendTo(childShowBtn, pParentArea);
			}
			childShowBtn.onclick = function() {
				var isExpand = this.parentNode.expand();

				if (!node.isLastChild) {
					this.src = OPEN[isExpand];
				} else {
					this.src = OPENBOTTOM[isExpand];
				}

			};
			pParentArea.expandBtn = childShowBtn;// 新增的
		} else {// 无孩子。
			if (!node.isLastChild)
				appendTo(createImg(JOIN), pParentArea);
			else
				appendTo(createImg(JOINBOTTOM), pParentArea);
		}
	};

	var createIcon = function(node, pParentArea) {
		var hasChildren = node.children;// 是否有孩子
		var tmpIcon = getDOMAtt(node, self.ICONATT);
		if (tmpIcon == false) {
			if (hasChildren)
				appendTo(createImg(NODEICON), pParentArea);
			else
				appendTo(createImg(LEAFICON), pParentArea);
		} else {
			appendTo(createImg(tmpIcon), pParentArea);
		}
        //增加图例图标
		drawIconNode(pParentArea,node);

		//appendTo(nodeItem, pParentArea);
	};
	// -----------------------------------------------------------------------------
	// 将指定OBJ追加到某个OBJ的最后面。
	var appendTo = function(pObj, pTargetObj) {
		try {
			pTargetObj.appendChild(pObj);
		} catch (e) {
			alert(e.message);
		}
	};
	
	// -----------------------------------------------------------------------------
	// 循环绘制各节点。从下面这些起，这些节点具有收缩功能，所以，下面的这些不应该被oRoot所包含，而应该是oOutLine的孩子。
	var createSubTree = function(node, pLevel, pNodeArea, pTreeNode) {

	
			var nodeItem = createTag("DIV");

			nodeItem.level = pLevel + 1;
			nodeItem.isFirstChild = node.isFirstChild;
			nodeItem.isLastChild = node.isLastChild;
			nodeItem.parentTreeNode =pTreeNode;//新增属性

			// 下面的这个位置不能变动，因为createTreeLine里用到了它的parentNode
			appendTo(nodeItem, pNodeArea);
	

			createTreeLine(node, nodeItem);
			createIcon(node, nodeItem);
			nodeItem.style.width="100%";
			nodeItem.style.height="auto";
			//nodeItem.style.removeAttribute('height');
			
			var nodeCaption = createCaption(node, pLevel + 1);
			nodeItem.caption = nodeCaption.innerHTML;

			nodeItem.tree = new treeNode();
			nodeItem.tree.obj = nodeCaption;
			nodeItem.tree.caption = nodeItem.caption;
			nodeItem.tree.level = nodeItem.level;
			nodeItem.tree.parentTreeNode = pTreeNode;

			pTreeNode.treeNodes.push(nodeItem.tree);

			appendTo(nodeCaption, nodeItem);

			if (node.children) {
				var nodeSubArea = createTag("DIV");
				appendTo(nodeSubArea, nodeItem);
				//遍历子节点
				for ( var i = 0; i < node.children.length; i++) {
					var subNode = node.children[i];
					if(i==node.children.length-1)
						DOMRoot.itemsIndex[subNode._reference].isLastChild=true;
					createSubTree(DOMRoot.itemsIndex[subNode._reference], pLevel + 1, nodeSubArea,pTreeNode.treeNodes[pTreeNode.treeNodes.length - 1]);

				}
				nodeItem.nodeSubArea = nodeSubArea;

				nodeItem.expand = function(pFlag) {
					// 如果状态是展开，返回真，否则返回假。
					// this.nodeSubArea.style.display=="" ?
					// this.nodeSubArea.style.display="none" :
					// this.nodeSubArea.style.display="";

					if (pFlag == null) {
						if (this.nodeSubArea.style.display == "") {
							this.nodeSubArea.style.display = "none";
							return false;
						} else {
							this.nodeSubArea.style.display = "";
							return true;
						}
					} else {
						// alert(this.expandBtn.tagName);
						if (pFlag)
							this.nodeSubArea.style.display = "";
						else
							this.nodeSubArea.style.display = "none";

						if (!this.isLastChild)
							this.expandBtn.src = OPEN[pFlag];
						else
							this.expandBtn.src = OPENBOTTOM[pFlag];

					}

				};
			}

	};

	this.expandByLevel = function(pLevel) {

	};

	this.create = function() {
		// -----------------------------------------------------------------------------
		// 绘制轮廓
		var oOutLine = createTag("DIV");
		oOutLine.className = "outLine";
		appendTo(oOutLine, this.body);
		// oOutLine.onclick=this.onclick;
		// -----------------------------------------------------------------------------
		// 绘制根。这个根不具备收缩的功能。
		var oRoot = createTag("DIV");

		oRoot.level = -1;// 级别。根的级别为-1;

		//var oRootIcon = createImg("img/cd.gif");
		//var oRootCaption = createCaption({"id":3,"name":"绘图工具","image":"1357547399359.png","root":false,"fatherid":2,"pointcode":"0x9080"}, -1);
		//oRoot.caption = oRootCaption.innerHTML;

		// ================================================
		// 子树
		// ================================================
		oRoot.tree = new treeNode();
		//oRoot.tree.obj = oRootCaption;
		//oRoot.tree.caption = oRoot.caption;
		oRoot.tree.level = oRoot.level;
		oRoot.tree.parentTreeNode = self.treeNodes[0];

		self.root = self.treeNodes[0] = oRoot.tree;

		//appendTo(oRootIcon, oRoot);
		//appendTo(oRootCaption, oRoot);
		appendTo(oRoot, oOutLine);
		//得到树的根节点
		var rootItems=[];
		for(var i=0;i<DOMRoot.items.length;i++){
			var item = DOMRoot.items[i];
			if(item.root){
				rootItems.push(item);
			}
		}
		rootItems[rootItems.length-1].isLastChild=true;
		for(var i=0;i<rootItems.length;i++){
			createSubTree(rootItems[i], -1, oOutLine, self.treeNodes[0]);
		}
	
	};
}