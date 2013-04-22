现在就有一个表，图层字段描述表
table "DIEN_LABYER_DESCRIPTION"
{"id",        //int   唯一id
"layername", //string 图层名称
"sorting",   //int    字段排序
"type",      //int    字段类型
"name",      //string  字段名称
"alias",     //string   别名
"modifydate"  //date    修改日期
}


这个表不需要创建，当程序启动时候会自动检测这个表是否存在，如果不存在会自动创建，
如果已经存在，不会对表和数据做任何修改！