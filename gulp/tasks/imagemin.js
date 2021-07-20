const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');

module.exports = (gulp, config) => () => gulp
    .src(`${config.imgSrcPath}/**/*.{gif,jpg,jpeg,png,svg}`)
    .pipe(
        imagemin({
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }],
            use: [pngquant()],
        }),
    )
    .pipe(gulp.dest(config.imgBuildPath));
