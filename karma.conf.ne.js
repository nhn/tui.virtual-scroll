'use strict';

var path = require('path');

module.exports = function(config) {
    var webdriverConfig = {
        hostname: 'fe.nhnent.com',
        port: 4444,
        remoteHost: true
    };

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
            'test/index.js': ['webpack', 'sourcemap'],
            'public/js/**/*.js': ['coverage']
        },
        webpack: {
            devtool: '#inline-source-map',
            resolve: {
                root: [path.resolve('./src/js')]
            }
        },
        reporters: [
            'dots',
            'coverage',
            'junit'
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
            'IE8',
            'IE9',
            'IE10',
            'IE11',
            'Chrome-WebDriver'
        ],

        customLaunchers: {
            'IE8': {
                base: 'WebDriver',
                config: webdriverConfig,
                browserName: 'internet explorer',
                version: 8
            },
            'IE9': {
                base: 'WebDriver',
                config: webdriverConfig,
                browserName: 'internet explorer',
                version: 9
            },
            'IE10': {
                base: 'WebDriver',
                config: webdriverConfig,
                browserName: 'internet explorer',
                version: 10
            },
            'IE11': {
                base: 'WebDriver',
                config: webdriverConfig,
                browserName: 'internet explorer',
                version: 11
            },
            'Chrome-WebDriver': {
                base: 'WebDriver',
                config: webdriverConfig,
                browserName: 'chrome'
            }
        },
        singleRun: true
    });
};
