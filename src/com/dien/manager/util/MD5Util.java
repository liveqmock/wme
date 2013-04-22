package com.dien.manager.util;

import java.security.MessageDigest;

import org.apache.commons.codec.binary.Hex;
import org.apache.log4j.Logger;

/**
 * 系统的md5加密工具类
 * 
 * @author dien
 */
public class MD5Util
{

    /**
     * logger
     */
    private static Logger logger = Logger.getLogger(MD5Util.class);

    /**
     * MD5加密后使用base64进行转码
     * 
     * @param str
     *            待加密的字符
     * @return 密文
     */
    public static String encoderByMd5(String str)
    {
        // 确定计算方法
        try
        {
            MessageDigest md5 = MessageDigest.getInstance("MD5");
            // BASE64Encoder base64en = new BASE64Encoder();
            // String newstr =
            // base64en.encode(md5.digest(str.getBytes("utf-8")));
            String newstr = new String(Hex.encodeHex(md5.digest(str.getBytes("utf-8"))));
            return newstr;
        }
        catch (Exception e)
        {
            logger.error("md5 encoder error:" + str, e);
        }
        return str;
    }

    /**
     * @param args
     */
    public static void main(String[] args)
    {
        String password = MD5Util.encoderByMd5("123");
        logger.info(password);
    }

}
