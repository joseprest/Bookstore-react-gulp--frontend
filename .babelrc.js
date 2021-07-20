module.exports = {
    presets: [
        [require.resolve('@babel/preset-env'), {
            modules: false
        }],
        require.resolve('@babel/preset-react'),
    ],
    plugins: [
        require.resolve('@babel/plugin-proposal-class-properties'),
        require.resolve('@babel/plugin-proposal-object-rest-spread'),
        require.resolve('@babel/plugin-syntax-dynamic-import'),
    ],
};
