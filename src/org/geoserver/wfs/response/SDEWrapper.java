/* Copyright (c) 2001 - 2007 TOPP - www.openplans.org. All rights reserved.
 * This code is licensed under the GPL 2.0 license, available at the root
 * application directory.
 */
package org.geoserver.wfs.response;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.log4j.Logger;
import org.geotools.arcsde.session.ArcSDEConnectionConfig;

import com.dien.manager.dao.bean.Config;

/**
 * Helper used to invoke ogr2ogr
 * 
 * @author Andrea Aime - OpenGeo
 * 
 */
public class SDEWrapper {

    private static final Logger LOGGER = Logger.getLogger(SDEWrapper.class);

    private String ogrExecutable;

    private String instance;

    private String server;

    private String database;

    private String user;

    private String password;

    private String sdebin;

    public SDEWrapper(String server, String instance, String database, String user,
            String password, String sdeData) {
        super();
        this.instance = instance;
        this.server = server;
        this.database = database;
        this.user = user;
        this.password = password;
        this.sdebin = sdeData;
    }

    public SDEWrapper(Map<String, Serializable> properties){
        super();
        
        this.server = properties.get(ArcSDEConnectionConfig.SERVER_NAME_PARAM_NAME).toString();
        this.instance = properties.get(ArcSDEConnectionConfig.PORT_NUMBER_PARAM_NAME).toString();
        this.database = properties.get(ArcSDEConnectionConfig.INSTANCE_NAME_PARAM_NAME).toString();
        this.user = properties.get(ArcSDEConnectionConfig.USER_NAME_PARAM_NAME).toString();
        this.password = properties.get(ArcSDEConnectionConfig.PASSWORD_PARAM_NAME).toString();
        this.sdebin = Config.getSdebin();
        
    }
    public SDEWrapper(String ogrExecutable, String sdeData) {
        this.ogrExecutable = ogrExecutable;
        this.sdebin = sdeData;
    }

    /**
     * Performs the conversion, returns the name of the (main) output file
     */
    public void shpToSde(String path, String layerName) throws IOException, InterruptedException {
        List<String> cmd = new ArrayList<String>();
        cmd.add("shp2sde");
        cmd.add("-o");
        cmd.add("create");
        cmd.add("-l");
        cmd.add(layerName + ",shape");
        cmd.add("-f");
        cmd.add(path);
        cmd.add("-x");
        cmd.add("-20037508.34,-20037508.34, 1000000");
        cmd.add("-a");
        cmd.add("all");
        cmd.add("-i");
        cmd.add(instance);
        cmd.add("-s");
        cmd.add(server);
        cmd.add("-D");
        cmd.add(database);
        cmd.add("-u");
        cmd.add(user);
        cmd.add("-p");
       
        cmd.add(password);
        cmd.add("-C");
        cmd.add("objectid,SDE,1");

        StringBuilder sb = new StringBuilder();
        int exitCode = run(cmd, sb);
        if (exitCode != 0)
            throw new IOException("shp2sde did not terminate successfully, exit code " + exitCode
                    + ". Was trying to run: " + cmd + "\nResulted in:\n" + sb);

        System.out.println(sb.toString());
    }

    /**
     * Performs the conversion, returns the name of the (main) output file
     */
    public File sdeToShp(String outPath, String layerName, String type) throws IOException,
            InterruptedException {
        List<String> cmd = new ArrayList<String>();
        cmd.add("sde2shp");
        cmd.add("-o");
        cmd.add("init");
        cmd.add("-l");
        cmd.add(layerName + ",shape");
        cmd.add("-f");
        cmd.add(outPath);
        cmd.add("-t");
        cmd.add(type);
        cmd.add("-a");
        cmd.add("all");
        cmd.add("-i");
        cmd.add(instance);
        cmd.add("-s");
        cmd.add(server);
        cmd.add("-D");
        cmd.add(database);
        cmd.add("-u");
        cmd.add(user);
        cmd.add("-p");
        cmd.add(password);

        StringBuilder sb = new StringBuilder();
        int exitCode = run(cmd, sb);
        if (exitCode != 0)
            throw new IOException("sde2shp did not terminate successfully, exit code " + exitCode
                    + ". Was trying to run: " + cmd + "\nResulted in:\n" + sb);

        System.out.println(sb.toString());
        File output = new File(outPath);
        if (output.isFile()) {
            return output;
        } else {
            return null;
        }
    }

    /**
     * Performs the conversion, returns the name of the (main) output file
     * 
     * @throws IOException
     * @throws InterruptedException
     */
    public String shpinfoType(String path) throws IOException, InterruptedException {
        List<String> cmd = new ArrayList<String>();
        cmd.add("shpinfo");
        cmd.add("-o");
        cmd.add("describe");
        cmd.add("-f");
        cmd.add(path);
        cmd.add("-d");
        cmd.add("shape");

        StringBuilder sb = new StringBuilder();
        int exitCode = run(cmd, sb);
        if (exitCode != 0)
            throw new IOException("shp2sde did not terminate successfully, exit code " + exitCode
                    + ". Was trying to run: " + cmd + "\nResulted in:\n" + sb);

        System.out.println(sb.toString());

        return "point";
    }

    /**
     * Performs the conversion, returns the name of the (main) output file
     */
    public File convert(File inputData, File outputDirectory, String typeName, OgrFormat format)
            throws IOException, InterruptedException {
        // build the command line
        List<String> cmd = new ArrayList<String>();
        cmd.add(ogrExecutable);
        cmd.add("-f");
        cmd.add(format.ogrFormat);
        File crsFile = null;
        // if (crs != null) {
        // we don't use an EPSG code since there is no guarantee we'll be able to reverse
        // engineer one. Using WKT also ensures the EPSG params such as the TOWGS84 ones are
        // not lost in the conversion
        // We also write to a file because some operating systems cannot take arguments with
        // quotes and spaces inside (and/or ProcessBuilder is not good enough to escape them)
        crsFile = File.createTempFile("gdal_srs", "wkt", inputData.getParentFile());
        cmd.add("-a_srs");
        // String s = crs.toWKT();
        // s = s.replaceAll("\n\r", "").replaceAll("  ", "");
        // FileUtils.writeStringToFile(crsFile, s);
        cmd.add(crsFile.getAbsolutePath());
        // }
        if (format.options != null) {
            for (String option : format.options) {
                cmd.add(option);
            }
        }
        String outFileName = typeName;
        if (format.fileExtension != null)
            outFileName += format.fileExtension;
        cmd.add(new File(outputDirectory, outFileName).getAbsolutePath());
        cmd.add(inputData.getAbsolutePath());

        StringBuilder sb = new StringBuilder();
        int exitCode = run(cmd, sb);
        if (crsFile != null) {
            crsFile.delete();
        }

        if (exitCode != 0)
            throw new IOException("ogr2ogr did not terminate successfully, exit code " + exitCode
                    + ". Was trying to run: " + cmd + "\nResulted in:\n" + sb);

        // csv output is a directory, handle that case gracefully
        File output = new File(outputDirectory, outFileName);
        if (output.isDirectory()) {
            output = new File(output, outFileName);
        }
        return output;
    }

    /**
     * Returns a list of the ogr2ogr supported formats
     * 
     * @return
     */
    public Set<String> getSupportedFormats() {
        try {
            // this one works up to ogr2ogr 1.7
            List<String> commands = new ArrayList<String>();
            commands.add(ogrExecutable);
            commands.add("--help");

            Set<String> formats = new HashSet<String>();
            addFormats(commands, formats);

            // this one is required starting with ogr2ogr 1.8
            commands = new ArrayList<String>();
            commands.add(ogrExecutable);
            commands.add("--long-usage");
            addFormats(commands, formats);

            return formats;
        } catch (Exception e) {
            LOGGER.error("Could not get the list of output formats supported by ogr2ogr", e);
            return Collections.emptySet();
        }
    }

    private void addFormats(List<String> commands, Set<String> formats) throws IOException,
            InterruptedException {
        StringBuilder sb = new StringBuilder();
        // can't trust the exit code, --help exits with -1 on my pc
        run(commands, sb);

        String[] lines = sb.toString().split("\n");
        for (String line : lines) {
            if (line.matches("\\s*-f \".*")) {
                String format = line.substring(line.indexOf('"') + 1, line.lastIndexOf('"'));
                formats.add(format);
            }
        }
    }

    /**
     * Returns true if ogr2ogr is available, that is, if executing "ogr2ogr --version" returns 0 as the exit code
     * 
     * @return
     */
    public boolean isAvailable() {
        List<String> commands = new ArrayList<String>();
        commands.add(ogrExecutable);
        commands.add("--version");

        try {
            return run(commands, null) == 0;
        } catch (Exception e) {
            LOGGER.error("Ogr2Ogr is not available", e);
            return false;
        }
    }

    /**
     * Runs the specified command appending the output to the string builder and returning the exit code
     * 
     * @param cmd
     * @param sb
     * @return
     * @throws IOException
     * @throws InterruptedException
     */
    int run(List<String> cmd, StringBuilder sb) throws IOException, InterruptedException {
        // run the process and grab the output for error reporting purposes
        ProcessBuilder builder = new ProcessBuilder(cmd);
        if (sdebin != null)
            builder.environment().put("GDAL_DATA", sdebin);
        builder.redirectErrorStream(true);
        Process p = builder.start();
        BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
        String line = null;
        while ((line = reader.readLine()) != null) {
            if (sb != null) {
                sb.append("\n");
                sb.append(line);
            }
        }
        return p.waitFor();
    }
}
