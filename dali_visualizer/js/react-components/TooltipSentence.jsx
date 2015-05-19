/**
* @jsx React.DOM
*/

var TooltipSentence = React.createClass({
    mixins: [Tooltip, React.addons.PureRenderMixin],
    render: function () {
        return <div className="sentence">
                    <Sentence color={this.props.color}
                              sentence={this.props.sentence} />
                </div>;
    },
    tooltipContent: function () {
        return <div>{this.props.tooltip}</div>;
    }
});
