/**
* @jsx React.DOM
*/

/*
Utility class for handling words with tooltips.
*/
var gTooltip      = new Tooltip();
gTooltip.type('none').effect('fade');
var gTooltipOwner = null;

var TooltipWord = React.createClass({
    mixins: [TooltipMixin],
    getDefaultProps: function () {
        return {
            className: ""
        }
    },
    render: function () {
        return <span className={this.props.className}
                     style={this.props.style ? this.props.style : {}}>
                     {this.props.children}
                </span>;
    },
    tooltipContent: function () {
        return <div>{this.props.tooltip}</div>;
    }
});
