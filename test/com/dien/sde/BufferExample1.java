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
 * Purpose: Demonstrates using SeShape.generateBuffer() on a single polygon shape, multi-point shapes, single point shape, multi-polygon shapes.
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
import com.esri.sde.sdk.client.SeInsert;
import com.esri.sde.sdk.client.SeLayer;
import com.esri.sde.sdk.client.SeRegistration;
import com.esri.sde.sdk.client.SeRow;
import com.esri.sde.sdk.client.SeShape;
import com.esri.sde.sdk.client.SeTable;


public class BufferExample1
{
    private static SeConnection conn;

    public static void main(String[] args)
    {
        //**Warning: please modify appropriately to suit your application **
        String server = "", database = "none";
        String user = "", password = "";
        String instance = "";

        /*
         *   Process command line arguements
         */
        if (args.length == 5)
        {
            server = args[0];
            instance = args[1];
            database = args[2];
            user = args[3];
            password = args[4];

            System.out.print("???Args: ");
            for (int i = 0; i < args.length; i++)
            {
                System.out.print("\t" + args[i]);
            }
        }
        else
        {
            System.out.println("Invalid number of arguments!!");
            System.out.println("Usage: \n [server] [instance] [database] [user] [passwd]");
            System.exit(0);
        }

        try
        {
            System.out.println("\n\nConnecting to server ??" + server + ", instance ??" + instance);
            conn = new SeConnection(server, instance, database, user, password);
            System.out.println("Connection Successful! \n");
        }
        catch (SeException e)
        {
            e.printStackTrace();
            return;
        }

        System.out.println("\n Using SeShape.generateBuffer() method.");

        for (int i = 0; i < 20; i++)
        {
            System.out.print(" *");
        }

        pointBuffer();

        for (int i = 0; i < 20; i++)
        {
            System.out.print(" *");
        }

        multiPointBuffer();
    } //  End main

    static void pointBuffer()
    {

        System.out.println("\n Using SeShape.generateBuffer() on a single point shape.");
        try
        {
            // Test buffer creation on a point
            SeCoordinateReference cr = new SeCoordinateReference();
            cr.setXY( -10737418.225, -10737418.225, 100.0);

            SeShape shp = new SeShape(cr);

            int numPts = 1;
            SDEPoint[] ptArray = new SDEPoint[numPts];
            ptArray[0] = new SDEPoint(0.0, 0.0);
            shp.generatePoint(numPts, ptArray);

            System.out.println("\n Coordinate Reference used:");
            getCoordRefDetails(cr);

            System.out.println("\n Generating Buffer for a single point shape at" +
                    " coordinates (0,0) with the buffer distance ranging from 0 to 1000");

            for (int i = 0; i <= 1000; i += 100)
            {
                SeShape buffer = shp.generateBuffer(i, 5000);
                System.out.println(" Buffer distance: " + i + ". Buffer: " + buffer.toString());
                //Util.getAllCoords(buffer);
            }

            // Test Max valid distance
            double distance = 10737418.21;
            System.out.println("\n Generating buffer with maximum distance, "
                               + distance);
            SeShape buffer = shp.generateBuffer(distance, 5000);
            System.out.println(" Buffer distance: " + distance + ". Buffer: " +
                               buffer.toString());
            //Util.getAllCoords(buffer);

            // Test error when max valid distance is exceeded
            distance = 10737418.22;
            System.out.println(
                    "\n Generating buffer exceeding maximum distance, "
                    + distance);
            try
            {
                buffer = shp.generateBuffer(distance, 5000);
            }
            catch (SeException sexp)
            {
                if (sexp.getSeError().getSdeError() ==
                    SeError.SE_CORRIDOR_OUT_OF_BOUNDS)
                {
                    System.out.println(
                            " - Expected error, SE_CORRIDOR_OUT_OF_BOUNDS, occurred.");
                }
                else
                {
                    sexp.printStackTrace();
                }
            }

        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

    } //  End pointBuffer

    static void multiPointBuffer()
    {

        System.out.println(
                "\n Using SeShape.generateBuffer() on multi-point shapes.");
        try
        {
            SeLayer layer = createLayer("QA_MPOINT_BUFFER",
                                        SeLayer.SE_POINT_TYPE_MASK |
                                        SeLayer.SE_AREA_TYPE_MASK
                                        | SeLayer.SE_MULTIPART_TYPE_MASK);

            SeShape shp = new SeShape(layer.getCoordRef());

            int numPts = 3;
            SDEPoint[] ptArray = new SDEPoint[numPts];
            ptArray[0] = new SDEPoint(-100.0, 0.0);
            ptArray[1] = new SDEPoint(0.0, 0.0);
            ptArray[2] = new SDEPoint(100.0, 0.0);

            shp.generatePoint(numPts, ptArray);

            System.out.println(
                    "\n Generating Buffer for multi-point shape with" +
                    " coordinates (-100,0), (0,0), (100,0) with the buffer distance " +
                    "ranging from 0 to 1000");

            for (int i = 0; i <= 100; i += 10)
            {
                SeShape buffer = shp.generateBuffer(i, 5000);
                insertShape(buffer, layer.getName());
                System.out.println(" Buffer distance: " + i + ". Buffer: " +
                                   buffer.toString());
                //Util.getAllCoords(buffer);
            }

            // Test Max valid distance
            double distance = 10737200.21;
            System.out.println("\n Generating buffer with maximum distance, "
                               + distance);
            SeShape buffer = shp.generateBuffer(distance, 5000);
            System.out.println(" Buffer distance: " + distance + ". Buffer: " +
                               buffer.toString());
            //Util.getAllCoords(buffer);

            // Test error when max valid distance is exceeded
            distance = 10737318.22;
            System.out.println(
                    "\n Generating buffer exceeding maximum distance, "
                    + distance);
            try
            {
                buffer = shp.generateBuffer(distance, 5000);
            }
            catch (SeException sexp)
            {
                if (sexp.getSeError().getSdeError() ==
                    SeError.SE_CORRIDOR_OUT_OF_BOUNDS)
                {
                    System.out.println(
                            " - Expected error, SE_CORRIDOR_OUT_OF_BOUNDS, occurred.");
                }
                else
                {
                    sexp.printStackTrace();
                }
            }

        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

    } //  End multiPointBuffer

    static void simplePolyBuffer()
    {

        System.out.println(
                "\n Using SeShape.generateBuffer() on a single polygon shape.");
        try
        {
            // Test buffer creation on a point
            SeLayer layer = createLayer("QA_POLY_BUFFER_JAPI",
                                        SeLayer.SE_AREA_TYPE_MASK);

            SeShape shp = new SeShape(layer.getCoordRef());

            //SeCoordinateReference cr = new SeCoordinateReference();
            //cr.setXY(-10737418.225, -10737418.225, 100.0);
            //SeShape shp = new SeShape(cr);

            int numPts = 5;
            SDEPoint[] ptArray = new SDEPoint[numPts];
            int numParts = 1;
            int[] partOffsets = new int[numParts];
            partOffsets[0] = 0;

            ptArray[0] = new SDEPoint( -100.0, -100.0);
            ptArray[1] = new SDEPoint(100.0, -100.0);
            ptArray[2] = new SDEPoint(100.0, 100.0);
            ptArray[3] = new SDEPoint( -100.0, 100.0);
            ptArray[4] = new SDEPoint( -100.0, -100.0);

            shp.generatePolygon(numPts, numParts, partOffsets, ptArray);

            System.out.println("\n Coordinate Reference used:");
            getCoordRefDetails(layer.getCoordRef());

            System.out.println("\n Generating Buffer for a polygon shape with " +
                               " coordinates (-100,-100),(100,-100),(100,100),(-100,100) with the buffer " +
                               "distance ranging from 0 to 1000");

            //Util.getAllCoords(shp);
            for (int i = 0; i <= 700; i += 100)
            {
                SeShape buffer = shp.generateBuffer(i, 5000);
                insertShape(buffer, layer.getName());
                System.out.println(" Buffer distance: " + i + ". Buffer: " +
                                   buffer.toString());
                //Util.getAllCoords(buffer);
            }

            // Test Max valid distance
            double distance = 10737318.21;
            System.out.println("\n Generating buffer with maximum distance, "
                               + distance);
            SeShape buffer = shp.generateBuffer(distance, 5000);
            System.out.println(" Buffer distance: " + distance + ". Buffer: " +
                               buffer.toString());
            insertShape(buffer, layer.getName());
            //Util.getAllCoords(buffer);


            // Test error when max valid distance is exceeded
            distance = 10737318.22;
            System.out.println("\n Generating buffer exceeding maximum distance, " + distance);
            try
            {
                buffer = shp.generateBuffer(distance, 5000);
            }
            catch (SeException sexp)
            {
                if (sexp.getSeError().getSdeError() ==
                    SeError.SE_CORRIDOR_OUT_OF_BOUNDS)
                {
                    System.out.println(
                            " - Expected error, SE_CORRIDOR_OUT_OF_BOUNDS, occurred.");
                }
                else
                {
                    sexp.printStackTrace();
                }
            }

            // Resultant Buffer has a donut hole.

            numPts = 9;
            ptArray = new SDEPoint[numPts];
            numParts = 1;
            partOffsets = new int[numParts];
            partOffsets[0] = 0;

            ptArray[0] = new SDEPoint( -100.0, -100.0);
            ptArray[1] = new SDEPoint(100.0, -100.0);
            ptArray[2] = new SDEPoint(100.0, -90.0);
            ptArray[3] = new SDEPoint(40.0, -90.0);
            ptArray[4] = new SDEPoint(70.0, 90.0);
            ptArray[5] = new SDEPoint(100.0, -80.0);
            ptArray[6] = new SDEPoint(100.0, 100.0);
            ptArray[7] = new SDEPoint( -100.0, 100.0);
            ptArray[8] = new SDEPoint( -100.0, -100.0);

            shp.generatePolygon(numPts, numParts, partOffsets, ptArray);
            for (int i = 0; i <= 50; i += 20)
            {
                buffer = shp.generateBuffer(i, 5000);
                insertShape(buffer, layer.getName());
                System.out.println(" Buffer distance: " + i + ". Buffer: " + buffer.toString());
            }

            // Buffers on Triangular polygons
            numPts = 4;
            ptArray = new SDEPoint[numPts];
            numParts = 1;
            partOffsets = new int[numParts];
            partOffsets[0] = 0;

            ptArray[0] = new SDEPoint( -100.0, -100.0);
            ptArray[1] = new SDEPoint(100.0, -100.0);
            ptArray[2] = new SDEPoint(0.0, 100.0);
            ptArray[3] = new SDEPoint( -100.0, -100.0);

            shp.generatePolygon(numPts, numParts, partOffsets, ptArray);
            for (int i = 0; i <= 60; i += 20)
            {
                buffer = shp.generateBuffer(i, 5000);
                insertShape(buffer, layer.getName());
                System.out.println(" Buffer distance: " + i + ". Buffer: " + buffer.toString());
            }

            // Buffers on Pentagons
            numPts = 6;
            ptArray = new SDEPoint[numPts];
            numParts = 1;
            partOffsets = new int[numParts];
            partOffsets[0] = 0;

            ptArray[0] = new SDEPoint( -50.0, -100.0);
            ptArray[1] = new SDEPoint(50.0, -100.0);
            ptArray[2] = new SDEPoint(100.0, 0.0);
            ptArray[3] = new SDEPoint(0.0, 100.0);
            ptArray[4] = new SDEPoint( -100.0, 0.0);
            ptArray[5] = new SDEPoint( -50.0, -100.0);

            shp.generatePolygon(numPts, numParts, partOffsets, ptArray);
            for (int i = 0; i <= 100; i += 20)
            {
                buffer = shp.generateBuffer(i, 5000);
                insertShape(buffer, layer.getName());
                System.out.println(" Buffer distance: " + i + ". Buffer: " + buffer.toString());
            }

            // Buffers on Hexagons
            numPts = 7;
            ptArray = new SDEPoint[numPts];
            numParts = 1;
            partOffsets = new int[numParts];
            partOffsets[0] = 0;

            ptArray[0] = new SDEPoint( -100.0, -50.0);
            ptArray[1] = new SDEPoint(0.0, -100.0);
            ptArray[2] = new SDEPoint(100.0, -50.0);
            ptArray[3] = new SDEPoint(100.0, 50.0);
            ptArray[4] = new SDEPoint(0.0, 100.0);
            ptArray[5] = new SDEPoint( -100.0, 50.0);
            ptArray[6] = new SDEPoint( -100.0, -50.0);

            shp.generatePolygon(numPts, numParts, partOffsets, ptArray);
            for (int i = 0; i <= 100; i += 20)
            {
                buffer = shp.generateBuffer(i, 5000);
                insertShape(buffer, layer.getName());
                System.out.println(" Buffer distance: " + i + ". Buffer: " + buffer.toString());
            }

            //
            numPts = 7;
            ptArray = new SDEPoint[numPts];
            numParts = 1;
            partOffsets = new int[numParts];
            partOffsets[0] = 0;

            ptArray[0] = new SDEPoint(49.0, 421.0);
            ptArray[1] = new SDEPoint(47.0, 403.0);
            ptArray[2] = new SDEPoint(82.0, 399.0);
            ptArray[3] = new SDEPoint(85.0, 417.0);
            ptArray[4] = new SDEPoint(87.0, 435.0);
            ptArray[5] = new SDEPoint(51.0, 439.0);
            ptArray[6] = new SDEPoint(49.0, 421.0);

            shp.generatePolygon(numPts, numParts, partOffsets, ptArray);
            //Util.getAllCoords(shp);

            for (int i = 10; i <= 100; i += 20)
            {
                buffer = shp.generateBuffer(i, 5000);
                insertShape(buffer, layer.getName());
                System.out.println(" Buffer distance: " + i + ". Buffer: " + buffer.toString());
            }

        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

    } //  End simplePolyBuffer

    static void multiPolyBuffer()
    {

        System.out.println(
                "\n Using SeShape.generateBuffer() on multi-point shapes.");
        try
        {
            SeLayer layer = createLayer("QA_MPOLY_BUFFER_JAPI",
                                        SeLayer.SE_AREA_TYPE_MASK
                                        | SeLayer.SE_MULTIPART_TYPE_MASK);

            SeShape shp = new SeShape(layer.getCoordRef());

            int numPts = 3;
            SDEPoint[] ptArray = new SDEPoint[numPts];
            int numParts = 1;
            int[] partOffsets = new int[numParts];
            partOffsets[0] = 0;

            ptArray[0] = new SDEPoint( -100.0, -100.0);
            ptArray[1] = new SDEPoint(100.0, -100.0);
            ptArray[2] = new SDEPoint(100.0, 100.0);
            ptArray[3] = new SDEPoint( -100.0, 100.0);
            ptArray[4] = new SDEPoint( -100.0, -100.0);

            shp.generatePolygon(numPts, numParts, partOffsets, ptArray);

            System.out.println("\n Generating Buffer for multi-part shape with" +
                               " coordinates  with the buffer distance " +
                               "ranging from 0 to 1000");

            for (int i = 0; i <= 100; i += 10)
            {
                SeShape buffer = shp.generateBuffer(i, 5000);
                insertShape(buffer, layer.getName());
                System.out.println(" Buffer distance: " + i + ". Buffer: " +
                                   buffer.toString());
                //Util.getAllCoords(buffer);
            }

            // Test Max valid distance
            double distance = 10737200.21;
            System.out.println("\n Generating buffer with maximum distance, "
                               + distance);
            SeShape buffer = shp.generateBuffer(distance, 5000);
            System.out.println(" Buffer distance: " + distance + ". Buffer: " +
                               buffer.toString());
            //Util.getAllCoords(buffer);

            // Test error when max valid distance is exceeded
            distance = 10737318.22;
            System.out.println(
                    "\n Generating buffer exceeding maximum distance, "
                    + distance);
            try
            {
                buffer = shp.generateBuffer(distance, 5000);
            }
            catch (SeException sexp)
            {
                if (sexp.getSeError().getSdeError() ==
                    SeError.SE_CORRIDOR_OUT_OF_BOUNDS)
                {
                    System.out.println(
                            " - Expected error, SE_CORRIDOR_OUT_OF_BOUNDS, occurred.");
                }
                else
                {
                    sexp.printStackTrace();
                }
            }

            /*
                         multi-point shapes
                         ==================
                         1. Buffer distance
             a. Buffer of each point shape does not touch. done
             b. Buffer around each point shape touches. done
             c. Buffer around each point shape overlaps. done

                         2. Point location in coordinate space.
             a. Point on edge of envelope
             b. Points near edge of envelope. done

             3. Number of points. how many points? 1000 or more? performance?
             */


        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

    } //  End multiPolyBuffer

    /**
     *  Displays the properties of an SeCoordinateReference object.
     *  @param cRef a SeCoordinateReference object.
     */
    public static void getCoordRefDetails(SeCoordinateReference cRef) throws SeException
    {

        System.out.println("Description of coord system " + cRef.getCoordSysDescription());

        System.out.println("moffset : " + cRef.getFalseM() + "\t Scale factor : " + cRef.getMUnits());

        System.out.println("Measure Values --> Min: " + cRef.getMinMValue() + "\t Max: " + cRef.getMaxMValue());

        System.out.println("Projection Desc: " + cRef.getProjectionDescription());

        System.out.println("Spatial Reference Id " + cRef.getSrid().longValue());

        System.out.println("False x,y offset X: " + cRef.getFalseX() + " Y: " +
                           cRef.getFalseY() + "  Scale factor:" +
                           cRef.getXYUnits());

        System.out.println("z-offset : " + cRef.getFalseZ() +
                           "   Scale factor : " +
                           cRef.getZUnits());

        System.out.println("Z Values --> Min: " + cRef.getMinZValue() +
                           "\t Max: " +
                           cRef.getMaxZValue());

        SeExtent ext = cRef.getXYEnvelope();

        System.out.println("Coord Ref Envelope: MinX = " + ext.getMinX() +
                           " MinY = " + ext.getMinY() + " MaxX = " +
                           ext.getMaxX() +
                           " MaxY = " + ext.getMaxY() + " MinZ = " +
                           ext.getMinZ() +
                           " MaxZ = " + ext.getMaxZ());

    } // End method getCoordRefDetails

    public static SeLayer createLayer(String layerName, int shapeTypes) throws SeException
    {

        SeTable table = new SeTable(conn, layerName);

        /*
         *   Delete table if it already exists
         */
        try
        {
            table.delete();
        }
        catch (SeException e)
        {
            /*
             *   If the table doesn't exist don't worry. Otherwise print
             *   the stack trace.
             */
            if (SeError.SE_TABLE_NOEXIST != e.getSeError().getSdeError())
            {
                e.printStackTrace();
            }
        }

        boolean isNullable = true;
        int size = 0;
        int scale = 0;

        /*
         *   Define columns for the tables..
         */
        SeColumnDefinition[] colDefs = new SeColumnDefinition[1];

        colDefs[0] = new SeColumnDefinition("DESCRIPTION",
                                            SeColumnDefinition.TYPE_STRING,
                                            size,
                                            scale, isNullable);
        table.create(colDefs, "DEFAULTS");

        SeRegistration registration = new SeRegistration(conn, layerName);

        /*
         *   Update the table's registration to give it an ArcSDE maintained
         *   row id.
         */
        registration.setRowIdColumnName("OBJECTID");
        registration.setRowIdColumnType(SeRegistration.
                                        SE_REGISTRATION_ROW_ID_COLUMN_TYPE_SDE);

        registration.alter();
        SeLayer layer = new SeLayer(conn);

        SeCoordinateReference cr = new SeCoordinateReference();
        cr.setXY( -10737418.225, -10737418.225, 100.0);

        layer.setCoordRef(cr);

        layer.setTableName(layerName);

        layer.setSpatialColumnName("SHAPE");

        layer.setShapeTypes(shapeTypes);

        //SeExtent ext = ext = new SeExtent(-10737418.225,-10737418.225,10737418.225,10737418.225);
        //layer.setExtent(ext);

        layer.setGridSizes(1000.0, 0.0, 0.0);

        layer.setCreationKeyword("DEFAULTS");

        layer.create(10, 3);

        return layer;
    } //  End createLayer

    public static void insertShape(SeShape shape, String tableName) throws SeException
    {

        SeInsert insert = new SeInsert(conn);
        String[] cols =
                        {
                        "SHAPE"};
        insert.intoTable(tableName, cols);
        insert.setWriteMode(true);
        SeRow row = insert.getRowToSet();
        row.setShape(0, shape);

        insert.execute();
        insert.close();

    } //  End insertShape
}
