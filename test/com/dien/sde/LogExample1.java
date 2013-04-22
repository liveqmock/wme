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
 * Demonstrates
 * 1. Creation of logfiles and adding feature ids
 * 2. Creation of logfile and attaching it to a query's output stream
 * This Java sample demonstrates usage of ArcSDE API. It will not execute successfully until the user
 * supplies valid ArcSDE Server details such as server name, port number, database name, user, pwd, and valid
 * data, if required.
 **************************************************************************/
package com.dien.sde;

import java.util.Calendar;
import java.util.Date;

import com.esri.sde.sdk.client.SeColumnDefinition;
import com.esri.sde.sdk.client.SeConnection;
import com.esri.sde.sdk.client.SeCoordinateReference;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeExtent;
import com.esri.sde.sdk.client.SeInsert;
import com.esri.sde.sdk.client.SeLayer;
import com.esri.sde.sdk.client.SeLog;
import com.esri.sde.sdk.client.SeObjectId;
import com.esri.sde.sdk.client.SeQuery;
import com.esri.sde.sdk.client.SeRegistration;
import com.esri.sde.sdk.client.SeRow;
import com.esri.sde.sdk.client.SeShape;
import com.esri.sde.sdk.client.SeSqlConstruct;
import com.esri.sde.sdk.client.SeTable;


public class LogExample1
{

    private static SeColumnDefinition colDefs[] = new SeColumnDefinition[6];
    private static SeConnection conn = null;
    private static SeLayer layer = null;
    private static int MAX_ROWS = 25;
    // Stores the feature ids of the data inserted into the layer
    private static SeObjectId[] rowIds = new SeObjectId[MAX_ROWS];

    public static void main(String[] args)
    {
        //**Warning: please modify appropriately to suit your application **
        String server = null, database = "none", user = null, password = null;
        int instance = 0;

        /*
         *   Process command line arguements
         */
        if (args.length == 5)
        {

            server = args[0];
            instance = Integer.parseInt(args[1]);
            database = args[2];
            user = args[3];
            password = args[4];
        }
        else if (args.length == 4)
        {

            server = args[0];
            instance = Integer.parseInt(args[1]);
            user = args[2];
            password = args[3];
        }
        else
        {
            System.out.println("Invalid number of arguements!!");
            System.out.println(
                    "Usage: \n LogExample <server> <instance> [database] <user> <passwd> ");
            System.exit(0);
        }

        try
        {
            /*
             *   Connect to the ArcSDE server
             */
            System.out.println("Connecting to ArcSDE Server...");
            conn = new SeConnection(server, instance, database, user, password);
            System.out.println("Connection Successful! \n");

            /*
             *   Create an ArcSDE Layer "LOGEXAMPLE"
             */
            createBaseLayer();

            /*
             *   Registers the layer giving it a new column
             *   Row_id maintained by the server
             */
            registerTable();

            /*
             *   Inserts MAX_ROWS of data into the layer.
             *   The feature ids of the data inserted is stored
             *   in the array rowIds.
             */
            insertData();

            /*
             *   Create a new log file log_file_one and add feature ids to it
             */
            createLogFileOne();

            /*
             *   Create a new log file log_file_two and attach it to a
             *   query's output stream.
             */
            createLogFileTwo();

            /*
             *   Delete base table
             */
            SeTable table = new SeTable(conn, layer.getName());
            table.delete();

            /*
             *   Disconnect from the server
             */
            System.out.println("\nDisconnecting... \n");
            conn.close();

        }
        catch (SeException e)
        {
            System.out.println(" ERROR : " + e.getSeError().getErrDesc());
        }
    } // End main


    /*
     *   Creates a new log file "log_file_one" and
     *   inserts features from the layer "logexample" into it.
     */
    public static void createLogFileOne()
    {

        try
        {
            /*
             *   Create a temporary log file called "log_file_one"
             */
            System.out.println("\nCreating logfile - log_file_one");
            SeLog logOne = new SeLog(conn);
            logOne.setName("log_file_one");

            /*
             *   Set the layer that was created as the target for this log file
             */
            logOne.setTargetAsLayer(layer.getName(), layer.getSpatialColumn());

            /*
             *   Open the log file in create and write mode
             */
            System.out.println("Opening log one in CREATE_AND_WRITE mode");
            logOne.openLog(SeLog.SE_CREATE_AND_WRITE_MODE);

            /*
             *   Retrieve the feature id values of the first 5 rows that
             *   were inserted into the layer and put these values
             *   in the array "rows".
             */
            SeObjectId[] rows = new SeObjectId[5];

            for (int i = 0; i < 5; i++)
            {
                rows[i] = (SeObjectId) rowIds[i];
            }

            /*
             *   Adding multiple feature ids at a time.
             *   Add the feature id values in the array rows to the logOne.
             */
            System.out.println("Adding feature id's to log file");
            logOne.addIds(rows);

            /*
             *   Adding feature ids one by one
             *   Add the feature ids of rows 6-10 of the layer to logOne.
             */
            for (int i = 5; i < 11; i++)
            {
                logOne.addId(rowIds[i]);
            }

            /*
             *   Retrieve the log file attributes and contents
             */
            getLogInfo(logOne);

            /*
             *   Delete a list of feature ids from the logfile:
             *   Delete features 1, 3 & 5 from logfile
             */
            SeObjectId[] deleteList = new SeObjectId[3];
            System.out.println("Deleting features 1, 3 & 5 from logfile");
            for (int i = 0; i < 3; i++)
            {
                deleteList[i] = rowIds[i * 2];
            }

            logOne.deleteIds(deleteList);

            /*
             *   Display the contents of the log file
             */
            getLogInfo(logOne);

            /*
             *   Close the log file
             */
            logOne.close();

            /*
             *   Open logOne again, but this time in over write mode to
             *   replace old entries with new ones.
             */
            System.out.println("Re-opening log_file_one in OVERWRITE mode");
            logOne.openLog(SeLog.SE_OVERWRITE_MODE);

            /*
             *   Insert rows 11 to 15 from the layer into logOne, erasing all
             *   existing entries in the log file.
             */
            System.out.println(
                    "\n Inserting 5 new feature id's - over old ones");
            rows = new SeObjectId[5];
            for (int i = 0; i < 5; i++)
            {
                rows[i] = rowIds[i + 10];
            }

            logOne.addIds(rows);

            /*
             *   Display the contents of the log file
             */
            getLogInfo(logOne);
            logOne.close();

            /*
             *   Re-open the log file in modify mode and append features
             *   to log_file_one
             */
            logOne.openLog(SeLog.SE_MODIFY_MODE);

            /*
             *   Append rows 1 to 5 from the layer into logOne
             */
            System.out.println("\n Adding 5 new feature id's into log file");
            rows = new SeObjectId[5];
            for (int i = 0; i < 5; i++)
            {
                rows[i] = rowIds[i];
            }
            logOne.addIds(rows);

            /*
             *   Display the contents of the log file
             */
            getLogInfo(logOne);
            logOne.close();

            /*
             *   Delete the log file from the database
             *   Since this log file was created as a temporary log file,
             *   the default property, it will be automatically deleted
             *   when the current connection is closed.
             */
            logOne.delete();

        }
        catch (SeException e)
        {
            System.out.println(" ERROR : " + e.getSeError().getErrDesc());
        }

    } // End static method createLogFileOne


    /*
     *   Creates a log file "log_file_two".
     *   This log file is associated with a query stream
     *   The results of the query are directed into the logfile.
     */
    public static void createLogFileTwo()
    {

        try
        {
            String tableName = layer.getName();
            SeSqlConstruct sqlConstruct = new SeSqlConstruct(tableName);
            SeTable table = new SeTable(conn, tableName);
            SeColumnDefinition[] tableDef = table.describe();
            String[] cols = new String[tableDef.length];

            for (int i = 0; i < cols.length; i++)
            {
                cols[i] = tableDef[i].getName();
            }

            SeColumnDefinition colDef = new SeColumnDefinition();
            SeQuery query = new SeQuery(conn, cols, sqlConstruct);
            query.prepareQuery();

            SeLog logTwo = new SeLog(conn);
            logTwo.setName("log_file_two");
            /*
             *   Set the layer that was created as the target for this log file
             */
            logTwo.setTargetAsLayer(layer.getName(), layer.getSpatialColumn());
            logTwo.openLog(SeLog.SE_CREATE_AND_WRITE_MODE);

            boolean logfileOnly = true;
            query.setLogfile(logTwo, logfileOnly);
            query.execute();
            query.close();

            /*
             *   Display the contents of the log file
             */
            getLogInfo(logTwo);
            logTwo.close();

        }
        catch (SeException e)
        {
            System.out.println("ERROR : " + e.getSeError().getErrDesc());
            e.printStackTrace();
        }
    } // End static method createLogFileTwo


    /*
     *   Retrieves the following information about the log file:
     *   - The name of the log file.
     *   - The id no of the log file.
     *   - Whether this log file is persistent or not.
     *   - Information about the logfile's target:
     *       * The name of the target table/layer.
     *       * The name of the target spatial column if the target is a layer.
     *   - No of rows of data stored in the log file.
     *   - The row ids of the data stored in the log file.
     */
    public static void getLogInfo(SeLog log)
    {

        try
        {
            System.out.println("\nLog file info...");
            System.out.println("Log Name : " + log.getName());
            System.out.println("Log Id : " + log.getId().longValue());
            System.out.println("Log is persistent : " + log.isPersistent());

            SeLog.SeLogTargetInfo target = log.getTargetInfo();
            if (target.tableName != null)
            {
                System.out.println("Target table Name : " + target.tableName);
            }
            else
            {
                System.out.println("Target name null!");
            }

            if (target.spatialColumn != null)
            {
                System.out.println("Target Spatial Col : " +
                                   target.spatialColumn);
            }
            else
            {
                System.out.println("Target spatialCols null!");
            }

            if (target.type == SeLog.SE_LOG_FOR_TABLE)
            {
                System.out.println("Target Type : Table");
            }
            else if (target.type == SeLog.SE_LOG_FOR_LAYER)
            {
                System.out.println("Target Type : Layer");
            }

            int numRows = log.count();
            System.out.println("Log count : " + numRows);
            if (numRows > 0)
            {
                SeObjectId[] retrievedRows = new SeObjectId[numRows];
                retrievedRows = log.getRowIds(numRows);
                System.out.println("Retrieved Row ids ");
                for (int i = 0; i < retrievedRows.length; i++)
                {
                    System.out.println("\t" + retrievedRows[i].longValue());
                }
            }
        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

    } // End method getLogInfo


    /*
     *   Creates an ArcSDE table, "LOGEXAMPLE", spatially enables it.
     *   Layer has 7 columns: Integer, Short, Float , Double, String,
     *   Date and Shape.
     */
    public static void createBaseLayer()
    {

        layer = new SeLayer(conn);
        SeTable table = null;
        try
        {
            /*
             *   Create a qualified table name with current user's name and
             *   the string "LOGEXAMPLE".
             */
            String tableName = (conn.getUser() + ".LOGEXAMPLE");
            table = new SeTable(conn, tableName);

            // Delete table if it already exists
            try
            {
                table.delete();
            }
            catch (SeException e)
            {}

            /*
             *   Define columns for the tables..
             */
            boolean isNullable = true;

            colDefs[0] = new SeColumnDefinition("Integer_Val",
                                                SeColumnDefinition.TYPE_INTEGER,
                                                10, 0, isNullable);
            colDefs[1] = new SeColumnDefinition("Short_Val",
                                                SeColumnDefinition.TYPE_SMALLINT,
                                                4, 0, isNullable);
            colDefs[2] = new SeColumnDefinition("Float_Val",
                                                SeColumnDefinition.TYPE_FLOAT,
                                                5, 2, isNullable);
            colDefs[3] = new SeColumnDefinition("Double_Val",
                                                SeColumnDefinition.TYPE_DOUBLE,
                                                15, 4, isNullable);
            colDefs[4] = new SeColumnDefinition("String_Val",
                                                SeColumnDefinition.TYPE_STRING,
                                                25, 0, isNullable);
            colDefs[5] = new SeColumnDefinition("Date_Val",
                                                SeColumnDefinition.TYPE_DATE, 1,
                                                0, isNullable);

            /*
             *   Use DBMS default config keyword...
             *   Valid config keywords are found in the dbtune.sde file
             */
            System.out.println("\n--> Create table using DBMS Default Keyword");
            table.create(colDefs, "");
            System.out.println(" - Done.");

            /*
             *   Spatially enable the new table...
             */
            System.out.println("\n--> Spatially enabling the table...");

            layer.setSpatialColumnName("SHAPE");
            layer.setTableName("LOGEXAMPLE");
            /*
             *   Set the type of shapes that can be inserted into the layer
             */
            layer.setShapeTypes(SeLayer.SE_NIL_TYPE_MASK |
                                SeLayer.SE_POINT_TYPE_MASK |
                                SeLayer.SE_LINE_TYPE_MASK |
                                SeLayer.SE_SIMPLE_LINE_TYPE_MASK |
                                SeLayer.SE_AREA_TYPE_MASK |
                                SeLayer.SE_MULTIPART_TYPE_MASK);
            layer.setGridSizes(1000.0, 0.0, 0.0);
            layer.setDescription("Log Test Layer");
            SeExtent ext = new SeExtent(0.0, 0.0, 10000.0, 10000.0);
            layer.setExtent(ext);

            /*
             *   Define layer's Coordinate Reference
             */
            SeCoordinateReference coordref = new SeCoordinateReference();
            coordref.setXY(0, 0, 100);
            layer.setCoordRef(coordref);
            // Spatially enable business table
            layer.create(0, 0);
            System.out.println(" - Done.");

        }
        catch (SeException e)
        {
            System.out.println(e.getSeError().getErrDesc());
        }

    } // End method createBaseTable


    /*
     *   Inserts MAX_ROWS rows of data into the base table.
     *   Values inserted:
     *   Col         Type    Value
     *   integer_val    Int      1->MAX_ROWS
     *   short_val   Short    1/2
     *   float_val   Float    3
     *   double_val  Double   4
     *   date_val    Date
     *   string_val  String
     *   shape       rectangles
     */
    public static void insertData()
    {

        // Insert Data into table...
        SeInsert insert = null;
        try
        {
            insert = new SeInsert(conn);
        }
        catch (SeException se)
        {
            System.out.println(se.getSeError().getErrDesc());
        }
        String[] columns = new String[7];
        // Integer data type
        columns[0] = colDefs[0].getName();
        // Small int data type
        columns[1] = colDefs[1].getName();
        // float data type
        columns[2] = colDefs[2].getName();
        // double data type
        columns[3] = colDefs[3].getName();
        // String data type
        columns[4] = colDefs[4].getName();
        // Date data type
        columns[5] = colDefs[5].getName();
        // Shape column
        columns[6] = "SHAPE";

        Calendar cal = Calendar.getInstance();
        cal.set(1999, 00, 01, 0, 0, 0);

        System.out.println("\n--> Inserting Data into table... ");
        try
        {
            insert.intoTable(layer.getName(), columns);
            insert.setWriteMode(true);
            for (int count = 1; count <= MAX_ROWS; count++)
            {
                SeRow row = insert.getRowToSet();
                Integer testInt = new Integer(count);
                short testShort = (short) (count % 2 + 1);
                Float testFloat = new Float(3.0);
                Double testDouble = new Double(4.0);
                Date date = new Date(100000);
                row.setInteger(0, testInt);
                row.setShort(1, new Short(testShort));
                row.setFloat(2, testFloat);
                row.setDouble(3, testDouble);
                row.setString(4, "String value");
                row.setDate(5, cal.getTime());
                cal.roll(Calendar.YEAR, true);

                SeShape shape = new SeShape(layer.getCoordRef());
                SeExtent rectangle = new SeExtent();
                rectangle.setMinX(2000 + count * 200);
                rectangle.setMinY(2000 + count * 200);
                rectangle.setMaxX(4000 + count * 200);
                rectangle.setMaxY(4000 + count * 200);
                shape.generateRectangle(rectangle);

                row.setShape(6, shape);

                insert.execute();
                /*
                 *   Store the feature id's of each row inserted into the
                 *   layer in the array rowIds so that it can be used later
                 */
                rowIds[(count - 1)] = insert.lastInsertedRowId();
            }
            insert.flushBufferedWrites();
            insert.close();
        }
        catch (SeException e)
        {
            try
            {
                insert.close();
            }
            catch (SeException se)
            {
                se.printStackTrace();
            }
            e.printStackTrace();
        }

    } // End insertData


    /*
     *   Registers the base table, giving it an ArcSDE maintained Row_id column
     */
    public static void registerTable()
    {

        SeRegistration registration = null;

        /*
         *   Retrieve the table's registration.
         */
        try
        {
            registration = new SeRegistration(conn, layer.getName());
        }
        catch (SeException e)
        {
            System.out.println("ERROR : " + e.getSeError().getErrDesc());
        }

        /*
         *   Check if table has been registered as ArcSDE maintained table.
         *   If already registered, return to main.
         */
        if (registration.getRowIdColumnType() ==
            SeRegistration.SE_REGISTRATION_ROW_ID_COLUMN_TYPE_SDE)
        {
            return;
        }

        /*
         *   Update the table's registration to give it an ArcSDE maintained
         *   row id.
         */
        try
        {

            registration.setRowIdColumnName("ROW_ID");
            registration.setRowIdColumnType(SeRegistration.
                    SE_REGISTRATION_ROW_ID_COLUMN_TYPE_SDE);
        }
        catch (SeException e)
        {
            System.out.println("ERROR : " + e.getSeError().getErrDesc());
        }

        try
        {
            System.out.println("\n\t Updating registration info...");
            registration.alter();
        }
        catch (SeException e)
        {
            System.out.println("ERROR : " + e.getSeError().getErrDesc());
        }
    } // End method registerTable

} // End LogExample
