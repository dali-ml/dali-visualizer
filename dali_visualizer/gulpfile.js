// Great thanks to: http://travismaynard.com/writing/getting-started-with-gulp
var gulp   = require('gulp');
var order  = require("gulp-order");
var es     = require('event-stream');
var react  = require('gulp-react');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var jshint = require("gulp-jshint");
var rename = require('gulp-rename');

var react_task = function () {
    return gulp.src(
        ["js/components/*.jsx", "js/app.jsx"],
        { read: true })
        .pipe(react({harmony: true}));
};

var lib_js = [
    "js/bower_components/react/react.min.js",
    "js/bower_components/zepto/zepto.min.js",
    "js/bower_components/sockjs/sockjs.min.js"
];

gulp.task('default', function () {
    gulp.src(lib_js)
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest('static/js/'));

    return gulp.src([
                "js/components/*.js",
                "js/components/*.jsx",
                "js/*.jsx"
            ]).pipe(
                react({harmony: true})
            ).pipe(order(
                [
                "js/bower_components/*/*.js",
                "js/components/*.js",
                "js/components/*.jsx",
                "js/*.jsx",
                "js/*",
                "*"]))
            .pipe(concat('app.js'))
            .pipe(rename('app.min.js'))
            // .pipe(uglify())
            // .pipe(gzip())
            .pipe(gulp.dest('static/js/'));
});
