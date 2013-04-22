/***********************************************************************
 Copyright � 2006 ESRI

 All rights reserved under the copyright laws of the United States and
 applicable international laws, treaties, and conventions.

 You may freely redistribute and use this sample code, with or without
 modification, provided you include the original copyright notice and use
 restrictions.

 Disclaimer:  THE SAMPLE CODE IS PROVIDED "AS IS" AND ANY EXPRESS OR IMPLIED
 WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
 FOR A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL ESRI OR
 CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 OR BUSINESS INTERRUPTION) SUSTAINED BY YOU OR A THIRD PARTY, HOWEVER CAUSED
 AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 TORT ARISING IN ANY WAY OUT OF THE USE OF THIS SAMPLE CODE, EVEN IF ADVISED
 OF THE POSSIBILITY OF SUCH DAMAGE.

 For additional information, contact:
 Environmental Systems Research Institute, Inc.
 Attn: Contracts and Legal Services Department
 380 New York Street
 Redlands, California, 92373
 USA

 email: contracts@esri.com
 ***********************************************************************/
/*************************************************************************
 * Purpose:
 * Demonstrates use of SeShapeFilter & SeShapeIdFilter.
 * Performs spatial queries on layers.
 * Demonstrates use of spatial filter combinations.
 *------------------------------------------------------------------------------
 * Usage: java SpatialQueryExample {server} {instance} {database} {user} {passwd} {storage type}
 *
 * This Java sample demonstrates usage of ArcSDE API. It will not execute successfully until the user
 * supplies valid ArcSDE Server details such as server name, port number, database name, user, pwd, and valid
 * data, if required.
 **************************************************************************/
package com.dien.sde;

import com.esri.sde.sdk.client.SDEPoint;
import com.esri.sde.sdk.client.SeColumnDefinition;
import com.esri.sde.sdk.client.SeConnection;
import com.esri.sde.sdk.client.SeCoordinateReference;
import com.esri.sde.sdk.client.SeError;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeExtent;
import com.esri.sde.sdk.client.SeFilter;
import com.esri.sde.sdk.client.SeInsert;
import com.esri.sde.sdk.client.SeLayer;
import com.esri.sde.sdk.client.SeObjectId;
import com.esri.sde.sdk.client.SeQuery;
import com.esri.sde.sdk.client.SeRow;
import com.esri.sde.sdk.client.SeShape;
import com.esri.sde.sdk.client.SeShapeFilter;
import com.esri.sde.sdk.client.SeShapeIdFilter;
import com.esri.sde.sdk.client.SeSqlConstruct;
import com.esri.sde.sdk.client.SeTable;


public class SpatialQueryExample
{

    private SeLayer layerPoly = null;
    private SeTable tablePoly = null;
    private SeLayer layerLine = null;
    private SeTable tableLine = null;
    private SeLayer layerPoint = null;
    private SeTable tablePoint = null;
    private String TABLE_NAME_POLY = "SQUERY_POLY_";
    private String TABLE_NAME_LINE = "SQUERY_LINE_";
    private String TABLE_NAME_POINT = "SQUERY_POINT_";
    private SeConnection conn = null;
    private static final int ENVP = (1<<1);
    private static final int SC = (1<<2);
    private static final int AI = (1<<3);
    private static final int IDENTICAL = (1<<4);
    private static final int COMMON = (1<<5);
    private static final int CP = (1<<6);
    private static final int SC_NO_ET = (1<<7);
    private static final int AI_NO_ET = (1<<8);

    private static final int SHP1 = (1<<1);
    private static final int SHP2 = (1<<2);
    private static final int SHP3 = (1<<3);
    private static final int SHP4 = (1<<4);
    private static final int SHP5 = (1<<5);
    private static final int SHP6 = (1<<6);
    private static final int SHP7 = (1<<7);
    private static final int SHP8 = (1<<8);
    private static final int SHP9 = (1<<9);
    private static final int SHP10 = (1<<10);
    private static final int SHP11 = (1<<11);


    public static void main(String[] args)
    {

        SpatialQueryExample sQuery = new SpatialQueryExample(args);
    }

    public SpatialQueryExample(String[] args)
    {

        String server = "", database = "none", user = "", password = "",
                storageType = "",
                              instance = "";

        /*
         *    Process command line arguments
         */
        if (args.length == 6)
        {
            server = args[0];
            instance = args[1];
            database = args[2];
            user = args[3];
            password = args[4];
            storageType = args[5];
        }
        else
        {
            System.out.println("Invalid number of arguments!!");
            System.out.println("\nUsage: \n  java SpatialQueryExample {server} {instance} {database} {user} {passwd}  {storage type}\n");
            System.exit(0);
        }
        try
        {
            conn = new SeConnection(server, instance, database, user, password);
            System.out.println("Connection Successful! \n");

            TABLE_NAME_POLY += storageType;
            TABLE_NAME_LINE += storageType;
            TABLE_NAME_POINT += storageType;

            /*
             *   Create the shapes to be used in the tests
             */
            createTestLayers(storageType);

            SeCoordinateReference cref = layerPoly.getCoordRef();

            int testAll = ENVP + SC + AI + IDENTICAL + COMMON + CP + SC_NO_ET +
                          AI_NO_ET;

            SeObjectId[] shapeIds = new SeObjectId[1];
            shapeIds[0] = new SeObjectId(1);

            int[] expectedShapes = new int[8];

            /*
             *   Generate a rectangular shape to be used as a filter
             */
            SeShape shape = new SeShape();
            shape.setCoordRef(layerPoly.getCoordRef());

            double minX = 2000, minY = 4000, maxX = 9000, maxY = 9000;
            SeExtent extent = new SeExtent(minX, minY, maxX, maxY);
            shape.generateRectangle(extent);

            SeShape[] shapes = new SeShape[1];
            shapes[0] = shape;

            // Envp
            expectedShapes[0] = SHP1 + SHP2 + SHP3 + SHP4 + SHP8 + SHP9 + SHP10 +
                                SHP11;
            // Sec contained in pri
            expectedShapes[1] = SHP2 + SHP3 + SHP8 + SHP9 + SHP10 + SHP11;
            // Area Intersect
            expectedShapes[2] = SHP2 + SHP3 + SHP4 + SHP9 + SHP10 + SHP11;
            // Identical shapes
            expectedShapes[3] = 0;
            // Common line/edge
            expectedShapes[4] = SHP1 + SHP2 + SHP8;
            // Common point
            expectedShapes[5] = SHP1 + SHP2;
            // Sec contained in pri, no edge touch
            expectedShapes[6] = SHP3 + SHP9 + SHP10 + SHP11;
            // area intersect, no edge touch
            expectedShapes[7] = SHP3 + SHP9 + SHP10 + SHP11;

            /*
             *   Run filter tests against this shape
             */
            System.out.println("\n\n\n--> Rectangular Shape Filter");
            filterTest(shapes, testAll, expectedShapes);

            /*
             *   Use shape id 8 from Polygon layer as filter.
             *   shape no 8 is exactly the same same as the
             *   rectangle used above so the expectedShapes array
             *   is reused.
             */
            SeObjectId[] shapeId = new SeObjectId[1];
            shapeId[0] = new SeObjectId(8);
            System.out.println("\n\n\n--> Rectangular shape Fid Filter");
            filterTest(shapeId, testAll, expectedShapes);

            /*
             *   Generate point shape common to shapes 4,5,6 & 7
             */
            SDEPoint[] ptArray = new SDEPoint[1];
            ptArray[0] = new SDEPoint(10000, 10000);
            shape.generatePoint(1, ptArray);

            shapes[0] = shape;

            // Envp
            expectedShapes[0] = SHP4 + SHP5 + SHP6 + SHP7;
            // Sec contained in pri
            expectedShapes[1] = 0;
            // Area Intersect
            expectedShapes[2] = 0;
            // Identical shapes
            expectedShapes[3] = 0;
            // Common line/edge
            expectedShapes[4] = 0;
            // Common point
            expectedShapes[5] = SHP4 + SHP5 + SHP6 + SHP7;
            // Sec contained in pri, no edge touch
            expectedShapes[6] = 0;
            // area intersect, no edge touch
            expectedShapes[7] = 0;

            /*
             *   Run filter tests using point shape
             */
            System.out.println("\n\n\n--> Point Shape Filter ");
            filterTest(shapes, testAll, expectedShapes);

            /*
             *   Use shape id 3 from the point layer as the filter.
             *   shape no 3 is exactly the same same as the
             *   point shape used above. So the expectedShapes array
             *   is reused.
             */
            shapeId[0] = new SeObjectId(3);
            System.out.println("\n\n\n--> Point Fid Filter");
            filterTest(shapeId, testAll, expectedShapes);

            /*
             *   Generate line shape through (2000,10000) and (10000,2000)
             */
            int numPts = 2;
            int numParts = 1;
            int[] partOffSets = new int[numParts];
            partOffSets[0] = 0;
            ptArray = new SDEPoint[numPts];
            ptArray[0] = new SDEPoint(2000, 10000);
            ptArray[1] = new SDEPoint(10000, 2000);

            shape.generateSimpleLine(numPts, numParts, partOffSets, ptArray);

            shapes[0] = shape;

            // Envp
            expectedShapes[0] = SHP1 + SHP2 + SHP3 + SHP4 + SHP5 + SHP6 + SHP7 +
                                SHP8 + SHP9 + SHP10 + SHP11;
            // Sec contained in pri
            expectedShapes[1] = 0;
            // Area Intersect
            expectedShapes[2] = SHP3 + SHP9 + SHP10;
            // Identical shapes
            expectedShapes[3] = 0;
            // Common line/edge
            expectedShapes[4] = 0;
            // Common point
            expectedShapes[5] = 0;
            // Sec contained in pri, no edge touch
            expectedShapes[6] = 0;
            // area intersect, no edge touch
            expectedShapes[7] = 0;

            /*
             *   Run filter tests against this shape
             */
            System.out.println("\n\n\n--> Line shape Filter");
            filterTest(shapes, testAll, expectedShapes);

            /*
             *   Generate a multi-point filter.
             */
            numPts = 3;
            ptArray = new SDEPoint[numPts];
            ptArray[0] = new SDEPoint(8000, 5000);
            ptArray[1] = new SDEPoint(10000, 8000);
            ptArray[2] = new SDEPoint(10000, 10000);

            shape.generatePoint(numPts, ptArray);

            shapes[0] = shape;

            // Envp
            expectedShapes[0] = SHP4 + SHP5 + SHP6 + SHP7 + SHP9;
            // Sec contained in pri
            expectedShapes[1] = 0;
            // Area Intersect
            expectedShapes[2] = 0;
            // Identical shapes
            expectedShapes[3] = 0;
            // Common line/edge
            expectedShapes[4] = 0;
            // Common point
            expectedShapes[5] = SHP4 + SHP5 + SHP6 + SHP7 + SHP9;
            // Sec contained in pri, no edge touch
            expectedShapes[6] = 0;
            // area intersect, no edge touch
            expectedShapes[7] = 0;

            /*
             *   Run filter tests against this shape
             */
            System.out.println("\n\n\n--> Multi point shape Filter");
            filterTest(shapes, testAll, expectedShapes);

            /*
             *   Generate Multi-part Line filter.
             */
            numPts = 5;
            numParts = 2;
            partOffSets = new int[numParts];
            partOffSets[0] = 0;
            partOffSets[1] = 2;
            ptArray = new SDEPoint[numPts];
            ptArray[0] = new SDEPoint(7000, 3000);
            ptArray[1] = new SDEPoint(8000, 7000);
            ptArray[2] = new SDEPoint(6000, 7000);
            ptArray[3] = new SDEPoint(6000, 9000);
            ptArray[4] = new SDEPoint(11000, 11000);

            shape.generateLine(numPts, numParts, partOffSets, ptArray);

            shapes[0] = shape;

            // Envp
            expectedShapes[0] = SHP3 + SHP4 + SHP5 + SHP6 + SHP7 + SHP8 + SHP9 +
                                SHP11;
            // Sec contained in pri
            expectedShapes[1] = 0;
            // Area Intersect
            expectedShapes[2] = SHP4 + SHP5 + SHP6 + SHP8 + SHP9;
            // Identical shapes
            expectedShapes[3] = 0;
            // Common line/edge
            expectedShapes[4] = SHP3 + SHP4;
            // Common point
            expectedShapes[5] = 0;
            // Sec contained in pri, no edge touch
            expectedShapes[6] = 0;
            // area intersect, no edge touch
            expectedShapes[7] = 0;

            /*
             *   Run filter tests against this shape
             */
            System.out.println("\n\n\n--> Multi-line shape Filter");
            filterTest(shapes, testAll, expectedShapes);

            /*
             *   Generate multi-part polygon filter.
             */
            numPts = 12;
            numParts = 3;
            partOffSets = new int[numParts];
            partOffSets[0] = 0;
            partOffSets[1] = 4;
            partOffSets[2] = 8;
            ptArray = new SDEPoint[numPts];

            ptArray[0] = new SDEPoint(11000, 5000);
            ptArray[1] = new SDEPoint(11000, 7000);
            ptArray[2] = new SDEPoint(9000, 6000);
            ptArray[3] = new SDEPoint(11000, 5000);

            ptArray[4] = new SDEPoint(9000, 11000);
            ptArray[5] = new SDEPoint(9500, 11500);
            ptArray[6] = new SDEPoint(10000, 10000);
            ptArray[7] = new SDEPoint(9000, 11000);

            ptArray[8] = new SDEPoint(4000, 8000);
            ptArray[9] = new SDEPoint(6000, 8000);
            ptArray[10] = new SDEPoint(5000, 9000);
            ptArray[11] = new SDEPoint(4000, 8000);

            shape.generatePolygon(numPts, numParts, partOffSets, ptArray);

            shapes[0] = shape;

            // Envp
            expectedShapes[0] = SHP2 + SHP3 + SHP4 + SHP5 + SHP6 + SHP7 + SHP9 +
                                SHP10 + SHP11;
            // Sec contained in pri
            expectedShapes[1] = 0;
            // Area Intersect
            expectedShapes[2] = SHP5 + SHP7;
            // Identical shapes
            expectedShapes[3] = 0;
            // Common line/edge
            expectedShapes[4] = SHP3;
            // Common point
            expectedShapes[5] = SHP3 + SHP4 + SHP5 + SHP6 + SHP7 + SHP10;
            // Sec contained in pri, no edge touch
            expectedShapes[6] = 0;
            // area intersect, no edge touch
            expectedShapes[7] = 0;

            /*
             *   Run filter tests against this shape
             */
            System.out.println("\n\n\n--> Multi-part Polygon shape Filter");
            filterTest(shapes, testAll, expectedShapes);

        }
        catch (SeException e)
        {
            e.printStackTrace(System.out);
        }
        finally
        {
            /*
             *   Delete the test table
             */
            try
            {
                System.out.println("\n--> Deleting the test tables...");
                tablePoly.delete();
                tableLine.delete();
                tablePoint.delete();
                System.out.println(" - OK");

                System.out.println("Disconnecting ... \n");
                conn.close();

            }
            catch (SeException e)
            {
                if (SeError.SE_TABLE_NOEXIST != e.getSeError().getSdeError())
                {
                    e.printStackTrace(System.out);
                }
            }

        }

    } // End Main


    public void filterTest(Object[] shapeList, int testBit, int[] expShapes)
            throws SeException
    {

        /*
         *   ENVELOPE METHOD
         *   Requires the envelopes of the search and candidate shapes to overlap
         *   or touch.
         */
        if ((testBit & ENVP) == ENVP)
        {
            System.out.println("\n ENVELOPE METHOD ");
            runSpatialQuery(shapeList, SeFilter.METHOD_ENVP, expShapes[0]);
        }

        /*
         *   SECONDARY CONTAINED IN PRIMARY
         *
         *   Candidate shape wholly contained by search shape, inclusive
         *   of the search shape's boundary.
         */
        if ((testBit & SC) == SC)
        {
            System.out.println("\n SECONDARY CONTAINED IN PRIMARY");
            runSpatialQuery(shapeList, SeFilter.METHOD_SC, expShapes[1]);
        }

        /*
         *   AREA INTERSECT
         *
         *   Area or interiors of search and candidate shape intersect
         */
        if ((testBit & AI) == AI)
        {
            System.out.println("\n AREA INTERSECT");
            runSpatialQuery(shapeList, SeFilter.METHOD_AI, expShapes[2]);
        }

        /*
         *   IDENTICAL SHAPES
         *
         *   Both shapes identical in terms of shape type and coordinate description.
         *   Used to find duplicate data.
         */
        if ((testBit & IDENTICAL) == IDENTICAL)
        {
            System.out.println("\n IDENTICAL SHAPES ");
            runSpatialQuery(shapeList, SeFilter.METHOD_IDENTICAL, expShapes[3]);
        }

        /*
         *   COMMON LINE/EDGE
         *
         *   The search and candidate shapes share atleast one line with the same
         *   vertices
         */
        if ((testBit & COMMON) == COMMON)
        {
            System.out.println("\n COMMON LINE/EDGE");
            runSpatialQuery(shapeList, SeFilter.METHOD_COMMON, expShapes[4]);
        }

        /*
         *   COMMON POINT
         *
         *   Search and candidate shape share atleast one point. Used to find all
         *   parcels adjacent to a given parcel( Assuming topological integrity
         *   between parcels
         */
        if ((testBit & CP) == CP)
        {
            System.out.println("\n COMMON POINT ");
            runSpatialQuery(shapeList, SeFilter.METHOD_CP, expShapes[5]);
        }

        /*
         *   SECONDARY CONTAINED IN PRIMARY WITH NO EDGE TOUCH
         *
         *   candidate shape wholly contained in search shape without
         *   edge touch. Search shape MUST be an area shape, candidate shape
         *   Must be inside it and their boundaries may not intersect or touch.
         */
        if ((testBit & SC_NO_ET) == SC_NO_ET)
        {
            System.out.println(
                    "\n SECONDARY CONTAINED IN PRIMARY WITH NO EDGE TOUCH");
            runSpatialQuery(shapeList, SeFilter.METHOD_SC_NO_ET, expShapes[6]);
        }

        /*
         *   AREA INTERSECT WITH NO EDGE TOUCH
         *
         *   Area intersection without touching a shape boundary.
         */
        if ((testBit & AI_NO_ET) == AI_NO_ET)
        {
            System.out.println("\n AREA INTERSECT WITH NO EDGE TOUCH");
            runSpatialQuery(shapeList, SeFilter.METHOD_AI_NO_ET, expShapes[7]);
        }

    } // End method filterTest


    /*
     *   Runs a spatial query against the layer using the specified shape and method
     */
    public void runSpatialQuery(Object[] shapeList, int method,
                                int expectedShapes)
            throws SeException
    {

        int shapesRetrieved = runSpatialQuery(shapeList, method, expectedShapes,
                                              layerPoly.getName(),
                                              layerPoly.getSpatialColumn());

        shapesRetrieved += runSpatialQuery(shapeList, method, expectedShapes,
                                           layerLine.getName(),
                                           layerLine.getSpatialColumn());

        shapesRetrieved += runSpatialQuery(shapeList, method, expectedShapes,
                                           layerPoint.getName(),
                                           layerPoint.getSpatialColumn());

        if (shapesRetrieved == expectedShapes)
        {
            System.out.println(" - Expected Results");
        }
        else
        {
            System.out.println(" * * * ERROR Unexpected Results  * * *");
            System.out.println(" * * *  Expected " + expectedShapes + "  * * *");
            System.out.println(" * * *  Observed " + shapesRetrieved +
                               "  * * *");
        }

    } // End method runSpatialQuery


    public int runSpatialQuery(Object[] shapeList, int method,
                               int expectedShapes,
                               String layerName, String spatialCol)
            throws SeException
    {

        int shapesRetrieved = 0;
        SeFilter[] filters = null;
        SeFilter filter = null;

        if (shapeList.length > 0)
        {

            filters = new SeFilter[shapeList.length];
            if (shapeList[0].getClass().getName().equals(
                    "com.esri.sde.sdk.client.SeShape"))
            {

                SeShape[] shape = new SeShape[shapeList.length];
                for (int i = 0; i < shape.length; i++)
                {

                    shape[i] = (SeShape) shapeList[i];
                    filter = new SeShapeFilter(layerName, spatialCol, shape[i],
                                               method);
                    filters[i] = filter;
                } // End for

            }
            else if (shapeList[0].getClass().getName().equals(
                    "com.esri.sde.sdk.client.SeObjectId"))
            {

                SeObjectId[] shapeId = new SeObjectId[shapeList.length];
                // Name of the layer containing the Shape Id used as filter.
                String filterLayerName = null;
                for (int i = 0; i < shapeId.length; i++)
                {

                    shapeId[i] = (SeObjectId) shapeList[i];

                    if (shapeId[i].longValue() == 8)
                    {
                        filterLayerName = layerPoly.getName();
                    }
                    else if (shapeId[i].longValue() == 3)
                    {
                        filterLayerName = layerPoint.getName();
                    }

                    filter = new SeShapeIdFilter(layerName, spatialCol,
                                                 filterLayerName, shapeId[i],
                                                 method);
                    filters[i] = filter;
                } // End for

            } // End if..else

        } // End if

        SeColumnDefinition[] tableDef = tablePoly.describe();
        String[] cols = new String[tableDef.length];
        for (int i = 0; i < tableDef.length; i++)
        {
            cols[i] = tableDef[i].getName();
        }
        SeQuery spatialQuery = null;
        SeSqlConstruct sqlCons = new SeSqlConstruct(layerName);
        spatialQuery = new SeQuery(conn, cols, sqlCons);
        spatialQuery.prepareQuery();
        /*
         *   Set spatial constraints
         */
        spatialQuery.setSpatialConstraints(SeQuery.SE_OPTIMIZE, false, filters);
        spatialQuery.execute();
        // Only retrieves shapes...
        SeRow row = spatialQuery.fetch();
        SeColumnDefinition colDef = new SeColumnDefinition();
        int numCols = 0;
        try
        {
            numCols = row.getNumColumns();
        }
        catch (NullPointerException ne)
        {
            spatialQuery.close();
            return shapesRetrieved;
        }

        int MAX_ROWS = 11;
        String[] desc = new String[MAX_ROWS];

        while (row != null)
        {
            int shapeNo = 0;
            for (int i = 0; i < numCols; i++)
            {
                colDef = row.getColumnDef(i);
                int type = colDef.getType();
                if (row.getIndicator((short) i) != SeRow.SE_IS_NULL_VALUE)
                {

                    switch (type)
                    {
                    case SeColumnDefinition.TYPE_SHAPE:

                        //Util.getAllCoords(row.getShape(i));
                        break;
                    case SeColumnDefinition.TYPE_STRING:
                        break;
                    case SeColumnDefinition.TYPE_INTEGER:
                        shapeNo = row.getInteger(i).intValue();
                        if (colDef.getName().equalsIgnoreCase(Util.INT_COL_NAME))
                        {
                            shapesRetrieved += shapeNo;
                        }

                        //  Used when debugging this test.
                        /*
                                                         int power = -1;
                         for( ; shapeNo > 0; power++ )
                            shapeNo = shapeNo>>1;
                         System.out.println("Shape " + power);
                         */
                        break;
                    default:
                        System.out.println("Unknown Type");
                        break;
                    } // End switch(type)
                } // End if
            } // End for
            row = spatialQuery.fetch();
        } // End while
        spatialQuery.close();

        return shapesRetrieved;

    }

    /*
     *  Creates a 3 tables starting with String defined in variable
     * TABLE_NAME. The storage type and the shape type(polygon, line, point)
     * is appended to this name. The tables are spatially enabled and a total
     * of 11 shapes are inserted.
     */
    public void createTestLayers(String storageType)
    {

        SeInsert insertPoly = null;
        SeInsert insertLine = null;
        SeInsert insertPoint = null;

        try
        {

            tablePoly = Util.createTable(conn, storageType, TABLE_NAME_POLY, null);
            tableLine = Util.createTable(conn, storageType, TABLE_NAME_LINE, null);
            tablePoint = Util.createTable(conn, storageType, TABLE_NAME_POINT, null);

            //Spatially enable the new table...
            System.out.println("\n--> Spatially enabling the tables...");

            layerPoly = new SeLayer(conn);
            layerPoly.setTableName(tablePoly.getName());
            layerPoly.setDescription("QA Test Layer");

            SeCoordinateReference coordref = new SeCoordinateReference();
            coordref.setXY(0.0, 0.0, 10000.0);
            layerPoly.setCoordRef(coordref);
            layerPoly.setCreationKeyword(storageType);
            layerPoly.setShapeTypes(SeLayer.SE_AREA_TYPE_MASK |
                                    SeLayer.SE_MULTIPART_TYPE_MASK);
            Util.createLayer(layerPoly, 25, 4);

            coordref = layerPoly.getCoordRef();

            layerLine = new SeLayer(conn);
            layerLine.setTableName(tableLine.getName());
            layerLine.setDescription("QA Test Layer");
            layerLine.setCoordRef(coordref);
            layerLine.setCreationKeyword(storageType);
            layerPoly.setShapeTypes(SeLayer.SE_LINE_TYPE_MASK |
                                    SeLayer.SE_MULTIPART_TYPE_MASK);
            Util.createLayer(layerLine, 25, 4);

            layerPoint = new SeLayer(conn);
            layerPoint.setTableName(tablePoint.getName());
            layerPoint.setDescription("QA Test Layer");
            layerPoint.setCoordRef(coordref);
            layerPoint.setCreationKeyword(storageType);
            layerPoly.setShapeTypes(SeLayer.SE_POINT_TYPE_MASK |
                                    SeLayer.SE_MULTIPART_TYPE_MASK);
            Util.createLayer(layerPoint, 25, 4);

            String columns[] = new String[3];
            columns[0] = Util.INT_COL_NAME;
            columns[1] = Util.STRING_COL_NAME;
            columns[2] = Util.SHAPE_COL_NAME;

            insertPoly = new SeInsert(conn);
            insertPoly.intoTable(tablePoly.getName(), columns);
            insertPoly.setWriteMode(true); // BUFFERED

            SeExtent rectangle = new SeExtent();
            SeShape shape = new SeShape(coordref);
            SeRow rowPoly = insertPoly.getRowToSet();

            /*
             *   Insert shape 1 : Square
             */
            rectangle.setMinX(2000);
            rectangle.setMinY(2000);
            rectangle.setMaxX(4000);
            rectangle.setMaxY(4000);
            shape.generateRectangle(rectangle);

            // set the cols in the row
            rowPoly.setInteger(0, new Integer(SHP1));
            rowPoly.setString(1, "Shape 1 (Square)");
            rowPoly.setShape(2, shape);

            // Insert it
            insertPoly.execute();

            /*
             *   Insert shape 2 : Square
             */
            rectangle.setMinX(2000);
            rectangle.setMinY(4000);
            rectangle.setMaxX(4000);
            rectangle.setMaxY(6000);
            shape.generateRectangle(rectangle);

            // set the cols in the row
            rowPoly.setInteger(0, new Integer(SHP2));
            rowPoly.setString(1, "Shape 2 (Square)");
            rowPoly.setShape(2, shape);

            // Insert it
            insertPoly.execute();

            /*
             *   Insert shape 3 : rectangle
             */
            rectangle.setMinX(5000);
            rectangle.setMinY(6000);
            rectangle.setMaxX(6000);
            rectangle.setMaxY(8000);
            shape.generateRectangle(rectangle);

            // set the cols in the row
            rowPoly.setInteger(0, new Integer(SHP3));
            rowPoly.setString(1, "Shape 3 (Rectangle)");
            rowPoly.setShape(2, shape);

            // Insert it
            insertPoly.execute();

            /*
             *   Insert shape 4 : rectangle
             */
            rectangle.setMinX(6000);
            rectangle.setMinY(8000);
            rectangle.setMaxX(10000);
            rectangle.setMaxY(10000);
            shape.generateRectangle(rectangle);

            // set the cols in the row
            rowPoly.setInteger(0, new Integer(SHP4));
            rowPoly.setString(1, "Shape 4 (Rectangle)");
            rowPoly.setShape(2, shape);

            // Insert it
            insertPoly.execute();

            /*
             *   Insert shape 5 : rectangle
             */
            rectangle.setMinX(6000);
            rectangle.setMinY(10000);
            rectangle.setMaxX(10000);
            rectangle.setMaxY(12000);
            shape.generateRectangle(rectangle);

            // set the cols in the row
            rowPoly.setInteger(0, new Integer(SHP5));
            rowPoly.setString(1, "Shape 5 (Rectangle)");
            rowPoly.setShape(2, shape);

            // Insert it
            insertPoly.execute();

            /*
             *   Insert shape 6 : square
             */
            rectangle.setMinX(10000);
            rectangle.setMinY(10000);
            rectangle.setMaxX(12000);
            rectangle.setMaxY(12000);
            shape.generateRectangle(rectangle);

            // set the cols in the row
            rowPoly.setInteger(0, new Integer(SHP6));
            rowPoly.setString(1, "Shape 6 (Square)");
            rowPoly.setShape(2, shape);

            // Insert it
            insertPoly.execute();

            /*
             *   Insert shape 7 : rectangle
             */
            rectangle.setMinX(10000);
            rectangle.setMinY(6000);
            rectangle.setMaxX(12000);
            rectangle.setMaxY(10000);
            shape.generateRectangle(rectangle);

            // set the cols in the row
            rowPoly.setInteger(0, new Integer(SHP7));
            rowPoly.setString(1, "Shape 7 (Rectangle)");
            rowPoly.setShape(2, shape);

            // Insert it
            insertPoly.execute();

            /*
             *   Insert shape 8: rectangle
             *   This shape will be used to test the
             *   SeShapeIdFilter.
             *   This shape is "invisible" to the
             *   shape retrieval routine since its
             *   shape number is zero.
             */
            rectangle.setMinX(2000);
            rectangle.setMinY(4000);
            rectangle.setMaxX(9000);
            rectangle.setMaxY(9000);
            shape.generateRectangle(rectangle);

            // set the cols in the row
            rowPoly.setInteger(0, new Integer(0));
            rowPoly.setString(1, "Shape X1 (Rectangle)");
            rowPoly.setShape(2, shape);

            // Insert it
            insertPoly.execute();

            insertPoly.close();

            insertLine = new SeInsert(conn);
            insertLine.intoTable(tableLine.getName(), columns);
            insertLine.setWriteMode(true);
            SeRow rowLine = insertLine.getRowToSet();

            /*
             *   Insert shape 1 : Simple Line
             */
            int numPts = 2;
            int numParts = 1;
            int[] partOffSets = new int[numParts];
            partOffSets[0] = 0;
            SDEPoint[] ptArray = new SDEPoint[numPts];
            ptArray[0] = new SDEPoint(5000, 4000);
            ptArray[1] = new SDEPoint(8000, 4000);

            SeShape line = new SeShape(coordref);
            line.generateSimpleLine(numPts, numParts, partOffSets, ptArray);

            // set the cols in the row
            rowLine.setInteger(0, new Integer(SHP8));
            rowLine.setString(1, "Shape 8 (Line)");
            rowLine.setShape(2, line);

            // Insert it
            insertLine.execute();

            /*
             *   Insert shape 2 : Simple Line
             */
            numPts = 2;
            numParts = 1;
            partOffSets = new int[numParts];
            partOffSets[0] = 0;
            ptArray = new SDEPoint[numPts];
            ptArray[0] = new SDEPoint(5000, 5000);
            ptArray[1] = new SDEPoint(8000, 5000);

            line.generateSimpleLine(numPts, numParts, partOffSets, ptArray);

            // set the cols in the row
            rowLine.setInteger(0, new Integer(SHP9));
            rowLine.setString(1, "Shape 9 (Line)");
            rowLine.setShape(2, line);

            // Insert it
            insertLine.execute();

            insertLine.close();

            insertPoint = new SeInsert(conn);
            insertPoint.intoTable(tablePoint.getName(), columns);
            insertPoint.setWriteMode(true);
            SeRow rowPoint = insertPoint.getRowToSet();

            /*
             *   Insert shape 1 : multi-part Point
             */
            numPts = 4;
            ptArray = new SDEPoint[numPts];
            ptArray[0] = new SDEPoint(3000, 7000);
            ptArray[1] = new SDEPoint(3000, 8000);
            ptArray[2] = new SDEPoint(4000, 8000);
            ptArray[3] = new SDEPoint(4000, 7000);

            SeShape point = new SeShape(coordref);
            point.generatePoint(numPts, ptArray);

            // set the cols in the row
            rowPoint.setInteger(0, new Integer(SHP10));
            rowPoint.setString(1, "Shape 10 (M-part point)");
            rowPoint.setShape(2, point);

            // Insert it
            insertPoint.execute();

            /*
             *   Insert shape 2 : single Point
             */
            numPts = 1;
            ptArray = new SDEPoint[numPts];
            ptArray[0] = new SDEPoint(7000, 7000);

            point.generatePoint(numPts, ptArray);

            // set the cols in the row
            rowPoint.setInteger(0, new Integer(SHP11));
            rowPoint.setString(1, "Shape 11 (Single point)");
            rowPoint.setShape(2, point);

            // Insert it
            insertPoint.execute();

            /*
             *   Insert shape 3: single Point
             *   This shape will be used to test the
             *   SeShapeIdFilter.
             *   This shape is "invisible" to the
             *   shape retrieval routine since its
             *   shape number is zero.
             */
            numPts = 1;
            ptArray = new SDEPoint[numPts];
            ptArray[0] = new SDEPoint(10000, 10000);

            point.generatePoint(numPts, ptArray);

            // set the cols in the row
            rowPoint.setInteger(0, new Integer(0));
            rowPoint.setString(1, "Shape X2 (Single point)");
            rowPoint.setShape(2, point);

            // Insert it
            insertPoint.execute();

            insertPoint.close();

        }
        catch (SeException se)
        {
            se.printStackTrace(System.out);
        }
        finally
        {
            try
            {
                insertPoly.close();
                insertPoint.close();
                insertLine.close();
            }
            catch (SeException e)
            {
                e.printStackTrace(System.out);
            }
        }

    } // End method createTestLayer

} // End Class SpatialQuery
