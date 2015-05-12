// try publishing this on redis:
// PUBLISH feed_experiment '{"type":"tree", "children": [{"type":"tree", "name": "hello", "children": []}, {"type":"tree", "name": "world", "children": []}]}'

function json_to_link_nodes(node, nodes, links, siblings, labelAnchors, labelAnchorLinks) {
    if (node.label) {
        var d3_node = {label: node.label};
        nodes.push(d3_node);
        labelAnchors.push({
            node: d3_node
        });
        labelAnchors.push({
            node: d3_node
        });
        labelAnchorLinks.push({
            source: labelAnchors.length - 2,
            target: labelAnchors.length - 1,
            weight: 1
        });
    } else {
        nodes.push({});
    }
    var parent_index = nodes.length - 1,
        sibling_idx, prev_sibling_idx;
    if (node.children && node.children.length > 0) {
        for (var i = 0; i < node.children.length; i++) {
            sibling_idx = nodes.length;
            links.push({
                source: parent_index,
                target: sibling_idx,
                weight: 1
            });

            if (i > 0) {
                siblings.push({
                    left: prev_sibling_idx,
                    right: sibling_idx
                });
            }

            json_to_link_nodes(
                node.children[i],
                nodes,
                links,
                siblings,
                labelAnchors,
                labelAnchorLinks
            );
            prev_sibling_idx = sibling_idx;
        }
    }
}


var Tree = React.createClass({
    componentDidUpdate: function (prevProps, prevState) {
        if (!Object.equals(prevProps.tree, this.props.tree)) {
            this.remove_tree();
            this.create_tree();
        }
    },
    d3_get_svg: function () {
        return d3.select( this.getDOMNode() ).selectAll("svg");
    },
    remove_tree: function () {
        this.d3_get_svg()
            .selectAll("g")
            .remove();
    },
    componentDidMount: function () {
        this.create_tree();
    },
    create_tree: function () {
        // Select the svg element
        var svg   = this.d3_get_svg(),
            frame = svg.selectAll("g").data([0]),
            parent_div = this.getDOMNode();

        frame
            .enter()
            .append("g");

        var w = "100%",
            h = "200px",
            r = 12,
            transition_duration = 500,
            forceSize = [parent_div.offsetWidth, 200],
            fill = d3.scale.category20();

        var labelDistance = 0;

        var force = d3.layout.force()
                      .charge(-240)
                      .linkDistance(55)
                      .size(forceSize);

        var links = [],
            nodes = [],
            siblings = [],
            labelAnchors = [],
            labelAnchorLinks = [];

        json_to_link_nodes(
            this.props.tree,
            nodes,
            links,
            siblings,
            labelAnchors,
            labelAnchorLinks
        );

        var link = svg.selectAll("line").data(links);

        link
            .enter()
                .append("svg:line");

        link
            .exit()
                .append("svg:line")
                .transition()
                    .duration(transition_duration)
                        .style("opacity", 0)
                            .remove();

        var node = svg.selectAll("circle").data(nodes);

        node
            .enter()
                .append("svg:circle")
                    .attr("r", r - .75)
                    .style("fill", function(d) { return fill(d.group); })
                    .style("stroke", function(d) { return d3.rgb(fill(d.group)).darker(); })
                    .call(force.drag);

        node
            .exit()
                .transition()
                    .duration(transition_duration)
                        .style("opacity", 0)
                            .remove();

        force
            .nodes(nodes)
            .links(links);

        force.start();

        var labelForce = d3.layout.force()
            .nodes(labelAnchors)
            .links(labelAnchorLinks)
            .linkDistance(0)
            .linkStrength(8)
            .charge(-240)
            .size(forceSize);

        labelForce.start();

        var anchorLink = svg.selectAll("line.anchorLink")
            .data(labelAnchorLinks);//.enter().append("svg:line").attr("class", "anchorLink").style("stroke", "#999");

        var anchorNode = svg.selectAll("g.anchorNode")
                      .data(labelForce.nodes());

        var anchorNode = svg.selectAll("g.anchorNode").data(labelForce.nodes());

        var gEnter = anchorNode.enter()
            .append("svg:g").attr("class", "anchorNode")

        gEnter
            .append("svg:circle").attr("r", 0).style("fill", "#FFF");

        gEnter
            .append("svg:text").text(function(d, i) {
            return i % 2 == 0 ? "" : d.node.label
        }).style("fill", "#555").style("font-family", "Roboto").style("font-size", 14);

        anchorNode
            .exit()
                .transition()
                    .duration(transition_duration)
                        .style("opacity", 0)
                            .remove();

        var updateLink = function() {
            this.attr("x1", function(d) {
                return d.source.x;
            }).attr("y1", function(d) {
                return d.source.y;
            }).attr("x2", function(d) {
                return d.target.x;
            }).attr("y2", function(d) {
                return d.target.y;
            });
        }

        var updateNode = function() {
            this.attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        }

        force.on("tick", function (e) {
            labelForce.start();

            var k = 6 * e.alpha;

            node.call(updateNode);

            var max_y = 0;
            node.each( function (d, i) {
                max_y = Math.max(d.y, max_y);
            });

            anchorNode.each(function(d, i) {

                if(i % 2 == 0) {
                    d.x = d.node.x;
                    d.y = d.node.y;
                } else {
                    var b = this.childNodes[1].getBBox();

                    var diffX = d.x - d.node.x;
                    var diffY = d.y - d.node.y;

                    var dist = Math.sqrt(diffX * diffX + diffY * diffY);

                    var shiftX = b.width * (diffX - dist) / (dist * 2);
                    shiftX = Math.max(-b.width, Math.min(0, shiftX));
                    var shiftY = 5;
                    this.childNodes[1].setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
                }
            });

            anchorNode.call(updateNode);
            link.call(updateLink);
            anchorLink.call(updateLink);

            // Push sources up and targets down to form a weak tree.

            links.forEach(function(d, i) {
              d.source.y -= k;
              d.target.y += k;
            });



            svg
                .attr("height", Math.max(200, Math.min(1000, max_y + r)))

            forceSize[0] = parent_div.offsetWidth;

            force.size(forceSize);
            labelForce.size(forceSize);

        });

        // update svg size
        svg
            .transition()
                .duration(transition_duration)
                    .attr("width", w)
                    .attr("height", h);

    },
    render: function () {
        // var tooltip_els = [
        //     <span>activation = </span>,
        //     <span className="numerical">{0.2}</span>
        // ],
        //     word_style = {};

        // var leaf = !(this.props.tree.children && this.props.tree.children.length > 0);

        // if (leaf) {
        //     return <TooltipWord style={word_style}
        //                         tooltip={[tooltip_els]}>{this.props.tree.name}
        //             </TooltipWord>
        // } else {
        //     var children = this.props.tree.children.map(function (child, k) {
        //         return <Tree tree={child} key={"branch_" + k}/>
        //     });

        //     return <div>{children}</div>;
        // }
        return <div className="tree"><svg></svg></div>;
    }
});
