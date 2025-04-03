const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    mode: "development",
    entry: path.resolve(__dirname, 'src/index.js'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js',
        
    },
    plugins: [new HtmlWebpackPlugin({
        template: 'src/template.html',
        filename: 'index.html'
    })],
    devServer: {
        static: './dist',
        hot: true,
        port: 3000,
        open: true, // opens in browser
      },
}