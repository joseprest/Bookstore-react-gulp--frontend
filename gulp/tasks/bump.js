const bump = require('gulp-bump');

module.exports = gulp => () => gulp
    .src('./package.json')
    .pipe(bump())
    .pipe(gulp.dest('./'));
