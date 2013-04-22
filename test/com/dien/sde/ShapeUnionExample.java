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
 * Purpose: Demonstrates union of different geometries using ArcSDE API.
 * This Java sample demonstrates usage of ArcSDE API. It will not execute successfully until the user
 * supplies valid ArcSDE Server details such as server name, port number, database name, user, pwd, and valid
 * data, if required.
 **************************************************************************/

package com.dien.sde;

import com.esri.sde.sdk.client.SDEPoint;
import com.esri.sde.sdk.client.SeCoordinateReference;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeShape;


public class ShapeUnionExample
{

    private static SeCoordinateReference cRef = null;

    public static void main(String[] args)
    {

        /*
         *   Create common coordinate reference to use for all the shapes
         */
        cRef = new SeCoordinateReference();
        SeCoordinateReference coordref = new SeCoordinateReference();
        String desc = "GEOGCS[\"TempGeogCS\"," +
                      "DATUM[\"D_Accra\",SPHEROID[\"War_Office\",6378300.0,296.0]],PRIMEM[\"Stockholm\",18.05827777777778]," +
                      "UNIT[\"Degree\",0.0174532925199433]]";
        try
        {
            coordref.setCoordSysByDescription(desc);
        }
        catch (SeException se)
        {
            System.out.println(" ERROR " + se.getSeError().getErrDesc());
            se.printStackTrace();
        }
        coordref.setXY(0.0, 0.0, 1000.0);

        /*
         *    area unions for different types of shapes
         */
        Point();
        SimpleLine();
        Line();
        Polygon();
    } // End main


    /*
     *
     *   s area union for point shapes
     *
     */
    public static void Point()
    {

        System.out.println("\n\t***Area union for point shapes ***\n");

        /*
         *
         *    union of two single part point shapes
         *
         */
        System.out.println("\n-->union of 2 single part point shapes");

        // Generate first point shape(100,100)
        SeShape point1 = null;
        try
        {
            point1 = new SeShape(cRef);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }
        int numPts = 1;
        SDEPoint[] ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);

        try
        {
            point1.generatePoint(numPts, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate second point shape (200,200)
        SeShape point2 = null;
        try
        {
            point2 = new SeShape(cRef);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }
        ptArray[0] = new SDEPoint(200, 200);
        try
        {
            point2.generatePoint(numPts, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate union of the two points
        SeShape testShp = null;
        try
        {
            testShp = point1.union(point2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate control shape to verify result
        SeShape controlShp = null;
        try
        {
            controlShp = new SeShape(cRef);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }
        numPts = 2;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);
        try
        {
            controlShp.generatePoint(numPts, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Verify that both the shapes are identical
        verifyUnion(testShp, controlShp);

        /*
         *    for transitivity of union operation
         */
        // Generate union of the two points
        try
        {
            testShp = point2.union(point1);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Verify that both the shapes are identical
        verifyUnion(testShp, controlShp);

        /*
         *    reflexive property of union operation
         */
        System.out.println("\nunion of point shape to itself");
        // Generate union of the two points
        try
        {
            testShp = point2.union(point2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Verify that both the shapes are identical
        verifyUnion(testShp, point2);

        /*
         *
         *    union of multipart points with common part
         *
         */
        System.out.println("\n-->union of 2 multi-part point shapes");
        // Generate point shape 1
        numPts = 3;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(300, 100);
        try
        {
            point1.generatePoint(numPts, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate point shape 2
        numPts = 3;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 300);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(300, 300);
        try
        {
            point2.generatePoint(numPts, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate union
        try
        {
            testShp = point1.union(point2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate control shape
        numPts = 5;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(300, 100);
        ptArray[2] = new SDEPoint(200, 200);
        ptArray[3] = new SDEPoint(100, 300);
        ptArray[4] = new SDEPoint(300, 300);
        try
        {
            controlShp.generatePoint(numPts, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Verify that both the shapes are identical
        verifyUnion(testShp, controlShp);

    } // End method Point


    /*
     *
     *   s area union for simple line shapes
     *
     */
    public static void SimpleLine()
    {

        System.out.println("\n\t***area union for Simple line shapes ***\n");

        /*
         *
         *    union of two single part line shapes
         *
         */
        System.out.println(
                "\n-->union of 2 single part non-intersecting line shapes");

        // Generate first line
        SeShape line1 = null;
        try
        {
            line1 = new SeShape(cRef);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }
        int numParts = 1;
        int[] partOffsets = new int[numParts];
        partOffsets[0] = 0;
        int numPts = 3;
        SDEPoint[] ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(300, 100);
        try
        {
            line1.generateSimpleLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate second line
        SeShape line2 = null;
        try
        {
            line2 = new SeShape(cRef);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        numPts = 3;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 300);
        ptArray[1] = new SDEPoint(200, 300);
        ptArray[2] = new SDEPoint(300, 300);
        try
        {
            line2.generateSimpleLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate union of the two lines
        SeShape testShp = null;
        try
        {
            testShp = line1.union(line2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate control shape to verify result
        SeShape controlShp = null;
        try
        {
            controlShp = new SeShape(cRef);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 3;
        numPts = 6;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(300, 100);
        ptArray[3] = new SDEPoint(100, 300);
        ptArray[4] = new SDEPoint(200, 300);
        ptArray[5] = new SDEPoint(300, 300);
        try
        {
            controlShp.generateSimpleLine(numPts, numParts, partOffsets,
                                          ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Verify that both the shapes are identical
        verifyUnion(testShp, controlShp);

        /*
         *
         *   Union of a single part line intersecting with a multipart line
         *
         */
        System.out.println(
                "\n-->union of single part line that intersects both parts of a "
                + "multi-part line");
        // Use the multi part line we created above
        try
        {
            line1 = (SeShape) controlShp.clone();
        }
        catch (CloneNotSupportedException e)
        {
            e.printStackTrace();
        }

        // Generate second line that intersects both the parts of the multi-part line
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        numPts = 3;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(200, 300);
        ptArray[2] = new SDEPoint(200, 400);
        try
        {
            line2.generateSimpleLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate union of the two lines
        try
        {
            testShp = line2.union(line1);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate control shape to verify result
        numParts = 3;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 3;
        partOffsets[2] = 6;
        numPts = 9;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(300, 100);
        ptArray[3] = new SDEPoint(100, 300);
        ptArray[4] = new SDEPoint(200, 300);
        ptArray[5] = new SDEPoint(300, 300);
        ptArray[6] = new SDEPoint(200, 200);
        ptArray[7] = new SDEPoint(200, 300);
        ptArray[8] = new SDEPoint(200, 400);

        try
        {
            controlShp.generateLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Verify that both the shapes are identical
        verifyUnion(testShp, controlShp);

        /*
         *
         *   Union of two overlapping multi-part lines
         *
         */
        System.out.println("\n-->union of two overlapping multi-part lines");

        // Reuse line1 generated above

        // Generate second multi-part line
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 2;
        numPts = 4;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(300, 300);
        ptArray[1] = new SDEPoint(400, 300);
        ptArray[2] = new SDEPoint(100, 100);
        ptArray[3] = new SDEPoint(100, 300);
        try
        {
            line2.generateSimpleLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate union of the two lines
        try
        {
            testShp = line1.union(line2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate control shape to verify result
        numParts = 4;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 3;
        partOffsets[2] = 6;
        partOffsets[3] = 8;
        numPts = 10;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(300, 100);
        ptArray[3] = new SDEPoint(100, 300);
        ptArray[4] = new SDEPoint(200, 300);
        ptArray[5] = new SDEPoint(300, 300);
        ptArray[6] = new SDEPoint(300, 300);
        ptArray[7] = new SDEPoint(400, 300);
        ptArray[8] = new SDEPoint(100, 100);
        ptArray[9] = new SDEPoint(100, 300);
        try
        {
            controlShp.generateSimpleLine(numPts, numParts, partOffsets,
                                          ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Verify that both the shapes are identical
        verifyUnion(testShp, controlShp);

    } // End SimpleLine


    /*
     *
     *   s area union for line shapes
     *
     */
    public static void Line()
    {

        System.out.println("\n\t***area union for line shapes ***\n");

        /*
         *
         *    union of two single part line shapes
         *
         */
        System.out.println(
                "\n-->union of 2 single part non-intersecting line shapes");

        // Generate first line
        SeShape line1 = null;
        try
        {
            line1 = new SeShape(cRef);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }
        int numParts = 1;
        int[] partOffsets = new int[numParts];
        partOffsets[0] = 0;
        int numPts = 3;
        SDEPoint[] ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(300, 100);
        try
        {
            line1.generateLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate second line
        SeShape line2 = null;
        try
        {
            line2 = new SeShape(cRef);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        numPts = 3;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 300);
        ptArray[1] = new SDEPoint(200, 300);
        ptArray[2] = new SDEPoint(300, 300);
        try
        {
            line2.generateLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate union of the two lines
        SeShape testShp = null;
        try
        {
            testShp = line1.union(line2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate control shape to verify result
        SeShape controlShp = null;
        try
        {
            controlShp = new SeShape(cRef);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 3;
        numPts = 6;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(300, 100);
        ptArray[3] = new SDEPoint(100, 300);
        ptArray[4] = new SDEPoint(200, 300);
        ptArray[5] = new SDEPoint(300, 300);
        try
        {
            controlShp.generateLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Verify that both the shapes are identical
        verifyUnion(testShp, controlShp);

        /*
         *
         *   Union of a single part line intersecting with a multipart line
         *
         */
        System.out.println(
                "\n-->union of single part line that intersects both parts of a "
                + "multi-part line");
        // Use the multi part line we created above
        line1 = controlShp;

        // Generate second line that intersects both the parts of the multi-part line
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        numPts = 3;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(200, 300);
        ptArray[2] = new SDEPoint(200, 400);
        try
        {
            line2.generateLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate union of the two lines
        try
        {
            testShp = line2.union(line1);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate control shape to verify result
        numParts = 3;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 3;
        partOffsets[2] = 6;
        numPts = 9;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(300, 100);
        ptArray[3] = new SDEPoint(100, 300);
        ptArray[4] = new SDEPoint(200, 300);
        ptArray[5] = new SDEPoint(300, 300);
        ptArray[6] = new SDEPoint(200, 200);
        ptArray[7] = new SDEPoint(200, 300);
        ptArray[8] = new SDEPoint(200, 400);

        try
        {
            controlShp.generateLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Verify that both the shapes are identical
        verifyUnion(testShp, controlShp);

        /*
         *
         *   Union of two overlapping multi-part lines
         *
         */
        System.out.println("\n-->union of two overlapping multi-part lines");

        // Generate first line
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 3;
        numPts = 6;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(300, 100);

        ptArray[3] = new SDEPoint(100, 300);
        ptArray[4] = new SDEPoint(200, 300);
        ptArray[5] = new SDEPoint(300, 300);
        try
        {
            line1 = new SeShape(cRef);
            line1.generateLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate second multi-part line
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 2;
        numPts = 4;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(300, 300);
        ptArray[1] = new SDEPoint(400, 300);
        ptArray[2] = new SDEPoint(100, 100);
        ptArray[3] = new SDEPoint(100, 300);
        try
        {
            line2.generateLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate union of the two lines
        try
        {
            testShp = line1.union(line2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate control shape to verify result
        numParts = 4;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 3;
        partOffsets[2] = 6;
        partOffsets[3] = 8;
        numPts = 10;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(300, 100);
        ptArray[3] = new SDEPoint(100, 300);
        ptArray[4] = new SDEPoint(200, 300);
        ptArray[5] = new SDEPoint(300, 300);
        ptArray[6] = new SDEPoint(300, 300);
        ptArray[7] = new SDEPoint(400, 300);
        ptArray[8] = new SDEPoint(100, 100);
        ptArray[9] = new SDEPoint(100, 300);
        try
        {
            controlShp.generateLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Verify that both the shapes are identical
        verifyUnion(testShp, controlShp);

    } // End Line


    /*
     *
     *   s area union for polygon shapes
     *
     */
    public static void Polygon()
    {

        System.out.println("\n\t***area union for polygons ***\n");

        /*
         *
         *    union of two overlapping single part polygon shapes
         *
         */
        System.out.println(
                "\n-->union of 2 overlapping single part polygon shapes");

        // Generate first polygon
        SeShape polygon1 = null;
        try
        {
            polygon1 = new SeShape(cRef);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }
        int numParts = 1;
        int[] partOffsets = new int[numParts];
        partOffsets[0] = 0;
        int numPts = 5;
        SDEPoint[] ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 100);
        ptArray[2] = new SDEPoint(200, 200);
        ptArray[3] = new SDEPoint(100, 200);
        ptArray[4] = new SDEPoint(100, 100);
        try
        {
            polygon1.generatePolygon(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate second polygon
        SeShape polygon2 = null;
        try
        {
            polygon2 = new SeShape(cRef);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        numPts = 5;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(150, 150);
        ptArray[1] = new SDEPoint(250, 150);
        ptArray[2] = new SDEPoint(250, 250);
        ptArray[3] = new SDEPoint(150, 250);
        ptArray[4] = new SDEPoint(150, 150);
        try
        {
            polygon2.generatePolygon(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate union of the two polygons
        SeShape testShp = null;
        try
        {
            testShp = polygon1.union(polygon2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate multi part control polygon
        SeShape controlShp = null;
        try
        {
            controlShp = new SeShape(cRef);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        numPts = 9;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 100);
        ptArray[2] = new SDEPoint(200, 150);
        ptArray[3] = new SDEPoint(250, 150);
        ptArray[4] = new SDEPoint(250, 250);
        ptArray[5] = new SDEPoint(150, 250);
        ptArray[6] = new SDEPoint(150, 200);
        ptArray[7] = new SDEPoint(100, 200);
        ptArray[8] = new SDEPoint(100, 100);

        try
        {
            controlShp.generatePolygon(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Verify that both the shapes are identical
        verifyUnion(testShp, controlShp);

        /*
         *
         *   Union of single part polygon overlapping one part of a
         *   multi-part polygon
         *
         */
        System.out.println(
                "\n--> Single part polygon overlapping one part of a multi-part polygon");

        // Re-use the single part polygon2 from above

        // Generate the multi-part polygon with one part overlapping with the
        // polygon2
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 5;
        numPts = 10;
        ptArray = new SDEPoint[numPts];
        // First part
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 100);
        ptArray[2] = new SDEPoint(200, 200);
        ptArray[3] = new SDEPoint(100, 200);
        ptArray[4] = new SDEPoint(100, 100);
        // Second part
        ptArray[5] = new SDEPoint(200, 300);
        ptArray[6] = new SDEPoint(300, 300);
        ptArray[7] = new SDEPoint(300, 400);
        ptArray[8] = new SDEPoint(200, 400);
        ptArray[9] = new SDEPoint(200, 300);
        try
        {
            polygon1.generatePolygon(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate union of the two polygons
        try
        {
            testShp = polygon1.union(polygon2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate the multi-part control polygon
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 5;
        numPts = 14;
        ptArray = new SDEPoint[numPts];
        // First part
        ptArray[0] = new SDEPoint(200, 300);
        ptArray[1] = new SDEPoint(300, 300);
        ptArray[2] = new SDEPoint(300, 400);
        ptArray[3] = new SDEPoint(200, 400);
        ptArray[4] = new SDEPoint(200, 300);
        // Second part - union of overlapping segments
        ptArray[5] = new SDEPoint(100, 100);
        ptArray[6] = new SDEPoint(200, 100);
        ptArray[7] = new SDEPoint(200, 150);
        ptArray[8] = new SDEPoint(250, 150);
        ptArray[9] = new SDEPoint(250, 250);
        ptArray[10] = new SDEPoint(150, 250);
        ptArray[11] = new SDEPoint(150, 200);
        ptArray[12] = new SDEPoint(100, 200);
        ptArray[13] = new SDEPoint(100, 100);

        try
        {
            controlShp.generatePolygon(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Verify that both the shapes are identical
        verifyUnion(testShp, controlShp);

        /*
         *
         *   Union of single part polygon overlapping both parts of a
         *   multi-part polygon
         *
         */
        System.out.println(
                "\n--> Single part polygon overlapping both parts of a multi-part polygon");

        // Re-use the single part polygon2 from above

        // Generate the multi-part polygon with both parts overlapping with the
        // polygon2
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 5;
        numPts = 10;
        ptArray = new SDEPoint[numPts];
        // First part
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 100);
        ptArray[2] = new SDEPoint(200, 200);
        ptArray[3] = new SDEPoint(100, 200);
        ptArray[4] = new SDEPoint(100, 100);
        // Second part
        ptArray[5] = new SDEPoint(200, 240);
        ptArray[6] = new SDEPoint(300, 240);
        ptArray[7] = new SDEPoint(300, 300);
        ptArray[8] = new SDEPoint(200, 300);
        ptArray[9] = new SDEPoint(200, 240);
        try
        {
            polygon1.generatePolygon(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate union of the two polygons
        try
        {
            testShp = polygon1.union(polygon2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate the multi-part control polygon
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        numPts = 13;
        ptArray = new SDEPoint[numPts];

        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 100);
        ptArray[2] = new SDEPoint(200, 150);
        ptArray[3] = new SDEPoint(250, 150);
        ptArray[4] = new SDEPoint(250, 240);
        ptArray[5] = new SDEPoint(300, 240);
        ptArray[6] = new SDEPoint(300, 300);
        ptArray[7] = new SDEPoint(200, 300);
        ptArray[8] = new SDEPoint(200, 250);
        ptArray[9] = new SDEPoint(150, 250);
        ptArray[10] = new SDEPoint(150, 200);
        ptArray[11] = new SDEPoint(100, 200);
        ptArray[12] = new SDEPoint(100, 100);

        try
        {
            controlShp.generatePolygon(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Verify that both the shapes are identical
        verifyUnion(testShp, controlShp);

    } // End Polygon


    /*
     *
     *   verifies if the two input shapes are identical or not
     *
     */
    public static void verifyUnion(SeShape testShp, SeShape controlShp)
    {

        System.out.println("\n--> Verifying result of union");
        long relation = 0;
        try
        {
            relation = controlShp.findRelation(testShp);
            if ((SeShape.RM_IDENTICAL & relation) == SeShape.RM_IDENTICAL)
            {
                System.out.println(
                        "\tTest and control shapes are both identical");
            }
            else
            {
                System.out.println("!! Shapes are NOT identical !!");
                System.out.println("\n-->  shape");
                Util.getAllCoords(testShp);
                System.out.println("\n--> Control shape");
                Util.getAllCoords(controlShp);
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }
    } // End verifyUnion
} // End ShapeUnionExample
