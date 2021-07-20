const gutil = require('gulp-util');

function write(filename, string) {
    const src = require('stream').Readable({ objectMode: true });
    // eslint-disable-next-line no-underscore-dangle
    src._read = function _read() {
        this.push(
            new gutil.File({
                cwd: '',
                base: '',
                path: filename,
                contents: Buffer.from(string),
            }),
        );
        this.push(null);
    };
    return src;
}

module.exports = (gulp, config) => () => {
    const pkg = require(`${__dirname}/../../package.json`);
    return write('version', pkg.version).pipe(gulp.dest(config.assetsBuildPath));
};
