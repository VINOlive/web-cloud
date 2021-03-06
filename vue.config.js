'use strict'
const path = require('path')
const defaultSettings = require('./src/settings.js')
const WatchRoutePlugin = require('./WatchRoutePlugin.js')

function resolve(dir = '') {
    return path.join(__dirname, dir)
}

const name = defaultSettings.title || 'vue Element Admin' // page title

// If your port is set to 80,
// use administrator privileges to execute the command line.
// For example, Mac: sudo npm run
// You can change the port by the following method:
// port = 9527 npm run dev OR npm run dev --port = 9527
const port = process.env.port || process.env.npm_config_port || 9527 // dev port

// All configuration item explanations can be find in https://cli.vuejs.org/config/
module.exports = {
    /**
     * You will need to set publicPath if you plan to deploy your site under a sub path,
     * for example GitHub Pages. If you plan to deploy your site to https://foo.github.io/bar/,
     * then publicPath should be set to "/bar/".
     * In most cases please use '/' !!!
     * Detail: https://cli.vuejs.org/config/#publicpath
     */
    publicPath: '/',
    outputDir: 'dist',
    assetsDir: 'static',
    lintOnSave: process.env.NODE_ENV === 'development',
    productionSourceMap: false,
    devServer: {
        port: port,
        open: true,
        overlay: {
            warnings: false,
            errors: true
        },
        proxy: {
            // 基础系统的ip地址
            [process.env.VUE_APP_BASE_API]: {
                target: `http://master1.vtstar.net:30000`,
                changeOrigin: true,
                pathRewrite: {
                    ['^' + process.env.VUE_APP_BASE_API]: ''
                }
            }
        }
    },
    configureWebpack: {
        plugins: [
            // new WatchRoutePlugin()  // 不适用监听路由
        ],
        name: name,
        resolve: {
            alias: {
                '@': resolve('src'),
                '@vt': resolve('packages')
            }
        }
    },
    chainWebpack(config) {
        config.plugins.delete('preload') // TODO: need test
        config.plugins.delete('prefetch') // TODO: need test
        // set svg-sprite-loader
        config.module
            .rule('svg')
            .exclude.add(resolve('src/icons'))
            .end()
        config.module
            .rule('icons')
            .test(/\.svg$/)
            .include.add(resolve('src/icons'))
            .end()
            .use('svg-sprite-loader')
            .loader('svg-sprite-loader')
            .options({
                symbolId: 'icon-[name]'
            })
            .end()

        // set preserveWhitespace
        config.module
            .rule('vue')
            .use('vue-loader')
            .loader('vue-loader')
            .tap(options => {
                options.compilerOptions.preserveWhitespace = true
                return options
            })
            .end()

        // 扩展 webpack 配置，使 packages 加入编译
        // chainWebpack: config => {
        //     config.module
        //         .rule('js')
        //         .include
        //         .add(resolve('components'))
        //         .end()
        //         .use('babel')
        //         .loader('babel-loader')
        //         .tap(options => {
        //             // 修改它的选项...
        //             return options
        //         })
        // }

        config
        // https://webpack.js.org/configuration/devtool/#development
            .when(process.env.NODE_ENV === 'component',
                config => {
                    config.module
                        .rule('js')
                        .include
                        .add(resolve('components'))
                        .end()
                        .use('babel')
                        .loader('babel-loader')
                        .tap(options => {
                            // 修改它的选项...
                            return options
                        })
                }
                // config => config.devtool('cheap-module-eval-source-map')
            )

        config
        // https://webpack.js.org/configuration/devtool/#development
            .when(process.env.NODE_ENV === 'development',
                config => config.devtool('cheap-source-map')
                // config => config.devtool('cheap-module-eval-source-map')
            )

        config
            .when(process.env.NODE_ENV === 'production',
                config => {
                    config
                        .plugin('ScriptExtHtmlWebpackPlugin')
                        .after('html')
                        .use('script-ext-html-webpack-plugin', [{
                            // `runtime` must same as runtimeChunk name. default is `runtime`
                            inline: /runtime\..*\.js$/
                        }])
                        .end()
                    config
                        .optimization.splitChunks({
                        chunks: 'all',
                        cacheGroups: {
                            libs: {
                                name: 'chunk-libs',
                                test: /[\\/]node_modules[\\/]/,
                                priority: 10,
                                chunks: 'initial' // only package third parties that are initially dependent
                            },
                            elementUI: {
                                name: 'chunk-elementUI', // split elementUI into a single package
                                priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
                                test: /[\\/]node_modules[\\/]_?element-ui(.*)/ // in order to adapt to cnpm
                            },
                            commons: {
                                name: 'chunk-commons',
                                test: resolve('src/components'), // can customize your rules
                                minChunks: 3, //  minimum common number
                                priority: 5,
                                reuseExistingChunk: true
                            }
                        }
                    })
                    config.optimization.runtimeChunk('single')
                }
            )
    },
    css: {
        sourceMap: true,
        extract: {
            filename: 'style/[name].css'
        }
    },
    // css: {
    //     loaderOptions: {
    //         sass: {
    //             data: `
    //                 @import "@/styles/mixin.scss";
    //                 @import "@/styles/variables.scss";
    //             `
    //         }
    //     }
    // }
}
