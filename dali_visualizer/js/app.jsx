/**
* @jsx React.DOM
*/

var NewChannel = function (new_channel) {
    return {
         type: "channel_switch",
         data: new_channel
    };
};

var DropDown = React.createClass({
    getInitialState: function () {
        return {
            active: false
        };
    },
    toggleDropDown: function() {
        this.setState({
            active: this.state.active ? false : true
        });
    },
    choose_dropdown_item: function (option) {
        this.toggleDropDown();
        this.props.onChange(option);
    },
    render: function () {
        var current_active = this.props.placeholder;
        var options = this.props.options.map( function (op, i) {
            if (op.active) {
                current_active = op.name;
            }
            var cb = function () {this.choose_dropdown_item(op.name);}.bind(this);
            return (
                <li key={"op_" + i} onClick={cb}>
                    <a className={op.active ? "active" : ""}>{op.name}</a>
                </li>
            );
        }.bind(this));
        return (
            <li>
                <a className="dropdown-button" href="#!" onClick={this.toggleDropDown}>
                    {current_active}<i class="mdi-navigation-arrow-drop-down right"></i>
                </a>
                <ul className={"dropdown-inner" + (this.state.active ? " active" : "")} ref="dropdown">
                    {options}
                </ul>
            </li>
        );
    }
});


var Sentence = React.createClass({
    render: function () {
        return <p className="caption">{this.props.sentence.words.join(" ")}</p>
    }
});

var Sentences = React.createClass({
    render: function () {
        var sentences = this.props.sentences.sentences.map( function (evidence, k) {
            return <Sentence key={"sentence_" + k}
                             sentence={evidence} />
        });
        return (
            <div className="sentences">
                {sentences}
            </div>
        );
    }
});

var QA = React.createClass({
    render: function () {
        return (
            <div className="qa card">
                <div className="context">
                    <Sentences sentences={this.props.qa.context} />
                </div>
                <div className="question-answer">
                    <Sentence sentence={this.props.qa.question}/>A: <Sentence sentence={this.props.qa.answer}/>
                </div>
            </div>
        );
    }
});

var FiniteDistribution = React.createClass({
    render: function () {
        var dist = this.props.distribution.probabilities;
        var labels = this.props.distribution.labels;
        var boxes = [];
        for (var idx = 0; idx < dist.length; ++idx) {
            boxes.push(<Metrics key={"box_" + idx}
                                probability={dist[idx]}
                                label={labels[idx]}
                                width={150}
                                height={20} />);
        }
        return (
            <div className="qa card">
                {boxes}
            </div>
        );
    }
});

var ClassifierExample = React.createClass({
    render: function () {
        return (
            <div className="classifier_example">
                <div className="row">
                    <div className="col s12 m6">
                        {VisualizerFor(this.props.example.input)}
                    </div>
                    <div className="col s12 m6">
                        {VisualizerFor(this.props.example.output)}
                    </div>
                </div>
            </div>
        );
    }
});

var ChannelSwitch = React.createClass({
    render: function () {
        return (
            <div className="card-panel">
                switched to channel <strong>{this.props.channel.data}</strong>.
            </div>
        );
    }
});

var VisualizerFor = function (el) {
    if (el.type == "classifier_example") {
        return <ClassifierExample example={el} />
    } else if (el.type == "qa") {
        return <QA qa={el} />;
    } else if (el.type == "finite_distribution") {
        return <FiniteDistribution distribution={el} />
    } else if (el.type == "sentence") {
        return <Sentences sentences={el} />;
    } else if (el.type == "sentence") {
        return <Sentence sentence={el} />;
    } else if (el.type == "channel_switch") {
        return <ChannelSwitch channel={el}/>
    } else {
        return el;
    }
};

function prepend(list, el) {
    return [el].concat(list);
}

var Notifications = React.createClass({
    render: function () {
        var els = this.props.messages.map( function (message, k) {
            return (
                <div className="row" key={"li_" + k}>
                    <div className="col s12">
                        {VisualizerFor(message)}
                    </div>
                </div>
            );
        });
        return (
            <div className="container">{els}</div>
        );
    }
});

var VisualizationServer = React.createClass({
    getInitialState: function () {
        return {
            messages: [],
            available_channels: [],
            channel: null
        };
    },
    componentDidMount: function () {
        // listen for updates from here:
        this.socket = new SocketConnection(this.props.url, {});
        this.socket.onmessage = this.onMessage.bind(this);
    },
    onMessage: function (event) {
        if (event.data.type == 'pick_channel') {
            // what channel do you want?
            var new_messages = this.state.messages,
                new_channel  = null;
            if (event.data.data.available_channels.length > 0) {
                new_channel  = event.data.data.available_channels[0];
                new_messages = prepend(new_messages, NewChannel(new_channel));
            }
            this.setState({
                channel: new_channel,
                // got available channels from pick_channel message
                available_channels: event.data.data.available_channels,
                messages: new_messages
            });
        } else {
            this.setState({
                messages: prepend(this.state.messages, event.data)
            });
        }
    },
    componentDidUpdate: function (prevProps, prevState) {
        if (this.state.channel !== null) {
            this.socket.subscribe_to(
                this.state.channel
            );
        }
    },
    onChangeSubscription: function (new_channel) {
        if (new_channel != this.state.channel) {
            this.setState({
                channel: new_channel,
                messages: prepend(this.state.messages, NewChannel(new_channel))
            });
        }
    },
    render: function () {
        var current_channel = this.state.channel;
        var options = this.state.available_channels.map( function (opt, k) {
            return {
                name: opt,
                active: current_channel == opt
            }
        });
        return (
            <div className="dali-visualizer">
                <nav className="top-nav">
                    <div className="nav-wrapper">
                        <a className="brand-logo center" href="#">Dali Visualizer</a>
                        <ul className="right hide-on-med-and-down">
                            <DropDown onChange={this.onChangeSubscription}
                                      options={options}
                                      placeholder="Select Feed" />
                        </ul>
                    </div>
                </nav>
                <div className="feed container">
                    <Notifications messages={this.state.messages} />
                </div>
            </div>);
    }
});

React.initializeTouchEvents(true);
React.render(
    React.createElement(VisualizationServer, {
        url:"http://"+window.location.host+"/updates"
    }), document.body
);
