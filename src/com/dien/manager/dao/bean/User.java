package com.dien.manager.dao.bean;

public class User {
	/* 用户ID */
	private int userId;
	/* 用户名 */
	private String userName;
	/* 用户别名 */
	private String fullName;
	/* 密码 */
	private String md5password;
	/* 用户类型 */
	private String usertype;
	/* 用户权限 */
	private boolean dataAuth;

	public int getUserId() {
		return userId;
	}

	public void setUserId(int userId) {
		this.userId = userId;
	}

	public String getUserName() {
		return userName;
	}

	public void setUserName(String userName) {
		this.userName = userName;
	}

	public String getFullName() {
		return fullName;
	}

	public void setFullName(String fullName) {
		this.fullName = fullName;
	}

	public String getMd5password() {
		return md5password;
	}

	public void setMd5password(String md5password) {
		this.md5password = md5password;
	}

	public String getUsertype() {
		return usertype;
	}

	public void setUsertype(String usertype) {
		this.usertype = usertype;
	}

	public boolean isDataAuth() {
		return dataAuth;
	}

	public void setDataAuth(boolean dataAuth) {
		this.dataAuth = dataAuth;
	}

}
