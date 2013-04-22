/*
 * Created on 2005-8-31
 *
 * TODO To change the template for this generated file go to
 * Window - Preferences - Java - Code Style - Code Templates
 */
package com.dien.manager.servlet;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import net.sf.json.JSONObject;

import org.apache.log4j.Logger;

import com.dien.manager.dao.bean.User;

/**
 * @author regon
 * 
 *         TODO To change the template for this generated type comment go to
 *         Window - Preferences - Java - Code Style - Code Templates
 */
public class SetCharacterEncodingFilter implements Filter {

	private static final Logger logger = Logger
			.getLogger(SetCharacterEncodingFilter.class);

	protected String encoding = null;
	protected String portalUrl=null;

	protected FilterConfig filterConfig = null;

	protected boolean ignore = true;


	// public static ThreadLocal<HttpServletRequest> requestLocal = new
	// ThreadLocal<HttpServletRequest>();

	/**
	 * Take this filter out of service.
	 */

	public void destroy() {

		this.encoding = null;

		this.filterConfig = null;

	}

	/**
	 * Select and set (if specified) the character encoding to be used to
	 * interpret request parameters for this request.
	 */

	public void doFilter(ServletRequest servletRequest,
			ServletResponse servletResponse, FilterChain chain)
			throws IOException, ServletException {
	    HttpServletRequest request = (HttpServletRequest) servletRequest;
	    HttpServletResponse response = (HttpServletResponse) servletResponse;
		// 设置传输设置
		if (ignore || (request.getCharacterEncoding() == null)) {

			String encoding = selectEncoding(request);

			if (encoding != null) {
				// log.info("encoding:"+encoding);
				request.setCharacterEncoding(encoding); 

			}
		}
		HttpSession session = request.getSession();
		User users = (User) session.getAttribute("user");
		
		String url = request.getServletPath();
//		if (url == null) {
//			url = "";
//		}
		if (users!=null||noFileUrl(url)) { // 判断权限的请求url和session信息||noFileUrl(url)
			chain.doFilter(request, response);
		} else{
		    if(url.indexOf(".do") >= 0){
		        response.setContentType("text/html;charset=utf-8");
		            PrintWriter out = response.getWriter();
		            JSONObject obj = new JSONObject();
		            obj.put("ret", false);
		            obj.put("type", 1);
		            obj.put("msg", "需要重新登录！");
		            out.write(obj.toString());
		            out.flush();
		            out.close();  
		    }else{
		        response.sendRedirect("index.html");
		    }
//			String userId = request.getParameter("userId");
//			String userName = request.getParameter("userName");
//			String fullName = request.getParameter("fullName");
//			String md5password = request.getParameter("md5password");
//			String usertype = request.getParameter("usertype");
//			String dataAuth = request.getParameter("dataAuth");
//			
//			StringBuilder buf = new StringBuilder();
//			buf.append("userId=").append(userId);
//			buf.append("&userName=").append(userName);
//			buf.append("&fullName=").append(fullName);
//			buf.append("&md5password=").append(md5password);
//			buf.append("&usertype=").append(usertype);
//			buf.append("&dataAuth=").append(dataAuth);
//			
//			String passstr = buf.toString();
//			passstr = MD5Util.encoderByMd5(passstr);
//			String encoder = request.getParameter("encoder");
			
//			if (!passstr.equals(encoder)) {
//				response.setContentType("text/html;charset=utf-8");
//				response.getWriter()
//				.println("<div style='margin: 100 auto;text-align: center;"
//								+ "font: bold 18px 宋体;color: #0066CC;vertical-align: middle'> Sorry,您登陆信息错误，请重新登录!");
//				    response.getWriter().println("</div>");
//
//				 if(this.portalUrl!=null&&!"".equals(this.portalUrl))
//				response.getWriter().println("<a style='text-align: center;vertical-align: middle' href='"+this.portalUrl+"'>返回门户首页</a>");
	
                                
//			} else {
//				User user = new User();
//				user.setUserId(Integer.parseInt(userId));
//				user.setUserName(userName);
//				user.setUsertype(usertype);
//				user.setMd5password(md5password);
//				user.setFullName(fullName);
//				boolean Auth;
//				if (dataAuth.equals("true")) {
//					Auth = true;
//				} else {
//					Auth = false;
//				}
//				user.setDataAuth(Auth);
//				session.setAttribute("user", user);
//				logger.info("登陆信息正确");
//				chain.doFilter(request, response);
//			}
		} 

	}

	/**
	 * Place this filter into service.	 */

	public void init(FilterConfig filterConfig) throws ServletException {

		this.filterConfig = filterConfig;

		this.encoding = filterConfig.getInitParameter("encoding");
		this.portalUrl = filterConfig.getInitParameter("portalUrl");

		String value = filterConfig.getInitParameter("ignore");

		if (value == null) {
			this.ignore = true;
		}

		else if (value.equalsIgnoreCase("true")) {

			this.ignore = true;
		}

		else if (value.equalsIgnoreCase("yes")) {

			this.ignore = true;
		}

		else {

			this.ignore = false;
		}

	}

	/**
	 * Select an appropriate character encoding to be used, based on the
	 * characteristics of the current request and/or filter initialization
	 * parameters. If no character encoding should be set, return
	 * <code>null</code>.
	 */

	protected String selectEncoding(ServletRequest request) {

		return (this.encoding);

	}

	/**
	 * 是否需要判断权限,如客户端浏览、登录页面则不需要判断权限
	 */

	protected boolean noFileUrl(String url) {
		if (url.indexOf("edit.jsp") >= 0||url.indexOf("editv2.jsp") >= 0||url.indexOf(".do") >= 0) {
			return false;
		} 
		return true;
	}

}
