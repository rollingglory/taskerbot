'use strict';

const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify');

module.exports = {
  input: 'src/script.js',
  output: {
    name: 'tasker',
    file: 'taskerview/script.js',
    format: 'iife',
  },
  plugins: [
    resolve({
      browser: true,
    }),
    commonjs(),
    (process.env.NODE_ENV === 'production' && uglify()),
  ],
};
