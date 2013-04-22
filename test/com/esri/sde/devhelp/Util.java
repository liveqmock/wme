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

package com.esri.sde.devhelp;

import com.esri.sde.sdk.client.*;
import com.esri.sde.sdk.geom.*;
import java.io.*;
import java.util.*;

/**
*
* This class contains generic utility methods that can be used when writing
* Java API client programs. It contains methods that
* are commonly used by the Java API QA test programs.
* <P>
* Some of the most commonly used methods are:
* <P>
* - <code>createTable</code> : creates a predefined ArcSDE Table. Almost
* all the QA test programs use this method to create the base Table.
* <P>
* - <code>createLayer</code> : adds a spatial column to an existing Table.
* <P>
* - <code>fetchAllColumns</code> : fetches data from a specified Table or Layer.
*
* @author Rajkumar Padmanabhan
* @version $Id: Util.java,v 1.5 2003/12/19 01:33:51 rajk3142 Exp $
*
*/
public class Util {

    /**
    * Defines the number of columns for the predefined QA Table; does not include
    * the spatial column, if the Table is a Layer.
    */
    public static final int NUM_TABLE_COLS = 7;

    /**
    * Defines the name of the QA Table's integer column.
    */
    public static final String INT_COL_NAME = "INT_COL";

    /**
    * Defines the name of the QA Table's short column.
    */
    public static final String SHORT_COL_NAME = "SHORT_COL";

    /**
    * Defines the name of the QA Table's float column.
    */
    public static final String FLOAT_COL_NAME = "FLOAT_COL";

    /**
    * Defines the name of the QA Table's double column.
    */
    public static final String DOUBLE_COL_NAME = "DOUBLE_COL";

    /**
    * Defines the name of the QA Table's string column.
    */
    public static final String STRING_COL_NAME = "STRING_COL";

    /**
    * Defines the name of the QA Table's date column.
    */
    public static final String DATE_COL_NAME = "DATE_COL";

    /**
    * Defines the name of the QA Table's BLOB column.
    */
    public static final String BLOB_COL_NAME = "BLOB_COL";

    /**
    * Defines a bit mask. Used as the
    * <code>displayOptions</code> argument
    * of the <code>{@link #fetchAllColumns}</code> or
    * <code>{@link #getData}</code>
    * method, to display the layer/table's attribute data.
    */
    public static final int DISPLAY_ATTR_DATA = ( 1<<0 );

    /**
    * Defines a bit mask. Used as the
    * <code>displayOptions</code> argument
    * of the <code>{@link #getData}</code> method,
    * to display the shape details.
    * Combine this mask with the individual shape display
    * masks to select
    * exact details to be displayed:
    * <PRE>
    * {@link #DISPLAY_SHAPE_TYPE}
    * {@link #DISPLAY_SHAPE_ENVELOPE}
    * {@link #DISPLAY_SHAPE_COORDS}
    * {@link #DISPLAY_SHAPE_POINTS}
    * {@link #DISPLAY_SHAPE_ANNO}
    * {@link #DISPLAY_SHAPE_CREF}
    * {@link #DISPLAY_SHAPE_MISC}
    * </PRE>
    */
    public static final int DISPLAY_SHAPES = ( 1<<1 );

    /**
    * Defines a bit mask. Used as the
    * <code>displayOptions</code> argument
    * of the <code>{@link #fetchAllColumns}</code>
    * or <code>{@link #displayShape}</code>
    * or <code>{@link #getData}</code> method, to display the shape type.
    */
    public static final int DISPLAY_SHAPE_TYPE = ( 1<<2 ) | DISPLAY_SHAPES;

    /**
    * Defines a bit mask. Used as the <code>displayOptions</code> argument
    * of the <code>{@link #fetchAllColumns}</code> or
    * <code>{@link #displayShape}</code>
    * or <code>{@link #getData}</code> method, to display the shape envelope.
    *
    */
    public static final int DISPLAY_SHAPE_ENVELOPE = ( 1<<3 ) | DISPLAY_SHAPES;

    /**
    *  Defines a bit mask. Used as the <code>displayOptions</code> argument
    * of the <code>{@link #fetchAllColumns}</code> or
    * <code>{@link #displayShape}</code>
    * or <code>{@link #getData}</code> method,
    * to retrieve the shape's co-ordinates using
    * SeShape.getAllCoords().
    */
    public static final int DISPLAY_SHAPE_COORDS = ( 1<<4 ) | DISPLAY_SHAPES;

    /**
    *  Defines a bit mask. Used as the <code>displayOptions</code> argument
    * of the <code>{@link #fetchAllColumns}</code> or
    * <code>{@link #displayShape}</code>
    * or <code>{@link #getData}</code> method,
    * to retrieve the shape's co-ordinates using SeShape.getAllPoints().
    */
    public static final int DISPLAY_SHAPE_POINTS = ( 1<<5 ) | DISPLAY_SHAPES;

    /**
    * Defines a bit mask. Used as the <code>displayOptions</code> argument
    * of the <code>{@link #fetchAllColumns}</code> or
    * <code>{@link #displayShape}</code>
    * or <code>{@link #getData}</code> method, to display
    * the shape's annotation.
    */
    public static final int DISPLAY_SHAPE_ANNO = ( 1<<6 ) | DISPLAY_SHAPES;

    /**
    * Defines a bit mask. Used as the <code>displayOptions</code> argument
    * of the <code>{@link #fetchAllColumns}</code> or
    * <code>{@link #displayShape}</code>
    * or <code>{@link #getData}</code> method, to display the
    * shape's Coordinate Reference information.
    */
    public static final int DISPLAY_SHAPE_CREF = ( 1<<7 ) | DISPLAY_SHAPES;

    /**
    * Defines a bit mask. Used as the <code>displayOptions</code> argument
    * of the <code>{@link #fetchAllColumns}</code> or
    * <code>{@link #displayShape}</code>
    * or <code>{@link #getData}</code> method, to display the shape's
    * miscellaneous information like Feature id, Area, length.
    */
    public static final int DISPLAY_SHAPE_MISC = ( 1<<8 ) | DISPLAY_SHAPES;

    /**
    * Defines a bit mask. Used as the <code>displayOptions</code> argument
    * of the <code>{@link #fetchAllColumns}</code> or
    * <code>{@link #displayShape}</code>
    * or <code>{@link #getData}</code> method.
    * This mask is basically the result of an OR of all
    * the shape display masks.
    */
    public static final int DISPLAY_SHAPE_DETAILS = DISPLAY_SHAPE_CREF | DISPLAY_SHAPE_ANNO | DISPLAY_SHAPE_POINTS
    | DISPLAY_SHAPE_COORDS | DISPLAY_SHAPE_ENVELOPE | DISPLAY_SHAPE_TYPE | DISPLAY_SHAPE_MISC;

    /**
    * Defines the name of the QA Table's shape column.
    */
    public static final String SHAPE_COL_NAME = "SHAPE";




    public static void copySdeTable(SeConnection destConn, String srcTableName
                      , String destTableName,String keyword, boolean isLayer) {

        try {
            /*
             * Create a connection to the server that has the QA layers.
             */
            SeConnection srcConn = new SeConnection("brainmaster", 5153, "", "world", "world");

            SeTable srcTable = new SeTable(srcConn, srcTableName);

            SeColumnDefinition[] srcColDefs = srcTable.describe();

            int numColumns = srcColDefs.length;

            SeColumnDefinition[] destColDefs = null;
            if( isLayer ) {

                destColDefs = new SeColumnDefinition[(numColumns-1)];
                try {
                    for( int i = 0, j = 0 ; i < (numColumns-1) ; i++ )
                        if( srcColDefs[i].getType() != SeColumnDefinition.TYPE_SHAPE) {
                            destColDefs[j] = (SeColumnDefinition)srcColDefs[i].clone();
                            j++;
                        }
                } catch ( CloneNotSupportedException ce ) {
                    ce.printStackTrace();
                }

            } else {
                destColDefs = new SeColumnDefinition[numColumns];
            }

            SeTable destTable = createTable(destConn, keyword, destTableName, destColDefs);

            SeLayer destLayer = null;
            SeCoordinateReference cref = null;

            if( isLayer ) {
                SeLayer srcLayer = new SeLayer( srcConn, srcTableName, "SHAPE");

                destLayer = new SeLayer(destConn);

                destLayer.setTableName(destTableName);
                destLayer.setDescription("QA Test Layer");
                destLayer.setCoordRef(srcLayer.getCoordRef());
                destLayer.setCreationKeyword(keyword);
                destLayer.setShapeTypes( srcLayer.getShapeTypes());
                destLayer.setExtent( srcLayer.getExtent());
                double[] gridSizes = srcLayer.getGridSizes();
                destLayer.setGridSizes( gridSizes[0], gridSizes[1], gridSizes[2]);
                Util.createLayer(destLayer, 25, 4);
                destLayer.getInfo();
                cref = destLayer.getCoordRef();
            }

            SeSqlConstruct sqlCons = new SeSqlConstruct( srcTableName, "" );

            SeTable table = new SeTable(srcConn, srcTableName );
            String[] cols = new String[numColumns];

            for( int i = 0 ; i < numColumns ; i++ )
                cols[i] = srcColDefs[i].getName();

            SeQuery query = new SeQuery( srcConn, cols, sqlCons );
            query.prepareQuery();
            query.execute();

            SeInsert insert = new SeInsert(destConn);
            insert.intoTable(destTableName, cols);
            insert.setWriteMode(true);
            SeRow rowToInsert = insert.getRowToSet();

            SeRow fetchedRow = query.fetch();

            while ( fetchedRow != null ) {
                for( int index = 0 ; index < numColumns ; index++ ) {
                    switch( srcColDefs[index].getType() ) {

                        case SeColumnDefinition.TYPE_INT16:
                            rowToInsert.setShort( index, fetchedRow.getShort(index) );
                            break;

                        case SeColumnDefinition.TYPE_INT32:
                            rowToInsert.setInteger( index, fetchedRow.getInteger(index) );
                            break;

                        case SeColumnDefinition.TYPE_INT64:
                            rowToInsert.setLong( index, fetchedRow.getLong(index) );
                            break;
                        case SeColumnDefinition.TYPE_FLOAT32:
                            rowToInsert.setFloat( index, fetchedRow.getFloat(index) );
                            break;
                        case SeColumnDefinition.TYPE_FLOAT64:
                            rowToInsert.setDouble( index, fetchedRow.getDouble(index) );
                            break;
                        case SeColumnDefinition.TYPE_DATE:
                            rowToInsert.setTime( index, fetchedRow.getTime(index) );
                            break;
                        case SeColumnDefinition.TYPE_BLOB:
                            rowToInsert.setBlob( index, fetchedRow.getBlob(index) );
                            break;
                        case SeColumnDefinition.TYPE_STRING:
                            rowToInsert.setString( index, fetchedRow.getString(index) );
                            break;
                        case SeColumnDefinition.TYPE_SHAPE:
                            SeShape shape = fetchedRow.getShape(index);
                            shape.setCoordRef(cref);
                            rowToInsert.setShape( index, shape);
                            break;
                    }
                }

                insert.execute();
                fetchedRow = query.fetch();
            }

            insert.close();
            query.close();

            srcConn.close();
        } catch ( SeException e ) {
            System.out.println("\n Error occured while loading test data.");
            printError(e);
        }
    }



    /**
    *   Creates child state from a parent state.
    *   @param  parentState The parent State.
    *   @param  conn    Connection handle.
    */
    public static SeState createChildState(SeState parentState, SeConnection conn) throws SeException {

        SeState child = null;

        child = new SeState(conn);

        if( parentState.isOpen() ) {

            System.out.println(" Parent State is Open! Closing it first!");
            parentState.close();
            parentState = new SeState( conn, parentState.getId() );
        }

        child.create(parentState.getId());

        return child;

    } // End method createChildState




    /**
    *   Adds a spatial column to an existing ArcSDE Table.
    * Before passing in the SeLayer argument to this method, any of the
    * SeLayer set methods may be invoked. Default values
    * are used if the layer object passed does not have any property
    * set.
    *   @param  conn    open connection to an ArcSDE server.
    *   @param  desc    layer description.
    *   @param  layer   SeLayer object. Use SeLayer set
    *   methods to set layer properties. Must set table name
    *   and coordinate reference values.
    *   Other values if not set, are set to the default:
    *   <pre>
    *   Spatial Column Name = SHAPE.
    *   Shape Types         = ALL SHAPE TYPES ARE ALLOWED.
    *   Layer Extent        = (0.0,0.0,20000.0,20000.0).
    *
    *   The layer`s grids size are always set to (1000,0,0). If the layer`s configuration
    * keyword is not set, the keyword "DEFAULT" is used.
    * </pre>
    *
    */
    public static void createLayer(SeLayer layer, int initialFeatures, int avgPoints) throws SeException {

        if( layer == null ) {
            throw new NullPointerException("Null SeLayer object");
        }

        if( layer.getName().equals("") ) {
            throw new IllegalArgumentException("Invalid table name");
        }

        if( layer.getSpatialColumn().equals("") )
            layer.setSpatialColumnName(SHAPE_COL_NAME);

        if( layer.getShapeTypes() == 0 )
            layer.setShapeTypes( SeLayer.SE_NIL_TYPE_MASK | SeLayer.SE_POINT_TYPE_MASK |
                 SeLayer.SE_LINE_TYPE_MASK | SeLayer.SE_SIMPLE_LINE_TYPE_MASK |
                 SeLayer.SE_AREA_TYPE_MASK | SeLayer.SE_MULTIPART_TYPE_MASK );

        SeExtent ext = layer.getExtent();

        if( ext.isEmpty() ) {
            ext = new SeExtent(0.0,0.0,20000.0,20000.0);
            layer.setExtent(ext);
        }

        double[] gridSizes = layer.getGridSizes();

        if( gridSizes[0] == 0 ) {
            layer.setGridSizes(1000.0,0.0,0.0);
        }

        String keyword = layer.getCreationKeyword();
        if( keyword == null ) {
            System.out.println("\nLayer creation keyword = DEFAULTS");
            layer.setCreationKeyword("DEFAULTS");
        } else if( keyword.equalsIgnoreCase("DEFAULTS") ) {
            System.out.println("\nLayer creation keyword = DEFAULTS");
        } else if( keyword.equalsIgnoreCase("SDO_GEOMETRY") ) {
            System.out.println("\nLayer creation keyword = SDO_GEOMETRY");
            layer.setGridSizes(SeLayer.SE_SPATIALINDEX_RTREE, 0.0, 0.0);
        } else if( keyword.equalsIgnoreCase("SDE_LOB") ) {
            System.out.println("\nLayer creation keyword = SDE_LOB");
        }

        layer.create(initialFeatures, avgPoints);

    }   // End method createLayer




    /**
     *   Creates a new version from a parent version.
     *  @param  conn    open connection handle.
     *  @param versionName name of the new version to be created.
     *  @param  parentVersionName   name of the parent Version.
     */
    public static SeVersion createNewVersion( SeConnection conn, String versionName, String parentVersionName ) throws SeException {

        SeVersion newVersion = null;
        try {
            /*
            *   Delete the version if it exists.
            */
            newVersion = new SeVersion(conn, versionName);
            newVersion.delete();
            newVersion = new SeVersion(conn);
        }catch( SeException e ) {
            if( e.getSeError().getSdeError() == SeError.SE_VERSION_NOEXIST )
                try{
                    newVersion = new SeVersion(conn);
                }catch( SeException se ) {
                    printError(se);
            } else {
                e.printStackTrace();
                System.out.println(e.getSeError().getSdeError());
                System.out.println(e.getSeError().getErrDesc());
            }
        }

        // Retrieve parent version from server.
        // We need its state id.
        newVersion = new SeVersion(conn, parentVersionName);

        // Retrieve info of parent version
        newVersion.getInfo();

        // Set the new version's description
        newVersion.setDescription(versionName + " - Child of " + parentVersionName);

        // Set the new version's name
        newVersion.setName(versionName);

        // Set the new version's parent name
        newVersion.setParentName(parentVersionName);

        boolean uniqueName = true;
        System.out.println("\n--> Creating new version as child of " + parentVersionName);

        /*
        *   Create a child of the version; enable unique naming.
        */
        newVersion.create(uniqueName, newVersion);

        // Return a handle to the new version created.
        return newVersion;

    } // End method createNewVersion




    /**
    *
    * Creates a new ArcSDE Table. The configuration keyword
    * and column definitions may be defined. If they are not and null values are
    * passed in, the defaults are used.
    *   @param conn open connection handle to an ArcSDE server.
    *   @param configKeyword    the table's creation keyword. If this argument is null,
    * "DEFAULTS" will be used.
    *   @param tableName    name of table to be created. If this is null, then
    *   "QA_TABLE" is used instead.
    *   @param  colDef  The required column definition. If value is null then
    *   the table created will have 7 columns:
    *   <pre>
    *   1. TYPE_INTEGER
    *   2. TYPE_SMALLINT
    *   3. TYPE_FLOAT
    *   4. TYPE_DOUBLE
    *   5. TYPE_STRING
    *   6. TYPE_DATE
    *   7. TYPE_BLOB
    *   </pre>
    */
    public static SeTable createTable(SeConnection conn, String configKeyword, String tableName, SeColumnDefinition[] colDefs) throws SeException {

       /*
        *   Create a qualified table name with current user's name and
        *   the table name.
        */
        String qualTableName = null;
        if( tableName == null || tableName.length() == 0 )
            qualTableName = conn.getUser() + "." + "QA_TABLE";
        else
            qualTableName = conn.getUser() + "." + tableName;

        SeTable table = new SeTable( conn, qualTableName );

        /*
        *   Delete table if it already exists
        */
        try {
            table.delete();
        } catch( SeException e) {
            /*
            *   If the table doesn't exist don't worry. Otherwise print
            *   the stack trace.
            */
            if( SeError.SE_TABLE_NOEXIST != e.getSeError().getSdeError())
                printError(e);
        }

        boolean isNullable = true;
        int size = 0;
        int scale = 0;

        /*
        *   Define columns for the tables..
        */
        if( colDefs == null ) {
            colDefs = new SeColumnDefinition[NUM_TABLE_COLS];

            colDefs[0] = new SeColumnDefinition( INT_COL_NAME, SeColumnDefinition.TYPE_INTEGER, 9, 0, isNullable);
            colDefs[1] = new SeColumnDefinition( SHORT_COL_NAME, SeColumnDefinition.TYPE_SMALLINT, 4, 0, isNullable);
            colDefs[2] = new SeColumnDefinition( FLOAT_COL_NAME, SeColumnDefinition.TYPE_FLOAT, 5, 3, isNullable);
            colDefs[3] = new SeColumnDefinition( DOUBLE_COL_NAME, SeColumnDefinition.TYPE_DOUBLE, 16, 10, isNullable);
            colDefs[4] = new SeColumnDefinition( STRING_COL_NAME, SeColumnDefinition.TYPE_STRING, size, scale, isNullable);
            colDefs[5] = new SeColumnDefinition( DATE_COL_NAME, SeColumnDefinition.TYPE_DATE, size, scale, isNullable);
            colDefs[6] = new SeColumnDefinition( BLOB_COL_NAME, SeColumnDefinition.TYPE_BLOB, size, scale, isNullable);
        }
        if( configKeyword != null )
            table.create( colDefs, configKeyword );
        else
            table.create( colDefs, "DEFAULTS" );
        return table;

    }   //  End method createTable




    /**
    *   Displays details about the SeShape object passed into
    *   this method.
    *   @param shape    the shape object.
    *   @param displayOptions bit mask specifying what details to display.
    *  Valid values:
    *   <pre>
    *   {@link #DISPLAY_SHAPE_TYPE }
    *   {@link #DISPLAY_SHAPE_ENVELOPE }
    *   {@link #DISPLAY_SHAPE_COORDS }
    *   {@link #DISPLAY_SHAPE_POINTS }
    *   {@link #DISPLAY_SHAPE_ANNO }
    *   {@link #DISPLAY_SHAPE_CREF }
    *   {@link #DISPLAY_SHAPE_MISC }
    *   {@link #DISPLAY_SHAPE_DETAILS }
    *   </pre>
    */
    public static void displayShape(SeShape shape, int displayOptions) throws SeException {

        if( shape == null ) {
            System.out.println("SeShape object is null");
            return;
        }

        /*
        *   Display Feature type.
        */
        if( (displayOptions & DISPLAY_SHAPE_TYPE) == DISPLAY_SHAPE_TYPE) {

            getShapeType(shape);
        }   // End if

        /*
        *   Display shape envelope.
        */
        if( (displayOptions & DISPLAY_SHAPE_ENVELOPE) == DISPLAY_SHAPE_ENVELOPE) {

            SeExtent sExtent = null;
            try {
                sExtent = shape.getExtent();
            } catch( SeException se ) {
                printError(se);
            }
            System.out.println("\nShape Extent " + sExtent.getMinX() + "  "+ sExtent.getMinY() + "  "+ sExtent.getMaxX() + "  "+ sExtent.getMaxY());
        }   // End if

        /*
        *   Get shape's co-ordinates using SeShape.getAllCoords().
        */
        if( (displayOptions & DISPLAY_SHAPE_COORDS) == DISPLAY_SHAPE_COORDS) {

            getAllCoords( shape );
        }   // End if

        /*
        *   Get shape's co-ordinates using SeShape.getAllPoints().
        */
        if( (displayOptions & DISPLAY_SHAPE_POINTS) == DISPLAY_SHAPE_POINTS) {

            getAllPoints( shape );
        }   // End if

        /*
        *   Display shape's Coordinate Reference
        */
        if( (displayOptions & DISPLAY_SHAPE_CREF) == DISPLAY_SHAPE_CREF) {

            try{
                SeCoordinateReference cref = shape.getCoordRef();
                getCoordRefDetails(cref);
            }catch( SeException e) {
                printError(e);
            }

        }   // End if

        /*
        *   Display shape's other attributes
        */
        if( (displayOptions & DISPLAY_SHAPE_MISC) == DISPLAY_SHAPE_MISC) {

            try {
                System.out.println("Feature id -> " + shape.getFeatureId().longValue() );
                System.out.println("Length -> " + shape.getLength() );
                System.out.println("Area -> " + shape.getArea() );
                System.out.println("Is 3D -> " + shape.is3D() );
                System.out.println("Is Line -> " + shape.isLine() );
                System.out.println("Is Measured -> " + shape.isMeasured() );
                System.out.println("Is Multi-part -> " + shape.isMultiPart() );
                System.out.println("Is Nil -> " + shape.isNil() );
                System.out.println("Is Point -> " + shape.isPoint() );
                System.out.println("Is Polygon -> " + shape.isPolygon() );
                System.out.println("Is Simple Line -> " + shape.isSimpleLine() );
                System.out.println("\nString rep -> " + shape.toString() );
            }catch( SeException e) {
                printError(e);
            }
        }

        /*
        *   Display shape's annotation.
        */
        if( shape.hasAnno() && ((displayOptions & DISPLAY_SHAPE_ANNO) == DISPLAY_SHAPE_ANNO) ) {

            System.out.println("\nShape Annotation:");
            try {
            SeShapeAnno anno = shape.getAnno();
            int alignment = anno.getAlignment();
            System.out.print("\nAlignment : ");
            switch( alignment ) {

            case SeShapeAnno.SE_ANNO_ALIGN_DEFAULT:
                System.out.println("ALIGN_DEFAULT");
                break;

            case SeShapeAnno.SE_ANNO_ALIGN_LEFT:
                System.out.println("ALIGN_LEFT");
                break;

            case SeShapeAnno.SE_ANNO_ALIGN_RIGHT:
                System.out.println("ALIGN_RIGHT");
                break;

            case SeShapeAnno.SE_ANNO_ALIGN_CENTER:
                System.out.println("ALIGN_CENTER");
                break;

            case SeShapeAnno.SE_ANNO_ALIGN_AUTOMATIC:
                System.out.println("ALIGN_AUTOMATIC");
                break;

            default:
                System.out.println("NO ALIGNMENT??");
                break;

            } // End switch(alignment)

            System.out.println("Gap Ratio : " + anno.getGapRatio() );

            System.out.println("Height : " + anno.getHeight() );

            System.out.print("Justification : ");
            int justification = anno.getJustification();
            switch( justification ) {

            case SeShapeAnno.SE_ANNO_UPPER_LEFT :
                System.out.println("SE_ANNO_UPPER_LEFT");
                break;

            case SeShapeAnno.SE_ANNO_UPPER_CENTER :
                System.out.println("SE_ANNO_UPPER_CENTER");
                break;

            case SeShapeAnno.SE_ANNO_UPPER_RIGHT :
                System.out.println("SE_ANNO_UPPER_RIGHT ");
                break;

            case SeShapeAnno.SE_ANNO_CENTER_LEFT :
                System.out.println("SE_ANNO_CENTER_LEFT");
                break;

            case SeShapeAnno.SE_ANNO_CENTER_CENTER :
                System.out.println("SE_ANNO_CENTER_CENTER");
                break;

            case SeShapeAnno.SE_ANNO_CENTER_RIGHT :
                System.out.println("SE_ANNO_CENTER_RIGHT");
                break;

            case SeShapeAnno.SE_ANNO_LOWER_LEFT :
                System.out.println("SE_ANNO_LOWER_LEFT");
                break;

            case SeShapeAnno.SE_ANNO_LOWER_CENTER:
                System.out.println("SE_ANNO_LOWER_CENTER");
                break;

            case SeShapeAnno.SE_ANNO_LOWER_RIGHT:
                System.out.println("SE_ANNO_LOWER_RIGHT");
                break;

            default:
                System.out.println("NO JUSTIFICATION");
                break;

            } // End switch(justification)

            System.out.println("Leader Shape:" );
            displayShape(anno.getLeader(), displayOptions);

            System.out.print("Anno Level: " + anno.getLevel() );

            System.out.print(", Anno symbol : " + anno.getSymbol());

            System.out.println(", Anno text :" + anno.getText() );

            System.out.print("X Offset: " + anno.getXOffset() );

            System.out.println(", Y Offset: " + anno.getYOffset() );

            System.out.println("Annotation Placement Shape:");
            displayShape(anno.getPlacement(), Util.DISPLAY_SHAPE_DETAILS);

            }catch( SeException e ) {
                printError(e);
            }
        }    // End if

    }   //  End method displayShape




    /**
    *
    *   Retrieves all rows of data from an ArcSDE Table/Layer.
    *   Initializes the query stream with SeQuery.prepareQuery().
    *
    *   <p>
    *   @param conn     handle to an open ArcSDE connection.
    *   @param tableName    qualified name of the ArcSDE Table/Layer.
    *   @param displayOptions bit mask specifying what information to display.
    *  Valid values are:
    *   <pre>
    *   {@link #DISPLAY_SHAPES }
    *   {@link #DISPLAY_ATTR_DATA }
    *   {@link #DISPLAY_SHAPE_TYPE }
    *   {@link #DISPLAY_SHAPE_ENVELOPE }
    *   {@link #DISPLAY_SHAPE_COORDS }
    *   {@link #DISPLAY_SHAPE_POINTS }
    *   {@link #DISPLAY_SHAPE_ANNO }
    *   {@link #DISPLAY_SHAPE_CREF }
    *   {@link #DISPLAY_SHAPE_MISC }
    *   {@link #DISPLAY_SHAPE_DETAILS }
    *   </pre>
    *
    *   @param whereClause  optional where clause constraint.
    *
    */
    public static void fetchAllColumns(SeConnection conn, String tableName,
            int displayOptions, String whereClause ) throws SeException {

        SeQuery query = null;

        try {

            SeSqlConstruct sqlCons = new SeSqlConstruct( tableName, whereClause );

            SeTable table = new SeTable(conn, tableName );
            SeColumnDefinition[] tableDef = table.describe();
            int numColumns = tableDef.length;
            String[] cols = new String[numColumns];
            /*
            *   Retrieve the names of all the columns of the table/layer
            *   & store them in String[] cols.
            */
            for( int count = 0 ; count < numColumns ; count++)
                cols[count] = tableDef[count].getName();

            /*
            *   Define, prepare & execute query.
            */
            query = new SeQuery( conn, cols, sqlCons );
            query.prepareQuery();
            query.execute();

            /*
            *   Invoke getData to fetch data from server.
            */
            getData(query, displayOptions);

        } catch ( Exception e ) {
            e.printStackTrace();
        }finally {
            /*
            *   Close query stream.
            */
            query.close();
        }
    }   //  End method fetchAllColumns




    /**
    *   Displays the X & Y coordinate values of a shape using
    *   the SeShape.getAllCoords() method.
    *   @param shape    the SeShape object.
    */
    public static void getAllCoords( SeShape shape )throws SeException {

        if( shape.isNil() ) {
            System.out.println(" Nil SeShape object");
            return;
        }

        double points[][][] = shape.getAllCoords();
        int numParts = shape.getNumParts();

        // This should never happen
        if( points.length != numParts )
            System.out.println("No. of parts not equal " );

        System.out.println("No. of parts : " + numParts );
        System.out.println("No. of points : " + shape.getNumOfPoints() );

        for( int partNo = 0 ; partNo < numParts ; partNo++ ) {

            int numSubParts = shape.getNumSubParts(partNo+1);
            if( points[partNo].length != numSubParts )
                System.out.println("No. of sub-parts not equal " );
            System.out.println("No. of sub-parts : " + numSubParts );
            System.out.print("Part Extent: ");

            SeExtent sExtent = null;
            try {
                sExtent = shape.getExtent(partNo+1);
            } catch( SeException se ) {
                printError(se);
            }
            System.out.println( sExtent.getMinX() + "  "+ sExtent.getMinY() + "  "+ sExtent.getMaxX() + "  "+ sExtent.getMaxY());

            for( int subPartNo = 0 ; subPartNo < numSubParts ; subPartNo++ ) {

                int numPoints = shape.getNumPoints(partNo+1, subPartNo+1);
                if( numPoints != (points[partNo][subPartNo].length/2) )
                    System.out.println("No. of points not equal " );
                System.out.println("No. of points : " + numPoints );

                for( int pointNo = 0 ; pointNo < numPoints*2 ; pointNo+=2)
                    System.out.println("X: " + points[partNo][subPartNo][pointNo] +
                            "\tY: " + points[partNo][subPartNo][(pointNo+1)] );
            }
        }

    } // End getAllCoords




    /**
    *   Displays the X, Y, Z & M values of a shape. Internally invokes
    *   shape.getAllPoints(TURN_LEFT, true).
    *   @param shape    the SeShape object.
    */
    public static void getAllPoints( SeShape shape ) throws SeException {

        if( shape.isNil() ) {
            System.out.println("Nil SeShape Object");
            return;
        }

        boolean wantPartOffsets = true;
        getPoints( shape.getAllPoints(SeShape.TURN_LEFT, wantPartOffsets) );

    } // End getAllPoints.




    /**
     *  Displays the properties of an SeCoordinateReference object.
     *  @param cRef a SeCoordinateReference object.
     */
    public static void getCoordRefDetails( SeCoordinateReference cRef) throws SeException {

        System.out.println("Description of coord system " + cRef.getCoordSysDescription() );

        System.out.println("moffset : " + cRef.getFalseM() + "\t Scale factor : " + cRef.getMUnits() );

        System.out.println("Measure Values --> Min: " + cRef.getMinMValue() + "\t Max: " + cRef.getMaxMValue() );

        System.out.println("Projection Desc: " + cRef.getProjectionDescription() );

        System.out.println("Spatial Reference Id " + cRef.getSrid().longValue() );

        System.out.println("False x,y offset X: " + cRef.getFalseX() + " Y: " + cRef.getFalseY() + "  Scale factor:" + cRef.getXYUnits() );

        System.out.println("z-offset : " + cRef.getFalseZ() + "   Scale factor : " + cRef.getZUnits() );

        System.out.println("Z Values --> Min: " + cRef.getMinZValue() + "\t Max: " + cRef.getMaxZValue() );

        SeExtent ext = cRef.getXYEnvelope();

        System.out.println("Coord Ref Envelope: MinX -" + ext.getMinX() + " MinY -" + ext.getMinY() + " MaxX -" + ext.getMaxX() + " MaxY -" + ext.getMaxY() + " MinZ -" + ext.getMinZ() + " MaxZ -" + ext.getMaxZ() );

    }   // End method getCoordRefDetails




    /**
    * This method will fetch all the rows that satisfy a pre-defined query.
    * The query must have been already defined, initialized and executed.
    *
    *   <p>
    *   @param query     initialized SeQuery object.
    *   @param displayOptions bit mask to specify what should be displayed. Valid values:
    *   <pre>
    *   {@link #DISPLAY_SHAPES }
    *   {@link #DISPLAY_ATTR_DATA }
    *   {@link #DISPLAY_SHAPE_TYPE }
    *   {@link #DISPLAY_SHAPE_ENVELOPE }
    *   {@link #DISPLAY_SHAPE_COORDS }
    *   {@link #DISPLAY_SHAPE_POINTS }
    *   {@link #DISPLAY_SHAPE_ANNO }
    *   {@link #DISPLAY_SHAPE_CREF }
    *   {@link #DISPLAY_SHAPE_MISC }
    *   {@link #DISPLAY_SHAPE_DETAILS }
    *   </pre>
    */
    public static void getData(SeQuery query, int displayOptions) throws SeException {

        /*
        *   Fetch first row retrieved by query.
        */
        SeRow row = query.fetch();

        /*
        *   Check if query returned any data.
        */
        if( row == null ) {

            System.out.println(" No data fetched");
            query.close();
            return;
        } else {

            /*
            *   Retrieve column definitions of the rows retrieved.
            */
            SeColumnDefinition colDef[] = row.getColumns();

            int numColumns = row.getNumColumns();

            /*
            *   Retrieve the column type of each column.
            */
            int type[] = new int[numColumns];
            for( int colNum = 0 ; colNum < numColumns ; colNum++ )
                type[colNum] = colDef[colNum].getType();

            /*
            *   While the row fetched is not null.
            */
            while( row != null ) {
                /*
                *   For each column in the row perform iterative operation.
                */
                for( int colNum = 0 ; colNum < numColumns ; colNum++ )
                    /*
                    *   Switch on the type of the current column
                    */
                    switch( type[colNum] ) {

                        case SeColumnDefinition.TYPE_SMALLINT:
                            if( (displayOptions & DISPLAY_ATTR_DATA) == DISPLAY_ATTR_DATA )
                                System.out.print("\n\t" + colDef[colNum].getName() + " : " + row.getShort(colNum) );
                            break;

                        case SeColumnDefinition.TYPE_DATE:
                            if( (displayOptions & DISPLAY_ATTR_DATA) == DISPLAY_ATTR_DATA )
                                System.out.print("\n\t" + colDef[colNum].getName() + " : " + row.getDate(colNum));
                            break;

                        case SeColumnDefinition.TYPE_INTEGER:
                            if( (displayOptions & DISPLAY_ATTR_DATA) == DISPLAY_ATTR_DATA )
                                System.out.print("\n\t" + colDef[colNum].getName() + " : " + row.getInteger(colNum));
                            break;

                        case SeColumnDefinition.TYPE_FLOAT:
                            if( (displayOptions & DISPLAY_ATTR_DATA) == DISPLAY_ATTR_DATA )
                                System.out.print("\n\t" + colDef[colNum].getName() + " : " + row.getFloat(colNum) );
                        break;

                        case SeColumnDefinition.TYPE_DOUBLE:
                            if( (displayOptions & DISPLAY_ATTR_DATA) == DISPLAY_ATTR_DATA )
                                System.out.print("\n\t" + colDef[colNum].getName() + " : " + row.getDouble(colNum) );
                            break;

                        case SeColumnDefinition.TYPE_STRING:
                            if( (displayOptions & DISPLAY_ATTR_DATA) == DISPLAY_ATTR_DATA )
                                System.out.print("\n\t" + colDef[colNum].getName() + " : " + row.getString(colNum));
                            break;

                        case SeColumnDefinition.TYPE_SHAPE:
                            if( (displayOptions & DISPLAY_SHAPES) == DISPLAY_SHAPES ) {
                                System.out.print("\n\t" + colDef[colNum].getName() + " : " );
                                displayShape( (SeShape)row.getShape(colNum), displayOptions );
                            }
                            break;

                    }   //  End switch
                /*
                *   Fetch the next row.
                */
                row = query.fetch();
                System.out.println();
            }   //  End while
        }   // End if-else

    }   //  End method getData




    /**
     * Returns a <code>String</code> description for the
     * dbmsId value of an SeDBMSInfo object.
     *
     *  @param DBType   the dbmsId field of an SeDBMSInfo object.
     */
    public static String getDBMS( int DBType) {

        String DBMS =  new String();
        switch( DBType ) {
            case SeDBMSInfo.SE_DBMS_IS_DB2 :
                DBMS = "DB2";
                break;
            case SeDBMSInfo.SE_DBMS_IS_ARCINFO :
                DBMS = "ARCINFO";
                break;
            case SeDBMSInfo.SE_DBMS_IS_ARCSERVER :
                DBMS = "ARCSERVER";
                break;
            case SeDBMSInfo.SE_DBMS_IS_DB2_EXT :
                DBMS = "DB2 EXTENDED SERVER";
                break;
            case SeDBMSInfo.SE_DBMS_IS_INFORMIX :
                DBMS = "INFORMIX";
                break;
            case SeDBMSInfo.SE_DBMS_IS_IUS :
                DBMS = "INFORMIX UNIVERSAL SERVER";
                break;
            case SeDBMSInfo.SE_DBMS_IS_JET :
                DBMS = "JET";
                break;
            case SeDBMSInfo.SE_DBMS_IS_ORACLE :
                DBMS = "ORACLE";
                break;
            case SeDBMSInfo.SE_DBMS_IS_OTHER :
                DBMS = "OTHER";
                break;
            case SeDBMSInfo.SE_DBMS_IS_SQLSERVER :
                DBMS = "SQLSERVER";
                break;
            case SeDBMSInfo.SE_DBMS_IS_SYBASE :
                DBMS = "SYBASE";
                break;
            case SeDBMSInfo.SE_DBMS_IS_UNKNOWN :
                DBMS = "UNKNOWN";
                break;
            default :
                DBMS = "INVALID DBMS";
                break;
        } // End switch
        return DBMS;
    } // End method getDBMS




    /**
    *   Displays the properties of a Layer.
    *   @param layer    an SeLayer object.
    */
    public static void getLayerAttr(SeLayer layer) throws SeException {

        System.out.println("Layer Name - " + layer.getName().toUpperCase());

        try {
           System.out.println("Qualified Name - " + layer.getQualifiedName().toUpperCase());
        } catch(SeException e) {
            printError(e);
        }

        System.out.println("Min FID - " + layer.getMinID().longValue() );

        System.out.println("\n Shape Attributes: ");
        try {
            System.out.println(
                        layer.getShapeAttributeName(SeLayer.SE_SHAPE_ATTRIBUTE_ENTITY) );
            System.out.println(
                        layer.getShapeAttributeName(SeLayer.SE_SHAPE_ATTRIBUTE_NUMOFPTS) );
            System.out.println(
                        layer.getShapeAttributeName(SeLayer.SE_SHAPE_ATTRIBUTE_XMIN) );
            System.out.println(
                        layer.getShapeAttributeName(SeLayer.SE_SHAPE_ATTRIBUTE_YMIN) );
            System.out.println(
                        layer.getShapeAttributeName(SeLayer.SE_SHAPE_ATTRIBUTE_YMAX) );
            System.out.println(
                        layer.getShapeAttributeName(SeLayer.SE_SHAPE_ATTRIBUTE_XMAX) );
            System.out.println(
                        layer.getShapeAttributeName(SeLayer.SE_SHAPE_ATTRIBUTE_ZMIN) );
            System.out.println(
                        layer.getShapeAttributeName(SeLayer.SE_SHAPE_ATTRIBUTE_ZMAX) );
            System.out.println(
                        layer.getShapeAttributeName(SeLayer.SE_SHAPE_ATTRIBUTE_MMIN) );
            System.out.println(
                        layer.getShapeAttributeName(SeLayer.SE_SHAPE_ATTRIBUTE_MMAX) );
            System.out.println(
                        layer.getShapeAttributeName(SeLayer.SE_SHAPE_ATTRIBUTE_AREA) );
            System.out.println(
                        layer.getShapeAttributeName(SeLayer.SE_SHAPE_ATTRIBUTE_LENGTH) );
            System.out.println(
                        layer.getShapeAttributeName(SeLayer.SE_SHAPE_ATTRIBUTE_TEXT) );
            System.out.println(
                        layer.getShapeAttributeName(SeLayer.SE_SHAPE_ATTRIBUTE_FID) );
        } catch(SeException e) {
            printError(e);
        }

        System.out.println("Spatial Col - " + layer.getSpatialColumn().toUpperCase());

        System.out.println("layer description - " + layer.getDescription());

//%%% Value always zero
        System.out.println("Layer arraySize - " + layer.getArraySize());

//%%% ID value is always zero
        System.out.println("Layer Id - " + layer.getID().longValue());

//%%% Returns these values : Min X = Min Y = 1.0 , Max X = Max Y = 0.0
        SeExtent layerExtent = layer.getExtent();
        System.out.println("Is extent empty? " + layerExtent.isEmpty() );
        System.out.println("Layer Envelope... " );
        System.out.println("Min X: " + layerExtent.getMinX() + "\tMin Y: " + layerExtent.getMinY() );
        System.out.println("Max X: " + layerExtent.getMaxX() + "\tMax Y: " + layerExtent.getMaxY() );
//%%% Returns zero
        System.out.println("Layer Creation Date : " + layer.getCreationDate() );
        // Finds out if the layer supports 3D
        System.out.println("Layer supports z coordinates : " + layer.is3D() );

//%%% Returns the initialized value Null
        System.out.println("Layer Keyword : " + layer.getCreationKeyword() );

        System.out.println("Layer has annotation: " + layer.hasAnno() );

        System.out.println("Layer allows CAD: " + layer.hasCAD() );

        System.out.println("Layer has line shapes: " + layer.isLine() );

        System.out.println("Layer is load only: " + layer.isLoadOnly() );

        System.out.println("Layer allows measures: " + layer.isMeasured() );

        System.out.println("Layer has point shapes: " + layer.isPoint() );

        System.out.println("Layer has polygon shapes: " + layer.isPoly() );

        System.out.println("Layer has a spatial index: " + layer.hasSpatialIndex() );

        /*
        *   Retrieves the coordinate reference for the specified layer
        */
        SeCoordinateReference cRef = layer.getCoordRef();

        System.out.println("\n  Layers coordinate Reference....");
        getCoordRefDetails(cRef);

        System.out.print("\n Layer Storage attribute - ");

        if( layer.isStorageNormalized() )
            System.out.println("StorageNormalized");
        if( layer.isStorageExternal() )
            System.out.println("StorageExternal");
        if( layer.isStorageSdeBinary() )
            System.out.println("StorageSdeBinary");
        if( layer.isStorageSQL() )
            System.out.println("StorageSQL");
        if( layer.isStorageWKB() )
            System.out.println("StorageWKB");

    } // End getLayerAttr




    /**
     * Displays information about the current locks on a layer.
     * @param layer the SeLayer object.
     */
    public static void getLayerLocks(SeLayer layer) {

        System.out.println("\n --> Layer Lock Information...\n");
        SeLayer.SeLayerLock[] layerLocks = null;
        try {
            layerLocks = layer.getLocks();
        } catch( SeException e ) {
            printError(e);
        }
        if( layerLocks != null )
            for( int i = 0 ; i < layerLocks.length ; i++ ) {

            if( layerLocks[i].getLockType() == SeLayer.SE_READ_LOCK )
                System.out.print("READ Lock by ");
            else if( layerLocks[i].getLockType() == SeLayer.SE_WRITE_LOCK )
                System.out.print("WRITE Lock by ");
            System.out.print(layerLocks[i].getUserName());
            SeExtent lockExt = layerLocks[i].getExtent();
            System.out.println("\t Lock Extent " + lockExt.getMinX() + "  "
                    + lockExt.getMinY() + "  "+ lockExt.getMaxX()
                    + "  "+ lockExt.getMaxY());

            }
        else
            System.out.println("\tNo locks on layer");

    } // End method getLayerLocks




    /**
    *   Displays the X, Y, Z and M point co-ordinates of a shape.
    *
    *   @param list the ArrayList returned by SeShape.getAllPoints(),
    * which must contain sub-part offsets.
    *
    */
    public static void getPoints(ArrayList list ) {

        /*
        *   ArrayList[0] - points
        *   ArrayList[1] - part offsets
        *   ArrayList[2] - optional sub part offsets
        */
        SDEPoint[] point = (SDEPoint[])list.get(0);
        int[] partOffset = (int[])list.get(1);
        int[] subPartOffset = (int[])list.get(2);

        System.out.print("\n Part Offsets : ");
        for( int i = 0 ; i < partOffset.length ; i++)
            System.out.print( " " + partOffset[i]);
        System.out.println("");

        System.out.print("\n Sub Part Offsets : ");
        for( int i = 0 ; i < subPartOffset.length ; i++)
            System.out.print( " " + subPartOffset[i]);
        System.out.println("\n");
        boolean subParts = false;
        if(partOffset.length < subPartOffset.length )
            subParts = true;
        for( int partNo = 0, partEnd = 0 ; partNo < partOffset.length ; partNo++ ) {
            System.out.println("\nPart " + (partNo+1));
            if( (partOffset.length - partNo) == 1 )
                partEnd = point.length;
            else
                partEnd = subPartOffset[partOffset[partNo+1]];
            int subPartNo = partNo;
            int pointNo = subPartOffset[partOffset[partNo]];
            for(  ; pointNo < point.length && pointNo < partEnd ; pointNo++) {
                if( subParts && subPartNo < subPartOffset.length && pointNo == subPartOffset[subPartNo] ) {
                    System.out.println("\n Sub-Part " + (subPartNo+1-partNo));
                    subPartNo++;
                }
                try{
                    System.out.print("X: " + point[pointNo].getX() );
                    System.out.print("\tY: " + point[pointNo].getY() );
                    if( point[pointNo].is3D() )
                        System.out.print("\tZ : " + point[pointNo].getZ() );
                    if( point[pointNo].isMeasured() )
                        System.out.print("\tM : " + point[pointNo].getM() );
                    System.out.println();
                }catch( SeException e ) {
                    printError(e);
                }
            }

        }
    } // End method getPoints




    /**
     * Returns a <code>String</code> description of a
     * privilege bitmask. The bitmask should be composed
     * of the following values:
     *
     * SeDefs.SE_SELECT_PRIVILEGE
     * SeDefs.SE_INSERT_PRIVILEGE
     * SeDefs.SE_DELETE_PRIVILEGE
     * SeDefs.SE_UPDATE_PRIVILEGE
     *
     *  @param  permiss Privilege bit-mask.
     */
    public static void getPrivileges( int permiss ) {

        // Get permissions
        System.out.print("Privileges: ");
        if( ( permiss & SeDefs.SE_SELECT_PRIVILEGE ) == SeDefs.SE_SELECT_PRIVILEGE )
            System.out.print("\tSELECT");
        if( ( permiss & SeDefs.SE_INSERT_PRIVILEGE ) == SeDefs.SE_INSERT_PRIVILEGE )
            System.out.print("\tINSERT");
        if( ( permiss & SeDefs.SE_DELETE_PRIVILEGE ) == SeDefs.SE_DELETE_PRIVILEGE )
            System.out.print("\tDELETE");
        if( ( permiss & SeDefs.SE_UPDATE_PRIVILEGE ) == SeDefs.SE_UPDATE_PRIVILEGE )
            System.out.print("\tUPDATE");
        System.out.println();

    } // End method getPrivileges




    /**
     * Displays the registration details of a Table.
     *
     *  @param  registration    an SeRegistration object.
     */
    public static void getRegistrationInfo(SeRegistration registration) {

        System.out.println("\n--> Getting table registration info...");
        System.out.println("Creation Keyword -> " + registration.getCreationKeyword() );
        System.out.println("Privileges for the registered table");
        getPrivileges( registration.getAccess() );
        try {
            String[] depTables = registration.getDependentTables();
            if( depTables != null )
            for( int i = 0 ; i < depTables.length ; i++ )
                System.out.println("Dep table -> " + (i+1) + " " + depTables[i]);
        }catch(SeException se) {
            printError(se);
        }

        System.out.println("Desc -> " + registration.getDescription() );
        System.out.println("Id -> " + registration.getId().longValue() );
        System.out.println("Reg Date -> " + registration.getRegistrationDate() );
        System.out.println("Col Name -> " + registration.getRowIdColumnName() );
        System.out.println("Col Type -> " + resolveIdType( registration.getRowIdColumnType()) );
        System.out.println("Table Name -> " + registration.getTableName());

    } // End getRegistrationInfo



    public static SeShape getShape(SeConnection conn, SeLayer layer, String whereClause ) {

        SeQuery query = null;
        SeShape shape = null;

        try {

            SeSqlConstruct sqlCons = new SeSqlConstruct( layer.getName(), whereClause );

            SeTable table = new SeTable(conn, layer.getName() );
            String[] cols = {layer.getSpatialColumn()};

            /*
            *   Define, prepare & execute query.
            */
            query = new SeQuery( conn, cols, sqlCons );
            query.prepareQuery();
            query.execute();

            SeRow row = query.fetch();
            if( row != null ) {
                shape = row.getShape(0);
            }

        }catch ( SeException e ) {
            printError(e);
        } catch ( Exception e ) {
            e.printStackTrace();
        }finally {
            /*
            *   Close query stream.
            */
            try {
                query.close();
            }catch( SeException e ) {
                printError(e);
            }
        }

        return shape;

    }   //  End method getShape



    /**
    *   Returns a <code>String</code> description of the type
    * of an SeShape object.
    *
    *   @param shape    an SeShape object.
    */
    public static void getShapeType(SeShape shape) {

        int type = 0;
        try {
            type = shape.getType();
        } catch ( SeException se ){
            System.out.println("Can't get shape type");
            printError(se);
        }
        System.out.print("\nShape : ");
        switch( type ) {

            case SeShape.TYPE_LINE:
                System.out.println("Line");
                break;
            case SeShape.TYPE_MULTI_LINE:
                System.out.println("Multi-Line");
                break;
            case SeShape.TYPE_MULTI_POINT:
                System.out.println("Multi-point");
                break;
            case SeShape.TYPE_MULTI_POLYGON:
                System.out.println("Multi-Polygon");
                break;
            case SeShape.TYPE_MULTI_SIMPLE_LINE:
                System.out.println("Multi-Simple Line");
                break;
            case SeShape.TYPE_NIL:
                System.out.println("Nil");
                return;
            case SeShape.TYPE_POINT:
                System.out.println("Point");
                break;
            case SeShape.TYPE_POLYGON:
                System.out.println("Polygon");
                break;
            case SeShape.TYPE_SIMPLE_LINE:
                System.out.println("Simple Line");
                break;
        } // End switch

    }   //  End method getShapeType




    /**
     * Retrieves all the attributes of a Table.
     *  @param  table   the SeTable object.
     */
    public static void getTableAttr( SeTable table ){

        System.out.println("\n Table attributes... ");

        // Get table name
        System.out.println("Table name  " + table.getName() );

        // Get table owner
        System.out.println("Table owner  " + table.getOwner() );

        // Get table's qualified name
        System.out.println("Table qualified name  " + table.getQualifiedName() );

        // Get database associated with current connection
        System.out.println("Database name " + table.getDatabase() );

        /*
        *   Get table's column definition
        */
        try {
            SeColumnDefinition columnDef[] = table.describe();
            /*
            *   Print out table's column names
            */
            System.out.println("Table columns "   );
            for( int i = 0 ; i < columnDef.length ; i++ ) {

                System.out.println("Column " + (i+1) + " Col Name  " + columnDef[i].getName().toUpperCase() );
                System.out.println("Qualified Col  " + table.qualifyColumn(columnDef[i].getName()).toUpperCase() );
                System.out.println("Column " + (i+1) + " Col Scale " + columnDef[i].getScale() );
                System.out.println("Column " + (i+1) + " Col Size  " + columnDef[i].getSize() );
                System.out.println("Column " + (i+1) + " Col Type  " + columnDef[i].getType() + " -> " + resolveType( columnDef[i].getType() ) );
                System.out.println("Column " + (i+1) + " Row Type  " + columnDef[i].getRowIdType() + " -> " + resolveIdType( columnDef[i].getRowIdType() ) );
                System.out.println("Column " + (i+1) + " Def.  " + columnDef[i].toString() );
            }
        } catch ( SeException se ) {
            printError(se);
        }

    } // End getTableAttr method




    /**
     * Displays the properties of a specified Version.
     *
     *  @param  version an SeVersion object.
     */
    public static void getVersionInfo( SeVersion version ) {

        System.out.println("\n --> Version info");
        System.out.println("Creation time - " + version.getCreationTime());
        System.out.println("Desc - " + version.getDescription());
        System.out.println("Id - " + version.getId().longValue());
        System.out.println("Name - " + version.getName());
        System.out.println("Parent Id - " + version.getParentId().longValue());
        System.out.println("Parent Name - " + version.getParentName());
        System.out.println("State Id - " + version.getStateId().longValue());
        SeVersion.SeVersionLock[] versionLocks = null;
        try {
            versionLocks = version.getLocks();
        }catch(SeException se) {
            printError(se);
        }

        if( versionLocks != null )
            for( int i = 0 ; i < versionLocks.length ; i++) {
            System.out.println("Lock Mode - " + versionLocks[i].getLockMode() );
            System.out.println("User Name - " + versionLocks[i].getUserName() );
            }
        else
            System.out.println("No locks on current version");

    } // End getVersionInfo




    /**
    * Displays the details of an SeException.
    * @param exception handle to an SeException object.
    */
    public static void printError(SeException exception) {

        SeError error = exception.getSeError();

        System.out.println("\n ArcSDE Error Number        : " + error.getSdeError() );
        System.out.println(" Error Description          : " + error.getErrDesc() );

        int extError = error.getExtError();
        if( extError != 0 )
            System.out.println(" Extended Error Number      : " + extError );

        String desc = error.getSdeErrMsg();
        if( desc != null && desc.length() != 0 )
            System.out.println(" Extended Error Description : " + desc );

        desc = error.getExtErrMsg();
        if( desc != null && desc.length() != 0 )
            System.out.println(" Extended Error Description : " + desc );

        exception.printStackTrace();

    }   // End printError




    /**
    * Registers an ArcSDE table/layer with an ArcSDE maintained Row id column.
    * The column will be named "OBJECTID".
    *   @param  conn    Connection to an ArcSDE server.
    *   @param  tableName   Name of the table to be registered.
    */
    public static void registerTable(SeConnection conn, String tableName) throws SeException {

        SeRegistration registration = null;

        /*
        *   Retrieve the table's registration.
        */
        registration = new SeRegistration( conn, tableName);

        /*
        *   Check if table has been registered as ArcSDE maintained table.
        *   If already registered return to main.
        */
        if( registration.getRowIdColumnType() == SeRegistration.SE_REGISTRATION_ROW_ID_COLUMN_TYPE_SDE )
            return;

        /*
        *   Update the table's registration to give it an ArcSDE maintained
        *   row id.
        */
        registration.setRowIdColumnName("OBJECTID");
        registration.setRowIdColumnType(SeRegistration.SE_REGISTRATION_ROW_ID_COLUMN_TYPE_SDE);

        registration.alter();

    } // End method registerTable




    /**
     *   Takes an integer corresponding to an SDE Row Id type
     *   and returns a string description of the type.
     *  @param  type    SDE Row ID type bit-mask.
     */
    public static String resolveIdType( int type ) {

        String typeName = "Wrong type!";
        switch( type ) {

            case 1:
                typeName ="SE_REGISTRATION_ROW_ID_COLUMN_TYPE_SDE ";
                break;
            case 2:
                typeName ="SE_REGISTRATION_ROW_ID_COLUMN_TYPE_USER ";
                break;
            case 3:
                typeName ="SE_REGISTRATION_ROW_ID_COLUMN_TYPE_NONE ";
                break;
        }
        return typeName;
    } // end method resolveIdType




    /**
     *   Takes an integer corresponding to an ArcSDE data type
     *   and returns a string description of the type.
     *  @param  type    SDE data type bit-mask.
     */
    public static String resolveType( int type ) {

        String typeName = "Invalid Type";
        switch( type ) {

            case SeColumnDefinition.TYPE_SMALLINT :
                typeName ="Small Int";
                break;
            case SeColumnDefinition.TYPE_INTEGER:
                typeName ="Int";
                break;
            case SeColumnDefinition.TYPE_FLOAT:
                typeName ="Float";
                break;
            case SeColumnDefinition.TYPE_DOUBLE:
                typeName ="Double";
                break;
            case SeColumnDefinition.TYPE_STRING:
                typeName ="String";
                break;
            case SeColumnDefinition.TYPE_BLOB:
                typeName ="Blob";
                break;
            case SeColumnDefinition.TYPE_DATE:
                typeName ="Date";
                break;
            case SeColumnDefinition.TYPE_SHAPE:
                typeName ="Shape";
                break;
            case SeColumnDefinition.TYPE_RASTER:
                typeName ="Raster";
                break;
        }
        return typeName;
    } // End method resolveType




    /**
    * Sorts the elements of a Vector. Each element of the vector is an array of objects.
    * One of the elements of this object array must be an integer. This element is
    * called the sort key. The elements of the vector will be sorted in ascending order
    * of the sort key.
    * The sort key values must be unique and greater than 0.
    *
    * @param  unsorted    unsorted vector. Each element of the vector should an object
    * array of atleast single dimension. One element of the object array should
    * be of type int.
    * @param  sortKeyPos  The position of the sort key in the Object array.
    * @param  maxVal      The maximum value of the sort key.
    */
    public static Vector sort(Vector unsorted, int sortKeyPos, int maxVal) {

        int listSize = unsorted.size();
        Vector sorted = (Vector)unsorted.clone();

        int[] map = new int[maxVal];

        int index = -1;
        for( int i = 0 ; i < listSize ; i++ ) {
            index = ((Integer)(((Object[])unsorted.elementAt(i))[sortKeyPos])).intValue();
            if( index > maxVal )
                throw new IllegalArgumentException("Incorrect maxVal");
            map[--index] = (i+1);
        }

        for( int i = 0, j = 0 ; i < listSize ; i++, j++ ) {
            while( map[j] == 0 )
                j++;
            sorted.setElementAt( unsorted.elementAt((map[j]-1)), i);
        }

        return sorted;
    }   // End method sort




    /**
    * Sorts the elements of a Vector. Each element of the vector is an array of objects.
    * One of the elements of this object array must be an integer. This element is
    * called the sort key. The elements of the vector will be sorted in ascending order
    * of the sort key.
    * The sort key values must be unique and greater than 0.
    *
    * @param  unsorted    unsorted vector. Each element of the vector should an object
    * array of atleast single dimension. One element of the object array should
    * be of type int.
    * @param  sortKeyPos  The position of the sort key in the Object array.
    * @param  minVal      The minimum value of the sort key.
    * @param  maxVal      The maximum value of the sort key.
    */
    public static Vector sort(Vector unsorted, int sortKeyPos, int minVal, int maxVal) {

        int listSize = unsorted.size();
        Vector sorted = (Vector)unsorted.clone();

        if( minVal < 1 )
            throw new IllegalArgumentException("Invalid minVal, must be greater than zero");

        int[] map = new int[(maxVal-minVal+1)];

        if(map.length < listSize )
            throw new IllegalArgumentException("Invalid data vector, check values");

        int index = -1;
        for( int i = 0 ; i < listSize ; i++ ) {
            index = ((Integer)(((Object[])unsorted.elementAt(i))[sortKeyPos])).intValue() - minVal;

            if( index > (map.length-1) )
                throw new IllegalArgumentException("Error: Please check minVal and maxVal settings");

            map[index] = (i+1);
        }

        for( int i = 0, j = 0 ; i < listSize ; i++, j++ ) {
            while( map[j] == 0 )
                j++;
            sorted.setElementAt( unsorted.elementAt((map[j]-1)), i);
        }

        return sorted;
    }   // End method sort




    /**
    *   Registers an ArcSDE table/layer as multi-versioned.
    *   @param  conn    Connection to an ArcSDE server.
    *   @param  tableName   Name of the table to be registered.
    */
    public static void versionTable(SeConnection conn, String tableName) throws SeException {

        SeRegistration registration = null;

        /*
        *   Retrieve the table's registration.
        */
        registration = new SeRegistration( conn, tableName);

        registration.setMultiVersion(true);

        registration.alter();

    } // End method versionTable

}   //  End class Util
