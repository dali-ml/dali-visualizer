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
                <a className="dropdown-button"
                   href="#!"
                   onClick={this.toggleDropDown}>
                    {current_active}<i class="mdi-navigation-arrow-drop-down right"></i>
                </a>
                <ul className={"dropdown-inner" + (this.state.active ? " active" : "")} ref="dropdown">
                    {options}
                </ul>
            </li>
        );
    }
});

var Sentences = React.createClass({
    getDefaultProps: function () {
        return {
            normalize_weights: false,
            color: "black",
            sentences: {
                sentences: [],
                weights: []
            }
        };
    },
    render: function () {
        var sentences = this.props.sentences.sentences;
        var weights = this.props.sentences.weights;
        var sentences_as_elt = [];
        if (weights && this.props.normalize_weights) {
            weights = normalize_weights(weights);
        }
        var is_log_likelihood = false;
        if (weights && !(this.props.normalize_weights)) {
            if (weights.length > 0) {
                is_log_likelihood = weights[0] < 0;
            }
            // check if all weights are negative:
            for (var i = 1; i < weights.length; ++i) {
                is_log_likelihood = (weights[i] < 0) && is_log_likelihood;
            }
        }
        if (weights && is_log_likelihood) {
            weights = inplace_softmax(weights);
        }
        for (var i=0; i < sentences.length; ++i) {
            var color = "black";
            if (weights) {
                var value = 0.7 * (1.0 - weights[i]);
                color = color_str(value, value, value);
                var tooltip_els = [
                    <span>activation = </span>,
                    <span className="numerical">{weights[i].toFixed(2)}</span>
                ];
                sentences_as_elt.push(
                    <TooltipSentence key={"sentence_" + i}
                                     sentence={sentences[i]}
                                     color={color}
                                     tooltip={tooltip_els} />
                );
            } else {
                sentences_as_elt.push(
                    <div className="sentence">
                        <Sentence key={"sentence_" + i}
                                  color={this.props.color}
                                  sentence={sentences[i]} />
                    </div>);
            }
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
            <div>
                <div className="card-content context">
                    <Sentences sentences={this.props.qa.context} />
                </div>
                <div className="card-content question-answer">
                    <b>
                        <Sentence sentence={this.props.qa.question}/>
                    </b>
                </div>
                <div className="divider" />
                <div className="card-content">
                    <b>Correct answer: </b>
                    <Sentence sentence={this.props.qa.answer} color="lightskyblue" />
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
            if (this.props.distribution.scores !== undefined) {
                var score = this.props.distribution.scores[idx];
                score = Math.round(1000.0 * score) / 1000.0;
                var label = labels[idx] + ": " + score;
            } else {
                var label = labels[idx] + ": " + percent + '%';
            }
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
            <div className="card-content">
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
                  <div className="valign-wrapper">
                    <div className="col s12 m6 valign nanopadding">
                        <div className="card feed-elem">
                            <div>
                                <span className="card-title grey-text text-darken-4">Example</span>
                            </div>
                            {VisualizerFor(this.props.example.input)}
                        </div>
                    </div>
                    <div className="col s12 m6 valign nanopadding">
                        <div className="card feed-elem">
                            <span className="card-title grey-text text-darken-4">Prediction</span>
                            {VisualizerFor(this.props.example.output)}
                        </div>
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
    } else if (el.type == "sentences") {
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
            <div className="">{els}</div>
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
        var no_available_channels = "";
        if (this.state.available_channels.length === 0 && this.state.messages.length === 0) {
            no_available_channels = (
                <div className="center">
                    <p>No Experiments Found</p>
                    <p className="light">Refresh the page to listen for new experiments</p>
                </div>);
        }
        return (
            <div className="dali-visualizer">
                <nav className="top-nav">
                    <div className="nav-wrapper">
                        <a className="brand-logo center" href="#">Dali Visualizer</a>
                        <ul className="left">
                            <DropDown onChange={this.onChangeSubscription}
                                      options={options}
                                      tooltip={"Choose which experiment's updates are shown."}
                                      placeholder="Select Experiment" />
                        </ul>
                    </div>
                </nav>
                <div className="feed container">
                    <Notifications messages={this.state.messages} />
                    {no_available_channels}
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
