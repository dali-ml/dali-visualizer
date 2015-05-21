/**
* @jsx React.DOM
*/

var Message = React.createClass({
    render: function () {
        return (<div className="message">
            <p>{this.props.message.content}</p>
        </div>);
    }
});
