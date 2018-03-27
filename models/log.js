'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const logSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  date: { type: Number, default: 0 },
  shift: { type: Number, default: 0 },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  content: { type: String, default: '' },
});

module.exports = mongoose.model('Log', logSchema);
