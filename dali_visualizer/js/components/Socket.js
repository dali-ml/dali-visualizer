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

// function connect(url, auth_json) {
//     var socket = new SockJS(url);
//     socket.onopen = function() {
//         socket.send(JSON.stringify(auth_json));
//     };
//     socket.onmessage = function (event) {
//         console.log("event", event);
//         console.log("event.data", event.data);
//         event.data = JSON.parse(event.data);
//         if (event.data.type == 'data') {
//             console.log(data);
//         } else if (event.data.type == 'pick_channel_error') {
//             throw event.data.data.message;
//         } else if (event.data.type == 'pick_channel') {
//             // what channel do you want?
//             socket.send(JSON.stringify({
//                 channel: "namespace_babi"
//             }));
//         } else {
//             console.log("not recognized: ", event.data);
//         }
//     };
//     return socket;
// }
