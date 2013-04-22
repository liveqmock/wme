package com.dien.sde;

import static org.junit.Assert.fail;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import org.geotools.arcsde.session.ISession;
import org.geotools.arcsde.session.UnavailableConnectionException;
import org.junit.Before;
import org.junit.Test;

import com.dien.manager.dao.bean.Config;
import com.dien.manager.tools.Basis;
import com.esri.sde.sdk.client.SDEPoint;
import com.esri.sde.sdk.client.SeCoordinateReference;
import com.esri.sde.sdk.client.SeDelete;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeExtent;
import com.esri.sde.sdk.client.SeObjectId;
import com.esri.sde.sdk.client.SeShape;
import com.esri.sde.sdk.pe.PeProjectionException;

public class TestBasis {
    private static Basis basis;

    @Before
    public void setUp() throws Exception {
        new Config("192.168.0.178", "5151", "sde_db", "sde", "sde",1000,1,5);

        basis = new Basis();
    }

    @Test
    public void testBasis() {
        fail("Not yet implemented");
    }

    @Test
    public void testMain() {
      //fail("Not yet implemented");
        HashMap<String,String> aliasList = basis.getLayerAliasList("GDB_ITEMS");
        System.out.println(aliasList);
    }

    @Test
    public void testLayerList() {
        fail("Not yet implemented");
        for(int i=0;i<1000;i++){
            ISession session = Config.getSession();
            try {

                SeDelete delete = session.createSeDelete();
                delete.fromTable("YY", "OBJECTID" + " = " + 1);

               // delete.close();
            } catch (IOException e) {
                e.printStackTrace();
            } catch (SeException e) {
                e.printStackTrace();
            } finally {

                if (session != null) {
                    session.dispose();
                }
            }
            
        }
    }
    @Test
    public void testCreateLayer() {
        fail("Not yet implemented");
        JSONObject polygon =JSONObject.fromObject("{\"rings\":[[[1.2937806E7,4887266],[1.295554E7,4886807.5],[1.2951718E7,4871214.5],[1.2937806E7,4887266]]],\"spatialReference\":{\"wkid\":102100}}");
        //MUYUN
        
        //102100
        
        try {
            createPolygon(polygon,"MUYUN", "102100");
        } catch (SeException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
       } catch (UnavailableConnectionException e) {
           e.printStackTrace();
        } catch (PeProjectionException e) {
            e.printStackTrace();
        }
        
        
        int numPoints = 4;
        int numParts = 1;
        int[] partOffsets = new int[numParts];
        partOffsets[0] = 0;

        SDEPoint[] ptArray = new SDEPoint[4];
        ptArray[0] = new SDEPoint(160.22228,4.14658);
        
        ptArray[1] = new SDEPoint(160.38159,4.14343);
        ptArray[2] = new SDEPoint(160.34726,4.03627);
        ptArray[3] = new SDEPoint(160.22228,4.14658);

        try {
            SeCoordinateReference coordref = new SeCoordinateReference();
            //coordref.setCoordSysByID(new SeObjectId(4326));
            coordref.setXY(0.000001, 0.000001, 1000000);
            SeExtent ext = new SeExtent(-180, -90, 180, 90);
            coordref.setXYByEnvelope(ext);
            coordref.setPrecision(1000000);
            //coordref.setXY(0,0,1000);
            //
           System.out.println( coordref.getPrecision());
           System.out.println( coordref.getXYEnvelope());
           System.out.println( coordref.getMUnits());
           System.out.println( coordref.getVertCSId());
           System.out.println( coordref.getPrecision());
           System.out.println( coordref.getXYUnits());
           System.out.println( coordref.getCoordSysDescription());
            //SeCoordinateReference coordref = new SeCoordinateReference();
            //coordref.setXY(0,0,1000);
            SeShape  spartPolygonOne = new SeShape(coordref);
            spartPolygonOne.generatePolygon(numPoints, numParts, partOffsets, ptArray);           
            System.out.println(spartPolygonOne.getNumParts());
        } catch( SeException e ) {
            Util.printError(e);
        }
    }
    @Test
    public SeShape createPolygon(JSONObject polygon, String layerName, String wkid)throws SeException, IOException, UnavailableConnectionException, PeProjectionException {
        fail("Not yet implemented");
        int fromCS = Integer.parseInt(wkid);
        fromCS = fromCS == 102100 ? 102113 : fromCS;
        fromCS = fromCS < 0 ? 4326 : fromCS;
        //SeCoordinateReference coordref = basis.getCoordinateReference(layerName);
        SeCoordinateReference coordref = new SeCoordinateReference();
        coordref.setCoordSysByID(new SeObjectId(4326));
        SeExtent ext = new SeExtent(-180, -90, 180, 90);
        coordref.setXYByEnvelope(ext);
        SeShape shape = new SeShape(coordref);
        JSONArray rings = polygon.getJSONArray("rings");
        int numParts = rings.size();
        int[] partOffsets = new int[numParts];
        ArrayList<SDEPoint> ptList = new ArrayList<SDEPoint>();
        int numPts = 0;
        for (int i = 0; i < rings.size(); i++) {
            JSONArray points = rings.getJSONArray(i);
            partOffsets[i] = numPts;
            for (int j = 0; j < points.size(); j++) {

                numPts++;
                double[] xy = Basis.trans(points.getJSONArray(j).getDouble(0),
                        points.getJSONArray(j).getDouble(1), fromCS, coordref.getCoordSys());
                ptList.add(new SDEPoint(xy[0], xy[1]));

            }
        }
        SDEPoint[] ptArray = new SDEPoint[ptList.size()];
        ptList.toArray(ptArray);
        shape.generatePolygon(numPts, numParts, partOffsets, ptArray);

        return shape;
    }
    @Test
    public void testCreateBaseTable() {
        fail("Not yet implemented");
        JSONObject layerJSON = JSONObject.fromObject("{\"layername\":\"2323\",\"wkid\":4326,\"shapetype\":\"2\",\"fields\":[{\"id\":0,\"name\":\"F\",\"type\":5},{\"id\":1,\"name\":\"G\",\"type\":5},{\"id\":2,\"name\":\"H\",\"type\":5},{\"id\":3,\"name\":\"I\",\"type\":5},{\"id\":4,\"name\":\"J\",\"type\":5},{\"id\":5,\"name\":\"K\",\"type\":5},{\"id\":6,\"name\":\"今天星期几我们今天星期几我们今天星期几我们今天星期几我们今天\",\"type\":5},{\"id\":7,\"name\":\"D\",\"type\":5},{\"id\":8,\"name\":\"LENG\",\"type\":1},{\"id\":9,\"name\":\"A\",\"type\":5},{\"id\":10,\"name\":\"B\",\"type\":5},{\"id\":11,\"name\":\"C\",\"type\":5},{\"id\":12,\"name\":\"E\",\"type\":5},{\"id\":13,\"name\":\"ADATE\",\"type\":7}]}");
        String layername = layerJSON.getString("layername");
        List columns = layerJSON.getJSONArray("fields");
        int wkid = layerJSON.getInt("wkid");
        int shapeType = layerJSON.getInt("shapetype");


            String tableName = basis.generatorTableName(layername);
            try {
                basis.createLayer(tableName, layername, columns, wkid, shapeType);
            } catch (SeException e) {
               e.printStackTrace();
            } catch (IOException e) {
                e.printStackTrace();
            }

    }

    @Test
    public void testGetShapeDetails() {
        fail("Not yet implemented");
    }

    @Test
    public void testGetColumnsName() {
        fail("Not yet implemented");
    }

    @Test
    public void testGetColumnsType() {
        fail("Not yet implemented");
    }

    @Test
    public void testSetColumnsByMap() {
        fail("Not yet implemented");
    }

    @Test
    public void testAddRow() {
        fail("Not yet implemented");
    }

    @Test
    public void testUpdateRow() {
        fail("Not yet implemented");
    }

    @Test
    public void testDeleteRow() {
        fail("Not yet implemented");
    }

    @Test
    public void testDeleteTable() {
        fail("Not yet implemented");
    }

    @Test
    public void testQueryByID() {
        fail("Not yet implemented");
    }

    @Test
    public void testQueryByBox() {
        fail("Not yet implemented");
    }

    @Test
    public void testQueryAll() throws IOException, UnavailableConnectionException {
        fail("Not yet implemented");
        //List list = basis.queryAll("POI",100, 10,"OBJECTID");
        //System.out.println(list);
        
        
       // List list = basis.queryAll(basis.DIEN_LABYER_DESCRIPTION_TABLE, "layername = 'testLayer'");
       // System.out.println(list);

        
    }

    @Test
    public void testRunSpatialQuery() {
        fail("Not yet implemented");
    }

    @Test
    public void testTransDoubleDoubleIntInt() {
        fail("Not yet implemented");
    }

    @Test
    public void testTransDoubleDoublePeCoordinateSystemPeCoordinateSystem() {
        fail("Not yet implemented");
    }

    @Test
    public void testTransDoubleArrayPeCoordinateSystemPeCoordinateSystem() {
        fail("Not yet implemented");
    }

    @Test
    public void testTransDoubleArrayArrayArrayIntInt() {
        fail("Not yet implemented");
    }

    @Test
    public void testTransDoubleArrayArrayArrayPeCoordinateSystemPeCoordinateSystem() {
        fail("Not yet implemented");
    }

    @Test
    public void testToGeog() {
        fail("Not yet implemented");
    }

    @Test
    public void testToProj() {
        fail("Not yet implemented");
    }

    @Test
    public void testGetCoordSys() {
        fail("Not yet implemented");
    }

    @Test
    public void testGetCoordinateReference() {
        fail("Not yet implemented");
    }

    @Test
    public void testCsList() {
        fail("Not yet implemented");
    }

    @Test
    public void testCreateLayerDescriptionTable() {
        fail("Not yet implemented");
        //basis.createLayerDescriptionTable();
        
    }

    @Test
    public void testInsertLayerDescriptionTable() {
        fail("Not yet implemented");
        //basis.insertLayerDescriptionTable("huochezhan",0, SeColumnDefinition.TYPE_STRING, "name", "名称", new Date(),1);
    }

    @Test
    public void testUpdateLayerDescriptionTable() {
        fail("Not yet implemented");
    }

    @Test
    public void testQueryLayerDescriptionTable() {
        fail("Not yet implemented");
        //List rowList =basis.queryLayerDescriptionTable(1);
        //System.out.println(rowList.toString());
    }
    @Test
    public void testTableAddColumn(){
        fail("Not yet implemented");
        //basis.tableAddColumn(basis.DIEN_LABYER_DESCRIPTION_TABLE, "testCol1", SeColumnDefinition.TYPE_STRING);

    }
    @Test
    public void tableDelColumn() {
        fail("Not yet implemented");
        //basis.tableDelColumn(basis.DIEN_LABYER_DESCRIPTION_TABLE, "testCol1");

    }
    @Test
    public void testCreateUserTable() {
        fail("Not yet implemented");
        //basis.createUserTable(true);
    }

    @Test
    public void testLogin() {
        fail("Not yet implemented");
    }
    @Test
    public void testGeneraterKey() {
        fail("Not yet implemented");
        //int key = basis.generaterKey(basis.DIEN_LABYER_DESCRIPTION_TABLE, "id");
        //System.out.println("key = "+key);
    }
    
 
}
