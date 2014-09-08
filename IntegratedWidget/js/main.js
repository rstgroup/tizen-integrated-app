
var ConnectionManager = (function(){
	var SAAgent = null;
	var SASocket = null;
	var CHANNELID = 104;
	var ProviderAppName = "IntegratedApp";

	var agentCallback = {
			onconnect : function(socket) {
				SASocket = socket;
				console.log("GearService Connection established with RemotePeer");
				SASocket.setSocketStatusListener(function(reason){
					console.log("Service connection lost, Reason : [" + reason + "]");
					_disconnect();
				});
			},
			onerror : function(e){
				console.log('error');
			}
	};

	var peerAgentFindCallback = {
		onpeeragentfound : function(peerAgent) {
			try {
				if (peerAgent.appName == ProviderAppName) {
					SAAgent.setServiceConnectionListener(agentCallback);
					SAAgent.requestServiceConnection(peerAgent);
				} else {
					console.log("Not expected app!! : " + peerAgent.appName + " vs. " + ProviderAppName);
				}
			} catch(err) {
				console.log("peer find callback exception [" + err.name + "] msg[" + err.message + "]");
			}
		},
		onerror : _onError
	}

	var _init = function(){
		console.log('connection manager init');
		return this;
	};
	
	var _connect = function(){
		console.log('connectig...');
		if (SASocket) {
			console.log('Already connected!');
			return this;
		}
		try {
			console.log('request SAAgent');
			webapis.sa.requestSAAgent(_onSuccess, _onError);
		} catch(err) {
			console.log(" connect exception [" + err.name + "] msg[" + err.message + "]");
		}
		return this;
	};
	
	var _disconnect = function() {
		try {
			if (SASocket != null) {
				SASocket.close();
				SASocket = null;
				console.log("closeConnection");
			}
		} catch(err) {
			console.log(" disconnect exception [" + err.name + "] msg[" + err.message + "]");
		}
	};
	
	
	function createHTML(log_string)
	{
		console.log("Log string: "+log_string);
		var log = document.getElementById('resultBoard');
		log.innerHTML = log.innerHTML + "<br> : " + log_string;
	}
	
	var _on_send_cmd_response = function(channelId, data){
		data = data.split('/').join('');
		console.log(data);
		var json = JSON.parse(data);

		createHTML(json.response);
	}
	

	var _send_cmd1 = function(){
		SASocket.setDataReceiveListener(_on_send_cmd_response);
		SASocket.sendData(CHANNELID, JSON.stringify({ 'cmd' : 'CMD 1x'}) );
	}
	
	var _send_cmd2 = function(){
		SASocket.setDataReceiveListener(_on_send_cmd_response);
		SASocket.sendData(CHANNELID, JSON.stringify({ 'cmd' : 'CMD 2x'}) );	
	}

	var _onSuccess = function(agents) {
		try {
			if (agents.length > 0) {
				SAAgent = agents[0];
				
				SAAgent.setPeerAgentFindListener(peerAgentFindCallback);
				SAAgent.findPeerAgents();
			} else {
				console.log("Not found SAAgent!!");
			}
		} catch(err) {
			console.log(" success exception [" + err.name + "] msg[" + err.message + "]");
		}
	}

	var _onError = function(err) {
		console.log("err [" + err.name + "] msg[" + err.message + "]");
	}
	
	return {
		init : _init,
		connect : _connect,
		disconnect : _disconnect,
		
		send_cmd1 : _send_cmd1,
		send_cmd2 : _send_cmd2
	};
})(jQuery);


window.onload = function () {
	ConnectionManager.init().connect();
	
	document.addEventListener('tizenhwkey', function(e) {
        if(e.keyName == "back"){
        	 tizen.application.getCurrentApplication().exit();
        }   
    });
};

function send_cmd1() {
	ConnectionManager.send_cmd1();
};
function send_cmd2() {
	ConnectionManager.send_cmd2();
};
