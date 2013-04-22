/*
 * 项目:GIS公共服务平台-运维平台-系统监控
 * 文件名称: JsonTimeSerializer.java
 * 创建时间: 2011-9-13 上午10:47:58
 * 创建人: Administrator
 */
package com.dien.manager.util;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

import org.codehaus.jackson.JsonGenerator;
import org.codehaus.jackson.JsonProcessingException;
import org.codehaus.jackson.map.JsonSerializer;
import org.codehaus.jackson.map.SerializerProvider;

/**
 * 使用jackson格式化时间
 * 
 * @version 1.0
 */
public class JsonTimeSerializer extends JsonSerializer<Date>
{
    private static final SimpleDateFormat dateFormat = new SimpleDateFormat(
                                                             "HH:mm:ss");

    @Override
    public void serialize(Date date, JsonGenerator gen,
            SerializerProvider provider) throws IOException,
            JsonProcessingException
    {
        if (null == date)
        {
            gen.writeString("");
        }
        else
        {
            String formattedDate = dateFormat.format(date);
            gen.writeString(formattedDate);
        }
    }

}
