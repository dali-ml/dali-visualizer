var socket;

window.onload = function() {
    function connect(url, auth_json) {
        var socket = new SockJS(url);
        socket.onopen = function() {
            socket.send(JSON.stringify(auth_json));
        };
        socket.onmessage =  function (event) {
            console.log("event", event);
            console.log("event.data", event.data);
            event.data = JSON.parse(event.data);
            if (event.data.type == 'data') {
                console.log(data);
            } else if (event.data.type == 'pick_channel_error') {
                throw event.data.data.message;
            } else if (event.data.type == 'pick_channel') {
                // what channel do you want?
                socket.send(JSON.stringify({
                    channel: "namespace_babi"
                }));
            } else {
                console.log("not recognized: ", event.data);
            }
        };
        return socket;
    }
    // listen for updates from here:
    socket = connect("http://"+window.location.host+"/updates", {});
};

