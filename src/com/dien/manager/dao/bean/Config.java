package com.dien.manager.dao.bean;

import java.io.IOException;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

import org.apache.log4j.Logger;
import org.geotools.arcsde.jndi.ArcSDEConnectionFactory;
import org.geotools.arcsde.session.ArcSDEConnectionConfig;
import org.geotools.arcsde.session.ISession;
import org.geotools.arcsde.session.ISessionPool;
import org.geotools.arcsde.session.UnavailableConnectionException;

public class Config {
    private static Logger logger = Logger.getLogger(Config.class);
    //arcsde 的安装路径的bin目录
    private static String sdebin;
    //下载上传文件路径
    private static String outPath;
    //公司描述
    private static String companyDescription;
    //公司logo
    private static String companyLogo;
  //公司网址
    private static String companyUrl;
    private static Map<String, Serializable> properties =null;
    private static ISessionPool sessionPool = null;

    public Config(String server,String instance,String database,String user,String password,int timeOut,int minConn,int maxConn) {
        if (sessionPool == null) {
       // Exists only to defeat instantiation.
        properties = new HashMap<String, Serializable>();
        properties.put(ArcSDEConnectionConfig.SERVER_NAME_PARAM_NAME, server);
        properties.put(ArcSDEConnectionConfig.PORT_NUMBER_PARAM_NAME,Integer.parseInt(instance));
        properties.put(ArcSDEConnectionConfig.INSTANCE_NAME_PARAM_NAME, database);
        properties.put(ArcSDEConnectionConfig.USER_NAME_PARAM_NAME, user);
        properties.put(ArcSDEConnectionConfig.PASSWORD_PARAM_NAME, password);
        properties.put(ArcSDEConnectionConfig.CONNECTION_TIMEOUT_PARAM_NAME, timeOut);
        properties.put(ArcSDEConnectionConfig.MAX_CONNECTIONS_PARAM_NAME, maxConn);
        properties.put(ArcSDEConnectionConfig.MIN_CONNECTIONS_PARAM_NAME, minConn);
        sessionPool = createConnPool();
        }
    }

    public static ISessionPool getSessionPool() {
        if (sessionPool == null) {
            sessionPool = createConnPool();
        }
        //System.out.println("pool count "+sessionPool.getAvailableCount());
        return sessionPool;
    }

    public static ISession getSession() {
        
            try {
                return Config.getSessionPool().getSession();
            } catch (IOException e) {
                logger.error("sde 连接异常,尝试新的连接!");
                e.printStackTrace();
            } catch (UnavailableConnectionException e) {
                logger.error("sde 连接异常,尝试新的连接!");
                e.printStackTrace();
            }
            return null;
 
    }


    public static ISessionPool createConnPool() {
     
        try {
            ArcSDEConnectionFactory factory = new ArcSDEConnectionFactory();
            sessionPool = factory.getInstance(properties);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return sessionPool;
    }

    public static String getSdebin() {
        return sdebin;
    }

    public static void setSdebin(String sdebin) {
        Config.sdebin = sdebin;
    }

    public static String getOutPath() {
        return outPath;
    }

    public static void setOutPath(String outPath) {
        Config.outPath = outPath;
    }

    public static String getCompanyDescription() {
        return companyDescription;
    }

    public static void setCompanyDescription(String companyDescription) {
        Config.companyDescription = companyDescription;
    }

    public static String getCompanyLogo() {
        return companyLogo;
    }

    public static void setCompanyLogo(String companyLogo) {
        Config.companyLogo = companyLogo;
    }

    public static String getCompanyUrl() {
        return companyUrl;
    }

    public static void setCompanyUrl(String companyUrl) {
        Config.companyUrl = companyUrl;
    }

    public static Map<String, Serializable> getProperties() {
        return properties;
    }

    public static void setProperties(Map<String, Serializable> properties) {
        Config.properties = properties;
    }

    public static void setSessionPool(ISessionPool sessionPool) {
        Config.sessionPool = sessionPool;
    }

}
