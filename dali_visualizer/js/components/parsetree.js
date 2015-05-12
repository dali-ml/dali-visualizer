// http://monicalent.com/blog/2014/06/15/parse-tree-editor-d3-editable-tree-layout/

var parsetree = function(svg_el, options) {
    this.el = svg_el;
    this.options = options || {};

    if (this.el == null)
        console.log("Could not find DOM object");

    return this;
};

// For our purposes, I'll hardcode our data in.
parsetree.prototype.init = function(datum) {
    this.data = datum;
    this.render();
    return this;
};

parsetree.prototype.destroy = function () {
    if (this.update_timeout) {
        clearTimeout(this.update_timeout);
        this.canvas.remove();
    }
}
var canvas;

parsetree.prototype.convertData = function(words) {
    // Create a root node
    var rootNode = { 'id': 0, 'label': 'root', 'pos': 'root' };
    words.push(rootNode);

    var dataMap = words.reduce(function(map, node) {
        map[node.id] = node;
        return map;
    }, {});

    var treeData = [];
    words.forEach(function(node) {

        var head = dataMap[node.head];

        // Then, create the hierarchical data d3 needs
        if (head)
            (head.children || (head.children = [])).push(node);
        else
            treeData.push(node);
    });
    return treeData;
};

var svg;

parsetree.prototype.render = function () {
    // To keep multiple instances from stomping on each other's data/d3 references
    this.tree = d3.layout.tree().nodeSize([100, 50]);

    // Tell our tree how to decide how to separate the nodes
    this.tree.separation(function (a, b) {
        var scale = 0.13;
        if (a.relation && b.relation && a.label && b.label) {
            var w1 = (a.label.length > a.relation.length) ? a.label.length : a.relation.length;
            var w2 = (b.label.length > b.relation.length) ? b.label.length : b.relation.length;
            return Math.ceil((w1 * scale) + (w2 * scale) / 2);
        } else {
            if (a.label && b.label) {
                return Math.ceil((a.label.length * scale) + (b.label.length * scale) / 2);
            } else {
                return 0;
            }
        }
    });

    // Create our SVG elements
    // this.svg is our reference to the parent SVG element
    this.svg = d3.select(this.el)
        .attr('class', 'svg-container')
        .style('width', 700)
        .style('overflow', 'auto');
    // this.canvas is the group () that the actual tree goes into
    this.canvas = this.svg.append('g')
        .attr('class', 'canvas');

    // and we nest another one inside to allow zooming and panning
    this.canvas.append('g')
        .attr('transform', 'translate(' + (this.options.width || 300) + ', ' + (this.options.marginTop || 20) + ') scale(' + (this.options.initialScale || .8) + ')');

    // And at last, we tell the tree to consider our data.
    this.root = this.data;

    // this.update is called whenever our data changes
    this.update(this.root);

    return this;
};

parsetree.prototype.update_bbox = function (retries) {
    if (retries == 0) {
        return;
    }
    var ptree = this;
    if (ptree.update_timeout) {
        clearTimeout(ptree.update_timeout);
    }
    svg = ptree.svg;

    ptree.update_timeout = setTimeout( function () {
        var big_difference = false;
        ptree.canvas.each( function(d,i) {
            var bbox = this.getBBox();
            // console.log(svg.attr("height"));
            if (Math.abs(svg.node().getBoundingClientRect().height - 20 - bbox.height) > 5) {
                big_difference = true;
                svg.style("height", bbox.height + 20);
            } else {
                ptree.update_bbox(retries - 1);
            }
        });
        if (big_difference) {
            ptree.update_bbox(10);
        }
    }, 50);
}

parsetree.prototype.update = function (source) {

    // This function tells our tree to be oriented vertically instead of horizontally
    var diagonal = d3.svg.diagonal()
        .projection(function (d) {
            return [d.x, d.y];
        });

    var nodes = this.tree(this.root).reverse(),
        links = this.tree.links(nodes);

    nodes.forEach(function (d) {
        d.y = d.depth * 100;
    });

    var node = this.svg.select('.canvas g')
        .selectAll('g.node')
        .data(nodes, function (d, i) {
            return d.id || (d.id = ++i);
        });

    var nodeEnter = node.enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', function (d) {
            return 'translate(' + source.x + ', ' + source.y + ')';
        });

    nodeEnter.append('circle')
        .attr('r', 10)
        .style('stroke', '#000')
        .style('stroke-width', '3px')
        .style('fill', '#FFF');

    node.exit()
        .remove();

    // Our Greek Word
    nodeEnter.append('text')
        .attr('y', function (d, i) {
            return (d.pos == 'root') ? -30 : 15;
        })
        .attr('dy', '14px')
        .attr('text-anchor', 'middle')
        .text(function (d) {
            return d.label;
         })
        .style('fill', function (d, i) {
            return (d.pos == 'root') ? '#CCC' : '#333';
        })
        .style('font-family', 'Cambria, Serif')
        .style('letter-spacing', '2px')
        .style('font-size', '18px')
        .style('fill-opacity', 1);

    // Relation of Node to Parent
    nodeEnter.append('text')
        .attr('y', function (d, i) {
            return (d.pos == 'root') ? 0 : -30;
        })
        .attr('dy', '12px')
        .attr('text-anchor', 'middle')
        .attr('class', 'label')
        .style('font-family', 'sans-serif')
        .style('font-size', '12px')
        .style('font-weight', 500)
        .style('letter-spacing', '1px')
        .style('fill', '#666')
        .text(function (d) {
            return d.relation;
        });

    var nodeUpdate = node
        // .duration(this.options.duration || 500)
        .attr('transform', function (d) {
            return 'translate(' + d.x + ', ' + d.y + ')';
        });

    var link = this.svg.select('.canvas g')
        .selectAll('path.link')
        .data(links, function (d) {
            return d.target.id;
        });

    link.enter()
        .insert('path', 'g')
        .attr('class', 'link')
        .style('stroke', '#CCC')
        .style('stroke-width', '2px')
        .style('fill', 'none')
        .attr('d', function (d) {
            var o = {
                x: source.x,
                y: source.y
            };

            return diagonal({
                source: o,
                target: o
            });
        });

    link.exit()
        .remove();

    link
        // .transition()
        // .duration(this.options.duration || 500)
        .attr('d', diagonal);

    nodes.forEach(function (d, i) {
        d.x0 = d.x;
        d.y0 = d.y;
    });

    canvas = this.canvas;

    this.update_bbox(10);
};
