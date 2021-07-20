const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const sourcemaps = require('gulp-sourcemaps');
const postcssPresetEnv = require('postcss-preset-env');

module.exports = (gulp, config) => () => gulp
    .src(`${config.sassSrcPath}/**/*.scss`)
    .pipe(sourcemaps.init())
    .pipe(
        sass({
            includePaths: config.sassIncludePaths || [],
            errLogToConsole: true,
        }).on('error', sass.logError),
    )
    .pipe(postcss([postcssPresetEnv({})]))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(config.sassTmpPath));
