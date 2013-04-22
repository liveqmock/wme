package com.dien.sde.project;

import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.InputStreamReader;

import com.esri.sde.sdk.pe.PeProjectionException;

public class Jqa_inverse90 {

   static int N_MAX = 10;
   static boolean VERBOSE = false;

 public static void main(String args[]) {
   int code = 0;
   String petestdir = "";
   String filepath = "";

   // Check arguments from the command line.
   if (args.length == 3) {
      code = Integer.parseInt(args[0]);
      petestdir = args[1];
      filepath = args[2];
   } else if (args.length == 2) {
      code = Integer.parseInt(args[0]);
      petestdir = args[1];
      filepath = null;
   } else {
      System.out.println
          ("\nUsage: java Jqa_inverse90 <projcs code> <petestsn dir>");
      throw new IllegalArgumentException();
   }

   Jqa_inverse90 qa = new Jqa_inverse90();
   qa.inverse90(code, petestdir, filepath);
 }

 public void inverse90(int code, String petestdir, String filepath) {
   int ccount=0, jcount=0;
   double[][] coord = null;
   boolean testFailed = false;

   // Create an object with the specified code.
   com.esri.sde.sdk.pe.PeProjectedCS projcs = null;
   try {
      projcs = com.esri.sde.sdk.pe.PeFactory.projcs(code);
   } catch (PeProjectionException e) {
      e.printStackTrace();
   }

   if (projcs == null) {
      System.out.println("ERROR: Invalid PeProjectedCS code.");
      throw new IllegalArgumentException();
   }

   // Print the projection.
   System.out.println("\n\n" + code + ": " + projcs.getProjection().toString());

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

   coord = getNumericInput(in);
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

   // Project the points.
   try {
      int ret = 
          com.esri.sde.sdk.pe.PeCSTransformations.projToGeog
               (projcs, n, coord1D);
   } catch (PeProjectionException e) {
      e.printStackTrace();
   }
 }

private double[][] getNumericInput(BufferedReader in) {
    // TODO Auto-generated method stub
    return null;
}

}
                  
