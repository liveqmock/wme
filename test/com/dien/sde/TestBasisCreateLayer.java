package com.dien.sde;

import static org.junit.Assert.*;

import java.io.IOException;
import java.util.List;

import net.sf.json.JSONObject;

import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import com.dien.manager.dao.bean.Config;
import com.dien.manager.tools.Basis;
import com.esri.sde.sdk.client.SeException;

public class TestBasisCreateLayer {
    private static Basis basis;

    @BeforeClass
    public static void setUpBeforeClass() throws Exception {
        new Config("192.168.0.178", "5151", "sde_db", "sde", "sde", 1000, 1, 5);

        basis = new Basis();
    }

    @Before
    public void setUp() throws Exception {

    }

    @Test
    public void testCreateLayerStringListIntInt() {
        // fail("Not yet implemented");
        JSONObject layerJSON = JSONObject
                .fromObject("{\"layername\":\"2323\",\"wkid\":4326,\"shapetype\":\"2\",\"fields\":[{\"id\":4,\"name\":\"J\",\"type\":5},{\"id\":5,\"name\":\"K\",\"type\":5},{\"id\":6,\"name\":\"今天星期几我们今天星期星期星期\",\"type\":5}]}");
        String layername = layerJSON.getString("layername");
        List columns = layerJSON.getJSONArray("fields");
        int wkid = layerJSON.getInt("wkid");
        int shapeType = layerJSON.getInt("shapetype");

        String tableName = basis.generatorTableName(layername);
        try {
            basis.createLayer(tableName, layername, columns, wkid, shapeType);
        } catch (SeException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

}
