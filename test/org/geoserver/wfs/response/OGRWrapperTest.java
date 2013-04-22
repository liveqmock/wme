package org.geoserver.wfs.response;

import java.io.IOException;
import java.util.Set;

import junit.framework.TestCase;
import junit.framework.TestResult;

public class OGRWrapperTest extends TestCase {

    private SDEWrapper sde;

    @Override
    public void run(TestResult result) {
        if (!Ogr2OgrTestUtil.isOgrAvailable())
            System.out.println("Skipping ogr2ogr wrapper tests, ogr2ogr could not be found, " + getName());
        else
            super.run(result);
    }
    
    @Override
    protected void setUp() throws Exception {
        sde = new SDEWrapper("192.168.0.113", "5151", "sde", "sde" , "dien", "C:/Program Files/ArcGIS/ArcSDE/ora10gexe/bin");
    }
    
    public void testAvaialable() {
        // kind of a smoke test, since ogr2ogrtestutil uses the same command!
        sde.isAvailable();
    }
    
    public void testFormats() {
        Set<String> formats = sde.getSupportedFormats();
        // well, we can't know which formats ogr was complied with, but at least there will be one, right?
        assertTrue(formats.size() > 0);
    }
    public void testSdeToShp() {
        try {
            sde.shpToSde("", "");
        } catch (IOException e) {
            e.printStackTrace();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
    public void testShpToSde() {
        try {
            sde.sdeToShp("", "gps_point","");
        } catch (IOException e) {
            e.printStackTrace();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
