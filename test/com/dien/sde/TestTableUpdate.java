package com.dien.sde;

import java.util.Vector;

import com.esri.sde.sdk.client.SeColumnDefinition;
import com.esri.sde.sdk.client.SeConnection;
import com.esri.sde.sdk.client.SeCoordinateReference;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeExtent;
import com.esri.sde.sdk.client.SeLayer;
import com.esri.sde.sdk.client.SeQuery;
import com.esri.sde.sdk.client.SeQueryInfo;
import com.esri.sde.sdk.client.SeSqlConstruct;
import com.esri.sde.sdk.client.SeTable;

public class TestTableUpdate {
    //private static final String LABYER_DESCRIPTION_TABLE = "DIEN_LABYER_DESCRIPTION";
    //private static final String LABYER_DESCRIPTION_TABLE = ManagerPointSymbol.DIEN_TABLE_POINTSYMBOL;
   // private static final String LABYER_DESCRIPTION_TABLE = ManagerTemplate.DIEN_TABLE_TEMPLATE;
    private static final String LABYER_DESCRIPTION_TABLE = "poi";
    private static final String USER_TABLE = "DIEN_USER";

   

    public static void main(String[] args) {

        String server="", database="none", user="", password="";
        String instance = "";

        /*
        *   Process command line arguements
        */

            server = "192.168.0.178";
            instance = "5151";
            database = "sde_db";
            user = "sde";
            password = "sde";


        try {
         
            SeConnection connection = new SeConnection( server, instance, database, user, password );
            System.out.println("Connected");
            
            createBaseTable( connection);
//
//            try {
//                
//                SeUpdate update = new SeUpdate(connection);
//                String[] columns = new String[1];
//                // Integer data type
//                columns[0] = "DESCRIPTION";
//                try {
//                    String whereClause = new String("TABLE_NAME = 'YY'");
//                    update.toTable("TABLE_REGISTRY", columns, whereClause);
//                    update.setWriteMode(true);
//                    SeRow row = update.getRowToSet();
//                    row.setNString(0, "sdfsdf");     
//                    update.execute();
//                    update.close();
//                } catch( SeException se )  {
//                    Util.printError(se);
//                }
//
//            } catch ( SeException se ) {
//                // Check if valid Sde error is thrown
//                if( se.getSeError().getSdeError() == SeError.SE_INVALID_PARAM_VALUE )
//                    System.out.println(" - OK");
//                else Util.printError(se);
//            }
//            

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
            SeColumnDefinition colDefs[] = new SeColumnDefinition[7];
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

    /*
     *   Creates an ArcSDE table, "EXAMPLE", and adds a spatial column, "SHAPE", to it.
     */
    public static SeLayer createBaseTable(SeConnection conn)
    {

        SeLayer layer = new SeLayer(conn);
        SeTable table = null;
        try
        {
            /*
             *   Create a qualified table name with current user's name and
             *   the name of the table to be created, "EXAMPLE".
             */
            String tableName = ("testlayer3");
            table = new SeTable(conn, tableName);

            /*
             *   Define the columns and their attributes for the table to be created.
             *   NOTE: The valid range/values of size and scale parameters vary from
             *   one database to another.
             */
            boolean isNullable = true;
            SeColumnDefinition colDefs[] = new SeColumnDefinition[6];
            colDefs[0] = new SeColumnDefinition("本",
                                                SeColumnDefinition.TYPE_INT64,
                                                15, 9, isNullable);
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
}
