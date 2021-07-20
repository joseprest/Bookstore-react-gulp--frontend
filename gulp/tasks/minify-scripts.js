const uglify = require('gulp-uglify');
const rename = require('gulp-rename');

module.exports = (gulp, config) => () => gulp
    .src([`${config.jsTmpPath}/**/*.js`, `!${config.jsTmpPath}/manivelle*`, `!${config.jsTmpPath}/*.chunk.js`, `!${config.jsTmpPath}/*.min.js`])
    .pipe(
        uglify().on('error', (e) => {
            console.log(e);
        }),
    )
    .pipe(
        rename({
            suffix: '.min',
        }),
    )
    .pipe(gulp.dest(config.jsBuildPath));
