/*
 * 项目:GIS公共服务平台-运维平台-系统监控
 * 文件名称: RequestLog.java
 * 创建时间: 2011-8-5 上午9:55:08
 * 创建人: Administrator
 */
package com.dien.manager.dao.bean;

import java.io.Serializable;
import java.util.Date;

import org.codehaus.jackson.map.annotate.JsonSerialize;

import com.dien.manager.util.JsonDateSerializer;

/**
 * 当前请求日志
 * 
 * @version 1.0
 */
public class RequestLog  implements Serializable
{
    /**
     * serialVersionUID
     */
    private static final long serialVersionUID = 1L;

    /**
     * id
     */
    private int    id;

    /**
     * 请求的ip
     */
    private String requestedIp;

    /**
     * 请求的uri
     */
    private String requestedUri;

    /**
     * 请求的时间
     */
    private Date   requestedTime;

    /**
     * 服务名称
     */
    private String serviceName;

    /**
     * 服务类别
     */
    private String serviceType;

    /**
     * 服务方法
     */
    private String serviceMethod;

    /**
     * 服务参数
     */
    private String serviceParam;

    /**
     * token令牌
     */
    private String token;

    /**
     * 服务器ip
     */
    private String serverIp;

    /**
     * 服务器端口
     */
    private String serverPort;

    /**
     * 客户端ip
     */
    private String clientIp;

    /**
     * 客户端端口
     */
    private String clientPort;

    /**
     * 用户id
     */
    private int    userId;

    /**
     * 用户名称
     */
    private String userName;

    /**
     * 服务注册名称
     */
    private String regServiceName;

    /**
     * 被访问服务id
     */
    private Integer serviceId;

    /**
     * 备注
     */
    private String comm;

    /**
     * @return the id
     */
    public int getId()
    {
        return id;
    }

    /**
     * @param id
     *            the id to set
     */
    public void setId(int id)
    {
        this.id = id;
    }

    /**
     * @return the requestedIp
     */
    public String getRequestedIp()
    {
        return requestedIp;
    }

    /**
     * @param requestedIp
     *            the requestedIp to set
     */
    public void setRequestedIp(String requestedIp)
    {
        this.requestedIp = requestedIp;
    }

    /**
     * @return the requestedUri
     */
    public String getRequestedUri()
    {
        return requestedUri;
    }

    /**
     * @param requestedUri
     *            the requestedUri to set
     */
    public void setRequestedUri(String requestedUri)
    {
        this.requestedUri = requestedUri;
    }

    /**
     * @return the requestedTime
     */
    @JsonSerialize(using = JsonDateSerializer.class)
    public Date getRequestedTime()
    {
        return requestedTime;
    }

    /**
     * @param requestedTime
     *            the requestedTime to set
     */
    public void setRequestedTime(Date requestedTime)
    {
        this.requestedTime = requestedTime;
    }

    /**
     * @return the serviceName
     */
    public String getServiceName()
    {
        return serviceName;
    }

    /**
     * @param serviceName
     *            the serviceName to set
     */
    public void setServiceName(String serviceName)
    {
        this.serviceName = serviceName;
    }

    /**
     * @return the serviceType
     */
    public String getServiceType()
    {
        return serviceType;
    }

    /**
     * @param serviceType
     *            the serviceType to set
     */
    public void setServiceType(String serviceType)
    {
        this.serviceType = serviceType;
    }

    /**
     * @return the serviceMethod
     */
    public String getServiceMethod()
    {
        return serviceMethod;
    }

    /**
     * @param serviceMethod
     *            the serviceMethod to set
     */
    public void setServiceMethod(String serviceMethod)
    {
        this.serviceMethod = serviceMethod;
    }

    /**
     * @return the serviceParam
     */
    public String getServiceParam()
    {
        return serviceParam;
    }

    /**
     * @param serviceParam
     *            the serviceParam to set
     */
    public void setServiceParam(String serviceParam)
    {
        this.serviceParam = serviceParam;
    }

    /**
     * @return the token
     */
    public String getToken()
    {
        return token;
    }

    /**
     * @param token
     *            the token to set
     */
    public void setToken(String token)
    {
        this.token = token;
    }

    /**
     * @return the serverIp
     */
    public String getServerIp()
    {
        return serverIp;
    }

    /**
     * @param serverIp
     *            the serverIp to set
     */
    public void setServerIp(String serverIp)
    {
        this.serverIp = serverIp;
    }

    /**
     * @return the serverPort
     */
    public String getServerPort()
    {
        return serverPort;
    }

    /**
     * @param serverPort
     *            the serverPort to set
     */
    public void setServerPort(String serverPort)
    {
        this.serverPort = serverPort;
    }

    /**
     * @return the clientIp
     */
    public String getClientIp()
    {
        return clientIp;
    }

    /**
     * @param clientIp
     *            the clientIp to set
     */
    public void setClientIp(String clientIp)
    {
        this.clientIp = clientIp;
    }

    /**
     * @return the clientPort
     */
    public String getClientPort()
    {
        return clientPort;
    }

    /**
     * @param clientPort
     *            the clientPort to set
     */
    public void setClientPort(String clientPort)
    {
        this.clientPort = clientPort;
    }

    /**
     * @return the userId
     */
    public int getUserId()
    {
        return userId;
    }

    /**
     * @param userId
     *            the userId to set
     */
    public void setUserId(int userId)
    {
        this.userId = userId;
    }

    /**
     * @return the userName
     */
    public String getUserName()
    {
        return userName;
    }

    /**
     * @param userName
     *            the userName to set
     */
    public void setUserName(String userName)
    {
        this.userName = userName;
    }

    /**
     * @return the regServiceName
     */
    public String getRegServiceName()
    {
        return regServiceName;
    }

    /**
     * @param regServiceName the regServiceName to set
     */
    public void setRegServiceName(String regServiceName)
    {
        this.regServiceName = regServiceName;
    }

    /**
     * @return the comm
     */
    public String getComm()
    {
        return comm;
    }

    /**
     * @param comm the comm to set
     */
    public void setComm(String comm)
    {
        this.comm = comm;
    }

    /**
     * @return the serviceId
     */
    public Integer getServiceId()
    {
        return serviceId;
    }

    /**
     * @param serviceId the serviceId to set
     */
    public void setServiceId(Integer serviceId)
    {
        this.serviceId = serviceId;
    }

}
