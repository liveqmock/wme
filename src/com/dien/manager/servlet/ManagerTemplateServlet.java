package com.dien.manager.servlet;

import java.io.IOException;
import java.io.PrintWriter;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.servlet.Servlet;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import org.apache.log4j.Logger;
import org.geotools.arcsde.session.UnavailableConnectionException;

import com.dien.manager.dao.bean.Layer;
import com.dien.manager.dao.bean.PointSymbol;
import com.dien.manager.dao.bean.Template;
import com.dien.manager.dao.bean.TemplateField;
import com.dien.manager.dao.bean.User;
import com.dien.manager.tools.TableFactory;
import com.esri.sde.sdk.client.SeException;

/**
 * Servlet implementation class ManagerServlet
 */
public class ManagerTemplateServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private static Logger logger = Logger.getLogger(ManagerTemplateServlet.class);

    public static final String TOKEN = "token";

    TableFactory tableFactory = null;

    /**
     * @see HttpServlet#HttpServlet()
     */
    public ManagerTemplateServlet() {
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
                response.setContentType("text/html;charset=utf-8");
                PrintWriter out = response.getWriter();
                JSONObject obj = new JSONObject();
                obj.put("ret", false);
                obj.put("msg", "普通用户没有管理权限");
                out.write(obj.toString());
                out.flush();
                out.close();
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
        if ("addtemp".equals(operate)) {// 增加模板
            String name = request.getParameter("name");
            JSONObject obj = new JSONObject();

            long id = -1;
            try {
                if (isTtemplateExist(name)) {
                    obj.put("ret", false);
                    obj.put("msg", "模板不能重复！");
                } else {
                    id = addTemplate(name);
                    obj.put("ret", true);
                    obj.put("id", id);
                    obj.put("msg", "成功添加模板");
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            PrintWriter out = response.getWriter();
            out.write(obj.toString());
            out.flush();
            out.close();
            logger.info("增加:" + name);
        } else if ("add".equals(operate)) {// 增加字段
            String fieldname = request.getParameter("fieldname");
            String tempid = request.getParameter("tempid");
            String fieldtype = request.getParameter("fieldtype");
            JSONObject obj = new JSONObject();

            long id = -1;
            try {
                if ("FID".equalsIgnoreCase(fieldname) || "ID".equalsIgnoreCase(fieldname)
                        || "SHAPE".equalsIgnoreCase(fieldname)||"userid".equalsIgnoreCase(fieldname)||"objectid".equalsIgnoreCase(fieldname)||"symbol".equalsIgnoreCase(fieldname)
                        || "DATE".equalsIgnoreCase(fieldname)) {
                    obj.put("ret", false);
                    obj.put("msg", "字段名称不能是默认字段！");
                } else if (isTtemplateFieldExist(Integer.parseInt(tempid), fieldname)) {
                    obj.put("ret", false);
                    obj.put("msg", "字段名称不能重复！");
                } else {
                    id = addTemplateField(fieldname, Integer.parseInt(tempid),
                            Integer.parseInt(fieldtype));
                    obj.put("ret", true);
                    obj.put("id", id);
                    obj.put("msg", "成功添加模板记录");
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            PrintWriter out = response.getWriter();
            out.write(obj.toString());
            out.flush();
            out.close();
            logger.info("增加:" + fieldname);
        } else if ("del".equals(operate)) {// 删除模版
            String id = request.getParameter("id");
            String where = "id=" + id;
            try {
                deleteTemplate(where);
                deleteTemplateField("tempid=" + id);
            } catch (NumberFormatException e) {
                e.printStackTrace();
            } catch (UnavailableConnectionException e) {
                e.printStackTrace();
            } catch (SeException e) {
                e.printStackTrace();
            }
            logger.info("删除模版" + where);
        } else if ("delTemplateField".equals(operate)) {// 删除模版字段
            String id = request.getParameter("id");
            String where = "id=" + id;
            try {
                deleteTemplateField(where);
            } catch (NumberFormatException e) {
                e.printStackTrace();
            } catch (UnavailableConnectionException e) {
                e.printStackTrace();
            } catch (SeException e) {
                e.printStackTrace();
            }
            logger.info("删除模版字段" + where);
        } else if ("update".equals(operate)) {// 更新模板
            String id = request.getParameter("id");
            String name = request.getParameter("name");
            JSONObject obj = new JSONObject();
            try {
                /**
                 * 1=可以更新，2=名称没有变化，3 = 记录不存在，4 = 名称与其它记录重复
                 */
                int flag = isTtemplateUpdate(Integer.parseInt(id), name);
                if (flag == 4) {
                    obj.put("ret", false);
                    obj.put("msg", "模板名称不能重复！");
                } else if (flag == 2) {
                    obj.put("ret", true);
                    obj.put("msg", "模板名称没修改！");
                } else if (flag == 3) {
                    obj.put("ret", false);
                    obj.put("msg", "记录不存在！");
                } else if (flag == 1) {
                    updateTemplate(Integer.parseInt(id), name);
                    obj.put("ret", true);
                    obj.put("id", id);
                    obj.put("msg", "成功更新模板");
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            logger.info("修改记录 name:" + name);
            PrintWriter out = response.getWriter();
            out.write(obj.toString());
            out.flush();
            out.close();
        } else if ("updateTemp".equals(operate)) {// 更新模板字段
            String id = request.getParameter("id");
            String fieldname = request.getParameter("fieldname");
            String tempid = request.getParameter("tempid");
            String fieldtype = request.getParameter("fieldtype");
            JSONObject obj = new JSONObject();
            try {
                /**
                 * 1=可以更新，2=名称没有变化，3 = 记录不存在，4 = 名称与其它记录重复
                 */
                if ("FID".equalsIgnoreCase(fieldname) || "ID".equalsIgnoreCase(fieldname)
                        || "SHAPE".equalsIgnoreCase(fieldname)||"userid".equalsIgnoreCase(fieldname)||"objectid".equalsIgnoreCase(fieldname)||"symbol".equalsIgnoreCase(fieldname)
                        || "DATE".equalsIgnoreCase(fieldname)) {
                    obj.put("ret", false);
                    obj.put("msg", "字段名称不能是默认字段！");
                } else {
                    int flag = isTtemplateFieldUpdate(Integer.parseInt(id),
                            Integer.parseInt(tempid), fieldname);
                    if (flag == 4) {
                        obj.put("ret", false);
                        obj.put("msg", "同模板字段名称不能重复！");
                    } else if (flag == 3) {
                        obj.put("ret", false);
                        obj.put("msg", "记录不存在！");
                    } else if (flag == 1 || flag == 2) {

                        TemplateField template = new TemplateField();
                        template.setId(Integer.parseInt(id));
                        template.setFieldname(fieldname);
                        template.setTempid(Integer.parseInt(tempid));
                        template.setFieldtype(Integer.parseInt(fieldtype));
                        updateTemplateField(template);
                        obj.put("ret", true);
                        obj.put("id", id);
                        obj.put("msg", "成功更新模板字段");
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            PrintWriter out = response.getWriter();
            out.write(obj.toString());
            out.flush();
            out.close();
            logger.info("更新模板字段:" + fieldname);
        } else if ("list".equals(operate)) {// 查询模版字段
            JSONArray layers = null;
            try {
                String tempid = request.getParameter("tempid");
                if (tempid != null && !"".equals(tempid)) {
                    String where = " tempid=" + tempid;
                    layers = listTemplate(where);
                } else {
                    List<Template> tempList = tableFactory.list(Template.class, "");
                    layers = JSONArray.fromObject(tempList);
                }
            } catch (SeException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }
            JSONObject obj = new JSONObject();
            obj.put("ret", true);
            obj.put("msg", "成功");
            obj.put("layers", layers);
            logger.info("模板列表:" + layers.toString());
            PrintWriter out = response.getWriter();
            out.write(obj.toString());
            out.flush();
            out.close();
        } else if ("query".equals(operate)) {// 查询模块
            JSONArray layers = null;
            try {
                layers = queryTemplate();
            } catch (SeException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }
            JSONObject obj = new JSONObject();
            obj.put("ret", true);
            obj.put("msg", "成功");
            obj.put("layers", layers);
            logger.info("模板列表:" + layers.toString());
            PrintWriter out = response.getWriter();
            out.write(obj.toString());
            out.flush();
            out.close();
        } else if ("layertemplates".equals(operate)) {// 查询要素
            JSONArray templates = null;
            try {
                templates = layertemplates("");
            } catch (SeException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }
            JSONObject obj = new JSONObject();
            obj.put("ret", true);
            obj.put("msg", "成功");
            obj.put("templates", templates);
            logger.info("模板列表:" + templates.toString());
            PrintWriter out = response.getWriter();
            out.write(obj.toString());
            out.flush();
            out.close();
        }
    }

    /*
     * 添加模塊
     */
    public long addTemplate(String name) throws SecurityException, IllegalArgumentException,
            SeException, NoSuchMethodException, IllegalAccessException, InvocationTargetException,
            IOException, UnavailableConnectionException, NoSuchFieldException {
        // int user, String value, byte[] image , String label, String
        // description,Date modifydate
        Template template = new Template();
        template.setName(name);

        return tableFactory.insert(template);
    }

    public long addTemplateField(String fieldname, int tempid, int fieldtype) throws SeException,
            SecurityException, IllegalArgumentException, NoSuchMethodException,
            IllegalAccessException, InvocationTargetException, IOException,
            UnavailableConnectionException, NoSuchFieldException {
        // int user, String value, byte[] image , String label, String
        // description,Date modifydate
        TemplateField template = new TemplateField();
        template.setTempid(tempid);
        template.setFieldname(fieldname);
        template.setFieldtype(fieldtype);

        return tableFactory.insert(template);
    }

    /*
     * 判断模板字段是否重名
     */
    public boolean isTtemplateFieldExist(int tempid, String fieldname) throws Exception {

        List list = tableFactory.list(TemplateField.class, "tempid=" + tempid + " and fieldname='"
                + fieldname + "'");

        return list.size() > 0 ? true : false;
    }

    /*
     * 判断模板是可以更新
     */
    public int isTtemplateFieldUpdate(int id, int tempid, String fieldname) throws Exception {

        /**
         * 1=可以更新，2=名称没有变化，3=记录不存在，4 =名称与其它记录重复
         */
        List list = tableFactory.list(TemplateField.class, "id=" + id);
        if (list.size() > 0) {
            if (((TemplateField) list.get(0)).getFieldname().equals(fieldname)) {
                return 2;
            } else {
                if (isTtemplateFieldExist(tempid, fieldname)) {
                    return 4;
                } else {
                    return 1;
                }
            }

        } else {
            return 3;

        }

    }

    /*
     * 判断模板是否重名
     */
    public boolean isTtemplateExist(String name) throws Exception {

        List list = tableFactory.list(Template.class, "name='" + name + "'");

        return list.size() > 0 ? true : false;
    }

    /*
     * 判断模板是可以更新
     */
    public int isTtemplateUpdate(int id, String name) throws Exception {

        /**
         * 1=可以更新，2=名称没有变化，3=记录不存在，4 =名称与其它记录重复
         */
        List list = tableFactory.list(Template.class, "id=" + id);
        if (list.size() > 0) {
            if (((Template) list.get(0)).getName().equals(name)) {
                return 2;
            } else {
                if (isTtemplateExist(name)) {
                    return 4;
                } else {
                    return 1;
                }
            }

        } else {
            return 3;
        }

    }

    public void updateTemplate(int id, String name) throws SeException, SecurityException,
            IllegalArgumentException, NoSuchMethodException, IllegalAccessException,
            InvocationTargetException, IOException, UnavailableConnectionException {
        Template template = new Template();
        template.setId(id);
        template.setName(name);
        tableFactory.update(template);
    }

    public void updateTemplateField(TemplateField template) throws SeException, SecurityException,
            IllegalArgumentException, NoSuchMethodException, IllegalAccessException,
            InvocationTargetException, IOException, UnavailableConnectionException {

        tableFactory.update(template);
    }

    public void deleteTemplate(String where) throws NumberFormatException, IOException,
            UnavailableConnectionException, SeException {
        tableFactory.delete(Template.class, where);
    }

    public void deleteTemplateField(String where) throws NumberFormatException, IOException,
            UnavailableConnectionException, SeException {
        tableFactory.delete(TemplateField.class, where);
    }

    /*
     * 利用模塊名稱查詢 [ { "ID" : 1, "NAME" : "name", "TYPE" : 5, "ALIAS" : "123" } ]
     */
    public JSONArray listTemplate(String where) throws Exception {
        List list = tableFactory.list(TemplateField.class, where);

        return JSONArray.fromObject(list);
    }

    /*
     * 将模板对象直接生成前台可以使用的json { name : "油井", data : { identifier : "id", items : [ { id : 0, name : "name", type : "STRING", alias : "名称" }, { id : 1,
     * name : "symbol", type : "STRING", alias : "类别" } ] } },
     */
    public JSONArray layertemplates(String where) throws Exception {

        List<Template> list = tableFactory.list(Template.class, where);
        List<TemplateField> listField = tableFactory.list(TemplateField.class, where);
        Map<Integer, ArrayList<TemplateField>> templates = new HashMap<Integer, ArrayList<TemplateField>>();
        Map<Integer, String> templateNames = new HashMap<Integer, String>();
        ArrayList<TemplateField> tempFields;

        for (Template template : list) {
            int tempId = ((Template) template).getId();

            tempFields = new ArrayList<TemplateField>();
            templates.put(tempId, tempFields);
            templateNames.put(tempId, ((Template) template).getName());
        }
        for (TemplateField templateField : listField) {
            int tempId = ((TemplateField) templateField).getTempid();
            if (templates.containsKey(tempId)) {
                tempFields = templates.get(tempId);
                tempFields.add((TemplateField) templateField);
            }
        }
        JSONArray templatesJSON = new JSONArray();
        for (Map.Entry<Integer, ArrayList<TemplateField>> m : templates.entrySet()) {
            // logger.info("email-" + m.getKey() + ":" + m.getValue());
            JSONObject templateJSON = new JSONObject();
            templateJSON.put("name", templateNames.get(m.getKey()));

            JSONArray fieldsJSON = new JSONArray();
            int i = 0;
            for (TemplateField template : m.getValue()) {
                JSONObject fieldJSON = new JSONObject();
                fieldJSON.put("id", i);
                fieldJSON.put("name", template.getFieldname());
                fieldJSON.put("type", template.getFieldtype());
                fieldsJSON.add(fieldJSON);
                i++;
            }

            JSONObject dataJSON = new JSONObject();
            dataJSON.put("identifier", "id");
            dataJSON.put("items", fieldsJSON);
            templateJSON.put("data", dataJSON);
            templatesJSON.add(templateJSON);
        }
        return templatesJSON;
    }

    /*
     * 拼接管理树
     */
    public JSONArray queryTemplateJSON() throws Exception {
        List<Template> tempList = tableFactory.list(Template.class, "");
        ComparatorTemplate comparator = new ComparatorTemplate();
        Collections.sort(tempList, comparator);

        int tempSize = tempList.size();
        String tempNode = "[{id : 'temp',name : '模板管理',root : true,flag:'temp',children :";
        String tempNodes = "[";
        String tempChildNode = "";
        for (int i = 0; i < tempSize; i++) {
            if (i > 0) {
                tempNodes += ",";
                tempChildNode += ",";
            }
            tempNodes += "{_reference : 'temp_" + tempList.get(i).getId() + "'}";
            tempChildNode += "{id : 'temp_" + tempList.get(i).getId() + "',name : '"
                    + tempList.get(i).getName() + "',flag:'temp'}";
        }
        if (tempSize == 0) {
            tempNode += "[]}";
        } else {
            tempNodes += "]},";
            tempNode += tempNodes + tempChildNode;
        }

        String pointNode = ",{id :'point_-3',name : '分类管理',root : true,flag:'point'";
        pointNode += queryPointNode("", 0);
        tempNode += pointNode;
        // this.logger.info(tempNode);

        List<Layer> aliasList = tableFactory.list(Layer.class, "");
        ComparatorLayer comparatorLayer = new ComparatorLayer();
        Collections.sort(aliasList, comparatorLayer);
        int aliasSize = aliasList.size();
        String aliasnode = ",{id : 'alias',name : '别名管理',root : true,flag:'alias',children :";
        String aliasNodes = "[";
        String aliasChildNode = "";
        for (int i = 0; i < aliasSize; i++) {
            if (i > 0) {
                aliasNodes += ",";
                aliasChildNode += ",";
            }
            aliasNodes += "{_reference : 'alias_" + aliasList.get(i).getId() + "'}";
            aliasChildNode += "{id : 'alias_" + aliasList.get(i).getId() + "',name : '"
                    + aliasList.get(i).getLayername() + "',tableName:'"
                    + aliasList.get(i).getTablename() + "',flag:'alias'}";
        }
        if (aliasSize == 0) {
            tempNode += aliasnode + "[]}";
        } else {
            aliasNodes += "]},";
            tempNode += aliasnode + aliasNodes + aliasChildNode + "]";
        }
        return JSONArray.fromObject(tempNode);
    }

    /*
     * 拼接管理树
     */
    public JSONArray queryTemplate() throws Exception {
        JSONArray rootNodeJSONArray = new JSONArray();
        // 模板管理
        List<Template> tempList = tableFactory.list(Template.class, "");
        ComparatorTemplate comparator = new ComparatorTemplate();
        Collections.sort(tempList, comparator);

        int tempSize = tempList.size();
        JSONObject tempNodeJSONObject = new JSONObject();
        tempNodeJSONObject.put("id", "temp");
        tempNodeJSONObject.put("name", "模板管理");
        tempNodeJSONObject.put("root", true);
        tempNodeJSONObject.put("flag", "temp");

        JSONArray childrenJSONArray = new JSONArray();
        for (int i = 0; i < tempSize; i++) {
            JSONObject referenceJSONObject = new JSONObject();
            referenceJSONObject.put("_reference", "temp_" + tempList.get(i).getId());
            childrenJSONArray.add(referenceJSONObject);
        }
        tempNodeJSONObject.put("children", childrenJSONArray);
        rootNodeJSONArray.add(tempNodeJSONObject);
        for (int i = 0; i < tempSize; i++) {
            tempNodeJSONObject = new JSONObject();
            tempNodeJSONObject.put("id", "temp_" + tempList.get(i).getId());
            tempNodeJSONObject.put("name", tempList.get(i).getName());
            tempNodeJSONObject.put("flag", "temp");
            rootNodeJSONArray.add(tempNodeJSONObject);
        }

        // 分类管理
        List<PointSymbol> pointList = tableFactory.list(PointSymbol.class, "");
        ComparatorPointSymbol comparatorPointSymbol = new ComparatorPointSymbol();
        Collections.sort(pointList, comparatorPointSymbol);

        JSONObject pointNodeJSONObject = new JSONObject();
        pointNodeJSONObject.put("id", "point");
        pointNodeJSONObject.put("name", "分类管理");
        pointNodeJSONObject.put("root", true);
        pointNodeJSONObject.put("flag", "point");

        ArrayList<String> rootList = new ArrayList<String>();
        HashMap<String, JSONObject> itemsIndex = new HashMap<String, JSONObject>();
        for (PointSymbol symbol : pointList) {
            JSONObject nodeJSONObject = new JSONObject();
            String key = "point_" + symbol.getId();
            String fatherid ="point_" + symbol.getFatherId();
            nodeJSONObject.put("id", key);
            nodeJSONObject.put("name", symbol.getName());
            nodeJSONObject.put("image", symbol.getImage());
            nodeJSONObject.put("flag", "point");
            nodeJSONObject.put("code", symbol.getPointcode());
            nodeJSONObject.put("fatherid", fatherid);
            nodeJSONObject.put("fid", symbol.getFatherId());
            itemsIndex.put(key, nodeJSONObject);
            if (symbol.getFatherId() < 0) {
                rootList.add(key);
            }
        }
        Iterator<String> ids = itemsIndex.keySet().iterator();
        childrenJSONArray = new JSONArray();
        while (ids.hasNext()) {
            String key = ids.next();
            JSONObject symbolJSON = itemsIndex.get(key);
            if (symbolJSON.getInt("fid") > 0) {
                String fatherid = symbolJSON.getString("fatherid");
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
            } else {
                JSONObject referenceJSONObject = new JSONObject();
                referenceJSONObject.put("_reference", key);
                childrenJSONArray.add(referenceJSONObject);
            }
        }

        ids = rootList.iterator();
        ArrayList<String> newList = new ArrayList<String>();
        while (ids.hasNext()) {
            String key = ids.next();
            newList.add(key);
            JSONObject symbolJSON = itemsIndex.get(key);
            if (symbolJSON.containsKey("children")) {
                JSONArray children = symbolJSON.getJSONArray("children");
                for (int i = 0; i < children.size(); i++) {
                    JSONObject reference = children.getJSONObject(i);
                    String pointkey = reference.getString("_reference");
                    newList.add(pointkey);
                    itemsIndex.get(pointkey).remove("children");
                }
            }
        }

        ids = newList.iterator();
        while (ids.hasNext()) {
            String key = ids.next();
            JSONObject symbolJSON = itemsIndex.get(key);
            symbolJSON.remove("fatherid");
            symbolJSON.remove("fid");
            rootNodeJSONArray.add(symbolJSON);
        }

        pointNodeJSONObject.put("children", childrenJSONArray);
        rootNodeJSONArray.add(pointNodeJSONObject);

        // 别名
        List<Layer> aliasList = tableFactory.list(Layer.class, "");
        ComparatorLayer comparatorLayer = new ComparatorLayer();
        Collections.sort(aliasList, comparatorLayer);
        int aliasSize = aliasList.size();
        JSONObject aliasJSONObject = new JSONObject();
        aliasJSONObject.put("id", "alias");
        aliasJSONObject.put("name", "别名管理");
        aliasJSONObject.put("root", true);
        aliasJSONObject.put("flag", "alias");
        JSONArray children = new JSONArray();

        for (int i = 0; i < aliasSize; i++) {
            JSONObject referenceJSONObject = new JSONObject();
            referenceJSONObject.put("_reference", "alias_" + aliasList.get(i).getId());
            children.add(referenceJSONObject);
        }
        aliasJSONObject.put("children", children);
        rootNodeJSONArray.add(aliasJSONObject);
        for (int i = 0; i < aliasSize; i++) {
            aliasJSONObject = new JSONObject();
            aliasJSONObject.put("id", "alias_" + aliasList.get(i).getId());
            aliasJSONObject.put("name", aliasList.get(i).getLayername());
            aliasJSONObject.put("flag", "alias");
            aliasJSONObject.put("tableName", aliasList.get(i).getTablename());
            rootNodeJSONArray.add(aliasJSONObject);

        }

        return rootNodeJSONArray;
    }

    /*
     * List<SeLayer> list = basis.getLayerList(); 分类管理树节点
     */
    public String queryPointNode(String fatherId, int s) throws Exception {
        String pointNode = "";
        if (s < 2) {
            s++;
            String where;
            if (fatherId.equals("")) {
                where = "fatherId < 0";
            } else {
                where = "fatherId=" + fatherId + "";
            }
            List<PointSymbol> pointList = tableFactory.list(PointSymbol.class, where);
            ComparatorPointSymbol comparator = new ComparatorPointSymbol();
            Collections.sort(pointList, comparator);
            int pointSize = pointList.size();
            if (pointSize > 0) {
                String pointNodes = ",children :[";
                String pointChildNode = "";
                for (int i = 0; i < pointSize; i++) {
                    if (i > 0) {
                        pointNodes += ",";
                        pointChildNode += ",";
                    }
                    int pid = pointList.get(i).getId() == 0 ? -1 : pointList.get(i).getId();
                    pointNodes += "{_reference : 'point_" + pid + "'}";
                    pointChildNode += "{id : 'point_" + pid + "',name : '"
                            + pointList.get(i).getName() + "',flag:'point'" + ",code:'"
                            + pointList.get(i).getPointcode() + "'"
                            + this.queryPointNode(Integer.toString(pid), s);
                }
                pointNodes += "]},";
                pointNode += pointNodes += pointChildNode;
            } else {
                pointNode += ",children :[]}";
            }
        } else {
            pointNode += "}";
        }
        this.logger.info(pointNode);
        return pointNode;
    }

    public class ComparatorPointSymbol implements Comparator {

        public int compare(Object arg0, Object arg1) {
            PointSymbol user0 = (PointSymbol) arg0;
            PointSymbol user1 = (PointSymbol) arg1;

            return user1.getId() < user0.getId() ? 1 : -1;
        }

    }

    public class ComparatorTemplate implements Comparator {

        public int compare(Object arg0, Object arg1) {
            Template user0 = (Template) arg0;
            Template user1 = (Template) arg1;

            return user1.getId() < user0.getId() ? 1 : -1;
        }

    }

    public class ComparatorLayer implements Comparator {

        public int compare(Object arg0, Object arg1) {
            Layer user0 = (Layer) arg0;
            Layer user1 = (Layer) arg1;

            return user1.getId() < user0.getId() ? 1 : -1;
        }

    }
}
