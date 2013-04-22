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
*                       ** TableAccessExample1.java **
* Purpose:
* Demonstrates
*  - use of access privileges on table
*------------------------------------------------------------------------------
* Usage: java TableAccessExample1 {server} {instance} {database} {user1} {passwd1} {user1} {passwd2}
*
* Command line Arguments:
*       Argument     Data Type
*   1. Server Name   (String)
*   2. Instance      (Integer)
*   3. Database Name (String)  <- Optional
*   4. User1 Name     (String)
*   5. Password      (String)
*   6. User2 Name     (String)
*   7. Password      (String)

 ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
 * This Java sample demonstrates usage of ArcSDE API. It will not execute successfully until the user
 * supplies valid ArcSDE Server details such as server name, port number, database name, user, pwd, and valid
 * data, if required.
 **************************************************************************/

package com.dien.sde;

import com.esri.sde.sdk.client.SeConnection;
import com.esri.sde.sdk.client.SeDefs;
import com.esri.sde.sdk.client.SeError;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeTable;

public class TableAccessExample1 {

    public SeConnection connOne = null;
    public SeConnection connTwo = null;


    public static void main(String[] args) {
        TableAccessExample1 test = new TableAccessExample1(args);
    }

    public TableAccessExample1(String[] args) {

        String server="", database="none";
        String userOne = null;
        String userTwo = null;
        String passwordOne = null;
        String passwordTwo = null;
        String instance = "";

        /*
        *   Process command line arguements.
        */
        if( args.length == 7 ) {
            server = args[0];
            instance = args[1];
            database = args[2];
            userOne  = args[3];
            passwordOne = args[4];
            userTwo = args[5];
            passwordTwo = args[6];
        } else {
            System.out.println("Invalid number of arguments");
            System.out.println("Usage: \n TableAccessExample1 java TableAccessExample1 {server} {instance} {database} {user1} {passwd1} {user2} {passwd2}");
            System.exit(0);
        }
        try {
            /*
            *   Connect to ArcSDE server as userOne.
            */
            connOne = new SeConnection( server, instance, database, userOne, passwordOne);
            System.out.println("Connection 1 for " + userOne.toUpperCase() + " successful! \n");

            /*
            *   Second connection to server for userTwo.
            */
            connTwo =  new SeConnection( server, instance, database, userTwo, passwordTwo);
            System.out.println("Connection 2 for " + userTwo.toUpperCase() + " successful! \n");
 
            
            SeTable table = Util.createTable(connOne, "DEFAULTS", "QA_TBLACCESS", null);

            /*
            *   Perform Table access Tests
            */
            /*
            *   Get UserOne's Privileges on base table.
            */
            System.out.println("\n--> User " + connOne.getUser().toUpperCase() + " has the follg. privileges");

            try {
                Util.getPrivileges( table.getPermissions());
            }catch(SeException se) {
                Util.printError(se);
            }

            /*
            *   Create a handle for userTwo to the testtable.
            */
            SeTable tableTmp = new SeTable( connTwo, table.getQualifiedName() );

            table.grantAccess(SeDefs.SE_SELECT_PRIVILEGE, false, userTwo);

            System.out.println("\nUser " + connTwo.getUser().toUpperCase() + " has the follg. privileges");

            try {
                Util.getPrivileges( tableTmp.getPermissions() );
            }catch( SeException se ) {
                Util.printError(se);
            }

            System.out.println("\n--> Giving user " + connTwo.getUser().toUpperCase() + " all privileges...");
            table.grantAccess(SeDefs.SE_SELECT_PRIVILEGE | SeDefs.SE_UPDATE_PRIVILEGE
                            | SeDefs.SE_DELETE_PRIVILEGE | SeDefs.SE_INSERT_PRIVILEGE
                            , false, userTwo);

            System.out.println("\n--> User " + connTwo.getUser().toUpperCase() + " now has the follg. privileges");
            Util.getPrivileges( tableTmp.getPermissions() );

            System.out.println("\n--> Revoking user " + connTwo.getUser().toUpperCase() + "'s insert,update and delete privileges...");
            table.revokeAccess(SeDefs.SE_INSERT_PRIVILEGE | SeDefs.SE_UPDATE_PRIVILEGE |
                            SeDefs.SE_DELETE_PRIVILEGE, userTwo);

            System.out.println("\n--> User " + connTwo.getUser().toUpperCase() + " now has the follg. privileges");
            Util.getPrivileges( tableTmp.getPermissions() );

            System.out.println("\n--> User " + connOne.getUser().toUpperCase() + " has the follg. privileges");
            Util.getPrivileges(table.getPermissions());


            // Delete the test table
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
            connOne.close();
            connTwo.close();
        } catch( SeException e) {
            Util.printError(e);
        }
    } // End main

} // End Class TableAccessExample1
