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
*                       ** TableCreateExample2.java **
* Purpose:
* Demonstrates
*  - Table creation, rename and delete operations.
*  - Tests use of SeColumnDefinition methods.
*  - Use of column add/drop options.
*------------------------------------------------------------------------------
* Usage: java TableCreateExample2 {server} {instance} {database} {user} {passwd}
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
package com.dien.sde;

import com.esri.sde.sdk.client.SeColumnDefinition;
import com.esri.sde.sdk.client.SeConnection;
import com.esri.sde.sdk.client.SeError;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeTable;


public class TableCreateExample2 {

    public static SeColumnDefinition colDefs[] = new SeColumnDefinition[7];

    public static void main(String[] args) {

        String server="", database="none", user="", password="";
        String instance = "";

        /*
        *   Process command line arguements
        */
        if( args.length == 5 ) {
            server = args[0];
            instance = args[1];
            database = args[2];
            user = args[3];
            password = args[4];
        } else {
            System.out.println("Invalid number of arguments");
            System.out.println("Usage: \n java TableCreateExample2 {server} {instance} {database} {user} {passwd}");
            System.exit(0);
        }

        try {
            System.out.println("Connecting...");
            /*
            *   Connect to ArcSDE server
            */
            SeConnection connection = new SeConnection( server, instance, database, user, password );
            System.out.println("Connected");
            
            
            
            System.out.println("\n--> Test SeTable constructors: empty table name..");
            try {
                // Create a table with empty tablename argument using SeTable constructor 1
                SeTable table = new SeTable( connection, "" );

            } catch ( SeException se ) {
                // Check if valid Sde error is thrown
                if( se.getSeError().getSdeError() == SeError.SE_INVALID_PARAM_VALUE )
                    System.out.println(" - OK");
                else Util.printError(se);
            }
            
            /*
            *   Perform tests
            */
            testSeTable( connection, database );
            connection.close();
        } catch( SeException e) {
            Util.printError(e);
        }

    } // End main

    /*
    *   Main function that tests the SeTable constructors and class methods
    */
    public static void testSeTable( SeConnection conn, String database ){

        /*
        *   Create a qualified table name with current user's name and
        *   the string constant "TESTTABLE".
        */
        String tableName = null;
        try {
            tableName = (conn.getUser() + ".TESTTABLE");
        }catch ( SeException e ) {
            Util.printError(e);
        }

        // Variable Declarations for two tables that will be created during tests
        SeTable table = null;
        SeTable table2 = null;

        SeTable[] tables = {table, table2};

        /*
        *   Test SeTable constructors
        */
        System.out.println("\n--> Test SeTable constructors: empty table name..");
        try {
            // Create a table with empty tablename argument using SeTable constructor 1
            table = new SeTable( conn, "" );
            exitEarly("Successfully created table with empty name.", table, table2);
        } catch ( SeException se ) {
            // Check if valid Sde error is thrown
            if( se.getSeError().getSdeError() == SeError.SE_INVALID_PARAM_VALUE )
                System.out.println(" - OK");
            else Util.printError(se);
        }
        try {
            // Create a table with empty tablename argument using SeTable constructor 2
            table2 = new SeTable( conn, database, conn.getUser(), "");
            exitEarly("Successfully created table with empty name.", table, table2);
        } catch ( SeException se ) {
            // Check if valid Sde error is thrown
            if( se.getSeError().getSdeError() == SeError.SE_INVALID_PARAM_VALUE )
                System.out.println(" - OK");
            else Util.printError(se);
        }

        System.out.println("\n--> Test SeTable constructors: null table name");
        try {
            // Create a table with null tablename using SeTable constructor 1
            table = new SeTable( conn, null );
            exitEarly("Successfully created table with null name.", table, table2);
        } catch ( SeException se ) {
            // Check if valid Sde error is thrown
            if( se.getSeError().getSdeError() == SeError.SE_INVALID_PARAM_VALUE )
                System.out.println(" - OK");
            else Util.printError(se);
        }
        try {
            // Create a table with null tablename using SeTable constructor 2
            table2 = new SeTable( conn, database, conn.getUser(), null);
            exitEarly("Successfully created table with null name.", table, table2);
        } catch ( SeException se ) {
            // Check if valid Sde error is thrown
            if( se.getSeError().getSdeError() == SeError.SE_INVALID_PARAM_VALUE )
                System.out.println(" - OK");
            else Util.printError(se);
        }


        System.out.println("\n--> Test SeTable constructors: null connection handle...");
        try {
            // Create a table with null connection handle using SeTable constructor 1
            table = new SeTable( null, "TEST" );
            exitEarly("Successfully created table with null connection handle.",table, table2);
        } catch ( SeException se ) {
            // Check if valid Sde error is thrown
            if( se.getSeError().getSdeError() == SeError.SE_INVALID_PARAM_VALUE )
                System.out.println(" - OK");
            else Util.printError(se);
        }
        try {
            // Create a table with null connection handle using SeTable constructor 2
            table2 = new SeTable( null, database, conn.getUser(), "TEST");
            exitEarly("Successfully created table with null connection handle.", table, table2);
        } catch ( SeException se ) {
            // Check if valid Sde error is thrown
            if( se.getSeError().getSdeError() == SeError.SE_INVALID_PARAM_VALUE )
                System.out.println(" - OK");
            else Util.printError(se);
        }

        System.out.println("\n--> Test SeTable constructor 2: null database...");
        try {
            // Create a table with null database using SeTable constructor 2
            table2 = new SeTable( conn, null, conn.getUser(), "TEST");
            System.out.println(" - OK");
        } catch ( SeException se ) {
            Util.printError(se);
        }

        /*
        *   Create two table objects with valid arguments to perform other tests
        *   Table 1 : TESTTABLE
        *   Table 2 : TESTTABLE2
        */
        try {
            System.out.println("\n--> Create tables...");
            // Test SeTable constructor 1
            table = new SeTable( conn, tableName );
            // Test SeTable constructor 2
            table2 = new SeTable( conn, database, conn.getUser(), "TESTTABLE2");
            System.out.println(" - OK");
        } catch ( SeException se ) {
            Util.printError(se);
        }

        // Define variables to use in creating SeColumnDefinitions
        boolean isNullable = true;
        int size = 0;
        int scale = 0;

        /*
        *   Test SeTable.create() method
        *
        *   Test SeTable.create() for invalid column definitions...
        */
        SeColumnDefinition invColDefs[] = new SeColumnDefinition[1];
        System.out.println("\n--> Checking errors for Invalid Column Defs...");
        try {
            // Test SeTable.create(): Empty column name
            invColDefs[0] = new SeColumnDefinition( "", SeColumnDefinition.TYPE_INTEGER, 10, 0, isNullable);
            exitEarly("Successfully created table with empty column name.", table, table2);
        }catch(SeException se) {
            // Check if valid Sde error is thrown
           if( se.getSeError().getSdeError() == SeError.SE_INVALID_PARAM_VALUE )
                System.out.println(" - OK ");
           else
                Util.printError(se);
        }

        try {
            // Test SeTable.create(): Null column name
            invColDefs[0] = new SeColumnDefinition( null, SeColumnDefinition.TYPE_INTEGER, 10, 0, isNullable);
            exitEarly("Successfully created table with null column name.", table, table2);
        }catch(SeException se) {
            // Check if valid Sde error is thrown
           if( se.getSeError().getSdeError() == SeError.SE_INVALID_PARAM_VALUE )
                System.out.println(" - OK ");
           else
                Util.printError(se);
        }

        /*
        *   Get ready to create two tables in the SDE Database to continue with testing...
        */

        deleteTables(table, table2);

        /*
        *   Define columns for the tables..
        */
        System.out.println("\n--> Creating valid Col definition...");
        try {
            colDefs[0] = new SeColumnDefinition( "TestCol1", SeColumnDefinition.TYPE_INTEGER, 10, 0, isNullable);
            colDefs[1] = new SeColumnDefinition( "TestCol2", SeColumnDefinition.TYPE_SMALLINT, 4, 0, isNullable);
            colDefs[2] = new SeColumnDefinition( "TestCol3", SeColumnDefinition.TYPE_FLOAT, 5, 3, isNullable);
            colDefs[3] = new SeColumnDefinition( "TestCol4", SeColumnDefinition.TYPE_DOUBLE, 15, 4, isNullable);
            colDefs[4] = new SeColumnDefinition( "TestCol5", SeColumnDefinition.TYPE_STRING, size, scale, isNullable);
            colDefs[5] = new SeColumnDefinition( "TestCol6", SeColumnDefinition.TYPE_BLOB, size, scale, isNullable);
            colDefs[6] = new SeColumnDefinition( "TestCol7", SeColumnDefinition.TYPE_DATE, size, scale, isNullable);
        } catch ( SeException se ) {
            Util.printError(se);
        }

        try{
            SeColumnDefinition columnDef = (SeColumnDefinition)colDefs[1].clone();
            System.out.println(" Col Name  " + columnDef.getName() );
            System.out.println("Qualified Col  " + table2.qualifyColumn(columnDef.getName()) );
            System.out.println(" Col Scale " + columnDef.getScale() );
            System.out.println(" Col Size  " + columnDef.getSize() );
            System.out.println(" Col Type  " + columnDef.getType()  );
            System.out.println(" Row Type  " + columnDef.getRowIdType() );
            System.out.println(" Def.  " + columnDef.toString() );
        } catch ( SeException se ) {
            Util.printError(se);
        } catch( CloneNotSupportedException e ) {
            e.printStackTrace();
        }


        // Test SeTable.create() : valid column defs but invalid config key
        System.out.println("\n--> Test create table with invalid configuration Keyword");
        try {
            table.create( colDefs, "configKeyword");
            exitEarly("Successfully created table with invalid config keyword!", table, table2);
        } catch ( SeException se ) {
            if( SeError.SE_INVALID_LAYER_KEYWORD != se.getSeError().getSdeError() ){
                Util.printError(se);
            }
            else {
                System.out.println(" - OK");
            }
        }

        /*
        *   Create the two tables to use for testsing
        *   Use DBMS default config keyword
        *   Valid config keywords are found in the dbtune.sde file
        */
        try {
            System.out.println("\n--> Create tables using DBMS Default Keyword");
            table.create( colDefs, "" );
            table2.create(colDefs, "");
            System.out.println(" - OK");
        } catch ( SeException se ) {
            Util.printError(se);
        }

        /*
        *   Retrieve the attributes of the new tables that were created
        */
        Util.getTableAttr(table);
        Util.getTableAttr(table2);

        /*
        *   Test SeTable.create : Already existing table
        */
        try {
            System.out.println("\n--> Test create table with name that already exists! ");
            table2.create( colDefs, "" );
            exitEarly("Successfully created table with a table name that already exists!", table, table2);
        } catch ( SeException se ) {
            if( SeError.SE_TABLE_EXISTS == se.getSeError().getSdeError() )
                System.out.println(" - OK");
            else Util.printError(se);
        }

        /*
        * Tests that Add, delete cols
        */
        colTests(conn, table2);

        /*
        * Test table's rename options
        */
        renameTable(table);

        /*
        *   Clean Up : Delete the test tables
        */
        System.out.println("\n--> Deleting test table1...");
        try {
            table.delete();
        } catch ( SeException sexp ) {
            Util.printError(sexp);
        }

        try {
            // Confirm delete
            table.describe();
        } catch ( SeException sexp ) {
            // Check if valid Sde error is thrown
            if( sexp.getSeError().getSdeError() != SeError.SE_TABLE_NOEXIST )
                Util.printError(sexp);
            else System.out.println(" - OK");
        }

        System.out.println("\n--> Deleting test table2...");
        try {
            table2.delete();
        } catch ( SeException sexp ) {
            Util.printError(sexp);
        }
        try {
            // Confirm delete
            table2.describe();
        } catch ( SeException sexp ) {
            // Check if valid Sde error is thrown
            if( sexp.getSeError().getSdeError() != SeError.SE_TABLE_NOEXIST )
                Util.printError(sexp);
            else System.out.println(" - OK");
        }

        /*
        *   Try deleting a table that doesn't exist
        */
        try {
            System.out.println("\n--> Test delete table that doesn't exist");
            table.delete();
            System.out.println("\nNON EXISTENT  table Deleted!??");
        } catch ( SeException sexp ) {
            // Check if valid Sde error is thrown
            if( sexp.getSeError().getSdeError() != SeError.SE_TABLE_NOEXIST ) {
                Util.printError(sexp);
            }
            else System.out.println(" - OK");
        }

    } // End method testSeTable

    /*
    *   Tests the rename options on the table
    */
    public static void renameTable( SeTable table ) {

        // Rename the test table 1 with a name already in use ...
        try {
            System.out.println("\n--> Attempting to rename table to existing name");
            table.rename( "TESTTABLE2");
        } catch ( SeException se ) {
            int errorNo = se.getSeError().getSdeError();
            if( errorNo == SeError.SE_TABLE_EXISTS )
                System.out.println(" - OK");
            else if( errorNo == SeError.SE_DBMS_DOES_NOT_SUPPORT )
                System.out.println(" - OK");
            else
                Util.printError(se);
        }

        // Rename the test table ..
        try {
            System.out.println("\n--> Renaming table1 to new name..");
            table.rename( "TESTTABLE1");
        } catch ( SeException se ) {
            int errorNo = se.getSeError().getSdeError();
            if( errorNo == SeError.SE_TABLE_EXISTS )
                System.out.println(" - OK");
            else if( errorNo == SeError.SE_DBMS_DOES_NOT_SUPPORT )
                System.out.println(" - OK");
            else
                Util.printError(se);
        }

        // Verify that the table name has been altered...
        if( table.getName().equals( "TESTTABLE1") )
            System.out.println(" - OK");
        else
            System.out.println(" Rename unsuccessful! ");

        return;
    } // end renameTable

    /*
    *   Tests SeTable's add, drop column methods.
    */
    public static void colTests(SeConnection con, SeTable table2 ) {

        // Drop cols from the new test table...
        System.out.println("\n--> Dropping cols 1,2,4,7 from table2...");
        try {
            table2.dropColumn("TESTCOL2");
            table2.dropColumn("TESTCOL1");
            table2.dropColumn("TESTCOL7");
            table2.dropColumn("TESTCOL4");
            System.out.println(" - OK");
        } catch ( SeException se ) {
            if( SeError.SE_DBMS_DOES_NOT_SUPPORT == se.getSeError().getSdeError() )
                System.out.println(" - OK");
            else Util.printError(se);
        }

        // check if the columns have been dropped from the table
/*
*   **  Does not work for a few databases that do not support column drop function  **
*/
      try {
            SeColumnDefinition columnDef[] = table2.describe();
            System.out.println("Table columns "   );
            for( int i = 0 ; i < columnDef.length ; i++ ) {

                System.out.println("Column " + (i+1) + " Col Name  " + columnDef[i].getName() );
                System.out.println("Qualified Col  " + table2.qualifyColumn(columnDef[i].getName()) );
                System.out.println("Column " + (i+1) + " Col Scale " + columnDef[i].getScale() );
                System.out.println("Column " + (i+1) + " Col Size  " + columnDef[i].getSize() );
                System.out.println("Column " + (i+1) + " Col Type  " + columnDef[i].getType() + " -> " + Util.resolveType( columnDef[i].getType() ) );
                System.out.println("Column " + (i+1) + " Row Type  " + columnDef[i].getRowIdType() + " -> " + Util.resolveIdType( columnDef[i].getRowIdType() ) );
                System.out.println("Column " + (i+1) + " Def.  " + columnDef[i].toString() );
            }
        } catch ( SeException se ) {
            Util.printError(se);
        }

        // Attempt to Drop col that does not exist...
        try {
            System.out.println("\n--> Deleting columns that doesn't exist!");
            table2.dropColumn("TESTCOL100");
        } catch ( SeException e ) {
            int errorNo = e.getSeError().getSdeError();
            if( errorNo == SeError.SE_ATTR_NOEXIST )
                System.out.println(" - OK");
            else if( errorNo == SeError.SE_DBMS_DOES_NOT_SUPPORT )
                System.out.println(" - OK");
            else Util.printError(e);
        }

        // Add new column to test table...
        System.out.println("\n-->Adding new column to test table...");
        try {
            colDefs[1] = new SeColumnDefinition( "TestColNew", SeColumnDefinition.TYPE_SMALLINT, 4, 0, true);
            table2.addColumn( colDefs[1] );
            System.out.println(" - OK");
        } catch ( SeException sexp ) {
            Util.printError(sexp);
        }

        // Add column with a name that already exists..
        System.out.println("\n-->Adding column that already exists...");
        try {
            table2.addColumn( colDefs[4] );
        } catch ( SeException sexp ) {
            SeError error = sexp.getSeError();
            // For databases that allow column add/drop function
	    // 2705 is the error returned from Sqlserver
            if( error.getSdeError() == SeError.SE_COLUMN_EXISTS || error.getExtError() == 2705 )
                System.out.println(" - OK");
            else {
                Util.printError(sexp);
            }
        }

        // Display altered table cols
// %%% col add Doesn't work for all databases
      try {
            SeColumnDefinition columnDef[] = table2.describe();
            System.out.println("Table columns "   );
            for( int i = 0 ; i < columnDef.length ; i++ ) {

                System.out.println("Column " + (i+1) + " Col Name  " + columnDef[i].getName() );
                System.out.println("Qualified Col  " + table2.qualifyColumn(columnDef[i].getName()) );
                System.out.println("Column " + (i+1) + " Col Scale " + columnDef[i].getScale() );
                System.out.println("Column " + (i+1) + " Col Size  " + columnDef[i].getSize() );
                System.out.println("Column " + (i+1) + " Col Type  " + columnDef[i].getType() + " -> " + Util.resolveType( columnDef[i].getType() ) );
                System.out.println("Column " + (i+1) + " Row Type  " + columnDef[i].getRowIdType() + " -> " + Util.resolveIdType( columnDef[i].getRowIdType() ) );
                System.out.println("Column " + (i+1) + " Def.  " + columnDef[i].toString() );
            }
        } catch ( SeException se ) {
            Util.printError(se);
        }

    } // end method colTests


    /*
     *  Deletes the specified tables
     */
    private static void deleteTables(SeTable tableToDelete1, SeTable tableToDelete2){
        SeTable[] tables = {tableToDelete1, tableToDelete2};
        for (int i = 0; i < tables.length; i++){
            try {
                if (tables[i] != null){
                    tables[i].delete();
                }
            } catch( SeException e) {}
        }
    }

    /*
     *  Exits the test early making sure to first delete any leftover
     *  tables and prints an infomative error message
     */
    private static void exitEarly(String msg, SeTable t1, SeTable t2){
        System.out.println(" - ERROR: " + msg + "??");
        deleteTables(t1, t2);
        System.out.println("\nExiting the test prematurely.");
        System.exit(0);
    }

} // End Class TableCreateExample2
