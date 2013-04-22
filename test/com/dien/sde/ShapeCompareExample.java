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
 * Purpose: Demonstrates use of SeShape.difference, SeShape.symmetricalDifference, SeShape.overlay & SeShape.intersection.
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


public class ShapeCompareExample
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

        SeShape[] overlayResult = null;
        SeShape nilShape = null;
        System.out.println("\n Overlay of Nil shapes...");
        try
        {
            nilShape = new SeShape(cRef);
            overlayResult = nilShape.overlay(nilShape);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println("\n Difference between Nil shapes...");
        try
        {
            nilShape = new SeShape(cRef);
            verifyResult(nilShape.difference(nilShape), overlayResult[0]);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println("\n Symmetrical difference between Nil shapes...");
        try
        {
            nilShape = new SeShape(cRef);
            verifyResult(nilShape.symmetricalDifference(nilShape), nilShape);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println("\n Difference between point shapes...");

        // Generate point shape 1
        int numPts = 1;
        SDEPoint[] ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(80, 180);
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
        ptArray[0] = new SDEPoint(80, 180);
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

        System.out.println("\n Overlay of overlapping points...");
        try
        {
            overlayResult = point1.overlay(point2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println("\n Difference between overlapping points...");
        try
        {
            verifyResult(point1.difference(point2), overlayResult[0]);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Symmetrical Difference between overlapping points...");
        try
        {
            verifyResult(point1.symmetricalDifference(point2),
                         overlayResult[0].union(overlayResult[1]));
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println("\n Intersection between identical points...");
        try
        {
            verifyResult(point1.intersect(point2), overlayResult);
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

        System.out.println("\n Overlay of non-overlapping points...");
        try
        {
            overlayResult = point1.overlay(point3);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println("\n Difference between non-overlapping points...");
        try
        {
            verifyResult(point1.difference(point3), overlayResult[0]);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Symmetrical Difference between non-overlapping points...");
        try
        {
            verifyResult(point1.symmetricalDifference(point3),
                         overlayResult[0].union(overlayResult[1]));
        }
        catch (SeException e)
        {
            Util.printError(e);
        }
        System.out.println("\n Intersection between non-overlapping points...");
        try
        {
            if (overlayResult.length == 2)
            {
                overlayResult = new SeShape[3];
                overlayResult[2] = new SeShape(cRef);
            }
            verifyResult(point1.intersect(point3), overlayResult);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate multi-point shape 4
        numPts = 2;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(110, 180);
        ptArray[1] = new SDEPoint(100, 100);
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
                "\n Overlaying non-overlapping point and multipoint...");
        try
        {
            overlayResult = point1.overlay(point4);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Difference between non-overlapping point and multipoint...");
        try
        {
            verifyResult(point1.difference(point4), overlayResult[0]);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate multi-point shape 5 that overlaps shape 4
        numPts = 2;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(110, 180);
        ptArray[1] = new SDEPoint(100, 100);
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
                "\n Overlaying completely overlapping multipoint shapes...");
        try
        {
            overlayResult = point5.overlay(point4);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Difference between completely overlapping multipoint shapes...");
        try
        {
            verifyResult(point5.difference(point4), overlayResult[0]);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Symmetrical Difference between completely overlapping multipoint shapes...");
        try
        {
            verifyResult(point5.symmetricalDifference(point4),
                         overlayResult[0].union(overlayResult[1]));
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Intersection between completely overlapping multipoint shapes...");
        try
        {
            verifyResult(point5.intersect(point4), overlayResult);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Redefine multi-point shape 5
        numPts = 2;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 180);
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
                "\n Overlaying partially overlapping multipoint shapes...");
        try
        {
            overlayResult = point5.overlay(point4);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Difference between partially overlapping multipoint shapes...");
        try
        {
            verifyResult(point5.difference(point4), overlayResult[0]);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Symmetrical Difference between partially overlapping multipoint shapes...");
        try
        {
            verifyResult(point5.symmetricalDifference(point4),
                         overlayResult[0].union(overlayResult[1]));
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Intersection between partially overlapping multipoint shapes...");
        try
        {
            verifyResult(point5.intersect(point4), overlayResult);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate multi-point shape 6
        numPts = 10;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 130);
        ptArray[1] = new SDEPoint(200, 300);
        ptArray[2] = new SDEPoint(300, 100);
        ptArray[3] = new SDEPoint(300, 100);
        ptArray[4] = new SDEPoint(410, 380);
        ptArray[5] = new SDEPoint(400, 200);
        ptArray[6] = new SDEPoint(500, 200);
        ptArray[7] = new SDEPoint(600, 200);
        ptArray[8] = new SDEPoint(210, 180);
        ptArray[9] = new SDEPoint(100, 290);

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

        System.out.println("\n Overlaying non-overlapping multipoint shapes...");
        try
        {
            overlayResult = point4.overlay(point6);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Difference between non-overlapping multipoint shapes...");
        try
        {
            verifyResult(point4.difference(point6), overlayResult[0]);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        /* Difference in point ordering..
                 System.out.println("\n Symmetrical Difference between non-overlapping multipoint shapes...");
                 try{
                 verifyResult( point4.symmetricalDifference(point6), overlayResult[0].union(overlayResult[1]) );
                 }catch( SeException e ) {
                 Util.printError(e);
                 }
         */
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

        System.out.println("\n Overlaying simple line and point shapes...");
        try
        {
            overlayResult = line.overlay(point4);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Intersection between simple line and point shapes...");
        try
        {
            verifyResult(line.intersect(point4), overlayResult);
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

        System.out.println("\n Overlaying overlapping simple line shapes...");
        try
        {
            overlayResult = line.overlay(line2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Difference between overlapping simple line shapes...");
        try
        {
            verifyResult(line.difference(line2), overlayResult[0]);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Symmetrical Difference between overlapping simple line shapes...");
        try
        {
            verifyResult(line.symmetricalDifference(line2),
                         overlayResult[0].union(overlayResult[1]));
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Intersection between overlapping simple line shapes...");
        try
        {
            verifyResult(line.intersect(line2), overlayResult);
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
                "\n overlaying partially overlapping simple line shapes...");
        try
        {
            overlayResult = line.overlay(line2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Difference between partially overlapping simple line shapes...");
        try
        {
            verifyResult(line.difference(line2), overlayResult[0]);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Symmetrical Difference between partially overlapping simple line shapes...");
        try
        {
            verifyResult(line.symmetricalDifference(line2),
                         overlayResult[0].union(overlayResult[1]));
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Intersection between partially overlapping simple line shapes...");
        try
        {
            verifyResult(line.intersect(line2), overlayResult);
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
                "\n Overlaying non-overlapping simple line shapes...");
        try
        {
            overlayResult = line.overlay(line2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Difference between non-overlapping simple line shapes...");
        try
        {
            verifyResult(line.difference(line2), overlayResult[0]);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Symmetrical Difference between non-overlapping simple line shapes...");
        try
        {
            verifyResult(line.symmetricalDifference(line2),
                         overlayResult[0].union(overlayResult[1]));
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

        System.out.println("\n Overlaying touching simple line shapes...");
        try
        {
            overlayResult = line.overlay(line2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Intersection between touching simple line shapes...");
        try
        {
            verifyResult(line.intersect(line2), overlayResult);
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
                "\n Overlaying overlapping simple multi-line shapes...");
        try
        {
            overlayResult = mline.overlay(mline2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Difference between overlapping simple multi-line shapes...");
        try
        {
            verifyResult(mline.difference(mline2), overlayResult[0]);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Symmetrical Difference between overlapping simple multi-line shapes...");
        try
        {
            verifyResult(mline.symmetricalDifference(mline2),
                         overlayResult[0].union(overlayResult[1]));
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Intersection between identical simple multi-line shapes...");
        try
        {
            verifyResult(mline.intersect(mline2), overlayResult);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // redefine simple multi linestring 2
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 2;
        numPts = 4;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);

        ptArray[2] = new SDEPoint(400, 100);
        ptArray[3] = new SDEPoint(400, 200);

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
                "\n Overlaying partially overlapping simple multi-line shapes...");
        try
        {
            overlayResult = mline.overlay(mline2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Difference between partially overlapping simple multi-line shapes...");
        try
        {
            verifyResult(mline.difference(mline2), overlayResult[0]);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println("\n Symmetrical Difference between partially overlapping simple multi-line shapes...");
        try
        {
            verifyResult(mline.symmetricalDifference(mline2),
                         overlayResult[0].union(overlayResult[1]));
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Intersection between partially overlapping simple multi-line shapes...");
        try
        {
            verifyResult(mline.intersect(mline2), overlayResult);
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
                "\n Overlaying partially overlapping polygon shapes...");
        try
        {
            overlayResult = polygon.overlay(polygon2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Difference between partially overlapping polygon shapes...");
        try
        {
            verifyResult(polygon.difference(polygon2), overlayResult[0]);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Symmetrical Difference between partially overlapping polygon shapes...");
        try
        {
            verifyResult(polygon.symmetricalDifference(polygon2),
                         overlayResult[0].union(overlayResult[1]));
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
        ptArray[0] = new SDEPoint(100, 300);
        ptArray[1] = new SDEPoint(300, 100);
        ptArray[2] = new SDEPoint(600, 400);
        ptArray[3] = new SDEPoint(400, 600);
        ptArray[4] = new SDEPoint(200, 500);
        ptArray[5] = new SDEPoint(100, 300);

        try
        {
            polygon = new SeShape(cRef);
            polygon.generatePolygon(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // redefine simple polygon shape 2
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        numPts = 5;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 100);
        ptArray[2] = new SDEPoint(200, 400);
        ptArray[3] = new SDEPoint(100, 400);
        ptArray[4] = new SDEPoint(100, 100);

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
                "\n Overlaying partially overlapping polygon shapes...");
        try
        {
            overlayResult = polygon.overlay(polygon2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Difference between partially overlapping polygon shapes...");
        try
        {
            verifyResult(polygon.difference(polygon2), overlayResult[0]);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Symmetrical Difference between partially overlapping polygon shapes...");
        try
        {
            verifyResult(polygon.symmetricalDifference(polygon2),
                         overlayResult[0].union(overlayResult[1]));
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println("\n Overlaying polygon and line shapes...");
        try
        {
            overlayResult = polygon2.overlay(mline2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println("\n Intersection between polygon and line shapes...");
        try
        {
            verifyResult(polygon2.intersect(mline2), overlayResult);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println("\n Overlaying polygon and point shapes...");
        try
        {
            overlayResult = polygon2.overlay(point4);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Intersection between polygon and point shapes...");
        try
        {
            verifyResult(polygon2.intersect(point4), overlayResult);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // redefine simple multi linestring 2
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 2;
        numPts = 4;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);

        ptArray[2] = new SDEPoint(100, 500);
        ptArray[3] = new SDEPoint(200, 400);

        try
        {
            mline2 = new SeShape(cRef);
            mline2.generateSimpleLine(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println("\n Overlaying polygon and multi-line shapes...");
        try
        {
            overlayResult = polygon2.overlay(mline2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }
        // %%% Verify result shapes
        System.out.println(
                "\n Intersection between polygon and multi-line shapes...");
        System.out.println(" Expected result - line shape + point shape");
        try
        {
            verifyResult(polygon2.intersect(mline2), overlayResult);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Overlaying artially overlapping polygon shapes...");
        try
        {
            overlayResult = polygon.overlay(polygon2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Intersection between partially overlapping polygon shapes...");
        try
        {
            verifyResult(polygon.intersect(polygon2), overlayResult);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate a rectangle
        SeExtent extent = new SeExtent(2, 2, 4, 4);
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
        extent = new SeExtent(3, 3, 6, 6);
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

        System.out.println("\n Overlaying partially intersecting rectangles...");
        try
        {
            overlayResult = rectangle.overlay(rectangle2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Difference between partially intersecting rectangles...");
        try
        {
            verifyResult(rectangle.difference(rectangle2), overlayResult[0]);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Symmetrical Difference between partially intersecting rectangles...");
        try
        {
            verifyResult(rectangle.symmetricalDifference(rectangle2),
                         overlayResult[0].union(overlayResult[1]));
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Intersection between partially intersecting rectangles...");
        try
        {
            verifyResult(rectangle.intersect(rectangle2), overlayResult);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // redefine polygon shape 2
        numParts = 3;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 4;
        partOffsets[2] = 8;

        numPts = 12;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(300, 300);
        ptArray[1] = new SDEPoint(400, 100);
        ptArray[2] = new SDEPoint(500, 300);
        ptArray[3] = new SDEPoint(300, 300);

        ptArray[4] = new SDEPoint(600, 600);
        ptArray[5] = new SDEPoint(700, 700);
        ptArray[6] = new SDEPoint(600, 700);
        ptArray[7] = new SDEPoint(600, 600);

        ptArray[8] = new SDEPoint(200, 500);
        ptArray[9] = new SDEPoint(400, 500);
        ptArray[10] = new SDEPoint(300, 700);
        ptArray[11] = new SDEPoint(200, 500);

        try
        {
            polygon2 = new SeShape(cRef);
            polygon2.generatePolygon(numPts, numParts, partOffsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        // Generate rectangle 2
        extent = new SeExtent(400, 200, 600, 800);
        rectangle2 = null;
        try
        {
            rectangle2 = new SeShape(cRef);
            rectangle2.generateRectangle(extent);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println("\n Overlaying rectangle and multi-part polygon...");
        try
        {
            overlayResult = polygon2.overlay(rectangle2);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        System.out.println(
                "\n Intersection between rectangle and multi-part polygon...");
        System.out.println(" Expected result - polygon, line & point shapes");
        try
        {
            verifyResult(polygon2.intersect(rectangle2), overlayResult);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

    } // End main


    /*
     *   Verifies if both shape 1 and shape2 are identical or not
     */
    public static void verifyResult(SeShape shape1, SeShape shape2)
    {

        try
        {
            if (shape1.isEqual(shape2))
            {
                System.out.println("\n\t - OK");
            }
            else
            {
                System.out.println("\n ERROR!!");
                System.out.println("\nExpected");
                Util.getAllCoords(shape2);
                System.out.println("\nObserved");
                Util.getAllCoords(shape1);
            }
        }
        catch (SeException e)
        {
            Util.printError(e);
        }
    } // End method verifyResult


    /*
     *   Compare two arrays of shape objects
     *   Calls verifyResult( method 1 ) in an iterative loop to compare the
     *   shape array.
     *   shape1 - Shape array from SeShape.intersect()
     *   shape2 - Shape array from SeShape.overlay. Elements shape2[2]->... are
     *   compared with the elements of array shape1.
     */
    public static void verifyResult(SeShape[] shape1, SeShape[] shape2)
    {

        // If the shapes do not overlap, SeShape.intersect() returns a null object
        if (shape1 == null)
        {
            shape1 = new SeShape[1];
            try
            {
                shape1[0] = new SeShape(cRef);
                shape1[0].makeNil();
            }
            catch (SeException e)
            {
                Util.printError(e);
            }
        }

        if (shape1.length == (shape2.length - 2))
        {
            for (int i = 0; i < shape1.length; i++)
            {
                verifyResult(shape1[i], shape2[i + 2]);
            }
        }
        else
        {
            System.out.println("\n Shape arrays are different");
        }

        boolean displayShape = false;
        if (displayShape)
        {

            try
            {
                for (int i = 0; i < shape1.length; i++)
                {
                    Util.getAllCoords(shape1[0]);
                }
                System.out.println("\n Result of overlay ");
                for (int i = 0; i < (shape2.length - 2); i++)
                {
                    Util.getAllCoords(shape2[i + 2]);
                }
            }
            catch (SeException e)
            {
                Util.printError(e);
            }
        }
    } // end method verifyResult

} // End ShapeCompareExample.java
