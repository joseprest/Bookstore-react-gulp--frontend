const path = require('path');
const webpack = require('webpack-stream');
const plumber = require('gulp-plumber');
const sourcemaps = require('gulp-sourcemaps');

module.exports = (gulp, gulpConfig) => () => gulp
    .src(path.join(gulpConfig.jsSrcPath, 'index.js'))
    .pipe(plumber())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(webpack(require(path.resolve(__dirname, '../webpack.config.js'))(gulpConfig)))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(gulpConfig.jsTmpPath));
