/**
 * @author NHN Ent. FE Development Lab <dl_javascript@nhnent.com>
 * @fileoverview webpack 설정파일
 */

'use strict';

var webpack = require('webpack');
var path = require('path');
var pkg = require('./package.json');

var ENTRY_PATH = './src/js/virtualScroll.js';

var isProduction = process.argv.indexOf('--production') >= 0;
var isMinified = process.argv.indexOf('--minify') >= 0;
var eslintLoader = {
    test: /\.js$/,
    exclude: /(node_modules|bower_components)/,
    configFile: './.eslintrc',
    loader: 'eslint'
};

module.exports = (function() {
    var readableTimestamp = (new Date()).toString();
    var bannerText = '@fileoverview ' + pkg.name + '\n' +
        '@author ' + pkg.author + '\n' +
        '@version ' + pkg.version + '\n' +
        '@license ' + pkg.license + '\n' +
        '@link ' + pkg.repository.url + '\n' +
        'bundle created at "' + readableTimestamp + '"';
    var config = {
        entry: ENTRY_PATH,
        output: {
            path: path.join(__dirname, (isProduction ? 'dist' : 'build')),
            publicPath: '/dev/',
            filename: pkg.name + (isMinified ? '.min' : '') + '.js'
        },
        module: {
            preLoaders: [eslintLoader]
        },
        devServer: {
            host: '0.0.0.0',
            port: 8080,
            contentBase: __dirname
        }
    };
    var pluginConfig = [];

    if (!isProduction) {
        config.devtool = '#inline-source-map';
    }

    if (isMinified) {
        pluginConfig.push(new webpack.optimize.UglifyJsPlugin({
            compress: {warnings: false},
            output: {comments: false}
        }));
    }

    pluginConfig.push(new webpack.BannerPlugin(bannerText, {entryOnly: true}));
    config.plugins = pluginConfig;

    return config;
})();
