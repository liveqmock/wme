package com.dien.sde.project;

import javax.xml.crypto.dsig.TransformException;

import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.pe.PeCSTransformations;
import com.esri.sde.sdk.pe.PeFactory;
import com.esri.sde.sdk.pe.PeProjectedCS;
import com.esri.sde.sdk.pe.PeProjectionException;


/**
 * google 的地图投影是102100
 */
public class Transformation {

    public Transformation() {
        // TODO Auto-generated constructor stub
    }

    /**
     * @param args
     * @throws FactoryException
     * @throws NoSuchAuthorityCodeException
     * @throws TransformException
     * @throws MismatchedDimensionException
     * @throws SeException
     * @throws DataSourceException
     */
    public static void main(String[] args) throws  SeException {
        // TODO Auto-generated method stub
        // try {
        // int[] csList = PeFactory.geogcsCodelist();
        // for(int i=0;i<csList.length;i++)
        // {
        // System.out.println(csList[i]);
        // }
        //
        // csList = PeFactory.geogcsCodelist();
        // for(int i=0;i<csList.length;i++)
        // {
        // System.out.println(csList[i]);
        // }
        // PeCoordinateSystem pcs1 = PeFactory.projcs(2382);//(4326);
        //
        // System.out.println(" code = "+ pcs1.getCode());
        // if(pcs1 instanceof PeProjectedCS){
        // System.out.println("投影坐标系");
        // }else if(pcs1 instanceof PeGeographicCS){
        // System.out.println("地理坐标系");
        // }
        //
        //
        // } catch (PeProjectionException e) {
        // e.printStackTrace();
        // }
        //

      

        //SeCoordinateReference seCoordRefSys = new SeCoordinateReference();
        //seCoordRefSys.setCoordSysByID(new SeObjectId(4326));

        // CoordinateReferenceSystem sourceCRS = ArcSDEUtils.findCompatibleCRS(seCoordRefSys);
        //CoordinateReferenceSystem sourceCRS = crsFactory.createCoordinateReferenceSystem("EPSG:4326");
         //CoordinateReferenceSystem sourceCRS = CRS.decode("EPSG:4326");
        //SeCoordinateReference seCoordRefSysTrager = new SeCoordinateReference();
        //seCoordRefSysTrager.setCoordSysByID(new SeObjectId(102100));
        // CoordinateReferenceSystem targetCRS = ArcSDEUtils.findCompatibleCRS(seCoordRefSysTrager);
        //CoordinateReferenceSystem targetCRS = crsFactory.createCoordinateReferenceSystem("EPSG:900913");
        //CoordinateReferenceSystem targetCRS = CRS.decode("EPSG:900913");

        //MathTransform transform = CRS.findMathTransform(sourceCRS, targetCRS, true);

        // Geometry targetGeometry = JTS.transform( sourceGeometry, transform);
        /* Longitude (= x coord) first ! */
        //GeometryFactory geometryFactory = JTSFactoryFinder.getGeometryFactory();

        //Coordinate coord = new Coordinate( 139.955089,16.140194);
        //Coordinate coord = new Coordinate( 15579729.241407279, 1820963.7314154922);
        //Point point = geometryFactory.createPoint(coord);

        //Geometry targetGeometry = JTS.transform(point, transform);
        // Point point = geometryFactory.createPoint(new Coordinate(longitude, latitude));
        // targetCRS = CRS.decode("EPSG:23032");
        // Geometry geometry=null;
        // Geometry target = geometry.transform( targetCRS );

        //System.out.println(targetGeometry);

        //
        // double[] pts = toGeog(12594708.7843,4859418.080035799,102100);
        // System.out.println("x:"+ pts[0] + ";y" + pts[1]);
        toGeog(12594708.7843,4859418.080035799,102113 );
        //12594708.7843, 4859418.080035799
        //toProj(113.140194,39.955089,102113  );

    }

    private static double[] toGeog(double x1, double y1, int fromCSCode) {
        double intArray[] = new double[2];
        try {
            double[] pts = { x1, y1 }; // {682886.72389354,4426738.52914172}西安坐标系下的数值，在山西大同境内
            System.out.println("X:" + pts[0] + ";Y" + pts[1]);
            PeProjectedCS pcs1 = PeFactory.projcs(fromCSCode); // 2382 PePCSDefs.PE_PCS_XIAN_1980_3_DEGREE_GK_111E
            System.out.println(PeCSTransformations.projToGeog(pcs1, 1, pts));
            System.out.println("x:" + pts[0] + ";y" + pts[1]); // 横坐标:113.140194;纵坐标39.955089
            intArray[0] = pts[0];
            intArray[1] = pts[1];
        } catch (PeProjectionException e) {
            e.printStackTrace();
        }
        return intArray;
    }

    private static double[] toProj(double x1, double y1, int toCSCode) {
        double intArray[] = new double[2];
        try {
            double[] pts = { x1, y1 }; // {113.140194,39.955089};
            System.out.println("经度:" + pts[0] + ";纬度" + pts[1]);
            //PeProjectedCS pcs1 = testPeProjectedCS.getGoogleProject();
            PeProjectedCS pcs1 = PeFactory.projcs(toCSCode); //2382
            PeCSTransformations.geogToProj(pcs1, 1, pts);
            System.out.println("X:" + pts[0] + ";Y" + pts[1]); // 682886.723893544 4426738.529141716
            // 误差在小数点后8位附近
            intArray[0] = pts[0];
            intArray[1] = pts[1];
        } catch (PeProjectionException e) {
            e.printStackTrace();
        }
        return intArray;
    }

}
