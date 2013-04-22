package com.dien.sde;

import java.util.Vector;

import com.esri.sde.sdk.client.SeColumnDefinition;
import com.esri.sde.sdk.client.SeConnection;
import com.esri.sde.sdk.client.SeError;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeQuery;
import com.esri.sde.sdk.client.SeQueryInfo;
import com.esri.sde.sdk.client.SeSqlConstruct;
import com.esri.sde.sdk.client.SeTable;

public class TestTableExist {
    //private static final String LABYER_DESCRIPTION_TABLE = "DIEN_LABYER_DESCRIPTION";
    //private static final String LABYER_DESCRIPTION_TABLE = ManagerPointSymbol.DIEN_TABLE_POINTSYMBOL;
   // private static final String LABYER_DESCRIPTION_TABLE = ManagerTemplate.DIEN_TABLE_TEMPLATE;
    private static final String LABYER_DESCRIPTION_TABLE = "TF1";
    private static final String USER_TABLE = "DIEN_USER";

    public static SeColumnDefinition colDefs[] = new SeColumnDefinition[7];

    public static void main(String[] args) {

        String server="", database="none", user="", password="";
        String instance = "";
for(int i=0;i<1000;i++)
    System.out.println(System.currentTimeMillis());
        
        
        /*
        *   Process command line arguements
        */

            server = "192.168.0.178";
            instance = "5151";
            database = "sde_db";
            user = "sde";
            password = "sde";


        try {
            System.out.println("连接" +
            		"...");
            /*
            *   Connect to ArcSDE server
            */
            SeConnection connection = new SeConnection( server, instance, database, user, password );
            System.out.println("Connected");
            
            
            
            System.out.println("\n--> Test SeTable constructors: empty table name..");
            try {
                // Create a table with empty tablename argument using SeTable constructor 1
                SeTable table = new SeTable( connection, "tf113566647423221356761841525" );
                colDefs = table.describe();
                System.out.println("getStartId="+table.getIds(0).getStartId());
                System.out.println(colDefs.length);
                //getTableStats(LABYER_DESCRIPTION_TABLE,connection);
                //table = new SeTable( connection, USER_TABLE );
                //colDefs = table.describe();
                //System.out.println(colDefs.length);
                /*
                 * Store the names of all the table's columns in the String array cols. This array specifies the columns to be retrieved from the
                 * database.
                 */
                for (int i = 0; i < colDefs.length; i++) {
                    System.out.println(colDefs[i].getName().toUpperCase()+"="+colDefs[i].getType()+" row id= "+colDefs[i].getRowIdType());
                }
            } catch ( SeException se ) {
                // Check if valid Sde error is thrown
                if( se.getSeError().getSdeError() == SeError.SE_INVALID_PARAM_VALUE )
                    System.out.println(" - OK");
                else Util.printError(se);
            }
            

            connection.close();
        } catch( SeException e) {
            Util.printError(e);
        }

    } // End main
    
    public static void getTableStats(String tableName,SeConnection conn) {


        SeTable.SeTableStats tableStats = null;
        try {

            SeSqlConstruct sqlCons = new SeSqlConstruct(tableName);
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
    
    public static void displayStats(SeTable.SeTableStats tableStats){

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

}
