function normalize_weights(weights) {
    var result = weights.slice(0);
    var minimum = Math.min.apply(Math, weights);
    var maximum = Math.max.apply(Math, weights);
    for (var idx=0; idx < weights.length; ++idx) {
        result[idx] = (weights[idx] - minimum ) / (maximum-minimum);
    }
    return result;
}

function color_str(r, g, b, a) {
    var rgb_str = Math.round(255*r) + ',' + Math.round(255*g) + ',' + Math.round(255*b);
    if (a) {
        return 'rgba(' + rgb_str + ',' + a + ')';
    } else {
        return 'rgb(' + rgb_str +')';
    }
}
