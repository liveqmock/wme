package com.dien.manager.util;

import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Iterator;
import java.util.List;

public class Util {
    /**
     * 将字符串转换成hex字符串
     * 
     * @param str
     * @return
     */
    public static String encoderToHex(String str) {

        try {
            // 确定计算方法
            MessageDigest md5 = MessageDigest.getInstance("MD5");
            // BASE64Encoder base64en = new BASE64Encoder();
            // 加密后的字符串
            return byte2hex(md5.digest(str.getBytes("utf-8")));
        } catch (NoSuchAlgorithmException e) {

            e.printStackTrace();
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static String byte2hex(byte[] b) // 二行制转字符串
    {
        String hs = "";
        String stmp = "";
        for (int n = 0; n < b.length; n++) {
            stmp = (java.lang.Integer.toHexString(b[n] & 0XFF));
            if (stmp.length() == 1)
                hs = hs + "0" + stmp;
            else
                hs = hs + stmp;
        }
        return hs.toUpperCase();
    }

    public static String listToWhere(List<String> whereList, String linkStr) // 二行制转字符串
    {
        String whereStr = "";
        Iterator<String> str = whereList.iterator();
        while (str.hasNext()) {
            if (!"".equals(whereStr))
                whereStr += linkStr + str.next();
            else
                whereStr += str.next();

        }
        return whereStr;
    }
}
