'use strict';

const express = require('express');
const packageInfo = require('./package.json');
const path = require('path');
var moment = require('moment');
const bodyParser = require('body-parser');

const index = require('./routes/index');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'taskerview'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

var server = app.listen(process.env.PORT, () => {
  const host = server.address().address;
  const port = server.address().port;

  console.log('Web server started at http://%s:%s', host, port);
});

// Heroku Keep Alive Ping
const http = require('http'); //importing http

setInterval(() => {
  http
    .get('https://rollingtaskerbot.herokuapp.com', (res) => {
      if (res.statusCode !== 200) {
        console.log(`Heroku Keep Alive Ping: Error - Status Code ${res.statusCode}`);
      }
    })
    .on('error', (err) => {
      console.log(`Heroku Keep Alive Ping: Error - ${err.message}`);
    });
}, 20 * 60 * 1000); // load every 20 minutes

//get recaps

var moment = require('moment');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose.connect(process.env.TASKERBOT_MONGO_CRED);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('mongoose connected');
});
const User = require('./models/user.js');
const Project = require('./models/project.js');
const Log = require('./models/log.js');

const allowedOrigins = [
  'http://glyph.rollingglory.com',
  'http://localhost',
  'http://localhost:8080',
];

app.get('/recap/:month-:year', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  const year = req.params.year;
  const month = req.params.month;

  const start = new Date(year, month - 1, 1, 0, 0, 0);
  const end = new Date(year, month - 1, 31, 23, 59, 59);

  const promise = Log.find({
    date: { $gte: start.getTime(), $lt: end.getTime() },
  })
    .sort({ date: 1, userId: 1, shift: 1 })
    .populate('userId', 'alias')
    .populate('projectId', 'code')
    .exec()
    .then((logs) => {
      result = { status: 'success', logs };
      res.json(result);
    })
    .catch((err) => {
      result = { status: 'failed' };
      res.json(result);
    });
});

app.get('/recap/:month-:year/user/:user', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  const year = req.params.year;
  const month = req.params.month;
  const user = req.params.user;

  const start = new Date(year, month - 1, 1, 0, 0, 0);
  const end = new Date(year, month - 1, 31, 23, 59, 59);

  const promise = Log.find({
    date: { $gte: start.getTime(), $lt: end.getTime() },
    userId: user,
  })
    .sort({ date: 1, userId: 1, shift: 1 })
    .populate('userId', 'name alias')
    .populate('projectId', 'code')
    .exec()
    .then((logs) => {
      result = { status: 'success', user: logs[0].userId.name, logs };
      res.json(result);
    })
    .catch((err) => {
      result = { status: 'failed' };
      res.json(result);
    });
});

app.get('/recap/:month-:year/project/:project', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  const year = req.params.year;
  const month = req.params.month;
  const project = req.params.project;

  const start = new Date(year, month - 1, 1, 0, 0, 0);
  const end = new Date(year, month - 1, 31, 23, 59, 59);

  const promise = Log.find({
    date: { $gte: start.getTime(), $lt: end.getTime() },
    projectId: project,
  })
    .sort({ date: 1, shift: 1, userId: 1 })
    .populate('userId', 'alias')
    .populate('projectId', 'code name')
    .exec((err, log) => {
      if (err) return handleError(err);
      log.forEach(function() {
        this.date = new Date(this.date).getDate();
      });
    })
    .then((logs) => {
      result = {
        status: 'success',
        project: logs[0].projectId.name,
        logs,
      };
      res.json(result);
    })
    .catch(err => {
      result = { status: 'failed' };
      res.json(result);
    });
});

app.get('/users', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  const promise = User.find({ isActive: true })
    .select('alias')
    .sort({ name: 1 })
    .exec()
    .then((users) => {
      result = { status: 'success', users };
      res.json(result);
    })
    .catch(err => {
      result = { status: 'failed' };
      res.json(result);
    });
});

app.get('/projects', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  const promise = Project.find({ isActive: true })
    .select('code name')
    .sort({ name: 1 })
    .exec()
    .then((projects) => {
      result = { status: 'success', projects };
      res.json(result);
    })
    .catch(err => {
      result = { status: 'failed' };
      res.json(result);
    });
});

app.post('/log', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  const userId = req.body.user_id;
  const projectId = req.body.project_id;
  const date = req.body.date;
  const shift = req.body.shift;
  const content = req.body.content;

  date
    .trim()
    .split('/')
    .forEach((item, idx) => {
      switch (idx) {
        case 0:
          day = item;
          break;
        case 1:
          month = item - 1;
          break;
        case 2:
          year = item;
          break;
      }
    });
  const now = new Date(year, month, day, 0, 0, 0, 0);
  const now_utc = new Date(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  );
  const d = moment(now_utc)
    .add(7, 'hours')
    .toDate();

  const newLog = new Log({
    userId,
    date: d.getTime(),
    shift,
    projectId,
    content,
  });
  newLog
    .save()
    .then((log) => {
      if (log == null) {
        var message = 'Log gagal disimpan. Coba lagi dalam beberapa saat.';
        res.send({ success: false, message });
      } else {
        var message = 'Logging berhasil! Terima kasih ya!';
        res.send({ success: true, message });
      }
    })
    .catch(err => {
      console.log(err);
      const message =
        'Deskripsi gagal ditambahkan. Coba lagi dalam beberapa saat.';
      res.send({ success: false, message });
    });
});

app.post('/edit_log', (req, res) => {
  const logId = req.body.log_id;
  const projectId = req.body.project_id;
  const content = req.body.content;

  const updatedData = {
    projectId,
    content,
  };
  const promise = Log.update({ _id: logId }, { $set: updatedData });
  promise
    .then((result) => {
      if (result != null && result.ok == 1) {
        var message = 'Log berhasil diubah';
        res.send({ success: true, message });
      } else {
        var message = 'Log gagal diubah. Coba lagi dalam beberapa saat.';
        res.send({ success: false, message });
      }
    })
    .catch(err => {
      const message = 'Log gagal diubah. Coba lagi dalam beberapa saat.';
      res.send({ success: false, message });
    });
});

app.post('/remove_log', (req, res) => {
  const logId = req.body.log_id;
  const promise = Log.findOneAndRemove({ _id: logId }).exec();
  promise.then((log) => {
    if (log == null) {
      var message = 'Log tidak ditemukan';
      res.send({ success: false, message });
    } else {
      var message = 'Log berhasil dihapus';
      res.send({ success: true, message });
    }
  });
});
