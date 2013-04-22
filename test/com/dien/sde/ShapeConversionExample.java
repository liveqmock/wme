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
 * Purpose: Demonstrates conversion between different shape types
 * This Java sample demonstrates usage of ArcSDE API. It will not execute successfully until the user
 * supplies valid ArcSDE Server details such as server name, port number, database name, user, pwd, and valid
 * data, if required.
 *
 *------------------------------------------------------------------------------
 *   Four shapes are generated in this test program:
 *
 *   Shape1 : A simple polygon shape
 *   { (100,100), (200,200), (300,100), (400,400), ( 200,300), (100,100) }
 *   - Generated as a multi-point shape, converted into line and polygon shapes
 *   then converted from line and polygon to the other shape types.
 *
 *   Shape 2 : A self-intersecting line shape
 *   { (300,100), (500,100), (300,300), (500,300), (300,100) }
 *   - Generated as a line shape.
 *
 *   Shape 3 : A 2-part polygon shape
 *   { (200,300), (300,100), (400,200), (400,300), (300,300), (200,300)
 *     (600,300), (800,200), (700,300), (600,300) }
 *   - Generated as a polygon shape and converted into the other two shapes.
 *
 *   Shape 4 : A single part polygon with a donut hole
 *   { (300,100), (500,200), (700,700), (400,600), (200,500), (300,100)
 *     (400,200), (500,300), (500,500), (400,400), (400,200) }
 *   - Generated as a polygon shape and converted into the other two shapes.
 *
 * Usage: java ShapeConversionExample
 *
 **************************************************************************/

package com.dien.sde;

import com.esri.sde.sdk.client.SDEPoint;
import com.esri.sde.sdk.client.SeCoordinateReference;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeShape;


public class ShapeConversionExample
{
    private SeCoordinateReference cRef = null;

    /**
     * Invokes the constructor.
     */
    public static void main(String[] args)
    {

        try
        {
            ShapeConversionExample testCast = new ShapeConversionExample(args);
        }
        catch (SeException e)
        {
            e.printStackTrace();
        }

    } // End main


    /**
     * This constructor starts the test.
     * @param args the command line arguments
     */
    public ShapeConversionExample(String[] args)
            throws SeException
    {

        /*
         *   Create common coordinate reference to use for all the shapes
         */
        String desc = "GEOGCS[\"TempGeogCS\"," +
                      "DATUM[\"D_Accra\",SPHEROID[\"War_Office\",6378300.0,296.0]],PRIMEM[\"Stockholm\",18.05827777777778]," +
                      "UNIT[\"Degree\",0.0174532925199433]]";
        cRef = new SeCoordinateReference();
        cRef.setCoordSysByDescription(desc);
        cRef.setXY(0.0, 0.0, 1000.0);

        /*
         *   Shape1 : A simple polygon shape
         *   { (100,100), (200,200), (300,100), (400,400), ( 200,300), (100,100) }
         */
        int numPts = 6;
        SDEPoint[] ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(100, 100);
        ptArray[1] = new SDEPoint(200, 200);
        ptArray[2] = new SDEPoint(300, 100);
        ptArray[3] = new SDEPoint(400, 400);
        ptArray[4] = new SDEPoint(200, 300);
        ptArray[5] = new SDEPoint(100, 100);

        SeShape point = null;
        SeShape controlLine = null;
        SeShape controlPoly = null;
        System.out.println(
                "\n--> Generating shape one as a multi-point shape...");
        try
        {
            point = new SeShape(cRef);
            point.generatePoint(numPts, ptArray);
            int[] offsets = new int[1];
            offsets[0] = 0;
            controlLine = new SeShape(cRef);
            controlLine.generateSimpleLine(numPts, 1, offsets, ptArray);
            controlPoly = new SeShape(cRef);
            controlPoly.generatePolygon(numPts, 1, offsets, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        /*
         *   Convert the multipoint shape into other shapes
         */
        try
        {
            System.out.println("\n Multi-point -> simple line shape:");
            SeShape sline = point.asSimpleLine();
            verifyConversion(sline, controlLine);
            System.out.println("\n line --> multi-point:");
            verifyConversion(sline.asPoint(), point);

            System.out.println("\n Multi-Point -> polygon shape:");
            SeShape poly = point.asPolygon();
            verifyConversion(poly, controlPoly);
            System.out.println("\n Polygon --> multi-point:");
            verifyConversion(poly.asPoint(), point);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        /*
         *   Shape 2 : A self-intersecting line.
         *   { (300,100), (500,100), (300,300), (500,300), (300,100) }
         */
        int numParts = 1;
        int[] partOffsets = new int[numParts];
        partOffsets[0] = 0;
        numPts = 5;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(300, 100);
        ptArray[1] = new SDEPoint(500, 100);
        ptArray[2] = new SDEPoint(300, 300);
        ptArray[3] = new SDEPoint(500, 300);
        ptArray[4] = new SDEPoint(300, 100);

        SeShape line = null;
        SeShape controlPoint = null;
        System.out.println("\n-->  Generating shape two as a line shape...");
        try
        {
            line = new SeShape(cRef);
            line.generateLine(numPts, numParts, partOffsets, ptArray);
            controlPoint = new SeShape(cRef);
            controlPoint.generatePoint(numPts, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        /*
         *   Convert the line shape into other shapes
         */
        try
        {
            System.out.println("\n Line -> point shape:");
            SeShape pointShp = line.asPoint();
            verifyConversion(pointShp, controlPoint);
            System.out.println("\n Point shape --> line shape");
            verifyConversion(pointShp.asLine(), line);

        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        /*
         *   Shape 3 : A 2-part polygon shape
         *   { (200,300), (300,100), (400,200), (400,300), (300,300), (200,300)
         *     (600,300), (800,200), (700,300), (600,300) }
         */
        numParts = 2;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        partOffsets[1] = 6;
        numPts = 10;
        ptArray = new SDEPoint[numPts];

        ptArray[0] = new SDEPoint(200, 300);
        ptArray[1] = new SDEPoint(300, 100);
        ptArray[2] = new SDEPoint(400, 200);
        ptArray[3] = new SDEPoint(400, 300);
        ptArray[4] = new SDEPoint(300, 300);
        ptArray[5] = new SDEPoint(200, 300);

        // part 2
        ptArray[6] = new SDEPoint(600, 300);
        ptArray[7] = new SDEPoint(800, 200);
        ptArray[8] = new SDEPoint(700, 300);
        ptArray[9] = new SDEPoint(600, 300);

        SeShape polygon = null;
        System.out.println(
                "\n-->  Generating shape three as a 2-part polygon...");
        try
        {
            polygon = new SeShape(cRef);
            polygon.generatePolygon(numPts, numParts, partOffsets, ptArray);
            controlLine = new SeShape(cRef);
            controlLine.generateSimpleLine(numPts, numParts, partOffsets,
                                           ptArray);
            controlPoint = new SeShape(cRef);
            controlPoint.generatePoint(numPts, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        /*
         *   Convert the polygon shape into other shapes
         */
        try
        {
            System.out.println("\n 2-part Polygon -> simple line shape:");
            SeShape sline = polygon.asSimpleLine();
            verifyConversion(sline, controlLine);

            System.out.println("\n Simple line --> polygon");
            verifyConversion(sline.asPolygon(), polygon);

            System.out.println("\n 2-part Polygon -> point shape:");
            verifyConversion(polygon.asPoint(), controlPoint);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        /*
         *   Shape 4 : A single part polygon with a donut hole
         *   { (300,100), (500,200), (700,700), (400,600), (200,500), (300,100)
         *     (400,200), (500,300), (500,500), (400,400), (400,200) }
         */
        numParts = 1;
        partOffsets = new int[numParts];
        partOffsets[0] = 0;
        numPts = 11;
        ptArray = new SDEPoint[numPts];
        ptArray[0] = new SDEPoint(300, 100);
        ptArray[1] = new SDEPoint(500, 200);
        ptArray[2] = new SDEPoint(700, 700);
        ptArray[3] = new SDEPoint(400, 600);
        ptArray[4] = new SDEPoint(200, 500);
        ptArray[5] = new SDEPoint(300, 100);
        // donut Hole
        ptArray[6] = new SDEPoint(400, 200);
        ptArray[7] = new SDEPoint(400, 400);
        ptArray[8] = new SDEPoint(500, 500);
        ptArray[9] = new SDEPoint(500, 300);
        ptArray[10] = new SDEPoint(400, 200);

        System.out.println(
                "\n--> Generating shape four as a single part polygon...");
        try
        {
            polygon = new SeShape(cRef);
            polygon.generatePolygon(numPts, numParts, partOffsets, ptArray);
            controlLine = new SeShape(cRef);
            numParts = 2;
            partOffsets = new int[numParts];
            partOffsets[0] = 0;
            partOffsets[1] = 6;
            controlLine.generateSimpleLine(numPts, numParts, partOffsets,
                                           ptArray);
            controlPoint = new SeShape(cRef);
            controlPoint.generatePoint(numPts, ptArray);
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

        /*
         *   Convert the polygon shape into other shapes
         */
        try
        {
            System.out.println("\n Polygon -> simple line shape:");
            SeShape sline = polygon.asSimpleLine();
            verifyConversion(sline, controlLine);

            System.out.println("\n Line --> polygon..");

            System.out.println("\n Polygon -> point shape:");
            SeShape pointShp = polygon.asPoint();
            verifyConversion(pointShp, controlPoint);
            System.out.println("\n Point --> polygon..");

            System.out.println("\n Done..");
        }
        catch (SeException e)
        {
            Util.printError(e);
        }

    } // End constructor


    /**
     *   Verifies if both shape1 and shape2 are identical or not
     *
     *   @param shape1 handle to first shape object.
     *   @param shape2 handle to second shape object.
     */
    public void verifyConversion(SeShape shape1, SeShape shape2)
    {

        try
        {
            if (shape1.isEqual(shape2))
            {
                System.out.println("\n\t Conversion success!");
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
    } // End method verifyConversion

} // End ShapeConversionExample
