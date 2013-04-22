package com.dien.manager.dao.bean;

import java.util.Date;

public class LayerField {
    int id; 
    int layerid;
    int sorting; 
    int type;
    String name; 
    String alias; 
    Date modifydate; 
    int length;
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
    public int getSorting() {
        return sorting;
    }
    public void setSorting(int sorting) {
        this.sorting = sorting;
    }
    public int getType() {
        return type;
    }
    public void setType(int type) {
        this.type = type;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getAlias() {
        return alias;
    }
    public void setAlias(String alias) {
        this.alias = alias;
    }
    public Date getModifydate() {
        return modifydate;
    }
    public void setModifydate(Date modifydate) {
        this.modifydate = modifydate;
    }
    public int getLength() {
        return length;
    }
    public void setLength(int length) {
        this.length = length;
    }
    
}
