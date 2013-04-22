package com.dien.manager.dao.bean;


public class PointSymbol {
    /*id*/
    int id;
    /*分类编码*/
    String pointcode;
    /*图标*/
    String image;
    /*父节点id*/
    int fatherId=-2;
    /*name*/
    String name;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getPointcode() {
        return pointcode;
    }

    public void setPointcode(String pointcode) {
        this.pointcode = pointcode;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

   
    public int getFatherId() {
        return fatherId;
    }

    public void setFatherId(int fatherId) {
        this.fatherId = fatherId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Override
    public String toString() {
        return "PointSymbol [id=" + id + ", pointcode=" + pointcode + ", image=" + image
                + ", fatherId=" + fatherId + ", name=" + name + "]";
    }
}
