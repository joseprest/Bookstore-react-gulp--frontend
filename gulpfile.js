const path = require('path');
const fs = require('fs');

// Load configuration from environment file
try {
    require('dotenv').config({
        path: path.join(__dirname, './.env'),
    });
} catch (e) {}

/**
 * Gulp
 */
const gulpPath = path.resolve('./gulp');
const gulp = require('gulp');
const watch = require('gulp-watch');

const config = require(path.join(gulpPath, 'config'))(gulp);

/**
 * Modernizr
 */
gulp.task('modernizr', require(path.join(gulpPath, 'tasks/modernizr'))(gulp, config));

/**
 * Sass
 */
gulp.task('sass', require(path.join(gulpPath, 'tasks/sass'))(gulp, config));
gulp.task('sass-watch', (done) => {
    gulp.watch([`${config.sassSrcPath}/**/*.scss`], gulp.series('sass'));
    done();
});

/**
 * Webpack
 */
gulp.task('webpack', require(path.join(gulpPath, 'tasks/webpack'))(gulp, config));
gulp.task(
    'webpack-dist',
    require(path.join(gulpPath, 'tasks/webpack-dist'))(gulp, config),
);
gulp.task('webpack-watch', (done) => {
    gulp.watch(['src/js/**/*'], gulp.series('webpack'));
    done();
});

/**
 * Minify
 */
gulp.task('minify-scripts', require(path.join(gulpPath, 'tasks/minify-scripts'))(gulp, config));
gulp.task('minify-styles', require(path.join(gulpPath, 'tasks/minify-styles'))(gulp, config));

/**
 * Browsersync
 */
gulp.browserSync = require('browser-sync').create();

gulp.task(
    'browsersync',
    require(path.join(gulpPath, 'tasks/browsersync'))(gulp, config, gulp.browserSync),
);
gulp.task('browsersync-reload', () => gulp.browserSync.reload());

/**
 * Webpack poll value, uses environment variable WEBPACK_POLLING
 */
let webpackPoll = false;

if (process.env.WEBPACK_POLLING && process.env.WEBPACK_POLLING !== 'false') {
    if (process.env.WEBPACK_POLLING == 'true') {
        webpackPoll = true;
    } else {
        const pollValue = parseInt(process.env.WEBPACK_POLLING);

        if (!isNaN(pollValue)) {
            webpackPoll = pollValue;
        }
    }
}

/**
 * Images
 */
gulp.task('imagemin', require(path.join(gulpPath, 'tasks/imagemin'))(gulp, config));

/**
 * Copy
 */
gulp.task('copy', require(path.join(gulpPath, 'tasks/copy'))(gulp, config));

/**
 * Clean
 */
gulp.task(
    'clean-dist',
    require(path.join(gulpPath, 'tasks/clean'))(gulp, config, {
        cleanPath: ['./dist'],
    }),
);
gulp.task(
    'clean-tmp',
    require(path.join(gulpPath, 'tasks/clean'))(gulp, config, {
        cleanPath: ['./.tmp'],
    }),
);

/**
 * Version
 */
gulp.task('version', require(path.join(gulpPath, 'tasks/version'))(gulp, config));

/**
 * Bump
 */
gulp.task('bump', require(path.join(gulpPath, 'tasks/bump'))(gulp, config));

/**
 * Main tasks
 */
gulp.task(
    'server',
    gulp.series(
        'clean-tmp',
        gulp.parallel(
            // Scripts
            gulp.series(gulp.parallel('modernizr', 'webpack'), 'webpack-watch'),
            // Styles
            gulp.series('sass', 'sass-watch'),
        ),
        'browsersync',
    ),
);

gulp.task(
    'build',
    gulp.series(
        gulp.parallel('clean-tmp', 'clean-dist'),
        'version',
        gulp.parallel(
            // Scripts
            gulp.series(gulp.parallel('modernizr', 'webpack', 'webpack-dist'), 'minify-scripts'),
            // Styles
            gulp.series('sass', 'minify-styles'),
        ),
        'imagemin',
        'copy',
    ),
);

gulp.task('default', gulp.series(['build']));
