/**
* @jsx React.DOM
*/

var Sentence = React.createClass({
    getDefaultProps: function () {
        return {
            normalize_weights: false,
            color: "black",
            sentence: {
                words: [],
                weights: []
            }
        };
    },
    render: function () {
        var font_style = {'color': this.props.color};
        var words = this.props.sentence.words;
        var weights = this.props.sentence.weights;
        if (weights && this.props.normalize_weights) {
            weights = normalize_weights(weights);
        }
        var words_elt = [];
        for (var idx = 0; idx < words.length; ++idx) {
            if (weights[idx] !== undefined) {
                var word_style = {
                    'backgroundColor': 'rgba(255, 251, 78, ' + weights[idx] + ")"
                };
                var tooltip_els = [
                    <span>memory = </span>,
                    <span className="numerical">{weights[idx].toFixed(2)}</span>
                ];
                words_elt.push(
                    <TooltipWord style={word_style}
                                 tooltip={tooltip_els}>{words[idx]}
                    </TooltipWord>);
            } else {
                words_elt.push(<span>{words[idx]}</span>);
            }
            words_elt.push(<span>{" "}</span>);
        }

        return (
            <span style={font_style}>
                {words_elt}
            </span>
        )
    }
});
