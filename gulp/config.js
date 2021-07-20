module.exports = () => {
    const assetsSrcFolder = './src';
    const assetsTmpPath = './.tmp';
    const assetsBuildFolder = './dist';
    const bowerPath = './bower_components';
    const publicPath = [assetsTmpPath, assetsSrcFolder, './'];

    const httpAssetsPath = '/';
    const httpJsPath = '/js/';
    const httpBowerPath = '/bower_components/';

    const browserSyncWatchFiles = [
        `${assetsSrcFolder}/**/*.html`,
        `${assetsSrcFolder}/**/*.{gif,jpg,png}`,
        `${assetsTmpPath}/**/*.js`,
        `${assetsTmpPath}/**/*.css`,
    ];

    const copyBasePath = assetsSrcFolder;
    const copySrcPath = [
        {
            base: assetsSrcFolder,
            src: [
                `${assetsSrcFolder}/*.{html,ico,txt}`,
                `${assetsSrcFolder}/fonts/**`,
                `${assetsSrcFolder}/images/**/*.svg`,
            ],
        },
        {
            base: assetsTmpPath,
            src: [
                `${assetsTmpPath}/js/**/*.js`,
                `${assetsTmpPath}/js/**/*.map`,
                `!${assetsTmpPath}/js/**/*.min.js`,
                `!${assetsTmpPath}/js/**/*.min.js.map`,
                `${assetsTmpPath}/css/**/*.css`,
                `!${assetsTmpPath}/css/**/*.min.css`,
            ],
        },
    ];
    const copyBuildPath = assetsBuildFolder;

    const modernizrSrcPath = [`${assetsSrcFolder}/js/**/*.js`, `${assetsSrcFolder}/scss/**/*.scss`];
    const modernizrBuildPath = `${assetsTmpPath}/js`;

    const cleanPath = [assetsBuildFolder];

    // Configurable paths
    return {
        cleanPath,

        // Javascript (Webpack)
        jsSrcPath: `${assetsSrcFolder}/js`,
        jsTmpPath: `${assetsTmpPath}/js`,
        jsBuildPath: `${assetsBuildFolder}/js`,
        jsCopySrcPath: `${assetsTmpPath}/js/**/*.{js,map}`,
        jsCopyBasePath: assetsTmpPath,
        jsCopyBuildPath: assetsBuildFolder,

        // Sass
        sassSrcPath: `${assetsSrcFolder}/scss`,
        sassTmpPath: `${assetsTmpPath}/css`,
        sassBasePath: `${assetsTmpPath}/css`,
        sassBuildPath: `${assetsBuildFolder}/css`,

        // Images
        imgSrcPath: `${assetsSrcFolder}/images`,
        imgBuildPath: `${assetsBuildFolder}/images`,

        // Fonts
        fontsPath: `${assetsSrcFolder}/fonts`,

        // Bower
        bowerPath,

        // Copy
        copyBasePath,
        copySrcPath,
        copyBuildPath,

        // Modernizr
        modernizrSrcPath,
        modernizrBuildPath,

        // Http
        httpAssetsPath,
        httpJsPath,
        httpBowerPath,

        // Public path for Browser sync
        publicPath,

        // Files to watch by browser sync
        browserSyncWatchFiles,

        // Assets path
        assetsTmpPath,
        assetsSrcPath: assetsSrcFolder,
        assetsBuildPath: assetsBuildFolder,
    };
};
