package com.dien.manager.tools;


import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.Enumeration;

import org.apache.log4j.Logger;
import org.apache.tools.zip.ZipFile;

import com.dien.manager.servlet.SetCharacterEncodingFilter;


/**
 * 解压缩文件服务类，将制定路径下的压缩包解压缩到指定的路径下。
 */
public class CompressFromZip {
    private static final Logger logger = Logger
            .getLogger(SetCharacterEncodingFilter.class);
    /**
     * 判断解压到的文件夹是否存在，不存在则创建。
     */
    private void createDirectory(String directory, String subDirectory) {
        String dir[];
        File fl = new File(directory);
        try {
            // 如果解压文件基本目录结构不存在,新建
            if (subDirectory == "" && fl.exists() != true) {
                // logger.info("*******创建基本目录结构*******"+directory);
                fl.mkdir();
            }
            //主要创建子目录
            else if (subDirectory != "") {
                dir = subDirectory.replace('\\', '/').split("/");
                for (int i = 0; i < dir.length; i++) {
                    File subFile = new File(directory + File.separator + dir[i]);
                    if (subFile.exists() == false) {
                        // logger.info("*******创建子目录*******"+directory + File.separator + dir[i]);
                        subFile.mkdir();
                    }
                    directory += File.separator + dir[i];
                }
            }
        } catch (Exception ex) {
            logger.info(ex.getMessage());
        }
    }
    @SuppressWarnings("unchecked")
    public String unZip(File zipFile){
        try {

           unZip(zipFile.getPath(),zipFile.getParent() +File.separator+ zipFile.getName().substring(0, zipFile.getName().indexOf(".zip")));
           return zipFile.getParent();
       } catch (Exception e) {
           e.printStackTrace();
       }
        return null;
    }
    /**
     * 解压缩文件函数。
     */
    @SuppressWarnings("unchecked")
    public void unZip(String zipFileName, String outputDirectory) throws Exception {
        ZipFile zipFile = null;
        try {
            zipFile = new org.apache.tools.zip.ZipFile(zipFileName);
            Enumeration e = zipFile.getEntries();
            org.apache.tools.zip.ZipEntry zipEntry = null;
            createDirectory(outputDirectory, "");
            while (e.hasMoreElements()) {
                zipEntry = (org.apache.tools.zip.ZipEntry) e.nextElement();
                logger.info("========== 解压 ========== " + zipEntry.getName());
                //判断是否为一个文件夹
                if (zipEntry.isDirectory()) {
                    String name = zipEntry.getName().trim();
                    //因为后面带有一个/,所有要去掉
                    name = name.substring(0, name.length() - 1);
                    File f = new File(outputDirectory + File.separator + name);
                    if (!f.exists()) {
                        f.mkdir();
                    }
                    //logger.info("*******创建根目录*******" + outputDirectory    + File.separator + name);
                } else {
                    String fileName = zipEntry.getName();
                    fileName = fileName.replace('\\', '/');

                    // 判断子文件是否带有目录,有创建,没有写文件
                    if (fileName.indexOf("/") != -1) {
                        createDirectory(outputDirectory,
                                fileName.substring(0, fileName.lastIndexOf("/")));
                        fileName = fileName.substring(fileName.lastIndexOf("/") + 1);
                    }
                    
                    File f = new File(outputDirectory + File.separator + zipEntry.getName());
                    f.createNewFile();
                    InputStream in = zipFile.getInputStream(zipEntry);
                    FileOutputStream out = new FileOutputStream(f);

                    byte[] by = new byte[1024];
                    int c;
                    while ((c = in.read(by)) != -1) {
                        out.write(by, 0, c);
                    }
                    // zipFile.close();
                    in.close();
                    out.close();
                    
                }
            }
        } catch (Exception ex) {
            logger.info(ex.getMessage());
        } finally {
            if (zipFile != null)
                zipFile.close();
        }
    }


    public static void main(String[] args) {
        // 测试用例
        CompressFromZip test = new CompressFromZip();
        try {// E:\apache-tomcat-6.0.18\webapps\Service\WEB-INF\ftp\apache-ftpserver-1.0.5\res\home
             // test.unZip("D:\\Java\\chinaz.zip", "D:\\Java\\chinaz");
            File file = new File("C:/Documents and Settings/Administrator/Local Settings/Temp/upload-45643.zip");
            //test.unZip(file.getPath(),file.getParent() +File.separator+ file.getName().substring(0, file.getName().indexOf(".zip")));
            test.unZip(file);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
