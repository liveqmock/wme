package com.dien.sde;

import com.esri.sde.sdk.client.SeColumnDefinition;
import com.esri.sde.sdk.client.SeConnection;
import com.esri.sde.sdk.client.SeError;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeQuery;
import com.esri.sde.sdk.client.SeQueryInfo;
import com.esri.sde.sdk.client.SeRow;
import com.esri.sde.sdk.client.SeSqlConstruct;

public class TestTableSql {

    public TestTableSql() {
        // TODO Auto-generated constructor stub
    }

    // private static final String LABYER_DESCRIPTION_TABLE = "DIEN_LABYER_DESCRIPTION";
    // private static final String LABYER_DESCRIPTION_TABLE = ManagerPointSymbol.DIEN_TABLE_POINTSYMBOL;
    // private static final String LABYER_DESCRIPTION_TABLE = ManagerTemplate.DIEN_TABLE_TEMPLATE;
    private static final String LABYER_DESCRIPTION_TABLE = "poi";

    private static final String USER_TABLE = "DIEN_USER";

    public static SeColumnDefinition colDefs[] = new SeColumnDefinition[7];

    public static void main(String[] args) {

        String server = "", database = "none", user = "", password = "";
        String instance = "";

        /*
         * Process command line arguements
         */
        if (args.length == 5) {
            server = args[0];
            instance = args[1];
            database = args[2];
            user = args[3];
            password = args[4];
        } else {
            System.out.println("Invalid number of arguments");
            System.out
                    .println("Usage: \n java TableCreateExample2 {server} {instance} {database} {user} {passwd}");
            System.exit(0);
        }

        try {
            System.out.println("Connecting...");
            /*
             * Connect to ArcSDE server
             */
            SeConnection connection = new SeConnection(server, instance, database, user, password);
           
            try {
                // Create a table with empty tablename argument using SeTable constructor 1
                SeQuery query = new SeQuery(connection);
                
                SeSqlConstruct sqlCons = new SeSqlConstruct("ayf");  
                String[] cols = new String[] { "OBJECTID", "NAME" }; 
                SeQueryInfo queryInfo = new SeQueryInfo();  
                //queryInfo.setQueryType(SeQueryInfo.SE_QUERYTYPE_ATTRIBUTE_FIRST);  
                queryInfo.setColumns(cols);  
                queryInfo.setConstruct(sqlCons);  
                queryInfo.setByClause("order by name ");  
                query.prepareQueryInfo(queryInfo);
                //String sql = "SELECT OBJECTID,NAME FROM POI ";
               // query.prepareSql(sql);
                query.execute();
                SeRow row = query.fetch();
                if (row != null) {
                    while (row != null) {
        System.out.println(row.getString(1));
                        row = query.fetch();
                    } // End while

                }

            } catch (SeException se) {
                se.printStackTrace();
                // Check if valid Sde error is thrown
                if (se.getSeError().getSdeError() == SeError.SE_INVALID_PARAM_VALUE)
                    System.out.println(" - OK");
                else
                    Util.printError(se);
            }

            connection.close();
        } catch (SeException e) {
            Util.printError(e);
        }

    } // End main

}
