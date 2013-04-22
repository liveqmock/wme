package com.dien.sde.project;
import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StreamTokenizer;
import java.io.StringReader;
import java.util.ArrayList;

import com.esri.sde.sdk.pe.PeProjectionException;

public class Jqa_inverse390 {
   static int N_MAX = 10;
   static boolean VERBOSE = false;

 public static void main(String args[]) {
   String filepath = "";
   int code = 0;
   String petestdir = "";

   // Check arguments from the command line.
   if (args.length == 3) {
      code = Integer.parseInt(args[0]);
      petestdir = args[1];
      filepath = args[2];
   } else if(args.length == 2){
      code = Integer.parseInt(args[0]);
      petestdir = args[1];
      filepath = null;
   } else {
      System.out.println
         ("\nUsage: java Jqa_inverse390 <geogtran code> <petestsn dir>");
      throw new IllegalArgumentException();
   }

   Jqa_inverse390 qa = new Jqa_inverse390();
   qa.inverse390(code, petestdir, filepath);

 }
                  

 public void inverse390(int code, String petestdir, String filepath) {
   int ccount=0, jcount=0;
   double[][] coord = null;
   double[] h = null;
   boolean testFailed = false;

   // Create an object with the specified code.
   com.esri.sde.sdk.pe.PeGeogTransformations geogtran = null;
   try{
      geogtran = com.esri.sde.sdk.pe.PeFactory.geogtran(code);
      geogtran.loadConstants();
   } catch (PeProjectionException e) {
      e.printStackTrace();
   }

   if (geogtran == null) {
      System.out.println("ERROR: Invalid PeGeogTransformations code.");
      throw new IllegalArgumentException();
   }
   // Print the projection.
   System.out.println("\n\n" + code + ": " + geogtran.getMethod().toString());

   String input = null;
   BufferedReader in = null;
   if (filepath != null) {
      try {
         in = new BufferedReader(new FileReader(filepath));
      } catch (FileNotFoundException e) {
         e.printStackTrace();;
      }
   } else {
      in = new BufferedReader(new InputStreamReader(System.in));
   }

   ArrayList list = getNumericInput(in);
   coord = (double[][])list.get(0);
   h = (double[])list.get(1);
   int n = coord.length;

   //Copy the original coord.
   int nsize = coord.length;
   double[] coord1D = new double[nsize*2];
   int icol = 2*(nsize-1);
   for (int row=nsize; --row >= 0;) {
      double[] currentRow = coord[row];
      System.arraycopy(currentRow, 0, coord1D, icol, 2);
      icol -= 2;
   }
                  
   // Project the points
   try {
       int ret = com.esri.sde.sdk.pe.PeCSTransformations.geog2ToGeog1
                   (geogtran, n, coord1D, h);
   } catch (com.esri.sde.sdk.pe.PeProjectionException e) {
       e.printStackTrace();
   }

 }


 static ArrayList getNumericInput(BufferedReader in) {
     ArrayList retval = new ArrayList();
     double[][] v = new double[20][2];
     double[] vh = new double[20];
     double[] dvals = new double[3];
     double[][] d = null;
     double[] h = null;
     String input = null;
     boolean hasHValue = false;

     int j=0;
     for(;;) {
        int count=0;
        try {
          // Read a line from the stdin.
          input = in.readLine();

          // Parse the input.
          if (input != null) {
             StringReader sr = new StringReader(input);
             StreamTokenizer st = new StreamTokenizer(sr);
             st.resetSyntax();
             st.wordChars('0', 'Z');
             st.wordChars('0', 'z');
             st.wordChars('.', '.');
             st.wordChars('-', '-');
             dvals[0] = 0.0; dvals[1] = 0.0;
             int type;
             while ((type = st.nextToken()) != StreamTokenizer.TT_EOF) {
                if (st.sval != null) {
                   if (st.sval.equals("NaN"))
                       dvals[count++] = Double.NaN;
                   else
                       dvals[count++] = Double.parseDouble(st.sval);
                }
             }
             sr.close();
          } else
             break;

         v[j][0] = dvals[0];
         v[j][1] = dvals[1];
         if (count > 2) {
            hasHValue = true;
            vh[j] = dvals[2];
         }
         j++;
     
        } catch (IOException ioe){
           ioe.printStackTrace();
        } // end try
     } // end for

     if (j > 0) {
        d = new double[j][2];
        //double[] tempval = null;
        for (int i=0; i < j; i++) {
              d[i][0] = v[i][0];
              d[i][1] = v[i][1];
        }
        if (hasHValue) {
           h = new double[j];
           for (int i=0; i < j; i++) {
                h[i] = vh[i];
           }
        }
     }

     retval.add(0, d);
     retval.add(1, h);
     return retval;
  }
                    

}
