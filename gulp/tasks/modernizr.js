const modernizr = require('gulp-modernizr');

module.exports = (gulp, config) => () => gulp
    .src(config.modernizrSrcPath)
    .pipe(modernizr('modernizr.js'))
    .pipe(gulp.dest(config.modernizrBuildPath));
