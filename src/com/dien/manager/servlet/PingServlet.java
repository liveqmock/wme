package com.dien.manager.servlet;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class PingServlet extends HttpServlet{
    

	    
	    
 protected void service(HttpServletRequest request, HttpServletResponse response)    
             throws ServletException, java.io.IOException {    
    
         
	 	 response.setContentType("text/html");  
         
         response.setHeader("Pragma", "no-cache");    
         response.setHeader("Cache-Control", "no-cache");    
         response.setDateHeader("Expires", 0);    
    
         response.getWriter().write("ok");
         response.getWriter().close();   
	 }  
}
