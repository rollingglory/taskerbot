'use strict';

const Koa = require('koa');
const app = new Koa();
const cors = require('@koa/cors');
const webpack = require('koa-webpack');
const mount = require('koa-mount');
const serve = require('koa-static');
const bodyparser = require('koa-bodyparser');
const compose = require('koa-compose');
const conditional = require('koa-conditional-get');
const etag = require('koa-etag');
const mongoose = require('mongoose');
const cachegoose = require('cachegoose');
const index = require('./routes/index');
const production = process.env.NODE_ENV === 'production';
const packagejson = require('./package.json');

cachegoose(mongoose, {
  port: 6379,
  host: 'localhost',
});
mongoose.connect(process.env.TASKERBOT_MONGO_CRED);

// view engine setup

if (!production) app.use(webpack());
app.use(cors({
  origin: [
    `https://${packagejson.now.alias}.now.sh`,
    'http://glyph.rollingglory.com',
    'http://rollingtaskerbot.herokuapp.com',
  ],
}));
app.use(conditional());
app.use(etag());
app.use(serve('taskerview'));
app.use(serve('node_modules'));
app.use(bodyparser());
app.use(compose(index.middleware));

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.error('mongoose connected');
});

module.exports = app;
