package com.dien.manager.servlet;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.lang.reflect.InvocationTargetException;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

import javax.servlet.Servlet;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.JsonConfig;

import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.log4j.Logger;
import org.geotools.arcsde.session.UnavailableConnectionException;

import com.dien.manager.dao.bean.Config;
import com.dien.manager.dao.bean.PointSymbol;
import com.dien.manager.dao.bean.User;
import com.dien.manager.tools.CopyFile;
import com.dien.manager.tools.DateJsonValueProcessor;
import com.dien.manager.tools.TableFactory;
import com.esri.sde.sdk.client.SeException;

/**
 * Servlet implementation class ManagerServlet
 */
public class ManagerPointSymbolServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private static final String defaultImg = "point.png";

    private static Logger logger = Logger.getLogger(ManagerPointSymbolServlet.class);

    public static final String TOKEN = "token";

    // 限制文件的上传大小
    private int maxPostSize = 100 * 1024;

    TableFactory tableFactory = null;

    /**
     * @see HttpServlet#HttpServlet()
     */
    public ManagerPointSymbolServlet() {
        super();
        // TODO Auto-generated constructor stub
    }

    /**
     * @see Servlet#init(ServletConfig)
     */
    public void init(ServletConfig config) throws ServletException {

        tableFactory = new TableFactory();

    }

    /**
     * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
     */
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        doPost(request, response);
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession();
        User users = (User) session.getAttribute("user");
        if (users != null) {
            boolean isManager = users.isDataAuth();
            if (isManager) {
                doPostManager(request, response);
            } else {
                doPostNormal(request, response);
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
    protected void doPostManager(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // 操作
        String operate = request.getParameter("oper");
        response.setContentType("text/html;charset=utf-8");

/*        if ("add".equals(operate)) {// 增加分类
            PointSymbol pointSymbol = new PointSymbol();
            pointSymbol.setPointcode(request.getParameter("pointcode"));
            String fatherId = request.getParameter("fatherId");
            if (fatherId != null && !"".equals(fatherId)) {
                pointSymbol.setFatherId(Integer.parseInt(fatherId));
            }
            pointSymbol.setName(request.getParameter("name"));
            pointSymbol.setImage(request.getParameter("image"));

            JSONObject obj = new JSONObject();
            long id = -1;
            try {
                if (isPointSymbolExist(pointSymbol.getPointcode())) {
                    obj.put("ret", false);
                    obj.put("msg", "分类编码不能重复！");
                } else {
                    id = addPointSymbol(pointSymbol);
                    obj.put("ret", true);
                    obj.put("msg", "成功添加分类");
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            PrintWriter out = response.getWriter();
            out.write(obj.toString());
            out.flush();
            out.close();
            logger.info("增加:" + pointSymbol.getName());
        } else if ("del".equals(operate)) {// 删除分类
            String id = request.getParameter("id");
            try {
                deletePointSymbol(id);
                deletePointSymbolIcon(id, request);
            } catch (Exception e) {
                e.printStackTrace();
            }
            logger.info("删除id:" + id);
        } else if ("update".equals(operate)) {// 更新分类
            String pointcode = request.getParameter("pointcode");
            String id = request.getParameter("id");
            JSONObject obj = new JSONObject();
            try {
                *//**
                 * 1=可以更新，2=名称没有变化，3 = 记录不存在，4 = 名称与其它记录重复
                 *//*
                int flag = this.isPointSymbolUpdate(Integer.parseInt(id), pointcode);
                if (flag == 4) {
                    obj.put("ret", false);
                    obj.put("msg", "分类编码不能重复！");
                } else if (flag == 3) {
                    obj.put("ret", false);
                    obj.put("msg", "记录不存在！");
                } else if (flag == 1 || flag == 2) {
                    List<PointSymbol> list = tableFactory.list(PointSymbol.class, "id=" + id);
                    PointSymbol pointSymbol;
                    pointSymbol = list.get(0);
                    pointSymbol.setPointcode(pointcode);
                    pointSymbol.setName(request.getParameter("name"));
                    pointSymbol.setImage(request.getParameter("image"));
                    updatePointSymbol(pointSymbol);
                    obj.put("ret", true);
                    obj.put("msg", "成功添加分类字段");
                }

            } catch (Exception e) {
                e.printStackTrace();
            }
            PrintWriter out = response.getWriter();
            out.write(obj.toString());
            out.flush();
            out.close();
            logger.info("修改分类:" + pointcode);
        } else */if ("list".equals(operate)) {// 根据父节点查询分类
            JSONArray layers = null;
            String fatherId = request.getParameter("fatherId");
            try {
                layers = listPointSymbol(fatherId);
            } catch (SeException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }
            JSONObject obj = new JSONObject();
            obj.put("ret", true);
            obj.put("msg", "成功");
            obj.put("layers", layers);
            logger.info("点分类列表:" + layers.toString());
            PrintWriter out = response.getWriter();
            out.write(obj.toString());
            out.flush();
            out.close();
        } else if ("listtree".equals(operate)) {// 查询全部父节点
            JSONArray items = null;
            try {
                items = listTreePointSymbol();
            } catch (SeException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }
            JSONObject obj = new JSONObject();
            obj.put("ret", true);
            obj.put("msg", "成功");
            obj.put("items", items);
            logger.info("点分类列表:" + items.toString());
            PrintWriter out = response.getWriter();
            out.write(obj.toString());
            out.flush();
            out.close();
/*        } else if ("addPointSymbol".equals(operate)) {// 增加分类节点
            try {
                long Rsize = request.getContentLength();
                if (Rsize > maxPostSize) {
                    JSONObject obj = new JSONObject();
                    obj.put("ret", false);
                    obj.put("msg", "图标文件不能大于100KB");
                    PrintWriter out = response.getWriter();
                    out.write("<html><body><textarea>" + obj.toString()
                            + "</textarea></body></html>");
                    out.flush();
                    out.close();
                } else {
                    addPointSymbol(request, response);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
*/
        } else if ("updatePointSymbol".equals(operate)) {// 更新分类节点
            try {
                long Rsize = request.getContentLength();
                if (Rsize > maxPostSize) {
                    JSONObject obj = new JSONObject();
                    obj.put("ret", false);
                    obj.put("msg", "图标文件不能大于100KB");
                    PrintWriter out = response.getWriter();
                    out.write("<html><body><textarea>" + obj.toString()
                            + "</textarea></body></html>");
                    out.flush();
                    out.close();
                } else {
                    updatePointSymbol(request, response);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

        }
    }

    /**
     * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
     */
    protected void doPostNormal(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // 操作
        String operate = request.getParameter("oper");
        response.setContentType("text/html;charset=utf-8");

        if ("list".equals(operate)) {// 查询要素
            JSONArray layers = null;
            String fatherId = request.getParameter("fatherId");
            try {
                layers = listPointSymbol(fatherId);
            } catch (SeException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }
            JSONObject obj = new JSONObject();
            obj.put("ret", true);
            obj.put("msg", "成功");
            obj.put("layers", layers);
            logger.info("点分类列表:" + layers.toString());
            PrintWriter out = response.getWriter();
            out.write(obj.toString());
            out.flush();
            out.close();
        } else if ("listtree".equals(operate)) {// 查询要素
            JSONArray items = null;
            try {
                items = listTreePointSymbol();
            } catch (SeException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }
            JSONObject obj = new JSONObject();
            obj.put("ret", true);
            obj.put("msg", "成功");
            obj.put("items", items);
            logger.info("点分类列表:" + items.toString());
            PrintWriter out = response.getWriter();
            out.write(obj.toString());
            out.flush();
            out.close();
        }
    }

    /**
     * 处理图标问题
     * 
     * @param request
     * @param response
     * @throws Exception
     */
    protected void updatePointSymbol(HttpServletRequest request, HttpServletResponse response)
            throws Exception {
        logger.info("开始!");
        DiskFileItemFactory factory = new DiskFileItemFactory();
        factory.setSizeThreshold(4096);
        ServletFileUpload upload = new ServletFileUpload(factory);
        upload.setSizeMax(maxPostSize);
        // 这段编码有处理中文问题
        try {
            request.setCharacterEncoding("UTF-8");

            PointSymbol pointSymbol = new PointSymbol();

            List fileItems = upload.parseRequest(request);
            Iterator iter = fileItems.iterator();
            while (iter.hasNext()) {
                FileItem item = (FileItem) iter.next();
          
                    String fileName = item.getFieldName();
                   /* if ("updatePointlateName".equals(fileName)) {
                        pointSymbol.setName(new String(item.getString().getBytes("ISO-8859-1"),
                                "UTF-8"));
                    } else if ("updatePointlateCode".equals(fileName)) {
                        pointSymbol.setPointcode(item.getString());
                    } else if ("updateFatherId".equals(fileName)) {
                        pointSymbol.setFatherId(Integer.parseInt(item.getString()));
                    } else*/ if ("updateId".equals(fileName)) {
                        pointSymbol.setId(Integer.parseInt(item.getString()));
                    }else if ("updateIconFileInput".equals(fileName)){
                        String name = ((org.apache.commons.fileupload.disk.DiskFileItem) item).getName();
                        if ("".equals(name)||name==null){
                        	if(((org.apache.commons.fileupload.disk.DiskFileItem) item).isFormField()){
                        		pointSymbol.setImage(((org.apache.commons.fileupload.disk.DiskFileItem) item).getString());
                        	}
                        	continue;
                        }
                        String[] ns = name.split("\\\\");
                        name = ns[ns.length - 1];
                        ns = name.split("\\.");
                        name = System.currentTimeMillis() + "." + ns[ns.length - 1];
                        pointSymbol.setImage(name);
                        logger.info(name);
                        response.setContentType("text/html;charset=UTF-8");
                        PrintWriter out = response.getWriter();
                        String uploadPath = Config.getOutPath();
                        logger.info(uploadPath);
                        item.write(new File(uploadPath + File.separator + "symbolimage/" + name));
                        out.print(name + "上传成功");
                    }


            }
            PointSymbol oldPointSymbol = (PointSymbol) tableFactory.list(PointSymbol.class,
                    "id=" + pointSymbol.getId()).get(0);
            if (pointSymbol.getImage() == null || "".equals(pointSymbol.getImage())) {
            	oldPointSymbol.setImage(defaultImg);
            }else{
            	oldPointSymbol.setImage(pointSymbol.getImage());
            }
            updatePointSymbol(oldPointSymbol);
            JSONObject obj = new JSONObject();
            obj.put("ret", true);
            obj.put("msg", "修改图标成功！");
            /**
             * 1=可以更新，2=名称没有变化，3 = 记录不存在，4 = 名称与其它记录重复
             */
          /*  int flag = this.isPointSymbolUpdate(pointSymbol.getId(), pointSymbol.getPointcode());
            if (flag == 4) {
                obj.put("ret", false);
                obj.put("msg", "分类编码不能重复！");
            } else if (flag == 3) {
                obj.put("ret", false);
                obj.put("msg", "记录不存在！");
            } else if (flag == 1 || flag == 2) {
                updatePointSymbol(oldPointSymbol);
                obj.put("ret", true);
                obj.put("msg", "成功更新分类字段");
            }*/
            PrintWriter out = response.getWriter();
            // out.write(obj.toString());
            out.write("<html><body><textarea>" + obj.toString() + "</textarea></body></html>");
            out.flush();
            out.close();
        } catch (FileUploadException e) {
            e.printStackTrace();
        } catch (SeException e) {
            e.printStackTrace();
        } catch (SecurityException e) {
            e.printStackTrace();
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
        } catch (NoSuchMethodException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (InvocationTargetException e) {
            e.printStackTrace();
        } catch (UnavailableConnectionException e) {
            e.printStackTrace();
        } catch (NoSuchFieldException e) {
            e.printStackTrace();
        }
        logger.info("结束");
    }

    /*
     * 判断分类是可以更新
     */
    public int isPointSymbolUpdate(int id, String pointcode) throws Exception {

        /**
         * 1=可以更新，2=编码没有变化，3=记录不存在，4 =编码与其它记录重复
         */
        List list = tableFactory.list(PointSymbol.class, "id=" + id);
        if (list.size() > 0) {
            if (((PointSymbol) list.get(0)).getPointcode().equals(pointcode)) {
                return 2;
            } else {
                if (isPointSymbolExist(pointcode)) {
                    return 4;
                } else {
                    return 1;
                }
            }
        } else {
            return 3;
        }
    }

    /*protected void addPointSymbol(HttpServletRequest request, HttpServletResponse response)
            throws Exception {
        logger.info("开始!");
        DiskFileItemFactory factory = new DiskFileItemFactory();
        factory.setSizeThreshold(4096);
        ServletFileUpload upload = new ServletFileUpload(factory);
        upload.setSizeMax(maxPostSize);
        try {
            request.setCharacterEncoding("UTF-8");
            PointSymbol pointSymbol = new PointSymbol();
            List fileItems = upload.parseRequest(request);
            Iterator iter = fileItems.iterator();
            // 这段编码有处理中文问题
            while (iter.hasNext()) {
                FileItem item = (FileItem) iter.next();

                String fileName = item.getFieldName();
                if ("pointlateName".equals(fileName)) {
                    pointSymbol.setName(new String(item.getString().getBytes("ISO-8859-1"), "UTF-8"));
                } else if ("pointlateCode".equals(fileName)) {
                    pointSymbol.setPointcode(item.getString());
                } else if ("fatherId".equals(fileName)) {
                    pointSymbol.setFatherId(Integer.parseInt(item.getString()));
                } else if ("iconFileInput".equals(fileName)) {
                    String name = ((org.apache.commons.fileupload.disk.DiskFileItem) item)
                            .getName();
                    if ("".equals(name)||name==null)
                        continue;
                    String[] ns = name.split("\\\\");
                    name = ns[ns.length - 1];
                    ns = name.split("\\.");
                    name = System.currentTimeMillis() + "." + ns[ns.length - 1];
                    pointSymbol.setImage(name);
                    logger.info(name);
                    String uploadPath = null;

                    response.setContentType("text/html;charset=UTF-8");
                    PrintWriter out = response.getWriter();
                    uploadPath = Config.getOutPath();
                    String path = uploadPath + File.separator + "symbolimage/" + name;
                    logger.info(path);
                    item.write(new File(path));
                    out.print(name + "上传成功");
                }

            }

            JSONObject obj = new JSONObject();

            if (isPointSymbolExist(pointSymbol.getPointcode())) {
                obj.put("ret", false);
                obj.put("msg", "编码重复请重新输入");
            } else {

                if (pointSymbol.getImage() == null) {
                    pointSymbol.setImage(defaultImg);
                }
                long id = addPointSymbol(pointSymbol);
                obj.put("ret", true);
                obj.put("msg", "成功");
                obj.put("id", id);
            }
            logger.info("点分类列表:" + obj.toString());
            PrintWriter out = response.getWriter();
            // out.write(obj.toString());
            out.write("<html><body><textarea>" + obj.toString() + "</textarea></body></html>");
            out.flush();
            out.close();

        } catch (FileUploadException e) {
            e.printStackTrace();
        } catch (SeException e) {
            e.printStackTrace();
        } catch (SecurityException e) {
            e.printStackTrace();
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
        } catch (NoSuchMethodException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (InvocationTargetException e) {
            e.printStackTrace();
        } catch (UnavailableConnectionException e) {
            e.printStackTrace();
        } catch (NoSuchFieldException e) {
            e.printStackTrace();
        }
        logger.info("结束");
    }
*/
    /*
     * 增加分类
     */
  /*  public long addPointSymbol(PointSymbol pointSymbol) throws SeException, SecurityException,
            IllegalArgumentException, NoSuchMethodException, IllegalAccessException,
            InvocationTargetException, IOException, UnavailableConnectionException,
            NoSuchFieldException {
        // int user, String value, byte[] image , String label, String
        // description,Date modifydate

        tableFactory.insert(pointSymbol);

        return 1L;
    }*/

    public void updatePointSymbol(PointSymbol pointSymbol) throws SeException, SecurityException,
            IllegalArgumentException, NoSuchMethodException, IllegalAccessException,
            InvocationTargetException, IOException, UnavailableConnectionException {

        tableFactory.update(pointSymbol);
    }

    /*
     * 删除分类
     */
   /* public void deletePointSymbol(String id) throws Exception {
        String sid = "id=" + id;
        tableFactory.delete(PointSymbol.class, sid);
        deletePointfatherId(id);
    }*/

    /*
     * 删除图标
     */
  /*  public void deletePointSymbolIcon(String id, HttpServletRequest request) throws Exception {
        String sid = "id=" + id;
        List list = tableFactory.list(PointSymbol.class, sid);
        if (list.size() > 0) {
            String name = ((PointSymbol) list.get(0)).getImage();
            if (name != null && !"".equals(name)) {
                String uploadPath = request.getRealPath("/");
                String pathAndName = uploadPath + "symbolimage/" + name;
                logger.info("删除图标文件：" + pathAndName);
                CopyFile copyFile = new CopyFile();
                copyFile.delFile(pathAndName);
            }
        }
    }*/

    /*
     * 删除分类子节点
     */
   /* public void deletePointfatherId(String id) throws Exception {
        List<PointSymbol> list = tableFactory.list(PointSymbol.class, "fatherId=" + id + "");
        int pointSize = list.size();
        if (pointSize > 0) {
            for (int i = 0; i < pointSize; i++) {
                deletePointfatherId(Integer.toString(list.get(i).getId()));
            }
            tableFactory.delete(PointSymbol.class, "fatherId=" + id + "");
        }
    }*/

    /*
     * 添加模板
     */
    public boolean isPointSymbolExist(String pointcode) {

        List list = null;
        try {
            list = tableFactory.list(PointSymbol.class, " pointcode ='" + pointcode + "' ");
        } catch (Exception e) {
            e.printStackTrace();
        }

        return list.size() > 0 ? true : false;
    }

    /*
     * 根据父节点ID查询分类
     */
    public JSONArray listPointSymbol(String fatherId) throws Exception {
        String where;
        System.out.println(fatherId==null);
        if ("".equals(fatherId)||fatherId==null){
            where = "fatherId is null";
        } else {
            where = "fatherId=" + fatherId + " ";
        }
        List<PointSymbol> list = tableFactory.list(PointSymbol.class, where);
        JsonConfig config = new JsonConfig();
        /**
         * 字母 日期或时间元素 表示 示例 <br>
         * G Era标志符 Text AD <br>
         * y 年 Year 1996; 96 <br>
         * M 年中的月份 Month July; Jul; 07 <br>
         * w 年中的周数 Number 27 <br>
         * W 月份中的周数 Number 2 <br>
         * D 年中的天数 Number 189 <br>
         * d 月份中的天数 Number 10 <br>
         * F 月份中的星期 Number 2 <br>
         * E 星期中的天数 Text Tuesday; Tue<br>
         * a Am/pm 标记 Text PM <br>
         * H 一天中的小时数（0-23） Number 0 <br>
         * k 一天中的小时数（1-24） Number 24<br>
         * K am/pm 中的小时数（0-11） Number 0 <br>
         * h am/pm 中的小时数（1-12） Number 12 <br>
         * m 小时中的分钟数 Number 30 <br>
         * s 分钟中的秒数 Number 55 <br>
         * S 毫秒数 Number 978 <br>
         * z 时区 General time zone Pacific Standard Time; PST; GMT-08:00 <br>
         * Z 时区 RFC 822 time zone -0800 <br>
         */
        config.registerJsonValueProcessor(Date.class, new DateJsonValueProcessor(
                "yyyy-MM-dd hh:mm:ss"));

        // for(int i=0;i<list.size();i++){
        // list.get(i).setModifydate(null);
        // }
        return JSONArray.fromObject(list, config);
    }

    /*
     * 查询全部分类
     */
    public JSONArray listTreePointSymbol() throws Exception {

        List<PointSymbol> list = tableFactory.list(PointSymbol.class, "");
        JsonConfig config = new JsonConfig();
        /**
         * 字母 日期或时间元素 表示 示例 <br>
         * G Era标志符 Text AD <br>
         * y 年 Year 1996; 96 <br>
         * M 年中的月份 Month July; Jul; 07 <br>
         * w 年中的周数 Number 27 <br>
         * W 月份中的周数 Number 2 <br>
         * D 年中的天数 Number 189 <br>
         * d 月份中的天数 Number 10 <br>
         * F 月份中的星期 Number 2 <br>
         * E 星期中的天数 Text Tuesday; Tue<br>
         * a Am/pm 标记 Text PM <br>
         * H 一天中的小时数（0-23） Number 0 <br>
         * k 一天中的小时数（1-24） Number 24<br>
         * K am/pm 中的小时数（0-11） Number 0 <br>
         * h am/pm 中的小时数（1-12） Number 12 <br>
         * m 小时中的分钟数 Number 30 <br>
         * s 分钟中的秒数 Number 55 <br>
         * S 毫秒数 Number 978 <br>
         * z 时区 General time zone Pacific Standard Time; PST; GMT-08:00 <br>
         * Z 时区 RFC 822 time zone -0800 <br>
         */
        config.registerJsonValueProcessor(Date.class, new DateJsonValueProcessor(
                "yyyy-MM-dd hh:mm:ss"));

        JSONArray items = new JSONArray();
        HashMap<Integer, JSONObject> itemsIndex = new HashMap<Integer, JSONObject>();
        for (PointSymbol symbol : list) {
            JSONObject symbolJSON = new JSONObject();
            symbolJSON.put("id", symbol.getId());
            symbolJSON.put("name", symbol.getName());
            symbolJSON.put("image", symbol.getImage());
            symbolJSON.put("root", symbol.getFatherId() < 0 ? true : false);
            symbolJSON.put("fatherid", symbol.getFatherId());
            symbolJSON.put("pointcode", symbol.getPointcode());
            // items.add(symbolJSON);
            itemsIndex.put(symbol.getId(), symbolJSON);
        }
        Iterator<Integer> ids = itemsIndex.keySet().iterator();
        while (ids.hasNext()) {
            Integer key = ids.next();
            JSONObject symbolJSON = itemsIndex.get(key);
            if (symbolJSON.getInt("fatherid") > 0) {
                Integer fatherid = symbolJSON.getInt("fatherid");
                JSONObject fatherSymbolJSON = itemsIndex.get(fatherid);
                JSONArray children = null;
                if (fatherSymbolJSON.containsKey("children")) {
                    children = fatherSymbolJSON.getJSONArray("children");
                } else {
                    children = new JSONArray();
                    fatherSymbolJSON.put("children", children);
                }
                JSONObject reference = new JSONObject();
                reference.put("_reference", key);
                children.add(reference);
                fatherSymbolJSON.put("children", children);
            }

        }
        ids = itemsIndex.keySet().iterator();
        while (ids.hasNext()) {
            Integer key = ids.next();
            JSONObject symbolJSON = itemsIndex.get(key);
            items.add(symbolJSON);
        }
        return items;
    }

    public void exportPointSymbolImage(HttpServletResponse response, String id) throws IOException,
            NumberFormatException, SeException {
        // byte[] img = tableFactory.image(Integer.parseInt(id));
        // response.setHeader("Pragma","No-cache");
        // response.setHeader("Cache-Control","no-cache");
        // response.setDateHeader("Expires", 0);
        // response.setContentType("image/jpeg");
        // ServletOutputStream os=response.getOutputStream();
        // os.write(img);
        // os.flush();
        // os.close();

    }

}
