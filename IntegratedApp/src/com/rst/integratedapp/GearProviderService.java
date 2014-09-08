package com.rst.integratedapp;

import java.io.IOException;
import java.util.HashMap;

import org.json.JSONException;
import org.json.JSONObject;

import android.content.Intent;
import android.os.Binder;
import android.os.IBinder;
import android.util.Log;

import com.samsung.android.sdk.SsdkUnsupportedException;
import com.samsung.android.sdk.accessory.SA;
import com.samsung.android.sdk.accessory.SAAgent;
import com.samsung.android.sdk.accessory.SAPeerAgent;
import com.samsung.android.sdk.accessory.SASocket;

public class GearProviderService extends SAAgent{
	private static final String TAG = "GearProviderService";
	HashMap<Integer, PrividerConnection> mConnectionsMap = null;
	private final IBinder mBinder = new LocalBinder();

	public GearProviderService(){
		super(TAG, PrividerConnection.class);
	}
	@Override
	public void onCreate() {
			super.onCreate();
			SA mAccessory = new SA();
			try {
				mAccessory.initialize(this);
			} catch (SsdkUnsupportedException e) {
				stopSelf();
			} catch (Exception e1) {
				stopSelf();
			}
	}

	@Override
	protected void onFindPeerAgentResponse(SAPeerAgent arg0, int arg1) {
	}

	@Override
	protected void onServiceConnectionResponse(SASocket thisConnection,	int result) {
		if (result == CONNECTION_SUCCESS) {
			if (thisConnection != null) {
				PrividerConnection myConnection = (PrividerConnection) thisConnection;

				if (mConnectionsMap == null) {
					mConnectionsMap = new HashMap<Integer, PrividerConnection>();
				}
				myConnection.mConnectionId = (int) (System.currentTimeMillis() & 255);	
				mConnectionsMap.put(myConnection.mConnectionId, myConnection);
			}
		} else if (result == CONNECTION_ALREADY_EXIST) {
			Log.e(TAG, "onServiceConnectionResponse, CONNECTION_ALREADY_EXIST");
		} else {
			Log.e(TAG, "onServiceConnectionResponse result error =" + result);
		}	
		}

	@Override
	protected void onServiceConnectionRequested(SAPeerAgent peerAgent) {
		acceptServiceConnectionRequest(peerAgent);
	}

	
	public class LocalBinder extends Binder {
		public GearProviderService getService() {
			return GearProviderService.this;
		}
	}
	@Override
	public IBinder onBind(Intent arg0) {
		return mBinder;
	}
	
	private class PrividerConnection extends SASocket{
		private int mConnectionId;

		public PrividerConnection() {
			super(PrividerConnection.class.getName());
		}

		@Override
		public void onError(int channelId, String errorString, int error) {	}
		@Override
		public void onReceive(int channelId, byte[] data) {
			PrividerConnection uHandler = mConnectionsMap
					.get(Integer.parseInt(String.valueOf(mConnectionId)));
			if (uHandler == null) {
				return;
			}
			
			try {
				byte[] response = processRequest(data);
				uHandler.send(channelId, response);
			} catch (IOException e) {
				e.printStackTrace();
			} catch (JSONException e) {
				e.printStackTrace();
			}
		}
		@Override
		protected void onServiceConnectionLost(int errorCode) {
			if (mConnectionsMap != null) {
				mConnectionsMap.remove(mConnectionId);
			}
		}
		
		private byte[] processRequest(byte[] data) throws JSONException{
			String message = new String(data);
			JSONObject req = new JSONObject(message);
			final String cmd = req.getString("cmd");
			JSONObject response = new JSONObject();
			
			response = new JSONObject(){{
				put("response", "Echo:"+cmd);
			}};
			return response.toString().getBytes();
		}
	}
}
