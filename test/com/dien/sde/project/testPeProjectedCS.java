package com.dien.sde.project;

import com.esri.sde.sdk.pe.PeProjectedCS;
import com.esri.sde.sdk.pe.PeProjectionException;

public class testPeProjectedCS {

    public testPeProjectedCS() {
        // TODO Auto-generated constructor stub
    }

    /**
     * @param args
     */
    public static void main(String[] args) {
        try {
            String str = new String(
                    "PROJCS[\"WGS84 / Simple Mercator\", GEOGCS[\"WGS 84\","
                            + "DATUM[\"WGS_1984\", SPHEROID[\"WGS_1984\", 6378137.0, 298.257223563]],"
                            + "PRIMEM[\"Greenwich\", 0.0], UNIT[\"degree\", 0.017453292519943295],"
                            + "AXIS[\"Longitude\", EAST], AXIS[\"Latitude\", NORTH]],"
                            + "PROJECTION[\"Mercator_1SP_Google\"],"
                            + "PARAMETER[\"latitude_of_origin\", 0.0], PARAMETER[\"central_meridian\", 0.0], "
                            + "PARAMETER[\"scale_factor\", 1.0], PARAMETER[\"false_easting\", 0.0], "
                            + "PARAMETER[\"false_northing\", 0.0], UNIT[\"m\", 1.0], AXIS[\"x\", EAST],"
                            + "AXIS[\"y\", NORTH], AUTHORITY[\"EPSG\",\"900913\"]]");

            PeProjectedCS cs = new PeProjectedCS(str);
        } catch (PeProjectionException e) {
            e.printStackTrace();
        }
    }

    public static PeProjectedCS getGoogleProject(){
        try {
            String str = new String(
                    "PROJCS[\"WGS84 / Simple Mercator\", GEOGCS[\"WGS 84\","
                            + "DATUM[\"WGS_1984\", SPHEROID[\"WGS_1984\", 6378137.0, 298.257223563]],"
                            + "PRIMEM[\"Greenwich\", 0.0], UNIT[\"degree\", 0.017453292519943295],"
                            + "AXIS[\"Longitude\", EAST], AXIS[\"Latitude\", NORTH]],"
                            + "PROJECTION[\"Mercator_1SP_Google\"],"
                            + "PARAMETER[\"latitude_of_origin\", 0.0], PARAMETER[\"central_meridian\", 0.0], "
                            + "PARAMETER[\"scale_factor\", 1.0], PARAMETER[\"false_easting\", 0.0], "
                            + "PARAMETER[\"false_northing\", 0.0], UNIT[\"m\", 1.0], AXIS[\"x\", EAST],"
                            + "AXIS[\"y\", NORTH], AUTHORITY[\"EPSG\",\"900913\"]]");

            return new PeProjectedCS(str);
        } catch (PeProjectionException e) {
            e.printStackTrace();
        }
        return null;
    }
}
