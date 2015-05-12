// try publishing this on redis:
// PUBLISH feed_experiment '{"type":"tree", "children": [{"type":"tree", "name": "hello", "children": []}, {"type":"tree", "name": "world", "children": []}]}'

function deepCopy(el) {
    var new_obj = JSON.stringify(el);
    return JSON.parse(new_obj);
}

var Tree = React.createClass({
    componentDidUpdate: function (prevProps, prevState) {
        var root = deepCopy(this.props.tree);
        clearTimeout(this.parse_tree.update_timeout);
        this.parse_tree.root = root;
        this.parse_tree.update(this.parse_tree.root);
    },
    remove_tree: function () {
        this.parse_tree.destroy();
    },
    componentDidMount: function () {
        this.create_tree();
    },
    componentWillUnmount: function () {
        this.remove_tree();
    },
    create_tree: function () {
        var root = deepCopy(this.props.tree);
        this.parse_tree = new parsetree(this.refs.svg.getDOMNode()).init(root);
    },
    render: function () {
        return (
            <div className="tree">
                <svg ref="svg" />
            </div>
        );
    }
});
