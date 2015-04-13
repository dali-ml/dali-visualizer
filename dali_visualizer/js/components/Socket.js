var SocketConnection = function (url, auth_json) {
    this.socket = new SockJS(url);
    this.socket.onopen = function() {
        this.socket.send(JSON.stringify(auth_json));
    }.bind(this);

    this.subscribe_to = function (channel) {
        this.socket.send(JSON.stringify({
            channel: channel
        }));
    }

    this.onmessage = function (event) {
        // look at event.data.type and event.data.message
    }

    var preprocess = function (event) {
        event.data = JSON.parse(event.data);
        this.onmessage(event);
    }.bind(this);
    this.socket.onmessage = preprocess;

    this.send = function (msg) {
        return this.socket.send(msg)
    };
};
