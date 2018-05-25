'use strict';

const Koa = require('koa');
const app = new Koa();
const route = require('koa-route');
const {
  parse,
  format,
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  startOfHour,
  endOfHour,
  startOfMinute,
  endOfMinute,
  startOfSecond,
  endOfSecond,
} = require('date-fns');

const { version } = require('../package.json');
const User = require('../models/user.js');
const Project = require('../models/project.js');
const Log = require('../models/log.js');

const smallDateUnit = (date) => {
  const helper = [
    {
      token: 'YYYY',
      start: startOfYear,
      end: endOfYear,
    },
    {
      token: 'MM',
      start: startOfMonth,
      end: endOfMonth,
    },
    {
      token: 'DD',
      start: startOfDay,
      end: endOfDay,
    },
    {
      token: 'HH',
      start: startOfHour,
      end: endOfHour,
    },
    {
      token: 'mm',
      start: startOfMinute,
      end: endOfMinute,
    },
    {
      token: 'ss',
      start: startOfSecond,
      end: endOfSecond,
    },
  ];

  return helper[date.split(/[-T:Z]/).length - 1];
};

const getRange = (date) => {
  const { start, end } = smallDateUnit(date);

  return {
    $gte: start(date).getTime(),
    $lt: end(date).getTime(),
  };
};

const get = (...args) => app.use(route.get(...args));
const post = (...args) => app.use(route.post(...args));
const del = (...args) => app.use(route.delete(...args));
const put = (...args) => app.use(route.put(...args));

get('/', async (ctx) => {
  ctx.body = { version };
});

get('/recap', async (ctx) => {
  ctx.status = 302;
  ctx.redirect(`/recap/${format(Date.now(), 'YYYY-MM')}`);
});

get('/recap/:date', async (ctx, date) => {
  const logs = await Log
    .find({ date: getRange(date) })
    .sort({ date: 1, userId: 1, shift: 1 })
    .populate('userId', 'alias')
    .populate('projectId', 'code')
    .exec();

  ctx.body = {
    status: 'success',
    logs,
  };
});

get('/recap/:date/user/:user', async (ctx, date, user) => {
  const logs = await Log
    .find({
      date: getRange(date),
      userId: user,
    })
    .sort({ date: 1, userId: 1, shift: 1 })
    .populate('userId', 'name alias')
    .populate('projectId', 'code')
    .exec();

  ctx.body = {
    status: 'success',
    user: logs[0].userId.name,
    logs,
  };
});

get('/recap/:date/project/:project', async (ctx, date, project) => {
  const logs = await Log
    .find({
      date: getRange(date),
      projectId: project,
    })
    .sort({ date: 1, shift: 1, userId: 1 })
    .populate('userId', 'alias')
    .populate('projectId', 'code name')
    .exec();

  ctx.body = {
    status: 'success',
    project: logs[0].projectId.name,
    logs,
  };
});

get('/users', async (ctx) => {
  const users = await User.find({ isActive: true })
    .select('alias')
    .sort({ name: 1 })
    .exec();

  ctx.body = {
    status: 'success',
    users,
  };
});

get('/projects', async (ctx) => {
  const projects = await Project
    .find({ isActive: true })
    .select('code name')
    .sort({ name: 1 })
    .exec();

  ctx.body = {
    status: 'success',
    projects,
  };
});

post('/log', async (ctx) => {
  const log = new Log({
    userId: ctx.request.body.user_id,
    date: parse(ctx.request.body.date.split('/').reverse().join('/')).getTime(),
    shift: ctx.request.body.shift,
    projectId: ctx.request.body.project_id,
    content: ctx.request.body.content,
  });

  const status = await log.save();

  if (status) {
    ctx.body = {
      success: false,
      message: 'Logging berhasil! Terima kasih ya!',
    };
  }
});

put('/log', async (ctx) => {
  const status = await Log
    .update({ _id: ctx.request.body.log_id }, {
      $set: {
        projectId: ctx.request.body.project_id,
        content: ctx.request.body.content,
      },
    });

  if (status && status.ok === 1) {
    ctx.body = {
      success: true,
      message: 'Log berhasil diubah',
    };
  }
});

del('/log', async (ctx) => {
  const status = await Log
    .findOneAndRemove({ _id: ctx.request.body.log_id })
    .exec();

  if (status) {
    ctx.body = {
      success: true,
      message: 'Log berhasil dihapus',
    };
  }
});

module.exports = app;
