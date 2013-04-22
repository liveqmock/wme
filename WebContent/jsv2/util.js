
//限制文字长度超长
function nameFormater(item, rowIndex, cell) {
	var num =8;
	var objLength = item.length;
	//console.log(item+" - "+objLength);
	if (objLength > num) {
		return "<span title='"+item+"'>"+item.substring(0, num-1) + '...'+"</span>";
	}else{
		return "<span title='"+item+"'>"+item+"</span>";
	}
}


/**
 * 字符串截取
 */
String.prototype.substrb = function(len){
	var str1;
	if(this.lengthb() <= len)
	{
		return this;
	}
	for(var i = len/2; i < this.length; i++)
	{
		str1 = this.substr(0,i);
		if(str1.lengthb() == len)
		{
			return str1;
		}
		else if(str1.lengthb() > len)
		{
			return this.substr(0, i - 1);
		}
		else 
		{
			//不可以和 【if (str1.lengthb() == len) 】合并 此防止前面均为半角，
			//后面为全角情况
			if(str1.lengthb() == len-1)
			{
				return str1;
			}
		}
	}
};
/** 
 * 根据byte取得字符串长度 
 */  
String.prototype.lengthb = function(){
	return this.replace(/[^\x00-\xff]/g, '**').length;
};