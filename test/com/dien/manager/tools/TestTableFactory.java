package com.dien.manager.tools;

import static org.junit.Assert.fail;

import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Date;
import java.util.List;

import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import com.dien.manager.dao.bean.Config;
import com.dien.manager.dao.bean.Layer;
import com.dien.manager.dao.bean.PointSymbol;
import com.dien.manager.dao.bean.Template;
import com.dien.manager.dao.bean.TestImage;
import com.dien.manager.util.UtilLayer;
import com.esri.sde.sdk.client.SeColumnDefinition;
import com.esri.sde.sdk.client.SeException;

public class TestTableFactory {
    private static TableFactory tableFactory;

    @BeforeClass
    public static void setUpBeforeClass() throws Exception {

        new Config("192.168.0.178", "5151", "sde_db", "sde", "sde",1000,1,1);
        tableFactory = new TableFactory();
    }

    @Before
    public void setUp() throws Exception {
    }

    @Test
    public void testCreateTableStringString() {
        fail("Not yet implemented");
    }

    @Test
    public void testGetConn() {
        fail("Not yet implemented");
    }

    @Test
    public void testTableFactoryStringStringStringStringString() {
        fail("Not yet implemented");
    }

    @Test
    public void testTableFactoryConfig() {
        fail("Not yet implemented");
    }

    @Test
    public void testMain() {
        fail("Not yet implemented");

        Class cla = null;
        try {
            cla = Class.forName("com.dien.manager.dao.bean.Layer");
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
        // 解析属性信息
        Field[] f = cla.getDeclaredFields();
        System.out.println("类名称=" + cla.getSimpleName());
        for (Field field : f) {
            System.out.println("属性=" + field.toString());
            System.out.println("数据类型＝" + field.getType());
            System.out.println("属性名＝" + field.getName());
            int mod = field.getModifiers();
            System.out.println("属性修饰符＝" + Modifier.toString(mod));

        }
        // 解析方法信息
        Method[] methodlist = cla.getDeclaredMethods();
        for (Method method : methodlist) {
            System.out.println("---------------");
            System.out.println("方法＝" + method.toString());
            System.out.println("方法名＝" + method.getName());
            int mod = method.getModifiers();
            System.out.println("方法修饰符＝" + Modifier.toString(mod));
            System.out.println("方法参数列表");
            Class pts[] = method.getParameterTypes();
            for (int i = 0; i < pts.length; i++) {
                Class class1 = pts[i];
                if (i != 0) {
                    System.out.println(class1);
                }
                System.out.println("返回类型" + method.getReturnType());
            }
        }
    }

    @Test
    public void testCreateTable() {
        fail("Not yet implemented");

        try {
            //tableFactory.deleteTable(PointSymbol.class);
            //tableFactory.deleteTable(Template.class);
            //tableFactory.deleteTable(TemplateField.class);
            tableFactory.deleteTable(Layer.class);
            //tableFactory.createTable(PointSymbol.class);
            tableFactory.createTable(Layer.class);
            //tableFactory.createTable(Template.class);
            //tableFactory.createTable(TemplateField.class);
        } catch (SeException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } 

    }

    @Test
    public void testDeleteTable() {
        fail("Not yet implemented");

        try {
            tableFactory.deleteTable(PointSymbol.class);
            tableFactory.deleteTable(Template.class);
        } catch (SeException e) {
            e.printStackTrace();
        }catch (IOException e) {
            e.printStackTrace();
        } 

    }

    @Test
    public void testGeneratorColumns() {
        fail("Not yet implemented");

        try {
            SeColumnDefinition[] columnDefinitions = tableFactory
                    .generatorColumns(PointSymbol.class);
            for (int i = 0; i < columnDefinitions.length; i++) {
                System.out.println(columnDefinitions[i].getName() + "="
                        + UtilLayer.resolveType(columnDefinitions[i].getType()));
            }
        } catch (SeException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testGeneratorTableName() {
        fail("Not yet implemented");
    }

    @Test
    public void testToTypeSDE() {
        fail("Not yet implemented");
    }

    @Test
    public void testToTypeJava() {
        fail("Not yet implemented");
    }

    @Test
    public void testNewInstance(){
        fail("Not yet implemented");
        
        try {
            Object pointSymbolo=tableFactory.newInstance(PointSymbol.class);
            tableFactory.setAttributeValue(pointSymbolo, "label","ben");
            //System.out.println(pointSymbolo);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    @Test
    public void testInsertTemplate() {
      fail("Not yet implemented");


        try {
            Template template = new Template();
//            template.setAlias("别名1");
//            template.setFieldname("字段名1");
//            template.setFieldtype(1);
//            template.setName("模板1");
            tableFactory.insert(template);
            
//            template.setAlias("别名2");
//            template.setFieldname("字段名2");
//            template.setFieldtype(3);
            template.setName("模板1");
            tableFactory.insert(template);
        } catch (SeException e) {
            e.printStackTrace();
        } catch (SecurityException e) {
            e.printStackTrace();
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
        }catch (IOException e) {
            e.printStackTrace();
        } 
    }
    
    
    @Test
    public void testInsert() {
       //fail("Not yet implemented");

        byte[] buf = new byte[5];
        buf[0] = 5;
        buf[1] = 1;
        buf[2] = 2;
        buf[3] = 3;
        buf[4] = 4;

        try {
            TestImage pointSymbol = new TestImage();
            pointSymbol.setId(1);
            pointSymbol.setImage(buf);
            tableFactory.insert(pointSymbol);
        } catch (SeException e) {
            e.printStackTrace();
        } catch (SecurityException e) {
            e.printStackTrace();
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } 
    }

    @Test
    public void testUpdate() {
        fail("Not yet implemented");

        byte[] buf = new byte[5];
        buf[1] = 6;
        buf[2] = 7;
        buf[3] = 8;
        buf[4] = 9;
        buf[0] = 10;
        try {
            PointSymbol pointSymbol = new PointSymbol();
            pointSymbol.setId(1);
            pointSymbol.setPointcode("pointcode u");
            pointSymbol.setImage("");
            pointSymbol.setFatherId(11);
            pointSymbol.setName("fieldname u");

            //tableFactory.update(pointSymbol);
            
            
            
//            TABLE_REGISTRY aa = new TABLE_REGISTRY();
//            aa.setTABLE_NAME("YY");
//            aa.setDESCRIPTION("bb");
//            tableFactory.update(aa);
        } catch (SecurityException e) {
            e.printStackTrace();
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
        } 
    }

    @Test
    public void testDelete() {
        fail("Not yet implemented");
        try {
            tableFactory.delete(PointSymbol.class, "ID=1");
        } catch (SecurityException e) {
            e.printStackTrace();
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }catch (SeException e) {
            e.printStackTrace();
        }
    }
    
    @Test
    public void testList() {
        
        fail("Not yet implemented");
        try {
//           List list = tableFactory.list(TABLE_REGISTRY.class,"TABLE_NAME='YY'");
//           System.out.println(list.size());
//           System.out.println(list);
//            
        } catch (SecurityException e) {
            e.printStackTrace();
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
        }  catch (Exception e) {
            e.printStackTrace();
        }
        
    }
    
    @Test
    public void testTableDistinct() {
        
        fail("Not yet implemented");
        try {
            List list = tableFactory.getTableDistinct(Template.class,"name");
            System.out.println(list.size());
            System.out.println(list);
        } catch (SecurityException e) {
            e.printStackTrace();
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
        
    }
}
