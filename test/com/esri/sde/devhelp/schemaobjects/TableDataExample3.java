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

/**------------------------------------------------------------------------------
*                       ** TableDataExample3.java **
* Purpose:
* Demonstrates
*  - Inserting, Deleting, and Update of Attribute data in Tables
*  - Use of SeTable.SeTableStats
*------------------------------------------------------------------------------
* Usage: java TableDataExample3 {server} {instance} {database} {user} {passwd}
*
* Command line Arguments:
*       Argument     Data Type
*   1. Server Name   (String)
*   2. Instance      (Integer)
*   3. Database Name (String)  <- Optional
*   4. User Name     (String)
*   5. Password      (String)
 ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
 * This Java sample demonstrates usage of ArcSDE API. It will not execute successfully until the user
 * supplies valid ArcSDE Server details such as server name, port number, database name, user, pwd, and valid
 * data, if required.
 **************************************************************************/
package com.esri.sde.devhelp.schemaobjects;

import com.esri.sde.sdk.client.*;
import java.util.*;
import java.io.*;
import com.esri.sde.devhelp.Util;

public class TableDataExample3 {

    private SeConnection conn = null;
    private String QA_TABLE_NAME = "QA_TBLDATA_";
    private SeTable table = null;
    private static int displayOptions = Util.DISPLAY_ATTR_DATA;
    private static SeColumnDefinition[] colDefs = null;


    public static void main(String[] args) {
        TableDataExample3 test = new TableDataExample3(args);
    }

    public TableDataExample3(String[] args ) {

        String server="", database="none", user="", passwd="";
        String instance = "";

        /*
         *   Process command line arguements
         */
        if( args.length == 5 ) {
            server = args[0];
            instance = args[1];
            database = args[2];
            user = args[3];
            passwd = args[4];
        } else {
            System.out.println("Invalid number of arguments");
            System.out.println("Usage: \n java TableDataExample3 {server} {instance} {database} {user} {passwd}");
            System.exit(0);
        }
        try {
            System.out.println("Connecting...");
            conn = new SeConnection( server, instance, database, user, passwd );
            System.out.println("Connected");

            table = Util.createTable(conn, "DEFAULTS", QA_TABLE_NAME, null);

            QA_TABLE_NAME = table.getQualifiedName();

            colDefs = table.describe();

            /*
             *   Performs the data tests
             */
            dataTests();

                /*
                 *   Get Table Statistics
                 */
            getTableStats();

                /*
                 *   Clean Up : Delete the test table
                 */
            System.out.println("\n--> Deleting test table...");
            try {
                table.delete();
                System.out.println(" - OK");
            } catch ( SeException sexp ) {
                Util.printError(sexp);
            }

            try {
                // Confirm delete
                System.out.println("\n--> Confirm Delete...");
                table.describe();
            } catch ( SeException sexp ) {
                if( sexp.getSeError().getSdeError() != SeError.SE_TABLE_NOEXIST )
                    Util.printError(sexp);
                else System.out.println(" - OK");
            }

            conn.close();

        } catch( SeException e) {
            Util.printError(e);
        }
    } // End main




    /*
     *   Tests the insertion, deletion and update of
     *   data to the business table.
     */
    public void dataTests() throws SeException {

        System.out.println("\n--> Testing insert/delete/modify..");

        /*
         *   Try inserting data into the base table
         */
        insertData();
        insertData2();

        String tableName = table.getName();

        /*
         *   Retrieve all the rows of the table
         */
        Util.fetchAllColumns(conn, tableName, displayOptions, "");

        /*
         *   Truncate table
         *   Deletes all the data in the table but leaves
         *   the table definition intact
         */
        try {
            System.out.println("\n--> Truncating table...");
            table.truncate();
        } catch( SeException se ) {
            Util.printError(se);
        }

        // Verify that all the data has been removed
        Util.fetchAllColumns(conn, tableName, displayOptions, "");

        // Verify that the table definition is still intact
        System.out.println("\n--> Retrieving table attributes...");
        Util.getTableAttr(table);

        /*
         *   Insert data into the base table
         */
        insertData();
        insertData();

        /*
         *   Make changes to data in the table
         */
        updateData();

        /*
         *   Delete data using a where clause
         */
        SeDelete delete = null;
        try {
            delete = new SeDelete(conn);
        } catch( SeException se )  {
            Util.printError(se);
        }
        try {
            System.out.println("--> Deleting rows where int_val = 2");
            delete.fromTable(table.getQualifiedName(), Util.INT_COL_NAME + " > 2");
        } catch( SeException se )  {
            Util.printError(se);
        }

        /*
         *   Retrieve all the rows of the table to
         *   verify delete by where clause
         */
        Util.fetchAllColumns(conn, tableName, displayOptions, "");

        /*
         *   Truncate table
         *   Deletes all the data in the table but leaves
         *   the table definition intact
         */
        try {
            System.out.println("\n--> Truncating table...");
            table.truncate();
        } catch( SeException se ) {
            Util.printError(se);
        }

        //  ***     End TESTS       ***

    } //End dataTests




    /*
     *   Test data update
     */
    public void updateData() {

        SeUpdate update = null;
        try {
            update = new SeUpdate(conn);
        } catch( SeException se )  {
            Util.printError(se);
        }
        String[] columns = new String[6];
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

        System.out.println("\n--> Updating Data in table... ");
        System.out.println("\n--> Changing int value 1 to 1000");
        try {
            String whereClause = new String(Util.INT_COL_NAME + " = 1");
            update.toTable(table.getName(), columns, whereClause);
            update.setWriteMode(true);
            SeRow row = update.getRowToSet();
            Integer testInt = new Integer(1000);
            short testShort = 1;
            Float testFloat = new Float(0.0);
            Double testDouble = new Double(0.0);
            Date date = new Date(10000);
            row.setInteger(0, testInt);
            row.setShort(1,new Short(testShort));
            row.setFloat(2, testFloat);
            row.setDouble(3, testDouble);
            row.setString(4,"Updated SValue");
            row.setDate(5,date);
            update.execute();
            update.close();

        } catch( SeException se )  {
            Util.printError(se);
        }

    } // End method updateData




    /*
     *   Inserts 5 rows of data into the base table.
     *   Values inserted:
     *   Col         Type    Value
     *   int_col    Int      0->4
     *   short_col    Short    1/2
     *   float_col    Float    3
     *   double_col    Double   4
     *   date_col    Date
     *   string_col    String  "SValue"
     */
    public void insertData() {

        // Insert Data into table...
        SeInsert insert = null;
        try {
            insert = new SeInsert(conn);
        } catch( SeException se )  {
            Util.printError(se);
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
        // BLOB data type
        columns[6] = colDefs[6].getName();

        Calendar cal = Calendar.getInstance();
        cal.set(1798,00,01,1,2,3);

        System.out.println("\n--> Inserting Data into table... ");
        try {
            insert.intoTable(table.getName(), columns);
            insert.setWriteMode(true);
            for( int count = 1 ; count <= 5 ; count++){
                SeRow row = insert.getRowToSet();
                Integer testInt = new Integer(count%5);
                short testShort = (short)(count%2 + 1);
                Float testFloat = new Float(3.0);
                Double testDouble = new Double(4.0);
                Date date = new Date(100000);
                row.setInteger(0, testInt);
                row.setShort(1,new Short(testShort));
                row.setFloat(2, testFloat);
                row.setDouble(3, testDouble);
                row.setString(4,"Svalue");
                row.setDate(5, cal.getTime() );
                cal.roll(Calendar.YEAR, true);

                byte[] buf = new byte[5];
                buf[1] = 1;
                buf[2] = 2;
                buf[3] = 3;
                buf[4] = 4;
                buf[0] = 5;
                ByteArrayInputStream blobData = new ByteArrayInputStream(buf);
                row.setBlob(6, blobData);

                insert.execute();
            }
            insert.close();
        } catch( SeException se )  {
            Util.printError(se);
        }

    } // End insertData




    /*
     *   Inserts 1 row of data into the base table.
     *   Values inserted:
     *   Col         Type    Value
     *   int_col    Int      6
     *   short_col    Short    1
     *   float_col    Float    3
     *   double_col    Double   4
     *   date_col    Date  100000 milliseconds since January 1, 1970, 00:00:00.
     *   string_col    String  "SValue"
     */
    public void insertData2() {

        // Insert Data into table...
        SeInsert insert = null;
        try {
            insert = new SeInsert(conn);
        } catch( SeException se )  {
            Util.printError(se);
        }
        String[] columns = new String[6];
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

        System.out.println("\n--> Inserting Data into table... ");
        try {
            insert.intoTable(table.getName(), columns);
            insert.setWriteMode(true);
            SeRow row = insert.getRowToSet();
            Integer testInt = new Integer(6);
            short testShort = 1;
            Float testFloat = new Float(3.0);
            Double testDouble = new Double(4.0);
            Calendar cal = Calendar.getInstance();
            cal.set(1998,00,01,0,0,0);

            //            row.setInteger(0, testInt);
            row.setInteger(0, null);
            //            row.setShort(1,new Short(testShort));
            row.setShort(1, null);
            //            row.setFloat(2, testFloat);
            row.setFloat(2, null);
            row.setDouble(3, testDouble);
            row.setString(4,"insertData2");
            row.setDate(5, cal.getTime() );

            cal.roll(Calendar.MONTH, true);

            insert.execute();

            insert.close();
        } catch( SeException se )  {
            Util.printError(se);
        }

    } // End insertData




    public void getTableStats() {

        /*
         *   Insert data into the base table
         */
        insertData();

        System.out.print("\nGetting table stats...\n");
        SeTable.SeTableStats tableStats = null;
        try {

            SeSqlConstruct sqlCons = new SeSqlConstruct(table.getQualifiedName());
            sqlCons.setWhere("");
            SeQuery query = new SeQuery(conn);
            SeQueryInfo queryInfo = new SeQueryInfo();
            queryInfo.setConstruct( sqlCons );
            int mask = SeTable.SeTableStats.SE_ALL_STATS;
            int maxDistinct = 0;

            System.out.println( colDefs[0].getName() + " - " + Util.resolveType(colDefs[0].getType()) );
            tableStats = query.calculateTableStatistics(colDefs[0].getName(), mask, queryInfo, maxDistinct);
            displayStats( tableStats );
            /*
             *   Insert data into the base table
             */
            insertData();
            System.out.println("\n" + colDefs[0].getName() + " - " + Util.resolveType(colDefs[0].getType()) );
            tableStats = query.calculateTableStatistics(colDefs[0].getName(), mask, queryInfo, maxDistinct);
            displayStats( tableStats );

            System.out.println("\n" + colDefs[1].getName() + " - " + Util.resolveType(colDefs[1].getType()) );
            tableStats = query.calculateTableStatistics(colDefs[1].getName(), mask, queryInfo, maxDistinct);
            displayStats( tableStats );

            System.out.println("\n" + colDefs[2].getName() + " - " + Util.resolveType(colDefs[2].getType()) );
            tableStats = query.calculateTableStatistics(colDefs[2].getName(), mask, queryInfo, maxDistinct);
            displayStats( tableStats );

            System.out.println("\n" + colDefs[3].getName() + " - " + Util.resolveType(colDefs[3].getType()) );
            tableStats = query.calculateTableStatistics(colDefs[3].getName(), mask, queryInfo, maxDistinct);
            displayStats( tableStats );

/* %%%
 *   Verify error for non -numeric column
            // Date column
                tableStats = query.calculateTableStatistics(colDefs[5].getName(), mask, queryInfo, maxDistinct);
                displayStats( tableStats );

                tableStats = query.calculateTableStatistics(colDefs[4].getName(), mask, queryInfo, maxDistinct);
                displayStats( tableStats );
 */

        }catch( SeException e) {
            Util.printError(e);
        }

    } // End method getTableStats




    public void displayStats(SeTable.SeTableStats tableStats){

        System.out.println("\n--> Table Statistics\n");
        if( tableStats != null ) {

            System.out.println("Average - " + tableStats.getAverage() );
            System.out.println("No of rows - " + tableStats.getCount() );
            System.out.println("Maximum Value - " + tableStats.getMax() );
            System.out.println("Minimum Value - " + tableStats.getMin() );
            System.out.println("No of distinct values - " + tableStats.getNumDistinct() );
            System.out.println("Standard Deviation - " + tableStats.getStdDev() );

            System.out.println("Distinct type - " + Util.resolveType(tableStats.getDistinctType()) );

            int[] distinctFreq = tableStats.getDistinctValueFrequencies();
            Vector distinctValues = tableStats.getDistinctValues();
            System.out.println("Distinct values & their frequencies : ");
            for( int i = 0 ; i < distinctFreq.length ; i++ )
                System.out.println( distinctValues.elementAt(i) + " - " + distinctFreq[i]);
        } // End if

    }// End displayStats

} // End Class TableDataExample3
