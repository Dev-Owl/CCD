function initWS(url,onMessage,onOpen){

  var ws = new WebSocket(url);
  ws.onmessage = function(e){
    onMessage(e);
  };
  ws.onopen = function(e){
    onOpen(e);
  };
  return ws;
}

function wsSend(data,dataSend){
  if(ws){
    if(ws.readyState === 1)
     {
       ws.send(JSON.stringify(data));
       if(dataSend)
        dataSend();
       return;
     }
  }
  ErrorMe("Communication error","Unable to contact the server, reload the page please");
}


function BuildRequest(type,payload){
  return {rType:type,data:payload};
}
