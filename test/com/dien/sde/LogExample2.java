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
 * 1. Creation of logfile and inserting and deleting from it.
 * 2. Creating a query and directing results into a logfile.
 * 3. Creating a persistent logfile and inserting into the logfile in Append and overwrite mode
 * 4. Creating a copy of an existing logfile and using SeLog.calculateExtent() and SeLog.combine() methods. * This Java sample demonstrates usage of ArcSDE API. It will not execute successfully until the user
 * supplies valid ArcSDE Server details such as server name, port number, database name, user, pwd, and valid
 * data, if required.
 **************************************************************************/
package com.dien.sde;

import java.util.Calendar;
import java.util.Date;

import com.esri.sde.sdk.client.SeColumnDefinition;
import com.esri.sde.sdk.client.SeConnection;
import com.esri.sde.sdk.client.SeError;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeExtent;
import com.esri.sde.sdk.client.SeInsert;
import com.esri.sde.sdk.client.SeLayer;
import com.esri.sde.sdk.client.SeLog;
import com.esri.sde.sdk.client.SeObjectId;
import com.esri.sde.sdk.client.SeQuery;
import com.esri.sde.sdk.client.SeRow;
import com.esri.sde.sdk.client.SeShape;
import com.esri.sde.sdk.client.SeSqlConstruct;
import com.esri.sde.sdk.client.SeTable;


/**
 *
 *   This class tests the log file functions.
 * <PRE>
 * Test process:
 *   Creates a connection to the server for userOne who:
 *       1. creates a layer TABLE_NAME.
 *       2. registers the table with an ArcSDE maintained row_id column so
 *       that logfiles can be created for this layer.
 *       3. inserts 25 rows of data into the layer.
 *       4. Creates a temporary logfile and tests inserts and deletes from it.
 *       5. Creates a query, directing the results into a logfile.
 *       6. Creates a persistent logfile and tests inserts into the logfile in
 *           Append and overwrite mode.
 *       7. Creates a copy of an existing logfile and tests SeLog.calculateExtent()
 *           and SeLog.combine methods.
 *
 * </PRE>
 * <P>
 * Usage: &nbsp;
 * <CODE>
 * java Logfile {server} {instance} {database} {user1} {passwd1} {storage type}
 * </CODE>
 *
 * @author Rajkumar Padmanabhan
 * @version $Id: Logfile.java,v 1.2 2002/09/14 23:56:04 rajk3142 Exp $
 *
 */
public class LogExample2
{
    private SeConnection userOneConn = null;
    private SeConnection userTwoConn = null;
    private SeLayer layer = null;
    private static final int MAX_ROWS = 25;
    // Stores the row_id values of the data inserted into the layer
    private SeObjectId[] rowIds = new SeObjectId[MAX_ROWS];
    private String userOne = null;
    private String passwordOne = null;
    private String TABLE_NAME = "LOGTEST";


    /**
     * Invokes the constructor.
     */
    public static void main(String[] args)
    {

        LogExample2 logtest = new LogExample2(args);

    } // End main


    /**
     * This constructor starts the test.
     * @param args the command line arguments
     */
    public LogExample2(String[] args)
    {

        String server = null, database = "none", keyword = "";
        int instance = 0;

        System.out.print("???Input Arguments: ");
        for (int i = 0; i < args.length; i++)
        {
            System.out.print("\t" + args[i]);
        }
        System.out.println("\n");

        /*
         *   Process command line arguements.
         */
        if (args.length == 6)
        {
            server = args[0];
            instance = Integer.parseInt(args[1]);
            database = args[2];
            userOne = args[3];
            passwordOne = args[4];
            keyword = args[5];
        }
        else
        {
            System.out.println("Invalid number of arguments");
            System.out.println("Usage: \n java Logfile {server} {instance} {database} {user} {passwd} {storage type}");
            System.exit(0);
        }

        try
        {
            /*
             *   Connect to ArcSDE server
             */
            System.out.println("Connecting to server ??" + server +
                               ", instance ??" + instance);
            userOneConn = new SeConnection(server, instance, database, userOne,
                                           passwordOne);
            System.out.println("Connection for " + userOne.toUpperCase() +
                               " successful! \n");

            TABLE_NAME += "_" + keyword;
            /*
             *   Create an ArcSDE Layer TABLE_NAME
             */
            layer = createBaseLayer(keyword);

            /*
             *   Inserts MAX_ROWS of data into the layer.
             *   The row_ids of the data inserted is stored
             *   in the array rowIds.
             */
            insertData();

            /*
             *  userOne creates a temporary logfile using a default name generated
             *  by ArcSDE and tests insert and delete operations on the logfile.
             *  Tests the retrieval of features from the logfile( as opposed to just the
             *  logfile's row_id entries )
             */
            System.out.println("\n\t*******\t*******\t*******");
            makeDefaultLog();

            /*
             *   Create a temporary log file and dump the results of a query into it.
             */
//            System.out.println("\n\t*******\t*******\t*******");
//            makeQueryLog();

            /*
             *  userOne Creates a persistent logfile named "testlog2" and
             *  - Tests inserts into the logfile.
             *  - Tests inserts, in overwrite mode(SeLog.SE_OVERWRITE_MODE.)
             *  - Tests inserts, in append mode(SeLog.SE_MODIFY_MODE.)
             */
            System.out.println("\n\t*******\t*******\t*******");
            makePersistentLog();

            /*
             *  userOne makes a copy of logfile "testlog2" and calls it "logTwoCopy".
             *  Tests the log.calculateExtent() method on logTwoCopy.
             *  Inserts a few rows into logTwoCopy.
             *  userOne then opens testlog2 and inserts rows into it.
             *  Tests the SeLog.combine() method, with all the possible options,and
             *  stores the results in a new temporary logfile, "logCombine".
             *  userOne then deletes all the three logfiles created.
             */
            System.out.println("\n\t*******\t*******\t*******");
            makeLogCopy();

            /*
             *   Disconnect the userOne from the server
             */
            System.out.println("Disconnecting " + userOne +
                               " from server... \n");
            userOneConn.close();

        }
        catch (SeException e)
        {
            e.printStackTrace();

        }

    } // End constructor


    /**
     * userOne creates a temporary logfile using a default name generated
     * by ArcSDE.
     * userOne then tests insert of 6 rows into the log file and deletes
     * 3 rows.
     */
    public void makeDefaultLog()
    {

        try
        {
            /*
             *   Create a temporary log file with default name
             */
            System.out.println("\nCreating logfile - default name");
            SeLog logOne = new SeLog(userOneConn);
            logOne.makeName();

            // Set the layer that was created as the target for this log file
            logOne.setTargetAsLayer(layer.getName(), layer.getSpatialColumn());

            // Open the log file in create and write mode
            System.out.println("Opening log one in CREATE_AND_WRITE mode");
            logOne.openLog(SeLog.SE_CREATE_AND_WRITE_MODE);

            /*
             *   Retrieve the row_id values of the first 5 rows that
             *   were inserted into the layer and put these values
             *   in the array rows. This array be used to add entries
             *   to the log file.
             */
            SeObjectId[] rows = new SeObjectId[5];

            // Testing SeObjectId.clone() method
            for (int i = 0; i < 5; i++)
            {
                rows[i] = (SeObjectId) rowIds[i].clone();
            }

            /*
             *   Adding multiple row_ids at a time.
             *   Add the row_id values in the array rows to logOne.
             */
            System.out.println("Adding feature id's to log file");
            logOne.addIds(rows);

            /*
             *   Adding row_ids one by one.
             *   Add the row_id/feature_id of row 6 of the layer to logOne.
             */
            logOne.addId(rowIds[5]);

            /*
             *   Retrieve the log file attributes and contents
             */
            System.out.print("\nLOG ONE");
            getLogInfo(logOne);

            /*
             *   Delete a list of row ids from the logfile:
             *   Delete rows 1, 3 & 5 from logfile
             */
            SeObjectId[] deleteList = new SeObjectId[3];
            System.out.println("Deleting rows 1, 3 & 5 from logfile");
            for (int i = 0; i < 3; i++)
            {
                deleteList[i] = rowIds[i * 2];
            }
            logOne.deleteIds(deleteList);
            System.out.print("\nLOG ONE");
            getLogInfoWithData(logOne);
            // Close logOne
            logOne.close();

            // Delete logOne
            logOne.delete();
        }
        catch (SeException e)
        {
            e.printStackTrace();
        }
        catch (CloneNotSupportedException e)
        {
            e.printStackTrace();
        }

    } // End makeDefaultLog


    /**
     *   Creates a temporary log file "query_log_file".
     *   Creates a query to retrieve all the data from the table TABLE_NAME.
     *   The results of the query are directed into the logfile.
     */
    public void makeQueryLog()
    {

        try
        {
            String tableName = layer.getName();
            SeSqlConstruct sqlConstruct = new SeSqlConstruct(tableName);
            SeTable table = new SeTable(userOneConn, tableName);
            SeColumnDefinition[] tableDef = table.describe();
            String[] cols = new String[tableDef.length];

            for (int i = 0; i < cols.length; i++)
            {
                cols[i] = tableDef[i].getName();
            }

            SeColumnDefinition colDef = new SeColumnDefinition();
            SeQuery query = new SeQuery(userOneConn, cols, sqlConstruct);
            query.prepareQuery();

            String logFileName = "query_log_file" + "_" + TABLE_NAME;
            System.out.println("\nMaking a log file " + logFileName +
                    " that is associated with the output stream of a query");
            SeLog logTwo = new SeLog(userOneConn);
            logTwo.setName(logFileName);
            /*
             *   Use the layer that was created as the target for this log file.
             */
            logTwo.setTargetAsLayer(layer.getName(), layer.getSpatialColumn());
            logTwo.openLog(SeLog.SE_CREATE_AND_WRITE_MODE);

            System.out.println("\nExecuting query against the base layer...");
            boolean logfileOnly = true;
            query.setLogfile(logTwo, logfileOnly);
            query.execute();
            query.close();

            /*
             *   Display the contents of the log file
             */
            System.out.println("\nContents of " + logFileName);
            getLogInfo(logTwo);
            logTwo.close();

        }
        catch (SeException e)
        {
            e.printStackTrace();
        }
    } // End method makeQueryLog


    /**
     *  Creates a persistent logfile named "testlog2".
     *  Tests inserts into the logfile.
     *  Tests inserts, in overwrite mode(SeLog.SE_OVERWRITE_MODE.)
     *  Tests inserts, in append mode(SeLog.SE_MODIFY_MODE.)
     */
    public void makePersistentLog()
    {

        try
        {
            /*
             *   Create a new log file called "testlog2"
             */
            System.out.println("\nCreating new logfile \"testlog2\"");
            SeLog logTwo = new SeLog(userOneConn);
            logTwo.setName("testlog2" + "_" + TABLE_NAME);
            logTwo.setTargetAsLayer(layer.getName(), layer.getSpatialColumn());

            System.out.println("\n Deleting logTwo if it already exists...");
            try
            {
                logTwo.delete();
            }
            catch (SeException se)
            {
                if (se.getSeError().getSdeError() != SeError.SE_LOG_NOEXIST)
                {
                    se.printStackTrace();
                }
            }

            logTwo.openLog(SeLog.SE_CREATE_AND_WRITE_MODE);

            /*
             *   Make logTwo a persistent log file( all logfiles are temporary
             *   by default.)
             */
            boolean isPersistent = true;
            logTwo.setPersistence(isPersistent);
            // Commit changes to server
            logTwo.alter();

            /*
             *   Insert feature id's into log file.
             *   Insert the first five rows from the layer into logTwo.
             */
            System.out.println("\n Inserting 5 new feature id's into log two");
            SeObjectId[] rows = new SeObjectId[5];
            for (int i = 0; i < 5; i++)
            {
                rows[i] = (SeObjectId) rowIds[i].clone();
            }
            System.out.println("Adding feature id's to log file 2");
            logTwo.addIds(rows);

            // Print the attribute and contents of the log file.
            System.out.print("\nLOG TWO  ");
            getLogInfo(logTwo);
            logTwo.close();

            /*
             *   Open logTwo again, but this time in over write mode to
             *   see if the old entries are erased by the new ones.
             */
            System.out.println("Re-opening log two in OVERWRITE mode");
            logTwo.openLog(SeLog.SE_OVERWRITE_MODE);

            /*
             *   Insert rows 11 to 14 from the layer into logTwo, erasing all
             *   existing entries in the log file.
             */
            System.out.println(
                    "\n Inserting 5 new feature id's - erasing all previous entries");
            rows = new SeObjectId[5];
            for (int i = 10; i < 15; i++)
            {
                rows[i - 10] = (SeObjectId) rowIds[i].clone();
            }
            System.out.println("Adding feature id's to log file 2");
            logTwo.addIds(rows);

            // Add a single row id from the layer, row 22.
            System.out.println("\nAdding feature id 22 to logTwo");
            logTwo.addId(rowIds[21]);

            System.out.print("\nLOG TWO  ");
            // Display log file attributes and contents
            getLogInfo(logTwo);
            logTwo.close();

            /*
             *   Re-open log two in modify mode and then try to insert new
             *   rows to see if they get appended correctly at the end of the
             *   existing logfile.
             */
            logTwo.openLog(SeLog.SE_MODIFY_MODE);

            /*
             *   Append rows 1 to 5 from the layer into logTwo
             */
            System.out.println("\n Inserting 5 new feature id's into log two");
            rows = new SeObjectId[5];
            for (int i = 0; i < 5; i++)
            {
                rows[i] = (SeObjectId) rowIds[i].clone();
            }
            System.out.println("Adding feature id's to log file 2");
            logTwo.addIds(rows);

            // Display the contents of the log file to verify append operation.
            System.out.print("\nLOG TWO  ");
            getLogInfo(logTwo);
            logTwo.close();

        }
        catch (SeException e)
        {
            e.printStackTrace();
        }
        catch (CloneNotSupportedException e)
        {
            e.printStackTrace();
        }

    } // End makePersistentLog


    /**
     *  userOne makes a copy of logfile "testlog2" and calls it "logTwoCopy".
     *  Tests the log.calculateExtent() method on logTwoCopy.
     *  Inserts a few rows into logTwoCopy.
     *  userOne then opens testlog2 and inserts rows into it.
     *  Tests the SeLog.combine() method, with all the possible options,and
     *  stores the results in a new temporary logfile, "logCombine".
     *  userOne then deletes all the three logfiles created.
     */
    public void makeLogCopy()
    {

        try
        {
            /*
             *   Make a copy of logTwo
             */
            SeLog logTwo = new SeLog(userOneConn,
                                     userOne + ".testlog2" + "_" + TABLE_NAME);
            System.out.println("\n Making a copy of logfile2, logTwoCopy..");
            SeLog logTwoCopy = logTwo.copy("logTwoCopy"); ;

            logTwoCopy.openLog(SeLog.SE_READ_MODE);

            // Display the contents of the copy of logTwo
            System.out.print("\nLOG TWO COPY: ");
            getLogInfo(logTwoCopy);

            /*
             *   Test the calculateExtent method
             *   Get extent of features in logTwoCopy where the integer value
             *   of the rows > 5
             */
            String whereClause = Util.INT_COL_NAME + " > 5";
            SeSqlConstruct sqlCons = new SeSqlConstruct(layer.getQualifiedName(),
                    whereClause);
            double[] zExt = new double[2];

            SeExtent featExt = logTwoCopy.calculateExtent(sqlCons);
            System.out.println(
                    "\nExtent of feature in copy of log two where Integer value > 5");
            System.out.println("MinX " + featExt.getMinX() + " Min Y " +
                               featExt.getMinY()
                               + " Max X " + featExt.getMaxX() + " Max Y " +
                               featExt.getMaxY());

            /*
             *   Get extent of features in logTwoCopy where the integer value
             *   of the rows > 0
             */
            whereClause = Util.INT_COL_NAME + " > 0";
            sqlCons = new SeSqlConstruct(layer.getQualifiedName(), whereClause);

            featExt = logTwoCopy.calculateExtent(sqlCons);
            System.out.println("\nExtent of all features in log two ");
            System.out.println("MinX " + featExt.getMinX() + " Min Y " +
                               featExt.getMinY()
                               + " Max X " + featExt.getMaxX() + " Max Y " +
                               featExt.getMaxY());

            /*
             *   Get extent of all the features in logTwoCopy
             */
            sqlCons = new SeSqlConstruct();
            zExt = new double[2];

            featExt = logTwoCopy.calculateExtent(sqlCons);
            System.out.println("\nExtent of feature in copy of log two ");
            System.out.println("MinX " + featExt.getMinX() + " Min Y " +
                               featExt.getMinY()
                               + " Max X " + featExt.getMaxX() + " Max Y " +
                               featExt.getMaxY());

            /*
             *   Add some more rowids, in a haphazard order, and then sort the log file.
             */
            System.out.println(
                    "\nAdding jumbled rows ( 25, 20, 23, 22 & 19 ) to the log file");
            logTwoCopy.addId(rowIds[24]);
            logTwoCopy.addId(rowIds[19]);
            logTwoCopy.addId(rowIds[22]);
            logTwoCopy.addId(rowIds[21]); // This row id already exists in the log file.
            logTwoCopy.addId(rowIds[18]);

            // display the contents of the log file without sorting it.
            System.out.print("\nLOG TWO COPY: ");
            getLogInfo(logTwoCopy);

            logTwoCopy.close();

            // Sort logTwoCopy
            System.out.print("\nSorting logfile..\n");
            logTwoCopy.sort();

            logTwoCopy.openLog(SeLog.SE_READ_MODE);

            // Diplay the contents of logTwoCopy to check if the sort worked.
            System.out.print("\nLOG TWO COPY: ");
            getLogInfo(logTwoCopy);

            logTwoCopy.close();

            /*
             *   Open logTwo, "testlog2", and add a few rows to it.
             */
            logTwo.openLog(SeLog.SE_MODIFY_MODE);

            /*
             *   Add rowids 6,7,8,16,17 & 18.
             */
            System.out.println("\nAdding rows to the log file two");
            logTwo.addId(rowIds[5]);
            logTwo.addId(rowIds[6]);
            logTwo.addId(rowIds[7]);
            logTwo.addId(rowIds[15]);
            logTwo.addId(rowIds[16]);
            logTwo.addId(rowIds[17]);

            logTwo.close();

            getLogList(userOneConn, userOne);

            /*
             * Create a new logfile "logCombine" to store the results of the
             * different SeLog.combine() operations.
             */
            SeLog logThree = new SeLog(userOneConn);
            logThree.setName("logCombine");
            logThree.setTargetAsLayer(layer.getName(), layer.getSpatialColumn());

            // Delete "logCombine" if it already exists.
            try
            {
                logThree.delete();
            }
            catch (SeException se)
            {
                if (se.getSeError().getSdeError() != SeError.SE_LOG_NOEXIST)
                {
                    se.printStackTrace();
                }
            }

            /*
             *   Test SeLog.combine method
             */
            System.out.println("\nUnion of testlog2 and logTwoCopy");
            logThree = logTwo.combine(logTwoCopy.getName(), "logCombine",
                                      SeLog.SE_LOG_UNION);

            System.out.print("\nResult of UNION :");
            logThree.openLog(SeLog.SE_READ_MODE);
            getLogInfo(logThree);

            /*
             *   Close and delete logThree
             */
            logThree.close();
            logThree.delete();

            System.out.println("\nINTERSECT of testlog2 and logTwoCopy ( Expected - 1, 2, 3, 4, 5, 11, 12, 13, 14, 15, 22 )");
            logThree = logTwo.combine(logTwoCopy.getName(), "logCombine",
                                      SeLog.SE_LOG_INTERSECT);

            System.out.print("\nResult of INTERSECT :");
            logThree.openLog(SeLog.SE_READ_MODE);
            getLogInfo(logThree);

            /*
             *   Close and delete logThree
             */
            logThree.close();
            logThree.delete();

            System.out.println("\nSYMDIFF of testlog2 and logTwoCopy( Expected - 6, 7, 8, 16, 17, 18, 19, 20, 23, 25 )");
            logThree = logTwo.combine(logTwoCopy.getName(), "logCombine",
                                      SeLog.SE_LOG_SYMDIFF);

            System.out.print("\nResult of SYMDIFF :");
            logThree.openLog(SeLog.SE_READ_MODE);
            getLogInfo(logThree);

            /*
             *   Close and delete logThree
             */
            logThree.close();
            logThree.delete();

            System.out.println(
                    "\nDIFFERENCE of testlog2 and logTwoCopy( Expected - 6, 7, 8, 16, 17, 18 )");
            logThree = logTwo.combine(logTwoCopy.getName(), "logCombine",
                                      SeLog.SE_LOG_DIFFERENCE);

            System.out.print("\nResult of DIFFERENCE :");
            logThree.openLog(SeLog.SE_READ_MODE);
            getLogInfo(logThree);

            /*
             *   Close and delete logThree
             */
            logThree.close();
            logThree.delete();

            /*
             *   UserOne deletes logTwo & logTwoCopy
             */
            try
            {
                logTwo.delete();
                logTwoCopy.delete();
            }
            catch (SeException se)
            {
                se.printStackTrace();
            }

        }
        catch (SeException se)
        {
            se.printStackTrace();
        }

    } // End makeLogCopy


    /**
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
    public void getLogInfo(SeLog log)
    {

        try
        {
            System.out.println("\nLog file info...");
            System.out.println("Log Name : " + log.getName());
            System.out.println("Log Id : " + log.getId().longValue());
            System.out.println("Log is persistent : " + log.isPersistent());

            SeLog.SeLogTargetInfo target = log.getTargetInfo();
            if (target.spatialColumn != null)
            {
                System.out.println(target.spatialColumn);
            }
            else
            {
                System.out.println("Target spatialCols null!");
            }

            if (target.type == SeLog.SE_LOG_FOR_TABLE)
            {
                System.out.print("Target : Table - ");
            }
            else if (target.type == SeLog.SE_LOG_FOR_LAYER)
            {
                System.out.print("Target : Layer - ");
            }

            if (target.tableName != null)
            {
                System.out.println(target.tableName);
            }
            else
            {
                System.out.println("Target name null!");
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
     *   Retrieves the following information about the log file:
     *   - The name of the log file.
     *   - The id no of the log file.
     *   - Whether this log file is persistent or not.
     *   - Information about the logfile's target:
     *       * The name of the target table/layer.
     *       * The name of the target spatial column if the target is a layer.
     *   - No of rows of data stored in the log file.
     *   - The row ids of the data stored in the log file.
     *   - The actual feature data from the layer the log file is associated with.
     */
    public void getLogInfoWithData(SeLog log)
    {

        try
        {
            System.out.println("\nLog file info...");
            System.out.println("Log Name : " + log.getName());
            System.out.println("Log Id : " + log.getId().longValue());
            System.out.println("Log is persistent : " + log.isPersistent());

            SeLog.SeLogTargetInfo target = log.getTargetInfo();
            if (target.spatialColumn != null)
            {
                System.out.println(target.spatialColumn);
            }
            else
            {
                System.out.println("Target spatialCols null!");
            }

            if (target.type == SeLog.SE_LOG_FOR_TABLE)
            {
                System.out.print("Target : Table - ");
            }
            else if (target.type == SeLog.SE_LOG_FOR_LAYER)
            {
                System.out.print("Target : Layer - ");
            }

            if (target.tableName != null)
            {
                System.out.println(target.tableName);
            }
            else
            {
                System.out.println("Target name null!");
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
            retrieveData(log);
        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

    } // End method getLogInfoWithData


    /*
     *   Retrieves the rows from the layer corresponding to the
     *   feature_id entries in the logfile.
     */
    public void retrieveData(SeLog log)
    {

        System.out.println("\n--> Retrieving Layer Data...");
        SeQuery query = null;
        try
        {
            SeSqlConstruct sqlConstruct = null;
            String tableName = layer.getName();
            sqlConstruct = new SeSqlConstruct(tableName);
            SeTable table1 = new SeTable(userOneConn, tableName);
            SeColumnDefinition[] tableDef = table1.describe();
            String[] cols = new String[tableDef.length];

            for (int i = 0; i < cols.length; i++)
            {
                cols[i] = tableDef[i].getName();
            }

            SeRow row = null;
            SeColumnDefinition colDef = new SeColumnDefinition();
            query = new SeQuery(userOneConn, cols, sqlConstruct);
            // The specified log file identifies which features from the layer
            // the query will process.
            query.prepareQueryLogfile(log.getName());

            query.execute();
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

                        case SeColumnDefinition.TYPE_SMALLINT:
                            System.out.println("\t" + colDef.getName() + " : " +
                                               row.getShort(i));
                            break;

                        case SeColumnDefinition.TYPE_DATE:
                            System.out.println("\t" + colDef.getName() + " : " +
                                               row.getDate(i));
                            break;

                        case SeColumnDefinition.TYPE_INTEGER:
                            System.out.println("\n\t" + colDef.getName() +
                                               " : " + row.getInteger(i));
                            break;

                        case SeColumnDefinition.TYPE_FLOAT:
                            System.out.println("\t" + colDef.getName() + " : " +
                                               row.getFloat(i));
                            break;

                        case SeColumnDefinition.TYPE_DOUBLE:
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
                            break;
                        } // End switch
                    } // End if
                } // End for
                row = query.fetch();
            } // End while
            query.close();
        }
        catch (SeException e)
        {
            try
            {
                query.close();
            }
            catch (SeException se)
            {
                se.printStackTrace();
            }
            System.out.println(e.getSeError().getErrDesc());
            e.printStackTrace();
        }

    } // End method retrieveData


    /*
     *   Creates an ArcSDE table, TABLE_NAME, spatially enables it.
     */
    public SeLayer createBaseLayer(String storageKey)
    {

        SeLayer layer = new SeLayer(userOneConn);
        SeTable table = null;
        try
        {

            System.out.println("\n--> Creating the base table...");
            table = Util.createTable(userOneConn, storageKey, TABLE_NAME, null);

            String tableName = table.getQualifiedName();

            /*
             *   Registers the layer giving it a new column called
             *   OBJECTID maintained by the ArcSDE server so that logfiles
             *   can be created for this layer.
             */
            Util.registerTable(userOneConn, tableName);

            layer = new SeLayer(userOneConn);
            layer.setTableName(tableName);
            layer.setDescription("Test Layer");
            layer.setCreationKeyword(storageKey);
            System.out.println("\n--> Spatially enabling the table...");
            Util.createLayer(layer, 5, 4);

        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

        return layer;

    } // End method createBaseTable


    /*
     *   Inserts MAX_ROWS rows of data into the base table.
     *   Values inserted:
     *   Col            Type    Value
     *   integer_val    Int      1->MAX_ROWS
     *   short_val      Short    1/2
     *   float_val      Float    3
     *   double_val     Double   4
     *   date_val       Date
     *   string_val     String
     *   shape          rectangles
     */
    public void insertData()
    {

        // Insert Data into table...
        SeInsert insert = null;
        try
        {
            insert = new SeInsert(userOneConn);
        }
        catch (SeException se)
        {
            se.printStackTrace();
        }
        String[] columns = new String[7];
        // Integer data type
        columns[0] = Util.INT_COL_NAME;
        // Small int data type
        columns[1] = Util.SHORT_COL_NAME;
        // float data type
        columns[2] = Util.FLOAT_COL_NAME;
        // double data type
        columns[3] = Util.DOUBLE_COL_NAME;
        // String data type
        columns[4] = Util.STRING_COL_NAME;
        // Date data type
        columns[5] = Util.DATE_COL_NAME;
        // Shape column
        columns[6] = Util.SHAPE_COL_NAME;

        Calendar cal = Calendar.getInstance();
        cal.set(1999, 00, 01, 13, 58, 55);

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
                cal.roll(Calendar.MONTH, true);
                cal.roll(Calendar.HOUR, true);
                cal.roll(Calendar.MINUTE, true);
                cal.roll(Calendar.SECOND, true);

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
                //      System.out.println("\n Inserted row id " + rowIds[(count-1)].longValue() );
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
     *  Retrieves the list of log files owned by a user.
     */
    public void getLogList(SeConnection conn, String user)
    {

        try
        {
            SeLog[] logList = conn.getLogfileList(user);
            System.out.println("\nList of log files owned by " + user);
            if (logList != null)
            {
                for (int i = 0; i < logList.length; i++)
                {
                    System.out.print(logList[i].getName() + "\t");
                }
            }
            else
            {
                System.out.print(user + " does not own any logfile.");
            }
            System.out.println();
        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

    } // End getLogList

} // End Logfile
