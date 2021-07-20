const path = require('path');
const webpack = require('webpack');

// Load environment variables
require('dotenv').config({
    path: path.join(__dirname, '../.env'),
});

module.exports = config => ({
    mode: 'production',
    devtool: 'source-map',
    target: 'web',

    entry: {
        manivelle: path.join(__dirname, '../src/js/index'),
    },

    output: {
        path: path.join(__dirname, '../', config.assetsBuildPath),
        publicPath: config.httpJsPath,
        filename: '[name].min.js',
        chunkFilename: '[name].chunk.min.js',
        jsonpFunction: 'manivelleJsonp',
        library: 'Manivelle',
        libraryTarget: 'umd',
        libraryExport: 'default',
    },

    externals: {},

    resolve: {
        extensions: ['.js', '.jsx', '.es6'],
        modules: [
            path.join(__dirname, '../node_modules'),
            path.join(__dirname, '../web_modules'),
            path.join(__dirname, '../bower_components'),
        ],
    },

    module: {
        rules: [
            {
                oneOf: [
                    {
                        test: /\.(jsx?|es6)$/,
                        exclude: /(node_modules|bower_components|\.tmp|ftscroller)/,
                        loader: require.resolve('babel-loader'),
                    },
                    {
                        test: /\.html$/,
                        loader: require.resolve('html-loader'),
                    },
                    {
                        test: /\.scss$/,
                        loaders: [
                            require.resolve('raw-loader'),
                            require.resolve('sass-loader'),
                        ],
                    },
                    {
                        test: /\.(svg|jpg|png)$/,
                        loaders: [
                            require.resolve('url-loader'),
                        ],
                    },
                ],
            },
        ],
    },

    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
            NODE_ENV: JSON.stringify('production'),
            ENV: JSON.stringify('production'),
        }),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
            'root.jQuery': 'jquery',
        }),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new webpack.IgnorePlugin(/(?!fr|en)([a-z]{2,3})/, /locale-data/),
    ],

    stats: {
        colors: true,
        modules: true,
        reasons: true,
    },
});
