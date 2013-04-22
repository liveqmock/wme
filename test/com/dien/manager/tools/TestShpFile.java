package com.dien.manager.tools;

import static org.junit.Assert.*;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.regex.Matcher;

import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

public class TestShpFile {

    @BeforeClass
    public static void setUpBeforeClass() throws Exception {
    }

    @Before
    public void setUp() throws Exception {
    }

    @Test
    public void test() {
        // fail("Not yet implemented");

        boolean isTrue = checkShpFileComplete("E:\\ben\\arcgisshp\\市区杂路_polyline.shp");
        System.out.println(isTrue);
    }

    public boolean checkShpFileComplete(String pathAndName) {
        File shpFile = new File(pathAndName);
        shpFile.getParent();
        if (shpFile.isFile()) {
            String fNameAll = shpFile.getName();
            String fName = fNameAll.substring(0, fNameAll.lastIndexOf("."));
            HashMap<String, String> fileList = getShpAllFile(shpFile.getParent(), fName);
            System.out.println(fileList);
            if (fileList.get(".shp") == null) {
                return false;
            } 
            if (fileList.get(".shx") == null) {
                return false;
            } 
            if (fileList.get(".dbf") == null) {
                return false;
            } 
            if (fileList.get(".prj") == null) {
                return false;
            }
            return true;
        } else {
            return false;
        }
    }

    public HashMap<String, String> getShpAllFile(String pathStr, String name) {
        HashMap<String, String> fileList = new HashMap<String, String>();
        File path = new File(pathStr);
        if (path.isDirectory()) {
            File[] filearry = path.listFiles();
            for (File f : filearry) {
                if (f.isFile()) {
                    String fNameAll = f.getName();
                    System.out.println(fNameAll);
                    if (fNameAll.contains(".")) {
                        String fName = fNameAll.substring(0, fNameAll.lastIndexOf("."));
                        String fSuffix = fNameAll.substring(fNameAll.lastIndexOf("."));
                        if (fName.equals(name)) {
                            fileList.put(fSuffix.toLowerCase(), f.getPath());
                        }
                    }

                }
            }
        }
        return fileList;
    }
}
