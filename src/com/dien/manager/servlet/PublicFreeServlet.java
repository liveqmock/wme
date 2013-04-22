package com.dien.manager.servlet;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONObject;

import org.apache.log4j.Logger;

public class PublicFreeServlet extends HttpServlet {

    /**
	 * 
	 */
    private static final long serialVersionUID = 1L;

    private static final Logger logger = Logger.getLogger(PublicFreeServlet.class);


    @Override
    public void init() throws ServletException {
        super.init();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException,
            IOException {
        doPost(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        // 操作
        String operate = request.getParameter("oper");
        JSONObject obj = new JSONObject();
        obj.put("ret", true);
        response.setContentType("text/html;charset=utf-8");
        PrintWriter out = response.getWriter();
        if ("checkurl".equals(operate)) {// 查询要素
            checkRESTUrl(request, response, obj);
        }
        // out.write(JSONUtil.transferBeanToJSON(map));
        out.write(obj.toString());
        out.flush();
        out.close();
    }

    // 检查一个url是否是一个合格的arcgis server 的地图
    private void checkRESTUrl(HttpServletRequest request, HttpServletResponse response,
            JSONObject obj) {
        String urlStr = request.getParameter("url");
        logger.info(urlStr);
        if (urlStr == null || "".equals(urlStr)) {
            obj.put("ret", false);
        } else {
            String[] strs = urlStr.split("\\?");
            if (strs.length > 1) {
                String paramesStr = strs[1];
                String[] parames = paramesStr.split("\\&");
                ArrayList parameList = new ArrayList();
                for (int i = 0; i < parames.length; i++) {
                    if (!parames[i].startsWith("f="))
                        parameList.add(parames[i]);
                }
                paramesStr = com.dien.manager.util.Util.listToWhere(parameList, "&");
                if ("".equals(paramesStr)) {
                    urlStr = strs[0] + "?f=json";
                } else {
                    urlStr = strs[0] + "?f=json&" + paramesStr;
                }
            } else {
                urlStr = strs[0] + "?f=json";
            }
            logger.info(urlStr);
            String context = getDocumentAt(urlStr);
            try {
                JSONObject mapDesc = JSONObject.fromObject(context);
                if (mapDesc.containsKey("layers")) {
                    obj.put("ret", true);
                } else {
                    obj.put("ret", false);
                }
            } catch (net.sf.json.JSONException e) {
                obj.put("ret", false);
            }
        }

    }

    public String getDocumentAt(String urlString) {
        StringBuilder sb = new StringBuilder();
        try {
            URL url = new URL(urlString);// 生成url对象
            URLConnection urlConnection = url.openConnection();// 打开url连接
            BufferedReader br = new BufferedReader(new InputStreamReader(
                    urlConnection.getInputStream()));
            String line = null;
            while ((line = br.readLine()) != null) {
                sb.append(line + "\n");
            }
        } catch (MalformedURLException e) {
            System.out.println("不能连接到URL：" + urlString);
            e.printStackTrace();
        } catch (IOException e) {
            System.out.println("连接到URL抛出异常信息：" + urlString);
            e.printStackTrace();
        }
        return sb.toString();
    }

}
