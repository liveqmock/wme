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
 * Purpose: Demonstrates determination of Distance between different shapes.
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


public class ShapeDistanceExample
{
    private static SeCoordinateReference cRef = null;

    public static void main(String[] args)
    {

        /*
         *   Create common coordinate reference to use for all the shapes
         */
        cRef = new SeCoordinateReference();
        SeCoordinateReference coordref = new SeCoordinateReference();
        coordref.setXY(0.0, 0.0, 1000.0);
        double distance = 0.0;

        System.out.println("\n Distance between point shapes...");

        // Generate point shape 1
        int numPts = 1;
        SDEPoint[] ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        SeShape point1 = null;
        try
        {
            point1 = new SeShape(cRef);
            point1.generatePoint(numPts, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate point shape 2 - has same coords as point 1.
        numPts = 1;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        SeShape point2 = null;
        try
        {
            point2 = new SeShape(cRef);
            point2.generatePoint(numPts, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println("\n Distance between overlapping points...");
        try
        {
            distance = point1.calculateDistance(point2, true);
            if (distance != 0.0)
            {
                System.out.println(" Expected result - 0.0");
                System.out.println(" Observed result - " + distance);
            }
            else
            {
                System.out.println(" - OK");
            }

        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate point shape 3
        numPts = 1;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(110, 180);
        SeShape point3 = null;
        try
        {
            point3 = new SeShape(cRef);
            point3.generatePoint(numPts, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println("\n Distance between non-overlapping points...");
        try
        {
            distance = point1.calculateDistance(point3, false);
            if (distance > 80.622577483 || distance < 80.622577482)
            {
                System.out.println("Distance expected - 80.622577482985496523");
                System.out.println("Distance observed - " + distance);
            }
            else
            {
                System.out.println(" - OK ");
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate multi-point shape 4
        numPts = 2;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(150, 180);
        ptArray[1] = new SDEPoint(130, 100);
        SeShape point4 = null;
        try
        {
            point4 = new SeShape(cRef);
            point4.generatePoint(numPts, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Distance between non-overlapping point and multipoint...");
        try
        {
            distance = point1.calculateDistance(point4, false);
            if (distance != 30.0)
            {
                System.out.println(" Expected result - 30");
                System.out.println(" Observed result - " + distance);
            }
            else
            {
                System.out.println(" - OK");
            }

        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate multi-point shape 5 that overlaps shape 4
        numPts = 2;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(150, 180);
        ptArray[1] = new SDEPoint(130, 100);
        SeShape point5 = null;
        try
        {
            point5 = new SeShape(cRef);
            point5.generatePoint(numPts, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Distance between completely overlapping multipoint shapes...");
        try
        {
            distance = point5.calculateDistance(point4, false);
            if (distance != 0.0)
            {
                System.out.println(" Expected result - 0.0");
                System.out.println(" Observed result - " + distance);
            }
            else
            {
                System.out.println(" - OK");
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Redefine multi-point shape 5
        numPts = 2;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(150, 180);
        ptArray[1] = new SDEPoint(100, 100);
        try
        {
            point5 = new SeShape(cRef);
            point5.generatePoint(numPts, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Distance between partially overlapping multipoint shapes...");
        try
        {
            distance = point5.calculateDistance(point4, false);
            if (distance != 0.0)
            {
                System.out.println(" Expected result - 0.0");
                System.out.println(" Observed result - " + distance);
            }
            else
            {
                System.out.println(" - OK");
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate multi-point shape 6
        numPts = 4;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(140, 140);
        ptArray[1] = new SDEPoint(160, 200);
        ptArray[2] = new SDEPoint(300, 120);
        ptArray[3] = new SDEPoint(300, 150);

        SeShape point6 = null;
        try
        {
            point6 = new SeShape(cRef);
            point6.generatePoint(numPts, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Distance between non-overlapping multipoint shapes...");
        try
        {
            distance = point4.calculateDistance(point6, false);
            if (distance < 22.36067977 || distance > 22.360679775)
            {
                System.out.println(" Expected result - 22.3606797749");
                System.out.println(" Observed result - " + distance);
            }
            else
            {
                System.out.println(" - OK");
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate simple linestring
        int numParts = 1;
        int[] partOffsets = new int[numParts];
        partOffsets[0] = 0;
        numPts = 3;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(300, 100);
        SeShape line = null;
        try
        {
            line = new SeShape(cRef);
            line.generateSimpleLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate simple linestring 2
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        numPts = 3;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(300, 100);
        SeShape line2 = null;
        try
        {
            line2 = new SeShape(cRef);
            line2.generateSimpleLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Distance between overlapping simple line shapes...");
        try
        {
            distance = line.calculateDistance(line2, false);
            if (distance != 0.0)
            {
                System.out.println(" Expected result - 0.0");
                System.out.println(" Observed result - " + distance);
            }
            else
            {
                System.out.println(" - OK");
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // redefine simple linestring 2
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        numPts = 3;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(200, 200);
        ptArray[1] = new SDEPoint(300, 100);
        ptArray[2] = new SDEPoint(400, 100);
        try
        {
            line2 = new SeShape(cRef);
            line2.generateSimpleLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Distance between partially overlapping simple line shapes...");
        try
        {
            distance = line.calculateDistance(line2, false);
            if (distance != 0.0)
            {
                System.out.println(" Expected result - 0.0");
                System.out.println(" Observed result - " + distance);
            }
            else
            {
                System.out.println(" - OK");
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // redefine simple linestring 2
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        numPts = 3;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(300, 200);
        ptArray[1] = new SDEPoint(400, 200);
        ptArray[2] = new SDEPoint(400, 100);
        try
        {
            line2 = new SeShape(cRef);
            line2.generateSimpleLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Distance between non-overlapping simple line shapes...");
        try
        {
            distance = line.calculateDistance(line2, false);
            if (distance < 70.710678 || distance > 70.7106782)
            {
                System.out.println(" Expected result - 70.7106781");
                System.out.println(" Observed result - " + distance);
            }
            else
            {
                System.out.println(" - OK");
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate simple multi linestring
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 3;
        numPts = 5;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(300, 100);

        ptArray[3] = new SDEPoint(400, 100);
        ptArray[4] = new SDEPoint(400, 200);

        SeShape mline = null;
        try
        {
            mline = new SeShape(cRef);
            mline.generateSimpleLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate simple multi linestring 2
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 3;
        numPts = 5;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(300, 100);

        ptArray[3] = new SDEPoint(400, 100);
        ptArray[4] = new SDEPoint(400, 200);

        SeShape mline2 = null;
        try
        {
            mline2 = new SeShape(cRef);
            mline2.generateSimpleLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Distance between overlapping simple multi-line shapes...");
        try
        {
            distance = mline.calculateDistance(mline2, false);
            if (distance != 0.0)
            {
                System.out.println(" Expected result - 0.0");
                System.out.println(" Observed result - " + distance);
            }
            else
            {
                System.out.println(" - OK");
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate simple polygon shape
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        numPts = 6;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(1, 3);
        ptArray[1] = new SDEPoint(3, 1);
        ptArray[2] = new SDEPoint(6, 4);
        ptArray[3] = new SDEPoint(4, 6);
        ptArray[4] = new SDEPoint(2, 5);
        ptArray[5] = new SDEPoint(1, 3);

        SeShape polygon = null;
        try
        {
            polygon = new SeShape(cRef);
            polygon.generatePolygon(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate simple polygon shape 2
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        numPts = 6;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(4, 1);
        ptArray[1] = new SDEPoint(6, 2);
        ptArray[2] = new SDEPoint(7, 5);
        ptArray[3] = new SDEPoint(6, 6);
        ptArray[4] = new SDEPoint(4, 4);
        ptArray[5] = new SDEPoint(4, 1);

        SeShape polygon2 = null;
        try
        {
            polygon2 = new SeShape(cRef);
            polygon2.generatePolygon(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Distance between partially overlapping polygon shapes...");
        try
        {
            distance = polygon.calculateDistance(polygon2, false);
            if (distance != 0.0)
            {
                System.out.println(" Expected result - 0.0");
                System.out.println(" Observed result - " + distance);
            }
            else
            {
                System.out.println(" - OK");
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate a rectangle
        SeExtent extent = new SeExtent(200, 200, 400, 400);
        SeShape rectangle = null;
        try
        {
            rectangle = new SeShape(cRef);
            rectangle.generateRectangle(extent);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate rectangle 2
        extent = new SeExtent(600, 600, 900, 900);
        SeShape rectangle2 = null;
        try
        {
            rectangle2 = new SeShape(cRef);
            rectangle2.generateRectangle(extent);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println("\n Distance between rectangles...");
        try
        {
            distance = rectangle.calculateDistance(rectangle2, false);
            if (distance < 282.842712 || distance > 282.842713)
            {
                System.out.println(" Expected result - 282.842712474");
                System.out.println(" Observed result - " + distance);
            }
            else
            {
                System.out.println(" - OK");
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate rectangle 2
        extent = new SeExtent(600, 500, 900, 900);
        try
        {
            rectangle2 = new SeShape(cRef);
            rectangle2.generateRectangle(extent);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println("\n Distance between rectangles...");
        try
        {
            distance = rectangle.calculateDistance(rectangle2, false);
            if (distance < 223.6067977 || distance > 223.6067978)
            {
                System.out.println(" Expected result - 223.6067977");
                System.out.println(" Observed result - " + distance);
            }
            else
            {
                System.out.println(" - OK");
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println("\n Distance between Nil shapes...");
        try
        {
            SeShape shapeOne = new SeShape(cRef);
            SeShape shapeTwo = new SeShape(cRef);
            distance = shapeOne.calculateDistance(shapeTwo, false);
            if (distance != 0.0)
            {
                System.out.println(" Expected result - 0.0");
                System.out.println(" Observed result - " + distance);
            }
            else
            {
                System.out.println(" - OK");
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

    } // End main

} // End ShapeDistanceExample
