package com.dien.manager.servlet;

import java.io.IOException;
import java.io.PrintWriter;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
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
import org.geotools.arcsde.session.ISession;

import com.dien.manager.dao.bean.Alias;
import com.dien.manager.dao.bean.Config;
import com.dien.manager.dao.bean.Layer;
import com.dien.manager.dao.bean.User;
import com.dien.manager.tools.Basis;
import com.dien.manager.tools.TableFactory;
import com.esri.sde.sdk.client.SeColumnDefinition;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeTable;

/**
 * Servlet implementation class ManagerServlet
 */
public class ManagerAliasServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private static Logger logger = Logger.getLogger(ManagerAliasServlet.class);

    public static final String TOKEN = "token";

    TableFactory tableFactory = null;
    private Basis basis=null;

    /**
     * @see HttpServlet#HttpServlet()
     */
    public ManagerAliasServlet() {
        super();
    }

    /**
     * @see Servlet#init(ServletConfig)
     */
    public void init(ServletConfig config) throws ServletException {

        tableFactory = new TableFactory();
        basis = new Basis();

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
        if("query".equals(operate)){
        	String layerid = request.getParameter("layerid");
        	JSONArray layers = null;
        	JSONObject obj = new JSONObject();
        	if(layerid==null||"".equals(layerid)){
        		try {
					List<Layer> aliasList = tableFactory.list(Layer.class, "");
					layers = JSONArray.fromObject(aliasList);
					obj.put("ret", true);
        			obj.put("msg", "成功");
        			obj.put("layers", layers);
        			logger.info("别名管理:" + layers.toString());
				} catch (Exception e) {
					obj.put("ret", false);
        			obj.put("msg", "查询失败！！！");
					e.printStackTrace();
				}
        	}else{
        		String layerName = request.getParameter("layerName");
        		try {
        			layers = listAlias(layerid,layerName);
        			obj.put("ret", true);
        			obj.put("msg", "成功");
        			obj.put("layers", layers);
        			logger.info("别名管理:" + layers.toString());
        		} catch (Exception e) {
        			obj.put("ret", false);
        			obj.put("msg", "查询失败！！！");
        			e.printStackTrace();
        		}
        	}
             
             PrintWriter out = response.getWriter();
             out.write(obj.toString());
             out.flush();
             out.close();
        }else if ("add".equals(operate)) {// 增加別名
            String id = request.getParameter("id");
            String alias = request.getParameter("alias");
            String layerid = request.getParameter("layerid");
            JSONObject obj = new JSONObject();
            Integer sid =Integer.parseInt(id);
            long s = -1;
            try {
            	List list = tableFactory.list(Alias.class, "id <>"+sid+"and layerid="+layerid+" and alias='" + alias+"'" );
            	if(list.size()>0){
            		 obj.put("ret", false);
                     obj.put("msg", "修改别名重复！");
            	}else{
            		if (sid>0) {
            			updateAlias(sid,alias);
            		} else {
            			String fieldname = request.getParameter("fieldname");
            			s = addAlias(Integer.parseInt(layerid), fieldname, alias);
            		}
            		obj.put("ret", true);
            		obj.put("id", s);
            		obj.put("msg", "成功修改别名记录");
            	}
            } catch (Exception e) {
            	 obj.put("ret", false);
                 obj.put("msg", "修改别名记录失败");
                e.printStackTrace();
            }

            PrintWriter out = response.getWriter();
            out.write(obj.toString());
            out.flush();
            out.close();
            logger.info("增加別名:" + alias);
        }else if ("updateLayer".equals(operate)){
        	String layerid = request.getParameter("layerid");
            String layername = request.getParameter("layername");
            JSONObject obj = new JSONObject();
            if("".equals(layername) && layername==null){
            	 obj.put("ret", false);
                 obj.put("msg", "图层别名不能为空！");
            }else{
            	try {
            		List<Layer> list = tableFactory.list(Layer.class, "id <>"+layerid+"and layername='"+layername+"'");
            		if(list.size()>0){
            			obj.put("ret", false);
            			obj.put("msg", "图层别名重复！");
            		}else{
            			updateLayer(layerid,layername);
            			obj.put("ret", true);
            			obj.put("msg", "成功修改图层别名记录！");
            		}
            	} catch (Exception e) {
            		obj.put("ret", false);
            		obj.put("msg", "修改图层别名记录失败！");
            		e.printStackTrace();
            	}
            }
            PrintWriter out = response.getWriter();
            out.write(obj.toString());
            out.flush();
            out.close();
            logger.info("修改图层別名:" + layername);
        }
    }

//    /*
//     * 判断别名是否已经存在
//     */
//    public boolean isAliasExist(int layerid, String fieldname) throws Exception {
//
//        List list = tableFactory.list(Alias.class, "layerid=" + layerid + " and fieldname='"
//                + fieldname + "'");
//
//        return list.size() > 0 ? true : false;
//    }

    /**
     * 添加一个图层别名
     * 
     * @param layerid
     * @param layername
     * @throws Exception
     */
    public void updateLayer(String layerid, String layername) throws Exception{
        // int user, String value, byte[] image , String label, String
        // description,Date modifydate
    	List<Layer> list = tableFactory.list(Layer.class, "id="+layerid);
        Layer layer = ((Layer) list.get(0));
        layer.setLayername(layername);
        tableFactory.update(layer);
        basis.updateLayerName(layer.getTablename(),layername);
    }

    /**
     * 添加一个字段别名
     * 
     * @param layerid
     * @param fieldname
     * @param aliasName
     * @return
     * @throws SeException
     */
    public long addAlias(int layerid, String fieldname, String aliasName) throws SeException,
            IOException, NoSuchMethodException, IllegalAccessException, InvocationTargetException,
            NoSuchFieldException {
        // int user, String value, byte[] image , String label, String
        // description,Date modifydate
        Alias alias = new Alias();
        alias.setLayerid(layerid);
        alias.setFieldname(fieldname);
        alias.setAlias(aliasName);

        return tableFactory.insert(alias);
    }

    /**
     * 更新一个字段别名
     * 
     * @param id
     * @param aliasName
     * @throws SeException
     * @throws IOException
     * @throws NoSuchMethodException
     * @throws IllegalAccessException
     * @throws InvocationTargetException
     */

    public void updateAlias(int id, String aliasName) throws SeException,
            IOException, NoSuchMethodException, IllegalAccessException, InvocationTargetException,
            NoSuchFieldException, InstantiationException {

        List list = tableFactory.list(Alias.class, "id=" + id );
        Alias alias = ((Alias) list.get(0));
        alias.setAlias(aliasName);
        tableFactory.update(alias);
    }

    /**
     * 模塊查詢 where layerid= 
     */
    public JSONArray listAlias(String layerid,String layerName) throws Exception {
    	ISession session = Config.getSession();
    	SeTable table;
    	try {
        	table = session.getTable(layerName);
        } catch (IOException e) {
            throw e;
        } finally {
            if (session != null) {
                session.dispose();
            }
        }
    	
    	Map<String,Integer> map=new HashMap<String,Integer>();
    	List<Alias> alist = new ArrayList<Alias>();
        try {
			SeColumnDefinition[] tableDef = table.describe();
			int tlength= tableDef.length;
			  for (int i = 0; i < tlength; i++) {
				  int s = -1;
				  Alias al= new Alias();
				  al.setId(s-i);
				  al.setLayerid(Integer.parseInt(layerid));
				  al.setFieldname(tableDef[i].getName());
				  alist.add(al);
				  //map用来保存下标值
				  map.put(tableDef[i].getName(), i);
	            }
		} catch (SeException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        
    	String where ="layerid="+ layerid;
        List<Alias> list = tableFactory.list(Alias.class, where);
        int listSize=list.size();
        for(int i=0;i<listSize;i++){
            Integer index = map.get(list.get(i).getFieldname());
            if (index != null)
                alist.set(index, list.get(i));
        }
        return JSONArray.fromObject(alist);
    }

    /**
     * 排序比较器
     * 
     * @author Administrator
     * 
     */
    public class ComparatorAlias implements Comparator {

        public int compare(Object arg0, Object arg1) {
            Alias alias0 = (Alias) arg0;
            Alias alias1 = (Alias) arg1;

            return alias1.getId() < alias0.getId() ? 1 : -1;
        }

    }
}
