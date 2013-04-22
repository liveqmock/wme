package com.dien.manager.tools;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Random;

import net.sf.json.JSONObject;

import org.apache.log4j.Logger;
import org.geotools.arcsde.session.ISession;
import org.geotools.arcsde.session.UnavailableConnectionException;

import com.dien.manager.dao.bean.Alias;
import com.dien.manager.dao.bean.Config;
import com.dien.manager.dao.bean.Layer;
import com.dien.manager.util.Pinyin4jUtil;
import com.dien.manager.util.UtilLayer;
import com.esri.sde.sdk.client.SeColumnDefinition;
import com.esri.sde.sdk.client.SeCoordinateReference;
import com.esri.sde.sdk.client.SeDelete;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeExtent;
import com.esri.sde.sdk.client.SeFilter;
import com.esri.sde.sdk.client.SeInsert;
import com.esri.sde.sdk.client.SeLayer;
import com.esri.sde.sdk.client.SeObjectId;
import com.esri.sde.sdk.client.SeQuery;
import com.esri.sde.sdk.client.SeQueryInfo;
import com.esri.sde.sdk.client.SeRasterAttr;
import com.esri.sde.sdk.client.SeRegistration;
import com.esri.sde.sdk.client.SeRow;
import com.esri.sde.sdk.client.SeShape;
import com.esri.sde.sdk.client.SeShapeFilter;
import com.esri.sde.sdk.client.SeSqlConstruct;
import com.esri.sde.sdk.client.SeTable;
import com.esri.sde.sdk.client.SeTable.SeTableStats;
import com.esri.sde.sdk.client.SeUpdate;
import com.esri.sde.sdk.client.SeXmlDoc;
import com.esri.sde.sdk.pe.PeCSTransformations;
import com.esri.sde.sdk.pe.PeCoordinateSystem;
import com.esri.sde.sdk.pe.PeFactory;
import com.esri.sde.sdk.pe.PeGeographicCS;
import com.esri.sde.sdk.pe.PeProjectedCS;
import com.esri.sde.sdk.pe.PeProjectionException;

public class Basis {
    private static Logger logger = Logger.getLogger(Basis.class);

    public final static String TABLE_FILED_USERID = "userid";

    public final static String TABLE_FILED_SYMBOL = "symbol";

    public final static String TABLE_FILED_OBJECTID = "OBJECTID";
    public final static  TableFactory tableFactory =new TableFactory();
    public List<SeLayer> getLayerList() throws IOException {
        ISession session = Config.getSession();
        List<SeLayer> list = null;
        try {
            list = session.getLayers();
        } catch (IOException e) {
            throw e;
        } finally {
            if (session != null) {
                session.dispose();
            }
        }

        // Vector<SeLayer> list = conn.getLayers();
        return list;

    }

    public SeLayer getLayer(String layerName) throws IOException, SeException {
        ISession session = Config.getSession();
        SeLayer layer = null;
        try {
            session.getLayer(layerName);
            layer = session.getLayer(layerName);
            layer.setTableName(layerName);
        } catch (IOException e) {
            throw e;
        } catch (SeException e) {
            throw e;
        } finally {
            if (session != null) {
                session.dispose();
            }
        }

        return layer;

    }

    public void updateLayerName(String oldName, String newName) throws SeException, IOException {
        ISession session = Config.getSession();
        try {
            SeLayer layer = getLayer(oldName);
            layer.setDescription(newName);
            logger.info(layer.getDescription());

            SeUpdate update = session.createSeUpdate();

            String[] columns = new String[1];
            // Integer data type
            columns[0] = "DESCRIPTION";

            String whereClause = new String("TABLE_NAME = '" + oldName.toUpperCase() + "'");
            update.toTable("TABLE_REGISTRY", columns, whereClause);
            update.setWriteMode(true);
            SeRow row = update.getRowToSet();
            row.setNString(0, newName);
            update.execute();
            whereClause = new String("TABLE_NAME = '" + oldName.toUpperCase()
                    + "' and column_name='SHAPE'");
            update.toTable("column_registry", columns, whereClause);
            update.setWriteMode(true);
            row = update.getRowToSet();
            row.setNString(0, newName);
            update.execute();

            whereClause = new String("TABLE_NAME = '" + oldName.toUpperCase() + "'");
            update.toTable("layers", columns, whereClause);
            update.setWriteMode(true);
            row = update.getRowToSet();
            row.setNString(0, newName);
            update.execute();

            update.close();
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

    public String getLayerType(String layerName) throws SeException, IOException {
        ISession session = Config.getSession();
        String type = null;
        try {
            SeLayer layer = session.getLayer(layerName);
            type = UtilLayer.getLayerType(layer);
        }catch (IOException e) {
            throw e;
        } finally {
            if (session != null) {
                session.dispose();
            }
        }
        return type;

    }
    

    public SeLayer createLayer(String layerName, String layerAilas, List columns, int wkid,
            int shapeType) throws SeException, IOException {
        ISession session = Config.getSession();
        SeLayer layer = null;
        try {
            layer = session.createSeLayer();
            SeTable table = session.createSeTable(layerName);
            boolean isSymbol = false, isUserID = false;

            /**
             * 向表中增加固定必须的字段， userid 用户的id symbol 地图要素类别属性
             */
            for (int i = 0; i < columns.size(); i++) {
                JSONObject fieldJSON = (JSONObject) columns.get(i);
                if (TABLE_FILED_USERID.equals(fieldJSON.getString("name").toLowerCase())) {
                    isUserID = true;
                    fieldJSON.put("type", SeColumnDefinition.TYPE_INT32);
                } else if (TABLE_FILED_SYMBOL.equals(fieldJSON.getString("name").toLowerCase())) {
                    isSymbol = true;
                    fieldJSON.put("type", SeColumnDefinition.TYPE_STRING);
                }
            }
            if (!isUserID) {
                JSONObject fieldJSON = new JSONObject();
                fieldJSON.put("name", TABLE_FILED_USERID);
                fieldJSON.put("type", SeColumnDefinition.TYPE_INT32);
                columns.add(fieldJSON);
            }
            if (!isSymbol) {
                JSONObject fieldJSON = new JSONObject();
                fieldJSON.put("name", TABLE_FILED_SYMBOL);
                fieldJSON.put("type", SeColumnDefinition.TYPE_STRING);
                columns.add(fieldJSON);
            }
            SeColumnDefinition colDefs[] = new SeColumnDefinition[columns.size()];
            /*
             * Define the columns and their attributes for the table to be created. NOTE: The valid range/values of size and scale parameters vary
             * from one database to another.
             */

            for (int i = 0; i < columns.size(); i++) {
                JSONObject fieldName = (JSONObject) columns.get(i);
                colDefs[i] = UtilLayer.generateColumn(fieldName.getString("name"),
                        fieldName.getInt("type"));
            }
            /*
             * Create the table using the DBMS default configuration keyword. Valid config keywords are found in the $SDEHOME\etc\dbtune.sde file.
             */
            table.create(colDefs, "DEFAULTS");

            /*
             * Define the attributes of the spatial column
             */
            layer.setSpatialColumnName("SHAPE");
            layer.setTableName(layerName);

            // SeLayer.SE_NIL_TYPE_MASK | SeLayer.SE_POINT_TYPE_MASK
            // | SeLayer.SE_LINE_TYPE_MASK | SeLayer.SE_SIMPLE_LINE_TYPE_MASK
            // | SeLayer.SE_AREA_TYPE_MASK | SeLayer.SE_MULTIPART_TYPE_MASK
            /*
             * Set the type of shapes that can be inserted into the layer. Shape type can be just one or many. NOTE: Layers that contain more than one
             * shape type can only be accessed through the C and Java APIs and Arc Explorer Java 3.x. They cannot be seen from ArcGIS desktop
             * applications.
             */
            layer.setShapeTypes(shapeType);
            layer.setDescription(layerAilas);
            /*
             * Define the layer's Coordinate Reference
             */
            SeCoordinateReference coordref = new SeCoordinateReference();
            ///coordref.setCoordSysByID(new SeObjectId(wkid));
            //int shift = 600000;
            SeExtent validRange = new SeExtent(-180, -90, 180, 90);
            
            coordref.setXYByEnvelope(validRange);
            coordref.setXY(-20037508.34,-20037508.34, 1000000);
            coordref.setVertCSById(wkid);
            SeExtent ext = new SeExtent(-180, -90, 180, 90);
            layer.setExtent(ext);

            layer.setCreationKeyword("DEFAULTS");
            layer.setCoordRef(coordref);


            /*
             * Spatially enable the new table...
             */
            layer.create(3, 4);
            logger.info(" 创建图层-" + layerName);
        } catch (SeException e) {
            e.printStackTrace();
            throw e;
            
        } catch (IOException e) {
            e.printStackTrace();
            throw e;
        } finally {
            if (session != null) {
                session.dispose();
            }
        }
        return layer;

    } // End method createBaseTable

    
    
    
    
    public boolean isLayerExist(String layerName) throws SeException, IOException {

        if (layerName == null)
            return true;
        List<SeLayer> layers = this.getLayerList();
        for (SeLayer layer : layers) {
            String name = UtilLayer.getLayerName(layer);
            if (layerName.equals(name)) {
                return true;
            }
        }
        return false;

    }

    public SeLayer createLayer(String layerName, List columns, int wkid, int shapeType)
            throws SeException, IOException {
        ISession session = Config.getSession();
        SeLayer layer = null;
        try {
            layer = session.createSeLayer();
            SeTable table = session.createSeTable(layerName);
            boolean isSymbol = false, isUserID = false;

            /**
             * 向表中增加固定必须的字段， userid 用户的id symbol 地图要素类别属性
             */
            for (int i = 0; i < columns.size(); i++) {
                JSONObject fieldJSON = (JSONObject) columns.get(i);
                if (TABLE_FILED_USERID.equals(fieldJSON.getString("name").toLowerCase())) {
                    isUserID = true;
                    fieldJSON.put("type", "INTEGER");
                } else if (TABLE_FILED_SYMBOL.equals(fieldJSON.getString("name").toLowerCase())) {
                    isSymbol = true;
                    fieldJSON.put("type", "STRING");
                }
            }
            if (!isUserID) {
                JSONObject fieldJSON = new JSONObject();
                fieldJSON.put("name", TABLE_FILED_USERID);
                fieldJSON.put("type", "INTEGER");
                columns.add(fieldJSON);
            }
            if (!isSymbol) {
                JSONObject fieldJSON = new JSONObject();
                fieldJSON.put("name", TABLE_FILED_SYMBOL);
                fieldJSON.put("type", "STRING");
                columns.add(fieldJSON);
            }
            SeColumnDefinition colDefs[] = new SeColumnDefinition[columns.size()];
            /*
             * Define the columns and their attributes for the table to be created. NOTE: The valid range/values of size and scale parameters vary
             * from one database to another.
             */

            for (int i = 0; i < columns.size(); i++) {
                JSONObject fieldName = (JSONObject) columns.get(i);
                colDefs[i] = UtilLayer.generateColumn(fieldName.getString("name"),UtilLayer.columnTypeToInt(fieldName.getString("type")));
            }
            /*
             * Create the table using the DBMS default configuration keyword. Valid config keywords are found in the $SDEHOME\etc\dbtune.sde file.
             */
            table.create(colDefs, "DEFAULTS");

            /*
             * Define the attributes of the spatial column
             */
            layer.setSpatialColumnName("SHAPE");
            layer.setTableName(layerName);

            // SeLayer.SE_NIL_TYPE_MASK | SeLayer.SE_POINT_TYPE_MASK
            // | SeLayer.SE_LINE_TYPE_MASK | SeLayer.SE_SIMPLE_LINE_TYPE_MASK
            // | SeLayer.SE_AREA_TYPE_MASK | SeLayer.SE_MULTIPART_TYPE_MASK
            /*
             * Set the type of shapes that can be inserted into the layer. Shape type can be just one or many. NOTE: Layers that contain more than one
             * shape type can only be accessed through the C and Java APIs and Arc Explorer Java 3.x. They cannot be seen from ArcGIS desktop
             * applications.
             */
            layer.setShapeTypes(shapeType);
          

            /*
             * Define the layer's Coordinate Reference
             */
            SeCoordinateReference coordref = new SeCoordinateReference();
            coordref.setCoordSysByID(new SeObjectId(wkid));
            SeExtent ext = new SeExtent(-180, -90, 180, 90);

            coordref.setXYByEnvelope(ext);
            coordref.setXY(0.000001, 0.000001, 1000000);
            layer.setCoordRef(coordref);

            layer.setExtent(ext);
            /*
             * Spatially enable the new table...
             */
            layer.create(3, 4);

        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } finally {
            if (session != null) {
                session.dispose();
            }
        }
        logger.info("创建图层成功 " + layerName);
        return layer;

    } // End method createBaseTable

    public SeLayer createLayer(String layerName, List columns, int wkid, int shapeType, int userid)
            throws SeException, IOException {
        SeLayer layer = createLayer(layerName, columns, wkid, shapeType);

        return layer;

    } // End method createBaseTable

    /*
     * Retrieves the attributes of a shape object. This method is invoked by the retrieveData method. Retrieves the follg details about a shape: -
     * Shape Type - Shape's extent - All its coordinate points
     */

    public String[] getColumnsName(String tableName) {
        ISession session = Config.getSession();
        // List<SeLayer> list = session.getLayers();
        String[] cols = null;
        try {
            SeTable table = session.getTable(tableName);

            /*
             * Get the table's column definition.
             */
            SeColumnDefinition[] tableDef = table.describe();
            cols = new String[tableDef.length - 1];

            for (int i = 0; i < cols.length; i++) {
                cols[i] = tableDef[i].getName();
            }

        } catch (SeException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();

        } finally {

            if (session != null) {
                session.dispose();
            }
        }

        return cols;
    }
    
    /*
     * Retrieves the attributes of a shape object. This method is invoked by the retrieveData method. Retrieves the follg details about a shape: -
     * Shape Type - Shape's extent - All its coordinate points
     */

    public String[] getColumnsNameNoObjectID(String tableName) {
        ISession session = Config.getSession();
        // List<SeLayer> list = session.getLayers();
        ArrayList<String> colsList = new ArrayList<String>();
        String[] cols = null;
        try {
            SeTable table = session.getTable(tableName);

            /*
             * Get the table's column definition.
             */
            SeColumnDefinition[] tableDef = table.describe();
           
            for (int i = 0; i < tableDef.length; i++) {
                if(tableDef[i].getRowIdType()!=SeRegistration.SE_REGISTRATION_ROW_ID_COLUMN_TYPE_SDE)
                colsList.add(tableDef[i].getName());
            }

        } catch (SeException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();

        } finally {

            if (session != null) {
                session.dispose();
            }
        }

        if(colsList.size()>0){
            cols = new String[colsList.size()];
            colsList.toArray(cols);

        }
        return cols;
    }

    public HashMap<String, Integer> getColumnsType(String tableName) throws IOException {
        HashMap<String, Integer> columnsMap = new HashMap<String, Integer>();
        SeTable table;
        String[] cols = null;
        ISession session = Config.getSession();
        try {
            table = session.getTable(tableName);

            /*
             * Get the table's column definition.
             */
            SeColumnDefinition[] tableDef = table.describe();
            cols = new String[tableDef.length];

            /*
             * Store the names of all the table's columns in the String array cols. This array specifies the columns to be retrieved from the
             * database.
             */
            for (int i = 0; i < cols.length; i++) {
                columnsMap.put(tableDef[i].getName().toUpperCase(), tableDef[i].getType());
            }
        } catch (SeException e) {
            logger.error("异常", e);
        }finally {

            if (session != null) {
                session.dispose();
            }
        }
        return columnsMap;
    }

    public long addRow(String tableName, HashMap values) throws SeException, IOException {

        /* Define the names of the columns that data is to be inserted into. */
        String columns[] = getColumnsNameNoObjectID(tableName);
        ISession session = Config.getSession();
        long lastID = -1;
        try {
            SeInsert insert = session.createSeInsert();
            insert.intoTable(tableName, columns);
            insert.setWriteMode(true);
            SeRow row = insert.getRowToSet();
            setColumnsByMap(tableName, row, values, columns);
            insert.execute();
            lastID = insert.lastInsertedRowId().longValue();
            logger.info("lastID="+lastID);
            insert.close();
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
        logger.info("插入记录id " + lastID);
        return lastID;
    } // End method insertData

    private void setColumnsByMap(String tableName, SeRow row, HashMap values, String[] columns)
            throws IOException, SeException {
        ISession session = Config.getSession();
        SeTable table;
        try {
            table = session.getTable(tableName);
            SeColumnDefinition[] tableDef = table.describe();

            HashMap<String, Integer> types = new HashMap<String, Integer>();
            for (int i = 0; i < tableDef.length; i++) {
                types.put(tableDef[i].getName(), tableDef[i].getType());

            }
            /*
             * Store the names of all the table's columns in the String array cols. This array specifies the columns to be retrieved from the
             * database.
             */
            for (int i = 0; i < columns.length; i++) {
                Object val = values.get(columns[i]);

                switch (types.get(columns[i])) {
                default:
                    logger.info("default");
                    break;
                case SeColumnDefinition.TYPE_BLOB:
                    row.setBlob(i, new ByteArrayInputStream((byte[]) val));
                    break;
                case SeColumnDefinition.TYPE_CLOB:
                    row.setClob(i, new ByteArrayInputStream((byte[]) val));
                    break;
                case SeColumnDefinition.TYPE_DATE:
                    Calendar cal = Calendar.getInstance();
                    cal.setTime((Date) (val == null ? new Date() : new Date((Long) val)));
                    row.setTime(i, cal);
                    break;
                case SeColumnDefinition.TYPE_FLOAT:
                    row.setFloat(i, val==null ? null :Float.parseFloat(val.toString()));
                    break;
                case SeColumnDefinition.TYPE_FLOAT64:
                    row.setDouble(i, val==null ? null :Double.parseDouble(val.toString()));
                    break;
                case SeColumnDefinition.TYPE_SMALLINT:
                    row.setShort(i, val==null ? null :Short.parseShort(val.toString()));
                    break;
                case SeColumnDefinition.TYPE_INTEGER:
                    row.setInteger(i, val==null ? null :Integer.parseInt(val.toString()));
                    break;
                case SeColumnDefinition.TYPE_INT64:
                    row.setLong(i, val==null ? null :Long.parseLong(val.toString()));
                    break;
                case SeColumnDefinition.TYPE_NCLOB:
                    row.setNClob(i, new ByteArrayInputStream((byte[]) val));
                    break;
                case SeColumnDefinition.TYPE_NSTRING:
                    row.setNString(i, (String) val);
                    break;
                case SeColumnDefinition.TYPE_RASTER:
                    row.setRaster(i, (SeRasterAttr) val);
                    break;
                case SeColumnDefinition.TYPE_SHAPE:
                    row.setShape(i, (SeShape) val);
                    break;
                case SeColumnDefinition.TYPE_STRING:
                    row.setString(i, (String) (val == null ? "" : val));
                    break;
                case SeColumnDefinition.TYPE_UUID:
                    row.setUuid(i, (String) val);
                    break;
                case SeColumnDefinition.TYPE_XML:
                    row.setXml(i, (SeXmlDoc) val);
                    break;
                }
            }
        } catch (IOException e) {
            throw e;
        } catch (SeException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
    }

    /*
     * Updates a single row of the layer corresponding to a specific feature id.
     */
    public void updateRow(String tableName, int id, HashMap values) throws IOException, SeException {

        String[] columns = getColumnsNameNoObjectID(tableName);
        ISession session = Config.getSession();
        SeUpdate update = null;
        try {
            SeObjectId featureId = new SeObjectId(id);
            update = session.createSeUpdate();
            SeRow row = update.singleRow(featureId, tableName, columns);
            setColumnsByMap(tableName, row, values, columns);
            update.execute();
            update.close();

        } catch (IOException e) {
            throw e;
        } catch (SeException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }

    } // End updateSingleRow

    /*
     * Updates a single row of the layer. This update function can be modified to perform multiple row updates by altering the where clause constraint
     */
    public void deleteRow(String tableName, int id) throws IOException, SeException {
        /*
         * Delete data using a where clause: where clause : Integer_Val == 8
         */
        ISession session = Config.getSession();
        try {

            String[] cols = new String[1];
            cols[0] = this.TABLE_FILED_OBJECTID;

            SeSqlConstruct sqlConstruct = new SeSqlConstruct(tableName, this.TABLE_FILED_OBJECTID
                    + " = " + id);
            SeQueryInfo queryInfo = new SeQueryInfo();
            queryInfo.setConstruct(sqlConstruct);
            SeQuery query = session.createAndExecuteQuery(cols, sqlConstruct);
            // SeQuery query = new SeQuery(conn, cols, sqlConstruct);
            // query.prepareQuery();
            query.execute();
            SeRow row = query.fetch();

            if (row != null) {
                SeDelete delete = session.createSeDelete();
                delete.fromTable(tableName, this.TABLE_FILED_OBJECTID + " = " + id);

                delete.close();
            }
            query.close();

        } catch (IOException e) {
            throw e;
        } catch (SeException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
    }

    public void deleteTable(String tableName) throws SeException, IOException {

        SeTable table;
        ISession session = Config.getSession();
        try {

            table = session.getTable(tableName);
            //table.freeLock();
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
        logger.info("删除表-" + tableName);
    }

    public List queryByID(String tableName, String id) throws SeException, IOException {

        ArrayList<HashMap<String, Object>> rowList = new ArrayList<HashMap<String, Object>>();
        ISession session = Config.getSession();

        try {

            SeTable table = session.getTable(tableName);
            SeColumnDefinition[] tableDef = table.describe();
            String[] cols = new String[tableDef.length];
            for (int i = 0; i < cols.length; i++) {
                cols[i] = tableDef[i].getName();
            }

            SeSqlConstruct sqlConstruct = new SeSqlConstruct(tableName, this.TABLE_FILED_OBJECTID
                    + " = " + id);
            SeQueryInfo queryInfo = new SeQueryInfo();
            queryInfo.setConstruct(sqlConstruct);
            SeQuery query = session.createAndExecuteQuery(cols, sqlConstruct);
            // SeQuery query = new SeQuery(conn, cols, sqlConstruct);
            // query.prepareQuery();
            query.execute();

            /*
             * Fetch the first row that matches the query.
             */
            SeRow row = query.fetch();

            if (row == null) {
                logger.info(" No rows fetched");
                return rowList;
            }

            int max = row.getNumColumns();
            int rowNo = 1;
            SeColumnDefinition colDef;
            while (row != null) {
                HashMap<String, Object> columnList = new HashMap<String, Object>();

                logger.info("Contents of Row " + rowNo++);
                for (int i = 0; i < max; i++) {

                    colDef = row.getColumnDef(i);
                    int type = colDef.getType();
                    // don't try to retrieve the value if the indicator is NULL
                    if (row.getIndicator((short) i) != SeRow.SE_IS_NULL_VALUE) {

                        switch (type) {

                        case SeColumnDefinition.TYPE_INT16:
                            columnList.put(colDef.getName(), row.getShort(i));
                            logger.info(colDef.getName() + " : " + row.getShort(i));
                            break;

                        case SeColumnDefinition.TYPE_DATE:
                            columnList.put(colDef.getName(), row.getTime(i));
                            logger.info(colDef.getName() + " : " + row.getTime(i));
                            break;

                        case SeColumnDefinition.TYPE_INT32:
                            columnList.put(colDef.getName(), row.getInteger(i));
                            logger.info(colDef.getName() + " : " + row.getInteger(i));
                            break;

                        case SeColumnDefinition.TYPE_FLOAT32:
                            columnList.put(colDef.getName(), row.getFloat(i));
                            logger.info(colDef.getName() + " : " + row.getFloat(i));
                            break;

                        case SeColumnDefinition.TYPE_FLOAT64:
                            columnList.put(colDef.getName(), row.getDouble(i));
                            logger.info(colDef.getName() + " : " + row.getDouble(i));
                            break;

                        case SeColumnDefinition.TYPE_STRING:
                            columnList.put(colDef.getName(), row.getString(i));
                            logger.info(colDef.getName() + " : " + row.getString(i));
                            break;

                        case SeColumnDefinition.TYPE_SHAPE:
                            columnList.put(colDef.getName(), row.getShape(i));
                            logger.info(colDef.getName() + " : ");

                            break;
                        case SeColumnDefinition.TYPE_BLOB:

                            columnList.put(colDef.getName(), row.getString(i));
                            logger.info(colDef.getName() + " : " + row.getString(i));
                            break;
                        case SeColumnDefinition.TYPE_CLOB:

                            columnList.put(colDef.getName(), row.getString(i));
                            logger.info(colDef.getName() + " : " + row.getString(i));
                            break;

                        case SeColumnDefinition.TYPE_INT64:

                            columnList.put(colDef.getName(), row.getLong(i));
                            logger.info(colDef.getName() + " : " + row.getLong(i));
                            break;

                        case SeColumnDefinition.TYPE_NCLOB:

                            columnList.put(colDef.getName(), row.getString(i));
                            logger.info(colDef.getName() + " : " + row.getString(i));
                            break;
                        case SeColumnDefinition.TYPE_NSTRING:

                            columnList.put(colDef.getName(), row.getString(i));
                            logger.info(colDef.getName() + " : " + row.getString(i));
                            break;
                        case SeColumnDefinition.TYPE_RASTER:

                            columnList.put(colDef.getName(), row.getString(i));
                            logger.info(colDef.getName() + " : " + row.getString(i));
                            break;
                        case SeColumnDefinition.TYPE_UUID:

                            columnList.put(colDef.getName(), row.getString(i));
                            logger.info(colDef.getName() + " : " + row.getString(i));
                            break;
                        case SeColumnDefinition.TYPE_XML:

                            columnList.put(colDef.getName(), row.getString(i));
                            logger.info(colDef.getName() + " : " + row.getString(i));
                            break;

                        } // End switch
                    } // End if
                } // End for
                  // Fetch the next row that matches the query.
                rowList.add(columnList);
                row = query.fetch();
            } // End while
            query.close();
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
        logger.info("查询记录id " + id);
        return rowList;
    }

    public List queryByBox(String tableName, double minX, double minY, double maxX, double maxY)
            throws SeException, IOException {
        /*
         * Generate a rectangular shape to be used as a filter
         */
        SeShape shape;
        try {
            shape = new SeShape();

            shape.setCoordRef(new SeCoordinateReference());

            // double minX = 2000, minY = 4000, maxX = 9000, maxY = 9000;
            SeExtent extent = new SeExtent(minX, minY, maxX, maxY);
            shape.generateRectangle(extent);

            SeShape[] shapes = new SeShape[1];
            shapes[0] = shape;
            int[] expectedShapes = new int[1];
            // Envp

            int SHP2 = (1 << 2);

            int SHP3 = (1 << 3);

            int SHP4 = (1 << 4);

            int SHP9 = (1 << 9);

            int SHP10 = (1 << 10);

            int SHP11 = (1 << 11);

            expectedShapes[0] = SHP2 + SHP3 + SHP4 + SHP9 + SHP10 + SHP11;

            /*
             * Run filter tests against this shape
             */
            logger.info("Rectangular Shape Filter");

            return runSpatialQuery(shapes, SeFilter.METHOD_AI, expectedShapes[0], tableName);
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        }
    }

    public List queryPage(String tableName, int start, int end, String orderColumn,String descOrAsc )
            throws SeException, IOException

    {

        ArrayList<HashMap<String, Object>> rowList = new ArrayList<HashMap<String, Object>>();
        ISession session = Config.getSession();
        try {
            String whereClause = "";
                
            
            SeQueryInfo qInfo = new SeQueryInfo();
            SeSqlConstruct sqlConstruct = new SeSqlConstruct(tableName);
            qInfo.setColumns(new String[] { TABLE_FILED_OBJECTID });
            qInfo.setConstruct(sqlConstruct);
            qInfo.setByClause(" order by " + orderColumn+" "+descOrAsc);
            
            // 查询id
            SeQuery query = session.prepareQuery(qInfo);
            query.execute();
            //query.setByClause(" order by " + orderColumn+" "+descOrAsc);
            /*
             * Fetch the first row that matches the query.
             */
            ArrayList<String> whereClauseList = new ArrayList<String>();
            SeRow row = query.fetch();
            int rowNo = 0;
            if (row != null) {
                while (row != null) {
                    if (start <= rowNo && rowNo <= end) {
                        whereClauseList.add(" " + TABLE_FILED_OBJECTID + "="
                                + row.getInteger(0));
                    }
                    // Fetch the next row that matches the query.
                    rowNo++;
                    row = query.fetch();
                } // End while

            }
            query.close();
            if (whereClauseList.size() > 0) {
                whereClause = com.dien.manager.util.Util.listToWhere(whereClauseList, " or ");
                if (whereClause != null && !"".equals(whereClause)) {
                    sqlConstruct = new SeSqlConstruct(tableName);
                    logger.info(whereClause);
                    sqlConstruct.setWhere(whereClause);
                    qInfo = new SeQueryInfo();
                    qInfo.setByClause(" order by " + orderColumn+" "+descOrAsc);
                    SeTable table = session.getTable(tableName);
                    SeColumnDefinition[] tableDef = table.describe();
                    String[] cols = new String[tableDef.length];
                    /*
                     * Store the names of all the table's columns in the String array cols. This array specifies the columns to be retrieved from the
                     * database.
                     */
                    for (int i = 0; i < cols.length; i++) {
                        cols[i] = tableDef[i].getName();
                    }
                    qInfo.setConstruct(sqlConstruct);
                    qInfo.setColumns(cols);
                    query = session.prepareQuery(qInfo);
                    query.execute();
                    row = query.fetch();

                    if (row != null) {

                        int max = row.getNumColumns();

                        while (row != null) {

                            HashMap<String, Object> columnList = new HashMap<String, Object>();
                            for (int i = 0; i < max; i++) {
                                // int type = colDef.getType();
                                // don't try to retrieve the value if the indicator is NULL
                                if (row.getIndicator((short) i) != SeRow.SE_IS_NULL_VALUE) {
                                    columnList.put(row.getColumnDef(i).getName().toUpperCase(),
                                            row.getObject(i));
                                } // End if

                            } // End for
                            rowList.add(columnList);
                            // Fetch the next row that matches the query.
                            row = query.fetch();
                        } // End while

                    }
                    query.close();
                }
            }
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
        return rowList;
    }

    /**
     * 查询指定要数列表
     * 
     * @param tableName
     * @param start
     * @param end
     * @param orderColumn
     * @param userid
     * @return
     * @throws IOException
     * @throws UnavailableConnectionException
     * @throws SeException
     */
    public List queryPage(String tableName, int start, int end, String orderColumn, int userid,String descOrAsc)
            throws SeException, IOException {

        ArrayList<HashMap<String, Object>> rowList = new ArrayList<HashMap<String, Object>>();
        ISession session = Config.getSession();
        try {
            SeTable table = session.getTable(tableName);
            SeColumnDefinition[] tableDef = table.describe();
            String[] cols = new String[tableDef.length];
            /*
             * Store the names of all the table's columns in the String array cols. This array specifies the columns to be retrieved from the
             * database.
             */
            boolean isContain = false;
            for (int i = 0; i < cols.length; i++) {
                cols[i] = tableDef[i].getName();
                if ("userid".equals(tableDef[i].getName().toLowerCase())) {
                    isContain = true;
                }
            }
            String whereClause = "";
            if (isContain) {
                whereClause = " " + TABLE_FILED_USERID + "=" + userid + " ";
                SeQueryInfo qInfo = new SeQueryInfo();
                SeSqlConstruct sqlConstruct = new SeSqlConstruct(tableName);
                sqlConstruct.setWhere(whereClause);
                qInfo.setColumns(new String[] { TABLE_FILED_OBJECTID });
                qInfo.setConstruct(sqlConstruct);
                qInfo.setByClause(" order by " + orderColumn+" "+descOrAsc);
                
                // 查询id
                SeQuery query = session.prepareQuery(qInfo);
                query.execute();

                
                ArrayList<String> whereClauseList = new ArrayList<String>();
                whereClauseList.add(" " + TABLE_FILED_USERID + "=" + userid + " ");
                SeRow row = query.fetch();
                int rowNo = 0;
                if (row != null) {
                    while (row != null) {
                        if (start <= rowNo && rowNo <= end) {
                            whereClauseList.add(" " + this.TABLE_FILED_OBJECTID + "="
                                    + row.getInteger(0));
                        }
                        // Fetch the next row that matches the query.
                        rowNo++;
                        row = query.fetch();
                    } // End while

                }
                query.close();
                if (whereClauseList.size() > 0) {
                    whereClause = com.dien.manager.util.Util.listToWhere(whereClauseList, " or ");
                    if (whereClause != null && !"".equals(whereClause)) {
                        
                        
                        sqlConstruct = new SeSqlConstruct(tableName);
                        logger.info(whereClause);
                        sqlConstruct.setWhere(whereClause);
                        qInfo = new SeQueryInfo();
                        qInfo.setByClause(" order by " + orderColumn+" "+descOrAsc);
             
                        qInfo.setConstruct(sqlConstruct);
                        qInfo.setColumns(cols);
                        query = session.prepareQuery(qInfo);
                        query.execute();

                        row = query.fetch();

                        if (row != null) {

                            int max = row.getNumColumns();

                            while (row != null) {

                                HashMap<String, Object> columnList = new HashMap<String, Object>();
                                for (int i = 0; i < max; i++) {
                                    // int type = colDef.getType();
                                    // don't try to retrieve the value if the indicator is NULL
                                    if (row.getIndicator((short) i) != SeRow.SE_IS_NULL_VALUE) {
                                        columnList.put(row.getColumnDef(i).getName().toUpperCase(),
                                                row.getObject(i));
                                    } // End if

                                } // End for
                                rowList.add(columnList);
                                // Fetch the next row that matches the query.
                                row = query.fetch();
                            } // End while

                        }
                        query.close();
                    }
                }
            }
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
        return rowList;
    }

    /**
     * 根据用户得到要素的数据量
     * 
     * @param tableName
     * @param word
     * @return
     * @throws IOException
     * @throws UnavailableConnectionException
     * @throws SeException
     */
    public int queryRowCount(String tableName, int userid) throws SeException, IOException {
        ISession session = Config.getSession();
        int rowNo = 0;
        try {
            SeTable table = session.getTable(tableName);

            SeSqlConstruct sqlConstruct = new SeSqlConstruct(tableName);
            SeColumnDefinition[] tableDef = table.describe();
            String[] cols = new String[tableDef.length];
            /*
             * Store the names of all the table's columns in the String array cols. This array specifies the columns to be retrieved from the
             * database.
             */
            boolean isContain = false;
            for (int i = 0; i < cols.length; i++) {
                cols[i] = tableDef[i].getName();
                if ("userid".equals(tableDef[i].getName().toLowerCase())) {
                    isContain = true;
                }
            }
            String whereClause = "";

            if (isContain) {
                whereClause = " " + TABLE_FILED_USERID + "=" + userid + " ";

                sqlConstruct.setWhere(whereClause);
                logger.info(whereClause);

                // 查询id
                SeQuery query = session.createAndExecuteQuery(
                        new String[] { TABLE_FILED_OBJECTID }, sqlConstruct);
                SeRow row = query.fetch();

                while (row != null) {
                    rowNo++;
                    row = query.fetch();
                }
                query.close();
            }
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
        return rowNo;
    }

    public int getTableCount(String tableName) throws IOException {

        ISession session = Config.getSession();
        int count = -1;
        try {
            SeTableStats stats = session.tableStats(tableName, TABLE_FILED_OBJECTID,
                    SeTable.SeTableStats.SE_COUNT_STATS);
            count = stats.getCount();
        } catch (IOException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
        return count;
    } // End method getTableStats

    public List searchPage(String tableName, int start, int end, String word) throws IOException,
            SeException {
        ArrayList<HashMap<String, Object>> rowList = new ArrayList<HashMap<String, Object>>();
        ISession session = Config.getSession();
        try {
            String whereClause = "";
            SeTable table = session.getTable(tableName);
            SeSqlConstruct sqlConstruct = new SeSqlConstruct(tableName);

            /*
             * Get the table's column definition.
             */
            SeColumnDefinition[] tableDef = table.describe();
            String[] cols = new String[tableDef.length];

            ArrayList<String> whereClauseList = new ArrayList<String>();
            /*
             * Store the names of all the table's columns in the String array cols. This array specifies the columns to be retrieved from the
             * database.
             */
            for (int i = 0; i < cols.length; i++) {
                cols[i] = tableDef[i].getName();
                if (tableDef[i].getType() == SeColumnDefinition.TYPE_STRING
                        || tableDef[i].getType() == SeColumnDefinition.TYPE_NSTRING) {
                    whereClauseList.add(tableDef[i].getName() + " like '%" + word + "%'");
                }
            }
            if (whereClauseList.size() > 0) {
                // 组合where
                whereClause = com.dien.manager.util.Util.listToWhere(whereClauseList, " or ");
                if(word==null||"".equals(word)){
                    whereClause="";
                }
                sqlConstruct.setWhere(whereClause);
                logger.info(whereClause);
                /*
                 * Define ArcSDE server query.
                 */
                // 查询id
                SeQuery query = session.createAndExecuteQuery(
                        new String[] { TABLE_FILED_OBJECTID }, sqlConstruct);

                /*
                 * Fetch the first row that matches the query.
                 */
                SeRow row = query.fetch();
                int rowNo = 0;
                whereClauseList = new ArrayList<String>();

                while (row != null) {
                    if (start <= rowNo && rowNo < end) {

                        whereClauseList.add(" " + this.TABLE_FILED_OBJECTID + "="
                                + row.getInteger(0));
                    }
                    // Fetch the next row that matches the query.
                    rowNo++;
                    row = query.fetch();
                } // End while

                query.close();
            }
            if (whereClauseList.size() > 0) {
                whereClause = com.dien.manager.util.Util.listToWhere(whereClauseList, " or ");
                // whereClause+=" order by "+orderColumn;
                logger.info(whereClause);
                if ("".equals(whereClause)) {
                    session.dispose();
                    return rowList;
                }
                /*
                 * Store the names of all the table's columns in the String array cols. This array specifies the columns to be retrieved from the
                 * database.
                 */
                for (int i = 0; i < cols.length; i++) {
                    cols[i] = tableDef[i].getName();
                }

                sqlConstruct = new SeSqlConstruct(tableName);
                sqlConstruct.setWhere(whereClause);

                /*
                 * Define ArcSDE server query.
                 */
                SeQuery query = session.createAndExecuteQuery(cols, sqlConstruct);

                /*
                 * Fetch the first row that matches the query.
                 */
                SeRow row = query.fetch();

                if (row != null) {

                    int max = row.getNumColumns();

                    while (row != null) {

                        HashMap<String, Object> columnList = new HashMap<String, Object>();
                        for (int i = 0; i < max; i++) {
                            // int type = colDef.getType();
                            // don't try to retrieve the value if the indicator is NULL
                            if (row.getIndicator((short) i) != SeRow.SE_IS_NULL_VALUE) {
                                columnList.put(row.getColumnDef(i).getName().toUpperCase(),
                                        row.getObject(i));
                            } // End if

                        } // End for
                        rowList.add(columnList);
                        // Fetch the next row that matches the query.
                        row = query.fetch();
                    } // End while

                }
                query.close();
            }
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } finally {
            if (session != null) {
                session.dispose();
            }
        }
        return rowList;
    }

    public List searchPage(String tableName, int start, int end, String word, int userid)
            throws IOException, SeException {
        ArrayList<HashMap<String, Object>> rowList = new ArrayList<HashMap<String, Object>>();
        ISession session = Config.getSession();
        try {
            String whereClause = "";
            SeTable table = session.getTable(tableName);
            SeSqlConstruct sqlConstruct = new SeSqlConstruct(tableName);

            /*
             * Get the table's column definition.
             */
            SeColumnDefinition[] tableDef = table.describe();
            String[] cols = new String[tableDef.length];

            ArrayList<String> whereClauseList = new ArrayList<String>();

            boolean isContain = false;

            for (int i = 0; i < cols.length; i++) {
                cols[i] = tableDef[i].getName();
                if (tableDef[i].getType() == SeColumnDefinition.TYPE_STRING
                        || tableDef[i].getType() == SeColumnDefinition.TYPE_NSTRING) {
                    whereClauseList.add(tableDef[i].getName() + " like '%" + word + "%'");
                }
                if (TABLE_FILED_USERID.equals(tableDef[i].getName().toLowerCase())) {
                    isContain = true;
                    break;
                }
            }

            if (isContain && whereClauseList.size() > 0) {
                // 组合where
                whereClause = com.dien.manager.util.Util.listToWhere(whereClauseList, " or ");
                whereClause = "(" + whereClause + ") and " + TABLE_FILED_USERID + " = " + userid;

                if(word==null||"".equals(word)){
                    whereClause=TABLE_FILED_USERID + " = " + userid;
                }
                sqlConstruct.setWhere(whereClause);
                logger.info(whereClause);
                /*
                 * Define ArcSDE server query.
                 */
                // 查询id
                SeQuery query = session.createAndExecuteQuery(new String[] { TABLE_FILED_OBJECTID }, sqlConstruct);
                SeRow row = query.fetch();
                int rowNo = 0;
                whereClauseList = new ArrayList<String>();
                while (row != null) {
                    if (start <= rowNo && rowNo < end) {
                        whereClauseList.add(" " + this.TABLE_FILED_OBJECTID + "=" + row.getInteger(0));
                    }
                    // Fetch the next row that matches the query.
                    rowNo++;
                    row = query.fetch();
                } // End while

                query.close();
                if (whereClauseList.size() > 0) {
                    whereClause = com.dien.manager.util.Util.listToWhere(whereClauseList, " or ");
                    // whereClause+=" order by "+orderColumn;
                    logger.info(whereClause);
                    if ("".equals(whereClause)) {
                        session.dispose();
                        return rowList;
                    }
                    /*
                     * Store the names of all the table's columns in the String array cols. This array specifies the columns to be retrieved from the
                     * database.
                     */
                    for (int i = 0; i < cols.length; i++) {
                        cols[i] = tableDef[i].getName();
                    }

                    sqlConstruct = new SeSqlConstruct(tableName);
                    sqlConstruct.setWhere(whereClause);

                    /*
                     * Define ArcSDE server query.
                     */
                    query = session.createAndExecuteQuery(cols, sqlConstruct);

                    /*
                     * Fetch the first row that matches the query.
                     */
                    row = query.fetch();

                    if (row != null) {

                        int max = row.getNumColumns();

                        while (row != null) {

                            HashMap<String, Object> columnList = new HashMap<String, Object>();
                            for (int i = 0; i < max; i++) {
                                // int type = colDef.getType();
                                // don't try to retrieve the value if the indicator is NULL
                                if (row.getIndicator((short) i) != SeRow.SE_IS_NULL_VALUE) {
                                    columnList.put(row.getColumnDef(i).getName().toUpperCase(),
                                            row.getObject(i));
                                } // End if

                            } // End for
                            rowList.add(columnList);
                            // Fetch the next row that matches the query.
                            row = query.fetch();
                        } // End while

                    }
                    query.close();
                }
            }
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
        return rowList;
    }

    public int searchCount(String tableName, String word, int userid) throws IOException,
            SeException {
        ISession session = Config.getSession();
        int rowNo = -1;
        try {
            SeTable table = session.getTable(tableName);
            SeSqlConstruct sqlConstruct = new SeSqlConstruct(tableName);

            /*
             * Get the table's column definition.
             */
            SeColumnDefinition[] tableDef = table.describe();
            String[] cols = new String[tableDef.length];

            ArrayList<String> whereClauseList = new ArrayList<String>();
            /*
             * Store the names of all the table's columns in the String array cols. This array specifies the columns to be retrieved from the
             * database.
             */
            // 是否包含列userid
            boolean isContain = false;

            for (int i = 0; i < cols.length; i++) {
                cols[i] = tableDef[i].getName();
                if (tableDef[i].getType() == SeColumnDefinition.TYPE_STRING
                        || tableDef[i].getType() == SeColumnDefinition.TYPE_NSTRING) {
                    whereClauseList.add(tableDef[i].getName() + " like '%" + word + "%'");
                }
                if (TABLE_FILED_USERID.equals(tableDef[i].getName().toLowerCase())) {
                    isContain = true;
                    break;
                }
            }

            if (isContain) {
                // 组合where
                String whereClause = com.dien.manager.util.Util
                        .listToWhere(whereClauseList, " or ");
                whereClause = "(" + whereClause + ") and " + TABLE_FILED_USERID + " = " + userid;
                if(word==null||"".equals(word)){
                    whereClause=TABLE_FILED_USERID + " = " + userid;
                }
                sqlConstruct.setWhere(whereClause);
                logger.info(whereClause);

                // 查询id
                SeQuery query = session.createAndExecuteQuery(
                        new String[] { TABLE_FILED_OBJECTID }, sqlConstruct);
                SeRow row = query.fetch();

                while (row != null) {
                    rowNo++;
                    row = query.fetch();
                }
                query.close();
            } else {
                rowNo = 0;
            }
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
        return rowNo;
    }

    public int searchCount(String tableName, String word) throws IOException, SeException {
        ISession session = Config.getSession();
        int rowNo = 0;
        try {
            SeTable table = session.getTable(tableName);
            SeSqlConstruct sqlConstruct = new SeSqlConstruct(tableName);

            /*
             * Get the table's column definition.
             */
            SeColumnDefinition[] tableDef = table.describe();
            String[] cols = new String[tableDef.length];

            ArrayList<String> whereClauseList = new ArrayList<String>();
            /*
             * Store the names of all the table's columns in the String array cols. This array specifies the columns to be retrieved from the
             * database.
             */
            for (int i = 0; i < cols.length; i++) {
                cols[i] = tableDef[i].getName();
                if (tableDef[i].getType() == SeColumnDefinition.TYPE_STRING
                        || tableDef[i].getType() == SeColumnDefinition.TYPE_NSTRING) {
                    whereClauseList.add(tableDef[i].getName() + " like '%" + word + "%'");
                }
            }
            if (whereClauseList.size() > 0) {
                // 组合where
                String whereClause = com.dien.manager.util.Util
                        .listToWhere(whereClauseList, " or ");
                if(word==null||"".equals(word)){
                    whereClause="";
                }
                sqlConstruct.setWhere(whereClause);
                logger.info(whereClause);

                // 查询id
                SeQuery query = session.createAndExecuteQuery(
                        new String[] { TABLE_FILED_OBJECTID }, sqlConstruct);
                SeRow row = query.fetch();

                while (row != null) {
                    rowNo++;
                    row = query.fetch();
                }
                query.close();
            }

        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
        return rowNo;
    }

    public List runSpatialQuery(Object[] shapeList, int method, int expectedShapes, String layerName)
            throws SeException, IOException {
        ISession session = Config.getSession();
        ArrayList<HashMap<String, Object>> rowList = new ArrayList<HashMap<String, Object>>();
        try {
            SeTable layer = session.getTable(layerName);
            String patialColumn = "";

            SeColumnDefinition[] tableDef = layer.describe();
            String[] cols = new String[tableDef.length];
            for (int i = 0; i < tableDef.length; i++) {
                cols[i] = tableDef[i].getName();
                if (tableDef[i].getType() == SeColumnDefinition.TYPE_SHAPE)
                    patialColumn = tableDef[i].getName();
            }
            SeFilter[] filters = null;
            SeFilter filter = null;

            if (shapeList.length > 0) {
                filters = new SeFilter[shapeList.length];
                if (shapeList[0].getClass().getName().equals("com.esri.sde.sdk.client.SeShape")) {
                    SeShape[] shape = new SeShape[shapeList.length];
                    for (int i = 0; i < shape.length; i++) {
                        shape[i] = (SeShape) shapeList[i];
                        filter = new SeShapeFilter(layerName, patialColumn, shape[i], method);
                        filters[i] = filter;
                    } // End for
                }
            } // End if

            SeQuery spatialQuery = null;
            SeSqlConstruct sqlCons = new SeSqlConstruct(layerName);
            spatialQuery = session.createAndExecuteQuery(cols, sqlCons);
            spatialQuery.prepareQuery();
            /*
             * Set spatial constraints
             */
            spatialQuery.setSpatialConstraints(SeQuery.SE_OPTIMIZE, false, filters);
            spatialQuery.execute();
            // Only retrieves shapes...
            SeRow row = spatialQuery.fetch();
            SeColumnDefinition colDef = new SeColumnDefinition();
            int numCols = 0;
            try {
                numCols = row.getNumColumns();
            } catch (NullPointerException ne) {
                spatialQuery.close();
                return null;
            }

            // int MAX_ROWS = 11;
            // String[] desc = new String[MAX_ROWS];

            while (row != null) {
                for (int i = 0; i < numCols; i++) {
                    HashMap<String, Object> columnList = new HashMap<String, Object>();
                    rowList.add(columnList);
                    colDef = row.getColumnDef(i);
                    // int type = colDef.getType();
                    // don't try to retrieve the value if the indicator is NULL
                    if (row.getIndicator((short) i) != SeRow.SE_IS_NULL_VALUE) {
                        columnList.put(colDef.getName().toUpperCase(), row.getObject(i));
                    } // End if
                } // End for
                  // Fetch the next row that matches the query.
                row = spatialQuery.fetch();

            } // End while
            spatialQuery.close();
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } finally {
            if (session != null) {
                session.dispose();
            }
        }
        return rowList;

    }

    public static double[] trans(double x1, double y1, int fromCSCode, int toCSCode)
{
        try {
        PeCoordinateSystem fromCS = PeFactory.projcs(fromCSCode);
        if (fromCS == null)
            fromCS = PeFactory.geogcs(fromCSCode);
        PeCoordinateSystem toCS = PeFactory.projcs(toCSCode);
        if (toCS == null)
            toCS = PeFactory.geogcs(toCSCode);

        return trans(x1, y1, fromCS, toCS);
        } catch (PeProjectionException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static double[] trans(double x1, double y1, PeCoordinateSystem fromCS, int toCSCode)
            {
        PeCoordinateSystem toCS;
        try {
            toCS = PeFactory.projcs(toCSCode);
            if (toCS == null)
                toCS = PeFactory.geogcs(toCSCode);
            return trans(x1, y1, fromCS, toCS);
        } catch (PeProjectionException e) {
            e.printStackTrace();
        }
        return null;
        

    }

    public static double[] trans(double x1, double y1, int fromCSCode, PeCoordinateSystem toCS)
{
        try {
        PeCoordinateSystem fromCS = PeFactory.projcs(fromCSCode);

        if (fromCS == null)
            fromCS = PeFactory.geogcs(fromCSCode);
        return trans(x1, y1, fromCS, toCS);
        } catch (PeProjectionException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static double[] trans(double x1, double y1, PeCoordinateSystem fromCS,
            PeCoordinateSystem toCS)  {
        double[] pts = { x1, y1 }; // {682886.72389354,4426738.52914172}西安坐标系下的数值，在山西大同境内
        String s = pts[0] + "," + pts[1];

        trans(pts, fromCS, toCS);
        s += " --> ";
        s += pts[0] + "," + pts[1];
        // 横坐标:113.140194;纵坐标39.955089
        return pts;

    }

    public static double[] trans(double[] pts, PeCoordinateSystem fromCS, PeCoordinateSystem toCS){
try{
        // PeProjectedCS pcs1 = PeFactory.projcs(fromCSCode); // 2382 PePCSDefs.PE_PCS_XIAN_1980_3_DEGREE_GK_111E
        if (fromCS instanceof PeProjectedCS) {

            if (toCS instanceof PeProjectedCS) {
                // Project the points.
                int ret = com.esri.sde.sdk.pe.PeCSTransformations.projToGeog(
                        (PeProjectedCS) fromCS, 1, pts);
                ret = com.esri.sde.sdk.pe.PeCSTransformations.geogToProj((PeProjectedCS) toCS, 2,
                        pts);
            } else if (toCS instanceof PeGeographicCS) {
                int ret = com.esri.sde.sdk.pe.PeCSTransformations.projToGeog(
                        (PeProjectedCS) fromCS, 1, pts);
            }
        } else if (fromCS instanceof PeGeographicCS) {

            if (toCS instanceof PeProjectedCS) {
                // Project the points.
                int ret = com.esri.sde.sdk.pe.PeCSTransformations.geogToProj((PeProjectedCS) toCS,
                        1, pts);
            }
        }

        return pts;
} catch (PeProjectionException e) {
    e.printStackTrace();
}
return null;
    }

    public static double[][][] trans(double points[][][], int fromCSCode, int toCSCode) {

        return null;
    }

    public static double[] trans(double points[][][], PeCoordinateSystem fromCS,
            PeCoordinateSystem toCS) {

        return null;
    }

    public static double[] toGeog(double x1, double y1, int fromCSCode)
            throws PeProjectionException {
        double intArray[] = new double[2];
        double[] pts = { x1, y1 }; // {682886.72389354,4426738.52914172}西安坐标系下的数值，在山西大同境内
        logger.info("X:" + pts[0] + ";Y" + pts[1]);
        PeProjectedCS pcs1 = PeFactory.projcs(fromCSCode); // 2382 PePCSDefs.PE_PCS_XIAN_1980_3_DEGREE_GK_111E
        PeCSTransformations.projToGeog(pcs1, 1, pts);
        logger.info("横坐标:" + pts[0] + ";纵坐标" + pts[1]); // 横坐标:113.140194;纵坐标39.955089
        intArray[0] = pts[0];
        intArray[1] = pts[1];
        return intArray;
    }

    public static double[] toProj(double x1, double y1, int toCSCode) throws PeProjectionException {
        double intArray[] = new double[2];
        double[] pts = { x1, y1 }; // {113.140194,39.955089};
        logger.info("经度:" + pts[0] + ";纬度" + pts[1]);
        // PeProjectedCS pcs1 = testPeProjectedCS.getGoogleProject();
        PeProjectedCS pcs1 = PeFactory.projcs(toCSCode);// 2382
        PeCSTransformations.geogToProj(pcs1, 1, pts);
        logger.info("X:" + pts[0] + ";Y" + pts[1]); // 682886.723893544 4426738.529141716
        // 误差在小数点后8位附近
        intArray[0] = pts[0];
        intArray[1] = pts[1];
        return intArray;
    }

    public PeCoordinateSystem getCoordSys(String layerName) throws SeException, IOException
             {
        PeCoordinateSystem pcs = null;
        ISession session = Config.getSession();
        try {
            SeLayer layer = session.getLayer(layerName);
            SeCoordinateReference coordReference = layer.getCoordRef();
            pcs = coordReference.getCoordSys();
        } catch (IOException e) {
            throw e;
        } finally {
            if (session != null) {
                session.dispose();
            }
        }
        return pcs;
    }

    public SeCoordinateReference getCoordinateReference(String layerName) throws IOException {
        ISession session = Config.getSession();
        SeCoordinateReference seCoordinateReference = null;
        try {
            SeLayer layer = session.getLayer(layerName);
            seCoordinateReference = layer.getCoordRef();
        } catch (IOException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
        return seCoordinateReference;
    }

    public static int[] csList() {

        try {
            return PeFactory.geogcsCodelist();
        } catch (PeProjectionException e) {
            e.printStackTrace();
        }
return null;
    }

    public void deleteAllLayer() throws SeException, IOException {

        List<SeLayer> ls = getLayerList();
        for (SeLayer l : ls) {
            if (!isSystemTable(l.getTableName()))
                this.deleteTable(l.getTableName());

        }

    }
    
    public void deleteFieldAliasByLayerId(int layerId) throws SeException, IOException {



    }

    public List queryLayerDescriptionTable(String layerName) throws IOException, SeException {
        ArrayList<HashMap<String, Object>> rowList = new ArrayList<HashMap<String, Object>>();
        ISession session = Config.getSession();
        try {
            SeTable table = session.getTable(layerName);

            SeColumnDefinition columnDef[] = table.describe();
            // logger.info("Table columns ");
            for (int i = 0; i < columnDef.length; i++) {

                // logger.info("Column " + (i + 1) + " Col Name  " + columnDef[i].getName());
                // logger.info("Qualified Col  " + table.qualifyColumn(columnDef[i].getName()));
                // logger.info("Column " + (i + 1) + " Col Scale " + columnDef[i].getScale());
                // logger.info("Column " + (i + 1) + " Col Size  " + columnDef[i].getSize());
                // logger.info("Column " + (i + 1) + " Col Type  " + columnDef[i].getType()
                // + " -> " + Util.resolveType(columnDef[i].getType()));
                // logger.info("Column " + (i + 1) + " Row Type  " + columnDef[i].getRowIdType()
                // + " -> " + Util.resolveIdType(columnDef[i].getRowIdType()));
                // logger.info("Column " + (i + 1) + " Def.  " + columnDef[i].toString());
                HashMap<String, Object> columnList = new HashMap<String, Object>();
                // "id", "type", "name", "alias", "length"
                columnList.put("ID", i + 1);
                columnList.put("TYPE", columnDef[i].getType());
                columnList.put("NAME", columnDef[i].getName());
                columnList.put("ALIAS", columnDef[i].getName());
                columnList.put("LENGTH", columnDef[i].getSize());
                columnList.put("SCALE", columnDef[i].getScale());
                // Fetch the next row that matches the query.
                rowList.add(columnList);
            }
        } catch (IOException e) {
            throw e;
        } catch (SeException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
        return rowList;
    }

    public List queryLayerDescriptionTable2(String tableName) throws IOException, SeException {
        ArrayList<HashMap<String, Object>> rowList = new ArrayList<HashMap<String, Object>>();
        HashMap<String,String> aliasHashMap = getLayerAliasList(tableName) ;
        ISession session = Config.getSession();
        try {
            SeTable table = session.getTable(tableName);
            SeColumnDefinition columnDef[] = table.describe();
            // logger.info("Table columns ");
            for (int i = 0; i < columnDef.length; i++) {

                HashMap<String, Object> columnList = new HashMap<String, Object>();
                // "id", "type", "name", "alias", "length"
                columnList.put("ID", i + 1);
                columnList.put("TYPE", columnDef[i].getType());
                columnList.put("NAME", columnDef[i].getName());
                columnList.put("ALIAS", aliasHashMap.containsKey(columnDef[i].getName() ) ? aliasHashMap.get(columnDef[i].getName() ) : columnDef[i].getName());
                columnList.put("LENGTH", columnDef[i].getSize());
                columnList.put("SCALE", columnDef[i].getScale());
                rowList.add(columnList);
            }
        } catch (IOException e) {
            throw e;
        } catch (SeException e) {
            throw e;
        } finally {
            if (session != null) {
                session.dispose();
            }
        }
        return rowList;
    }

    public void tableAddColumn(String layername, String name, int type) throws SeException,
            IOException {
        logger.info("表添加新列..");
        ISession session = Config.getSession();
        try {
            SeTable table = session.getTable(layername);
            SeColumnDefinition colDefs = UtilLayer.generateColumn(name, type);
            table.addColumn(colDefs);
        } catch (IOException e) {
            throw e;
        } catch (SeException e) {
            throw e;
        } finally {
            if (session != null) {
                session.dispose();
            }
        }
    }


    public void tableDelColumn(String layername, String name) throws IOException, SeException {

        // Attempt to Drop col that does not exist...
        ISession session = Config.getSession();
        try {

            SeTable table = session.getTable(layername);
            table.dropColumn(name);
        } catch (IOException e) {
            throw e;
        } catch (SeException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
        session.dispose();
    }

    public boolean isTableExixts(String layerName) {
        ISession session = Config.getSession();
        SeTable table;
        boolean flag = true;
        try {
            table = session.getTable(layerName);
            table.describe();
        } catch (IOException e) {
            // e.printStackTrace();
            flag = false;
        } catch (SeException e) {
            // e.printStackTrace();
            flag = false;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
        return flag;

    }

    /**
     * 生成一个表的名称
     * 
     * @param tableName
     * @return
     */
    public String generatorTableName(String tableName) {
        if (tableName == null || "".equals(tableName)) {
            tableName = "new" + System.currentTimeMillis();
        } else {
            tableName = Pinyin4jUtil.getPinyinToUpperCase(tableName);
            if (tableName==null||tableName.length()==0||((int) tableName.charAt(0) >= 48 && (int) tableName.charAt(0) <= 59)) {
                tableName = "new" + tableName;
            }
        }
        if (tableName.length() > 20) {
            tableName = tableName.substring(0, 7);
        }
        // 表是否存在
        if (isTableExixts(tableName)) {
            if (tableName.length() > 7) {
                tableName = tableName.substring(0, 7);
            }
            SimpleDateFormat df = new SimpleDateFormat("yyyyMMddHHmmss");
            // 名称是否超长
            tableName += "_"+df.format(new Date()) + "_" + new Random().nextInt(1000);;
        } 
        return tableName;

    }

    public boolean fieldExixts(String layerName, String fieldName, int type) throws SeException,
            IOException {
        boolean is = false;
        ISession session = Config.getSession();
        try {
            SeTable table = session.getTable(layerName);

            SeColumnDefinition[] columnDef = table.describe();

            for (int i = 0; i < columnDef.length; i++) {
                if (fieldName.toLowerCase().equals(columnDef[i].getName().toLowerCase())
                        && columnDef[i].getType() == type) {
                    is = true;
                }
            }
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
        return is;

    }

    /**
     * 是否是要素创建者
     * 
     * @param tableName
     * @param id
     * @param userid
     * @return
     * @throws IOException
     * @throws SeException
     */
    public boolean isFeaturePrivileges(String tableName, int id, int userid) throws IOException,
            SeException {
        logger.info("查询用户是否有管理这个要素的权限...");
        boolean flag = false;
        ISession session = Config.getSession();
        try {
            SeTable table = session.getTable(tableName);
            SeColumnDefinition[] tableDef = table.describe();

            boolean isContain = false;

            // 是否包含列userid
            for (int i = 0; i < tableDef.length; i++) {
                if (TABLE_FILED_USERID.equals(tableDef[i].getName().toLowerCase())) {
                    isContain = true;
                    break;
                }
            }
            // 是否包含列userid
            if (isContain) {
                String[] cols = new String[1];
                cols[0] = TABLE_FILED_USERID;
                SeSqlConstruct sqlConstruct = new SeSqlConstruct(tableName, TABLE_FILED_OBJECTID
                        + " = " + id);
                SeQueryInfo queryInfo = new SeQueryInfo();
                queryInfo.setConstruct(sqlConstruct);
                SeQuery query = session.createAndExecuteQuery(cols, sqlConstruct);
                query.execute();
                SeRow row = query.fetch();
                if (row != null && row.getInteger(0) == userid) {
                    flag = true;
                }
            }
        } catch (SeException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } finally {

            if (session != null) {
                session.dispose();
            }
        }
        return flag;

    }
    /**
     * 检查图层，将没有描述的图层增加描述信息到描述表
     * @param tableName
     * @param id
     * @param userid
     * @return
     */
    public void checkLayerFillDescriptTable() {
        try {
            List<Layer> layerDescriptlist = tableFactory.list(Layer.class, "");
            List<SeLayer> layerlist = this.getLayerList();
            HashMap<String,Integer> layerNameMap = new HashMap<String,Integer>();
            for(int i = 0;i<layerDescriptlist.size();i++){
                Layer layer = layerDescriptlist.get(i);
                layerNameMap.put(layer.getTablename(), layer.getId());
            }
            for(int i = 0;i<layerlist.size();i++){
                SeLayer selayer = layerlist.get(i);
                if(!isSystemTable(selayer.getTableName())&&!layerNameMap.containsKey(selayer.getTableName())){
                    Layer layer = new Layer();
                    layer.setLayername(selayer.getDescription()==null||"".equals(selayer.getDescription()) ? selayer.getTableName().toUpperCase() : selayer.getDescription().toUpperCase());
                    layer.setTablename(selayer.getTableName().toUpperCase());
                    layer.setUserid(0);
                    layer.setGeotype( UtilLayer.getLayerTypeInt(selayer) + "");
                    tableFactory.insert(layer);
                }
            }
           
        } catch (Exception e) {
            this.logger.info(e.toString());
        } 
        
        
    }
    
    /**
     * 检查表的完整性
     * @param tableName
     * @param id
     * @param userid
     * @return
     */
    public void checkLayerDelInvalidDescriptTable() {
        try {

            List<Layer> layerDescriptlist = tableFactory.list(Layer.class, "");
            List<SeLayer> layerlist = this.getLayerList();
            HashMap<String, String> layerNameMap = new HashMap<String, String>();
            for (int i = 0; i < layerlist.size(); i++) {
                SeLayer seLayer = layerlist.get(i);
                if(!isSystemTable(seLayer.getTableName()))
                    layerNameMap.put(seLayer.getName(), seLayer.getName());
            }
            for (int i = 0; i < layerDescriptlist.size(); i++) {
                Layer layer = layerDescriptlist.get(i);
                if (!layerNameMap.containsKey(layer.getTablename())) {
                    tableFactory.delete(Layer.class, "tablename='" + layer.getTablename() + "'");
                }
            }

        } catch (Exception e) {
            this.logger.info(e.toString());
        } 

    }
    
    /**
     * 检查表的完整性
     * @param tableName
     * @param id
     * @param userid
     * @return
     */
    public HashMap<String,String> getLayerAliasList(String tableName) {
        HashMap<String,String> aliasHashMap = new HashMap<String,String>();
        try {
            List<Layer>  aliasList = tableFactory.list(Layer.class, "tablename='" + tableName + "'");
            if(aliasList.size()>0){
               int layerid = aliasList.get(0).getId();
               List<Alias>  AliasList = tableFactory.list(Alias.class, "layerid="+layerid);
               for(Alias alias : AliasList){
                   aliasHashMap.put(alias.getFieldname(), alias.getAlias());
               }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return aliasHashMap;
    }
    public boolean isSystemTable(String tableName){
        return tableName.startsWith("GDB_");
        
    }
}

