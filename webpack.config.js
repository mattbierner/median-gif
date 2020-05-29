"use strict";
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
    const production = env && env.production;
    return {
        mode: production ? 'production' : 'development',
        entry: {
            main: './src/main.js'
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    use: ['babel-loader']
                }
            ]
        },
        resolve: {
            extensions: ['*', '.js', '.jsx']
        },
        output: {
            filename: "[name].js",
            path: path.join(__dirname, "js")
        },
        devtool: production ? '' : 'inline-source-map',
        optimization: {
            minimize: !!production,
            minimizer: [new TerserPlugin()],
        },
    };
};