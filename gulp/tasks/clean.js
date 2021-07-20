const clean = require('gulp-clean');

module.exports = (gulp, globalConfig, config = {}) => {
    const { cleanPath } = {
        ...globalConfig,
        ...config,
    };
    return () => gulp
        .src(cleanPath, {
            allowEmpty: true,
        })
        .pipe(clean());
};
