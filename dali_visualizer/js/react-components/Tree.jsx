// try publishing this on redis:
// PUBLISH feed_experiment '{"type":"tree", "children": [{"type":"tree", "name": "hello", "children": []}, {"type":"tree", "name": "world", "children": []}]}'

function deepCopy(el) {
    var new_obj = JSON.stringify(el);
    return JSON.parse(new_obj);
}

var node_y_spacing = 50,
    node_x_spacing = 50,
    radius = 10;

function convert_to_children(datum, offsetx, offsety, opts) {
    if (Array.isArray(datum)) {
        var children = [];
        for (var child_idx = 0; child_idx < datum.length; child_idx++ ) {
            children.push(convert_to_children(datum[child_idx], offsetx, offsety, opts));
        }
        return <g className="roots">{children}</g>;
    }
    var children = [];
    var links    = [];
    if (datum.children && datum.children.length > 0) {
        var offsety_children = offsety + node_y_spacing,
            child_radius,
            offsetx_children_min;
        if (datum.children.length === 1) {
            child_radius = radius / 2;
            offsetx_children_min = offsetx;
        } else {
            child_radius = ((node_x_spacing * (datum.children.length - 1)) + datum.children.length * radius) / 2;
            offsetx_children_min = offsetx - child_radius;
        }

        for (var child_idx = 0; child_idx < datum.children.length; child_idx++) {
            children.push(convert_to_children(
                datum.children[child_idx],
                offsetx_children_min + child_idx * (node_x_spacing + radius),
                offsety_children,
                opts));
            links.push(
                <line x1={offsetx}
                      y1={offsety}
                      x2={offsetx_children_min + child_idx * (node_x_spacing + radius)}
                      y2={offsety_children}/>
            );
        }
    }
    if (children.length > 0) {
        return (
            <g x={offsetx} y={offsety}>
                <circle r={radius} cx={offsetx} cy={offsety}/>
                <text x={offsetx + radius} y={offsety + radius}>
                    {datum.label ? datum.label : ""}
                </text>
                <g className="children">{links.concat(children)}</g>
            </g>
        );
    } else {
        opts.max_y = Math.max(opts.max_y, offsety + radius);
        opts.min_x = Math.min(opts.min_x, offsetx - radius);
        opts.max_x = Math.max(opts.max_x, offsetx + radius + (datum.label ? datum.label.length * 5 : 0));
        return (
            <g x={offsetx} y={offsety} className="leaf">
                <circle r={radius} cx={offsetx} cy={offsety}/>
                <text x={offsetx + radius} y={offsety + radius}>
                    {datum.label ? datum.label : ""}
                </text>
            </g>
        );
    }
}

var NODE_RADIUS = 10;
var SUBTREE_GAP_X = 50;
var SUBTREE_GAP_Y = 50;

function tree_to_drawing_data(tree) {
    if (tree.children === undefined || tree.children.length == 0) {
        return {
            'width' : 2 * NODE_RADIUS,
            'height' : 2 * NODE_RADIUS,
            'node_position': [ NODE_RADIUS, NODE_RADIUS ],
            'label': tree.label,
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
                'offset_y': 2 * NODE_RADIUS + SUBTREE_GAP_Y,
                'drawing_data' : child_drawing_data
            });
            offset_so_far += child_drawing_data.width;
            max_child_height = Math.max(max_child_height, child_drawing_data.height);
        });
        return {
            'width' : offset_so_far,
            'height' : max_child_height + SUBTREE_GAP_Y + 2 * NODE_RADIUS,
            'node_position' : [offset_so_far/2, NODE_RADIUS],
            'label': tree.label,
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

    return  <g>
                <g>
                    {line_els}
                </g>
                <circle r={NODE_RADIUS}
                    cx={node_offset_x}
                    cy={node_offset_y} />
                <text x={node_offset_x + NODE_RADIUS} y={node_offset_y + NODE_RADIUS}>
                    {drawing_data.label ? drawing_data.label : ""}
                </text>
                <g>
                    {children_els}
                </g>

            </g>

}

var OutputTree = React.createClass({
    render: function () {
        var treeData =
              {
                "label": "A",
                "id": "A",
                "children": [
                  {
                    "label": "B",
                    "id": "B",
                    "children": [
                      {
                        "label": "C",
                        "id": "C"
                      },
                      {
                        "label": "D",
                        "id": "D",
                        "children": [
                          {
                            "label": "F",
                            "id": "F"
                          },
                        ]
                      }
                    ]
                  },
                  {
                    "label": "E",
                    "id": "E",
                    "children" : [
                      {
                        "label": "G",
                        "id": "G"
                      },
                      {
                        "label": "H",
                        "id": "H"
                      }
                    ]
                  }
                ]
              };
        //var opts = {max_x: 0, max_y: 0, min_x: 0, min_y: 0};
        //var svgchildren = convert_to_children(treeData, 100, 0 + radius, opts);
        var drawing_data = tree_to_drawing_data(treeData);
        var tree_as_svg = drawing_data_to_svg(drawing_data, 0, 0);
        return (
            <div className="tree">
                <svg width="100%" height={drawing_data.height}>
                    {tree_as_svg}
                </svg>
            </div>
        );
    }
});
