package com.dien.manager.tools;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.List;
import java.util.Vector;

import org.apache.log4j.Logger;
import org.geotools.arcsde.session.ISession;
import org.geotools.arcsde.session.ISessionPool;

import com.dien.manager.dao.bean.Config;
import com.dien.manager.util.UtilLayer;
import com.esri.sde.sdk.client.SeColumnDefinition;
import com.esri.sde.sdk.client.SeDelete;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeInsert;
import com.esri.sde.sdk.client.SeQuery;
import com.esri.sde.sdk.client.SeRow;
import com.esri.sde.sdk.client.SeShape;
import com.esri.sde.sdk.client.SeSqlConstruct;
import com.esri.sde.sdk.client.SeTable;
import com.esri.sde.sdk.client.SeTable.SeTableStats;
import com.esri.sde.sdk.client.SeUpdate;

public class TableFactory {
    private static Logger logger = Logger.getLogger(TableFactory.class);

    public static final String DIEN_TABLE_KEY = "id";



    public TableFactory() {

    }

    public void createTable(Class cla) throws SeException, IOException {
        String layerName = generatorTableName(cla);

        ISession session = Config.getSession();
        try {
            SeColumnDefinition[] colDefs = generatorColumns(cla);

            SeTable table = session.createSeTable(layerName);
            table.create(colDefs, "DEFAULTS");

        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } finally {
            if (session != null) {
                session.dispose();
            }
        }
    }
    public void createTable(Class cla,String[] constraintColumns) throws SeException, IOException {
        String layerName = generatorTableName(cla);

        ISession session = Config.getSession();
        try {
            SeColumnDefinition[] colDefs = generatorColumns(cla);

            SeTable table = session.createSeTable(layerName);
            table.create(colDefs, "DEFAULTS");
            table.createUniqueConstraint(constraintColumns, layerName+"constraint", "");

        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } finally {
            if (session != null) {
                session.dispose();
            }
        }
    }

    public void deleteTable(Class cla) throws SeException, IOException {

        ISession session = Config.getSession();
        try {
            String layerName = generatorTableName(cla);
            SeTable table = session.createSeTable(layerName);
            table.delete();
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } finally {
            if (session != null) {
                session.dispose();
            }
        }

    }

    public SeColumnDefinition[] generatorColumns(Class cla) throws SeException {

        // 解析属性信息
        Field[] f = cla.getDeclaredFields();
        SeColumnDefinition[] colDefs = new SeColumnDefinition[f.length];
        int i = 0;
        for (Field field : f) {
            String columnName = field.getName();
            int type = toTypeSDE(field.getType().toString());
            colDefs[i] = UtilLayer.generateColumn(columnName, type);// ID
            i++;

        }
        return colDefs;
    }

    public String generatorTableName(Class cla) {
        return cla.getSimpleName();
    }

    public String[] getColumnsName(Class cla) {

        Field[] f = cla.getDeclaredFields();

        String[] colNames = new String[f.length];
        int i = 0;
        for (Field field : f) {
            colNames[i] = field.getName();// ID
            i++;
        }
        return colNames;
    }

    /**
     * java数据类型 大小 范围 默认值
     * 
     * byte(字节) 8 -128 - 127 0 shot(短整型) 16 -32768 - 32768 0 int(整型) 32 -2147483648-2147483648 0 long(长整型) 64 -9233372036854477808-9233372036854477808
     * float(浮点型) 32 -3.40292347E+38-3.40292347E+38 0.0f double(双精度) 64 -1.79769313486231570E+308-1.79769313486231570E+308 0.0d char(字符型) 16 ‘ \u0000
     * - u\ffff ’ ‘\u0000 ’ boolean(布尔型) 1 true/false false
     * 
     * 
     * SDE 的数据类型 static int TYPE_BLOB ArcSDE data type for variable length binary data. static int TYPE_CLOB ArcSDE data type for Character Variable
     * Length Data. static int TYPE_DATE ArcSDE data type for dates. static int TYPE_DOUBLE Deprecated. at ArcSDE v9.0, replaced by TYPE_FLOAT64
     * static int TYPE_FLOAT Deprecated. at ArcSDE v9.0, replaced by TYPE_FLOAT32 static int TYPE_FLOAT32 ArcSDE data type for 4 byte floating point
     * data. static int TYPE_FLOAT64 ArcSDE data type for 8 byte floating point data. static int TYPE_INT16 ArcSDE data type for 2 byte integer data.
     * static int TYPE_INT32 ArcSDE data type for 4 byte integer data. static int TYPE_INT64 ArcSDE data type for 8 byte integer data. static int
     * TYPE_INTEGER Deprecated. at ArcSDE v9.0, replaced by TYPE_INT32 static int TYPE_NCLOB ArcSDE data type for UNICODE Character Large Object.
     * static int TYPE_NSTRING ArcSDE data type for UNICODE Null termindated character array. static int TYPE_RASTER ArcSDE data type for raster data.
     * static int TYPE_SHAPE ArcSDE data type for geometric features. static int TYPE_SMALLINT Deprecated. at ArcSDE v9.0, replaced by TYPE_INT16
     * static int TYPE_STRING ArcSDE data type for character data. static int TYPE_UUID ArcSDE data type for Universal Unique ID. static int TYPE_XML
     * ArcSDE data type for XML data.
     * 
     * @param strType
     * @return
     */
    private int toTypeSDE(String strType) {
        String[] filedType = strType.split(" ");
        if (filedType.length == 1) {
            if ("byte".equals(strType)) {
                return SeColumnDefinition.TYPE_INT16;
            } else if ("shot".equals(filedType[0])) {
                return SeColumnDefinition.TYPE_INT16;
            } else if ("int".equals(filedType[0])) {
                return SeColumnDefinition.TYPE_INTEGER;
            } else if ("long".equals(filedType[0])) {
                return SeColumnDefinition.TYPE_INT64;
            } else if ("float".equals(filedType[0])) {
                return SeColumnDefinition.TYPE_FLOAT;
            } else if ("double".equals(filedType[0])) {
                return SeColumnDefinition.TYPE_DOUBLE;
            } else if ("char".equals(filedType[0])) {
                return SeColumnDefinition.TYPE_SMALLINT;
            } else if ("boolean".equals(filedType[0])) {
                return SeColumnDefinition.TYPE_SMALLINT;
            }
        } else if (filedType.length == 2) {

            if ("java.lang.Short".equals(filedType[1])) {
                return SeColumnDefinition.TYPE_INT16;
            } else if ("java.lang.Integer".equals(filedType[1])) {
                return SeColumnDefinition.TYPE_INTEGER;
            } else if ("java.lang.Boolean".equals(filedType[1])) {
                return SeColumnDefinition.TYPE_SMALLINT;
            } else if ("java.lang.Byte".equals(filedType[1])) {
                return SeColumnDefinition.TYPE_INT16;
            } else if ("java.lang.Double".equals(filedType[1])) {
                return SeColumnDefinition.TYPE_DOUBLE;
            } else if ("java.lang.Long".equals(filedType[1])) {
                return SeColumnDefinition.TYPE_INT64;
            } else if ("java.lang.Float".equals(filedType[1])) {
                return SeColumnDefinition.TYPE_FLOAT;
            } else if ("java.lang.Character".equals(filedType[1])) {
                return SeColumnDefinition.TYPE_CLOB;
            } else if ("java.lang.String".equals(filedType[1])) {
                return SeColumnDefinition.TYPE_STRING;
            } else if ("java.util.Date".equals(filedType[1])) {
                return SeColumnDefinition.TYPE_DATE;
            } else if ("[B".equals(filedType[1])) {
                return SeColumnDefinition.TYPE_BLOB;
            }
        }
        return 0;
    }

    /**
     * 获取get的取值
     * 
     * @param obj
     * @return
     * @throws Exception
     */
    public String getObjectToString(Object obj) throws Exception {
        Class cla = obj.getClass();
        Method[] ma = cla.getDeclaredMethods();// 获取所有声明的方法数组
        Method method = null;
        String methodName = null;
        Object returnValue = null;
        for (int i = 0; i < ma.length; i++) {
            method = ma[i];
            methodName = method.getName();// 方法名
            if (methodName.indexOf("get") == 0) {// 以get开始的方法，排除set方法
                returnValue = method.invoke(obj, null);// 调用方法，相当于执行get方法得到的结果，这里返回的是一个对象
                // System.out.print(methodName + "::");
                logger.info(returnValue == null ? "" : returnValue.toString());
            }
        }
        return "";
    }

    /**
     * 获取对象的属性值，含有get方法的
     * 
     * @param obj
     * @return
     * @throws NoSuchMethodException
     * @throws SecurityException
     * @throws InvocationTargetException
     * @throws IllegalAccessException
     * @throws IllegalArgumentException
     */
    public Object getAttributeValue(Object obj, String fieldName) throws SecurityException,
            NoSuchMethodException, IllegalArgumentException, IllegalAccessException,
            InvocationTargetException {
        Class cla = obj.getClass();

        String methodName = "get" + fieldName.substring(0, 1).toUpperCase()
                + fieldName.substring(1);
        Method method = cla.getDeclaredMethod(methodName, null);
        Object returnValue = method.invoke(obj, null);// 调用方法，相当于执行get方法得到的结果，这里返回的是一个对象
        return returnValue;
    }

    public void setAttributeValue(Object obj, String fieldName, Object value)
            throws SecurityException, NoSuchMethodException, IllegalArgumentException,
            IllegalAccessException, InvocationTargetException, NoSuchFieldException {
        Class cla = obj.getClass();
        Field field = cla.getDeclaredField(fieldName);
        field.setAccessible(true); // 设置私有属性范围
        field.set(obj, value);

    }

    /**
     * 新建实例
     * 
     * @param className 类名
     * @param args 构造函数的参数
     * @return 新建的实例
     * @throws Exception
     */
    public Object newInstance(Class newClass) throws Exception {
        return newClass.newInstance();
    }

    // throws SeException, SecurityException,IllegalArgumentException, NoSuchMethodException, IllegalAccessException,InvocationTargetException,
    // IOException, UnavailableConnectionException,NoSuchFieldException
    public int insert(Object tableBean) throws SeException, IOException {
      

        ISession session = Config.getSession();
        SeColumnDefinition[] srcColDefs; 
        
        int key = -1;
        try { 
            String tableName = generatorTableName(tableBean.getClass());
            String[] cols = this.getColumnsName(tableBean.getClass());
            srcColDefs = this.generatorColumns(tableBean.getClass());

            key = UtilLayer.generaterKey(session, tableName, this.DIEN_TABLE_KEY);
            setAttributeValue(tableBean, this.DIEN_TABLE_KEY, key);

            SeInsert insert = session.createSeInsert();

            insert.intoTable(tableName, cols);
            insert.setWriteMode(true);
            SeRow rowToInsert = insert.getRowToSet();

            for (int index = 0; index < cols.length; index++) {
                switch (srcColDefs[index].getType()) {

                case SeColumnDefinition.TYPE_INT16:
                    rowToInsert.setShort(index, (Short) getAttributeValue(tableBean, cols[index]));
                    break;

                case SeColumnDefinition.TYPE_INT32:
                    rowToInsert.setInteger(index,
                            (Integer) getAttributeValue(tableBean, cols[index]));
                    break;

                case SeColumnDefinition.TYPE_INT64:
                    rowToInsert.setLong(index, (Long) getAttributeValue(tableBean, cols[index]));
                    break;
                case SeColumnDefinition.TYPE_FLOAT32:
                    rowToInsert.setFloat(index, (Float) getAttributeValue(tableBean, cols[index]));
                    break;
                case SeColumnDefinition.TYPE_FLOAT64:
                    rowToInsert
                            .setDouble(index, (Double) getAttributeValue(tableBean, cols[index]));
                    break;
                case SeColumnDefinition.TYPE_DATE:
                    Calendar cal = Calendar.getInstance();
                    Object val = getAttributeValue(tableBean, cols[index]);
                    cal.setTime((Date) (val == null ? new Date() : new Date((Long) val)));
                    rowToInsert.setTime(index, cal);
                    break;
                case SeColumnDefinition.TYPE_BLOB:

                    ByteArrayInputStream byteStream = new ByteArrayInputStream(
                            (byte[]) getAttributeValue(tableBean, cols[index]));
                    rowToInsert.setBlob(index, byteStream);
                    //rowToInsert.setBlob(index, null);
                    break;
                case SeColumnDefinition.TYPE_STRING:
                    rowToInsert
                            .setString(index, (String) getAttributeValue(tableBean, cols[index]));
                    break;
                case SeColumnDefinition.TYPE_SHAPE:
                    SeShape shape = (SeShape) getAttributeValue(tableBean, cols[index]);

                    rowToInsert.setShape(index, shape);
                    break;
                }
            }
            insert.execute();
            insert.close();
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
        }finally {
            if (session != null) {
                session.dispose();
            }
        }
        return key;
    }
    
    public int insertDoNotCreateId(Object tableBean) throws SeException, IOException {
        

        ISession session = Config.getSession();
        SeColumnDefinition[] srcColDefs; 
        
        int key = -1;
        try { 
            String tableName = generatorTableName(tableBean.getClass());
            String[] cols = this.getColumnsName(tableBean.getClass());
            srcColDefs = this.generatorColumns(tableBean.getClass());

            SeInsert insert = session.createSeInsert();

            insert.intoTable(tableName, cols);
            insert.setWriteMode(true);
            SeRow rowToInsert = insert.getRowToSet();

            for (int index = 0; index < cols.length; index++) {
                switch (srcColDefs[index].getType()) {

                case SeColumnDefinition.TYPE_INT16:
                    rowToInsert.setShort(index, (Short) getAttributeValue(tableBean, cols[index]));
                    break;

                case SeColumnDefinition.TYPE_INT32:
                    rowToInsert.setInteger(index,
                            (Integer) getAttributeValue(tableBean, cols[index]));
                    break;

                case SeColumnDefinition.TYPE_INT64:
                    rowToInsert.setLong(index, (Long) getAttributeValue(tableBean, cols[index]));
                    break;
                case SeColumnDefinition.TYPE_FLOAT32:
                    rowToInsert.setFloat(index, (Float) getAttributeValue(tableBean, cols[index]));
                    break;
                case SeColumnDefinition.TYPE_FLOAT64:
                    rowToInsert
                            .setDouble(index, (Double) getAttributeValue(tableBean, cols[index]));
                    break;
                case SeColumnDefinition.TYPE_DATE:
                    Calendar cal = Calendar.getInstance();
                    Object val = getAttributeValue(tableBean, cols[index]);
                    cal.setTime((Date) (val == null ? new Date() : new Date((Long) val)));
                    rowToInsert.setTime(index, cal);
                    break;
                case SeColumnDefinition.TYPE_BLOB:

                    ByteArrayInputStream byteStream = new ByteArrayInputStream(
                            (byte[]) getAttributeValue(tableBean, cols[index]));
                    rowToInsert.setBlob(index, byteStream);
                    //rowToInsert.setBlob(index, null);
                    break;
                case SeColumnDefinition.TYPE_STRING:
                    rowToInsert
                            .setString(index, (String) getAttributeValue(tableBean, cols[index]));
                    break;
                case SeColumnDefinition.TYPE_SHAPE:
                    SeShape shape = (SeShape) getAttributeValue(tableBean, cols[index]);

                    rowToInsert.setShape(index, shape);
                    break;
                }
            }
            insert.execute();
            insert.close();
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
        }finally {
            if (session != null) {
                session.dispose();
            }
        }
        return key;
    }

    public void update(Object tableBean) throws SeException, IOException, NoSuchMethodException,
            IllegalAccessException, InvocationTargetException {
        ISession session = Config.getSession();
       
       
        try { 
             String[] cols = getColumnsName(tableBean.getClass());
            String tableName = generatorTableName(tableBean.getClass());
            SeColumnDefinition[] srcColDefs = this.generatorColumns(tableBean.getClass());

            SeUpdate update = session.createSeUpdate();
            String whereClause = new String(DIEN_TABLE_KEY + " = "
                    + getAttributeValue(tableBean, DIEN_TABLE_KEY));
            update.toTable(tableName, cols, whereClause);
            update.setWriteMode(true);
            SeRow rowToUpdate = update.getRowToSet();

            for (int index = 0; index < cols.length; index++) {
                switch (srcColDefs[index].getType()) {

                case SeColumnDefinition.TYPE_INT16:
                    rowToUpdate.setShort(index, (Short) getAttributeValue(tableBean, cols[index]));
                    break;

                case SeColumnDefinition.TYPE_INT32:
                    rowToUpdate.setInteger(index,
                            (Integer) getAttributeValue(tableBean, cols[index]));
                    break;

                case SeColumnDefinition.TYPE_INT64:
                    rowToUpdate.setLong(index, (Long) getAttributeValue(tableBean, cols[index]));
                    break;
                case SeColumnDefinition.TYPE_FLOAT32:
                    rowToUpdate.setFloat(index, (Float) getAttributeValue(tableBean, cols[index]));
                    break;
                case SeColumnDefinition.TYPE_FLOAT64:
                    rowToUpdate
                            .setDouble(index, (Double) getAttributeValue(tableBean, cols[index]));
                    break;
                case SeColumnDefinition.TYPE_DATE:
                    Calendar cal = Calendar.getInstance();
                    Object val = getAttributeValue(tableBean, cols[index]);

                    cal.setTime((Date) (val == null ? new Date() : val));
                    rowToUpdate.setTime(index, cal);
                    break;
                case SeColumnDefinition.TYPE_BLOB:
                    ByteArrayInputStream byteStream = new ByteArrayInputStream(
                            (byte[]) getAttributeValue(tableBean, cols[index]));
                    rowToUpdate.setBlob(index, byteStream);
                    //rowToUpdate.setBlob(index, null);
                    break;
                case SeColumnDefinition.TYPE_STRING:
                    rowToUpdate
                            .setString(index, (String) getAttributeValue(tableBean, cols[index]));
                    break;
                case SeColumnDefinition.TYPE_SHAPE:
                    SeShape shape = (SeShape) getAttributeValue(tableBean, cols[index]);

                    rowToUpdate.setShape(index, shape);
                    break;
                }
            }

            update.execute();
            update.close();
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } catch (NoSuchMethodException e) {
            throw e;
        } catch (IllegalAccessException e) {
            throw e;
        } catch (InvocationTargetException e) {
            throw e;
        } finally {
            if (session != null) {
                session.dispose();
            }
        }

    }

    /*
     * 删除一条记录
     */
    public void delete(Class cla, String where) throws SeException, IOException {
        String tableName = generatorTableName(cla);
        /*
         * Delete data using a where clause: where clause : Integer_Val == 8
         */
        ISession session = Config.getSession();
        SeDelete delete = null;
        try {
            delete = session.createSeDelete();
            logger.info("Deleting rows where " + where);
            delete.fromTable(tableName, where);
            delete.close();
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } finally {
            if (delete != null) {
                delete.close();
            }
            if (session != null) {
                session.dispose();
            }
        }
    }

    public List list(Class cla, String strWhere) throws SeException, IOException{
        String tableName = generatorTableName(cla);
        String[] cols = this.getColumnsName(cla);

        ISession session = Config.getSession();
        ArrayList rowList = new ArrayList();
        try {

            SeColumnDefinition[] srcColDefs = this.generatorColumns(cla);
            SeSqlConstruct sqlConstruct = new SeSqlConstruct(tableName, strWhere);
            SeQuery query = session.createAndExecuteQuery(cols, sqlConstruct);

            /*
             * Fetch the first row that matches the query.
             */
            int max = cols.length;
            SeColumnDefinition colDef;

            SeRow row = query.fetch();
            while (row != null) {

                Object rowObj = cla.newInstance();
                for (int i = 0; i < max; i++) {

                    colDef = row.getColumnDef(i);
                    // don't try to retrieve the value if the indicator is NULL
                    if (row.getIndicator((short) i) != SeRow.SE_IS_NULL_VALUE) {

                        switch (srcColDefs[i].getType()) {
                        default:
                            setAttributeValue(rowObj, cols[i], row.getObject(i));
                            break;
                        case SeColumnDefinition.TYPE_BLOB:
                            byte[] in_b = null;
                            if (row != null) {
                                ByteArrayInputStream imgStream = row.getBlob(3);
                                ByteArrayOutputStream outStream = new ByteArrayOutputStream();
                                byte[] buff = new byte[100]; // buff用于存放循环读取的临时数据
                                int rc = 0;
                                while ((rc = imgStream.read(buff, 0, 100)) > 0) {
                                    outStream.write(buff, 0, rc);
                                }
                                in_b = outStream.toByteArray();
                            } // End while

                            setAttributeValue(rowObj, cols[i], in_b);
                            break;

                        case SeColumnDefinition.TYPE_DATE:
                            // Calendar cal = Calendar.getInstance();
                            // cal.setTime(((GregorianCalendar) val).getTime());
                            setAttributeValue(
                                    rowObj,
                                    cols[i],
                                    new Date(((GregorianCalendar) row.getObject(i))
                                            .getTimeInMillis()));
                            break;

                        }
                    } // End if
                } // End for
                rowList.add(rowObj);
                row = query.fetch();
            } // End while
            query.close();
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
        return rowList;
    }

    public List getTableDistinct(Class cla, String fieldName) throws IOException {
        String tableName = generatorTableName(cla);
        ISession session = Config.getSession();
        Vector distinctValues = null;
        try {
            SeTableStats stats = session.tableStats(tableName, fieldName,
                    SeTable.SeTableStats.SE_DISTINCT_STATS);
            // int[] distinctFreq = stats.getDistinctValueFrequencies();
            distinctValues = stats.getDistinctValues();
            // logger.info("Distinct values & their frequencies : ");
            // for( int i = 0 ; i < distinctFreq.length ; i++ )
            // logger.info( distinctValues.elementAt(i) + " - " + distinctFreq[i]);
        } catch (IOException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }

        return distinctValues == null ? new Vector() : distinctValues;
    } // End method getTableStats

    public boolean tableExixts(Class cla) {
        String tableName = generatorTableName(cla);
        ISession session = Config.getSession();

        boolean flag = true;
        try {
            SeTable table = session.getTable(tableName);
            table.describe();

        } catch (SeException e) {
            flag = false;
        } catch (IOException e) {
            flag = false;

        } finally {

            if (session != null) {
                session.dispose();
            }
        }

        return flag;

    }
}
