package org.geotools.arcsde.session;

import static org.junit.Assert.fail;

import java.io.IOException;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

import org.geotools.arcsde.jndi.ArcSDEConnectionFactory;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import com.dien.manager.dao.bean.Config;
import com.dien.manager.tools.Basis;

public class TestPool {
    private ArcSDEConnectionFactory factory;
    Basis basis;
    @BeforeClass
    public static void setUpBeforeClass() throws Exception {

    }

    @Before
    public void setUp() throws Exception {
        factory = new ArcSDEConnectionFactory();
        factory.setClosableSessionPoolFactory(new MockSessionPoolFactory());
        new Config("192.168.0.178", "5151", "sde_db", "sde", "sde",1000,10,1);

        basis = new Basis();
    }

    @Test
    public void test() {
        fail("Not yet implemented");
        
        Map<String, Serializable> properties = new HashMap<String, Serializable>();
        properties.put(ArcSDEConnectionConfig.SERVER_NAME_PARAM_NAME, "192.168.0.178");
        properties.put(ArcSDEConnectionConfig.PORT_NUMBER_PARAM_NAME,5151);
        properties.put(ArcSDEConnectionConfig.INSTANCE_NAME_PARAM_NAME, "sde_db");
        properties.put(ArcSDEConnectionConfig.USER_NAME_PARAM_NAME, "sde");
        properties.put(ArcSDEConnectionConfig.PASSWORD_PARAM_NAME, "sde");
        properties.put(ArcSDEConnectionConfig.CONNECTION_TIMEOUT_PARAM_NAME, 10000);
        properties.put(ArcSDEConnectionConfig.MAX_CONNECTIONS_PARAM_NAME, 10);
        properties.put(ArcSDEConnectionConfig.MIN_CONNECTIONS_PARAM_NAME, 1);
        try {
            ArcSDEConnectionFactory factory = new ArcSDEConnectionFactory();
            ISessionPool sessionPool = factory.getInstance(properties);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    private static class MockSessionPoolFactory implements ISessionPoolFactory {

        public ISessionPool createPool(ArcSDEConnectionConfig config) throws IOException {
            return new MockSessionPool(config);
        }
    }
    private static class MockSessionPool implements ISessionPool {

        private ArcSDEConnectionConfig config;

        public MockSessionPool(ArcSDEConnectionConfig config) {
            this.config = config;
        }

        public ArcSDEConnectionConfig getConfig() {
            return config;
        }

        public void close() {
        }

        public int getAvailableCount() {
            return 0;
        }

        public int getInUseCount() {
            return 0;
        }

        public int getPoolSize() {
            return 0;
        }

        public ISession getSession() throws IOException, UnavailableConnectionException {
            return null;
        }

        public ISession getSession(boolean transactional) throws IOException,
                UnavailableConnectionException {
            return null;
        }

        public boolean isClosed() {
            return false;
        }
    }
}
