const minifyCss = require('gulp-minify-css');
const rename = require('gulp-rename');

module.exports = (gulp, config) => () => gulp
    .src(`${config.sassTmpPath}/**/*.css`, {
        base: config.sassBasePath || null,
    })
    .pipe(minifyCss())
    .pipe(
        rename({
            suffix: '.min',
        }),
    )
    .pipe(gulp.dest(config.sassBuildPath));
