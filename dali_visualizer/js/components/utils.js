Object.equals = function( x, y ) {
  if ( x === y ) return true;
    // if both x and y are null or undefined and exactly the same

  if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
    // if they are not strictly equal, they both need to be Objects

  if ( x.constructor !== y.constructor ) return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test there constructor.

  for ( var p in x ) {
    if ( ! x.hasOwnProperty( p ) ) continue;
      // other properties were tested using x.constructor === y.constructor

    if ( ! y.hasOwnProperty( p ) ) return false;
      // allows to compare x[ p ] and y[ p ] when set to undefined

    if ( x[ p ] === y[ p ] ) continue;
      // if they have the same strict value or identity then they are equal

    if ( typeof( x[ p ] ) !== "object" ) return false;
      // Numbers, Strings, Functions, Booleans must be strictly equal

    if ( ! Object.equals( x[ p ],  y[ p ] ) ) return false;
      // Objects and Arrays must be tested recursively
  }

  for ( p in y ) {
    if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
      // allows x[ p ] to be set to undefined
  }
  return true;
}


function normalize_weights(weights) {
    if (weights.length > 1) {
        var result = weights.slice(0);
        var minimum = Math.min.apply(Math, weights);
        var maximum = Math.max.apply(Math, weights);
        for (var idx=0; idx < weights.length; ++idx) {
            result[idx] = (weights[idx] - minimum ) / (maximum-minimum);
        }
        return result;
    } else {
        return weights;
    }
}
function softmax(weights) {
    if (weights && weights.length > 0) {
        var exped_weights = weights.slice(0);
        var sum_exp = 0;
        for (var i = 0; i < exped_weights.length; i++) {
            exped_weights[i] = Math.exp(exped_weights[i]);
            sum_exp += exped_weights[i];
        }
        for (var i = 0; i < exped_weights.length; i++) {
            exped_weights[i] /= sum_exp;
        }
        return exped_weights;
    }
    return weights;
}

function inplace_softmax(weights) {
    if (weights && weights.length > 0) {
        var sum_exp = 0;
        for (var i = 0; i < weights.length; i++) {
            weights[i] = Math.exp(weights[i]);
            sum_exp += weights[i];
        }
        for (var i = 0; i < weights.length; i++) {
            weights[i] /= sum_exp;
        }
        return weights;
    }
    return weights;
}

function color_str(r, g, b, a) {
    var rgb_str = Math.round(255*r) + ',' + Math.round(255*g) + ',' + Math.round(255*b);
    if (a) {
        return 'rgba(' + rgb_str + ',' + a + ')';
    } else {
        return 'rgb(' + rgb_str +')';
    }
}
