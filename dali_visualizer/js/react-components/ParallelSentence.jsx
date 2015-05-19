/**
* @jsx React.DOM
*/

var ParallelSentence = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    getDefaultProps: function () {
        return {
            normalize_weights: false,
            color: "black",
            sentences: {
                sentence1: {
                    words: [],
                    weights: []
                },
                sentence2: {
                    words: [],
                    weights: []
                }
            }
        };
    },
    create_word_element: function(words, weights, idx, className) {
        if (arguments.length < 4) {
            className = "";
        }
        if (weights && weights[idx] !== undefined) {
            var word_style = {
                'backgroundColor': 'rgba(255, 251, 78, ' + weights[idx] + ")"
            };
            var tooltip_els = [
                <span>activation = </span>,
                <span className="numerical">{weights[idx].toFixed(2)}</span>
            ];
            return (
                <TooltipWord style={word_style}
                             className={className}
                             tooltip={tooltip_els}>{words[idx]}
                </TooltipWord>);
        } else {
            return <span className={className}>{words[idx]}</span>;
        }
    },
    render: function () {
        var font_style = {'color': this.props.color};
        var words1 = this.props.sentences.sentence1.words;
        var weights1 = this.props.sentences.sentence1.weights;
        if (weights1 && this.props.normalize_weights) {
            weights1 = normalize_weights(weights1);
        }

        var words2 = this.props.sentences.sentence2.words;
        var weights2 = this.props.sentences.sentence2.weights;
        if (weights2 && this.props.normalize_weights) {
            weights2 = normalize_weights(weights2);
        }
        var words_elt = [];
        for (var idx = 0; idx < Math.min(words1.length, words2.length); ++idx) {
            var word1_el = this.create_word_element(words1, weights1, idx, "upper"),
                word2_el = this.create_word_element(words2, weights2, idx, "lower");
            words_elt.push(<span className="stacked_words">{word1_el}{word2_el}</span>);
            words_elt.push(<span>{" "}</span>);
        }

        return (
            <span style={font_style}>
                {words_elt}
            </span>
        )
    }
});
