'use strict';

const path = require('path');

const Html = require('html-webpack-plugin');
const Clean = require('clean-webpack-plugin');
const Minicss = require('mini-css-extract-plugin');
const Vue = require('vue-loader/lib/plugin');
const mode = process.env.NODE_ENV || 'development';
const production = mode === 'production';

module.exports = {
  entry: ['./src/script.js'],
  output: {
    path: path.resolve(__dirname, 'taskerview'),
    publicPath: '/',
  },
  mode,
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.html$/,
        use: ['html-loader'],
      },
      {
        test: /\.vue$/,
        use: ['vue-loader'],
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.less$/,
        use: [
          production ? Minicss.loader : 'style-loader',
          'vue-style-loader',
          'css-loader',
          'less-loader',
        ],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ['file-loader'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: ['file-loader'],
      },
    ],
  },
  plugins: [
    new Clean(['taskerview']),
    new Minicss(),
    new Html({
      template: './src/index.html',
    }),
    new Vue(),
  ],
};
