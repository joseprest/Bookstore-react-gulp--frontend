const merge = require('merge-stream');

// prettier-ignore
module.exports = (gulp, config) => () => (
    config.copySrcPath.reduce((stream, { base, src }) => (
        stream.add(gulp.src(src, {
            base,
        }).pipe(gulp.dest(config.copyBuildPath)))
    ), merge())
);
