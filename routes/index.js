'use strict';

const express = require('express');
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
  'http://rollingtaskerbot.herokuapp.com',
  'http://rgb-task.now.sh',
  'http://localhost',
  'http://localhost:8080',
];

router.get('/', (req, res) => {
  res.send({ version: packageInfo.version });
});

router.get('/recap/:date', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }


  Log
    .find({
      date: {
        $gte: startOfMonth(req.params.date).getTime(),
        $lt: endOfMonth(req.params.date).getTime(),
      },
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
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  Log
    .find({
      date: {
        $gte: startOfMonth(req.params.date).getTime(),
        $lt: endOfMonth(req.params.date).getTime(),
      },
      userId: req.params.user,
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
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  Log
    .find({
      date: {
        $gte: startOfMonth(req.params.date).getTime(),
        $lt: endOfMonth(req.params.date).getTime(),
      },
      projectId: req.params.project,
    })
    .sort({ date: 1, shift: 1, userId: 1 })
    .populate('userId', 'alias')
    .populate('projectId', 'code name')
    .exec((err, log) => {
      if (err) return err;

      return log.map(x => parse(x).getDate());
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
  if (allowedOrigins.includes(origin)) {
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
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  Project
    .find({ isActive: true })
    .select('code name')
    .sort({ name: 1 })
    .exec()
    .then(projects => res.json({ status: 'success', projects }))
    .catch(err => res.json({ status: 'failed', err }));
});

router.post('/log', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  (new Log({
    userId: req.body.user_id,
    date: parse(req.body.date.split('/').reverse().join('/')).getTime(),
    shift: req.body.shift,
    projectId: req.body.project_id,
    content: req.body.content,
  }))
    .save()
    .then(log => {
      if (log) {
        res.send({
          success: false,
          message: 'Logging berhasil! Terima kasih ya!',
        });
      } else {
        res.send({
          success: true,
          message: 'Log gagal disimpan. Coba lagi dalam beberapa saat.',
        });
      }
    })
    .catch(err => {
      console.error(err);
      res.send({
        success: false,
        message: 'Deskripsi gagal ditambahkan. Coba lagi dalam beberapa saat.',
      });
    });
});

router.post('/edit_log', (req, res) => {
  Log
    .update({ _id: req.body.log_id }, {
      $set: {
        projectId: req.body.project_id,
        content: req.body.content,
      },
    })
    .then(log => {
      if (log && log.ok === 1) {
        res.send({
          success: true,
          message: 'Log berhasil diubah',
        });
      } else {
        res.send({
          success: false,
          message: 'Log gagal diubah. Coba lagi dalam beberapa saat.',
        });
      }
    })
    .catch(err => {
      console.error(err);
      res.send({
        success: false,
        message: 'Log gagal diubah. Coba lagi dalam beberapa saat.',
      });
    });
});

router.post('/remove_log', (req, res) => {
  Log
    .findOneAndRemove({ _id: req.body.log_id })
    .exec()
    .then(log => {
      if (log) {
        res.send({
          success: true,
          message: 'Log berhasil dihapus',
        });
      } else {
        res.send({
          success: false,
          message: 'Log tidak ditemukan',
        });
      }
    });
});

module.exports = router;
