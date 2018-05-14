'use strict';

const path = require('path');

const Html = require('html-webpack-plugin');
const Clean = require('clean-webpack-plugin');
const Minicss = require('mini-css-extract-plugin');

const production = process.env.NODE_ENV === 'production';
// const css = production ?
//   'file-loader?name=[name].css!extract-loader' :
//   'style-loader';

module.exports = {
  entry: {
    script: './src/script.js',
    //site: `${css}!css-loader!less-loader!./src/site.less`,
  },
  output: {
    path: path.resolve(__dirname, 'taskerview'),
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: ['html-loader'],
      },
      {
        test: /\.less$/,
        use: [
          production ? Minicss.loader : 'style-loader',
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
  ],
};
