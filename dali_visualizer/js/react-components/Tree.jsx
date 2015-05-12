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

var OutputTree = React.createClass({
    render: function () {
        // var treeData = [
        //       {
        //         "label": "A",
        //         "id": "A",
        //         "children": [
        //           {
        //             "label": "B",
        //             "id": "B",
        //             "children": [
        //               {
        //                 "label": "C",
        //                 "id": "C"
        //               },
        //               {
        //                 "label": "D",
        //                 "id": "D",
        //                 "children": [
        //                   {
        //                     "label": "F",
        //                     "id": "F"
        //                   },
        //                 ]
        //               }
        //             ]
        //           },
        //           {
        //             "label": "E",
        //             "id": "E"
        //           }
        //         ]
        //       }
        //     ];
        var opts = {max_x: 0, max_y: 0, min_x: 0, min_y: 0};
        var svgchildren = convert_to_children(this.props.tree, 100, 0 + radius, opts);

        return (
            <div className="tree">
                <svg height={opts.max_y + 10} width="100%">{svgchildren}</svg>
            </div>
        );
    }
});
