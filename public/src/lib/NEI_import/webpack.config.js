const path = require("path");
var webpack = require("webpack");

var CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
	devtool: 'inline-source-map',
	entry: {
		'NEISwagger': './src/NEISwaggerWorker.ts',
		'NEISwagger.min': './src/NEISwaggerWorker.ts'
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: "[name].js"
	},
	resolve: {
		// Add `.ts` and `.tsx` as a resolvable extension.
		extensions: ['.ts', '.tsx', '.js']
	},
	module: {
		rules: [
			// all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
			{ test: /\.tsx?$/, loader: 'ts-loader' }
		]
	},
	plugins: [
		new CleanWebpackPlugin(['dist']),
		new webpack.optimize.UglifyJsPlugin({
			include: /\.min\.js$/,
			minimize: true
		})
	]
};