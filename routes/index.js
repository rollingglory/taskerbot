'use strict';

const express = require('express');
const moment = require('moment');
const parse = require('date-fns/parse');
const startOfMonth = require('date-fns/start_of_month');
const endOfMonth = require('date-fns/end_of_month');
const packageInfo = require('../package.json');
const User = require('../models/user.js');
const Project = require('../models/project.js');
const Log = require('../models/log.js');

const router = express.Router();

const allowedOrigins = [
  'http://glyph.rollingglory.com',
  'http://localhost',
  'http://localhost:8080',
];

router.get('/', (req, res) => {
  res.send({ version: packageInfo.version });
});

router.get('/testapi', (req, res) => {
  res.render('testapi', { version: packageInfo.version });
});

router.get('/recap/:date', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  const start = startOfMonth(req.params.date);
  const end = endOfMonth(req.params.date);

  Log.find({
    date: { $gte: start.getTime(), $lt: end.getTime() },
  })
    .sort({ date: 1, userId: 1, shift: 1 })
    .populate('userId', 'alias')
    .populate('projectId', 'code')
    .exec()
    .then(logs => res.json({ status: 'success', logs }))
    .catch(err => res.json({ status: 'failed', err }));
});

router.get('/recap/:date/user/:user', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  const user = req.params.user;
  const start = startOfMonth(req.params.date);
  const end = endOfMonth(req.params.date);

  Log.find({
    date: { $gte: start.getTime(), $lt: end.getTime() },
    userId: user,
  })
    .sort({ date: 1, userId: 1, shift: 1 })
    .populate('userId', 'name alias')
    .populate('projectId', 'code')
    .exec()
    .then(logs => res.json({
      status: 'success',
      user: logs[0].userId.name,
      logs,
    }))
    .catch(err => res.json({ status: 'failed', err }));
});

router.get('/recap/:date/project/:project', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  const project = req.params.project;
  const start = startOfMonth(req.params.date);
  const end = endOfMonth(req.params.date);

  Log.find({
    date: { $gte: start.getTime(), $lt: end.getTime() },
    projectId: project,
  })
    .sort({ date: 1, shift: 1, userId: 1 })
    .populate('userId', 'alias')
    .populate('projectId', 'code name')
    .exec((err, log) => {
      if (err) return handleError(err);
      log.forEach(function () {
        this.date = new Date(this.date).getDate();
      });
    })
    .then(logs => res.json({
      status: 'success',
      project: logs[0].projectId.name,
      logs,
    }))
    .catch(err => res.json({ status: 'failed', err }));
});

router.get('/users', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  User.find({ isActive: true })
    .select('alias')
    .sort({ name: 1 })
    .exec()
    .then(users => res.json({ status: 'success', users }))
    .catch(err => res.json({ status: 'failed', err }));
});

router.get('/projects', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  Project.find({ isActive: true })
    .select('code name')
    .sort({ name: 1 })
    .exec()
    .then(projects => res.json({ status: 'success', projects }))
    .catch(err => res.json({ status: 'failed', err }));
});

router.post('/log', (req, res) => {
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
    .then(log => {
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

router.post('/edit_log', (req, res) => {
  const logId = req.body.log_id;
  const projectId = req.body.project_id;
  const content = req.body.content;

  const updatedData = {
    projectId,
    content,
  };
  const promise = Log.update({ _id: logId }, { $set: updatedData });
  promise
    .then(result => {
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

router.post('/remove_log', (req, res) => {
  const logId = req.body.log_id;
  const promise = Log.findOneAndRemove({ _id: logId }).exec();
  promise.then(log => {
    if (log == null) {
      var message = 'Log tidak ditemukan';
      res.send({ success: false, message });
    } else {
      var message = 'Log berhasil dihapus';
      res.send({ success: true, message });
    }
  });
});

module.exports = router;
