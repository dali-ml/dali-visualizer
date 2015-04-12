/**
* @jsx React.DOM
*/

var Notifications = React.createClass({
    componentDidMount: function () {

    },
    render: function () {
        var els = [];
        for (var i = 0; i < this.props.messages.length; i++) {
            els.push(<li key={"li_" + i}>{this.props.messages[i]}</li>);
        }
        return (
            <ul>{els}</ul>
        );
    }
});

var VisualizationServer = React.createClass({
    getInitialState: function () {
        return {
            messages: []
        };
    },
    componentDidMount: function () {
        // listen for updates from here:
        this.socket = new SocketConnection(this.props.url, {});
        this.socket.onmessage = this.onmessage.bind(this);
    },
    onmessage: function (event) {
        if (event.data.type == 'data') {
            this.setState({
                messages: this.state.messages.concat([event.data.data])
            });
            console.log(this.state.messages);
        } else if (event.data.type == 'pick_channel_error') {
            throw event.data.data.message;
        } else if (event.data.type == 'pick_channel') {
            // what channel do you want?
            this.socket.subscribe_to("namespace_babi");
        } else {
            console.log("not recognized: ", event.data);
        }
    },
    render: function () {
        return (
            <nav className="nav header">
                <h1>
                    Dali Visualizer
                </h1>
                <Notifications ref="notifications" messages={this.state.messages}/>
            </nav>);
    }
});

React.initializeTouchEvents(true);
React.render(
    React.createElement(VisualizationServer, {
        url:"http://"+window.location.host+"/updates"
    }), document.body
);
