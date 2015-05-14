var NODE_RADIUS = 10;
var TEXT_GAP = 4;
var SUBTREE_GAP_X = 25;
var SUBTREE_GAP_Y = 50;

function text_bounding_box(label) {
    if (label) {
        var canvas = text_bounding_box.canvas || (text_bounding_box.canvas = document.createElement("canvas"));
        var context = canvas.getContext("2d");
        context.font = "15pt Roboto";
        var metrics = context.measureText(label);
        return [metrics.width, 15];
    } else {
        return [0,0];
    }
}

function tree_to_drawing_data(tree) {
    var text_box = text_bounding_box(tree.label);
    var text_gap = text_box[0] > 0 ? TEXT_GAP : 0;
    var labeled_node_width = 2 * NODE_RADIUS + text_gap + text_box[0];
    var labeled_node_height = Math.max(2 * NODE_RADIUS, text_box[1]);

    if (tree.children === undefined || tree.children.length == 0) {
        return {
            'width' : labeled_node_width,
            'height' : labeled_node_height,
            'node_position': [ NODE_RADIUS, labeled_node_height / 2],
            'label': tree.label,
            'label_height': text_box[1],
            'children': []
        }
    } else {
        var children = []
        var offset_so_far = 0;
        var max_child_height = 0;

        tree.children.forEach(function(child) {
            if (offset_so_far != 0) {
                offset_so_far += SUBTREE_GAP_X;
            }
            var child_drawing_data = tree_to_drawing_data(child);
            children.push({
                'offset_x': offset_so_far,
                'offset_y': labeled_node_height + SUBTREE_GAP_Y,
                'drawing_data' : child_drawing_data
            });
            offset_so_far += child_drawing_data.width;
            max_child_height = Math.max(max_child_height, child_drawing_data.height);
        });
        var text_ends = offset_so_far/2 - NODE_RADIUS + labeled_node_width;
        var width = Math.max(offset_so_far, text_ends);
        return {
            'width' : width,
            'height' : max_child_height + SUBTREE_GAP_Y + labeled_node_height,
            'node_position' : [offset_so_far/2, labeled_node_height / 2],
            'label': tree.label,
            'label_height': text_box[1],
            'children': children
        }
    }
}

function drawing_data_to_svg(drawing_data, offset_x, offset_y) {
    var node_offset_x = offset_x + drawing_data.node_position[0]
    var node_offset_y = offset_y + drawing_data.node_position[1];

    var children_els = [];
    var line_els = [];
    drawing_data.children.forEach(function(child) {
        children_els.push(drawing_data_to_svg(
            child.drawing_data,
            offset_x + child.offset_x,
            offset_y + child.offset_y
        ));
        line_els.push(
            <line x1={node_offset_x}
                  y1={node_offset_y}
                  x2={offset_x + child.offset_x + child.drawing_data.node_position[0]}
                  y2={offset_y + child.offset_y + child.drawing_data.node_position[1]} />
        )

    });
    var node_class = drawing_data.children.length == 0 ?
            "leaf" : "branch";
    return  <g className={node_class}>
                <g>
                    {line_els}
                </g>
                <circle r={NODE_RADIUS}
                    cx={node_offset_x}
                    cy={node_offset_y} />
                <text x={node_offset_x + NODE_RADIUS + TEXT_GAP} y={node_offset_y + drawing_data.label_height / 2}>
                    {drawing_data.label ? drawing_data.label : ""}
                </text>
                <g>
                    {children_els}
                </g>

            </g>

}

var OutputTree = React.createClass({
    render: function () {
        var drawing_data = tree_to_drawing_data(this.props.tree);
        var tree_as_svg = drawing_data_to_svg(drawing_data, 0, 0);
        return (
            <div className="tree">
                <svg width={drawing_data.width} height={drawing_data.height}>
                    {tree_as_svg}
                </svg>
            </div>
        );
    }
});
