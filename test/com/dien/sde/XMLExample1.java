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
*                       ** XMLExample1.java **
* Purpose:
*   Demonstrates
* 1. Creating table QA_XMLExample1, XML index, XML tag, XML column and turning column into layer
* 2. Inserting rows
* 3. Setup filter to grab all rows
* 4. Query tests with and without logfile
*
* ------------------------------------------------------------------------------
*
* Usage: XMLExample1 <server> <instance> [database] <user> <passwd> <kwd>
*
* Command line Arguments:
*       Argument     Data Type
*   1. Server Name   (String)
*   2. Instance      (Integer)
*   3. Database Name (String)  <- Optional
*   4. User Name     (String)
*   5. Password      (String)
*   6. Kwd           (String)
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
 * This Java sample demonstrates usage of ArcSDE API. It will not execute successfully until the user
 * supplies valid ArcSDE Server details such as server name, port number, database name, user, pwd, and valid
 * data, if required.
 **************************************************************************/
package com.dien.sde;

import com.esri.sde.sdk.client.SeColumnDefinition;
import com.esri.sde.sdk.client.SeConnection;
import com.esri.sde.sdk.client.SeCoordinateReference;
import com.esri.sde.sdk.client.SeError;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeExtent;
import com.esri.sde.sdk.client.SeInsert;
import com.esri.sde.sdk.client.SeQuery;
import com.esri.sde.sdk.client.SeQueryInfo;
import com.esri.sde.sdk.client.SeRow;
import com.esri.sde.sdk.client.SeShape;
import com.esri.sde.sdk.client.SeSqlConstruct;
import com.esri.sde.sdk.client.SeTable;
import com.esri.sde.sdk.client.SeXmlColumn;
import com.esri.sde.sdk.client.SeXmlDoc;
import com.esri.sde.sdk.client.SeXmlIndex;
import com.esri.sde.sdk.client.SeXmlTag;


public class XMLExample1
{
    SeConnection conn = null;
    String server, database, user, password, keyword;
    int instance;
    String tableName = "XMLExample1";
    String xmlColumnName = "XML";
    String shapeColumnName = "Shape";
    SeTable table = null;

    public XMLExample1(String[] args)
    {
        try
        {
            //Processing command line arguments
            if (args.length == 5)
            {
                server = args[0];
                instance = Integer.parseInt(args[1]);
                database = args[2];
                user = args[3];
                password = args[4];
                //keyword = args[5];
                //path = args[6];
            }
            else
            {
                System.out.println("\nInvalid number of arguments\n" +
                                   "Usage: \n java XMLExample1 {server} {instance} {database} {user} {passwd} {keyword}");
                System.exit(0);
            }

            // Opening Connection
            conn = new SeConnection(server, instance, database, user, password);
            System.out.println("\n**Connected to " + server + "/" + instance +
                               " as " + user + "/" + password);
        }
        catch(SeException se)
        {
            SeError error = se.getSeError();
            System.err.println("\nError in XMLExample1 Connection: " + error.getSdeError() +
                               "\nSDE Error Message: " + error.getSdeErrMsg());
            System.err.println("\nExt Error: " + error.getExtError() +
                               "\nExt Error Message: " + error.getExtErrMsg() +
                               "\nError Descr: " + error.getErrDesc());
        }

    }

    public static void main(String[] args)
    {
        XMLExample1 xp = new XMLExample1(args);

        try
        {
            System.out.println("**Creating table XPATH_QUERIES, XML index, XML tag, XML column and turning " +
        "column into layer...\n");
            //Create a table
            //xp.table = createTable(xp.conn, xp.keyword, xp.tableName, null);

//            int[]             in_types = new int[5];
//            String[]          in_names = new String[5];
//
//            //Create XML Index
//            SeXmlIndex index = new SeXmlIndex(xp.conn);
//            index.setName("xpath_queries_index");
//            index.setDescription("index description");
//            index.setType(SeDefs.SE_XML_INDEX_DEFINITION);
//
//            in_names[0] = "/metadata/Esri/gn/suptheme";
//            in_names[1] = "/metadata/Esri/gn/coverage";
//            in_names[2] = "/metadata/Esri/gn/featured";
//            in_names[3] = "/metadata/Esri@MetaID";
//
//            in_types[0] = SeDefs.SE_XML_INDEX_DOUBLE_TYPE;
//            in_types[1] = SeDefs.SE_XML_INDEX_STRING_TYPE;
//            in_types[2] = SeDefs.SE_XML_INDEX_STRING_TYPE;
//            in_types[3] = SeDefs.SE_XML_INDEX_DOUBLE_TYPE;
//
//            SeXmlTag tag = new SeXmlTag();
//
//            for (int i = 0; i < 4; i++)
//            {
//                tag.setName(in_names[i]);
//                tag.setDataType(in_types[i]);
//                index.addTag(tag);
//            }
//
//            //Create XML Column
//            SeXmlColumn xmlCol = new SeXmlColumn(xp.conn);
//            xmlCol.setXmlColumn(xp.tableName, xp.xmlColumnName);
//            xmlCol.setCreationKeyword("DEFAULTS");
//            xmlCol.setMinimumId(100);
//            xmlCol.setIndex(index);
//            xmlCol.create();
//            System.out.println("\t**XML Column created");
//
//            printXmlColumnInfo(xmlCol);
//
//            System.out.println("**Creating layer...\n");
//
//            //add a layer
//            SeLayer layer = null;
//            //SeLayer layer = Util.createLayer(xp.conn, xp.tableName, "Shape");
//
//            //insert row
//            System.out.println("**Inserting Rows...\n");
//            xp.insertRow(xp.conn, xp.table);

            //query row
            SeTable tableTmp = new SeTable( xp.conn, "poi");
            System.out.println("**Querying Rows...\n");
            xp.queryRow(xp.conn, tableTmp);


//            System.out.println("**Clean up.");
////            index.deleteTags();
//            xmlCol.delete(xp.tableName, xp.xmlColumnName);
//            layer.delete();
//            xp.table.delete();
//
//            //Closing Connection
//            xp.conn.close();
//            System.out.println("\t**Connection to " + xp.server + "/" + xp.instance + " closed.");
//            System.out.println("\n--------------------------**End of XMLExample1**--------------------------");
        }
        catch(SeException se)
        {
            SeError error = se.getSeError();
            System.err.println("Error in XmlColumnInfo main(): " + error.getSdeError() +
                               "\nSDE Error Message: " + error.getSdeErrMsg());
            System.err.println("Ext Error: " + error.getExtError() +
                               "\nExt Error Message: " + error.getExtErrMsg() +
                               "\nError Descr: " + error.getErrDesc());
            se.printStackTrace();

            try
            {
                xp.table.delete();
                xp.conn.close();
            }
            catch(SeException se1)
            {

            }
        }
    }

    public static void printXmlColumnInfo(SeXmlColumn col)
     {
         try
         {
             String xmlColInfo[] = col.getXmlColumn();
             String hasIndex = null;

             System.out.println("\nXML Column: " +
                                "\n  Column Name: " + xmlColInfo[1] +
                                "\n  Minimum Id: " + col.getMinimumId() +
                                "\n  Table Name: " + xmlColInfo[0] +
                                "\n  Creation Keyword: " + col.getCreationKeyword() +
                                "\n  Index Info:");
             if (col.hasIndex())
             {
                 printXmlIndexInfo(col.getIndex());
             }
             else
                 System.out.print("    No Index\n");
         }
         catch(SeException se)
         {
             se.printStackTrace();
         }

     }

     public static void printXmlIndexInfo(SeXmlIndex index)
     {
         try
         {
             System.out.print("    Index Name: " + index.getName() +
                              "\n    Type: " + index.getType() +
                              "\n    Tags: ");
             SeXmlTag[] tags = index.getTags();
             System.out.print(tags.length + "\n");
             if(tags != null)
             {
                 for(int i = 0; i < tags.length; i++)
                 {
                     printXmlTagInfo(tags[i]);
                 }
             }
             else
                 System.out.print("None");
         }
         catch(SeException se)
         {
             se.printStackTrace();
         }
     }

     public static void printXmlTagInfo(SeXmlTag tag)
     {
          try
          {
              String isExcluded = null;
              if(tag.isExcluded())
                  isExcluded = "Yes\n";
              else
                  isExcluded = "No\n";

              System.out.println("      Name: " + tag.getName() +
                                 "\n      Description: " + tag.getDescription() +
                                 "\n      Data Type: " + tag.getDataType() +
                                 "\n      Alias: " + tag.getAlias() +
                                 "\n      Is Excluded? " + isExcluded);
          }
          catch(SeException se)
          {
              se.printStackTrace();
          }
     }

     public static void printXmlDocInfo(SeXmlDoc doc)
     {
         try
         {
             System.out.print("Doc Length: " + doc.getLength() +
                              "\nText: \n" + doc.getText());
         }
         catch (SeException se)
         {
             se.printStackTrace();
         }
     }


    private void queryRow(SeConnection conn, SeTable table)
    {
        try
        {
            //preparing insert object
            SeColumnDefinition[] coldef = table.describe();
            String[] columns = new String[coldef.length];
            int columnPosition = 0;

            for (int i = 0; i < coldef.length; i++)
            {
                columns[i] = coldef[i].getName();
            }

            SeQuery query = new SeQuery(conn);
            SeQueryInfo qInfo = new SeQueryInfo();
            SeSqlConstruct sql = new SeSqlConstruct(table.getQualifiedName(), null);
            qInfo.setConstruct(sql);
            qInfo.setByClause("order by OBJECTID ");

            qInfo.setColumns(columns);

            //String xpathConstraint = "/metadata/xpath_queries/gn[suptheme = 4]";
            //qInfo.setXpathConstraint(tableName, xmlColumnName, xpathConstraint);
            query.prepareQueryInfo(qInfo);

            SeXmlDoc xmldoc = new SeXmlDoc();
            query.execute();
            SeRow row = query.fetch();

            //int int_val = row.getInteger(0).intValue();
            //xmldoc = row.getXml(1);
            //SeShape shape = row.getShape(2);

            query.close();

           // System.out.println("Int value: " + int_val +
            //                   "\nXML Doc: \n" + xmldoc.getText() +
            //                   "\nShape Info: \n");
            //displayShape();
        }
        catch(SeException se)
        {
            se.printStackTrace();
        }
    }

    private void insertRow(SeConnection conn, SeTable table)
    {
        try
        {
            //initializing xmldoc
            String docXML = "<?xml version = \"1.0\" ?>" +
                "\n<metadata>" +
                "\n  <xpath_queries>" +
                "\n    <gn>" +
                "\n      <coverage>New Mexico</coverage>" +
                "\n      <suptheme>4</suptheme>" +
                "\n      <suptheme>5</suptheme>" +
                "\n      <suptheme>18</suptheme>" +
                "\n      <featured>Show in list of featured content in Geography Network Explorer</featured>" +
                "\n    </gn>" +
                "\n  </xpath_queries>" +
                "\n</metadata>";

            SeXmlDoc doc = new SeXmlDoc();
            doc.setText(docXML);

            printXmlDocInfo(doc);

            //initializing shape
            SeCoordinateReference coord = new SeCoordinateReference();

            SeShape shape = new SeShape(coord);

            SeExtent extent  = new SeExtent(50, 50, 160, 160);
            shape.generateRectangle(extent);

            //preparing to insert object
            SeColumnDefinition[] coldef = table.describe();
            String[] columns = new String[coldef.length];
            int columnPosition = 0;

            for (int i = 0; i < coldef.length; i++)
            {
                columns[i] = coldef[i].getName();
            }

            SeInsert insert = new SeInsert(conn);
            insert.intoTable(table.getQualifiedName(), columns);
            boolean bufferedInsert = false;
            insert.setWriteMode(bufferedInsert);

            SeRow row = insert.getRowToSet();
            row.setInteger(0, new Integer(0));
            row.setXml(1, doc);
            row.setShape(2, shape);

            insert.execute();
            insert.close();
        }
        catch(SeException se)
        {
            se.printStackTrace();
        }
    }
}
