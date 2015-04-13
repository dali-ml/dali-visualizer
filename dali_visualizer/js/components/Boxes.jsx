/**
* @jsx React.DOM
*/

var SVGRect = React.createClass({
    getDefaultProps: function() {
        return {
            x: 0,
            y: 0,
            height: 0,
            width: 0,
            className: ""
        };
    },
    render: function () {
        return (
            <rect x={this.props.x}
                  y={this.props.y}
                  width={this.props.width}
                  height={this.props.height}
                  className={this.props.className}></rect>
        );
    }
});

var Metrics = React.createClass({
    render: function () {
        return (<div className="metrics">
            <div className="valign-wrapper">
                {this.props.label}
                <svg className="content-metrics-authority">
                    <SVGRect x={0}
                             y={0}
                             width={this.props.probability * this.props.width}
                             height={this.props.height}
                             className="pos" />
                    <SVGRect x={this.props.probability * this.props.width}
                             y={0}
                             width={(1.0 - this.props.probability) * this.props.width}
                             height={this.props.height}
                             className="neg" />
                </svg>
            </div>
        </div>);
    }
});
