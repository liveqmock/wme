package com.dien.manager.dao.bean;


public class Layer {
    int id;
    String layername;
    String description;
    String tablename;
    String geotype;
    int userid;
    public int getId() {
        return id;
    }
    public void setId(int id) {
        this.id = id;
    }
    public String getLayername() {
        return layername;
    }
    public void setLayername(String layername) {
        this.layername = layername;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }
    public String getTablename() {
        return tablename;
    }
    public void setTablename(String tablename) {
        this.tablename = tablename;
    }
    public String getGeotype() {
        return geotype;
    }
    public void setGeotype(String geotype) {
        this.geotype = geotype;
    }
    public int getUserid() {
        return userid;
    }
    public void setUserid(int userid) {
        this.userid = userid;
    }

}
