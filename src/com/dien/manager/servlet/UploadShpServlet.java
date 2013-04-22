/*
 * Copyright 2010 Manuel Carrasco Moñino. (manolo at apache/org) 
 * http://code.google.com/p/gwtupload
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.dien.manager.servlet;

import static gwtupload.shared.UConsts.PARAM_SHOW;
import gwtupload.server.UploadAction;
import gwtupload.server.exceptions.UploadActionException;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import net.sf.json.JSONObject;

import org.apache.commons.fileupload.FileItem;

import com.dien.manager.dao.bean.Config;
import com.dien.manager.dao.bean.User;
import com.dien.manager.tools.Basis;
import com.dien.manager.tools.CopyFile;
import com.dien.manager.util.Util;
import com.dien.manager.util.ZipUtil;

/**
 * This is an example of how to use UploadAction class.
 * 
 * This servlet saves all received files in a temporary folder, and deletes them when the user sends a remove request.
 * 
 * @author Manolo Carrasco Moñino
 * 
 */
public class UploadShpServlet extends UploadAction {

    private static final long serialVersionUID = 1L;

    private Basis basis;

    Hashtable<String, String> receivedContentTypes = new Hashtable<String, String>();

    /**
     * Maintain a list with received files and their content types.
     */
    Hashtable<String, File> receivedFiles = new Hashtable<String, File>();

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        basis = new Basis();
        logger.info("sde 连接");
    }

    /**
     * Override executeAction to save the received files in a custom place and delete this items from session.
     */
    @Override
    public String executeAction(HttpServletRequest request, List<FileItem> sessionFiles)
            throws UploadActionException {
        String response = "";
        int cont = 0;
        HttpSession session = request.getSession();
        User users = (User) session.getAttribute("user");
        if (users != null && users.isDataAuth()) {

            for (FileItem item : sessionFiles) {
                if (false == item.isFormField()) {
                    cont++;
                    try {
                        // 1. 保存文件
                        File file = File.createTempFile(item.getFieldName(), ".zip");
                        item.write(file);
                        FileInputStream fis = new FileInputStream(file);
                        if (fis.available() > 0) {
                            System.out.println("File has " + fis.available() + " bytes");
                            // 2.解压zip文件
                            CopyFile copyFile = new CopyFile();
                            String tmpFolder = Config.getOutPath() + File.separator
                                    + item.getFieldName();
                            copyFile.delFolder(tmpFolder);
                            copyFile.newFolder(tmpFolder);
                            ZipUtil.unZip(file.getAbsolutePath(), tmpFolder + File.separator, true);
                            // 3.提取shp文件
                            ArrayList<String> slist = new ArrayList<String>();
                            getAllFile(new File(tmpFolder), slist);
                            if (slist.size() > 0) {
                                ArrayList<String> msglist = new ArrayList<String>();
                                if (checkShpFileComplete(slist.get(0), msglist)) {
                                    // 4. shp文件入库
                                    // SDEWrapper sde = new SDEWrapper(Config.getProperties());
                                    File shpFile = new File(slist.get(0));
                                    String path = shpFile.getPath();
                                    String layerName = shpFile.getName();
                                    layerName = layerName.substring(0, layerName.indexOf("."));
                                    // 处理图层名称
                                    // 中文变成英文
                                    layerName = basis.generatorTableName(layerName);
                                    session.setAttribute(layerName, path);
                                    // sde.shpToSde(path, layerName);
                                    // 5. 完成
                                    logger.info("--" + file.getAbsolutePath() + "--isexist: "
                                            + file.exists());

                                    // / Save a list with the received files
                                    receivedFiles.put(item.getFieldName(), file);
                                    receivedContentTypes.put(item.getFieldName(),
                                            item.getContentType());

                                    // / Compose a xml message with the full file information
                                    response += "<file-" + cont + "-field>" + item.getFieldName()
                                            + "</file-" + cont + "-field>\n";
                                    response += "<file-" + cont + "-name>" + item.getName()
                                            + "</file-" + cont + "-name>\n";
                                    response += "<file-" + cont + "-size>" + item.getSize()
                                            + "</file-" + cont + "-size>\n";
                                    response += "<file-" + cont + "-type>" + item.getContentType()
                                            + "</file-" + cont + "type>\n";
                                    response += "<file-" + cont + "-layerid>" + layerName
                                            + "</file-" + cont + "layerid>\n";
                                } else {
                                    response += "<file-" + cont + "-error>"
                                            + Util.listToWhere(msglist, ",") + "</file-" + cont
                                            + "error>\n";
                                }
                            } else {
                                response += "<file-" + cont + "-error>在zip文件中没有找到shp文件</file-"
                                        + cont + "error>\n";
                            }
                        } else {
                            response += "<file-" + cont + "-error>可能你上传了一个空文件</file-" + cont
                                    + "error>\n";
                        }
                    } catch (IOException e) {
                        response += "<file-" + cont + "-error>shp文件导入时候错误，请检查下shp地图数据是否有损坏！</file-"
                                + cont + "error>\n";

                    } catch (InterruptedException e) {
                        response += "<file-" + cont + "-error>发生不能控制的异常</file-" + cont + "error>\n";

                    } catch (Exception e) {
                        response += "<file-" + cont + "-error>处理文件时候错误，请重新上传文件试试！</file-" + cont
                                + "error>\n";

                    }
                }
            }
        } else {
            response += "<file-" + cont + "-error>用户没有权限上传文件！</file-" + cont + "error>\n";
        }
        // / Remove files from session because we have a copy of them
        removeSessionFileItems(request);

        // / Send information of the received files to the client.
        return "<response>\n" + response + "</response>\n";
    }

    /**
     * Get the content of an uploaded file.
     */
    @Override
    public void getUploadedFile(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String fieldName = request.getParameter(PARAM_SHOW);
        File f = receivedFiles.get(fieldName);
        if (f != null) {
            response.setContentType(receivedContentTypes.get(fieldName));
            FileInputStream is = new FileInputStream(f);
            copyFromInputStreamToOutputStream(is, response.getOutputStream());
        } else {
            renderXmlResponse(request, response, XML_ERROR_ITEM_NOT_FOUND);
        }
    }

    /**
     * Remove a file when the user sends a delete request.
     */
    @Override
    public void removeItem(HttpServletRequest request, String fieldName)
            throws UploadActionException {
        File file = receivedFiles.get(fieldName);
        receivedFiles.remove(fieldName);
        receivedContentTypes.remove(fieldName);
        if (file != null) {
            file.delete();
        }
    }

    Pattern p = Pattern.compile(".+\\.shp");

    public void getAllFile(File file, ArrayList slist) {
        if (file.isDirectory()) {
            // isHanzi(file.getAbsolutePath().toString());
            File[] filearry = file.listFiles();
            for (File f : filearry) {
                // isHanzi(f.getAbsolutePath().toString());
                if (f.isDirectory()) {
                    getAllFile(f, slist);
                } else {
                    Matcher m = p.matcher(f.getAbsolutePath());
                    if (m.matches()) {
                        String s = f.getAbsoluteFile().toString();
                        slist.add(s);
                    }

                }
            }
        }
    }

    /**
     * 检查shp文件的完整性
     * 
     * @param pathAndName
     * @return
     */
    public boolean checkShpFileComplete(String pathAndName, ArrayList<String> msglist) {
        File shpFile = new File(pathAndName);
        shpFile.getParent();
        if (shpFile.isFile()) {
            String fNameAll = shpFile.getName();
            String fName = fNameAll.substring(0, fNameAll.lastIndexOf("."));
            HashMap<String, String> fileList = getShpAllFile(shpFile.getParent(), fName);
            logger.info(fileList);
            if (fileList.get(".shp") == null) {
                msglist.add("没有找到.shp文件");
            }
            if (fileList.get(".shx") == null) {
                msglist.add("没有找到.shx文件");
            }
            if (fileList.get(".dbf") == null) {
                msglist.add("没有找到.dbf文件");
            }
            if (fileList.get(".prj") == null) {
                msglist.add("没有找到.prj文件");
            }
            return msglist.size() > 0 ? false : true;
        } else {
            return false;
        }
    }

    // 得到shp文件的其它部分文件
    public HashMap<String, String> getShpAllFile(String pathStr, String name) {
        HashMap<String, String> fileList = new HashMap<String, String>();
        File path = new File(pathStr);
        if (path.isDirectory()) {
            File[] filearry = path.listFiles();
            for (File f : filearry) {
                if (f.isFile()) {
                    String fNameAll = f.getName();
                    // System.out.println(fNameAll);
                    if (fNameAll.contains(".")) {
                        String fName = fNameAll.substring(0, fNameAll.lastIndexOf("."));
                        String fSuffix = fNameAll.substring(fNameAll.lastIndexOf("."));
                        if (fName.equals(name)) {
                            fileList.put(fSuffix.toLowerCase(), f.getPath());
                        }
                    }

                }
            }
        }
        return fileList;
    }
}