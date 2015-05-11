// try publishing this on redis:
// PUBLISH feed_experiment '{"type":"tree", "children": [{"type":"tree", "name": "hello", "children": []}, {"type":"tree", "name": "world", "children": []}]}'

var Tree = React.createClass({
    render: function () {
        var tooltip_els = [
            <span>activation = </span>,
            <span className="numerical">{0.2}</span>
        ],
            word_style = {};

        var leaf = !(this.props.tree.children && this.props.tree.children.length > 0);

        if (leaf) {
            return <TooltipWord style={word_style}
                                tooltip={[tooltip_els]}>{this.props.tree.name}
                    </TooltipWord>
        } else {
            var children = this.props.tree.children.map(function (child, k) {
                return <Tree tree={child} key={"branch_" + k}/>
            });

            return <div>{children}</div>;
        }
    }
});
