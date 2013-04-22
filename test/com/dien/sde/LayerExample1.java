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
 *   Demonstrates
 * 1. Creation of a new ArcSDE Layer.
 * 2. Inserting, deleting & modifying data.
 *
 * ------------------------------------------------------------------------------
 * Program Overview:
 *
 *   1. Create an ArcSDE table, "EXAMPLE", and add a spatial column to it.
 *
 *   2. Execute a fetch query on the ArcSDE database and retrieve all the
 *      rows of the layer.
 *
 *   3. Delete a specific row in the table through a where clause constraint.
 *
 *   4. Update a specific row in the table using the feature id value.
 *
 *   5. Update a specific row in the table using a where clause constraint.
 *
 *   6. Execute a fetch query on the ArcSDE database and retrieve all the
 *      rows of the layer.
 *
 *   7. Delete the ArcSDE table and the associated spatial column.
 *
 * ------------------------------------------------------------------------------ *
 * This Java sample demonstrates usage of ArcSDE API. It will not execute successfully until the user
 * supplies valid ArcSDE Server details such as server name, port number, database name, user, pwd, and valid
 * data, if required.
 **************************************************************************/

package com.dien.sde;

import java.util.Calendar;

import com.esri.sde.sdk.client.SDEPoint;
import com.esri.sde.sdk.client.SeColumnDefinition;
import com.esri.sde.sdk.client.SeConnection;
import com.esri.sde.sdk.client.SeCoordinateReference;
import com.esri.sde.sdk.client.SeDelete;
import com.esri.sde.sdk.client.SeError;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeExtent;
import com.esri.sde.sdk.client.SeInsert;
import com.esri.sde.sdk.client.SeLayer;
import com.esri.sde.sdk.client.SeObjectId;
import com.esri.sde.sdk.client.SeQuery;
import com.esri.sde.sdk.client.SeRow;
import com.esri.sde.sdk.client.SeShape;
import com.esri.sde.sdk.client.SeSqlConstruct;
import com.esri.sde.sdk.client.SeTable;
import com.esri.sde.sdk.client.SeUpdate;


public class LayerExample1
{

    /*
     *   Stores the attributes of all the columns of the table created in this test.
     */
    private static SeColumnDefinition colDefs[] = new SeColumnDefinition[6];
    /*
     *   Handle to the ArcSDE connection established.
     */
    private static SeConnection conn = null;


    /*
     *   Main Function
     *   - Expects either 4 or 5 command line arguements.
     * Command line Arguments:
     *   1. Server Name   (String)
     *   2. Instance      (Integer)
     *   3. Database Name (String)  <- Optional
     *   4. User Name     (String)
     *   5. Password      (String)
     *
     *   - Establishes a connection to an ArcSDE Server
     *
     *   - Invokes methods to
     *     ~ Create a layer.
     *     ~ Perform data insert/update/delete/retrieve operations.
     */
    public static void main(String[] args)
    {

        String server = null, database = "none", user = null, password = null;
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
        }
        else if (args.length == 4)
        {

            server = args[0];
            instance = args[1];
            user = args[2];
            password = args[3];
        }
        else
        {
            System.out.println("Invalid number of arguements!!");
            System.out.println("Usage: \n LayerExample1 <server> <instance> [database] <user> <passwd> ");
            System.exit(0);
        }

        try
        {
            /*
             *   Connect to the ArcSDE server using the command line arguments.
             */
            System.out.println("Connecting to the ArcSDE Server...");
            conn = new SeConnection(server, instance, database, user, password);
            System.out.println("Connection Successful! \n");

            /*
             *   Create a new table with a spatial column.
             */
            SeLayer layer = createBaseTable();
            

            /*
             *   Insert data into the layer.
             */
            System.out.println("\n-> Inserting Data into the layer...\n");
            insertData(layer);

            /*
             *   Retrieve data from the layer.
             */
            retrieveData(layer);

            /*
             *   Delete data using a where clause:
             *   where clause : Integer_Val == 8
             */
            SeDelete delete = new SeDelete(conn);
            System.out.println("\n\n--> Deleting rows where Integer_Val = 8");
            delete.fromTable(layer.getQualifiedName(), "INTEGER_VAL = 8");

            /*
             *   Update feature no 2 in the layer.
             */
            updateSingleRow(layer);

            /*
             *   Make changes to data in the table.
             */
            updateData(layer);

            /*
             *   Retrieve data from the layer - confirm changes.
             */
            retrieveData(layer);
  

            // Delete the base table.
            System.out.println(
                    "\nDeleting table and associated spatial column...");
            SeTable table = new SeTable(conn, layer.getQualifiedName());
            table.delete();
            System.out.println(" - Done.");

            System.out.println("Disconnecting from server... \n");
            conn.close();
            /*
             *   Handle exceptions if any of the statements in main failed to execute
             *   successfully.
             */
        }
        catch (SeException e)
        {

            SeError error = e.getSeError();

            // Display the description of the error that occured.
            System.out.println(error.getErrDesc());

            // Display the database level error if any occured.
            System.out.println(error.getSdeError());
        }

    } // End main


    /*
     *   Creates an ArcSDE table, "EXAMPLE", and adds a spatial column, "SHAPE", to it.
     */
    public static SeLayer createBaseTable()
    {

        SeLayer layer = new SeLayer(conn);
        SeTable table = null;
        try
        {
            /*
             *   Create a qualified table name with current user's name and
             *   the name of the table to be created, "EXAMPLE".
             */
            String tableName = (conn.getUser() + "2.EXAMPLE");
            table = new SeTable(conn, tableName);

            /*
             *   Define the columns and their attributes for the table to be created.
             *   NOTE: The valid range/values of size and scale parameters vary from
             *   one database to another.
             */
            boolean isNullable = true;
            colDefs[0] = new SeColumnDefinition("Integer_Val",
                                                SeColumnDefinition.TYPE_INT32,
                                                10, 0, isNullable);
            colDefs[1] = new SeColumnDefinition("Short_Val",
                                                SeColumnDefinition.TYPE_INT16,
                                                4, 0, isNullable);
            colDefs[2] = new SeColumnDefinition("Float_Val",
                                                SeColumnDefinition.TYPE_FLOAT32,
                                                5, 2, isNullable);
            colDefs[3] = new SeColumnDefinition("Double_Val",
                                                SeColumnDefinition.TYPE_FLOAT64,
                                                15, 4, isNullable);
            colDefs[4] = new SeColumnDefinition("String_Val",
                                                SeColumnDefinition.TYPE_STRING,
                                                25, 0, isNullable);
            colDefs[5] = new SeColumnDefinition("Date_Val",
                                                SeColumnDefinition.TYPE_DATE, 1,
                                                0, isNullable);

            /*
             *   Create the table using the DBMS default configuration keyword.
             *   Valid config keywords are found in the $SDEHOME\etc\dbtune.sde file.
             */
            System.out.println( "\n--> Creating a table using DBMS Default Keyword");
            table.create(colDefs, "DEFAULTS");
            System.out.println(" - Done.");

            /*
             *   Define the attributes of the spatial column
             */
            layer.setSpatialColumnName("SHAPE");
            layer.setTableName("EXAMPLE");

            /*
             *   Set the type of shapes that can be inserted into the layer. Shape type can be just one
             *   or many.
             *   NOTE: Layers that contain more than one shape type can only be accessed through
             *   the C and Java APIs and Arc Explorer Java 3.x. They cannot be seen from ArcGIS
             *   desktop applications.
             */
            layer.setShapeTypes(SeLayer.SE_NIL_TYPE_MASK |
                                SeLayer.SE_POINT_TYPE_MASK |
                                SeLayer.SE_LINE_TYPE_MASK |
                                SeLayer.SE_SIMPLE_LINE_TYPE_MASK |
                                SeLayer.SE_AREA_TYPE_MASK |
                                SeLayer.SE_MULTIPART_TYPE_MASK);
            layer.setGridSizes(1100.0, 0.0, 0.0);
            layer.setDescription("Layer Example");
            SeExtent ext = new SeExtent(0.0, 0.0, 10000.0, 10000.0);
            layer.setExtent(ext);

            /*
             *   Define the layer's Coordinate Reference
             */
            SeCoordinateReference coordref = new SeCoordinateReference();
            coordref.setXY(0, 0, 100);
            layer.setCoordRef(coordref);

            /*
             *   Spatially enable the new table...
             */
            System.out.println("\n--> Adding spatial column \"SHAPE\"...");
            layer.create(3, 4);
            System.out.println(" - Done.");

        }
        catch (SeException e)
        {
            System.out.println(e.getSeError().getErrDesc());
        }

        return layer;

    } // End method createBaseTable


    /*
     *   Inserts 8 rows of data into the layer
     *
     *   Columns Inserted
     *   1. Integer  - values: 1 -> 8
     *   2. Short    - values: 1, 2 or 3
     *   3. Float    - values: Random values
     *   4. Double   - values: Random values
     *   5. String   - values: Describes the Shape Type
     *   6. Date     - values: Jan 1 2001 -> Jan 8 2001
     *   7. Shape    - 2 Rectangles, 1 point shape, 1 multi-point shape,
     *   1 simple line, 1 line, 1 single part polygon, 1 multipart polygon.
     */
    public static void insertData(SeLayer layer)
    {

        /*
         *   Define the names of the columns that data is to be inserted into.
         */
        String columns[] = new String[7];

        columns[0] = new String(colDefs[0].getName()); // Integer column
        columns[1] = new String(colDefs[1].getName()); // Short column
        columns[2] = new String(colDefs[2].getName()); // Float column
        columns[3] = new String(colDefs[3].getName()); // Double column
        columns[4] = new String(colDefs[4].getName()); // String column
        columns[5] = new String(colDefs[5].getName()); // Date column
        columns[6] = new String("SHAPE"); // Shape column

        SeInsert insert = null;
        try
        {
            insert = new SeInsert(conn);
            insert.intoTable(layer.getName(), columns);
            insert.setWriteMode(true);
            SeRow row = insert.getRowToSet();

            SeCoordinateReference coordref = layer.getCoordRef();
            SeShape shape = new SeShape(coordref);
            Calendar cal = Calendar.getInstance();
            cal.set(2001, 00, 01, 0, 0, 0);

            /*
             *   Insert 2 Rectangles into the layer
             */
            int numRectangles = 2;
            SeExtent rectangle = new SeExtent();
            int rowId = 1;
            for (rowId = 1; rowId <= numRectangles; rowId++)
            {

                rectangle.setMinX(2000 + rowId * 500);
                rectangle.setMinY(2000 + rowId * 500);
                rectangle.setMaxX(4000 + rowId * 500);
                rectangle.setMaxY(4000 + rowId * 500);
                shape.generateRectangle(rectangle);

                // set the values in the row
                row.setInteger(0, new Integer(rowId));
                row.setShort(1, new Short((short) (rowId % 3 + 1)));
                row.setFloat(2, new Float( -1000.2 + rowId));
                row.setDouble(3, new Double(0.02 + rowId / 1000.0));
                row.setString(4, "RECTANGLE");
                row.setTime(5, cal);
                row.setShape(6, shape);

                // Insert row
                insert.execute();
                System.out.println("\tinserted row " + rowId);
            } // End for

            /*
             *   Insert a simple line
             */
            int points = 2;
            int numParts = 1;
            int partOffSets[] = new int[numParts];
            partOffSets[0] = 0;
            SDEPoint[] ptArray = new SDEPoint[points];
            for (int i = 0; i < points; i++)
            {
                ptArray[i] = new SDEPoint(5000.0 + (i * 10), 5000.0 + (i * 100));
            }

            SeShape line1 = new SeShape(coordref);
            line1.generateSimpleLine(points, numParts, partOffSets, ptArray);

            // set the col values
            row.setInteger(0, new Integer(rowId));
            row.setShort(1, new Short((short) (rowId % 3 + 1)));
            row.setFloat(2, new Float(10.45));
            row.setDouble(3, new Double( -120.0232));
            row.setString(4, "SIMPLE LINE");
            row.setTime(5, cal);
            cal.roll(Calendar.DATE, true);
            row.setShape(6, line1);

            // insert row
            insert.execute();
            System.out.println("\tinserted row " + rowId);

            /*
             *   Insert a multipart line
             */

            numParts = 3;
            int[] partOffsets = new int[numParts];
            partOffsets[0] = 0;
            partOffsets[1] = 3;
            partOffsets[2] = 7;
            int numPts = 12;
            ptArray = new SDEPoint[numPts];
            // line 1
            ptArray[0] = new SDEPoint(100, 100);
            ptArray[1] = new SDEPoint(200, 200);
            ptArray[2] = new SDEPoint(300, 100);
            // line 2 - Self intersecting line
            ptArray[3] = new SDEPoint(200, 300);
            ptArray[4] = new SDEPoint(300, 400);
            ptArray[5] = new SDEPoint(300, 300);
            ptArray[6] = new SDEPoint(200, 400);
            // line 3
            ptArray[7] = new SDEPoint(100, 700);
            ptArray[8] = new SDEPoint(300, 500);
            ptArray[9] = new SDEPoint(500, 500);
            ptArray[10] = new SDEPoint(600, 600);
            ptArray[11] = new SDEPoint(700, 800);

            SeShape multiLine = new SeShape(coordref);
            multiLine.generateLine(numPts, numParts, partOffsets, ptArray);

            rowId++;
            // set the col values
            row.setInteger(0, new Integer(rowId));
            row.setShort(1, new Short((short) (rowId % 3 + 1)));
            row.setFloat(2, new Float(40.05));
            row.setDouble(3, new Double( -120.000232));
            row.setString(4, "MULTI-PART LINE");
            row.setTime(5, cal);
            cal.roll(Calendar.DATE, true);
            row.setShape(6, multiLine);

            // insert row
            insert.execute();
            System.out.println("\tinserted row " + rowId);

            /*
             *   Insert simple area shape
             */

            numParts = 1;
            partOffsets = new int[numParts];
            partOffsets[0] = 0;
            numPts = 5;
            ptArray = new SDEPoint[numPts];
            ptArray[0] = new SDEPoint(100, 100);
            ptArray[1] = new SDEPoint(1200, 100);
            ptArray[2] = new SDEPoint(1200, 200);
            ptArray[3] = new SDEPoint(100, 200);
            ptArray[4] = new SDEPoint(100, 100);

            SeShape polygon = new SeShape(coordref);
            polygon.generatePolygon(numPts, numParts, partOffsets, ptArray);

            rowId++;
            // set the col values
            row.setInteger(0, new Integer(rowId));
            row.setShort(1, new Short((short) (rowId % 3 + 1)));
            row.setFloat(2, new Float(1.456));
            row.setDouble(3, new Double(30.177));
            row.setString(4, "SINGLE PART POLYGON");
            row.setTime(5, cal);
            cal.roll(Calendar.DATE, true);
            row.setShape(6, polygon);

            // insert row
            insert.execute();
            System.out.println("\tinserted row " + rowId);

            /*
             *   Insert single point shape
             */

            SeShape point = null;
            point = new SeShape(coordref);
            numPts = 1;
            ptArray = new SDEPoint[numPts];
            ptArray[0] = new SDEPoint(8000, 8000);
            point.generatePoint(numPts, ptArray);

            rowId++;
            // set the col values
            row.setInteger(0, new Integer(rowId));
            row.setShort(1, new Short((short) (rowId % 3 + 1)));
            row.setFloat(2, new Float(0.78782));
            row.setDouble(3, new Double(4332.3414233));
            row.setString(4, "SINGLE POINT SHAPE");
            row.setTime(5, cal);
            cal.roll(Calendar.DATE, true);
            row.setShape(6, point);

            // insert row
            insert.execute();
            System.out.println("\tinserted row " + rowId);

            /*
             *   Insert a multi part point
             */

            numPts = 4;
            ptArray = new SDEPoint[numPts];
            ptArray[0] = new SDEPoint(3000, 100);
            ptArray[1] = new SDEPoint(3000, 300);
            ptArray[2] = new SDEPoint(4000, 300);
            ptArray[3] = new SDEPoint(4000, 100);

            point.generatePoint(numPts, ptArray);

            rowId++;
            // set the col values
            row.setInteger(0, new Integer(rowId));
            row.setShort(1, new Short((short) (rowId % 3 + 1)));
            row.setFloat(2, new Float(0.786456));
            row.setDouble(3, new Double(42342.177));
            row.setString(4, "MULTI POINT SHAPE");
            row.setTime(5, cal);
            cal.roll(Calendar.DATE, true);
            row.setShape(6, point);

            // insert row
            insert.execute();
            System.out.println("\tinserted row " + rowId);

            /*
             *   Generate complex area shape
             */

            numParts = 2;
            partOffsets = new int[numParts];
            partOffsets[0] = 0;
            partOffsets[1] = 14;
            numPts = 18;
            ptArray = new SDEPoint[numPts];
            // part one
            ptArray[0] = new SDEPoint(100, 1100);
            ptArray[1] = new SDEPoint(1500, 1100);
            ptArray[2] = new SDEPoint(1500, 1900);
            ptArray[3] = new SDEPoint(100, 1900);
            ptArray[4] = new SDEPoint(100, 1100);
            // Hole - sub part of part one
            ptArray[5] = new SDEPoint(200, 1200);
            ptArray[6] = new SDEPoint(200, 1500);
            ptArray[7] = new SDEPoint(500, 1500);
            ptArray[8] = new SDEPoint(500, 1700);
            ptArray[9] = new SDEPoint(800, 1700);
            ptArray[10] = new SDEPoint(800, 1500);
            ptArray[11] = new SDEPoint(500, 1500);
            ptArray[12] = new SDEPoint(500, 1200);
            ptArray[13] = new SDEPoint(200, 1200);
            // part two
            ptArray[14] = new SDEPoint(1600, 1200);
            ptArray[15] = new SDEPoint(2800, 1650);
            ptArray[16] = new SDEPoint(1800, 2000);
            ptArray[17] = new SDEPoint(1600, 1200);

            polygon.generatePolygon(numPts, numParts, partOffsets, ptArray);

            rowId++;
            // set the col values
            row.setInteger(0, new Integer(rowId));
            row.setShort(1, new Short((short) (rowId % 3 + 1)));
            row.setFloat(2, new Float(230.7862));
            row.setDouble(3, new Double(4234.33177));
            row.setString(4, "MULTI PART POLYGON");
            row.setTime(5, cal);
            cal.roll(Calendar.DATE, true);
            row.setShape(6, polygon);

            // insert row
            insert.execute();
            System.out.println("\tinserted row " + rowId);

            insert.close();
        }
        catch (SeException e)
        {
            /*
             *   Making sure the insert stream was closed. If the stream isn't closed,
             *   the resources used by the stream will be held/locked by the stream
             *   until the associated connection is closed.
             */
            try
            {
                insert.close();
            }
            catch (SeException se)
            {
                System.out.println(se.getSeError().getErrDesc());
            }

            System.out.println(e.getSeError().getSdeError());
            System.out.println(e.getSeError().getExtError());
        }

    } // End method insertData


    /*
     *   Retrieves the rows from a specified table/layer.
     *   Data from all the table's columns are retrieved.
     */
    public static void retrieveData(SeLayer layer)
    {

        System.out.println("\n--> Retrieving Layer Data...");
        try
        {
            String tableName = layer.getName();
            SeSqlConstruct sqlConstruct = new SeSqlConstruct(tableName);
            SeTable table1 = new SeTable(conn, tableName);
            /*
             *   Get the table's column definition.
             */
            SeColumnDefinition[] tableDef = table1.describe();
            String[] cols = new String[tableDef.length];

            /*
             *   Store the names of all the table's columns in the
             *   String array cols. This array specifies the columns
             *   to be retrieved from the database.
             */
            for (int i = 0; i < cols.length; i++)
            {
                cols[i] = tableDef[i].getName();
            }

            /*
             *   Define ArcSDE server query.
             */
            SeQuery query = new SeQuery(conn, cols, sqlConstruct);
            query.prepareQuery();
            query.execute();

            SeRow row = null;
            SeColumnDefinition colDef = new SeColumnDefinition();
            /*
             *   Fetch the first row that matches the query.
             */
            row = query.fetch();

            if (row == null)
            {

                System.out.println(" No rows fetched");
                return;
            }

            int max = row.getNumColumns();
            int rowNo = 1;

            while (row != null)
            {

                System.out.println("\n\nContents of Row " + rowNo++);
                for (int i = 0; i < max; i++)
                {

                    colDef = row.getColumnDef(i);
                    int type = colDef.getType();
                    // don't try to retrieve the value if the indicator is NULL
                    if (row.getIndicator((short) i) != SeRow.SE_IS_NULL_VALUE)
                    {

                        switch (type)
                        {

                        case SeColumnDefinition.TYPE_INT16:
                            System.out.println("\t" + colDef.getName() + " : " +
                                               row.getShort(i));
                            break;

                        case SeColumnDefinition.TYPE_DATE:
                            System.out.println("\t" + colDef.getName() + " : " +
                                               row.getTime(i));
                            break;

                        case SeColumnDefinition.TYPE_INT32:
                            System.out.println("\n\t" + colDef.getName() +
                                               " : " + row.getInteger(i));
                            break;

                        case SeColumnDefinition.TYPE_FLOAT32:
                            System.out.println("\t" + colDef.getName() + " : " +
                                               row.getFloat(i));
                            break;

                        case SeColumnDefinition.TYPE_FLOAT64:
                            System.out.println("\t" + colDef.getName() + " : " +
                                               row.getDouble(i));
                            break;

                        case SeColumnDefinition.TYPE_STRING:
                            System.out.println("\t" + colDef.getName() + " : " +
                                               row.getString(i));
                            break;

                        case SeColumnDefinition.TYPE_SHAPE:
                            System.out.println("\t" + colDef.getName() + " : ");
                            SeShape spVal = (SeShape) row.getShape(i);
                            getShapeDetails(spVal);
                            break;
                        } // End switch
                    } // End if
                } // End for
                // Fetch the next row that matches the query.
                row = query.fetch();
            } // End while
            query.close();
        }
        catch (SeException e)
        {
            System.out.println(e.getSeError().getErrDesc());
        }

    } // End method retrieveData

    /*
     *   Retrieves the rows from a specified table/layer.
     *   Data from all the table's columns are retrieved.
     */
    public static void retrieveData(String tableName)
    {

        System.out.println("\n--> Retrieving Layer Data...");
        try
        {

            SeSqlConstruct sqlConstruct = new SeSqlConstruct(tableName);
            SeTable table1 = new SeTable(conn, tableName);
            /*
             *   Get the table's column definition.
             */
            SeColumnDefinition[] tableDef = table1.describe();
            String[] cols = new String[tableDef.length];

            /*
             *   Store the names of all the table's columns in the
             *   String array cols. This array specifies the columns
             *   to be retrieved from the database.
             */
            for (int i = 0; i < cols.length; i++)
            {
                cols[i] = tableDef[i].getName();
            }

            /*
             *   Define ArcSDE server query.
             */
            SeQuery query = new SeQuery(conn, cols, sqlConstruct);
            query.prepareQuery();
            query.execute();

            SeRow row = null;
            SeColumnDefinition colDef = new SeColumnDefinition();
            /*
             *   Fetch the first row that matches the query.
             */
            row = query.fetch();

            if (row == null)
            {

                System.out.println(" No rows fetched");
                return;
            }

            int max = row.getNumColumns();
            int rowNo = 1;

            while (row != null)
            {

                System.out.println("\n\nContents of Row " + rowNo++);
                for (int i = 0; i < max; i++)
                {

                    colDef = row.getColumnDef(i);
                    int type = colDef.getType();
                    // don't try to retrieve the value if the indicator is NULL
                    if (row.getIndicator((short) i) != SeRow.SE_IS_NULL_VALUE)
                    {

                        switch (type)
                        {

                        case SeColumnDefinition.TYPE_INT16:
                            System.out.println("\t" + colDef.getName() + " : " +
                                               row.getShort(i));
                            break;

                        case SeColumnDefinition.TYPE_DATE:
                            System.out.println("\t" + colDef.getName() + " : " +
                                               row.getTime(i));
                            break;

                        case SeColumnDefinition.TYPE_INT32:
                            System.out.println("\n\t" + colDef.getName() +
                                               " : " + row.getInteger(i));
                            break;

                        case SeColumnDefinition.TYPE_FLOAT32:
                            System.out.println("\t" + colDef.getName() + " : " +
                                               row.getFloat(i));
                            break;

                        case SeColumnDefinition.TYPE_FLOAT64:
                            System.out.println("\t" + colDef.getName() + " : " +
                                               row.getDouble(i));
                            break;

                        case SeColumnDefinition.TYPE_STRING:
                            System.out.println("\t" + colDef.getName() + " : " +
                                               row.getString(i));
                            break;

                        case SeColumnDefinition.TYPE_SHAPE:
                            System.out.println("\t" + colDef.getName() + " : ");
                            SeShape spVal = (SeShape) row.getShape(i);
                            getShapeDetails(spVal);
                            break;
                        } // End switch
                    } // End if
                } // End for
                // Fetch the next row that matches the query.
                row = query.fetch();
            } // End while
            query.close();
        }
        catch (SeException e)
        {
            System.out.println(e.getSeError().getErrDesc());
        }

    } // End method retrieveData

    /*
     *    Retrieves the attributes of a shape object. This
     *    method is invoked by the retrieveData method.
     *    Retrieves the follg details about a shape:
     *       - Shape Type
     *       - Shape's extent
     *       - All its coordinate points
     */
    public static void getShapeDetails(SeShape shape)
    {

        try
        {
            /*
             *   Retrieve the shape type.
             */
            int type = -1;
            type = shape.getType();

            System.out.print("Shape Type : ");
            switch (type)
            {

            case SeShape.TYPE_LINE:
                System.out.println("Line");
                break;
            case SeShape.TYPE_MULTI_LINE:
                System.out.println("Multi Line");
                break;
            case SeShape.TYPE_MULTI_POINT:
                System.out.println("Multi point");
                break;
            case SeShape.TYPE_MULTI_POLYGON:
                System.out.println("Polygon");
                break;
            case SeShape.TYPE_MULTI_SIMPLE_LINE:
                System.out.println("Multi Simple Line");
                break;
            case SeShape.TYPE_NIL:
                System.out.println("Nil");
                break;
            case SeShape.TYPE_POINT:
                System.out.println("Point");
                break;
            case SeShape.TYPE_POLYGON:
                System.out.println("Polygon");
                break;
            case SeShape.TYPE_SIMPLE_LINE:
                System.out.println("Simple Line");
                break;
            } // End switch

            /*
             *   Get shape's extent
             */
            SeExtent sExtent = shape.getExtent();

            System.out.println("\n\t\tShape's Extent -> MinX: " +
                               sExtent.getMinX() + " MinY: " + sExtent.getMinY() +
                               " MaxX: " + sExtent.getMaxX() + " MaxY: " +
                               sExtent.getMaxY());

            /*
             *   Retrieve coordinate points of the shape
             */
            System.out.println("\n\t\tShape Coordinates : ");
            double points[][][] = shape.getAllCoords();
            int numParts = shape.getNumParts();
            System.out.println("\t\tNo. of parts : " + numParts);
            System.out.println("\t\tNo. of points : " + shape.getNumOfPoints());

            for (int partNo = 0; partNo < numParts; partNo++)
            {

                int numSubParts = shape.getNumSubParts(partNo + 1);
                System.out.println("\t\tNo. of sub-parts : " + numSubParts);

                for (int subPartNo = 0; subPartNo < numSubParts; subPartNo++)
                {

                    int numCoords = shape.getNumPoints(partNo + 1,
                            subPartNo + 1);
                    System.out.println("\t\tNo. of coordinates : " + numCoords);

                    for (int pointNo = 0; pointNo < numCoords; pointNo++)
                    {

                        System.out.println("\t\tX: " +
                                           points[partNo][subPartNo][pointNo] +
                                           "\tY: " +
                                           points[partNo][subPartNo][(pointNo +
                                1)]);
                    }
                }
            }
        }
        catch (SeException e)
        {
            System.out.println(e.getSeError().getErrDesc());
        }
    } // End getShapeDetails


    /*
     *  Updates a single row of the layer corresponding to a specific
     *  feature id.
     */
    public static void updateSingleRow(SeLayer layer)
    {

        System.out.println("\n--> Updating feature id 2 in layer...");
        // Set feature_id to 2.
        SeObjectId featureId = new SeObjectId(2);
        String tableName = layer.getName();
        String columns[] = new String[2];

        SeQuery query = null;
        SeShape shape = null;
        try
        {

            /*
             *   Define the names of the columns that will be updated.
             */
            columns[0] = new String(colDefs[4].getName()); // Shape description column
            columns[1] = new String("SHAPE"); // Shape column

            System.out.println("\n\t--> Retrieving feature id - " +
                               featureId.longValue());
            query = new SeQuery(conn);
            SeRow row = null;
            SeColumnDefinition colDef = new SeColumnDefinition();

            // Fetch the row associated with feature_id 2.
            row = query.fetchRow(layer.getName(), featureId, columns);

            if (row == null)
            {

                System.out.println("\t No rows fetched");
                return;
            }

            /*
             *   Retrieve the shape object from the row fetched.
             */
            int max = row.getNumColumns();
            for (int i = 0; i < max; i++)
            {
                colDef = row.getColumnDef(i);
                int type = colDef.getType();
                if (row.getIndicator((short) i) != SeRow.SE_IS_NULL_VALUE)
                {

                    switch (type)
                    {

                    case SeColumnDefinition.TYPE_SHAPE:
                        shape = (SeShape) row.getShape(i);
                        break;
                    } // End switch
                } // End if
            } // End for
            query.close();
        }
        catch (SeException e)
        {
            /*
             *   Make sure the query stream was closed
             */
            try
            {
                query.close();
            }
            catch (SeException se)
            {
                System.out.println(se.getSeError().getErrDesc());
            }
            System.out.println(e.getSeError().getErrDesc());
        }

        System.out.println("\n\t--> Updating shape column... ");
        SeUpdate update = null;
        try
        {
            update = new SeUpdate(conn);
            SeRow row = update.singleRow(featureId, tableName, columns);

            /*
             *   Add a donut hole to the existing shape
             */
            SDEPoint[] pts = new SDEPoint[5];
            pts[0] = new SDEPoint(3500, 3500);
            pts[1] = new SDEPoint(3500, 4500);
            pts[2] = new SDEPoint(4500, 4500);
            pts[3] = new SDEPoint(4500, 3500);
            pts[4] = new SDEPoint(3500, 3500);
            shape.addIsland(pts);

            // Set the new values for the selected row
            row.setString(0, "UPDATED RECTANGLE");
            row.setShape(1, shape);

            update.execute();
            update.close();

        }
        catch (SeException e)
        {
            /*
             *   Make sure the update stream was closed
             */
            try
            {
                update.close();
            }
            catch (SeException se)
            {
                System.out.println(se.getSeError().getErrDesc());
            }
            System.out.println(e.getSeError().getErrDesc() +
                               e.getSeError().getSdeError());
        }

    } // End updateSingleRow


    /*
     *  Updates a single row of the layer. This update function can be modified
     *  to perform multiple row updates by altering the where clause constraint
     */
    public static void updateData(SeLayer layer)
    {

        SeUpdate update = null;
        try
        {
            update = new SeUpdate(conn);

            /*
             *   Define the names of the columns that will be updated
             */
            String columns[] = new String[7];

            columns[0] = new String(colDefs[0].getName()); // Integer column
            columns[1] = new String(colDefs[1].getName()); // Short column
            columns[2] = new String(colDefs[2].getName()); // Float column
            columns[3] = new String(colDefs[3].getName()); // Double column
            columns[4] = new String(colDefs[4].getName()); // String column
            columns[5] = new String(colDefs[5].getName()); // Date column
            columns[6] = new String("SHAPE"); // Shape column

            System.out.println("\n--> Updating Data in table... ");
            System.out.println("\n\t--> Changing Integer_Value 4 to 1000");
            String whereClause = new String("INTEGER_VAL = 4");

            update.toTable(layer.getName(), columns, whereClause);
            //update.setWriteMode(true);
            SeRow row = update.getRowToSet();

            /*
             *   Generate a simple line to replace the multi-part
             *   currently in row 4
             */
            int points = 4;
            int numParts = 1;
            int partOffSets[] = new int[numParts];
            partOffSets[0] = 0;
            SDEPoint[] ptArray = new SDEPoint[points];
            for (int i = -1; i < (points - 1); i++)
            {
                ptArray[i +1] = new SDEPoint(3200.0 + i * 300, 1500.0 + i * i * 400);
            }

            SeShape line = new SeShape(layer.getCoordRef());
            line.generateSimpleLine(points, numParts, partOffSets, ptArray);

            // Set the new values for the selected row
            row.setInteger(0, new Integer(1000));
            row.setShort(1, new Short((short) 4));
            row.setFloat(2, new Float(100.00));
            row.setDouble(3, new Double(10000.000));
            row.setString(4, "UPDATED LINE SHAPE");
            // Sets date to current date
            Calendar cal = Calendar.getInstance();
            row.setTime(5, cal);

            row.setShape(6, line);

            update.execute();
            update.close();

        }
        catch (SeException e)
        {
            /*
             *   Make sure the update stream was closed
             */
            try
            {
                update.close();
            }
            catch (SeException se)
            {
                System.out.println(se.getSeError().getErrDesc());
            }
            System.out.println(e.getSeError().getErrDesc() +
                               e.getSeError().getSdeError());
        }

    } // End method updateData

} // End LayerExample1
