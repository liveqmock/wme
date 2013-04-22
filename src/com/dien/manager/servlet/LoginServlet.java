package com.dien.manager.servlet;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.log4j.Logger;

import com.dien.manager.dao.bean.User;
import com.dien.manager.util.JSONUtil;
import com.dien.manager.util.MD5Util;

public class LoginServlet extends HttpServlet {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private static final Logger logger = Logger.getLogger(LoginServlet.class);
	private static String url;

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		// TODO Auto-generated method stub
		doPost(req, resp);
	}

	@Override
	protected void doPost(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		String verificationCode = request.getParameter("verificationCode");
		if(verificationCode.length()==0){
			response.getWriter().write("03");
		}else {
			String validate = (String) request.getSession().getAttribute("validateCode");
			if(!validate.equalsIgnoreCase(verificationCode)){
				response.getWriter().write("04");
			}else{
				try {
					Map<String, String> map = loginPortal(request, response);
					response.getWriter().write(map.get("code"));
					/*if ("200".equals(map.get("code"))) {
				request.getRequestDispatcher("/edit.jsp").forward(request,
						response);
			} else {
				String wel = "<meta http-equiv='Refresh' content='3;url=reg.html>'"
						+ "welcom to my home";
				request.setAttribute("wel", wel);
				request.getRequestDispatcher("/index.html").forward(request,
						response);
			}*/
				} catch (Exception e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
	}

	@Override
	public void init() throws ServletException {
		super.init();
		url = getInitParameter("ManagerLoginUrl");
	}

	/**
	 * 用户系统登录
	 */
	public Map<String, String> loginPortal(HttpServletRequest request,
			HttpServletResponse response) throws Exception {
		String username = request.getParameter("username");
		String password = request.getParameter("password");
		if(username==null&&"".equals(username)&&password==null&&"".equals(password)){
			Map<String, String> map = new HashMap<String, String>(2);
			//map.put("errorMsg", "用户名或者密码不能为空!");
			map.put("code", "01");
			return map;
		}else{
			String md5 = MD5Util.encoderByMd5(password);
			// 查询后台是否存在用户
			User currentUser = null;
			// 返回数据集
			Map<String, String> map = new HashMap<String, String>(2);
			//map.put("errorMsg", "");
			try {
				currentUser = queryUser(username, md5);
			} catch (Exception e) {
				map.put("errorMsg", e.getMessage());
				e.printStackTrace();
			}
			if (currentUser == null) {
				//map.put("errorMsg", "用户名或者密码错误!");
				map.put("code", "02");
			} else {
				// 保存md5密码
				currentUser.setMd5password(md5);
				// 查询用户权限
				try {
					boolean pvalue = queryUserAuth(currentUser.getUserId());
					currentUser.setDataAuth(pvalue);
				} catch (Exception e) {
					logger.error("query user auth error!", e);
					e.printStackTrace();
				}
				HttpSession session = request.getSession();
				session.setAttribute("user", currentUser);
				map.put("code", "200");
			}
			return map;
		}
	}

	@Override
	public String getInitParameter(String name) {
		String value = getServletContext().getInitParameter(name);
		if (value == null) {
			value = super.getInitParameter(name);
		}
		return value;
	}

	/**
	 * 从运维查询用户
	 */
	public User queryUser(String username, String password) throws Exception {
		// 从运维系统查询接口
		String urlpath = url;
		// 构造查询参数
		StringBuilder buf = new StringBuilder();
		buf.append("action=doUserLogin");
		buf.append("&username=");
		buf.append(username);
		buf.append("&password=");
		buf.append(password);
		// 发送信息到运维系统查询
		String returnString = postConnection(urlpath, buf.toString(), true);
		if (returnString == null) {
			// 路径不对,网络连接超时
			String msg = "通信路径错误或者网络连接超时";
			throw new Exception(msg);
		}
		// 解析json数据,和运维系统保持一致
		Map<String, String> map = JSONUtil.toMap(returnString);
		if (map == null) {
			String msg = "解析返回数据出错!";
			throw new Exception(msg);
		}
		// 返回用户信息
		return getUserFromJSON(map);
	}

	/**
	 * 从运维查询用户权限
	 */
	public boolean queryUserAuth(long uid) throws Exception {
		// 从运维系统查询接口
		String urlpath = url;
		StringBuilder buf = new StringBuilder();
		buf.append("action=doUserAuth");
		buf.append("&userId=").append(uid);
		// 发送信息到运维系统查询
		String returnString = postConnection(urlpath, buf.toString(), true);
		if (returnString == null) {
			// 路径不对,网络连接超时
			String msg = "通信路径错误或者网络连接超时";
			throw new Exception(msg);
		}
		// 解析json数据,和运维系统保持一致
		Map<String, Object> map = JSONUtil.toMap(returnString);
		if (map == null) {
			String msg = "解析返回数据出错!";
			throw new Exception(msg);
		}
		Object obj = map.get("result");
		if (obj instanceof String && !"1".equals(obj)) {
			// 查询用户权限失败
			throw new Exception(map.get("msg").toString());
		}
		Map<String, String> subMap = (Map<String, String>) map.get("data");
		// 这里查询用户权限码.注册服务对应100，资源申请对应010，反馈对应001
		return getUserAuth(subMap);// 具有全部权限
	}

	/**
	 * 使用HttpURLConnection模拟POST提交注册数据
	 * 
	 * @param urlpath
	 *            需要连接的url路径
	 * @param param
	 *            传入的参数
	 * @param timeLimit
	 *            是否限制连接时间,是:5s超时
	 * @return json串
	 */
	public static String postConnection(String urlpath, String param,
			boolean timeLimit) {
		String jsonText = null;
		URL url = null;
		InputStream is = null;
		DataOutputStream dos = null;
		HttpURLConnection connection = null;
		try {
			url = new URL(urlpath);
			connection = (HttpURLConnection) url.openConnection();
			connection.setDoOutput(true);
			connection.setUseCaches(false);
			// connection.setDoInput(true);
			if (timeLimit) {
				connection.setReadTimeout(5000);
				connection.setConnectTimeout(5000);
			}
			connection.setRequestMethod("POST");
			connection.setRequestProperty("Content-Type",
					"application/x-www-form-urlencoded");
			dos = new DataOutputStream(connection.getOutputStream());
			dos.writeBytes(param);
			dos.flush();
			dos.close();
			is = connection.getInputStream();
			jsonText = InputStreamToString(is, "UTF-8");
		} catch (Exception e) {
			logger.error("post transfer data error!urlpath=" + urlpath, e);
			e.printStackTrace();
		} finally {
			try {
				if (is != null) {
					is.close();
				}
				if (connection != null) {
					connection.disconnect();
				}
			} catch (IOException e) {
				e.printStackTrace();
				logger.error("close post type stream error!urlpath=" + urlpath,
						e);
			}
		}
		return jsonText;
	}

	/**
	 * 将返回流转换为string
	 * 
	 * @param inputstream
	 * @param Encoding
	 * @return
	 */
	static String InputStreamToString(InputStream inputstream, String Encoding) {
		StringBuilder buf = new StringBuilder();
		BufferedReader reader = null;
		InputStreamReader inReader = null;
		try {
			inReader = new InputStreamReader(inputstream, Encoding);
			reader = new BufferedReader(inReader);
			String line;
			while ((line = reader.readLine()) != null) {
				buf.append(line);
			}
		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			try {
				if (reader != null) {
					reader.close();
				}
				if (inReader != null) {
					inReader.close();
				}
			} catch (IOException e) {
				e.printStackTrace();
				logger.error("close return inputstream error!", e);
			}
		}
		return buf.toString();
	}

	/**
	 * 从运维系统的返回流中取出用户信息
	 */
	public static User getUserFromJSON(Map<String, String> map) {
		// 是否成功标志
		String key = map.get("result");
		if ("1".equals(key)) {
			// 成功
			Object obj = map.get("data");
			Map<String, Object> userMap = null;
			if (obj instanceof Map) {
				userMap = (Map<String, Object>) obj;
			} else {
				userMap = JSONUtil.toMap(obj.toString());
			}
			// 系统中的用户只在这里进行new
			User user = new User();
			// username
			user.setUserName(userMap.get("username").toString());
			// fullname
			user.setFullName(userMap.get("fullname").toString());
			// userid
			user.setUserId(Integer.parseInt(userMap.get("userid").toString()));
			// userType
			user.setUsertype(userMap.get("userType").toString());

			return user;
		}
		return null;
	}

	/**
	 * 获取用户的权限码
	 */
	public static boolean getUserAuth(Map<String, String> map) {
		boolean value = false;

		if (map.containsKey("1001")) {
			value = true;
		}
		return value;
	}
}
