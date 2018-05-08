'use strict';

const Koa = require('koa');
const app = new Koa();
const cors = require('@koa/cors');
const mount = require('koa-mount');
const koaStatic = require('koa-static');
const bodyparser = require('koa-bodyparser');
const mongoose = require('mongoose');
const cachegoose = require('cachegoose');
const index = require('./routes/index');

cachegoose(mongoose, {
  port: 6379,
  host: 'localhost',
});
mongoose.connect(process.env.TASKERBOT_MONGO_CRED);

// view engine setup

app.use(cors({
  origin: [
    'http://glyph.rollingglory.com',
    'http://rollingtaskerbot.herokuapp.com',
    'https://rgb-task.now.sh',
  ],
}));
app.use(koaStatic('taskerview'));
app.use(koaStatic('node_modules'));
app.use(bodyparser());
app.use(mount('/', index));

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('mongoose connected');
});

module.exports = app;
