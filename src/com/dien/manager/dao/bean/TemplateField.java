package com.dien.manager.dao.bean;

public class TemplateField {
    int id;

    //模板id
    int tempid;

    // 字段名称
    String fieldname;

    // 字段类型
    int fieldtype;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getTempid() {
        return tempid;
    }

    public void setTempid(int tempid) {
        this.tempid = tempid;
    }

    public String getFieldname() {
        return fieldname;
    }

    public void setFieldname(String fieldname) {
        this.fieldname = fieldname;
    }

    public int getFieldtype() {
        return fieldtype;
    }

    public void setFieldtype(int fieldtype) {
        this.fieldtype = fieldtype;
    }

}
