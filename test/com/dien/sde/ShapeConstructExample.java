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
 * Purpose: Demonstrates functionality of various shape add/delete parts/paths methods.
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


final class ShapeConstructExample
{

    SeExtent ext2 = new SeExtent();


    public static void main(String[] args)
    {
        try
        {
            SeExtent ext = new SeExtent( -1000.0, -1000.0, +1000.0, +1000.0);
            SeCoordinateReference cr = new SeCoordinateReference();

            cr.setXYByEnvelope(ext);

            SeShape s = new SeShape(cr);

            ShapeConstructExample qa = new ShapeConstructExample();
            ShapeConstructExample.ControlShape gs = qa.new ControlShape(s);

            SeShape shpclone = null;

            //addIsland().

            System.out.print("\naddIsland()... \n");
            gs.sp2dPolygon();

            try
            {
                shpclone = (SeShape) s.clone();
            }
            catch (CloneNotSupportedException ce)
            {
                ce.printStackTrace();
            }

            s.addIsland(new SDEPoint[]
                        {new SDEPoint(2.0, 2.0),
                        new SDEPoint(4.0, 2.0),
                        new SDEPoint(4.0, 4.0),
                        new SDEPoint(2.0, 4.0),
                        new SDEPoint(2.0, 2.0)});
            qa.printShapeInfo(shpclone, s);

            //deleteIsland().

            System.out.print("\ndeleteIsland()... \n");

            try
            {
                shpclone = (SeShape) s.clone();
            }
            catch (CloneNotSupportedException ce)
            {
                ce.printStackTrace();
            }

            s.deleteIsland(new SDEPoint(2.0, 2.0));
            qa.printShapeInfo(shpclone, s);

            //addPart().

            System.out.print("\naddPart()... \n");
            SeShape newshp = new SeShape(cr);
            newshp.generatePolygon(5, 1, null, new SDEPoint[]
                                   {new SDEPoint(12.0, 12.0),
                                   new SDEPoint(14.0, 12.0),
                                   new SDEPoint(14.0, 14.0),
                                   new SDEPoint(12.0, 14.0),
                                   new SDEPoint(12.0, 12.0)});
            try
            {
                shpclone = (SeShape) newshp.clone();
            }
            catch (CloneNotSupportedException ce)
            {
                ce.printStackTrace();
            }

            newshp.addPart(s);
            qa.printShapeInfo(shpclone, newshp);

            //deletePart().

            System.out.print("\ndeletePart()... \n");

            try
            {
                shpclone = (SeShape) newshp.clone();
            }
            catch (CloneNotSupportedException ce)
            {
                ce.printStackTrace();
            }

            newshp.deletePart(2);
            qa.printShapeInfo(shpclone, newshp);

            //insertPart().

            System.out.print("\ninsertPart()... \n");
            newshp = new SeShape(cr);
            newshp.generatePolygon(5, 1, null, new SDEPoint[]
                                   {new SDEPoint(12.0, 12.0),
                                   new SDEPoint(14.0, 12.0),
                                   new SDEPoint(14.0, 14.0),
                                   new SDEPoint(12.0, 14.0),
                                   new SDEPoint(12.0, 12.0)});

            try
            {
                shpclone = (SeShape) s.clone();
            }
            catch (CloneNotSupportedException ce)
            {
                ce.printStackTrace();
            }

            s.insertPart(1, newshp);
            qa.printShapeInfo(shpclone, s);

            //changePath().

            System.out.print("\nchangePath()... \n");
            newshp.generatePolygon(7, 1, null, new SDEPoint[]
                                   {new SDEPoint(600.0, 600.0),
                                   new SDEPoint(700.0, 600.0),
                                   new SDEPoint(700.0, 250.0),
                                   new SDEPoint(700.0, 500.0),
                                   new SDEPoint(650.0, 500.0),
                                   new SDEPoint(600.0, 500.0),
                                   new SDEPoint(600.0, 600.0)});

            try
            {
                shpclone = (SeShape) newshp.clone();
            }
            catch (CloneNotSupportedException ce)
            {
                ce.printStackTrace();
            }

            SDEPoint firstpt = new SDEPoint(700.0, 600.0);
            SDEPoint midpt = new SDEPoint(700.0, 500.0);
            SDEPoint lastpt = new SDEPoint(600.0, 500.0);
            SDEPoint[] pointlist = new SDEPoint[]
                                   {
                                   new SDEPoint(700.0, 600.0),
                                   new SDEPoint(750.0, 250.0),
                                   new SDEPoint(725.0, 275.9),
                                   new SDEPoint(700.0, 500.0),
                                   new SDEPoint(680.0, 575.0),
                                   new SDEPoint(650.0, 550.0),
                                   new SDEPoint(600.0, 500.0)};
            try
            {

                System.out.print("\nchangePath(), pointlist is null ... \n");

                newshp.changePath(firstpt, midpt, lastpt, null);
                qa.printShapeInfo(shpclone, newshp);

                newshp.generatePolygon(7, 1, null, new SDEPoint[]
                                       {new SDEPoint(600.0, 600.0),
                                       new SDEPoint(700.0, 600.0),
                                       new SDEPoint(700.0, 250.0),
                                       new SDEPoint(700.0, 500.0),
                                       new SDEPoint(650.0, 500.0),
                                       new SDEPoint(600.0, 500.0),
                                       new SDEPoint(600.0, 600.0)});

                System.out.print("\nchangePath(), pointlist is not null ... \n");

                newshp.changePath(firstpt, midpt, lastpt, pointlist);
                qa.printShapeInfo(shpclone, newshp);
                /*
                     System.out.print("\nchangePath(), midpt is null ... \n");
                     newshp.generatePolygon(7, 1, null, new SDEPoint[]
                 {new SDEPoint(600.0,600.0),
                 new SDEPoint(700.0,600.0),
                 new SDEPoint(700.0, 250.0),
                 new SDEPoint(700.0,500.0),
                                                   new SDEPoint(650.0,500,0),
                 new SDEPoint(600.0,500.0),
                                                   new SDEPoint(600.0,600.0)});
                     newshp.changePath(firstpt, null, lastpt, pointlist);
                     qa.printShapeInfo(shpclone, newshp);

                 System.out.print("\nchangePath(), midpt and pointlist are null ... \n");
                     newshp.generatePolygon(7, 1, null, new SDEPoint[]
                 {new SDEPoint(600.0,600.0),
                 new SDEPoint(700.0,600.0),
                 new SDEPoint(700.0, 250.0),
                 new SDEPoint(700.0,500.0),
                                                   new SDEPoint(650.0,500,0),
                 new SDEPoint(600.0,500.0),
                                                   new SDEPoint(600.0,600.0)});
                     newshp.changePath(firstpt, null, lastpt, null);
                     qa.printShapeInfo(shpclone, newshp);
                 */

            }
            catch (SeException se)
            {
                Util.printError(se);
            }

//deletePath().

            System.out.print("\ndeletePath()... \n");

            try
            {
                shpclone = (SeShape) newshp.clone();
            }
            catch (CloneNotSupportedException ce)
            {
                ce.printStackTrace();
            }

            try
            {
                newshp.deletePath(firstpt, midpt, lastpt);
                qa.printShapeInfo(shpclone, newshp);
            }
            catch (SeException se)
            {
                Util.printError(se);
            }

//extendLine().

            System.out.print("\nextendLine()... \n");
            gs.sp2dLine();

            newshp.generateLine(3, 1, null, new SDEPoint[]
                                {new SDEPoint(0.0, 0.0),
                                new SDEPoint(1.0, 2.0),
                                new SDEPoint(1.0, 3.0)});

            shpclone = null;
            try
            {
                shpclone = (SeShape) newshp.clone();
            }
            catch (CloneNotSupportedException ce)
            {
                ce.printStackTrace();
            }

            SDEPoint endpt = new SDEPoint(1.0, 3.0);
            pointlist = new SDEPoint[]
                        {
                        new SDEPoint(1.0, 4.0),
                        new SDEPoint(1.0, 5.0),
                        new SDEPoint(1.0, 6.0)};
            newshp.extendLine(endpt, pointlist);
            qa.printShapeInfo(shpclone, newshp);

//deletePoint().
            System.out.print("\ndeletePoint... \n");
            shpclone = null;
            try
            {
                shpclone = (SeShape) newshp.clone();
            }
            catch (CloneNotSupportedException ce)
            {
                ce.printStackTrace();
            }

            newshp.deletePoint(new SDEPoint(1.0, 3.0));
            qa.printShapeInfo(shpclone, newshp);

//movePoint().

            System.out.print("\nmovePoint... \n");

            shpclone = null;
            try
            {
                shpclone = (SeShape) s.clone();
            }
            catch (CloneNotSupportedException ce)
            {
                ce.printStackTrace();
            }

            SDEPoint frompt = new SDEPoint(1.0, 3.0);
            SDEPoint topt = new SDEPoint(1.0, 6.0);
            s.movePoint(frompt, topt);
            qa.printShapeInfo(shpclone, s);

//replacePart().

            System.out.print("\nreplacePart... \n");
            gs.mp2dPoint();
            newshp.generatePoint(1, new SDEPoint[]
                                 {new SDEPoint(2.0, 2.0)});

            s.replacePart(2, newshp);
            qa.printShapeInfo(s, newshp);

//replacePathWithArc().

            SeCoordinateReference arccoord = new SeCoordinateReference();
            arccoord.setXY(3000, 3000, 100);

            SeShape arcshape = new SeShape(arccoord);

            System.out.print("\nreplacePathWithArc()... \n");
            arcshape.generateLine(4, 1, null, new SDEPoint[]
                                  {new SDEPoint(586527.56, 4125700.75),
                                  new SDEPoint(592068.46, 4131241.66),
                                  new SDEPoint(602707.00, 4131241.66),
                                  new SDEPoint(609134.44, 4125700.75)});

            shpclone = null;
            try
            {
                shpclone = (SeShape) arcshape.clone();
            }
            catch (CloneNotSupportedException ce)
            {
                ce.printStackTrace();
            }

            firstpt = new SDEPoint(592068.46, 4131241.66);
            lastpt = new SDEPoint(602707.00, 4131241.66);
            double radius = 10000.0;
            int arcsegs = 360;

            try
            {
                arcshape.replacePathWithArc(firstpt, null, lastpt, radius,
                                            arcsegs);
                qa.printShapeInfo(shpclone, arcshape);

            }
            catch (SeException se)
            {
                Util.printError(se);
            }

        }
        catch (SeException e)
        {
            Util.printError(e);
        }

    } // End main.


    /*
     * Prints out the input parameters.
     */
    private void printShapeInfo(int type, boolean ispolygon, int numparts,
                                int numsubparts, int numpts, double area,
                                double length)
    {
        System.out.println("\nExpected shape info:");
        System.out.println("type         = " + type);
        System.out.println("ispolygon    = " + ispolygon);
        System.out.println("num.parts    = " + numparts);
        System.out.println("num.subparts = " + numsubparts);
        System.out.println("num.points   = " + numpts);
        System.out.println("area         = " + area);
        System.out.println("length       = " + length);
    }

    /*
     * Prints out the type, isPolygon, numParts, numSubParts, numPoints,
     * area & length of the shape passed in.
     */
    private void printShapeInfo(SeShape s)
    {
        try
        {
            if (s.isNil())
            {
                System.out.println("\n NULL Shape was returned\n");
                return;
            }
            System.out.println("\nActual shape info:");
            System.out.println("type         = " + s.getType());
            System.out.println("ispolygon    = " + s.isPolygon());
            System.out.println("num.parts    = " + s.getNumParts());
            System.out.println("num.subparts = " + s.getNumSubParts(0));
            System.out.println("num.points   = " + s.getNumOfPoints());
            System.out.println("area         = " + s.getArea());
            System.out.println("length       = " + s.getLength());
            System.out.println("\n");

        }
        catch (SeException se)
        {
            Util.printError(se);
        }

    }

    private void printShapeInfo(SeShape s1, SeShape s2)
    {
        try
        {
            if (s1.isNil() || s2.isNil())
            {
                System.out.println("\n   NULL Shape was returned\n");
                return;
            }
            System.out.println("\nOriginal shape info:");
            System.out.println("type         = " + s1.getType());
            System.out.println("ispolygon    = " + s1.isPolygon());
            System.out.println("num.parts    = " + s1.getNumParts());
            System.out.println("num.subparts = " + s1.getNumSubParts(0));
            System.out.println("num.points   = " + s1.getNumOfPoints());
            System.out.println("area         = " + s1.getArea());
            System.out.println("length       = " + s1.getLength());

            System.out.println("\nResult shape info:");
            System.out.println("type         = " + s2.getType());
            System.out.println("ispolygon    = " + s2.isPolygon());
            System.out.println("num.parts    = " + s2.getNumParts());
            System.out.println("num.subparts = " + s2.getNumSubParts(0));
            System.out.println("num.points   = " + s2.getNumOfPoints());
            System.out.println("area         = " + s2.getArea());
            System.out.println("length       = " + s2.getLength());
            System.out.println("\n");
        }
        catch (SeException se)
        {
            Util.printError(se);
        }

    }

    /*
     * Inner class ControlShape
     */
    private class ControlShape
    {
        private SeShape gs = null;
        private String gsExtent = "";
        private boolean gsIsPolygon = false;
        private int gsShapeType = 0;
        private int gsPartCount = 0;
        private int gsSubPartCount = 0;
        private int gsPointCount = 0;
        private double gsArea = 0.0;
        private double gsLength = 0.0;

        public ControlShape(SeShape s)
        {
            this.gs = s;
        }

        /*
         *   Alters the sub-class variable gs.
         *   Sets its shapetype to polygon.
         *   Values of extent, area, length,etc are all hard coded.
         */
        private SeShape sp2dPolygon()
                throws SeException
        {
            this.gsShapeType = 8;
            this.gsIsPolygon = true;
            this.gsExtent = "(4.6566128730773926E-7,4.6566128730773926E-7,9.000000090803951,9.000000090803951)";
            this.gsArea = 80.99999325256807;
            this.gsLength = 35.999998500570655;
            this.gsPartCount = 1;
            this.gsSubPartCount = 1;
            this.gsPointCount = 5;

            try
            {
                gs.generatePolygon(5, 1, null, new SDEPoint[]
                                   {new SDEPoint(0.0, 0.0),
                                   new SDEPoint(9.0, 0.0),
                                   new SDEPoint(9.0, 9.0),
                                   new SDEPoint(0.0, 9.0),
                                   new SDEPoint(0.0, 0.0)});
            }
            catch (SeException e)
            {
                System.out.println("\nCannot generate Shape" + e);
                gs.makeNil();
            }
            return gs;
        }

        public SeShape sp2dLine()
                throws SeException
        {
            this.gsShapeType = 2;
            this.gsIsPolygon = false;
            this.gsExtent = "(4.6566128730773926E-7,4.6566128730773926E-7,0.9999996996484697,3.0000000302679837)";
            this.gsArea = 0.0;
            this.gsLength = 3.236067262953087;
            this.gsPartCount = 1;
            this.gsSubPartCount = 1;
            this.gsPointCount = 3;

            try
            {
                gs.generateLine(3, 1, null, new SDEPoint[]
                                {new SDEPoint(0.0, 0.0),
                                new SDEPoint(1.0, 2.0),
                                new SDEPoint(1.0, 3.0)});
            }
            catch (SeException e)
            {
                System.out.println("\nCannot generate Shape :" + e);
                gs.makeNil();
            }
            return gs;
        }

        public SeShape mp2dPoint()
                throws SeException
        {
            this.gsShapeType = 257;
            this.gsIsPolygon = false;
            this.gsExtent = "(-10.000000256113708,-10.000000256113708,0.9999996996484697,0.9999996996484697)";
            this.gsArea = 0.0;
            this.gsLength = 0.0;
            this.gsPartCount = 3;
            this.gsSubPartCount = 3;
            this.gsPointCount = 3;

            try
            {
                gs.generatePoint(3, new SDEPoint[]
                                 {new SDEPoint(0.0, 0.0),
                                 new SDEPoint(1.0, 1.0),
                                 new SDEPoint( -10.0, -10.0)});
            }
            catch (SeException e)
            {
                System.out.println("\nCannot generate Shape" + e);
                gs.makeNil();
            }
            return gs;
        }


    }
}
