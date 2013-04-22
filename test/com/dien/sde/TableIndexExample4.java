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
*                       ** TableIndexExample4.java **
* Purpose:
* Demonstrates
*  - use and creation, delete of SeTable Index functions
*------------------------------------------------------------------------------
* Usage: java TableIndexExample4 {server} {instance} {database} {user} {passwd}
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


public class TableIndexExample4 {

    public static SeColumnDefinition colDefs[] = null;

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
            System.out.println("Usage: \n java TableIndexExample4 {server} {instance} {database} {user} {passwd}");
            System.exit(0);
        }

        try {
            System.out.println("Connecting...");
            SeConnection conn = new SeConnection( server, instance, database, user, password );
            System.out.println("Connected");

            /*
            *   Create a table "QA_TBLINDEX".
            */
            SeTable table = Util.createTable( conn, "DEFAULTS", "QA_TBLINDEX", null);

            /*
            *  Index Tests
            */
            indexTests(table, conn);

            /*
            *   Clean Up : Delete the test table
            */
            System.out.println("\nDeleting test table...");
            try {
                table.delete();
                System.out.println(" - OK");
            } catch ( SeException sexp ) {
                Util.printError(sexp);
            }

            try {
                // Confirm delete
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
     *   Tests the creation and deletion of indexes.
     */
    public static void indexTests( SeTable table, SeConnection conn ) {

        // Delete index if it already exists
        try{
            table.deleteIndex("index1");
        }catch( SeException se ) {         }

        /*
        *   Setting up properties for the index:
        *       - Index Name : "index1"
        *       - Column create index from : Testcol1
        *       - Is index Ascending? true
        *       - Are indexes unique? true
        */
        boolean unique = true;
        boolean ascending = true;
        String indexName = "index1";
        String colName = Util.INT_COL_NAME;

        /*
        *   Creating a new index on TestCol1
        */
        System.out.println("\n--> Creating a single index...");
        try {
            table.createIndex(colName, unique, ascending, "", indexName);
            System.out.println(" - OK ");
        }
        catch ( SeException se ) {
            Util.printError(se);
        }

        /*
        *   Retrieve information about all the tables indexes
        *   and verify creation of index1
        */
        getIndexInfo(table);

        /*
        *   Create 2 more indexes : index4 and index 5
        */
        // %%%I What happens when you pass in null/empty index Defs?
        System.out.println("\n--> Creating multiple indexes...");
        SeTable.SeTableIndexDefs[] index = new SeTable.SeTableIndexDefs[2];
        try{
            /*
            *   Set up properties for Index4
            *   Index 4: indexed on TestCol1 and TestCol7
            */
            index[0] = new SeTable.SeTableIndexDefs(conn);
            boolean[] asc = new boolean[2];
            asc[0] = true;
            asc[1] = false;
            index[0].setAscending(asc);
            String colNames[] = new String[2];
            colNames[0] = Util.INT_COL_NAME;
            colNames[1] = Util.DATE_COL_NAME;
            index[0].setColumnNames(colNames);
            index[0].setIndexName("Index4");
            index[0].setNumColumns((short)2);
            index[0].setUnique(true);

            /*
            *   Set up properties for Index5
            *   Index 5: Indexed on INT_VAL and SHORT_VAL
            */
            index[1] = new SeTable.SeTableIndexDefs(conn);
            asc[0] = false;
            asc[1] = true;
            index[1].setAscending(asc);
            String cNames[] = new String[2];
            cNames[0] = Util.INT_COL_NAME;
            cNames[1] = Util.SHORT_COL_NAME;
            index[1].setColumnNames(cNames);
            index[1].setIndexName("Index5");
            index[1].setNumColumns((short)2);
            index[1].setUnique(false);

        }catch( SeException se ) {
            Util.printError(se);
        }
        try {

            table.createIndexes( (short)2, index, "");
            System.out.println(" - OK ");
        }catch( SeException se ) {
            Util.printError(se);
        }

        /*
        *   Retrieve information about all the tables indexes.
        *   Confirm creation of indexes 4 and 5
        */
        getIndexInfo(table);

        /*
        *   Try deleting index1.
        */
        try{
            System.out.println("\n--> Deleting index1...");
            table.deleteIndex("INDEX1");
        }catch( SeException se ) {
            Util.printError(se);
        }

        /*
        *   Retrieve information about all the tables indexes.
        *   confirm that index1 has been deleted.
        */
        getIndexInfo(table);

    } // End indexTests



    /*
     *   Retrieves the attributes of all the tables indexes
     */
    public static void getIndexInfo( SeTable table ) {

        SeTable.SeTableIndexDefs[] indexDefs = null;
        try {
            System.out.println("\n--> Getting indexes for current table ");
            // Retrieve array of index definitions
            indexDefs = table.describeIndexes();
        } catch ( SeException se ) {
            Util.printError(se);
        }

        // Print out the properties of each index
        if( indexDefs != null )
            for( int count =0 ; count < indexDefs.length ; count++ ) {

            System.out.println("\nIndex Name  " + indexDefs[count].getIndexName().toUpperCase() );
            System.out.println("No of Cols  " + indexDefs[count].getnumColumns() );
            System.out.println("Unique?  " + indexDefs[count].getUnique() );
            boolean[] ascend = indexDefs[count].getAscending();
            for( int i = 0 ; i < indexDefs[count].getnumColumns() ; i++ )
                System.out.println("Ascending? " + ascend[i]);
            }
        else
            System.out.println("No index definitions on current table");

    } // End getIndexInfo

} // End Class TableIndexExample4
