window.qs = new URLSearchParams(location.search);
window.ws = new WebSocket("ws://localhost:" + qs.get("port") + "/" + qs.get("path"));
window.ws_data = null;

ws.onopen = function(event) {
  ws.send({url: qs.get("boot")});
};

ws.onclose = function(event) {
  var reason;
  // See http://tools.ietf.org/html/rfc6455#section-7.4.1
  if (event.code == 1000) {
    reason = "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.";
  } else if (event.code == 1001) {
    reason = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
  } else if (event.code == 1002) {
    reason = "An endpoint is terminating the connection due to a protocol error";
  } else if (event.code == 1003) {
    reason = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
  } else if (event.code == 1004) {
    reason = "Reserved. The specific meaning might be defined in the future.";
  } else if (event.code == 1005) {
    reason = "No status code was actually present.";
  } else if (event.code == 1006) {
    reason = "The connection was closed abnormally, e.g., without sending or receiving a Close control frame";
  } else if (event.code == 1007) {
    reason = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).";
  } else if (event.code == 1008) {
    reason = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.";
  } else if (event.code == 1009) {
    reason = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
  } else if (event.code == 1010) { // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
    reason = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.reason;
  } else if (event.code == 1011) {
    reason = "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
  } else if (event.code == 1015) {
    reason = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
  } else {
    reason = "Unknown reason";
  }
  console.log(reason);
  document.title = "Disconnected: " + reason;
};

ws.onerror = function(event) {
  console.log(event);
};

ws.send_before_actions = [];
ws.send_skip_action = false;
ws.send_actions = {};
ws.send_handler = ws.send;

ws.send = function send(data) {
  try {
    ws.send_before_actions.forEach(function (before_action) {
      if (!ws.send_skip_action) {
        before_action(event);
      }
    });
    if (!ws.send_skip_action) {
      var action = ws.send_actions[data.action];
      if (action) {
        action(data);
      }
      ws.send_handler(JSON.stringify(data));
    }
  }
  catch(error) {
    console.log(data);
    console.log(error);
    document.title = 'Error on message sent...';
  }
  finally {
    ws.send_skip_action = false;
  }
};

ws.onmessage_before_actions = [];
ws.onmessage_skip_action = false;
ws.onmessage_actions = {
  page: function (event) {
    var page = document.open("text/html", "replace");
    page.write(ws_data.body);
    page.close();
    window.scrollTo(0, 0); // TODO take into account the url anchor
  },
  error: function (event) {
    console.log(ws_data.title);
    document.title = ws_data.title;
  }
};

ws.onmessage = function(event) {
  try {
    ws.onmessage_before_actions.forEach(function (before_action) {
      if (!ws.onmessage_skip_action) {
        before_action(event);
      }
    });
    if (!ws.onmessage_skip_action) {
      ws_data = JSON.parse(event.data);
      var action = ws.onmessage_actions[ws_data.action];
      if (action) {
        action(event);
      }
    }
  }
  catch(error) {
    console.log(event);
    console.log(error);
    document.title = 'Error on message received...';
  }
  finally {
    ws.onmessage_skip_action = false;
  }
};
