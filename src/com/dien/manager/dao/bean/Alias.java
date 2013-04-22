package com.dien.manager.dao.bean;

public class Alias {
    int id; 
    int layerid;
    String fieldname; 
    String alias; 
    
    public int getId() {
        return id;
    }
    public void setId(int id) {
        this.id = id;
    }
    public int getLayerid() {
        return layerid;
    }
    public void setLayerid(int layerid) {
        this.layerid = layerid;
    }

    public String getAlias() {
        return alias;
    }
    public void setAlias(String alias) {
        this.alias = alias;
    }
    public String getFieldname() {
        return fieldname;
    }
    public void setFieldname(String fieldname) {
        this.fieldname = fieldname;
    }

}
