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
 * Purpose: Demonstrates area union of different types of shapes
 * This Java sample demonstrates usage of ArcSDE API. It will not execute successfully until the user
 * supplies valid ArcSDE Server details such as server name, port number, database name, user, pwd, and valid
 * data, if required.
 **************************************************************************/
package com.dien.sde;

import com.esri.sde.sdk.client.SDEPoint;
import com.esri.sde.sdk.client.SeCoordinateReference;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeExtent;
import com.esri.sde.sdk.client.SeShape;


public class ShapeMiscExample
{
    private static SeCoordinateReference cref = null;

    public static void main(String[] args)
    {

        /*
         *   Common coordinate reference for tests shapes.
         */
        cref = new SeCoordinateReference();
        cref.setXY(0, 0, 1000);

        /*
         *   Test the SeShape.changePath method
         */
        System.out.println("\nSeShape.changePath() ");
        testChangePath();

        /*
         *   Tests the SeShape.clip() method
         */
        System.out.println("\nSeShape.clip() ");
        testShapeClip();

        System.out.println("\nSeShape.generateConvexHull() ");
        generateConvexHull();

    } // End main


    /*
     *   Tests the SeShape.generateConvexHull method
     *   The generateConvexHull method is used to convert any shape,
     *   into a polygon with a convex hull. The polygon generated
     *   is used in tessellation. Multi part shapes are all converted
     *   into single part polygons
     */
    public static void generateConvexHull()
    {

        int numPoints = 0;
        int numParts = 0;
        int[] partOffsets = null;
        SDEPoint[] ptArray = null;
        SDEPoint[] pointList = null;

        numPoints = 5;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(400, 200);
        ptArray[2] = new SDEPoint(300, 300);
        ptArray[3] = new SDEPoint(400, 400);
        ptArray[4] = new SDEPoint(200, 400);

        SeShape mpoint1 = null;
        try
        {
            mpoint1 = new SeShape(cref);
            mpoint1.generatePoint(numPoints, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numPoints = 5;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 400);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(400, 200);
        ptArray[3] = new SDEPoint(400, 400);
        ptArray[4] = new SDEPoint(200, 400);

        SeShape expShp = null;
        try
        {
            expShp = new SeShape(cref);
            expShp.generatePolygon(numPoints, numParts, partOffsets, ptArray);
            System.out.println(
                    "\nGenerating convex Hull of multi-point shape 1");
            SeShape convexHull = mpoint1.generateConvexHull();
            if (expShp.isEqual(convexHull))
            {
                System.out.println(" - OK");
            }
            else
            {
                System.out.println(" - ERROR");
                System.out.println("\nExpected:");
                Util.getAllCoords(expShp);
                System.out.println("\nObserved:");
                Util.getAllCoords(convexHull);
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numPoints = 7;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(400, 200);
        ptArray[2] = new SDEPoint(300, 500);
        ptArray[3] = new SDEPoint(200, 400);
        ptArray[4] = new SDEPoint(400, 400);
        ptArray[5] = new SDEPoint(500, 400);
        ptArray[6] = new SDEPoint(400, 500);

        SeShape mpoint2 = null;
        try
        {
            mpoint2 = new SeShape(cref);
            mpoint2.generatePoint(numPoints, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numPoints = 7;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 400);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(400, 200);
        ptArray[3] = new SDEPoint(500, 400);
        ptArray[4] = new SDEPoint(400, 500);
        ptArray[5] = new SDEPoint(300, 500);
        ptArray[6] = new SDEPoint(200, 400);

        try
        {
            expShp = new SeShape(cref);
            expShp.generatePolygon(numPoints, numParts, partOffsets, ptArray);
            System.out.println(
                    "\nGenerating convex Hull of multi-point shape 2");
            SeShape convexHull = mpoint2.generateConvexHull();
            if (expShp.isEqual(convexHull))
            {
                System.out.println(" - OK");
            }
            else
            {
                System.out.println(" - ERROR");
                System.out.println("\nExpected:");
                Util.getAllCoords(expShp);
                System.out.println("\nObserved:");
                Util.getAllCoords(convexHull);
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numPoints = 6;

        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 3;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(400, 400);
        ptArray[2] = new SDEPoint(200, 400);

        ptArray[3] = new SDEPoint(400, 200);
        ptArray[4] = new SDEPoint(500, 200);
        ptArray[5] = new SDEPoint(400, 300);

        SeShape msline = null;
        try
        {
            msline = new SeShape(cref);
            msline.generateSimpleLine(numPoints, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numPoints = 6;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 400);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(400, 200);
        ptArray[3] = new SDEPoint(500, 200);
        ptArray[4] = new SDEPoint(400, 400);
        ptArray[5] = new SDEPoint(200, 400);

        try
        {
            expShp = new SeShape(cref);
            expShp.generatePolygon(numPoints, numParts, partOffsets, ptArray);
            System.out.println(
                    "\nGenerating convex Hull of a multi simple line ");
            SeShape convexHull = msline.generateConvexHull();
            if (expShp.isEqual(convexHull))
            {
                System.out.println(" - OK");
            }
            else
            {
                System.out.println(" - ERROR");
                System.out.println("\nExpected:");
                Util.getAllCoords(expShp);
                System.out.println("\nObserved:");
                Util.getAllCoords(convexHull);
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numPoints = 4;

        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(400, 400);
        ptArray[2] = new SDEPoint(200, 400);
        ptArray[3] = new SDEPoint(400, 200);

        SeShape mline = null;
        try
        {
            mline = new SeShape(cref);
            mline.generateLine(numPoints, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numPoints = 5;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 400);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(400, 200);
        ptArray[3] = new SDEPoint(400, 400);
        ptArray[4] = new SDEPoint(200, 400);

        try
        {
            expShp = new SeShape(cref);
            expShp.generatePolygon(numPoints, numParts, partOffsets, ptArray);
            System.out.println(
                    "\nGenerating convex Hull of an intersecting line ");
            SeShape convexHull = mline.generateConvexHull();
            if (expShp.isEqual(convexHull))
            {
                System.out.println(" - OK");
            }
            else
            {
                System.out.println(" - ERROR");
                System.out.println("\nExpected:");
                Util.getAllCoords(expShp);
                System.out.println("\nObserved:");
                Util.getAllCoords(convexHull);
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numPoints = 10;

        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[9] = new SDEPoint(700, 200);
        ptArray[8] = new SDEPoint(400, 100);
        ptArray[7] = new SDEPoint(300, 200);
        ptArray[6] = new SDEPoint(200, 400);
        ptArray[5] = new SDEPoint(400, 600);
        ptArray[4] = new SDEPoint(800, 700);
        ptArray[3] = new SDEPoint(600, 500);
        ptArray[2] = new SDEPoint(500, 400);
        ptArray[1] = new SDEPoint(400, 200);
        ptArray[0] = new SDEPoint(700, 200);

        SeShape polyOne = null;
        try
        {
            polyOne = new SeShape(cref);
            polyOne.generatePolygon(numPoints, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numPoints = 7;

        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 400);
        ptArray[1] = new SDEPoint(300, 200);
        ptArray[2] = new SDEPoint(400, 100);
        ptArray[3] = new SDEPoint(700, 200);
        ptArray[4] = new SDEPoint(800, 700);
        ptArray[5] = new SDEPoint(400, 600);
        ptArray[6] = new SDEPoint(200, 400);

        try
        {
            expShp = new SeShape(cref);
            expShp.generatePolygon(numPoints, numParts, partOffsets, ptArray);
            System.out.println("\nGenerating convex Hull of a polygon ");
            SeShape convexHull = polyOne.generateConvexHull();
            if (expShp.isEqual(convexHull))
            {
                System.out.println(" - OK");
            }
            else
            {
                System.out.println(" - ERROR");
                System.out.println("\nExpected:");
                Util.getAllCoords(expShp);
                System.out.println("\nObserved:");
                Util.getAllCoords(convexHull);
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numPoints = 9;

        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 4;

        ptArray = new SDEPoint[numPoints];

        ptArray[0] = new SDEPoint(700, 200);
        ptArray[1] = new SDEPoint(700, 100);
        ptArray[2] = new SDEPoint(800, 400);
        ptArray[3] = new SDEPoint(700, 200);

        ptArray[4] = new SDEPoint(200, 400);
        ptArray[5] = new SDEPoint(200, 100);
        ptArray[6] = new SDEPoint(400, 300);
        ptArray[7] = new SDEPoint(400, 400);
        ptArray[8] = new SDEPoint(200, 400);

        SeShape polyTwo = null;
        try
        {
            polyTwo = new SeShape(cref);
            polyTwo.generatePolygon(numPoints, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numPoints = 6;

        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 400);
        ptArray[1] = new SDEPoint(200, 100);
        ptArray[2] = new SDEPoint(700, 100);
        ptArray[3] = new SDEPoint(800, 400);
        ptArray[4] = new SDEPoint(400, 400);
        ptArray[5] = new SDEPoint(200, 400);

        try
        {
            expShp = new SeShape(cref);
            expShp.generatePolygon(numPoints, numParts, partOffsets, ptArray);
            System.out.println(
                    "\nGenerating convex Hull of a multi-part polygon ");
            SeShape convexHull = polyTwo.generateConvexHull();
            if (expShp.isEqual(convexHull))
            {
                System.out.println(" - OK");
            }
            else
            {
                System.out.println(" - ERROR");
                System.out.println("\nExpected:");
                Util.getAllCoords(expShp);
                System.out.println("\nObserved:");
                Util.getAllCoords(convexHull);
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

    } // End static method generateConvexHull


    public static void testChangePath()
    {

        int numPoints = 0;
        int numParts = 0;
        int[] partOffsets = null;
        SDEPoint[] ptArray = null;
        SDEPoint[] pointList = null;
        SDEPoint firstPoint = null;
        SDEPoint midPoint = null;
        SDEPoint lastPoint = null;

        /*
         *   Change path for line strings
         */
        /*
         *   Generate a linestring
         */
        numPoints = 10;
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 4;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(300, 200);
        ptArray[2] = new SDEPoint(300, 300);
        ptArray[3] = new SDEPoint(400, 300);

        ptArray[4] = new SDEPoint(200, 700);
        ptArray[5] = new SDEPoint(200, 600);
        ptArray[6] = new SDEPoint(100, 600);
        ptArray[7] = new SDEPoint(100, 500);
        ptArray[8] = new SDEPoint(100, 400);
        ptArray[9] = new SDEPoint(100, 200);

        SeShape line = null;
        try
        {
            line = new SeShape(cref);
            line.generateSimpleLine(numPoints, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        firstPoint = new SDEPoint(200, 600);
        midPoint = new SDEPoint(100, 500);
        lastPoint = new SDEPoint(100, 200);
        pointList = new SDEPoint[2];
        pointList[0] = new SDEPoint(300, 700);
        pointList[1] = new SDEPoint(100, 300);

        numPoints = 9;
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 4;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(300, 200);
        ptArray[2] = new SDEPoint(300, 300);
        ptArray[3] = new SDEPoint(400, 300);

        ptArray[4] = new SDEPoint(200, 700);
        ptArray[5] = new SDEPoint(200, 600);
        ptArray[6] = new SDEPoint(300, 700);
        ptArray[7] = new SDEPoint(100, 300);
        ptArray[8] = new SDEPoint(100, 200);

        SeShape expShp = null;
        try
        {
            expShp = new SeShape(cref);
            expShp.generateSimpleLine(numPoints, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        try
        {
            System.out.println("\nTesting changePath for a multi simple line");
            System.out.println("\nCase 1");
            line.changePath(firstPoint, midPoint, lastPoint, pointList);
            if (expShp.isEqual(line))
            {
                System.out.println(" - OK");
            }
            else
            {
                System.out.println(" - Unexpected Result:");
                Util.getAllCoords(line);
                System.out.println(" - Expected Result:");
                Util.getAllCoords(expShp);
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        firstPoint = new SDEPoint(200, 600);
        midPoint = new SDEPoint(100, 300);
        lastPoint = new SDEPoint(100, 200);
        pointList = null;

        numPoints = 7;
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 4;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(300, 200);
        ptArray[2] = new SDEPoint(300, 300);
        ptArray[3] = new SDEPoint(400, 300);

        ptArray[4] = new SDEPoint(200, 700);
        ptArray[5] = new SDEPoint(200, 600);
        ptArray[6] = new SDEPoint(100, 200);

        expShp = null;
        try
        {
            expShp = new SeShape(cref);
            expShp.generateSimpleLine(numPoints, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        try
        {
            System.out.println("\nCase 2");
            line.changePath(firstPoint, midPoint, lastPoint, pointList);
            if (expShp.isEqual(line))
            {
                System.out.println(" - OK");
            }
            else
            {
                System.out.println(" - Unexpected Result:");
                Util.getAllCoords(line);
                System.out.println(" - Expected Result:");
                Util.getAllCoords(expShp);
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        /*
         *   Change path for polygons
         */
        /*
         *   Generate polygon
         */
        numPoints = 7;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(400, 200);
        ptArray[2] = new SDEPoint(400, 300);
        ptArray[3] = new SDEPoint(300, 500);
        ptArray[4] = new SDEPoint(300, 400);
        ptArray[5] = new SDEPoint(200, 300);
        ptArray[6] = new SDEPoint(200, 200);

        SeShape poly = null;
        try
        {
            poly = new SeShape(cref);
            poly.generatePolygon(numPoints, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        firstPoint = new SDEPoint(400, 300);
        midPoint = new SDEPoint(300, 400);
        lastPoint = new SDEPoint(200, 300);
        pointList = new SDEPoint[1];
        pointList[0] = new SDEPoint(300, 300);

        numPoints = 6;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(400, 200);
        ptArray[2] = new SDEPoint(400, 300);
        ptArray[3] = new SDEPoint(300, 300);
        ptArray[4] = new SDEPoint(200, 300);
        ptArray[5] = new SDEPoint(200, 200);

        expShp = null;
        try
        {
            expShp = new SeShape(cref);
            expShp.generatePolygon(numPoints, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        try
        {
            System.out.println("\nTesting changePath for a polygon");
            System.out.println("\nCase 1");
            poly.changePath(firstPoint, midPoint, lastPoint, pointList);
            if (expShp.isEqual(poly))
            {
                System.out.println(" - OK");
            }
            else
            {
                System.out.println(" - Unexpected Result:");
                Util.getAllCoords(poly);
                System.out.println(" - Expected Result:");
                Util.getAllCoords(expShp);
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        firstPoint = new SDEPoint(400, 300);
        midPoint = new SDEPoint(300, 300);
        lastPoint = new SDEPoint(200, 300);
        pointList = null;

        numPoints = 5;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(400, 200);
        ptArray[2] = new SDEPoint(400, 300);
        ptArray[3] = new SDEPoint(200, 300);
        ptArray[4] = new SDEPoint(200, 200);

        expShp = null;
        try
        {
            expShp = new SeShape(cref);
            expShp.generatePolygon(numPoints, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        try
        {
            System.out.println("\nCase 2");
            poly.changePath(firstPoint, midPoint, lastPoint, pointList);
            if (expShp.isEqual(poly))
            {
                System.out.println(" - OK");
            }
            else
            {
                System.out.println(" - Unexpected Result:");
                Util.getAllCoords(poly);
                System.out.println(" - Expected Result:");
                Util.getAllCoords(expShp);
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        firstPoint = new SDEPoint(400, 300);
        midPoint = new SDEPoint(200, 200);
        lastPoint = new SDEPoint(200, 300);
        pointList = new SDEPoint[1];
        pointList[0] = new SDEPoint(300, 200);

        numPoints = 4;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(400, 300);
        ptArray[1] = new SDEPoint(200, 300);
        ptArray[2] = new SDEPoint(300, 200);
        ptArray[3] = new SDEPoint(400, 300);

        expShp = null;
        try
        {
            expShp = new SeShape(cref);
            expShp.generatePolygon(numPoints, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        try
        {
            System.out.println("\nCase 3");
            poly.changePath(firstPoint, midPoint, lastPoint, pointList);
            if (expShp.isEqual(poly))
            {
                System.out.println(" - OK");
            }
            else
            {
                System.out.println(" - Unexpected Result:");
                Util.getAllCoords(poly);
                System.out.println(" - Expected Result:");
                Util.getAllCoords(expShp);
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

    } // End static method testChangePath


    public static void testShapeClip()
    {

        int numPoints = 0;
        int numParts = 0;
        int[] partOffsets = null;
        SDEPoint[] ptArray = null;
        SDEPoint[] pointList = null;

        /*
         *   Clip a multi-point shape
         */
        System.out.println("\nClipping multi-point shape");
        numPoints = 2;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(400, 200);
        ptArray[1] = new SDEPoint(400, 400);

        SeShape expShp = null;
        try
        {
            expShp = new SeShape(cref);
            expShp.generatePoint(numPoints, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numPoints = 5;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(400, 200);
        ptArray[2] = new SDEPoint(300, 300);
        ptArray[3] = new SDEPoint(400, 400);
        ptArray[4] = new SDEPoint(200, 400);

        SeShape mpoint = null;
        try
        {
            mpoint = new SeShape(cref);
            mpoint.generatePoint(numPoints, ptArray);
            SeExtent clipExt = new SeExtent(350, 150, 450, 450);
            mpoint = mpoint.clip(clipExt);
            if (expShp.isEqual(mpoint))
            {
                System.out.println(" - OK");
            }
            else
            {
                System.out.println(" - Unexpected Result");
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        /*
         *   Clip a multi simple line string
         */
        System.out.println("\nClipping a multi simple line string");
        numPoints = 7;
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 3;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(300, 250);
        ptArray[1] = new SDEPoint(300, 300);
        ptArray[2] = new SDEPoint(300, 400);

        ptArray[3] = new SDEPoint(500, 250);
        ptArray[4] = new SDEPoint(500, 300);
        ptArray[5] = new SDEPoint(600, 400);
        ptArray[6] = new SDEPoint(500, 400);

        expShp = null;
        try
        {
            expShp = new SeShape(cref);
            expShp.generateSimpleLine(numPoints, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numPoints = 9;
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 4;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(300, 200);
        ptArray[2] = new SDEPoint(300, 300);
        ptArray[3] = new SDEPoint(300, 400);

        ptArray[4] = new SDEPoint(400, 200);
        ptArray[5] = new SDEPoint(500, 200);
        ptArray[6] = new SDEPoint(500, 300);
        ptArray[7] = new SDEPoint(600, 400);
        ptArray[8] = new SDEPoint(500, 400);

        SeShape sline = null;
        try
        {
            sline = new SeShape(cref);
            sline.generateSimpleLine(numPoints, numParts, partOffsets, ptArray);
            SeExtent clipExt = new SeExtent(250, 250, 650, 450);
            sline = sline.clip(clipExt);
            if (expShp.isEqual(sline))
            {
                System.out.println(" - OK");
            }
            else
            {
                System.out.println(" - Unexpected Result");
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        /*
         *   Clip a line string
         */
        System.out.println("\n Clipping a line string");

        numPoints = 6;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(300, 250);
        ptArray[1] = new SDEPoint(300, 300);
        ptArray[2] = new SDEPoint(300, 400);
        ptArray[3] = new SDEPoint(400, 400);
        ptArray[4] = new SDEPoint(400, 300);
        ptArray[5] = new SDEPoint(250, 300);

        expShp = null;
        try
        {
            expShp = new SeShape(cref);
            expShp.generateLine(numPoints, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        /*
         *   Generate a linestring
         */
        numPoints = 9;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(300, 200);
        ptArray[2] = new SDEPoint(300, 300);
        ptArray[3] = new SDEPoint(300, 400);
        ptArray[4] = new SDEPoint(400, 400);
        ptArray[5] = new SDEPoint(400, 300);
        ptArray[6] = new SDEPoint(200, 300);
        ptArray[7] = new SDEPoint(100, 200);
        ptArray[8] = new SDEPoint(100, 100);

        SeShape line = null;
        try
        {
            line = new SeShape(cref);
            line.generateLine(numPoints, numParts, partOffsets, ptArray);
            SeExtent clipExt = new SeExtent(250, 250, 650, 450);
            line = line.clip(clipExt);
            if (expShp.isEqual(line))
            {
                System.out.println(" - OK");
            }
            else
            {
                System.out.println(" - Unexpected Result");
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        /*
         *   Clip a rectangular shape
         */
        System.out.println("\n Clipping a rectangle");
        numPoints = 5;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(300, 300);
        ptArray[1] = new SDEPoint(400, 300);
        ptArray[2] = new SDEPoint(400, 400);
        ptArray[3] = new SDEPoint(300, 400);
        ptArray[4] = new SDEPoint(300, 300);

        expShp = null;
        try
        {
            expShp = new SeShape(cref);
            expShp.generatePolygon(numPoints, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numPoints = 5;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(400, 200);
        ptArray[2] = new SDEPoint(400, 400);
        ptArray[3] = new SDEPoint(200, 400);
        ptArray[4] = new SDEPoint(200, 200);

        SeShape rectangle = null;
        try
        {
            rectangle = new SeShape(cref);
            rectangle.generatePolygon(numPoints, numParts, partOffsets, ptArray);
            SeExtent clipExt = new SeExtent(300, 300, 500, 500);
            rectangle = rectangle.clip(clipExt);
            if (expShp.isEqual(rectangle))
            {
                System.out.println(" - OK");
            }
            else
            {
                System.out.println(" - Unexpected Result");
                Util.getAllCoords(rectangle);
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        /*
         *   Clip an irregular polygon
         */
        System.out.println("\n Clipping an irregular polygon");

        numPoints = 7;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(300, 300);
        ptArray[1] = new SDEPoint(400, 300);
        ptArray[2] = new SDEPoint(400, 400);
        ptArray[3] = new SDEPoint(450, 500);
        ptArray[4] = new SDEPoint(400, 500);
        ptArray[5] = new SDEPoint(300, 400);
        ptArray[6] = new SDEPoint(300, 300);

        expShp = null;
        try
        {
            expShp = new SeShape(cref);
            expShp.generatePolygon(numPoints, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numPoints = 7;
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(400, 200);
        ptArray[2] = new SDEPoint(400, 400);
        ptArray[3] = new SDEPoint(500, 600);
        ptArray[4] = new SDEPoint(300, 400);
        ptArray[5] = new SDEPoint(200, 400);
        ptArray[6] = new SDEPoint(200, 200);

        SeShape polygon = null;
        try
        {
            polygon = new SeShape(cref);
            polygon.generatePolygon(numPoints, numParts, partOffsets, ptArray);
            SeExtent clipExt = new SeExtent(300, 300, 500, 500);
            polygon = polygon.clip(clipExt);
            if (expShp.isEqual(polygon))
            {
                System.out.println(" - OK");
            }
            else
            {
                System.out.println(" - Unexpected Result");
                Util.getAllCoords(polygon);
                System.out.println(" - Expected Result:");
                Util.getAllCoords(expShp);
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        /*
         *   Clip a multi-part polygon
         */
        System.out.println("\n Clipping a multi-part polygon");

        numPoints = 8;
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 4;

        ptArray = new SDEPoint[numPoints];
        ptArray[0] = new SDEPoint(300, 200);
        ptArray[1] = new SDEPoint(400, 300);
        ptArray[2] = new SDEPoint(300, 300);
        ptArray[3] = new SDEPoint(300, 200);

        ptArray[4] = new SDEPoint(400, 300);
        ptArray[5] = new SDEPoint(500, 200);
        ptArray[6] = new SDEPoint(500, 300);
        ptArray[7] = new SDEPoint(400, 300);

        expShp = null;
        try
        {
            expShp = new SeShape(cref);
            expShp.generatePolygon(numPoints, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        numPoints = 10;
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 5;

        ptArray = new SDEPoint[numPoints];

        ptArray[0] = new SDEPoint(500, 200);
        ptArray[1] = new SDEPoint(600, 300);
        ptArray[2] = new SDEPoint(500, 400);
        ptArray[3] = new SDEPoint(400, 300);
        ptArray[4] = new SDEPoint(500, 200);

        ptArray[5] = new SDEPoint(300, 200);
        ptArray[6] = new SDEPoint(400, 300);
        ptArray[7] = new SDEPoint(300, 400);
        ptArray[8] = new SDEPoint(200, 300);
        ptArray[9] = new SDEPoint(300, 200);
        polygon = null;

        try
        {
            polygon = new SeShape(cref);
            polygon.generatePolygon(numPoints, numParts, partOffsets, ptArray);
            SeExtent clipExt = new SeExtent(300, 100, 500, 300);
            polygon = polygon.clip(clipExt);
            if (expShp.isEqual(polygon))
            {
                System.out.println(" - OK");
            }
            else
            {
                System.out.println(" - Unexpected Result:");
                Util.getAllCoords(polygon);
                System.out.println(" - Expected Result:");
                Util.getAllCoords(expShp);
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

    } // End static method testShapeClip

} // End class ShapeMiscExample
