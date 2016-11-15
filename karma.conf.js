'use strict';

var path = require('path');

module.exports = function(config) {
    config.set({
        basePath: '',
        captureTimeout: 100000,
        browserDisconnectTimeout: 60000,
        browserNoActivityTimeout: 60000,
        frameworks: [
            'jasmine'
        ],
        files: [
            {pattern: 'bower_components/tui-code-snippet/code-snippet.js', watched: false},

            'src/js/virtualScroll.js',
            'test/index.js'
        ],
        exclude: [],
        preprocessors: {
            'src/js/virtualScroll.js': ['webpack', 'sourcemap'],
            'test/index.js': ['webpack', 'sourcemap']
        },
        webpack: {
            devtool: '#inline-source-map',
            resolve: {
                root: [path.resolve('./src/js')]
            }
        },
        reporters: [
            'dots'
        ],
        coverageReporter: {
            dir: 'report/coverage/',
            reporters: [
                {
                    type: 'html',
                    subdir: function(browser) {
                        return 'report-html/' + browser;
                    }
                },
                {
                    type: 'cobertura',
                    subdir: function(browser) {
                        return 'report-cobertura/' + browser;
                    },
                    file: 'cobertura.txt'
                }
            ]
        },
        junitReporter: {
            outputDir: 'report/junit',
            suite: ''
        },
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        autoWatchBatchDelay: 500,
        browsers: [
            'Chrome'
        ],
        singleRun: false
    });
};
