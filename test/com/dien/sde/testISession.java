package com.dien.sde;

import static org.junit.Assert.fail;

import java.io.IOException;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

import org.geotools.arcsde.jndi.ArcSDEConnectionFactory;
import org.geotools.arcsde.session.ArcSDEConnectionConfig;
import org.geotools.arcsde.session.ISession;
import org.geotools.arcsde.session.ISessionPool;
import org.geotools.arcsde.session.UnavailableConnectionException;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import com.esri.sde.sdk.client.SeTable;
import com.esri.sde.sdk.client.SeTable.SeTableStats;

public class testISession {
    private static  ISessionPool sessionPool = null;
    private static String server;

    private static String instance;

    private static String database;

    private static String user;

    private static String password;
    @BeforeClass
    public static void setUpBeforeClass() throws Exception {
        
        
        server = "192.168.0.178";
        instance = "5151" ;
        database = "sde_db";
        user = "sde";
        password = "sde";
        Map<String, Serializable> properties = new HashMap<String, Serializable>();
        properties.put(ArcSDEConnectionConfig.SERVER_NAME_PARAM_NAME, server);
        properties.put(ArcSDEConnectionConfig.PORT_NUMBER_PARAM_NAME, Integer.parseInt(instance));
        properties.put(ArcSDEConnectionConfig.INSTANCE_NAME_PARAM_NAME, database);
        properties.put(ArcSDEConnectionConfig.USER_NAME_PARAM_NAME, user);
        properties.put(ArcSDEConnectionConfig.PASSWORD_PARAM_NAME, password);
        properties.put(ArcSDEConnectionConfig.CONNECTION_TIMEOUT_PARAM_NAME, 10000);
        properties.put(ArcSDEConnectionConfig.MAX_CONNECTIONS_PARAM_NAME, 100);
        properties.put(ArcSDEConnectionConfig.MIN_CONNECTIONS_PARAM_NAME, 1);
         ArcSDEConnectionFactory factory = new ArcSDEConnectionFactory();
        try {
            sessionPool = factory.getInstance(properties);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Before
    public void setUp() throws Exception {
    }

    @Test
    public void testHashCode() {
        fail("Not yet implemented");
    }

    @Test
    public void testSession() {
        fail("Not yet implemented");
    }

    @Test
    public void testIssue() {
        fail("Not yet implemented");
    }

    @Test
    public void testTestServer() {
        fail("Not yet implemented");
    }

    @Test
    public void testIsClosed() {
        fail("Not yet implemented");
    }

    @Test
    public void testMarkActive() {
        fail("Not yet implemented");
    }

    @Test
    public void testMarkInactive() {
        fail("Not yet implemented");
    }

    @Test
    public void testIsDisposed() {
        fail("Not yet implemented");
    }

    @Test
    public void testGetLayer() {
        fail("Not yet implemented");
    }

    @Test
    public void testGetRasterColumn() {
        fail("Not yet implemented");
    }

    @Test
    public void testGetRasterColumns() {
        fail("Not yet implemented");
    }

    @Test
    public void testGetTable() {
        fail("Not yet implemented");
    }

    @Test
    public void testStartTransaction() {
        fail("Not yet implemented");
    }

    @Test
    public void testCommitTransaction() {
        fail("Not yet implemented");
    }

    @Test
    public void testIsTransactionActive() {
        fail("Not yet implemented");
    }

    @Test
    public void testRollbackTransaction() {
        fail("Not yet implemented");
    }

    @Test
    public void testDispose() {
        fail("Not yet implemented");
    }

    @Test
    public void testToString() {
        fail("Not yet implemented");
    }

    @Test
    public void testDestroy() {
        fail("Not yet implemented");
    }

    @Test
    public void testEqualsObject() {
        fail("Not yet implemented");
    }

    @Test
    public void testGetLayers() {
        fail("Not yet implemented");
    }

    @Test
    public void testGetUser() {
        fail("Not yet implemented");
    }

    @Test
    public void testGetRelease() {
        fail("Not yet implemented");
    }

    @Test
    public void testGetDatabaseName() {
        fail("Not yet implemented");
    }

    @Test
    public void testGetDBMSInfo() {
        fail("Not yet implemented");
    }

    @Test
    public void testCreateSeRegistration() {
        fail("Not yet implemented");
    }

    @Test
    public void testCreateSeTable() {
        fail("Not yet implemented");
    }

    @Test
    public void testCreateSeInsert() {
        fail("Not yet implemented");
    }

    @Test
    public void testCreateSeUpdate() {
        fail("Not yet implemented");
    }

    @Test
    public void testCreateSeDelete() {
        fail("Not yet implemented");
    }

    @Test
    public void testDescribeString() {
        fail("Not yet implemented");
    }

    @Test
    public void testDescribeSeTable() {
        fail("Not yet implemented");
    }

    @Test
    public void testFetchSeQuery() {
        fail("Not yet implemented");
    }

    @Test
    public void testFetchSeQuerySdeRow() {
        fail("Not yet implemented");
    }

    @Test
    public void testCloseSeState() {
        fail("Not yet implemented");
    }

    @Test
    public void testCloseSeStreamOp() {
        fail("Not yet implemented");
    }

    @Test
    public void testCreateState() {
        fail("Not yet implemented");
    }

    @Test
    public void testCreateAndExecuteQuery() {
        fail("Not yet implemented");
    }

    @Test
    public void testCreateChildState() {
        fail("Not yet implemented");
    }

    @Test
    public void testPrepareQuery() {
        fail("Not yet implemented");
    }

    @Test
    public void testTableStats() {
        //fail("Not yet implemented");
        try {
            ISession  session =  sessionPool.getSession();
            SeTableStats  stats = session.tableStats("poi", "OBJECTID", SeTable.SeTableStats.SE_ALL_STATS);
            System.out.println("table count :"+stats.getCount());
        } catch (IOException e) {
            e.printStackTrace();
        } catch (UnavailableConnectionException e) {
            e.printStackTrace();
        }
        
    }

}
