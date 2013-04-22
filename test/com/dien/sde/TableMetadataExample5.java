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
 *                       ** TableMetadataExample5.java **
 * Purpose:
 * Demonstrates
 *   - metadata creation, delete and alter
 *   - use of SeConnection.getMetaDataList()
 *------------------------------------------------------------------------------
 * Usage: java TableMetadataExample5 {server} {instance} {database} {user} {passwd}
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
import com.esri.sde.sdk.client.SeDBMSInfo;
import com.esri.sde.sdk.client.SeError;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeMetaData;
import com.esri.sde.sdk.client.SeObjectId;
import com.esri.sde.sdk.client.SeTable;


public class TableMetadataExample5
{

    public static SeColumnDefinition colDefs[] = new SeColumnDefinition[7];
    public static String TABLE_NAME = "TBLMDATA";

    public static void main(String[] args)
    {

        String server = "", database = "none", user = "", password = "";
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
        else
        {
            System.out.println("Invalid number of arguments");
            System.out.println("Usage:\n java TableMetadataExample5 {server} {instance} {database} {user} {passwd}");
            System.exit(0);
        }
        Integer inst = new Integer(instance);
        try
        {
            System.out.println("Connecting...");
            /*
             *   Connect to ArcSDE server
             */
            SeConnection conn = new SeConnection(server, inst.intValue(),
                                                 database, user, password);
            System.out.println("Connected");

            SeTable table = Util.createTable(conn, "DEFAULTS", TABLE_NAME, null);
 
            /*
             *   Performs the metadata tests
             */
            testMetaData(table, conn);

            /*
             *   Clean Up : Delete the test table
             */
            System.out.println("\nDeleting test table...");
            try
            {
                table.delete();
                System.out.println(" - OK");
            }
            catch (SeException sexp)
            {
                Util.printError(sexp);
            }

            try
            {
                // Confirm delete
                table.describe();
            }
            catch (SeException sexp)
            {
                if (sexp.getSeError().getSdeError() != SeError.SE_TABLE_NOEXIST)
                {
                    Util.printError(sexp);
                }
                else
                {
                    System.out.println(" - OK");
                }
            }
            conn.close();
        }
        catch (SeException e)
        {
            Util.printError(e);
        }
    } // End main


    /*
     *   - Creates table meta data
     *   - Retrieves meta data created to verify proper creation
     *   - Alters meta data
     *   - Verifies alter
     *   - Deletes first two meta data elements
     *   - Verifies delete
     */
    public static void testMetaData(SeTable table, SeConnection conn)
    {

        SeObjectId[] objId = getMetaDataInfo(table);
        System.out.println("\n--> Creating table meta data..");
        //Create metat data elements
        createMetaData(table, conn);
        objId = getMetaDataInfo(table);

        /*
         *   Alter Table's Metadata
         */
        try
        {
            System.out.println("\n--> Altering metadata information..");
            SeMetaData metaData[] = new SeMetaData[1];
            metaData[0] = new SeMetaData(conn, objId[0]);
            metaData[0].setClassName("Altered Test");
            metaData[0].setDescription("Altered Test meta-data");
            table.alterMetaData(1, metaData);
        }
        catch (SeException se)
        {
            Util.printError(se);
        }
        /*
         *   Retrieve table's metadata to verify alterations
         */
        objId = getMetaDataInfo(table);

        /*
         *   Delete Table's Metadata
         *   Deletes the 2 metadata elements deleted.
         */
        int recordCount = 2;
        SeObjectId[] recordId = new SeObjectId[recordCount];
        for (int i = 0; i < recordCount; i++)
        {
            recordId[i] = objId[i];
        }
        try
        {
            // Delete the first 2 metadata records...
            System.out.println("\n--> Deleting " + recordCount +
                               " metadata records...");
            table.deleteMetaData(recordCount, recordId);
        }
        catch (SeException se)
        {
            Util.printError(se);
        }

        /*
         *   Retrieve table's metadata to verify alterations
         */
//        System.out.println("\nRetrieving metadata info....");
//        objId = getMetaDataInfo(table);

        /*
         *   Retrieve table's metadata to verify delete operation
         *   Uses SeConnection.getMetadataList()
         */
        System.out.println(
                "\nRetrieving metadata info using SeConnection.getMetadataList....");
        getMetaDataConn(conn, table.getName());

    } // End testMetaData


    /*
     *   Creates 4 meta data records
     */
    public static void createMetaData(SeTable table, SeConnection conn)
    {

        try
        {
            // Create four meta data objects
            SeMetaData metaData[] = new SeMetaData[4];

            // Set first meta data record attributes
            metaData[0] = new SeMetaData(conn,
                                         table.getQualifiedName().toUpperCase(),
                                         SeMetaData.
                                         SE_METADATA_OBJECT_TYPE_TABLE);
            metaData[0].setClassName("Class1");
            metaData[0].setDescription("Test1 meta-data");

            // Set attributes of second meta data record
            SeMetaData mdata = new SeMetaData(conn);
            mdata.setObjectName(table.getQualifiedName().toUpperCase());
            mdata.setObjectType(SeMetaData.SE_METADATA_OBJECT_TYPE_TABLE);
            metaData[1] = mdata;
            metaData[1].setClassName("Class2");
            metaData[1].setDescription("Test2 meta-data");
            metaData[1].setProperty("Property String2");

            // Set attributes of third meta data record
            SeMetaData mdata1 = new SeMetaData(conn,
                                               table.getQualifiedName().toUpperCase(),
                                               SeMetaData.
                                               SE_METADATA_OBJECT_TYPE_TABLE);
            try
            {
                metaData[2] = (SeMetaData) mdata1.clone();
            }
            catch (CloneNotSupportedException e)
            {
                e.printStackTrace();
            }
            metaData[2].setClassName("Class3");
            metaData[2].setDescription("Test3 meta-data");
            metaData[2].setValue("Value String3");

            // Set attributes of fourth meta data record
            // No class name set
            metaData[3] = new SeMetaData(conn);
            metaData[3].setObjectName("Object Name4");
            metaData[3].setProperty("Property String4");
            metaData[3].setValue("Value String4");

//  ****************************************************************************
// %%%   LOCATOR type removed for the moment since the server side code does not
// %%%   support it - ADD LATER
//  ****************************************************************************
//            metaData[3].setObjectType(SeMetaData.SE_METADATA_OBJECT_TYPE_LOCATOR);
            table.addMetaData(4, metaData);
        }
        catch (SeException se)
        {
            Util.printError(se);
        }
    } // End createMetaData


    /*
     *   Displays the meta data records associated with a table.
     *   Returns the object ids of the records fetched.
     *   These object ids are then used to delete some of the
     *   metadata records.
     */
    public static SeObjectId[] getMetaDataInfo(SeTable table)
    {

        int recordCount = 0;
        SeObjectId[] objectId = null;
        try
        {
            System.out.println("\n--> Retrieving meta-data of table..");
            /*
             *   Get Table's Metadata
             */
            SeMetaData[] metaData = table.getMetaDataInfoList();

            if (metaData != null)
            {

                recordCount = metaData.length;
                objectId = new SeObjectId[recordCount];
                for (int i = 0; i < recordCount; i++)
                {
                    System.out.println("\nClassName - " +
                                       metaData[i].getClassName());
                    System.out.println("Date inserted/updated - " +
                                       metaData[i].getDate());
                    System.out.println("Description - " +
                                       metaData[i].getDescription());
                    objectId[i] = metaData[i].getId();
                    System.out.println("Object Id - " + objectId[i].longValue());
                    System.out.println("Object Name - " +
                                       metaData[i].getObjectName());
                    System.out.println("Object Owner - " +
                                       metaData[i].getObjectOwner());
                    System.out.println("Object Type - " +
                                       metaData[i].getObjectType());
                    System.out.println("Object Property - " +
                                       metaData[i].getProperty());
                    System.out.println("Property Value - " +
                                       metaData[i].getValue());
                }
            } // end if
            else
            {
                System.out.println("No metadata retrieved");
            }
        }
        catch (SeException se)
        {
            Util.printError(se);
        }
        return objectId;
    } // End getMetaDataInfo

    /*
     *   Retrieve metadata info for current connection
     */
    public static void getMetaDataConn(SeConnection conn, String tableName)
    {

        try
        {
            // Empty where clause
            // Retrieves all the metadata from the server
//            SeMetaData[] metaData = conn.getMetaDataList( "" );
            /*
             *   Retrieve meta data records from the specified table, "TESTTABLE"
             *   associated with the current connection
             */
            String whereClause = null;

            SeDBMSInfo dbmsInfo = conn.getDBMSInfo();
            int database = dbmsInfo.dbmsId;
            if (database == SeDBMSInfo.SE_DBMS_IS_INFORMIX)
            {
                whereClause = new String("object_name = \'" +
                                         TABLE_NAME.toLowerCase() + "\'");
            }
            else
            {
                whereClause = new String("object_name = \'" + TABLE_NAME + "\'");
            }

            SeMetaData[] metaData = conn.getMetaDataList(whereClause);

            /*
             *   display meta data record attributes
             */
            if (metaData != null)
            {

                for (int i = 0; i < metaData.length; i++)
                {
                    System.out.println("\nClassName - " +
                                       metaData[i].getClassName());
                    System.out.println("Date inserted/updated - " +
                                       metaData[i].getDate());
                    System.out.println("Description - " +
                                       metaData[i].getDescription());
                    System.out.println("Object Id - " +
                                       metaData[i].getId().longValue());
                    System.out.println("Object Name - " +
                                       metaData[i].getObjectName());
                    System.out.println("Object Owner - " +
                                       metaData[i].getObjectOwner());
                    System.out.println("Object Type - " +
                                       metaData[i].getObjectType());
                    System.out.println("Object Property - " +
                                       metaData[i].getProperty());
                    System.out.println("Property Value - " +
                                       metaData[i].getValue());
                }
            } // end if
            else
            {
                System.out.println("No metadata retrieved");
            }

        }
        catch (SeException se)
        {
            Util.printError(se);
        }

    } // End method getMetaData
} // End Class TableMetadataExample5
