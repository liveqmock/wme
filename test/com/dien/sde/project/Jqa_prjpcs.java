package com.dien.sde.project;

import com.esri.sde.sdk.pe.PeCoordinateSystem;
import com.esri.sde.sdk.pe.PeFactory;
import com.esri.sde.sdk.pe.PeProjectedCS;
import com.esri.sde.sdk.pe.PeProjectionException;
import com.esri.sde.sdk.pe.PeUnit;

public class Jqa_prjpcs {
             
   public static void main(String[] args) {
       Jqa_prjpcs qa = new Jqa_prjpcs();
       qa.prjpcs();
   }
   
   public void prjpcs() {
      PeCoordinateSystem coordsys = null;
      PeProjectedCS projcs = null;
      PeTable[] pcst = null;

      String buffer = null;
      String buffer2 = null;
      int error, m=0, n, i;
      String usage = "Usage: peprjgcs";
      int successes=0, failures=0;

      // Get the predefined geogcs.
      try {
          int[] pcscode = PeFactory.projcsCodelist();
          m = pcscode.length;
          //m = 10;
          pcst = new PeTable[m];

          // Get only the first ten. 
          for (i=0; i < m; i++) {
              try {
                  projcs = PeFactory.projcs(pcscode[i]);
                  pcst[i] = this.new PeTable();
                  pcst[i].code = pcscode[i];
                  pcst[i].name = projcs.getName();
              } catch (PeProjectionException e) {
                 //System.out.println(e.getMessage());
                 continue;
              }
          }
      } catch (PeProjectionException e) {
         e.printStackTrace();
      }

      System.out.println("Done with the pcs table!\n");

      PeUnit zunit = null;
      for (i = 0; i < m; i++)
      {
         /* Create an object with the specified code. */
         try {
             coordsys = PeFactory.projcs(pcst[i].code);
             if (coordsys != null) {
                 buffer2 = coordsys.toString();
                 buffer = coordsys.toPrjString(zunit);
                 System.out.println("\nSUCCESS " + pcst[i].code + "\n");
                 coordsys.delete();
                 successes++;
                 if (successes == 10) 
                     break;
             }
         } catch (PeProjectionException e) {
             System.out.println("\n\nFAILURE - error " + e.getMessage());
             System.out.println("\n" + pcst[i].code + "," + pcst[i].name);
             System.out.println("\n" + buffer2);
             failures++;
         } catch (NullPointerException e) {
            System.out.println("\nERROR: " + e.getMessage());
            System.out.println("\n" + buffer2);
            e.printStackTrace();
            failures++;
         }
      }

      pcst = null;

      System.out.println("\n\nTotal pcs codes = " + m);
      System.out.println("Total sucesses = " + successes);
      System.out.println("Total failures = " + failures);
   }

   private class PeTable {
       int code;
       String name;
   }

                
}