/*
 * 项目:GIS公共服务平台-运维平台-系统监控
 * 文件名称: JSONUtil.java
 * 创建时间: 2011-8-10 下午3:12:16
 * 创建人: Administrator
 */
package com.dien.manager.util;

import java.io.IOException;
import java.io.StringWriter;
import java.util.Map;

import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.JsonGenerator;
import org.codehaus.jackson.JsonParseException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;

/**
 * 
 * @version 1.0
 */
public class JSONUtil {
	/**
     * 
     */
	private static final ObjectMapper MAPPER = new ObjectMapper();

	/**
	 * @return
	 */
	public static ObjectMapper getInstance() {
		return MAPPER;
	}

	/**
	 * 转换到JSON字符串
	 */
	public static String transferBeanToJSON(Object obj) {
		StringWriter sw = new StringWriter();
		JsonGenerator gen;
		try {
			gen = new JsonFactory().createJsonGenerator(sw);
			JSONUtil.MAPPER.writeValue(gen, obj);
			gen.close();
			// return new String(sw.toString().getBytes("utf-8"), "utf-8");
			return sw.toString();
		} catch (IOException e) {
			e.printStackTrace();
		}
		return null;
	}

	public static <T> T transferJSONToBean(String json, Class<T> clazz) {
		try {
			return (T) MAPPER.readValue(json, clazz);
		} catch (JsonParseException e) {
			//
		} catch (JsonMappingException e) {
			//
		} catch (IOException e) {
			//
		}

		return null;
	}

	/**
	 * 将JSON串转换为Map
	 */
	public static Map toMap(String json) {
		try {
			Map map = MAPPER.readValue(json, Map.class);
			return map;
		} catch (JsonParseException e) {
			e.printStackTrace();
		} catch (JsonMappingException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}

		return null;
	}
}
