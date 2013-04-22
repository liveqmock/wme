/*
 * 项目:GIS公共服务平台-运维平台-系统监控
 * 文件名称: LoggerUtil.java
 * 创建时间: 2011-9-15 上午10:47:51
 * 创建人: Administrator
 */
package com.dien.manager.util;

import java.util.Date;

import org.apache.log4j.Logger;

import com.dien.manager.dao.bean.RequestLog;

/**
 * 服务日志工具,用于记录需要入库的日志规则
 * 
 * @version 1.0
 */
public class ServiceLogUtil
{
    /**
     * 服务日志error
     * 
     * @param logger
     * @param logInfo
     */
    public static void error(Logger logger, RequestLog logInfo)
    {
        String json = JSONUtil.transferBeanToJSON(logInfo);
        // 每行记录内容部分以jsonTypeLog:开头
        String value = "jsonTypeLog:" + json;
        logger.error(value);

    }

    /**
     * 服务日志debug
     * 
     * @param logger
     * @param logInfo
     */
    public static void debug(Logger logger, RequestLog logInfo)
    {
        String json = JSONUtil.transferBeanToJSON(logInfo);
        // 每行记录内容部分以jsonTypeLog:开头
        String value = "jsonTypeLog:" + json;
        logger.debug(value);
    }

    /**
     * 服务日志info
     * 
     * @param logger
     * @param logInfo
     */
    public static void info(Logger logger, RequestLog logInfo)
    {
        String json = JSONUtil.transferBeanToJSON(logInfo);
        // 每行记录内容部分以jsonTypeLog:开头
        String value = "jsonTypeLog:" + json;
        logger.info(value);
    }

    /**
     * 服务日志fatal
     * 
     * @param logger
     * @param logInfo
     */
    public static void fatal(Logger logger, RequestLog logInfo)
    {
        String json = JSONUtil.transferBeanToJSON(logInfo);
        // 每行记录内容部分以jsonTypeLog:开头
        String value = "jsonTypeLog:" + json;
        logger.fatal(value);
    }

    /**
     * 服务日志warn
     * 
     * @param logger
     * @param logInfo
     */
    public static void warn(Logger logger, RequestLog logInfo)
    {
        String json = JSONUtil.transferBeanToJSON(logInfo);
        // 每行记录内容部分以jsonTypeLog:开头
        String value = "jsonTypeLog:" + json;
        logger.warn(value);
    }
    
    public static void main(String[] args)
    {
        RequestLog log = new RequestLog();
        log.setClientIp("10.10.10.101");
        log.setClientPort("8080");
        log.setComm("this is comm");
        log.setRegServiceName("regname");
        log.setRequestedIp("192.168.1.154");
        log.setRequestedTime(new Date());
        log.setRequestedUri("http://localhost:8032/globalservice");
        log.setServerIp("152.146.48.95");
        log.setServerPort("5862");
        log.setServiceMethod("doQuery");
        log.setServiceName("gisMap");
        log.setServiceParam("value=1");
        log.setServiceType("102");
        log.setToken("akdshfkjadflasdlkfjalskdfj");
        log.setUserId(101);
        log.setUserName("someone");
        System.out.println(JSONUtil.transferBeanToJSON(log));
    }
}
