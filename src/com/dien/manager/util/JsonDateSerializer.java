/*
 * 项目:GIS公共服务平台-运维平台-系统监控
 * 文件名称: JsonDateSerializer.java
 * 创建时间: 2011-8-15 上午10:06:46
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
import org.springframework.stereotype.Component;

/**
 * 
 * @version 1.0
 */
@Component
public class JsonDateSerializer extends JsonSerializer<Date>
{
    private static final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    /* (non-Javadoc)
     * @see org.codehaus.jackson.map.JsonSerializer#serialize(java.lang.Object, org.codehaus.jackson.JsonGenerator, org.codehaus.jackson.map.SerializerProvider)
     */
    @Override
    public void serialize(Date date, JsonGenerator gen, SerializerProvider provider)
            throws IOException, JsonProcessingException
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
