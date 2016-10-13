/**
 * @author NHN Ent. FE Development Lab <dl_javascript@nhnent.com>
 * @fileoverview webpack 설정파일
 */

'use strict';

var webpack = require('webpack');
var path = require('path');

var ExtractTextPlugin = require('extract-text-webpack-plugin');

var ENTRY_PATH = './src/js/virtualScroll.js'

var eslintLoader = {
    test: /\.js$/,
    exclude: /(node_modules|bower_components)/,
    configFile: './.eslintrc',
    loader: 'eslint'
};
var fileLoader = {
    test: /\.css$/,
    loader: ExtractTextPlugin.extract('css-loader?root=src/css/')
};

module.exports = {
    entry: ENTRY_PATH,
    output: {
        path: path.join(__dirname, 'build'),
        publicPath: '/dev/',
        filename: 'component-virtual-scroll.js'
    },
    module: {
        preLoaders: [eslintLoader],
        loaders: [fileLoader]
    },
    plugins: [
        new ExtractTextPlugin('component-virtual-scroll.css')
    ],
    devtool: '#inline-source-map',
    devServer: {
        host: '0.0.0.0',
        port: 8080,
        contentBase: __dirname
    }
};
