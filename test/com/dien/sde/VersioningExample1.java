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
 *                       ** VersioningExample1.java **
 * Purpose:
 *   Demonstrates
 * 1. Performs version tests on specified layer.
 * 2. Simulate a user creating a new version from the default
 * 3. Simulate a user creating a new version from VERSION_ONE and making edits to the new version.
 * 4. Perform more edits on VERSION_ONE
 * 5. Create a new version, VERSION_TWO from the default and making edits to the new version.
 * 6. Does either an insert or Update operation
 * 7. Reconcile VERSION_ONE with VERSION_ONE_CHILD
 * 8. Creates a child state from parentState
 * 9. Deletes rows using where clause constraint.
 * 10. Deletes rows by ObjectId values.
 * 11. Displays the rows of the table corresponding to the input stateId
 *
 * ------------------------------------------------------------------------------
 *
 * Usage: VersioningExample1 <server> <instance> [database] <user> <passwd>
 *
 * Command line Arguments:
 *       Argument     Data Type
 *   1. Server Name   (String)
 *   2. Instance      (Integer)
 *   3. Database Name (String)  <- Optional
 *   4. User Name     (String)
 *   5. Password      (String)
 *
 ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
 * This Java sample demonstrates usage of ArcSDE API. It will not execute successfully until the user
 * supplies valid ArcSDE Server details such as server name, port number, database name, user, pwd, and valid
 * data, if required.
 **************************************************************************/
package com.dien.sde;

import java.util.Vector;

import com.esri.sde.sdk.client.SeColumnDefinition;
import com.esri.sde.sdk.client.SeConnection;
import com.esri.sde.sdk.client.SeDelete;
import com.esri.sde.sdk.client.SeError;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeInsert;
import com.esri.sde.sdk.client.SeLayer;
import com.esri.sde.sdk.client.SeObjectId;
import com.esri.sde.sdk.client.SeQuery;
import com.esri.sde.sdk.client.SeRegistration;
import com.esri.sde.sdk.client.SeRow;
import com.esri.sde.sdk.client.SeShape;
import com.esri.sde.sdk.client.SeSqlConstruct;
import com.esri.sde.sdk.client.SeState;
import com.esri.sde.sdk.client.SeStreamOp;
import com.esri.sde.sdk.client.SeTable;
import com.esri.sde.sdk.client.SeUpdate;
import com.esri.sde.sdk.client.SeVersion;


/*
 *       Performs version tests on layer "testVerLayer"
 *
 * Usage: &nbsp;
 *  <code>
 *  java Versioning02 {server} {instance} {database} {user} {passwd} {storage type}
 *  </code>
 *
 */
public class VersioningExample1
{

    private static SeConnection conn = null;
    private static String layerName = "testVerLayer";
    private static SeLayer layer = null;
    private static SeTable table = null;
    private static String VERSION_ONE = "Version_One";
    private static String VERSION_ONE_CHILD = "Version_One_Child";
    private static String VERSION_TWO = "Version_Two";
    static final String DEFAULT_VERSION = "sde.DEFAULT";
    private static final int DELETE_ROWS_FOUND = 1;
    private static final int COPY_ROWS_FOUND = 2;
    private static final short INSERT_OP = 1;
    private static final short UPDATE_OP = 2;

    public static void main(String[] args)
    {

        String server = "", database = "none", user = "", password = "",
                keyword = "";
        int instance = 0;

        /*
         *   Process command line arguements
         */
        if (args.length == 6)
        {
            server = args[0];
            instance = Integer.parseInt(args[1]);
            database = args[2];
            user = args[3];
            password = args[4];
            keyword = args[5];
        }
        else
        {
            System.out.println("Invalid number of arguments");
            System.out.println("Usage: \n Versioning02 {server} {instance} {database} {user} {passwd} {storage type}");
            System.exit(0);
        }
        try
        {
            System.out.println("\n Connecting...");
            /*
             *   Establish connection with an ArcSde server
             */
            conn = new SeConnection(server, instance, database, user, password);
            System.out.println("\n Connected");

            /*
             * Create the test layer.
             */
            Util.copySdeTable(conn, "sdedata." + layerName, layerName, keyword, true);

            layerName = user + "." + layerName;
            VERSION_ONE = user + "." + VERSION_ONE;
            VERSION_ONE_CHILD = user + "." + VERSION_ONE_CHILD;
            VERSION_TWO = user + "." + VERSION_TWO;

            table = new SeTable(conn, layerName);
            layer = new SeLayer(conn, layerName, "SHAPE");

            System.out.println("Table Name: " + table.getQualifiedName());
            System.out.println("Layer Name: " + layer.getQualifiedName());

            /*
             *   Delete all the versions & states if they already exist
             */
            try
            {
                SeVersion versionOneChild = new SeVersion(conn,
                        VERSION_ONE_CHILD);
                SeState verOneChildState = new SeState(conn,
                        versionOneChild.getStateId());
                versionOneChild.delete();
                verOneChildState.close();
                verOneChildState.delete();
            }
            catch (SeException e)
            {
                //if( e.getSeError().getSdeError() != SeError.SE_VERSION_NOEXIST )
                e.printStackTrace();
            }

            try
            {
                SeVersion versionOne = new SeVersion(conn, VERSION_ONE);
                SeState verOneState = new SeState(conn, versionOne.getStateId());
                versionOne.delete();
                verOneState.close();
                verOneState.delete();
            }
            catch (SeException e)
            {
                //if( e.getSeError().getSdeError() != SeError.SE_VERSION_NOEXIST )
                e.printStackTrace();
            }

            try
            {
                SeVersion versionTwo = new SeVersion(conn, VERSION_TWO);
                SeState verTwoState = new SeState(conn, versionTwo.getStateId());

                versionTwo.delete();
                verTwoState.close();
                verTwoState.delete();
            }
            catch (SeException e)
            {
                //if( e.getSeError().getSdeError() != SeError.SE_VERSION_NOEXIST )
                e.printStackTrace();
            }

            try
            {
                Util.registerTable(conn, layerName);

                /*
                 *   Enable mutliversioning on the layer.
                 */
                Util.versionTable(conn, layerName);

                /*
                 *   Create new version, VERSION_ONE from the
                 *   default version and make edits to it
                 */
                editSessionOne();

                /*
                 *   Create another new version from the
                 *   VERSION_ONE and make edits to it
                 */
                editSessionTwo();

                editSessionThree();

                editSessionFour();

                reconcileVersionOneNChild();

                reconcileVersionOneNTwo();
            }
            catch (SeException e)
            {
                e.printStackTrace();
            }
            /*
             *   Delete all the versions & states created
             */
            try
            {
                SeVersion versionOne = new SeVersion(conn, VERSION_ONE);
                SeVersion versionOneChild = new SeVersion(conn,
                        VERSION_ONE_CHILD);
                SeVersion versionTwo = new SeVersion(conn, VERSION_TWO);

                SeState verOneState = new SeState(conn, versionOne.getStateId());
                SeState verOneChildState = new SeState(conn,
                        versionOneChild.getStateId());
                SeState verTwoState = new SeState(conn, versionTwo.getStateId());

                System.out.println("\n Deleting versions & states...");
                versionOneChild.delete();
                verOneChildState.delete();

                versionOne.delete();
                verOneState.delete();

                versionTwo.delete();
                verTwoState.delete();

                table.delete();
            }
            catch (SeException e)
            {
                e.printStackTrace();
            }

            /*
             *   Close the connection
             */
            conn.close();
        }
        catch (SeException e)
        {
            SeError error = e.getSeError();
            System.out.println(" Error: " + error.getErrDesc());
            e.printStackTrace();
        }
    } // End main


    /*
     *   Simulate a user creating a new version from the default
     *   and making edits to the new version.
     */
    public static void editSessionOne() throws SeException
    {

        System.out.println("\n Starting edit session one");
        SeVersion newVersion = null;
        try
        {
            // Create a new version for editing.
            newVersion = Util.createNewVersion(conn, VERSION_ONE,
                                               DEFAULT_VERSION);
        }
        catch (SeException e)
        {
            System.out.println(e.getSeError().getSdeError());
        }

        // Display info about the new version created
        getVersionInfo(newVersion);

        // Create a state object that will refer to VERSION_ONE's state
        SeState parentState = null;
        try
        {
            parentState = new SeState(conn, newVersion.getStateId());
        }
        catch (SeException se)
        {
            se.printStackTrace();
        }

        // Create a new state
        System.out.println("\n Creating new state");
        SeState stateOne = createChildState(parentState);

        /*
         *   Set up to perform edits on the first state
         */
        String[] columns = new String[2];
        int[] colDefs = new int[2];
        Object[] newValues = new Object[2];

        columns[0] = "State_name";
        colDefs[0] = SeColumnDefinition.TYPE_STRING;
        newValues[0] = new String("Louisiana_updated");

        String whereClause = "STATE_NAME = \'Louisiana\'";
        SeShape updated_shape = Util.getShape(conn, layer, whereClause);

        columns[1] = "SHAPE";
        colDefs[1] = SeColumnDefinition.TYPE_SHAPE;
        newValues[1] = updated_shape;

        Vector updateInfo = new Vector();
        updateInfo.add(columns);
        updateInfo.add(colDefs);
        updateInfo.add(newValues);

        /*
         *   Execute edit operations
         */
        System.out.println("\n First edit - update shape & attribute data");
        System.out.println(" Changing state_name & shape values");
        insertUpdate(UPDATE_OP, stateOne.getId(), updateInfo, whereClause);

        /*
         *   Create a new state, stateTwo that is a child of stateOne
         */
        System.out.println("\n Creating new state, stateTwo from stateOne");
        SeState stateTwo = createChildState(stateOne);

        /*
         *   Perform edits on second state
         */
        columns = new String[1];
        colDefs = new int[1];
        newValues = new Object[1];

        whereClause = "STATE_NAME = \'Arkansas\'";

        updated_shape = Util.getShape(conn, layer, whereClause);

        columns[0] = "SHAPE";
        colDefs[0] = SeColumnDefinition.TYPE_SHAPE;
        newValues[0] = updated_shape;

        updateInfo = new Vector();
        updateInfo.add(columns);
        updateInfo.add(colDefs);
        updateInfo.add(newValues);

        /*
         *   Execute edit operations
         */
        System.out.println("\n Second edit - update shape data");
        System.out.println(" Changing shape for state_name Arkansas");
        insertUpdate(UPDATE_OP, stateTwo.getId(), updateInfo, whereClause);

        /*
         *   Create a new state,stateThree that is a child of stateTwo
         */
        System.out.println("\n Creating new state, stateThree from stateTwo");
        SeState stateThree = createChildState(stateTwo);

        /*
         *   Perform edits on third state
         */
        columns = new String[1];
        colDefs = new int[1];
        newValues = new Object[1];

        whereClause = "STATE_NAME = \'Arkansas\'";

        updated_shape = Util.getShape(conn, layer, whereClause);

        columns[0] = "SHAPE";
        colDefs[0] = SeColumnDefinition.TYPE_SHAPE;
        newValues[0] = updated_shape;

        updateInfo = new Vector();
        updateInfo.add(columns);
        updateInfo.add(colDefs);
        updateInfo.add(newValues);

        /*
         *   Execute edit operations
         */
        System.out.println("\n Third edit - update shape data");
        System.out.println(" Changing shape value for state_name Arkansas");
        insertUpdate(UPDATE_OP, stateThree.getId(), updateInfo, whereClause);

        /*
         *   Create a new state, stateFour that is a child of stateThree
         */
        System.out.println("\n Creating new state, stateFour from stateThree");
        SeState stateFour = createChildState(stateThree);

        /*
         *   Perform edits on fourth state
         */
        columns = new String[1];
        colDefs = new int[1];
        newValues = new Object[1];

        whereClause = "STATE_NAME = \'Alabama\'";

        updated_shape = Util.getShape(conn, layer, whereClause);

        columns[0] = "SHAPE";
        colDefs[0] = SeColumnDefinition.TYPE_SHAPE;
        newValues[0] = updated_shape;

        updateInfo = new Vector();
        updateInfo.add(columns);
        updateInfo.add(colDefs);
        updateInfo.add(newValues);

        /*
         *   Execute edit operations
         */
        System.out.println("\n Fourth edit - update shape data");
        System.out.println(" Changing shape value for state_name Alabama");
        insertUpdate(UPDATE_OP, stateFour.getId(), updateInfo, whereClause);

        /*
         *   Move version pointer to the last stated edited, the fourth state.
         */
        System.out.println(" Changing version's state to fourth state...");
        try
        {
            newVersion.changeState(stateFour.getId());
        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

        /*
         *   Ready to save the work done so far; Trim the state tree to its
         *   minimum length.
         */
        try
        {
            stateOne.trimTree(stateOne.getId(), stateFour.getId());
        }
        catch (SeException e)
        {
            e.printStackTrace();
            System.out.println(e.getSeError().getSdeError());
        }
        System.out.println("\n End edit session one");

    } // End editSessionOne


    /*
     *   Simulate a user creating a new version from VERSION_ONE
     *   and making edits to the new version.
     */
    public static void editSessionTwo() throws SeException
    {

        System.out.println("\n Starting edit session two  ");
        SeVersion newVersion = null;
        try
        {
            // Create a new version for editing.
            newVersion = Util.createNewVersion(conn, VERSION_ONE_CHILD,
                                               VERSION_ONE);
        }
        catch (SeException e)
        {
            System.out.println(e.getSeError().getSdeError());
            e.printStackTrace();
        }

        // Display info about the new version created
        getVersionInfo(newVersion);

        // Create a state object that will refer to VERSION_ONE_CHILD's state
        SeState parentState = null;
        try
        {
            parentState = new SeState(conn, newVersion.getStateId());
        }
        catch (SeException se)
        {
            se.printStackTrace();
        }

        // Create a new state
        System.out.println("\n Creating new state");
        SeState stateOne = createChildState(parentState);

        /*
         *   Set up to perform edits on the first state
         */
        String[] columns = new String[2];
        int[] colDefs = new int[2];
        Object[] newValues = new Object[2];

        columns[0] = "State_name";
        colDefs[0] = SeColumnDefinition.TYPE_STRING;
        newValues[0] = new String("Mississippi Copy");

        String whereClause = "STATE_NAME = \'Mississippi\'";
        SeShape new_shape = Util.getShape(conn, layer, whereClause);

        columns[1] = "SHAPE";
        colDefs[1] = SeColumnDefinition.TYPE_SHAPE;
        newValues[1] = new_shape;

        Vector insertInfo = new Vector();
        insertInfo.add(columns);
        insertInfo.add(colDefs);
        insertInfo.add(newValues);

        /*
         *   Execute edit operations
         */
        System.out.println("\n First edit - Inserting shape & attribute data");
        insertUpdate(INSERT_OP, stateOne.getId(), insertInfo, "");

        /*
         *   Create a new state, stateTwo that is a child of stateOne
         */
        System.out.println("\n Creating new state, stateTwo from stateOne");
        SeState stateTwo = createChildState(stateOne);

        /*
         *   Perform edits on second state
         */
        columns = new String[2];
        colDefs = new int[2];
        newValues = new Object[2];

        columns[0] = "State_name";
        colDefs[0] = SeColumnDefinition.TYPE_STRING;
        newValues[0] = new String("Arkansas Copy");

        whereClause = "STATE_NAME = \'Arkansas\'";
        new_shape = Util.getShape(conn, layer, whereClause);

        columns[1] = "SHAPE";
        colDefs[1] = SeColumnDefinition.TYPE_SHAPE;
        newValues[1] = new_shape;

        insertInfo = new Vector();
        insertInfo.add(columns);
        insertInfo.add(colDefs);
        insertInfo.add(newValues);

        /*
         *   Execute edit operations
         */
        System.out.println("\n Second edit - Inserting shape & attribute data");
        insertUpdate(INSERT_OP, stateTwo.getId(), insertInfo, "");

        /*
         *   Create a new state,stateThree that is a child of stateTwo
         */
        System.out.println("\n Creating new state, stateThree from stateTwo");
        SeState stateThree = createChildState(stateTwo);

        /*
         *   Perform edits on third state
         */
        SeObjectId idList[] = new SeObjectId[3];
        // Delete Arkansas.
        idList[0] = new SeObjectId(46);
        // Delete Alabama
        idList[1] = new SeObjectId(42);
        // Delete Mississippi
        idList[2] = new SeObjectId(43);

        /*
         *   Execute edit operations
         */
        System.out.println(
                "\n Third edit - Deleting rows corres to Objectids 42, 43 & 46");
        deleteById(stateThree.getId(), idList);

        /*
         *   Create a new state, stateFour that is a child of stateThree
         */
        System.out.println("\n Creating new state, stateFour from stateThree");
        SeState stateFour = createChildState(stateThree);

        /*
         *   Perform edits on fourth state
         */
        columns = new String[2];
        colDefs = new int[2];
        newValues = new Object[2];

        columns[0] = "State_name";
        colDefs[0] = SeColumnDefinition.TYPE_STRING;
        newValues[0] = new String("Kentucky_updated");
        whereClause = "STATE_NAME = \'Kentucky\'";

        SeShape updated_shape = Util.getShape(conn, layer, whereClause);

        columns[1] = "SHAPE";
        colDefs[1] = SeColumnDefinition.TYPE_SHAPE;
        newValues[1] = updated_shape;

        Vector updateInfo = new Vector();
        updateInfo.add(columns);
        updateInfo.add(colDefs);
        updateInfo.add(newValues);

        /*
         *   Execute edit operations
         */
        System.out.println("\n Fourth edit - update shape & and attribute data");
        System.out.println(" Changing state_name & shape values");
        insertUpdate(UPDATE_OP, stateFour.getId(), updateInfo, whereClause);

        /*
         *   Create a new state, stateFive that is a child of stateFour
         */
        System.out.println("\n Creating new state, stateFive from stateFour");
        SeState stateFive = createChildState(stateFour);

        /*
         *   Perform edits on fifth state
         */
        columns = new String[4];
        colDefs = new int[4];
        newValues = new Object[4];

        whereClause = "STATE_NAME = \'Arkansas Copy\'";

        columns[0] = "STATE_FIPS";
        colDefs[0] = SeColumnDefinition.TYPE_STRING;
        newValues[0] = new String("02");

        columns[1] = "POP1999";
        colDefs[1] = SeColumnDefinition.TYPE_INTEGER;
        newValues[1] = new Integer(2557926);

        columns[2] = "MALES";
        colDefs[2] = SeColumnDefinition.TYPE_INTEGER;
        newValues[2] = new Integer(0);

        columns[3] = "FEMALES";
        colDefs[3] = SeColumnDefinition.TYPE_INTEGER;
        newValues[3] = new Integer(100000);

        updateInfo = new Vector();
        updateInfo.add(columns);
        updateInfo.add(colDefs);
        updateInfo.add(newValues);

        /*
         *   Execute edit operations
         */
        System.out.println("\n Fifth edit - attribute data");
        System.out.println(
                " Changing state_fips, pop1999, males & females values");
        insertUpdate(UPDATE_OP, stateFive.getId(), updateInfo, whereClause);

        /*
         *   Move version pointer to the last stated edited, the fifth state.
         */
        System.out.println(" Changing version's state to fifth state...");
        try
        {
            newVersion.changeState(stateFive.getId());
        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

        /*
         *   Ready to save the work done so far; Trim the state tree to its
         *   minimum length.
         */
        try
        {
            stateOne.trimTree(stateOne.getId(), stateFive.getId());
        }
        catch (SeException e)
        {
            e.printStackTrace();
            System.out.println(e.getSeError().getSdeError());
        }
        System.out.println("\n End edit session Two");

    } // End editSessionTwo


    /*
     *   Perform more edits on VERSION_ONE
     */
    public static void editSessionThree() throws SeException
    {

        System.out.println("\n Starting edit session three  ");
        SeVersion versionOne = null;
        try
        {
            versionOne = new SeVersion(conn, VERSION_ONE);
        }
        catch (SeException e)
        {
            System.out.println(e.getSeError().getSdeError());
        }

        // Display info about the version
        getVersionInfo(versionOne);

        // Create a state object that will refer to VERSION_ONE's state
        SeState parentState = null;
        try
        {
            parentState = new SeState(conn, versionOne.getStateId());
        }
        catch (SeException se)
        {
            se.printStackTrace();
        }

        // Create a new state
        System.out.println("\n Creating new state");
        SeState stateOne = createChildState(parentState);

        /*
         *   Set up to perform edits on the first state
         */
        String[] columns = new String[1];
        int[] colDefs = new int[1];
        Object[] newValues = new Object[1];

        String whereClause = "STATE_NAME = \'Alabama\'";

        SeShape updated_shape = Util.getShape(conn, layer, whereClause);

        columns[0] = "SHAPE";
        colDefs[0] = SeColumnDefinition.TYPE_SHAPE;
        newValues[0] = updated_shape;

        Vector updateInfo = new Vector();
        updateInfo.add(columns);
        updateInfo.add(colDefs);
        updateInfo.add(newValues);

        /*
         *   Execute edit operations
         */
        System.out.println("\n First edit - update shape data");
        System.out.println(" Changing shape value for state_name Alabama");
        insertUpdate(UPDATE_OP, stateOne.getId(), updateInfo, whereClause);

        /*
         *   Create a new state, stateTwo that is a child of stateOne
         */
        System.out.println("\n Creating new state, stateTwo from stateOne");
        SeState stateTwo = createChildState(stateOne);

        /*
         *   Perform edits on second state
         */
        columns = new String[1];
        colDefs = new int[1];
        newValues = new Object[1];

        whereClause = "STATE_NAME = \'Kentucky\'";

        updated_shape = Util.getShape(conn, layer, whereClause);

        columns[0] = "SHAPE";
        colDefs[0] = SeColumnDefinition.TYPE_SHAPE;
        newValues[0] = updated_shape;

        updateInfo = new Vector();
        updateInfo.add(columns);
        updateInfo.add(colDefs);
        updateInfo.add(newValues);

        /*
         *   Execute edit operations
         */
        System.out.println("\n Second edit - update shape data");
        System.out.println(" Changing shape for state_name Kentucky");
        insertUpdate(UPDATE_OP, stateTwo.getId(), updateInfo, whereClause);

        /*
         *   Create a new state,stateThree that is a child of stateTwo
         */
        System.out.println("\n Creating new state, stateThree from stateTwo");
        SeState stateThree = createChildState(stateTwo);

        /*
         *   Perform edits on third state
         */
        whereClause = "STATE_NAME = \'New York\'";

        /*
         *   Execute edit operations
         */
        System.out.println(
                "\n Third edit - Deleting row corres state_name New York");
        deleteByClause(stateThree.getId(), whereClause);

        /*
         *   Move version pointer to the last stated edited, the third state.
         */
        System.out.println(" Changing version's state to third state...");
        try
        {
            versionOne.changeState(stateThree.getId());
        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

        /*
         *   Ready to save the work done so far; Trim the state tree to its
         *   minimum length.
         */
        try
        {
            stateOne.trimTree(stateOne.getId(), stateThree.getId());
        }
        catch (SeException e)
        {
            e.printStackTrace();
            System.out.println(e.getSeError().getSdeError());
        }
        System.out.println("\n End edit session three");

    } // End editSessionThree


    /*
     *   Create a new version, VERSION_TWO from the default
     *   and making edits to the new version.
     */
    public static void editSessionFour() throws SeException
    {

        System.out.println("\n Starting edit session four  ");
        SeVersion newVersion = null;
        try
        {
            // Create a new version for editing.
            newVersion = Util.createNewVersion(conn, VERSION_TWO,
                                               DEFAULT_VERSION);
        }
        catch (SeException e)
        {
            System.out.println(e.getSeError().getSdeError());
        }

        // Display info about the new version created
        getVersionInfo(newVersion);

        // Create a state object that will refer to VERSION_ONE's state
        SeState parentState = null;
        try
        {
            parentState = new SeState(conn, newVersion.getStateId());
        }
        catch (SeException se)
        {
            se.printStackTrace();
        }

        // Create a new state
        System.out.println("\n Creating new state");
        SeState stateOne = createChildState(parentState);

        /*
         *   Set up to perform edits on the first state
         */
        String[] columns = new String[2];
        int[] colDefs = new int[2];
        Object[] newValues = new Object[2];

        columns[0] = "State_name";
        colDefs[0] = SeColumnDefinition.TYPE_STRING;
        newValues[0] = new String("Louisiana_updated");
        String whereClause = "STATE_NAME = \'Louisiana\'";

        SeShape updated_shape = Util.getShape(conn, layer, whereClause);

        columns[1] = "SHAPE";
        colDefs[1] = SeColumnDefinition.TYPE_SHAPE;
        newValues[1] = updated_shape;

        Vector updateInfo = new Vector();
        updateInfo.add(columns);
        updateInfo.add(colDefs);
        updateInfo.add(newValues);

        /*
         *   Execute edit operations
         */
        System.out.println("\n First edit - update shape & attribute data");
        System.out.println(" Changing state_name & shape values");
        insertUpdate(UPDATE_OP, stateOne.getId(), updateInfo, whereClause);

        /*
         *   Create a new state, stateTwo that is a child of stateOne
         */
        System.out.println("\n Creating new state, stateTwo from stateOne");
        SeState stateTwo = createChildState(stateOne);

        /*
         *   Perform edits on second state
         */
        columns = new String[1];
        colDefs = new int[1];
        newValues = new Object[1];

        whereClause = "STATE_NAME = \'Arkansas\'";

        updated_shape = Util.getShape(conn, layer, whereClause);

        columns[0] = "SHAPE";
        colDefs[0] = SeColumnDefinition.TYPE_SHAPE;
        newValues[0] = updated_shape;

        updateInfo = new Vector();
        updateInfo.add(columns);
        updateInfo.add(colDefs);
        updateInfo.add(newValues);

        /*
         *   Execute edit operations
         */
        System.out.println("\n Second edit - update shape data");
        System.out.println(" Changing shape for state_name Arkansas");
        insertUpdate(UPDATE_OP, stateTwo.getId(), updateInfo, whereClause);

        /*
         *   Create a new state,stateThree that is a child of stateTwo
         */
        System.out.println("\n Creating new state, stateThree from stateTwo");
        SeState stateThree = createChildState(stateTwo);

        /*
         *   Perform edits on third state
         */
        SeObjectId idList[] = new SeObjectId[2];
        // Delete Montana.
        idList[0] = new SeObjectId(2);
        // Delete Idaho.
        idList[1] = new SeObjectId(8);

        /*
         *   Execute edit operations
         */
        System.out.println(
                "\n Third edit - Deleting rows corres to Objectids 2 & 8");
        deleteById(stateThree.getId(), idList);

        /*
         *   Create a new state, stateFour that is a child of stateThree
         */
        System.out.println("\n Creating new state, stateFour from stateThree");
        SeState stateFour = createChildState(stateThree);

        /*
         *   Perform edits on fourth state
         */
        columns = new String[1];
        colDefs = new int[1];
        newValues = new Object[1];

        whereClause = "STATE_NAME = \'Alabama\'";

        updated_shape = Util.getShape(conn, layer, whereClause);

        columns[0] = "SHAPE";
        colDefs[0] = SeColumnDefinition.TYPE_SHAPE;
        newValues[0] = updated_shape;

        updateInfo = new Vector();
        updateInfo.add(columns);
        updateInfo.add(colDefs);
        updateInfo.add(newValues);

        /*
         *   Execute edit operations
         */
        System.out.println("\n Fourth edit - update shape data");
        System.out.println(" Changing shape value for state_name Alabama");
        insertUpdate(UPDATE_OP, stateFour.getId(), updateInfo, whereClause);

        /*
         *   Move version pointer to the last stated edited, the fourth state.
         */
        System.out.println(" Changing version's state to fourth state...");
        try
        {
            newVersion.changeState(stateFour.getId());
        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

        /*
         *   Ready to save the work done so far; Trim the state tree to its
         *   minimum length.
         */
        try
        {
            stateOne.trimTree(stateOne.getId(), stateFour.getId());
        }
        catch (SeException e)
        {
            e.printStackTrace();
            System.out.println(e.getSeError().getSdeError());
        }
        System.out.println("\n End edit session four");

    } // End editSessionFour


    /*
     *   Creates a child state from parentState
     *   Verifies that parentState is closed
     *   Returns the child state created
     */
    public static SeState createChildState(SeState parentState)
    {

        SeState child = null;

        // Create a new state object
        try
        {
            child = new SeState(conn);
        }
        catch (SeException se)
        {
            se.printStackTrace();
        }

        // Check if parent state is open
        if (parentState.isOpen())
        {
            try
            {
                parentState.close();
            }
            catch (SeException e)
            {
                e.printStackTrace();
                return child;
            }
        }

        // Create the new state
        try
        {
            child.create(parentState.getId());
        }
        catch (SeException se)
        {
            se.printStackTrace();
        }

        return child;

    } // End method createChildState


    /**
     *   Does either an insert or Update operation
     */
    public static void insertUpdate(short operation, SeObjectId stateId,
                                    Vector editInfo, String whereClause)
    {

        String[] columns = (String[]) editInfo.firstElement();
        int[] colDefs = (int[]) editInfo.elementAt(1);
        Object[] values = (Object[]) editInfo.elementAt(2);

        SeStreamOp stream = null;
        try
        {

            if (operation == UPDATE_OP)
            {

                stream = new SeUpdate(conn);
                stream.setState(stateId,
                                new SeObjectId(SeState.SE_NULL_STATE_ID),
                                SeState.SE_STATE_DIFF_NOCHECK);

                ((SeUpdate) stream).toTable(layerName, columns, whereClause);
                ((SeUpdate) stream).setWriteMode(true);
            }
            else if (operation == INSERT_OP)
            {

                stream = new SeInsert(conn);
                stream.setState(stateId,
                                new SeObjectId(SeState.SE_NULL_STATE_ID),
                                SeState.SE_STATE_DIFF_NOCHECK);

                ((SeInsert) stream).intoTable(layerName, columns);
                ((SeInsert) stream).setWriteMode(true);
            }

            SeRow row = null;

            if (operation == UPDATE_OP)
            {
                row = ((SeUpdate) stream).getRowToSet();
            }
            else if (operation == INSERT_OP)
            {
                row = ((SeInsert) stream).getRowToSet();
            }

            for (int index = 0; index < colDefs.length; index++)
            {
                switch (colDefs[index])
                {

                case SeColumnDefinition.TYPE_BLOB:
                    row.setBlob(index,
                                (java.io.ByteArrayInputStream) values[index]);
                    break;
                case SeColumnDefinition.TYPE_DATE:
                    row.setDate(index, (java.util.Date) values[index]);
                    break;
                case SeColumnDefinition.TYPE_DOUBLE:
                    row.setDouble(index, (Double) values[index]);
                    break;
                case SeColumnDefinition.TYPE_FLOAT:
                    row.setFloat(index, (Float) values[index]);
                    break;
                case SeColumnDefinition.TYPE_INTEGER:
                    row.setInteger(index, (Integer) values[index]);
                    break;
                    //                    case SeColumnDefinition.TYPE_RASTER :
                    //                        row.set(index, values[index]);
                    //                        break;
                case SeColumnDefinition.TYPE_SHAPE:
                    row.setShape(index, (SeShape) values[index]);
                    break;
                case SeColumnDefinition.TYPE_SMALLINT:
                    row.setShort(index, (Short) values[index]);
                    break;
                case SeColumnDefinition.TYPE_STRING:
                    row.setString(index, (String) values[index]);
                    break;
                default:
                    System.out.println("\nERROR: Invalid Column Definition");
                    break;
                }
            }

            stream.execute();

        }
        catch (SeException e)
        {
            System.out.println("ERROR : " + e.getSeError().getErrDesc());
            e.printStackTrace();
        }
        finally
        {
            try
            {
                stream.close();
            }
            catch (SeException e)
            {
                System.out.println(e.getSeError().getSdeError());
                e.printStackTrace();
            }
        }

    } // End insertUpdate


    /*
     *   Deletes rows by ObjectId values.
     */
    public static void deleteById(SeObjectId stateId, SeObjectId[] deleteList)
    {

        if (deleteList != null)
        {

            SeDelete delete = null;
            try
            {
                delete = new SeDelete(conn);
                delete.setState(stateId,
                                new SeObjectId(SeState.SE_NULL_STATE_ID),
                                SeState.SE_STATE_DIFF_NOCHECK);

                /*
                 *   Delete all the rows in the deleteList array
                 */
                for (int i = 0; i < deleteList.length; i++)
                {
                    System.out.println("\n\t Deleting Row Id - " +
                                       deleteList[i].longValue());
                }
                delete.byIdList(table.getName(), deleteList);
                delete.close();
            }
            catch (SeException e)
            {
                System.out.println("ERROR : " + e.getSeError().getErrDesc());
                e.printStackTrace();
            }

        } // End if

    } //  End deleteById


    /*
     *   Deletes rows using where clause constraint.
     */
    public static void deleteByClause(SeObjectId stateId, String whereClause)
    {

        if (whereClause != null && !(whereClause.length() < 3))
        {

            SeDelete delete = null;
            try
            {
                delete = new SeDelete(conn);
                delete.setState(stateId,
                                new SeObjectId(SeState.SE_NULL_STATE_ID),
                                SeState.SE_STATE_DIFF_NOCHECK);
                delete.fromTable(table.getName(), whereClause);
                delete.close();
                conn.commitTransaction();
            }
            catch (SeException e)
            {
                System.out.println("ERROR : " + e.getSeError().getErrDesc());
                e.printStackTrace();
            }

        } // End if

    } //  End deleteById


    /*
     *   Reconcile VERSION_ONE with VERSION_ONE_CHILD
     */
    public static void reconcileVersionOneNChild() throws SeException
    {

        System.out.println("\n Reconciling VERSION_ONE with its child...");

        try
        {
            SeVersion versionOne = new SeVersion(conn, VERSION_ONE);
            SeVersion versionOneChild = new SeVersion(conn, VERSION_ONE_CHILD);

            // Get the state id's of both versions.
            SeObjectId vOneStateId = new SeObjectId(versionOne.getStateId().
                    longValue());
            SeObjectId vOneCStateId = new SeObjectId(versionOneChild.getStateId().
                    longValue());

            /*
             *  Create a new state to store results of reconciliation.
             *  This state will be a child of VERSION_ONE.
             */
            System.out.println(
                    "\n Creating a state to store results of reconciliation");
            SeState parentState = null;
            try
            {
                parentState = new SeState(conn, versionOne.getStateId());
            }
            catch (SeException e)
            {
                e.printStackTrace();
            }
            SeState reconState = createChildState(parentState);

            SeObjectId vOneOldStateId = new SeObjectId(vOneStateId.longValue());
            vOneStateId = new SeObjectId(reconState.getId().longValue());

            /*
             *  Keep all the data inserted into VERSION_ONE_CHILD
             *
             *   Scenario:
             *       VERSION_ONE_CHILD: Rows were inserted.
             *       VERSION_ONE: Rows do not exist.
             *
             *   Operation:
             *       Copy new rows to reconciled version.
             *
             *   Rows:
             *       Copy of Mississippi and Arkansas.
             */
            System.out.println(
                    "\n Copying rows that have been inserted by CHILD version");
            reconcileStates(vOneCStateId, // Source state id
                            vOneStateId, // Differences state id
                            vOneCStateId, // Copy from id
                            vOneStateId, // Target state id
                            SeState.SE_STATE_DIFF_INSERT, // differences type
                            null, // where clause
                            COPY_ROWS_FOUND); // Action to perform

            /*
             *   Delete the rows deleted in VERSION_ONE_CHILD.
             *
             *   Scenario 1:
             *      VERSION_ONE: Rows not modified.
             *      VERSION_ONE_CHILD: The same rows have been deleted
             *
             *   Operation:
             *       Delete those rows from reconciled version.
             *
             *   Row ids: 43 & 46.
             *
             *   Scenario 2:
             *      VERSION_ONE: Rows updated.
             *      VERSION_ONE_CHILD: The same rows have been deleted.
             *
             *   Operation:
             *       Delete those rows from reconciled version.
             *
             *   Row ids: 42.
             */
            System.out.println(
                    "\n Deleting rows that have been deleted by CHILD version");
            reconcileStates(vOneStateId, // Source state id
                            vOneCStateId, // Differences state id
                            new SeObjectId(SeState.SE_NULL_STATE_ID), // Copy from id
                            vOneStateId, // Target state id
                            SeState.SE_STATE_DIFF_NOCHANGE_DELETE, // differences type
                            null, // where clause
                            DELETE_ROWS_FOUND); // Action to perform

            reconcileStates(vOneStateId, // Source state id
                            vOneCStateId, // Differences state id
                            new SeObjectId(SeState.SE_NULL_STATE_ID), // Copy from id
                            vOneStateId, // Target state id
                            SeState.SE_STATE_DIFF_UPDATE_DELETE, // differences type
                            null, // where clause
                            DELETE_ROWS_FOUND); // Action to perform

            /*
             *  Keep all the data updated in VERSION_ONE_CHILD.
             *
             *   Scenario:
             *       VERSION_ONE_CHILD: Rows were updated.
             *       VERSION_ONE: Rows were updated.
             *
             *   Operation:
             *       Copy rows to reconciled version.
             *
             *   Rows:
             *       32, Kentucky.
             */
            System.out.println(
                    "\n Copying rows that have been updated by CHILD version");
            reconcileStates(vOneCStateId, // Source state id
                            vOneStateId, // Differences state id
                            vOneCStateId, // Copy from id
                            vOneStateId, // Target state id
                            SeState.SE_STATE_DIFF_UPDATE_UPDATE, // differences type
                            null, // where clause
                            COPY_ROWS_FOUND); // Action to perform

            /*
             *   Undo the delete operation done in VERSION_ONE.
             *
             *   Scenario 1:
             *      VERSION_ONE: Rows deleted.
             *      VERSION_ONE_CHILD: The same rows remain unchanged.
             *
             *   Operation:
             *       Copy row to reconciled version.
             *
             *   Row ids: 16, New York.
             *
             */
            System.out.println(
                    "\n Copying rows that have been deleted by PARENT version");
            reconcileStates(vOneCStateId, // Source state id
                            vOneStateId, // Differences state id
                            vOneCStateId, // Copy from id
                            vOneStateId, // Target state id
                            SeState.SE_STATE_DIFF_NOCHANGE_DELETE, // differences type
                            null, // where clause
                            COPY_ROWS_FOUND); // Action to perform

            // Close reconState
            reconState.close();

            // Changing version's state to recon state
            versionOne.changeState(reconState.getId());

            /*
             *   Ready to save the work done so far; Trim the state tree to its
             *   minimum length -  one state.
             */
            reconState.trimTree(parentState.getId(), reconState.getId());

            displayTableAtState(reconState.getId());

        }
        catch (SeException e)
        {
            e.printStackTrace();
            System.out.println("\n ERROR: " + e.getSeError().getErrDesc());
        }

        System.out.println("\n Done with reconcile.");
    } // End reconcileVersionOneNChild


    /*
     *
     */
    public static void reconcileVersionOneNTwo()
    {

        System.out.println("\n Reconciling VERSION_ONE & VERSION_TWO...");

        try
        {
            SeVersion versionOne = new SeVersion(conn, VERSION_ONE);
            SeVersion versionTwo = new SeVersion(conn, VERSION_TWO);

            // Get the state id's of both versions.
            SeObjectId vOneStateId = new SeObjectId(versionOne.getStateId().
                    longValue());
            SeObjectId vTwoStateId = new SeObjectId(versionTwo.getStateId().
                    longValue());

            /*
             *  Create a new state to store results of reconciliation.
             *  This state will be a child of VERSION_ONE.
             */
            System.out.println(
                    "\n Creating a state to store results of reconciliation");
            SeState parentState = null;
            try
            {
                parentState = new SeState(conn, versionOne.getStateId());
            }
            catch (SeException e)
            {
                e.printStackTrace();
            }
            SeState reconState = createChildState(parentState);

            SeObjectId vOneOldStateId = new SeObjectId(vOneStateId.longValue());
            vOneStateId = new SeObjectId(reconState.getId().longValue());

            /*
             *   Keep VERSION_TWO's updates.
             *
             *   Scenario 1:
             *       VERSION_TWO: Rows were updated.
             *       VERSION_ONE: Rows were updated.
             *
             *   Operation:
             *       Copy rows to reconciled version.
             *
             *   Rows:
             *       47- Louisiana.
             *
             *   Scenario 2:
             *      VERSION_ONE: Rows deleted.
             *      VERSION_TWO: Rows updated.
             *
             *   Operation:
             *       Copy rows to reconciled version.
             *
             *   Row ids: 42-Alabama, 46- Arkansas.
             */
            System.out.println(
                    "\n Copying rows that have been updated in version two and one");
            reconcileStates(vTwoStateId, // Source state id
                            vOneStateId, // Differences state id
                            vTwoStateId, // Copy from id
                            vOneStateId, // Target state id
                            SeState.SE_STATE_DIFF_UPDATE_UPDATE, // differences type
                            null, // where clause
                            COPY_ROWS_FOUND); // Action to perform

            System.out.println("\n Copying rows that have been updated by version two and deleted in version one");
            reconcileStates(vTwoStateId, // Source state id
                            vOneStateId, // Differences state id
                            vTwoStateId, // Copy from id
                            vOneStateId, // Target state id
                            SeState.SE_STATE_DIFF_UPDATE_DELETE, // differences type
                            null, // where clause
                            COPY_ROWS_FOUND); // Action to perform

            /*
             *   Delete the rows deleted in VERSION_TWO.
             *
             *   Scenario 1:
             *      VERSION_ONE: Rows not modified.
             *      VERSION_TWO: The same rows have been deleted.
             *
             *   Operation:
             *       Delete those rows from reconciled version.
             *
             *   Row ids: 8-Idaho & 2-Montana.
             *
             */
            System.out.println(
                    "\n Deleting rows that have been deleted in version two");
            reconcileStates(vOneStateId, // Source state id
                            vTwoStateId, // Differences state id
                            new SeObjectId(SeState.SE_NULL_STATE_ID), // Copy from id
                            vOneStateId, // Target state id
                            SeState.SE_STATE_DIFF_NOCHANGE_DELETE, // differences type
                            null, // where clause
                            DELETE_ROWS_FOUND); // Action to perform

            // Close reconState
            reconState.close();

            // Changing version's state to recon state
            versionOne.changeState(reconState.getId());

            /*
             *   Ready to save the work done so far; Trim the state tree to its
             *   minimum length -  one state.
             */
            reconState.trimTree(parentState.getId(), reconState.getId());

            displayTableAtState(reconState.getId());

        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

    } // End reconcileVersionOneNTwo


    /*
     *   Performs a single reconcile operation between two states, the source state
     *   and the difference state of the same table, such as
     *   - Deleting the rows in one state that have been deleted from the other state.
     *   - Copying over the rows that have been inserted in one state but not the other.
     *   - Preserve the updates made to one state and discard the updates/deletes made to
     *     the other.
     */
    public static void reconcileStates(SeObjectId sourceId,
                                       SeObjectId differencesId,
                                       SeObjectId copyFromId,
                                       SeObjectId targetId,
                                       int differenceType, String whereClause,
                                       int actionType)
    {

        System.out.println(" SourceId - " + sourceId.longValue());
        System.out.println(" DifferencesId - " + differencesId.longValue());

        SeSqlConstruct queryByTableName = null;
        String tableName = table.getQualifiedName();
        queryByTableName = new SeSqlConstruct(tableName, whereClause);
        String[] cols = new String[1];
        try
        {
            // Get SDE maintained Row_id column name.
            SeColumnDefinition[] colDefs = table.describe();
            for (int i = 0; i < colDefs.length; i++)
            {
                if (colDefs[i].getRowIdType() ==
                    SeRegistration.SE_REGISTRATION_ROW_ID_COLUMN_TYPE_SDE)
                {
                    // Bind output column
                    cols[0] = colDefs[i].getName();
                }
            }
        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

        SeRow row = null;
        SeColumnDefinition colDef = new SeColumnDefinition();
        SeQuery query = null;

        try
        {
            query = new SeQuery(conn, cols, queryByTableName);
            query.setState(sourceId, differencesId, differenceType);
            query.prepareQuery();
            query.execute();
            row = query.fetch();
        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

        if (row == null)
        {
            System.out.println(" No rows fetched");
            try
            {
                query.close();
            }
            catch (SeException e)
            {
                e.printStackTrace();
            }
            return ;
        }
        else
        {
            System.out.println(" No of cols " + row.getNumColumns());
        }

        /*
         *   Retrieve the Row_id values of the rows that satisfy the query
         *   and store them in the rowList vector.
         */
        Vector unsortedRowList = new Vector();
        Object[] currRow = new Object[1];
        int minVal = 100;
        int maxVal = 0;
        try
        {
            int rowNum = 0;
            while (row != null)
            {
                int max = row.getNumColumns();
                for (int i = 0; i < max; i++)
                {
                    colDef = row.getColumnDef(i);
                    int type = colDef.getRowIdType();
                    // don't try to retrieve the value if the indicator is NULL
                    if (row.getIndicator((short) i) != SeRow.SE_IS_NULL_VALUE)
                    {

                        switch (type)
                        {
                        case SeRegistration.
                                SE_REGISTRATION_ROW_ID_COLUMN_TYPE_SDE:
                            Integer value = row.getInteger(i);
                            int intVal = value.intValue();
                            if (intVal > maxVal)
                            {
                                maxVal = intVal;
                            }
                            if (intVal < minVal)
                            {
                                minVal = intVal;
                            }
                            currRow[0] = new Integer(value.intValue());
                            unsortedRowList.add(currRow.clone());
                            rowNum++;
                            break;
                        } // End switch
                    } // End if
                } // End for
                row = query.fetch();
            } // End while
        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

        try
        {
            unsortedRowList = Util.sort(unsortedRowList, 0, minVal, maxVal);
        }
        catch (Exception e)
        {
            System.out.println(e.getMessage());
            e.printStackTrace();
        }
        int size = unsortedRowList.size();
        SeObjectId[] rowIdList = new SeObjectId[size];

        for (int i = 0; i < size; i++)
        {
            rowIdList[i] = new SeObjectId(((Integer) (((Object[])
                    unsortedRowList.elementAt(i))[0])).intValue());
        }

        System.out.println(" Row id's retrieved ");
        for (int i = 0; i < rowIdList.length; i++)
        {
            System.out.println(" " + rowIdList[i].longValue());
        }

        try
        {
            query.close();
        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

        /*
         *   Collected the row ids required
         *   Now do either copy or delete operation
         */
        switch (actionType)
        {

        case DELETE_ROWS_FOUND:

            SeDelete delete = null;
            try
            {
                delete = new SeDelete(conn);
                delete.setState(targetId,
                                new SeObjectId(SeState.SE_NULL_STATE_ID)
                                , SeState.SE_STATE_DIFF_NOCHECK);
            }
            catch (SeException se)
            {
                System.out.println(se.getSeError().getErrDesc());
                se.printStackTrace();
            }

            try
            {
                delete.byIdList(table.getName(), rowIdList);
                delete.close();
            }
            catch (SeException se)
            {
                System.out.println(se.getSeError().getErrDesc());
                se.printStackTrace();
            }

            break
                    ;

        case COPY_ROWS_FOUND:

            SeUpdate update = null;
            try
            {
                update = new SeUpdate(conn);
                update.setState(targetId, copyFromId,
                                SeState.SE_STATE_DIFF_INSERT);
                update.copyStateRows(tableName, rowIdList);
                update.close();
            }
            catch (SeException se)
            {
                System.out.println(se.getSeError().getErrDesc());
                se.printStackTrace();
            }

            break
                    ;
        } // End switch

    } // End method reconcileStates


    /*
     *   Displays the rows of the table corresponding to the input stateId
     */
    public static void displayTableAtState(SeObjectId stateId)
    {

        System.out.println("\n Table contents at State : " + stateId.longValue());

        SeSqlConstruct queryByTableName = null;
        String tableName = table.getQualifiedName();
        String whereClause = null;
        queryByTableName = new SeSqlConstruct(tableName, whereClause);

        int numCols = 6;
        String[] cols = new String[numCols];
        cols[0] = "STATE_NAME";
        cols[1] = "STATE_FIPS";
        cols[2] = "POP1999";
        cols[3] = "MALES";
        cols[4] = "FEMALES";
        try
        {
            // Get SDE maintained Row_id column name.
            SeColumnDefinition[] colDefs = table.describe();
            for (int i = 0; i < colDefs.length; i++)
            {
                if (colDefs[i].getRowIdType() ==
                    SeRegistration.SE_REGISTRATION_ROW_ID_COLUMN_TYPE_SDE)
                {
                    cols[5] = colDefs[i].getName();
                }
            }
        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

        Object[] column = new Object[numCols];

        for (int i = 0; i < cols.length; i++)
        {
            System.out.print(cols[i] + "\t\t");
        }
        System.out.println();

        SeRow row = null;
        SeColumnDefinition colDef = new SeColumnDefinition();
        SeQuery query = null;

        try
        {
            query = new SeQuery(conn, cols, queryByTableName);
            query.setState(stateId, new SeObjectId(SeState.SE_NULL_STATE_ID),
                           SeState.SE_STATE_DIFF_NOCHECK);
            query.prepareQuery();
            query.execute();
            row = query.fetch();
        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

        Vector data = new Vector();
        int maxVal = 0;
        try
        {
            int rowNo = 0;
            while (row != null)
            {

                int max = row.getNumColumns();

                for (int i = 0; i < max; i++)
                {
                    colDef = row.getColumnDef(i);
                    int type = colDef.getType();
                    // don't try to retrieve the value if the indicator is NULL
                    if (row.getIndicator((short) i) != SeRow.SE_IS_NULL_VALUE)
                    {

                        switch (type)
                        {

                        case SeColumnDefinition.TYPE_INTEGER:
                            if (colDef.getName().equalsIgnoreCase(cols[5]))
                            {
                                column[i] = row.getInteger(i);
                                int tmp = row.getInteger(i).intValue();
                                if (tmp > maxVal)
                                {
                                    maxVal = tmp;
                                }
                            }
                            else
                            {
                                String val = row.getInteger(i).toString();
                                if (val.length() < 8)
                                {
                                    column[i] = val + "\t\t";
                                }
                                else
                                {
                                    column[i] = val + "\t";
                                }
                            }
                            break;

                        case SeColumnDefinition.TYPE_STRING:
                            String state_name = row.getString(i);

                            if (colDef.getName().equalsIgnoreCase("STATE_NAME"))
                            {
                                if (state_name.length() < 8)
                                {
                                    column[i] = state_name + "\t\t\t";
                                }
                                else if (state_name.length() < 16)
                                {
                                    column[i] = state_name + "\t\t";
                                }
                                else
                                {
                                    column[i] = state_name + "\t";
                                }
                            }
                            if (colDef.getName().equalsIgnoreCase("STATE_FIPS"))
                            {
                                if (state_name.length() < 8)
                                {
                                    column[i] = state_name + "\t\t\t";
                                }
                                else
                                {
                                    column[i] = state_name + "\t";
                                }
                            }
                            break;

                        case SeColumnDefinition.TYPE_DOUBLE:
                            String val = (new Integer(row.getDouble(i).intValue())).
                                         toString();

                            if (val.length() < 8)
                            {
                                column[i] = val + "\t\t";
                            }
                            else
                            {
                                column[i] = val + "\t";
                            }

                        } // End switch
                    }
                    else
                    {
                        column[i] = "\t\t";
                    }
                } // End for
                data.add(column.clone());
                column = new Object[numCols];
                row = query.fetch();
            } // End while
        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

        Vector sorted = Util.sort(data, 5, maxVal);

        for (int i = 0; i < sorted.size(); i++)
        {
            for (int j = 0; j < numCols; j++)
            {
                System.out.print(((Object[]) sorted.elementAt(i))[j]);
            }
            System.out.println();
        }

        try
        {
            query.close();
        }
        catch (SeException e)
        {
            e.printStackTrace();
        }
    } // End displayTableAtState


    /*
     *   Retrieves and displays the details about the version
     */
    public static void getVersionInfo(SeVersion version)
    {

        System.out.println("\n Version info");
        System.out.println(" Desc - " + version.getDescription());
        System.out.println(" Name - " + version.getName());
        System.out.println(" Parent Name - " + version.getParentName());

    } // End getVersionInfo

} // End class Versioning02
