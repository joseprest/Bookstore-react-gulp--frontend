module.exports = {
    jsBasePath: function(path)
    {
        if (typeof path === 'undefined') {
            path = '';
        }
        return __dirname + '/../../../src/js/' + path;
    }
}