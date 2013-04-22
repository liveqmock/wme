package com.dien.manager.servlet;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import net.sf.json.JSONObject;

import org.apache.log4j.Logger;
import org.geoserver.wfs.response.SDEWrapper;

import com.dien.manager.dao.bean.Config;
import com.dien.manager.dao.bean.Layer;
import com.dien.manager.dao.bean.User;
import com.dien.manager.tools.Basis;
import com.dien.manager.tools.TableFactory;
import com.dien.manager.util.UtilLayer;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeLayer;

/**
 * 显示样式图片
 * 
 * @author ben
 * 
 */
public class ShpToSdeServlet extends HttpServlet {
    private static Logger logger = Logger.getLogger(ShpToSdeServlet.class);

    private static Logger serviceLog = Logger.getLogger("service");

    private Basis basis;

    private TableFactory tableFactory;

    private HashMap<String, String> types;

    /**
     * Constructor of the object.
     */
    public ShpToSdeServlet() {
        super();
    }

    /**
     * Initialization of the servlet. <br>
     * 
     * @throws ServletException if an error occurs
     */
    public void init() throws ServletException {

        basis = new Basis();
        tableFactory = new TableFactory();
    }

    /**
     * Destruction of the servlet. <br>
     */
    public void destroy() {
        super.destroy(); // Just puts "destroy" string in log
        // Put your code here
    }

    /**
     * The doGet method of the servlet. <br>
     * 
     * This method is called when a form has its tag value method equals to get.
     * 
     * @param request the request send by the client to the server
     * @param response the response send by the server to the client
     * @throws ServletException if an error occurred
     * @throws IOException if an error occurred
     */
    public void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        this.doPost(request, response);
    }

    /**
     * The doPost method of the servlet. <br>
     * 
     * This method is called when a form has its tag value method equals to post.
     * 
     * @param request the request send by the client to the server
     * @param response the response send by the server to the client
     * @throws ServletException if an error occurred
     * @throws IOException if an error occurred
     */
    public void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession();
        User users = (User) session.getAttribute("user");
        if (users != null && users.isDataAuth()) {
            this.shpToSDE(request, response);
        } else {
            response.setContentType("text/html;charset=utf-8");
            PrintWriter out = response.getWriter();
            JSONObject obj = new JSONObject();
            obj.put("ret", false);
            obj.put("msg", "您不是登陆用户");
            out.write(obj.toString());
            out.flush();
            out.close();
        }

    }

    public void shpToSDE(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        JSONObject obj = new JSONObject();

        HttpSession session = request.getSession();

        User users = (User) session.getAttribute("user");
        if (users == null) {
            obj.put("ret", false);
            obj.put("msg", "没有权限导入图层!");
        } else {
            String oldlayername = request.getParameter("oldlayername");
            String newlayername = request.getParameter("newlayername");
            String pathshp = session.getAttribute(oldlayername).toString();
            logger.info(pathshp);

            try {
                if (basis.isLayerExist(newlayername)) {
                    obj.put("ret", false);
                    obj.put("msg", "图层名称 " + newlayername + " 已经存在!");
                } else {
                    // 4. shp文件入库
                    SDEWrapper sde = new SDEWrapper(Config.getProperties());
                    File shpFile = new File(pathshp);
                    String path = shpFile.getPath();
                    String layerName = shpFile.getName();
                    layerName = layerName.substring(0, layerName.indexOf("."));
                    // 处理图层名称
                    // 中文变成英文
                    layerName = basis.generatorTableName(layerName);

                    try {
                        sde.shpToSde(path, layerName);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    basis.updateLayerName(layerName, newlayername);
                    SeLayer l = basis.getLayer(layerName);

                    Layer layer = new Layer();
                    layer.setLayername(newlayername.toUpperCase());
                    layer.setTablename(layerName.toUpperCase());
                    layer.setUserid(users.getUserId());
                    layer.setGeotype(UtilLayer.getLayerTypeInt(l) + "");

                    tableFactory.insert(layer);

                    obj.put("ret", true);
                    obj.put("layer", UtilLayer.layerToJSON(l));
                    logger.info("成功导入图层:" + newlayername);
                }
            } catch (SeException e) {
                e.printStackTrace();
                obj.put("ret", false);
                obj.put("msg", "shp文件导入sde时候出现错误!");
            }
        }
        response.setContentType("text/html;charset=utf-8");
        PrintWriter out = response.getWriter();
        // out.write(JSONUtil.transferBeanToJSON(map));
        out.write(obj.toString());
        out.flush();
        out.close();
    }

}
