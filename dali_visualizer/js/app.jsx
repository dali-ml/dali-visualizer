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
        var font_style = {
            'color': this.props.color || "black"
        };
        var words = this.props.sentence.words;
        var weights = this.props.sentence.weights;
        if (weights) {
            weights = normalize_weights(weights);
        }
        var words_elt = [];
        for (var idx = 0; idx < words.length; ++idx) {
            var word_style = {
                'font-size': 12 + Math.round(5 * weights[idx])
            }
            words_elt.push(<span style={word_style}>{words[idx]}</span>);
            words_elt.push(<span>{" "}</span>);
        }

        return (
            <p className="caption">
                <font style={font_style}>
                    {words_elt}
                </font>
            </p>
        )
    }
});

var Sentences = React.createClass({
    render: function () {
        var sentences = this.props.sentences.sentences;
        var weights = this.props.sentences.weights;
        var sentences_as_elt = [];
        if (weights) {
            weights = normalize_weights(weights);
        }
        for (var i=0; i < sentences.length; ++i) {
            var color = "black";
            if (weights) {
                var value = 0.7 * (1.0 - weights[i]);
                color = color_str(value, value, value);
            }
            sentences_as_elt.push(
                <Sentence key={"sentence_" + i}
                          sentence={sentences[i]}
                          color={color} />
            );
        }
        return (
            <div className="sentences">
                {sentences_as_elt}
            </div>
        );
    }
});

var QA = React.createClass({
    render: function () {
        return (
            <div className="card feed-elem">
                <div className="card-content context">
                    <Sentences sentences={this.props.qa.context} />
                </div>
                <div className="card-content question-answer">
                    <b>
                        <Sentence sentence={this.props.qa.question}/>
                        {"A: "}
                        <Sentence sentence={this.props.qa.answer} color="steelblue" />
                    </b>
                </div>
            </div>
        );
    }
});

var FiniteDistribution = React.createClass({
    getInitialState: function() {
        return {'attached': false};
    },
    componentDidMount: function() {
        this.setState({
            'attached': true
        });
    },
    render: function () {
        var dist = this.props.distribution.probabilities;
        var labels = this.props.distribution.labels;
        var boxes = [];
        for (var idx = 0; idx < dist.length; ++idx) {
            var percent = Math.round(100*dist[idx]);
            liquid_width = "0%";
            if (this.state.attached) {
                liquid_width = '' + percent + '%'
            }
            var liquid_style = {'width': liquid_width };
            var label = labels[idx] + ": " + percent + '%';
            boxes.push(
                <div className="tank">
                    <div className="liquid" style={liquid_style} />
                    <div className="label">
                        {label}
                    </div>
                </div>
            )
        }
        return (
            <div className="card feed-elem">
                {boxes}
            </div>
        );
    }
});

var ClassifierExample = React.createClass({
    render: function () {
        return (
            <div className="classifier_example table">
                <div className="row">
                  <div className="valign-wrapper">
                    <div className="col s12 m6 valign">
                        {VisualizerFor(this.props.example.input)}
                    </div>
                    <div className="col s12 m6 valign">
                        {VisualizerFor(this.props.example.output)}
                    </div>
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
