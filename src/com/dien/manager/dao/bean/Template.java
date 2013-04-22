package com.dien.manager.dao.bean;


public class Template {
    int id;

    /**
     * 模板名称
     */
    String name;
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
