package com.dien.manager.servlet;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;

import com.dien.manager.dao.bean.Config;
import com.dien.manager.tools.Basis;

/**
 * 显示样式图片
 * 
 * @author ben
 * 
 */
public class SymbolImageServlet extends HttpServlet {
    private static Logger logger = Logger.getLogger(SymbolImageServlet.class);

    private static Logger serviceLog = Logger.getLogger("service");

    private Basis basis;
    private HashMap<String,String> types;
    /**
     * Constructor of the object.
     */
    public SymbolImageServlet() {
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
        String imageType = request.getParameter("type");
        String imageName = request.getParameter("name");
        if ("point".equals(imageType)) {
            downPointImage(imageName, request, response);
        }
    }

    private void downPointImage(String imageName, HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        String path =Config.getOutPath()+File.separator+"symbolimage/" + imageName;
        File imgfile= new File(path);
        InputStream inStream =null;
        if(!imgfile.isFile()){
            inStream = new FileInputStream(request.getRealPath("/") + "images/point.png");
        }else{
            inStream = new FileInputStream(Config.getOutPath()+File.separator+"symbolimage/" + imageName);
        }
        byte[] b = new byte[1000];
        int len = 0;
       

        response.reset();
        String[] strs=imageName.split("\\.");
        String str = strs[strs.length-1];
        response.setContentType(this.types.get(str.toUpperCase()));
        // response.addHeader("Content-Length", "" + tmpZipFile.length());
        // 循环取出流中的数据
        OutputStream out;
        try {
            out = response.getOutputStream();
            while ((len = inStream.read(b)) > 0) {
                out.write(b, 0, len);
            }
            inStream.close();
            out.flush();
            out.close();
        } catch (IOException e) {
            logger.info(e.getMessage());
        }

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

        this.doGet(request, response);
    }

    /**
     * Initialization of the servlet. <br>
     * 
     * @throws ServletException if an error occurs
     */
    public void init() throws ServletException {
        basis = new Basis();
        types = new HashMap<String,String>();
        types.put("BMP", "image/bmp");
        types.put("GIF", "image/gif");
        types.put("JPEG", "image/jpeg");
        types.put("TIFF", "image/tiff");
        types.put("DCX", "image/x-dcx");
        types.put("PCX", "image/x-pcx");
        types.put("HTML", "text/html");
        types.put("TXT", "text/plain");
        types.put("XML", "text/xml");
        types.put("AFP", "application/afp");
        types.put("PDF", "application/pdf");
        types.put("RTF", "application/rtf");
        types.put("MSWORD", "application/msword");
        types.put("MSEXCEL", "application/vnd.ms-excel");
        types.put("MSPOWERPOINT", "application/vnd.ms-powerpoint");
        types.put("WORDPERFECT", "application/wordperfect5.1");
        types.put("WORDPRO", "application/vnd.lotus-wordpro");
        types.put("VISIO", "application/vnd.visio");
        types.put("FRAMEMAKER", "application/vnd.framemaker");
        types.put("LOTUS123", "application/vnd.lotus-1-2-3");

    }

}
