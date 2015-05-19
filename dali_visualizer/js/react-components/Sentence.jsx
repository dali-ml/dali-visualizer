/**
* @jsx React.DOM
*/

var Sentence = React.createClass({
    mixins: [React.addons.PureRenderMixin],
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
        var widx = 0;
        for (var idx = 0; idx < words.length; ++idx) {
            if (weights && weights[idx] !== undefined) {
                var word_style = {
                    'backgroundColor': 'rgba(255, 251, 78, ' + weights[idx] + ")"
                };
                var tooltip_els = [
                    <span>activation = </span>,
                    <span className="numerical">{weights[idx].toFixed(2)}</span>
                ];
                words_elt.push(
                    <TooltipWord style={word_style}
                                 key={"w_"+ (widx++)}
                                 tooltip={tooltip_els}>{words[idx]}
                    </TooltipWord>);
            } else {
                words_elt.push(<span key={"w_"+ (widx++)}>{words[idx]}</span>);
            }
            words_elt.push(<span key={"w_"+ (widx++)}>{" "}</span>);
        }


        return (
            <span style={font_style}>
                {words_elt}
            </span>
        )
    }
});
