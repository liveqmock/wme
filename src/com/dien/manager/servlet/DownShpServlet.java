package com.dien.manager.servlet;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import net.sf.json.JSONObject;

import org.apache.log4j.Logger;
import org.geoserver.wfs.response.SDEWrapper;

import com.dien.manager.dao.bean.Config;
import com.dien.manager.dao.bean.User;
import com.dien.manager.tools.Basis;
import com.dien.manager.tools.CopyFile;
import com.dien.manager.util.ZipUtil;
import com.esri.sde.sdk.client.SeException;
/**
 * 这个类提供图层下载，
 * 将一个sde图层转换层shp文件，然后将它压缩到zip文件
 * @author ben
 *
 */
public class DownShpServlet extends HttpServlet {
    private static Logger logger = Logger.getLogger(DownShpServlet.class);


    private Basis basis;
    /**
     * Constructor of the object.
     */
    public DownShpServlet() {
        super();
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
        if (users != null) {
            this.down(request, response);
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
        this.down(request, response);
    }
    public void down(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String tablename = request.getParameter("tablename");
        SDEWrapper sde = new SDEWrapper(Config.getProperties());

        //File shpFile;
        CopyFile copyFile = new CopyFile();
        String tmpFolder = Config.getOutPath()+File.separator+tablename;
        String tmpZipFile=tmpFolder+".zip";
        copyFile.delFolder(tmpFolder);
        copyFile.delFile(tmpZipFile);
        copyFile.newFolder(tmpFolder);
        
        try {
            String type = basis.getLayerType(tablename);
            type= type.equals("line") ? "arc" : type;
            sde.sdeToShp(tmpFolder+File.separator+tablename+".shp", tablename,type);
            ZipUtil.doZip(tmpFolder, tmpZipFile);
     
            InputStream inStream=new FileInputStream(tmpZipFile); 


            byte[] b  = new byte[1000]; 
            int    len= 0; 

            response.reset(); 
            response.setContentType("application/x-msdownload"); 
            response.addHeader("Content-Disposition", "attachment;filename=" + tablename + ".zip");
            //response.addHeader("Content-Length", "" + tmpZipFile.length());
          //循环取出流中的数据 
            OutputStream out = response.getOutputStream();
            while((len=inStream.read(b)) >0) {
             out.write(b,0,len); 
            }
            inStream.close();
            out.flush();
            out.close();

        } catch (InterruptedException e) {
            e.printStackTrace();
        } catch (SeException e) {
            e.printStackTrace();
        }
        
    }
    /**
     * Initialization of the servlet. <br>
     * 
     * @throws ServletException if an error occurs
     */
    public void init() throws ServletException {
        basis= new Basis();
    }

}
