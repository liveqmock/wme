package com.dien.manager.servlet;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.servlet.Servlet;
import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import net.sf.json.JSONArray;
import net.sf.json.JSONNull;
import net.sf.json.JSONObject;

import org.apache.log4j.Logger;

import com.dien.manager.dao.bean.Alias;
import com.dien.manager.dao.bean.Config;
import com.dien.manager.dao.bean.Layer;
import com.dien.manager.dao.bean.LayerField;
import com.dien.manager.dao.bean.LayerUser;
import com.dien.manager.dao.bean.PointSymbol;
import com.dien.manager.dao.bean.Template;
import com.dien.manager.dao.bean.TemplateField;
import com.dien.manager.dao.bean.User;
import com.dien.manager.tools.Basis;
import com.dien.manager.tools.CopyFile;
import com.dien.manager.tools.TableFactory;
import com.dien.manager.util.UtilLayer;
import com.dien.poi.ExcelReadSiWeiPOI;
import com.esri.sde.sdk.client.SDEPoint;
import com.esri.sde.sdk.client.SeColumnDefinition;
import com.esri.sde.sdk.client.SeCoordinateReference;
import com.esri.sde.sdk.client.SeError;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeExtent;
import com.esri.sde.sdk.client.SeLayer;
import com.esri.sde.sdk.client.SeShape;
import com.esri.sde.sdk.pe.PeCoordinateSystem;
import com.esri.sde.sdk.pe.PeFactory;
import com.esri.sde.sdk.pe.PeProjectionException;

/**
 * 图层数据创建，修改删除，查询
 */
public class OperatMapServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private static Logger logger = Logger.getLogger(OperatMapServlet.class);

    public static final String TOKEN = "token";

    private Basis basis;


    // 北京图层列表
    private static JSONArray mapList = new JSONArray();

    // 公司描述
    private static String companyDescription;

    // 公司logo
    private static String companyLogo;

    private static String companyUrl;

    private TableFactory tableFactory;

    /**
     * @see HttpServlet#HttpServlet()
     */
    public OperatMapServlet() {
        super();
    }

    /**
     * @see Servlet#init(ServletConfig)
     */
    public void init(ServletConfig config) throws ServletException {
        super.init(config);

        // TODO Auto-generated method stub
        String server = getInitParameter("server");
        logger.info("arcsde ip = " + server);
        String instance = getInitParameter("instance");
        logger.info("arcsde 端口 = " + instance);
        String database = getInitParameter("database");
        logger.info("arcsde 数据库 = " + database);
        String user = getInitParameter("user");
        logger.info("arcsde 用户名 = " + user);
        String password = getInitParameter("password");
        logger.info("arcsde 密码 = " + password);
        String sdebin = getInitParameter("sdebin");
        logger.info("arcsde 程序bin目录 = " + sdebin);
        Config.setSdebin(sdebin);
        String outpath = getInitParameter("outpath");
        logger.info("shp 文件缓存目录 = " + outpath);
        Config.setOutPath(outpath);
        String timeout = getInitParameter("timeout");
        logger.info("arcsde 连接超时时间 = " + timeout);
        String minconn = getInitParameter("minconn");
        logger.info("arcsde连接池最小连接数 = " + minconn);
        String maxconn = getInitParameter("maxconn");
        logger.info("arcsde连接池最大连接数 = " + maxconn);
        // 初试化连接
        new Config(server, instance, database, user, password, Integer.parseInt(timeout),
                Integer.parseInt(minconn), Integer.parseInt(maxconn));

        companyDescription = getInitParameter("companyDescription");
        logger.info("公司描述 = " + companyDescription);
        Config.setCompanyDescription(companyDescription);

        companyLogo = getInitParameter("companyLogo");
        logger.info("公司logo = " + companyLogo);
        Config.setCompanyLogo(companyLogo);

        companyUrl = getInitParameter("companyUrl");
        logger.info("公司网址 = " + companyUrl);
        Config.setCompanyUrl(companyUrl);
        // 没有目录新建
        CopyFile copyFile = new CopyFile();
        copyFile.newFolder(Config.getOutPath());
        // 图标目录
        copyFile.newFolder(Config.getOutPath() + File.separator + "symbolimage/");
        basis = new Basis();
        tableFactory = new TableFactory();
        
        initTable(config);
        initMap(config);
        checkLayerTable();

    }

    /**
     * 初始化表
     * @param config
     */
    public void initTable(ServletConfig config) {
        
        try {

            if ("true".equals(getInitParameter("isclear")) ? true : false) {
                if (tableFactory.tableExixts(Template.class)) {
                    tableFactory.deleteTable(Template.class);
                }
                if (tableFactory.tableExixts(TemplateField.class)) {
                    tableFactory.deleteTable(TemplateField.class);
                }
                if (tableFactory.tableExixts(PointSymbol.class)) {
                    tableFactory.deleteTable(PointSymbol.class);
                }
                if (tableFactory.tableExixts(Layer.class)) {
                    tableFactory.deleteTable(Layer.class);
                }
                if (tableFactory.tableExixts(LayerUser.class)) {
                    tableFactory.deleteTable(LayerUser.class);
                }
                if (tableFactory.tableExixts(LayerField.class)) {
                    tableFactory.deleteTable(LayerField.class);
                }
                if (tableFactory.tableExixts(Alias.class)) {
                    tableFactory.deleteTable(Alias.class);
                }
            }

            if (!tableFactory.tableExixts(Template.class)) {
                tableFactory.createTable(Template.class);
            }
            if (!tableFactory.tableExixts(TemplateField.class)) {
                tableFactory.createTable(TemplateField.class);
            }
            if (!tableFactory.tableExixts(PointSymbol.class)) {
                String[] constraintColumns = new String[1];
                constraintColumns[0] = "POINTCODE";
                tableFactory.createTable(PointSymbol.class, constraintColumns);
                loadPoi();
            }
            if (!tableFactory.tableExixts(Layer.class)) {
                String[] constraintColumns = new String[1];
                constraintColumns[0] = "TABLENAME";
                tableFactory.createTable(Layer.class, constraintColumns);
            }
            if (!tableFactory.tableExixts(LayerUser.class)) {
                tableFactory.createTable(LayerUser.class);
            }            
            if (!tableFactory.tableExixts(LayerField.class)) {
                tableFactory.createTable(LayerField.class);
            }
            if (!tableFactory.tableExixts(Alias.class)) {
                tableFactory.createTable(Alias.class);
            }
        } catch (SeException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }

    }
    /**
     * 装载poi分类
     * @param config
     */
    public void loadPoi() {
        try{
            ExcelReadSiWeiPOI excelReadSiWeiPOI =new ExcelReadSiWeiPOI();
            HashMap<String, HashMap<String, HashMap<String, String>>> symbolMap = excelReadSiWeiPOI.readPoiFiel();
            excelReadSiWeiPOI.toSde(symbolMap);

        } catch (SeException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    /**
     * 检查图层和表的完整性
     */
    public void checkLayerTable() {
        this.basis.checkLayerFillDescriptTable();
        this.basis.checkLayerDelInvalidDescriptTable();
    }

    /**
     * 初始化地图
     * 
     */
    public void initMap(ServletConfig config) throws ServletException {
        super.init(config);
        ServletContext context = config.getServletContext();
        try {

            BufferedReader bufRead = new BufferedReader(new InputStreamReader(
                    (context.getResourceAsStream("WEB-INF/mapurl.txt")), "UTF-8"));// 这个readme.txt放入你的web应用的根目录
            String str;
            //加载地图配置文件
            while ((str = bufRead.readLine()) != null) {
                if (str != null && !"".equals(str.trim()) && !str.trim().startsWith("#")) {
                    mapList.add(JSONObject.fromObject("{" + str + "}"));
                }
                logger.info(str);
            }
            bufRead.close();

        } catch (IOException e) {
            e.printStackTrace();
            logger.error("读取地图地址异常", e);
        }

    }

    /**
     * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
     */
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        doPost(request, response);
    }

    /**
     * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
     */
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession();

        User users = (User) session.getAttribute("user");
        if (users != null) {
            boolean isManager = users.isDataAuth();
            if (isManager) {
                doPostManager(request, response, users.getUserId());
            } else {
                doPostNormal(request, response, users.getUserId());
            }
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

    /**
     * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
     */
    protected void doPostNormal(HttpServletRequest request, HttpServletResponse response, int userid)
            throws ServletException, IOException {
        // request.setCharacterEncoding("utf-8");

        // 操作
        String operate = request.getParameter("oper");
        JSONObject obj = new JSONObject();
        obj.put("ret", true);
        response.setContentType("text/html;charset=utf-8");
        PrintWriter out = response.getWriter();
        if ("add".equals(operate)) {// 增加要素
            String layer = request.getParameter("layer");
            String feature = request.getParameter("feature");
            JSONObject featureJSON = JSONObject.fromObject(feature);
            long id = -1;
            try {
                id = addFeature(layer, featureJSON, userid);
            } catch (SeException e) {
                handlingSeException(e, obj); 
            }
            obj.put("newid", id);
            obj.put("feature", featureJSON);
            logger.info("增加记录 :" + featureJSON.get("geometry"));
        } else if ("del".equals(operate)) {// 删除要素
            String layerName = request.getParameter("layer");
            String id = request.getParameter("id");
            try {
                if (basis.isFeaturePrivileges(layerName, Integer.parseInt(id), userid)) {
                    delFeature(layerName, id);
                } else {
                    obj.put("ret", false);
                    obj.put("msg", "没有权限删除记录");
                }
            } catch (NumberFormatException e) {
                e.printStackTrace();
                obj.put("ret", false);
                obj.put("msg", "错误的删除id");
            } catch (SeException e) {
                handlingSeException(e, obj);
            }
            obj.put("id", id);
            logger.info("删除记录deleteid:" + id);
        } else if ("up".equals(operate)) {// 更新要素
            String layerName = request.getParameter("layer");
            String id = request.getParameter("id");
            String featureStr = request.getParameter("feature");
            JSONObject featureJSON = JSONObject.fromObject(featureStr);
            try {
                if (basis.isFeaturePrivileges(layerName, Integer.parseInt(id), userid))
                    upFeature(layerName, id, featureJSON);
            } catch (SeException e) {
                handlingSeException(e, obj);
            } catch (NumberFormatException e) {
                e.printStackTrace();
                obj.put("ret", false);
                obj.put("msg", "错误的更新id");
            }
            obj.put("id", id);
            obj.put("feature", featureJSON);
            logger.info("修改记录 id:" + id);
        } else if ("layerdesc".equals(operate)) {// 图层描述
            String tableName = request.getParameter("layer");
            JSONObject layer = null;
            try {
                if (basis.isTableExixts(tableName)) {
                    layer = layerDesc(tableName);
                } else {
                    obj.put("ret", false);
                    obj.put("msg", "图层不存在，可能已经被删除！");
                }
            } catch (SeException e) {
                handlingSeException(e, obj);
            } catch (Exception e) {
                e.printStackTrace();
            } 
            obj.put("layer", layer);
            logger.info("图层 详细信息:" + tableName);
        } else if ("layers".equals(operate)) {// 查询要素
            JSONArray layers = null;
            try {
                layers = queryLayers();
            } catch (SeException e) {
                handlingSeException(e, obj);
            }
            obj.put("layers", layers);
            logger.info("图层列表:" + layers.toString());
        } else if ("quecolumndef".equals(operate)) {// 查询要素
            String layerStr = request.getParameter("layer");
            String wkid = request.getParameter("wkid");
            JSONObject features = null;
            try {
                features = queryColumndef(layerStr, wkid);
            } catch (SeException e) {

                handlingSeException(e, obj);
             
            }
            // test script
            // rows =
            // JSONObject.fromObject("{\"columndef\":[{\"name\":\"NAME\",\"field\":\"NAME\"},{\"name\":\"SHAPE\",\"field\":\"SHAPE\"},{\"name\":\"OBJECTID\",\"field\":\"OBJECTID\"}],\"rows\":[{\"SHAPE\":\"type\",\"OBJECTID\":1}]}");
            obj.put("features", features);
            // logger.info("查询记录(All) :" + features.toString());
        } else if ("queallpage".equals(operate)) {// 分页查询要素
            JSONArray features = new JSONArray();
            try {
                String orderColumn = getOrderColumn(request);
                logger.info(orderColumn);
                String descOrAsc = "";
                logger.info(orderColumn);
                if ("".equals(orderColumn)) {
                    orderColumn = "OBJECTID";
                } else {
                    if (orderColumn.startsWith("-")) {
                        descOrAsc = "DESC";
                        orderColumn = orderColumn.substring(1);
                    } else {
                        descOrAsc = "ASC";
                    }

                }

                String tableName = request.getParameter("layer");
                String wkid = request.getParameter("wkid");
                String range = request.getHeader("Range");
                String start = range.substring(range.indexOf("=") + 1, range.indexOf("-"));
                String count = range.substring(range.indexOf("-") + 1, range.length());
                int startInt = Integer.parseInt(start);
                int countInt = Integer.parseInt(count);
                int tableCount = basis.queryRowCount(tableName, userid);
                response.setHeader("Content-Range", "items " + startInt + "-" + countInt + "/" + tableCount);
                features = queryAllpage(tableName, startInt, countInt, wkid, orderColumn, userid,
                        descOrAsc);

            } catch (SeException e) {
                handlingSeException(e, obj);

            } catch (java.lang.NullPointerException e) {
               e.printStackTrace();
            }

            // test script
            // rows =
            // JSONObject.fromObject("{\"columndef\":[{\"name\":\"NAME\",\"field\":\"NAME\"},{\"name\":\"SHAPE\",\"field\":\"SHAPE\"},{\"name\":\"OBJECTID\",\"field\":\"OBJECTID\"}],\"rows\":[{\"SHAPE\":\"type\",\"OBJECTID\":1}]}");
            // obj.put("features", features);
            out.write(features.toString());
            out.flush();
            out.close();
            return;
            // logger.info("查询记录(All) :" + features.toString());
        } else if ("search".equals(operate)) {// 查询要素

            String layerStr = request.getParameter("layer");
            String wkid = request.getParameter("wkid");
            String range = request.getHeader("Range");
            String start = range.substring(range.indexOf("=") + 1, range.indexOf("-"));
            String count = range.substring(range.indexOf("-") + 1, range.length());
            int startInt = Integer.parseInt(start);
            int countInt = Integer.parseInt(count);
            String word = request.getParameter("word");
            word = new String(word.getBytes("ISO-8859-1"), "UTF-8");
            JSONArray features = null;
            try {
                //int tableCount = basis.searchCount(layerStr, word, userid);
                //response.setHeader("Content-Range", "items " + startInt + "-" + countInt + "/" + tableCount);
                features = searchPage(layerStr, startInt, countInt, wkid, word, userid);
            } catch (SeException e) {
                handlingSeException(e, obj);
            }

            out.write(features.toString());
            out.flush();
            out.close();
            return;
        }
        // out.write(JSONUtil.transferBeanToJSON(map));
        out.write(obj.toString());
        out.flush();
        out.close();
    }

    /**
     * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
     */
    protected void doPostManager(HttpServletRequest request, HttpServletResponse response,
            int userid) throws ServletException, IOException {

        // 操作
        String operate = request.getParameter("oper");
        JSONObject obj = new JSONObject();

        obj.put("ret", true);
        obj.put("msg", "成功");
        response.setContentType("text/html;charset=utf-8");
        PrintWriter out = response.getWriter();
        if ("add".equals(operate)) {// 增加要素
            String layer = request.getParameter("layer");
            String feature = request.getParameter("feature");
            JSONObject featureJSON = JSONObject.fromObject(feature);
            long id = -1;
            try {
                id = addFeature(layer, featureJSON, userid);
            } catch (SeException e) {
                handlingSeException(e, obj);
            }
            obj.put("newid", id);
            obj.put("feature", featureJSON);
            logger.info("增加记录 :" + featureJSON.get("geometry"));
        } else if ("del".equals(operate)) {// 删除要素
            String layerName = request.getParameter("layer");
            String id = request.getParameter("id");
            try {
                delFeature(layerName, id);

            } catch (NumberFormatException e) {
                e.printStackTrace();
                obj.put("ret", false);
                obj.put("msg", "错误的删除id");
            } catch (SeException e) {
                handlingSeException(e, obj);
            }
            obj.put("id", id);
            logger.info("删除记录deleteid:" + id);
        } else if ("up".equals(operate)) {// 更新要素
            String layerName = request.getParameter("layer");
            String id = request.getParameter("id");
            String featureStr = request.getParameter("feature");
            JSONObject featureJSON = JSONObject.fromObject(featureStr);
            try {
                upFeature(layerName, id, featureJSON);
            } catch (SeException e) {
                handlingSeException(e, obj);
            } catch (NumberFormatException e) {
                e.printStackTrace();
                obj.put("ret", false);
                obj.put("msg", "错误的更新id");
            }
            obj.put("id", id);
            obj.put("feature", featureJSON);
            logger.info("修改记录 id:" + id);
        } else if ("layers".equals(operate)) {// 查询要素
            JSONArray layers = null;
            try {
                layers = queryLayers();
            } catch (SeException e) {
                e.printStackTrace();
            }
            obj.put("layers", layers);
            logger.info("图层列表:" + layers.toString());
        } else if ("layerdesc".equals(operate)) {// 图层描述
            String tableName = request.getParameter("layer");
            JSONObject layer = null;
            try {
                if (basis.isTableExixts(tableName)) {
                    layer = layerDesc(tableName);
                } else {
                    obj.put("ret", false);
                    obj.put("msg", "图层不存在，可能已经被删除！");
                }

            } catch (SeException e) {
                handlingSeException(e, obj);
            } catch (Exception e) {
                e.printStackTrace();
            }
            obj.put("layer", layer);
            logger.info("图层 :" + obj);
        } else if ("cs".equals(operate)) {// 查询要素
            JSONArray css = queryCS();

            obj.put("cs", css);
            logger.info("坐标列表 :" + css.toString());
        } else if ("addlayer".equals(operate)) {// 增加图层
            String layer = request.getParameter("layer");
            JSONObject layerJSON = JSONObject.fromObject(layer);
            createLayer(layerJSON, userid, obj);
            logger.info("创建图层:");
        } else if ("dellayer".equals(operate)) {// 删除图层
            String layerName = request.getParameter("layer");
            try {
                if (basis.isTableExixts(layerName)) {
                    deleteLayer(layerName);
                } else {
                    obj.put("ret", false);
                    obj.put("msg", "图层不存在，可能已经被删除！");
                }
            } catch (SeException e) {
                handlingSeException(e, obj);
                
            }

            logger.info("删除图层:" + layerName);
        } else if ("que".equals(operate)) {// 查询要素
            String layerStr = request.getParameter("layer");
            String id = request.getParameter("id");
            String wkid = request.getParameter("wkid");

            wkid = "102100".equals(wkid) ? "102113" : wkid;
            JSONObject rows = null;
            try {
                rows = queryByID(layerStr, id, wkid);
            } catch (SeException e) {
                handlingSeException(e, obj);
            }
            obj.put("features", rows);
            logger.info("查询记录(id) :" + rows.toString());
        } else if ("quebox".equals(operate)) {// 查询要素
            String layerStr = request.getParameter("layer");
            String box = request.getParameter("box");
            String wkid = request.getParameter("wkid");
            JSONObject rows = null;
            try {
                rows = queryByBox(layerStr, box, wkid);
            } catch (SeException e) {
                handlingSeException(e, obj);
            }
            obj.put("features", rows);
            logger.info("查询记录(box) :" + rows.toString());
        } else if ("updatelayername".equals(operate)) {// 更新图层名称
            String oldlayername = request.getParameter("oldlayername");
            String newlayername = request.getParameter("newlayername");
            try {
                if (basis.isLayerExist(oldlayername)) {
                    if (basis.isLayerExist(newlayername)) {
                        obj.put("ret", false);
                        obj.put("msg", "图层名称 " + newlayername + " 已经存在!");
                    } else {
                        updateLayerName(oldlayername, newlayername);
                        obj.put("ret", true);
                    }
                } else {
                    obj.put("ret", false);
                    obj.put("msg", "图层 " + oldlayername + "不存在!");
                }
            } catch (SeException e) {
                handlingSeException(e, obj);
            }
            logger.info("修改图层名称:  " + oldlayername + " -> " + newlayername);
        } else if ("quecolumndef".equals(operate)) {// 查询表结构
            String layerStr = request.getParameter("layer");
            String wkid = request.getParameter("wkid");
            String range = request.getHeader("Range");

            JSONObject features = null;
            try {
                features = queryColumndef(layerStr, wkid);
            } catch (SeException e) {
                handlingSeException(e, obj);
            }
            obj.put("features", features);
            // logger.info("查询记录(All) :" + features.toString());
        } else if ("queallpage".equals(operate)) {// 分页查询要素

            JSONArray features = new JSONArray();
            try {

                // 排序处理
                String orderColumn = getOrderColumn(request);
                String descOrAsc = "";
                logger.info(orderColumn);
                if ("".equals(orderColumn)) {
                    orderColumn = "OBJECTID";
                } else {
                    if (orderColumn.startsWith("-")) {
                        descOrAsc = "DESC";
                        orderColumn = orderColumn.substring(1);
                    } else {
                        descOrAsc = "ASC";
                    }

                }
                String layerStr = request.getParameter("layer");
                String wkid = request.getParameter("wkid");
                String range = request.getHeader("Range");
                String start = range.substring(range.indexOf("=") + 1, range.indexOf("-"));
                String count = range.substring(range.indexOf("-") + 1, range.length());
                int startInt = Integer.parseInt(start);
                int countInt = Integer.parseInt(count);
                int tableCount = basis.getTableCount(layerStr);
                response.setHeader("Content-Range", "items " + startInt + "-" + countInt + "/" + tableCount);
                features = queryAllpage(layerStr, startInt, countInt, wkid, orderColumn, descOrAsc);

            } catch (Exception e) {
                e.printStackTrace();
            }
            out.write(features.toString());
            out.flush();
            out.close();
            return;
            // logger.info("查询记录(All) :" + features.toString());
        } else if ("search".equals(operate)) {// 查询要素

            String layerStr = request.getParameter("layer");
            String wkid = request.getParameter("wkid");
            String range = request.getHeader("Range");
            String start = range.substring(range.indexOf("=") + 1, range.indexOf("-"));
            String count = range.substring(range.indexOf("-") + 1, range.length());
            int startInt = Integer.parseInt(start);
            int countInt = Integer.parseInt(count);
            String word = request.getParameter("word");
            word = new String(word.getBytes("ISO-8859-1"), "UTF-8");
            JSONArray features = null;
            try {
                //int tableCount = basis.searchCount(layerStr, word);
                //response.setHeader("Content-Range", "items " + startInt + "-" + countInt + "/" + tableCount);
                features = searchPage(layerStr, startInt, countInt, wkid, word);
            } catch (SeException e) {
                handlingSeException(e, obj);
            }

            out.write(features.toString());
            out.flush();
            out.close();
            return;
        }

        // out.write(JSONUtil.transferBeanToJSON(map));
        out.write(obj.toString());
        out.flush();
        out.close();
    }

    public String getOrderColumn(HttpServletRequest request) {
        Map parameterMap = request.getParameterMap();
        Iterator iterator = parameterMap.keySet().iterator();
        String orderColumn = "";
        while (iterator.hasNext()) {
            String key = (String) iterator.next();
            if (key.startsWith("sort")) {
                orderColumn = key;
                break;
            }
        }
        try {
            orderColumn = new String(orderColumn.getBytes("ISO-8859-1"), "UTF-8");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        if (orderColumn.indexOf("(") >= 0) {
            orderColumn = orderColumn.substring(orderColumn.indexOf("(") + 1,
                    orderColumn.indexOf(")")).trim();
        }

        return orderColumn;
    }

    /**
     * 验证用户是否是用户的创建者
     * 
     * @param layername
     * @param userid
     * @return
     * @throws Exception
     */
    public boolean isLayerPrivileges(String layername, int userid) throws Exception {

        List list = tableFactory.list(Layer.class, "layername = '" + layername + "' and userid="
                + userid);
        return list.size() > 0 ? true : false;

    }

    public JSONArray queryLayers() throws SeException, IOException {
        List<SeLayer> list = basis.getLayerList();
        JSONArray layers = new JSONArray();
        for (SeLayer sl : list) {
            if (!sl.getTableName().startsWith("GDB_")) {
                JSONObject layerJSON = UtilLayer.layerToJSON(sl);
                layers.add(layerJSON);
            }
        }
        return layers;
    }

    public JSONObject layerDesc(String tableName) throws Exception {
        SeLayer layer = basis.getLayer(tableName);
        List fieldList = basis.queryLayerDescriptionTable(tableName);
        JSONObject layerJSON = UtilLayer.layerToJSON(layer);
        layerJSON.put("fields", JSONArray.fromObject(fieldList));
        List laysers = tableFactory.list(Layer.class, "tablename ='" + tableName.toUpperCase()
                + "'");
        if (laysers.size() > 0) {
            layerJSON.put(Basis.TABLE_FILED_USERID, ((Layer) laysers.get(0)).getUserid());
        }
        logger.info("table name : " + layer.getTableName());

        return layerJSON;
    }

    public JSONArray queryCS() {
        int[] list = Basis.csList();
        JSONArray layes = new JSONArray();
        for (int code : list) {
            layes.add(code);

        }
        return layes;
    }

    public String createLayer(JSONObject layerJSON, int userid, JSONObject obj) {

        String layername = layerJSON.getString("layername");
        List columns = layerJSON.getJSONArray("fields");
        int wkid = layerJSON.getInt("wkid");
        int shapeType = layerJSON.getInt("shapetype");
        String msg = null;
        try {
            if (basis.isLayerExist(layername)) {
                msg = "图层名称 " + layername + " 已经存在!";
                obj.put("ret", false);
                obj.put("msg", msg);
                return msg;
            }

            String tableName = basis.generatorTableName(layername);
            basis.createLayer(tableName, layername, columns, wkid, shapeType);

            Layer layer = new Layer();
            layer.setLayername(layername.toUpperCase());
            layer.setTablename(tableName.toUpperCase());
            layer.setUserid(userid);
            layer.setGeotype(shapeType + "");
            tableFactory.insert(layer);
            SeLayer l = basis.getLayer(tableName);
            obj.put("ret", true);
            obj.put("layer", UtilLayer.layerToJSON(l));
        } catch (SeException e) {
            // logger.info(e.getMessage(), e);
            obj.put("ret", false);
            obj.put("msg", msg);
            switch (e.getSeError().getSdeError()) {

            case SeError.SE_DB_IO_ERROR:
                msg = "图层含有错误的字段！";
                break;
            case SeError.SE_TABLE_EXISTS:
                msg = "图层" + layername + "已经存在！";
                break;
            case SeError.SE_INVALID_PARAM_VALUE:
                msg = "图层名称过长！";
                break;

            } // End switch
            obj.put("msg", msg);
        } catch (IOException e) {
            e.printStackTrace();
        } catch (SecurityException e) {
            e.printStackTrace();
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
        }

        return msg;
    }

    public void deleteLayer(String tableName) throws IOException, SeException {
        basis.deleteTable(tableName);
        List layers = tableFactory.list(Layer.class, "tablename='" + tableName + "'");
        if (layers.size() > 0) {
            List alias = tableFactory.list(Alias.class,
                    "layerid=" + ((Layer) layers.get(0)).getId());
            if (alias.size() > 0)
                tableFactory.delete(Alias.class, "layerid=" + ((Layer) layers.get(0)).getId() + "");
        }
        tableFactory.delete(Layer.class, "tablename='" + tableName + "'");
    }

    public long addFeature(String tableName, JSONObject feature) throws SeException, IOException {

        SeShape shape = null;
        HashMap attriHashMap = null;
        if (feature.containsKey("geometry")) {
            JSONObject geometry = feature.getJSONObject("geometry");
            JSONObject spatialReference = geometry.getJSONObject("spatialReference");
            String wkid = "";
            if (spatialReference.containsKey("wkid")) {
                wkid = spatialReference.getString("wkid");
            } else if (spatialReference.containsKey("wkt")) {
                wkid = spatialReference.getString("wkt").split(":")[1];
            }
            if (geometry.containsKey("xmin")) {
                shape = createExtent(geometry, tableName, wkid);
            } else if (geometry.containsKey("x")) {
                shape = createPoint(geometry, tableName, wkid);
            } else if (geometry.containsKey("points")) {
                shape = createMultipoint(geometry, tableName, wkid);
            } else if (geometry.containsKey("paths")) {
                shape = createPolyline(geometry, tableName, wkid);
            } else if (geometry.containsKey("rings")) {
                shape = createPolygon(geometry, tableName, wkid);
            }
        }

        if (feature.containsKey("attributes")) {
            JSONObject attributes = feature.getJSONObject("attributes");
            attriHashMap = createAttributes(attributes);
        }
        attriHashMap = attriHashMap == null ? new HashMap() : attriHashMap;
        attriHashMap.put("SHAPE", shape);
        return basis.addRow(tableName, attriHashMap == null ? new HashMap() : attriHashMap);
    }

    public long addFeature(String tableName, JSONObject feature, int userid) throws SeException,
            IOException {

        SeShape shape = null;
        HashMap attriHashMap = null;
        if (feature.containsKey("geometry")) {
            JSONObject geometry = feature.getJSONObject("geometry");
            JSONObject spatialReference = geometry.getJSONObject("spatialReference");
            String wkid = "";
            if (spatialReference.containsKey("wkid")) {
                wkid = spatialReference.getString("wkid");
            } else if (spatialReference.containsKey("wkt")) {
                wkid = spatialReference.getString("wkt").split(":")[1];
            }
            if (geometry.containsKey("xmin")) {
                shape = createExtent(geometry, tableName, wkid);
            } else if (geometry.containsKey("x")) {
                shape = createPoint(geometry, tableName, wkid);
            } else if (geometry.containsKey("points")) {
                shape = createMultipoint(geometry, tableName, wkid);
            } else if (geometry.containsKey("paths")) {
                shape = createPolyline(geometry, tableName, wkid);
            } else if (geometry.containsKey("rings")) {
                shape = createPolygon(geometry, tableName, wkid);
            }
        }

        if (feature.containsKey("attributes")) {
            JSONObject attributes = feature.getJSONObject("attributes");
            attriHashMap = createAttributes(attributes);
        }
        attriHashMap = attriHashMap == null ? new HashMap() : attriHashMap;
        if (basis.fieldExixts(tableName, Basis.TABLE_FILED_USERID, SeColumnDefinition.TYPE_INTEGER)) {
            attriHashMap.put(Basis.TABLE_FILED_USERID.toUpperCase(), userid);
        }
        attriHashMap.put("SHAPE", shape);

        return basis.addRow(tableName, attriHashMap == null ? new HashMap() : attriHashMap);
    }

    public void delFeature(String tableName, String id) throws NumberFormatException, IOException,
            SeException {
        basis.deleteRow(tableName, Integer.parseInt(id));
    }

    public void upFeature(String tableName, String id, JSONObject feature) throws SeException,
            NumberFormatException, IOException {
        SeShape shape = null;
        HashMap attriHashMap = null;
        if (feature.containsKey("geometry")) {
            JSONObject geometry = feature.getJSONObject("geometry");
            JSONObject spatialReference = geometry.getJSONObject("spatialReference");
            String wkid = "";
            if (spatialReference.containsKey("wkid")) {
                wkid = spatialReference.getString("wkid");
            } else if (spatialReference.containsKey("wkt")) {
                wkid = spatialReference.getString("wkt").split(":")[1];
            }

            if (geometry.containsKey("xmin")) {
                shape = createExtent(geometry);
            } else if (geometry.containsKey("x")) {
                shape = createPoint(geometry, tableName, wkid);
            } else if (geometry.containsKey("points")) {
                shape = createMultipoint(geometry);
            } else if (geometry.containsKey("paths")) {
                shape = createPolyline(geometry, tableName, wkid);
            } else if (geometry.containsKey("rings")) {
                shape = createPolygon(geometry, tableName, wkid);
            }

        }

        if (feature.containsKey("attributes")) {
            JSONObject attributes = (JSONObject) feature.get("attributes");
            attriHashMap = createAttributes(attributes);
        }
        attriHashMap = attriHashMap == null ? new HashMap() : attriHashMap;
        attriHashMap.put("SHAPE", shape);
        basis.updateRow(tableName, Integer.parseInt(id), attriHashMap);
    }

    public JSONObject queryByID(String tableName, String id, String wkid) throws SeException,
            IOException {
        JSONObject resultJSON = new JSONObject();
        HashMap<String, Integer> columnDefMap = basis.getColumnsType(tableName);

        JSONArray rows = new JSONArray();
        List rowList = basis.queryByID(tableName, id);
        Iterator interator = rowList.iterator();
        PeCoordinateSystem fromCS = basis.getCoordSys(tableName);
        try {
            fromCS = fromCS == null ? PeFactory.geogcs(4326) : fromCS;
        } catch (PeProjectionException e) {
            e.printStackTrace();
        }
        while (interator.hasNext()) {
            HashMap columnMap = (HashMap) interator.next();
            JSONObject rowJSON = rowToJSON(columnMap, columnDefMap, true, fromCS, wkid);
            rows.add(rowJSON);
        }

        resultJSON.put("columndef", columnToJSON(columnDefMap));
        resultJSON.put("rows", rows);
        return resultJSON;
    }

    public JSONObject queryByBox(String tableName, String box, String wkid) throws SeException,
            IOException {
        JSONObject resultJSON = new JSONObject();
        String[] boxs = box.split(",");

        HashMap<String, Integer> columnDefMap = basis.getColumnsType(tableName);
        JSONObject columnDef = JSONObject.fromObject(columnDefMap);
        JSONArray rows = new JSONArray();
        List rowList = basis.queryByBox(tableName, Double.parseDouble(boxs[0]),
                Double.parseDouble(boxs[1]), Double.parseDouble(boxs[2]),
                Double.parseDouble(boxs[3]));
        PeCoordinateSystem fromCS = basis.getCoordSys(tableName);
        Iterator interator = rowList.iterator();
        while (interator.hasNext()) {
            HashMap columnMap = (HashMap) interator.next();
            JSONObject rowJSON = rowToJSON(columnMap, columnDefMap, false, fromCS, wkid);
            rows.add(rowJSON);
        }
        resultJSON.put("columndef", columnDef);
        resultJSON.put("rows", rows);
        return resultJSON;
    }

    public void trasColumn(List rowList) {

        for (int i = 0; i < rowList.size(); i++) {
            HashMap column = (HashMap) rowList.get(i);
            column.remove("ID");
            Integer type = (Integer) column.get("TYPE");
            String val = "esriFieldTypeString";
            // "esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeDouble", "esriFieldTypeString",
            // "esriFieldTypeDate", "esriFieldTypeOID", "esriFieldTypeGeometry", "esriFieldTypeBlob", "esriFieldTypeRaster", "esriFieldTypeGUID",
            // "esriFieldTypeGlobalID", "esriFieldTypeXML"
            switch (type) {
            default:
                // logger.info("default");
                break;
            case SeColumnDefinition.TYPE_STRING:
                val = "esriFieldTypeString";
                break;
            case SeColumnDefinition.TYPE_INTEGER:
                val = "esriFieldTypeInteger";
                break;
            case SeColumnDefinition.TYPE_SMALLINT:
                val = "esriFieldTypeSmallInteger";
                break;
            case SeColumnDefinition.TYPE_FLOAT:
                val = "esriFieldTypeSingle";
                break;
            case SeColumnDefinition.TYPE_DOUBLE:
                val = "esriFieldTypeDouble";
                break;
            case SeColumnDefinition.TYPE_DATE:
                val = "esriFieldTypeDate";
                break;
            }
            column.put("TYPE", val);
        }

    }

    public JSONObject queryColumndef(String tableName, String wkid) throws SeException, IOException {
        JSONObject resultJSON = new JSONObject();
        List fieldList = basis.queryLayerDescriptionTable2(tableName);
        trasColumn(fieldList);

        SeLayer layer = basis.getLayer(tableName);
        if (layer.isLine()) {
            resultJSON.put("type", "esriGeometryPolyline");
        } else if (layer.isPoly()) {
            resultJSON.put("type", "esriGeometryPolygon");
        } else if (layer.isPoint()) {
            resultJSON.put("type", "esriGeometryPoint");
        }
        resultJSON.put("columndef", JSONArray.fromObject(fieldList));
        return resultJSON;
    }

    public JSONArray queryAllpage(String tableName, int start, int end, String wkid,
            String orderColumn, String descOrAsc) throws SeException, IOException {
        HashMap<String, Integer> columnDefMap = basis.getColumnsType(tableName);

        JSONArray rows = new JSONArray();

        List rowList = basis.queryPage(tableName, start, end, orderColumn, descOrAsc);
        // List rowList = basis.queryAll(tableName, start, count,"OBJECTID");
        Iterator interator = rowList.iterator();
        PeCoordinateSystem fromCS = basis.getLayer(tableName).getCoordRef().getCoordSys();
        while (interator.hasNext()) {
            HashMap columnMap = (HashMap) interator.next();
            JSONObject rowJSON = rowToJSON(columnMap, columnDefMap, true, fromCS, wkid);
            rows.add(rowJSON);
        }

        return rows;
    }

    public JSONArray queryAllpage(String tableName, int start, int end, String wkid,
            String orderColumn, int userid, String descOrAsc) throws SeException, IOException {
        HashMap<String, Integer> columnDefMap = basis.getColumnsType(tableName);

        JSONArray rows = new JSONArray();

        List rowList = basis.queryPage(tableName, start, end, orderColumn, userid, descOrAsc);
        // List rowList = basis.queryAll(tableName, start, count,"OBJECTID");
        Iterator interator = rowList.iterator();
        PeCoordinateSystem fromCS = basis.getLayer(tableName).getCoordRef().getCoordSys();
        while (interator.hasNext()) {
            HashMap columnMap = (HashMap) interator.next();
            JSONObject rowJSON = rowToJSON(columnMap, columnDefMap, true, fromCS, wkid);
            rows.add(rowJSON);
        }

        return rows;
    }

    public JSONArray searchPage(String tableName, int start, int end, String wkid, String word)
            throws SeException, IOException {

        HashMap<String, Integer> columnDefMap = basis.getColumnsType(tableName);

        JSONArray rows = new JSONArray();

        List rowList = basis.searchPage(tableName, start, end, word);
        // List rowList = basis.queryAll(tableName, start, count,"OBJECTID");
        Iterator interator = rowList.iterator();
        PeCoordinateSystem fromCS = basis.getLayer(tableName).getCoordRef().getCoordSys();
        while (interator.hasNext()) {
            HashMap columnMap = (HashMap) interator.next();
            JSONObject rowJSON = rowToJSON(columnMap, columnDefMap, true, fromCS, wkid);
            rows.add(rowJSON);
        }

        return rows;
    }

    public JSONArray searchPage(String tableName, int start, int end, String wkid, String word,
            int userid) throws SeException, IOException {

        HashMap<String, Integer> columnDefMap = basis.getColumnsType(tableName);

        JSONArray rows = new JSONArray();

        List rowList = basis.searchPage(tableName, start, end, word, userid);
        Iterator interator = rowList.iterator();
        PeCoordinateSystem fromCS = basis.getLayer(tableName).getCoordRef().getCoordSys();
        while (interator.hasNext()) {
            HashMap columnMap = (HashMap) interator.next();
            JSONObject rowJSON = rowToJSON(columnMap, columnDefMap, true, fromCS, wkid);
            rows.add(rowJSON);
        }

        return rows;
    }

    public JSONArray columnToJSON(HashMap<String, Integer> columnDefMap) {
        JSONArray columns = new JSONArray();
        Iterator interator = columnDefMap.keySet().iterator();

        while (interator.hasNext()) {
            String columnName = (String) interator.next();
            JSONObject column = new JSONObject();
            column.put("name", columnName);
            column.put("field", columnName);

            String val = "";
            int type = columnDefMap.get(columnName);
            switch (type) {
            default:
                logger.info("default");
                break;
            case SeColumnDefinition.TYPE_BLOB:
                val = "BLOB";
                break;
            case SeColumnDefinition.TYPE_CLOB:
                val = "CLOB";
                break;
            case SeColumnDefinition.TYPE_DATE:
                val = "DATE";

                break;
            case SeColumnDefinition.TYPE_FLOAT64:
                val = "FLOAT64";
                break;
            case SeColumnDefinition.TYPE_INT16:
                val = "INT16";
                break;
            case SeColumnDefinition.TYPE_INT32:
                val = "INT32";
                break;
            case SeColumnDefinition.TYPE_INT64:
                val = "INT64";
                break;
            case SeColumnDefinition.TYPE_NCLOB:
                val = "NCLOB";
                break;
            case SeColumnDefinition.TYPE_NSTRING:
                val = "NSTRING";
                break;
            case SeColumnDefinition.TYPE_RASTER:
                val = "RASTER";
                break;
            case SeColumnDefinition.TYPE_SHAPE:
                val = "SHAPE";
                break;
            case SeColumnDefinition.TYPE_STRING:
                val = "STRING";
                break;
            case SeColumnDefinition.TYPE_UUID:
                val = "UUID";
                break;
            case SeColumnDefinition.TYPE_XML:
                val = "XML";
                break;
            }
            column.put("type", val);
            columns.add(column);
        }

        return columns;
    }

    public JSONObject rowToJSON(HashMap rowMap, HashMap<String, Integer> columnDefMap,
            boolean isTransformShape, PeCoordinateSystem fromCS, String wkid) throws SeException {
        Iterator rowMapInterator = rowMap.entrySet().iterator();
        Iterator columnDefMapInterator = columnDefMap.keySet().iterator();
        // JSONArray dataArr = JSONArray.fromObject(rowMap);
        JSONObject rowJSON = new JSONObject();
        // int cdCode = -1;
        // if (wkid != null)
        // cdCode = Integer.parseInt(wkid);
        while (columnDefMapInterator.hasNext()) {
            String columnName = (String) columnDefMapInterator.next();
            Object val = rowMap.get(columnName);
            if (val == null)
                continue;
            int type = columnDefMap.get(columnName);
            switch (type) {
            default:
                logger.info("default");
                break;
            case SeColumnDefinition.TYPE_BLOB:
                break;
            case SeColumnDefinition.TYPE_CLOB:
                break;
            case SeColumnDefinition.TYPE_DATE:
                // Calendar cal = Calendar.getInstance();
                // cal.setTime(((GregorianCalendar) val).getTime());
                rowJSON.put(columnName, ((GregorianCalendar) val).getTimeInMillis());
                break;
            case SeColumnDefinition.TYPE_FLOAT64:
                rowJSON.put(columnName, (Double) val);
                break;
            case SeColumnDefinition.TYPE_FLOAT:
                rowJSON.put(columnName, (Float) val);
                break;
            case SeColumnDefinition.TYPE_INT16:
                rowJSON.put(columnName, (Short) val);
                break;
            case SeColumnDefinition.TYPE_INT32:
                rowJSON.put(columnName, (Integer) val);
                break;
            case SeColumnDefinition.TYPE_INT64:
                rowJSON.put(columnName, (Long) val);
                break;
            case SeColumnDefinition.TYPE_NCLOB:
                break;
            case SeColumnDefinition.TYPE_NSTRING:
                rowJSON.put(columnName, (String) val);
                break;
            case SeColumnDefinition.TYPE_RASTER:
                break;
            case SeColumnDefinition.TYPE_SHAPE:
                // rowJSON.put(columnName, shapeToJSON((SeShape) val));
                if (isTransformShape)
                    rowJSON.put(columnName, shapeToJSON((SeShape) val, fromCS, wkid));
                else
                    rowJSON.put(columnName, shapeType((SeShape) val));

                break;
            case SeColumnDefinition.TYPE_STRING:
                rowJSON.put(columnName, (String) val);
                break;
            case SeColumnDefinition.TYPE_UUID:
                rowJSON.put(columnName, (String) val);
                break;
            case SeColumnDefinition.TYPE_XML:
                break;
            }

        }

        return rowJSON;
    }

    public JSONObject shapeToJSON(SeShape shape, PeCoordinateSystem fromCS, String wkid)
            throws SeException {

        /*
         * Retrieve the shape type.
         */
        int type = shape.getType();
        int toCS = Integer.parseInt(wkid);

        JSONObject result = null;
        switch (type) {
        default:
            result = new JSONObject();
            break;
        case SeShape.TYPE_LINE:
            result = JSONPPolyline(shape, fromCS, toCS);
            break;
        case SeShape.TYPE_MULTI_LINE:
            result = JSONPPolyline(shape, fromCS, toCS);

            break;
        case SeShape.TYPE_MULTI_POINT:
            result = JSONMultipoint(shape, fromCS, toCS);

            break;
        case SeShape.TYPE_MULTI_POLYGON:
            result = JSONPolygon(shape, fromCS, toCS);

            break;
        case SeShape.TYPE_MULTI_SIMPLE_LINE:
            result = JSONPPolyline(shape, fromCS, toCS);

            break;
        case SeShape.TYPE_NIL:
            result = new JSONObject();
            break;
        case SeShape.TYPE_POINT:
            result = JSONPoint(shape, fromCS, toCS);

            break;
        case SeShape.TYPE_POLYGON:
            result = JSONPolygon(shape, fromCS, toCS);

            break;
        case SeShape.TYPE_SIMPLE_LINE:
            result = JSONPPolyline(shape, fromCS, toCS);
            break;
        } // End switch
        result.put("spatialReference", "wkid:" + wkid);
        return result;
    }

    public String shapeType(SeShape shape) {

        /*
         * Retrieve the shape type.
         */
        int type = -1;
        try {
            type = shape.getType();
        } catch (SeException e) {
            logger.error("异常", e);
            ;
        }

        return shapeType(type);
    }

    public String shapeType(int type) {

        String result = "null";
        // logger.info("Shape Type : ");
        switch (type) {

        case SeShape.TYPE_LINE:
            result = "Line";
            break;
        case SeShape.TYPE_MULTI_LINE:
            result = "Multi Line";
            break;
        case SeShape.TYPE_MULTI_POINT:
            result = "Multi point";
            break;
        case SeShape.TYPE_MULTI_POLYGON:
            result = "Polygon";
            break;
        case SeShape.TYPE_MULTI_SIMPLE_LINE:
            result = "Multi Simple Line";
            break;
        case SeShape.TYPE_NIL:
            result = "Nil";
            break;
        case SeShape.TYPE_POINT:
            result = "Point";
            break;
        case SeShape.TYPE_POLYGON:
            result = "Polygon";
            break;
        case SeShape.TYPE_SIMPLE_LINE:
            result = "Simple Line";
            break;
        } // End switch

        return result;
    }

    public JSONObject JSONPoint(SeShape shape, int fromCSCode, int toCSCode) {

        JSONObject point = new JSONObject();
        // point.put("type", "point");
        /*
         * Retrieve coordinate points of the shape
         */
        // logger.info("\n\t\tShape Coordinates : ");
        double points[][][];
        try {

            points = shape.getAllCoords();

            int numParts = shape.getNumParts();
            // logger.info("\t\tNo. of parts : " + numParts);
            // logger.info("\t\tNo. of points : " + shape.getNumOfPoints());

            for (int partNo = 0; partNo < numParts; partNo++) {

                int numSubParts = shape.getNumSubParts(partNo + 1);
                // logger.info("\t\tNo. of sub-parts : " + numSubParts);

                for (int subPartNo = 0; subPartNo < numSubParts; subPartNo++) {

                    int numCoords = shape.getNumPoints(partNo + 1, subPartNo + 1);
                    // logger.info("\t\tNo. of coordinates : " + numCoords);

                    for (int pointNo = 0; pointNo < numCoords; pointNo++) {
                        double[] xy = Basis.trans(points[partNo][subPartNo][pointNo],
                                points[partNo][subPartNo][(pointNo + 1)], fromCSCode, toCSCode);
                        point.put("x", xy[0]);
                        point.put("y", xy[1]);
                        // logger.info("\t\tX: " + points[partNo][subPartNo][pointNo] + "\tY: "
                        // + points[partNo][subPartNo][(pointNo + 1)]);
                    }
                }
            }

        } catch (SeException e) {
            logger.error("异常", e);
            ;
        }
        return point;
    }

    public JSONObject JSONPoint(SeShape shape, PeCoordinateSystem fromCS, int toCSCode) {

        JSONObject point = new JSONObject();
        // point.put("type", "point");
        /*
         * Retrieve coordinate points of the shape
         */
        // logger.info("\n\t\tShape Coordinates : ");
        double points[][][];
        try {

            points = shape.getAllCoords();

            int numParts = shape.getNumParts();

            for (int partNo = 0; partNo < numParts; partNo++) {

                int numSubParts = shape.getNumSubParts(partNo + 1);

                for (int subPartNo = 0; subPartNo < numSubParts; subPartNo++) {

                    int numCoords = shape.getNumPoints(partNo + 1, subPartNo + 1);

                    for (int pointNo = 0; pointNo < numCoords; pointNo++) {
                        double[] xy = Basis.trans(points[partNo][subPartNo][pointNo],
                                points[partNo][subPartNo][(pointNo + 1)], fromCS, toCSCode);
                        point.put("x", xy[0]);
                        point.put("y", xy[1]);

                    }
                }
            }

        } catch (SeException e) {
            logger.error("异常", e);
        }
        return point;
    }

    public JSONObject JSONMultipoint(SeShape shape, PeCoordinateSystem fromCS, int toCSCode) {

        JSONObject multipoint = new JSONObject();
        // multipoint.put("type", "multipoint");

        JSONArray pointsArray = new JSONArray();

        /*
         * Retrieve coordinate points of the shape
         */
        // logger.info("\n\t\tShape Coordinates : ");
        double points[][][];
        try {

            points = shape.getAllCoords();

            int numParts = shape.getNumParts();
            // logger.info("\t\tNo. of parts : " + numParts);
            // logger.info("\t\tNo. of points : " + shape.getNumOfPoints());

            for (int partNo = 0; partNo < numParts; partNo++) {

                int numSubParts = shape.getNumSubParts(partNo + 1);
                // logger.info("\t\tNo. of sub-parts : " + numSubParts);

                for (int subPartNo = 0; subPartNo < numSubParts; subPartNo++) {

                    int numCoords = shape.getNumPoints(partNo + 1, subPartNo + 1);
                    // logger.info("\t\tNo. of coordinates : " + numCoords);

                    for (int pointNo = 0; pointNo < numCoords; pointNo++) {
                        double[] xy = Basis.trans(points[partNo][subPartNo][pointNo],
                                points[partNo][subPartNo][(pointNo + 1)], fromCS, toCSCode);
                        JSONArray point = new JSONArray();
                        point.add(xy[0]);
                        point.add(xy[1]);
                        pointsArray.add(point);
                        // logger.info("\t\tX: " + points[partNo][subPartNo][pointNo] + "\tY: "
                        // + points[partNo][subPartNo][(pointNo + 1)]);
                    }
                }
            }

        } catch (SeException e) {
            logger.error("异常", e);
            ;
        }
        multipoint.put("points", pointsArray);
        return multipoint;
    }

    public JSONObject JSONMultipoint(SeShape shape, int fromCSCode, int toCSCode) {

        JSONObject multipoint = new JSONObject();
        // multipoint.put("type", "multipoint");

        JSONArray pointsArray = new JSONArray();

        /*
         * Retrieve coordinate points of the shape
         */
        // logger.info("\n\t\tShape Coordinates : ");
        double points[][][];
        try {

            points = shape.getAllCoords();

            int numParts = shape.getNumParts();
            // logger.info("\t\tNo. of parts : " + numParts);
            // logger.info("\t\tNo. of points : " + shape.getNumOfPoints());

            for (int partNo = 0; partNo < numParts; partNo++) {

                int numSubParts = shape.getNumSubParts(partNo + 1);
                // logger.info("\t\tNo. of sub-parts : " + numSubParts);

                for (int subPartNo = 0; subPartNo < numSubParts; subPartNo++) {

                    int numCoords = shape.getNumPoints(partNo + 1, subPartNo + 1);
                    // logger.info("\t\tNo. of coordinates : " + numCoords);

                    for (int pointNo = 0; pointNo < numCoords; pointNo++) {
                        JSONArray point = new JSONArray();
                        point.add(points[partNo][subPartNo][pointNo]);
                        point.add(points[partNo][subPartNo][(pointNo + 1)]);
                        pointsArray.add(point);
                        // logger.info("\t\tX: " + points[partNo][subPartNo][pointNo] + "\tY: "
                        // + points[partNo][subPartNo][(pointNo + 1)]);
                    }
                }
            }

        } catch (SeException e) {
            logger.error("异常", e);
            ;
        }
        multipoint.put("points", pointsArray);
        return multipoint;
    }

    public JSONObject JSONPPolyline(SeShape shape, PeCoordinateSystem fromCS, int toCSCode) {

        JSONObject polyline = new JSONObject();
        // polyline.put("type", "polyline");

        JSONArray paths = new JSONArray();
        /*
         * Retrieve coordinate points of the shape
         */
        double points[][][];
        try {

            points = shape.getAllCoords();

            int numParts = shape.getNumParts();
            for (int partNo = 0; partNo < numParts; partNo++) {

                int numSubParts = shape.getNumSubParts(partNo + 1);

                JSONArray path = new JSONArray();

                for (int subPartNo = 0; subPartNo < numSubParts; subPartNo++) {
                    JSONArray subPath = new JSONArray();

                    int numCoords = shape.getNumPoints(partNo + 1, subPartNo + 1);

                    numCoords = numCoords * 2;
                    for (int pointNo = 0; pointNo < numCoords; pointNo += 2) {
                        JSONArray point = new JSONArray();
                        double[] xy = Basis.trans(points[partNo][subPartNo][pointNo],
                                points[partNo][subPartNo][(pointNo + 1)], fromCS, toCSCode);
                        point.add(xy[0]);
                        point.add(xy[1]);
                        subPath.add(point);
                    }
                    path.add(subPath);
                }
                paths.add(path);
            }

        } catch (SeException e) {
            logger.error("异常", e);
        }
        polyline.put("paths", paths.getJSONArray(0));
        return polyline;
    }

    public JSONObject JSONPPolyline(SeShape shape, int fromCSCode, int toCSCode) {

        JSONObject polyline = new JSONObject();
        // polyline.put("type", "polyline");

        JSONArray paths = new JSONArray();
        /*
         * Retrieve coordinate points of the shape
         */
        double points[][][];
        try {

            points = shape.getAllCoords();

            int numParts = shape.getNumParts();

            for (int partNo = 0; partNo < numParts; partNo++) {

                int numSubParts = shape.getNumSubParts(partNo + 1);
                // logger.info("\t\tNo. of sub-parts : " + numSubParts);
                JSONArray path = new JSONArray();

                for (int subPartNo = 0; subPartNo < numSubParts; subPartNo++) {
                    JSONArray subPath = new JSONArray();

                    int numCoords = shape.getNumPoints(partNo + 1, subPartNo + 1);
                    numCoords = numCoords * 2;
                    for (int pointNo = 0; pointNo < numCoords; pointNo += 2) {
                        JSONArray point = new JSONArray();
                        double[] xy = Basis.trans(points[partNo][subPartNo][pointNo],
                                points[partNo][subPartNo][(pointNo + 1)], fromCSCode, toCSCode);
                        point.add(xy[0]);
                        point.add(xy[1]);
                        subPath.add(point);
                    }
                    path.add(subPath);
                }
                paths.add(path);
            }

        } catch (SeException e) {
            logger.error("异常", e);

        }
        polyline.put("paths", paths.getJSONArray(0));
        return polyline;
    }

    public JSONObject JSONPolygon(SeShape shape, PeCoordinateSystem fromCS, int toCSCode) {

        JSONObject polygon = new JSONObject();
        // polygon.put("type", "polygon");

        double points[][][];
        try {

            points = shape.getAllCoords();

            int numParts = shape.getNumParts();

            for (int partNo = 0; partNo < numParts; partNo++) {

                int numSubParts = shape.getNumSubParts(partNo + 1);

                JSONArray rings = new JSONArray();
                for (int subPartNo = 0; subPartNo < numSubParts; subPartNo++) {
                    JSONArray ring = new JSONArray();
                    int numCoords = shape.getNumPoints(partNo + 1, subPartNo + 1);

                    numCoords = numCoords * 2;
                    for (int pointNo = 0; pointNo < numCoords; pointNo += 2) {
                        JSONArray point = new JSONArray();
                        double[] xy = Basis.trans(points[partNo][subPartNo][pointNo],
                                points[partNo][subPartNo][(pointNo + 1)], fromCS, toCSCode);
                        point.add(xy[0]);
                        point.add(xy[1]);

                        ring.add(point);

                    }
                    rings.add(ring);
                }
                polygon.put("rings", rings);
            }

        } catch (SeException e) {
            logger.error("异常", e);
        }

        return polygon;
    }

    public JSONObject JSONPolygon(SeShape shape, int fromCSCode, int toCSCode) {

        JSONObject polygon = new JSONObject();
        // polygon.put("type", "polygon");

        double points[][][];
        try {

            points = shape.getAllCoords();

            int numParts = shape.getNumParts();

            for (int partNo = 0; partNo < numParts; partNo++) {

                int numSubParts = shape.getNumSubParts(partNo + 1);

                JSONArray rings = new JSONArray();
                for (int subPartNo = 0; subPartNo < numSubParts; subPartNo++) {
                    JSONArray ring = new JSONArray();
                    int numCoords = shape.getNumPoints(partNo + 1, subPartNo + 1);

                    numCoords = numCoords * 2;
                    for (int pointNo = 0; pointNo < numCoords; pointNo += 2) {
                        JSONArray point = new JSONArray();
                        double[] xy = Basis.trans(points[partNo][subPartNo][pointNo],
                                points[partNo][subPartNo][(pointNo + 1)], fromCSCode, toCSCode);
                        point.add(xy[0]);
                        point.add(xy[1]);

                        ring.add(point);

                    }
                    rings.add(ring);
                }
                polygon.put("rings", rings);
            }

        } catch (SeException e) {
            logger.error("异常", e);

        }

        return polygon;
    }

    public SeShape createExtent(JSONObject extent) throws SeException {
        SeCoordinateReference coordref = new SeCoordinateReference();
        SeShape shape = new SeShape(coordref);
        SeExtent rectangle = new SeExtent();
        rectangle.setMinX(extent.getDouble("xmin"));
        rectangle.setMinY(extent.getDouble("ymin"));
        rectangle.setMaxX(extent.getDouble("xmax"));
        rectangle.setMaxY(extent.getDouble("ymax"));
        shape.generateRectangle(rectangle);

        return shape;
    }

    public SeShape createExtent(JSONObject extent, String layerName, String wkid)
            throws SeException, IOException {

        int fromCS = Integer.parseInt(wkid);
        fromCS = fromCS == 102100 ? 102113 : fromCS;
        fromCS = fromCS < 0 ? 4326 : fromCS;

        SeCoordinateReference coordref = basis.getCoordinateReference(layerName);
        int toCS = coordref.getCoordSys().getCode();
        toCS = toCS == 102100 ? 102113 : toCS;
        toCS = toCS < 0 ? 4326 : toCS;

        double[] xy = Basis.trans(extent.getDouble("xmin"), extent.getDouble("ymin"), fromCS,
                coordref.getCoordSys());

        SeShape shape = new SeShape(coordref);
        SeExtent rectangle = new SeExtent();
        rectangle.setMinX(xy[0]);
        rectangle.setMinY(xy[1]);

        xy = Basis.trans(extent.getDouble("xmax"), extent.getDouble("ymax"), fromCS,
                coordref.getCoordSys());
        rectangle.setMaxX(xy[0]);
        rectangle.setMaxY(xy[1]);
        shape.generateRectangle(rectangle);

        return shape;
    }

    public SeShape createPoint(JSONObject point, String layerName, String wkid) throws SeException,
            IOException {

        int fromCS = Integer.parseInt(wkid);
        fromCS = fromCS == 102100 ? 102113 : fromCS;
        fromCS = fromCS < 0 ? 4326 : fromCS;
        SeCoordinateReference coordref = createCoordRef(layerName);
        double[] xy = Basis.trans(point.getDouble("x"), point.getDouble("y"), fromCS,
                coordref.getCoordSys());
        // double[] xy = { point.getDouble("x"), point.getDouble("y") };
        SeShape shape = new SeShape(coordref);
        SDEPoint sdePoint = new SDEPoint(xy[0], xy[1]);
        // SDEPoint sdePoint = new SDEPoint(120.0, 30.0);
        SDEPoint[] sdePoints = { sdePoint };
        shape.generatePoint(1, sdePoints);

        return shape;
    }

    public SeShape createMultipoint(JSONObject multipoint, String layerName, String wkid)
            throws SeException, IOException {

        int fromCS = Integer.parseInt(wkid);
        fromCS = fromCS == 102100 ? 102113 : fromCS;
        fromCS = fromCS < 0 ? 4326 : fromCS;
        SeCoordinateReference coordref = createCoordRef(layerName);
        SeShape shape = new SeShape(coordref);
        JSONArray points = multipoint.getJSONArray("points");

        SDEPoint[] ptArray = new SDEPoint[points.size()];
        for (int i = 0; i < points.size(); i++) {
            double[] xy = Basis.trans(points.getJSONArray(i).getDouble(0), points.getJSONArray(i)
                    .getDouble(1), fromCS, coordref.getCoordSys());

            ptArray[i] = new SDEPoint(xy[0], xy[1]);
        }
        shape.generatePoint(points.size(), ptArray);

        return shape;
    }

    public SeShape createMultipoint(JSONObject multipoint) throws SeException {

        SeCoordinateReference coordref = new SeCoordinateReference();
        SeShape shape = new SeShape(coordref);
        JSONArray points = multipoint.getJSONArray("points");

        SDEPoint[] ptArray = new SDEPoint[points.size()];
        for (int i = 0; i < points.size(); i++) {

            ptArray[i] = new SDEPoint(points.getJSONArray(i).getDouble(0), points.getJSONArray(i)
                    .getDouble(1));
        }
        shape.generatePoint(points.size(), ptArray);

        return shape;
    }

    public SeShape createPolyline(JSONObject polyline, String layerName, String wkid)
            throws SeException, IOException {
        int fromCS = Integer.parseInt(wkid);
        fromCS = fromCS == 102100 ? 102113 : fromCS;
        fromCS = fromCS < 0 ? 4326 : fromCS;
        SeCoordinateReference coordref = createCoordRef(layerName);
        SeShape shape = new SeShape(coordref);
        JSONArray paths = polyline.getJSONArray("paths");
        int numParts = paths.size();
        int[] partOffsets = new int[numParts];
        ArrayList<SDEPoint> ptList = new ArrayList<SDEPoint>();
        int numPts = 0;
        for (int i = 0; i < paths.size(); i++) {
            JSONArray points = paths.getJSONArray(i);
            partOffsets[i] = numPts;

            for (int j = 0; j < points.size(); j++) {

                numPts++;
                double[] xy = Basis.trans(points.getJSONArray(j).getDouble(0),
                        points.getJSONArray(j).getDouble(1), fromCS, coordref.getCoordSys());
                ptList.add(new SDEPoint(xy[0], xy[1]));
            }
        }
        SDEPoint[] ptArray = new SDEPoint[ptList.size()];
        ptList.toArray(ptArray);
        shape.generateLine(numPts, numParts, partOffsets, ptArray);

        return shape;
    }

    public SeCoordinateReference createCoordRef(String layerName) {
        SeCoordinateReference coordref = null;
        try {
            coordref = basis.getCoordinateReference(layerName);
            int toCS = coordref.getCoordSys().getCode();
            toCS = toCS == 102100 ? 102113 : toCS;
            toCS = toCS < 0 ? 4326 : toCS;
            // SeExtent ext = null;
            // if (toCS == 4326) {
            // ext = new SeExtent(-180, -90, 180, 90);
            // } else {
            // ext = new SeExtent(-180, -90, 180, 90);
            // }
            // /coordref.setXYByEnvelope(ext);
            // coordref.setXY(0.000001, 0.000001, 1000000);
            // coordref.setXYByEnvelope(ext);
        } catch (IOException e) {
            e.printStackTrace();
        }
        // catch (SeException e) {
        // e.printStackTrace();
        // }
        return coordref;
    }

    public SeShape createPolygon(JSONObject polygon, String layerName, String wkid)
            throws SeException, IOException {
        int fromCS = Integer.parseInt(wkid);
        fromCS = fromCS == 102100 ? 102113 : fromCS;
        fromCS = fromCS < 0 ? 4326 : fromCS;
        SeCoordinateReference coordref = createCoordRef(layerName);
        SeShape shape = new SeShape(coordref);

        JSONArray rings = polygon.getJSONArray("rings");
        int numParts = rings.size();
        int[] partOffsets = new int[numParts];
        ArrayList<SDEPoint> ptList = new ArrayList<SDEPoint>();
        int numPts = 0;
        for (int i = 0; i < rings.size(); i++) {
            JSONArray points = rings.getJSONArray(i);
            partOffsets[i] = numPts;
            for (int j = 0; j < points.size(); j++) {

                numPts++;
                double[] xy = Basis.trans(points.getJSONArray(j).getDouble(0),
                        points.getJSONArray(j).getDouble(1), fromCS, coordref.getCoordSys());
                logger.info(xy[0] + ", " + xy[1]);
                ptList.add(new SDEPoint(xy[0], xy[1]));
            }
        }
        SDEPoint[] ptArray = new SDEPoint[ptList.size()];
        ptList.toArray(ptArray);
        shape.generatePolygon(numPts, numParts, partOffsets, ptArray);
        return shape;
    }

    public HashMap createAttributes(JSONObject attributes) {
        HashMap attriHashMap = new HashMap();
        for (Iterator iter = attributes.keys(); iter.hasNext();) { // 先遍历整个属性 对象
            String key = (String) iter.next();
            if (!(attributes.get(key) instanceof JSONNull))
                attriHashMap.put(key, attributes.get(key));
        }
        return attriHashMap;
    }

    public void updateLayerName(String oldName, String newName) throws SeException, IOException {
        basis.updateLayerName(oldName, newName);
    }

    public static String mapURLToJSON() {
        return mapList.toString();
    }

    @Override
    public String getInitParameter(String name) {
        String value = getServletContext().getInitParameter(name);
        if (value == null) {
            value = super.getInitParameter(name);
        }
        return value;
    }

    private void handlingSeException(SeException e, JSONObject obj) {

        e.printStackTrace();

        obj.put("ret", false);
        switch (e.getSeError().getSdeError()) {
        case -155:

            obj.put("msg", "错误的多边形，多边形的边框不能自相交");
            break;
        case -148:

            obj.put("msg", "错误的多边形，多边形不能少于3点");
            break;
        case -37:

            obj.put("msg", "图层已经删除！");
            break;
        case -248:

            obj.put("msg", "图层被其他人使用不能被删除！");
            break;
        default:
            obj.put("msg", "不能处理的异常！");
            break;

        }
    }

}
