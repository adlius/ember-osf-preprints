/* eslint-env node */

'use strict';

const fs = require('fs');
const path = require('path');
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const configFunc = require('./config/environment');

const nonCdnEnvironments = ['development', 'test'];

const {
    EMBER_ENV
} = process.env;

module.exports = function(defaults) {
    const config = configFunc(EMBER_ENV);
    const useCdn = !nonCdnEnvironments.includes(EMBER_ENV);

    const css = {
        'app': '/assets/preprint-service.css'
    };

    const brands = fs.readdirSync('./app/styles/brands');

    for (const brand of brands) {
        if (/^_/.test(brand))
            continue;

        const brandId = brand.replace(/\..*$/, '');
        Object.assign(css, { [`brands/${brandId}`]: `/assets/css/${brandId}.css` });
    }

    const {
        OSF: {url: osfUrl}
    } = defaults.project.config(EMBER_ENV);

    // Reference: https://github.com/travis-ci/travis-web/blob/master/ember-cli-build.js
    const app = new EmberApp(defaults, {
        sourcemaps: {
            enabled: true,
            extensions: ['js']
        },
        vendorFiles: {
            // next line is needed to prevent ember-cli to load
            // handlebars (it happens automatically in 0.1.x)
            'handlebars.js': {production: null},
            [useCdn ? 'ember.js' : '']: false,
            [useCdn ? 'jquery.js' : '']: false,
        },
        'ember-bootstrap': {
            importBootstrapCSS: false
        },
        // Needed for branded themes
        fingerprint: {
            customHash: config.ASSET_SUFFIX,
            exclude: ['square_color_transparent.png', 'square_color_no_transparent.png', 'wide_black.png', 'wide_white.png', 'wide_color.png', 'sharing.png', 'style.css']
        },
        outputPaths: {
            app: {
                css
            }
        },
        sassOptions: {
            includePaths: [
                'node_modules/ember-osf/addon/styles',
                'bower_components/bootstrap-sass/assets/stylesheets',
                'bower_components/osf-style/sass',
                'bower_components/hint.css',
                'bower_components/c3',
                'bower_components/bootstrap-daterangepicker',
            ]
        },
        inlineContent: {
            raven: {
                enabled: useCdn,
                content: `
                    <script src="https://cdn.ravenjs.com/3.5.1/ember/raven.min.js"></script>
                    <script>Raven.config("${config.sentryDSN}", {}).install();</script>`
            },
            cdn: {
                enabled: useCdn,
                content: `
                    <script src="//cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js"></script>
                    <script src="//cdnjs.cloudflare.com/ajax/libs/ember.js/2.7.1/ember.prod.js"></script>`
            },
            assets: {
                enabled: true,
                content: `
                    <script>
                        window.assetSuffix = '${config.ASSET_SUFFIX ? '-' + config.ASSET_SUFFIX : ''}';
                        (function(osfUrl) {
                            var origin = window.location.origin;
                            window.isProviderDomain = !~osfUrl.indexOf(origin);
                            var prefix = '/' + (window.isProviderDomain ? '' : 'preprints/') + 'assets/';
                            [
                                'vendor',
                                'preprint-service'
                            ].forEach(function (name) {
                                var script = document.createElement('script');
                                script.src = prefix + name + window.assetSuffix + '.js';
                                script.async = false;
                                document.body.appendChild(script);

                                var link = document.createElement('link');
                                link.rel = 'stylesheet';
                                link.href = prefix + name + window.assetSuffix + '.css';
                                document.head.appendChild(link);
                            });
                        })('${osfUrl}');
                    </script>`
            }
        },
        postcssOptions: {
            compile: {
                enabled: false
            },
            filter: {
                enabled: true,
                plugins: [{
                    module: require('autoprefixer'),
                    options: {
                        browsers: ['last 4 versions'],
                        cascade: false
                    }
                }, {
                    // Wrap progid declarations with double-quotes
                    module: require('postcss').plugin('progid-wrapper', () => {
                        return css =>
                            css.walkDecls(declaration => {
                                if (declaration.value.startsWith('progid')) {
                                    return declaration.value = `"${declaration.value}"`;
                                }
                            });
                    })
                }]
            }
        },
        // bable options included to fix issue with testing discover controller
        // http://stackoverflow.com/questions/32231773/ember-tests-passing-in-chrome-not-in-phantomjs
        'ember-cli-babel': {
            optional: ['es6.spec.symbols'],
            includePolyfill: true
        },
    });

    // Use `app.import` to add additional libraries to the generated
    // output files.
    //
    // If you need to use different assets in different
    // environments, specify an object as the first parameter. That
    // object's keys should be the environment name and the values
    // should be the asset to use in that environment.
    //
    // If the library that you are including contains AMD or ES6
    // modules that you would like to import into your application
    // please specify an object with the list of modules as keys
    // along with the exports of each module as its value.

    // osf-style
    app.import(path.join(app.bowerDirectory, 'osf-style/vendor/prism/prism.css'));
    app.import(path.join(app.bowerDirectory, 'osf-style/page.css'));
    app.import(path.join(app.bowerDirectory, 'osf-style/css/base.css'));
    app.import(path.join(app.bowerDirectory, 'loaders.css/loaders.min.css'));


    app.import(path.join(app.bowerDirectory, 'osf-style/img/cos-white2.png'), {
        destDir: 'img'
    });

    // app.import('bower_components/dropzone/dist/dropzone.js');
    app.import({
        development: path.join(app.bowerDirectory, 'dropzone/dist/dropzone.css'),
        production: path.join(app.bowerDirectory, 'dropzone/dist/min/dropzone.min.css')
    });

    app.import(path.join(app.bowerDirectory, 'jquery.tagsinput/src/jquery.tagsinput.js'));
    app.import(path.join(app.bowerDirectory, 'bootstrap-daterangepicker/daterangepicker.js'));
    app.import(path.join(app.bowerDirectory, 'c3/c3.js'));
    app.import(path.join(app.bowerDirectory, 'd3/d3.js'));

    app.import({
        development: path.join(app.bowerDirectory, 'hint.css/hint.css'),
        production: path.join(app.bowerDirectory, 'hint.css/hint.css')
    });

    app.import({
        test: path.join(app.bowerDirectory, 'ember/ember-template-compiler.js')
    });

    // Import component styles from addon
    app.import('vendor/assets/ember-osf.css');

    return app.toTree();
};
