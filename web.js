'use strict';

const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cachegoose = require('cachegoose');
const index = require('./routes/index');

cachegoose(mongoose, {
  port: 6379,
  host: 'localhost',
});
mongoose.connect(process.env.TASKERBOT_MONGO_CRED);

// view engine setup
app.set('views', path.join(__dirname, 'taskerview'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'taskerview')));
app.use(express.static(path.join(__dirname, 'node_modules')));

app.use('/', index);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('mongoose connected');
});

module.exports = app;
