package com.dien.sde;

import java.io.IOException;
import java.util.HashMap;

import org.junit.Before;

import com.dien.manager.dao.bean.Config;
import com.dien.manager.tools.Basis;
import com.esri.sde.sdk.client.SeException;

import net.sf.json.JSONObject;

public class testJSON {

    /**
     * @param args
     */
    public static void main(String[] args) {
        // TODO Auto-generated method stub
        JSONObject obj = JSONObject
                .fromObject("{\"geometry\":{\"type\":\"extent\",\"xmin\":116.43173506633161,\"ymin\":39.92667478749704,\"xmax\":116.50631383558142,\"ymax\":40.020103135788,\"attributes\":{\"userid\":\"1\",\"serviceid\":\"141\",\"servicename\":\"abc\",\"usertype\":\"user\"}}}");
        System.out.println(obj.get("geometry"));
        

       new Config("192.168.0.178", "5151", "sde_db", "sde", "sde",1000,1,5);

       Basis basis = new Basis();
        
        HashMap<String,String> aliasList = basis.getLayerAliasList("GDB_ITEMS");
        //basis.queryLayerDescriptionTable2("GDB_ITEMS");
        System.out.println(aliasList);
        try {
            System.out.println(basis.queryLayerDescriptionTable2("GDB_ITEMS").toString());
        } catch (IOException e) {
            e.printStackTrace();
        } catch (SeException e) {
            e.printStackTrace();
        }
    }

}
