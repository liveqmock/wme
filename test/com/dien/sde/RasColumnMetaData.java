/*******************************************************************************************
* Copyright 1995-2005 ESRI
* All rights reserved under the copyright laws of the United States.
*
* You may freely redistribute and use this sample code, with or without modification.
*
* Disclaimer: THE SAMPLE CODE IS PROVIDED "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
* INCLUDING THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
* ARE DISCLAIMED. IN NO EVENT SHALL ESRI OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
* INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
* PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
* INTERRUPTION) SUSTAINED BY YOU OR A THIRD PARTY, HOWEVER CAUSED AND ON ANY THEORY OF
* LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT ARISING IN ANY WAY OUT OF THE
* USE OF THIS SAMPLE CODE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*
* For additional information contact:
*
* Environmental Systems Research Institute, Inc.
* Attn: Contracts Dept.
* 380 New York Street
* Redlands, California, U.S.A. 92373
* Email: contracts@esri.com
*
********************************************************************************************
* ArcSDE Developer Help 92 - Raster API - Java Sample
* Sample Name: RasColumnMetaData.java
* Description: Demonstrates you how to access the metadata of the SDE.RASTER_COLUMNS table.
********************************************************************************************/
package com.dien.sde;

import com.esri.sde.sdk.client.SeColumnDefinition;
import com.esri.sde.sdk.client.SeConnection;
import com.esri.sde.sdk.client.SeError;
import com.esri.sde.sdk.client.SeException;
import com.esri.sde.sdk.client.SeObjectId;
import com.esri.sde.sdk.client.SeRasterColumn;
import com.esri.sde.sdk.client.SeTable;


public class RasColumnMetaData
{
	public static void main(String[] args)
	{
		SeConnection conn = null;
		SeTable table = null;
		String tableName = "DH92_J_SAMPLE_RASCOLMD";
		String colName = "RasterCol";

		String server = args[0];
		int instance = Integer.parseInt(args[1]);
		String database = args[2];
		String user = args[3];
		String password = args[4];
		String keyword= args[5];

		try
		{
			// Opening Connection -
			conn = new SeConnection(server, instance, database, user, password);
			System.out.println("\n**Connected to " + server + "/" + instance + " as " + user + "/" + password);

			//Create Column Defn for table
			SeColumnDefinition[] coldef = new SeColumnDefinition[1];
			coldef[0] = new SeColumnDefinition("Name", SeColumnDefinition.TYPE_STRING, 10, 10, false);

			//Create a Table
			//table = RasterUtil.createTable(conn, tableName, coldef);
			System.out.println("\n**Created Raster Table " + tableName + ".");

			//Create a raster column
			SeRasterColumn col = null;
			//SeRasterColumn col = RasterUtil.createRasterLayer(conn, table, colName);
			System.out.println("\n**Created RasterColumn " + col.getName() + ".");

			/* fetch the rastercolumn_id from the rascolinfo structure */
			SeObjectId rasterColId = col.getID();

			/* Populate the raster column info structure based on the raster column ID */
			col.getInfo();

			/* Display the contents of the raster column info structure. */
			//RasterUtil.displayRasterColumn(col);

			/* delete the raster column, table and close connection */
			col.delete();
			table.delete();
			conn.close();
		}
		catch(SeException ex)
		{
			SeError error = ex.getSeError();
			System.err.println("Error in RasColumnMetaData main(): " + error.getSdeError() +
							   "\nSDE Error Message: " + error.getSdeErrMsg());
			System.err.println("Ext Error: " + error.getExtError() +
							   "\nExt Error Message: " + error.getExtErrMsg() +
							   "\nError Descr: " + error.getErrDesc());
			ex.printStackTrace();
		}
	}
}
