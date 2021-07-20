module.exports = (gulp, config, browserSync) => {
    const browserSyncConfig = {
        files: config.browserSyncWatchFiles || [],

        watchOptions: {
            ignored: false,
        },

        scrollProportionally: false,
        ghostMode: false,
        notify: false,

        server: {
            baseDir: config.publicPath,
        },
    };

    // Static Server + watching scss/html files
    return (done) => {
        browserSync.init(browserSyncConfig);
        done();
    };
};
