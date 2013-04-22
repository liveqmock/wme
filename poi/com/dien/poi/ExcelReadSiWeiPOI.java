package com.dien.poi;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Iterator;

import com.dien.manager.dao.bean.PointSymbol;
import com.dien.manager.tools.TableFactory;
import com.esri.sde.sdk.client.SeException;

import net.sf.json.JSONObject;

import jxl.Cell;
import jxl.Sheet;
import jxl.Workbook;
import jxl.read.biff.BiffException;
/**
 * 读取同目录下电子表格文件poi.xls，文件里边存储着poi分类数据
 * @author Administrator
 *
 */
public class ExcelReadSiWeiPOI {
    TableFactory tableFactory = null;
    public ExcelReadSiWeiPOI() {
        tableFactory = new TableFactory();
    }

   
    /**
     * @param args
     * @throws IOException 
     * @throws SeException 
     */
    public HashMap<String, HashMap<String, HashMap<String, String>>>  readPoiFiel() throws SeException, IOException {
        Workbook book = null;
        String path = ExcelReadSiWeiPOI.class.getResource("poi.xls").getPath();//"D:/workspace/study/dien/src/poi分类.xls";
        try {
            book = Workbook.getWorkbook(new File(path));
        } catch (BiffException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
        HashMap<String, HashMap<String, HashMap<String, String>>> class0List = new HashMap<String, HashMap<String, HashMap<String, String>>>();
        Sheet sheet = book.getSheet(0);
        String class0 = "", class1 = "", class2 = "", class3 = "";
        for (int j = 1; j < sheet.getRows(); j++) {
            Cell[] cells = sheet.getRow(j);
            class0 = cells[0].getContents() == "" ? class0 : cells[0].getContents();
            class1 = cells[1].getContents() == "" ? class1 : cells[1].getContents();
            class2 = cells[2].getContents() == "" ? class2 : cells[2].getContents();
            class3 = cells[3].getContents() == "" ? class3 : cells[3].getContents();
            if (class0List.containsKey(class0)) {
                HashMap<String, HashMap<String, String>> class1List = class0List.get(class0);
                if (class1List.containsKey(class1)) {
                    HashMap<String, String> class2List = class1List.get(class1);
                    String name = "代表".equals(class2) ? class1 :class2;
                    if (!class2List.containsKey(name)) {
                        class2List.put(name, class3);
                    }
                } else {
                    HashMap<String, String> class2List = new HashMap<String, String>();
                    class1List.put(class1, class2List);
                    j--;
                    continue;
                }
            } else {
                HashMap<String, HashMap<String, String>> class1List = new HashMap<String, HashMap<String, String>>();
                class0List.put(class0, class1List);
                j--;
                continue;
            }

        }
        
        return class0List;

    }
    public void toSde(HashMap<String, HashMap<String, HashMap<String, String>>> symbolMap) throws SeException, IOException{
        Iterator<String>  iterator = symbolMap.keySet().iterator();
        int id =0;
        int fatherid0;
        int fatherid1;
        PointSymbol pointSymbol;
        while(iterator.hasNext()){
            String daKey = iterator.next();
            id++;

            pointSymbol = new PointSymbol();
            pointSymbol.setId(id);
            pointSymbol.setName(daKey);
            tableFactory.insertDoNotCreateId(pointSymbol);
            System.out.println(pointSymbol);
            fatherid0=id;
            HashMap<String, HashMap<String, String>>  zhong =symbolMap.get(daKey);
            Iterator<String>  zhongIterator = zhong.keySet().iterator();
            while(zhongIterator.hasNext()){
                String zhongKey = zhongIterator.next();
                id++;
                fatherid1=id;
         
                pointSymbol = new PointSymbol();
                pointSymbol.setId(id);
                pointSymbol.setName(zhongKey);
                pointSymbol.setFatherId(fatherid0);
                tableFactory.insertDoNotCreateId(pointSymbol);
                System.out.println(pointSymbol);
                HashMap<String, String> xiao = zhong.get(zhongKey);
                
                Iterator<String>  xiaoIterator = xiao.keySet().iterator();
                while(xiaoIterator.hasNext()){
                    String xiaoKey = xiaoIterator.next();
                    String xiaoValue = xiao.get(xiaoKey);
                    id++;
                    pointSymbol = new PointSymbol();
                    pointSymbol.setId(id);
                    pointSymbol.setName(xiaoKey);
                    pointSymbol.setFatherId(fatherid1);
                    pointSymbol.setPointcode(xiaoValue);
                    pointSymbol.setImage("point.png");
                    tableFactory.insertDoNotCreateId(pointSymbol);
                    System.out.println(pointSymbol);
                }
            }        
        }
    }
    
    
    public static JSONObject HashMapToJSON(HashMap<String, HashMap<String, HashMap<String, String>>> class0List){
        JSONObject json =JSONObject.fromObject(class0List);
        System.out.println(json);
        return json;
    }

}
