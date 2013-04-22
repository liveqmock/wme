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
/*************************************************************************
 * Purpose: Demonstrates use of SeShape.findRelation & Clementini relations: isContaining, isWithin, isEqual, etc.
 * This Java sample demonstrates usage of ArcSDE API. It will not execute successfully until the user
 * supplies valid ArcSDE Server details such as server name, port number, database name, user, pwd, and valid
 * data, if required.
 **************************************************************************/

package com.dien.sde;

import com.esri.sde.sdk.client.SDEPoint;
import com.esri.sde.sdk.client.SeCoordinateReference;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeShape;

public class ShapeClementiniExample {

    /**
    * Coordinate reference common to all shapes.
    */
    private SeCoordinateReference cref = null;

    /**
    * Bit mask representing the relation - primary shape isContaining secondary.
    */
    private static final int CR_PRIM_CONTAINS_SEC   = 1;

    /**
    * Bit mask representing the relation - isCrossing.
    */
    private static final int CR_IS_CROSSING         = (1<<1);

    /**
    * Bit mask representing the relation - isDisjoint.
    */
    private static final int CR_IS_DISJOINT         = (1<<2);

    /**
    * Bit mask representing the relation - isEqual.
    */
    private static final int CR_IS_EQUAL            = (1<<3);

    /**
    * Bit mask representing the relation - isOverlapping.
    */
    private static final int CR_IS_OVERLAPPING      = (1<<4);

    /**
    * Bit mask representing the relation - isTouching.
    */
    private static final int CR_IS_TOUCHING         = (1<<5);

    /**
    * Bit mask representing the relation - primary isWithin secondary.
    */
    private static final int CR_PRIM_WITHIN_SEC     = (1<<6);

    /**
    * Bit mask representing the relation - secondary isWithin primary.
    */
    private static final int CR_SEC_WITHIN_PRIM     = (1<<7);

    /**
    * Bit mask representing the relation - secondary isContaining primary.
    */
    private static final int CR_SEC_CONTAINS_PRIM   = (1<<8);

    /**
    * Simple point shape one.
    */
    private SeShape pointOne = null;
//    privateSeShape pointTwo = null;
    /**
    * Multi-point shape one.
    */
    private SeShape multiPointOne = null;
    /**
    * Multi-point shape two.
    */
    private SeShape multiPointTwo = null;
    /**
    * simple line shape one.
    */
    private SeShape simpleLineOne = null;

    /**
    * simple multi-line shape one
    */
    private SeShape simpleMultiLineOne = null;
    /**
    * simple multi-line shape two.
    */
    private SeShape simpleMultiLineTwo = null;

//    private SeShape lineOne = null;
//    private SeShape multiLineOne = null;
    /**
    * single part polygon one.
    */
    private SeShape spartPolygonOne = null;
    /**
    * single part polygon two.
    */
    private SeShape spartPolygonTwo = null;
    /**
    * single part polygon three.
    */
    private SeShape spartPolygonThree = null;
//    private SeShape mpartPolygonOne = null;
//    private SeShape mpartPolygonTwo = null;



    /**
    * Invokes the constructor.
    */
    public static void main(String[] args) {

        ShapeClementiniExample shpTest = new ShapeClementiniExample(args);

    } // End main



    /**
    * @param args the command line arguments
    */
    public ShapeClementiniExample( String[] args ) {

        /*
        *   Common coordinate reference for  shapes.
        */
        cref = new SeCoordinateReference();
        cref.setXY(0,0,1000);

        generateTestShapes();

        PointRelations();

        PointLineRelations();

        PointPolygonRelations();

        LineRelations();

        LinePolygonRelations();

        PolygonRelations();

    } // End constructor



    /**
    * This method generates the shapes that will be used in Clementini relations:
    * <PRE>
    *
    * pointOne - Single Point shape.
    * multiPointOne - A four point, multi-point shape.
    * multiPointTwo - A four point, multi-point shape.
    * simpleLineOne - A three point, simple line.
    * simpleMultiLineOne - A 2 line(4 and 5 point), simple multi-line.
    * simpleMultiLineTwo - A 3 line(2, 3 and 2 points), simple multi-line.
    * spartPolygonOne - A 6 point, simple polygon.
    * spartPolygonTwo - A 4 point, simple polygon.
    * spartPolygonThree - A 4 point, simple polygon.
    *
    * </PRE>
    */
    public void generateTestShapes() {

        int numPoints = 0;
        int numParts = 0;
        int[] partOffsets = null;
        SDEPoint[] ptArray = null;
        SDEPoint[] pointList = null;

        /*
        *   Generate a single point shape, pointOne
        */
        numPoints = 1;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(300,300);

        try {
            pointOne = new SeShape(cref);
            pointOne.generatePoint(numPoints, ptArray);
        } catch( SeException e ) {
            Util.printError(e);
        }

        /*
        *   Generate a 4 point multi-point shape, multiPointOne
        */
        numPoints = 4;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200,200);
        ptArray[1] = new SDEPoint(400,200);
        ptArray[2] = new SDEPoint(300,300);
        ptArray[3] = new SDEPoint(400,400);

        try {
            multiPointOne = new SeShape(cref);
            multiPointOne.generatePoint(numPoints, ptArray);
        } catch( SeException e ) {
            Util.printError(e);
        }

        /*
        *   Generate a 4 point multi-point shape, multiPointTwo
        */
        numPoints = 4;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200,200);
        ptArray[1] = new SDEPoint(400,200);
        ptArray[2] = new SDEPoint(200,400);
        ptArray[3] = new SDEPoint(100,100);

        try {
            multiPointTwo = new SeShape(cref);
            multiPointTwo.generatePoint(numPoints, ptArray);
        } catch( SeException e ) {
            Util.printError(e);
        }

        /*
        *   Generate a Simple line shape, simpleLineOne
        */
        numPoints = 3;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(500,100);
        ptArray[1] = new SDEPoint(500,200);
        ptArray[2] = new SDEPoint(500,500);

        try {
            simpleLineOne = new SeShape(cref);
            simpleLineOne.generateSimpleLine(numPoints, numParts, partOffsets, ptArray);
        } catch( SeException e ) {
            Util.printError(e);
        }

        /*
        *   Generate a Simple multi-line shape, simpleMultiLineOne
        */
        numPoints = 9;
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 4;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200,200);
        ptArray[1] = new SDEPoint(300,200);
        ptArray[2] = new SDEPoint(300,300);
        ptArray[3] = new SDEPoint(300,400);

        ptArray[4] = new SDEPoint(400,200);
        ptArray[5] = new SDEPoint(500,200);
        ptArray[6] = new SDEPoint(500,300);
        ptArray[7] = new SDEPoint(600,400);
        ptArray[8] = new SDEPoint(500,400);

        try {
            simpleMultiLineOne = new SeShape(cref);
            simpleMultiLineOne.generateSimpleLine(numPoints, numParts, partOffsets, ptArray);
        } catch( SeException e ) {
            Util.printError(e);
        }

        /*
        *   Generate a Simple multi-line shape, simpleMultiLineTwo
        */
        numPoints = 7;
        numParts = 3;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 2;
        partOffsets[2] = 5;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(100,200);
        ptArray[1] = new SDEPoint(400,200);

        ptArray[2] = new SDEPoint(600,400);
        ptArray[3] = new SDEPoint(600,300);
        ptArray[4] = new SDEPoint(400,300);

        ptArray[5] = new SDEPoint(300,300);
        ptArray[6] = new SDEPoint(300,400);

        try {
            simpleMultiLineTwo = new SeShape(cref);
            simpleMultiLineTwo.generateSimpleLine(numPoints, numParts, partOffsets, ptArray);
        } catch( SeException e ) {
            Util.printError(e);
        }

        /*
        *   Generate single part polygon, spartPolygonOne
        */
        numPoints = 7;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200,200);
        ptArray[1] = new SDEPoint(500,200);
        ptArray[2] = new SDEPoint(600,400);
        ptArray[3] = new SDEPoint(500,600);
        ptArray[4] = new SDEPoint(300,400);
        ptArray[5] = new SDEPoint(200,400);
        ptArray[6] = new SDEPoint(200,200);

        try {
            spartPolygonOne = new SeShape(cref);
            spartPolygonOne.generatePolygon(numPoints, numParts, partOffsets, ptArray);
        } catch( SeException e ) {
            Util.printError(e);
        }

        /*
        *   Generate single part polygon, spartPolygonTwo
        */
        numPoints = 5;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200,200);
        ptArray[1] = new SDEPoint(200,100);
        ptArray[2] = new SDEPoint(500,100);
        ptArray[3] = new SDEPoint(500,200);
        ptArray[4] = new SDEPoint(200,200);

        try {
            spartPolygonTwo = new SeShape(cref);
            spartPolygonTwo.generatePolygon(numPoints, numParts, partOffsets, ptArray);
        } catch( SeException e ) {
            Util.printError(e);
        }

        /*
        *   Generate single part polygon, spartPolygonThree
        */
        numPoints = 5;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(400,300);
        ptArray[1] = new SDEPoint(400,100);
        ptArray[2] = new SDEPoint(600,400);
        ptArray[3] = new SDEPoint(400,400);
        ptArray[4] = new SDEPoint(400,300);

        try {
            spartPolygonThree = new SeShape(cref);
            spartPolygonThree.generatePolygon(numPoints, numParts, partOffsets, ptArray);
        } catch( SeException e ) {
            Util.printError(e);
        }

    } // End method generateTestShapes




    /**
    * Determines the different relations between point shapes and
    * verifies the relations obtained.
    */
    public void PointRelations() {

        long expRel = 0;
        int expClemRel = 0;
        int obClemRel = 0;

        System.out.println("\n\n--> Testing relations between point shapes...");

        System.out.println("\nCase 1");
        expRel = SeShape.RM_COMMON_POINT | SeShape.RM_INTERIOR_INTERSECT
                    | SeShape.RM_SEC_CONTAINED | SeShape.RM_AREA_INTERSECT
                    | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, multiPointOne.findRelation(pointOne));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_SEC_WITHIN_PRIM | CR_PRIM_CONTAINS_SEC;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(multiPointOne, pointOne);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 2");
        expRel = SeShape.RM_COMMON_POINT | SeShape.RM_INTERIOR_INTERSECT
               | SeShape.RM_PRIM_CONTAINED | SeShape.RM_AREA_INTERSECT
               | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, pointOne.findRelation(multiPointOne));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_PRIM_WITHIN_SEC | CR_SEC_CONTAINS_PRIM;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(pointOne, multiPointOne);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 3");
        expRel = SeShape.RM_COMMON_POINT | SeShape.RM_INTERIOR_INTERSECT
               | SeShape.RM_IDENTICAL | SeShape.RM_TESTS_PERFORMED
               | SeShape.RM_PRIM_CONTAINED | SeShape.RM_SEC_CONTAINED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, pointOne.findRelation(pointOne));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_EQUAL | CR_PRIM_CONTAINS_SEC | CR_SEC_CONTAINS_PRIM
                    | CR_PRIM_WITHIN_SEC| CR_SEC_WITHIN_PRIM;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(pointOne, pointOne);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 4");
        expRel = SeShape.RM_COMMON_POINT | SeShape.RM_INTERIOR_INTERSECT
               | SeShape.RM_IDENTICAL | SeShape.RM_TESTS_PERFORMED
               | SeShape.RM_PRIM_CONTAINED | SeShape.RM_SEC_CONTAINED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, multiPointOne.findRelation(multiPointOne));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_EQUAL | CR_PRIM_CONTAINS_SEC | CR_SEC_CONTAINS_PRIM
                    | CR_PRIM_WITHIN_SEC| CR_SEC_WITHIN_PRIM;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(multiPointOne, multiPointOne);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 5");
        expRel = SeShape.RM_COMMON_POINT | SeShape.RM_INTERIOR_INTERSECT
                | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, multiPointOne.findRelation(multiPointTwo));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_OVERLAPPING;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(multiPointOne, multiPointTwo);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 6");
        expRel = SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, pointOne.findRelation(multiPointTwo));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_DISJOINT;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(pointOne, multiPointTwo);
        compareClemRel(expClemRel, obClemRel);

    } // End method PointRelations




    /**
    * Determines the different relations between point and line shapes and
    * verifies the relations obtained.
    */
    public void PointLineRelations() {

        long expRel = 0;
        int expClemRel = 0;
        int obClemRel = 0;

        System.out.println("\n\n--> Testing relations between point & line shapes...");

        System.out.println("\nCase 1");
        expRel = SeShape.RM_COMMON_POINT | SeShape.RM_INTERIOR_INTERSECT
                    | SeShape.RM_PRIM_LEP_INTERIOR | SeShape.RM_AREA_INTERSECT
                    | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, simpleMultiLineOne.findRelation(multiPointOne));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_CROSSING;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(simpleMultiLineOne, multiPointOne);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 2");
// %%% NO AREA intersect if the point is (200,200)
        expRel = SeShape.RM_COMMON_POINT | SeShape.RM_SEC_CONTAINED
               | SeShape.RM_INTERIOR_INTERSECT | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, simpleMultiLineOne.findRelation(pointOne));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_SEC_WITHIN_PRIM | CR_PRIM_CONTAINS_SEC;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(simpleMultiLineOne, pointOne);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 3");
        expRel = SeShape.RM_COMMON_POINT | SeShape.RM_PRIM_LEP_INTERIOR
               | SeShape.RM_SEC_CONTAINED | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, simpleMultiLineTwo.findRelation(pointOne));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_TOUCHING;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(simpleMultiLineTwo, pointOne);
        compareClemRel(expClemRel, obClemRel);

    } // End method PointLineRelations




    /**
    * Determines the different relations between line shapes and
    * verifies the relations obtained.
    */
    public void LineRelations() {

        long expRel = 0;
        int expClemRel = 0;
        int obClemRel = 0;
        /*
        *   Test relations between line shapes...
        */
        System.out.println("\n\n--> Testing relations between line shapes...");

        System.out.println("\nCase 1");
        expRel = SeShape.RM_COMMON_POINT | SeShape.RM_PARALLEL_OVERLAPPING
               | SeShape.RM_EMBEDDED_POINT | SeShape.RM_INTERIOR_INTERSECT
               | SeShape.RM_BOUNDARY_INTERSECT | SeShape.RM_PRIM_LEP_INTERIOR
               | SeShape.RM_SEC_LEP_INTERIOR | SeShape.RM_CBOUND_SAME
               | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, simpleMultiLineOne.findRelation(simpleMultiLineTwo));
        } catch( SeException e ) {
            Util.printError(e);
        }

        // Two lines that share a common endpoint do not cross
        expClemRel = CR_IS_OVERLAPPING;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(simpleMultiLineOne, simpleMultiLineTwo);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 2");
        expRel = SeShape.RM_COMMON_POINT | SeShape.RM_INTERIOR_INTERSECT
               | SeShape.RM_IDENTICAL | SeShape.RM_BOUNDARY_INTERSECT
               | SeShape.RM_CBOUND_SAME | SeShape.RM_TESTS_PERFORMED
               | SeShape.RM_PRIM_CONTAINED | SeShape.RM_SEC_CONTAINED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, simpleMultiLineOne.findRelation(simpleMultiLineOne));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_EQUAL | CR_PRIM_CONTAINS_SEC | CR_SEC_CONTAINS_PRIM
                    | CR_PRIM_WITHIN_SEC | CR_SEC_WITHIN_PRIM;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(simpleMultiLineOne, simpleMultiLineOne);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 3");
        expRel = SeShape.RM_COMMON_POINT | SeShape.RM_INTERIOR_INTERSECT
               | SeShape.RM_EMBEDDED_POINT | SeShape.RM_PARALLEL_OVERLAPPING
               | SeShape.RM_SEC_LEP_INTERIOR | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, simpleLineOne.findRelation(simpleMultiLineOne));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_OVERLAPPING;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(simpleLineOne, simpleMultiLineOne);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 4");
        expRel = SeShape.RM_INTERIOR_INTERSECT | SeShape.RM_LINE_CROSS
               | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, simpleLineOne.findRelation(simpleMultiLineTwo));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_CROSSING;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(simpleLineOne, simpleMultiLineTwo);
        compareClemRel(expClemRel, obClemRel);

    } // End method LineRelations




    /**
    * Determines the different relations between polygon shapes and
    * verifies the relations obtained.
    */
    public void PolygonRelations() {

        long expRel = 0;
        int expClemRel = 0;
        int obClemRel = 0;

        /*
        *   Test relations between polygon shapes...
        */
        System.out.println("\n\n--> Testing relations between polygon shapes...");

        System.out.println("\nCase 1");
        expRel = SeShape.RM_COMMON_POINT | SeShape.RM_CBOUND_DIFF
               | SeShape.RM_BOUNDARY_INTERSECT | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, spartPolygonOne.findRelation(spartPolygonTwo));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_TOUCHING;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(spartPolygonOne, spartPolygonTwo);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 2");
        expRel = SeShape.RM_INTERIOR_INTERSECT | SeShape.RM_LINE_CROSS
               | SeShape.RM_COMMON_POINT | SeShape.RM_BOUNDARY_INTERSECT
               | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, spartPolygonOne.findRelation(spartPolygonThree));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_OVERLAPPING;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(spartPolygonOne, spartPolygonThree);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 3");
        expRel = SeShape.RM_EMBEDDED_POINT | SeShape.RM_LINE_CROSS
                | SeShape.RM_INTERIOR_INTERSECT | SeShape.RM_BOUNDARY_INTERSECT
                | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, spartPolygonTwo.findRelation(spartPolygonThree));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_OVERLAPPING;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(spartPolygonTwo, spartPolygonThree);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 4");
        expRel = SeShape.RM_IDENTICAL | SeShape.RM_INTERIOR_INTERSECT
               | SeShape.RM_CBOUND_SAME | SeShape.RM_COMMON_POINT
               | SeShape.RM_BOUNDARY_INTERSECT | SeShape.RM_TESTS_PERFORMED
               | SeShape.RM_SEC_CONTAINED | SeShape.RM_PRIM_CONTAINED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, spartPolygonTwo.findRelation(spartPolygonTwo));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_EQUAL | CR_PRIM_CONTAINS_SEC | CR_SEC_CONTAINS_PRIM
                    | CR_SEC_WITHIN_PRIM | CR_PRIM_WITHIN_SEC;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(spartPolygonTwo, spartPolygonTwo);
        compareClemRel(expClemRel, obClemRel);

    } // End method PolygonRelations




    /**
    * Determines the different relations between point and polygon shapes and
    * verifies the relations obtained.
    */
    public void PointPolygonRelations() {

        long expRel = 0;
        int expClemRel = 0;
        int obClemRel = 0;

        /*
        *   Test relations between point & polygon shapes...
        */
        System.out.println("\n\n--> Testing relations between point & polygon shapes...");

        System.out.println("\nCase 1");
        expRel = SeShape.RM_COMMON_POINT | SeShape.RM_EMBEDDED_POINT
               | SeShape.RM_INTERIOR_INTERSECT | SeShape.RM_PRIM_LEP_INTERIOR
               | SeShape.RM_SEC_CONTAINED | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, spartPolygonOne.findRelation(multiPointOne));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_PRIM_CONTAINS_SEC | CR_SEC_WITHIN_PRIM;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(spartPolygonOne, multiPointOne);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 2");
        expRel = SeShape.RM_SEC_CONTAINED | SeShape.RM_INTERIOR_INTERSECT
                | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, spartPolygonOne.findRelation(pointOne));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_PRIM_CONTAINS_SEC | CR_SEC_WITHIN_PRIM;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(spartPolygonOne, pointOne);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 3");
        expRel = SeShape.RM_COMMON_POINT | SeShape.RM_EMBEDDED_POINT
               | SeShape.RM_PRIM_LEP_INTERIOR | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, spartPolygonOne.findRelation(multiPointTwo));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_TOUCHING;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(spartPolygonOne, multiPointTwo);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 4");
        expRel = SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, spartPolygonTwo.findRelation(pointOne));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_DISJOINT;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(spartPolygonTwo, pointOne);
        compareClemRel(expClemRel, obClemRel);

    } // End method PointPolygonRelations




    /**
    * Determines the different relations between line and polygon shapes and
    * verifies the relations obtained.
    */
    public void LinePolygonRelations() {

        long expRel = 0;
        int expClemRel = 0;
        int obClemRel = 0;

        /*
        *   Test relations between line & polygon shapes...
        */
        System.out.println("\n\n--> Testing relations between line & polygon shapes...");

        System.out.println("\nCase 1");
        expRel = SeShape.RM_INTERIOR_INTERSECT | SeShape.RM_COMMON_POINT
                | SeShape.RM_BOUNDARY_INTERSECT | SeShape.RM_EMBEDDED_POINT
                | SeShape.RM_PARALLEL_OVERLAPPING | SeShape.RM_TESTS_PERFORMED
                | SeShape.RM_LINE_CROSS;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, spartPolygonThree.findRelation(simpleMultiLineOne));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_CROSSING;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(spartPolygonThree, simpleMultiLineOne);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 2");
        expRel = SeShape.RM_INTERIOR_INTERSECT | SeShape.RM_COMMON_POINT
                | SeShape.RM_BOUNDARY_INTERSECT | SeShape.RM_EMBEDDED_POINT
                | SeShape.RM_PARALLEL_OVERLAPPING |SeShape.RM_PRIM_CONTAINED
                | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, simpleMultiLineOne.findRelation(spartPolygonOne));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_PRIM_CONTAINS_SEC | CR_SEC_WITHIN_PRIM;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(spartPolygonOne, simpleMultiLineOne);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 3");
        expRel =  SeShape.RM_COMMON_POINT | SeShape.RM_PARALLEL_OVERLAPPING
                | SeShape.RM_BOUNDARY_INTERSECT | SeShape.RM_EMBEDDED_POINT
                | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, simpleMultiLineOne.findRelation(spartPolygonTwo));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_TOUCHING;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(spartPolygonTwo, simpleMultiLineOne);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 4");
        expRel = SeShape.RM_INTERIOR_INTERSECT | SeShape.RM_COMMON_POINT
                | SeShape.RM_BOUNDARY_INTERSECT | SeShape.RM_EMBEDDED_POINT
                | SeShape.RM_PARALLEL_OVERLAPPING |SeShape.RM_LINE_CROSS
                | SeShape.RM_TESTS_PERFORMED;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, simpleMultiLineTwo.findRelation(spartPolygonOne));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_CROSSING;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(spartPolygonOne, simpleMultiLineTwo);
        compareClemRel(expClemRel, obClemRel);

        System.out.println("\nCase 5");
        expRel =  SeShape.RM_COMMON_POINT | SeShape.RM_TESTS_PERFORMED
                | SeShape.RM_BOUNDARY_INTERSECT | SeShape.RM_CBOUND_SAME;

        try{
            System.out.println("\nSeShape.findRelation:");
            compareRel(expRel, simpleLineOne.findRelation(spartPolygonTwo));
        } catch( SeException e ) {
            Util.printError(e);
        }

        expClemRel = CR_IS_TOUCHING;

        System.out.println("\nClementini Relations:");
        obClemRel = clementiniRelations(spartPolygonTwo, simpleLineOne);
        compareClemRel(expClemRel, obClemRel);

    } // End method LinePolygonRelations




    /**
    * Compares the expected relation with the observed relation, obtained from
    * the SeShape.findRelation method, and prints
    * details about the differences.
    *
    * @param expRel the expected relation bit mask value.
    * @param obRel the observed relation bit mask.
    *
    */
    public void compareRel(long expRel, long obRel) {

//        int bitmask = ~(1<<15);
//        obRel = obRel & bitmask;

        if( expRel == obRel )

            System.out.println("\n\tExpected relations = Observed Relations");
        else {

            System.out.println("\n\t** DIFFERENCE IN RELATIONS!! **");
            // expected relation (Exclusive OR) observed relation
            long expRelXORobRel = expRel ^ obRel ;
            getRelation(expRelXORobRel);

            System.out.println("\nExpected relations");
            getRelation(expRel);
            System.out.println("\nObserved relations");
            getRelation(obRel);

        }

    } // End method compareRel





    /**
    * Compares the expected relation with the observed relation, obtained from
    * the SeShape Clementini methods, and prints
    * details about the differences.
    *
    * @param expRel the expected relation bit mask value.
    * @param obRel the observed relation bit mask.
    *
    */
    public void compareClemRel(int expRel, int obRel) {

        if( expRel == obRel )

            System.out.println("\n\tExpected relations = Observed Relations");

        else {

            System.out.println("\n\tDIFFERENCE IN RELATIONS!!");
            // expected relation (Exclusive OR) observed relation
            int expRelXORobRel = expRel ^ obRel ;
            getClemRelation(expRelXORobRel);

            System.out.println("\nExpected relations");
            getClemRelation(expRel);
            System.out.println("\nObserved relations");
            getClemRelation(obRel);

        }

    } // End method compareClemRel




    /**
    * Displays <CODE>String</CODE> descriptions for the
    * relations that this bit mask contains.
    *
    * @param relation bit mask of relations obtained from
    * the SeShape.findRelation method.
    *
    */
    public void getRelation(long relation) {

        if( (relation & SeShape.RM_AREA_INTERSECT ) == SeShape.RM_AREA_INTERSECT  )
            System.out.println("\n\tRM_AREA_INTERSECT ");

        if( (relation & SeShape.RM_BOUNDARY_INTERSECT) == SeShape.RM_BOUNDARY_INTERSECT )
            System.out.println("\n\tRM_BOUNDARY_INTERSECT");

        if( (relation & SeShape.RM_CBOUND_DIFF) == SeShape.RM_CBOUND_DIFF )
            System.out.println("\n\tRM_CBOUND_DIFF");

        if( (relation & SeShape.RM_CBOUND_SAME) == SeShape.RM_CBOUND_SAME )
            System.out.println("\n\tRM_CBOUND_SAME");

        if( (relation & SeShape.RM_COMMON_POINT) == SeShape.RM_COMMON_POINT )
            System.out.println("\n\tRM_COMMON_POINT");

        if( (relation & SeShape.RM_EMBEDDED_POINT) == SeShape.RM_EMBEDDED_POINT )
            System.out.println("\n\tRM_EMBEDDED_POINT");

        if( (relation & SeShape.RM_IDENTICAL) == SeShape.RM_IDENTICAL )
            System.out.println("\n\tRM_IDENTICAL");

        if( (relation & SeShape.RM_INTERIOR_INTERSECT) == SeShape.RM_INTERIOR_INTERSECT )
            System.out.println("\n\tRM_INTERIOR_INTERSECT");

        if( (relation & SeShape.RM_LINE_CROSS) == SeShape.RM_LINE_CROSS )
            System.out.println("\n\tRM_LINE_CROSS");

        if( (relation & SeShape.RM_PARALLEL_OVERLAPPING) == SeShape.RM_PARALLEL_OVERLAPPING )
            System.out.println("\n\tRM_PARALLEL_OVERLAPPING");

        if( (relation & SeShape.RM_PRIM_CONTAINED) == SeShape.RM_PRIM_CONTAINED )
            System.out.println("\n\tRM_PRIM_CONTAINED");

        if( (relation & SeShape.RM_PRIM_LEP_INTERIOR) == SeShape.RM_PRIM_LEP_INTERIOR )
            System.out.println("\n\tRM_PRIM_LEP_INTERIOR");

        if( (relation & SeShape.RM_SEC_CONTAINED) == SeShape.RM_SEC_CONTAINED )
            System.out.println("\n\tRM_SEC_CONTAINED");

        if( (relation & SeShape.RM_SEC_LEP_INTERIOR) == SeShape.RM_SEC_LEP_INTERIOR )
            System.out.println("\n\tRM_SEC_LEP_INTERIOR");

        if( (relation & SeShape.RM_TESTS_PERFORMED) == SeShape.RM_TESTS_PERFORMED )
            System.out.println("\n\tRM_TESTS_PERFORMED");

    } // End method getRelation




    /**
    * Displays <CODE>String</CODE> descriptions of the Clementini
    * relations in a relation bitmask.
    *
    * @param relation bit mask of Clementini relations.
    */
    public void getClemRelation(int relation) {

        if( (relation & CR_PRIM_CONTAINS_SEC ) == CR_PRIM_CONTAINS_SEC )
            System.out.println("\n\tCR_PRIM_CONTAINS_SEC");

        if( (relation & CR_SEC_CONTAINS_PRIM ) == CR_SEC_CONTAINS_PRIM )
            System.out.println("\n\tCR_SEC_CONTAINS_PRIM");

        if( (relation & CR_IS_CROSSING ) == CR_IS_CROSSING )
            System.out.println("\n\tCR_IS_CROSSING");

        if( (relation & CR_IS_DISJOINT ) == CR_IS_DISJOINT )
            System.out.println("\n\tCR_IS_DISJOINT");

        if( (relation & CR_IS_EQUAL ) == CR_IS_EQUAL )
            System.out.println("\n\tCR_IS_EQUAL");

        if( (relation & CR_IS_OVERLAPPING ) == CR_IS_OVERLAPPING )
            System.out.println("\n\tCR_IS_OVERLAPPING");

        if( (relation & CR_IS_TOUCHING ) == CR_IS_TOUCHING )
            System.out.println("\n\tCR_IS_TOUCHING");

        if( (relation & CR_PRIM_WITHIN_SEC ) == CR_PRIM_WITHIN_SEC )
            System.out.println("\n\tCR_PRIM_WITHIN_SEC");

        if( (relation & CR_SEC_WITHIN_PRIM ) == CR_SEC_WITHIN_PRIM )
            System.out.println("\n\tCR_SEC_WITHIN_PRIM");

    } // End method getClemRelation




    /**
    * Returns a bit mask of all the Clementini relations that exist
    * between the primary and secondary shapes.
    *
    * @param primary the primary shape object.
    * @param secondary the secondary shape object.
    *
    */
    public int clementiniRelations(SeShape primary, SeShape secondary) {

        int clemRel = 0;

        try {
            if( primary.isContaining( secondary ) )
                clemRel = clemRel | CR_PRIM_CONTAINS_SEC;

            if( primary.isCrossing( secondary ) )
                clemRel = clemRel | CR_IS_CROSSING;

            if( primary.isDisjoint( secondary ) )
                clemRel = clemRel | CR_IS_DISJOINT;

            if( primary.isEqual( secondary ) )
                clemRel = clemRel | CR_IS_EQUAL;

            if( primary.isOverlapping( secondary ) )
                clemRel = clemRel | CR_IS_OVERLAPPING;

            if( primary.isTouching( secondary ) )
                clemRel = clemRel | CR_IS_TOUCHING;

            if( primary.isWithin( secondary ) )
                clemRel = clemRel | CR_PRIM_WITHIN_SEC;

            if( secondary.isWithin( primary ) )
                clemRel = clemRel | CR_SEC_WITHIN_PRIM;

            if( secondary.isContaining( primary ) )
                clemRel = clemRel | CR_SEC_CONTAINS_PRIM;

        } catch ( SeException e ) {
            Util.printError(e);
        }
        return clemRel;
    } // End method clementiniRelations

} // End public class ShapeClementiniExample
