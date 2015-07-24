/**
* @jsx React.DOM
*/

var NewChannel = function (new_channel) {
    return {
         type: "channel_switch",
         data: new_channel
    };
};

var ExpiredChannel = function (expired_channel) {
    return {
         type: "channel_expired",
    };
};

var TimeSince = React.createClass({
    getInitialState : function() {
        return {
            time : ""
        }
    },
    tick: function() {
        var desc = moment(this.props.since).fromNow();
        this.setState({
            time: " (" + desc + ")"
        });
    },
    componentDidMount: function() {
        this.interval = setInterval(this.tick, 1000);
    },
    componentWillUnmount: function() {
        clearInterval(this.interval);
    },
    render: function() {
        return <span>{this.state.time}</span>
    }
});


var DropDown = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    getInitialState: function () {
        return {
            active: false
        };
    },
    remove_background_callback: function () {
        document.removeEventListener('click', this.documentClickHandler);
    },
    add_background_callback: function () {
        document.addEventListener('click', this.documentClickHandler);
    },
    documentClickHandler: function (e) {
        this.setState({
            active: false
        });
    },
    toggleDropDown: function(e) {
        if (arguments.length > 0) {
            e.stopImmediatePropagation();
        }
        if (this.state.active) {
            this.remove_background_callback();
        } else {
            this.add_background_callback();
        }

        this.setState({
            active: this.state.active ? false : true
        });
    },
    choose_dropdown_item: function (option) {
        this.toggleDropDown();
        if (option.value !== undefined) {
            this.props.onChange(option.name, option.value);
        } else {
            this.props.onChange(option.name);
        }
    },
    dropdown_click: function (e) {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        this.toggleDropDown();
    },
    render: function () {
        var current_active = this.props.placeholder;
        var current_active_url = '#';

        var options = this.props.options.map( function (op, i) {
            if (op.active) {
                current_active     = op.name;
                current_active_url = '#' + op.value;
            }
            var cb = function (e) {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                this.choose_dropdown_item(op);
            }.bind(this);
            var op_url = '#' + op.value;
            console.log(op_url);
            var time_since = "";
            if (op.time_since !== undefined) {
                time_since = (
                    <TimeSince since={op.time_since} />
                );
            }

            return (
                <li key={"op_" + i} onClick={cb}>
                    <a href={op_url} className={op.active ? "active" : ""}>
                        {op.name}
                        {time_since}
                    </a>
                </li>
            );
        }.bind(this));
        return (
            <li>
                <a className="dropdown-button"
                   href={current_active_url}
                   onClick={this.dropdown_click}>
                    {current_active}
                    <i className="mdi-navigation-arrow-drop-down right"></i>
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
    mixins: [React.addons.PureRenderMixin],
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
    mixins: [React.addons.PureRenderMixin],
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
                <div className="tank" key={'b_' + idx}>
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

var GridLayout = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    render: function () {
        var column_els = [];
        var cells = Math.max(Math.round(12 / (this.props.length)), 1);

        this.props.grid.forEach(function(column, column_idx) {
            var column_contents = [];
            column.forEach(function(contents, contents_idx) {
                column_contents.push(
                    <div key={'contents_' + contents_idx}>
                        {VisualizerFor(contents)}
                    </div>
                );
            });
            column_els.push(
                <div className={"col s12 m" + cells + " valign nanopadding"} key={'col_el_' + column_idx}>
                    <div className="card feed-elem">
                        {column_contents}
                    </div>
                </div>
            );
        });

        return (
            <div className="row">
              <div className="valign-wrapper">
                  {column_els}
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


var Probability = React.createClass({
    mixins: [TooltipMixin, React.addons.PureRenderMixin],
    tooltipContent: function () {
        var percent = Math.round(100*this.props.probability);

        return <div>{'' + percent + '%'}</div>;
    },
    render: function () {
        var percent = Math.round(100*this.props.probability);

        var liquid_style = {
            'width' : '' + percent + '%',
            'background': 'green'

        };
        var tank_style = {
            'height' : 5
        }
        var sentence = {
            'words' : ['o hai'],
            'weights' : [ 0.1]
        };
        return (
            <div className="tank" style={tank_style}>
                <div className="liquid" style={liquid_style} />
            </div>
        );
    }
});

var ChannelExpiration = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    render: function () {
        return (
            <div className="card-panel">
                disconnected from current channel.
            </div>
        );
    }
});


var VisualizerFor = function (el) {
    if (el.type == "grid_layout") {
        return <GridLayout grid={el.grid} />;
    } else if (el.type == "qa") {
        return <QA qa={el} />;
    } else if (el.type == "finite_distribution") {
        return <FiniteDistribution distribution={el} />;
    } else if (el.type == "sentences") {
        return <Sentences sentences={el} />;
    } else if (el.type == "parallel_sentence") {
        return <ParallelSentence sentences={el} />
    } else if (el.type == "sentence") {
        return <Sentence sentence={el} />;
    } else if (el.type == "channel_switch") {
        return <ChannelSwitch channel={el}/>;
    } else if (el.type == "channel_expired") {
        return <ChannelExpiration channel={el}/>;
    } else if (el.type == "tree") {
        return <OutputTree tree={el}/>;
    } else if (el.type == "probability") {
        return <Probability probability={el.probability} />;
    } else if (el.type == "message") {
        return <Message message={el} />;
    } else if (el.type == "heartbeat") {
        return null
    } else {
        return el;
    }
};

var max_messages = 20;

function prepend(list, el) {
    return [el].concat(list.slice(0, max_messages));
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
        console.log(event);
        if (event.data.type == 'experiments_list_update') {
            // what channel do you want?
            var new_messages = this.state.messages,
                new_channel  = this.state.channel;

            if (this.state.channel !== null) {
                current_channel_still_available = false;
                event.data.data.available_experiments.forEach(function(exp) {
                    if (exp.uuid === new_channel) {
                        current_channel_still_available = true;
                    }
                });

                if (!current_channel_still_available) {
                    new_channel = null;
                    if (this.state.channel !== null) {
                        new_messages = prepend(new_messages,
                                ExpiredChannel());
                    }
                }
            }

            if (event.data.data.available_experiments.length > 0 &&
                    new_channel === null) {
                var experiment_idx = 0;
                var preferred_name = this.props.preferred_experiment;
                event.data.data.available_experiments.forEach(function(exp, idx) {
                    if (exp.uuid == preferred_name || exp.name == preferred_name) {
                        experiment_idx = idx;
                    }
                });
                new_channel  = event.data.data.available_experiments[experiment_idx].uuid;
                new_channel_name  = event.data.data.available_experiments[experiment_idx].name;
                new_messages = prepend(new_messages, NewChannel(new_channel_name));
            }

            this.setState({
                channel: new_channel,
                // got available channels from pick_channel message
                available_channels: event.data.data.available_experiments,
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
    onChangeSubscription: function (name, new_channel) {
        if (new_channel != this.state.channel) {
            this.setState({
                channel: new_channel,
                messages: prepend(this.state.messages, NewChannel(name))
            });
        }
    },
    render: function () {
        var current_channel = this.state.channel;
        var options = this.state.available_channels.map( function (experiment, k) {
            var offset = new Date().getTimezoneOffset() * 60000;
            var created_local_tz = new Date(parseInt(experiment.created * 1000) + offset);
            return {
                name:  experiment.name,
                value: experiment.uuid,
                time_since: created_local_tz,
                active: current_channel == experiment.uuid
            }
        });
        var no_available_channels = "";
        if (this.state.available_channels.length === 0 && this.state.messages.length === 0) {
            no_available_channels = (
                <div className="center">
                    <p>No Experiments Found</p>
                    <p className="light">Start an experiment using <a href="https://github.com/JonathanRaiman/Dali"><b>Dali</b></a></p>
                    <p className="light">To test the visualizer you can use <a href="http://redis.io/topics/quickstart#check-if-redis-is-working"><code>redis-cli</code></a></p>
                    <pre style={{"textAlign": "left"}}>{
                        '\n' +
                        'SET namespace_experiment 1 EX 5\n' +
                        'PUBLISH update_experiment \'{\n' +
                        '    "type":"classifier_example",\n' +
                        '    "input": {\n' +
                        '        "type": "sentence",\n' +
                        '        "words": ["hello"]\n' +
                        '    },\n' +
                        '    "output": {\n' +
                        '        "type": "sentence",\n' +
                        '        "words": ["world"]\n' +
                        '    }}\'\n'}</pre>
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

var preferred_experiment = window.location.hash.slice(1);
React.initializeTouchEvents(true);

React.render(
    <VisualizationServer url={"http://"+window.location.host+"/updates"}
                         preferred_experiment={preferred_experiment} />, document.body
);
