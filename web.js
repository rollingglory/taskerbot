'use strict';

const http = require('http');

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const index = require('./routes/index');

const app = express();

mongoose.Promise = global.Promise;

// view engine setup
app.set('views', path.join(__dirname, 'taskerview'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'taskerview')));

app.use('/', index);

const server = app.listen(process.env.PORT, () => {
  const host = server.address().address;
  const port = server.address().port;

  console.log('Web server started at http://%s:%s', host, port);
});

// Heroku Keep Alive Ping
setInterval(() => {
  http
    .get('https://rollingtaskerbot.herokuapp.com', res => {
      if (res.statusCode !== 200) {
        console.log(`Keep Alive: Error - Status Code ${res.statusCode}`);
      }
    })
    .on('error', err => {
      console.log(`Keep Alive: Error - ${err.message}`);
    });
}, 20 * 60 * 1000); // load every 20 minutes

mongoose.connect(process.env.TASKERBOT_MONGO_CRED);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('mongoose connected');
});

module.exports = app;
